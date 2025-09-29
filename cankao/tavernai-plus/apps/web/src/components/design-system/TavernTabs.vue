<template>
  <div class="tavern-tabs-wrapper">
    <el-tabs
      v-model="modelValue"
      v-bind="$attrs"
      :class="[
        'tavern-tabs',
        `tavern-tabs--${variant}`,
        `tavern-tabs--${size}`,
        {
          'tavern-tabs--stretch': stretch
        }
      ]"
      :type="tabType"
      :closable="closable"
      :addable="addable"
      :editable="editable"
      :tab-position="tabPosition"
      :stretch="stretch"
      :before-leave="beforeLeave"
      @tab-click="$emit('tab-click', $event)"
      @tab-change="$emit('tab-change', $event)"
      @tab-remove="$emit('tab-remove', $event)"
      @tab-add="$emit('tab-add')"
      @edit="$emit('edit', $event)"
    >
      <template v-if="$slots.add-icon" #add-icon>
        <slot name="add-icon" />
      </template>

      <slot />
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTabs } from 'element-plus'

export interface TavernTabsProps {
  modelValue?: string | number
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  type?: 'card' | 'border-card'
  closable?: boolean
  addable?: boolean
  editable?: boolean
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
  stretch?: boolean
  beforeLeave?: (newTab: string | number, oldTab: string | number) => boolean | Promise<boolean>
}

const props = withDefaults(defineProps<TavernTabsProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'card',
  closable: false,
  addable: false,
  editable: false,
  tabPosition: 'top',
  stretch: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'tab-click': [tab: any, event: Event]
  'tab-change': [name: string | number]
  'tab-remove': [name: string | number]
  'tab-add': []
  edit: [targetName: string | number, action: 'remove' | 'add']
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tabType = computed(() => {
  return props.type === 'border-card' ? 'border-card' : ''
})
</script>

<style lang="scss" scoped>
.tavern-tabs-wrapper {
  .tavern-tabs {
    :deep(.el-tabs) {
      --el-tabs-header-height: var(--tabs-header-height);
    }

    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);

      .el-tabs__nav-wrap {
        &::after {
          display: none;
        }

        .el-tabs__nav-scroll {
          padding: 0 var(--tabs-nav-padding);

          .el-tabs__nav {
            border: none;
            background: transparent;

            .el-tabs__item {
              color: var(--text-color);
              border: none;
              background: transparent;
              margin-right: var(--tabs-item-margin);
              padding: var(--tabs-item-padding);
              border-radius: var(--tabs-item-radius);
              font-size: var(--tabs-font-size);
              font-weight: var(--tabs-font-weight);
              transition: all 0.2s ease;
              position: relative;

              &:hover {
                color: var(--tavern-primary);
                background: rgba(var(--tavern-primary-rgb), 0.1);
              }

              &.is-active {
                color: var(--tavern-primary);
                background: rgba(var(--tavern-primary-rgb), 0.1);

                &::after {
                  content: '';
                  position: absolute;
                  bottom: 0;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 20px;
                  height: 2px;
                  background: var(--tavern-primary);
                  border-radius: 1px;
                }
              }

              &.is-disabled {
                color: var(--text-muted);
                cursor: not-allowed;

                &:hover {
                  color: var(--text-muted);
                  background: transparent;
                }
              }
            }

            .el-tabs__new-tab {
              color: var(--tavern-primary);
              border: 1px dashed var(--tavern-primary);
              background: transparent;
              margin-left: var(--tabs-item-margin);

              &:hover {
                background: rgba(var(--tavern-primary-rgb), 0.1);
              }
            }
          }
        }
      }
    }

    :deep(.el-tabs__content) {
      padding: var(--tabs-content-padding);

      .el-tab-pane {
        color: var(--text-color);
      }
    }

    // 变体样式
    &--primary {
      :deep(.el-tabs__item.is-active) {
        color: var(--tavern-primary);
        background: rgba(var(--tavern-primary-rgb), 0.1);
      }
    }

    &--secondary {
      :deep(.el-tabs__item.is-active) {
        color: var(--tavern-secondary);
        background: rgba(var(--tavern-secondary-rgb), 0.1);
      }
    }

    &--neutral {
      :deep(.el-tabs__item.is-active) {
        color: var(--text-color);
        background: var(--bg-hover);
      }
    }

    // 尺寸样式
    &--sm {
      --tabs-header-height: 32px;
      --tabs-nav-padding: 8px;
      --tabs-item-margin: 4px;
      --tabs-item-padding: 6px 12px;
      --tabs-item-radius: 4px;
      --tabs-font-size: 14px;
      --tabs-font-weight: 500;
      --tabs-content-padding: 12px 0;
    }

    &--md {
      --tabs-header-height: 40px;
      --tabs-nav-padding: 12px;
      --tabs-item-margin: 8px;
      --tabs-item-padding: 8px 16px;
      --tabs-item-radius: 6px;
      --tabs-font-size: 16px;
      --tabs-font-weight: 500;
      --tabs-content-padding: 16px 0;
    }

    &--lg {
      --tabs-header-height: 48px;
      --tabs-nav-padding: 16px;
      --tabs-item-margin: 12px;
      --tabs-item-padding: 12px 20px;
      --tabs-item-radius: 8px;
      --tabs-font-size: 18px;
      --tabs-font-weight: 600;
      --tabs-content-padding: 20px 0;
    }

    // 卡片类型样式
    :deep(.el-tabs--card) {
      > .el-tabs__header {
        .el-tabs__nav {
          border: 1px solid var(--border-color);
          border-radius: var(--card-radius);

          .el-tabs__item {
            border-right: 1px solid var(--border-color);

            &:first-child {
              border-top-left-radius: calc(var(--card-radius) - 1px);
              border-bottom-left-radius: calc(var(--card-radius) - 1px);
            }

            &:last-child {
              border-right: none;
              border-top-right-radius: calc(var(--card-radius) - 1px);
              border-bottom-right-radius: calc(var(--card-radius) - 1px);
            }

            &.is-active {
              background: var(--tavern-primary);
              color: white;
              border-color: var(--tavern-primary);

              &::after {
                display: none;
              }

              &:hover {
                background: var(--tavern-primary);
                color: white;
              }
            }
          }
        }
      }
    }

    :deep(.el-tabs--border-card) {
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      background: var(--card-bg);
      overflow: hidden;

      > .el-tabs__header {
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        margin: 0;

        .el-tabs__nav {
          border: none;

          .el-tabs__item {
            border-radius: 0;
            margin-right: 0;
            border-right: 1px solid var(--border-color);

            &:last-child {
              border-right: none;
            }

            &.is-active {
              background: var(--card-bg);

              &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: var(--tavern-primary);
              }
            }
          }
        }
      }

      > .el-tabs__content {
        background: var(--card-bg);
      }
    }

    // 拉伸样式
    &--stretch {
      :deep(.el-tabs__nav) {
        width: 100%;

        .el-tabs__item {
          flex: 1;
          text-align: center;
        }
      }
    }
  }
}

// 垂直标签页样式
:deep(.el-tabs--left),
:deep(.el-tabs--right) {
  .el-tabs__header {
    border-bottom: none;
    border-right: 1px solid var(--border-color);

    .el-tabs__nav {
      flex-direction: column;

      .el-tabs__item {
        margin-right: 0;
        margin-bottom: var(--tabs-item-margin);
        border-bottom: 1px solid var(--border-color);
        border-right: none;

        &.is-active::after {
          bottom: auto;
          right: 0;
          top: 50%;
          left: auto;
          transform: translateY(-50%);
          width: 2px;
          height: 20px;
        }
      }
    }
  }

  .el-tabs__content {
    padding-left: var(--tabs-content-padding);
  }
}

:deep(.el-tabs--right) {
  .el-tabs__header {
    border-left: 1px solid var(--border-color);
    border-right: none;
  }

  .el-tabs__content {
    padding-left: 0;
    padding-right: var(--tabs-content-padding);
  }
}

// 暗色主题适配
.dark {
  .tavern-tabs {
    :deep(.el-tabs__header) {
      background: var(--bg-secondary-dark);
      border-color: var(--border-color-dark);
    }

    :deep(.el-tabs__content) {
      background: var(--card-bg-dark);
    }

    :deep(.el-tabs--card) {
      > .el-tabs__header .el-tabs__nav {
        border-color: var(--border-color-dark);

        .el-tabs__item {
          border-color: var(--border-color-dark);
        }
      }
    }

    :deep(.el-tabs--border-card) {
      border-color: var(--border-color-dark);
      background: var(--card-bg-dark);

      > .el-tabs__header {
        background: var(--bg-secondary-dark);
        border-color: var(--border-color-dark);

        .el-tabs__nav .el-tabs__item {
          border-color: var(--border-color-dark);

          &.is-active {
            background: var(--card-bg-dark);
          }
        }
      }

      > .el-tabs__content {
        background: var(--card-bg-dark);
      }
    }
  }
}
</style>
