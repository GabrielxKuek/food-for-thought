import React, { useState, useEffect } from 'react';
import { ActivitySession } from '../types';
import AppleWatchService from '../services/AppleWatchService';
import { useHealth } from '../context/HealthContext';
import HeartRateGraph from './HeartRateGraph';
import './ActivityTracker.css';

interface ActivityTrackerProps {
  userId: string;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivitySession[]>([]);
  const [connectionMethod, setConnectionMethod] = useState<'backend' | 'bluetooth' | 'simulator'>('simulator');
  const [watchService] = useState(() => 
    new AppleWatchService(process.env.REACT_APP_API_URL || 'http://localhost:8080', userId)
  );
  
  // Use Health Context
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

  const loadTodayActivities = React.useCallback(() => {
    // Mock data - replace with actual API call
    const mockActivities: ActivitySession[] = [
      {
        userId,
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date(Date.now() - 1800000).toISOString(),
        activity_level: 'moderate',
        estimated_calories_burned: 180
      },
      {
        userId,
        start: new Date(Date.now() - 7200000).toISOString(),
        end: new Date(Date.now() - 5400000).toISOString(),
        activity_level: 'light',
        estimated_calories_burned: 95
      }
    ];
    
    setActivities(mockActivities);
  }, [userId]);

  const checkWatchConnection = React.useCallback(() => {
    setIsConnected(true);
    
    // Start periodic heart rate simulation
    const interval = setInterval(async () => {
      if (connectionMethod === 'simulator') {
        const mockHeartRate = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
        setCurrentHeartRate(mockHeartRate);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionMethod]);

  useEffect(() => {
    // Check watch connection
    const cleanup = checkWatchConnection();
    
    // Load today's activities
    loadTodayActivities();

    // Start periodic sync if backend mode
    let stopSync: (() => void) | undefined;
    if (connectionMethod === 'backend') {
      stopSync = watchService.startPeriodicSync(30000); // Every 30 seconds
    }
    
    return () => {
      cleanup();
      if (stopSync) stopSync();
    };
  }, [userId, loadTodayActivities, checkWatchConnection, connectionMethod, watchService]);

  const syncWithAppleWatch = async () => {
    try {
      setIsConnected(false);
      
      if (connectionMethod === 'bluetooth') {
        // Try Bluetooth connection
        const connected = await watchService.connectViaBluetooth();
        if (connected) {
          setIsConnected(true);
          updateSyncTime();
          alert('✅ Connected via Bluetooth!');
        } else {
          alert('❌ Bluetooth connection failed. Make sure your device supports Web Bluetooth.');
        }
      } else if (connectionMethod === 'backend') {
        // Sync from REAL backend API (iOS app data)
        try {
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
          
          // Store activities in context
          if (data.activities && data.activities.length > 0) {
            addActivitiesToContext(data.activities);
            
            const realActivities: ActivitySession[] = data.activities.map((activity: any) => ({
              userId,
              start: activity.start,
              end: activity.end,
              activity_level: mapActivityType(activity.activity_type),
              estimated_calories_burned: activity.calories_burned
            }));
            setActivities(realActivities);
          }
          
          // Store steps in context
          if (data.steps && data.steps.length > 0) {
            addSteps(data.steps);
          }
          
          updateSyncTime();
          alert(`✅ Synced from backend!\n${data.summary.total_activities} activities, ${data.summary.total_calories_burned} calories burned, ${data.heart_rates?.length || 0} heart rate readings`);
        } catch (error) {
          console.error('Backend sync error:', error);
          alert('❌ Backend sync failed. Make sure:\n1. Flask backend is running\n2. iOS app has synced data\n3. API URL is correct');
        }
      } else {
        // Simulator mode
        const data = await watchService.simulateWatchConnection();
        setIsConnected(true);
        if (data.heartRate) {
          setCurrentHeartRate(data.heartRate);
          // Add simulated heart rate data
          const now = new Date();
          const simulatedHeartRates = Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(now.getTime() - (20 - i) * 60000).toISOString(),
            bpm: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
            source: 'Simulator'
          }));
          addHeartRates(simulatedHeartRates);
        }
        // Convert simulated data to activities
        if (data.activities) {
          const newActivities: ActivitySession[] = data.activities.map(activity => ({
            userId,
            start: activity.start,
            end: activity.end,
            activity_level: activity.type as any,
            estimated_calories_burned: activity.caloriesBurned
          }));
          setActivities(prev => [...newActivities, ...prev]);
        }
        updateSyncTime();
        alert('✅ Demo mode: Simulated Apple Watch data!');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Sync failed. Check console for details.');
    }
  };

  // Helper function to map backend activity types to our activity levels
  const mapActivityType = (activityType: string): string => {
    const activityMap: { [key: string]: string } = {
      'running': 'vigorous',
      'cycling': 'vigorous',
      'swimming': 'vigorous',
      'walking': 'moderate',
      'yoga': 'light',
      'strength_training': 'moderate',
      'other': 'light'
    };
    return activityMap[activityType] || 'moderate';
  };

  const connectBluetooth = async () => {
    try {
      const connected = await watchService.connectViaBluetooth();
      if (connected) {
        setConnectionMethod('bluetooth');
        setIsConnected(true);
        alert('✅ Bluetooth heart rate monitor connected!\n\nReal-time heart rate will now update automatically.');
      } else {
        alert('❌ Failed to connect. Make sure:\n- Your device supports Web Bluetooth\n- Heart rate monitor is nearby\n- You granted permissions');
      }
    } catch (error) {
      alert('❌ Bluetooth not available on this device');
    }
  };

  const getActivityIcon = (level: string) => {
    switch (level) {
      case 'vigorous':
        return '🏃‍♂️';
      case 'moderate':
        return '🚶‍♂️';
      case 'light':
        return '🧘‍♂️';
      default:
        return '😴';
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'vigorous':
        return '#ff6b6b';
      case 'moderate':
        return '#feca57';
      case 'light':
        return '#48dbfb';
      default:
        return '#dfe6e9';
    }
  };

  const totalCaloriesBurned = activities.reduce(
    (sum, activity) => sum + activity.estimated_calories_burned,
    0
  );

  return (
    <div className="activity-tracker">
      <h2>💪 Activity Tracker</h2>

      <div className="watch-connection">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? '⌚ Apple Watch Connected' : '⌚ Apple Watch Disconnected'}
          <span className="connection-mode">({connectionMethod})</span>
        </div>
        <div className="connection-buttons">
          <button className="button" onClick={syncWithAppleWatch}>
            🔄 Sync Now
          </button>
          <button className="button secondary" onClick={connectBluetooth}>
            🔗 Connect Bluetooth
          </button>
        </div>
      </div>

      <div className="connection-options">
        <label>
          <input
            type="radio"
            value="simulator"
            checked={connectionMethod === 'simulator'}
            onChange={(e) => setConnectionMethod(e.target.value as any)}
          />
          🎮 Demo Mode (Simulated)
        </label>
        <label>
          <input
            type="radio"
            value="bluetooth"
            checked={connectionMethod === 'bluetooth'}
            onChange={(e) => setConnectionMethod(e.target.value as any)}
          />
          🔗 Bluetooth Heart Rate Monitor
        </label>
        <label>
          <input
            type="radio"
            value="backend"
            checked={connectionMethod === 'backend'}
            onChange={(e) => setConnectionMethod(e.target.value as any)}
          />
          📡 Backend API (Native iOS App)
        </label>
      </div>

      {isConnected && currentHeartRate && (
        <div className="heart-rate-monitor">
          <div className="heart-rate-display">
            <div className="heart-icon">❤️</div>
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

      {/* Heart Rate Graph */}
      <HeartRateGraph timeRange="hour" />

      <div className="card">
        <h3>Today's Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-icon">🔥</div>
            <div className="summary-content">
              <div className="summary-label">Calories Burned</div>
              <div className="summary-value">{totalCaloriesBurned} kcal</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">⏱️</div>
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
          <p className="empty-state">No activities recorded yet today. Get moving!</p>
        ) : (
          activities.map((activity, index) => {
            const startTime = new Date(activity.start);
            const endTime = new Date(activity.end);
            const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

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
                    <h4>{activity.activity_level.charAt(0).toUpperCase() + activity.activity_level.slice(1)} Activity</h4>
                    <span className="activity-time">
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
