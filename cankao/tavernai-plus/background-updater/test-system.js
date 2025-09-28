#!/usr/bin/env node

/**
 * 后台更新系统测试脚本
 * 用于验证系统的各个组件是否正常工作
 */

const path = require('path');
const fs = require('fs');

function checkSystemHealth() {
  console.log('🔍 TavernAI Plus 后台更新系统健康检查\n');

  const checks = [
    {
      name: '检查必要文件',
      check: checkRequiredFiles
    },
    {
      name: '检查数据库连接',
      check: checkDatabaseConnection
    },
    {
      name: '检查任务类定义',
      check: checkTaskClasses
    },
    {
      name: '检查NewAPI配置',
      check: checkNewAPIConfig
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    process.stdout.write(`${check.name}... `);

    try {
      const result = check.check();
      if (result.success) {
        console.log('✅ 通过');
        if (result.message) {
          console.log(`   ${result.message}`);
        }
      } else {
        console.log('❌ 失败');
        console.log(`   ${result.error}`);
        allPassed = false;
      }
    } catch (error) {
      console.log('❌ 错误');
      console.log(`   ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 所有检查都通过了！系统运行状态良好。');
    console.log('\n可以使用以下命令启动系统:');
    console.log('node start-updater.js');
  } else {
    console.log('⚠️  系统检查发现问题，请修复后再启动。');
  }
}

function checkRequiredFiles() {
  const requiredFiles = [
    'index.js',
    'start-updater.js',
    'lib/TaskManager.js',
    'lib/BaseTask.js',
    'lib/tasks/CharacterAvatarTask.js',
    'lib/tasks/CharacterSettingsTask.js',
    'lib/tasks/MBTIAssignmentTask.js',
    'lib/tasks/DatabaseUpgradeTask.js'
  ];

  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    return {
      success: false,
      error: `缺少文件: ${missingFiles.join(', ')}`
    };
  }

  return {
    success: true,
    message: `${requiredFiles.length} 个必要文件都存在`
  };
}

function checkDatabaseConnection() {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, '../apps/api/prisma/dev.db');

    if (!fs.existsSync(dbPath)) {
      return {
        success: false,
        error: `数据库文件不存在: ${dbPath}`
      };
    }

    const db = new Database(dbPath);

    // 检查Character表是否存在
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='Character'
    `).all();

    db.close();

    if (tables.length === 0) {
      return {
        success: false,
        error: 'Character表不存在'
      };
    }

    return {
      success: true,
      message: '数据库连接正常，Character表存在'
    };

  } catch (error) {
    return {
      success: false,
      error: `数据库连接失败: ${error.message}`
    };
  }
}

function checkTaskClasses() {
  try {
    const BaseTask = require('./lib/BaseTask');
    const CharacterAvatarTask = require('./lib/tasks/CharacterAvatarTask');
    const CharacterSettingsTask = require('./lib/tasks/CharacterSettingsTask');
    const MBTIAssignmentTask = require('./lib/tasks/MBTIAssignmentTask');
    const DatabaseUpgradeTask = require('./lib/tasks/DatabaseUpgradeTask');

    // 检查是否正确继承了BaseTask
    const testData = { test: true };
    const avatarTask = new CharacterAvatarTask('test-1', testData);
    const settingsTask = new CharacterSettingsTask('test-2', testData);
    const mbtiTask = new MBTIAssignmentTask('test-3', testData);
    const upgradeTask = new DatabaseUpgradeTask('test-4', testData);

    const tasks = [avatarTask, settingsTask, mbtiTask, upgradeTask];

    for (const task of tasks) {
      if (!(task instanceof BaseTask)) {
        return {
          success: false,
          error: `任务类 ${task.constructor.name} 没有正确继承BaseTask`
        };
      }

      if (typeof task.execute !== 'function') {
        return {
          success: false,
          error: `任务类 ${task.constructor.name} 没有实现execute方法`
        };
      }
    }

    return {
      success: true,
      message: '所有任务类都正确定义并继承了BaseTask'
    };

  } catch (error) {
    return {
      success: false,
      error: `任务类加载失败: ${error.message}`
    };
  }
}

function checkNewAPIConfig() {
  try {
    const newApiPath = path.join(__dirname, '../apps/api/src/lib/newapi.js');

    if (!fs.existsSync(newApiPath)) {
      return {
        success: false,
        error: 'NewAPI模块文件不存在'
      };
    }

    // 尝试加载NewAPI模块
    const { NewAPI } = require(newApiPath);

    if (!NewAPI) {
      return {
        success: false,
        error: 'NewAPI类没有正确导出'
      };
    }

    return {
      success: true,
      message: 'NewAPI模块可以正常加载'
    };

  } catch (error) {
    return {
      success: false,
      error: `NewAPI配置检查失败: ${error.message}`
    };
  }
}

function runTaskManagerTest() {
  console.log('\n🧪 运行TaskManager简单测试\n');

  try {
    const TaskManager = require('./lib/TaskManager');

    // 创建任务管理器
    const taskManager = new TaskManager();
    console.log('✅ TaskManager实例创建成功');

    // 测试任务创建
    const task = taskManager.createTask('MBTI_ASSIGNMENT', {
      forceUpdate: false
    }, 'LOW');

    console.log(`✅ 测试任务创建成功: ${task.taskId}`);
    console.log(`   类型: ${task.type}`);
    console.log(`   优先级: ${task.priority}`);

    // 获取所有任务
    const allTasks = taskManager.getAllTasks();
    console.log(`✅ 获取任务列表成功，共 ${allTasks.length} 个任务`);

    // 清理
    taskManager.cleanup();
    console.log('✅ TaskManager测试完成');

    return true;

  } catch (error) {
    console.log(`❌ TaskManager测试失败: ${error.message}`);
    return false;
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 TavernAI Plus 后台更新系统测试工具

用法:
  node test-system.js [选项]

选项:
  --health-check   运行系统健康检查 (默认)
  --task-manager   测试TaskManager功能
  --all           运行所有测试
  --help, -h      显示此帮助信息
`);
    return;
  }

  if (args.includes('--task-manager')) {
    runTaskManagerTest();
  } else if (args.includes('--all')) {
    checkSystemHealth();
    runTaskManagerTest();
  } else {
    // 默认运行健康检查
    checkSystemHealth();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkSystemHealth,
  runTaskManagerTest
};
