import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
declare class WebSocketManager {
    private io;
    private activeSessions;
    private userSockets;
    private rooms;
    private heartbeatInterval;
    /**
     * Initialize WebSocket server with enhanced features
     */
    initialize(httpServer: HttpServer): Promise<SocketIOServer>;
    /**
     * Setup Redis adapter for horizontal scaling
     */
    private setupRedisAdapter;
    /**
     * Setup authentication middleware
     */
    private setupAuthentication;
    /**
     * Setup connection event handlers
     */
    private setupConnectionHandlers;
    /**
     * Handle new socket connection
     */
    private handleConnection;
    /**
     * Setup event handlers for a socket
     */
    private setupSocketEventHandlers;
    /**
     * Handle joining a session
     */
    private handleJoinSession;
    /**
     * Handle leaving a session
     */
    private handleLeaveSession;
    /**
     * Handle sending a message
     */
    private handleSendMessage;
    /**
     * Handle status updates
     */
    private handleStatusUpdate;
    /**
     * Handle extension events
     */
    private handleExtensionEvent;
    /**
     * Handle typing indicators
     */
    private handleTypingStart;
    private handleTypingStop;
    /**
     * Handle admin broadcasts
     */
    private handleAdminBroadcast;
    /**
     * Handle admin user actions
     */
    private handleAdminUserAction;
    /**
     * Handle socket disconnection
     */
    private handleDisconnection;
    /**
     * Track user connection
     */
    private trackUserConnection;
    /**
     * Clean up user connection
     */
    private cleanupUserConnection;
    /**
     * Setup periodic heartbeat and cleanup
     */
    private setupHeartbeat;
    /**
     * Perform periodic cleanup
     */
    private performCleanup;
    /**
     * Get WebSocket server instance
     */
    getIO(): SocketIOServer | null;
    /**
     * Send message to specific user
     */
    sendToUser(userId: string, event: string, data: any): boolean;
    /**
     * Broadcast to all connected clients
     */
    broadcast(event: string, data: any): void;
    /**
     * Get connection statistics
     */
    getStats(): {
        totalConnections: number;
        authenticatedUsers: number;
        activeSessions: number;
        activeRooms: number;
    };
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
declare let wsManager: WebSocketManager | null;
/**
 * Initialize WebSocket manager
 */
export declare const initializeWebSocket: (httpServer: HttpServer) => Promise<SocketIOServer>;
/**
 * Get WebSocket manager instance
 */
export declare const getWebSocketManager: () => WebSocketManager | null;
/**
 * Get Socket.IO server instance
 */
export declare const getSocketIO: () => SocketIOServer | null;
export default wsManager;
//# sourceMappingURL=websocket.d.ts.map