const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 时空酒馆角色数据
const timeSpaceCharacters = [
  {
    file: 'time-tavern-characters/cyber-analyst.json',
    id: 'char_nova_cyber',
    category: 'sci-fi'
  },
  {
    file: 'time-tavern-characters/immortal-alchemist.json',
    id: 'char_yunyi_immortal',
    category: 'fantasy'
  },
  {
    file: 'time-tavern-characters/magic-scholar.json',
    id: 'char_aliya_magic',
    category: 'fantasy'
  },
  {
    file: 'time-tavern-characters/urban-detective.json',
    id: 'char_jack_detective',
    category: 'modern'
  },
  {
    file: 'time-tavern-characters/wasteland-survivor.json',
    id: 'char_ryan_wasteland',
    category: 'post-apocalyptic'
  },
  {
    file: 'time-tavern-characters/spacetime-merchant.json',
    id: 'char_dreamweaver_merchant',
    category: 'mystery'
  }
];

async function importCharacters() {
  try {
    console.log('🚀 开始导入时空酒馆角色数据...');

    // 获取测试用户ID
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@tavernai.com' }
    });

    if (!testUser) {
      console.error('❌ 测试用户不存在');
      return;
    }

    for (const charInfo of timeSpaceCharacters) {
      const filePath = path.join(__dirname, charInfo.file);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 文件不存在: ${charInfo.file}`);
        continue;
      }

      const characterData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 转换角色数据为数据库格式
      const dbCharacter = {
        id: charInfo.id,
        name: characterData.名称,
        description: characterData.描述,
        systemPrompt: characterData.提示词,
        personality: characterData.性格,
        backstory: characterData.背景故事,
        speakingStyle: characterData.说话风格,
        tags: JSON.stringify(characterData.元数据.标签),
        category: charInfo.category,
        isPublic: true,
        isNSFW: false,
        creatorId: testUser.id,
        avatar: null, // 稍后生成
        avatarStatus: 'PENDING',
        backgroundStatus: 'PENDING'
      };

      // 检查角色是否已存在
      const existingCharacter = await prisma.character.findUnique({
        where: { id: charInfo.id }
      });

      if (existingCharacter) {
        console.log(`🔄 更新角色: ${characterData.名称}`);
        await prisma.character.update({
          where: { id: charInfo.id },
          data: dbCharacter
        });
      } else {
        console.log(`✅ 创建角色: ${characterData.名称}`);
        await prisma.character.create({
          data: dbCharacter
        });
      }
    }

    console.log('🎉 所有时空酒馆角色导入完成！');

  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行导入
importCharacters();