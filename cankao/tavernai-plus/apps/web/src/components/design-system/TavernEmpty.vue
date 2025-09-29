<template>
  <div class="tavern-empty-wrapper">
    <el-empty
      v-bind="$attrs"
      :class="[
        'tavern-empty',
        `tavern-empty--${size}`,
        {
          'tavern-empty--clickable': clickable
        }
      ]"
      :image="customImage || defaultImage"
      :image-size="imageSize"
      :description="description"
      @click="handleClick"
    >
      <template v-if="$slots.image" #image>
        <slot name="image" />
      </template>

      <template v-if="$slots.description" #description>
        <slot name="description" />
      </template>

      <template #default>
        <div class="tavern-empty__actions">
          <slot />
        </div>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElEmpty } from 'element-plus'

export interface TavernEmptyProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  image?: string
  imageSize?: number
  description?: string
  clickable?: boolean
}

const props = withDefaults(defineProps<TavernEmptyProps>(), {
  size: 'md',
  clickable: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const defaultImage = computed(() => {
  switch (props.size) {
    case 'sm':
      return '/images/empty-small.svg'
    case 'lg':
    case 'xl':
      return '/images/empty-large.svg'
    default:
      return '/images/empty.svg'
  }
})

const customImage = computed(() => {
  return props.image
})

const imageSize = computed(() => {
  if (props.imageSize) return props.imageSize

  switch (props.size) {
    case 'sm': return 48
    case 'lg': return 120
    case 'xl': return 160
    default: return 80
  }
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
.tavern-empty-wrapper {
  .tavern-empty {
    :deep(.el-empty) {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--empty-padding);
      text-align: center;

      .el-empty__image {
        margin-bottom: var(--empty-image-margin);
        opacity: var(--empty-image-opacity);
        transition: opacity 0.3s ease;
      }

      .el-empty__description {
        color: var(--text-muted);
        font-size: var(--empty-description-font-size);
        line-height: var(--empty-description-line-height);
        margin-bottom: var(--empty-description-margin);

        p {
          margin: 0;
          color: inherit;
        }
      }
    }

    // 尺寸样式
    &--sm {
      --empty-padding: 16px;
      --empty-image-margin: 8px;
      --empty-image-opacity: 0.8;
      --empty-description-font-size: 12px;
      --empty-description-line-height: 1.4;
      --empty-description-margin: 8px;
      --empty-actions-gap: 8px;
    }

    &--md {
      --empty-padding: 24px;
      --empty-image-margin: 12px;
      --empty-image-opacity: 0.9;
      --empty-description-font-size: 14px;
      --empty-description-line-height: 1.5;
      --empty-description-margin: 12px;
      --empty-actions-gap: 12px;
    }

    &--lg {
      --empty-padding: 32px;
      --empty-image-margin: 16px;
      --empty-image-opacity: 1;
      --empty-description-font-size: 16px;
      --empty-description-line-height: 1.5;
      --empty-description-margin: 16px;
      --empty-actions-gap: 16px;
    }

    &--xl {
      --empty-padding: 48px;
      --empty-image-margin: 24px;
      --empty-image-opacity: 1;
      --empty-description-font-size: 18px;
      --empty-description-line-height: 1.6;
      --empty-description-margin: 24px;
      --empty-actions-gap: 20px;
    }

    // 可点击样式
    &--clickable {
      cursor: pointer;

      :deep(.el-empty) {
        transition: all 0.2s ease;

        &:hover {
          .el-empty__image {
            transform: scale(1.05);
            opacity: 1;
          }

          .el-empty__description {
            color: var(--tavern-primary);
          }
        }

        &:active {
          .el-empty__image {
            transform: scale(0.95);
          }
        }
      }
    }
  }

  .tavern-empty__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--empty-actions-gap);

    :deep(> *) {
      margin: 0;
    }
  }
}

// 默认空状态图标样式
.tavern-empty {
  :deep(.el-empty__image) {
    // 如果没有自定义图片，使用CSS绘制的简单图标
    &:empty::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background: currentColor;
      opacity: 0.3;
      mask: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' /%3e%3c/svg%3e") no-repeat center;
      mask-size: contain;
    }
  }
}

// 暗色主题适配
.dark {
  .tavern-empty-wrapper {
    .tavern-empty {
      :deep(.el-empty__description) {
        color: var(--text-muted-dark);
      }

      &--clickable:hover {
        :deep(.el-empty__description) {
          color: var(--tavern-primary);
        }
      }
    }
  }
}
</style>
