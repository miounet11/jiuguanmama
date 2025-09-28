/**
 * 直接测试NewAPI图像生成
 * 使用环境变量中的配置
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testNewAPIImageGeneration() {
  const config = {
    key: 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY',
    baseURL: 'https://ttkk.inping.com/v1',
    model: 'nano-banana'
  };

  console.log('🔗 测试NewAPI图像生成...');
  console.log(`📡 API端点: ${config.baseURL}`);
  console.log(`🤖 模型: ${config.model}`);

  const testPrompt = '高质量动漫风格头像，温柔女性角色，友善表情，高质量，4K分辨率，头像构图，正面角度';

  try {
    console.log(`\n📝 测试提示词: ${testPrompt}`);

    const startTime = Date.now();

    const response = await axios.post(`${config.baseURL}/images/generations`, {
      model: config.model,
      prompt: testPrompt,
      n: 1,
      size: '512x512',
      quality: 'standard',
      style: 'vivid'
    }, {
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TavernAI-Plus/1.0'
      },
      timeout: 120000, // 2分钟超时
      validateStatus: function (status) {
        return status >= 200 && status < 300; // 只接受成功状态码
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ 请求耗时: ${duration}ms`);

    console.log('\n📋 响应详情:');
    console.log(`状态码: ${response.status}`);
    console.log(`响应大小: ${JSON.stringify(response.data).length} bytes`);

    if (response.data && response.data.data && response.data.data[0]) {
      const imageData = response.data.data[0];
      console.log('\n✅ 图像生成成功!');
      console.log(`🖼️ 图像URL: ${imageData.url}`);

      if (imageData.revised_prompt) {
        console.log(`📝 修订后的提示词: ${imageData.revised_prompt}`);
      }

      // 尝试下载并保存图像
      try {
        console.log('\n📥 下载图像...');
        const imageResponse = await axios.get(imageData.url, {
          responseType: 'stream',
          timeout: 60000
        });

        const outputDir = './apps/web/public/uploads/characters/avatars';
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = `test-avatar-${Date.now()}.png`;
        const filepath = path.join(outputDir, filename);
        const writer = fs.createWriteStream(filepath);

        imageResponse.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', () => {
            console.log(`💾 图像已保存: ${filepath}`);
            console.log(`🌐 公共URL: /uploads/characters/avatars/${filename}`);
            resolve(imageData.url);
          });
          writer.on('error', (error) => {
            console.error('❌ 保存图像失败:', error.message);
            reject(error);
          });
        });

      } catch (downloadError) {
        console.error('❌ 下载图像失败:', downloadError.message);
        return imageData.url; // 返回URL即使下载失败
      }

    } else {
      console.log('❌ 响应格式异常');
      console.log('📄 完整响应:', JSON.stringify(response.data, null, 2));
      return null;
    }

  } catch (error) {
    console.error('\n❌ 图像生成失败:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS解析失败，请检查网络连接');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔒 连接被拒绝，请检查URL和防火墙设置');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ 请求超时，请检查网络速度');
    } else if (error.response) {
      console.error('📄 错误响应:');
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   状态文本: ${error.response.statusText}`);
      console.error(`   错误数据:`, error.response.data);
    }

    return null;
  }
}

async function main() {
  console.log('🚀 NewAPI直接测试开始...\n');

  const result = await testNewAPIImageGeneration();

  if (result) {
    console.log('\n🎉 测试成功! 接口工作正常');
  } else {
    console.log('\n💥 测试失败! 接口可能有问题');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
