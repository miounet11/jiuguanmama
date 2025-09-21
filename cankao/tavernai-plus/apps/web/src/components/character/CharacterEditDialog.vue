<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑角色' : '创建角色'"
    :width="isMobile ? '95%' : '80%'"
    :max-width="900"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="character-edit-form">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="default"
      >
        <el-row :gutter="24">
          <!-- 左侧：基本信息 -->
          <el-col :xs="24" :md="12">
            <div class="form-section">
              <h3 class="section-title">基本信息</h3>

              <!-- 角色头像 -->
              <el-form-item label="角色头像">
                <div class="avatar-upload">
                  <el-upload
                    class="avatar-uploader"
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :show-file-list="false"
                    :on-success="handleAvatarSuccess"
                    :before-upload="beforeAvatarUpload"
                    accept="image/*"
                  >
                    <img v-if="form.avatar" :src="form.avatar" class="avatar" alt="角色头像" />
                    <div v-else class="avatar-placeholder">
                      <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                      <div class="upload-text">上传头像</div>
                    </div>
                  </el-upload>

                  <!-- AI生成头像按钮 -->
                  <el-button
                    v-if="form.name && form.description"
                    type="primary"
                    size="small"
                    @click="generateAvatar"
                    :loading="generatingAvatar"
                    class="generate-avatar-btn"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI生成头像
                  </el-button>
                </div>
              </el-form-item>

              <!-- 角色名称 -->
              <el-form-item label="角色名称" prop="name">
                <el-input
                  v-model="form.name"
                  placeholder="输入角色名称"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>

              <!-- 角色描述 -->
              <el-form-item label="角色描述" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="4"
                  placeholder="简单描述这个角色的外貌、身份、特点等"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <!-- 首条消息 -->
              <el-form-item label="首条消息" prop="firstMessage">
                <el-input
                  v-model="form.firstMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="角色与用户初次见面时会说的话"
                  maxlength="300"
                  show-word-limit
                />
              </el-form-item>

              <!-- 标签 -->
              <el-form-item label="标签">
                <div class="tags-input">
                  <el-tag
                    v-for="tag in form.tags"
                    :key="tag"
                    closable
                    :disable-transitions="false"
                    @close="removeTag(tag)"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>

                  <el-input
                    v-if="inputVisible"
                    ref="inputRef"
                    v-model="inputValue"
                    class="tag-input"
                    size="small"
                    @keyup.enter="handleInputConfirm"
                    @blur="handleInputConfirm"
                  />

                  <el-button
                    v-else
                    class="button-new-tag"
                    size="small"
                    @click="showInput"
                  >
                    + 添加标签
                  </el-button>
                </div>
              </el-form-item>
            </div>
          </el-col>

          <!-- 右侧：高级设置 -->
          <el-col :xs="24" :md="12">
            <div class="form-section">
              <h3 class="section-title">角色设定</h3>

              <!-- 性格特征 -->
              <el-form-item label="性格特征">
                <el-input
                  v-model="form.personality"
                  type="textarea"
                  :rows="3"
                  placeholder="描述角色的性格特点，如：开朗、内向、幽默等"
                  maxlength="300"
                  show-word-limit
                />
              </el-form-item>

              <!-- 背景故事 -->
              <el-form-item label="背景故事">
                <el-input
                  v-model="form.backstory"
                  type="textarea"
                  :rows="4"
                  placeholder="角色的背景经历、来历等"
                  maxlength="800"
                  show-word-limit
                />
              </el-form-item>

              <!-- 说话风格 -->
              <el-form-item label="说话风格">
                <el-input
                  v-model="form.speakingStyle"
                  type="textarea"
                  :rows="2"
                  placeholder="描述角色的说话方式和语言习惯"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>

              <!-- 系统提示词 -->
              <el-form-item label="系统提示词">
                <el-input
                  v-model="form.systemPrompt"
                  type="textarea"
                  :rows="4"
                  placeholder="高级用户可以编写自定义的系统提示词来精确控制角色行为"
                  maxlength="1000"
                  show-word-limit
                />
                <div class="form-tip">
                  系统提示词会覆盖其他设定，请谨慎使用
                </div>
              </el-form-item>

              <!-- 可见性设置 -->
              <el-form-item label="可见性">
                <el-radio-group v-model="form.isPublic">
                  <el-radio :label="false">私有</el-radio>
                  <el-radio :label="true">公开</el-radio>
                </el-radio-group>
                <div class="form-tip">
                  公开角色会出现在角色市场中，其他用户可以使用
                </div>
              </el-form-item>

              <!-- 成人内容标记 -->
              <el-form-item label="内容标记">
                <el-checkbox v-model="form.nsfw">包含成人内容</el-checkbox>
                <div class="form-tip">
                  请诚实标记，有助于其他用户筛选合适的内容
                </div>
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- AI助手生成 -->
        <div class="ai-assistant-section">
          <el-divider>
            <el-icon><User /></el-icon>
            AI助手
          </el-divider>

          <div class="ai-tools">
            <el-button
              type="primary"
              @click="showAIGenerator = true"
              :disabled="!form.name"
            >
              <el-icon><MagicStick /></el-icon>
              使用AI完善角色设定
            </el-button>

            <el-button
              type="info"
              @click="previewCharacter"
              :disabled="!form.name"
            >
              <el-icon><View /></el-icon>
              预览角色
            </el-button>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ isEdit ? '保存修改' : '创建角色' }}
        </el-button>
      </div>
    </template>

    <!-- AI生成器对话框 -->
    <AICharacterGenerator
      v-model="showAIGenerator"
      :character-name="form.name"
      :initial-description="form.description"
      @generated="handleAIGenerated"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MagicStick, User, View } from '@element-plus/icons-vue'
import { api } from '@/services/api'
import AICharacterGenerator from './AICharacterGenerator.vue'

interface Character {
  id?: string
  name: string
  description: string
  avatar?: string
  firstMessage: string
  personality?: string
  backstory?: string
  speakingStyle?: string
  systemPrompt?: string
  tags: string[]
  isPublic: boolean
  nsfw: boolean
}

interface Props {
  modelValue: boolean
  character?: Character
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', character: Character): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const inputRef = ref()
const submitting = ref(false)
const generatingAvatar = ref(false)
const showAIGenerator = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

const isMobile = computed(() => {
  return window.innerWidth <= 768
})

const isEdit = computed(() => {
  return !!props.character?.id
})

// 表单数据
const form = reactive<Character>({
  name: '',
  description: '',
  avatar: '',
  firstMessage: '',
  personality: '',
  backstory: '',
  speakingStyle: '',
  systemPrompt: '',
  tags: [],
  isPublic: false,
  nsfw: false
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 1, max: 50, message: '角色名称长度应在1-50个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 10, max: 500, message: '角色描述长度应在10-500个字符', trigger: 'blur' }
  ],
  firstMessage: [
    { required: true, message: '请输入首条消息', trigger: 'blur' },
    { min: 5, max: 300, message: '首条消息长度应在5-300个字符', trigger: 'blur' }
  ]
}

// 上传配置
const uploadUrl = '/api/upload/avatar'
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}))

// 监听角色数据变化
watch(() => props.character, (newCharacter) => {
  if (newCharacter) {
    Object.assign(form, {
      ...newCharacter,
      tags: newCharacter.tags || []
    })
  } else {
    resetForm()
  }
}, { immediate: true, deep: true })

// 方法
const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    avatar: '',
    firstMessage: '',
    personality: '',
    backstory: '',
    speakingStyle: '',
    systemPrompt: '',
    tags: [],
    isPublic: false,
    nsfw: false
  })
  formRef.value?.clearValidate()
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitting.value = true

    const characterData = { ...form }

    if (isEdit.value) {
      const response = await api.put(`/api/characters/${props.character!.id}`, characterData)
      if (response.data.success) {
        ElMessage.success('角色修改成功')
        emit('saved', response.data.character)
        handleClose()
      }
    } else {
      const response = await api.post('/api/characters', characterData)
      if (response.data.success) {
        ElMessage.success('角色创建成功')
        emit('saved', response.data.character)
        handleClose()
      }
    }
  } catch (error: any) {
    console.error('保存角色失败:', error)
    ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
  } finally {
    submitting.value = false
  }
}

// 头像上传
const handleAvatarSuccess = (response: any) => {
  if (response.success) {
    form.avatar = response.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('头像上传失败')
  }
}

const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像文件必须是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像文件大小不能超过 2MB!')
    return false
  }
  return true
}

// AI生成头像
const generateAvatar = async () => {
  try {
    generatingAvatar.value = true

    const response = await api.post('/api/ai/generate-avatar', {
      name: form.name,
      description: form.description,
      personality: form.personality,
      tags: form.tags
    })

    if (response.data.success) {
      form.avatar = response.data.avatarUrl
      ElMessage.success('AI头像生成成功')
    }
  } catch (error: any) {
    console.error('生成头像失败:', error)
    ElMessage.error('生成头像失败: ' + (error.response?.data?.message || error.message))
  } finally {
    generatingAvatar.value = false
  }
}

// 标签管理
const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.input?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !form.tags.includes(inputValue.value)) {
    form.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// AI助手功能
const handleAIGenerated = (aiData: any) => {
  Object.assign(form, {
    personality: aiData.personality || form.personality,
    backstory: aiData.backstory || form.backstory,
    speakingStyle: aiData.speakingStyle || form.speakingStyle,
    firstMessage: aiData.firstMessage || form.firstMessage
  })

  ElMessage.success('AI生成的内容已填入表单')
}

const previewCharacter = () => {
  ElMessageBox.alert(
    `<strong>角色名称:</strong> ${form.name}<br>
     <strong>描述:</strong> ${form.description}<br>
     <strong>性格:</strong> ${form.personality || '未设置'}<br>
     <strong>首条消息:</strong> ${form.firstMessage}`,
    '角色预览',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}
</script>

<style lang="scss" scoped>
.character-edit-form {
  max-height: 70vh;
  overflow-y: auto;

  .form-section {
    background: rgba(30, 30, 40, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;

    .section-title {
      margin: 0 0 20px;
      font-size: 16px;
      font-weight: 600;
      color: #e5e7eb;
      border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      padding-bottom: 8px;
    }
  }

  .avatar-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .avatar-uploader {
      .avatar {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid rgba(139, 92, 246, 0.3);
      }

      .avatar-placeholder {
        width: 120px;
        height: 120px;
        border: 2px dashed rgba(139, 92, 246, 0.3);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .avatar-uploader-icon {
          font-size: 28px;
          color: #8b5cf6;
        }

        .upload-text {
          margin-top: 8px;
          font-size: 14px;
          color: #9ca3af;
        }
      }
    }

    .generate-avatar-btn {
      background: linear-gradient(135deg, #8b5cf6, #c084fc);
      border: none;
    }
  }

  .tags-input {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .tag-item {
      background: rgba(139, 92, 246, 0.2);
      border-color: rgba(139, 92, 246, 0.4);
      color: #c084fc;
    }

    .tag-input {
      width: 80px;
    }

    .button-new-tag {
      border: 1px dashed rgba(139, 92, 246, 0.4);
      color: #8b5cf6;
      background: transparent;

      &:hover {
        background: rgba(139, 92, 246, 0.1);
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .ai-assistant-section {
    margin-top: 24px;

    .ai-tools {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 移动端优化
@media (max-width: 768px) {
  .character-edit-form {
    .form-section {
      padding: 16px;
      margin-bottom: 16px;
    }

    .avatar-upload {
      .avatar-uploader {
        .avatar,
        .avatar-placeholder {
          width: 100px;
          height: 100px;
        }
      }
    }

    .ai-tools {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}

// 深色主题样式
:deep(.el-form-item__label) {
  color: #d1d5db;
}

:deep(.el-input__inner) {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: #e5e7eb;

  &:focus {
    border-color: #8b5cf6;
  }
}

:deep(.el-textarea__inner) {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: #e5e7eb;

  &:focus {
    border-color: #8b5cf6;
  }
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #8b5cf6;
  border-color: #8b5cf6;
}
</style>
