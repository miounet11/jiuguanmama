<template>
  <div class="modern-input-demo">
    <div class="demo-header">
      <h1>现代化聊天输入界面演示</h1>
      <p>基于现代设计原则，参考 grok.com 等顶级聊天应用的界面设计</p>
    </div>

    <div class="demo-container">
      <!-- 模拟聊天消息 -->
      <div class="mock-chat-messages">
        <div class="message assistant">
          <div class="avatar">AI</div>
          <div class="content">
            <p>你好！我是你的AI助手。试试新的现代化输入区域吧！</p>
          </div>
        </div>
        <div class="message user">
          <div class="avatar">你</div>
          <div class="content">
            <p>这个新界面看起来很不错！</p>
          </div>
        </div>
      </div>

      <!-- 现代化输入区域 -->
      <div class="modern-input-area">
        <div class="input-container">
          <!-- 主输入区域 - 圆角卡片式设计 -->
          <div class="input-card">
            <!-- 前置功能按钮 -->
            <div class="input-prefix-actions">
              <div class="action-group">
                <button
                  @click="toggleExpandedTools"
                  class="tool-toggle"
                  :class="{ 'active': showExpandedTools }"
                  title="更多工具"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>

                <!-- 展开的工具面板 -->
                <div v-if="showExpandedTools" class="expanded-tools">
                  <button
                    @click="showEmojiPicker = !showEmojiPicker"
                    class="tool-btn"
                    :class="{ 'active': showEmojiPicker }"
                    title="表情"
                  >
                    😊
                  </button>
                  <button
                    @click="handleFileUpload"
                    class="tool-btn"
                    title="上传文件"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button
                    @click="showImageTools = !showImageTools"
                    class="tool-btn"
                    :class="{ 'active': showImageTools }"
                    title="图像工具"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- 中央输入区域 -->
            <div class="input-main">
              <textarea
                ref="inputRef"
                v-model="inputMessage"
                @keydown="handleKeyDown"
                @input="handleInput"
                placeholder="给 AI 发送消息..."
                class="message-input-modern"
                :rows="inputRows"
                :disabled="isLoading"
              />

              <!-- 输入状态指示器 -->
              <div class="input-indicators">
                <span v-if="inputMessage.length > 0" class="char-count">
                  {{ inputMessage.length }}/2000
                </span>
                <div v-if="isVoiceRecording" class="voice-recording-indicator">
                  <div class="recording-dot"></div>
                  <span>录音中...</span>
                </div>
              </div>
            </div>

            <!-- 后置功能按钮 -->
            <div class="input-suffix-actions">
              <!-- 语音输入按钮 -->
              <button
                v-if="!showExpandedTools"
                @click="startVoiceInput"
                class="voice-btn"
                :class="{ 'recording': isVoiceRecording }"
                :title="isVoiceRecording ? '停止录音' : '语音输入'"
                :disabled="isLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>

              <!-- 发送/停止按钮 -->
              <button
                v-if="isLoading"
                @click="stopGeneration"
                class="send-btn stop-btn"
                title="停止生成"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18"></rect>
                </svg>
              </button>
              <button
                v-else
                @click="sendMessage"
                class="send-btn"
                :disabled="!canSend"
                title="发送消息 (Enter)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

          <!-- 快捷提示栏 -->
          <div v-if="showQuickSuggestions && suggestedMessages.length > 0" class="quick-suggestions">
            <div class="suggestions-container">
              <span class="suggestions-label">建议：</span>
              <button
                v-for="suggestion in suggestedMessages.slice(0, 3)"
                :key="suggestion"
                @click="sendSuggestedMessage(suggestion)"
                class="suggestion-chip"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- 展开的工具面板内容 -->
          <div v-if="showExpandedTools" class="tool-panels">
            <!-- 表情选择器 -->
            <div v-if="showEmojiPicker" class="tool-panel emoji-panel">
              <div class="panel-header">
                <span>选择表情</span>
                <button
                  class="close-btn"
                  @click="showEmojiPicker = false"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div class="emoji-grid-modern">
                <button
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  @click="addEmoji(emoji)"
                  class="emoji-btn-modern"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- 图像工具面板 -->
            <div v-if="showImageTools" class="tool-panel image-panel">
              <div class="panel-header">
                <span>图像工具</span>
                <button
                  class="close-btn"
                  @click="showImageTools = false"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div class="image-tools-content">
                <p>图像工具面板 - 可以添加图像生成、编辑等功能</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="demo-footer">
      <h3>设计特点</h3>
      <ul>
        <li>✨ 现代化圆角卡片设计</li>
        <li>🎯 简化按钮排列，突出主要操作</li>
        <li>📱 完全响应式，移动端友好</li>
        <li>🎨 优雅的动画和过渡效果</li>
        <li>🔧 可展开的高级工具面板</li>
        <li>💡 智能快捷提示建议</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 响应式数据
const inputMessage = ref('')
const isLoading = ref(false)
const isVoiceRecording = ref(false)
const showExpandedTools = ref(false)
const showEmojiPicker = ref(false)
const showImageTools = ref(false)
const showQuickSuggestions = ref(true)

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

// 方法
const toggleExpandedTools = () => {
  showExpandedTools.value = !showExpandedTools.value
  if (!showExpandedTools.value) {
    showEmojiPicker.value = false
    showImageTools.value = false
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return
    } else {
      event.preventDefault()
      sendMessage()
    }
  }
}

const handleInput = () => {
  // 自动调整高度
}

const sendMessage = () => {
  if (!canSend.value) return

  console.log('发送消息:', inputMessage.value)
  inputMessage.value = ''
  showExpandedTools.value = false
}

const sendSuggestedMessage = (suggestion: string) => {
  inputMessage.value = suggestion
  sendMessage()
}

const addEmoji = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
}

const startVoiceInput = () => {
  isVoiceRecording.value = !isVoiceRecording.value
  console.log(isVoiceRecording.value ? '开始录音' : '停止录音')
}

const stopGeneration = () => {
  isLoading.value = false
  console.log('停止生成')
}

const handleFileUpload = () => {
  console.log('文件上传功能')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.modern-input-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, $dark-bg-primary 0%, rgba($dark-bg-secondary, 0.8) 100%);
  color: $text-primary;
  padding: $spacing-8;

  .demo-header {
    text-align: center;
    margin-bottom: $spacing-8;

    h1 {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-4;
      background: linear-gradient(135deg, $primary-400, $secondary-400);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: $font-size-lg;
      color: $text-secondary;
    }
  }

  .demo-container {
    max-width: 900px;
    margin: 0 auto;
    background: rgba($dark-bg-secondary, 0.6);
    border-radius: $border-radius-xl;
    padding: $spacing-6;
    backdrop-filter: blur(10px);
    border: 1px solid rgba($primary-500, 0.2);

    .mock-chat-messages {
      margin-bottom: $spacing-6;
      max-height: 300px;
      overflow-y: auto;
      padding: $spacing-4;

      .message {
        display: flex;
        gap: $spacing-3;
        margin-bottom: $spacing-4;

        &.user {
          flex-direction: row-reverse;

          .content {
            background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
            color: white;
            border-radius: 18px 18px 4px 18px;
          }
        }

        &.assistant {
          .content {
            background: rgba($gray-800, 0.8);
            border: 1px solid rgba($primary-500, 0.2);
            border-radius: 18px 18px 18px 4px;
          }
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: $primary-500;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: $font-weight-bold;
          font-size: $font-size-sm;
          flex-shrink: 0;
        }

        .content {
          padding: $spacing-3 $spacing-4;
          max-width: 70%;
          word-wrap: break-word;
        }
      }
    }
  }

  .demo-footer {
    max-width: 900px;
    margin: $spacing-8 auto 0;
    text-align: center;

    h3 {
      font-size: $font-size-xl;
      margin-bottom: $spacing-4;
      color: $text-primary;
    }

    ul {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: $spacing-3;

      li {
        padding: $spacing-2;
        background: rgba($primary-500, 0.1);
        border-radius: $border-radius-lg;
        border: 1px solid rgba($primary-500, 0.2);
        transition: all $transition-base;

        &:hover {
          background: rgba($primary-500, 0.2);
          transform: translateY(-2px);
        }
      }
    }
  }
}

// 现代化输入区域样式
.modern-input-area {
  .input-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .input-card {
    background: rgba($gray-900, 0.8);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: 20px;
    padding: $spacing-2;
    display: flex;
    align-items: flex-end;
    gap: $spacing-2;
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

    @include mobile-only {
      border-radius: 16px;
      padding: $spacing-1;
      gap: $spacing-1;
    }
  }

  .input-prefix-actions {
    display: flex;
    align-items: center;

    .action-group {
      display: flex;
      align-items: center;
      gap: $spacing-1;
    }

    .tool-toggle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba($primary-500, 0.1);
      border: 1px solid rgba($primary-500, 0.2);
      color: $primary-400;
      transition: all $transition-base;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba($primary-500, 0.2);
        transform: scale(1.05);
      }

      &.active {
        background: $primary-500;
        color: white;
        border-color: $primary-500;
      }

      @include mobile-only {
        width: 32px;
        height: 32px;
      }
    }

    .expanded-tools {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      margin-left: $spacing-1;
      padding-left: $spacing-1;
      border-left: 1px solid rgba($gray-700, 0.5);

      .tool-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba($gray-700, 0.3);
        border: 1px solid rgba($gray-600, 0.3);
        color: $text-secondary;
        transition: all $transition-base;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba($gray-600, 0.5);
          color: $text-primary;
        }

        &.active {
          background: rgba($primary-500, 0.3);
          color: $primary-400;
          border-color: rgba($primary-500, 0.4);
        }

        @include mobile-only {
          width: 28px;
          height: 28px;
        }
      }
    }
  }

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
      padding: $spacing-3 $spacing-2;
      min-height: 24px;
      max-height: 120px;
      font-family: $font-family-base;

      @include mobile-only {
        font-size: 16px;
        padding: $spacing-2;
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
      right: $spacing-2;
      display: flex;
      align-items: center;
      gap: $spacing-3;

      .char-count {
        font-size: $font-size-xs;
        color: $text-muted;
        opacity: 0.7;
      }

      .voice-recording-indicator {
        display: flex;
        align-items: center;
        gap: $spacing-1;
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

  .input-suffix-actions {
    display: flex;
    align-items: center;
    gap: $spacing-1;

    .voice-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba($gray-700, 0.3);
      border: 1px solid rgba($gray-600, 0.3);
      color: $text-secondary;
      transition: all $transition-base;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;

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
      cursor: pointer;
      border: none;
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

      @include mobile-only {
        width: 36px;
        height: 36px;
      }
    }
  }

  .quick-suggestions {
    margin-top: $spacing-4;
    padding: 0 $spacing-2;

    .suggestions-container {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      flex-wrap: wrap;

      .suggestions-label {
        font-size: $font-size-sm;
        color: $text-tertiary;
        font-weight: $font-weight-medium;
      }

      .suggestion-chip {
        padding: $spacing-1 $spacing-3;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: $border-radius-full;
        color: $primary-400;
        font-size: $font-size-sm;
        cursor: pointer;
        transition: all $transition-base;
        white-space: nowrap;
        border: none;

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

  .tool-panels {
    margin-top: $spacing-3;
    padding: 0 $spacing-2;

    .tool-panel {
      background: rgba($gray-900, 0.6);
      border: 1px solid rgba($primary-500, 0.2);
      border-radius: 12px;
      padding: $spacing-3;
      margin-bottom: $spacing-2;
      backdrop-filter: blur(10px);

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: $spacing-3;

        span {
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
          color: $text-secondary;
        }

        .close-btn {
          background: none;
          border: none;
          color: $text-muted;
          cursor: pointer;
          padding: $spacing-1;
          border-radius: $border-radius-base;
          transition: all $transition-base;

          &:hover {
            background: rgba($error-color, 0.2);
            color: $error-color;
          }
        }
      }

      &.emoji-panel {
        .emoji-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
          gap: $spacing-1;
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
        .image-tools-content {
          color: $text-secondary;
          font-style: italic;
        }
      }
    }
  }
}

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
</style>