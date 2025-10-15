# TavernAI Plus 生产环境部署指南

## 📋 域名绑定配置

### 前端域名: https://www.isillytavern.com
### API域名: https://api.isillytavern.com

## 🔧 已完成的配置

### 1. 前端环境配置 ✅
- **文件**: `apps/web/.env`
- **API URL**: `https://api.isillytavern.com`
- **状态**: 已创建并配置

### 2. 后端CORS配置 ✅
- **文件**: `apps/api/src/server.ts`
- **允许域名**:
  - `https://www.isillytavern.com` (前端)
  - `https://api.isillytavern.com` (API自身)
- **状态**: 已更新并允许跨域访问

### 3. Nginx配置 ✅
- **前端配置**: `nginx-config/frontend.conf`
- **API配置**: `nginx-config/api.conf`
- **功能**: HTTPS重定向、SSL证书、反向代理、CORS支持

## 🚀 生产环境部署步骤

### 步骤1: 安装Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 步骤2: 配置SSL证书
```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx

# 获取前端证书
sudo certbot --nginx -d www.isillytavern.com

# 获取API证书
sudo certbot --nginx -d api.isillytavern.com
```

### 步骤3: 部署Nginx配置
```bash
# 复制配置文件到Nginx目录
sudo cp nginx-config/frontend.conf /etc/nginx/sites-available/www.isillytavern.com
sudo cp nginx-config/api.conf /etc/nginx/sites-available/api.isillytavern.com

# 启用站点
sudo ln -s /etc/nginx/sites-available/www.isillytavern.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.isillytavern.com /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 步骤4: 启动应用服务
```bash
# 确保应用正在运行
cd /www/wwwroot/jiuguanmama/cankao/tavernai-plus

# 启动服务（如果还没启动）
./quick-start.sh

# 或使用PM2管理
npm install -g pm2
pm2 start ./start.sh --name "tavernai-plus"
pm2 save
pm2 startup
```

### 步骤5: 配置防火墙
```bash
# 只开放必要的端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## 🔍 验证部署

### 测试前端访问
```bash
curl -I https://www.isillytavern.com
# 应该返回 200 OK
```

### 测试API访问
```bash
curl -I https://api.isillytavern.com/health
# 应该返回 200 OK 和 JSON 数据
```

### 测试跨域访问
```bash
# 从前端域名访问API
curl -H "Origin: https://www.isillytavern.com" \
     https://api.isillytavern.com/health
# 应该包含 CORS 头部
```

## ⚠️ 重要注意事项

### 1. SSL证书更新
Let's Encrypt证书有效期为90天，设置自动续期：
```bash
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 应用重启
配置更改后需要重启应用：
```bash
# 如果使用PM2
pm2 restart tavernai-plus

# 如果使用直接运行
pkill -f "node.*server"
./quick-start.sh
```

### 3. 监控日志
```bash
# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志（如果使用PM2）
pm2 logs tavernai-plus
```

### 4. 备份策略
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 apps/api/dev.db ".backup backup_$DATE.db"
# 上传到云存储...
```

## 🔧 故障排除

### 前端无法访问
1. 检查Nginx配置：`sudo nginx -t`
2. 检查SSL证书：`sudo certbot certificates`
3. 检查应用运行状态：`ps aux | grep node`

### API无法访问
1. 检查API端口：`netstat -tlnp | grep 3001`
2. 检查CORS配置：查看浏览器开发者工具
3. 检查API健康：`curl http://localhost:3001/health`

### HTTPS不工作
1. 检查证书有效性：`openssl s_client -connect www.isillytavern.com:443`
2. 检查Nginx SSL配置：`sudo nginx -T | grep ssl`

## 📊 性能优化

### Nginx优化配置
```nginx
# 添加到 /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 缓存设置
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### 应用性能监控
- 使用PM2监控：`pm2 monit`
- 添加应用指标监控
- 配置日志轮转

---

## 📞 技术支持

如遇到部署问题，请提供：
1. 错误日志
2. 配置文件内容
3. 网络连接测试结果
4. 系统信息：`uname -a`

**部署完成后，用户可以通过以下地址访问：**
- 🌐 前端: https://www.isillytavern.com
- 🔧 API: https://api.isillytavern.com
