/**
 * 数据库迁移辅助工具
 * 提供类型安全的数据迁移和Schema变更工具
 */
import { PrismaClient } from '@prisma/client';
export declare class MigrationHelpers {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 迁移角色数据：确保JSON字段格式正确
     */
    migrateCharacterJsonFields(): Promise<number>;
    /**
     * 迁移聊天会话数据：确保JSON字段格式正确
     */
    migrateChatSessionJsonFields(): Promise<number>;
    /**
     * 重新计算角色统计数据
     */
    recalculateCharacterStats(): Promise<number>;
    /**
     * 重新计算聊天会话统计数据
     */
    recalculateChatSessionStats(): Promise<number>;
    /**
     * 清理孤儿数据
     */
    cleanupOrphanedData(): Promise<{
        favorites: number;
        ratings: number;
        messages: number;
    }>;
    /**
     * 验证数据完整性
     */
    validateDataIntegrity(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * 执行完整的数据迁移
     */
    runFullMigration(): Promise<{
        characterJsonMigration: number;
        sessionJsonMigration: number;
        characterStatsRecalculation: number;
        sessionStatsRecalculation: number;
        orphanedDataCleanup: {
            favorites: number;
            ratings: number;
            messages: number;
        };
        validationResult: {
            valid: boolean;
            issues: string[];
        };
    }>;
}
/**
 * 迁移工具函数
 */
export declare const createMigrationHelpers: (prisma: PrismaClient) => MigrationHelpers;
/**
 * 快速修复常见问题的工具函数
 */
export declare const quickFixes: {
    /**
     * 修复空的JSON字段
     */
    fixEmptyJsonFields: (prisma: PrismaClient) => Promise<void>;
    /**
     * 重新计算所有统计数据
     */
    recalculateAllStats: (prisma: PrismaClient) => Promise<void>;
    /**
     * 数据完整性检查
     */
    validateIntegrity: (prisma: PrismaClient) => Promise<{
        valid: boolean;
        issues: string[];
    }>;
};
//# sourceMappingURL=migration-helpers.d.ts.map