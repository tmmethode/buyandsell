const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('favorites');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error getting user' });
  }
});

// @desc    Get user's listings summary
// @route   GET /api/users/:id/listings
// @access  Public
router.get('/:id/listings', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Import models dynamically to avoid circular dependencies
    const House = require('../models/House');
    const Car = require('../models/Car');
    const Plot = require('../models/Plot');
    const Job = require('../models/Job');

    // Get counts for each type of listing
    const [houseCount, carCount, plotCount, jobCount] = await Promise.all([
      House.countDocuments({ owner: userId, status: 'Available' }),
      Car.countDocuments({ owner: userId, status: 'Available' }),
      Plot.countDocuments({ owner: userId, status: 'Available' }),
      Job.countDocuments({ postedBy: userId, status: 'Active' })
    ]);

    res.json({
      houses: houseCount,
      cars: carCount,
      plots: plotCount,
      jobs: jobCount,
      total: houseCount + carCount + plotCount + jobCount
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ message: 'Server error getting user listings' });
  }
});

// @desc    Get user's recent activity
// @route   GET /api/users/:id/activity
// @access  Public
router.get('/:id/activity', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Import models dynamically
    const House = require('../models/House');
    const Car = require('../models/Car');
    const Plot = require('../models/Plot');
    const Job = require('../models/Job');

    // Get recent listings from each category
    const [houses, cars, plots, jobs] = await Promise.all([
      House.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title category price location createdAt'),
      Car.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title category price location createdAt'),
      Plot.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title category price location createdAt'),
      Job.find({ postedBy: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title company location createdAt')
    ]);

    // Combine and sort by creation date
    const allActivity = [
      ...houses.map(item => ({ ...item.toObject(), type: 'house' })),
      ...cars.map(item => ({ ...item.toObject(), type: 'car' })),
      ...plots.map(item => ({ ...item.toObject(), type: 'plot' })),
      ...jobs.map(item => ({ ...item.toObject(), type: 'job' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allActivity.slice(0, 10)); // Return top 10 most recent
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error getting user activity' });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchFilter = {
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(searchFilter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ firstName: 1, lastName: 1 });

    const total = await User.countDocuments(searchFilter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
          avgUsersPerDay: { $avg: { $dayOfYear: '$createdAt' } }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      general: stats[0] || {},
      roles: roleStats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error getting user statistics' });
  }
});

// @desc    Update user verification status (admin only)
// @route   PUT /api/users/:id/verify
// @access  Private/Admin
router.put('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({ message: 'Server error updating user verification' });
  }
});

// @desc    Toggle user active status (admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @desc    Get user's favorites
// @route   GET /api/users/:id/favorites
// @access  Public
router.get('/:id/favorites', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Import models dynamically
    const House = require('../models/House');
    const Car = require('../models/Car');
    const Plot = require('../models/Plot');
    const Job = require('../models/Job');

    // Get user's favorites
    const user = await User.findById(userId).select('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get favorite items from each category
    const [houses, cars, plots, jobs] = await Promise.all([
      House.find({ _id: { $in: user.favorites } })
        .select('title category price location mainImage')
        .populate('owner', 'firstName lastName'),
      Car.find({ _id: { $in: user.favorites } })
        .select('title category price location mainImage')
        .populate('owner', 'firstName lastName'),
      Plot.find({ _id: { $in: user.favorites } })
        .select('title category price location mainImage')
        .populate('owner', 'firstName lastName'),
      Job.find({ _id: { $in: user.favorites } })
        .select('title company location')
        .populate('postedBy', 'firstName lastName')
    ]);

    res.json({
      houses,
      cars,
      plots,
      jobs,
      total: houses.length + cars.length + plots.length + jobs.length
    });
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ message: 'Server error getting user favorites' });
  }
});

// @desc    Get user's dashboard data
// @route   GET /api/users/:id/dashboard
// @access  Private (user can only access their own dashboard)
router.get('/:id/dashboard', protect, async (req, res) => {
  try {
    // Check if user is accessing their own dashboard or is admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this dashboard' });
    }

    const userId = req.params.id;
    
    // Import models dynamically
    const House = require('../models/House');
    const Car = require('../models/Car');
    const Plot = require('../models/Plot');
    const Job = require('../models/Job');

    // Get comprehensive dashboard data
    const [
      houseStats,
      carStats,
      plotStats,
      jobStats,
      recentViews,
      totalFavorites
    ] = await Promise.all([
      House.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: ['$status', 1, 0] } },
            views: { $sum: '$views' }
          }
        }
      ]),
      Car.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: ['$status', 1, 0] } },
            views: { $sum: '$views' }
          }
        }
      ]),
      Plot.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: ['$status', 1, 0] } },
            views: { $sum: '$views' }
          }
        }
      ]),
      Job.aggregate([
        { $match: { postedBy: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$status', 1, 0] } },
            views: { $sum: '$views' },
            applications: { $sum: { $size: '$applications' } }
          }
        }
      ]),
      // Get recent views across all user's listings
      Promise.all([
        House.find({ owner: userId }).sort({ views: -1 }).limit(5).select('title views'),
        Car.find({ owner: userId }).sort({ views: -1 }).limit(5).select('title views'),
        Plot.find({ owner: userId }).sort({ views: -1 }).limit(5).select('title views'),
        Job.find({ postedBy: userId }).sort({ views: -1 }).limit(5).select('title views')
      ]),
      User.findById(userId).select('favorites')
    ]);

    // Combine recent views
    const allViews = [
      ...houseStats[0]?.views || 0,
      ...carStats[0]?.views || 0,
      ...plotStats[0]?.views || 0,
      ...jobStats[0]?.views || 0
    ];

    res.json({
      stats: {
        houses: houseStats[0] || { total: 0, available: 0, views: 0 },
        cars: carStats[0] || { total: 0, available: 0, views: 0 },
        plots: plotStats[0] || { total: 0, available: 0, views: 0 },
        jobs: jobStats[0] || { total: 0, active: 0, views: 0, applications: 0 }
      },
      totalViews: allViews.reduce((sum, views) => sum + (views || 0), 0),
      totalFavorites: totalFavorites?.favorites?.length || 0,
      recentViews: {
        houses: houseStats[0]?.views || 0,
        cars: carStats[0]?.views || 0,
        plots: plotStats[0]?.views || 0,
        jobs: jobStats[0]?.views || 0
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ message: 'Server error getting user dashboard' });
  }
});

module.exports = router;
