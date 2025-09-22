# 动态世界观注入 API 文档

## 概述

动态世界观注入系统为TavernAI Plus提供智能关键词触发的世界观信息注入功能，增强对话的沉浸感和一致性。

**基础URL**: `http://localhost:4000/api/worldinfo-injection`

## API端点

### 1. 分析对话并注入世界观
```http
POST /analyze
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "sessionId": "session_123",
  "roomId": "room_456",
  "characterId": "char_789",
  "messages": [
    {
      "role": "user",
      "content": "我想了解魔法学院的历史"
    }
  ],
  "currentMessage": "请告诉我关于传说中的圣剑",
  "settings": {
    "maxEntries": 5,
    "enableAI": true,
    "semanticThreshold": 0.3
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "injectedContent": "【📍 地点信息】\n• 魔法学院: 古老的魔法教育机构...",
    "activatedEntries": [
      {
        "id": "entry_1",
        "title": "魔法学院",
        "category": "location",
        "relevanceScore": 0.89
      }
    ],
    "totalTokens": 256,
    "performance": {
      "totalTime": 185
    }
  }
}
```

### 2. AI关键词提取
```http
POST /extract-keywords
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "text": "我想学习魔法，探索神秘的法术世界",
  "maxKeywords": 10,
  "language": "zh-CN"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "keywords": ["魔法", "法术", "学习", "探索"],
    "entities": [
      {
        "text": "魔法",
        "type": "CONCEPT",
        "confidence": 0.95
      }
    ],
    "themes": ["教育", "魔法"],
    "sentiment": {
      "score": 0.3,
      "emotion": "好奇"
    }
  }
}
```

### 3. 智能内容摘要
```http
POST /generate-summary
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "content": "很长的世界观描述文本...",
  "context": {
    "keywords": ["魔法", "学院"],
    "themes": ["教育"],
    "maxLength": 150
  }
}
```

### 4. 情感上下文分析
```http
POST /analyze-emotion
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "messages": [
    {"role": "user", "content": "今天心情很好！"}
  ],
  "includeAdvice": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "overallMood": "愉快",
    "emotionalIntensity": 0.7,
    "appropriateForInjection": true,
    "suggestedTiming": "immediate"
  }
}
```

### 5. 角色语音优化
```http
POST /optimize-voice
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "content": "魔法学院是一个古老的机构",
  "character": {
    "name": "艾莉亚",
    "personality": "活泼开朗",
    "speakingStyle": "热情友好"
  },
  "tone": "friendly"
}
```

### 6. 获取智能建议
```http
GET /suggestions?sessionId=123&characterId=456
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "recommendedBooks": [...],
    "keywordTriggers": ["魔法", "学院"],
    "settings": {
      "recommended": {
        "maxEntries": 5,
        "enableAI": true
      }
    }
  }
}
```

### 7. 统计信息
```http
GET /stats?timeRange=7d
Authorization: Bearer <token>
```

## WebSocket 事件

### 连接
```javascript
const ws = new WebSocket('ws://localhost:4000', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 发送事件

#### 请求世界观分析
```javascript
ws.send(JSON.stringify({
  type: 'analyze_worldinfo',
  data: {
    sessionId: 'session_123',
    messages: [...],
    currentMessage: "告诉我关于魔法的知识",
    settings: { maxEntries: 5 }
  }
}));
```

#### 请求建议
```javascript
ws.send(JSON.stringify({
  type: 'request_worldinfo_suggestions',
  data: {
    sessionId: 'session_123',
    characterId: 'char_456'
  }
}));
```

### 接收事件

#### 分析开始
```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'worldinfo_analysis_started') {
    console.log('世界观分析开始...');
  }
});
```

#### 分析完成
```javascript
// 事件: worldinfo_analysis_completed
{
  "sessionId": "session_123",
  "injectedContent": "...",
  "activatedEntries": [...],
  "performance": {...}
}
```

#### 关键词检测
```javascript
// 事件: worldinfo_keyword_detected
{
  "detectedKeywords": ["魔法", "学院"],
  "message": "检测到关键词，是否获取相关信息？",
  "suggestedAction": "analyze_context"
}
```

#### 建议推送
```javascript
// 事件: worldinfo_suggestions
{
  "suggestions": {
    "recommendedEntries": [...],
    "keywordTriggers": [...],
    "contextAdvice": {...}
  }
}
```

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "世界观分析失败",
    "details": "AI服务暂时不可用"
  }
}
```

### 常见错误码
- `ANALYSIS_FAILED`: 分析失败
- `INVALID_INPUT`: 输入参数无效
- `AI_SERVICE_UNAVAILABLE`: AI服务不可用
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `UNAUTHORIZED`: 认证失败

## 使用示例

### JavaScript/TypeScript 客户端
```typescript
class WorldInfoClient {
  constructor(private apiBase: string, private token: string) {}

  async analyzeConversation(context: ConversationContext) {
    const response = await fetch(`${this.apiBase}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(context)
    });

    return await response.json();
  }

  async extractKeywords(text: string) {
    const response = await fetch(`${this.apiBase}/extract-keywords`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, maxKeywords: 10 })
    });

    return await response.json();
  }
}
```

### Vue.js 组件集成
```vue
<template>
  <div class="worldinfo-panel">
    <div v-if="injectedContent" class="worldinfo-card">
      <h3>📖 相关背景信息</h3>
      <div v-html="formatContent(injectedContent)"></div>
      <button @click="provideFeedback('helpful')">👍 有用</button>
      <button @click="provideFeedback('unhelpful')">👎 无用</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      injectedContent: '',
      websocket: null
    };
  },
  mounted() {
    this.initWebSocket();
  },
  methods: {
    async analyzeCurrentMessage(message) {
      const result = await this.$worldinfo.analyzeConversation({
        messages: this.conversationHistory,
        currentMessage: message
      });

      if (result.success) {
        this.injectedContent = result.data.injectedContent;
      }
    },

    initWebSocket() {
      this.websocket = new WebSocket('ws://localhost:4000');
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'worldinfo_keyword_detected') {
          this.showKeywordNotification(data);
        }
      };
    }
  }
};
</script>
```

## 性能优化建议

### 1. 缓存策略
- 相同上下文的分析结果会被缓存5分钟
- 频繁查询的世界观条目会被内存缓存
- 建议客户端也实现适当的缓存

### 2. 批量处理
- 支持批量关键词提取，减少API调用次数
- 可以预处理常用世界观条目的向量嵌入

### 3. 异步处理
- 使用WebSocket进行实时通信，避免轮询
- 分析过程异步进行，不阻塞用户界面

## 集成检查清单

- [ ] 用户认证token已配置
- [ ] AI服务API密钥已设置
- [ ] WebSocket连接已建立
- [ ] 错误处理已实现
- [ ] 用户反馈机制已集成
- [ ] 性能监控已配置

---

*更多详细信息请参考 [完整实施报告](./WORLDINFO_INJECTION_IMPLEMENTATION_REPORT.md)*