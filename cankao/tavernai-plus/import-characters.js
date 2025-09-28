const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('./apps/api/node_modules/.prisma/client');

const prisma = new PrismaClient();

// JSON文件路径配置
const CHARACTER_FILES = [
  {
    path: '../SillyTavern_Roleplay_Cards_Enhanced_Complete.json',
    source: 'Enhanced_Complete'
  },
  {
    path: '../SillyTavern_Yinhong_Enhanced_Dialogue.json',
    source: 'Yinhong_Enhanced'
  },
  {
    path: '../SillyTavern_Roleplay_Cards_Chinese_With_Yinhong.json',
    source: 'Chinese_With_Yinhong'
  },
  {
    path: '../SillyTavern_Roleplay_Cards_Chinese.json',
    source: 'Chinese'
  }
];

// 确保creator用户存在
async function ensureCreator() {
  const creator = await prisma.user.findUnique({
    where: { id: 'creator1' }
  });

  if (!creator) {
    await prisma.user.create({
      data: {
        id: 'creator1',
        username: '夜色创作者',
        email: 'creator@tavernai.com',
        passwordHash: 'dummy-hash',
        avatar: 'https://images.unsplash.com/photo-19455315324276?w=400&h=400&fit=crop&crop=face',
        bio: '专业角色卡创作者，专注于武侠、奇幻、现代都市等多元化角色设定',
        role: 'creator',
        isActive: true,
        isVerified: true
      }
    });
    console.log('✅ 创建了creator1用户');
  }
}

// 转换JSON角色到数据库格式
function transformCharacterData(jsonChar, source) {
  return {
    name: jsonChar.名称 || jsonChar.name || '未命名角色',
    description: jsonChar.描述 || jsonChar.description || '',
    fullDescription: jsonChar.详细描述 || jsonChar.fullDescription || jsonChar.描述 || '',
    personality: jsonChar.性格 || jsonChar.personality || '',
    backstory: jsonChar.背景故事 || jsonChar.backstory || jsonChar.背景 || '',
    speakingStyle: jsonChar.说话风格 || jsonChar.speakingStyle || '',
    scenario: jsonChar.场景 || jsonChar.scenario || '',
    firstMessage: jsonChar.开场对话 || jsonChar.firstMessage || jsonChar.greeting || '',
    systemPrompt: jsonChar.提示词 || jsonChar.systemPrompt || jsonChar.系统提示 || '',
    exampleDialogs: JSON.stringify(jsonChar.对话示例 || jsonChar.exampleDialogs || []),
    category: determinateCategory(jsonChar, source),
    tags: JSON.stringify(extractTags(jsonChar)),
    language: 'zh-CN',
    model: 'grok-3',
    temperature: 0.8,
    maxTokens: 2000,
    isPublic: true,
    isNSFW: false,
    isFeatured: false,
    creatorId: 'creator1', // 映射到数据库字段名
    version: 1,
    metadata: JSON.stringify({
      source: source,
      originalData: {
        触发器: jsonChar.触发器 || [],
        变量: jsonChar.变量 || {},
        特殊设定: jsonChar.特殊设定 || {}
      }
    })
  };
}

// 根据角色内容和来源判断分类
function determinateCategory(jsonChar, source) {
  const name = jsonChar.名称 || jsonChar.name || '';
  const desc = jsonChar.描述 || jsonChar.description || '';
  const content = (name + desc).toLowerCase();

  if (content.includes('时空') || content.includes('醉仙楼')) return '时空酒馆';
  if (content.includes('剑宗') || content.includes('武侠') || content.includes('江湖')) return '武侠仙侠';
  if (content.includes('王朝') || content.includes('摄政王') || content.includes('大玄')) return '古代宫廷';
  if (content.includes('现代') || content.includes('都市') || content.includes('公司')) return '现代都市';
  if (content.includes('魔法') || content.includes('奇幻') || content.includes('精灵')) return '奇幻冒险';
  if (content.includes('科幻') || content.includes('未来') || content.includes('机器人')) return '科幻未来';
  if (source.includes('Yinhong')) return '银虹系列';

  return '原创';
}

// 提取标签
function extractTags(jsonChar) {
  const tags = [];
  const personality = jsonChar.性格 || jsonChar.personality || '';
  const description = jsonChar.描述 || jsonChar.description || '';

  // 从性格描述中提取标签
  if (personality.includes('病娇')) tags.push('病娇');
  if (personality.includes('霸道')) tags.push('霸道');
  if (personality.includes('温柔')) tags.push('温柔');
  if (personality.includes('冷酷')) tags.push('冷酷');
  if (personality.includes('神秘')) tags.push('神秘');
  if (personality.includes('活泼')) tags.push('活泼');

  // 从描述中提取背景标签
  if (description.includes('师妹') || description.includes('师兄')) tags.push('师门');
  if (description.includes('王朝') || description.includes('摄政王')) tags.push('皇室');
  if (description.includes('商人')) tags.push('商业');
  if (description.includes('教授') || description.includes('研究')) tags.push('学者');
  if (description.includes('时空')) tags.push('时空');

  return tags.length > 0 ? tags : ['原创'];
}

// 主导入函数
async function importCharacters() {
  console.log('🚀 开始批量导入角色卡数据...\n');

  try {
    // 确保creator用户存在
    await ensureCreator();

    let totalImported = 0;
    let totalSkipped = 0;

    for (const fileConfig of CHARACTER_FILES) {
      const filePath = path.join(__dirname, fileConfig.path);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  文件不存在: ${filePath}`);
        continue;
      }

      console.log(`📂 处理文件: ${fileConfig.path}`);

      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let characters = jsonData.角色 || jsonData.characters || [];

      // 处理单个角色对象的情况
      if (!Array.isArray(characters) && typeof characters === 'object') {
        characters = [characters];
      }

      console.log(`   发现 ${characters.length} 个角色`);

      for (const jsonChar of characters) {
        const characterName = jsonChar.名称 || jsonChar.name || '未知角色';

        // 检查角色是否已存在
        const existing = await prisma.character.findFirst({
          where: {
            name: characterName,
            creatorId: 'creator1'
          }
        });

        if (existing) {
          console.log(`   ⏭️  跳过已存在角色: ${characterName}`);
          totalSkipped++;
          continue;
        }

        // 转换并创建角色
        const characterData = transformCharacterData(jsonChar, fileConfig.source);

        try {
          await prisma.character.create({
            data: characterData
          });
          console.log(`   ✅ 成功导入: ${characterName} (${characterData.category})`);
          totalImported++;
        } catch (error) {
          console.error(`   ❌ 导入失败: ${characterName}`, error.message);
        }
      }

      console.log('');
    }

    console.log('📊 导入完成统计:');
    console.log(`   ✅ 成功导入: ${totalImported} 个角色`);
    console.log(`   ⏭️  跳过重复: ${totalSkipped} 个角色`);
    console.log(`   📈 总计处理: ${totalImported + totalSkipped} 个角色\n`);

    // 验证数据库状态
    const finalCount = await prisma.character.count();
    console.log(`💾 数据库中总角色数: ${finalCount}`);

    // 按分类统计
    const categoryStats = await prisma.character.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });

    console.log('\n📋 按分类统计:');
    categoryStats.forEach(stat => {
      console.log(`   ${stat.category}: ${stat._count.category} 个`);
    });

  } catch (error) {
    console.error('❌ 导入过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
if (require.main === module) {
  importCharacters()
    .then(() => {
      console.log('\n🎉 角色卡批量导入任务完成!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 导入任务失败:', error);
      process.exit(1);
    });
}

module.exports = { importCharacters };
