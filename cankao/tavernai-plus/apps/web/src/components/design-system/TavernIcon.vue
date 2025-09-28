<template>
  <component
    :is="iconComponent"
    :class="iconClasses"
    :style="iconStyles"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  // Navigation
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  DocumentIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,

  // Actions
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,

  // Status
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HeartIcon,
  StarIcon,

  // Controls
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon as DownloadIcon,
  ArrowUpTrayIcon,

  // System
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,

  // Feedback
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleOvalLeftIcon,

  // Media
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,

  // Special
  SparklesIcon,
  BoltIcon,
  FireIcon,
  GiftIcon,

  // Additional icons (very safe imports only)
  ClockIcon
} from '@heroicons/vue/24/outline'

// Spinner uses filled version for better visibility
import { ArrowPathIcon } from '@heroicons/vue/24/solid'

// Props
export interface TavernIconProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  color?: string
  rotate?: number
  flip?: 'horizontal' | 'vertical' | 'both'
}

const props = withDefaults(defineProps<TavernIconProps>(), {
  size: 'md'
})

// Icon registry - 映射图标名称到组件
const iconRegistry: Record<string, Component> = {
  // Navigation
  home: HomeIcon,
  users: UsersIcon,
  chat: ChatBubbleLeftRightIcon,
  'chat-bubble-left-right': ChatBubbleLeftRightIcon,
  settings: CogIcon,
  document: DocumentIcon,
  plus: PlusIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,

  // Actions
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'paper-airplane': PaperAirplaneIcon,
  'document-duplicate': DocumentDuplicateIcon,

  // Status
  check: CheckIcon,
  close: XMarkIcon,
  x: XMarkIcon,
  'x-mark': XMarkIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  heart: HeartIcon,
  star: StarIcon,

  // Controls
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  edit: PencilIcon,
  pencil: PencilIcon,
  delete: TrashIcon,
  trash: TrashIcon,
  share: ShareIcon,
  download: DownloadIcon,
  'arrow-down-tray': DownloadIcon,
  'arrow-up-tray': ArrowUpTrayIcon,

  // System
  gear: Cog6ToothIcon,
  'cog-6-tooth': Cog6ToothIcon,
  bell: BellIcon,
  search: MagnifyingGlassIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  menu: EllipsisVerticalIcon,
  user: UserIcon,
  'arrows-pointing-in': ArrowsPointingInIcon,
  'arrows-pointing-out': ArrowsPointingOutIcon,

  // Feedback
  'thumb-up': HandThumbUpIcon,
  'thumb-down': HandThumbDownIcon,
  message: ChatBubbleOvalLeftIcon,

  // Media
  photo: PhotoIcon,
  video: VideoCameraIcon,
  microphone: MicrophoneIcon,
  speaker: SpeakerWaveIcon,
  'speaker-wave': SpeakerWaveIcon,
  'speaker-x-mark': SpeakerXMarkIcon,

  // Special
  sparkles: SparklesIcon,
  bolt: BoltIcon,
  fire: FireIcon,
  gift: GiftIcon,

  // Loading
  spinner: ArrowPathIcon,
  'arrow-path': ArrowPathIcon,
  loading: ArrowPathIcon,

  // Additional mappings from warnings (using only imported icons)
  send: PaperAirplaneIcon,
  clock: ClockIcon,
  magic: SparklesIcon,
  brain: SparklesIcon,
  palette: PencilIcon, // 用铅笔图标替代画笔
  store: HomeIcon, // 用房屋图标替代商店
  explore: CogIcon, // 用设置图标替代探索
  shield: StarIcon, // 用星形图标替代盾牌
  book: DocumentIcon, // 用文档图标替代书籍
  'trending-up': ArrowUpIcon, // 用箭头向上替代
  'trending-down': ArrowDownIcon, // 用箭头向下替代
  globe: UsersIcon, // 用用户群组图标替代地球
  zap: BoltIcon,
  'thumbs-up': HandThumbUpIcon,
  rocket: ArrowUpIcon, // 用箭头向上替代火箭
  code: CogIcon, // 用设置图标替代代码
  building: HomeIcon, // 用房屋图标替代建筑
  grid: PlusIcon, // 用加号图标替代网格
  gamepad: CogIcon, // 用设置图标替代游戏手柄
  crown: StarIcon, // 使用星形图标代替王冠
  'document-text': DocumentIcon, // 用基本文档图标
  'chat-bubble-left-ellipsis': ChatBubbleOvalLeftIcon, // 用现有的聊天气泡替代
  'pencil-square': PencilIcon, // 用基本铅笔图标
  'user-circle': UserIcon, // 用基本用户图标

  // 新发现的缺失图标
  refresh: ArrowPathIcon, // 刷新图标用旋转箭头
  'message-circle': ChatBubbleOvalLeftIcon, // 消息圆圈用聊天气泡
  'exclamation-triangle': ExclamationTriangleIcon // 警告三角形图标
}

// Computed
const iconComponent = computed(() => {
  const component = iconRegistry[props.name]
  if (!component) {
    console.warn(`Icon "${props.name}" not found in registry. Available icons:`, Object.keys(iconRegistry))
    return iconRegistry.info // 默认使用info图标
  }
  return component
})

const iconClasses = computed(() => [
  'tavern-icon',
  {
    [`tavern-icon--${props.size}`]: typeof props.size === 'string',
    [`tavern-icon--flip-${props.flip}`]: props.flip
  }
])

const iconStyles = computed(() => {
  const styles: Record<string, string> = {}

  // 自定义尺寸
  if (typeof props.size === 'number') {
    styles.width = `${props.size}px`
    styles.height = `${props.size}px`
  }

  // 自定义颜色
  if (props.color) {
    styles.color = props.color
  }

  // 旋转
  if (props.rotate) {
    styles.transform = `rotate(${props.rotate}deg)`
  }

  return styles
})
</script>

<style lang="scss">
.tavern-icon {
  // 基础样式
  display: inline-block;
  flex-shrink: 0;
  color: currentColor;
  fill: currentColor;

  // 预设尺寸 - 基于8px网格
  &--xs {
    width: var(--space-3);   // 12px
    height: var(--space-3);
  }

  &--sm {
    width: var(--space-4);   // 16px
    height: var(--space-4);
  }

  &--md {
    width: var(--space-5);   // 20px
    height: var(--space-5);
  }

  &--lg {
    width: var(--space-6);   // 24px
    height: var(--space-6);
  }

  &--xl {
    width: var(--space-8);   // 32px
    height: var(--space-8);
  }

  // 翻转效果
  &--flip-horizontal {
    transform: scaleX(-1);
  }

  &--flip-vertical {
    transform: scaleY(-1);
  }

  &--flip-both {
    transform: scale(-1);
  }
}
</style>
