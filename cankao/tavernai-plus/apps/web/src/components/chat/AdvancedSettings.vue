<template>
  <div class="advanced-settings" :class="{ 'compact': compact }">
    <div class="settings-grid" :class="compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'">
      <!-- Top P -->
      <div class="setting-item">
        <label class="setting-label">
          Top P (核采样)
          <el-tooltip
            content="控制AI回复的多样性。值越小，回复越聚焦；值越大，回复越多样化"
            placement="top"
            :show-after="500"
          >
            <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </label>
        <el-slider
          v-model="localSettings.topP"
          @change="emitUpdate"
          :min="0.1"
          :max="1"
          :step="0.1"
          :show-tooltip="false"
          class="mb-2"
        />
        <div class="value-display">当前值: {{ localSettings.topP }}</div>
      </div>

      <!-- Frequency Penalty -->
      <div class="setting-item">
        <label class="setting-label">
          频率惩罚
          <el-tooltip
            content="减少重复内容的出现。值越高，AI越倾向于避免重复之前的表达"
            placement="top"
            :show-after="500"
          >
            <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </label>
        <el-slider
          v-model="localSettings.frequencyPenalty"
          @change="emitUpdate"
          :min="0"
          :max="2"
          :step="0.1"
          :show-tooltip="false"
          class="mb-2"
        />
        <div class="value-display">当前值: {{ localSettings.frequencyPenalty }}</div>
      </div>

      <!-- Presence Penalty -->
      <div class="setting-item">
        <label class="setting-label">
          存在惩罚
          <el-tooltip
            content="鼓励AI引入新话题。值越高，AI越倾向于讨论新的主题"
            placement="top"
            :show-after="500"
          >
            <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </label>
        <el-slider
          v-model="localSettings.presencePenalty"
          @change="emitUpdate"
          :min="0"
          :max="2"
          :step="0.1"
          :show-tooltip="false"
          class="mb-2"
        />
        <div class="value-display">当前值: {{ localSettings.presencePenalty }}</div>
      </div>

      <!-- Stop Sequences -->
      <div class="setting-item">
        <label class="setting-label">
          停止序列
          <el-tooltip
            content="遇到这些文本时AI会停止生成。每行一个序列"
            placement="top"
            :show-after="500"
          >
            <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </label>
        <el-input
          v-model="stopSequencesText"
          @input="handleStopSequencesChange"
          type="textarea"
          :rows="compact ? 2 : 3"
          placeholder="例如：\n[结束]\n###"
          class="w-full"
        />
      </div>
    </div>

    <!-- 角色特定设置 -->
    <div v-if="character && !compact" class="character-specific-settings mt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">角色特定设置</h4>

      <div class="settings-grid grid-cols-1 md:grid-cols-2">
        <!-- 角色一致性 -->
        <div class="setting-item">
          <label class="setting-label">
            角色一致性
            <el-tooltip
              content="确保AI始终保持角色设定。推荐对复杂角色启用"
              placement="top"
              :show-after="500"
            >
              <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <el-switch
            v-model="localSettings.characterConsistency"
            @change="emitUpdate"
            active-text="启用"
            inactive-text="关闭"
          />
        </div>

        <!-- 记忆强度 -->
        <div class="setting-item">
          <label class="setting-label">
            记忆强度
            <el-tooltip
              content="AI对之前对话内容的记忆程度。值越高，越能记住历史对话"
              placement="top"
              :show-after="500"
            >
              <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <el-slider
            v-model="localSettings.memoryStrength"
            @change="emitUpdate"
            :min="0.1"
            :max="1"
            :step="0.1"
            :show-tooltip="false"
            class="mb-2"
          />
          <div class="value-display">当前值: {{ localSettings.memoryStrength }}</div>
        </div>

        <!-- 情感表达 -->
        <div class="setting-item">
          <label class="setting-label">
            情感表达强度
            <el-tooltip
              content="控制角色情感表达的强烈程度"
              placement="top"
              :show-after="500"
            >
              <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <el-slider
            v-model="localSettings.emotionalIntensity"
            @change="emitUpdate"
            :min="0.1"
            :max="1"
            :step="0.1"
            :show-tooltip="false"
            class="mb-2"
          />
          <div class="value-display">当前值: {{ localSettings.emotionalIntensity }}</div>
        </div>

        <!-- 角色专注度 -->
        <div class="setting-item">
          <label class="setting-label">
            角色专注度
            <el-tooltip
              content="AI保持角色设定的严格程度。值越高，越不容易偏离角色"
              placement="top"
              :show-after="500"
            >
              <el-icon class="text-gray-400 cursor-help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </label>
          <el-slider
            v-model="localSettings.characterFocus"
            @change="emitUpdate"
            :min="0.1"
            :max="1"
            :step="0.1"
            :show-tooltip="false"
            class="mb-2"
          />
          <div class="value-display">当前值: {{ localSettings.characterFocus }}</div>
        </div>
      </div>
    </div>

    <!-- 预设模板 -->
    <div v-if="!compact" class="preset-templates mt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">高级预设</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="preset in advancedPresets"
          :key="preset.id"
          @click="applyPreset(preset)"
          class="preset-card cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
          :class="{ 'selected': selectedPreset?.id === preset.id }"
        >
          <div class="flex items-center mb-2">
            <el-icon :class="preset.iconClass" class="mr-2">
              <component :is="preset.icon" />
            </el-icon>
            <span class="font-medium text-sm">{{ preset.name }}</span>
          </div>
          <div class="text-xs text-gray-500">{{ preset.description }}</div>
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="reset-section mt-4 pt-4 border-t border-gray-200">
      <el-button
        @click="resetToDefaults"
        size="small"
        type="info"
        plain
      >
        重置为默认值
      </el-button>
      <span class="text-xs text-gray-500 ml-2">
        恢复推荐的高级设置参数
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { QuestionFilled, Star, Cpu, Rocket } from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  tags?: string[]
  isNSFW?: boolean
}

interface AdvancedPreset {
  id: string
  name: string
  description: string
  icon: any
  iconClass: string
  settings: Record<string, any>
}

const props = withDefaults(defineProps<{
  settings: Record<string, any>
  character?: Character | null
  compact?: boolean
}>(), {
  compact: false
})

const emit = defineEmits<{
  'update:settings': [settings: Record<string, any>]
}>()

// 本地设置状态
const localSettings = ref<Record<string, any>>({
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  characterConsistency: true,
  memoryStrength: 0.7,
  emotionalIntensity: 0.6,
  characterFocus: 0.8
})

// 停止序列文本
const stopSequencesText = ref('')
const selectedPreset = ref<AdvancedPreset | null>(null)

// 高级预设
const advancedPresets: AdvancedPreset[] = [
  {
    id: 'creative',
    name: '创意写作',
    description: '适合创意写作和故事创作',
    icon: Star,
    iconClass: 'text-purple-500',
    settings: {
      topP: 0.9,
      frequencyPenalty: 0.3,
      presencePenalty: 0.6,
      characterConsistency: false,
      memoryStrength: 0.5,
      emotionalIntensity: 0.8,
      characterFocus: 0.6
    }
  },
  {
    id: 'consistent',
    name: '角色一致',
    description: '保持角色高度一致性',
    icon: Cpu,
    iconClass: 'text-blue-500',
    settings: {
      topP: 0.8,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      characterConsistency: true,
      memoryStrength: 0.9,
      emotionalIntensity: 0.7,
      characterFocus: 0.9
    }
  },
  {
    id: 'dynamic',
    name: '动态对话',
    description: '富有变化的动态对话',
    icon: Rocket,
    iconClass: 'text-green-500',
    settings: {
      topP: 0.95,
      frequencyPenalty: 0.5,
      presencePenalty: 0.8,
      characterConsistency: true,
      memoryStrength: 0.6,
      emotionalIntensity: 0.9,
      characterFocus: 0.7
    }
  }
]

// 默认设置
const defaultSettings = {
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  characterConsistency: true,
  memoryStrength: 0.7,
  emotionalIntensity: 0.6,
  characterFocus: 0.8
}

// 方法
const emitUpdate = () => {
  emit('update:settings', localSettings.value)
}

const handleStopSequencesChange = () => {
  const sequences = stopSequencesText.value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  localSettings.value.stopSequences = sequences
  emitUpdate()
}

const applyPreset = (preset: AdvancedPreset) => {
  selectedPreset.value = preset
  Object.assign(localSettings.value, preset.settings)
  emitUpdate()
}

const resetToDefaults = () => {
  localSettings.value = { ...defaultSettings }
  stopSequencesText.value = ''
  selectedPreset.value = null
  emitUpdate()
}

// 根据角色特征智能调整
const applyCharacterSpecificDefaults = () => {
  if (!props.character) return

  const character = props.character
  let smartSettings = { ...defaultSettings }

  // 根据角色标签调整
  if (character.tags?.includes('creative') || character.tags?.includes('artistic')) {
    smartSettings = { ...smartSettings, ...advancedPresets[0].settings }
    selectedPreset.value = advancedPresets[0]
  } else if (character.tags?.includes('consistent') || character.tags?.includes('serious')) {
    smartSettings = { ...smartSettings, ...advancedPresets[1].settings }
    selectedPreset.value = advancedPresets[1]
  } else if (character.tags?.includes('dynamic') || character.tags?.includes('energetic')) {
    smartSettings = { ...smartSettings, ...advancedPresets[2].settings }
    selectedPreset.value = advancedPresets[2]
  }

  // NSFW角色调整
  if (character.isNSFW) {
    smartSettings.emotionalIntensity = 0.8
    smartSettings.characterFocus = 0.7
  }

  localSettings.value = smartSettings
  emitUpdate()
}

// 监听器
watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    localSettings.value = { ...localSettings.value, ...newSettings }

    // 更新停止序列文本
    if (newSettings.stopSequences && Array.isArray(newSettings.stopSequences)) {
      stopSequencesText.value = newSettings.stopSequences.join('\n')
    }
  }
}, { immediate: true, deep: true })

watch(() => props.character, () => {
  if (props.character) {
    applyCharacterSpecificDefaults()
  }
}, { immediate: true })

// 初始化
onMounted(() => {
  if (props.character) {
    applyCharacterSpecificDefaults()
  }
})
</script>

<style scoped>
.advanced-settings {
  @apply space-y-4;
}

.settings-grid {
  @apply grid gap-4;
}

.setting-item {
  @apply space-y-2;
}

.setting-label {
  @apply flex items-center text-sm font-medium text-gray-700;
}

.value-display {
  @apply text-xs text-gray-500;
}

.preset-card.selected {
  @apply border-indigo-500 bg-indigo-50 shadow-sm;
}

.compact .settings-grid {
  @apply gap-3;
}

.compact .setting-item {
  @apply space-y-1;
}

.compact .setting-label {
  @apply text-xs;
}

.reset-section {
  @apply flex items-center;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .settings-grid {
    @apply grid-cols-1;
  }
}
</style>