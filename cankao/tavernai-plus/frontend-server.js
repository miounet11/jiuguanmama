#!/usr/bin/env node

const express = require('express')
const path = require('path')
const cors = require('cors')

// 创建Express应用
const app = express()

// 中间件配置
app.use(cors())
app.use(express.json())

// 静态文件服务 - 前端文件
app.use(express.static(path.join(__dirname, 'frontend')))

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TavernAI Plus Frontend Server',
    timestamp: new Date().toISOString(),
    features: [
      '🎨 完整前端界面',
      '📊 可视化工作流编辑器',
      '🔐 用户认证系统',
      '🧠 AI助手集成',
      '⚡ 响应式设计'
    ]
  })
})

// API代理到后端服务器
app.use('/api', (req, res) => {
  res.status(503).json({
    success: false,
    error: '请启动完整的后端API服务器 (complete-test-server.js)',
    message: '前端服务器正在运行，但需要后端API服务器提供数据支持',
    instructions: [
      '1. 在另一个终端运行: node complete-test-server.js',
      '2. 后端服务器将在 http://localhost:3008 提供API服务',
      '3. 前端会自动连接到后端API'
    ]
  })
})

// 所有其他路由返回index.html (SPA路由支持)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})

// 启动服务器
const PORT = process.env.PORT || 3009
const server = app.listen(PORT, () => {
  console.log('\n🎉 TavernAI Plus 前端服务器启动成功!')
  console.log('=' .repeat(50))
  console.log(`🌐 前端访问地址: http://localhost:${PORT}`)
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`)
  console.log('')
  console.log('🚀 功能特性:')
  console.log('   ✅ 完整的用户界面')
  console.log('   ✅ 可视化工作流编辑器 (基于vis.js)')
  console.log('   ✅ 用户登录注册系统')
  console.log('   ✅ 智能AI助手')
  console.log('   ✅ 工作流管理界面')
  console.log('   ✅ 响应式设计 (支持移动端)')
  console.log('')
  console.log('⚠️  重要提示:')
  console.log('   需要同时运行后端API服务器才能完整使用')
  console.log('   运行命令: node complete-test-server.js')
  console.log('   后端地址: http://localhost:3008')
  console.log('')
  console.log('📋 测试步骤:')
  console.log('   1. 打开浏览器访问 http://localhost:3009')
  console.log('   2. 注册账号或登录')
  console.log('   3. 创建工作流并测试编辑器')
  console.log('   4. 体验AI助手功能')
  console.log('')
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭前端服务器...')
  server.close(() => {
    console.log('✅ 前端服务器已关闭')
    process.exit(0)
  })
})

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason)
  process.exit(1)
})