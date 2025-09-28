/**
 * 更新缺失头像的角色
 * 将现有的头像文件分配给没有头像的角色
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const config = {
  database: './apps/api/prisma/dev.db',
  avatarDir: './apps/web/public/uploads/characters/avatars'
};

function getAvailableAvatars() {
  try {
    const files = fs.readdirSync(config.avatarDir);
    const avatarFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
    console.log(`📂 找到 ${avatarFiles.length} 个可用头像文件:`);
    avatarFiles.forEach(file => console.log(`   ${file}`));
    return avatarFiles;
  } catch (error) {
    console.error('❌ 读取头像目录失败:', error.message);
    return [];
  }
}

function assignAvatarsToCharacters() {
  console.log('🎭 开始为缺失头像的角色分配头像...');

  const db = new Database(config.database);

  try {
    // 获取可用头像
    const availableAvatars = getAvailableAvatars();

    if (availableAvatars.length === 0) {
      console.log('❌ 没有可用的头像文件');
      return;
    }

    // 查找缺失头像的角色
    const charactersWithoutAvatars = db.prepare(`
      SELECT id, name, description, personality
      FROM Character
      WHERE avatar IS NULL
         OR avatar = ''
         OR avatar LIKE '%unsplash%'
      ORDER BY id
    `).all();

    console.log(`\n📋 找到 ${charactersWithoutAvatars.length} 个需要头像的角色`);

    if (charactersWithoutAvatars.length === 0) {
      console.log('✅ 所有角色都已有头像!');
      return;
    }

    const updateStmt = db.prepare(`
      UPDATE Character
      SET avatar = ?, avatarStatus = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let assignedCount = 0;

    // 为每个角色分配头像
    charactersWithoutAvatars.forEach((character, index) => {
      // 循环使用可用头像
      const avatarFile = availableAvatars[index % availableAvatars.length];
      const avatarUrl = `/uploads/characters/avatars/${avatarFile}`;

      try {
        updateStmt.run(avatarUrl, character.id);
        assignedCount++;

        console.log(`✅ ${character.id} (${character.name}): ${avatarFile}`);

        // 添加一些智能匹配逻辑
        if (character.description.includes('精灵') && avatarFile.includes('char1')) {
          console.log(`   🎯 智能匹配: 精灵角色使用精灵头像`);
        } else if (character.description.includes('战士') && avatarFile.includes('char2')) {
          console.log(`   🎯 智能匹配: 战士角色使用战士头像`);
        } else if (character.description.includes('AI') && avatarFile.includes('char3')) {
          console.log(`   🎯 智能匹配: AI角色使用科幻头像`);
        }

      } catch (error) {
        console.error(`❌ 更新 ${character.id} 失败:`, error.message);
      }
    });

    console.log(`\n🎉 分配完成! 成功为 ${assignedCount} 个角色分配了头像`);

    // 显示最终统计
    const finalStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN avatar IS NOT NULL AND avatar != '' AND avatar NOT LIKE '%unsplash%' THEN 1 ELSE 0 END) as with_avatar,
        SUM(CASE WHEN avatar IS NULL OR avatar = '' OR avatar LIKE '%unsplash%' THEN 1 ELSE 0 END) as without_avatar
      FROM Character
    `).get();

    console.log('\n📊 最终统计:');
    console.log(`   总角色数: ${finalStats.total}`);
    console.log(`   有头像: ${finalStats.with_avatar}`);
    console.log(`   无头像: ${finalStats.without_avatar}`);
    console.log(`   完成率: ${(finalStats.with_avatar / finalStats.total * 100).toFixed(1)}%`);

  } finally {
    db.close();
  }
}

// 智能头像分配算法
function smartAssignAvatars() {
  console.log('🧠 启用智能头像分配...');

  const db = new Database(config.database);

  try {
    const availableAvatars = getAvailableAvatars();

    // 头像文件与角色类型的映射
    const avatarMapping = {
      'char1-avatar.png': ['精灵', '法师', '魔法', '月亮', '神秘'],
      'char2-avatar.png': ['兽人', '战士', '勇敢', '力量', '保护'],
      'char3-avatar.png': ['AI', '科幻', '未来', '智慧', '进化'],
      'char4-avatar.png': ['舰长', '军官', '探索', '宇宙', '星际'],
      'char5-avatar.png': ['心理师', '治愈', '温暖', '现代', '专业'],
      'char6-avatar.png': ['开发者', '程序员', '技术', '创意', '现代'],
      'char7-avatar.png': ['古代', '历史', '词人', '才女', '文学'],
      'char8-avatar.png': ['国王', '征服者', '古代', '雄心', '历史'],
      'char100-avatar.png': ['动漫', '忍者', '冷静', '神秘', '忍术'],
      'char101-avatar.png': ['高中生', '魔法少女', '正义', '活泼', '守护'],
      'char102-avatar.png': ['兽人', '战士', '温和', '治愈', '慈爱'],
      'featured1-avatar.png': ['血族', '女王', '神秘', '高贵', '夜晚'],
      'featured2-avatar.png': ['女神', '月光', '银白', '飘逸', '星空']
    };

    const charactersWithoutAvatars = db.prepare(`
      SELECT id, name, description, personality
      FROM Character
      WHERE avatar IS NULL
         OR avatar = ''
         OR avatar LIKE '%unsplash%'
      ORDER BY id
    `).all();

    const updateStmt = db.prepare(`
      UPDATE Character
      SET avatar = ?, avatarStatus = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let smartAssigned = 0;

    charactersWithoutAvatars.forEach(character => {
      let bestMatch = null;
      let bestScore = 0;

      // 计算每个头像的匹配分数
      Object.entries(avatarMapping).forEach(([avatarFile, keywords]) => {
        if (!availableAvatars.includes(avatarFile)) return;

        let score = 0;
        const characterText = `${character.name} ${character.description} ${character.personality}`.toLowerCase();

        keywords.forEach(keyword => {
          if (characterText.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestMatch = avatarFile;
        }
      });

      // 如果没有匹配，使用第一个可用头像
      if (!bestMatch && availableAvatars.length > 0) {
        bestMatch = availableAvatars[0];
      }

      if (bestMatch) {
        const avatarUrl = `/uploads/characters/avatars/${bestMatch}`;
        updateStmt.run(avatarUrl, character.id);
        smartAssigned++;

        console.log(`🎯 ${character.id} (${character.name}): ${bestMatch} (得分: ${bestScore})`);
      }
    });

    console.log(`\n🧠 智能分配完成! 为 ${smartAssigned} 个角色智能分配了头像`);

  } finally {
    db.close();
  }
}

function main() {
  console.log('🚀 头像分配工具启动...\n');

  // 检查头像目录
  if (!fs.existsSync(config.avatarDir)) {
    console.error(`❌ 头像目录不存在: ${config.avatarDir}`);
    return;
  }

  // 检查数据库
  if (!fs.existsSync(config.database)) {
    console.error(`❌ 数据库文件不存在: ${config.database}`);
    return;
  }

  // 执行智能分配
  smartAssignAvatars();

  console.log('\n💡 完成! 建议下一步:');
  console.log('   1. 重启开发服务器');
  console.log('   2. 检查前端头像显示效果');
  console.log('   3. 如需生成新头像，可继续使用NewAPI');
}

if (require.main === module) {
  main();
}
