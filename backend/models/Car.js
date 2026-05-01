const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['Car', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus', 'Other'],
    default: 'Car'
  },
  price: {
    type: String,
    required: [true, 'Price is required'],
    trim: true
  },
  priceNumeric: {
    type: Number,
    required: [true, 'Numeric price is required']
  },
  discountedPrice: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    // Relaxed: not required; frontend may compose or omit
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  mainImage: {
    type: String,
    required: [true, 'Main image is required']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be at least 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  mileage: {
    type: Number,
    min: [0, 'Mileage cannot be negative']
  },
  mileageUnit: {
    type: String,
    enum: ['km', 'miles'],
    default: 'km'
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG', 'Other'],
    default: 'Petrol'
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'],
    default: 'Automatic'
  },
  engineSize: {
    type: Number,
    // Relaxed: not required; validate only when provided
    min: [0.5, 'Engine size must be at least 0.5L']
  },
  engineSizeUnit: {
    type: String,
    enum: ['L', 'cc'],
    default: 'L'
  },
  color: {
    type: String,
    trim: true
  },
  bodyType: {
    type: String,
    // Relaxed: not required; optional field
    enum: ['Sedan', 'Hatchback', 'SUV', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Other']
  },
  doors: {
    type: Number,
    // Relaxed: not required; optional field
    min: [2, 'Must have at least 2 doors'],
    max: [5, 'Cannot have more than 5 doors']
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [2, 'Must have at least 2 seats'],
    max: [12, 'Cannot have more than 12 seats']
  },
  condition: {
    type: String,
    enum: ['New', 'Excellent', 'Good', 'Fair', 'Needs Repair'],
    default: 'Good'
  },
  features: [{
    type: String,
    trim: true
  }],
  safetyFeatures: [{
    type: String,
    trim: true
  }],
  comfortFeatures: [{
    type: String,
    trim: true
  }],
  isImported: {
    type: Boolean,
    default: false
  },
  hasWarranty: {
    type: Boolean,
    default: false
  },
  warrantyExpiry: Date,
  registrationNumber: {
    type: String,
    trim: true
  },
  insurance: {
    type: Boolean,
    default: false
  },
  insuranceExpiry: Date,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required']
  },
  status: {
    type: String,
    enum: ['Available', 'Sold', 'Under Contract', 'Pending'],
    default: 'Available'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  address: {
    street: String,
    city: String,
    province: String,
    district: String,
    sector: String,
    cell: String,
    village: String
  }

  ,
  specifications: {
    performance: {
      power: String, // e.g., '340'
      torque: String, // e.g., '450'
      acceleration: String, // e.g., '5.2s'
      topSpeed: String, // e.g., '250'
      fuelConsumption: String // e.g., '11.8 km/L'
    },
    transmission: {
      drivetrain: String // e.g., 'AWD'
    }
  },
  // YouTube video URL for car video
  youtubeUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for search functionality
carSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  model: 'text',
  location: 'text'
});

// Virtual for price in different currencies
carSchema.virtual('priceUSD').get(function () {
  // Approximate conversion rate (you can update this)
  const rwfToUsd = 0.0008;
  return Math.round(this.priceNumeric * rwfToUsd);
});

// Ensure virtual fields are serialized
carSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Car', carSchema);
