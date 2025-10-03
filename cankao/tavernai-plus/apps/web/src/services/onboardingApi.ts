import axios from 'axios';
import type {
  OnboardingStatusResponse,
  RecommendationsResponse,
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Onboarding API Client
 * Handles new user onboarding flow
 */
export const onboardingApi = {
  /**
   * Get current onboarding status
   */
  async getStatus(): Promise<OnboardingStatusResponse> {
    const response = await api.get('/api/v1/onboarding/status');
    return response.data;
  },

  /**
   * Start the onboarding process
   */
  async start(): Promise<OnboardingStatusResponse> {
    const response = await api.post('/api/v1/onboarding/start');
    return response.data;
  },

  /**
   * Complete an onboarding step
   */
  async completeStep(stepId: string, data: any): Promise<OnboardingStatusResponse> {
    const response = await api.post(`/api/v1/onboarding/step/${stepId}`, data);
    return response.data;
  },

  /**
   * Skip the onboarding process
   */
  async skip(): Promise<ApiResponse<void>> {
    const response = await api.post('/api/v1/onboarding/skip');
    return response.data;
  },

  /**
   * Get personalized character recommendations
   */
  async getRecommendations(interests: string[], mbtiType?: string): Promise<RecommendationsResponse> {
    const response = await api.post('/api/v1/onboarding/recommendations', {
      interests,
      mbtiType,
    });
    return response.data;
  },
};

export default onboardingApi;
