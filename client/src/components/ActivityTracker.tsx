import React, { useState, useEffect } from 'react';
import { ActivitySession } from '../types';
import { useHealth } from '../context/HealthContext';
import { Heart, Flame, Clock, Watch, RefreshCw, Zap, PersonStanding, Activity } from 'lucide-react';
import './ActivityTracker.css';

interface ActivityTrackerProps {
  userId?: string;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId = 'user123' }) => {
  const [activities, setActivities] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
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

  // Simulated heart rate for demo/presentation - fluctuates realistically
  useEffect(() => {
    // Always use simulated data for presentation - don't use real Apple Watch data

    // Base heart rate for moderate intensity workout (120-140 bpm)
    const baseHeartRate = 130;
    const variation = 10; // +/- 10 bpm variation
    
    const simulateHeartRate = () => {
      // Create realistic fluctuation using sine wave + random noise
      const time = Date.now() / 1000; // Current time in seconds
      const sineWave = Math.sin(time / 5) * variation; // Slow sine wave
      const randomNoise = (Math.random() - 0.5) * 5; // Small random variation
      const simulatedBpm = Math.round(baseHeartRate + sineWave + randomNoise);
      
      setCurrentHeartRate(simulatedBpm);
    };

    // Update simulated heart rate every 2 seconds for smooth animation
    simulateHeartRate(); // Set initial value
    const simulationInterval = setInterval(simulateHeartRate, 2000);

    return () => clearInterval(simulationInterval);
  }, [setCurrentHeartRate]);

  useEffect(() => {
    // Set watch as connected immediately for demo
    setIsConnected(true);
    
    // Auto-load data on mount
    const loadData = async () => {
      setIsConnected(true);
      try {
        // Get data for the last 5 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 5);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=200`);
        
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }
        
        const data = await response.json();
        setIsConnected(true);
        
        // Store heart rate data in context (but don't update display - keep simulated for demo)
        if (data.heart_rates && data.heart_rates.length > 0) {
          addHeartRates(data.heart_rates.map((hr: any) => ({
            timestamp: hr.timestamp,
            bpm: hr.bpm,
            source: hr.source || 'Apple Watch'
          })));
          console.log(`✅ Loaded ${data.heart_rates.length} heart rate readings (display uses simulated data)`);
        }

        // Store activities with correct Redis field names (matching API response)
        if (data.activities && data.activities.length > 0) {
          addActivitiesToContext(data.activities);
          
          const realActivities: ActivitySession[] = data.activities.map((activity: any) => ({
            userId,
            start: activity.start,
            end: activity.end,
            activity_level: mapActivityType(activity.activity_type),
            estimated_calories_burned: activity.calories_burned,
            activity_type: activity.activity_type,
            avg_heart_rate: activity.avg_heart_rate,
            distance_meters: activity.distance_meters,
            duration_minutes: activity.duration_minutes
          } as any));

          // Remove duplicates based on start time, activity type, and duration
          const uniqueActivities = removeDuplicateActivities(realActivities);
          setActivities(uniqueActivities);
        }
        
        // Store steps in context
        if (data.steps && data.steps.length > 0) {
          addSteps(data.steps);
        }

        // Update sync time
        if (data.summary?.last_sync) {
          setLastSyncTime(data.summary.last_sync);
        }
        
        updateSyncTime();
      } catch (error) {
        console.error('Failed to load data:', error);
        // Keep watch connected even on error for demo
      }
    };

    // Load initially
    loadData();
    
    // Refresh every 5 seconds for near real-time updates
    const intervalId = setInterval(loadData, 5000);
    
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId to prevent infinite loop

  // Utility function to remove duplicate activities
  const removeDuplicateActivities = (activities: ActivitySession[]): ActivitySession[] => {
    return activities.filter((activity, index, self) => {
      // Create a unique key based on multiple properties
      const activityKey = `${activity.start}-${(activity as any).activity_type}-${(activity as any).duration_minutes || 0}-${activity.estimated_calories_burned}-${(activity as any).avg_heart_rate || 0}`;
      return index === self.findIndex(a => {
        const aKey = `${a.start}-${(a as any).activity_type}-${(a as any).duration_minutes || 0}-${a.estimated_calories_burned}-${(a as any).avg_heart_rate || 0}`;
        return aKey === activityKey;
      });
    });
  };

  const syncWithAppleWatch = async () => {
    setLoading(true);
    try {
      // Get data for the last 5 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=200`);
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }
      
      const data = await response.json();
      setIsConnected(true);
      
      // Store heart rate data in context (but don't update display - keep simulated for demo)
      if (data.heart_rates && data.heart_rates.length > 0) {
        addHeartRates(data.heart_rates.map((hr: any) => ({
          timestamp: hr.timestamp,
          bpm: hr.bpm,
          source: hr.source || 'Apple Watch'
        })));
        console.log(`✅ Synced ${data.heart_rates.length} heart rate readings (display uses simulated data)`);
      }
      
      // Store activities with correct Redis field names (matching API response)
      if (data.activities && data.activities.length > 0) {
        addActivitiesToContext(data.activities);
        
        const realActivities: ActivitySession[] = data.activities.map((activity: any) => ({
          userId,
          start: activity.start,
          end: activity.end,
          activity_level: mapActivityType(activity.activity_type),
          estimated_calories_burned: activity.calories_burned,
          activity_type: activity.activity_type,
          avg_heart_rate: activity.avg_heart_rate,
          distance_meters: activity.distance_meters,
          duration_minutes: activity.duration_minutes
        } as any));

        // Remove duplicates based on start time, activity type, and duration
        const uniqueActivities = removeDuplicateActivities(realActivities);

        setActivities(uniqueActivities);
      }
      
      // Store steps in context
      if (data.steps && data.steps.length > 0) {
        addSteps(data.steps);
      }

      // Update sync time
      if (data.summary?.last_sync) {
        setLastSyncTime(data.summary.last_sync);
      }
      
      updateSyncTime();
      alert(`✅ Loaded from Redis (Last 5 Days)!\n${data.summary.total_heart_rates || 0} heart rates\n${data.summary.total_activities || 0} activities\n${data.summary.total_calories_burned || 0} calories burned`);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('❌ Failed to load data. Make sure backend is running.');
      // Keep watch connected even on error for demo
    } finally {
      setLoading(false);
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

  // Calculate today's activities and stats
  const today = new Date().toDateString();
  const todaysActivities = activities.filter(activity => 
    new Date(activity.start).toDateString() === today
  );
  
  const todaysCalories = todaysActivities.reduce(
    (sum, activity) => sum + activity.estimated_calories_burned,
    0
  );

  // Calculate daily averages over the last 5 days
  const dailyCaloriesMap = new Map();
  const last5Days = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toDateString();
    last5Days.push(dateString);
    dailyCaloriesMap.set(dateString, 0);
  }

  // Group activities by day
  activities.forEach(activity => {
    const activityDate = new Date(activity.start).toDateString();
    if (dailyCaloriesMap.has(activityDate)) {
      dailyCaloriesMap.set(activityDate, 
        dailyCaloriesMap.get(activityDate) + activity.estimated_calories_burned
      );
    }
  });

  const avgDailyCalories = Math.round(
    Array.from(dailyCaloriesMap.values()).reduce((sum, calories) => sum + calories, 0) / 5
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
          <button className="button" onClick={syncWithAppleWatch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            {loading ? 'Syncing...' : 'Sync'}
          </button>
          {lastSyncTime && (
            <small className="last-sync">
              Last sync: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          )}
        </div>
      </div>

      {currentHeartRate && (
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

      <div className="card">
        <h3>Today's Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-icon">
              <Flame size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Today's Calories</div>
              <div className="summary-value">{todaysCalories} kcal</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">
              <Clock size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Today's Sessions</div>
              <div className="summary-value">{todaysActivities.length}</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">
              <Flame size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">5-Day Avg Calories</div>
              <div className="summary-value">{avgDailyCalories} kcal/day</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">
              <Activity size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Sessions (5 days)</div>
              <div className="summary-value">{activities.length}</div>
            </div>
          </div>
          {todaysActivities.length > 0 && (
            <>
              <div className="summary-item">
                <div className="summary-icon">
                  <Watch size={20} />
                </div>
                <div className="summary-content">
                  <div className="summary-label">Today's Duration</div>
                  <div className="summary-value">
                    {todaysActivities.reduce((sum, act) => {
                      const duration = (act as any).duration_minutes || 
                        Math.floor((new Date(act.end).getTime() - new Date(act.start).getTime()) / 60000);
                      return sum + duration;
                    }, 0)} min
                  </div>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">
                  <Heart size={20} />
                </div>
                <div className="summary-content">
                  <div className="summary-label">Today's Avg HR</div>
                  <div className="summary-value">
                    {Math.round(
                      todaysActivities
                        .filter(act => (act as any).avg_heart_rate)
                        .reduce((sum, act) => sum + ((act as any).avg_heart_rate || 0), 0) / 
                      todaysActivities.filter(act => (act as any).avg_heart_rate).length
                    ) || '--'} BPM
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="activities-list">
        <h3>Activity Sessions (Last 5 Days)</h3>
        {activities.length === 0 ? (
          <p className="empty-state">No activities recorded in the last 5 days. Click "Sync" to load your recent activities.</p>
        ) : (
          (() => {
            // Group activities by date
            const activitiesByDate = activities.reduce((groups: { [key: string]: typeof activities }, activity) => {
              const date = new Date(activity.start).toDateString();
              if (!groups[date]) groups[date] = [];
              groups[date].push(activity);
              return groups;
            }, {});

            // Sort dates (most recent first)
            const sortedDates = Object.keys(activitiesByDate).sort((a, b) => 
              new Date(b).getTime() - new Date(a).getTime()
            );

            return sortedDates.map(date => (
              <div key={date} className="day-group">
                <h4 className="day-header">
                  {date === new Date().toDateString() ? 'Today' : new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  <span className="day-stats">
                    {activitiesByDate[date].length} session{activitiesByDate[date].length !== 1 ? 's' : ''} • {' '}
                    {activitiesByDate[date].reduce((sum, act) => sum + act.estimated_calories_burned, 0)} kcal
                  </span>
                </h4>
                {activitiesByDate[date].map((activity, index) => {
                  const startTime = new Date(activity.start);
                  const endTime = new Date(activity.end);
                  
                  // Calculate duration from activity data or timestamps
                  const activityDuration = (activity as any).duration_minutes || 
                    Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
                  
                  // Get full activity details (matching Redis data structure)
                  const activityType = (activity as any).activity_type || activity.activity_level;
                  const avgHeartRate = (activity as any).avg_heart_rate;
                  const distance = (activity as any).distance_meters;
                  const calories = activity.estimated_calories_burned;

                  return (
                    <div 
                      key={`${date}-${index}`} 
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
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="activity-stats">
                        <div className="stat">
                          <span className="stat-label">Duration</span>
                          <span className="stat-value">{activityDuration} min</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Calories</span>
                          <span className="stat-value">{calories} kcal</span>
                        </div>
                        {avgHeartRate && avgHeartRate > 0 && (
                          <div className="stat">
                            <span className="stat-label">Avg HR</span>
                            <span className="stat-value">{avgHeartRate} BPM</span>
                          </div>
                        )}
                        {distance && distance > 0 && (
                          <div className="stat">
                            <span className="stat-label">Distance</span>
                            <span className="stat-value">{(distance / 1000).toFixed(2)} km</span>
                          </div>
                        )}
                      </div>
                      {/* Additional Redis data display */}
                      <div className="activity-details">
                        <small className="activity-meta">
                          End: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {calories > 0 && ` • ${Math.round(calories / activityDuration)} kcal/min`}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;