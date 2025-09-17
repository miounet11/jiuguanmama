#!/usr/bin/env node

const axios = require('axios');
const express = require('express');

const config = {
  NEWAPI_KEY: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
  NEWAPI_BASE_URL: 'https://ttkk.inping.com/v1',
  DEFAULT_MODEL: 'grok-3',
  NEWAPI_MAX_TOKENS: 4000,
  NEWAPI_TEMPERATURE: 0.7
};

async function testAIService() {
  console.log('🤖 独立 AI 功能测试');
  console.log(`   API Key: ${config.NEWAPI_KEY.substring(0, 12)}...`);
  console.log(`   Base URL: ${config.NEWAPI_BASE_URL}`);
  console.log(`   Model: ${config.DEFAULT_MODEL}`);

  try {
    const response = await axios.post(`${config.NEWAPI_BASE_URL}/chat/completions`, {
      model: config.DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: '你好，我是在测试 TavernAI Plus 的 AI 集成。请确认你能收到这条消息并回复。'
        }
      ],
      max_tokens: config.NEWAPI_MAX_TOKENS,
      temperature: config.NEWAPI_TEMPERATURE
    }, {
      headers: {
        'Authorization': `Bearer ${config.NEWAPI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      const aiReply = response.data.choices[0].message.content;
      console.log('✅ AI 回复:', aiReply);
      console.log('✅ Grok-3 集成测试成功！');
      return true;
    } else {
      console.log('❌ AI 回复格式异常:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ AI 服务调用失败:', error.response?.data || error.message);
    return false;
  }
}

async function createTestServer() {
  const app = express();
  app.use(express.json());

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'TavernAI Plus Standalone Test',
      timestamp: new Date().toISOString()
    });
  });

  // AI 测试端点
  app.post('/api/ai/test', async (req, res) => {
    try {
      const { message } = req.body;
      console.log('🤖 收到 AI 测试请求:', message);

      const response = await axios.post(`${config.NEWAPI_BASE_URL}/chat/completions`, {
        model: config.DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: message || '测试消息'
          }
        ],
        max_tokens: config.NEWAPI_MAX_TOKENS,
        temperature: config.NEWAPI_TEMPERATURE
      }, {
        headers: {
          'Authorization': `Bearer ${config.NEWAPI_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        const aiReply = response.data.choices[0].message.content;
        console.log('🤖 AI 回复:', aiReply);
        res.json({
          success: true,
          message: aiReply,
          model: config.DEFAULT_MODEL,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'AI 回复格式异常',
          data: response.data
        });
      }
    } catch (error) {
      console.error('❌ AI 调用失败:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data || error.message
      });
    }
  });

  const PORT = 3008;
  const server = app.listen(PORT, () => {
    console.log(`🚀 独立测试服务器启动成功`);
    console.log(`   端口: ${PORT}`);
    console.log(`   健康检查: http://localhost:${PORT}/health`);
    console.log(`   AI 测试: POST http://localhost:${PORT}/api/ai/test`);
    console.log('');
    console.log('🧪 测试命令:');
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/ai/test -H "Content-Type: application/json" -d '{"message":"你好，这是端到端测试"}'`);
  });

  return server;
}

async function main() {
  console.log('🔍 开始 Story 1.1 验证测试...');
  console.log('');

  // 1. 测试 AI 服务连接
  const aiWorking = await testAIService();
  if (!aiWorking) {
    console.log('❌ AI 服务测试失败，退出');
    process.exit(1);
  }

  console.log('');

  // 2. 启动测试服务器
  const server = await createTestServer();

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 关闭测试服务器...');
    server.close(() => {
      console.log('✅ 测试服务器已关闭');
      process.exit(0);
    });
  });
}

main().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});