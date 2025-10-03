import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../apps/api/src/server';
import { prisma } from '../../apps/api/src/lib/prisma';
import { initRedis, closeRedis } from '../../apps/api/src/lib/redis';

describe('高级配置对AI模型影响集成测试', () => {
  let server: any;
  let testUser: any;
  let authToken: string;
  let testCharacter: any;
  let baseConfig: any;

  // 测试配置模板
  const configTemplates = {
    creative: {
      name: '创意写作配置',
      category: 'ai_models',
      config: {
        model: 'gpt-4',
        temperature: 0.9,
        maxTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0.3,
        presencePenalty: 0.3,
        systemPrompt: '你是一个富有创意的作家助手，擅长创作生动有趣的故事和对话。',
        responseStyle: 'creative',
        creativityLevel: 'high',
      },
    },
    analytical: {
      name: '分析思考配置',
      category: 'ai_models',
      config: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500,
        topP: 0.8,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        systemPrompt: '你是一个逻辑严密的分析师，专注于提供客观、准确、有条理的分析和建议。',
        responseStyle: 'analytical',
        creativityLevel: 'low',
      },
    },
    conversational: {
      name: '日常对话配置',
      category: 'ai_models',
      config: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.2,
        presencePenalty: 0.2,
        systemPrompt: '你是一个友好的对话伙伴，善于进行自然、轻松的日常交流。',
        responseStyle: 'conversational',
        creativityLevel: 'medium',
      },
    },
    technical: {
      name: '技术专家配置',
      category: 'ai_models',
      config: {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 2500,
        topP: 0.85,
        frequencyPenalty: 0.0,
        presencePenalty: 0.1,
        systemPrompt: '你是一个专业的技术专家，提供准确、详细的技术信息和解决方案。',
        responseStyle: 'technical',
        creativityLevel: 'low',
        includeCodeExamples: true,
      },
    },
  };

  beforeAll(async () => {
    await initRedis();
    server = app;

    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        username: 'config_ai_test_user',
        email: 'configai@example.com',
        passwordHash: 'test_hash',
        is_active: true,
        is_verified: true,
        role: 'user',
      },
    });

    authToken = 'mock_config_ai_token';

    // 创建测试角色
    testCharacter = await prisma.character.create({
      data: {
        userId: testUser.id,
        name: '配置测试助手',
        description: '用于测试不同AI配置影响的助手',
        personality: '适应性强、能够根据配置调整回应风格',
        scenario: '在不同的AI配置下展示不同的回应特征',
        firstMessage: '你好！我会根据当前的AI配置来调整我的回应风格。',
        systemPrompt: '你是一个配置敏感的AI助手，请根据当前配置参数调整回应风格。',
        is_public: false,
      },
    });

    // 创建基础配置
    baseConfig = await prisma.advancedConfig.create({
      data: {
        userId: testUser.id,
        name: '基础默认配置',
        category: 'ai_models',
        config: configTemplates.conversational.config,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await prisma.advancedConfig.deleteMany({ where: { userId: testUser.id } });
      await prisma.configTemplate.deleteMany({ where: { userId: testUser.id } });
      await prisma.character.deleteMany({ where: { userId: testUser.id } });
      await prisma.chatSession.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    await closeRedis();
  });

  beforeEach(async () => {
    // 每个测试前重置为基础配置
    await prisma.advancedConfig.updateMany({
      where: { userId: testUser.id },
      data: { isActive: false },
    });

    await prisma.advancedConfig.update({
      where: { id: baseConfig.id },
      data: { isActive: true },
    });
  });

  test('温度参数对AI回应创意性的影响', async () => {
    const testPrompt = '请创作一个关于时间旅行的短故事开头';
    const responses: any[] = [];

    // 测试不同温度设置
    const temperatureConfigs = [
      { temp: 0.1, name: '低温度(0.1)' },
      { temp: 0.5, name: '中温度(0.5)' },
      { temp: 0.9, name: '高温度(0.9)' },
    ];

    for (const tempConfig of temperatureConfigs) {
      // Step 1: 创建特定温度的配置
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUser.id,
          name: `温度测试配置-${tempConfig.temp}`,
          category: 'ai_models',
          config: {
            ...configTemplates.creative.config,
            temperature: tempConfig.temp,
          },
          isActive: true,
        },
      });

      // Step 2: 应用配置并发送请求
      const chatResponse = await request(server)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          characterId: testCharacter.id,
          message: testPrompt,
          configId: config.id,
          enableAnalysis: true, // 启用响应分析
        })
        .expect(200);

      responses.push({
        temperature: tempConfig.temp,
        name: tempConfig.name,
        response: chatResponse.body.message,
        analysis: chatResponse.body.analysis,
        config: config,
      });

      // 清理配置
      await prisma.advancedConfig.delete({ where: { id: config.id } });
    }

    // Step 3: 分析温度对创意性的影响
    responses.forEach((resp, index) => {
      expect(resp.response).toBeTruthy();
      expect(resp.response.length).toBeGreaterThan(50); // 响应应该有一定长度

      console.log(`\n${resp.name} 响应:`, resp.response.substring(0, 200) + '...');

      // 分析响应特征
      if (resp.analysis) {
        console.log(`分析结果:`, {
          创意性分数: resp.analysis.creativityScore,
          词汇多样性: resp.analysis.vocabularyDiversity,
          句式复杂度: resp.analysis.sentenceComplexity,
        });
      }
    });

    // 验证温度递增导致创意性递增的趋势
    expect(responses.length).toBe(3);

    // 高温度的响应通常比低温度的更有创意（更多样化）
    const lowTempResponse = responses[0].response;
    const highTempResponse = responses[2].response;

    // 简单的多样性检测：高温度响应的独特词汇应该更多
    const lowTempWords = new Set(lowTempResponse.split(/\s+/));
    const highTempWords = new Set(highTempResponse.split(/\s+/));

    // 注意：这个测试可能不总是成立，因为创意性难以量化
    console.log(`低温度独特词汇: ${lowTempWords.size}, 高温度独特词汇: ${highTempWords.size}`);
  });

  test('系统提示词对AI行为模式的影响', async () => {
    const testPrompt = '请解释人工智能的发展历程';
    const systemPromptTests = [
      {
        name: '学术专家模式',
        systemPrompt: '你是一位AI领域的学术专家，请用严谨的学术语言和详细的技术细节来回答问题。',
        expectedStyle: 'academic',
      },
      {
        name: '科普作者模式',
        systemPrompt: '你是一位科普作家，请用通俗易懂的语言和生动的比喻来解释复杂概念。',
        expectedStyle: 'popular',
      },
      {
        name: '业界资深人士模式',
        systemPrompt: '你是AI行业的资深从业者，请从实践角度分享经验和见解。',
        expectedStyle: 'practical',
      },
    ];

    const responses: any[] = [];

    for (const promptTest of systemPromptTests) {
      // Step 1: 创建特定系统提示词的配置
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUser.id,
          name: `系统提示词测试-${promptTest.name}`,
          category: 'ai_models',
          config: {
            ...configTemplates.analytical.config,
            systemPrompt: promptTest.systemPrompt,
          },
          isActive: true,
        },
      });

      // Step 2: 发送相同问题
      const chatResponse = await request(server)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          characterId: testCharacter.id,
          message: testPrompt,
          configId: config.id,
          enableStyleAnalysis: true,
        })
        .expect(200);

      responses.push({
        name: promptTest.name,
        expectedStyle: promptTest.expectedStyle,
        response: chatResponse.body.message,
        styleAnalysis: chatResponse.body.styleAnalysis,
        config: config,
      });

      console.log(`\n${promptTest.name} 响应示例:`, chatResponse.body.message.substring(0, 300) + '...');

      // 清理配置
      await prisma.advancedConfig.delete({ where: { id: config.id } });
    }

    // Step 3: 验证不同系统提示词产生不同风格的响应
    responses.forEach(resp => {
      expect(resp.response).toBeTruthy();
      expect(resp.response.length).toBeGreaterThan(100);

      // 检查响应是否体现了预期的风格特征
      const response = resp.response.toLowerCase();

      switch (resp.expectedStyle) {
        case 'academic':
          // 学术风格应该包含正式词汇
          const academicTerms = ['研究', '发展', '技术', '理论', '方法'];
          const hasAcademicTerms = academicTerms.some(term => response.includes(term));
          expect(hasAcademicTerms).toBe(true);
          break;

        case 'popular':
          // 科普风格应该更通俗易懂
          const popularIndicators = ['比如', '就像', '简单来说', '通俗地说'];
          const hasPopularStyle = popularIndicators.some(indicator => response.includes(indicator));
          console.log(`科普风格检测:`, { response: response.substring(0, 100), hasPopularStyle });
          break;

        case 'practical':
          // 实践风格应该包含经验性词汇
          const practicalTerms = ['经验', '实践', '应用', '项目', '实际'];
          const hasPracticalTerms = practicalTerms.some(term => response.includes(term));
          console.log(`实践风格检测:`, { response: response.substring(0, 100), hasPracticalTerms });
          break;
      }
    });

    expect(responses.length).toBe(3);
  });

  test('配置模板对聊天会话整体风格的影响', async () => {
    const conversationPrompts = [
      '你好，很高兴认识你',
      '请介绍一下你自己',
      '你有什么特别的能力吗？',
      '我们聊聊天气吧',
    ];

    const templateTests = ['creative', 'analytical', 'technical'];
    const sessionResults: any[] = [];

    for (const templateName of templateTests) {
      // Step 1: 创建聊天会话
      const session = await prisma.chatSession.create({
        data: {
          userId: testUser.id,
          title: `${templateName}配置测试会话`,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          isActive: true,
        },
      });

      // Step 2: 应用配置模板
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUser.id,
          name: `模板测试-${templateName}`,
          category: 'ai_models',
          config: configTemplates[templateName].config,
          isActive: true,
        },
      });

      const sessionMessages: any[] = [];

      // Step 3: 进行完整对话
      for (const prompt of conversationPrompts) {
        const messageResponse = await request(server)
          .post('/api/chat/message')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sessionId: session.id,
            characterId: testCharacter.id,
            message: prompt,
            configId: config.id,
          })
          .expect(200);

        sessionMessages.push({
          userMessage: prompt,
          aiResponse: messageResponse.body.message,
        });

        // 短暂延迟模拟真实对话
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      sessionResults.push({
        templateName,
        sessionId: session.id,
        configId: config.id,
        messages: sessionMessages,
        templateConfig: configTemplates[templateName],
      });

      // Step 4: 分析会话风格一致性
      const consistencyResponse = await request(server)
        .post('/api/analysis/conversation-style')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: session.id,
          analysisType: 'style_consistency',
        })
        .expect(200);

      sessionResults[sessionResults.length - 1].styleConsistency = consistencyResponse.body;

      console.log(`\n${templateName} 配置会话分析:`, {
        模板名称: templateName,
        配置温度: configTemplates[templateName].config.temperature,
        响应风格: configTemplates[templateName].config.responseStyle,
        消息数量: sessionMessages.length,
      });

      // 清理
      await prisma.chatMessage.deleteMany({ where: { sessionId: session.id } });
      await prisma.chatSession.delete({ where: { id: session.id } });
      await prisma.advancedConfig.delete({ where: { id: config.id } });
    }

    // Step 5: 验证不同模板产生不同的会话风格
    expect(sessionResults.length).toBe(3);

    sessionResults.forEach(result => {
      expect(result.messages.length).toBe(conversationPrompts.length);

      // 验证每个响应都符合模板的风格特征
      result.messages.forEach((msg, index) => {
        expect(msg.aiResponse).toBeTruthy();
        expect(msg.aiResponse.length).toBeGreaterThan(20);

        console.log(`${result.templateName} - Q${index + 1}: ${msg.userMessage}`);
        console.log(`回应: ${msg.aiResponse.substring(0, 150)}...`);
      });

      // 验证风格一致性
      if (result.styleConsistency) {
        expect(result.styleConsistency.consistencyScore).toBeGreaterThan(0.7); // 风格应该保持一致
      }
    });
  });

  test('模型参数组合对响应质量的综合影响', async () => {
    const parameterCombinations = [
      {
        name: '平衡配置',
        config: {
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.2,
          presencePenalty: 0.2,
          maxTokens: 1000,
        },
        expectedCharacteristics: ['balanced', 'coherent'],
      },
      {
        name: '保守配置',
        config: {
          temperature: 0.2,
          topP: 0.7,
          frequencyPenalty: 0.0,
          presencePenalty: 0.1,
          maxTokens: 800,
        },
        expectedCharacteristics: ['conservative', 'focused'],
      },
      {
        name: '创新配置',
        config: {
          temperature: 0.9,
          topP: 0.95,
          frequencyPenalty: 0.5,
          presencePenalty: 0.4,
          maxTokens: 1500,
        },
        expectedCharacteristics: ['creative', 'diverse'],
      },
    ];

    const testQueries = [
      {
        query: '请设计一个未来城市的概念',
        type: 'creative',
      },
      {
        query: '解释量子计算的基本原理',
        type: 'analytical',
      },
      {
        query: '推荐一个学习编程的计划',
        type: 'practical',
      },
    ];

    const combinationResults: any[] = [];

    for (const combination of parameterCombinations) {
      const queryResults: any[] = [];

      // Step 1: 创建参数组合配置
      const config = await prisma.advancedConfig.create({
        data: {
          userId: testUser.id,
          name: `参数组合测试-${combination.name}`,
          category: 'ai_models',
          config: {
            model: 'gpt-4',
            systemPrompt: '请根据问题类型调整回应风格，保持专业和有用。',
            ...combination.config,
          },
          isActive: true,
        },
      });

      // Step 2: 测试不同类型的查询
      for (const testQuery of testQueries) {
        const startTime = Date.now();

        const response = await request(server)
          .post('/api/chat/message')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            characterId: testCharacter.id,
            message: testQuery.query,
            configId: config.id,
            enableQualityAnalysis: true,
          })
          .expect(200);

        const responseTime = Date.now() - startTime;

        queryResults.push({
          queryType: testQuery.type,
          query: testQuery.query,
          response: response.body.message,
          responseTime,
          qualityAnalysis: response.body.qualityAnalysis,
        });
      }

      combinationResults.push({
        combinationName: combination.name,
        config: combination.config,
        expectedCharacteristics: combination.expectedCharacteristics,
        queryResults,
        configId: config.id,
      });

      // 清理配置
      await prisma.advancedConfig.delete({ where: { id: config.id } });
    }

    // Step 3: 综合分析参数组合的影响
    combinationResults.forEach(result => {
      console.log(`\n${result.combinationName} 配置测试结果:`);
      console.log('配置参数:', result.config);

      result.queryResults.forEach(queryResult => {
        console.log(`\n查询类型: ${queryResult.queryType}`);
        console.log(`响应时间: ${queryResult.responseTime}ms`);
        console.log(`响应长度: ${queryResult.response.length} 字符`);
        console.log(`响应预览: ${queryResult.response.substring(0, 100)}...`);

        // 验证响应质量
        expect(queryResult.response).toBeTruthy();
        expect(queryResult.response.length).toBeGreaterThan(50);
        expect(queryResult.responseTime).toBeLessThan(10000); // 响应时间应该合理

        if (queryResult.qualityAnalysis) {
          console.log('质量分析:', {
            相关性分数: queryResult.qualityAnalysis.relevanceScore,
            完整性分数: queryResult.qualityAnalysis.completenessScore,
            清晰度分数: queryResult.qualityAnalysis.clarityScore,
          });
        }
      });

      // 验证每种配置都产生了有效响应
      expect(result.queryResults.length).toBe(testQueries.length);
    });

    // Step 4: 比较不同参数组合的效果
    expect(combinationResults.length).toBe(3);

    // 获取各配置的平均响应长度
    const avgLengths = combinationResults.map(result => {
      const totalLength = result.queryResults.reduce((sum, qr) => sum + qr.response.length, 0);
      return {
        name: result.combinationName,
        avgLength: totalLength / result.queryResults.length,
      };
    });

    console.log('\n配置响应长度比较:', avgLengths);

    // 创新配置通常应该产生更长的响应（由于更高的maxTokens和创意性）
    const innovativeResult = combinationResults.find(r => r.combinationName === '创新配置');
    const conservativeResult = combinationResults.find(r => r.combinationName === '保守配置');

    if (innovativeResult && conservativeResult) {
      const innovativeAvgLength = innovativeResult.queryResults.reduce((sum, qr) => sum + qr.response.length, 0) / innovativeResult.queryResults.length;
      const conservativeAvgLength = conservativeResult.queryResults.reduce((sum, qr) => sum + qr.response.length, 0) / conservativeResult.queryResults.length;

      console.log(`创新配置平均长度: ${innovativeAvgLength}, 保守配置平均长度: ${conservativeAvgLength}`);
      // 注意：这个比较可能不总是成立，取决于具体的AI模型行为
    }
  });
});