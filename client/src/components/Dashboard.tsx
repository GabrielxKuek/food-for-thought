import React from 'react';
import { UserProfile } from '../types';
import { useHealth } from '../context/HealthContext';
import { calculateTDEE, calculateCalorieTarget } from '../utils/calorieCalculations';
import './Dashboard.css';

interface DashboardProps {
  userId: string;
  userProfile: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, userProfile }) => {
  const { dailySummary, weightEntries } = useHealth();

  // Calculate TDEE and target from user profile
  const tdee = userProfile ? Math.round(calculateTDEE(userProfile.profile)) : 2200;
  const calorieTarget = userProfile ? Math.round(calculateCalorieTarget(userProfile)) : 2200;

  const calorieBalance = dailySummary.calories_consumed - calorieTarget + dailySummary.calories_burned;
  const calorieProgress = (dailySummary.calories_consumed / calorieTarget) * 100;

  // Get recent weights (last 3)
  const recentWeights = [...weightEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(entry => ({
      userId,
      date: entry.date,
      weight_kg: entry.weight
    }));

  return (
    <div className="dashboard">
      <h2>Today's Overview</h2>
      
      <div className="grid">
        <div className="stat-box">
          <h4>Calories Consumed</h4>
          <div className="value">{dailySummary.calories_consumed}</div>
          <small>kcal</small>
        </div>

        <div className="stat-box">
          <h4>Calories Burned</h4>
          <div className="value">{dailySummary.calories_burned}</div>
          <small>kcal</small>
        </div>

        <div className="stat-box">
          <h4>Daily Target</h4>
          <div className="value">{calorieTarget}</div>
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