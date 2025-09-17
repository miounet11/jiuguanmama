#!/bin/bash

# 快速启动脚本 - 最简单的方式启动项目

echo "🚀 TavernAI Plus - 快速启动"
echo "=============================="
echo ""

# 设置默认环境变量
export NODE_ENV=development
export DATABASE_URL="file:./dev.db"
export JWT_SECRET=b471355f84431d7550d90d9ac89393b5774ced7ba7d80218f79eb0f329443628
export JWT_REFRESH_SECRET=01e4463268642b422f81b26cca0224e1ef36a95029b1e76990e0a5a56271103b
export PORT=3001
export CLIENT_URL=http://localhost:3000

# 初始化数据库
echo "📦 初始化数据库..."
cd apps/api
npx prisma generate
npx prisma db push
cd ../..

# 安装 concurrently
echo "📦 安装启动工具..."
npm install -g concurrently 2>/dev/null

# 启动服务
echo ""
echo "🎉 启动服务..."
echo "=============================="
echo "📌 前端地址: http://localhost:3000"
echo "📌 API地址: http://localhost:3001"
echo "📌 管理后台: http://localhost:3000/admin"
echo ""
echo "📧 默认管理员: admin@tavernai.com"
echo "🔑 默认密码: Admin123!@#"
echo "=============================="
echo ""

# 同时启动前端和后端
npx concurrently \
    --names "API,WEB" \
    --prefix-colors "yellow,cyan" \
    "cd apps/api && npm run dev" \
    "cd apps/web && npm run dev"
