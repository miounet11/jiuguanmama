九馆爸爸 — 玩法中心 网站

此目录包含一个静态演示网站，用于集中展示与试玩多种玩法模式，方便内部预览与对接。

目录结构：
- index.html — 主页面
- style.css — 样式
- app.js — 前端逻辑（加载 modes.json 并提供试玩与导出功能）
- modes.json — 玩法数据示例

快速启动（本地预览）：
1. 进入目录：
   cd web
2. 启动一个简单的静态服务器（推荐 Python）：
   macOS 自带 Python，可运行：
   python3 -m http.server 8000
3. 在浏览器打开 http://localhost:8000

后续建议：
- 将 modes.json 存入数据库或后端接口，前端改为调用接口加载。
- 添加用户管理、玩法审核、付费体系与市场功能。
- 提供 SDK 便于游戏客户端直接加载玩法配置。
