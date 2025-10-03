export interface CreateChatRoomData {
    name: string;
    description?: string;
    ownerId: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    allowSpectators?: boolean;
    roomType?: string;
    settings?: any;
}
export interface JoinRoomData {
    roomId: string;
    userId?: string;
    characterId?: string;
    role?: string;
}
export interface SendMessageData {
    roomId: string;
    senderId?: string;
    characterId?: string;
    content: string;
    messageType?: string;
    replyToId?: string;
}
export interface SummonCharacterData {
    roomId: string;
    characterId: string;
    userId: string;
    customPrompt?: string;
}
/**
 * 多角色聊天室服务
 */
export declare class ChatRoomService {
    /**
     * 创建聊天室
     */
    static createRoom(data: CreateChatRoomData): Promise<any>;
    /**
     * 加入聊天室
     */
    static joinRoom(data: JoinRoomData): Promise<any>;
    /**
     * 离开聊天室
     */
    static leaveRoom(roomId: string, userId?: string, characterId?: string): Promise<void>;
    /**
     * 发送消息
     */
    static sendMessage(data: SendMessageData): Promise<any>;
    /**
     * 召唤AI角色到聊天室
     */
    static summonCharacter(data: SummonCharacterData): Promise<{
        participant: any;
        joinMessage: any;
        character: any;
    }>;
    /**
     * 生成AI角色回复
     */
    static generateCharacterResponse(roomId: string, characterId: string, userId: string, trigger?: string): Promise<any>;
    /**
     * 获取聊天室列表
     */
    static getRooms(userId: string, page?: number, limit?: number): Promise<any>;
    /**
     * 获取聊天室详情
     */
    static getRoomDetails(roomId: string, userId: string): Promise<any>;
    /**
     * 获取聊天消息
     */
    static getMessages(roomId: string, userId: string, page?: number, limit?: number): Promise<any>;
    /**
     * 估算token数量
     */
    private static estimateTokens;
}
export default ChatRoomService;
//# sourceMappingURL=chatroom.d.ts.map