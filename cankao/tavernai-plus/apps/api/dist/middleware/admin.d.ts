import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: any;
            isAdmin?: boolean;
        }
    }
}
export declare enum UserRole {
    USER = "user",
    MODERATOR = "moderator",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum Permission {
    USER_VIEW = "user:view",
    USER_CREATE = "user:create",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    MODEL_VIEW = "model:view",
    MODEL_CREATE = "model:create",
    MODEL_UPDATE = "model:update",
    MODEL_DELETE = "model:delete",
    SYSTEM_VIEW = "system:view",
    SYSTEM_UPDATE = "system:update",
    LOG_VIEW = "log:view",
    LOG_EXPORT = "log:export",
    FINANCE_VIEW = "finance:view",
    FINANCE_MANAGE = "finance:manage",
    CHANNEL_VIEW = "channel:view",
    CHANNEL_MANAGE = "channel:manage"
}
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requirePermission: (permission: Permission | Permission[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const logAdminAction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const adminRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=admin.d.ts.map