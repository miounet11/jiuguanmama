const { PrismaClient } = require('../../node_modules/.prisma/client');

const prisma = new PrismaClient();

/**
 * Seed data for Universal UX System features
 * Creates 12 core features (F1-F12) as defined in the specification
 */
export async function seedFeatures() {
  console.log('🎯 Seeding feature configurations...');

  const features = [
    {
      featureId: 'progressive-disclosure',
      name: '渐进式功能披露',
      description: '根据用户等级和角色逐步解锁高级功能',
      icon: 'unlock',
      category: 'core',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'role-based-ui',
      name: '角色导向界面',
      description: '为 Creator、Player、Admin 提供定制化 UI/UX',
      icon: 'palette',
      category: 'ui',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'intelligent-onboarding',
      name: '智能新手引导',
      description: '基于 MBTI 和兴趣的个性化角色推荐',
      icon: 'compass',
      category: 'onboarding',
      requiredRoles: JSON.stringify(['player']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'creator-studio',
      name: '创作者工作室',
      description: 'AI 辅助角色生成、数据分析、内容管理',
      icon: 'brush',
      category: 'creator',
      requiredRoles: JSON.stringify(['creator', 'admin']),
      minLevel: 5,
      requiresPremium: false,
      dependencies: JSON.stringify(['role-based-ui']),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-15'),
    },
    {
      featureId: 'gamification-dashboard',
      name: '游戏化仪表盘',
      description: '角色亲密度、熟练度、成就、每日任务系统',
      icon: 'trophy',
      category: 'gamification',
      requiredRoles: JSON.stringify(['player', 'creator']),
      minLevel: 3,
      requiresPremium: false,
      dependencies: JSON.stringify(['progressive-disclosure']),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-10'),
    },
    {
      featureId: 'admin-console',
      name: '管理员控制台',
      description: '系统监控、用户管理、内容审核、数据分析',
      icon: 'shield',
      category: 'admin',
      requiredRoles: JSON.stringify(['admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify(['role-based-ui']),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'feature-gate-system',
      name: '功能门禁系统',
      description: '细粒度功能访问控制和解锁机制',
      icon: 'key',
      category: 'core',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'extension-framework',
      name: '扩展框架',
      description: '插件系统、自定义工作流、第三方集成',
      icon: 'puzzle',
      category: 'advanced',
      requiredRoles: JSON.stringify(['creator', 'admin']),
      minLevel: 10,
      requiresPremium: true,
      dependencies: JSON.stringify(['creator-studio', 'feature-gate-system']),
      enabled: true,
      beta: true,
      version: '0.9.0',
      launchedAt: new Date('2025-02-01'),
    },
    {
      featureId: 'dynamic-navigation',
      name: '动态导航系统',
      description: '基于角色和权限的自适应导航菜单',
      icon: 'navigation',
      category: 'ui',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify(['role-based-ui']),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'user-preferences',
      name: '用户偏好设置',
      description: '主题、语言、布局、通知偏好管理',
      icon: 'settings',
      category: 'core',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
    {
      featureId: 'notification-center',
      name: '通知中心',
      description: '实时通知、成就提醒、功能发布公告',
      icon: 'bell',
      category: 'communication',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify(['user-preferences']),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-05'),
    },
    {
      featureId: 'help-system',
      name: '帮助系统',
      description: '交互式教程、工具提示、上下文帮助',
      icon: 'help-circle',
      category: 'onboarding',
      requiredRoles: JSON.stringify(['player', 'creator', 'admin']),
      minLevel: 1,
      requiresPremium: false,
      dependencies: JSON.stringify([]),
      enabled: true,
      beta: false,
      version: '1.0.0',
      launchedAt: new Date('2025-01-01'),
    },
  ];

  for (const feature of features) {
    await prisma.featureConfig.upsert({
      where: { featureId: feature.featureId },
      update: feature,
      create: feature,
    });
  }

  console.log(`✅ Created ${features.length} feature configurations`);
}

/**
 * Seed user preferences for existing users
 */
export async function seedUserPreferences() {
  console.log('👤 Seeding user preferences...');

  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true, role: true },
  });

  for (const user of users) {
    await prisma.userPreferenceExtended.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        primaryRole: user.role || 'player',
        theme: ['dark', 'light'][Math.floor(Math.random() * 2)],
        language: 'zh-CN',
        dashboardLayout: JSON.stringify({}),
        navigationCollapsed: false,
        progressiveDisclosure: true,
        showTutorials: true,
        showNewBadges: true,
        autoUnlockFeatures: true,
        featureLaunchAlerts: true,
        achievementAlerts: true,
        systemAlerts: false,
      },
    });
  }

  console.log(`✅ Created preferences for ${users.length} users`);
}

/**
 * Seed tutorial progress data
 */
export async function seedTutorialProgress() {
  console.log('📚 Seeding tutorial progress...');

  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true },
  });

  const tutorials = [
    { id: 'character-chat-basics', steps: 5 },
    { id: 'character-creation', steps: 7 },
    { id: 'gamification-intro', steps: 4 },
  ];

  let count = 0;
  for (const user of users) {
    for (const tutorial of tutorials) {
      const currentStep = Math.floor(Math.random() * (tutorial.steps + 1));
      const completed = currentStep === tutorial.steps;

      const existing = await prisma.tutorialProgress.findUnique({
        where: {
          userId_tutorialId: {
            userId: user.id,
            tutorialId: tutorial.id,
          },
        },
      });

      if (!existing) {
        await prisma.tutorialProgress.create({
          data: {
            userId: user.id,
            tutorialId: tutorial.id,
            currentStep,
            totalSteps: tutorial.steps,
            completed,
            skipped: !completed && Math.random() > 0.7,
            completedAt: completed ? new Date() : null,
          },
        });
        count++;
      }
    }
  }

  console.log(`✅ Created ${count} tutorial progress records`);
}

/**
 * Seed notifications
 */
export async function seedNotifications() {
  console.log('🔔 Seeding notifications...');

  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true },
  });

  const notificationTemplates = [
    {
      type: 'feature_launch',
      title: '🎉 新功能上线：创作者工作室',
      description: '现在您可以使用 AI 辅助创建角色，快来体验吧！',
      icon: 'brush',
      actionLabel: '立即体验',
      actionPath: '/creator/studio',
      priority: 'high',
    },
    {
      type: 'achievement',
      title: '🏆 成就解锁：对话达人',
      description: '恭喜您完成 100 次角色对话！',
      icon: 'trophy',
      actionLabel: '查看成就',
      actionPath: '/gamification/achievements',
      priority: 'normal',
    },
    {
      type: 'alert',
      title: '⚠️ 系统维护通知',
      description: '系统将于今晚 23:00-24:00 进行维护',
      icon: 'alert-triangle',
      actionLabel: null,
      actionPath: null,
      priority: 'urgent',
    },
    {
      type: 'system',
      title: '📢 用户协议更新',
      description: '我们更新了用户协议和隐私政策',
      icon: 'info',
      actionLabel: '查看详情',
      actionPath: '/legal/terms',
      priority: 'low',
    },
  ];

  let count = 0;
  // Clear existing notifications for these users to avoid duplicates
  await prisma.notification.deleteMany({
    where: {
      userId: { in: users.map(u => u.id) },
    },
  });

  for (const user of users) {
    for (const template of notificationTemplates) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          ...template,
          read: Math.random() > 0.5,
          archived: false,
          readAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} notifications`);
}

/**
 * Seed feature unlocks for users
 */
export async function seedFeatureUnlocks() {
  console.log('🔓 Seeding feature unlocks...');

  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true },
  });

  const basicFeatures = [
    'progressive-disclosure',
    'role-based-ui',
    'user-preferences',
    'notification-center',
    'help-system',
  ];

  let count = 0;
  // Clear existing unlocks to avoid duplicates
  await prisma.featureUnlock.deleteMany({
    where: {
      userId: { in: users.map(u => u.id) },
      featureId: { in: basicFeatures },
    },
  });

  for (const user of users) {
    for (const featureId of basicFeatures) {
      await prisma.featureUnlock.create({
        data: {
          userId: user.id,
          featureId,
          unlockTrigger: 'manual',
          unlockCondition: 'Basic feature auto-unlocked for all users',
        },
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} feature unlocks`);
}

/**
 * Main seed function for UX system
 */
export async function seedUXSystem() {
  try {
    await seedFeatures();
    await seedUserPreferences();
    await seedTutorialProgress();
    await seedNotifications();
    await seedFeatureUnlocks();

    console.log('🎊 UX System seed data completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding UX system:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedUXSystem()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
