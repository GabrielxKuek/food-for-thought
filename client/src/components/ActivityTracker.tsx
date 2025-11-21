import React, { useState, useEffect } from 'react';
import { ActivitySession, HeartRateLog } from '../types';
import './ActivityTracker.css';

interface ActivityTrackerProps {
  userId: string;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivitySession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);

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

  useEffect(() => {
    // Simulate Apple Watch connection
    checkWatchConnection();
    
    // Load today's activities
    loadTodayActivities();
  }, [userId, loadTodayActivities]);

  const checkWatchConnection = () => {
    // Mock connection check - replace with actual Apple Watch API
    setIsConnected(true);
    
    // Simulate real-time heart rate
    const interval = setInterval(() => {
      const mockHeartRate = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
      setCurrentHeartRate(mockHeartRate);
    }, 2000);

    return () => clearInterval(interval);
  };



  const syncWithAppleWatch = async () => {
    // Mock sync - replace with actual Apple Watch sync
    alert('Syncing with Apple Watch... (Feature coming soon!)');
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
        </div>
        <button className="button" onClick={syncWithAppleWatch}>
          🔄 Sync Now
        </button>
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
