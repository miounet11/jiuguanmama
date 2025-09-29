import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getRedisManager } from '../lib/redis';
import { logger } from '../services/logger';
import { prisma } from '../lib/prisma';

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
export function advancedAuth(config: AuthConfig = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      let authContext: AuthContext | null = null;

      // Try API key authentication first
      if (apiKey) {
        authContext = await authenticateWithAPIKey(apiKey, req);
      }
      // Try JWT authentication
      else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        authContext = await authenticateWithJWT(token, req);
      }
      // Try session authentication
      else if (req.session?.userId) {
        authContext = await authenticateWithSession(req);
      }

      if (!authContext) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Valid authentication token, API key, or session required',
        });
      }

      // Verify access level requirements
      if (!checkAccessLevel(authContext, config)) {
        return res.status(403).json({
          error: 'Insufficient access level',
          required: getRequiredAccessLevel(config),
          current: authContext.accessLevel,
        });
      }

      // Verify permissions
      if (config.permissions && !checkPermissions(authContext, config.permissions)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: config.permissions,
          current: authContext.permissions,
        });
      }

      // Verify MFA if required
      if (config.requireMFA && !authContext.mfaVerified) {
        return res.status(403).json({
          error: 'Multi-factor authentication required',
          mfa_required: true,
        });
      }

      // Apply rate limiting
      if (config.rateLimit) {
        const rateLimited = await checkAdvancedRateLimit(authContext, config.rateLimit);
        if (rateLimited) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            limit: config.rateLimit,
          });
        }
      }

      // Log authentication if audit is enabled
      if (config.auditLog) {
        await logAuthenticationEvent(authContext, req, 'authenticated');
      }

      // Add auth context to request
      req.authContext = authContext;
      req.user = authContext.user;

      next();
    } catch (error) {
      logger.error('Advanced authentication error:', error);
      res.status(500).json({
        error: 'Authentication system error',
      });
    }
  };
}

/**
 * API Key authentication
 */
async function authenticateWithAPIKey(apiKey: string, req: Request): Promise<AuthContext | null> {
  try {
    // Hash the API key for lookup
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash: hashedKey,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      user: apiKeyRecord.user,
      permissions: apiKeyRecord.permissions as string[],
      accessLevel: determineAccessLevel(apiKeyRecord.user, apiKeyRecord.scope),
      sessionId: `api_${apiKeyRecord.id}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      apiKeyId: apiKeyRecord.id,
    };
  } catch (error) {
    logger.error('API key authentication error:', error);
    return null;
  }
}

/**
 * JWT token authentication with enhanced verification
 */
async function authenticateWithJWT(token: string, req: Request): Promise<AuthContext | null> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Check if token is blacklisted
    const redisManager = getRedisManager();
    if (redisManager) {
      const isBlacklisted = await redisManager.safeGet(`blacklisted_token:${token}`);
      if (isBlacklisted) {
        return null;
      }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userProfile: true,
      },
    });

    if (!user || !user.is_active) {
      return null;
    }

    // Verify session if session ID is present
    let mfaVerified = false;
    if (decoded.sessionId) {
      const session = await verifySession(decoded.sessionId, user.id);
      if (!session) {
        return null;
      }
      mfaVerified = session.mfaVerified || false;
    }

    return {
      user,
      permissions: getUserPermissions(user),
      accessLevel: determineAccessLevel(user),
      sessionId: decoded.sessionId || `jwt_${Date.now()}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      mfaVerified,
    };
  } catch (error) {
    logger.error('JWT authentication error:', error);
    return null;
  }
}

/**
 * Session-based authentication
 */
async function authenticateWithSession(req: Request): Promise<AuthContext | null> {
  try {
    const sessionId = req.session?.sessionId;
    const userId = req.session?.userId;

    if (!sessionId || !userId) {
      return null;
    }

    // Verify session in database/Redis
    const session = await verifySession(sessionId, userId);
    if (!session) {
      return null;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
      },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      user,
      permissions: getUserPermissions(user),
      accessLevel: determineAccessLevel(user),
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || '',
      mfaVerified: session.mfaVerified || false,
    };
  } catch (error) {
    logger.error('Session authentication error:', error);
    return null;
  }
}

/**
 * Multi-factor authentication middleware
 */
export function requireMFA() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authContext = req.authContext;

      if (!authContext) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      if (!authContext.mfaVerified) {
        return res.status(403).json({
          error: 'Multi-factor authentication required',
          mfa_required: true,
        });
      }

      next();
    } catch (error) {
      logger.error('MFA verification error:', error);
      res.status(500).json({
        error: 'MFA verification failed',
      });
    }
  };
}

/**
 * Resource-based authorization
 */
export function requireResourceAccess(resourceType: string, action: string = 'read') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authContext = req.authContext;

      if (!authContext) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      // Get resource ID from request
      const resourceId = req.params.id || req.params.resourceId || req.body.resourceId;

      // Check resource ownership or permissions
      const hasAccess = await checkResourceAccess(
        authContext.user.id,
        resourceType,
        resourceId,
        action
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied to resource',
          resource: resourceType,
          action,
        });
      }

      // Log resource access
      await logResourceAccess(authContext, resourceType, resourceId, action);

      next();
    } catch (error) {
      logger.error('Resource access check error:', error);
      res.status(500).json({
        error: 'Resource access verification failed',
      });
    }
  };
}

/**
 * Fine-grained permission middleware
 */
export function requirePermissions(permissions: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = req.authContext;

    if (!authContext) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    if (!checkPermissions(authContext, requiredPermissions)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermissions,
        current: authContext.permissions,
      });
    }

    next();
  };
}

/**
 * Advanced rate limiting with user-specific limits
 */
export function advancedRateLimit(config: {
  requests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authContext = req.authContext;

      // Generate rate limit key
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : `rate_limit:${authContext?.user?.id || req.ip}:${req.originalUrl}`;

      // Check rate limit
      const rateLimited = await checkAdvancedRateLimit(authContext, {
        requests: config.requests,
        windowMs: config.windowMs,
      }, key);

      if (rateLimited) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          resetTime: new Date(Date.now() + config.windowMs),
        });
      }

      // Track response for conditional counting
      if (config.skipSuccessfulRequests || config.skipFailedRequests) {
        res.on('finish', async () => {
          const shouldSkip =
            (config.skipSuccessfulRequests && res.statusCode < 400) ||
            (config.skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip) {
            // Decrement counter if we should skip this request
            const redisManager = getRedisManager();
            if (redisManager) {
              const redis = redisManager.getClient();
              if (redis) {
                await redis.decr(key);
              }
            }
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Advanced rate limit error:', error);
      next(); // Continue on error
    }
  };
}

/**
 * Audit logging middleware
 */
export function auditLog(options: {
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  sensitiveFields?: string[];
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authContext = req.authContext;

    if (!authContext) {
      return next();
    }

    const startTime = Date.now();

    // Capture response data if needed
    if (options.includeResponseBody) {
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        res.locals.responseBody = data;
        return originalJson(data);
      };
    }

    res.on('finish', async () => {
      try {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const auditData = {
          userId: authContext.user.id,
          sessionId: authContext.sessionId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ipAddress: authContext.ipAddress,
          userAgent: authContext.userAgent,
          timestamp: new Date(),
        };

        // Add request body if configured
        if (options.includeRequestBody) {
          auditData.requestBody = sanitizeObject(req.body, options.sensitiveFields);
        }

        // Add response body if configured
        if (options.includeResponseBody && res.locals.responseBody) {
          auditData.responseBody = sanitizeObject(res.locals.responseBody, options.sensitiveFields);
        }

        await logAuditEvent(auditData);
      } catch (error) {
        logger.error('Audit logging error:', error);
      }
    });

    next();
  };
}

// Helper functions

/**
 * Check access level requirements
 */
function checkAccessLevel(authContext: AuthContext, config: AuthConfig): boolean {
  const levelHierarchy = {
    guest: 0,
    user: 1,
    premium: 2,
    admin: 3,
    system: 4,
  };

  const requiredLevel = getRequiredAccessLevel(config);
  const currentLevel = levelHierarchy[authContext.accessLevel];
  const minimumLevel = levelHierarchy[requiredLevel];

  return currentLevel >= minimumLevel;
}

/**
 * Get required access level from config
 */
function getRequiredAccessLevel(config: AuthConfig): keyof typeof levelHierarchy {
  if (config.requireAdmin) return 'admin';
  if (config.requirePremium) return 'premium';
  return 'user';
}

/**
 * Check permissions
 */
function checkPermissions(authContext: AuthContext, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission =>
    authContext.permissions.includes(permission) ||
    authContext.permissions.includes('*')
  );
}

/**
 * Advanced rate limiting check
 */
async function checkAdvancedRateLimit(
  authContext: AuthContext | null,
  config: { requests: number; windowMs: number },
  customKey?: string
): Promise<boolean> {
  const redisManager = getRedisManager();

  if (!redisManager) {
    return false; // Allow if Redis is not available
  }

  const key = customKey || `rate_limit:${authContext?.user?.id || 'anonymous'}`;
  const current = await redisManager.safeGet(key);
  const count = current ? parseInt(current) : 0;

  if (count >= config.requests) {
    return true; // Rate limited
  }

  // Increment counter
  if (count === 0) {
    await redisManager.safeSet(key, '1', Math.floor(config.windowMs / 1000));
  } else {
    const redis = redisManager.getClient();
    if (redis) {
      await redis.incr(key);
    }
  }

  return false; // Not rate limited
}

/**
 * Verify session
 */
async function verifySession(sessionId: string, userId: string): Promise<any> {
  const redisManager = getRedisManager();

  if (redisManager) {
    // Check Redis first
    const sessionData = await redisManager.safeGet(`session:${sessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.userId === userId ? session : null;
    }
  }

  // Fallback to database
  const session = await prisma.userSession.findFirst({
    where: {
      sessionId,
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return session;
}

/**
 * Get user permissions
 */
function getUserPermissions(user: any): string[] {
  const permissions = [];

  // Base permissions for all users
  permissions.push('read_profile', 'write_profile');

  // Role-based permissions
  if (user.role === 'admin') {
    permissions.push('*'); // Admin has all permissions
  } else if (user.role === 'premium') {
    permissions.push('premium_features', 'advanced_settings');
  }

  // Subscription-based permissions
  if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'pro') {
    permissions.push('premium_features');
  }

  return permissions;
}

/**
 * Determine access level
 */
function determineAccessLevel(user: any, scope?: string): AuthContext['accessLevel'] {
  if (scope === 'system') return 'system';
  if (user.role === 'admin') return 'admin';
  if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'pro') return 'premium';
  if (user.role === 'user') return 'user';
  return 'guest';
}

/**
 * Check resource access
 */
async function checkResourceAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<boolean> {
  // Implementation would check database for ownership/permissions
  // This is a simplified example

  switch (resourceType) {
    case 'character':
      const character = await prisma.character.findFirst({
        where: { id: resourceId },
      });
      return character?.userId === userId || character?.is_public;

    case 'conversation':
      const conversation = await prisma.chatSession.findFirst({
        where: { id: resourceId },
        include: { participants: true },
      });
      return conversation?.participants.some(p => p.userId === userId);

    default:
      return false;
  }
}

/**
 * Log authentication events
 */
async function logAuthenticationEvent(
  authContext: AuthContext,
  req: Request,
  event: string
): Promise<void> {
  try {
    await prisma.authLog.create({
      data: {
        userId: authContext.user.id,
        event,
        ipAddress: authContext.ipAddress,
        userAgent: authContext.userAgent,
        sessionId: authContext.sessionId,
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
          accessLevel: authContext.accessLevel,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to log authentication event:', error);
  }
}

/**
 * Log resource access
 */
async function logResourceAccess(
  authContext: AuthContext,
  resourceType: string,
  resourceId: string,
  action: string
): Promise<void> {
  try {
    await prisma.accessLog.create({
      data: {
        userId: authContext.user.id,
        resourceType,
        resourceId,
        action,
        timestamp: new Date(),
        metadata: {
          sessionId: authContext.sessionId,
          ipAddress: authContext.ipAddress,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to log resource access:', error);
  }
}

/**
 * Log audit events
 */
async function logAuditEvent(auditData: any): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: auditData,
    });
  } catch (error) {
    logger.error('Failed to log audit event:', error);
  }
}

/**
 * Sanitize object by removing sensitive fields
 */
function sanitizeObject(obj: any, sensitiveFields: string[] = []): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const defaultSensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];

  const sanitized = { ...obj };

  allSensitiveFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export {
  AuthContext,
  AuthConfig,
};