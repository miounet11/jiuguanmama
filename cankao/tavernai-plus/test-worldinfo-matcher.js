#!/usr/bin/env node

/**
 * 世界信息匹配引擎集成测试和性能测试脚本
 * 验证关键词匹配功能的正确性和性能
 */

const { performance } = require('perf_hooks')
const path = require('path')

// 设置测试环境
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// 动态导入ES模块
async function runTests() {
  console.log('🧪 世界信息匹配引擎测试套件')
  console.log('=' .repeat(60))

  try {
    // 初始化数据库和服务
    const { prisma } = await import('./apps/api/src/server.js')
    const { WorldInfoMatcher } = await import('./apps/api/src/services/worldInfoMatcher.js')

    // 创建测试数据
    await setupTestData(prisma)

    // 创建匹配器实例
    const matcher = new WorldInfoMatcher({
      maxRecursiveDepth: 3,
      maxActiveEntries: 10,
      performanceThreshold: 100,
      cacheConfig: {
        enabled: true,
        maxSize: 1000,
        ttl: 300000
      }
    })

    // 执行测试套件
    await runBasicMatchingTests(matcher)
    await runLogicOperatorTests(matcher)
    await runRegexTests(matcher)
    await runRecursiveTests(matcher, prisma)
    await runPerformanceTests(matcher)
    await runStressTests(matcher)

    console.log('\n✅ 所有测试完成！')
    console.log('\n📊 性能指标:')
    const metrics = matcher.getPerformanceMetrics()
    console.log(`  - 平均匹配时间: ${metrics.averageMatchTime.toFixed(2)}ms`)
    console.log(`  - 缓存命中率: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
    console.log(`  - 内存使用: ${(metrics.memoryUsage / 1024).toFixed(1)}KB`)
    console.log(`  - 递归调用次数: ${metrics.recursiveCallCount}`)

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

/**
 * 设置测试数据
 */
async function setupTestData(prisma) {
  console.log('📋 设置测试数据...')

  // 清理现有数据
  await prisma.worldInfoEntry.deleteMany()
  await prisma.scenario.deleteMany()
  await prisma.user.deleteMany()

  // 创建测试用户
  const testUser = await prisma.user.create({
    data: {
      id: 'test-user',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'test'
    }
  })

  // 创建测试场景
  const testScenario = await prisma.scenario.create({
    data: {
      id: 'test-scenario',
      userId: testUser.id,
      name: '测试场景',
      description: '用于测试世界信息匹配的场景'
    }
  })

  // 创建测试世界信息条目
  const entries = [
    {
      id: 'entry-1',
      scenarioId: testScenario.id,
      title: '艾尔登大陆',
      content: '艾尔登大陆是一个充满魔法与冒险的奇幻世界，由五大王国组成。这里有古老的魔法学院，传说中的圣剑，以及各种神奇的生物。',
      keywords: JSON.stringify(['艾尔登', '大陆', '王国', '奇幻世界']),
      priority: 90,
      insertDepth: 4,
      probability: 1.0,
      matchType: 'contains',
      caseSensitive: false,
      isActive: true,
      category: '地点'
    },
    {
      id: 'entry-2',
      scenarioId: testScenario.id,
      title: '魔法学院',
      content: '坐落在艾尔登大陆中心的魔法学院，是大陆上最古老的魔法教育机构。这里培养了无数强大的法师。',
      keywords: JSON.stringify(['魔法学院', '学院', '法师学院', '/魔法.*/gi']),
      priority: 80,
      insertDepth: 3,
      probability: 0.8,
      matchType: 'regex',
      caseSensitive: false,
      isActive: true,
      category: '地点'
    },
    {
      id: 'entry-3',
      scenarioId: testScenario.id,
      title: '圣剑传说',
      content: '传说中的圣剑埋藏在龙之山谷深处，只有被选中的勇者才能拔出。剑身闪烁着神圣的光芒。',
      keywords: JSON.stringify(['圣剑', '传说', '勇者', '神器*', '龙之山谷']),
      priority: 70,
      insertDepth: 5,
      probability: 0.9,
      matchType: 'wildcard',
      caseSensitive: false,
      isActive: true,
      category: '物品'
    },
    {
      id: 'entry-4',
      scenarioId: testScenario.id,
      title: '暗黑法师',
      content: '邪恶的暗黑法师威胁着整个大陆的和平。他们使用禁忌魔法，召唤恶魔军团。',
      keywords: 'NOT_ANY:["光明", "和平", "正义", "治愈"]',
      priority: 60,
      insertDepth: 4,
      probability: 1.0,
      matchType: 'contains',
      caseSensitive: false,
      isActive: true,
      category: '角色'
    },
    {
      id: 'entry-5',
      scenarioId: testScenario.id,
      title: '龙族历史',
      content: '古老的龙族曾经统治这片大陆。他们的宝藏至今仍然隐藏在各处。',
      keywords: JSON.stringify(['龙族', '龙', '宝藏', '古老']),
      priority: 50,
      insertDepth: 6,
      probability: 0.7,
      matchType: 'contains',
      caseSensitive: false,
      isActive: true,
      category: '历史'
    }
  ]

  for (const entry of entries) {
    await prisma.worldInfoEntry.create({ data: entry })
  }

  console.log(`✅ 创建了 ${entries.length} 个测试条目`)
}

/**
 * 基础匹配测试
 */
async function runBasicMatchingTests(matcher) {
  console.log('\n🔍 基础匹配测试')
  console.log('-'.repeat(40))

  const testCases = [
    {
      name: '简单关键词匹配',
      context: '我来到了艾尔登大陆，准备开始冒险',
      expectedMatches: ['艾尔登大陆']
    },
    {
      name: '多关键词匹配',
      context: '在艾尔登大陆的魔法学院里，我学习各种法术',
      expectedMatches: ['艾尔登大陆', '魔法学院']
    },
    {
      name: '正则表达式匹配',
      context: '我在学习魔法理论和魔法实践',
      expectedMatches: ['魔法学院']
    },
    {
      name: '通配符匹配',
      context: '传说中有很多神器武器',
      expectedMatches: ['圣剑传说']
    },
    {
      name: 'NOT逻辑匹配',
      context: '邪恶的力量正在蔓延，黑暗笼罩大地',
      expectedMatches: ['暗黑法师']
    }
  ]

  for (const testCase of testCases) {
    const startTime = performance.now()
    const results = await matcher.findActiveEntries('test-scenario', testCase.context)
    const endTime = performance.now()

    const matchedTitles = results.map(r => r.entry.title)
    const allMatched = testCase.expectedMatches.every(expected =>
      matchedTitles.includes(expected)
    )

    console.log(`  ${allMatched ? '✅' : '❌'} ${testCase.name}`)
    console.log(`     输入: "${testCase.context}"`)
    console.log(`     期望: [${testCase.expectedMatches.join(', ')}]`)
    console.log(`     实际: [${matchedTitles.join(', ')}]`)
    console.log(`     用时: ${(endTime - startTime).toFixed(2)}ms`)

    if (!allMatched) {
      console.log(`     ⚠️  匹配结果不符合期望`)
    }
  }
}

/**
 * 逻辑操作符测试
 */
async function runLogicOperatorTests(matcher) {
  console.log('\n🧮 逻辑操作符测试')
  console.log('-'.repeat(40))

  const testCases = [
    {
      name: 'AND_ANY 测试',
      keywords: ['艾尔登', '不存在的词'],
      content: '艾尔登大陆',
      operator: 'AND_ANY',
      expected: true
    },
    {
      name: 'AND_ALL 测试 - 成功',
      keywords: ['艾尔登', '大陆'],
      content: '艾尔登大陆',
      operator: 'AND_ALL',
      expected: true
    },
    {
      name: 'AND_ALL 测试 - 失败',
      keywords: ['艾尔登', '不存在的词'],
      content: '艾尔登大陆',
      operator: 'AND_ALL',
      expected: false
    },
    {
      name: 'NOT_ANY 测试 - 成功',
      keywords: ['邪恶', '黑暗'],
      content: '和平的村庄',
      operator: 'NOT_ANY',
      expected: true
    },
    {
      name: 'NOT_ANY 测试 - 失败',
      keywords: ['邪恶', '黑暗'],
      content: '邪恶的力量',
      operator: 'NOT_ANY',
      expected: false
    }
  ]

  for (const testCase of testCases) {
    const config = {
      matchType: 'keyword',
      caseSensitive: false,
      wholeWord: false,
      logicOperator: testCase.operator
    }

    const result = matcher.matchKeywords(testCase.content, testCase.keywords, config)

    console.log(`  ${result === testCase.expected ? '✅' : '❌'} ${testCase.name}`)
    console.log(`     关键词: [${testCase.keywords.join(', ')}]`)
    console.log(`     内容: "${testCase.content}"`)
    console.log(`     操作符: ${testCase.operator}`)
    console.log(`     期望: ${testCase.expected}, 实际: ${result}`)

    if (result !== testCase.expected) {
      console.log(`     ⚠️  逻辑操作符结果不正确`)
    }
  }
}

/**
 * 正则表达式测试
 */
async function runRegexTests(matcher) {
  console.log('\n📝 正则表达式测试')
  console.log('-'.repeat(40))

  const testCases = [
    {
      name: '简单正则匹配',
      pattern: '/魔法.*/',
      content: '魔法学院是最好的学校',
      expected: true
    },
    {
      name: '复杂正则匹配',
      pattern: '/\\w+学院/',
      content: '战士学院、法师学院、盗贼学院',
      expected: true
    },
    {
      name: '通配符转换',
      pattern: '神器*',
      content: '神器剑刃',
      expected: true
    },
    {
      name: '全词匹配',
      pattern: '学院',
      content: '魔法学院是最好的学院',
      wholeWord: true,
      expected: true
    },
    {
      name: '大小写敏感',
      pattern: 'Magic',
      content: 'magic school',
      caseSensitive: true,
      expected: false
    }
  ]

  for (const testCase of testCases) {
    const config = {
      matchType: 'keyword',
      caseSensitive: testCase.caseSensitive || false,
      wholeWord: testCase.wholeWord || false,
      logicOperator: 'AND_ANY'
    }

    const result = matcher.matchKeywords(testCase.content, [testCase.pattern], config)

    console.log(`  ${result === testCase.expected ? '✅' : '❌'} ${testCase.name}`)
    console.log(`     模式: "${testCase.pattern}"`)
    console.log(`     内容: "${testCase.content}"`)
    console.log(`     期望: ${testCase.expected}, 实际: ${result}`)
  }
}

/**
 * 递归扫描测试
 */
async function runRecursiveTests(matcher, prisma) {
  console.log('\n🔄 递归扫描测试')
  console.log('-'.repeat(40))

  // 添加能够触发递归的条目
  await prisma.worldInfoEntry.create({
    data: {
      id: 'recursive-entry',
      scenarioId: 'test-scenario',
      title: '王国联盟',
      content: '五大王国联合起来对抗暗黑法师的威胁。',
      keywords: JSON.stringify(['王国联盟', '联盟', '五大王国']),
      priority: 65,
      insertDepth: 4,
      probability: 1.0,
      matchType: 'contains',
      caseSensitive: false,
      isActive: true,
      category: '政治'
    }
  })

  const testContext = '在艾尔登大陆上，五大王国面临威胁'

  console.log(`  测试上下文: "${testContext}"`)

  const results = await matcher.findActiveEntries('test-scenario', testContext)
  const titles = results.map(r => r.entry.title)

  console.log(`  匹配结果: [${titles.join(', ')}]`)
  console.log(`  匹配数量: ${results.length}`)

  // 检查是否包含递归触发的条目
  const hasRecursive = titles.includes('王国联盟')
  console.log(`  ${hasRecursive ? '✅' : '❌'} 递归触发 - 王国联盟`)

  // 性能检查
  const metrics = matcher.getPerformanceMetrics()
  console.log(`  递归调用次数: ${metrics.recursiveCallCount}`)
}

/**
 * 性能测试
 */
async function runPerformanceTests(matcher) {
  console.log('\n⚡ 性能测试')
  console.log('-'.repeat(40))

  const testContexts = [
    '简单测试: 艾尔登大陆',
    '中等复杂度: 在艾尔登大陆的魔法学院里学习法术',
    '复杂测试: 勇敢的冒险者在艾尔登大陆的魔法学院学习法术，寻找传说中的圣剑，准备对抗邪恶的暗黑法师',
    '超长文本: ' + '艾尔登大陆上有很多奇妙的地方，包括古老的魔法学院。'.repeat(100)
  ]

  for (let i = 0; i < testContexts.length; i++) {
    const context = testContexts[i]
    const iterations = context.length > 1000 ? 10 : 100

    console.log(`\n  测试 ${i + 1}: ${context.substring(0, 50)}${context.length > 50 ? '...' : ''}`)
    console.log(`  文本长度: ${context.length} 字符`)
    console.log(`  迭代次数: ${iterations}`)

    const times = []
    for (let j = 0; j < iterations; j++) {
      const start = performance.now()
      await matcher.findActiveEntries('test-scenario', context)
      const end = performance.now()
      times.push(end - start)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)
    const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]

    console.log(`  平均时间: ${avgTime.toFixed(2)}ms`)
    console.log(`  最小时间: ${minTime.toFixed(2)}ms`)
    console.log(`  最大时间: ${maxTime.toFixed(2)}ms`)
    console.log(`  95分位数: ${p95Time.toFixed(2)}ms`)

    // 检查性能要求
    if (p95Time < 100) {
      console.log(`  ✅ 性能合格 (< 100ms)`)
    } else {
      console.log(`  ⚠️  性能警告 (>= 100ms)`)
    }
  }
}

/**
 * 压力测试
 */
async function runStressTests(matcher) {
  console.log('\n💪 压力测试')
  console.log('-'.repeat(40))

  // 并发测试
  console.log('\n  并发测试 (100个并发请求)')
  const concurrentPromises = []
  const startTime = performance.now()

  for (let i = 0; i < 100; i++) {
    const promise = matcher.findActiveEntries(
      'test-scenario',
      `测试请求 ${i}: 艾尔登大陆的魔法学院`
    )
    concurrentPromises.push(promise)
  }

  const results = await Promise.all(concurrentPromises)
  const endTime = performance.now()

  console.log(`  完成时间: ${(endTime - startTime).toFixed(2)}ms`)
  console.log(`  平均每请求: ${((endTime - startTime) / 100).toFixed(2)}ms`)
  console.log(`  所有请求都成功: ${results.every(r => Array.isArray(r)) ? '✅' : '❌'}`)

  // 内存使用测试
  console.log('\n  内存使用测试')
  const initialMemory = process.memoryUsage()

  for (let i = 0; i < 1000; i++) {
    await matcher.findActiveEntries(
      'test-scenario',
      `大量请求测试 ${i}: 艾尔登大陆魔法学院圣剑传说龙族历史`
    )
  }

  const finalMemory = process.memoryUsage()
  const memoryDiff = {
    rss: finalMemory.rss - initialMemory.rss,
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
  }

  console.log(`  RSS 变化: ${(memoryDiff.rss / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  堆内存使用变化: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  堆内存总量变化: ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)}MB`)

  // 缓存效率测试
  console.log('\n  缓存效率测试')
  matcher.clearCache()

  const cacheTestContext = '艾尔登大陆的魔法学院'

  // 填充缓存
  for (let i = 0; i < 50; i++) {
    await matcher.findActiveEntries('test-scenario', cacheTestContext)
  }

  const cacheStats = matcher.getPerformanceMetrics()
  console.log(`  缓存命中率: ${(cacheStats.cacheHitRate * 100).toFixed(1)}%`)
  console.log(`  ${cacheStats.cacheHitRate > 0.8 ? '✅' : '⚠️ '} 缓存效率${cacheStats.cacheHitRate > 0.8 ? '良好' : '需要优化'}`)
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})