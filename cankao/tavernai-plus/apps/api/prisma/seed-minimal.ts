import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始生成最小种子数据...')

  // 生成密码哈希
  const hashedPassword = await bcrypt.hash('password123', 12)

  // 直接使用SQL插入，绕过Prisma客户端的字段映射问题
  await prisma.$executeRaw`
    INSERT OR REPLACE INTO User (
      id, username, email, passwordHash, role, credits, subscriptionTier, bio,
      created_at, updated_at
    ) VALUES (
      'test-user-1', '测试用户', 'test@tavernai.com', ${hashedPassword},
      'user', 500, 'free', '测试用户账户',
      datetime('now'), datetime('now')
    )
  `

  console.log('✅ 创建测试用户成功')

  // 创建测试角色
  await prisma.$executeRaw`
    INSERT OR REPLACE INTO Character (
      id, name, description, systemPrompt, userId, category, tags,
      created_at, updated_at
    ) VALUES (
      'test-char-1', '测试AI助手', '一个友善的AI助手，专门用于测试系统功能',
      '你是一个友善和有帮助的AI助手。', 'test-user-1', 'assistant',
      '["助手", "测试", "友善"]',
      datetime('now'), datetime('now')
    )
  `

  console.log('✅ 创建测试角色成功')

  console.log('🎉 最小种子数据生成完成！')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
