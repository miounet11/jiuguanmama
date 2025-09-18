<template>
  <div class="comment-item">
    <div class="flex items-start space-x-3">
      <!-- 用户头像 -->
      <el-avatar
        :size="32"
        :src="comment.user.avatar"
        class="cursor-pointer flex-shrink-0"
        @click="goToUserProfile"
      >
        {{ comment.user.username.charAt(0).toUpperCase() }}
      </el-avatar>

      <div class="flex-1 min-w-0">
        <!-- 评论内容 -->
        <div class="bg-gray-800/30 rounded-lg p-3">
          <!-- 用户信息 -->
          <div class="flex items-center space-x-2 mb-2">
            <span
              class="font-medium text-white cursor-pointer hover:text-purple-400 transition-colors"
              @click="goToUserProfile"
            >
              {{ comment.user.username }}
            </span>
            <el-icon v-if="comment.user.isVerified" class="text-yellow-400 text-sm">
              <CircleCheck />
            </el-icon>
            <span class="text-xs text-gray-500">
              {{ formatTime(comment.createdAt) }}
            </span>
            <span v-if="comment.updatedAt !== comment.createdAt" class="text-xs text-gray-500">
              (已编辑)
            </span>
          </div>

          <!-- 评论文本 -->
          <div class="text-gray-200 whitespace-pre-wrap" v-html="formatContent(comment.content)"></div>
        </div>

        <!-- 操作栏 -->
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center space-x-4">
            <!-- 点赞按钮 -->
            <button
              :class="[
                'flex items-center space-x-1 px-2 py-1 rounded transition-all duration-200',
                comment.isLiked
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
              ]"
              @click="handleLike"
              :disabled="likeLoading"
            >
              <el-icon :class="{ 'animate-pulse': likeLoading }">
                <component :is="comment.isLiked ? 'HeartFilled' : 'Heart'" />
              </el-icon>
              <span class="text-sm">{{ comment.likeCount || '' }}</span>
            </button>

            <!-- 回复按钮 -->
            <button
              class="flex items-center space-x-1 px-2 py-1 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
              @click="toggleReply"
            >
              <el-icon><ChatLineRound /></el-icon>
              <span class="text-sm">回复</span>
            </button>

            <!-- 举报按钮 -->
            <button
              v-if="!isOwner"
              class="flex items-center space-x-1 px-2 py-1 rounded text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all duration-200"
              @click="reportComment"
            >
              <el-icon><Flag /></el-icon>
              <span class="text-sm">举报</span>
            </button>
          </div>

          <!-- 更多操作 -->
          <el-dropdown v-if="isOwner" @command="handleMenuCommand" placement="bottom-end">
            <el-button text size="small">
              <el-icon class="text-gray-500"><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="delete" class="text-red-500">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReplyInput" class="mt-3">
          <div class="flex items-start space-x-3">
            <el-avatar :size="24" :src="userStore.user?.avatar">
              {{ userStore.user?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="flex-1">
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="2"
                :placeholder="`回复 @${comment.user.username}`"
                :maxlength="200"
                show-word-limit
                resize="none"
              />
              <div class="flex items-center justify-end space-x-2 mt-2">
                <el-button size="small" @click="cancelReply">取消</el-button>
                <el-button
                  size="small"
                  type="primary"
                  @click="submitReply"
                  :disabled="!replyContent.trim()"
                  :loading="replyLoading"
                >
                  回复
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 子评论 -->
        <div v-if="comment.children && comment.children.length > 0" class="mt-4 space-y-3">
          <CommentItem
            v-for="child in comment.children"
            :key="child.id"
            :comment="child"
            :post-id="postId"
            :is-reply="true"
            @reply="handleChildReply"
            @like="$emit('like', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>

        <!-- 加载更多回复 -->
        <div v-if="hasMoreReplies" class="mt-3">
          <button
            class="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            @click="loadMoreReplies"
          >
            查看更多回复...
          </button>
        </div>

        <!-- 编辑对话框 -->
        <el-dialog v-model="showEditDialog" title="编辑评论" width="500px">
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="4"
            :maxlength="500"
            show-word-limit
            resize="none"
          />
          <template #footer>
            <div class="flex justify-end space-x-2">
              <el-button @click="showEditDialog = false">取消</el-button>
              <el-button
                type="primary"
                @click="saveEdit"
                :disabled="!editContent.trim()"
                :loading="editLoading"
              >
                保存
              </el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { Comment } from '@/types/community'
import {
  CircleCheck,
  Heart,
  HeartFilled,
  ChatLineRound,
  Flag,
  More,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  comment: Comment
  postId: string
  isReply?: boolean
}

interface Emits {
  reply: [parentId: string, content: string]
  like: [commentId: string]
  delete: [commentId: string]
  'load-replies': [commentId: string]
}

const props = withDefaults(defineProps<Props>(), {
  isReply: false
})

const emit = defineEmits<Emits>()

const router = useRouter()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const likeLoading = ref(false)
const replyLoading = ref(false)
const editLoading = ref(false)
const showReplyInput = ref(false)
const showEditDialog = ref(false)
const replyContent = ref('')
const editContent = ref('')
const hasMoreReplies = ref(false)

// 计算属性
const isOwner = computed(() =>
  userStore.user?.id === props.comment.userId
)

// 方法
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

const formatContent = (content: string) => {
  // 处理 @ 用户提及
  let formatted = content.replace(
    /@(\w+)/g,
    '<span class="text-purple-400 cursor-pointer hover:underline">@$1</span>'
  )

  // 处理话题标签
  formatted = formatted.replace(
    /#(\w+)/g,
    '<span class="text-blue-400 cursor-pointer hover:underline">#$1</span>'
  )

  // 处理链接
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="text-cyan-400 hover:underline">$1</a>'
  )

  return formatted
}

const goToUserProfile = () => {
  router.push(`/community/user/${props.comment.user.id}`)
}

const handleLike = async () => {
  if (likeLoading.value) return

  likeLoading.value = true
  try {
    emit('like', props.comment.id)
  } finally {
    likeLoading.value = false
  }
}

const toggleReply = () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }

  showReplyInput.value = !showReplyInput.value
  if (showReplyInput.value) {
    replyContent.value = ''
  }
}

const submitReply = async () => {
  if (!replyContent.value.trim()) return

  replyLoading.value = true
  try {
    emit('reply', props.comment.id, replyContent.value)
    replyContent.value = ''
    showReplyInput.value = false
  } finally {
    replyLoading.value = false
  }
}

const cancelReply = () => {
  showReplyInput.value = false
  replyContent.value = ''
}

const handleChildReply = (parentId: string, content: string) => {
  emit('reply', parentId, content)
}

const reportComment = () => {
  ElMessage.info('举报功能开发中...')
}

const handleMenuCommand = async (command: string) => {
  switch (command) {
    case 'edit':
      editContent.value = props.comment.content
      showEditDialog.value = true
      break

    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除这条评论吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        )
        emit('delete', props.comment.id)
      } catch {
        // 用户取消删除
      }
      break
  }
}

const saveEdit = async () => {
  if (!editContent.value.trim()) return

  try {
    editLoading.value = true

    const response = await communityStore.updateComment(props.comment.id, editContent.value)

    if (response.success && response.data) {
      // 更新本地评论内容
      props.comment.content = response.data.content
      props.comment.updatedAt = response.data.updatedAt
      showEditDialog.value = false
      ElMessage.success('评论更新成功!')
    } else {
      throw new Error(response.error || '更新失败')
    }
  } catch (error) {
    console.error('更新评论失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '更新失败')
  } finally {
    editLoading.value = false
  }
}

const loadMoreReplies = () => {
  emit('load-replies', props.comment.id)
}
</script>

<style scoped>
.comment-item {
  @apply transition-all duration-200;
}

.comment-item:hover {
  @apply bg-gray-800/20 rounded-lg p-2 -m-2;
}

/* 自定义文本域样式 */
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

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
}
</style>
