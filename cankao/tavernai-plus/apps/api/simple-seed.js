const { PrismaClient } = require('./node_modules/.prisma/client')
const bcrypt = require('bcryptjs')

async function seed() {
  const prisma = new PrismaClient()

  try {
    console.log('🌱 开始生成种子数据...')

    // 创建管理员用户
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@tavernai.com' },
      update: {},
      create: {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@tavernai.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        role: 'admin',
        isAdmin: true,
        isVerified: true,
        credits: 10000,
        subscriptionTier: 'pro'
      }
    })
    console.log('✅ 管理员用户创建完成')

    // 创建测试用户
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'user-001',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'user',
        credits: 100,
        subscriptionTier: 'free'
      }
    })
    console.log('✅ 测试用户创建完成')

    // 创建AI提供商
    const aiProvider = await prisma.aIProvider.upsert({
      where: { name: 'Grok-3' },
      update: {},
      create: {
        id: 'ai-001',
        name: 'Grok-3',
        baseUrl: 'https://ttkk.inping.com/v1',
        apiKey: process.env.GROK_API_KEY || 'test-key',
        model: 'grok-3',
        maxTokens: 4000,
        temperature: 0.7,
        isActive: true,
        type: 'openai'
      }
    })
    console.log('✅ AI提供商配置完成')

    // 创建测试角色
    const character = await prisma.character.upsert({
      where: { id: 'char-001' },
      update: {},
      create: {
        id: 'char-001',
        creatorId: adminUser.id,
        name: '智慧助手',
        description: '一个友善的AI助手，专门帮助用户解决问题',
        personality: '友善、耐心、知识渊博',
        backstory: '我是一个专业的AI助手，致力于为用户提供最好的帮助',
        firstMessage: '你好！我是智慧助手，很高兴为您服务。有什么我可以帮助您的吗？',
        category: '助手',
        tags: '["助手", "AI", "智能"]',
        isPublic: true,
        language: 'zh-CN',
        model: 'grok-3'
      }
    })
    console.log('✅ 测试角色创建完成')

    console.log('🎉 种子数据生成完成！')
    console.log(`创建的数据:
    - 管理员用户: ${adminUser.username} (${adminUser.email})
    - 测试用户: ${testUser.username} (${testUser.email})
    - AI提供商: ${aiProvider.name}
    - 测试角色: ${character.name}`)

  } catch (error) {
    console.error('❌ 种子数据生成失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()
