<template>
  <div class="chat-session-container h-screen overflow-hidden">
    <!-- 桌面端布局 -->
    <div class="hidden lg:flex h-full">
      <!-- 侧边栏 - 桌面端 -->
      <aside class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChatSidebar
          :character="character"
          :settings="chatSettings"
          @update-settings="updateSettings"
          @regenerate="regenerateMessage"
          @clear-chat="clearChat"
          @export-chat="exportChat"
        />
      </aside>

      <!-- 主聊天区 - 桌面端 -->
      <main class="flex-1 flex flex-col min-w-0">
        <ChatHeader
          :character="character"
          :online="isOnline"
          :message-count="messages.length"
          @toggle-sound="toggleSound"
          @toggle-fullscreen="toggleFullscreen"
        />
        <ChatMessages
          ref="messagesRef"
          :messages="messages"
          :character="character"
          :loading="aiThinking"
          class="flex-1"
          @scroll="handleScroll"
        />
        <ChatInput
          v-model="inputMessage"
          :disabled="aiThinking"
          :character="character"
          @send="sendMessage"
          @upload="handleFileUpload"
        />
      </main>
    </div>

    <!-- 移动端布局 -->
    <div class="lg:hidden flex flex-col h-full">
      <!-- 移动端顶部栏 -->
      <header class="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0 flex-1">
            <el-button
              @click="openMobileMenu"
              :icon="Menu"
              type="text"
              size="small"
              class="mr-3"
            />
            <el-avatar
              :src="character?.avatar"
              :size="36"
              class="mr-3 flex-shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="font-medium text-gray-900 truncate">
                {{ character?.name || '加载中...' }}
              </div>
              <div class="text-sm text-gray-500 flex items-center">
                <div
                  class="w-2 h-2 rounded-full mr-2"
                  :class="isOnline ? 'bg-green-500' : 'bg-gray-400'"
                ></div>
                {{ isOnline ? '在线' : '离线' }}
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 flex-shrink-0">
            <el-button
              @click="openQuickActions"
              :icon="MoreFilled"
              type="text"
              size="small"
            />
          </div>
        </div>
      </header>

      <!-- 移动端聊天消息区 -->
      <div class="flex-1 overflow-hidden">
        <ChatMessages
          ref="mobileMessagesRef"
          :messages="messages"
          :character="character"
          :loading="aiThinking"
          :mobile="true"
          @scroll="handleScroll"
          class="h-full"
        />
      </div>

      <!-- 移动端输入区 -->
      <div class="flex-shrink-0 bg-white border-t border-gray-200">
        <ChatInputMobile
          v-model="inputMessage"
          :disabled="aiThinking"
          :character="character"
          @send="sendMessage"
          @upload="handleFileUpload"
          @voice="startVoiceInput"
        />
      </div>
    </div>

    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="showMobileMenu"
      title=""
      direction="ltr"
      size="80%"
      :show-close="false"
      class="mobile-menu-drawer"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold text-gray-900">聊天设置</h3>
          <el-button
            @click="showMobileMenu = false"
            :icon="Close"
            type="text"
          />
        </div>
      </template>

      <ChatSidebar
        :character="character"
        :settings="chatSettings"
        :mobile="true"
        @update-settings="updateSettings"
        @regenerate="regenerateMessage"
        @clear-chat="clearChat"
        @export-chat="exportChat"
        @close="showMobileMenu = false"
      />
    </el-drawer>

    <!-- 移动端快速操作菜单 -->
    <el-drawer
      v-model="showQuickActions"
      title=""
      direction="rtl"
      size="300px"
      :show-close="false"
      class="quick-actions-drawer"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold text-gray-900">快速操作</h3>
          <el-button
            @click="showQuickActions = false"
            :icon="Close"
            type="text"
          />
        </div>
      </template>

      <div class="space-y-4">
        <el-button
          @click="regenerateMessage"
          :disabled="!canRegenerate"
          class="w-full justify-start"
          size="large"
        >
          <el-icon class="mr-3"><Refresh /></el-icon>
          重新生成
        </el-button>

        <el-button
          @click="exportChat"
          class="w-full justify-start"
          size="large"
        >
          <el-icon class="mr-3"><Download /></el-icon>
          导出对话
        </el-button>

        <el-button
          @click="toggleSound"
          class="w-full justify-start"
          size="large"
        >
          <el-icon class="mr-3">
            <component :is="soundEnabled ? 'VideoPlay' : 'VideoPause'" />
          </el-icon>
          {{ soundEnabled ? '关闭' : '开启' }}提示音
        </el-button>

        <el-divider />

        <el-button
          @click="clearChatWithConfirm"
          type="danger"
          class="w-full justify-start"
          size="large"
        >
          <el-icon class="mr-3"><Delete /></el-icon>
          清空对话
        </el-button>
      </div>
    </el-drawer>

    <!-- 语音输入对话框 -->
    <VoiceInputDialog
      v-model:visible="showVoiceInput"
      @result="handleVoiceResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu,
  MoreFilled,
  Close,
  Refresh,
  Download,
  Delete
} from '@element-plus/icons-vue'

// 组件导入
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import ChatHeader from '@/components/chat/ChatHeader.vue'
import ChatMessages from '@/components/chat/ChatMessages.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ChatInputMobile from '@/components/chat/ChatInputMobile.vue'
import VoiceInputDialog from '@/components/chat/VoiceInputDialog.vue'

// Store导入
import { useCharacterStore } from '@/stores/character'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  status?: 'sending' | 'sent' | 'failed'
  streaming?: boolean
}

interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  enableStream: boolean
  enableTyping: boolean
}

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()
const chatStore = useChatStore()


// 响应式数据
const character = ref<any>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const aiThinking = ref(false)
const isOnline = ref(true)
const soundEnabled = ref(true)
const fullscreen = ref(false)

// 移动端状态
const showMobileMenu = ref(false)
const showQuickActions = ref(false)
const showVoiceInput = ref(false)

// 聊天设置
const chatSettings = ref<ChatSettings>({
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 2000,
  enableStream: true,
  enableTyping: true
})

// 引用
const messagesRef = ref<any>(null)
const mobileMessagesRef = ref<any>(null)

// 计算属性
const canRegenerate = computed(() => {
  return messages.value.length > 0 &&
         messages.value[messages.value.length - 1]?.role === 'assistant'
})

// 方法
const openMobileMenu = () => {
  showMobileMenu.value = true
}

const openQuickActions = () => {
  showQuickActions.value = true
}

const updateSettings = (newSettings: Partial<ChatSettings>) => {
  chatSettings.value = { ...chatSettings.value, ...newSettings }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || aiThinking.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputMessage.value.trim(),
    role: 'user',
    timestamp: new Date(),
    status: 'sending'
  }

  messages.value.push(userMessage)
  inputMessage.value = ''

  try {
    // 标记用户消息为已发送
    userMessage.status = 'sent'

    // 开始AI思考
    aiThinking.value = true

    // 滚动到底部
    await nextTick()
    scrollToBottom()

    // 调用AI API
    const response = await chatStore.sendMessage({
      characterId: route.params.characterId as string,
      message: userMessage.content,
      settings: chatSettings.value
    })

    // 添加AI响应
    const aiMessage: Message = {
      id: response.id,
      content: response.content,
      role: 'assistant',
      timestamp: new Date()
    }

    messages.value.push(aiMessage)

  } catch (error) {
    console.error('发送消息失败:', error)
    userMessage.status = 'failed'
    ElMessage.error('发送消息失败，请重试')
  } finally {
    aiThinking.value = false
    await nextTick()
    scrollToBottom()
  }
}

const regenerateMessage = async () => {
  if (!canRegenerate.value) return

  try {
    aiThinking.value = true

    // 移除最后一条AI消息
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage.role === 'assistant') {
      messages.value.pop()
    }

    // 重新生成
    const response = await chatStore.regenerateMessage({
      characterId: route.params.characterId as string,
      settings: chatSettings.value
    })

    const aiMessage: Message = {
      id: response.id,
      content: response.content,
      role: 'assistant',
      timestamp: new Date()
    }

    messages.value.push(aiMessage)

  } catch (error) {
    console.error('重新生成失败:', error)
    ElMessage.error('重新生成失败，请重试')
  } finally {
    aiThinking.value = false
    await nextTick()
    scrollToBottom()
  }
}

const clearChat = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有对话记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    messages.value = []
    await chatStore.clearChat(route.params.characterId as string)
    ElMessage.success('对话已清空')

  } catch {
    // 用户取消
  }
}

const clearChatWithConfirm = () => {
  showQuickActions.value = false
  clearChat()
}

const exportChat = async () => {
  try {
    const chatData = {
      character: character.value,
      messages: messages.value,
      exportTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${character.value?.name}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ElMessage.success('对话已导出')
    showQuickActions.value = false

  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  ElMessage.success(`提示音已${soundEnabled.value ? '开启' : '关闭'}`)
  showQuickActions.value = false
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  // 实现全屏逻辑
}

const handleFileUpload = (file: File) => {
  // 处理文件上传
  console.log('上传文件:', file)
}

const startVoiceInput = () => {
  showVoiceInput.value = true
}

const handleVoiceResult = (text: string) => {
  inputMessage.value = text
  showVoiceInput.value = false
}

const handleScroll = () => {
  // 处理滚动事件
}

const scrollToBottom = () => {
  const container = messagesRef.value?.$el || mobileMessagesRef.value?.$el
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// 生命周期
onMounted(async () => {
  const characterId = route.params.characterId as string

  try {
    // 加载角色信息
    character.value = await characterStore.getCharacter(characterId)

    // 加载聊天历史
    const chatHistory = await chatStore.getChatHistory(characterId)
    messages.value = chatHistory

    // 滚动到底部
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('加载聊天失败:', error)
    ElMessage.error('加载聊天失败')
    router.push('/characters')
  }
})

// 监听路由变化
watch(() => route.params.characterId, (newId) => {
  if (newId) {
    // 重新加载角色和聊天记录
    location.reload()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.chat-session-container {
  background: var(--surface-soft);
}

.mobile-menu-drawer,
.quick-actions-drawer {
  :deep(.el-drawer) {
    border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  }

  :deep(.el-drawer__header) {
    padding: var(--space-4);
    margin-bottom: 0;
    border-bottom: 1px solid var(--border-light);
  }

  :deep(.el-drawer__body) {
    padding: var(--space-4);
  }
}

// 确保移动端输入框不会被虚拟键盘遮挡
@supports (-webkit-touch-callout: none) {
  .chat-session-container {
    height: 100vh;
    height: -webkit-fill-available;
  }
}

// 响应式调整
@media (max-width: 1024px) {
  .mobile-menu-drawer :deep(.el-drawer) {
    max-width: 300px;
  }
}

@media (max-width: 640px) {
  .mobile-menu-drawer {
    :deep(.el-drawer) {
      width: 85% !important;
    }
  }
}
</style>
