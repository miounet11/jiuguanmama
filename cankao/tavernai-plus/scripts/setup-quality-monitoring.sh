#!/bin/bash

# TypeScript 质量监控设置脚本

set -e

echo "🔧 设置 TypeScript 质量监控环境..."

# 确保在项目根目录
cd "$(dirname "$0")/.."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查依赖
check_dependencies() {
    print_message $BLUE "📦 检查依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_message $RED "❌ Node.js 未安装"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_message $RED "❌ npm 未安装"
        exit 1
    fi

    print_message $GREEN "✅ 基础依赖检查通过"
}

# 安装质量检查工具
install_quality_tools() {
    print_message $BLUE "🛠️ 安装质量检查工具..."

    # 安装开发依赖
    npm install --save-dev \
        type-coverage \
        @typescript-eslint/eslint-plugin \
        @typescript-eslint/parser \
        eslint-plugin-vue \
        husky \
        lint-staged \
        concurrently \
        cross-env

    print_message $GREEN "✅ 质量检查工具安装完成"
}

# 设置 Husky
setup_husky() {
    print_message $BLUE "🪝 设置 Git hooks..."

    # 初始化 Husky
    npx husky install

    # 设置 prepare 脚本
    npm set-script prepare "husky install"

    # 创建 pre-commit hook
    npx husky add .husky/pre-commit "npm run pre-commit"

    # 创建 commit-msg hook
    npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'

    print_message $GREEN "✅ Git hooks 设置完成"
}

# 更新 package.json 脚本
update_package_scripts() {
    print_message $BLUE "📝 更新 package.json 脚本..."

    # 添加质量检查相关脚本
    npm set-script "type-check" "turbo run type-check"
    npm set-script "type-check:api" "cd apps/api && npx tsc --noEmit"
    npm set-script "type-check:web" "cd apps/web && npx vue-tsc --noEmit"
    npm set-script "type-coverage" "type-coverage --detail --strict"
    npm set-script "type-coverage:report" "type-coverage --detail --strict --reportFilePath reports/typescript/coverage.json"
    npm set-script "quality-check" "ts-node scripts/type-quality-check.ts"
    npm set-script "pre-commit" "lint-staged"
    npm set-script "lint:fix" "eslint . --ext .ts,.tsx,.vue --fix"
    npm set-script "format" "prettier --write ."
    npm set-script "validate" "npm run type-check && npm run lint && npm run test"

    print_message $GREEN "✅ package.json 脚本更新完成"
}

# 创建 lint-staged 配置
create_lint_staged_config() {
    print_message $BLUE "⚙️ 创建 lint-staged 配置..."

    cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.vue": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
EOF

    print_message $GREEN "✅ lint-staged 配置创建完成"
}

# 创建 ESLint 配置
create_eslint_config() {
    print_message $BLUE "🔍 创建 ESLint 配置..."

    cat > .eslintrc.js << 'EOF'
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript 特定规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // 一般规则
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    {
      files: ['apps/web/**/*.vue'],
      extends: [
        'plugin:vue/vue3-essential',
        'plugin:vue/vue3-strongly-recommended',
        'plugin:vue/vue3-recommended',
      ],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/require-default-prop': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.turbo/',
    'coverage/',
    '*.d.ts',
  ],
};
EOF

    print_message $GREEN "✅ ESLint 配置创建完成"
}

# 创建 Prettier 配置
create_prettier_config() {
    print_message $BLUE "💅 创建 Prettier 配置..."

    cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
EOF

    cat > .prettierignore << 'EOF'
node_modules/
dist/
.turbo/
coverage/
*.d.ts
.next/
.nuxt/
.output/
.vite/
EOF

    print_message $GREEN "✅ Prettier 配置创建完成"
}

# 创建 TypeScript 覆盖率配置
create_type_coverage_config() {
    print_message $BLUE "📊 创建类型覆盖率配置..."

    cat > .type-coverage.json << 'EOF'
{
  "atLeast": 95,
  "detail": true,
  "strict": true,
  "cache": true,
  "ignoreFiles": [
    "**/*.d.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ignoreCatch": true,
  "reportFilePath": "reports/typescript/type-coverage.json"
}
EOF

    print_message $GREEN "✅ 类型覆盖率配置创建完成"
}

# 创建 CommitLint 配置
create_commitlint_config() {
    print_message $BLUE "📝 创建 CommitLint 配置..."

    npm install --save-dev @commitlint/cli @commitlint/config-conventional

    cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式(不影响功能)
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建系统
        'ci',       // CI配置
        'chore',    // 其他
        'revert',   // 回滚
        'types',    // 类型定义
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
  },
};
EOF

    print_message $GREEN "✅ CommitLint 配置创建完成"
}

# 创建监控脚本的 package.json 配置
update_turbo_config() {
    print_message $BLUE "⚡ 更新 Turbo 配置..."

    # 读取现有的 turbo.json
    if [ -f "turbo.json" ]; then
        # 使用 Node.js 脚本更新 turbo.json
        node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));

        config.pipeline['type-check'] = {
          dependsOn: ['^build'],
          outputs: []
        };

        config.pipeline['lint'] = {
          outputs: []
        };

        config.pipeline['quality-check'] = {
          dependsOn: ['type-check', 'lint'],
          outputs: ['reports/**']
        };

        fs.writeFileSync('turbo.json', JSON.stringify(config, null, 2));
        "

        print_message $GREEN "✅ Turbo 配置更新完成"
    else
        print_message $YELLOW "⚠️ turbo.json 不存在，跳过更新"
    fi
}

# 创建报告目录
create_report_directories() {
    print_message $BLUE "📁 创建报告目录..."

    mkdir -p reports/typescript
    mkdir -p reports/eslint
    mkdir -p reports/coverage

    # 创建 .gitignore 条目（如果不存在）
    if ! grep -q "reports/" .gitignore 2>/dev/null; then
        echo -e "\n# Quality reports\nreports/" >> .gitignore
    fi

    print_message $GREEN "✅ 报告目录创建完成"
}

# 创建质量监控文档
create_quality_docs() {
    print_message $BLUE "📚 创建质量监控文档..."

    mkdir -p docs

    cat > docs/typescript-quality-guide.md << 'EOF'
# TypeScript 质量监控指南

## 概述

本项目使用自动化工具来确保 TypeScript 代码的质量和类型安全。

## 监控指标

### 1. 类型错误
- **目标**: 0 个类型错误
- **检查**: `npm run type-check`
- **自动化**: 每次提交时检查

### 2. 类型覆盖率
- **目标**: ≥ 95%
- **检查**: `npm run type-coverage`
- **报告**: `reports/typescript/type-coverage.json`

### 3. 代码质量
- **工具**: ESLint + TypeScript 规则
- **检查**: `npm run lint`
- **修复**: `npm run lint:fix`

## 工作流程

### 开发时检查
```bash
# 完整质量检查
npm run validate

# 单独检查
npm run type-check
npm run lint
npm run type-coverage
```

### Git Hooks
- **pre-commit**: 自动运行类型检查和代码格式化
- **commit-msg**: 检查提交消息格式

### CI/CD 集成
GitHub Actions 会在每次推送和 PR 时自动运行质量检查。

## 质量报告

### 生成报告
```bash
npm run quality-check
```

### 报告位置
- TypeScript 质量: `reports/typescript/`
- ESLint 报告: `reports/eslint/`
- 测试覆盖率: `reports/coverage/`

## 故障排除

### 常见问题
1. **类型错误**: 检查 `tsconfig.json` 配置
2. **覆盖率低**: 为未类型化代码添加类型注解
3. **ESLint 错误**: 运行 `npm run lint:fix` 自动修复

### 获取帮助
- 查看 [TypeScript 编码规范](../typescript-style-guide.md)
- 检查项目 Issues
- 咨询团队 TypeScript 专家
EOF

    print_message $GREEN "✅ 质量监控文档创建完成"
}

# 验证设置
verify_setup() {
    print_message $BLUE "🔍 验证设置..."

    # 检查脚本是否可执行
    if [ -x scripts/type-quality-check.ts ]; then
        print_message $GREEN "✅ 质量检查脚本可执行"
    else
        print_message $YELLOW "⚠️ 质量检查脚本权限可能需要调整"
    fi

    # 检查 Git hooks
    if [ -f .husky/pre-commit ]; then
        print_message $GREEN "✅ Pre-commit hook 已设置"
    else
        print_message $RED "❌ Pre-commit hook 设置失败"
    fi

    # 测试基本命令
    if npm run type-check --silent > /dev/null 2>&1; then
        print_message $GREEN "✅ TypeScript 检查命令正常"
    else
        print_message $YELLOW "⚠️ TypeScript 检查可能需要额外配置"
    fi

    print_message $GREEN "🎉 质量监控设置完成!"
}

# 主执行流程
main() {
    print_message $GREEN "🚀 开始设置 TypeScript 质量监控..."

    check_dependencies
    install_quality_tools
    setup_husky
    update_package_scripts
    create_lint_staged_config
    create_eslint_config
    create_prettier_config
    create_type_coverage_config
    create_commitlint_config
    update_turbo_config
    create_report_directories
    create_quality_docs
    verify_setup

    print_message $GREEN "✨ 设置完成! 现在可以运行以下命令:"
    print_message $BLUE "  npm run quality-check  # 完整质量检查"
    print_message $BLUE "  npm run validate        # 验证代码质量"
    print_message $BLUE "  npm run type-coverage   # 检查类型覆盖率"
}

# 执行主函数
main "$@"
