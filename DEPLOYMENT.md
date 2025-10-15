# 本地部署指南

## 项目概述

九冠巴巴是一个综合性的AI角色扮演和内容创作平台，包含以下主要组件：

- **SillyTavern**: LLM前端应用，用于AI角色扮演
- **Content Creation Toolkit**: 内容创建工具包，用于角色和场景制作
- **Spec Kit**: 规范驱动开发工具
- **Claude Code PM**: 项目管理工具

## 系统要求

- **Node.js**: >= 18.0.0 (推荐最新LTS版本)
- **Python**: >= 3.11 (用于Spec Kit)
- **Git**: 用于版本控制
- **uv**: Python包管理器 (用于Spec Kit)

## 快速启动

1. **克隆项目** (如果还没有的话):
   ```bash
   git clone <repository-url>
   cd jiuguanbaba
   ```

2. **运行启动脚本**:
   ```bash
   ./start-project.sh
   ```

3. **选择启动选项**:
   - 选择 1 启动 SillyTavern
   - 选择 2 查看详细使用指南

## 手动部署步骤

### 1. 环境检查

```bash
# 检查 Node.js
node --version  # 应 >= 18.0.0

# 检查 Python
python3 --version  # 应 >= 3.11

# 检查 Git
git --version

# 检查 uv (可选，用于 Spec Kit)
uv --version
```

### 2. 部署 SillyTavern

```bash
cd SillyTavern
npm install
npm start
```

SillyTavern 将在 `http://localhost:8000` 启动。

### 3. 部署 Content Creation Toolkit

```bash
cd content-creation-toolkit
npm install
```

使用命令:
```bash
npm run create    # 创建角色卡
npm run validate  # 验证内容
npm run import    # 导入内容
```

### 4. 部署 Spec Kit (可选)

```bash
cd spec-kit
uv sync
```

使用命令:
```bash
uv run specify init <project-name>  # 初始化新项目
```

## 配置说明

### SillyTavern 配置

主要配置文件: `SillyTavern/config.yaml`

重要配置项:
- `port`: 服务器端口 (默认 8000)
- `whitelistMode`: 白名单模式
- `enableUserAccounts`: 用户账户系统

### 环境变量

可以设置以下环境变量来自定义行为:

```bash
# SillyTavern
export SILLYTAVERN_PORT=8000
export SILLYTAVERN_DATA=./data

# Spec Kit
export GITHUB_TOKEN=your_github_token  # 用于 GitHub 集成
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口使用情况
   lsof -i :8000

   # 修改配置文件中的端口
   # 编辑 SillyTavern/config.yaml
   port: 8001
   ```

2. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Python 依赖问题**
   ```bash
   # 使用 uv 重新同步
   cd spec-kit
   rm -rf .venv
   uv sync
   ```

### 日志查看

```bash
# SillyTavern 日志
tail -f SillyTavern/logs/app.log

# 系统日志
tail -f /var/log/system.log
```

## 开发模式

### SillyTavern 开发

```bash
cd SillyTavern
npm run debug  # 调试模式
```

### Content Creation Toolkit 开发

```bash
cd content-creation-toolkit
npm run test   # 运行测试
```

## 生产部署

对于生产环境，建议使用 Docker 或容器化部署:

```bash
# 使用 Docker Compose (如果有的话)
docker-compose up -d

# 或直接使用 Dockerfile
docker build -t sillytavern .
docker run -p 8000:8000 sillytavern
```

## 项目结构

```
jiuguanbaba/
├── SillyTavern/                 # 主应用
│   ├── config.yaml             # 配置文件
│   ├── server.js              # 服务器入口
│   └── public/                # 前端资源
├── content-creation-toolkit/    # 内容创建工具
│   ├── tools/                 # 工具脚本
│   └── schemas/              # 数据模式
├── spec-kit/                   # 规范驱动开发工具
├── docs/                       # 项目文档
├── start-project.sh           # 启动脚本
└── README.md                  # 项目说明
```

## 支持

如果遇到问题，请查看:

1. [SillyTavern 文档](https://docs.sillytavern.app/)
2. 项目 Issues
3. 社区 Discord

## 更新项目

```bash
# 更新所有组件
git pull

# 重新安装依赖
cd SillyTavern && npm install
cd ../content-creation-toolkit && npm install
cd ../spec-kit && uv sync
```
