# 渐进式披露样式系统使用指南

## 概述

TavernAI Plus 的渐进式披露样式系统为 Issue #16 提供了完整的样式解决方案，支持简洁模式和专家模式的无缝切换，以及功能的智能展示和隐藏。

## 快速开始

### 1. 基础HTML结构

```html
<div class="progressive-disclosure-wrapper">
  <!-- 模式切换器 -->
  <div class="mode-switcher">
    <el-switch
      v-model="isExpertMode"
      active-text="专家模式"
      inactive-text="简洁模式"
    />
  </div>

  <!-- 功能容器 -->
  <div class="feature-container" :class="containerClass">
    <!-- 核心功能：在所有模式下都显示 -->
    <div class="feature-item core-feature">
      核心功能内容
    </div>

    <!-- 专家功能：只在专家模式显示 -->
    <div class="feature-item expert-feature expert-only">
      专家功能内容
    </div>
  </div>
</div>
```

### 2. Vue 3 组件集成

```vue
<template>
  <div class="progressive-disclosure-wrapper" :class="wrapperClass">
    <!-- 模式切换器 -->
    <div class="mode-switcher" :class="{ switching: isSwitching }">
      <el-switch
        v-model="isExpertMode"
        @change="handleModeSwitch"
        active-text="专家模式"
        inactive-text="简洁模式"
      />
    </div>

    <!-- 功能容器 -->
    <transition name="mode-switch" mode="out-in">
      <div :key="currentMode" class="feature-container" :class="containerClass">
        <!-- 功能项渲染 -->
        <transition-group name="feature-item" tag="div">
          <div
            v-for="feature in visibleFeatures"
            :key="feature.id"
            class="feature-item"
            :class="getFeatureClass(feature)"
          >
            <!-- 功能内容 -->
          </div>
        </transition-group>
      </div>
    </transition>

    <!-- 升级建议 -->
    <transition name="upgrade-suggestion">
      <div v-if="showUpgradeSuggestion" class="upgrade-suggestion">
        <!-- 升级建议内容 -->
      </div>
    </transition>

    <!-- 功能解锁通知 -->
    <teleport to="body">
      <transition name="feature-unlock">
        <div v-if="showUnlockNotification" class="feature-unlock-notification">
          <!-- 解锁通知内容 -->
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const isExpertMode = ref(false)
const isSwitching = ref(false)
const showUpgradeSuggestion = ref(false)
const showUnlockNotification = ref(false)

const currentMode = computed(() => isExpertMode.value ? 'expert' : 'simplified')

const wrapperClass = computed(() => ({
  'mode-switching': isSwitching.value,
  'simplified-mode': !isExpertMode.value,
  'expert-mode': isExpertMode.value
}))

const containerClass = computed(() => ({
  'simplified-mode': !isExpertMode.value,
  'expert-mode': isExpertMode.value,
  'switching-to-simplified': isSwitching.value && !isExpertMode.value,
  'switching-to-expert': isSwitching.value && isExpertMode.value,
  'scope-character-discovery': true // 根据实际作用域设置
}))

const handleModeSwitch = async (isExpert: boolean) => {
  isSwitching.value = true

  // 模拟模式切换逻辑
  await new Promise(resolve => setTimeout(resolve, 400))

  isSwitching.value = false
}

const getFeatureClass = (feature: any) => ({
  'core-feature': feature.coreFeature,
  'expert-feature': feature.isExpertFeature,
  'newly-unlocked': feature.isNewlyUnlocked,
  'expert-only': feature.isExpertFeature && !isExpertMode.value
})
</script>
```

## CSS 类说明

### 容器类

| 类名 | 用途 | 说明 |
|------|------|------|
| `.progressive-disclosure-wrapper` | 主容器 | 渐进式披露的根容器 |
| `.mode-switcher` | 模式切换器 | 包含 Element Plus Switch 的容器 |
| `.feature-container` | 功能容器 | 包含所有功能项的容器 |

### 状态类

| 类名 | 用途 | 说明 |
|------|------|------|
| `.simplified-mode` | 简洁模式 | 应用于容器，激活简洁模式样式 |
| `.expert-mode` | 专家模式 | 应用于容器，激活专家模式样式 |
| `.mode-switching` | 切换状态 | 模式切换期间的过渡状态 |
| `.switching-to-simplified` | 切换到简洁 | 切换到简洁模式的动画状态 |
| `.switching-to-expert` | 切换到专家 | 切换到专家模式的动画状态 |

### 功能项类

| 类名 | 用途 | 说明 |
|------|------|------|
| `.feature-item` | 功能项基类 | 所有功能项的基础样式 |
| `.core-feature` | 核心功能 | 在所有模式下都显示的功能 |
| `.expert-feature` | 专家功能 | 只在专家模式显示的功能 |
| `.expert-only` | 专家限定 | 在简洁模式下完全隐藏 |
| `.newly-unlocked` | 新解锁 | 新解锁功能的高亮样式 |
| `.feature-disabled` | 功能禁用 | 禁用状态的功能项 |
| `.feature-enabled` | 功能启用 | 启用状态的功能项 |

### 作用域类

| 类名 | 用途 | 说明 |
|------|------|------|
| `.scope-character-discovery` | 角色发现 | 角色发现页面的专用样式 |
| `.scope-chat` | 聊天功能 | 聊天页面的专用样式 |
| `.scope-character-creation` | 角色创建 | 角色创建页面的专用样式 |

## Vue 过渡动画

### 可用的过渡名称

| 过渡名称 | 用途 | 时长 |
|----------|------|------|
| `feature-unlock` | 功能解锁通知 | 400ms |
| `mode-switch` | 模式切换 | 400ms |
| `feature-item` | 功能项出现/消失 | 400ms + 交错 |
| `upgrade-suggestion` | 升级建议 | 600ms |

### 使用示例

```vue
<!-- 功能解锁通知 -->
<transition name="feature-unlock">
  <div v-if="showNotification" class="feature-unlock-notification">
    <!-- 内容 -->
  </div>
</transition>

<!-- 功能项列表 -->
<transition-group name="feature-item" tag="div">
  <div v-for="item in items" :key="item.id" class="feature-item">
    <!-- 内容 -->
  </div>
</transition-group>
```

## 自定义CSS变量

### 全局变量

```css
:root {
  /* 主要颜色 */
  --progressive-primary: #8b5cf6;
  --progressive-secondary: #f59e0b;
  --feature-unlocked: #10b981;
  --feature-expert: #6366f1;

  /* 间距 */
  --disclosure-padding: 1rem;
  --disclosure-gap: 0.75rem;
  --feature-item-gap: 0.5rem;

  /* 动画时长 */
  --disclosure-transition-fast: 200ms;
  --disclosure-transition-normal: 300ms;
  --disclosure-transition-slow: 500ms;
}
```

### 自定义变量示例

```css
/* 自定义主题色 */
.custom-theme {
  --progressive-primary: #ff6b6b;
  --progressive-secondary: #4ecdc4;
}

/* 自定义动画速度 */
.slow-animations {
  --disclosure-transition-normal: 600ms;
  --mode-transition-duration: 800ms;
}
```

## 响应式设计

### 断点支持

系统自动适配以下断点：

- **移动端** (`max-width: 767px`): 简化布局、减少动画
- **平板端** (`768px - 1023px`): 中等复杂度布局
- **桌面端** (`min-width: 1024px`): 完整功能布局

### 移动端优化

```scss
@include mobile-only {
  .progressive-disclosure-wrapper {
    padding: $spacing-2;
  }

  .feature-container.expert-mode {
    .feature-grid {
      grid-template-columns: 1fr;
    }
  }
}
```

## 可访问性

### 减少动效支持

系统自动检测用户的 `prefers-reduced-motion` 设置：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 高对比度支持

```css
@media (prefers-contrast: high) {
  .feature-item {
    border-width: 2px;
  }

  .mode-switcher {
    border-width: 2px;
  }
}
```

## 性能优化

### 硬件加速

关键动画元素使用 GPU 加速：

```css
.feature-item,
.mode-switcher,
.upgrade-suggestion {
  will-change: transform, opacity;
}
```

### 动画优化建议

1. **使用 transform 和 opacity**: 避免触发重排和重绘
2. **限制 will-change**: 只在必要时使用
3. **交错动画**: 使用适度的延迟避免性能峰值

## 调试和开发

### 开发模式

添加 `.development-mode` 类来显示调试信息：

```html
<div class="progressive-disclosure-wrapper development-mode">
  <!-- 内容 -->
</div>
```

### 性能监控

添加 `.performance-monitor` 类来可视化动画性能：

```html
<div class="progressive-disclosure-wrapper performance-monitor">
  <!-- 内容 -->
</div>
```

## 故障排除

### 常见问题

1. **样式不生效**: 确保正确导入 SCSS 文件
2. **动画卡顿**: 检查是否过度使用 will-change
3. **响应式问题**: 验证断点媒体查询

### 检查清单

- [ ] 正确的 HTML 结构
- [ ] 必要的 CSS 类
- [ ] Vue 过渡组件配置
- [ ] 响应式断点测试
- [ ] 可访问性验证

## 示例项目

查看 `progressive-disclosure-examples.scss` 文件获取完整的使用示例，包括：

- 角色发现页面集成
- 聊天功能集成
- 角色创建页面集成
- 动画集成示例
- 最佳实践示例