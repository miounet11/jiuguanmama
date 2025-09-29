#!/bin/bash

# 江湖风云：武侠崛起世界初始化脚本
# 用于清空数据库并重新填充江湖风云世界的种子数据

set -e

echo "🏮 江湖风云：武侠崛起世界初始化开始..."

# 检查是否在正确的目录
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ 错误: 请在 tavernai-plus/apps/api 目录下运行此脚本"
    exit 1
fi

# 备份现有数据库（如果存在）
if [ -f "prisma/dev.db" ]; then
    echo "💾 备份现有数据库..."
    cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 重置数据库
echo "🗑️ 重置数据库..."
npx prisma migrate reset --force --skip-seed

# 生成 Prisma Client
echo "⚡ 生成 Prisma Client..."
npx prisma generate

# 运行江湖风云世界种子数据
echo "🌍 填充江湖风云世界数据..."
npx ts-node prisma/seed-jianghu-wuxia.ts

echo "✅ 江湖风云：武侠崛起世界初始化完成！"
echo ""
echo "📊 已创建的内容："
echo "   - 管理员账户: admin@jianghu-wuxia.com (密码: Admin123!@#)"
echo "   - 测试用户: 2个"
echo "   - 世界剧本: 江湖风云：武侠崛起"
echo "   - 核心角色: 柳烟儿、慕容渊、萧尘、殷红"
echo "   - 世界信息: 5个条目"
echo ""
echo "🚀 现在可以启动服务器："
echo "   npm run dev"
echo ""
echo "🔍 查看数据库："
echo "   npx prisma studio"
