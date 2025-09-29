
# Implementation Plan: 核心竞争力提升方案

**Branch**: `001-core-competitiveness-enhancement` | **Date**: 2025-09-29 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-competitiveness-enhancement/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
基于深入分析 SillyTavern 产品特性和源码架构，结合 TavernAI Plus 项目现状，制定能够大幅度提升核心竞争力且开发成本低的功能优化方案。核心技术方案包括：实时流式体验优化(SSE)、插件扩展系统、智能缓存架构、高级用户配置系统和社区生态增强。预期在3个月内实现用户活跃度提升200%、系统性能提升300%的目标。

## Technical Context
**Language/Version**: TypeScript 5.3, Node.js 20+
**Primary Dependencies**: Vue 3, Express, Prisma ORM, Redis, Socket.io
**Storage**: SQLite (development), PostgreSQL (production), Redis (缓存/消息队列)
**Testing**: Jest + ts-jest (后端), Vitest (前端), Supertest (API测试)
**Target Platform**: Linux 服务器, Docker 容器化, 支持云部署
**Project Type**: web - Monorepo 架构，前后端分离
**Performance Goals**: API响应 <200ms, WebSocket连接稳定性99%+, 支持1000+并发用户
**Constraints**: 保持向下兼容性, 内存使用增长<150%, 零停机部署
**Scale/Scope**: 企业级应用, 25K+ 代码行, 预期用户规模10K+

**服务器部署技术上下文**: 使用规划清楚的技术解决方案，我们后期会保持规划在服务器上部署

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 生产就绪开发原则 ✅
- **真实数据要求**: 所有扩展和缓存功能基于真实数据库设计，拒绝模拟数据
- **API端点完整性**: 新增的流式输出、插件管理等API都基于真实业务场景
- **种子数据支持**: 为插件系统和高级配置创建完整的测试数据

### 问题解决文档化 ✅
- **知识库建立**: 每个技术决策和实现方案都在文档中详细记录
- **决策记录**: SSE选择、插件架构、缓存策略的技术决策都有完整说明
- **回归预防**: 建立完整的变更追踪，防止功能回退

### 代码质量保证 ✅
- **TypeScript严格模式**: 所有新增代码都在严格类型检查下开发
- **架构兼容性**: 严格遵循现有 Vue3 + Express + Prisma 架构
- **错误处理**: 实现完整的错误处理和监控机制

### 安全优先原则 ⚠️
- **插件沙箱**: 需要特别关注插件系统的安全隔离设计
- **API安全**: 新增API端点需要完整的认证和权限控制
- **缓存安全**: Redis缓存需要加密存储敏感数据

### 持续集成与测试 ⚠️
- **测试覆盖**: 新功能需要建立完整的测试体系
- **性能测试**: 流式输出和并发处理需要专门的性能测试

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
cankao/tavernai-plus/                # 主项目目录
├── apps/
│   ├── api/                         # 后端API服务
│   │   ├── src/
│   │   │   ├── services/            # 新增：插件管理、缓存服务
│   │   │   │   ├── extension/       # 扩展系统服务
│   │   │   │   ├── cache/          # 缓存管理服务
│   │   │   │   └── streaming/      # 流式输出服务
│   │   │   ├── routes/             # 新增：扩展和流式API路由
│   │   │   │   ├── extensions.ts   # 插件管理API
│   │   │   │   ├── streaming.ts    # 流式输出API
│   │   │   │   └── advanced.ts     # 高级配置API
│   │   │   ├── middleware/         # 增强：插件安全中间件
│   │   │   └── types/              # 新增：扩展系统类型定义
│   │   └── tests/
│   │       ├── extension/          # 插件系统测试
│   │       ├── streaming/          # 流式输出测试
│   │       └── cache/              # 缓存系统测试
│   └── web/                        # 前端Web应用
│       ├── src/
│       │   ├── components/         # 增强：插件组件、流式组件
│       │   │   ├── streaming/      # 流式消息组件
│       │   │   ├── extensions/     # 插件管理组件
│       │   │   └── advanced/       # 高级配置组件
│       │   ├── stores/             # 新增：扩展和流式状态管理
│       │   │   ├── streaming.ts    # 流式消息状态
│       │   │   └── extensions.ts   # 插件管理状态
│       │   └── services/           # 新增：前端插件服务
│       └── tests/
│           ├── components/         # 组件单元测试
│           └── integration/        # 集成测试
├── packages/                       # 共享包
│   ├── extension-sdk/              # 新增：插件开发SDK
│   ├── streaming-client/           # 新增：流式客户端库
│   └── cache-utils/                # 新增：缓存工具库
└── tools/                          # 工具和脚本
    ├── extension-cli/              # 新增：插件开发CLI
    └── deployment/                 # 部署脚本
```

**Structure Decision**: 采用 Monorepo Web 应用架构，基于现有 TavernAI Plus 项目结构进行扩展。核心新增功能模块化设计，保持与现有架构的兼容性，支持独立开发和测试。

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
基于生成的设计文档创建实施任务：

1. **从API合约生成测试任务**:
   - streaming-api.yml → 15个流式输出API测试任务
   - extensions-api.yml → 20个插件系统API测试任务
   - advanced-config-api.yml → 12个高级配置API测试任务

2. **从数据模型生成实体任务**:
   - Extension系统 → 6个数据模型实现任务 [P]
   - StreamingSession → 4个流式会话实现任务 [P]
   - CacheItem → 3个缓存管理实现任务 [P]
   - AdvancedConfig → 4个高级配置实现任务 [P]

3. **从功能规范生成集成任务**:
   - 每个用户故事 → 对应的集成测试任务
   - 端到端业务流程验证任务

**Ordering Strategy**:
1. **Phase 1 (并行)**: 数据模型和API合约测试 [P]
2. **Phase 2 (依赖)**: 服务层实现 (依赖数据模型)
3. **Phase 3 (集成)**: 前端组件和UI集成
4. **Phase 4 (验证)**: 端到端测试和性能验证

**预期任务分布**:
- 📊 **数据层**: 17个任务 (数据库迁移、模型定义、索引优化)
- 🔧 **服务层**: 22个任务 (API实现、业务逻辑、缓存策略)
- 🎨 **前端层**: 18个任务 (组件开发、状态管理、UI集成)
- 🧪 **测试层**: 25个任务 (单元测试、集成测试、E2E测试)
- 🚀 **部署层**: 8个任务 (Docker配置、CI/CD、监控)

**总计**: 90个细粒度任务，预计16周完成

**关键并行执行点**:
- 数据模型实现可并行执行 (不同表之间独立)
- API端点实现可并行执行 (不同模块独立)
- 前端组件开发可并行执行 (组件间解耦)

**IMPORTANT**: 此阶段由 /tasks 命令执行，/plan 命令不执行具体任务生成

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

**Generated Artifacts**:
- [x] research.md - 完整的技术研究报告
- [x] data-model.md - 数据模型设计文档
- [x] contracts/streaming-api.yml - 流式输出API规范
- [x] contracts/extensions-api.yml - 插件系统API规范
- [x] contracts/advanced-config-api.yml - 高级配置API规范
- [x] quickstart.md - 快速启动和验证指南
- [x] CLAUDE.md - 更新的代理上下文文件

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
