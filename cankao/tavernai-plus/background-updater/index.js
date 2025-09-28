/**
 * TavernAI Plus 后台数据更新系统
 *
 * 功能特点：
 * - 支持各种数据更新任务
 * - 任务队列管理
 * - 进度监控和日志
 * - 失败重试机制
 * - RESTful API接口
 * - 可扩展的任务类型
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

// 导入任务处理器
const TaskManager = require('./lib/TaskManager');
const Logger = require('./lib/Logger');
const config = require('./config');

// 创建Express应用
const app = express();
const port = config.server.port || 3002;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 初始化系统
const logger = new Logger();
const taskManager = new TaskManager(logger);

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 启动信息
logger.info('🚀 TavernAI Plus 后台数据更新系统启动中...');
logger.info(`📂 工作目录: ${process.cwd()}`);
logger.info(`🔧 配置环境: ${process.env.NODE_ENV || 'development'}`);

// ================== API 路由 ==================

// 系统状态
app.get('/api/status', (req, res) => {
  const status = {
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: require('./package.json').version,
      environment: process.env.NODE_ENV || 'development'
    },
    tasks: taskManager.getStatus(),
    queue: taskManager.getQueueStatus()
  };

  res.json(status);
});

// 获取所有可用任务类型
app.get('/api/tasks/types', (req, res) => {
  const taskTypes = taskManager.getAvailableTaskTypes();
  res.json(taskTypes);
});

// 创建新任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { type, options = {}, priority = 5 } = req.body;

    if (!type) {
      return res.status(400).json({ error: '任务类型不能为空' });
    }

    const task = await taskManager.createTask(type, options, priority);

    logger.info(`📝 创建新任务: ${type} (ID: ${task.id})`);

    res.status(201).json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        status: task.status,
        createdAt: task.createdAt
      }
    });

  } catch (error) {
    logger.error('创建任务失败:', error);
    res.status(500).json({
      error: error.message,
      code: 'TASK_CREATION_FAILED'
    });
  }
});

// 获取任务列表
app.get('/api/tasks', (req, res) => {
  const {
    status,
    type,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (type) filters.type = type;

  const tasks = taskManager.getTasks(filters, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    sortBy,
    sortOrder
  });

  res.json(tasks);
});

// 获取特定任务信息
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = taskManager.getTask(id);

  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  res.json(task);
});

// 获取任务日志
app.get('/api/tasks/:id/logs', (req, res) => {
  const { id } = req.params;
  const logs = taskManager.getTaskLogs(id);

  if (logs === null) {
    return res.status(404).json({ error: '任务不存在' });
  }

  res.json(logs);
});

// 取消任务
app.post('/api/tasks/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await taskManager.cancelTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在或无法取消' });
    }

    logger.info(`❌ 任务取消: ${id}`);
    res.json({ success: true, message: '任务已取消' });

  } catch (error) {
    logger.error('取消任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 重试失败任务
app.post('/api/tasks/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await taskManager.retryTask(id);

    if (!result) {
      return res.status(404).json({ error: '任务不存在或无法重试' });
    }

    logger.info(`🔄 任务重试: ${id}`);
    res.json({ success: true, message: '任务已重新加入队列' });

  } catch (error) {
    logger.error('重试任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清除已完成任务
app.delete('/api/tasks/completed', async (req, res) => {
  try {
    const { olderThan = '7d' } = req.query;
    const count = await taskManager.clearCompletedTasks(olderThan);

    logger.info(`🗑️ 清除了 ${count} 个已完成任务`);
    res.json({ success: true, count, message: `清除了 ${count} 个已完成任务` });

  } catch (error) {
    logger.error('清除任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取系统统计信息
app.get('/api/stats', (req, res) => {
  const stats = taskManager.getStatistics();
  res.json(stats);
});

// 获取系统日志
app.get('/api/logs', (req, res) => {
  const { level, limit = 100, offset = 0 } = req.query;
  const logs = logger.getLogs(level, parseInt(limit), parseInt(offset));
  res.json(logs);
});

// WebSocket 连接 (实时状态更新)
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// WebSocket 事件处理
io.on('connection', (socket) => {
  logger.info(`🔌 WebSocket 连接: ${socket.id}`);

  // 发送当前状态
  socket.emit('status', taskManager.getStatus());

  // 监听任务状态变化
  const onTaskUpdate = (task) => {
    socket.emit('taskUpdate', task);
  };

  const onQueueUpdate = (queueStatus) => {
    socket.emit('queueUpdate', queueStatus);
  };

  taskManager.on('taskUpdate', onTaskUpdate);
  taskManager.on('queueUpdate', onQueueUpdate);

  socket.on('disconnect', () => {
    logger.info(`🔌 WebSocket 断开: ${socket.id}`);
    taskManager.off('taskUpdate', onTaskUpdate);
    taskManager.off('queueUpdate', onQueueUpdate);
  });
});

// ================== 预定义任务快捷方式 ==================

// 完整角色补全任务
app.post('/api/quick/complete-all-characters', async (req, res) => {
  try {
    const { includeAvatars = true, includeMBTI = true, includeSettings = true } = req.body;

    const tasks = [];

    // 1. MBTI分配任务
    if (includeMBTI) {
      const mbtiTask = await taskManager.createTask('assign-mbti', {}, 1);
      tasks.push(mbtiTask.id);
    }

    // 2. 设定补全任务
    if (includeSettings) {
      const settingsTask = await taskManager.createTask('generate-character-settings', {}, 2);
      tasks.push(settingsTask.id);
    }

    // 3. 头像生成任务
    if (includeAvatars) {
      const avatarTask = await taskManager.createTask('generate-character-avatars', {
        batchSize: 5,
        retryFailed: true
      }, 3);
      tasks.push(avatarTask.id);
    }

    logger.info(`🚀 启动完整角色补全任务: ${tasks.join(', ')}`);

    res.json({
      success: true,
      message: '完整角色补全任务已启动',
      tasks: tasks
    });

  } catch (error) {
    logger.error('启动完整补全任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 只补全头像任务
app.post('/api/quick/complete-avatars', async (req, res) => {
  try {
    const { batchSize = 3, retryFailed = true } = req.body;

    const task = await taskManager.createTask('generate-character-avatars', {
      batchSize,
      retryFailed
    }, 1);

    logger.info(`🎨 启动头像补全任务: ${task.id}`);

    res.json({
      success: true,
      message: '头像补全任务已启动',
      taskId: task.id
    });

  } catch (error) {
    logger.error('启动头像补全任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 数据库升级任务
app.post('/api/quick/upgrade-database', async (req, res) => {
  try {
    const { migrations = [] } = req.body;

    const task = await taskManager.createTask('database-upgrade', {
      migrations
    }, 1);

    logger.info(`🗄️ 启动数据库升级任务: ${task.id}`);

    res.json({
      success: true,
      message: '数据库升级任务已启动',
      taskId: task.id
    });

  } catch (error) {
    logger.error('启动数据库升级任务失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================== 启动服务器 ==================

server.listen(port, () => {
  logger.info(`🌐 后台数据更新系统已启动`);
  logger.info(`📡 HTTP服务: http://localhost:${port}`);
  logger.info(`🔌 WebSocket服务: ws://localhost:${port}`);
  logger.info(`📊 管理面板: http://localhost:${port}/dashboard`);

  // 启动任务管理器
  taskManager.start();

  logger.info('✅ 系统初始化完成，准备接受任务');
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('🛑 收到SIGTERM信号，开始优雅关闭...');

  server.close(() => {
    logger.info('🌐 HTTP服务器已关闭');

    taskManager.stop().then(() => {
      logger.info('📋 任务管理器已停止');
      logger.info('✅ 系统已优雅关闭');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('🛑 收到SIGINT信号，开始优雅关闭...');

  server.close(() => {
    logger.info('🌐 HTTP服务器已关闭');

    taskManager.stop().then(() => {
      logger.info('📋 任务管理器已停止');
      logger.info('✅ 系统已优雅关闭');
      process.exit(0);
    });
  });
});

module.exports = app;
