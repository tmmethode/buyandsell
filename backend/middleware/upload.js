const multer = require('multer');
const path = require('path');
const fs = require('fs');
let Storage, gcsClient, gcsBucket;

// Lazy load @google-cloud/storage to avoid requiring it when not configured
try {
  Storage = require('@google-cloud/storage').Storage;
} catch (e) {
  // optional dependency until configured
}

// Ensure local uploads directory exists (kept for backward compatibility and when GCS is not configured)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// GCS setup helpers
const isCloudEnabled = () => {
  return !!process.env.GCS_BUCKET_NAME;
};

const initGCS = () => {
  if (!isCloudEnabled() || gcsClient) return;

  // Support credentials via GOOGLE_APPLICATION_CREDENTIALS (file path) or GCS_SERVICE_ACCOUNT_JSON (base64 JSON)
  let clientOptions = {};
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    try {
      const json = JSON.parse(Buffer.from(process.env.GCS_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8'));
      clientOptions.credentials = json;
    } catch (err) {
      console.error('Failed to parse GCS_SERVICE_ACCOUNT_JSON:', err?.message);
    }
  }

  gcsClient = new Storage(clientOptions);
  gcsBucket = gcsClient.bucket(process.env.GCS_BUCKET_NAME);
};

// Resolve upload folder by field/route context
const resolveFolder = (req, file) => {
  let folder = 'misc';
  if (file.fieldname === 'houseImages' || (file.fieldname === 'mainImage' && ((req.baseUrl||'').includes('/houses') || (req.originalUrl||'').includes('/houses')))) {
    folder = 'houses';
  } else if (file.fieldname === 'carImages' || (file.fieldname === 'mainImage' && ((req.baseUrl||'').includes('/cars') || (req.originalUrl||'').includes('/cars')))) {
    folder = 'cars';
  } else if (file.fieldname === 'plotImages' || (file.fieldname === 'mainImage' && ((req.baseUrl||'').includes('/plots') || (req.originalUrl||'').includes('/plots')))) {
    folder = 'plots';
  } else if (file.fieldname === 'profileImage') {
    folder = 'profiles';
  } else if (file.fieldname === 'companyLogo') {
    folder = 'logos';
  } else if (file.fieldname === 'resume') {
    folder = 'resumes';
  }

  const prefix = process.env.GCS_FOLDER_PREFIX ? String(process.env.GCS_FOLDER_PREFIX).replace(/\/$/, '') + '/' : '';
  return prefix + folder;
};

// Upload a single file buffer to GCS
const uploadBufferToGCS = async (req, file) => {
  initGCS();
  if (!gcsBucket) throw new Error('GCS bucket is not configured');

  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const objectPath = `${resolveFolder(req, file)}/${name}-${uniqueSuffix}${ext}`;

  const gcsFile = gcsBucket.file(objectPath);
  await gcsFile.save(file.buffer, {
    contentType: file.mimetype,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000'
    }
  });

  // Return public URL
  const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${objectPath}`;
  return { publicUrl, objectPath };
};

// Configure multer storage to memory; we'll push to GCS (or fallback to local)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/gif': true,
    'application/pdf': true, // For resumes
    'application/msword': true, // For .doc files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true // For .docx files
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX) are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Middleware to upload parsed files to GCS or fallback to local disk
const pushToStorage = async (req, res, next) => {
  try {
    if (!req.files && !req.file) return next();

    // Normalize to array of files with their key
    const buckets = [];
    if (req.file) buckets.push({ key: req.file.fieldname || 'file', files: [req.file] });
    if (req.files) {
      if (Array.isArray(req.files)) {
        buckets.push({ key: req.files[0]?.fieldname || 'files', files: req.files });
      } else {
        Object.keys(req.files).forEach(k => buckets.push({ key: k, files: req.files[k] }));
      }
    }

    const cloud = isCloudEnabled() && Storage;
    for (const bucket of buckets) {
      for (const f of bucket.files) {
        if (cloud) {
          try {
            // Attempt cloud upload
            const { publicUrl, objectPath } = await uploadBufferToGCS(req, f);
            f.cloudUrl = publicUrl;
            f.cloudObject = objectPath;
            continue; // done with this file
          } catch (cloudErr) {
            console.error('Cloud upload failed, falling back to local storage:', cloudErr.message);
            // Intentionally fall through to local write
          }
        }
        // Local fallback (either cloud disabled or cloud upload failed)
        const folder = resolveFolder(req, f).split('/').pop();
        const ext = path.extname(f.originalname);
        const base = path.basename(f.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${base}-${uniqueSuffix}${ext}`;
        const targetDir = path.join(uploadsDir, folder);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, filename);
        fs.writeFileSync(targetPath, f.buffer);
        f.filename = filename;
        f.localPath = targetPath;
      }
    }

    next();
  } catch (err) {
    console.error('Storage upload error:', err);
    next(err);
  }
};

// Specific upload configurations
const uploadConfigs = {
  // Single image upload (e.g., profile picture)
  single: (fieldName) => [upload.single(fieldName), pushToStorage],
  
  // Multiple images for houses
  houseImages: [upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'houseImages', maxCount: 9 }
  ]), pushToStorage],
  
  // Multiple images for cars
  carImages: [upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'carImages', maxCount: 9 }
  ]), pushToStorage],
  
  // Multiple images for plots
  plotImages: [upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'plotImages', maxCount: 9 }
  ]), pushToStorage],
  
  // Profile image and company logo
  profileAndLogo: [upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 }
  ]), pushToStorage],
  
  // Resume upload
  resume: [upload.single('resume'), pushToStorage]
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum file size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field in file upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: error.message
    });
  }
  
  next(error);
};

// Helper function to get local file URLs (legacy)
const getFileUrl = (filename, type = 'misc') => {
  if (!filename) return null;
  return `/uploads/${type}/${filename}`;
};

// Helper function to delete files (supports local path or GCS URL)
const deleteFile = async (storedPath) => {
  try {
    if (!storedPath) return false;
    // If looks like a URL, attempt GCS deletion
    if (/^https?:\/\//i.test(storedPath) && isCloudEnabled()) {
      initGCS();
      const bucketName = process.env.GCS_BUCKET_NAME;
      const m = storedPath.match(new RegExp(`https?://storage.googleapis.com/${bucketName}/(.+)`));
      const objectName = m ? m[1] : null;
      if (objectName && gcsBucket) {
        await gcsBucket.file(objectName).delete({ ignoreNotFound: true });
        return true;
      }
      return false;
    }

    // Otherwise treat as local path or relative '/uploads/...'
    let target = storedPath;
    if (storedPath.startsWith('/')) {
      target = path.join(__dirname, '..', storedPath);
    }
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadConfigs,
  handleUploadError,
  getFileUrl,
  deleteFile
};
