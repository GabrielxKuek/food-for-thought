import { UserProfile } from '../types';

export const calculateBMR = (profile: UserProfile['profile']): number => {
  const { age, sex, height_cm, initial_weight_kg } = profile;
  if (sex === 'male') {
    return 10 * initial_weight_kg + 6.25 * height_cm - 5 * age + 5;
  }
  return 10 * initial_weight_kg + 6.25 * height_cm - 5 * age - 161;
};

export const calculateTDEE = (profile: UserProfile['profile']): number => {
  return calculateBMR(profile) * 1.375; // Moderate activity level
};

export const calculateCalorieTarget = (userProfile: UserProfile): number => {
  const tdee = calculateTDEE(userProfile.profile);
  const adjustment = (userProfile.goal.weekly_target_kg || 0) * 7700 / 7;
  
  if (userProfile.goal.type === 'weight_loss') {
    return tdee - Math.abs(adjustment);
  }
  if (userProfile.goal.type === 'weight_gain') {
    return tdee + Math.abs(adjustment);
  }
  return tdee; // maintenance
};

export const calculateMacroTargets = (userProfile: UserProfile) => {
  const calorieTarget = calculateCalorieTarget(userProfile);
  const weight = userProfile.profile.initial_weight_kg;
  
  const protein_g = Math.round(weight * 1.8);
  const fat_g = Math.round((calorieTarget * 0.25) / 9);
  const carbs_g = Math.round((calorieTarget - protein_g * 4 - fat_g * 9) / 4);
  
  return { protein_g, carbs_g, fat_g };
};