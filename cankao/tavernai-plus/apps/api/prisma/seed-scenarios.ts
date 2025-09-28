/**
 * 世界剧本种子数据生成脚本
 * 基于热门场景分析，生成丰富多样的世界剧本和世界信息条目
 */

const { PrismaClient } = require('../node_modules/.prisma/client')

const prisma = new PrismaClient()

// 世界剧本模板数据
const scenarioTemplates = [
  // 古风武侠类
  {
    name: "江湖风云录",
    description: "群雄争霸的江湖世界，刀光剑影间的快意恩仇。从默默无闻的小人物开始，在武林中书写属于自己的传奇。",
    content: "这是一个武者为尊的世界，江湖中各大门派林立：少林、武当、峨眉、华山等名门正派维护着武林秩序，而魔教、血煞门等邪派则在暗中蠢蠢欲动。最近江湖上出现了一本《天机秘录》，据说记载着绝世武功和惊天秘密，引得各方势力为之疯狂。你将在这个充满机遇与危险的世界中寻找自己的道路。",
    category: "古风武侠",
    tags: ["武侠", "江湖", "门派", "武功", "恩仇"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "江湖门派",
        content: "正派：少林寺（佛门武学）、武当山（道家内功）、峨眉派（剑法精妙）、华山派（剑宗气宗）、昆仑派（高原武学）。邪派：血煞门（嗜血武功）、魔教（魅惑之术）、暗影楼（刺客组织）。",
        keywords: ["门派", "少林", "武当", "峨眉", "华山", "血煞", "魔教"],
        category: "门派势力",
        priority: 100
      },
      {
        title: "武功等级",
        content: "三流高手（初窥门径）、二流高手（小有成就）、一流高手（独当一面）、绝顶高手（威震一方）、宗师级（开宗立派）、传说级（登峰造极）。",
        keywords: ["武功", "等级", "高手", "宗师", "实力"],
        category: "武学体系",
        priority: 90
      },
      {
        title: "天机秘录",
        content: "传说中记载着绝世武功《九天玄功》和江湖最大秘密的古籍。据说得到此书者可一统武林，但至今无人知晓其真实位置。最近江湖传言，秘录可能出现在即将举办的武林大会上。",
        keywords: ["天机秘录", "九天玄功", "秘密", "武林大会"],
        category: "重要物品",
        priority: 95
      }
    ]
  },

  // 现代都市类
  {
    name: "都市霸道总裁",
    description: "繁华都市中的商界传奇，冷漠外表下隐藏着炽热内心的霸道总裁，与平凡却特别的你展开一段跌宕起萌的爱情故事。",
    content: "在这个金钱与权力交织的都市里，顶尖企业之间的竞争激烈而残酷。你意外闯入了商界精英萧寒的世界，这个表面冷漠实则内心火热的年轻总裁，正面临着家族企业的重大危机。一系列意外的邂逅，让你们的命运紧紧缠绕在一起。",
    category: "现代都市",
    tags: ["总裁", "都市", "商战", "霸道", "恋爱"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "萧氏集团",
        content: "国内顶尖的综合性企业集团，业务涵盖房地产、金融、科技等多个领域。目前由年轻的萧寒担任总裁，但正面临来自竞争对手和内部的双重压力。",
        keywords: ["萧氏集团", "萧寒", "企业", "商业", "总裁"],
        category: "企业背景",
        priority: 100
      },
      {
        title: "商界人物",
        content: "萧寒（萧氏集团总裁，25岁，冷漠霸道）、林雨薇（竞争对手千金，野心勃勃）、张助理（萧寒的得力助手，忠诚可靠）、老爷子（萧寒的爷爷，集团创始人）。",
        keywords: ["萧寒", "林雨薇", "张助理", "角色", "人物"],
        category: "重要人物",
        priority: 90
      },
      {
        title: "都市场景",
        content: "萧氏大厦（集团总部，85层摩天大楼）、星月酒店（高端商务场所）、私人庄园（萧家祖宅）、金融街（商务中心区）、艺术画廊（文艺场所）。",
        keywords: ["萧氏大厦", "星月酒店", "庄园", "金融街", "画廊", "场景"],
        category: "场景地点",
        priority: 80
      }
    ]
  },

  // 奇幻冒险类
  {
    name: "魔法学院编年史",
    description: "在充满魔法与奇迹的异世界，进入传说中的魔法学院学习法术，与各族精英同窗，探索魔法的奥秘，直面古老的威胁。",
    content: "阿斯特拉魔法学院是整个大陆最著名的魔法学府，每年只招收最有天赋的年轻法师。你刚刚收到了入学通知书，即将踏入这个充满奇迹与危险的世界。学院分为四个学院：炽焰学院（火系魔法）、寒霜学院（冰系魔法）、翠绿学院（自然魔法）、暗影学院（暗系魔法）。在这里，你将学会控制魔法的力量，结交终生的伙伴，并可能面对威胁整个世界的古老邪恶。",
    category: "奇幻冒险",
    tags: ["魔法", "学院", "奇幻", "冒险", "成长"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "阿斯特拉魔法学院",
        content: "大陆最高魔法学府，位于浮空岛上。分为炽焰、寒霜、翠绿、暗影四个学院，每个学院专精不同的魔法流派。学院拥有千年历史，培养了无数传奇法师。",
        keywords: ["阿斯特拉", "魔法学院", "炽焰", "寒霜", "翠绿", "暗影", "学院"],
        category: "学院设定",
        priority: 100
      },
      {
        title: "魔法体系",
        content: "元素魔法（火、水、土、风）、自然魔法（治愈、成长、沟通）、暗系魔法（诅咒、死灵、幻术）、光明魔法（净化、保护、祝福）、时空魔法（传送、预言、时间）。每个法师通常专精1-2个流派。",
        keywords: ["魔法", "元素", "自然", "暗系", "光明", "时空", "法师"],
        category: "魔法体系",
        priority: 95
      },
      {
        title: "学院人物",
        content: "艾莉亚（精灵族，翠绿学院天才）、雷克斯（龙族混血，炽焰学院王子）、露娜（月精灵，寒霜学院学霸）、凯尔（人类，光明学院骑士）。各自有着独特的背景和强大的魔法天赋。",
        keywords: ["艾莉亚", "雷克斯", "露娜", "凯尔", "精灵", "龙族", "学生"],
        category: "重要角色",
        priority: 90
      }
    ]
  },

  // 科幻未来类
  {
    name: "星际殖民时代",
    description: "2350年，人类已殖民多个星系。作为星际探索者，驾驶先进飞船在浩瀚宇宙中寻找新的家园，同时面对未知文明的挑战。",
    content: "距离人类首次踏出地球已经过去了400年，如今人类文明已经扩展到银河系的多个星区。联邦政府统治着核心世界，而边缘星域则充满了机遇与危险。你是一名星际探索者，拥有自己的星舰，在联邦的委托下寻找适合殖民的新世界。但在这片星空中，还隐藏着古老的外星文明、危险的宇宙海盗，以及更多未知的威胁。",
    category: "科幻未来",
    tags: ["科幻", "星际", "探索", "殖民", "宇宙"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "人类联邦",
        content: "统治银河系核心区域的人类政治实体，由地球政府、火星殖民地、木星轨道城等核心世界组成。拥有强大的星际舰队和先进的科技，但对边缘世界的控制力有限。",
        keywords: ["人类联邦", "地球", "火星", "木星", "核心世界", "政府"],
        category: "政治势力",
        priority: 100
      },
      {
        title: "星际科技",
        content: "超光速引擎（跨越星系的关键）、能量护盾（防护技术）、人工重力（生活保障）、量子通讯（即时联络）、纳米医疗（治疗技术）、意识上传（数字永生）。",
        keywords: ["超光速", "护盾", "重力", "通讯", "医疗", "科技"],
        category: "科技设定",
        priority: 95
      },
      {
        title: "外星文明",
        content: "赛博维亚（机械种族，高度发达）、凯尔塔人（水晶生命，精神力强大）、虫族（群体意识，扩张性强）、古老守护者（神秘文明，技术超越时代）。每个文明都有独特的文化和技术。",
        keywords: ["赛博维亚", "凯尔塔", "虫族", "守护者", "外星", "文明"],
        category: "外星种族",
        priority: 85
      }
    ]
  },

  // 悬疑推理类
  {
    name: "雾都悬案",
    description: "维多利亚时代的伦敦，迷雾笼罩的街道上隐藏着无数秘密。作为私人侦探，运用你的推理能力解开一桩桩离奇案件。",
    content: "1888年的伦敦，工业革命带来了前所未有的繁荣，但也滋生了犯罪与腐败。雾气弥漫的街道上，贵族与贫民、绅士与盗贼共存。你是一名私人侦探，凭借敏锐的观察力和缜密的推理，帮助委托人解决各种离奇案件。从贵族宅邸的密室谋杀，到贫民窟的神秘失踪，每一个案件背后都隐藏着更深层的真相。",
    category: "悬疑推理",
    tags: ["推理", "悬疑", "维多利亚", "侦探", "案件"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "维多利亚伦敦",
        content: "1888年的伦敦，工业革命的中心。贵族区（贝尔格雷维亚、梅菲尔）与贫民窟（白教堂、索霍）形成鲜明对比。苏格兰场负责治安，但私人侦探也很活跃。",
        keywords: ["伦敦", "维多利亚", "贝尔格雷维亚", "白教堂", "苏格兰场"],
        category: "时代背景",
        priority: 100
      },
      {
        title: "侦探工具",
        content: "放大镜（观察细节）、指纹粉（痕迹收集）、化学试剂（物证分析）、暗房设备（照片冲洗）、速记本（记录证词）、怀表（时间推算）。",
        keywords: ["放大镜", "指纹", "化学", "照片", "证词", "工具"],
        category: "侦探装备",
        priority: 85
      },
      {
        title: "案件类型",
        content: "密室谋杀（不可能犯罪）、贵族丑闻（社交圈秘密）、文物失窃（艺术品犯罪）、神秘失踪（人员消失）、连环杀手（系列犯罪）、政治阴谋（权力斗争）。",
        keywords: ["密室", "丑闻", "失窃", "失踪", "连环", "阴谋", "案件"],
        category: "案件分类",
        priority: 90
      }
    ]
  },

  // 末世生存类
  {
    name: "末日余生",
    description: "核战争后的废土世界，文明已经崩塌，辐射改变了一切。在这个危险的世界中寻找生存的希望和重建的可能。",
    content: "2077年，第三次世界大战爆发，核弹将世界变成了一片废土。如今是2157年，幸存的人类聚集在少数几个安全区域，面对着辐射、变异生物和资源匮乏的严峻挑战。你是一名废土游荡者，在这个危险的世界中寻找生存必需品，同时也在寻找传说中未受污染的'绿洲'，那里可能是人类重建文明的最后希望。",
    category: "末世生存",
    tags: ["末世", "废土", "生存", "辐射", "重建"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "废土环境",
        content: "高辐射区（致命污染）、低辐射区（可短暂停留）、安全区（人类聚居地）、变异森林（危险生物栖息）、废墟城市（资源丰富但危险）、地下避难所（战前遗迹）。",
        keywords: ["辐射", "安全区", "变异", "废墟", "避难所", "环境"],
        category: "世界设定",
        priority: 100
      },
      {
        title: "生存资源",
        content: "纯净水（最珍贵）、罐头食品（保存完好）、辐射药（治疗辐射病）、弹药（自卫必需）、电池（设备能源）、废料（制作材料）。一切都需要小心收集和使用。",
        keywords: ["纯净水", "食品", "辐射药", "弹药", "电池", "废料", "资源"],
        category: "生存要素",
        priority: 95
      },
      {
        title: "幸存者派系",
        content: "避难所居民（保守派，技术先进）、废土部落（适应派，野蛮强悍）、商人联盟（中立派，贸易为主）、科学狂人（激进派，追求进步）、末日教徒（宗教派，崇拜毁灭）。",
        keywords: ["避难所", "部落", "商人", "科学", "教徒", "派系"],
        category: "势力划分",
        priority: 90
      }
    ]
  },

  // 校园恋爱类
  {
    name: "青春校园物语",
    description: "樱花飞舞的校园里，青涩的恋爱故事正在上演。在学习与社团活动中，遇见那个让心动的人，书写属于青春的美好回忆。",
    content: "春樱高校是一所环境优美的私立学校，以其优质的教育和丰富的社团活动而闻名。新学期开始，你作为转学生来到这里，即将开始全新的校园生活。在这里有认真学习的学霸、活泼开朗的运动健将、温柔体贴的文艺少女、还有神秘莫测的学生会长。每个人都有着自己的故事，而你的到来将为这个校园带来新的变化。",
    category: "校园恋爱",
    tags: ["校园", "青春", "恋爱", "社团", "学生"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "春樱高校",
        content: "位于市区的知名私立学校，校园内樱花满园，设施完善。分为普通科、理科特进班、艺术科等。学校重视全面发展，社团活动非常丰富活跃。",
        keywords: ["春樱高校", "私立", "樱花", "普通科", "理科", "艺术科", "社团"],
        category: "学校设定",
        priority: 100
      },
      {
        title: "校园社团",
        content: "文艺部（文学创作）、美术部（绘画雕塑）、音乐部（器乐声乐）、戏剧部（话剧表演）、体育社团（篮球、网球、游泳）、学生会（校园管理）。",
        keywords: ["文艺部", "美术部", "音乐部", "戏剧部", "体育", "学生会", "社团"],
        category: "社团活动",
        priority: 90
      },
      {
        title: "校园角色",
        content: "优等生美雪（学霸型，成绩优异但略显严肃）、运动部长大和（阳光型，篮球队队长）、文艺少女小诗（温柔型，喜欢写诗）、学生会长雫（神秘型，能力超群）。",
        keywords: ["美雪", "大和", "小诗", "雫", "学霸", "运动", "文艺", "会长"],
        category: "主要角色",
        priority: 85
      }
    ]
  },

  // 历史架空类
  {
    name: "架空王朝风云",
    description: "在一个架空的古代王朝中，宫廷政治波云诡谲，江山美人皆在权力游戏之中。选择你的立场，在这场权力的漩涡中求得生存与发展。",
    content: "大陈王朝建国已有三百年，如今正值盛世与衰败的转折点。年轻的皇帝刚刚登基，朝中各方势力暗流涌动：以太傅为首的保守派、以年轻官员为主的改革派、还有握有重兵的边关将军们。而在这政治漩涡的中心，后宫中的妃嫔们也在为自己的家族利益而明争暗斗。你将在这个充满机遇与危险的时代中寻找自己的位置。",
    category: "历史架空",
    tags: ["古代", "宫廷", "政治", "权谋", "朝廷"],
    language: "zh-CN",
    worldInfo: [
      {
        title: "大陈王朝",
        content: "建国300年的强盛王朝，疆域辽阔，国力强盛。首都长安城人口百万，分为皇城、内城、外城。目前由年仅20岁的新皇帝统治，面临内政外交的诸多挑战。",
        keywords: ["大陈王朝", "长安城", "皇城", "新皇帝", "王朝"],
        category: "王朝设定",
        priority: 100
      },
      {
        title: "朝廷势力",
        content: "保守派（太傅领导，维护传统）、改革派（年轻官员，推行新政）、军事派（边关将军，主张强硬）、后宫势力（各家妃嫔，争夺皇嗣）、地方诸侯（封疆大吏，拥兵自重）。",
        keywords: ["保守派", "改革派", "军事派", "后宫", "诸侯", "势力"],
        category: "政治势力",
        priority: 95
      },
      {
        title: "宫廷制度",
        content: "三省六部制（中书、门下、尚书省）、科举制度（选拔人才）、封爵制（爵位等级）、后宫等级（皇后、贵妃、妃、嫔、常在）、宦官体系（内廷管理）。",
        keywords: ["三省六部", "科举", "封爵", "后宫", "宦官", "制度"],
        category: "政治制度",
        priority: 85
      }
    ]
  }
]

// 系统用户ID (用于创建公共剧本)
const SYSTEM_USER_ID = "system-user-scenarios"

// 主要生成函数
async function generateScenarioSeeds() {
  console.log("🌍 开始生成世界剧本种子数据...")

  try {
    // 首先确保系统用户存在
    const systemUser = await prisma.user.upsert({
      where: { id: SYSTEM_USER_ID },
      update: {},
      create: {
        id: SYSTEM_USER_ID,
        username: "系统剧本",
        email: "system-scenarios@tavernai.com",
        passwordHash: "system-generated",
        isVerified: true,
        role: "admin"
      }
    })

    console.log(`✅ 系统用户已准备: ${systemUser.username}`)

    // 生成剧本和世界信息
    for (const template of scenarioTemplates) {
      console.log(`📝 创建剧本: ${template.name}`)

      // 创建剧本
      const scenario = await prisma.scenario.create({
        data: {
          userId: SYSTEM_USER_ID,
          name: template.name,
          description: template.description,
          content: template.content,
          isPublic: true,
          isActive: true,
          tags: JSON.stringify(template.tags),
          category: template.category,
          language: template.language,
          // 模拟一些统计数据
          viewCount: Math.floor(Math.random() * 1000) + 100,
          useCount: Math.floor(Math.random() * 500) + 50,
          favoriteCount: Math.floor(Math.random() * 200) + 20,
          rating: 4.0 + Math.random() * 1.0, // 4.0-5.0之间的评分
          ratingCount: Math.floor(Math.random() * 100) + 10
        }
      })

      console.log(`  ✅ 剧本已创建: ${scenario.name}`)

      // 创建世界信息条目
      if (template.worldInfo && template.worldInfo.length > 0) {
        for (const worldInfoData of template.worldInfo) {
          await prisma.worldInfoEntry.create({
            data: {
              scenarioId: scenario.id,
              title: worldInfoData.title,
              content: worldInfoData.content,
              keywords: JSON.stringify(worldInfoData.keywords),
              priority: worldInfoData.priority || 50,
              category: worldInfoData.category || "通用",
              matchType: "contains",
              isActive: true,
              probability: 1.0,
              insertDepth: 4,
              position: "before"
            }
          })
        }
        console.log(`    📋 已创建 ${template.worldInfo.length} 个世界信息条目`)
      }
    }

    // 生成一些用户评分和收藏数据（如果有其他用户的话）
    const existingUsers = await prisma.user.findMany({
      where: {
        id: { not: SYSTEM_USER_ID }
      },
      take: 5
    })

    if (existingUsers.length > 0) {
      console.log(`👥 为 ${existingUsers.length} 个用户生成评分和收藏数据...`)

      const scenarios = await prisma.scenario.findMany({
        where: { userId: SYSTEM_USER_ID }
      })

      for (const user of existingUsers) {
        // 随机为每个用户生成一些评分
        const scenariosToRate = scenarios.slice(0, Math.floor(Math.random() * scenarios.length) + 1)

        for (const scenario of scenariosToRate) {
          // 生成评分 (避免重复)
          const existingRating = await prisma.scenarioRating.findFirst({
            where: {
              userId: user.id,
              scenarioId: scenario.id
            }
          })

          if (!existingRating && Math.random() > 0.5) {
            await prisma.scenarioRating.create({
              data: {
                userId: user.id,
                scenarioId: scenario.id,
                rating: 3.0 + Math.random() * 2.0, // 3.0-5.0
                comment: Math.random() > 0.7 ? "很棒的剧本设定！" : undefined
              }
            })
          }

          // 生成收藏 (避免重复)
          const existingFavorite = await prisma.scenarioFavorite.findFirst({
            where: {
              userId: user.id,
              scenarioId: scenario.id
            }
          })

          if (!existingFavorite && Math.random() > 0.6) {
            await prisma.scenarioFavorite.create({
              data: {
                userId: user.id,
                scenarioId: scenario.id
              }
            })
          }
        }
      }
    }

    console.log("🎉 世界剧本种子数据生成完成！")
    console.log(`📊 统计信息:`)
    console.log(`  - 生成剧本: ${scenarioTemplates.length} 个`)
    console.log(`  - 生成世界信息条目: ${scenarioTemplates.reduce((sum, t) => sum + (t.worldInfo?.length || 0), 0)} 个`)

  } catch (error) {
    console.error("❌ 生成种子数据时出错:", error)
    throw error
  }
}

// 主要执行函数
async function main() {
  try {
    await generateScenarioSeeds()
  } catch (error) {
    console.error("脚本执行失败:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  main()
}

export { generateScenarioSeeds }