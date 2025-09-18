/**
 * 类型转换工具
 * 处理数据库类型到API类型的安全转换，确保敏感信息不泄露
 */
import { DbUser, DbCharacter, DbChatParticipant, DbChatMessage, CharacterWithCreator, CharacterWithStats, ChatSessionWithCharacter, MessageWithRelations, ChatRoomWithParticipants, SafeUser } from '../types/database';
import { ApiUser, ApiUserProfile, ApiCharacter, ApiCharacterDetail, ApiChatSession, ApiMessage, ApiChatRoom, ApiChatParticipant, ApiChatMessage } from '../types/api';
/**
 * 用户类型转换器
 */
export declare class UserMapper {
    /**
     * 转换为公开用户信息（隐藏敏感信息）
     */
    static toApiUser(user: DbUser, currentUserId?: string): ApiUser;
    /**
     * 转换为用户资料（包含完整信息，仅限本人或管理员）
     */
    static toApiUserProfile(user: DbUser): ApiUserProfile;
    /**
     * 转换为安全用户信息（仅基本信息）
     */
    static toSafeUser(user: DbUser): SafeUser;
    /**
     * 检查是否为管理员（这里应该调用实际的权限检查逻辑）
     */
    private static isAdmin;
}
/**
 * 角色类型转换器
 */
export declare class CharacterMapper {
    /**
     * 转换为API角色信息
     */
    static toApiCharacter(character: CharacterWithCreator | CharacterWithStats, currentUserId?: string): ApiCharacter;
    /**
     * 转换为详细的API角色信息
     */
    static toApiCharacterDetail(character: CharacterWithCreator, currentUserId?: string): ApiCharacterDetail;
    /**
     * 转换为角色基本信息（用于列表显示）
     */
    static toCharacterSummary(character: DbCharacter): {
        id: string;
        name: string;
        avatar: string | null;
        description: string;
        category: string;
        rating: number;
        isNSFW: boolean;
    };
}
/**
 * 聊天会话类型转换器
 */
export declare class ChatSessionMapper {
    /**
     * 转换为API聊天会话
     */
    static toApiChatSession(session: ChatSessionWithCharacter, currentUserId?: string): ApiChatSession;
}
/**
 * 消息类型转换器
 */
export declare class MessageMapper {
    /**
     * 转换为API消息
     */
    static toApiMessage(message: MessageWithRelations): ApiMessage;
}
/**
 * 聊天室类型转换器
 */
export declare class ChatRoomMapper {
    /**
     * 转换为API聊天室
     */
    static toApiChatRoom(room: ChatRoomWithParticipants, currentUserId?: string): ApiChatRoom;
    /**
     * 转换为API聊天参与者
     */
    static toApiChatParticipant(participant: DbChatParticipant & {
        user?: SafeUser;
        character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>;
    }): ApiChatParticipant;
    /**
     * 转换为API聊天消息
     */
    static toApiChatMessage(message: DbChatMessage & {
        sender?: SafeUser;
        character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>;
        replyTo?: DbChatMessage;
    }): ApiChatMessage;
    /**
     * 检查用户是否可以加入聊天室
     */
    private static canUserJoinRoom;
    /**
     * 检查用户是否可以管理聊天室
     */
    private static canUserManageRoom;
}
/**
 * 数据过滤工具
 */
export declare class DataFilter {
    /**
     * 过滤敏感用户信息
     */
    static filterUserData(user: DbUser, viewerId?: string): Partial<DbUser>;
    /**
     * 过滤角色敏感信息
     */
    static filterCharacterData(character: DbCharacter, viewerId?: string): DbCharacter;
}
/**
 * 批量转换工具
 */
export declare class BatchMapper {
    /**
     * 批量转换用户
     */
    static toApiUsers(users: DbUser[], currentUserId?: string): ApiUser[];
    /**
     * 批量转换角色
     */
    static toApiCharacters(characters: CharacterWithCreator[], currentUserId?: string): ApiCharacter[];
    /**
     * 批量转换聊天会话
     */
    static toApiChatSessions(sessions: ChatSessionWithCharacter[], currentUserId?: string): ApiChatSession[];
    /**
     * 批量转换消息
     */
    static toApiMessages(messages: MessageWithRelations[]): ApiMessage[];
}
//# sourceMappingURL=type-mappers.d.ts.map