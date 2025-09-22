<template>
  <el-button
    @click="handleStartChat"
    :loading="isLoading"
    :disabled="isDisabled"
    :type="type"
    :size="size"
    :class="buttonClass"
    class="one-click-chat-button"
  >
    <template #loading>
      <el-icon class="animate-spin"><Loading /></el-icon>
    </template>

    <template #icon v-if="!isLoading">
      <el-icon><MessageBox /></el-icon>
    </template>

    <span v-if="!isLoading">
      {{ buttonText }}
    </span>
    <span v-else>
      {{ loadingText }}
    </span>
  </el-button>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useCharacterStore, type Character } from '@/stores/character'
import { useQuickChatPerformance } from '@/composables/useQuickChatPerformance'
import { ElMessage } from 'element-plus'
import { Loading, MessageBox } from '@element-plus/icons-vue'

interface ChatMode {
  id: string
  name: string
  defaultSettings: Record<string, any>
}

const props = withDefaults(defineProps<{
  character?: Character | null
  characterId?: string
  mode?: ChatMode | null
  settings?: Record<string, any>
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'large' | 'default' | 'small'
  quickMode?: boolean
  buttonText?: string
  loadingText?: string
  autoNavigate?: boolean
}>(), {
  type: 'primary',
  size: 'default',
  quickMode: false,
  buttonText: '开始对话',
  loadingText: '创建中...',
  autoNavigate: true
})

const emit = defineEmits<{
  'chat-started': [sessionId: string]
  'chat-error': [error: string]
  'loading-change': [loading: boolean]
}>()

const router = useRouter()
const chatStore = useChatStore()
const characterStore = useCharacterStore()
const { getCharacterFast, createChatFast } = useQuickChatPerformance()

// 状态
const isLoading = ref(false)
const currentCharacter = ref<Character | null>(props.character || null)

// 计算属性
const isDisabled = computed(() => {
  return isLoading.value || (!currentCharacter.value && !props.characterId)
})

const buttonClass = computed(() => {
  const baseClass = 'transition-all duration-300 font-medium'
  const sizeClass = {
    'large': 'px-8 py-3 text-lg min-w-[140px]',
    'default': 'px-6 py-2 min-w-[120px]',
    'small': 'px-4 py-1 text-sm min-w-[100px]'
  }

  return [
    baseClass,
    sizeClass[props.size],
    {
      'hover:scale-105 active:scale-95': !isLoading.value && !isDisabled.value,
      'cursor-not-allowed opacity-60': isDisabled.value
    }
  ]
})

// 加载角色信息 - 使用快速加载
const loadCharacter = async (): Promise<Character | null> => {
  if (currentCharacter.value) {
    return currentCharacter.value
  }

  if (props.characterId) {
    try {
      const character = await getCharacterFast(props.characterId)
      if (character) {
        currentCharacter.value = character
        return character
      }
    } catch (error) {
      console.error('加载角色失败:', error)
    }
  }

  return null
}

// 创建快速会话
const createQuickSession = async (character: Character): Promise<string | null> => {
  try {
    const session = await chatStore.createSession(
      character.id,
      character.name,
      character.avatar
    )

    if (session) {
      // 应用快速设置
      if (props.settings || props.mode?.defaultSettings) {
        const settings = {
          ...props.mode?.defaultSettings,
          ...props.settings
        }
        session.settings = settings
      }

      return session.id
    }

    return null
  } catch (error) {
    console.error('创建会话失败:', error)
    throw error
  }
}

// 智能默认设置
const getSmartDefaults = (character: Character) => {
  const defaults: Record<string, any> = {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  }

  // 根据角色特征调整默认设置
  if (character.tags?.includes('creative') || character.tags?.includes('artistic')) {
    defaults.temperature = 0.9
    defaults.model = 'gpt-4'
  }

  if (character.tags?.includes('analytical') || character.tags?.includes('technical')) {
    defaults.temperature = 0.3
    defaults.maxTokens = 1500
  }

  if (character.isNSFW) {
    defaults.temperature = 0.8
  }

  return defaults
}

// 主处理函数 - 使用性能优化版本
const handleStartChat = async () => {
  if (isLoading.value || isDisabled.value) {
    return
  }

  isLoading.value = true
  emit('loading-change', true)

  try {
    // 1. 加载角色信息 - 快速加载
    const character = await loadCharacter()
    if (!character) {
      throw new Error('角色信息加载失败')
    }

    // 2. 智能设置默认值
    let finalSettings = props.settings || {}
    if (props.quickMode || !props.settings) {
      const smartDefaults = getSmartDefaults(character)
      finalSettings = { ...smartDefaults, ...finalSettings }
    }

    // 3. 创建会话 - 使用快速创建
    const sessionId = await createChatFast(character, finalSettings)
    if (!sessionId) {
      throw new Error('创建对话会话失败')
    }

    // 4. 成功回调
    emit('chat-started', sessionId)

    // 5. 导航到聊天页面
    if (props.autoNavigate) {
      await router.push(`/chat/${sessionId}`)
    }

    // 6. 成功消息
    ElMessage.success({
      message: `与 ${character.name} 的对话已开始`,
      duration: 2000
    })

  } catch (error: any) {
    console.error('开始对话失败:', error)

    const errorMessage = error.message || '开始对话失败，请稍后重试'
    emit('chat-error', errorMessage)

    ElMessage.error({
      message: errorMessage,
      duration: 3000
    })
  } finally {
    isLoading.value = false
    emit('loading-change', false)
  }
}

// 监听角色变化
watch(() => props.character, (newCharacter) => {
  if (newCharacter) {
    currentCharacter.value = newCharacter
  }
}, { immediate: true })

watch(() => props.characterId, async (newCharacterId) => {
  if (newCharacterId && !currentCharacter.value) {
    await loadCharacter()
  }
}, { immediate: true })
</script>

<style scoped>
.one-click-chat-button {
  position: relative;
  overflow: hidden;
}

.one-click-chat-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.one-click-chat-button:active::before {
  width: 300px;
  height: 300px;
}

/* 成功状态动画 */
.one-click-chat-button.success-animation {
  animation: successPulse 0.5s ease-in-out;
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 加载状态优化 */
.one-click-chat-button .el-button__text {
  transition: all 0.3s ease;
}

.one-click-chat-button.loading {
  pointer-events: none;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .one-click-chat-button {
    width: 100%;
    justify-content: center;
  }
}

/* 可访问性增强 */
.one-click-chat-button:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.one-click-chat-button:focus:not(:focus-visible) {
  outline: none;
}
</style>