// Simple GCS upload smoke test
// Usage: node test-gcs-upload.js
// Reads env vars already loaded by server.js pattern; ensure you run from backend directory

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');

(async () => {
  const bucketName = process.env.GCS_BUCKET_NAME;
  const prefix = (process.env.GCS_FOLDER_PREFIX || '').replace(/\/$/, '');
  if (!bucketName) {
    console.log('[GCS TEST] GCS_BUCKET_NAME not set. Cloud upload disabled.');
    process.exit(0);
  }
  let Storage;
  try {
    Storage = require('@google-cloud/storage').Storage;
  } catch (e) {
    console.error('[GCS TEST] @google-cloud/storage not installed:', e.message);
    process.exit(1);
  }

  // Resolve credentials file path if relative
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  let clientOptions = {};
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    try {
      const json = JSON.parse(Buffer.from(process.env.GCS_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8'));
      clientOptions.credentials = json;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS; // prefer inline creds
    } catch (err) {
      console.warn('[GCS TEST] Failed to parse GCS_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  const storage = new Storage(clientOptions);
  const bucket = storage.bucket(bucketName);

  const testContent = 'Hello GCS test ' + new Date().toISOString();
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const objectPath = `${prefix ? prefix + '/' : ''}smoke-tests/test-${uniqueSuffix}.txt`;
  const file = bucket.file(objectPath);

  try {
    await file.save(Buffer.from(testContent, 'utf8'), {
      resumable: false,
      contentType: 'text/plain',
      metadata: { cacheControl: 'no-cache' }
    });
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
    console.log('[GCS TEST] Upload succeeded');
    console.log('Object Path:', objectPath);
    console.log('Public URL:', publicUrl);
    process.exit(0);
  } catch (err) {
    console.error('[GCS TEST] Upload failed:', err.message);
    if (err.errors) console.error(err.errors);
    process.exit(2);
  }
})();
