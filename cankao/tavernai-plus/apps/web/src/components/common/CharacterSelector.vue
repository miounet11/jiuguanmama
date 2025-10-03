<template>
  <div class="character-selector">
    <div class="selector-header">
      <h3>选择角色开始您的时空之旅</h3>
      <p>从众多精彩角色中选择一位，开始建立你们的羁绊</p>
    </div>

    <div class="character-grid">
      <div
        v-for="character in characters"
        :key="character.id"
        :class="[
          'character-card',
          { 'selected': selectedCharacter?.id === character.id }
        ]"
        @click="selectCharacter(character)"
      >
        <div class="character-avatar">
          <img
            v-if="character.avatar"
            :src="character.avatar"
            :alt="character.name"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            {{ character.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="character-info">
          <h4 class="character-name">{{ character.name }}</h4>
          <p class="character-description">{{ character.description }}</p>

          <div class="character-tags">
            <el-tag
              v-for="tag in character.tags?.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <div class="character-stats">
          <div class="stat-item">
            <span class="stat-label">热度</span>
            <span class="stat-value">{{ character.chatCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">评分</span>
            <span class="stat-value">{{ (character.rating || 0).toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="selector-actions">
      <el-button @click="$emit('cancel')" size="large">
        稍后再选
      </el-button>
      <el-button
        type="primary"
        size="large"
        :disabled="!selectedCharacter"
        @click="confirmSelection"
      >
        选择这个角色
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { characterService } from '@/services/character'
import { ElMessage } from 'element-plus'

interface Character {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  chatCount?: number
  rating?: number
}

interface Props {
  initialCharacters?: Character[]
}

const props = withDefaults(defineProps<Props>(), {
  initialCharacters: () => []
})

const emit = defineEmits<{
  select: [character: Character]
  cancel: []
}>()

const characters = ref<Character[]>(props.initialCharacters)
const selectedCharacter = ref<Character | null>(null)
const loading = ref(false)

const selectCharacter = (character: Character) => {
  selectedCharacter.value = character
}

const confirmSelection = () => {
  if (selectedCharacter.value) {
    emit('select', selectedCharacter.value)
  }
}

const loadCharacters = async () => {
  try {
    loading.value = true
    const response = await characterService.getCharacters({
      page: 1,
      limit: 12,
      sort: 'rating'
    })

    if (response.success && response.characters) {
      characters.value = response.characters.map((char: any) => ({
        id: char.id,
        name: char.name,
        description: char.description,
        avatar: char.avatar,
        tags: char.tags ? JSON.parse(char.tags) : [],
        chatCount: char.chatCount || 0,
        rating: char.rating || 0
      }))
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (characters.value.length === 0) {
    await loadCharacters()
  }
})
</script>

<style scoped lang="scss">
.character-selector {
  padding: var(--space-6);
}

.selector-header {
  text-align: center;
  margin-bottom: var(--space-6);

  h3 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
  }
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.character-card {
  background: var(--surface-2);
  border: 2px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary-400);
  }

  &.selected {
    border-color: var(--brand-primary-500);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), var(--surface-2));
    box-shadow: var(--shadow-primary);
  }
}

.character-avatar {
  text-align: center;
  margin-bottom: var(--space-3);

  .avatar-image,
  .avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-full);
    margin: 0 auto;
    border: 3px solid var(--border-secondary);
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: white;
  }
}

.character-info {
  margin-bottom: var(--space-3);

  .character-name {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-align: center;
  }

  .character-description {
    margin: 0 0 var(--space-3) 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .character-tags {
    display: flex;
    justify-content: center;
    gap: var(--space-1);
    flex-wrap: wrap;
  }
}

.character-stats {
  display: flex;
  justify-content: space-around;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-secondary);

  .stat-item {
    text-align: center;

    .stat-label {
      display: block;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin-bottom: var(--space-1);
    }

    .stat-value {
      display: block;
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--brand-primary-500);
    }
  }
}

.selector-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

// 响应式设计
@media (max-width: 768px) {
  .character-grid {
    grid-template-columns: 1fr;
  }

  .selector-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
