<template>
  <div class="chat-page">
    <!-- PC端优化的侧边栏布局 -->
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h2>对话列表</h2>
          <button @click="createNewChat" class="btn-new-chat">
            <i class="fas fa-plus"></i>
            新对话
          </button>
        </div>

        <!-- 对话列表 -->
        <div class="chat-list">
          <!-- 现有对话 -->
          <div
            v-for="chat in chatList"
            :key="chat.id"
            @click="openChat(chat.id)"
            class="chat-item"
            :class="{ active: selectedChatId === chat.id }"
          >
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
              <span v-if="chat.unreadCount > 0" class="unread-badge">
                {{ chat.unreadCount }}
              </span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!chatList || chatList.length === 0" class="empty-state">
            <i class="fas fa-comments"></i>
            <p>还没有对话</p>
            <button @click="createNewChat" class="btn-primary">
              开始新对话
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div class="chat-main">
        <router-view v-if="selectedChatId" />
        <div v-else class="welcome-screen">
          <div class="welcome-content">
            <img src="/miaoda-ai.svg" alt="MIAODA AI" class="welcome-logo" />
            <h1>欢迎使用 TavernAI Plus</h1>
            <p>选择一个对话或创建新对话开始</p>
            <button @click="createNewChat" class="btn-primary btn-lg">
              <i class="fas fa-plus"></i>
              创建新对话
            </button>
          </div>

          <!-- 快速开始卡片 -->
          <div class="quick-start">
            <h3>热门角色</h3>
            <div class="character-grid">
              <div
                v-for="char in popularCharacters"
                :key="char.id"
                @click="quickStart(char)"
                class="character-card"
              >
                <img :src="char.avatar || '/default-avatar.png'" :alt="char.name" />
                <span>{{ char.name }}</span>
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
    >
      <div class="character-selector">
        <el-input
          v-model="characterSearchQuery"
          placeholder="搜索角色..."
          prefix-icon="Search"
          class="mb-4"
          clearable
        />

        <div class="character-grid-modal">
          <div
            v-for="character in filteredCharacters"
            :key="character.id"
            @click="selectCharacter(character)"
            class="character-option"
          >
            <img
              :src="character.avatar || '/default-avatar.png'"
              :alt="character.name"
            />
            <div class="character-info">
              <div class="character-name">{{ character.name }}</div>
              <div class="character-desc">{{ character.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showCharacterSelector = false">取消</el-button>
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
.chat-page {
  height: 100vh;
  background: #f5f5f7;
}

.chat-container {
  display: flex;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.05);
}

// 左侧边栏
.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e5e5e7;
  display: flex;
  flex-direction: column;
  background: #fbfbfd;

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e5e5e7;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .btn-new-chat {
      padding: 8px 16px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        background: #5558e3;
        transform: translateY(-1px);
      }

      i {
        font-size: 12px;
      }
    }
  }

  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .chat-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 4px;
      background: white;

      &:hover {
        background: #f0f0f5;
      }

      &.active {
        background: #6366f1;
        color: white;

        .chat-preview,
        .chat-time {
          color: rgba(255, 255, 255, 0.8);
        }
      }

      .chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        margin-right: 12px;
        object-fit: cover;
      }

      .chat-info {
        flex: 1;
        min-width: 0;

        .chat-name {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .chat-preview {
          font-size: 13px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .chat-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;

        .chat-time {
          font-size: 11px;
          color: #999;
        }

        .unread-badge {
          background: #ff4757;
          color: white;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;

      i {
        font-size: 48px;
        margin-bottom: 16px;
        color: #ddd;
      }

      p {
        margin-bottom: 20px;
        font-size: 14px;
      }
    }
  }
}

// 右侧主区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;

  .welcome-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;

    .welcome-content {
      text-align: center;
      margin-bottom: 60px;

      .welcome-logo {
        width: 120px;
        height: 120px;
        margin-bottom: 24px;
        opacity: 0.9;
      }

      h1 {
        font-size: 32px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 8px;
      }

      p {
        font-size: 16px;
        color: #666;
        margin-bottom: 24px;
      }

      .btn-primary {
        padding: 12px 32px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #5558e3;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }

        i {
          margin-right: 8px;
        }
      }
    }

    .quick-start {
      width: 100%;
      max-width: 800px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #333;
      }

      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;

        .character-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: #f8f8fa;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background: #6366f1;
            color: white;
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

            img {
              border-color: white;
            }
          }

          img {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            margin-bottom: 8px;
            border: 3px solid #e5e5e7;
            object-fit: cover;
          }

          span {
            font-size: 13px;
            font-weight: 500;
            text-align: center;
          }
        }
      }
    }
  }
}

// 角色选择对话框
.character-selector {
  .character-grid-modal {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px;

    .character-option {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #f8f8fa;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      border: 2px solid transparent;

      &:hover {
        background: #6366f1;
        color: white;
        border-color: #6366f1;

        .character-desc {
          color: rgba(255, 255, 255, 0.9);
        }
      }

      img {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        margin-right: 12px;
        object-fit: cover;
      }

      .character-info {
        flex: 1;
        min-width: 0;

        .character-name {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .character-desc {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

// 响应式优化
@media (max-width: 1024px) {
  .chat-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }

  .chat-sidebar {
    width: 100%;
    height: 40vh;
    border-right: none;
    border-bottom: 1px solid #e5e5e7;
  }

  .chat-main {
    height: 60vh;
  }
}

// 滚动条美化
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
