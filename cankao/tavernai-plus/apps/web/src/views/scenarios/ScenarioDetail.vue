<template>
  <div class="scenario-detail">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <LoadingOverlay message="加载剧本详情中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <TavernCard class="error-card">
        <div class="error-content">
          <TavernIcon name="warning" size="xl" class="error-icon" />
          <h3 class="error-title">加载失败</h3>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <TavernButton type="primary" @click="loadScenario">
              重新加载
            </TavernButton>
            <TavernButton @click="$router.push('/scenarios')">
              返回列表
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 正常内容 -->
    <div v-else-if="scenario" class="scenario-content">
      <!-- 页面头部 -->
      <PageHeader
        :title="scenario.name"
        :subtitle="scenario.description || '无描述'"
        :breadcrumb="breadcrumbItems"
      >
        <template #actions>
          <div class="header-actions">
            <!-- 状态指示器 -->
            <TavernBadge
              :variant="scenario.isPublic ? 'success' : 'warning'"
              :text="scenario.isPublic ? '公开' : '私有'"
            />

            <!-- 操作按钮 -->
            <TavernButton
              @click="editScenario"
              variant="primary"
              class="edit-btn"
            >
              <TavernIcon name="edit" class="mr-2" />
              编辑剧本
            </TavernButton>

            <div class="dropdown-wrapper">
              <TavernButton @click="toggleDropdown" class="dropdown-trigger">
                <TavernIcon name="menu" />
              </TavernButton>
              <div v-if="showDropdown" class="dropdown-menu" @click="hideDropdown">
                <button @click="handleCommand('clone')" class="dropdown-item">
                  <TavernIcon name="document" class="mr-2" />
                  复制剧本
                </button>
                <button @click="handleCommand('export')" class="dropdown-item">
                  <TavernIcon name="download" class="mr-2" />
                  导出剧本
                </button>
                <div class="dropdown-divider"></div>
                <button @click="handleCommand('test')" class="dropdown-item">
                  <TavernIcon name="sparkles" class="mr-2" />
                  测试匹配
                </button>
                <div class="dropdown-divider"></div>
                <button @click="handleCommand('delete')" class="dropdown-item danger">
                  <TavernIcon name="delete" class="mr-2" />
                  删除剧本
                </button>
              </div>
            </div>
          </div>
        </template>
      </PageHeader>

      <!-- 主内容区域 -->
      <div class="detail-content">
        <!-- 剧本信息卡片 -->
        <TavernCard class="scenario-info-card">
          <div class="info-grid">
            <!-- 基本信息 -->
            <div class="basic-info">
              <h3 class="section-title">剧本信息</h3>
              <div class="info-list">
                <div class="info-item">
                  <label class="info-label">描述</label>
                  <p class="info-value">
                    {{ scenario.description || '暂无描述' }}
                  </p>
                </div>

                <div v-if="scenario.content" class="info-item">
                  <label class="info-label">剧本内容</label>
                  <div class="content-preview">
                    {{ scenario.content }}
                  </div>
                </div>

                <div v-if="scenario.tags && scenario.tags.length > 0" class="info-item">
                  <label class="info-label">标签</label>
                  <div class="tags-list">
                    <TavernBadge
                      v-for="tag in scenario.tags"
                      :key="tag"
                      :text="tag"
                      variant="secondary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="stats-info">
              <h3 class="section-title">统计信息</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <div class="stat-label">分类</div>
                  <div class="stat-value">{{ scenario.category }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">语言</div>
                  <div class="stat-value">{{ scenario.language || 'zh-CN' }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">条目数量</div>
                  <div class="stat-value">{{ scenario.worldInfoEntries?.length || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">活跃条目</div>
                  <div class="stat-value">{{ activeEntriesCount }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">创建时间</div>
                  <div class="stat-value stat-date">{{ formatDate(scenario.createdAt) }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">更新时间</div>
                  <div class="stat-value stat-date">{{ formatDate(scenario.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </TavernCard>

        <!-- 世界信息预览 -->
        <TavernCard class="entries-preview">
          <div class="entries-header">
            <h3 class="section-title">
              世界信息条目 ({{ scenario.worldInfoEntries?.length || 0 }})
            </h3>
            <TavernButton
              @click="editScenario"
              size="sm"
              variant="primary"
              outline
            >
              管理条目
            </TavernButton>
          </div>

          <div v-if="!scenario.worldInfoEntries || scenario.worldInfoEntries.length === 0" class="empty-state">
            <TavernIcon name="document" size="xl" class="empty-icon" />
            <h4 class="empty-title">暂无世界信息条目</h4>
            <p class="empty-description">开始添加条目来丰富你的剧本世界观</p>
            <TavernButton variant="primary" @click="editScenario">
              添加第一个条目
            </TavernButton>
          </div>

          <div v-else class="entries-grid">
            <TavernCard
              v-for="entry in scenario.worldInfoEntries.slice(0, 6)"
              :key="entry.id"
              class="entry-card"
              variant="secondary"
            >
              <div class="entry-header">
                <h4 class="entry-title">
                  {{ entry.title }}
                </h4>
                <TavernBadge
                  :variant="entry.isActive ? 'success' : 'secondary'"
                  :text="entry.isActive ? '活跃' : '禁用'"
                />
              </div>

              <p class="entry-content">
                {{ entry.content }}
              </p>

              <div class="entry-meta">
                <span class="entry-keywords">{{ entry.keywords.length }} 个关键词</span>
                <span class="entry-priority">优先级 {{ entry.priority }}</span>
              </div>
            </TavernCard>

            <div
              v-if="scenario.worldInfoEntries.length > 6"
              class="more-entries-card"
              @click="editScenario"
            >
              <div class="more-content">
                <div class="more-count">
                  +{{ scenario.worldInfoEntries.length - 6 }}
                </div>
                <div class="more-text">更多条目</div>
              </div>
            </div>
          </div>
        </TavernCard>
      </div>
    </div>

    <!-- 测试对话框 -->
    <ScenarioTestDialog
      v-if="showTestDialog"
      :scenario="scenario"
      @close="showTestDialog = false"
    />

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <TavernCard class="delete-dialog" @click.stop>
        <div class="delete-content">
          <TavernIcon name="warning" size="xl" class="delete-icon" />
          <h3 class="delete-title">确认删除</h3>
          <p class="delete-message">
            确定要删除剧本 "{{ scenario?.name }}" 吗？此操作不可恢复。
          </p>
          <div class="delete-actions">
            <TavernButton @click="showDeleteDialog = false">
              取消
            </TavernButton>
            <TavernButton variant="danger" @click="confirmDelete">
              删除
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 克隆剧本对话框 -->
    <div v-if="showCloneDialog" class="dialog-overlay" @click="showCloneDialog = false">
      <TavernCard class="clone-dialog" @click.stop>
        <div class="clone-content">
          <h3 class="clone-title">复制剧本</h3>
          <p class="clone-description">请输入新剧本的名称：</p>
          <TavernInput
            v-model="cloneName"
            placeholder="输入剧本名称"
            class="clone-input"
          />
          <div class="clone-actions">
            <TavernButton @click="showCloneDialog = false">
              取消
            </TavernButton>
            <TavernButton variant="primary" @click="confirmClone" :disabled="!cloneName.trim()">
              复制
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import ScenarioTestDialog from '@/components/scenario/ScenarioTestDialog.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario } from '@/types/scenario'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const showTestDialog = ref(false)
const showDropdown = ref(false)
const showDeleteDialog = ref(false)
const showCloneDialog = ref(false)
const cloneName = ref('')

// 计算属性
const {
  currentScenario: scenario,
  isLoading,
  error
} = scenarioStore

const breadcrumbItems = computed(() => [
  { text: '首页', to: '/' },
  { text: '剧本管理', to: '/scenarios' },
  { text: scenario.value?.name || '剧本详情', to: `/scenarios/${route.params.id}` }
])

const activeEntriesCount = computed(() => {
  if (!scenario.value?.worldInfoEntries) return 0
  return scenario.value.worldInfoEntries.filter(entry => entry.isActive).length
})

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (scenarioId) {
    await scenarioStore.fetchScenario(scenarioId)
  }
}

const editScenario = () => {
  if (scenario.value) {
    router.push(`/scenarios/${scenario.value.id}/edit`)
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const hideDropdown = () => {
  showDropdown.value = false
}

const handleCommand = async (command: string) => {
  if (!scenario.value) return

  switch (command) {
    case 'clone':
      showCloneDialog.value = true
      cloneName.value = `${scenario.value.name} (副本)`
      break
    case 'export':
      await handleExport()
      break
    case 'test':
      showTestDialog.value = true
      break
    case 'delete':
      showDeleteDialog.value = true
      break
  }
}

const handleExport = async () => {
  if (!scenario.value) return

  try {
    // 这里需要实现导出功能
    console.log('导出功能开发中...')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const confirmClone = async () => {
  if (!scenario.value || !cloneName.value.trim()) return

  try {
    const newScenario = await scenarioStore.createScenario({
      name: cloneName.value.trim(),
      description: scenario.value.description,
      category: scenario.value.category,
      tags: [...scenario.value.tags],
      isPublic: false
    })

    showCloneDialog.value = false
    cloneName.value = ''
    console.log('剧本复制成功')
    router.push(`/scenarios/${newScenario.id}/edit`)
  } catch (error) {
    console.error('复制剧本失败:', error)
  }
}

const confirmDelete = async () => {
  if (!scenario.value) return

  try {
    await scenarioStore.deleteScenario(scenario.value.id)
    showDeleteDialog.value = false
    console.log('剧本删除成功')
    router.push('/scenarios')
  } catch (error) {
    console.error('删除剧本失败:', error)
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const distance = formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
    const formatted = format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })
    return `${distance} (${formatted})`
  } catch {
    return '未知'
  }
}

// 处理点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-wrapper')) {
    showDropdown.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadScenario()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.scenario-detail {
  min-height: 100vh;
  background: var(--dt-color-background-primary);
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--dt-spacing-lg);
}

.error-card {
  max-width: 500px;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-lg);
}

.error-icon {
  color: var(--dt-color-warning);
}

.error-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin: 0;
}

.error-message {
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.error-actions {
  display: flex;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--dt-spacing-xl) var(--dt-spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  position: relative;
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  padding: var(--dt-spacing-sm);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--dt-color-surface-primary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  box-shadow: var(--dt-shadow-lg);
  min-width: 200px;
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--dt-spacing-md);
  border: none;
  background: none;
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-sm);
  cursor: pointer;
  transition: var(--dt-transition-fast);

  &:hover {
    background: var(--dt-color-surface-secondary);
  }

  &.danger {
    color: var(--dt-color-danger);

    &:hover {
      background: var(--dt-color-danger-light);
    }
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--dt-color-border-secondary);
}

.scenario-info-card {
  padding: var(--dt-spacing-2xl);
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--dt-spacing-2xl);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-xl);
  }
}

.section-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin: 0 0 var(--dt-spacing-lg) 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-sm);
}

.info-label {
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-secondary);
}

.info-value {
  color: var(--dt-color-text-primary);
  margin: 0;
}

.content-preview {
  background: var(--dt-color-surface-secondary);
  padding: var(--dt-spacing-md);
  border-radius: var(--dt-radius-md);
  max-height: 120px;
  overflow-y: auto;
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-primary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-sm);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xs);
}

.stat-label {
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-secondary);
}

.stat-value {
  font-size: var(--dt-font-size-base);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);

  &.stat-date {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-normal);
  }
}

.entries-preview {
  padding: var(--dt-spacing-2xl);
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--dt-spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--dt-spacing-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.empty-icon {
  color: var(--dt-color-text-tertiary);
}

.empty-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.empty-description {
  color: var(--dt-color-text-tertiary);
  margin: 0;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--dt-spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.entry-card {
  padding: var(--dt-spacing-lg);
  transition: var(--dt-transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--dt-shadow-md);
  }
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--dt-spacing-sm);
  gap: var(--dt-spacing-sm);
}

.entry-title {
  font-size: var(--dt-font-size-md);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-content {
  color: var(--dt-color-text-secondary);
  font-size: var(--dt-font-size-sm);
  margin: 0 0 var(--dt-spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
}

.more-entries-card {
  background: var(--dt-color-surface-secondary);
  border: 2px dashed var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--dt-transition-fast);

  &:hover {
    background: var(--dt-color-surface-tertiary);
    border-color: var(--dt-color-border-primary);
  }
}

.more-content {
  text-align: center;
  padding: var(--dt-spacing-xl);
}

.more-count {
  font-size: var(--dt-font-size-2xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-secondary);
  margin-bottom: var(--dt-spacing-xs);
}

.more-text {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-tertiary);
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--dt-spacing-lg);
}

.delete-dialog,
.clone-dialog {
  max-width: 500px;
  width: 100%;
}

.delete-content,
.clone-content {
  padding: var(--dt-spacing-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.delete-icon {
  color: var(--dt-color-warning);
  margin: 0 auto;
}

.delete-title,
.clone-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin: 0;
}

.delete-message,
.clone-description {
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.delete-actions,
.clone-actions {
  display: flex;
  justify-content: center;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.clone-input {
  text-align: left;
}

// 响应式设计
@media (max-width: 768px) {
  .detail-content {
    padding: var(--dt-spacing-lg) var(--dt-spacing-md);
  }

  .scenario-info-card,
  .entries-preview {
    padding: var(--dt-spacing-lg);
  }

  .header-actions {
    flex-wrap: wrap;
    gap: var(--dt-spacing-sm);
  }

  .entries-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--dt-spacing-md);
  }
}
</style>