const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      next();
    } catch (error) {
      if (error && error.name === 'TokenExpiredError') {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Not authorized, token expired', code: 'TOKEN_EXPIRED' });
      }
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed', code: 'TOKEN_INVALID' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token', code: 'TOKEN_MISSING' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, please login' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }

    next();
  };
};

// Optional authentication - doesn't require token but adds user if present
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token is invalid, but we continue without user
      req.user = null;
    }
  }

  next();
};

// Check if user owns the resource
const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const item = await Model.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ message: `${modelName} not found` });
      }

      // Allow admins to access all resources
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const ownerField = modelName === 'Job' ? 'postedBy' : 'owner';
      if (item[ownerField].toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: `Not authorized to access this ${modelName.toLowerCase()}` 
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ message: 'Server error during ownership check' });
    }
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership
};
