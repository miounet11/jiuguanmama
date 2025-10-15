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
          <TavernButton
            @click="createNewChat"
            variant="primary"
            size="sm"
            class="btn-new-chat"
          >
            <TavernIcon name="plus" size="sm" />
            新对话
          </TavernButton>
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
          <TavernButton
            variant="ghost"
            size="md"
            @click="openMobileConversationList"
            class="mobile-nav-btn"
          >
            <TavernIcon name="bars-3" size="lg" />
          </TavernButton>

          <div class="mobile-chat-title">
            <span class="mobile-chat-name">{{ getCurrentChatName() }}</span>
          </div>

          <TavernButton
            variant="ghost"
            size="md"
            @click="showMobileChatOptions"
            class="mobile-nav-btn"
          >
            <TavernIcon name="ellipsis-vertical" size="lg" />
          </TavernButton>
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
              <TavernButton @click="createNewChat" variant="primary" size="lg" class="create-chat-btn">
                <TavernIcon name="plus" />
                创建新对话
              </TavernButton>
            </div>

            <!-- 快速开始卡片 -->
            <div class="quick-start">
              <h3 class="gradient-text">热门角色</h3>
              <div class="character-grid">
                <TavernCard
                  v-for="char in popularCharacters"
                  :key="char.id"
                  @click="quickStart(char)"
                  class="character-quick-card"
                  variant="glass"
                  hoverable
                >
                  <div class="character-card-content">
                    <img :src="char.avatar || '/default-avatar.png'" :alt="char.name" class="character-avatar" />
                    <span class="character-name">{{ char.name }}</span>
                  </div>
                </TavernCard>
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
        <TavernInput
          v-model="characterSearchQuery"
          placeholder="搜索角色..."
          class="mb-4"
          clearable
        >
          <template #prefix>
            <TavernIcon name="magnifying-glass" size="sm" />
          </template>
        </TavernInput>

        <div class="character-grid-modal">
          <TavernCard
            v-for="character in filteredCharacters"
            :key="character.id"
            @click="selectCharacter(character)"
            class="character-option"
            variant="glass"
            hoverable
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
          </TavernCard>
        </div>
      </div>

      <template #footer>
        <TavernButton @click="showCharacterSelector = false" variant="secondary">
          取消
        </TavernButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDialog } from 'element-plus'
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
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    messageCount: chat.messageCount || 0,
    unreadCount: chat.unreadCount || 0,
    isPinned: false, // TODO: 从后端获取置顶状态
    isArchived: false, // TODO: 从后端获取归档状态
    isOnline: Math.random() > 0.5, // TODO: 从后端获取在线状态
    isStreaming: false, // TODO: 从WebSocket获取流式状态
    hasError: false, // TODO: 从状态管理获取错误状态
    isEdited: false, // TODO: 从后端获取编辑状态
    lastMessageSender: '', // TODO: 从消息数据获取发送者
    tags: [], // TODO: 从后端获取标签
    characterStatus: Math.random() > 0.5 ? 'online' : 'offline' as 'online' | 'offline' // TODO: 从后端获取状态
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
      params: {
        page,
        limit: pageSize.value,
        includeDetails: true
      }
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
    const response = await api.get('/characters/popular')
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
    const response = await api.get('/characters')
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
    const response = await api.post('/chat/sessions', {
      characterId: character.id,
      title: `与${character.name}的对话`
    })

    if (response.success && response.session) {
      showCharacterSelector.value = false
      await fetchChats()
      router.push(`/chat/${response.session.id}`)
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

// 打开对话
const openChat = (chatId: string) => {
  selectedChatId.value = chatId
  router.push(`/chat/${chatId}`)
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
watch(() => route.params.sessionId, (newId) => {
  if (newId) {
    selectedChatId.value = newId as string
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
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-md);
}

.chat-container {
  display: flex;
  height: calc(100vh - 2rem);
  max-width: 1600px;
  margin: 0 auto;
  background: var(--dt-color-surface-primary);
  border-radius: var(--dt-border-radius-lg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--dt-color-border-primary);
  box-shadow: var(--dt-shadow-xl);
  overflow: hidden;
}

// 左侧边栏
.chat-sidebar {
  width: 380px;
  min-width: 280px;
  max-width: 420px;
  border-right: 1px solid var(--dt-color-border-secondary);
  display: flex;
  flex-direction: column;
  background: var(--dt-color-surface-secondary);
  backdrop-filter: blur(10px);
  flex-shrink: 0;

  .sidebar-header {
    padding: var(--dt-spacing-lg);
    border-bottom: 1px solid var(--dt-color-border-tertiary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--dt-color-surface-primary);
    backdrop-filter: blur(15px);

    h2 {
      font-size: var(--dt-font-size-lg);
      font-weight: var(--dt-font-weight-semibold);
      margin: 0;

      &.gradient-text {
        background: var(--dt-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .btn-new-chat {
      gap: var(--dt-spacing-xs);
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
  background: var(--dt-color-surface-primary);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

// 移动端聊天头部
.mobile-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--dt-spacing-sm) var(--dt-spacing-md);
  background: var(--dt-color-surface-secondary);
  border-bottom: 1px solid var(--dt-color-border-secondary);
  height: 60px;
  flex-shrink: 0;
}

.mobile-nav-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dt-border-radius-lg);
}

.mobile-chat-title {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.mobile-chat-name {
  font-size: var(--dt-font-size-base);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
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
    padding: var(--dt-spacing-4xl);
    position: relative;

    .welcome-content {
      text-align: center;
      margin-bottom: var(--dt-spacing-4xl);
      z-index: 2;

      .welcome-logo-container {
        position: relative;
        margin-bottom: var(--dt-spacing-2xl);

        .welcome-logo {
          width: 120px;
          height: 120px;
          opacity: 0.9;
          filter: drop-shadow(0 0 20px var(--dt-color-primary-400));
          animation: float 3s ease-in-out infinite;
        }

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--dt-color-primary-500) 0%, transparent 70%);
          opacity: 0.1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
      }

      h1 {
        font-size: var(--dt-font-size-4xl);
        font-weight: var(--dt-font-weight-bold);
        margin-bottom: var(--dt-spacing-sm);

        &.gradient-title {
          background: var(--dt-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      p {
        font-size: var(--dt-font-size-lg);
        color: var(--dt-color-text-secondary);
        margin-bottom: var(--dt-spacing-xl);
      }

      .create-chat-btn {
        gap: var(--dt-spacing-sm);
      }
    }

    .quick-start {
      width: 100%;
      max-width: 800px;
      z-index: 2;

      h3 {
        font-size: var(--dt-font-size-xl);
        font-weight: var(--dt-font-weight-semibold);
        margin-bottom: var(--dt-spacing-lg);
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
        gap: var(--dt-spacing-lg);

        .character-quick-card {
          cursor: pointer;
          transition: all var(--dt-transition-normal);

          &:hover {
            transform: translateY(-8px) scale(1.05);
            box-shadow: var(--dt-shadow-2xl);
          }

          .character-card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: var(--dt-spacing-lg);
            text-align: center;

            .character-avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin-bottom: var(--dt-spacing-sm);
              border: 3px solid var(--dt-color-border-primary);
              object-fit: cover;
              transition: all var(--dt-transition-normal);
            }

            .character-name {
              font-size: var(--dt-font-size-sm);
              font-weight: var(--dt-font-weight-medium);
              color: var(--dt-color-text-primary);
            }
          }
        }
      }
    }
  }

// 角色选择对话框
.character-selector-dialog {
  :deep(.el-dialog) {
    background: var(--dt-color-surface-primary);
    border: 1px solid var(--dt-color-border-primary);
    backdrop-filter: blur(20px);
  }

  :deep(.el-dialog__title) {
    color: var(--dt-color-text-primary);
    font-weight: var(--dt-font-weight-semibold);
  }
}

.character-selector {
  .mb-4 {
    margin-bottom: var(--dt-spacing-lg);
  }

  .character-grid-modal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--dt-spacing-md);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--dt-spacing-xs);

    .character-option {
      cursor: pointer;
      transition: all var(--dt-transition-normal);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--dt-shadow-lg);
      }

      .character-option-content {
        display: flex;
        align-items: center;
        padding: var(--dt-spacing-md);

        .character-option-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-right: var(--dt-spacing-md);
          object-fit: cover;
          border: 2px solid var(--dt-color-border-primary);
        }

        .character-info {
          flex: 1;
          min-width: 0;

          .character-name {
            font-weight: var(--dt-font-weight-semibold);
            margin-bottom: var(--dt-spacing-xs);
            font-size: var(--dt-font-size-sm);
            color: var(--dt-color-text-primary);
          }

          .character-desc {
            font-size: var(--dt-font-size-xs);
            color: var(--dt-color-text-secondary);
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
@media (max-width: 1440px) {
  .chat-sidebar {
    width: 320px;
    min-width: 280px;
  }
}

@media (max-width: 1200px) {
  .chat-sidebar {
    width: 300px;
    min-width: 260px;
  }

  .chat-page {
    padding: var(--dt-spacing-sm);
  }
}

@media (max-width: 1024px) {
  .chat-sidebar {
    width: 280px;
    min-width: 240px;
  }

  .chat-page {
    padding: var(--dt-spacing-sm);
  }

  .chat-container {
    height: calc(100vh - 1.5rem);
  }
}

@media (max-width: 768px) {
  .chat-page {
    padding: var(--dt-spacing-xs);
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
    border-bottom: 1px solid var(--dt-color-border-secondary);
  }

  .chat-main {
    height: 60vh;

    .welcome-content {
      .welcome-logo-container .welcome-logo {
        width: 80px;
        height: 80px;
      }

      h1 {
        font-size: var(--dt-font-size-2xl);
      }
    }
  }

  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
  }
}

@media (max-width: 480px) {
  .chat-page {
    padding: var(--dt-spacing-xs);
  }

  .chat-sidebar {
    height: 35vh;

    .sidebar-header {
      padding: var(--dt-spacing-md);

      h2 {
        font-size: var(--dt-font-size-md);
      }
    }

    .chat-item {
      .chat-item-content {
        padding: var(--dt-spacing-sm);
      }

      .chat-avatar {
        width: 40px;
        height: 40px;
        margin-right: var(--dt-spacing-sm);
      }
    }
  }

  .chat-main {
    height: 65vh;
  }
}

// 滚动条美化
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--dt-color-surface-secondary);
  border-radius: var(--dt-border-radius-sm);
}

::-webkit-scrollbar-thumb {
  background: var(--dt-color-border-primary);
  border-radius: var(--dt-border-radius-sm);
  border: 2px solid var(--dt-color-surface-secondary);

  &:hover {
    background: var(--dt-color-primary-400);
  }
}
</style>
