<template>
  <aside class="control-panel" :class="panelClasses">
    <!-- 折叠按钮 -->
    <TavernButton
      v-if="!isMobile"
      variant="ghost"
      size="sm"
      @click="toggleCollapse"
      class="collapse-toggle"
      :title="collapsed ? '展开控制面板' : '折叠控制面板'"
    >
      <TavernIcon :name="collapsed ? 'chevron-left' : 'chevron-right'" />
    </TavernButton>

    <!-- 移动端关闭按钮 -->
    <TavernButton
      v-if="isMobile"
      variant="ghost"
      size="sm"
      @click="$emit('close')"
      class="mobile-close"
    >
      <TavernIcon name="x-mark" />
    </TavernButton>

    <!-- 控制面板内容 -->
    <div class="control-content" :class="{ 'content-collapsed': collapsed }">
      <!-- 模式选择器 -->
      <div v-if="!collapsed" class="mode-selector">
        <h3 class="section-title">
          <TavernIcon name="cog-6-tooth" size="xs" />
          对话模式
        </h3>
        <div class="mode-options">
          <button
            v-for="mode in chatModes"
            :key="mode.id"
            @click="selectMode(mode.id)"
            :class="['mode-btn', { 'mode-active': currentMode === mode.id }]"
            :title="mode.description"
          >
            <TavernIcon :name="mode.icon" />
            <span>{{ mode.name }}</span>
          </button>
        </div>
      </div>

      <!-- AI 模型设置 -->
      <div v-if="!collapsed" class="ai-settings">
        <h3 class="section-title">
          <TavernIcon name="cpu-chip" size="xs" />
          AI 模型设置
        </h3>

        <!-- 模型选择 -->
        <div class="setting-group">
          <label class="setting-label">模型选择</label>
          <select v-model="localSettings.model" @change="handleSettingChange" class="setting-select">
            <option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }} ({{ model.provider }})
            </option>
          </select>
          <div class="model-info">
            <span class="model-provider">{{ currentModel?.provider }}</span>
            <span class="model-capability">{{ currentModel?.capability }}</span>
          </div>
        </div>

        <!-- 创造性滑块 -->
        <div class="setting-group">
          <div class="setting-header">
            <label class="setting-label">创造性</label>
            <span class="setting-value">{{ localSettings.temperature.toFixed(1) }}</span>
          </div>
          <input
            v-model="localSettings.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            @input="handleSettingChange"
            class="setting-slider"
          />
          <div class="slider-labels">
            <span>保守</span>
            <span>平衡</span>
            <span>创新</span>
          </div>
        </div>

        <!-- 最大长度滑块 -->
        <div class="setting-group">
          <div class="setting-header">
            <label class="setting-label">最大长度</label>
            <span class="setting-value">{{ localSettings.maxTokens }}</span>
          </div>
          <input
            v-model="localSettings.maxTokens"
            type="range"
            min="100"
            max="4000"
            step="100"
            @input="handleSettingChange"
            class="setting-slider"
          />
          <div class="slider-labels">
            <span>简短</span>
            <span>中等</span>
            <span>详细</span>
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="setting-group">
          <div class="checkbox-options">
            <label class="checkbox-label">
              <input
                v-model="localSettings.enableStream"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="checkbox-content">
                <TavernIcon name="arrow-path" size="xs" />
                <span>流式响应</span>
              </span>
            </label>

            <label class="checkbox-label">
              <input
                v-model="localSettings.enableTyping"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="checkbox-content">
                <TavernIcon name="keyboard" size="xs" />
                <span>输入指示器</span>
              </span>
            </label>

            <label class="checkbox-label">
              <input
                v-model="localSettings.enableMemory"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="checkbox-content">
                <TavernIcon name="brain" size="xs" />
                <span>长期记忆</span>
              </span>
            </label>

            <label class="checkbox-label">
              <input
                v-model="localSettings.enableContext"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="checkbox-content">
                <TavernIcon name="document-text" size="xs" />
                <span>上下文保持</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- 系统提示词 -->
      <div v-if="!collapsed && currentMode === 'professional'" class="system-prompt">
        <h3 class="section-title">
          <TavernIcon name="command-line" size="xs" />
          系统提示词
        </h3>
        <div class="prompt-editor">
          <textarea
            v-model="localSettings.systemPrompt"
            @input="handleSettingChange"
            placeholder="输入自定义系统提示词..."
            class="prompt-textarea"
            rows="4"
          />
          <div class="prompt-actions">
            <TavernButton
              variant="ghost"
              size="xs"
              @click="resetSystemPrompt"
              title="重置为默认"
            >
              <TavernIcon name="arrow-rotate-left" size="xs" />
              重置
            </TavernButton>
            <TavernButton
              variant="ghost"
              size="xs"
              @click="saveSystemPrompt"
              title="保存模板"
            >
              <TavernIcon name="bookmark" size="xs" />
              保存
            </TavernButton>
          </div>
        </div>
      </div>

      <!-- 对话设置 -->
      <div v-if="!collapsed" class="conversation-settings">
        <h3 class="section-title">
          <TavernIcon name="chat-bubble-left-right" size="xs" />
          对话设置
        </h3>

        <div class="setting-group">
          <label class="setting-label">对话风格</label>
          <select v-model="localSettings.conversationStyle" @change="handleSettingChange" class="setting-select">
            <option value="casual">轻松随意</option>
            <option value="formal">正式礼貌</option>
            <option value="friendly">友好亲切</option>
            <option value="professional">专业严谨</option>
            <option value="creative">创意丰富</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="setting-label">回复长度偏好</label>
          <select v-model="localSettings.responseLength" @change="handleSettingChange" class="setting-select">
            <option value="concise">简洁</option>
            <option value="balanced">平衡</option>
            <option value="detailed">详细</option>
            <option value="comprehensive">全面</option>
          </select>
        </div>

        <div class="setting-group">
          <label class="setting-label">语言偏好</label>
          <select v-model="localSettings.language" @change="handleSettingChange" class="setting-select">
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁体中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
            <option value="ko-KR">한국어</option>
          </select>
        </div>
      </div>

      <!-- 快捷设置 -->
      <div v-if="!collapsed" class="quick-presets">
        <h3 class="section-title">
          <TavernIcon name="bolt" size="xs" />
          快捷预设
        </h3>
        <div class="presets-grid">
          <button
            v-for="preset in quickPresets"
            :key="preset.id"
            @click="applyPreset(preset)"
            :class="['preset-btn', { 'preset-active': isPresetActive(preset) }]"
            :title="preset.description"
          >
            <TavernIcon :name="preset.icon" />
            <span>{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <!-- 高级功能 -->
      <div v-if="!collapsed && currentMode === 'professional'" class="advanced-features">
        <h3 class="section-title">
          <TavernIcon name="wrench-screwdriver" size="xs" />
          高级功能
        </h3>

        <div class="feature-grid">
          <div class="feature-item">
            <label class="checkbox-label">
              <input
                v-model="localSettings.enableAnalysis"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="feature-content">
                <TavernIcon name="chart-line" size="xs" />
                <div class="feature-info">
                  <span class="feature-name">对话分析</span>
                  <span class="feature-desc">分析对话模式和趋势</span>
                </div>
              </span>
            </label>
          </div>

          <div class="feature-item">
            <label class="checkbox-label">
              <input
                v-model="localSettings.enableAutoComplete"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="feature-content">
                <TavernIcon name="sparkles" size="xs" />
                <div class="feature-info">
                  <span class="feature-name">智能补全</span>
                  <span class="feature-desc">预测性文本建议</span>
                </div>
              </span>
            </label>
          </div>

          <div class="feature-item">
            <label class="checkbox-label">
              <input
                v-model="localSettings.enableTranslation"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="feature-content">
                <TavernIcon name="language" size="xs" />
                <div class="feature-info">
                  <span class="feature-name">实时翻译</span>
                  <span class="feature-desc">多语言自动翻译</span>
                </div>
              </span>
            </label>
          </div>

          <div class="feature-item">
            <label class="checkbox-label">
              <input
                v-model="localSettings.enableSummarization"
                type="checkbox"
                @change="handleSettingChange"
                class="setting-checkbox"
              />
              <span class="feature-content">
                <TavernIcon name="document-text" size="xs" />
                <div class="feature-info">
                  <span class="feature-name">对话总结</span>
                  <span class="feature-desc">自动生成对话摘要</span>
                </div>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- 使用统计 -->
      <div v-if="!collapsed && usageStats" class="usage-stats">
        <h3 class="section-title">
          <TavernIcon name="chart-bar" size="xs" />
          使用统计
        </h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <TavernIcon name="fire" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ usageStats.tokensUsed || 0 }}</span>
              <span class="stat-label">Token使用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <TavernIcon name="clock" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ usageStats.responseTime || 0 }}ms</span>
              <span class="stat-label">平均响应</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <TavernIcon name="currency-dollar" />
            </div>
            <div class="stat-content">
              <span class="stat-value">${{ usageStats.cost || 0.00 }}</span>
              <span class="stat-label">预估费用</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 展开状态下的简化控制 -->
    <div v-if="collapsed && !isMobile" class="collapsed-controls">
      <div class="quick-mode-toggle">
        <TavernButton
          variant="ghost"
          size="sm"
          @click="toggleQuickMode"
          :title="quickMode ? '退出快速模式' : '进入快速模式'"
          class="quick-mode-btn"
        >
          <TavernIcon :name="quickMode ? 'bolt' : 'cog-6-tooth'" />
        </TavernButton>
      </div>
    </div>

    <!-- 底部信息 -->
    <div v-if="!collapsed && !isMobile" class="panel-footer">
      <div class="footer-info">
        <span class="settings-status">设置已同步</span>
        <span class="last-sync">{{ formatTime(lastSync) }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

// 类型定义
export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  enableStream: boolean
  enableTyping: boolean
  enableMemory: boolean
  enableContext: boolean
  systemPrompt?: string
  conversationStyle: 'casual' | 'formal' | 'friendly' | 'professional' | 'creative'
  responseLength: 'concise' | 'balanced' | 'detailed' | 'comprehensive'
  language: string
  enableAnalysis?: boolean
  enableAutoComplete?: boolean
  enableTranslation?: boolean
  enableSummarization?: boolean
}

export interface UsageStats {
  tokensUsed: number
  responseTime: number
  cost: number
}

export interface Model {
  id: string
  name: string
  provider: string
  capability: string
  maxTokens: number
}

// Props
const props = defineProps({
  settings: {
    type: Object as PropType<ChatSettings>,
    required: true
  },
  currentMode: {
    type: String,
    default: 'basic'
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  usageStats: {
    type: Object as PropType<UsageStats>,
    default: null
  },
  availableModels: {
    type: Array as PropType<Model[]>,
    default: () => []
  }
})

// Emits
const emit = defineEmits<{
  'toggle-collapse': []
  'settings-change': [settings: Partial<ChatSettings>]
  'mode-change': [mode: string]
  'close': []
}>()

// 响应式数据
const localSettings = ref<ChatSettings>({ ...props.settings })
const quickMode = ref(false)
const lastSync = ref(new Date())

// 聊天模式定义
const chatModes = [
  {
    id: 'basic',
    name: '基础',
    icon: 'chat-bubble-left-right',
    description: '简单直接的对话体验'
  },
  {
    id: 'advanced',
    name: '进阶',
    icon: 'adjustments-horizontal',
    description: '更多自定义选项和控制'
  },
  {
    id: 'professional',
    name: '专业',
    icon: 'academic-cap',
    description: '完整的专业级功能和设置'
  }
]

// 快捷预设
const quickPresets = [
  {
    id: 'creative',
    name: '创意模式',
    icon: 'sparkles',
    description: '高创造性，适合创意写作',
    settings: {
      temperature: 1.2,
      maxTokens: 2000,
      conversationStyle: 'creative'
    }
  },
  {
    id: 'balanced',
    name: '平衡模式',
    icon: 'scale-balanced',
    description: '平衡的创造性和准确性',
    settings: {
      temperature: 0.7,
      maxTokens: 1000,
      conversationStyle: 'friendly'
    }
  },
  {
    id: 'precise',
    name: '精确模式',
    icon: 'crosshairs',
    description: '低创造性，高准确性',
    settings: {
      temperature: 0.3,
      maxTokens: 1500,
      conversationStyle: 'professional'
    }
  },
  {
    id: 'efficient',
    name: '高效模式',
    icon: 'rocket-launch',
    description: '快速响应，节省Token',
    settings: {
      temperature: 0.5,
      maxTokens: 500,
      conversationStyle: 'casual'
    }
  }
]

// 计算属性
const panelClasses = computed(() => [
  'control-panel',
  {
    'panel-collapsed': props.collapsed,
    'panel-mobile': props.isMobile,
    'quick-mode': quickMode.value
  }
])

const currentModel = computed(() => {
  return props.availableModels.find(model => model.id === localSettings.value.model)
})

// 方法
const toggleCollapse = () => {
  emit('toggle-collapse')
}

const selectMode = (modeId: string) => {
  emit('mode-change', modeId)
}

const handleSettingChange = () => {
  emit('settings-change', localSettings.value)
  lastSync.value = new Date()
}

const toggleQuickMode = () => {
  quickMode.value = !quickMode.value
}

const applyPreset = (preset: any) => {
  Object.assign(localSettings.value, preset.settings)
  handleSettingChange()
}

const isPresetActive = (preset: any) => {
  const settings = preset.settings
  return Object.keys(settings).every(key =>
    localSettings.value[key as keyof ChatSettings] === settings[key]
  )
}

const resetSystemPrompt = () => {
  localSettings.value.systemPrompt = ''
  handleSettingChange()
}

const saveSystemPrompt = () => {
  // 保存系统提示词到模板
  handleSettingChange()
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听器
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

watch(() => props.currentMode, (newMode) => {
  // 根据模式调整设置
  switch (newMode) {
    case 'basic':
      localSettings.value.enableAnalysis = false
      localSettings.value.enableAutoComplete = false
      break
    case 'advanced':
      localSettings.value.enableAutoComplete = true
      break
    case 'professional':
      localSettings.value.enableAnalysis = true
      localSettings.value.enableAutoComplete = true
      localSettings.value.enableTranslation = true
      localSettings.value.enableSummarization = true
      break
  }
  handleSettingChange()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.control-panel {
  position: relative;
  background: rgba($dark-bg-secondary, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($primary-500, 0.1);
  border-radius: 20px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &.panel-collapsed {
    padding: 12px;
    width: 80px;
    min-width: 80px;

    .control-content {
      display: none;
    }

    .collapsed-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .panel-footer {
      display: none;
    }
  }

  &.panel-mobile {
    border-radius: 20px 20px 0 0;
    max-height: 80vh;
    overflow-y: auto;

    .control-content {
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    }
  }

  &.quick-mode {
    background: rgba($primary-900, 0.95);
    border-color: rgba($primary-500, 0.3);
  }
}

.collapse-toggle,
.mobile-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba($gray-700, 0.2);
  border: 1px solid rgba($gray-600, 0.3);
  color: $text-tertiary;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($gray-700, 0.3);
    color: $text-secondary;
    transform: scale(1.05);
  }
}

.control-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: all 0.3s ease;

  &.content-collapsed {
    opacity: 0;
    transform: translateX(20px);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

// 模式选择器
.mode-selector {
  .mode-options {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;

      &:hover {
        background: rgba($gray-700, 0.3);
        color: $text-primary;
        transform: translateX(4px);
      }

      &.mode-active {
        background: rgba($primary-500, 0.2);
        border-color: rgba($primary-500, 0.4);
        color: $primary-300;
        box-shadow: 0 0 0 1px rgba($primary-500, 0.2);
      }
    }
  }
}

// AI 设置
.ai-settings {
  .setting-group {
    margin-bottom: 20px;

    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .setting-label {
        font-size: 13px;
        font-weight: 500;
        color: $text-secondary;
      }

      .setting-value {
        font-size: 12px;
        color: $primary-400;
        font-weight: 600;
        font-family: $font-mono;
      }
    }

    .setting-select {
      width: 100%;
      padding: 10px 12px;
      background: rgba($gray-900, 0.6);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 10px;
      color: $text-primary;
      font-size: 13px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: $primary-500;
        box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
      }
    }

    .model-info {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 11px;
      color: $text-tertiary;

      .model-provider {
        background: rgba($primary-500, 0.1);
        padding: 2px 6px;
        border-radius: 6px;
      }

      .model-capability {
        background: rgba($success-color, 0.1);
        color: $success-color;
        padding: 2px 6px;
        border-radius: 6px;
      }
    }

    .setting-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba($gray-700, 0.5);
      outline: none;
      -webkit-appearance: none;
      margin: 12px 0;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-500;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.2);
          box-shadow: 0 0 8px rgba($primary-500, 0.4);
        }
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-500;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.2);
          box-shadow: 0 0 8px rgba($primary-500, 0.4);
        }
      }
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 10px;
      color: $text-tertiary;
    }

    .checkbox-options {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 8px 12px;
        background: rgba($gray-700, 0.2);
        border: 1px solid rgba($gray-600, 0.3);
        border-radius: 10px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($gray-700, 0.3);
        }

        .setting-checkbox {
          width: 16px;
          height: 16px;
          accent-color: $primary-500;
        }

        .checkbox-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: $text-secondary;
          flex: 1;
        }
      }
    }
  }
}

// 系统提示词
.system-prompt {
  .prompt-editor {
    .prompt-textarea {
      width: 100%;
      padding: 12px;
      background: rgba($gray-900, 0.6);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 10px;
      color: $text-primary;
      font-size: 13px;
      font-family: $font-mono;
      resize: vertical;
      min-height: 80px;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: $primary-500;
        box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
      }

      &::placeholder {
        color: $text-muted;
        font-style: italic;
      }
    }

    .prompt-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  }
}

// 对话设置
.conversation-settings {
  .setting-group {
    margin-bottom: 16px;

    .setting-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: $text-secondary;
    }
  }
}

// 快捷预设
.quick-presets {
  .presets-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    .preset-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 8px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;

      &:hover {
        background: rgba($gray-700, 0.3);
        color: $text-primary;
        transform: translateY(-2px);
      }

      &.preset-active {
        background: rgba($primary-500, 0.2);
        border-color: rgba($primary-500, 0.4);
        color: $primary-300;
      }
    }
  }
}

// 高级功能
.advanced-features {
  .feature-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .feature-item {
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
        padding: 12px;
        background: rgba($gray-700, 0.2);
        border: 1px solid rgba($gray-600, 0.3);
        border-radius: 12px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($gray-700, 0.3);
        }

        .setting-checkbox {
          width: 16px;
          height: 16px;
          accent-color: $primary-500;
          margin-top: 2px;
        }

        .feature-content {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          flex: 1;

          .feature-info {
            flex: 1;

            .feature-name {
              display: block;
              font-size: 13px;
              font-weight: 500;
              color: $text-secondary;
              margin-bottom: 2px;
            }

            .feature-desc {
              font-size: 11px;
              color: $text-tertiary;
              line-height: 1.3;
            }
          }
        }
      }
    }
  }
}

// 使用统计
.usage-stats {
  .stats-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;

      .stat-icon {
        width: 32px;
        height: 32px;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $primary-400;
        flex-shrink: 0;
      }

      .stat-content {
        flex: 1;

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: $text-tertiary;
          margin-top: 2px;
        }
      }
    }
  }
}

// 折叠状态控制
.collapsed-controls {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .quick-mode-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba($primary-500, 0.1);
    border: 1px solid rgba($primary-500, 0.2);
    color: $primary-400;

    &:hover {
      background: rgba($primary-500, 0.2);
      transform: scale(1.05);
    }
  }
}

// 底部信息
.panel-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba($gray-600, 0.2);

  .footer-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: $text-tertiary;

    .settings-status {
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $success-color;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .control-panel {
    border-radius: 20px 20px 0 0;
    padding: 16px;

    .quick-presets .presets-grid {
      grid-template-columns: 1fr;
    }

    .usage-stats .stats-grid {
      .stat-item {
        padding: 10px;
      }
    }
  }
}

// 动画
.control-panel {
  animation: panelSlideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .control-panel,
  .mode-btn,
  .setting-select,
  .setting-slider,
  .preset-btn,
  .checkbox-label {
    transition: none;
  }

  @keyframes panelSlideIn {
    display: none;
  }
}
</style>