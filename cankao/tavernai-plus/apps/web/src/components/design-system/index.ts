/**
 * Tavern Design System
 *
 * 基于Design Tokens v2.0的统一组件库
 * 支持深色主题、8px网格系统、完整的交互状态
 *
 * @author Claude
 * @version 2.0.0
 * @since 2025-09-23
 */

// 基础组件导入
import TavernButton from './TavernButton.vue'
import TavernInput from './TavernInput.vue'
import TavernCard from './TavernCard.vue'
import TavernBadge from './TavernBadge.vue'
import TavernIcon from './TavernIcon.vue'

// 基础组件导出
export { default as TavernButton } from './TavernButton.vue'
export { default as TavernInput } from './TavernInput.vue'
export { default as TavernCard } from './TavernCard.vue'
export { default as TavernBadge } from './TavernBadge.vue'
export { default as TavernIcon } from './TavernIcon.vue'

// 类型导出
export type { TavernButtonProps } from './TavernButton.vue'
export type { TavernInputProps } from './TavernInput.vue'
export type { TavernCardProps } from './TavernCard.vue'
export type { TavernBadgeProps } from './TavernBadge.vue'
export type { TavernIconProps } from './TavernIcon.vue'

/**
 * Design System 使用指南
 *
 * ## 快速开始
 *
 * ```vue
 * <script setup>
 * import { TavernButton, TavernCard, TavernInput } from '@/components/design-system'
 * </script>
 *
 * <template>
 *   <TavernCard title="角色卡片" hoverable>
 *     <TavernInput v-model="name" label="角色名称" />
 *     <TavernButton variant="primary" @click="save">保存</TavernButton>
 *   </TavernCard>
 * </template>
 * ```
 *
 * ## 设计原则
 *
 * 1. **一致性**: 所有组件使用统一的Design Tokens
 * 2. **可访问性**: 支持键盘导航、屏幕阅读器、对比度标准
 * 3. **响应式**: 基于8px网格的响应式设计
 * 4. **主题化**: 深色主题优先，支持主题切换
 * 5. **类型安全**: 完整的TypeScript类型定义
 *
 * ## 变体系统
 *
 * ### 颜色变体 (所有组件通用)
 * - `primary`: 主要操作 (Mystic Purple #a855f7)
 * - `secondary`: 次要操作 (Cyber Blue #3b82f6)
 * - `success`: 成功状态 (Neon Green #10b981)
 * - `warning`: 警告状态 (Sunset Orange #f59e0b)
 * - `error`: 错误状态 (Ruby Red #ef4444)
 * - `info`: 信息状态 (Sky Blue #06b6d4)
 * - `neutral`: 中性状态 (深空灰度)
 *
 * ### 尺寸变体 (所有组件通用)
 * - `xs`: 12-16px (紧凑场景)
 * - `sm`: 20-32px (列表项)
 * - `md`: 24-44px (默认尺寸)
 * - `lg`: 32-48px (重要操作)
 * - `xl`: 40-56px (突出显示)
 *
 * ## 最佳实践
 *
 * ### Button组件
 * ```vue
 * <!-- 主要操作 -->
 * <TavernButton variant="primary" size="md">
 *   创建角色
 * </TavernButton>
 *
 * <!-- 带图标的按钮 -->
 * <TavernButton variant="secondary" icon-left="plus">
 *   添加
 * </TavernButton>
 *
 * <!-- 加载状态 -->
 * <TavernButton :loading="saving" @click="handleSave">
 *   保存
 * </TavernButton>
 * ```
 *
 * ### Input组件
 * ```vue
 * <!-- 基础输入 -->
 * <TavernInput
 *   v-model="value"
 *   label="角色名称"
 *   placeholder="请输入角色名称"
 *   required
 * />
 *
 * <!-- 带验证的输入 -->
 * <TavernInput
 *   v-model="email"
 *   type="email"
 *   label="邮箱地址"
 *   :error-message="emailError"
 *   icon-left="mail"
 * />
 *
 * <!-- 文本域 -->
 * <TavernInput
 *   v-model="description"
 *   type="textarea"
 *   label="角色描述"
 *   :maxlength="500"
 *   show-char-count
 *   auto-resize
 * />
 * ```
 *
 * ### Card组件
 * ```vue
 * <!-- 角色卡片 -->
 * <TavernCard
 *   title="角色名称"
 *   subtitle="创建者"
 *   hoverable
 *   clickable
 *   @click="viewCharacter"
 * >
 *   <template #media>
 *     <img src="avatar.jpg" alt="角色头像" />
 *   </template>
 *
 *   <p>角色描述内容...</p>
 *
 *   <template #footer>
 *     <div class="flex justify-between">
 *       <TavernBadge variant="success">活跃</TavernBadge>
 *       <span>1.2k 对话</span>
 *     </div>
 *   </template>
 * </TavernCard>
 * ```
 *
 * ### Badge组件
 * ```vue
 * <!-- 状态徽章 -->
 * <TavernBadge variant="success">在线</TavernBadge>
 *
 * <!-- 数字徽章 -->
 * <TavernBadge variant="error" :count="5" />
 *
 * <!-- 可关闭徽章 -->
 * <TavernBadge variant="info" closable @close="removeTag">
 *   标签名称
 * </TavernBadge>
 * ```
 *
 * ## 自定义主题
 *
 * 所有组件都基于CSS自定义属性，可以通过修改Design Tokens来自定义主题：
 *
 * ```scss
 * :root {
 *   --tavern-primary: #your-color;
 *   --tavern-primary-text: #your-text-color;
 *   --card-radius: 12px;
 *   --button-radius: 8px;
 * }
 * ```
 */

// 常用组合导出
export const DesignSystemComponents = {
  TavernButton,
  TavernInput,
  TavernCard,
  TavernBadge,
  TavernIcon
} as const

// 版本信息
export const DESIGN_SYSTEM_VERSION = '2.0.0'
export const DESIGN_TOKENS_VERSION = '2.0.0'

/**
 * 安装插件 (可选)
 *
 * ```ts
 * import { installDesignSystem } from '@/components/design-system'
 *
 * app.use(installDesignSystem)
 * ```
 */
export function installDesignSystem(app: any) {
  Object.entries(DesignSystemComponents).forEach(([name, component]) => {
    app.component(name, component)
  })

  // 可以在这里添加全局配置
  app.config.globalProperties.$designSystem = {
    version: DESIGN_SYSTEM_VERSION,
    tokensVersion: DESIGN_TOKENS_VERSION
  }

  return app
}