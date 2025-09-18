/**
 * 类型定义入口文件
 * 统一导出所有类型定义，提供便捷的导入接口
 */

// 数据库类型
export * from './database'
export * from './api'

// 类型转换工具
export * from '../utils/type-mappers'

// 查询构造器
export * from '../utils/query-builder'

// 数据库服务
export * from '../services/database'

// 迁移工具
export * from '../utils/migration-helpers'

// 常用类型别名
export type {
  // Prisma原生类型
  PrismaClient,
  Prisma
} from '@prisma/client'

// 常用组合类型
export type DatabaseService = import('../services/database').DatabaseService
export type QueryBuilderFactory = import('../utils/query-builder').QueryBuilderFactory
export type MigrationHelpers = import('../utils/migration-helpers').MigrationHelpers

// 类型守卫函数重导出
export {
  isValidUserRole,
  isValidSubscriptionTier,
  isValidCharacterCategory,
  isDbUser,
  isDbCharacter,
  isDbChatSession
} from './database'

// 工具函数重导出
export {
  parseCharacterTags,
  parseCharacterExampleDialogs,
  parseCharacterMetadata,
  parseChatSessionMetadata,
  stringifyCharacterTags,
  stringifyCharacterExampleDialogs,
  stringifyCharacterMetadata,
  stringifyChatSessionMetadata
} from './database'

// 映射器重导出
export {
  UserMapper,
  CharacterMapper,
  ChatSessionMapper,
  MessageMapper,
  ChatRoomMapper,
  DataFilter,
  BatchMapper
} from '../utils/type-mappers'

// 查询构造器重导出
export {
  CharacterQueryBuilder,
  ChatSessionQueryBuilder,
  MessageQueryBuilder,
  QueryBuilderFactory,
  AdvancedQueries,
  createQueryBuilder,
  createAdvancedQueries
} from '../utils/query-builder'

// 服务重导出
export {
  DatabaseService,
  createDatabaseService,
  getDatabaseService
} from '../services/database'

// 迁移工具重导出
export {
  MigrationHelpers,
  createMigrationHelpers,
  quickFixes
} from '../utils/migration-helpers'
