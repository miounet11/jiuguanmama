import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { streamingService } from '../services/streaming/StreamingService';
import { streamingSessionService } from '../services/streaming/StreamingSessionService';
import { webSocketService } from '../services/streaming/WebSocketService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware helper
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Create SSE connection for streaming
 * GET /api/stream/connect
 */
router.get('/connect',
  authMiddleware,
  [
    query('sessionId').optional().isUUID().withMessage('Session ID must be a valid UUID'),
    query('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, characterId } = req.query;
      const userId = req.user!.id;

      // Create streaming connection
      const connectionId = streamingService.createConnection(
        userId,
        res,
        sessionId as string,
        { characterId }
      );

      logger.info('SSE connection established', {
        connectionId,
        userId,
        sessionId,
        characterId
      });

      // Connection will be managed by StreamingService
      // Response headers are set by the service
    } catch (error) {
      logger.error('Failed to create SSE connection', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to create streaming connection',
        code: 'STREAMING_CONNECTION_FAILED'
      });
    }
  }
);

/**
 * Send message to streaming connection
 * POST /api/stream/send
 */
router.post('/send',
  authMiddleware,
  [
    body('connectionId').isUUID().withMessage('Connection ID must be a valid UUID'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { connectionId, message, type = 'data' } = req.body;
      const userId = req.user!.id;

      // Verify connection ownership
      const connection = streamingService.getConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({
          error: 'Connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      // Send message
      const success = streamingService.sendMessage(connectionId, {
        type,
        data: message
      });

      if (success) {
        res.json({
          success: true,
          connectionId,
          messageType: type
        });
      } else {
        res.status(500).json({
          error: 'Failed to send message',
          code: 'MESSAGE_SEND_FAILED'
        });
      }
    } catch (error) {
      logger.error('Failed to send streaming message', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Broadcast message to user's connections
 * POST /api/stream/broadcast/user
 */
router.post('/broadcast/user',
  authMiddleware,
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { message, type = 'data' } = req.body;
      const userId = req.user!.id;

      const sentCount = streamingService.broadcastToUser(userId, {
        type,
        data: message
      });

      res.json({
        success: true,
        sentCount,
        messageType: type
      });
    } catch (error) {
      logger.error('Failed to broadcast to user', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Broadcast failed',
        code: 'BROADCAST_FAILED'
      });
    }
  }
);

/**
 * Broadcast message to session connections
 * POST /api/stream/broadcast/session/:sessionId
 */
router.post('/broadcast/session/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { message, type = 'data' } = req.body;
      const userId = req.user!.id;

      // Verify session ownership
      const session = await streamingSessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      const sentCount = streamingService.broadcastToSession(sessionId, {
        type,
        data: message
      });

      res.json({
        success: true,
        sessionId,
        sentCount,
        messageType: type
      });
    } catch (error) {
      logger.error('Failed to broadcast to session', {
        sessionId: req.params.sessionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Session broadcast failed',
        code: 'SESSION_BROADCAST_FAILED'
      });
    }
  }
);

/**
 * Interrupt streaming connection
 * POST /api/stream/interrupt/:connectionId
 */
router.post('/interrupt/:connectionId',
  authMiddleware,
  [
    param('connectionId').isUUID().withMessage('Connection ID must be a valid UUID'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const { reason = 'User requested' } = req.body;
      const userId = req.user!.id;

      // Verify connection ownership
      const connection = streamingService.getConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({
          error: 'Connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      const success = streamingService.interruptStreaming(connectionId, reason);

      if (success) {
        res.json({
          success: true,
          connectionId,
          reason
        });
      } else {
        res.status(500).json({
          error: 'Failed to interrupt streaming',
          code: 'INTERRUPT_FAILED'
        });
      }
    } catch (error) {
      logger.error('Failed to interrupt streaming', {
        connectionId: req.params.connectionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Interrupt failed',
        code: 'INTERRUPT_FAILED'
      });
    }
  }
);

/**
 * Get connection status
 * GET /api/stream/status
 */
router.get('/status',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userConnections = streamingService.getUserConnections(userId);
      const connectionStatus = streamingService.getConnectionStatus();
      const wsStatus = webSocketService.getActiveConnections();

      res.json({
        streaming: {
          userConnections: userConnections.length,
          connections: userConnections.map(conn => ({
            id: conn.id,
            sessionId: conn.sessionId,
            createdAt: conn.createdAt,
            lastHeartbeat: conn.lastHeartbeat,
            isActive: conn.isActive
          })),
          globalStats: streamingService.getStats()
        },
        websocket: {
          userConnections: wsStatus.byUser[userId] || 0,
          globalStats: webSocketService.getStats()
        },
        overall: connectionStatus
      });
    } catch (error) {
      logger.error('Failed to get connection status', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Status retrieval failed',
        code: 'STATUS_FAILED'
      });
    }
  }
);

/**
 * Close specific connection
 * DELETE /api/stream/connection/:connectionId
 */
router.delete('/connection/:connectionId',
  authMiddleware,
  [
    param('connectionId').isUUID().withMessage('Connection ID must be a valid UUID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const userId = req.user!.id;

      // Verify connection ownership
      const connection = streamingService.getConnection(connectionId);
      if (!connection || connection.userId !== userId) {
        return res.status(404).json({
          error: 'Connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      const success = streamingService.closeConnection(connectionId);

      if (success) {
        res.json({
          success: true,
          connectionId
        });
      } else {
        res.status(500).json({
          error: 'Failed to close connection',
          code: 'CONNECTION_CLOSE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Failed to close connection', {
        connectionId: req.params.connectionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Connection close failed',
        code: 'CONNECTION_CLOSE_FAILED'
      });
    }
  }
);

/**
 * Create streaming session
 * POST /api/stream/sessions
 */
router.post('/sessions',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { title, characterId, metadata = {} } = req.body;
      const userId = req.user!.id;

      const session = await streamingSessionService.createSession(
        userId,
        title,
        characterId,
        metadata
      );

      res.status(201).json({
        success: true,
        session
      });
    } catch (error) {
      logger.error('Failed to create streaming session', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Session creation failed',
        code: 'SESSION_CREATE_FAILED'
      });
    }
  }
);

/**
 * Get streaming sessions
 * GET /api/stream/sessions
 */
router.get('/sessions',
  authMiddleware,
  [
    query('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID'),
    query('status').optional().isIn(['active', 'paused', 'completed', 'error']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'lastActivityAt', 'messageCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        characterId,
        status,
        limit = 20,
        offset = 0,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {
        userId,
        characterId: characterId as string,
        status: status ? [status as string] : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const result = await streamingSessionService.getSessions(filter);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Failed to get streaming sessions', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Sessions retrieval failed',
        code: 'SESSIONS_GET_FAILED'
      });
    }
  }
);

/**
 * Get specific streaming session
 * GET /api/stream/sessions/:sessionId
 */
router.get('/sessions/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const session = await streamingSessionService.getSession(sessionId);

      if (!session || session.userId !== userId) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        session
      });
    } catch (error) {
      logger.error('Failed to get streaming session', {
        sessionId: req.params.sessionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Session retrieval failed',
        code: 'SESSION_GET_FAILED'
      });
    }
  }
);

/**
 * Update streaming session
 * PUT /api/stream/sessions/:sessionId
 */
router.put('/sessions/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('status').optional().isIn(['active', 'paused', 'completed', 'error']).withMessage('Invalid status'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { status, title, metadata } = req.body;
      const userId = req.user!.id;

      // Verify session ownership
      const existingSession = await streamingSessionService.getSession(sessionId);
      if (!existingSession || existingSession.userId !== userId) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (title !== undefined) updates.title = title;
      if (metadata !== undefined) updates.metadata = metadata;

      const updatedSession = await streamingSessionService.updateSession(sessionId, updates);

      if (updatedSession) {
        res.json({
          success: true,
          session: updatedSession
        });
      } else {
        res.status(500).json({
          error: 'Failed to update session',
          code: 'SESSION_UPDATE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Failed to update streaming session', {
        sessionId: req.params.sessionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Session update failed',
        code: 'SESSION_UPDATE_FAILED'
      });
    }
  }
);

/**
 * Delete streaming session
 * DELETE /api/stream/sessions/:sessionId
 */
router.delete('/sessions/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      // Verify session ownership
      const session = await streamingSessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      const success = await streamingSessionService.deleteSession(sessionId);

      if (success) {
        res.json({
          success: true,
          sessionId
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete session',
          code: 'SESSION_DELETE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Failed to delete streaming session', {
        sessionId: req.params.sessionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Session deletion failed',
        code: 'SESSION_DELETE_FAILED'
      });
    }
  }
);

/**
 * Get streaming statistics
 * GET /api/stream/stats
 */
router.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const stats = await streamingSessionService.getStats(userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get streaming stats', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Stats retrieval failed',
        code: 'STATS_GET_FAILED'
      });
    }
  }
);

export default router;