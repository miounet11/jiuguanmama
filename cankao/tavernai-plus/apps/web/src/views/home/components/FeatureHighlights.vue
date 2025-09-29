<template>
  <section class="feature-highlights">
    <div class="highlights-container">
      <!-- 区块头部 -->
      <div class="highlights-header">
        <div class="header-badge">
          <TavernBadge variant="secondary" size="sm" soft>
            <TavernIcon name="magic" size="xs" />
            核心功能
          </TavernBadge>
        </div>

        <h2 class="highlights-title">
          为什么选择<span class="title-highlight">九馆爸爸</span>？
        </h2>

        <p class="highlights-subtitle">
          专为宅男宅女量身打造的AI角色扮演平台，提供前所未有的沉浸式体验
        </p>
      </div>

      <!-- 功能网格 -->
      <div class="features-grid">
        <!-- 主要功能卡片 -->
        <div
          v-for="(feature, index) in mainFeatures"
          :key="feature.id"
          :class="[
            'feature-card',
            `feature-card--${feature.type}`,
            `feature-card--${feature.size}`
          ]"
          :data-index="index"
          @click="exploreFeature(feature)"
        >
          <!-- 卡片背景装饰 -->
          <div class="card-background">
            <div class="background-pattern" />
            <div class="background-glow" :style="{ '--glow-color': feature.color }" />
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 图标区域 -->
            <div class="feature-icon" :style="{ '--icon-color': feature.color }">
              <TavernIcon :name="feature.icon" size="xl" />
            </div>

            <!-- 标题和描述 -->
            <div class="feature-text">
              <h3 class="feature-title">
                {{ feature.title }}
                <TavernBadge
                  v-if="feature.badge"
                  :variant="feature.badgeVariant"
                  size="xs"
                  soft
                >
                  {{ feature.badge }}
                </TavernBadge>
              </h3>

              <p class="feature-description">
                {{ feature.description }}
              </p>

              <!-- 亮点列表 -->
              <ul v-if="feature.highlights" class="feature-highlights-list">
                <li
                  v-for="highlight in feature.highlights"
                  :key="highlight"
                  class="highlight-item"
                >
                  <TavernIcon name="check" size="xs" />
                  {{ highlight }}
                </li>
              </ul>
            </div>

            <!-- 操作按钮 -->
            <div v-if="feature.action" class="feature-action">
              <TavernButton
                :variant="feature.action.variant"
                :size="feature.size === 'large' ? 'md' : 'sm'"
                :icon-right="feature.action.icon"
                @click.stop="performAction(feature.action)"
              >
                {{ feature.action.label }}
              </TavernButton>
            </div>

            <!-- 统计数据 -->
            <div v-if="feature.stats" class="feature-stats">
              <div
                v-for="stat in feature.stats"
                :key="stat.label"
                class="stat-item"
              >
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>

            <!-- 预览图 -->
            <div v-if="feature.preview" class="feature-preview">
              <img
                :src="feature.preview.image"
                :alt="feature.preview.alt"
                class="preview-image"
                loading="lazy"
              />
              <div v-if="feature.preview.caption" class="preview-caption">
                {{ feature.preview.caption }}
              </div>
            </div>
          </div>

          <!-- 交互提示 -->
          <div class="card-hover-hint">
            <TavernIcon name="arrow-right" size="sm" />
          </div>
        </div>
      </div>

      <!-- 次要功能列表 -->
      <div class="secondary-features">
        <h3 class="secondary-title">更多精彩功能</h3>
        <div class="secondary-grid">
          <div
            v-for="feature in secondaryFeatures"
            :key="feature.id"
            class="secondary-feature"
          >
            <div class="secondary-icon">
              <TavernIcon :name="feature.icon" size="md" />
            </div>
            <div class="secondary-content">
              <h4 class="secondary-feature-title">{{ feature.title }}</h4>
              <p class="secondary-description">{{ feature.description }}</p>
            </div>
            <div v-if="feature.comingSoon" class="coming-soon-badge">
              <TavernBadge variant="warning" size="xs" soft>即将推出</TavernBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户反馈 -->
      <div class="user-testimonials">
        <h3 class="testimonials-title">用户怎么说</h3>
        <div class="testimonials-grid">
          <div
            v-for="testimonial in testimonials"
            :key="testimonial.id"
            class="testimonial-card"
          >
            <div class="testimonial-quote">
              "{{ testimonial.content }}"
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">
                <img
                  v-if="testimonial.avatar"
                  :src="testimonial.avatar"
                  :alt="testimonial.name"
                />
                <span v-else class="avatar-placeholder">
                  {{ testimonial.name.charAt(0) }}
                </span>
              </div>
              <div class="author-info">
                <div class="author-name">{{ testimonial.name }}</div>
                <div class="author-title">{{ testimonial.title }}</div>
              </div>
            </div>
            <div class="testimonial-rating">
              <TavernIcon
                v-for="i in 5"
                :key="i"
                name="star"
                size="xs"
                :class="i <= testimonial.rating ? 'star-filled' : 'star-empty'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TavernButton,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'

const router = useRouter()

// 主要功能特性
const mainFeatures = ref([
  {
    id: 'spacetime-tavern',
    type: 'primary',
    size: 'large',
    icon: 'portal',
    title: '时空酒馆系统',
    description: '打破时空壁垒，让古今中外的角色在时空交汇中进行深度互动，体验前所未有的文化碰撞。',
    color: '#9333ea',
    badge: '时空',
    badgeVariant: 'success' as const,
    highlights: [
      '时空交汇的多元宇宙体验',
      'MBTI性格驱动的深度互动',
      '角色关联网络的可视化探索',
      '文化碰撞与化学反应'
    ],
    action: {
      label: '探索时空网络',
      variant: 'primary' as const,
      icon: 'share',
      target: '/character-network'
    },
    stats: [
      { value: '15+', label: '时空剧本' },
      { value: '100+', label: '关联角色' }
    ]
  },
  {
    id: 'smart-chat',
    type: 'secondary',
    size: 'large',
    icon: 'brain',
    title: '智能对话引擎',
    description: '基于最先进的AI技术，提供自然流畅的对话体验，支持情感理解和上下文记忆。',
    color: 'var(--brand-primary-500)',
    badge: 'AI',
    badgeVariant: 'success' as const,
    highlights: [
      '支持GPT-4、Claude-3等顶级模型',
      '智能情感识别和回应',
      '长期记忆和个性化学习',
      '多语言对话支持'
    ],
    action: {
      label: '开始对话',
      variant: 'primary' as const,
      icon: 'arrow-right',
      target: '/chat'
    },
    stats: [
      { value: '99.9%', label: '响应准确率' },
      { value: '< 0.5s', label: '平均响应时间' }
    ]
  },
  {
    id: 'character-creation',
    type: 'secondary',
    size: 'medium',
    icon: 'palette',
    title: '角色创作工坊',
    description: '强大的角色编辑器，支持详细的性格设定、背景故事和对话风格定制。',
    color: 'var(--brand-secondary-500)',
    highlights: [
      'AI辅助角色生成',
      '丰富的模板库',
      '社区分享和交流',
      '版本管理和备份'
    ],
    action: {
      label: '创建角色',
      variant: 'secondary' as const,
      icon: 'plus',
      target: '/studio/character/create'
    }
  },
  {
    id: 'marketplace',
    type: 'accent',
    size: 'medium',
    icon: 'store',
    title: '角色市场',
    description: '海量优质角色库，涵盖动漫、游戏、历史、原创等各种类型。',
    color: 'var(--brand-accent-500)',
    stats: [
      { value: '10,000+', label: '精选角色' },
      { value: '4.8★', label: '平均评分' }
    ],
    action: {
      label: '探索市场',
      variant: 'tertiary' as const,
      icon: 'explore',
      target: '/marketplace'
    }
  },
  {
    id: 'privacy-security',
    type: 'neutral',
    size: 'medium',
    icon: 'shield',
    title: '隐私与安全',
    description: '端到端加密保护，严格的隐私政策，确保您的对话数据安全。',
    color: 'var(--success)',
    highlights: [
      'AES-256加密传输',
      '本地数据存储选项',
      '完全匿名对话模式',
      '数据删除权保障'
    ],
    badge: '安全',
    badgeVariant: 'success' as const
  }
])

// 次要功能列表
const secondaryFeatures = ref([
  {
    id: 'voice-chat',
    icon: 'microphone',
    title: '语音对话',
    description: '真实的语音交互，支持多种音色和情感表达',
    comingSoon: true
  },
  {
    id: 'group-chat',
    icon: 'users',
    title: '多人聊天室',
    description: '与朋友一起体验群聊乐趣，角色可以参与群组对话'
  },
  {
    id: 'custom-scenarios',
    icon: 'book',
    title: '情景模式',
    description: '预设对话场景，快速进入特定的角色扮演环境'
  },
  {
    id: 'ai-generator',
    icon: 'magic',
    title: 'AI生成助手',
    description: '智能生成角色头像、背景故事和对话内容'
  },
  {
    id: 'emotion-analysis',
    icon: 'heart',
    title: '情感分析',
    description: '实时分析对话情绪，提供更贴心的交互体验'
  },
  {
    id: 'export-import',
    icon: 'download',
    title: '导入导出',
    description: '支持多种格式的角色数据导入导出，兼容主流平台'
  }
])

// 用户证言
const testimonials = ref([
  {
    id: 1,
    content: '九馆爸爸让我找到了完美的聊天伙伴，AI角色的回应非常自然，仿佛真的有人在陪伴我。',
    name: '小萌',
    title: '动漫爱好者',
    rating: 5,
    avatar: null
  },
  {
    id: 2,
    content: '角色创作功能太棒了！我可以轻松创建自己喜欢的角色类型，还能和朋友分享。',
    name: '阿宅',
    title: '创作者',
    rating: 5,
    avatar: null
  },
  {
    id: 3,
    content: '界面设计很用心，深色主题对眼睛友好，功能丰富但不复杂，很适合我们宅文化爱好者。',
    name: '夜猫子',
    title: '资深用户',
    rating: 5,
    avatar: null
  }
])

// 方法
const exploreFeature = (feature: any) => {
  if (feature.action?.target) {
    router.push(feature.action.target)
  } else {
    ElMessage.info(`了解更多关于${feature.title}的信息`)
  }
}

const performAction = (action: any) => {
  if (action.target) {
    router.push(action.target)
  }
}

// 生命周期
onMounted(() => {
  // 添加入场动画
  nextTick(() => {
    const cards = document.querySelectorAll('.feature-card')
    cards.forEach((card, index) => {
      (card as HTMLElement).style.animationDelay = `${index * 0.2}s`
      card.classList.add('slide-up')
    })

    const secondaryItems = document.querySelectorAll('.secondary-feature')
    secondaryItems.forEach((item, index) => {
      (item as HTMLElement).style.animationDelay = `${(index + cards.length) * 0.1}s`
      item.classList.add('fade-in')
    })
  })
})
</script>

<style lang="scss">
.feature-highlights {
  padding: var(--section-padding-y) 0;
  background: linear-gradient(
    180deg,
    var(--surface-1) 0%,
    var(--surface-0) 50%,
    var(--surface-1) 100%
  );
  position: relative;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 0;
    right: 0;
    height: 400px;
    background: radial-gradient(
      ellipse at center,
      rgba(168, 85, 247, 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .highlights-container {
    width: 100%;
    max-width: var(--container-2xl);
    margin: 0 auto;
    padding: 0 var(--container-padding);
    position: relative;
    z-index: var(--z-content);
  }

  // === 头部区域 ===
  .highlights-header {
    text-align: center;
    margin-bottom: var(--space-16);

    .header-badge {
      margin-bottom: var(--space-4);
      display: inline-block;
    }
  }

  .highlights-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4) 0;
    line-height: var(--leading-tight);

    .title-highlight {
      background: linear-gradient(
        135deg,
        var(--brand-primary-400),
        var(--brand-accent-400)
      );
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
  }

  .highlights-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 auto;
    max-width: 600px;
  }

  // === 功能网格 ===
  .features-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-6);
    margin-bottom: var(--space-20);
  }

  .feature-card {
    position: relative;
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--card-radius);
    padding: var(--card-padding-lg);
    cursor: pointer;
    overflow: hidden;
    transition: var(--card-transition);
    opacity: 0;
    transform: translateY(var(--space-8));

    &.slide-up {
      animation: slideUp var(--duration-moderate) var(--ease-out) forwards;
    }

    // 尺寸变体
    &--large {
      grid-column: span 6;
    }

    &--medium {
      grid-column: span 3;
    }

    &--small {
      grid-column: span 2;
    }

    // 悬浮效果
    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow-hover);
      border-color: var(--border-accent);

      .background-glow {
        opacity: 0.1;
        scale: 1.2;
      }

      .card-hover-hint {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }

  // 卡片背景
  .card-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-below);
  }

  .background-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.03;
    background-image: radial-gradient(circle, var(--text-primary) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .background-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, var(--glow-color), transparent);
    border-radius: var(--radius-full);
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: var(--transition-all);
  }

  // 卡片内容
  .card-content {
    position: relative;
    z-index: var(--z-content);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .feature-icon {
    width: var(--space-16);
    height: var(--space-16);
    background: linear-gradient(135deg, var(--icon-color), transparent);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: var(--space-6);
    flex-shrink: 0;
  }

  .feature-text {
    flex: 1;
    margin-bottom: var(--space-6);
  }

  .feature-title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: var(--leading-tight);
  }

  .feature-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-4) 0;
  }

  .feature-highlights-list {
    list-style: none;
    padding: 0;
    margin: 0;

    .highlight-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin-bottom: var(--space-2);

      .tavern-icon {
        color: var(--success);
        flex-shrink: 0;
      }
    }
  }

  .feature-action {
    margin-bottom: var(--space-4);
  }

  .feature-stats {
    display: flex;
    gap: var(--space-6);

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);

      .stat-value {
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        color: var(--text-primary);
      }

      .stat-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
      }
    }
  }

  .feature-preview {
    margin-top: var(--space-4);

    .preview-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-secondary);
    }

    .preview-caption {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-align: center;
      margin-top: var(--space-2);
    }
  }

  .card-hover-hint {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    opacity: 0;
    transform: translateX(-var(--space-2));
    transition: var(--transition-all);
    color: var(--text-tertiary);
  }

  // === 次要功能 ===
  .secondary-features {
    margin-bottom: var(--space-20);
  }

  .secondary-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-align: center;
    margin: 0 0 var(--space-12) 0;
  }

  .secondary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);
  }

  .secondary-feature {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6);
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    transition: var(--card-transition);
    position: relative;
    opacity: 0;

    &.fade-in {
      animation: fadeIn var(--duration-normal) var(--ease-out) forwards;
    }

    &:hover {
      background: var(--surface-3);
      transform: translateY(-2px);
    }
  }

  .secondary-icon {
    width: var(--space-12);
    height: var(--space-12);
    background: var(--surface-3);
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .secondary-content {
    flex: 1;

    .secondary-feature-title {
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .secondary-description {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin: 0;
      line-height: var(--leading-relaxed);
    }
  }

  .coming-soon-badge {
    flex-shrink: 0;
  }

  // === 用户证言 ===
  .user-testimonials {
    .testimonials-title {
      font-size: var(--text-2xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      text-align: center;
      margin: 0 0 var(--space-12) 0;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-6);
    }

    .testimonial-card {
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      transition: var(--card-transition);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--card-shadow);
      }
    }

    .testimonial-quote {
      font-size: var(--text-base);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
      margin-bottom: var(--space-4);
      font-style: italic;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .author-avatar {
      width: var(--space-10);
      height: var(--space-10);
      border-radius: var(--radius-full);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
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

    .author-info {
      .author-name {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        color: var(--text-primary);
      }

      .author-title {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
      }
    }

    .testimonial-rating {
      display: flex;
      gap: var(--space-1);

      .star-filled {
        color: var(--warning);
      }

      .star-empty {
        color: var(--text-quaternary);
      }
    }
  }

  // === 响应式设计 ===

  @media (max-width: 1024px) {
    .features-grid {
      grid-template-columns: repeat(6, 1fr);

      .feature-card {
        &--large {
          grid-column: span 6;
        }

        &--medium {
          grid-column: span 3;
        }
      }
    }

    .highlights-title {
      font-size: var(--text-3xl);
    }
  }

  @media (max-width: 768px) {
    padding: var(--space-16) 0;

    .highlights-container {
      padding: 0 var(--space-4);
    }

    .highlights-header {
      margin-bottom: var(--space-12);
    }

    .highlights-title {
      font-size: var(--text-2xl);
    }

    .highlights-subtitle {
      font-size: var(--text-base);
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);

      .feature-card {
        grid-column: span 1;
      }
    }

    .secondary-grid {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    .testimonials-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }

  @media (max-width: 480px) {
    .feature-card {
      padding: var(--card-padding-md);
    }

    .feature-icon {
      width: var(--space-12);
      height: var(--space-12);
    }

    .feature-title {
      font-size: var(--text-lg);
    }

    .secondary-feature {
      padding: var(--space-4);
    }
  }
}

// === 动画定义 ===

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(var(--space-8));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// === 可访问性优化 ===

@media (prefers-reduced-motion: reduce) {
  .feature-card,
  .secondary-feature {
    animation: none !important;
    opacity: 1;
    transform: none;
  }

  .feature-card:hover,
  .secondary-feature:hover,
  .testimonial-card:hover {
    transform: none;
  }

  .background-glow {
    transition: none;
  }
}

// === 焦点管理 ===

.feature-card:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>