#!/usr/bin/env node

/**
 * 导入导出功能测试脚本
 * 测试剧本数据的导入导出功能，验证格式兼容性和数据完整性
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

// 配置
const API_BASE_URL = 'http://localhost:3001/api'
const TEST_DATA_DIR = path.join(__dirname, 'test-data')

// 创建测试数据目录
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
}

// 认证令牌（测试时需要先登录获取）
let authToken = null

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// API 客户端
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

// 添加请求拦截器
apiClient.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// 生成测试数据
function generateTestData() {
  log('📝 生成测试数据...', 'blue')

  // SillyTavern World Info 格式
  const sillyTavernData = {
    name: 'Test World Info',
    description: '测试用的世界信息数据',
    version: '2.0',
    entries: [
      {
        uid: 1,
        key: ['魔法学院', '霍格沃茨'],
        keysecondary: ['学校', '魔法'],
        comment: '魔法学院设定',
        content: '一所著名的魔法学院，培养年轻的魔法师。学院分为四个学院，每个学院都有自己的特色和传统。',
        constant: false,
        selective: false,
        order: 100,
        position: 'before_char',
        disable: false,
        probability: 100,
        group: '设定',
        scanDepth: 4,
        caseSensitive: false,
        matchWholeWords: false
      },
      {
        uid: 2,
        key: ['魔法咒语', '咒语'],
        comment: '魔法咒语系统',
        content: '魔法世界中存在各种强大的咒语，需要通过咒语来施展魔法。不同的咒语有不同的效果和使用条件。',
        constant: true,
        order: 80,
        position: 'after_char',
        disable: false,
        probability: 80,
        group: '魔法',
        scanDepth: 3,
        caseSensitive: true
      }
    ]
  }

  // TavernAI Plus JSON 格式
  const tavernAIData = {
    name: '测试剧本',
    description: '这是一个用于测试导入导出功能的剧本',
    content: '详细的剧本内容，包含完整的故事背景和设定信息。',
    isPublic: true,
    tags: ['测试', '导入导出', 'API'],
    category: '测试',
    language: 'zh-CN',
    worldInfos: [
      {
        title: '世界背景设定',
        content: '这个世界是一个充满魔法和奇迹的地方，有着悠久的历史和丰富的文化。',
        keywords: ['世界', '背景', '设定'],
        priority: 100,
        insertDepth: 4,
        probability: 1.0,
        matchType: 'contains',
        caseSensitive: false,
        isActive: true,
        triggerOnce: false,
        excludeRecursion: true,
        category: '世界设定',
        position: 'before'
      },
      {
        title: '角色关系',
        content: '主要角色之间有着复杂的关系网络，包括友谊、敌对、爱情等多种关系。',
        keywords: ['角色', '关系', '人物'],
        priority: 80,
        insertDepth: 3,
        probability: 0.8,
        matchType: 'contains',
        caseSensitive: false,
        isActive: true,
        triggerOnce: false,
        excludeRecursion: true,
        category: '角色设定',
        position: 'after'
      }
    ]
  }

  // 批量导入数据
  const batchData = [
    {
      name: '批量测试剧本1',
      description: '第一个批量测试剧本',
      tags: ['批量', '测试1'],
      category: '批量测试',
      worldInfos: [
        {
          title: '测试条目1',
          content: '这是第一个测试条目的内容',
          keywords: ['测试1', '条目1'],
          priority: 50
        }
      ]
    },
    {
      name: '批量测试剧本2',
      description: '第二个批量测试剧本',
      tags: ['批量', '测试2'],
      category: '批量测试',
      worldInfos: [
        {
          title: '测试条目2',
          content: '这是第二个测试条目的内容',
          keywords: ['测试2', '条目2'],
          priority: 60
        }
      ]
    }
  ]

  // TavernAI Plus Enhanced 格式
  const enhancedData = {
    ...tavernAIData,
    enhanced: {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        originalFormat: 'tavernai-plus',
        conversionNotes: [],
        dataIntegrity: true
      },
      extendedFields: {
        customProperties: {
          theme: 'fantasy',
          difficulty: 'medium',
          estimatedPlayTime: '2-3 hours'
        },
        advancedSettings: {
          includeWorldInfo: true,
          includeMetadata: true,
          enableAdvancedMatching: true
        }
      }
    }
  }

  // 保存测试数据文件
  const testFiles = [
    { name: 'sillytavern-worldinfo.json', data: sillyTavernData },
    { name: 'tavernai-scenario.json', data: tavernAIData },
    { name: 'batch-scenarios.json', data: batchData },
    { name: 'enhanced-scenario.json', data: enhancedData }
  ]

  testFiles.forEach(({ name, data }) => {
    const filePath = path.join(TEST_DATA_DIR, name)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    log(`✅ 生成测试文件: ${name}`, 'green')
  })

  // 生成 YAML 格式文件
  const yaml = require('js-yaml')
  const yamlPath = path.join(TEST_DATA_DIR, 'tavernai-scenario.yaml')
  fs.writeFileSync(yamlPath, yaml.dump(tavernAIData), 'utf8')
  log(`✅ 生成 YAML 测试文件: tavernai-scenario.yaml`, 'green')

  log('📝 测试数据生成完成', 'green')
}

// 登录获取认证令牌
async function authenticate() {
  log('🔐 正在登录获取认证令牌...', 'blue')

  try {
    const response = await apiClient.post('/auth/login', {
      email: 'admin@tavernai.com',
      password: 'Admin123!@#'
    })

    if (response.data.success) {
      authToken = response.data.data.token
      log('✅ 认证成功', 'green')
      return true
    } else {
      log(`❌ 认证失败: ${response.data.error}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ 认证错误: ${error.message}`, 'red')
    return false
  }
}

// 测试获取支持的格式信息
async function testGetFormats() {
  log('📋 测试获取支持的格式信息...', 'blue')

  try {
    const response = await apiClient.get('/import/formats')

    if (response.data.success) {
      log('✅ 获取格式信息成功', 'green')

      const { importFormats, exportFormats, conflictResolutions } = response.data.data

      log(`  导入格式: ${importFormats.map(f => f.name).join(', ')}`, 'cyan')
      log(`  导出格式: ${exportFormats.map(f => f.name).join(', ')}`, 'cyan')
      log(`  冲突解决策略: ${conflictResolutions.map(r => r.name).join(', ')}`, 'cyan')

      return response.data.data
    } else {
      log(`❌ 获取格式信息失败: ${response.data.error}`, 'red')
      return null
    }
  } catch (error) {
    log(`❌ 获取格式信息错误: ${error.message}`, 'red')
    return null
  }
}

// 测试数据验证
async function testValidateData() {
  log('🔍 测试数据验证功能...', 'blue')

  const testFiles = [
    { file: 'tavernai-scenario.json', format: 'json' },
    { file: 'sillytavern-worldinfo.json', format: 'sillytavern' },
    { file: 'tavernai-scenario.yaml', format: 'yaml' }
  ]

  for (const { file, format } of testFiles) {
    try {
      const filePath = path.join(TEST_DATA_DIR, file)
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('format', format)

      const response = await apiClient.post('/import/validate', formData, {
        headers: {
          ...formData.getHeaders()
        }
      })

      if (response.data.success) {
        const validation = response.data.data
        log(`✅ ${file} 验证成功`, 'green')
        log(`  有效项目: ${validation.metadata.validItems}/${validation.metadata.totalItems}`, 'cyan')
        log(`  错误数: ${validation.metadata.errorCount}`, 'cyan')
        log(`  警告数: ${validation.metadata.warningCount}`, 'cyan')

        if (validation.errors.length > 0) {
          log(`  错误详情: ${validation.errors.map(e => e.message).join('; ')}`, 'yellow')
        }
      } else {
        log(`❌ ${file} 验证失败: ${response.data.error}`, 'red')
      }
    } catch (error) {
      log(`❌ ${file} 验证错误: ${error.message}`, 'red')
    }
  }
}

// 测试导入功能
async function testImportScenarios() {
  log('📥 测试导入功能...', 'blue')

  const testCases = [
    {
      file: 'tavernai-scenario.json',
      options: {
        format: 'json',
        conflictResolution: 'rename',
        validateData: true,
        preserveIds: false,
        batchSize: 10
      }
    },
    {
      file: 'sillytavern-worldinfo.json',
      options: {
        format: 'sillytavern',
        conflictResolution: 'skip',
        validateData: true,
        preserveIds: false,
        batchSize: 5
      }
    },
    {
      file: 'batch-scenarios.json',
      options: {
        format: 'json',
        conflictResolution: 'merge',
        validateData: true,
        preserveIds: false,
        batchSize: 2
      }
    }
  ]

  const importedScenarios = []

  for (const { file, options } of testCases) {
    try {
      const filePath = path.join(TEST_DATA_DIR, file)
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('options', JSON.stringify(options))

      log(`  导入文件: ${file}`, 'cyan')

      const response = await apiClient.post('/import/scenarios', formData, {
        headers: {
          ...formData.getHeaders()
        }
      })

      if (response.data.success) {
        const result = response.data.data
        log(`✅ ${file} 导入成功`, 'green')
        log(`  成功: ${result.successCount}, 失败: ${result.failureCount}, 跳过: ${result.skippedCount}`, 'cyan')
        log(`  处理时间: ${result.metadata.processingTime}ms`, 'cyan')

        // 记录导入的剧本ID
        result.importedScenarios.forEach(scenario => {
          importedScenarios.push({
            id: scenario.id,
            name: scenario.name,
            source: file
          })
        })

        if (result.errors.length > 0) {
          log(`  错误: ${result.errors.map(e => e.message).join('; ')}`, 'yellow')
        }
      } else {
        log(`❌ ${file} 导入失败: ${response.data.error}`, 'red')
      }
    } catch (error) {
      log(`❌ ${file} 导入错误: ${error.message}`, 'red')
    }
  }

  return importedScenarios
}

// 测试导出功能
async function testExportScenarios(scenarios) {
  log('📤 测试导出功能...', 'blue')

  if (scenarios.length === 0) {
    log('⚠️ 没有可导出的剧本', 'yellow')
    return
  }

  // 测试单个剧本导出
  const scenario = scenarios[0]
  const exportFormats = ['json', 'yaml', 'sillytavern', 'enhanced']

  for (const format of exportFormats) {
    try {
      log(`  导出剧本 "${scenario.name}" 为 ${format} 格式`, 'cyan')

      const response = await apiClient.post(`/import/scenarios/${scenario.id}/export`, {
        format,
        includeWorldInfo: true,
        includeMetadata: true,
        compression: false
      }, {
        responseType: 'blob'
      })

      // 保存导出文件
      const filename = `exported_${scenario.id}_${format}.${format === 'yaml' ? 'yaml' : 'json'}`
      const exportPath = path.join(TEST_DATA_DIR, filename)
      fs.writeFileSync(exportPath, response.data)

      log(`✅ 导出成功: ${filename}`, 'green')
    } catch (error) {
      log(`❌ 导出 ${format} 格式失败: ${error.message}`, 'red')
    }
  }

  // 测试批量导出
  if (scenarios.length > 1) {
    try {
      log(`  批量导出 ${scenarios.length} 个剧本`, 'cyan')

      const response = await apiClient.post('/import/scenarios/export/batch', {
        scenarioIds: scenarios.map(s => s.id),
        options: {
          format: 'json',
          includeWorldInfo: true,
          includeMetadata: true,
          compression: false
        }
      }, {
        responseType: 'blob'
      })

      // 保存批量导出文件
      const filename = `batch_export_${Date.now()}.json`
      const exportPath = path.join(TEST_DATA_DIR, filename)
      fs.writeFileSync(exportPath, response.data)

      log(`✅ 批量导出成功: ${filename}`, 'green')
    } catch (error) {
      log(`❌ 批量导出失败: ${error.message}`, 'red')
    }
  }
}

// 测试冲突检测
async function testConflictDetection() {
  log('⚔️ 测试冲突检测功能...', 'blue')

  try {
    // 使用现有的测试数据模拟冲突
    const conflictData = {
      name: '测试剧本', // 与之前导入的剧本同名
      description: '这会产生冲突的剧本',
      worldInfos: [
        {
          title: '冲突条目',
          content: '这个条目会与现有条目产生关键词冲突',
          keywords: ['世界', '背景'] // 与现有条目关键词重叠
        }
      ]
    }

    const response = await apiClient.post('/import/detect-conflicts', {
      importData: [conflictData],
      format: 'json'
    })

    if (response.data.success) {
      const conflicts = response.data.data
      log('✅ 冲突检测成功', 'green')
      log(`  重名冲突: ${conflicts.duplicateNames.length}`, 'cyan')
      log(`  相似内容: ${conflicts.similarContent.length}`, 'cyan')
      log(`  关键词重叠: ${conflicts.keywordOverlaps.length}`, 'cyan')

      // 显示详细冲突信息
      conflicts.duplicateNames.forEach(conflict => {
        log(`    重名: ${conflict.name} (${conflict.severity})`, 'yellow')
      })
    } else {
      log(`❌ 冲突检测失败: ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ 冲突检测错误: ${error.message}`, 'red')
  }
}

// 测试导入历史
async function testImportHistory() {
  log('📚 测试导入历史功能...', 'blue')

  try {
    const response = await apiClient.get('/import/history', {
      params: { page: 1, limit: 10 }
    })

    if (response.data.success) {
      const { history } = response.data.data
      log('✅ 获取导入历史成功', 'green')
      log(`  历史记录数: ${history.length}`, 'cyan')

      history.forEach(record => {
        log(`    ${record.filename} - ${record.status} (${record.successCount}/${record.totalItems})`, 'cyan')
      })
    } else {
      log(`❌ 获取导入历史失败: ${response.data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ 导入历史错误: ${error.message}`, 'red')
  }
}

// 清理测试数据
async function cleanupTestData(scenarios) {
  log('🧹 清理测试数据...', 'blue')

  // 删除导入的测试剧本
  for (const scenario of scenarios) {
    try {
      await apiClient.delete(`/scenarios/${scenario.id}`)
      log(`✅ 删除剧本: ${scenario.name}`, 'green')
    } catch (error) {
      log(`❌ 删除剧本失败: ${scenario.name}`, 'red')
    }
  }

  // 删除测试文件
  try {
    const files = fs.readdirSync(TEST_DATA_DIR)
    files.forEach(file => {
      fs.unlinkSync(path.join(TEST_DATA_DIR, file))
    })
    fs.rmdirSync(TEST_DATA_DIR)
    log('✅ 清理测试文件完成', 'green')
  } catch (error) {
    log(`⚠️ 清理测试文件出错: ${error.message}`, 'yellow')
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始导入导出功能测试', 'magenta')
  log('=' * 50, 'cyan')

  try {
    // 生成测试数据
    generateTestData()

    // 认证
    if (!(await authenticate())) {
      log('❌ 认证失败，退出测试', 'red')
      return
    }

    // 测试获取格式信息
    await testGetFormats()

    // 测试数据验证
    await testValidateData()

    // 测试导入功能
    const importedScenarios = await testImportScenarios()

    // 测试导出功能
    await testExportScenarios(importedScenarios)

    // 测试冲突检测
    await testConflictDetection()

    // 测试导入历史
    await testImportHistory()

    log('=' * 50, 'cyan')
    log('🎉 导入导出功能测试完成', 'magenta')

    // 询问是否清理测试数据
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('是否清理测试数据？(y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await cleanupTestData(importedScenarios)
      }
      rl.close()
    })

  } catch (error) {
    log(`❌ 测试过程中发生错误: ${error.message}`, 'red')
    log(error.stack, 'red')
  }
}

// 检查依赖
function checkDependencies() {
  const requiredModules = ['axios', 'form-data', 'js-yaml']
  const missingModules = []

  for (const module of requiredModules) {
    try {
      require.resolve(module)
    } catch {
      missingModules.push(module)
    }
  }

  if (missingModules.length > 0) {
    log(`❌ 缺少依赖模块: ${missingModules.join(', ')}`, 'red')
    log(`请运行: npm install ${missingModules.join(' ')}`, 'yellow')
    process.exit(1)
  }
}

// 入口点
if (require.main === module) {
  checkDependencies()
  runTests().catch(error => {
    log(`❌ 测试脚本执行失败: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = {
  runTests,
  generateTestData,
  authenticate,
  testGetFormats,
  testValidateData,
  testImportScenarios,
  testExportScenarios,
  testConflictDetection,
  testImportHistory
}