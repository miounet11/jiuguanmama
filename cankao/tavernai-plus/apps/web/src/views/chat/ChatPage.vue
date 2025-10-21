<template>
  <div class="chat-page">
    <!-- 移动端对话列表 -->
    <MobileConversationList
      v-if="isMobile"
      :conversations="formattedConversations"
      :active-conversation-id="selectedChatId"
      :is-visible="showMobileConversationList"
      :is-loading="isLoading"
      :has-more="hasMore"
      :show-create-new-button="true"
      @close="closeMobileConversationList"
      @create-new="createNewChat"
      @conversation-click="handleResponsiveConversationClick"
      @conversation-rename="handleRenameConversation"
      @conversation-pin="handlePinConversation"
      @conversation-archive="handleArchiveConversation"
      @conversation-delete="handleDeleteConversation"
      @load-more="handleLoadMore"
      @refresh="fetchChats(1, true)"
    />

    <!-- 桌面端布局 -->
    <div v-else class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h2 class="gradient-text">对话列表</h2>
          <el-button
            @click="createNewChat"
            type="primary"
            size="small"
            class="btn-new-chat"
          >
            <el-icon><Plus /></el-icon>
            新对话
          </el-button>
        </div>

        <!-- 现代化对话列表 -->
        <div class="chat-list">
          <ConversationList
            :conversations="formattedConversations"
            :active-conversation-id="selectedChatId"
            :is-loading="isLoading"
            :has-more="hasMore"
            :show-create-new-button="true"
            @create-new="createNewChat"
            @conversation-click="openChat"
            @conversation-rename="handleRenameConversation"
            @conversation-pin="handlePinConversation"
            @conversation-archive="handleArchiveConversation"
            @conversation-delete="handleDeleteConversation"
            @load-more="handleLoadMore"
            @batch-operation="handleBatchOperation"
          />
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main">
        <!-- 移动端顶部导航 -->
        <div v-if="isMobile && selectedChatId" class="mobile-chat-header">
          <el-button
            type="text"
            @click="openMobileConversationList"
            class="mobile-nav-btn"
          >
            <el-icon size="20"><Menu /></el-icon>
          </el-button>

          <div class="mobile-chat-title">
            <span class="mobile-chat-name">{{ getCurrentChatName() }}</span>
          </div>

          <el-button
            type="text"
            @click="showMobileChatOptions"
            class="mobile-nav-btn"
          >
            <el-icon size="20"><MoreFilled /></el-icon>
          </el-button>
        </div>

        <!-- 聊天内容区域 -->
        <div class="chat-content">
          <router-view v-if="selectedChatId" />
          <div v-else class="welcome-screen">
            <div class="welcome-content">
              <div class="welcome-logo-container">
                <img src="/miaoda-ai.svg" alt="MIAODA AI" class="welcome-logo" />
              </div>
              <h1 class="gradient-title">欢迎使用 TavernAI Plus</h1>
              <p>选择一个对话或创建新对话开始</p>
              <el-button @click="createNewChat" type="primary" size="large" class="create-chat-btn">
                <el-icon><Plus /></el-icon>
                创建新对话
              </el-button>
            </div>

            <!-- 快速开始卡片 -->
            <div class="quick-start">
              <h3 class="gradient-text">热门角色</h3>
              <div class="character-grid">
                <el-card
                  v-for="char in popularCharacters"
                  :key="char.id"
                  @click="quickStart(char)"
                  class="character-quick-card"
                  shadow="hover"
                >
                  <div class="character-card-content">
                    <img :src="char.avatar || '/default-avatar.png'" :alt="char.name" class="character-avatar" />
                    <span class="character-name">{{ char.name }}</span>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色选择对话框 -->
    <el-dialog
      v-model="showCharacterSelector"
      title="选择角色"
      width="800px"
      :close-on-click-modal="false"
      class="character-selector-dialog"
    >
      <div class="character-selector">
        <el-input
          v-model="characterSearchQuery"
          placeholder="搜索角色..."
          class="mb-4"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="character-grid-modal">
          <el-card
            v-for="character in filteredCharacters"
            :key="character.id"
            @click="selectCharacter(character)"
            class="character-option"
            shadow="hover"
          >
            <div class="character-option-content">
              <img
                :src="character.avatar || '/default-avatar.png'"
                :alt="character.name"
                class="character-option-avatar"
              />
              <div class="character-info">
                <div class="character-name">{{ character.name }}</div>
                <div class="character-desc">{{ character.description }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <template #footer>
        <el-button @click="showCharacterSelector = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDialog } from 'element-plus'
import { Plus, Menu, MoreFilled, Search } from '@element-plus/icons-vue'
import { api } from '@/services/api'
import ConversationList from '@/components/chat/ConversationList.vue'
import MobileConversationList from '@/components/chat/MobileConversationList.vue'

const router = useRouter()
const route = useRoute()

interface ChatSession {
  id: string
  title?: string
  characterId: string
  character?: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage?: string
  lastMessageAt?: Date
  messageCount: number
  unreadCount: number
  // 新增字段
  isPinned?: boolean
  isArchived?: boolean
  isOnline?: boolean
  characterStatus?: 'online' | 'offline'
  lastMessageRole?: 'user' | 'assistant'
  friendshipLevel?: number
  friendshipTitle?: string
}

interface Character {
  id: string
  name: string
  description?: string
  avatar?: string
  creator?: string
}

// 响应式数据
const chatList = ref<ChatSession[]>([])
const selectedChatId = ref<string>('')
const showCharacterSelector = ref(false)
const characterSearchQuery = ref('')
const availableCharacters = ref<Character[]>([])
const popularCharacters = ref<Character[]>([])
const isLoading = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 响应式设计
const isMobile = ref(false)
const showMobileConversationList = ref(false)

// 计算属性
const formattedConversations = computed(() => {
  return chatList.value.map(chat => ({
    id: chat.id,
    characterId: chat.characterId,
    characterName: chat.character?.name || '未知角色',
    characterAvatar: chat.character?.avatar,
    lastMessage: chat.lastMessage || '暂无消息',
    lastMessageAt: chat.lastMessageAt,
    messageCount: chat.messageCount || 0,
    unreadCount: chat.unreadCount || 0,
    isPinned: chat.isPinned || false,
    isArchived: chat.isArchived || false,
    isOnline: chat.isOnline || false,
    isStreaming: false, // TODO: 从WebSocket获取流式状态
    hasError: false, // TODO: 从状态管理获取错误状态
    isEdited: false, // TODO: 从后端获取编辑状态
    lastMessageSender: chat.lastMessageRole === 'user' ? '你' : chat.character?.name || '',
    tags: [], // TODO: 从后端获取标签
    characterStatus: chat.characterStatus || 'offline',
    }))
})

const filteredCharacters = computed(() => {
  if (!characterSearchQuery.value || !availableCharacters.value) {
    return availableCharacters.value || []
  }

  const query = characterSearchQuery.value.toLowerCase()
  return availableCharacters.value.filter(c =>
    c.name?.toLowerCase().includes(query) ||
    c.description?.toLowerCase().includes(query)
  )
})

// 格式化时间
const formatTime = (time: Date | string | undefined) => {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('zh-CN')
  }
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 获取对话列表
const fetchChats = async (page: number = 1, reset: boolean = false) => {
  try {
    isLoading.value = true
    const response = await api.get('/chat/sessions', {
      page,
      limit: pageSize.value,
      includeDetails: true
    })

    if (response.success) {
      const newSessions = response.sessions || []

      if (reset || page === 1) {
        chatList.value = newSessions
      } else {
        chatList.value.push(...newSessions)
      }

      hasMore.value = response.hasMore || false
      currentPage.value = page
    } else {
      if (reset || page === 1) {
        chatList.value = []
      }
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
    if (reset || page === 1) {
      chatList.value = []
    }
  } finally {
    isLoading.value = false
  }
}

// 获取热门角色
const fetchPopularCharacters = async () => {
  try {
    const response = await api.get('/api/characters/popular')
    if (response.success && response.characters) {
      popularCharacters.value = response.characters.slice(0, 6)
    }
  } catch (error) {
    console.error('获取热门角色失败:', error)
  }
}

// 获取可用角色
const fetchAvailableCharacters = async () => {
  try {
    const response = await api.get('/api/characters', {
      page: 1,
      limit: 50 // 获取更多角色供选择
    })
    if (response.success && response.characters) {
      availableCharacters.value = response.characters
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 创建新对话
const createNewChat = async () => {
  showCharacterSelector.value = true
  if (!availableCharacters.value.length) {
    await fetchAvailableCharacters()
  }
}

// 选择角色
const selectCharacter = async (character: Character) => {
  try {
    // 首先检查是否已有该角色的对话会话
    const existingSession = chatList.value.find(chat => chat.characterId === character.id)

    if (existingSession) {
      // 如果已存在，直接打开该对话
      showCharacterSelector.value = false
      selectedChatId.value = existingSession.id
      router.push(`/chat/${existingSession.id}`)
      ElMessage.success('已打开与该角色的对话')
    } else {
      // 如果不存在，创建新对话
      const response = await api.post('/chat/sessions', {
        characterId: character.id,
        title: `与${character.name}的对话`
      })

      if (response.success && response.session) {
        showCharacterSelector.value = false
        await fetchChats()
        router.push(`/chat/${response.session.id}`)
      }
    }
  } catch (error) {
    console.error('创建对话失败:', error)
    ElMessage.error('创建对话失败，请重试')
  }
}

// 快速开始
const quickStart = async (character: Character) => {
  await selectCharacter(character)
}

// 标记消息为已读
const markMessagesAsRead = async (sessionId: string) => {
  try {
    await api.patch(`/api/chat/${sessionId}/read`)
  } catch (error) {
    console.error('标记消息为已读失败:', error)
  }
}

// 打开对话
const openChat = async (chatId: string) => {
  selectedChatId.value = chatId
  router.push(`/chat/${chatId}`)

  // 标记该会话的消息为已读
  await markMessagesAsRead(chatId)

  // 更新本地未读计数
  const chat = chatList.value.find(c => c.id === chatId)
  if (chat) {
    chat.unreadCount = 0
  }
}

// 新的事件处理函数
const handleRenameConversation = async (chatId: string) => {
  try {
    const newTitle = prompt('请输入新的对话标题：')
    if (newTitle && newTitle.trim()) {
      const response = await api.put(`/chat/sessions/${chatId}`, {
        title: newTitle.trim()
      })

      if (response.success) {
        const chat = chatList.value.find(c => c.id === chatId)
        if (chat) {
          chat.title = newTitle.trim()
        }
        ElMessage.success('对话标题已更新')
      } else {
        ElMessage.error('更新对话标题失败')
      }
    }
  } catch (error) {
    console.error('重命名对话失败:', error)
    ElMessage.error('重命名对话失败')
  }
}

const handlePinConversation = async (chatId: string, pinned: boolean) => {
  try {
    const response = await api.put(`/chat/sessions/${chatId}`, {
      isPinned: pinned
    })

    if (response.success) {
      const chat = chatList.value.find(c => c.id === chatId)
      if (chat) {
        // 更新本地状态，实际应该从后端返回的数据更新
        ElMessage.success(pinned ? '对话已置顶' : '已取消置顶')
      }
    } else {
      ElMessage.error('操作失败')
    }
  } catch (error) {
    console.error('置顶/取消置顶对话失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleArchiveConversation = async (chatId: string, archived: boolean) => {
  try {
    const response = await api.put(`/chat/sessions/${chatId}`, {
      isArchived: archived
    })

    if (response.success) {
      const chat = chatList.value.find(c => c.id === chatId)
      if (chat) {
        // 更新本地状态，实际应该从后端返回的数据更新
        ElMessage.success(archived ? '对话已归档' : '已取消归档')
      }
    } else {
      ElMessage.error('操作失败')
    }
  } catch (error) {
    console.error('归档/取消归档对话失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDeleteConversation = async (chatId: string) => {
  try {
    const confirmed = confirm('确定要删除这个对话吗？此操作无法撤销。')
    if (!confirmed) return

    const response = await api.delete(`/chat/sessions/${chatId}`)

    if (response.success) {
      chatList.value = chatList.value.filter(c => c.id !== chatId)
      if (selectedChatId.value === chatId) {
        selectedChatId.value = ''
        router.push('/chat')
      }
      ElMessage.success('对话已删除')
    } else {
      ElMessage.error('删除对话失败')
    }
  } catch (error) {
    console.error('删除对话失败:', error)
    ElMessage.error('删除对话失败')
  }
}

const handleLoadMore = () => {
  if (!isLoading.value && hasMore.value) {
    fetchChats(currentPage.value + 1, false)
  }
}

const handleBatchOperation = async (operation: string, conversationIds: string[]) => {
  try {
    let endpoint = '/chat/sessions/batch'
    let data = { operation, conversationIds }

    const response = await api.post(endpoint, data)

    if (response.success) {
      // 重新获取对话列表
      await fetchChats(1, true)

      let message = ''
      switch (operation) {
        case 'pin':
          message = '已批量置顶'
          break
        case 'archive':
          message = '已批量归档'
          break
        case 'delete':
          message = '已批量删除'
          break
        default:
          message = '批量操作完成'
      }

      ElMessage.success(message)
    } else {
      ElMessage.error('批量操作失败')
    }
  } catch (error) {
    console.error('批量操作失败:', error)
    ElMessage.error('批量操作失败')
  }
}

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 移动端对话列表处理
const openMobileConversationList = () => {
  showMobileConversationList.value = true
}

const closeMobileConversationList = () => {
  showMobileConversationList.value = false
}

// 获取当前聊天名称
const getCurrentChatName = () => {
  const currentChat = chatList.value.find(chat => chat.id === selectedChatId.value)
  return currentChat?.character?.name || '对话'
}

// 显示移动端聊天选项
const showMobileChatOptions = () => {
  // 可以在这里实现移动端聊天选项的逻辑
  // 比如显示操作菜单等
}

// 响应式处理对话点击
const handleResponsiveConversationClick = (chatId: string) => {
  selectedChatId.value = chatId
  router.push(`/chat/${chatId}`)

  // 移动端点击后关闭侧边栏
  if (isMobile.value) {
    closeMobileConversationList()
  }
}

// 监听路由变化
watch(() => route.params.sessionId, async (newId) => {
  if (newId) {
    selectedChatId.value = newId as string

    // 标记该会话的消息为已读
    await markMessagesAsRead(newId as string)

    // 更新本地未读计数
    const chat = chatList.value.find(c => c.id === newId)
    if (chat) {
      chat.unreadCount = 0
    }

    // 移动端有选中对话时关闭侧边栏
    if (isMobile.value) {
      closeMobileConversationList()
    }
  }
})

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    closeMobileConversationList()
  }
}

// 初始化
onMounted(async () => {
  checkMobile()

  await fetchChats()
  await fetchPopularCharacters()

  // 如果路由中有sessionId，设置选中状态
  if (route.params.sessionId) {
    selectedChatId.value = route.params.sessionId as string
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 清理工作
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.chat-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--surface-0) 0%,
    var(--surface-1) 50%,
    var(--surface-2) 100%);
  padding: var(--spacing-normal);
}

.chat-container {
  display: flex;
  height: calc(100vh - 2rem);
  max-width: 1600px;
  margin: 0 auto;
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

// 左侧边栏
.chat-sidebar {
  width: 380px;
  min-width: 280px;
  max-width: 420px;
  border-right: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  background: var(--surface-2);
  backdrop-filter: blur(10px);
  flex-shrink: 0;

  .sidebar-header {
    padding: var(--spacing-comfortable);
    border-bottom: 1px solid var(--border-tertiary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface-1);
    backdrop-filter: blur(15px);

    h2 {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      margin: 0;

      &.gradient-text {
        background: var(--dt-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .btn-new-chat {
      gap: var(--spacing-micro);
    }
  }

  .chat-list {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

// 右侧主区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

// 移动端聊天头部
.mobile-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--spacing-normal);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-secondary);
  height: 60px;
  flex-shrink: 0;
}

.mobile-nav-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}

.mobile-chat-title {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.mobile-chat-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

// 聊天内容区域
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

  .welcome-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-relaxed);
    position: relative;

    .welcome-content {
      text-align: center;
      margin-bottom: var(--spacing-relaxed);
      z-index: 2;

      .welcome-logo-container {
        position: relative;
        margin-bottom: var(--spacing-loose);

        .welcome-logo {
          width: 120px;
          height: 120px;
          opacity: 0.9;
          filter: drop-shadow(0 0 20px var(--brand-primary-400));
          animation: float 3s ease-in-out infinite;
        }

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--brand-primary-500) 0%, transparent 70%);
          opacity: 0.1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
      }

      h1 {
        font-size: var(--text-4xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-3);

        &.gradient-title {
          background: var(--dt-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      p {
        font-size: var(--text-lg);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-loose);
      }

      .create-chat-btn {
        gap: var(--spacing-tight);
      }
    }

    .quick-start {
      width: 100%;
      max-width: 800px;
      z-index: 2;

      h3 {
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        margin-bottom: var(--spacing-loose);
        text-align: center;

        &.gradient-text {
          background: var(--dt-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--spacing-loose);

        .character-quick-card {
          cursor: pointer;
          transition: all var(--duration-normal);

          &:hover {
            transform: translateY(-8px) scale(1.05);
            box-shadow: var(--shadow-2xl);
          }

          .character-card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: var(--spacing-comfortable);
            text-align: center;

            .character-avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin-bottom: var(--spacing-tight);
              border: 3px solid var(--border-primary);
              object-fit: cover;
              transition: all var(--duration-normal);
            }

            .character-name {
              font-size: var(--text-sm);
              font-weight: var(--font-medium);
              color: var(--text-primary);
            }
          }
        }
      }
    }
  }

// 角色选择对话框
.character-selector-dialog {
  :deep(.el-dialog) {
    background: var(--surface-1);
    border: 1px solid var(--border-primary);
    backdrop-filter: blur(20px);
  }

  :deep(.el-dialog__title) {
    color: var(--text-primary);
    font-weight: var(--font-semibold);
  }
}

.character-selector {
  .mb-4 {
    margin-bottom: var(--spacing-loose);
  }

  .character-grid-modal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-normal);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--spacing-micro);

    .character-option {
      cursor: pointer;
      transition: all var(--duration-normal);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .character-option-content {
        display: flex;
        align-items: center;
        padding: var(--spacing-normal);

        .character-option-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-right: var(--spacing-normal);
          object-fit: cover;
          border: 2px solid var(--border-primary);
        }

        .character-info {
          flex: 1;
          min-width: 0;

          .character-name {
            font-weight: var(--font-semibold);
            margin-bottom: var(--spacing-micro);
            font-size: var(--text-sm);
            color: var(--text-primary);
          }

          .character-desc {
            font-size: var(--text-xs);
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}

// 动画效果
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

// 响应式优化
@include desktop-up {
  .chat-sidebar {
    width: 380px;
    min-width: 280px;
    max-width: 420px;
  }
}

@include tablet-up {
  .chat-sidebar {
    width: 320px;
    min-width: 280px;
  }
}

@include mobile-only {
  .chat-page {
    padding: var(--spacing-micro);
  }

  .chat-container {
    flex-direction: column;
    height: calc(100vh - 1rem);
  }

  .chat-sidebar {
    width: 100%;
    height: 40vh;
    min-width: unset;
    max-width: unset;
    border-right: none;
    border-bottom: 1px solid var(--border-secondary);
  }

  .chat-main {
    height: 60vh;

    .welcome-content {
      .welcome-logo-container .welcome-logo {
        width: 80px;
        height: 80px;
      }

      h1 {
        font-size: var(--text-2xl);
      }
    }
  }

  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
  }

  .sidebar-header {
    padding: var(--spacing-normal);

    h2 {
      font-size: var(--text-base);
    }
  }
}

// 滚动条美化
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: var(--radius-sm);
  border: 2px solid var(--surface-2);

  &:hover {
    background: var(--brand-primary-400);
  }
}
</style>
