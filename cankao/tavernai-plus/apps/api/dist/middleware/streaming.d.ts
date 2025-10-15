import { Request, Response, NextFunction } from 'express';
export interface StreamingRequest extends Request {
    streaming?: {
        connectionId?: string;
        sessionId?: string;
        isStreaming?: boolean;
    };
}
/**
 * Middleware to validate streaming connection
 */
export declare const validateConnection: (req: StreamingRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to validate streaming session
 */
export declare const validateSession: (req: StreamingRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware for streaming rate limiting
 */
export declare const streamingRateLimit: (maxConnectionsPerUser?: number, maxMessagesPerMinute?: number) => (req: StreamingRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for streaming error handling
 */
export declare const streamingErrorHandler: (error: Error, req: StreamingRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware for streaming request logging
 */
export declare const streamingLogger: (req: StreamingRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to set streaming-specific headers
 */
export declare const setStreamingHeaders: (req: StreamingRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for connection cleanup on request end
 */
export declare const connectionCleanup: (req: StreamingRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for streaming health check
 */
export declare const streamingHealthCheck: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Composite middleware for common streaming requirements
 */
export declare const streamingMiddleware: ((req: StreamingRequest, res: Response, next: NextFunction) => void)[];
/**
 * Middleware for SSE-specific setup
 */
export declare const sseSetup: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=streaming.d.ts.map