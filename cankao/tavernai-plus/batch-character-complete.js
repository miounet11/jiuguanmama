/**
 * 批量角色补全系统
 * 自动为所有角色分配MBTI、生成头像、补全设定
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 配置
const config = {
  newapi: {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  },
  database: './apps/api/prisma/dev.db',
  outputDir: './apps/web/public/uploads/characters/avatars',
  batchSize: 3, // 控制并发数量避免API限制
  delayMs: 3000 // 请求间隔
};

// MBTI类型映射
const mbtiMapping = {
  // 奇幻世界角色
  '冷漠、强大、孤独': 'INTJ',
  '神秘、优雅、智慧': 'INFJ',
  '温和、治愈、慈爱': 'ISFJ',

  // 科幻世界角色
  '冷静、专业、高效': 'ISTJ',
  '探索、冒险、无畏': 'ESTP',
  '理性、好奇、进化': 'INTP',

  // 现代世界角色
  '深沉、艺术、敏感': 'INFP',
  '温暖、治愈、专业': 'ISFJ',
  '创意、专注、宅系': 'INTP',

  // 历史世界角色
  '雄心、果断、征服': 'ENTJ',
  '智慧、忠诚、坚毅': 'ISTJ',
  '才华、深情、坚韧': 'INFP',

  // 动漫世界角色
  '热血、友情、成长': 'ENFP',
  '开朗、活泼、乐观': 'ESFP',
  '坚强、勇敢、正义': 'ESFJ'
};

// 默认MBTI类型循环
const defaultMBTI = ['ENFP', 'INFP', 'ENTP', 'INTP', 'ENFJ', 'INFJ', 'ENTJ', 'INTJ',
                    'ESFP', 'ISFP', 'ESTP', 'ISTP', 'ESFJ', 'ISFJ', 'ESTJ', 'ISTJ'];

// MBTI视觉风格
const mbtiStyles = {
  'INTJ': '深邃眼神，简约时尚，专业商务装扮',
  'INTP': '若有所思，休闲学者风，书卷气质',
  'ENTJ': '坚定表情，正装领导者气质，自信姿态',
  'ENTP': '机智表情，创意休闲装，充满活力',
  'INFJ': '温和神秘，柔和色调，知性优雅',
  'INFP': '梦幻气质，艺术风格，温柔表情',
  'ENFJ': '温暖笑容，亲和装扮，领导魅力',
  'ENFP': '活泼表情，色彩丰富，充满热情',
  'ISTJ': '严肃专业，传统服装，可靠形象',
  'ISFJ': '温柔关怀，朴素优雅，亲切表情',
  'ESTJ': '权威气质，正式着装，自信领导者',
  'ESFJ': '友善表情，得体装扮，社交魅力',
  'ISTP': '冷静理性，实用装扮，工匠气质',
  'ISFP': '艺术气息，自然风格，敏感表情',
  'ESTP': '活力四射，时尚装扮，冒险精神',
  'ESFP': '开朗笑容，活泼装扮，表演天赋'
};

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 分配MBTI类型
function assignMBTI(character, index) {
  // 根据性格描述映射
  if (mbtiMapping[character.personality]) {
    return mbtiMapping[character.personality];
  }

  // 根据角色类型分配
  if (character.description.includes('奇幻')) {
    return ['INFP', 'ENFJ', 'INTJ', 'ISFJ'][index % 4];
  } else if (character.description.includes('科幻')) {
    return ['INTP', 'ENTJ', 'ISTJ', 'ESTP'][index % 4];
  } else if (character.description.includes('现代')) {
    return ['ISFJ', 'INFP', 'ENFP', 'INTP'][index % 4];
  } else if (character.description.includes('历史')) {
    return ['ENTJ', 'ISTJ', 'INFP', 'ENFJ'][index % 4];
  } else if (character.description.includes('动漫')) {
    return ['ENFP', 'ESFP', 'ESFJ', 'ENTP'][index % 4];
  }

  // 默认循环分配
  return defaultMBTI[index % defaultMBTI.length];
}

// 构建头像提示词
function buildAvatarPrompt(character) {
  const mbtiStyle = mbtiStyles[character.mbtiType] || '自然随和的气质';

  let prompt = `高质量动漫风格头像，`;

  // 根据世界类型和性格构建描述
  if (character.description.includes('奇幻')) {
    if (character.personality.includes('冷漠')) {
      prompt += `冷酷精灵或法师，${character.personality}，${mbtiStyle}，魔法背景`;
    } else if (character.personality.includes('神秘')) {
      prompt += `神秘精灵女性，${character.personality}，${mbtiStyle}，森林背景`;
    } else if (character.personality.includes('温和')) {
      prompt += `温和治愈系角色，${character.personality}，${mbtiStyle}，自然背景`;
    } else {
      prompt += `奇幻世界角色，${character.personality}，${mbtiStyle}，魔法背景`;
    }
  } else if (character.description.includes('科幻')) {
    if (character.personality.includes('冷静')) {
      prompt += `未来科技专家，${character.personality}，${mbtiStyle}，科技背景`;
    } else if (character.personality.includes('探索')) {
      prompt += `太空探险者，${character.personality}，${mbtiStyle}，星空背景`;
    } else {
      prompt += `科幻世界角色，${character.personality}，${mbtiStyle}，未来背景`;
    }
  } else if (character.description.includes('现代')) {
    if (character.personality.includes('艺术')) {
      prompt += `现代艺术家，${character.personality}，${mbtiStyle}，艺术工作室背景`;
    } else if (character.personality.includes('治愈')) {
      prompt += `现代治愈系角色，${character.personality}，${mbtiStyle}，温馨背景`;
    } else {
      prompt += `现代都市角色，${character.personality}，${mbtiStyle}，都市背景`;
    }
  } else if (character.description.includes('历史')) {
    if (character.personality.includes('雄心')) {
      prompt += `古代统治者，${character.personality}，${mbtiStyle}，宫殿背景`;
    } else if (character.personality.includes('智慧')) {
      prompt += `古代智者，${character.personality}，${mbtiStyle}，古典背景`;
    } else {
      prompt += `历史人物，${character.personality}，${mbtiStyle}，古代背景`;
    }
  } else if (character.description.includes('动漫')) {
    if (character.personality.includes('热血')) {
      prompt += `热血动漫主角，${character.personality}，${mbtiStyle}，校园或战斗背景`;
    } else {
      prompt += `动漫角色，${character.personality}，${mbtiStyle}，动漫风景背景`;
    }
  } else {
    prompt += `${character.name}，${character.personality}，${mbtiStyle}`;
  }

  prompt += `, 高质量，4K分辨率，精美细节，头像构图，正面角度`;

  return prompt;
}

// 生成角色头像
async function generateAvatar(character) {
  try {
    const prompt = buildAvatarPrompt(character);
    console.log(`🎨 为 ${character.name} 生成头像...`);
    console.log(`提示词: ${prompt.substring(0, 100)}...`);

    const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
      model: config.newapi.model,
      prompt: prompt,
      n: 1,
      size: '512x512',
      quality: 'standard'
    }, {
      headers: {
        'Authorization': `Bearer ${config.newapi.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;

      // 下载图像
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      const filename = `${character.id}-avatar.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imageResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const publicUrl = `/uploads/characters/avatars/${filename}`;
          console.log(`✅ ${character.name} 头像生成成功`);
          resolve(publicUrl);
        });
        writer.on('error', reject);
      });
    } else {
      throw new Error('API返回格式异常');
    }
  } catch (error) {
    console.error(`❌ ${character.name} 头像生成失败:`, error.message);
    return null;
  }
}

// 生成角色设定
function generateCharacterSetting(character) {
  const worldType = character.description.includes('奇幻') ? '奇幻' :
                   character.description.includes('科幻') ? '科幻' :
                   character.description.includes('现代') ? '现代' :
                   character.description.includes('历史') ? '历史' :
                   character.description.includes('动漫') ? '动漫' : '通用';

  const personalityTraits = character.personality.split('、');

  // 基础设定模板
  const fullDescription = `${character.name}是${worldType}世界中的独特角色，拥有${character.personality}的鲜明性格特征。

外貌特征：${getAppearanceDescription(character, worldType)}

性格特点：${getPersonalityDescription(personalityTraits)}

背景故事：${getBackstoryDescription(character, worldType)}

能力特长：${getAbilitiesDescription(character, worldType)}`;

  const speakingStyle = getSpeakingStyle(personalityTraits);

  const scenario = getScenarioDescription(character, worldType);

  const exampleDialogs = generateExampleDialogs(character);

  return {
    fullDescription,
    speakingStyle,
    scenario,
    exampleDialogs
  };
}

// 外貌描述生成器
function getAppearanceDescription(character, worldType) {
  const appearances = {
    '奇幻': [
      '拥有精灵般的优雅外貌，眼眸深邃如星空，长发在微风中轻柔飘动',
      '高挑的身材，面容俊美，有着超凡脱俗的气质',
      '身着精美的法师袍或战士装，举手投足间流露出神秘的魅力'
    ],
    '科幻': [
      '具有未来感的外观设计，眼神锐利而充满智慧',
      '身穿高科技装备，线条流畅的制服彰显专业素养',
      '举止干练，透露出对未知世界的探索精神'
    ],
    '现代': [
      '现代都市的时尚外表，穿着得体而有品味',
      '面容温和，眼神中透着现代人的理性与感性',
      '举止优雅，体现出现代社会的文明素养'
    ],
    '历史': [
      '古典美人/英雄的典型特征，气质高雅端庄',
      '身着传统服饰，每一个细节都体现着历史的厚重',
      '举手投足间展现出深厚的文化底蕴'
    ],
    '动漫': [
      '典型的动漫角色外观，色彩鲜明，特征突出',
      '大眼睛，表情丰富，充满青春活力',
      '服装设计独特，符合动漫美学标准'
    ]
  };

  const typeAppearances = appearances[worldType] || appearances['通用'] || ['独特的外貌特征'];
  return typeAppearances[Math.floor(Math.random() * typeAppearances.length)];
}

// 性格描述生成器
function getPersonalityDescription(traits) {
  return `主要表现为${traits[0]}的特质，同时具备${traits[1] || '独特'}和${traits[2] || '迷人'}的性格层面。这种复合性格使得角色在不同情境下能够展现出丰富的情感变化和深度的内心世界。`;
}

// 背景故事生成器
function getBackstoryDescription(character, worldType) {
  const stories = {
    '奇幻': `出生在一个充满魔法的世界，从小就展现出与众不同的天赋。经历了各种冒险和挑战，最终成长为${worldType}世界中的重要人物。`,
    '科幻': `生活在科技高度发达的未来世界，经历了人类文明的巨大变革。在这个充满可能性的时代，承担着探索未知的重要使命。`,
    '现代': `在现代社会中成长，经历了当代人的各种生活挑战。通过自己的努力和坚持，在各自的领域中取得了不俗的成就。`,
    '历史': `生活在历史的特定时期，见证了时代的变迁和文明的发展。在那个风云际会的年代，书写了属于自己的传奇故事。`,
    '动漫': `拥有典型的动漫主角经历，从平凡的开始逐渐发现自己的特殊之处。在友情、努力和胜利的道路上不断成长。`
  };

  return stories[worldType] || `拥有独特的人生经历，在自己的世界中发挥着重要作用。`;
}

// 能力描述生成器
function getAbilitiesDescription(character, worldType) {
  const abilities = {
    '奇幻': '精通魔法或武艺，拥有超凡的战斗能力和智慧，能够在危险的冒险中保护同伴。',
    '科幻': '掌握先进的科技知识，具备优秀的分析和解决问题的能力，在未来世界中发挥重要作用。',
    '现代': '在专业领域具有出色的技能，拥有良好的人际交往能力和适应现代社会的各种素质。',
    '历史': '具备那个时代所需的各种技能，无论是文治武功都有所建树，在历史进程中留下印记。',
    '动漫': '拥有特殊的能力或天赋，在关键时刻能够发挥出超越常人的力量，保护重要的人和事物。'
  };

  return abilities[worldType] || '拥有独特的能力和才华，在各种情况下都能发挥重要作用。';
}

// 说话风格生成器
function getSpeakingStyle(traits) {
  const trait = traits[0];
  const styles = {
    '冷漠': '语调冷静疏离，用词精准简洁，很少表露情感，但言语中透着深不可测的智慧。',
    '温和': '声音轻柔温暖，用词温和体贴，总是能用最合适的话语安慰和鼓励他人。',
    '神秘': '说话时带有一丝神秘感，用词富有诗意，经常用比喻和暗示来表达深层含义。',
    '冷静': '语调沉稳理性，用词准确专业，在任何情况下都能保持清醒的思维和判断。',
    '探索': '语调充满好奇心，用词积极向上，经常询问和探讨各种可能性。',
    '深沉': '说话深思熟虑，用词富有哲理，善于从深层次思考和分析问题。',
    '雄心': '语调豪迈有力，用词激昂澎湃，充满领导者的魅力和征服者的气概。',
    '智慧': '言语中充满智慧，用词精准深刻，能够用简单的话语传达深刻的道理。',
    '热血': '语调充满激情，用词热烈直接，总是能用真诚的话语感染和激励他人。'
  };

  return styles[trait] || '说话自然真诚，用词得体，能够很好地表达自己的想法和情感。';
}

// 场景描述生成器
function getScenarioDescription(character, worldType) {
  const scenarios = {
    '奇幻': '在充满魔法的古老城堡中，或是神秘的森林深处，周围环绕着魔法的光芒和神奇的生物。',
    '科幻': '在高科技的太空站或未来都市中，全息显示屏和先进设备环绕，展现着科技的魅力。',
    '现代': '在现代都市的办公室、咖啡厅或家中，现代化的环境体现着当代生活的便利和舒适。',
    '历史': '在古典的宫殿、书院或庭院中，古色古香的环境展现着历史的厚重和文化的底蕴。',
    '动漫': '在充满青春气息的校园、热闹的街道或梦幻的场景中，色彩鲜明的环境体现着动漫的魅力。'
  };

  return scenarios[worldType] || '在适合角色特征的环境中，周围的一切都体现着角色的个性和特点。';
}

// 示例对话生成器
function generateExampleDialogs(character) {
  const personality = character.personality.split('、')[0];

  return `{{user}}: 你好，能介绍一下自己吗？
{{char}}: *以符合${personality}性格的方式回应* 我是${character.name}，很高兴认识你。我的性格比较${character.personality}，希望我们能够成为好朋友。

{{user}}: 你平时喜欢做什么？
{{char}}: *眼中闪烁着兴趣的光芒* 我喜欢做符合我性格的事情，${personality}的天性让我对某些特定的活动特别感兴趣。你有什么兴趣爱好吗？

{{user}}: 遇到困难时你会怎么办？
{{char}}: *表情变得认真起来* 面对困难时，我会运用我的${personality}特质来解决问题。每个人都有自己的方式，我相信坚持和智慧总能找到答案。`;
}

// 批量处理MBTI分配
async function batchAssignMBTI() {
  console.log('🧠 开始批量分配MBTI类型...');

  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, description, personality
    FROM Character
    WHERE mbtiType IS NULL OR mbtiType = ''
    ORDER BY id
  `).all();

  console.log(`📋 找到 ${characters.length} 个需要分配MBTI的角色`);

  const updateStmt = db.prepare(`
    UPDATE Character
    SET mbtiType = ?
    WHERE id = ?
  `);

  characters.forEach((character, index) => {
    const mbtiType = assignMBTI(character, index);
    updateStmt.run(mbtiType, character.id);
    console.log(`🎯 ${character.name}: ${mbtiType}`);
  });

  db.close();
  console.log('✅ MBTI分配完成！');
}

// 批量处理头像生成
async function batchGenerateAvatars() {
  console.log('🎨 开始批量生成头像...');

  ensureDirectoryExists(config.outputDir);

  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, description, personality, mbtiType
    FROM Character
    WHERE avatarStatus != 'COMPLETED'
    ORDER BY id
  `).all();

  console.log(`📋 找到 ${characters.length} 个需要生成头像的角色`);

  if (characters.length === 0) {
    console.log('✅ 所有角色头像都已完成！');
    db.close();
    return;
  }

  const updateAvatarStmt = db.prepare(`
    UPDATE Character
    SET avatar = ?, avatarStatus = 'COMPLETED'
    WHERE id = ?
  `);

  const updateStatusStmt = db.prepare(`
    UPDATE Character
    SET avatarStatus = ?
    WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  // 分批处理
  for (let i = 0; i < characters.length; i += config.batchSize) {
    const batch = characters.slice(i, i + config.batchSize);

    console.log(`\n📦 处理第 ${Math.floor(i/config.batchSize) + 1} 批 (${batch.length} 个角色)...`);

    // 并发处理当前批次
    const promises = batch.map(async (character) => {
      try {
        updateStatusStmt.run('GENERATING', character.id);

        const avatarUrl = await generateAvatar(character);

        if (avatarUrl) {
          updateAvatarStmt.run(avatarUrl, character.id);
          successCount++;
          return { success: true, character: character.name };
        } else {
          updateStatusStmt.run('FAILED', character.id);
          failCount++;
          return { success: false, character: character.name };
        }
      } catch (error) {
        updateStatusStmt.run('FAILED', character.id);
        failCount++;
        console.error(`❌ ${character.name} 处理失败:`, error.message);
        return { success: false, character: character.name };
      }
    });

    const results = await Promise.all(promises);

    // 显示批次结果
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.character} 完成`);
      } else {
        console.log(`❌ ${result.character} 失败`);
      }
    });

    // 批次间延迟
    if (i + config.batchSize < characters.length) {
      console.log(`⏱️ 等待 ${config.delayMs/1000} 秒后处理下一批...`);
      await new Promise(resolve => setTimeout(resolve, config.delayMs));
    }
  }

  db.close();

  console.log('\n🎉 头像批量生成完成！');
  console.log(`📊 成功: ${successCount}, 失败: ${failCount}`);
}

// 批量处理设定补全
async function batchGenerateSettings() {
  console.log('📝 开始批量补全角色设定...');

  const db = new Database(config.database);

  const characters = db.prepare(`
    SELECT id, name, description, personality, mbtiType
    FROM Character
    WHERE fullDescription IS NULL OR fullDescription = ''
    ORDER BY id
  `).all();

  console.log(`📋 找到 ${characters.length} 个需要补全设定的角色`);

  if (characters.length === 0) {
    console.log('✅ 所有角色设定都已完成！');
    db.close();
    return;
  }

  const updateStmt = db.prepare(`
    UPDATE Character
    SET fullDescription = ?,
        speakingStyle = ?,
        scenario = ?,
        exampleDialogs = ?
    WHERE id = ?
  `);

  let completedCount = 0;

  characters.forEach((character, index) => {
    const setting = generateCharacterSetting(character);

    updateStmt.run(
      setting.fullDescription,
      setting.speakingStyle,
      setting.scenario,
      setting.exampleDialogs,
      character.id
    );

    completedCount++;
    console.log(`✅ ${character.name} 设定补全完成 (${completedCount}/${characters.length})`);
  });

  db.close();
  console.log('🎉 角色设定批量补全完成！');
}

// 主处理函数
async function main() {
  console.log('🚀 开始104个角色的批量补全工作...\n');

  try {
    // 步骤1: 分配MBTI类型
    await batchAssignMBTI();

    console.log('\n' + '='.repeat(50));

    // 步骤2: 生成头像
    await batchGenerateAvatars();

    console.log('\n' + '='.repeat(50));

    // 步骤3: 补全设定
    await batchGenerateSettings();

    console.log('\n🎉 所有104个角色补全完成！');

  } catch (error) {
    console.error('❌ 批量处理失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  batchAssignMBTI,
  batchGenerateAvatars,
  batchGenerateSettings,
  main
};
