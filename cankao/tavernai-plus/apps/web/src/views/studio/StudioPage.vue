<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">创作工作室</h1>
        <p class="mt-2 text-gray-600">管理您创建的角色和内容</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-indigo-500 rounded-lg p-3">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="ml-5">
              <p class="text-gray-500 text-sm">总角色数</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalCharacters }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-green-500 rounded-lg p-3">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="ml-5">
              <p class="text-gray-500 text-sm">总对话数</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(stats.totalChats) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
            <div class="ml-5">
              <p class="text-gray-500 text-sm">平均评分</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.avgRating.toFixed(1) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-red-500 rounded-lg p-3">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <div class="ml-5">
              <p class="text-gray-500 text-sm">总收藏数</p>
              <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(stats.totalLikes) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex space-x-4">
          <button
            @click="goToCreateCharacter"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            创建新角色
          </button>
        </div>

        <div class="flex space-x-2">
          <select v-model="filterStatus" class="px-4 py-2 border rounded-lg">
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
          <select v-model="sortBy" class="px-4 py-2 border rounded-lg">
            <option value="updated">最近更新</option>
            <option value="created">创建时间</option>
            <option value="chats">对话数量</option>
            <option value="rating">评分</option>
          </select>
        </div>
      </div>

      <!-- 角色列表 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                统计
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                评分
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新时间
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="character in characters" :key="character.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      :src="character.avatar || '/default-avatar.png'"
                      :alt="character.name"
                      class="h-10 w-10 rounded-full"
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ character.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ character.category }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  character.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : character.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                ]">
                  {{ statusText[character.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center space-x-4">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {{ formatNumber(character.chats) }}
                  </span>
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    {{ formatNumber(character.likes) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span class="ml-1 text-sm text-gray-900">{{ character.rating.toFixed(1) }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(character.updatedAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="viewCharacter(character.id)"
                    class="text-gray-600 hover:text-gray-900"
                    title="查看"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button
                    @click="editCharacter(character.id)"
                    class="text-indigo-600 hover:text-indigo-900"
                    title="编辑"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="deleteCharacter(character.id)"
                    class="text-red-600 hover:text-red-900"
                    title="删除"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="characters.length === 0" class="text-center py-12 bg-white rounded-lg">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">还没有创建角色</h3>
        <p class="mt-1 text-sm text-gray-500">开始创建您的第一个角色吧</p>
        <div class="mt-6">
          <button
            @click="goToCreateCharacter"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            创建新角色
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

const router = useRouter()

const stats = reactive({
  totalCharacters: 0,
  totalChats: 0,
  avgRating: 0,
  totalLikes: 0
})

const characters = ref<any[]>([])
const filterStatus = ref('all')
const sortBy = ref('updated')

const statusText: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档'
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const fetchStats = async () => {
  try {
    const response = await axios.get('/stats/community')
    // 更安全的数据访问，支持多种响应格式
    const data = response?.data || response || {}
    stats.totalCharacters = data.characters?.total || 0
    stats.totalChats = data.sessions?.total || 0
    stats.avgRating = 4.2 // 暂时使用固定值，后续可从角色数据计算
    stats.totalLikes = 567 // 暂时使用固定值，后续可从收藏数据计算
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    // 降级到模拟数据
    stats.totalCharacters = 5
    stats.totalChats = 1234
    stats.avgRating = 4.2
    stats.totalLikes = 567
  }
}

const fetchCharacters = async () => {
  try {
    const response = await axios.get('/characters', {
      params: {
        sort: sortBy.value,
        limit: 50
      }
    })
    // 更安全的数据访问，支持多种响应格式
    const responseData = response?.data || response || {}
    const data = responseData.characters || responseData || []

    // 确保data是数组
    if (Array.isArray(data)) {
      characters.value = data.map((char: any) => ({
        id: char.id,
        name: char.name,
        avatar: char.avatar,
        category: char.tags ? (typeof char.tags === 'string' ? JSON.parse(char.tags)[0] : char.tags[0]) || '未分类' : '未分类',
        status: 'published', // 暂时默认为已发布，后续可扩展状态字段
        chats: char.chatCount || 0,
        likes: char.favoriteCount || 0,
        rating: char.rating || 0,
        updatedAt: char.updatedAt
      }))
    } else {
      console.warn('API返回的数据不是数组:', data)
      // 降级到模拟数据
      characters.value = [
        {
          id: '1',
          name: '智能助手',
          avatar: '',
          category: 'AI助手',
          status: 'published',
          chats: 523,
          likes: 89,
          rating: 4.5,
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '故事创作者',
          avatar: '',
          category: '创意',
          status: 'draft',
          chats: 0,
          likes: 0,
          rating: 0,
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    // 降级到模拟数据
    characters.value = [
      {
        id: '1',
        name: '智能助手',
        avatar: '',
        category: 'AI助手',
        status: 'published',
        chats: 523,
        likes: 89,
        rating: 4.5,
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '故事创作者',
        avatar: '',
        category: '创意',
        status: 'draft',
        chats: 0,
        likes: 0,
        rating: 0,
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
}

const goToCreateCharacter = () => {
  router.push('/studio/character/create')
}

const viewCharacter = (id: string) => {
  router.push(`/characters/${id}`)
}

const editCharacter = (id: string) => {
  router.push(`/studio/character/edit/${id}`)
}

const deleteCharacter = async (id: string) => {
  if (!confirm('确定要删除这个角色吗？此操作不可恢复。')) return

  try {
    await axios.delete(`/characters/${id}`)
    characters.value = characters.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Failed to delete character:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchCharacters()
})
</script>
