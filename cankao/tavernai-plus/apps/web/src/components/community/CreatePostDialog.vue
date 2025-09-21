<template>
  <el-dialog
    v-model="dialogVisible"
    title="发布动态"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @closed="handleClosed"
  >
    <div class="create-post-dialog">
      <!-- 内容类型选择 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">内容类型</label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="typeOption in typeOptions"
            :key="typeOption.value"
            @click="form.type = typeOption.value"
            :class="[
              'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200',
              form.type === typeOption.value
                ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:bg-gray-700/50'
            ]"
          >
            <el-icon class="text-2xl mb-2">
              <component :is="typeOption.icon" />
            </el-icon>
            <span class="text-sm font-medium">{{ typeOption.label }}</span>
          </button>
        </div>
      </div>

      <!-- 文字内容 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          内容
          <span class="text-red-400">*</span>
        </label>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="分享你的想法..."
          :maxlength="500"
          show-word-limit
          resize="none"
        />
      </div>

      <!-- 图片上传 (仅图片类型) -->
      <div v-if="form.type === 'image'" class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          图片
          <span class="text-red-400">*</span>
        </label>
        <el-upload
          ref="uploadRef"
          v-model:file-list="fileList"
          :action="uploadAction"
          :headers="uploadHeaders"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-remove="handleRemove"
          list-type="picture-card"
          :limit="9"
          multiple
          accept="image/*"
        >
          <template #default>
            <div class="upload-placeholder">
              <el-icon class="text-2xl text-gray-400 mb-2">
                <Plus />
              </el-icon>
              <div class="text-sm text-gray-400">添加图片</div>
            </div>
          </template>
          <template #tip>
            <div class="text-xs text-gray-500 mt-2">
              支持 JPG、PNG、GIF 格式，单张图片大小不超过 5MB，最多上传 9 张
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 角色选择 (仅角色分享类型) -->
      <div v-if="form.type === 'character_share'" class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          选择角色
          <span class="text-red-400">*</span>
        </label>
        <div v-if="selectedCharacter" class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 mb-3">
          <div class="flex items-center space-x-3">
            <el-avatar :size="48" :src="selectedCharacter.avatar">
              {{ selectedCharacter.name.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="flex-1">
              <h4 class="font-medium text-white">{{ selectedCharacter.name }}</h4>
              <p class="text-sm text-gray-400 line-clamp-2">{{ selectedCharacter.description }}</p>
            </div>
            <el-button size="small" @click="clearSelectedCharacter">
              更换
            </el-button>
          </div>
        </div>
        <el-button v-else @click="showCharacterSelector = true" type="primary" plain>
          <el-icon><Avatar /></el-icon>
          选择角色
        </el-button>
      </div>

      <!-- 标签 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">标签</label>
        <div class="flex flex-wrap gap-2 mb-3">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            type="primary"
          >
            #{{ tag }}
          </el-tag>
        </div>
        <div class="flex space-x-2">
          <el-input
            v-model="newTag"
            placeholder="输入标签名称"
            size="small"
            style="width: 150px"
            @keyup.enter="addTag"
          />
          <el-button size="small" @click="addTag" :disabled="!newTag.trim()">
            添加
          </el-button>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          输入相关标签，帮助其他用户发现你的内容
        </div>
      </div>

      <!-- 可见性设置 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">可见性</label>
        <el-radio-group v-model="form.visibility">
          <el-radio value="public" class="mb-2">
            <div class="flex items-center space-x-2">
              <el-icon><Position /></el-icon>
              <div>
                <div class="font-medium">公开</div>
                <div class="text-xs text-gray-500">所有人都可以看到</div>
              </div>
            </div>
          </el-radio>
          <el-radio value="followers" class="mb-2">
            <div class="flex items-center space-x-2">
              <el-icon><User /></el-icon>
              <div>
                <div class="font-medium">粉丝可见</div>
                <div class="text-xs text-gray-500">只有关注你的用户可以看到</div>
              </div>
            </div>
          </el-radio>
          <el-radio value="private">
            <div class="flex items-center space-x-2">
              <el-icon><Lock /></el-icon>
              <div>
                <div class="font-medium">私密</div>
                <div class="text-xs text-gray-500">只有你可以看到</div>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 预览 -->
      <div v-if="showPreview" class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">预览</label>
        <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
          <PostPreview :post="previewPost" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex space-x-3">
          <el-button @click="showPreview = !showPreview">
            <el-icon><View /></el-icon>
            {{ showPreview ? '隐藏预览' : '预览' }}
          </el-button>
          <el-button @click="saveDraft" :disabled="!canSaveDraft">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
        </div>
        <div class="flex space-x-3">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
            :disabled="!canSubmit"
          >
            发布
          </el-button>
        </div>
      </div>
    </template>

    <!-- 角色选择器对话框 -->
    <CharacterSelectorDialog
      v-model="showCharacterSelector"
      @select="handleCharacterSelect"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { Post, PostCreateData } from '@/types/community'
import { Character } from '@/types/character'
import PostPreview from './PostPreview.vue'
import CharacterSelectorDialog from './CharacterSelectorDialog.vue'
import {
  EditPen,
  Picture,
  Avatar,
  Plus,
  Position,
  User,
  Lock,
  View,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'

interface Props {
  modelValue: boolean
  initialType?: 'text' | 'image' | 'character_share'
  initialContent?: string
}

interface Emits {
  'update:modelValue': [value: boolean]
  created: [post: Post]
}

const props = withDefaults(defineProps<Props>(), {
  initialType: 'text',
  initialContent: ''
})

const emit = defineEmits<Emits>()

const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const dialogVisible = ref(false)
const submitting = ref(false)
const showPreview = ref(false)
const showCharacterSelector = ref(false)
const newTag = ref('')
const fileList = ref<UploadFiles>([])
const uploadRef = ref()

// 表单数据
const form = reactive<PostCreateData>({
  content: '',
  type: 'text',
  visibility: 'public',
  images: [],
  tags: []
})

// 选中的角色
const selectedCharacter = ref<Character | null>(null)

// 上传配置
const uploadAction = computed(() => `${import.meta.env.VITE_API_URL}/api/upload/image`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 类型选项
const typeOptions = [
  { value: 'text', label: '文字', icon: EditPen },
  { value: 'image', label: '图片', icon: Picture },
  { value: 'character_share', label: '角色', icon: Avatar }
]

// 计算属性
const canSubmit = computed(() => {
  if (!form.content.trim()) return false

  if (form.type === 'image' && (!form.images || form.images.length === 0)) {
    return false
  }

  if (form.type === 'character_share' && !selectedCharacter.value) {
    return false
  }

  return true
})

const canSaveDraft = computed(() => {
  return form.content.trim().length > 0
})

const previewPost = computed((): Partial<Post> => {
  return {
    content: form.content,
    type: form.type,
    visibility: form.visibility,
    images: form.images,
    tags: form.tags,
    character: selectedCharacter.value,
    user: userStore.user!,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    createdAt: new Date().toISOString()
  }
})

// 监听
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.initialType, (type) => {
  if (type) {
    form.type = type
  }
})

watch(() => props.initialContent, (content) => {
  if (content) {
    form.content = content
  }
})

// 方法
const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    submitting.value = true

    const data: PostCreateData = {
      content: form.content,
      type: form.type,
      visibility: form.visibility,
      tags: form.tags
    }

    if (form.type === 'image' && form.images) {
      data.images = form.images
    }

    if (form.type === 'character_share' && selectedCharacter.value) {
      data.characterId = selectedCharacter.value.id
    }

    const response = await communityStore.createPost(data)

    if (response.success && response.data) {
      emit('created', response.data)
      dialogVisible.value = false
      resetForm()
      ElMessage.success('动态发布成功!')
    } else {
      throw new Error(response.error || '发布失败')
    }
  } catch (error) {
    console.error('发布动态失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '发布失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = async () => {
  if (hasUnsavedChanges()) {
    try {
      await ElMessageBox.confirm(
        '你有未保存的内容，确定要关闭吗？',
        '确认关闭',
        {
          confirmButtonText: '关闭',
          cancelButtonText: '继续编辑',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  dialogVisible.value = false
}

const handleClosed = () => {
  resetForm()
}

const resetForm = () => {
  form.content = ''
  form.type = props.initialType || 'text'
  form.visibility = 'public'
  form.images = []
  form.tags = []
  selectedCharacter.value = null
  fileList.value = []
  newTag.value = ''
  showPreview.value = false
}

const hasUnsavedChanges = () => {
  return form.content.trim().length > 0 ||
         form.tags.length > 0 ||
         (form.images && form.images.length > 0) ||
         selectedCharacter.value !== null
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (!tag) return

  if (form.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
    return
  }

  if (form.tags.length >= 5) {
    ElMessage.warning('最多只能添加5个标签')
    return
  }

  form.tags.push(tag)
  newTag.value = ''
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const saveDraft = () => {
  // 这里可以实现草稿保存功能
  ElMessage.success('草稿已保存')
}

// 图片上传相关
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }

  return true
}

const handleUploadSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data?.url) {
    if (!form.images) form.images = []
    form.images.push(response.data.url)
  } else {
    ElMessage.error('图片上传失败')
    handleRemove(file)
  }
}

const handleUploadError = (error: any, file: UploadFile) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败')
  handleRemove(file)
}

const handleRemove = (file: UploadFile) => {
  if (form.images) {
    // 根据文件在 fileList 中的索引来移除对应的图片URL
    const index = fileList.value.findIndex(f => f.uid === file.uid)
    if (index > -1 && form.images[index]) {
      form.images.splice(index, 1)
    }
  }
}

// 角色相关
const handleCharacterSelect = (character: Character) => {
  selectedCharacter.value = character
  form.characterId = character.id
  showCharacterSelector.value = false
}

const clearSelectedCharacter = () => {
  selectedCharacter.value = null
  form.characterId = undefined
}

// 初始化
onMounted(() => {
  if (props.initialContent) {
    form.content = props.initialContent
  }
  if (props.initialType) {
    form.type = props.initialType
  }
})
</script>

<style scoped>
.create-post-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.upload-placeholder {
  @apply flex flex-col items-center justify-center w-full h-full;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 自定义单选框样式 */
:deep(.el-radio) {
  @apply w-full p-3 rounded-lg border border-gray-600 bg-gray-800/30 hover:bg-gray-700/30 transition-all;
}

:deep(.el-radio.is-checked) {
  @apply border-purple-500 bg-purple-500/10;
}

:deep(.el-radio__input) {
  @apply hidden;
}

:deep(.el-radio__label) {
  @apply text-white pl-0;
}

/* 文件上传样式优化 */
:deep(.el-upload--picture-card) {
  @apply w-20 h-20 bg-gray-800/50 border-gray-600 border-dashed rounded-lg;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  @apply w-20 h-20 border-gray-600;
}
</style>
