<template>
  <div class="scenario-edit">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <LoadingOverlay message="加载剧本编辑器中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="warning"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="loadScenario">
            重新加载
          </el-button>
          <el-button @click="goBack">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 编辑器界面 -->
    <div v-else-if="scenario" class="edit-container">
      <ScenarioEditor
        @back="goBack"
        @saved="handleSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ScenarioEditor from '@/components/scenario/ScenarioEditor.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario } from '@/types/scenario'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 计算属性
const {
  currentScenario: scenario,
  isLoading,
  error
} = scenarioStore

// 是否有未保存的更改
let hasUnsavedChanges = false

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (scenarioId) {
    await scenarioStore.fetchScenario(scenarioId)
  }
}

const goBack = () => {
  if (hasUnsavedChanges) {
    ElMessageBox.confirm(
      '您有未保存的更改，确定要离开吗？',
      '确认离开',
      {
        type: 'warning',
        confirmButtonText: '离开',
        cancelButtonText: '取消'
      }
    ).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.back()
  }
}

const handleSaved = (savedScenario: Scenario) => {
  hasUnsavedChanges = false
  ElMessage.success('剧本保存成功')

  // 更新页面标题
  document.title = `编辑 ${savedScenario.name} - TavernAI Plus`
}

// 监听编辑器状态变化
const handleEditorChange = () => {
  hasUnsavedChanges = true
}

// 路由守卫：离开前确认
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges) {
    ElMessageBox.confirm(
      '您有未保存的更改，确定要离开吗？',
      '确认离开',
      {
        type: 'warning',
        confirmButtonText: '离开',
        cancelButtonText: '取消'
      }
    ).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
})

// 页面离开前确认
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// 组件挂载时的初始化
onMounted(async () => {
  await loadScenario()

  // 设置页面标题
  if (scenario && scenario.value && scenario.value.name) {
    document.title = `编辑 ${scenario.value.name} - TavernAI Plus`
  }

  // 监听页面离开事件
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 组件卸载时的清理
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.scenario-edit {
  @apply h-screen bg-gray-50;
}

.loading-container,
.error-container {
  @apply flex items-center justify-center h-screen;
}

.edit-container {
  @apply h-full;
}

/* 确保编辑器占满整个页面 */
:deep(.scenario-editor) {
  @apply h-full;
}
</style>