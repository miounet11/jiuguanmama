import api from './api'

export interface CharacterAffinity {
  id: string
  characterId: string
  affinityLevel: number
  affinityPoints: number
  relationshipType: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend' | 'soulmate'
  unlockCount: number
  lastInteractionAt: Date
  favorite: boolean
  nickname?: string
  spacetimeMemories: string[]
  specialEvents: string[]
  character: {
    name: string
    avatar?: string
    description: string
  }
}

export interface ScenarioProgress {
  id: string
  scenarioId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  progressPercentage: number
  totalSessions: number
  totalMessages: number
  totalTokens: number
  averageSessionTime: number
  proficiencyLevel: number
  proficiencyPoints: number
  difficulty: string
  startedAt?: Date
  completedAt?: Date
  lastPlayedAt: Date
  scenario: {
    name: string
    description?: string
  }
}

export interface CharacterProficiency {
  id: string
  characterId: string
  proficiencyLevel: number
  proficiencyPoints: number
  masteryAreas: string[]
  skillTreeUnlocked: string[]
  activeSkills: string[]
  skillPoints: number
  totalInteractions: number
  successfulOutcomes: number
  averageRating: number
  firstEncounterAt: Date
  lastInteractionAt: Date
  character: {
    name: string
    avatar?: string
    personality?: string
  }
}

export interface UserAchievement {
  id: string
  achievementId: string
  achievementType: string
  title: string
  description: string
  icon?: string
  rarity: string
  points: number
  unlockedAt: Date
}

export interface DailyQuest {
  id: string
  questType: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  rewardPoints: number
  rewardType: string
  isCompleted: boolean
  isClaimed: boolean
  expiresAt: Date
  completedAt?: Date
  claimedAt?: Date
}

export const gamificationService = {
  // ==================== 亲密度系统 ====================

  // 获取角色亲密度
  async getCharacterAffinity(characterId: string): Promise<{ success: boolean; affinity: CharacterAffinity }> {
    return api.get(`/api/gamification/affinity/${characterId}`)
  },

  // 更新角色亲密度
  async updateCharacterAffinity(data: {
    characterId: string
    affinityPoints: number
    interactionType?: string
  }): Promise<{
    success: boolean
    affinity: CharacterAffinity
    leveledUp: boolean
  }> {
    return api.post('/api/gamification/affinity/update', data)
  },

  // 设置角色收藏
  async setCharacterFavorite(characterId: string, favorite: boolean): Promise<{
    success: boolean
    affinity: CharacterAffinity
  }> {
    return api.post(`/api/gamification/affinity/${characterId}/favorite`, { favorite })
  },

  // ==================== 剧本进度系统 ====================

  // 获取剧本进度
  async getScenarioProgress(scenarioId: string): Promise<{
    success: boolean
    progress: ScenarioProgress | null
  }> {
    return api.get(`/api/gamification/scenario-progress/${scenarioId}`)
  },

  // 更新剧本进度
  async updateScenarioProgress(data: {
    scenarioId: string
    progressPercentage: number
    sessionTime?: number
    messagesCount?: number
    tokensUsed?: number
  }): Promise<{
    success: boolean
    progress: ScenarioProgress
    completed: boolean
    leveledUp: boolean
    isFirstTime: boolean
  }> {
    return api.post('/api/gamification/scenario-progress/update', data)
  },

  // ==================== 熟练度系统 ====================

  // 获取角色熟练度
  async getCharacterProficiency(characterId: string): Promise<{
    success: boolean
    proficiency: CharacterProficiency
  }> {
    return api.get(`/api/gamification/proficiency/${characterId}`)
  },

  // 更新角色熟练度
  async updateCharacterProficiency(data: {
    characterId: string
    proficiencyPoints: number
    interactionType: string
    success?: boolean
  }): Promise<{
    success: boolean
    proficiency: CharacterProficiency
    leveledUp: boolean
  }> {
    return api.post('/api/gamification/proficiency/update', data)
  },

  // ==================== 成就系统 ====================

  // 获取用户成就
  async getUserAchievements(): Promise<{
    success: boolean
    achievements: UserAchievement[]
    stats: Record<string, number>
  }> {
    return api.get('/api/gamification/achievements')
  },

  // ==================== 每日任务 ====================

  // 获取每日任务
  async getDailyQuests(): Promise<{
    success: boolean
    quests: DailyQuest[]
  }> {
    return api.get('/api/gamification/daily-quests')
  },

  // 更新任务进度
  async updateQuestProgress(questId: string, increment: number = 1): Promise<{
    success: boolean
    quest: DailyQuest
    completed: boolean
  }> {
    return api.post(`/api/gamification/daily-quests/${questId}/progress`, { increment })
  },

  // 领取任务奖励
  async claimQuestReward(questId: string): Promise<{
    success: boolean
    reward: {
      type: string
      points: number
    }
  }> {
    return api.post(`/api/gamification/daily-quests/${questId}/claim`)
  },

  // ==================== 游戏化统计 ====================

  // 获取用户游戏化概览
  async getGamingOverview(): Promise<{
    success: boolean
    overview: any
  }> {
    return api.get('/api/gamification/overview')
  },

  // 获取用户所有亲密度列表
  async getAllAffinities(params?: {
    sort?: 'level' | 'points' | 'recent'
    limit?: number
  }): Promise<{
    success: boolean
    affinities: CharacterAffinity[]
  }> {
    return api.get('/api/gamification/affinities', { params })
  },

  // 获取用户所有剧本进度列表
  async getAllScenarioProgresses(params?: {
    status?: string
    sort?: 'progress' | 'level' | 'recent'
    limit?: number
  }): Promise<{
    success: boolean
    progresses: ScenarioProgress[]
  }> {
    return api.get('/api/gamification/scenario-progresses', { params })
  },

  // 获取用户所有熟练度列表
  async getAllProficiencies(params?: {
    sort?: 'level' | 'points' | 'rating' | 'recent'
    limit?: number
  }): Promise<{
    success: boolean
    proficiencies: CharacterProficiency[]
  }> {
    return api.get('/api/gamification/proficiencies', { params })
  },

  // 放弃剧本
  async abandonScenario(scenarioId: string): Promise<{
    success: boolean
    message: string
  }> {
    return api.post(`/api/gamification/scenario-progress/${scenarioId}/abandon`)
  }
}
