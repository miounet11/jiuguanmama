import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Valid user roles in the system
 */
export type UserRole = 'player' | 'creator' | 'admin';
/**
 * Middleware to restrict access to specific roles
 * Usage: router.get('/admin-only', authenticate, requireRole(['admin']), handler)
 */
export declare function requireRole(allowedRoles: UserRole | UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require admin role
 * Shorthand for requireRole(['admin'])
 */
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require creator role
 * Allows both creator and admin roles
 */
export declare const requireCreator: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user has their primary role set to a specific value
 * This checks UserPreferenceExtended.primaryRole instead of User.role
 */
export declare function requirePrimaryRole(allowedRoles: UserRole | UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to attach user's role information to the request
 */
export declare function attachRoleInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=role-access.d.ts.map