<template>
  <div class="chat-session-container">
    <!-- 动态场景背景 -->
    <div class="scene-background-container">
      <div
        v-for="(background, index) in backgroundLayers"
        :key="background.id"
        class="scene-background-layer"
        :class="{
          'active': index === activeBackgroundIndex,
          'transitioning': isTransitioning
        }"
        :style="{
          backgroundImage: `url(${background.url})`,
          zIndex: 1 + index
        }"
      ></div>
    </div>

    <!-- 移动端遮罩层 -->
    <div
      v-if="!sidebarCollapsed && isMobile"
      class="mobile-overlay"
      @click="sidebarCollapsed = true"
    ></div>

    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 折叠按钮 -->
      <TavernButton
        @click="toggleSidebar"
        variant="ghost"
        size="sm"
        class="sidebar-toggle"
        :class="{ 'sidebar-toggle-collapsed': sidebarCollapsed }"
      >
        <TavernIcon :name="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" />
      </TavernButton>

      <!-- 角色信息 -->
      <div class="character-info" v-if="!sidebarCollapsed">
        <div class="character-header">
          <div class="character-avatar-wrapper">
            <img
              :src="character?.avatar || '/default-avatar.png'"
              :alt="character?.name"
              class="character-avatar"
            />
            <div class="online-indicator" :class="{ 'online': isOnline }"></div>
          </div>
          <div class="character-details">
            <h2 class="character-name">{{ character?.name || '加载中...' }}</h2>
            <p class="character-creator">{{ character?.creator || '系统' }}</p>
            <div class="character-stats">
              <span class="stat-item">
                <TavernIcon name="chat-bubble-left-right" />
                {{ formatCount(character?.chatCount || 0) }}
              </span>
              <span class="stat-item">
                <TavernIcon name="star" />
                {{ character?.rating?.toFixed(1) || '0.0' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 会话快速操作 -->
      <div class="quick-actions" v-if="!sidebarCollapsed">
        <TavernButton
          @click="regenerateLastMessage"
          :disabled="!canRegenerate"
          variant="ghost"
          size="sm"
          title="重新生成"
        >
          <TavernIcon name="arrow-path" />
        </TavernButton>
        <TavernButton
          @click="toggleSettings"
          variant="ghost"
          size="sm"
          title="设置"
        >
          <TavernIcon name="cog-6-tooth" />
        </TavernButton>
        <TavernButton
          @click="exportChat"
          variant="ghost"
          size="sm"
          title="导出"
        >
          <TavernIcon name="arrow-down-tray" />
        </TavernButton>
        <TavernButton
          @click="clearChatWithConfirm"
          variant="danger"
          size="sm"
          title="清空"
        >
          <TavernIcon name="trash" />
        </TavernButton>
      </div>

      <!-- SillyTavern 高级控制 -->
      <div class="sillytavern-controls" v-if="!sidebarCollapsed">
        <SillyTavernControls />
      </div>

      <!-- 设置面板 -->
      <div class="settings-panel" v-if="!sidebarCollapsed && showSettings">
        <h3>聊天设置</h3>
        <div class="setting-group">
          <label>AI 模型</label>
          <ModelSelector
            v-model="settings.model"
            @change="onModelChange"
            :show-details="false"
          />
        </div>

        <div class="setting-group">
          <label>创造性 ({{ settings.temperature }})</label>
          <input
            v-model="settings.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="tavern-slider"
          />
        </div>

        <div class="setting-group">
          <label>最大长度 ({{ settings.maxTokens }})</label>
          <input
            v-model="settings.maxTokens"
            type="range"
            min="100"
            max="4000"
            step="100"
            class="tavern-slider"
          />
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.enableStream"
              type="checkbox"
              class="tavern-checkbox"
            />
            <span>启用流式响应</span>
          </label>
        </div>

        <div class="setting-group">
          <label class="checkbox-label">
            <input
              v-model="settings.enableTyping"
              type="checkbox"
              class="tavern-checkbox"
            />
            <span>显示输入指示器</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 聊天顶部栏 -->
      <div class="chat-header">
        <!-- 左侧返回按钮 -->
        <div class="chat-header-left">
          <TavernButton
            variant="ghost"
            size="sm"
            @click="goToChatList"
            title="返回聊天列表"
            class="back-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5L5 12L19 12M5 12V7H19M12 19l7-7M12 5l-7 7"/>
            </svg>
          </TavernButton>
          <div class="chat-header-info">
            <span class="session-title">与 {{ character?.name || '...' }} 的对话</span>
            <span class="message-count">{{ messages.length }} 条消息</span>
          </div>
        </div>
        <div class="chat-header-actions">
          <!-- 场景背景选择器 -->
          <TavernButton
            variant="ghost"
            size="sm"
            @click="toggleSceneSelector"
            title="切换场景背景"
            class="scene-selector-btn"
          >
            <TavernIcon name="photo" />
          </TavernButton>
          <TavernButton
            variant="ghost"
            size="sm"
            @click="toggleSound"
            :title="soundEnabled ? '关闭消息提示音' : '开启消息提示音'"
          >
            <TavernIcon :name="soundEnabled ? 'speaker-wave' : 'speaker-x-mark'" />
          </TavernButton>
          <TavernButton
            variant="ghost"
            size="sm"
            @click="toggleFullscreen"
            :title="fullscreen ? '退出全屏' : '全屏模式'"
          >
            <TavernIcon :name="fullscreen ? 'arrows-pointing-in' : 'arrows-pointing-out'" />
          </TavernButton>
        </div>
      </div>

      <!-- 场景选择器面板 -->
      <div v-if="showSceneSelector" class="scene-selector-panel">
        <div class="scene-panel-header">
          <h4>选择场景背景</h4>
          <TavernButton
            variant="ghost"
            size="sm"
            @click="showSceneSelector = false"
          >
            <TavernIcon name="x-mark" />
          </TavernButton>
        </div>
        <div class="scene-backgrounds-grid">
          <div
            v-for="(scene, index) in availableScenes"
            :key="scene.id"
            class="scene-background-item"
            :class="{ 'active': currentSceneId === scene.id }"
            @click="changeScene(scene)"
          >
            <div
              class="scene-thumbnail"
              :style="{ backgroundImage: `url(${scene.thumbnail || scene.url})` }"
            >
              <div class="scene-overlay">
                <TavernIcon v-if="currentSceneId === scene.id" name="check" class="check-icon" />
              </div>
            </div>
            <span class="scene-name">{{ scene.name }}</span>
          </div>
        </div>

        <!-- AI自动检测开关 -->
        <div class="scene-auto-detect">
          <label class="scene-option">
            <input
              type="checkbox"
              v-model="autoDetectScene"
              @change="onAutoDetectChange"
            />
            <span>根据对话内容自动切换场景</span>
          </label>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div ref="messagesContainer" class="chat-messages" @scroll="handleScroll">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <TavernIcon name="chat-bubble-left-right" class="large-icon" />
          </div>
          <h3>开始你的对话</h3>
          <p>向 {{ character?.name || 'AI' }} 说点什么吧</p>
          <div class="suggested-messages" v-if="suggestedMessages.length > 0">
            <TavernButton
              v-for="suggestion in suggestedMessages"
              :key="suggestion"
              @click="sendSuggestedMessage(suggestion)"
              variant="ghost"
              size="sm"
              class="suggestion-btn"
            >
              {{ suggestion }}
            </TavernButton>
          </div>
        </div>

        <!-- 虚拟滚动消息列表 -->
        <div v-else class="virtual-message-list" ref="virtualList">
          <!-- 上方填充空间 -->
          <div v-if="virtualScrollTop > 0" :style="{ height: virtualScrollTop + 'px' }" class="virtual-spacer"></div>

          <!-- 可见消息 -->
          <div
            v-for="(message, index) in displayMessages"
            :key="message.id"
            class="message-wrapper"
            :data-index="message.originalIndex"
          >
            <div :class="['message-item', message.role]">
              <!-- 消息头像 -->
              <div class="message-avatar">
                <img
                  v-if="message.role === 'assistant'"
                  :src="character?.avatar || '/default-avatar.png'"
                  :alt="character?.name"
                />
                <div v-else class="user-avatar">
                  <TavernIcon name="user" />
                </div>
              </div>

              <!-- 消息内容 -->
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">
                    {{ message.role === 'user' ? '你' : character?.name }}
                  </span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>

                <!-- 图像消息 -->
                <div v-if="message.imageUrl" class="message-image">
                  <img
                    :src="message.imageUrl"
                    :alt="message.imagePrompt || '用户图像'"
                    class="chat-image"
                    @click="previewChatImage(message.imageUrl, message.imagePrompt)"
                  />
                  <div v-if="message.imagePrompt" class="image-prompt">
                    {{ message.imagePrompt }}
                  </div>
                </div>

                <div class="message-text" v-html="formatMessage(message.content)"></div>

                <!-- 消息操作 -->
                <div class="message-actions" v-if="message.role === 'assistant'">
                  <button
                    @click="copyMessage(message.content)"
                    title="复制"
                    class="action-btn"
                  >
                    <TavernIcon name="document-duplicate" />
                  </button>
                  <button
                    @click="regenerateMessage(message.originalIndex)"
                    title="重新生成"
                    class="action-btn"
                    :disabled="isLoading"
                  >
                    <TavernIcon name="arrow-path" />
                  </button>
                  <button
                    @click="rateMessage(message)"
                    title="评价"
                    class="action-btn"
                  >
                    <TavernIcon name="star" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 下方填充空间 -->
          <div v-if="virtualScrollBottom > 0" :style="{ height: virtualScrollBottom + 'px' }" class="virtual-spacer"></div>
        </div>

        <!-- 输入指示器（优化版） -->
        <div v-if="isTyping" class="message-wrapper typing-wrapper">
          <div class="message-item assistant">
            <div class="message-avatar">
              <img
                :src="character?.avatar || '/default-avatar.png'"
                :alt="character?.name"
              />
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">{{ character?.name }} 正在输入...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 滚动到底部按钮 -->
        <TavernButton
          v-if="showScrollToBottom"
          @click="scrollToBottom"
          variant="primary"
          size="sm"
          class="scroll-to-bottom"
        >
          <TavernIcon name="arrow-down" />
          <span>新消息</span>
        </TavernButton>
      </div>

      <!-- Grok风格现代化输入区域 -->
      <div class="grok-input-area">
        <div class="input-container">
          <!-- 主输入区域 - 类似Grok的简洁设计 -->
          <div class="grok-input-card">
            <!-- 左侧工具栏 -->
            <div class="input-toolbar-left">
              <button
                @click="toggleExpandedTools"
                class="toolbar-btn attachment-btn"
                :class="{ 'active': showExpandedTools }"
                title="附件"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
            </div>

            <!-- 中央输入区域 -->
            <div class="grok-input-main">
              <div class="input-wrapper">
                <textarea
                  ref="inputRef"
                  v-model="inputMessage"
                  @keydown="handleKeyDown"
                  @input="handleInput"
                  :placeholder="getInputPlaceholder()"
                  class="grok-textarea"
                  :rows="1"
                  :disabled="isLoading"
                  />
                <!-- 输入状态栏 -->
                <div class="input-status-bar">
                  <div class="status-left">
                    <span v-if="inputMessage.length > 1500" class="char-warning">
                      {{ inputMessage.length }}/2000
                    </span>
                  </div>
                  <div class="status-right">
                    <div v-if="isVoiceRecording" class="voice-status">
                      <div class="recording-pulse"></div>
                      <span>录音中</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧操作栏 -->
            <div class="input-toolbar-right">
              <!-- 语音输入 -->
              <button
                v-if="!showExpandedTools && !isLoading"
                @click="startVoiceInput"
                class="toolbar-btn voice-btn"
                :class="{ 'recording': isVoiceRecording }"
                :title="isVoiceRecording ? '停止录音' : '语音输入'"
                :disabled="isLoading"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3 3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2a7 7 0 0 1 14 0"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              <!-- 停止生成按钮 -->
              <button
                v-if="isLoading"
                @click="stopGeneration"
                class="toolbar-btn stop-btn"
                title="停止生成"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>

              <!-- 发送按钮 -->
              <button
                v-else
                @click="sendMessage"
                class="toolbar-btn send-btn"
                :class="{ 'active': canSend }"
                :disabled="!canSend"
                title="发送 (Enter)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 2 12 3 2 12 12 3 2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 快速建议 - 类似Grok的芯片式设计 -->
          <div v-if="shouldShowSuggestions" class="grok-suggestions">
            <div class="suggestions-track">
              <button
                v-for="(suggestion, index) in getDisplaySuggestions()"
                :key="index"
                @click="sendSuggestedMessage(suggestion)"
                class="suggestion-chip"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- 工具面板 - 简化版 -->
          <div v-if="showExpandedTools" class="grok-tool-panel">
            <div class="tool-grid">
              <button
                @click="showEmojiPicker = !showEmojiPicker"
                class="tool-item"
                :class="{ 'active': showEmojiPicker }"
              >
                <span class="tool-emoji">😊</span>
                <span class="tool-label">表情</span>
              </button>
              <button
                @click="handleFileUpload"
                class="tool-item"
                :disabled="isLoading"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span class="tool-label">文件</span>
              </button>
              <button
                @click="showImageTools = !showImageTools"
                class="tool-item"
                :class="{ 'active': showImageTools }"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span class="tool-label">图像</span>
              </button>
            </div>

            <!-- 子面板 -->
            <div v-if="showEmojiPicker" class="sub-panel">
              <div class="emoji-quick-grid">
                <button
                  v-for="emoji in getQuickEmojis()"
                  :key="emoji"
                  @click="addEmoji(emoji)"
                  class="quick-emoji"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <div v-if="showImageTools" class="sub-panel">
              <SimplifiedChatImageFeatures
                :current-character="character"
                :messages="messages"
                @image-generated="handleImageGenerated"
                @image-message="handleImageMessage"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 语音功能组件 - 集成到现代化输入区域中 -->
    <!-- 暂时隐藏，语音功能已整合到主输入区域 -->
    <ChatVoiceFeatures
      v-if="false"
      :messages="messages"
      :current-character="character"
      :is-mobile="isMobile"
      class="integrated-voice-features"
      @voice-text-ready="handleVoiceTextReady"
      @voice-message-play="handleVoiceMessagePlay"
      @voice-message-stop="handleVoiceMessageStop"
      @auto-voice-toggle="handleAutoVoiceToggle"
    ></ChatVoiceFeatures>

    <!-- 语音输入对话框 -->
    <div v-if="showVoiceDialog" class="modal-overlay" @click="showVoiceDialog = false">
      <TavernCard variant="glass" class="voice-dialog" @click.stop>
        <div class="modal-header">
          <h3>语音输入</h3>
          <TavernButton variant="ghost" size="sm" @click="showVoiceDialog = false">
            <TavernIcon name="x-mark" />
          </TavernButton>
        </div>
        <div class="modal-content">
          <VoiceInput
            :auto-transcribe="true"
            :show-advanced="false"
            compact
            @text-ready="handleVoiceTextReady"
            @recording-start="handleVoiceRecordingStart"
            @recording-stop="handleVoiceRecordingStop"
            @error="handleVoiceError"
          />
        </div>
      </TavernCard>
    </div>

    <!-- 图像预览对话框 -->
    <div v-if="showImagePreview" class="modal-overlay" @click="showImagePreview = false">
      <TavernCard variant="glass" class="image-preview-dialog" @click.stop>
        <div class="modal-header">
          <h3>图像预览</h3>
          <TavernButton variant="ghost" size="sm" @click="showImagePreview = false">
            <TavernIcon name="x-mark" />
          </TavernButton>
        </div>
        <div v-if="previewImageData" class="image-preview-container">
          <img
            :src="previewImageData.url"
            :alt="previewImageData.prompt || '聊天图像'"
            class="preview-chat-image"
          />
          <div v-if="previewImageData.prompt" class="preview-image-info">
            <h4>生成提示词</h4>
            <p>{{ previewImageData.prompt }}</p>
          </div>
        </div>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/utils/axios'
import { formatTime as formatTimeUtil, getRelativeTime } from '@/utils/date'
import ModelSelector from '@/components/common/ModelSelector.vue'
import SillyTavernControls from '@/components/advanced/SillyTavernControls.vue'
import ChatVoiceFeatures from '@/components/voice/ChatVoiceFeatures.vue'
import VoiceInput from '@/components/voice/VoiceInput.vue'
import SimplifiedChatImageFeatures from '@/components/image/SimplifiedChatImageFeatures.vue'

const route = useRoute()
const router = useRouter()

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 响应式数据
const character = ref<any>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const virtualList = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isTyping = ref(false)
const isOnline = ref(true)

// 响应式布局状态
const layoutDimensions = reactive({
  viewportHeight: window.innerHeight,
  viewportWidth: window.innerWidth,
  headerHeight: 60,
  inputAreaHeight: 120,
  minMessagesHeight: 200,
  sidebarWidth: 320
})

// 虚拟滚动相关
const virtualScrollTop = ref(0)
const virtualScrollBottom = ref(0)
const visibleMessages = ref<(Message & { originalIndex: number })[]>([])
const messageHeight = 120 // 估算的单个消息高度
const containerHeight = ref(600) // 容器高度
const overscan = 5 // 上下额外渲染的消息数量

// UI 状态
const sidebarCollapsed = ref(false)
const showSettings = ref(false)
const showScrollToBottom = ref(false)
const showEmojiPicker = ref(false)
const soundEnabled = ref(true)
const fullscreen = ref(false)
const isMobile = ref(false)

// 现代化输入区域状态
const showExpandedTools = ref(false)
const showImageTools = ref(false)
const showQuickSuggestions = ref(true)

// 语音功能状态
const showVoiceDialog = ref(false)
const isVoiceRecording = ref(false)
const voiceEnabled = ref(true)

// 移动端检测
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 设置
const settings = reactive({
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 1000,
  enableStream: true,
  enableTyping: true
})

// 建议消息
const suggestedMessages = ref([
  '你好！很高兴认识你',
  '能告诉我更多关于你的事情吗？',
  '你今天过得怎么样？',
  '我们聊聊你的兴趣爱好吧'
])

// 常用表情
const commonEmojis = ['😊', '😄', '🤔', '👍', '❤️', '😂', '🥺', '😮', '🎉', '🤗', '😘', '😎']

// 计算属性
const inputRows = computed(() => {
  const lines = inputMessage.value.split('\n').length
  return Math.min(Math.max(lines, 1), 5)
})

const canSend = computed(() => {
  return inputMessage.value.trim() && !isLoading.value && inputMessage.value.length <= 2000
})

const canRegenerate = computed(() => {
  return messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant' && !isLoading.value
})

// 场景背景管理
const showSceneSelector = ref(false)
const currentSceneId = ref('default')
const activeBackgroundIndex = ref(0)
const isTransitioning = ref(false)
const autoDetectScene = ref(false)

// 可用场景背景库
const availableScenes = ref([
  {
    id: 'default',
    name: '默认',
    url: '/backgrounds/default-chat.jpg',
    thumbnail: '/backgrounds/thumbnails/default-chat.jpg',
    keywords: ['默认', '通用']
  },
  {
    id: 'tavern-interior',
    name: '时空酒馆内景',
    url: '/uploads/scenarios/backgrounds/timespace-tavern-interior.jpg',
    thumbnail: '/uploads/scenarios/backgrounds/thumbnails/timespace-tavern-interior.jpg',
    keywords: ['酒馆', '室内', '温馨', '聊天']
  },
  {
    id: 'stellar-port',
    name: '星际港口',
    url: '/uploads/scenarios/backgrounds/stellar-port.jpg',
    thumbnail: '/uploads/scenarios/backgrounds/thumbnails/stellar-port.jpg',
    keywords: ['星际', '港口', '科幻', '未来', '太空']
  },
  {
    id: 'magic-library',
    name: '魔法图书馆',
    url: '/uploads/scenarios/backgrounds/magic-library.jpg',
    thumbnail: '/uploads/scenarios/backgrounds/thumbnails/magic-library.jpg',
    keywords: ['图书馆', '魔法', '书籍', '学习', '奇幻']
  },
  {
    id: 'cyber-city',
    name: '赛博都市',
    url: '/uploads/scenarios/backgrounds/cyber-city.jpg',
    thumbnail: '/uploads/scenarios/backgrounds/thumbnails/cyber-city.jpg',
    keywords: ['赛博朋克', '都市', '霓虹', '科技', '夜晚']
  },
  {
    id: 'wasteland',
    name: '末世废土',
    url: '/uploads/scenarios/backgrounds/wasteland-scene.jpg',
    thumbnail: '/uploads/scenarios/backgrounds/thumbnails/wasteland-scene.jpg',
    keywords: ['废土', '末世', '荒凉', '生存']
  }
])

// 背景图层 (用于切换动画)
const backgroundLayers = ref([
  availableScenes.value[0] // 默认背景
])

// 当前场景计算属性
const currentScene = computed(() => {
  return availableScenes.value.find(scene => scene.id === currentSceneId.value) || availableScenes.value[0]
})

// 虚拟滚动计算
const updateVirtualScroll = () => {
  if (!messagesContainer.value || messages.value.length === 0) {
    visibleMessages.value = []
    virtualScrollTop.value = 0
    virtualScrollBottom.value = 0
    return
  }

  const scrollTop = messagesContainer.value.scrollTop
  containerHeight.value = messagesContainer.value.clientHeight

  // 计算可见区域的消息索引范围
  const startIndex = Math.max(0, Math.floor(scrollTop / messageHeight) - overscan)
  const endIndex = Math.min(
    messages.value.length - 1,
    Math.ceil((scrollTop + containerHeight.value) / messageHeight) + overscan
  )

  // 更新可见消息
  visibleMessages.value = messages.value
    .slice(startIndex, endIndex + 1)
    .map((message, index) => ({
      ...message,
      originalIndex: startIndex + index
    }))

  // 计算填充空间
  virtualScrollTop.value = startIndex * messageHeight
  virtualScrollBottom.value = (messages.value.length - endIndex - 1) * messageHeight
}

// 监听消息变化，启用/禁用虚拟滚动
const shouldUseVirtualScroll = computed(() => {
  return messages.value.length > 50 // 超过50条消息启用虚拟滚动
})

// 如果不使用虚拟滚动，返回所有消息
const displayMessages = computed(() => {
  if (shouldUseVirtualScroll.value) {
    return visibleMessages.value
  }
  return messages.value.map((message, index) => ({
    ...message,
    originalIndex: index
  }))
})

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatTime = (time: Date | string | number) => {
  return formatTimeUtil(time)
}

// 格式化消息内容（支持 Markdown）
const formatMessage = (content: string) => {
  // 简单的 Markdown 格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// UI 控制方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 现代化输入区域控制方法
const toggleExpandedTools = () => {
  showExpandedTools.value = !showExpandedTools.value
  // 关闭其他展开的面板
  if (!showExpandedTools.value) {
    showEmojiPicker.value = false
    showImageTools.value = false
  }
}

// 导航方法
const goToChatList = () => {
  // 使用 Vue Router 导航到聊天列表页面
  router.push('/chat')
}

const onModelChange = (model: any) => {
  console.log('模型已切换到:', model)
  // 根据模型配置调整设置
  if (model.maxTokens && settings.maxTokens > model.maxTokens) {
    settings.maxTokens = model.maxTokens
  }
  // 可以根据模型特性调整其他设置
  if (model.temperature) {
    settings.temperature = model.temperature
  }
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.log(soundEnabled.value ? '已开启消息提示音' : '已关闭消息提示音')
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  // 实现全屏逻辑
  if (fullscreen.value) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 处理滚动
const handleScroll = () => {
  if (!messagesContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

  showScrollToBottom.value = !isNearBottom

  // 如果启用虚拟滚动，更新可见消息
  if (shouldUseVirtualScroll.value) {
    updateVirtualScroll()
  }
}

// 键盘处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Shift + Enter 换行
      return
    } else {
      // Enter 发送消息
      event.preventDefault()
      sendMessage()
    }
  }
}

const handleInput = () => {
  // 自动调整文本框高度已通过 computed 实现
}

// 输入框占位符
const getInputPlaceholder = () => {
  if (character.value) {
    return `向 ${character.value.name} 发送消息...`
  }
  return '输入消息...'
}

// 消息相关方法
const sendSuggestedMessage = (suggestion: string) => {
  inputMessage.value = suggestion
  sendMessage()
}

const addEmoji = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
  inputRef.value?.focus()
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // TODO: 使用设计系统的消息组件替换 ElMessage
    console.log('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    console.log('复制失败')
  }
}

const regenerateMessage = async (messageIndex: number) => {
  if (isLoading.value || messageIndex < 1) return

  // 移除该消息及之后的所有 AI 消息
  const messagesToKeep = messages.value.slice(0, messageIndex)
  const lastUserMessage = messagesToKeep[messagesToKeep.length - 1]

  if (!lastUserMessage || lastUserMessage.role !== 'user') return

  messages.value = messagesToKeep

  // 重新发送用户消息
  inputMessage.value = lastUserMessage.content
  await sendMessage()
}

const regenerateLastMessage = async () => {
  const lastMessageIndex = messages.value.length - 1
  if (lastMessageIndex >= 0 && messages.value[lastMessageIndex].role === 'assistant') {
    await regenerateMessage(lastMessageIndex)
  }
}



const handleFileUpload = () => {
  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.log('文件上传功能暂未实现')
}

// 语音功能方法
const startVoiceInput = () => {
  if (isVoiceRecording.value) {
    // 如果正在录音，停止录音
    isVoiceRecording.value = false
  } else {
    // 开始语音输入
    showVoiceDialog.value = true
  }
}

const handleVoiceTextReady = (text: string) => {
  inputMessage.value = text
  showVoiceDialog.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleVoiceRecordingStart = () => {
  isVoiceRecording.value = true
}

const handleVoiceRecordingStop = () => {
  isVoiceRecording.value = false
}

const handleVoiceError = (error: string) => {
  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.error(`语音功能错误: ${error}`)
  isVoiceRecording.value = false
}

const handleVoiceMessagePlay = (message: any) => {
  // 处理语音消息播放
  console.log('Playing voice for message:', message.id)
}

const handleVoiceMessageStop = () => {
  // 处理语音消息停止
  console.log('Voice message stopped')
}

const handleAutoVoiceToggle = (enabled: boolean) => {
  // 处理自动语音回复开关
  console.log('Auto voice reply:', enabled)
  // TODO: 使用设计系统的消息组件替换 ElMessage
  if (enabled) {
    console.log('已开启自动语音回复')
  } else {
    console.log('已关闭自动语音回复')
  }
}

// 图像功能处理方法
const handleImageGenerated = (image: any) => {
  // 处理生成的图像
  console.log('图像生成完成:', image)
  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.log('图像生成完成')
}

const handleImageMessage = (imageMessage: any) => {
  // 将图像消息添加到聊天中
  const message: Message = {
    id: imageMessage.id,
    role: 'user',
    content: imageMessage.type === 'image' ?
      `[图像] ${imageMessage.prompt || '用户发送了一张图像'}` :
      imageMessage.content,
    timestamp: imageMessage.timestamp
  }

  // 如果是图像消息，添加特殊处理
  if (imageMessage.type === 'image') {
    message.imageUrl = imageMessage.content
    message.imagePrompt = imageMessage.prompt
  }

  messages.value.push(message)
  scrollToBottom()

  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.log('图像消息已发送')
}

// 图像预览方法
const showImagePreview = ref(false)
const previewImageData = ref<{url: string, prompt?: string} | null>(null)

const previewChatImage = (imageUrl: string, prompt?: string) => {
  previewImageData.value = { url: imageUrl, prompt }
  showImagePreview.value = true
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 流式响应支持
const streamingMessage = ref<Message | null>(null)
const streamController = ref<AbortController | null>(null)

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const messageContent = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()

  isLoading.value = true
  isTyping.value = true

  // 创建流式响应处理控制器
  streamController.value = new AbortController()

  try {
    // 检查是否启用流式响应（可以根据设置决定）
    const useStream = true

    if (useStream) {
      await sendStreamingMessage(messageContent)
    } else {
      await sendRegularMessage(messageContent)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    handleMessageError()
  } finally {
    isLoading.value = false
    isTyping.value = false
    streamController.value = null
  }
}

const sendStreamingMessage = async (messageContent: string) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009'
    const response = await fetch(`${API_BASE_URL}/api/chats/${route.params.characterId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content: messageContent,
        settings,
        stream: true
      }),
      signal: streamController.value?.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    // 创建流式消息对象
    streamingMessage.value = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    messages.value.push(streamingMessage.value)
    isTyping.value = false

    try {
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // 解析SSE数据
        buffer += new TextDecoder().decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一行未完整的数据

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()

            if (dataStr === '[DONE]') {
              return
            }

            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'connected') {
                // 连接确认，更新用户消息ID
                const lastUserMessage = messages.value[messages.value.length - 2]
                if (lastUserMessage && lastUserMessage.role === 'user') {
                  lastUserMessage.id = data.userMessage.id
                }
              } else if (data.type === 'chunk') {
                // 流式内容块
                if (streamingMessage.value) {
                  streamingMessage.value.content = data.fullContent || data.content || ''
                  // 触发界面更新
                  nextTick(() => {
                    scrollToBottom()
                  })
                }
              } else if (data.type === 'complete') {
                // 流式完成
                if (streamingMessage.value) {
                  streamingMessage.value.id = data.id
                  streamingMessage.value.content = data.content
                  streamingMessage.value.timestamp = new Date(data.timestamp)
                }
              } else if (data.type === 'error') {
                // 流式错误
                if (streamingMessage.value) {
                  streamingMessage.value.content = data.message || '抱歉，发生了错误。'
                }
                // TODO: 使用设计系统的消息组件替换 ElMessage
                console.error('AI回复出现错误')
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError, 'Data:', dataStr)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
      streamingMessage.value = null
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Streaming aborted by user')
      // TODO: 使用设计系统的消息组件替换 ElMessage
      console.log('已停止生成')
    } else {
      console.error('Streaming error:', error)
      throw error
    }
  }
}

const sendRegularMessage = async (messageContent: string) => {
  const response = await http.post(`/chats/${route.params.characterId}/messages`, {
    content: messageContent,
    settings,
    stream: false
  })

  isTyping.value = false

  const assistantMessage: Message = {
    id: response.id,
    role: 'assistant',
    content: response.content,
    timestamp: new Date(response.timestamp)
  }

  messages.value.push(assistantMessage)
  scrollToBottom()
}

const handleMessageError = () => {
  isTyping.value = false

  // 移除流式消息（如果存在）
  if (streamingMessage.value) {
    const index = messages.value.findIndex(m => m === streamingMessage.value)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    streamingMessage.value = null
  }

  // 添加错误消息
  setTimeout(() => {
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '抱歉，我现在无法响应。请稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
    scrollToBottom()
  }, 500)
}

const stopGeneration = () => {
  // 停止流式生成
  if (streamController.value) {
    streamController.value.abort()
    streamController.value = null
  }

  // 如果有正在生成的流式消息，标记为已中断
  if (streamingMessage.value) {
    streamingMessage.value.content += '\n\n[生成已停止]'
    streamingMessage.value = null
  }

  isLoading.value = false
  isTyping.value = false
}

const exportChat = () => {
  const chatData = {
    character: character.value,
    messages: messages.value,
    exportedAt: new Date()
  }

  const blob = new Blob([JSON.stringify(chatData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-${character.value?.name}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearChatWithConfirm = async () => {
  // TODO: 使用设计系统的确认对话框替换 ElMessageBox
  if (confirm('确定要清空所有对话记录吗？此操作无法撤销。')) {
    messages.value = []
    // TODO: 使用设计系统的消息组件替换 ElMessage
    console.log('对话已清空')
  }
}



const rateMessage = (message: any) => {
  // TODO: 使用设计系统的消息组件替换 ElMessage
  console.log('消息评价功能暂未实现')
}

const fetchChatData = async () => {
  try {
    const response = await http.get(`/chats/${route.params.characterId}`)
    character.value = response.character
    messages.value = response.messages || []
  } catch (error) {
    console.error('Failed to fetch chat data:', error)
    // TODO: 使用设计系统的消息组件替换 ElMessage
    console.log('加载对话数据失败')
    // 设置默认角色信息
    character.value = {
      id: route.params.characterId as string,
      name: '助手',
      avatar: '/default-avatar.png',
      creator: '系统',
      description: '一个友好的AI助手',
      chatCount: 0,
      rating: 5.0
    }
    messages.value = []
  }
}

onMounted(async () => {
  await fetchChatData()

  // 检测移动端
  checkMobile()

  // 初始化容器
  await nextTick()
  initializeContainer()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 移动端优化：在移动端默认折叠侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
    // 禁止页面缩放
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    }
  }
})

// 清理事件监听器
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(cleanup)

// 监听消息变化
watch(messages, () => {
  // 如果启用虚拟滚动，更新显示
  if (shouldUseVirtualScroll.value) {
    updateVirtualScroll()
  }
  scrollToBottom()
}, { deep: true })

// 监听容器大小变化
watch(containerHeight, () => {
  if (shouldUseVirtualScroll.value) {
    updateVirtualScroll()
  }
})

// 防抖函数
const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 添加窗口大小变化监听
const handleResize = debounce(() => {
  calculateLayoutDimensions()
  checkMobile()

  if (shouldUseVirtualScroll.value) {
    updateVirtualScroll()
  }
}, 100) // 100ms防抖

// 动态高度计算函数
const calculateLayoutDimensions = () => {
  const vh = window.innerHeight
  const vw = window.innerWidth

  layoutDimensions.viewportHeight = vh
  layoutDimensions.viewportWidth = vw

  // 更新CSS变量以使用实际的浏览器窗口尺寸
  const root = document.documentElement
  root.style.setProperty('--actual-viewport-height', `${vh}px`)
  root.style.setProperty('--actual-viewport-width', `${vw}px`)

  // 优化大屏幕下的侧边栏宽度分配
  if (vw >= 1920) { // 1080p+ 大屏幕
    layoutDimensions.sidebarWidth = 380
  } else if (vw >= 1680) { // 高分辨率桌面
    layoutDimensions.sidebarWidth = 360
  } else if (vw >= 1536) { // 2xl
    layoutDimensions.sidebarWidth = 340
  } else if (vw >= 1280) { // xl
    layoutDimensions.sidebarWidth = 320
  } else if (vw >= 1024) { // lg
    layoutDimensions.sidebarWidth = 280
  } else {
    layoutDimensions.sidebarWidth = 0 // 移动端
  }

  // 优化大屏幕下的输入区域高度
  let baseInputHeight = 120
  let maxInputHeight = 200

  if (vh >= 1080) { // 高分辨率屏幕
    baseInputHeight = 140
    maxInputHeight = Math.min(280, vh * 0.22)
  } else if (vh >= 900) {
    baseInputHeight = 130
    maxInputHeight = Math.min(240, vh * 0.24)
  } else {
    baseInputHeight = 120
    maxInputHeight = Math.min(200, vh * 0.25)
  }

  layoutDimensions.inputAreaHeight = Math.max(baseInputHeight, maxInputHeight)

  // 计算消息区域可用高度
  const availableHeight = vh - layoutDimensions.headerHeight - layoutDimensions.inputAreaHeight
  layoutDimensions.minMessagesHeight = Math.max(300, availableHeight * 0.7) // 大屏幕下增加最小高度

  // 更新容器高度
  if (messagesContainer.value) {
    containerHeight.value = availableHeight
  }

  // 更新CSS变量
  updateLayoutCSSVariables()
}

// 更新CSS变量
const updateLayoutCSSVariables = () => {
  const root = document.documentElement
  root.style.setProperty('--viewport-height', `${layoutDimensions.viewportHeight}px`)
  root.style.setProperty('--sidebar-width', `${layoutDimensions.sidebarWidth}px`)
  root.style.setProperty('--header-height', `${layoutDimensions.headerHeight}px`)
  root.style.setProperty('--input-area-height', `${layoutDimensions.inputAreaHeight}px`)
  root.style.setProperty('--messages-height', `${layoutDimensions.viewportHeight - layoutDimensions.headerHeight - layoutDimensions.inputAreaHeight}px`)

  // 大屏幕优化变量
  const vw = layoutDimensions.viewportWidth
  const vh = layoutDimensions.viewportHeight

  // 动态内容最大宽度
  let contentMaxWidth = 900
  if (vw >= 1920) {
    contentMaxWidth = 1200
  } else if (vw >= 1680) {
    contentMaxWidth = 1100
  } else if (vw >= 1536) {
    contentMaxWidth = 1000
  }
  root.style.setProperty('--content-max-width', `${contentMaxWidth}px`)

  // 消息最大宽度（百分比）
  let messageMaxWidthPercent = 70
  if (vw >= 1920) {
    messageMaxWidthPercent = 65
  } else if (vw >= 1680) {
    messageMaxWidthPercent = 68
  }
  root.style.setProperty('--message-max-width-percent', `${messageMaxWidthPercent}%`)

  // 侧边栏在大屏幕上的优化宽度
  let optimizedSidebarWidth = layoutDimensions.sidebarWidth
  if (vw >= 1920 && vh >= 1080) {
    optimizedSidebarWidth = Math.min(400, vw * 0.2) // 最大400px或屏幕宽度的20%
  }
  root.style.setProperty('--optimized-sidebar-width', `${optimizedSidebarWidth}px`)
}

// 初始化时设置容器高度
const initializeContainer = () => {
  calculateLayoutDimensions()
  if (messagesContainer.value) {
    if (shouldUseVirtualScroll.value) {
      updateVirtualScroll()
    }
  }
}

// 场景切换方法
const changeScene = (sceneId: string) => {
  const sceneIndex = availableScenes.value.findIndex(scene => scene.id === sceneId)
  if (sceneIndex !== -1 && currentSceneId.value !== sceneId) {
    // 创建平滑过渡效果
    const newScene = availableScenes.value[sceneIndex]

    // 预加载新场景图片
    const img = new Image()
    img.onload = () => {
      // 图片加载完成后执行切换动画
      performSceneTransition(sceneIndex, sceneId, newScene)
    }
    img.onerror = () => {
      // 即使图片加载失败也执行切换（可能有默认背景）
      performSceneTransition(sceneIndex, sceneId, newScene)
    }
    img.src = newScene.url
  }
}

// 执行场景过渡动画
const performSceneTransition = (sceneIndex: number, sceneId: string, newScene: any) => {
  // 更新背景图层数据
  if (backgroundLayers.value.length <= sceneIndex) {
    // 确保有足够的图层
    backgroundLayers.value = availableScenes.value.slice(0, sceneIndex + 1)
  }

  // 添加新场景到图层（如果还没有）
  if (!backgroundLayers.value.find(layer => layer.id === newScene.id)) {
    backgroundLayers.value.push(newScene)
  }

  // 执行淡入淡出动画
  activeBackgroundIndex.value = sceneIndex
  currentSceneId.value = sceneId
  showSceneSelector.value = false

  // 可选：添加场景切换提示
  if (newScene.name) {
    console.log(`场景已切换到: ${newScene.name}`)
  }
}

const toggleSceneSelector = () => {
  showSceneSelector.value = !showSceneSelector.value
}

const onAutoDetectChange = () => {
  if (autoDetectScene.value) {
    // 启用自动检测时，分析最近的消息
    if (messages.value.length > 0) {
      const lastMessage = messages.value[messages.value.length - 1]
      detectSceneFromMessage(lastMessage.content)
    }
  }
}

// 从消息内容检测场景
const detectSceneFromMessage = (message: string) => {
  if (!message || !autoDetectScene.value) return

  for (const scene of availableScenes.value) {
    if (scene.keywords.some(keyword => message.includes(keyword))) {
      if (currentSceneId.value !== scene.id) {
        changeScene(scene.id)
        break
      }
    }
  }
}

// 监听消息变化以触发场景自动检测
watch(messages, (newMessages) => {
  if (autoDetectScene.value && newMessages.length > 0) {
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage.role === 'assistant') {
      detectSceneFromMessage(lastMessage.content)
    }
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

// 场景背景样式
.scene-background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.scene-background-layer {
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
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    opacity: 0.4; /* 背景半透明, 保证文字可读性 */
    transform: scale(1);
  }

  &.fade-out {
    opacity: 0 !important;
    transform: scale(0.95);
  }

  // 场景切换时的特殊动画效果
  &.scene-entering {
    animation: sceneEnter 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  }

  &.scene-leaving {
    animation: sceneLeave 0.6s cubic-bezier(0.55, 0, 0.45, 1) forwards;
  }

  // 添加遮罩层确保文字可读性
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(18, 18, 20, 0.75) 0%,
      rgba(28, 28, 32, 0.65) 30%,
      rgba(18, 18, 20, 0.8) 70%,
      rgba(12, 12, 16, 0.85) 100%
    );
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
}

// 场景切换动画关键帧
@keyframes sceneEnter {
  from {
    opacity: 0;
    transform: scale(1.1) translateY(20px);
    filter: blur(10px);
  }
  60% {
    opacity: 0.2;
    transform: scale(1.02) translateY(5px);
    filter: blur(2px);
  }
  to {
    opacity: 0.4;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

@keyframes sceneLeave {
  from {
    opacity: 0.4;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
  40% {
    opacity: 0.15;
    transform: scale(0.98) translateY(-5px);
    filter: blur(1px);
  }
  to {
    opacity: 0;
    transform: scale(0.9) translateY(-15px);
    filter: blur(5px);
  }
}

// 场景选择器样式
.scene-selector-container {
  position: relative;

  .scene-selector-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .scene-icon {
      font-size: 16px;
    }

    .scene-name {
      font-size: 14px;
      font-weight: 500;
    }

    .dropdown-arrow {
      font-size: 12px;
      transition: transform 0.2s ease;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }
}

.scene-selector-panel {
  position: fixed;
  top: 60px; /* 刚好为聊天头部的高度 */
  right: 25px; /* 距离右边缘 */
  width: 320px;
  max-height: 400px;
  background: rgba(28, 28, 32, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  pointer-events: auto; /* 确保面板可以接收点击事件 */

  // 确保面板不会超出屏幕边界
  @media (max-width: 400px) {
    width: calc(100vw - 50px);
    right: 25px;
  }

  @media (max-height: 500px) {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }

  // 移动端优化
  @include mobile-only {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(90vw);
    max-width: 320px;
    right: auto;
  }

  // 确保面板在屏幕可见区域内 - 添加背景遮罩
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 998; /* 降低z-index，确保不会阻挡面板交互 */
    pointer-events: none; /* 让背景不阻挡点击事件 */
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    .auto-detect-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .scene-backgrounds-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
    pointer-events: auto; /* 确保网格可以接收点击事件 */

    .scene-background-item {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      pointer-events: auto; /* 确保项目可以接收点击事件 */

      &:hover {
        border-color: rgba($primary-500, 0.6);
        transform: translateY(-2px);
      }

      &.active {
        border-color: $primary-500;
        box-shadow: 0 0 0 1px $primary-500;
      }

      .scene-thumbnail {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        pointer-events: none; /* 让图片不阻挡点击事件 */
      }

      .scene-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        padding: 12px 8px 8px;
        pointer-events: none; /* 让覆盖层不阻挡点击事件 */

        .check-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          color: white;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      }

      .scene-name {
        position: absolute;
        bottom: 8px;
        left: 8px;
        right: 8px;
        color: white;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.2;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        pointer-events: none; /* 让文字不阻挡点击事件 */
      }
    }
  }

  // AI自动检测开关
  .scene-auto-detect {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: auto; /* 确保开关区域可以接收点击事件 */

    .scene-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;

      input[type="checkbox"] {
        pointer-events: auto; /* 确保复选框可以接收点击事件 */
      }

      span {
        pointer-events: none; /* 让文字不阻挡点击事件 */
      }
    }
  }
}
@import '@/styles/mixins.scss';

.chat-session-container {
  display: flex;
  height: var(--viewport-height, 100vh);
  max-height: var(--viewport-height, 100vh);
  overflow: hidden;
  background: linear-gradient(135deg, $dark-bg-primary 0%, rgba($dark-bg-secondary, 0.8) 100%);
  color: $text-primary;

  /* 聊天页面完全适应浏览器框架 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;

  // 移动端优化
  @include mobile-only {
    flex-direction: column;
    height: var(--viewport-height, 100vh);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
  }

  // 桌面端优化 - 使用CSS变量实现动态布局
  @include desktop-up {
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      max-width: calc(100vw - var(--sidebar-width, 320px));
    }

    .chat-messages {
      height: var(--messages-height, calc(100vh - 60px - 120px));
      min-height: 400px;
    }

    .grok-input-area {
      height: var(--input-area-height, 120px);
      min-height: 120px;
      max-height: 200px;
    }
  }

  /* 全屏模式移动端优化 */
  &.fullscreen {
    .sidebar {
      display: none;
    }

    .chat-main {
      height: var(--viewport-height, 100vh);
    }

    .chat-header {
      display: none;
    }

    .message-area {
      height: calc(var(--viewport-height, 100vh) - 100px);
    }

    .input-area {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: $dark-bg-primary;
      border-top: 1px solid $bg-tertiary;
      padding: 12px;
    }
  }
}

// 移动端遮罩层
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba($dark-bg-primary, 0.8);
  backdrop-filter: blur(4px);
  z-index: 999;

  @include desktop-up {
    display: none;
  }
}

// 侧边栏样式
.sidebar {
  width: var(--optimized-sidebar-width, var(--sidebar-width, 320px));
  background: rgba($dark-bg-secondary, 0.95);
  border-right: 1px solid rgba($primary-500, 0.2);
  display: flex;
  flex-direction: column;
  transition: all $transition-base;
  position: relative;
  backdrop-filter: blur(10px);

  // 桌面端动态宽度调整
  @include desktop-up {
    width: var(--optimized-sidebar-width, var(--sidebar-width, 320px));
    flex-shrink: 0;
  }

  // 大屏幕优化（1920px+）
  @media (min-width: 1920px) {
    width: var(--optimized-sidebar-width, 380px);
  }

  &.sidebar-collapsed {
    width: 60px;

    @include desktop-up {
      width: 60px;
    }
  }

  // 移动端侧边栏
  @include mobile-only {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    width: 280px;
    transform: translateX(-100%);

    &:not(.sidebar-collapsed) {
      transform: translateX(0);
    }
  }

  .sidebar-toggle {
    position: absolute;
    top: $space-5;
    right: -15px;
    z-index: 10;
    width: 30px;
    height: 30px;
    background: rgba($primary-500, 0.2);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary-300;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      background: rgba($primary-500, 0.3);
      transform: scale(1.1);
    }

    &.sidebar-toggle-collapsed {
      right: -15px;
    }

    // 移动端切换按钮
    @include mobile-only {
      position: fixed;
      top: $space-4;
      right: $space-4;
      z-index: 1001;
      background: rgba($primary-500, 0.9);
      border-color: rgba($primary-500, 0.6);
    }
  }

  .character-info {
    padding: $space-6 $space-5;
    border-bottom: 1px solid rgba($primary-500, 0.1);

    // 移动端角色信息
    @include mobile-only {
      padding: $space-4;
    }

    .character-header {
      display: flex;
      align-items: flex-start;
      gap: $space-4;

      .character-avatar-wrapper {
        position: relative;

        .character-avatar {
          width: 60px;
          height: 60px;
          border-radius: $border-radius-lg;
          object-fit: cover;
          border: 2px solid rgba($primary-500, 0.3);
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: $gray-500;
          border: 2px solid rgba($dark-bg-secondary, 0.95);

          &.online {
            background: $success-color;
          }
        }
      }

      .character-details {
        flex: 1;

        .character-name {
          margin: 0 0 $space-1;
          font-size: $font-size-lg;
          font-weight: $font-weight-semibold;
          color: $text-primary;
        }

        .character-creator {
          margin: 0 0 $space-2;
          font-size: $font-size-sm;
          color: $text-tertiary;
        }

        .character-stats {
          display: flex;
          gap: $space-4;

          .stat-item {
            display: flex;
            align-items: center;
            gap: $space-1;
            font-size: $font-size-xs;
            color: $text-tertiary;

            .el-icon {
              color: $secondary-400;
            }
          }
        }
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $space-2;
    padding: $space-4 $space-5;
    border-bottom: 1px solid rgba($primary-500, 0.1);

    // 移动端快速操作
    @include mobile-only {
      grid-template-columns: repeat(3, 1fr);
      padding: $space-3 $space-4;
    }

    .quick-action-btn {
      width: 40px;
      height: 40px;
      background: rgba($primary-500, 0.1);
      border: 1px solid rgba($primary-500, 0.2);
      border-radius: $border-radius-base;
      color: $primary-300;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all $transition-base;

      &:hover:not(:disabled) {
        background: rgba($primary-500, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($primary-500, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.danger {
        border-color: rgba($error-color, 0.3);
        color: $error-color;

        &:hover {
          background: rgba($error-color, 0.1);
        }
      }
    }
  }

  .sillytavern-controls {
    padding: $space-4 $space-5;
    border-bottom: 1px solid rgba($primary-500, 0.1);

    // 移动端控制面板
    @include mobile-only {
      padding: $space-3 $space-4;
    }
  }

  .settings-panel {
    flex: 1;
    padding: $space-5;
    overflow-y: auto;

    // 移动端设置面板
    @include mobile-only {
      padding: $space-4;
    }

    h3 {
      margin: 0 0 $space-5;
      font-size: $font-size-lg;
      color: $text-primary;
      font-weight: $font-weight-semibold;
    }

    .setting-group {
      margin-bottom: $space-5;

      label {
        display: block;
        margin-bottom: $space-2;
        font-size: $font-size-sm;
        color: $text-secondary;
        font-weight: $font-weight-medium;
      }

      .tavern-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: rgba($gray-700, 0.5);
        outline: none;
        opacity: 0.8;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }

        &::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: $primary-500;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        &::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: $primary-500;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: $space-2;
        cursor: pointer;

        .tavern-checkbox {
          width: 18px;
          height: 18px;
          accent-color: $primary-500;
          border-radius: 4px;
        }
      }

      .el-select {
        width: 100%;
      }

      .el-checkbox {
        color: #d1d5db;
      }
    }
  }
}

// 主聊天区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  // 桌面端优化布局
  @include desktop-up {
    max-width: calc(100vw - var(--optimized-sidebar-width, var(--sidebar-width, 320px)));
  }

  // 大屏幕优化（1920px+）
  @media (min-width: 1920px) {
    max-width: calc(100vw - var(--optimized-sidebar-width, 380px));
  }
  }

.chat-header {
  height: 60px;
  background: rgba(30, 30, 40, 0.95);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;

  .chat-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #c084fc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      // 移动端优化
      @include mobile-only {
        width: 40px;
        height: 40px;
      }
    }

    .chat-header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .session-title {
        font-size: 16px;
        font-weight: 600;
        color: #f3f4f6;
      }

      .message-count {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .chat-header-actions {
    display: flex;
    gap: 8px;
  }
}

// 消息区域
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;
  min-height: 0; // 确保可以收缩

  // 桌面端使用固定高度避免布局问题
  @include desktop-up {
    height: var(--messages-height, calc(100vh - 60px - 120px));
    flex: none;
    min-height: 400px;
    max-height: calc(var(--viewport-height, 100vh) - var(--header-height, 60px) - var(--input-area-height, 120px));
  }


  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;

      .el-icon {
        font-size: 32px;
        color: #8b5cf6;
      }
    }

    h3 {
      margin: 0 0 10px;
      font-size: 24px;
      color: #f3f4f6;
    }

    p {
      margin: 0 0 30px;
      color: #9ca3af;
      font-size: 16px;
    }

    .suggested-messages {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;

      .suggestion-btn {
        padding: 8px 16px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 20px;
        color: #c084fc;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }
      }
    }
  }

  .message-wrapper {
    margin-bottom: 20px;

    .message-item {
      display: flex;
      gap: 12px;

      &.user {
        flex-direction: row-reverse;

        .message-content {
          background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
          color: white;
        }
      }

      &.assistant {
        .message-content {
          background: rgba(30, 30, 40, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
      }

      .message-avatar {
        width: 40px;
        height: 40px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          object-fit: cover;
        }

        .user-avatar {
          width: 100%;
          height: 100%;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c084fc;
        }
      }

      .message-content {
        max-width: var(--message-max-width-percent, 70%);
        padding: 12px 16px;
        border-radius: 16px;
        position: relative;

        // 大屏幕下的消息内容优化
        @media (min-width: 1920px) {
          padding: 14px 18px;
          font-size: 16px; // 稍微增大字体
          line-height: 1.7;
        }

        @media (min-width: 1680px) {
          padding: 13px 17px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;

          .message-sender {
            font-weight: 600;
            color: inherit;
          }

          .message-time {
            opacity: 0.7;
          }
        }

        .message-text {
          line-height: 1.6;
          word-break: break-word;

          :deep(strong) {
            font-weight: 600;
          }

          :deep(em) {
            font-style: italic;
          }

          :deep(code) {
            background: rgba(0, 0, 0, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
          }
        }

        .message-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;

          .action-btn {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.1);
            border: none;
            color: inherit;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
            transition: all 0.3s ease;

            &:hover {
              opacity: 1;
              background: rgba(0, 0, 0, 0.2);
            }
          }
        }

        &:hover .message-actions {
          opacity: 1;
        }
      }
    }
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;

    .typing-dots {
      display: flex;
      gap: 3px;

      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $text-tertiary;
        animation: typing-bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }

    .typing-text {
      font-size: $font-size-sm;
      color: $text-tertiary;
    }
  }

  .scroll-to-bottom {
    position: absolute;
    bottom: $space-5;
    right: $space-5;
    background: rgba($primary-500, 0.9);
    color: white;
    border-radius: $border-radius-full;
    padding: $space-2 $space-3;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $space-1;
    font-size: $font-size-xs;
    transition: all $transition-base;
    box-shadow: 0 4px 12px rgba($primary-500, 0.3);

    &:hover {
      background: rgba($primary-500, 1);
      transform: translateY(-2px);
    }

    // 移动端滚动按钮
    @include mobile-only {
      bottom: $space-20; // 避免被输入框遮挡
      right: $space-4;
      padding: $space-3;
    }
  }
}

// 现代化输入区域
.modern-input-area {
  background: rgba($dark-bg-secondary, 0.95);
  border-top: 1px solid rgba($primary-500, 0.2);
  padding: $space-5;
  backdrop-filter: blur(10px);

  // 移动端输入区域
  @include mobile-only {
    padding: $space-4;
    position: relative;
    z-index: 100;
  }

  .input-container {
    max-width: 900px;
    margin: 0 auto;
  }

  // 主输入卡片 - 现代化圆角设计
  .input-card {
    background: rgba($gray-900, 0.8);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: 20px;
    padding: $space-2;
    display: flex;
    align-items: flex-end;
    gap: $space-2;
    transition: all $transition-base;
    backdrop-filter: blur(10px);

    &:hover {
      border-color: rgba($primary-500, 0.5);
      box-shadow: 0 0 0 1px rgba($primary-500, 0.1);
    }

    &:focus-within {
      border-color: $primary-500;
      box-shadow: 0 0 0 2px rgba($primary-500, 0.2);
    }

    // 移动端优化
    @include mobile-only {
      border-radius: 16px;
      padding: $space-1;
      gap: $space-1;
    }
  }

  // 前置功能区域
  .input-prefix-actions {
    display: flex;
    align-items: center;

    .action-group {
      display: flex;
      align-items: center;
      gap: $space-1;
    }

    .tool-toggle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba($primary-500, 0.1);
      border: 1px solid rgba($primary-500, 0.2);
      color: $primary-400;
      transition: all $transition-base;

      &:hover {
        background: rgba($primary-500, 0.2);
        transform: scale(1.05);
      }

      &.active {
        background: $primary-500;
        color: white;
        border-color: $primary-500;
      }

      // 移动端优化
      @include mobile-only {
        width: 32px;
        height: 32px;
      }
    }

    .expanded-tools {
      display: flex;
      align-items: center;
      gap: $space-1;
      margin-left: $space-1;
      padding-left: $space-1;
      border-left: 1px solid rgba($gray-700, 0.5);

      .tool-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba($gray-700, 0.3);
        border: 1px solid rgba($gray-600, 0.3);
        color: $text-secondary;
        transition: all $transition-base;

        &:hover {
          background: rgba($gray-600, 0.5);
          color: $text-primary;
        }

        &.active {
          background: rgba($primary-500, 0.3);
          color: $primary-400;
          border-color: rgba($primary-500, 0.4);
        }

        // 移动端优化
        @include mobile-only {
          width: 28px;
          height: 28px;
        }
      }
    }
  }

  // 中央输入区域
  .input-main {
    flex: 1;
    position: relative;
    min-width: 0;

    .message-input-modern {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: $text-primary;
      font-size: $font-size-base;
      line-height: $line-height-normal;
      resize: none;
      padding: $space-3 $space-2;
      min-height: 24px;
      max-height: 120px;
      font-family: $font-family-base;

      // 移动端优化
      @include mobile-only {
        font-size: 16px; // 防止iOS缩放
        padding: $space-2;
      }

      &::placeholder {
        color: $text-muted;
        opacity: 0.7;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .input-indicators {
      position: absolute;
      bottom: -20px;
      right: $space-2;
      display: flex;
      align-items: center;
      gap: $space-3;

      .char-count {
        font-size: $font-size-xs;
        color: $text-muted;
        opacity: 0.7;
      }

      .voice-recording-indicator {
        display: flex;
        align-items: center;
        gap: $space-1;
        font-size: $font-size-xs;
        color: $error-color;

        .recording-dot {
          width: 8px;
          height: 8px;
          background: $error-color;
          border-radius: 50%;
          animation: recording-pulse 1.5s ease-in-out infinite;
        }

        span {
          font-weight: $font-weight-medium;
        }
      }
    }
  }

  // 后置功能区域
  .input-suffix-actions {
    display: flex;
    align-items: center;
    gap: $space-1;

    .voice-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba($gray-700, 0.3);
      border: 1px solid rgba($gray-600, 0.3);
      color: $text-secondary;
      transition: all $transition-base;

      &:hover:not(:disabled) {
        background: rgba($gray-600, 0.5);
        color: $text-primary;
      }

      &.recording {
        background: rgba($error-color, 0.2);
        color: $error-color;
        border-color: rgba($error-color, 0.3);
        animation: recording-pulse 1.5s ease-in-out infinite;
      }

      // 移动端优化
      @include mobile-only {
        width: 32px;
        height: 32px;
      }
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $primary-500;
      border: 1px solid $primary-500;
      color: white;
      transition: all $transition-base;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        background: $primary-600;
        border-color: $primary-600;
        transform: scale(1.05);
      }

      &:active:not(:disabled) {
        transform: scale(0.95);
      }

      &:disabled {
        background: rgba($gray-600, 0.5);
        border-color: rgba($gray-600, 0.5);
        cursor: not-allowed;
        transform: none;
      }

      &.stop-btn {
        background: $error-color;
        border-color: $error-color;

        &:hover:not(:disabled) {
          background: darken($error-color, 10%);
          border-color: darken($error-color, 10%);
        }
      }

      // 移动端优化
      @include mobile-only {
        width: 36px;
        height: 36px;
      }
    }
  }

  // 快捷提示栏
  .quick-suggestions {
    margin-top: $space-4;
    padding: 0 $space-2;

    .suggestions-container {
      display: flex;
      align-items: center;
      gap: $space-2;
      flex-wrap: wrap;

      .suggestions-label {
        font-size: $font-size-sm;
        color: $text-tertiary;
        font-weight: $font-weight-medium;
      }

      .suggestion-chip {
        padding: $space-1 $space-3;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: $border-radius-full;
        color: $primary-400;
        font-size: $font-size-sm;
        cursor: pointer;
        transition: all $transition-base;
        white-space: nowrap;

        &:hover {
          background: rgba($primary-500, 0.2);
          border-color: rgba($primary-500, 0.3);
          color: $primary-300;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }

  // 工具面板
  .tool-panels {
    margin-top: $space-3;
    padding: 0 $space-2;

    .tool-panel {
      background: rgba($gray-900, 0.6);
      border: 1px solid rgba($primary-500, 0.2);
      border-radius: 12px;
      padding: $space-3;
      margin-bottom: $space-2;
      backdrop-filter: blur(10px);

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $space-3;

        span {
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
          color: $text-secondary;
        }
      }

      &.emoji-panel {
        .emoji-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
          gap: $space-1;
          max-width: 300px;

          .emoji-btn-modern {
            width: 40px;
            height: 40px;
            border: none;
            background: rgba($gray-700, 0.3);
            border-radius: $border-radius-base;
            cursor: pointer;
            font-size: $font-size-lg;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all $transition-base;

            &:hover {
              background: rgba($primary-500, 0.2);
              transform: scale(1.1);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }
      }

      &.image-panel {
        // 图像面板样式由组件内部管理
      }
    }
  }
}

// 录音脉冲动画
@keyframes recording-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

// Grok风格输入区域样式
.grok-input-area {
  background: rgba($dark-bg-secondary, 0.95);
  border-top: 1px solid rgba($primary-500, 0.2);
  padding: $space-5;
  backdrop-filter: blur(10px);

  // 桌面端使用固定高度
  @include desktop-up {
    height: var(--input-area-height, 120px);
    min-height: 120px;
    max-height: 200px;
    flex-shrink: 0;
    overflow-y: auto;
    padding: $space-4;
  }

  // 移动端输入区域
  @include mobile-only {
    padding: $space-4;
    position: relative;
    z-index: 100;
  }

  .input-container {
    max-width: var(--content-max-width, 900px);
    margin: 0 auto;
  }

  .grok-input-card {
    background: rgba($gray-900, 0.8);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: 20px;
    padding: $space-2;
    display: flex;
    align-items: flex-end;
    gap: $space-2;
    transition: all $transition-base;
    backdrop-filter: blur(10px);

    &:hover {
      border-color: rgba($primary-500, 0.5);
      box-shadow: 0 0 0 1px rgba($primary-500, 0.1);
    }

    &:focus-within {
      border-color: $primary-500;
      box-shadow: 0 0 0 2px rgba($primary-500, 0.2);
    }

    // 移动端优化
    @include mobile-only {
      border-radius: 16px;
      padding: $space-1;
      gap: $space-1;
    }
  }

  .input-toolbar-left,
  .input-toolbar-right {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    flex-shrink: 0;
  }

  .input-toolbar-left {
    align-items: flex-start;
  }

  .input-toolbar-right {
    align-items: flex-end;
  }

  .grok-input-main {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .input-wrapper {
    position: relative;
  }

  .grok-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: $text-primary;
    font-size: $font-size-base;
    line-height: $line-height-normal;
    resize: none;
    padding: $space-3 $space-2;
    min-height: 24px;
    max-height: 120px;
    font-family: $font-family-base;

    // 移动端优化
    @include mobile-only {
      font-size: 16px; // 防止iOS缩放
      padding: $space-2;
    }

    &::placeholder {
      color: $text-muted;
      opacity: 0.7;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .input-status-bar {
    position: absolute;
    bottom: -$space-4;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font-size: $font-size-xs;

    .char-warning {
      color: $warning-color;
    }

    .voice-status {
      display: flex;
      align-items: center;
      gap: $space-1;
      color: $error-color;

      .recording-pulse {
        width: 8px;
        height: 8px;
        background: $error-color;
        border-radius: 50%;
        animation: recording-pulse 1.5s ease-in-out infinite;
      }
    }
  }

  .toolbar-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 12px;
    background: rgba($gray-800, 0.4);
    color: $text-secondary;
    cursor: pointer;
    transition: all $transition-base;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background: rgba($gray-700, 0.6);
      color: $text-primary;
      transform: translateY(-2px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &.active {
      background: rgba($primary-500, 0.2);
      color: $primary-300;
      border: 1px solid rgba($primary-500, 0.3);
    }

    &.recording {
      background: rgba($error-color, 0.2);
      color: $error-color;
      animation: recording-pulse 1.5s ease-in-out infinite;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    // 移动端优化
    @include mobile-only {
      width: 40px;
      height: 40px;
    }
  }

  .grok-suggestions {
    margin-top: $space-3;
    padding: 0 $space-2;

    .suggestions-track {
      display: flex;
      align-items: center;
      gap: $space-2;
      flex-wrap: wrap;

      .suggestion-chip {
        padding: $space-1 $space-3;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: $border-radius-full;
        color: $primary-400;
        font-size: $font-size-sm;
        cursor: pointer;
        transition: all $transition-base;
        white-space: nowrap;

        &:hover {
          background: rgba($primary-500, 0.2);
          border-color: rgba($primary-500, 0.3);
          color: $primary-300;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }

  .grok-tool-panel {
    margin-top: $space-3;
    background: rgba($gray-900, 0.6);
    border: 1px solid rgba($primary-500, 0.2);
    border-radius: 12px;
    padding: $space-3;
    backdrop-filter: blur(10px);

    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: $space-2;
      margin-bottom: $space-2;

      .tool-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $space-1;
        padding: $space-2;
        background: rgba($gray-700, 0.3);
        border: 1px solid rgba($gray-600, 0.3);
        border-radius: 8px;
        color: $text-secondary;
        cursor: pointer;
        transition: all $transition-base;
        font-size: $font-size-xs;

        &:hover {
          background: rgba($gray-600, 0.5);
          color: $text-primary;
        }

        &.active {
          background: rgba($primary-500, 0.3);
          color: $primary-400;
          border-color: rgba($primary-500, 0.4);
        }

        .tool-emoji {
          font-size: $font-size-lg;
        }

        .tool-label {
          font-weight: $font-weight-medium;
        }
      }
    }

    .sub-panel {
      margin-top: $space-2;
      padding-top: $space-2;
      border-top: 1px solid rgba($gray-600, 0.3);

      .emoji-quick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
        gap: $space-1;

        .quick-emoji {
          width: 40px;
          height: 40px;
          border: none;
          background: rgba($gray-700, 0.3);
          border-radius: $border-radius-base;
          cursor: pointer;
          font-size: $font-size-lg;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-base;

          &:hover {
            background: rgba($primary-500, 0.2);
            transform: scale(1.1);
          }

          &:active {
            transform: scale(0.95);
          }
        }
      }
    }
  }
}

// 兼容性：保留原有输入区域样式
.chat-input-area {
  background: rgba($dark-bg-secondary, 0.95);
  border-top: 1px solid rgba($primary-500, 0.2);
  padding: $space-5;
  backdrop-filter: blur(10px);

  // 移动端输入区域
  @include mobile-only {
    padding: $space-4;
    position: relative;
    z-index: 100;
  }
}

// 底部交互区域整合
.bottom-interaction-area {
  background: rgba($dark-bg-secondary, 0.98);
  border-top: 1px solid rgba($primary-500, 0.3);
  padding: $space-4 $space-5;
  backdrop-filter: blur(15px);
  position: sticky;
  bottom: 0;
  z-index: 50;

  // 移动端优化
  @include mobile-only {
    padding: $space-3 $space-4;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
  }

  // 整合语音功能样式
  .integrated-voice-features {
    margin-top: $space-3;

    // 重写语音功能的布局，使其更适合底部区域
    :deep(.voice-input-section) {
      justify-content: center;
      padding: $space-3 0;
      border-top: 1px solid rgba($primary-500, 0.2);
      margin-top: $space-3;
    }

    :deep(.auto-voice-section) {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $space-2 0;
      margin-top: $space-2;
      border-top: 1px solid rgba($gray-700, 0.3);

      .auto-voice-toggle {
        background: transparent;
      }
    }

    :deep(.voice-settings-panel) {
      position: absolute;
      right: 0;
      top: $space-2;
    }

    // 移动端语音功能优化
    @include mobile-only {
      :deep(.voice-input-section) {
        padding: $space-2 0;
      }

      :deep(.auto-voice-section) {
        flex-direction: column;
        gap: $space-2;
        align-items: stretch;
      }
    }
  }
  .input-container {
    display: flex;
    gap: $space-3;
    align-items: flex-end;

    // 移动端输入容器
    @include mobile-only {
      gap: $space-2;
      flex-wrap: wrap;
    }

    .input-actions {
      display: flex;
      flex-direction: column;
      gap: $space-2;

      // 移动端操作按钮
      @include mobile-only {
        flex-direction: row;
        order: 2;
        width: 100%;
        justify-content: space-between;
        margin-top: $space-2;
      }
    }

    .input-wrapper {
      flex: 1;
      position: relative;

      // 移动端输入包装器
      @include mobile-only {
        order: 1;
        width: 100%;
      }

      .message-input {
        width: 100%;
        min-height: 44px; // 符合触控目标标准
        max-height: 120px;
        padding: $space-3 $space-4;
        background: rgba($gray-900, 0.8);
        border: 1px solid rgba($primary-500, 0.3);
        border-radius: $border-radius-xl;
        color: $text-primary;
        font-size: $font-size-base;
        line-height: $line-height-normal;
        resize: none;
        transition: all $transition-base;

        // 移动端输入框优化
        @include mobile-only {
          min-height: 48px; // 移动端增大触控目标
          padding: $space-4;
          font-size: 16px; // 防止iOS缩放
          border-radius: $border-radius-lg;
        }

        &:focus {
          outline: none;
          border-color: $primary-500;
          box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
        }

        &::placeholder {
          color: $text-muted;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .input-stats {
        position: absolute;
        bottom: -$space-5;
        right: 0;
        font-size: $font-size-xs;
        color: $text-muted;

        // 移动端统计信息
        @include mobile-only {
          bottom: -$space-4;
        }
      }
    }

    .send-actions {
      display: flex;
      flex-direction: column;
      gap: $space-2;

      // 移动端发送操作
      @include mobile-only {
        flex-direction: row;
        gap: $space-3;
      }

      .action-btn {
        min-width: 44px;
        min-height: 44px;
        border-radius: $border-radius-lg;
        transition: all $transition-base;

        // 移动端按钮优化
        @include mobile-only {
          min-width: 48px;
          min-height: 48px;
          padding: $space-3;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .emoji-picker {
    margin-top: $space-3;
    background: rgba($gray-900, 0.9);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: $border-radius-xl;
    padding: $space-3;
    backdrop-filter: blur(10px);

    // 移动端表情选择器
    @include mobile-only {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0;
      border-radius: $border-radius-xl $border-radius-xl 0 0;
      padding: $space-4;
      z-index: 1000;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
      gap: $space-2;
      max-width: 300px;

      // 移动端表情网格
      @include mobile-only {
        grid-template-columns: repeat(8, 1fr);
        max-width: none;
        gap: $space-1;
      }

      .emoji-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: transparent;
        border-radius: $border-radius-base;
        cursor: pointer;
        font-size: $font-size-lg;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all $transition-base;

        // 移动端表情按钮
        @include mobile-only {
          width: 48px;
          height: 48px;
          font-size: $font-size-xl;
        }

        &:hover {
          background: rgba($primary-500, 0.2);
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 图像消息样式 */
.message-image {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
}

.chat-image {
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
}

.chat-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-prompt {
  padding: 8px;
  background: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 图像预览样式 */
.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.preview-chat-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-image-info {
  width: 100%;
  text-align: left;
}

.preview-image-info h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.preview-image-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

// 响应式设计
@media (max-width: 1024px) {
  .sidebar {
    width: 280px;

    &.sidebar-collapsed {
      width: 50px;
    }
  }
}

@media (max-width: 768px) {
  .chat-session-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &.sidebar-collapsed {
      height: 60px;
    }

    .character-info {
      padding: 12px;

      .character-header {
        flex-direction: row;
        align-items: center;
        gap: 12px;

        .character-avatar-wrapper {
          width: 50px;
          height: 50px;
        }

        .character-details {
          .character-name {
            font-size: 16px;
          }

          .character-stats {
            font-size: 12px;
          }
        }
      }
    }

    .settings-panel {
      max-height: 150px;
      overflow-y: auto;
      padding: 12px;

      .setting-group {
        margin-bottom: 12px;

        label {
          font-size: 14px;
        }

        .el-slider {
          margin: 8px 0;
        }
      }
    }
  }

  .chat-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    padding: 12px 16px;

    .session-title {
      font-size: 16px;
    }

    .chat-header-actions {
      gap: 8px;

      .header-action-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
      }
    }
  }

  .chat-messages {
    padding: 12px;
    flex: 1;
    overflow-y: auto;

    .message-wrapper {
      .message-item {
        margin-bottom: 16px;

        .message-content {
          max-width: 90%;
          padding: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message-actions {
          margin-top: 8px;

          .action-btn {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
      }
    }

    .typing-indicator {
      padding: 8px 12px;
      font-size: 14px;
    }
  }

  .chat-input-area {
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);

    .input-container {
      .input-wrapper {
        textarea {
          font-size: 16px; /* 防止iOS自动缩放 */
          line-height: 1.4;
          padding: 12px;
          border-radius: 20px;
          resize: none;
        }
      }

      .input-actions {
        margin-top: 8px;
        justify-content: space-between;

        .left-actions, .right-actions {
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          font-size: 16px;
          border-radius: 50%;
        }
      }
    }

    .message-suggestions {
      margin-top: 8px;

      .suggestion-chip {
        font-size: 12px;
        padding: 6px 12px;
        margin: 2px 4px 2px 0;
      }
    }
  }

  /* 移动端特定的触摸优化 */
  .quick-actions {
    padding: 8px;

    .quick-action-btn {
      min-height: 44px; /* iOS推荐的最小触摸目标 */
      font-size: 14px;
    }
  }

}

/* 更小屏幕设备优化 */
@media (max-width: 480px) {
  .chat-session-container {
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    .character-info {
      .character-header {
        .character-details {
          .character-name {
            font-size: 14px;
          }

          .character-creator {
            font-size: 11px;
          }

          .character-stats {
            font-size: 11px;
            gap: 8px;
          }
        }
      }
    }
  }

  .chat-messages {
    padding: 8px 12px;

    .message-wrapper .message-item {
      .message-content {
        font-size: 13px;
        padding: 10px;
      }
    }
  }

  .chat-input-area {
    padding: 8px 12px;

    .input-container {
      .input-wrapper textarea {
        font-size: 16px;
        padding: 10px;
      }

      .input-actions {
        .action-btn {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
      }
    }
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .sidebar {
    max-height: 120px;

    &.sidebar-collapsed {
      height: 50px;
    }

    .character-info {
      .character-header {
        .character-details {
          .character-name {
            font-size: 14px;
          }
        }
      }
    }
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--dt-spacing-lg);
}

.voice-dialog {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--dt-spacing-lg);

    h3 {
      margin: 0;
      color: var(--dt-color-text-primary);
      font-size: var(--dt-font-size-xl);
      font-weight: var(--dt-font-weight-semibold);
    }
  }

  .modal-content {
    padding: var(--dt-spacing-md) 0;
  }
}

.image-preview-dialog {
  max-width: 80vw;
  max-height: 90vh;
  overflow: hidden;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--dt-spacing-lg);

    h3 {
      margin: 0;
      color: var(--dt-color-text-primary);
      font-size: var(--dt-font-size-xl);
      font-weight: var(--dt-font-weight-semibold);
    }
  }

  .image-preview-container {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-lg);
    align-items: center;
  }

  .preview-chat-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: var(--dt-radius-lg);
  }

  .preview-image-info {
    width: 100%;
    text-align: left;

    h4 {
      margin: 0 0 var(--dt-spacing-sm) 0;
      color: var(--dt-color-text-primary);
      font-size: var(--dt-font-size-lg);
      font-weight: var(--dt-font-weight-medium);
    }

    p {
      margin: 0;
      color: var(--dt-color-text-secondary);
      line-height: var(--dt-line-height-relaxed);
    }
  }
}

/* PWA和全屏应用优化 */
@media (display-mode: standalone) {
  .chat-session-container {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .chat-input-area {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
