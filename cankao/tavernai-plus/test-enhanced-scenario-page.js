#!/usr/bin/env node

const axios = require('axios')

async function testEnhancedScenarioPage() {
  const baseURL = 'http://localhost:3002'
  const apiURL = 'http://localhost:3008'
  const scenarioId = '2de636e2-0077-459a-84b8-6727cd5325a7'

  console.log('🧪 测试增强剧本页面访问...')

  try {
    // 1. 测试API端点
    console.log('\n1. 测试API端点...')
    const apiResponse = await axios.get(`${apiURL}/api/enhanced-scenarios/${scenarioId}`)
    console.log('✅ API端点响应正常')
    console.log(`   剧本名称: ${apiResponse.data.name}`)
    console.log(`   是否增强剧本: ${!!(apiResponse.data.worldSetting || apiResponse.data.genre)}`)

    // 2. 测试前端页面
    console.log('\n2. 测试前端页面...')
    const pageResponse = await axios.get(`${baseURL}/scenarios/${scenarioId}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (pageResponse.status === 200) {
      console.log('✅ 前端页面响应正常')
      console.log(`   状态码: ${pageResponse.status}`)
      console.log(`   内容类型: ${pageResponse.headers['content-type']}`)

      // 检查页面是否包含基本的HTML结构
      const htmlContent = pageResponse.data
      if (htmlContent.includes('<!DOCTYPE html>') && htmlContent.includes('<title>')) {
        console.log('✅ HTML结构正常')
      } else {
        console.log('❌ HTML结构异常')
      }
    } else {
      console.log(`❌ 前端页面响应异常: ${pageResponse.status}`)
    }

    // 3. 测试API调用路径
    console.log('\n3. 测试前端API调用路径...')
    const frontendApiResponse = await axios.get(`${baseURL}/api/enhanced-scenarios/${scenarioId}`)
    console.log('✅ 前端API代理正常工作')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`)
      console.error(`   错误信息: ${error.response.statusText}`)
    }
  }
}

testEnhancedScenarioPage()
