import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                email: string;
                role: string;
                credits: number;
                subscriptionTier: string;
                isActive: boolean;
                isVerified: boolean;
            };
        }
    }
}
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: string;
        credits: number;
        subscriptionTier: string;
        isActive: boolean;
        isVerified: boolean;
    };
}
export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
/**
 * JWT Token 管理器
 */
export declare class TokenManager {
    private static jwtSecret;
    private static jwtRefreshSecret;
    static initialize(): void;
    static generateAccessToken(payload: JWTPayload): string;
    static generateRefreshToken(payload: JWTPayload): string;
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): JWTPayload;
    static generateTokenPair(user: {
        id: string;
        username: string;
        email: string;
        role: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static revokeRefreshToken(token: string): Promise<void>;
}
/**
 * 密码管理器
 */
export declare class PasswordManager {
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
}
/**
 * 主要认证中间件
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 可选认证中间件
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 角色权限检查中间件
 */
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 管理员权限检查
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 订阅等级检查中间件
 */
export declare const requireSubscription: (minTier: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 积分检查中间件
 */
export declare const requireCredits: (cost: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map