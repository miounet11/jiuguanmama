#!/usr/bin/env node
/**
 * 九馆爸爸内容创建工具
 * 交互式创建角色卡和世界剧本
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 模板路径配置
const TEMPLATES = {
  character: {
    '武侠仙侠': path.join(__dirname, '../templates/character/武侠仙侠.json'),
    '现代都市': path.join(__dirname, '../templates/character/现代都市.json'),
    '时空酒馆': path.join(__dirname, '../templates/character/时空酒馆.json'),
    '奇幻冒险': path.join(__dirname, '../templates/character/奇幻冒险.json'),
    '科幻未来': path.join(__dirname, '../templates/character/科幻未来.json')
  },
  scenario: {
    '奇幻冒险': path.join(__dirname, '../templates/scenario/奇幻冒险.json'),
    '历史架空': path.join(__dirname, '../templates/scenario/历史架空.json'),
    '现代都市': path.join(__dirname, '../templates/scenario/现代都市.json'),
    '时空酒馆': path.join(__dirname, '../templates/scenario/时空酒馆.json')
  }
};

// 输出目录配置
const OUTPUT_DIRS = {
  character: path.join(__dirname, '../examples/characters'),
  scenario: path.join(__dirname, '../examples/scenarios')
};

// 确保输出目录存在
function ensureOutputDirs() {
  Object.values(OUTPUT_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// 显示主菜单
async function showMainMenu() {
  console.log('\n🎨 九馆爸爸内容创建工具');
  console.log('============================');
  console.log('1. 创建角色卡');
  console.log('2. 创建世界剧本');
  console.log('3. 查看帮助');
  console.log('4. 退出');
  console.log('============================');

  const choice = await question('请选择操作 (1-4): ');
  return choice.trim();
}

// 显示分类菜单
async function showCategoryMenu(type) {
  const categories = Object.keys(TEMPLATES[type]);

  console.log(`\n📋 ${type === 'character' ? '角色卡' : '世界剧本'}分类选择`);
  console.log('============================');
  categories.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  console.log('============================');

  const choice = await question(`请选择分类 (1-${categories.length}): `);
  const index = parseInt(choice) - 1;

  if (index >= 0 && index < categories.length) {
    return categories[index];
  }
  return null;
}

// 创建角色卡
async function createCharacter() {
  console.log('\n🎭 创建新角色卡');

  // 选择分类
  const category = await showCategoryMenu('character');
  if (!category) {
    console.log('❌ 无效的分类选择');
    return;
  }

  // 获取基本信息
  const name = await question('角色名称: ');
  if (!name.trim()) {
    console.log('❌ 角色名称不能为空');
    return;
  }

  const description = await question('角色描述: ');
  const personality = await question('角色性格: ');
  const greeting = await question('开场对话: ');
  const scenario = await question('出现场景: ');
  const systemPrompt = await question('AI提示词: ');

  // 加载模板
  const templatePath = TEMPLATES.character[category];
  let template;

  try {
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch (error) {
    console.log(`❌ 无法加载模板: ${error.message}`);
    return;
  }

  // 填充模板
  template.名称 = name;
  template.描述 = description || template.描述;
  template.性格 = personality || template.性格;
  template.开场对话 = greeting || template.开场对话;
  template.场景 = scenario || template.场景;
  template.提示词 = systemPrompt || template.提示词;

  // 更新元数据
  if (template.元数据) {
    template.元数据.分类 = category;
    template.元数据.创建者 = '内容创建工具';
    template.元数据.创建时间 = new Date().toISOString();
  }

  // 保存文件
  const outputPath = path.join(OUTPUT_DIRS.character, `${name}.json`);

  try {
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`✅ 角色卡创建成功: ${outputPath}`);
    console.log('\n📝 下一步操作:');
    console.log(`1. 编辑文件: ${outputPath}`);
    console.log(`2. 验证格式: node tools/validator.js --file "${outputPath}"`);
    console.log(`3. 导入数据库: node tools/importer.js --file "${outputPath}"`);
  } catch (error) {
    console.log(`❌ 保存文件失败: ${error.message}`);
  }
}

// 创建世界剧本
async function createScenario() {
  console.log('\n🌍 创建新世界剧本');

  // 选择分类
  const category = await showCategoryMenu('scenario');
  if (!category) {
    console.log('❌ 无效的分类选择');
    return;
  }

  // 获取基本信息
  const name = await question('场景名称: ');
  if (!name.trim()) {
    console.log('❌ 场景名称不能为空');
    return;
  }

  const description = await question('场景描述: ');
  const worldInfoCount = await question('世界信息条目数量 (默认3): ');
  const count = parseInt(worldInfoCount) || 3;

  // 创建基础结构
  const scenario = {
    name: name,
    description: description,
    category: category,
    tags: [],
    language: 'zh-CN',
    isPublic: true,
    isActive: true,
    version: 1,
    worldInfos: [],
    characters: [],
    metadata: {
      createdBy: '内容创建工具',
      createdAt: new Date().toISOString(),
      source: 'content-creation-toolkit'
    }
  };

  // 添加世界信息
  for (let i = 0; i < count; i++) {
    console.log(`\n📋 世界信息 ${i + 1}/${count}`);
    const title = await question('信息标题: ');
    const content = await question('信息内容: ');
    const keywords = await question('关键词 (用逗号分隔): ');
    const priority = await question(`优先级 (默认${1000 - i * 100}): `);

    scenario.worldInfos.push({
      title: title || `${category}设定${i + 1}`,
      content: content || '详细的世界设定内容...',
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [`关键词${i + 1}`],
      priority: parseInt(priority) || (1000 - i * 100),
      insertDepth: 4,
      probability: 1,
      matchType: 'contains',
      caseSensitive: false,
      isActive: true,
      triggerOnce: false,
      excludeRecursion: true,
      category: category,
      position: 'before'
    });
  }

  // 添加标签
  const tags = await question('场景标签 (用逗号分隔): ');
  if (tags) {
    scenario.tags = tags.split(',').map(tag => tag.trim());
  } else {
    scenario.tags = [category, '原创'];
  }

  // 保存文件
  const outputPath = path.join(OUTPUT_DIRS.scenario, `${name}.json`);

  try {
    fs.writeFileSync(outputPath, JSON.stringify(scenario, null, 2), 'utf8');
    console.log(`✅ 世界剧本创建成功: ${outputPath}`);
    console.log('\n📝 下一步操作:');
    console.log(`1. 编辑文件: ${outputPath}`);
    console.log(`2. 验证格式: node tools/validator.js --file "${outputPath}"`);
    console.log(`3. 导入数据库: node tools/importer.js --file "${outputPath}"`);
  } catch (error) {
    console.log(`❌ 保存文件失败: ${error.message}`);
  }
}

// 显示帮助信息
function showHelp() {
  console.log('\n📖 九馆爸爸内容创建工具帮助');
  console.log('============================');
  console.log('');
  console.log('🎯 功能说明:');
  console.log('- 交互式创建角色卡和世界剧本');
  console.log('- 基于标准模板快速生成');
  console.log('- 自动格式验证和规范检查');
  console.log('- 一键导入到数据库');
  console.log('');
  console.log('📋 支持的角色卡类型:');
  console.log('- 武侠仙侠: 古风角色，武功设定');
  console.log('- 现代都市: 现代背景，职业设定');
  console.log('- 时空酒馆: 跨时空角色，多元交互');
  console.log('- 奇幻冒险: 魔法世界，种族设定');
  console.log('- 科幻未来: 未来科技，太空探索');
  console.log('');
  console.log('🌍 支持的世界剧本类型:');
  console.log('- 奇幻冒险: 魔法世界，冒险故事');
  console.log('- 历史架空: 架空朝代，政治权谋');
  console.log('- 现代都市: 都市生活，职场社交');
  console.log('- 时空酒馆: 时空交汇，多元融合');
  console.log('');
  console.log('🔧 命令行参数:');
  console.log('--type character    创建角色卡');
  console.log('--type scenario     创建世界剧本');
  console.log('--category <类型>   直接指定分类');
  console.log('--name <名称>       直接指定名称');
  console.log('--help             显示帮助');
  console.log('');
  console.log('📝 使用示例:');
  console.log('node creator.js --type character --category 武侠仙侠');
  console.log('node creator.js --type scenario --name "神秘岛屿"');
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
      if (value !== true) i++; // 跳过已处理的值
    }
  }

  return args;
}

// 主函数
async function main() {
  const args = parseArgs();

  // 显示帮助
  if (args.help) {
    showHelp();
    rl.close();
    return;
  }

  // 确保输出目录存在
  ensureOutputDirs();

  // 直接创建指定类型
  if (args.type) {
    if (args.type === 'character') {
      await createCharacter();
    } else if (args.type === 'scenario') {
      await createScenario();
    } else {
      console.log('❌ 不支持的类型，请使用 character 或 scenario');
    }
    rl.close();
    return;
  }

  // 交互式主菜单
  try {
    while (true) {
      const choice = await showMainMenu();

      switch (choice) {
        case '1':
          await createCharacter();
          break;
        case '2':
          await createScenario();
          break;
        case '3':
          showHelp();
          break;
        case '4':
          console.log('\n👋 感谢使用九馆爸爸内容创建工具！');
          rl.close();
          return;
        default:
          console.log('❌ 无效选择，请输入 1-4');
      }

      // 询问是否继续
      const continueChoice = await question('\n是否继续创建内容？(y/n): ');
      if (continueChoice.toLowerCase() !== 'y' && continueChoice.toLowerCase() !== 'yes') {
        console.log('\n👋 感谢使用九馆爸爸内容创建工具！');
        break;
      }
    }
  } catch (error) {
    console.error('❌ 程序执行出错:', error.message);
  } finally {
    rl.close();
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序崩溃:', error);
    process.exit(1);
  });
}

module.exports = {
  createCharacter,
  createScenario,
  showHelp
};
