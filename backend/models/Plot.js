const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
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
    enum: ['Ibibanza', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Land', 'Other'],
    default: 'Ibibanza'
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
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [1, 'Area must be at least 1 sqm']
  },
  areaUnit: {
    type: String,
    enum: ['sqm', 'acres', 'hectares', 'sqft'],
    default: 'sqm'
  },
  length: {
    type: Number,
    min: [1, 'Length must be at least 1 meter']
  },
  width: {
    type: Number,
    min: [1, 'Width must be at least 1 meter']
  },
  shape: {
    type: String,
    enum: ['Rectangular', 'Square', 'Irregular', 'L-Shaped', 'Other'],
    default: 'Rectangular'
  },
  terrain: {
    type: String,
    enum: ['Flat', 'Slightly Sloped', 'Hilly', 'Mountainous', 'Other'],
    default: 'Flat'
  },
  soilType: {
    type: String,
    enum: ['Clay', 'Sandy', 'Loamy', 'Rocky', 'Mixed', 'Other'],
    default: 'Mixed'
  },
  zoning: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use', 'Other']
  },
  landUse: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Recreational', 'Mixed', 'Other'],
    required: [true, 'Land use is required']
  },
  accessRoad: {
    type: Boolean,
    default: false
  },
  roadWidth: {
    type: Number,
    min: [0, 'Road width cannot be negative']
  },
  roadType: {
    type: String,
    enum: ['Paved', 'Gravel', 'Dirt', 'None'],
    required: [true, 'Road access type is required'],
    default: 'Paved'
  },
  utilities: {
    water: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },
    sewage: { type: Boolean, default: false },
    internet: { type: Boolean, default: false },
    gas: { type: Boolean, default: false }
  },
  nearbyFacilities: [{
    type: String,
    trim: true
  }],
  restrictions: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: String,
    type: String,
    url: String
  }],
  surveyNumber: {
    type: String,
    trim: true
  },
  titleDeed: {
    type: Boolean,
    default: false
  },
  titleDeedNumber: {
    type: String,
    trim: true
  },
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
    enum: ['Available', 'Sold', 'Under Contract', 'Pending', 'Reserved'],
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
    district: String,
    sector: String,
    cell: String,
    village: String
  },
  pricePerSqm: {
    type: Number,
    min: [0, 'Price per sqm cannot be negative']
  },
  // YouTube video URL for property tour
  youtubeUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for search functionality
plotSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  category: 'text',
  zoning: 'text'
});

// Virtual for price in different currencies
plotSchema.virtual('priceUSD').get(function () {
  // Approximate conversion rate (you can update this)
  const rwfToUsd = 0.0008;
  return Math.round(this.priceNumeric * rwfToUsd);
});

// Calculate price per sqm
plotSchema.pre('save', function (next) {
  if (this.area && this.priceNumeric) {
    this.pricePerSqm = this.priceNumeric / this.area;
  }
  next();
});

// Ensure virtual fields are serialized
plotSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Plot', plotSchema);
