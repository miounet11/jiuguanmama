import { Request, Response, NextFunction } from 'express';
import { streamingService } from '../services/streaming/StreamingService';
import { streamingSessionService } from '../services/streaming/StreamingSessionService';
import { logger } from '../utils/logger';

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
export const validateConnection = async (
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const connectionId = req.headers['x-connection-id'] as string || req.query.connectionId as string;

    if (!connectionId) {
      return res.status(400).json({
        error: 'Connection ID is required',
        code: 'MISSING_CONNECTION_ID'
      });
    }

    const connection = streamingService.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        error: 'Streaming connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    if (!connection.isActive) {
      return res.status(410).json({
        error: 'Streaming connection is inactive',
        code: 'CONNECTION_INACTIVE'
      });
    }

    // Verify connection ownership
    if (connection.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Access denied to streaming connection',
        code: 'CONNECTION_ACCESS_DENIED'
      });
    }

    // Add streaming context to request
    req.streaming = {
      connectionId,
      sessionId: connection.sessionId,
      isStreaming: true
    };

    next();
  } catch (error) {
    logger.error('Streaming connection validation failed', {
      connectionId: req.headers['x-connection-id'] || req.query.connectionId,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Connection validation failed',
      code: 'CONNECTION_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate streaming session
 */
export const validateSession = async (
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId || req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
        code: 'MISSING_SESSION_ID'
      });
    }

    const session = await streamingSessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Streaming session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Verify session ownership
    if (session.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Access denied to streaming session',
        code: 'SESSION_ACCESS_DENIED'
      });
    }

    // Add session context to request
    if (!req.streaming) {
      req.streaming = {};
    }
    req.streaming.sessionId = sessionId;

    next();
  } catch (error) {
    logger.error('Streaming session validation failed', {
      sessionId: req.params.sessionId || req.body.sessionId || req.query.sessionId,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Session validation failed',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware for streaming rate limiting
 */
export const streamingRateLimit = (
  maxConnectionsPerUser: number = 5,
  maxMessagesPerMinute: number = 60
) => {
  const userConnections = new Map<string, number>();
  const userMessageCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: StreamingRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check connection limit
      const userConnectionCount = streamingService.getUserConnections(userId).length;
      if (userConnectionCount >= maxConnectionsPerUser) {
        return res.status(429).json({
          error: `Too many connections. Maximum ${maxConnectionsPerUser} connections per user`,
          code: 'CONNECTION_LIMIT_EXCEEDED',
          limit: maxConnectionsPerUser,
          current: userConnectionCount
        });
      }

      // Check message rate limit
      const now = Date.now();
      const resetTime = Math.floor(now / 60000) * 60000 + 60000; // Next minute
      const userMessageData = userMessageCounts.get(userId);

      if (!userMessageData || userMessageData.resetTime <= now) {
        userMessageCounts.set(userId, { count: 1, resetTime });
      } else {
        userMessageData.count++;
        if (userMessageData.count > maxMessagesPerMinute) {
          return res.status(429).json({
            error: `Rate limit exceeded. Maximum ${maxMessagesPerMinute} messages per minute`,
            code: 'RATE_LIMIT_EXCEEDED',
            limit: maxMessagesPerMinute,
            resetTime: userMessageData.resetTime
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Streaming rate limit check failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Rate limit check failed',
        code: 'RATE_LIMIT_ERROR'
      });
    }
  };
};

/**
 * Middleware for streaming error handling
 */
export const streamingErrorHandler = (
  error: Error,
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error('Streaming error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    connectionId: req.streaming?.connectionId,
    sessionId: req.streaming?.sessionId
  });

  // Close connection if streaming error occurs
  if (req.streaming?.connectionId) {
    try {
      streamingService.closeConnection(req.streaming.connectionId);
    } catch (closeError) {
      logger.error('Failed to close connection after error', {
        connectionId: req.streaming.connectionId,
        closeError: closeError instanceof Error ? closeError.message : String(closeError)
      });
    }
  }

  // Send appropriate error response
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  if (error.name === 'TimeoutError') {
    return res.status(408).json({
      error: 'Request timeout',
      code: 'TIMEOUT_ERROR'
    });
  }

  if (error.name === 'ConnectionError') {
    return res.status(503).json({
      error: 'Service unavailable',
      code: 'CONNECTION_ERROR'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.headers['x-request-id'] || 'unknown'
  });
};

/**
 * Middleware for streaming request logging
 */
export const streamingLogger = (
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  logger.info('Streaming request started', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    connectionId: req.streaming?.connectionId,
    sessionId: req.streaming?.sessionId,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;

    logger.info('Streaming request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      connectionId: req.streaming?.connectionId,
      sessionId: req.streaming?.sessionId
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to set streaming-specific headers
 */
export const setStreamingHeaders = (
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  // Set CORS headers for streaming
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Connection-ID, X-Session-ID');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Set caching headers
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  // Set streaming-specific headers
  res.header('X-Streaming-Enabled', 'true');
  res.header('X-API-Version', '1.0');

  next();
};

/**
 * Middleware for connection cleanup on request end
 */
export const connectionCleanup = (
  req: StreamingRequest,
  res: Response,
  next: NextFunction
) => {
  // Cleanup function
  const cleanup = () => {
    if (req.streaming?.connectionId) {
      try {
        // Update activity timestamp
        streamingSessionService.updateActivityTimestamp(req.streaming.sessionId!);
      } catch (error) {
        logger.error('Failed to update activity timestamp', {
          sessionId: req.streaming.sessionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  };

  // Register cleanup handlers
  res.on('finish', cleanup);
  res.on('close', cleanup);
  req.on('close', cleanup);

  next();
};

/**
 * Middleware for streaming health check
 */
export const streamingHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = streamingService.getStats();
    const connectionStatus = streamingService.getConnectionStatus();

    // Check if streaming service is healthy
    if (stats.activeConnections > 1000) {
      logger.warn('High number of active streaming connections', {
        activeConnections: stats.activeConnections,
        totalConnections: stats.totalConnections
      });
    }

    // Add health info to response headers
    res.header('X-Streaming-Active-Connections', stats.activeConnections.toString());
    res.header('X-Streaming-Total-Connections', stats.totalConnections.toString());
    res.header('X-Streaming-Hit-Rate', stats.hitRate.toFixed(2));

    next();
  } catch (error) {
    logger.error('Streaming health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    // Continue anyway - don't block requests due to health check failures
    next();
  }
};

/**
 * Composite middleware for common streaming requirements
 */
export const streamingMiddleware = [
  streamingLogger,
  setStreamingHeaders,
  streamingRateLimit(),
  streamingHealthCheck,
  connectionCleanup
];

/**
 * Middleware for SSE-specific setup
 */
export const sseSetup = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n');

  // Setup connection management
  req.on('close', () => {
    logger.debug('SSE connection closed by client');
  });

  next();
};