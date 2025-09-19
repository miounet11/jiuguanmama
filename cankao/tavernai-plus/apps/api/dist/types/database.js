"use strict";
/**
 * 数据库实体类型定义
 * 基于Prisma生成的类型，提供类型安全的数据库操作
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDbChatSession = exports.isDbCharacter = exports.isDbUser = exports.DEFAULT_CHAT_SESSION_METADATA = exports.DEFAULT_CHARACTER_METADATA = exports.stringifyChatSessionMetadata = exports.stringifyCharacterMetadata = exports.stringifyCharacterExampleDialogs = exports.stringifyCharacterTags = exports.parseChatSessionMetadata = exports.parseCharacterMetadata = exports.parseCharacterExampleDialogs = exports.parseCharacterTags = exports.isValidCharacterCategory = exports.isValidSubscriptionTier = exports.isValidUserRole = void 0;
const { User: PrismaUser, Character: PrismaCharacter, ChatSession: PrismaChatSession, Message: PrismaMessage, CharacterFavorite: PrismaCharacterFavorite, CharacterRating: PrismaCharacterRating, ChatRoom: PrismaChatRoom, ChatParticipant: PrismaChatParticipant, ChatMessage: PrismaChatMessage, Transaction: PrismaTransaction, OAuthAccount: PrismaOAuthAccount, RefreshToken: PrismaRefreshToken, Prisma } = require('../../node_modules/.prisma/client');
// 类型验证工具函数
const isValidUserRole = (role) => {
    return ['user', 'creator', 'admin', 'moderator'].includes(role);
};
exports.isValidUserRole = isValidUserRole;
const isValidSubscriptionTier = (tier) => {
    return ['free', 'plus', 'pro', 'premium'].includes(tier);
};
exports.isValidSubscriptionTier = isValidSubscriptionTier;
const isValidCharacterCategory = (category) => {
    const validCategories = [
        '原创', '奇幻', '科幻', '现代', '历史', '动漫', '游戏', '影视', '小说', '其他'
    ];
    return validCategories.includes(category);
};
exports.isValidCharacterCategory = isValidCharacterCategory;
// JSON字段解析工具
const parseCharacterTags = (tags) => {
    try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
exports.parseCharacterTags = parseCharacterTags;
const parseCharacterExampleDialogs = (dialogs) => {
    if (!dialogs)
        return [];
    try {
        const parsed = JSON.parse(dialogs);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
exports.parseCharacterExampleDialogs = parseCharacterExampleDialogs;
const parseCharacterMetadata = (metadata) => {
    if (!metadata)
        return {};
    try {
        return JSON.parse(metadata) || {};
    }
    catch {
        return {};
    }
};
exports.parseCharacterMetadata = parseCharacterMetadata;
const parseChatSessionMetadata = (metadata) => {
    if (!metadata)
        return {};
    try {
        return JSON.parse(metadata) || {};
    }
    catch {
        return {};
    }
};
exports.parseChatSessionMetadata = parseChatSessionMetadata;
// 字符串化工具
const stringifyCharacterTags = (tags) => {
    return JSON.stringify(tags || []);
};
exports.stringifyCharacterTags = stringifyCharacterTags;
const stringifyCharacterExampleDialogs = (dialogs) => {
    return JSON.stringify(dialogs || []);
};
exports.stringifyCharacterExampleDialogs = stringifyCharacterExampleDialogs;
const stringifyCharacterMetadata = (metadata) => {
    return JSON.stringify(metadata || {});
};
exports.stringifyCharacterMetadata = stringifyCharacterMetadata;
const stringifyChatSessionMetadata = (metadata) => {
    return JSON.stringify(metadata || {});
};
exports.stringifyChatSessionMetadata = stringifyChatSessionMetadata;
// 默认值常量
exports.DEFAULT_CHARACTER_METADATA = {};
exports.DEFAULT_CHAT_SESSION_METADATA = {
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gpt-3.5-turbo'
};
// 类型守卫函数
const isDbUser = (obj) => {
    return obj && typeof obj.id === 'string' && typeof obj.username === 'string';
};
exports.isDbUser = isDbUser;
const isDbCharacter = (obj) => {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.creatorId === 'string';
};
exports.isDbCharacter = isDbCharacter;
const isDbChatSession = (obj) => {
    return obj && typeof obj.id === 'string' && typeof obj.userId === 'string' && typeof obj.characterId === 'string';
};
exports.isDbChatSession = isDbChatSession;
//# sourceMappingURL=database.js.map