<template>
  <div class="settings-dialog-overlay" @click="$emit('close')">
    <div class="settings-dialog" @click.stop>
      <!-- 头部 -->
      <div class="dialog-header">
        <h2 class="dialog-title">
          <TavernIcon name="cog-6-tooth" />
          对话设置
        </h2>
        <TavernButton
          variant="ghost"
          size="sm"
          @click="$emit('close')"
          class="close-btn"
        >
          <TavernIcon name="x-mark" />
        </TavernButton>
      </div>

      <!-- 设置内容 -->
      <div class="dialog-content">
        <!-- AI 模型设置 -->
        <div class="settings-section">
          <h3 class="section-title">
            <TavernIcon name="cpu-chip" />
            AI 模型设置
          </h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">模型选择</label>
              <select v-model="localSettings.model" class="setting-select">
                <option v-for="model in availableModels" :key="model.id" :value="model.id">
                  {{ model.name }}
                </option>
              </select>
            </div>
            <div class="setting-item">
              <label class="setting-label">创造性 ({{ localSettings.temperature }})</label>
              <input
                v-model="localSettings.temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                class="setting-slider"
              />
            </div>
            <div class="setting-item">
              <label class="setting-label">最大长度 ({{ localSettings.maxTokens }})</label>
              <input
                v-model="localSettings.maxTokens"
                type="range"
                min="100"
                max="4000"
                step="100"
                class="setting-slider"
              />
            </div>
          </div>
        </div>

        <!-- 对话行为 -->
        <div class="settings-section">
          <h3 class="section-title">
            <TavernIcon name="chat-bubble-left-right" />
            对话行为
          </h3>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input
                v-model="localSettings.enableStream"
                type="checkbox"
                class="setting-checkbox"
              />
              <span class="checkbox-label">
                <TavernIcon name="arrow-path" size="sm" />
                启用流式响应
              </span>
            </label>
            <label class="checkbox-item">
              <input
                v-model="localSettings.enableTyping"
                type="checkbox"
                class="setting-checkbox"
              />
              <span class="checkbox-label">
                <TavernIcon name="keyboard" size="sm" />
                显示输入指示器
              </span>
            </label>
            <label class="checkbox-item">
              <input
                v-model="localSettings.enableMemory"
                type="checkbox"
                class="setting-checkbox"
              />
              <span class="checkbox-label">
                <TavernIcon name="brain" size="sm" />
                启用长期记忆
              </span>
            </label>
          </div>
        </div>

        <!-- 界面设置 -->
        <div class="settings-section">
          <h3 class="section-title">
            <TavernIcon name="paint-brush" />
            界面设置
          </h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">主题</label>
              <select v-model="localSettings.theme" class="setting-select">
                <option value="dark">深色主题</option>
                <option value="light">浅色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            <div class="setting-item">
              <label class="setting-label">消息字体大小</label>
              <select v-model="localSettings.fontSize" class="setting-select">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="dialog-footer">
        <TavernButton
          variant="outline"
          @click="resetToDefaults"
          class="reset-btn"
        >
          <TavernIcon name="arrow-rotate-left" />
          恢复默认
        </TavernButton>
        <div class="footer-actions">
          <TavernButton
            variant="ghost"
            @click="$emit('close')"
            class="cancel-btn"
          >
            取消
          </TavernButton>
          <TavernButton
            variant="primary"
            @click="saveSettings"
            class="save-btn"
          >
            <TavernIcon name="check" />
            保存设置
          </TavernButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

export interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  enableStream: boolean
  enableTyping: boolean
  enableMemory: boolean
  theme: string
  fontSize: string
}

const props = defineProps({
  settings: {
    type: Object as PropType<ChatSettings>,
    required: true
  }
})

const emit = defineEmits<{
  'save': [settings: ChatSettings]
  'close': []
}>()

const localSettings = ref<ChatSettings>({ ...props.settings })

const availableModels = [
  { id: 'grok-3', name: 'Grok-3' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'claude-3-opus', name: 'Claude-3 Opus' }
]

const saveSettings = () => {
  emit('save', localSettings.value)
  emit('close')
}

const resetToDefaults = () => {
  localSettings.value = {
    model: 'grok-3',
    temperature: 0.7,
    maxTokens: 1000,
    enableStream: true,
    enableTyping: true,
    enableMemory: false,
    theme: 'dark',
    fontSize: 'medium'
  }
}

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.settings-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.settings-dialog {
  background: $dark-bg-secondary;
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .dialog-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.settings-section {
  margin-bottom: 32px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .setting-item {
    .setting-label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      color: $text-secondary;
    }

    .setting-select,
    .setting-slider {
      width: 100%;
    }
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
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

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: $text-secondary;
    }
  }
}

.setting-select {
  padding: 10px 12px;
  background: rgba($gray-900, 0.6);
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 8px;
  color: $text-primary;
  font-size: 13px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: $primary-500;
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
  }
}

.setting-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba($gray-700, 0.5);
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: $primary-500;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid rgba($gray-600, 0.2);
  background: rgba($gray-800, 0.5);

  .footer-actions {
    display: flex;
    gap: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .settings-dialog {
    border-radius: 20px 20px 0 0;
    margin: 0;
  }

  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>