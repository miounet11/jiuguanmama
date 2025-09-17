# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

SillyTavern 是一个功能强大的 LLM 前端应用，专为高级用户设计，提供角色扮演、对话管理和多 AI 提供商集成。

## 开发命令

### 启动与运行
```bash
# 安装依赖
npm install

# 启动服务器 (默认端口 8000)
npm start

# 调试模式
npm run debug

# 全局访问模式（监听所有网络接口）
npm run start:global

# 桌面版 (Electron)
npm run start:electron

# 禁用 CSRF 保护（仅用于开发）
npm run start:no-csrf
```

### 代码质量
```bash
# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix
```

### 测试
```bash
# 进入测试目录并运行测试
cd tests && npm test
```

### 插件管理
```bash
# 更新插件
npm run plugins:update

# 安装插件
npm run plugins:install
```

## 核心架构

### 目录结构
- `src/` - 后端核心代码
  - `endpoints/` - API 端点（43个端点文件）
    - `backends/` - AI 提供商适配器（chat-completions.js 为统一接口）
  - `middleware/` - Express 中间件（认证、代理、缓存等）
  - `vectors/` - 向量数据库集成（支持8+提供商）
  - `electron/` - 桌面版包装器
- `public/` - 前端资源
  - `scripts/` - 核心 JavaScript 模块（60+模块）
    - `extensions/` - 内置扩展（14个扩展）
  - `lib/` - 第三方库依赖
- `default/` - 默认配置和预设
  - `config.yaml` - 主配置文件
  - `content/presets/` - AI 模型预设（40+预设）
- `plugins/` - 服务器端插件（CommonJS 模块）
- `data/` - 用户数据目录（运行时生成）

### 关键技术决策

1. **服务器入口**: `server.js` → `src/server-main.js`
2. **前端主控制器**: `public/script.js` (约2万行，管理60+模块)
3. **AI 提供商统一接口**: `src/endpoints/backends/chat-completions.js`
4. **密钥管理**: `src/endpoints/secrets.js` (支持60+服务商)
5. **配置系统**: YAML 格式，支持环境变量覆盖
6. **数据存储**: 基于文件系统，使用 node-persist
7. **扩展机制**: 前端使用 ES6 模块 + manifest.json，后端使用 CommonJS

### API 端点模式

所有 API 端点遵循 RESTful 设计：
- 路径模式: `/api/{resource}/{action}`
- 认证: 支持 Basic Auth 和 API Token
- 响应格式: JSON
- 错误处理: 统一错误响应格式

### 前端扩展开发

扩展位于 `public/scripts/extensions/`，每个扩展需要：
1. 主 JS 文件 (index.js)
2. manifest.json (元数据)
3. 可选的 HTML/CSS 资源

扩展生命周期：
- `init()` - 初始化
- `onEnable()` - 启用时
- `onDisable()` - 禁用时

### AI 提供商集成

新增 AI 提供商步骤：
1. 在 `src/endpoints/backends/` 创建适配器
2. 实现 chat-completions 接口
3. 在 `secrets.js` 注册密钥映射
4. 前端在 `public/scripts/` 添加对应处理

### 数据流

```
用户输入 → 前端 script.js → API 端点 → AI 提供商适配器 → 外部 AI API
                ↑                                    ↓
            响应渲染 ← 流式响应处理 ← Express 路由 ← API 响应
```

## 开发约定

### 文件命名
- 使用 kebab-case: `chat-completions.js`
- 扩展使用目录名: `extensions/tts/index.js`

### 代码风格
- ES6+ 语法，Node.js 18+ 特性
- 模块使用 ES6 import/export
- 异步操作使用 async/await

### 错误处理
- 使用 try-catch 包装异步操作
- 错误日志输出到 console.error
- API 返回标准错误响应

### 安全实践
- 密钥存储在 `secrets.json`（自动生成）
- 使用 write-file-atomic 确保数据一致性
- 输入验证使用 express-validator

## 常见开发任务

### 添加新 API 端点
1. 在 `src/endpoints/` 创建新文件
2. 导出 router 对象
3. 在 `src/server-main.js` 注册路由

### 修改前端界面
1. 核心逻辑在 `public/script.js`
2. UI 组件在 `public/scripts/` 各模块
3. 样式在 `public/css/`

### 调试技巧
- 使用 `npm run debug` 启用 Node.js 调试器
- 浏览器开发者工具查看前端日志
- 检查 `data/logs/` 目录的日志文件

## 部署注意事项

### 环境变量
- `SILLY_TAVERN_PORT` - 服务器端口
- `SILLY_TAVERN_DATA_ROOT` - 数据目录
- `SILLY_TAVERN_PUBLIC_URL` - 公开访问 URL

### Docker 部署
```bash
cd docker
docker-compose up -d
```

### 生产环境配置
1. 启用 HTTPS（使用反向代理）
2. 配置 Basic Auth 或 API Token
3. 限制 CORS 来源
4. 启用访问日志