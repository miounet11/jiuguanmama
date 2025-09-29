const API_BASE_URL = 'http://localhost:3007';

async function testAPIConnection() {
  console.log('开始测试API连接...\n');

  const tests = [
    {
      name: '后端健康检查',
      url: '/api/system/health',
      description: '检查后端服务是否正常运行'
    },
    {
      name: '角色列表API',
      url: '/api/characters',
      description: '获取角色列表'
    },
    {
      name: '角色分类API',
      url: '/api/characters/categories',
      description: '获取角色分类信息'
    },
    {
      name: '精选角色API',
      url: '/api/characters/featured',
      description: '获取精选角色'
    },
    {
      name: '市场角色API',
      url: '/api/marketplace/characters',
      description: '获取市场角色列表'
    },
    {
      name: '社区统计API',
      url: '/api/community/stats',
      description: '获取社区统计数据'
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      console.log(`${i + 1}. 测试${test.name}...`);
      console.log(`   描述: ${test.description}`);
      console.log(`   URL: ${API_BASE_URL}${test.url}`);

      const response = await fetch(`${API_BASE_URL}${test.url}`);
      const data = await response.json();

      if (response.ok) {
        console.log('✅ 测试成功');
        if (data.characters) {
          console.log(`   返回角色数量: ${data.characters.length}`);
        } else if (data.categories) {
          console.log(`   返回分类数量: ${data.categories.length}`);
        } else if (data.stats) {
          console.log(`   返回统计数据: ${JSON.stringify(data.stats, null, 2)}`);
        } else {
          console.log(`   返回数据: ${JSON.stringify(data, null, 2)}`);
        }
      } else {
        console.log('❌ 测试失败');
        console.log(`   状态码: ${response.status}`);
        console.log(`   错误信息: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.log('❌ 测试失败');
      console.log(`   错误: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎉 API连接测试完成！');
}

testAPIConnection();
