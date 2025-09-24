#!/usr/bin/env node

const axios = require('axios');

async function testLogin() {
  const baseURL = 'http://localhost:3007';

  console.log('🧪 测试登录功能...');

  // 测试用户凭据
  const testCredentials = [
    { email: 'admin@tavernai.com', password: 'password123' },
    { email: 'user@tavernai.com', password: 'password123' },
    { email: 'creator@tavernai.com', password: 'password123' },
  ];

  for (const credentials of testCredentials) {
    try {
      console.log(`\n📧 测试登录: ${credentials.email}`);

      const response = await axios.post(`${baseURL}/api/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log('✅ 登录成功!');
        console.log('🔑 Access Token:', response.data.accessToken?.substring(0, 20) + '...');
        console.log('👤 用户信息:', {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email
        });
      }
    } catch (error) {
      console.log('❌ 登录失败:');
      if (error.response) {
        console.log('   状态码:', error.response.status);
        console.log('   响应:', error.response.data);
      } else {
        console.log('   错误:', error.message);
      }
    }
  }

  // 测试错误情况
  console.log('\n🚫 测试错误情况...');
  try {
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('✅ 正确处理了错误凭据');
    console.log('   状态码:', error.response?.status);
    console.log('   错误消息:', error.response?.data?.message);
  }
}

testLogin().catch(console.error);