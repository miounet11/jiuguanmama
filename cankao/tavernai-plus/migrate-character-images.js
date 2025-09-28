/**
 * 角色图像生成字段迁移脚本
 * 为Character表添加新的图像生成相关字段
 */

const Database = require('better-sqlite3');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'apps/api/prisma/dev.db');

console.log('🔧 开始角色图像字段迁移...');
console.log('数据库路径:', dbPath);

try {
  // 连接数据库
  const db = new Database(dbPath);

  // 检查是否已经迁移过
  const checkColumn = db.prepare(`
    PRAGMA table_info(Character)
  `).all();

  const hasBackgroundImage = checkColumn.some(col => col.name === 'backgroundImage');
  const hasMBTIType = checkColumn.some(col => col.name === 'mbtiType');
  const hasAvatarStatus = checkColumn.some(col => col.name === 'avatarStatus');

  if (hasBackgroundImage && hasMBTIType && hasAvatarStatus) {
    console.log('✅ 字段已存在，跳过迁移');
    db.close();
    return;
  }

  console.log('📝 添加新字段...');

  // 添加新字段
  if (!hasBackgroundImage) {
    db.exec(`ALTER TABLE Character ADD COLUMN backgroundImage TEXT;`);
    console.log('✅ 添加 backgroundImage 字段');
  }

  if (!hasMBTIType) {
    db.exec(`ALTER TABLE Character ADD COLUMN mbtiType TEXT;`);
    console.log('✅ 添加 mbtiType 字段');
  }

  if (!hasAvatarStatus) {
    db.exec(`ALTER TABLE Character ADD COLUMN avatarStatus TEXT DEFAULT 'PENDING';`);
    console.log('✅ 添加 avatarStatus 字段');
  }

  // 添加背景状态字段
  const hasBackgroundStatus = checkColumn.some(col => col.name === 'backgroundStatus');
  if (!hasBackgroundStatus) {
    db.exec(`ALTER TABLE Character ADD COLUMN backgroundStatus TEXT DEFAULT 'PENDING';`);
    console.log('✅ 添加 backgroundStatus 字段');
  }

  // 更新现有角色的状态
  const updateStmt = db.prepare(`
    UPDATE Character
    SET avatarStatus = CASE
      WHEN avatar IS NOT NULL AND avatar != '' THEN 'COMPLETED'
      ELSE 'PENDING'
    END,
    backgroundStatus = 'PENDING'
    WHERE avatarStatus IS NULL OR avatarStatus = ''
  `);

  const result = updateStmt.run();
  console.log(`✅ 更新了 ${result.changes} 个角色的状态`);

  // 关闭数据库连接
  db.close();

  console.log('🎉 迁移完成！');

} catch (error) {
  console.error('❌ 迁移失败:', error.message);
  process.exit(1);
}
