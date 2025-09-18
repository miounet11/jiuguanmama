<template>
  <div class="comment-section">
    <!-- 评论统计和排序 -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-white">
        评论 {{ totalCount > 0 ? `(${totalCount})` : '' }}
      </h3>
      <div class="flex items-center space-x-3">
        <span class="text-sm text-gray-400">排序:</span>
        <el-select v-model="sortBy" size="small" @change="loadComments(true)">
          <el-option label="最新" value="latest" />
          <el-option label="最热" value="popular" />
          <el-option label="最早" value="earliest" />
        </el-select>
      </div>
    </div>

    <!-- 发表评论 -->
    <div v-if="userStore.isAuthenticated" class="mb-6">
      <div class="bg-gray-800/30 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <el-avatar :size="36" :src="userStore.user?.avatar">
            {{ userStore.user?.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="flex-1">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="写下你的评论..."
              :maxlength="500"
              show-word-limit
              resize="none"
            />
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center space-x-3">
                <el-button size="small" @click="showEmojiPicker = !showEmojiPicker">
                  <el-icon><Smile /></el-icon>
                  表情
                </el-button>
                <el-button size="small" @click="showMentionPanel = !showMentionPanel">
                  <el-icon><At /></el-icon>
                  提及
                </el-button>
              </div>
              <el-button
                type="primary"
                size="small"
                @click="submitComment"
                :disabled="!newComment.trim()"
                :loading="submitting"
              >
                发表评论
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="space-y-4">
      <!-- 加载状态 -->
      <div v-if="loading && comments.length === 0" class="text-center py-8">
        <el-icon class="text-2xl text-purple-400 animate-spin"><Loading /></el-icon>
        <p class="text-gray-400 mt-2">正在加载评论...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && comments.length === 0" class="text-center py-8">
        <el-icon class="text-4xl text-gray-500 mb-2"><ChatDotRound /></el-icon>
        <p class="text-gray-400">暂无评论</p>
        <p class="text-gray-500 text-sm mt-1">
          {{ userStore.isAuthenticated ? '成为第一个评论的人吧！' : '登录后可以发表评论' }}
        </p>
      </div>

      <!-- 评论项 -->
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        @reply="handleReply"
        @like="handleLikeComment"
        @delete="handleDeleteComment"
        @load-replies="loadReplies"
      />

      <!-- 加载更多 -->
      <div v-if="hasMore" class="text-center py-4">
        <el-button @click="loadMoreComments" :loading="loadingMore">
          加载更多评论
        </el-button>
      </div>
    </div>

    <!-- 表情选择器 -->
    <EmojiPicker
      v-if="showEmojiPicker"
      @select="insertEmoji"
      @close="showEmojiPicker = false"
    />

    <!-- 提及面板 -->
    <MentionPanel
      v-if="showMentionPanel"
      @select="insertMention"
      @close="showMentionPanel = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { Comment, CommentCreateData } from '@/types/community'
import CommentItem from './CommentItem.vue'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import MentionPanel from '@/components/chat/MentionPanel.vue'
import { Smile, At, Loading, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  postId: string
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true
})

const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const comments = ref<Comment[]>([])
const newComment = ref('')
const sortBy = ref<'latest' | 'popular' | 'earliest'>('latest')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const hasMore = ref(true)

// UI状态
const showEmojiPicker = ref(false)
const showMentionPanel = ref(false)

// 方法
const loadComments = async (reset: boolean = false) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      comments.value = []
    } else {
      loadingMore.value = true
    }

    const response = await communityStore.getComments(
      props.postId,
      currentPage.value,
      pageSize.value
    )

    if (response.success && response.data) {
      if (reset) {
        comments.value = response.data.data
      } else {
        comments.value.push(...response.data.data)
      }

      totalCount.value = response.data.total
      hasMore.value = response.data.hasMore

      if (response.data.hasMore) {
        currentPage.value++
      }
    } else {
      throw new Error(response.error || '加载评论失败')
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载评论失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreComments = () => {
  if (!loadingMore.value && hasMore.value) {
    loadComments(false)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    submitting.value = true

    const data: CommentCreateData = {
      content: newComment.value,
      postId: props.postId
    }

    const response = await communityStore.createComment(data)

    if (response.success && response.data) {
      // 将新评论添加到列表顶部
      comments.value.unshift(response.data)
      totalCount.value++
      newComment.value = ''
      ElMessage.success('评论发表成功!')
    } else {
      throw new Error(response.error || '发表评论失败')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '发表评论失败')
  } finally {
    submitting.value = false
  }
}

const handleReply = async (parentId: string, content: string) => {
  try {
    const data: CommentCreateData = {
      content,
      postId: props.postId,
      parentId
    }

    const response = await communityStore.createComment(data)

    if (response.success && response.data) {
      // 找到父评论并添加回复
      const parentComment = findCommentById(comments.value, parentId)
      if (parentComment) {
        if (!parentComment.children) {
          parentComment.children = []
        }
        parentComment.children.push(response.data)
      }

      totalCount.value++
      ElMessage.success('回复发表成功!')
    } else {
      throw new Error(response.error || '发表回复失败')
    }
  } catch (error) {
    console.error('发表回复失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '发表回复失败')
  }
}

const handleLikeComment = async (commentId: string) => {
  try {
    const response = await communityStore.toggleLikeComment(commentId)

    if (response.success && response.data) {
      const comment = findCommentById(comments.value, commentId)
      if (comment) {
        comment.isLiked = response.data.isLiked
        comment.likeCount = response.data.likeCount
      }
    } else {
      throw new Error(response.error || '操作失败')
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

const handleDeleteComment = async (commentId: string) => {
  try {
    const response = await communityStore.deleteComment(commentId)

    if (response.success) {
      // 从列表中移除评论
      removeCommentById(comments.value, commentId)
      totalCount.value--
      ElMessage.success('评论删除成功!')
    } else {
      throw new Error(response.error || '删除失败')
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

const loadReplies = async (commentId: string) => {
  // 这里可以实现懒加载回复的逻辑
  console.log('加载回复:', commentId)
}

const insertEmoji = (emoji: string) => {
  newComment.value += emoji
  showEmojiPicker.value = false
}

const insertMention = (username: string) => {
  newComment.value += `@${username} `
  showMentionPanel.value = false
}

// 辅助函数
const findCommentById = (commentList: Comment[], id: string): Comment | null => {
  for (const comment of commentList) {
    if (comment.id === id) {
      return comment
    }
    if (comment.children) {
      const found = findCommentById(comment.children, id)
      if (found) return found
    }
  }
  return null
}

const removeCommentById = (commentList: Comment[], id: string): boolean => {
  for (let i = 0; i < commentList.length; i++) {
    if (commentList[i].id === id) {
      commentList.splice(i, 1)
      return true
    }
    if (commentList[i].children) {
      if (removeCommentById(commentList[i].children!, id)) {
        return true
      }
    }
  }
  return false
}

// 监听
watch(sortBy, () => {
  loadComments(true)
})

// 生命周期
onMounted(() => {
  if (props.autoLoad) {
    loadComments(true)
  }
})

// 暴露方法给父组件
defineExpose({
  loadComments,
  refresh: () => loadComments(true)
})
</script>

<style scoped>
.comment-section {
  @apply relative;
}

/* 自定义选择器样式 */
:deep(.el-select) {
  @apply w-24;
}

:deep(.el-select .el-input__inner) {
  @apply bg-gray-800 border-gray-600 text-white;
}

/* 文本域样式 */
:deep(.el-textarea__inner) {
  @apply bg-gray-900/50 border-gray-600 text-white placeholder-gray-400;
}

:deep(.el-textarea__inner:focus) {
  @apply border-purple-500;
}

/* 字数限制样式 */
:deep(.el-input__count) {
  @apply text-gray-500;
}
</style>
