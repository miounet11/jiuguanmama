<template>
  <div
    class="chat-session-immersive"
    :class="{
      'chat-session-immersive--mobile': isMobile,
      'chat-session-immersive--desktop': isDesktop
    }"
    ref="containerRef"
  >
    <!-- 场景背景层 -->
    <div
      class="scene-background"
      :style="sceneBackgroundStyle"
    >
      <div
        v-for="layer in backgroundLayers"
        :key="layer.id"
        class="scene-layer"
        :class="{ 'scene-layer--active': layer.id === currentScene?.id }"
        :style="{
          backgroundImage: `url(${layer.url})`,
          opacity: layer.opacity || 0.3,
          zIndex: layer.id === currentScene?.id ? 2 : 1
        }"
      />
    </div>

    <!-- 桌面端三栏布局 -->
    <div
      v-if="isDesktop"
      class="desktop-layout"
    >
      <!-- 左侧：角色信息面板 -->
      <div
        class="left-panel"
        :class="{ 'left-panel--collapsed': leftPanelCollapsed }"
      >
        <CharacterPanel
          :character="currentCharacter"
          :collapsed="leftPanelCollapsed"
          @toggle-collapse="leftPanelCollapsed = !leftPanelCollapsed"
          @character-action="handleCharacterAction"
        />
      </div>

      <!-- 中间：对话区域 -->
      <div class="center-panel">
        <div class="chat-header">
          <div class="chat-title">
            <h2>{{ currentCharacter?.name || '选择角色开始对话' }}</h2>
            <div class="chat-mode-indicator">
              <span class="mode-badge" :style="{ background: currentModeConfig.color }">
                {{ currentModeConfig.name }}
              </span>
            </div>
          </div>

          <div class="chat-actions">
            <MicroInteraction
              type="icon"
              @click="toggleSceneSelector"
              enable-haptic
              tooltip="更换场景"
            >
              <TavernIcon name="photo" />
            </MicroInteraction>

            <MicroInteraction
              type="icon"
              @click="openSettings"
              enable-haptic
              tooltip="聊天设置"
            >
              <TavernIcon name="cog-6-tooth" />
            </MicroInteraction>

            <MicroInteraction
              type="icon"
              @click="toggleFullscreen"
              enable-haptic
              tooltip="全屏"
            >
              <TavernIcon :name="isFullscreen ? 'arrows-pointing-in' : 'arrows-pointing-out'" />
            </MicroInteraction>
          </div>
        </div>

        <!-- 消息列表 -->
        <div
          class="messages-container"
          ref="messagesContainerRef"
          @scroll="handleMessagesScroll"
        >
          <div class="messages-list">
            <ImmersiveMessageBubble
              v-for="message in messages"
              :key="message.id"
              :message="message"
              :is-streaming="message.isStreaming"
              @reaction="handleMessageReaction"
              @regenerate="handleMessageRegenerate"
              @copy="handleMessageCopy"
              @voice-play="handleMessageVoicePlay"
            />
          </div>

          <!-- 打字指示器 -->
          <TypingIndicator
            v-if="isTyping"
            :character-name="currentCharacter?.name"
            :is-streaming="isStreaming"
          />
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <ImmersiveChatInput
            v-model="inputMessage"
            :disabled="isLoading"
            :character="currentCharacter"
            :chat-mode="currentMode"
            @send="handleSendMessage"
            @voice-input="handleVoiceInput"
            @file-upload="handleFileUpload"
            @emoji-select="handleEmojiSelect"
          />
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div
        class="right-panel"
        :class="{ 'right-panel--collapsed': rightPanelCollapsed }"
      >
        <ControlPanel
          :chat-mode="currentMode"
          :collapsed="rightPanelCollapsed"
          @toggle-collapse="rightPanelCollapsed = !rightPanelCollapsed"
          @mode-change="handleModeChange"
          @setting-change="handleSettingChange"
        />
      </div>
    </div>

    <!-- 移动端全屏布局 -->
    <div
      v-else
      class="mobile-layout"
    >
      <!-- 移动端头部 -->
      <div class="mobile-header">
        <MicroInteraction
          type="icon"
          @click="toggleMobileControls"
          enable-haptic
        >
          <TavernIcon name="bars-3" />
        </MicroInteraction>

        <div class="mobile-title">
          <h3>{{ currentCharacter?.name || '选择角色' }}</h3>
        </div>

        <MicroInteraction
          type="icon"
          @click="openSettings"
          enable-haptic
        >
          <TavernIcon name="cog-6-tooth" />
        </MicroInteraction>
      </div>

      <!-- 移动端消息区域 -->
      <div
        class="mobile-messages"
        ref="mobileMessagesRef"
      >
        <div class="messages-list">
          <ImmersiveMessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-streaming="message.isStreaming"
            :mobile="true"
            @reaction="handleMessageReaction"
            @regenerate="handleMessageRegenerate"
            @copy="handleMessageCopy"
            @voice-play="handleMessageVoicePlay"
          />
        </div>

        <TypingIndicator
          v-if="isTyping"
          :character-name="currentCharacter?.name"
          :is-streaming="isStreaming"
          :mobile="true"
        />
      </div>

      <!-- 移动端输入区域 -->
      <div class="mobile-input">
        <ImmersiveChatInput
          v-model="inputMessage"
          :disabled="isLoading"
          :character="currentCharacter"
          :chat-mode="currentMode"
          :mobile="true"
          @send="handleSendMessage"
          @voice-input="handleVoiceInput"
          @file-upload="handleFileUpload"
          @emoji-select="handleEmojiSelect"
        />
      </div>

      <!-- 移动端控制抽屉 -->
      <MobileControlDrawer
        v-model="mobileControlsOpen"
        position="bottom"
        title="聊天控制"
        :enable-swipe-to-close="true"
        :enable-safe-area="true"
      >
        <div class="mobile-controls-content">
          <!-- 角色信息 -->
          <div class="control-section">
            <h4>角色信息</h4>
            <CharacterPanel
              :character="currentCharacter"
              :mobile="true"
              @character-action="handleCharacterAction"
            />
          </div>

          <!-- 聊天模式 -->
          <div class="control-section">
            <h4>聊天模式</h4>
            <ControlPanel
              :chat-mode="currentMode"
              :mobile="true"
              @mode-change="handleModeChange"
              @setting-change="handleSettingChange"
            />
          </div>

          <!-- 场景选择 -->
          <div class="control-section">
            <h4>场景背景</h4>
            <SceneSelector
              :current-scene="currentScene"
              :mobile="true"
              @scene-select="handleSceneSelect"
              @auto-detect-toggle="toggleAutoDetect"
            />
          </div>
        </div>
      </MobileControlDrawer>
    </div>

    <!-- 场景选择器对话框 -->
    <Teleport to="body">
      <SceneSelectorDialog
        v-model="sceneSelectorOpen"
        :current-scene="currentScene"
        @scene-select="handleSceneSelect"
      />
    </Teleport>

    <!-- 设置对话框 -->
    <Teleport to="body">
      <SettingsDialog
        v-model="settingsOpen"
        :chat-settings="chatSettings"
        @settings-change="handleSettingsChange"
      />
    </Teleport>

    <!-- 图片预览对话框 -->
    <Teleport to="body">
      <ImagePreviewDialog
        v-model="imagePreviewOpen"
        :image-data="previewImageData"
      />
    </Teleport>

    <!-- 语音录制指示器 -->
    <div
      v-if="isRecording"
      class="voice-recording-indicator"
    >
      <div class="recording-icon">
        <TavernIcon name="microphone" />
      </div>
      <div class="recording-text">正在录音...</div>
      <MicroInteraction
        type="button"
        @click="stopRecording"
        class="stop-recording-btn"
      >
        停止录音
      </MicroInteraction>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAnimations } from '@/composables/useAnimations'
import { useMobileOptimization } from '@/composables/useMobileOptimization'
import { useSceneSystem } from '@/composables/useSceneSystem'
import { useChatModes } from '@/composables/useChatModes'
import { useChatDateFormatter } from '@/composables/useChatDateFormatter'

// 组件导入
import CharacterPanel from './components/CharacterPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import ImmersiveMessageBubble from './components/ImmersiveMessageBubble.vue'
import ImmersiveChatInput from './components/ImmersiveChatInput.vue'
import TypingIndicator from './components/TypingIndicator.vue'
import SceneSelector from './components/SceneSelector.vue'
import MicroInteraction from '@/components/common/MicroInteraction.vue'
import MobileControlDrawer from './components/MobileControlDrawer.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import SceneSelectorDialog from './components/SceneSelectorDialog.vue'
import ImagePreviewDialog from './components/ImagePreviewDialog.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'

// 类型定义
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isStreaming?: boolean
  reactions?: string[]
  metadata?: Record<string, any>
}

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  personality?: string
}

interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
}

// 路由和状态
const route = useRoute()

// WebSocket连接
const { socket, isConnected } = useWebSocket()

// 动画系统
const { fadeIn, slideIn, animateOnScroll } = useAnimations()

// 移动端优化
const { isMobile, isDesktop, triggerHapticFeedback } = useMobileOptimization()

// 场景系统
const {
  currentScene,
  currentSceneId,
  backgroundLayers,
  changeScene,
  autoDetectScene,
  toggleAutoDetect,
  availableScenes
} = useSceneSystem()

// 聊天模式
const {
  currentMode,
  currentModeConfig,
  setMode,
  isFeatureEnabled
} = useChatModes()

// 时间格式化
const { formatDateTime, isToday, isYesterday } = useChatDateFormatter()

// 引用
const containerRef = ref<HTMLElement>()
const messagesContainerRef = ref<HTMLElement>()
const mobileMessagesRef = ref<HTMLElement>()

// 响应式状态
const sessionId = ref(route.params.sessionId as string)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isTyping = ref(false)
const isStreaming = ref(false)
const isRecording = ref(false)

// 面板状态
const leftPanelCollapsed = ref(false)
const rightPanelCollapsed = ref(false)
const mobileControlsOpen = ref(false)
const sceneSelectorOpen = ref(false)
const settingsOpen = ref(false)
const imagePreviewOpen = ref(false)

// 角色和设置
const currentCharacter = ref<Character | null>(null)
const chatSettings = ref<ChatSettings>({
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2048
})

// 全屏状态
const isFullscreen = ref(false)

// 图片预览数据
const previewImageData = ref({ url: '', prompt: '' })

// 计算属性
const containerClasses = computed(() => [
  'immersive-chat-container',
  {
    'mobile-view': isMobile.value,
    'fullscreen-mode': fullscreen.value,
    'panels-collapsed': leftPanelCollapsed.value && rightPanelCollapsed.value,
    `mode-${chatSettings.mode}`: true,
    'sound-enabled': soundEnabled.value,
    'typing-active': isTyping.value,
    'connection-active': connected.value
  }
])

const isMobile = computed(() => {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const chatStats = computed(() => ({
  messageCount: messages.value.length,
  sessionDuration: Date.now() - sessionStartTime.value.getTime(),
  averageResponseTime: 0, // 可以从聊天记录计算
  tokensUsed: 0 // 可以从聊天记录计算
}))

const sessionDuration = computed(() => {
  return Date.now() - sessionStartTime.value.getTime()
})

const suggestedOpenings = computed(() => {
  if (!character.value) return []

  const openings = [
    `你好，${character.value.name}！`,
    `能告诉我更多关于你的故事吗？`,
    `今天过得怎么样？`,
    `我们来聊聊你的兴趣爱好吧`
  ]

  return openings.slice(0, 3)
})

const displayMessages = computed(() => {
  return messages.value.map((message, index) => ({
    ...message,
    index,
    isLast: index === messages.value.length - 1
  }))
})

// 方法
const isStreaming = computed(() => isLoading.value && streamingMessageId.value !== null)

const isPreviousMessage = (message: Message) => {
  const index = messages.value.findIndex(m => m.id === message.id)
  return index > 0 && messages.value[index - 1].role === message.role
}

const shouldShowAvatar = (message: Message) => {
  const index = messages.value.findIndex(m => m.id === message.id)
  return index === 0 || messages.value[index - 1]?.role !== message.role
}

const handleScroll = () => {
  if (!messagesContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
  showScrollToBottom.value = !isNearBottom
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleInputFocus = () => {
  isInputFocused.value = true
}

const handleInputBlur = () => {
  isInputFocused.value = false
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

// 消息处理
const sendMessage = async (content: string) => {
  if (!content.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  scrollToBottom()

  isLoading.value = true
  isTyping.value = true

  try {
    await chatStore.sendMessage(userMessage.content, {
      characterId: character.value?.id,
      settings: chatSettings
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
}

const stopGeneration = () => {
  isLoading.value = false
  isTyping.value = false
  streamingMessageId.value = null
}

const regenerateMessage = async (messageId: string) => {
  // 实现消息重新生成逻辑
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 显示成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const rateMessage = (messageId: string, rating: number) => {
  // 实现消息评分逻辑
}

const playVoiceMessage = (messageId: string) => {
  // 实现语音播放逻辑
}

const stopVoiceMessage = () => {
  // 实现停止语音播放逻辑
}

const previewImage = (imageData: { url: string; prompt?: string }) => {
  previewImageData.value = imageData
}

// 建议消息
const sendSuggestedMessage = (suggestion: string) => {
  sendMessage(suggestion)
}

// 语音处理
const handleVoiceText = (text: string) => {
  inputMessage.value = text
}

const handleFileUpload = (files: FileList) => {
  // 处理文件上传
}

const addEmoji = (emoji: string) => {
  inputMessage.value += emoji
}

// UI 控制
const toggleSceneSelector = () => {
  showSceneSelector.value = !showSceneSelector.value
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  if (fullscreen.value) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const openSettings = () => {
  showSettingsDialog.value = true
}

const saveSettings = (newSettings: Partial<ChatSettings>) => {
  Object.assign(chatSettings, newSettings)
  showSettingsDialog.value = false
}

const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
  Object.assign(chatSettings, newSettings)
}

const handleChatModeChange = (mode: 'basic' | 'advanced' | 'professional') => {
  setMode(mode)
  chatSettings.mode = mode
}

// 移动端控制
const toggleMobilePanels = () => {
  showMobilePanels.value = !showMobilePanels.value
  showMobileControls.value = false
}

const closeMobilePanels = () => {
  showMobilePanels.value = false
}

const toggleMobileControls = () => {
  showMobileControls.value = !showMobileControls.value
  showMobilePanels.value = false
}

const closeMobileControls = () => {
  showMobileControls.value = false
}

// 聊天操作
const regenerateLastMessage = async () => {
  // 实现最后一条消息重新生成
}

const exportChat = () => {
  // 实现聊天导出
}

const clearChatWithConfirm = async () => {
  // 实现清空聊天确认
}

// 生命周期
onMounted(async () => {
  // 加载角色数据
  if (route.params.characterId) {
    character.value = await characterStore.getCharacterById(route.params.characterId as string)
  }

  // 加载聊天历史
  if (character.value) {
    messages.value = await chatStore.getChatHistory(character.value.id)
  }

  // 连接WebSocket
  connect()

  // 初始化场景
  await changeScene('default')

  // 设置会话开始时间
  sessionStartTime.value = new Date()

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

onUnmounted(() => {
  disconnect()
})

// 监听器
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(connected, (isConnected) => {
  isOnline.value = isConnected
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.immersive-chat-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: $dark-bg-primary;
  color: $text-primary;

  // 移动端适配
  @include mobile-only {
    .desktop-layout {
      display: none;
    }

    .mobile-layout {
      display: block;
    }
  }

  // 桌面端适配
  @include desktop-up {
    .desktop-layout {
      display: flex;
    }

    .mobile-layout {
      display: none;
    }
  }
}

// 场景背景系统
.scene-background-system {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.scene-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transform: scale(1.05);
  transition: all 1.2s cubic-bezier(0.23, 1, 0.32, 1);

  &.layer-active {
    opacity: 0.4;
    transform: scale(1);
  }

  &.layer-transitioning {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.ambient-light-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(18, 18, 20, 0.85) 0%,
    rgba(28, 28, 32, 0.75) 30%,
    rgba(18, 18, 20, 0.85) 70%,
    rgba(12, 12, 16, 0.9) 100%
  );
  pointer-events: none;
}

// 桌面端布局
.desktop-layout {
  display: flex;
  height: 100vh;
  position: relative;
}

.character-panel {
  width: 320px;
  background: rgba($dark-bg-secondary, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba($primary-500, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &.panel-collapsed {
    width: 80px;
  }
}

.conversation-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.control-panel {
  width: 280px;
  background: rgba($dark-bg-secondary, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba($primary-500, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &.panel-collapsed {
    width: 80px;
  }
}

// 对话区域
.conversation-header {
  height: 70px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  position: relative;
  z-index: 10;

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .session-title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }

    .session-meta {
      display: flex;
      gap: 16px;

      .message-count,
      .session-duration {
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

// 消息容器
.messages-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: 20px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
}

// 欢迎状态
.welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px;

  .welcome-avatar {
    margin-bottom: 24px;
    position: relative;

    .character-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba($primary-500, 0.3);
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
    }

    .default-avatar {
      width: 120px;
      height: 120px;
      background: rgba($primary-500, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary-400;
      font-size: 48px;
      border: 3px solid rgba($primary-500, 0.3);
    }
  }

  .welcome-title {
    font-size: 28px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 12px;
  }

  .welcome-description {
    font-size: 16px;
    color: $text-secondary;
    margin: 0 0 32px;
    max-width: 500px;
    line-height: 1.6;
  }

  .suggested-openings {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;

    .opening-suggestion {
      padding: 12px 20px;
      background: rgba($primary-500, 0.1);
      border: 1px solid rgba($primary-500, 0.3);
      border-radius: 24px;
      color: $primary-300;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba($primary-500, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($primary-500, 0.3);
      }
    }
  }
}

// 消息列表
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 输入区域
.input-area {
  background: rgba($dark-bg-secondary, 0.95);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba($primary-500, 0.2);
  padding: 20px;
  position: relative;
  z-index: 10;
}

// 输入指示器
.typing-indicator-wrapper {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

// 滚动到底部按钮
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 100px;
  right: 30px;
  background: rgba($primary-500, 0.9);
  color: white;
  border-radius: 24px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba($primary-500, 0.3);
  z-index: 5;

  &:hover {
    background: $primary-500;
    transform: translateY(-2px);
  }
}

// 移动端布局
.mobile-layout {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.mobile-conversation {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mobile-header {
  height: 60px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  z-index: 10;

  .mobile-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }
}

// 移动端抽屉
.mobile-drawer,
.mobile-controls-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.drawer-content,
.controls-drawer-content {
  width: 100%;
  max-height: 70vh;
  background: $dark-bg-secondary;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

// 模式样式
.mode-basic {
  .control-panel {
    background: rgba($dark-bg-secondary, 0.8);
  }
}

.mode-advanced {
  .control-panel {
    width: 320px;
    background: rgba($dark-bg-secondary, 0.98);
  }

  .conversation-area {
    background: rgba($dark-bg-primary, 0.02);
  }
}

.mode-professional {
  .control-panel {
    width: 360px;
    background: rgba($dark-bg-secondary, 1);
  }

  .character-panel {
    width: 360px;
  }

  .conversation-header {
    height: 80px;
    background: rgba(30, 30, 40, 1);
  }
}

// 动画和过渡
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

// 响应式优化
@media (max-width: 1024px) {
  .character-panel {
    width: 280px;

    &.panel-collapsed {
      width: 60px;
    }
  }

  .control-panel {
    width: 240px;

    &.panel-collapsed {
      width: 60px;
    }
  }
}

// 全屏模式
.fullscreen-mode {
  .conversation-header {
    height: 0;
    overflow: hidden;
  }

  .character-panel,
  .control-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:not(.panel-collapsed) {
      transform: translateX(0);
    }
  }

  .control-panel {
    right: 0;
    left: auto;
    transform: translateX(100%);

    &:not(.panel-collapsed) {
      transform: translateX(0);
    }
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>