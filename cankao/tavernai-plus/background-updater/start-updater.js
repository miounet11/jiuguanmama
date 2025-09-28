#!/usr/bin/env node

/**
 * 后台更新系统启动脚本
 *
 * 使用方法:
 * node start-updater.js [--port=3002] [--host=localhost] [--silent]
 */

const path = require('path');
const { spawn } = require('child_process');

// 解析命令行参数
const args = process.argv.slice(2);
const config = {
  port: 3002,
  host: 'localhost',
  silent: false
};

args.forEach(arg => {
  if (arg.startsWith('--port=')) {
    config.port = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--host=')) {
    config.host = arg.split('=')[1];
  } else if (arg === '--silent') {
    config.silent = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
});

function showHelp() {
  console.log(`
🚀 TavernAI Plus 后台更新系统

使用方法:
  node start-updater.js [选项]

选项:
  --port=<端口>     指定服务器端口 (默认: 3002)
  --host=<主机>     指定服务器主机 (默认: localhost)
  --silent         静默模式，不显示日志
  --help, -h       显示此帮助信息

示例:
  node start-updater.js                    # 使用默认配置
  node start-updater.js --port=3003        # 指定端口
  node start-updater.js --silent           # 静默模式

API 端点:
  GET  /api/tasks                          # 获取所有任务
  POST /api/tasks                          # 创建新任务
  GET  /api/tasks/:id                      # 获取任务详情
  DELETE /api/tasks/:id                    # 删除任务

  POST /api/quick/character-avatars        # 快速生成角色头像
  POST /api/quick/character-settings       # 快速更新角色设定
  POST /api/quick/mbti-assignment          # 快速分配MBTI
  POST /api/quick/database-upgrade         # 快速数据库升级

WebSocket:
  ws://localhost:${config.port}/ws         # 实时任务进度更新
`);
}

function startServer() {
  const serverPath = path.join(__dirname, 'index.js');

  if (!config.silent) {
    console.log(`🚀 启动 TavernAI Plus 后台更新系统...`);
    console.log(`📍 服务地址: http://${config.host}:${config.port}`);
    console.log(`🌐 WebSocket: ws://${config.host}:${config.port}/ws`);
    console.log(`📁 工作目录: ${__dirname}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log('');
  }

  // 设置环境变量
  const env = {
    ...process.env,
    PORT: config.port.toString(),
    HOST: config.host,
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  // 启动服务器
  const server = spawn('node', [serverPath], {
    env,
    stdio: config.silent ? 'pipe' : 'inherit',
    cwd: __dirname
  });

  server.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  });

  server.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`❌ 服务器异常退出，代码: ${code}, 信号: ${signal}`);
      process.exit(code);
    }
  });

  // 处理进程信号
  process.on('SIGINT', () => {
    if (!config.silent) {
      console.log('\n⏹️  正在停止服务器...');
    }
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    if (!config.silent) {
      console.log('\n⏹️  正在停止服务器...');
    }
    server.kill('SIGTERM');
  });

  if (!config.silent) {
    console.log('✅ 后台更新系统已启动');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
  }
}

// 检查必要的依赖
function checkDependencies() {
  const requiredFiles = [
    'index.js',
    'lib/TaskManager.js',
    'lib/BaseTask.js',
    'lib/tasks/CharacterAvatarTask.js',
    'lib/tasks/CharacterSettingsTask.js',
    'lib/tasks/MBTIAssignmentTask.js',
    'lib/tasks/DatabaseUpgradeTask.js'
  ];

  const missing = requiredFiles.filter(file => {
    const filePath = path.join(__dirname, file);
    try {
      require.resolve(filePath);
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length > 0) {
    console.error('❌ 缺少必要的文件:');
    missing.forEach(file => console.error(`   - ${file}`));
    console.error('请确保所有文件都已正确创建。');
    process.exit(1);
  }
}

// 主函数
function main() {
  try {
    checkDependencies();
    startServer();
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { startServer, config };
