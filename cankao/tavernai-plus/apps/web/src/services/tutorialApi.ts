import axios from 'axios';
import type {
  TutorialListResponse,
  TutorialDetailResponse,
  TutorialProgressResponse,
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
 * Tutorial API Client
 * Handles interactive tutorials and help system
 */
export const tutorialApi = {
  /**
   * Get all available tutorials
   */
  async getTutorials(): Promise<TutorialListResponse> {
    const response = await api.get('/api/v1/tutorials');
    return response.data;
  },

  /**
   * Get a specific tutorial by ID
   */
  async getTutorialById(tutorialId: string): Promise<TutorialDetailResponse> {
    const response = await api.get(`/api/v1/tutorials/${tutorialId}`);
    return response.data;
  },

  /**
   * Start a tutorial
   */
  async startTutorial(tutorialId: string): Promise<TutorialProgressResponse> {
    const response = await api.post(`/api/v1/tutorials/${tutorialId}/start`);
    return response.data;
  },

  /**
   * Update tutorial progress
   */
  async updateProgress(tutorialId: string, step: number): Promise<TutorialProgressResponse> {
    const response = await api.post(`/api/v1/tutorials/${tutorialId}/progress`, { step });
    return response.data;
  },

  /**
   * Complete a tutorial
   */
  async completeTutorial(tutorialId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/api/v1/tutorials/${tutorialId}/complete`);
    return response.data;
  },

  /**
   * Skip a tutorial
   */
  async skipTutorial(tutorialId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/api/v1/tutorials/${tutorialId}/skip`);
    return response.data;
  },
};

export default tutorialApi;
