# TavernAI Plus 前端设计规范 🎨

## 📋 项目概述

**项目名称**: TavernAI Plus - AI角色扮演对话平台  
**设计理念**: 神秘、科技、沉浸式的AI交互体验  
**目标用户**: AI角色扮演爱好者、创作者、开发者  
**平台支持**: 桌面端(PC)、移动端(WAP)、平板  

---

## 🎯 设计原则

### 1. 用户至上 (User-Centric)
- **沉浸式体验**: 深色主题营造专注的对话环境
- **直观操作**: 减少学习成本，核心功能触手可及
- **个性化**: 支持用户自定义主题和布局偏好

### 2. 科技美学 (Tech Aesthetics)  
- **神秘紫金色调**: 体现AI的神秘感和高科技属性
- **渐变与光效**: 营造未来科技感
- **玻璃拟态**: 现代化视觉层次

### 3. 响应式优先 (Mobile-First)
- **移动端优先设计**: 确保在所有设备上的完美体验
- **自适应布局**: 内容智能调整以适应不同屏幕
- **触控友好**: 按钮和交互区域适合触摸操作

---

## 🎨 设计系统

### 颜色系统 (Color Palette)

#### 主色调 - 神秘紫金系
```scss
// 主色 - 紫色系
$primary-50: #F3F0FF;    // 最浅紫色 (背景装饰)
$primary-100: #E9E2FF;   // 浅紫色 (hover状态)
$primary-200: #D6C7FF;   // 中浅紫色
$primary-300: #BBA3FF;   // 中紫色
$primary-400: #A78BFA;   // 亮紫色 (次要按钮)
$primary-500: #8B5CF6;   // 主紫色 (主要按钮)
$primary-600: #7C3AED;   // 深紫色 (按钮按下)
$primary-700: #6B21A8;   // 更深紫色
$primary-800: #581C87;   // 深紫色 (文字)
$primary-900: #4C1D95;   // 最深紫色
```

#### 辅助色 - 温暖金色系
```scss
// 辅助色 - 金色系
$secondary-50: #FFFBEB;   // 最浅金色
$secondary-100: #FEF3C7;  // 浅金色
$secondary-200: #FDE68A;  // 中浅金色
$secondary-300: #FCD34D;  // 亮金色
$secondary-400: #FBBF24;  // 明金色
$secondary-500: #F59E0B;  // 主金色 (强调色)
$secondary-600: #D97706;  // 深金色
$secondary-700: #B45309;  // 更深金色
$secondary-800: #92400E;  // 深金色
$secondary-900: #78350F;  // 最深金色
```

#### 中性色 - 深空灰系
```scss
// 背景色系 (深色主题)
$gray-50: #F9FAFB;      // 最浅灰 (亮色主题背景)
$gray-100: #F3F4F6;     // 浅灰
$gray-200: #E5E7EB;     // 中浅灰
$gray-300: #D1D5DB;     // 中灰
$gray-400: #9CA3AF;     // 中深灰 (占位符文字)
$gray-500: #6B7280;     // 深灰 (次要文字)
$gray-600: #4B5563;     // 更深灰 (主要文字-亮色主题)
$gray-700: #374151;     // 深灰
$gray-800: #1F2937;     // 更深灰 (卡片背景)
$gray-900: #111827;     // 最深灰 (主背景)

// 深色主题专用背景
$dark-bg-primary: #0F0F23;    // 主背景 - 深紫蓝
$dark-bg-secondary: #1E1E3F;  // 次要背景 - 中紫蓝  
$dark-bg-tertiary: #2D2D5A;   // 第三背景 - 浅紫蓝
$dark-bg-card: #252544;       // 卡片背景 - 暖紫灰
```

#### 语义色系
```scss
// 功能色
$success: #10B981;    // 成功绿
$warning: #F59E0B;    // 警告金 (使用辅助色)
$error: #EF4444;      // 错误红
$info: #3B82F6;       // 信息蓝

// 状态色 (带透明度)
$success-bg: rgba(16, 185, 129, 0.1);
$warning-bg: rgba(245, 158, 11, 0.1);
$error-bg: rgba(239, 68, 68, 0.1);
$info-bg: rgba(59, 130, 246, 0.1);
```

### 字体系统 (Typography)

#### 字体家族
```scss
// 主字体 - 无衬线字体堆栈
$font-family-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
                   'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;

// 等宽字体 - 代码显示
$font-family-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 
                   'Roboto Mono', monospace;

// 衬线字体 - 装饰性文字
$font-family-serif: 'Crimson Pro', 'Georgia', 'Times New Roman', serif;
```

#### 字体尺寸阶梯
```scss
// 字体大小系统 (基于 1.125 比例)
$text-xs: 0.75rem;     // 12px - 标签、辅助信息
$text-sm: 0.875rem;    // 14px - 次要文字、描述
$text-base: 1rem;      // 16px - 正文、基础文字
$text-lg: 1.125rem;    // 18px - 小标题、重要信息
$text-xl: 1.25rem;     // 20px - 中标题
$text-2xl: 1.5rem;     // 24px - 大标题
$text-3xl: 1.875rem;   // 30px - 页面标题
$text-4xl: 2.25rem;    // 36px - 主标题
$text-5xl: 3rem;       // 48px - 超大标题
$text-6xl: 3.75rem;    // 60px - 英雄标题
```

#### 字重系统
```scss
$font-weight-thin: 100;        // 极细
$font-weight-light: 300;       // 细体
$font-weight-normal: 400;      // 正常
$font-weight-medium: 500;      // 中等
$font-weight-semibold: 600;    // 半粗体
$font-weight-bold: 700;        // 粗体
$font-weight-extrabold: 800;   // 特粗体
$font-weight-black: 900;       // 黑体
```

#### 行高系统
```scss
$leading-none: 1;          // 紧密行高
$leading-tight: 1.25;      // 紧凑行高 (标题)
$leading-snug: 1.375;      // 舒适行高
$leading-normal: 1.5;      // 标准行高 (正文)
$leading-relaxed: 1.625;   // 宽松行高 (长文本)
$leading-loose: 2;         // 松散行高
```

### 间距系统 (Spacing)

#### 8px 基础间距系统
```scss
$space-0: 0;           // 0px
$space-px: 1px;        // 1px (边框)
$space-0-5: 0.125rem;  // 2px
$space-1: 0.25rem;     // 4px
$space-1-5: 0.375rem;  // 6px
$space-2: 0.5rem;      // 8px   ← 基础单位
$space-2-5: 0.625rem;  // 10px
$space-3: 0.75rem;     // 12px
$space-3-5: 0.875rem;  // 14px
$space-4: 1rem;        // 16px  ← 组件内间距
$space-5: 1.25rem;     // 20px
$space-6: 1.5rem;      // 24px  ← 组件间间距
$space-7: 1.75rem;     // 28px
$space-8: 2rem;        // 32px  ← 区块间距
$space-9: 2.25rem;     // 36px
$space-10: 2.5rem;     // 40px
$space-11: 2.75rem;    // 44px
$space-12: 3rem;       // 48px  ← 大区块间距
$space-14: 3.5rem;     // 56px
$space-16: 4rem;       // 64px  ← 页面级间距
$space-20: 5rem;       // 80px
$space-24: 6rem;       // 96px
$space-32: 8rem;       // 128px
$space-40: 10rem;      // 160px
$space-48: 12rem;      // 192px
$space-56: 14rem;      // 224px
$space-64: 16rem;      // 256px
```

### 圆角系统 (Border Radius)
```scss
$rounded-none: 0;              // 无圆角
$rounded-sm: 0.125rem;         // 2px - 小元素
$rounded: 0.25rem;             // 4px - 按钮、输入框
$rounded-md: 0.375rem;         // 6px - 卡片、容器
$rounded-lg: 0.5rem;           // 8px - 大卡片
$rounded-xl: 0.75rem;          // 12px - 模态框
$rounded-2xl: 1rem;            // 16px - 大容器
$rounded-3xl: 1.5rem;          // 24px - 特殊装饰
$rounded-full: 9999px;         // 圆形 - 头像、徽章
```

### 阴影系统 (Shadows)
```scss
// 基础阴影
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.15);
$shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
$shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

// 深色主题阴影 (更强对比)
$shadow-dark-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
$shadow-dark: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.12);
$shadow-dark-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12);
$shadow-dark-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
$shadow-dark-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);

// 品牌色光晕效果
$glow-primary: 0 0 20px rgba(139, 92, 246, 0.4);
$glow-secondary: 0 0 20px rgba(245, 158, 11, 0.4);
```

---

## 📱 响应式设计

### 断点系统 (Breakpoints)
```scss
// 移动端优先断点
$breakpoint-xs: 475px;    // 超小屏手机
$breakpoint-sm: 640px;    // 小屏手机
$breakpoint-md: 768px;    // 平板竖屏
$breakpoint-lg: 1024px;   // 平板横屏/小笔记本
$breakpoint-xl: 1280px;   // 桌面端
$breakpoint-2xl: 1536px;  // 大屏桌面
```

### 响应式布局规范

#### 1. 移动端 (< 768px)
- **单列布局**: 移除侧边栏，使用底部导航
- **全屏对话**: 对话区域占满整个视口
- **触控优化**: 按钮最小44px，间距增大
- **字体调整**: 适当增大字体确保可读性

#### 2. 平板端 (768px - 1024px)
- **双列布局**: 可折叠侧边栏 + 主内容区
- **自适应导航**: 顶部导航栏适配平板尺寸
- **触控友好**: 保持足够的触控目标尺寸

#### 3. 桌面端 (> 1024px)
- **三列布局**: 侧边栏 + 主内容 + 信息面板
- **悬浮交互**: 丰富的hover效果和工具提示
- **键盘快捷键**: 支持常用快捷键操作

### 容器系统
```scss
// 响应式容器
.container {
  width: 100%;
  margin: 0 auto;
  
  // 移动端
  @media (max-width: #{$breakpoint-sm - 1px}) {
    padding: 0 $space-4;
  }
  
  // 平板端
  @media (min-width: $breakpoint-sm) and (max-width: #{$breakpoint-lg - 1px}) {
    padding: 0 $space-6;
    max-width: $breakpoint-lg;
  }
  
  // 桌面端
  @media (min-width: $breakpoint-lg) {
    padding: 0 $space-8;
    max-width: 1200px;
  }
}
```

---

## 🧩 组件设计规范

### 按钮系统 (Buttons)

#### 主要按钮 (Primary)
```scss
.btn-primary {
  background: linear-gradient(135deg, $primary-500, $primary-600);
  color: white;
  border: none;
  border-radius: $rounded-md;
  padding: $space-3 $space-6;
  font-weight: $font-weight-medium;
  font-size: $text-base;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(135deg, $primary-400, $primary-500);
    transform: translateY(-1px);
    box-shadow: $shadow-lg;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}
```

#### 次要按钮 (Secondary)
```scss
.btn-secondary {
  background: transparent;
  color: $primary-400;
  border: 1px solid $primary-400;
  border-radius: $rounded-md;
  padding: $space-3 $space-6;
  
  &:hover {
    background: rgba($primary-400, 0.1);
    border-color: $primary-300;
  }
}
```

#### 按钮尺寸变体
```scss
// 大按钮
.btn-lg {
  padding: $space-4 $space-8;
  font-size: $text-lg;
}

// 小按钮  
.btn-sm {
  padding: $space-2 $space-4;
  font-size: $text-sm;
}

// 超小按钮
.btn-xs {
  padding: $space-1 $space-3;
  font-size: $text-xs;
}
```

### 卡片系统 (Cards)
```scss
.card {
  background: $dark-bg-card;
  border: 1px solid rgba($primary-400, 0.2);
  border-radius: $rounded-lg;
  padding: $space-6;
  box-shadow: $shadow-dark-md;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-dark-lg;
    border-color: rgba($primary-400, 0.4);
  }
}

.card-header {
  margin-bottom: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid rgba($gray-600, 0.3);
}

.card-title {
  font-size: $text-xl;
  font-weight: $font-weight-semibold;
  color: $gray-100;
  margin: 0;
}

.card-body {
  color: $gray-300;
  line-height: $leading-relaxed;
}
```

### 输入框系统 (Form Controls)
```scss
.form-control {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: $rounded-md;
  background: rgba($dark-bg-secondary, 0.5);
  color: $gray-100;
  font-size: $text-base;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $primary-400;
    box-shadow: 0 0 0 3px rgba($primary-400, 0.1);
    background: rgba($dark-bg-secondary, 0.8);
  }
  
  &::placeholder {
    color: $gray-500;
  }
}

.form-label {
  display: block;
  font-size: $text-sm;
  font-weight: $font-weight-medium;
  color: $gray-300;
  margin-bottom: $space-2;
}
```

---

## 🎭 动画与过渡

### 动画时长系统
```scss
$duration-75: 75ms;      // 极快 - 微交互
$duration-100: 100ms;    // 很快 - 按钮反馈
$duration-150: 150ms;    // 快速 - hover效果
$duration-200: 200ms;    // 标准 - 一般过渡
$duration-300: 300ms;    // 中等 - 弹窗显示
$duration-500: 500ms;    // 慢速 - 页面过渡
$duration-700: 700ms;    // 很慢 - 复杂动画
$duration-1000: 1000ms;  // 极慢 - 特殊效果
```

### 缓动函数
```scss
$ease-linear: linear;
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 常用动画组件
```scss
// 淡入淡出
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

// 滑动效果
@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// 缩放效果
@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 光晕脉冲
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba($primary-400, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba($primary-400, 0.8), 0 0 30px rgba($primary-400, 0.4);
  }
}
```

---

## ♿ 无障碍设计 (Accessibility)

### 颜色对比度规范
- **正常文字**: 最小对比度 4.5:1
- **大号文字**: 最小对比度 3:1
- **图标和按钮**: 最小对比度 3:1

### 焦点管理
```scss
// 键盘焦点样式
.focus-visible {
  &:focus-visible {
    outline: 2px solid $primary-400;
    outline-offset: 2px;
    border-radius: $rounded-sm;
  }
}

// 跳过链接
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: $primary-600;
  color: white;
  padding: 8px;
  border-radius: $rounded;
  text-decoration: none;
  z-index: 1000;
  
  &:focus {
    top: 6px;
  }
}
```

### 语义化HTML规范
- 使用语义化标签 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- 为图片添加有意义的 `alt` 属性
- 使用适当的标题层级 (`<h1>` - `<h6>`)
- 为表单控件添加 `<label>` 标签

---

## 📐 布局系统

### 网格系统 (Grid System)
```scss
// 12列网格系统
.grid {
  display: grid;
  gap: $space-6;
  
  // 移动端默认单列
  grid-template-columns: 1fr;
  
  // 平板端
  @media (min-width: $breakpoint-md) {
    &.grid-2 { grid-template-columns: repeat(2, 1fr); }
    &.grid-3 { grid-template-columns: repeat(3, 1fr); }
  }
  
  // 桌面端
  @media (min-width: $breakpoint-lg) {
    &.grid-4 { grid-template-columns: repeat(4, 1fr); }
    &.grid-6 { grid-template-columns: repeat(6, 1fr); }
    &.grid-12 { grid-template-columns: repeat(12, 1fr); }
  }
}
```

### Flexbox 工具类
```scss
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-none { flex: none; }
```

---

## 🎨 特殊效果

### 玻璃拟态效果 (Glassmorphism)
```scss
.glass {
  background: rgba($dark-bg-card, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba($primary-400, 0.2);
  box-shadow: $shadow-dark-lg;
}
```

### 渐变背景
```scss
.gradient-primary {
  background: linear-gradient(135deg, $primary-500, $primary-600);
}

.gradient-secondary {
  background: linear-gradient(135deg, $secondary-500, $secondary-600);
}

.gradient-text {
  background: linear-gradient(135deg, $primary-400, $secondary-400);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 📱 移动端特殊考虑

### 触控交互
- **最小触控目标**: 44px × 44px
- **按钮间距**: 最小8px间距避免误触
- **滑动手势**: 支持左右滑动切换页面

### 视口配置
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
```

### 安全区域适配
```scss
// iPhone X+ 安全区域适配
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 🔧 工具类系统

### 常用工具类
```scss
// 显示/隐藏
.hidden { display: none !important; }
.block { display: block !important; }
.inline { display: inline !important; }
.inline-block { display: inline-block !important; }

// 定位
.relative { position: relative !important; }
.absolute { position: absolute !important; }
.fixed { position: fixed !important; }
.sticky { position: sticky !important; }

// 溢出处理
.overflow-hidden { overflow: hidden !important; }
.overflow-auto { overflow: auto !important; }
.overflow-scroll { overflow: scroll !important; }

// 文字处理
.text-left { text-align: left !important; }
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }
.text-truncate { 
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

// 鼠标样式
.cursor-pointer { cursor: pointer !important; }
.cursor-not-allowed { cursor: not-allowed !important; }
.cursor-grab { cursor: grab !important; }

// 用户选择
.select-none { user-select: none !important; }
.select-text { user-select: text !important; }
.select-all { user-select: all !important; }
```

---

## 📋 实施清单

### 阶段一：基础重构 (第1-2周)
- [ ] 重构现有SCSS变量系统，统一颜色定义
- [ ] 创建响应式断点和容器系统
- [ ] 实施基础组件样式(按钮、卡片、表单)
- [ ] 修复硬编码颜色问题

### 阶段二：组件标准化 (第3-4周)  
- [ ] 标准化所有UI组件样式
- [ ] 实施动画和过渡系统
- [ ] 优化移动端交互体验
- [ ] 添加无障碍访问支持

### 阶段三：高级特性 (第5-6周)
- [ ] 实施玻璃拟态和特殊效果
- [ ] 完善深色/浅色主题切换
- [ ] 性能优化和CSS压缩
- [ ] 创建设计系统文档站点

---

## 🎯 成功指标

### 用户体验指标
- **页面加载速度**: < 2秒首屏渲染
- **交互响应时间**: < 100ms按钮反馈
- **移动端适配率**: 100%功能在移动端可用
- **无障碍评分**: WCAG 2.1 AA级合规

### 开发效率指标
- **组件复用率**: > 80%UI使用标准组件
- **样式代码减少**: 减少30%+冗余CSS
- **维护成本**: 统一设计系统降低维护成本

---

**📞 联系我**: 如需更详细的实施指导或有疑问，请随时咨询！

*本文档将随着项目发展持续更新和完善。*