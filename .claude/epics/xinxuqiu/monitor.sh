#!/bin/bash

echo "🎯 Epic xinxuqiu 执行状态监控"
echo "================================"

# 显示分支状态
echo "📍 当前分支信息:"
cd /Users/lu/Documents/epic-xinxuqiu
echo "  主项目: $(git branch --show-current) ($(git log -1 --pretty=format:"%h %s"))"

cd /Users/lu/Documents/jiuguanbaba
echo "  管理项目: $(git branch --show-current)"
echo ""

# 检查活跃代理状态
echo "🤖 活跃代理状态:"
if [[ -f .claude/epics/xinxuqiu/execution-status.md ]]; then
  grep "Agent-" .claude/epics/xinxuqiu/execution-status.md
else
  echo "  无活跃代理"
fi
echo ""

# 显示最近的提交
echo "📝 最近的工作进展:"
cd /Users/lu/Documents/epic-xinxuqiu
git log --oneline -5 | head -5
echo ""

# 检查文件变更
echo "📊 当前变更状态:"
git status --porcelain | head -10
if [[ $(git status --porcelain | wc -l) -gt 10 ]]; then
  echo "... (还有更多变更)"
fi

echo ""
echo "💡 使用以下命令查看详细状态:"
echo "   /pm:epic-status xinxuqiu"
echo "   git log --oneline -10  # 查看更多提交"
echo "   git diff --stat        # 查看变更统计"
