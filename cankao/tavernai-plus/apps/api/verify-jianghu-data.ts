/**
 * 江湖风云世界数据验证脚本
 * 验证种子数据的完整性和业务逻辑
 */

const { PrismaClient } = require('./node_modules/.prisma/client')

const prisma = new PrismaClient()

interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

// 验证用户数据
async function validateUsers(): Promise<ValidationResult> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@jianghu-wuxia.com' }
    })

    if (!adminUser) {
      return {
        success: false,
        message: '管理员用户未找到'
      }
    }

    if (!adminUser.isAdmin || adminUser.role !== 'admin') {
      return {
        success: false,
        message: '管理员权限设置错误'
      }
    }

    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['newbie@jianghu-test.com', 'veteran@jianghu-test.com']
        }
      }
    })

    if (testUsers.length !== 2) {
      return {
        success: false,
        message: '测试用户数量不正确',
        details: { expected: 2, actual: testUsers.length }
      }
    }

    return {
      success: true,
      message: '用户数据验证通过',
      details: {
        adminUser: adminUser.username,
        testUsers: testUsers.map(u => u.username)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '用户数据验证失败',
      details: error
    }
  }
}

// 验证世界剧本
async function validateScenario(): Promise<ValidationResult> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { name: '江湖风云：武侠崛起' }
    })

    if (!scenario) {
      return {
        success: false,
        message: '江湖风云世界剧本未找到'
      }
    }

    if (!scenario.isPublic || !scenario.isFeatured) {
      return {
        success: false,
        message: '世界剧本设置错误'
      }
    }

    if (scenario.category !== '古风武侠') {
      return {
        success: false,
        message: '世界剧本分类错误'
      }
    }

    return {
      success: true,
      message: '世界剧本验证通过',
      details: {
        id: scenario.id,
        name: scenario.name,
        category: scenario.category
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '世界剧本验证失败',
      details: error
    }
  }
}

// 验证世界信息条目
async function validateWorldInfo(): Promise<ValidationResult> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { name: '江湖风云：武侠崛起' }
    })

    if (!scenario) {
      return {
        success: false,
        message: '世界剧本未找到，无法验证世界信息'
      }
    }

    const worldInfoEntries = await prisma.worldInfoEntry.findMany({
      where: { scenarioId: scenario.id }
    })

    const expectedTitles = [
      '血脉玉传说',
      '江湖门派势力',
      '武功等级体系',
      '醉仙楼详情',
      '当前江湖局势'
    ]

    const actualTitles = worldInfoEntries.map(entry => entry.title)
    const missingTitles = expectedTitles.filter(title => !actualTitles.includes(title))

    if (missingTitles.length > 0) {
      return {
        success: false,
        message: '世界信息条目不完整',
        details: { missing: missingTitles }
      }
    }

    if (worldInfoEntries.length !== 5) {
      return {
        success: false,
        message: '世界信息条目数量不正确',
        details: { expected: 5, actual: worldInfoEntries.length }
      }
    }

    return {
      success: true,
      message: '世界信息验证通过',
      details: {
        count: worldInfoEntries.length,
        titles: actualTitles
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '世界信息验证失败',
      details: error
    }
  }
}

// 验证核心角色
async function validateCharacters(): Promise<ValidationResult> {
  try {
    const expectedCharacters = ['柳烟儿', '慕容渊', '萧尘', '殷红']

    const characters = await prisma.character.findMany({
      where: {
        name: { in: expectedCharacters }
      },
      include: {
        creator: true
      }
    })

    if (characters.length !== 4) {
      return {
        success: false,
        message: '核心角色数量不正确',
        details: { expected: 4, actual: characters.length }
      }
    }

    const actualNames = characters.map(char => char.name)
    const missingCharacters = expectedCharacters.filter(name => !actualNames.includes(name))

    if (missingCharacters.length > 0) {
      return {
        success: false,
        message: '缺少核心角色',
        details: { missing: missingCharacters }
      }
    }

    // 验证所有角色都是由管理员创建
    const adminCreated = characters.every(char => char.creator.isAdmin)
    if (!adminCreated) {
      return {
        success: false,
        message: '角色创建者权限验证失败'
      }
    }

    // 验证角色设置
    for (const char of characters) {
      if (!char.isPublic || char.isDeleted) {
        return {
          success: false,
          message: `角色 ${char.name} 设置错误`
        }
      }

      if (char.category !== '古风武侠') {
        return {
          success: false,
          message: `角色 ${char.name} 分类错误`
        }
      }

      if (!char.firstMessage || !char.personality || !char.backstory) {
        return {
          success: false,
          message: `角色 ${char.name} 核心信息缺失`
        }
      }
    }

    return {
      success: true,
      message: '核心角色验证通过',
      details: {
        characters: characters.map(char => ({
          name: char.name,
          id: char.id,
          category: char.category,
          isPublic: char.isPublic,
          isFeatured: char.isFeatured
        }))
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '核心角色验证失败',
      details: error
    }
  }
}

// 验证角色与剧本关联
async function validateCharacterScenarioRelations(): Promise<ValidationResult> {
  try {
    const scenario = await prisma.scenario.findFirst({
      where: { name: '江湖风云：武侠崛起' }
    })

    if (!scenario) {
      return {
        success: false,
        message: '世界剧本未找到，无法验证关联关系'
      }
    }

    const relations = await prisma.characterScenario.findMany({
      where: { scenarioId: scenario.id },
      include: {
        character: true
      }
    })

    if (relations.length !== 4) {
      return {
        success: false,
        message: '角色剧本关联数量不正确',
        details: { expected: 4, actual: relations.length }
      }
    }

    // 验证所有关联都是主要角色
    const allMainCharacters = relations.every(rel => rel.relationshipType === 'main_character')
    if (!allMainCharacters) {
      return {
        success: false,
        message: '角色关联类型设置错误'
      }
    }

    return {
      success: true,
      message: '角色剧本关联验证通过',
      details: {
        relations: relations.map(rel => ({
          character: rel.character.name,
          type: rel.relationshipType,
          importance: rel.importance
        }))
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '角色剧本关联验证失败',
      details: error
    }
  }
}

// 验证数据库整体统计
async function validateOverallStats(): Promise<ValidationResult> {
  try {
    const stats = {
      users: await prisma.user.count(),
      scenarios: await prisma.scenario.count(),
      characters: await prisma.character.count(),
      worldInfoEntries: await prisma.worldInfoEntry.count(),
      characterScenarios: await prisma.characterScenario.count()
    }

    const expected = {
      users: 3,
      scenarios: 1,
      characters: 4,
      worldInfoEntries: 5,
      characterScenarios: 4
    }

    const issues = []
    for (const [key, value] of Object.entries(expected)) {
      if (stats[key as keyof typeof stats] !== value) {
        issues.push(`${key}: 期望 ${value}, 实际 ${stats[key as keyof typeof stats]}`)
      }
    }

    if (issues.length > 0) {
      return {
        success: false,
        message: '数据库统计不匹配',
        details: { issues, actual: stats, expected }
      }
    }

    return {
      success: true,
      message: '数据库整体验证通过',
      details: stats
    }
  } catch (error) {
    return {
      success: false,
      message: '数据库统计验证失败',
      details: error
    }
  }
}

// 主验证函数
async function main() {
  console.log('🔍 开始验证江湖风云世界数据完整性...\n')

  const validations = [
    { name: '用户数据', func: validateUsers },
    { name: '世界剧本', func: validateScenario },
    { name: '世界信息', func: validateWorldInfo },
    { name: '核心角色', func: validateCharacters },
    { name: '角色关联', func: validateCharacterScenarioRelations },
    { name: '整体统计', func: validateOverallStats }
  ]

  const results: { name: string; result: ValidationResult }[] = []
  let allPassed = true

  for (const validation of validations) {
    console.log(`🔸 验证 ${validation.name}...`)
    const result = await validation.func()
    results.push({ name: validation.name, result })

    if (result.success) {
      console.log(`  ✅ ${result.message}`)
      if (result.details) {
        console.log(`     详情: ${JSON.stringify(result.details, null, 2)}`)
      }
    } else {
      console.log(`  ❌ ${result.message}`)
      if (result.details) {
        console.log(`     错误详情: ${JSON.stringify(result.details, null, 2)}`)
      }
      allPassed = false
    }
    console.log('')
  }

  console.log('📊 验证总结:')
  console.log('=' .repeat(50))

  const passedCount = results.filter(r => r.result.success).length
  const totalCount = results.length

  console.log(`通过: ${passedCount}/${totalCount}`)

  if (allPassed) {
    console.log('🎉 所有验证通过！江湖风云世界数据完整性验证成功！')
    console.log('\n🚀 现在可以安全地启动服务器:')
    console.log('   npm run dev')
  } else {
    console.log('⚠️  发现问题，请检查上述错误并重新运行种子数据生成。')
    console.log('\n🔧 建议操作:')
    console.log('   1. 重新运行: ./init-jianghu-world.sh')
    console.log('   2. 或手动运行: npx ts-node prisma/seed-jianghu-wuxia.ts')
  }

  await prisma.$disconnect()
  process.exit(allPassed ? 0 : 1)
}

// 运行验证
main().catch((error) => {
  console.error('❌ 验证过程发生错误:', error)
  process.exit(1)
})
