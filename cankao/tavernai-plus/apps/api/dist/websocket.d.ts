import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
/**
 * WebSocket服务器类 - 专门用于多角色实时聊天
 */
export declare class WebSocketServer {
    private io;
    private connectedUsers;
    private roomParticipants;
    constructor(httpServer: HTTPServer);
    /**
     * 获取Socket.IO实例
     */
    getIO(): SocketIOServer;
    /**
     * 设置事件处理器
     */
    private setupEventHandlers;
    /**
     * Socket认证
     */
    private authenticateSocket;
    /**
     * 处理已认证的连接
     */
    private handleAuthenticatedConnection;
    /**
     * 处理加入聊天室
     */
    private handleJoinRoom;
    /**
     * 处理离开聊天室
     */
    private handleLeaveRoom;
    /**
     * 处理发送消息
     */
    private handleSendMessage;
    /**
     * 处理输入状态
     */
    private handleTyping;
    /**
     * 处理召唤角色
     */
    private handleSummonCharacter;
    /**
     * 处理触发AI回复
     */
    private handleTriggerAIResponse;
    /**
     * 处理断开连接
     */
    private handleDisconnect;
    /**
     * 获取在线用户数量
     */
    getOnlineUsersCount(): number;
    /**
     * 获取房间参与者数量
     */
    getRoomParticipantsCount(roomId: string): number;
    /**
     * 向特定用户发送消息
     */
    sendToUser(userId: string, event: string, data: any): boolean;
    /**
     * 向房间广播消息
     */
    broadcastToRoom(roomId: string, event: string, data: any): void;
    /**
     * 处理动态世界观分析和注入
     */
    private handleWorldInfoAnalysis;
    /**
     * 处理世界观建议请求
     */
    private handleWorldInfoSuggestions;
    /**
     * 实时关键词监控
     * 当检测到特定关键词时，主动推送相关世界观信息
     */
    monitorKeywordsInMessage(userId: string, message: string, context: {
        sessionId?: string;
        roomId?: string;
        characterId?: string;
    }): Promise<void>;
    /**
     * 为特定用户推送世界观更新
     */
    pushWorldInfoUpdate(userId: string, update: {
        type: 'entry_added' | 'entry_updated' | 'book_shared';
        entryId?: string;
        bookId?: string;
        title: string;
        description: string;
    }): boolean;
}
export default WebSocketServer;
//# sourceMappingURL=websocket.d.ts.map