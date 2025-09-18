<template>
  <div
    v-if="visible"
    class="mention-panel"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <div class="mention-header">
      <el-icon><User /></el-icon>
      <span>提及角色</span>
    </div>

    <div class="mention-search" v-if="showSearch">
      <el-input
        v-model="searchQuery"
        placeholder="搜索角色..."
        size="small"
        prefix-icon="Search"
        clearable
      />
    </div>

    <div class="mention-list">
      <div
        v-for="(character, index) in filteredCharacters"
        :key="character.id"
        :class="['mention-item', { active: selectedIndex === index }]"
        @click="selectCharacter(character)"
        @mouseenter="selectedIndex = index"
      >
        <div class="character-avatar">
          <img
            v-if="character.avatar"
            :src="character.avatar"
            :alt="character.name"
          />
          <div v-else class="avatar-placeholder">
            <el-icon><User /></el-icon>
          </div>
        </div>

        <div class="character-info">
          <div class="character-name">{{ character.name }}</div>
          <div class="character-description">{{ character.description || '暂无描述' }}</div>
        </div>

        <div class="character-meta">
          <el-tag
            v-if="character.isOnline"
            type="success"
            size="small"
            effect="light"
          >
            在线
          </el-tag>
          <el-tag
            v-else
            type="info"
            size="small"
            effect="light"
          >
            离线
          </el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <el-icon><Search /></el-icon>
        <span>未找到相关角色</span>
      </div>
    </div>

    <!-- 快捷提示 -->
    <div class="mention-footer">
      <div class="shortcuts">
        <span class="shortcut">
          <kbd>↑</kbd><kbd>↓</kbd> 选择
        </span>
        <span class="shortcut">
          <kbd>Enter</kbd> 确认
        </span>
        <span class="shortcut">
          <kbd>Esc</kbd> 取消
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { User, Search } from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  isOnline?: boolean
  lastSeen?: Date
}

interface Position {
  x: number
  y: number
}

interface Props {
  characters: Character[]
  position: Position
  visible?: boolean
  query?: string
}

interface Emits {
  (e: 'select', character: Character): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  query: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const searchQuery = ref(props.query)
const selectedIndex = ref(0)
const showSearch = ref(true)

// 计算属性
const filteredCharacters = computed(() => {
  if (!searchQuery.value) {
    return props.characters
  }

  const query = searchQuery.value.toLowerCase()
  return props.characters.filter(character =>
    character.name.toLowerCase().includes(query) ||
    (character.description && character.description.toLowerCase().includes(query))
  )
})

// 监听查询变化
watch(() => props.query, (newQuery) => {
  searchQuery.value = newQuery
})

watch(filteredCharacters, () => {
  selectedIndex.value = 0
})

// 方法
const selectCharacter = (character: Character) => {
  emit('select', character)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(0, selectedIndex.value - 1)
      break

    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(filteredCharacters.value.length - 1, selectedIndex.value + 1)
      break

    case 'Enter':
      event.preventDefault()
      if (filteredCharacters.value[selectedIndex.value]) {
        selectCharacter(filteredCharacters.value[selectedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      emit('close')
      break
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const panel = event.target as Element
  if (!panel.closest('.mention-panel')) {
    emit('close')
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.mention-panel {
  position: fixed;
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 9999;
  width: 320px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .mention-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    color: #c084fc;
    font-weight: 600;
    font-size: 14px;

    .el-icon {
      color: #8b5cf6;
    }
  }

  .mention-search {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  }

  .mention-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;

    .mention-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;

      &:hover,
      &.active {
        background: rgba(139, 92, 246, 0.1);
        border-left-color: #8b5cf6;
      }

      .character-avatar {
        width: 36px;
        height: 36px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
        }
      }

      .character-info {
        flex: 1;
        min-width: 0;

        .character-name {
          font-weight: 600;
          color: #e5e7eb;
          font-size: 14px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .character-description {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
      }

      .character-meta {
        flex-shrink: 0;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      color: #6b7280;
      font-size: 14px;

      .el-icon {
        font-size: 24px;
        margin-bottom: 8px;
        opacity: 0.6;
      }
    }
  }

  .mention-footer {
    border-top: 1px solid rgba(139, 92, 246, 0.1);
    padding: 8px 16px;
    background: rgba(139, 92, 246, 0.05);

    .shortcuts {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #6b7280;

      .shortcut {
        display: flex;
        align-items: center;
        gap: 2px;

        kbd {
          background: rgba(139, 92, 246, 0.2);
          color: #c084fc;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 10px;
          font-family: monospace;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
      }
    }
  }
}

// 滚动条样式
.mention-list {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(75, 85, 99, 0.3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 2px;

    &:hover {
      background: rgba(139, 92, 246, 0.7);
    }
  }
}

// 移动端优化
@media (max-width: 480px) {
  .mention-panel {
    width: 280px;
    max-height: 250px;

    .mention-item {
      padding: 6px 12px;

      .character-avatar {
        width: 32px;
        height: 32px;
      }

      .character-info {
        .character-description {
          max-width: 140px;
        }
      }
    }

    .mention-footer {
      .shortcuts {
        gap: 8px;
        font-size: 10px;
      }
    }
  }
}

// 深色主题输入框样式
:deep(.el-input__wrapper) {
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

:deep(.el-input__inner) {
  color: #e5e7eb;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
}

:deep(.el-tag) {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
  color: #c084fc;

  &.el-tag--success {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #4ade80;
  }

  &.el-tag--info {
    background: rgba(107, 114, 128, 0.1);
    border-color: rgba(107, 114, 128, 0.3);
    color: #9ca3af;
  }
}
</style>
