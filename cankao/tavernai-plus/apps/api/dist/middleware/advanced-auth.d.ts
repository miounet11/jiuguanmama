import { Request, Response, NextFunction } from 'express';
interface AuthContext {
    user: any;
    permissions: string[];
    accessLevel: 'guest' | 'user' | 'premium' | 'admin' | 'system';
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    mfaVerified?: boolean;
    apiKeyId?: string;
}
interface AuthConfig {
    requireMFA?: boolean;
    requirePremium?: boolean;
    requireAdmin?: boolean;
    permissions?: string[];
    resourceAccess?: string[];
    rateLimit?: {
        requests: number;
        windowMs: number;
    };
    auditLog?: boolean;
}
/**
 * Advanced JWT authentication with enhanced security
 */
export declare function advancedAuth(config?: AuthConfig): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Multi-factor authentication middleware
 */
export declare function requireMFA(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Resource-based authorization
 */
export declare function requireResourceAccess(resourceType: string, action?: string): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Fine-grained permission middleware
 */
export declare function requirePermissions(permissions: string | string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Advanced rate limiting with user-specific limits
 */
export declare function advancedRateLimit(config: {
    requests: number;
    windowMs: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Audit logging middleware
 */
export declare function auditLog(options?: {
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    sensitiveFields?: string[];
}): (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            authContext?: AuthContext;
        }
    }
}
export { AuthContext, AuthConfig, };
//# sourceMappingURL=advanced-auth.d.ts.map