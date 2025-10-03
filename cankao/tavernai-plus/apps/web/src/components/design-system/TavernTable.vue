<template>
  <div class="tavern-table-wrapper">
    <el-table
      v-bind="$attrs"
      :class="[
        'tavern-table',
        `tavern-table--${variant}`,
        `tavern-table--${size}`,
        {
          'tavern-table--bordered': bordered,
          'tavern-table--striped': striped,
          'tavern-table--compact': compact
        }
      ]"
      :data="data"
      :height="height"
      :max-height="maxHeight"
      :stripe="striped"
      :border="bordered"
      :size="elSize"
      :fit="fit"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :current-row-key="currentRowKey"
      :row-class-name="rowClassName"
      :row-style="rowStyle"
      :cell-class-name="cellClassName"
      :cell-style="cellStyle"
      :header-row-class-name="headerRowClassName"
      :header-row-style="headerRowStyle"
      :header-cell-class-name="headerCellClassName"
      :header-cell-style="headerCellStyle"
      :row-key="rowKey"
      :empty-text="emptyText"
      :default-expand-all="defaultExpandAll"
      :expand-row-keys="expandRowKeys"
      :default-sort="defaultSort"
      :tooltip-effect="tooltipEffect"
      :tooltip-options="tooltipOptions"
      :show-summary="showSummary"
      :sum-text="sumText"
      :summary-method="summaryMethod"
      :span-method="spanMethod"
      :select-on-indeterminate="selectOnIndeterminate"
      :indent="indent"
      :lazy="lazy"
      :load="load"
      :tree-props="treeProps"
      @select="handleSelect"
      @select-all="handleSelectAll"
      @selection-change="handleSelectionChange"
      @cell-mouse-enter="handleCellMouseEnter"
      @cell-mouse-leave="handleCellMouseLeave"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblclick"
      @row-click="handleRowClick"
      @row-contextmenu="handleRowContextmenu"
      @row-dblclick="handleRowDblclick"
      @header-click="handleHeaderClick"
      @header-contextmenu="handleHeaderContextmenu"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @current-change="handleCurrentChange"
      @header-dragend="handleHeaderDragend"
      @expand-change="handleExpandChange"
    >
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>

      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>

      <slot />
    </el-table>

    <!-- 分页组件 -->
    <div v-if="showPagination && total > 0" class="tavern-table__pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        :background="paginationBackground"
        @size-change="handleSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTable, ElPagination } from 'element-plus'

export interface TavernTableProps {
  data?: any[]
  height?: string | number
  maxHeight?: string | number
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  striped?: boolean
  compact?: boolean
  fit?: boolean
  showHeader?: boolean
  highlightCurrentRow?: boolean
  currentRowKey?: string | number
  rowClassName?: string | Function
  rowStyle?: object | Function
  cellClassName?: string | Function
  cellStyle?: object | Function
  headerRowClassName?: string | Function
  headerRowStyle?: object | Function
  headerCellClassName?: string | Function
  headerCellStyle?: object | Function
  rowKey?: string | Function
  emptyText?: string
  defaultExpandAll?: boolean
  expandRowKeys?: any[]
  defaultSort?: object
  tooltipEffect?: 'dark' | 'light'
  tooltipOptions?: object
  showSummary?: boolean
  sumText?: string
  summaryMethod?: Function
  spanMethod?: Function
  selectOnIndeterminate?: boolean
  indent?: number
  lazy?: boolean
  load?: Function
  treeProps?: object
  // 分页相关
  showPagination?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  paginationLayout?: string
  paginationBackground?: boolean
}

const props = withDefaults(defineProps<TavernTableProps>(), {
  data: () => [],
  variant: 'primary',
  size: 'md',
  bordered: false,
  striped: false,
  compact: false,
  fit: true,
  showHeader: true,
  highlightCurrentRow: false,
  emptyText: '暂无数据',
  defaultExpandAll: false,
  tooltipEffect: 'dark',
  showSummary: false,
  sumText: '合计',
  selectOnIndeterminate: true,
  indent: 16,
  lazy: false,
  // 分页默认值
  showPagination: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  paginationBackground: true
})

const emit = defineEmits<{
  select: [selection: any[], row: any]
  'select-all': [selection: any[]]
  'selection-change': [selection: any[]]
  'cell-mouse-enter': [row: any, column: any, cell: any, event: MouseEvent]
  'cell-mouse-leave': [row: any, column: any, cell: any, event: MouseEvent]
  'cell-click': [row: any, column: any, cell: any, event: MouseEvent]
  'cell-dblclick': [row: any, column: any, cell: any, event: MouseEvent]
  'row-click': [row: any, column: any, event: MouseEvent]
  'row-contextmenu': [row: any, column: any, event: MouseEvent]
  'row-dblclick': [row: any, column: any, event: MouseEvent]
  'header-click': [column: any, event: MouseEvent]
  'header-contextmenu': [column: any, event: MouseEvent]
  'sort-change': [sort: any]
  'filter-change': [filters: any]
  'current-change': [currentRow: any, oldCurrentRow: any]
  'header-dragend': [newWidth: number, oldWidth: number, column: any, event: MouseEvent]
  'expand-change': [row: any, expanded: boolean]
  'page-change': [currentPage: number, pageSize: number]
  'size-change': [pageSize: number]
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
}>()

const elSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'small'
    case 'lg': return 'large'
    default: return 'default'
  }
})

const handleSelect = (...args: any[]) => {
  emit('select', ...args)
}

const handleSelectAll = (...args: any[]) => {
  emit('select-all', ...args)
}

const handleSelectionChange = (...args: any[]) => {
  emit('selection-change', ...args)
}

const handleCellMouseEnter = (...args: any[]) => {
  emit('cell-mouse-enter', ...args)
}

const handleCellMouseLeave = (...args: any[]) => {
  emit('cell-mouse-leave', ...args)
}

const handleCellClick = (...args: any[]) => {
  emit('cell-click', ...args)
}

const handleCellDblclick = (...args: any[]) => {
  emit('cell-dblclick', ...args)
}

const handleRowClick = (...args: any[]) => {
  emit('row-click', ...args)
}

const handleRowContextmenu = (...args: any[]) => {
  emit('row-contextmenu', ...args)
}

const handleRowDblclick = (...args: any[]) => {
  emit('row-dblclick', ...args)
}

const handleHeaderClick = (...args: any[]) => {
  emit('header-click', ...args)
}

const handleHeaderContextmenu = (...args: any[]) => {
  emit('header-contextmenu', ...args)
}

const handleSortChange = (...args: any[]) => {
  emit('sort-change', ...args)
}

const handleFilterChange = (...args: any[]) => {
  emit('filter-change', ...args)
}

const handleCurrentChange = (...args: any[]) => {
  emit('current-change', ...args)
}

const handleHeaderDragend = (...args: any[]) => {
  emit('header-dragend', ...args)
}

const handleExpandChange = (...args: any[]) => {
  emit('expand-change', ...args)
}

const handleSizeChange = (pageSize: number) => {
  emit('update:pageSize', pageSize)
  emit('size-change', pageSize)
  emit('page-change', props.currentPage, pageSize)
}

const handleCurrentPageChange = (currentPage: number) => {
  emit('update:currentPage', currentPage)
  emit('page-change', currentPage, props.pageSize)
}
</script>

<style lang="scss" scoped>
.tavern-table-wrapper {
  position: relative;

  .tavern-table {
    :deep(.el-table) {
      --el-table-border-color: var(--border-color);
      --el-table-border: 1px solid var(--el-table-border-color);
      --el-table-text-color: var(--text-color);
      --el-table-header-text-color: var(--text-color);
      --el-table-row-hover-bg-color: var(--bg-hover);
      --el-table-current-row-bg-color: rgba(var(--tavern-primary-rgb), 0.1);
      --el-table-header-bg-color: var(--bg-secondary);
      --el-table-fixed-box-shadow: var(--shadow-lg);
      --el-table-bg-color: var(--card-bg);
      --el-table-tr-bg-color: transparent;
      --el-table-expanded-cell-bg-color: var(--bg-secondary);
      --el-table-fixed-left-column: inset 10px 0 10px -10px rgba(var(--bg-primary-rgb), 0.15);
      --el-table-fixed-right-column: inset -10px 0 10px 10px rgba(var(--bg-primary-rgb), 0.15);

      .el-table__header-wrapper {
        .el-table__header {
          th {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            font-weight: 600;
            color: var(--text-color);
            padding: var(--table-header-padding);

            &.is-leaf {
              border-bottom: 2px solid var(--tavern-primary);
            }

            .cell {
              font-size: var(--table-header-font-size);
              line-height: var(--table-header-line-height);
            }

            &:hover {
              background: var(--bg-hover);
            }

            &.is-sortable {
              cursor: pointer;
              user-select: none;

              .caret-wrapper {
                .sort-caret {
                  border: 5px solid transparent;
                  width: 0;
                  height: 0;
                  display: inline-block;
                  margin-left: 4px;

                  &.ascending {
                    border-bottom-color: var(--text-muted);
                    border-top: none;

                    &.is-active {
                      border-bottom-color: var(--tavern-primary);
                    }
                  }

                  &.descending {
                    border-top-color: var(--text-muted);
                    border-bottom: none;

                    &.is-active {
                      border-top-color: var(--tavern-primary);
                    }
                  }
                }
              }
            }
          }
        }
      }

      .el-table__body-wrapper {
        .el-table__body {
          td {
            border-bottom: 1px solid var(--border-color);
            padding: var(--table-cell-padding);
            color: var(--text-color);

            .cell {
              font-size: var(--table-cell-font-size);
              line-height: var(--table-cell-line-height);
            }

            &:hover {
              background: var(--bg-hover);
            }
          }

          tr {
            &:hover {
              td {
                background: var(--bg-hover);
              }
            }

            &.current-row {
              td {
                background: rgba(var(--tavern-primary-rgb), 0.1);
              }
            }

            &.el-table__row--striped {
              td {
                background: var(--bg-striped);
              }
            }
          }
        }
      }

      .el-table__empty-block {
        .el-table__empty-text {
          color: var(--text-muted);
          font-size: var(--table-empty-font-size);
        }
      }

      .el-table__column-resize-proxy {
        border-left: 1px solid var(--tavern-primary);
      }
    }

    // 变体样式
    &--primary {
      :deep(.el-table__header th.is-leaf) {
        border-bottom-color: var(--tavern-primary);
      }

      :deep(.el-table__body tr.current-row td) {
        background: rgba(var(--tavern-primary-rgb), 0.1);
      }
    }

    &--secondary {
      :deep(.el-table__header th.is-leaf) {
        border-bottom-color: var(--tavern-secondary);
      }

      :deep(.el-table__body tr.current-row td) {
        background: rgba(var(--tavern-secondary-rgb), 0.1);
      }
    }

    &--neutral {
      :deep(.el-table__header th.is-leaf) {
        border-bottom-color: var(--border-color);
      }

      :deep(.el-table__body tr.current-row td) {
        background: var(--bg-hover);
      }
    }

    // 尺寸样式
    &--sm {
      --table-header-padding: 8px 12px;
      --table-header-font-size: 14px;
      --table-header-line-height: 1.4;
      --table-cell-padding: 8px 12px;
      --table-cell-font-size: 14px;
      --table-cell-line-height: 1.4;
      --table-empty-font-size: 14px;
    }

    &--md {
      --table-header-padding: 12px 16px;
      --table-header-font-size: 16px;
      --table-header-line-height: 1.5;
      --table-cell-padding: 12px 16px;
      --table-cell-font-size: 16px;
      --table-cell-line-height: 1.5;
      --table-empty-font-size: 16px;
    }

    &--lg {
      --table-header-padding: 16px 20px;
      --table-header-font-size: 18px;
      --table-header-line-height: 1.6;
      --table-cell-padding: 16px 20px;
      --table-cell-font-size: 18px;
      --table-cell-line-height: 1.6;
      --table-empty-font-size: 18px;
    }

    // 特殊样式
    &--bordered {
      :deep(.el-table) {
        border: 1px solid var(--border-color);
        border-radius: var(--card-radius);

        .el-table__header-wrapper {
          .el-table__header {
            th {
              border-right: 1px solid var(--border-color);

              &:last-child {
                border-right: none;
              }
            }
          }
        }

        .el-table__body-wrapper {
          .el-table__body {
            td {
              border-right: 1px solid var(--border-color);
            }
          }
        }
      }
    }

    &--striped {
      :deep(.el-table__body tr.el-table__row--striped td) {
        background: var(--bg-striped);
      }
    }

    &--compact {
      :deep(.el-table) {
        --table-header-padding: 6px 8px;
        --table-cell-padding: 6px 8px;
      }
    }
  }

  .tavern-table__pagination {
    display: flex;
    justify-content: center;
    margin-top: 16px;
    padding: 16px 0;

    :deep(.el-pagination) {
      --el-pagination-bg-color: var(--card-bg);
      --el-pagination-text-color: var(--text-color);
      --el-pagination-border-color: var(--border-color);
      --el-pagination-button-color: var(--text-color);
      --el-pagination-button-bg-color: var(--bg-secondary);
      --el-pagination-button-hover-color: var(--tavern-primary);
      --el-pagination-button-active-bg-color: var(--tavern-primary);
      --el-pagination-button-active-color: white;
    }
  }
}

// 暗色主题适配
.dark {
  .tavern-table-wrapper {
    .tavern-table {
      :deep(.el-table) {
        --el-table-bg-color: var(--card-bg-dark);
        --el-table-header-bg-color: var(--bg-secondary-dark);
        --el-table-row-hover-bg-color: var(--bg-hover-dark);
        --el-table-current-row-bg-color: rgba(var(--tavern-primary-rgb), 0.2);
        --el-table-expanded-cell-bg-color: var(--bg-secondary-dark);
        --el-table-fixed-left-column: inset 10px 0 10px -10px rgba(0, 0, 0, 0.3);
        --el-table-fixed-right-column: inset -10px 0 10px 10px rgba(0, 0, 0, 0.3);

        .el-table__header-wrapper {
          .el-table__header {
            th {
              background: var(--bg-secondary-dark);
              border-bottom-color: var(--border-color-dark);
              color: var(--text-color-dark);
            }
          }
        }

        .el-table__body-wrapper {
          .el-table__body {
            td {
              border-bottom-color: var(--border-color-dark);
              color: var(--text-color-dark);

              &:hover {
                background: var(--bg-hover-dark);
              }
            }

            tr {
              &:hover {
                td {
                  background: var(--bg-hover-dark);
                }
              }

              &.el-table__row--striped {
                td {
                  background: var(--bg-striped-dark);
                }
              }
            }
          }
        }

        .el-table__empty-block {
          .el-table__empty-text {
            color: var(--text-muted-dark);
          }
        }
      }
    }

    .tavern-table__pagination {
      :deep(.el-pagination) {
        --el-pagination-bg-color: var(--card-bg-dark);
        --el-pagination-text-color: var(--text-color-dark);
        --el-pagination-border-color: var(--border-color-dark);
        --el-pagination-button-color: var(--text-color-dark);
        --el-pagination-button-bg-color: var(--bg-secondary-dark);
      }
    }
  }
}
</style>
