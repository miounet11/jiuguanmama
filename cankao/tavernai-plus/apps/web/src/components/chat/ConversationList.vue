<template>
  <div class="conversation-list">
    <!-- 简化的搜索栏 -->
    <div class="conversation-list__header">
      <div class="search-section">
        <div class="search-input-wrapper">
          <TavernInput
            v-model="searchQuery"
            placeholder="搜索对话..."
            clearable
            class="search-input"
            size="default"
          >
            <template #prefix>
              <TavernIcon name="magnifying-glass" size="sm" />
            </template>
          </TavernInput>
        </div>

        <div class="header-actions">
          <TavernButton
            @click="$emit('create-new')"
            variant="primary"
            size="default"
          >
            <TavernIcon name="plus" size="sm" />
            新对话
          </TavernButton>
        </div>
      </div>

      <!-- 简化的分类标签 -->
      <div class="category-tabs">
        <div
          v-for="tab in categoryTabs"
          :key="tab.key"
          class="category-tab"
          :class="{ active: activeCategory === tab.key }"
          @click="setActiveCategory(tab.key)"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <TavernBadge
            v-if="tab.count > 0"
            :value="tab.count"
            :variant="tab.key === 'unread' ? 'primary' : 'secondary'"
            size="xs"
            rounded
          />
        </div>
      </div>
    </div>

    <!-- 对话列表 -->
    <div class="conversation-list__content">
      <!-- 空状态 -->
      <div v-if="filteredConversations.length === 0" class="conversation-list__empty">
        <div class="empty-state">
          <TavernIcon
            :name="getEmptyStateIcon()"
            size="4xl"
            class="empty-state__icon"
          />
          <h3 class="empty-state__title">{{ getEmptyStateTitle() }}</h3>
          <p class="empty-state__description">{{ getEmptyStateDescription() }}</p>

          <div v-if="showCreateNewButton" class="empty-state__actions">
            <TavernButton variant="primary" @click="$emit('create-new')">
              <TavernIcon name="plus" size="sm" />
              创建新对话
            </TavernButton>
          </div>
        </div>
      </div>

      <!-- 简化对话列表 -->
      <div class="conversation-list__items">
        <ConversationCard
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          v-bind="conversation"
          :is-active="conversation.id === activeConversationId"
          @click="handleConversationClick"
          @rename="handleRename"
          @pin="handlePin"
          @archive="handleArchive"
          @delete="handleDelete"
          @more-options="handleMoreOptions"
        />
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !isLoading" class="conversation-list__load-more">
      <TavernButton variant="ghost" @click="$emit('load-more')">
        <TavernIcon name="arrow-down" size="sm" />
        加载更多
      </TavernButton>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="conversation-list__loading">
      <div class="loading-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--preview"></div>
            <div class="skeleton-line skeleton-line--time"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  isLoading?: boolean
  hasMore?: boolean
  showCreateNewButton?: boolean
}

// Props
const props = withDefaults(defineProps<Props>(), {
  conversations: () => [],
  activeConversationId: '',
  isLoading: false,
  hasMore: false,
  showCreateNewButton: true
})

// Emits - 简化事件
const emit = defineEmits<{
  'create-new': []
  'conversation-click': [id: string]
  'conversation-rename': [id: string]
  'conversation-pin': [id: string, pinned: boolean]
  'conversation-archive': [id: string, archived: boolean]
  'conversation-delete': [id: string]
  'load-more': []
}>()

// 响应式数据 - 简化状态
const searchQuery = ref('')
const activeCategory = ref('all')

// 计算属性 - 简化分类
const categoryTabs = computed(() => [
  {
    key: 'all',
    label: '全部',
    count: props.conversations.length
  },
  {
    key: 'active',
    label: '进行中',
    count: props.conversations.filter(conv => !conv.isArchived).length
  },
  {
    key: 'unread',
    label: '未读',
    count: props.conversations.filter(conv => conv.unreadCount > 0).length
  },
  {
    key: 'pinned',
    label: '置顶',
    count: props.conversations.filter(conv => conv.isPinned).length
  }
])

const filteredConversations = computed(() => {
  let filtered = [...props.conversations]

  // 应用分类筛选
  if (activeCategory.value === 'unread') {
    filtered = filtered.filter(conv => conv.unreadCount > 0)
  } else if (activeCategory.value === 'active') {
    filtered = filtered.filter(conv => !conv.isArchived)
  } else if (activeCategory.value === 'pinned') {
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

  // 应用排序 - 优先级：置顶 > 未读 > 最后消息时间
  filtered.sort((a, b) => {
    // 置顶的对话优先
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // 未读的对话优先
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1

    // 按最后消息时间排序
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return filtered
})


// 方法
const setActiveCategory = (category: string) => {
  activeCategory.value = category
}

const handleConversationClick = (id: string) => {
  emit('conversation-click', id)
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

// 空状态相关方法
const getEmptyStateIcon = () => {
  if (searchQuery.value) return 'magnifying-glass'
  if (activeCategory.value === 'unread') return 'envelope'
  if (activeCategory.value === 'pinned') return 'pin'
  if (activeCategory.value === 'active') return 'chat-bubble-left-right'
  return 'chat-bubble-left-right'
}

const getEmptyStateTitle = () => {
  if (searchQuery.value) return '没有找到匹配的对话'
  if (activeCategory.value === 'unread') return '没有未读消息'
  if (activeCategory.value === 'pinned') return '没有置顶的对话'
  if (activeCategory.value === 'active') return '没有进行中的对话'
  return '还没有对话'
}

const getEmptyStateDescription = () => {
  if (searchQuery.value) return '尝试调整搜索条件'
  if (activeCategory.value !== 'all') return '切换筛选条件查看其他对话'
  return '选择一个角色开始你的第一次对话'
}

</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-1);
}

// 头部区域 - 简化设计
.conversation-list__header {
  padding: $spacing-4;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--surface-1);
  gap: $spacing-4;
  display: flex;
  flex-direction: column;
}

// 搜索区域
.search-section {
  display: flex;
  align-items: center;
  gap: $spacing-3;
}

.search-input-wrapper {
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
}

.header-actions {
  display: flex;
  gap: $spacing-2;
}

// 分类标签
.category-tabs {
  display: flex;
  align-items: center;
  gap: $spacing-1;
  background: var(--surface-2);
  padding: $spacing-1;
  border-radius: $border-radius-lg;
  border: 1px solid var(--border-secondary);
}

.category-tab {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  padding: $spacing-2 $spacing-3;
  border-radius: $border-radius-base;
  cursor: pointer;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--text-secondary);
  transition: all $transition-fast;
  border: 1px solid transparent;

  &:hover {
    background: var(--surface-3);
    color: var(--text-primary);
  }

  &.active {
    background: var(--brand-primary-50);
    color: var(--brand-primary-700);
    border-color: var(--brand-primary-200);
  }

  .tab-label {
    white-space: nowrap;
  }
}

// 内容区域 - 简化设计
.conversation-list__content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-3;
}

// 空状态 - 优化视觉设计
.conversation-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: $spacing-8;
}

.empty-state {
  text-align: center;
  max-width: 320px;

  &__icon {
    color: var(--text-muted);
    margin-bottom: $spacing-4;
    opacity: 0.4;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    margin: 0 0 $spacing-2 0;
  }

  &__description {
    font-size: $font-size-sm;
    color: var(--text-secondary);
    margin: 0 0 $spacing-6 0;
    line-height: $line-height-relaxed;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }
}

// 简化对话列表
.conversation-list__items {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

// 加载更多
.conversation-list__load-more {
  display: flex;
  justify-content: center;
  padding: $spacing-4;
  border-top: 1px solid var(--border-secondary);
}

// 加载状态
.conversation-list__loading {
  padding: $spacing-4;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-3;
  background: var(--surface-2);
  border-radius: $border-radius-lg;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: $border-radius-full;
  background: var(--surface-4);
  animation: skeleton-pulse 2s ease-in-out infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

.skeleton-line {
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

// 简化的动画
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式适配 - 简化版本
@media (max-width: $breakpoint-md) {
  .conversation-list__header {
    padding: $spacing-3;
    gap: $spacing-3;
  }

  .search-section {
    flex-direction: column;
    gap: $spacing-2;
  }

  .category-tabs {
    overflow-x: auto;
    padding-bottom: $spacing-1;
  }
}
</style>