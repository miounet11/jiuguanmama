import { Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
export interface WebSocketConnection {
    id: string;
    userId: string;
    sessionId?: string;
    socket: Socket;
    isAuthenticated: boolean;
    connectedAt: Date;
    lastActivity: Date;
    metadata?: Record<string, any>;
}
export interface WebSocketMessage {
    id: string;
    type: 'chat' | 'typing' | 'status' | 'system' | 'error';
    data: any;
    timestamp: Date;
    userId: string;
    sessionId?: string;
}
export interface WebSocketStats {
    totalConnections: number;
    activeConnections: number;
    messagesSent: number;
    messagesReceived: number;
    roomCounts: Record<string, number>;
}
export declare class WebSocketService {
    private io;
    private connections;
    private userConnections;
    private sessionRooms;
    private stats;
    constructor(httpServer: HttpServer);
    /**
     * Setup Socket.IO middleware
     */
    private setupMiddleware;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Setup individual socket event handlers
     */
    private setupSocketHandlers;
    /**
     * Handle session leave
     */
    private handleLeaveSession;
    /**
     * Handle WebSocket disconnection
     */
    private handleDisconnection;
    /**
     * Handle SSE message integration
     */
    private handleSSEMessage;
    /**
     * Broadcast message to all user connections
     */
    broadcastToUser(userId: string, event: string, data: any): number;
    /**
     * Broadcast message to session room
     */
    broadcastToSession(sessionId: string, event: string, data: any): number;
    /**
     * Get connection statistics
     */
    getStats(): WebSocketStats;
    /**
     * Get active connections
     */
    getActiveConnections(): {
        total: number;
        byUser: Record<string, number>;
        bySessions: Record<string, number>;
    };
    /**
     * Get session room size
     */
    private getSessionRoomSize;
    /**
     * Close connection
     */
    closeConnection(connectionId: string, reason?: string): boolean;
    /**
     * Cleanup inactive connections
     */
    cleanup(): void;
    /**
     * Shutdown the WebSocket service
     */
    shutdown(): void;
}
export declare let webSocketService: WebSocketService;
export declare function initializeWebSocketService(httpServer: HttpServer): WebSocketService;
//# sourceMappingURL=WebSocketService.d.ts.map