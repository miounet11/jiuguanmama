# 源代码树结构

## 现有项目结构
```
tavernai-plus/
├── apps/
│   ├── api/                    # Express后端
│   │   ├── src/
│   │   │   ├── routes/         # API路由
│   │   │   ├── services/       # 业务逻辑
│   │   │   ├── middleware/     # 中间件
│   │   │   └── models/         # 数据模型
│   │   └── prisma/            # 数据库配置
│   └── web/                   # Vue前端
│       ├── src/
│       │   ├── views/         # 页面组件
│       │   ├── components/    # 通用组件
│       │   ├── stores/        # Pinia状态
│       │   └── services/      # API服务
├── packages/                  # 共享包
└── docs/                     # 项目文档
```

## 新文件组织
```
tavernai-plus/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/               # 新增：配置管理
│   │   │   │   ├── llm.config.ts     # LLM配置
│   │   │   │   └── monitoring.config.ts
│   │   │   ├── services/
│   │   │   │   ├── llm-manager.ts    # 新增：LLM管理服务
│   │   │   │   ├── multi-chat.ts     # 新增：多角色聊天
│   │   │   │   └── monitoring.ts     # 新增：监控服务
│   │   │   ├── middleware/
│   │   │   │   ├── monitoring.ts     # 新增：监控中间件
│   │   │   │   └── error-handler.ts  # 增强：错误处理
│   │   │   └── utils/
│   │   │       ├── logger.ts         # 新增：日志工具
│   │   │       └── metrics.ts        # 新增：指标收集
│   │   └── tests/                    # 新增：测试套件
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   ├── chat/             # 现有：聊天组件
│       │   │   │   ├── MultiChatRoom.vue  # 新增：多角色聊天室
│       │   │   │   ├── CharacterSummoner.vue # 新增：角色召唤
│       │   │   │   └── ConversationFlow.vue  # 新增：对话流控制
│       │   │   ├── llm/              # 新增：LLM配置组件
│       │   │   │   ├── ConfigPanel.vue
│       │   │   │   └── ModelSelector.vue
│       │   │   └── monitoring/       # 新增：监控仪表板
│       │   │       └── Dashboard.vue
│       │   ├── stores/
│       │   │   ├── llm.ts           # 新增：LLM状态管理
│       │   │   ├── multiChat.ts     # 新增：多聊状态
│       │   │   └── monitoring.ts    # 新增：监控状态
│       │   └── styles/
│       │       └── quack-theme.scss  # 新增：QuackAI主题样式
├── docker/                          # 新增：Docker配置
│   ├── docker-compose.prod.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
└── monitoring/                      # 新增：监控配置
    ├── prometheus.yml
    └── grafana/
```

## 集成指导原则

- **文件命名**: 继续使用camelCase（JavaScript）和kebab-case（Vue组件）
- **文件夹组织**: 按功能模块组织，新功能放在对应的功能文件夹内
- **导入导出模式**: 遵循现有ES6模块导入模式，保持import/export一致性