import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type Theme = 'dark' | 'light' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'auto'
  )
  
  const systemPrefersDark = ref(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 计算属性
  const isDark = computed(() => {
    if (theme.value === 'auto') {
      return systemPrefersDark.value
    }
    return theme.value === 'dark'
  })

  const currentTheme = computed(() => isDark.value ? 'dark' : 'light')

  // 方法
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    updateDocumentClass()
  }

  const toggleTheme = () => {
    if (theme.value === 'dark') {
      setTheme('light')
    } else if (theme.value === 'light') {
      setTheme('auto')
    } else {
      setTheme('dark')
    }
  }

  const updateDocumentClass = () => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(currentTheme.value)
    
    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDark.value ? '#0F0F23' : '#FFFFFF'
      )
    }
  }

  const initTheme = () => {
    updateDocumentClass()
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
      if (theme.value === 'auto') {
        updateDocumentClass()
      }
    })
  }

  // 监听主题变化
  watch(
    () => isDark.value,
    () => {
      updateDocumentClass()
    }
  )

  return {
    theme,
    isDark,
    currentTheme,
    setTheme,
    toggleTheme,
    initTheme
  }
})