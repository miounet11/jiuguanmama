import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { requiresAuth: false, hideLayout: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterPage.vue'),
    meta: { requiresAuth: false, hideLayout: true }
  },
  {
    path: '/characters',
    name: 'Characters',
    component: () => import('@/views/characters/CharacterList.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/characters/:id',
    name: 'CharacterDetail',
    component: () => import('@/views/characters/CharacterDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/ChatPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:sessionId',
    name: 'ChatSession',
    component: () => import('@/views/chat/ChatSession.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/studio',
    name: 'Studio',
    component: () => import('@/views/studio/StudioPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/studio/character/create',
    name: 'CreateCharacter',
    component: () => import('@/views/studio/CreateCharacter.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/studio/character/edit/:id',
    name: 'EditCharacter',
    component: () => import('@/views/studio/EditCharacter.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/settings',
    name: 'Settings',
    component: () => import('@/views/profile/SettingsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import('@/views/subscription/SubscriptionPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/logs',
    name: 'Logs',
    component: () => import('@/views/admin/LogsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false, hideLayout: true }
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
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

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
  }

  // 已登录用户访问登录/注册页面
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isAuthenticated) {
    return next({ name: 'Home' })
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
})

export default router
