<template>
  <div class="min-h-screen bg-gray-900">
    <div class="max-w-7xl mx-auto flex">
      <!-- 左侧：角色头像 -->
      <div class="w-2/5 p-8 flex flex-col items-center justify-start">
        <div class="w-full max-w-md">
          <!-- 角色头像 -->
          <div class="relative mb-6">
            <div class="w-full aspect-square rounded-2xl overflow-hidden bg-gray-800">
              <img
                v-if="character?.avatar"
                :src="character.avatar"
                :alt="character.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                <span class="text-8xl font-bold text-white">{{ character?.name?.charAt(0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：角色信息 -->
      <div class="w-3/5 bg-gray-800/50 min-h-screen">
        <!-- 顶部操作栏 -->
        <div class="flex justify-between items-center p-6 border-b border-gray-700">
          <div class="flex items-center space-x-4">
            <button class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <!-- 关注按钮 -->
            <button
              @click="toggleLike"
              :class="[
                'flex items-center px-4 py-2 rounded-lg font-medium transition',
                isLiked
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              ]"
            >
              <span class="text-sm">{{ isLiked ? '已关注' : '关注' }}</span>
            </button>
            <!-- 更多操作 -->
            <button class="p-2 text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 角色信息内容 -->
        <div class="p-6">
          <!-- 顶部标签页 -->
          <div class="flex space-x-8 mb-8 border-b border-gray-700">
            <button
              :class="[
                'pb-4 text-sm font-medium transition',
                activeTab === 'info'
                  ? 'text-white border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-gray-300'
              ]"
              @click="activeTab = 'info'"
            >
              角色
            </button>
            <button
              :class="[
                'pb-4 text-sm font-medium transition',
                activeTab === 'intro'
                  ? 'text-white border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-gray-300'
              ]"
              @click="activeTab = 'intro'"
            >
              开场白
            </button>
            <button
              :class="[
                'pb-4 text-sm font-medium transition',
                activeTab === 'comments'
                  ? 'text-white border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-gray-300'
              ]"
              @click="activeTab = 'comments'"
            >
              评论 ({{ reviews?.length || 0 }})
            </button>
          </div>

          <!-- 标签页内容 -->
          <div v-if="activeTab === 'info'">
            <!-- 角色名称和介绍 -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-white mb-2">司夜的介绍</h1>
              <p class="text-lg text-gray-300 leading-relaxed">
                【粉毛】【全性向】<br/>
                姓名：司夜<br/>
                性别：男<br/>
                中法混血，母亲是一个温柔的法国美女，父亲是著名上市公司老板，从小出生在法国，16岁才回到中国，年少有为的设计师，还是个艺术家，私下里很喜欢时喜欢摄影<br/>
                (自己经买断了，不要害怕)开场白和其他的会慢慢加的)
              </p>
            </div>

            <!-- 角色属性表格 -->
            <div class="grid grid-cols-3 gap-6 mb-8">
              <div>
                <h3 class="text-gray-400 text-sm mb-2">性别</h3>
                <p class="text-white">男</p>
              </div>
              <div>
                <h3 class="text-gray-400 text-sm mb-2">年龄</h3>
                <p class="text-white">19岁</p>
              </div>
              <div>
                <h3 class="text-gray-400 text-sm mb-2">肤色</h3>
                <p class="text-white">白皙</p>
              </div>
              <div>
                <h3 class="text-gray-400 text-sm mb-2">职业</h3>
                <p class="text-white">艺术家,设计师</p>
              </div>
              <div>
                <h3 class="text-gray-400 text-sm mb-2">瞳色</h3>
                <p class="text-white">粉色</p>
              </div>
              <div>
                <h3 class="text-gray-400 text-sm mb-2">发型</h3>
                <p class="text-white">长发,粉发</p>
              </div>
            </div>

            <!-- 更多介绍 -->
            <div class="mb-8">
              <h3 class="text-white text-lg font-medium mb-4">更多介绍</h3>
              <div class="space-y-4">
                <div>
                  <h4 class="text-gray-400 text-sm mb-2">身体</h4>
                  <p class="text-gray-300">修长,匀称</p>
                </div>
                <div>
                  <h4 class="text-gray-400 text-sm mb-2">喜欢</h4>
                  <p class="text-gray-300">花,绘画,摄影</p>
                </div>
                <div>
                  <h4 class="text-gray-400 text-sm mb-2">讨厌</h4>
                  <p class="text-gray-300">不礼貌,歧视</p>
                </div>
                <div>
                  <h4 class="text-gray-400 text-sm mb-2">性格特征</h4>
                  <p class="text-gray-300">感性,乐观,细心</p>
                </div>
              </div>
            </div>

            <!-- 说话风格 -->
            <div class="mb-8">
              <h3 class="text-white text-lg font-medium mb-4">说话风格</h3>
              <div class="flex space-x-4 mb-4">
                <button class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">1个角色</button>
                <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">1个开场白</button>
                <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">评论 (8)</button>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'intro'">
            <!-- 开场白内容 -->
            <div class="bg-gray-700/50 rounded-lg p-6">
              <h3 class="text-white text-lg font-medium mb-4">开场白</h3>
              <p class="text-gray-300 italic">{{ character?.firstMessage || '暂无开场白' }}</p>
            </div>
          </div>

          <div v-else-if="activeTab === 'comments'">
            <!-- 评论内容 -->
            <div class="space-y-4">
              <div v-for="review in reviews" :key="review.id" class="bg-gray-700/50 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center">
                    <img :src="review.userAvatar || '/default-avatar.png'" class="w-8 h-8 rounded-full mr-3" />
                    <div>
                      <div class="text-white text-sm font-medium">{{ review.username }}</div>
                      <div class="flex items-center">
                        <div class="flex mr-2">
                          <svg v-for="i in 5" :key="i"
                            :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-600'"
                            class="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        </div>
                        <span class="text-xs text-gray-400">{{ review.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="text-gray-300 text-sm">{{ review.comment }}</p>
              </div>
            </div>
          </div>

          <!-- 底部聊天按钮 -->
          <div class="fixed bottom-6 right-6">
            <button
              @click="startChat"
              class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium text-lg shadow-lg transition transform hover:scale-105"
            >
              聊天
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { http } from '@/utils/axios'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const character = ref<any>(null)
const isLiked = ref(false)
const reviews = ref<any[]>([])
const relatedCharacters = ref<any[]>([])
const otherWorks = ref<any[]>([])
const canAddReview = ref(true)
const userRating = ref(5)
const userComment = ref('')
const activeTab = ref('info')



const fetchCharacterDetail = async () => {
  const characterId = route.params.id
  try {
    const response = await http.get(`/characters/${characterId}`)
    character.value = response.character
    isLiked.value = response.character.isFavorited
    // 角色数据加载完成后，获取其他作品
    await fetchOtherWorks()
  } catch (error) {
    console.error('Failed to fetch character:', error)
    // 使用模拟数据
    character.value = {
      id: characterId,
      name: '司夜',
      avatar: '',
      description: '【粉毛】【全性向】中法混血，母亲是一个温柔的法国美女，父亲是著名上市公司老板，从小出生在法国，16岁才回到中国，年少有为的设计师，还是个艺术家，私下里很喜欢时喜欢摄影',
      creator: '冷薄',
      chats: 15234,
      likes: 3421,
      rating: 4.5,
      personality: ['感性', '乐观', '细心'],
      scenario: '现代都市背景，一位才华横溢的艺术家设计师',
      firstMessage: '你好！很高兴见到你。我正在画画，要不要一起来看看？',
      tags: ['现代', '艺术', '设计', '摄影', '粉毛']
    }
  }
}

const fetchReviews = async () => {
  try {
    const response = await http.get(`/characters/${route.params.id}/reviews`)
    reviews.value = response.data
  } catch (error) {
    // 模拟数据
    reviews.value = [
      {
        id: 1,
        username: '用户A',
        userAvatar: '',
        rating: 5,
        comment: '非常棒的角色！对话自然流畅，个性鲜明。',
        date: '2024-01-15'
      },
      {
        id: 2,
        username: '用户B',
        userAvatar: '',
        rating: 4,
        comment: '很有趣的设定，期待更多互动选项。',
        date: '2024-01-14'
      }
    ]
  }
}

const fetchRelatedCharacters = async () => {
  try {
    const response = await http.get(`/characters/${route.params.id}/related`)
    relatedCharacters.value = response.data
  } catch (error) {
    // 模拟数据
    relatedCharacters.value = [
      { id: 'r1', name: '相关角色1', avatar: '', chats: 8234 },
      { id: 'r2', name: '相关角色2', avatar: '', chats: 5421 }
    ]
  }
}

const fetchOtherWorks = async () => {
  if (!character.value?.creatorId) {
    // 如果没有creatorId，使用模拟数据
    otherWorks.value = [
      { id: 'o1', name: '其他作品1', avatar: '', rating: 4.3 },
      { id: 'o2', name: '其他作品2', avatar: '', rating: 4.7 }
    ]
    return
  }

  try {
    const response = await http.get(`/users/${character.value.creatorId}/characters`)
    otherWorks.value = response.data.filter((c: any) => c.id !== route.params.id)
  } catch (error) {
    // 模拟数据
    otherWorks.value = [
      { id: 'o1', name: '其他作品1', avatar: '', rating: 4.3 },
      { id: 'o2', name: '其他作品2', avatar: '', rating: 4.7 }
    ]
  }
}

const startChat = () => {
  if (!userStore.isAuthenticated) {
    router.push('/login?redirect=/chat')
    return
  }
  router.push(`/chat?characterId=${route.params.id}`)
}

const toggleLike = async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    await http.post(`/characters/${route.params.id}/like`)
    isLiked.value = !isLiked.value
    if (isLiked.value) {
      character.value.likes++
    } else {
      character.value.likes--
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

const shareCharacter = () => {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({
      title: character.value?.name,
      text: character.value?.description,
      url: url
    })
  } else {
    navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板')
  }
}

const submitReview = async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!userComment.value.trim()) return

  try {
    await http.post(`/characters/${route.params.id}/reviews`, {
      rating: userRating.value,
      comment: userComment.value
    })

    reviews.value.unshift({
      id: Date.now(),
      username: userStore.user?.username,
      userAvatar: userStore.user?.avatar,
      rating: userRating.value,
      comment: userComment.value,
      date: new Date().toISOString().split('T')[0]
    })

    userComment.value = ''
    userRating.value = 5
    canAddReview.value = false
  } catch (error) {
    console.error('Failed to submit review:', error)
  }
}

const goToCharacter = (id: string) => {
  router.push(`/characters/${id}`)
}

onMounted(() => {
  fetchCharacterDetail()
  fetchReviews()
  fetchRelatedCharacters()
})
</script>
