"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const StreamingService_1 = require("../services/streaming/StreamingService");
const StreamingSessionService_1 = require("../services/streaming/StreamingSessionService");
const WebSocketService_1 = require("../services/streaming/WebSocketService");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Validation middleware helper
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.get('/connect', auth_1.authMiddleware, [
    (0, express_validator_1.query)('sessionId').optional().isUUID().withMessage('Session ID must be a valid UUID'),
    (0, express_validator_1.query)('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID')
], validateRequest, async (req, res) => {
    try {
        const { sessionId, characterId } = req.query;
        const userId = req.user.id;
        // Create streaming connection
        const connectionId = StreamingService_1.streamingService.createConnection(userId, res, sessionId, { characterId });
        logger_1.logger.info('SSE connection established', {
            connectionId,
            userId,
            sessionId,
            characterId
        });
        // Connection will be managed by StreamingService
        // Response headers are set by the service
    }
    catch (error) {
        logger_1.logger.error('Failed to create SSE connection', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Failed to create streaming connection',
            code: 'STREAMING_CONNECTION_FAILED'
        });
    }
});
/**
 * Send message to streaming connection
 * POST /api/stream/send
 */
router.post('/send', auth_1.authMiddleware, [
    (0, express_validator_1.body)('connectionId').isUUID().withMessage('Connection ID must be a valid UUID'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
], validateRequest, async (req, res) => {
    try {
        const { connectionId, message, type = 'data' } = req.body;
        const userId = req.user.id;
        // Verify connection ownership
        const connection = StreamingService_1.streamingService.getConnection(connectionId);
        if (!connection || connection.userId !== userId) {
            return res.status(404).json({
                error: 'Connection not found',
                code: 'CONNECTION_NOT_FOUND'
            });
        }
        // Send message
        const success = StreamingService_1.streamingService.sendMessage(connectionId, {
            type,
            data: message
        });
        if (success) {
            res.json({
                success: true,
                connectionId,
                messageType: type
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to send message',
                code: 'MESSAGE_SEND_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to send streaming message', {
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
/**
 * Broadcast message to user's connections
 * POST /api/stream/broadcast/user
 */
router.post('/broadcast/user', auth_1.authMiddleware, [
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
], validateRequest, async (req, res) => {
    try {
        const { message, type = 'data' } = req.body;
        const userId = req.user.id;
        const sentCount = StreamingService_1.streamingService.broadcastToUser(userId, {
            type,
            data: message
        });
        res.json({
            success: true,
            sentCount,
            messageType: type
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to broadcast to user', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Broadcast failed',
            code: 'BROADCAST_FAILED'
        });
    }
});
/**
 * Broadcast message to session connections
 * POST /api/stream/broadcast/session/:sessionId
 */
router.post('/broadcast/session/:sessionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('type').optional().isIn(['data', 'error', 'complete']).withMessage('Invalid message type')
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message, type = 'data' } = req.body;
        const userId = req.user.id;
        // Verify session ownership
        const session = await StreamingSessionService_1.streamingSessionService.getSession(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({
                error: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }
        const sentCount = StreamingService_1.streamingService.broadcastToSession(sessionId, {
            type,
            data: message
        });
        res.json({
            success: true,
            sessionId,
            sentCount,
            messageType: type
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to broadcast to session', {
            sessionId: req.params.sessionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Session broadcast failed',
            code: 'SESSION_BROADCAST_FAILED'
        });
    }
});
/**
 * Interrupt streaming connection
 * POST /api/stream/interrupt/:connectionId
 */
router.post('/interrupt/:connectionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('connectionId').isUUID().withMessage('Connection ID must be a valid UUID'),
    (0, express_validator_1.body)('reason').optional().isString().withMessage('Reason must be a string')
], validateRequest, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { reason = 'User requested' } = req.body;
        const userId = req.user.id;
        // Verify connection ownership
        const connection = StreamingService_1.streamingService.getConnection(connectionId);
        if (!connection || connection.userId !== userId) {
            return res.status(404).json({
                error: 'Connection not found',
                code: 'CONNECTION_NOT_FOUND'
            });
        }
        const success = StreamingService_1.streamingService.interruptStreaming(connectionId, reason);
        if (success) {
            res.json({
                success: true,
                connectionId,
                reason
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to interrupt streaming',
                code: 'INTERRUPT_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to interrupt streaming', {
            connectionId: req.params.connectionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Interrupt failed',
            code: 'INTERRUPT_FAILED'
        });
    }
});
/**
 * Get connection status
 * GET /api/stream/status
 */
router.get('/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userConnections = StreamingService_1.streamingService.getUserConnections(userId);
        const connectionStatus = StreamingService_1.streamingService.getConnectionStatus();
        const wsStatus = WebSocketService_1.webSocketService.getActiveConnections();
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
                globalStats: StreamingService_1.streamingService.getStats()
            },
            websocket: {
                userConnections: wsStatus.byUser[userId] || 0,
                globalStats: WebSocketService_1.webSocketService.getStats()
            },
            overall: connectionStatus
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get connection status', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Status retrieval failed',
            code: 'STATUS_FAILED'
        });
    }
});
/**
 * Close specific connection
 * DELETE /api/stream/connection/:connectionId
 */
router.delete('/connection/:connectionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('connectionId').isUUID().withMessage('Connection ID must be a valid UUID')
], validateRequest, async (req, res) => {
    try {
        const { connectionId } = req.params;
        const userId = req.user.id;
        // Verify connection ownership
        const connection = StreamingService_1.streamingService.getConnection(connectionId);
        if (!connection || connection.userId !== userId) {
            return res.status(404).json({
                error: 'Connection not found',
                code: 'CONNECTION_NOT_FOUND'
            });
        }
        const success = StreamingService_1.streamingService.closeConnection(connectionId);
        if (success) {
            res.json({
                success: true,
                connectionId
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to close connection',
                code: 'CONNECTION_CLOSE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to close connection', {
            connectionId: req.params.connectionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Connection close failed',
            code: 'CONNECTION_CLOSE_FAILED'
        });
    }
});
/**
 * Create streaming session
 * POST /api/stream/sessions
 */
router.post('/sessions', auth_1.authMiddleware, [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID'),
    (0, express_validator_1.body)('metadata').optional().isObject().withMessage('Metadata must be an object')
], validateRequest, async (req, res) => {
    try {
        const { title, characterId, metadata = {} } = req.body;
        const userId = req.user.id;
        const session = await StreamingSessionService_1.streamingSessionService.createSession(userId, title, characterId, metadata);
        res.status(201).json({
            success: true,
            session
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create streaming session', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Session creation failed',
            code: 'SESSION_CREATE_FAILED'
        });
    }
});
/**
 * Get streaming sessions
 * GET /api/stream/sessions
 */
router.get('/sessions', auth_1.authMiddleware, [
    (0, express_validator_1.query)('characterId').optional().isUUID().withMessage('Character ID must be a valid UUID'),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'paused', 'completed', 'error']).withMessage('Invalid status'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'updatedAt', 'lastActivityAt', 'messageCount']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], validateRequest, async (req, res) => {
    try {
        const userId = req.user.id;
        const { characterId, status, limit = 20, offset = 0, sortBy = 'lastActivityAt', sortOrder = 'desc' } = req.query;
        const filter = {
            userId,
            characterId: characterId,
            status: status ? [status] : undefined,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy: sortBy,
            sortOrder: sortOrder
        };
        const result = await StreamingSessionService_1.streamingSessionService.getSessions(filter);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get streaming sessions', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Sessions retrieval failed',
            code: 'SESSIONS_GET_FAILED'
        });
    }
});
/**
 * Get specific streaming session
 * GET /api/stream/sessions/:sessionId
 */
router.get('/sessions/:sessionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        const session = await StreamingSessionService_1.streamingSessionService.getSession(sessionId);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get streaming session', {
            sessionId: req.params.sessionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Session retrieval failed',
            code: 'SESSION_GET_FAILED'
        });
    }
});
/**
 * Update streaming session
 * PUT /api/stream/sessions/:sessionId
 */
router.put('/sessions/:sessionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'paused', 'completed', 'error']).withMessage('Invalid status'),
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Title cannot be empty'),
    (0, express_validator_1.body)('metadata').optional().isObject().withMessage('Metadata must be an object')
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { status, title, metadata } = req.body;
        const userId = req.user.id;
        // Verify session ownership
        const existingSession = await StreamingSessionService_1.streamingSessionService.getSession(sessionId);
        if (!existingSession || existingSession.userId !== userId) {
            return res.status(404).json({
                error: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }
        const updates = {};
        if (status !== undefined)
            updates.status = status;
        if (title !== undefined)
            updates.title = title;
        if (metadata !== undefined)
            updates.metadata = metadata;
        const updatedSession = await StreamingSessionService_1.streamingSessionService.updateSession(sessionId, updates);
        if (updatedSession) {
            res.json({
                success: true,
                session: updatedSession
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to update session',
                code: 'SESSION_UPDATE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to update streaming session', {
            sessionId: req.params.sessionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Session update failed',
            code: 'SESSION_UPDATE_FAILED'
        });
    }
});
/**
 * Delete streaming session
 * DELETE /api/stream/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', auth_1.authMiddleware, [
    (0, express_validator_1.param)('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        // Verify session ownership
        const session = await StreamingSessionService_1.streamingSessionService.getSession(sessionId);
        if (!session || session.userId !== userId) {
            return res.status(404).json({
                error: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }
        const success = await StreamingSessionService_1.streamingSessionService.deleteSession(sessionId);
        if (success) {
            res.json({
                success: true,
                sessionId
            });
        }
        else {
            res.status(500).json({
                error: 'Failed to delete session',
                code: 'SESSION_DELETE_FAILED'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to delete streaming session', {
            sessionId: req.params.sessionId,
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Session deletion failed',
            code: 'SESSION_DELETE_FAILED'
        });
    }
});
/**
 * Get streaming statistics
 * GET /api/stream/stats
 */
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await StreamingSessionService_1.streamingSessionService.getStats(userId);
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get streaming stats', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : String(error)
        });
        res.status(500).json({
            error: 'Stats retrieval failed',
            code: 'STATS_GET_FAILED'
        });
    }
});
exports.default = router;
//# sourceMappingURL=streaming.js.map