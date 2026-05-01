const express = require('express');
const House = require('../models/House');
const mongoose = require('mongoose');
const { protect, optionalAuth, checkOwnership } = require('../middleware/auth');
const { uploadConfigs, handleUploadError, deleteFile } = require('../middleware/upload');
const path = require('path'); // Added missing import for path

const router = express.Router();

// @desc    Get all houses with filtering and pagination
// @route   GET /api/houses
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      listingType,
      location,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      propertyType,
      condition,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Available' };

    if (category) filter.category = category;
    if (listingType) filter.listingType = listingType;
    if (location) filter.district = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.priceNumeric = {};
      if (minPrice) filter.priceNumeric.$gte = parseInt(minPrice);
      if (maxPrice) filter.priceNumeric.$lte = parseInt(maxPrice);
    }
    if (minBedrooms || maxBedrooms) {
      filter.bedrooms = {};
      if (minBedrooms) filter.bedrooms.$gte = parseInt(minBedrooms);
      if (maxBedrooms) filter.bedrooms.$lte = parseInt(maxBedrooms);
    }
    if (minBathrooms || maxBathrooms) {
      filter.bathrooms = {};
      if (minBathrooms) filter.bathrooms.$gte = parseInt(minBathrooms);
      if (maxBathrooms) filter.bathrooms.$lte = parseInt(maxBathrooms);
    }
    if (propertyType) filter.propertyType = propertyType;
    if (condition) filter.condition = condition;

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
    const houses = await House.find(filter)
      .populate('owner', 'firstName lastName email phone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await House.countDocuments(filter);

    // Add favorite status for authenticated users
    if (req.user) {
      houses.forEach(house => {
        house.isFavorite = house.favorites.includes(req.user._id);
      });
    }

    res.json({
      houses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get houses error:', error);
    res.status(500).json({ message: 'Server error getting houses' });
  }
});

// @desc    Get featured houses
// @route   GET /api/houses/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const houses = await House.find({
      isFeatured: true,
      status: 'Available'
    })
      .populate('owner', 'firstName lastName email phone profileImage')
      .limit(6);

    res.json(houses);
  } catch (error) {
    console.error('Get featured houses error:', error);
    res.status(500).json({ message: 'Server error getting featured houses' });
  }
});

// @desc    Get user's houses
// @route   GET /api/houses/my-houses
// @access  Private
router.get('/my-houses', protect, async (req, res) => {
  try {
    const houses = await House.find({ owner: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(houses);
  } catch (error) {
    console.error('Get my houses error:', error);
    res.status(500).json({ message: 'Server error getting your houses' });
  }
});

// @desc    Get user's favorite houses
// @route   GET /api/houses/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const houses = await House.find({ favorites: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(houses);
  } catch (error) {
    console.error('Get favorite houses error:', error);
    res.status(500).json({ message: 'Server error getting favorite houses' });
  }
});

// @desc    Get unique districts from houses
// @route   GET /api/houses/districts
// @access  Public
router.get('/districts', async (req, res) => {
  try {
    const districts = await House.distinct('district', { status: 'Available' });
    // Filter out null/undefined/empty values and sort alphabetically
    const validDistricts = districts.filter(d => d && d.trim()).sort();
    res.json(validDistricts);
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ message: 'Server error getting districts' });
  }
});

// @desc    Get single house by ID
// @route   GET /api/houses/:id
// @access  Public
router.get('/:id([0-9a-fA-F]{24})', optionalAuth, async (req, res) => {
  try {
    // Validate ObjectId to avoid CastError if route matching ever misorders
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid house id' });
    }
    const house = await House.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone profileImage')
      .populate('favorites', 'firstName lastName');

    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Increment view count using an atomic update to avoid triggering
    // full-document validation (some legacy documents may miss required fields)
    try {
      await House.findByIdAndUpdate(house._id, { $inc: { views: 1 } }, { new: true });
    } catch (incErr) {
      console.error('Increment house views error:', incErr);
    }

    // Add favorite status for authenticated users
    if (req.user) {
      house.isFavorite = house.favorites.includes(req.user._id);
    }

    res.json(house);
  } catch (error) {
    console.error('Get house error:', error);
    res.status(500).json({ message: 'Server error getting house' });
  }
});

// @desc    Create new house
// @route   POST /api/houses
// @access  Private
router.post('/', protect, uploadConfigs.houseImages, handleUploadError, async (req, res) => {
  try {
    const houseData = { ...req.body };

    // Ensure utilities fields in specifications are booleans
    if (houseData.specifications && houseData.specifications.utilities) {
      ["water", "electricity", "internet"].forEach(key => {
        if (houseData.specifications.utilities[key] !== undefined) {
          houseData.specifications.utilities[key] = (houseData.specifications.utilities[key] === true || houseData.specifications.utilities[key] === 'true' || houseData.specifications.utilities[key] === 1 || houseData.specifications.utilities[key] === '1');
        }
      });
    }

    // Parse specifications if sent as JSON string
    if (houseData.specifications && typeof houseData.specifications === 'string') {
      try {
        houseData.specifications = JSON.parse(houseData.specifications);
      } catch (err) {
        console.error('Failed to parse specifications JSON:', err);
      }
    }

    // Handle image uploads (prefer cloudUrl if present)
    const images = [];
    if (req.files && req.files.houseImages) {
      req.files.houseImages.forEach(file => {
        images.push(file.cloudUrl || `/uploads/houses/${file.filename}`);
      });
    }

    // Set main image
    let mainImage = '';
    if (req.files && req.files.mainImage) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/houses/${mf.filename}`;
    } else if (images.length > 0) {
      mainImage = images[0];
    }

    // Extract numeric price
    const priceMatch = houseData.price.match(/[\d,]+/);
    const priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Ensure boolean fields are parsed correctly
    ["parking", "furnished", "petFriendly", "security", "waterSupply", "electricity", "internet"].forEach(key => {
      if (houseData[key] !== undefined) {
        houseData[key] = (houseData[key] === true || houseData[key] === 'true' || houseData[key] === 1 || houseData[key] === '1');
      }
    });
    // Create house
    // Enforce role-based defaults
    if (req.user.role !== 'admin') {
      houseData.status = 'Pending';
    }

    const house = await House.create({
      ...houseData,
      owner: req.user._id,
      images,
      mainImage,
      priceNumeric,
      contactPhone: req.user.phone,
      contactEmail: req.user.email,
      specifications: houseData.specifications || {}
    });

    const populatedHouse = await house.populate('owner', 'firstName lastName email phone profileImage');

    res.status(201).json(populatedHouse);
  } catch (error) {
    console.error('Create house error:', error);
    res.status(500).json({ message: 'Server error creating house' });
  }
});

// @desc    Update house
// @route   PUT /api/houses/:id
// @access  Private
router.put('/:id([0-9a-fA-F]{24})', protect, checkOwnership('House'), uploadConfigs.houseImages, handleUploadError, async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Non-admin users can only edit when status is Pending
    if (req.user.role !== 'admin' && house.status !== 'Pending') {
      return res.status(403).json({ message: 'You can only edit a house while its status is Pending' });
    }

    const updateData = { ...req.body };

    // Prevent non-admins from changing status (force Pending)
    if (req.user.role !== 'admin') {
      updateData.status = 'Pending';
    }

    // Ensure boolean fields are parsed correctly
    ["parking", "furnished", "petFriendly", "security", "waterSupply", "electricity", "internet"].forEach(key => {
      if (updateData[key] !== undefined) {
        updateData[key] = (updateData[key] === true || updateData[key] === 'true' || updateData[key] === 1 || updateData[key] === '1');
      }
    });

    // Ensure utilities fields in specifications are booleans
    if (updateData.specifications && updateData.specifications.utilities) {
      ["water", "electricity", "internet"].forEach(key => {
        if (updateData.specifications.utilities[key] !== undefined) {
          updateData.specifications.utilities[key] = (updateData.specifications.utilities[key] === true || updateData.specifications.utilities[key] === 'true' || updateData.specifications.utilities[key] === 1 || updateData.specifications.utilities[key] === '1');
        }
      });
    }

    // Parse specifications if sent as JSON string
    if (updateData.specifications && typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (err) {
        console.error('Failed to parse specifications JSON:', err);
      }
    }

    // Handle image uploads
    let mergedImages = [];
    // If frontend sends existing images, use them
    if (req.body.existingImages) {
      // If only one image, multer/express may send as string, not array
      if (Array.isArray(req.body.existingImages)) {
        mergedImages = req.body.existingImages;
      } else if (typeof req.body.existingImages === 'string') {
        // If comma-separated string, split it
        if (req.body.existingImages.includes(',')) {
          mergedImages = req.body.existingImages.split(',').map(img => img.trim());
        } else {
          mergedImages = [req.body.existingImages];
        }
      } else {
        mergedImages = [];
      }
    } else if (house.images) {
      mergedImages = [...house.images];
    }

    if (req.files) {
      if (req.files.mainImage) {
        const mf = req.files.mainImage[0];
        updateData.mainImage = mf.cloudUrl || `/uploads/houses/${mf.filename}`;
      }
      if (req.files.houseImages) {
        const newImages = req.files.houseImages.map(file => file.cloudUrl || `/uploads/houses/${file.filename}`);
        mergedImages = [...mergedImages, ...newImages];
      }
    }
    updateData.images = mergedImages;

    // Extract numeric price if price is updated
    if (updateData.price) {
      const priceMatch = updateData.price.match(/[\d,]+/);
      updateData.priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    }

    // Ensure specifications is set explicitly
    if (!updateData.specifications) {
      updateData.specifications = {};
    }
    const updatedHouse = await House.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email phone profileImage');

    res.json(updatedHouse);
  } catch (error) {
    console.error('Update house error:', error);
    res.status(500).json({ message: 'Server error updating house' });
  }
});

// @desc    Delete house
// @route   DELETE /api/houses/:id
// @access  Private
router.delete('/:id([0-9a-fA-F]{24})', protect, checkOwnership('House'), async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Non-admin users can only delete while Pending
    if (req.user.role !== 'admin' && house.status !== 'Pending') {
      return res.status(403).json({ message: 'You can only delete a house while its status is Pending' });
    }

    // Delete associated images
    const allImages = [house.mainImage, ...house.images];
    for (const imagePath of allImages) {
      if (imagePath) {
        await deleteFile(imagePath);
      }
    }

    await house.deleteOne();

    res.json({ message: 'House deleted successfully' });
  } catch (error) {
    console.error('Delete house error:', error);
    res.status(500).json({ message: 'Server error deleting house' });
  }
});

// @desc    Toggle favorite status
// @route   POST /api/houses/:id/favorite
// @access  Private
router.post('/:id([0-9a-fA-F]{24})/favorite', protect, async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    const isFavorite = house.favorites.includes(req.user._id);

    if (isFavorite) {
      house.favorites = house.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      house.favorites.push(req.user._id);
    }

    await house.save();

    res.json({
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
});

// @desc    Get user's houses
// @route   GET /api/houses/my-houses
// @access  Private
// (moved above :id)

// @desc    Add a review to a house
// @route   POST /api/houses/:id/review
// @access  Private
router.post('/:id([0-9a-fA-F]{24})/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }

    // Check if user already reviewed
    const existingReview = house.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment || '';
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      house.reviews.push({
        user: req.user._id,
        rating,
        comment: comment || ''
      });
    }

    // Calculate new average rating
    const totalRating = house.reviews.reduce((sum, review) => sum + review.rating, 0);
    house.rating = Math.round((totalRating / house.reviews.length) * 10) / 10;
    house.ratingCount = house.reviews.length;

    await house.save();

    // Populate user info for the response
    await house.populate('reviews.user', 'firstName lastName profileImage');

    res.json({
      message: existingReview ? 'Review updated' : 'Review added',
      rating: house.rating,
      ratingCount: house.ratingCount,
      reviews: house.reviews
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
});

module.exports = router;
