<template>
  <el-dialog
    v-model="dialogVisible"
    title="发布角色到市场"
    width="800px"
    :before-close="handleClose"
    class="publish-character-dialog"
    append-to-body
    destroy-on-close
  >
    <div class="publish-form">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" class="mb-8">
        <el-step title="选择角色" description="选择要发布的角色" />
        <el-step title="发布设置" description="配置发布信息" />
        <el-step title="预览确认" description="预览并确认发布" />
      </el-steps>

      <!-- 第一步：选择角色 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white mb-4">选择要发布的角色</h3>
          <p class="text-gray-400 mb-6">
            从你的角色库中选择一个角色发布到市场。只有完整配置的角色才能发布。
          </p>
        </div>

        <!-- 角色搜索 -->
        <el-input
          v-model="characterSearchQuery"
          placeholder="搜索你的角色..."
          size="large"
          clearable
          class="mb-6"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 角色列表 -->
        <div v-if="loadingCharacters" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="i in 4"
            :key="i"
            class="character-option-skeleton animate-pulse"
          >
            <div class="w-16 h-16 bg-gray-700 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-700 rounded w-3/4"></div>
              <div class="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <div v-else-if="filteredCharacters.length === 0" class="text-center py-8">
          <div class="text-4xl mb-4">🎭</div>
          <h3 class="text-lg font-semibold text-white mb-2">暂无可发布的角色</h3>
          <p class="text-gray-400 mb-4">请先创建一些角色，或者检查角色是否已经配置完整</p>
          <el-button type="primary" @click="$router.push('/studio')">
            去创建角色
          </el-button>
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="character in filteredCharacters"
            :key="character.id"
            class="character-option"
            :class="{ 'selected': selectedCharacter?.id === character.id }"
            @click="selectCharacter(character)"
          >
            <div class="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200">
              <!-- 角色头像 -->
              <div class="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex-shrink-0">
                <img
                  v-if="character.avatar"
                  :src="character.avatar"
                  :alt="character.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <span class="text-white text-xl font-bold">
                    {{ character.name.charAt(0).toUpperCase() }}
                  </span>
                </div>

                <!-- 选中标记 -->
                <div v-if="selectedCharacter?.id === character.id" class="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                  <el-icon class="text-white text-2xl"><Check /></el-icon>
                </div>
              </div>

              <!-- 角色信息 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-white font-medium truncate">{{ character.name }}</h4>
                  <div class="flex items-center gap-2">
                    <el-tag v-if="character.isPublic" type="success" size="small">已公开</el-tag>
                    <el-tag v-if="character.isNSFW" type="danger" size="small">18+</el-tag>
                  </div>
                </div>
                <p class="text-gray-400 text-sm line-clamp-2 mb-2">
                  {{ character.description || '暂无描述' }}
                </p>
                <div class="flex items-center gap-4 text-xs text-gray-500">
                  <span>评分: {{ character.rating.toFixed(1) }}</span>
                  <span>对话: {{ character.chatCount }}</span>
                  <span>更新: {{ formatDate(character.updatedAt) }}</span>
                </div>
              </div>

              <!-- 发布状态 -->
              <div class="flex-shrink-0">
                <el-icon v-if="character.publishedToMarket" class="text-green-400">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else class="text-gray-400">
                  <Plus />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二步：发布设置 -->
      <div v-else-if="currentStep === 1" class="step-content">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white mb-4">配置发布信息</h3>
          <p class="text-gray-400 mb-6">
            设置角色在市场中的展示信息，这些信息将帮助其他用户发现你的角色。
          </p>
        </div>

        <el-form
          ref="publishFormRef"
          :model="publishForm"
          :rules="publishRules"
          label-width="120px"
          class="publish-settings-form"
        >
          <!-- 分类选择 -->
          <el-form-item label="角色分类" prop="category">
            <el-select
              v-model="publishForm.category"
              placeholder="选择最适合的分类"
              size="large"
              class="w-full"
            >
              <el-option
                v-for="category in availableCategories"
                :key="category.value"
                :label="`${category.icon} ${category.label}`"
                :value="category.value"
              />
            </el-select>
          </el-form-item>

          <!-- 市场描述 -->
          <el-form-item label="市场描述" prop="marketDescription">
            <el-input
              v-model="publishForm.marketDescription"
              type="textarea"
              :rows="4"
              placeholder="为这个角色写一个吸引人的描述，让其他用户了解角色的特色和魅力..."
              maxlength="500"
              show-word-limit
              size="large"
            />
            <div class="text-xs text-gray-400 mt-2">
              * 这个描述将显示在市场中，建议突出角色的独特性和使用场景
            </div>
          </el-form-item>

          <!-- 标签设置 -->
          <el-form-item label="角色标签" prop="tags">
            <div class="w-full">
              <el-input
                v-model="tagInput"
                placeholder="输入标签后按回车添加"
                size="large"
                @keyup.enter="addTag"
                @blur="addTag"
              >
                <template #suffix>
                  <el-button @click="addTag" text type="primary" size="small">
                    添加
                  </el-button>
                </template>
              </el-input>

              <!-- 标签建议 -->
              <div class="mt-2 mb-3">
                <div class="text-sm text-gray-400 mb-2">建议标签:</div>
                <div class="flex flex-wrap gap-2">
                  <el-tag
                    v-for="suggestedTag in suggestedTags"
                    :key="suggestedTag"
                    class="cursor-pointer"
                    @click="addSuggestedTag(suggestedTag)"
                  >
                    + {{ suggestedTag }}
                  </el-tag>
                </div>
              </div>

              <!-- 已添加的标签 -->
              <div v-if="publishForm.tags.length > 0" class="mb-2">
                <div class="text-sm text-gray-400 mb-2">已添加标签 ({{ publishForm.tags.length }}/10):</div>
                <div class="flex flex-wrap gap-2">
                  <el-tag
                    v-for="tag in publishForm.tags"
                    :key="tag"
                    closable
                    type="primary"
                    @close="removeTag(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-form-item>

          <!-- 发布选项 -->
          <el-form-item label="发布选项">
            <div class="space-y-3">
              <el-checkbox v-model="publishForm.allowComments">
                允许其他用户评价和评论
              </el-checkbox>

              <el-checkbox v-model="publishForm.allowModification">
                允许其他用户基于此角色创建衍生版本
              </el-checkbox>

              <el-checkbox v-model="publishForm.featured">
                申请精选推荐 (需要审核)
              </el-checkbox>
            </div>
          </el-form-item>

          <!-- 内容警告 -->
          <el-form-item v-if="selectedCharacter?.isNSFW" label="内容警告">
            <el-alert
              title="18+ 内容警告"
              type="warning"
              description="该角色包含成人内容，将在市场中添加相应标识和访问限制"
              show-icon
              :closable="false"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 第三步：预览确认 -->
      <div v-else-if="currentStep === 2" class="step-content">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-white mb-4">预览发布内容</h3>
          <p class="text-gray-400 mb-6">
            请仔细检查以下信息，确认无误后即可发布到市场。
          </p>
        </div>

        <!-- 预览卡片 -->
        <div class="preview-card glass-card p-6 mb-6">
          <div class="flex gap-6">
            <!-- 角色头像 -->
            <div class="w-32 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex-shrink-0">
              <img
                v-if="selectedCharacter?.avatar"
                :src="selectedCharacter.avatar"
                :alt="selectedCharacter?.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                <span class="text-white text-3xl font-bold">
                  {{ selectedCharacter?.name.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- 角色信息 -->
            <div class="flex-1">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-2xl font-bold text-white">{{ selectedCharacter?.name }}</h3>
                <div class="flex gap-2">
                  <el-tag type="info">{{ publishForm.category }}</el-tag>
                  <el-tag v-if="selectedCharacter?.isNSFW" type="danger">18+</el-tag>
                  <el-tag v-if="publishForm.featured" type="warning">申请精选</el-tag>
                </div>
              </div>

              <p class="text-gray-300 mb-4 leading-relaxed">
                {{ publishForm.marketDescription }}
              </p>

              <!-- 标签 -->
              <div class="mb-4">
                <div class="text-sm text-gray-400 mb-2">标签:</div>
                <div class="flex flex-wrap gap-2">
                  <el-tag
                    v-for="tag in publishForm.tags"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>

              <!-- 发布选项 -->
              <div class="text-sm text-gray-400">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <el-icon :class="publishForm.allowComments ? 'text-green-400' : 'text-gray-500'">
                      <Check v-if="publishForm.allowComments" />
                      <Close v-else />
                    </el-icon>
                    允许评价
                  </span>
                  <span class="flex items-center gap-1">
                    <el-icon :class="publishForm.allowModification ? 'text-green-400' : 'text-gray-500'">
                      <Check v-if="publishForm.allowModification" />
                      <Close v-else />
                    </el-icon>
                    允许衍生
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 发布协议 -->
        <div class="agreement-section">
          <el-checkbox v-model="agreeToTerms" size="large">
            <span class="text-white">
              我已阅读并同意
              <el-button text type="primary" size="small" @click="showTermsDialog = true">
                《角色市场发布协议》
              </el-button>
              和
              <el-button text type="primary" size="small" @click="showPrivacyDialog = true">
                《隐私政策》
              </el-button>
            </span>
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer flex justify-between">
        <div>
          <el-button v-if="currentStep > 0" @click="previousStep" size="large">
            上一步
          </el-button>
        </div>

        <div class="flex gap-3">
          <el-button @click="handleClose" size="large">取消</el-button>

          <el-button
            v-if="currentStep < 2"
            @click="nextStep"
            type="primary"
            size="large"
            :disabled="!canProceed"
          >
            下一步
          </el-button>

          <el-button
            v-else
            @click="handlePublish"
            type="primary"
            size="large"
            :loading="publishing"
            :disabled="!canPublish"
          >
            <el-icon class="mr-2"><Upload /></el-icon>
            发布到市场
          </el-button>
        </div>
      </div>
    </template>

    <!-- 协议对话框 -->
    <el-dialog
      v-model="showTermsDialog"
      title="角色市场发布协议"
      width="600px"
      append-to-body
    >
      <div class="terms-content text-gray-300 max-h-96 overflow-y-auto">
        <h4 class="text-white font-semibold mb-3">1. 内容要求</h4>
        <p class="mb-4">发布的角色内容应当原创或经过授权，不得侵犯他人知识产权...</p>

        <h4 class="text-white font-semibold mb-3">2. 使用许可</h4>
        <p class="mb-4">发布到市场的角色将采用知识共享许可协议...</p>

        <h4 class="text-white font-semibold mb-3">3. 审核机制</h4>
        <p class="mb-4">所有发布的内容都将经过审核，违规内容将被下架...</p>

        <h4 class="text-white font-semibold mb-3">4. 责任声明</h4>
        <p class="mb-4">创作者对发布的内容承担相应责任...</p>
      </div>

      <template #footer>
        <el-button @click="showTermsDialog = false" type="primary">
          我已了解
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Search,
  Check,
  Close,
  Plus,
  CircleCheck,
  Upload
} from '@element-plus/icons-vue'
import type { Character } from '@/types/character'

interface Props {
  visible: boolean
}

interface Emits {
  'update:visible': [visible: boolean]
  'character-published': [character: Character]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const currentStep = ref(0)
const loadingCharacters = ref(false)
const publishing = ref(false)
const agreeToTerms = ref(false)
const showTermsDialog = ref(false)
const showPrivacyDialog = ref(false)

const characterSearchQuery = ref('')
const tagInput = ref('')
const selectedCharacter = ref<Character | null>(null)
const userCharacters = ref<Character[]>([])

const publishFormRef = ref<FormInstance>()

// 发布表单数据
const publishForm = reactive({
  category: '',
  marketDescription: '',
  tags: [] as string[],
  allowComments: true,
  allowModification: true,
  featured: false
})

// 表单验证规则
const publishRules: FormRules = {
  category: [
    { required: true, message: '请选择角色分类', trigger: 'change' }
  ],
  marketDescription: [
    { required: true, message: '请输入市场描述', trigger: 'blur' },
    { min: 20, max: 500, message: '描述长度应在20-500字符之间', trigger: 'blur' }
  ],
  tags: [
    {
      validator: (rule, value, callback) => {
        if (value.length === 0) {
          callback(new Error('请至少添加一个标签'))
        } else if (value.length > 10) {
          callback(new Error('标签数量不能超过10个'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 可选分类
const availableCategories = [
  { value: '动漫角色', label: '动漫角色', icon: '🎭' },
  { value: '原创角色', label: '原创角色', icon: '✨' },
  { value: '历史人物', label: '历史人物', icon: '📜' },
  { value: '虚拟偶像', label: '虚拟偶像', icon: '🎤' },
  { value: '游戏角色', label: '游戏角色', icon: '🎮' },
  { value: '文学角色', label: '文学角色', icon: '📚' },
  { value: '助手/老师', label: '助手/老师', icon: '👨‍🏫' },
  { value: '娱乐角色', label: '娱乐角色', icon: '🎪' },
  { value: '其他', label: '其他', icon: '🔮' }
]

// 建议标签
const suggestedTags = computed(() => {
  const baseTags = ['友善', '智慧', '幽默', '温柔', '活泼', '冷静', '神秘', '可爱']
  const categoryTags: Record<string, string[]> = {
    '动漫角色': ['二次元', '动漫', 'ACG'],
    '原创角色': ['原创', '独特', '创意'],
    '历史人物': ['历史', '古典', '传统'],
    '虚拟偶像': ['偶像', '歌手', '表演'],
    '游戏角色': ['游戏', '冒险', '战斗'],
    '文学角色': ['文学', '诗歌', '哲学'],
    '助手/老师': ['教育', '助手', '专业'],
    '娱乐角色': ['娱乐', '搞笑', '轻松']
  }

  const categorySpecific = categoryTags[publishForm.category] || []
  return [...categorySpecific, ...baseTags].filter(tag => !publishForm.tags.includes(tag))
})

// 计算属性
const filteredCharacters = computed(() => {
  if (!characterSearchQuery.value) {
    return userCharacters.value
  }

  return userCharacters.value.filter(character =>
    character.name.toLowerCase().includes(characterSearchQuery.value.toLowerCase()) ||
    (character.description && character.description.toLowerCase().includes(characterSearchQuery.value.toLowerCase()))
  )
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedCharacter.value !== null
    case 1:
      return publishForm.category && publishForm.marketDescription && publishForm.tags.length > 0
    default:
      return true
  }
})

const canPublish = computed(() => {
  return canProceed.value && agreeToTerms.value
})

// 监听visible变化
import { watch } from 'vue'
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    loadUserCharacters()
    resetForm()
  }
})

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 方法
const loadUserCharacters = async () => {
  try {
    loadingCharacters.value = true
    // 这里调用API获取用户的角色列表
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    userCharacters.value = [
      {
        id: '1',
        name: '小萌',
        description: '可爱的虚拟助手，总是充满活力',
        avatar: '',
        rating: 4.8,
        chatCount: 1250,
        updatedAt: '2024-01-15T10:00:00Z',
        isPublic: true,
        isNSFW: false,
        publishedToMarket: false
      } as Character,
      // ... 更多角色
    ]
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loadingCharacters.value = false
  }
}

const resetForm = () => {
  currentStep.value = 0
  selectedCharacter.value = null
  publishForm.category = ''
  publishForm.marketDescription = ''
  publishForm.tags = []
  publishForm.allowComments = true
  publishForm.allowModification = true
  publishForm.featured = false
  agreeToTerms.value = false
  characterSearchQuery.value = ''
  tagInput.value = ''
}

const selectCharacter = (character: Character) => {
  selectedCharacter.value = character
  // 自动填充一些信息
  publishForm.marketDescription = character.description || ''
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    const isValid = await publishFormRef.value?.validate().catch(() => false)
    if (!isValid) return
  }

  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !publishForm.tags.includes(tag) && publishForm.tags.length < 10) {
    publishForm.tags.push(tag)
    tagInput.value = ''
  }
}

const addSuggestedTag = (tag: string) => {
  if (!publishForm.tags.includes(tag) && publishForm.tags.length < 10) {
    publishForm.tags.push(tag)
  }
}

const removeTag = (tag: string) => {
  const index = publishForm.tags.indexOf(tag)
  if (index > -1) {
    publishForm.tags.splice(index, 1)
  }
}

const handlePublish = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要发布这个角色到市场吗？发布后将需要经过审核才能正式上线。',
      '确认发布',
      {
        confirmButtonText: '确认发布',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    publishing.value = true

    // 调用发布API
    const publishData = {
      characterId: selectedCharacter.value!.id,
      ...publishForm
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success('角色发布成功！等待审核中...')
    emit('character-published', selectedCharacter.value!)
    handleClose()

  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败，请稍后重试')
    }
  } finally {
    publishing.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return '1天前'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 生命周期
onMounted(() => {
  // 初始化
})
</script>

<style scoped>
.publish-character-dialog {
  --el-dialog-bg-color: rgba(15, 15, 35, 0.95);
  --el-dialog-border-color: rgba(139, 92, 246, 0.3);
}

:deep(.el-dialog) {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  padding: 20px;
}

:deep(.el-dialog__title) {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 20px;
  color: white;
}

.glass-card {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.character-option {
  background: rgba(15, 15, 35, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.character-option:hover {
  background: rgba(15, 15, 35, 0.5);
  border-color: rgba(139, 92, 246, 0.4);
}

.character-option.selected {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.6);
}

.character-option-skeleton {
  background: rgba(15, 15, 35, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) rgba(15, 15, 35, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 15, 35, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}

:deep(.el-steps .el-step__title) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-steps .el-step__description) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.el-steps .el-step.is-process .el-step__title) {
  color: #8B5CF6;
}

:deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

:deep(.el-checkbox__label) {
  color: white;
}

.terms-content {
  line-height: 1.6;
}

/* 响应式适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .grid-cols-2 {
    grid-template-columns: 1fr !important;
  }

  .flex {
    flex-direction: column;
  }

  .preview-card .flex {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
