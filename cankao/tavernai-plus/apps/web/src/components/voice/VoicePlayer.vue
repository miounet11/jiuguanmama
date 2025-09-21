<template>
  <div class="voice-player" :class="{ 'compact': compact, 'dark': isDark }">
    <!-- 播放器主界面 -->
    <div class="player-main">
      <!-- 音频信息显示 -->
      <div class="audio-info" v-if="audioData && !compact">
        <div class="audio-title">
          <el-icon><Microphone /></el-icon>
          <span>{{ audioData.title || '语音消息' }}</span>
        </div>
        <div class="audio-meta" v-if="showMetadata">
          <span class="duration">{{ formatDuration(audioData.duration || 0) }}</span>
          <span class="timestamp">{{ formatTime(audioData.timestamp) }}</span>
          <span class="file-size" v-if="audioData.size">{{ formatFileSize(audioData.size) }}</span>
        </div>
      </div>

      <!-- 播放控制区域 -->
      <div class="player-controls">
        <!-- 主播放按钮 -->
        <div class="main-controls">
          <el-button
            :type="isPlaying ? 'warning' : 'primary'"
            :size="compact ? 'small' : 'default'"
            circle
            @click="togglePlay"
            :disabled="!canPlay || isLoading"
            :loading="isLoading"
            class="play-button"
          >
            <el-icon :size="compact ? 16 : 20">
              <component :is="isPlaying ? 'VideoPause' : 'VideoPlay'" />
            </el-icon>
          </el-button>

          <!-- 停止按钮 -->
          <el-button
            v-if="!compact && isPlaying"
            size="small"
            circle
            @click="stopPlayback"
            :icon="Close"
            class="stop-button"
          />
        </div>

        <!-- 进度控制 -->
        <div class="progress-controls" v-if="!compact || isPlaying">
          <div class="progress-info">
            <span class="current-time">{{ formatDuration(playbackProgress) }}</span>
            <span class="total-time">{{ formatDuration(playbackDuration) }}</span>
          </div>

          <div class="progress-bar">
            <el-slider
              v-model="playbackProgress"
              :max="playbackDuration"
              :step="0.1"
              :show-tooltip="false"
              @input="handleSeek"
              @change="commitSeek"
              :disabled="!canPlay"
              class="audio-progress"
            />
          </div>
        </div>

        <!-- 音量和速度控制 -->
        <div class="audio-controls" v-if="showControls && !compact">
          <!-- 音量控制 -->
          <div class="volume-control">
            <el-button
              size="small"
              text
              @click="toggleMute"
              :icon="volumeIcon"
              class="volume-button"
            />
            <el-slider
              v-model="currentVolume"
              :max="100"
              :step="1"
              :show-tooltip="false"
              @input="setVolume"
              class="volume-slider"
              vertical
              height="80px"
            />
          </div>

          <!-- 播放速度 -->
          <div class="speed-control">
            <el-dropdown @command="setSpeed" placement="top">
              <el-button size="small" text class="speed-button">
                {{ playbackSpeed }}x
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="speed in speedOptions"
                    :key="speed"
                    :command="speed"
                    :class="{ 'is-active': playbackSpeed === speed }"
                  >
                    {{ speed }}x
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 波形显示 -->
      <div class="waveform-display" v-if="showWaveform && !compact">
        <canvas
          ref="waveformCanvas"
          :width="waveformWidth"
          :height="waveformHeight"
          class="waveform-canvas"
          @click="handleWaveformClick"
        ></canvas>
      </div>
    </div>

    <!-- 扩展功能 -->
    <div class="player-extensions" v-if="showExtensions && !compact">
      <!-- 下载功能 -->
      <div class="download-section" v-if="allowDownload">
        <el-button
          size="small"
          @click="downloadAudio"
          :icon="Download"
          :disabled="!audioData"
        >
          下载音频
        </el-button>
      </div>

      <!-- 音频信息 -->
      <div class="audio-details" v-if="showDetails && audioData">
        <el-collapse size="small">
          <el-collapse-item title="音频详情" name="details">
            <div class="detail-grid">
              <div class="detail-item">
                <label>格式:</label>
                <span>{{ audioData.format || 'Unknown' }}</span>
              </div>
              <div class="detail-item">
                <label>比特率:</label>
                <span>{{ audioData.bitrate || 'Unknown' }}</span>
              </div>
              <div class="detail-item">
                <label>采样率:</label>
                <span>{{ audioData.sampleRate || 'Unknown' }}</span>
              </div>
              <div class="detail-item">
                <label>声道:</label>
                <span>{{ audioData.channels || 'Unknown' }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- 错误提示 -->
    <div class="error-message" v-if="error">
      <el-alert
        :title="error"
        type="error"
        :closable="true"
        @close="clearError"
        size="small"
      />
    </div>

    <!-- 加载状态 -->
    <div class="loading-overlay" v-if="isLoading">
      <el-icon class="spinning"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  ElButton, ElSlider, ElAlert, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElCollapse, ElCollapseItem
} from 'element-plus'
import {
  VideoPlay, VideoPause, Close, Microphone, Download, ArrowDown,
  Mute, Mute, Microphone, Loading
} from '@element-plus/icons-vue'
import { useVoice, type AudioRecording } from '@/composables/useVoice'

// Props
interface AudioData extends AudioRecording {
  title?: string
  format?: string
  bitrate?: string
  sampleRate?: string
  channels?: string
  size?: number
}

interface Props {
  audioData?: AudioData // 音频数据
  autoPlay?: boolean // 自动播放
  compact?: boolean // 紧凑模式
  showControls?: boolean // 显示音量和速度控制
  showWaveform?: boolean // 显示波形
  showExtensions?: boolean // 显示扩展功能
  showDetails?: boolean // 显示音频详情
  showMetadata?: boolean // 显示元数据
  allowDownload?: boolean // 允许下载
  waveformWidth?: number
  waveformHeight?: number
  isDark?: boolean // 暗色主题
}

const props = withDefaults(defineProps<Props>(), {
  autoPlay: false,
  compact: false,
  showControls: true,
  showWaveform: false,
  showExtensions: true,
  showDetails: false,
  showMetadata: true,
  allowDownload: true,
  waveformWidth: 400,
  waveformHeight: 60,
  isDark: false
})

// Emits
interface Emits {
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'stop'): void
  (e: 'seek', time: number): void
  (e: 'volume-change', volume: number): void
  (e: 'speed-change', speed: number): void
  (e: 'download', audioData: AudioData): void
  (e: 'error', error: string): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()

// 解构所需的状态和方法
const {
  isPlaying,
  playbackProgress,
  playbackDuration,
  volume,
  playbackSpeed,
  canPlay,
  playAudio,
  pauseAudio,
  stopAudio,
  seekAudio,
  setVolume: setVoiceVolume,
  setPlaybackSpeed: setVoicePlaybackSpeed,
  error,
  clearError
} = voice

// 组件状态
const isLoading = ref(false)
const isSeeking = ref(false)
const currentVolume = ref(80)
const isMuted = ref(false)
const previousVolume = ref(80)
const waveformCanvas = ref<HTMLCanvasElement | null>(null)
const waveformData = ref<number[]>([])

// 播放速度选项
const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4]

// 计算属性
const volumeIcon = computed(() => {
  if (isMuted.value || currentVolume.value === 0) {
    return Mute
  } else if (currentVolume.value < 50) {
    return Mute
  } else {
    return Microphone
  }
})

// 播放控制
const togglePlay = async () => {
  if (!props.audioData) return

  if (isPlaying.value) {
    pauseAudio()
    emit('pause')
  } else {
    isLoading.value = true
    try {
      const success = playAudio(props.audioData)
      if (success) {
        emit('play')
      }
    } catch (err) {
      console.error('播放失败:', err)
      emit('error', '音频播放失败')
    } finally {
      isLoading.value = false
    }
  }
}

const stopPlayback = () => {
  stopAudio()
  emit('stop')
}

// 进度控制
const handleSeek = (value: number) => {
  isSeeking.value = true
}

const commitSeek = (value: number) => {
  isSeeking.value = false
  seekAudio(value)
  emit('seek', value)
}

// 音量控制
const setVolume = (value: number) => {
  if (isMuted.value) {
    isMuted.value = false
  }
  currentVolume.value = value
  setVoiceVolume(value / 100)
  emit('volume-change', value / 100)
}

const toggleMute = () => {
  if (isMuted.value) {
    // 取消静音
    isMuted.value = false
    currentVolume.value = previousVolume.value
    setVoiceVolume(currentVolume.value / 100)
  } else {
    // 静音
    previousVolume.value = currentVolume.value
    isMuted.value = true
    currentVolume.value = 0
    setVoiceVolume(0)
  }
  emit('volume-change', currentVolume.value / 100)
}

// 速度控制
const setSpeed = (speed: number) => {
  setVoicePlaybackSpeed(speed)
  emit('speed-change', speed)
}

// 波形相关
const generateWaveform = async () => {
  if (!props.showWaveform || !waveformCanvas.value || !props.audioData) return

  try {
    // 这里应该分析音频文件生成波形数据
    // 简化版本：生成模拟波形数据
    const samples = 200
    const data: number[] = []

    for (let i = 0; i < samples; i++) {
      data.push(Math.random() * 0.8 + 0.1)
    }

    waveformData.value = data
    drawWaveform()
  } catch (err) {
    console.error('生成波形失败:', err)
  }
}

const drawWaveform = () => {
  if (!waveformCanvas.value || waveformData.value.length === 0) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const width = canvas.width
  const height = canvas.height
  const data = waveformData.value
  const barWidth = width / data.length
  const centerY = height / 2

  // 绘制波形
  ctx.fillStyle = props.isDark ? '#409eff' : '#409eff'

  for (let i = 0; i < data.length; i++) {
    const barHeight = data[i] * centerY
    const x = i * barWidth
    const y = centerY - barHeight / 2

    ctx.fillRect(x, y, barWidth - 1, barHeight)
  }

  // 绘制进度指示器
  if (playbackDuration.value > 0) {
    const progress = playbackProgress.value / playbackDuration.value
    const progressX = progress * width

    ctx.fillStyle = props.isDark ? '#67c23a' : '#67c23a'
    ctx.fillRect(0, 0, progressX, height)

    // 绘制进度线
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, height)
    ctx.stroke()
  }
}

const handleWaveformClick = (event: MouseEvent) => {
  if (!waveformCanvas.value || playbackDuration.value === 0) return

  const rect = waveformCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const progress = x / waveformCanvas.value.width
  const seekTime = progress * playbackDuration.value

  seekAudio(seekTime)
  emit('seek', seekTime)
}

// 下载功能
const downloadAudio = () => {
  if (!props.audioData) return

  const link = document.createElement('a')
  link.href = props.audioData.url
  link.download = `audio_${props.audioData.id}.${props.audioData.format || 'webm'}`
  link.click()

  emit('download', props.audioData)
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
    minute: '2-digit'
  })
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 监听器
watch(() => props.audioData, async (newData) => {
  if (newData) {
    await nextTick()
    if (props.autoPlay) {
      togglePlay()
    }
    if (props.showWaveform) {
      generateWaveform()
    }
  }
}, { immediate: true })

watch(playbackProgress, () => {
  if (props.showWaveform && !isSeeking.value) {
    drawWaveform()
  }
})

watch(currentVolume, (newVolume) => {
  if (!isMuted.value) {
    setVoiceVolume(newVolume / 100)
  }
})

// 生命周期
onMounted(() => {
  // 同步音量状态
  currentVolume.value = Math.round(volume.value * 100)

  if (props.audioData && props.showWaveform) {
    generateWaveform()
  }
})

onUnmounted(() => {
  stopAudio()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.voice-player {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  transition: all 0.3s ease;

  &.compact {
    padding: 8px 12px;

    .player-main {
      .player-controls {
        gap: 8px;

        .main-controls {
          gap: 4px;

          .play-button {
            width: 32px;
            height: 32px;
          }
        }

        .progress-controls {
          flex: 1;
          min-width: 120px;

          .progress-info {
            font-size: 11px;
            gap: 4px;
          }
        }
      }
    }
  }

  &.dark {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color-darker);
  }

  .player-main {
    .audio-info {
      margin-bottom: 12px;

      .audio-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .audio-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .duration {
          font-family: monospace;
        }
      }
    }

    .player-controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .main-controls {
        display: flex;
        align-items: center;
        gap: 8px;

        .play-button {
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.05);
          }
        }

        .stop-button {
          opacity: 0.7;

          &:hover {
            opacity: 1;
          }
        }
      }

      .progress-controls {
        flex: 1;
        min-width: 200px;

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-family: monospace;
          margin-bottom: 4px;
        }

        .progress-bar {
          .audio-progress {
            --el-slider-runway-bg-color: var(--el-fill-color-light);
            --el-slider-main-bg-color: var(--el-color-primary);
            --el-slider-button-size: 16px;
          }
        }
      }

      .audio-controls {
        display: flex;
        align-items: center;
        gap: 16px;

        .volume-control {
          position: relative;

          .volume-button {
            &:hover + .volume-slider {
              opacity: 1;
              visibility: visible;
            }
          }

          .volume-slider {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            background: var(--el-bg-color-overlay);
            border: 1px solid var(--el-border-color);
            border-radius: 8px;
            padding: 8px;
            box-shadow: var(--el-box-shadow);

            &:hover {
              opacity: 1;
              visibility: visible;
            }
          }
        }

        .speed-control {
          .speed-button {
            font-size: 12px;
            min-width: 40px;
          }
        }
      }
    }

    .waveform-display {
      margin-top: 16px;

      .waveform-canvas {
        width: 100%;
        height: 60px;
        border: 1px solid var(--el-border-color);
        border-radius: 6px;
        cursor: pointer;
        background: var(--el-fill-color-extra-light);

        &:hover {
          border-color: var(--el-color-primary);
        }
      }
    }
  }

  .player-extensions {
    margin-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
    padding-top: 16px;

    .download-section {
      margin-bottom: 12px;
    }

    .audio-details {
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;

          label {
            font-weight: 500;
            color: var(--el-text-color-secondary);
          }

          span {
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }

  .error-message {
    margin-top: 12px;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    .spinning {
      animation: spin 1s linear infinite;
    }
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
.dark .voice-player {
  .loading-overlay {
    background: rgba(0, 0, 0, 0.9);
  }

  .waveform-canvas {
    background: var(--el-fill-color);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .voice-player {
    .player-main .player-controls {
      flex-wrap: wrap;
      gap: 12px;

      .progress-controls {
        order: 3;
        width: 100%;
      }

      .audio-controls {
        gap: 8px;

        .volume-control .volume-slider {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          height: 120px;
        }
      }
    }

    .player-extensions .audio-details .detail-grid {
      grid-template-columns: 1fr;
    }
  }
}

// Element Plus 组件样式覆盖
:deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.el-slider__runway) {
  height: 4px;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
}
</style>
