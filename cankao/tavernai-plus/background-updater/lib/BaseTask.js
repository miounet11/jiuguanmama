const EventEmitter = require('events');

/**
 * 基础任务类，所有具体任务都应该继承此类
 */
class BaseTask extends EventEmitter {
  constructor(taskId, data = {}) {
    super();
    this.taskId = taskId;
    this.data = data;
    this.progress = 0;
    this.status = 'PENDING';
    this.error = null;
    this.result = null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * 执行任务 - 子类必须实现此方法
   */
  async execute() {
    throw new Error('execute() method must be implemented by subclass');
  }

  /**
   * 启动任务执行
   */
  async start() {
    try {
      this.status = 'RUNNING';
      this.startTime = new Date();
      this.emit('started', { taskId: this.taskId, data: this.data });

      this.result = await this.execute();

      this.status = 'COMPLETED';
      this.endTime = new Date();
      this.progress = 100;
      this.emit('completed', {
        taskId: this.taskId,
        result: this.result,
        duration: this.endTime - this.startTime
      });

      return this.result;
    } catch (error) {
      this.status = 'FAILED';
      this.error = error.message;
      this.endTime = new Date();
      this.emit('failed', {
        taskId: this.taskId,
        error: this.error,
        duration: this.endTime - this.startTime
      });
      throw error;
    }
  }

  /**
   * 更新任务进度
   */
  updateProgress(progress, message = '') {
    this.progress = Math.min(100, Math.max(0, progress));
    this.emit('progress', {
      taskId: this.taskId,
      progress: this.progress,
      message
    });
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      taskId: this.taskId,
      status: this.status,
      progress: this.progress,
      error: this.error,
      result: this.result,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime && this.startTime ? this.endTime - this.startTime : null,
      data: this.data
    };
  }

  /**
   * 取消任务 - 子类可以重写此方法实现特定的取消逻辑
   */
  async cancel() {
    if (this.status === 'RUNNING') {
      this.status = 'CANCELLED';
      this.endTime = new Date();
      this.emit('cancelled', { taskId: this.taskId });
    }
  }
}

module.exports = BaseTask;
