const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
const houseRoutes = require('./routes/houseRoutes');
const carRoutes = require('./routes/carRoutes');
const plotRoutes = require('./routes/plotRoutes');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const signedContractRoutes = require('./routes/signedContractRoutes');

const app = express();

// Middleware
const frontendOrigin = process.env.FRONTEND_URL;
if (frontendOrigin) {
  app.use(cors({ origin: frontendOrigin, credentials: true }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/houses', houseRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/signed-contracts', signedContractRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  // Check DB status: 0 = disconnected, 1 = connected, 2 = connecting
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting/Disconnected';

  res.json({
    status: 'OK',
    message: 'Rwanda Marketplace API is running',
    dbStatus: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// --- STATIC FILE SERVING (Correct for your structure) ---
const clientBuildPath = path.join(__dirname, '..', 'build');

// Serve build assets. Hashed files under /static/* are immutable and safe to
// cache aggressively. Everything else (notably index.html) must always be
// revalidated so returning users don't load a stale HTML that references
// JS chunks that no longer exist after a new deploy (white screen bug).
app.use(express.static(clientBuildPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes(`${path.sep}static${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  if (req.path && req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  return res.status(404).json({ message: 'Not found' });
});

// --- 🚀 OPTIMIZATION START ---

// 1. Connect to MongoDB (Non-blocking)
// We do NOT await this. We let it run in the background.
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// 2. Start Server IMMEDIATELY
// Do not wait for DB connection. Cloud Run needs the port open ASAP.
const PORT = process.env.PORT || 5000; // ✅ Fixed: Uses process.env.PORT

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
