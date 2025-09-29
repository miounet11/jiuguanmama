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

        <!-- 时空属性 -->
        <el-tab-pane label="时空属性" name="spacetime">
          <div class="space-y-6">
            <!-- MBTI 性格分析 -->
            <div class="mbti-section">
              <h3 class="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                MBTI 性格类型
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- MBTI 类型选择 -->
                <el-form-item label="人格类型">
                  <el-select
                    v-model="form.mbti.type"
                    placeholder="选择MBTI人格类型"
                    filterable
                    class="w-full"
                  >
                    <el-option-group label="内向直觉 (NJ)">
                      <el-option label="建筑师 INTJ" value="INTJ" />
                      <el-option label="提倡者 INFJ" value="INFJ" />
                      <el-option label="建筑师 ENTJ" value="ENTJ" />
                      <el-option label="主人公 ENFJ" value="ENFJ" />
                    </el-option-group>
                    <el-option-group label="内向感知 (NP)">
                      <el-option label="思想家 INTP" value="INTP" />
                      <el-option label="调停者 INFP" value="INFP" />
                      <el-option label="辩论家 ENTP" value="ENTP" />
                      <el-option label="竞选者 ENFP" value="ENFP" />
                    </el-option-group>
                    <el-option-group label="外向感知 (SP)">
                      <el-option label="鉴赏家 ISTP" value="ISTP" />
                      <el-option label="探险家 ISFP" value="ISFP" />
                      <el-option label="企业家 ESTP" value="ESTP" />
                      <el-option label="娱乐家 ESFP" value="ESFP" />
                    </el-option-group>
                    <el-option-group label="外向判断 (SJ)">
                      <el-option label="物流师 ISTJ" value="ISTJ" />
                      <el-option label="守护者 ISFJ" value="ISFJ" />
                      <el-option label="总经理 ESTJ" value="ESTJ" />
                      <el-option label="执政官 ESFJ" value="ESFJ" />
                    </el-option-group>
                  </el-select>
                </el-form-item>

                <!-- 性格描述 -->
                <el-form-item label="性格描述">
                  <el-input
                    v-model="form.mbti.description"
                    placeholder="简要描述角色的性格特点"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
              </div>

              <!-- 性格特质 -->
              <el-form-item label="性格特质">
                <el-select
                  v-model="form.mbti.traits"
                  multiple
                  placeholder="选择角色的性格特质"
                  class="w-full"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option label="领导力" value="领导力" />
                  <el-option label="创造力" value="创造力" />
                  <el-option label="分析力" value="分析力" />
                  <el-option label="同理心" value="同理心" />
                  <el-option label="决断力" value="决断力" />
                  <el-option label="适应性" value="适应性" />
                  <el-option label="责任感" value="责任感" />
                  <el-option label="洞察力" value="洞察力" />
                  <el-option label="幽默感" value="幽默感" />
                  <el-option label="坚韧性" value="坚韧性" />
                </el-select>
              </el-form-item>

              <!-- 兼容人格类型 -->
              <el-form-item label="兼容类型">
                <el-select
                  v-model="form.mbti.compatibility"
                  multiple
                  placeholder="选择兼容的MBTI类型"
                  class="w-full"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option label="INTJ - 建筑师" value="INTJ" />
                  <el-option label="ENFJ - 主人公" value="ENFJ" />
                  <el-option label="INFJ - 提倡者" value="INFJ" />
                  <el-option label="ISFJ - 守护者" value="ISFJ" />
                  <el-option label="ESFJ - 执政官" value="ESFJ" />
                  <el-option label="INFP - 调停者" value="INFP" />
                  <el-option label="INTP - 思想家" value="INTP" />
                  <el-option label="ENTJ - 指挥官" value="ENTJ" />
                  <el-option label="ENTP - 辩论家" value="ENTP" />
                  <el-option label="ENFP - 竞选者" value="ENFP" />
                  <el-option label="ESFP - 娱乐家" value="ESFP" />
                  <el-option label="ISTJ - 物流师" value="ISTJ" />
                  <el-option label="ISTP - 鉴赏家" value="ISTP" />
                  <el-option label="ISFP - 探险家" value="ISFP" />
                  <el-option label="ESTJ - 总经理" value="ESTJ" />
                  <el-option label="ESTP - 企业家" value="ESTP" />
                </el-select>
              </el-form-item>
            </div>

            <!-- 角色关联网络 -->
            <div class="relations-section">
              <h3 class="text-lg font-semibold text-cyan-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                </svg>
                角色关联网络
              </h3>

              <div class="text-sm text-gray-600 mb-4">
                💡 为角色建立关联关系，可以创造更丰富的互动体验。关联将在时空酒馆中自动激活。
              </div>

              <div v-if="!form.characterRelations?.length" class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                </svg>
                <p>暂无角色关联</p>
                <p class="text-xs mt-1">添加关联角色来丰富互动体验</p>
                <el-button
                  type="primary"
                  size="small"
                  @click="addRelation"
                  class="mt-3"
                >
                  添加关联
                </el-button>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(relation, index) in form.characterRelations"
                  :key="index"
                  class="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 关联角色ID -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        关联角色ID
                      </label>
                      <el-input
                        v-model="relation.characterId"
                        placeholder="输入关联角色的ID"
                        size="small"
                      />
                    </div>

                    <!-- 关系类型 -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        关系类型
                      </label>
                      <el-select
                        v-model="relation.relationType"
                        placeholder="选择关系类型"
                        size="small"
                        class="w-full"
                      >
                        <el-option label="互补关系" value="complementary" />
                        <el-option label="师徒关系" value="mentor_student" />
                        <el-option label="专业联盟" value="professional" />
                        <el-option label="守护关系" value="protector_ward" />
                        <el-option label="文化交流" value="cultural_exchange" />
                        <el-option label="科技魔法" value="technology_magic" />
                      </el-select>
                    </div>

                    <!-- 关系描述 -->
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        关系描述
                      </label>
                      <el-input
                        v-model="relation.description"
                        placeholder="描述两人之间的关系"
                        size="small"
                      />
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex justify-end mt-3 pt-3 border-t border-cyan-200 dark:border-cyan-700">
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click="removeRelation(index)"
                    >
                      删除关联
                    </el-button>
                  </div>
                </div>

                <div class="text-center">
                  <el-button
                    type="primary"
                    size="small"
                    @click="addRelation"
                    :disabled="form.characterRelations.length >= 5"
                  >
                    添加更多关联
                  </el-button>
                </div>
              </div>
            </div>
          </div>
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
const formRef = ref<FormInstance | null>(null)
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
  systemPrompt: '',
  // 时空酒馆扩展字段
  mbti: {
    type: '',
    description: '',
    traits: [] as string[],
    compatibility: [] as string[]
  },
  characterRelations: [] as Array<{
    characterId: string
    relationType: string
    description: string
  }>
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

// 时空属性管理方法
const addRelation = () => {
  form.value.characterRelations.push({
    characterId: '',
    relationType: 'complementary',
    description: ''
  })
}

const removeRelation = (index: number) => {
  form.value.characterRelations.splice(index, 1)
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
