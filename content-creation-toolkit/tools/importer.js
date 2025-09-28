#!/usr/bin/env node
/**
 * 九馆爸爸内容导入工具
 * 将验证通过的角色卡和世界剧本导入到数据库
 */

const fs = require('fs');
const path = require('path');

// 数据库连接路径 - 相对于九馆爸爸主项目
const DB_PATH = path.join(__dirname, '../../cankao/tavernai-plus');

// 动态加载Prisma客户端
function getPrismaClient() {
  try {
    const prismaPath = path.join(DB_PATH, 'apps/api/node_modules/.prisma/client');
    const { PrismaClient } = require(prismaPath);
    return new PrismaClient();
  } catch (error) {
    throw new Error(`无法连接数据库: ${error.message}\n请确保已运行 npm run db:generate`);
  }
}

// 检测文件类型
function detectFileType(data) {
  if (data.名称 && data.描述 && data.性格) {
    return 'character';
  } else if (data.name && data.description && data.worldInfos) {
    return 'scenario';
  }
  return null;
}

// 确保创建者用户存在
async function ensureCreator(prisma, creatorId = 'creator1') {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId }
  });

  if (!creator) {
    await prisma.user.create({
      data: {
        id: creatorId,
        username: '夜色创作者',
        email: 'creator@tavernai.com',
        passwordHash: 'dummy-hash',
        avatar: 'https://images.unsplash.com/photo-19455315324276?w=400&h=400&fit=crop&crop=face',
        bio: '专业角色卡创作者，专注于多元化角色设定',
        role: 'creator',
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ 创建了默认创建者用户: ${creatorId}`);
  }

  return creatorId;
}

// 转换角色卡数据到数据库格式
function transformCharacterData(jsonChar, creatorId) {
  return {
    name: jsonChar.名称,
    description: jsonChar.描述,
    fullDescription: jsonChar.详细描述 || jsonChar.描述,
    personality: jsonChar.性格,
    backstory: jsonChar.背景故事 || '',
    speakingStyle: jsonChar.说话风格 || '',
    scenario: jsonChar.场景,
    firstMessage: jsonChar.开场对话,
    systemPrompt: jsonChar.提示词,
    exampleDialogs: JSON.stringify(jsonChar.对话示例 || []),
    category: determinateCharacterCategory(jsonChar),
    tags: JSON.stringify(extractCharacterTags(jsonChar)),
    language: 'zh-CN',
    model: 'grok-3',
    temperature: 0.8,
    maxTokens: 2000,
    isPublic: true,
    isNSFW: false,
    isFeatured: false,
    creatorId: creatorId,
    version: 1,
    metadata: JSON.stringify({
      source: 'content-creation-toolkit',
      originalData: {
        触发器: jsonChar.触发器 || [],
        变量: jsonChar.变量 || {},
        特殊设定: jsonChar.特殊设定 || {},
        关系网络: jsonChar.关系网络 || {}
      }
    })
  };
}

// 判断角色分类
function determinateCharacterCategory(jsonChar) {
  const metadata = jsonChar.元数据;
  if (metadata && metadata.分类) {
    return metadata.分类;
  }

  const name = jsonChar.名称;
  const desc = jsonChar.描述;
  const content = (name + desc).toLowerCase();

  if (content.includes('时空') || content.includes('醉仙楼')) return '时空酒馆';
  if (content.includes('剑宗') || content.includes('武侠') || content.includes('江湖')) return '武侠仙侠';
  if (content.includes('王朝') || content.includes('摄政王') || content.includes('大玄')) return '古代宫廷';
  if (content.includes('现代') || content.includes('都市') || content.includes('公司')) return '现代都市';
  if (content.includes('魔法') || content.includes('奇幻') || content.includes('精灵')) return '奇幻冒险';
  if (content.includes('科幻') || content.includes('未来') || content.includes('机器人')) return '科幻未来';

  return '原创';
}

// 提取角色标签
function extractCharacterTags(jsonChar) {
  const tags = [];

  // 从元数据获取标签
  if (jsonChar.元数据 && jsonChar.元数据.标签) {
    tags.push(...jsonChar.元数据.标签);
  }

  // 从性格描述中提取标签
  const personality = jsonChar.性格 || '';
  if (personality.includes('病娇')) tags.push('病娇');
  if (personality.includes('霸道')) tags.push('霸道');
  if (personality.includes('温柔')) tags.push('温柔');
  if (personality.includes('冷酷')) tags.push('冷酷');
  if (personality.includes('神秘')) tags.push('神秘');

  return tags.length > 0 ? [...new Set(tags)] : ['原创'];
}

// 转换世界剧本数据到数据库格式
function transformScenarioData(jsonScenario, creatorId) {
  return {
    name: jsonScenario.name,
    description: jsonScenario.description,
    content: jsonScenario.content || jsonScenario.description,
    category: jsonScenario.category,
    tags: JSON.stringify(jsonScenario.tags || []),
    language: jsonScenario.language || 'zh-CN',
    isPublic: jsonScenario.isPublic !== false,
    isActive: jsonScenario.isActive !== false,
    version: jsonScenario.version || 1,
    parentId: jsonScenario.parentId || null,
    userId: creatorId,
    viewCount: 0,
    useCount: 0,
    favoriteCount: 0,
    rating: 0,
    ratingCount: 0
  };
}

// 转换世界信息数据
function transformWorldInfoData(worldInfo, scenarioId) {
  return {
    scenarioId: scenarioId,
    title: worldInfo.title,
    content: worldInfo.content,
    keywords: JSON.stringify(worldInfo.keywords || []),
    priority: worldInfo.priority || 100,
    insertDepth: worldInfo.insertDepth || 4,
    probability: worldInfo.probability || 1.0,
    matchType: worldInfo.matchType || 'contains',
    caseSensitive: worldInfo.caseSensitive || false,
    isActive: worldInfo.isActive !== false,
    triggerOnce: worldInfo.triggerOnce || false,
    excludeRecursion: worldInfo.excludeRecursion !== false,
    category: worldInfo.category || '通用',
    group: worldInfo.group || null,
    position: worldInfo.position || 'before',
    triggerCount: 0
  };
}

// 导入角色卡
async function importCharacter(filePath, prisma) {
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 确保创建者存在
  const creatorId = await ensureCreator(prisma);

  // 检查是否已存在
  const characterName = jsonData.名称;
  const existing = await prisma.character.findFirst({
    where: {
      name: characterName,
      creatorId: creatorId
    }
  });

  if (existing) {
    console.log(`⏭️  角色已存在: ${characterName}`);
    return { success: true, skipped: true, id: existing.id };
  }

  // 转换数据格式
  const characterData = transformCharacterData(jsonData, creatorId);

  // 创建角色
  const character = await prisma.character.create({
    data: characterData
  });

  console.log(`✅ 成功导入角色: ${characterName} (${characterData.category})`);
  return { success: true, skipped: false, id: character.id };
}

// 导入世界剧本
async function importScenario(filePath, prisma) {
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 确保创建者存在
  const creatorId = await ensureCreator(prisma);

  // 检查是否已存在
  const scenarioName = jsonData.name;
  const existing = await prisma.scenario.findFirst({
    where: {
      name: scenarioName,
      userId: creatorId
    }
  });

  if (existing) {
    console.log(`⏭️  场景已存在: ${scenarioName}`);
    return { success: true, skipped: true, id: existing.id };
  }

  // 转换场景数据
  const scenarioData = transformScenarioData(jsonData, creatorId);

  // 创建场景
  const scenario = await prisma.scenario.create({
    data: scenarioData
  });

  console.log(`✅ 成功导入场景: ${scenarioName} (${scenarioData.category})`);

  // 导入世界信息
  if (jsonData.worldInfos && jsonData.worldInfos.length > 0) {
    console.log(`📋 导入 ${jsonData.worldInfos.length} 个世界信息条目...`);

    for (const worldInfo of jsonData.worldInfos) {
      const worldInfoData = transformWorldInfoData(worldInfo, scenario.id);

      await prisma.worldInfoEntry.create({
        data: worldInfoData
      });

      console.log(`   ✅ ${worldInfo.title}`);
    }
  }

  return { success: true, skipped: false, id: scenario.id };
}

// 导入单个文件
async function importFile(filePath) {
  console.log(`📂 导入文件: ${filePath}`);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在');
    return false;
  }

  let prisma;
  try {
    prisma = getPrismaClient();

    // 读取和解析文件
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 检测文件类型
    const fileType = detectFileType(jsonData);
    if (!fileType) {
      console.log('❌ 无法识别文件类型');
      return false;
    }

    // 根据类型导入
    let result;
    if (fileType === 'character') {
      result = await importCharacter(filePath, prisma);
    } else if (fileType === 'scenario') {
      result = await importScenario(filePath, prisma);
    }

    return result.success;

  } catch (error) {
    console.log(`❌ 导入失败: ${error.message}`);
    return false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// 批量导入目录
async function importDirectory(dirPath) {
  console.log(`📁 批量导入目录: ${dirPath}`);

  if (!fs.existsSync(dirPath)) {
    console.log('❌ 目录不存在');
    return;
  }

  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dirPath, file));

  if (files.length === 0) {
    console.log('📭 目录中没有JSON文件');
    return;
  }

  console.log(`📋 找到 ${files.length} 个JSON文件\n`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  let prisma;
  try {
    prisma = getPrismaClient();

    for (const file of files) {
      try {
        console.log(`\n📂 处理: ${path.basename(file)}`);

        const jsonData = JSON.parse(fs.readFileSync(file, 'utf8'));
        const fileType = detectFileType(jsonData);

        if (!fileType) {
          console.log('❌ 无法识别文件类型');
          failed++;
          continue;
        }

        let result;
        if (fileType === 'character') {
          result = await importCharacter(file, prisma);
        } else if (fileType === 'scenario') {
          result = await importScenario(file, prisma);
        }

        if (result.success) {
          if (result.skipped) {
            skipped++;
          } else {
            imported++;
          }
        } else {
          failed++;
        }

      } catch (error) {
        console.log(`❌ 处理失败: ${error.message}`);
        failed++;
      }
    }

  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }

  console.log(`\n📊 导入统计:`);
  console.log(`   ✅ 新导入: ${imported} 个文件`);
  console.log(`   ⏭️  跳过重复: ${skipped} 个文件`);
  console.log(`   ❌ 失败: ${failed} 个文件`);
  console.log(`   📈 成功率: ${Math.round((imported + skipped) / (imported + skipped + failed) * 100)}%`);
}

// 显示帮助
function showHelp() {
  console.log('\n📖 九馆爸爸内容导入工具帮助');
  console.log('============================');
  console.log('');
  console.log('🎯 功能说明:');
  console.log('- 将验证通过的角色卡和世界剧本导入数据库');
  console.log('- 自动检测重复内容，避免数据冲突');
  console.log('- 支持单文件和批量导入');
  console.log('- 自动创建必要的用户和关联数据');
  console.log('');
  console.log('🔧 命令行参数:');
  console.log('--file <文件路径>     导入单个文件');
  console.log('--dir <目录路径>      批量导入目录下所有JSON文件');
  console.log('--help              显示帮助');
  console.log('');
  console.log('📝 使用示例:');
  console.log('node importer.js --file examples/characters/柳烟儿.json');
  console.log('node importer.js --dir examples/characters/');
  console.log('');
  console.log('⚠️  注意事项:');
  console.log('- 导入前请确保数据库已初始化');
  console.log('- 建议先使用validator.js验证文件格式');
  console.log('- 重复的内容会被自动跳过');
  console.log('- 导入失败的文件不会影响其他文件的处理');
  console.log('');
}

// 解析命令行参数
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++;
    }
  }

  return args;
}

// 主函数
async function main() {
  const args = parseArgs();

  // 显示帮助
  if (args.help || Object.keys(args).length === 0) {
    showHelp();
    return;
  }

  console.log('🚀 九馆爸爸内容导入工具启动...\n');

  // 导入单个文件
  if (args.file) {
    const success = await importFile(args.file);
    process.exit(success ? 0 : 1);
  }

  // 批量导入目录
  if (args.dir) {
    await importDirectory(args.dir);
    return;
  }

  console.log('❌ 请指定要导入的文件或目录');
  showHelp();
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序崩溃:', error);
    process.exit(1);
  });
}

module.exports = {
  importFile,
  importDirectory,
  importCharacter,
  importScenario
};
