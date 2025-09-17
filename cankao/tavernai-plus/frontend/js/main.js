// 主应用程序逻辑
class TavernAIApp {
  constructor() {
    this.currentPage = 'dashboard'
    this.workflows = []
    this.templates = []
    this.stats = {
      totalWorkflows: 0,
      runningWorkflows: 0,
      completedWorkflows: 0,
      totalCharacters: 0
    }

    this.init()
  }

  async init() {
    this.setupNavigation()
    this.setupQuickActions()
    this.setupWorkflowManagement()
    this.setupAIAssistant()
    this.setupEventListeners()

    // 初始化页面
    await this.loadDashboard()

    // 启动定时任务
    this.startPeriodicUpdates()
  }

  // 设置导航
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link')
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const pageId = link.getAttribute('href').replace('#', '')
        this.navigateTo(pageId)
      })
    })

    // 侧边栏导航
    document.getElementById('quickCreateBtn')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.showQuickCreateModal()
    })

    document.getElementById('aiAssistantBtn')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.showAIAssistant()
    })

    document.getElementById('templatesBtn')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.navigateTo('templates')
    })
  }

  // 页面导航
  navigateTo(pageId) {
    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === `#${pageId}`) {
        link.classList.add('active')
      } else {
        link.classList.remove('active')
      }
    })

    // 显示对应页面
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active')
    })

    const targetPage = document.getElementById(`${pageId}Page`)
    if (targetPage) {
      targetPage.classList.add('active')
      this.currentPage = pageId

      // 页面特定的初始化
      switch (pageId) {
        case 'dashboard':
          this.loadDashboard()
          break
        case 'workflows':
          this.loadWorkflows()
          break
        case 'characters':
          this.loadCharacters()
          break
        case 'templates':
          this.loadTemplates()
          break
        case 'analytics':
          this.loadAnalytics()
          break
      }
    }
  }

  // 设置快速操作
  setupQuickActions() {
    const actionCards = document.querySelectorAll('.action-card')
    actionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action
        this.handleQuickAction(action)
      })
    })
  }

  // 处理快速操作
  handleQuickAction(action) {
    auth.requireAuth(() => {
      switch (action) {
        case 'create-ai-workflow':
          this.createAIWorkflow()
          break
        case 'create-character-workflow':
          this.createCharacterWorkflow()
          break
        case 'create-data-workflow':
          this.createDataWorkflow()
          break
        case 'import-template':
          this.showTemplateSelector()
          break
      }
    })
  }

  // 创建AI工作流
  createAIWorkflow() {
    workflowEditor.createNewWorkflow()

    // 添加默认AI节点
    setTimeout(() => {
      workflowEditor.addNodeToCanvas('start', { x: 100, y: 150 })
      workflowEditor.addNodeToCanvas('ai_chat', { x: 300, y: 150 })
      workflowEditor.addNodeToCanvas('end', { x: 500, y: 150 })
    }, 500)

    showNotification('AI工作流模板已创建', 'success')
  }

  // 创建角色工作流
  createCharacterWorkflow() {
    workflowEditor.createNewWorkflow()

    // 添加默认角色召唤节点
    setTimeout(() => {
      workflowEditor.addNodeToCanvas('start', { x: 100, y: 150 })
      workflowEditor.addNodeToCanvas('character_summon', { x: 300, y: 150 })
      workflowEditor.addNodeToCanvas('ai_chat', { x: 500, y: 150 })
      workflowEditor.addNodeToCanvas('end', { x: 700, y: 150 })
    }, 500)

    showNotification('角色召唤工作流模板已创建', 'success')
  }

  // 创建数据工作流
  createDataWorkflow() {
    workflowEditor.createNewWorkflow()

    // 添加默认数据处理节点
    setTimeout(() => {
      workflowEditor.addNodeToCanvas('start', { x: 100, y: 150 })
      workflowEditor.addNodeToCanvas('http_request', { x: 300, y: 150 })
      workflowEditor.addNodeToCanvas('condition', { x: 500, y: 150 })
      workflowEditor.addNodeToCanvas('end', { x: 700, y: 150 })
    }, 500)

    showNotification('数据处理工作流模板已创建', 'success')
  }

  // 设置工作流管理
  setupWorkflowManagement() {
    // 新建工作流按钮
    document.getElementById('createWorkflowBtn')?.addEventListener('click', () => {
      auth.requireAuth(() => {
        workflowEditor.createNewWorkflow()
      })
    })

    document.getElementById('newWorkflowBtn')?.addEventListener('click', () => {
      auth.requireAuth(() => {
        workflowEditor.createNewWorkflow()
      })
    })

    // 导入工作流
    document.getElementById('importWorkflowBtn')?.addEventListener('click', () => {
      auth.requireAuth(() => {
        this.showImportDialog()
      })
    })

    // 搜索和筛选
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        this.filterWorkflows()
      }, 300))
    }

    const statusFilter = document.getElementById('statusFilter')
    const typeFilter = document.getElementById('typeFilter')
    if (statusFilter) statusFilter.addEventListener('change', () => this.filterWorkflows())
    if (typeFilter) typeFilter.addEventListener('change', () => this.filterWorkflows())
  }

  // 设置AI助手
  setupAIAssistant() {
    const aiAssistantModal = document.getElementById('aiAssistantModal')
    const aiChatInput = document.getElementById('aiChatInput')
    const sendBtn = document.getElementById('sendAiMessageBtn')

    const sendMessage = async () => {
      const message = aiChatInput.value.trim()
      if (!message) return

      this.addAIMessage(message, 'user')
      aiChatInput.value = ''

      try {
        const response = await this.processAIMessage(message)
        this.addAIMessage(response, 'ai')
      } catch (error) {
        this.addAIMessage('抱歉，AI助手暂时不可用', 'ai')
      }
    }

    sendBtn?.addEventListener('click', sendMessage)
    aiChatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    })
  }

  // 显示AI助手
  showAIAssistant() {
    document.getElementById('aiAssistantModal').classList.add('active')

    // 初始化聊天
    if (document.getElementById('aiChatMessages').children.length === 0) {
      this.addAIMessage('您好！我是TavernAI Plus的智能助手。我可以帮您创建工作流、回答问题或提供建议。请告诉我您需要什么帮助？', 'ai')
    }
  }

  // 添加AI消息
  addAIMessage(message, sender) {
    const messagesContainer = document.getElementById('aiChatMessages')
    const messageDiv = document.createElement('div')
    messageDiv.className = `chat-message ${sender}`
    messageDiv.textContent = message

    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  // 处理AI消息
  async processAIMessage(message) {
    // 分析用户意图
    const intent = this.analyzeIntent(message)

    switch (intent.type) {
      case 'create-workflow':
        return this.handleWorkflowCreationRequest(intent)
      case 'help':
        return this.getHelpResponse(intent)
      case 'general':
      default:
        return await this.getAIResponse(message)
    }
  }

  // 分析用户意图
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('创建') || lowerMessage.includes('新建') || lowerMessage.includes('工作流')) {
      return { type: 'create-workflow', message }
    }

    if (lowerMessage.includes('帮助') || lowerMessage.includes('怎么') || lowerMessage.includes('如何')) {
      return { type: 'help', message }
    }

    return { type: 'general', message }
  }

  // 处理工作流创建请求
  handleWorkflowCreationRequest(intent) {
    const message = intent.message.toLowerCase()

    if (message.includes('ai') || message.includes('人工智能')) {
      setTimeout(() => this.createAIWorkflow(), 1000)
      return '好的，我为您创建一个AI工作流模板。正在打开编辑器...'
    }

    if (message.includes('角色') || message.includes('召唤')) {
      setTimeout(() => this.createCharacterWorkflow(), 1000)
      return '好的，我为您创建一个角色召唤工作流模板。正在打开编辑器...'
    }

    if (message.includes('数据') || message.includes('处理')) {
      setTimeout(() => this.createDataWorkflow(), 1000)
      return '好的，我为您创建一个数据处理工作流模板。正在打开编辑器...'
    }

    return '我可以为您创建以下类型的工作流：\\n1. AI对话工作流\\n2. 角色召唤工作流\\n3. 数据处理工作流\\n\\n请告诉我您想创建哪种类型？'
  }

  // 获取帮助回应
  getHelpResponse(intent) {
    return `我可以帮您：

1. 🔧 创建各种类型的工作流
2. 📊 查看统计数据和分析
3. 👥 管理角色召唤
4. 📋 使用工作流模板
5. 🤖 AI功能使用指导

您可以直接说"创建AI工作流"或"帮我做数据分析"等，我会为您提供相应的帮助。`
  }

  // 获取AI回应
  async getAIResponse(message) {
    try {
      const response = await api.testAI(message)
      if (response.success) {
        return response.message
      } else {
        return '抱歉，我现在无法处理这个请求。请稍后再试。'
      }
    } catch (error) {
      return '抱歉，AI服务暂时不可用。'
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 工作流事件
    eventBus.on('workflow:saved', () => {
      this.loadWorkflows()
      this.loadDashboard()
    })

    eventBus.on('workflow:editor:closed', () => {
      this.navigateTo('workflows')
    })

    // 认证事件
    eventBus.on('auth:login', () => {
      this.refreshAllData()
    })

    eventBus.on('auth:logout', () => {
      this.clearAllData()
    })
  }

  // 加载仪表板
  async loadDashboard() {
    try {
      showLoading()
      const response = await api.getDashboardStats()

      if (response.success) {
        this.stats = response.stats
        this.updateStatsCards()
        this.loadRecentWorkflows()
      }
    } catch (error) {
      console.error('加载仪表板失败:', error)
    } finally {
      hideLoading()
    }
  }

  // 更新统计卡片
  updateStatsCards() {
    document.getElementById('totalWorkflows').textContent = this.stats.totalWorkflows
    document.getElementById('runningWorkflows').textContent = this.stats.runningWorkflows
    document.getElementById('completedWorkflows').textContent = this.stats.completedWorkflows
    document.getElementById('totalCharacters').textContent = this.stats.totalCharacters
  }

  // 加载最近工作流
  loadRecentWorkflows() {
    const recentContainer = document.getElementById('recentWorkflows')
    if (!recentContainer) return

    // 获取最近的工作流（最多5个）
    const recentWorkflows = this.workflows.slice(0, 5)

    if (recentWorkflows.length === 0) {
      recentContainer.innerHTML = '<li class="empty-item">暂无工作流</li>'
      return
    }

    recentContainer.innerHTML = recentWorkflows.map(workflow => `
      <li>
        <a href="#" data-workflow-id="${workflow.id}" class="recent-workflow-link">
          <i class="fas fa-project-diagram"></i>
          ${workflow.name}
        </a>
      </li>
    `).join('')

    // 绑定点击事件
    recentContainer.querySelectorAll('.recent-workflow-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const workflowId = link.dataset.workflowId
        workflowEditor.loadWorkflow(workflowId)
      })
    })
  }

  // 加载工作流列表
  async loadWorkflows() {
    try {
      showLoading()
      const response = await api.getWorkflows()

      if (response.success) {
        this.workflows = response.workflows || []
        this.renderWorkflowGrid()
      }
    } catch (error) {
      console.error('加载工作流失败:', error)
      showNotification('加载工作流失败', 'error')
    } finally {
      hideLoading()
    }
  }

  // 渲染工作流网格
  renderWorkflowGrid() {
    const grid = document.getElementById('workflowsGrid')
    if (!grid) return

    if (this.workflows.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-project-diagram"></i>
          <h3>暂无工作流</h3>
          <p>点击"新建工作流"开始创建您的第一个智能工作流</p>
          <button class="btn btn-primary" onclick="workflowEditor.createNewWorkflow()">
            <i class="fas fa-plus"></i> 创建工作流
          </button>
        </div>
      `
      return
    }

    grid.innerHTML = this.workflows.map(workflow => this.renderWorkflowCard(workflow)).join('')

    // 绑定工作流卡片事件
    this.bindWorkflowCardEvents()
  }

  // 渲染工作流卡片
  renderWorkflowCard(workflow) {
    const status = workflow.isActive ? 'active' : 'paused'
    const statusText = workflow.isActive ? '活跃' : '暂停'

    return `
      <div class="workflow-card" data-workflow-id="${workflow.id}">
        <div class="workflow-header">
          <div>
            <div class="workflow-title">${workflow.name}</div>
            <span class="workflow-status status-${status}">${statusText}</span>
          </div>
        </div>
        <div class="workflow-description">
          ${workflow.description || '无描述'}
        </div>
        <div class="workflow-stats">
          <span><i class="fas fa-calendar"></i> ${formatDate(workflow.createdAt)}</span>
          <span><i class="fas fa-play"></i> ${workflow.executionCount || 0} 次执行</span>
        </div>
        <div class="workflow-actions" style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="btn btn-sm btn-primary edit-workflow">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="btn btn-sm btn-success run-workflow">
            <i class="fas fa-play"></i> 运行
          </button>
          <button class="btn btn-sm btn-secondary clone-workflow">
            <i class="fas fa-copy"></i> 克隆
          </button>
        </div>
      </div>
    `
  }

  // 绑定工作流卡片事件
  bindWorkflowCardEvents() {
    // 编辑工作流
    document.querySelectorAll('.edit-workflow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const workflowId = btn.closest('.workflow-card').dataset.workflowId
        workflowEditor.loadWorkflow(workflowId)
      })
    })

    // 运行工作流
    document.querySelectorAll('.run-workflow').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const workflowId = btn.closest('.workflow-card').dataset.workflowId

        try {
          const response = await api.executeWorkflow(workflowId)
          if (response.success) {
            showNotification('工作流开始执行', 'success')
          }
        } catch (error) {
          showNotification('执行失败', 'error')
        }
      })
    })

    // 克隆工作流
    document.querySelectorAll('.clone-workflow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const workflowId = btn.closest('.workflow-card').dataset.workflowId
        this.cloneWorkflow(workflowId)
      })
    })
  }

  // 克隆工作流
  async cloneWorkflow(workflowId) {
    try {
      const response = await api.getWorkflow(workflowId)
      if (response.success) {
        const clonedWorkflow = {
          ...response.workflow,
          id: null,
          name: response.workflow.name + ' (克隆)',
          createdAt: new Date().toISOString()
        }

        workflowEditor.currentWorkflow = clonedWorkflow
        workflowEditor.loadWorkflowToCanvas(clonedWorkflow)
        workflowEditor.showEditor()
        workflowEditor.updateEditorTitle()
        workflowEditor.markDirty()

        showNotification('工作流已克隆', 'success')
      }
    } catch (error) {
      showNotification('克隆失败', 'error')
    }
  }

  // 过滤工作流
  filterWorkflows() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || ''
    const statusFilter = document.getElementById('statusFilter')?.value || ''
    const typeFilter = document.getElementById('typeFilter')?.value || ''

    let filteredWorkflows = this.workflows

    // 搜索过滤
    if (searchTerm) {
      filteredWorkflows = filteredWorkflows.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm) ||
        (workflow.description && workflow.description.toLowerCase().includes(searchTerm))
      )
    }

    // 状态过滤
    if (statusFilter) {
      filteredWorkflows = filteredWorkflows.filter(workflow => {
        switch (statusFilter) {
          case 'active': return workflow.isActive
          case 'paused': return !workflow.isActive
          case 'completed': return workflow.status === 'completed'
          default: return true
        }
      })
    }

    // 临时使用过滤后的工作流列表渲染
    const originalWorkflows = this.workflows
    this.workflows = filteredWorkflows
    this.renderWorkflowGrid()
    this.workflows = originalWorkflows
  }

  // 加载角色
  loadCharacters() {
    showNotification('角色管理功能开发中', 'info')
  }

  // 加载模板
  async loadTemplates() {
    try {
      const response = await api.getWorkflowTemplates()
      if (response.success) {
        this.templates = response.templates || []
        showNotification(`加载了 ${this.templates.length} 个模板`, 'success')
      }
    } catch (error) {
      showNotification('加载模板失败', 'error')
    }
  }

  // 加载分析
  loadAnalytics() {
    showNotification('分析功能开发中', 'info')
  }

  // 显示导入对话框
  showImportDialog() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        workflowEditor.importWorkflow(file)
      }
    }
    input.click()
  }

  // 显示快速创建模态框
  showQuickCreateModal() {
    // 可以创建一个快速创建的模态框
    showNotification('快速创建功能开发中', 'info')
  }

  // 显示模板选择器
  showTemplateSelector() {
    // 可以创建一个模板选择器模态框
    showNotification('模板选择器开发中', 'info')
  }

  // 启动定时更新
  startPeriodicUpdates() {
    // 每30秒更新一次统计数据
    setInterval(() => {
      if (this.currentPage === 'dashboard' && auth.isUserAuthenticated()) {
        this.loadDashboard()
      }
    }, 30000)
  }

  // 刷新所有数据
  refreshAllData() {
    this.loadDashboard()
    if (this.currentPage === 'workflows') {
      this.loadWorkflows()
    }
  }

  // 清空所有数据
  clearAllData() {
    this.workflows = []
    this.templates = []
    this.stats = {
      totalWorkflows: 0,
      runningWorkflows: 0,
      completedWorkflows: 0,
      totalCharacters: 0
    }
    this.updateStatsCards()
  }
}

// 全局函数供外部调用
window.refreshDashboard = function() {
  if (window.tavernApp) {
    window.tavernApp.loadDashboard()
  }
}

window.clearDashboard = function() {
  if (window.tavernApp) {
    window.tavernApp.clearAllData()
  }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
  // 创建全局应用实例
  window.tavernApp = new TavernAIApp()

  console.log('🎉 TavernAI Plus 前端已加载完成')
})