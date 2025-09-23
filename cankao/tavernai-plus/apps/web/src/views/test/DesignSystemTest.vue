<template>
  <div class="design-system-test">
    <div class="test-container">
      <h1 class="test-title">TavernAI Plus Design System Test</h1>
      <p class="test-subtitle">Design Tokens v2.0 + 核心组件库测试</p>

      <!-- 设计系统版本信息 -->
      <div class="version-info">
        <TavernBadge variant="info" size="sm">
          Design System v{{ DESIGN_SYSTEM_VERSION }}
        </TavernBadge>
        <TavernBadge variant="info" size="sm">
          Tokens v{{ DESIGN_TOKENS_VERSION }}
        </TavernBadge>
      </div>

      <!-- 颜色系统测试 -->
      <section class="test-section">
        <h2>颜色系统 (Color System)</h2>
        <div class="color-grid">
          <div class="color-item">
            <div class="color-swatch" style="background: var(--tavern-primary)"></div>
            <span>Primary</span>
          </div>
          <div class="color-item">
            <div class="color-swatch" style="background: var(--tavern-secondary)"></div>
            <span>Secondary</span>
          </div>
          <div class="color-item">
            <div class="color-swatch" style="background: var(--success)"></div>
            <span>Success</span>
          </div>
          <div class="color-item">
            <div class="color-swatch" style="background: var(--warning)"></div>
            <span>Warning</span>
          </div>
          <div class="color-item">
            <div class="color-swatch" style="background: var(--error)"></div>
            <span>Error</span>
          </div>
        </div>
      </section>

      <!-- 按钮组件测试 -->
      <section class="test-section">
        <h2>按钮组件 (Button)</h2>
        <div class="component-grid">
          <div class="component-group">
            <h3>变体 (Variants)</h3>
            <div class="button-row">
              <TavernButton variant="primary">Primary</TavernButton>
              <TavernButton variant="secondary">Secondary</TavernButton>
              <TavernButton variant="tertiary">Tertiary</TavernButton>
              <TavernButton variant="ghost">Ghost</TavernButton>
              <TavernButton variant="danger">Danger</TavernButton>
            </div>
          </div>

          <div class="component-group">
            <h3>尺寸 (Sizes)</h3>
            <div class="button-row">
              <TavernButton size="xs">XS</TavernButton>
              <TavernButton size="sm">SM</TavernButton>
              <TavernButton size="md">MD</TavernButton>
              <TavernButton size="lg">LG</TavernButton>
              <TavernButton size="xl">XL</TavernButton>
            </div>
          </div>

          <div class="component-group">
            <h3>状态 (States)</h3>
            <div class="button-row">
              <TavernButton icon-left="plus">With Icon</TavernButton>
              <TavernButton :loading="true">Loading</TavernButton>
              <TavernButton disabled>Disabled</TavernButton>
              <TavernButton full-width>Full Width</TavernButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 输入组件测试 -->
      <section class="test-section">
        <h2>输入组件 (Input)</h2>
        <div class="input-grid">
          <TavernInput
            v-model="testInput1"
            label="基础输入"
            placeholder="请输入内容"
          />
          <TavernInput
            v-model="testInput2"
            label="带图标输入"
            placeholder="搜索..."
            icon-left="search"
            clearable
          />
          <TavernInput
            v-model="testInput3"
            label="密码输入"
            type="password"
            placeholder="请输入密码"
          />
          <TavernInput
            v-model="testInput4"
            label="错误状态"
            placeholder="错误示例"
            error-message="这是一个错误信息"
          />
          <TavernInput
            v-model="testInput5"
            type="textarea"
            label="文本域"
            placeholder="请输入多行文本..."
            :maxlength="200"
            show-char-count
            auto-resize
          />
        </div>
      </section>

      <!-- 卡片组件测试 -->
      <section class="test-section">
        <h2>卡片组件 (Card)</h2>
        <div class="card-grid">
          <TavernCard title="基础卡片" subtitle="副标题" hoverable>
            <p>这是卡片的基础内容。卡片组件支持标题、副标题、内容和操作区域。</p>
            <template #footer>
              <div class="flex justify-between">
                <TavernBadge variant="success">状态</TavernBadge>
                <span class="text-sm text-gray-500">2分钟前</span>
              </div>
            </template>
          </TavernCard>

          <TavernCard variant="outlined" clickable>
            <template #media>
              <div class="h-32 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                <TavernIcon name="photo" size="xl" class="text-white" />
              </div>
            </template>
            <h3 class="font-medium mb-2">带媒体的卡片</h3>
            <p class="text-sm text-gray-600">这个卡片包含媒体区域，可以用来展示图片或其他内容。</p>
          </TavernCard>

          <TavernCard variant="elevated" :loading="cardLoading" @click="toggleCardLoading">
            <h3 class="font-medium mb-2">加载状态卡片</h3>
            <p class="text-sm text-gray-600 mb-4">点击切换加载状态。</p>
            <TavernButton variant="primary" size="sm">点击测试</TavernButton>
          </TavernCard>
        </div>
      </section>

      <!-- 徽章组件测试 -->
      <section class="test-section">
        <h2>徽章组件 (Badge)</h2>
        <div class="component-grid">
          <div class="component-group">
            <h3>变体 (Variants)</h3>
            <div class="badge-row">
              <TavernBadge variant="primary">Primary</TavernBadge>
              <TavernBadge variant="secondary">Secondary</TavernBadge>
              <TavernBadge variant="success">Success</TavernBadge>
              <TavernBadge variant="warning">Warning</TavernBadge>
              <TavernBadge variant="error">Error</TavernBadge>
              <TavernBadge variant="info">Info</TavernBadge>
              <TavernBadge variant="neutral">Neutral</TavernBadge>
            </div>
          </div>

          <div class="component-group">
            <h3>样式 (Styles)</h3>
            <div class="badge-row">
              <TavernBadge variant="primary">默认</TavernBadge>
              <TavernBadge variant="primary" outlined>描边</TavernBadge>
              <TavernBadge variant="primary" soft>柔和</TavernBadge>
              <TavernBadge variant="primary" :count="5" />
              <TavernBadge variant="error" :count="99" :max-count="99" />
              <TavernBadge variant="success" dot />
            </div>
          </div>

          <div class="component-group">
            <h3>图标徽章</h3>
            <div class="badge-row">
              <TavernBadge variant="info" icon="info">信息</TavernBadge>
              <TavernBadge variant="success" icon="check">完成</TavernBadge>
              <TavernBadge variant="warning" icon="warning">警告</TavernBadge>
              <TavernBadge variant="error" icon="close" closable @close="console.log('Badge closed')">可关闭</TavernBadge>
            </div>
          </div>
        </div>
      </section>

      <!-- 角色卡片测试 -->
      <section class="test-section">
        <h2>角色卡片 (CharacterCard)</h2>
        <div class="character-grid">
          <CharacterCard2
            v-for="character in mockCharacters"
            :key="character.id"
            :character="character"
            @click="onCharacterClick"
            @favorite="onCharacterFavorite"
            @quick-chat-started="onQuickChatStarted"
          />
        </div>
      </section>

      <!-- 图标组件测试 -->
      <section class="test-section">
        <h2>图标组件 (Icon)</h2>
        <div class="icon-grid">
          <div v-for="iconName in iconList" :key="iconName" class="icon-item">
            <TavernIcon :name="iconName" size="lg" />
            <span>{{ iconName }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  TavernButton,
  TavernInput,
  TavernCard,
  TavernBadge,
  TavernIcon,
  DESIGN_SYSTEM_VERSION,
  DESIGN_TOKENS_VERSION
} from '@/components/design-system'
import CharacterCard2 from '@/components/character/CharacterCard2.vue'

// 响应式数据
const testInput1 = ref('')
const testInput2 = ref('')
const testInput3 = ref('')
const testInput4 = ref('')
const testInput5 = ref('')
const cardLoading = ref(false)

// 模拟角色数据
const mockCharacters = ref([
  {
    id: '1',
    name: '星野艾莉娅',
    description: '来自未来的虚拟偶像，拥有治愈人心的歌声和温暖的笑容。热爱音乐，梦想用自己的声音传递希望与快乐。',
    avatar: 'https://picsum.photos/400/400?random=1',
    creator: { id: 'user1', username: '创作者A' },
    tags: ['虚拟偶像', '音乐', '治愈系', '未来'],
    isNew: true,
    isPremium: false,
    isNSFW: false,
    isFavorited: false,
    rating: 4.8,
    chatCount: 1250,
    favoriteCount: 890
  },
  {
    id: '2',
    name: '影刃忍者·雾',
    description: '隐藏在暗影中的神秘忍者，掌握着古老的忍术。外表冷酷，内心却有着不为人知的温柔。',
    avatar: 'https://picsum.photos/400/400?random=2',
    creator: { id: 'user2', username: '忍者大师' },
    tags: ['忍者', '冷酷', '神秘', '战斗'],
    isNew: false,
    isPremium: true,
    isNSFW: false,
    isFavorited: true,
    rating: 4.6,
    chatCount: 2100,
    favoriteCount: 1420
  },
  {
    id: '3',
    name: '咖啡店老板娘',
    description: '经营着街角温馨咖啡店的亲切女孩，手艺精湛，总是面带微笑迎接每一位客人。',
    avatar: 'https://picsum.photos/400/400?random=3',
    creator: { id: 'user3', username: '咖啡爱好者' },
    tags: ['温馨', '治愈', '咖啡', '日常'],
    isNew: false,
    isPremium: false,
    isNSFW: false,
    isFavorited: false,
    rating: 4.9,
    chatCount: 3400,
    favoriteCount: 2100
  }
])

// 图标列表
const iconList = [
  'home', 'users', 'chat', 'settings', 'document', 'plus',
  'play', 'pause', 'stop', 'arrow-right', 'arrow-left',
  'check', 'close', 'warning', 'info', 'heart', 'star',
  'eye', 'edit', 'delete', 'share', 'download',
  'search', 'bell', 'user', 'photo', 'sparkles'
]

// 方法
const toggleCardLoading = () => {
  cardLoading.value = !cardLoading.value
  setTimeout(() => {
    cardLoading.value = false
  }, 2000)
}

const onCharacterClick = (character: any) => {
  console.log('Character clicked:', character)
}

const onCharacterFavorite = (characterId: string) => {
  const character = mockCharacters.value.find(c => c.id === characterId)
  if (character) {
    character.isFavorited = !character.isFavorited
    character.favoriteCount += character.isFavorited ? 1 : -1
  }
}

const onQuickChatStarted = (characterId: string, sessionId: string) => {
  console.log('Quick chat started:', { characterId, sessionId })
}
</script>

<style lang="scss" scoped>
.design-system-test {
  min-height: 100vh;
  background: var(--surface-1);
  color: var(--text-primary);
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8);
}

.test-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  text-align: center;
}

.test-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--space-6);
}

.version-info {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.test-section {
  margin-bottom: var(--space-12);

  h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: var(--space-px-2) solid var(--border-secondary);
  }

  h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-4);
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);

  .color-swatch {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-lg);
    border: var(--space-px) solid var(--border-secondary);
  }

  span {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }
}

.component-grid {
  display: grid;
  gap: var(--space-6);
}

.component-group {
  .button-row,
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
  }
}

.input-grid {
  display: grid;
  gap: var(--space-4);
  max-width: 600px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-4);
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  border: var(--space-px) solid var(--border-secondary);

  span {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    text-align: center;
  }
}

// 响应式
@media (max-width: 768px) {
  .test-container {
    padding: var(--space-4);
  }

  .component-group {
    .button-row,
    .badge-row {
      justify-content: center;
    }
  }

  .card-grid,
  .character-grid {
    grid-template-columns: 1fr;
  }
}
</style>