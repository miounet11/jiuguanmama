/**
 * 任务管理器
 * 负责任务的创建、执行、监控和管理
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 导入任务处理器
const CharacterAvatarTask = require('./tasks/CharacterAvatarTask');
const CharacterSettingsTask = require('./tasks/CharacterSettingsTask');
const MBTIAssignmentTask = require('./tasks/MBTIAssignmentTask');
const DatabaseUpgradeTask = require('./tasks/DatabaseUpgradeTask');

class TaskManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.tasks = new Map();
    this.queue = [];
    this.running = new Map();
    this.maxConcurrent = 3;
    this.isProcessing = false;

    // 初始化任务数据库
    this.initTaskDatabase();

    // 注册任务类型
    this.taskTypes = new Map();
    this.registerTaskTypes();

    // 从数据库恢复任务状态
    this.restoreTasksFromDatabase();
  }

  // 初始化任务数据库
  initTaskDatabase() {
    const dbPath = path.join(__dirname, '../data/tasks.db');
    const dataDir = path.dirname(dbPath);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // 创建任务表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER NOT NULL DEFAULT 5,
        options TEXT NOT NULL DEFAULT '{}',
        result TEXT,
        error TEXT,
        progress REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        logs TEXT DEFAULT '[]'
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    `);

    this.logger.info('📋 任务数据库初始化完成');
  }

  // 注册任务类型
  registerTaskTypes() {
    this.taskTypes.set('generate-character-avatars', CharacterAvatarTask);
    this.taskTypes.set('generate-character-settings', CharacterSettingsTask);
    this.taskTypes.set('assign-mbti', MBTIAssignmentTask);
    this.taskTypes.set('database-upgrade', DatabaseUpgradeTask);

    this.logger.info(`🔧 注册了 ${this.taskTypes.size} 种任务类型`);
  }

  // 从数据库恢复任务状态
  restoreTasksFromDatabase() {
    const pendingTasks = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status IN ('pending', 'running')
      ORDER BY priority ASC, created_at ASC
    `).all();

    for (const taskData of pendingTasks) {
      const task = this.createTaskFromData(taskData);

      if (task.status === 'running') {
        // 重置运行中的任务为待处理
        task.status = 'pending';
        this.updateTaskInDatabase(task);
      }

      this.tasks.set(task.id, task);

      if (task.status === 'pending') {
        this.queue.push(task);
      }
    }

    this.logger.info(`🔄 从数据库恢复了 ${pendingTasks.length} 个任务`);
  }

  // 从数据库数据创建任务对象
  createTaskFromData(data) {
    return {
      id: data.id,
      type: data.type,
      status: data.status,
      priority: data.priority,
      options: JSON.parse(data.options || '{}'),
      result: data.result ? JSON.parse(data.result) : null,
      error: data.error,
      progress: data.progress || 0,
      createdAt: new Date(data.created_at),
      startedAt: data.started_at ? new Date(data.started_at) : null,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      logs: JSON.parse(data.logs || '[]')
    };
  }

  // 创建新任务
  async createTask(type, options = {}, priority = 5) {
    if (!this.taskTypes.has(type)) {
      throw new Error(`未知任务类型: ${type}`);
    }

    const task = {
      id: uuidv4(),
      type,
      status: 'pending',
      priority,
      options,
      result: null,
      error: null,
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      logs: []
    };

    // 保存到数据库
    this.saveTaskToDatabase(task);

    // 添加到内存
    this.tasks.set(task.id, task);

    // 添加到队列
    this.addToQueue(task);

    // 触发处理
    this.processQueue();

    return task;
  }

  // 保存任务到数据库
  saveTaskToDatabase(task) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id, type, status, priority, options, result, error, progress,
        created_at, started_at, completed_at, logs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.type,
      task.status,
      task.priority,
      JSON.stringify(task.options),
      task.result ? JSON.stringify(task.result) : null,
      task.error,
      task.progress,
      task.createdAt.toISOString(),
      task.startedAt ? task.startedAt.toISOString() : null,
      task.completedAt ? task.completedAt.toISOString() : null,
      JSON.stringify(task.logs)
    );
  }

  // 更新数据库中的任务
  updateTaskInDatabase(task) {
    const stmt = this.db.prepare(`
      UPDATE tasks SET
        status = ?, result = ?, error = ?, progress = ?,
        started_at = ?, completed_at = ?, logs = ?
      WHERE id = ?
    `);

    stmt.run(
      task.status,
      task.result ? JSON.stringify(task.result) : null,
      task.error,
      task.progress,
      task.startedAt ? task.startedAt.toISOString() : null,
      task.completedAt ? task.completedAt.toISOString() : null,
      JSON.stringify(task.logs),
      task.id
    );
  }

  // 添加到队列
  addToQueue(task) {
    // 按优先级插入队列
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (task.priority < this.queue[i].priority) {
        this.queue.splice(i, 0, task);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(task);
    }

    this.emit('queueUpdate', this.getQueueStatus());
  }

  // 处理队列
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (this.running.size >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift();

      if (task && task.status === 'pending') {
        this.executeTask(task);
      }
    }

    this.isProcessing = false;
  }

  // 执行任务
  async executeTask(task) {
    const TaskClass = this.taskTypes.get(task.type);

    if (!TaskClass) {
      this.failTask(task, `未知任务类型: ${task.type}`);
      return;
    }

    // 更新任务状态
    task.status = 'running';
    task.startedAt = new Date();
    this.running.set(task.id, task);
    this.updateTaskInDatabase(task);
    this.emit('taskUpdate', task);

    this.logger.info(`🚀 开始执行任务: ${task.type} (${task.id})`);

    try {
      // 创建任务实例
      const taskInstance = new TaskClass(task.options, this.logger);

      // 监听进度更新
      taskInstance.on('progress', (progress, message) => {
        task.progress = progress;
        if (message) {
          task.logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: message
          });
        }
        this.updateTaskInDatabase(task);
        this.emit('taskUpdate', task);
      });

      // 监听日志
      taskInstance.on('log', (level, message) => {
        task.logs.push({
          timestamp: new Date().toISOString(),
          level,
          message
        });
        this.updateTaskInDatabase(task);
      });

      // 执行任务
      const result = await taskInstance.execute();

      // 任务成功完成
      this.completeTask(task, result);

    } catch (error) {
      this.logger.error(`❌ 任务执行失败: ${task.type} (${task.id})`, error);
      this.failTask(task, error.message);
    }
  }

  // 完成任务
  completeTask(task, result) {
    task.status = 'completed';
    task.result = result;
    task.progress = 100;
    task.completedAt = new Date();

    this.running.delete(task.id);
    this.updateTaskInDatabase(task);
    this.emit('taskUpdate', task);

    this.logger.info(`✅ 任务完成: ${task.type} (${task.id})`);

    // 继续处理队列
    this.processQueue();
  }

  // 任务失败
  failTask(task, error) {
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();

    this.running.delete(task.id);
    this.updateTaskInDatabase(task);
    this.emit('taskUpdate', task);

    this.logger.error(`❌ 任务失败: ${task.type} (${task.id}) - ${error}`);

    // 继续处理队列
    this.processQueue();
  }

  // 取消任务
  async cancelTask(id) {
    const task = this.tasks.get(id);

    if (!task) {
      return false;
    }

    if (task.status === 'completed' || task.status === 'failed') {
      return false;
    }

    if (task.status === 'pending') {
      // 从队列中移除
      const index = this.queue.findIndex(t => t.id === id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    }

    if (task.status === 'running') {
      // 标记为取消，等待任务自然结束
      this.running.delete(task.id);
    }

    task.status = 'cancelled';
    task.completedAt = new Date();
    this.updateTaskInDatabase(task);
    this.emit('taskUpdate', task);

    return true;
  }

  // 重试任务
  async retryTask(id) {
    const task = this.tasks.get(id);

    if (!task || task.status !== 'failed') {
      return false;
    }

    task.status = 'pending';
    task.error = null;
    task.progress = 0;
    task.startedAt = null;
    task.completedAt = null;

    this.updateTaskInDatabase(task);
    this.addToQueue(task);
    this.processQueue();

    return true;
  }

  // 获取任务
  getTask(id) {
    return this.tasks.get(id);
  }

  // 获取任务列表
  getTasks(filters = {}, options = {}) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ` ORDER BY ${options.sortBy || 'created_at'} ${options.sortOrder || 'DESC'}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(options.limit || 50, options.offset || 0);

    const rows = this.db.prepare(query).all(...params);
    return rows.map(row => this.createTaskFromData(row));
  }

  // 获取任务日志
  getTaskLogs(id) {
    const task = this.tasks.get(id);
    return task ? task.logs : null;
  }

  // 获取可用任务类型
  getAvailableTaskTypes() {
    return Array.from(this.taskTypes.keys()).map(type => {
      const TaskClass = this.taskTypes.get(type);
      return {
        type,
        name: TaskClass.displayName || type,
        description: TaskClass.description || '无描述',
        options: TaskClass.defaultOptions || {}
      };
    });
  }

  // 获取状态
  getStatus() {
    return {
      running: this.running.size,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      totalTasks: this.tasks.size
    };
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      pending: this.queue.length,
      running: this.running.size,
      queue: this.queue.map(task => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        createdAt: task.createdAt
      }))
    };
  }

  // 获取统计信息
  getStatistics() {
    const stats = this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL
            THEN (julianday(completed_at) - julianday(started_at)) * 86400
            ELSE NULL END) as avg_duration
      FROM tasks
      GROUP BY status
    `).all();

    const typeStats = this.db.prepare(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM tasks
      GROUP BY type
    `).all();

    return {
      byStatus: stats,
      byType: typeStats,
      total: this.tasks.size
    };
  }

  // 清除已完成任务
  async clearCompletedTasks(olderThan = '7d') {
    const cutoffDate = new Date();

    if (olderThan.endsWith('d')) {
      const days = parseInt(olderThan);
      cutoffDate.setDate(cutoffDate.getDate() - days);
    } else if (olderThan.endsWith('h')) {
      const hours = parseInt(olderThan);
      cutoffDate.setHours(cutoffDate.getHours() - hours);
    }

    const result = this.db.prepare(`
      DELETE FROM tasks
      WHERE status IN ('completed', 'failed', 'cancelled')
      AND completed_at < ?
    `).run(cutoffDate.toISOString());

    // 从内存中也移除
    for (const [id, task] of this.tasks.entries()) {
      if (['completed', 'failed', 'cancelled'].includes(task.status) &&
          task.completedAt && task.completedAt < cutoffDate) {
        this.tasks.delete(id);
      }
    }

    return result.changes;
  }

  // 启动任务管理器
  start() {
    this.logger.info('📋 任务管理器已启动');
    this.processQueue();
  }

  // 停止任务管理器
  async stop() {
    this.logger.info('📋 正在停止任务管理器...');

    // 等待运行中的任务完成或超时
    const timeout = 30000; // 30秒超时
    const startTime = Date.now();

    while (this.running.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 强制停止剩余任务
    for (const [id, task] of this.running.entries()) {
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.updateTaskInDatabase(task);
    }

    this.running.clear();
    this.db.close();

    this.logger.info('📋 任务管理器已停止');
  }
}

module.exports = TaskManager;
