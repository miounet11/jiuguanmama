// 主应用入口 - 性能优化版本 Issue #36
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 性能监控
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'
import { performanceBudget, enableAutomaticBudgetCheck } from '@/utils/performanceBudget'

// UI组件库按需导入
import {
  ElButton,
  ElInput,
  ElMessage,
  ElNotification,
  ElLoading,
  ElDialog,
  ElCard,
  ElTag,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElAvatar,
  ElBadge,
  ElDivider,
  ElIcon,
  ElRow,
  ElCol,
  ElContainer,
  ElHeader,
  ElMain,
  ElAside,
  ElFooter
} from 'element-plus'

// 只导入需要的样式
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-input.css'
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-loading.css'
import 'element-plus/theme-chalk/el-dialog.css'
import 'element-plus/theme-chalk/el-card.css'
import 'element-plus/theme-chalk/el-tag.css'
import 'element-plus/theme-chalk/el-tooltip.css'
import 'element-plus/theme-chalk/el-dropdown.css'
import 'element-plus/theme-chalk/el-avatar.css'
import 'element-plus/theme-chalk/el-badge.css'
import 'element-plus/theme-chalk/el-divider.css'
import 'element-plus/theme-chalk/el-icon.css'
import 'element-plus/theme-chalk/el-row.css'
import 'element-plus/theme-chalk/el-col.css'
import 'element-plus/theme-chalk/el-container.css'

// 主样式文件
import '@/styles/main.scss'

// 图片懒加载指令
import { vLazy } from '@/composables/useImageOptimization'

// 设计系统组件
import { installDesignSystem } from '@/components/design-system'

// 性能监控初始化
const initPerformanceMonitoring = () => {
  // 启动性能监控
  const { startMonitoring } = usePerformanceMonitoring()
  startMonitoring()
  
  // 启动预算检查
  enableAutomaticBudgetCheck()
  
  // 记录应用启动时间
  const startTime = performance.mark('app-start')
  
  // 应用完全加载后记录
  document.addEventListener('DOMContentLoaded', () => {
    performance.mark('app-ready')
    const measure = performance.measure('app-load-time', 'app-start', 'app-ready')
    console.log(`应用加载时间: ${measure.duration.toFixed(2)}ms`)
    
    // 检查性能预算
    performanceBudget.checkBudget('Load Time', measure.duration)
  })
}

// 创建Vue应用
const app = createApp(App)

// 配置Pinia
const pinia = createPinia()
app.use(pinia)

// 配置路由
app.use(router)

// 注册Element Plus组件
const components = [
  ElButton,
  ElInput,
  ElDialog,
  ElCard,
  ElTag,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElAvatar,
  ElBadge,
  ElDivider,
  ElIcon,
  ElRow,
  ElCol,
  ElContainer,
  ElHeader,
  ElMain,
  ElAside,
  ElFooter
]

components.forEach(component => {
  app.component(component.name, component)
})

// 注册全局指令
app.directive('lazy', vLazy)

// 安装设计系统组件
app.use(installDesignSystem)

// 全局属性
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$loading = ElLoading.service

// 错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue应用错误:', err)
  console.error('错误信息:', info)
  
  // 发送错误到监控服务
  if (import.meta.env.PROD) {
    // 这里可以集成错误监控服务如Sentry
    console.log('发送错误报告到监控服务')
  }
}

// 性能警告处理
app.config.warnHandler = (msg, vm, trace) => {
  if (import.meta.env.DEV) {
    console.warn('Vue性能警告:', msg)
    console.warn('组件跟踪:', trace)
  }
}

// 初始化性能监控
if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_PERF_MONITORING) {
  initPerformanceMonitoring()
}

// 挂载应用
app.mount('#app')

// 开发环境调试信息
if (import.meta.env.DEV) {
  console.log('🚀 TavernAI Plus 开发环境启动')
  console.log('📦 Vue版本:', app.version)
  console.log('🔧 路由数量:', router.getRoutes().length)
  
  // 暴露调试工具到全局
  ;(window as any).__VUE_APP__ = app
  ;(window as any).__VUE_ROUTER__ = router
  ;(window as any).__PERFORMANCE_BUDGET__ = performanceBudget
}

// Service Worker注册（生产环境）- 临时禁用，等PWA配置完成后重新启用
// if (import.meta.env.PROD && 'serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js')
//     .then(registration => {
//       console.log('SW注册成功:', registration)
//     })
//     .catch(error => {
//       console.log('SW注册失败:', error)
//     })
// }

export default app
