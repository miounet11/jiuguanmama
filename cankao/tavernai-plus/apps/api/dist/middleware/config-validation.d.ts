import { Request, Response, NextFunction } from 'express';
export interface ConfigRequest extends Request {
    config?: {
        isValid: boolean;
        errors: Array<{
            path: string;
            message: string;
            value: any;
        }>;
        warnings: string[];
    };
}
/**
 * Middleware to validate configuration structure
 */
export declare const validateConfigStructure: (req: ConfigRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to validate template variables
 */
export declare const validateTemplateVariables: (req: ConfigRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to validate SillyTavern import
 */
export declare const validateSillyTavernImport: (req: ConfigRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to validate configuration security
 */
export declare const validateConfigSecurity: (req: ConfigRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Middleware to validate configuration size limits
 */
export declare const validateConfigSize: (maxSize?: number) => (req: ConfigRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Middleware to sanitize configuration input
 */
export declare const sanitizeConfig: (req: ConfigRequest, res: Response, next: NextFunction) => void;
/**
 * Composite middleware for configuration validation
 */
export declare const configValidationMiddleware: (((req: ConfigRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>) | ((req: ConfigRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>))[];
/**
 * Composite middleware for template validation
 */
export declare const templateValidationMiddleware: ((req: ConfigRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>)[];
/**
 * Composite middleware for SillyTavern import validation
 */
export declare const sillyTavernValidationMiddleware: (((req: ConfigRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>) | ((req: ConfigRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>))[];
//# sourceMappingURL=config-validation.d.ts.map