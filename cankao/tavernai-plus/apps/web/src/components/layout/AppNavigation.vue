<template>
  <nav class="app-navigation">
    <div class="nav-container">
      <!-- Logo 和品牌 -->
      <div class="nav-brand">
        <router-link to="/" class="brand-link">
          <div class="brand-logo">
            <span class="logo-icon">🏰</span>
            <span class="brand-text">TavernAI Plus</span>
          </div>
        </router-link>
      </div>

      <!-- 主导航菜单 -->
      <div class="nav-menu">
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'nav-item',
            { 'nav-item--active': isActiveRoute(item.path) }
          ]"
        >
          <el-icon class="nav-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </div>

      <!-- 右侧操作区 -->
      <div class="nav-actions">
        <!-- 搜索框 -->
        <div class="search-box" v-if="showSearch">
          <el-input
            v-model="searchQuery"
            placeholder="搜索角色、用户..."
            prefix-icon="Search"
            @keyup.enter="handleSearch"
            @focus="showSearchSuggestions = true"
            @blur="hideSearchSuggestions"
          />
          <!-- 搜索建议 -->
          <div v-if="showSearchSuggestions && searchSuggestions.length" class="search-suggestions">
            <div
              v-for="suggestion in searchSuggestions"
              :key="suggestion.id"
              class="suggestion-item"
              @click="selectSuggestion(suggestion)"
            >
              <el-icon class="suggestion-icon">
                <component :is="suggestion.type === 'user' ? 'User' : 'Avatar'" />
              </el-icon>
              <span>{{ suggestion.name }}</span>
              <span class="suggestion-type">{{ suggestion.type === 'user' ? '用户' : '角色' }}</span>
            </div>
          </div>
        </div>

        <!-- 快速操作按钮 -->
        <div class="quick-actions">
          <!-- 通知按钮 -->
          <el-button
            v-if="userStore.isAuthenticated"
            text
            circle
            @click="$emit('notification-click')"
            class="action-btn notification-btn"
          >
            <el-icon :size="20">
              <Bell />
            </el-icon>
            <span v-if="unreadCount > 0" class="notification-count">{{ formatNotificationCount(unreadCount) }}</span>
          </el-button>

          <!-- 创建按钮 -->
          <el-dropdown v-if="userStore.isAuthenticated" @command="handleCreateCommand" placement="bottom-end">
            <el-button type="primary" class="create-btn">
              <el-icon><Plus /></el-icon>
              <span class="create-text">创建</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="post">
                  <el-icon><EditPen /></el-icon>
                  发布动态
                </el-dropdown-item>
                <el-dropdown-item command="character">
                  <el-icon><Avatar /></el-icon>
                  创建角色
                </el-dropdown-item>
                <el-dropdown-item command="chat">
                  <el-icon><ChatDotRound /></el-icon>
                  开始聊天
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 用户菜单 -->
          <el-dropdown v-if="userStore.isAuthenticated" @command="handleUserCommand" placement="bottom-end">
            <div class="user-menu-trigger">
              <el-avatar :size="36" :src="userStore.user?.avatar">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" class="user-info">
                  <div class="user-avatar">
                    <el-avatar :size="32" :src="userStore.user?.avatar">
                      {{ userStore.user?.username?.charAt(0).toUpperCase() }}
                    </el-avatar>
                  </div>
                  <div class="user-details">
                    <div class="username">{{ userStore.user?.username }}</div>
                    <div class="user-email">{{ userStore.user?.email }}</div>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="my-profile">
                  <el-icon><User /></el-icon>
                  我的资料
                </el-dropdown-item>
                <el-dropdown-item command="my-characters">
                  <el-icon><Collection /></el-icon>
                  我的角色
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item command="subscription">
                  <el-icon><Star /></el-icon>
                  订阅管理
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided class="text-red-500">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 未登录状态 -->
          <div v-else class="auth-buttons">
            <router-link to="/login">
              <el-button>登录</el-button>
            </router-link>
            <router-link to="/register">
              <el-button type="primary">注册</el-button>
            </router-link>
          </div>
        </div>

        <!-- 移动端菜单按钮 -->
        <el-button
          text
          circle
          @click="toggleMobileMenu"
          class="mobile-menu-btn md:hidden"
        >
          <el-icon :size="24">
            <component :is="showMobileMenu ? 'Close' : 'Menu'" />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu" class="mobile-menu md:hidden">
      <div class="mobile-menu-content">
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'mobile-nav-item',
            { 'mobile-nav-item--active': isActiveRoute(item.path) }
          ]"
          @click="closeMobileMenu"
        >
          <el-icon class="mobile-nav-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="mobile-nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="mobile-nav-badge">{{ item.badge }}</span>
        </router-link>

        <!-- 移动端用户操作 -->
        <div v-if="userStore.isAuthenticated" class="mobile-user-section">
          <div class="mobile-user-info">
            <el-avatar :size="48" :src="userStore.user?.avatar">
              {{ userStore.user?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="mobile-user-details">
              <div class="mobile-username">{{ userStore.user?.username }}</div>
              <div class="mobile-user-email">{{ userStore.user?.email }}</div>
            </div>
          </div>
          <div class="mobile-user-actions">
            <el-button @click="goToProfile" class="mobile-action-btn">我的资料</el-button>
            <el-button @click="goToSettings" class="mobile-action-btn">设置</el-button>
            <el-button @click="logout" type="danger" class="mobile-action-btn">退出登录</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建动态对话框 -->
    <CreatePostDialog
      v-model="showCreatePostDialog"
      @created="handlePostCreated"
    />
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import CreatePostDialog from '@/components/community/CreatePostDialog.vue'
import {
  Home,
  Avatar,
  Compass,
  ChatDotRound,
  Bell,
  Plus,
  EditPen,
  User,
  Collection,
  Setting,
  Star,
  SwitchButton,
  Search,
  Menu,
  Close
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'

interface Emits {
  'notification-click': []
}

defineEmits<Emits>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const searchQuery = ref('')
const showSearchSuggestions = ref(false)
const searchSuggestions = ref<Array<{ id: string; name: string; type: 'user' | 'character' }>>([])
const showMobileMenu = ref(false)
const showCreatePostDialog = ref(false)
const unreadCount = ref(0)

// 计算属性
const showSearch = computed(() => {
  return !route.meta.hideSearch
})

// 导航菜单配置
const navigationItems = computed(() => [
  { path: '/', label: '首页', icon: Home },
  { path: '/characters', label: '角色', icon: Avatar },
  { path: '/marketplace', label: '市场', icon: Compass },
  { path: '/community', label: '社区', icon: ChatDotRound, badge: unreadCount.value > 0 ? unreadCount.value : undefined },
  { path: '/chat', label: '聊天', icon: ChatDotRound, requiresAuth: true }
].filter(item => !item.requiresAuth || userStore.isAuthenticated))

// 方法
const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
    searchQuery.value = ''
    showSearchSuggestions.value = false
  }
}

const debouncedSearch = debounce(async () => {
  if (searchQuery.value.length >= 2) {
    try {
      const response = await communityStore.search({
        query: searchQuery.value,
        type: 'all'
      }, 1, 5)

      if (response.success && response.data) {
        searchSuggestions.value = [
          ...response.data.users.map(u => ({ id: u.id, name: u.username, type: 'user' as const })),
          ...response.data.characters.map(c => ({ id: c.id, name: c.name, type: 'character' as const }))
        ].slice(0, 5)
      }
    } catch (error) {
      console.error('搜索建议失败:', error)
    }
  } else {
    searchSuggestions.value = []
  }
}, 300)

const selectSuggestion = (suggestion: any) => {
  if (suggestion.type === 'user') {
    router.push(`/community/user/${suggestion.id}`)
  } else {
    router.push(`/characters/${suggestion.id}`)
  }
  searchQuery.value = ''
  showSearchSuggestions.value = false
}

const hideSearchSuggestions = () => {
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 200)
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const handleCreateCommand = (command: string) => {
  switch (command) {
    case 'post':
      showCreatePostDialog.value = true
      break
    case 'character':
      router.push('/studio/character/create')
      break
    case 'chat':
      router.push('/chat')
      break
  }
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
    case 'my-profile':
      router.push(`/community/user/${userStore.user?.id}`)
      break
    case 'my-characters':
      router.push('/studio')
      break
    case 'settings':
      router.push('/profile/settings')
      break
    case 'subscription':
      router.push('/subscription')
      break
    case 'logout':
      logout()
      break
  }
}

const handlePostCreated = () => {
  ElMessage.success('动态发布成功!')
  // 如果当前在社区页面，可以刷新动态列表
  if (route.path.startsWith('/community')) {
    // 触发刷新
    router.go(0)
  }
}

const goToProfile = () => {
  router.push(`/community/user/${userStore.user?.id}`)
  closeMobileMenu()
}

const goToSettings = () => {
  router.push('/profile/settings')
  closeMobileMenu()
}

const logout = async () => {
  try {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage.error('退出登录失败')
  }
  closeMobileMenu()
}

const formatNotificationCount = (count: number) => {
  if (count > 99) return '99+'
  return count.toString()
}

const loadUnreadNotificationCount = async () => {
  if (userStore.isAuthenticated) {
    try {
      const response = await communityStore.getUnreadNotificationCount()
      if (response.success && response.data) {
        unreadCount.value = response.data.count
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
    }
  }
}

// 监听搜索输入
watch(searchQuery, () => {
  if (searchQuery.value.length >= 2) {
    debouncedSearch()
  } else {
    searchSuggestions.value = []
  }
})

// 监听用户登录状态变化
watch(() => userStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    loadUnreadNotificationCount()
  } else {
    unreadCount.value = 0
  }
})

// 生命周期
onMounted(() => {
  loadUnreadNotificationCount()

  // 定期更新未读通知数量
  if (userStore.isAuthenticated) {
    setInterval(loadUnreadNotificationCount, 60000) // 每分钟更新一次
  }
})
</script>

<style scoped>
.app-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  flex-shrink: 0;
}

.brand-link {
  text-decoration: none;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f3f4f6 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #9ca3af;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  color: #c084fc;
  background-color: rgba(139, 92, 246, 0.1);
}

.nav-item--active {
  color: #c084fc;
  background-color: rgba(139, 92, 246, 0.2);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-weight: 500;
}

.nav-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  width: 240px;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: rgba(139, 92, 246, 0.1);
}

.suggestion-icon {
  color: #9ca3af;
}

.suggestion-type {
  margin-left: auto;
  font-size: 0.75rem;
  color: #6b7280;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  position: relative;
  color: #9ca3af;
}

.notification-btn {
  position: relative;
}

.notification-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
  border-radius: 9999px;
  min-width: 1rem;
  text-align: center;
  line-height: 1;
}

.create-btn {
  background: linear-gradient(135deg, #8b5cf6, #c084fc);
  border: none;
}

.create-text {
  margin-left: 0.25rem;
}

.user-menu-trigger {
  cursor: pointer;
  transition: transform 0.2s;
}

.user-menu-trigger:hover {
  transform: scale(1.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  pointer-events: none;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: white;
}

.user-email {
  font-size: 0.875rem;
  color: #9ca3af;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-menu-btn {
  color: #9ca3af;
}

.mobile-menu {
  background: rgba(17, 24, 39, 0.98);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.mobile-menu-content {
  padding: 1rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #9ca3af;
  transition: all 0.2s;
  position: relative;
}

.mobile-nav-item:hover,
.mobile-nav-item--active {
  color: #c084fc;
  background-color: rgba(139, 92, 246, 0.1);
}

.mobile-nav-icon {
  font-size: 1.25rem;
}

.mobile-nav-text {
  font-weight: 500;
  flex: 1;
}

.mobile-nav-badge {
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
}

.mobile-user-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.mobile-user-details {
  display: flex;
  flex-direction: column;
}

.mobile-username {
  font-weight: 600;
  color: white;
}

.mobile-user-email {
  font-size: 0.875rem;
  color: #9ca3af;
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-action-btn {
  width: 100%;
  justify-content: flex-start;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    height: 60px;
    padding: 0 0.75rem;
  }

  .nav-menu {
    display: none;
  }

  .search-box {
    display: none;
  }

  .create-text {
    display: none;
  }
}
</style>
