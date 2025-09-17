#!/bin/bash

echo "======================================"
echo "TavernAI Plus 系统验证"
echo "======================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "1. 检查服务状态..."
echo "-------------------"

# 检查前端服务
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}✅ 前端服务 (端口 3000): 正常运行${NC}"
else
    echo -e "${RED}❌ 前端服务 (端口 3000): 未运行${NC}"
fi

# 检查API服务
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null | grep -q "200\|404"; then
    echo -e "${GREEN}✅ API服务 (端口 3001): 正常运行${NC}"
else
    echo -e "${YELLOW}⚠️  API服务 (端口 3001): 可能未运行${NC}"
fi

echo ""
echo "2. 检查关键文件..."
echo "-------------------"

# 检查关键文件
FILES=(
    "apps/web/src/main.ts"
    "apps/web/src/App.vue"
    "apps/web/src/router/index.ts"
    "apps/web/src/views/HomePage.vue"
    "apps/web/src/utils/axios.ts"
    "apps/web/src/stores/user.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file 存在${NC}"
    else
        echo -e "${RED}❌ $file 缺失${NC}"
    fi
done

echo ""
echo "3. 测试页面访问..."
echo "-------------------"

# 测试主页
RESPONSE=$(curl -s http://localhost:3000)
if echo "$RESPONSE" | grep -q '<div id="app"></div>'; then
    echo -e "${GREEN}✅ 主页HTML加载正常${NC}"
else
    echo -e "${RED}❌ 主页HTML加载异常${NC}"
fi

# 测试Vue应用
if curl -s http://localhost:3000/src/main.ts | grep -q "createApp"; then
    echo -e "${GREEN}✅ Vue应用入口正常${NC}"
else
    echo -e "${RED}❌ Vue应用入口异常${NC}"
fi

echo ""
echo "======================================"
echo "访问地址："
echo "- 前端: http://localhost:3000"
echo "- API: http://localhost:3001"
echo "- 调试页面: http://localhost:3000/debug.html"
echo "- Vue测试: http://localhost:3000/test-vue.html"
echo "======================================"
echo ""
echo "如果页面无法显示，请："
echo "1. 打开浏览器开发者工具 (F12)"
echo "2. 查看Console控制台是否有错误"
echo "3. 尝试清除缓存并强制刷新 (Ctrl+Shift+R)"
echo "4. 使用无痕模式访问"
echo "======================================"
