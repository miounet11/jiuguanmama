import { Request, Response, NextFunction } from 'express';
export interface ExtensionRequest extends Request {
    extension?: {
        id: string;
        isInstalled: boolean;
        isEnabled: boolean;
        permissions: string[];
        isOfficial: boolean;
    };
}
/**
 * Middleware to validate extension ownership and access
 */
export declare const validateExtensionAccess: (req: ExtensionRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check extension permissions
 */
export declare const checkExtensionPermissions: (requiredPermissions: string[]) => (req: ExtensionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate extension is enabled
 */
export declare const requireExtensionEnabled: (req: ExtensionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for extension rate limiting
 */
export declare const extensionRateLimit: (maxExecutionsPerMinute?: number, maxSandboxContexts?: number) => (req: ExtensionRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware for extension security audit
 */
export declare const securityAudit: (req: ExtensionRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for extension execution monitoring
 */
export declare const executionMonitor: (req: ExtensionRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for sandbox management
 */
export declare const sandboxManager: (req: ExtensionRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to validate extension file uploads
 */
export declare const validateExtensionUpload: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Composite middleware for extension security
 */
export declare const extensionSecurityMiddleware: ((req: ExtensionRequest, res: Response, next: NextFunction) => void)[];
/**
 * Composite middleware for extension execution
 */
export declare const extensionExecutionMiddleware: ((req: ExtensionRequest, res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=extensions.d.ts.map