#!/usr/bin/env node

/**
 * TavernAI Plus 集成测试脚本
 * 用于验证前后端功能的完整性
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// 测试配置
const CONFIG = {
  API_BASE_URL: 'http://localhost:4000',
  WEB_BASE_URL: 'http://localhost:3000',
  TEST_TIMEOUT: 30000,
  RETRY_COUNT: 3
}

// 测试结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
}

// 工具函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString()
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  }
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 测试框架
class TestRunner {
  constructor() {
    this.tests = []
  }

  async run() {
    log('🚀 开始TavernAI Plus集成测试', 'info')

    for (const test of this.tests) {
      await this.runTest(test)
    }

    this.printResults()
  }

  async runTest(test) {
    results.total++

    try {
      log(`🧪 测试: ${test.name}`, 'info')
      await test.fn()
      log(`✅ 通过: ${test.name}`, 'success')
      results.passed++
    } catch (error) {
      log(`❌ 失败: ${test.name} - ${error.message}`, 'error')
      results.failed++
      results.errors.push({
        test: test.name,
        error: error.message,
        stack: error.stack
      })
    }
  }

  test(name, fn) {
    this.tests.push({ name, fn })
  }

  printResults() {
    log('\n📊 测试结果总结', 'info')
    log(`总测试数: ${results.total}`, 'info')
    log(`通过: ${results.passed}`, 'success')
    log(`失败: ${results.failed}`, results.failed > 0 ? 'error' : 'info')

    if (results.errors.length > 0) {
      log('\n❌ 错误详情:', 'error')
      results.errors.forEach(error => {
        log(`  - ${error.test}: ${error.error}`, 'error')
      })
    }

    const successRate = (results.passed / results.total * 100).toFixed(2)
    log(`\n成功率: ${successRate}%`, successRate >= 80 ? 'success' : 'warning')
  }
}

const runner = new TestRunner()

// 1. 健康检查测试
runner.test('API服务器健康检查', async () => {
  const response = await axios.get(`${CONFIG.API_BASE_URL}/health`, {
    timeout: CONFIG.TEST_TIMEOUT
  })

  if (response.status !== 200) {
    throw new Error(`健康检查失败，状态码: ${response.status}`)
  }

  if (response.data.status !== 'ok') {
    throw new Error(`服务状态异常: ${response.data.status}`)
  }

  log(`  - 环境: ${response.data.environment}`, 'info')
  log(`  - AI服务: ${response.data.services.ai.configured ? '已配置' : '未配置'}`, 'info')
})

// 2. 模型API测试
runner.test('获取可用模型列表', async () => {
  const response = await axios.get(`${CONFIG.API_BASE_URL}/api/models`, {
    timeout: CONFIG.TEST_TIMEOUT
  })

  if (response.status !== 200) {
    throw new Error(`获取模型列表失败，状态码: ${response.status}`)
  }

  if (!response.data.success) {
    throw new Error(`API返回失败: ${response.data.message}`)
  }

  if (!Array.isArray(response.data.data)) {
    throw new Error('模型数据格式错误')
  }

  log(`  - 可用模型数量: ${response.data.data.length}`, 'info')

  // 验证每个模型都有必要字段
  for (const model of response.data.data) {
    if (!model.id || !model.name || !model.provider) {
      throw new Error(`模型 ${model.id} 缺少必要字段`)
    }
  }
})

// 3. 角色API测试
runner.test('获取角色列表', async () => {
  const response = await axios.get(`${CONFIG.API_BASE_URL}/api/characters`, {
    timeout: CONFIG.TEST_TIMEOUT
  })

  if (response.status !== 200) {
    throw new Error(`获取角色列表失败，状态码: ${response.status}`)
  }

  if (!response.data.success) {
    throw new Error(`API返回失败: ${response.data.message}`)
  }

  log(`  - 角色数量: ${response.data.characters?.length || 0}`, 'info')
})

// 4. 文件结构验证测试
runner.test('验证关键文件存在', async () => {
  const requiredFiles = [
    // 前端文件
    'apps/web/src/views/chat/ChatSession.vue',
    'apps/web/src/components/common/ModelSelector.vue',
    'apps/web/src/components/chat/ChatInputMobile.vue',
    'apps/web/src/components/character/CharacterEditDialog.vue',
    'apps/web/src/components/character/AICharacterGenerator.vue',
    'apps/web/src/components/advanced/SillyTavernControls.vue',
    'apps/web/src/components/chat/EmojiPicker.vue',
    'apps/web/src/components/chat/MentionPanel.vue',

    // 后端文件
    'apps/api/src/server.ts',
    'apps/api/src/services/ai.ts',
    'apps/api/src/routes/chat.ts',
    'apps/api/src/routes/models.ts',
    'apps/api/src/routes/character.ts',

    // 配置文件
    'apps/web/package.json',
    'apps/api/package.json',
    'turbo.json'
  ]

  const missingFiles = []

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), 'cankao/tavernai-plus', file)
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file)
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`缺少关键文件: ${missingFiles.join(', ')}`)
  }

  log(`  - 验证了 ${requiredFiles.length} 个关键文件`, 'info')
})

// 5. TypeScript编译测试
runner.test('TypeScript编译检查', async () => {
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)

  try {
    // 检查前端TypeScript
    await execAsync('cd cankao/tavernai-plus/apps/web && npx tsc --noEmit', {
      timeout: CONFIG.TEST_TIMEOUT
    })
    log('  - 前端TypeScript编译通过', 'info')

    // 检查后端TypeScript
    await execAsync('cd cankao/tavernai-plus/apps/api && npx tsc --noEmit', {
      timeout: CONFIG.TEST_TIMEOUT
    })
    log('  - 后端TypeScript编译通过', 'info')

  } catch (error) {
    if (error.stdout || error.stderr) {
      throw new Error(`TypeScript编译错误: ${error.stdout || error.stderr}`)
    }
    throw error
  }
})

// 6. 组件完整性测试
runner.test('验证Vue组件完整性', async () => {
  const componentFiles = [
    'apps/web/src/views/chat/ChatSession.vue',
    'apps/web/src/components/common/ModelSelector.vue',
    'apps/web/src/components/chat/ChatInputMobile.vue',
    'apps/web/src/components/character/CharacterEditDialog.vue'
  ]

  for (const file of componentFiles) {
    const filePath = path.join(process.cwd(), 'cankao/tavernai-plus', file)
    const content = fs.readFileSync(filePath, 'utf8')

    // 检查Vue组件基本结构
    if (!content.includes('<template>')) {
      throw new Error(`${file} 缺少template部分`)
    }

    if (!content.includes('<script setup lang="ts">')) {
      throw new Error(`${file} 未使用TypeScript setup语法`)
    }

    if (!content.includes('<style')) {
      throw new Error(`${file} 缺少样式部分`)
    }
  }

  log(`  - 验证了 ${componentFiles.length} 个Vue组件`, 'info')
})

// 7. 功能特性验证测试
runner.test('验证核心功能实现', async () => {
  const chatSessionPath = path.join(process.cwd(), 'cankao/tavernai-plus/apps/web/src/views/chat/ChatSession.vue')
  const content = fs.readFileSync(chatSessionPath, 'utf8')

  const requiredFeatures = [
    'sendStreamingMessage', // 流式响应
    'virtualScroll', // 虚拟滚动
    'sendMessage', // 消息发送
    'regenerateMessage', // 消息重新生成
    'handleScroll', // 滚动处理
    'copyMessage', // 消息复制
    'exportChat', // 对话导出
    'toggleFullscreen' // 全屏切换
  ]

  const missingFeatures = []

  for (const feature of requiredFeatures) {
    if (!content.includes(feature)) {
      missingFeatures.push(feature)
    }
  }

  if (missingFeatures.length > 0) {
    throw new Error(`ChatSession缺少功能: ${missingFeatures.join(', ')}`)
  }

  log(`  - 验证了 ${requiredFeatures.length} 个核心功能`, 'info')
})

// 8. API路由验证测试
runner.test('验证API路由完整性', async () => {
  const serverPath = path.join(process.cwd(), 'cankao/tavernai-plus/apps/api/src/server.ts')
  const content = fs.readFileSync(serverPath, 'utf8')

  const requiredRoutes = [
    '/api/auth',
    '/api/characters',
    '/api/chat',
    '/api/chats',
    '/api/models',
    '/api/marketplace',
    '/api/ai'
  ]

  const missingRoutes = []

  for (const route of requiredRoutes) {
    if (!content.includes(`'${route}'`) && !content.includes(`"${route}"`)) {
      missingRoutes.push(route)
    }
  }

  if (missingRoutes.length > 0) {
    throw new Error(`服务器缺少路由: ${missingRoutes.join(', ')}`)
  }

  log(`  - 验证了 ${requiredRoutes.length} 个API路由`, 'info')
})

// 9. 移动端适配验证测试
runner.test('验证移动端适配', async () => {
  const mobileComponentPath = path.join(process.cwd(), 'cankao/tavernai-plus/apps/web/src/components/chat/ChatInputMobile.vue')
  const content = fs.readFileSync(mobileComponentPath, 'utf8')

  const mobileFeatures = [
    '@media', // 响应式媒体查询
    'touch', // 触摸支持
    'mobile', // 移动端相关
    'safe-area', // 安全区域
    'viewport' // 视口配置
  ]

  let foundFeatures = 0

  for (const feature of mobileFeatures) {
    if (content.toLowerCase().includes(feature)) {
      foundFeatures++
    }
  }

  if (foundFeatures < 3) {
    throw new Error(`移动端适配不足，仅实现了 ${foundFeatures}/${mobileFeatures.length} 个特性`)
  }

  log(`  - 实现了 ${foundFeatures}/${mobileFeatures.length} 个移动端特性`, 'info')
})

// 10. 数据库配置验证测试
runner.test('验证数据库配置', async () => {
  const prismaSchemaPath = path.join(process.cwd(), 'cankao/tavernai-plus/prisma/schema.prisma')

  if (!fs.existsSync(prismaSchemaPath)) {
    throw new Error('Prisma schema文件不存在')
  }

  const content = fs.readFileSync(prismaSchemaPath, 'utf8')

  const requiredModels = [
    'model User',
    'model Character',
    'model ChatSession',
    'model Message'
  ]

  const missingModels = []

  for (const model of requiredModels) {
    if (!content.includes(model)) {
      missingModels.push(model)
    }
  }

  if (missingModels.length > 0) {
    throw new Error(`数据库缺少模型: ${missingModels.join(', ')}`)
  }

  log(`  - 验证了 ${requiredModels.length} 个数据库模型`, 'info')
})

// 运行测试
async function main() {
  try {
    await runner.run()

    // 生成测试报告
    const report = {
      timestamp: new Date().toISOString(),
      results,
      config: CONFIG,
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    }

    const reportPath = path.join(process.cwd(), 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`\n📄 测试报告已保存: ${reportPath}`, 'info')

    // 根据测试结果设置退出码
    process.exit(results.failed > 0 ? 1 : 0)

  } catch (error) {
    log(`测试运行失败: ${error.message}`, 'error')
    process.exit(1)
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的Promise拒绝: ${reason}`, 'error')
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'error')
  process.exit(1)
})

// 启动测试
if (require.main === module) {
  main()
}

module.exports = { TestRunner, CONFIG }
