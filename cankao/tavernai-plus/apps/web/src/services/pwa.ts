// =====================================
// PWA 服务管理器
// =====================================

import { ElNotification } from 'element-plus'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isInstalled = false
  private isStandalone = false

  constructor() {
    this.init()
  }

  private init() {
    // 检查是否为独立应用模式
    this.isStandalone = this.checkStandalone()

    // 监听安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.showInstallPromotion()
    })

    // 监听应用安装事件
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.hideInstallPromotion()
      ElNotification({
        title: '安装成功',
        message: 'TavernAI Plus 已成功安装到您的设备',
        type: 'success',
        duration: 3000
      })
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      ElNotification({
        title: '网络已连接',
        message: '您已重新连接到互联网',
        type: 'success',
        duration: 2000
      })
    })

    window.addEventListener('offline', () => {
      ElNotification({
        title: '网络已断开',
        message: '您当前处于离线状态，可以继续使用已缓存的功能',
        type: 'warning',
        duration: 4000
      })
    })
  }

  // 检查是否为独立应用模式
  private checkStandalone(): boolean {
    // PWA 独立模式检查
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }

    // iOS Safari 独立模式检查
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      return true
    }

    // Android Chrome 独立模式检查
    if (document.referrer.includes('android-app://')) {
      return true
    }

    return false
  }

  // 显示安装推广
  private showInstallPromotion() {
    if (this.isStandalone || this.isInstalled) return

    // 延迟显示，避免打断用户初始体验
    setTimeout(() => {
      ElNotification({
        title: '安装应用',
        message: '将 TavernAI Plus 安装到您的设备以获得更好的体验',
        type: 'info',
        duration: 0, // 持续显示
        showClose: true,
        position: 'bottom-right',
        customClass: 'pwa-install-notification',
        dangerouslyUseHTMLString: true,
        message: `
          <div class="pwa-install-content">
            <p>将 TavernAI Plus 安装到您的设备以获得更好的体验</p>
            <div class="pwa-install-actions">
              <button class="pwa-install-btn" onclick="pwaService.promptInstall()">立即安装</button>
              <button class="pwa-install-dismiss" onclick="pwaService.dismissInstall()">暂不安装</button>
            </div>
          </div>
        `
      })
    }, 30000) // 30秒后显示
  }

  // 隐藏安装推广
  private hideInstallPromotion() {
    // 隐藏所有安装相关的通知
    document.querySelectorAll('.pwa-install-notification').forEach(el => {
      el.remove()
    })
  }

  // 触发安装提示
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      this.showInstallInstructions()
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null
        return true
      } else {
        this.deferredPrompt = null
        return false
      }
    } catch (error) {
      console.error('安装提示失败:', error)
      this.showInstallInstructions()
      return false
    }
  }

  // 显示手动安装说明
  private showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    let instructions = ''

    if (isIOS) {
      instructions = `
        <div class="install-instructions">
          <h4>在 iOS 设备上安装：</h4>
          <ol>
            <li>点击底部的分享按钮 <span class="icon">⬆️</span></li>
            <li>向下滚动找到"添加到主屏幕"</li>
            <li>点击"添加"确认安装</li>
          </ol>
        </div>
      `
    } else if (isAndroid) {
      instructions = `
        <div class="install-instructions">
          <h4>在 Android 设备上安装：</h4>
          <ol>
            <li>点击浏览器菜单 <span class="icon">⋮</span></li>
            <li>选择"添加到主屏幕"或"安装应用"</li>
            <li>点击"安装"确认</li>
          </ol>
        </div>
      `
    } else {
      instructions = `
        <div class="install-instructions">
          <h4>在桌面浏览器中安装：</h4>
          <ol>
            <li>查找地址栏中的安装图标</li>
            <li>或使用浏览器菜单中的"安装"选项</li>
          </ol>
        </div>
      `
    }

    ElNotification({
      title: '安装应用',
      message: instructions,
      type: 'info',
      duration: 10000,
      dangerouslyUseHTMLString: true,
      customClass: 'install-instructions-notification'
    })
  }

  // 取消安装
  public dismissInstall() {
    this.hideInstallPromotion()
    // 设置一个标记，短期内不再显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // 检查是否可以安装
  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isStandalone && !this.isInstalled
  }

  // 检查是否为独立模式
  public isInStandaloneMode(): boolean {
    return this.isStandalone
  }

  // 检查网络状态
  public isOnline(): boolean {
    return navigator.onLine
  }

  // 获取网络信息（如果支持）
  public getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  // 检查是否应该显示离线内容
  public shouldShowOfflineContent(): boolean {
    if (!this.isOnline()) return true

    // 检查网络质量
    const networkInfo = this.getNetworkInfo()
    if (networkInfo && networkInfo.effectiveType === 'slow-2g') {
      return true
    }

    return false
  }

  // 预缓存关键资源
  public async precacheResources(resources: string[]) {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('tavern-precache-v1')
        await cache.addAll(resources)
        console.log('资源预缓存完成')
      } catch (error) {
        console.error('预缓存失败:', error)
      }
    }
  }

  // 清理旧缓存
  public async clearOldCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const oldCacheNames = cacheNames.filter(name =>
          name.startsWith('tavern-') && !name.includes('-v1')
        )

        await Promise.all(
          oldCacheNames.map(cacheName => caches.delete(cacheName))
        )

        console.log('旧缓存清理完成')
      } catch (error) {
        console.error('缓存清理失败:', error)
      }
    }
  }

  // 获取缓存使用情况
  public async getCacheUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usageDetails: estimate.usageDetails
        }
      } catch (error) {
        console.error('获取存储信息失败:', error)
      }
    }
    return null
  }

  // 处理推送通知权限
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission
    }
    return 'denied'
  }

  // 显示本地通知
  public showNotification(title: string, options: NotificationOptions = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      })
    }
  }

  // 检查更新
  public async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      } catch (error) {
        console.error('检查更新失败:', error)
      }
    }
  }
}

// 创建全局实例
export const pwaService = new PWAService()

// 将服务暴露到全局（用于 HTML 中的内联事件）
;(window as any).pwaService = pwaService

export default pwaService