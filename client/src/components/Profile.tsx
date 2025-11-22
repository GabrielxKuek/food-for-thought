import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Pencil, Check, X } from 'lucide-react';
import './Profile.css';

interface ProfileProps {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(
    userProfile || {
      userId: 'user_001',
      profile: {
        age: 25,
        sex: 'male',
        height_cm: 175,
        initial_weight_kg: 70
      },
      goal: {
        type: 'maintenance',
        weekly_target_kg: 0,
        macro_goals: {
          carbs_g: 250,
          protein_g: 150,
          fat_g: 70
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile(formData);
    setIsEditing(false);
  };

  const calculateBMI = (): number => {
    if (!userProfile) return 0;
    const heightM = userProfile.profile.height_cm / 100;
    return parseFloat((userProfile.profile.initial_weight_kg / (heightM * heightM)).toFixed(1));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'weight_loss': return 'Weight Loss';
      case 'weight_gain': return 'Weight Gain';
      case 'maintenance': return 'Maintenance';
      default: return type;
    }
  };

  return (
    <div className="profile">
      <h2>Profile</h2>

      {!isEditing ? (
        <>
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={20} />
              </div>
              <div className="profile-info">
                <h3>User Profile</h3>
                <p>{userProfile?.userId}</p>
              </div>
              <button className="button" onClick={() => setIsEditing(true)}>
                <Pencil size={14} />
                Edit
              </button>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Age</span>
                <span className="stat-value">{userProfile?.profile.age} yrs</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Height</span>
                <span className="stat-value">{userProfile?.profile.height_cm} cm</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Weight</span>
                <span className="stat-value">{userProfile?.profile.initial_weight_kg} kg</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">BMI</span>
                <span className="stat-value">{bmi} ({bmiCategory})</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Fitness Goal</h3>
            <div className="goal-info">
              <div className="goal-type">
                <strong>Goal:</strong> {getGoalTypeLabel(userProfile?.goal.type || '')}
              </div>
              <div className="goal-target">
                <strong>Weekly Target:</strong>{' '}
                {userProfile?.goal.weekly_target_kg === 0
                  ? 'Maintain current weight'
                  : `${Math.abs(userProfile?.goal.weekly_target_kg || 0)} kg/week`}
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Daily Macro Goals</h3>
            <div className="macro-goals">
              <div className="macro-goal-item">
                <div className="macro-name">Carbs</div>
                <div className="macro-amount">{userProfile?.goal.macro_goals.carbs_g}g</div>
              </div>
              <div className="macro-goal-item">
                <div className="macro-name">Protein</div>
                <div className="macro-amount">{userProfile?.goal.macro_goals.protein_g}g</div>
              </div>
              <div className="macro-goal-item">
                <div className="macro-name">Fat</div>
                <div className="macro-amount">{userProfile?.goal.macro_goals.fat_g}g</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="card">
            <h3>Personal Information</h3>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.profile.age}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, age: parseInt(e.target.value) }
                  })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Sex</label>
                <select
                  value={formData.profile.sex}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, sex: e.target.value as 'male' | 'female' }
                  })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="input-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  value={formData.profile.height_cm}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, height_cm: parseInt(e.target.value) }
                  })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.profile.initial_weight_kg}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, initial_weight_kg: parseFloat(e.target.value) }
                  })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Fitness Goals</h3>
            
            <div className="input-group">
              <label>Goal Type</label>
              <select
                value={formData.goal.type}
                onChange={(e) => setFormData({
                  ...formData,
                  goal: { ...formData.goal, type: e.target.value as any }
                })}
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="weight_gain">Weight Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="input-group">
              <label>Weekly Target (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.goal.weekly_target_kg}
                onChange={(e) => setFormData({
                  ...formData,
                  goal: { ...formData.goal, weekly_target_kg: parseFloat(e.target.value) }
                })}
              />
            </div>

            <h4>Macro Goals (Daily)</h4>
            <div className="form-grid">
              <div className="input-group">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  value={formData.goal.macro_goals.carbs_g}
                  onChange={(e) => setFormData({
                    ...formData,
                    goal: {
                      ...formData.goal,
                      macro_goals: { ...formData.goal.macro_goals, carbs_g: parseInt(e.target.value) }
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Protein (g)</label>
                <input
                  type="number"
                  value={formData.goal.macro_goals.protein_g}
                  onChange={(e) => setFormData({
                    ...formData,
                    goal: {
                      ...formData.goal,
                      macro_goals: { ...formData.goal.macro_goals, protein_g: parseInt(e.target.value) }
                    }
                  })}
                />
              </div>

              <div className="input-group">
                <label>Fat (g)</label>
                <input
                  type="number"
                  value={formData.goal.macro_goals.fat_g}
                  onChange={(e) => setFormData({
                    ...formData,
                    goal: {
                      ...formData.goal,
                      macro_goals: { ...formData.goal.macro_goals, fat_g: parseInt(e.target.value) }
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="button success">
              <Check size={14} />
              Save Changes
            </button>
            <button type="button" className="button secondary" onClick={() => setIsEditing(false)}>
              <X size={14} />
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;