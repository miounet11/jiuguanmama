<template>
  <el-dialog
    v-model="visible"
    title="编辑角色"
    width="800px"
    class="character-edit-dialog"
    :before-close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="edit-form"
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
                :on-error="handleAvatarError"
                action="/api/upload/avatar"
              >
                <img v-if="form.avatar" :src="form.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <el-button
                v-if="form.avatar"
                size="small"
                type="danger"
                @click="removeAvatar"
                class="remove-avatar-btn"
              >
                删除头像
              </el-button>
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

          <el-form-item label="角色类别">
            <el-select v-model="form.category" placeholder="选择角色类别">
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="角色标签">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              placeholder="选择或创建标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
            <div class="form-tip">最多选择5个标签</div>
          </el-form-item>

          <el-form-item label="角色设置">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-switch v-model="form.isPublic" />
                <span class="switch-label">公开角色</span>
              </el-col>
              <el-col :span="8">
                <el-switch v-model="form.isFeatured" />
                <span class="switch-label">推荐角色</span>
              </el-col>
              <el-col :span="8">
                <el-switch v-model="form.isNSFW" />
                <span class="switch-label">成人内容</span>
              </el-col>
            </el-row>
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
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="背景故事">
            <el-input
              v-model="form.backstory"
              type="textarea"
              :rows="4"
              placeholder="角色的背景故事和经历"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="说话风格">
            <el-input
              v-model="form.speakingStyle"
              type="textarea"
              :rows="3"
              placeholder="角色的说话方式和语言特点"
              maxlength="300"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="初始消息">
            <el-input
              v-model="form.firstMessage"
              type="textarea"
              :rows="3"
              placeholder="角色的第一条消息"
              maxlength="300"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="示例对话">
            <div class="example-conversations">
              <div
                v-for="(example, index) in form.exampleConversations"
                :key="index"
                class="example-item"
              >
                <el-input
                  v-model="example.user"
                  placeholder="用户消息"
                  class="mb-2"
                />
                <el-input
                  v-model="example.character"
                  placeholder="角色回复"
                  type="textarea"
                  :rows="2"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeExample(index)"
                  class="remove-btn"
                >
                  删除
                </el-button>
              </div>
              <el-button @click="addExample" type="primary" plain>
                添加示例对话
              </el-button>
            </div>
          </el-form-item>
        </el-tab-pane>

        <!-- AI 设置 -->
        <el-tab-pane label="AI 设置" name="ai">
          <el-form-item label="模型选择">
            <el-select v-model="form.model" placeholder="选择AI模型">
              <el-option
                v-for="model in availableModels"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
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
            <div class="form-tip">控制回复的随机性，越高越有创意</div>
          </el-form-item>

          <el-form-item label="最大长度">
            <el-input-number
              v-model="form.maxTokens"
              :min="100"
              :max="4000"
              :step="100"
            />
            <div class="form-tip">每次回复的最大字数</div>
          </el-form-item>

          <el-form-item label="系统提示">
            <el-input
              v-model="form.systemPrompt"
              type="textarea"
              :rows="4"
              placeholder="输入系统提示词，用于指导AI的行为"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="记忆长度">
            <el-input-number
              v-model="form.memorySize"
              :min="5"
              :max="50"
              :step="5"
            />
            <div class="form-tip">保留多少轮对话记忆</div>
          </el-form-item>
        </el-tab-pane>

        <!-- 统计信息 -->
        <el-tab-pane label="统计" name="stats" v-if="character">
          <div class="stats-container">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ character.chatCount || 0 }}</div>
                  <div class="stat-label">对话次数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ character.favoriteCount || 0 }}</div>
                  <div class="stat-label">收藏数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ character.rating?.toFixed(1) || '0.0' }}</div>
                  <div class="stat-label">平均评分</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ character.ratingCount || 0 }}</div>
                  <div class="stat-label">评分人数</div>
                </div>
              </el-col>
            </el-row>

            <div class="creation-info">
              <p><strong>创建时间：</strong>{{ formatDate(character.createdAt) }}</p>
              <p><strong>更新时间：</strong>{{ formatDate(character.updatedAt) }}</p>
              <p><strong>角色ID：</strong>{{ character.id }}</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleAIGenerate" :loading="aiGenerating">
          <el-icon class="mr-1"><Star /></el-icon>
          AI 优化
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          保存修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Star } from '@element-plus/icons-vue'
import { characterService } from '@/services/character'
import type { Character } from '@/types/character'

interface Props {
  modelValue: boolean
  characterId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [character: Character]
}>()

const visible = ref(props.modelValue)
const activeTab = ref('basic')
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const aiGenerating = ref(false)
const character = ref<Character | null>(null)

const categories = [
  '动漫角色', '游戏角色', '小说角色', '影视角色', '历史人物',
  '虚拟偶像', 'AI助手', '原创角色', '名人明星', '其他'
]

const availableTags = [
  '动漫', '游戏', '小说', '影视', '历史', '科幻', '奇幻', '现实',
  '助手', '教育', '娱乐', '陪伴', '创作', '治愈', '励志', '幽默',
  '严肃', '可爱', '成熟', '神秘', '活泼', '温柔', '坚强', '智慧'
]

const availableModels = [
  { label: 'Grok-3 (推荐)', value: 'grok-3' },
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  { label: 'Claude 3', value: 'claude-3' },
  { label: 'Gemini Pro', value: 'gemini-pro' }
]

const form = ref({
  name: '',
  avatar: '',
  description: '',
  category: '',
  tags: [] as string[],
  isPublic: true,
  isFeatured: false,
  isNSFW: false,
  personality: '',
  backstory: '',
  speakingStyle: '',
  firstMessage: '',
  exampleConversations: [] as Array<{ user: string; character: string }>,
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 1000,
  memorySize: 20,
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
  ],
  tags: [
    { type: 'array', max: 5, message: '最多只能选择5个标签', trigger: 'change' }
  ]
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.characterId) {
    loadCharacter()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

const loadCharacter = async () => {
  if (!props.characterId) return

  loading.value = true
  try {
    character.value = await characterService.getCharacter(props.characterId)

    // 填充表单数据
    const char = character.value
    form.value = {
      name: char.name || '',
      avatar: char.avatar || '',
      description: char.description || '',
      category: char.category || '',
      tags: typeof char.tags === 'string' ? JSON.parse(char.tags) : (char.tags || []),
      isPublic: char.isPublic ?? true,
      isFeatured: char.isFeatured ?? false,
      isNSFW: char.isNSFW ?? false,
      personality: char.personality || '',
      backstory: char.backstory || '',
      speakingStyle: char.speakingStyle || '',
      firstMessage: char.firstMessage || '',
      exampleConversations: char.exampleConversations || [],
      model: char.model || 'grok-3',
      temperature: char.temperature || 0.7,
      maxTokens: char.maxTokens || 1000,
      memorySize: char.memorySize || 20,
      systemPrompt: char.systemPrompt || ''
    }
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
    handleClose()
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  character.value = null
  activeTab.value = 'basic'
}

const handleClose = () => {
  visible.value = false
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
  ElMessage.success('头像上传成功')
}

const handleAvatarError = () => {
  ElMessage.error('头像上传失败，请重试')
}

const removeAvatar = () => {
  form.value.avatar = ''
}

const addExample = () => {
  form.value.exampleConversations.push({
    user: '',
    character: ''
  })
}

const removeExample = (index: number) => {
  form.value.exampleConversations.splice(index, 1)
}

const handleAIGenerate = async () => {
  if (!form.value.name) {
    ElMessage.warning('请先输入角色名称')
    return
  }

  const confirmResult = await ElMessageBox.confirm(
    'AI将基于当前信息优化角色设定，这将覆盖部分现有内容。是否继续？',
    '确认AI优化',
    {
      type: 'warning',
      confirmButtonText: '继续优化',
      cancelButtonText: '取消'
    }
  ).catch(() => false)

  if (!confirmResult) return

  aiGenerating.value = true
  try {
    const generated = await characterService.generateCharacter({
      name: form.value.name,
      tags: form.value.tags
    })

    // 只更新人设相关字段，保留其他设置
    form.value.personality = generated.personality || form.value.personality
    form.value.backstory = generated.backstory || form.value.backstory
    form.value.speakingStyle = generated.speakingStyle || form.value.speakingStyle
    form.value.firstMessage = generated.firstMessage || form.value.firstMessage

    if (generated.description && !form.value.description) {
      form.value.description = generated.description
    }

    ElMessage.success('AI优化完成')
  } catch (error) {
    console.error('AI优化失败:', error)
    ElMessage.error('AI优化失败，请稍后重试')
  } finally {
    aiGenerating.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  if (!props.characterId) return

  submitting.value = true
  try {
    const updatedCharacter = await characterService.updateCharacter(props.characterId, form.value)
    emit('success', updatedCharacter)
    ElMessage.success('角色更新成功')
    handleClose()
  } catch (error) {
    console.error('更新角色失败:', error)
    ElMessage.error('更新角色失败')
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  if (visible.value && props.characterId) {
    loadCharacter()
  }
})
</script>

<style lang="scss" scoped>
.character-edit-dialog {
  :deep(.el-dialog) {
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
}

.loading-container {
  padding: 40px;
}

.edit-form {
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

  .remove-avatar-btn {
    margin-top: 10px;
    width: 120px;
  }
}

.switch-label {
  margin-left: 10px;
  font-size: 14px;
  color: #e5e7eb;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #9ca3af;
}

.example-conversations {
  .example-item {
    position: relative;
    padding: 15px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    margin-bottom: 15px;

    .remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
}

.stats-container {
  .stat-item {
    text-align: center;
    padding: 20px;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 8px;

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      color: #9ca3af;
    }
  }

  .creation-info {
    margin-top: 30px;
    padding: 20px;
    background: rgba(17, 24, 39, 0.5);
    border-radius: 8px;

    p {
      margin-bottom: 10px;
      color: #e5e7eb;

      strong {
        color: #8b5cf6;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
