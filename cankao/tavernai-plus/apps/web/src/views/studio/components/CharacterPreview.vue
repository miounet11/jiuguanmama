<template>
  <div class="character-preview">
    <div class="preview-header">
      <h3>实时预览</h3>
      <TavernBadge
        :variant="previewStatus.variant"
        :icon="previewStatus.icon"
      >
        {{ previewStatus.text }}
      </TavernBadge>
    </div>

    <!-- 角色卡片预览 -->
    <div class="card-preview">
      <TavernCard
        variant="outlined"
        size="md"
        hoverable
        @click="openDetailPreview"
      >
        <template #media>
          <div class="character-avatar">
            <img
              v-if="character.avatar"
              :src="character.avatar"
              :alt="character.name"
            />
            <div v-else class="avatar-placeholder">
              <TavernIcon name="user" size="xl" />
            </div>
          </div>
        </template>

        <div class="character-info">
          <h4 class="character-name">
            {{ character.name || '未命名角色' }}
          </h4>

          <p class="character-description">
            {{ character.shortDescription || '暂无描述' }}
          </p>

          <div class="character-tags">
            <TavernBadge
              v-for="tag in character.tags.slice(0, 3)"
              :key="tag"
              variant="secondary"
              size="sm"
            >
              {{ tag }}
            </TavernBadge>
            <TavernBadge
              v-if="character.tags.length > 3"
              variant="ghost"
              size="sm"
            >
              +{{ character.tags.length - 3 }}
            </TavernBadge>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 对话预览 -->
    <div class="chat-preview">
      <h4>对话预览</h4>
      <div class="chat-messages">
        <div class="preview-message user">
          <div class="message-content">
            你好，很高兴认识你！
          </div>
        </div>

        <div class="preview-message assistant">
          <img
            v-if="character.avatar"
            :src="character.avatar"
            :alt="character.name"
            class="message-avatar"
          />
          <div v-else class="message-avatar-placeholder">
            <TavernIcon name="user" size="sm" />
          </div>
          <div class="message-content">
            {{ generatePreviewResponse() }}
          </div>
        </div>
      </div>

      <TavernButton
        variant="primary"
        size="sm"
        :disabled="!isCharacterValid"
        @click="$emit('test-chat')"
      >
        <template #icon-left>
          <TavernIcon name="chat" />
        </template>
        测试对话
      </TavernButton>
    </div>

    <!-- 设定统计 -->
    <div class="stats-preview">
      <h4>角色完成度</h4>
      <div class="completion-stats">
        <div
          v-for="stat in completionStats"
          :key="stat.key"
          class="stat-item"
        >
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: stat.percentage + '%' }"
              />
            </div>
            <span class="progress-text">{{ stat.percentage }}%</span>
          </div>
        </div>

        <div class="overall-completion">
          <div class="completion-circle" :style="{ '--percentage': overallCompletion }">
            <svg viewBox="0 0 36 36">
              <path
                class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--surface-3)"
                stroke-width="3"
              />
              <path
                class="circle"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--brand-primary-500)"
                stroke-width="3"
                :stroke-dasharray="`${overallCompletion}, 100`"
              />
            </svg>
            <div class="percentage-text">{{ overallCompletion }}%</div>
          </div>
          <p class="completion-label">总体完成度</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'

// Types
interface CharacterData {
  name: string
  avatar: string
  shortDescription: string
  category: string
  tags: string[]
  appearance?: {
    physicalDescription: string
    outfit: string
    expressions: string[]
  }
  personality?: string[]
  background?: string
  scenario?: string
  firstMessage?: string
}

// Props & Emits
const props = defineProps<{
  character: CharacterData
  currentStep: number
}>()

const emit = defineEmits<{
  'test-chat': []
}>()

// Computed
const previewStatus = computed(() => {
  const completion = overallCompletion.value

  if (completion < 30) {
    return {
      variant: 'error' as const,
      icon: 'warning',
      text: '信息不完整'
    }
  } else if (completion < 70) {
    return {
      variant: 'warning' as const,
      icon: 'clock',
      text: '正在完善'
    }
  } else {
    return {
      variant: 'success' as const,
      icon: 'check',
      text: '信息完整'
    }
  }
})

const isCharacterValid = computed(() => {
  return !!(props.character.name && props.character.shortDescription)
})

const completionStats = computed(() => [
  {
    key: 'basic',
    label: '基础信息',
    percentage: Math.round(
      ((props.character.name ? 25 : 0) +
       (props.character.avatar ? 25 : 0) +
       (props.character.shortDescription ? 25 : 0) +
       (props.character.category ? 25 : 0))
    )
  },
  {
    key: 'appearance',
    label: '外观设定',
    percentage: Math.round(
      ((props.character.appearance?.physicalDescription ? 50 : 0) +
       (props.character.appearance?.outfit ? 50 : 0))
    )
  },
  {
    key: 'personality',
    label: '性格设置',
    percentage: Math.round(
      (props.character.personality?.length ? Math.min(props.character.personality.length * 20, 100) : 0)
    )
  },
  {
    key: 'backstory',
    label: '背景故事',
    percentage: Math.round(
      ((props.character.background ? 33 : 0) +
       (props.character.scenario ? 33 : 0) +
       (props.character.firstMessage ? 34 : 0))
    )
  }
])

const overallCompletion = computed(() => {
  const total = completionStats.value.reduce((sum, stat) => sum + stat.percentage, 0)
  return Math.round(total / completionStats.value.length)
})

// Methods
const generatePreviewResponse = () => {
  const { name, personality, firstMessage } = props.character

  if (firstMessage) {
    return firstMessage
  }

  if (name && personality?.length) {
    const trait = personality[0]
    return `你好！我是${name}。很高兴见到你！我是一个${trait}的人。`
  }

  if (name) {
    return `你好！我是${name}，很高兴认识你！`
  }

  return '你好！很高兴认识你！'
}

const openDetailPreview = () => {
  // 打开详细预览弹窗
  // TODO: 实现详细预览功能
}
</script>

<style lang="scss">
.character-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--text-lg);
      color: var(--text-primary);
    }
  }

  .card-preview {
    .character-avatar {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: var(--surface-4);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-tertiary);
      }
    }

    .character-info {
      padding: var(--space-4);

      .character-name {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
      }

      .character-description {
        margin: 0 0 var(--space-3) 0;
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: var(--leading-relaxed);
      }

      .character-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }
    }
  }

  .chat-preview {
    padding: var(--space-4);
    background: var(--surface-2);
    border-radius: var(--radius-lg);

    h4 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-base);
      color: var(--text-primary);
    }

    .chat-messages {
      margin-bottom: var(--space-4);

      .preview-message {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-3);

        &.user {
          flex-direction: row-reverse;

          .message-content {
            background: var(--brand-primary-500);
            color: var(--brand-primary-50);
          }
        }

        &.assistant {
          .message-content {
            background: var(--surface-3);
            color: var(--text-primary);
          }
        }

        .message-avatar {
          width: var(--space-8);
          height: var(--space-8);
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .message-avatar-placeholder {
          width: var(--space-8);
          height: var(--space-8);
          border-radius: var(--radius-full);
          background: var(--surface-4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
        }

        .message-content {
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          max-width: 200px;
          line-height: var(--leading-normal);
        }
      }
    }
  }

  .stats-preview {
    h4 {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-base);
      color: var(--text-primary);
    }

    .completion-stats {
      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-3);

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .stat-progress {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
          margin-left: var(--space-4);

          .progress-bar {
            flex: 1;
            height: var(--space-1);
            background: var(--surface-3);
            border-radius: var(--radius-full);
            overflow: hidden;

            .progress-fill {
              height: 100%;
              background: var(--brand-primary-500);
              transition: width var(--duration-normal) ease;
            }
          }

          .progress-text {
            font-size: var(--text-xs);
            color: var(--text-tertiary);
            min-width: 35px;
            text-align: right;
          }
        }
      }

      .overall-completion {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-6);
        padding-top: var(--space-4);
        border-top: var(--space-px) solid var(--border-secondary);

        .completion-circle {
          position: relative;
          width: 80px;
          height: 80px;

          svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }

          .circle {
            transition: stroke-dasharray var(--duration-normal) ease;
          }

          .percentage-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            color: var(--text-primary);
          }
        }

        .completion-label {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
      }
    }
  }
}
</style>