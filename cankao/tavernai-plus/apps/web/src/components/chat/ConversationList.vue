<template>
  <div class="conversation-list">
    <!-- 搜索和筛选栏 -->
    <div class="conversation-list__header">
      <div class="conversation-list__search">
        <TavernInput
          v-model="searchQuery"
          placeholder="搜索对话..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <TavernIcon name="magnifying-glass" size="sm" />
          </template>
        </TavernInput>

        <!-- 筛选按钮组 -->
        <div class="conversation-list__filters">
          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: activeFilter === 'all' }"
            @click="setActiveFilter('all')"
          >
            全部
            <TavernBadge
              v-if="totalCount > 0"
              :value="totalCount"
              variant="secondary"
              size="xs"
            />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: activeFilter === 'unread' }"
            @click="setActiveFilter('unread')"
          >
            未读
            <TavernBadge
              v-if="unreadCount > 0"
              :value="unreadCount"
              variant="primary"
              size="xs"
            />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: activeFilter === 'pinned' }"
            @click="setActiveFilter('pinned')"
          >
            置顶
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: activeFilter === 'archived' }"
            @click="setActiveFilter('archived')"
          >
            已归档
          </TavernButton>
        </div>

        <!-- 视图切换 -->
        <div class="conversation-list__view-controls">
          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: viewMode === 'list' }"
            @click="setViewMode('list')"
            title="列表视图"
          >
            <TavernIcon name="list" size="sm" />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            :class="{ active: viewMode === 'grid' }"
            @click="setViewMode('grid')"
            title="网格视图"
          >
            <TavernIcon name="grid" size="sm" />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            @click="showSortMenu = !showSortMenu"
            title="排序选项"
          >
            <TavernIcon name="arrow-up-down" size="sm" />
          </TavernButton>

          <!-- 排序菜单 -->
          <div
            v-if="showSortMenu"
            ref="sortMenuRef"
            class="sort-menu"
            @click.stop
          >
            <div
              v-for="option in sortOptions"
              :key="option.value"
              class="sort-menu__item"
              :class="{ active: sortBy === option.value }"
              @click="setSortBy(option.value)"
            >
              <TavernIcon :name="option.icon" size="xs" />
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- 分组模式切换 -->
      <div class="conversation-list__group-controls">
        <TavernButton
          variant="ghost"
          size="sm"
          :class="{ active: groupBy !== 'none' }"
          @click="cycleGroupMode"
        >
          <TavernIcon name="folder" size="sm" />
          {{ getGroupModeLabel() }}
        </TavernButton>

        <TavernButton
          v-if="isMultiSelectMode"
          variant="ghost"
          size="sm"
          @click="exitMultiSelect"
        >
          <TavernIcon name="x-mark" size="sm" />
          取消选择
        </TavernButton>

        <TavernButton
          v-else
          variant="ghost"
          size="sm"
          @click="enterMultiSelect"
        >
          <TavernIcon name="check-square" size="sm" />
          多选
        </TavernButton>
      </div>
    </div>

    <!-- 多选操作栏 -->
    <div v-if="isMultiSelectMode && selectedConversations.size > 0" class="conversation-list__multi-select-bar">
      <span class="selected-count">
        已选择 {{ selectedConversations.size }} 个对话
      </span>

      <div class="multi-select-actions">
        <TavernButton variant="ghost" size="sm" @click="batchPin">
          <TavernIcon name="pin" size="sm" />
          批量置顶
        </TavernButton>

        <TavernButton variant="ghost" size="sm" @click="batchArchive">
          <TavernIcon name="archive" size="sm" />
          批量归档
        </TavernButton>

        <TavernButton variant="ghost" size="sm" @click="batchDelete">
          <TavernIcon name="trash" size="sm" />
          批量删除
        </TavernButton>
      </div>
    </div>

    <!-- 对话列表 -->
    <div class="conversation-list__content" :class="`conversation-list__content--${viewMode}`">
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

      <!-- 分组列表 -->
      <div v-else-if="groupBy !== 'none'" class="conversation-list__groups">
        <div
          v-for="group in groupedConversations"
          :key="group.key"
          class="conversation-group"
        >
          <!-- 分组标题 -->
          <div class="conversation-group__header" @click="toggleGroupCollapse(group.key)">
            <div class="conversation-group__title">
              <TavernIcon
                :name="collapsedGroups.has(group.key) ? 'chevron-right' : 'chevron-down'"
                size="sm"
                class="conversation-group__toggle"
              />
              <TavernIcon :name="group.icon" size="sm" />
              <span>{{ group.label }}</span>
              <TavernBadge :value="group.conversations.length" variant="secondary" size="xs" />
            </div>

            <div class="conversation-group__actions">
              <TavernButton variant="ghost" size="xs" @click.stop="pinGroup(group.key)">
                <TavernIcon name="pin" size="xs" />
              </TavernButton>
            </div>
          </div>

          <!-- 分组内容 -->
          <div
            v-show="!collapsedGroups.has(group.key)"
            class="conversation-group__content"
            :class="`conversation-group__content--${viewMode}`"
          >
            <ConversationCard
              v-for="conversation in group.conversations"
              :key="conversation.id"
              v-bind="conversation"
              :is-active="conversation.id === activeConversationId"
              :show-selection="isMultiSelectMode"
              :is-selected="selectedConversations.has(conversation.id)"
              :show-stats="viewMode === 'grid'"
              @click="handleConversationClick"
              @rename="handleRename"
              @pin="handlePin"
              @archive="handleArchive"
              @delete="handleDelete"
              @select="handleSelection"
              @more-options="handleMoreOptions"
            />
          </div>
        </div>
      </div>

      <!-- 平铺列表 -->
      <div v-else class="conversation-list__items" :class="`conversation-list__items--${viewMode}`">
        <ConversationCard
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          v-bind="conversation"
          :is-active="conversation.id === activeConversationId"
          :show-selection="isMultiSelectMode"
          :is-selected="selectedConversations.has(conversation.id)"
          :show-stats="viewMode === 'grid'"
          @click="handleConversationClick"
          @rename="handleRename"
          @pin="handlePin"
          @archive="handleArchive"
          @delete="handleDelete"
          @select="handleSelection"
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
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
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

interface GroupOption {
  value: string
  label: string
  icon: string
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

// Emits
const emit = defineEmits<{
  'create-new': []
  'conversation-click': [id: string]
  'conversation-rename': [id: string]
  'conversation-pin': [id: string, pinned: boolean]
  'conversation-archive': [id: string, archived: boolean]
  'conversation-delete': [id: string]
  'load-more': []
  'batch-operation': [operation: string, ids: string[]]
}>()

// 响应式数据
const searchQuery = ref('')
const activeFilter = ref('all')
const groupBy = ref<'none' | 'status' | 'character' | 'time'>('none')
const sortBy = ref('lastMessage')
const sortOrder = ref<'asc' | 'desc'>('desc')
const viewMode = ref<'list' | 'grid'>('list')
const showSortMenu = ref(false)
const isMultiSelectMode = ref(false)
const selectedConversations = ref(new Set<string>())
const collapsedGroups = ref(new Set<string>())

const sortMenuRef = ref<HTMLElement>()

// 排序选项
const sortOptions: Array<{ value: string; label: string; icon: string }> = [
  { value: 'lastMessage', label: '最后消息', icon: 'clock' },
  { value: 'createdAt', label: '创建时间', icon: 'calendar' },
  { value: 'name', label: '角色名称', icon: 'user' },
  { value: 'messageCount', label: '消息数量', icon: 'chat-bubble-left-right' },
  { value: 'unreadCount', label: '未读数量', icon: 'envelope' }
]

// 分组选项
const groupOptions: Array<{ value: 'none' | 'status' | 'character' | 'time'; label: string; icon: string }> = [
  { value: 'none', label: '不分组', icon: 'list' },
  { value: 'status', label: '按状态分组', icon: 'flag' },
  { value: 'character', label: '按角色分组', icon: 'users' },
  { value: 'time', label: '按时间分组', icon: 'calendar-days' }
]

// 计算属性
const totalCount = computed(() => props.conversations.length)

const unreadCount = computed(() =>
  props.conversations.filter(conv => conv.unreadCount > 0).length
)

const filteredConversations = computed(() => {
  let filtered = [...props.conversations]

  // 应用筛选器
  if (activeFilter.value === 'unread') {
    filtered = filtered.filter(conv => conv.unreadCount > 0)
  } else if (activeFilter.value === 'pinned') {
    filtered = filtered.filter(conv => conv.isPinned)
  } else if (activeFilter.value === 'archived') {
    filtered = filtered.filter(conv => conv.isArchived)
  }

  // 应用搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(conv =>
      conv.characterName.toLowerCase().includes(query) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(query)) ||
      conv.tags.some(tag => tag.name.toLowerCase().includes(query))
    )
  }

  // 应用排序
  filtered.sort((a, b) => {
    let aValue: any = a[sortBy.value as keyof Conversation]
    let bValue: any = b[sortBy.value as keyof Conversation]

    if (sortBy.value === 'lastMessage' || sortBy.value === 'createdAt') {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    }

    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
})

const groupedConversations = computed(() => {
  if (groupBy.value === 'none') return []

  const groups: Array<{
    key: string
    label: string
    icon: string
    conversations: Conversation[]
  }> = []

  if (groupBy.value === 'status') {
    // 按状态分组
    const active = filteredConversations.value.filter(conv => !conv.isArchived)
    const archived = filteredConversations.value.filter(conv => conv.isArchived)

    if (active.length > 0) {
      groups.push({
        key: 'active',
        label: '进行中',
        icon: 'chat-bubble-left-right',
        conversations: active
      })
    }

    if (archived.length > 0) {
      groups.push({
        key: 'archived',
        label: '已归档',
        icon: 'archive-box',
        conversations: archived
      })
    }
  } else if (groupBy.value === 'character') {
    // 按角色分组
    const characterGroups = new Map<string, Conversation[]>()

    filteredConversations.value.forEach(conv => {
      const key = conv.characterId
      if (!characterGroups.has(key)) {
        characterGroups.set(key, [])
      }
      characterGroups.get(key)!.push(conv)
    })

    characterGroups.forEach((convs, characterId) => {
      const firstConv = convs[0]
      groups.push({
        key: characterId,
        label: firstConv.characterName,
        icon: 'user',
        conversations: convs
      })
    })
  } else if (groupBy.value === 'time') {
    // 按时间分组
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const todayConvs = filteredConversations.value.filter(conv => {
      const date = new Date(conv.lastMessageAt || conv.createdAt || new Date())
      return date >= today
    })

    const yesterdayConvs = filteredConversations.value.filter(conv => {
      const date = new Date(conv.lastMessageAt || conv.createdAt || new Date())
      return date >= yesterday && date < today
    })

    const weekConvs = filteredConversations.value.filter(conv => {
      const date = new Date(conv.lastMessageAt || conv.createdAt || new Date())
      return date >= weekAgo && date < yesterday
    })

    const olderConvs = filteredConversations.value.filter(conv => {
      const date = new Date(conv.lastMessageAt || conv.createdAt || new Date())
      return date < weekAgo
    })

    if (todayConvs.length > 0) {
      groups.push({
        key: 'today',
        label: '今天',
        icon: 'sun',
        conversations: todayConvs
      })
    }

    if (yesterdayConvs.length > 0) {
      groups.push({
        key: 'yesterday',
        label: '昨天',
        icon: 'moon',
        conversations: yesterdayConvs
      })
    }

    if (weekConvs.length > 0) {
      groups.push({
        key: 'week',
        label: '本周',
        icon: 'calendar',
        conversations: weekConvs
      })
    }

    if (olderConvs.length > 0) {
      groups.push({
        key: 'older',
        label: '更早',
        icon: 'calendar-days',
        conversations: olderConvs
      })
    }
  }

  return groups
})

// 方法
const setActiveFilter = (filter: string) => {
  activeFilter.value = filter
}

const setViewMode = (mode: 'list' | 'grid') => {
  viewMode.value = mode
}

const setSortBy = (value: string) => {
  if (sortBy.value === value) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = value
    sortOrder.value = 'desc'
  }
  showSortMenu.value = false
}

const cycleGroupMode = () => {
  const currentIndex = groupOptions.findIndex(opt => opt.value === groupBy.value)
  const nextIndex = (currentIndex + 1) % groupOptions.length
  groupBy.value = groupOptions[nextIndex].value
}

const getGroupModeLabel = () => {
  const option = groupOptions.find(opt => opt.value === groupBy.value)
  return option?.label || '不分组'
}

const toggleGroupCollapse = (groupKey: string) => {
  if (collapsedGroups.value.has(groupKey)) {
    collapsedGroups.value.delete(groupKey)
  } else {
    collapsedGroups.value.add(groupKey)
  }
}

const enterMultiSelect = () => {
  isMultiSelectMode.value = true
  selectedConversations.value.clear()
}

const exitMultiSelect = () => {
  isMultiSelectMode.value = false
  selectedConversations.value.clear()
}

const handleConversationClick = (id: string) => {
  if (isMultiSelectMode.value) {
    handleSelection(id, !selectedConversations.value.has(id))
  } else {
    emit('conversation-click', id)
  }
}

const handleSelection = (id: string, selected: boolean) => {
  if (selected) {
    selectedConversations.value.add(id)
  } else {
    selectedConversations.value.delete(id)
  }
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

const batchPin = () => {
  emit('batch-operation', 'pin', Array.from(selectedConversations.value))
}

const batchArchive = () => {
  emit('batch-operation', 'archive', Array.from(selectedConversations.value))
}

const batchDelete = () => {
  emit('batch-operation', 'delete', Array.from(selectedConversations.value))
}

const pinGroup = (groupKey: string) => {
  // 可以在这里实现分组置顶的逻辑
}

// 空状态相关方法
const getEmptyStateIcon = () => {
  if (searchQuery.value) return 'magnifying-glass'
  if (activeFilter.value === 'unread') return 'envelope'
  if (activeFilter.value === 'pinned') return 'pin'
  if (activeFilter.value === 'archived') return 'archive-box'
  return 'chat-bubble-left-right'
}

const getEmptyStateTitle = () => {
  if (searchQuery.value) return '没有找到匹配的对话'
  if (activeFilter.value === 'unread') return '没有未读消息'
  if (activeFilter.value === 'pinned') return '没有置顶的对话'
  if (activeFilter.value === 'archived') return '没有归档的对话'
  return '还没有对话'
}

const getEmptyStateDescription = () => {
  if (searchQuery.value) return '尝试调整搜索条件'
  if (activeFilter.value !== 'all') return '切换筛选条件查看其他对话'
  return '选择一个角色开始你的第一次对话'
}

// 点击外部关闭排序菜单
const handleClickOutside = (event: MouseEvent) => {
  if (sortMenuRef.value && !sortMenuRef.value.contains(event.target as Node)) {
    showSortMenu.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听器
watch(
  () => props.conversations.length,
  () => {
    // 当对话列表变化时，清空多选状态
    if (isMultiSelectMode.value) {
      exitMultiSelect()
    }
  }
)
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-1);
}

// 头部区域
.conversation-list__header {
  padding: $spacing-4;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--surface-2);
  gap: $spacing-3;
  display: flex;
  flex-direction: column;
}

.conversation-list__search {
  display: flex;
  align-items: center;
  gap: $spacing-3;
}

.search-input {
  flex: 1;
  min-width: 0;
}

.conversation-list__filters {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  flex-wrap: wrap;
}

.conversation-list__view-controls {
  display: flex;
  align-items: center;
  gap: $spacing-1;
  position: relative;
}

.conversation-list__group-controls {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  justify-content: space-between;
}

// 多选操作栏
.conversation-list__multi-select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-3 $spacing-4;
  background: var(--brand-primary-50);
  border-bottom: 1px solid var(--brand-primary-200);
}

.selected-count {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--brand-primary-700);
}

.multi-select-actions {
  display: flex;
  align-items: center;
  gap: $spacing-2;
}

// 内容区域
.conversation-list__content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-2;

  &--grid {
    padding: $spacing-4;
  }
}

// 空状态
.conversation-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: $spacing-8;
}

.empty-state {
  text-align: center;
  max-width: 300px;

  &__icon {
    color: $text-muted;
    margin-bottom: $spacing-4;
    opacity: 0.5;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: 0 0 $spacing-2 0;
  }

  &__description {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin: 0 0 $spacing-4 0;
    line-height: $line-height-relaxed;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }
}

// 分组列表
.conversation-list__groups {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}

.conversation-group {
  background: var(--surface-2);
  border-radius: $border-radius-lg;
  border: 1px solid var(--border-secondary);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3 $spacing-4;
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-secondary);
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover {
      background: var(--surface-4);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  &__toggle {
    transition: transform $transition-fast;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-1;
  }

  &__content {
    padding: $spacing-2;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    &--grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: $spacing-3;
      padding: $spacing-3;
    }
  }
}

// 平铺列表
.conversation-list__items {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: $spacing-3;
    padding: $spacing-2;
  }
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

// 排序菜单
.sort-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  background: var(--surface-2);
  border: 1px solid var(--border-primary);
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  padding: $spacing-2;
  min-width: 140px;
  margin-top: $spacing-1;
}

.sort-menu__item {
  display: flex;
  align-items: center;
  gap: $spacing-2;
  padding: $spacing-2;
  border-radius: $border-radius-base;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $text-primary;
  transition: background-color $transition-fast;

  &:hover {
    background: var(--surface-3);
  }

  &.active {
    background: var(--brand-primary-50);
    color: var(--brand-primary-700);
  }
}

// 动画
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 按钮状态
.active {
  background: var(--brand-primary-100);
  color: var(--brand-primary-700);
  border-color: var(--brand-primary-300);
}

// 响应式适配
@media (max-width: $breakpoint-md) {
  .conversation-list__header {
    padding: $spacing-3;
    gap: $spacing-2;
  }

  .conversation-list__search {
    flex-direction: column;
    gap: $spacing-2;
  }

  .conversation-list__filters {
    width: 100%;
    justify-content: space-between;
  }

  .conversation-list__view-controls {
    width: 100%;
    justify-content: space-between;
  }

  .conversation-list__group-controls {
    flex-direction: column;
    gap: $spacing-2;
    align-items: stretch;
  }

  .multi-select-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: $breakpoint-sm) {
  .conversation-list__filters {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: $spacing-1;
  }

  .conversation-group__content--grid,
  .conversation-list__items--grid {
    grid-template-columns: 1fr;
  }
}
</style>