#!/bin/bash

# TavernAI Plus 本地启动脚本
# 用于在本地开发环境快速启动项目

echo "========================================="
echo "  TavernAI Plus - 本地开发环境启动"
echo "========================================="
echo ""

# 检查 Node.js 版本
required_node_version="18"
current_node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$current_node_version" -lt "$required_node_version" ]; then
    echo "❌ 错误：需要 Node.js v$required_node_version 或更高版本"
    echo "   当前版本：v$current_node_version"
    echo "   请升级 Node.js：https://nodejs.org"
    exit 1
fi

echo "✅ Node.js 版本检查通过 (v$current_node_version)"

# 检查 PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL 已安装"
else
    echo "⚠️  警告：未检测到 PostgreSQL"
    echo "   使用 SQLite 作为替代数据库"
    export DATABASE_URL="file:./dev.db"
fi

# 检查 Redis（可选）
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis 服务运行中"
    else
        echo "⚠️  警告：Redis 未运行，某些功能可能受限"
    fi
else
    echo "ℹ️  提示：Redis 未安装（可选）"
fi

# 加载环境变量
if [ -f .env.local ]; then
    echo "✅ 加载本地环境配置 (.env.local)"
    export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
    echo "✅ 加载环境配置 (.env)"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  警告：未找到环境配置文件"
    echo "   使用默认配置..."
fi

# 安装依赖
echo ""
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
else
    echo "   依赖已安装，跳过..."
fi

# 初始化数据库
echo ""
echo "🗄️  初始化数据库..."
cd apps/api

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
if [ "$DATABASE_URL" != "" ]; then
    npx prisma migrate deploy 2>/dev/null || {
        echo "   首次运行，创建数据库架构..."
        npx prisma migrate dev --name init
    }
else
    echo "   使用 SQLite 数据库"
    npx prisma db push
fi

# 创建种子数据
echo "   创建初始数据..."
npx prisma db seed 2>/dev/null || echo "   种子数据已存在"

cd ../..

# 创建必要的目录
echo ""
echo "📁 创建必要目录..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

# 启动服务
echo ""
echo "🚀 启动服务..."
echo "========================================="
echo ""

# 使用 concurrently 同时启动前后端
if command -v npx &> /dev/null; then
    # 检查是否安装了 concurrently
    if ! npx concurrently --version &> /dev/null; then
        echo "安装 concurrently..."
        npm install -g concurrently
    fi

    echo "启动开发服务器..."
    echo ""
    echo "📌 访问地址："
    echo "   前端：http://localhost:3000"
    echo "   API：http://localhost:3001"
    echo "   管理后台：http://localhost:3000/admin"
    echo ""
    echo "📌 默认管理员账号："
    echo "   邮箱：admin@tavernai.com"
    echo "   密码：Admin123!@#"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo "========================================="

    # 同时启动前端和后端
    npx concurrently \
        --names "API,WEB" \
        --prefix-colors "bgBlue.bold,bgGreen.bold" \
        "cd apps/api && npm run dev" \
        "cd apps/web && npm run dev"
else
    # 如果没有 concurrently，使用传统方式
    echo "启动 API 服务器..."
    cd apps/api && npm run dev &
    API_PID=$!

    echo "启动 Web 服务器..."
    cd ../web && npm run dev &
    WEB_PID=$!

    echo ""
    echo "📌 访问地址："
    echo "   前端：http://localhost:3000"
    echo "   API：http://localhost:3001"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo "========================================="

    # 等待进程
    wait $API_PID $WEB_PID
fi
