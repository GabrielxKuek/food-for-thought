import React, { useState, useEffect } from 'react';
import { ActivitySession } from '../types';
import AppleWatchService from '../services/AppleWatchService';
import { useHealth } from '../context/HealthContext';
import HeartRateGraph from './HeartRateGraph';
import { Heart, Flame, Clock, Watch, RefreshCw, Bluetooth, Gamepad2, Radio, Zap, PersonStanding, Activity } from 'lucide-react';
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
    
    const interval = setInterval(async () => {
      if (connectionMethod === 'simulator') {
        const mockHeartRate = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
        setCurrentHeartRate(mockHeartRate);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionMethod, setIsConnected, setCurrentHeartRate]);

  useEffect(() => {
    const cleanup = checkWatchConnection();
    loadTodayActivities();

    let stopSync: (() => void) | undefined;
    if (connectionMethod === 'backend') {
      stopSync = watchService.startPeriodicSync(30000);
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
        const connected = await watchService.connectViaBluetooth();
        if (connected) {
          setIsConnected(true);
          updateSyncTime();
          alert('Connected via Bluetooth');
        } else {
          alert('Bluetooth connection failed. Make sure your device supports Web Bluetooth.');
        }
      } else if (connectionMethod === 'backend') {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/health/${userId}`);
          
          if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
          }
          
          const data = await response.json();
          setIsConnected(true);
          
          if (data.heart_rates && data.heart_rates.length > 0) {
            addHeartRates(data.heart_rates.map((hr: any) => ({
              timestamp: hr.timestamp,
              bpm: hr.bpm,
              source: hr.source || 'Apple Watch'
            })));
          }
          
          if (data.current_heart_rate) {
            setCurrentHeartRate(data.current_heart_rate.bpm);
          }
          
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
          
          if (data.steps && data.steps.length > 0) {
            addSteps(data.steps);
          }
          
          updateSyncTime();
          alert(`Synced from backend: ${data.summary.total_activities} activities, ${data.summary.total_calories_burned} calories burned`);
        } catch (error) {
          console.error('Backend sync error:', error);
          alert('Backend sync failed. Make sure the server is running.');
        }
      } else {
        const data = await watchService.simulateWatchConnection();
        setIsConnected(true);
        if (data.heartRate) {
          setCurrentHeartRate(data.heartRate);
          const now = new Date();
          const simulatedHeartRates = Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(now.getTime() - (20 - i) * 60000).toISOString(),
            bpm: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
            source: 'Simulator'
          }));
          addHeartRates(simulatedHeartRates);
        }
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
        alert('Demo mode: Simulated data loaded');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Check console for details.');
    }
  };

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
        alert('Bluetooth heart rate monitor connected');
      } else {
        alert('Failed to connect. Make sure your device supports Web Bluetooth.');
      }
    } catch (error) {
      alert('Bluetooth not available on this device');
    }
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
          <Watch size={16} />
          {isConnected ? 'Connected' : 'Disconnected'}
          <span className="connection-mode">({connectionMethod})</span>
        </div>
        <div className="connection-buttons">
          <button className="button" onClick={syncWithAppleWatch}>
            <RefreshCw size={14} />
            Sync
          </button>
          <button className="button secondary" onClick={connectBluetooth}>
            <Bluetooth size={14} />
            Bluetooth
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
          <Gamepad2 size={16} />
          Demo Mode
        </label>
        <label>
          <input
            type="radio"
            value="bluetooth"
            checked={connectionMethod === 'bluetooth'}
            onChange={(e) => setConnectionMethod(e.target.value as any)}
          />
          <Bluetooth size={16} />
          Bluetooth Monitor
        </label>
        <label>
          <input
            type="radio"
            value="backend"
            checked={connectionMethod === 'backend'}
            onChange={(e) => setConnectionMethod(e.target.value as any)}
          />
          <Radio size={16} />
          Backend API
        </label>
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
          <p className="empty-state">No activities recorded yet today</p>
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
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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