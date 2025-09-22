/**
 * 移动端导航管理组合函数
 * 处理移动端特有的导航行为、手势返回、底部导航等
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSwipeGesture } from './useTouchGestures'

export interface NavigationTab {
  key: string
  label: string
  icon: string
  route: string
  badge?: number
  disabled?: boolean
}

export interface NavigationHistory {
  route: string
  title?: string
  timestamp: number
}

export function useMobileNavigation() {
  const router = useRouter()
  const route = useRoute()

  // 导航状态
  const isNavigating = ref(false)
  const canGoBack = ref(false)
  const navigationHistory = ref<NavigationHistory[]>([])
  const currentTabKey = ref<string>('')

  // 底部导航标签配置
  const navigationTabs = ref<NavigationTab[]>([
    {
      key: 'home',
      label: '首页',
      icon: 'HomeFilled',
      route: '/'
    },
    {
      key: 'characters',
      label: '角色',
      icon: 'UserFilled',
      route: '/characters'
    },
    {
      key: 'chat',
      label: '对话',
      icon: 'ChatDotRound',
      route: '/chat',
      badge: 0
    },
    {
      key: 'studio',
      label: '创作',
      icon: 'EditPen',
      route: '/studio'
    },
    {
      key: 'profile',
      label: '我的',
      icon: 'User',
      route: '/profile'
    }
  ])

  // 计算当前激活的标签
  const activeTab = computed(() => {
    const currentPath = route.path
    return navigationTabs.value.find(tab =>
      currentPath.startsWith(tab.route) ||
      (tab.route === '/' && currentPath === '/')
    )?.key || ''
  })

  // 更新历史记录
  const updateNavigationHistory = (newRoute: string, title?: string) => {
    const history = navigationHistory.value
    const lastEntry = history[history.length - 1]

    // 避免重复记录相同路由
    if (lastEntry && lastEntry.route === newRoute) {
      return
    }

    // 添加新记录
    history.push({
      route: newRoute,
      title: title || document.title,
      timestamp: Date.now()
    })

    // 限制历史记录长度
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }

    // 更新返回按钮状态
    canGoBack.value = history.length > 1
  }

  // 手势返回
  const setupSwipeBack = (element: HTMLElement) => {
    useSwipeGesture(
      ref(element),
      (direction) => {
        if (direction === 'right' && canGoBack.value) {
          goBack()
        }
      },
      100 // 更大的阈值，避免误触
    )
  }

  // 返回上一页
  const goBack = async () => {
    if (!canGoBack.value) return

    isNavigating.value = true

    try {
      const history = navigationHistory.value
      if (history.length > 1) {
        // 移除当前页面
        history.pop()
        const previousPage = history[history.length - 1]

        if (previousPage) {
          await router.push(previousPage.route)
        } else {
          await router.back()
        }
      } else {
        await router.back()
      }
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      isNavigating.value = false
    }
  }

  // 导航到指定标签
  const navigateToTab = async (tabKey: string) => {
    const tab = navigationTabs.value.find(t => t.key === tabKey)
    if (!tab || tab.disabled) return

    isNavigating.value = true

    try {
      if (route.path !== tab.route) {
        await router.push(tab.route)
      }
      currentTabKey.value = tabKey
    } catch (error) {
      console.error('Tab navigation error:', error)
    } finally {
      isNavigating.value = false
    }
  }

  // 更新标签徽章
  const updateTabBadge = (tabKey: string, count: number) => {
    const tab = navigationTabs.value.find(t => t.key === tabKey)
    if (tab) {
      tab.badge = count > 0 ? count : undefined
    }
  }

  // 设置标签禁用状态
  const setTabDisabled = (tabKey: string, disabled: boolean) => {
    const tab = navigationTabs.value.find(t => t.key === tabKey)
    if (tab) {
      tab.disabled = disabled
    }
  }

  // 获取页面标题
  const getPageTitle = () => {
    const currentTab = navigationTabs.value.find(t => t.key === activeTab.value)
    return currentTab?.label || document.title
  }

  // 检查是否是移动端
  const isMobile = computed(() => {
    return window.innerWidth < 768
  })

  // 检查是否应该显示底部导航
  const shouldShowBottomNav = computed(() => {
    // 在某些页面隐藏底部导航
    const hiddenRoutes = ['/login', '/register', '/chat/', '/admin/']
    return !hiddenRoutes.some(route =>
      window.location.pathname.startsWith(route)
    )
  })

  // 监听路由变化
  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (newPath !== oldPath) {
        updateNavigationHistory(newPath)
        currentTabKey.value = activeTab.value
      }
    },
    { immediate: true }
  )

  // 浏览器前进/后退按钮处理
  const handlePopState = () => {
    // 更新导航历史
    const currentPath = window.location.pathname
    updateNavigationHistory(currentPath)
  }

  // 页面可见性变化处理
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，可以执行一些刷新操作
      console.log('Page became visible')
    }
  }

  // 初始化
  const initMobileNavigation = () => {
    // 监听浏览器前进/后退
    window.addEventListener('popstate', handlePopState)

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 初始化当前路由历史
    updateNavigationHistory(route.path)
  }

  // 清理
  const cleanupMobileNavigation = () => {
    window.removeEventListener('popstate', handlePopState)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  // 振动反馈（如果支持）
  const vibrate = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    // 状态
    isNavigating: readonly(isNavigating),
    canGoBack: readonly(canGoBack),
    navigationHistory: readonly(navigationHistory),
    navigationTabs: readonly(navigationTabs),
    activeTab,
    currentTabKey: readonly(currentTabKey),
    isMobile,
    shouldShowBottomNav,

    // 方法
    goBack,
    navigateToTab,
    updateTabBadge,
    setTabDisabled,
    getPageTitle,
    setupSwipeBack,
    initMobileNavigation,
    cleanupMobileNavigation,
    vibrate,

    // 工具方法
    updateNavigationHistory
  }
}

// 简化版本：只处理底部导航
export function useBottomNavigation() {
  const {
    navigationTabs,
    activeTab,
    navigateToTab,
    updateTabBadge,
    shouldShowBottomNav
  } = useMobileNavigation()

  return {
    tabs: navigationTabs,
    activeTab,
    navigateToTab,
    updateTabBadge,
    shouldShow: shouldShowBottomNav
  }
}