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

  // Actions
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,

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
  DownloadIcon,

  // System
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserIcon,

  // Feedback
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleOvalLeftIcon,

  // Media
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,

  // Special
  SparklesIcon,
  BoltIcon,
  FireIcon,
  GiftIcon
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
  settings: CogIcon,
  document: DocumentIcon,
  plus: PlusIcon,

  // Actions
  play: PlayIcon,
  pause: PauseIcon,
  stop: StopIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,

  // Status
  check: CheckIcon,
  close: XMarkIcon,
  x: XMarkIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  heart: HeartIcon,
  star: StarIcon,

  // Controls
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  share: ShareIcon,
  download: DownloadIcon,

  // System
  gear: Cog6ToothIcon,
  bell: BellIcon,
  search: MagnifyingGlassIcon,
  menu: EllipsisVerticalIcon,
  user: UserIcon,

  // Feedback
  'thumb-up': HandThumbUpIcon,
  'thumb-down': HandThumbDownIcon,
  message: ChatBubbleOvalLeftIcon,

  // Media
  photo: PhotoIcon,
  video: VideoCameraIcon,
  microphone: MicrophoneIcon,
  speaker: SpeakerWaveIcon,

  // Special
  sparkles: SparklesIcon,
  bolt: BoltIcon,
  fire: FireIcon,
  gift: GiftIcon,

  // Loading
  spinner: ArrowPathIcon
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