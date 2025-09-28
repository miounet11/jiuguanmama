# TavernAI Plus 后台更新系统

一个强大的后台任务管理系统，用于处理角色数据的批量更新、头像生成、MBTI分配等任务。

## 🌟 特性

- **任务队列管理**: 支持优先级队列和并发控制
- **实时进度监控**: WebSocket 实时推送任务执行状态
- **数据库安全升级**: 自动备份和恢复机制
- **模块化架构**: 易于扩展的任务处理器系统
- **RESTful API**: 完整的任务管理接口
- **智能重试**: 失败任务自动重试机制

## 📦 安装和配置

### 前提条件

- Node.js >= 14.0.0
- SQLite 数据库 (dev.db)
- 已配置的 NewAPI 服务

### 快速启动

```bash
# 1. 进入后台更新系统目录
cd background-updater

# 2. 安装依赖 (如果需要)
npm install

# 3. 启动系统
node start-updater.js

# 或者使用自定义配置
node start-updater.js --port=3003 --host=0.0.0.0
```

### 配置选项

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `--port` | 服务器端口 | 3002 |
| `--host` | 服务器主机 | localhost |
| `--silent` | 静默模式 | false |

## 🚀 使用方法

### 1. RESTful API

#### 任务管理

```bash
# 获取所有任务
curl http://localhost:3002/api/tasks

# 创建新任务
curl -X POST http://localhost:3002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CHARACTER_AVATAR",
    "priority": "HIGH",
    "data": {
      "characterIds": [1, 2, 3],
      "batchSize": 3
    }
  }'

# 获取任务详情
curl http://localhost:3002/api/tasks/{taskId}

# 删除任务
curl -X DELETE http://localhost:3002/api/tasks/{taskId}
```

#### 快速操作接口

```bash
# 生成所有角色头像
curl -X POST http://localhost:3002/api/quick/character-avatars \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 3, "concurrency": 1}'

# 更新所有角色设定
curl -X POST http://localhost:3002/api/quick/character-settings \
  -H "Content-Type: application/json" \
  -d '{"updateFields": ["fullDescription", "speakingStyle"]}'

# 分配所有角色MBTI
curl -X POST http://localhost:3002/api/quick/mbti-assignment \
  -H "Content-Type: application/json" \
  -d '{"forceUpdate": false}'

# 数据库升级
curl -X POST http://localhost:3002/api/quick/database-upgrade \
  -H "Content-Type: application/json" \
  -d '{"migrationScript": "ALTER TABLE Character ADD COLUMN newField TEXT;"}'
```

### 2. WebSocket 实时监控

```javascript
const ws = new WebSocket('ws://localhost:3002/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('任务事件:', event);
  
  switch(event.type) {
    case 'task_started':
      console.log(`任务 ${event.taskId} 已开始`);
      break;
    case 'task_progress':
      console.log(`任务 ${event.taskId} 进度: ${event.progress}%`);
      break;
    case 'task_completed':
      console.log(`任务 ${event.taskId} 已完成`);
      break;
    case 'task_failed':
      console.log(`任务 ${event.taskId} 失败: ${event.error}`);
      break;
  }
});
```

### 3. 编程接口

```javascript
const TaskManager = require('./lib/TaskManager');

const taskManager = new TaskManager();

// 创建角色头像生成任务
const task = await taskManager.createTask('CHARACTER_AVATAR', {
  characterIds: [1, 2, 3, 4, 5],
  batchSize: 3,
  concurrency: 1
}, 'HIGH');

// 监听任务事件
task.on('progress', (event) => {
  console.log(`进度: ${event.progress}%`);
});

task.on('completed', (event) => {
  console.log('任务完成:', event.result);
});

// 启动任务
await taskManager.startTask(task.taskId);
```

## 📋 任务类型详解

### CHARACTER_AVATAR - 角色头像生成

生成角色的AI头像图片。

**参数:**
- `characterIds`: 角色ID数组 (可选，留空则处理所有缺少头像的角色)
- `batchSize`: 批处理大小 (默认: 3)
- `concurrency`: 并发数量 (默认: 1)

**示例:**
```json
{
  "type": "CHARACTER_AVATAR",
  "data": {
    "characterIds": [1, 2, 3],
    "batchSize": 3,
    "concurrency": 1
  }
}
```

### CHARACTER_SETTINGS - 角色设定更新

更新角色的详细设定信息。

**参数:**
- `characterIds`: 角色ID数组 (可选)
- `updateFields`: 要更新的字段 (默认: 所有字段)

**示例:**
```json
{
  "type": "CHARACTER_SETTINGS",
  "data": {
    "characterIds": [1, 2, 3],
    "updateFields": ["fullDescription", "speakingStyle", "scenario", "exampleDialogs"]
  }
}
```

### MBTI_ASSIGNMENT - MBTI类型分配

为角色分配MBTI人格类型。

**参数:**
- `characterIds`: 角色ID数组 (可选)
- `forceUpdate`: 是否强制更新已有MBTI (默认: false)

**示例:**
```json
{
  "type": "MBTI_ASSIGNMENT", 
  "data": {
    "characterIds": [1, 2, 3],
    "forceUpdate": false
  }
}
```

### DATABASE_UPGRADE - 数据库升级

执行数据库结构升级。

**参数:**
- `migrationScript`: 迁移脚本路径或SQL内容
- `backupBeforeUpgrade`: 升级前是否备份 (默认: true)
- `validateAfterUpgrade`: 升级后是否验证 (默认: true)

**示例:**
```json
{
  "type": "DATABASE_UPGRADE",
  "data": {
    "migrationScript": "ALTER TABLE Character ADD COLUMN newField TEXT;",
    "backupBeforeUpgrade": true,
    "validateAfterUpgrade": true
  }
}
```

## 🔧 系统架构

```
background-updater/
├── index.js                    # 主服务器文件
├── start-updater.js           # 启动脚本
├── lib/
│   ├── TaskManager.js         # 任务管理器
│   ├── BaseTask.js           # 任务基类
│   └── tasks/                # 具体任务实现
│       ├── CharacterAvatarTask.js
│       ├── CharacterSettingsTask.js
│       ├── MBTIAssignmentTask.js
│       └── DatabaseUpgradeTask.js
├── backups/                  # 数据库备份目录
├── tasks.db                  # 任务状态数据库
└── README.md                # 使用文档
```

### 核心组件

1. **TaskManager**: 核心任务管理器，处理任务队列、调度和状态管理
2. **BaseTask**: 所有任务的基类，提供统一的生命周期管理
3. **Task Classes**: 具体的任务实现，每种任务类型一个类
4. **REST API**: HTTP接口，用于创建和管理任务
5. **WebSocket**: 实时推送任务状态更新

## 📊 监控和日志

### 任务状态

| 状态 | 描述 |
|------|------|
| `PENDING` | 等待执行 |
| `RUNNING` | 正在执行 |
| `COMPLETED` | 执行完成 |
| `FAILED` | 执行失败 |
| `CANCELLED` | 已取消 |

### 优先级

| 优先级 | 数值 | 描述 |
|--------|------|------|
| `LOW` | 1 | 低优先级 |
| `NORMAL` | 2 | 普通优先级 |
| `HIGH` | 3 | 高优先级 |
| `URGENT` | 4 | 紧急优先级 |

### 日志示例

```
[2024-01-15 10:30:15] INFO: 任务管理器已启动
[2024-01-15 10:30:16] INFO: 服务器已启动，端口: 3002
[2024-01-15 10:31:20] INFO: 创建新任务: CHARACTER_AVATAR (ID: task_1705123456789)
[2024-01-15 10:31:21] INFO: 任务开始执行: task_1705123456789
[2024-01-15 10:31:25] INFO: 任务进度更新: task_1705123456789 - 25%
[2024-01-15 10:32:10] INFO: 任务完成: task_1705123456789
```

## 🛠️ 扩展和自定义

### 创建自定义任务

1. 继承 `BaseTask` 类:

```javascript
const BaseTask = require('../BaseTask');

class CustomTask extends BaseTask {
  async execute() {
    this.updateProgress(10, '开始自定义任务');
    
    // 执行你的逻辑
    const result = await this.doCustomWork();
    
    this.updateProgress(100, '自定义任务完成');
    return result;
  }
  
  async doCustomWork() {
    // 实现你的业务逻辑
  }
}

module.exports = CustomTask;
```

2. 在 `TaskManager.js` 中注册:

```javascript
const CustomTask = require('./tasks/CustomTask');

// 在 createTask 方法中添加
case 'CUSTOM':
  return new CustomTask(taskId, data);
```

### 配置自定义选项

修改 `start-updater.js` 添加新的命令行参数或环境变量支持。

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :3002
   
   # 使用不同端口启动
   node start-updater.js --port=3003
   ```

2. **数据库连接失败**
   - 检查 `dev.db` 文件是否存在
   - 确认数据库文件权限正确

3. **任务执行超时**
   - 检查网络连接
   - 验证 NewAPI 配置
   - 查看错误日志

4. **内存使用过高**
   - 减少批处理大小
   - 降低并发数量
   - 检查是否有内存泄漏

### 调试模式

```bash
# 启用详细日志
DEBUG=* node start-updater.js

# 或者只显示特定模块的日志
DEBUG=task-manager,base-task node start-updater.js
```

## 📝 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持角色头像生成、设定更新、MBTI分配
- 实现数据库升级功能
- WebSocket 实时监控
- RESTful API 完整实现

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个系统。

## 📄 许可证

MIT License

---

*这个后台更新系统是 TavernAI Plus 项目的重要组成部分，为角色数据的批量处理和系统维护提供了强大而灵活的解决方案。*