const { PrismaClient } = require('./node_modules/.prisma/client')

async function test() {
  const prisma = new PrismaClient()
  try {
    console.log('Testing Prisma connection...')

    // 检查现有表
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    console.log('📋 Tables in database:', tables)

    if (tables.length === 0) {
      console.log('🔧 No tables found, trying to create User table manually...')
      await prisma.$executeRaw`
        CREATE TABLE User (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          passwordHash TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('✅ User table created')
    }

    console.log('✅ Prisma connection test completed')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
