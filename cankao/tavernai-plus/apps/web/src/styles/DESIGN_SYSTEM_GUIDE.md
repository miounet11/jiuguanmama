# TavernAI Plus 设计系统指南

## 概述

TavernAI Plus 设计系统 2.0 是一个现代化的、深色主题优先的设计语言，专为宅男宅女用户群体打造。系统融合了神秘、科技和未来感的视觉元素，提供一致且引人入胜的用户体验。

## 设计理念

### 核心价值观
- **神秘感**：深邃的色彩和柔和的光效营造神秘氛围
- **科技感**：现代化的界面元素体现未来科技
- **舒适性**：深色主题减少眼疲劳，适合长时间使用
- **个性化**：面向年轻用户群体的视觉偏好

### 设计语言特色
- 深色主题为主，亮色主题为辅
- 8px 网格系统确保像素完美
- 流畅的动画和过渡效果
- 清晰的视觉层次结构

## 颜色系统

### 主品牌色 - 神秘紫色
**灵感来源**：夜空、魔法、神秘力量
```scss
--brand-primary-500: #a855f7; // 主紫色
--brand-primary-600: #9333ea; // 悬浮状态
--brand-primary-400: #c084fc; // 禁用状态
```

**使用场景**：
- 主要操作按钮
- 导航激活状态
- 重要信息高亮
- 品牌标识

### 辅助品牌色 - 赛博蓝
**灵感来源**：科技、未来、数字世界
```scss
--brand-secondary-500: #3b82f6; // 主蓝色
--brand-secondary-600: #2563eb; // 深蓝色
--brand-secondary-400: #60a5fa; // 浅蓝色
```

**使用场景**：
- 信息提示
- 链接颜色
- 次要操作按钮
- 数据可视化

### 强调色 - 霓虹绿
**灵感来源**：活力、成功、生机
```scss
--brand-accent-500: #10b981; // 主绿色
--brand-accent-600: #059669; // 深绿色
--brand-accent-400: #34d399; // 浅绿色
```

**使用场景**：
- 成功状态
- 确认操作
- 在线状态指示
- 正面反馈

### 中性色系 - 深空灰度
**灵感来源**：深空、宇宙、无限
```scss
--neutral-900: #18181b; // 最深灰
--neutral-800: #27272a; // 深灰
--neutral-700: #3f3f46; // 中深灰
--neutral-600: #52525b; // 中灰
--neutral-500: #71717a; // 中浅灰
```

### 背景层级系统
```scss
--surface-0: #0a0a0f; // 最深背景 - 宇宙深空
--surface-1: #111118; // 主要背景 - 深夜
--surface-2: #1a1a24; // 次要背景 - 暮色
--surface-3: #242430; // 卡片背景 - 黄昏
--surface-4: #2e2e3c; // 悬浮元素 - 薄暮
```

## 排版系统

### 字体家族
```scss
--font-primary: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-secondary: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace;
```

### 字体大小层级
基于 1.25 比例和 16px 基准的和谐比例系统：

```scss
--text-2xs: 0.625rem;  // 10px - 微小标签
--text-xs: 0.75rem;    // 12px - 小标签、辅助信息
--text-sm: 0.875rem;   // 14px - 次要文本、按钮
--text-base: 1rem;     // 16px - 正文基准
--text-lg: 1.125rem;   // 18px - 强调文本
--text-xl: 1.25rem;    // 20px - 小标题
--text-2xl: 1.5rem;    // 24px - 中标题
--text-3xl: 1.875rem;  // 30px - 大标题
--text-4xl: 2.25rem;   // 36px - 特大标题
```

### 文本层级
```scss
--text-primary: #f8fafc;    // 主要文本 - 最高对比度
--text-secondary: #cbd5e1;  // 次要文本 - 高对比度
--text-tertiary: #94a3b8;   // 第三文本 - 中对比度
--text-quaternary: #64748b; // 占位符文本 - 低对比度
--text-disabled: #475569;   // 禁用文本 - 最低对比度
```

## 间距系统

### 8px 网格基础
所有间距都基于 8px 的倍数，确保像素完美的设计：

```scss
--space-1: 0.25rem;  // 4px - 最小间距
--space-2: 0.5rem;   // 8px - 基础间距
--space-3: 0.75rem;  // 12px - 小间距
--space-4: 1rem;     // 16px - 标准间距
--space-6: 1.5rem;   // 24px - 大间距
--space-8: 2rem;     // 32px - 段落间距
--space-12: 3rem;    // 48px - 区域间距
--space-16: 4rem;    // 64px - 页面间距
```

### 语义化间距
```scss
--spacing-micro: var(--space-1);     // 微间距 - 图标与文字
--spacing-tight: var(--space-2);     // 紧凑间距 - 相关元素
--spacing-normal: var(--space-4);    // 标准间距 - 默认间距
--spacing-comfortable: var(--space-6); // 舒适间距 - 阅读优化
--spacing-loose: var(--space-8);     // 宽松间距 - 分组间隔
--spacing-relaxed: var(--space-12);  // 放松间距 - 区域分割
```

## 阴影系统

### 深色主题优化阴影
为深色背景特别优化的阴影系统，增强层次感：

```scss
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
```

### 彩色阴影
品牌色增强的特殊阴影效果：

```scss
--shadow-primary: 0 8px 25px -8px rgba(168, 85, 247, 0.4);
--shadow-secondary: 0 8px 25px -8px rgba(59, 130, 246, 0.4);
--shadow-glow: 0 0 20px rgba(168, 85, 247, 0.3);
```

## 圆角系统

### 现代化圆角
平衡功能性与美观性的圆角系统：

```scss
--radius-sm: 0.25rem;    // 4px - 微小圆角 (标签、徽章)
--radius-base: 0.375rem; // 6px - 基础圆角 (按钮、输入框)
--radius-md: 0.5rem;     // 8px - 中等圆角 (卡片、模态框)
--radius-lg: 0.75rem;    // 12px - 大圆角 (面板、容器)
--radius-xl: 1rem;       // 16px - 超大圆角 (主要卡片)
```

## 动画系统

### 流畅且高性能
基于用户感知优化的动画时长：

```scss
--duration-instant: 50ms;   // 即时反馈 (按钮按下)
--duration-fast: 150ms;     // 快速动画 (颜色变化)
--duration-normal: 250ms;   // 标准动画 (位移变化)
--duration-slow: 500ms;     // 慢速动画 (页面转场)
```

### 精心调校的缓动函数
```scss
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-back: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

## 响应式断点

### 移动端优先
```scss
--breakpoint-xs: 475px;   // 超小屏手机 (iPhone SE)
--breakpoint-sm: 640px;   // 小屏手机 (标准手机)
--breakpoint-md: 768px;   // 平板竖屏 (iPad)
--breakpoint-lg: 1024px;  // 平板横屏/小笔记本
--breakpoint-xl: 1280px;  // 桌面端
--breakpoint-2xl: 1536px; // 大屏桌面
```

## 使用指南

### Vue 组件中使用
```vue
<template>
  <div class="bg-surface-1 text-primary p-6 rounded-lg shadow-base">
    <h2 class="text-2xl font-semibold text-primary mb-4">
      神秘角色卡片
    </h2>
    <p class="text-secondary leading-relaxed">
      这是一个使用设计系统的示例组件...
    </p>
    <button class="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-base transition-colors duration-fast">
      召唤角色
    </button>
  </div>
</template>

<script setup lang="ts">
import { THEME, getThemeColor, getSpacing } from '@/styles/tokens'

// 在 JavaScript 中访问设计令牌
const primaryColor = getThemeColor('primary', '500')
const cardPadding = getSpacing('6')
</script>
```

### Tailwind CSS 类名
```html
<!-- 使用新的颜色系统 -->
<div class="bg-surface-2 text-primary border border-neutral-700">
  <h1 class="text-3xl font-bold text-primary mb-6">
    标题
  </h1>
  <button class="bg-primary-500 hover:bg-primary-400 px-6 py-3 rounded-lg shadow-primary">
    主要按钮
  </button>
  <button class="bg-secondary-500 hover:bg-secondary-400 px-6 py-3 rounded-lg">
    次要按钮
  </button>
</div>
```

### SCSS 中使用
```scss
.character-card {
  background: var(--surface-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-base);
  transition: var(--transition-all);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .title {
    color: var(--text-primary);
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    margin-bottom: var(--space-4);
  }

  .description {
    color: var(--text-secondary);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
  }
}
```

## 最佳实践

### 1. 一致性原则
- 始终使用设计令牌，避免硬编码值
- 保持组件间的视觉一致性
- 遵循既定的间距和颜色规范

### 2. 性能优化
- 使用 CSS 自定义属性实现主题切换
- 利用 Tailwind 的 JIT 模式减少 CSS 体积
- 合理使用动画，避免过度装饰

### 3. 可访问性
- 确保足够的颜色对比度
- 提供清晰的焦点指示器
- 支持用户偏好设置 (减少动画等)

### 4. 扩展性
- 新增颜色时遵循既有的命名规范
- 保持设计令牌的向后兼容性
- 文档化所有设计决策

## 组件示例

### 角色卡片
```vue
<template>
  <div class="character-card group">
    <div class="character-avatar">
      <img :src="character.avatar" :alt="character.name" />
    </div>
    <div class="character-info">
      <h3 class="character-name">{{ character.name }}</h3>
      <p class="character-description">{{ character.description }}</p>
      <div class="character-tags">
        <span v-for="tag in character.tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="character-actions">
      <button class="btn-primary">开始对话</button>
      <button class="btn-secondary">收藏</button>
    </div>
  </div>
</template>

<style scoped>
.character-card {
  @apply bg-surface-3 border border-neutral-700 rounded-lg p-6
         shadow-base hover:shadow-lg transition-all duration-normal
         group-hover:transform group-hover:-translate-y-1;
}

.character-avatar img {
  @apply w-16 h-16 rounded-full object-cover ring-2 ring-primary-500/20;
}

.character-name {
  @apply text-xl font-semibold text-primary mb-2;
}

.character-description {
  @apply text-secondary text-sm leading-relaxed mb-4;
}

.tag {
  @apply inline-block bg-primary-500/10 text-primary-400 px-2 py-1
         rounded-base text-xs font-medium mr-2 mb-2;
}

.btn-primary {
  @apply bg-primary-500 hover:bg-primary-400 text-white px-4 py-2
         rounded-base font-medium transition-colors duration-fast
         shadow-primary hover:shadow-lg;
}

.btn-secondary {
  @apply bg-surface-4 hover:bg-neutral-700 text-secondary hover:text-primary
         px-4 py-2 rounded-base font-medium transition-all duration-fast;
}
</style>
```

---

这个设计系统为 TavernAI Plus 提供了完整的视觉语言基础，确保整个应用的一致性和专业感。通过深色主题和神秘的色彩搭配，为用户创造沉浸式的 AI 角色扮演体验。