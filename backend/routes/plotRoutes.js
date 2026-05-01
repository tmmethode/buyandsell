const express = require('express');
const Plot = require('../models/Plot');
const mongoose = require('mongoose');
const { protect, optionalAuth, checkOwnership } = require('../middleware/auth');
const { uploadConfigs, handleUploadError, deleteFile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// @desc    Get all plots with filtering and pagination
// @route   GET /api/plots
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      zoning,
      landUse,
      terrain,
      soilType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Available' };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.priceNumeric = {};
      if (minPrice) filter.priceNumeric.$gte = parseInt(minPrice);
      if (maxPrice) filter.priceNumeric.$lte = parseInt(maxPrice);
    }
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = parseInt(minArea);
      if (maxArea) filter.area.$lte = parseInt(maxArea);
    }
    if (zoning) filter.zoning = zoning;
    if (landUse) filter.landUse = landUse;
    if (terrain) filter.terrain = terrain;
    if (soilType) filter.soilType = soilType;

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
    const plots = await Plot.find(filter)
      .populate('owner', 'firstName lastName email phone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Plot.countDocuments(filter);

    // Add favorite status for authenticated users
    if (req.user) {
      plots.forEach(plot => {
        plot.isFavorite = plot.favorites.includes(req.user._id);
      });
    }

    res.json({
      plots,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get plots error:', error);
    res.status(500).json({ message: 'Server error getting plots' });
  }
});

// @desc    Get featured plots
// @route   GET /api/plots/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const plots = await Plot.find({
      isFeatured: true,
      status: 'Available'
    })
      .populate('owner', 'firstName lastName email phone profileImage')
      .limit(6);

    res.json(plots);
  } catch (error) {
    console.error('Get featured plots error:', error);
    res.status(500).json({ message: 'Server error getting featured plots' });
  }
});

// Place specific subroutes BEFORE the dynamic :id route to avoid conflicts

// @desc    Get user's plots
// @route   GET /api/plots/my-plots
// @access  Private
router.get('/my-plots', protect, async (req, res) => {
  try {
    const plots = await Plot.find({ owner: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(plots);
  } catch (error) {
    console.error('Get my plots error:', error);
    res.status(500).json({ message: 'Server error getting your plots' });
  }
});

// @desc    Get user's favorite plots
// @route   GET /api/plots/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const plots = await Plot.find({ favorites: req.user._id })
      .populate('owner', 'firstName lastName email phone profileImage');

    res.json(plots);
  } catch (error) {
    console.error('Get favorite plots error:', error);
    res.status(500).json({ message: 'Server error getting favorite plots' });
  }
});

// @desc    Get plot statistics
// @route   GET /api/plots/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Plot.aggregate([
      { $match: { status: 'Available' } },
      {
        $group: {
          _id: null,
          totalPlots: { $sum: 1 },
          avgPrice: { $avg: '$priceNumeric' },
          avgArea: { $avg: '$area' },
          minPrice: { $min: '$priceNumeric' },
          maxPrice: { $max: '$priceNumeric' },
          minArea: { $min: '$area' },
          maxArea: { $max: '$area' }
        }
      }
    ]);

    const categoryStats = await Plot.aggregate([
      { $match: { status: 'Available' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const locationStats = await Plot.aggregate([
      { $match: { status: 'Available' } },
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
    console.error('Get plot stats error:', error);
    res.status(500).json({ message: 'Server error getting plot statistics' });
  }
});

// @desc    Get unique districts from plots
// @route   GET /api/plots/districts
// @access  Public
router.get('/districts', async (req, res) => {
  try {
    // District is nested in address object for plots
    const districts = await Plot.distinct('address.district', { status: 'Available' });
    // Filter out null/undefined/empty values and sort alphabetically
    const validDistricts = districts.filter(d => d && d.trim()).sort();
    res.json(validDistricts);
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ message: 'Server error getting districts' });
  }
});

// @desc    Get single plot by ID
// @route   GET /api/plots/:id
// @access  Public
router.get('/:id([0-9a-fA-F]{24})', optionalAuth, async (req, res) => {
  try {
    // Validate ObjectId to avoid CastError if route matching ever misorders
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid plot id' });
    }
    const plot = await Plot.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone profileImage')
      .populate('favorites', 'firstName lastName');

    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }

    // Increment view count
    plot.views += 1;
    await plot.save();

    // Add favorite status for authenticated users
    if (req.user) {
      plot.isFavorite = plot.favorites.includes(req.user._id);
    }

    res.json(plot);
  } catch (error) {
    console.error('Get plot error:', error);
    res.status(500).json({ message: 'Server error getting plot' });
  }
});

// @desc    Create new plot
// @route   POST /api/plots
// @access  Private
router.post('/', protect, uploadConfigs.plotImages, handleUploadError, async (req, res) => {
  try {
    const plotData = req.body || {};

    // Parse nested JSON fields (can arrive as strings in multipart)
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

    // Coerce numeric fields
    if (plotData.discountedPrice !== undefined) {
      plotData.discountedPrice = Number(plotData.discountedPrice) || 0;
    }
    // Extract numeric price
    if (plotData.price) {
      const priceMatch = String(plotData.price).match(/[\d,]+/);
      plotData.priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    } else if (plotData.priceNumeric !== undefined) {
      plotData.priceNumeric = Number(plotData.priceNumeric) || 0;
    } else {
      plotData.priceNumeric = 0;
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

    // Ensure zoning default (model requires it)
    if (!plotData.zoning) {
      const lu = (plotData.landUse || '').toString();
      if (lu === 'Mixed' || lu === 'Mixed Use') plotData.zoning = 'Mixed Use';
      else if (['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Recreational'].includes(lu)) plotData.zoning = lu;
      else plotData.zoning = 'Residential';
    }

    // Normalize utilities booleans
    if (plotData.utilities && typeof plotData.utilities === 'object') {
      ['water', 'electricity', 'sewage', 'internet', 'gas'].forEach(k => {
        const v = plotData.utilities[k];
        if (v !== undefined) plotData.utilities[k] = (v === true || v === 'true' || v === 1 || v === '1');
      });
    }

    // Role-based default: non-admin submissions are Pending
    if (req.user && req.user.role !== 'admin') {
      plotData.status = 'Pending';
    }

    // Handle image uploads (gallery + main)
    const normalizePath = (p) => {
      if (!p) return p;
      if (p.startsWith('http')) return p;
      return p.startsWith('/') ? p : `/${p}`;
    };

    const images = [];
    if (req.files && req.files.plotImages) {
      req.files.plotImages.forEach(file => {
        images.push(file.cloudUrl || `/uploads/plots/${file.filename}`);
      });
    }

    let mainImage = '';
    if (req.files && req.files.mainImage) {
      const mf = req.files.mainImage[0];
      mainImage = mf.cloudUrl || `/uploads/plots/${mf.filename}`;
    }

    let resolvedMain = '';
    let finalImages = [];
    if (mainImage && images.length > 0) {
      resolvedMain = normalizePath(mainImage);
      finalImages = [resolvedMain, ...images.map(normalizePath)];
    } else if (mainImage && images.length === 0) {
      resolvedMain = normalizePath(mainImage);
      finalImages = [resolvedMain];
    } else if (!mainImage && images.length > 0) {
      resolvedMain = normalizePath(images[0]);
      finalImages = [resolvedMain, ...images.slice(1).map(normalizePath)];
    } else {
      // default image
      resolvedMain = '/uploads/plots/plot1.png';
      finalImages = [resolvedMain];
    }

    // Default contact from current user if available
    if (!plotData.contactPhone && req.user && req.user.phone) {
      plotData.contactPhone = req.user.phone;
    }
    if (!plotData.contactEmail && req.user && req.user.email) {
      plotData.contactEmail = req.user.email;
    }

    const plot = await Plot.create({
      ...plotData,
      owner: req.user._id,
      images: finalImages,
      mainImage: resolvedMain,
      priceNumeric: plotData.priceNumeric
    });

    const populatedPlot = await plot.populate('owner', 'firstName lastName email phone profileImage');
    res.status(201).json(populatedPlot);
  } catch (error) {
    console.error('Create plot error:', error);
    res.status(500).json({ message: 'Server error creating plot' });
  }
});

// @desc    Update plot
// @route   PUT /api/plots/:id
// @access  Private
router.put('/:id([0-9a-fA-F]{24})', protect, checkOwnership('Plot'), uploadConfigs.plotImages, handleUploadError, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }

    const updateData = { ...req.body };

    // Handle image uploads
    if (req.files) {
      if (req.files.mainImage) {
        const mf = req.files.mainImage[0];
        updateData.mainImage = mf.cloudUrl || `/uploads/plots/${mf.filename}`;
      }

      if (req.files.plotImages) {
        const newImages = req.files.plotImages.map(file => file.cloudUrl || `/uploads/plots/${file.filename}`);
        updateData.images = [...plot.images, ...newImages];
      }
    }

    // Extract numeric price if price is updated
    if (updateData.price) {
      const priceMatch = updateData.price.match(/[\d,]+/);
      updateData.priceNumeric = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
    }

    const updatedPlot = await Plot.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email phone profileImage');

    res.json(updatedPlot);
  } catch (error) {
    console.error('Update plot error:', error);
    res.status(500).json({ message: 'Server error updating plot' });
  }
});

// @desc    Delete plot
// @route   DELETE /api/plots/:id
// @access  Private
router.delete('/:id([0-9a-fA-F]{24})', protect, checkOwnership('Plot'), async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }

    // Delete associated images
    const allImages = [plot.mainImage, ...plot.images];
    for (const imagePath of allImages) {
      if (imagePath) {
        await deleteFile(imagePath);
      }
    }

    await plot.deleteOne();

    res.json({ message: 'Plot deleted successfully' });
  } catch (error) {
    console.error('Delete plot error:', error);
    res.status(500).json({ message: 'Server error deleting plot' });
  }
});

// @desc    Toggle favorite status
// @route   POST /api/plots/:id/favorite
// @access  Private
router.post('/:id([0-9a-fA-F]{24})/favorite', protect, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) {
      return res.status(404).json({ message: 'Plot not found' });
    }

    const isFavorite = plot.favorites.includes(req.user._id);

    if (isFavorite) {
      plot.favorites = plot.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      plot.favorites.push(req.user._id);
    }

    await plot.save();

    res.json({
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
});

// (moved /my-plots, /favorites, /stats above :id)

module.exports = router;
