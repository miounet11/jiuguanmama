import { PrismaClient } from '../../node_modules/.prisma/client';
import { featureGateService } from './feature-gate.service';

const prisma = new PrismaClient();

// Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: 'new' | 'beta' | 'pro' | number;
  children?: NavigationItem[];
  visible: boolean;
  priority: number;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: { w: number; h: number };
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface ThemeConfig {
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface RoleViewConfig {
  role: string;
  theme: ThemeConfig;
  navigation: NavigationItem[];
  dashboard: DashboardWidget[];
  features: string[];
}

/**
 * RoleViewService
 *
 * Manages role-based view configuration and dynamic navigation.
 * Implements F2 (Role-Oriented UI) and F9 (Dynamic Navigation) features.
 */
export class RoleViewService {
  // Role-specific theme configurations
  private roleThemes: Record<string, ThemeConfig> = {
    creator: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' }, // Purple
    player: { primary: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa' }, // Blue
    admin: { primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' }, // Red
  };

  /**
   * Get role-based view configuration
   */
  async getRoleConfig(userId: string, role?: string): Promise<RoleViewConfig | null> {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          userPreferenceExtended: true,
        },
      });

      if (!user) {
        return null;
      }

      // Use specified role or user's primary role
      const activeRole = role || user.userPreferenceExtended?.primaryRole || user.role;

      // Get available features
      const availableFeatures = await featureGateService.getAvailableFeatures(userId);
      const unlockedFeatureIds = availableFeatures
        .filter(f => f.unlocked)
        .map(f => f.featureId);

      // Generate navigation
      const navigation = await this.getNavigation(userId, activeRole);

      // Generate dashboard
      const dashboard = await this.getDashboard(userId, activeRole);

      return {
        role: activeRole,
        theme: this.roleThemes[activeRole] || this.roleThemes.player,
        navigation,
        dashboard,
        features: unlockedFeatureIds,
      };
    } catch (error) {
      console.error('Error getting role config:', error);
      return null;
    }
  }

  /**
   * Switch user's primary role
   */
  async switchRole(userId: string, newRole: string): Promise<boolean> {
    try {
      // Validate role
      if (!['creator', 'player', 'admin'].includes(newRole)) {
        throw new Error('Invalid role');
      }

      // Get or create user preferences
      let prefs = await prisma.userPreferenceExtended.findUnique({
        where: { userId },
      });

      if (!prefs) {
        prefs = await prisma.userPreferenceExtended.create({
          data: {
            userId,
            primaryRole: newRole,
          },
        });
      } else {
        await prisma.userPreferenceExtended.update({
          where: { userId },
          data: {
            primaryRole: newRole,
            updatedAt: new Date(),
          },
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'system',
          title: '角色已切换',
          description: `您已切换到${this.getRoleDisplayName(newRole)}模式`,
          priority: 'normal',
        },
      });

      return true;
    } catch (error) {
      console.error('Error switching role:', error);
      return false;
    }
  }

  /**
   * Get dynamic navigation for a role
   */
  async getNavigation(userId: string, role: string): Promise<NavigationItem[]> {
    try {
      const navigation: NavigationItem[] = [];

      // Get available features
      const availableFeatures = await featureGateService.getAvailableFeatures(userId);
      const unlockedFeatures = new Set(
        availableFeatures.filter(f => f.unlocked).map(f => f.featureId)
      );

      // Creator navigation
      if (role === 'creator') {
        navigation.push(
          {
            id: 'creator-studio',
            label: '创作工坊',
            icon: 'Paintbrush',
            path: '/studio',
            visible: unlockedFeatures.has('creator-studio'),
            priority: 1,
          },
          {
            id: 'creator-stats',
            label: '作品统计',
            icon: 'ChartBar',
            path: '/creator/stats',
            visible: unlockedFeatures.has('creator-stats'),
            priority: 2,
          },
          {
            id: 'creator-revenue',
            label: '收益中心',
            icon: 'CurrencyDollar',
            path: '/creator/revenue',
            visible: unlockedFeatures.has('creator-revenue'),
            priority: 3,
          },
          {
            id: 'ai-tools',
            label: 'AI工具',
            icon: 'Sparkles',
            path: '/creator/ai-tools',
            badge: 'beta',
            visible: unlockedFeatures.has('ai-generation'),
            priority: 4,
          }
        );
      }

      // Player navigation
      if (role === 'player') {
        navigation.push(
          {
            id: 'home',
            label: '首页',
            icon: 'Home',
            path: '/',
            visible: true,
            priority: 1,
          },
          {
            id: 'characters',
            label: '角色列表',
            icon: 'UserGroup',
            path: '/characters',
            visible: true,
            priority: 2,
          },
          {
            id: 'gamification',
            label: '时空酒馆',
            icon: 'Sparkles',
            path: '/gamification',
            visible: unlockedFeatures.has('gamification-dashboard'),
            priority: 3,
          },
          {
            id: 'achievements',
            label: '成就系统',
            icon: 'Trophy',
            path: '/achievements',
            visible: unlockedFeatures.has('achievements'),
            priority: 4,
          }
        );
      }

      // Admin navigation
      if (role === 'admin') {
        navigation.push(
          {
            id: 'admin-dashboard',
            label: '监控仪表板',
            icon: 'ChartBar',
            path: '/admin/dashboard',
            visible: unlockedFeatures.has('admin-dashboard'),
            priority: 1,
          },
          {
            id: 'admin-users',
            label: '用户管理',
            icon: 'Users',
            path: '/admin/users',
            visible: unlockedFeatures.has('admin-users'),
            priority: 2,
          },
          {
            id: 'admin-moderation',
            label: '内容审核',
            icon: 'Document',
            path: '/admin/moderation',
            visible: unlockedFeatures.has('admin-moderation'),
            priority: 3,
          },
          {
            id: 'admin-analytics',
            label: '数据分析',
            icon: 'ChartPie',
            path: '/admin/analytics',
            visible: unlockedFeatures.has('admin-analytics'),
            priority: 4,
          }
        );
      }

      // Filter visible items and sort by priority
      return navigation.filter(item => item.visible).sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Error getting navigation:', error);
      return [];
    }
  }

  /**
   * Get dashboard widget configuration for a role
   */
  async getDashboard(userId: string, role: string): Promise<DashboardWidget[]> {
    try {
      // Get user preferences for custom layout
      const prefs = await prisma.userPreferenceExtended.findUnique({
        where: { userId },
      });

      // Try to load custom layout
      if (prefs?.dashboardLayout) {
        try {
          const customLayout = JSON.parse(prefs.dashboardLayout);
          if (Array.isArray(customLayout) && customLayout.length > 0) {
            return customLayout;
          }
        } catch (e) {
          // Invalid JSON, use default
        }
      }

      // Return default layout for role
      return this.getDefaultDashboard(role);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      return [];
    }
  }

  /**
   * Get default dashboard layout for a role
   */
  private getDefaultDashboard(role: string): DashboardWidget[] {
    switch (role) {
      case 'creator':
        return [
          {
            id: 'creation-overview',
            type: 'stats',
            title: '创作概览',
            size: { w: 6, h: 2 },
            position: { x: 0, y: 0 },
            config: { showCharts: true },
          },
          {
            id: 'top-works',
            type: 'list',
            title: '热门作品',
            size: { w: 6, h: 2 },
            position: { x: 6, y: 0 },
            config: { limit: 5 },
          },
          {
            id: 'revenue-trend',
            type: 'chart',
            title: '收益趋势',
            size: { w: 12, h: 3 },
            position: { x: 0, y: 2 },
            config: { period: '30d' },
          },
          {
            id: 'quick-create',
            type: 'action',
            title: '快速创建',
            size: { w: 12, h: 2 },
            position: { x: 0, y: 5 },
            config: { actions: ['character', 'scenario'] },
          },
        ];

      case 'player':
        return [
          {
            id: 'personalized-recommendations',
            type: 'recommendations',
            title: '个性化推荐',
            size: { w: 12, h: 3 },
            position: { x: 0, y: 0 },
            config: { algorithm: 'mbti-based' },
          },
          {
            id: 'gamification-progress',
            type: 'progress',
            title: '游戏化进度',
            size: { w: 6, h: 2 },
            position: { x: 0, y: 3 },
            config: { showAffinity: true },
          },
          {
            id: 'recent-chats',
            type: 'list',
            title: '最近对话',
            size: { w: 6, h: 2 },
            position: { x: 6, y: 3 },
            config: { limit: 5 },
          },
          {
            id: 'achievements',
            type: 'grid',
            title: '成就墙',
            size: { w: 12, h: 2 },
            position: { x: 0, y: 5 },
            config: { showRecent: true },
          },
        ];

      case 'admin':
        return [
          {
            id: 'realtime-monitoring',
            type: 'metrics',
            title: '实时监控',
            size: { w: 12, h: 2 },
            position: { x: 0, y: 0 },
            config: { refreshInterval: 5000 },
          },
          {
            id: 'alert-center',
            type: 'alerts',
            title: '告警中心',
            size: { w: 6, h: 3 },
            position: { x: 0, y: 2 },
            config: { severity: ['high', 'urgent'] },
          },
          {
            id: 'moderation-queue',
            type: 'queue',
            title: '审核队列',
            size: { w: 6, h: 3 },
            position: { x: 6, y: 2 },
            config: { autoRefresh: true },
          },
          {
            id: 'system-health',
            type: 'health',
            title: '系统健康',
            size: { w: 12, h: 2 },
            position: { x: 0, y: 5 },
            config: { checkInterval: 30000 },
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Get role display name
   */
  private getRoleDisplayName(role: string): string {
    const names: Record<string, string> = {
      creator: '创作者',
      player: '玩家',
      admin: '管理员',
    };
    return names[role] || role;
  }
}

// Export singleton instance
export const roleViewService = new RoleViewService();
