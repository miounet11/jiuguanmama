#!/bin/bash

# 九冠巴巴项目启动脚本
# 启动所有组件并提供使用指南

echo "🚀 启动九冠巴巴项目..."
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 >= 18，当前版本: $(node --version)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python >= 3.11"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d'.' -f2)
if [ "$PYTHON_VERSION" -lt 11 ]; then
    echo "❌ Python 版本过低，需要 >= 3.11，当前版本: $(python3 --version)"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

echo ""
echo "📋 项目组件状态:"
echo "========================================"

# 检查 SillyTavern
if [ -d "SillyTavern" ] && [ -d "SillyTavern/node_modules" ]; then
    echo "✅ SillyTavern: 已准备就绪"
else
    echo "❌ SillyTavern: 未正确安装"
fi

# 检查 content-creation-toolkit
if [ -d "content-creation-toolkit" ] && [ -d "content-creation-toolkit/node_modules" ]; then
    echo "✅ Content Creation Toolkit: 已准备就绪"
else
    echo "❌ Content Creation Toolkit: 未正确安装"
fi

# 检查 spec-kit
if [ -d "spec-kit" ]; then
    echo "✅ Spec Kit: 已准备就绪 (需要时可通过 uv sync 安装)"
else
    echo "❌ Spec Kit: 目录不存在"
fi

echo ""
echo "🎯 启动选项:"
echo "========================================"
echo "1. 启动 SillyTavern (LLM 前端应用)"
echo "2. 显示使用指南"
echo "3. 退出"

read -p "请选择 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动 SillyTavern..."
        echo "========================================"
        echo "SillyTavern 将在 http://localhost:8000 启动"
        echo "按 Ctrl+C 停止服务"
        echo ""
        cd SillyTavern
        npm start
        ;;
    2)
        echo ""
        echo "📖 使用指南"
        echo "========================================"
        echo ""
        echo "🎭 SillyTavern (LLM 前端):"
        echo "  启动: ./start-project.sh 然后选择 1"
        echo "  访问: http://localhost:8000"
        echo "  配置: SillyTavern/config.yaml"
        echo ""
        echo "🛠️  Content Creation Toolkit:"
        echo "  创建角色: cd content-creation-toolkit && npm run create"
        echo "  验证内容: cd content-creation-toolkit && npm run validate"
        echo "  导入内容: cd content-creation-toolkit && npm run import"
        echo ""
        echo "📋 Spec Kit (规范驱动开发):"
        echo "  初始化项目: cd spec-kit && uv run specify init <项目名>"
        echo "  详细文档: spec-kit/README.md"
        echo ""
        echo "🔧 Claude Code PM (项目管理):"
        echo "  初始化: /pm:init"
        echo "  创建PRD: /pm:prd-new <功能名>"
        echo "  详细文档: README.md"
        echo ""
        ;;
    3)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
