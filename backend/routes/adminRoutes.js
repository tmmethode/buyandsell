const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadConfigs, handleUploadError } = require('../middleware/upload');
const User = require('../models/User');
const House = require('../models/House');
const Car = require('../models/Car');
const Plot = require('../models/Plot');
const Job = require('../models/Job');
const Visitor = require('../models/Visitor');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// ==================== DASHBOARD ANALYTICS ====================
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalHouses = await House.countDocuments();
    const totalCars = await Car.countDocuments();
    const totalPlots = await Plot.countDocuments();
    const totalJobs = await Job.countDocuments();

    // Get recent activities - fetch more items for better coverage
    const recentUsers = await User.find().sort('-createdAt').limit(10).select('-password');
    const recentHouses = await House.find().sort('-createdAt').limit(10);
    const recentCars = await Car.find().sort('-createdAt').limit(10);
    const recentPlots = await Plot.find().sort('-createdAt').limit(10);
    const recentJobs = await Job.find().sort('-createdAt').limit(10);

    // Get monthly stats for the last 6 months
    const monthlyStats = await getMonthlyStats();

    // Get top performing items
    const topHouses = await House.find().sort('-views').limit(5);
    const topCars = await Car.find().sort('-views').limit(5);
    const topPlots = await Plot.find().sort('-views').limit(5);
    const topJobs = await Job.find().sort('-views').limit(5);

    // Get monthly comparison data (this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthUsers, lastMonthUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const [thisMonthHouses, lastMonthHouses] = await Promise.all([
      House.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      House.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const [thisMonthCars, lastMonthCars] = await Promise.all([
      Car.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Car.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const [thisMonthPlots, lastMonthPlots] = await Promise.all([
      Plot.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Plot.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const [thisMonthVisitors, lastMonthVisitors] = await Promise.all([
      Visitor.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Visitor.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const monthlyComparison = {
      users: { thisMonth: thisMonthUsers, lastMonth: lastMonthUsers, change: calcChange(thisMonthUsers, lastMonthUsers) },
      houses: { thisMonth: thisMonthHouses, lastMonth: lastMonthHouses, change: calcChange(thisMonthHouses, lastMonthHouses) },
      cars: { thisMonth: thisMonthCars, lastMonth: lastMonthCars, change: calcChange(thisMonthCars, lastMonthCars) },
      plots: { thisMonth: thisMonthPlots, lastMonth: lastMonthPlots, change: calcChange(thisMonthPlots, lastMonthPlots) },
      visitors: { thisMonth: thisMonthVisitors, lastMonth: lastMonthVisitors, change: calcChange(thisMonthVisitors, lastMonthVisitors) }
    };

    res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          houses: totalHouses,
          cars: totalCars,
          plots: totalPlots,
          jobs: totalJobs,
          visitors: await Visitor.countDocuments()
        },
        monthlyComparison,
        recent: {
          users: recentUsers,
          houses: recentHouses,
          cars: recentCars,
          plots: recentPlots,
          jobs: recentJobs
        },
        monthlyStats,
        recentActivities: [
          ...recentUsers.map(u => ({
            type: 'user',
            title: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            description: 'New user registered',
            createdAt: u.createdAt || u.updatedAt || new Date(),
            icon: 'user'
          })),
          ...recentHouses.map(h => ({
            type: 'house',
            title: h.title || 'House listing',
            description: 'New house listed',
            createdAt: h.createdAt || h.updatedAt || new Date(),
            icon: 'home'
          })),
          ...recentCars.map(c => ({
            type: 'car',
            title: c.title || `${c.brand} ${c.model}` || 'Car listing',
            description: 'New car listed',
            createdAt: c.createdAt || c.updatedAt || new Date(),
            icon: 'car'
          })),
          ...recentPlots.map(p => ({
            type: 'plot',
            title: p.title || 'Plot listing',
            description: 'New plot listed',
            createdAt: p.createdAt || p.updatedAt || new Date(),
            icon: 'mappin'
          }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15),
        topPerformers: {
          houses: topHouses,
          cars: topCars,
          plots: topPlots,
          jobs: topJobs
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER MANAGEMENT ====================
// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, sortBy = '-createdAt' } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Status filter
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;

    const users = await User.find(query)
      .select('-password')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, isActive, isVerified, permissions } = req.body;
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing email
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      role: role || 'user',
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isVerified: typeof isVerified === 'boolean' ? isVerified : false,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (including optional password change)
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, isActive, isVerified, password, permissions } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    if (password) user.password = password; // will be hashed by pre('save')
    if (Array.isArray(permissions)) user.permissions = permissions;

    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    res.json({ success: true, data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HOUSE MANAGEMENT ====================
// Get all houses with pagination and filters
router.get('/houses', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, owner, sortBy = '-createdAt' } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (owner) query.owner = owner;

    const houses = await House.find(query)
      .populate('owner', 'firstName lastName email phone profileImage')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await House.countDocuments(query);

    res.json({
      success: true,
      data: houses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update house status
router.patch('/houses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const house = await House.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!house) {
      return res.status(404).json({ success: false, message: 'House not found' });
    }

    res.json({ success: true, data: house });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new house
router.post('/houses', uploadConfigs.houseImages, handleUploadError, async (req, res) => {
  try {
    const houseData = req.body;

    // Set a default owner if not provided
    if (!houseData.owner) {
      houseData.owner = req.user.id;
    }

    // Handle image uploads into gallery array
    const galleryImages = [];
    if (req.files.houseImages) {
      req.files.houseImages.forEach(file => {
        galleryImages.push(file.cloudUrl || `/uploads/houses/${file.filename}`);
      });
    }

    let mainImage = '';
    if (req.files.mainImage && req.files.mainImage[0]) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/houses/${mf.filename}`;
    }

    // Normalize helper
    const normalizePath = (p) => {
      if (!p) return p;
      if (p.startsWith('http')) return p; // already absolute URL
      return p.startsWith('/') ? p : `/${p}`;
    };

    // Handle single image case properly
    let images = [];
    let resolvedMain = '';

    if (mainImage && galleryImages.length > 0) {
      // Both main image and gallery images uploaded
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain, ...galleryImages.map(normalizePath)];
    } else if (mainImage && galleryImages.length === 0) {
      // Only main image uploaded
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain];
    } else if (!mainImage && galleryImages.length > 0) {
      // Only gallery images uploaded - use first as main
      resolvedMain = normalizePath(galleryImages[0]);
      images = [resolvedMain, ...galleryImages.slice(1).map(normalizePath)];
    } else {
      // No images uploaded - use default
      resolvedMain = '/uploads/houses/house1.png';
      images = [resolvedMain];
      console.log('Using default images:', { images, mainImage: resolvedMain });
    }

    // Update house data with image paths
    houseData.images = images;
    houseData.mainImage = resolvedMain;

    console.log('Final house data before save:', { images: houseData.images, mainImage: houseData.mainImage });

    // Normalize/derive fields
    if (houseData.discountedPrice !== undefined) {
      houseData.discountedPrice = Number(houseData.discountedPrice) || 0;
    }
    if (houseData.priceNumeric !== undefined) {
      houseData.priceNumeric = Number(houseData.priceNumeric) || 0;
    }
    if (houseData.parkingSpaces !== undefined) {
      houseData.parkingSpaces = Number(houseData.parkingSpaces) || 0;
    }
    if (houseData.yearBuilt !== undefined) {
      houseData.yearBuilt = Number(houseData.yearBuilt) || undefined;
    }
    if (houseData.yearRenovated !== undefined) {
      houseData.yearRenovated = Number(houseData.yearRenovated) || undefined;
    }
    if (typeof houseData.nearbyAmenities === 'string') {
      // Accept comma-separated or JSON string
      try {
        const parsed = JSON.parse(houseData.nearbyAmenities);
        if (Array.isArray(parsed)) houseData.nearbyAmenities = parsed;
      } catch {
        houseData.nearbyAmenities = houseData.nearbyAmenities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    const house = new House(houseData);
    await house.save();

    console.log('Saved house with images:', { images: house.images, mainImage: house.mainImage });

    res.status(201).json({ success: true, data: house });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update house
router.put('/houses/:id', uploadConfigs.houseImages, handleUploadError, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.discountedPrice !== undefined) {
      updateData.discountedPrice = Number(updateData.discountedPrice) || 0;
    }
    if (updateData.priceNumeric !== undefined) {
      updateData.priceNumeric = Number(updateData.priceNumeric) || 0;
    }
    if (updateData.parkingSpaces !== undefined) {
      updateData.parkingSpaces = Number(updateData.parkingSpaces) || 0;
    }
    if (updateData.yearBuilt !== undefined) {
      updateData.yearBuilt = Number(updateData.yearBuilt) || undefined;
    }
    if (updateData.yearRenovated !== undefined) {
      updateData.yearRenovated = Number(updateData.yearRenovated) || undefined;
    }
    if (typeof updateData.nearbyAmenities === 'string') {
      try {
        const parsed = JSON.parse(updateData.nearbyAmenities);
        if (Array.isArray(parsed)) updateData.nearbyAmenities = parsed;
      } catch {
        updateData.nearbyAmenities = updateData.nearbyAmenities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    // Handle image uploads if new files are provided
    if (req.files) {
      let newGalleryImages;
      let newMainImage;
      const normalizePath = (p) => {
        if (!p) return p;
        if (p.startsWith('http')) return p;
        return p.startsWith('/') ? p : `/${p}`;
      };

      if (req.files.houseImages && req.files.houseImages.length > 0) {
        newGalleryImages = req.files.houseImages.map(file => file.cloudUrl || `/uploads/houses/${file.filename}`);
      }

      if (req.files.mainImage && req.files.mainImage[0]) {
        const mf = req.files.mainImage[0];
        newMainImage = mf.cloudUrl || `/uploads/houses/${mf.filename}`;
      }

      if (newGalleryImages || newMainImage) {
        let images = [];
        let resolvedMain = '';

        if (newMainImage && newGalleryImages && newGalleryImages.length > 0) {
          // Both main image and gallery images uploaded
          resolvedMain = normalizePath(newMainImage);
          images = [resolvedMain, ...newGalleryImages.map(normalizePath)];
        } else if (newMainImage && (!newGalleryImages || newGalleryImages.length === 0)) {
          // Only main image uploaded
          resolvedMain = normalizePath(newMainImage);
          images = [resolvedMain];
        } else if (!newMainImage && newGalleryImages && newGalleryImages.length > 0) {
          // Only gallery images uploaded - use first as main
          resolvedMain = normalizePath(newGalleryImages[0]);
          images = [resolvedMain, ...newGalleryImages.slice(1).map(normalizePath)];
        }

        if (resolvedMain) {
          updateData.images = images;
          updateData.mainImage = resolvedMain;
        }
      }
    }

    const house = await House.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!house) {
      return res.status(404).json({ success: false, message: 'House not found' });
    }

    res.json({ success: true, data: house });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete house
router.delete('/houses/:id', async (req, res) => {
  try {
    const house = await House.findByIdAndDelete(req.params.id);
    if (!house) {
      return res.status(404).json({ success: false, message: 'House not found' });
    }

    res.json({ success: true, message: 'House deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CAR MANAGEMENT ====================
// Get all cars with pagination and filters
router.get('/cars', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, sortBy = '-createdAt' } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;

    const cars = await Car.find(query)
      .populate('owner', 'firstName lastName email phone')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Car.countDocuments(query);

    res.json({
      success: true,
      data: cars,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update car status
router.patch('/cars/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new car
router.post('/cars', uploadConfigs.carImages, handleUploadError, async (req, res) => {
  try {
    const carData = req.body;

    if (!carData.owner) {
      carData.owner = req.user.id;
    }
    // Parse nested JSON fields if sent as strings via multipart
    try {
      if (typeof carData.specifications === 'string') {
        carData.specifications = JSON.parse(carData.specifications);
      }
    } catch (e) {
      console.warn('Failed to parse car specifications JSON:', e?.message);
    }
    try {
      if (typeof carData.address === 'string') {
        carData.address = JSON.parse(carData.address);
      }
    } catch (e) {
      console.warn('Failed to parse car address JSON:', e?.message);
    }

    // Normalize numeric fields
    if (carData.discountedPrice !== undefined) {
      carData.discountedPrice = Number(carData.discountedPrice) || 0;
    }
    if (carData.priceNumeric !== undefined) {
      carData.priceNumeric = Number(carData.priceNumeric) || 0;
    }
    if (carData.year !== undefined) {
      carData.year = Number(carData.year);
    }
    if (carData.mileage !== undefined) {
      carData.mileage = Number(carData.mileage);
    }
    if (carData.seats !== undefined) {
      carData.seats = Number(carData.seats);
    }

    // Compose location from address pieces if not explicitly provided
    if ((!carData.location || String(carData.location).trim() === '') && carData.address) {
      const a = carData.address || {};
      const composed = [a.province || a.city, a.district, a.sector, a.cell, a.village]
        .filter(Boolean)
        .join(', ');
      if (composed) carData.location = composed;
    }

    // Handle image uploads into gallery array (mirror house create)
    const galleryImages = [];
    if (req.files && req.files.carImages) {
      req.files.carImages.forEach(file => {
        galleryImages.push(file.cloudUrl || `/uploads/cars/${file.filename}`);
      });
    }

    let mainImage = '';
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/cars/${mf.filename}`;
    }

    const normalizePath = (p) => {
      if (!p) return p;
      if (p.startsWith('http')) return p;
      return p.startsWith('/') ? p : `/${p}`;
    };

    let images = [];
    let resolvedMain = '';
    if (mainImage && galleryImages.length > 0) {
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain, ...galleryImages.map(normalizePath)];
    } else if (mainImage && galleryImages.length === 0) {
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain];
    } else if (!mainImage && galleryImages.length > 0) {
      resolvedMain = normalizePath(galleryImages[0]);
      images = [resolvedMain, ...galleryImages.slice(1).map(normalizePath)];
    } else {
      // No images uploaded - use default
      resolvedMain = '/uploads/cars/car1.png';
      images = [resolvedMain];
      console.log('Using default images for car:', { images, mainImage: resolvedMain });
    }

    carData.images = images;
    carData.mainImage = resolvedMain;

    const car = new Car(carData);
    await car.save();

    res.status(201).json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update car
router.put('/cars/:id', uploadConfigs.carImages, handleUploadError, async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Parse nested JSON fields if sent as strings via multipart
    try {
      if (typeof updateData.specifications === 'string') {
        updateData.specifications = JSON.parse(updateData.specifications);
      }
    } catch (e) {
      console.warn('Failed to parse car specifications JSON on update:', e?.message);
    }
    try {
      if (typeof updateData.address === 'string') {
        updateData.address = JSON.parse(updateData.address);
      }
    } catch (e) {
      console.warn('Failed to parse car address JSON on update:', e?.message);
    }
    if (updateData.discountedPrice !== undefined) {
      updateData.discountedPrice = Number(updateData.discountedPrice) || 0;
    }
    if (updateData.priceNumeric !== undefined) {
      updateData.priceNumeric = Number(updateData.priceNumeric) || 0;
    }
    if (updateData.year !== undefined) {
      updateData.year = Number(updateData.year);
    }
    if (updateData.mileage !== undefined) {
      updateData.mileage = Number(updateData.mileage);
    }
    if (updateData.seats !== undefined) {
      updateData.seats = Number(updateData.seats);
    }

    // Compose location from address pieces if not explicitly provided on update
    if ((!updateData.location || String(updateData.location).trim() === '') && updateData.address) {
      const a = updateData.address || {};
      const composed = [a.province || a.city, a.district, a.sector, a.cell, a.village]
        .filter(Boolean)
        .join(', ');
      if (composed) updateData.location = composed;
    }

    // Handle image uploads if new files are provided (mirror house update)
    if (req.files) {
      let newGalleryImages;
      let newMainImage;
      const normalizePath = (p) => {
        if (!p) return p;
        if (p.startsWith('http')) return p;
        return p.startsWith('/') ? p : `/${p}`;
      };

      if (req.files.carImages && req.files.carImages.length > 0) {
        newGalleryImages = req.files.carImages.map(file => file.cloudUrl || `/uploads/cars/${file.filename}`);
      }

      if (req.files.mainImage && req.files.mainImage[0]) {
        const mf = req.files.mainImage[0];
        newMainImage = mf.cloudUrl || `/uploads/cars/${mf.filename}`;
      }

      if (newGalleryImages || newMainImage) {
        let images = [];
        let resolvedMain = '';

        if (newMainImage && newGalleryImages && newGalleryImages.length > 0) {
          resolvedMain = normalizePath(newMainImage);
          images = [resolvedMain, ...newGalleryImages.map(normalizePath)];
        } else if (newMainImage && (!newGalleryImages || newGalleryImages.length === 0)) {
          resolvedMain = normalizePath(newMainImage);
          images = [resolvedMain];
        } else if (!newMainImage && newGalleryImages && newGalleryImages.length > 0) {
          resolvedMain = normalizePath(newGalleryImages[0]);
          images = [resolvedMain, ...newGalleryImages.slice(1).map(normalizePath)];
        }

        if (resolvedMain) {
          updateData.images = images;
          updateData.mainImage = resolvedMain;
        }
      }
    }

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete car
router.delete('/cars/:id', async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== PLOT MANAGEMENT ====================
// Get all plots with pagination and filters
router.get('/plots', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, landUse, status, sortBy = '-createdAt' } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (landUse) query.landUse = landUse;
    if (status) query.status = status;

    const plots = await Plot.find(query)
      .populate('owner', 'firstName lastName email phone')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Plot.countDocuments(query);

    res.json({
      success: true,
      data: plots,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update plot status
router.patch('/plots/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const plot = await Plot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!plot) {
      return res.status(404).json({ success: false, message: 'Plot not found' });
    }

    res.json({ success: true, data: plot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new plot (multipart with image handling + nested JSON parsing)
router.post('/plots', uploadConfigs.plotImages, handleUploadError, async (req, res) => {
  try {
    const plotData = req.body || {};

    // Default owner
    if (!plotData.owner) {
      plotData.owner = req.user.id;
    }

    // Parse nested JSON fields possibly sent as strings
    try {
      if (typeof plotData.address === 'string') {
        plotData.address = JSON.parse(plotData.address);
      }
    } catch (e) {
      console.warn('Failed to parse plot address JSON:', e?.message);
    }
    try {
      if (typeof plotData.utilities === 'string') {
        plotData.utilities = JSON.parse(plotData.utilities);
      }
    } catch (e) {
      console.warn('Failed to parse plot utilities JSON:', e?.message);
    }
    // nearbyFacilities may come as JSON string or comma-separated string
    if (typeof plotData.nearbyFacilities === 'string') {
      try {
        const parsed = JSON.parse(plotData.nearbyFacilities);
        if (Array.isArray(parsed)) plotData.nearbyFacilities = parsed;
      } catch {
        plotData.nearbyFacilities = plotData.nearbyFacilities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    // Coerce/normalize numerics
    if (plotData.discountedPrice !== undefined) {
      plotData.discountedPrice = Number(plotData.discountedPrice) || 0;
    }
    if (plotData.priceNumeric !== undefined) {
      plotData.priceNumeric = Number(plotData.priceNumeric) || 0;
    }
    if (plotData.area !== undefined) {
      plotData.area = Number(plotData.area) || 0;
    }

    // Compose location from address if not provided
    if ((!plotData.location || String(plotData.location).trim() === '') && plotData.address) {
      const a = plotData.address || {};
      const composed = [a.city, a.district, a.sector, a.cell, a.village]
        .filter(Boolean)
        .join(', ');
      if (composed) plotData.location = composed;
    }

    // Utilities booleans may come as strings
    if (plotData.utilities && typeof plotData.utilities === 'object') {
      ['water', 'electricity', 'sewage', 'internet', 'gas'].forEach(k => {
        if (plotData.utilities[k] !== undefined) {
          const v = plotData.utilities[k];
          plotData.utilities[k] = (v === true || v === 'true' || v === 1 || v === '1');
        }
      });
    }

    // Set zoning default if missing to satisfy model requirements
    if (!plotData.zoning) {
      const lu = (plotData.landUse || '').toString();
      if (lu === 'Mixed') plotData.zoning = 'Mixed Use';
      else if (['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Recreational'].includes(lu)) plotData.zoning = lu;
      else plotData.zoning = 'Residential';
    }

    // Handle image uploads like houses/cars
    const normalizePath = (p) => {
      if (!p) return p;
      if (p.startsWith('http')) return p;
      return p.startsWith('/') ? p : `/${p}`;
    };

    const galleryImages = [];
    if (req.files && req.files.plotImages) {
      req.files.plotImages.forEach(file => {
        galleryImages.push(file.cloudUrl || `/uploads/plots/${file.filename}`);
      });
    }
    let mainImage = '';
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/plots/${mf.filename}`;
    }

    let images = [];
    let resolvedMain = '';
    if (mainImage && galleryImages.length > 0) {
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain, ...galleryImages.map(normalizePath)];
    } else if (mainImage && galleryImages.length === 0) {
      resolvedMain = normalizePath(mainImage);
      images = [resolvedMain];
    } else if (!mainImage && galleryImages.length > 0) {
      resolvedMain = normalizePath(galleryImages[0]);
      images = [resolvedMain, ...galleryImages.slice(1).map(normalizePath)];
    } else {
      // default image
      resolvedMain = '/uploads/plots/plot1.png';
      images = [resolvedMain];
    }
    plotData.images = images;
    plotData.mainImage = resolvedMain;

    // Ensure contact info defaults from current admin user when missing
    if (!plotData.contactPhone && req.user && req.user.phone) {
      plotData.contactPhone = req.user.phone;
    }
    if (!plotData.contactEmail && req.user && req.user.email) {
      plotData.contactEmail = req.user.email;
    }

    const plot = new Plot(plotData);
    await plot.save();
    res.status(201).json({ success: true, data: plot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update plot (multipart with image handling, merge existing + new)
router.put('/plots/:id', uploadConfigs.plotImages, handleUploadError, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse nested JSON strings
    try {
      if (typeof updateData.address === 'string') {
        updateData.address = JSON.parse(updateData.address);
      }
    } catch (e) {
      console.warn('Failed to parse plot address JSON on update:', e?.message);
    }
    try {
      if (typeof updateData.utilities === 'string') {
        updateData.utilities = JSON.parse(updateData.utilities);
      }
    } catch (e) {
      console.warn('Failed to parse plot utilities JSON on update:', e?.message);
    }
    if (typeof updateData.nearbyFacilities === 'string') {
      try {
        const parsed = JSON.parse(updateData.nearbyFacilities);
        if (Array.isArray(parsed)) updateData.nearbyFacilities = parsed;
      } catch {
        updateData.nearbyFacilities = updateData.nearbyFacilities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    // Coerce numerics
    if (updateData.discountedPrice !== undefined) {
      updateData.discountedPrice = Number(updateData.discountedPrice) || 0;
    }
    if (updateData.priceNumeric !== undefined) {
      updateData.priceNumeric = Number(updateData.priceNumeric) || 0;
    }
    if (updateData.area !== undefined) {
      updateData.area = Number(updateData.area) || 0;
    }

    // Compose location from address if not provided
    if ((!updateData.location || String(updateData.location).trim() === '') && updateData.address) {
      const a = updateData.address || {};
      const composed = [a.city, a.district, a.sector, a.cell, a.village]
        .filter(Boolean)
        .join(', ');
      if (composed) updateData.location = composed;
    }

    // Normalize utilities booleans
    if (updateData.utilities && typeof updateData.utilities === 'object') {
      ['water', 'electricity', 'sewage', 'internet', 'gas'].forEach(k => {
        if (updateData.utilities[k] !== undefined) {
          const v = updateData.utilities[k];
          updateData.utilities[k] = (v === true || v === 'true' || v === 1 || v === '1');
        }
      });
    }

    // Image handling: merge existing images + newly uploaded
    const normalizePath = (p) => {
      if (!p) return p;
      if (p.startsWith('http')) return p;
      return p.startsWith('/') ? p : `/${p}`;
    };

    let existingImages = [];
    if (req.body && req.body.existingImages) {
      existingImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      existingImages = existingImages.map(normalizePath);
    }

    let newGalleryImages = [];
    if (req.files && req.files.plotImages && req.files.plotImages.length > 0) {
      newGalleryImages = req.files.plotImages.map(f => `/uploads/plots/${f.filename}`);
    }
    let newMainImage = '';
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      newMainImage = `/uploads/plots/${req.files.mainImage[0].filename}`;
    }

    // currentMainImage can be passed when main is an existing image
    let currentMainImage = '';
    if (req.body && req.body.currentMainImage) {
      currentMainImage = normalizePath(req.body.currentMainImage);
    }

    if (newGalleryImages.length > 0 || newMainImage) {
      // Merge strategy: [resolvedMain, ...existing (excluding main), ...newGallery]
      let resolvedMain = '';
      if (newMainImage) {
        resolvedMain = normalizePath(newMainImage);
      } else if (currentMainImage) {
        resolvedMain = currentMainImage;
      } else if (newGalleryImages.length > 0) {
        resolvedMain = normalizePath(newGalleryImages[0]);
      } else if (existingImages.length > 0) {
        resolvedMain = normalizePath(existingImages[0]);
      }

      // Build images array, preserving order where possible
      const restExisting = existingImages.filter(img => img !== resolvedMain);
      const galleryNormalized = newGalleryImages.map(normalizePath);
      const images = [resolvedMain, ...restExisting, ...galleryNormalized].filter(Boolean);
      updateData.images = images;
      updateData.mainImage = resolvedMain;
    }

    const plot = await Plot.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!plot) {
      return res.status(404).json({ success: false, message: 'Plot not found' });
    }

    res.json({ success: true, data: plot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete plot
router.delete('/plots/:id', async (req, res) => {
  try {
    const plot = await Plot.findByIdAndDelete(req.params.id);
    if (!plot) {
      return res.status(404).json({ success: false, message: 'Plot not found' });
    }

    res.json({ success: true, message: 'Plot deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== JOB MANAGEMENT ====================
// Get all jobs with pagination and filters
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status, sortBy = '-createdAt' } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('owner', 'firstName lastName email phone')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update job status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new job
router.post('/jobs', async (req, res) => {
  try {
    const jobData = req.body;
    if (!jobData.owner) {
      jobData.owner = req.user.id;
    }

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update job
router.put('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================
async function getMonthlyStats() {
  const months = [];
  const currentDate = new Date();

  for (let i = 3; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const [users, houses, cars, plots, jobs] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      House.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Car.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Plot.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
      Job.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
    ]);

    months.push({
      month: monthName,
      users,
      houses,
      cars,
      plots,
      jobs
    });
  }

  return months;
}

module.exports = router;
