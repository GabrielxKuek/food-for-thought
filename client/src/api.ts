import axios from 'axios';
import { UserProfile, FoodLog, ActivitySession, HeartRateLog, WeightLog } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User Profile APIs
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const createUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.post('/users', profile);
  return response.data;
};

export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put(`/users/${userId}`, profile);
  return response.data;
};

// Food Logging APIs
export const logFood = async (foodLog: Partial<FoodLog>): Promise<FoodLog> => {
  const response = await api.post('/food-logs', foodLog);
  return response.data;
};

export const getFoodLogs = async (userId: string, date?: string): Promise<FoodLog[]> => {
  const response = await api.get(`/food-logs/${userId}`, {
    params: { date }
  });
  return response.data;
};

export const analyzeFoodImage = async (imageFile: File): Promise<Partial<FoodLog>> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await api.post('/analyze-food', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Activity & Heart Rate APIs
export const syncAppleWatchData = async (userId: string, data: any): Promise<void> => {
  await api.post('/sync-watch', { userId, ...data });
};

export const triggerWatchSync = async (userId: string): Promise<{ success: boolean; message: string; current_data: any }> => {
  const response = await api.post(`/api/health/trigger-sync/${userId}`);
  return response.data;
};

export const getWatchSyncStatus = async (userId: string): Promise<{ has_pending_sync: boolean; sync_request: any }> => {
  const response = await api.get(`/api/health/sync-status/${userId}`);
  return response.data;
};

export const getWatchStatus = async (userId: string): Promise<{ is_connected: boolean; last_heart_rate: any }> => {
  const response = await api.get(`/api/health/watch-status/${userId}`);
  return response.data;
};

export const getHealthData = async (userId: string): Promise<any> => {
  const response = await api.get(`/api/health/${userId}`);
  return response.data;
};

export const getHeartRateLogs = async (userId: string, startDate?: string, endDate?: string): Promise<HeartRateLog[]> => {
  const response = await api.get(`/heart-rate/${userId}`, {
    params: { startDate, endDate }
  });
  return response.data;
};

export const getActivitySessions = async (userId: string, date?: string): Promise<ActivitySession[]> => {
  const response = await api.get(`/activities/${userId}`, {
    params: { date }
  });
  return response.data;
};

// Weight Tracking APIs
export const logWeight = async (weightLog: Partial<WeightLog>): Promise<WeightLog> => {
  const response = await api.post('/weight-logs', weightLog);
  return response.data;
};

export const getWeightLogs = async (userId: string): Promise<WeightLog[]> => {
  const response = await api.get(`/weight-logs/${userId}`);
  return response.data;
};

// Daily Summary APIs
export const getDailySummary = async (userId: string, date: string) => {
  const response = await api.get(`/daily-summary/${userId}`, {
    params: { date }
  });
  return response.data;
};

// Tamagotchi State API
export const getTamagotchiState = async (userId: string) => {
  const response = await api.get(`/tamagotchi/${userId}`);
  return response.data;
};

export default api;
