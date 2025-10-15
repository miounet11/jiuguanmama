#!/usr/bin/env node

/**
 * API端口配置修复验证脚本
 * 检查前端是否能正确连接到API服务的3009端口
 */

const http = require('http');
const WebSocket = require('ws');

// 配置
const API_HOST = 'localhost';
const API_PORT = 3009;
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
const WS_URL = `ws://${API_HOST}:${API_PORT}`;

// 测试结果
const results = {
  httpConnection: false,
  wsConnection: false,
  endpoints: {},
  errors: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求测试
async function testHttpConnection() {
  log('\n=== HTTP连接测试 ===', 'blue');

  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      log(`✓ HTTP状态码: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'yellow');

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          log(`✓ API响应: ${response.message || response.status || 'OK'}`, 'green');
          results.httpConnection = true;
        } catch (error) {
          log(`✓ API响应: ${data}`, 'green');
          results.httpConnection = true;
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      log(`✗ HTTP连接失败: ${error.message}`, 'red');
      results.errors.push(`HTTP: ${error.message}`);
      resolve();
    });

    req.on('timeout', () => {
      log('✗ HTTP请求超时', 'red');
      results.errors.push('HTTP: 请求超时');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// WebSocket连接测试
async function testWebSocketConnection() {
  log('\n=== WebSocket连接测试 ===', 'blue');

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);

      const timeout = setTimeout(() => {
        log('✗ WebSocket连接超时', 'red');
        results.errors.push('WebSocket: 连接超时');
        ws.terminate();
        resolve();
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        log('✓ WebSocket连接成功', 'green');
        results.wsConnection = true;
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        log(`✗ WebSocket连接失败: ${error.message}`, 'red');
        results.errors.push(`WebSocket: ${error.message}`);
        resolve();
      });

    } catch (error) {
      log(`✗ WebSocket初始化失败: ${error.message}`, 'red');
      results.errors.push(`WebSocket: ${error.message}`);
      resolve();
    }
  });
}

// 测试多个API端点
async function testApiEndpoints() {
  log('\n=== API端点测试 ===', 'blue');

  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/characters', method: 'GET' },
    { path: '/api/auth/status', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      results.endpoints[endpoint.path] = status;

      let statusColor = 'green';
      if (status >= 400) statusColor = 'red';
      else if (status >= 300) statusColor = 'yellow';

      log(`  ${endpoint.method} ${endpoint.path} - ${status}`, statusColor);
      resolve();
    });

    req.on('error', () => {
      results.endpoints[endpoint.path] = 'ERROR';
      log(`  ${endpoint.method} ${endpoint.path} - ERROR`, 'red');
      resolve();
    });

    req.on('timeout', () => {
      results.endpoints[endpoint.path] = 'TIMEOUT';
      log(`  ${endpoint.method} ${endpoint.path} - TIMEOUT`, 'red');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// 检查端口配置文件
async function checkConfigFiles() {
  log('\n=== 配置文件检查 ===', 'blue');

  const fs = require('fs');
  const path = require('path');

  const configFiles = [
    'apps/web/.env.development',
    'apps/web/src/services/api.ts',
    'apps/web/src/utils/axios.ts',
    'apps/web/src/stores/chat.ts'
  ];

  for (const file of configFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        // 检查是否包含正确的端口配置
        if (content.includes('localhost:3009') || content.includes('VITE_API_URL=3009') || content.includes('VITE_WS_URL=3009')) {
          log(`✓ ${file} - 端口配置正确`, 'green');
        } else if (content.includes('localhost:30') && !content.includes('localhost:3009')) {
          log(`✗ ${file} - 仍包含旧的端口配置`, 'red');
          results.errors.push(`${file}: 仍包含旧的端口配置`);
        } else {
          log(`? ${file} - 未找到端口配置`, 'yellow');
        }
      } else {
        log(`- ${file} - 文件不存在`, 'yellow');
      }
    } catch (error) {
      log(`✗ ${file} - 读取失败: ${error.message}`, 'red');
    }
  }
}

// 生成报告
function generateReport() {
  log('\n' + '='.repeat(50), 'blue');
  log('          API端口配置修复验证报告', 'blue');
  log('='.repeat(50), 'blue');

  log('\n📊 连接状态:', 'blue');
  log(`  HTTP连接: ${results.httpConnection ? '✓ 成功' : '✗ 失败'}`, results.httpConnection ? 'green' : 'red');
  log(`  WebSocket连接: ${results.wsConnection ? '✓ 成功' : '✗ 失败'}`, results.wsConnection ? 'green' : 'red');

  if (Object.keys(results.endpoints).length > 0) {
    log('\n🔗 端点测试结果:', 'blue');
    for (const [endpoint, status] of Object.entries(results.endpoints)) {
      let statusColor = 'green';
      if (status === 'ERROR' || status === 'TIMEOUT') statusColor = 'red';
      else if (status >= 400) statusColor = 'red';
      else if (status >= 300) statusColor = 'yellow';

      log(`  ${endpoint}: ${status}`, statusColor);
    }
  }

  if (results.errors.length > 0) {
    log('\n❌ 发现的问题:', 'red');
    results.errors.forEach(error => {
      log(`  • ${error}`, 'red');
    });
  }

  log('\n🎯 修复建议:', 'blue');
  if (!results.httpConnection && !results.wsConnection) {
    log('  • API服务可能未启动，请先启动后端服务', 'yellow');
    log('  • 运行命令: npm run dev 或 node apps/api/src/index.js', 'yellow');
  } else if (!results.httpConnection) {
    log('  • HTTP连接失败，检查API服务状态', 'yellow');
  } else if (!results.wsConnection) {
    log('  • WebSocket连接失败，检查WebSocket配置', 'yellow');
  } else {
    log('  • 所有连接正常！端口配置修复成功', 'green');
    log('  • 前端应用现在应该能正常连接到API服务', 'green');
  }

  log('\n📝 下一步:', 'blue');
  log('  1. 启动前端应用: npm run dev (在apps/web目录)', 'blue');
  log('  2. 在浏览器中访问 http://localhost:3000', 'blue');
  log('  3. 测试登录和聊天功能', 'blue');

  log('\n' + '='.repeat(50), 'blue');
}

// 主函数
async function main() {
  log('🔧 开始API端口配置修复验证...', 'blue');
  log(`📍 目标地址: ${API_BASE_URL}`, 'blue');
  log(`🌐 WebSocket: ${WS_URL}`, 'blue');

  await checkConfigFiles();
  await testHttpConnection();
  await testWebSocketConnection();
  await testApiEndpoints();
  generateReport();
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, results };