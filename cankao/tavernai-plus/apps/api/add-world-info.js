const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addWorldInfo() {
  try {
    // 为时空酒馆剧本添加世界信息条目
    const scenarioId = 'scenario_timespace';

    // 添加多个世界信息条目
    const worldInfoEntries = [
      {
        id: 'world-tavern-core',
        scenarioId: scenarioId,
        title: '时空酒馆核心规则',
        content: '时空酒馆是连接所有时空的中立地带，在这里禁止任何形式的暴力行为。所有进入酒馆的客人都会自动获得"时空漫游者"身份，可以自由穿越不同的时空门扉。',
        keywords: ['时空酒馆', '规则', '中立地带', '时空漫游者'],
        priority: 100,
        isActive: true,
        order: 1
      },
      {
        id: 'world-tavern-structure',
        scenarioId: scenarioId,
        title: '酒馆内部结构',
        content: '时空酒馆内部看似普通，但实际上是一个独立的空间维度。中央有一个永恒燃烧的壁炉，七扇门分别代表不同的时空。吧台后面有一面古老的镜子，据说能够映照出每个客人内心深处的渴望。',
        keywords: ['酒馆结构', '壁炉', '七扇门', '古老镜子'],
        priority: 90,
        isActive: true,
        order: 2
      },
      {
        id: 'world-time-doors',
        scenarioId: scenarioId,
        title: '时空门扉系统',
        content: '七扇门分别通往：1号门-古代武侠世界；2号门-现代都市；3号门-未来科技时代；4号门-奇幻魔法世界；5号门-末日废土；6号门-星际宇宙；7号门-虚拟数字空间。每扇门都有自己的规则和限制。',
        keywords: ['时空门', '七个世界', '穿越规则', '门扉系统'],
        priority: 95,
        isActive: true,
        order: 3
      },
      {
        id: 'world-tavern-keeper',
        scenarioId: scenarioId,
        title: '酒馆老板娘的秘密',
        content: '苏晚并非普通的酒馆老板娘，她是时空酒馆的守护者，拥有调节各个时空平衡的能力。她的年龄无法用常规方式计算，据说已经见证了无数文明的兴衰。她从不干涉客人的选择，但会在关键时刻给予神秘的指引。',
        keywords: ['苏晚', '守护者', '时空平衡', '神秘指引'],
        priority: 85,
        isActive: true,
        order: 4
      },
      {
        id: 'world-time-travelers',
        scenarioId: scenarioId,
        title: '时空旅者须知',
        content: '所有进入时空酒馆的客人都被称为"时空旅者"。旅者可以在不同时空间穿梭，但必须遵守"不干涉历史进程"的基本原则。每个旅者都会获得一枚时空印记，这枚印记记录了他们在各个时空的经历和选择。',
        keywords: ['时空旅者', '不干涉原则', '时空印记', '经历记录'],
        priority: 80,
        isActive: true,
        order: 5
      },
      {
        id: 'world-paradox-protection',
        scenarioId: scenarioId,
        title: '悖论保护机制',
        content: '时空酒馆内置了强大的悖论保护机制。如果旅者的行为可能导致严重的时间悖论，酒馆会自动干预。这种干预通常以神秘的预兆、直觉提醒，或者老板娘苏晚的暗示形式出现。',
        keywords: ['悖论保护', '时间悖论', '自动干预', '预兆系统'],
        priority: 88,
        isActive: true,
        order: 6
      },
      {
        id: 'world-tavern-services',
        scenarioId: scenarioId,
        title: '酒馆特殊服务',
        content: '时空酒馆不仅提供住宿和餐饮，还提供特殊服务：时空导航（帮助旅者找到目标时空）、记忆保管（安全存储重要记忆）、物品交换（跨时空物品交易）、命运咨询（通过神秘方式预测可能的未来）。',
        keywords: ['特殊服务', '时空导航', '记忆保管', '命运咨询'],
        priority: 75,
        isActive: true,
        order: 7
      },
      {
        id: 'world-secret-rooms',
        scenarioId: scenarioId,
        title: '隐藏的密室',
        content: '时空酒馆内有多个隐藏的密室，只有特定的时空印记才能开启。这些密室包括：时空图书馆（记录所有时空的历史）、命运编织室（可以观察和微调命运线）、回响大厅（能够听到过去和未来的声音）。',
        keywords: ['隐藏密室', '时空图书馆', '命运编织', '时空回响'],
        priority: 70,
        isActive: true,
        order: 8
      }
    ];

    // 使用原生SQL插入数据，因为Prisma可能还没有这个表结构
    for (const entry of worldInfoEntries) {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO "WorldInfo" (
          "id", "scenarioId", "title", "content", "keywords",
          "priority", "isActive", "order", "createdAt", "updatedAt"
        ) VALUES (
          ${entry.id}, ${entry.scenarioId}, ${entry.title}, ${entry.content},
          ${JSON.stringify(entry.keywords)}, ${entry.priority}, ${entry.isActive},
          ${entry.order}, datetime('now'), datetime('now')
        )
      `;
    }

    console.log('✅ 成功为时空酒馆剧本添加了8个世界信息条目');

    // 验证数据是否成功插入
    const count = await prisma.$executeRaw`SELECT COUNT(*) as count FROM "WorldInfo" WHERE "scenarioId" = ${scenarioId}`;
    console.log(`📊 当前剧本共有 ${count[0].count} 个世界信息条目`);

  } catch (error) {
    console.error('❌ 添加世界信息失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorldInfo();