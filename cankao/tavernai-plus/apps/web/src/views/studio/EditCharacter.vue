<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">编辑角色</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">修改角色设定，完善角色形象</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <el-icon class="is-loading text-4xl text-blue-500"><Loading /></el-icon>
        <p class="mt-4 text-gray-500">加载角色数据中...</p>
      </div>

      <div v-else-if="!character" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">角色不存在或无权访问</p>
        <el-button type="primary" @click="$router.go(-1)" class="mt-4">
          返回
        </el-button>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-8">
        <!-- 基本信息 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4 text-gray-900 dark:text-white">基本信息</h2>

          <div class="grid grid-cols-1 gap-6">
            <!-- 头像显示 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色头像</label>
              <div class="flex items-center space-x-4">
                <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img v-if="formData.avatar" :src="formData.avatar" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <el-icon :size="32"><Avatar /></el-icon>
                  </div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  <p>头像文件: {{ formData.avatar || '未设置' }}</p>
                </div>
              </div>
            </div>

            <!-- 角色名称 -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                角色名称 <span class="text-red-500">*</span>
              </label>
              <el-input
                id="name"
                v-model="formData.name"
                placeholder="给您的角色起个名字"
                required
              />
            </div>

            <!-- 角色分类 -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                角色分类 <span class="text-red-500">*</span>
              </label>
              <el-select
                id="category"
                v-model="formData.category"
                placeholder="请选择分类"
                class="w-full"
                required
              >
                <el-option label="动漫" value="动漫" />
                <el-option label="游戏" value="游戏" />
                <el-option label="电影" value="电影" />
                <el-option label="书籍" value="书籍" />
                <el-option label="原创" value="原创" />
                <el-option label="历史" value="历史" />
                <el-option label="VTuber" value="VTuber" />
                <el-option label="AI助手" value="AI助手" />
              </el-select>
            </div>

            <!-- 简短描述 -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简短描述 <span class="text-red-500">*</span>
              </label>
              <el-input
                id="description"
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="用几句话介绍您的角色"
                required
              />
            </div>

            <!-- 标签 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <el-tag
                  v-for="tag in formData.tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="flex space-x-2">
                <el-input
                  v-model="newTag"
                  placeholder="添加标签"
                  @keyup.enter="addTag"
                  class="flex-1"
                />
                <el-button type="primary" @click="addTag">
                  添加
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 角色设定 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4 text-gray-900 dark:text-white">角色设定</h2>

          <div class="space-y-6">
            <!-- 性格描述 -->
            <div>
              <label for="personality" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                性格描述
              </label>
              <el-input
                id="personality"
                v-model="formData.personality"
                type="textarea"
                :rows="3"
                placeholder="描述角色的性格特征"
              />
            </div>

            <!-- 背景故事 -->
            <div>
              <label for="backstory" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                背景故事
              </label>
              <el-input
                id="backstory"
                v-model="formData.backstory"
                type="textarea"
                :rows="4"
                placeholder="描述角色的背景故事"
              />
            </div>

            <!-- 说话风格 -->
            <div>
              <label for="speakingStyle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                说话风格
              </label>
              <el-input
                id="speakingStyle"
                v-model="formData.speakingStyle"
                type="textarea"
                :rows="2"
                placeholder="描述角色的说话风格和语言特点"
              />
            </div>

            <!-- 场景设定 -->
            <div>
              <label for="scenario" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                场景设定
              </label>
              <el-input
                id="scenario"
                v-model="formData.scenario"
                type="textarea"
                :rows="3"
                placeholder="设定对话发生的场景"
              />
            </div>

            <!-- 开场白 -->
            <div>
              <label for="firstMessage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                开场白 <span class="text-red-500">*</span>
              </label>
              <el-input
                id="firstMessage"
                v-model="formData.firstMessage"
                type="textarea"
                :rows="3"
                placeholder="角色的第一句话"
                required
              />
            </div>

            <!-- 系统提示词 -->
            <div>
              <label for="systemPrompt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                系统提示词
              </label>
              <el-input
                id="systemPrompt"
                v-model="formData.systemPrompt"
                type="textarea"
                :rows="3"
                placeholder="角色的系统行为指令"
              />
            </div>

            <!-- 对话示例 -->
            <div>
              <label for="exampleDialogs" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                对话示例
              </label>
              <el-input
                id="exampleDialogs"
                v-model="formData.exampleDialogs"
                type="textarea"
                :rows="4"
                placeholder="提供一些角色对话的示例"
              />
            </div>
          </div>
        </div>

        <!-- 剧本关联 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <ScenarioSelector
            :character-id="characterId!"
            @updated="onScenariosUpdated"
          />
        </div>

        <!-- AI 设置 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4 text-gray-900 dark:text-white">AI 设置</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- AI 模型 -->
            <div>
              <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                AI 模型
              </label>
              <el-select
                id="model"
                v-model="formData.model"
                placeholder="选择 AI 模型"
                class="w-full"
              >
                <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
                <el-option label="GPT-4" value="gpt-4" />
                <el-option label="Grok-3" value="grok-3" />
                <el-option label="Claude-3 Haiku" value="claude-3-haiku" />
                <el-option label="Claude-3 Sonnet" value="claude-3-sonnet" />
              </el-select>
            </div>

            <!-- 创造性 -->
            <div>
              <label for="temperature" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                创造性 ({{ formData.temperature }})
              </label>
              <el-slider
                id="temperature"
                v-model="formData.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                show-stops
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>保守</span>
                <span>平衡</span>
                <span>创造</span>
              </div>
            </div>

            <!-- 最大回复长度 -->
            <div>
              <label for="maxTokens" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最大回复长度
              </label>
              <el-input-number
                id="maxTokens"
                v-model="formData.maxTokens"
                :min="100"
                :max="4000"
                :step="100"
                class="w-full"
              />
            </div>

            <!-- 语言设置 -->
            <div>
              <label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                语言
              </label>
              <el-select
                id="language"
                v-model="formData.language"
                placeholder="选择语言"
                class="w-full"
              >
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
                <el-option label="日本語" value="ja-JP" />
                <el-option label="한국어" value="ko-KR" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 权限设置 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4 text-gray-900 dark:text-white">权限设置</h2>

          <div class="space-y-4">
            <!-- 可见性 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">可见性</label>
              <el-radio-group v-model="formData.isPublic">
                <div class="space-y-2">
                  <el-radio :label="true">
                    <div>
                      <div class="font-medium">公开</div>
                      <div class="text-sm text-gray-500">所有人都可以查看和使用</div>
                    </div>
                  </el-radio>
                  <el-radio :label="false">
                    <div>
                      <div class="font-medium">私有</div>
                      <div class="text-sm text-gray-500">仅自己可见和使用</div>
                    </div>
                  </el-radio>
                </div>
              </el-radio-group>
            </div>

            <!-- NSFW标记 -->
            <div>
              <el-checkbox v-model="formData.isNSFW">
                <div>
                  <div class="font-medium">包含成人内容 (NSFW)</div>
                  <div class="text-sm text-gray-500">标记此角色包含成人或敏感内容</div>
                </div>
              </el-checkbox>
            </div>

            <!-- 特色推荐 -->
            <div v-if="isAdmin">
              <el-checkbox v-model="formData.isFeatured">
                <div>
                  <div class="font-medium">特色推荐</div>
                  <div class="text-sm text-gray-500">在首页和推荐位置展示</div>
                </div>
              </el-checkbox>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-end space-x-4">
          <el-button @click="$router.go(-1)">
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleSubmit"
          >
            保存角色
          </el-button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Avatar } from '@element-plus/icons-vue'
import ScenarioSelector from '@/components/character/ScenarioSelector.vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const characterId = computed(() => route.params.id as string)
const isAdmin = computed(() => userStore.user?.isAdmin || false)

// 状态管理
const loading = ref(true)
const saving = ref(false)
const character = ref<any>(null)

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  fullDescription: '',
  personality: '',
  backstory: '',
  speakingStyle: '',
  scenario: '',
  firstMessage: '',
  systemPrompt: '',
  exampleDialogs: '',
  avatar: '',
  coverImage: '',
  category: '原创',
  tags: [] as string[],
  language: 'zh-CN',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  isPublic: true,
  isNSFW: false,
  isFeatured: false
})

const newTag = ref('')

// 生命周期
onMounted(() => {
  loadCharacter()
})

// 方法
async function loadCharacter() {
  loading.value = true
  try {
    const response = await fetch(`/api/characters/${characterId.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      character.value = data.character

      // 填充表单数据
      Object.assign(formData, {
        name: character.value.name || '',
        description: character.value.description || '',
        fullDescription: character.value.fullDescription || '',
        personality: character.value.personality || '',
        backstory: character.value.backstory || '',
        speakingStyle: character.value.speakingStyle || '',
        scenario: character.value.scenario || '',
        firstMessage: character.value.firstMessage || '',
        systemPrompt: character.value.systemPrompt || '',
        exampleDialogs: character.value.exampleDialogs || '',
        avatar: character.value.avatar || '',
        coverImage: character.value.coverImage || '',
        category: character.value.category || '原创',
        tags: typeof character.value.tags === 'string'
          ? JSON.parse(character.value.tags || '[]')
          : character.value.tags || [],
        language: character.value.language || 'zh-CN',
        model: character.value.model || 'gpt-3.5-turbo',
        temperature: character.value.temperature || 0.7,
        maxTokens: character.value.maxTokens || 1000,
        isPublic: character.value.isPublic,
        isNSFW: character.value.isNSFW || false,
        isFeatured: character.value.isFeatured || false
      })
    } else {
      ElMessage.error('加载角色失败')
    }
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    const response = await fetch(`/api/characters/${characterId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        ...formData,
        tags: JSON.stringify(formData.tags)
      })
    })

    if (response.ok) {
      ElMessage.success('角色更新成功')
      router.push(`/characters/${characterId.value}`)
    } else {
      const error = await response.json()
      ElMessage.error(error.message || '更新角色失败')
    }
  } catch (error) {
    console.error('更新角色失败:', error)
    ElMessage.error('更新角色失败')
  } finally {
    saving.value = false
  }
}

function addTag() {
  if (newTag.value.trim() && !formData.tags.includes(newTag.value.trim())) {
    formData.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

function removeTag(tag: string) {
  formData.tags = formData.tags.filter(t => t !== tag)
}

function onScenariosUpdated() {
  ElMessage.success('剧本关联已更新')
}
</script>

<style scoped>
.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
