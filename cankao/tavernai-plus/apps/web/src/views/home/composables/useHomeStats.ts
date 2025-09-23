import { ref, reactive, onMounted } from 'vue'
import { http } from '@/utils/axios'

// 首页统计数据接口
interface HomeStats {
  totalUsers: number
  totalCharacters: number
  totalChats: number
  totalFavorites: number
  newUsersToday: number
  newCharactersToday: number
  newChatsToday: number
  averageRating: number
  topCategories: Array<{
    name: string
    count: number
    growth: number
  }>
  activeUsersNow: number
  responseTime: number
  satisfaction: number
}

// 动画计数器
interface CounterAnimation {
  current: number
  target: number
  isAnimating: boolean
}

export function useHomeStats() {
  // 响应式状态
  const loading = ref(true)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 统计数据
  const stats = reactive<HomeStats>({
    totalUsers: 0,
    totalCharacters: 0,
    totalChats: 0,
    totalFavorites: 0,
    newUsersToday: 0,
    newCharactersToday: 0,
    newChatsToday: 0,
    averageRating: 0,
    topCategories: [],
    activeUsersNow: 0,
    responseTime: 0,
    satisfaction: 0
  })

  // 动画计数器
  const counters = reactive<Record<keyof HomeStats, CounterAnimation>>({
    totalUsers: { current: 0, target: 0, isAnimating: false },
    totalCharacters: { current: 0, target: 0, isAnimating: false },
    totalChats: { current: 0, target: 0, isAnimating: false },
    totalFavorites: { current: 0, target: 0, isAnimating: false },
    newUsersToday: { current: 0, target: 0, isAnimating: false },
    newCharactersToday: { current: 0, target: 0, isAnimating: false },
    newChatsToday: { current: 0, target: 0, isAnimating: false },
    averageRating: { current: 0, target: 0, isAnimating: false },
    topCategories: { current: 0, target: 0, isAnimating: false },
    activeUsersNow: { current: 0, target: 0, isAnimating: false },
    responseTime: { current: 0, target: 0, isAnimating: false },
    satisfaction: { current: 0, target: 0, isAnimating: false }
  })

  // 获取首页统计数据
  const fetchStats = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await http.get('/api/stats/homepage')

      if (response?.data) {
        // 更新统计数据
        Object.assign(stats, response.data)
        lastUpdated.value = new Date()

        // 开始数字动画
        animateNumbers()
      } else {
        // 使用模拟数据作为fallback
        useSimulatedStats()
      }
    } catch (err) {
      console.warn('Failed to fetch homepage stats, using simulated data:', err)
      error.value = 'Failed to load statistics'

      // 使用模拟数据
      useSimulatedStats()
    } finally {
      loading.value = false
    }
  }

  // 使用模拟数据 (开发环境或API失败时的备选方案)
  const useSimulatedStats = () => {
    const simulatedStats = {
      totalUsers: 15420,
      totalCharacters: 3280,
      totalChats: 89540,
      totalFavorites: 42160,
      newUsersToday: 127,
      newCharactersToday: 23,
      newChatsToday: 584,
      averageRating: 4.8,
      topCategories: [
        { name: '动漫', count: 1240, growth: 12.5 },
        { name: '游戏', count: 987, growth: 8.3 },
        { name: '小说', count: 756, growth: 15.2 },
        { name: '历史', count: 234, growth: -2.1 },
        { name: '原创', count: 523, growth: 22.8 }
      ],
      activeUsersNow: 892,
      responseTime: 0.3,
      satisfaction: 96.8
    }

    Object.assign(stats, simulatedStats)
    lastUpdated.value = new Date()
    animateNumbers()
  }

  // 数字递增动画
  const animateNumbers = () => {
    const animatableKeys = [
      'totalUsers', 'totalCharacters', 'totalChats', 'totalFavorites',
      'newUsersToday', 'newCharactersToday', 'newChatsToday', 'activeUsersNow'
    ] as const

    animatableKeys.forEach(key => {
      const counter = counters[key]
      const target = stats[key] as number

      if (counter.target === target) return

      counter.target = target
      counter.isAnimating = true

      // 使用easing函数创建平滑动画
      const duration = 2000 // 2秒动画
      const startTime = Date.now()
      const startValue = counter.current
      const difference = target - startValue

      const animate = () => {
        const now = Date.now()
        const elapsed = Math.min(now - startTime, duration)
        const progress = elapsed / duration

        // easeOutExpo缓动函数
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

        counter.current = Math.round(startValue + difference * easedProgress)

        // 确保不超过目标值
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          counter.current = target
          counter.isAnimating = false
        }
      }

      requestAnimationFrame(animate)
    })

    // 单独处理小数类型的统计
    animateDecimalStat('averageRating', stats.averageRating, 1)
    animateDecimalStat('responseTime', stats.responseTime, 1)
    animateDecimalStat('satisfaction', stats.satisfaction, 1)
  }

  // 小数类型统计动画
  const animateDecimalStat = (key: keyof HomeStats, target: number, decimals: number) => {
    const counter = counters[key]

    if (counter.target === target) return

    counter.target = target
    counter.isAnimating = true

    const duration = 2000
    const startTime = Date.now()
    const startValue = counter.current
    const difference = target - startValue

    const animate = () => {
      const now = Date.now()
      const elapsed = Math.min(now - startTime, duration)
      const progress = elapsed / duration

      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      counter.current = parseFloat((startValue + difference * easedProgress).toFixed(decimals))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        counter.current = target
        counter.isAnimating = false
      }
    }

    requestAnimationFrame(animate)
  }

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // 格式化增长率
  const formatGrowth = (growth: number): string => {
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${growth.toFixed(1)}%`
  }

  // 获取增长率颜色类
  const getGrowthColorClass = (growth: number): string => {
    if (growth > 0) return 'text-success'
    if (growth < 0) return 'text-error'
    return 'text-secondary'
  }

  // 刷新统计数据
  const refreshStats = async () => {
    await fetchStats()
  }

  // 获取动画计数器值
  const getAnimatedValue = (key: keyof HomeStats): number => {
    return counters[key].current
  }

  // 检查是否正在动画
  const isAnimating = (key: keyof HomeStats): boolean => {
    return counters[key].isAnimating
  }

  // 获取实时数据 (WebSocket连接)
  const startRealTimeUpdates = () => {
    // 这里可以建立WebSocket连接获取实时数据
    // 暂时使用定时器模拟实时更新
    const interval = setInterval(() => {
      if (!loading.value) {
        // 模拟小幅度的实时数据变化
        stats.activeUsersNow += Math.floor(Math.random() * 10) - 5
        if (stats.activeUsersNow < 0) stats.activeUsersNow = 0

        // 偶尔更新其他统计
        if (Math.random() < 0.1) {
          stats.newChatsToday += Math.floor(Math.random() * 3)
          stats.totalChats += Math.floor(Math.random() * 3)
        }
      }
    }, 30000) // 30秒更新一次

    // 返回清理函数
    return () => clearInterval(interval)
  }

  // 生命周期钩子
  onMounted(() => {
    fetchStats()
  })

  return {
    // 状态
    stats,
    counters,
    loading,
    error,
    lastUpdated,

    // 方法
    fetchStats,
    refreshStats,
    animateNumbers,
    formatNumber,
    formatGrowth,
    getGrowthColorClass,
    getAnimatedValue,
    isAnimating,
    startRealTimeUpdates
  }
}