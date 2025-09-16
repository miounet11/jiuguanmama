<template>
  <div class="character-card" @click="$emit('click')">
    <div class="card-image">
      <img :src="character.avatar || defaultAvatar" :alt="character.name" />
      <div class="card-badge" v-if="character.isNew">
        <span>NEW</span>
      </div>
      <div class="card-actions">
        <el-button 
          circle 
          :type="character.isFavorited ? 'danger' : 'default'"
          @click.stop="$emit('favorite')"
        >
          <el-icon><Star :filled="character.isFavorited" /></el-icon>
        </el-button>
      </div>
    </div>
    
    <div class="card-content">
      <h3 class="character-name">{{ character.name }}</h3>
      <p class="character-description">{{ truncatedDescription }}</p>
      
      <div class="card-tags">
        <el-tag 
          v-for="tag in displayTags" 
          :key="tag"
          size="small"
          type="info"
        >
          {{ tag }}
        </el-tag>
      </div>
      
      <div class="card-stats">
        <div class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ formatCount(character.chatCount) }}</span>
        </div>
        <div class="stat-item">
          <el-icon><Star /></el-icon>
          <span>{{ character.rating?.toFixed(1) || '0.0' }}</span>
        </div>
        <div class="stat-item">
          <el-icon><User /></el-icon>
          <span>{{ character.user?.username }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, ChatDotRound, User } from '@element-plus/icons-vue'
import type { Character } from '@/types/character'

const props = defineProps<{
  character: Character
}>()

defineEmits<{
  click: []
  favorite: []
}>()

const defaultAvatar = '/images/default-avatar.png'

const truncatedDescription = computed(() => {
  const desc = props.character.description || '暂无描述'
  return desc.length > 100 ? desc.slice(0, 100) + '...' : desc
})

const displayTags = computed(() => {
  return props.character.tags?.slice(0, 3) || []
})

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}
</script>

<style lang="scss" scoped>
.character-card {
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
    
    .card-image img {
      transform: scale(1.05);
    }
    
    .card-actions {
      opacity: 1;
    }
  }
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .card-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }
  
  .card-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .el-button {
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      
      &:hover {
        background: rgba(0, 0, 0, 0.7);
      }
    }
  }
}

.card-content {
  padding: 15px;
}

.character-name {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #f3f4f6;
}

.character-description {
  margin: 0 0 15px;
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  min-height: 42px;
}

.card-tags {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  
  .el-tag {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #c084fc;
  }
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #9ca3af;
  
  .el-icon {
    font-size: 16px;
    color: #8b5cf6;
  }
}
</style>