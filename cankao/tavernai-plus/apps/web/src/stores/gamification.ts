import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { gamificationService } from '@/services/gamification'
import type {
  CharacterAffinity,
  ScenarioProgress,
  CharacterProficiency,
  UserAchievement,
  DailyQuest
} from '@/services/gamification'
import { ElMessage } from 'element-plus'

// 游戏化事件类型
export type GamificationEvent =
  | 'affinity_update'
  | 'scenario_progress'
  | 'proficiency_update'
  | 'achievement_unlock'
  | 'level_up'
  | 'quest_complete'

export interface GamificationState {
  // 亲密度数据
  characterAffinities: Map<string, CharacterAffinity>
  // 剧本进度数据
  scenarioProgress: Map<string, ScenarioProgress>
  // 熟练度数据
  characterProficiencies: Map<string, CharacterProficiency>
  // 成就数据
  achievements: UserAchievement[]
  // 每日任务
  dailyQuests: DailyQuest[]
  // 加载状态
  loading: boolean
  // 通知队列
  notifications: Array<{
    id: string
    type: GamificationEvent
    title: string
    message: string
    timestamp: Date
    data?: any
  }>
}

export const useGamificationStore = defineStore('gamification', () => {
  // 状态
  const state = reactive<GamificationState>({
    characterAffinities: new Map(),
    scenarioProgress: new Map(),
    characterProficiencies: new Map(),
    achievements: [],
    dailyQuests: [],
    loading: false,
    notifications: []
  })

  // 计算属性
  const totalAffinityLevel = computed(() => {
    let total = 0
    state.characterAffinities.forEach(affinity => {
      total += affinity.affinityLevel
    })
    return total
  })

  const completedScenariosCount = computed(() => {
    let count = 0
    state.scenarioProgress.forEach(progress => {
      if (progress.status === 'completed') count++
    })
    return count
  })

  const favoriteCharacters = computed(() => {
    return Array.from(state.characterAffinities.values())
      .filter(affinity => affinity.favorite)
      .sort((a, b) => b.affinityLevel - a.affinityLevel)
  })

  const recentProgress = computed(() => {
    return Array.from(state.scenarioProgress.values())
      .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime())
      .slice(0, 5)
  })

  const activeQuests = computed(() => {
    return state.dailyQuests.filter(quest => !quest.isCompleted)
  })

  const completedQuests = computed(() => {
    return state.dailyQuests.filter(quest => quest.isCompleted && !quest.isClaimed)
  })

  // 方法

  // ==================== 亲密度系统 ====================

  const getCharacterAffinity = async (characterId: string): Promise<CharacterAffinity | null> => {
    try {
      const response = await gamificationService.getCharacterAffinity(characterId)
      if (response.success && response.affinity) {
        state.characterAffinities.set(characterId, response.affinity)
        return response.affinity
      }
      return null
    } catch (error) {
      console.error('获取角色亲密度失败:', error)
      return null
    }
  }

  const updateCharacterAffinity = async (data: {
    characterId: string
    affinityPoints: number
    interactionType?: string
  }): Promise<boolean> => {
    try {
      state.loading = true
      const response = await gamificationService.updateCharacterAffinity(data)

      if (response.success) {
        const affinity = response.affinity
        const oldLevel = state.characterAffinities.get(data.characterId)?.affinityLevel || 1

        state.characterAffinities.set(data.characterId, affinity)

        // 发送通知
        if (response.leveledUp) {
          addNotification({
            type: 'level_up',
            title: '亲密度升级！',
            message: `与 ${affinity.character.name} 的亲密度升至 ${affinity.affinityLevel} 级`,
            data: { affinity }
          })
        }

        // 触发亲密度更新事件
        addNotification({
          type: 'affinity_update',
          title: '亲密度提升',
          message: `与 ${affinity.character.name} 的关系更加亲密了`,
          data: { affinity, points: data.affinityPoints }
        })

        return true
      }
      return false
    } catch (error) {
      console.error('更新亲密度失败:', error)
      return false
    } finally {
      state.loading = false
    }
  }

  const setCharacterFavorite = async (characterId: string, favorite: boolean): Promise<boolean> => {
    try {
      const response = await gamificationService.setCharacterFavorite(characterId, favorite)
      if (response.success) {
        const affinity = state.characterAffinities.get(characterId)
        if (affinity) {
          affinity.favorite = favorite
          state.characterAffinities.set(characterId, affinity)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('设置收藏失败:', error)
      return false
    }
  }

  // ==================== 剧本进度系统 ====================

  const getScenarioProgress = async (scenarioId: string): Promise<ScenarioProgress | null> => {
    try {
      const response = await gamificationService.getScenarioProgress(scenarioId)
      if (response.success && response.progress) {
        state.scenarioProgress.set(scenarioId, response.progress)
        return response.progress
      }
      return null
    } catch (error) {
      console.error('获取剧本进度失败:', error)
      return null
    }
  }

  const updateScenarioProgress = async (data: {
    scenarioId: string
    progressPercentage: number
    sessionTime?: number
    messagesCount?: number
    tokensUsed?: number
  }): Promise<boolean> => {
    try {
      state.loading = true
      const response = await gamificationService.updateScenarioProgress(data)

      if (response.success) {
        const progress = response.progress
        const oldProgress = state.scenarioProgress.get(data.scenarioId)?.progressPercentage || 0

        state.scenarioProgress.set(data.scenarioId, progress)

        // 发送通知
        if (response.completed && oldProgress < 1.0) {
          addNotification({
            type: 'scenario_progress',
            title: '剧本完成！',
            message: `恭喜完成剧本《${progress.scenario.name}》`,
            data: { progress }
          })
        }

        if (response.leveledUp) {
          addNotification({
            type: 'level_up',
            title: '熟练度提升！',
            message: `在《${progress.scenario.name}》中的熟练度升至 ${progress.proficiencyLevel} 级`,
            data: { progress }
          })
        }

        return true
      }
      return false
    } catch (error) {
      console.error('更新剧本进度失败:', error)
      return false
    } finally {
      state.loading = false
    }
  }

  // ==================== 熟练度系统 ====================

  const getCharacterProficiency = async (characterId: string): Promise<CharacterProficiency | null> => {
    try {
      const response = await gamificationService.getCharacterProficiency(characterId)
      if (response.success && response.proficiency) {
        state.characterProficiencies.set(characterId, response.proficiency)
        return response.proficiency
      }
      return null
    } catch (error) {
      console.error('获取角色熟练度失败:', error)
      return null
    }
  }

  const updateCharacterProficiency = async (data: {
    characterId: string
    proficiencyPoints: number
    interactionType: string
    success?: boolean
  }): Promise<boolean> => {
    try {
      state.loading = true
      const response = await gamificationService.updateCharacterProficiency(data)

      if (response.success) {
        const proficiency = response.proficiency
        state.characterProficiencies.set(data.characterId, proficiency)

        // 发送通知
        if (response.leveledUp) {
          addNotification({
            type: 'level_up',
            title: '熟练度升级！',
            message: `与 ${proficiency.character.name} 的熟练度升至 ${proficiency.proficiencyLevel} 级`,
            data: { proficiency }
          })
        }

        return true
      }
      return false
    } catch (error) {
      console.error('更新熟练度失败:', error)
      return false
    } finally {
      state.loading = false
    }
  }

  // ==================== 成就系统 ====================

  const loadAchievements = async (): Promise<boolean> => {
    try {
      const response = await gamificationService.getUserAchievements()
      if (response.success) {
        state.achievements = response.achievements
        return true
      }
      return false
    } catch (error) {
      console.error('加载成就失败:', error)
      return false
    }
  }

  // ==================== 每日任务 ====================

  const loadDailyQuests = async (): Promise<boolean> => {
    try {
      const response = await gamificationService.getDailyQuests()
      if (response.success) {
        state.dailyQuests = response.quests
        return true
      }
      return false
    } catch (error) {
      console.error('加载每日任务失败:', error)
      return false
    }
  }

  const claimQuestReward = async (questId: string): Promise<boolean> => {
    try {
      const response = await gamificationService.claimQuestReward(questId)
      if (response.success) {
        const quest = state.dailyQuests.find(q => q.id === questId)
        if (quest) {
          quest.isClaimed = true
          quest.claimedAt = new Date()
        }

        ElMessage.success(`获得 ${response.reward.points} ${response.reward.type === 'credits' ? '积分' : '奖励'}`)
        return true
      }
      return false
    } catch (error) {
      console.error('领取奖励失败:', error)
      return false
    }
  }

  // ==================== 通知系统 ====================

  const addNotification = (notification: Omit<GamificationState['notifications'][0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    state.notifications.unshift(newNotification)

    // 限制通知数量
    if (state.notifications.length > 10) {
      state.notifications = state.notifications.slice(0, 10)
    }
  }

  const removeNotification = (id: string) => {
    const index = state.notifications.findIndex(n => n.id === id)
    if (index >= -1) {
      state.notifications.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    state.notifications = []
  }

  // ==================== 数据加载 ====================

  const loadGamingOverview = async (): Promise<boolean> => {
    try {
      state.loading = true
      const response = await gamificationService.getGamingOverview()

      if (response.success) {
        const overview = response.overview

        // 更新统计数据
        // 这里可以根据需要加载更多详细信息

        return true
      }
      return false
    } catch (error) {
      console.error('加载游戏化概览失败:', error)
      return false
    } finally {
      state.loading = false
    }
  }

  const refreshData = async (): Promise<boolean> => {
    try {
      state.loading = true

      const results = await Promise.allSettled([
        loadAchievements(),
        loadDailyQuests(),
        loadGamingOverview()
      ])

      const successCount = results.filter(result =>
        result.status === 'fulfilled' && result.value === true
      ).length

      return successCount > 0
    } catch (error) {
      console.error('刷新游戏化数据失败:', error)
      return false
    } finally {
      state.loading = false
    }
  }

  return {
    // 状态
    ...state,

    // 计算属性
    totalAffinityLevel,
    completedScenariosCount,
    favoriteCharacters,
    recentProgress,
    activeQuests,
    completedQuests,

    // 方法
    getCharacterAffinity,
    updateCharacterAffinity,
    setCharacterFavorite,

    getScenarioProgress,
    updateScenarioProgress,

    getCharacterProficiency,
    updateCharacterProficiency,

    loadAchievements,
    loadDailyQuests,
    claimQuestReward,

    addNotification,
    removeNotification,
    clearNotifications,

    loadGamingOverview,
    refreshData
  }
})
