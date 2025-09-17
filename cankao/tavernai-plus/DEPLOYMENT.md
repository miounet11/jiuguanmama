# TavernAI Plus 部署指南

## 📋 部署前准备

### 系统要求
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- 内存 >= 2GB
- 磁盘空间 >= 10GB

### 必需的外部服务账号

#### 1. AI 服务（至少配置一个）
- **OpenAI**: 获取 API Key - [platform.openai.com](https://platform.openai.com)
- **Anthropic**: 获取 API Key - [console.anthropic.com](https://console.anthropic.com)
- **Google AI**: 获取 API Key - [makersuite.google.com](https://makersuite.google.com)
- **DeepSeek**: 获取 API Key - [platform.deepseek.com](https://platform.deepseek.com)

#### 2. 支付服务（可选）
- **Stripe**: 用于信用卡支付 - [stripe.com](https://stripe.com)
- **PayPal**: 企业账号 - [developer.paypal.com](https://developer.paypal.com)
- **支付宝**: 企业认证 - [open.alipay.com](https://open.alipay.com)

#### 3. 邮件服务
- 配置 SMTP 服务器（Gmail、SendGrid、腾讯企业邮箱等）

#### 4. OAuth 登录（可选）
- **Google OAuth**: [console.cloud.google.com](https://console.cloud.google.com)
- **Discord OAuth**: [discord.com/developers](https://discord.com/developers)

## 🚀 快速部署

### 方式一：Docker 部署（推荐）

1. **克隆项目**
```bash
git clone https://github.com/yourusername/tavernai-plus.git
cd tavernai-plus
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 编辑配置文件
nano apps/api/.env
```

3. **使用 Docker Compose 启动**
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：手动部署

1. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装子项目依赖
npm run install:all
```

2. **配置数据库**
```bash
# 创建数据库
createdb tavernai_plus

# 运行数据库迁移
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

3. **配置环境变量**

编辑 `apps/api/.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/tavernai_plus?schema=public"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# JWT 配置（已自动生成安全密钥）
JWT_SECRET=b471355f84431d7550d90d9ac89393b5774ced7ba7d80218f79eb0f329443628
JWT_REFRESH_SECRET=01e4463268642b422f81b26cca0224e1ef36a95029b1e76990e0a5a56271103b

# AI 服务配置（根据需要选择）
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx
DEEPSEEK_API_KEY=sk-xxx

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# 支付配置（可选）
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=live

# OAuth 配置（可选）
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
```

4. **构建项目**
```bash
# 构建所有项目
npm run build
```

5. **启动服务**
```bash
# 启动后端服务
cd apps/api
npm start

# 新终端：启动前端服务
cd apps/web
npm run preview
```

## 🔧 生产环境配置

### 1. 使用 PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'tavernai-api',
      script: './apps/api/dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'tavernai-web',
      script: 'npm',
      args: 'run preview',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 2. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL 证书配置

```bash
# 使用 Certbot 获取免费 SSL 证书
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com
```

## 📊 监控与维护

### 健康检查
- API 健康检查端点: `https://yourdomain.com/api/health`
- 前端健康检查: `https://yourdomain.com/`

### 日志位置
- API 日志: `apps/api/logs/`
- PM2 日志: `~/.pm2/logs/`
- Nginx 日志: `/var/log/nginx/`

### 备份策略
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump tavernai_plus > backup_$DATE.sql
# 上传到云存储...
```

### 监控工具推荐
- **Grafana + Prometheus**: 系统监控
- **Sentry**: 错误追踪
- **New Relic**: 应用性能监控

## 🔐 安全建议

1. **密钥管理**
   - 使用环境变量或密钥管理服务
   - 定期轮换 API 密钥和 JWT 密钥
   - 不要将密钥提交到版本控制

2. **数据库安全**
   - 使用强密码
   - 限制数据库访问 IP
   - 定期备份数据

3. **API 安全**
   - 启用速率限制
   - 使用 HTTPS
   - 实施 CORS 策略
   - 添加 API 密钥验证

4. **更新维护**
   - 定期更新依赖包
   - 监控安全公告
   - 执行安全审计

## 🆘 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 PostgreSQL 是否运行
   - 验证 DATABASE_URL 配置
   - 确认数据库用户权限

2. **邮件发送失败**
   - 检查 SMTP 配置
   - 验证邮箱授权码（非密码）
   - 查看防火墙端口

3. **支付回调失败**
   - 配置 Webhook URL
   - 验证签名密钥
   - 检查 HTTPS 证书

4. **WebSocket 连接失败**
   - 检查 Nginx 配置
   - 验证 CORS 设置
   - 确认防火墙规则

### 调试命令
```bash
# 检查服务状态
pm2 status

# 查看实时日志
pm2 logs tavernai-api

# 测试数据库连接
npx prisma db push --dry-run

# 测试邮件发送
node -e "require('./apps/api/dist/services/email').emailService.sendTestEmail('test@example.com')"
```

## 📚 相关文档

- [API 文档](./docs/API.md)
- [配置说明](./docs/CONFIG.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [更新日志](./CHANGELOG.md)

## 💬 获取帮助

- GitHub Issues: [github.com/yourusername/tavernai-plus/issues](https://github.com/yourusername/tavernai-plus/issues)
- 邮箱支持: support@yourdomain.com
- 社区论坛: [community.yourdomain.com](https://community.yourdomain.com)

---

**注意**: 首次部署建议先在测试环境验证，确保所有功能正常后再部署到生产环境。