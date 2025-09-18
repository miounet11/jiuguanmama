<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑资料"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="edit-profile-form">
      <!-- 头像编辑 -->
      <div class="mb-6 text-center">
        <div class="relative inline-block">
          <el-avatar :size="80" :src="form.avatar || user?.avatar">
            {{ form.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() }}
          </el-avatar>

          <!-- 头像上传按钮 -->
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            :before-upload="beforeAvatarUpload"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
            :show-file-list="false"
            accept="image/*"
            class="absolute inset-0"
          >
            <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <el-icon class="text-white text-xl">
                <Camera />
              </el-icon>
            </div>
          </el-upload>
        </div>
        <p class="text-sm text-gray-400 mt-2">点击头像更换</p>
      </div>

      <!-- 基本信息 -->
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :maxlength="30"
            show-word-limit
          />
          <div class="text-xs text-gray-500 mt-1">
            用户名只能包含字母、数字和下划线，长度为3-30个字符
          </div>
        </el-form-item>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="3"
            placeholder="介绍一下你自己..."
            :maxlength="200"
            show-word-limit
            resize="none"
          />
        </el-form-item>

        <el-form-item label="所在地" prop="location">
          <el-input
            v-model="form.location"
            placeholder="请输入所在地"
            :maxlength="50"
          >
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="个人网站" prop="website">
          <el-input
            v-model="form.website"
            placeholder="请输入个人网站链接"
            :maxlength="200"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="text-xs text-gray-500 mt-1">
            请输入完整的URL，如：https://example.com
          </div>
        </el-form-item>
      </el-form>

      <!-- 隐私设置 -->
      <div class="mt-8">
        <h4 class="text-lg font-medium text-white mb-4">隐私设置</h4>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">公开个人资料</div>
              <div class="text-sm text-gray-400">允许其他用户查看你的完整资料</div>
            </div>
            <el-switch v-model="form.isPublicProfile" />
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">显示在线状态</div>
              <div class="text-sm text-gray-400">其他用户可以看到你是否在线</div>
            </div>
            <el-switch v-model="form.showOnlineStatus" />
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">允许关注</div>
              <div class="text-sm text-gray-400">其他用户可以关注你</div>
            </div>
            <el-switch v-model="form.allowFollow" />
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="mt-8">
        <h4 class="text-lg font-medium text-white mb-4">通知设置</h4>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">点赞通知</div>
              <div class="text-sm text-gray-400">有人点赞你的动态时通知</div>
            </div>
            <el-switch v-model="form.notifyOnLike" />
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">评论通知</div>
              <div class="text-sm text-gray-400">有人评论你的动态时通知</div>
            </div>
            <el-switch v-model="form.notifyOnComment" />
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <div class="font-medium text-white">关注通知</div>
              <div class="text-sm text-gray-400">有人关注你时通知</div>
            </div>
            <el-switch v-model="form.notifyOnFollow" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          保存更改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useCommunityStore } from '@/stores/community'
import { User, UserUpdateData } from '@/types/community'
import { Camera, Location, Link } from '@element-plus/icons-vue'
import { ElMessage, ElForm } from 'element-plus'
import type { UploadFile } from 'element-plus'

interface Props {
  modelValue: boolean
  user?: User | null
}

interface Emits {
  'update:modelValue': [value: boolean]
  updated: [user: User]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const communityStore = useCommunityStore()

// 响应式数据
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()

// 表单数据
const form = reactive({
  username: '',
  bio: '',
  location: '',
  website: '',
  avatar: '',
  // 隐私设置
  isPublicProfile: true,
  showOnlineStatus: true,
  allowFollow: true,
  // 通知设置
  notifyOnLike: true,
  notifyOnComment: true,
  notifyOnFollow: true
})

// 上传配置
const uploadAction = computed(() => `${import.meta.env.VITE_API_URL}/api/upload/avatar`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度为3-30个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ],
  location: [
    { max: 50, message: '所在地不能超过50个字符', trigger: 'blur' }
  ],
  website: [
    { max: 200, message: '网站链接不能超过200个字符', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的网站链接',
      trigger: 'blur',
      required: false
    }
  ]
}

// 监听
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val && props.user) {
    initForm()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 方法
const initForm = () => {
  if (!props.user) return

  form.username = props.user.username
  form.bio = props.user.bio || ''
  form.location = props.user.location || ''
  form.website = props.user.website || ''
  form.avatar = props.user.avatar || ''

  // 这些设置在实际项目中应该从用户设置中获取
  form.isPublicProfile = true
  form.showOnlineStatus = true
  form.allowFollow = true
  form.notifyOnLike = true
  form.notifyOnComment = true
  form.notifyOnFollow = true
}

const resetForm = () => {
  initForm()
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitting.value = true

    const updateData: UserUpdateData = {
      username: form.username,
      bio: form.bio,
      location: form.location,
      website: form.website,
      avatar: form.avatar
    }

    const response = await communityStore.updateUserProfile(updateData)

    if (response.success && response.data) {
      emit('updated', response.data)
      dialogVisible.value = false
      ElMessage.success('资料更新成功!')
    } else {
      throw new Error(response.error || '更新失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClosed = () => {
  resetForm()
}

// 头像上传相关
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }

  return true
}

const handleAvatarSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data?.url) {
    form.avatar = response.data.url
    ElMessage.success('头像上传成功!')
  } else {
    ElMessage.error('头像上传失败')
  }
}

const handleAvatarError = (error: any) => {
  console.error('头像上传失败:', error)
  ElMessage.error('头像上传失败')
}
</script>

<style scoped>
.edit-profile-form {
  max-height: 70vh;
  overflow-y: auto;
}

/* 自定义表单样式 */
:deep(.el-form-item__label) {
  @apply text-gray-300;
}

:deep(.el-input__inner) {
  @apply bg-gray-800 border-gray-600 text-white placeholder-gray-400;
}

:deep(.el-input__inner:focus) {
  @apply border-purple-500;
}

:deep(.el-textarea__inner) {
  @apply bg-gray-800 border-gray-600 text-white placeholder-gray-400;
}

:deep(.el-textarea__inner:focus) {
  @apply border-purple-500;
}

/* 字数限制样式 */
:deep(.el-input__count) {
  @apply text-gray-500;
}

/* 开关样式 */
:deep(.el-switch.is-checked .el-switch__core) {
  @apply bg-purple-600;
}

/* 上传区域样式 */
:deep(.el-upload) {
  @apply block w-full h-full;
}

/* 滚动条样式 */
.edit-profile-form::-webkit-scrollbar {
  width: 6px;
}

.edit-profile-form::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.2);
  border-radius: 3px;
}

.edit-profile-form::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.edit-profile-form::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
