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

// Redis client with improved connection handling
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://'),
    rejectUnauthorized: false,
    connectTimeout: 60000, // 60 seconds
    commandTimeout: 10000   // 10 seconds per command
  },
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with a individual error
      return new Error('The Redis server is unavailable');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  // Don't let Redis errors crash the server
});
redisClient.on('connect', () => console.log('✅ Connected to Redis'));
redisClient.on('ready', () => console.log('✅ Redis is ready'));
redisClient.on('reconnecting', () => console.log('🔄 Reconnecting to Redis...'));

// Connect to Redis (with improved error handling)
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      console.log('🔌 Attempting to connect to Redis...');
      await redisClient.connect();
      console.log('✅ Successfully connected to Redis');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Server will continue running without Redis (using local fallback)');
    // Don't exit process, let the server continue
  }
}

// Graceful Redis connection with retry
connectRedis();

// Reconnect on disconnect
redisClient.on('end', () => {
  console.log('🔌 Redis connection ended, attempting to reconnect...');
  setTimeout(connectRedis, 5000); // Retry after 5 seconds
});

// Make Redis client available to routes
app.locals.redis = redisClient;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://food-for-thought-lovat.vercel.app',
    process.env.CORS_ORIGIN
  ].filter(Boolean), // Remove any undefined values
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
      trigger_sync: 'POST /api/health/trigger-sync/:userId',
      sync_status: 'GET /api/health/sync-status/:userId',
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
  console.log(`   POST /api/health/trigger-sync/:userId  - Trigger watch sync`);
  console.log(`   GET  /api/health/sync-status/:userId   - Check sync status`);
  console.log(`   GET  /api/health/:userId               - Get user health data`);
  console.log(`   GET  /api/health/activities/:userId    - Get user activities`);
  console.log(`   GET  /api/health/watch-status/:userId  - Check watch status`);
  console.log('============================================================');
});

// Vercel serverless export
module.exports = app;
