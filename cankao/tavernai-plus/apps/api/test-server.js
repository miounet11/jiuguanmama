const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8081;

// 基础中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '0.1.0-test'
  });
});

// 角色API测试端点
app.post('/api/characters', (req, res) => {
  console.log('收到角色创建请求:', req.body);

  const characterData = req.body;
  const errors = {};

  // 验证必填字段
  if (!characterData.name || characterData.name.trim() === '') {
    errors.name = '角色名称不能为空';
  } else if (characterData.name.length > 50) {
    errors.name = '角色名称不能超过50个字符';
  }

  if (!characterData.description || characterData.description.trim() === '') {
    errors.description = '角色描述不能为空';
  } else if (characterData.description.length > 100) {
    errors.description = '角色描述不能超过100个字符';
  }

  if (!characterData.category) {
    errors.category = '请选择角色分类';
  }

  if (!characterData.firstMessage || characterData.firstMessage.trim() === '') {
    errors.firstMessage = '开场白不能为空';
  } else if (characterData.firstMessage.length > 200) {
    errors.firstMessage = '开场白不能超过200个字符';
  }

  // 验证标签格式
  if (characterData.tags) {
    if (Array.isArray(characterData.tags)) {
      if (characterData.tags.length > 10) {
        errors.tags = '标签数量不能超过10个';
      }
    } else if (typeof characterData.tags === 'string') {
      // 如果是字符串，尝试转换
      characterData.tags = characterData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else {
      errors.tags = '标签格式不正确';
    }
  }

  // 如果有错误，返回422状态码
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({
      success: false,
      message: '数据验证失败',
      errors: errors
    });
  }

  // 成功创建角色
  res.json({
    success: true,
    message: '角色创建成功',
    character: {
      id: 'test-' + Date.now(),
      ...characterData,
      createdAt: new Date().toISOString()
    }
  });
});

// 启动服务器
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 可用端点:`);
  console.log(`   GET  /health - 健康检查`);
  console.log(`   POST /api/characters - 创建角色`);
});

// 错误处理
process.on('unhandledRejection', (err) => {
  console.error('未处理的Promise拒绝:', err);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});