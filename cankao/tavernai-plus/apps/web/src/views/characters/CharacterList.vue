<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题和搜索栏 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">探索角色</h1>

        <!-- 搜索和筛选 -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索角色..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                @input="handleSearch"
              />
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <!-- 分类筛选 -->
          <select
            v-model="selectedCategory"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            @change="filterByCategory"
          >
            <option value="">所有分类</option>
            <option value="anime">动漫</option>
            <option value="game">游戏</option>
            <option value="movie">电影</option>
            <option value="book">书籍</option>
            <option value="original">原创</option>
            <option value="historical">历史</option>
            <option value="vtuber">VTuber</option>
          </select>

          <!-- 排序 -->
          <select
            v-model="sortBy"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            @change="sortCharacters"
          >
            <option value="popular">最受欢迎</option>
            <option value="newest">最新添加</option>
            <option value="rating">评分最高</option>
            <option value="chats">对话最多</option>
          </select>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- 角色列表 -->
      <div v-else-if="characters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="character in characters"
          :key="character.id"
          class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
          @click="goToCharacterDetail(character.id)"
        >
          <!-- 角色图片 -->
          <div class="relative h-64 bg-gradient-to-br from-purple-400 to-pink-400">
            <img
              v-if="character.avatar"
              :src="character.avatar"
              :alt="character.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-white text-4xl font-bold">{{ character.name.charAt(0) }}</span>
            </div>

            <!-- 标签 -->
            <div v-if="character.isNew" class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
              新
            </div>
            <div v-if="character.isPremium" class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
              高级
            </div>
          </div>

          <!-- 角色信息 -->
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 truncate">{{ character.name }}</h3>
            <p class="text-gray-600 text-sm mb-2">创建者: {{ character.creator }}</p>
            <p class="text-gray-500 text-sm line-clamp-2 mb-3">{{ character.description }}</p>

            <!-- 统计信息 -->
            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  {{ formatNumber(character.chats) }}
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  {{ formatNumber(character.likes) }}
                </span>
              </div>
              <div class="flex items-center">
                <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <span class="ml-1">{{ character.rating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">没有找到角色</h3>
        <p class="mt-1 text-sm text-gray-500">试试调整筛选条件或搜索其他内容</p>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="mt-8 flex justify-center">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          <button
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            @click="goToPage(currentPage - 1)"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            :class="[
              page === currentPage
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            @click="goToPage(currentPage + 1)"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

const router = useRouter()

interface Character {
  id: string
  name: string
  avatar: string
  description: string
  creator: string
  category: string
  chats: number
  likes: number
  rating: number
  isNew: boolean
  isPremium: boolean
}

const characters = ref<Character[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('popular')
const currentPage = ref(1)
const itemsPerPage = 12
const totalItems = ref(0)

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const fetchCharacters = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value,
      category: selectedCategory.value,
      sort: sortBy.value
    }

    const response = await axios.get('/characters', { params })

    // 处理响应数据，适配不同格式
    // 注意：axios拦截器已经返回了response.data，所以response就是实际数据
    if (response.success) {
      // 转换数据格式以匹配前端需求
      characters.value = response.characters.map((char: any) => ({
        id: char.id,
        name: char.name || '未命名角色',
        avatar: char.avatar || '',
        description: char.description || '暂无描述',
        creator: char.creator?.username || char.creator?.name || '匿名用户',
        category: Array.isArray(char.tags) ? char.tags[0] : 'original',
        chats: char.chatCount || 0,
        likes: char.favoriteCount || 0,
        rating: char.rating || 4.0,
        isNew: char.isNew || false,
        isPremium: char.isPremium || false
      }))

      totalItems.value = response.pagination?.total || response.characters.length
    } else {
      // 如果没有success标记，尝试直接使用数据
      if (Array.isArray(response)) {
        characters.value = response.map((char: any) => ({
          id: char.id,
          name: char.name || '未命名角色',
          avatar: char.avatar || '',
          description: char.description || '暂无描述',
          creator: char.creator?.username || '匿名用户',
          category: 'original',
          chats: char.chatCount || 0,
          likes: char.favoriteCount || 0,
          rating: char.rating || 4.0,
          isNew: false,
          isPremium: false
        }))
        totalItems.value = response.length
      } else {
        throw new Error('Unexpected response format')
      }
    }
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    // 使用模拟数据作为后备
    characters.value = generateMockCharacters()
    totalItems.value = 50
  } finally {
    isLoading.value = false
  }
}

const generateMockCharacters = (): Character[] => {
  const mockNames = ['艾莉亚', '赛博朋克2077', '原神角色', '火影忍者', '初音未来', '洛天依', 'AI助手', '虚拟偶像']
  const mockCategories = ['anime', 'game', 'movie', 'book', 'original', 'historical', 'vtuber']

  return Array.from({ length: 12 }, (_, i) => ({
    id: `char-${i + 1}`,
    name: mockNames[i % mockNames.length] + (i > 7 ? ` ${i - 7}` : ''),
    avatar: '',
    description: '这是一个有趣的角色，拥有独特的个性和背景故事。快来和我聊天吧！',
    creator: `用户${Math.floor(Math.random() * 1000)}`,
    category: mockCategories[i % mockCategories.length],
    chats: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 10000),
    rating: 3.5 + Math.random() * 1.5,
    isNew: Math.random() > 0.7,
    isPremium: Math.random() > 0.8
  }))
}

const handleSearch = () => {
  currentPage.value = 1
  fetchCharacters()
}

const filterByCategory = () => {
  currentPage.value = 1
  fetchCharacters()
}

const sortCharacters = () => {
  currentPage.value = 1
  fetchCharacters()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchCharacters()
  }
}

const goToCharacterDetail = (id: string) => {
  router.push(`/characters/${id}`)
}

onMounted(() => {
  fetchCharacters()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
