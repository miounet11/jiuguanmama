declare global {
    namespace Express {
        interface Request {
            rateLimit?: {
                limit: number;
                current: number;
                remaining: number;
                resetTime?: Date;
            };
        }
    }
}
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map