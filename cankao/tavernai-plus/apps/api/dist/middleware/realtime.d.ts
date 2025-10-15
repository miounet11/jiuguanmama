import { Request, Response, NextFunction } from 'express';
interface RealtimeOptions {
    event?: string;
    room?: string | ((req: Request) => string);
    condition?: (req: Request, res: Response) => boolean;
    dataTransformer?: (data: any, req: Request, res: Response) => any;
    includeUser?: boolean;
}
/**
 * Real-time notification middleware
 * Emits events to WebSocket clients based on HTTP actions
 */
export declare function realtimeNotification(options: RealtimeOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Session-based real-time updates
 */
export declare function sessionRealtime(options?: {
    event?: string;
    includeUser?: boolean;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * User-specific real-time updates
 */
export declare function userRealtime(options?: {
    event?: string;
    targetUserIdField?: string;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Extension real-time updates
 */
export declare function extensionRealtime(options?: {
    event?: string;
    extensionIdField?: string;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Admin real-time updates
 */
export declare function adminRealtime(options?: {
    event?: string;
    condition?: (req: Request, res: Response) => boolean;
}): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Connection status middleware
 * Tracks user online/offline status
 */
export declare function connectionStatus(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate limiting with real-time feedback
 */
export declare function realtimeRateLimit(options?: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
}): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Message routing middleware for WebSocket events
 */
export declare function messageRouter(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Presence tracking middleware
 */
export declare function presenceTracking(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Response {
            realtimeEmit?: (event: string, data: any, room?: string) => void;
            realtimeSendToUser?: (userId: string, event: string, data: any) => void;
            realtimeBroadcast?: (event: string, data: any) => void;
        }
    }
}
declare const _default: {
    realtimeNotification: typeof realtimeNotification;
    sessionRealtime: typeof sessionRealtime;
    userRealtime: typeof userRealtime;
    extensionRealtime: typeof extensionRealtime;
    adminRealtime: typeof adminRealtime;
    connectionStatus: typeof connectionStatus;
    realtimeRateLimit: typeof realtimeRateLimit;
    messageRouter: typeof messageRouter;
    presenceTracking: typeof presenceTracking;
};
export default _default;
//# sourceMappingURL=realtime.d.ts.map