import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 开始生成测试种子数据...')

  // 生成密码哈希
  const hashedPassword = await bcrypt.hash('password123', 12)

  // 创建一个测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@tavernai.com' },
    update: {},
    create: {
      id: 'test-user-1',
      username: '测试用户',
      email: 'test@tavernai.com',
      passwordHash: hashedPassword,
      role: 'user',
      subscriptionTier: 'free',
      credits: 100
    }
  })

  console.log('✅ 测试用户创建成功:', testUser.username)

  // 创建一个测试角色
  const testCharacter = await prisma.character.upsert({
    where: { id: 'test-char-1' },
    update: {},
    create: {
      id: 'test-char-1',
      name: '测试角色',
      description: '这是一个用于测试的AI角色',
      personality: '友善、耐心、乐于助人',
      firstMessage: '你好！我是测试角色，很高兴认识你！',
      category: '测试',
      tags: '["测试", "友善"]',
      creatorId: testUser.id,
      isPublic: true,
      isNSFW: false,
      metadata: '{}'
    }
  })

  console.log('✅ 测试角色创建成功:', testCharacter.name)

  console.log('🎉 测试种子数据生成完成！')
  console.log('📊 数据统计:')
  console.log(`   - 用户: 1`)
  console.log(`   - 角色: 1`)
  console.log('')
  console.log('🧪 测试账户:')
  console.log('   用户: test@tavernai.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ 测试种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
