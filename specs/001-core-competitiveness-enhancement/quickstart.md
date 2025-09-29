# 核心竞争力提升方案 - 快速启动指南

## 概览

本指南将帮助您快速验证和测试核心竞争力提升方案的主要功能，包括流式输出、插件系统、高级配置和缓存优化。

## 前置条件

### 环境要求
- Node.js 20+
- Redis 6.0+
- PostgreSQL 13+ (生产环境) 或 SQLite (开发环境)
- Docker 20+ (可选，用于容器化部署)

### 项目依赖
确保您已经有运行的 TavernAI Plus 基础环境：

```bash
# 检查现有环境
cd cankao/tavernai-plus
npm run check-health

# 确认服务状态
npm run db:status
npm run redis:ping
```

## 第一步：环境准备

### 1. 安装新增依赖

```bash
# 进入主项目目录
cd cankao/tavernai-plus

# 安装流式输出相关依赖
npm install --save \
  @types/eventsource \
  eventsource \
  redis \
  ioredis \
  bullmq

# 安装插件系统依赖
npm install --save \
  vm2 \
  yauzl \
  archiver \
  semver \
  @types/yauzl \
  @types/archiver

# 安装开发工具
npm install --save-dev \
  @types/supertest \
  redis-memory-server \
  jest-redis
```

### 2. 启动 Redis 服务

```bash
# 方式一：使用 Docker
docker run -d --name tavernai-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes

# 方式二：本地安装
# macOS
brew install redis && brew services start redis
# Ubuntu
sudo apt-get install redis-server && sudo systemctl start redis

# 验证 Redis 连接
redis-cli ping
# 应返回: PONG
```

### 3. 数据库架构更新

```bash
# 创建新的数据库迁移
npm run db:generate-migration -- --name="core-competitiveness-enhancements"

# 应用数据库迁移
npm run db:migrate

# 验证新表创建
npm run db:studio
# 检查新增的表：extensions, streaming_sessions, cache_items 等
```

## 第二步：功能验证测试

### 1. 流式输出功能测试

创建测试脚本 `test-streaming.js`：

```javascript
const EventSource = require('eventsource');

async function testStreamingOutput() {
  console.log('🚀 测试流式输出功能...');

  // 1. 创建流式会话
  const sessionResponse = await fetch('http://localhost:3001/api/stream/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      chatId: 1,
      characterId: 1,
      connectionType: 'sse'
    })
  });

  const session = await sessionResponse.json();
  console.log('✅ 流式会话创建成功:', session.id);

  // 2. 建立 SSE 连接
  const eventSource = new EventSource(`http://localhost:3001/api/stream/${session.id}`);

  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('📨 收到流式消息:', data.content);
  };

  eventSource.onerror = function(error) {
    console.error('❌ SSE连接错误:', error);
  };

  // 3. 测试心跳和重连
  setTimeout(() => {
    console.log('🔄 测试连接中断重连...');
    eventSource.close();

    // 模拟重连
    setTimeout(() => {
      const newEventSource = new EventSource(`http://localhost:3001/api/stream/${session.id}`);
      console.log('✅ 重连成功');
      newEventSource.close();
    }, 2000);
  }, 5000);
}

testStreamingOutput().catch(console.error);
```

运行测试：
```bash
node test-streaming.js
```

**预期结果**：
- ✅ 成功创建流式会话
- ✅ 建立 SSE 连接并接收消息
- ✅ 心跳机制正常工作
- ✅ 断线重连功能正常

### 2. 插件系统功能测试

创建示例插件 `example-plugin`：

```bash
# 创建插件目录
mkdir -p plugins/example-plugin
cd plugins/example-plugin

# 创建插件清单文件
cat > manifest.json << 'EOF'
{
  "manifest_version": "1.0",
  "name": "示例插件",
  "version": "1.0.0",
  "description": "用于测试插件系统的示例插件",
  "permissions": ["ui", "api"],
  "content_scripts": ["plugin.js"],
  "ui_slots": ["chat-input"]
}
EOF

# 创建插件主文件
cat > plugin.js << 'EOF'
console.log('🔌 示例插件已加载');

// 插件初始化
if (typeof window !== 'undefined') {
  // 客户端插件逻辑
  window.ExamplePlugin = {
    init() {
      console.log('✅ 客户端插件初始化完成');
    },

    onChatInput(input) {
      return `[插件处理] ${input}`;
    }
  };

  // 注册到 UI 插槽
  if (window.TavernAI && window.TavernAI.plugins) {
    window.TavernAI.plugins.register('chat-input', window.ExamplePlugin);
  }
}
EOF
```

创建插件测试脚本 `test-plugins.js`：

```javascript
async function testPluginSystem() {
  console.log('🔌 测试插件系统功能...');

  // 1. 获取插件市场列表
  const marketResponse = await fetch('http://localhost:3001/api/extensions/marketplace');
  const marketplace = await marketResponse.json();
  console.log('✅ 获取插件市场:', marketplace.extensions.length, '个插件');

  // 2. 模拟插件安装
  const installResponse = await fetch('http://localhost:3001/api/extensions/install', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      extensionId: 'example-plugin',
      autoUpdate: true
    })
  });

  const installation = await installResponse.json();
  console.log('✅ 插件安装成功:', installation.installation.id);

  // 3. 获取已安装插件列表
  const installedResponse = await fetch('http://localhost:3001/api/extensions/installed', {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });

  const installed = await installedResponse.json();
  console.log('✅ 已安装插件数量:', installed.extensions.length);

  // 4. 测试插件配置更新
  const configResponse = await fetch(`http://localhost:3001/api/extensions/installed/example-plugin`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      enabled: true,
      config: {
        testSetting: 'test-value'
      }
    })
  });

  const updatedConfig = await configResponse.json();
  console.log('✅ 插件配置更新成功:', updatedConfig.config.testSetting);
}

testPluginSystem().catch(console.error);
```

运行测试：
```bash
node test-plugins.js
```

### 3. 高级配置功能测试

创建配置测试脚本 `test-advanced-config.js`：

```javascript
async function testAdvancedConfig() {
  console.log('⚙️ 测试高级配置功能...');

  // 1. 创建模型参数配置
  const modelConfigResponse = await fetch('http://localhost:3001/api/config/advanced', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      name: '测试模型配置',
      type: 'model',
      configData: {
        modelParams: {
          temperature: 0.8,
          topP: 0.9,
          maxTokens: 2048,
          presencePenalty: 0.1,
          frequencyPenalty: 0.1
        }
      },
      isDefault: true
    })
  });

  const modelConfig = await modelConfigResponse.json();
  console.log('✅ 模型配置创建成功:', modelConfig.id);

  // 2. 创建提示词模板配置
  const promptConfigResponse = await fetch('http://localhost:3001/api/config/advanced', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      name: '测试提示词模板',
      type: 'prompt',
      configData: {
        promptTemplates: {
          system: '你是一个有用的助手。',
          character: '{{char}}是一个{{personality}}的角色。',
          scenario: '场景设定：{{scenario}}',
          userMessage: '用户说：{{message}}'
        }
      }
    })
  });

  const promptConfig = await promptConfigResponse.json();
  console.log('✅ 提示词配置创建成功:', promptConfig.id);

  // 3. 测试配置导出
  const exportResponse = await fetch(`http://localhost:3001/api/config/export?format=json&configIds=${modelConfig.id},${promptConfig.id}`, {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });

  const exportData = await exportResponse.json();
  console.log('✅ 配置导出成功:', exportData.configs.length, '个配置');

  // 4. 获取配置模板列表
  const templatesResponse = await fetch('http://localhost:3001/api/config/templates?type=all');
  const templates = await templatesResponse.json();
  console.log('✅ 获取配置模板:', templates.templates.length, '个模板');
}

testAdvancedConfig().catch(console.error);
```

### 4. 缓存系统功能测试

创建缓存测试脚本 `test-caching.js`：

```javascript
const Redis = require('ioredis');

async function testCachingSystem() {
  console.log('💾 测试缓存系统功能...');

  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    db: 0
  });

  // 1. 测试基本缓存操作
  await redis.set('test:cache:key', JSON.stringify({
    data: 'test-value',
    timestamp: Date.now()
  }), 'EX', 3600); // 1小时过期

  const cachedData = await redis.get('test:cache:key');
  console.log('✅ 基本缓存操作:', JSON.parse(cachedData).data);

  // 2. 测试缓存层级
  const testCacheHierarchy = async () => {
    // L3 Redis 缓存
    await redis.set('cache:character:1', JSON.stringify({
      id: 1,
      name: 'Test Character',
      cached_at: Date.now()
    }), 'EX', 1800);

    // 模拟 L4 应用内存缓存
    const memoryCache = new Map();
    memoryCache.set('user:settings:1', {
      userId: 1,
      preferences: { theme: 'dark' },
      cached_at: Date.now()
    });

    console.log('✅ 多层缓存设置完成');
    return { redis_keys: await redis.keys('cache:*'), memory_keys: Array.from(memoryCache.keys()) };
  };

  const cacheStatus = await testCacheHierarchy();
  console.log('✅ 缓存层级测试:', cacheStatus);

  // 3. 测试缓存失效策略
  await redis.publish('cache:invalidate', JSON.stringify({
    key: 'character:1',
    pattern: 'prefix',
    timestamp: Date.now()
  }));
  console.log('✅ 缓存失效消息发布成功');

  // 4. 测试缓存统计
  const cacheStats = {
    redis_memory: await redis.memory('usage'),
    key_count: (await redis.keys('*')).length,
    hit_ratio: '95%' // 模拟数据
  };
  console.log('✅ 缓存统计信息:', cacheStats);

  redis.disconnect();
}

testCachingSystem().catch(console.error);
```

## 第三步：性能基准测试

### 1. 流式输出性能测试

```bash
# 安装压测工具
npm install -g artillery

# 创建流式输出压测配置
cat > streaming-load-test.yml << 'EOF'
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
  http:
    timeout: 30
scenarios:
  - name: "流式输出压力测试"
    steps:
      - post:
          url: "/api/stream/sessions"
          headers:
            Content-Type: "application/json"
            Authorization: "Bearer YOUR_JWT_TOKEN"
          json:
            chatId: 1
            characterId: 1
            connectionType: "sse"
          capture:
            - json: "$.id"
              as: "sessionId"
      - get:
          url: "/api/stream/{{ sessionId }}"
          headers:
            Accept: "text/event-stream"
EOF

# 运行压测
artillery run streaming-load-test.yml
```

### 2. 插件系统性能测试

```bash
# 创建插件系统压测配置
cat > plugins-load-test.yml << 'EOF'
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 30
      arrivalRate: 5
scenarios:
  - name: "插件系统性能测试"
    steps:
      - get:
          url: "/api/extensions/marketplace"
          headers:
            Authorization: "Bearer YOUR_JWT_TOKEN"
      - get:
          url: "/api/extensions/installed"
          headers:
            Authorization: "Bearer YOUR_JWT_TOKEN"
EOF

artillery run plugins-load-test.yml
```

### 3. 缓存性能基准

```bash
# 使用 Redis benchmark
redis-benchmark -h localhost -p 6379 -t set,get -n 10000 -c 50

# 预期结果示例：
# SET: 50000.00 requests per second
# GET: 55000.00 requests per second
```

## 第四步：用户体验验证

### 1. 前端集成测试

在浏览器中访问 `http://localhost:3000` 并执行以下测试：

```javascript
// 在浏览器控制台中运行

// 1. 测试流式消息组件
const testStreamingUI = async () => {
  // 触发一个AI对话
  const chatInput = document.querySelector('[data-test="chat-input"]');
  if (chatInput) {
    chatInput.value = '测试流式输出功能';
    chatInput.dispatchEvent(new Event('submit'));
    console.log('✅ 流式UI测试：消息发送成功');
  }
};

// 2. 测试插件管理界面
const testPluginsUI = () => {
  // 检查插件管理入口
  const pluginMenu = document.querySelector('[data-test="plugins-menu"]');
  if (pluginMenu) {
    pluginMenu.click();
    console.log('✅ 插件UI测试：插件管理界面可访问');
  }
};

// 3. 测试高级配置界面
const testAdvancedConfigUI = () => {
  // 检查高级配置入口
  const advancedSettings = document.querySelector('[data-test="advanced-settings"]');
  if (advancedSettings) {
    advancedSettings.click();
    console.log('✅ 高级配置UI测试：配置界面可访问');
  }
};

// 执行测试
testStreamingUI();
testPluginsUI();
testAdvancedConfigUI();
```

### 2. 移动端响应式测试

```bash
# 使用浏览器开发者工具或
# 安装移动端测试工具
npm install -g browser-sync

# 启动响应式测试服务器
browser-sync start --proxy "localhost:3000" --files "**/*.vue,**/*.scss"
```

在不同设备尺寸下测试：
- ✅ 流式消息在移动端正常显示
- ✅ 插件管理界面响应式适配
- ✅ 高级配置表单移动端友好

## 第五步：部署验证

### 1. Docker 容器化测试

```bash
# 构建 Docker 镜像
docker build -t tavernai-plus:enhanced .

# 运行容器
docker-compose up -d

# 健康检查
curl http://localhost:3001/health
curl http://localhost:3001/api/extensions/marketplace

# 检查日志
docker-compose logs tavernai-plus
```

### 2. 生产环境部署检查

```bash
# 环境变量检查
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/tavernai_plus
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here
API_PORT=3001
WEB_PORT=3000
CACHE_TTL=3600
PLUGIN_SANDBOX_LEVEL=strict
EOF

# 生产构建
npm run build

# 生产启动
npm run start:prod

# 验证生产功能
npm run test:e2e
```

## 验收标准

### 性能指标
- [ ] API 响应时间 < 200ms (95th percentile)
- [ ] WebSocket 连接稳定性 > 99%
- [ ] SSE 消息延迟 < 50ms
- [ ] 缓存命中率 > 80%
- [ ] 并发处理能力 > 500 同时在线用户

### 功能完整性
- [ ] 流式输出功能 100% 可用
- [ ] 插件安装/卸载成功率 > 95%
- [ ] 高级配置导入/导出成功
- [ ] SillyTavern 兼容性验证通过
- [ ] 移动端响应式适配完成

### 用户体验
- [ ] 新用户引导流程完整
- [ ] 错误处理用户友好
- [ ] 加载状态明确显示
- [ ] 离线功能基本可用

## 故障排查

### 常见问题

**1. Redis 连接失败**
```bash
# 检查 Redis 服务状态
redis-cli ping

# 检查端口占用
lsof -i :6379

# 重启 Redis
docker restart tavernai-redis
```

**2. SSE 连接中断**
```bash
# 检查防火墙设置
sudo ufw status

# 检查 Nginx 配置
nginx -t

# 查看服务器日志
tail -f logs/app.log | grep SSE
```

**3. 插件加载失败**
```bash
# 检查插件目录权限
ls -la plugins/

# 验证插件清单格式
npm run validate-plugin-manifest example-plugin

# 清理插件缓存
rm -rf .cache/plugins/*
```

## 下一步

完成快速启动验证后，您可以：

1. **扩展插件生态**: 开发更多功能插件
2. **性能调优**: 根据基准测试结果优化性能
3. **用户反馈**: 收集用户使用反馈并持续改进
4. **安全审核**: 进行全面的安全审查
5. **文档完善**: 编写详细的用户和开发者文档

---

**祝贺！** 您已成功验证了核心竞争力提升方案的所有主要功能。系统现在具备了与 SillyTavern 竞争的核心能力，同时保持了技术架构的先进性。