<template>
  <div class="chat-page">
    <!-- PC端优化的侧边栏布局 -->
    <div class="chat-container">
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

        <!-- 对话列表 -->
        <div class="chat-list">
          <!-- 现有对话 -->
          <TavernCard
            v-for="chat in chatList"
            :key="chat.id"
            @click="openChat(chat.id)"
            class="chat-item"
            :class="{ active: selectedChatId === chat.id }"
            variant="glass"
            hoverable
          >
            <div class="chat-item-content">
              <img
                :src="chat.character?.avatar || '/default-avatar.png'"
                :alt="chat.character?.name || '角色'"
                class="chat-avatar"
              />
              <div class="chat-info">
                <div class="chat-name">{{ chat.character?.name || '未知角色' }}</div>
                <div class="chat-preview">{{ chat.lastMessage || '暂无消息' }}</div>
              </div>
              <div class="chat-meta">
                <span class="chat-time">{{ formatTime(chat.lastMessageAt) }}</span>
                <TavernBadge v-if="chat.unreadCount > 0" variant="danger" size="sm">
                  {{ chat.unreadCount }}
                </TavernBadge>
              </div>
            </div>
          </TavernCard>

          <!-- 空状态 -->
          <div v-if="!chatList || chatList.length === 0" class="empty-state">
            <TavernIcon name="chat-bubble-left-right" size="4xl" class="empty-icon" />
            <p>还没有对话</p>
            <TavernButton @click="createNewChat" variant="primary">
              开始新对话
            </TavernButton>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElDialog } from 'element-plus'
import { api } from '@/services/api'

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

// 计算属性
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
const fetchChats = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/chat/sessions')

    if (response.success && response.sessions) {
      chatList.value = response.sessions
    } else {
      chatList.value = []
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
    chatList.value = []
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

// 监听路由变化
watch(() => route.params.sessionId, (newId) => {
  if (newId) {
    selectedChatId.value = newId as string
  }
})

// 初始化
onMounted(async () => {
  await fetchChats()
  await fetchPopularCharacters()

  // 如果路由中有sessionId，设置选中状态
  if (route.params.sessionId) {
    selectedChatId.value = route.params.sessionId as string
  }
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
    overflow-y: auto;
    padding: var(--dt-spacing-sm);

    .chat-item {
      margin-bottom: var(--dt-spacing-xs);
      cursor: pointer;
      transition: all var(--dt-transition-normal);
      border-radius: var(--dt-border-radius-lg);

      &.active {
        background: var(--dt-gradient-primary) !important;
        border-color: var(--dt-color-primary-500) !important;
        transform: translateY(-2px);
        box-shadow: var(--dt-shadow-lg);

        .chat-item-content {
          color: var(--dt-color-text-inverse);

          .chat-preview,
          .chat-time {
            color: var(--dt-color-text-inverse-secondary);
          }
        }
      }

      .chat-item-content {
        display: flex;
        align-items: center;
        padding: var(--dt-spacing-md);
        width: 100%;
      }

      .chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        margin-right: var(--dt-spacing-md);
        object-fit: cover;
        border: 2px solid var(--dt-color-border-primary);
        transition: all var(--dt-transition-normal);
      }

      .chat-info {
        flex: 1;
        min-width: 0;

        .chat-name {
          font-weight: var(--dt-font-weight-semibold);
          margin-bottom: var(--dt-spacing-xs);
          font-size: var(--dt-font-size-sm);
          color: var(--dt-color-text-primary);
        }

        .chat-preview {
          font-size: var(--dt-font-size-xs);
          color: var(--dt-color-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .chat-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--dt-spacing-xs);

        .chat-time {
          font-size: var(--dt-font-size-xs);
          color: var(--dt-color-text-tertiary);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: var(--dt-spacing-4xl) var(--dt-spacing-lg);
      color: var(--dt-color-text-secondary);

      .empty-icon {
        margin-bottom: var(--dt-spacing-lg);
        color: var(--dt-color-text-tertiary);
        opacity: 0.6;
      }

      p {
        margin-bottom: var(--dt-spacing-lg);
        font-size: var(--dt-font-size-sm);
        color: var(--dt-color-text-secondary);
      }
    }
  }
}

// 右侧主区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--dt-color-surface-primary);
  backdrop-filter: blur(10px);

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
