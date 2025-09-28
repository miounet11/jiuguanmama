// 添加到 server.ts 的导入路由部分
// 在 multimodalRoutes 导入之后添加：
import characterImageRoutes from './routes/character-image'

// 在路由注册部分添加：
// 在 app.use('/api/multimodal', multimodalRoutes) 之后添加：
app.use('/api', characterImageRoutes) // 角色图片生成 API

// 这样就完成了路由集成
console.log('Character image routes integrated successfully!');
