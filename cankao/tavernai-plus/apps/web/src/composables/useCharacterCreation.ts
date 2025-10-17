import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

// Types
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AppearanceData {
  physicalDescription: string
  outfit: string
  expressions: string[]
}

interface PersonalityTraits {
  introversion: number
  empathy: number
  creativity: number
  humor: number
  intelligence: number
}

export interface CharacterData {
  // 基础信息
  name: string
  avatar: string
  shortDescription: string
  category: string
  tags: string[]

  // 外观设定
  appearance: AppearanceData

  // 性格设定
  personality: string[]
  traits: PersonalityTraits

  // 背景故事
  background: string
  scenario: string
  firstMessage: string
  sampleConversation: ConversationMessage[]

  // 高级设置
  visibility: 'public' | 'unlisted' | 'private'
  isNSFW: boolean
}

// 默认数据
const createDefaultCharacterData = (): CharacterData => ({
  name: '',
  avatar: '',
  shortDescription: '',
  category: '',
  tags: [],
  appearance: {
    physicalDescription: '',
    outfit: '',
    expressions: []
  },
  personality: [],
  traits: {
    introversion: 50,
    empathy: 50,
    creativity: 50,
    humor: 50,
    intelligence: 50
  },
  background: '',
  scenario: '',
  firstMessage: '',
  sampleConversation: [],
  visibility: 'public',
  isNSFW: false
})

export function useCharacterCreation() {
  const router = useRouter()

  // State
  const characterData = ref<CharacterData>(createDefaultCharacterData())
  const isCreating = ref(false)
  const isDraftSaving = ref(false)
  const lastSavedDraft = ref<Date | null>(null)
  const createError = ref<string | null>(null)

  // Methods
  const createCharacter = async () => {
    isCreating.value = true
    createError.value = null

    try {
      // 验证必填字段
      const validation = validateCharacterData(characterData.value)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // 准备提交数据
      const submitData = {
        name: characterData.value.name,
        avatar: characterData.value.avatar,
        description: characterData.value.shortDescription, // 映射字段名
        personality: characterData.value.personality.join(', '), // 转换为数组字符串
        background: characterData.value.background,
        scenario: characterData.value.scenario,
        firstMessage: characterData.value.firstMessage,
        tags: characterData.value.tags, // 直接发送数组，让axios处理序列化
        category: characterData.value.category,
        isPublic: characterData.value.visibility === 'public',
        isNSFW: characterData.value.isNSFW,
        status: 'published'
      }

      // 调用API创建角色
      const response = await axios.post('/characters', submitData)

      if (response.data && response.data.id) {
        // 创建成功，跳转到角色详情页
        router.push(`/characters/${response.data.id}`)
        return response.data
      } else {
        throw new Error('创建角色失败，服务器响应异常')
      }
    } catch (error: any) {
      console.error('Failed to create character:', error)
      createError.value = error.response?.data?.message || error.message || '创建角色失败，请稍后再试'
      throw error
    } finally {
      isCreating.value = false
    }
  }

  const saveDraft = async () => {
    isDraftSaving.value = true

    try {
      // 准备草稿数据
      const draftData = {
        name: characterData.value.name,
        avatar: characterData.value.avatar,
        description: characterData.value.shortDescription, // 映射字段名
        personality: characterData.value.personality.join(', '), // 转换为数组字符串
        background: characterData.value.background,
        scenario: characterData.value.scenario,
        firstMessage: characterData.value.firstMessage,
        tags: characterData.value.tags, // 直接发送数组
        category: characterData.value.category,
        isPublic: characterData.value.visibility === 'public',
        isNSFW: characterData.value.isNSFW,
        status: 'draft'
      }

      // 调用API保存草稿
      const response = await axios.post('/characters', draftData)

      if (response.data) {
        lastSavedDraft.value = new Date()

        // 可以选择性地保存到本地存储作为备份
        saveToLocalStorage(characterData.value)

        return response.data
      } else {
        throw new Error('保存草稿失败')
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error)

      // 即使API失败也要保存到本地存储
      saveToLocalStorage(characterData.value)
      lastSavedDraft.value = new Date()

      // 不抛出错误，静默处理
      console.warn('草稿已保存到本地存储')
    } finally {
      isDraftSaving.value = false
    }
  }

  const loadFromDraft = (draftId?: string) => {
    try {
      if (draftId) {
        // TODO: 从服务器加载指定草稿
        // const response = await axios.get(`/api/characters/drafts/${draftId}`)
        // characterData.value = response.data
      } else {
        // 从本地存储加载
        const saved = localStorage.getItem('character_creation_draft')
        if (saved) {
          const parsedData = JSON.parse(saved)
          characterData.value = { ...createDefaultCharacterData(), ...parsedData }
          lastSavedDraft.value = new Date(parsedData._savedAt || Date.now())
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const clearDraft = () => {
    characterData.value = createDefaultCharacterData()
    localStorage.removeItem('character_creation_draft')
    lastSavedDraft.value = null
  }

  const resetCharacterData = () => {
    characterData.value = createDefaultCharacterData()
    createError.value = null
  }

  const updateCharacterData = (updates: Partial<CharacterData>) => {
    characterData.value = { ...characterData.value, ...updates }

    // 自动保存到本地存储（防丢失）
    debounceAutoSave()
  }

  // Helper functions
  const validateCharacterData = (data: CharacterData) => {
    const errors: string[] = []

    // 必填字段验证
    if (!data.name.trim()) {
      errors.push('角色名称不能为空')
    }

    if (!data.shortDescription.trim()) {
      errors.push('角色描述不能为空')
    }

    if (!data.category) {
      errors.push('请选择角色分类')
    }

    if (!data.firstMessage.trim()) {
      errors.push('开场白不能为空')
    }

    // 字符长度验证
    if (data.name.length > 50) {
      errors.push('角色名称不能超过50个字符')
    }

    if (data.shortDescription.length > 100) {
      errors.push('角色描述不能超过100个字符')
    }

    if (data.firstMessage.length > 200) {
      errors.push('开场白不能超过200个字符')
    }

    if (data.background && data.background.length > 1000) {
      errors.push('背景故事不能超过1000个字符')
    }

    // 标签数量限制
    if (data.tags.length > 10) {
      errors.push('标签数量不能超过10个')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const saveToLocalStorage = (data: CharacterData) => {
    try {
      const dataWithTimestamp = {
        ...data,
        _savedAt: new Date().toISOString()
      }
      localStorage.setItem('character_creation_draft', JSON.stringify(dataWithTimestamp))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  // 防抖自动保存
  let autoSaveTimer: NodeJS.Timeout | null = null
  const debounceAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(() => {
      saveToLocalStorage(characterData.value)
    }, 5000) // 5秒后自动保存
  }

  const exportCharacterData = () => {
    try {
      const exportData = {
        ...characterData.value,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${characterData.value.name || 'character'}_${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export character data:', error)
    }
  }

  const importCharacterData = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)

          // 验证导入数据的完整性
          const mergedData = { ...createDefaultCharacterData(), ...importedData }
          characterData.value = mergedData

          resolve()
        } catch (error) {
          reject(new Error('文件格式不正确'))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  // 计算完成度
  const getCompletionPercentage = () => {
    const data = characterData.value
    let completed = 0
    const total = 8 // 总计8个主要部分

    if (data.name) completed++
    if (data.shortDescription) completed++
    if (data.category) completed++
    if (data.firstMessage) completed++
    if (data.appearance.physicalDescription) completed++
    if (data.personality.length > 0) completed++
    if (data.background) completed++
    if (data.tags.length > 0) completed++

    return Math.round((completed / total) * 100)
  }

  // 获取角色统计信息
  const getCharacterStats = () => {
    const data = characterData.value
    return {
      completionPercentage: getCompletionPercentage(),
      wordCount: {
        description: data.shortDescription.length,
        background: data.background.length,
        firstMessage: data.firstMessage.length,
        total: data.shortDescription.length + data.background.length + data.firstMessage.length
      },
      tagCount: data.tags.length,
      expressionCount: data.appearance.expressions.length,
      personalityTraitCount: data.personality.length,
      conversationSampleCount: data.sampleConversation.length
    }
  }

  // 初始化时尝试加载草稿
  loadFromDraft()

  return {
    // State
    characterData,
    isCreating,
    isDraftSaving,
    lastSavedDraft,
    createError,

    // Methods
    createCharacter,
    saveDraft,
    loadFromDraft,
    clearDraft,
    resetCharacterData,
    updateCharacterData,
    exportCharacterData,
    importCharacterData,

    // Computed
    getCompletionPercentage,
    getCharacterStats,

    // Utils
    validateCharacterData
  }
}