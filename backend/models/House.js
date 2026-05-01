const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Luxury House', 'Middle house', 'Inzu ikodeshwa', 'Commercial Property'],
    default: 'Middle house'
  },
  listingType: {
    type: String,
    enum: ['For Sale', 'For Rent'],
    default: 'For Sale'
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
  province: {
    type: String,
    required: [true, 'Province is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  sector: {
    type: String,
    required: [true, 'Sector is required'],
    trim: true
  },
  cell: {
    type: String,
    trim: true,
    default: ''
  },
  village: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  mainImage: {
    type: String,
    required: [true, 'Main image is required']
  },
  bedrooms: {
    type: Number,
    required: [
      function () { return this.category !== 'Commercial Property'; },
      'Number of bedrooms is required for non-commercial properties'
    ],
    min: [0, 'Bedrooms cannot be negative'],
    default: 0
  },
  bathrooms: {
    type: Number,
    required: [
      function () { return this.category !== 'Commercial Property'; },
      'Number of bathrooms is required for non-commercial properties'
    ],
    min: [0, 'Bathrooms cannot be negative'],
    default: 0
  },
  numberOfDoors: {
    type: Number,
    required: [
      function () { return this.category === 'Commercial Property'; },
      'Number of doors is required for commercial properties'
    ],
    min: [0, 'Number of doors cannot be negative'],
    default: 0
  },
  area: {
    type: Number,
    min: [0, 'Area cannot be negative'],
    default: null
  },
  areaUnit: {
    type: String,
    enum: ['sqm', 'sqft', 'acres'],
    default: 'sqm'
  },
  propertyType: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['New', 'Excellent', 'Good', 'Fair', 'Needs Renovation'],
    default: 'Good'
  },
  amenities: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    trim: true
  }],
  // Road access type (mapped from UI: tarmac/murram)
  roadType: {
    type: String,
    enum: ['Paved', 'Gravel', 'Dirt', 'None'],
    default: 'Paved'
  },
  parking: {
    type: Boolean,
    default: false
  },
  parkingSpaces: {
    type: Number,
    default: 0
  },
  furnished: {
    type: Boolean,
    default: false
  },
  petFriendly: {
    type: Boolean,
    default: false
  },
  security: {
    type: Boolean,
    default: false
  },
  waterSupply: {
    type: Boolean,
    default: true
  },
  electricity: {
    type: Boolean,
    default: true
  },
  internet: {
    type: Boolean,
    default: false
  },
  // Construction years
  yearBuilt: {
    type: Number,
    min: [1800, 'Year built seems too old'],
    max: [new Date().getFullYear() + 1, 'Year built cannot be in the far future']
  },
  yearRenovated: {
    type: Number,
    min: [1800, 'Year renovated seems too old'],
    max: [new Date().getFullYear() + 1, 'Year renovated cannot be in the far future']
  },
  // Nearby amenities like schools, markets, hospitals, bus stops
  nearbyAmenities: [{
    type: String,
    trim: true
  }],
  // Drainage & sewage system
  sewageSystem: {
    type: String,
    enum: ['Municipal', 'Septic', 'Soak Pit', 'None', 'Other'],
    default: 'Municipal'
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
    enum: ['Available', 'Sold', 'Rented', 'Under Contract', 'Pending'],
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
  // YouTube video URL for property tour
  youtubeUrl: {
    type: String,
    trim: true
  },
  // Rating and Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
});

// Index for search functionality
houseSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  category: 'text'
});

// Virtual for price in different currencies
houseSchema.virtual('priceUSD').get(function () {
  // Approximate conversion rate (you can update this)
  const rwfToUsd = 0.0008;
  return Math.round(this.priceNumeric * rwfToUsd);
});

// Ensure virtual fields are serialized
houseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('House', houseSchema);
