<template>
  <div class="affinity-card">
    <!-- 角色头像和基本信息 -->
    <div class="character-header">
      <div class="character-avatar">
        <img
          v-if="affinity.character.avatar"
          :src="affinity.character.avatar"
          :alt="affinity.character.name"
          class="avatar-image"
        />
        <div v-else class="avatar-placeholder">
          {{ affinity.character.name.charAt(0).toUpperCase() }}
        </div>
        <div class="favorite-badge" v-if="affinity.favorite">
          <el-icon size="16" color="#ffd700">
            <Star />
          </el-icon>
        </div>
      </div>

      <div class="character-info">
        <h3 class="character-name">{{ affinity.character.name }}</h3>
        <p class="character-description">{{ affinity.character.description }}</p>
      </div>
    </div>

    <!-- 亲密度进度条 -->
    <div class="affinity-progress">
      <div class="progress-header">
        <span class="progress-label">亲密度</span>
        <span class="progress-level">Lv.{{ affinity.affinityLevel }}</span>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(affinity.affinityPoints % 100) / 100 * 100}%` }"
        ></div>
      </div>

      <div class="progress-stats">
        <span class="points">{{ affinity.affinityPoints }} 点</span>
        <span class="next-level">
          距离下一级还需 {{ 100 - (affinity.affinityPoints % 100) }} 点
        </span>
      </div>
    </div>

    <!-- 关系状态 -->
    <div class="relationship-status">
      <el-tag
        :type="getRelationshipType(affinity.relationshipType)"
        size="small"
        class="relationship-tag"
      >
        {{ getRelationshipText(affinity.relationshipType) }}
      </el-tag>

      <div class="status-details">
        <span class="interaction-count">
          互动 {{ affinity.unlockCount }} 次
        </span>
        <span class="last-interaction">
          {{ formatLastInteraction(affinity.lastInteractionAt) }}
        </span>
      </div>
    </div>

    <!-- 时空记忆 -->
    <div v-if="affinity.spacetimeMemories.length > 0" class="spacetime-memories">
      <h4 class="memories-title">时空记忆</h4>
      <div class="memories-list">
        <div
          v-for="(memory, index) in recentMemories"
          :key="index"
          class="memory-item"
        >
          <div class="memory-dot"></div>
          <span class="memory-text">{{ memory }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="card-actions">
      <el-button
        v-if="!affinity.favorite"
        type="primary"
        size="small"
        @click="toggleFavorite"
        :loading="favoriteLoading"
      >
        <el-icon><Star /></el-icon>
        设为收藏
      </el-button>

      <el-button
        v-else
        type="warning"
        size="small"
        @click="toggleFavorite"
        :loading="favoriteLoading"
      >
        <el-icon><Star /></el-icon>
        取消收藏
      </el-button>

      <el-button
        type="default"
        size="small"
        @click="$emit('chat', affinity.character)"
      >
        <el-icon><ChatDotRound /></el-icon>
        开始对话
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star, ChatDotRound } from '@element-plus/icons-vue'
import type { CharacterAffinity } from '@/services/gamification'
import { useGamificationStore } from '@/stores/gamification'
import { ElMessage } from 'element-plus'

interface Props {
  affinity: CharacterAffinity
}

const props = defineProps<Props>()
const emit = defineEmits<{
  chat: [character: CharacterAffinity['character']]
}>()

const gamificationStore = useGamificationStore()
const favoriteLoading = ref(false)

// 计算属性
const recentMemories = computed(() => {
  try {
    const memories = JSON.parse(props.affinity.spacetimeMemories || '[]')
    return memories.slice(-3).map((m: any) => {
      if (typeof m === 'string') return m
      return m.type || '特殊事件'
    })
  } catch {
    return []
  }
})

// 方法
const getRelationshipType = (type: string): string => {
  const typeMap: Record<string, string> = {
    stranger: 'info',
    acquaintance: '',
    friend: 'success',
    close_friend: 'warning',
    best_friend: 'danger',
    soulmate: 'danger'
  }
  return typeMap[type] || 'info'
}

const getRelationshipText = (type: string): string => {
  const textMap: Record<string, string> = {
    stranger: '陌生人',
    acquaintance: '相识',
    friend: '朋友',
    close_friend: '挚友',
    best_friend: '闺蜜/死党',
    soulmate: '灵魂伴侣'
  }
  return textMap[type] || type
}

const formatLastInteraction = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return '很久以前'
}

const toggleFavorite = async () => {
  try {
    favoriteLoading.value = true
    const success = await gamificationStore.setCharacterFavorite(
      props.affinity.characterId,
      !props.affinity.favorite
    )

    if (success) {
      ElMessage.success(
        props.affinity.favorite ? '已取消收藏' : '已设为收藏'
      )
      // 更新本地状态
      props.affinity.favorite = !props.affinity.favorite
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    favoriteLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.affinity-card {
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary-400);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--brand-primary-500),
      var(--brand-secondary-500)
    );
  }
}

.character-header {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.character-avatar {
  position: relative;
  flex-shrink: 0;

  .avatar-image,
  .avatar-placeholder {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    border: 2px solid var(--border-secondary);
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: white;
  }

  .favorite-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--surface-2);
    border-radius: var(--radius-full);
    padding: 2px;
    border: 2px solid var(--border-secondary);
  }
}

.character-info {
  flex: 1;
  min-width: 0;

  .character-name {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .character-description {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.affinity-progress {
  margin-bottom: var(--space-4);

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);

    .progress-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .progress-level {
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
      color: var(--brand-primary-500);
    }
  }

  .progress-bar {
    height: 8px;
    background: var(--surface-3);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);

    .progress-fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--brand-primary-500),
        var(--brand-secondary-500)
      );
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
  }

  .progress-stats {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-tertiary);

    .points {
      font-weight: var(--font-medium);
      color: var(--brand-primary-500);
    }
  }
}

.relationship-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);

  .relationship-tag {
    align-self: flex-start;
  }

  .status-details {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }
}

.spacetime-memories {
  margin-bottom: var(--space-4);

  .memories-title {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .memories-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    .memory-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--text-secondary);

      .memory-dot {
        width: 4px;
        height: 4px;
        background: var(--brand-primary-500);
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .memory-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.card-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

// 响应式设计
@media (max-width: 768px) {
  .affinity-card {
    padding: var(--space-4);
  }

  .character-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }

  .character-info {
    text-align: center;
  }

  .card-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
