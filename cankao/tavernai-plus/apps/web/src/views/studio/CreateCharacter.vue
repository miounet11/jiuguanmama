<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">创建新角色</h1>
        <p class="mt-2 text-gray-600">设计您的独特角色，赋予它生命力</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-8">
        <!-- 基本信息 -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4">基本信息</h2>

          <div class="grid grid-cols-1 gap-6">
            <!-- 头像上传 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">角色头像</label>
              <div class="flex items-center space-x-4">
                <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  <img v-if="formData.avatar" :src="formData.avatar" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                </div>
                <button type="button" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  选择图片
                </button>
              </div>
            </div>

            <!-- 角色名称 -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                角色名称 <span class="text-red-500">*</span>
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="给您的角色起个名字"
              />
            </div>

            <!-- 角色分类 -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                角色分类 <span class="text-red-500">*</span>
              </label>
              <select
                id="category"
                v-model="formData.category"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">请选择分类</option>
                <option value="anime">动漫</option>
                <option value="game">游戏</option>
                <option value="movie">电影</option>
                <option value="book">书籍</option>
                <option value="original">原创</option>
                <option value="historical">历史</option>
                <option value="vtuber">VTuber</option>
                <option value="assistant">AI助手</option>
              </select>
            </div>

            <!-- 简短描述 -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                简短描述 <span class="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                v-model="formData.description"
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="用几句话介绍您的角色"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 角色设定 -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4">角色设定</h2>

          <div class="space-y-6">
            <!-- 性格特征 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">性格特征</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="trait in formData.personality"
                  :key="trait"
                  class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center"
                >
                  {{ trait }}
                  <button
                    type="button"
                    @click="removePersonalityTrait(trait)"
                    class="ml-2 text-indigo-500 hover:text-indigo-700"
                  >
                    ×
                  </button>
                </span>
              </div>
              <div class="flex space-x-2">
                <input
                  v-model="newTrait"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="添加性格特征"
                  @keypress.enter.prevent="addPersonalityTrait"
                />
                <button
                  type="button"
                  @click="addPersonalityTrait"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  添加
                </button>
              </div>
            </div>

            <!-- 背景故事 -->
            <div>
              <label for="background" class="block text-sm font-medium text-gray-700 mb-1">
                背景故事
              </label>
              <textarea
                id="background"
                v-model="formData.background"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="描述角色的背景故事"
              ></textarea>
            </div>

            <!-- 场景设定 -->
            <div>
              <label for="scenario" class="block text-sm font-medium text-gray-700 mb-1">
                场景设定
              </label>
              <textarea
                id="scenario"
                v-model="formData.scenario"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="设定对话发生的场景"
              ></textarea>
            </div>

            <!-- 开场白 -->
            <div>
              <label for="firstMessage" class="block text-sm font-medium text-gray-700 mb-1">
                开场白 <span class="text-red-500">*</span>
              </label>
              <textarea
                id="firstMessage"
                v-model="formData.firstMessage"
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="角色的第一句话"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 高级设置 -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium mb-4">高级设置</h2>

          <div class="space-y-4">
            <!-- 可见性 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">可见性</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="formData.visibility"
                    type="radio"
                    value="public"
                    class="mr-2"
                  />
                  <span>公开 - 所有人都可以使用</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="formData.visibility"
                    type="radio"
                    value="unlisted"
                    class="mr-2"
                  />
                  <span>不公开 - 仅通过链接访问</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="formData.visibility"
                    type="radio"
                    value="private"
                    class="mr-2"
                  />
                  <span>私有 - 仅自己可用</span>
                </label>
              </div>
            </div>

            <!-- NSFW标记 -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="formData.isNSFW"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm font-medium text-gray-700">包含成人内容 (NSFW)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="saveDraft"
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            保存草稿
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            发布角色
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

const router = useRouter()

const formData = reactive({
  name: '',
  avatar: '',
  category: '',
  description: '',
  personality: [] as string[],
  background: '',
  scenario: '',
  firstMessage: '',
  visibility: 'public',
  isNSFW: false
})

const newTrait = ref('')

const addPersonalityTrait = () => {
  if (newTrait.value.trim() && !formData.personality.includes(newTrait.value.trim())) {
    formData.personality.push(newTrait.value.trim())
    newTrait.value = ''
  }
}

const removePersonalityTrait = (trait: string) => {
  formData.personality = formData.personality.filter(t => t !== trait)
}

const handleSubmit = async () => {
  try {
    const response = await axios.post('/api/characters', {
      ...formData,
      status: 'published'
    })

    router.push(`/characters/${response.data.id}`)
  } catch (error) {
    console.error('Failed to create character:', error)
    alert('创建角色失败，请稍后再试')
  }
}

const saveDraft = async () => {
  try {
    await axios.post('/api/characters', {
      ...formData,
      status: 'draft'
    })

    router.push('/studio')
  } catch (error) {
    console.error('Failed to save draft:', error)
    alert('保存草稿失败，请稍后再试')
  }
}
</script>
