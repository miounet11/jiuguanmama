import { Request, Response, NextFunction } from 'express';
interface CacheOptions {
    ttl?: number;
    key?: string;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
    skipResponse?: boolean;
    includeHeaders?: string[];
    excludeParams?: string[];
    varyBy?: string[];
}
/**
 * HTTP Response Cache Middleware
 */
export declare function httpCache(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * API Response Cache with configurable options
 */
export declare function apiCache(ttl?: number): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * User-specific cache
 */
export declare function userCache(ttl?: number): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Content-based cache with ETag support
 */
export declare function contentCache(ttl?: number): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Cache invalidation middleware
 */
export declare function cacheInvalidation(patterns: string[] | ((req: Request) => string[])): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Smart cache that varies by user agent, language, etc.
 */
export declare function smartCache(options?: {
    ttl?: number;
    varyByUserAgent?: boolean;
    varyByLanguage?: boolean;
    varyByEncoding?: boolean;
}): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Cache warming utility
 */
export declare function warmCache(urls: string[], baseUrl?: string): Promise<void>;
declare const _default: {
    httpCache: typeof httpCache;
    apiCache: typeof apiCache;
    userCache: typeof userCache;
    contentCache: typeof contentCache;
    cacheInvalidation: typeof cacheInvalidation;
    smartCache: typeof smartCache;
    warmCache: typeof warmCache;
};
export default _default;
//# sourceMappingURL=cache.d.ts.map