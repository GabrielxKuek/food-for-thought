const express = require('express');
const router = express.Router();

// Helper functions for Redis operations with error handling
const getRedisClient = (req) => req.app.locals.redis;

const getFromRedis = async (redis, key) => {
  try {
    if (!redis || !redis.isOpen) {
      console.log(`⚠️  Redis not available for key: ${key}, returning empty array`);
      return [];
    }
    const data = await redis.get(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`❌ Redis GET error for key ${key}:`, error.message);
    return []; // Return empty array on error
  }
};

const setToRedis = async (redis, key, data) => {
  try {
    if (!redis || !redis.isOpen) {
      console.log(`⚠️  Redis not available for key: ${key}, skipping set operation`);
      return false;
    }
    await redis.set(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`❌ Redis SET error for key ${key}:`, error.message);
    return false;
  }
};

// POST /api/health/sync - Sync health data from iOS app
router.post('/sync', async (req, res) => {
  try {
    const { user_id, heart_rates = [], activities = [], steps = [] } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const redis = getRedisClient(req);
    const results = {
      heart_rates_synced: 0,
      activities_synced: 0,
      steps_synced: 0
    };

    // Sync heart rates
    const existingHeartRates = await getFromRedis(redis, `heartrates:${user_id}`);
    for (const hr of heart_rates) {
      existingHeartRates.push({
        timestamp: hr.timestamp,
        bpm: hr.bpm,
        source: hr.source || 'Apple Watch',
        createdAt: new Date().toISOString()
      });
      results.heart_rates_synced++;
    }
    // Keep only last 1000
    const limitedHeartRates = existingHeartRates.slice(-1000);
    await setToRedis(redis, `heartrates:${user_id}`, limitedHeartRates);

    // Sync activities
    const existingActivities = await getFromRedis(redis, `activities:${user_id}`);
    for (const act of activities) {
      existingActivities.push({
        start: act.start,
        end: act.end,
        activityType: act.activity_type || 'other',
        caloriesBurned: act.calories_burned || 0,
        durationMinutes: act.duration_minutes || 0,
        avgHeartRate: act.avg_heart_rate,
        distanceMeters: act.distance_meters,
        createdAt: new Date().toISOString()
      });
      results.activities_synced++;
    }
    await setToRedis(redis, `activities:${user_id}`, existingActivities);

    // Sync steps (upsert by date)
    const existingSteps = await getFromRedis(redis, `steps:${user_id}`);
    for (const step of steps) {
      const existingIndex = existingSteps.findIndex(s => s.date === step.date);
      
      if (existingIndex >= 0) {
        existingSteps[existingIndex] = {
          ...existingSteps[existingIndex],
          steps: step.steps,
          distanceMeters: step.distance_meters,
          updatedAt: new Date().toISOString()
        };
      } else {
        existingSteps.push({
          date: step.date,
          steps: step.steps,
          distanceMeters: step.distance_meters,
          createdAt: new Date().toISOString()
        });
      }
      results.steps_synced++;
    }
    await setToRedis(redis, `steps:${user_id}`, existingSteps);

    console.log(`✅ Synced data for ${user_id}:`, results);

    res.json({
      success: true,
      message: 'Health data synced successfully',
      synced: {
        heart_rates: results.heart_rates_synced,
        activities: results.activities_synced,
        steps: results.steps_synced
      },
      last_sync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync health data',
      error: error.message 
    });
  }
});

// GET /api/health/:userId - Get all health data for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    const redis = getRedisClient(req);

    // Get heart rates
    let heartRates = await getFromRedis(redis, `heartrates:${userId}`);
    
    if (startDate || endDate) {
      heartRates = heartRates.filter(hr => {
        const hrDate = new Date(hr.timestamp);
        if (startDate && hrDate < new Date(startDate)) return false;
        if (endDate && hrDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    heartRates = heartRates
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    // Get activities
    let activities = await getFromRedis(redis, `activities:${userId}`);
    
    if (startDate || endDate) {
      activities = activities.filter(act => {
        const actDate = new Date(act.start);
        if (startDate && actDate < new Date(startDate)) return false;
        if (endDate && actDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    activities = activities.sort((a, b) => new Date(b.start) - new Date(a.start));

    // Get steps
    const steps = (await getFromRedis(redis, `steps:${userId}`))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Get current (latest) heart rate
    const currentHeartRate = heartRates.length > 0 ? heartRates[0] : null;

    // Calculate summary
    const totalCalories = activities.reduce((sum, act) => sum + act.caloriesBurned, 0);
    const totalSteps = steps.reduce((sum, step) => sum + step.steps, 0);

    res.json({
      user_id: userId,
      current_heart_rate: currentHeartRate ? {
        bpm: currentHeartRate.bpm,
        timestamp: currentHeartRate.timestamp,
        source: currentHeartRate.source
      } : null,
      heart_rates: heartRates.map(hr => ({
        timestamp: hr.timestamp,
        bpm: hr.bpm,
        source: hr.source
      })),
      activities: activities.map(act => ({
        start: act.start,
        end: act.end,
        activity_type: act.activityType,
        calories_burned: act.caloriesBurned,
        duration_minutes: act.durationMinutes,
        avg_heart_rate: act.avgHeartRate,
        distance_meters: act.distanceMeters
      })),
      steps: steps.map(s => ({
        date: s.date,
        steps: s.steps,
        distance_meters: s.distanceMeters
      })),
      summary: {
        total_heart_rates: heartRates.length,
        total_activities: activities.length,
        total_calories_burned: totalCalories,
        total_steps: totalSteps,
        last_sync: currentHeartRate ? currentHeartRate.createdAt : null
      }
    });

  } catch (error) {
    console.error('Get health data error:', error);
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

// GET /api/health/activities/:userId - Get activities for user
router.get('/activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const redis = getRedisClient(req);
    let activities = await getFromRedis(redis, `activities:${userId}`);
    
    if (startDate || endDate) {
      activities = activities.filter(act => {
        const actDate = new Date(act.start);
        if (startDate && actDate < new Date(startDate)) return false;
        if (endDate && actDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    activities = activities.sort((a, b) => new Date(b.start) - new Date(a.start));

    const totalCalories = activities.reduce((sum, act) => sum + act.caloriesBurned, 0);

    res.json({
      user_id: userId,
      activities: activities.map(act => ({
        start: act.start,
        end: act.end,
        activity_type: act.activityType,
        calories_burned: act.caloriesBurned,
        duration_minutes: act.durationMinutes,
        avg_heart_rate: act.avgHeartRate,
        distance_meters: act.distanceMeters
      })),
      summary: {
        total_activities: activities.length,
        total_calories: totalCalories
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/health/watch-status/:userId - Check if watch is connected
router.get('/watch-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const redis = getRedisClient(req);
    const heartRates = await getFromRedis(redis, `heartrates:${userId}`);

    // Check if user has recent heart rate data (within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentHeartRate = heartRates
      .filter(hr => new Date(hr.timestamp) >= tenMinutesAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const isConnected = !!recentHeartRate;

    res.json({
      user_id: userId,
      is_connected: isConnected,
      last_heart_rate: recentHeartRate ? {
        bpm: recentHeartRate.bpm,
        timestamp: recentHeartRate.timestamp
      } : null
    });

  } catch (error) {
    console.error('Watch status error:', error);
    res.status(500).json({ error: 'Failed to check watch status' });
  }
});

// POST /api/health/trigger-sync/:userId - Trigger a sync request from Apple Watch
router.post('/trigger-sync/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const redis = getRedisClient(req);

    // Store a sync request flag in Redis that the iOS app can poll
    const syncRequest = {
      userId,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await redis.set(`sync-request:${userId}`, JSON.stringify(syncRequest), {
      EX: 300 // Expire after 5 minutes
    });

    // Return current data immediately
    const heartRates = await getFromRedis(redis, `heartrates:${userId}`);
    const activities = await getFromRedis(redis, `activities:${userId}`);
    const steps = await getFromRedis(redis, `steps:${userId}`);

    const currentHeartRate = heartRates.length > 0 ? 
      heartRates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;

    console.log(`📱 Sync request triggered for ${userId}`);

    res.json({
      success: true,
      message: 'Sync request sent to Apple Watch',
      sync_requested_at: syncRequest.requestedAt,
      current_data: {
        heart_rate: currentHeartRate,
        activities_count: activities.length,
        steps_count: steps.length
      },
      note: 'iOS app will sync data in background'
    });

  } catch (error) {
    console.error('Trigger sync error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to trigger sync',
      message: error.message 
    });
  }
});

// GET /api/health/sync-status/:userId - Check if there's a pending sync request
router.get('/sync-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const redis = getRedisClient(req);

    const syncRequestData = await redis.get(`sync-request:${userId}`);
    const syncRequest = syncRequestData ? JSON.parse(syncRequestData) : null;

    res.json({
      user_id: userId,
      has_pending_sync: !!syncRequest,
      sync_request: syncRequest
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

// GET /api/health/test - Health check
router.get('/test', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Health API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
