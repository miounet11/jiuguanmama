<template>
  <div class="quick-start-flow max-w-4xl mx-auto p-4">
    <!-- 流程标题 -->
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        快速开始对话
      </h2>
      <p class="text-gray-600">
        选择角色，30秒内开始精彩对话
      </p>
    </div>

    <!-- 进度指示器 -->
    <div class="progress-indicator mb-8">
      <div class="flex items-center justify-center space-x-4">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center"
        >
          <div
            class="step-circle"
            :class="{
              'active': currentStep >= index,
              'completed': currentStep > index
            }"
          >
            <el-icon v-if="currentStep > index" class="text-white">
              <Check />
            </el-icon>
            <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
          </div>
          <div
            v-if="index < steps.length - 1"
            class="step-line"
            :class="{ 'completed': currentStep > index }"
          ></div>
        </div>
      </div>
      <div class="step-labels flex justify-between mt-2 text-sm text-gray-600">
        <span v-for="step in steps" :key="step">{{ step }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area bg-white rounded-lg shadow-sm border p-6 min-h-[400px]">
      <!-- 步骤1: 角色选择 -->
      <div v-if="currentStep === 0" class="step-content">
        <h3 class="text-lg font-semibold mb-4">选择对话角色</h3>

        <!-- 快速搜索 -->
        <div class="mb-6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索角色名称或描述..."
            clearable
            @input="handleSearch"
            class="w-full"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 推荐角色 -->
        <div v-if="!searchQuery" class="mb-6">
          <h4 class="text-md font-medium mb-3 text-gray-700">推荐角色</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="character in recommendedCharacters"
              :key="character.id"
              @click="selectCharacter(character)"
              class="character-quick-card cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              :class="{ 'selected': selectedCharacter?.id === character.id }"
            >
              <div class="flex items-center space-x-3">
                <img
                  v-if="character.avatar"
                  :src="character.avatar"
                  :alt="character.name"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold"
                >
                  {{ character.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h5 class="font-medium text-gray-900 truncate">{{ character.name }}</h5>
                  <p class="text-sm text-gray-600 truncate">{{ character.description }}</p>
                  <div class="flex items-center mt-1 text-xs text-gray-500">
                    <span>{{ character.chatCount || 0 }}次对话</span>
                    <span class="mx-1">·</span>
                    <span>{{ (character.rating || 0).toFixed(1)}}/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else class="search-results">
          <h4 class="text-md font-medium mb-3 text-gray-700">搜索结果</h4>
          <div v-if="isSearching" class="text-center py-8">
            <el-icon class="animate-spin text-2xl text-gray-400"><Loading /></el-icon>
            <p class="text-gray-500 mt-2">搜索中...</p>
          </div>
          <div v-else-if="searchResults.length === 0" class="text-center py-8 text-gray-500">
            <p>未找到匹配的角色</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="character in searchResults"
              :key="character.id"
              @click="selectCharacter(character)"
              class="character-quick-card cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              :class="{ 'selected': selectedCharacter?.id === character.id }"
            >
              <div class="flex items-center space-x-3">
                <img
                  v-if="character.avatar"
                  :src="character.avatar"
                  :alt="character.name"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold"
                >
                  {{ character.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h5 class="font-medium text-gray-900 truncate">{{ character.name }}</h5>
                  <p class="text-sm text-gray-600 truncate">{{ character.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 对话模式选择 -->
      <div v-if="currentStep === 1" class="step-content">
        <h3 class="text-lg font-semibold mb-4">选择对话模式</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="mode in chatModes"
            :key="mode.id"
            @click="selectChatMode(mode)"
            class="mode-card cursor-pointer p-6 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            :class="{ 'selected': selectedMode?.id === mode.id }"
          >
            <div class="flex items-start space-x-4">
              <div class="mode-icon flex-shrink-0">
                <el-icon :size="24" :class="mode.iconClass">
                  <component :is="mode.icon" />
                </el-icon>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 mb-2">{{ mode.name }}</h4>
                <p class="text-sm text-gray-600 mb-3">{{ mode.description }}</p>
                <div class="text-xs text-gray-500">
                  <span>预计{{ mode.setupTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3: 快速设置 -->
      <div v-if="currentStep === 2" class="step-content">
        <ConversationQuickSetup
          :character="selectedCharacter"
          :mode="selectedMode"
          @settings-change="handleSettingsChange"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions mt-6 flex justify-between">
      <el-button
        v-if="currentStep > 0"
        @click="previousStep"
        size="large"
      >
        上一步
      </el-button>
      <div class="flex-1"></div>
      <el-button
        v-if="currentStep < steps.length - 1"
        @click="nextStep"
        type="primary"
        size="large"
        :disabled="!canProceed"
      >
        下一步
      </el-button>
      <OneClickChatButton
        v-if="currentStep === steps.length - 1"
        :character="selectedCharacter"
        :mode="selectedMode"
        :settings="quickSettings"
        @chat-started="handleChatStarted"
        size="large"
        class="ml-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore, type Character } from '@/stores/character'
import { useChatStore } from '@/stores/chat'
import { useQuickChatPerformance } from '@/composables/useQuickChatPerformance'
import { ElMessage } from 'element-plus'
import { Search, Loading, Check, MessageBox, Cpu, Rocket, Settings } from '@element-plus/icons-vue'
import OneClickChatButton from './OneClickChatButton.vue'
import ConversationQuickSetup from './ConversationQuickSetup.vue'

interface ChatMode {
  id: string
  name: string
  description: string
  icon: any
  iconClass: string
  setupTime: string
  defaultSettings: Record<string, any>
}

const props = defineProps<{
  characterId?: string // 如果有预选角色
}>()

const emit = defineEmits<{
  'chat-started': [sessionId: string]
  'flow-completed': []
}>()

const router = useRouter()
const characterStore = useCharacterStore()
const chatStore = useChatStore()
const { getCharacterFast, preloadPopularCharacters, prefetchNextCharacter } = useQuickChatPerformance()

// 流程状态
const steps = ['选择角色', '对话模式', '快速设置']
const currentStep = ref(0)

// 角色选择
const selectedCharacter = ref<Character | null>(null)
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<Character[]>([])
const recommendedCharacters = ref<Character[]>([])

// 对话模式
const selectedMode = ref<ChatMode | null>(null)
const chatModes: ChatMode[] = [
  {
    id: 'quick',
    name: '快速对话',
    description: '使用默认设置，立即开始对话',
    icon: Rocket,
    iconClass: 'text-blue-500',
    setupTime: '0秒',
    defaultSettings: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  {
    id: 'custom',
    name: '自定义设置',
    description: '调整AI模型参数和对话设置',
    icon: Settings,
    iconClass: 'text-purple-500',
    setupTime: '10-30秒',
    defaultSettings: {
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 2000
    }
  }
]

// 快速设置
const quickSettings = ref<Record<string, any>>({})

// 计算属性
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedCharacter.value !== null
    case 1:
      return selectedMode.value !== null
    case 2:
      return true
    default:
      return false
  }
})

// 搜索防抖 - 使用性能优化的防抖函数
import { QuickChatPerformance } from '@/composables/useQuickChatPerformance'

const handleSearch = QuickChatPerformance.debounce(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    await characterStore.searchCharacters(searchQuery.value)
    searchResults.value = characterStore.characters
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    isSearching.value = false
  }
}, 300)

// 选择角色
const selectCharacter = (character: Character) => {
  selectedCharacter.value = character

  // 预取下一个可能的角色（性能优化）
  prefetchNextCharacter(character.id)

  // 自动进入下一步（快速模式）
  if (selectedMode.value?.id === 'quick') {
    setTimeout(() => {
      nextStep()
    }, 500)
  }
}

// 选择对话模式
const selectChatMode = (mode: ChatMode) => {
  selectedMode.value = mode
  quickSettings.value = { ...mode.defaultSettings }

  // 快速模式自动跳过设置步骤
  if (mode.id === 'quick') {
    setTimeout(() => {
      nextStep()
    }, 300)
  }
}

// 处理设置变更
const handleSettingsChange = (settings: Record<string, any>) => {
  quickSettings.value = { ...quickSettings.value, ...settings }
}

// 流程控制
const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++

    // 快速模式跳过设置步骤
    if (currentStep.value === 2 && selectedMode.value?.id === 'quick') {
      currentStep.value++
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 开始对话
const handleChatStarted = (sessionId: string) => {
  emit('chat-started', sessionId)
  emit('flow-completed')

  // 导航到聊天页面
  router.push(`/chat/${sessionId}`)
}

// 加载推荐角色 - 使用性能优化版本
const loadRecommendedCharacters = async () => {
  try {
    // 使用性能优化的预加载功能
    const characters = await preloadPopularCharacters(6)
    recommendedCharacters.value = characters
  } catch (error) {
    console.error('加载推荐角色失败:', error)
    // 降级到普通加载
    try {
      await characterStore.fetchCharacters({
        limit: 6,
        sort: 'popular'
      })
      recommendedCharacters.value = characterStore.characters.slice(0, 6)
    } catch (fallbackError) {
      console.error('降级加载也失败:', fallbackError)
    }
  }
}

// 初始化
onMounted(async () => {
  await loadRecommendedCharacters()

  // 如果有预选角色ID，自动选择 - 使用快速加载
  if (props.characterId) {
    try {
      const character = await getCharacterFast(props.characterId)
      if (character) {
        selectedCharacter.value = character
      }
    } catch (error) {
      console.error('加载预选角色失败:', error)
    }
  }
})

// 预选模式
watch(selectedCharacter, (character) => {
  if (character && !selectedMode.value) {
    // 根据角色类型智能推荐模式
    const isComplexCharacter = character.personality &&
      character.personality.length > 200

    selectedMode.value = isComplexCharacter ? chatModes[1] : chatModes[0]
    quickSettings.value = { ...selectedMode.value.defaultSettings }
  }
})
</script>

<style scoped>
.progress-indicator {
  @apply relative;
}

.step-circle {
  @apply w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center transition-all duration-300;
}

.step-circle.active {
  @apply border-indigo-500 bg-indigo-50 text-indigo-600;
}

.step-circle.completed {
  @apply border-indigo-500 bg-indigo-500 text-white;
}

.step-line {
  @apply w-16 h-0.5 bg-gray-300 transition-all duration-300;
}

.step-line.completed {
  @apply bg-indigo-500;
}

.step-labels {
  @apply text-center;
}

.character-quick-card.selected {
  @apply border-indigo-500 bg-indigo-50 shadow-md;
}

.mode-card.selected {
  @apply border-indigo-500 bg-indigo-50 shadow-md;
}

.content-area {
  @apply min-h-[400px] flex items-stretch;
}

.step-content {
  @apply w-full;
}

@media (max-width: 640px) {
  .progress-indicator .step-line {
    @apply w-8;
  }

  .grid {
    @apply grid-cols-1;
  }
}
</style>