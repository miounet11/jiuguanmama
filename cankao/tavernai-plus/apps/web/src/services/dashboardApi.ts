import axios from 'axios';

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

// Creator Studio Types
interface CreatorOverview {
  totalCharacters: number;
  totalViews: number;
  totalLikes: number;
  avgRating: number;
  recentWorks: any[];
}

interface WorkStatistics {
  topWorks: any[];
  trends: any;
}

interface AIGenerationResult {
  success: boolean;
  data: any;
  tokensUsed: number;
  cost: number;
}

// Gamification Types
interface GamificationOverview {
  level: number;
  exp: number;
  nextLevelExp: number;
  totalAffinity: number;
  totalProficiency: number;
  achievements: number;
  dailyQuestsCompleted: number;
}

interface AffinityList {
  affinities: any[];
  total: number;
}

interface ProficiencyList {
  proficiencies: any[];
  total: number;
}

// Admin Console Types
interface AdminDashboard {
  users: { total: number; active: number; new: number };
  content: { characters: number; messages: number; reports: number };
  system: { uptime: number; cpu: number; memory: number };
  revenue: { total: number; monthly: number; daily: number };
}

interface RealtimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

/**
 * Creator Studio API Client
 */
export const creatorStudioApi = {
  /**
   * Get creator overview statistics
   */
  async getOverview(): Promise<ApiResponse<CreatorOverview>> {
    const response = await api.get('/api/v1/creator-studio/overview');
    return response.data;
  },

  /**
   * Get work statistics with filters
   */
  async getStatistics(params?: { limit?: number; sortBy?: string }): Promise<ApiResponse<WorkStatistics>> {
    const response = await api.get('/api/v1/creator-studio/statistics', { params });
    return response.data;
  },

  /**
   * Generate a character using AI
   */
  async generateCharacter(prompt: string, config?: any): Promise<AIGenerationResult> {
    const response = await api.post('/api/v1/creator-studio/ai-generate-character', {
      prompt,
      config,
    });
    return response.data;
  },

  /**
   * Generate a scenario using AI
   */
  async generateScenario(prompt: string, config?: any): Promise<AIGenerationResult> {
    const response = await api.post('/api/v1/creator-studio/ai-generate-scenario', {
      prompt,
      config,
    });
    return response.data;
  },
};

/**
 * Gamification Dashboard API Client
 */
export const gamificationApi = {
  /**
   * Get gamification overview for the user
   */
  async getOverview(): Promise<ApiResponse<GamificationOverview>> {
    const response = await api.get('/api/v1/gamification/overview');
    return response.data;
  },

  /**
   * Get affinity list with pagination
   */
  async getAffinityList(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<ApiResponse<AffinityList>> {
    const response = await api.get('/api/v1/gamification/affinity-list', { params });
    return response.data;
  },

  /**
   * Get proficiency list with pagination
   */
  async getProficiencyList(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<ApiResponse<ProficiencyList>> {
    const response = await api.get('/api/v1/gamification/proficiency-list', { params });
    return response.data;
  },

  /**
   * Get daily quests
   */
  async getDailyQuests(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/api/v1/gamification/daily-quests');
    return response.data;
  },

  /**
   * Get achievements with filters
   */
  async getAchievements(params?: {
    category?: string;
    unlocked?: boolean;
    rarity?: string;
  }): Promise<ApiResponse<any[]>> {
    const response = await api.get('/api/v1/gamification/achievements', { params });
    return response.data;
  },
};

/**
 * Admin Console API Client
 */
export const adminConsoleApi = {
  /**
   * Get admin dashboard overview
   */
  async getDashboard(): Promise<ApiResponse<AdminDashboard>> {
    const response = await api.get('/api/v1/admin/dashboard');
    return response.data;
  },

  /**
   * Get realtime system metrics
   */
  async getRealtimeMetrics(): Promise<ApiResponse<RealtimeMetrics>> {
    const response = await api.get('/api/v1/admin/metrics/realtime');
    return response.data;
  },

  /**
   * Get system alerts
   */
  async getAlerts(params?: {
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Alert[]>> {
    const response = await api.get('/api/v1/admin/alerts', { params });
    return response.data;
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/api/v1/admin/alerts/${alertId}/resolve`);
    return response.data;
  },

  /**
   * Get moderation queue
   */
  async getModerationQueue(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const response = await api.get('/api/v1/admin/moderation/queue', { params });
    return response.data;
  },

  /**
   * Process moderation item
   */
  async processModerationItem(
    itemId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<ApiResponse<void>> {
    const response = await api.post(`/api/v1/admin/moderation/${itemId}/process`, {
      action,
      reason,
    });
    return response.data;
  },

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, duration?: number): Promise<ApiResponse<void>> {
    const response = await api.post(`/api/v1/admin/users/${userId}/ban`, {
      userId,
      reason,
      duration,
    });
    return response.data;
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: {
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const response = await api.get('/api/v1/admin/audit-logs', { params });
    return response.data;
  },

  /**
   * Get system configuration
   */
  async getConfig(): Promise<ApiResponse<any>> {
    const response = await api.get('/api/v1/admin/config');
    return response.data;
  },

  /**
   * Update system configuration
   */
  async updateConfig(config: any): Promise<ApiResponse<void>> {
    const response = await api.put('/api/v1/admin/config', config);
    return response.data;
  },
};

export default {
  creatorStudio: creatorStudioApi,
  gamification: gamificationApi,
  adminConsole: adminConsoleApi,
};
