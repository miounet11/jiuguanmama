import { Request, Response, NextFunction } from 'express';
import { VM } from 'vm2';
interface PluginPermission {
    id: string;
    name: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    requires_approval: boolean;
}
interface PluginContext {
    extensionId: string;
    userId: string;
    permissions: string[];
    sandbox?: VM;
    resourceLimits: {
        memoryLimit: number;
        timeoutMs: number;
        allowedAPIs: string[];
    };
}
declare const PLUGIN_PERMISSIONS: Record<string, PluginPermission>;
/**
 * Plugin permission verification middleware
 */
export declare function requirePluginPermission(requiredPermissions: string | string[]): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Plugin sandbox middleware for secure code execution
 */
export declare function pluginSandbox(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * API access control middleware
 */
export declare function apiAccessControl(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Security audit middleware
 */
export declare function securityAudit(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Plugin isolation middleware
 */
export declare function pluginIsolation(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            pluginContext?: PluginContext;
            isolatedContext?: any;
            pluginGlobals?: any;
        }
    }
}
export { PLUGIN_PERMISSIONS, PluginPermission, PluginContext, };
//# sourceMappingURL=plugin-security.d.ts.map