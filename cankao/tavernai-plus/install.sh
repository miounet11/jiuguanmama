#!/bin/bash

# TavernAI Plus 安装脚本

set -e

echo ""
echo "🎭 =============================================="
echo "🎭       TavernAI Plus - 安装向导             "
echo "🎭       下一代 AI 角色扮演平台               "
echo "🎭 =============================================="
echo ""

# 检查系统要求
echo "🔍 检查系统要求..."

# Node.js 版本检查
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js 版本过低，需要 v18 或更高版本"
        echo "   当前版本: $(node -v)"
        exit 1
    fi
    echo "✅ Node.js $(node -v)"
else
    echo "❌ Node.js 未安装"
    echo "   请访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# npm 版本检查
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm -v)"
else
    echo "❌ npm 未安装"
    exit 1
fi

# PostgreSQL 检查（可选）
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL 已安装"
else
    echo "⚠️  PostgreSQL 未安装 - 需要手动配置数据库连接"
    echo "   可以使用远程数据库或 Docker PostgreSQL"
fi

echo ""
echo "📦 安装项目依赖..."
npm install

echo ""
echo "🔧 配置项目..."

# 创建后端配置文件
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "📝 已创建后端配置文件: apps/api/.env"
    
    # 提示用户配置数据库
    echo ""
    echo "⚠️  请配置数据库连接："
    echo "   1. 编辑 apps/api/.env 文件"
    echo "   2. 修改 DATABASE_URL 为您的 PostgreSQL 连接地址"
    echo "   示例: postgresql://user:password@localhost:5432/tavernai"
    echo ""
    echo "🤖 AI 服务已预配置："
    echo "   - API: https://ttkk.inping.com/v1"
    echo "   - 模型: grok-3"
    echo "   - 密钥已包含在配置中"
fi

# 创建前端配置文件
if [ ! -f "apps/web/.env" ]; then
    cat > apps/web/.env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=TavernAI Plus
VITE_APP_DESCRIPTION=下一代 AI 角色扮演平台
EOF
    echo "📝 已创建前端配置文件: apps/web/.env"
fi

# 创建上传目录
mkdir -p apps/api/uploads/avatars
mkdir -p apps/api/uploads/images
echo "📁 已创建上传目录"

echo ""
echo "🎆 =============================================="
echo "🎆           安装完成！                       "
echo "🎆 =============================================="
echo ""
echo "🚀 下一步："
echo "   1. 配置数据库连接 (apps/api/.env)"
echo "   2. 初始化数据库: npm run db:init"
echo "   3. 启动项目: npm run dev 或 ./start.sh"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:5000"
echo ""
echo "📚 文档: https://github.com/yourusername/tavernai-plus"
echo "❤️  祝您使用愉快！"