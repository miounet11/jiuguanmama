import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由级懒加载 - 性能优化版本
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/HomePage.vue'),
    meta: { 
      requiresAuth: false,
      preload: true, // 预加载标记
      title: 'TavernAI Plus - AI角色扮演平台'
    }
  },
  
  // 认证相关页面 - 独立块
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "auth" */ '@/views/auth/LoginPage.vue'),
    meta: { 
      requiresAuth: false, 
      hideLayout: true,
      title: '登录 - TavernAI Plus'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "auth" */ '@/views/auth/RegisterPage.vue'),
    meta: { 
      requiresAuth: false, 
      hideLayout: true,
      title: '注册 - TavernAI Plus'
    }
  },

  // 角色相关页面 - 独立块
  {
    path: '/characters',
    name: 'Characters',
    component: () => import(/* webpackChunkName: "characters" */ '@/views/characters/CharacterList.vue'),
    meta: { 
      requiresAuth: false,
      title: '角色列表 - TavernAI Plus'
    }
  },
  {
    path: '/characters/:id',
    name: 'CharacterDetail',
    component: () => import(/* webpackChunkName: "characters" */ '@/views/characters/CharacterDetail.vue'),
    meta: {
      requiresAuth: false,
      title: '角色详情 - TavernAI Plus'
    }
  },
  {
    path: '/characters-progressive',
    name: 'CharactersProgressive',
    component: () => import(/* webpackChunkName: "characters" */ '@/views/characters/CharacterListWithProgressive.vue'),
    meta: {
      requiresAuth: false,
      title: '探索角色 (渐进式) - TavernAI Plus'
    }
  },

  // 市场相关页面 - 独立块
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import(/* webpackChunkName: "marketplace" */ '@/views/marketplace/MarketplaceView.vue'),
    meta: { 
      requiresAuth: false,
      title: '角色市场 - TavernAI Plus'
    }
  },

  // 聊天相关页面 - 核心功能块
  {
    path: '/chat',
    name: 'Chat',
    component: () => import(/* webpackChunkName: "chat-core" */ '@/views/chat/ChatPage.vue'),
    meta: {
      requiresAuth: true,
      title: '对话中心 - TavernAI Plus'
    }
  },
  {
    path: '/chat/:characterId',
    name: 'ChatSession',
    component: () => import(/* webpackChunkName: "chat-core" */ '@/views/chat/ChatSession.vue'),
    meta: {
      requiresAuth: true,
      title: '角色对话 - TavernAI Plus'
    }
  },

  // 快速对话相关页面 - 一键开始对话流程
  {
    path: '/quick-chat',
    name: 'QuickChat',
    component: () => import(/* webpackChunkName: "quick-chat" */ '@/views/chat/QuickChatPage.vue'),
    meta: {
      requiresAuth: false, // 可以让未登录用户体验，但创建会话时需要登录
      title: '快速开始对话 - TavernAI Plus',
      preload: true
    }
  },
  {
    path: '/quick-chat/:characterId',
    name: 'QuickChatWithCharacter',
    component: () => import(/* webpackChunkName: "quick-chat" */ '@/views/chat/QuickChatPage.vue'),
    meta: {
      requiresAuth: false,
      title: '快速开始对话 - TavernAI Plus'
    }
  },

  // 聊天室页面 - 独立块（较少使用）
  {
    path: '/chatroom/:roomId',
    name: 'ChatRoom',
    component: () => import(/* webpackChunkName: "chatroom" */ '@/views/chatroom/ChatRoomPage.vue'),
    meta: { 
      requiresAuth: true,
      title: '聊天室 - TavernAI Plus'
    }
  },

  // 创作工坊 - 独立块
  {
    path: '/studio',
    name: 'Studio',
    component: () => import(/* webpackChunkName: "studio" */ '@/views/studio/StudioPage.vue'),
    meta: {
      requiresAuth: true,
      title: '创作工坊 - TavernAI Plus'
    }
  },
  {
    path: '/studio/character/create',
    name: 'CreateCharacter',
    component: () => import(/* webpackChunkName: "studio" */ '@/views/studio/CreateCharacter.vue'),
    meta: {
      requiresAuth: true,
      title: '创建角色 - TavernAI Plus'
    }
  },
  {
    path: '/studio/character/edit/:id',
    name: 'EditCharacter',
    component: () => import(/* webpackChunkName: "studio" */ '@/views/studio/EditCharacter.vue'),
    meta: {
      requiresAuth: true,
      title: '编辑角色 - TavernAI Plus'
    }
  },

  // 剧本管理 - 独立块
  {
    path: '/scenarios',
    name: 'Scenarios',
    component: () => import(/* webpackChunkName: "scenarios" */ '@/views/scenarios/ScenarioManagement.vue'),
    meta: {
      requiresAuth: true,
      title: '剧本管理 - TavernAI Plus'
    }
  },
  {
    path: '/scenarios/:id',
    name: 'ScenarioDetail',
    component: () => import(/* webpackChunkName: "scenarios" */ '@/views/scenarios/ScenarioDetail.vue'),
    meta: {
      requiresAuth: true,
      title: '剧本详情 - TavernAI Plus'
    }
  },
  {
    path: '/scenarios/:id/edit',
    name: 'ScenarioEdit',
    component: () => import(/* webpackChunkName: "scenarios" */ '@/views/scenarios/ScenarioEdit.vue'),
    meta: {
      requiresAuth: true,
      title: '编辑剧本 - TavernAI Plus'
    }
  },

  // 用户相关页面 - 独立块
  {
    path: '/profile',
    name: 'Profile',
    component: () => import(/* webpackChunkName: "profile" */ '@/views/profile/ProfilePage.vue'),
    meta: { 
      requiresAuth: true,
      title: '个人资料 - TavernAI Plus'
    }
  },
  {
    path: '/profile/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "profile" */ '@/views/profile/SettingsPage.vue'),
    meta: { 
      requiresAuth: true,
      title: '账户设置 - TavernAI Plus'
    }
  },

  // 订阅页面 - 独立块（低频使用）
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import(/* webpackChunkName: "subscription" */ '@/views/subscription/SubscriptionPage.vue'),
    meta: { 
      requiresAuth: true,
      title: '订阅管理 - TavernAI Plus'
    }
  },

  // 管理页面 - 独立块（管理员专用）
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/LogsPage.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '系统日志 - TavernAI Plus'
    }
  },

  // 社区相关页面 - 独立块
  {
    path: '/community',
    name: 'Community',
    component: () => import(/* webpackChunkName: "community" */ '@/views/community/CommunityView.vue'),
    meta: { 
      requiresAuth: false,
      title: '社区 - TavernAI Plus'
    }
  },
  {
    path: '/community/post/:postId',
    name: 'PostDetail',
    component: () => import(/* webpackChunkName: "community" */ '@/views/community/PostDetailView.vue'),
    meta: { 
      requiresAuth: false,
      title: '帖子详情 - TavernAI Plus'
    }
  },
  {
    path: '/community/user/:userId',
    name: 'UserProfile',
    component: () => import(/* webpackChunkName: "community" */ '@/views/community/UserProfileView.vue'),
    meta: { 
      requiresAuth: false,
      title: '用户资料 - TavernAI Plus'
    }
  },
  {
    path: '/community/follow/:userId',
    name: 'UserFollow',
    component: () => import(/* webpackChunkName: "community" */ '@/views/community/UserFollowView.vue'),
    meta: { 
      requiresAuth: false,
      title: '关注列表 - TavernAI Plus'
    }
  },
  {
    path: '/community/notifications',
    name: 'Notifications',
    component: () => import(/* webpackChunkName: "community" */ '@/views/community/NotificationsView.vue'),
    meta: { 
      requiresAuth: true,
      title: '消息通知 - TavernAI Plus'
    }
  },

  // 测试页面 (仅开发环境)
  ...(import.meta.env.DEV ? [{
    path: '/test/design-system',
    name: 'DesignSystemTest',
    component: () => import(/* webpackChunkName: "test" */ '@/views/test/DesignSystemTest.vue'),
    meta: {
      requiresAuth: false,
      title: 'Design System 测试 - TavernAI Plus'
    }
  }, {
    path: '/test/quick-chat',
    name: 'QuickChatTest',
    component: () => import(/* webpackChunkName: "test" */ '@/views/test/QuickChatTestPage.vue'),
    meta: {
      requiresAuth: false,
      title: 'Quick Chat 功能测试 - TavernAI Plus'
    }
  }, {
    path: '/test/progressive-disclosure',
    name: 'ProgressiveDisclosureTest',
    component: () => import(/* webpackChunkName: "test" */ '@/views/test/ProgressiveDisclosureTestPage.vue'),
    meta: {
      requiresAuth: false,
      title: '渐进式披露系统测试 - TavernAI Plus'
    }
  }] : []),

  // 错误页面
  {
    path: '/404',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "error" */ '@/views/NotFound.vue'),
    meta: {
      requiresAuth: false,
      hideLayout: true,
      title: '页面未找到 - TavernAI Plus'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 路由预加载映射
const preloadableRoutes = new Set(['Home', 'Characters', 'Chat'])

// 预加载组件
const preloadComponent = (routeName: string) => {
  const route = routes.find(r => r.name === routeName)
  if (route && typeof route.component === 'function') {
    route.component()
  }
}

// 预加载核心页面
if (typeof window !== 'undefined') {
  // 在页面空闲时预加载核心路由
  const schedulePreload = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadableRoutes.forEach(preloadComponent)
      })
    } else {
      // Fallback
      setTimeout(() => {
        preloadableRoutes.forEach(preloadComponent)
      }, 2000)
    }
  }

  // 页面加载完成后开始预加载
  if (document.readyState === 'complete') {
    schedulePreload()
  } else {
    window.addEventListener('load', schedulePreload)
  }
}

// 性能监控路由导航
let navigationStartTime: number

router.beforeEach(async (to, from, next) => {
  navigationStartTime = performance.now()
  
  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    // 尝试恢复会话
    if (!userStore.isAuthenticated) {
      await userStore.restoreSession()
    }

    // 检查是否已登录
    if (!userStore.isAuthenticated) {
      // 保存目标路由
      userStore.setRedirectPath(to.fullPath)
      return next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    }

    // 检查管理员权限
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      return next({ name: 'Home' })
    }
  }

  // 已登录用户访问登录/注册页面
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isAuthenticated) {
    return next({ name: 'Home' })
  }

  next()
})

router.afterEach((to, from) => {
  // 路由导航性能监控
  const navigationTime = performance.now() - navigationStartTime
  
  if (import.meta.env.DEV) {
    console.log(`🚀 路由导航性能: ${to.name} - ${navigationTime.toFixed(2)}ms`)
  }

  // 发送导航性能数据
  if (!import.meta.env.DEV && navigationTime > 1000) {
    // 导航时间超过1秒时记录
    fetch('/api/analytics/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from.name,
        to: to.name,
        duration: navigationTime,
        timestamp: Date.now()
      })
    }).catch(() => {
      // 忽略错误
    })
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
  
  // 发送错误报告
  if (!import.meta.env.DEV) {
    fetch('/api/analytics/route-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(() => {
      // 忽略错误
    })
  }
})

export default router
