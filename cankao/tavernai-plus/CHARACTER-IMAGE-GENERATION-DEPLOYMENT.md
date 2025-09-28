# TavernAI Plus - 角色图像生成系统部署指南

## 概述

本文档提供完整的LLM驱动角色图像生成系统的部署说明，包括MBTI性格系统集成、批量生成管理和NewAPI集成。

## 系统架构

### 核心组件
- **NewAPI图像生成服务**: 基于LLM的智能图像生成
- **MBTI性格系统**: 16种性格类型的视觉风格映射
- **批量管理面板**: 管理员专用的批量生成和监控工具
- **前端集成组件**: 角色创建向导和图像管理界面

### 技术栈
- 后端: Express.js + TypeScript + Prisma ORM
- 前端: Vue 3 + TypeScript + Element Plus
- 数据库: SQLite (开发) / PostgreSQL (生产)
- AI服务: NewAPI (支持多种图像生成模型)

## 快速部署

### 1. 环境准备

确保你已经有运行中的TavernAI Plus实例：

```bash
cd cankao/tavernai-plus
npm install
```

### 2. 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# NewAPI 配置
NEWAPI_KEY=your_newapi_key_here
NEWAPI_BASE_URL=https://your-newapi-endpoint.com/v1
DEFAULT_MODEL=nano-banana

# 图像存储配置
IMAGE_STORAGE_PATH=./public/uploads/characters
MAX_CONCURRENT_GENERATIONS=3

# MBTI系统配置
ENABLE_MBTI_SYSTEM=true
DEFAULT_MBTI_TYPE=ENFP
```

### 3. 数据库迁移

运行数据库迁移以添加新字段：

```bash
# 使用自动迁移脚本
node migrate-character-images.js

# 或者手动运行SQL迁移
sqlite3 prisma/dev.db < prisma/migrations/add_image_generation_fields.sql
```

### 4. 路由集成

将图像生成路由集成到主服务器：

```bash
# 运行服务器更新脚本
node server-update.js
```

或者手动编辑 `apps/api/src/server.ts`，添加：

```typescript
import characterImageRoutes from './routes/character-image';
app.use('/api', characterImageRoutes);
```

### 5. 功能验证

运行综合测试脚本：

```bash
node test-image-generation.js
```

测试将验证：
- NewAPI连接状态
- 数据库字段完整性
- API端点功能
- MBTI系统映射
- 图像生成流程

### 6. 启动服务

```bash
npm run dev
```

访问 http://localhost:3000 验证功能。

## 详细功能说明

### MBTI性格系统

支持16种MBTI性格类型，每种类型对应特定的视觉风格：

#### 分析家组 (NT)
- **INTJ (建筑师)**: 深邃眼神，简约时尚，专业商务装扮
- **INTP (逻辑学家)**: 若有所思，休闲学者风，书卷气质
- **ENTJ (指挥官)**: 坚定表情，正装领导者气质，自信姿态
- **ENTP (辩论家)**: 机智表情，创意休闲装，充满活力

#### 外交家组 (NF)
- **INFJ (提倡者)**: 温和神秘，柔和色调，知性优雅
- **INFP (调停者)**: 梦幻气质，艺术风格，温柔表情
- **ENFJ (主人公)**: 温暖笑容，亲和装扮，领导魅力
- **ENFP (竞选者)**: 活泼表情，色彩丰富，充满热情

#### 守护者组 (SJ)
- **ISTJ (物流师)**: 严肃专业，传统服装，可靠形象
- **ISFJ (守护者)**: 温柔关怀，朴素优雅，亲切表情
- **ESTJ (总经理)**: 权威气质，正式着装，自信领导者
- **ESFJ (执政官)**: 友善表情，得体装扮，社交魅力

#### 探险家组 (SP)
- **ISTP (鉴赏家)**: 冷静理性，实用装扮，工匠气质
- **ISFP (探险家)**: 艺术气息，自然风格，敏感表情
- **ESTP (企业家)**: 活力四射，时尚装扮，冒险精神
- **ESFP (娱乐家)**: 开朗笑容，活泼装扮，表演天赋

### 图像生成功能

#### 头像生成
- **尺寸**: 512x512 像素
- **风格**: 基于MBTI性格的视觉特征
- **格式**: PNG格式，优化文件大小
- **存储**: 本地文件系统，路径记录在数据库

#### 背景图生成
- **尺寸**: 1920x1080 像素
- **风格**: 匹配角色设定和性格的场景
- **用途**: 对话界面背景图
- **自适应**: 支持多种屏幕分辨率

#### 批量生成
- **并发控制**: 最多3个同时生成任务
- **状态跟踪**: PENDING → GENERATING → COMPLETED/FAILED
- **进度监控**: 实时进度显示和错误报告
- **失败重试**: 自动重试机制和手动重新生成

## API接口文档

### 单个角色图像生成

#### 生成头像
```http
POST /api/characters/:id/generate-avatar
Content-Type: application/json

{
  "mbtiType": "ENFP",
  "customPrompt": "额外的自定义提示 (可选)"
}
```

#### 生成背景图
```http
POST /api/characters/:id/generate-background
Content-Type: application/json

{
  "mbtiType": "ENFP",
  "style": "fantasy|modern|historical|sci-fi"
}
```

### 批量管理API

#### 批量生成
```http
POST /api/admin/characters/batch-generate
Content-Type: application/json

{
  "characterIds": [1, 2, 3],
  "imageTypes": ["avatar", "background"],
  "batchSize": 3
}
```

#### 获取生成状态
```http
GET /api/admin/characters/generation-status
```

响应示例：
```json
{
  "total": 50,
  "pending": 10,
  "generating": 3,
  "completed": 35,
  "failed": 2,
  "characters": [
    {
      "id": 1,
      "name": "角色名称",
      "avatarStatus": "COMPLETED",
      "backgroundStatus": "GENERATING",
      "mbtiType": "ENFP"
    }
  ]
}
```

## 前端集成指南

### 角色创建集成

在角色创建流程中集成图像生成：

```vue
<template>
  <ImageGenerationStep 
    v-model:character="character"
    @image-generated="handleImageGenerated"
  />
</template>

<script setup>
import { ImageGenerationStep } from '@/components/image/ImageGenerationStep.vue'

const handleImageGenerated = (result) => {
  console.log('图像生成完成:', result)
}
</script>
```

### 管理面板集成

添加图像管理到管理后台：

```vue
<template>
  <CharacterImageManagement 
    :characters="characters"
    @batch-complete="refreshData"
  />
</template>

<script setup>
import { CharacterImageManagement } from '@/views/admin/CharacterImageManagement.vue'
</script>
```

## 性能优化建议

### 并发控制
- 默认最大并发数: 3个生成任务
- 可通过环境变量 `MAX_CONCURRENT_GENERATIONS` 调整
- 建议根据服务器性能和NewAPI限制调整

### 缓存策略
- 生成的图像本地存储，避免重复生成
- 实现图像压缩和多尺寸支持
- 考虑CDN部署以提高加载速度

### 错误处理
- 自动重试失败的生成任务
- 详细的错误日志记录
- 优雅的降级机制（使用默认图像）

## 故障排除

### 常见问题

#### NewAPI连接失败
```bash
# 检查网络连接
curl -H "Authorization: Bearer $NEWAPI_KEY" $NEWAPI_BASE_URL/models

# 验证API密钥
node -e "console.log(process.env.NEWAPI_KEY)"
```

#### 数据库字段缺失
```bash
# 重新运行迁移
node migrate-character-images.js

# 检查字段是否存在
sqlite3 prisma/dev.db ".schema Character"
```

#### 图像生成卡住
```bash
# 检查生成状态
curl http://localhost:3001/api/admin/characters/generation-status

# 重启生成服务
pm2 restart tavernai-api
```

### 日志分析

查看生成日志：
```bash
# 实时日志
tail -f logs/image-generation.log

# 错误日志
grep "ERROR" logs/image-generation.log | tail -20
```

## 安全注意事项

### API密钥管理
- 使用环境变量存储敏感信息
- 定期轮换API密钥
- 实施访问控制和审计日志

### 文件上传安全
- 验证图像文件类型和大小
- 实施文件扫描和病毒检测
- 使用专用上传目录，避免执行权限

### 用户权限控制
- 批量生成功能仅限管理员
- 实施生成频率限制
- 记录所有生成操作的审计日志

## 扩展功能

### 表情包生成 (计划中)
- 基于角色的多表情生成
- 表情状态管理系统
- 自定义表情标签

### 高级自定义
- 用户自定义提示词
- 风格模板系统
- 批量样式应用

### 集成其他AI服务
- 支持多个图像生成服务
- 智能服务切换和负载均衡
- 成本优化和质量控制

---

*此文档涵盖了完整的角色图像生成系统部署流程。如有问题，请查看日志文件或联系技术支持。*