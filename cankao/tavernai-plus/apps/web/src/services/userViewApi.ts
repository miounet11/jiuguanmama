import axios from 'axios';
import type { RoleViewResponse, UserRole, UserPreferences } from '@/types';

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
  data: T;
  message?: string;
}

/**
 * User View Configuration API Client
 * Handles role-based UI/UX configuration
 */
export const userViewApi = {
  /**
   * Get view configuration for the current user
   */
  async getViewConfig(role?: UserRole): Promise<RoleViewResponse> {
    const params = role ? { role } : {};
    const response = await api.get('/api/v1/user-view/config', { params });
    return response.data;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    const response = await api.put('/api/v1/user-view/preferences', preferences);
    return response.data;
  },

  /**
   * Switch to a different primary role
   */
  async switchRole(newRole: UserRole): Promise<ApiResponse<{ role: UserRole }>> {
    const response = await api.post('/api/v1/user-view/switch-role', { role: newRole });
    return response.data;
  },

  /**
   * Get navigation items for a specific role
   */
  async getNavigation(role: UserRole): Promise<RoleViewResponse> {
    const response = await api.get(`/api/v1/user-view/navigation/${role}`);
    return response.data;
  },

  /**
   * Get dashboard configuration for a specific role
   */
  async getDashboard(role: UserRole): Promise<RoleViewResponse> {
    const response = await api.get(`/api/v1/user-view/dashboard/${role}`);
    return response.data;
  },
};

export default userViewApi;
