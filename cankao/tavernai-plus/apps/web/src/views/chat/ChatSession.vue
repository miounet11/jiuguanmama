<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 侧边栏 -->
    <div class="w-80 bg-white border-r flex flex-col">
      <!-- 角色信息 -->
      <div class="p-4 border-b">
        <div class="flex items-center space-x-3">
          <img
            :src="character?.avatar || '/default-avatar.png'"
            :alt="character?.name"
            class="w-12 h-12 rounded-full"
          />
          <div class="flex-1">
            <h2 class="font-semibold">{{ character?.name }}</h2>
            <p class="text-sm text-gray-500">{{ character?.creator }}</p>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          <!-- 模型选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">AI模型</label>
            <select v-model="settings.model" class="w-full px-3 py-2 border rounded-lg">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-2">Claude 2</option>
            </select>
          </div>

          <!-- 温度设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              创造性 ({{ settings.temperature }})
            </label>
            <input
              v-model="settings.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="w-full"
            />
          </div>

          <!-- 最大令牌 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              最大长度 ({{ settings.maxTokens }})
            </label>
            <input
              v-model="settings.maxTokens"
              type="range"
              min="100"
              max="4000"
              step="100"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="p-4 border-t space-y-2">
        <button
          @click="exportChat"
          class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          导出对话
        </button>
        <button
          @click="clearChat"
          class="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          清空对话
        </button>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 聊天消息 -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4">
        <div v-if="messages.length === 0" class="text-center text-gray-500 mt-8">
          <p>开始你的对话吧！</p>
        </div>

        <div v-for="message in messages" :key="message.id" class="mb-4">
          <div :class="[
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]">
            <div :class="[
              'max-w-[70%] rounded-lg px-4 py-2',
              message.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border'
            ]">
              <div class="whitespace-pre-wrap">{{ message.content }}</div>
              <div :class="[
                'text-xs mt-1',
                message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              ]">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 输入中指示器 -->
        <div v-if="isTyping" class="flex justify-start mb-4">
          <div class="bg-white border rounded-lg px-4 py-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t bg-white p-4">
        <div class="flex space-x-2">
          <textarea
            v-model="inputMessage"
            @keydown.enter.prevent="sendMessage"
            placeholder="输入消息..."
            class="flex-1 px-4 py-2 border rounded-lg resize-none"
            rows="3"
          ></textarea>
          <div class="flex flex-col space-y-2">
            <button
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isLoading"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              发送
            </button>
            <button
              v-if="isLoading"
              @click="stopGeneration"
              class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              停止
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '@/utils/axios'

const route = useRoute()

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const character = ref<any>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isTyping = ref(false)
const messagesContainer = ref<HTMLElement>()

const settings = reactive({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000
})

const formatTime = (time: Date) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

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

  try {
    const response = await http.post(`/chats/${route.params.characterId}/messages`, {
      content: messageContent,
      settings
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
  } catch (error) {
    console.error('Failed to send message:', error)
    isTyping.value = false

    // 模拟回复
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，我现在无法响应。请稍后再试。',
        timestamp: new Date()
      }
      messages.value.push(assistantMessage)
      scrollToBottom()
    }, 1000)
  } finally {
    isLoading.value = false
  }
}

const stopGeneration = () => {
  // 实现停止生成逻辑
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

const clearChat = () => {
  if (confirm('确定要清空所有对话吗？')) {
    messages.value = []
  }
}

const fetchChatData = async () => {
  try {
    const response = await http.get(`/chats/${route.params.characterId}`)
    character.value = response.character
    messages.value = response.messages || []
  } catch (error) {
    console.error('Failed to fetch chat data:', error)
    // 模拟数据
    character.value = {
      name: '助手',
      avatar: '',
      creator: '系统'
    }
    messages.value = []
  }
}

onMounted(() => {
  fetchChatData()
})

watch(messages, () => {
  scrollToBottom()
})
</script>
