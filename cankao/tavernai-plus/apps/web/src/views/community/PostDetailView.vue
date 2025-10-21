<template>
  <div class="post-detail-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 返回按钮 -->
      <div class="mb-6">
        <el-button @click="goBack" class="mb-4">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <div class="max-w-4xl mx-auto">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center py-12">
          <el-icon class="text-4xl text-purple-400 animate-spin"><Loading /></el-icon>
          <p class="text-gray-400 mt-4">正在加载动态...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="text-center py-12">
          <el-icon class="text-6xl text-red-500 mb-4"><Warning /></el-icon>
          <p class="text-gray-400 text-lg">{{ error }}</p>
          <el-button @click="loadPost" class="mt-4">重新加载</el-button>
        </div>

        <!-- 动态详情 -->
        <div v-else-if="post" class="space-y-6">
          <!-- 动态卡片 -->
          <PostCard
            :post="post"
            @like="handleLikePost"
            @comment="scrollToComments"
            @share="handleSharePost"
            @delete="handleDeletePost"
          />

          <!-- 评论区域 -->
          <div ref="commentsSection" class="glass-card p-6">
            <CommentSection
              :post-id="postId"
              @comment-created="handleCommentCreated"
            />
          </div>

          <!-- 相关推荐 -->
          <div v-if="relatedPosts.length > 0" class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">相关推荐</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="relatedPost in relatedPosts"
                :key="relatedPost.id"
                class="cursor-pointer p-4 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-all duration-200"
                @click="goToPost(relatedPost.id)"
              >
                <div class="flex items-start space-x-3">
                  <el-avatar :size="32" :src="relatedPost.user?.avatar">
                    {{ relatedPost.user?.username?.charAt(0)?.toUpperCase() || '?' }}
                  </el-avatar>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-white text-sm">{{ relatedPost.user?.username || '未知用户' }}</div>
                    <p class="text-gray-300 text-sm line-clamp-2 mt-1">{{ relatedPost.content }}</p>
                    <div class="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>{{ relatedPost.likeCount }} 赞</span>
                      <span>{{ relatedPost.commentCount }} 评论</span>
                      <span>{{ formatTime(relatedPost.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/community'
import { Post } from '@/types/community'
import PostCard from '@/components/community/PostCard.vue'
import CommentSection from '@/components/community/CommentSection.vue'
import { ArrowLeft, Loading, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const post = ref<Post | null>(null)
const relatedPosts = ref<Post[]>([])
const commentsSection = ref<HTMLElement>()

// 获取动态ID
const postId = route.params.postId as string

// 方法
const loadPost = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await communityStore.getPost(postId)

    if (response.success && response.data) {
      post.value = response.data
      // 加载相关推荐
      await loadRelatedPosts()
    } else {
      throw new Error(response.error || '动态不存在或已删除')
    }
  } catch (err) {
    console.error('加载动态失败:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const loadRelatedPosts = async () => {
  try {
    if (!post.value) return

    // 根据标签或用户获取相关动态
    const response = await communityStore.getPosts({
      tags: post.value.tags,
      userId: post.value.userId,
      page: 1,
      pageSize: 4
    })

    if (response.success && response.data) {
      // 排除当前动态
      relatedPosts.value = response.data.data.filter(p => p.id !== postId).slice(0, 3)
    }
  } catch (error) {
    console.error('加载相关动态失败:', error)
  }
}

const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN
    })
  } catch {
    return '刚刚'
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/community')
  }
}

const scrollToComments = () => {
  if (commentsSection.value) {
    commentsSection.value.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleLikePost = async () => {
  if (!post.value) return

  try {
    const response = await communityStore.toggleLikePost(post.value.id)
    if (response.success && response.data) {
      post.value.isLiked = response.data.isLiked
      post.value.likeCount = response.data.likeCount
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleSharePost = async () => {
  if (!post.value) return

  try {
    const response = await communityStore.sharePost(post.value.id)
    if (response.success) {
      post.value.shareCount++
      ElMessage.success('分享成功!')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
  }
}

const handleDeletePost = async () => {
  if (!post.value) return

  try {
    const response = await communityStore.deletePost(post.value.id)
    if (response.success) {
      ElMessage.success('删除成功!')
      router.push('/community')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

const handleCommentCreated = () => {
  if (post.value) {
    post.value.commentCount++
  }
}

const goToPost = (postId: string) => {
  router.push(`/community/post/${postId}`)
}

// 生命周期
onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-xl;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
