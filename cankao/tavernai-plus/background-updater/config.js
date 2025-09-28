/**
 * 后台更新系统配置文件
 */

const path = require('path');

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }
  },

  // 数据库配置
  database: {
    // 主数据库路径
    mainDb: path.join(__dirname, '../apps/api/prisma/dev.db'),
    // 任务数据库路径
    taskDb: path.join(__dirname, 'data/tasks.db'),
    // 备份目录
    backupDir: path.join(__dirname, 'backups'),
    // 备份保留数量
    maxBackups: 10
  },

  // 任务队列配置
  tasks: {
    // 最大并发任务数
    maxConcurrent: 3,
    // 任务超时时间 (毫秒)
    timeout: 300000, // 5分钟
    // 失败重试次数
    maxRetries: 3,
    // 重试延迟 (毫秒)
    retryDelay: 5000,
    // 任务清理间隔 (毫秒)
    cleanupInterval: 3600000 // 1小时
  },

  // 角色头像生成配置
  avatar: {
    // 批处理大小
    batchSize: 3,
    // 并发数量
    concurrency: 1,
    // 单次请求超时
    requestTimeout: 30000,
    // 图片尺寸
    imageSize: {
      width: 512,
      height: 512
    },
    // 生成参数
    generationParams: {
      steps: 20,
      cfg_scale: 7,
      model: 'nano-banana'
    }
  },

  // MBTI分配配置
  mbti: {
    // 可用的MBTI类型
    types: [
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP'
    ],
    // 分类
    categories: {
      'Analysts': ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
      'Diplomats': ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
      'Sentinels': ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
      'Explorers': ['ISTP', 'ISFP', 'ESTP', 'ESFP']
    }
  },

  // 角色设定更新配置
  settings: {
    // 默认更新字段
    defaultFields: [
      'fullDescription',
      'speakingStyle',
      'scenario',
      'exampleDialogs'
    ],
    // 示例对话数量
    exampleDialogCount: 3,
    // 描述最小长度
    minDescriptionLength: 50
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    // 日志文件配置
    file: {
      enabled: true,
      path: path.join(__dirname, 'logs'),
      maxSize: '10MB',
      maxFiles: 5
    }
  },

  // 性能监控配置
  monitoring: {
    // 启用性能监控
    enabled: true,
    // 监控间隔 (毫秒)
    interval: 60000, // 1分钟
    // 内存使用报警阈值 (MB)
    memoryThreshold: 500,
    // CPU使用报警阈值 (%)
    cpuThreshold: 80
  },

  // 安全配置
  security: {
    // API密钥验证
    apiKey: process.env.API_KEY,
    // 请求频率限制
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 最多100次请求
    },
    // CORS配置
    cors: {
      credentials: true,
      optionsSuccessStatus: 200
    }
  },

  // NewAPI配置
  newapi: {
    baseUrl: process.env.NEWAPI_BASE_URL || 'http://localhost:8888',
    timeout: 30000,
    retries: 3,
    retryDelay: 2000
  },

  // 开发模式配置
  development: {
    // 启用详细日志
    verbose: process.env.NODE_ENV === 'development',
    // 启用调试模式
    debug: process.env.DEBUG === 'true',
    // 跳过某些验证
    skipValidation: false,
    // 模拟模式 (不实际执行任务)
    mockMode: process.env.MOCK_MODE === 'true'
  },

  // 任务优先级定义
  priorities: {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4
  },

  // 任务状态定义
  taskStatuses: {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
  },

  // 常用的数据库升级脚本
  migrations: {
    addImageFields: `
      ALTER TABLE Character ADD COLUMN backgroundImage TEXT;
      ALTER TABLE Character ADD COLUMN mbtiType TEXT;
      ALTER TABLE Character ADD COLUMN avatarStatus TEXT DEFAULT 'PENDING';
      ALTER TABLE Character ADD COLUMN backgroundStatus TEXT DEFAULT 'PENDING';
    `,

    addIndexes: `
      CREATE INDEX IF NOT EXISTS idx_character_mbti ON Character(mbtiType);
      CREATE INDEX IF NOT EXISTS idx_character_avatar_status ON Character(avatarStatus);
      CREATE INDEX IF NOT EXISTS idx_character_created_at ON Character(createdAt);
    `,

    addChatEnhancements: `
      ALTER TABLE Chat ADD COLUMN metadata TEXT;
      ALTER TABLE Chat ADD COLUMN tags TEXT;
      ALTER TABLE ChatMessage ADD COLUMN messageType TEXT DEFAULT 'text';
      ALTER TABLE ChatMessage ADD COLUMN attachments TEXT;
    `
  }
};

// 配置验证函数
function validateConfig() {
  const config = module.exports;
  const errors = [];

  // 检查必要的路径是否存在
  const fs = require('fs');

  if (!fs.existsSync(config.database.mainDb)) {
    errors.push(`主数据库文件不存在: ${config.database.mainDb}`);
  }

  // 检查端口号是否有效
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push(`无效的端口号: ${config.server.port}`);
  }

  // 检查MBTI类型定义
  if (config.mbti.types.length !== 16) {
    errors.push(`MBTI类型数量不正确，应该是16个，当前是${config.mbti.types.length}个`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 获取环境特定的配置
function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = module.exports;

  if (env === 'production') {
    // 生产环境配置
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'warn'
      },
      development: {
        ...config.development,
        verbose: false,
        debug: false
      },
      tasks: {
        ...config.tasks,
        maxConcurrent: 5
      }
    };
  } else if (env === 'test') {
    // 测试环境配置
    return {
      ...config,
      database: {
        ...config.database,
        mainDb: path.join(__dirname, '../apps/api/prisma/test.db')
      },
      development: {
        ...config.development,
        mockMode: true
      }
    };
  }

  // 开发环境配置 (默认)
  return config;
}

module.exports.validateConfig = validateConfig;
module.exports.getEnvironmentConfig = getEnvironmentConfig;
