# TavernAI Plus

🎭 下一代 AI 角色扮演平台 - 基于 SillyTavern 构建的现代化 AI 聊天应用

## 🚀 项目概述

TavernAI Plus 是一个功能强大的 AI 角色扮演平台，旨在提供沉浸式的 AI 对话体验。项目基于 SillyTavern 的强大底层，采用现代化的技术栈重构，提供了更好的用户体验和更丰富的功能。

### ✨ 核心特性

- 🤖 **多模型支持** - 集成 OpenAI、Anthropic、Google、DeepSeek 等主流 AI 模型
- 🎨 **角色创作** - AI 辅助角色生成，支持自定义属性和形象
- 💬 **沉浸式对话** - 流式输出、多角色互动、世界观设定
- 🌙 **深色主题** - 神秘酒馆风格的 UI 设计，支持主题切换
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔐 **安全认证** - JWT 认证、OAuth 登录、数据加密

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3.4 + TypeScript 5.3
- **构建工具**: Vite 5.0
- **UI 框架**: Element Plus 2.4
- **状态管理**: Pinia 2.1
- **样式**: SCSS + Tailwind CSS
- **HTTP 客户端**: Axios
- **WebSocket**: Socket.io-client

### 后端
- **运行时**: Node.js 18+
- **框架**: Express 4.18
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Passport
- **实时通信**: Socket.io

## 📦 项目结构

```
tavernai-plus/
├── apps/
│   ├── web/                 # Vue 3 前端应用
│   │   ├── src/
│   │   │   ├── views/       # 页面组件
│   │   │   ├── components/  # 通用组件
│   │   │   ├── stores/      # Pinia 状态管理
│   │   │   ├── services/    # API 服务
│   │   │   └── styles/      # 样式文件
│   │   └── package.json
│   │
│   └── api/                 # Express 后端服务
│       ├── src/
│       │   ├── routes/      # API 路由
│       │   ├── controllers/ # 控制器
│       │   ├── services/    # 业务逻辑
│       │   ├── middleware/  # 中间件
│       │   └── models/      # 数据模型
│       └── package.json
│
├── packages/                # 共享包
│   ├── shared/             # 共享类型和工具
│   ├── ui/                 # UI 组件库
│   └── database/           # 数据库配置
│
└── package.json            # Monorepo 根配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Redis >= 6.0

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/tavernai-plus.git
cd tavernai-plus
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp apps/api/.env.example apps/api/.env
# 编辑 .env 文件，填入你的配置
```

4. **初始化数据库**
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

5. **启动开发服务器**
```bash
# 在项目根目录运行
npm run dev
```

访问:
- 前端: http://localhost:3000
- 后端 API: http://localhost:5000
- API 文档: http://localhost:5000/api-docs

## 🎯 功能特性

### 用户系统
- ✅ 邮箱注册/登录
- ✅ OAuth 登录 (Google、Discord)
- ✅ JWT 认证
- ✅ 个人资料管理
- ⏳ 订阅系统
- ⏳ 虚拟货币系统

### 角色系统
- ⏳ 角色创建/编辑
- ⏳ AI 辅助生成
- ⏳ 角色市场
- ⏳ 角色收藏
- ⏳ 评分系统

### 聊天功能
- ⏳ 实时对话
- ⏳ 多角色群聊
- ⏳ 流式输出
- ⏳ 上下文管理
- ⏳ 消息编辑/重新生成

### AI 集成
- ⏳ OpenAI GPT-4
- ⏳ Anthropic Claude
- ⏳ Google Gemini
- ⏳ DeepSeek
- ⏳ 本地模型支持

## 📝 开发进度

### 第一阶段：基础架构 ✅
- [x] 项目初始化
- [x] Monorepo 配置
- [x] 前端框架搭建
- [x] 后端框架搭建
- [x] 数据库设计

### 第二阶段：用户认证 ✅
- [x] 登录/注册页面
- [x] JWT 认证流程
- [x] API 服务层
- [x] 用户状态管理

### 第三阶段：核心功能 🚧
- [ ] 角色管理系统
- [ ] 聊天界面
- [ ] AI 模型集成
- [ ] 实时消息推送

### 第四阶段：高级功能 📅
- [ ] 角色市场
- [ ] 订阅系统
- [ ] 支付集成
- [ ] 移动端适配

## 🤝 贡献指南

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 了解详情。

## 🙏 致谢

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 提供核心灵感和基础架构
- [Vue.js](https://vuejs.org/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- 所有贡献者和支持者

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/yourusername/tavernai-plus/issues)
- Email: contact@tavernai.com
- Discord: [加入社区](https://discord.gg/tavernai)

---

**TavernAI Plus** - 由心构建的 AI 角色扮演平台 🎭