# API 端点映射文档

## 基础配置

- **后端服务器**: `http://localhost:3001`
- **前端开发服务器**: `http://localhost:3000`
- **API基础路径**: `/api`
- **WebSocket路径**: `/ws`

## 认证相关 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| POST | `/api/auth/logout` | 用户登出 | ✅ |
| GET | `/api/auth/me` | 获取当前用户信息 | ✅ |
| POST | `/api/auth/refresh` | 刷新访问令牌 | ❌ |
| POST | `/api/auth/verify` | 验证邮箱 | ❌ |
| POST | `/api/auth/forgot-password` | 忘记密码 | ❌ |
| POST | `/api/auth/reset-password` | 重置密码 | ❌ |

## 用户相关 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| GET | `/api/users/profile` | 获取用户资料 | ✅ |
| PUT | `/api/users/profile` | 更新用户资料 | ✅ |
| POST | `/api/users/avatar` | 上传头像 | ✅ |
| DELETE | `/api/users/avatar` | 删除头像 | ✅ |
| PUT | `/api/users/password` | 修改密码 | ✅ |
| GET | `/api/users/settings` | 获取用户设置 | ✅ |
| PUT | `/api/users/settings` | 更新用户设置 | ✅ |

## 角色相关 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| GET | `/api/characters` | 获取公开角色列表 | 可选 |
| GET | `/api/characters/popular` | 获取热门角色 | 可选 |
| GET | `/api/characters/featured` | 获取特色角色 | 可选 |
| GET | `/api/characters/my` | 获取我的角色 | ✅ |
| GET | `/api/characters/:id` | 获取角色详情 | 可选 |
| POST | `/api/characters` | 创建角色 | ✅ |
| PUT | `/api/characters/:id` | 更新角色 | ✅ |
| DELETE | `/api/characters/:id` | 删除角色 | ✅ |
| POST | `/api/characters/:id/favorite` | 收藏角色 | ✅ |
| POST | `/api/characters/:id/unfavorite` | 取消收藏 | ✅ |
| POST | `/api/characters/:id/rate` | 评分角色 | ✅ |
| GET | `/api/characters/:id/reviews` | 获取角色评价 | ❌ |
| POST | `/api/characters/:id/reviews` | 添加角色评价 | ✅ |
| POST | `/api/characters/:id/duplicate` | 复制角色 | ✅ |
| POST | `/api/characters/:id/export` | 导出角色 | ✅ |
| POST | `/api/characters/import` | 导入角色 | ✅ |

## 聊天相关 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| GET | `/api/chat/sessions` | 获取会话列表 | ✅ |
| POST | `/api/chat/sessions` | 创建新会话 | ✅ |
| GET | `/api/chat/sessions/:sessionId` | 获取会话详情 | ✅ |
| DELETE | `/api/chat/sessions/:sessionId` | 删除会话 | ✅ |
| POST | `/api/chat/sessions/:sessionId/archive` | 归档会话 | ✅ |
| GET | `/api/chat/sessions/:sessionId/messages` | 获取消息历史 | ✅ |
| POST | `/api/chat/sessions/:sessionId/messages` | 发送消息 | ✅ |
| PUT | `/api/chat/sessions/:sessionId/messages/:messageId` | 编辑消息 | ✅ |
| DELETE | `/api/chat/sessions/:sessionId/messages/:messageId` | 删除消息 | ✅ |
| POST | `/api/chat/sessions/:sessionId/messages/:messageId/regenerate` | 重新生成回复 | ✅ |
| POST | `/api/chat/sessions/:sessionId/stop` | 停止生成 | ✅ |
| POST | `/api/chat/sessions/:sessionId/clear-context` | 清除上下文 | ✅ |
| PUT | `/api/chat/sessions/:sessionId/settings` | 更新会话设置 | ✅ |
| POST | `/api/chat/send` | 简化的发送消息接口 | ✅ |

## AI 功能 API (QuackAI 特色)

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| **指导回复 (Guidance)** |
| POST | `/api/ai/guidance/apply` | 应用指导回复 | ✅ |
| GET | `/api/ai/guidance/suggestions/:sessionId` | 获取指导建议 | ✅ |
| POST | `/api/ai/guidance/presets` | 保存指导预设 | ✅ |
| GET | `/api/ai/guidance/presets` | 获取指导预设 | ✅ |
| **召唤角色 (Summon)** |
| POST | `/api/ai/summon/character` | 召唤角色加入对话 | ✅ |
| GET | `/api/ai/summon/available/:sessionId` | 获取可召唤角色 | ✅ |
| POST | `/api/ai/summon/temporary` | 临时召唤角色 | ✅ |
| **世界观 (World Info)** |
| GET | `/api/ai/worldinfo` | 获取世界观列表 | ✅ |
| POST | `/api/ai/worldinfo` | 创建世界观 | ✅ |
| GET | `/api/ai/worldinfo/:id` | 获取世界观详情 | ✅ |
| PUT | `/api/ai/worldinfo/:id` | 更新世界观 | ✅ |
| DELETE | `/api/ai/worldinfo/:id` | 删除世界观 | ✅ |
| POST | `/api/ai/worldinfo/:id/entries` | 添加条目 | ✅ |
| PUT | `/api/ai/worldinfo/:id/entries/:entryId` | 更新条目 | ✅ |
| DELETE | `/api/ai/worldinfo/:id/entries/:entryId` | 删除条目 | ✅ |
| POST | `/api/ai/worldinfo/:id/activate` | 激活世界观 | ✅ |
| **故事书 (Storybook)** |
| GET | `/api/ai/storybook/:characterId` | 获取故事书 | ✅ |
| POST | `/api/ai/storybook/:characterId/entries` | 添加故事条目 | ✅ |
| PUT | `/api/ai/storybook/:characterId/entries/:entryId` | 更新故事条目 | ✅ |
| DELETE | `/api/ai/storybook/:characterId/entries/:entryId` | 删除故事条目 | ✅ |
| POST | `/api/ai/storybook/check` | 检查触发条件 | ✅ |
| **角色生成器 (Generator)** |
| POST | `/api/ai/generate/character` | AI生成角色 | ✅ |
| POST | `/api/ai/generate/avatar` | AI生成头像 | ✅ |
| POST | `/api/ai/generate/personality` | AI生成性格 | ✅ |
| POST | `/api/ai/generate/backstory` | AI生成背景故事 | ✅ |

## 市场 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| GET | `/api/marketplace/characters` | 获取市场角色 | ❌ |
| GET | `/api/marketplace/characters/:id` | 获取市场角色详情 | ❌ |
| POST | `/api/marketplace/characters/:id/purchase` | 购买角色 | ✅ |
| POST | `/api/marketplace/characters` | 发布角色到市场 | ✅ |
| PUT | `/api/marketplace/characters/:id` | 更新市场角色 | ✅ |
| DELETE | `/api/marketplace/characters/:id` | 下架角色 | ✅ |

## 管理员 API

| 方法 | 端点 | 描述 | 需要认证 |
|------|------|------|----------|
| GET | `/api/admin/users` | 获取用户列表 | 管理员 |
| PUT | `/api/admin/users/:id` | 更新用户信息 | 管理员 |
| DELETE | `/api/admin/users/:id` | 删除用户 | 管理员 |
| POST | `/api/admin/users/:id/ban` | 封禁用户 | 管理员 |
| POST | `/api/admin/users/:id/unban` | 解封用户 | 管理员 |
| GET | `/api/admin/characters` | 获取所有角色 | 管理员 |
| DELETE | `/api/admin/characters/:id` | 删除角色 | 管理员 |
| GET | `/api/admin/stats` | 获取统计数据 | 管理员 |
| GET | `/api/logs` | 获取系统日志 | 管理员 |

## WebSocket 事件

### 客户端发送事件

| 事件名 | 数据格式 | 描述 |
|--------|----------|------|
| `authenticate` | `{ token: string }` | 认证连接 |
| `join_session` | `{ sessionId: string }` | 加入会话房间 |
| `leave_session` | `{ sessionId: string }` | 离开会话房间 |
| `message` | `{ sessionId: string, content: string }` | 发送消息 |
| `typing` | `{ sessionId: string, isTyping: boolean }` | 输入状态 |
| `stop_generation` | `{ sessionId: string }` | 停止生成 |

### 服务器发送事件

| 事件名 | 数据格式 | 描述 |
|--------|----------|------|
| `connected` | `{ id: string }` | 连接成功 |
| `authenticated` | `{ userId: string }` | 认证成功 |
| `message` | `{ message: Object }` | 新消息 |
| `stream` | `{ content: string, messageId: string }` | 流式响应 |
| `stream_complete` | `{ messageId: string }` | 流式完成 |
| `typing` | `{ userId: string, isTyping: boolean }` | 用户输入状态 |
| `error` | `{ message: string, code: string }` | 错误信息 |
| `session_updated` | `{ session: Object }` | 会话更新 |

## 错误响应格式

所有API错误响应遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

常见错误码：
- `UNAUTHORIZED` - 未认证
- `FORBIDDEN` - 无权限
- `NOT_FOUND` - 资源不存在
- `VALIDATION_ERROR` - 验证失败
- `SERVER_ERROR` - 服务器错误
- `RATE_LIMIT` - 速率限制

## 注意事项

1. **认证**: 需要认证的端点必须在请求头中包含 `Authorization: Bearer <token>`
2. **CORS**: 开发环境已配置允许 `http://localhost:3000` 跨域访问
3. **速率限制**: API端点有速率限制，默认每IP每分钟60次请求
4. **文件上传**: 支持的图片格式: JPG, PNG, GIF, WebP; 最大文件大小: 5MB
5. **分页**: 列表API支持 `?page=1&limit=20` 参数
6. **搜索**: 部分列表API支持 `?search=keyword` 参数
7. **排序**: 部分列表API支持 `?sort=field&order=asc|desc` 参数

## 环境变量配置

### 后端 (apps/api/.env)
```env
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
```

### 前端 (apps/web/.env.development)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```