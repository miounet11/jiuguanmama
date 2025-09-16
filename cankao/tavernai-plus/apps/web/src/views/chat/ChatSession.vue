<template>
  <div class="chat-session-page">
    <div class="chat-container">
      <!-- 侧边栏 -->
      <div class="chat-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3>对话历史</h3>
          <el-button 
            circle 
            size="small" 
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <el-icon><ArrowLeft v-if="!sidebarCollapsed" /><ArrowRight v-else /></el-icon>
          </el-button>
        </div>
        
        <div class="session-list">
          <div 
            v-for="session in sessions" 
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="switchSession(session.id)"
          >
            <div class="session-info">
              <h4>{{ session.title || '新对话' }}</h4>
              <p>{{ formatTime(session.lastMessageAt) }}</p>
            </div>
            <el-dropdown trigger="click" @command="handleSessionCommand($event, session)">
              <el-button circle size="small" class="session-menu">
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">
                    <el-icon><Edit /></el-icon> 重命名
                  </el-dropdown-item>
                  <el-dropdown-item command="archive">
                    <el-icon><FolderAdd /></el-icon> 归档
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="sidebar-footer">
          <el-button type="primary" @click="createNewSession" block>
            <el-icon><Plus /></el-icon> 新建对话
          </el-button>
        </div>
      </div>
      
      <!-- 主聊天区域 -->
      <div class="chat-main">
        <div class="chat-header">
          <div class="header-left">
            <div class="character-info" v-if="currentCharacter">
              <img 
                :src="currentCharacter.avatar || '/images/default-avatar.png'" 
                :alt="currentCharacter.name"
                class="character-avatar"
              />
              <div>
                <h3>{{ currentCharacter.name }}</h3>
                <p>{{ currentSession?.messageCount || 0 }} 条消息</p>
              </div>
            </div>
          </div>
          
          <div class="header-actions">
            <el-button circle @click="showSettingsDialog = true">
              <el-icon><Setting /></el-icon>
            </el-button>
            <el-button circle @click="clearContext">
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button circle @click="exportChat">
              <el-icon><Download /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="chat-messages" ref="messagesContainer">
          <div class="messages-wrapper">
            <!-- 欢迎消息 -->
            <div class="welcome-message" v-if="messages.length === 0 && currentCharacter">
              <img 
                :src="currentCharacter.avatar || '/images/default-avatar.png'" 
                :alt="currentCharacter.name"
                class="welcome-avatar"
              />
              <h2>开始与 {{ currentCharacter.name }} 对话</h2>
              <p>{{ currentCharacter.description }}</p>
              <div class="quick-actions" v-if="currentCharacter.firstMessage">
                <el-button @click="sendFirstMessage">发送初始消息</el-button>
              </div>
            </div>
            
            <!-- 消息列表 -->
            <div 
              v-for="(message, index) in messages" 
              :key="message.id"
              class="message-item"
              :class="[message.role]"
            >
              <div class="message-avatar">
                <img 
                  v-if="message.role === 'assistant'"
                  :src="currentCharacter?.avatar || '/images/default-avatar.png'" 
                  :alt="currentCharacter?.name"
                />
                <img 
                  v-else
                  :src="userStore.user?.avatar || '/images/default-user.png'" 
                  :alt="userStore.user?.username"
                />
              </div>
              
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">
                    {{ message.role === 'assistant' ? currentCharacter?.name : userStore.user?.username }}
                  </span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                
                <div class="message-text" v-html="renderMarkdown(message.content)"></div>
                
                <div class="message-actions">
                  <el-button 
                    v-if="message.role === 'assistant'"
                    size="small" 
                    text 
                    @click="regenerateMessage(message)"
                  >
                    <el-icon><RefreshRight /></el-icon> 重新生成
                  </el-button>
                  <el-button 
                    size="small" 
                    text 
                    @click="editMessage(message, index)"
                  >
                    <el-icon><Edit /></el-icon> 编辑
                  </el-button>
                  <el-button 
                    size="small" 
                    text 
                    @click="deleteMessage(message, index)"
                  >
                    <el-icon><Delete /></el-icon> 删除
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 生成中指示器 -->
            <div v-if="isGenerating" class="message-item assistant generating">
              <div class="message-avatar">
                <img 
                  :src="currentCharacter?.avatar || '/images/default-avatar.png'" 
                  :alt="currentCharacter?.name"
                />
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息... (Ctrl+Enter 发送)"
              @keydown.ctrl.enter="sendMessage"
              :disabled="isGenerating"
              resize="none"
            />
            
            <div class="input-actions">
              <el-button 
                type="primary" 
                @click="sendMessage"
                :loading="isGenerating"
                :disabled="!inputMessage.trim()"
              >
                <el-icon v-if="!isGenerating"><Promotion /></el-icon>
                <span>{{ isGenerating ? '生成中...' : '发送' }}</span>
              </el-button>
              
              <el-button 
                v-if="isGenerating"
                @click="stopGeneration"
                type="danger"
              >
                <el-icon><VideoPause /></el-icon> 停止
              </el-button>
            </div>
          </div>
          
          <div class="input-toolbar">
            <span class="token-count">{{ currentTokens }}/{{ maxTokens }} tokens</span>
            <span class="model-info">{{ currentSession?.model || 'gpt-3.5-turbo' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 设置对话框 -->
    <el-dialog 
      v-model="showSettingsDialog" 
      title="对话设置"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="模型">
          <el-select v-model="chatSettings.model" style="width: 100%">
            <el-option label="GPT-4" value="gpt-4" />
            <el-option label="GPT-3.5" value="gpt-3.5-turbo" />
            <el-option label="Claude 3" value="claude-3" />
            <el-option label="Gemini Pro" value="gemini-pro" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="温度">
          <el-slider 
            v-model="chatSettings.temperature" 
            :min="0" 
            :max="2" 
            :step="0.1"
            show-input
          />
        </el-form-item>
        
        <el-form-item label="最大长度">
          <el-input-number 
            v-model="chatSettings.maxTokens" 
            :min="100" 
            :max="4000" 
            :step="100"
          />
        </el-form-item>
        
        <el-form-item label="系统提示">
          <el-input 
            v-model="chatSettings.systemPrompt" 
            type="textarea" 
            :rows="4"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, ArrowRight, More, Plus, Edit, Delete, FolderAdd,
  Setting, Refresh, Download, RefreshRight, Promotion, VideoPause
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { chatService } from '@/services/chat'
import { characterService } from '@/services/character'
import { useUserStore } from '@/stores/user'
import { useWebSocket } from '@/composables/useWebSocket'
import type { ChatSession, Message } from '@/types/chat'
import type { Character } from '@/types/character'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { connect, disconnect, send, on, off } = useWebSocket()

// 状态
const currentSessionId = ref<string>('')
const currentSession = ref<ChatSession | null>(null)
const currentCharacter = ref<Character | null>(null)
const sessions = ref<ChatSession[]>([])
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isGenerating = ref(false)
const sidebarCollapsed = ref(false)
const showSettingsDialog = ref(false)
const messagesContainer = ref<HTMLElement>()

// 设置
const chatSettings = ref({
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: ''
})

// 计算属性
const currentTokens = computed(() => {
  return messages.value.reduce((sum, msg) => sum + msg.tokens, 0)
})

const maxTokens = computed(() => chatSettings.value.maxTokens)

// 格式化时间
const formatTime = (time: string | null) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

// 渲染 Markdown
const renderMarkdown = (text: string) => {
  const html = marked(text)
  return DOMPurify.sanitize(html)
}

// 加载会话列表
const loadSessions = async () => {
  try {
    sessions.value = await chatService.getSessions()
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

// 加载当前会话
const loadSession = async (sessionId: string) => {
  try {
    currentSession.value = await chatService.getSession(sessionId)
    messages.value = await chatService.getMessages(sessionId)
    
    // 加载角色信息
    if (currentSession.value.characterIds.length > 0) {
      currentCharacter.value = await characterService.getCharacter(
        currentSession.value.characterIds[0]
      )
    }
    
    // 加入 WebSocket 房间
    send('join', { sessionId })
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载会话失败:', error)
    ElMessage.error('加载会话失败')
  }
}

// 切换会话
const switchSession = (sessionId: string) => {
  router.push(`/chat/${sessionId}`)
}

// 创建新会话
const createNewSession = () => {
  router.push('/chat')
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isGenerating.value) return
  
  const content = inputMessage.value
  inputMessage.value = ''
  
  try {
    // 发送用户消息
    const userMessage = await chatService.sendMessage(currentSessionId.value, {
      content,
      characterId: currentCharacter.value?.id
    })
    
    messages.value.push(userMessage)
    isGenerating.value = true
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
    isGenerating.value = false
  }
}

// 发送初始消息
const sendFirstMessage = () => {
  if (currentCharacter.value?.firstMessage) {
    messages.value.push({
      id: 'first',
      sessionId: currentSessionId.value,
      characterId: currentCharacter.value.id,
      role: 'assistant',
      content: currentCharacter.value.firstMessage,
      tokens: 0,
      edited: false,
      deleted: false,
      character: currentCharacter.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    scrollToBottom()
  }
}

// 重新生成消息
const regenerateMessage = async (message: Message) => {
  try {
    isGenerating.value = true
    const newMessage = await chatService.regenerateMessage(
      currentSessionId.value,
      message.id
    )
    
    const index = messages.value.findIndex(m => m.id === message.id)
    if (index !== -1) {
      messages.value[index] = newMessage
    }
  } catch (error) {
    console.error('重新生成失败:', error)
    ElMessage.error('重新生成失败')
  } finally {
    isGenerating.value = false
  }
}

// 编辑消息
const editMessage = async (message: Message, index: number) => {
  const { value } = await ElMessageBox.prompt('编辑消息', '编辑', {
    inputType: 'textarea',
    inputValue: message.content,
    confirmButtonText: '保存',
    cancelButtonText: '取消'
  })
  
  if (value) {
    try {
      const updatedMessage = await chatService.editMessage(
        currentSessionId.value,
        message.id,
        value
      )
      messages.value[index] = updatedMessage
    } catch (error) {
      console.error('编辑失败:', error)
      ElMessage.error('编辑失败')
    }
  }
}

// 删除消息
const deleteMessage = async (message: Message, index: number) => {
  await ElMessageBox.confirm('确定删除这条消息吗？', '删除确认', {
    type: 'warning'
  })
  
  try {
    await chatService.deleteMessage(currentSessionId.value, message.id)
    messages.value.splice(index, 1)
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 停止生成
const stopGeneration = async () => {
  try {
    await chatService.stopGeneration(currentSessionId.value)
    isGenerating.value = false
  } catch (error) {
    console.error('停止失败:', error)
  }
}

// 清空上下文
const clearContext = async () => {
  await ElMessageBox.confirm(
    '确定要清空对话上下文吗？这将重置对话但保留历史记录。',
    '清空确认',
    { type: 'warning' }
  )
  
  try {
    await chatService.clearContext(currentSessionId.value)
    ElMessage.success('上下文已清空')
  } catch (error) {
    console.error('清空失败:', error)
    ElMessage.error('清空失败')
  }
}

// 导出聊天
const exportChat = () => {
  const content = messages.value
    .map(m => `${m.role === 'user' ? '用户' : currentCharacter.value?.name}: ${m.content}`)
    .join('\n\n')
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-${currentSessionId.value}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 保存设置
const saveSettings = async () => {
  try {
    await chatService.updateSessionSettings(currentSessionId.value, chatSettings.value)
    showSettingsDialog.value = false
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 处理会话菜单命令
const handleSessionCommand = async (command: string, session: ChatSession) => {
  switch (command) {
    case 'rename':
      const { value } = await ElMessageBox.prompt('重命名会话', '重命名', {
        inputValue: session.title || '',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      // TODO: 实现重命名
      break
    case 'archive':
      await chatService.archiveSession(session.id)
      ElMessage.success('已归档')
      loadSessions()
      break
    case 'delete':
      await ElMessageBox.confirm('确定删除这个会话吗？', '删除确认', {
        type: 'warning'
      })
      await chatService.deleteSession(session.id)
      ElMessage.success('已删除')
      loadSessions()
      if (session.id === currentSessionId.value) {
        router.push('/chat')
      }
      break
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// WebSocket 事件处理
const handleWebSocketMessage = (data: any) => {
  if (data.sessionId !== currentSessionId.value) return
  
  if (data.type === 'assistant_message') {
    // 完整消息
    messages.value.push(data.message)
    isGenerating.value = false
    scrollToBottom()
  } else if (data.type === 'user_message') {
    // 用户消息（其他客户端发送的）
    const exists = messages.value.find(m => m.id === data.message.id)
    if (!exists) {
      messages.value.push(data.message)
      scrollToBottom()
    }
  }
}

// 处理流式消息块
const handleMessageChunk = (data: any) => {
  if (data.sessionId !== currentSessionId.value) return
  
  // 查找或创建临时消息
  let message = messages.value.find(m => m.id === data.messageId)
  if (!message) {
    // 创建临时消息
    message = {
      id: data.messageId,
      sessionId: data.sessionId,
      role: 'assistant',
      content: '',
      tokens: 0,
      edited: false,
      deleted: false,
      character: currentCharacter.value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    messages.value.push(message)
  }
  
  // 更新内容
  message.content = data.partial
  scrollToBottom()
}

// 监听路由变化
watch(() => route.params.sessionId, (sessionId) => {
  if (sessionId && typeof sessionId === 'string') {
    currentSessionId.value = sessionId
    loadSession(sessionId)
  }
}, { immediate: true })

onMounted(async () => {
  await loadSessions()
  
  // 连接 WebSocket
  connect()
  on('message', handleWebSocketMessage)
  on('message_chunk', handleMessageChunk)
  on('error', (data: any) => {
    if (data.sessionId === currentSessionId.value) {
      ElMessage.error(data.message || '发生错误')
      isGenerating.value = false
    }
  })
})
</script>

<style lang="scss" scoped>
.chat-session-page {
  height: 100vh;
  background: #0f0f1a;
}

.chat-container {
  display: flex;
  height: 100%;
}

// 侧边栏样式
.chat-sidebar {
  width: 300px;
  background: rgba(30, 30, 40, 0.8);
  border-right: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  
  &.collapsed {
    width: 0;
    overflow: hidden;
  }
  
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #f3f4f6;
    }
  }
  
  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
  
  .session-item {
    padding: 12px;
    margin-bottom: 8px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(139, 92, 246, 0.2);
      border-color: rgba(139, 92, 246, 0.3);
    }
    
    &.active {
      background: rgba(139, 92, 246, 0.3);
      border-color: #8b5cf6;
    }
    
    .session-info {
      flex: 1;
      min-width: 0;
      
      h4 {
        margin: 0 0 4px;
        font-size: 14px;
        color: #f3f4f6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      p {
        margin: 0;
        font-size: 12px;
        color: #9ca3af;
      }
    }
    
    .session-menu {
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    &:hover .session-menu {
      opacity: 1;
    }
  }
  
  .sidebar-footer {
    padding: 20px;
    border-top: 1px solid rgba(139, 92, 246, 0.2);
  }
}

// 主聊天区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  background: rgba(30, 30, 40, 0.8);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    display: flex;
    align-items: center;
  }
  
  .character-info {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .character-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(139, 92, 246, 0.3);
    }
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #f3f4f6;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #9ca3af;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
}

// 消息区域
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  .messages-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }
  
  .welcome-message {
    text-align: center;
    padding: 60px 20px;
    
    .welcome-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin-bottom: 20px;
      border: 3px solid rgba(139, 92, 246, 0.3);
    }
    
    h2 {
      margin: 0 0 10px;
      font-size: 28px;
      color: #f3f4f6;
    }
    
    p {
      margin: 0 0 30px;
      font-size: 16px;
      color: #9ca3af;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
  }
  
  .message-item {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
    
    &.user {
      flex-direction: row-reverse;
      
      .message-content {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.3);
      }
    }
    
    &.assistant {
      .message-content {
        background: rgba(30, 30, 40, 0.8);
        border-color: rgba(139, 92, 246, 0.2);
      }
    }
    
    &.generating .message-content {
      padding: 20px;
    }
    
    .message-avatar {
      flex-shrink: 0;
      
      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }
    }
    
    .message-content {
      max-width: 70%;
      padding: 15px;
      border: 1px solid;
      border-radius: 12px;
      
      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        
        .message-sender {
          font-weight: 600;
          color: #c084fc;
          font-size: 14px;
        }
        
        .message-time {
          font-size: 12px;
          color: #9ca3af;
        }
      }
      
      .message-text {
        color: #f3f4f6;
        line-height: 1.6;
        
        :deep(p) {
          margin: 0 0 10px;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
        
        :deep(code) {
          background: rgba(139, 92, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', monospace;
        }
        
        :deep(pre) {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 8px;
          overflow-x: auto;
          
          code {
            background: none;
            padding: 0;
          }
        }
      }
      
      .message-actions {
        margin-top: 10px;
        opacity: 0;
        transition: opacity 0.3s;
        display: flex;
        gap: 10px;
      }
    }
    
    &:hover .message-actions {
      opacity: 1;
    }
  }
  
  .typing-indicator {
    display: flex;
    gap: 5px;
    
    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #8b5cf6;
      animation: typing 1.4s infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

// 输入区域
.chat-input {
  padding: 20px;
  background: rgba(30, 30, 40, 0.8);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  
  .input-wrapper {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    gap: 15px;
    align-items: flex-end;
    
    .el-textarea {
      flex: 1;
      
      :deep(.el-textarea__inner) {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        color: #f3f4f6;
        
        &:focus {
          border-color: #8b5cf6;
        }
      }
    }
    
    .input-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .input-toolbar {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    
    span {
      font-size: 12px;
      color: #9ca3af;
    }
  }
}
</style>