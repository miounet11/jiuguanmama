/**
 * 测试NewAPI连接和单个头像生成
 */

const axios = require('axios');

const config = {
  newapi: {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  }
};

async function testConnection() {
  console.log('🔗 测试NewAPI连接...');

  try {
    // 首先测试模型列表
    console.log('📋 获取模型列表...');
    const modelsResponse = await axios.get(`${config.newapi.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${config.newapi.key}`
      },
      timeout: 10000
    });

    console.log('✅ 连接成功!');
    console.log(`📊 可用模型数量: ${modelsResponse.data.data?.length || 0}`);

    return true;
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    return false;
  }
}

async function testImageGeneration() {
  console.log('\n🎨 测试单个图像生成...');

  try {
    const testPrompt = '高质量动漫风格头像，温柔女性角色，友善表情，高质量，4K分辨率，头像构图';

    console.log(`📝 测试提示词: ${testPrompt}`);

    const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
      model: config.newapi.model,
      prompt: testPrompt,
      n: 1,
      size: '512x512',
      quality: 'standard'
    }, {
      headers: {
        'Authorization': `Bearer ${config.newapi.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;
      console.log('✅ 图像生成成功!');
      console.log(`🖼️ 图像URL: ${imageUrl}`);
      return imageUrl;
    } else {
      console.log('❌ 响应格式异常');
      console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error('❌ 图像生成失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.data);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 NewAPI功能测试开始...\n');

  const connectionOk = await testConnection();

  if (connectionOk) {
    await testImageGeneration();
  }

  console.log('\n🎉 测试完成!');
}

if (require.main === module) {
  main().catch(console.error);
}
