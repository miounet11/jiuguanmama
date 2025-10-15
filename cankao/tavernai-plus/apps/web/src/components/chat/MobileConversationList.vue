<template>
  <div class="mobile-conversation-list" :class="{ 'mobile-conversation-list--visible': isVisible }">
    <!-- 顶部导航栏 -->
    <header class="mobile-conversation-list__header">
      <div class="mobile-conversation-list__nav">
        <TavernButton
          variant="ghost"
          size="md"
          @click="$emit('close')"
          class="nav-btn"
        >
          <TavernIcon name="x-mark" size="lg" />
        </TavernButton>

        <h1 class="mobile-conversation-list__title">
          对话列表
          <TavernBadge
            v-if="totalCount > 0"
            :value="totalCount"
            variant="secondary"
            size="sm"
            class="title-badge"
          />
        </h1>

        <TavernButton
          variant="primary"
          size="md"
          @click="$emit('create-new')"
          class="nav-btn nav-btn--primary"
        >
          <TavernIcon name="plus" size="md" />
        </TavernButton>
      </div>

      <!-- 移动端搜索栏 -->
      <div class="mobile-conversation-list__search">
        <TavernInput
          v-model="searchQuery"
          placeholder="搜索对话..."
          clearable
          class="mobile-search-input"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
        >
          <template #prefix>
            <TavernIcon name="magnifying-glass" size="sm" />
          </template>
        </TavernInput>
      </div>

      <!-- 快速筛选标签 -->
      <div class="mobile-conversation-list__filters">
        <div class="filter-tabs">
          <button
            v-for="filter in mobileFilters"
            :key="filter.key"
            :class="[
              'filter-tab',
              { 'filter-tab--active': activeFilter === filter.key }
            ]"
            @click="setActiveFilter(filter.key)"
          >
            <TavernIcon :name="filter.icon" size="sm" />
            <span>{{ filter.label }}</span>
            <TavernBadge
              v-if="filter.count > 0"
              :value="filter.count"
              :variant="filter.key === 'unread' ? 'primary' : 'secondary'"
              size="xs"
            />
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="mobile-conversation-list__content">
      <!-- 下拉刷新指示器 -->
      <div
        v-if="showRefreshIndicator"
        class="mobile-conversation-list__refresh-indicator"
      >
        <TavernIcon name="arrow-clockwise" size="lg" class="refresh-icon" />
        <span>松开刷新</span>
      </div>

      <!-- 对话列表 -->
      <div
        ref="scrollContainer"
        class="mobile-conversation-list__scroll"
        @scroll="handleScroll"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- 空状态 -->
        <div v-if="filteredConversations.length === 0 && !isLoading" class="mobile-empty-state">
          <div class="mobile-empty-state__content">
            <TavernIcon
              :name="getEmptyStateIcon()"
              size="5xl"
              class="mobile-empty-state__icon"
            />
            <h3 class="mobile-empty-state__title">{{ getEmptyStateTitle() }}</h3>
            <p class="mobile-empty-state__description">{{ getEmptyStateDescription() }}</p>

            <TavernButton
              v-if="showCreateNewButton"
              variant="primary"
              size="lg"
              @click="$emit('create-new')"
              class="mobile-empty-state__action"
            >
              <TavernIcon name="plus" size="md" />
              开始新对话
            </TavernButton>
          </div>
        </div>

        <!-- 对话卡片列表 -->
        <div v-else class="mobile-conversation-list__items">
          <!-- 今天 -->
          <div v-if="todayConversations.length > 0" class="mobile-conversation-group">
            <div class="mobile-conversation-group__header">
              <span class="group-label">今天</span>
              <span class="group-count">{{ todayConversations.length }}</span>
            </div>
            <div class="mobile-conversation-group__items">
              <ConversationCard
                v-for="conversation in todayConversations"
                :key="conversation.id"
                v-bind="conversation"
                :is-active="conversation.id === activeConversationId"
                :show-stats="false"
                :max-preview-length="60"
                @click="handleConversationClick"
                @rename="handleRename"
                @pin="handlePin"
                @archive="handleArchive"
                @delete="handleDelete"
                @more-options="handleMoreOptions"
              />
            </div>
          </div>

          <!-- 昨天 -->
          <div v-if="yesterdayConversations.length > 0" class="mobile-conversation-group">
            <div class="mobile-conversation-group__header">
              <span class="group-label">昨天</span>
              <span class="group-count">{{ yesterdayConversations.length }}</span>
            </div>
            <div class="mobile-conversation-group__items">
              <ConversationCard
                v-for="conversation in yesterdayConversations"
                :key="conversation.id"
                v-bind="conversation"
                :is-active="conversation.id === activeConversationId"
                :show-stats="false"
                :max-preview-length="60"
                @click="handleConversationClick"
                @rename="handleRename"
                @pin="handlePin"
                @archive="handleArchive"
                @delete="handleDelete"
                @more-options="handleMoreOptions"
              />
            </div>
          </div>

          <!-- 本周 -->
          <div v-if="weekConversations.length > 0" class="mobile-conversation-group">
            <div class="mobile-conversation-group__header">
              <span class="group-label">本周</span>
              <span class="group-count">{{ weekConversations.length }}</span>
            </div>
            <div class="mobile-conversation-group__items">
              <ConversationCard
                v-for="conversation in weekConversations"
                :key="conversation.id"
                v-bind="conversation"
                :is-active="conversation.id === activeConversationId"
                :show-stats="false"
                :max-preview-length="60"
                @click="handleConversationClick"
                @rename="handleRename"
                @pin="handlePin"
                @archive="handleArchive"
                @delete="handleDelete"
                @more-options="handleMoreOptions"
              />
            </div>
          </div>

          <!-- 更早 -->
          <div v-if="olderConversations.length > 0" class="mobile-conversation-group">
            <div class="mobile-conversation-group__header">
              <span class="group-label">更早</span>
              <span class="group-count">{{ olderConversations.length }}</span>
            </div>
            <div class="mobile-conversation-group__items">
              <ConversationCard
                v-for="conversation in olderConversations"
                :key="conversation.id"
                v-bind="conversation"
                :is-active="conversation.id === activeConversationId"
                :show-stats="false"
                :max-preview-length="60"
                @click="handleConversationClick"
                @rename="handleRename"
                @pin="handlePin"
                @archive="handleArchive"
                @delete="handleDelete"
                @more-options="handleMoreOptions"
              />
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div
          v-if="hasMore && !isLoading"
          class="mobile-conversation-list__load-more"
          @click="handleLoadMore"
        >
          <div class="load-more-trigger"></div>
          <div class="load-more-content">
            <TavernIcon name="arrow-down" size="sm" />
            <span>加载更多</span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="mobile-conversation-list__loading">
          <div class="mobile-loading-skeleton">
            <div v-for="i in 5" :key="i" class="mobile-skeleton-item">
              <div class="mobile-skeleton-avatar"></div>
              <div class="mobile-skeleton-content">
                <div class="mobile-skeleton-line mobile-skeleton-line--title"></div>
                <div class="mobile-skeleton-line mobile-skeleton-line--preview"></div>
                <div class="mobile-skeleton-line mobile-skeleton-line--time"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部操作栏 -->
    <footer v-if="showBottomActions" class="mobile-conversation-list__footer">
      <div class="mobile-conversation-list__actions">
        <TavernButton variant="ghost" size="sm" @click="showBulkActions = !showBulkActions">
          <TavernIcon name="check-square" size="sm" />
          批量操作
        </TavernButton>

        <TavernButton variant="ghost" size="sm" @click="scrollToTop">
          <TavernIcon name="arrow-up" size="sm" />
          回到顶部
        </TavernButton>
      </div>
    </footer>

    <!-- 批量操作面板 -->
    <div v-if="showBulkActions" class="mobile-bulk-actions">
      <div class="bulk-actions-header">
        <span>批量操作</span>
        <TavernButton variant="ghost" size="sm" @click="showBulkActions = false">
          <TavernIcon name="x-mark" size="sm" />
        </TavernButton>
      </div>
      <div class="bulk-actions-content">
        <TavernButton variant="ghost" size="sm" @click="selectAll">
          <TavernIcon name="check" size="sm" />
          全选
        </TavernButton>
        <TavernButton variant="ghost" size="sm" @click="batchPin">
          <TavernIcon name="pin" size="sm" />
          置顶
        </TavernButton>
        <TavernButton variant="ghost" size="sm" @click="batchArchive">
          <TavernIcon name="archive" size="sm" />
          归档
        </TavernButton>
        <TavernButton variant="ghost" size="sm" @click="batchDelete">
          <TavernIcon name="trash" size="sm" />
          删除
        </TavernButton>
      </div>
    </div>
  </div>

  <!-- 遮罩层 -->
  <div
    v-if="isVisible"
    class="mobile-conversation-list__overlay"
    @click="$emit('close')"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { startOfDay, subDays, isAfter, isBefore, isToday, isYesterday } from 'date-fns'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
import ConversationCard from './ConversationCard.vue'

// Types
interface Conversation {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  lastMessage?: string
  lastMessageAt?: Date | string
  messageCount: number
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  isOnline: boolean
  isStreaming: boolean
  hasError: boolean
  isEdited: boolean
  lastMessageSender?: string
  tags: Array<{
    id: string
    name: string
    color?: string
  }>
  characterStatus?: 'online' | 'offline' | 'away' | 'busy'
}

interface Props {
  conversations: Conversation[]
  activeConversationId?: string
  isVisible?: boolean
  isLoading?: boolean
  hasMore?: boolean
  showCreateNewButton?: boolean
}

// Props
const props = withDefaults(defineProps<Props>(), {
  conversations: () => [],
  activeConversationId: '',
  isVisible: false,
  isLoading: false,
  hasMore: false,
  showCreateNewButton: true
})

// Emits
const emit = defineEmits<{
  close: []
  'create-new': []
  'conversation-click': [id: string]
  'conversation-rename': [id: string]
  'conversation-pin': [id: string, pinned: boolean]
  'conversation-archive': [id: string, archived: boolean]
  'conversation-delete': [id: string]
  'load-more': []
  'refresh': []
}>()

// 响应式数据
const searchQuery = ref('')
const activeFilter = ref('all')
const showBulkActions = ref(false)
const showBottomActions = ref(false)
const selectedConversations = ref(new Set<string>())
const showRefreshIndicator = ref(false)

// 触摸相关
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isPulling = ref(false)

const scrollContainer = ref<HTMLElement>()

// 移动端筛选器
const mobileFilters = computed(() => [
  {
    key: 'all',
    label: '全部',
    icon: 'chat-bubble-left-right',
    count: totalCount.value
  },
  {
    key: 'unread',
    label: '未读',
    icon: 'envelope',
    count: unreadCount.value
  },
  {
    key: 'pinned',
    label: '置顶',
    icon: 'pin',
    count: pinnedCount.value
  }
])

// 计算属性
const totalCount = computed(() => props.conversations.length)

const unreadCount = computed(() =>
  props.conversations.filter(conv => conv.unreadCount > 0).length
)

const pinnedCount = computed(() =>
  props.conversations.filter(conv => conv.isPinned).length
)

const filteredConversations = computed(() => {
  let filtered = [...props.conversations]

  // 应用筛选器
  if (activeFilter.value === 'unread') {
    filtered = filtered.filter(conv => conv.unreadCount > 0)
  } else if (activeFilter.value === 'pinned') {
    filtered = filtered.filter(conv => conv.isPinned)
  }

  // 应用搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(conv =>
      conv.characterName.toLowerCase().includes(query) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(query))
    )
  }

  // 按时间排序
  filtered.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return filtered
})

// 按时间分组
const todayConversations = computed(() =>
  filteredConversations.value.filter(conv => {
    const date = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date()
    return isToday(date)
  })
)

const yesterdayConversations = computed(() =>
  filteredConversations.value.filter(conv => {
    const date = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date()
    return isYesterday(date)
  })
)

const weekConversations = computed(() => {
  const weekAgo = subDays(new Date(), 7)
  const yesterday = subDays(new Date(), 1)

  return filteredConversations.value.filter(conv => {
    const date = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date()
    return isAfter(date, weekAgo) && isBefore(date, yesterday)
  })
})

const olderConversations = computed(() => {
  const weekAgo = subDays(new Date(), 7)

  return filteredConversations.value.filter(conv => {
    const date = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date()
    return isBefore(date, weekAgo)
  })
})

// 方法
const setActiveFilter = (filter: string) => {
  activeFilter.value = filter
}

const handleConversationClick = (id: string) => {
  emit('conversation-click', id)
  emit('close') // 移动端点击后关闭侧边栏
}

const handleRename = (id: string) => {
  emit('conversation-rename', id)
}

const handlePin = (id: string, pinned: boolean) => {
  emit('conversation-pin', id, pinned)
}

const handleArchive = (id: string, archived: boolean) => {
  emit('conversation-archive', id, archived)
}

const handleDelete = (id: string) => {
  emit('conversation-delete', id)
}

const handleMoreOptions = (id: string, event: MouseEvent) => {
  // 可以在这里实现更多选项的逻辑
}

const handleLoadMore = () => {
  emit('load-more')
}

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

const selectAll = () => {
  if (selectedConversations.value.size === filteredConversations.value.length) {
    selectedConversations.value.clear()
  } else {
    filteredConversations.value.forEach(conv => {
      selectedConversations.value.add(conv.id)
    })
  }
}

const batchPin = () => {
  // 实现批量置顶逻辑
}

const batchArchive = () => {
  // 实现批量归档逻辑
}

const batchDelete = () => {
  // 实现批量删除逻辑
}

// 搜索相关
const onSearchFocus = () => {
  // 聚焦时可以显示搜索历史等功能
}

const onSearchBlur = () => {
  // 失去焦点时的处理
}

// 下拉刷新相关
const handleTouchStart = (event: TouchEvent) => {
  touchStartY.value = event.touches[0].clientY
  isPulling.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  touchCurrentY.value = event.touches[0].clientY
  const pullDistance = touchCurrentY.value - touchStartY.value

  if (scrollContainer.value?.scrollTop === 0 && pullDistance > 0) {
    isPulling.value = true
    showRefreshIndicator.value = pullDistance > 100
  }
}

const handleTouchEnd = () => {
  if (showRefreshIndicator.value) {
    emit('refresh')
  }

  showRefreshIndicator.value = false
  isPulling.value = false
}

// 滚动相关
const handleScroll = () => {
  if (scrollContainer.value) {
    const scrollTop = scrollContainer.value.scrollTop
    const scrollHeight = scrollContainer.value.scrollHeight
    const clientHeight = scrollContainer.value.clientHeight

    // 显示/隐藏底部操作栏
    showBottomActions.value = scrollTop > 200

    // 检查是否需要加载更多
    if (scrollTop + clientHeight >= scrollHeight - 100 && props.hasMore && !props.isLoading) {
      handleLoadMore()
    }
  }
}

// 空状态相关
const getEmptyStateIcon = () => {
  if (searchQuery.value) return 'magnifying-glass'
  if (activeFilter.value === 'unread') return 'envelope'
  if (activeFilter.value === 'pinned') return 'pin'
  return 'chat-bubble-left-right'
}

const getEmptyStateTitle = () => {
  if (searchQuery.value) return '没有找到匹配的对话'
  if (activeFilter.value === 'unread') return '没有未读消息'
  if (activeFilter.value === 'pinned') return '没有置顶的对话'
  return '还没有对话'
}

const getEmptyStateDescription = () => {
  if (searchQuery.value) return '尝试调整搜索条件'
  if (activeFilter.value !== 'all') return '切换筛选条件查看其他对话'
  return '选择一个角色开始你的第一次对话'
}

// 生命周期
onMounted(() => {
  // 可以在这里添加移动端特有的初始化逻辑
})

onUnmounted(() => {
  // 清理工作
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.mobile-conversation-list {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface-1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform $transition-base ease;

  &--visible {
    transform: translateX(0);
  }
}

// 遮罩层
&__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
}

// 头部区域
&__header {
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
}

&__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-4;
  height: 60px;
}

.nav-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius-lg;

  &--primary {
    background: $primary-500;
    color: white;

    &:hover {
      background: $primary-600;
    }
  }
}

&__title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  margin: 0;
  display: flex;
  align-items: center;
  gap: $spacing-2;
}

.title-badge {
  font-size: 10px;
}

// 搜索区域
&__search {
  padding: $spacing-3 $spacing-4;
  border-bottom: 1px solid var(--border-secondary);
}

.mobile-search-input {
  width: 100%;
}

// 筛选标签
&__filters {
  padding: $spacing-3 $spacing-4;
}

.filter-tabs {
  display: flex;
  gap: $spacing-2;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: $spacing-1;
  padding: $spacing-2 $spacing-3;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-full;
  color: $text-secondary;
  font-size: $font-size-sm;
  white-space: nowrap;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: var(--surface-3);
    color: $text-primary;
  }

  &--active {
    background: $primary-500;
    border-color: $primary-500;
    color: white;
  }
}

// 主内容区域
&__content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

// 下拉刷新指示器
&__refresh-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-secondary);
  color: $primary-500;
  font-size: $font-size-sm;
  z-index: 10;

  .refresh-icon {
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-2;
  }
}

// 滚动容器
&__scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

// 空状态
.mobile-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: $spacing-6;

  &__content {
    text-align: center;
    max-width: 280px;
  }

  &__icon {
    color: $text-muted;
    margin-bottom: $spacing-4;
    opacity: 0.4;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: 0 0 $spacing-3 0;
  }

  &__description {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin: 0 0 $spacing-6 0;
    line-height: $line-height-relaxed;
  }

  &__action {
    width: 100%;
  }
}

// 对话分组
.mobile-conversation-group {
  margin-bottom: $spacing-4;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3 $spacing-4;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border-secondary);
  }

  .group-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-secondary;
  }

  .group-count {
    font-size: $font-size-xs;
    color: $text-muted;
    background: var(--surface-3);
    padding: 2px $spacing-2;
    border-radius: $border-radius-full;
  }

  &__items {
    background: var(--surface-1);
  }
}

// 加载更多
&__load-more {
  padding: $spacing-4;
  text-align: center;
  cursor: pointer;
}

.load-more-trigger {
  height: 60px;
}

.load-more-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  color: $text-secondary;
  font-size: $font-size-sm;
}

// 加载状态
&__loading {
  padding: $spacing-4;
}

.mobile-loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}

.mobile-skeleton-item {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-3;
  background: var(--surface-2);
  border-radius: $border-radius-lg;
}

.mobile-skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: $border-radius-full;
  background: var(--surface-4);
  animation: skeleton-pulse 2s ease-in-out infinite;
}

.mobile-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

.mobile-skeleton-line {
  height: 12px;
  background: var(--surface-4);
  border-radius: $border-radius-base;
  animation: skeleton-pulse 2s ease-in-out infinite;

  &--title {
    width: 60%;
  }

  &--preview {
    width: 80%;
  }

  &--time {
    width: 40%;
  }
}

// 底部操作栏
&__footer {
  background: var(--surface-2);
  border-top: 1px solid var(--border-secondary);
  padding: $spacing-3 $spacing-4;
  flex-shrink: 0;
}

&__actions {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

// 批量操作面板
.mobile-bulk-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-2);
  border-top: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg $border-radius-lg 0 0;
  box-shadow: $shadow-lg;
  z-index: 20;
}

.bulk-actions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-3 $spacing-4;
  border-bottom: 1px solid var(--border-secondary);
  font-weight: $font-weight-medium;
  color: $text-primary;
}

.bulk-actions-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-2;
  padding: $spacing-3 $spacing-4;

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-1;
    padding: $spacing-2;
    font-size: $font-size-xs;
    color: $text-secondary;
    background: transparent;
    border: none;
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: var(--surface-3);
      color: $text-primary;
    }
  }
}

// 动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 手势优化
@media (hover: none) and (pointer: coarse) {
  .mobile-conversation-list {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .filter-tab,
  .nav-btn,
  &__load-more {
    min-height: 44px; // iOS推荐的最小触摸目标尺寸
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .mobile-conversation-list {
    // 深色模式下的额外样式调整
  }
}

// 横屏适配
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-conversation-list__header {
    padding: $spacing-2 $spacing-3;
  }

  .mobile-conversation-list__nav {
    height: 50px;
    padding: $spacing-2 $spacing-3;
  }

  .mobile-conversation-list__title {
    font-size: $font-size-base;
  }
}
</style>