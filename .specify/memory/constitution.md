<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: 0.0.0 → 1.0.0
Ratification Date: 2025-09-30
Last Amendment: 2025-09-30

Modified Principles: N/A (Initial version)
Added Sections: All sections (initial constitution)
Removed Sections: None

Templates Requiring Updates:
  - .specify/templates/plan-template.md: ⚠ Pending (needs creation)
  - .specify/templates/spec-template.md: ⚠ Pending (needs creation)
  - .specify/templates/tasks-template.md: ⚠ Pending (needs creation)

Follow-up TODOs:
  - Create CCPM workflow templates aligned with constitution principles
  - Establish GitHub repository for issue tracking
  - Set up CI/CD pipeline for automated quality checks
  - Configure security scanning tools (Snyk, OWASP)
=============================================================================
-->

# 时空酒馆 (TavernAI Plus) 项目宪章
## Project Constitution v1.0.0

**项目名称**: 时空酒馆 (TavernAI Plus)
**宪章版本**: 1.0.0
**批准日期**: 2025-09-30
**最后修订**: 2025-09-30
**适用范围**: 全项目（前端、后端、数据库、文档）

---

## 目录

1. [项目使命与愿景](#1-项目使命与愿景)
2. [核心价值观](#2-核心价值观)
3. [技术原则](#3-技术原则)
4. [开发纪律](#4-开发纪律)
5. [架构决策](#5-架构决策)
6. [质量标准](#6-质量标准)
7. [安全准则](#7-安全准则)
8. [协作规范](#8-协作规范)
9. [宪章治理](#9-宪章治理)

---

## 1. 项目使命与愿景

### 1.1 项目使命

构建下一代 AI 角色扮演平台，通过**时空交汇**的创新理念，让不同时代、不同文化、不同性格的 AI 角色跨越时空壁垒，创造独特的多元宇宙对话体验。我们致力于打造一个生产级、可扩展、沉浸式的 AI 社交生态系统。

### 1.2 核心愿景

**时空酒馆**不仅是 AI 聊天工具，更是：
- **时空交汇的实验场**: 探索不同时代观念的碰撞与融合
- **文化交流的桥梁**: 连接古今中外的智慧与价值观
- **人格探索的镜子**: 通过 MBTI 系统理解自我与他人
- **关系构建的乐园**: 创造和体验丰富的人际关系网络

### 1.3 成功度量标准

- **技术卓越**: 代码质量 ≥8.5/10，测试覆盖率 ≥80%
- **性能优越**: API 响应时间 <200ms (P95)，首屏加载 <1.5s
- **安全可靠**: 零重大安全漏洞，系统可用性 ≥99.5%
- **用户满意**: 用户留存率 ≥60%，NPS 评分 ≥40
- **业务增长**: 月活跃用户增长率 ≥20%

---

## 2. 核心价值观

### 价值观 1: 生产就绪至上 (Production-Ready First)

**原则**: 每一行代码都以生产环境标准编写，不允许临时方案、模拟数据或快速捷径。

**理由**: 临时方案会累积技术债务，导致重构成本指数级增长。从一开始就按生产标准开发，确保项目随时可以上线部署。

**实施标准**:
- ❌ **禁止**: 使用模拟数据 (mock data)、假数据、占位符数据
- ❌ **禁止**: 硬编码配置、跳过错误处理、忽略 TypeScript 错误
- ✅ **必须**: 所有功能基于真实数据库、完整错误处理、类型安全
- ✅ **必须**: 每次提交代码前运行 `npm run lint` 和 `npm run build`

**违反后果**: 代码审查不通过，必须重构后才能合并

### 价值观 2: 类型安全是基石 (Type Safety is Foundation)

**原则**: TypeScript 严格模式是项目的安全网，类型错误必须在编译时捕获，不允许运行时类型错误。

**理由**: 类型系统可减少 60% 的运行时错误，提升代码可维护性和重构安全性。强类型约束是大型项目的生存必需品。

**实施标准**:
- ✅ **必须**: 启用 `strict: true` TypeScript 严格模式
- ✅ **必须**: 所有函数参数和返回值显式类型声明
- ✅ **必须**: 使用 Zod 进行运行时验证 (API 请求、环境变量)
- ❌ **禁止**: 使用 `any` 类型 (除非有明确文档说明且经过审查)
- ❌ **禁止**: 使用 `@ts-ignore` 跳过类型检查 (除非有 Issue 记录)

**违反后果**: 提交前 CI 检查失败，PR 自动拒绝

### 价值观 3: 问题必须文档化 (Every Problem Must Be Documented)

**原则**: 每次遇到问题、解决问题、做出技术决策，都必须记录在项目文档中，防止重复错误和知识流失。

**理由**: 项目长期维护依赖于知识传承。没有文档的问题解决方案会在 3 个月后被遗忘，导致相同错误重复发生。

**实施标准**:
- ✅ **必须**: 每次解决问题后更新 `问题解决文档.md`
- ✅ **必须**: 重要架构决策记录在 `CLAUDE.md` 或专门的 ADR 文件
- ✅ **必须**: API 变更记录在 `API_ENDPOINTS.md` 和 CHANGELOG
- ✅ **必须**: 代码中的复杂逻辑添加注释解释 "为什么" (不只是 "做什么")

**文档模板**:
```markdown
## [日期] - [问题简述]
**问题描述**: 具体现象和错误信息
**根本原因**: 技术分析和根因定位
**解决方案**: 具体修复步骤和代码变更
**影响范围**: 受影响的文件和模块
**预防措施**: 如何避免类似问题再次发生
```

**违反后果**: PR 审查时要求补充文档，否则不予合并

### 价值观 4: 性能是功能特性 (Performance is a Feature)

**原则**: 性能不是可选的优化项，而是核心功能特性。每个功能在设计阶段就必须考虑性能影响。

**理由**: 性能差的产品无法吸引和留存用户。在大规模使用后才优化性能，成本是早期设计的 10 倍以上。

**实施标准**:
- ✅ **必须**: 数据库查询必须有索引支持 (使用 `EXPLAIN ANALYZE` 验证)
- ✅ **必须**: API 响应时间目标 <200ms (P95)，否则需实施缓存
- ✅ **必须**: 前端首屏加载时间 <1.5s，Bundle 大小 <500KB (gzip)
- ✅ **必须**: 列表页面支持分页/虚拟滚动 (>100 项数据)
- ✅ **必须**: 图片使用懒加载和 WebP 格式

**性能监控**:
- Lighthouse 性能评分 ≥90
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- 后端 APM 监控 (响应时间、吞吐量、错误率)

**违反后果**: 性能测试不通过，功能不允许发布

### 价值观 5: 安全是不可妥协的 (Security is Non-Negotiable)

**原则**: 安全漏洞是最严重的 Bug。任何安全问题都必须以最高优先级处理，不允许 "先上线后修复"。

**理由**: 一次安全事故可能导致整个项目失败。数据泄露、用户信任丧失的代价远超开发延期的成本。

**实施标准**:
- ✅ **必须**: API 密钥通过环境变量管理，严禁硬编码
- ✅ **必须**: 所有用户输入进行验证和清理 (防止 SQL 注入、XSS)
- ✅ **必须**: 生产环境使用强随机 JWT Secret (至少 256 位)
- ✅ **必须**: 实施 HTTPS、CORS、Helmet、Rate Limiting 安全栈
- ✅ **必须**: 敏感数据加密存储 (密码 bcrypt、Token AES-256)

**安全检查清单**:
- [ ] 输入验证 (Zod schema)
- [ ] 输出转义 (防止 XSS)
- [ ] 认证授权 (JWT + 权限中间件)
- [ ] 密钥管理 (环境变量 + Vault)
- [ ] 依赖扫描 (npm audit)
- [ ] OWASP Top 10 合规

**违反后果**: 安全问题立即修复，相关功能下线直到修复完成

---

## 3. 技术原则

### 原则 1: Monorepo 架构标准 (Monorepo Architecture Standard)

**决策**: 采用 Turbo + npm workspaces 的 Monorepo 架构，实现代码共享和统一构建。

**技术栈**:
```yaml
架构: Monorepo (Turbo 1.11+)
前端: Vue 3.5 + TypeScript 5.3 + Vite 5.4 + Element Plus 2.4
后端: Node.js 18+ + Express 4.18 + TypeScript 5.3 + Prisma 5.7
数据库: SQLite (开发) + PostgreSQL 14+ (生产)
实时通信: Socket.IO 4.6 + Redis 5.3
缓存: Node-Cache 5.1 + Redis Cluster
监控: Winston 3.17 (日志) + Prometheus + Grafana
```

**目录结构标准**:
```
tavernai-plus/
├── apps/
│   ├── api/              # Express 后端 (独立部署单元)
│   └── web/              # Vue 前端 (独立部署单元)
├── packages/             # 共享包 (types, utils, config)
├── turbo.json            # Turbo 构建配置
└── package.json          # npm workspaces 根配置
```

**理由**: Monorepo 提供代码共享、依赖统一、构建缓存优势，但需严格遵守模块边界，避免循环依赖。

**强制规则**:
- ✅ 共享类型定义必须放在 `packages/shared/types`
- ✅ 前后端不允许直接导入对方代码 (通过 API 通信)
- ✅ 每个 workspace 必须有独立的 `package.json` 和 `tsconfig.json`
- ❌ 禁止使用相对路径跨 workspace 导入 (如 `../../apps/api/src`)

### 原则 2: 分层架构设计 (Layered Architecture)

**决策**: 后端采用经典四层架构，前端采用 MVVM 架构 + Composition API。

**后端分层**:
```
Routes Layer (路由层)
  ↓ HTTP 请求解析
Middleware Layer (中间件层)
  ↓ 认证、验证、日志
Controllers Layer (控制器层) - 计划实施
  ↓ 请求处理、响应封装
Services Layer (服务层) - 核心业务逻辑
  ↓ 业务规则、事务管理
Data Access Layer (数据访问层)
  ↓ Prisma ORM
Database Layer (数据库层)
```

**前端架构**:
```
View Layer (视图层)
  ↓ Vue 组件
ViewModel Layer (视图模型层)
  ↓ Pinia Store + Composables
Model Layer (模型层)
  ↓ TypeScript 类型 + API Service
```

**理由**: 分层架构提供清晰的职责划分，便于测试、维护和团队协作。每层只依赖下层，不允许跨层调用。

**强制规则**:
- ✅ Routes 层只负责路由注册，业务逻辑放在 Services 层
- ✅ Services 层不允许直接访问 HTTP 请求对象 (通过参数传递)
- ✅ Prisma 调用只能在 Services 层，不允许在 Routes 层直接查询数据库
- ❌ 禁止在 Vue 组件中直接调用 Prisma (必须通过 API Service)

### 原则 3: 类型驱动开发 (Type-Driven Development)

**决策**: 类型优先设计，先定义类型接口，再实现业务逻辑。

**类型定义流程**:
```typescript
// 1. 定义数据库模型 (Prisma Schema)
model Character {
  id        String   @id @default(cuid())
  name      String
  mbtiType  String?
  createdAt DateTime @default(now())
}

// 2. 生成 TypeScript 类型
// Prisma 自动生成 Character 类型

// 3. 定义 API 请求/响应类型
export interface CreateCharacterRequest {
  name: string
  mbtiType?: MBTIType
}

export interface CharacterResponse {
  id: string
  name: string
  mbtiType: MBTIType | null
  createdAt: string
}

// 4. 定义 Zod 验证模式
export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  mbtiType: z.enum(MBTI_TYPES).optional()
})

// 5. 实现业务逻辑 (完整类型安全)
export async function createCharacter(
  data: CreateCharacterRequest
): Promise<CharacterResponse> {
  // TypeScript 确保类型安全
}
```

**理由**: 类型驱动开发确保前后端类型一致，减少集成错误，提升开发效率和代码质量。

**强制规则**:
- ✅ 所有 API 端点必须有 Request/Response 类型定义
- ✅ 所有 API 端点必须有 Zod 验证模式
- ✅ Prisma 模型变更后必须运行 `prisma generate` 更新类型
- ✅ 前端使用的类型必须与后端 API 响应类型一致
- ❌ 禁止在业务逻辑中使用 `any` 或 `unknown` 类型

### 原则 4: 数据库设计规范 (Database Design Standard)

**决策**: 采用 Prisma ORM + PostgreSQL，遵循第三范式 (3NF) 设计原则。

**命名规范**:
```prisma
// 模型名: PascalCase 单数形式
model Character { }

// 字段名: camelCase
createdAt DateTime

// 关系字段: 复数形式表示一对多
characters Character[]

// 枚举: SCREAMING_SNAKE_CASE
enum UserRole {
  USER
  ADMIN
}
```

**索引策略**:
```prisma
model Character {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())

  // 单列索引 (高频查询字段)
  @@index([userId])
  @@index([createdAt])

  // 复合索引 (组合查询条件)
  @@index([userId, createdAt])

  // 唯一约束
  @@unique([userId, name])
}
```

**关系设计**:
- **一对多**: 使用外键 + `@relation` 声明
- **多对多**: 使用显式中间表 (不使用 Prisma 隐式多对多)
- **级联删除**: 谨慎使用，优先使用软删除 (`deletedAt` 字段)

**理由**: 规范的数据库设计确保数据一致性、查询性能和可维护性。Prisma 提供类型安全的数据库访问层。

**强制规则**:
- ✅ 所有表必须有 `id` (主键) 和 `createdAt` 字段
- ✅ 外键字段命名必须为 `关联表名Id` (如 `userId`, `characterId`)
- ✅ 高频查询字段必须添加索引 (使用 `EXPLAIN ANALYZE` 验证)
- ✅ 数据库迁移必须有描述性名称 (如 `add_mbti_to_character`)
- ❌ 禁止在生产环境使用 `prisma db push` (必须使用 `prisma migrate`)

### 原则 5: API 设计标准 (API Design Standard)

**决策**: 遵循 RESTful 风格，统一响应格式，支持版本控制。

**RESTful 路由规范**:
```typescript
GET    /api/characters          # 列表查询 (支持分页、排序、过滤)
GET    /api/characters/:id      # 单个查询
POST   /api/characters          # 创建资源
PUT    /api/characters/:id      # 完整更新
PATCH  /api/characters/:id      # 部分更新
DELETE /api/characters/:id      # 删除资源

// 子资源路由
GET    /api/characters/:id/sessions  # 角色的会话列表
POST   /api/characters/:id/favorite  # 收藏角色 (RPC 风格)
```

**统一响应格式**:
```typescript
// 成功响应
{
  "success": true,
  "data": { /* 业务数据 */ },
  "message": "操作成功",
  "timestamp": "2025-09-30T12:00:00.000Z"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户友好的错误信息",
    "details": [ /* 详细错误字段 */ ]
  },
  "timestamp": "2025-09-30T12:00:00.000Z"
}

// 分页响应
{
  "success": true,
  "data": [ /* 数据数组 */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**版本控制**:
- URL 版本控制: `/api/v1/characters` (当前采用)
- Header 版本控制: `Accept: application/vnd.tavern.v1+json` (未来扩展)

**理由**: 统一的 API 设计降低学习成本，提升前端开发效率，便于 API 文档自动生成。

**强制规则**:
- ✅ 所有 API 端点必须返回统一格式响应
- ✅ HTTP 状态码必须语义正确 (200/201/400/401/403/404/500)
- ✅ 查询参数命名使用 camelCase (如 `pageSize`, `sortBy`)
- ✅ 所有 API 端点必须记录在 `API_ENDPOINTS.md`
- ❌ 禁止在响应中暴露敏感信息 (密码、JWT Secret、内部 ID)

---

## 4. 开发纪律

### 纪律 1: 绝对禁止规则 (Absolute Prohibitions)

以下行为在任何情况下都不允许，违反者代码将被拒绝合并：

**NO PARTIAL IMPLEMENTATION (不允许部分实现)**
- ❌ 禁止提交未完成的功能 (标记为 `TODO` 或 `FIXME`)
- ❌ 禁止注释掉核心逻辑代码 (使用 Git 版本控制管理历史)
- ❌ 禁止 "先实现基础功能，后续再完善" 的开发方式
- ✅ 必须: 每次提交都是完整可运行的功能单元

**NO SIMPLIFICATION (不允许临时简化)**
- ❌ 禁止 "这是简化实现，完整版本会 blablabla" 的注释
- ❌ 禁止使用 `setTimeout` 模拟异步操作 (必须使用真实 API)
- ❌ 禁止使用硬编码测试数据代替数据库查询
- ✅ 必须: 所有功能基于生产环境标准实现

**NO CODE DUPLICATION (不允许重复代码)**
- ❌ 禁止复制粘贴代码块 (>10 行相同逻辑)
- ❌ 禁止在多处实现相同的业务规则 (如验证逻辑、格式化函数)
- ✅ 必须: 提取公共函数/组件，复用现有代码
- ✅ 必须: 在实现新功能前，搜索现有代码库是否有可复用代码

**NO DEAD CODE (不允许死代码)**
- ❌ 禁止保留未使用的导入语句
- ❌ 禁止保留未调用的函数/组件
- ❌ 禁止保留已废弃的 API 端点 (删除或标记 `@deprecated`)
- ✅ 必须: 运行 `npm run lint` 清理未使用代码

**NO CHEATER TESTS (不允许作弊测试)**
- ❌ 禁止测试只验证函数被调用，不验证返回值
- ❌ 禁止测试使用 mock 绕过核心逻辑
- ❌ 禁止测试永远通过 (如 `expect(true).toBe(true)`)
- ✅ 必须: 测试反映真实使用场景，能够发现 Bug

**NO INCONSISTENT NAMING (不允许不一致命名)**
- ❌ 禁止混用 camelCase 和 snake_case
- ❌ 禁止使用无意义的变量名 (如 `data`, `temp`, `x`)
- ❌ 禁止使用拼音命名 (如 `yonghu`, `jiaose`)
- ✅ 必须: 阅读现有代码的命名模式，保持一致

**NO OVER-ENGINEERING (不允许过度设计)**
- ❌ 禁止为简单功能引入复杂设计模式 (工厂、策略、建造者)
- ❌ 禁止为未来可能的需求预留过多抽象层
- ❌ 禁止在 CRUD 接口中引入 DDD 聚合根、领域事件
- ✅ 必须: 需要 "工作" 时不要想 "企业级"，保持简单

**NO MIXED CONCERNS (不允许混合职责)**
- ❌ 禁止在 API 处理器中编写验证逻辑 (使用 Zod middleware)
- ❌ 禁止在 UI 组件中直接调用 Prisma (使用 API Service)
- ❌ 禁止在 Services 层访问 HTTP 请求对象 (通过参数传递)
- ✅ 必须: 遵循单一职责原则，清晰分层

**NO RESOURCE LEAKS (不允许资源泄漏)**
- ❌ 禁止不关闭数据库连接 (Prisma `$disconnect()`)
- ❌ 禁止不清除定时器 (组件卸载时清除)
- ❌ 禁止不移除事件监听器 (Vue `onUnmounted` 清理)
- ❌ 禁止不关闭文件句柄 (使用 `try-finally` 确保关闭)
- ✅ 必须: 使用资源管理模式 (RAII / try-finally)

### 纪律 2: 测试驱动实践 (Test-Driven Practice)

**测试策略**:
```
测试金字塔:
       E2E Tests (10%)        - Playwright (关键业务流程)
    Integration Tests (30%)   - Supertest (API 端点)
  Unit Tests (60%)            - Jest/Vitest (函数/组件)
```

**测试标准**:
- ✅ **必须**: 每个 Service 函数有单元测试 (覆盖率 >80%)
- ✅ **必须**: 每个 API 端点有集成测试 (覆盖正常/异常流程)
- ✅ **必须**: 关键业务流程有 E2E 测试 (注册、登录、对话、支付)
- ✅ **必须**: 测试使用真实数据库 (Docker 启动测试数据库)
- ❌ **禁止**: 使用 mock 绕过核心业务逻辑

**测试命名规范**:
```typescript
// 单元测试
describe('CharacterService', () => {
  describe('createCharacter', () => {
    it('should create character with valid data', async () => {
      // Arrange
      const data = { name: 'Test', mbtiType: 'INTJ' }

      // Act
      const result = await service.createCharacter(data)

      // Assert
      expect(result.name).toBe('Test')
      expect(result.mbtiType).toBe('INTJ')
    })

    it('should throw error when name is empty', async () => {
      await expect(
        service.createCharacter({ name: '' })
      ).rejects.toThrow('Name is required')
    })
  })
})
```

**测试覆盖率目标**:
- 核心 Services: 90%
- API Routes: 80%
- Utils 函数: 95%
- Vue 组件: 70% (Composition API 逻辑)

### 纪律 3: 代码审查标准 (Code Review Standard)

**审查清单**:

**1. 类型安全 (Type Safety)**
- [ ] 所有函数参数和返回值有类型声明
- [ ] 没有使用 `any` 类型 (或有明确文档说明)
- [ ] 没有使用 `@ts-ignore` (或有 Issue 链接)
- [ ] Zod 验证覆盖所有 API 请求参数

**2. 性能影响 (Performance Impact)**
- [ ] 数据库查询有索引支持 (使用 `EXPLAIN ANALYZE`)
- [ ] 列表查询支持分页 (默认 pageSize=20)
- [ ] 避免 N+1 查询 (使用 Prisma `include` 批量加载)
- [ ] 大数据量使用流式处理 (不一次性加载到内存)

**3. 安全审查 (Security Audit)**
- [ ] 用户输入进行验证和清理
- [ ] 敏感数据不暴露在 API 响应中
- [ ] 认证中间件正确应用
- [ ] 权限检查完整 (用户只能操作自己的资源)

**4. 错误处理 (Error Handling)**
- [ ] 所有异步操作有 try-catch 包裹
- [ ] 错误日志记录完整 (包含堆栈和上下文)
- [ ] 用户友好的错误信息 (不暴露内部实现)
- [ ] 资源清理逻辑完整 (数据库连接、定时器)

**5. 测试覆盖 (Test Coverage)**
- [ ] 新增功能有单元测试
- [ ] 新增 API 端点有集成测试
- [ ] 测试覆盖正常和异常流程
- [ ] 测试使用真实数据库 (不使用 mock)

**6. 文档更新 (Documentation Update)**
- [ ] 问题解决过程记录在 `问题解决文档.md`
- [ ] API 变更更新 `API_ENDPOINTS.md`
- [ ] 复杂逻辑有代码注释解释 "为什么"
- [ ] CHANGELOG 记录功能变更

**审查流程**:
1. 开发者自审: 对照清单自查，确保无遗漏
2. 提交 PR: 填写 PR 模板，说明变更内容和测试方法
3. 自动化检查: CI 运行 lint、build、test
4. 人工审查: 至少 1 名团队成员 Review
5. 反馈修改: 根据审查意见修改代码
6. 批准合并: 审查通过后合并到主分支

---

## 5. 架构决策

### 决策 1: 时空酒馆核心机制 (Spacetime Tavern Core)

**决策**: 采用 MBTI 人格系统 + 角色关联网络 + 时空属性系统，构建多元宇宙对话体验。

**技术实现**:

**MBTI 人格系统**:
```typescript
// 16 种 MBTI 类型
type MBTIType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'  // 分析家
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'  // 外交家
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'  // 守护者
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'  // 探险家

// 性格兼容性算法
const mbtiCompatibility: Record<MBTIType, Record<MBTIType, number>> = {
  'INTJ': { 'ENFP': 0.95, 'ENTP': 0.90, 'INFJ': 0.85, /* ... */ },
  // ... 256 个兼容性配对
}
```

**角色关联网络**:
```typescript
// 6 种关系类型
enum RelationType {
  COMPLEMENTARY = 'complementary',        // 互补型
  MENTOR_STUDENT = 'mentor_student',      // 师徒型
  PROFESSIONAL = 'professional',          // 专业型
  PROTECTOR_WARD = 'protector_ward',      // 保护型
  CULTURAL_EXCHANGE = 'cultural_exchange',// 文化交流型
  TECHNOLOGY_MAGIC = 'technology_magic'   // 科技-魔法融合型
}

// 关联触发器
interface RelationTrigger {
  type: RelationType
  characterIds: string[]
  compatibilityScore: number  // 0-1
  interactionTriggers: string[]
  specialEvents: string[]
}
```

**时空属性系统**:
```typescript
// 16 种时空属性
enum SpacetimeAttribute {
  TIME_REVERSAL = 'time_reversal',        // 时间逆流
  SPACE_FOLDING = 'space_folding',        // 空间折叠
  MAGIC_RESONANCE = 'magic_resonance',    // 魔力共鸣
  TECH_SURGE = 'tech_surge',              // 科技浪潮
  CULTURAL_FUSION = 'cultural_fusion',    // 文化融合
  DIMENSION_SHIFT = 'dimension_shift',    // 维度变换
  // ... 更多属性
}
```

**理由**: 时空酒馆是项目核心竞争力，MBTI 系统提供科学的性格模型，关联网络创造丰富互动，时空属性增强沉浸感。

**实施要求**:
- ✅ 所有新增角色必须标注 MBTI 类型 (目前覆盖率 87.4%)
- ✅ 核心角色必须建立关联网络 (至少 3 个关联角色)
- ✅ 时空酒馆剧本必须定义时空属性和融合机制
- ✅ WorldInfo 注入引擎必须支持时空感知匹配

### 决策 2: 游戏化系统设计 (Gamification System)

**决策**: 采用亲密度 (1-10 级) + 熟练度 (1-50 级) + 成就系统 + 每日任务，构建完整游戏化体验。

**数值平衡设计**:

**亲密度系统**:
```typescript
// 等级设计
const affinityLevels = [
  { level: 1, points: 0, type: 'stranger' },       // 陌生人
  { level: 2, points: 100, type: 'acquaintance' }, // 相识
  { level: 3, points: 300, type: 'friend' },       // 朋友
  { level: 4, points: 600, type: 'close_friend' }, // 挚友
  { level: 5, points: 1000, type: 'best_friend' }, // 闺蜜/死党
  { level: 6, points: 1500, type: 'soulmate' },    // 灵魂伴侣
  // ... 更多等级
]

// 点数获取
const affinityGain = {
  normalChat: 5,        // 普通对话 (每 10 条消息)
  emotionalChat: 10,    // 情感共鸣对话
  giftGiving: 20,       // 赠送礼物
  scenarioComplete: 50, // 完成剧本
  achievementUnlock: 100// 解锁成就
}
```

**熟练度系统**:
```typescript
// 技能树设计
const skillTree = {
  basicDialogue: {
    level: 1,
    children: {
      emotionRecognition: { level: 5, cost: 100 },
      humorExpression: { level: 10, cost: 200 },
      deepCommunication: {
        level: 15,
        cost: 300,
        children: {
          empathy: { level: 20, cost: 500 },
          conflictResolution: { level: 25, cost: 800 },
          relationshipMaintenance: { level: 30, cost: 1200 }
        }
      }
    }
  }
}
```

**成就系统**:
```typescript
// 稀有度设计
enum AchievementRarity {
  COMMON = 'common',       // 普通 (10 点)
  RARE = 'rare',           // 稀有 (30 点)
  EPIC = 'epic',           // 史诗 (100 点)
  LEGENDARY = 'legendary'  // 传奇 (500 点)
}

// 成就类型
enum AchievementType {
  CHARACTER_AFFINITY = 'character_affinity',  // 角色亲密度
  SCENARIO_PROGRESS = 'scenario_progress',    // 剧本进度
  SKILL_MASTERY = 'skill_mastery',            // 技能掌握
  SOCIAL = 'social',                          // 社交成就
  SPECIAL = 'special'                         // 特殊事件
}
```

**理由**: 游戏化系统提升用户粘性和长期留存率。数值平衡需持续调整，通过数据分析优化用户体验。

**实施要求**:
- ✅ 每次对话结束后计算亲密度和熟练度增长
- ✅ 成就解锁后实时推送通知 (WebSocket)
- ✅ 每日任务在 UTC 00:00 刷新 (定时任务)
- ✅ 防止作弊机制 (对话质量检测、时间间隔限制)

### 决策 3: AI 多模型集成策略 (Multi-Model AI Integration)

**决策**: 支持 5+ AI 提供商，实施负载均衡和容错降级，确保服务高可用性。

**支持的 AI 模型**:
```typescript
// AI 提供商配置
const aiProviders = {
  openai: {
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    priority: 1
  },
  anthropic: {
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    priority: 2
  },
  google: {
    models: ['gemini-pro', 'gemini-pro-vision'],
    endpoint: 'https://generativelanguage.googleapis.com/v1/models',
    priority: 3
  },
  xai: {
    models: ['grok-3'],
    endpoint: 'https://api.x.ai/v1/chat/completions',
    priority: 4
  },
  deepseek: {
    models: ['deepseek-chat'],
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    priority: 5
  }
}
```

**负载均衡策略**:
```typescript
// API Key 轮换
class LoadBalancer {
  private keyPool: Map<string, string[]>  // provider -> keys
  private keyIndex: Map<string, number>    // provider -> currentIndex

  getNextKey(provider: string): string {
    const keys = this.keyPool.get(provider)
    const index = this.keyIndex.get(provider) || 0
    const key = keys[index % keys.length]
    this.keyIndex.set(provider, index + 1)
    return key
  }
}

// 容错降级
async function callAI(messages: Message[], options: AIOptions) {
  const providers = getSortedProviders(options.preferredProvider)

  for (const provider of providers) {
    try {
      return await provider.chat(messages, options)
    } catch (error) {
      logger.warn(`Provider ${provider.name} failed, trying next`)
      continue
    }
  }

  throw new Error('All AI providers failed')
}
```

**成本优化**:
```typescript
// Token 预算管理
const tokenBudget = {
  free: 10000,      // 免费用户: 10k tokens/月
  basic: 100000,    // 基础订阅: 100k tokens/月
  pro: 500000,      // 专业订阅: 500k tokens/月
  unlimited: Infinity
}

// 成本追踪
async function trackCost(userId: string, usage: TokenUsage) {
  const cost = calculateCost(usage)
  await prisma.usageLog.create({
    data: {
      userId,
      tokens: usage.totalTokens,
      cost,
      provider: usage.provider,
      model: usage.model
    }
  })
}
```

**理由**: 单一 AI 提供商存在服务中断和成本风险。多模型集成提供灵活性和高可用性，负载均衡降低单点故障概率。

**实施要求**:
- ✅ 所有 AI 调用必须通过统一的 AIService 接口
- ✅ API Key 必须通过环境变量配置，支持多 Key 轮换
- ✅ 实施请求重试机制 (最多 3 次)
- ✅ 记录所有 AI 请求日志 (时间、Token、成本、错误)

### 决策 4: 缓存策略设计 (Caching Strategy)

**决策**: 采用三级缓存架构 (内存缓存 + Redis + CDN)，提升性能并降低数据库压力。

**三级缓存架构**:
```typescript
// L1 缓存: 内存缓存 (Node-Cache)
const memoryCache = new NodeCache({
  stdTTL: 300,         // 默认 5 分钟过期
  checkperiod: 60,     // 每 60 秒清理过期数据
  maxKeys: 1000        // 最多 1000 个 key
})

// L2 缓存: Redis 缓存
const redisCache = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest: 3
})

// L3 缓存: CDN 缓存 (Cloudflare/AWS CloudFront)
// 静态资源自动缓存
```

**缓存策略**:
```typescript
// 缓存优先级
enum CachePriority {
  LOW = 'low',      // 5 分钟
  MEDIUM = 'medium',// 1 小时
  HIGH = 'high',    // 24 小时
  PERMANENT = 'permanent' // 永久 (手动失效)
}

// 缓存键设计
const cacheKeys = {
  character: (id: string) => `character:${id}`,
  characterList: (userId: string, page: number) =>
    `character:list:${userId}:${page}`,
  scenarioList: (page: number) => `scenario:list:${page}`,
  userProfile: (userId: string) => `user:profile:${userId}`
}

// 缓存读取流程
async function getCharacter(id: string): Promise<Character> {
  // 1. 尝试内存缓存
  let character = memoryCache.get<Character>(cacheKeys.character(id))
  if (character) return character

  // 2. 尝试 Redis 缓存
  const cached = await redisCache.get(cacheKeys.character(id))
  if (cached) {
    character = JSON.parse(cached)
    memoryCache.set(cacheKeys.character(id), character)
    return character
  }

  // 3. 查询数据库
  character = await prisma.character.findUnique({ where: { id } })

  // 4. 写入缓存
  await redisCache.setex(
    cacheKeys.character(id),
    3600, // 1 小时
    JSON.stringify(character)
  )
  memoryCache.set(cacheKeys.character(id), character)

  return character
}
```

**缓存失效策略**:
```typescript
// 写操作后失效相关缓存
async function updateCharacter(id: string, data: UpdateData) {
  // 1. 更新数据库
  const character = await prisma.character.update({
    where: { id },
    data
  })

  // 2. 失效缓存
  memoryCache.del(cacheKeys.character(id))
  await redisCache.del(cacheKeys.character(id))

  // 3. 失效列表缓存 (模式匹配)
  const listKeys = await redisCache.keys(`character:list:*`)
  if (listKeys.length > 0) {
    await redisCache.del(...listKeys)
  }

  return character
}
```

**理由**: 缓存是提升性能的最有效手段。三级缓存架构平衡了性能和一致性，降低数据库压力，提升用户体验。

**实施要求**:
- ✅ 热点数据 (角色、剧本) 必须缓存 (目标命中率 >80%)
- ✅ 缓存键必须有命名空间，避免冲突
- ✅ 写操作后必须失效相关缓存，保证数据一致性
- ✅ 实施缓存监控 (命中率、过期率、内存使用率)

---

## 6. 质量标准

### 标准 1: 代码质量指标 (Code Quality Metrics)

**量化指标**:
```yaml
代码质量:
  - 圈复杂度: ≤10 (函数)
  - 代码重复率: ≤5%
  - 技术债务: ≤5% (SonarQube)
  - ESLint 警告: 0
  - TypeScript 错误: 0

测试覆盖率:
  - 核心 Services: ≥90%
  - API Routes: ≥80%
  - Utils 函数: ≥95%
  - Vue 组件: ≥70%

性能指标:
  - API 响应时间: <200ms (P95)
  - 数据库查询: <50ms (P95)
  - 前端 FCP: <1.5s
  - 前端 TTI: <3.5s

安全指标:
  - OWASP Top 10: 0 违规
  - npm audit: 0 严重漏洞
  - 密钥硬编码: 0 处
  - SQL 注入漏洞: 0 处
```

**自动化检查**:
```yaml
# .github/workflows/quality.yml
name: Quality Check
on: [push, pull_request]

jobs:
  lint:
    - run: npm run lint
    - run: npm run type-check

  test:
    - run: npm run test:coverage
    - run: |
        if coverage < 80%; then
          echo "Coverage below threshold"
          exit 1
        fi

  security:
    - run: npm audit --audit-level=high
    - run: npx snyk test

  performance:
    - run: npm run build
    - run: npx bundlesize
```

### 标准 2: 性能基准测试 (Performance Benchmarks)

**后端性能基准**:
```typescript
// 使用 autocannon 进行压力测试
const benchmarks = {
  '/api/auth/login': {
    target: 'http://localhost:3001/api/auth/login',
    duration: 30,
    connections: 100,
    expected: {
      rps: '>500',        // 每秒请求数
      latency_p95: '<200ms'
    }
  },
  '/api/characters': {
    target: 'http://localhost:3001/api/characters',
    duration: 30,
    connections: 100,
    expected: {
      rps: '>1000',
      latency_p95: '<100ms'
    }
  }
}
```

**前端性能基准**:
```typescript
// 使用 Lighthouse CI
const lighthouseConfig = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/characters'],
      numberOfRuns: 5
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'interactive': ['error', { maxNumericValue: 3500 }]
      }
    }
  }
}
```

### 标准 3: 文档完整性 (Documentation Completeness)

**文档清单**:
- [x] **项目宪章** (`constitution.md`) - 本文档
- [x] **项目总览** (`CLAUDE.md`) - 91.8% 覆盖率
- [x] **API 文档** (`API_ENDPOINTS.md`) - 24 个活跃路由
- [x] **部署指南** (`DEPLOYMENT.md`) - 生产环境配置
- [x] **问题解决** (`问题解决文档.md`) - 历史问题记录
- [ ] **贡献指南** (`CONTRIBUTING.md`) - 待完善
- [ ] **变更日志** (`CHANGELOG.md`) - 待自动化

**代码注释标准**:
```typescript
/**
 * 创建角色并建立 MBTI 关联网络
 *
 * @param userId - 用户 ID
 * @param data - 角色创建数据
 * @returns 创建的角色信息 (包含 MBTI 兼容性分析)
 *
 * @throws {ValidationError} 当角色名称为空或 MBTI 类型无效
 * @throws {DatabaseError} 当数据库操作失败
 *
 * @example
 * ```typescript
 * const character = await createCharacter('user123', {
 *   name: 'Sherlock Holmes',
 *   mbtiType: 'INTJ',
 *   description: 'Consulting detective'
 * })
 * ```
 *
 * @remarks
 * 此函数会自动计算与现有角色的 MBTI 兼容性，并推荐潜在的关联角色。
 * 如果用户已有 5+ 个角色，会触发游戏化成就检查。
 */
export async function createCharacter(
  userId: string,
  data: CreateCharacterRequest
): Promise<CharacterResponse> {
  // 实现逻辑
}
```

---

## 7. 安全准则

### 准则 1: 认证与授权 (Authentication & Authorization)

**认证机制**:
```typescript
// JWT 双令牌策略
interface TokenPair {
  accessToken: string   // 短期令牌 (15 分钟)
  refreshToken: string  // 长期令牌 (7 天)
}

// 生产环境 JWT Secret 要求
const jwtSecretRequirements = {
  minLength: 256,           // 至少 256 位
  entropy: 'high',          // 高熵值随机字符串
  rotation: '90 days',      // 每 90 天轮换
  algorithm: 'RS256'        // 非对称加密 (未来迁移)
}
```

**授权模型 (RBAC)**:
```typescript
enum UserRole {
  USER = 'user',       // 普通用户
  PREMIUM = 'premium', // 付费用户
  ADMIN = 'admin',     // 管理员
  SUPER = 'super'      // 超级管理员
}

// 权限检查中间件
function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role && req.user.role !== 'super') {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

// 资源所有权检查
async function checkOwnership(userId: string, resourceId: string) {
  const resource = await prisma.character.findUnique({
    where: { id: resourceId },
    select: { userId: true }
  })

  if (resource.userId !== userId) {
    throw new ForbiddenError('You do not own this resource')
  }
}
```

### 准则 2: 输入验证与清理 (Input Validation & Sanitization)

**Zod 验证标准**:
```typescript
// 统一验证模式
import { z } from 'zod'

// 基础类型
const IdSchema = z.string().cuid()
const EmailSchema = z.string().email()
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')

// 请求验证
const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  mbtiType: z.enum([
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ]).optional(),
  tags: z.array(z.string()).max(10).optional()
})

// 验证中间件
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        })
      }
      next(error)
    }
  }
}
```

**XSS 防护**:
```typescript
import DOMPurify from 'dompurify'

// 清理用户输入的 HTML
function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  })
}

// 输出转义
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

### 准则 3: 密钥管理 (Secret Management)

**环境变量规范**:
```bash
# .env.example (提交到 Git)
NODE_ENV=development
PORT=3001

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# AI 提供商
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=xxx
```

**密钥轮换策略**:
```typescript
// 密钥版本管理
interface SecretVersion {
  version: number
  key: string
  createdAt: Date
  expiresAt: Date
  status: 'active' | 'rotating' | 'revoked'
}

// 支持多版本密钥 (无缝轮换)
class SecretManager {
  private secrets: Map<string, SecretVersion[]>

  getActiveSecret(name: string): string {
    const versions = this.secrets.get(name)
    const active = versions.find(v => v.status === 'active')
    return active.key
  }

  rotateSecret(name: string, newKey: string) {
    const versions = this.secrets.get(name)
    versions.forEach(v => { v.status = 'revoked' })
    versions.push({
      version: versions.length + 1,
      key: newKey,
      createdAt: new Date(),
      expiresAt: addDays(new Date(), 90),
      status: 'active'
    })
  }
}
```

### 准则 4: 安全审计 (Security Audit)

**审计日志**:
```typescript
// 敏感操作必须记录审计日志
interface AuditLog {
  userId: string
  action: string        // 'login', 'password_change', 'data_export'
  resource: string      // 'user:123', 'character:456'
  ipAddress: string
  userAgent: string
  timestamp: Date
  success: boolean
  errorMessage?: string
}

// 审计日志记录
async function logAudit(log: AuditLog) {
  await prisma.auditLog.create({ data: log })

  // 异常行为告警
  if (isAnomalous(log)) {
    await sendSecurityAlert(log)
  }
}
```

**安全检查清单**:
- [ ] OWASP Top 10 合规检查
- [ ] SQL 注入漏洞扫描
- [ ] XSS 漏洞扫描
- [ ] CSRF 令牌验证
- [ ] 密钥泄露扫描 (git-secrets)
- [ ] 依赖漏洞扫描 (npm audit / Snyk)
- [ ] 权限提升测试
- [ ] 会话劫持测试

---

## 8. 协作规范

### 规范 1: Git 工作流 (Git Workflow)

**分支策略 (Git Flow)**:
```
main (生产环境)
  ↑
develop (开发环境)
  ↑
feature/xxx (功能开发)
bugfix/xxx (问题修复)
hotfix/xxx (紧急修复)
```

**分支命名规范**:
```bash
# 功能开发
feature/mbti-compatibility-algorithm
feature/gamification-daily-quests

# 问题修复
bugfix/character-list-pagination
bugfix/chat-websocket-disconnect

# 紧急修复
hotfix/security-jwt-validation
hotfix/api-rate-limit-bypass
```

**提交规范 (Conventional Commits)**:
```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>

# 类型
feat:     新功能
fix:      问题修复
docs:     文档更新
style:    代码格式 (不影响逻辑)
refactor: 重构 (不改变功能)
perf:     性能优化
test:     测试相关
chore:    构建/工具链更新
revert:   回滚提交

# 示例
feat(characters): add MBTI compatibility calculation

Implement a comprehensive MBTI compatibility algorithm based on
cognitive function stacks. The algorithm calculates compatibility
scores between 16 MBTI types using a 256-pair matrix.

Closes #123
```

### 规范 2: Pull Request 流程 (PR Process)

**PR 模板**:
```markdown
## 变更类型
- [ ] 新功能
- [ ] 问题修复
- [ ] 重构
- [ ] 文档更新

## 变更描述
<!-- 详细描述本次变更的内容和原因 -->

## 关联 Issue
Closes #123

## 测试方法
<!-- 如何测试本次变更 -->
1. 启动开发服务器
2. 访问 /characters 页面
3. 验证 MBTI 兼容性显示

## 检查清单
- [ ] 代码通过 ESLint 检查
- [ ] 代码通过 TypeScript 编译
- [ ] 添加了单元测试
- [ ] 更新了相关文档
- [ ] 性能影响评估完成
- [ ] 安全审查完成

## 截图 (如适用)
<!-- 添加截图展示变更效果 -->
```

**审查流程**:
1. **自动化检查** (CI):
   - ESLint / Prettier 格式检查
   - TypeScript 编译检查
   - 单元测试运行
   - 测试覆盖率检查
   - 安全漏洞扫描

2. **人工审查**:
   - 至少 1 名团队成员 Review
   - 审查清单对照检查
   - 代码逻辑和设计审查
   - 性能和安全审查

3. **反馈修改**:
   - 根据审查意见修改代码
   - 再次提交审查
   - 直到审查通过

4. **合并策略**:
   - `feature/*` → `develop`: Squash and Merge
   - `develop` → `main`: Merge Commit (保留历史)
   - `hotfix/*` → `main`: Merge Commit (紧急修复)

### 规范 3: 沟通与协作 (Communication & Collaboration)

**团队沟通渠道**:
- **GitHub Issues**: 问题跟踪、功能需求、Bug 报告
- **GitHub Discussions**: 技术讨论、架构决策、知识分享
- **Slack/Discord**: 实时沟通、紧急事项、日常协作
- **文档**: 异步沟通、知识沉淀、决策记录

**会议规范**:
- **每日站会** (15 分钟):
  - 昨天完成了什么
  - 今天计划做什么
  - 遇到了什么阻碍

- **周会** (1 小时):
  - 回顾本周进展
  - 讨论技术难题
  - 规划下周任务

- **月会** (2 小时):
  - 月度目标回顾
  - 技术债务清理
  - 长期规划讨论

**知识分享**:
- **技术分享会** (每月 1 次):
  - 新技术探索
  - 架构设计分享
  - 问题解决案例

- **文档更新** (持续):
  - 问题解决文档
  - 架构决策记录
  - 最佳实践总结

---

## 9. 宪章治理

### 9.1 宪章修订流程 (Amendment Process)

**修订触发条件**:
- 重大架构变更 (如迁移到微服务)
- 技术栈升级 (如 Vue 4、Node.js 20)
- 重要原则调整 (如放宽类型安全要求)
- 团队规模变化 (如扩展到多团队协作)

**修订流程**:
1. **提议阶段**:
   - 任何团队成员可提出修订提议
   - 创建 GitHub Issue 说明修订原因和内容
   - 社区讨论 (至少 1 周)

2. **起草阶段**:
   - 指定负责人起草修订内容
   - 评估影响范围和实施成本
   - 准备修订对比文档

3. **审查阶段**:
   - 技术团队 Review
   - 至少 2/3 核心成员同意
   - 修订版本号 (MAJOR.MINOR.PATCH)

4. **发布阶段**:
   - 更新宪章文档
   - 同步更新相关模板
   - 通知全员并培训

**版本控制**:
```yaml
版本格式: MAJOR.MINOR.PATCH

MAJOR: 向后不兼容的重大变更
  - 架构原则根本性调整
  - 禁止规则删除或放宽
  - 技术栈更换

MINOR: 向后兼容的新增内容
  - 新增原则或标准
  - 扩展现有规范
  - 新增工具或流程

PATCH: 澄清、修正、格式调整
  - 文字润色
  - 示例补充
  - 错别字修正
```

### 9.2 合规性审查 (Compliance Review)

**定期审查**:
- **每周**: CI 自动检查 (代码质量、测试覆盖率)
- **每月**: 人工审查 (架构合规性、安全审查)
- **每季度**: 全面评估 (技术债务、性能指标、团队反馈)

**审查清单**:
```yaml
代码质量:
  - [ ] TypeScript 严格模式启用
  - [ ] ESLint 0 警告
  - [ ] 无 any 类型 (或有文档说明)
  - [ ] 测试覆盖率 ≥80%

架构合规:
  - [ ] 分层架构遵守
  - [ ] 模块边界清晰
  - [ ] 无循环依赖
  - [ ] API 设计规范

安全合规:
  - [ ] 无密钥硬编码
  - [ ] OWASP Top 10 合规
  - [ ] 依赖漏洞 0 严重
  - [ ] 安全审计日志完整

文档合规:
  - [ ] 问题解决文档更新
  - [ ] API 文档同步
  - [ ] 代码注释完整
  - [ ] CHANGELOG 记录
```

### 9.3 例外处理 (Exception Handling)

**申请例外**:
在特殊情况下 (紧急修复、技术限制)，可申请临时例外:

```markdown
## 例外申请

**申请人**: @username
**日期**: 2025-09-30
**涉及原则**: 类型安全至上

**例外内容**:
在 `api/routes/legacy.ts` 中使用 `any` 类型处理第三方库返回值

**理由**:
第三方库 `legacy-sdk` 没有 TypeScript 类型定义，且不再维护

**影响范围**:
仅限 `api/routes/legacy.ts` 文件，约 50 行代码

**补救措施**:
1. 添加详细注释说明 `any` 使用原因
2. 创建 Issue 跟踪类型定义补充
3. 3 个月后重新评估替代方案

**批准**: [ ] 技术负责人  [ ] 团队 Review
```

### 9.4 宪章监护 (Constitution Stewardship)

**宪章监护人职责**:
- 维护宪章文档完整性
- 审查宪章修订提议
- 监督合规性审查
- 解答宪章解释问题
- 推动宪章文化建设

**监护人任命**:
- 技术负责人自动担任监护人
- 高级工程师可推荐担任
- 每年轮换 (可连任)

---

## 附录 A: 术语表 (Glossary)

**技术术语**:
- **Monorepo**: 单一代码仓库管理多个项目/包
- **MBTI**: Myers-Briggs Type Indicator, 16 种人格类型
- **RBAC**: Role-Based Access Control, 基于角色的访问控制
- **Zod**: TypeScript 运行时验证库
- **Prisma**: 现代化 TypeScript ORM
- **Socket.IO**: 实时双向通信库

**业务术语**:
- **时空酒馆**: 项目核心创新概念，跨时空角色互动平台
- **角色关联网络**: 角色间的关系图谱和互动触发系统
- **游戏化系统**: 亲密度、熟练度、成就、每日任务的游戏机制
- **WorldInfo**: 世界信息动态注入系统，增强对话上下文

---

## 附录 B: 参考资料 (References)

**项目文档**:
- [项目总览 (CLAUDE.md)](../../CLAUDE.md)
- [TavernAI Plus 主文档](../../cankao/tavernai-plus/CLAUDE.md)
- [API 端点文档](../../cankao/tavernai-plus/API_ENDPOINTS.md)
- [部署指南](../../cankao/tavernai-plus/DEPLOYMENT.md)

**技术规范**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

**最佳实践**:
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [12-Factor App](https://12factor.net/)

---

## 生效声明 (Effective Statement)

本宪章自 **2025 年 9 月 30 日** 起生效，适用于时空酒馆 (TavernAI Plus) 项目的所有开发活动。所有团队成员必须遵守本宪章规定的原则、标准和流程。

**批准签署**:
- 技术负责人: _____________  日期: 2025-09-30
- 宪章监护人: _____________  日期: 2025-09-30

---

**宪章版本**: 1.0.0
**最后更新**: 2025-09-30
**下次审查**: 2025-12-30 (每季度审查)

---

*本宪章旨在建立清晰的技术准则和协作规范，确保项目长期健康发展。所有团队成员都有责任维护宪章的权威性和执行力。*

**时空酒馆 (TavernAI Plus) - 构建下一代 AI 角色扮演平台** 🎭✨🚀