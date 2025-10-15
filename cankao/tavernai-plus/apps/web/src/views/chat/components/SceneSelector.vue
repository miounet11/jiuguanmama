<template>
  <div class="scene-selector-overlay" @click="$emit('close')">
    <div class="scene-selector-panel" @click.stop>
      <!-- 头部 -->
      <div class="selector-header">
        <h2 class="selector-title">
          <TavernIcon name="photo" />
          选择场景背景
        </h2>
        <TavernButton
          variant="ghost"
          size="sm"
          @click="$emit('close')"
          class="close-btn"
        >
          <TavernIcon name="x-mark" />
        </TavernButton>
      </div>

      <!-- 当前场景信息 -->
      <div class="current-scene-info">
        <div class="current-scene-preview">
          <img
            v-if="currentScene?.thumbnail"
            :src="currentScene.thumbnail"
            :alt="currentScene.name"
            class="current-thumbnail"
          />
          <div v-else class="no-thumbnail">
            <TavernIcon name="photo" />
          </div>
        </div>
        <div class="current-scene-details">
          <h3>{{ currentScene?.name || '默认场景' }}</h3>
          <p>{{ currentScene?.description || '当前使用的场景背景' }}</p>
          <div class="scene-tags" v-if="currentScene?.keywords?.length">
            <span
              v-for="keyword in currentScene.keywords"
              :key="keyword"
              class="scene-tag"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>

      <!-- 自动检测开关 -->
      <div class="auto-detect-section">
        <label class="auto-detect-toggle">
          <input
            type="checkbox"
            :checked="autoDetect"
            @change="$emit('auto-detect-change', $event.target.checked)"
            class="auto-detect-checkbox"
          />
          <div class="toggle-content">
            <div class="toggle-info">
              <TavernIcon name="sparkles" />
              <div class="toggle-text">
                <span class="toggle-title">智能场景切换</span>
                <span class="toggle-desc">根据对话内容自动切换合适的场景背景</span>
              </div>
            </div>
            <div class="toggle-switch" :class="{ 'switch-active': autoDetect }">
              <div class="switch-handle"></div>
            </div>
          </div>
        </label>
      </div>

      <!-- 场景分类标签 -->
      <div class="scene-categories">
        <button
          v-for="category in sceneCategories"
          :key="category.id"
          @click="activeCategory = category.id"
          :class="['category-btn', { 'category-active': activeCategory === category.id }]"
          class="category-tab"
        >
          <TavernIcon :name="category.icon" size="sm" />
          <span>{{ category.name }}</span>
        </button>
      </div>

      <!-- 场景网格 -->
      <div class="scenes-grid">
        <div
          v-for="scene in filteredScenes"
          :key="scene.id"
          @click="selectScene(scene)"
          :class="['scene-item', { 'scene-active': currentScene?.id === scene.id }]"
          class="scene-card"
        >
          <div class="scene-image-container">
            <img
              :src="scene.thumbnail || scene.url"
              :alt="scene.name"
              class="scene-image"
              @error="handleImageError"
            />
            <div class="scene-overlay">
              <div class="scene-actions">
                <TavernButton
                  variant="ghost"
                  size="xs"
                  @click.stop="previewScene(scene)"
                  class="preview-btn"
                  title="预览场景"
                >
                  <TavernIcon name="eye" />
                </TavernButton>
              </div>
              <div class="scene-indicator" v-if="currentScene?.id === scene.id">
                <TavernIcon name="check" />
                <span>当前使用</span>
              </div>
            </div>
          </div>
          <div class="scene-info">
            <h4 class="scene-name">{{ scene.name }}</h4>
            <p class="scene-description">{{ scene.description }}</p>
            <div class="scene-meta">
              <span class="scene-type">{{ scene.type || '通用' }}</span>
              <span class="scene-resolution">{{ scene.resolution || 'HD' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="selector-footer">
        <TavernButton
          variant="outline"
          @click="resetToDefault"
          class="reset-btn"
        >
          <TavernIcon name="arrow-rotate-left" />
          恢复默认
        </TavernButton>
        <TavernButton
          variant="ghost"
          @click="$emit('close')"
          class="cancel-btn"
        >
          取消
        </TavernButton>
      </div>
    </div>

    <!-- 场景预览对话框 -->
    <Teleport to="body">
      <div v-if="previewSceneData" class="preview-modal" @click="previewSceneData = null">
        <div class="preview-content" @click.stop>
          <div class="preview-header">
            <h3>{{ previewSceneData.name }}</h3>
            <TavernButton
              variant="ghost"
              size="sm"
              @click="previewSceneData = null"
            >
              <TavernIcon name="x-mark" />
            </TavernButton>
          </div>
          <div class="preview-image-container">
            <img
              :src="previewSceneData.url"
              :alt="previewSceneData.name"
              class="preview-image"
            />
          </div>
          <div class="preview-info">
            <p>{{ previewSceneData.description }}</p>
            <div class="preview-details">
              <span class="detail-item">
                <TavernIcon name="tag" size="xs" />
                {{ previewSceneData.type || '通用场景' }}
              </span>
              <span class="detail-item">
                <TavernIcon name="photo" size="xs" />
                {{ previewSceneData.resolution || 'HD' }}
              </span>
              <span class="detail-item">
                <TavernIcon name="clock" size="xs" />
                {{ formatDate(previewSceneData.createdAt) }}
              </span>
            </div>
          </div>
          <div class="preview-actions">
            <TavernButton
              variant="primary"
              @click="selectScene(previewSceneData); previewSceneData = null"
            >
              <TavernIcon name="check" />
              使用此场景
            </TavernButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

// 类型定义
export interface Scene {
  id: string
  name: string
  description: string
  url: string
  thumbnail?: string
  type?: string
  resolution?: string
  keywords?: string[]
  category?: string
  createdAt?: Date
}

// Props
const props = defineProps({
  currentScene: {
    type: Object as PropType<Scene>,
    default: null
  },
  availableScenes: {
    type: Array as PropType<Scene[]>,
    required: true
  },
  autoDetect: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  'select': [scene: Scene]
  'close': []
  'auto-detect-change': [enabled: boolean]
}>()

// 响应式数据
const activeCategory = ref('all')
const previewSceneData = ref<Scene | null>(null)

// 场景分类
const sceneCategories = [
  { id: 'all', name: '全部', icon: 'grid' },
  { id: 'nature', name: '自然', icon: 'sun' },
  { id: 'urban', name: '城市', icon: 'building' },
  { id: 'fantasy', name: '奇幻', icon: 'sparkles' },
  { id: 'sci-fi', name: '科幻', icon: 'rocket-launch' },
  { id: 'interior', name: '室内', icon: 'home' },
  { id: 'abstract', name: '抽象', icon: 'swirl' }
]

// 计算属性
const filteredScenes = computed(() => {
  if (activeCategory.value === 'all') {
    return props.availableScenes
  }
  return props.availableScenes.filter(scene => scene.category === activeCategory.value)
})

// 方法
const selectScene = (scene: Scene) => {
  emit('select', scene)
}

const previewScene = (scene: Scene) => {
  previewSceneData.value = scene
}

const resetToDefault = () => {
  const defaultScene = props.availableScenes.find(scene => scene.id === 'default')
  if (defaultScene) {
    selectScene(defaultScene)
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const formatDate = (date?: Date): string => {
  if (!date) return '未知'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.scene-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.scene-selector-panel {
  background: $dark-bg-secondary;
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .selector-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
}

.current-scene-info {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: rgba($gray-700, 0.2);
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .current-scene-preview {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;

    .current-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-thumbnail {
      width: 100%;
      height: 100%;
      background: rgba($gray-600, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $text-tertiary;
      font-size: 24px;
    }
  }

  .current-scene-details {
    flex: 1;
    min-width: 0;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: $text-secondary;
      margin: 0 0 8px;
      line-height: 1.4;
    }

    .scene-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .scene-tag {
        font-size: 11px;
        padding: 2px 6px;
        background: rgba($primary-500, 0.1);
        border: 1px solid rgba($primary-500, 0.2);
        border-radius: 6px;
        color: $primary-400;
      }
    }
  }
}

.auto-detect-section {
  padding: 16px 24px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .auto-detect-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba($gray-700, 0.3);
    }

    .auto-detect-checkbox {
      display: none;
    }

    .toggle-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 1;

      .toggle-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .toggle-text {
          .toggle-title {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: $text-secondary;
            margin-bottom: 2px;
          }

          .toggle-desc {
            font-size: 12px;
            color: $text-tertiary;
          }
        }
      }

      .toggle-switch {
        width: 44px;
        height: 24px;
        background: rgba($gray-600, 0.5);
        border-radius: 12px;
        position: relative;
        transition: all 0.3s ease;

        &.switch-active {
          background: $primary-500;

          .switch-handle {
            transform: translateX(20px);
          }
        }

        .switch-handle {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
}

.scene-categories {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba($gray-600, 0.2);
  overflow-x: auto;

  .category-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    border-radius: 20px;
    color: $text-secondary;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: rgba($gray-700, 0.3);
      color: $text-primary;
    }

    &.category-active {
      background: rgba($primary-500, 0.2);
      border-color: rgba($primary-500, 0.4);
      color: $primary-300;
    }
  }
}

.scenes-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .scene-card {
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      border-color: rgba($primary-500, 0.3);

      .scene-overlay {
        opacity: 1;
      }
    }

    &.scene-active {
      border-color: $primary-500;
      box-shadow: 0 0 0 2px rgba($primary-500, 0.2);
    }

    .scene-image-container {
      position: relative;
      width: 100%;
      height: 120px;
      overflow: hidden;

      .scene-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }

      .scene-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.7));
        opacity: 0;
        transition: opacity 0.3s ease;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 12px;

        .scene-actions {
          .preview-btn {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;

            &:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          }
        }

        .scene-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba($primary-500, 0.9);
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 11px;
          font-weight: 500;
        }
      }
    }

    .scene-info {
      padding: 12px;

      .scene-name {
        font-size: 14px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 4px;
        line-height: 1.2;
      }

      .scene-description {
        font-size: 12px;
        color: $text-secondary;
        margin: 0 0 8px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .scene-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: $text-tertiary;

        .scene-type,
        .scene-resolution {
          background: rgba($gray-600, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }
  }
}

.selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid rgba($gray-600, 0.2);
  background: rgba($gray-800, 0.5);

  .reset-btn {
    color: $text-tertiary;

    &:hover {
      color: $text-secondary;
    }
  }

  .cancel-btn {
    color: $text-tertiary;

    &:hover {
      color: $text-secondary;
    }
  }
}

// 预览模态框
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-content {
  background: $dark-bg-secondary;
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid rgba($gray-600, 0.2);

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  .preview-image-container {
    width: 100%;
    height: 300px;
    overflow: hidden;

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .preview-info {
    padding: 20px;
    flex: 1;

    p {
      font-size: 14px;
      color: $text-secondary;
      line-height: 1.6;
      margin: 0 0 16px;
    }

    .preview-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: $text-tertiary;
        background: rgba($gray-700, 0.2);
        padding: 4px 8px;
        border-radius: 8px;
      }
    }
  }

  .preview-actions {
    padding: 20px;
    border-top: 1px solid rgba($gray-600, 0.2);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .scene-selector-panel {
    border-radius: 20px 20px 0 0;
    max-height: 100vh;
    margin: 0;
  }

  .selector-header {
    padding: 16px 20px 12px;

    .selector-title {
      font-size: 18px;
    }
  }

  .current-scene-info {
    padding: 12px 20px;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .current-scene-preview {
      width: 60px;
      height: 60px;
    }
  }

  .scenes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 12px 20px;
  }

  .scene-card .scene-image-container {
    height: 100px;
  }

  .scene-categories {
    padding: 12px 20px;
    overflow-x: auto;
  }

  .preview-content {
    .preview-image-container {
      height: 200px;
    }
  }
}

// 动画
.scene-selector-panel {
  animation: modalSlideIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.preview-content {
  animation: previewSlideIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes previewSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .scene-selector-panel,
  .preview-content,
  .scene-card,
  .category-tab {
    transition: none;
  }

  @keyframes modalSlideIn,
  @keyframes previewSlideIn {
    display: none;
  }
}
</style>