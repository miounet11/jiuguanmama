<template>
  <div class="conversation-quick-setup">
    <h3 class="text-lg font-semibold mb-4">对话设置</h3>

    <!-- 选择的角色信息 -->
    <div class="selected-character mb-6 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-4">
        <img
          v-if="character?.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="w-16 h-16 rounded-full object-cover"
        />
        <div
          v-else
          class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xl"
        >
          {{ character?.name?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1">
          <h4 class="font-medium text-gray-900">{{ character?.name }}</h4>
          <p class="text-sm text-gray-600 line-clamp-2">{{ character?.description }}</p>
          <div class="flex items-center mt-1 text-xs text-gray-500">
            <span>模式: {{ mode?.name }}</span>
            <span class="mx-1">·</span>
            <span>{{ character?.chatCount || 0 }}次对话</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速模式 - 显示当前设置 -->
    <div v-if="mode?.id === 'quick'" class="quick-mode-settings">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex items-center mb-2">
          <el-icon class="text-blue-500 mr-2"><Rocket /></el-icon>
          <span class="font-medium text-blue-800">快速模式已启用</span>
        </div>
        <p class="text-sm text-blue-700 mb-3">
          系统已根据角色特征智能选择最佳设置，您可以立即开始对话
        </p>

        <!-- 当前设置预览 -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">AI模型:</span>
            <span class="ml-2 font-medium">{{ currentSettings.model || 'GPT-3.5' }}</span>
          </div>
          <div>
            <span class="text-gray-600">创造性:</span>
            <span class="ml-2 font-medium">{{ getCreativityLevel(currentSettings.temperature) }}</span>
          </div>
          <div>
            <span class="text-gray-600">回复长度:</span>
            <span class="ml-2 font-medium">{{ getResponseLength(currentSettings.maxTokens) }}</span>
          </div>
          <div>
            <span class="text-gray-600">预计响应:</span>
            <span class="ml-2 font-medium">2-5秒</span>
          </div>
        </div>
      </div>

      <!-- 可选微调 -->
      <el-collapse v-model="activeCollapse" class="mt-4">
        <el-collapse-item title="高级微调 (可选)" name="advanced">
          <AdvancedSettings
            :settings="currentSettings"
            :character="character"
            @update:settings="handleSettingsUpdate"
            compact
          />
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 自定义模式 - 详细设置 -->
    <div v-else-if="mode?.id === 'custom'" class="custom-mode-settings">
      <el-tabs v-model="activeTab" type="card" class="settings-tabs">
        <!-- AI模型设置 -->
        <el-tab-pane label="AI模型" name="model">
          <div class="settings-section">
            <div class="setting-item">
              <label class="setting-label">选择AI模型</label>
              <el-select
                v-model="currentSettings.model"
                @change="handleSettingsUpdate"
                class="w-full"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                >
                  <div class="flex justify-between items-center w-full">
                    <span>{{ model.label }}</span>
                    <el-tag
                      :type="model.tier === 'premium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ model.tier === 'premium' ? '高级' : '标准' }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
              <div class="text-sm text-gray-500 mt-1">
                不同模型有不同的响应风格和能力
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 对话参数 -->
        <el-tab-pane label="对话参数" name="parameters">
          <div class="settings-section space-y-6">
            <!-- 创造性 -->
            <div class="setting-item">
              <label class="setting-label">
                创造性
                <span class="text-sm font-normal text-gray-500">
                  ({{ getCreativityLevel(currentSettings.temperature) }})
                </span>
              </label>
              <el-slider
                v-model="currentSettings.temperature"
                @change="handleSettingsUpdate"
                :min="0"
                :max="1"
                :step="0.1"
                :marks="temperatureMarks"
                class="mb-2"
              />
              <div class="text-sm text-gray-500">
                数值越高，回复越有创意但可能不太稳定
              </div>
            </div>

            <!-- 回复长度 -->
            <div class="setting-item">
              <label class="setting-label">
                最大回复长度
                <span class="text-sm font-normal text-gray-500">
                  ({{ getResponseLength(currentSettings.maxTokens) }})
                </span>
              </label>
              <el-slider
                v-model="currentSettings.maxTokens"
                @change="handleSettingsUpdate"
                :min="100"
                :max="4000"
                :step="100"
                :marks="tokenMarks"
                class="mb-2"
              />
              <div class="text-sm text-gray-500">
                控制AI每次回复的最大长度
              </div>
            </div>

            <!-- 其他参数 -->
            <el-collapse v-model="advancedCollapse">
              <el-collapse-item title="高级参数" name="advanced">
                <AdvancedSettings
                  :settings="currentSettings"
                  :character="character"
                  @update:settings="handleSettingsUpdate"
                />
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <!-- 个性化设置 -->
        <el-tab-pane label="个性化" name="personality">
          <div class="settings-section space-y-6">
            <!-- 系统提示词 -->
            <div class="setting-item">
              <label class="setting-label">自定义系统提示</label>
              <el-input
                v-model="currentSettings.systemPrompt"
                @input="handleSettingsUpdate"
                type="textarea"
                :rows="4"
                placeholder="例如：请扮演一个友善、耐心的助手..."
                class="w-full"
              />
              <div class="text-sm text-gray-500 mt-1">
                自定义AI的行为方式和回复风格
              </div>
            </div>

            <!-- 对话风格预设 -->
            <div class="setting-item">
              <label class="setting-label">对话风格预设</label>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="style in conversationStyles"
                  :key="style.id"
                  @click="applyConversationStyle(style)"
                  class="style-card cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                  :class="{ 'selected': selectedStyle?.id === style.id }"
                >
                  <div class="font-medium text-sm">{{ style.name }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ style.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 设置预览和确认 -->
    <div class="settings-preview mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium mb-3">设置预览</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-600">模型:</span>
          <div class="font-medium">{{ getModelDisplayName(currentSettings.model) }}</div>
        </div>
        <div>
          <span class="text-gray-600">创造性:</span>
          <div class="font-medium">{{ getCreativityLevel(currentSettings.temperature) }}</div>
        </div>
        <div>
          <span class="text-gray-600">长度:</span>
          <div class="font-medium">{{ getResponseLength(currentSettings.maxTokens) }}</div>
        </div>
        <div>
          <span class="text-gray-600">风格:</span>
          <div class="font-medium">{{ selectedStyle?.name || '默认' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Rocket } from '@element-plus/icons-vue'
import AdvancedSettings from './AdvancedSettings.vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  tags?: string[]
  isNSFW?: boolean
}

interface ChatMode {
  id: string
  name: string
  defaultSettings: Record<string, any>
}

interface ConversationStyle {
  id: string
  name: string
  description: string
  settings: Record<string, any>
}

const props = defineProps<{
  character?: Character | null
  mode?: ChatMode | null
}>()

const emit = defineEmits<{
  'settings-change': [settings: Record<string, any>]
}>()

// 基础状态
const activeTab = ref('model')
const activeCollapse = ref('')
const advancedCollapse = ref('')
const selectedStyle = ref<ConversationStyle | null>(null)

// 当前设置
const currentSettings = ref<Record<string, any>>({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: ''
})

// 可用模型
const availableModels = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', tier: 'standard' },
  { value: 'gpt-4', label: 'GPT-4', tier: 'premium' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', tier: 'premium' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', tier: 'standard' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', tier: 'premium' },
  { value: 'gemini-pro', label: 'Gemini Pro', tier: 'standard' }
]

// 对话风格预设
const conversationStyles: ConversationStyle[] = [
  {
    id: 'friendly',
    name: '友善亲切',
    description: '温暖友好，贴近生活',
    settings: {
      temperature: 0.8,
      systemPrompt: '请以友善、温暖的语气回复，像老朋友一样聊天。'
    }
  },
  {
    id: 'professional',
    name: '专业严谨',
    description: '正式专业，逻辑清晰',
    settings: {
      temperature: 0.3,
      systemPrompt: '请以专业、严谨的态度回复，保持逻辑清晰和准确性。'
    }
  },
  {
    id: 'creative',
    name: '创意无限',
    description: '富有想象力和创造性',
    settings: {
      temperature: 0.9,
      systemPrompt: '请发挥创意和想象力，提供有趣、新颖的回复。'
    }
  },
  {
    id: 'casual',
    name: '轻松随性',
    description: '随意放松，不拘一格',
    settings: {
      temperature: 0.7,
      systemPrompt: '请以轻松随意的语气回复，保持对话的轻松愉快。'
    }
  }
]

// 滑块标记
const temperatureMarks = {
  0: '保守',
  0.5: '平衡',
  1: '创意'
}

const tokenMarks = {
  100: '简短',
  1000: '适中',
  2000: '详细',
  4000: '长篇'
}

// 计算属性
const getCreativityLevel = (temperature: number): string => {
  if (temperature <= 0.3) return '保守'
  if (temperature <= 0.6) return '平衡'
  if (temperature <= 0.8) return '创意'
  return '极富创意'
}

const getResponseLength = (maxTokens: number): string => {
  if (maxTokens <= 500) return '简短'
  if (maxTokens <= 1500) return '适中'
  if (maxTokens <= 3000) return '详细'
  return '长篇'
}

const getModelDisplayName = (model: string): string => {
  const modelInfo = availableModels.find(m => m.value === model)
  return modelInfo?.label || model
}

// 方法
const handleSettingsUpdate = () => {
  emit('settings-change', currentSettings.value)
}

const applyConversationStyle = (style: ConversationStyle) => {
  selectedStyle.value = style
  Object.assign(currentSettings.value, style.settings)
  handleSettingsUpdate()
}

// 智能默认设置
const applySmartDefaults = () => {
  if (!props.character) return

  const character = props.character
  let smartSettings = { ...currentSettings.value }

  // 根据角色标签调整设置
  if (character.tags?.includes('creative') || character.tags?.includes('artistic')) {
    smartSettings.temperature = 0.9
    smartSettings.model = 'gpt-4'
    selectedStyle.value = conversationStyles.find(s => s.id === 'creative') || null
  } else if (character.tags?.includes('professional') || character.tags?.includes('business')) {
    smartSettings.temperature = 0.3
    smartSettings.model = 'gpt-4'
    selectedStyle.value = conversationStyles.find(s => s.id === 'professional') || null
  } else if (character.tags?.includes('casual') || character.tags?.includes('friendly')) {
    smartSettings.temperature = 0.7
    selectedStyle.value = conversationStyles.find(s => s.id === 'friendly') || null
  }

  // NSFW角色特殊处理
  if (character.isNSFW) {
    smartSettings.temperature = 0.8
    smartSettings.maxTokens = 1500
  }

  // 应用智能设置
  currentSettings.value = smartSettings
  handleSettingsUpdate()
}

// 监听器
watch(() => props.mode, (newMode) => {
  if (newMode?.defaultSettings) {
    currentSettings.value = { ...currentSettings.value, ...newMode.defaultSettings }
    handleSettingsUpdate()
  }
}, { immediate: true })

watch(() => props.character, () => {
  applySmartDefaults()
}, { immediate: true })

// 初始化
onMounted(() => {
  applySmartDefaults()
})
</script>

<style scoped>
.setting-item {
  @apply space-y-2;
}

.setting-label {
  @apply block text-sm font-medium text-gray-700;
}

.settings-section {
  @apply p-4;
}

.style-card.selected {
  @apply border-indigo-500 bg-indigo-50 shadow-sm;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.settings-tabs {
  @apply mb-4;
}

.settings-tabs :deep(.el-tabs__content) {
  @apply pt-4;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .grid {
    @apply grid-cols-1;
  }

  .settings-tabs :deep(.el-tabs__nav) {
    @apply text-sm;
  }
}
</style>