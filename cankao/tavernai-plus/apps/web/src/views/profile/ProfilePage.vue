<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-6">
          <img
            :src="user?.avatar || '/default-avatar.png'"
            :alt="user?.username"
            class="w-20 h-20 rounded-full"
          />
          <div>
            <h1 class="text-2xl font-bold">{{ user?.username }}</h1>
            <p class="text-gray-600">{{ user?.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">账户信息</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-gray-500">注册时间:</span>
                <span class="ml-2">{{ formatDate(user?.createdAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">会员等级:</span>
                <span class="ml-2">{{ user?.tier || '免费用户' }}</span>
              </div>
            </div>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">使用统计</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-gray-500">创建角色:</span>
                <span class="ml-2">{{ stats?.charactersCreated || 0 }}</span>
              </div>
              <div>
                <span class="text-gray-500">总对话数:</span>
                <span class="ml-2">{{ stats?.totalChats || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">配额使用</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-gray-500">本月消息:</span>
                <span class="ml-2">{{ stats?.monthlyMessages || 0 }} / {{ stats?.messageLimit || '无限' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Token使用:</span>
                <span class="ml-2">{{ formatNumber(stats?.tokensUsed || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from '@/utils/axios'

const userStore = useUserStore()
const user = ref(userStore.user)
const stats = ref<any>({})

const formatDate = (date: any) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const fetchUserStats = async () => {
  try {
    const response = await axios.get('/api/user/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
  }
}

onMounted(() => {
  fetchUserStats()
})
</script>
