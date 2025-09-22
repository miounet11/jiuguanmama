<template>
  <div class="chat-mode-selector">
    <div class="mode-options">
      <div
        v-for="mode in chatModes"
        :key="mode.id"
        @click="selectMode(mode)"
        class="mode-option"
        :class="{ 'selected': selectedMode?.id === mode.id }"
      >
        <div class="mode-icon">
          <el-icon :size="24" :class="mode.iconClass">
            <component :is="mode.icon" />
          </el-icon>
        </div>
        <div class="mode-content">
          <h4 class="mode-title">{{ mode.name }}</h4>
          <p class="mode-description">{{ mode.description }}</p>
          <div class="mode-meta">
            <span class="setup-time">{{ mode.setupTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Rocket, Settings } from '@element-plus/icons-vue'

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
  modelValue?: ChatMode | null
}>()

const emit = defineEmits<{
  'update:modelValue': [mode: ChatMode | null]
  'mode-selected': [mode: ChatMode]
}>()

const selectedMode = ref<ChatMode | null>(props.modelValue || null)

const chatModes: ChatMode[] = [
  {
    id: 'quick',
    name: '快速对话',
    description: '使用智能默认设置，立即开始对话',
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

const selectMode = (mode: ChatMode) => {
  selectedMode.value = mode
  emit('update:modelValue', mode)
  emit('mode-selected', mode)
}
</script>

<style scoped>
.chat-mode-selector {
  @apply w-full;
}

.mode-options {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.mode-option {
  @apply flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200;
}

.mode-option:hover {
  @apply border-indigo-300 shadow-md;
}

.mode-option.selected {
  @apply border-indigo-500 bg-indigo-50 shadow-md;
}

.mode-icon {
  @apply flex-shrink-0 mr-4;
}

.mode-content {
  @apply flex-1;
}

.mode-title {
  @apply text-lg font-medium text-gray-900 mb-1;
}

.mode-description {
  @apply text-sm text-gray-600 mb-2;
}

.mode-meta {
  @apply text-xs text-gray-500;
}

.setup-time {
  @apply font-medium;
}
</style>