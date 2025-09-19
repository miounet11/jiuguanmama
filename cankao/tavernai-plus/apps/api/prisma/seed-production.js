const { PrismaClient } = require('../node_modules/.prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建生产级种子数据...')

  // 1. 创建管理员用户
  console.log('👤 创建管理员用户...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tavernai.com' },
    update: {},
    create: {
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

  // 2. 创建测试用户
  console.log('👥 创建测试用户...')
  const users = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        passwordHash: await bcrypt.hash('password123', 12),
        bio: `我是测试用户${i}，喜欢与AI角色对话`,
        isVerified: true,
        credits: 1000,
        subscriptionTier: i <= 2 ? 'plus' : 'free'
      }
    })
    users.push(user)
  }

  // 3. 创建AI提供商配置
  console.log('🤖 创建AI提供商配置...')
  await prisma.aIProvider.upsert({
    where: { name: 'grok' },
    update: {},
    create: {
      name: 'grok',
      apiKey: 'sk-test-grok-key',
      baseUrl: 'https://ttkk.inping.com/v1',
      models: JSON.stringify(['grok-2', 'grok-2-mini']),
      isActive: true,
      priority: 1,
      rateLimit: 60,
      costFactor: 1.0
    }
  })

  // 4. 创建AI角色
  console.log('🎭 创建AI角色...')
  const characterData = [
    {
      name: '智慧导师艾丽丝',
      description: '一位睿智温和的AI导师，擅长解答各种问题并提供人生指导',
      personality: '温和耐心，博学多才，善于倾听和引导',
      firstMessage: '你好！我是艾丽丝，很高兴认识你。有什么问题需要帮助的吗？',
      category: '原创',
      tags: JSON.stringify(['智慧', '导师', '哲学']),
      isPublic: true,
      isFeatured: true
    },
    {
      name: '可爱萌妹小樱',
      description: '活泼可爱的二次元少女，总是充满活力和正能量',
      personality: '开朗活泼，天真可爱，喜欢交朋友',
      firstMessage: '哇！你好呀～我是小樱！(๑´ㅂ`๑)',
      category: '动漫',
      tags: JSON.stringify(['可爱', '萌妹', '二次元']),
      isPublic: true,
      isFeatured: true
    }
  ]

  const characters = []
  for (let i = 0; i < characterData.length; i++) {
    const charData = characterData[i]
    const creator = i === 0 ? adminUser : users[0]

    const character = await prisma.character.upsert({
      where: {
        name_creatorId: {
          name: charData.name,
          creatorId: creator.id
        }
      },
      update: {},
      create: {
        ...charData,
        creatorId: creator.id,
        rating: 4.5 + Math.random() * 0.5,
        ratingCount: 50 + Math.floor(Math.random() * 100),
        chatCount: 100 + Math.floor(Math.random() * 500),
        favoriteCount: 50 + Math.floor(Math.random() * 200)
      }
    })
    characters.push(character)
  }

  // 5. 创建聊天会话示例
  console.log('💬 创建聊天会话...')
  for (const user of users.slice(0, 2)) {
    const character = characters[0]

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        characterId: character.id,
        title: `与${character.name}的对话`,
        messageCount: 5,
        totalTokens: 1500
      }
    })

    // 创建示例消息
    await prisma.message.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: 'user',
        content: '你好，很高兴认识你！',
        tokens: 20
      }
    })

    await prisma.message.create({
      data: {
        sessionId: session.id,
        characterId: character.id,
        role: 'assistant',
        content: '你好！我也很高兴认识你。有什么我可以帮助你的吗？',
        tokens: 30
      }
    })
  }

  // 6. 创建用户档案
  console.log('📊 创建用户档案...')
  for (const user of users) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        preferences: JSON.stringify({
          theme: 'auto',
          language: 'zh-CN'
        }),
        interests: JSON.stringify(['AI对话', '角色扮演']),
        chatFrequency: 5.0 + Math.random() * 5,
        avgSessionTime: 15 + Math.floor(Math.random() * 20)
      }
    })
  }

  console.log('✅ 生产级种子数据创建完成！')
  console.log(`📊 数据统计:`)
  console.log(`   👤 用户: ${users.length + 1} (包含1个管理员)`)
  console.log(`   🎭 角色: ${characters.length}`)
  console.log(`   🤖 AI提供商: 1`)
  console.log(`   💬 聊天会话: ${users.length} (前2个用户)`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
