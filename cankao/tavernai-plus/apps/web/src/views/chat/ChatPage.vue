<template>
  <div class="chat-page">
    <div class="container">
      <PageHeader title="开始对话" subtitle="选择角色，开启精彩的AI对话之旅" />
      
      <!-- 快速选择 -->
      <div class="quick-start">
        <h3>快速开始</h3>
        <div class="character-grid">
          <div 
            v-for="character in recentCharacters" 
            :key="character.id"
            class="character-card"
            @click="startChatWithCharacter(character)"
          >
            <img :src="character.avatar || '/images/default-avatar.png'" :alt="character.name" />
            <div class="character-info">
              <h4>{{ character.name }}</h4>
              <p>{{ character.chatCount }} 对话</p>
            </div>
          </div>
          
          <div class="character-card add-new" @click="showCharacterSelector = true">
            <el-icon size="32"><Plus /></el-icon>
            <p>选择角色</p>
          </div>
        </div>
      </div>
      
      <!-- 最近会话 -->
      <div class="recent-sessions" v-if="recentSessions.length > 0">
        <h3>继续对话</h3>
        <div class="session-list">
          <div 
            v-for="session in recentSessions" 
            :key="session.id"
            class="session-card"
            @click="continueSession(session)"
          >
            <div class="session-avatar">
              <img 
                :src="session.characters[0]?.avatar || '/images/default-avatar.png'" 
                :alt="session.characters[0]?.name"
              />
            </div>
            <div class="session-info">
              <h4>{{ session.title || '未命名对话' }}</h4>
              <p>{{ formatTime(session.lastMessageAt) }} · {{ session.messageCount }} 条消息</p>
            </div>
            <div class="session-actions">
              <el-button circle size="small" @click.stop="deleteSession(session)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 推荐角色 -->
      <div class="recommended-characters">
        <h3>推荐角色</h3>
        <div class="character-showcase">
          <CharacterCard 
            v-for="character in recommendedCharacters" 
            :key="character.id"
            :character="character"
            @click="startChatWithCharacter(character)"
          />
        </div>
      </div>
    </div>
    
    <!-- 角色选择器对话框 -->
    <el-dialog 
      v-model="showCharacterSelector" 
      title="选择角色"
      width="800px"
      class="character-selector-dialog"
    >
      <div class="selector-content">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索角色..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div class="character-options" v-loading="loading">
          <div 
            v-for="character in filteredCharacters" 
            :key="character.id"
            class="character-option"
            @click="selectCharacter(character)"
          >
            <img :src="character.avatar || '/images/default-avatar.png'" :alt="character.name" />
            <div class="option-info">
              <h4>{{ character.name }}</h4>
              <p>{{ character.description }}</p>
              <div class="option-stats">
                <span><el-icon><Star /></el-icon> {{ character.rating?.toFixed(1) || '0.0' }}</span>
                <span><el-icon><ChatDotRound /></el-icon> {{ character.chatCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search, Star, ChatDotRound } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CharacterCard from '@/components/character/CharacterCard.vue'
import { chatService } from '@/services/chat'
import { characterService } from '@/services/character'
import type { ChatSession } from '@/types/chat'
import type { Character } from '@/types/character'

const router = useRouter()

const recentCharacters = ref<Character[]>([])
const recentSessions = ref<ChatSession[]>([])
const recommendedCharacters = ref<Character[]>([])
const allCharacters = ref<Character[]>([])
const showCharacterSelector = ref(false)
const searchQuery = ref('')
const loading = ref(false)

const filteredCharacters = computed(() => {
  if (!searchQuery.value) return allCharacters.value
  
  const query = searchQuery.value.toLowerCase()
  return allCharacters.value.filter(char => 
    char.name.toLowerCase().includes(query) ||
    char.description?.toLowerCase().includes(query)
  )
})

const formatTime = (time: string | null) => {
  if (!time) return '未知'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  return date.toLocaleDateString()
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 加载最近会话
    const sessions = await chatService.getSessions()
    recentSessions.value = sessions.slice(0, 5)
    
    // 加载角色
    const response = await characterService.getCharacters({
      limit: 20,
      sort: 'popular'
    })
    
    allCharacters.value = response.characters
    recommendedCharacters.value = response.characters.slice(0, 6)
    
    // 从最近会话中提取角色
    const recentCharIds = new Set<string>()
    sessions.forEach(session => {
      session.characterIds.forEach(id => recentCharIds.add(id))
    })
    
    // 加载最近使用的角色
    const recentChars: Character[] = []
    for (const id of Array.from(recentCharIds).slice(0, 5)) {
      try {
        const char = await characterService.getCharacter(id)
        recentChars.push(char)
      } catch (error) {
        console.error(`Failed to load character ${id}:`, error)
      }
    }
    recentCharacters.value = recentChars
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 开始与角色对话
const startChatWithCharacter = async (character: Character) => {
  try {
    const session = await chatService.createSession({
      characterIds: [character.id],
      title: `与 ${character.name} 的对话`
    })
    router.push(`/chat/${session.id}`)
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 继续会话
const continueSession = (session: ChatSession) => {
  router.push(`/chat/${session.id}`)
}

// 删除会话
const deleteSession = async (session: ChatSession) => {
  await ElMessageBox.confirm(
    '确定要删除这个会话吗？',
    '删除确认',
    { type: 'warning' }
  )
  
  try {
    await chatService.deleteSession(session.id)
    recentSessions.value = recentSessions.value.filter(s => s.id !== session.id)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 选择角色
const selectCharacter = (character: Character) => {
  showCharacterSelector.value = false
  startChatWithCharacter(character)
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.chat-page {
  min-height: 100vh;
  background: #0f0f1a;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

// 快速开始
.quick-start {
  margin-bottom: 40px;
  
  h3 {
    margin: 0 0 20px;
    font-size: 20px;
    color: #f3f4f6;
  }
  
  .character-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .character-card {
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
    
    &:hover {
      transform: translateY(-5px);
      border-color: #8b5cf6;
      box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
    }
    
    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 10px;
      object-fit: cover;
    }
    
    .character-info {
      h4 {
        margin: 0 0 5px;
        font-size: 14px;
        color: #f3f4f6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      p {
        margin: 0;
        font-size: 12px;
        color: #9ca3af;
      }
    }
    
    &.add-new {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-style: dashed;
      
      .el-icon {
        color: #8b5cf6;
        margin-bottom: 10px;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #9ca3af;
      }
    }
  }
}

// 最近会话
.recent-sessions {
  margin-bottom: 40px;
  
  h3 {
    margin: 0 0 20px;
    font-size: 20px;
    color: #f3f4f6;
  }
  
  .session-list {
    display: grid;
    gap: 15px;
  }
  
  .session-card {
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(139, 92, 246, 0.1);
      border-color: #8b5cf6;
    }
    
    .session-avatar {
      flex-shrink: 0;
      
      img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
      }
    }
    
    .session-info {
      flex: 1;
      min-width: 0;
      
      h4 {
        margin: 0 0 5px;
        font-size: 16px;
        color: #f3f4f6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #9ca3af;
      }
    }
    
    .session-actions {
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    &:hover .session-actions {
      opacity: 1;
    }
  }
}

// 推荐角色
.recommended-characters {
  h3 {
    margin: 0 0 20px;
    font-size: 20px;
    color: #f3f4f6;
  }
  
  .character-showcase {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

// 角色选择器
.character-selector-dialog {
  :deep(.el-dialog) {
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
  
  .selector-content {
    .search-input {
      margin-bottom: 20px;
    }
    
    .character-options {
      max-height: 500px;
      overflow-y: auto;
      display: grid;
      gap: 15px;
    }
    
    .character-option {
      display: flex;
      gap: 15px;
      padding: 15px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(139, 92, 246, 0.2);
        border-color: #8b5cf6;
      }
      
      img {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
      }
      
      .option-info {
        flex: 1;
        min-width: 0;
        
        h4 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #f3f4f6;
        }
        
        p {
          margin: 0 0 10px;
          font-size: 14px;
          color: #9ca3af;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .option-stats {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #9ca3af;
          
          span {
            display: flex;
            align-items: center;
            gap: 4px;
            
            .el-icon {
              color: #fbbf24;
            }
          }
        }
      }
    }
  }
}
</style>