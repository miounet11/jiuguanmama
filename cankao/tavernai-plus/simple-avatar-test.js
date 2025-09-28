/**
 * 简单头像生成测试
 * 直接调用NewAPI生成单个头像测试
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const config = {
  newapi: {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  },
  outputDir: './apps/web/public/uploads/characters/avatars'
};

async function testSingleGeneration() {
  console.log('🎨 测试单个头像生成...');

  const prompt = '高质量动漫风格头像，温柔女性角色，友善表情，4K分辨率，头像构图，正面角度';

  console.log(`📝 提示词: ${prompt}`);

  try {
    console.log('📡 发送请求到NewAPI...');

    const response = await axios.post(`${config.newapi.baseURL}/images/generations`, {
      model: config.newapi.model,
      prompt: prompt,
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

    console.log(`✅ API响应成功: 状态 ${response.status}`);

    if (response.data && response.data.data && response.data.data[0]) {
      const imageUrl = response.data.data[0].url;
      console.log(`🖼️ 图像URL: ${imageUrl}`);

      // 下载图像
      console.log('📥 下载图像...');
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
      }

      const filename = `test-simple-${Date.now()}.png`;
      const filepath = path.join(config.outputDir, filename);
      const writer = fs.createWriteStream(filepath);

      imageResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`💾 图像已保存: ${filepath}`);
          console.log(`🌐 公共URL: /uploads/characters/avatars/${filename}`);
          resolve(filename);
        });
        writer.on('error', reject);
      });

    } else {
      console.log('❌ API响应格式异常');
      console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error('❌ 生成失败:', error.message);

    if (error.code) {
      console.error(`🔗 错误代码: ${error.code}`);
    }

    if (error.response) {
      console.error(`📊 HTTP状态: ${error.response.status}`);
      console.error(`📄 错误响应:`, error.response.data);
    }

    return null;
  }
}

async function main() {
  console.log('🚀 简单头像生成测试开始...\n');

  const result = await testSingleGeneration();

  if (result) {
    console.log('\n🎉 测试成功! 头像生成功能正常工作');
    console.log('💡 提示: 现在可以运行批量生成脚本');
  } else {
    console.log('\n💥 测试失败! 请检查网络连接和API配置');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
