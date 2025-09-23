<template>
  <div class="character-panel" :class="panelClasses">
    <!-- 面板头部 -->
    <header class="character-panel__header">
      <div class="header-content">
        <TavernIcon name="user" class="header-icon" />
        <h3 class="header-title">角色信息</h3>
      </div>
      <TavernButton
        v-if="collapsible"
        variant="ghost"
        size="xs"
        @click="toggleCollapsed"
        :title="isCollapsed ? '展开面板' : '收起面板'"
      >
        <TavernIcon :name="isCollapsed ? 'chevron-down' : 'chevron-up'" />
      </TavernButton>
    </header>

    <!-- 面板内容 -->
    <div v-if="!isCollapsed" class="character-panel__content">
      <!-- 角色基本信息 -->
      <section class="character-section">
        <TavernCard variant="filled" size="sm" class="character-basic-info">
          <!-- 角色头像和状态 -->
          <div class="character-avatar-section">
            <div class="avatar-container">
              <img
                :src="character.avatar || defaultAvatar"
                :alt="character.name"
                class="character-avatar"
                @error="handleAvatarError"
              />
              <div
                class="status-indicator"
                :class="statusClasses"
                :title="getStatusTitle()"
              />
              <div v-if="showOnlineUsers" class="online-count">
                <TavernIcon name="users" size="xs" />
                <span>{{ onlineUsers }}</span>
              </div>
            </div>

            <!-- 角色名称和创建者 -->
            <div class="character-info">
              <h4 class="character-name">{{ character.name }}</h4>
              <p class="character-creator">
                by {{ character.creator?.username || '未知' }}
              </p>
              <div class="character-stats">
                <div class="stat-item">
                  <TavernIcon name="message-circle" size="xs" />
                  <span>{{ formatCount(character.chatCount || 0) }}</span>
                </div>
                <div class="stat-item">
                  <TavernIcon name="star" size="xs" />
                  <span>{{ (character.rating || 0).toFixed(1) }}</span>
                </div>
                <div class="stat-item">
                  <TavernIcon name="heart" size="xs" />
                  <span>{{ formatCount(character.favoriteCount || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 角色标签 -->
          <div v-if="character.tags && character.tags.length > 0" class="character-tags">
            <span
              v-for="tag in displayTags"
              :key="tag"
              class="character-tag"
            >
              {{ tag }}
            </span>
            <TavernButton
              v-if="character.tags.length > maxDisplayTags"
              variant="ghost"
              size="xs"
              @click="showAllTags = !showAllTags"
            >
              {{ showAllTags ? '收起' : `+${character.tags.length - maxDisplayTags}` }}
            </TavernButton>
          </div>

          <!-- 角色简介 -->
          <div v-if="character.description" class="character-description">
            <p
              :class="{ 'line-clamp-3': !showFullDescription }"
              v-html="formattedDescription"
            />
            <TavernButton
              v-if="character.description.length > 150"
              variant="ghost"
              size="xs"
              @click="showFullDescription = !showFullDescription"
              class="description-toggle"
            >
              {{ showFullDescription ? '收起' : '展开' }}
            </TavernButton>
          </div>
        </TavernCard>
      </section>

      <!-- 角色操作 -->
      <section v-if="showActions" class="character-actions">
        <div class="action-buttons">
          <!-- 收藏/取消收藏 -->
          <TavernButton
            :variant="character.isFavorited ? 'filled' : 'outlined'"
            size="sm"
            @click="toggleFavorite"
            :loading="isTogglingFavorite"
            class="favorite-button"
            :class="{ 'favorited': character.isFavorited }"
          >
            <TavernIcon :name="character.isFavorited ? 'heart' : 'heart'" />
            {{ character.isFavorited ? '已收藏' : '收藏' }}
          </TavernButton>

          <!-- 分享角色 -->
          <TavernButton
            variant="outlined"
            size="sm"
            @click="shareCharacter"
          >
            <TavernIcon name="share" />
            分享
          </TavernButton>

          <!-- 编辑角色 (如果是创建者) -->
          <TavernButton
            v-if="canEdit"
            variant="outlined"
            size="sm"
            @click="editCharacter"
          >
            <TavernIcon name="edit" />
            编辑
          </TavernButton>
        </div>
      </section>

      <!-- 聊天设置 -->
      <section v-if="showChatSettings" class="chat-settings">
        <h5 class="section-title">
          <TavernIcon name="settings" size="sm" />
          聊天设置
        </h5>

        <TavernCard variant="outlined" size="sm">
          <!-- AI 模型选择 -->
          <div class="setting-group">
            <label class="setting-label">AI 模型</label>
            <select
              v-model="chatSettings.model"
              class="setting-select"
              @change="updateChatSettings"
            >
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
          </div>

          <!-- 创造性调节 -->
          <div class="setting-group">
            <label class="setting-label">
              创造性 ({{ chatSettings.temperature }})
            </label>
            <input
              v-model.number="chatSettings.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="setting-slider"
              @input="updateChatSettings"
            />
            <div class="slider-labels">
              <span>保守</span>
              <span>平衡</span>
              <span>创新</span>
            </div>
          </div>

          <!-- 回复长度 -->
          <div class="setting-group">
            <label class="setting-label">
              最大长度 ({{ chatSettings.maxTokens }})
            </label>
            <input
              v-model.number="chatSettings.maxTokens"
              type="range"
              min="100"
              max="4000"
              step="100"
              class="setting-slider"
              @input="updateChatSettings"
            />
            <div class="slider-labels">
              <span>简短</span>
              <span>适中</span>
              <span>详细</span>
            </div>
          </div>

          <!-- 功能开关 -->
          <div class="setting-toggles">
            <label class="setting-toggle">
              <input
                v-model="chatSettings.enableStream"
                type="checkbox"
                @change="updateChatSettings"
              />
              <span class="toggle-label">启用流式响应</span>
            </label>

            <label class="setting-toggle">
              <input
                v-model="chatSettings.enableTyping"
                type="checkbox"
                @change="updateChatSettings"
              />
              <span class="toggle-label">显示输入指示器</span>
            </label>

            <label class="setting-toggle">
              <input
                v-model="chatSettings.enableVoice"
                type="checkbox"
                @change="updateChatSettings"
              />
              <span class="toggle-label">语音朗读回复</span>
            </label>
          </div>
        </TavernCard>
      </section>

      <!-- 聊天统计 -->
      <section v-if="showStatistics" class="chat-statistics">
        <h5 class="section-title">
          <TavernIcon name="bar-chart" size="sm" />
          对话统计
        </h5>

        <TavernCard variant="outlined" size="sm">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ sessionStats.messageCount }}</div>
              <div class="stat-label">消息数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatDuration(sessionStats.duration) }}</div>
              <div class="stat-label">对话时长</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ sessionStats.tokenCount }}</div>
              <div class="stat-label">Token 用量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ sessionStats.averageResponse }}ms</div>
              <div class="stat-label">平均响应</div>
            </div>
          </div>
        </TavernCard>
      </section>

      <!-- 快捷操作 -->
      <section v-if="showQuickActions" class="quick-actions">
        <h5 class="section-title">
          <TavernIcon name="zap" size="sm" />
          快捷操作
        </h5>

        <div class="quick-action-grid">
          <TavernButton
            v-for="action in quickActions"
            :key="action.id"
            variant="outlined"
            size="sm"
            @click="executeQuickAction(action)"
            class="quick-action-btn"
          >
            <TavernIcon :name="action.icon" />
            {{ action.label }}
          </TavernButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'

// Types
export interface CharacterPanelProps {
  // 角色数据
  character: {
    id: string
    name: string
    description?: string
    personality?: string
    avatar?: string
    tags?: string[]
    rating?: number
    chatCount?: number
    favoriteCount?: number
    isFavorited?: boolean
    creator?: {
      id: string
      username: string
      avatar?: string
    }
  }

  // 显示配置
  collapsible?: boolean
  showActions?: boolean
  showChatSettings?: boolean
  showStatistics?: boolean
  showQuickActions?: boolean
  showOnlineUsers?: boolean

  // 状态
  onlineStatus?: 'online' | 'away' | 'busy' | 'offline'
  onlineUsers?: number

  // 权限
  canEdit?: boolean

  // 尺寸
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string
}

interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  enableStream: boolean
  enableTyping: boolean
  enableVoice: boolean
}

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
}

// Props
const props = withDefaults(defineProps<CharacterPanelProps>(), {
  collapsible: true,
  showActions: true,
  showChatSettings: true,
  showStatistics: true,
  showQuickActions: true,
  showOnlineUsers: false,
  onlineStatus: 'online',
  onlineUsers: 0,
  canEdit: false,
  size: 'md'
})

// Emits
const emit = defineEmits<{
  'favorite-toggle': [characterId: string, isFavorited: boolean]
  'share': [character: any]
  'edit': [characterId: string]
  'settings-change': [settings: ChatSettings]
  'quick-action': [actionId: string]
}>()

// State
const isCollapsed = ref(false)
const showAllTags = ref(false)
const showFullDescription = ref(false)
const isTogglingFavorite = ref(false)
const defaultAvatar = '/default-avatar.png'
const maxDisplayTags = 3

// 聊天设置
const chatSettings = ref<ChatSettings>({
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 1000,
  enableStream: true,
  enableTyping: true,
  enableVoice: false
})

// 统计数据
const sessionStats = ref({
  messageCount: 0,
  duration: 0,
  tokenCount: 0,
  averageResponse: 0
})

// 可用模型
const availableModels = ref([
  { id: 'grok-3', name: 'Grok-3 (推荐)' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'gemini-pro', name: 'Gemini Pro' }
])

// Computed
const panelClasses = computed(() => [
  `character-panel--${props.size}`,
  {
    'character-panel--collapsed': isCollapsed.value,
    'character-panel--mobile': window.innerWidth <= 768
  }
])

const statusClasses = computed(() => [
  'status-indicator',
  `status-indicator--${props.onlineStatus}`
])

const displayTags = computed(() => {
  if (!props.character.tags) return []
  return showAllTags.value
    ? props.character.tags
    : props.character.tags.slice(0, maxDisplayTags)
})

const formattedDescription = computed(() => {
  if (!props.character.description) return ''

  // 简单的文本格式化
  return props.character.description
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
})

const quickActions = computed((): QuickAction[] => [
  {
    id: 'new-chat',
    label: '新对话',
    icon: 'plus',
    action: () => emit('quick-action', 'new-chat')
  },
  {
    id: 'clear-history',
    label: '清空历史',
    icon: 'trash',
    action: () => emit('quick-action', 'clear-history')
  },
  {
    id: 'export-chat',
    label: '导出对话',
    icon: 'download',
    action: () => emit('quick-action', 'export-chat')
  },
  {
    id: 'random-topic',
    label: '随机话题',
    icon: 'shuffle',
    action: () => emit('quick-action', 'random-topic')
  }
])

// Methods
const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}m`
}

const getStatusTitle = (): string => {
  const statusTitles = {
    online: '在线',
    away: '离开',
    busy: '忙碌',
    offline: '离线'
  }
  return statusTitles[props.onlineStatus] || '未知状态'
}

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultAvatar
}

const toggleFavorite = async () => {
  if (isTogglingFavorite.value) return

  try {
    isTogglingFavorite.value = true
    const newFavoriteState = !props.character.isFavorited

    emit('favorite-toggle', props.character.id, newFavoriteState)

    // 更新本地状态
    props.character.isFavorited = newFavoriteState

  } catch (error) {
    console.error('收藏操作失败:', error)
  } finally {
    isTogglingFavorite.value = false
  }
}

const shareCharacter = () => {
  emit('share', props.character)
}

const editCharacter = () => {
  emit('edit', props.character.id)
}

const updateChatSettings = () => {
  emit('settings-change', { ...chatSettings.value })
}

const executeQuickAction = (action: QuickAction) => {
  action.action()
}

// 模拟统计数据更新
const updateSessionStats = () => {
  // 这里应该从实际的聊天数据中获取统计信息
  sessionStats.value = {
    messageCount: Math.floor(Math.random() * 50) + 10,
    duration: Math.floor(Math.random() * 3600) + 600,
    tokenCount: Math.floor(Math.random() * 5000) + 1000,
    averageResponse: Math.floor(Math.random() * 1000) + 200
  }
}

// Watchers
watch(() => props.character.id, () => {
  // 角色变化时重置状态
  showAllTags.value = false
  showFullDescription.value = false
  updateSessionStats()
})

// Lifecycle
onMounted(() => {
  updateSessionStats()
})
</script>

<style lang="scss" scoped>
.character-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  overflow: hidden;

  // === 尺寸变体 ===
  &--sm {
    --panel-padding: var(--space-3);
    --section-gap: var(--space-3);
  }

  &--md {
    --panel-padding: var(--space-4);
    --section-gap: var(--space-4);
  }

  &--lg {
    --panel-padding: var(--space-5);
    --section-gap: var(--space-5);
  }

  &--collapsed {
    .character-panel__content {
      display: none;
    }
  }

  &--mobile {
    --panel-padding: var(--space-3);
    --section-gap: var(--space-3);

    .character-avatar-section {
      flex-direction: column;
      text-align: center;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
}

// === 面板头部 ===
.character-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--panel-padding);
  background: var(--surface-3);
  border-bottom: var(--space-px) solid var(--border-secondary);

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .header-icon {
      color: var(--tavern-primary);
    }

    .header-title {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }
  }
}

// === 面板内容 ===
.character-panel__content {
  flex: 1;
  padding: var(--panel-padding);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

// === 角色基本信息 ===
.character-basic-info {
  .character-avatar-section {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-4);

    .avatar-container {
      position: relative;
      flex-shrink: 0;

      .character-avatar {
        width: 80px;
        height: 80px;
        border-radius: var(--radius-lg);
        object-fit: cover;
        border: 2px solid var(--border-secondary);
      }

      .status-indicator {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 16px;
        height: 16px;
        border-radius: var(--radius-full);
        border: 2px solid var(--surface-2);

        &--online { background: var(--success); }
        &--away { background: var(--warning); }
        &--busy { background: var(--error); }
        &--offline { background: var(--neutral-500); }
      }

      .online-count {
        position: absolute;
        top: -4px;
        right: -4px;
        display: flex;
        align-items: center;
        gap: var(--space-1);
        background: var(--tavern-primary);
        color: white;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
      }
    }

    .character-info {
      flex: 1;

      .character-name {
        margin: 0 0 var(--space-1);
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        line-height: var(--leading-tight);
      }

      .character-creator {
        margin: 0 0 var(--space-3);
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }

      .character-stats {
        display: flex;
        gap: var(--space-4);

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
      }
    }
  }

  .character-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);

    .character-tag {
      padding: var(--space-1) var(--space-2);
      background: var(--surface-4);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    }
  }

  .character-description {
    position: relative;

    p {
      margin: 0;
      line-height: var(--leading-relaxed);
      color: var(--text-secondary);
    }

    .description-toggle {
      margin-top: var(--space-2);
    }
  }
}

// === 角色操作 ===
.character-actions {
  .action-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;

    .favorite-button {
      &.favorited {
        color: var(--error);
        border-color: var(--error);

        &:hover {
          background: rgba(248, 113, 113, 0.1);
        }
      }
    }
  }
}

// === 聊天设置 ===
.chat-settings {
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .setting-group {
    margin-bottom: var(--space-4);

    &:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: block;
      margin-bottom: var(--space-2);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .setting-select {
      width: 100%;
      padding: var(--space-2);
      background: var(--surface-4);
      border: var(--space-px) solid var(--border-secondary);
      border-radius: var(--radius-base);
      color: var(--text-primary);
      font-size: var(--text-sm);

      &:focus {
        outline: none;
        border-color: var(--tavern-primary);
      }
    }

    .setting-slider {
      width: 100%;
      height: 4px;
      background: var(--surface-4);
      border-radius: var(--radius-full);
      outline: none;
      cursor: pointer;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--tavern-primary);
        border-radius: var(--radius-full);
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--tavern-primary);
        border: none;
        border-radius: var(--radius-full);
        cursor: pointer;
      }
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-1);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }

  .setting-toggles {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .setting-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--tavern-primary);
      }

      .toggle-label {
        font-size: var(--text-sm);
        color: var(--text-primary);
      }
    }
  }
}

// === 统计信息 ===
.chat-statistics {
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);

    .stat-card {
      text-align: center;
      padding: var(--space-3);
      background: var(--surface-4);
      border-radius: var(--radius-base);

      .stat-value {
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
      }
    }
  }
}

// === 快捷操作 ===
.quick-actions {
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .quick-action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);

    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-3);
      font-size: var(--text-xs);
      min-height: 60px;
    }
  }
}

// === 响应式设计 ===
@media (max-width: 768px) {
  .character-panel {
    .character-avatar-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-3);

      .character-info {
        .character-stats {
          justify-content: center;
        }
      }
    }

    .action-buttons {
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .quick-action-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

// === 暗色主题优化 ===
[data-theme="dark"] {
  .character-panel {
    .setting-select,
    .setting-slider {
      background: var(--surface-3);
      border-color: var(--border-primary);
    }
  }
}

// === 滚动条样式 ===
.character-panel__content {
  scrollbar-width: thin;
  scrollbar-color: var(--neutral-400) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--neutral-400);
    border-radius: var(--radius-full);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--neutral-500);
  }
}
</style>