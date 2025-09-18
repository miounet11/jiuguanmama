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
    static createRoom(data: CreateChatRoomData): Promise<{
        owner: {
            id: string;
            username: string;
            avatar: string | null;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            userId: string | null;
            role: string;
            isActive: boolean;
            characterId: string | null;
            roomId: string;
            permissions: string;
            joinedAt: Date;
            lastSeenAt: Date;
            isMuted: boolean;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        maxParticipants: number;
        isPrivate: boolean;
        allowSpectators: boolean;
        roomType: string;
        settings: string | null;
        lastMessageAt: Date | null;
        messageCount: number;
        totalTokens: number;
        ownerId: string;
    }>;
    /**
     * 加入聊天室
     */
    static joinRoom(data: JoinRoomData): Promise<{
        user: {
            id: string;
            username: string;
            avatar: string | null;
        } | null;
        character: {
            id: string;
            name: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        userId: string | null;
        role: string;
        isActive: boolean;
        characterId: string | null;
        roomId: string;
        permissions: string;
        joinedAt: Date;
        lastSeenAt: Date;
        isMuted: boolean;
    }>;
    /**
     * 离开聊天室
     */
    static leaveRoom(roomId: string, userId?: string, characterId?: string): Promise<void>;
    /**
     * 发送消息
     */
    static sendMessage(data: SendMessageData): Promise<{
        character: {
            id: string;
            name: string;
            avatar: string | null;
        } | null;
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        } | null;
        replyTo: ({
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
            sender: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            characterId: string | null;
            tokens: number;
            roomId: string;
            messageType: string;
            isEdited: boolean;
            isDeleted: boolean;
            senderId: string | null;
            replyToId: string | null;
        }) | null;
    } & {
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        characterId: string | null;
        tokens: number;
        roomId: string;
        messageType: string;
        isEdited: boolean;
        isDeleted: boolean;
        senderId: string | null;
        replyToId: string | null;
    }>;
    /**
     * 召唤AI角色到聊天室
     */
    static summonCharacter(data: SummonCharacterData): Promise<{
        participant: {
            user: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            userId: string | null;
            role: string;
            isActive: boolean;
            characterId: string | null;
            roomId: string;
            permissions: string;
            joinedAt: Date;
            lastSeenAt: Date;
            isMuted: boolean;
        };
        joinMessage: {
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
            sender: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
            replyTo: ({
                character: {
                    id: string;
                    name: string;
                    avatar: string | null;
                } | null;
                sender: {
                    id: string;
                    username: string;
                    avatar: string | null;
                } | null;
            } & {
                id: string;
                metadata: string | null;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                characterId: string | null;
                tokens: number;
                roomId: string;
                messageType: string;
                isEdited: boolean;
                isDeleted: boolean;
                senderId: string | null;
                replyToId: string | null;
            }) | null;
        } & {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            characterId: string | null;
            tokens: number;
            roomId: string;
            messageType: string;
            isEdited: boolean;
            isDeleted: boolean;
            senderId: string | null;
            replyToId: string | null;
        };
        character: {
            id: string;
            name: string;
            avatar: string | null;
            personality: string | null;
            creatorId: string;
            systemPrompt: string | null;
            isPublic: boolean;
        };
    }>;
    /**
     * 生成AI角色回复
     */
    static generateCharacterResponse(roomId: string, characterId: string, userId: string, trigger?: string): Promise<{
        character: {
            id: string;
            name: string;
            avatar: string | null;
        } | null;
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        } | null;
        replyTo: ({
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
            sender: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            characterId: string | null;
            tokens: number;
            roomId: string;
            messageType: string;
            isEdited: boolean;
            isDeleted: boolean;
            senderId: string | null;
            replyToId: string | null;
        }) | null;
    } & {
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        characterId: string | null;
        tokens: number;
        roomId: string;
        messageType: string;
        isEdited: boolean;
        isDeleted: boolean;
        senderId: string | null;
        replyToId: string | null;
    }>;
    /**
     * 获取聊天室列表
     */
    static getRooms(userId: string, page?: number, limit?: number): Promise<({
        _count: {
            messages: number;
        };
        owner: {
            id: string;
            username: string;
            avatar: string | null;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            userId: string | null;
            role: string;
            isActive: boolean;
            characterId: string | null;
            roomId: string;
            permissions: string;
            joinedAt: Date;
            lastSeenAt: Date;
            isMuted: boolean;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        maxParticipants: number;
        isPrivate: boolean;
        allowSpectators: boolean;
        roomType: string;
        settings: string | null;
        lastMessageAt: Date | null;
        messageCount: number;
        totalTokens: number;
        ownerId: string;
    })[]>;
    /**
     * 获取聊天室详情
     */
    static getRoomDetails(roomId: string, userId: string): Promise<{
        owner: {
            id: string;
            username: string;
            avatar: string | null;
        };
        participants: ({
            user: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
            character: {
                id: string;
                name: string;
                avatar: string | null;
                personality: string | null;
            } | null;
        } & {
            id: string;
            userId: string | null;
            role: string;
            isActive: boolean;
            characterId: string | null;
            roomId: string;
            permissions: string;
            joinedAt: Date;
            lastSeenAt: Date;
            isMuted: boolean;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        maxParticipants: number;
        isPrivate: boolean;
        allowSpectators: boolean;
        roomType: string;
        settings: string | null;
        lastMessageAt: Date | null;
        messageCount: number;
        totalTokens: number;
        ownerId: string;
    }>;
    /**
     * 获取聊天消息
     */
    static getMessages(roomId: string, userId: string, page?: number, limit?: number): Promise<({
        character: {
            id: string;
            name: string;
            avatar: string | null;
        } | null;
        sender: {
            id: string;
            username: string;
            avatar: string | null;
        } | null;
        replyTo: ({
            character: {
                id: string;
                name: string;
                avatar: string | null;
            } | null;
            sender: {
                id: string;
                username: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            characterId: string | null;
            tokens: number;
            roomId: string;
            messageType: string;
            isEdited: boolean;
            isDeleted: boolean;
            senderId: string | null;
            replyToId: string | null;
        }) | null;
    } & {
        id: string;
        metadata: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        characterId: string | null;
        tokens: number;
        roomId: string;
        messageType: string;
        isEdited: boolean;
        isDeleted: boolean;
        senderId: string | null;
        replyToId: string | null;
    })[]>;
    /**
     * 估算token数量
     */
    private static estimateTokens;
}
export default ChatRoomService;
//# sourceMappingURL=chatroom.d.ts.map