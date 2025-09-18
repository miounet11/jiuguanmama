<template>
  <div class="text-to-speech-container">
    <!-- 头部信息 -->
    <div class="tts-header">
      <div class="header-info">
        <el-icon class="header-icon"><Microphone /></el-icon>
        <div class="header-text">
          <h3>文字转语音</h3>
          <p>将文本转换为自然流畅的语音</p>
        </div>
      </div>

      <div class="header-actions" v-if="!compact">
        <el-button
          size="small"
          @click="loadPresets"
          :icon="Refresh"
          :loading="isLoadingPresets"
        >
          刷新预设
        </el-button>
      </div>
    </div>

    <!-- 文本输入区域 -->
    <div class="text-input-section">
      <div class="input-header">
        <label>输入文本</label>
        <div class="input-stats">
          <span class="char-count" :class="{ 'warning': textLength > maxLength * 0.8, 'error': textLength > maxLength }">
            {{ textLength }} / {{ maxLength }}
          </span>
          <span class="word-count">{{ wordCount }} 词</span>
        </div>
      </div>

      <el-input
        v-model="inputText"
        type="textarea"
        :rows="textareaRows"
        :placeholder="placeholder"
        :disabled="isProcessing"
        :maxlength="maxLength"
        show-word-limit
        class="text-input"
        @input="handleTextInput"
      />

      <!-- 快速插入 -->
      <div class="quick-insert" v-if="showQuickInsert">
        <span class="quick-label">快速插入:</span>
        <el-button
          v-for="template in textTemplates"
          :key="template.name"
          size="small"
          text
          @click="insertTemplate(template.text)"
        >
          {{ template.name }}
        </el-button>
      </div>
    </div>

    <!-- 语音配置 -->
    <div class="voice-config-section">
      <div class="config-header">
        <h4>语音配置</h4>
        <el-button
          v-if="!compact"
          size="small"
          text
          @click="showAdvanced = !showAdvanced"
          :icon="showAdvanced ? 'ArrowUp' : 'ArrowDown'"
        >
          {{ showAdvanced ? '收起' : '展开' }}
        </el-button>
      </div>

      <!-- 基础配置 -->
      <div class="basic-config">
        <div class="config-row">
          <div class="config-item">
            <label>语音角色</label>
            <el-select
              v-model="selectedVoiceId"
              placeholder="选择语音"
              :disabled="isProcessing"
              class="voice-select"
              @change="handleVoiceChange"
            >
              <el-option-group
                v-for="group in groupedVoices"
                :key="group.provider"
                :label="group.label"
              >
                <el-option
                  v-for="voice in group.voices"
                  :key="voice.id"
                  :label="voice.name"
                  :value="voice.id"
                >
                  <div class="voice-option">
                    <span class="voice-name">{{ voice.name }}</span>
                    <span class="voice-lang">{{ voice.language }}</span>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <div class="config-item">
            <label>语言</label>
            <el-select
              v-model="selectedLanguage"
              placeholder="选择语言"
              :disabled="isProcessing"
              class="language-select"
              @change="filterVoicesByLanguage"
            >
              <el-option
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :label="lang.name"
                :value="lang.code"
              />
            </el-select>
          </div>
        </div>

        <!-- 快速调节 -->
        <div class="quick-controls">
          <div class="control-group">
            <label>语速 ({{ voiceSettings.speed }}x)</label>
            <el-slider
              v-model="voiceSettings.speed"
              :min="0.25"
              :max="4"
              :step="0.25"
              :disabled="isProcessing"
              show-stops
              class="control-slider"
            />
          </div>

          <div class="control-group">
            <label>音调 ({{ voiceSettings.pitch }})</label>
            <el-slider
              v-model="voiceSettings.pitch"
              :min="0.5"
              :max="2"
              :step="0.1"
              :disabled="isProcessing"
              show-stops
              class="control-slider"
            />
          </div>

          <div class="control-group">
            <label>音量 ({{ Math.round(voiceSettings.volume * 100) }}%)</label>
            <el-slider
              v-model="voiceSettings.volume"
              :min="0"
              :max="1"
              :step="0.1"
              :disabled="isProcessing"
              show-stops
              class="control-slider"
            />
          </div>
        </div>
      </div>

      <!-- 高级配置 -->
      <div class="advanced-config" v-if="showAdvanced">
        <div class="config-section">
          <h5>情感和风格</h5>
          <div class="emotion-controls">
            <div class="config-item">
              <label>情感</label>
              <el-select
                v-model="voiceOptions.emotion"
                placeholder="选择情感"
                :disabled="isProcessing"
                clearable
              >
                <el-option label="自然" value="neutral" />
                <el-option label="快乐" value="happy" />
                <el-option label="悲伤" value="sad" />
                <el-option label="愤怒" value="angry" />
                <el-option label="兴奋" value="excited" />
                <el-option label="平静" value="calm" />
              </el-select>
            </div>

            <div class="config-item">
              <label>说话风格</label>
              <el-select
                v-model="voiceOptions.style"
                placeholder="选择风格"
                :disabled="isProcessing"
                clearable
              >
                <el-option label="对话" value="conversational" />
                <el-option label="新闻播报" value="newscast" />
                <el-option label="客服" value="customerservice" />
                <el-option label="助手" value="assistant" />
                <el-option label="叙述" value="narration" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="config-section">
          <h5>高级选项</h5>
          <div class="advanced-options">
            <el-checkbox v-model="voiceOptions.ssml" :disabled="isProcessing">
              启用 SSML 标记
            </el-checkbox>
            <el-checkbox v-model="enablePreview" :disabled="isProcessing">
              生成前预览
            </el-checkbox>
            <el-checkbox v-model="autoPlay" :disabled="isProcessing">
              完成后自动播放
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <div class="primary-actions">
        <el-button
          type="primary"
          size="large"
          @click="generateSpeech"
          :loading="isProcessing"
          :disabled="!canGenerate"
          :icon="isProcessing ? 'Loading' : 'Microphone'"
        >
          {{ isProcessing ? '生成中...' : '生成语音' }}
        </el-button>

        <el-button
          v-if="enablePreview && inputText.trim()"
          size="large"
          @click="previewText"
          :disabled="isProcessing"
          :icon="VideoPlay"
        >
          预览
        </el-button>
      </div>

      <div class="secondary-actions" v-if="!compact">
        <el-button
          size="small"
          @click="clearText"
          :disabled="isProcessing"
          :icon="Delete"
        >
          清空
        </el-button>

        <el-button
          size="small"
          @click="saveAsPreset"
          :disabled="!canSavePreset"
          :icon="Star"
        >
          保存预设
        </el-button>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="generation-result" v-if="generatedAudio">
      <div class="result-header">
        <h4>生成结果</h4>
        <div class="result-meta">
          <span class="generation-time">生成时间: {{ formatTime(generatedAudio.timestamp) }}</span>
          <span class="duration">时长: {{ formatDuration(generatedAudio.duration) }}</span>
        </div>
      </div>

      <!-- 音频播放器 -->
      <VoicePlayer
        :audio-data="generatedAudio"
        :auto-play="autoPlay"
        :compact="compact"
        :show-waveform="false"
        @play="handlePlay"
        @pause="handlePause"
        @download="handleDownload"
      />

      <!-- 结果操作 -->
      <div class="result-actions">
        <el-button
          size="small"
          @click="regenerateWithSettings"
          :disabled="isProcessing"
          :icon="Refresh"
        >
          重新生成
        </el-button>

        <el-button
          size="small"
          @click="copyAudioUrl"
          :icon="DocumentCopy"
        >
          复制链接
        </el-button>

        <el-button
          size="small"
          @click="saveToHistory"
          :icon="FolderAdd"
        >
          保存到历史
        </el-button>
      </div>
    </div>

    <!-- 批量生成 -->
    <div class="batch-generation" v-if="showBatchGeneration && !compact">
      <el-collapse>
        <el-collapse-item title="批量生成" name="batch">
          <div class="batch-content">
            <div class="batch-input">
              <label>批量文本（每行一个）</label>
              <el-input
                v-model="batchText"
                type="textarea"
                :rows="5"
                placeholder="在此输入多行文本，每行将单独生成语音"
                :disabled="isProcessing"
              />
            </div>

            <div class="batch-settings">
              <el-checkbox v-model="batchOptions.useSequentialNaming">
                按顺序命名文件
              </el-checkbox>
              <el-checkbox v-model="batchOptions.combineAudio">
                合并为单个音频文件
              </el-checkbox>
            </div>

            <div class="batch-actions">
              <el-button
                type="primary"
                @click="generateBatchSpeech"
                :loading="isBatchProcessing"
                :disabled="!canGenerateBatch"
                :icon="PlayList"
              >
                {{ isBatchProcessing ? '批量生成中...' : '开始批量生成' }}
              </el-button>
            </div>

            <!-- 批量进度 -->
            <div class="batch-progress" v-if="isBatchProcessing">
              <el-progress
                :percentage="batchProgress"
                :status="batchStatus"
                :show-text="true"
              />
              <p class="progress-text">
                正在处理第 {{ currentBatchIndex + 1 }} / {{ batchTotal }} 项
              </p>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 错误提示 -->
    <div class="error-message" v-if="error">
      <el-alert
        :title="error"
        type="error"
        :closable="true"
        @close="clearError"
      />
    </div>

    <!-- 成本估算 -->
    <div class="cost-estimation" v-if="showCostEstimation && !compact">
      <div class="cost-info">
        <el-icon><Coin /></el-icon>
        <span>预估成本: ¥{{ estimatedCost.toFixed(3) }}</span>
        <span class="cost-note">（根据文本长度和语音提供商计算）</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  ElInput, ElSelect, ElOption, ElOptionGroup, ElButton, ElSlider,
  ElCheckbox, ElCollapse, ElCollapseItem, ElAlert, ElProgress
} from 'element-plus'
import {
  Microphone, VideoPlay, Refresh, Delete, Star, DocumentCopy,
  FolderAdd, ArrowUp, ArrowDown, PlayList, Coin, Loading
} from '@element-plus/icons-vue'
import VoicePlayer from './VoicePlayer.vue'
import { useVoice, type VoiceProfile, type TTSRequest, type AudioRecording, SUPPORTED_LANGUAGES } from '@/composables/useVoice'
import { ElMessage } from 'element-plus'

// Props
interface Props {
  text?: string // 初始文本
  compact?: boolean // 紧凑模式
  showQuickInsert?: boolean // 显示快速插入
  showBatchGeneration?: boolean // 显示批量生成
  showCostEstimation?: boolean // 显示成本估算
  maxLength?: number // 最大文本长度
  placeholder?: string
  autoPlay?: boolean // 生成后自动播放
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  compact: false,
  showQuickInsert: true,
  showBatchGeneration: true,
  showCostEstimation: true,
  maxLength: 5000,
  placeholder: '在此输入要转换为语音的文本...',
  autoPlay: false
})

// Emits
interface Emits {
  (e: 'generation-complete', audio: AudioRecording): void
  (e: 'generation-start'): void
  (e: 'generation-error', error: string): void
  (e: 'play', audio: AudioRecording): void
  (e: 'pause'): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()

// 解构所需的状态和方法
const {
  voiceProfiles,
  currentVoiceProfile,
  isProcessing,
  error,
  clearError,
  synthesizeText,
  loadVoiceProfiles
} = voice

// 组件状态
const inputText = ref(props.text)
const selectedVoiceId = ref('')
const selectedLanguage = ref('zh-CN')
const showAdvanced = ref(false)
const enablePreview = ref(false)
const autoPlay = ref(props.autoPlay)
const isLoadingPresets = ref(false)
const generatedAudio = ref<AudioRecording | null>(null)

// 语音设置
const voiceSettings = reactive({
  speed: 1.0,
  pitch: 1.0,
  volume: 0.8
})

// 语音选项
const voiceOptions = reactive({
  emotion: '',
  style: '',
  ssml: false
})

// 批量生成
const batchText = ref('')
const isBatchProcessing = ref(false)
const batchProgress = ref(0)
const batchStatus = ref<'success' | 'exception' | 'warning' | ''>('')
const currentBatchIndex = ref(0)
const batchTotal = ref(0)

const batchOptions = reactive({
  useSequentialNaming: true,
  combineAudio: false
})

// 文本模板
const textTemplates = ref([
  { name: '问候', text: '你好，很高兴认识你！' },
  { name: '感谢', text: '谢谢你的帮助，这对我很有用。' },
  { name: '道歉', text: '很抱歉给你带来不便。' },
  { name: '告别', text: '再见，期待下次见面！' }
])

// 计算属性
const textLength = computed(() => inputText.value.length)
const wordCount = computed(() => inputText.value.trim().split(/\s+/).filter(word => word.length > 0).length)
const textareaRows = computed(() => Math.min(Math.max(3, Math.ceil(textLength.value / 100)), 8))

const supportedLanguages = computed(() => SUPPORTED_LANGUAGES)

const groupedVoices = computed(() => {
  const groups: { [key: string]: { provider: string; label: string; voices: VoiceProfile[] } } = {}

  voiceProfiles.value.forEach(voice => {
    if (!groups[voice.provider]) {
      groups[voice.provider] = {
        provider: voice.provider,
        label: getProviderLabel(voice.provider),
        voices: []
      }
    }
    groups[voice.provider].voices.push(voice)
  })

  return Object.values(groups)
})

const canGenerate = computed(() => {
  return inputText.value.trim().length > 0 &&
         selectedVoiceId.value &&
         !isProcessing.value &&
         textLength.value <= props.maxLength
})

const canSavePreset = computed(() => {
  return selectedVoiceId.value &&
         (voiceSettings.speed !== 1 || voiceSettings.pitch !== 1 || voiceSettings.volume !== 0.8)
})

const canGenerateBatch = computed(() => {
  const lines = batchText.value.trim().split('\n').filter(line => line.trim())
  return lines.length > 1 && selectedVoiceId.value && !isBatchProcessing.value
})

const estimatedCost = computed(() => {
  const textLen = textLength.value
  const baseRate = 0.001 // 基础费率：每字符0.001元
  const providerMultiplier = getProviderCostMultiplier(getSelectedVoice()?.provider || 'openai')
  return textLen * baseRate * providerMultiplier
})

// 方法
const handleTextInput = () => {
  // 文本变化时的处理
}

const insertTemplate = (template: string) => {
  if (inputText.value) {
    inputText.value += '\n' + template
  } else {
    inputText.value = template
  }
}

const handleVoiceChange = (voiceId: string) => {
  const voice = voiceProfiles.value.find(v => v.id === voiceId)
  if (voice) {
    selectedLanguage.value = voice.language
    // 应用语音默认设置
    voiceSettings.speed = voice.speed || 1.0
    voiceSettings.pitch = voice.pitch || 1.0
    voiceSettings.volume = voice.volume || 0.8
  }
}

const filterVoicesByLanguage = () => {
  // 根据语言过滤语音，如果当前选择的语音不支持新语言，则清空选择
  const compatibleVoices = voiceProfiles.value.filter(v => v.language === selectedLanguage.value)
  if (selectedVoiceId.value && !compatibleVoices.find(v => v.id === selectedVoiceId.value)) {
    selectedVoiceId.value = compatibleVoices.length > 0 ? compatibleVoices[0].id : ''
  }
}

const getSelectedVoice = (): VoiceProfile | null => {
  return voiceProfiles.value.find(v => v.id === selectedVoiceId.value) || null
}

const generateSpeech = async () => {
  if (!canGenerate.value) return

  const voice = getSelectedVoice()
  if (!voice) {
    ElMessage.error('请选择语音配置')
    return
  }

  try {
    emit('generation-start')

    // 构建TTS请求
    const request: TTSRequest = {
      text: inputText.value,
      voiceProfile: {
        ...voice,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume
      },
      options: {
        ssml: voiceOptions.ssml,
        emotion: voiceOptions.emotion || undefined,
        style: voiceOptions.style || undefined
      }
    }

    const audio = await synthesizeText(request)
    if (audio) {
      generatedAudio.value = audio
      emit('generation-complete', audio)
      ElMessage.success('语音生成成功')
    }
  } catch (err) {
    console.error('语音生成失败:', err)
    const errorMessage = '语音生成失败，请重试'
    emit('generation-error', errorMessage)
    ElMessage.error(errorMessage)
  }
}

const previewText = async () => {
  // 预览功能：生成前几个字的语音
  const previewText = inputText.value.slice(0, 50) + (inputText.value.length > 50 ? '...' : '')
  const originalText = inputText.value
  inputText.value = previewText

  await generateSpeech()

  inputText.value = originalText
}

const regenerateWithSettings = async () => {
  await generateSpeech()
}

const clearText = () => {
  inputText.value = ''
  generatedAudio.value = null
}

const saveAsPreset = () => {
  ElMessage.info('保存预设功能待实现')
}

const copyAudioUrl = async () => {
  if (generatedAudio.value) {
    try {
      await navigator.clipboard.writeText(generatedAudio.value.url)
      ElMessage.success('音频链接已复制')
    } catch {
      ElMessage.error('复制失败')
    }
  }
}

const saveToHistory = () => {
  ElMessage.info('保存到历史功能待实现')
}

// 批量生成
const generateBatchSpeech = async () => {
  const lines = batchText.value.trim().split('\n').filter(line => line.trim())
  if (lines.length === 0) return

  isBatchProcessing.value = true
  batchProgress.value = 0
  batchStatus.value = ''
  currentBatchIndex.value = 0
  batchTotal.value = lines.length

  try {
    const results: AudioRecording[] = []

    for (let i = 0; i < lines.length; i++) {
      currentBatchIndex.value = i

      const voice = getSelectedVoice()
      if (!voice) continue

      const request: TTSRequest = {
        text: lines[i],
        voiceProfile: {
          ...voice,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume
        },
        options: {
          ssml: voiceOptions.ssml,
          emotion: voiceOptions.emotion || undefined,
          style: voiceOptions.style || undefined
        }
      }

      const audio = await synthesizeText(request)
      if (audio) {
        results.push(audio)
      }

      batchProgress.value = Math.round(((i + 1) / lines.length) * 100)
    }

    batchStatus.value = 'success'
    ElMessage.success(`批量生成完成，共生成 ${results.length} 个音频文件`)

    // TODO: 处理批量结果，可能需要打包下载或合并音频

  } catch (err) {
    console.error('批量生成失败:', err)
    batchStatus.value = 'exception'
    ElMessage.error('批量生成失败')
  } finally {
    isBatchProcessing.value = false
  }
}

// 事件处理
const handlePlay = (audio: AudioRecording) => {
  emit('play', audio)
}

const handlePause = () => {
  emit('pause')
}

const handleDownload = (audio: AudioRecording) => {
  // 下载处理
}

const loadPresets = async () => {
  isLoadingPresets.value = true
  try {
    await loadVoiceProfiles()
    ElMessage.success('预设已刷新')
  } catch (err) {
    ElMessage.error('刷新预设失败')
  } finally {
    isLoadingPresets.value = false
  }
}

// 工具函数
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getProviderLabel = (provider: string): string => {
  const labels: { [key: string]: string } = {
    'openai': 'OpenAI',
    'elevenlabs': 'ElevenLabs',
    'azure': 'Azure',
    'google': 'Google Cloud'
  }
  return labels[provider] || provider
}

const getProviderCostMultiplier = (provider: string): number => {
  const multipliers: { [key: string]: number } = {
    'openai': 1.0,
    'elevenlabs': 2.5,
    'azure': 1.2,
    'google': 0.8
  }
  return multipliers[provider] || 1.0
}

// 监听器
watch(() => props.text, (newText) => {
  inputText.value = newText
})

watch(voiceProfiles, (profiles) => {
  if (profiles.length > 0 && !selectedVoiceId.value) {
    // 自动选择第一个匹配当前语言的语音
    const defaultVoice = profiles.find(v => v.language === selectedLanguage.value) || profiles[0]
    selectedVoiceId.value = defaultVoice.id
    handleVoiceChange(defaultVoice.id)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (voiceProfiles.value.length === 0) {
    loadVoiceProfiles()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.text-to-speech-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 20px;

  .tts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }

      .header-text {
        h3 {
          margin: 0 0 4px 0;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .text-input-section {
    margin-bottom: 24px;

    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      label {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .input-stats {
        display: flex;
        gap: 12px;
        font-size: 12px;

        .char-count {
          color: var(--el-text-color-secondary);

          &.warning {
            color: var(--el-color-warning);
          }

          &.error {
            color: var(--el-color-danger);
          }
        }

        .word-count {
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .text-input {
      margin-bottom: 12px;
    }

    .quick-insert {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .quick-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .voice-config-section {
    margin-bottom: 24px;

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    .basic-config {
      .config-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 16px;
        margin-bottom: 16px;

        .config-item {
          label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }
        }
      }

      .quick-controls {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .control-group {
          label {
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .control-slider {
            --el-slider-runway-bg-color: var(--el-fill-color-light);
          }
        }
      }
    }

    .advanced-config {
      border-top: 1px solid var(--el-border-color-light);
      padding-top: 16px;
      margin-top: 16px;

      .config-section {
        margin-bottom: 16px;

        h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .emotion-controls {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;

          .config-item {
            label {
              display: block;
              margin-bottom: 6px;
              font-size: 13px;
              color: var(--el-text-color-secondary);
            }
          }
        }

        .advanced-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .primary-actions {
      display: flex;
      gap: 12px;
    }

    .secondary-actions {
      display: flex;
      gap: 8px;
    }
  }

  .generation-result {
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        color: var(--el-text-color-primary);
      }

      .result-meta {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .result-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: flex-end;
    }
  }

  .batch-generation {
    margin-bottom: 16px;

    .batch-content {
      .batch-input {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }

      .batch-settings {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .batch-actions {
        margin-bottom: 16px;
      }

      .batch-progress {
        .progress-text {
          margin-top: 8px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          text-align: center;
        }
      }
    }
  }

  .error-message {
    margin-bottom: 16px;
  }

  .cost-estimation {
    border-top: 1px solid var(--el-border-color-light);
    padding-top: 16px;

    .cost-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);

      .cost-note {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
}

// 语音选项样式
:deep(.voice-option) {
  display: flex;
  justify-content: space-between;
  width: 100%;

  .voice-name {
    color: var(--el-text-color-primary);
  }

  .voice-lang {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .text-to-speech-container {
    padding: 16px;

    .basic-config .config-row {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .quick-controls {
      grid-template-columns: 1fr !important;
      gap: 12px;
    }

    .action-buttons {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .primary-actions,
      .secondary-actions {
        justify-content: center;
      }
    }

    .advanced-config .emotion-controls {
      grid-template-columns: 1fr;
    }
  }
}

// 暗色主题适配
.dark {
  .text-to-speech-container {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color-darker);

    .generation-result {
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
    }
  }
}
</style>
