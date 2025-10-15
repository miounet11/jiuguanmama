<template>
  <div class="image-preview-overlay" @click="$emit('close')">
    <div class="image-preview-dialog" @click.stop>
      <!-- 头部 -->
      <div class="preview-header">
        <h3 class="preview-title">图像预览</h3>
        <TavernButton
          variant="ghost"
          size="sm"
          @click="$emit('close')"
          class="close-btn"
        >
          <TavernIcon name="x-mark" />
        </TavernButton>
      </div>

      <!-- 图像内容 -->
      <div class="preview-content">
        <div class="image-container">
          <img
            :src="imageData.url"
            :alt="imageData.prompt || '聊天图像'"
            class="preview-image"
            @error="handleImageError"
          />
        </div>

        <!-- 图像信息 -->
        <div v-if="imageData.prompt" class="image-info">
          <h4 class="info-title">
            <TavernIcon name="photo" />
            图像描述
          </h4>
          <p class="info-description">{{ imageData.prompt }}</p>
        </div>

        <!-- 图像操作 -->
        <div class="preview-actions">
          <TavernButton
            variant="outline"
            @click="downloadImage"
            class="action-btn"
          >
            <TavernIcon name="arrow-down-tray" />
            下载
          </TavernButton>
          <TavernButton
            variant="outline"
            @click="copyImageUrl"
            class="action-btn"
          >
            <TavernIcon name="link" />
            复制链接
          </TavernButton>
          <TavernButton
            variant="outline"
            @click="shareImage"
            class="action-btn"
          >
            <TavernIcon name="share" />
            分享
          </TavernButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

export interface ImageData {
  url: string
  prompt?: string
}

const props = defineProps({
  imageData: {
    type: Object as PropType<ImageData>,
    required: true
  }
})

const emit = defineEmits<{
  'close': []
}>()

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const downloadImage = async () => {
  try {
    const response = await fetch(props.imageData.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `image-${Date.now()}.jpg`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

const copyImageUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.imageData.url)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const shareImage = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '聊天图像',
        text: props.imageData.prompt || '查看这张图像',
        url: props.imageData.url
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  } else {
    copyImageUrl()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.image-preview-dialog {
  background: $dark-bg-secondary;
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .preview-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
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

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-container {
  width: 100%;
  max-height: 500px;
  overflow: hidden;
  border-radius: 12px;
  background: rgba($gray-900, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;

  .preview-image {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
    border-radius: 12px;
  }
}

.image-info {
  .info-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: $text-secondary;
    margin: 0 0 8px;
  }

  .info-description {
    font-size: 14px;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
    padding: 12px;
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    border-radius: 10px;
  }
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .image-preview-dialog {
    border-radius: 20px 20px 0 0;
    margin: 0;
    max-height: 100vh;
  }

  .preview-header,
  .preview-content {
    padding-left: 20px;
    padding-right: 20px;
  }

  .preview-actions {
    flex-direction: column;

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>