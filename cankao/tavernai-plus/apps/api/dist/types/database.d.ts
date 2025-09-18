/**
 * 数据库实体类型定义
 * 基于Prisma生成的类型，提供类型安全的数据库操作
 */
import { User as PrismaUser, Character as PrismaCharacter, ChatSession as PrismaChatSession, Message as PrismaMessage, CharacterFavorite as PrismaCharacterFavorite, CharacterRating as PrismaCharacterRating, ChatRoom as PrismaChatRoom, ChatParticipant as PrismaChatParticipant, ChatMessage as PrismaChatMessage, Transaction as PrismaTransaction, OAuthAccount as PrismaOAuthAccount, RefreshToken as PrismaRefreshToken, Prisma } from '@prisma/client';
export type DbUser = PrismaUser;
export type DbCharacter = PrismaCharacter;
export type DbChatSession = PrismaChatSession;
export type DbMessage = PrismaMessage;
export type DbCharacterFavorite = PrismaCharacterFavorite;
export type DbCharacterRating = PrismaCharacterRating;
export type DbChatRoom = PrismaChatRoom;
export type DbChatParticipant = PrismaChatParticipant;
export type DbChatMessage = PrismaChatMessage;
export type DbTransaction = PrismaTransaction;
export type DbOAuthAccount = PrismaOAuthAccount;
export type DbRefreshToken = PrismaRefreshToken;
export type UserWithStats = DbUser & {
    _count: {
        characters: number;
        chatSessions: number;
        favorites: number;
        ratings: number;
    };
};
export type SafeUser = Omit<DbUser, 'passwordHash' | 'verificationToken' | 'resetPasswordToken'>;
export type UserRole = 'user' | 'creator' | 'admin' | 'moderator';
export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'premium';
export type CharacterWithCreator = DbCharacter & {
    creator: SafeUser;
};
export type CharacterWithStats = DbCharacter & {
    creator: SafeUser;
    _count: {
        chatSessions: number;
        messages: number;
        favorites: number;
        ratings: number;
    };
    isFavorited?: boolean;
    isNew?: boolean;
};
export type CharacterCreateInput = Omit<DbCharacter, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'chatCount' | 'favoriteCount' | 'version'>;
export type CharacterUpdateInput = Partial<Pick<DbCharacter, 'name' | 'description' | 'fullDescription' | 'personality' | 'backstory' | 'speakingStyle' | 'scenario' | 'firstMessage' | 'systemPrompt' | 'exampleDialogs' | 'avatar' | 'coverImage' | 'category' | 'tags' | 'language' | 'model' | 'temperature' | 'maxTokens' | 'isPublic' | 'isNSFW' | 'metadata'>>;
export type ChatSessionWithCharacter = DbChatSession & {
    character: Pick<DbCharacter, 'id' | 'name' | 'avatar' | 'description'>;
    user: SafeUser;
    _count: {
        messages: number;
    };
};
export type MessageWithRelations = DbMessage & {
    user?: SafeUser;
    character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>;
};
export type ChatRoomWithParticipants = DbChatRoom & {
    owner: SafeUser;
    participants: (DbChatParticipant & {
        user?: SafeUser;
        character?: Pick<DbCharacter, 'id' | 'name' | 'avatar'>;
    })[];
    _count: {
        participants: number;
        messages: number;
    };
};
export interface CharacterTags extends Array<string> {
}
export interface CharacterExampleDialogs extends Array<{
    user: string;
    character: string;
}> {
}
export interface CharacterMetadata {
    importSource?: string;
    importDate?: string;
    originalId?: string;
    customSettings?: Record<string, any>;
    [key: string]: any;
}
export interface ChatSessionMetadata {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    model?: string;
    worldInfo?: any;
    preset?: any;
    [key: string]: any;
}
export interface CharacterListOptions {
    page?: number;
    limit?: number;
    sort?: 'created' | 'rating' | 'popular' | 'favorites';
    search?: string;
    tags?: string[];
    category?: string;
    creatorId?: string;
    isPublic?: boolean;
    isNSFW?: boolean;
    isFeatured?: boolean;
}
export interface ChatSessionListOptions {
    page?: number;
    limit?: number;
    userId?: string;
    characterId?: string;
    isArchived?: boolean;
    sort?: 'updated' | 'created' | 'messages';
}
export type CharacterFindManyArgs = Prisma.CharacterFindManyArgs;
export type CharacterFindUniqueArgs = Prisma.CharacterFindUniqueArgs;
export type CharacterCreateArgs = Prisma.CharacterCreateArgs;
export type CharacterUpdateArgs = Prisma.CharacterUpdateArgs;
export type CharacterDeleteArgs = Prisma.CharacterDeleteArgs;
export type UserFindManyArgs = Prisma.UserFindManyArgs;
export type UserFindUniqueArgs = Prisma.UserFindUniqueArgs;
export type UserCreateArgs = Prisma.UserCreateArgs;
export type UserUpdateArgs = Prisma.UserUpdateArgs;
export type ChatSessionFindManyArgs = Prisma.ChatSessionFindManyArgs;
export type ChatSessionCreateArgs = Prisma.ChatSessionCreateArgs;
export type ChatSessionUpdateArgs = Prisma.ChatSessionUpdateArgs;
export declare const isValidUserRole: (role: string) => role is UserRole;
export declare const isValidSubscriptionTier: (tier: string) => tier is SubscriptionTier;
export declare const isValidCharacterCategory: (category: string) => boolean;
export declare const parseCharacterTags: (tags: string) => CharacterTags;
export declare const parseCharacterExampleDialogs: (dialogs: string | null) => CharacterExampleDialogs;
export declare const parseCharacterMetadata: (metadata: string | null) => CharacterMetadata;
export declare const parseChatSessionMetadata: (metadata: string | null) => ChatSessionMetadata;
export declare const stringifyCharacterTags: (tags: CharacterTags) => string;
export declare const stringifyCharacterExampleDialogs: (dialogs: CharacterExampleDialogs) => string;
export declare const stringifyCharacterMetadata: (metadata: CharacterMetadata) => string;
export declare const stringifyChatSessionMetadata: (metadata: ChatSessionMetadata) => string;
export declare const DEFAULT_CHARACTER_METADATA: CharacterMetadata;
export declare const DEFAULT_CHAT_SESSION_METADATA: ChatSessionMetadata;
export declare const isDbUser: (obj: any) => obj is DbUser;
export declare const isDbCharacter: (obj: any) => obj is DbCharacter;
export declare const isDbChatSession: (obj: any) => obj is DbChatSession;
//# sourceMappingURL=database.d.ts.map