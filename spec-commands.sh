#!/bin/bash

# Spec-Kit 命令包装器
# 用法: source spec-commands.sh

SPEC_KIT_PATH="/Users/lu/Documents/jiuguanbaba/spec-kit"

# Constitution 命令
constitution() {
    echo "🏛️ 正在运行 Constitution 命令..."
    uvx --from "$SPEC_KIT_PATH" specify constitution "$@"
}

# Specify 命令
specify() {
    echo "📋 正在运行 Specify 命令..."
    uvx --from "$SPEC_KIT_PATH" specify spec "$@"
}

# Plan 命令
plan() {
    echo "📐 正在运行 Plan 命令..."
    uvx --from "$SPEC_KIT_PATH" specify plan "$@"
}

# Tasks 命令
tasks() {
    echo "✅ 正在运行 Tasks 命令..."
    uvx --from "$SPEC_KIT_PATH" specify tasks "$@"
}

# Implement 命令
implement() {
    echo "⚡ 正在运行 Implement 命令..."
    uvx --from "$SPEC_KIT_PATH" specify implement "$@"
}

# 检查命令
spec_check() {
    echo "🔍 检查 Spec-Kit 工具..."
    uvx --from "$SPEC_KIT_PATH" specify check
}

# 显示帮助
spec_help() {
    echo "🌱 Spec-Kit 命令包装器"
    echo ""
    echo "可用命令:"
    echo "  constitution  - 创建项目治理原则"
    echo "  specify       - 描述要构建的功能"
    echo "  plan          - 创建技术实施计划"
    echo "  tasks         - 将计划分解为任务"
    echo "  implement     - 执行实施"
    echo "  spec_check    - 检查工具安装"
    echo "  spec_help     - 显示此帮助"
    echo ""
    echo "示例:"
    echo "  constitution \"Create principles focused on code quality, testing standards\""
    echo "  specify \"Build a photo album organizer with drag-and-drop functionality\""
    echo "  plan \"Use Vite with vanilla HTML, CSS, and JavaScript\""
    echo ""
}

echo "✅ Spec-Kit 命令包装器已加载"
echo "💡 运行 'spec_help' 查看可用命令"