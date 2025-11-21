// Mock Data for Testing the Frontend

export const mockUserProfile = {
  userId: "user_001",
  profile: {
    age: 25,
    sex: "male" as const,
    height_cm: 175,
    initial_weight_kg: 70
  },
  goal: {
    type: "weight_loss" as const,
    weekly_target_kg: 0.5,
    macro_goals: {
      carbs_g: 250,
      protein_g: 150,
      fat_g: 70
    }
  }
};

export const mockFoodLogs = [
  {
    userId: "user_001",
    timestamp: new Date().toISOString(),
    source: "cv" as const,
    name: "Chicken Rice",
    portion_g: 350,
    confidence: 0.92,
    nutritional_information: {
      energy_kcal: 620,
      fat_g: {
        total: 22.74,
        saturated: 6.1,
        polyunsaturated: 5.5,
        monounsaturated: 9.3
      },
      cholesterol_mg: 79,
      sodium_mg: 1011,
      carbohydrates_g: {
        total: 71.5,
        fibre: 1.3,
        sugar: 2.3
      },
      protein_g: 29.8,
      potassium_mg: 399
    }
  },
  {
    userId: "user_001",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: "manual" as const,
    name: "Greek Yogurt with Berries",
    portion_g: 200,
    nutritional_information: {
      energy_kcal: 180,
      fat_g: {
        total: 5,
        saturated: 2,
        polyunsaturated: 0.5,
        monounsaturated: 1.5
      },
      cholesterol_mg: 15,
      sodium_mg: 65,
      carbohydrates_g: {
        total: 22,
        fibre: 3,
        sugar: 15
      },
      protein_g: 15,
      potassium_mg: 250
    }
  }
];

export const mockActivities = [
  {
    userId: "user_001",
    start: new Date(Date.now() - 3600000).toISOString(),
    end: new Date(Date.now() - 1800000).toISOString(),
    activity_level: "moderate" as const,
    estimated_calories_burned: 180
  },
  {
    userId: "user_001",
    start: new Date(Date.now() - 7200000).toISOString(),
    end: new Date(Date.now() - 5400000).toISOString(),
    activity_level: "vigorous" as const,
    estimated_calories_burned: 320
  }
];

export const mockDailySummary = {
  userId: "user_001",
  date: new Date().toISOString().split('T')[0],
  calories_consumed: 1850,
  calories_burned: 500,
  tdee_estimate: 2200
};

export const mockTamagotchiStates = {
  happy: {
    mood: "happy" as const,
    health: 85,
    motivation: "You're doing great! Keep up the amazing work! 🌟"
  },
  excited: {
    mood: "excited" as const,
    health: 95,
    motivation: "Wow! You crushed your workout! I'm so proud! 🎉"
  },
  neutral: {
    mood: "neutral" as const,
    health: 60,
    motivation: "Let's get moving today! You've got this! 💪"
  },
  sad: {
    mood: "sad" as const,
    health: 40,
    motivation: "I believe in you! Tomorrow is a new day! 🌈"
  },
  tired: {
    mood: "tired" as const,
    health: 50,
    motivation: "Rest is important too! Take care of yourself 😴"
  }
};
