<template>
  <div class="scenario-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="gradient-title">剧本管理</h1>
          <p class="subtitle">创建和管理您的世界信息剧本</p>
        </div>
        <div class="actions-section">
          <el-button
            type="primary"
            size="large"
            @click="createNewScenario"
          >
            <el-icon><Plus /></el-icon>
            创建剧本
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="management-content">
      <el-card class="scenario-container">
        <ScenarioList
          @scenario-created="handleScenarioCreated"
          @scenario-selected="handleScenarioSelected"
        />
      </el-card>
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

<style scoped lang="scss">
@import '@/styles/variables.scss';

.scenario-management {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--surface-0) 0%,
    var(--surface-1) 50%,
    var(--surface-2) 100%);
  padding: var(--spacing-comfortable);
}

.page-header {
  margin-bottom: var(--spacing-relaxed);

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--spacing-loose);

    .title-section {
      .gradient-title {
        font-size: var(--text-4xl);
        font-weight: var(--font-bold);
        background: var(--dt-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: var(--space-3);
      }

      .subtitle {
        font-size: var(--text-lg);
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .actions-section {
      flex-shrink: 0;
    }
  }
}

.management-content {
  max-width: 1200px;
  margin: 0 auto;

  .scenario-container {
    min-height: 400px;
    padding: var(--section-padding-y);
    background: var(--surface-1);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .scenario-management {
    padding: var(--spacing-normal);
  }

  .page-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-normal);

      .title-section {
        .gradient-title {
          font-size: var(--text-2xl);
        }
      }
    }
  }

  .management-content {
    .scenario-container {
      padding: var(--spacing-comfortable);
    }
  }
}
</style>