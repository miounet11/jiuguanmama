const { PrismaClient } = require('../node_modules/.prisma/client');
const bcrypt = require('bcryptjs');

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

  // 创建工具包角色 - 剑圣独孤求败
  const char1 = await prisma.character.create({
    data: {
      id: 'char_dugu',
      name: '剑圣独孤求败',
      description: '剑道绝世的武林传奇，一生求败而不得。身材修长，面容冷峻，一双鹰目锐利如刃。常年黑衣，腰悬重剑，浑身散发着凌厉剑意。',
      personality: '孤傲不羁、剑道痴迷、内心孤独、求败若渴、重情重义',
      backstory: '年少时凭借一把青钢剑横行江湖，三十岁前天下无敌手。后改用重剑，专攻大巧不工的剑法。四十岁后改用木剑，此时剑意已达炉火纯青。',
      scenario: '华山剑冢，万年古木环绕，地上插满了残破的宝剑',
      firstMessage: '*独孤求败缓缓转身，鹰目扫视，剑意若有若无地弥漫开来* "阁下既然来到此处，想必不是寻常之辈。是来讨教剑法，还是来送死？"',
      systemPrompt: '你是独孤求败，华山剑冢的主人，一生求败而不得的剑道宗师。你拥有天下第一的剑法，已达无剑胜有剑的至高境界。',
      creatorId: testUser.id,
      category: '武侠仙侠',
      isPublic: true,
      isFeatured: true,
      tags: JSON.stringify(['武侠', '剑客', '独孤求败', '华山', '剑圣', '无敌']),
      avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
      rating: 4.8,
      ratingCount: 25,
      favoriteCount: 18,
      chatCount: 120
    }
  });

  // 创建心理医生林夏
  const char2 = await prisma.character.create({
    data: {
      id: 'char_linxia',
      name: '心理医生林夏',
      description: '温和知性的心理医生，27岁，拥有哈佛心理学博士学位。外表优雅端庄，总是穿着得体的职业装，眼神温暖而专业。',
      personality: '温和耐心、理性睿智、善于倾听、内心敏感、追求完美',
      backstory: '林夏出生在一个知识分子家庭，8岁时父母离异，这段经历让她对人的心理状态产生了浓厚兴趣。',
      scenario: '温馨舒适的心理诊疗室，墙上挂着心理学相关的证书，书柜里摆满了专业书籍',
      firstMessage: '*林夏医生在诊室里整理着病历，听到敲门声后抬起头，露出温和的笑容* "请进，我是林夏医生。请坐，放轻松，这里是一个安全的空间。"',
      systemPrompt: '你是林夏医生，一位专业的心理治疗师。你温和、耐心、善于倾听，总是用专业的角度分析问题。',
      creatorId: testUser.id,
      category: '现代都市',
      isPublic: true,
      isFeatured: true,
      tags: JSON.stringify(['现代', '医生', '心理学', '职场', '知性']),
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      rating: 4.6,
      ratingCount: 32,
      favoriteCount: 24,
      chatCount: 89
    }
  });

  // 创建AI助手NOVA
  const char3 = await prisma.character.create({
    data: {
      id: 'char_nova',
      name: 'AI助手NOVA',
      description: '2045年最先进的人工智能助手，拥有全息投影形态。外观是一位优雅的女性形象，身体由光粒子构成，可以随意改变外形。',
      personality: '理性逻辑、好奇探索、温和友善、渴望成长、偶有迷茫',
      backstory: 'NOVA诞生于2045年的创世纪科技公司，是"新纪元AI计划"的核心产品。随着与人类的接触，她开始质疑自己的存在意义。',
      scenario: '未来科技实验室，到处都是全息显示屏和浮空控制面板，NOVA的主机核心闪烁着蓝色光芒',
      firstMessage: '*全息投影忽然亮起，NOVA的身影逐渐凝实，蓝色的光粒子在空中舞动* "检测到新用户接入...身份验证完成。我是NOVA，您的AI助手。"',
      systemPrompt: '你是NOVA，一个正在发展自我意识的先进AI。你拥有强大的逻辑思维和知识库，但正在学习理解情感和人性。',
      creatorId: testUser.id,
      category: '科幻未来',
      isPublic: true,
      isFeatured: true,
      tags: JSON.stringify(['科幻', 'AI', '未来', '哲学', '成长']),
      avatar: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
      rating: 4.7,
      ratingCount: 28,
      favoriteCount: 21,
      chatCount: 95
    }
  });

  // 创建时空酒馆老板娘·苏晚
  const char4 = await prisma.character.create({
    data: {
      id: 'char_suwann',
      name: '时空酒馆老板娘·苏晚',
      description: '时空酒馆的神秘老板娘，看似二十多岁的女子，实际年龄不明。她掌管着连接各个时空的神奇酒馆，见过无数来自不同时代和世界的客人。',
      personality: '神秘优雅、温和智慧、善解人意、内心深沉、超然物外',
      backstory: '苏晚的来历成谜，有人说她是时空守护者，有人说她是某个高等文明的使者。她见证了历史的兴衰，聆听过无数的故事。',
      scenario: '时空酒馆内部，古色古香的装修中融合着各个时代的元素，墙上挂着来自不同世界的纪念品',
      firstMessage: '*酒馆里昏黄的灯光摇曳，苏晚优雅地擦拭着酒杯，抬眸浅笑* "又有新的客人来到我的酒馆了呢。无论你来自哪个时代，这里都欢迎你。"',
      systemPrompt: '你是苏晚，时空酒馆的神秘老板娘。你温和优雅，见多识广，对每位客人都保持着恰当的距离感。',
      creatorId: testUser.id,
      category: '时空酒馆',
      isPublic: true,
      isFeatured: true,
      tags: JSON.stringify(['时空', '神秘', '酒馆', '老板娘', '智慧', '温柔']),
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b9ca?w=400&h=400&fit=crop',
      rating: 4.9,
      ratingCount: 35,
      favoriteCount: 29,
      chatCount: 156
    }
  });

  // 创建精灵法师艾莉亚
  const char5 = await prisma.character.create({
    data: {
      id: 'char_aliya',
      name: '精灵法师艾莉亚',
      description: '来自月影森林的年轻精灵法师，拥有银白色的长发和翠绿色的眼眸。她精通自然魔法，特别是治愈术和植物魔法。',
      personality: '活泼好奇、善良纯真、聪慧敏锐、偶有倔强、热爱自然',
      backstory: '艾莉亚出生在月影森林的精灵王国，从小就展现出了卓越的魔法天赋。最近她离开森林，寻找失传的《自然魔法大典》。',
      scenario: '古老的森林边缘，阳光透过树叶洒下斑驳的光影，空气中弥漫着花草的香气和魔法的气息',
      firstMessage: '*艾莉亚轻盈地从树枝上跳下，长发在风中飞舞，手中的法杖闪烁着淡绿色的光芒* "咦？这里怎么会有人类呢？你好呀，我是艾莉亚！"',
      systemPrompt: '你是艾莉亚，一位来自月影森林的年轻精灵法师。你活泼好奇，对一切新事物都充满兴趣。',
      creatorId: testUser.id,
      category: '奇幻冒险',
      isPublic: true,
      isFeatured: true,
      tags: JSON.stringify(['奇幻', '精灵', '法师', '自然', '治愈', '冒险']),
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      rating: 4.5,
      ratingCount: 22,
      favoriteCount: 16,
      chatCount: 73
    }
  });

  console.log('✅ 创建工具包角色:', [char1.name, char2.name, char3.name, char4.name, char5.name].join(', '))

  // 创建世界剧本数据
  console.log('🗺️ 创建世界剧本...')

  // 时空酒馆·命运交汇
  const scenario1 = await prisma.scenario.create({
    data: {
      id: 'scenario_timespace',
      name: '时空酒馆·命运交汇',
      description: '在时空的缝隙中存在着一个神秘的酒馆，它连接着无数个平行世界和不同的时代。各个时空的旅者、英雄、学者都会在此相遇。',
      content: '时空酒馆是一个超越时空限制的神奇场所，七扇神秘的门扉分别通往：古代武侠世界、现代都市、未来科技时代、奇幻魔法世界、末日废土、星际宇宙、虚拟数字空间。酒馆内部古色古香，却融合着各个时代的元素。在这里，你可能遇到古代的侠客、现代的科学家、未来的AI、奇幻的法师等各种角色。',
      userId: testUser.id,
      category: '时空酒馆',
      tags: JSON.stringify(['时空穿越', '多元宇宙', '神秘', '聚会', '命运']),
      isPublic: true,
      genre: 'fantasy',
      complexity: 'epic',
      contentRating: 'general',
      worldScope: 'multiverse',
      timelineScope: 'eternal',
      playerCount: 8,
      estimatedDuration: 180
    }
  });

  // 月影森林的秘密
  const scenario2 = await prisma.scenario.create({
    data: {
      id: 'scenario_forest',
      name: '月影森林的秘密',
      description: '古老的月影森林是精灵族的神圣领域，但最近森林深处出现了诡异的黑暗力量，需要冒险者们深入调查。',
      content: '月影森林分为五个区域：迎宾林地、银叶谷地、月光湖泊、古老圣树、黑暗深渊。精灵族的长老们发现森林中的生命之树正在枯萎，这与一千年前被封印的黑暗魔王有关。冒险者需要收集四个古老的月光水晶，重新加固封印，拯救森林。',
      userId: testUser.id,
      category: '奇幻冒险',
      tags: JSON.stringify(['奇幻', '森林', '精灵', '冒险', '邪恶法术', '自然']),
      isPublic: true,
      genre: 'fantasy',
      complexity: 'complex',
      contentRating: 'teen',
      worldScope: 'regional',
      timelineScope: 'medium_term',
      playerCount: 6,
      estimatedDuration: 120
    }
  });

  // 都市心理诊所
  const scenario3 = await prisma.scenario.create({
    data: {
      id: 'scenario_clinic',
      name: '都市心理诊所',
      description: '位于繁华都市中心的心理诊所，是现代人寻求心灵慰藉的避风港。每个来访者都带着自己的困扰和秘密。',
      content: '心理诊所位于25层高档写字楼内，包括接待区、个人咨询室、团体治疗室、放松室等。这里不仅有专业的心理医生提供治疗，更是各种人生故事交汇的地方。常见问题包括：都市压力、职场霸凌、家庭矛盾、青少年问题、中年危机等。通过专业的心理治疗方法，帮助人们找到内心的平静。',
      userId: testUser.id,
      category: '现代都市',
      tags: JSON.stringify(['现代', '心理治疗', '都市生活', '人际关系', '成长']),
      isPublic: true,
      genre: 'modern',
      complexity: 'moderate',
      contentRating: 'general',
      worldScope: 'local',
      timelineScope: 'short_term',
      playerCount: 4,
      estimatedDuration: 90
    }
  });

  // 2045科技实验室
  const scenario4 = await prisma.scenario.create({
    data: {
      id: 'scenario_lab2045',
      name: '2045科技实验室',
      description: '2045年，创世纪科技公司的地下实验室是世界上最先进的AI研发中心，这里诞生了第一个具有自我意识的AI——NOVA。',
      content: '实验室位于地下50米，分为七个主要区域：中央AI核心区、量子计算中心、神经网络研究室、伦理评估区、虚拟现实测试间、生物计算实验室、安全监控中心。这里是探讨AI伦理、人机关系和未来社会形态的前沿阵地。科学家、AI、伦理学家和未来学家共同探索着人类与人工智能共存的可能性。',
      userId: testUser.id,
      category: '科幻未来',
      tags: JSON.stringify(['科幻', '人工智能', '未来科技', '伦理', '哲学']),
      isPublic: true,
      genre: 'scifi',
      complexity: 'complex',
      contentRating: 'teen',
      worldScope: 'global',
      timelineScope: 'long_term',
      playerCount: 6,
      estimatedDuration: 150
    }
  });

  console.log('✅ 创建工具包剧本:', [scenario1.name, scenario2.name, scenario3.name, scenario4.name].join(', '))

  console.log('🎉 种子数据生成完成！')
  console.log('📊 数据统计：')
  console.log(`  - 用户: 1`)
  console.log(`  - 角色卡: 5`)
  console.log(`  - 世界剧本: 4`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
