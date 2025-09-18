"use strict";
/**
 * 数据库迁移辅助工具
 * 提供类型安全的数据迁移和Schema变更工具
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickFixes = exports.createMigrationHelpers = exports.MigrationHelpers = void 0;
const database_1 = require("../types/database");
class MigrationHelpers {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 迁移角色数据：确保JSON字段格式正确
     */
    async migrateCharacterJsonFields() {
        console.log('开始迁移角色JSON字段...');
        const characters = await this.prisma.character.findMany();
        let migratedCount = 0;
        for (const character of characters) {
            const updates = {};
            let needsUpdate = false;
            // 检查并修复tags字段
            try {
                const tags = (0, database_1.parseCharacterTags)(character.tags);
                const newTags = (0, database_1.stringifyCharacterTags)(tags);
                if (character.tags !== newTags) {
                    updates.tags = newTags;
                    needsUpdate = true;
                }
            }
            catch (error) {
                console.warn(`修复角色 ${character.id} 的tags字段`);
                updates.tags = (0, database_1.stringifyCharacterTags)([]);
                needsUpdate = true;
            }
            // 检查并修复exampleDialogs字段
            if (character.exampleDialogs) {
                try {
                    const dialogs = (0, database_1.parseCharacterExampleDialogs)(character.exampleDialogs);
                    const newDialogs = (0, database_1.stringifyCharacterExampleDialogs)(dialogs);
                    if (character.exampleDialogs !== newDialogs) {
                        updates.exampleDialogs = newDialogs;
                        needsUpdate = true;
                    }
                }
                catch (error) {
                    console.warn(`修复角色 ${character.id} 的exampleDialogs字段`);
                    updates.exampleDialogs = (0, database_1.stringifyCharacterExampleDialogs)([]);
                    needsUpdate = true;
                }
            }
            // 检查并修复metadata字段
            if (character.metadata === null || character.metadata === undefined) {
                updates.metadata = (0, database_1.stringifyCharacterMetadata)(database_1.DEFAULT_CHARACTER_METADATA);
                needsUpdate = true;
            }
            else {
                try {
                    const metadata = (0, database_1.parseCharacterMetadata)(character.metadata);
                    const newMetadata = (0, database_1.stringifyCharacterMetadata)(metadata);
                    if (character.metadata !== newMetadata) {
                        updates.metadata = newMetadata;
                        needsUpdate = true;
                    }
                }
                catch (error) {
                    console.warn(`修复角色 ${character.id} 的metadata字段`);
                    updates.metadata = (0, database_1.stringifyCharacterMetadata)(database_1.DEFAULT_CHARACTER_METADATA);
                    needsUpdate = true;
                }
            }
            if (needsUpdate) {
                await this.prisma.character.update({
                    where: { id: character.id },
                    data: updates
                });
                migratedCount++;
            }
        }
        console.log(`角色JSON字段迁移完成，共处理 ${migratedCount} 个角色`);
        return migratedCount;
    }
    /**
     * 迁移聊天会话数据：确保JSON字段格式正确
     */
    async migrateChatSessionJsonFields() {
        console.log('开始迁移聊天会话JSON字段...');
        const sessions = await this.prisma.chatSession.findMany();
        let migratedCount = 0;
        for (const session of sessions) {
            const updates = {};
            let needsUpdate = false;
            // 检查并修复metadata字段
            if (session.metadata === null || session.metadata === undefined) {
                updates.metadata = (0, database_1.stringifyChatSessionMetadata)({});
                needsUpdate = true;
            }
            else {
                try {
                    const metadata = (0, database_1.parseChatSessionMetadata)(session.metadata);
                    const newMetadata = (0, database_1.stringifyChatSessionMetadata)(metadata);
                    if (session.metadata !== newMetadata) {
                        updates.metadata = newMetadata;
                        needsUpdate = true;
                    }
                }
                catch (error) {
                    console.warn(`修复会话 ${session.id} 的metadata字段`);
                    updates.metadata = (0, database_1.stringifyChatSessionMetadata)({});
                    needsUpdate = true;
                }
            }
            if (needsUpdate) {
                await this.prisma.chatSession.update({
                    where: { id: session.id },
                    data: updates
                });
                migratedCount++;
            }
        }
        console.log(`聊天会话JSON字段迁移完成，共处理 ${migratedCount} 个会话`);
        return migratedCount;
    }
    /**
     * 重新计算角色统计数据
     */
    async recalculateCharacterStats() {
        console.log('开始重新计算角色统计数据...');
        const characters = await this.prisma.character.findMany({
            select: { id: true }
        });
        let updatedCount = 0;
        for (const character of characters) {
            // 计算聊天次数
            const chatCount = await this.prisma.chatSession.count({
                where: { characterId: character.id }
            });
            // 计算收藏次数
            const favoriteCount = await this.prisma.characterFavorite.count({
                where: { characterId: character.id }
            });
            // 计算平均评分
            const ratingStats = await this.prisma.characterRating.aggregate({
                where: { characterId: character.id },
                _avg: { rating: true },
                _count: { rating: true }
            });
            await this.prisma.character.update({
                where: { id: character.id },
                data: {
                    chatCount,
                    favoriteCount,
                    rating: ratingStats._avg.rating || 0,
                    ratingCount: ratingStats._count.rating
                }
            });
            updatedCount++;
        }
        console.log(`角色统计数据重新计算完成，共处理 ${updatedCount} 个角色`);
        return updatedCount;
    }
    /**
     * 重新计算聊天会话统计数据
     */
    async recalculateChatSessionStats() {
        console.log('开始重新计算聊天会话统计数据...');
        const sessions = await this.prisma.chatSession.findMany({
            select: { id: true }
        });
        let updatedCount = 0;
        for (const session of sessions) {
            // 计算消息数量
            const messageCount = await this.prisma.message.count({
                where: {
                    sessionId: session.id,
                    deleted: false
                }
            });
            // 计算总token数
            const tokenStats = await this.prisma.message.aggregate({
                where: {
                    sessionId: session.id,
                    deleted: false
                },
                _sum: { tokens: true }
            });
            // 获取最后一条消息的时间
            const lastMessage = await this.prisma.message.findFirst({
                where: {
                    sessionId: session.id,
                    deleted: false
                },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });
            await this.prisma.chatSession.update({
                where: { id: session.id },
                data: {
                    messageCount,
                    totalTokens: tokenStats._sum.tokens || 0,
                    lastMessageAt: lastMessage?.createdAt || null
                }
            });
            updatedCount++;
        }
        console.log(`聊天会话统计数据重新计算完成，共处理 ${updatedCount} 个会话`);
        return updatedCount;
    }
    /**
     * 清理孤儿数据
     */
    async cleanupOrphanedData() {
        console.log('开始清理孤儿数据...');
        // 清理无效的角色收藏
        const orphanedFavorites = await this.prisma.characterFavorite.deleteMany({
            where: {
                OR: [
                    {
                        character: null
                    },
                    {
                        user: null
                    }
                ]
            }
        });
        // 清理无效的角色评分
        const orphanedRatings = await this.prisma.characterRating.deleteMany({
            where: {
                OR: [
                    {
                        character: null
                    },
                    {
                        user: null
                    }
                ]
            }
        });
        // 清理无效的消息
        const orphanedMessages = await this.prisma.message.deleteMany({
            where: {
                session: null
            }
        });
        console.log(`孤儿数据清理完成:`);
        console.log(`  - 收藏记录: ${orphanedFavorites.count}`);
        console.log(`  - 评分记录: ${orphanedRatings.count}`);
        console.log(`  - 消息记录: ${orphanedMessages.count}`);
        return {
            favorites: orphanedFavorites.count,
            ratings: orphanedRatings.count,
            messages: orphanedMessages.count
        };
    }
    /**
     * 验证数据完整性
     */
    async validateDataIntegrity() {
        console.log('开始验证数据完整性...');
        const issues = [];
        // 检查角色数据
        const charactersWithInvalidJson = await this.prisma.character.findMany({
            where: {
                OR: [
                    { tags: null },
                    { metadata: null }
                ]
            }
        });
        if (charactersWithInvalidJson.length > 0) {
            issues.push(`发现 ${charactersWithInvalidJson.length} 个角色的JSON字段为null`);
        }
        // 检查聊天会话数据
        const sessionsWithInvalidJson = await this.prisma.chatSession.findMany({
            where: {
                metadata: null
            }
        });
        if (sessionsWithInvalidJson.length > 0) {
            issues.push(`发现 ${sessionsWithInvalidJson.length} 个聊天会话的JSON字段为null`);
        }
        // 检查统计数据一致性
        const charactersWithInconsistentStats = await this.prisma.$queryRaw `
      SELECT c.id, c.chatCount, COUNT(cs.id) as actualChatCount
      FROM Character c
      LEFT JOIN ChatSession cs ON c.id = cs.characterId
      GROUP BY c.id, c.chatCount
      HAVING c.chatCount != COUNT(cs.id)
    `;
        if (charactersWithInconsistentStats.length > 0) {
            issues.push(`发现 ${charactersWithInconsistentStats.length} 个角色的聊天统计数据不一致`);
        }
        if (issues.length === 0) {
            console.log('数据完整性验证通过');
        }
        else {
            console.log('数据完整性验证发现问题:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }
        return {
            valid: issues.length === 0,
            issues
        };
    }
    /**
     * 执行完整的数据迁移
     */
    async runFullMigration() {
        console.log('开始执行完整的数据迁移...');
        const results = {
            characterJsonMigration: 0,
            sessionJsonMigration: 0,
            characterStatsRecalculation: 0,
            sessionStatsRecalculation: 0,
            orphanedDataCleanup: {
                favorites: 0,
                ratings: 0,
                messages: 0
            },
            validationResult: {
                valid: false,
                issues: []
            }
        };
        try {
            // 1. 迁移JSON字段
            results.characterJsonMigration = await this.migrateCharacterJsonFields();
            results.sessionJsonMigration = await this.migrateChatSessionJsonFields();
            // 2. 重新计算统计数据
            results.characterStatsRecalculation = await this.recalculateCharacterStats();
            results.sessionStatsRecalculation = await this.recalculateChatSessionStats();
            // 3. 清理孤儿数据
            results.orphanedDataCleanup = await this.cleanupOrphanedData();
            // 4. 验证数据完整性
            results.validationResult = await this.validateDataIntegrity();
            console.log('完整数据迁移执行完成');
        }
        catch (error) {
            console.error('数据迁移过程中发生错误:', error);
            throw error;
        }
        return results;
    }
}
exports.MigrationHelpers = MigrationHelpers;
/**
 * 迁移工具函数
 */
const createMigrationHelpers = (prisma) => {
    return new MigrationHelpers(prisma);
};
exports.createMigrationHelpers = createMigrationHelpers;
/**
 * 快速修复常见问题的工具函数
 */
exports.quickFixes = {
    /**
     * 修复空的JSON字段
     */
    fixEmptyJsonFields: async (prisma) => {
        const migration = new MigrationHelpers(prisma);
        await migration.migrateCharacterJsonFields();
        await migration.migrateChatSessionJsonFields();
    },
    /**
     * 重新计算所有统计数据
     */
    recalculateAllStats: async (prisma) => {
        const migration = new MigrationHelpers(prisma);
        await migration.recalculateCharacterStats();
        await migration.recalculateChatSessionStats();
    },
    /**
     * 数据完整性检查
     */
    validateIntegrity: async (prisma) => {
        const migration = new MigrationHelpers(prisma);
        return migration.validateDataIntegrity();
    }
};
//# sourceMappingURL=migration-helpers.js.map