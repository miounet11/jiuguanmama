#!/usr/bin/env node

/**
 * 后台更新系统使用示例
 *
 * 这个文件展示了如何使用后台更新系统的各种功能
 */

const TaskManager = require('./lib/TaskManager');
const WebSocket = require('ws');

async function exampleUsage() {
  console.log('🚀 TavernAI Plus 后台更新系统使用示例\n');

  // 1. 创建任务管理器实例
  const taskManager = new TaskManager();

  console.log('✅ 任务管理器已创建');

  try {
    // 2. 示例：生成所有角色头像
    console.log('\n📸 示例1: 生成角色头像');
    const avatarTask = await taskManager.createTask('CHARACTER_AVATAR', {
      batchSize: 3,
      concurrency: 1
    }, 'HIGH');

    console.log(`   任务ID: ${avatarTask.taskId}`);
    console.log('   状态: 已创建，等待执行');

    // 监听任务事件
    avatarTask.on('started', (event) => {
      console.log(`   ▶️  任务开始执行: ${event.taskId}`);
    });

    avatarTask.on('progress', (event) => {
      console.log(`   📊 进度更新: ${event.progress}% - ${event.message}`);
    });

    avatarTask.on('completed', (event) => {
      console.log(`   ✅ 任务完成: ${event.taskId}`);
      console.log(`   📈 结果:`, event.result);
    });

    avatarTask.on('failed', (event) => {
      console.log(`   ❌ 任务失败: ${event.taskId} - ${event.error}`);
    });

    // 3. 示例：分配MBTI类型
    console.log('\n🧠 示例2: 分配MBTI类型');
    const mbtiTask = await taskManager.createTask('MBTI_ASSIGNMENT', {
      forceUpdate: false
    }, 'NORMAL');

    console.log(`   任务ID: ${mbtiTask.taskId}`);

    // 4. 示例：更新角色设定
    console.log('\n📝 示例3: 更新角色设定');
    const settingsTask = await taskManager.createTask('CHARACTER_SETTINGS', {
      updateFields: ['fullDescription', 'speakingStyle', 'scenario']
    }, 'NORMAL');

    console.log(`   任务ID: ${settingsTask.taskId}`);

    // 5. 示例：数据库升级
    console.log('\n🗄️  示例4: 数据库升级');
    const upgradeTask = await taskManager.createTask('DATABASE_UPGRADE', {
      migrationScript: `
        CREATE INDEX IF NOT EXISTS idx_character_mbti ON Character(mbtiType);
        CREATE INDEX IF NOT EXISTS idx_character_avatar_status ON Character(avatarStatus);
      `,
      backupBeforeUpgrade: true,
      validateAfterUpgrade: true
    }, 'LOW');

    console.log(`   任务ID: ${upgradeTask.taskId}`);

    // 6. 获取任务队列状态
    console.log('\n📋 当前任务队列状态:');
    const allTasks = taskManager.getAllTasks();
    allTasks.forEach(task => {
      console.log(`   - ${task.taskId}: ${task.type} (${task.status}) [${task.priority}]`);
    });

    // 7. 启动一个任务来演示
    console.log('\n🎬 启动MBTI分配任务进行演示...');
    await taskManager.startTask(mbtiTask.taskId);

    // 等待任务完成
    await new Promise((resolve) => {
      mbtiTask.on('completed', resolve);
      mbtiTask.on('failed', resolve);
    });

    console.log('\n✨ 示例演示完成！');

  } catch (error) {
    console.error('❌ 示例执行失败:', error.message);
  } finally {
    // 清理资源
    taskManager.cleanup();
  }
}

/**
 * WebSocket客户端示例
 */
function websocketClientExample() {
  console.log('\n🌐 WebSocket客户端示例');

  const ws = new WebSocket('ws://localhost:3002/ws');

  ws.on('open', () => {
    console.log('   ✅ WebSocket连接已建立');
  });

  ws.on('message', (data) => {
    try {
      const event = JSON.parse(data);
      console.log(`   📨 收到事件: ${event.type}`);
      console.log(`   📊 详情:`, event);
    } catch (error) {
      console.log(`   📨 收到原始消息: ${data}`);
    }
  });

  ws.on('error', (error) => {
    console.log('   ❌ WebSocket错误:', error.message);
  });

  ws.on('close', () => {
    console.log('   ⏹️  WebSocket连接已关闭');
  });

  // 10秒后关闭连接
  setTimeout(() => {
    ws.close();
  }, 10000);
}

/**
 * HTTP API 客户端示例
 */
async function httpApiExample() {
  console.log('\n🌍 HTTP API 客户端示例');

  const baseUrl = 'http://localhost:3002/api';

  try {
    // 获取所有任务
    console.log('   📋 获取所有任务...');
    const response = await fetch(`${baseUrl}/tasks`);
    const tasks = await response.json();
    console.log(`   📊 当前有 ${tasks.length} 个任务`);

    // 创建新任务
    console.log('   ➕ 创建新的头像生成任务...');
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CHARACTER_AVATAR',
        priority: 'HIGH',
        data: {
          characterIds: [1, 2, 3],
          batchSize: 2
        }
      })
    });

    const newTask = await createResponse.json();
    console.log(`   ✅ 任务已创建: ${newTask.taskId}`);

    // 使用快速接口
    console.log('   ⚡ 使用快速MBTI分配接口...');
    const quickResponse = await fetch(`${baseUrl}/quick/mbti-assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        forceUpdate: false
      })
    });

    const quickResult = await quickResponse.json();
    console.log(`   ✅ 快速任务已创建: ${quickResult.taskId}`);

  } catch (error) {
    console.log('   ❌ HTTP API 示例失败:', error.message);
  }
}

/**
 * 批量操作示例
 */
async function batchOperationExample() {
  console.log('\n🔄 批量操作示例');

  const taskManager = new TaskManager();

  try {
    // 创建多个相关任务
    const tasks = [];

    // 1. 首先进行数据库升级
    const upgradeTask = await taskManager.createTask('DATABASE_UPGRADE', {
      migrationScript: 'ALTER TABLE Character ADD COLUMN test_field TEXT;'
    }, 'URGENT');
    tasks.push(upgradeTask);

    // 2. 然后分配MBTI
    const mbtiTask = await taskManager.createTask('MBTI_ASSIGNMENT', {
      forceUpdate: false
    }, 'HIGH');
    tasks.push(mbtiTask);

    // 3. 更新设定
    const settingsTask = await taskManager.createTask('CHARACTER_SETTINGS', {
      updateFields: ['fullDescription', 'speakingStyle']
    }, 'NORMAL');
    tasks.push(settingsTask);

    // 4. 最后生成头像
    const avatarTask = await taskManager.createTask('CHARACTER_AVATAR', {
      batchSize: 5
    }, 'NORMAL');
    tasks.push(avatarTask);

    console.log(`   📊 已创建 ${tasks.length} 个相关任务`);

    // 按优先级启动任务
    console.log('   🚀 按优先级顺序启动任务...');
    for (const task of tasks) {
      console.log(`   ▶️  启动任务: ${task.type} (${task.priority})`);

      // 为每个任务添加事件监听
      task.on('completed', (event) => {
        console.log(`   ✅ ${task.type} 任务完成`);
      });

      task.on('failed', (event) => {
        console.log(`   ❌ ${task.type} 任务失败: ${event.error}`);
      });
    }

    console.log('   📈 批量操作已启动，任务将根据优先级和依赖关系执行');

  } catch (error) {
    console.log('   ❌ 批量操作示例失败:', error.message);
  } finally {
    taskManager.cleanup();
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 TavernAI Plus 后台更新系统使用示例

用法:
  node example-usage.js [选项]

选项:
  --basic          运行基本示例 (默认)
  --websocket      运行WebSocket客户端示例
  --http           运行HTTP API示例
  --batch          运行批量操作示例
  --all            运行所有示例
  --help, -h       显示此帮助信息

注意: 运行示例前请确保后台更新系统已启动:
  node start-updater.js
`);
    return;
  }

  if (args.includes('--websocket')) {
    websocketClientExample();
  } else if (args.includes('--http')) {
    await httpApiExample();
  } else if (args.includes('--batch')) {
    await batchOperationExample();
  } else if (args.includes('--all')) {
    await exampleUsage();
    websocketClientExample();
    setTimeout(async () => {
      await httpApiExample();
    }, 2000);
    setTimeout(async () => {
      await batchOperationExample();
    }, 4000);
  } else {
    // 默认运行基本示例
    await exampleUsage();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  exampleUsage,
  websocketClientExample,
  httpApiExample,
  batchOperationExample
};
