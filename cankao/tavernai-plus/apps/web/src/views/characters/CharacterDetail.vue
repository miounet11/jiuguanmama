<template>
  <div class="character-detail-page" v-loading="loading">
    <div class="character-header" v-if="character">
      <div class="header-background" :style="{ backgroundImage: `url(${character.avatar || '/images/default-bg.jpg'})` }"></div>
      <div class="header-overlay"></div>
      
      <div class="header-content">
        <div class="character-avatar">
          <img :src="character.avatar || '/images/default-avatar.png'" :alt="character.name" />
          <div class="avatar-badge" v-if="character.isNSFW">
            <span>NSFW</span>
          </div>
        </div>
        
        <div class="character-info">
          <h1 class="character-name">{{ character.name }}</h1>
          <p class="character-creator">
            由 <router-link :to="`/user/${character.user?.id}`">{{ character.user?.username }}</router-link> 创建
          </p>
          
          <div class="character-tags">
            <el-tag v-for="tag in character.tags" :key="tag" size="large">{{ tag }}</el-tag>
          </div>
          
          <div class="character-stats">
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>{{ character.rating?.toFixed(1) || '0.0' }}</span>
              <span class="stat-label">({{ character.ratingCount }} 评价)</span>
            </div>
            <div class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ formatCount(character.chatCount) }}</span>
              <span class="stat-label">对话</span>
            </div>
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>{{ formatCount(character.favoriteCount) }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
          
          <div class="character-actions">
            <el-button 
              type="primary" 
              size="large"
              @click="startChat"
            >
              <el-icon><ChatDotRound /></el-icon>
              开始对话
            </el-button>
            
            <el-button 
              size="large"
              :type="character.isFavorited ? 'danger' : 'default'"
              @click="toggleFavorite"
            >
              <el-icon><Star :filled="character.isFavorited" /></el-icon>
              {{ character.isFavorited ? '已收藏' : '收藏' }}
            </el-button>
            
            <el-button 
              size="large"
              @click="showRatingDialog = true"
            >
              <el-icon><StarFilled /></el-icon>
              评分
            </el-button>
            
            <el-dropdown v-if="isOwner">
              <el-button size="large">
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editCharacter">
                    <el-icon><Edit /></el-icon>
                    编辑角色
                  </el-dropdown-item>
                  <el-dropdown-item @click="cloneCharacter">
                    <el-icon><CopyDocument /></el-icon>
                    克隆角色
                  </el-dropdown-item>
                  <el-dropdown-item @click="deleteCharacter" divided>
                    <el-icon><Delete /></el-icon>
                    删除角色
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
    
    <div class="character-body" v-if="character">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="角色介绍" name="intro">
          <div class="tab-content">
            <div class="section">
              <h3>角色描述</h3>
              <p class="character-description">{{ character.description }}</p>
            </div>
            
            <div class="section" v-if="character.personality">
              <h3>性格特征</h3>
              <p>{{ character.personality }}</p>
            </div>
            
            <div class="section" v-if="character.backstory">
              <h3>背景故事</h3>
              <p>{{ character.backstory }}</p>
            </div>
            
            <div class="section" v-if="character.speakingStyle">
              <h3>说话风格</h3>
              <p>{{ character.speakingStyle }}</p>
            </div>
            
            <div class="section" v-if="character.firstMessage">
              <h3>初始消息</h3>
              <div class="message-preview">
                <p>{{ character.firstMessage }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="用户评价" name="reviews">
          <div class="tab-content">
            <div class="reviews-summary">
              <div class="rating-display">
                <span class="rating-number">{{ character.rating?.toFixed(1) || '0.0' }}</span>
                <el-rate 
                  :model-value="character.rating" 
                  disabled 
                  show-score
                  score-template=""
                />
                <span class="rating-count">{{ character.ratingCount }} 人评价</span>
              </div>
            </div>
            
            <div class="reviews-list">
              <p class="empty-message">暂无评价</p>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="相似角色" name="similar">
          <div class="tab-content">
            <div class="similar-characters">
              <p class="empty-message">暂无相似角色推荐</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 评分对话框 -->
    <el-dialog 
      v-model="showRatingDialog" 
      title="为角色评分"
      width="400px"
    >
      <div class="rating-dialog">
        <el-rate 
          v-model="userRating" 
          size="large"
          :texts="['糟糕', '一般', '不错', '很好', '完美']"
          show-text
        />
      </div>
      <template #footer>
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRating">提交评分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Star, StarFilled, ChatDotRound, More, Edit, Delete, CopyDocument 
} from '@element-plus/icons-vue'
import { characterService } from '@/services/character'
import { chatService } from '@/services/chat'
import { useUserStore } from '@/stores/user'
import type { Character } from '@/types/character'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const character = ref<Character | null>(null)
const loading = ref(false)
const activeTab = ref('intro')
const showRatingDialog = ref(false)
const userRating = ref(0)

const isOwner = computed(() => {
  return character.value?.userId === userStore.user?.id
})

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

// 获取角色详情
const fetchCharacter = async () => {
  loading.value = true
  try {
    const response = await characterService.getCharacter(route.params.id as string)
    character.value = response
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
    router.push('/characters')
  } finally {
    loading.value = false
  }
}

// 开始对话
const startChat = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    const session = await chatService.createSession({
      characterIds: [character.value!.id],
      title: `与 ${character.value!.name} 的对话`
    })
    router.push(`/chat/${session.id}`)
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 收藏/取消收藏
const toggleFavorite = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  
  try {
    await characterService.toggleFavorite(character.value!.id)
    character.value!.isFavorited = !character.value!.isFavorited
    character.value!.favoriteCount += character.value!.isFavorited ? 1 : -1
    ElMessage.success(character.value!.isFavorited ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 提交评分
const submitRating = async () => {
  if (!userRating.value) {
    ElMessage.warning('请选择评分')
    return
  }
  
  try {
    await characterService.rateCharacter(character.value!.id, userRating.value)
    showRatingDialog.value = false
    ElMessage.success('评分成功')
    // 刷新角色信息
    fetchCharacter()
  } catch (error) {
    console.error('评分失败:', error)
    ElMessage.error('评分失败')
  }
}

// 编辑角色
const editCharacter = () => {
  router.push(`/studio/character/edit/${character.value!.id}`)
}

// 克隆角色
const cloneCharacter = async () => {
  try {
    const cloned = await characterService.cloneCharacter(character.value!.id)
    ElMessage.success('克隆成功')
    router.push(`/character/${cloned.id}`)
  } catch (error) {
    console.error('克隆失败:', error)
    ElMessage.error('克隆失败')
  }
}

// 删除角色
const deleteCharacter = async () => {
  await ElMessageBox.confirm(
    '确定要删除这个角色吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  try {
    await characterService.deleteCharacter(character.value!.id)
    ElMessage.success('删除成功')
    router.push('/characters')
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchCharacter()
})
</script>

<style lang="scss" scoped>
.character-detail-page {
  min-height: 100vh;
  background: #0f0f1a;
}

.character-header {
  position: relative;
  height: 400px;
  overflow: hidden;
  
  .header-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    filter: blur(20px);
    transform: scale(1.1);
  }
  
  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(15, 15, 26, 0.7) 0%,
      rgba(15, 15, 26, 0.95) 100%
    );
  }
  
  .header-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 20px;
    height: 100%;
  }
}

.character-avatar {
  position: relative;
  flex-shrink: 0;
  
  img {
    width: 200px;
    height: 200px;
    border-radius: 20px;
    object-fit: cover;
    border: 3px solid rgba(139, 92, 246, 0.3);
    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
  }
  
  .avatar-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ef4444;
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }
}

.character-info {
  flex: 1;
  
  .character-name {
    margin: 0 0 10px;
    font-size: 42px;
    font-weight: 700;
    background: linear-gradient(135deg, #f3f4f6 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .character-creator {
    margin: 0 0 20px;
    font-size: 16px;
    color: #9ca3af;
    
    a {
      color: #c084fc;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .character-tags {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    
    .el-tag {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c084fc;
    }
  }
  
  .character-stats {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: #f3f4f6;
      
      .el-icon {
        font-size: 20px;
        color: #fbbf24;
      }
      
      .stat-label {
        font-size: 14px;
        color: #9ca3af;
        margin-left: 4px;
      }
    }
  }
  
  .character-actions {
    display: flex;
    gap: 10px;
    
    .el-button {
      padding: 10px 20px;
      height: auto;
    }
  }
}

.character-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  
  .tab-content {
    padding: 30px 0;
  }
  
  .section {
    margin-bottom: 30px;
    
    h3 {
      margin: 0 0 15px;
      font-size: 20px;
      font-weight: 600;
      color: #f3f4f6;
    }
    
    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.8;
      color: #d1d5db;
    }
  }
  
  .message-preview {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 10px;
    padding: 20px;
    
    p {
      margin: 0;
      font-style: italic;
    }
  }
}

.reviews-summary {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  
  .rating-display {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .rating-number {
      font-size: 48px;
      font-weight: 700;
      color: #fbbf24;
    }
    
    .rating-count {
      font-size: 14px;
      color: #9ca3af;
    }
  }
}

.empty-message {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
  font-size: 16px;
}

.rating-dialog {
  display: flex;
  justify-content: center;
  padding: 20px;
}
</style>