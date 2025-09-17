// API 通信模块
class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:3008/api'
    this.token = localStorage.getItem('token')
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  // 获取默认请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  // 通用请求方法
  async request(method, url, data = null) {
    try {
      const config = {
        method,
        headers: this.getHeaders()
      }

      if (data) {
        config.body = JSON.stringify(data)
      }

      const response = await fetch(`${this.baseURL}${url}`, config)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  // GET 请求
  async get(url) {
    return this.request('GET', url)
  }

  // POST 请求
  async post(url, data) {
    return this.request('POST', url, data)
  }

  // PUT 请求
  async put(url, data) {
    return this.request('PUT', url, data)
  }

  // DELETE 请求
  async delete(url) {
    return this.request('DELETE', url)
  }

  // 认证相关API
  async login(email, password) {
    return this.post('/auth/login', { email, password })
  }

  async register(username, email, password) {
    return this.post('/auth/register', { username, email, password })
  }

  async logout() {
    this.setToken(null)
    return Promise.resolve()
  }

  // 工作流相关API
  async getWorkflows(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.get(`/workflows${queryString ? '?' + queryString : ''}`)
  }

  async getWorkflow(id) {
    return this.get(`/workflows/${id}`)
  }

  async createWorkflow(data) {
    return this.post('/workflows', data)
  }

  async updateWorkflow(id, data) {
    return this.put(`/workflows/${id}`, data)
  }

  async deleteWorkflow(id) {
    return this.delete(`/workflows/${id}`)
  }

  async executeWorkflow(id, input = {}) {
    return this.post(`/workflows/${id}/execute`, { input })
  }

  async getWorkflowSchedule(id) {
    return this.get(`/workflows/${id}/schedule`)
  }

  async triggerWorkflow(id) {
    return this.post(`/workflows/${id}/trigger`)
  }

  // 模板相关API
  async getWorkflowTemplates() {
    return this.get('/workflows/templates/list')
  }

  // AI功能相关API
  async testAI(message) {
    return this.post('/ai/test', { message })
  }

  // 角色相关API
  async getCharacters() {
    return this.get('/characters')
  }

  async createCharacter(data) {
    return this.post('/characters', data)
  }

  async summonCharacter(data) {
    return this.post('/characters/summon', data)
  }

  // 统计数据API
  async getDashboardStats() {
    try {
      const [workflows, templates] = await Promise.all([
        this.getWorkflows(),
        this.getWorkflowTemplates()
      ])

      const stats = {
        totalWorkflows: workflows.workflows?.length || 0,
        runningWorkflows: workflows.workflows?.filter(w => w.status === 'active').length || 0,
        completedWorkflows: workflows.workflows?.filter(w => w.status === 'completed').length || 0,
        totalCharacters: 0,
        templates: templates.templates || []
      }

      return { success: true, stats }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return { success: false, error: error.message }
    }
  }
}

// 全局API实例
const api = new APIClient()

// 工具函数
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active')
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active')
}

function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.className = `alert alert-${type}`
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
    <button class="alert-close">&times;</button>
  `

  // 添加到页面
  document.body.appendChild(notification)
  notification.style.position = 'fixed'
  notification.style.top = '20px'
  notification.style.right = '20px'
  notification.style.zIndex = '9999'
  notification.style.minWidth = '300px'

  // 自动关闭
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)

  // 点击关闭
  notification.querySelector('.alert-close').onclick = () => {
    notification.remove()
  }
}

// 格式化时间
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 防抖函数
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 深拷贝
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 验证邮箱格式
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// 验证密码强度
function validatePassword(password) {
  // 至少8位，包含字母和数字
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return re.test(password)
}

// 数据存储工具
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('存储数据失败:', error)
    }
  },

  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (error) {
      console.error('读取数据失败:', error)
      return defaultValue
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除数据失败:', error)
    }
  },

  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空数据失败:', error)
    }
  }
}

// 事件总线
class EventBus {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event, callback) {
    if (!this.events[event]) return

    if (callback) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    } else {
      delete this.events[event]
    }
  }

  emit(event, data) {
    if (!this.events[event]) return

    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('事件处理器错误:', error)
      }
    })
  }
}

// 全局事件总线实例
const eventBus = new EventBus()

// 导出到全局
window.api = api
window.showLoading = showLoading
window.hideLoading = hideLoading
window.showNotification = showNotification
window.formatDate = formatDate
window.formatFileSize = formatFileSize
window.debounce = debounce
window.throttle = throttle
window.generateId = generateId
window.deepClone = deepClone
window.validateEmail = validateEmail
window.validatePassword = validatePassword
window.storage = storage
window.eventBus = eventBus