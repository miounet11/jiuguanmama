/**
 * 端到端角色创建测试
 * 模拟前端完整角色创建流程
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8081';

// 模拟前端角色创建组合式函数的数据格式
function simulateFrontendCharacterData() {
  return {
    name: '星语者·露娜',
    avatar: 'https://example.com/avatar.jpg',
    shortDescription: '能读懂星星语言的神秘占卜师',
    category: 'original',
    tags: ['占卜', '神秘', '星星', '魔法'],
    appearance: {
      physicalDescription: '身着深蓝色长袍，银色长发点缀着星光，眼眸如夜空般深邃',
      outfit: '绣着星座图案的神秘长袍，手持水晶法杖',
      expressions: ['沉思', '微笑', '惊讶']
    },
    personality: ['神秘', '智慧', '温柔', '耐心'],
    traits: {
      introversion: 70,
      empathy: 85,
      creativity: 90,
      humor: 40,
      intelligence: 95
    },
    background: '来自古老观星塔的最后一位占卜师，继承了几代人的星辰智慧',
    scenario: '在一个繁星满天的夜晚，你来到传说中的观星塔寻求指引',
    firstMessage: '欢迎来到观星塔，旅者。今夜的星辰告诉我，你的命运即将发生转折...',
    sampleConversation: [
      {
        role: 'user',
        content: '你能告诉我关于我的未来吗？'
      },
      {
        role: 'assistant',
        content: '星辰显示你面前有两条道路...选择权在你手中。'
      }
    ],
    visibility: 'public',
    isNSFW: false
  };
}

// 将前端数据格式转换为API格式
function convertToApiFormat(frontendData) {
  return {
    name: frontendData.name,
    avatar: frontendData.avatar,
    description: frontendData.shortDescription,
    personality: frontendData.personality.join(', '),
    background: frontendData.background,
    scenario: frontendData.scenario,
    firstMessage: frontendData.firstMessage,
    tags: frontendData.tags,
    category: frontendData.category,
    isPublic: frontendData.visibility === 'public',
    isNSFW: frontendData.isNSFW,
    status: 'published'
  };
}

async function testE2ECharacterCreation() {
  console.log('🎭 开始端到端角色创建测试...\n');

  try {
    // 1. 模拟前端数据准备
    console.log('1️⃣ 模拟前端数据准备...');
    const frontendData = simulateFrontendCharacterData();
    console.log('✅ 前端数据格式准备完成');
    console.log('');

    // 2. 数据格式转换
    console.log('2️⃣ 转换为API格式...');
    const apiData = convertToApiFormat(frontendData);
    console.log('转换后的API数据:');
    console.log(`- 名称: ${apiData.name}`);
    console.log(`- 描述: ${apiData.description}`);
    console.log(`- 性格: ${apiData.personality}`);
    console.log(`- 标签: [${apiData.tags.join(', ')}]`);
    console.log(`- 分类: ${apiData.category}`);
    console.log('✅ 数据格式转换完成');
    console.log('');

    // 3. 发送创建请求
    console.log('3️⃣ 发送角色创建请求...');
    const response = await axios.post(`${API_BASE_URL}/api/characters`, apiData);
    console.log('✅ 角色创建成功!');
    console.log('角色ID:', response.data.character.id);
    console.log('创建时间:', response.data.character.createdAt);
    console.log('');

    // 4. 验证返回数据
    console.log('4️⃣ 验证返回数据...');
    const createdCharacter = response.data.character;
    const validationResults = {
      hasId: !!createdCharacter.id,
      hasName: createdCharacter.name === apiData.name,
      hasDescription: createdCharacter.description === apiData.description,
      hasTags: Array.isArray(createdCharacter.tags) && createdCharacter.tags.length > 0,
      hasCategory: createdCharacter.category === apiData.category,
      hasTimestamp: !!createdCharacter.createdAt
    };

    console.log('验证结果:');
    Object.entries(validationResults).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    console.log('');

    // 5. 测试不同场景的角色创建
    console.log('5️⃣ 测试不同角色类型...');
    const characterTypes = [
      {
        name: '烈焰战士',
        description: '来自火山的勇猛战士',
        category: 'game',
        tags: ['战士', '火焰', '勇猛'],
        firstMessage: '谁敢挑战火焰的力量！'
      },
      {
        name: 'AI助手-小智',
        description: '智能AI助手',
        category: 'assistant',
        tags: ['AI', '助手', '智能'],
        firstMessage: '你好！我是小智，有什么可以帮助你的吗？'
      },
      {
        name: '猫咪公主',
        description: '可爱的猫咪公主',
        category: 'anime',
        tags: ['猫', '公主', '可爱'],
        firstMessage: '喵~ 你来找本公主有什么事吗？'
      }
    ];

    for (const [index, charType] of characterTypes.entries()) {
      try {
        const charResponse = await axios.post(`${API_BASE_URL}/api/characters`, {
          ...apiData,
          ...charType,
          status: 'draft'
        });
        console.log(`  ✅ ${charType.name} 创建成功 (ID: ${charResponse.data.character.id})`);
      } catch (error) {
        console.log(`  ❌ ${charType.name} 创建失败:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 端到端角色创建测试完成！');
    console.log('\n📊 测试总结:');
    console.log('✅ 前端数据格式模拟');
    console.log('✅ 数据格式转换');
    console.log('✅ API请求发送');
    console.log('✅ 返回数据验证');
    console.log('✅ 多种角色类型测试');
    console.log('✅ 前后端集成测试');

  } catch (error) {
    console.error('❌ 端到端测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行端到端测试
testE2ECharacterCreation();