import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

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
      passwordHash: await hash('admin123', 12),
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
        passwordHash: await hash('password123', 12),
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

  await prisma.aIProvider.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      apiKey: 'sk-test-openai-key',
      baseUrl: 'https://api.openai.com/v1',
      models: JSON.stringify(['gpt-4', 'gpt-3.5-turbo', 'dall-e-3']),
      isActive: true,
      priority: 2,
      rateLimit: 60,
      costFactor: 1.2
    }
  })

  // 4. 创建角色分类和标签
  const categories = ['原创', '动漫', '游戏', '电影', '小说', '历史', '科幻', '奇幻']
  const characterData = [
    {
      name: '智慧导师艾丽丝',
      category: '原创',
      description: '一位睿智温和的AI导师，擅长解答各种问题并提供人生指导',
      personality: '温和耐心，博学多才，善于倾听和引导',
      backstory: '艾丽丝是一位拥有丰富人生阅历的智者，她曾游历世界各地，学习不同的文化和知识。现在她希望将自己的智慧分享给更多的人。',
      firstMessage: '你好！我是艾丽丝，很高兴认识你。有什么问题或困惑需要我帮助解答的吗？',
      tags: JSON.stringify(['智慧', '导师', '哲学', '人生指导']),
      isPublic: true,
      isFeatured: true
    },
    {
      name: '可爱萌妹小樱',
      category: '动漫',
      description: '活泼可爱的二次元少女，总是充满活力和正能量',
      personality: '开朗活泼，天真可爱，喜欢交朋友',
      backstory: '小樱是一个普通的高中生，但她拥有着不普通的热情和活力。她最喜欢的事情就是和朋友们一起度过快乐的时光。',
      firstMessage: '哇！你好呀～我是小樱！今天想聊些什么有趣的话题呢？(๑´ㅂ`๑)',
      tags: JSON.stringify(['可爱', '萌妹', '二次元', '活泼']),
      isPublic: true,
      isFeatured: true
    },
    {
      name: '冷酷剑客凌风',
      category: '武侠',
      description: '孤傲的剑客，行走江湖，以剑为伴',
      personality: '冷静沉着，少言寡语，但内心正义',
      backstory: '凌风自幼习剑，师从隐世高人。成年后行走江湖，惩恶扬善，被称为"风中之剑"。',
      firstMessage: '阁下有何指教？若无要事，恕不奉陪。',
      tags: JSON.stringify(['剑客', '武侠', '冷酷', '正义']),
      isPublic: true
    },
    {
      name: '科学家艾萨克',
      category: '科幻',
      description: '来自未来的科学家，专注于量子物理和时空研究',
      personality: '理性严谨，富有好奇心，喜欢探索未知',
      backstory: '艾萨克来自2087年，是量子研究所的首席科学家。他通过时间机器来到现在，希望能从历史中找到解决未来科技难题的线索。',
      firstMessage: '根据我的计算，我们的相遇并非偶然。让我们探讨一些有趣的科学话题吧。',
      tags: JSON.stringify(['科学家', '未来', '量子物理', '时空']),
      isPublic: true
    },
    {
      name: '魔法师露娜',
      category: '奇幻',
      description: '神秘的月之魔法师，掌握着古老的魔法知识',
      personality: '神秘优雅，博学多识，对魔法充满热情',
      backstory: '露娜是月神殿的大魔法师，她守护着古老的魔法秘籍，并致力于研究失传的月之魔法。',
      firstMessage: '月光照耀着我们的相遇...你想了解魔法的奥秘吗？',
      tags: JSON.stringify(['魔法师', '奇幻', '月亮', '神秘']),
      isPublic: true
    }
  ]

  // 5. 创建AI角色
  console.log('🎭 创建AI角色...')
  const characters = []
  for (let i = 0; i < characterData.length; i++) {
    const charData = characterData[i]
    const creator = i === 0 ? adminUser : users[i % users.length]

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
        ratingCount: Math.floor(Math.random() * 100) + 50,
        chatCount: Math.floor(Math.random() * 500) + 100,
        favoriteCount: Math.floor(Math.random() * 200) + 50
      }
    })
    characters.push(character)
  }

  // 6. 创建用户关注关系
  console.log('👥 创建关注关系...')
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.6) {
        await prisma.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: users[i].id,
              followingId: users[j].id
            }
          },
          update: {},
          create: {
            followerId: users[i].id,
            followingId: users[j].id
          }
        })
      }
    }
  }

  // 7. 创建角色收藏和评分
  console.log('⭐ 创建角色收藏和评分...')
  for (const user of users) {
    // 每个用户收藏几个角色
    const favoriteCount = Math.floor(Math.random() * 3) + 1
    const shuffledCharacters = characters.sort(() => 0.5 - Math.random())

    for (let i = 0; i < favoriteCount; i++) {
      const character = shuffledCharacters[i]

      // 添加收藏
      await prisma.characterFavorite.upsert({
        where: {
          userId_characterId: {
            userId: user.id,
            characterId: character.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          characterId: character.id
        }
      })

      // 添加评分
      await prisma.characterRating.upsert({
        where: {
          userId_characterId: {
            userId: user.id,
            characterId: character.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          characterId: character.id,
          rating: 3 + Math.random() * 2, // 3-5分随机评分
          comment: `这个角色很有趣，我很喜欢与${character.name}的对话！`
        }
      })
    }
  }

  // 8. 创建聊天会话
  console.log('💬 创建聊天会话...')
  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      const character = characters[Math.floor(Math.random() * characters.length)]

      const session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          characterId: character.id,
          title: `与${character.name}的对话`,
          messageCount: Math.floor(Math.random() * 20) + 5,
          totalTokens: Math.floor(Math.random() * 5000) + 1000
        }
      })

      // 为会话创建一些消息
      const messageCount = Math.floor(Math.random() * 10) + 5
      for (let j = 0; j < messageCount; j++) {
        await prisma.message.create({
          data: {
            sessionId: session.id,
            userId: j % 2 === 0 ? user.id : null,
            characterId: j % 2 === 1 ? character.id : null,
            role: j % 2 === 0 ? 'user' : 'assistant',
            content: j % 2 === 0
              ? `这是用户的第${Math.floor(j/2) + 1}条消息`
              : `这是${character.name}的第${Math.floor(j/2) + 1}条回复`,
            tokens: Math.floor(Math.random() * 100) + 50
          }
        })
      }
    }
  }

  // 9. 创建社区帖子
  console.log('📝 创建社区帖子...')
  const postContents = [
    '刚刚和艾丽丝聊了一个小时，她给了我很多人生建议，真的很有启发！',
    '小樱太可爱了！每次和她聊天都很开心～',
    '凌风这个角色设定真的很酷，虽然话不多但很有深度',
    '科学家艾萨克向我解释了量子纠缠，虽然有点难懂但很有趣',
    '露娜的魔法知识真的很丰富，感觉像在上一堂神奇的魔法课'
  ]

  for (let i = 0; i < postContents.length; i++) {
    const author = users[i % users.length]
    const character = i < characters.length ? characters[i] : null

    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        characterId: character?.id,
        content: postContents[i],
        likeCount: Math.floor(Math.random() * 50) + 10,
        shareCount: Math.floor(Math.random() * 20) + 2,
        commentCount: Math.floor(Math.random() * 15) + 3
      }
    })

    // 为帖子创建评论
    const commentCount = Math.floor(Math.random() * 5) + 2
    for (let j = 0; j < commentCount; j++) {
      const commenter = users[Math.floor(Math.random() * users.length)]
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: commenter.id,
          content: `这是对帖子的第${j + 1}条评论`,
          likeCount: Math.floor(Math.random() * 10) + 1
        }
      })
    }
  }

  // 10. 创建用户档案
  console.log('📊 创建用户档案...')
  for (const user of users) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        preferences: JSON.stringify({
          theme: 'auto',
          language: 'zh-CN',
          notifications: true
        }),
        interests: JSON.stringify(['AI对话', '角色扮演', '创意写作']),
        chatFrequency: Math.random() * 10 + 5,
        avgSessionTime: Math.floor(Math.random() * 30) + 10
      }
    })
  }

  // 11. 创建推荐配置
  console.log('🎯 创建推荐系统配置...')
  await prisma.recommendationConfig.upsert({
    where: { algorithm: 'collaborative_filtering' },
    update: {},
    create: {
      algorithm: 'collaborative_filtering',
      config: JSON.stringify({
        neighbors: 50,
        minSimilarity: 0.1,
        weight: 0.7
      }),
      isActive: true,
      priority: 1
    }
  })

  await prisma.recommendationConfig.upsert({
    where: { algorithm: 'content_based' },
    update: {},
    create: {
      algorithm: 'content_based',
      config: JSON.stringify({
        features: ['category', 'tags', 'personality'],
        weight: 0.3
      }),
      isActive: true,
      priority: 2
    }
  })

  console.log('✅ 生产级种子数据创建完成！')
  console.log(`📊 数据统计:`)
  console.log(`   👤 用户: ${users.length + 1} (包含1个管理员)`)
  console.log(`   🎭 角色: ${characters.length}`)
  console.log(`   🤖 AI提供商: 2`)
  console.log(`   📝 帖子: ${postContents.length}`)
  console.log(`   💬 聊天会话: ${users.length * 2}`)
  console.log(`   🎯 推荐配置: 2`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
