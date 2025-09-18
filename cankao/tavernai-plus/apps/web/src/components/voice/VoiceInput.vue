<template>
  <div class="voice-input-container">
    <!-- 录音主界面 -->
    <div class="voice-input-main">
      <!-- 录音按钮 -->
      <div class="recording-controls">
        <el-button
          v-if="!isRecordingActive"
          type="primary"
          size="large"
          circle
          :disabled="!canRecord || !isSupported"
          @click="startRecording"
          class="record-button start-record"
        >
          <el-icon size="24"><Microphone /></el-icon>
        </el-button>

        <el-button
          v-else
          type="danger"
          size="large"
          circle
          @click="stopRecording"
          class="record-button stop-record"
        >
          <el-icon size="24"><VideoPlay /></el-icon>
        </el-button>
      </div>

      <!-- 录音状态指示 -->
      <div class="recording-status" v-if="isRecordingActive || isProcessing">
        <div class="status-content">
          <div v-if="isRecordingActive" class="recording-indicator">
            <div class="pulse-dot"></div>
            <span class="status-text">正在录音</span>
            <span class="duration">{{ recordingDurationText }}</span>
          </div>

          <div v-else-if="isProcessing" class="processing-indicator">
            <el-icon class="spinning"><Loading /></el-icon>
            <span class="status-text">正在处理</span>
          </div>
        </div>
      </div>

      <!-- 音频波形显示 -->
      <div class="audio-visualizer" v-if="showVisualizer && (isRecordingActive || isPlaying)">
        <canvas
          ref="visualizerCanvas"
          :width="visualizerWidth"
          :height="visualizerHeight"
          class="visualizer-canvas"
        ></canvas>
      </div>

      <!-- 录音提示和设置 -->
      <div class="recording-info" v-if="!isRecordingActive && !currentAudio">
        <div class="info-content">
          <el-icon class="info-icon"><InfoFilled /></el-icon>
          <p class="info-text">点击录音按钮开始语音输入</p>
          <div class="info-details">
            <span>• 支持最长 {{ maxDuration }} 分钟录音</span>
            <span>• 自动降噪和回声消除</span>
            <span>• 支持多种语言识别</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 录音结果 -->
    <div class="recording-result" v-if="currentAudio">
      <div class="audio-preview">
        <div class="audio-info">
          <div class="audio-meta">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDuration(currentAudio.duration) }}</span>
            <el-icon><Calendar /></el-icon>
            <span>{{ formatTime(currentAudio.timestamp) }}</span>
          </div>

          <!-- 音频控制 -->
          <div class="audio-controls">
            <el-button
              size="small"
              :type="isPlaying ? 'warning' : 'primary'"
              @click="togglePlay"
              :icon="isPlaying ? 'VideoPause' : 'VideoPlay'"
            >
              {{ isPlaying ? '暂停' : '播放' }}
            </el-button>

            <el-button
              size="small"
              @click="deleteRecording"
              type="danger"
              :icon="Delete"
            >
              删除
            </el-button>
          </div>
        </div>

        <!-- 播放进度条 -->
        <div class="progress-bar" v-if="playbackDuration > 0">
          <el-slider
            v-model="playbackProgress"
            :max="playbackDuration"
            :show-tooltip="false"
            @change="seekAudio"
            class="audio-progress"
          />
          <div class="progress-time">
            <span>{{ formatDuration(playbackProgress) }}</span>
            <span>{{ formatDuration(playbackDuration) }}</span>
          </div>
        </div>
      </div>

      <!-- 转录操作 -->
      <div class="transcription-section">
        <div class="transcription-header">
          <h4>语音转文字</h4>
          <el-button
            size="small"
            type="primary"
            :loading="isProcessing"
            @click="performTranscription"
            :icon="Connection"
          >
            {{ isProcessing ? '转换中...' : '转换为文字' }}
          </el-button>
        </div>

        <!-- 转录结果 -->
        <div class="transcription-result" v-if="transcriptionResult">
          <div class="result-header">
            <span class="confidence-badge" :class="getConfidenceLevel(transcriptionResult.confidence)">
              置信度: {{ Math.round(transcriptionResult.confidence * 100) }}%
            </span>
            <span class="language-badge">
              {{ getLanguageName(transcriptionResult.language) }}
            </span>
          </div>

          <div class="result-text">
            <el-input
              v-model="editableText"
              type="textarea"
              :rows="3"
              placeholder="转录结果将显示在这里..."
              class="transcription-textarea"
            />

            <div class="text-actions">
              <el-button
                size="small"
                @click="copyText"
                :icon="DocumentCopy"
              >
                复制
              </el-button>

              <el-button
                size="small"
                @click="insertText"
                type="primary"
                :icon="Check"
              >
                使用此文本
              </el-button>

              <el-button
                size="small"
                @click="clearTranscription"
                :icon="Delete"
              >
                清除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div class="error-message" v-if="hasError">
      <el-alert
        :title="error"
        type="error"
        :closable="true"
        @close="clearError"
        class="error-alert"
      />
    </div>

    <!-- 浏览器不支持提示 -->
    <div class="unsupported-warning" v-if="!isSupported">
      <el-alert
        title="浏览器不支持"
        description="您的浏览器不支持语音录制功能，请使用现代浏览器如 Chrome、Firefox 或 Safari。"
        type="warning"
        :closable="false"
      />
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options" v-if="showAdvanced">
      <el-collapse>
        <el-collapse-item title="高级设置" name="advanced">
          <div class="option-group">
            <label>音频质量</label>
            <el-select v-model="audioQuality" size="small">
              <el-option label="标准 (16kHz)" value="standard" />
              <el-option label="高质量 (44kHz)" value="high" />
              <el-option label="超高质量 (96kHz)" value="ultra" />
            </el-select>
          </div>

          <div class="option-group">
            <label>降噪级别</label>
            <el-slider
              v-model="noiseReduction"
              :min="0"
              :max="100"
              :step="10"
              show-stops
              size="small"
            />
          </div>

          <div class="option-group">
            <el-checkbox v-model="autoGainControl">自动增益控制</el-checkbox>
            <el-checkbox v-model="echoCancellation">回声消除</el-checkbox>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ElButton, ElAlert, ElSlider, ElInput, ElSelect, ElOption,
  ElCheckbox, ElCollapse, ElCollapseItem, ElMessage
} from 'element-plus'
import {
  Microphone, VideoPlay, VideoPause, Loading, InfoFilled, Clock,
  Calendar, Delete, Connection, DocumentCopy, Check
} from '@element-plus/icons-vue'
import { useVoice, type STTResult, SUPPORTED_LANGUAGES } from '@/composables/useVoice'

// Props
interface Props {
  maxDuration?: number // 最大录音时长（分钟）
  showVisualizer?: boolean // 是否显示音频波形
  showAdvanced?: boolean // 是否显示高级选项
  autoTranscribe?: boolean // 录音完成后自动转录
  visualizerWidth?: number
  visualizerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDuration: 5,
  showVisualizer: true,
  showAdvanced: false,
  autoTranscribe: false,
  visualizerWidth: 300,
  visualizerHeight: 100
})

// Emits
interface Emits {
  (e: 'text-ready', text: string): void
  (e: 'recording-start'): void
  (e: 'recording-stop', audio: any): void
  (e: 'transcription-complete', result: STTResult): void
  (e: 'error', error: string): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()

// 解构所需的状态和方法
const {
  state,
  isSupported,
  error,
  hasError,
  canRecord,
  isRecordingActive,
  recordingDuration,
  recordingDurationText,
  currentAudio,
  isPlaying,
  playbackProgress,
  playbackDuration,
  isProcessing,
  startRecording: startVoiceRecording,
  stopRecording: stopVoiceRecording,
  playAudio,
  pauseAudio,
  seekAudio,
  transcribeAudio,
  clearError,
  getAudioLevel
} = voice

// 组件状态
const visualizerCanvas = ref<HTMLCanvasElement | null>(null)
const transcriptionResult = ref<STTResult | null>(null)
const editableText = ref('')
const animationFrame = ref<number | null>(null)

// 高级选项
const audioQuality = ref('standard')
const noiseReduction = ref(50)
const autoGainControl = ref(true)
const echoCancellation = ref(true)

// 录音控制
const startRecording = async () => {
  const success = await startVoiceRecording()
  if (success) {
    emit('recording-start')
    startVisualizer()
  }
}

const stopRecording = () => {
  stopVoiceRecording()
  stopVisualizer()
  emit('recording-stop', currentAudio.value)

  // 自动转录
  if (props.autoTranscribe && currentAudio.value) {
    nextTick(() => {
      performTranscription()
    })
  }
}

// 播放控制
const togglePlay = () => {
  if (isPlaying.value) {
    pauseAudio()
  } else if (currentAudio.value) {
    playAudio(currentAudio.value)
  }
}

const deleteRecording = () => {
  if (currentAudio.value?.url) {
    URL.revokeObjectURL(currentAudio.value.url)
  }
  currentAudio.value = null
  transcriptionResult.value = null
  editableText.value = ''
}

// 转录功能
const performTranscription = async () => {
  if (!currentAudio.value) return

  try {
    const result = await transcribeAudio(currentAudio.value)
    if (result) {
      transcriptionResult.value = result
      editableText.value = result.text
      emit('transcription-complete', result)
    }
  } catch (err) {
    console.error('转录失败:', err)
    emit('error', '语音转录失败')
  }
}

const copyText = async () => {
  if (!editableText.value.trim()) return

  try {
    await navigator.clipboard.writeText(editableText.value)
    ElMessage.success('文本已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const insertText = () => {
  if (editableText.value.trim()) {
    emit('text-ready', editableText.value)
    ElMessage.success('文本已插入')
  }
}

const clearTranscription = () => {
  transcriptionResult.value = null
  editableText.value = ''
}

// 音频可视化
const startVisualizer = () => {
  if (!props.showVisualizer || !visualizerCanvas.value) return

  const canvas = visualizerCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const animate = () => {
    if (!isRecordingActive.value && !isPlaying.value) {
      stopVisualizer()
      return
    }

    const audioLevel = getAudioLevel()
    drawVisualization(ctx, canvas, audioLevel)

    animationFrame.value = requestAnimationFrame(animate)
  }

  animate()
}

const stopVisualizer = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = null
  }

  // 清空画布
  if (visualizerCanvas.value) {
    const ctx = visualizerCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, visualizerCanvas.value.width, visualizerCanvas.value.height)
    }
  }
}

const drawVisualization = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioLevel: number) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制音频波形
  const barCount = 32
  const barWidth = canvas.width / barCount
  const maxHeight = canvas.height * 0.8

  ctx.fillStyle = '#409eff'

  for (let i = 0; i < barCount; i++) {
    const height = Math.random() * audioLevel * maxHeight
    const x = i * barWidth
    const y = canvas.height - height

    ctx.fillRect(x, y, barWidth - 2, height)
  }

  // 绘制音量指示器
  ctx.fillStyle = '#67c23a'
  const volumeWidth = audioLevel * canvas.width
  ctx.fillRect(0, canvas.height - 5, volumeWidth, 5)
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

const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.7) return 'medium'
  return 'low'
}

const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
  return lang?.name || code
}

// 监听状态变化
watch(isRecordingActive, (recording) => {
  if (recording) {
    startVisualizer()
  } else {
    stopVisualizer()
  }
})

watch(isPlaying, (playing) => {
  if (playing) {
    startVisualizer()
  } else {
    stopVisualizer()
  }
})

watch(hasError, (hasErr) => {
  if (hasErr && error.value) {
    emit('error', error.value)
  }
})

// 生命周期
onMounted(() => {
  // 检查麦克风权限
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
      if (result.state === 'denied') {
        ElMessage.warning('需要麦克风权限才能使用语音输入功能')
      }
    })
  }
})

onUnmounted(() => {
  stopVisualizer()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.voice-input-container {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);

  .voice-input-main {
    text-align: center;
    margin-bottom: 24px;

    .recording-controls {
      margin-bottom: 20px;

      .record-button {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        transition: all 0.3s ease;

        &.start-record {
          &:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
          }
        }

        &.stop-record {
          background: linear-gradient(45deg, #f56c6c, #e6a23c);
          animation: pulse 1.5s infinite;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }

    .recording-status {
      margin: 20px 0;

      .status-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px 20px;
        background: var(--el-fill-color-light);
        border-radius: 8px;

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 8px;

          .pulse-dot {
            width: 12px;
            height: 12px;
            background: #f56c6c;
            border-radius: 50%;
            animation: pulse 1s infinite;
          }

          .status-text {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .duration {
            font-family: monospace;
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }

        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;

          .spinning {
            animation: spin 1s linear infinite;
          }
        }
      }
    }

    .audio-visualizer {
      margin: 20px auto;

      .visualizer-canvas {
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        background: var(--el-fill-color-darker);
      }
    }

    .recording-info {
      margin-top: 24px;

      .info-content {
        padding: 20px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;

        .info-icon {
          font-size: 24px;
          color: var(--el-color-primary);
          margin-bottom: 8px;
        }

        .info-text {
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 12px;
        }

        .info-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .recording-result {
    border-top: 1px solid var(--el-border-color);
    padding-top: 20px;

    .audio-preview {
      background: var(--el-fill-color-light);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;

      .audio-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .audio-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }

        .audio-controls {
          display: flex;
          gap: 8px;
        }
      }

      .progress-bar {
        .audio-progress {
          margin-bottom: 8px;
        }

        .progress-time {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-family: monospace;
        }
      }
    }

    .transcription-section {
      .transcription-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          color: var(--el-text-color-primary);
        }
      }

      .transcription-result {
        background: var(--el-fill-color-light);
        padding: 16px;
        border-radius: 8px;

        .result-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;

          .confidence-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;

            &.high {
              background: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }

            &.medium {
              background: var(--el-color-warning-light-9);
              color: var(--el-color-warning);
            }

            &.low {
              background: var(--el-color-danger-light-9);
              color: var(--el-color-danger);
            }
          }

          .language-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            background: var(--el-color-info-light-9);
            color: var(--el-color-info);
          }
        }

        .result-text {
          .transcription-textarea {
            margin-bottom: 12px;
          }

          .text-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
        }
      }
    }
  }

  .error-message {
    margin-top: 16px;
  }

  .unsupported-warning {
    margin-top: 16px;
  }

  .advanced-options {
    margin-top: 20px;
    border-top: 1px solid var(--el-border-color);
    padding-top: 20px;

    .option-group {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 暗色主题适配
.dark {
  .voice-input-container {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color-darker);

    .recording-status .status-content {
      background: var(--el-fill-color-darker);
    }

    .recording-info .info-content {
      background: var(--el-fill-color);
    }

    .audio-preview,
    .transcription-result {
      background: var(--el-fill-color);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .voice-input-container {
    padding: 16px;

    .voice-input-main .recording-controls .record-button {
      width: 60px;
      height: 60px;
    }

    .recording-result .audio-preview .audio-info {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .transcription-section .transcription-header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .transcription-result .text-actions {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
