<template>
  <div class="image-demo-page">
    <div class="demo-header">
      <h1>TavernAI Plus 图像功能演示</h1>
      <p>展示完整的AI图像生成、理解和编辑功能</p>
    </div>

    <div class="demo-content">
      <!-- 功能导航 -->
      <div class="feature-nav">
        <el-button
          v-for="feature in features"
          :key="feature.key"
          :type="activeFeature === feature.key ? 'primary' : ''"
          @click="activeFeature = feature.key"
        >
          <el-icon><component :is="feature.icon" /></el-icon>
          {{ feature.label }}
        </el-button>
      </div>

      <!-- 功能展示区域 -->
      <div class="feature-display">
        <!-- 图像生成器 -->
        <div v-if="activeFeature === 'generator'" class="feature-section">
          <h2>AI图像生成器</h2>
          <p>使用先进的AI模型生成高质量图像</p>
          <ImageGenerator
            v-model="showGenerator"
            @image-generated="handleImageGenerated"
          />
          <el-button type="primary" @click="showGenerator = true">
            打开图像生成器
          </el-button>
        </div>

        <!-- 图像分析器 -->
        <div v-if="activeFeature === 'analyzer'" class="feature-section">
          <h2>AI图像理解</h2>
          <p>上传图像进行智能分析和理解</p>
          <ImageAnalyzer
            v-model="showAnalyzer"
            @analysis-completed="handleAnalysisCompleted"
          />
          <el-button type="primary" @click="showAnalyzer = true">
            打开图像分析器
          </el-button>
        </div>

        <!-- 图像编辑器 -->
        <div v-if="activeFeature === 'editor'" class="feature-section">
          <h2>AI图像编辑器</h2>
          <p>强大的图像编辑和AI增强功能</p>
          <ImageEditor
            v-model="showEditor"
            @image-edited="handleImageEdited"
          />
          <el-button type="primary" @click="showEditor = true">
            打开图像编辑器
          </el-button>
        </div>

        <!-- 图像画廊 -->
        <div v-if="activeFeature === 'gallery'" class="feature-section">
          <h2>图像画廊</h2>
          <p>管理和浏览你的图像收藏</p>
          <ImageGallery
            v-model="showGallery"
            @image-selected="handleImageSelected"
          />
          <el-button type="primary" @click="showGallery = true">
            打开图像画廊
          </el-button>
        </div>

        <!-- 角色头像生成 -->
        <div v-if="activeFeature === 'avatar'" class="feature-section">
          <h2>角色头像生成</h2>
          <p>为角色生成专属的AI头像</p>
          <CharacterAvatarGenerator
            v-model="showAvatarGenerator"
            :character-id="selectedCharacterId"
            @avatar-applied="handleAvatarApplied"
          />
          <div class="character-selection">
            <el-select v-model="selectedCharacterId" placeholder="选择角色">
              <el-option
                v-for="character in demoCharacters"
                :key="character.id"
                :label="character.name"
                :value="character.id"
              />
            </el-select>
            <el-button
              type="primary"
              @click="showAvatarGenerator = true"
              :disabled="!selectedCharacterId"
            >
              生成角色头像
            </el-button>
          </div>
        </div>

        <!-- 提示词助手 -->
        <div v-if="activeFeature === 'prompt'" class="feature-section">
          <h2>AI提示词助手</h2>
          <p>智能构建和优化图像生成提示词</p>
          <PromptHelper
            v-model="showPromptHelper"
            :current-prompt="currentPrompt"
            @prompt-updated="handlePromptUpdated"
          />
          <div class="prompt-demo">
            <el-input
              v-model="currentPrompt"
              type="textarea"
              :rows="3"
              placeholder="在这里输入或编辑提示词..."
            />
            <el-button type="primary" @click="showPromptHelper = true">
              打开提示词助手
            </el-button>
          </div>
        </div>

        <!-- 聊天集成 -->
        <div v-if="activeFeature === 'chat'" class="feature-section">
          <h2>聊天图像集成</h2>
          <p>在聊天中快速生成和分享图像</p>
          <div class="chat-demo">
            <ChatImageFeatures
              :current-character="demoCharacters[0]"
              :messages="demoMessages"
              @image-generated="handleChatImageGenerated"
              @image-message="handleChatImageMessage"
            />
          </div>
        </div>
      </div>

      <!-- 生成结果展示 -->
      <div v-if="generatedImages.length > 0" class="results-section">
        <h3>生成结果</h3>
        <div class="results-grid">
          <div
            v-for="image in generatedImages"
            :key="image.id"
            class="result-item"
          >
            <img :src="image.url" :alt="image.prompt" />
            <div class="result-info">
              <h4>{{ image.type }}</h4>
              <p>{{ image.prompt || image.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, View, Edit, Collection, Avatar, MagicStick, ChatDotRound
} from '@element-plus/icons-vue'

import ImageGenerator from '@/components/image/ImageGenerator.vue'
import ImageAnalyzer from '@/components/image/ImageAnalyzer.vue'
import ImageEditor from '@/components/image/ImageEditor.vue'
import ImageGallery from '@/components/image/ImageGallery.vue'
import CharacterAvatarGenerator from '@/components/image/CharacterAvatarGenerator.vue'
import PromptHelper from '@/components/image/PromptHelper.vue'
import ChatImageFeatures from '@/components/image/ChatImageFeatures.vue'

// 功能列表
const features = [
  { key: 'generator', label: '图像生成', icon: 'Picture' },
  { key: 'analyzer', label: '图像理解', icon: 'View' },
  { key: 'editor', label: '图像编辑', icon: 'Edit' },
  { key: 'gallery', label: '图像画廊', icon: 'Collection' },
  { key: 'avatar', label: '角色头像', icon: 'Avatar' },
  { key: 'prompt', label: '提示词助手', icon: 'MagicStick' },
  { key: 'chat', label: '聊天集成', icon: 'ChatDotRound' }
]

// 响应式数据
const activeFeature = ref('generator')
const showGenerator = ref(false)
const showAnalyzer = ref(false)
const showEditor = ref(false)
const showGallery = ref(false)
const showAvatarGenerator = ref(false)
const showPromptHelper = ref(false)

const selectedCharacterId = ref('')
const currentPrompt = ref('一位美丽的精灵公主，站在魔法森林中，阳光透过树叶洒下')
const generatedImages = ref<any[]>([])

// 演示数据
const demoCharacters = [
  {
    id: '1',
    name: '艾莉娅',
    description: '一位勇敢的精灵弓箭手，拥有金色长发和绿色眼睛',
    creator: '演示用户'
  },
  {
    id: '2',
    name: '卡尔',
    description: '强壮的矮人战士，拥有红色胡须和钢铁般的意志',
    creator: '演示用户'
  },
  {
    id: '3',
    name: '露娜',
    description: '神秘的法师，掌握着月亮的魔法力量',
    creator: '演示用户'
  }
]

const demoMessages = [
  {
    id: '1',
    role: 'user',
    content: '你好！很高兴见到你',
    timestamp: new Date()
  },
  {
    id: '2',
    role: 'assistant',
    content: '你好！我也很高兴见到你。我们在这个美丽的花园里相遇真是太棒了！',
    timestamp: new Date()
  }
]

// 事件处理方法
const handleImageGenerated = (image: any) => {
  generatedImages.value.unshift({
    ...image,
    type: '图像生成',
    id: Date.now().toString()
  })
  ElMessage.success('图像生成完成')
}

const handleAnalysisCompleted = (result: any) => {
  generatedImages.value.unshift({
    url: result.imageUrl,
    description: result.description,
    type: '图像分析',
    id: Date.now().toString()
  })
  ElMessage.success('图像分析完成')
}

const handleImageEdited = (image: any) => {
  generatedImages.value.unshift({
    ...image,
    type: '图像编辑',
    id: Date.now().toString()
  })
  ElMessage.success('图像编辑完成')
}

const handleImageSelected = (image: any) => {
  ElMessage.success(`选择了图像: ${image.name}`)
}

const handleAvatarApplied = (character: any, avatar: any) => {
  generatedImages.value.unshift({
    ...avatar,
    type: '角色头像',
    prompt: `${character.name}的头像`,
    id: Date.now().toString()
  })
  ElMessage.success(`为${character.name}生成头像完成`)
}

const handlePromptUpdated = (prompt: string, negativePrompt?: string) => {
  currentPrompt.value = prompt
  ElMessage.success('提示词已更新')
}

const handleChatImageGenerated = (image: any) => {
  generatedImages.value.unshift({
    ...image,
    type: '聊天生成',
    id: Date.now().toString()
  })
  ElMessage.success('聊天图像生成完成')
}

const handleChatImageMessage = (message: any) => {
  demoMessages.push(message)
  ElMessage.success('图像消息已添加到聊天')
}
</script>

<style scoped>
.image-demo-page {
  min-height: 100vh;
  background: var(--el-bg-color-page);
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  margin: 0 0 12px 0;
  color: var(--el-color-primary);
  font-size: 32px;
  font-weight: 600;
}

.demo-header p {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

.feature-nav {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.feature-nav .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
}

.feature-display {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.feature-section h2 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
}

.feature-section p {
  margin: 0 0 24px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.character-selection {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.character-selection .el-select {
  width: 200px;
}

.prompt-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.chat-demo {
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

.results-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.results-section h3 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.result-item {
  background: var(--el-bg-color-page);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.2s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.result-info {
  padding: 16px;
}

.result-info h4 {
  margin: 0 0 8px 0;
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.result-info p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-demo-page {
    padding: 12px;
  }

  .demo-header {
    padding: 20px;
  }

  .demo-header h1 {
    font-size: 24px;
  }

  .feature-display {
    padding: 20px;
  }

  .feature-section h2 {
    font-size: 20px;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }

  .character-selection {
    flex-direction: column;
    align-items: stretch;
  }

  .character-selection .el-select {
    width: 100%;
  }
}
</style>
