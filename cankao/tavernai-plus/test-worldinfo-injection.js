/**
 * 动态世界观注入系统测试脚本
 * Issue #15: 智能关键词触发的动态世界观注入系统
 */

const axios = require('axios');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:4000/api';
const WS_URL = 'ws://localhost:4000';

// 测试用户凭据（需要先注册或使用现有用户）
const TEST_USER = {
  email: 'test@tavernai.com',
  password: 'Test123!@#'
};

let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ 登录成功');
      return true;
    }
  } catch (error) {
    console.log('❌ 登录失败，尝试注册...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        ...TEST_USER,
        username: 'testuser'
      });
      console.log('✅ 注册成功，重新登录...');
      return await login();
    } catch (regError) {
      console.error('❌ 注册失败:', regError.response?.data || regError.message);
      return false;
    }
  }
  return false;
}

async function testKeywordExtraction() {
  console.log('\n🧪 测试AI关键词提取...');

  try {
    const testText = `
      我想学习魔法，听说有一所古老的魔法学院坐落在遥远的艾尔登大陆上。
      那里有传说中的圣剑，只有真正的勇者才能拔出。
      我决定踏上这段冒险之旅，寻找属于我的传奇。
    `;

    const response = await axios.post(
      `${API_BASE}/worldinfo-injection/extract-keywords`,
      {
        text: testText,
        language: 'zh-CN',
        maxKeywords: 10
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 关键词提取成功:');
      console.log('   关键词:', response.data.data.keywords.join(', '));
      console.log('   实体数量:', response.data.data.entities.length);
      console.log('   主题:', response.data.data.themes.join(', '));
      console.log('   情感:', response.data.data.sentiment.emotion);
    } else {
      console.log('❌ 关键词提取失败');
    }
  } catch (error) {
    console.error('❌ 关键词提取测试失败:', error.response?.data || error.message);
  }
}

async function testWorldInfoAnalysis() {
  console.log('\n🧪 测试动态世界观分析...');

  try {
    const conversationContext = {
      messages: [
        { role: 'system', content: '你是一位友善的魔法学院导师。' },
        { role: 'user', content: '你好，我对魔法很感兴趣。' },
        { role: 'assistant', content: '欢迎来到魔法的世界！你想了解什么呢？' }
      ],
      currentMessage: '请告诉我关于魔法学院的信息，特别是那些传说中的圣剑。',
      settings: {
        maxEntries: 5,
        scanDepth: 3,
        semanticThreshold: 0.3,
        enableAI: true,
        insertionStrategy: 'before'
      }
    };

    const response = await axios.post(
      `${API_BASE}/worldinfo-injection/analyze`,
      conversationContext,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 世界观分析成功:');
      console.log('   激活条目数量:', response.data.data.activatedEntries.length);
      console.log('   注入内容长度:', response.data.data.injectedContent.length);
      console.log('   总tokens:', response.data.data.totalTokens);
      console.log('   处理时间:', response.data.data.performance.totalTime + 'ms');

      if (response.data.data.injectedContent) {
        console.log('\n📝 注入的世界观内容:');
        console.log(response.data.data.injectedContent);
      }
    } else {
      console.log('❌ 世界观分析失败');
    }
  } catch (error) {
    console.error('❌ 世界观分析测试失败:', error.response?.data || error.message);
  }
}

async function testEmotionalAnalysis() {
  console.log('\n🧪 测试情感上下文分析...');

  try {
    const messages = [
      { role: 'user', content: '我今天心情很好！' },
      { role: 'assistant', content: '那太棒了！有什么让你开心的事情吗？' },
      { role: 'user', content: '我刚刚通过了魔法学院的入学考试！' }
    ];

    const response = await axios.post(
      `${API_BASE}/worldinfo-injection/analyze-emotion`,
      {
        messages,
        includeAdvice: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 情感分析成功:');
      console.log('   整体情绪:', response.data.data.overallMood);
      console.log('   情感强度:', response.data.data.emotionalIntensity);
      console.log('   适合注入:', response.data.data.appropriateForInjection ? '是' : '否');
      console.log('   建议时机:', response.data.data.suggestedTiming);
      if (response.data.data.contextAdvice) {
        console.log('   上下文建议:', response.data.data.contextAdvice);
      }
    } else {
      console.log('❌ 情感分析失败');
    }
  } catch (error) {
    console.error('❌ 情感分析测试失败:', error.response?.data || error.message);
  }
}

async function testContentSummary() {
  console.log('\n🧪 测试世界观内容摘要...');

  try {
    const longContent = `
      艾尔登魔法学院是大陆上最古老、最权威的魔法教育机构，始建于千年前的黄金时代。
      学院坐落在云雾缭绕的天空之岛上，只有通过传送门才能到达。
      学院分为四个学院：炎火学院专注于火元素魔法和战斗技巧；
      碧水学院研究水元素魔法和治疗术；厚土学院传授土元素魔法和防护法术；
      疾风学院则以风元素魔法和飞行术著称。
      每个学院都有自己的传统、价值观和特色课程。
      学院的图书馆收藏了数万册魔法典籍，其中包括失传已久的古代法术。
      在学院的中央矗立着一座高塔，顶端放置着传说中的智慧水晶，
      据说它能增强法师的魔法感知能力。
    `;

    const response = await axios.post(
      `${API_BASE}/worldinfo-injection/generate-summary`,
      {
        content: longContent,
        context: {
          keywords: ['魔法学院', '学院', '魔法'],
          themes: ['教育', '魔法'],
          maxLength: 150
        },
        preserveStyle: false
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 内容摘要生成成功:');
      console.log('   原始长度:', response.data.meta.originalLength);
      console.log('   摘要长度:', response.data.meta.summaryLength);
      console.log('   压缩比例:', Math.round(response.data.meta.compressionRatio * 100) + '%');
      console.log('   相关性分数:', response.data.data.relevanceScore);
      console.log('\n📝 生成的摘要:');
      console.log(response.data.data.summary);
    } else {
      console.log('❌ 内容摘要生成失败');
    }
  } catch (error) {
    console.error('❌ 内容摘要测试失败:', error.response?.data || error.message);
  }
}

async function testVoiceOptimization() {
  console.log('\n🧪 测试角色语音优化...');

  try {
    const content = '魔法学院是一个古老的教育机构，分为四个学院。';
    const character = {
      name: '艾莉亚',
      personality: '活泼开朗，好奇心强',
      speakingStyle: '热情友好，喜欢使用感叹号'
    };

    const response = await axios.post(
      `${API_BASE}/worldinfo-injection/optimize-voice`,
      {
        content,
        character,
        tone: 'friendly',
        length: 'normal'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 语音优化成功:');
      console.log('   语音匹配度:', Math.round(response.data.data.voiceMatching * 100) + '%');
      console.log('   调整说明:', response.data.data.adjustments.join(', '));
      console.log('\n📝 优化后的内容:');
      console.log(response.data.data.optimizedContent);
    } else {
      console.log('❌ 语音优化失败');
    }
  } catch (error) {
    console.error('❌ 语音优化测试失败:', error.response?.data || error.message);
  }
}

async function testWebSocketIntegration() {
  console.log('\n🧪 测试WebSocket实时世界观注入...');

  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    ws.on('open', () => {
      console.log('✅ WebSocket连接建立');

      // 发送世界观分析请求
      const worldInfoData = {
        sessionId: 'test_session_123',
        messages: [
          { role: 'user', content: '我想了解魔法的基础知识' },
          { role: 'assistant', content: '当然！魔法是一门深奥的学问' }
        ],
        currentMessage: '请告诉我关于元素魔法的分类，特别是火系和水系魔法的区别。',
        settings: {
          maxEntries: 3,
          enableAI: true
        }
      };

      ws.send(JSON.stringify({
        type: 'analyze_worldinfo',
        data: worldInfoData
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📡 收到WebSocket消息:', message.type || message.event);

        if (message.type === 'worldinfo_analysis_completed' || message.event === 'worldinfo_analysis_completed') {
          console.log('✅ 世界观分析完成');
          console.log('   激活条目:', message.activatedEntries?.length || 0);
          console.log('   处理时间:', message.performance?.totalTime + 'ms' || 'N/A');
          ws.close();
          resolve();
        } else if (message.type === 'worldinfo_analysis_failed' || message.event === 'worldinfo_analysis_failed') {
          console.log('❌ 世界观分析失败:', message.error);
          ws.close();
          resolve();
        }
      } catch (error) {
        console.error('❌ WebSocket消息解析失败:', error.message);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket错误:', error.message);
      resolve();
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket连接关闭');
      resolve();
    });

    // 30秒超时
    setTimeout(() => {
      console.log('⏰ WebSocket测试超时');
      ws.close();
      resolve();
    }, 30000);
  });
}

async function testSuggestions() {
  console.log('\n🧪 测试世界观建议获取...');

  try {
    const response = await axios.get(
      `${API_BASE}/worldinfo-injection/suggestions?sessionId=test123&characterId=char456`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 建议获取成功:');
      console.log('   推荐书籍数量:', response.data.data.recommendedBooks.length);
      console.log('   关键词触发器:', response.data.data.keywordTriggers.join(', '));
      console.log('   推荐设置:', JSON.stringify(response.data.data.settings.recommended, null, 2));
    } else {
      console.log('❌ 建议获取失败');
    }
  } catch (error) {
    console.error('❌ 建议获取测试失败:', error.response?.data || error.message);
  }
}

async function testStats() {
  console.log('\n🧪 测试统计信息获取...');

  try {
    const response = await axios.get(
      `${API_BASE}/worldinfo-injection/stats?timeRange=7d`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ 统计信息获取成功:');
      console.log('   总激活次数:', response.data.data.totalActivations);
      console.log('   平均相关性:', Math.round(response.data.data.averageRelevance * 100) + '%');
      console.log('   平均延迟:', response.data.data.performance.averageLatency + 'ms');
      console.log('   用户满意度:', response.data.data.userFeedback.averageRating + '/5');
    } else {
      console.log('❌ 统计信息获取失败');
    }
  } catch (error) {
    console.error('❌ 统计信息测试失败:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 开始测试动态世界观注入系统...\n');

  if (!(await login())) {
    console.error('❌ 无法登录，测试终止');
    return;
  }

  // 执行所有测试
  await testKeywordExtraction();
  await testWorldInfoAnalysis();
  await testEmotionalAnalysis();
  await testContentSummary();
  await testVoiceOptimization();
  await testSuggestions();
  await testStats();
  await testWebSocketIntegration();

  console.log('\n✅ 所有测试完成！');
  console.log('\n📊 测试摘要:');
  console.log('   - AI关键词提取功能');
  console.log('   - 动态世界观分析和注入');
  console.log('   - 情感上下文检测');
  console.log('   - 智能内容摘要生成');
  console.log('   - 角色语音风格优化');
  console.log('   - WebSocket实时通信');
  console.log('   - 建议系统和统计信息');

  console.log('\n🎯 动态世界观注入系统 (Issue #15) 实施完成！');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  login,
  testKeywordExtraction,
  testWorldInfoAnalysis,
  testEmotionalAnalysis,
  testContentSummary,
  testVoiceOptimization,
  testWebSocketIntegration,
  testSuggestions,
  testStats
};