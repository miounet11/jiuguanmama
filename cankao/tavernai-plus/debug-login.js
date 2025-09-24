#!/usr/bin/env node

const axios = require('axios');

async function debugLogin() {
  const baseURL = 'http://localhost:3007';

  console.log('🔍 调试前端登录请求...');

  // 测试不同的请求数据格式
  const testCases = [
    {
      name: '正确格式',
      data: { email: 'admin@tavernai.com', password: 'password123' }
    },
    {
      name: '空字符串',
      data: { email: '', password: '' }
    },
    {
      name: '无效邮箱',
      data: { email: 'invalid', password: 'short' }
    },
    {
      name: '字段反转',
      data: { email: 'password123', password: 'admin@tavernai.com' }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📧 测试: ${testCase.name}`);
      console.log('发送数据:', testCase.data);

      const response = await axios.post(`${baseURL}/api/auth/login`, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ 成功:', response.status);
    } catch (error) {
      console.log('❌ 失败:');
      if (error.response) {
        console.log('   状态码:', error.response.status);
        console.log('   响应数据:', JSON.stringify(error.response.data, null, 2));

        if (error.response.data.errors) {
          console.log('   详细错误:');
          Object.entries(error.response.data.errors).forEach(([field, messages]) => {
            console.log(`     ${field}: ${messages.join(', ')}`);
          });
        }
      } else {
        console.log('   错误:', error.message);
      }
    }
  }

  // 检查原始 curl 请求
  console.log('\n📋 等价的 curl 命令 (正确格式):');
  console.log(`curl -X POST ${baseURL}/api/auth/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"admin@tavernai.com","password":"password123"}'`);
}

debugLogin().catch(console.error);