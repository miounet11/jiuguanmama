<template>
  <div class="scenario-selector">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        剧本关联
      </h3>
      <el-button
        type="primary"
        :icon="Plus"
        size="small"
        @click="showAddDialog = true"
        :disabled="loading"
      >
        添加剧本
      </el-button>
    </div>

    <!-- 已关联剧本列表 -->
    <div v-if="associatedScenarios.length > 0" class="space-y-3">
      <div
        v-for="association in associatedScenarios"
        :key="association.id"
        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ association.scenario.name }}
              </h4>
              <el-tag v-if="association.isDefault" type="success" size="small">
                默认剧本
              </el-tag>
              <el-tag v-if="!association.isActive" type="info" size="small">
                已禁用
              </el-tag>
              <el-tag :type="getCategoryTagType(association.scenario.category)" size="small">
                {{ association.scenario.category }}
              </el-tag>
            </div>

            <p v-if="association.scenario.description"
               class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {{ association.scenario.description }}
            </p>

            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>评分: {{ association.scenario.rating.toFixed(1) }}</span>
              <span>使用: {{ association.scenario.useCount }}次</span>
              <span>创建者: {{ association.scenario.creator.username }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <el-dropdown @command="handleAction">
              <el-button type="text" :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="`setDefault:${association.scenarioId}`"
                    :disabled="association.isDefault"
                  >
                    设为默认
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="`toggle:${association.scenarioId}`"
                  >
                    {{ association.isActive ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="`edit:${association.scenarioId}`"
                  >
                    编辑设置
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="`remove:${association.scenarioId}`"
                    divided
                  >
                    移除关联
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-8">
      <div class="text-gray-400 mb-4">
        <el-icon :size="48"><Document /></el-icon>
      </div>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        还没有关联任何剧本
      </p>
      <p class="text-sm text-gray-400 dark:text-gray-500">
        剧本可以为角色提供世界观设定和背景知识
      </p>
    </div>

    <!-- 添加剧本对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加剧本关联"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <!-- 搜索和筛选 -->
        <div class="flex gap-3">
          <el-input
            v-model="searchQuery"
            placeholder="搜索剧本..."
            :prefix-icon="Search"
            clearable
            @input="debouncedSearch"
          />
          <el-select
            v-model="filterCategory"
            placeholder="分类筛选"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="通用" value="通用" />
            <el-option label="奇幻" value="奇幻" />
            <el-option label="科幻" value="科幻" />
            <el-option label="现代" value="现代" />
            <el-option label="历史" value="历史" />
            <el-option label="全局" value="全局" />
          </el-select>
        </div>

        <!-- 剧本列表 -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loadingScenarios" class="text-center py-8">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p class="text-gray-500 mt-2">加载剧本中...</p>
          </div>

          <div v-else-if="filteredAvailableScenarios.length === 0" class="text-center py-8">
            <p class="text-gray-500">没有找到可用的剧本</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="scenario in filteredAvailableScenarios"
              :key="scenario.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              :class="{ 'ring-2 ring-blue-500': selectedScenario?.id === scenario.id }"
              @click="selectedScenario = scenario"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {{ scenario.name }}
                    </h4>
                    <el-tag :type="getCategoryTagType(scenario.category)" size="small">
                      {{ scenario.category }}
                    </el-tag>
                    <el-tag v-if="!scenario.isPublic" type="warning" size="small">
                      私有
                    </el-tag>
                  </div>

                  <p v-if="scenario.description"
                     class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {{ scenario.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>评分: {{ scenario.rating.toFixed(1) }}</span>
                    <span>使用: {{ scenario.useCount }}次</span>
                    <span>创建者: {{ scenario.creator.username }}</span>
                  </div>
                </div>

                <el-radio
                  :model-value="selectedScenario?.id"
                  :label="scenario.id"
                  @change="selectedScenario = scenario"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 关联设置 -->
        <div v-if="selectedScenario" class="border-t pt-4">
          <h4 class="font-medium mb-3">关联设置</h4>
          <div class="grid grid-cols-2 gap-4">
            <el-checkbox v-model="associationSettings.isDefault">
              设为默认剧本
            </el-checkbox>
            <el-checkbox v-model="associationSettings.isActive">
              立即启用
            </el-checkbox>
          </div>

          <div v-if="associationSettings.isDefault" class="mt-2">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                默认剧本将在创建新对话时自动加载
              </template>
            </el-alert>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showAddDialog = false">
            取消
          </el-button>
          <el-button
            type="primary"
            :disabled="!selectedScenario"
            :loading="associating"
            @click="associateScenario"
          >
            关联剧本
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑设置对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑关联设置"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="editingAssociation" class="space-y-4">
        <div>
          <h4 class="font-medium mb-2">{{ editingAssociation.scenario.name }}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ editingAssociation.scenario.description }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-checkbox v-model="editSettings.isDefault">
            设为默认剧本
          </el-checkbox>
          <el-checkbox v-model="editSettings.isActive">
            启用剧本
          </el-checkbox>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showEditDialog = false">
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="updating"
            @click="updateAssociation"
          >
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, More, Search, Loading, Document } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'

interface Scenario {
  id: string
  name: string
  description: string
  category: string
  isPublic: boolean
  rating: number
  useCount: number
  creator: {
    id: string
    username: string
  }
}

interface Association {
  id: string
  scenarioId: string
  isDefault: boolean
  isActive: boolean
  customSettings: any
  createdAt: string
  scenario: Scenario
}

const props = defineProps<{
  characterId: string
}>()

const emit = defineEmits<{
  updated: []
}>()

// 状态管理
const loading = ref(false)
const loadingScenarios = ref(false)
const associating = ref(false)
const updating = ref(false)

// 已关联剧本
const associatedScenarios = ref<Association[]>([])

// 可用剧本
const availableScenarios = ref<Scenario[]>([])
const searchQuery = ref('')
const filterCategory = ref('')

// 对话框状态
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const selectedScenario = ref<Scenario | null>(null)
const editingAssociation = ref<Association | null>(null)

// 关联设置
const associationSettings = ref({
  isDefault: false,
  isActive: true
})

const editSettings = ref({
  isDefault: false,
  isActive: true
})

// 计算属性
const filteredAvailableScenarios = computed(() => {
  let scenarios = availableScenarios.value.filter(s =>
    !associatedScenarios.value.some(a => a.scenarioId === s.id)
  )

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    scenarios = scenarios.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    )
  }

  if (filterCategory.value) {
    scenarios = scenarios.filter(s => s.category === filterCategory.value)
  }

  return scenarios
})

// 搜索防抖
const debouncedSearch = debounce(() => {
  // 搜索逻辑已在 computed 中处理
}, 300)

// 生命周期
onMounted(() => {
  loadAssociatedScenarios()
})

watch(() => showAddDialog.value, (show) => {
  if (show) {
    loadAvailableScenarios()
    selectedScenario.value = null
    associationSettings.value = {
      isDefault: false,
      isActive: true
    }
  }
})

// 方法
async function loadAssociatedScenarios() {
  loading.value = true
  try {
    const response = await fetch(`/api/characters/${props.characterId}/scenarios`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      associatedScenarios.value = data.scenarios
    }
  } catch (error) {
    console.error('加载关联剧本失败:', error)
    ElMessage.error('加载关联剧本失败')
  } finally {
    loading.value = false
  }
}

async function loadAvailableScenarios() {
  loadingScenarios.value = true
  try {
    const response = await fetch('/api/scenarios', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      availableScenarios.value = data.scenarios
    }
  } catch (error) {
    console.error('加载可用剧本失败:', error)
    ElMessage.error('加载可用剧本失败')
  } finally {
    loadingScenarios.value = false
  }
}

async function associateScenario() {
  if (!selectedScenario.value) return

  associating.value = true
  try {
    const response = await fetch(`/api/characters/${props.characterId}/scenarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        scenarioId: selectedScenario.value.id,
        isDefault: associationSettings.value.isDefault,
        isActive: associationSettings.value.isActive
      })
    })

    if (response.ok) {
      ElMessage.success('剧本关联成功')
      showAddDialog.value = false
      await loadAssociatedScenarios()
      emit('updated')
    } else {
      const error = await response.json()
      ElMessage.error(error.message || '关联剧本失败')
    }
  } catch (error) {
    console.error('关联剧本失败:', error)
    ElMessage.error('关联剧本失败')
  } finally {
    associating.value = false
  }
}

async function handleAction(command: string) {
  const [action, scenarioId] = command.split(':')

  switch (action) {
    case 'setDefault':
      await updateAssociationSettings(scenarioId, { isDefault: true })
      break
    case 'toggle':
      const association = associatedScenarios.value.find(a => a.scenarioId === scenarioId)
      if (association) {
        await updateAssociationSettings(scenarioId, { isActive: !association.isActive })
      }
      break
    case 'edit':
      editAssociation(scenarioId)
      break
    case 'remove':
      await removeAssociation(scenarioId)
      break
  }
}

function editAssociation(scenarioId: string) {
  const association = associatedScenarios.value.find(a => a.scenarioId === scenarioId)
  if (association) {
    editingAssociation.value = association
    editSettings.value = {
      isDefault: association.isDefault,
      isActive: association.isActive
    }
    showEditDialog.value = true
  }
}

async function updateAssociation() {
  if (!editingAssociation.value) return

  updating.value = true
  try {
    const response = await fetch(
      `/api/characters/${props.characterId}/scenarios/${editingAssociation.value.scenarioId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editSettings.value)
      }
    )

    if (response.ok) {
      ElMessage.success('设置更新成功')
      showEditDialog.value = false
      await loadAssociatedScenarios()
      emit('updated')
    } else {
      const error = await response.json()
      ElMessage.error(error.message || '更新设置失败')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    ElMessage.error('更新设置失败')
  } finally {
    updating.value = false
  }
}

async function updateAssociationSettings(scenarioId: string, settings: any) {
  try {
    const response = await fetch(
      `/api/characters/${props.characterId}/scenarios/${scenarioId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      }
    )

    if (response.ok) {
      ElMessage.success('设置更新成功')
      await loadAssociatedScenarios()
      emit('updated')
    } else {
      const error = await response.json()
      ElMessage.error(error.message || '更新设置失败')
    }
  } catch (error) {
    console.error('更新设置失败:', error)
    ElMessage.error('更新设置失败')
  }
}

async function removeAssociation(scenarioId: string) {
  try {
    const response = await fetch(
      `/api/characters/${props.characterId}/scenarios/${scenarioId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    )

    if (response.ok) {
      ElMessage.success('剧本关联已移除')
      await loadAssociatedScenarios()
      emit('updated')
    } else {
      const error = await response.json()
      ElMessage.error(error.message || '移除关联失败')
    }
  } catch (error) {
    console.error('移除关联失败:', error)
    ElMessage.error('移除关联失败')
  }
}

function getCategoryTagType(category: string): string {
  const typeMap: Record<string, string> = {
    '通用': '',
    '奇幻': 'success',
    '科幻': 'info',
    '现代': 'warning',
    '历史': 'danger',
    '全局': 'success'
  }
  return typeMap[category] || ''
}
</script>

<style scoped>
.scenario-selector {
  @apply w-full;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>