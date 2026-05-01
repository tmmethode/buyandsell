const express = require('express');
const Job = require('../models/Job');
const { protect, optionalAuth, checkOwnership } = require('../middleware/auth');
const { uploadConfigs, handleUploadError, deleteFile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      jobType,
      experienceLevel,
      educationLevel,
      minSalary,
      maxSalary,
      isRemote,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Active' };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (educationLevel) filter.educationLevel = educationLevel;
    if (minSalary || maxSalary) {
      filter.$or = [];
      if (minSalary) filter.$or.push({ salaryMin: { $gte: parseInt(minSalary) } });
      if (maxSalary) filter.$or.push({ salaryMax: { $lte: parseInt(maxSalary) } });
    }
    if (isRemote !== undefined) filter.isRemote = isRemote === 'true';

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const jobs = await Job.find(filter)
      .populate('postedBy', 'firstName lastName email phone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    // Add favorite status for authenticated users
    if (req.user) {
      jobs.forEach(job => {
        job.isFavorite = job.favorites.includes(req.user._id);
        job.hasApplied = job.applications.some(app => app.applicant.toString() === req.user._id.toString());
      });
    }

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error getting jobs' });
  }
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const jobs = await Job.find({ 
      isFeatured: true, 
      status: 'Active' 
    })
    .populate('postedBy', 'firstName lastName email phone profileImage')
    .limit(6);

    res.json(jobs);
  } catch (error) {
    console.error('Get featured jobs error:', error);
    res.status(500).json({ message: 'Server error getting featured jobs' });
  }
});

// @desc    Get urgent jobs
// @route   GET /api/jobs/urgent
// @access  Public
router.get('/urgent', async (req, res) => {
  try {
    const jobs = await Job.find({ 
      isUrgent: true, 
      status: 'Active' 
    })
    .populate('postedBy', 'firstName lastName email phone profileImage')
    .limit(10);

    res.json(jobs);
  } catch (error) {
    console.error('Get urgent jobs error:', error);
    res.status(500).json({ message: 'Server error getting urgent jobs' });
  }
});

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName email phone profileImage')
      .populate('favorites', 'firstName lastName')
      .populate('applications.applicant', 'firstName lastName email phone profileImage');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    // Add favorite status and application status for authenticated users
    if (req.user) {
      job.isFavorite = job.favorites.includes(req.user._id);
      job.hasApplied = job.applications.some(app => app.applicant._id.toString() === req.user._id.toString());
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error getting job' });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
router.post('/', protect, uploadConfigs.profileAndLogo, handleUploadError, async (req, res) => {
  try {
    const jobData = req.body;

    // Handle company logo upload
    if (req.files && req.files.companyLogo) {
      const lf = req.files.companyLogo[0];
      jobData.company = {
        ...jobData.company,
        logo: lf.cloudUrl || `/uploads/logos/${lf.filename}`
      };
    }

    // Extract salary information
    if (jobData.salary) {
      const salaryMatch = jobData.salary.match(/[\d,]+/g);
      if (salaryMatch && salaryMatch.length > 0) {
        if (salaryMatch.length === 1) {
          jobData.salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
        } else if (salaryMatch.length >= 2) {
          jobData.salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
          jobData.salaryMax = parseInt(salaryMatch[1].replace(/,/g, ''));
        }
      }
    }

    // Create job
    const job = await Job.create({
      ...jobData,
      postedBy: req.user._id
    });

    const populatedJob = await job.populate('postedBy', 'firstName lastName email phone profileImage');

    res.status(201).json(populatedJob);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error creating job' });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
router.put('/:id', protect, checkOwnership('Job'), uploadConfigs.profileAndLogo, handleUploadError, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updateData = { ...req.body };

    // Handle company logo upload
    if (req.files && req.files.companyLogo) {
      const lf = req.files.companyLogo[0];
      updateData.company = {
        ...updateData.company,
        logo: lf.cloudUrl || `/uploads/logos/${lf.filename}`
      };
    }

    // Extract salary information if salary is updated
    if (updateData.salary) {
      const salaryMatch = updateData.salary.match(/[\d,]+/g);
      if (salaryMatch && salaryMatch.length > 0) {
        if (salaryMatch.length === 1) {
          updateData.salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
        } else if (salaryMatch.length >= 2) {
          updateData.salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
          updateData.salaryMax = parseInt(salaryMatch[1].replace(/,/g, ''));
        }
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('postedBy', 'firstName lastName email phone profileImage');

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error updating job' });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
router.delete('/:id', protect, checkOwnership('Job'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete associated company logo
    if (job.company && job.company.logo) {
      await deleteFile(job.company.logo);
    }

    await job.deleteOne();

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private
router.post('/:id/apply', protect, uploadConfigs.resume, handleUploadError, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job is active
    if (job.status !== 'Active') {
      return res.status(400).json({ message: 'This job is not accepting applications' });
    }

    // Check if user has already applied
    const hasApplied = job.applications.some(app => app.applicant.toString() === req.user._id.toString());
    if (hasApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Handle resume upload
    let resumePath = '';
    if (req.file) {
      resumePath = req.file.cloudUrl || `/uploads/resumes/${req.file.filename}`;
    }

    // Add application
    job.applications.push({
      applicant: req.user._id,
      coverLetter: req.body.coverLetter || '',
      resume: resumePath
    });

    await job.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error applying for job' });
  }
});

// @desc    Update application status (for job poster)
// @route   PUT /api/jobs/:id/applications/:applicationId
// @access  Private
router.put('/:id/applications/:applicationId', protect, checkOwnership('Job'), async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await job.save();

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error updating application status' });
  }
});

// @desc    Toggle favorite status
// @route   POST /api/jobs/:id/favorite
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isFavorite = job.favorites.includes(req.user._id);
    
    if (isFavorite) {
      job.favorites = job.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      job.favorites.push(req.user._id);
    }

    await job.save();

    res.json({ 
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
});

// @desc    Get user's posted jobs
// @route   GET /api/jobs/my-jobs
// @access  Private
router.get('/my-jobs', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate('postedBy', 'firstName lastName email phone profileImage')
      .populate('applications.applicant', 'firstName lastName email phone profileImage');

    res.json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error getting your jobs' });
  }
});

// @desc    Get user's favorite jobs
// @route   GET /api/jobs/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ favorites: req.user._id })
      .populate('postedBy', 'firstName lastName email phone profileImage');

    res.json(jobs);
  } catch (error) {
    console.error('Get favorite jobs error:', error);
    res.status(500).json({ message: 'Server error getting favorite jobs' });
  }
});

// @desc    Get user's applications
// @route   GET /api/jobs/my-applications
// @access  Private
router.get('/my-applications', protect, async (req, res) => {
  try {
    const jobs = await Job.find({
      'applications.applicant': req.user._id
    })
    .populate('postedBy', 'firstName lastName email phone profileImage');

    // Filter to only show user's applications
    const applications = jobs.map(job => {
      const userApplication = job.applications.find(app => 
        app.applicant.toString() === req.user._id.toString()
      );
      return {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          postedBy: job.postedBy
        },
        application: userApplication
      };
    });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error getting your applications' });
  }
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgSalary: { $avg: '$salaryMin' },
          remoteJobs: { $sum: { $cond: ['$isRemote', 1, 0] } },
          urgentJobs: { $sum: { $cond: ['$isUrgent', 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Job.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const locationStats = await Job.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      general: stats[0] || {},
      categories: categoryStats,
      topLocations: locationStats
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ message: 'Server error getting job statistics' });
  }
});

module.exports = router;
