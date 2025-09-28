<template>
  <div class="image-generation-step">
    <!-- MBTI 性格类型选择 -->
    <div class="step-section">
      <h3 class="section-title">
        <TavernIcon name="brain" />
        性格类型设定 (MBTI)
      </h3>
      <p class="section-description">
        选择角色的MBTI性格类型，这将影响生成图片的视觉风格和氛围
      </p>

      <div class="mbti-selector">
        <el-select
          v-model="localData.mbtiType"
          placeholder="选择MBTI性格类型"
          size="large"
          style="width: 100%"
          @change="onMBTIChange"
        >
          <el-option-group label="分析家 (NT) - 理性思维型">
            <el-option value="INTJ" label="INTJ - 建筑师">
              <div class="mbti-option">
                <span class="mbti-code">INTJ</span>
                <span class="mbti-name">建筑师</span>
                <span class="mbti-desc">战略思想家，独立且有远见</span>
              </div>
            </el-option>
            <el-option value="INTP" label="INTP - 思想家">
              <div class="mbti-option">
                <span class="mbti-code">INTP</span>
                <span class="mbti-name">思想家</span>
                <span class="mbti-desc">创新思考者，好奇且理论化</span>
              </div>
            </el-option>
            <el-option value="ENTJ" label="ENTJ - 指挥官">
              <div class="mbti-option">
                <span class="mbti-code">ENTJ</span>
                <span class="mbti-name">指挥官</span>
                <span class="mbti-desc">天生的领导者，大胆且意志坚强</span>
              </div>
            </el-option>
            <el-option value="ENTP" label="ENTP - 辩论家">
              <div class="mbti-option">
                <span class="mbti-code">ENTP</span>
                <span class="mbti-name">辩论家</span>
                <span class="mbti-desc">聪明好奇的思想家</span>
              </div>
            </el-option>
          </el-option-group>

          <el-option-group label="外交家 (NF) - 理想主义型">
            <el-option value="INFJ" label="INFJ - 提倡者">
              <div class="mbti-option">
                <span class="mbti-code">INFJ</span>
                <span class="mbti-name">提倡者</span>
                <span class="mbti-desc">安静神秘但很有感召力</span>
              </div>
            </el-option>
            <el-option value="INFP" label="INFP - 调停者">
              <div class="mbti-option">
                <span class="mbti-code">INFP</span>
                <span class="mbti-name">调停者</span>
                <span class="mbti-desc">诗意且善良的利他主义者</span>
              </div>
            </el-option>
            <el-option value="ENFJ" label="ENFJ - 主人公">
              <div class="mbti-option">
                <span class="mbti-code">ENFJ</span>
                <span class="mbti-name">主人公</span>
                <span class="mbti-desc">魅力非凡的领导者</span>
              </div>
            </el-option>
            <el-option value="ENFP" label="ENFP - 竞选者">
              <div class="mbti-option">
                <span class="mbti-code">ENFP</span>
                <span class="mbti-name">竞选者</span>
                <span class="mbti-desc">热情创意且善社交</span>
              </div>
            </el-option>
          </el-option-group>

          <el-option-group label="守护者 (SJ) - 传统秩序型">
            <el-option value="ISTJ" label="ISTJ - 物流师">
              <div class="mbti-option">
                <span class="mbti-code">ISTJ</span>
                <span class="mbti-name">物流师</span>
                <span class="mbti-desc">实用且注重事实</span>
              </div>
            </el-option>
            <el-option value="ISFJ" label="ISFJ - 守护者">
              <div class="mbti-option">
                <span class="mbti-code">ISFJ</span>
                <span class="mbti-name">守护者</span>
                <span class="mbti-desc">非常专注且温暖</span>
              </div>
            </el-option>
            <el-option value="ESTJ" label="ESTJ - 总经理">
              <div class="mbti-option">
                <span class="mbti-code">ESTJ</span>
                <span class="mbti-name">总经理</span>
                <span class="mbti-desc">出色的管理者</span>
              </div>
            </el-option>
            <el-option value="ESFJ" label="ESFJ - 执政官">
              <div class="mbti-option">
                <span class="mbti-code">ESFJ</span>
                <span class="mbti-name">执政官</span>
                <span class="mbti-desc">无私热心且受欢迎</span>
              </div>
            </el-option>
          </el-option-group>

          <el-option-group label="探险家 (SP) - 自由灵活型">
            <el-option value="ISTP" label="ISTP - 鉴赏家">
              <div class="mbti-option">
                <span class="mbti-code">ISTP</span>
                <span class="mbti-name">鉴赏家</span>
                <span class="mbti-desc">大胆而实际的实验者</span>
              </div>
            </el-option>
            <el-option value="ISFP" label="ISFP - 探险家">
              <div class="mbti-option">
                <span class="mbti-code">ISFP</span>
                <span class="mbti-name">探险家</span>
                <span class="mbti-desc">灵活有魅力的艺术家</span>
              </div>
            </el-option>
            <el-option value="ESTP" label="ESTP - 企业家">
              <div class="mbti-option">
                <span class="mbti-code">ESTP</span>
                <span class="mbti-name">企业家</span>
                <span class="mbti-desc">聪明精力充沛</span>
              </div>
            </el-option>
            <el-option value="ESFP" label="ESFP - 娱乐家">
              <div class="mbti-option">
                <span class="mbti-code">ESFP</span>
                <span class="mbti-name">娱乐家</span>
                <span class="mbti-desc">自发性强、热情友好</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>

        <!-- MBTI 详细描述 -->
        <div v-if="localData.mbtiType" class="mbti-description">
          <div class="mbti-card">
            <div class="mbti-header">
              <span class="mbti-type">{{ localData.mbtiType }}</span>
              <span class="mbti-title">{{ getMBTIInfo(localData.mbtiType).name }}</span>
            </div>
            <p class="mbti-detail">{{ getMBTIInfo(localData.mbtiType).description }}</p>
            <div class="mbti-traits">
              <span class="trait-label">视觉特征:</span>
              <span class="trait-text">{{ getMBTIInfo(localData.mbtiType).visualStyle }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片生成选项 -->
    <div class="step-section">
      <h3 class="section-title">
        <TavernIcon name="image" />
        AI 图片生成
      </h3>
      <p class="section-description">
        使用AI为角色自动生成专属的头像和对话背景图
      </p>

      <div class="generation-options">
        <div class="option-group">
          <h4 class="option-title">生成内容</h4>
          <el-checkbox-group v-model="generationSettings.types">
            <el-checkbox value="avatar" label="角色头像 (512x512)" />
            <el-checkbox value="background" label="对话背景图 (1920x1080)" />
          </el-checkbox-group>
        </div>

        <div class="option-group">
          <h4 class="option-title">艺术风格</h4>
          <el-radio-group v-model="generationSettings.style">
            <el-radio value="anime">动漫风格</el-radio>
            <el-radio value="realistic">写实风格</el-radio>
            <el-radio value="fantasy">奇幻风格</el-radio>
            <el-radio value="cyberpunk">赛博朋克</el-radio>
          </el-radio-group>
        </div>

        <div class="option-group">
          <h4 class="option-title">图片质量</h4>
          <el-radio-group v-model="generationSettings.quality">
            <el-radio value="standard">标准质量</el-radio>
            <el-radio value="hd">高清质量</el-radio>
          </el-radio-group>
        </div>

        <div class="option-group">
          <h4 class="option-title">创意程度</h4>
          <el-slider
            v-model="generationSettings.creativity"
            :min="0"
            :max="100"
            :step="10"
            show-stops
            show-tooltip
            :format-tooltip="(val) => `${val}%`"
          />
          <div class="slider-labels">
            <span>保守</span>
            <span>创新</span>
          </div>
        </div>
      </div>

      <!-- 生成按钮和预览区域 -->
      <div class="generation-area">
        <div class="generation-controls">
          <TavernButton
            type="primary"
            size="lg"
            :loading="isGenerating"
            :disabled="!canGenerate"
            @click="startGeneration"
          >
            <template #icon-left>
              <TavernIcon name="magic-wand" />
            </template>
            {{ isGenerating ? '生成中...' : '开始AI生成' }}
          </TavernButton>

          <div v-if="isGenerating" class="generation-progress">
            <el-progress
              :percentage="generationProgress"
              :status="generationProgress === 100 ? 'success' : undefined"
            />
            <span class="progress-text">{{ progressText }}</span>
          </div>
        </div>

        <!-- 生成结果预览 -->
        <div v-if="generationResults.avatar || generationResults.background" class="generation-results">
          <h4 class="results-title">生成结果</h4>

          <div class="results-grid">
            <!-- 头像结果 -->
            <div v-if="generationResults.avatar" class="result-item">
              <div class="result-header">
                <span class="result-type">角色头像</span>
                <div class="result-actions">
                  <TavernButton size="sm" @click="applyAvatar">应用</TavernButton>
                  <TavernButton size="sm" variant="ghost" @click="regenerateAvatar">重新生成</TavernButton>
                </div>
              </div>
              <div class="result-preview">
                <img :src="generationResults.avatar.url" alt="生成的头像" class="generated-image" />
              </div>
            </div>

            <!-- 背景图结果 -->
            <div v-if="generationResults.background" class="result-item">
              <div class="result-header">
                <span class="result-type">对话背景</span>
                <div class="result-actions">
                  <TavernButton size="sm" @click="applyBackground">应用</TavernButton>
                  <TavernButton size="sm" variant="ghost" @click="regenerateBackground">重新生成</TavernButton>
                </div>
              </div>
              <div class="result-preview background-preview">
                <img :src="generationResults.background.url" alt="生成的背景图" class="generated-background" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 手动上传选项 -->
    <div class="step-section">
      <h3 class="section-title">
        <TavernIcon name="upload" />
        手动上传图片
      </h3>
      <p class="section-description">
        如果不使用AI生成，您也可以手动上传角色图片
      </p>

      <div class="upload-area">
        <div class="upload-item">
          <h4>角色头像</h4>
          <div class="upload-zone" @click="uploadAvatar">
            <div v-if="localData.avatar" class="uploaded-preview">
              <img :src="localData.avatar" alt="角色头像" />
              <div class="upload-overlay">
                <TavernIcon name="edit" />
                <span>更换图片</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <TavernIcon name="image-plus" size="xl" />
              <span>点击上传头像</span>
              <small>建议尺寸: 512x512</small>
            </div>
          </div>
        </div>

        <div class="upload-item">
          <h4>对话背景</h4>
          <div class="upload-zone" @click="uploadBackground">
            <div v-if="localData.backgroundImage" class="uploaded-preview background-upload">
              <img :src="localData.backgroundImage" alt="对话背景" />
              <div class="upload-overlay">
                <TavernIcon name="edit" />
                <span>更换图片</span>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <TavernIcon name="landscape" size="xl" />
              <span>点击上传背景图</span>
              <small>建议尺寸: 1920x1080</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="avatarInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleAvatarUpload"
    />
    <input
      ref="backgroundInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleBackgroundUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import { http } from '@/utils/axios'

// Props & Emits
interface Props {
  modelValue: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate', isValid: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地数据
const localData = ref({
  mbtiType: '',
  avatar: '',
  backgroundImage: '',
  ...props.modelValue
})

// 生成设置
const generationSettings = reactive({
  types: ['avatar'] as Array<'avatar' | 'background'>,
  style: 'anime',
  quality: 'standard' as 'standard' | 'hd',
  creativity: 70
})

// 生成状态
const isGenerating = ref(false)
const generationProgress = ref(0)
const progressText = ref('')

// 生成结果
const generationResults = reactive({
  avatar: null as any,
  background: null as any
})

// 文件输入引用
const avatarInput = ref<HTMLInputElement>()
const backgroundInput = ref<HTMLInputElement>()

// MBTI 信息数据
const mbtiInfo = {
  'INTJ': {
    name: '建筑师',
    description: '战略思想家，独立且有远见，善于将想法转化为现实',
    visualStyle: '严肃表情、知识分子外观、深色服装、战略性姿态'
  },
  'INTP': {
    name: '思想家',
    description: '创新思考者，好奇且理论化，热爱探索新的可能性',
    visualStyle: '好奇表情、休闲风格、沉思姿态、创意背景'
  },
  'ENTJ': {
    name: '指挥官',
    description: '天生的领导者，大胆且意志坚强，善于组织和指导他人',
    visualStyle: '自信表情、正式服装、领导姿态、专业外观'
  },
  'ENTP': {
    name: '辩论家',
    description: '聪明好奇的思想家，不断寻求新的可能性和挑战',
    visualStyle: '活力表情、时尚服装、动态姿态、创新氛围'
  },
  'INFJ': {
    name: '提倡者',
    description: '安静神秘但很有感召力的完美主义者，追求意义和真理',
    visualStyle: '温和表情、优雅风格、宁静姿态、神秘氛围'
  },
  'INFP': {
    name: '调停者',
    description: '诗意且善良的利他主义者，始终寻求和谐与个人价值',
    visualStyle: '梦幻表情、艺术服装、和平姿态、创意氛围'
  },
  'ENFJ': {
    name: '主人公',
    description: '魅力非凡的领导者，能够激励他人追求共同目标',
    visualStyle: '温暖表情、亲和风格、欢迎姿态、鼓舞光环'
  },
  'ENFP': {
    name: '竞选者',
    description: '热情创意且善社交的自由精神，充满感染力的乐观主义者',
    visualStyle: '热情表情、彩色服装、表达姿态、活力四射'
  },
  'ISTJ': {
    name: '物流师',
    description: '实用且注重事实的可靠人员，尊重传统和稳定',
    visualStyle: '可靠表情、传统服装、稳定姿态、有序背景'
  },
  'ISFJ': {
    name: '守护者',
    description: '非常专注且温暖的守护者，始终准备保护所爱之人',
    visualStyle: '关怀表情、温和风格、照料姿态、舒适氛围'
  },
  'ESTJ': {
    name: '总经理',
    description: '出色的管理者，在管理事务或人员方面表现突出',
    visualStyle: '坚定表情、商务服装、权威姿态、结构化环境'
  },
  'ESFJ': {
    name: '执政官',
    description: '无私热心且受欢迎的人员，总是渴望帮助他人',
    visualStyle: '友好表情、社交风格、欢迎姿态、和谐环境'
  },
  'ISTP': {
    name: '鉴赏家',
    description: '大胆而实际的实验者，善于使用各种工具',
    visualStyle: '专注表情、实用服装、熟练姿态、工坊环境'
  },
  'ISFP': {
    name: '探险家',
    description: '灵活有魅力的艺术家，时刻准备探索新的可能性',
    visualStyle: '敏感表情、艺术风格、优雅姿态、自然背景'
  },
  'ESTP': {
    name: '企业家',
    description: '聪明精力充沛且善社交的享乐主义者，喜欢与人相处',
    visualStyle: '自信表情、时尚服装、行动姿态、动态环境'
  },
  'ESFP': {
    name: '娱乐家',
    description: '自发性强、热情且友好的娱乐家，喜欢成为关注的中心',
    visualStyle: '快乐表情、时髦风格、俏皮姿态、节庆氛围'
  }
}

// 计算属性
const canGenerate = computed(() => {
  return localData.value.name &&
         localData.value.mbtiType &&
         generationSettings.types.length > 0
})

// 方法
const getMBTIInfo = (type: string) => {
  return mbtiInfo[type as keyof typeof mbtiInfo] || {
    name: '',
    description: '',
    visualStyle: ''
  }
}

const onMBTIChange = (mbtiType: string) => {
  // MBTI 变化时可以做一些预设调整
  if (mbtiType) {
    emit('validate', true)
  }
}

const startGeneration = async () => {
  if (!canGenerate.value) return

  isGenerating.value = true
  generationProgress.value = 0
  progressText.value = '准备生成...'

  try {
    const promises = []

    // 生成头像
    if (generationSettings.types.includes('avatar')) {
      progressText.value = '正在生成头像...'
      generationProgress.value = 25

      promises.push(
        http.post('/api/multimodal/image/generate', {
          prompt: buildAvatarPrompt(),
          characterId: localData.value.id,
          model: 'nano-banana',
          size: '512x512',
          style: generationSettings.style,
          quality: generationSettings.quality,
          mbtiType: localData.value.mbtiType
        })
      )
    }

    // 生成背景图
    if (generationSettings.types.includes('background')) {
      progressText.value = '正在生成背景图...'
      generationProgress.value = generationSettings.types.includes('avatar') ? 50 : 25

      promises.push(
        http.post('/api/multimodal/image/generate', {
          prompt: buildBackgroundPrompt(),
          characterId: localData.value.id,
          model: 'nano-banana',
          size: '1920x1080',
          style: generationSettings.style,
          quality: generationSettings.quality,
          mbtiType: localData.value.mbtiType
        })
      )
    }

    // 等待生成完成
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const type = generationSettings.types[index]
        generationResults[type] = result.value.data
      }
    })

    generationProgress.value = 100
    progressText.value = '生成完成！'
    ElMessage.success('AI 图片生成完成')

  } catch (error) {
    console.error('Generation failed:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    isGenerating.value = false
  }
}

const buildAvatarPrompt = () => {
  const mbtiStyle = getMBTIInfo(localData.value.mbtiType).visualStyle
  return `portrait of ${localData.value.name}, ${localData.value.shortDescription}, ${mbtiStyle}, ${generationSettings.style} style, high quality, detailed face`
}

const buildBackgroundPrompt = () => {
  const mbtiInfo = getMBTIInfo(localData.value.mbtiType)
  return `conversation background for ${localData.value.name}, ${localData.value.shortDescription}, ${mbtiInfo.visualStyle}, atmospheric mood, no characters, environmental art`
}

const applyAvatar = () => {
  if (generationResults.avatar) {
    localData.value.avatar = generationResults.avatar.url
    ElMessage.success('头像已应用')
  }
}

const applyBackground = () => {
  if (generationResults.background) {
    localData.value.backgroundImage = generationResults.background.url
    ElMessage.success('背景图已应用')
  }
}

const regenerateAvatar = () => {
  generationSettings.types = ['avatar']
  startGeneration()
}

const regenerateBackground = () => {
  generationSettings.types = ['background']
  startGeneration()
}

const uploadAvatar = () => {
  avatarInput.value?.click()
}

const uploadBackground = () => {
  backgroundInput.value?.click()
}

const handleAvatarUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // 这里应该实现文件上传逻辑
    const reader = new FileReader()
    reader.onload = (e) => {
      localData.value.avatar = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleBackgroundUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // 这里应该实现文件上传逻辑
    const reader = new FileReader()
    reader.onload = (e) => {
      localData.value.backgroundImage = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 监听数据变化
watch(
  localData,
  (newValue) => {
    emit('update:modelValue', newValue)
    // 基本验证
    const isValid = !!(newValue.mbtiType)
    emit('validate', isValid)
  },
  { deep: true, immediate: true }
)

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localData.value, newValue)
  },
  { deep: true }
)
</script>

<style scoped>
.image-generation-step {
  max-width: 800px;
  margin: 0 auto;
}

.step-section {
  margin-bottom: 40px;
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: #fafbfc;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.section-description {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 20px;
}

.mbti-description {
  margin-top: 16px;
}

.mbti-card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.mbti-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mbti-type {
  background: #409eff;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 14px;
}

.mbti-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.mbti-detail {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.mbti-traits {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.trait-label {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
}

.trait-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.mbti-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mbti-code {
  font-weight: 600;
  color: #409eff;
}

.mbti-name {
  font-weight: 500;
  color: #303133;
}

.mbti-desc {
  font-size: 12px;
  color: #909399;
}

.generation-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.option-group {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.generation-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.generation-controls {
  text-align: center;
  margin-bottom: 24px;
}

.generation-progress {
  margin-top: 16px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.generation-results {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.results-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.result-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.result-type {
  font-weight: 500;
  color: #303133;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-preview {
  padding: 12px;
  text-align: center;
}

.generated-image {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 6px;
}

.background-preview .generated-image {
  max-width: 100%;
  height: 120px;
  object-fit: cover;
}

.upload-area {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.upload-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.upload-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.upload-zone:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.upload-placeholder small {
  font-size: 12px;
  color: #c0c4cc;
}

.uploaded-preview {
  position: relative;
}

.uploaded-preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.background-upload img {
  height: 80px;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.uploaded-preview:hover .upload-overlay {
  opacity: 1;
}
</style>
