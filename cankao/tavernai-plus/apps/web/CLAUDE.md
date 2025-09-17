# Web 前端模块

[根目录](../../CLAUDE.md) > **web**

## 变更记录 (Changelog)

### [2025-09-17 20:25:02] - 深度补捞与现代化架构完善
- 发现并记录高级WebSocket集成：useWebSocket组合式函数（自动重连、聊天室功能）
- 新增stores状态管理：character.ts（完整CRUD+收藏）、chat.ts（会话+WebSocket通信）
- 完善composables系统：Vue 3组合式函数架构
- 新增环境配置：.env.development（API端点配置）
- 识别UI组件系统：ErrorBoundary、LoadingOverlay、Pagination等通用组件
- 发现聊天室功能：ChatSession组合、多用户WebSocket通信
- 新增工作流组件：workflow/ 目录业务流程组件

### [2025-09-17 19:54:33] - Web前端架构文档初始化
- 完整梳理Vue 3 + TypeScript + Element Plus架构
- 记录组件系统、路由结构和状态管理
- 整理UI/UX设计规范和开发工作流
- 建立测试策略和部署指南

---

## 模块职责

TavernAI Plus Web前端是基于Vue 3和TypeScript的现代化单页应用(SPA)，负责提供用户友好的AI角色扮演对话界面。主要职责包括：

- **用户界面渲染**: 响应式界面、组件化设计、主题切换
- **用户交互管理**: 表单处理、实时通信、拖拽操作
- **状态管理**: Pinia状态树、本地存储、会话管理
- **路由导航**: Vue Router单页路由、权限守卫、懒加载
- **API集成**: HTTP客户端、错误处理、请求拦截
- **实时通信**: Socket.IO WebSocket、消息推送、在线状态
- **性能优化**: 组件懒加载、虚拟滚动、缓存策略

## 入口与启动

### 主入口文件
- **`src/main.ts`**: Vue应用入口，插件注册和全局配置
- **`src/App.vue`**: 根组件，主题初始化和会话恢复
- **`index.html`**: HTML模板文件
- **`vite.config.ts`**: Vite构建配置

### 启动脚本
```bash
# 开发环境
npm run dev           # 启动Vite开发服务器 (端口3000)

# 生产构建
npm run build         # 构建生产版本到dist目录
npm run preview       # 预览生产构建

# 代码质量
npm run lint          # ESLint代码检查
npm run test          # Vitest单元测试
```

### 环境变量配置
```env
# 开发环境 (.env.development)
VITE_API_URL=http://localhost:3007

# 生产环境 (.env.production)
VITE_API_URL=https://api.tavernai.plus
VITE_WS_URL=wss://api.tavernai.plus
VITE_APP_TITLE=TavernAI Plus
```

## 对外接口

### 路由结构

#### 公开页面 (无需认证)
- `/` - 首页，产品介绍和热门角色展示
- `/characters` - 角色列表，浏览所有公开角色
- `/characters/:id` - 角色详情页
- `/login` - 用户登录
- `/register` - 用户注册

#### 认证页面 (需要登录)
- `/chat` - 对话中心，管理所有聊天会话
- `/chat/:sessionId` - 具体聊天会话界面
- `/studio` - 创作工坊，角色创建和管理
- `/studio/character/create` - 创建新角色
- `/studio/character/edit/:id` - 编辑角色
- `/profile` - 个人资料页面
- `/profile/settings` - 账户设置
- `/subscription` - 订阅管理

#### 管理页面 (管理员权限)
- `/admin/logs` - 系统日志管理

#### 新增页面
- `/chatroom/:roomId` - 多人聊天室
- `/characters/new` - 新版角色列表
- `/home` - 主页面
- `/404` - 页面未找到

### 组件API

#### 核心组件
- **CharacterCard**: 角色卡片展示组件
- **CharacterCreateDialog**: 角色创建对话框
- **ChatMessage**: 聊天消息渲染组件
- **MessageInput**: 消息输入框组件
- **CharacterEditor**: 角色编辑器组件

#### 公共组件
- **PageHeader**: 页面头部组件
- **ErrorBoundary**: 错误边界组件（Vue 3）
- **LoadingOverlay**: 全屏加载覆盖层
- **Pagination**: 分页组件

#### 聊天相关组件
- **ChatSession**: 聊天会话组件
- **ChatPage**: 聊天页面主组件
- **聊天室组件**: 多用户聊天功能

#### 工作流组件
- **Workflow组件集**: 复杂业务流程组件

### 服务API

#### HTTP API服务
```typescript
// 认证服务
authService.login(credentials)
authService.register(userData)
authService.logout()

// 角色服务
characterService.getCharacters(params)
characterService.getCharacterById(id)
characterService.createCharacter(data)

// 聊天服务
chatService.getChatSessions()
chatService.sendMessage(sessionId, message)
```

#### WebSocket服务
```typescript
// WebSocket连接管理
useWebSocket().connect()
useWebSocket().disconnect()
useWebSocket().on('message', handler)
useWebSocket().emit('join_room', roomId)

// 聊天室WebSocket功能
useChatRoomWebSocket().joinRoom(roomId)
useChatRoomWebSocket().sendMessage(roomId, content)
useChatRoomWebSocket().summonCharacter(roomId, characterId)
```

## 关键依赖与配置

### 核心依赖
```json
{
  "dependencies": {
    "vue": "^3.4.15",
    "typescript": "^5.3.3",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "element-plus": "^2.4.4",
    "@element-plus/icons-vue": "^2.3.1",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### 开发依赖
```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.3",
    "@vue/compiler-sfc": "^3.4.15",
    "vite": "^6.0.0",
    "vitest": "^1.1.1",
    "vue-tsc": "^2.0.29",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.19.2",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0"
  }
}
```

### 状态管理 (Pinia)

#### 用户状态管理 (`stores/user.ts`)
- 用户信息、认证状态、权限管理
- 登录/登出、会话恢复、个人资料更新

#### 主题状态管理 (`stores/theme.ts`)
- 主题切换、暗色模式、自定义样式

#### 角色状态管理 (`stores/character.ts`)
- 角色列表缓存、CRUD操作
- 分页、搜索、排序功能
- 收藏状态切换
- 错误处理和加载状态

#### 聊天状态管理 (`stores/chat.ts`)
- 聊天会话管理、消息缓存
- WebSocket连接管理
- 流式消息处理
- 消息编辑和重新生成

#### 聊天室状态管理 (`stores/chatroom.ts`)
- 多人聊天室功能
- 实时用户状态
- 角色召唤功能

### 组合式函数 (Composables)

#### WebSocket组合函数 (`composables/useWebSocket.ts`)
- 全局WebSocket连接管理
- 自动重连机制（指数退避算法）
- 认证状态监听
- 事件监听器管理
- 聊天室专用功能封装

### 样式系统
- **Tailwind CSS**: 原子化CSS框架
- **Element Plus**: Vue 3组件库
- **SCSS**: 自定义样式预处理器
- **主题变量**: `styles/variables.scss`、`styles/mixins.scss`

### 路由配置
```typescript
// 路由守卫
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next('/login')
  }
  next()
})

// 懒加载
const routes = [
  {
    path: '/characters',
    component: () => import('@/views/characters/CharacterList.vue')
  }
]
```

## 数据模型

### 用户模型 (User Interface)
```typescript
interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  credits: number
  subscriptionTier: 'free' | 'plus' | 'pro'
  subscriptionExpiresAt?: Date
  createdAt: Date
}
```

### 角色模型 (Character Interface)
```typescript
interface Character {
  id: string
  name: string
  description: string
  personality?: string
  backstory?: string
  avatar?: string
  tags: string[]
  rating: number
  chatCount: number
  favoriteCount: number
  isFavorited?: boolean
  isPublic: boolean
  creator: {
    id: string
    username: string
    avatar?: string
  }
  createdAt: Date
}
```

### 消息模型 (Message Interface)
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  characterId?: string
  characterName?: string
  characterAvatar?: string
  timestamp: string
  isStreaming?: boolean
  isError?: boolean
  metadata?: Record<string, any>
}
```

### 聊天会话模型 (ChatSession Interface)
```typescript
interface ChatSession {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  userId: string
  messages: Message[]
  title?: string
  summary?: string
  createdAt: string
  updatedAt: string
  settings?: ChatSettings
}

interface ChatSettings {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}
```

## 测试与质量

### 测试框架
- **Vitest**: Vue 3专用的单元测试框架
- **Vue Test Utils**: Vue组件测试工具
- **@testing-library/vue**: React Testing Library的Vue版本
- **MSW**: Mock Service Worker API模拟

### 测试结构
```
src/__tests__/
├── components/
│   ├── CharacterCard.test.ts
│   ├── ChatMessage.test.ts
│   └── MessageInput.test.ts
├── stores/
│   ├── user.test.ts
│   └── character.test.ts
├── services/
│   └── api.test.ts
└── utils/
    └── helpers.test.ts
```

### 代码质量工具
- **ESLint**: JavaScript/TypeScript代码规范
- **Vue Official ESLint Plugin**: Vue专用规则
- **Prettier**: 代码格式化
- **TypeScript**: 静态类型检查
- **Vue TSC**: Vue模板类型检查

### 测试命令
```bash
npm run test              # 运行所有单元测试
npm run test:ui           # 启动Vitest UI界面
npm run test:coverage     # 生成测试覆盖率报告
npm run type-check        # TypeScript类型检查
```

## 常见问题 (FAQ)

### Q: 如何添加新的路由页面？
A: 在 `src/views/` 下创建Vue组件，然后在 `src/router/index.ts` 中添加路由配置。

### Q: 如何创建可复用的组件？
A: 在 `src/components/` 目录下按功能模块分类创建，使用 `<script setup lang="ts">` 语法和TypeScript接口定义Props。

### Q: 如何处理API错误？
A: 在 `src/services/api.ts` 的响应拦截器中统一处理，使用Element Plus的ElMessage显示错误信息。

### Q: 如何实现主题切换？
A: 通过 `stores/theme.ts` 状态管理，结合Tailwind CSS的暗色模式类和CSS变量实现。

### Q: 如何优化大列表渲染性能？
A: 使用虚拟滚动库如 `vue-virtual-scroll-list`，或实现分页加载和无限滚动。

### Q: WebSocket连接断开如何处理？
A: 在 `composables/useWebSocket.ts` 中实现自动重连逻辑，包含指数退避和最大重试次数（5次）。

### Q: 如何使用聊天室功能？
A: 使用 `useChatRoomWebSocket()` 组合函数，可以加入房间、发送消息、召唤角色等。

### Q: 如何管理复杂的业务状态？
A: 使用Pinia状态管理，每个功能模块独立的store，配合组合式函数实现业务逻辑复用。

## 相关文件清单

### 核心配置文件
- `src/main.ts` - Vue应用入口
- `src/App.vue` - 根组件
- `vite.config.ts` - Vite构建配置
- `package.json` - 依赖和脚本
- `tsconfig.json` - TypeScript配置
- `tsconfig.node.json` - Node.js TypeScript配置
- `tailwind.config.js` - Tailwind CSS配置
- `postcss.config.js` - PostCSS配置

### 路由和导航
- `src/router/index.ts` - Vue Router配置
- `src/views/` - 页面组件目录

### 状态管理
- `src/stores/user.ts` - 用户状态
- `src/stores/theme.ts` - 主题状态
- `src/stores/character.ts` - 角色状态管理（完整CRUD）
- `src/stores/chat.ts` - 聊天状态管理（WebSocket集成）
- `src/stores/chatroom.ts` - 聊天室状态

### 组合式函数
- `src/composables/useWebSocket.ts` - WebSocket连接管理

### 服务层
- `src/services/api.ts` - HTTP API客户端
- `src/services/auth.ts` - 认证服务
- `src/services/character.ts` - 角色服务
- `src/services/chat.ts` - 聊天服务
- `src/services/marketplace.ts` - 市场服务

### 组件系统
- `src/components/common/` - 公共组件（PageHeader、ErrorBoundary、LoadingOverlay、Pagination）
- `src/components/character/` - 角色相关组件（CharacterCard、CharacterCreateDialog）
- `src/components/chat/` - 聊天相关组件
- `src/components/workflow/` - 工作流程组件

### 类型定义
- `src/types/character.ts` - 角色类型定义
- `src/types/chat.ts` - 聊天类型定义
- `src/components.d.ts` - 自动生成的组件类型

### 工具和样式
- `src/utils/` - 工具函数
- `src/styles/variables.scss` - SCSS变量
- `src/styles/mixins.scss` - SCSS混入
- `src/styles/main.scss` - 主样式文件
- `src/styles/fix-layout.css` - 布局修复样式

### 页面组件
- `src/views/HomePage.vue` - 主页
- `src/views/NotFound.vue` - 404页面
- `src/views/characters/` - 角色页面（CharacterDetail、CharacterList、CharacterListNew）
- `src/views/chat/` - 聊天页面（ChatPage、ChatSession）
- `src/views/chatroom/` - 聊天室页面
- `src/views/studio/` - 创作工坊（StudioPage、CreateCharacter、EditCharacter）
- `src/views/profile/` - 个人中心（ProfilePage、SettingsPage）
- `src/views/subscription/` - 订阅页面（SubscriptionPage）
- `src/views/auth/` - 认证页面（LoginPage、RegisterPage）
- `src/views/admin/` - 管理后台（LogsPage）

### 环境配置
- `.env.development` - 开发环境配置

### 测试和调试
- `test.html` - 测试页面
- `public/debug.html` - 调试页面
- `public/test-vue.html` - Vue测试页面

---

*本文档涵盖Web前端的核心架构和开发指导。如需了解后端API，请查看 [API后端文档](../api/CLAUDE.md)。*