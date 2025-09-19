import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始生成简单种子数据...')

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
      credits: 500,
      bio: '测试用户账户'
    }
  })

  console.log('✅ 创建测试用户:', testUser.username)

  // 创建一个测试角色
  const testCharacter = await prisma.character.create({
    data: {
      id: 'test-char-1',
      name: '测试AI助手',
      description: '一个友善的AI助手，专门用于测试系统功能',
      systemPrompt: '你是一个友善和有帮助的AI助手。',
      creatorId: testUser.id,
      category: 'assistant',
      isPublic: true,
      tags: JSON.stringify(['助手', '测试', '友善']),
      avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop'
    }
  })

  console.log('✅ 创建测试角色:', testCharacter.name)

  console.log('🎉 简单种子数据生成完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
