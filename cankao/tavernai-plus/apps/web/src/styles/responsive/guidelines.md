# =====================================
# 统一响应式设计规范 v2.0
# TavernAI Plus 项目
# =====================================

## 1. 设计原则

### 移动端优先
- 基础样式为移动端设计
- 通过媒体查询增强桌面端体验
- 确保核心功能在所有设备上可用

### 断点系统
- **移动端**: < 768px
- **平板端**: 768px - 1023px
- **桌面端**: ≥ 1024px
- **大屏桌面**: ≥ 1280px
- **超大屏**: ≥ 1536px

### 统一工具类
使用 `@import './responsive/utilities.scss'` 中的工具类，避免混合使用不同的响应式方案。

## 2. 响应式工具类使用指南

### 显示/隐藏控制
```html
<!-- 移动端专属 -->
<div class="mobile-only">仅在移动端显示</div>

<!-- 桌面端专属 -->
<div class="desktop-only">仅在桌面端显示</div>

<!-- 移动端及以下 -->
<div class="mobile-down">移动端及以下显示</div>

<!-- 桌面端及以上 -->
<div class="desktop-up">桌面端及以上显示</div>
```

### 布局控制
```html
<!-- Flexbox 响应式 -->
<div class="flex-mobile">移动端 flex</div>
<div class="flex-tablet">平板端 flex</div>
<div class="flex-desktop">桌面端 flex</div>

<!-- Grid 响应式 -->
<div class="grid-mobile">移动端 grid</div>
<div class="grid-tablet">平板端 grid</div>
<div class="grid-desktop">桌面端 grid</div>
```

### 间距控制
```html
<div class="p-mobile">移动端内边距</div>
<div class="p-tablet">平板端内边距</div>
<div class="p-desktop">桌面端内边距</div>
```

## 3. SCSS 混合器使用

### 断点混合器
```scss
.my-component {
  // 基础样式（移动端）
  padding: var(--spacing-normal);

  // 平板端及以上
  @include tablet-up {
    padding: var(--spacing-comfortable);
  }

  // 桌面端及以上
  @include desktop-up {
    padding: var(--spacing-loose);
  }

  // 仅移动端
  @include mobile-only {
    font-size: var(--text-sm);
  }
}
```

### 响应式布局混合器
```scss
.responsive-layout {
  @include mobile-layout {
    flex-direction: column;
  }

  @include tablet-layout {
    flex-direction: row;
  }

  @include desktop-layout {
    flex-direction: row;
    gap: var(--spacing-loose);
  }
}
```

## 4. 组件响应式设计模式

### 页面头部模式
```html
<template>
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="page-title">页面标题</h1>
        <p class="page-subtitle">页面描述</p>
      </div>

      <!-- 桌面端操作区 -->
      <div class="actions-section desktop-only">
        <el-button type="primary">操作按钮</el-button>
      </div>
    </div>

    <!-- 移动端操作区 -->
    <div class="mobile-actions mobile-only">
      <el-button type="primary" class="w-full">操作按钮</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--spacing-loose);
  }

  .mobile-actions {
    margin-top: var(--spacing-normal);
  }
}

@include mobile-only {
  .page-header .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-normal);
  }
}
</style>
```

### 网格布局模式
```html
<template>
  <div class="responsive-grid">
    <div v-for="item in items" :key="item.id" class="grid-item">
      {{ item.content }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.responsive-grid {
  display: grid;
  gap: var(--spacing-comfortable);
  grid-template-columns: 1fr;

  @include tablet-up {
    grid-template-columns: repeat(2, 1fr);
  }

  @include desktop-up {
    grid-template-columns: repeat(3, 1fr);
  }

  @include large-desktop-up {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
```

### 导航模式
```html
<template>
  <nav class="responsive-nav">
    <div class="nav-brand">Logo</div>

    <!-- 桌面端导航菜单 -->
    <div class="nav-menu desktop-only">
      <a href="#">首页</a>
      <a href="#">角色</a>
      <a href="#">聊天</a>
    </div>

    <!-- 移动端菜单按钮 -->
    <button class="mobile-menu-btn mobile-only" @click="toggleMenu">
      <el-icon><Menu /></el-icon>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.responsive-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-normal) var(--spacing-comfortable);
}

.nav-menu {
  display: flex;
  gap: var(--spacing-comfortable);
}

@include mobile-only {
  .responsive-nav {
    padding: var(--spacing-tight) var(--spacing-normal);
  }
}
</style>
```

## 5. 最佳实践

### 避免混合使用
- ❌ 不要同时使用 Tailwind CSS 类和自定义响应式系统
- ❌ 不要硬编码断点值 (如 `@media (max-width: 768px)`)
- ✅ 使用统一的混合器和工具类

### 性能优化
- 使用 `@include mobile-only` 而不是 `@media (max-width: 767px)`
- 避免过度嵌套的媒体查询
- 合理使用 `will-change` 和 `transform` 属性

### 可访问性
- 确保触摸目标至少 44px × 44px
- 移动端字体大小不小于 16px
- 保持足够的颜色对比度

## 6. 测试检查清单

### 移动端测试 (< 768px)
- [ ] 导航菜单可正常切换
- [ ] 按钮触摸区域足够大
- [ ] 文字大小适合阅读
- [ ] 横向布局是否需要调整
- [ ] 表单输入体验良好

### 平板端测试 (768px - 1023px)
- [ ] 布局充分利用屏幕空间
- [ ] 导航和操作按钮位置合理
- [ ] 内容密度适中
- [ ] 横竖屏切换正常

### 桌面端测试 (≥ 1024px)
- [ ] 鼠标悬停效果正常
- [ ] 键盘导航可用
- [ ] 充分利用宽屏空间
- [ ] 分辨率适配到 4K 显示器

## 7. 组件迁移指南

### 从 Tailwind CSS 迁移
```html
<!-- 旧 (Tailwind) -->
<div class="hidden md:block lg:hidden xl:block">

<!-- 新 (统一系统) -->
<div class="mobile-only desktop-down lg-desktop-up xl-desktop-down">
```

### 从媒体查询迁移
```scss
// 旧
@media (max-width: 767px) {
  .component {
    display: none;
  }
}

// 新
@include mobile-only {
  .component {
    display: none;
  }
}

// 或使用工具类
.component {
  @extend .mobile-only;
}
```

## 8. 故障排除

### 常见问题
1. **样式不生效**: 检查是否正确导入了 utilities.scss
2. **断点错误**: 确保使用正确的混合器名称
3. **优先级问题**: 使用 `!important` 或提高选择器特异性
4. **性能问题**: 检查是否有重复的媒体查询

### 调试技巧
```scss
// 临时可视化断点
@include mobile-only {
  body::before {
    content: "MOBILE";
    position: fixed;
    top: 0;
    left: 0;
    background: red;
    color: white;
    z-index: 9999;
  }
}

@include tablet-up {
  body::before {
    content: "TABLET+";
    background: blue;
  }
}
```

---

*本规范确保整个项目的响应式设计保持一致性和可维护性。所有新组件都应遵循此规范。*