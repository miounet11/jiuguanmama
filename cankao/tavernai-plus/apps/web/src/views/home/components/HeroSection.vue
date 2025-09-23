<template>
  <section class="hero-section">
    <!-- 背景装饰 -->
    <div class="hero-background">
      <div class="hero-gradient" />
      <div class="hero-particles">
        <div
          v-for="i in 20"
          :key="i"
          class="particle"
          :style="{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }"
        />
      </div>
    </div>

    <div class="hero-container">
      <!-- 主要内容区 -->
      <div class="hero-content">
        <div class="hero-badge">
          <TavernBadge variant="success" size="sm" soft>
            <TavernIcon name="sparkles" size="xs" />
            全新AI角色体验
          </TavernBadge>
        </div>

        <h1 class="hero-title">
          与AI角色的
          <span class="hero-highlight">深度对话</span>
          <br>
          尽在九馆爸爸
        </h1>

        <p class="hero-subtitle">
          专为宅文化打造的沉浸式AI角色扮演平台<br>
          超过 <span class="hero-stats-highlight">{{ stats.totalCharacters }}+</span> 个精彩角色等你探索
        </p>

        <div class="hero-actions">
          <TavernButton
            variant="primary"
            size="xl"
            icon-left="sparkles"
            class="hero-cta-primary"
            @click="startExploring"
          >
            开始体验
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="xl"
            icon-left="play"
            class="hero-cta-secondary"
            @click="watchDemo"
          >
            观看演示
          </TavernButton>
        </div>

        <!-- 社交证明 -->
        <div class="hero-social-proof">
          <div class="social-proof-item">
            <div class="proof-avatars">
              <div
                v-for="i in 5"
                :key="i"
                class="proof-avatar"
                :style="`background: linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})`"
              >
                {{ String.fromCharCode(65 + i) }}
              </div>
            </div>
            <div class="proof-text">
              <span class="proof-number">{{ formatNumber(stats.totalUsers) }}+</span>
              <span class="proof-label">用户选择</span>
            </div>
          </div>

          <div class="social-proof-rating">
            <div class="rating-stars">
              <TavernIcon
                v-for="i in 5"
                :key="i"
                name="star"
                size="sm"
                class="rating-star"
              />
            </div>
            <span class="rating-text">4.9 综合评分</span>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="hero-preview">
        <div class="preview-container">
          <!-- 聊天预览窗口 -->
          <div class="chat-preview-window">
            <div class="chat-header">
              <div class="chat-avatar">
                <img
                  v-if="featuredChar?.avatar"
                  :src="featuredChar.avatar"
                  :alt="featuredChar?.name"
                  class="chat-avatar-img"
                />
                <div v-else class="chat-avatar-placeholder">
                  {{ featuredChar?.name?.charAt(0) || 'A' }}
                </div>
              </div>
              <div class="chat-info">
                <h4 class="chat-char-name">{{ featuredChar?.name || '精选角色' }}</h4>
                <p class="chat-char-status">在线</p>
              </div>
              <div class="chat-actions">
                <div class="status-dot" />
              </div>
            </div>

            <div class="chat-messages">
              <div
                v-for="(message, index) in previewMessages"
                :key="index"
                :class="[
                  'chat-message',
                  `chat-message--${message.role}`
                ]"
              >
                <div class="message-content">
                  {{ message.content }}
                </div>
                <div class="message-time">
                  {{ message.time }}
                </div>
              </div>

              <!-- 输入中动画 -->
              <div class="chat-message chat-message--typing">
                <div class="typing-indicator">
                  <div class="typing-dot" />
                  <div class="typing-dot" />
                  <div class="typing-dot" />
                </div>
              </div>
            </div>

            <div class="chat-input-preview">
              <div class="input-placeholder">输入消息...</div>
              <TavernButton variant="primary" size="sm" class="send-btn">
                <TavernIcon name="send" />
              </TavernButton>
            </div>
          </div>

          <!-- 浮动角色卡片 -->
          <div class="floating-characters">
            <div
              v-for="(char, index) in floatingChars"
              :key="char.id"
              class="floating-char"
              :style="{
                animationDelay: `${index * 0.3}s`,
                top: `${20 + index * 15}%`,
                right: `${-10 + index * 5}%`
              }"
            >
              <CharacterQuickCard :character="char" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TavernButton,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'
import CharacterQuickCard from '@/components/common/CharacterQuickCard.vue'
import { useHomeStats } from '../composables/useHomeStats'
import { useFeatureChars } from '../composables/useFeatureChars'

const router = useRouter()
const { stats } = useHomeStats()
const { featuredChars } = useFeatureChars()

// 计算属性
const featuredChar = computed(() => featuredChars.value[0])
const floatingChars = computed(() => featuredChars.value.slice(1, 4))

// 预览消息
const previewMessages = ref([
  {
    role: 'user',
    content: '你好，能介绍一下你自己吗？',
    time: '14:20'
  },
  {
    role: 'assistant',
    content: '你好～我是一个充满好奇心的AI角色，很高兴认识你！我最喜欢和人类聊天，了解这个世界的奇妙之处。',
    time: '14:21'
  },
  {
    role: 'user',
    content: '我们可以聊什么话题呢？',
    time: '14:22'
  }
])

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getRandomColor = (): string => {
  const colors = [
    'var(--brand-primary-400)',
    'var(--brand-secondary-400)',
    'var(--brand-accent-400)',
    '#f59e0b',
    '#f87171'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 事件处理
const startExploring = () => {
  router.push('/characters')
}

const watchDemo = () => {
  // 这里可以打开演示视频或启动引导
  ElMessage.success('演示功能即将推出！')
}

onMounted(() => {
  // 可以在这里添加一些入场动画或数据预加载
})
</script>

<style lang="scss">
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;

  // 背景系统
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-below);
  }

  .hero-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      var(--brand-primary-900) 0%,
      var(--brand-primary-800) 25%,
      var(--brand-secondary-900) 75%,
      var(--brand-accent-900) 100%
    );

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at 30% 20%,
        rgba(168, 85, 247, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        ellipse at 70% 80%,
        rgba(59, 130, 246, 0.2) 0%,
        transparent 50%
      );
    }
  }

  .hero-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: var(--brand-primary-400);
      border-radius: var(--radius-full);
      opacity: 0.6;
      animation: float 6s ease-in-out infinite;

      &:nth-child(even) {
        background: var(--brand-secondary-400);
      }

      &:nth-child(3n) {
        background: var(--brand-accent-400);
        width: 2px;
        height: 2px;
      }
    }
  }

  // 容器布局
  .hero-container {
    width: 100%;
    max-width: var(--container-2xl);
    margin: 0 auto;
    padding: var(--section-padding-y) var(--container-padding);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16);
    align-items: center;
    position: relative;
    z-index: var(--z-content);
  }

  // 内容区域
  .hero-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .hero-badge {
    align-self: flex-start;
  }

  .hero-title {
    font-size: var(--text-6xl);
    font-weight: var(--font-bold);
    line-height: var(--leading-tight);
    color: var(--text-primary);
    margin: 0;

    .hero-highlight {
      background: linear-gradient(
        135deg,
        var(--brand-primary-400),
        var(--brand-accent-400)
      );
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      background-size: 200% 200%;
      animation: gradient-shift 3s ease-in-out infinite;
    }
  }

  .hero-subtitle {
    font-size: var(--text-xl);
    line-height: var(--leading-relaxed);
    color: var(--text-secondary);
    margin: 0;

    .hero-stats-highlight {
      color: var(--brand-accent-400);
      font-weight: var(--font-semibold);
    }
  }

  .hero-actions {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-2);

    .hero-cta-primary {
      background: linear-gradient(
        135deg,
        var(--brand-primary-500),
        var(--brand-primary-400)
      );
      border: none;
      box-shadow: var(--shadow-primary);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg), var(--shadow-primary);
      }
    }

    .hero-cta-secondary {
      backdrop-filter: blur(var(--space-2));
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
    }
  }

  // 社交证明
  .hero-social-proof {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    margin-top: var(--space-4);
    padding-top: var(--space-6);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .social-proof-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .proof-avatars {
    display: flex;
    margin-right: calc(-1 * var(--space-1));

    .proof-avatar {
      width: var(--space-8);
      height: var(--space-8);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      color: white;
      border: 2px solid var(--surface-1);
      margin-left: calc(-1 * var(--space-1));
      z-index: var(--z-content);
    }
  }

  .proof-text {
    display: flex;
    flex-direction: column;

    .proof-number {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      color: var(--text-primary);
    }

    .proof-label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }
  }

  .social-proof-rating {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .rating-stars {
      display: flex;
      gap: var(--space-0-5);

      .rating-star {
        color: var(--warning);
      }
    }

    .rating-text {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-weight: var(--font-medium);
    }
  }

  // 预览区域
  .hero-preview {
    position: relative;
    height: 600px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  // 聊天预览窗口
  .chat-preview-window {
    position: relative;
    width: 400px;
    height: 500px;
    background: var(--surface-2);
    border-radius: var(--radius-2xl);
    border: 1px solid var(--border-secondary);
    box-shadow: var(--shadow-2xl);
    backdrop-filter: blur(var(--space-4));
    overflow: hidden;
    z-index: var(--z-raised);
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-secondary);
  }

  .chat-avatar {
    width: var(--space-10);
    height: var(--space-10);
    border-radius: var(--radius-full);
    overflow: hidden;
    flex-shrink: 0;

    .chat-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .chat-avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--brand-primary-400), var(--brand-secondary-400));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-bold);
      color: white;
    }
  }

  .chat-info {
    flex: 1;

    .chat-char-name {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-0-5) 0;
    }

    .chat-char-status {
      font-size: var(--text-xs);
      color: var(--brand-accent-400);
      margin: 0;
    }
  }

  .chat-actions {
    .status-dot {
      width: var(--space-2);
      height: var(--space-2);
      background: var(--brand-accent-400);
      border-radius: var(--radius-full);
      animation: pulse 2s infinite;
    }
  }

  .chat-messages {
    flex: 1;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    height: 350px;
    overflow-y: auto;
  }

  .chat-message {
    display: flex;
    flex-direction: column;
    max-width: 80%;

    &--user {
      align-self: flex-end;
      align-items: flex-end;

      .message-content {
        background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-400));
        color: white;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg) var(--radius-lg) var(--radius-base) var(--radius-lg);
      }
    }

    &--assistant {
      align-self: flex-start;

      .message-content {
        background: var(--surface-3);
        color: var(--text-primary);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-base);
        border: 1px solid var(--border-secondary);
      }
    }

    &--typing {
      align-self: flex-start;

      .typing-indicator {
        display: flex;
        gap: var(--space-1);
        padding: var(--space-3) var(--space-4);
        background: var(--surface-3);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-secondary);

        .typing-dot {
          width: var(--space-1-5);
          height: var(--space-1-5);
          background: var(--text-tertiary);
          border-radius: var(--radius-full);
          animation: typing-bounce 1.4s infinite ease-in-out;

          &:nth-child(2) {
            animation-delay: 0.16s;
          }

          &:nth-child(3) {
            animation-delay: 0.32s;
          }
        }
      }
    }

    .message-time {
      font-size: var(--text-2xs);
      color: var(--text-quaternary);
      margin-top: var(--space-1);
    }
  }

  .chat-input-preview {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--surface-3);
    border-top: 1px solid var(--border-secondary);

    .input-placeholder {
      flex: 1;
      padding: var(--space-3);
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      border-radius: var(--radius-base);
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }

    .send-btn {
      flex-shrink: 0;
    }
  }

  // 浮动角色卡片
  .floating-characters {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .floating-char {
    position: absolute;
    animation: float-gentle 4s ease-in-out infinite;
    opacity: 0.9;

    &:nth-child(even) {
      animation-direction: reverse;
    }

    &:nth-child(3n) {
      animation-duration: 5s;
    }
  }

  // === 响应式设计 ===

  // 平板端
  @media (max-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr;
      gap: var(--space-12);
      text-align: center;
    }

    .hero-title {
      font-size: var(--text-5xl);
    }

    .chat-preview-window {
      width: 350px;
      height: 450px;
    }
  }

  // 移动端
  @media (max-width: 640px) {
    min-height: 100vh;
    padding-top: var(--space-16);

    .hero-container {
      padding: var(--space-8) var(--space-4);
      gap: var(--space-8);
    }

    .hero-title {
      font-size: var(--text-4xl);
      br {
        display: none;
      }
    }

    .hero-subtitle {
      font-size: var(--text-lg);
      br {
        display: none;
      }
    }

    .hero-actions {
      flex-direction: column;
      gap: var(--space-3);

      .tavern-button {
        width: 100%;
      }
    }

    .hero-social-proof {
      flex-direction: column;
      gap: var(--space-4);
      text-align: center;
    }

    .chat-preview-window {
      width: 300px;
      height: 400px;
    }

    .floating-char {
      display: none; // 移动端隐藏浮动卡片
    }
  }
}

// === 动画定义 ===

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.4;
  }
  25% {
    opacity: 1;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    opacity: 0.6;
  }
}

@keyframes float-gentle {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
  }
  40% {
    transform: scale(1.2);
  }
}

// === 可访问性优化 ===

@media (prefers-reduced-motion: reduce) {
  .particle,
  .floating-char,
  .hero-highlight,
  .status-dot,
  .typing-dot {
    animation: none;
  }

  .hero-cta-primary:hover,
  .hero-cta-secondary:hover {
    transform: none;
  }
}

// === 焦点管理 ===

.hero-cta-primary:focus,
.hero-cta-secondary:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>