"use strict";
/**
 * 类型定义入口文件
 * 统一导出所有类型定义，提供便捷的导入接口
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickFixes = exports.createMigrationHelpers = exports.MigrationHelpers = exports.getDatabaseService = exports.createDatabaseService = exports.DatabaseService = exports.createAdvancedQueries = exports.createQueryBuilder = exports.AdvancedQueries = exports.QueryBuilderFactory = exports.MessageQueryBuilder = exports.ChatSessionQueryBuilder = exports.CharacterQueryBuilder = exports.BatchMapper = exports.DataFilter = exports.ChatRoomMapper = exports.MessageMapper = exports.ChatSessionMapper = exports.CharacterMapper = exports.UserMapper = exports.stringifyChatSessionMetadata = exports.stringifyCharacterMetadata = exports.stringifyCharacterExampleDialogs = exports.stringifyCharacterTags = exports.parseChatSessionMetadata = exports.parseCharacterMetadata = exports.parseCharacterExampleDialogs = exports.parseCharacterTags = exports.isDbChatSession = exports.isDbCharacter = exports.isDbUser = exports.isValidCharacterCategory = exports.isValidSubscriptionTier = exports.isValidUserRole = void 0;
// 数据库类型
__exportStar(require("./database"), exports);
__exportStar(require("./api"), exports);
// 类型转换工具
__exportStar(require("../utils/type-mappers"), exports);
// 查询构造器
__exportStar(require("../utils/query-builder"), exports);
// 数据库服务
__exportStar(require("../services/database"), exports);
// 迁移工具
__exportStar(require("../utils/migration-helpers"), exports);
// 常用类型别名
const { PrismaClient, Prisma } = require('../node_modules/.prisma/client');
// 类型守卫函数重导出
var database_1 = require("./database");
Object.defineProperty(exports, "isValidUserRole", { enumerable: true, get: function () { return database_1.isValidUserRole; } });
Object.defineProperty(exports, "isValidSubscriptionTier", { enumerable: true, get: function () { return database_1.isValidSubscriptionTier; } });
Object.defineProperty(exports, "isValidCharacterCategory", { enumerable: true, get: function () { return database_1.isValidCharacterCategory; } });
Object.defineProperty(exports, "isDbUser", { enumerable: true, get: function () { return database_1.isDbUser; } });
Object.defineProperty(exports, "isDbCharacter", { enumerable: true, get: function () { return database_1.isDbCharacter; } });
Object.defineProperty(exports, "isDbChatSession", { enumerable: true, get: function () { return database_1.isDbChatSession; } });
// 工具函数重导出
var database_2 = require("./database");
Object.defineProperty(exports, "parseCharacterTags", { enumerable: true, get: function () { return database_2.parseCharacterTags; } });
Object.defineProperty(exports, "parseCharacterExampleDialogs", { enumerable: true, get: function () { return database_2.parseCharacterExampleDialogs; } });
Object.defineProperty(exports, "parseCharacterMetadata", { enumerable: true, get: function () { return database_2.parseCharacterMetadata; } });
Object.defineProperty(exports, "parseChatSessionMetadata", { enumerable: true, get: function () { return database_2.parseChatSessionMetadata; } });
Object.defineProperty(exports, "stringifyCharacterTags", { enumerable: true, get: function () { return database_2.stringifyCharacterTags; } });
Object.defineProperty(exports, "stringifyCharacterExampleDialogs", { enumerable: true, get: function () { return database_2.stringifyCharacterExampleDialogs; } });
Object.defineProperty(exports, "stringifyCharacterMetadata", { enumerable: true, get: function () { return database_2.stringifyCharacterMetadata; } });
Object.defineProperty(exports, "stringifyChatSessionMetadata", { enumerable: true, get: function () { return database_2.stringifyChatSessionMetadata; } });
// 映射器重导出
var type_mappers_1 = require("../utils/type-mappers");
Object.defineProperty(exports, "UserMapper", { enumerable: true, get: function () { return type_mappers_1.UserMapper; } });
Object.defineProperty(exports, "CharacterMapper", { enumerable: true, get: function () { return type_mappers_1.CharacterMapper; } });
Object.defineProperty(exports, "ChatSessionMapper", { enumerable: true, get: function () { return type_mappers_1.ChatSessionMapper; } });
Object.defineProperty(exports, "MessageMapper", { enumerable: true, get: function () { return type_mappers_1.MessageMapper; } });
Object.defineProperty(exports, "ChatRoomMapper", { enumerable: true, get: function () { return type_mappers_1.ChatRoomMapper; } });
Object.defineProperty(exports, "DataFilter", { enumerable: true, get: function () { return type_mappers_1.DataFilter; } });
Object.defineProperty(exports, "BatchMapper", { enumerable: true, get: function () { return type_mappers_1.BatchMapper; } });
// 查询构造器重导出
var query_builder_1 = require("../utils/query-builder");
Object.defineProperty(exports, "CharacterQueryBuilder", { enumerable: true, get: function () { return query_builder_1.CharacterQueryBuilder; } });
Object.defineProperty(exports, "ChatSessionQueryBuilder", { enumerable: true, get: function () { return query_builder_1.ChatSessionQueryBuilder; } });
Object.defineProperty(exports, "MessageQueryBuilder", { enumerable: true, get: function () { return query_builder_1.MessageQueryBuilder; } });
Object.defineProperty(exports, "QueryBuilderFactory", { enumerable: true, get: function () { return query_builder_1.QueryBuilderFactory; } });
Object.defineProperty(exports, "AdvancedQueries", { enumerable: true, get: function () { return query_builder_1.AdvancedQueries; } });
Object.defineProperty(exports, "createQueryBuilder", { enumerable: true, get: function () { return query_builder_1.createQueryBuilder; } });
Object.defineProperty(exports, "createAdvancedQueries", { enumerable: true, get: function () { return query_builder_1.createAdvancedQueries; } });
// 服务重导出
var database_3 = require("../services/database");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return database_3.DatabaseService; } });
Object.defineProperty(exports, "createDatabaseService", { enumerable: true, get: function () { return database_3.createDatabaseService; } });
Object.defineProperty(exports, "getDatabaseService", { enumerable: true, get: function () { return database_3.getDatabaseService; } });
// 迁移工具重导出
var migration_helpers_1 = require("../utils/migration-helpers");
Object.defineProperty(exports, "MigrationHelpers", { enumerable: true, get: function () { return migration_helpers_1.MigrationHelpers; } });
Object.defineProperty(exports, "createMigrationHelpers", { enumerable: true, get: function () { return migration_helpers_1.createMigrationHelpers; } });
Object.defineProperty(exports, "quickFixes", { enumerable: true, get: function () { return migration_helpers_1.quickFixes; } });
//# sourceMappingURL=index.js.map