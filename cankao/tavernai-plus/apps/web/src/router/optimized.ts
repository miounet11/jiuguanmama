// 优化的路由配置 - Issue #36
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 预加载关键路由的辅助函数
const preloadRoute = (routeImport: () => Promise<any>) => {
  // 在空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => routeImport())
  } else {
    setTimeout(() => routeImport(), 100)
  }
}

// 路由配置，按优先级和使用频率分组
const routes: RouteRecordRaw[] = [
  // 首页 - 最高优先级，预加载
  {
    path: '/',
    name: 'Home',
    component: () => import(
      /* webpackChunkName: "home" */
      /* webpackPreload: true */
      '@/views/HomePage.vue'
    ),
    meta: { preload: true, critical: true }
  },

  // 角色相关 - 高频使用
  {
    path: '/characters',
    name: 'Characters',
    component: () => import(
      /* webpackChunkName: "characters" */
      '@/views/characters/CharacterList.vue'
    ),
    meta: { preload: true, group: 'characters' }
  },
  {
    path: '/characters/:id',
    name: 'CharacterDetail',
    component: () => import(
      /* webpackChunkName: "characters" */
      '@/views/characters/CharacterDetail.vue'
    ),
    meta: { group: 'characters' }
  },

  // 创作工坊 - 中频使用
  {
    path: '/studio',
    name: 'Studio',
    component: () => import(
      /* webpackChunkName: "studio" */
      '@/views/studio/StudioPage.vue'
    ),
    meta: { group: 'studio' },
    children: [
      {
        path: 'character/create',
        name: 'CreateCharacter',
        component: () => import(
          /* webpackChunkName: "studio" */
          '@/views/studio/CreateCharacter.vue'
        )
      },
      {
        path: 'character/edit/:id',
        name: 'EditCharacter',
        component: () => import(
          /* webpackChunkName: "studio" */
          '@/views/studio/EditCharacter.vue'
        )
      }
    ]
  },

  // 聊天功能 - 高频使用，但体积大，按需加载
  {
    path: '/chat',
    name: 'Chat',
    component: () => import(
      /* webpackChunkName: "chat" */
      '@/views/chat/ChatPage.vue'
    ),
    meta: { requiresAuth: true, group: 'chat' }
  },
  {
    path: '/chat/:sessionId',
    name: 'ChatSession',
    component: () => import(
      /* webpackChunkName: "chat" */
      '@/views/chat/ChatSession.vue'
    ),
    meta: { requiresAuth: true, group: 'chat' }
  },
  {
    path: '/chatroom/:roomId',
    name: 'ChatRoom',
    component: () => import(
      /* webpackChunkName: "chatroom" */
      '@/views/chatroom/ChatRoomPage.vue'
    ),
    meta: { requiresAuth: true, group: 'chat' }
  },

  // 市场相关 - 中频使用
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: () => import(
      /* webpackChunkName: "marketplace" */
      '@/views/marketplace/MarketplaceView.vue'
    ),
    meta: { group: 'marketplace' }
  },

  // 社区功能 - 低频使用
  {
    path: '/community',
    name: 'Community',
    component: () => import(
      /* webpackChunkName: "community" */
      '@/views/community/CommunityView.vue'
    ),
    meta: { group: 'community' }
  },

  // 用户相关 - 中频使用
  {
    path: '/profile',
    name: 'Profile',
    component: () => import(
      /* webpackChunkName: "user" */
      '@/views/profile/ProfilePage.vue'
    ),
    meta: { requiresAuth: true, group: 'user' }
  },
  {
    path: '/profile/settings',
    name: 'Settings',
    component: () => import(
      /* webpackChunkName: "user" */
      '@/views/profile/SettingsPage.vue'
    ),
    meta: { requiresAuth: true, group: 'user' }
  },

  // 认证页面 - 按需使用
  {
    path: '/login',
    name: 'Login',
    component: () => import(
      /* webpackChunkName: "auth" */
      '@/views/auth/LoginPage.vue'
    ),
    meta: { group: 'auth', guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(
      /* webpackChunkName: "auth" */
      '@/views/auth/RegisterPage.vue'
    ),
    meta: { group: 'auth', guestOnly: true }
  },

  // 订阅管理 - 低频使用
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import(
      /* webpackChunkName: "subscription" */
      '@/views/subscription/SubscriptionPage.vue'
    ),
    meta: { requiresAuth: true, group: 'subscription' }
  },

  // 测试页面 - 开发环境专用
  ...(import.meta.env.DEV ? [
    {
      path: '/test/design-system',
      name: 'DesignSystemTest',
      component: () => import(
        /* webpackChunkName: "test" */
        '@/views/test/DesignSystemTest.vue'
      ),
      meta: { group: 'test' }
    },
    {
      path: '/test/marketplace',
      name: 'MarketplaceTest',
      component: () => import(
        /* webpackChunkName: "test" */
        '@/views/test/MarketplaceTest.vue'
      ),
      meta: { group: 'test' }
    }
  ] : []),

  // 管理后台 - 特权用户
  {
    path: '/admin',
    name: 'Admin',
    component: () => import(
      /* webpackChunkName: "admin" */
      '@/views/admin/AdminLayout.vue'
    ),
    meta: { requiresAuth: true, requiresAdmin: true, group: 'admin' },
    children: [
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import(
          /* webpackChunkName: "admin" */
          '@/views/admin/LogsPage.vue'
        )
      }
    ]
  },

  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import(
      /* webpackChunkName: "error" */
      '@/views/NotFound.vue'
    )
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换时的滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 性能优化中间件
router.beforeEach(async (to, from, next) => {
  // 开始路由切换性能监控
  const startTime = performance.now()
  
  // 用户认证检查
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next('/login')
  }
  
  if (to.meta.guestOnly && userStore.isAuthenticated) {
    return next('/')
  }
  
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return next('/')
  }
  
  // 预加载相关路由
  if (to.meta.group && from.meta.group !== to.meta.group) {
    preloadRelatedRoutes(to.meta.group as string)
  }
  
  next()
  
  // 监控路由切换性能
  router.afterEach(() => {
    const duration = performance.now() - startTime
    console.log(`路由切换耗时: ${duration.toFixed(2)}ms`)
    
    // 记录到性能监控
    if ('performanceBudget' in window) {
      (window as any).performanceBudget.checkBudget('Route Switch Time', duration)
    }
  })
})

// 预加载相关路由
const preloadRelatedRoutes = (group: string) => {
  const relatedRoutes = routes.filter(route => route.meta?.group === group)
  
  relatedRoutes.forEach(route => {
    if (route.component && typeof route.component === 'function') {
      preloadRoute(route.component as () => Promise<any>)
    }
  })
}

// 初始化预加载关键路由
const initializePreloading = () => {
  const criticalRoutes = routes.filter(route => route.meta?.preload)
  
  criticalRoutes.forEach(route => {
    if (route.component && typeof route.component === 'function') {
      preloadRoute(route.component as () => Promise<any>)
    }
  })
}

// 在空闲时初始化预加载
if ('requestIdleCallback' in window) {
  requestIdleCallback(initializePreloading, { timeout: 5000 })
} else {
  setTimeout(initializePreloading, 2000)
}

export default router
