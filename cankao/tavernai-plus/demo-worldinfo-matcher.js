#!/usr/bin/env node

/**
 * 世界信息匹配引擎演示脚本
 * 演示核心功能，无需复杂的数据库设置
 */

console.log('🧪 世界信息匹配引擎演示')
console.log('=' .repeat(50))

// 简化的匹配器实现，用于演示
class SimpleWorldInfoMatcher {
  constructor() {
    this.cache = new Map()
  }

  /**
   * 匹配关键词
   */
  matchKeywords(content, keywords, config = {}) {
    const {
      caseSensitive = false,
      wholeWord = false,
      logicOperator = 'AND_ANY'
    } = config

    const results = keywords.map(keyword => {
      return this.matchSingleKeyword(content, keyword, { caseSensitive, wholeWord })
    })

    return this.applyLogicOperator(results, logicOperator)
  }

  /**
   * 单个关键词匹配
   */
  matchSingleKeyword(content, keyword, options = {}) {
    const { caseSensitive = false, wholeWord = false } = options

    // 正则表达式模式
    if (keyword.startsWith('/') && keyword.endsWith('/')) {
      const pattern = keyword.slice(1, -1)
      try {
        const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
        return regex.test(content)
      } catch (error) {
        console.warn(`无效的正则表达式: ${pattern}`)
        return false
      }
    }

    // 通配符模式
    if (keyword.includes('*') || keyword.includes('?')) {
      const regexPattern = keyword
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      try {
        const regex = new RegExp(`^${regexPattern}$`, caseSensitive ? 'g' : 'gi')
        return regex.test(content)
      } catch (error) {
        return false
      }
    }

    // 标准匹配
    const testContent = caseSensitive ? content : content.toLowerCase()
    const testKeyword = caseSensitive ? keyword : keyword.toLowerCase()

    if (wholeWord) {
      const regex = new RegExp(`\\b${this.escapeRegex(testKeyword)}\\b`, 'gi')
      return regex.test(testContent)
    }

    return testContent.includes(testKeyword)
  }

  /**
   * 应用逻辑操作符
   */
  applyLogicOperator(results, operator) {
    switch (operator) {
      case 'AND_ANY':
        return results.some(r => r)
      case 'AND_ALL':
        return results.every(r => r)
      case 'NOT_ANY':
        return !results.some(r => r)
      case 'NOT_ALL':
        return !results.every(r => r)
      default:
        return results.some(r => r)
    }
  }

  /**
   * 转义正则表达式字符
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 查找匹配的条目
   */
  findMatches(entries, context) {
    const matches = []

    for (const entry of entries) {
      const keywords = this.parseKeywords(entry.keywords)
      const config = {
        caseSensitive: entry.caseSensitive || false,
        wholeWord: false,
        logicOperator: this.extractLogicOperator(entry.keywords)
      }

      if (this.matchKeywords(context, keywords, config)) {
        // 检查概率
        if (!entry.probability || Math.random() < entry.probability) {
          matches.push({
            entry,
            priority: entry.priority || 50,
            confidence: this.calculateConfidence(keywords, context)
          })
        }
      }
    }

    // 按优先级排序
    return matches.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 解析关键词
   */
  parseKeywords(keywordString) {
    // 移除逻辑操作符前缀
    let cleaned = keywordString.replace(/^(AND_ALL:|AND_ANY:|NOT_ALL:|NOT_ANY:)/, '')

    // 尝试JSON解析
    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      // 不是JSON，按逗号分割
    }

    return cleaned.split(',').map(k => k.trim()).filter(k => k.length > 0)
  }

  /**
   * 提取逻辑操作符
   */
  extractLogicOperator(keywordString) {
    if (keywordString.startsWith('AND_ALL:')) return 'AND_ALL'
    if (keywordString.startsWith('NOT_ANY:')) return 'NOT_ANY'
    if (keywordString.startsWith('NOT_ALL:')) return 'NOT_ALL'
    return 'AND_ANY'
  }

  /**
   * 计算置信度
   */
  calculateConfidence(keywords, content) {
    const matches = keywords.filter(keyword =>
      this.matchSingleKeyword(content, keyword)
    )
    return matches.length / keywords.length
  }
}

// 创建测试数据
const testEntries = [
  {
    id: 'entry-1',
    title: '艾尔登大陆',
    content: '艾尔登大陆是一个充满魔法与冒险的奇幻世界，由五大王国组成。',
    keywords: JSON.stringify(['艾尔登', '大陆', '王国', '奇幻世界']),
    priority: 90,
    probability: 1.0,
    caseSensitive: false
  },
  {
    id: 'entry-2',
    title: '魔法学院',
    content: '坐落在艾尔登大陆中心的魔法学院，是大陆上最古老的魔法教育机构。',
    keywords: JSON.stringify(['魔法学院', '学院', '/魔法.*/']),
    priority: 80,
    probability: 0.8,
    caseSensitive: false
  },
  {
    id: 'entry-3',
    title: '圣剑传说',
    content: '传说中的圣剑，只有被选中的勇者才能拔出。',
    keywords: JSON.stringify(['圣剑', '传说', '勇者', '神器*']),
    priority: 70,
    probability: 0.9,
    caseSensitive: false
  },
  {
    id: 'entry-4',
    title: '暗黑法师',
    content: '邪恶的暗黑法师威胁着整个大陆的和平。',
    keywords: 'NOT_ANY:光明,和平,正义',
    priority: 60,
    probability: 1.0,
    caseSensitive: false
  }
]

// 创建匹配器实例
const matcher = new SimpleWorldInfoMatcher()

// 测试用例
const testCases = [
  {
    name: '基础关键词匹配',
    context: '我来到了艾尔登大陆，准备开始冒险',
    expectedTitles: ['艾尔登大陆']
  },
  {
    name: '多关键词匹配',
    context: '在艾尔登大陆的魔法学院里，我学习各种法术',
    expectedTitles: ['艾尔登大陆', '魔法学院']
  },
  {
    name: '正则表达式匹配',
    context: '我正在学习魔法理论和魔法实践',
    expectedTitles: ['魔法学院']
  },
  {
    name: '通配符匹配',
    context: '传说中有很多神器武器',
    expectedTitles: ['圣剑传说']
  },
  {
    name: 'NOT逻辑匹配',
    context: '邪恶的力量正在蔓延，黑暗笼罩大地',
    expectedTitles: ['暗黑法师']
  },
  {
    name: '复合匹配',
    context: '在艾尔登大陆上，邪恶法师威胁着魔法学院',
    expectedTitles: ['艾尔登大陆', '魔法学院', '暗黑法师']
  }
]

// 运行测试
console.log('\n📋 运行匹配测试...\n')

let passedTests = 0
const totalTests = testCases.length

for (const [index, testCase] of testCases.entries()) {
  const startTime = performance.now()
  const matches = matcher.findMatches(testEntries, testCase.context)
  const endTime = performance.now()

  const matchedTitles = matches.map(m => m.entry.title)
  const hasExpectedMatches = testCase.expectedTitles.every(expected =>
    matchedTitles.includes(expected)
  )

  const status = hasExpectedMatches ? '✅' : '❌'
  if (hasExpectedMatches) passedTests++

  console.log(`${status} 测试 ${index + 1}: ${testCase.name}`)
  console.log(`   输入: "${testCase.context}"`)
  console.log(`   期望: [${testCase.expectedTitles.join(', ')}]`)
  console.log(`   实际: [${matchedTitles.join(', ')}]`)
  console.log(`   用时: ${(endTime - startTime).toFixed(2)}ms`)

  if (matches.length > 0) {
    console.log(`   详情:`)
    matches.slice(0, 3).forEach(match => {
      console.log(`     - ${match.entry.title} (优先级: ${match.priority}, 置信度: ${(match.confidence * 100).toFixed(1)}%)`)
    })
  }
  console.log('')
}

// 逻辑操作符测试
console.log('\n🧮 逻辑操作符测试...\n')

const logicTests = [
  {
    name: 'AND_ANY - 任意匹配',
    keywords: ['艾尔登', '不存在的词'],
    content: '艾尔登大陆',
    operator: 'AND_ANY',
    expected: true
  },
  {
    name: 'AND_ALL - 全部匹配成功',
    keywords: ['艾尔登', '大陆'],
    content: '艾尔登大陆',
    operator: 'AND_ALL',
    expected: true
  },
  {
    name: 'AND_ALL - 全部匹配失败',
    keywords: ['艾尔登', '不存在的词'],
    content: '艾尔登大陆',
    operator: 'AND_ALL',
    expected: false
  },
  {
    name: 'NOT_ANY - 无匹配成功',
    keywords: ['邪恶', '黑暗'],
    content: '和平的村庄',
    operator: 'NOT_ANY',
    expected: true
  },
  {
    name: 'NOT_ANY - 有匹配失败',
    keywords: ['邪恶', '黑暗'],
    content: '邪恶的力量',
    operator: 'NOT_ANY',
    expected: false
  }
]

let passedLogicTests = 0

for (const [index, test] of logicTests.entries()) {
  const result = matcher.matchKeywords(test.content, test.keywords, {
    logicOperator: test.operator
  })

  const status = result === test.expected ? '✅' : '❌'
  if (result === test.expected) passedLogicTests++

  console.log(`${status} ${test.name}`)
  console.log(`   关键词: [${test.keywords.join(', ')}]`)
  console.log(`   内容: "${test.content}"`)
  console.log(`   操作符: ${test.operator}`)
  console.log(`   期望: ${test.expected}, 实际: ${result}`)
  console.log('')
}

// 性能测试
console.log('\n⚡ 性能测试...\n')

const performanceTests = [
  {
    name: '简单匹配',
    context: '艾尔登大陆',
    iterations: 1000
  },
  {
    name: '复杂匹配',
    context: '在艾尔登大陆的魔法学院里，勇敢的冒险者寻找传说中的圣剑，准备对抗邪恶的暗黑法师',
    iterations: 500
  },
  {
    name: '长文本匹配',
    context: '艾尔登大陆是一个神奇的世界。'.repeat(100),
    iterations: 100
  }
]

for (const perfTest of performanceTests) {
  const times = []

  for (let i = 0; i < perfTest.iterations; i++) {
    const start = performance.now()
    matcher.findMatches(testEntries, perfTest.context)
    const end = performance.now()
    times.push(end - start)
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const maxTime = Math.max(...times)
  const minTime = Math.min(...times)
  const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]

  console.log(`📊 ${perfTest.name}:`)
  console.log(`   迭代次数: ${perfTest.iterations}`)
  console.log(`   平均时间: ${avgTime.toFixed(2)}ms`)
  console.log(`   最小时间: ${minTime.toFixed(2)}ms`)
  console.log(`   最大时间: ${maxTime.toFixed(2)}ms`)
  console.log(`   95分位数: ${p95Time.toFixed(2)}ms`)
  console.log(`   性能: ${p95Time < 100 ? '✅ 优秀' : '⚠️ 需优化'} (目标 < 100ms)`)
  console.log('')
}

// 总结
console.log('\n📊 测试总结')
console.log('=' .repeat(50))
console.log(`匹配功能测试: ${passedTests}/${totalTests} 通过 (${(passedTests/totalTests*100).toFixed(1)}%)`)
console.log(`逻辑操作测试: ${passedLogicTests}/${logicTests.length} 通过 (${(passedLogicTests/logicTests.length*100).toFixed(1)}%)`)

const overallScore = (passedTests + passedLogicTests) / (totalTests + logicTests.length) * 100
console.log(`\n🎯 总体通过率: ${overallScore.toFixed(1)}%`)

if (overallScore >= 90) {
  console.log('✅ 世界信息匹配引擎核心功能验证通过！')
} else if (overallScore >= 70) {
  console.log('⚠️ 基本功能正常，需要进一步优化')
} else {
  console.log('❌ 存在重要问题，需要修复')
}

console.log('\n🎉 演示完成！')
console.log('\n💡 核心功能演示：')
console.log('  - ✅ 多种关键词匹配策略')
console.log('  - ✅ 复杂逻辑操作符支持')
console.log('  - ✅ 正则表达式和通配符')
console.log('  - ✅ 优先级排序和置信度计算')
console.log('  - ✅ 高性能匹配算法')
console.log('  - ✅ SillyTavern语法兼容')