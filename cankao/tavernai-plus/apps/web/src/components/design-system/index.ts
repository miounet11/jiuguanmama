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
import TavernSelect from './TavernSelect.vue'
import TavernTabs from './TavernTabs.vue'
import TavernSwitch from './TavernSwitch.vue'
import TavernEmpty from './TavernEmpty.vue'
import TavernLoading from './TavernLoading.vue'
import TavernTable from './TavernTable.vue'
import TavernSlider from './TavernSlider.vue'
import TavernTooltip from './TavernTooltip.vue'
import TavernModal from './TavernModal.vue'
import TavernForm from './TavernForm.vue'

// 基础组件导出
export { default as TavernButton } from './TavernButton.vue'
export { default as TavernInput } from './TavernInput.vue'
export { default as TavernCard } from './TavernCard.vue'
export { default as TavernBadge } from './TavernBadge.vue'
export { default as TavernIcon } from './TavernIcon.vue'
export { default as TavernSelect } from './TavernSelect.vue'
export { default as TavernTabs } from './TavernTabs.vue'
export { default as TavernSwitch } from './TavernSwitch.vue'
export { default as TavernEmpty } from './TavernEmpty.vue'
export { default as TavernLoading } from './TavernLoading.vue'
export { default as TavernTable } from './TavernTable.vue'
export { default as TavernSlider } from './TavernSlider.vue'
export { default as TavernTooltip } from './TavernTooltip.vue'
export { default as TavernModal } from './TavernModal.vue'
export { default as TavernForm } from './TavernForm.vue'

// 类型导出
export type { TavernButtonProps } from './TavernButton.vue'
export type { TavernInputProps } from './TavernInput.vue'
export type { TavernCardProps } from './TavernCard.vue'
export type { TavernBadgeProps } from './TavernBadge.vue'
export type { TavernIconProps } from './TavernIcon.vue'
export type { TavernSelectProps } from './TavernSelect.vue'
export type { TavernTabsProps } from './TavernTabs.vue'
export type { TavernSwitchProps } from './TavernSwitch.vue'
export type { TavernEmptyProps } from './TavernEmpty.vue'
export type { TavernLoadingProps } from './TavernLoading.vue'
export type { TavernTableProps } from './TavernTable.vue'
export type { TavernSliderProps } from './TavernSlider.vue'
export type { TavernTooltipProps } from './TavernTooltip.vue'
export type { TavernModalProps } from './TavernModal.vue'
export type { TavernFormProps } from './TavernForm.vue'

/**
 * Design System 使用指南
 *
 * ## 快速开始
 *
 * ```vue
 * <script setup>
 * import { TavernButton, TavernCard, TavernInput, TavernSelect, TavernSwitch, TavernEmpty, TavernLoading } from '@/components/design-system'
 * </script>
 *
 * <template>
*   <TavernCard title="角色卡片" hoverable>
*     <TavernInput v-model="name" label="角色名称" />
*     <TavernSelect v-model="category" label="角色类型" placeholder="选择类型">
*       <el-option label="武侠仙侠" value="fantasy" />
*       <el-option label="现代都市" value="modern" />
*     </TavernSelect>
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
 * ### Select组件
 * ```vue
 * <!-- 基础选择器 -->
 * <TavernSelect
 *   v-model="selectedValue"
 *   placeholder="请选择角色类型"
 *   clearable
 * >
 *   <el-option label="武侠仙侠" value="fantasy" />
 *   <el-option label="现代都市" value="modern" />
 *   <el-option label="奇幻冒险" value="adventure" />
 * </TavernSelect>
 *
 * <!-- 多选选择器 -->
 * <TavernSelect
 *   v-model="selectedTags"
 *   placeholder="选择标签"
 *   multiple
 *   collapse-tags
 *   filterable
 * >
 *   <el-option
 *     v-for="tag in tagOptions"
 *     :key="tag.value"
 *     :label="tag.label"
 *     :value="tag.value"
 *   />
 * </TavernSelect>
 *
 * <!-- 带验证的选择器 -->
 * <TavernSelect
 *   v-model="model"
 *   label="AI模型"
 *   placeholder="选择对话模型"
 *   :error="hasError"
 *   error-message="请选择有效的模型"
 *   help-message="选择不同的模型会影响对话质量"
 * >
 *   <el-option label="GPT-4" value="gpt-4" />
 *   <el-option label="Claude 3" value="claude-3" />
 *   <el-option label="DeepSeek V3" value="deepseek-v3" />
* </TavernSelect>
* ```
 *
 * ### Switch组件
 * ```vue
 * <!-- 基础开关 -->
 * <TavernSwitch v-model="enabled" label="启用功能" />
 *
 * <!-- 带文本的开关 -->
 * <TavernSwitch
 *   v-model="notifications"
 *   active-text="开"
 *   inactive-text="关"
 *   help-message="开启后将接收消息通知"
 * />
 *
 * <!-- 加载状态 -->
 * <TavernSwitch v-model="autoSave" :loading="saving" label="自动保存" />
 * ```
 *
 * ### Empty组件
 * ```vue
 * <!-- 基础空状态 -->
 * <TavernEmpty description="暂无角色数据">
 *   <TavernButton @click="createCharacter">创建角色</TavernButton>
 * </TavernEmpty>
 *
 * <!-- 可点击的空状态 -->
 * <TavernEmpty
 *   description="点击添加第一个角色"
 *   clickable
 *   size="lg"
 *   @click="showCreateDialog"
 * >
 *   <TavernIcon name="plus" size="lg" />
 * </TavernEmpty>
 * ```
 *
 * ### Loading组件
 * ```vue
 * <!-- 内联加载 -->
 * <TavernLoading text="加载中..." />
 *
 * <!-- 带进度的加载 -->
 * <TavernLoading
 *   text="生成角色中..."
 *   :show-progress="true"
 *   :progress="75"
 * />
 *
 * <!-- 全屏加载 -->
 * <TavernLoading
 *   text="初始化中..."
 *   fullscreen
 *   background="rgba(0, 0, 0, 0.9)"
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
  TavernIcon,
  TavernSelect,
  TavernTabs,
  TavernSwitch,
  TavernEmpty,
  TavernLoading,
  TavernTable,
  TavernSlider,
  TavernTooltip,
  TavernModal,
  TavernForm
} as const

// 版本信息
export const DESIGN_SYSTEM_VERSION = '4.0.0'
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