<template>
  <div
    class="chat-conversation-card"
    :class="{
      'chat-conversation-card--active': isActive,
      'chat-conversation-card--unread': hasUnread,
      'chat-conversation-card--pinned': isPinned,
      'chat-conversation-card--archived': isArchived
    }"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- 卡片状态指示器 -->
    <div class="chat-conversation-card__indicators">
      <div v-if="isPinned" class="chat-conversation-card__pin">
        <TavernIcon name="star" size="xs" />
      </div>
      <div v-if="hasUnread" class="chat-conversation-card__unread-dot"></div>
      <div v-if="isOnline" class="chat-conversation-card__online-status"></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="chat-conversation-card__content">
      <!-- 角色头像 -->
      <div class="chat-conversation-card__avatar-wrapper">
        <div class="chat-conversation-card__avatar-container">
          <img
            :src="characterAvatar || '/default-avatar.png'"
            :alt="characterName"
            class="chat-conversation-card__avatar"
            :class="{ 'chat-conversation-card__avatar--error': avatarError }"
            @error="handleAvatarError"
          />

          <!-- 角色状态指示器 -->
          <div v-if="characterStatus" class="chat-conversation-card__character-status">
            <div :class="`status-indicator status-indicator--${characterStatus}`"></div>
          </div>
        </div>

        <!-- 消息计数徽章 -->
        <TavernBadge
          v-if="unreadCount > 0"
          :value="unreadCount"
          variant="primary"
          size="sm"
          class="chat-conversation-card__unread-badge"
        />
      </div>

      <!-- 对话信息 -->
      <div class="chat-conversation-card__info">
        <!-- 头部：角色名 + 时间 -->
        <div class="chat-conversation-card__header">
          <div class="chat-conversation-card__title-section">
            <h3 class="chat-conversation-card__character-name">
              {{ characterName || '未知角色' }}
            </h3>
            <span class="chat-conversation-card__time">
              {{ formattedTime }}
            </span>
          </div>
          <!-- 悬浮时显示的操作按钮 -->
          <div class="chat-conversation-card__quick-actions">
            <!-- 置顶按钮 -->
            <button
              v-if="showPinButton"
              @click.stop="togglePin"
              class="quick-action-btn quick-action-btn--pin"
              :class="{ 'quick-action-btn--active': isPinned }"
              :title="isPinned ? '取消置顶' : '置顶对话'"
            >
              <TavernIcon :name="isPinned ? 'star' : 'star'" size="xs" />
            </button>

            <!-- 更多操作按钮 -->
            <button
              @click.stop="handleContextMenu"
              class="quick-action-btn quick-action-btn--more"
              title="更多操作"
            >
              <TavernIcon name="ellipsis-horizontal" size="xs" />
            </button>
          </div>
        </div>

        <!-- 消息预览 -->
        <div class="chat-conversation-card__message-preview">
          <p class="chat-conversation-card__preview-text">
            <span v-if="lastMessageSender" class="chat-conversation-card__sender">
              {{ lastMessageSender }}:
            </span>
            {{ lastMessagePreview }}
          </p>

          <!-- 消息状态图标 -->
          <div class="chat-conversation-card__message-status">
            <TavernIcon
              v-if="isStreaming"
              name="chat-dots"
              size="xs"
              class="chat-conversation-card__streaming-icon"
            />
            <TavernIcon
              v-else-if="hasError"
              name="exclamation-triangle"
              size="xs"
              class="chat-conversation-card__error-icon"
            />
            <TavernIcon
              v-else-if="isEdited"
              name="pencil"
              size="xs"
              class="chat-conversation-card__edited-icon"
            />
          </div>
        </div>

        <!-- 标签行 -->
        <div v-if="tags.length > 0" class="chat-conversation-card__tags">
          <TavernBadge
            v-for="tag in limitedTags"
            :key="tag.id"
            :value="tag.name"
            variant="secondary"
            size="xs"
            class="chat-conversation-card__tag"
          />
          <span
            v-if="tags.length > maxVisibleTags"
            class="chat-conversation-card__more-tags"
          >
            +{{ tags.length - maxVisibleTags }}
          </span>
        </div>

        <!-- 对话统计信息 -->
        <div v-if="showStats" class="chat-conversation-card__stats">
          <span class="chat-conversation-card__stat">
            <TavernIcon name="chat-bubble-left-right" size="xs" />
            {{ messageCount }}条消息
          </span>
          <span v-if="lastActivityTime" class="chat-conversation-card__stat">
            <TavernIcon name="clock" size="xs" />
            {{ lastActivityTime }}
          </span>
        </div>
      </div>
    </div>

    <!-- 选择框（多选模式） -->
    <div v-if="showSelection" class="chat-conversation-card__selection">
      <input
        type="checkbox"
        :checked="isSelected"
        @change="handleSelection"
        class="chat-conversation-card__checkbox"
      />
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      ref="contextMenuRef"
      class="chat-conversation-card__context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="context-menu__item" @click="renameConversation">
        <TavernIcon name="pencil" size="sm" />
        重命名对话
      </div>
      <div class="context-menu__item" @click="togglePin">
        <TavernIcon :name="isPinned ? 'star' : 'star'" size="sm" />
        {{ isPinned ? '取消置顶' : '置顶对话' }}
      </div>
      <div class="context-menu__item" @click="toggleArchive">
        <TavernIcon :name="isArchived ? 'archive-fill' : 'archive'" size="sm" />
        {{ isArchived ? '取消归档' : '归档对话' }}
      </div>
      <div class="context-menu__separator"></div>
      <div class="context-menu__item context-menu__item--danger" @click="deleteConversation">
        <TavernIcon name="trash" size="sm" />
        删除对话
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'

// Types
interface ConversationTag {
  id: string
  name: string
  color?: string
}

interface Props {
  // 基本信息
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  lastMessage?: string
  lastMessageAt?: Date | string
  messageCount?: number

  // 状态
  isActive?: boolean
  hasUnread?: boolean
  unreadCount?: number
  isPinned?: boolean
  isArchived?: boolean
  isOnline?: boolean
  isStreaming?: boolean
  hasError?: boolean
  isEdited?: boolean

  // 内容
  lastMessageSender?: string
  tags?: ConversationTag[]
  characterStatus?: 'online' | 'offline' | 'away' | 'busy'

  // 功能开关
  showPinButton?: boolean
  showArchiveButton?: boolean
  showStats?: boolean
  showSelection?: boolean
  isSelected?: boolean

  // 限制
  maxVisibleTags?: number
  maxPreviewLength?: number
}

// Props
const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  hasUnread: false,
  unreadCount: 0,
  isPinned: false,
  isArchived: false,
  isOnline: false,
  isStreaming: false,
  hasError: false,
  isEdited: false,
  messageCount: 0,
  tags: () => [],
  showPinButton: true,
  showArchiveButton: true,
  showStats: false,
  showSelection: false,
  isSelected: false,
  maxVisibleTags: 2,
  maxPreviewLength: 50
})

// Emits
const emit = defineEmits<{
  click: [id: string]
  rename: [id: string]
  pin: [id: string, pinned: boolean]
  archive: [id: string, archived: boolean]
  delete: [id: string]
  select: [id: string, selected: boolean]
  moreOptions: [id: string, event: MouseEvent]
}>()

// 响应式数据
const avatarError = ref(false)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuRef = ref<HTMLElement>()

// 计算属性
const formattedTime = computed(() => {
  if (!props.lastMessageAt) return ''

  try {
    const date = typeof props.lastMessageAt === 'string'
      ? new Date(props.lastMessageAt)
      : props.lastMessageAt

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
  } catch {
    return ''
  }
})

const lastMessagePreview = computed(() => {
  if (!props.lastMessage) return '暂无消息'

  const preview = props.lastMessage.length > props.maxPreviewLength
    ? props.lastMessage.substring(0, props.maxPreviewLength) + '...'
    : props.lastMessage

  return preview
})

const limitedTags = computed(() => {
  return props.tags.slice(0, props.maxVisibleTags)
})

const lastActivityTime = computed(() => {
  if (!props.lastMessageAt) return ''

  try {
    const date = typeof props.lastMessageAt === 'string'
      ? new Date(props.lastMessageAt)
      : props.lastMessageAt

    // 如果是今天，显示时间
    if (date.toDateString() === new Date().toDateString()) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 否则显示日期
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return ''
  }
})

const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`
}))

// 方法
const handleClick = () => {
  emit('click', props.id)
}

const handleAvatarError = () => {
  avatarError.value = true
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true

  nextTick(() => {
    if (contextMenuRef.value) {
      const rect = contextMenuRef.value.getBoundingClientRect()

      // 确保菜单不超出视窗
      if (rect.right > window.innerWidth) {
        contextMenuPosition.value.x = window.innerWidth - rect.width - 10
      }

      if (rect.bottom > window.innerHeight) {
        contextMenuPosition.value.y = window.innerHeight - rect.height - 10
      }
    }
  })
}

const hideContextMenu = () => {
  showContextMenu.value = false
}

const handleSelection = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('select', props.id, target.checked)
}

const renameConversation = () => {
  emit('rename', props.id)
  hideContextMenu()
}

const togglePin = () => {
  emit('pin', props.id, !props.isPinned)
  hideContextMenu()
}

const toggleArchive = () => {
  emit('archive', props.id, !props.isArchived)
  hideContextMenu()
}

const deleteConversation = () => {
  emit('delete', props.id)
  hideContextMenu()
}

const handleDelete = () => {
  // 直接显示确认对话框，而不是右键菜单
  if (confirm('确定要删除这个对话吗？此操作不可撤销。')) {
    emit('delete', props.id)
  }
}

const showMoreOptions = (event: MouseEvent) => {
  emit('moreOptions', props.id, event)
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
  document.addEventListener('contextmenu', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('contextmenu', hideContextMenu)
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.chat-conversation-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $spacing-3;
  padding: $spacing-4;
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-base;
  overflow: hidden;

  // 悬浮状态
  &:hover {
    background: var(--surface-3);
    border-color: var(--border-primary);
    transform: translateY(-2px);
    box-shadow: $shadow-lg;

    .chat-conversation-card__quick-actions {
      opacity: 1;
    }
  }

  // 激活状态
  &--active {
    background: linear-gradient(135deg, $primary-600, $primary-700);
    border-color: $primary-500;
    box-shadow: $glow-primary;

    .chat-conversation-card__character-name,
    .chat-conversation-card__preview-text,
    .chat-conversation-card__time {
      color: $gray-50;
    }

    .chat-conversation-card__sender {
      color: $gray-200;
    }

    .chat-conversation-card__unread-badge {
      background: $gray-50;
      color: $primary-600;
    }
  }

  // 未读状态
  &--unread {
    border-left: 4px solid $primary-500;
  }

  // 置顶状态
  &--pinned {
    background: var(--surface-3);
    border-color: $secondary-300;

    &:not(:hover) {
      border-left: 4px solid $secondary-500;
    }
  }

  // 归档状态
  &--archived {
    opacity: 0.7;
    background: var(--surface-1);

    .chat-conversation-card__preview-text {
      color: $text-muted;
    }
  }

  // 状态指示器容器
  &__indicators {
    position: absolute;
    top: $spacing-2;
    left: $spacing-2;
    display: flex;
    gap: $spacing-1;
    z-index: 2;
  }

  // 置顶图标
  &__pin {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: $secondary-500;
    color: $gray-50;
    border-radius: $border-radius-full;
    font-size: 10px;
  }

  // 未读点
  &__unread-dot {
    width: 8px;
    height: 8px;
    background: $primary-500;
    border-radius: $border-radius-full;
    box-shadow: 0 0 0 2px var(--surface-2);
  }

  // 在线状态
  &__online-status {
    width: 8px;
    height: 8px;
    background: $success-color;
    border-radius: $border-radius-full;
    box-shadow: 0 0 0 2px var(--surface-2);
    animation: pulse-online 2s ease-in-out infinite;
  }

  // 主要内容
  &__content {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    flex: 1;
    min-width: 0;
  }

  // 头像容器
  &__avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  &__avatar-container {
    position: relative;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: $border-radius-full;
    object-fit: cover;
    border: 2px solid var(--border-secondary);
    transition: all $transition-fast;

    &:hover {
      border-color: $primary-400;
      transform: scale(1.05);
    }

    &--error {
      background: var(--surface-4);
      border-color: var(--border-primary);
    }
  }

  // 角色状态指示器
  &__character-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: var(--surface-2);
    border-radius: $border-radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--surface-2);
  }

  // 未读徽章
  &__unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    font-size: 10px;
    font-weight: $font-weight-bold;
  }

  // 信息区域
  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  // 头部
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: $spacing-3;
    margin-bottom: $spacing-1;
  }

  &__title-section {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__character-name {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $text-primary;
    margin: 0;
    line-height: $line-height-tight;
    transition: color $transition-fast;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    font-size: $font-size-xs;
    color: $text-tertiary;
    white-space: nowrap;
    transition: color $transition-fast;
  }

  &__quick-actions {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    opacity: 0;
    transition: all $transition-fast;
    flex-shrink: 0;
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: var(--surface-3);
    border: 1px solid var(--border-secondary);
    border-radius: $border-radius-full;
    color: $text-secondary;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: var(--surface-4);
      border-color: var(--border-primary);
      color: $text-primary;
      transform: scale(1.1);
      box-shadow: $shadow-sm;
    }

    &:active {
      transform: scale(0.95);
      box-shadow: none;
    }

    // 置顶按钮样式
    &--pin {
      &.quick-action-btn--active {
        background: $secondary-500;
        border-color: $secondary-400;
        color: $gray-50;

        &:hover {
          background: $secondary-600;
          border-color: $secondary-300;
        }
      }
    }

    // 更多操作按钮样式
    &--more {
      &:hover {
        background: var(--surface-4);
        border-color: var(--border-primary);
      }
    }
  }

  // 消息预览
  &__message-preview {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__preview-text {
    flex: 1;
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-normal;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color $transition-fast;
  }

  &__sender {
    font-weight: $font-weight-medium;
    color: $text-secondary;
    margin-right: $spacing-1;
  }

  &__message-status {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 2px;
  }

  &__streaming-icon {
    color: $primary-500;
    animation: chat-dots 1.5s ease-in-out infinite;
  }

  &__error-icon {
    color: $error-color;
  }

  &__edited-icon {
    color: $text-muted;
  }

  // 标签
  &__tags {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    flex-wrap: wrap;
  }

  &__tag {
    font-size: 10px;
  }

  &__more-tags {
    font-size: $font-size-xs;
    color: $text-muted;
    background: var(--surface-4);
    padding: 2px $spacing-1;
    border-radius: $border-radius-base;
  }

  // 统计信息
  &__stats {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    margin-top: $spacing-1;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-xs;
    color: $text-muted;
  }

  // 选择框
  &__selection {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: $spacing-1;
  }

  &__checkbox {
    width: 16px;
    height: 16px;
    accent-color: $primary-500;
    cursor: pointer;
  }

  // 右键菜单
  &__context-menu {
    position: fixed;
    z-index: 1000;
    background: var(--surface-2);
    border: 1px solid var(--border-primary);
    border-radius: $border-radius-lg;
    box-shadow: $shadow-xl;
    padding: $spacing-2;
    min-width: 160px;
  }
}

.context-menu {
  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2;
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: background-color $transition-fast;
    font-size: $font-size-sm;
    color: $text-primary;

    &:hover {
      background: var(--surface-3);
    }

    &--danger {
      color: $error-color;

      &:hover {
        background: rgba($error-color, 0.1);
      }
    }
  }

  &__separator {
    height: 1px;
    background: var(--border-secondary);
    margin: $spacing-1 0;
  }
}

// 动画
@keyframes pulse-online {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes chat-dots {
  0%, 60%, 100% {
    opacity: 1;
  }
  30% {
    opacity: 0.3;
  }
}

// 响应式适配
@media (max-width: $breakpoint-md) {
  .chat-conversation-card {
    padding: $spacing-3;
    gap: $spacing-2;

    &__avatar {
      width: 40px;
      height: 40px;
    }

    &__header {
      gap: $spacing-2;
    }

    &__character-name {
      font-size: $font-size-sm;
    }

    &__preview-text {
      font-size: $font-size-xs;
      -webkit-line-clamp: 1;
    }

    &__quick-actions {
      opacity: 1;
    }

    .quick-action-btn {
      width: 24px;
      height: 24px;
    }

    &__stats {
      display: none;
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .chat-conversation-card {
    padding: $spacing-2;
    gap: $spacing-2;

    &__avatar {
      width: 36px;
      height: 36px;
    }

    &__header {
      gap: $spacing-1;
    }

    &__title-section {
      gap: 0;
    }

    &__character-name {
      font-size: $font-size-sm;
      margin-bottom: 2px;
    }

    &__time {
      font-size: 10px;
    }

    &__quick-actions {
      opacity: 1;
      gap: $spacing-1;
    }

    .quick-action-btn {
      width: 22px;
      height: 22px;
    }

    &__tags {
      display: none;
    }

    &__stats {
      display: none;
    }
  }
}
</style>