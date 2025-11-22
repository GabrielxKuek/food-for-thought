import React, { useState, useEffect } from 'react';
import { ActivitySession } from '../types';
import { useHealth } from '../context/HealthContext';
import HeartRateGraph from './HeartRateGraph';
import { Heart, Flame, Clock, Watch, RefreshCw, Bluetooth, Gamepad2, Radio, Zap, PersonStanding, Activity } from 'lucide-react';
import './ActivityTracker.css';

interface ActivityTrackerProps {
  userId: string;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivitySession[]>([]);
  
  const {
    currentHeartRate,
    isWatchConnected: isConnected,
    setCurrentHeartRate,
    setWatchConnected: setIsConnected,
    addHeartRates,
    addActivities: addActivitiesToContext,
    addSteps,
    updateSyncTime,
  } = useHealth();

  // Load data from backend API
  const loadDataFromBackend = React.useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}`);
      
      if (!response.ok) {
        console.error(`Backend returned ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      console.log('📥 Loaded data from Redis:', data);
      
      // Store heart rate data in context
      if (data.heart_rates && data.heart_rates.length > 0) {
        addHeartRates(data.heart_rates.map((hr: any) => ({
          timestamp: hr.timestamp,
          bpm: hr.bpm,
          source: hr.source || 'Apple Watch'
        })));
        console.log(`✅ Loaded ${data.heart_rates.length} heart rate readings`);
      }
      
      // Update current heart rate
      if (data.current_heart_rate) {
        setCurrentHeartRate(data.current_heart_rate.bpm);
      }
      
      // Store activities in context
      if (data.activities && data.activities.length > 0) {
        addActivitiesToContext(data.activities);
        
        const realActivities: ActivitySession[] = data.activities.map((activity: any) => ({
          userId,
          start: activity.start,
          end: activity.end,
          activity_level: mapActivityType(activity.activityType),
          estimated_calories_burned: activity.caloriesBurned,
          activity_type: activity.activityType,
          avg_heart_rate: activity.avgHeartRate,
          distance_meters: activity.distanceMeters
        } as any));
        setActivities(realActivities);
        console.log(`✅ Loaded ${realActivities.length} activities`);
      }
      
      // Store steps in context
      if (data.steps && data.steps.length > 0) {
        addSteps(data.steps);
      }
      
      updateSyncTime();
    } catch (error) {
      console.error('Failed to load data from backend:', error);
    }
  }, [userId, addHeartRates, setCurrentHeartRate, addActivitiesToContext, addSteps, updateSyncTime]);

  useEffect(() => {
    // Auto-load data on mount
    setIsConnected(true);
    loadDataFromBackend();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadDataFromBackend();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [loadDataFromBackend, setIsConnected]);

  const syncWithAppleWatch = async () => {
    try {
      // Simply fetch data from Redis and display it
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      
      const data = await response.json();
      setIsConnected(true);
      
      // Store heart rate data in context
      if (data.heart_rates && data.heart_rates.length > 0) {
        addHeartRates(data.heart_rates.map((hr: any) => ({
          timestamp: hr.timestamp,
          bpm: hr.bpm,
          source: hr.source || 'Apple Watch'
        })));
      }
      
      // Update current heart rate
      if (data.current_heart_rate) {
        setCurrentHeartRate(data.current_heart_rate.bpm);
      }
      
      // Store activities with correct Redis field names
      if (data.activities && data.activities.length > 0) {
        addActivitiesToContext(data.activities);
        
        const realActivities: ActivitySession[] = data.activities.map((activity: any) => ({
          userId,
          start: activity.start,
          end: activity.end,
          activity_level: mapActivityType(activity.activityType),
          estimated_calories_burned: activity.caloriesBurned,
          activity_type: activity.activityType,
          avg_heart_rate: activity.avgHeartRate,
          distance_meters: activity.distanceMeters
        } as any));
        setActivities(realActivities);
      }
      
      // Store steps in context
      if (data.steps && data.steps.length > 0) {
        addSteps(data.steps);
      }
      
      updateSyncTime();
      alert(`✅ Loaded from Redis!\n${data.summary.total_heart_rates || 0} heart rates\n${data.summary.total_activities || 0} activities\n${data.summary.total_calories_burned || 0} calories burned`);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('❌ Failed to load data. Make sure backend is running.');
      setIsConnected(false);
    }
  };

  const mapActivityType = (activityType: string): string => {
    const activityMap: { [key: string]: string } = {
      'RUNNING': 'vigorous',
      'CYCLING': 'vigorous',
      'SWIMMING': 'vigorous',
      'WALKING': 'moderate',
      'YOGA': 'light',
      'STRENGTH_TRAINING': 'vigorous',
      'CROSS_TRAINING': 'vigorous',
      'HIKING': 'moderate',
      'DANCE': 'moderate',
      'ELLIPTICAL': 'moderate',
      'STAIRS': 'vigorous',
      'ROWING': 'vigorous',
      'OTHER': 'light'
    };
    return activityMap[activityType?.toUpperCase()] || 'moderate';
  };

  const getActivityIcon = (level: string) => {
    switch (level) {
      case 'vigorous':
        return <Zap size={18} />;
      case 'moderate':
        return <PersonStanding size={18} />;
      case 'light':
        return <Activity size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'vigorous':
        return '#111827';
      case 'moderate':
        return '#6b7280';
      case 'light':
        return '#d1d5db';
      default:
        return '#e5e7eb';
    }
  };

  const totalCaloriesBurned = activities.reduce(
    (sum, activity) => sum + activity.estimated_calories_burned,
    0
  );

  return (
    <div className="activity-tracker">
      <h2>Activity Tracker</h2>

      <div className="watch-connection">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? '⌚ Apple Watch Connected' : '⌚ Apple Watch Disconnected'}
        </div>
        <div className="connection-buttons">
          <button className="button" onClick={syncWithAppleWatch}>
            <RefreshCw size={14} />
            Sync
          </button>
        </div>
      </div>

      {isConnected && currentHeartRate && (
        <div className="heart-rate-monitor">
          <div className="heart-rate-display">
            <div className="heart-icon">
              <Heart size={32} fill="#ef4444" />
            </div>
            <div className="heart-rate-value">
              <span className="bpm">{currentHeartRate}</span>
              <span className="bpm-label">BPM</span>
            </div>
          </div>
          <div className="heart-rate-status">
            <span>Real-time Heart Rate</span>
          </div>
        </div>
      )}

      <HeartRateGraph timeRange="hour" />

      <div className="card">
        <h3>Today's Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-icon">
              <Flame size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Calories Burned</div>
              <div className="summary-value">{totalCaloriesBurned} kcal</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">
              <Clock size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Active Sessions</div>
              <div className="summary-value">{activities.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="activities-list">
        <h3>Activity Sessions</h3>
        {activities.length === 0 ? (
          <p className="empty-state">No activities recorded yet. Click "Sync Now" to load your activities.</p>
        ) : (
          activities.map((activity, index) => {
            const startTime = new Date(activity.start);
            const endTime = new Date(activity.end);
            const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
            
            // Get full activity details
            const activityType = (activity as any).activity_type || activity.activity_level;
            const avgHeartRate = (activity as any).avg_heart_rate;
            const distance = (activity as any).distance_meters;

            return (
              <div 
                key={index} 
                className="activity-item"
                style={{ borderLeftColor: getActivityColor(activity.activity_level) }}
              >
                <div className="activity-header">
                  <div className="activity-icon">
                    {getActivityIcon(activity.activity_level)}
                  </div>
                  <div className="activity-info">
                    <h4>{activityType.replace(/_/g, ' ').toUpperCase()}</h4>
                    <span className="activity-time">
                      {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="activity-stats">
                  <div className="stat">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">{duration} min</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Calories</span>
                    <span className="stat-value">{activity.estimated_calories_burned} kcal</span>
                  </div>
                  {avgHeartRate && (
                    <div className="stat">
                      <span className="stat-label">Avg HR</span>
                      <span className="stat-value">{avgHeartRate} BPM</span>
                    </div>
                  )}
                  {distance && (
                    <div className="stat">
                      <span className="stat-label">Distance</span>
                      <span className="stat-value">{(distance / 1000).toFixed(2)} km</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;