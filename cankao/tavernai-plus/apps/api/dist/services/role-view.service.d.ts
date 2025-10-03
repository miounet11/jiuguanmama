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
    size: {
        w: number;
        h: number;
    };
    position: {
        x: number;
        y: number;
    };
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
export declare class RoleViewService {
    private roleThemes;
    /**
     * Get role-based view configuration
     */
    getRoleConfig(userId: string, role?: string): Promise<RoleViewConfig | null>;
    /**
     * Switch user's primary role
     */
    switchRole(userId: string, newRole: string): Promise<boolean>;
    /**
     * Get dynamic navigation for a role
     */
    getNavigation(userId: string, role: string): Promise<NavigationItem[]>;
    /**
     * Get dashboard widget configuration for a role
     */
    getDashboard(userId: string, role: string): Promise<DashboardWidget[]>;
    /**
     * Get default dashboard layout for a role
     */
    private getDefaultDashboard;
    /**
     * Get role display name
     */
    private getRoleDisplayName;
}
export declare const roleViewService: RoleViewService;
//# sourceMappingURL=role-view.service.d.ts.map