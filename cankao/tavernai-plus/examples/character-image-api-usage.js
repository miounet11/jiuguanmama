/**
 * TavernAI Plus - 角色图像生成 API 使用示例
 *
 * 此文件演示如何使用角色图像生成系统的各种API端点
 * 包括单个生成、批量操作和状态监控
 */

const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3001/api';
const ADMIN_TOKEN = 'your-admin-jwt-token'; // 替换为实际的管理员令牌

// 创建API客户端
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
});

// ==============================================
// 1. 单个角色图像生成示例
// ==============================================

/**
 * 为指定角色生成头像
 */
async function generateCharacterAvatar(characterId, options = {}) {
  try {
    console.log(`🎨 开始为角色 ${characterId} 生成头像...`);

    const response = await apiClient.post(`/characters/${characterId}/generate-avatar`, {
      mbtiType: options.mbtiType || 'ENFP',
      customPrompt: options.customPrompt || '',
      style: options.style || 'anime',
      quality: options.quality || 'high'
    });

    console.log('✅ 头像生成成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 头像生成失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 为指定角色生成背景图
 */
async function generateCharacterBackground(characterId, options = {}) {
  try {
    console.log(`🖼️ 开始为角色 ${characterId} 生成背景图...`);

    const response = await apiClient.post(`/characters/${characterId}/generate-background`, {
      mbtiType: options.mbtiType || 'ENFP',
      style: options.style || 'fantasy',
      scene: options.scene || 'outdoor',
      timeOfDay: options.timeOfDay || 'sunset'
    });

    console.log('✅ 背景图生成成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 背景图生成失败:', error.response?.data || error.message);
    throw error;
  }
}

// ==============================================
// 2. 批量生成示例
// ==============================================

/**
 * 批量生成多个角色的图像
 */
async function batchGenerateCharacterImages(characterIds, options = {}) {
  try {
    console.log(`🚀 开始批量生成 ${characterIds.length} 个角色的图像...`);

    const response = await apiClient.post('/admin/characters/batch-generate', {
      characterIds: characterIds,
      imageTypes: options.imageTypes || ['avatar', 'background'],
      batchSize: options.batchSize || 3,
      mbtiType: options.mbtiType || null, // null表示使用角色已有的MBTI类型
      style: options.style || 'auto'
    });

    console.log('✅ 批量生成任务已启动:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 批量生成失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 监控批量生成进度
 */
async function monitorBatchProgress(batchId, intervalMs = 5000) {
  console.log(`📊 开始监控批量任务 ${batchId} 的进度...`);

  const checkProgress = async () => {
    try {
      const response = await apiClient.get(`/admin/characters/batch-status/${batchId}`);
      const status = response.data;

      console.log(`进度更新: ${status.completed}/${status.total} 完成 (${status.percentage}%)`);
      console.log(`状态分布: 待处理=${status.pending}, 生成中=${status.generating}, 完成=${status.completed}, 失败=${status.failed}`);

      if (status.isComplete) {
        console.log('🎉 批量生成完成!');
        return status;
      }

      // 继续监控
      setTimeout(checkProgress, intervalMs);
    } catch (error) {
      console.error('❌ 获取进度失败:', error.response?.data || error.message);
    }
  };

  await checkProgress();
}

// ==============================================
// 3. 状态查询示例
// ==============================================

/**
 * 获取所有角色的图像生成状态
 */
async function getGenerationStatus(filters = {}) {
  try {
    console.log('📈 获取角色图像生成状态...');

    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.mbtiType) params.append('mbtiType', filters.mbtiType);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(`/admin/characters/generation-status?${params}`);

    console.log('✅ 状态获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 状态获取失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 获取单个角色的详细信息
 */
async function getCharacterDetails(characterId) {
  try {
    console.log(`📋 获取角色 ${characterId} 的详细信息...`);

    const response = await apiClient.get(`/characters/${characterId}`);

    console.log('✅ 角色信息获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 角色信息获取失败:', error.response?.data || error.message);
    throw error;
  }
}

// ==============================================
// 4. MBTI系统示例
// ==============================================

/**
 * 获取所有MBTI类型及其对应的视觉风格
 */
async function getMBTIStyles() {
  try {
    console.log('🧠 获取MBTI类型和风格映射...');

    const response = await apiClient.get('/admin/mbti/styles');

    console.log('✅ MBTI风格获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ MBTI风格获取失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 批量更新角色的MBTI类型
 */
async function batchUpdateMBTI(updates) {
  try {
    console.log(`🔄 批量更新 ${updates.length} 个角色的MBTI类型...`);

    const response = await apiClient.post('/admin/characters/batch-update-mbti', {
      updates: updates // [{ characterId: 1, mbtiType: 'ENFP' }, ...]
    });

    console.log('✅ MBTI类型批量更新成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ MBTI类型批量更新失败:', error.response?.data || error.message);
    throw error;
  }
}

// ==============================================
// 5. 高级功能示例
// ==============================================

/**
 * 重新生成失败的图像
 */
async function retryFailedGenerations(filters = {}) {
  try {
    console.log('🔄 重新生成失败的图像...');

    const response = await apiClient.post('/admin/characters/retry-failed', {
      imageType: filters.imageType || 'all', // 'avatar', 'background', 'all'
      maxRetries: filters.maxRetries || 3,
      batchSize: filters.batchSize || 5
    });

    console.log('✅ 重新生成任务已启动:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 重新生成失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 清理生成缓存
 */
async function clearGenerationCache(options = {}) {
  try {
    console.log('🧹 清理生成缓存...');

    const response = await apiClient.post('/admin/cache/clear', {
      cacheType: options.cacheType || 'all', // 'images', 'prompts', 'all'
      olderThan: options.olderThan || '7d' // 清理7天前的缓存
    });

    console.log('✅ 缓存清理成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 缓存清理失败:', error.response?.data || error.message);
    throw error;
  }
}

// ==============================================
// 6. 使用示例演示
// ==============================================

/**
 * 完整使用流程演示
 */
async function demonstrateFullWorkflow() {
  console.log('🚀 开始完整工作流程演示...\n');

  try {
    // 1. 获取角色列表
    console.log('1️⃣ 获取角色生成状态...');
    const statusData = await getGenerationStatus({ limit: 10 });
    const characters = statusData.characters || [];

    if (characters.length === 0) {
      console.log('❌ 没有找到角色，请先创建一些角色');
      return;
    }

    // 2. 选择第一个角色进行单个生成
    const firstCharacter = characters[0];
    console.log(`\n2️⃣ 为角色 "${firstCharacter.name}" 生成图像...`);

    // 生成头像
    await generateCharacterAvatar(firstCharacter.id, {
      mbtiType: firstCharacter.mbtiType || 'ENFP',
      style: 'anime',
      quality: 'high'
    });

    // 生成背景图
    await generateCharacterBackground(firstCharacter.id, {
      mbtiType: firstCharacter.mbtiType || 'ENFP',
      style: 'fantasy',
      scene: 'indoor',
      timeOfDay: 'evening'
    });

    // 3. 批量生成示例
    if (characters.length > 1) {
      console.log(`\n3️⃣ 批量生成多个角色的图像...`);
      const characterIds = characters.slice(1, 4).map(c => c.id); // 选择2-4个角色

      const batchResult = await batchGenerateCharacterImages(characterIds, {
        imageTypes: ['avatar'],
        batchSize: 2,
        style: 'anime'
      });

      // 监控批量进度
      if (batchResult.batchId) {
        await monitorBatchProgress(batchResult.batchId, 3000);
      }
    }

    // 4. 获取MBTI风格信息
    console.log('\n4️⃣ 获取MBTI风格映射...');
    await getMBTIStyles();

    // 5. 最终状态检查
    console.log('\n5️⃣ 最终状态检查...');
    await getGenerationStatus();

    console.log('\n🎉 完整工作流程演示完成!');

  } catch (error) {
    console.error('\n❌ 工作流程演示失败:', error.message);
  }
}

// ==============================================
// 7. 错误处理和重试机制示例
// ==============================================

/**
 * 带重试机制的API调用
 */
async function apiCallWithRetry(apiFunction, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      console.log(`尝试 ${attempt}/${maxRetries} 失败:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
}

/**
 * 使用重试机制的生成示例
 */
async function generateWithRetry(characterId, imageType = 'avatar') {
  const generateFunction = () => {
    if (imageType === 'avatar') {
      return generateCharacterAvatar(characterId);
    } else {
      return generateCharacterBackground(characterId);
    }
  };

  try {
    const result = await apiCallWithRetry(generateFunction, 3, 2000);
    console.log(`✅ ${imageType} 生成成功 (可能包含重试):`, result);
    return result;
  } catch (error) {
    console.error(`❌ ${imageType} 生成最终失败:`, error.message);
    throw error;
  }
}

// ==============================================
// 8. 实用工具函数
// ==============================================

/**
 * 验证API连接
 */
async function validateAPIConnection() {
  try {
    console.log('🔍 验证API连接...');
    const response = await apiClient.get('/health');
    console.log('✅ API连接正常:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API连接失败:', error.message);
    return false;
  }
}

/**
 * 获取系统统计信息
 */
async function getSystemStats() {
  try {
    console.log('📊 获取系统统计信息...');
    const response = await apiClient.get('/admin/stats');
    console.log('✅ 统计信息:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 统计信息获取失败:', error.message);
    throw error;
  }
}

// ==============================================
// 主程序入口
// ==============================================

if (require.main === module) {
  // 如果直接运行此文件，执行演示
  console.log('🎭 TavernAI Plus 角色图像生成 API 示例\n');

  // 首先验证连接
  validateAPIConnection().then(isConnected => {
    if (isConnected) {
      // 运行完整演示
      demonstrateFullWorkflow().catch(console.error);
    } else {
      console.log('❌ 请确保API服务器正在运行，然后重试');
    }
  });
}

// 导出所有函数以供其他模块使用
module.exports = {
  // 单个生成
  generateCharacterAvatar,
  generateCharacterBackground,

  // 批量操作
  batchGenerateCharacterImages,
  monitorBatchProgress,

  // 状态查询
  getGenerationStatus,
  getCharacterDetails,

  // MBTI系统
  getMBTIStyles,
  batchUpdateMBTI,

  // 高级功能
  retryFailedGenerations,
  clearGenerationCache,

  // 工具函数
  validateAPIConnection,
  getSystemStats,
  apiCallWithRetry,
  generateWithRetry,

  // 完整演示
  demonstrateFullWorkflow
};

/**
 * 使用示例:
 *
 * const imageAPI = require('./character-image-api-usage');
 *
 * // 单个生成
 * await imageAPI.generateCharacterAvatar(1, { mbtiType: 'ENFP' });
 *
 * // 批量生成
 * await imageAPI.batchGenerateCharacterImages([1,2,3], { imageTypes: ['avatar'] });
 *
 * // 获取状态
 * const status = await imageAPI.getGenerationStatus();
 */
