/**
 * NewAPI连接测试脚本
 */

const axios = require('axios');

const config = {
  key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
  baseURL: 'https://ttkk.inping.com/v1',
  model: 'nano-banana'
};

async function testAPI() {
  console.log('🔍 测试NewAPI连接...');

  try {
    // 先测试模型列表
    console.log('1. 获取可用模型...');
    const modelsResponse = await axios.get(`${config.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${config.key}`
      },
      timeout: 10000
    });

    console.log('✅ 可用模型:', modelsResponse.data.data?.map(m => m.id).slice(0, 5));

    // 测试简单的图像生成
    console.log('\n2. 测试图像生成...');
    const imageResponse = await axios.post(`${config.baseURL}/images/generations`, {
      model: config.model,
      prompt: 'a beautiful anime girl, high quality, 4K',
      n: 1,
      size: '512x512'
    }, {
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (imageResponse.data && imageResponse.data.data && imageResponse.data.data[0]) {
      console.log('✅ 图像生成成功!');
      console.log('图像URL:', imageResponse.data.data[0].url);
      return true;
    } else {
      console.log('❌ 图像生成返回格式异常');
      return false;
    }

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

testAPI().then(success => {
  if (success) {
    console.log('\n🎉 NewAPI连接测试成功！可以开始生成角色头像。');
  } else {
    console.log('\n❌ NewAPI连接测试失败，请检查配置。');
  }
});
