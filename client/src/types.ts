export interface UserProfile {
  userId: string;
  profile: {
    age: number;
    sex: 'male' | 'female';
    height_cm: number;
    initial_weight_kg: number;
  };
  goal: {
    type: 'weight_loss' | 'weight_gain' | 'maintenance' | string;
    weekly_target_kg: number;
    macro_goals: {
      carbs_g: number;
      protein_g: number;
      fat_g: number;
    };
  };
}

export interface NutritionalInfo {
  energy_kcal: number;
  fat_g: {
    total: number;
    saturated: number;
    polyunsaturated: number;
    monounsaturated: number;
  };
  cholesterol_mg: number;
  sodium_mg: number;
  carbohydrates_g: {
    total: number;
    fibre: number;
    sugar: number;
  };
  protein_g: number;
  potassium_mg: number;
}

export interface FoodLog {
  userId: string;
  timestamp: string;
  source: 'manual' | 'cv' | 'search';
  name: string;
  portion_g: number;
  confidence?: number;
  nutritional_information: NutritionalInfo;
}

export interface ActivitySession {
  userId: string;
  start: string;
  end: string;
  activity_level: 'rest' | 'light' | 'moderate' | 'vigorous';
  estimated_calories_burned: number;
}

export interface HeartRateLog {
  userId: string;
  timestamp: string;
  bpm: number;
}

export interface WeightLog {
  userId: string;
  date: string;
  weight_kg: number;
}

export interface DailyEnergySummary {
  userId: string;
  date: string;
  calories_consumed: number;
  calories_burned: number;
  tdee_estimate: number;
}

export interface TamagotchiState {
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  health: number; // 0-100
  motivation: string;
}
