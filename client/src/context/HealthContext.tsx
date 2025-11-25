import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HeartRateDataPoint {
  timestamp: string;
  bpm: number;
  source: string;
}

export interface ActivityDataPoint {
  start: string;
  end: string;
  activity_type: string;
  calories_burned: number;
  duration_minutes: number;
  avg_heart_rate?: number;
  distance_meters?: number;
}

export interface StepsDataPoint {
  date: string;
  steps: number;
  distance_meters: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface DailySummary {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface HealthContextType {
  heartRates: HeartRateDataPoint[];
  activities: ActivityDataPoint[];
  steps: StepsDataPoint[];
  currentHeartRate: number | null;
  isWatchConnected: boolean;
  lastSyncTime: string | null;
  foodLogCount: number;
  weightEntries: WeightEntry[];
  dailySummary: DailySummary;
  addHeartRates: (rates: HeartRateDataPoint[]) => void;
  addActivities: (activities: ActivityDataPoint[]) => void;
  addSteps: (steps: StepsDataPoint[]) => void;
  setCurrentHeartRate: (bpm: number | null) => void;
  setWatchConnected: (connected: boolean) => void;
  updateSyncTime: () => void;
  clearAllData: () => void;
  incrementFoodLog: () => void;
  decrementFoodLog: () => void;
  resetFoodLog: () => void;
  addWeightEntry: (entry: WeightEntry) => void;
  removeWeightEntry: (date: string) => void;
  updateDailySummary: (summary: Partial<DailySummary>) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};

interface HealthProviderProps {
  children: ReactNode;
}

export const HealthProvider: React.FC<HealthProviderProps> = ({ children }) => {
  // Load from localStorage or use defaults
  const [heartRates, setHeartRates] = useState<HeartRateDataPoint[]>(() => {
    const saved = localStorage.getItem('healthData_heartRates');
    return saved ? JSON.parse(saved) : [];
  });
  const [activities, setActivities] = useState<ActivityDataPoint[]>(() => {
    const saved = localStorage.getItem('healthData_activities');
    return saved ? JSON.parse(saved) : [];
  });
  const [steps, setSteps] = useState<StepsDataPoint[]>(() => {
    const saved = localStorage.getItem('healthData_steps');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(() => {
    const saved = localStorage.getItem('healthData_currentHeartRate');
    return saved ? JSON.parse(saved) : null;
  });
  const [isWatchConnected, setWatchConnected] = useState(() => {
    const saved = localStorage.getItem('healthData_isWatchConnected');
    return saved ? JSON.parse(saved) : false;
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    const saved = localStorage.getItem('healthData_lastSyncTime');
    return saved ? JSON.parse(saved) : null;
  });
  const [foodLogCount, setFoodLogCount] = useState(() => {
    const saved = localStorage.getItem('healthData_foodLogCount');
    return saved ? JSON.parse(saved) : 0;
  });
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() => {
    const saved = localStorage.getItem('healthData_weightEntries');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { date: '2025-10-28', weight: 70.5 },
      { date: '2025-11-04', weight: 70.2 },
      { date: '2025-11-11', weight: 69.8 },
      { date: '2025-11-18', weight: 69.5 },
    ];
  });
  const [dailySummary, setDailySummary] = useState<DailySummary>(() => {
    const saved = localStorage.getItem('healthData_dailySummary');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      date: new Date().toISOString().split('T')[0],
      calories_consumed: 0,
      calories_burned: 450,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('healthData_heartRates', JSON.stringify(heartRates));
  }, [heartRates]);

  useEffect(() => {
    localStorage.setItem('healthData_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('healthData_steps', JSON.stringify(steps));
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('healthData_currentHeartRate', JSON.stringify(currentHeartRate));
  }, [currentHeartRate]);

  useEffect(() => {
    localStorage.setItem('healthData_isWatchConnected', JSON.stringify(isWatchConnected));
  }, [isWatchConnected]);

  useEffect(() => {
    localStorage.setItem('healthData_lastSyncTime', JSON.stringify(lastSyncTime));
  }, [lastSyncTime]);

  useEffect(() => {
    localStorage.setItem('healthData_foodLogCount', JSON.stringify(foodLogCount));
  }, [foodLogCount]);

  useEffect(() => {
    localStorage.setItem('healthData_weightEntries', JSON.stringify(weightEntries));
  }, [weightEntries]);

  useEffect(() => {
    localStorage.setItem('healthData_dailySummary', JSON.stringify(dailySummary));
  }, [dailySummary]);

  // Auto-update daily summary when food log count changes
  useEffect(() => {
    setDailySummary((prev: DailySummary) => ({
      ...prev,
      calories_consumed: foodLogCount * 400, // ~400 cal per meal
      protein_g: foodLogCount * 25,
      carbs_g: foodLogCount * 45,
      fat_g: foodLogCount * 15
    }));
  }, [foodLogCount]);

  const addHeartRates = (rates: HeartRateDataPoint[]) => {
    setHeartRates(prev => {
      const combined = [...prev, ...rates];
      const unique = combined.filter((rate, index, self) =>
        index === self.findIndex(r => r.timestamp === rate.timestamp)
      );
      return unique.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 1000);
    });
  };

  const addActivities = (newActivities: ActivityDataPoint[]) => {
    setActivities(prev => {
      const combined = [...prev, ...newActivities];
      const unique = combined.filter((activity, index, self) =>
        index === self.findIndex(a => a.start === activity.start && a.end === activity.end)
      );
      return unique.sort((a, b) => 
        new Date(b.start).getTime() - new Date(a.start).getTime()
      );
    });
  };

  const addSteps = (newSteps: StepsDataPoint[]) => {
    setSteps(prev => {
      const combined = [...prev, ...newSteps];
      const unique = combined.filter((step, index, self) =>
        index === self.findIndex(s => s.date === step.date)
      );
      return unique.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  };

  const updateSyncTime = () => {
    setLastSyncTime(new Date().toISOString());
  };

  const clearAllData = () => {
    setHeartRates([]);
    setActivities([]);
    setSteps([]);
    setCurrentHeartRate(null);
    setLastSyncTime(null);
    setFoodLogCount(0);
    setWeightEntries([]);
    setDailySummary({
      date: new Date().toISOString().split('T')[0],
      calories_consumed: 0,
      calories_burned: 450,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    });
    // Also clear localStorage
    localStorage.removeItem('healthData_heartRates');
    localStorage.removeItem('healthData_activities');
    localStorage.removeItem('healthData_steps');
    localStorage.removeItem('healthData_currentHeartRate');
    localStorage.removeItem('healthData_lastSyncTime');
    localStorage.removeItem('healthData_foodLogCount');
    localStorage.removeItem('healthData_weightEntries');
    localStorage.removeItem('healthData_dailySummary');
  };

  const incrementFoodLog = () => {
    setFoodLogCount((prev: number) => prev + 1);
  };

  const decrementFoodLog = () => {
    setFoodLogCount((prev: number) => Math.max(0, prev - 1));
  };

  const resetFoodLog = () => {
    setFoodLogCount(0);
  };

  const addWeightEntry = (entry: WeightEntry) => {
    setWeightEntries((prev: WeightEntry[]) => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
  };

  const removeWeightEntry = (date: string) => {
    setWeightEntries((prev: WeightEntry[]) => prev.filter(e => e.date !== date));
  };

  const updateDailySummary = (summary: Partial<DailySummary>) => {
    setDailySummary((prev: DailySummary) => ({ ...prev, ...summary }));
  };

  return (
    <HealthContext.Provider
      value={{
        heartRates,
        activities,
        steps,
        currentHeartRate,
        isWatchConnected,
        lastSyncTime,
        foodLogCount,
        weightEntries,
        dailySummary,
        addHeartRates,
        addActivities,
        addSteps,
        setCurrentHeartRate,
        setWatchConnected,
        updateSyncTime,
        clearAllData,
        incrementFoodLog,
        decrementFoodLog,
        resetFoodLog,
        addWeightEntry,
        removeWeightEntry,
        updateDailySummary,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};