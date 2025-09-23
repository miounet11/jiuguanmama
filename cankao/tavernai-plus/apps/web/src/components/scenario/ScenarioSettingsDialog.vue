<template>
  <el-dialog
    v-model="dialogVisible"
    title="剧本设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <!-- 基本设置 -->
      <div class="settings-section mb-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">基本设置</h4>

        <el-form-item label="剧本名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="输入剧本名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="输入剧本描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="分类" prop="category">
            <el-select
              v-model="formData.category"
              placeholder="选择分类"
              filterable
              allow-create
            >
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="语言" prop="language">
            <el-select v-model="formData.language" placeholder="选择语言">
              <el-option label="中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
              <el-option label="日本語" value="ja-JP" />
              <el-option label="한국어" value="ko-KR" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="可见性">
          <el-radio-group v-model="formData.isPublic">
            <el-radio :label="true">公开 - 其他用户可以查看和使用</el-radio>
            <el-radio :label="false">私有 - 仅自己可见</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <!-- 高级设置 -->
      <div class="settings-section mb-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">高级设置</h4>

        <el-form-item label="剧本内容">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="输入剧本的背景设定或说明"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :loading="isSaving"
        >
          保存设置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario, UpdateScenarioRequest } from '@/types/scenario'

interface Props {
  modelValue: boolean
  scenario?: Scenario | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', scenario: Scenario): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const formRef = ref<FormInstance>()
const isSaving = ref(false)

// 表单数据
const formData = reactive<UpdateScenarioRequest>({
  name: '',
  description: '',
  category: '',
  language: 'zh-CN',
  isPublic: true,
  content: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入剧本名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度应在 1-100 字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  language: [
    { required: true, message: '请选择语言', trigger: 'change' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const categories = computed(() => scenarioStore.categories)

// 方法
const initFormData = () => {
  if (props.scenario) {
    formData.name = props.scenario.name
    formData.description = props.scenario.description || ''
    formData.category = props.scenario.category
    formData.language = props.scenario.language
    formData.isPublic = props.scenario.isPublic
    formData.content = props.scenario.content || ''
  }
}

const handleSave = async () => {
  if (!formRef.value || !props.scenario) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    isSaving.value = true

    const updatedScenario = await scenarioStore.updateScenario(
      props.scenario.id,
      formData
    )

    emit('updated', updatedScenario)
    emit('update:modelValue', false)
    ElMessage.success('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

// 监听对话框打开状态
watch(dialogVisible, (newValue) => {
  if (newValue && props.scenario) {
    initFormData()
  }
})

// 监听scenario变化
watch(() => props.scenario, () => {
  if (dialogVisible.value && props.scenario) {
    initFormData()
  }
})
</script>

<style scoped>
.settings-section {
  @apply border-b border-gray-100 pb-6;
}

.settings-section:last-child {
  @apply border-b-0 pb-0;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* 表单样式 */
:deep(.el-form-item__label) {
  @apply font-medium text-gray-700;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  @apply flex flex-col gap-2;
}

:deep(.el-radio) {
  @apply mr-0;
}

/* 对话框样式 */
:deep(.el-dialog) {
  @apply rounded-lg overflow-hidden;
}

:deep(.el-dialog__header) {
  @apply bg-gray-50 border-b border-gray-200;
}

:deep(.el-dialog__footer) {
  @apply bg-gray-50 border-t border-gray-200;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .grid.grid-cols-2 {
    @apply grid-cols-1;
  }
}
</style>