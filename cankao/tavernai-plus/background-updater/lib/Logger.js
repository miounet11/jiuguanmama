/**
 * TavernAI Plus 后台更新系统 - 日志器
 *
 * 功能特点：
 * - 多级别日志记录 (debug, info, warn, error)
 * - 彩色控制台输出
 * - 日志历史记录和查询
 * - 时间戳和格式化输出
 * - 可配置的日志级别
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.maxLogHistory = options.maxLogHistory || 1000;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.logFile = options.logFile || path.join(__dirname, '../logs/system.log');

    // 日志历史记录
    this.logHistory = [];

    // 日志级别映射
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    // 控制台颜色
    this.colors = {
      debug: '\x1b[36m',   // 青色
      info: '\x1b[32m',    // 绿色
      warn: '\x1b[33m',    // 黄色
      error: '\x1b[31m',   // 红色
      reset: '\x1b[0m'     // 重置
    };

    // 确保日志目录存在
    if (this.enableFile) {
      this.ensureLogDirectory();
    }
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 检查日志级别是否应该输出
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');

    const fullMessage = `${message} ${formattedArgs}`.trim();

    return {
      timestamp,
      level: level.toUpperCase(),
      message: fullMessage,
      raw: { message, args }
    };
  }

  /**
   * 核心日志方法
   */
  log(level, message, ...args) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatMessage(level, message, ...args);

    // 添加到历史记录
    this.logHistory.push(logEntry);

    // 保持历史记录大小限制
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift();
    }

    // 控制台输出
    if (this.enableConsole) {
      const color = this.colors[level] || '';
      const reset = this.colors.reset;
      const timestamp = new Date().toLocaleString('zh-CN');

      console.log(
        `${color}[${timestamp}] [${logEntry.level}]${reset} ${logEntry.message}`
      );
    }

    // 文件输出
    if (this.enableFile) {
      const logLine = `[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.message}\n`;
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    }
  }

  /**
   * Debug 级别日志
   */
  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  /**
   * Info 级别日志
   */
  info(message, ...args) {
    this.log('info', message, ...args);
  }

  /**
   * Warning 级别日志
   */
  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Error 级别日志
   */
  error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * 获取日志历史记录
   */
  getLogs(level = null, limit = 100, offset = 0) {
    let logs = this.logHistory;

    // 按级别过滤
    if (level) {
      logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }

    // 排序（最新的在前）
    logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 分页
    const start = Math.max(0, offset);
    const end = Math.min(logs.length, start + limit);

    return {
      logs: logs.slice(start, end),
      total: logs.length,
      offset: start,
      limit: limit
    };
  }

  /**
   * 清除日志历史
   */
  clearHistory() {
    this.logHistory = [];
    this.info('日志历史已清除');
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.info(`日志级别已设置为: ${level}`);
    } else {
      this.warn(`无效的日志级别: ${level}`);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      logLevel: this.logLevel,
      maxLogHistory: this.maxLogHistory,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
      logFile: this.logFile,
      historyCount: this.logHistory.length
    };
  }

  /**
   * 导出日志到文件
   */
  exportLogs(filePath, options = {}) {
    const { level, startDate, endDate } = options;

    let logs = this.logHistory;

    // 按级别过滤
    if (level) {
      logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
    }

    // 按时间过滤
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // 生成导出内容
    const exportContent = logs.map(log =>
      `[${log.timestamp}] [${log.level}] ${log.message}`
    ).join('\n');

    // 写入文件
    fs.writeFileSync(filePath, exportContent, 'utf8');

    this.info(`已导出 ${logs.length} 条日志到: ${filePath}`);

    return {
      exportPath: filePath,
      logCount: logs.length,
      success: true
    };
  }
}

module.exports = Logger;
