#!/bin/bash

# TavernAI Plus 启动脚本

echo "🎭 TavernAI Plus - AI 角色扮演平台"
echo "======================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查 PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL 未安装，请确保已配置数据库连接"
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    npm install
fi

# 检查后端 .env 文件
if [ ! -f "apps/api/.env" ]; then
    echo "📝 创建后端配置文件..."
    cp apps/api/.env.example apps/api/.env
    echo "⚠️  请编辑 apps/api/.env 文件配置数据库连接"
    echo "   默认 NewAPI 配置已就绪"
fi

# 检查前端 .env 文件
if [ ! -f "apps/web/.env" ]; then
    echo "📝 创建前端配置文件..."
    cat > apps/web/.env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=TavernAI Plus
EOF
fi

# 数据库迁移
echo "🔄 运行数据库迁移..."
cd apps/api
npx prisma generate
npx prisma migrate deploy
cd ../..

# 启动服务
echo ""
echo "🚀 启动服务..."
echo "======================================"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:5000"
echo "API 文档: http://localhost:5000/api-docs"
echo "======================================"
echo ""

# 并行启动前端和后端
npm run dev