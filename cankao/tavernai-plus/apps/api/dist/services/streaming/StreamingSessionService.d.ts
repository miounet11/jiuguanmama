export interface StreamingSession {
    id: string;
    userId: string;
    characterId?: string;
    title: string;
    status: 'active' | 'paused' | 'completed' | 'error';
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    messageCount: number;
    tokenCount: number;
    estimatedCost: number;
}
export interface SessionStats {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalMessages: number;
    totalTokens: number;
    averageSessionDuration: number;
    totalCost: number;
}
export interface SessionFilter {
    userId?: string;
    characterId?: string;
    status?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'messageCount';
    sortOrder?: 'asc' | 'desc';
}
export declare class StreamingSessionService {
    /**
     * Create a new streaming session
     */
    createSession(userId: string, title: string, characterId?: string, metadata?: Record<string, any>): Promise<StreamingSession>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<StreamingSession | null>;
    /**
     * Update session status and metadata
     */
    updateSession(sessionId: string, updates: {
        status?: 'active' | 'paused' | 'completed' | 'error';
        title?: string;
        metadata?: Record<string, any>;
        messageCount?: number;
        tokenCount?: number;
        estimatedCost?: number;
    }): Promise<StreamingSession | null>;
    /**
     * Get sessions with filtering and pagination
     */
    getSessions(filter?: SessionFilter): Promise<{
        sessions: StreamingSession[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Delete session
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Batch update sessions
     */
    batchUpdateSessions(sessionIds: string[], updates: {
        status?: 'active' | 'paused' | 'completed' | 'error';
        metadata?: Record<string, any>;
    }): Promise<number>;
    /**
     * Get session statistics
     */
    getStats(userId?: string): Promise<SessionStats>;
    /**
     * Cleanup old sessions
     */
    cleanupOldSessions(maxAge?: number): Promise<number>;
    /**
     * Get active sessions for monitoring
     */
    getActiveSessions(): Promise<{
        sessions: StreamingSession[];
        connectionCounts: Record<string, number>;
    }>;
    /**
     * Update session activity timestamp
     */
    updateActivityTimestamp(sessionId: string): Promise<void>;
    /**
     * Increment session counters
     */
    incrementCounters(sessionId: string, messageCount?: number, tokenCount?: number, cost?: number): Promise<void>;
    /**
     * Map Prisma session to service interface
     */
    private mapPrismaSession;
}
export declare const streamingSessionService: StreamingSessionService;
//# sourceMappingURL=StreamingSessionService.d.ts.map