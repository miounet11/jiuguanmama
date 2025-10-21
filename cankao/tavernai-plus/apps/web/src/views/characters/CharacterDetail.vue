<template>
  <div class="character-detail-page">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <TavernCard class="loading-card">
        <div class="loading-content">
          <TavernIcon name="loading" class="animate-spin w-8 h-8 text-purple-500" />
          <p class="text-gray-600 mt-4">加载角色信息中...</p>
        </div>
      </TavernCard>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="isError" class="error-container">
      <TavernCard class="error-card">
        <div class="error-content">
          <TavernIcon name="warning" class="w-12 h-12 text-red-500" />
          <h2 class="text-xl font-semibold text-gray-900 mt-4">加载失败</h2>
          <p class="text-gray-600 mt-2">无法获取角色信息，请检查网络连接或稍后重试。</p>
          <TavernButton
            variant="primary"
            @click="fetchCharacterDetail"
            class="mt-4"
          >
            重新加载
          </TavernButton>
        </div>
      </TavernCard>
    </div>

    <!-- 正常内容 -->
    <div v-else class="character-detail-container">
      <!-- 左侧：角色头像 -->
      <div class="character-avatar-section">
        <TavernCard variant="glass" class="character-avatar-card">
          <!-- 角色头像 -->
          <div class="character-avatar-wrapper">
            <div class="character-avatar">
              <img
                v-if="character?.avatar"
                :src="character.avatar"
                :alt="character.name"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                <span class="avatar-initial">{{ character?.name?.charAt(0) }}</span>
              </div>
            </div>
          </div>
        </TavernCard>
      </div>

      <!-- 右侧：角色信息 -->
      <div class="character-info-section">
        <TavernCard variant="glass" class="character-info-card">
          <!-- 顶部操作栏 -->
          <div class="character-actions-header">
            <div class="back-button-group">
              <TavernButton
                variant="secondary"
                size="sm"
                @click="$router.back()"
                class="back-button"
              >
                <TavernIcon name="arrow-left" class="action-icon" />
                返回
              </TavernButton>
            </div>
            <div class="action-buttons">
              <!-- 关注按钮 -->
              <TavernButton
                :variant="isLiked ? 'primary' : 'secondary'"
                size="md"
                @click="toggleLike"
                class="favorite-button"
              >
                <TavernIcon :name="isLiked ? 'heart-solid' : 'heart'" class="action-icon" />
                {{ isLiked ? '已关注' : '关注' }}
              </TavernButton>
              <!-- 更多操作 -->
              <TavernButton
                variant="secondary"
                size="md"
                @click="shareCharacter"
                class="more-actions-button"
              >
                <TavernIcon name="ellipsis-horizontal" class="action-icon" />
              </TavernButton>
            </div>
          </div>

          <!-- 角色信息内容 -->
          <div class="character-content">
            <!-- 顶部标签页 -->
            <div class="character-tabs">
              <TavernButton
                :variant="activeTab === 'info' ? 'primary' : 'secondary'"
                size="sm"
                @click="activeTab = 'info'"
                :class="['tab-button', { 'tab-active': activeTab === 'info' }]"
              >
                角色信息
              </TavernButton>
              <TavernButton
                :variant="activeTab === 'intro' ? 'primary' : 'secondary'"
                size="sm"
                @click="activeTab = 'intro'"
                :class="['tab-button', { 'tab-active': activeTab === 'intro' }]"
              >
                开场白
              </TavernButton>
              <TavernButton
                :variant="activeTab === 'comments' ? 'primary' : 'secondary'"
                size="sm"
                @click="activeTab = 'comments'"
                :class="['tab-button', { 'tab-active': activeTab === 'comments' }]"
              >
                <TavernIcon name="chat-bubble-left" class="tab-icon" />
                评论 ({{ reviews?.length || 0 }})
              </TavernButton>
            </div>

            <!-- 标签页内容 -->
            <div v-if="activeTab === 'info'" class="tab-content">
              <!-- 角色名称和介绍 -->
              <div class="character-intro-section">
                <h1 class="character-name">{{ character?.name || '加载中...' }}</h1>
                <div class="character-description">
                  <p class="description-text">
                    {{ character?.description || '加载中...' }}
                  </p>
                  <p v-if="character?.fullDescription" class="description-text mt-4">
                    {{ character.fullDescription }}
                  </p>
                </div>
              </div>

              <!-- 角色属性表格 -->
              <div v-if="character" class="character-attributes">
                <TavernCard variant="default" class="attribute-card">
                  <div class="attributes-grid">
                    <div class="attribute-item">
                      <h3 class="attribute-label">类别</h3>
                      <p class="attribute-value">{{ character.category || '未分类' }}</p>
                    </div>
                    <div class="attribute-item">
                      <h3 class="attribute-label">语言</h3>
                      <p class="attribute-value">{{ character.language || 'zh-CN' }}</p>
                    </div>
                    <div class="attribute-item">
                      <h3 class="attribute-label">模型</h3>
                      <p class="attribute-value">{{ character.model || 'gpt-3.5-turbo' }}</p>
                    </div>
                    <div class="attribute-item">
                      <h3 class="attribute-label">评分</h3>
                      <p class="attribute-value">{{ character.rating ? character.rating.toFixed(1) : 'N/A' }} ⭐</p>
                    </div>
                    <div class="attribute-item">
                      <h3 class="attribute-label">对话数</h3>
                      <p class="attribute-value">{{ character.chatCount || 0 }}</p>
                    </div>
                    <div class="attribute-item">
                      <h3 class="attribute-label">收藏数</h3>
                      <p class="attribute-value">{{ character.favoriteCount || 0 }}</p>
                    </div>
                  </div>
                </TavernCard>
              </div>

              <!-- 更多介绍 -->
              <div v-if="character" class="character-details-section">
                <h3 class="section-title">更多介绍</h3>
                <TavernCard variant="default" class="details-card">
                  <div class="details-list">
                    <div v-if="character.personality" class="detail-item">
                      <h4 class="detail-label">性格特征</h4>
                      <p class="detail-value">{{ character.personality }}</p>
                    </div>
                    <div v-if="character.backstory" class="detail-item">
                      <h4 class="detail-label">背景故事</h4>
                      <p class="detail-value">{{ character.backstory }}</p>
                    </div>
                    <div v-if="character.scenario" class="detail-item">
                      <h4 class="detail-label">场景设定</h4>
                      <p class="detail-value">{{ character.scenario }}</p>
                    </div>
                    <div v-if="character.speakingStyle" class="detail-item">
                      <h4 class="detail-label">说话风格</h4>
                      <p class="detail-value">{{ character.speakingStyle }}</p>
                    </div>
                  </div>
                </TavernCard>
              </div>

              <!-- 标签和统计 -->
              <div v-if="character" class="character-tags-section">
                <h3 class="section-title">角色标签</h3>
                <div class="tags-container">
                  <TavernBadge
                    v-for="tag in parseTags(character.tags)"
                    :key="tag"
                    variant="primary"
                    class="character-badge"
                  >
                    {{ tag }}
                  </TavernBadge>
                  <TavernBadge v-if="character.firstMessage" variant="secondary" class="character-badge">
                    有开场白
                  </TavernBadge>
                  <TavernBadge variant="secondary" class="character-badge">
                    <TavernIcon name="star" class="badge-icon" />
                    评分 {{ character.rating ? character.rating.toFixed(1) : 'N/A' }}
                  </TavernBadge>
                </div>
              </div>
          </div>

            <div v-else-if="activeTab === 'intro'" class="tab-content">
              <!-- 开场白内容 -->
              <TavernCard variant="default" class="intro-card">
                <h3 class="section-title">开场白</h3>
                <div class="intro-content">
                  <p class="intro-text">{{ character?.firstMessage || '暂无开场白' }}</p>
                </div>
              </TavernCard>
            </div>

            <div v-else-if="activeTab === 'comments'" class="tab-content">
              <!-- 评论内容 -->
              <div class="comments-section">
                <TavernCard v-for="review in reviews" :key="review.id" variant="default" class="comment-card">
                  <div class="comment-header">
                    <div class="comment-user">
                      <img :src="review.userAvatar || '/default-avatar.png'" class="user-avatar" />
                      <div class="user-info">
                        <div class="username">{{ review.username }}</div>
                        <div class="rating-date">
                          <div class="rating-stars">
                            <TavernIcon
                              v-for="i in 5"
                              :key="i"
                              :name="i <= review.rating ? 'star-solid' : 'star'"
                              :class="['star-icon', i <= review.rating ? 'star-filled' : 'star-empty']"
                            />
                          </div>
                          <span class="comment-date">{{ review.date }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="comment-text">{{ review.comment }}</p>
                </TavernCard>
              </div>
            </div>

          </div>
        </TavernCard>
      </div>
    </div>

    <!-- 底部聊天按钮 -->
    <div class="chat-action-fixed">
      <TavernButton
        variant="primary"
        size="lg"
        @click="startChat"
        class="chat-button"
      >
        <TavernIcon name="chat-bubble-oval-left" class="chat-icon" />
        开始聊天
      </TavernButton>
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
const isLoading = ref(true)
const isError = ref(false)
const reviews = ref<any[]>([])
const relatedCharacters = ref<any[]>([])
const otherWorks = ref<any[]>([])
const canAddReview = ref(true)
const userRating = ref(5)

// 安全解析标签的函数
const parseTags = (tags: any): string[] => {
  if (!tags) return []

  // 确保tags是字符串类型
  const tagsString = String(tags)
  if (tagsString === 'null' || tagsString === 'undefined') return []

  try {
    // 如果是JSON格式，解析为数组
    const parsed = JSON.parse(tagsString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // 如果JSON解析失败，尝试按逗号分割
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
  }
}
const userComment = ref('')
const activeTab = ref('info')



const fetchCharacterDetail = async () => {
  const characterId = route.params.id
  isLoading.value = true
  isError.value = false

  try {
    const response = await http.get(`/characters/${characterId}`)
    character.value = response.character
    isLiked.value = response.character.isFavorited
    // 角色数据加载完成后，获取其他作品
    await fetchOtherWorks()
  } catch (error) {
    console.error('Failed to fetch character:', error)
    // 设置错误状态，不使用硬编码数据
    isError.value = true
    character.value = null
  } finally {
    isLoading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const response = await http.get(`/characters/${route.params.id}/reviews`)
    reviews.value = response.data
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    // 不使用硬编码数据，设置空列表
    reviews.value = []
  }
}

const fetchRelatedCharacters = async () => {
  try {
    const response = await http.get(`/characters/${route.params.id}/related`)
    relatedCharacters.value = response.data
  } catch (error) {
    console.error('Failed to fetch related characters:', error)
    // 不使用硬编码数据，设置空列表
    relatedCharacters.value = []
  }
}

const fetchOtherWorks = async () => {
  if (!character.value?.creatorId) {
    // 如果没有creatorId，设置空列表
    otherWorks.value = []
    return
  }

  try {
    const response = await http.get(`/users/${character.value.creatorId}/characters`)
    // API返回的结构是 {characters: [], pagination: {}}
    const characters = response.data?.characters || []
    otherWorks.value = characters.filter((c: any) => c.id !== route.params.id)
  } catch (error) {
    console.error('Failed to fetch other works:', error)
    // 不使用硬编码数据，设置空列表
    otherWorks.value = []
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

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.character-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-lg);
}

.character-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--dt-spacing-2xl);
  align-items: start;
  min-height: calc(100vh - 2 * var(--dt-spacing-lg));
}

// 左侧角色头像区域
.character-avatar-section {
  position: sticky;
  top: var(--dt-spacing-lg);
  align-self: start;
}

.character-avatar-card {
  width: 100%;
  padding: var(--dt-spacing-2xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px rgba(168, 85, 247, 0.3);
  }
}

.character-avatar-wrapper {
  position: relative;
  margin-bottom: var(--dt-spacing-lg);
}

.character-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--dt-radius-2xl);
  overflow: hidden;
  background: var(--dt-color-background-card);
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(45deg,
      rgba(168, 85, 247, 0.2) 0%,
      rgba(59, 130, 246, 0.2) 50%,
      rgba(236, 72, 153, 0.2) 100%);
    z-index: 1;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 2;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dt-gradient-primary);
    position: relative;
    z-index: 2;

    .avatar-initial {
      font-size: 5rem;
      font-weight: var(--dt-font-weight-bold);
      color: var(--dt-color-text-primary);
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }
  }
}

// 右侧信息区域
.character-info-section {
  display: flex;
  flex-direction: column;
}

.character-info-card {
  width: 100%;
  padding: var(--dt-spacing-2xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  min-height: fit-content;
}

// 操作栏
.character-actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--dt-spacing-lg);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  margin-bottom: var(--dt-spacing-xl);
}

.back-button-group {
  display: flex;
  align-items: center;
}

.back-button {
  .action-icon {
    margin-right: var(--dt-spacing-sm);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.favorite-button,
.more-actions-button {
  .action-icon {
    margin-right: var(--dt-spacing-sm);
  }
}

// 标签页
.character-tabs {
  display: flex;
  gap: var(--dt-spacing-md);
  margin-bottom: var(--dt-spacing-2xl);
  padding-bottom: var(--dt-spacing-lg);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
}

.tab-button {
  border-radius: var(--dt-radius-lg);
  transition: all 0.3s ease;

  &.tab-active {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
  }

  .tab-icon {
    margin-right: var(--dt-spacing-sm);
  }
}

// 内容区域
.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

// 角色介绍
.character-intro-section {
  margin-bottom: var(--dt-spacing-xl);
}

.character-name {
  font-size: var(--dt-font-size-3xl);
  font-weight: var(--dt-font-weight-bold);
  background: var(--dt-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--dt-spacing-lg);
  animation: glow 2s ease-in-out infinite alternate;
}

.character-description {
  .description-text {
    font-size: var(--dt-font-size-md);
    color: var(--dt-color-text-secondary);
    line-height: 1.6;
    opacity: 0.9;
  }
}

// 属性表格
.character-attributes {
  margin-bottom: var(--dt-spacing-xl);
}

.attribute-card {
  padding: var(--dt-spacing-xl);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--dt-spacing-lg);
}

.attribute-item {
  .attribute-label {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-medium);
    color: var(--dt-color-text-tertiary);
    margin-bottom: var(--dt-spacing-xs);
    opacity: 0.8;
  }

  .attribute-value {
    font-size: var(--dt-font-size-md);
    color: var(--dt-color-text-primary);
    font-weight: var(--dt-font-weight-medium);
  }
}

// 详细信息
.character-details-section {
  margin-bottom: var(--dt-spacing-xl);
}

.section-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-lg);
}

.details-card {
  padding: var(--dt-spacing-xl);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.detail-item {
  .detail-label {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-medium);
    color: var(--dt-color-text-tertiary);
    margin-bottom: var(--dt-spacing-xs);
    opacity: 0.8;
  }

  .detail-value {
    font-size: var(--dt-font-size-md);
    color: var(--dt-color-text-secondary);
    line-height: 1.5;
  }
}

// 标签统计
.character-tags-section {
  margin-bottom: var(--dt-spacing-xl);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-md);
}

.character-badge {
  .badge-icon {
    margin-right: var(--dt-spacing-xs);
  }
}

// 开场白
.intro-card {
  padding: var(--dt-spacing-xl);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.intro-content {
  .intro-text {
    font-size: var(--dt-font-size-md);
    color: var(--dt-color-text-secondary);
    font-style: italic;
    line-height: 1.6;
    opacity: 0.9;
  }
}

// 评论区域
.comments-section {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.comment-card {
  padding: var(--dt-spacing-lg);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
  }
}

.comment-header {
  margin-bottom: var(--dt-spacing-md);
}

.comment-user {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--dt-radius-full);
  border: 2px solid rgba(168, 85, 247, 0.3);
}

.user-info {
  .username {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-semibold);
    color: var(--dt-color-text-primary);
    margin-bottom: var(--dt-spacing-xs);
  }
}

.rating-date {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-sm);
}

.rating-stars {
  display: flex;
  gap: 2px;

  .star-icon {
    width: 12px;
    height: 12px;

    &.star-filled {
      color: #fbbf24;
    }

    &.star-empty {
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

.comment-date {
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
  opacity: 0.7;
}

.comment-text {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

// 固定聊天按钮
.chat-action-fixed {
  position: fixed;
  bottom: var(--dt-spacing-2xl);
  right: var(--dt-spacing-2xl);
  z-index: 100;
}

.chat-button {
  padding: var(--dt-spacing-lg) var(--dt-spacing-2xl);
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  box-shadow: 0 15px 40px rgba(168, 85, 247, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 20px 50px rgba(168, 85, 247, 0.6);
  }

  .chat-icon {
    margin-right: var(--dt-spacing-sm);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .character-detail-container {
    grid-template-columns: 350px 1fr;
    gap: var(--dt-spacing-xl);
  }
}

@media (max-width: 1024px) {
  .character-detail-container {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-xl);
  }

  .character-avatar-section {
    position: static;
    order: 1;
    max-width: 400px;
    margin: 0 auto;
  }

  .character-info-section {
    order: 2;
  }

  .attributes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .character-detail-page {
    padding: var(--dt-spacing-md);
  }

  .character-detail-container {
    gap: var(--dt-spacing-lg);
  }

  .character-avatar-card,
  .character-info-card {
    padding: var(--dt-spacing-lg);
  }

  .character-actions-header {
    flex-direction: column;
    gap: var(--dt-spacing-md);
    align-items: stretch;
  }

  .action-buttons {
    justify-content: center;
  }

  .character-tabs {
    flex-wrap: wrap;
    gap: var(--dt-spacing-sm);
  }

  .tab-button {
    flex: 1;
    min-width: 120px;
  }

  .attributes-grid {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-md);
  }

  .character-name {
    font-size: var(--dt-font-size-2xl);
  }

  .chat-action-fixed {
    bottom: var(--dt-spacing-lg);
    right: var(--dt-spacing-lg);
    left: var(--dt-spacing-lg);
  }

  .chat-button {
    width: 100%;
    justify-content: center;
  }

  .comments-section {
    gap: var(--dt-spacing-md);
  }

  .comment-card {
    padding: var(--dt-spacing-md);
  }
}

/* 加载和错误状态样式 */
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: var(--dt-spacing-xl);
}

.loading-card,
.error-card {
  max-width: 400px;
  text-align: center;
}

.loading-content,
.error-content {
  padding: var(--dt-spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-content p,
.error-content p {
  margin: 0;
}

.error-content h2 {
  margin: 0;
}
</style>
