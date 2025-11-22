import React, { useState, useEffect } from 'react';
import { UserProfile, DailyEnergySummary, WeightLog } from '../types';
import './Dashboard.css';

interface DashboardProps {
  userId: string;
  userProfile: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, userProfile }) => {
  const [dailySummary, setDailySummary] = useState<DailyEnergySummary | null>(null);
  const [recentWeights, setRecentWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for demo - replace with actual API calls
      setDailySummary({
        userId,
        date: new Date().toISOString().split('T')[0],
        calories_consumed: 1850,
        calories_burned: 450,
        tdee_estimate: 2200
      });

      setRecentWeights([
        { userId, date: '2025-11-20', weight_kg: 69.5 },
        { userId, date: '2025-11-18', weight_kg: 70.0 },
        { userId, date: '2025-11-15', weight_kg: 70.2 }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const calorieBalance = dailySummary 
    ? dailySummary.calories_consumed - dailySummary.tdee_estimate + dailySummary.calories_burned
    : 0;

  const calorieProgress = dailySummary
    ? (dailySummary.calories_consumed / dailySummary.tdee_estimate) * 100
    : 0;

  return (
    <div className="dashboard">
      <h2>Today's Overview</h2>
      
      <div className="grid">
        <div className="stat-box">
          <h4>Calories Consumed</h4>
          <div className="value">{dailySummary?.calories_consumed || 0}</div>
          <small>kcal</small>
        </div>

        <div className="stat-box">
          <h4>Calories Burned</h4>
          <div className="value">{dailySummary?.calories_burned || 0}</div>
          <small>kcal</small>
        </div>

        <div className="stat-box">
          <h4>Daily Target</h4>
          <div className="value">{dailySummary?.tdee_estimate || 0}</div>
          <small>kcal</small>
        </div>

        <div className="stat-box">
          <h4>Net Balance</h4>
          <div className="value" style={{ color: calorieBalance > 0 ? '#feca57' : '#43e97b' }}>
            {calorieBalance > 0 ? '+' : ''}{Math.round(calorieBalance)}
          </div>
          <small>kcal</small>
        </div>
      </div>

      <div className="card">
        <h3>Calorie Progress</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(calorieProgress, 100)}%` }}>
            {Math.round(calorieProgress)}%
          </div>
        </div>
      </div>

      {userProfile && (
        <div className="card">
          <h3>Macro Goals (Daily)</h3>
          <div className="macro-grid">
            <div className="macro-item">
              <div className="macro-label">Carbs</div>
              <div className="macro-value">{userProfile.goal.macro_goals.carbs_g}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label">Protein</div>
              <div className="macro-value">{userProfile.goal.macro_goals.protein_g}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label">Fat</div>
              <div className="macro-value">{userProfile.goal.macro_goals.fat_g}g</div>
            </div>
          </div>
        </div>
      )}

      {recentWeights.length > 0 && (
        <div className="card">
          <h3>Recent Weight Logs</h3>
          <div className="weight-list">
            {recentWeights.map((log, index) => (
              <div key={index} className="weight-item">
                <span className="weight-date">{log.date}</span>
                <span className="weight-value">{log.weight_kg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
