import { ref, computed, onMounted } from 'vue'
import { http } from '@/utils/axios'

// 角色接口定义
interface Character {
  id: string
  name: string
  description: string
  avatar?: string
  creator?: {
    id: string
    username: string
  }
  tags: string[]
  category?: string
  rating: number
  chatCount: number
  favoriteCount: number
  isFavorited?: boolean
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  createdAt: string
  updatedAt: string
}

// 分类接口
interface Category {
  id: string
  name: string
  icon: string
  count: number
  description?: string
}

// 过滤选项接口
interface FilterOptions {
  category?: string
  tags?: string[]
  rating?: number
  sortBy?: 'popular' | 'newest' | 'rating' | 'chatCount'
  limit?: number
}

export function useFeatureChars() {
  // 响应式状态
  const featuredChars = ref<Character[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 过滤和排序状态
  const currentFilter = ref<FilterOptions>({
    sortBy: 'popular',
    limit: 20
  })

  // 获取精选角色数据
  const fetchFeaturedChars = async (options: FilterOptions = {}) => {
    try {
      loading.value = true
      error.value = null

      // 合并过滤选项
      const filterOptions = { ...currentFilter.value, ...options }

      const response = await http.get('/api/characters/featured', {
        params: filterOptions
      })

      if (response?.data?.characters) {
        featuredChars.value = response.data.characters.map(enrichCharacter)
        lastUpdated.value = new Date()
      } else {
        // 使用模拟数据
        useSimulatedChars(filterOptions)
      }
    } catch (err) {
      console.warn('Failed to fetch featured characters, using simulated data:', err)
      error.value = 'Failed to load characters'
      useSimulatedChars(options)
    } finally {
      loading.value = false
    }
  }

  // 获取角色分类
  const fetchCategories = async () => {
    try {
      const response = await http.get('/api/characters/categories')

      if (response?.data?.categories) {
        categories.value = response.data.categories
      } else {
        // 使用模拟分类数据
        useSimulatedCategories()
      }
    } catch (err) {
      console.warn('Failed to fetch categories, using simulated data:', err)
      useSimulatedCategories()
    }
  }

  // 丰富角色数据 (添加计算属性和状态)
  const enrichCharacter = (char: any): Character => {
    const now = new Date()
    const createdAt = new Date(char.createdAt)
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...char,
      // 判断是否为新角色 (7天内创建)
      isNew: daysSinceCreated <= 7,
      // 判断是否为高级角色 (根据某些条件)
      isPremium: char.rating >= 4.5 && char.chatCount >= 100,
      // NSFW检测 (基于标签)
      isNSFW: char.tags?.some((tag: string) =>
        ['nsfw', '18+', 'adult', '成人'].includes(tag.toLowerCase())
      ) || false,
      // 确保必要字段有默认值
      tags: char.tags || [],
      rating: char.rating || 0,
      chatCount: char.chatCount || 0,
      favoriteCount: char.favoriteCount || 0,
      description: char.description || '这个角色还没有描述...'
    }
  }

  // 使用模拟角色数据
  const useSimulatedChars = (options: FilterOptions = {}) => {
    const simulatedChars: Character[] = [
      {
        id: '1',
        name: '小樱',
        description: '温柔可爱的魔法少女，总是充满正能量，喜欢帮助别人解决问题。',
        avatar: '/avatars/sakura.jpg',
        creator: { id: 'u1', username: '魔法师小明' },
        tags: ['魔法少女', '治愈', '可爱', '积极'],
        category: 'anime',
        rating: 4.8,
        chatCount: 1520,
        favoriteCount: 856,
        isNew: true,
        isPremium: true,
        isNSFW: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '剑心',
        description: '浪人剑客，曾经的传说杀手，如今只想过平静的生活。',
        avatar: '/avatars/kenshin.jpg',
        creator: { id: 'u2', username: '武侠迷' },
        tags: ['武侠', '剑客', '赎罪', '正义'],
        category: 'historical',
        rating: 4.9,
        chatCount: 2340,
        favoriteCount: 1256,
        isNew: false,
        isPremium: true,
        isNSFW: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '艾莉娅',
        description: '神秘的精灵法师，掌握古老的魔法知识，性格高傲但内心善良。',
        avatar: '/avatars/aria.jpg',
        creator: { id: 'u3', username: '奇幻作家' },
        tags: ['精灵', '法师', '奇幻', '高傲'],
        category: 'fantasy',
        rating: 4.7,
        chatCount: 980,
        favoriteCount: 642,
        isNew: false,
        isPremium: false,
        isNSFW: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: '赛博女警',
        description: '未来都市的执法者，拥有先进的义体改造，坚持正义但手段灵活。',
        avatar: '/avatars/cyber-cop.jpg',
        creator: { id: 'u4', username: '赛博朋克爱好者' },
        tags: ['赛博朋克', '警察', '未来', '科技'],
        category: 'sci-fi',
        rating: 4.6,
        chatCount: 756,
        favoriteCount: 423,
        isNew: true,
        isPremium: false,
        isNSFW: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: '猫娘咖啡师',
        description: '在温馨咖啡厅工作的猫耳少女，擅长调制各种特色饮品，性格活泼开朗。',
        avatar: '/avatars/cat-barista.jpg',
        creator: { id: 'u5', username: '咖啡爱好者' },
        tags: ['猫娘', '咖啡', '服务', '可爱'],
        category: 'slice-of-life',
        rating: 4.5,
        chatCount: 1123,
        favoriteCount: 789,
        isNew: false,
        isPremium: false,
        isNSFW: false,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '6',
        name: '学生会长',
        description: '严格但关心同学的学生会长，成绩优异，有点完美主义倾向。',
        avatar: '/avatars/student-president.jpg',
        creator: { id: 'u6', username: '校园生活' },
        tags: ['学生', '严格', '完美主义', '领导'],
        category: 'school',
        rating: 4.4,
        chatCount: 890,
        favoriteCount: 567,
        isNew: false,
        isPremium: false,
        isNSFW: false,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '7',
        name: '龙族公主',
        description: '古老龙族的公主，拥有强大的魔法力量，但对人类世界充满好奇。',
        avatar: '/avatars/dragon-princess.jpg',
        creator: { id: 'u7', username: '龙族传说' },
        tags: ['龙族', '公主', '魔法', '好奇'],
        category: 'fantasy',
        rating: 4.8,
        chatCount: 1456,
        favoriteCount: 932,
        isNew: true,
        isPremium: true,
        isNSFW: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '8',
        name: '机械工程师',
        description: '天才机械工程师，能制造各种神奇的发明，性格有点古怪但很友善。',
        avatar: '/avatars/engineer.jpg',
        creator: { id: 'u8', username: '科技达人' },
        tags: ['工程师', '发明', '天才', '古怪'],
        category: 'sci-fi',
        rating: 4.3,
        chatCount: 674,
        favoriteCount: 378,
        isNew: false,
        isPremium: false,
        isNSFW: false,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // 根据过滤选项筛选角色
    let filtered = simulatedChars

    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(char => char.category === options.category)
    }

    if (options.tags?.length) {
      filtered = filtered.filter(char =>
        options.tags!.some(tag => char.tags.includes(tag))
      )
    }

    if (options.rating) {
      filtered = filtered.filter(char => char.rating >= options.rating!)
    }

    // 排序
    switch (options.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'chatCount':
        filtered.sort((a, b) => b.chatCount - a.chatCount)
        break
      case 'popular':
      default:
        filtered.sort((a, b) => (b.chatCount + b.favoriteCount * 2) - (a.chatCount + a.favoriteCount * 2))
        break
    }

    // 限制数量
    if (options.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    featuredChars.value = filtered.map(enrichCharacter)
    lastUpdated.value = new Date()
  }

  // 使用模拟分类数据
  const useSimulatedCategories = () => {
    categories.value = [
      { id: 'all', name: '全部', icon: 'grid', count: featuredChars.value.length },
      { id: 'anime', name: '动漫', icon: 'star', count: 245, description: '来自动漫作品的角色' },
      { id: 'game', name: '游戏', icon: 'gamepad', count: 189, description: '游戏角色和原创设定' },
      { id: 'fantasy', name: '奇幻', icon: 'magic', count: 134, description: '魔法世界的奇幻角色' },
      { id: 'sci-fi', name: '科幻', icon: 'rocket', count: 98, description: '未来科技背景角色' },
      { id: 'historical', name: '历史', icon: 'crown', count: 67, description: '历史人物和背景' },
      { id: 'slice-of-life', name: '日常', icon: 'home', count: 156, description: '日常生活场景角色' },
      { id: 'school', name: '校园', icon: 'book', count: 123, description: '学校和校园背景' },
      { id: 'original', name: '原创', icon: 'palette', count: 89, description: '用户原创角色' }
    ]
  }

  // 计算属性
  const filteredChars = computed(() => {
    return featuredChars.value
  })

  const totalCharsCount = computed(() => {
    return featuredChars.value.length
  })

  const newCharsCount = computed(() => {
    return featuredChars.value.filter(char => char.isNew).length
  })

  const premiumCharsCount = computed(() => {
    return featuredChars.value.filter(char => char.isPremium).length
  })

  // 按分类获取角色
  const getCharactersByCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      return featuredChars.value
    }
    return featuredChars.value.filter(char => char.category === categoryId)
  }

  // 按标签获取角色
  const getCharactersByTags = (tags: string[]) => {
    return featuredChars.value.filter(char =>
      tags.some(tag => char.tags.includes(tag))
    )
  }

  // 获取热门标签
  const getPopularTags = (limit = 10) => {
    const tagCounts: Record<string, number> = {}

    featuredChars.value.forEach(char => {
      char.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))
  }

  // 获取推荐角色 (基于某种算法)
  const getRecommendedChars = (baseChar: Character, limit = 4) => {
    // 简单的推荐算法：基于标签相似度
    const recommendations = featuredChars.value
      .filter(char => char.id !== baseChar.id)
      .map(char => {
        const commonTags = char.tags.filter(tag => baseChar.tags.includes(tag)).length
        const similarity = commonTags / Math.max(char.tags.length, baseChar.tags.length)
        return { char, similarity }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.char)

    return recommendations
  }

  // 搜索角色
  const searchCharacters = (query: string) => {
    const lowercaseQuery = query.toLowerCase()

    return featuredChars.value.filter(char =>
      char.name.toLowerCase().includes(lowercaseQuery) ||
      char.description.toLowerCase().includes(lowercaseQuery) ||
      char.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      char.creator?.username.toLowerCase().includes(lowercaseQuery)
    )
  }

  // 刷新数据
  const refreshChars = async (options?: FilterOptions) => {
    await fetchFeaturedChars(options)
  }

  // 更新过滤选项
  const updateFilter = async (newFilter: Partial<FilterOptions>) => {
    currentFilter.value = { ...currentFilter.value, ...newFilter }
    await fetchFeaturedChars(currentFilter.value)
  }

  // 生命周期钩子
  onMounted(async () => {
    await Promise.all([
      fetchFeaturedChars(),
      fetchCategories()
    ])
  })

  return {
    // 状态
    featuredChars,
    categories,
    loading,
    error,
    lastUpdated,
    currentFilter,

    // 计算属性
    filteredChars,
    totalCharsCount,
    newCharsCount,
    premiumCharsCount,

    // 方法
    fetchFeaturedChars,
    fetchCategories,
    refreshChars,
    updateFilter,
    getCharactersByCategory,
    getCharactersByTags,
    getPopularTags,
    getRecommendedChars,
    searchCharacters
  }
}