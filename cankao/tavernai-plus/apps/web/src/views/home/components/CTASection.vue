<template>
  <section class="cta-section">
    <!-- 背景装饰 -->
    <div class="cta-background">
      <div class="gradient-overlay" />
      <div class="pattern-overlay" />
      <div class="floating-elements">
        <div
          v-for="i in 15"
          :key="i"
          class="floating-element"
          :style="{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 3}s`
          }"
        />
      </div>
    </div>

    <div class="cta-container">
      <!-- 主要CTA区域 -->
      <div class="primary-cta">
        <div class="cta-content">
          <!-- 徽章 -->
          <div class="cta-badge">
            <TavernBadge variant="warning" size="md" soft>
              <TavernIcon name="sparkles" size="sm" />
              开启AI对话之旅
            </TavernBadge>
          </div>

          <!-- 主标题 -->
          <h2 class="cta-title">
            准备好与AI角色
            <span class="title-gradient">深度交流</span>了吗？
          </h2>

          <!-- 副标题 -->
          <p class="cta-subtitle">
            加入 <span class="highlight-number">{{ formatNumber(stats.totalUsers) }}+</span> 用户的行列，
            体验前所未有的AI角色扮演对话。现在注册即可获得
            <span class="highlight-bonus">100免费对话积分</span>！
          </p>

          <!-- 主要操作按钮 -->
          <div class="cta-actions">
            <TavernButton
              variant="primary"
              size="xl"
              icon-left="rocket"
              class="cta-primary-btn"
              :loading="isRegistering"
              @click="startRegistration"
            >
              立即免费注册
            </TavernButton>

            <TavernButton
              variant="ghost"
              size="xl"
              icon-left="play"
              class="cta-secondary-btn"
              @click="watchDemo"
            >
              观看产品演示
            </TavernButton>
          </div>

          <!-- 信任指标 -->
          <div class="trust-indicators">
            <div class="indicator-item">
              <TavernIcon name="shield" size="sm" />
              <span>数据安全保护</span>
            </div>
            <div class="indicator-item">
              <TavernIcon name="zap" size="sm" />
              <span>即时响应</span>
            </div>
            <div class="indicator-item">
              <TavernIcon name="heart" size="sm" />
              <span>用户满意度{{ stats.satisfaction }}%</span>
            </div>
          </div>
        </div>

        <!-- 预览展示 -->
        <div class="cta-preview">
          <div class="preview-window">
            <!-- 模拟聊天界面 -->
            <div class="chat-preview">
              <div class="chat-header">
                <div class="avatar-placeholder">AI</div>
                <div class="chat-info">
                  <div class="chat-title">开始你的第一次对话</div>
                  <div class="chat-status">准备就绪</div>
                </div>
              </div>

              <div class="chat-messages">
                <div
                  v-for="(message, index) in demoMessages"
                  :key="index"
                  :class="[
                    'demo-message',
                    `demo-message--${message.type}`
                  ]"
                  :style="{ animationDelay: `${index * 0.8}s` }"
                >
                  <div class="message-content">{{ message.content }}</div>
                </div>

                <!-- 输入中提示 -->
                <div
                  v-if="showTyping"
                  class="demo-message demo-message--typing"
                  :style="{ animationDelay: `${demoMessages.length * 0.8}s` }"
                >
                  <div class="typing-indicator">
                    <div class="typing-dot" />
                    <div class="typing-dot" />
                    <div class="typing-dot" />
                  </div>
                </div>
              </div>

              <div class="chat-input">
                <div class="input-field">输入你的消息...</div>
                <div class="send-button">
                  <TavernIcon name="send" size="sm" />
                </div>
              </div>
            </div>

            <!-- 功能亮点卡片 -->
            <div class="feature-cards">
              <div
                v-for="(feature, index) in quickFeatures"
                :key="feature.id"
                class="feature-card"
                :style="{ animationDelay: `${1 + index * 0.2}s` }"
              >
                <div class="feature-icon" :style="{ color: feature.color }">
                  <TavernIcon :name="feature.icon" size="lg" />
                </div>
                <div class="feature-content">
                  <h4 class="feature-name">{{ feature.name }}</h4>
                  <p class="feature-desc">{{ feature.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 次要CTA区域 -->
      <div class="secondary-cta">
        <div class="secondary-grid">
          <!-- 开发者CTA -->
          <div class="secondary-card developer-card">
            <div class="card-header">
              <TavernIcon name="code" size="xl" class="card-icon" />
              <div class="card-badge">
                <TavernBadge variant="secondary" size="xs" soft>开发者</TavernBadge>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">API集成服务</h3>
              <p class="card-description">
                将AI角色对话能力集成到你的应用中，提供完整的SDK和文档支持
              </p>
              <div class="card-features">
                <div class="feature-tag">RESTful API</div>
                <div class="feature-tag">WebSocket</div>
                <div class="feature-tag">SDK支持</div>
              </div>
            </div>
            <div class="card-action">
              <TavernButton
                variant="secondary"
                size="md"
                icon-right="arrow-right"
                @click="exploreAPI"
              >
                查看API文档
              </TavernButton>
            </div>
          </div>

          <!-- 企业CTA -->
          <div class="secondary-card enterprise-card">
            <div class="card-header">
              <TavernIcon name="building" size="xl" class="card-icon" />
              <div class="card-badge">
                <TavernBadge variant="accent" size="xs" soft>企业版</TavernBadge>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">企业定制方案</h3>
              <p class="card-description">
                为企业客户提供私有部署、定制开发和专属技术支持服务
              </p>
              <div class="card-features">
                <div class="feature-tag">私有部署</div>
                <div class="feature-tag">定制开发</div>
                <div class="feature-tag">专属支持</div>
              </div>
            </div>
            <div class="card-action">
              <TavernButton
                variant="tertiary"
                size="md"
                icon-right="arrow-right"
                @click="contactSales"
              >
                联系销售
              </TavernButton>
            </div>
          </div>

          <!-- 社区CTA -->
          <div class="secondary-card community-card">
            <div class="card-header">
              <TavernIcon name="users" size="xl" class="card-icon" />
              <div class="card-badge">
                <TavernBadge variant="primary" size="xs" soft>社区</TavernBadge>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">加入用户社区</h3>
              <p class="card-description">
                与其他用户分享创作、交流经验，参与角色扮演文化建设
              </p>
              <div class="card-stats">
                <div class="stat">
                  <span class="stat-number">{{ formatNumber(stats.totalUsers) }}</span>
                  <span class="stat-label">活跃用户</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ formatNumber(stats.totalCharacters) }}</span>
                  <span class="stat-label">共享角色</span>
                </div>
              </div>
            </div>
            <div class="card-action">
              <TavernButton
                variant="primary"
                size="md"
                icon-right="arrow-right"
                @click="joinCommunity"
              >
                立即加入
              </TavernButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="bottom-info">
        <div class="info-grid">
          <div class="info-item">
            <TavernIcon name="check" size="sm" />
            <span>无需信用卡</span>
          </div>
          <div class="info-item">
            <TavernIcon name="check" size="sm" />
            <span>100免费积分</span>
          </div>
          <div class="info-item">
            <TavernIcon name="check" size="sm" />
            <span>随时取消</span>
          </div>
          <div class="info-item">
            <TavernIcon name="check" size="sm" />
            <span>24/7支持</span>
          </div>
        </div>

        <div class="contact-info">
          <p class="contact-text">
            需要帮助？
            <a href="mailto:support@jiuguanbaba.com" class="contact-link">
              联系我们的支持团队
            </a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TavernButton,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'
import { useHomeStats } from '../composables/useHomeStats'

const router = useRouter()
const { stats, formatNumber } = useHomeStats()

// 响应式状态
const isRegistering = ref(false)
const showTyping = ref(false)

// 演示消息
const demoMessages = ref([
  { type: 'user', content: '你好，我想了解一下这个平台' },
  { type: 'assistant', content: '欢迎来到九馆爸爸！我是你的AI助手。这里有超过3000+精彩角色等你探索，你可以与任何角色进行深度对话~' },
  { type: 'user', content: '听起来很有趣！我该如何开始？' }
])

// 快速功能介绍
const quickFeatures = ref([
  {
    id: 1,
    icon: 'sparkles',
    name: 'AI智能对话',
    description: '基于最新AI技术的自然对话体验',
    color: 'var(--brand-primary-500)'
  },
  {
    id: 2,
    icon: 'palette',
    name: '角色创作',
    description: '强大的角色编辑器，创造专属角色',
    color: 'var(--brand-secondary-500)'
  },
  {
    id: 3,
    icon: 'users',
    name: '社区分享',
    description: '与其他用户分享和交流角色作品',
    color: 'var(--brand-accent-500)'
  },
  {
    id: 4,
    icon: 'shield',
    name: '隐私保护',
    description: '端到端加密，保护您的对话隐私',
    color: 'var(--success)'
  }
])

// 方法
const startRegistration = async () => {
  try {
    isRegistering.value = true

    // 这里可以添加注册前的一些检查或预处理
    await new Promise(resolve => setTimeout(resolve, 500))

    router.push('/register')
  } catch (error) {
    ElMessage.error('跳转失败，请稍后重试')
  } finally {
    isRegistering.value = false
  }
}

const watchDemo = () => {
  // 播放产品演示视频或打开演示页面
  ElMessage.success('演示视频即将推出，敬请期待！')
}

const exploreAPI = () => {
  // 跳转到API文档页面
  window.open('/docs/api', '_blank')
}

const contactSales = () => {
  // 打开销售联系方式
  ElMessage.info('请发送邮件至 sales@jiuguanbaba.com 或拨打 400-123-4567')
}

const joinCommunity = () => {
  router.push('/community')
}

// 生命周期
onMounted(() => {
  // 启动打字效果
  setTimeout(() => {
    showTyping.value = true
  }, demoMessages.value.length * 800 + 1000)
})
</script>

<style lang="scss">
.cta-section {
  padding: var(--section-padding-y) 0;
  background: var(--surface-1);
  position: relative;
  overflow: hidden;

  // 背景装饰
  .cta-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-below);
  }

  .gradient-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(168, 85, 247, 0.1) 0%,
      rgba(59, 130, 246, 0.08) 50%,
      rgba(16, 185, 129, 0.1) 100%
    );
  }

  .pattern-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.05;
    background-image: radial-gradient(circle, var(--text-primary) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  .floating-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    .floating-element {
      position: absolute;
      width: 4px;
      height: 4px;
      background: var(--brand-primary-400);
      border-radius: var(--radius-full);
      opacity: 0.4;
      animation: float-random 6s ease-in-out infinite;

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

  .cta-container {
    width: 100%;
    max-width: var(--container-2xl);
    margin: 0 auto;
    padding: 0 var(--container-padding);
    position: relative;
    z-index: var(--z-content);
  }

  // === 主要CTA区域 ===
  .primary-cta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16);
    align-items: center;
    margin-bottom: var(--space-20);
  }

  .cta-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .cta-badge {
    align-self: flex-start;
  }

  .cta-title {
    font-size: var(--text-5xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    line-height: var(--leading-tight);
    margin: 0;

    .title-gradient {
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

  .cta-subtitle {
    font-size: var(--text-xl);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;

    .highlight-number {
      color: var(--brand-primary-400);
      font-weight: var(--font-semibold);
    }

    .highlight-bonus {
      color: var(--brand-accent-400);
      font-weight: var(--font-semibold);
      background: rgba(16, 185, 129, 0.1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }
  }

  .cta-actions {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-2);

    .cta-primary-btn {
      background: linear-gradient(
        135deg,
        var(--brand-primary-500),
        var(--brand-primary-400)
      );
      border: none;
      box-shadow: var(--shadow-primary);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: left 0.5s;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg), var(--shadow-primary);

        &::before {
          left: 100%;
        }
      }
    }

    .cta-secondary-btn {
      backdrop-filter: blur(var(--space-2));
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
    }
  }

  .trust-indicators {
    display: flex;
    gap: var(--space-8);
    margin-top: var(--space-4);

    .indicator-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-tertiary);

      .tavern-icon {
        color: var(--success);
      }
    }
  }

  // === 预览区域 ===
  .cta-preview {
    position: relative;
    height: 600px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-window {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .chat-preview {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 500px;
    background: var(--surface-2);
    border-radius: var(--radius-2xl);
    border: 1px solid var(--border-secondary);
    box-shadow: var(--shadow-2xl);
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

    .avatar-placeholder {
      width: var(--space-10);
      height: var(--space-10);
      background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500));
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-bold);
      color: white;
    }

    .chat-info {
      flex: 1;

      .chat-title {
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-0-5);
      }

      .chat-status {
        font-size: var(--text-xs);
        color: var(--success);
      }
    }
  }

  .chat-messages {
    padding: var(--space-4);
    height: 350px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .demo-message {
    max-width: 80%;
    opacity: 0;
    animation: messageSlideIn 0.6s ease-out forwards;

    &--user {
      align-self: flex-end;

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
  }

  .chat-input {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background: var(--surface-3);

    .input-field {
      flex: 1;
      padding: var(--space-3);
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      border-radius: var(--radius-base);
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }

    .send-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--space-10);
      height: var(--space-10);
      background: var(--brand-primary-500);
      color: white;
      border-radius: var(--radius-base);
    }
  }

  .feature-cards {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .feature-card {
    position: absolute;
    width: 200px;
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-lg);
    opacity: 0;
    animation: featureSlideIn 0.6s ease-out forwards;

    &:nth-child(1) {
      top: 10%;
      left: -10%;
    }

    &:nth-child(2) {
      top: 30%;
      right: -15%;
    }

    &:nth-child(3) {
      bottom: 30%;
      left: -15%;
    }

    &:nth-child(4) {
      bottom: 10%;
      right: -10%;
    }

    .feature-icon {
      margin-bottom: var(--space-2);
    }

    .feature-name {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .feature-desc {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      line-height: var(--leading-relaxed);
      margin: 0;
    }
  }

  // === 次要CTA区域 ===
  .secondary-cta {
    margin-bottom: var(--space-16);
  }

  .secondary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--space-6);
  }

  .secondary-card {
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    transition: var(--card-transition);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(
        90deg,
        var(--brand-primary-500),
        var(--brand-secondary-500),
        var(--brand-accent-500)
      );
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow-hover);
    }

    &.developer-card::before {
      background: var(--brand-secondary-500);
    }

    &.enterprise-card::before {
      background: var(--brand-accent-500);
    }

    &.community-card::before {
      background: var(--brand-primary-500);
    }
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-4);

    .card-icon {
      color: var(--text-secondary);
    }
  }

  .card-content {
    margin-bottom: var(--space-6);

    .card-title {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-3) 0;
    }

    .card-description {
      font-size: var(--text-base);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
      margin: 0 0 var(--space-4) 0;
    }

    .card-features {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;

      .feature-tag {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
        background: var(--surface-3);
        color: var(--text-tertiary);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-secondary);
      }
    }

    .card-stats {
      display: flex;
      gap: var(--space-6);

      .stat {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);

        .stat-number {
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
  }

  .card-action {
    .tavern-button {
      width: 100%;
    }
  }

  // === 底部信息 ===
  .bottom-info {
    text-align: center;
    padding-top: var(--space-12);
    border-top: 1px solid var(--border-secondary);
  }

  .info-grid {
    display: flex;
    justify-content: center;
    gap: var(--space-8);
    margin-bottom: var(--space-6);

    .info-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);

      .tavern-icon {
        color: var(--success);
      }
    }
  }

  .contact-info {
    .contact-text {
      color: var(--text-tertiary);
      margin: 0;

      .contact-link {
        color: var(--brand-primary-400);
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color var(--duration-fast);

        &:hover {
          border-bottom-color: var(--brand-primary-400);
        }
      }
    }
  }

  // === 响应式设计 ===

  @media (max-width: 1024px) {
    .primary-cta {
      grid-template-columns: 1fr;
      gap: var(--space-12);
      text-align: center;
    }

    .cta-title {
      font-size: var(--text-4xl);
    }

    .chat-preview {
      width: 350px;
      height: 450px;
    }

    .feature-card {
      display: none; // 平板端隐藏浮动卡片
    }
  }

  @media (max-width: 640px) {
    padding: var(--space-16) 0;

    .cta-container {
      padding: 0 var(--space-4);
    }

    .cta-title {
      font-size: var(--text-3xl);
    }

    .cta-subtitle {
      font-size: var(--text-lg);
    }

    .cta-actions {
      flex-direction: column;
      gap: var(--space-3);

      .tavern-button {
        width: 100%;
      }
    }

    .trust-indicators {
      flex-direction: column;
      gap: var(--space-4);
      align-items: center;
    }

    .chat-preview {
      width: 300px;
      height: 400px;
    }

    .secondary-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }

    .secondary-card {
      padding: var(--space-6);
    }

    .info-grid {
      flex-direction: column;
      gap: var(--space-4);
    }
  }
}

// === 动画定义 ===

@keyframes float-random {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.4;
  }
  25% {
    opacity: 1;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    opacity: 0.6;
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(var(--space-4));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes featureSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
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
  .floating-element,
  .demo-message,
  .feature-card,
  .typing-dot {
    animation: none !important;
  }

  .cta-primary-btn:hover,
  .cta-secondary-btn:hover,
  .secondary-card:hover {
    transform: none;
  }

  .cta-primary-btn::before {
    display: none;
  }
}

// === 焦点管理 ===

.cta-primary-btn:focus,
.cta-secondary-btn:focus,
.secondary-card .tavern-button:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>