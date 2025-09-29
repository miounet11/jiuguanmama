<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建新剧本"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      label-position="top"
    >
      <!-- 剧本名称 -->
      <el-form-item label="剧本名称" prop="name" required>
        <el-input
          v-model="formData.name"
          placeholder="请输入剧本名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <!-- 剧本描述 -->
      <el-form-item label="剧本描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入剧本描述（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- 分类和语言 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="选择分类"
            filterable
            allow-create
            default-first-option
            class="w-full"
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
          <el-select v-model="formData.language" placeholder="选择语言" class="w-full">
            <el-option label="中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
            <el-option label="日本語" value="ja-JP" />
            <el-option label="한국어" value="ko-KR" />
          </el-select>
        </el-form-item>
      </div>

      <!-- 标签 -->
      <el-form-item label="标签" prop="tags">
        <div class="w-full">
          <!-- 已选标签 -->
          <div v-if="formData.tags.length > 0" class="flex flex-wrap gap-2 mb-2">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="cursor-pointer"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- 输入新标签 -->
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            size="small"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
            placeholder="输入标签名称"
            class="w-24"
          />
          <el-button
            v-else
            size="small"
            @click="showInput"
            :icon="'Plus'"
            class="border-dashed"
          >
            添加标签
          </el-button>

          <!-- 推荐标签 -->
          <div v-if="recommendedTags.length > 0" class="mt-2">
            <div class="text-xs text-gray-500 mb-1">推荐标签:</div>
            <div class="flex flex-wrap gap-1">
              <el-tag
                v-for="tag in recommendedTags"
                :key="tag"
                size="small"
                effect="plain"
                class="cursor-pointer"
                @click="addRecommendedTag(tag)"
              >
                + {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 高级选项 -->
      <el-collapse>
        <el-collapse-item title="高级选项" name="advanced">
          <!-- 剧本内容 -->
          <el-form-item label="剧本内容" prop="content">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="6"
              placeholder="可选：输入剧本的背景设定或说明"
              maxlength="2000"
              show-word-limit
            />
          </el-form-item>

          <!-- 公开设置 -->
          <el-form-item label="可见性设置">
            <el-radio-group v-model="formData.isPublic">
              <el-radio :label="true">
                <div class="flex items-center gap-2">
                  <el-icon><View /></el-icon>
                  <span>公开</span>
                </div>
                <div class="text-xs text-gray-500 ml-6">其他用户可以浏览和使用</div>
              </el-radio>
              <el-radio :label="false">
                <div class="flex items-center gap-2">
                  <el-icon><Hide /></el-icon>
                  <span>私有</span>
                </div>
                <div class="text-xs text-gray-500 ml-6">仅自己可见和使用</div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-collapse-item>

        <!-- 时空属性 -->
        <el-collapse-item title="时空属性" name="spacetime">
          <div class="space-y-6">
            <!-- 时空酒馆分部设置 -->
            <div class="spacetime-hub-section">
              <h3 class="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clip-rule="evenodd"/>
                </svg>
                时空酒馆分部
              </h3>

              <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 mb-4">
                <div class="flex items-center gap-3 mb-3">
                  <el-switch
                    v-model="formData.spacetimeHubEnabled"
                    active-text="启用时空酒馆分部"
                    inactive-text="普通剧本"
                  />
                  <el-tag
                    v-if="formData.spacetimeHubEnabled"
                    type="primary"
                    class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0"
                  >
                    🏰 时空酒馆分部
                  </el-tag>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  💡 启用时空酒馆分部后，此剧本将成为时空交汇的核心场所，支持跨时代角色的深度互动。
                </p>
              </div>

              <!-- 时空属性配置 -->
              <div v-if="formData.spacetimeHubEnabled">
                <el-form-item label="时空属性">
                  <el-select
                    v-model="formData.spacetimeHub.spacetimeAttributes"
                    multiple
                    filterable
                    allow-create
                    placeholder="选择或输入时空属性"
                    class="w-full"
                  >
                    <el-option-group label="基础时空属性">
                      <el-option label="魔力共鸣" value="魔力共鸣" />
                      <el-option label="时光回溯" value="时光回溯" />
                      <el-option label="空间扭曲" value="空间扭曲" />
                      <el-option label="能量潮汐" value="能量潮汐" />
                      <el-option label="意识链接" value="意识链接" />
                    </el-option-group>
                    <el-option-group label="高级时空属性">
                      <el-option label="维度穿越" value="维度穿越" />
                      <el-option label="命运交织" value="命运交织" />
                      <el-option label="灵魂绑定" value="灵魂绑定" />
                      <el-option label="时空裂隙" value="时空裂隙" />
                      <el-option label="永恒循环" value="永恒循环" />
                      <el-option label="因果律变" value="因果律变" />
                      <el-option label="平行宇宙" value="平行宇宙" />
                    </el-option-group>
                    <el-option-group label="特殊时空属性">
                      <el-option label="时间加速" value="时间加速" />
                      <el-option label="空间压缩" value="空间压缩" />
                      <el-option label="现实重塑" value="现实重塑" />
                      <el-option label="记忆回廊" value="记忆回廊" />
                    </el-option-group>
                  </el-select>
                  <div class="text-xs text-gray-500 mt-1">
                    这些属性将影响时空酒馆的特殊事件触发和角色适应机制
                  </div>
                </el-form-item>

                <!-- 时空布局 -->
                <el-form-item label="空间布局">
                  <el-input
                    v-model="formData.spacetimeHub.spacetimeLayout"
                    type="textarea"
                    :rows="3"
                    placeholder="描述时空酒馆的空间布局和建筑特色"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <!-- 融合机制 -->
                <el-form-item label="融合机制">
                  <el-input
                    v-model="formData.spacetimeHub.fusionMechanisms"
                    type="textarea"
                    :rows="3"
                    placeholder="描述不同时空角色的融合和适应机制"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <!-- 剧情阶段 -->
                <el-form-item label="剧情阶段">
                  <el-input
                    v-model="formData.spacetimeHub.plotPhases"
                    type="textarea"
                    :rows="3"
                    placeholder="描述剧情发展阶段（适应→冲突→融合→传承）"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
              </div>
            </div>

            <!-- 增强游戏化设置 -->
            <div class="gameplay-section">
              <h3 class="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 011 1h2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
                </svg>
                游戏化增强
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 游戏类型 -->
                <el-form-item label="游戏类型">
                  <el-select
                    v-model="formData.genre"
                    placeholder="选择游戏类型"
                    clearable
                    class="w-full"
                  >
                    <el-option label="奇幻 Fantasy" value="fantasy" />
                    <el-option label="科幻 Sci-Fi" value="scifi" />
                    <el-option label="现代 Modern" value="modern" />
                    <el-option label="历史 Historical" value="historical" />
                    <el-option label="恐怖 Horror" value="horror" />
                    <el-option label="浪漫 Romance" value="romance" />
                    <el-option label="推理 Mystery" value="mystery" />
                    <el-option label="冒险 Adventure" value="adventure" />
                  </el-select>
                </el-form-item>

                <!-- 复杂度 -->
                <el-form-item label="复杂度">
                  <el-select
                    v-model="formData.complexity"
                    placeholder="选择复杂度"
                    clearable
                    class="w-full"
                  >
                    <el-option label="简单 Simple" value="simple" />
                    <el-option label="中等 Moderate" value="moderate" />
                    <el-option label="复杂 Complex" value="complex" />
                    <el-option label="史诗 Epic" value="epic" />
                  </el-select>
                </el-form-item>

                <!-- 内容分级 -->
                <el-form-item label="内容分级">
                  <el-select
                    v-model="formData.contentRating"
                    placeholder="选择内容分级"
                    clearable
                    class="w-full"
                  >
                    <el-option label="通用 General" value="general" />
                    <el-option label="青少年 Teen" value="teen" />
                    <el-option label="成熟 Mature" value="mature" />
                    <el-option label="成人 Adult" value="adult" />
                  </el-select>
                </el-form-item>

                <!-- 世界范围 -->
                <el-form-item label="世界范围">
                  <el-select
                    v-model="formData.worldScope"
                    placeholder="选择世界范围"
                    clearable
                    class="w-full"
                  >
                    <el-option label="本地 Local" value="local" />
                    <el-option label="区域 Regional" value="regional" />
                    <el-option label="大陆 Continental" value="continental" />
                    <el-option label="全球 Global" value="global" />
                    <el-option label="多元宇宙 Multiverse" value="multiverse" />
                  </el-select>
                </el-form-item>

                <!-- 时间范围 -->
                <el-form-item label="时间范围">
                  <el-select
                    v-model="formData.timelineScope"
                    placeholder="选择时间范围"
                    clearable
                    class="w-full"
                  >
                    <el-option label="单事件 Single Event" value="single_event" />
                    <el-option label="短期 Short Term" value="short_term" />
                    <el-option label="中期 Medium Term" value="medium_term" />
                    <el-option label="长期 Long Term" value="long_term" />
                    <el-option label="永恒 Eternal" value="eternal" />
                  </el-select>
                </el-form-item>

                <!-- 玩家数量 -->
                <el-form-item label="玩家数量">
                  <el-input-number
                    v-model="formData.playerCount"
                    :min="1"
                    :max="20"
                    placeholder="推荐玩家数量"
                    class="w-full"
                  />
                </el-form-item>

                <!-- 预计时长 -->
                <el-form-item label="预计时长(分钟)">
                  <el-input-number
                    v-model="formData.estimatedDuration"
                    :min="10"
                    :max="1000"
                    :step="10"
                    placeholder="预计游戏时长"
                    class="w-full"
                  />
                </el-form-item>
              </div>

              <!-- 世界设定 -->
              <el-form-item label="详细世界设定">
                <el-input
                  v-model="formData.worldSetting"
                  type="textarea"
                  :rows="4"
                  placeholder="详细描述世界的背景、规则和社会结构"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="isSubmitting"
        >
          创建剧本
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { View, Hide, Plus } from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import type { CreateScenarioRequest, Scenario } from '@/types/scenario'

interface Props {
  modelValue: boolean
  categories?: string[]
  recommendedTags?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', scenario: Scenario): void
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => ['通用', '奇幻', '科幻', '现代', '历史', '恐怖', '喜剧', '浪漫'],
  recommendedTags: () => ['冒险', '悬疑', '推理', '战斗', '魔法', '科技', '日常', '学校']
})

const emit = defineEmits<Emits>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const formRef = ref<FormInstance>()
const inputRef = ref()
const isSubmitting = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

// 表单数据
const formData = reactive({
  // 基础字段
  name: '',
  description: '',
  content: '',
  isPublic: true,
  tags: [] as string[],
  category: '通用',
  language: 'zh-CN',

  // 时空酒馆扩展字段
  spacetimeHubEnabled: false,
  spacetimeHub: {
    spacetimeAttributes: [] as string[],
    spacetimeLayout: '',
    fusionMechanisms: '',
    plotPhases: ''
  },

  // 增强游戏化字段
  genre: '',
  complexity: '',
  contentRating: '',
  worldScope: '',
  timelineScope: '',
  playerCount: undefined as number | undefined,
  estimatedDuration: undefined as number | undefined,
  worldSetting: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入剧本名称', trigger: 'blur' },
    { min: 1, max: 100, message: '剧本名称长度应在 1-100 字符之间', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述长度不能超过 500 字符', trigger: 'blur' }
  ],
  content: [
    { max: 2000, message: '内容长度不能超过 2000 字符', trigger: 'blur' }
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

const categories = computed(() => {
  const storeCategories = scenarioStore.categories
  const propCategories = props.categories
  return [...new Set([...propCategories, ...storeCategories])]
})

// 方法
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  const value = inputValue.value.trim()
  if (value && !formData.tags.includes(value)) {
    if (formData.tags.length >= 10) {
      ElMessage.warning('最多只能添加 10 个标签')
      return
    }
    formData.tags.push(value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = formData.tags.indexOf(tag)
  if (index > -1) {
    formData.tags.splice(index, 1)
  }
}

const addRecommendedTag = (tag: string) => {
  if (!formData.tags.includes(tag)) {
    if (formData.tags.length >= 10) {
      ElMessage.warning('最多只能添加 10 个标签')
      return
    }
    formData.tags.push(tag)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    isSubmitting.value = true

    // 构建提交数据
    const submitData = {
      // 基础字段
      name: formData.name,
      description: formData.description,
      content: formData.content,
      isPublic: formData.isPublic,
      tags: formData.tags,
      category: formData.category,
      language: formData.language,

      // 时空酒馆扩展字段
      ...(formData.spacetimeHubEnabled && {
        spacetimeHub: {
          spacetimeAttributes: formData.spacetimeHub.spacetimeAttributes,
          spacetimeLayout: formData.spacetimeHub.spacetimeLayout,
          fusionMechanisms: formData.spacetimeHub.fusionMechanisms,
          plotPhases: formData.spacetimeHub.plotPhases
        }
      }),

      // 增强游戏化字段
      genre: formData.genre || undefined,
      complexity: formData.complexity || undefined,
      contentRating: formData.contentRating || undefined,
      worldScope: formData.worldScope || undefined,
      timelineScope: formData.timelineScope || undefined,
      playerCount: formData.playerCount || undefined,
      estimatedDuration: formData.estimatedDuration || undefined,
      worldSetting: formData.worldSetting || undefined
    }

    const scenario = await scenarioStore.createScenario(submitData)

    emit('created', scenario)
    handleClose()

    ElMessage.success('剧本创建成功')
  } catch (error) {
    console.error('创建剧本失败:', error)
    ElMessage.error('创建剧本失败')
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }

  // 重置自定义数据
  formData.tags = []
  inputVisible.value = false
  inputValue.value = ''
  isSubmitting.value = false

  // 重置时空属性
  formData.spacetimeHubEnabled = false
  formData.spacetimeHub = {
    spacetimeAttributes: [],
    spacetimeLayout: '',
    fusionMechanisms: '',
    plotPhases: ''
  }

  // 重置游戏化字段
  formData.genre = ''
  formData.complexity = ''
  formData.contentRating = ''
  formData.worldScope = ''
  formData.timelineScope = ''
  formData.playerCount = undefined
  formData.estimatedDuration = undefined
  formData.worldSetting = ''

  emit('update:modelValue', false)
}

// 监听对话框打开状态
watch(dialogVisible, (newValue) => {
  if (newValue) {
    // 加载分类数据
    if (scenarioStore.categories.length === 0) {
      scenarioStore.fetchCategories()
    }
  }
})
</script>

<style scoped>
/* 表单布局优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.el-textarea__inner) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 选择器样式 */
:deep(.el-select) {
  width: 100%;
}

/* 标签样式 */
:deep(.el-tag) {
  margin-right: 8px;
  margin-bottom: 4px;
}

:deep(.el-tag--small) {
  height: 24px;
  line-height: 22px;
  padding: 0 8px;
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  border: none;
  background: #f9fafb;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-collapse-item__header) {
  background: #f3f4f6;
  padding: 12px 16px;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-collapse-item__content) {
  padding: 16px;
  background: white;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.el-radio) {
  margin-right: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

:deep(.el-radio__label) {
  flex: 1;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

:deep(.el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.el-dialog__footer) {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  padding: 12px 20px;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 按钮样式 */
.border-dashed {
  border-style: dashed;
  border-color: #d1d5db;
}

.border-dashed:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* 加载状态 */
.el-button.is-loading {
  pointer-events: none;
}

/* 标签输入框特殊样式 */
.el-input.w-24 {
  width: 120px;
  display: inline-block;
}

/* 推荐标签样式 */
.cursor-pointer:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 无障碍优化 */
:deep(.el-radio__input:focus + .el-radio__label) {
  color: #2563eb;
}

:deep(.el-checkbox__input:focus + .el-checkbox__label) {
  color: #2563eb;
}
</style>