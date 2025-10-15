<template>
  <aside class="character-panel" :class="panelClasses">
    <!-- 折叠按钮 -->
    <TavernButton
      v-if="!isMobile"
      variant="ghost"
      size="sm"
      @click="toggleCollapse"
      class="collapse-toggle"
      :title="collapsed ? '展开角色面板' : '折叠角色面板'"
    >
      <TavernIcon :name="collapsed ? 'chevron-right' : 'chevron-left'" />
    </TavernButton>

    <!-- 移动端关闭按钮 -->
    <TavernButton
      v-if="isMobile"
      variant="ghost"
      size="sm"
      @click="$emit('close')"
      class="mobile-close"
    >
      <TavernIcon name="x-mark" />
    </TavernButton>

    <!-- 角色信息区域 -->
    <div class="character-content" :class="{ 'content-collapsed': collapsed }">
      <!-- 角色头像和基本信息 -->
      <div class="character-header">
        <div class="character-avatar-section">
          <div class="avatar-wrapper">
            <img
              v-if="character?.avatar"
              :src="character.avatar"
              :alt="character.name"
              class="character-avatar"
              @error="handleAvatarError"
            />
            <div v-else class="default-avatar">
              <TavernIcon name="sparkles" />
            </div>

            <!-- 在线状态指示器 -->
            <div class="online-indicator">
              <div
                class="status-dot"
                :class="{ 'status-online': isOnline, 'status-offline': !isOnline }"
              />
              <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
            </div>

            <!-- 角色状态徽章 -->
            <div v-if="character?.badges?.length" class="character-badges">
              <div
                v-for="badge in character.badges"
                :key="badge.id"
                :class="['badge', `badge-${badge.type}`]"
                :title="badge.description"
              >
                <TavernIcon :name="badge.icon" size="xs" />
              </div>
            </div>
          </div>
        </div>

        <div class="character-info">
          <h2 class="character-name">{{ character?.name || 'AI助手' }}</h2>
          <p class="character-title">{{ character?.title || '智能助手' }}</p>
          <div class="character-meta">
            <span class="creator-info">
              <TavernIcon name="user-circle" size="xs" />
              {{ character?.creator || '系统创建' }}
            </span>
            <span class="creation-date">
              <TavernIcon name="calendar" size="xs" />
              {{ formatDate(character?.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 角色描述 -->
      <div v-if="!collapsed && character?.description" class="character-description">
        <div class="description-header">
          <TavernIcon name="document-text" size="xs" />
          <span>角色简介</span>
        </div>
        <p class="description-text">
          {{ character.description }}
        </p>
        <TavernButton
          v-if="isDescriptionExpanded"
          variant="ghost"
          size="xs"
          @click="toggleDescriptionExpand"
          class="expand-toggle"
        >
          {{ descriptionExpanded ? '收起' : '展开' }}
          <TavernIcon :name="descriptionExpanded ? 'chevron-up' : 'chevron-down'" size="xs" />
        </TavernButton>
      </div>

      <!-- 角色属性 -->
      <div v-if="!collapsed" class="character-attributes">
        <h3 class="section-title">
          <TavernIcon name="tag" size="xs" />
          角色属性
        </h3>
        <div class="attributes-grid">
          <div
            v-for="attribute in characterAttributes"
            :key="attribute.key"
            class="attribute-item"
          >
            <div class="attribute-icon">
              <TavernIcon :name="attribute.icon" size="xs" />
            </div>
            <div class="attribute-content">
              <span class="attribute-label">{{ attribute.label }}</span>
              <span class="attribute-value">{{ attribute.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 对话统计 -->
      <div v-if="!collapsed && chatStats" class="chat-statistics">
        <h3 class="section-title">
          <TavernIcon name="chart-bar" size="xs" />
          对话统计
        </h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <TavernIcon name="chat-bubble-left-right" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatCount(chatStats.messageCount) }}</span>
              <span class="stat-label">对话消息</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <TavernIcon name="clock" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatDuration(chatStats.sessionDuration) }}</span>
              <span class="stat-label">对话时长</span>
            </div>
          </div>
          <div class="stat-item" v-if="character?.rating">
            <div class="stat-icon">
              <TavernIcon name="star" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ character.rating.toFixed(1) }}</span>
              <span class="stat-label">角色评分</span>
            </div>
          </div>
          <div class="stat-item" v-if="character?.chatCount">
            <div class="stat-icon">
              <TavernIcon name="users" />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ formatCount(character.chatCount) }}</span>
              <span class="stat-label">总对话数</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div v-if="!collapsed" class="quick-actions">
        <h3 class="section-title">
          <TavernIcon name="bolt" size="xs" />
          快速操作
        </h3>
        <div class="actions-grid">
          <TavernButton
            variant="outline"
            size="sm"
            @click="$emit('regenerate')"
            :disabled="isLoading"
            class="action-btn"
            title="重新生成最后一条回复"
          >
            <TavernIcon name="arrow-path" />
            <span>重新生成</span>
          </TavernButton>

          <TavernButton
            variant="outline"
            size="sm"
            @click="$emit('export')"
            class="action-btn"
            title="导出对话记录"
          >
            <TavernIcon name="arrow-down-tray" />
            <span>导出对话</span>
          </TavernButton>

          <TavernButton
            variant="outline"
            size="sm"
            @click="$emit('clear')"
            class="action-btn action-danger"
            title="清空对话记录"
          >
            <TavernIcon name="trash" />
            <span>清空对话</span>
          </TavernButton>

          <TavernButton
            variant="outline"
            size="sm"
            @click="$emit('settings')"
            class="action-btn"
            title="角色设置"
          >
            <TavernIcon name="cog-6-tooth" />
            <span>角色设置</span>
          </TavernButton>

          <TavernButton
            variant="outline"
            size="sm"
            @click="toggleFavorite"
            :class="{ 'action-favorited': isFavorited }"
            class="action-btn"
            :title="isFavorited ? '取消收藏' : '收藏角色'"
          >
            <TavernIcon :name="isFavorited ? 'heart-solid' : 'heart'" />
            <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </TavernButton>

          <TavernButton
            variant="outline"
            size="sm"
            @click="shareCharacter"
            class="action-btn"
            title="分享角色"
          >
            <TavernIcon name="share" />
            <span>分享</span>
          </TavernButton>
        </div>
      </div>

      <!-- 角色标签 -->
      <div v-if="!collapsed && character?.tags?.length" class="character-tags">
        <h3 class="section-title">
          <TavernIcon name="hashtag" size="xs" />
          角色标签
        </h3>
        <div class="tags-container">
          <span
            v-for="tag in character.tags"
            :key="tag"
            class="tag-item"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- 展开状态下的简化信息 -->
    <div v-if="collapsed && !isMobile" class="collapsed-info">
      <div class="collapsed-avatar">
        <img
          v-if="character?.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="mini-avatar"
        />
        <div v-else class="mini-default-avatar">
          <TavernIcon name="sparkles" size="sm" />
        </div>
      </div>
      <div class="collapsed-status">
        <div class="status-dot" :class="{ 'status-online': isOnline }" />
      </div>
    </div>

    <!-- 底部信息 -->
    <div v-if="!collapsed && !isMobile" class="panel-footer">
      <div class="footer-info">
        <span class="version-info">v{{ character?.version || '1.0.0' }}</span>
        <span class="last-updated">{{ formatDate(character?.updatedAt) }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

// 类型定义
export interface Character {
  id: string
  name: string
  title?: string
  description?: string
  avatar?: string
  creator?: string
  rating?: number
  chatCount?: number
  tags?: string[]
  badges?: Array<{
    id: string
    type: 'premium' | 'official' | 'trending' | 'new'
    icon: string
    description: string
  }>
  createdAt?: Date
  updatedAt?: Date
  version?: string
  personality?: string
  backstory?: string
  traits?: string[]
}

export interface ChatStats {
  messageCount: number
  sessionDuration: number
  averageResponseTime?: number
  tokensUsed?: number
}

// Props
const props = defineProps({
  character: {
    type: Object as PropType<Character>,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  chatStats: {
    type: Object as PropType<ChatStats>,
    default: null
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isFavorited: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  'toggle-collapse': []
  'regenerate': []
  'export': []
  'clear': []
  'settings': []
  'favorite': [characterId: string, add: boolean]
  'share': [character: Character]
  'close': []
}>()

// 响应式数据
const descriptionExpanded = ref(false)

// 计算属性
const panelClasses = computed(() => [
  'character-panel',
  {
    'panel-collapsed': props.collapsed,
    'panel-mobile': props.isMobile,
    'panel-loading': props.isLoading
  }
])

const characterAttributes = computed(() => {
  const attributes = []

  if (props.character?.personality) {
    attributes.push({
      key: 'personality',
      label: '性格',
      value: props.character.personality,
      icon: 'face-smile'
    })
  }

  if (props.character?.traits?.length) {
    attributes.push({
      key: 'traits',
      label: '特征',
      value: props.character.traits.slice(0, 3).join(', '),
      icon: 'sparkles'
    })
  }

  if (props.character?.backstory) {
    attributes.push({
      key: 'backstory',
      label: '背景',
      value: props.character.backstory.substring(0, 50) + '...',
      icon: 'book-open'
    })
  }

  return attributes
})

const isDescriptionExpanded = computed(() => {
  return props.character?.description && props.character.description.length > 150
})

// 方法
const toggleCollapse = () => {
  emit('toggle-collapse')
}

const toggleDescriptionExpand = () => {
  descriptionExpanded.value = !descriptionExpanded.value
}

const toggleFavorite = () => {
  if (props.character) {
    emit('favorite', props.character.id, !props.isFavorited)
  }
}

const shareCharacter = () => {
  if (props.character) {
    emit('share', props.character)
  }
}

const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

const formatDate = (date?: Date | string): string => {
  if (!date) return '未知'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.character-panel {
  position: relative;
  background: rgba($dark-bg-secondary, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($primary-500, 0.1);
  border-radius: 20px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &.panel-collapsed {
    padding: 12px;
    width: 80px;
    min-width: 80px;

    .character-content {
      display: none;
    }

    .collapsed-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .panel-footer {
      display: none;
    }
  }

  &.panel-mobile {
    border-radius: 20px 20px 0 0;
    max-height: 80vh;
    overflow-y: auto;

    .character-content {
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    }
  }

  &.panel-loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.collapse-toggle,
.mobile-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba($gray-700, 0.2);
  border: 1px solid rgba($gray-600, 0.3);
  color: $text-tertiary;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($gray-700, 0.3);
    color: $text-secondary;
    transform: scale(1.05);
  }
}

.character-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.3s ease;

  &.content-collapsed {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.character-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;

  .character-avatar-section {
    position: relative;

    .avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid rgba($primary-500, 0.3);
      transition: all 0.3s ease;

      &:hover {
        border-color: $primary-500;
        transform: scale(1.05);
        box-shadow: 0 8px 32px rgba($primary-500, 0.3);
      }

      .character-avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .default-avatar {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 48px;
      }

      .online-indicator {
        position: absolute;
        bottom: 4px;
        right: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba($dark-bg-secondary, 0.9);
        padding: 2px 6px;
        border-radius: 12px;
        backdrop-filter: blur(10px);

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;

          &.status-online {
            background: $success-color;
            box-shadow: 0 0 8px rgba($success-color, 0.5);
          }

          &.status-offline {
            background: $gray-500;
          }
        }

        .status-text {
          font-size: 10px;
          color: $text-tertiary;
          font-weight: 500;
        }
      }

      .character-badges {
        position: absolute;
        top: -4px;
        left: -4px;
        display: flex;
        gap: 4px;

        .badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba($dark-bg-secondary, 0.8);

          &.badge-premium {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: white;
          }

          &.badge-official {
            background: linear-gradient(135deg, $primary-500, $primary-600);
            color: white;
          }

          &.badge-trending {
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            color: white;
          }

          &.badge-new {
            background: linear-gradient(135deg, #4ECDC4, #44A08D);
            color: white;
          }
        }
      }
    }
  }

  .character-info {
    .character-name {
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
      margin: 0 0 4px;
      line-height: 1.2;
    }

    .character-title {
      font-size: 14px;
      color: $primary-400;
      margin: 0 0 12px;
      font-weight: 500;
    }

    .character-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: $text-tertiary;

      .creator-info,
      .creation-date {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }
  }
}

.character-description {
  .description-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .description-text {
    font-size: 14px;
    line-height: 1.6;
    color: $text-secondary;
    margin: 0 0 8px;

    // 限制展开前的行数
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    &:not(.expanded) {
      -webkit-line-clamp: 3;
    }
  }

  .expand-toggle {
    font-size: 12px;
    padding: 4px 8px;
    background: rgba($primary-500, 0.1);
    border: 1px solid rgba($primary-500, 0.2);
    border-radius: 12px;
    color: $primary-400;
    display: flex;
    align-items: center;
    gap: 4px;
    align-self: center;

    &:hover {
      background: rgba($primary-500, 0.2);
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

.character-attributes {
  .attributes-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .attribute-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($gray-700, 0.3);
        transform: translateX(4px);
      }

      .attribute-icon {
        width: 32px;
        height: 32px;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $primary-400;
        flex-shrink: 0;
      }

      .attribute-content {
        flex: 1;
        min-width: 0;

        .attribute-label {
          display: block;
          font-size: 12px;
          color: $text-tertiary;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .attribute-value {
          font-size: 14px;
          color: $text-secondary;
          line-height: 1.4;
          word-break: break-word;
        }
      }
    }
  }
}

.chat-statistics {
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($gray-700, 0.3);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 32px;
        height: 32px;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $primary-400;
        flex-shrink: 0;
      }

      .stat-content {
        flex: 1;
        min-width: 0;

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: $text-tertiary;
          margin-top: 2px;
        }
      }
    }
  }
}

.quick-actions {
  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    .action-btn {
      padding: 10px 12px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      color: $text-secondary;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
      height: 60px;

      &:hover:not(:disabled) {
        background: rgba($gray-700, 0.3);
        color: $text-primary;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.action-danger {
        border-color: rgba($error-color, 0.3);
        color: $error-color;

        &:hover:not(:disabled) {
          background: rgba($error-color, 0.1);
          color: $error-color;
        }
      }

      &.action-favorited {
        border-color: rgba($error-color, 0.3);
        color: $error-color;
        background: rgba($error-color, 0.1);
      }
    }
  }
}

.character-tags {
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .tag-item {
      padding: 4px 8px;
      background: rgba($primary-500, 0.1);
      border: 1px solid rgba($primary-500, 0.2);
      border-radius: 12px;
      font-size: 11px;
      color: $primary-400;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($primary-500, 0.2);
        transform: translateY(-1px);
      }
    }
  }
}

.collapsed-info {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .collapsed-avatar {
    .mini-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba($primary-500, 0.3);
    }

    .mini-default-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
  }

  .collapsed-status {
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $gray-500;

      &.status-online {
        background: $success-color;
        box-shadow: 0 0 8px rgba($success-color, 0.5);
      }
    }
  }
}

.panel-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba($gray-600, 0.2);

  .footer-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: $text-tertiary;

    .version-info {
      background: rgba($primary-500, 0.1);
      padding: 2px 6px;
      border-radius: 8px;
      font-family: $font-mono;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .character-panel {
    border-radius: 20px 20px 0 0;
    padding: 16px;

    .character-header {
      .character-avatar-section {
        .avatar-wrapper {
          width: 100px;
          height: 100px;
        }
      }

      .character-info {
        .character-name {
          font-size: 20px;
        }
      }
    }

    .chat-statistics .stats-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions .actions-grid {
      grid-template-columns: 1fr;
    }
  }
}

// 动画
.character-panel {
  animation: panelSlideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .character-panel,
  .avatar-wrapper,
  .attribute-item,
  .stat-item,
  .action-btn,
  .tag-item {
    transition: none;
  }

  @keyframes panelSlideIn {
    display: none;
  }
}
</style>