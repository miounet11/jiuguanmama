import { ref, reactive, computed } from 'vue'

export interface Scene {
  id: string
  name: string
  description: string
  url: string
  thumbnail?: string
  type?: string
  category?: string
  keywords?: string[]
  opacity?: number
}

export interface SceneTransition {
  from: string
  to: string
  duration: number
  easing: string
}

export function useSceneSystem() {
  // 当前场景状态
  const currentSceneId = ref('default')
  const activeLayerIndex = ref(0)
  const isTransitioning = ref(false)
  const autoDetectEnabled = ref(false)

  // 可用场景库
  const availableScenes = ref<Scene[]>([
    {
      id: 'default',
      name: '默认场景',
      description: '简约优雅的默认背景',
      url: '/backgrounds/default-chat.jpg',
      thumbnail: '/backgrounds/thumbnails/default-chat.jpg',
      category: 'abstract',
      keywords: ['默认', '通用', '简约'],
      opacity: 0.3
    },
    {
      id: 'tavern-interior',
      name: '时空酒馆内景',
      description: '温馨的酒馆内部，适合日常对话',
      url: '/uploads/scenarios/backgrounds/timespace-tavern-interior.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/timespace-tavern-interior.jpg',
      category: 'interior',
      keywords: ['酒馆', '室内', '温馨', '聊天', '放松'],
      opacity: 0.4
    },
    {
      id: 'stellar-port',
      name: '星际港口',
      description: '未来感十足的太空港口场景',
      url: '/uploads/scenarios/backgrounds/stellar-port.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/stellar-port.jpg',
      category: 'sci-fi',
      keywords: ['星际', '港口', '科幻', '未来', '太空', '科技'],
      opacity: 0.35
    },
    {
      id: 'magic-library',
      name: '魔法图书馆',
      description: '充满神秘感的魔法图书馆',
      url: '/uploads/scenarios/backgrounds/magic-library.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/magic-library.jpg',
      category: 'fantasy',
      keywords: ['图书馆', '魔法', '书籍', '学习', '奇幻', '智慧'],
      opacity: 0.4
    },
    {
      id: 'cyber-city',
      name: '赛博都市',
      description: '霓虹闪烁的未来城市夜景',
      url: '/uploads/scenarios/backgrounds/cyber-city.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/cyber-city.jpg',
      category: 'sci-fi',
      keywords: ['赛博朋克', '都市', '霓虹', '科技', '夜晚', '未来'],
      opacity: 0.35
    },
    {
      id: 'wasteland',
      name: '末世废土',
      description: '荒凉但充满希望的末世场景',
      url: '/uploads/scenarios/backgrounds/wasteland-scene.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/wasteland-scene.jpg',
      category: 'nature',
      keywords: ['废土', '末世', '荒凉', '生存', '冒险'],
      opacity: 0.3
    },
    {
      id: 'serene-forest',
      name: '宁静森林',
      description: '自然清新的森林环境',
      url: '/uploads/scenarios/backgrounds/serene-forest.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/serene-forest.jpg',
      category: 'nature',
      keywords: ['森林', '自然', '宁静', '绿色', '清新'],
      opacity: 0.35
    },
    {
      id: 'ocean-view',
      name: '海景视角',
      description: '广阔海洋的壮丽景色',
      url: '/uploads/scenarios/backgrounds/ocean-view.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/ocean-view.jpg',
      category: 'nature',
      keywords: ['海洋', '海景', '广阔', '蓝色', '宁静'],
      opacity: 0.3
    },
    {
      id: 'mountain-peak',
      name: '山峰之巅',
      description: '雄伟壮丽的高山景观',
      url: '/uploads/scenarios/backgrounds/mountain-peak.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/mountain-peak.jpg',
      category: 'nature',
      keywords: ['山峰', '高山', '雄伟', '自然', '壮观'],
      opacity: 0.35
    },
    {
      id: 'cosmic-nebula',
      name: '宇宙星云',
      description: '神秘美丽的宇宙星云',
      url: '/uploads/scenarios/backgrounds/cosmic-nebula.jpg',
      thumbnail: '/uploads/scenarios/backgrounds/thumbnails/cosmic-nebula.jpg',
      category: 'abstract',
      keywords: ['宇宙', '星云', '太空', '神秘', '美丽'],
      opacity: 0.4
    }
  ])

  // 背景图层管理
  const backgroundLayers = ref<Scene[]>([availableScenes.value[0]])

  // 当前场景计算属性
  const currentScene = computed(() => {
    return availableScenes.value.find(scene => scene.id === currentSceneId.value) || availableScenes.value[0]
  })

  // 场景转换历史
  const transitionHistory = ref<string[]>(['default'])

  // 场景切换方法
  const changeScene = async (sceneIdOrScene: string | Scene): Promise<void> => {
    const sceneId = typeof sceneIdOrScene === 'string' ? sceneIdOrScene : sceneIdOrScene.id
    const newScene = availableScenes.value.find(scene => scene.id === sceneId)

    if (!newScene || newScene.id === currentSceneId.value) {
      return
    }

    // 开始转换动画
    isTransitioning.value = true

    try {
      // 预加载新场景图片
      await preloadSceneImage(newScene)

      // 执行场景转换
      await performSceneTransition(newScene)

      // 更新当前场景
      currentSceneId.value = newScene.id
      transitionHistory.value.push(newScene.id)

      // 限制历史记录长度
      if (transitionHistory.value.length > 10) {
        transitionHistory.value = transitionHistory.value.slice(-10)
      }

    } catch (error) {
      console.error('场景切换失败:', error)
      // 即使失败也更新场景，避免UI卡死
      currentSceneId.value = newScene.id
    } finally {
      isTransitioning.value = false
    }
  }

  // 预加载场景图片
  const preloadSceneImage = (scene: Scene): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => {
        console.warn(`场景图片加载失败: ${scene.url}`)
        resolve() // 即使加载失败也继续
      }
      img.src = scene.url
    })
  }

  // 执行场景转换动画
  const performSceneTransition = async (newScene: Scene): Promise<void> => {
    return new Promise(resolve => {
      // 添加新场景到图层
      if (!backgroundLayers.value.find(layer => layer.id === newScene.id)) {
        backgroundLayers.value.push(newScene)
      }

      // 更新活动图层索引
      const newLayerIndex = backgroundLayers.value.findIndex(layer => layer.id === newScene.id)
      activeLayerIndex.value = newLayerIndex

      // 动画持续时间
      const duration = 800
      setTimeout(resolve, duration)
    })
  }

  // 智能场景检测
  const detectSceneFromContent = (content: string): Scene | null => {
    if (!autoDetectEnabled.value || !content.trim()) {
      return null
    }

    const contentLower = content.toLowerCase()
    let bestMatch: Scene | null = null
    let bestScore = 0

    // 为每个场景计算匹配分数
    for (const scene of availableScenes.value) {
      if (!scene.keywords) continue

      let score = 0
      for (const keyword of scene.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 1
        }
      }

      if (score > bestScore && score >= 2) { // 至少匹配2个关键词
        bestScore = score
        bestMatch = scene
      }
    }

    return bestMatch
  }

  // 自动场景切换
  const autoDetectScene = (content: string): void => {
    if (!autoDetectEnabled.value) return

    const detectedScene = detectSceneFromContent(content)
    if (detectedScene && detectedScene.id !== currentSceneId.value) {
      // 使用较短的转换时间，避免频繁切换时的突兀感
      changeScene(detectedScene)
    }
  }

  // 切换自动检测开关
  const toggleAutoDetect = (enabled: boolean): void => {
    autoDetectEnabled.value = enabled
  }

  // 获取场景推荐
  const getSceneRecommendations = (content: string, limit: number = 3): Scene[] => {
    if (!content.trim()) {
      return availableScenes.value.slice(0, limit)
    }

    const contentLower = content.toLowerCase()
    const scored = availableScenes.value
      .map(scene => {
        let score = 0
        if (scene.keywords) {
          for (const keyword of scene.keywords) {
            if (contentLower.includes(keyword.toLowerCase())) {
              score += 1
            }
          }
        }
        return { scene, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.scene)

    return scored.length > 0 ? scored : availableScenes.value.slice(0, limit)
  }

  // 场景主题管理
  const getSceneByCategory = (category: string): Scene[] => {
    return availableScenes.value.filter(scene => scene.category === category)
  }

  // 获取场景统计
  const getSceneStats = () => {
    const categories = new Map<string, number>()

    availableScenes.value.forEach(scene => {
      const category = scene.category || 'other'
      categories.set(category, (categories.get(category) || 0) + 1)
    })

    return {
      totalScenes: availableScenes.value.length,
      categories: Object.fromEntries(categories),
      currentUsage: transitionHistory.value.length
    }
  }

  // 清理未使用的图层
  const cleanupUnusedLayers = (): void => {
    const usedIds = new Set([currentSceneId.value])

    // 只保留当前场景和前一个场景（用于平滑过渡）
    const recentIds = transitionHistory.value.slice(-2)
    recentIds.forEach(id => usedIds.add(id))

    backgroundLayers.value = backgroundLayers.value.filter(layer =>
      usedIds.has(layer.id)
    )

    // 确保至少有一个图层
    if (backgroundLayers.value.length === 0) {
      backgroundLayers.value = [availableScenes.value[0]]
    }
  }

  // 获取场景过渡配置
  const getTransitionConfig = (fromScene: string, toScene: string): SceneTransition => {
    const configs: Record<string, Partial<SceneTransition>> = {
      'default->fantasy': { duration: 1000, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      'fantasy->default': { duration: 800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      'nature->sci-fi': { duration: 1200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      'sci-fi->nature': { duration: 1000, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    }

    const key = `${fromScene}->${toScene}`
    const config = configs[key] || { duration: 800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }

    return {
      from: fromScene,
      to: toScene,
      ...config
    }
  }

  // 导出方法和状态
  return {
    // 状态
    currentSceneId,
    currentScene,
    activeLayerIndex,
    isTransitioning,
    autoDetectEnabled,
    availableScenes,
    backgroundLayers,
    transitionHistory,

    // 方法
    changeScene,
    detectSceneFromContent,
    autoDetectScene,
    toggleAutoDetect,
    getSceneRecommendations,
    getSceneByCategory,
    getSceneStats,
    cleanupUnusedLayers,
    getTransitionConfig,

    // 工具方法
    preloadSceneImage,
    performSceneTransition
  }
}