import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Valid audit log action types
 */
export type AuditAction = 'ban_user' | 'unban_user' | 'approve_content' | 'reject_content' | 'flag_content' | 'change_config' | 'update_feature' | 'delete_content' | 'promote_user' | 'demote_user' | 'create_announcement' | 'resolve_alert' | 'emergency_shutdown' | 'other';
/**
 * Middleware to automatically log admin actions
 * Usage: router.post('/ban-user', authenticate, requireAdmin, auditLog('ban_user'), handler)
 */
export declare function auditLog(action: AuditAction, getResource?: (req: AuthRequest) => string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to manually create an audit log from within a route handler
 * Attaches an auditLog function to the request object
 */
export declare function auditLogManual(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Predefined audit log middleware for common actions
 */
export declare const auditBanUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditUnbanUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditApproveContent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditRejectContent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditFlagContent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditChangeConfig: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditUpdateFeature: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditDeleteContent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditPromoteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditDemoteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditResolveAlert: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Utility function to manually create an audit log entry
 * Can be called from anywhere with adminId
 */
export declare function logAdminAction(adminId: string, action: AuditAction, resource: string, changes?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
//# sourceMappingURL=audit-log.d.ts.map