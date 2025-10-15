<template>
  <div class="typing-indicator">
    <div class="typing-avatar">
      <img
        v-if="character?.avatar"
        :src="character.avatar"
        :alt="character.name"
        class="avatar-image"
      />
      <div v-else class="default-avatar">
        <TavernIcon name="sparkles" />
      </div>
    </div>
    <div class="typing-content">
      <div class="typing-bubbles">
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
      </div>
      <span class="typing-text">{{ characterName }} 正在输入...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'

export interface Character {
  name: string
  avatar?: string
}

const props = defineProps({
  characterName: {
    type: String,
    required: true
  },
  character: {
    type: Object as PropType<Character>,
    default: null
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba($dark-bg-secondary, 0.8);
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  margin: 8px 0;
  animation: typingSlideIn 0.3s ease;
}

.typing-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
  }
}

.typing-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.typing-bubbles {
  display: flex;
  gap: 3px;

  .bubble {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $primary-400;
    animation: typingBounce 1.4s ease-in-out infinite;

    &.bubble-1 {
      animation-delay: -0.32s;
    }

    &.bubble-2 {
      animation-delay: -0.16s;
    }
  }
}

.typing-text {
  font-size: 13px;
  color: $text-tertiary;
  font-style: italic;
}

@keyframes typingSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>