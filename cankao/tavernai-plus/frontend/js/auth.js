// 认证管理模块
class AuthManager {
  constructor() {
    this.user = null
    this.isAuthenticated = false
    this.init()
  }

  init() {
    // 检查本地存储的token
    const token = localStorage.getItem('token')
    const userData = storage.get('user')

    if (token && userData) {
      this.setUser(userData, token)
    }

    this.setupModalEvents()
    this.checkAuthStatus()
  }

  // 设置用户信息
  setUser(userData, token) {
    this.user = userData
    this.isAuthenticated = true
    api.setToken(token)
    storage.set('user', userData)
    this.updateUI()
    eventBus.emit('auth:login', userData)
  }

  // 清除用户信息
  clearUser() {
    this.user = null
    this.isAuthenticated = false
    api.setToken(null)
    storage.remove('user')
    this.updateUI()
    eventBus.emit('auth:logout')
  }

  // 更新UI显示
  updateUI() {
    const usernameEl = document.getElementById('username')
    const userAvatar = document.querySelector('.user-avatar')

    if (this.isAuthenticated && this.user) {
      usernameEl.textContent = this.user.username || this.user.email
      // 可以设置用户头像
      if (userAvatar) {
        userAvatar.src = this.user.avatar || 'https://via.placeholder.com/32'
      }
    } else {
      usernameEl.textContent = '游客'
      if (userAvatar) {
        userAvatar.src = 'https://via.placeholder.com/32'
      }
      this.showLoginModal()
    }
  }

  // 设置模态框事件
  setupModalEvents() {
    // 登录模态框
    const loginModal = document.getElementById('loginModal')
    const registerModal = document.getElementById('registerModal')
    const loginForm = document.getElementById('loginForm')
    const registerForm = document.getElementById('registerForm')

    // 表单提交
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        await this.handleLogin()
      })
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        await this.handleRegister()
      })
    }

    // 模态框切换
    document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
      this.hideLoginModal()
      this.showRegisterModal()
    })

    document.getElementById('showLoginBtn')?.addEventListener('click', () => {
      this.hideRegisterModal()
      this.showLoginModal()
    })

    // 关闭模态框
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal')
        if (modal) {
          modal.classList.remove('active')
        }
      })
    })

    // 点击外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active')
        }
      })
    })

    // 用户菜单点击
    const userMenu = document.querySelector('.user-menu')
    if (userMenu) {
      userMenu.addEventListener('click', () => {
        if (!this.isAuthenticated) {
          this.showLoginModal()
        } else {
          this.showUserMenu()
        }
      })
    }
  }

  // 处理登录
  async handleLogin() {
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value

    if (!validateEmail(email)) {
      showNotification('请输入有效的邮箱地址', 'error')
      return
    }

    if (!password) {
      showNotification('请输入密码', 'error')
      return
    }

    try {
      showLoading()
      const response = await api.login(email, password)

      if (response.success) {
        this.setUser(response.user, response.accessToken)
        this.hideLoginModal()
        showNotification('登录成功', 'success')
      } else {
        showNotification(response.error || '登录失败', 'error')
      }
    } catch (error) {
      showNotification(error.message || '登录失败', 'error')
    } finally {
      hideLoading()
    }
  }

  // 处理注册
  async handleRegister() {
    const username = document.getElementById('registerUsername').value
    const email = document.getElementById('registerEmail').value
    const password = document.getElementById('registerPassword').value

    if (!username.trim()) {
      showNotification('请输入用户名', 'error')
      return
    }

    if (!validateEmail(email)) {
      showNotification('请输入有效的邮箱地址', 'error')
      return
    }

    if (!validatePassword(password)) {
      showNotification('密码至少8位，包含字母和数字', 'error')
      return
    }

    try {
      showLoading()
      const response = await api.register(username, email, password)

      if (response.success) {
        this.setUser(response.user, response.accessToken)
        this.hideRegisterModal()
        showNotification('注册成功', 'success')
      } else {
        showNotification(response.error || '注册失败', 'error')
      }
    } catch (error) {
      showNotification(error.message || '注册失败', 'error')
    } finally {
      hideLoading()
    }
  }

  // 登出
  async logout() {
    try {
      await api.logout()
      this.clearUser()
      showNotification('已退出登录', 'info')
    } catch (error) {
      console.error('登出失败:', error)
      this.clearUser() // 即使API调用失败也清除本地数据
    }
  }

  // 检查认证状态
  checkAuthStatus() {
    if (!this.isAuthenticated) {
      // 可以在这里决定是否立即显示登录界面
      // this.showLoginModal()
    }
  }

  // 显示/隐藏模态框
  showLoginModal() {
    document.getElementById('loginModal').classList.add('active')
  }

  hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active')
  }

  showRegisterModal() {
    document.getElementById('registerModal').classList.add('active')
  }

  hideRegisterModal() {
    document.getElementById('registerModal').classList.remove('active')
  }

  // 显示用户菜单
  showUserMenu() {
    // 创建用户菜单下拉框
    const existingMenu = document.querySelector('.user-dropdown')
    if (existingMenu) {
      existingMenu.remove()
    }

    const userMenu = document.createElement('div')
    userMenu.className = 'dropdown-menu user-dropdown'
    userMenu.style.position = 'absolute'
    userMenu.style.top = '100%'
    userMenu.style.right = '0'
    userMenu.innerHTML = `
      <div class="dropdown-item" data-action="profile">
        <i class="fas fa-user"></i> 个人资料
      </div>
      <div class="dropdown-item" data-action="settings">
        <i class="fas fa-cog"></i> 设置
      </div>
      <div class="dropdown-item" data-action="logout">
        <i class="fas fa-sign-out-alt"></i> 退出登录
      </div>
    `

    const userMenuContainer = document.querySelector('.user-menu')
    userMenuContainer.style.position = 'relative'
    userMenuContainer.appendChild(userMenu)

    // 显示菜单
    setTimeout(() => {
      userMenu.style.opacity = '1'
      userMenu.style.visibility = 'visible'
      userMenu.style.transform = 'translateY(0)'
    }, 10)

    // 菜单项点击事件
    userMenu.addEventListener('click', async (e) => {
      const action = e.target.closest('.dropdown-item')?.dataset.action

      if (action === 'logout') {
        await this.logout()
      } else if (action === 'profile') {
        // 显示个人资料页面
        showNotification('个人资料功能开发中', 'info')
      } else if (action === 'settings') {
        // 显示设置页面
        showNotification('设置功能开发中', 'info')
      }

      userMenu.remove()
    })

    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
      if (!userMenuContainer.contains(e.target)) {
        userMenu.remove()
        document.removeEventListener('click', closeMenu)
      }
    }

    setTimeout(() => {
      document.addEventListener('click', closeMenu)
    }, 100)
  }

  // 获取当前用户
  getCurrentUser() {
    return this.user
  }

  // 检查是否已认证
  isUserAuthenticated() {
    return this.isAuthenticated
  }

  // 获取用户权限
  getUserRole() {
    return this.user?.role || 'user'
  }

  // 检查用户是否有特定权限
  hasPermission(permission) {
    const userRole = this.getUserRole()

    // 权限映射
    const permissions = {
      admin: ['admin', 'workflow:manage', 'user:manage', 'system:config'],
      user: ['workflow:create', 'workflow:execute', 'character:create']
    }

    const userPermissions = permissions[userRole] || []
    return userPermissions.includes(permission)
  }

  // 受保护的操作
  requireAuth(callback) {
    if (this.isAuthenticated) {
      callback()
    } else {
      this.showLoginModal()
    }
  }

  // 需要特定权限的操作
  requirePermission(permission, callback) {
    this.requireAuth(() => {
      if (this.hasPermission(permission)) {
        callback()
      } else {
        showNotification('权限不足', 'error')
      }
    })
  }
}

// 全局认证管理器
const auth = new AuthManager()

// 导出到全局
window.auth = auth

// 为需要认证的操作添加保护
document.addEventListener('DOMContentLoaded', () => {
  // 需要认证的按钮
  const protectedButtons = [
    '#createWorkflowBtn',
    '#newWorkflowBtn',
    '#saveWorkflowBtn',
    '#runWorkflowBtn'
  ]

  protectedButtons.forEach(selector => {
    const button = document.querySelector(selector)
    if (button) {
      const originalClick = button.onclick
      button.onclick = function(e) {
        auth.requireAuth(() => {
          if (originalClick) originalClick.call(this, e)
        })
      }
    }
  })
})

// 监听认证状态变化
eventBus.on('auth:login', (user) => {
  console.log('用户已登录:', user.username)
  // 可以在这里刷新页面数据
  if (typeof refreshDashboard === 'function') {
    refreshDashboard()
  }
})

eventBus.on('auth:logout', () => {
  console.log('用户已登出')
  // 清理页面数据
  if (typeof clearDashboard === 'function') {
    clearDashboard()
  }
})