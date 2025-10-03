import axios from 'axios';
import type {
  FeatureListResponse,
  FeatureDetailResponse,
  FeatureAccessResponse,
  UserUnlocksResponse,
  UnlockFeatureResponse,
  UnlockFeatureRequest,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Feature Management API Client
 * Handles all feature-related API requests
 */
export const featureApi = {
  /**
   * Get all available features for the current user
   */
  async getFeatures(): Promise<FeatureListResponse> {
    const response = await api.get('/api/v1/features');
    return response.data;
  },

  /**
   * Get a specific feature by ID
   */
  async getFeatureById(featureId: string): Promise<FeatureDetailResponse> {
    const response = await api.get(`/api/v1/features/${featureId}`);
    return response.data;
  },

  /**
   * Check if the current user can access a feature
   */
  async canAccessFeature(featureId: string): Promise<FeatureAccessResponse> {
    const response = await api.get(`/api/v1/features/${featureId}/access`);
    return response.data;
  },

  /**
   * Unlock a feature for the current user
   */
  async unlockFeature(request: UnlockFeatureRequest): Promise<UnlockFeatureResponse> {
    const response = await api.post(`/api/v1/features/${request.featureId}/unlock`, {
      unlockMethod: request.unlockMethod,
    });
    return response.data;
  },

  /**
   * Get all feature unlocks for the current user
   */
  async getUserUnlocks(): Promise<UserUnlocksResponse> {
    const response = await api.get('/api/v1/features/unlocks');
    return response.data;
  },
};

export default featureApi;
