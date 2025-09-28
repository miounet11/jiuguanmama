const { PrismaClient } = require('../node_modules/.prisma/client');

const prisma = new PrismaClient();

async function seedEnhancedScenarios() {
  console.log('🌱 开始种子数据：增强世界剧本系统...');

  // 获取或创建一个用户
  let user = await prisma.user.findFirst({
    where: { email: 'admin@tavernai.com' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@tavernai.com',
        passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        isAdmin: true,
        role: 'admin'
      }
    });
    console.log('✅ 创建管理员用户');
  }

  // 创建剧本模板
  const scenarioTemplate = await prisma.scenarioTemplate.create({
    data: {
      name: '魔法学院传奇模板',
      description: '适用于魔法学院背景的剧本模板，包含完整的世界设定框架',
      templateData: JSON.stringify({
        worldSetting: '一个充满魔法与奇迹的学院世界',
        defaultLocations: ['学院主楼', '图书馆', '训练场', '宿舍区'],
        defaultOrganizations: ['学生会', '教师团', '守护者联盟'],
        defaultRules: ['魔法使用规范', '学院纪律', '禁忌魔法限制']
      }),
      category: '魔幻',
      isPublic: true,
      createdBy: user.id
    }
  });
  console.log('✅ 创建剧本模板');

  // 创建增强世界剧本：阿卡迪亚魔法学院传奇
  const enhancedScenario = await prisma.scenario.create({
    data: {
      userId: user.id,
      name: '阿卡迪亚魔法学院传奇：失落的元素之心',
      description: '在古老而神秘的阿卡迪亚魔法学院，四大元素的平衡即将被打破。传说中的元素之心碎片散落在学院的各个角落，而黑暗势力正在悄然逼近。作为新入学的学生，你将踏上一段充满冒险、友谊与成长的魔法之旅。',
      worldSetting: `阿卡迪亚魔法学院建立在古老的龙脉交汇点上，这里聚集着来自世界各地的天才魔法师。学院分为四大学院：炽焰之塔（火系）、深海之庭（水系）、苍穹之台（风系）、大地之根（土系）。每个学院都有自己独特的传统、魔法体系和守护精灵。

学院的核心是一座高耸入云的中央塔楼，塔顶供奉着传说中的元素之心——一颗能够平衡四大元素之力的神秘水晶。然而，三百年前的一场大战中，元素之心破碎成了四块碎片，分别隐藏在学院的四个秘密区域中。

如今，随着魔法世界的动荡加剧，古老的预言开始应验：当黑暗重新降临时，只有重新聚集元素之心的力量，才能拯救整个魔法世界。而这个重任，即将落在新一代年轻魔法师的肩膀上。`,
      content: `## 剧本背景

阿卡迪亚魔法学院是一所拥有千年历史的顶级魔法学府，坐落在四大元素魔法交汇的神秘岛屿上。学院不仅是学习魔法的圣地，更是守护世界魔法平衡的重要堡垒。

## 核心冲突

近期，学院周围开始出现异常的魔法波动，古老的封印逐渐松动，预示着黑暗势力"虚无教团"的重新崛起。这个组织曾在三百年前试图毁灭元素之心，虽然被击败，但他们的残余势力一直在暗中策划复仇。

## 角色使命

玩家作为新入学的学生，将在导师的指引下：
1. 探索学院的神秘区域
2. 寻找失落的元素之心碎片
3. 与同学们建立深厚友谊
4. 学习强大的魔法技能
5. 最终对抗虚无教团的威胁

## 游戏机制

- **魔法学习系统**：通过课程和实践提升各系魔法能力
- **友谊与团队**：与其他学生建立关系，组建冒险小队
- **探索发现**：在学院各处寻找线索和宝藏
- **道德选择**：面对各种道德难题，影响故事走向
- **元素共鸣**：根据选择的主修元素，解锁特殊剧情路线`,
      tags: JSON.stringify(['魔法', '学院', '冒险', '友谊', '成长', '奇幻']),
      category: '魔幻',
      language: 'zh-CN',

      // 增强字段
      genre: 'fantasy',
      complexity: 'complex',
      contentRating: 'teen',
      worldScope: 'regional',
      timelineScope: 'long_term',
      playerCount: 1,
      estimatedDuration: 150, // 150小时的游戏时间
      templateId: scenarioTemplate.id,
      isFeatured: true,
      isPublic: true
    }
  });
  console.log('✅ 创建增强世界剧本');

  // 创建世界地点
  const worldLocations = [
    {
      name: '中央塔楼',
      description: '阿卡迪亚学院的标志性建筑，高达300米的魔法塔楼，顶部曾经供奉着元素之心。塔内设有院长办公室、高级法师会议厅、以及通往各个秘密区域的传送门。',
      locationType: 'landmark',
      atmosphere: '庄严神秘，充满古老魔法的气息',
      significance: 'legendary',
      coordinates: '学院中心点',
      isAccessible: true,
      accessRequirements: '需要相应权限或导师陪同'
    },
    {
      name: '炽焰之塔',
      description: '火系魔法学院的主建筑，由红色的龙鳞石建造，内部永远燃烧着不熄的魔法火焰。这里是火系学生学习和生活的地方，也是火元素之心碎片的可能藏身之处。',
      locationType: 'building',
      atmosphere: '温暖而充满活力，空气中弥漫着轻微的硫磺味',
      significance: 'major',
      coordinates: '学院东南区域',
      isAccessible: true,
      accessRequirements: '火系学生或获得许可'
    },
    {
      name: '深海之庭',
      description: '水系魔法学院坐落在一个巨大的人工湖中央，建筑完全由蓝色水晶构成，可以在水下呼吸。庭院内有各种海洋生物和水生植物，营造出深海的神秘氛围。',
      locationType: 'building',
      atmosphere: '宁静深邃，带有海洋的咸湿气息',
      significance: 'major',
      coordinates: '学院西北区域',
      isAccessible: true,
      accessRequirements: '水系学生或水下呼吸法术'
    },
    {
      name: '苍穹之台',
      description: '风系魔法学院建在悬浮的云朵之上，只能通过飞行或传送到达。建筑轻盈如羽毛，随风轻摆，从这里可以俯瞰整个学院和周围的海域。',
      locationType: 'building',
      atmosphere: '自由飘逸，空气清新而充满魔法粒子',
      significance: 'major',
      coordinates: '学院上空200米',
      isAccessible: false,
      accessRequirements: '飞行能力或传送法术'
    },
    {
      name: '大地之根',
      description: '土系魔法学院建在地下深处，由活体岩石和古老的树根构成。这里与大地的脉搏紧密相连，能够感受到整个岛屿的生命力。',
      locationType: 'building',
      atmosphere: '厚重稳固，充满大地的力量和生命的气息',
      significance: 'major',
      coordinates: '学院地下50米',
      isAccessible: true,
      accessRequirements: '土系学生或地道通行证'
    }
  ];

  const createdLocations = [];
  for (const location of worldLocations) {
    const created = await prisma.worldLocation.create({
      data: {
        ...location,
        scenarioId: enhancedScenario.id
      }
    });
    createdLocations.push(created);
  }
  console.log('✅ 创建世界地点');

  // 创建世界事件
  const worldEvents = [
    {
      name: '元素之心的破碎',
      description: '三百年前，虚无教团入侵阿卡迪亚学院，试图夺取元素之心的力量。在激烈的战斗中，时任院长为了阻止教团的阴谋，不惜将元素之心分裂成四块碎片，分别隐藏起来。',
      eventType: 'historical',
      timeReference: '三百年前（魔法历1423年）',
      importance: 'world_changing',
      consequences: '四大元素学院建立，魔法世界格局重塑，虚无教团被封印',
      involvedCharacters: JSON.stringify(['阿卡迪亚大法师', '虚无教团首领', '四元素守护者']),
      relatedLocationIds: JSON.stringify([createdLocations[0].id])
    },
    {
      name: '预言之夜',
      description: '每年春分夜，中央塔楼的星象仪会显示古老的预言。今年的预言显示，黑暗即将重新降临，只有新的元素守护者才能拯救世界。',
      eventType: 'cyclical',
      timeReference: '每年春分（魔法历3月21日）',
      importance: 'major',
      consequences: '指引新学生的命运道路，揭示隐藏的任务',
      involvedCharacters: JSON.stringify(['现任院长', '占星术教授', '新入学学生']),
      relatedLocationIds: JSON.stringify([createdLocations[0].id])
    },
    {
      name: '封印松动事件',
      description: '最近几个月，虚无教团的封印开始出现裂缝，黑暗力量重新渗透到学院周围。异常的魔法波动和怪异现象开始频繁出现。',
      eventType: 'ongoing',
      timeReference: '当前时间线',
      importance: 'world_changing',
      consequences: '学院戒备等级提升，开始寻找新的元素守护者',
      involvedCharacters: JSON.stringify(['学院守卫', '高级法师', '神秘黑影']),
      relatedLocationIds: JSON.stringify([])
    },
    {
      name: '新生入学典礼',
      description: '新学年开始，来自世界各地的天才魔法师聚集在阿卡迪亚学院。这一届的新生中隐藏着命运的选择者，他们将决定魔法世界的未来。',
      eventType: 'future',
      timeReference: '剧本开始时',
      importance: 'major',
      consequences: '新的冒险开始，角色间的关系建立',
      involvedCharacters: JSON.stringify(['新生', '导师', '在校学生']),
      relatedLocationIds: JSON.stringify([createdLocations[0].id])
    }
  ];

  for (const event of worldEvents) {
    await prisma.worldEvent.create({
      data: {
        ...event,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界事件');

  // 创建世界组织
  const worldOrganizations = [
    {
      name: '元素守护者议会',
      description: '由四大元素学院的顶级法师组成的最高决策机构，负责保护元素之心的秘密和维护学院的安全。议会成员都是经历过元素之心破碎事件的老一辈法师。',
      organizationType: 'government',
      influence: 'regional',
      goals: JSON.stringify(['保护元素之心碎片', '培养新的守护者', '对抗虚无教团', '维护魔法世界平衡']),
      leadership: '四大元素院长轮流担任议长',
      memberCount: '12人（每个学院3名代表）',
      headquarters: '中央塔楼顶层会议厅',
      isActive: true
    },
    {
      name: '学生冒险者联盟',
      description: '由勇敢的学生自发组成的冒险组织，专门探索学院的未知区域和解决各种神秘事件。虽然经常被老师们认为是"惹麻烦的小鬼"，但他们的发现往往对学院很有价值。',
      organizationType: 'guild',
      influence: 'local',
      goals: JSON.stringify(['探索未知区域', '解决神秘事件', '提升魔法技能', '寻找传说中的宝藏']),
      leadership: '由学生投票选出的会长',
      memberCount: '约50人（活跃成员15人）',
      headquarters: '废弃的炼金实验室',
      isActive: true
    },
    {
      name: '虚无教团残余',
      description: '三百年前被击败的邪恶组织的残余势力，一直在暗中策划复仇。他们相信通过毁灭元素之心，可以让世界回归原始的混沌状态，从而获得终极的力量。',
      organizationType: 'criminal',
      influence: 'international',
      goals: JSON.stringify(['重新集结力量', '寻找元素之心碎片', '破坏学院的防御', '实现世界的"净化"']),
      leadership: '神秘的新首领"虚无之主"',
      memberCount: '未知（估计数百人）',
      headquarters: '隐藏在暗影维度',
      isActive: true
    },
    {
      name: '古代魔法研究社',
      description: '专门研究古代魔法文献和失传法术的学术组织，由教授和高年级学生组成。他们掌握着许多关于元素之心和学院历史的重要信息。',
      organizationType: 'academic',
      influence: 'local',
      goals: JSON.stringify(['研究古代魔法', '保存历史文献', '解译预言和符文', '指导学生研究']),
      leadership: '古代魔法学教授担任社长',
      memberCount: '25人（教授5人，学生20人）',
      headquarters: '图书馆地下古籍室',
      isActive: true
    }
  ];

  for (const organization of worldOrganizations) {
    await prisma.worldOrganization.create({
      data: {
        ...organization,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界组织');

  // 创建世界文化
  const worldCultures = [
    {
      name: '火之文化',
      description: '炽焰之塔学生的文化特色，注重激情、勇气和直接行动。他们相信通过燃烧自己的热情来点亮世界，社交活动通常围绕竞技和庆典进行。',
      language: '火语（Ancient Pyromantic）',
      traditions: JSON.stringify(['火焰节庆典', '勇气试炼', '龙息仪式', '熔炉锻造']),
      beliefs: JSON.stringify(['激情胜过理智', '行动胜过言语', '荣誉高于生命', '团结如火焰']),
      influence: 'regional',
      population: '约300人（学生+教职工）',
      notableFigures: JSON.stringify(['炽焰院长', '龙骑士导师', '传奇决斗家'])
    },
    {
      name: '水之文化',
      description: '深海之庭的文化强调流动、适应和深度思考。他们认为智慧如水，能够适应任何形状的容器，解决问题时更倾向于迂回和包容的方式。',
      language: '水语（Aquatic Mystic）',
      traditions: JSON.stringify(['月圆潮汐仪式', '深海冥想', '水晶共鸣', '治愈圈仪式']),
      beliefs: JSON.stringify(['变化是永恒的', '包容胜过对抗', '深度胜过表面', '流动带来力量']),
      influence: 'regional',
      population: '约280人（学生+教职工）',
      notableFigures: JSON.stringify(['深海院长', '治愈大师', '水晶先知'])
    }
  ];

  for (const culture of worldCultures) {
    await prisma.worldCulture.create({
      data: {
        ...culture,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界文化');

  // 创建世界物品
  const worldItems = [
    {
      name: '元素共鸣水晶',
      description: '能够感应元素之心碎片位置的神秘水晶，当接近碎片时会发出相应元素的光芒。每个新生在入学时都会获得一块，但只有真正的守护者候选人的水晶才会激活。',
      itemType: 'artifact',
      rarity: 'rare',
      properties: JSON.stringify(['元素感应', '魔法放大', '身份认证']),
      requirements: '具有魔法天赋的学生',
      effects: '增强持有者的元素魔法威力10%，能够感应1公里范围内的元素之心碎片',
      value: '无价（学院配发，不可交易）',
      locationFound: '新生入学时由院长亲自颁发'
    },
    {
      name: '古代魔导书',
      description: '记录着失传已久的古代魔法的珍贵典籍，书页由龙皮制成，文字会随着读者的魔法水平而显现不同的内容。据说其中隐藏着关于元素之心的重要线索。',
      itemType: 'document',
      rarity: 'legendary',
      properties: JSON.stringify(['自适应内容', '魔法知识', '预言解读']),
      requirements: '高级魔法理论知识，古代语言理解能力',
      effects: '学习古代魔法法术，获得历史知识，解读预言',
      value: '价值连城（图书馆镇馆之宝）',
      locationFound: '图书馆禁书区深处'
    },
    {
      name: '元素法杖',
      description: '由特殊的元素金属锻造而成的法杖，能够大幅增强特定元素的魔法威力。每个元素学院只有几根，通常只有最优秀的学生才能获得使用权。',
      itemType: 'weapon',
      rarity: 'epic',
      properties: JSON.stringify(['元素增幅', '法术聚焦', '魔力储存']),
      requirements: '对应元素学院的高年级学生，经导师认可',
      effects: '增强对应元素魔法威力50%，可储存额外魔力',
      value: '极其珍贵（学院重要财产）',
      locationFound: '各元素学院的圣器室'
    }
  ];

  for (const item of worldItems) {
    await prisma.worldItem.create({
      data: {
        ...item,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界物品');

  // 创建世界规则
  const worldRules = [
    {
      name: '元素平衡法则',
      description: '阿卡迪亚学院的基本魔法法则，要求所有魔法活动都必须保持四大元素的平衡。过度使用某一元素魔法会导致魔法反噬和环境破坏。',
      ruleType: 'magical',
      scope: 'regional',
      enforcement: 'natural',
      exceptions: '在生命危险的紧急情况下，可以暂时打破平衡',
      consequences: '违反者将面临魔法反噬，严重时可能导致魔法能力永久受损'
    },
    {
      name: '学院纪律条例',
      description: '规范学生行为的基本规则，包括上课时间、宿舍管理、图书馆使用、魔法实验安全等方面的详细规定。',
      ruleType: 'social',
      scope: 'local',
      enforcement: 'enforced',
      exceptions: '特殊任务或紧急情况下，经导师批准可以例外',
      consequences: '违反者将面临学分扣除、禁足、劳动服务等惩罚'
    },
    {
      name: '禁忌魔法限制',
      description: '严格禁止学习和使用的危险魔法类型，包括灵魂操控、时间扭曲、维度撕裂等。这些魔法被认为对施法者和周围环境都极其危险。',
      ruleType: 'magical',
      scope: 'global',
      enforcement: 'magical',
      exceptions: '只有在对抗世界级威胁时，经元素守护者议会全体同意才可考虑',
      consequences: '使用禁忌魔法者将被立即开除学籍，并可能面临魔法封印'
    },
    {
      name: '导师指导原则',
      description: '规定师生关系的基本准则，要求导师必须以学生的成长和安全为首要考虑，学生应尊重导师的指导并承担相应的学习责任。',
      ruleType: 'social',
      scope: 'local',
      enforcement: 'cultural',
      exceptions: '在师生意见严重分歧时，可以申请更换导师或寻求第三方调解',
      consequences: '违反原则的师生关系将被调整，严重情况下导师可能失去指导资格'
    }
  ];

  for (const rule of worldRules) {
    await prisma.worldRule.create({
      data: {
        ...rule,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界规则');

  // 创建增强的世界信息条目
  const worldInfoEntries = [
    {
      title: '阿卡迪亚学院的魔法防护系统',
      content: '阿卡迪亚学院建立在古老的龙脉交汇点上，这里的魔法能量格外浓郁。学院的魔法防护屏障是由四大元素共同维持的，一旦元素平衡被打破，整个学院的安全都会受到威胁。中央塔楼是整个防护系统的核心，而元素之心的碎片则是维持这个系统的关键。',
      keywords: JSON.stringify(['阿卡迪亚', '学院', '龙脉', '魔法能量', '防护屏障', '元素平衡', '中央塔楼', '元素之心']),
      category: '地点',
      isActive: true
    },
    {
      title: '虚无教团的历史与威胁',
      content: '虚无教团是三百年前试图毁灭元素之心的邪恶组织。他们相信只有让世界回归原始的混沌状态，才能获得真正的自由和力量。教团的标志是一个被黑色烈焰包围的破碎水晶，代表着他们摧毁秩序、拥抱混沌的理念。虽然在三百年前被击败，但最近的封印松动表明他们可能正在重新集结力量。',
      keywords: JSON.stringify(['虚无教团', '邪恶组织', '元素之心', '混沌', '黑色烈焰', '破碎水晶', '封印', '重新集结']),
      category: '历史',
      isActive: true
    },
    {
      title: '元素共鸣现象与检测原理',
      content: '元素共鸣是一种特殊的魔法现象，当具有强大魔法天赋的人接近元素之心碎片时会产生。共鸣的强度取决于个人的魔法能力和与特定元素的亲和度。据说真正的元素守护者在共鸣时，甚至能够看到碎片的确切位置和获取方式。每个新生配发的元素共鸣水晶就是基于这个原理制作的检测工具。',
      keywords: JSON.stringify(['元素共鸣', '魔法现象', '魔法天赋', '元素之心碎片', '元素守护者', '元素共鸣水晶', '检测工具']),
      category: '知识',
      isActive: true
    },
    {
      title: '四大元素学院的哲学与特色',
      content: '四大元素学院分别代表着不同的魔法哲学和生活方式。炽焰之塔崇尚激情和行动，深海之庭注重智慧和适应，苍穹之台追求自由和创新，大地之根强调稳定和坚持。学生在入学时会根据自己的性格特质和魔法亲和度被分配到相应的学院，但跨学院的合作和友谊也是学院教育的重要组成部分。',
      keywords: JSON.stringify(['四大元素学院', '炽焰之塔', '深海之庭', '苍穹之台', '大地之根', '魔法哲学', '性格特质', '魔法亲和度', '跨学院合作']),
      category: '学院',
      isActive: true
    },
    {
      title: '预言之夜的神秘仪式',
      content: '预言之夜是学院每年最重要的仪式之一。在春分夜当晚，中央塔楼顶层的古老星象仪会自动激活，显示出关于未来的神秘预言。这些预言通常以隐晦的象征和古代语言呈现，需要精通占星术和古代文字的专家来解读。今年的预言特别引人注目，因为它明确提到了"新的守护者"和"黑暗的归来"。',
      keywords: JSON.stringify(['预言之夜', '春分夜', '星象仪', '古老预言', '象征', '古代语言', '占星术', '新的守护者', '黑暗的归来']),
      category: '仪式',
      isActive: true
    },
    {
      title: '图书馆的三层结构与禁书区',
      content: '学院的图书馆分为三个区域：公共阅览区、进阶研究区和禁书区。禁书区需要特殊权限才能进入，里面收藏着关于禁忌魔法、危险实验和历史秘密的珍贵典籍。据说关于元素之心的完整历史记录就藏在禁书区的最深处，但只有最高级别的法师才有资格查阅。古代魔法研究社的教授们经常在这里进行秘密研究。',
      keywords: JSON.stringify(['图书馆', '公共阅览区', '进阶研究区', '禁书区', '特殊权限', '禁忌魔法', '危险实验', '历史秘密', '元素之心历史', '古代魔法研究社']),
      category: '地点',
      isActive: true
    }
  ];

  for (const entry of worldInfoEntries) {
    await prisma.worldInfoEntry.create({
      data: {
        ...entry,
        scenarioId: enhancedScenario.id
      }
    });
  }
  console.log('✅ 创建世界信息条目');

  console.log('🎉 增强世界剧本系统种子数据创建完成！');
  console.log(`📊 创建统计：
  - 1个剧本模板
  - 1个增强世界剧本
  - ${worldLocations.length}个世界地点
  - ${worldEvents.length}个世界事件
  - ${worldOrganizations.length}个世界组织
  - ${worldCultures.length}个世界文化
  - ${worldItems.length}个世界物品
  - ${worldRules.length}个世界规则
  - ${worldInfoEntries.length}个世界信息条目`);
}

// 运行种子数据函数
seedEnhancedScenarios()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
