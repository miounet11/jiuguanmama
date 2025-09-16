# 九馆爸爸玩法系统 SDK 接入说明

## 玩法数据结构
玩法以 JSON 格式描述，字段如下：
- id: 玩法唯一标识
- name: 玩法名称
- category: 玩法类别
- description: 简要介绍
- rules: 规则数组
- example: 示例数据
- image: 玩法图片
- status: 状态（published/pending）

## API 接口示例
- GET /api/modes.json 获取所有玩法
- GET /api/modes.json?id=mode-1 获取指定玩法
- POST /api/comments.json 提交评论
- GET /api/comments.json?modeId=mode-1 获取玩法评论

## 客户端调用示例（JS）
```js
fetch('/api/modes.json')
  .then(res=>res.json())
  .then(modes=>console.log(modes));
```

## 扩展建议
- 支持 POST/PUT/DELETE 玩法数据（需后端）
- 用户鉴权与权限分级
- 评论、评分、图片上传等接口
