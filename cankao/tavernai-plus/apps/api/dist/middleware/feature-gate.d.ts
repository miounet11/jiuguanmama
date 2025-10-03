import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Middleware to check if the user has access to a specific feature
 * Usage: router.get('/endpoint', authenticate, featureGate('feature-id'), handler)
 */
export declare function featureGate(featureId: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if multiple features are accessible
 * Usage: router.get('/endpoint', authenticate, featureGateAny(['feature1', 'feature2']), handler)
 */
export declare function featureGateAny(featureIds: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if all features are accessible
 * Usage: router.get('/endpoint', authenticate, featureGateAll(['feature1', 'feature2']), handler)
 */
export declare function featureGateAll(featureIds: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to attach available features to the request object
 * Useful for endpoints that need to dynamically adjust based on user's available features
 */
export declare function attachAvailableFeatures(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=feature-gate.d.ts.map