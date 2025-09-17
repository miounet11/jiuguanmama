<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">TavernAI Plus</span>
        </h1>
        <p class="hero-subtitle">
          与AI角色自由对话，创造无限可能
        </p>
        <div class="hero-actions">
          <router-link to="/characters" class="btn btn-primary btn-lg">
            <i class="fas fa-compass"></i>
            探索角色
          </router-link>
          <router-link to="/chat" class="btn btn-secondary btn-lg">
            <i class="fas fa-comments"></i>
            开始聊天
          </router-link>
        </div>
      </div>
      <div class="hero-image">
        <div class="floating-cards">
          <div class="character-card" v-for="i in 3" :key="i" :style="`animation-delay: ${i * 0.2}s`">
            <div class="card-avatar"></div>
            <div class="card-info">
              <div class="card-name"></div>
              <div class="card-desc"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 特性展示 -->
    <section class="features-section">
      <h2 class="section-title">为什么选择 TavernAI Plus？</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-brain"></i>
          </div>
          <h3>智能对话</h3>
          <p>支持多种AI模型，提供流畅自然的对话体验</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-users"></i>
          </div>
          <h3>丰富角色</h3>
          <p>海量角色库，从动漫到历史，满足各种兴趣</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-palette"></i>
          </div>
          <h3>自由创作</h3>
          <p>创建专属角色，定制性格、背景和对话风格</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3>隐私安全</h3>
          <p>端到端加密，保护您的对话隐私</p>
        </div>
      </div>
    </section>

    <!-- 热门角色 -->
    <section class="popular-section" v-if="popularCharacters.length">
      <h2 class="section-title">热门角色</h2>
      <div class="characters-carousel">
        <div class="character-item" v-for="char in popularCharacters" :key="char.id">
          <img :src="char.avatar || '/default-avatar.png'" :alt="char.name" class="character-avatar">
          <h4>{{ char.name }}</h4>
          <p>{{ char.description }}</p>
          <router-link :to="`/chat/${char.id}`" class="btn btn-sm">
            开始对话
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA区域 -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>准备开始您的AI冒险了吗？</h2>
        <p>立即注册，获得100免费积分</p>
        <router-link to="/register" class="btn btn-primary btn-lg">
          免费注册
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/utils/axios';

const router = useRouter();
const popularCharacters = ref([]);

onMounted(async () => {
  // 获取热门角色
  try {
    const response = await http.get('/characters/popular');
    if (response && response.characters) {
      popularCharacters.value = response.characters;
    }
  } catch (error) {
    console.error('Failed to fetch popular characters:', error);
    // 静默失败，不影响用户体验
    popularCharacters.value = [];
  }
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
}

.hero-section {
  display: flex;
  align-items: center;
  min-height: 80vh;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .hero-content {
    flex: 1;
    max-width: 600px;

    .hero-title {
      font-size: 4rem;
      font-weight: bold;
      margin-bottom: 1rem;

      .gradient-text {
        background: linear-gradient(90deg, #fff, #f0f0f0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .hero-subtitle {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;

      .btn {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border-radius: 8px;
        text-decoration: none;
        transition: transform 0.3s;

        &:hover {
          transform: translateY(-2px);
        }

        &.btn-primary {
          background: white;
          color: #667eea;
        }

        &.btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
      }
    }
  }

  .hero-image {
    flex: 1;
    display: flex;
    justify-content: center;

    .floating-cards {
      position: relative;
      width: 400px;
      height: 400px;

      .character-card {
        position: absolute;
        width: 200px;
        height: 250px;
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: float 3s ease-in-out infinite;

        &:nth-child(1) { top: 0; left: 50px; }
        &:nth-child(2) { top: 50px; right: 50px; }
        &:nth-child(3) { bottom: 0; left: 100px; }

        .card-avatar {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          margin-bottom: 1rem;
        }

        .card-name {
          height: 20px;
          background: #e0e0e0;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .card-desc {
          height: 40px;
          background: #f0f0f0;
          border-radius: 4px;
        }
      }
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.features-section {
  padding: 4rem 2rem;
  background: #f8f9fa;

  .section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-5px);
      }

      .feature-icon {
        font-size: 3rem;
        color: #667eea;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: #333;
      }

      p {
        color: #666;
        line-height: 1.6;
      }
    }
  }
}

.popular-section {
  padding: 4rem 2rem;

  .section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
  }

  .characters-carousel {
    display: flex;
    gap: 2rem;
    overflow-x: auto;
    padding: 1rem 0;

    .character-item {
      min-width: 200px;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);

      .character-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin-bottom: 1rem;
        object-fit: cover;
      }

      h4 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
        color: #333;
      }

      p {
        color: #666;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        background: #667eea;
        color: white;
        border-radius: 6px;
        text-decoration: none;
        display: inline-block;

        &:hover {
          background: #5a67d8;
        }
      }
    }
  }
}

.cta-section {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;

  .cta-content {
    max-width: 600px;
    margin: 0 auto;

    h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .btn {
      padding: 1rem 3rem;
      font-size: 1.2rem;
      background: white;
      color: #667eea;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      font-weight: bold;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;

    .hero-title {
      font-size: 2.5rem;
    }

    .hero-image {
      display: none;
    }
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
