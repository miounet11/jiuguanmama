<template>
  <div class="post-card glass-card overflow-hidden hover:shadow-lg transition-all duration-300">
    <!-- 用户信息头部 -->
    <div class="flex items-center justify-between p-6 pb-4">
      <div class="flex items-center space-x-3">
        <el-avatar
          :size="48"
          :src="post.user.avatar"
          class="cursor-pointer"
          @click="goToUserProfile"
        >
          {{ post.user.username.charAt(0).toUpperCase() }}
        </el-avatar>
        <div>
          <div class="flex items-center space-x-2">
            <h4
              class="font-semibold text-white cursor-pointer hover:text-purple-400 transition-colors"
              @click="goToUserProfile"
            >
              {{ post.user.username }}
            </h4>
            <el-icon v-if="post.user.isVerified" class="text-yellow-400" :size="16">
              <CircleCheck />
            </el-icon>
            <span v-if="post.isPinned" class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              置顶
            </span>
            <span v-if="post.isFeatured" class="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              精选
            </span>
          </div>
          <div class="flex items-center space-x-2 text-sm text-gray-400">
            <span>{{ formatTime(post.createdAt) }}</span>
            <span>·</span>
            <span>{{ post.visibility === 'public' ? '公开' : post.visibility === 'followers' ? '粉丝可见' : '私密' }}</span>
          </div>
        </div>
      </div>

      <!-- 更多操作菜单 -->
      <el-dropdown @command="handleMenuCommand" placement="bottom-end">
        <el-button text>
          <el-icon><More /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="!post.isBookmarked" command="bookmark">
              <el-icon><Star /></el-icon>
              收藏
            </el-dropdown-item>
            <el-dropdown-item v-else command="unbookmark">
              <el-icon><StarFilled /></el-icon>
              取消收藏
            </el-dropdown-item>
            <el-dropdown-item command="share">
              <el-icon><Share /></el-icon>
              分享
            </el-dropdown-item>
            <el-dropdown-item command="report" divided>
              <el-icon><Flag /></el-icon>
              举报
            </el-dropdown-item>
            <template v-if="isOwner">
              <el-dropdown-item command="edit" divided>
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
              <el-dropdown-item command="delete" class="text-red-500">
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 动态内容 -->
    <div class="px-6 pb-4">
      <!-- 文字内容 -->
      <div v-if="post.content" class="text-gray-200 mb-4 whitespace-pre-wrap">
        <span v-html="formatContent(post.content)"></span>
      </div>

      <!-- 角色分享 -->
      <div v-if="post.type === 'character_share' && post.character" class="mb-4">
        <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div class="flex items-center space-x-3 mb-3">
            <el-avatar :size="40" :src="post.character.avatar">
              {{ post.character.name.charAt(0).toUpperCase() }}
            </el-avatar>
            <div>
              <h5 class="font-semibold text-white">{{ post.character.name }}</h5>
              <p class="text-sm text-gray-400">AI角色</p>
            </div>
          </div>
          <p class="text-gray-300 text-sm line-clamp-2">{{ post.character.description }}</p>
          <div class="flex items-center justify-between mt-3">
            <div class="flex space-x-4 text-sm text-gray-400">
              <span>角色卡片</span>
            </div>
            <el-button size="small" type="primary">
              查看详情
            </el-button>
          </div>
        </div>
      </div>

      <!-- 图片内容 -->
      <div v-if="post.type === 'image' && post.images?.length" class="mb-4">
        <div class="grid gap-2" :class="imageGridClass">
          <div
            v-for="(image, index) in post.images"
            :key="index"
            class="relative group cursor-pointer overflow-hidden rounded-lg"
            @click="previewImage(index)"
          >
            <img
              :src="image"
              :alt="`图片 ${index + 1}`"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              :class="imageClass"
            />
            <!-- 图片数量遮罩（超过4张时显示） -->
            <div
              v-if="index === 3 && post.images.length > 4"
              class="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <span class="text-white font-semibold text-lg">+{{ post.images.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="post.tags?.length" class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="tag in post.tags"
          :key="tag"
          class="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full hover:bg-purple-500/30 transition-colors"
          @click="searchByTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>

    <!-- 互动统计 -->
    <div class="px-6 py-4 border-t border-gray-700/50">
      <div class="flex items-center justify-between text-sm text-gray-400 mb-3">
        <div class="flex space-x-4">
          <span v-if="post.likeCount > 0">{{ post.likeCount }} 赞</span>
          <span v-if="post.commentCount > 0">{{ post.commentCount }} 评论</span>
          <span v-if="post.shareCount > 0">{{ post.shareCount }} 分享</span>
        </div>
        <span v-if="post.viewCount > 0">{{ post.viewCount }} 浏览</span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <div class="flex space-x-1">
          <!-- 点赞按钮 -->
          <el-button
            text
            :class="[
              'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
              post.isLiked
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
            ]"
            @click="handleLike"
            :loading="likeLoading"
          >
            <el-icon>
              <component :is="post.isLiked ? 'HeartFilled' : 'Heart'" />
            </el-icon>
            <span>{{ post.likeCount || '赞' }}</span>
          </el-button>

          <!-- 评论按钮 -->
          <el-button
            text
            class="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
            @click="handleComment"
          >
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ post.commentCount || '评论' }}</span>
          </el-button>

          <!-- 分享按钮 -->
          <el-button
            text
            class="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200"
            @click="handleShare"
            :loading="shareLoading"
          >
            <el-icon><Share /></el-icon>
            <span>{{ post.shareCount || '分享' }}</span>
          </el-button>
        </div>

        <!-- 收藏按钮 -->
        <el-button
          text
          :class="[
            'px-3 py-2 rounded-lg transition-all duration-200',
            post.isBookmarked
              ? 'text-yellow-400 hover:bg-yellow-500/10'
              : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
          ]"
          @click="handleBookmark"
          :loading="bookmarkLoading"
        >
          <el-icon>
            <component :is="post.isBookmarked ? 'StarFilled' : 'Star'" />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImagePreview"
      :url-list="post.images || []"
      :initial-index="currentImageIndex"
      @close="showImagePreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Post } from '@/types/community'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  More,
  Star,
  StarFilled,
  Share,
  Flag,
  Edit,
  Delete,
  CircleCheck,
  ChatLineRound
} from '@element-plus/icons-vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  post: Post
}

interface Emits {
  like: [postId: string]
  comment: [postId: string]
  share: [postId: string]
  delete: [postId: string]
  click: [post: Post]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const likeLoading = ref(false)
const shareLoading = ref(false)
const bookmarkLoading = ref(false)
const showImagePreview = ref(false)
const currentImageIndex = ref(0)

// 计算属性
const isOwner = computed(() =>
  userStore.user?.id === props.post.userId
)

const imageGridClass = computed(() => {
  const count = props.post.images?.length || 0
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-3'
  return 'grid-cols-2'
})

const imageClass = computed(() => {
  const count = props.post.images?.length || 0
  if (count === 1) return 'h-64'
  if (count === 2) return 'h-40'
  if (count === 3) return 'h-32'
  return 'h-32'
})

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
  router.push(`/community/user/${props.post.user.id}`)
}

const handleLike = async () => {
  if (likeLoading.value) return

  likeLoading.value = true
  try {
    emit('like', props.post.id)
  } finally {
    likeLoading.value = false
  }
}

const handleComment = () => {
  emit('comment', props.post.id)
}

const handleShare = async () => {
  if (shareLoading.value) return

  shareLoading.value = true
  try {
    emit('share', props.post.id)
  } finally {
    shareLoading.value = false
  }
}

const handleBookmark = async () => {
  if (bookmarkLoading.value) return

  bookmarkLoading.value = true
  try {
    // 这里应该调用收藏API
    ElMessage.success(props.post.isBookmarked ? '取消收藏成功' : '收藏成功')
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    bookmarkLoading.value = false
  }
}

const handleMenuCommand = async (command: string) => {
  switch (command) {
    case 'bookmark':
    case 'unbookmark':
      await handleBookmark()
      break

    case 'share':
      await handleShare()
      break

    case 'report':
      ElMessage.info('举报功能开发中...')
      break

    case 'edit':
      ElMessage.info('编辑功能开发中...')
      break

    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除这条动态吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        )
        emit('delete', props.post.id)
      } catch {
        // 用户取消删除
      }
      break
  }
}

const previewImage = (index: number) => {
  currentImageIndex.value = index
  showImagePreview.value = true
}

const searchByTag = (tag: string) => {
  router.push(`/community?tag=${encodeURIComponent(tag)}`)
}
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

/* 自定义按钮悬停效果 */
.el-button:hover {
  transform: translateY(-1px);
}

/* 图片网格布局优化 */
.grid > div:first-child:nth-last-child(3),
.grid > div:first-child:nth-last-child(3) ~ div {
  grid-column: span 1;
}

.grid > div:first-child:nth-last-child(3):first-child {
  grid-column: span 2;
  grid-row: span 2;
}
</style>
