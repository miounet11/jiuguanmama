---
name: scenario-worldinfo-system
status: backlog
created: 2025-09-22T12:48:44Z
progress: 0%
prd: .claude/prds/scenario-worldinfo-system.md
github: https://github.com/miounet11/jiuguanbaba/issues/19
---

# Epic: 情景剧本与世界信息系统

## Overview

情景剧本与世界信息系统是一个智能化知识库功能，通过关键词触发机制动态注入背景信息到AI对话中，显著提升角色扮演的沉浸感和一致性。技术实现采用扩展现有架构的策略，在数据库层新增剧本相关表结构，在API层增加世界信息处理逻辑，在前端层构建完整的剧本管理界面，确保与现有系统的无缝集成。

## Architecture Decisions

### 1. 数据库设计策略
**决策：** 采用关系型数据库扩展现有Prisma schema，新增专门的剧本和世界信息表
**理由：**
- 充分利用现有的Prisma ORM基础设施
- 保持数据一致性和关联完整性
- 支持复杂的关联查询和索引优化
- 便于与现有用户和角色系统集成

### 2. 关键词匹配引擎
**决策：** 实现混合匹配策略（精确匹配 + 正则表达式 + 全文搜索）
**理由：**
- 兼容SillyTavern的关键词语法
- 支持复杂的匹配逻辑（AND/OR/NOT操作）
- 可扩展至语义匹配（未来功能）
- 性能可控，支持索引优化

### 3. 世界信息注入机制
**决策：** 在现有prompt构建流程中插入世界信息处理层
**理由：**
- 最小化对现有对话引擎的影响
- 保持与多AI模型的兼容性
- 支持动态的token预算管理
- 易于调试和性能监控

### 4. 前端架构集成
**决策：** 基于现有Vue 3 + Element Plus技术栈，创建独立的剧本管理模块
**理由：**
- 复用现有的组件库和设计系统
- 保持用户界面的一致性
- 利用现有的状态管理和路由系统
- 便于功能的渐进式开发

## Technical Approach

### Frontend Components

#### 核心组件架构
```
ScenarioManagement/
├── ScenarioList.vue          # 剧本列表和搜索
├── ScenarioEditor.vue        # 剧本编辑器主界面
├── WorldInfoEntry.vue        # 单个条目编辑组件
├── KeywordManager.vue        # 关键词配置组件
├── ImportExportDialog.vue    # 导入导出功能
└── ScenarioPreview.vue       # 剧本预览和测试
```

#### 状态管理策略
- **Pinia Store**: 创建`useScenarioStore`管理剧本数据和状态
- **缓存策略**: 实现本地缓存减少API调用
- **响应式更新**: 支持实时编辑和协作（未来功能）

#### 用户交互模式
- **拖拽式管理**: 条目的重新排序和分类
- **实时预览**: 编辑时即时查看匹配效果
- **快捷操作**: 键盘快捷键支持高效编辑

### Backend Services

#### API接口设计
```
POST   /api/scenarios                    # 创建剧本
GET    /api/scenarios                    # 获取剧本列表
GET    /api/scenarios/:id                # 获取剧本详情
PUT    /api/scenarios/:id                # 更新剧本
DELETE /api/scenarios/:id                # 删除剧本

POST   /api/scenarios/:id/entries        # 添加世界信息条目
PUT    /api/scenarios/:id/entries/:entryId  # 更新条目
DELETE /api/scenarios/:id/entries/:entryId  # 删除条目

POST   /api/scenarios/import             # 导入剧本数据
POST   /api/scenarios/:id/export         # 导出剧本数据
POST   /api/scenarios/:id/test           # 测试关键词匹配
```

#### 核心服务架构
```
services/
├── scenarioService.ts        # 剧本CRUD业务逻辑
├── worldInfoMatcher.ts       # 关键词匹配引擎
├── promptInjector.ts         # 世界信息注入器
├── importExportService.ts    # 数据导入导出处理
└── cacheManager.ts           # 缓存管理和优化
```

#### 数据模型设计
```prisma
model Scenario {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  isPublic    Boolean  @default(false)
  tags        String[] @default([])

  entries     WorldInfoEntry[]
  characters  Character[]      @relation("CharacterScenarios")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorldInfoEntry {
  id          String   @id @default(cuid())
  scenarioId  String

  title       String
  content     String
  keywords    String[] @default([])
  priority    Int      @default(0)
  insertDepth Int      @default(0)
  isActive    Boolean  @default(true)

  // 高级配置
  matchType   String   @default("keyword") // keyword, regex, semantic
  probability Int      @default(100)

  scenario    Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Infrastructure

#### 性能优化策略
- **数据库索引**: 关键词字段的全文索引和B-tree索引
- **查询优化**: 预编译查询和连接池管理
- **缓存层**: Redis缓存频繁访问的剧本数据
- **异步处理**: 大型剧本的导入导出异步处理

#### 监控和可观测性
- **性能指标**: 关键词匹配延迟、世界信息注入时间
- **使用统计**: 剧本使用频率、条目触发次数
- **错误跟踪**: 匹配失败、导入错误的详细日志
- **用户行为**: 编辑操作、功能使用模式分析

#### 扩展性考虑
- **水平扩展**: 支持读写分离和分片策略
- **插件化架构**: 预留第三方扩展接口
- **API版本管理**: 向后兼容的API演进策略
- **多租户支持**: 为企业级使用预留架构空间

## Implementation Strategy

### 开发阶段划分

#### Phase 1: 核心基础 (4-6周)
- 数据库schema设计和迁移
- 基础API接口实现
- 简单的剧本CRUD功能
- 基础关键词匹配引擎

#### Phase 2: 功能完善 (4-6周)
- 完整的前端管理界面
- 高级关键词匹配功能
- 角色剧本关联系统
- 世界信息注入集成

#### Phase 3: 生产就绪 (2-3周)
- 导入导出功能
- 性能优化和缓存
- 完整测试覆盖
- 文档和部署准备

### 风险缓解策略

#### 技术风险
- **性能风险**: 复杂匹配可能影响响应时间
  - 缓解: 实现查询优化和结果缓存
- **数据一致性**: 大量并发更新可能导致冲突
  - 缓解: 事务管理和乐观锁机制
- **兼容性风险**: 与现有系统集成可能产生冲突
  - 缓解: 渐进式集成和完整的回归测试

#### 产品风险
- **用户接受度**: 功能复杂度可能影响用户采用
  - 缓解: 分阶段发布和用户反馈收集
- **数据迁移**: SillyTavern数据导入可能有格式问题
  - 缓解: 完整的数据验证和错误处理机制

### 测试策略

#### 单元测试 (目标覆盖率: 90%+)
- 关键词匹配算法测试
- 世界信息注入逻辑测试
- 数据导入导出功能测试
- API接口完整性测试

#### 集成测试
- 前后端集成测试
- 数据库操作完整性测试
- 第三方服务集成测试
- 性能基准测试

#### 端到端测试
- 完整用户流程测试
- 多浏览器兼容性测试
- 移动端响应式测试
- 负载和压力测试

## Task Breakdown Preview

基于技术分析，将创建以下8个核心任务类别：

- [ ] **数据库架构设计**: Prisma schema扩展、迁移脚本、索引优化
- [ ] **关键词匹配引擎**: 核心算法实现、性能优化、SillyTavern兼容性
- [ ] **剧本管理API**: RESTful接口、业务逻辑、数据验证
- [ ] **世界信息注入系统**: prompt构建集成、token管理、多AI模型适配
- [ ] **前端剧本管理器**: Vue组件、状态管理、用户交互
- [ ] **角色剧本关联**: 关联管理、继承策略、动态加载
- [ ] **导入导出功能**: 格式兼容、数据迁移、错误处理
- [ ] **测试和文档**: 单元测试、集成测试、用户文档

## Dependencies

### 内部依赖
- **用户认证系统**: 剧本所有权验证和访问控制
- **角色管理系统**: 角色与剧本的关联绑定
- **对话引擎**: prompt构建时的世界信息注入
- **数据库层**: Prisma ORM和schema扩展支持

### 外部依赖
- **AI模型API**: 多模型的prompt格式适配
- **前端组件库**: Element Plus的表单和数据展示组件
- **数据库**: SQLite/PostgreSQL的全文搜索能力
- **缓存系统**: Redis的高性能数据缓存

### 风险依赖
- **高风险**: AI API格式变更、数据库性能瓶颈
- **中风险**: 第三方库更新、用户数据迁移
- **低风险**: UI组件兼容性、构建工具配置

## Success Criteria (Technical)

### 性能基准
- **关键词匹配延迟**: < 100ms (95th percentile)
- **世界信息注入延迟**: < 200ms (95th percentile)
- **剧本加载时间**: < 1s (包含1000+条目的大型剧本)
- **并发处理能力**: 支持100+并发用户同时使用

### 质量指标
- **代码覆盖率**: 单元测试覆盖率 ≥ 90%
- **API成功率**: 99.9%+ API调用成功率
- **数据完整性**: 100% 导入导出数据一致性
- **兼容性测试**: 100% SillyTavern格式兼容

### 用户体验指标
- **学习曲线**: 90%+新用户能在10分钟内创建首个剧本
- **错误率**: 用户操作错误率 < 5%
- **响应体验**: 95%+用户认为系统响应及时
- **功能完成度**: 100% PRD定义的核心功能实现

## Estimated Effort

### 总体时间线
- **Phase 1 (核心基础)**: 4-6周
- **Phase 2 (功能完善)**: 4-6周
- **Phase 3 (生产就绪)**: 2-3周
- **总计**: 10-15周 (约3-4个月)

### 资源配置
- **后端开发**: 1名全栈工程师，专注API和数据库
- **前端开发**: 1名前端工程师，专注UI和用户体验
- **测试和质量**: 0.5名QA工程师，专注测试覆盖和质量保证
- **产品设计**: 0.5名UI/UX设计师，专注用户界面优化

### 关键路径分析
1. **数据库设计** → **API实现** → **前端集成** (串行关键路径)
2. **关键词匹配引擎** → **世界信息注入** → **对话集成** (核心功能路径)
3. **导入导出功能** 和 **测试覆盖** (可并行进行)

### 风险时间缓冲
- **技术复杂度**: +20% 时间缓冲，应对关键词匹配优化
- **集成复杂度**: +15% 时间缓冲，应对现有系统集成
- **测试验证**: +10% 时间缓冲，确保质量标准达成

## Tasks Created

- [ ] #20 - 数据库架构设计和迁移 (parallel: false)
- [ ] #21 - 关键词匹配引擎实现 (parallel: false)
- [ ] #22 - 剧本管理API开发 (parallel: true)
- [ ] #23 - 世界信息注入系统 (parallel: false)
- [ ] #24 - 前端剧本管理器开发 (parallel: true)
- [ ] #25 - 角色剧本关联系统 (parallel: true)
- [ ] #26 - 导入导出功能实现 (parallel: true)
- [ ] #27 - 测试覆盖和文档完善 (parallel: false)

**总任务数**: 8个
**并行任务数**: 4个 (22, 24, 25, 26)
**串行任务数**: 4个 (20, 21, 23, 27)
**预估总工作量**: 232-296小时 (约12-15周)
