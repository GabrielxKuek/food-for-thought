import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface HealthContextType {
  heartRates: HeartRateDataPoint[];
  activities: ActivityDataPoint[];
  steps: StepsDataPoint[];
  currentHeartRate: number | null;
  isWatchConnected: boolean;
  lastSyncTime: string | null;
  addHeartRates: (rates: HeartRateDataPoint[]) => void;
  addActivities: (activities: ActivityDataPoint[]) => void;
  addSteps: (steps: StepsDataPoint[]) => void;
  setCurrentHeartRate: (bpm: number | null) => void;
  setWatchConnected: (connected: boolean) => void;
  updateSyncTime: () => void;
  clearAllData: () => void;
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
  const [heartRates, setHeartRates] = useState<HeartRateDataPoint[]>([]);
  const [activities, setActivities] = useState<ActivityDataPoint[]>([]);
  const [steps, setSteps] = useState<StepsDataPoint[]>([]);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const [isWatchConnected, setWatchConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const addHeartRates = (rates: HeartRateDataPoint[]) => {
    setHeartRates(prev => {
      // Combine and sort by timestamp (newest first)
      const combined = [...prev, ...rates];
      const unique = combined.filter((rate, index, self) =>
        index === self.findIndex(r => r.timestamp === rate.timestamp)
      );
      return unique.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 1000); // Keep only last 1000 entries
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
        addHeartRates,
        addActivities,
        addSteps,
        setCurrentHeartRate,
        setWatchConnected,
        updateSyncTime,
        clearAllData,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};
