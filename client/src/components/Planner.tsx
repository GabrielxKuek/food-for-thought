import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useHealth } from '../context/HealthContext';
import { Scale, Plus, Trash2, Target, Pencil, AlertTriangle } from 'lucide-react';
import './Planner.css';

const CONSTANT_VARIABLE = 'AIzaSyBX6UcZK-GB-_zIuYFfyO-DfeLjyxVL1Jc';

interface WeightEntry {
  date: string;
  weight: number;
}

interface PlannerProps {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
}

const Planner: React.FC<PlannerProps> = ({ userProfile, setUserProfile }) => {
  const { activities, foodLogCount } = useHealth();
  
  // Goal configuration
  const [goalConfig, setGoalConfig] = useState({
    targetWeight: userProfile?.profile.initial_weight_kg ? userProfile.profile.initial_weight_kg - 5 : 65,
    weeklyChange: userProfile?.goal.weekly_target_kg || 0.5,
    goalType: userProfile?.goal.type || 'weight_loss'
  });
  const [goalWarning, setGoalWarning] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([
    { date: '2025-10-28', weight: 70.5 },
    { date: '2025-11-04', weight: 70.2 },
    { date: '2025-11-11', weight: 69.8 },
    { date: '2025-11-18', weight: 69.5 },
  ]);
  
  const [newWeight, setNewWeight] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Dummy data for today's progress
  const [todayProgress, setTodayProgress] = useState({
    caloriesConsumed: 1450,
    caloriesBurned: 320,
    protein_g: 65,
    carbs_g: 180,
    fat_g: 45
  });

  // Calculate targets
  const calculateBMR = (): number => {
    if (!userProfile) return 0;
    const { age, sex, height_cm, initial_weight_kg } = userProfile.profile;
    if (sex === 'male') {
      return 10 * initial_weight_kg + 6.25 * height_cm - 5 * age + 5;
    }
    return 10 * initial_weight_kg + 6.25 * height_cm - 5 * age - 161;
  };

  const calculateTDEE = (): number => calculateBMR() * 1.375;

  const calculateCalorieTarget = (): number => {
    const tdee = calculateTDEE();
    const adjustment = (userProfile?.goal.weekly_target_kg || 0) * 7700 / 7;
    if (userProfile?.goal.type === 'weight_loss') return tdee - Math.abs(adjustment);
    if (userProfile?.goal.type === 'weight_gain') return tdee + Math.abs(adjustment);
    return tdee;
  };

  const getMacroTargets = () => {
    const calorieTarget = calculateCalorieTarget();
    const weight = userProfile?.profile.initial_weight_kg || 70;
    const protein_g = Math.round(weight * 1.8);
    const fat_g = Math.round((calorieTarget * 0.25) / 9);
    const carbs_g = Math.round((calorieTarget - protein_g * 4 - fat_g * 9) / 4);
    return { protein_g, carbs_g, fat_g };
  };

  // Weight progress
  const getWeightProgress = () => {
    if (weightEntries.length < 2) return { change: 0, isOnTrack: true };
    const sorted = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const change = sorted[sorted.length - 1].weight - sorted[0].weight;
    const goalType = userProfile?.goal.type || 'maintenance';
    const isOnTrack = goalType === 'weight_loss' ? change <= 0 : goalType === 'weight_gain' ? change >= 0 : true;
    return { change, isOnTrack };
  };

  // Daily progress analysis
  const getDailyProgress = () => {
    const calorieTarget = calculateCalorieTarget();
    const macroTargets = getMacroTargets();
    const netCalories = todayProgress.caloriesConsumed - todayProgress.caloriesBurned;
    
    const caloriePercent = Math.round((todayProgress.caloriesConsumed / calorieTarget) * 100);
    const proteinPercent = Math.round((todayProgress.protein_g / macroTargets.protein_g) * 100);
    const carbsPercent = Math.round((todayProgress.carbs_g / macroTargets.carbs_g) * 100);
    const fatPercent = Math.round((todayProgress.fat_g / macroTargets.fat_g) * 100);

    return {
      calorieTarget,
      netCalories,
      caloriePercent,
      proteinPercent,
      carbsPercent,
      fatPercent,
      macroTargets
    };
  };

  // Generate smart encouragement based on daily progress
  const getEncouragement = () => {
    const progress = getDailyProgress();
    const goalType = userProfile?.goal.type || 'maintenance';
    
    // Check what's lacking
    if (progress.proteinPercent < 50) {
      return {
        message: "You're low on protein today. Try adding eggs, Greek yogurt, or lean chicken to your next meal.",
        type: 'warning'
      };
    }
    
    if (goalType === 'weight_gain' && progress.caloriePercent < 60) {
      return {
        message: "You need more calories to hit your goal. Consider healthy snacks like nuts, avocado, or a protein shake between meals.",
        type: 'warning'
      };
    }
    
    if (goalType === 'weight_loss' && progress.caloriePercent > 90) {
      return {
        message: "You're close to your calorie limit. Focus on high-volume, low-calorie foods like vegetables for the rest of the day.",
        type: 'caution'
      };
    }
    
    if (progress.fatPercent > 100) {
      return {
        message: "Fat intake is high today. Balance your remaining meals with lean proteins and complex carbs.",
        type: 'caution'
      };
    }
    
    if (progress.proteinPercent >= 80 && progress.caloriePercent >= 70 && progress.caloriePercent <= 100) {
      return {
        message: "Great job! You're on track with your nutrition today. Keep up the balanced eating!",
        type: 'success'
      };
    }
    
    if (progress.carbsPercent < 40) {
      return {
        message: "Your carbs are low. Add some whole grains, fruits, or sweet potatoes to fuel your energy.",
        type: 'info'
      };
    }

    return {
      message: "Keep logging your meals to stay on track. Consistency is key to reaching your goals!",
      type: 'info'
    };
  };

  // Validate goal with Gemini
  const validateGoal = async (targetWeight: number, weeklyChange: number, goalType: string) => {
    const currentWeight = userProfile?.profile.initial_weight_kg || 70;
    const weightDiff = Math.abs(targetWeight - currentWeight);
    const weeksNeeded = weeklyChange > 0 ? weightDiff / weeklyChange : 0;
    
    // Quick local checks first
    if (weeklyChange > 1) {
      return "Losing more than 1kg per week is generally not recommended and may be unsustainable.";
    }
    if (weeklyChange > 0.5 && goalType === 'weight_gain') {
      return "Gaining more than 0.5kg per week may lead to excess fat gain rather than muscle.";
    }
    if (goalType === 'weight_loss' && targetWeight < currentWeight * 0.7) {
      return "This target weight seems too low and may be unhealthy. Consider a more moderate goal.";
    }
    if (goalType === 'weight_gain' && targetWeight > currentWeight * 1.3) {
      return "This is a significant weight gain. Consider setting intermediate milestones.";
    }
    
    // Use Gemini for more nuanced advice
    try {
      const prompt = `As a fitness expert, briefly evaluate this weight goal (1-2 sentences max):
- Current weight: ${currentWeight}kg
- Target weight: ${targetWeight}kg
- Weekly change: ${weeklyChange}kg/week
- Goal type: ${goalType.replace('_', ' ')}
- Estimated time: ${Math.round(weeksNeeded)} weeks
- User age: ${userProfile?.profile.age || 25}, sex: ${userProfile?.profile.sex || 'male'}

If realistic, say "This goal is achievable." If concerning, briefly explain why and suggest adjustment.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONSTANT_VARIABLE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 100, temperature: 0.3 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (reply && !reply.toLowerCase().includes('achievable') && !reply.toLowerCase().includes('realistic')) {
          return reply;
        }
      }
    } catch {
      // Fall back to local validation only
    }
    
    return null;
  };

  // Handle goal save
  const handleSaveGoal = async () => {
    const warning = await validateGoal(goalConfig.targetWeight, goalConfig.weeklyChange, goalConfig.goalType);
    setGoalWarning(warning);
    
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        goal: {
          ...userProfile.goal,
          type: goalConfig.goalType as 'weight_loss' | 'weight_gain' | 'maintenance',
          weekly_target_kg: goalConfig.weeklyChange
        }
      });
    }
    
    if (!warning) {
      setIsEditingGoal(false);
    }
  };

  // Calculate estimated completion
  const getEstimatedCompletion = () => {
    const currentWeight = weightEntries.length > 0 
      ? weightEntries[weightEntries.length - 1].weight 
      : userProfile?.profile.initial_weight_kg || 70;
    const diff = Math.abs(goalConfig.targetWeight - currentWeight);
    const weeks = goalConfig.weeklyChange > 0 ? Math.round(diff / goalConfig.weeklyChange) : 0;
    return weeks;
  };

  const addWeightEntry = () => {
    if (!newWeight || !newDate) return;
    setWeightEntries(prev => 
      [...prev, { date: newDate, weight: parseFloat(newWeight) }]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setNewWeight('');
  };

  const removeWeightEntry = (date: string) => {
    setWeightEntries(prev => prev.filter(e => e.date !== date));
  };

  // Line chart
  const renderChart = () => {
    if (weightEntries.length === 0) return null;
    const sorted = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const weights = sorted.map(e => e.weight);
    const min = Math.min(...weights) - 0.5;
    const max = Math.max(...weights) + 0.5;
    const range = max - min || 1;

    const points = sorted.map((entry, i) => ({
      x: 10 + (i / (sorted.length - 1 || 1)) * 80,
      y: 55 - ((entry.weight - min) / range) * 45
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="chart-wrapper">
        <svg viewBox="0 0 100 60" className="chart">
          <path d={pathD} className="chart-line" fill="none" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" className="chart-dot" />
          ))}
        </svg>
        <div className="chart-range">
          <span>{max.toFixed(1)} kg</span>
          <span>{min.toFixed(1)} kg</span>
        </div>
      </div>
    );
  };

  const progress = getWeightProgress();
  const dailyProgress = getDailyProgress();
  const encouragement = getEncouragement();

  return (
    <div className="planner">
      <h2>Planner</h2>

      {/* Goal Configuration */}
      <div className="card">
        <div className="goal-header">
          <h3><Target size={16} /> Weight Goal</h3>
          {!isEditingGoal && (
            <button className="btn-icon" onClick={() => setIsEditingGoal(true)}>
              <Pencil size={14} />
            </button>
          )}
        </div>

        {isEditingGoal ? (
          <div className="goal-form">
            <div className="goal-inputs">
              <div className="input-group">
                <label>Goal Type</label>
                <select
                  value={goalConfig.goalType}
                  onChange={(e) => setGoalConfig({ ...goalConfig, goalType: e.target.value })}
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="weight_gain">Weight Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              {goalConfig.goalType !== 'maintenance' && (
                <>
                  <div className="input-group">
                    <label>Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={goalConfig.targetWeight}
                      onChange={(e) => setGoalConfig({ ...goalConfig, targetWeight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Weekly Change (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1.5"
                      value={goalConfig.weeklyChange}
                      onChange={(e) => setGoalConfig({ ...goalConfig, weeklyChange: parseFloat(e.target.value) || 0.5 })}
                    />
                  </div>
                </>
              )}
            </div>

            {goalWarning && (
              <div className="goal-warning">
                <AlertTriangle size={14} />
                <span>{goalWarning}</span>
              </div>
            )}

            <div className="goal-actions">
              <button className="btn" onClick={handleSaveGoal}>Save Goal</button>
              <button className="btn-text" onClick={() => { setIsEditingGoal(false); setGoalWarning(null); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="goal-summary">
            <div className="goal-stat">
              <span className="goal-label">Current</span>
              <span className="goal-value">{userProfile?.profile.initial_weight_kg || 70} kg</span>
            </div>
            <div className="goal-arrow">→</div>
            <div className="goal-stat">
              <span className="goal-label">Target</span>
              <span className="goal-value">
                {goalConfig.goalType === 'maintenance' ? 'Maintain' : `${goalConfig.targetWeight} kg`}
              </span>
            </div>
            <div className="goal-stat">
              <span className="goal-label">Rate</span>
              <span className="goal-value">
                {goalConfig.goalType === 'maintenance' ? '—' : `${goalConfig.weeklyChange} kg/wk`}
              </span>
            </div>
            <div className="goal-stat">
              <span className="goal-label">Est. Time</span>
              <span className="goal-value">
                {goalConfig.goalType === 'maintenance' ? '—' : `${getEstimatedCompletion()} wks`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="card">
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-label">Daily Target</span>
            <span className="stat-value">{Math.round(calculateCalorieTarget())} kcal</span>
          </div>
          <div className="stat">
            <span className="stat-label">Progress</span>
            <span className={`stat-value ${progress.change < 0 ? 'loss' : progress.change > 0 ? 'gain' : ''}`}>
              {progress.change > 0 ? '+' : ''}{progress.change.toFixed(1)} kg
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Status</span>
            <span className={`stat-value ${progress.isOnTrack ? 'on-track' : 'off-track'}`}>
              {progress.isOnTrack ? 'On Track' : 'Off Track'}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="card">
        <h3>Today's Progress</h3>
        <div className="progress-bars">
          <div className="progress-item">
            <div className="progress-header">
              <span>Calories</span>
              <span>{todayProgress.caloriesConsumed} / {Math.round(dailyProgress.calorieTarget)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill calories" style={{ width: `${Math.min(100, dailyProgress.caloriePercent)}%` }} />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-header">
              <span>Protein</span>
              <span>{todayProgress.protein_g}g / {dailyProgress.macroTargets.protein_g}g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill protein" style={{ width: `${Math.min(100, dailyProgress.proteinPercent)}%` }} />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-header">
              <span>Carbs</span>
              <span>{todayProgress.carbs_g}g / {dailyProgress.macroTargets.carbs_g}g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill carbs" style={{ width: `${Math.min(100, dailyProgress.carbsPercent)}%` }} />
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-header">
              <span>Fat</span>
              <span>{todayProgress.fat_g}g / {dailyProgress.macroTargets.fat_g}g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill fat" style={{ width: `${Math.min(100, dailyProgress.fatPercent)}%` }} />
            </div>
          </div>
        </div>
        
        {/* Smart Encouragement */}
        <div className={`encouragement ${encouragement.type}`}>
          <p>{encouragement.message}</p>
        </div>
      </div>

      {/* Weight Log */}
      <div className="card">
        <h3><Scale size={16} /> Weight Log</h3>
        
        {renderChart()}

        <div className="add-entry">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <input
            type="number"
            step="0.1"
            placeholder="kg"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <button className="btn" onClick={addWeightEntry}>
            <Plus size={14} />
          </button>
        </div>

        <div className="entries">
          {[...weightEntries]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4)
            .map((entry) => (
              <div key={entry.date} className="entry">
                <span>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="entry-weight">{entry.weight} kg</span>
                <button className="btn-icon" onClick={() => removeWeightEntry(entry.date)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
};

export default Planner;