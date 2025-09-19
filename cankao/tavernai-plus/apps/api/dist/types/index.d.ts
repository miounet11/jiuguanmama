/**
 * 类型定义入口文件
 * 统一导出所有类型定义，提供便捷的导入接口
 */
export * from './database';
export * from './api';
export * from '../utils/type-mappers';
export * from '../utils/query-builder';
export * from '../services/database';
export * from '../utils/migration-helpers';
declare const PrismaClient: any, Prisma: any;
export type { PrismaClient, Prisma };
export type DatabaseService = import('../services/database').DatabaseService;
export type QueryBuilderFactory = import('../utils/query-builder').QueryBuilderFactory;
export type MigrationHelpers = import('../utils/migration-helpers').MigrationHelpers;
export { isValidUserRole, isValidSubscriptionTier, isValidCharacterCategory, isDbUser, isDbCharacter, isDbChatSession } from './database';
export { parseCharacterTags, parseCharacterExampleDialogs, parseCharacterMetadata, parseChatSessionMetadata, stringifyCharacterTags, stringifyCharacterExampleDialogs, stringifyCharacterMetadata, stringifyChatSessionMetadata } from './database';
export { UserMapper, CharacterMapper, ChatSessionMapper, MessageMapper, ChatRoomMapper, DataFilter, BatchMapper } from '../utils/type-mappers';
export { CharacterQueryBuilder, ChatSessionQueryBuilder, MessageQueryBuilder, QueryBuilderFactory, AdvancedQueries, createQueryBuilder, createAdvancedQueries } from '../utils/query-builder';
export { DatabaseService, createDatabaseService, getDatabaseService } from '../services/database';
export { MigrationHelpers, createMigrationHelpers, quickFixes } from '../utils/migration-helpers';
//# sourceMappingURL=index.d.ts.map