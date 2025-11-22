#!/usr/bin/env node
/**
 * Test script to retrieve and display heart rate data from Redis
 * Usage: node test-redis.js [userId]
 */

require('dotenv').config();
const redis = require('redis');

async function testRedis() {
  const userId = process.argv[2] || 'user123';
  
  console.log('🔌 Connecting to Redis...');
  console.log(`📍 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  
  // Create Redis client
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      tls: process.env.REDIS_URL?.startsWith('rediss://'),
      rejectUnauthorized: false
    }
  });

  client.on('error', (err) => console.error('❌ Redis Client Error:', err));
  client.on('connect', () => console.log('✅ Connected to Redis'));

  try {
    await client.connect();
    
    console.log(`\n🔍 Fetching data for userId: ${userId}`);
    console.log('='.repeat(60));
    
    // Get heart rates
    const heartRatesKey = `heartrates:${userId}`;
    const heartRatesData = await client.get(heartRatesKey);
    
    if (heartRatesData) {
      const heartRates = JSON.parse(heartRatesData);
      console.log(`\n❤️  HEART RATES (${heartRates.length} readings):`);
      console.log('='.repeat(60));
      
      if (heartRates.length > 0) {
        // Show first 10 and last 10
        const displayCount = Math.min(10, heartRates.length);
        
        console.log('\n📊 Latest readings:');
        heartRates.slice(-displayCount).reverse().forEach((hr, index) => {
          const date = new Date(hr.timestamp);
          console.log(`  ${index + 1}. ${hr.bpm} BPM at ${date.toLocaleString()} (${hr.source || 'Unknown'})`);
        });
        
        if (heartRates.length > 10) {
          console.log(`\n  ... (${heartRates.length - 10} more readings)`);
        }
        
        // Calculate stats
        const bpms = heartRates.map(hr => hr.bpm);
        const avgBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
        const minBpm = Math.min(...bpms);
        const maxBpm = Math.max(...bpms);
        
        console.log('\n📈 Statistics:');
        console.log(`  Average BPM: ${avgBpm}`);
        console.log(`  Min BPM: ${minBpm}`);
        console.log(`  Max BPM: ${maxBpm}`);
        console.log(`  Total readings: ${heartRates.length}`);
        
        // Get oldest and newest timestamps
        const oldestDate = new Date(heartRates[0].timestamp);
        const newestDate = new Date(heartRates[heartRates.length - 1].timestamp);
        console.log(`  Date range: ${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`);
      } else {
        console.log('  No heart rate data found.');
      }
    } else {
      console.log(`\n❌ No data found for key: ${heartRatesKey}`);
    }
    
    // Get activities
    const activitiesKey = `activities:${userId}`;
    const activitiesData = await client.get(activitiesKey);
    
    if (activitiesData) {
      const activities = JSON.parse(activitiesData);
      console.log(`\n\n🏃 ACTIVITIES (${activities.length} activities):`);
      console.log('='.repeat(60));
      
      if (activities.length > 0) {
        activities.slice(-5).reverse().forEach((act, index) => {
          const startDate = new Date(act.start);
          console.log(`\n  ${index + 1}. ${act.activityType.toUpperCase()}`);
          console.log(`     Duration: ${act.durationMinutes} min`);
          console.log(`     Calories: ${act.caloriesBurned} kcal`);
          console.log(`     Start: ${startDate.toLocaleString()}`);
          if (act.avgHeartRate) {
            console.log(`     Avg HR: ${act.avgHeartRate} BPM`);
          }
          if (act.distanceMeters) {
            console.log(`     Distance: ${(act.distanceMeters / 1000).toFixed(2)} km`);
          }
        });
      } else {
        console.log('  No activities found.');
      }
    } else {
      console.log(`\n❌ No activities found for key: ${activitiesKey}`);
    }
    
    // Get steps
    const stepsKey = `steps:${userId}`;
    const stepsData = await client.get(stepsKey);
    
    if (stepsData) {
      const steps = JSON.parse(stepsData);
      console.log(`\n\n👣 STEPS (${steps.length} days):`);
      console.log('='.repeat(60));
      
      if (steps.length > 0) {
        const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
        const totalDistance = steps.reduce((sum, s) => sum + (s.distanceMeters || 0), 0);
        
        steps.slice(-7).reverse().forEach((step, index) => {
          console.log(`  ${step.date}: ${step.steps.toLocaleString()} steps (${(step.distanceMeters / 1000).toFixed(2)} km)`);
        });
        
        console.log(`\n  Total: ${totalSteps.toLocaleString()} steps`);
        console.log(`  Total Distance: ${(totalDistance / 1000).toFixed(2)} km`);
      } else {
        console.log('  No steps data found.');
      }
    } else {
      console.log(`\n❌ No steps found for key: ${stepsKey}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.quit();
    console.log('👋 Disconnected from Redis');
  }
}

// Run the test
testRedis();
