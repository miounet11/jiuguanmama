#!/usr/bin/env node

/**
 * 角色图片生成功能数据库迁移脚本
 *
 * 功能：
 * 1. 为 Character 表添加图片生成相关字段
 * 2. 兼容 SQLite 和 PostgreSQL
 * 3. 安全检查，避免重复执行
 */

const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 开始执行角色图片生成功能数据库迁移...');

    // 检查是否已经存在新字段
    const existingCharacter = await prisma.character.findFirst({
      select: { id: true }
    });

    if (existingCharacter) {
      // 尝试查询新字段来检查是否已迁移
      try {
        await prisma.$queryRaw`SELECT backgroundImage, mbtiType, avatarStatus FROM Character LIMIT 1`;
        console.log('✅ 检测到数据库已包含新字段，跳过迁移');
        return;
      } catch (error) {
        console.log('📋 需要添加新字段，继续迁移...');
      }
    }

    // 执行 SQLite 迁移
    console.log('💾 添加新字段到 Character 表...');

    const migrations = [
      'ALTER TABLE Character ADD COLUMN backgroundImage TEXT',
      'ALTER TABLE Character ADD COLUMN mbtiType TEXT',
      'ALTER TABLE Character ADD COLUMN emotionPack TEXT',
      "ALTER TABLE Character ADD COLUMN avatarStatus TEXT DEFAULT 'PENDING'",
      "ALTER TABLE Character ADD COLUMN backgroundStatus TEXT DEFAULT 'PENDING'",
      "ALTER TABLE Character ADD COLUMN emotionStatus TEXT DEFAULT 'PENDING'"
    ];

    for (const migration of migrations) {
      try {
        await prisma.$executeRawUnsafe(migration);
        console.log(`✅ 执行成功: ${migration}`);
      } catch (error) {
        // 忽略字段已存在的错误
        if (error.message.includes('duplicate column name') ||
            error.message.includes('already exists')) {
          console.log(`⚠️  字段已存在，跳过: ${migration}`);
        } else {
          throw error;
        }
      }
    }

    // 为现有角色设置默认值
    console.log('🔄 为现有角色设置默认状态...');
    await prisma.character.updateMany({
      where: {
        avatarStatus: null
      },
      data: {
        avatarStatus: 'PENDING',
        backgroundStatus: 'PENDING',
        emotionStatus: 'PENDING'
      }
    });

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const sampleCharacter = await prisma.character.findFirst({
      select: {
        id: true,
        name: true,
        avatar: true,
        backgroundImage: true,
        mbtiType: true,
        avatarStatus: true,
        backgroundStatus: true,
        emotionStatus: true
      }
    });

    if (sampleCharacter) {
      console.log('✅ 迁移验证成功！示例角色数据:');
      console.log(`   - ID: ${sampleCharacter.id}`);
      console.log(`   - 名称: ${sampleCharacter.name}`);
      console.log(`   - MBTI类型: ${sampleCharacter.mbtiType || '未设置'}`);
      console.log(`   - 头像状态: ${sampleCharacter.avatarStatus}`);
      console.log(`   - 背景状态: ${sampleCharacter.backgroundStatus}`);
    }

    console.log('🎉 角色图片生成功能数据库迁移完成！');
    console.log('');
    console.log('📝 新增字段说明:');
    console.log('   - backgroundImage: 对话背景图URL');
    console.log('   - mbtiType: MBTI性格类型 (16种)');
    console.log('   - emotionPack: 表情包数据 (预留)');
    console.log('   - avatarStatus: 头像生成状态');
    console.log('   - backgroundStatus: 背景生成状态');
    console.log('   - emotionStatus: 表情生成状态 (预留)');
    console.log('');
    console.log('🚀 现在可以使用以下功能:');
    console.log('   - POST /api/characters/:id/generate-avatar');
    console.log('   - POST /api/characters/:id/generate-background');
    console.log('   - POST /api/admin/characters/batch-generate');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🏁 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
