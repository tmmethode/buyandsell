const express = require('express');
const Car = require('../models/Car');
const { protect, optionalAuth, checkOwnership } = require('../middleware/auth');
const { uploadConfigs, handleUploadError, deleteFile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @desc    Get all cars with filtering and pagination
// @route   GET /api/cars
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      model,
      location,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      fuelType,
      transmission,
      bodyType,
      condition,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Available' };

    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (model) filter.model = { $regex: model, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.priceNumeric = {};
      if (minPrice) filter.priceNumeric.$gte = parseInt(minPrice);
      if (maxPrice) filter.priceNumeric.$lte = parseInt(maxPrice);
    }
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = parseInt(minYear);
      if (maxYear) filter.year.$lte = parseInt(maxYear);
    }
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
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
    const cars = await Car.find(filter)
      .populate('owner', 'firstName lastName email phone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Car.countDocuments(filter);

    // Add favorite status for authenticated users
    if (req.user) {
      cars.forEach(car => {
        car.isFavorite = car.favorites.includes(req.user._id);
      });
    }

    res.json({
      cars,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: 'Server error getting cars' });
  }
});

// @desc    Get featured cars
// @route   GET /api/cars/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const cars = await Car.find({
      isFeatured: true,
      status: 'Available'
    })
      .populate('owner', 'firstName lastName email phone profileImage')
      .limit(6);

    res.json(cars);
  } catch (error) {
    console.error('Get featured cars error:', error);
    res.status(500).json({ message: 'Server error getting featured cars' });
  }
});

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
// Place specific subroutes BEFORE the dynamic :id route to avoid conflicts
// @desc    Get car brands
// @route   GET /api/cars/brands
// @access  Public
router.get('/brands', async (req, res) => {
  try {
    const brands = await Car.distinct('brand');
    res.json(brands.sort());
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'Server error getting brands' });
  }
});

// @desc    Get car models by brand
// @route   GET /api/cars/brands/:brand/models
// @access  Public
router.get('/brands/:brand/models', async (req, res) => {
  try {
    const models = await Car.distinct('model', { brand: req.params.brand });
    res.json(models.sort());
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ message: 'Server error getting models' });
  }
});

// @desc    Get user's cars
// @route   GET /api/cars/my-cars
// @access  Private
router.get('/my-cars', protect, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(cars);
  } catch (error) {
    console.error('Get my cars error:', error);
    res.status(500).json({ message: 'Server error getting your cars' });
  }
});

// @desc    Get user's favorite cars
// @route   GET /api/cars/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const cars = await Car.find({ favorites: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(cars);
  } catch (error) {
    console.error('Get favorite cars error:', error);
    res.status(500).json({ message: 'Server error getting favorite cars' });
  }
});

// @desc    Get single car by ID
// @route   GET /api/cars/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone profileImage')
      .populate('favorites', 'firstName lastName');

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Increment view count without triggering full validation
    await Car.updateOne({ _id: car._id }, { $inc: { views: 1 } });
    car.views += 1;

    // Add favorite status for authenticated users
    if (req.user) {
      car.isFavorite = car.favorites.includes(req.user._id);
    }

    res.json(car);
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ message: 'Server error getting car' });
  }
});

// @desc    Create new car
// @route   POST /api/cars
// @access  Private
router.post('/', protect, uploadConfigs.carImages, handleUploadError, async (req, res) => {
  try {
    let carData = req.body;

    // If address was sent as a JSON string in multipart/form-data, parse it
    if (carData && carData.address && typeof carData.address === 'string') {
      try {
        carData.address = JSON.parse(carData.address);
      } catch (err) {
        // fallback: assemble address from bracketed fields like address[city]
        const addr = {};
        Object.keys(req.body).forEach(key => {
          const m = key.match(/^address\[(.+)\]$/);
          if (m) addr[m[1]] = req.body[key];
        });
        if (Object.keys(addr).length > 0) carData.address = addr;
      }
    }

    // If specifications was sent as a JSON string in multipart/form-data, parse it
    if (carData && carData.specifications && typeof carData.specifications === 'string') {
      try {
        carData.specifications = JSON.parse(carData.specifications);
      } catch (err) {
        // fallback: assemble specs from bracketed fields like specifications[performance][power]
        const specs = {};
        Object.keys(req.body).forEach(key => {
          const m = key.match(/^specifications\[(.+)\]$/);
          if (m) specs[m[1]] = req.body[key];
        });
        if (Object.keys(specs).length > 0) carData.specifications = specs;
      }
    }

    // Handle image uploads
    const images = [];
    if (req.files && req.files.carImages) {
      req.files.carImages.forEach(file => {
        images.push(file.cloudUrl || `/uploads/cars/${file.filename}`);
      });
    }

    // Set main image
    let mainImage = '';
    if (req.files && req.files.mainImage) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/cars/${mf.filename}`;
    } else if (images.length > 0) {
      mainImage = images[0];
    }

    // Extract numeric price
    const priceMatch = carData.price.match(/[\d,]+/);
    const priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Create car
    const car = await Car.create({
      ...carData,
      owner: req.user._id,
      images,
      mainImage,
      priceNumeric,
      contactPhone: req.user.phone,
      contactEmail: req.user.email
    });

    const populatedCar = await car.populate('owner', 'firstName lastName email phone profileImage');

    res.status(201).json(populatedCar);
  } catch (error) {
    console.error('Create car error:', error);
    res.status(500).json({ message: 'Server error creating car' });
  }
});

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private
router.put('/:id', protect, checkOwnership('Car'), uploadConfigs.carImages, handleUploadError, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const updateData = { ...req.body };

    // If address was sent as a JSON string in multipart/form-data, parse it
    if (updateData && updateData.address && typeof updateData.address === 'string') {
      try {
        updateData.address = JSON.parse(updateData.address);
      } catch (err) {
        const addr = {};
        Object.keys(req.body).forEach(key => {
          const m = key.match(/^address\[(.+)\]$/);
          if (m) addr[m[1]] = req.body[key];
        });
        if (Object.keys(addr).length > 0) updateData.address = addr;
      }
    }

    // If specifications was sent as a JSON string in multipart/form-data, parse it
    if (updateData && updateData.specifications && typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (err) {
        const specs = {};
        Object.keys(req.body).forEach(key => {
          const m = key.match(/^specifications\[(.+)\]$/);
          if (m) specs[m[1]] = req.body[key];
        });
        if (Object.keys(specs).length > 0) updateData.specifications = specs;
      }
    }

    // Handle image uploads
    if (req.files) {
      if (req.files.mainImage) {
        const mf = req.files.mainImage[0];
        updateData.mainImage = mf.cloudUrl || `/uploads/cars/${mf.filename}`;
      }

      if (req.files.carImages) {
        const newImages = req.files.carImages.map(file => file.cloudUrl || `/uploads/cars/${file.filename}`);
        updateData.images = [...car.images, ...newImages];
      }
    }

    // Extract numeric price if price is updated
    if (updateData.price) {
      const priceMatch = updateData.price.match(/[\d,]+/);
      updateData.priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email phone profileImage');

    res.json(updatedCar);
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ message: 'Server error updating car' });
  }
});

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private
router.delete('/:id', protect, checkOwnership('Car'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Delete associated images
    const allImages = [car.mainImage, ...car.images];
    for (const imagePath of allImages) {
      if (imagePath) {
        await deleteFile(imagePath);
      }
    }

    await car.deleteOne();

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ message: 'Server error deleting car' });
  }
});

// @desc    Toggle favorite status
// @route   POST /api/cars/:id/favorite
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const isFavorite = car.favorites.includes(req.user._id);

    if (isFavorite) {
      car.favorites = car.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      car.favorites.push(req.user._id);
    }

    await car.save();

    res.json({
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
});

// Note: keep more specific routes above the dynamic :id route

module.exports = router;
