<template>
  <div class="chat-voice-features">
    <!-- 语音输入按钮 -->
    <div class="voice-input-section" v-if="showVoiceInput">
      <el-button
        v-if="!isRecording"
        type="primary"
        circle
        size="large"
        @click="startVoiceInput"
        :disabled="!canUseVoice"
        class="voice-input-button"
        title="点击开始语音输入"
      >
        <el-icon size="20"><Microphone /></el-icon>
      </el-button>

      <el-button
        v-else
        type="danger"
        circle
        size="large"
        @click="stopVoiceInput"
        class="voice-input-button recording"
        title="点击停止录音"
      >
        <el-icon size="20"><VideoPlay /></el-icon>
      </el-button>

      <!-- 录音状态指示 -->
      <div class="recording-indicator" v-if="isRecording">
        <div class="pulse-dot"></div>
        <span class="recording-time">{{ recordingDurationText }}</span>
      </div>
    </div>

    <!-- 语音输入对话框 -->
    <el-dialog
      v-model="showVoiceInputDialog"
      title="语音输入"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <VoiceInput
        :auto-transcribe="true"
        :show-advanced="false"
        compact
        @text-ready="handleVoiceTextReady"
        @recording-start="handleRecordingStart"
        @recording-stop="handleRecordingStop"
        @error="handleVoiceError"
      />

      <template #footer>
        <el-button @click="closeVoiceInputDialog">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 消息语音播放 -->
    <div class="message-voice-controls" v-if="showMessageVoice">
      <!-- 语音播放按钮 -->
      <el-button
        v-for="message in messagesWithVoice"
        :key="`voice-${message.id}`"
        size="small"
        circle
        @click="toggleMessageVoice(message)"
        :type="currentPlayingMessage?.id === message.id && isPlaying ? 'warning' : 'primary'"
        :loading="synthesizingMessages.includes(message.id)"
        class="message-voice-button"
        :title="getVoiceButtonTitle(message)"
      >
        <el-icon size="14">
          <component :is="getVoiceButtonIcon(message)" />
        </el-icon>
      </el-button>
    </div>

    <!-- 自动语音回复设置 -->
    <div class="auto-voice-section" v-if="showAutoVoice">
      <div class="auto-voice-toggle">
        <el-switch
          v-model="autoVoiceEnabled"
          active-text="自动语音回复"
          inactive-text="关闭语音回复"
          @change="handleAutoVoiceToggle"
        />

        <el-dropdown @command="handleVoiceProfileSelect" placement="bottom-start">
          <el-button size="small" text>
            {{ currentVoiceProfile?.name || '选择语音' }}
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="profile in voiceProfiles"
                :key="profile.id"
                :command="profile.id"
                :class="{ 'is-active': currentVoiceProfile?.id === profile.id }"
              >
                <div class="voice-profile-option">
                  <span>{{ profile.name }}</span>
                  <el-tag size="small">{{ getLanguageName(profile.language) }}</el-tag>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 语音消息历史 -->
    <div class="voice-history-section" v-if="showVoiceHistory">
      <el-drawer
        v-model="showVoiceHistoryDrawer"
        title="语音消息历史"
        :size="isMobile ? '100%' : '400px'"
        direction="rtl"
      >
        <div class="voice-history-content">
          <div class="history-filters">
            <el-select
              v-model="historyFilter"
              placeholder="筛选类型"
              size="small"
              style="width: 120px"
            >
              <el-option label="全部" value="all" />
              <el-option label="语音输入" value="input" />
              <el-option label="语音回复" value="reply" />
            </el-select>

            <el-button
              size="small"
              @click="clearVoiceHistory"
              :icon="Delete"
            >
              清空历史
            </el-button>
          </div>

          <div class="history-list">
            <div
              v-for="item in filteredVoiceHistory"
              :key="item.id"
              class="history-item"
            >
              <div class="history-header">
                <el-icon class="history-icon">
                  <component :is="item.type === 'input' ? 'Microphone' : 'ChatDotRound'" />
                </el-icon>
                <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                <el-tag size="small" :type="item.type === 'input' ? 'info' : 'success'">
                  {{ item.type === 'input' ? '输入' : '回复' }}
                </el-tag>
              </div>

              <div class="history-content">
                <p class="history-text">{{ item.text }}</p>

                <VoicePlayer
                  v-if="item.audioData"
                  :audio-data="item.audioData"
                  compact
                  :show-extensions="false"
                />
              </div>
            </div>

            <div v-if="filteredVoiceHistory.length === 0" class="empty-history">
              <el-empty description="暂无语音消息" />
            </div>
          </div>
        </div>
      </el-drawer>
    </div>

    <!-- 语音设置快捷面板 -->
    <div class="voice-settings-panel" v-if="showQuickSettings">
      <el-popover
        placement="top"
        :width="300"
        trigger="click"
        title="语音设置"
      >
        <template #reference>
          <el-button
            size="small"
            circle
            :icon="Setting"
            title="语音设置"
          />
        </template>

        <div class="quick-settings-content">
          <div class="setting-item">
            <label>语音输入</label>
            <el-switch v-model="voiceInputEnabled" />
          </div>

          <div class="setting-item">
            <label>自动播放回复</label>
            <el-switch v-model="autoPlayEnabled" />
          </div>

          <div class="setting-item">
            <label>语音质量</label>
            <el-select v-model="voiceQuality" size="small">
              <el-option label="标准" value="standard" />
              <el-option label="高质量" value="high" />
            </el-select>
          </div>

          <div class="setting-item">
            <label>音量</label>
            <el-slider
              v-model="masterVolume"
              :min="0"
              :max="100"
              size="small"
            />
          </div>

          <div class="settings-actions">
            <el-button
              size="small"
              @click="openFullSettings"
              :icon="Setting"
            >
              详细设置
            </el-button>
          </div>
        </div>
      </el-popover>
    </div>

    <!-- 全局语音设置对话框 -->
    <el-dialog
      v-model="showFullSettingsDialog"
      title="语音设置"
      width="800px"
      :close-on-click-modal="false"
    >
      <VoiceSettings @settings-changed="handleSettingsChanged" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  ElButton, ElDialog, ElDrawer, ElSwitch, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElSelect, ElOption, ElTag, ElEmpty, ElPopover,
  ElSlider, ElMessage
} from 'element-plus'
import {
  Microphone, VideoPlay, VideoPause, ChatDotRound, Setting,
  ArrowDown, Delete
} from '@element-plus/icons-vue'
import VoiceInput from './VoiceInput.vue'
import VoicePlayer from './VoicePlayer.vue'
import VoiceSettings from './VoiceSettings.vue'
import { useVoice, useQuickTTS, type VoiceProfile, type AudioRecording, SUPPORTED_LANGUAGES } from '@/composables/useVoice'

// Props
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioData?: AudioRecording
}

interface Props {
  messages?: Message[] // 聊天消息列表
  currentCharacter?: any // 当前角色信息
  showVoiceInput?: boolean // 显示语音输入
  showMessageVoice?: boolean // 显示消息语音播放
  showAutoVoice?: boolean // 显示自动语音回复
  showVoiceHistory?: boolean // 显示语音历史
  showQuickSettings?: boolean // 显示快速设置
  isMobile?: boolean // 移动端模式
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  showVoiceInput: true,
  showMessageVoice: true,
  showAutoVoice: true,
  showVoiceHistory: true,
  showQuickSettings: true,
  isMobile: false
})

// Emits
interface Emits {
  (e: 'voice-text-ready', text: string): void
  (e: 'voice-message-play', message: Message): void
  (e: 'voice-message-stop'): void
  (e: 'auto-voice-toggle', enabled: boolean): void
  (e: 'settings-changed', settings: any): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()
const quickTTS = useQuickTTS()

// 解构所需的状态和方法
const {
  isSupported: canUseVoice,
  isRecording,
  recordingDurationText,
  isPlaying,
  voiceProfiles,
  currentVoiceProfile,
  synthesizeText
} = voice

// 组件状态
const showVoiceInputDialog = ref(false)
const showVoiceHistoryDrawer = ref(false)
const showFullSettingsDialog = ref(false)
const synthesizingMessages = ref<string[]>([])
const currentPlayingMessage = ref<Message | null>(null)
const historyFilter = ref('all')

// 语音历史记录
interface VoiceHistoryItem {
  id: string
  type: 'input' | 'reply'
  text: string
  audioData?: AudioRecording
  timestamp: Date
}

const voiceHistory = ref<VoiceHistoryItem[]>([])

// 设置状态
const autoVoiceEnabled = ref(false)
const voiceInputEnabled = ref(true)
const autoPlayEnabled = ref(true)
const voiceQuality = ref('standard')
const masterVolume = ref(80)

// 计算属性
const messagesWithVoice = computed(() => {
  return props.messages.filter(msg => msg.role === 'assistant')
})

const filteredVoiceHistory = computed(() => {
  if (historyFilter.value === 'all') {
    return voiceHistory.value
  }
  return voiceHistory.value.filter(item => item.type === historyFilter.value)
})

// 语音输入功能
const startVoiceInput = () => {
  showVoiceInputDialog.value = true
}

const stopVoiceInput = () => {
  // 在VoiceInput组件内部处理停止录音
}

const closeVoiceInputDialog = () => {
  showVoiceInputDialog.value = false
}

const handleVoiceTextReady = (text: string) => {
  emit('voice-text-ready', text)
  showVoiceInputDialog.value = false

  // 添加到历史记录
  addToVoiceHistory({
    type: 'input',
    text,
    timestamp: new Date()
  })
}

const handleRecordingStart = () => {
  // 录音开始的处理
}

const handleRecordingStop = (audio: AudioRecording) => {
  // 录音停止的处理
}

const handleVoiceError = (error: string) => {
  ElMessage.error(`语音功能错误: ${error}`)
}

// 消息语音播放功能
const toggleMessageVoice = async (message: Message) => {
  // 如果正在播放同一个消息，则停止
  if (currentPlayingMessage.value?.id === message.id && isPlaying.value) {
    voice.stopAudio()
    currentPlayingMessage.value = null
    emit('voice-message-stop')
    return
  }

  // 如果消息已有音频，直接播放
  if (message.audioData) {
    voice.playAudio(message.audioData)
    currentPlayingMessage.value = message
    emit('voice-message-play', message)
    return
  }

  // 生成语音
  await generateMessageVoice(message)
}

const generateMessageVoice = async (message: Message) => {
  if (!currentVoiceProfile.value) {
    ElMessage.warning('请先选择语音配置')
    return
  }

  synthesizingMessages.value.push(message.id)

  try {
    const audio = await synthesizeText({
      text: message.content,
      voiceProfile: currentVoiceProfile.value
    })

    if (audio) {
      // 将音频数据关联到消息
      message.audioData = audio

      // 自动播放
      if (autoPlayEnabled.value) {
        voice.playAudio(audio)
        currentPlayingMessage.value = message
        emit('voice-message-play', message)
      }

      // 添加到历史记录
      addToVoiceHistory({
        type: 'reply',
        text: message.content,
        audioData: audio,
        timestamp: new Date()
      })
    }
  } catch (err) {
    console.error('生成语音失败:', err)
    ElMessage.error('生成语音失败')
  } finally {
    synthesizingMessages.value = synthesizingMessages.value.filter(id => id !== message.id)
  }
}

const getVoiceButtonIcon = (message: Message) => {
  if (synthesizingMessages.value.includes(message.id)) {
    return 'Loading'
  }

  if (currentPlayingMessage.value?.id === message.id && isPlaying.value) {
    return 'VideoPause'
  }

  return 'VideoPlay'
}

const getVoiceButtonTitle = (message: Message) => {
  if (synthesizingMessages.value.includes(message.id)) {
    return '生成中...'
  }

  if (currentPlayingMessage.value?.id === message.id && isPlaying.value) {
    return '暂停播放'
  }

  return message.audioData ? '播放语音' : '生成语音'
}

// 自动语音回复功能
const handleAutoVoiceToggle = (enabled: boolean) => {
  emit('auto-voice-toggle', enabled)

  if (enabled && !currentVoiceProfile.value) {
    ElMessage.warning('请先选择语音配置')
    autoVoiceEnabled.value = false
  }
}

const handleVoiceProfileSelect = (profileId: string) => {
  const profile = voiceProfiles.value.find(p => p.id === profileId)
  if (profile) {
    voice.currentVoiceProfile.value = profile
  }
}

// 语音历史功能
const addToVoiceHistory = (item: Omit<VoiceHistoryItem, 'id'>) => {
  voiceHistory.value.unshift({
    ...item,
    id: Date.now().toString()
  })

  // 限制历史记录数量
  if (voiceHistory.value.length > 100) {
    voiceHistory.value = voiceHistory.value.slice(0, 100)
  }
}

const clearVoiceHistory = () => {
  voiceHistory.value = []
  ElMessage.success('语音历史已清空')
}

// 设置功能
const openFullSettings = () => {
  showFullSettingsDialog.value = true
}

const handleSettingsChanged = (settings: any) => {
  emit('settings-changed', settings)
}

// 工具函数
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
  return lang?.name || code
}

// 监听器
watch(() => props.messages, (newMessages, oldMessages) => {
  // 检查是否有新的助手消息
  if (autoVoiceEnabled.value && newMessages.length > (oldMessages?.length || 0)) {
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage.role === 'assistant' && !lastMessage.audioData) {
      // 自动生成语音
      setTimeout(() => {
        generateMessageVoice(lastMessage)
      }, 1000) // 延迟1秒生成
    }
  }
}, { deep: true })

// 监听播放状态
watch(isPlaying, (playing) => {
  if (!playing) {
    currentPlayingMessage.value = null
  }
})

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl + Shift + V 开启语音输入
  if (event.ctrlKey && event.shiftKey && event.key === 'V') {
    event.preventDefault()
    if (voiceInputEnabled.value && canUseVoice.value) {
      startVoiceInput()
    }
  }

  // ESC 关闭语音输入
  if (event.key === 'Escape' && showVoiceInputDialog.value) {
    closeVoiceInputDialog()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)

  // 加载保存的设置
  const savedSettings = localStorage.getItem('chat_voice_settings')
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      autoVoiceEnabled.value = settings.autoVoiceEnabled ?? false
      voiceInputEnabled.value = settings.voiceInputEnabled ?? true
      autoPlayEnabled.value = settings.autoPlayEnabled ?? true
      voiceQuality.value = settings.voiceQuality ?? 'standard'
      masterVolume.value = settings.masterVolume ?? 80
    } catch (err) {
      console.error('加载语音设置失败:', err)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)

  // 保存设置
  const settings = {
    autoVoiceEnabled: autoVoiceEnabled.value,
    voiceInputEnabled: voiceInputEnabled.value,
    autoPlayEnabled: autoPlayEnabled.value,
    voiceQuality: voiceQuality.value,
    masterVolume: masterVolume.value
  }

  localStorage.setItem('chat_voice_settings', JSON.stringify(settings))
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.chat-voice-features {
  .voice-input-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .voice-input-button {
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }

      &.recording {
        animation: pulse 1.5s infinite;
        box-shadow: 0 0 20px rgba(245, 108, 108, 0.5);
      }
    }

    .recording-indicator {
      display: flex;
      align-items: center;
      gap: 8px;

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #f56c6c;
        border-radius: 50%;
        animation: pulse 1s infinite;
      }

      .recording-time {
        font-family: monospace;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .message-voice-controls {
    display: flex;
    flex-direction: row;
    gap: 8px;
    justify-content: center;
    align-items: center;
    padding: 8px 0;

    .message-voice-button {
      width: 36px;
      height: 36px;
      opacity: 0.8;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        transform: scale(1.05);
      }
    }
  }

  .auto-voice-section {
    .auto-voice-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: var(--el-fill-color-extra-light);
      border-radius: 6px;

      .voice-profile-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
    }
  }

  .voice-history-content {
    .history-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .history-list {
      .history-item {
        margin-bottom: 16px;
        padding: 12px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;

        .history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .history-icon {
            color: var(--el-color-primary);
          }

          .history-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            flex: 1;
          }
        }

        .history-content {
          .history-text {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: var(--el-text-color-primary);
            line-height: 1.4;
          }
        }
      }

      .empty-history {
        text-align: center;
        padding: 40px 20px;
      }
    }
  }

  .quick-settings-content {
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      label {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .settings-actions {
      margin-top: 16px;
      text-align: center;
      border-top: 1px solid var(--el-border-color-light);
      padding-top: 12px;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .chat-voice-features {
    .message-voice-controls {
      position: relative;
      right: auto;
      top: auto;
      transform: none;
      flex-direction: row;
      justify-content: center;
      margin: 8px 0;
    }

    .auto-voice-section .auto-voice-toggle {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
  }
}

// 暗色主题适配
.dark {
  .chat-voice-features {
    .auto-voice-toggle,
    .history-item {
      background: var(--el-fill-color);
    }
  }
}

// Element Plus 组件样式覆盖
:deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
