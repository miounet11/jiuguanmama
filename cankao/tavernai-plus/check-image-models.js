/**
 * 检查可用的图像生成模型
 */

const axios = require('axios');

const config = {
  key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
  baseURL: 'https://ttkk.inping.com/v1'
};

async function checkImageModels() {
  console.log('🔍 检查可用的图像生成模型...');

  try {
    const response = await axios.get(`${config.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${config.key}`
      },
      timeout: 10000
    });

    const models = response.data.data || [];
    console.log(`📋 总共找到 ${models.length} 个模型`);

    // 过滤可能的图像生成模型
    const imageModels = models.filter(model => {
      const id = model.id.toLowerCase();
      return id.includes('dall') ||
             id.includes('midjourney') ||
             id.includes('stable') ||
             id.includes('imagen') ||
             id.includes('nano') ||
             id.includes('image') ||
             id.includes('draw') ||
             id.includes('art');
    });

    console.log('\n🎨 可能的图像生成模型:');
    imageModels.forEach(model => {
      console.log(`  - ${model.id}`);
    });

    // 如果没找到专门的图像模型，显示所有模型让用户选择
    if (imageModels.length === 0) {
      console.log('\n📝 所有可用模型:');
      models.slice(0, 20).forEach(model => {
        console.log(`  - ${model.id}`);
      });

      if (models.length > 20) {
        console.log(`  ... 还有 ${models.length - 20} 个模型`);
      }
    }

    // 测试一些常见的模型
    const testModels = ['dall-e-3', 'dall-e-2', 'midjourney', 'stable-diffusion-xl'];
    console.log('\n🧪 测试常见图像模型...');

    for (const modelName of testModels) {
      const modelExists = models.some(m => m.id.toLowerCase().includes(modelName.toLowerCase()));
      if (modelExists) {
        console.log(`✅ 找到模型: ${modelName}`);
        return modelName;
      }
    }

    // 如果找到了其他图像模型，返回第一个
    if (imageModels.length > 0) {
      console.log(`🎯 将使用: ${imageModels[0].id}`);
      return imageModels[0].id;
    }

    // 没有找到图像模型，尝试chatgpt（可能支持图像生成）
    const chatgptModel = models.find(m => m.id.toLowerCase().includes('chatgpt') || m.id.toLowerCase().includes('gpt-4'));
    if (chatgptModel) {
      console.log(`🤖 将尝试使用: ${chatgptModel.id}`);
      return chatgptModel.id;
    }

    console.log('❌ 未找到合适的图像生成模型');
    return null;

  } catch (error) {
    console.error('❌ 检查模型失败:', error.message);
    return null;
  }
}

checkImageModels().then(model => {
  if (model) {
    console.log(`\n✅ 推荐使用模型: ${model}`);
  } else {
    console.log('\n❌ 未找到可用的图像生成模型，请联系API提供商');
  }
});
