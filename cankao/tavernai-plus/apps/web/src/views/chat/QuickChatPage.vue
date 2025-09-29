<template>
  <div class="quick-chat-page min-h-screen bg-gray-50">
    <!-- 页面头部 -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- 标题 -->
          <div class="flex items-center">
            <router-link
              to="/"
              class="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <el-icon size="24"><ArrowLeft /></el-icon>
              <span class="font-medium">返回首页</span>
            </router-link>
            <div class="ml-6 hidden sm:block">
              <h1 class="text-xl font-bold text-gray-900">快速开始对话</h1>
              <p class="text-sm text-gray-600">30秒内开始与AI角色的精彩对话</p>
            </div>
          </div>

          <!-- 用户状态 -->
          <div class="flex items-center space-x-4">
            <div v-if="!userStore.isAuthenticated" class="hidden sm:flex items-center space-x-2">
              <span class="text-sm text-gray-600">登录后可保存对话记录</span>
              <TavernButton @click="handleLogin" variant="primary" size="sm">
                登录
              </TavernButton>
            </div>
            <div v-else class="flex items-center space-x-2">
              <img
                v-if="userStore.user?.avatar"
                :src="userStore.user.avatar"
                :alt="userStore.user.username"
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm font-medium text-gray-700">
                {{ userStore.user?.username }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 欢迎信息 -->
        <div v-if="!hasStartedFlow" class="welcome-section text-center mb-8">
          <div class="max-w-3xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              开始您的AI角色对话之旅
            </h2>
            <p class="text-lg text-gray-600 mb-6">
              选择您喜欢的角色，只需30秒即可开始富有创意的对话体验
            </p>

            <!-- 特色介绍 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="feature-card p-6 bg-white rounded-lg shadow-sm border">
                <div class="feature-icon mb-4">
                  <el-icon size="32" class="text-blue-500"><Rocket /></el-icon>
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">极速启动</h3>
                <p class="text-sm text-gray-600">智能默认设置，30秒内开始对话</p>
              </div>
              <div class="feature-card p-6 bg-white rounded-lg shadow-sm border">
                <div class="feature-icon mb-4">
                  <el-icon size="32" class="text-green-500"><Star /></el-icon>
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">丰富角色</h3>
                <p class="text-sm text-gray-600">数百个精心设计的AI角色等您体验</p>
              </div>
              <div class="feature-card p-6 bg-white rounded-lg shadow-sm border">
                <div class="feature-icon mb-4">
                  <el-icon size="32" class="text-purple-500"><Setting /></el-icon>
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">个性定制</h3>
                <p class="text-sm text-gray-600">可调整对话参数，创造独特体验</p>
              </div>
            </div>

            <!-- 开始按钮 -->
            <TavernButton
              @click="startQuickFlow"
              variant="primary"
              size="xl"
              class="px-8 py-3 text-lg"
            >
              立即开始
            </TavernButton>
          </div>
        </div>

        <!-- 快速开始流程 -->
        <div v-else class="flow-section">
          <QuickStartFlow
            :character-id="characterId"
            @chat-started="handleChatStarted"
            @flow-completed="handleFlowCompleted"
          />
        </div>

        <!-- 最近对话（已登录用户） -->
        <div v-if="userStore.isAuthenticated && recentSessions.length > 0" class="recent-chats mt-12">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900">最近对话</h3>
            <router-link
              to="/chat"
              class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              查看全部 →
            </router-link>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="session in recentSessions.slice(0, 3)"
              :key="session.id"
              @click="continueChat(session)"
              class="recent-chat-card cursor-pointer p-4 bg-white rounded-lg shadow-sm border hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div class="flex items-center space-x-3 mb-3">
                <img
                  v-if="session.characterAvatar"
                  :src="session.characterAvatar"
                  :alt="session.characterName"
                  class="w-10 h-10 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold"
                >
                  {{ session.characterName?.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 truncate">{{ session.characterName }}</h4>
                  <p class="text-sm text-gray-600 truncate">{{ session.title || '继续对话' }}</p>
                </div>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(session.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 登录对话框 -->
    <el-dialog
      v-model="showLoginDialog"
      title="登录以保存对话"
      width="400px"
      center
    >
      <div class="text-center">
        <p class="text-gray-600 mb-4">
          登录后可以保存对话记录，随时继续之前的对话
        </p>
        <div class="space-y-3">
          <TavernButton
            @click="navigateToLogin"
            variant="primary"
            size="lg"
            class="w-full"
          >
            登录账户
          </TavernButton>
          <TavernButton
            @click="continueAsGuest"
            variant="ghost"
            size="lg"
            class="w-full"
          >
            暂时跳过，以访客身份继续
          </TavernButton>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useChatStore, type ChatSession } from '@/stores/chat'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Rocket, Star, Setting } from '@element-plus/icons-vue'
import QuickStartFlow from '@/components/chat/QuickStartFlow.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

// 状态
const hasStartedFlow = ref(false)
const showLoginDialog = ref(false)
const recentSessions = ref<ChatSession[]>([])

// 从路由获取角色ID
const characterId = computed(() => route.params.characterId as string || undefined)

// 页面标题动态更新
const updatePageTitle = () => {
  if (characterId.value) {
    document.title = '快速开始对话 - TavernAI Plus'
  } else {
    document.title = '选择角色开始对话 - TavernAI Plus'
  }
}

// 开始快速流程
const startQuickFlow = () => {
  hasStartedFlow.value = true

  // 记录用户行为
  if (import.meta.env.PROD) {
    fetch('/api/analytics/quick-chat-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: characterId.value,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // 忽略分析错误
    })
  }
}

// 处理登录
const handleLogin = () => {
  showLoginDialog.value = true
}

const navigateToLogin = () => {
  showLoginDialog.value = false
  router.push({
    name: 'Login',
    query: { redirect: route.fullPath }
  })
}

const continueAsGuest = () => {
  showLoginDialog.value = false
  startQuickFlow()
}

// 处理对话开始
const handleChatStarted = (sessionId: string) => {
  ElMessage.success('对话已开始，正在跳转...')

  // 延迟跳转以显示成功消息
  setTimeout(() => {
    router.push(`/chat/${sessionId}`)
  }, 1000)
}

// 处理流程完成
const handleFlowCompleted = () => {
  // 记录完成事件
  if (import.meta.env.PROD) {
    fetch('/api/analytics/quick-chat-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: characterId.value,
        timestamp: Date.now()
      })
    }).catch(() => {
      // 忽略分析错误
    })
  }
}

// 继续之前的对话
const continueChat = (session: ChatSession) => {
  router.push(`/chat/${session.id}`)
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}小时前`
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 加载最近会话
const loadRecentSessions = async () => {
  if (userStore.isAuthenticated) {
    try {
      await chatStore.fetchSessions()
      recentSessions.value = chatStore.sessions.slice(0, 6)
    } catch (error) {
      console.error('加载最近会话失败:', error)
    }
  }
}

// 页面初始化
onMounted(async () => {
  updatePageTitle()

  // 如果有预选角色，直接开始流程
  if (characterId.value) {
    hasStartedFlow.value = true
  }

  // 加载用户的最近会话
  await loadRecentSessions()

  // 预加载关键资源
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // 预加载角色数据
      import('@/stores/character').then(({ useCharacterStore }) => {
        const characterStore = useCharacterStore()
        characterStore.fetchCharacters({ limit: 20 })
      })
    })
  }
})
</script>

<style scoped>
.quick-chat-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.feature-card {
  @apply transform transition-all duration-300;
}

.feature-card:hover {
  @apply scale-105 shadow-lg;
}

.feature-icon {
  @apply flex justify-center;
}

.recent-chat-card {
  @apply transform transition-all duration-200;
}

.recent-chat-card:hover {
  @apply scale-105;
}

.main-content {
  @apply relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  z-index: -1;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .welcome-section h2 {
    @apply text-2xl;
  }

  .welcome-section p {
    @apply text-base;
  }

  .feature-card {
    @apply p-4;
  }

  .grid {
    @apply grid-cols-1;
  }
}

/* 可访问性增强 */
.recent-chat-card:focus {
  @apply outline-2 outline-indigo-500 outline-offset-2;
}

.feature-card:focus {
  @apply outline-2 outline-indigo-500 outline-offset-2;
}
</style>