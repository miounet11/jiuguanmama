import { EventEmitter } from 'events';
import { Response } from 'express';
export interface StreamingConnection {
    id: string;
    userId: string;
    sessionId?: string;
    response: Response;
    isActive: boolean;
    createdAt: Date;
    lastHeartbeat: Date;
    metadata?: Record<string, any>;
}
export interface StreamingMessage {
    id: string;
    type: 'data' | 'heartbeat' | 'error' | 'complete';
    data?: any;
    timestamp: Date;
    connectionId: string;
}
export interface StreamingStats {
    totalConnections: number;
    activeConnections: number;
    messagesSent: number;
    averageResponseTime: number;
    errorRate: number;
}
export declare class StreamingService extends EventEmitter {
    private connections;
    private heartbeatInterval;
    private cleanupInterval;
    private stats;
    constructor();
    /**
     * Create a new SSE connection
     */
    createConnection(userId: string, response: Response, sessionId?: string, metadata?: Record<string, any>): string;
    /**
     * Send message to specific connection
     */
    sendMessage(connectionId: string, message: Partial<StreamingMessage>): boolean;
    /**
     * Broadcast message to all connections for a user
     */
    broadcastToUser(userId: string, message: Partial<StreamingMessage>): number;
    /**
     * Broadcast message to all connections in a session
     */
    broadcastToSession(sessionId: string, message: Partial<StreamingMessage>): number;
    /**
     * Close specific connection
     */
    closeConnection(connectionId: string): boolean;
    /**
     * Get connection by ID
     */
    getConnection(connectionId: string): StreamingConnection | undefined;
    /**
     * Get all connections for a user
     */
    getUserConnections(userId: string): StreamingConnection[];
    /**
     * Get all connections for a session
     */
    getSessionConnections(sessionId: string): StreamingConnection[];
    /**
     * Get streaming statistics
     */
    getStats(): StreamingStats;
    /**
     * Get detailed connection status
     */
    getConnectionStatus(): {
        total: number;
        active: number;
        byUser: Record<string, number>;
        bySession: Record<string, number>;
    };
    /**
     * Handle streaming interruption
     */
    interruptStreaming(connectionId: string, reason?: string): boolean;
    /**
     * Cleanup inactive connections
     */
    cleanup(): void;
    /**
     * Shutdown the streaming service
     */
    shutdown(): void;
    /**
     * Format message for SSE transmission
     */
    private formatSSEMessage;
    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat;
    /**
     * Start cleanup mechanism
     */
    private startCleanup;
}
export declare const streamingService: StreamingService;
//# sourceMappingURL=StreamingService.d.ts.map