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
          <el-dropdown v-if="userStore.isAuthenticated" @command="handleUserCommand" placement="bottom-end" trigger="click">
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
          class="mobile-menu-btn mobile-only"
        >
          <el-icon :size="24">
            <component :is="showMobileMenu ? 'Close' : 'Menu'" />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <div v-if="showMobileMenu" class="mobile-menu mobile-only">
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
  House,
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
  Close,
  Document
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
  { path: '/', label: '首页', icon: House },
  { path: '/characters', label: '角色', icon: Avatar },
  { path: '/scenarios', label: '剧本管理', icon: Document, requiresAuth: true },
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

<style lang="scss" scoped>
.app-navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba($dark-bg-primary, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba($primary-500, 0.2);
}

.nav-container {
  max-width: $container-max-width;
  margin: 0 auto;
  padding: 0 $spacing-4;
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
  gap: $spacing-2;
  transition: transform $transition-base;

  &:hover {
    transform: scale(1.02);
  }
}

.logo-icon {
  font-size: $font-size-2xl;
  filter: drop-shadow(0 0 8px rgba($primary-500, 0.3));
}

.brand-text {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  background: linear-gradient(135deg, #{$primary-400}, #{$primary-600});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: $spacing-4;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  padding: $spacing-2 $spacing-4;
  border-radius: $border-radius-base;
  text-decoration: none;
  color: $text-secondary;
  transition: all $transition-base;
  position: relative;
  font-weight: $font-weight-medium;

  &::before {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 60%;
    height: 2px;
    background: linear-gradient(135deg, #{$primary-400}, #{$primary-600});
    transition: transform $transition-base;
    border-radius: $border-radius-full;
  }

  &:hover {
    color: $primary-400;
    background-color: rgba($primary-500, 0.1);
    transform: translateY(-1px);

    &::before {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &--active {
    color: $primary-400;
    background-color: rgba($primary-500, 0.2);
    box-shadow: 0 0 20px rgba($primary-500, 0.3);

    &::before {
      transform: translateX(-50%) scaleX(1);
    }
  }
}

.nav-icon {
  font-size: $font-size-lg;
  transition: transform $transition-base;

  .nav-item:hover & {
    transform: scale(1.1);
  }
}

.nav-text {
  font-weight: $font-weight-medium;
  white-space: nowrap;
}

.nav-badge {
  background: $error-color;
  color: white;
  font-size: $font-size-xs;
  padding: $spacing-1 $spacing-1;
  border-radius: $border-radius-full;
  min-width: 1.25rem;
  text-align: center;
  font-weight: $font-weight-medium;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 4px rgba($error-color, 0.3);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: $spacing-4;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  width: 240px;
  transition: width $transition-base;

  &:focus-within {
    width: 280px;
  }
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba($dark-bg-primary, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: $border-radius-base;
  margin-top: $spacing-1;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  box-shadow: $shadow-lg;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  padding: $spacing-3 $spacing-4;
  cursor: pointer;
  transition: all $transition-base;
  border-bottom: 1px solid rgba($gray-700, 0.2);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba($primary-500, 0.1);
    transform: translateX(4px);
  }
}

.suggestion-icon {
  color: $text-secondary;
  transition: color $transition-base;

  .suggestion-item:hover & {
    color: $primary-400;
  }
}

.suggestion-type {
  margin-left: auto;
  font-size: $font-size-xs;
  color: $text-muted;
  background: rgba($primary-500, 0.1);
  padding: 2px 8px;
  border-radius: $border-radius-full;
  font-weight: $font-weight-medium;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: $spacing-3;
}

.action-btn {
  position: relative;
  color: $text-secondary;
  transition: all $transition-base;

  &:hover {
    color: $primary-400;
    transform: scale(1.1);
  }
}

.notification-btn {
  position: relative;

  &:hover {
    .notification-count {
      transform: scale(1.1);
    }
  }
}

.notification-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: $error-color;
  color: white;
  font-size: $font-size-xs;
  padding: 2px 4px;
  border-radius: $border-radius-full;
  min-width: 1rem;
  text-align: center;
  line-height: 1;
  font-weight: $font-weight-bold;
  box-shadow: 0 2px 4px rgba($error-color, 0.3);
  animation: pulse 2s infinite;
  transition: transform $transition-base;
}

.create-btn {
  background: linear-gradient(135deg, #{$primary-400}, #{$primary-600});
  border: none;
  box-shadow: 0 0 20px rgba($primary-500, 0.3);
  transition: all $transition-base;
  font-weight: $font-weight-medium;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-xl, 0 0 20px rgba($primary-500, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.create-text {
  margin-left: $spacing-1;
}

.user-menu-trigger {
  cursor: pointer;
  transition: all $transition-base;
  border-radius: $border-radius-full;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba($primary-500, 0.3);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-4;
  pointer-events: none;
  border-bottom: 1px solid rgba($gray-700, 0.2);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.user-email {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: $spacing-2;

  .el-button {
    transition: all $transition-base;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.mobile-menu-btn {
  color: $text-secondary;
  transition: all $transition-base;

  &:hover {
    color: $primary-400;
    transform: scale(1.1);
  }
}

.mobile-menu {
  background: rgba($dark-bg-primary, 0.98);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba($primary-500, 0.2);
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

.mobile-menu-content {
  padding: $spacing-4;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-4;
  border-radius: $border-radius-base;
  text-decoration: none;
  color: $text-secondary;
  transition: all $transition-base;
  position: relative;
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-2;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) scaleX(0);
    width: 3px;
    height: 60%;
    background: linear-gradient(135deg, #{$primary-400}, #{$primary-600});
    transition: transform $transition-base;
    border-radius: 0 $border-radius-full $border-radius-full 0;
  }

  &:hover,
  &--active {
    color: $primary-400;
    background-color: rgba($primary-500, 0.1);
    transform: translateX(4px);

    &::before {
      transform: translateY(-50%) scaleX(1);
    }
  }
}

.mobile-nav-icon {
  font-size: $font-size-xl;
  transition: transform $transition-base;

  .mobile-nav-item:hover & {
    transform: scale(1.1);
  }
}

.mobile-nav-text {
  font-weight: $font-weight-medium;
  flex: 1;
}

.mobile-nav-badge {
  background: $error-color;
  color: white;
  font-size: $font-size-xs;
  padding: 2px 6px;
  border-radius: $border-radius-full;
  font-weight: $font-weight-medium;
  animation: pulse 2s infinite;
}

.mobile-user-section {
  margin-top: $spacing-6;
  padding-top: $spacing-6;
  border-top: 1px solid rgba($primary-500, 0.2);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: $spacing-4;
  padding: $spacing-4;
  background: rgba($primary-500, 0.1);
  border-radius: $border-radius-base;
  margin-bottom: $spacing-4;
  box-shadow: 0 0 20px rgba($primary-500, 0.3);
}

.mobile-user-details {
  display: flex;
  flex-direction: column;
}

.mobile-username {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.mobile-user-email {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

.mobile-action-btn {
  width: 100%;
  justify-content: flex-start;
  transition: all $transition-base;

  &:hover {
    transform: translateX(4px);
  }
}

// 响应式工具类已在 utilities.scss 中定义

/* 移动端优化 - 768px以下 */
@include mobile-only {
  .nav-container {
    height: 60px;
    padding: 0 $spacing-3;
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

  .brand-text {
    font-size: $font-size-lg;
  }

  .quick-actions {
    gap: $spacing-2;
  }

  .action-btn {
    padding: $spacing-2;
  }
}

/* 小屏手机优化 - 640px以下 */
@include respond-below($breakpoint-sm) {
  .nav-container {
    padding: 0 $spacing-2;
  }

  .quick-actions {
    gap: $spacing-2;
  }

  .logo-icon {
    font-size: $font-size-xl;
  }

  .brand-text {
    font-size: $font-size-base;
  }
}

/* 超小屏手机优化 - 475px以下 */
@include respond-below($breakpoint-xs) {
  .nav-container {
    height: 56px;
    padding: 0 $spacing-2;
  }

  .logo-icon {
    font-size: $font-size-lg;
  }

  .brand-text {
    font-size: $font-size-sm;
  }

  .quick-actions {
    gap: $spacing-1;
  }

  .mobile-menu-btn {
    padding: $spacing-1;
  }

  .user-menu-trigger {
    .el-avatar {
      width: 32px !important;
      height: 32px !important;
    }
  }
}

/* 大屏桌面优化 - 1280px以上 */
@media (min-width: $breakpoint-xl) {
  .nav-container {
    max-width: 1400px;
    padding: 0 $spacing-6;
  }

  .search-box {
    width: 320px;

    &:focus-within {
      width: 360px;
    }
  }

  .nav-menu {
    gap: $spacing-6;
  }

  .quick-actions {
    gap: $spacing-4;
  }
}

/* 超大屏桌面优化 - 1536px以上 */
@media (min-width: $breakpoint-2xl) {
  .nav-container {
    max-width: 1600px;
  }

  .search-box {
    width: 360px;

    &:focus-within {
      width: 400px;
    }
  }
}

/* 横屏模式优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .nav-container {
    height: 56px;
  }

  .mobile-menu {
    max-height: calc(100vh - 56px);
  }

  .mobile-user-section {
    margin-top: $spacing-4;
    padding-top: $spacing-4;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .nav-item,
  .action-btn,
  .mobile-nav-item {
    &:hover {
      transform: none;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .brand-logo:hover {
    transform: none;
  }

  .user-menu-trigger:hover {
    transform: none;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .brand-text {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .logo-icon {
    -webkit-font-smoothing: antialiased;
  }
}
</style>
