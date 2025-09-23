import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './styles/main.scss'
import './styles/fix-layout.css'

import App from './App.vue'
import router from './router'

// 性能监控初始化
import { initWebVitalsMonitoring } from './utils/performance/webVitals'

// PWA 服务初始化
import './services/pwa'

const app = createApp(App)
const pinia = createPinia()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 启动性能监控
if (typeof window !== 'undefined') {
  initWebVitalsMonitoring()
  
  // 开发环境性能提示
  if (import.meta.env.DEV) {
    console.log('🎯 TavernAI Plus 性能优化版本')
    console.log('📊 按 Ctrl+Shift+P 打开性能监控面板')
    console.log('⚡ 懒加载、缓存、Web Vitals 监控已启用')
  }
}

app.mount('#app')
