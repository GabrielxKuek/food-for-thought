require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const redis = require('redis');

// Import routes
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://'),
    rejectUnauthorized: false
  }
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis'));

// Connect to Redis (with error handling for serverless)
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
  }
}

connectRedis();

// Make Redis client available to routes
app.locals.redis = redisClient;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logging

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Food for Thought - Health API',
    version: '1.0.0',
    endpoints: {
      health_check: '/api/health/test',
      sync_data: 'POST /api/health/sync',
      get_user_data: 'GET /api/health/:userId',
      get_activities: 'GET /api/health/activities/:userId',
      watch_status: 'GET /api/health/watch-status/:userId'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================================');
  console.log('🍎 Food for Thought - Health API Server');
  console.log('============================================================');
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`💾 Storage: Redis (${process.env.REDIS_URL || 'redis://localhost:6379'})`);
  console.log('============================================================');
  console.log('📍 Endpoints:');
  console.log(`   GET  /                                 - API info`);
  console.log(`   GET  /api/health/test                  - Health check`);
  console.log(`   POST /api/health/sync                  - Sync Apple Watch data`);
  console.log(`   GET  /api/health/:userId               - Get user health data`);
  console.log(`   GET  /api/health/activities/:userId    - Get user activities`);
  console.log(`   GET  /api/health/watch-status/:userId  - Check watch status`);
  console.log('============================================================');
});

// Vercel serverless export
module.exports = app;
