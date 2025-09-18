<template>
  <div class="model-selector">
    <el-select
      v-model="selectedModel"
      placeholder="选择AI模型"
      :loading="loading"
      @change="handleModelChange"
      class="w-full"
    >
      <el-option-group
        v-for="group in groupedModels"
        :key="group.provider"
        :label="group.label"
      >
        <el-option
          v-for="model in group.models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
          :disabled="!model.available"
        >
          <div class="flex justify-between items-center w-full">
            <div class="flex items-center">
              <span>{{ model.name }}</span>
              <el-tag
                v-if="!model.available"
                type="danger"
                size="small"
                class="ml-2"
              >
                不可用
              </el-tag>
              <el-tag
                v-else-if="model.recommended"
                type="success"
                size="small"
                class="ml-2"
              >
                推荐
              </el-tag>
            </div>
            <div class="text-xs text-gray-400">
              <span v-if="model.pricePer1k">¥{{ model.pricePer1k }}/1k tokens</span>
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ model.description }}
          </div>
        </el-option>
      </el-option-group>
    </el-select>

    <!-- 模型详情卡片 -->
    <el-card
      v-if="selectedModelInfo && showDetails"
      class="mt-4"
      shadow="hover"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">{{ selectedModelInfo.name }}</span>
          <el-button
            type="text"
            @click="showDetails = false"
            :icon="Close"
          />
        </div>
      </template>

      <div class="space-y-3">
        <div>
          <span class="font-medium">描述：</span>
          <p class="text-gray-600">{{ selectedModelInfo.description }}</p>
        </div>

        <div>
          <span class="font-medium">特性：</span>
          <div class="flex flex-wrap gap-1 mt-1">
            <el-tag
              v-for="feature in selectedModelInfo.features"
              :key="feature"
              size="small"
              type="info"
            >
              {{ feature }}
            </el-tag>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium">最大Token：</span>
            <span class="text-gray-600">{{ selectedModelInfo.maxTokens?.toLocaleString() }}</span>
          </div>
          <div>
            <span class="font-medium">提供商：</span>
            <span class="text-gray-600">{{ selectedModelInfo.provider }}</span>
          </div>
        </div>

        <div v-if="selectedModelInfo.pricePer1k" class="bg-gray-50 p-2 rounded">
          <span class="font-medium">价格：</span>
          <span class="text-green-600">¥{{ selectedModelInfo.pricePer1k }}/1k tokens</span>
        </div>
      </div>
    </el-card>

    <!-- 快速操作按钮 -->
    <div class="flex justify-between items-center mt-4">
      <div class="flex space-x-2">
        <el-button
          size="small"
          @click="refreshModels"
          :loading="loading"
          :icon="Refresh"
        >
          刷新列表
        </el-button>
        <el-button
          size="small"
          @click="validateModels"
          :loading="validating"
          :icon="Connection"
        >
          验证可用性
        </el-button>
      </div>

      <el-button
        v-if="selectedModelInfo && !showDetails"
        type="text"
        size="small"
        @click="showDetails = true"
        :icon="InfoFilled"
      >
        查看详情
      </el-button>
    </div>

    <!-- 验证结果提示 -->
    <div v-if="validationResults.length > 0" class="mt-4">
      <div class="text-sm font-medium mb-2">验证结果：</div>
      <div class="space-y-1">
        <div
          v-for="result in validationResults"
          :key="result.id"
          class="flex justify-between items-center text-sm"
        >
          <span>{{ result.name }}</span>
          <el-tag
            :type="result.available ? 'success' : 'danger'"
            size="small"
          >
            {{ result.available ? '可用' : '不可用' }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Refresh, Connection, InfoFilled } from '@element-plus/icons-vue'
import { api } from '@/services/api'

interface ModelConfig {
  id: string
  name: string
  provider: string
  maxTokens: number
  temperature: number
  description: string
  features: string[]
  pricePer1k?: number
  available?: boolean
  recommended?: boolean
}

interface ValidationResult {
  id: string
  name: string
  available: boolean
  error?: string
  validatedAt: string
}

const props = defineProps<{
  modelValue?: string
  showDetails?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [model: ModelConfig]
}>()

// 响应式数据
const selectedModel = ref<string>(props.modelValue || '')
const models = ref<ModelConfig[]>([])
const loading = ref(false)
const validating = ref(false)
const showDetails = ref(props.showDetails || false)
const validationResults = ref<ValidationResult[]>([])

// 计算属性
const selectedModelInfo = computed(() => {
  return models.value.find(m => m.id === selectedModel.value)
})

const groupedModels = computed(() => {
  const groups: Record<string, ModelConfig[]> = {}

  models.value.forEach(model => {
    const provider = model.provider
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model)
  })

  return Object.entries(groups).map(([provider, models]) => ({
    provider,
    label: getProviderLabel(provider),
    models: models.sort((a, b) => {
      // 推荐模型排前面，然后按可用性，最后按价格
      if (a.recommended !== b.recommended) {
        return b.recommended ? 1 : -1
      }
      if (a.available !== b.available) {
        return b.available ? 1 : -1
      }
      return (a.pricePer1k || 0) - (b.pricePer1k || 0)
    })
  }))
})

// 方法
const getProviderLabel = (provider: string): string => {
  const labels: Record<string, string> = {
    'newapi': 'NewAPI 统一接口',
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'xai': 'xAI'
  }
  return labels[provider] || provider
}

const handleModelChange = (value: string) => {
  emit('update:modelValue', value)
  const model = models.value.find(m => m.id === value)
  if (model) {
    emit('change', model)
    ElMessage.success(`已切换到 ${model.name}`)
  }
}

const refreshModels = async () => {
  loading.value = true
  try {
    const response = await api.get('/api/models')
    if (response.data.success) {
      models.value = response.data.data.map((model: ModelConfig) => ({
        ...model,
        available: true,
        recommended: ['grok-3', 'gpt-4'].includes(model.id)
      }))

      // 如果当前选择的模型不在列表中，选择第一个推荐的
      if (!selectedModel.value || !models.value.find(m => m.id === selectedModel.value)) {
        const recommendedModel = models.value.find(m => m.recommended) || models.value[0]
        if (recommendedModel) {
          selectedModel.value = recommendedModel.id
          handleModelChange(recommendedModel.id)
        }
      }
    }
  } catch (error: any) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取模型列表失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const validateModels = async () => {
  validating.value = true
  validationResults.value = []

  try {
    const response = await api.post('/api/models/validate')
    if (response.data.success) {
      validationResults.value = response.data.data

      // 更新模型可用状态
      models.value = models.value.map(model => {
        const result = validationResults.value.find(r => r.id === model.id)
        return {
          ...model,
          available: result?.available ?? model.available
        }
      })

      const availableCount = validationResults.value.filter(r => r.available).length
      ElMessage.success(`验证完成，${availableCount}/${validationResults.value.length} 个模型可用`)

      // 如果当前选择的模型不可用，自动切换到可用的推荐模型
      const currentModel = models.value.find(m => m.id === selectedModel.value)
      if (currentModel && !currentModel.available) {
        const availableModel = models.value.find(m => m.available && m.recommended) ||
                              models.value.find(m => m.available)
        if (availableModel) {
          selectedModel.value = availableModel.id
          handleModelChange(availableModel.id)
          ElMessage.info(`当前模型不可用，已自动切换到 ${availableModel.name}`)
        }
      }
    }
  } catch (error: any) {
    console.error('验证模型失败:', error)
    ElMessage.error('验证模型失败: ' + (error.response?.data?.message || error.message))
  } finally {
    validating.value = false
  }
}

// 监听外部传入的模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedModel.value) {
    selectedModel.value = newValue
  }
})

// 生命周期
onMounted(() => {
  refreshModels()
})
</script>

<style scoped>
.model-selector {
  @apply w-full;
}

:deep(.el-select-dropdown__item) {
  height: auto !important;
  padding: 12px 20px !important;
}

:deep(.el-select-group__title) {
  @apply font-bold text-gray-700;
}
</style>
