<template>
  <div class="scenario-management">
    <!-- 页面头部 -->
    <PageHeader
      title="剧本管理"
      subtitle="创建和管理您的世界信息剧本"
      :breadcrumb="breadcrumbItems"
    >
      <template #actions>
        <el-button
          type="primary"
          @click="createNewScenario"
          :icon="'Plus'"
          size="large"
        >
          创建剧本
        </el-button>
      </template>
    </PageHeader>

    <!-- 主内容区域 -->
    <div class="management-content">
      <ScenarioList
        @scenario-created="handleScenarioCreated"
        @scenario-selected="handleScenarioSelected"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ScenarioList from '@/components/scenario/ScenarioList.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario } from '@/types/scenario'

// 路由
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 面包屑导航
const breadcrumbItems = [
  { text: '首页', to: '/' },
  { text: '剧本管理', to: '/scenarios' }
]

// 方法
const createNewScenario = () => {
  // 触发创建新剧本对话框
  // 这个逻辑将由 ScenarioList 组件处理
}

const handleScenarioCreated = (scenario: Scenario) => {
  ElMessage.success(`剧本 "${scenario.name}" 创建成功`)
  // 导航到编辑页面
  router.push(`/scenarios/${scenario.id}/edit`)
}

const handleScenarioSelected = (scenario: Scenario) => {
  // 导航到剧本详情页面
  router.push(`/scenarios/${scenario.id}`)
}

// 组件挂载时的初始化
onMounted(() => {
  // 设置页面标题
  document.title = '剧本管理 - TavernAI Plus'
})
</script>

<style scoped>
.scenario-management {
  @apply min-h-screen bg-gray-50;
}

.management-content {
  @apply container mx-auto px-4 py-6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-content {
    @apply px-2 py-4;
  }
}
</style>