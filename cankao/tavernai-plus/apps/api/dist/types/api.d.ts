/**
 * API响应类型定义
 * 提供前端安全的API响应类型，处理敏感信息过滤
 */
import { CharacterTags, CharacterExampleDialogs, CharacterMetadata, ChatSessionMetadata } from './database';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface ApiListResponse<T = any> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiUser {
    id: string;
    username: string;
    email?: string;
    avatar: string | null;
    bio: string | null;
    role: string;
    credits?: number;
    subscriptionTier?: string;
    isActive: boolean;
    isVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    stats?: {
        charactersCount: number;
        chatSessionsCount: number;
        favoritesCount: number;
        ratingsCount: number;
    };
}
export interface ApiUserProfile extends ApiUser {
    email: string;
    credits: number;
    subscriptionTier: string;
    subscriptionExpiresAt: Date | null;
}
export interface ApiCharacter {
    id: string;
    name: string;
    description: string;
    fullDescription?: string | null;
    personality?: string | null;
    backstory?: string | null;
    speakingStyle?: string | null;
    scenario?: string | null;
    firstMessage?: string | null;
    systemPrompt?: string | null;
    exampleDialogs?: CharacterExampleDialogs;
    avatar: string | null;
    coverImage?: string | null;
    category: string;
    tags: CharacterTags;
    language: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isPublic: boolean;
    isNSFW: boolean;
    isFeatured: boolean;
    rating: number;
    ratingCount: number;
    chatCount: number;
    favoriteCount: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    creator: {
        id: string;
        username: string;
        avatar: string | null;
    };
    isFavorited?: boolean;
    isNew?: boolean;
    canEdit?: boolean;
}
export interface ApiCharacterDetail extends ApiCharacter {
    metadata?: CharacterMetadata;
    importedFrom?: string | null;
    stats?: {
        weeklyChats: number;
        monthlyChats: number;
        totalMessages: number;
        averageRating: number;
        lastChatAt: Date | null;
    };
}
export interface ApiChatSession {
    id: string;
    title: string | null;
    model: string;
    lastMessageAt: Date | null;
    messageCount: number;
    totalTokens: number;
    isArchived: boolean;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    character: {
        id: string;
        name: string;
        avatar: string | null;
        description: string;
    };
    user: {
        id: string;
        username: string;
        avatar: string | null;
    };
    metadata?: ChatSessionMetadata;
}
export interface ApiMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens: number;
    edited: boolean;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        username: string;
        avatar: string | null;
    } | null;
    character?: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
}
export interface ApiChatRoom {
    id: string;
    name: string;
    description: string | null;
    maxParticipants: number;
    isPrivate: boolean;
    allowSpectators: boolean;
    roomType: string;
    lastMessageAt: Date | null;
    messageCount: number;
    totalTokens: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner: {
        id: string;
        username: string;
        avatar: string | null;
    };
    participants: ApiChatParticipant[];
    canJoin?: boolean;
    canManage?: boolean;
}
export interface ApiChatParticipant {
    id: string;
    role: string;
    permissions: Record<string, any>;
    joinedAt: Date;
    lastSeenAt: Date;
    isActive: boolean;
    isMuted: boolean;
    user?: {
        id: string;
        username: string;
        avatar: string | null;
    } | null;
    character?: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
}
export interface ApiChatMessage {
    id: string;
    content: string;
    messageType: string;
    tokens: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    sender?: {
        id: string;
        username: string;
        avatar: string | null;
    } | null;
    character?: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
    replyTo?: {
        id: string;
        content: string;
        sender?: string;
    } | null;
}
export interface CreateCharacterRequest {
    name: string;
    description: string;
    fullDescription?: string;
    personality?: string;
    backstory?: string;
    speakingStyle?: string;
    scenario?: string;
    firstMessage?: string;
    systemPrompt?: string;
    exampleDialogs?: CharacterExampleDialogs;
    avatar?: string;
    coverImage?: string;
    category?: string;
    tags?: CharacterTags;
    language?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    isPublic?: boolean;
    isNSFW?: boolean;
    metadata?: CharacterMetadata;
}
export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {
}
export interface CreateChatSessionRequest {
    characterId: string;
    title?: string;
    model?: string;
    metadata?: ChatSessionMetadata;
}
export interface SendMessageRequest {
    content: string;
    sessionId?: string;
    roomId?: string;
    messageType?: string;
    replyToId?: string;
}
export interface CreateChatRoomRequest {
    name: string;
    description?: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    allowSpectators?: boolean;
    roomType?: string;
    characterIds?: string[];
}
export interface CharacterListQuery {
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
export interface ChatSessionListQuery {
    page?: number;
    limit?: number;
    characterId?: string;
    isArchived?: boolean;
    sort?: 'updated' | 'created' | 'messages';
}
export interface MessageListQuery {
    page?: number;
    limit?: number;
    sessionId?: string;
    roomId?: string;
    before?: string;
    after?: string;
}
export interface CharacterStats {
    totalCharacters: number;
    publicCharacters: number;
    featuredCharacters: number;
    nsfwCharacters: number;
    averageRating: number;
    totalChats: number;
    totalMessages: number;
    topCategories: Array<{
        category: string;
        count: number;
    }>;
}
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    creatorUsers: number;
    subscriptionStats: Array<{
        tier: string;
        count: number;
    }>;
}
export interface SystemStats {
    characters: CharacterStats;
    users: UserStats;
    activity: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        dailyChats: number;
        weeklyChats: number;
        monthlyChats: number;
    };
}
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
export interface AuthResponse {
    user: ApiUserProfile;
    token: string;
    refreshToken?: string;
    expiresAt: Date;
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: Date;
    sessionId?: string;
    roomId?: string;
    userId?: string;
}
export interface ChatMessageEvent extends WebSocketMessage {
    type: 'chat_message';
    data: ApiMessage | ApiChatMessage;
}
export interface UserTypingEvent extends WebSocketMessage {
    type: 'user_typing';
    data: {
        userId: string;
        username: string;
        isTyping: boolean;
    };
}
export interface SystemNotificationEvent extends WebSocketMessage {
    type: 'system_notification';
    data: {
        level: 'info' | 'warning' | 'error' | 'success';
        message: string;
        title?: string;
    };
}
//# sourceMappingURL=api.d.ts.map