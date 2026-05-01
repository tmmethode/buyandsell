const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: ['Job', 'Technology', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Sales', 'Engineering', 'Design', 'Administration', 'Other'],
    default: 'Job'
  },
  salary: {
    type: String,
    required: [true, 'Salary information is required'],
    trim: true
  },
  salaryMin: {
    type: Number,
    min: [0, 'Minimum salary cannot be negative']
  },
  salaryMax: {
    type: Number,
    min: [0, 'Maximum salary cannot be negative']
  },
  salaryCurrency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR'],
    default: 'RWF'
  },
  salaryPeriod: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: ['Entry Level', 'Junior', 'Mid Level', 'Senior', 'Executive', 'Internship'],
    default: 'Entry Level'
  },
  educationLevel: {
    type: String,
    enum: ['High School', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other'],
    default: 'Bachelor'
  },
  requiredSkills: [{
    type: String,
    trim: true,
    required: [true, 'At least one skill is required']
  }],
  preferredSkills: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    logo: String,
    description: String,
    website: String,
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '1-10'
    },
    industry: String
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  startDate: Date,
  isRemote: {
    type: Boolean,
    default: false
  },
  remotePercentage: {
    type: Number,
    min: [0, 'Remote percentage cannot be negative'],
    max: [100, 'Remote percentage cannot exceed 100']
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'On Hold', 'Draft'],
    default: 'Active'
  },
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Shortlisted', 'Interviewed', 'Rejected', 'Hired'],
      default: 'Pending'
    },
    coverLetter: String,
    resume: String
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job poster is required']
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  address: {
    street: String,
    city: String,
    district: String,
    sector: String
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({
  title: 'text',
  description: 'text',
  'company.name': 'text',
  location: 'text',
  category: 'text',
  requiredSkills: 'text'
});

// Virtual for salary range
jobSchema.virtual('salaryRange').get(function() {
  if (this.salaryMin && this.salaryMax) {
    return `${this.salaryMin.toLocaleString()} - ${this.salaryMax.toLocaleString()} ${this.salaryCurrency}`;
  } else if (this.salaryMin) {
    return `${this.salaryMin.toLocaleString()}+ ${this.salaryCurrency}`;
  } else if (this.salaryMax) {
    return `Up to ${this.salaryMax.toLocaleString()} ${this.salaryCurrency}`;
  }
  return this.salary;
});

// Virtual for days until deadline
jobSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
