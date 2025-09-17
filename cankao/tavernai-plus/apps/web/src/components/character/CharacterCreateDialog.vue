<template>
  <el-dialog
    v-model="visible"
    title="创建新角色"
    width="800px"
    class="character-create-dialog"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="create-form"
    >
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="form.name" placeholder="输入角色名称" />
          </el-form-item>
          
          <el-form-item label="角色头像">
            <div class="avatar-uploader">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :on-success="handleAvatarSuccess"
                action="/api/upload/avatar"
              >
                <img v-if="form.avatar" :src="form.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </div>
          </el-form-item>
          
          <el-form-item label="角色描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="描述角色的基本信息和特点"
            />
          </el-form-item>
          
          <el-form-item label="角色标签">
            <el-select
              v-model="form.tags"
              multiple
              placeholder="选择标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="公开角色">
            <el-switch v-model="form.isPublic" />
            <span class="form-tip">公开后其他用户可以使用您的角色</span>
          </el-form-item>
        </el-tab-pane>
        
        <!-- 人设设定 -->
        <el-tab-pane label="人设设定" name="persona">
          <el-form-item label="性格特征">
            <el-input
              v-model="form.personality"
              type="textarea"
              :rows="3"
              placeholder="描述角色的性格特征"
            />
          </el-form-item>
          
          <el-form-item label="背景故事">
            <el-input
              v-model="form.backstory"
              type="textarea"
              :rows="4"
              placeholder="角色的背景故事和经历"
            />
          </el-form-item>
          
          <el-form-item label="说话风格">
            <el-input
              v-model="form.speakingStyle"
              type="textarea"
              :rows="3"
              placeholder="角色的说话方式和语言特点"
            />
          </el-form-item>
          
          <el-form-item label="初始消息">
            <el-input
              v-model="form.firstMessage"
              type="textarea"
              :rows="3"
              placeholder="角色的第一条消息"
            />
          </el-form-item>
        </el-tab-pane>
        
        <!-- AI 设置 -->
        <el-tab-pane label="AI 设置" name="ai">
          <el-form-item label="模型选择">
            <el-select v-model="form.model" placeholder="选择AI模型">
              <el-option label="GPT-4" value="gpt-4" />
              <el-option label="GPT-3.5" value="gpt-3.5-turbo" />
              <el-option label="Claude 3" value="claude-3" />
              <el-option label="Gemini Pro" value="gemini-pro" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="温度">
            <el-slider
              v-model="form.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              show-input
            />
          </el-form-item>
          
          <el-form-item label="最大长度">
            <el-input-number
              v-model="form.maxTokens"
              :min="100"
              :max="4000"
              :step="100"
            />
          </el-form-item>
          
          <el-form-item label="系统提示">
            <el-input
              v-model="form.systemPrompt"
              type="textarea"
              :rows="4"
              placeholder="输入系统提示词"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleAIGenerate" :loading="generating">
          <el-icon class="mr-1"><Star /></el-icon>
          AI 生成
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          创建角色
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Plus, Star } from '@element-plus/icons-vue'
import { characterService } from '@/services/character'
import type { Character } from '@/types/character'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [character: Character]
}>()

const visible = ref(props.modelValue)
const activeTab = ref('basic')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const generating = ref(false)

const availableTags = [
  '动漫', '游戏', '小说', '影视', '历史',
  '科幻', '奇幻', '现实', '助手', '教育',
  '娱乐', '陪伴', '创作'
]

const form = ref({
  name: '',
  avatar: '',
  description: '',
  tags: [] as string[],
  isPublic: true,
  personality: '',
  backstory: '',
  speakingStyle: '',
  firstMessage: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: ''
})

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
  formRef.value?.resetFields()
  activeTab.value = 'basic'
}

const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarSuccess = (response: any) => {
  form.value.avatar = response.url
}

const handleAIGenerate = async () => {
  if (!form.value.name) {
    ElMessage.warning('请先输入角色名称')
    return
  }
  
  generating.value = true
  try {
    const generated = await characterService.generateCharacter({
      name: form.value.name,
      tags: form.value.tags
    })
    
    Object.assign(form.value, generated)
    ElMessage.success('AI 生成成功')
  } catch (error) {
    console.error('AI 生成失败:', error)
    ElMessage.error('AI 生成失败')
  } finally {
    generating.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  
  submitting.value = true
  try {
    const character = await characterService.createCharacter(form.value)
    emit('success', character)
    handleClose()
  } catch (error) {
    console.error('创建角色失败:', error)
    ElMessage.error('创建角色失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.character-create-dialog {
  :deep(.el-dialog) {
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
}

.create-form {
  padding: 20px;
}

.avatar-uploader {
  .el-upload {
    border: 1px dashed rgba(139, 92, 246, 0.5);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
    
    &:hover {
      border-color: #8b5cf6;
    }
  }
  
  .avatar {
    width: 120px;
    height: 120px;
    display: block;
    object-fit: cover;
  }
  
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8b5cf6;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #9ca3af;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>