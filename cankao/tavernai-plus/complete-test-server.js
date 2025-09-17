#!/usr/bin/env node

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

// 模拟数据库
const mockDB = {
  users: new Map()
};

// AI 配置
const config = {
  NEWAPI_KEY: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
  NEWAPI_BASE_URL: 'https://ttkk.inping.com/v1',
  DEFAULT_MODEL: 'grok-3',
  JWT_SECRET: 'test-secret-for-story-1.2',
  NEWAPI_MAX_TOKENS: 4000,
  NEWAPI_TEMPERATURE: 0.7
};

// 认证中间件
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = mockDB.users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// 根路径 - API服务器信息
app.get('/', (req, res) => {
  res.json({
    service: 'TavernAI Plus API Server',
    version: '2.2.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    message: '🎉 TavernAI Plus 后端API服务器正在运行',
    features: [
      '🔐 用户认证 (JWT)',
      '🔄 智能工作流引擎',
      '🧠 高级AI功能集成',
      '👥 角色召唤系统',
      '🔍 向量数据库搜索',
      '⏰ 定时调度系统'
    ],
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      workflows: '/api/workflows/*',
      ai: '/api/ai/*',
      characters: '/api/characters/*'
    },
    frontend: {
      available: true,
      url: 'http://localhost:3009',
      note: '运行 node frontend-server.js 启动前端服务'
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TavernAI Plus API Server',
    timestamp: new Date().toISOString(),
    environment: 'test',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// AI 测试端点
app.post('/api/ai/test', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(`${config.NEWAPI_BASE_URL}/chat/completions`, {
      model: config.DEFAULT_MODEL,
      messages: [{ role: 'user', content: message || '测试消息' }],
      max_tokens: config.NEWAPI_MAX_TOKENS,
      temperature: config.NEWAPI_TEMPERATURE
    }, {
      headers: {
        'Authorization': `Bearer ${config.NEWAPI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data?.choices?.[0]) {
      const aiReply = response.data.choices[0].message.content;
      res.json({
        success: true,
        message: aiReply,
        model: config.DEFAULT_MODEL,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'AI 回复格式异常'
      });
    }
  } catch (error) {
    console.error('AI 调用失败:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'AI 服务调用失败'
    });
  }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    for (const [, user] of mockDB.users) {
      if (user.username === username || user.email === email) {
        return res.status(409).json({
          success: false,
          error: user.username === username ? 'Username already exists' : 'Email already registered'
        });
      }
    }

    // 创建新用户
    const userId = Date.now().toString();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: userId,
      username,
      email,
      passwordHash,
      role: 'user',
      credits: 100,
      subscriptionTier: 'free',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    mockDB.users.set(userId, user);

    // 生成JWT
    const accessToken = jwt.sign(
      { userId, username, email, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      accessToken,
      user: safeUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败'
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    let user = null;
    for (const [, u] of mockDB.users) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // 生成JWT
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      accessToken,
      user: safeUser
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败'
    });
  }
});

// 获取用户信息
app.get('/api/auth/profile', authenticate, (req, res) => {
  const { passwordHash, ...safeUser } = req.user;
  res.json({
    success: true,
    user: safeUser
  });
});

// 工作流存储
const mockWorkflows = new Map();
let workflowIdCounter = 1;

// 工作流API端点
// 创建工作流
app.post('/api/workflows', authenticate, (req, res) => {
  try {
    const { name, description, definition, variables, schedule, isPublic } = req.body;

    // 简单验证
    if (!name || !definition) {
      return res.status(400).json({
        success: false,
        error: '工作流名称和定义是必需的'
      });
    }

    const workflowId = `workflow_${workflowIdCounter++}`;
    const workflow = {
      id: workflowId,
      name,
      description: description || '',
      definition,
      variables: variables || {},
      schedule: schedule || null,
      isPublic: isPublic || false,
      creatorId: req.user.id,
      creator: { id: req.user.id, username: req.user.username },
      version: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: definition.nodes ? definition.nodes.length : 0,
      connectionCount: definition.connections ? definition.connections.length : 0,
      executionCount: 0,
      hasSchedule: !!schedule
    };

    mockWorkflows.set(workflowId, workflow);

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({
      success: false,
      error: '创建工作流失败'
    });
  }
});

// 获取工作流列表
app.get('/api/workflows', authenticate, (req, res) => {
  try {
    const workflows = Array.from(mockWorkflows.values())
      .filter(w => w.isActive)
      .map(w => ({ ...w }));

    res.json({
      success: true,
      workflows,
      pagination: {
        page: 1,
        limit: 20,
        total: workflows.length,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取工作流列表失败'
    });
  }
});

// 获取工作流详情
app.get('/api/workflows/:id', authenticate, (req, res) => {
  try {
    const workflow = mockWorkflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    res.json({
      success: true,
      workflow: {
        ...workflow,
        statistics: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          avgDuration: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取工作流详情失败'
    });
  }
});

// 更新工作流
app.put('/api/workflows/:id', authenticate, (req, res) => {
  try {
    const workflow = mockWorkflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    if (workflow.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '无权限修改该工作流'
      });
    }

    // 更新工作流
    const updatedWorkflow = {
      ...workflow,
      ...req.body,
      updatedAt: new Date().toISOString(),
      version: workflow.version + 1
    };

    mockWorkflows.set(req.params.id, updatedWorkflow);

    res.json({
      success: true,
      workflow: updatedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新工作流失败'
    });
  }
});

// 执行工作流
app.post('/api/workflows/:id/execute', authenticate, (req, res) => {
  try {
    const workflow = mockWorkflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    const instanceId = `instance_${Date.now()}`;

    // 模拟工作流执行
    setTimeout(() => {
      console.log(`工作流 ${workflow.name} 执行完成 (实例: ${instanceId})`);
    }, 2000);

    res.json({
      success: true,
      instanceId,
      message: '工作流执行已启动'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '执行工作流失败'
    });
  }
});

// 获取工作流调度状态
app.get('/api/workflows/:id/schedule', authenticate, (req, res) => {
  try {
    const workflow = mockWorkflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    res.json({
      success: true,
      schedule: {
        hasSchedule: !!workflow.schedule,
        cronExpression: workflow.schedule,
        isEnabled: !!workflow.schedule,
        lastRun: null,
        nextRun: null,
        failCount: 0,
        maxRetries: 3
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取调度状态失败'
    });
  }
});

// 手动触发定时任务
app.post('/api/workflows/:id/trigger', authenticate, (req, res) => {
  try {
    const workflow = mockWorkflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    if (!workflow.schedule) {
      return res.status(400).json({
        success: false,
        error: '该工作流没有配置定时任务'
      });
    }

    res.json({
      success: true,
      message: '定时任务已手动触发'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '触发定时任务失败'
    });
  }
});

// 获取工作流模板
app.get('/api/workflows/templates/list', authenticate, (req, res) => {
  try {
    // 返回模拟的工作流模板
    const templates = [
      {
        id: 'template_1',
        name: 'AI文本分析模板',
        description: '使用AI分析文本内容的工作流模板',
        nodeCount: 4,
        usageCount: 15,
        creator: { username: 'system' }
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取工作流模板失败'
    });
  }
});

// 启动服务器
const PORT = 3008;
const server = app.listen(PORT, () => {
  console.log('🚀 Story 1.2 完整测试服务器启动成功');
  console.log(`   端口: ${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/health`);
  console.log(`   AI 测试: POST http://localhost:${PORT}/api/ai/test`);
  console.log(`   用户注册: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   用户登录: POST http://localhost:${PORT}/api/auth/login`);
  console.log('');
  console.log('🧪 测试命令:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   node test-story-1.2.js`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\\n🛑 关闭测试服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});