# 部署指南 — 婴儿喂养记录与统计分析 App

## 目标环境

- **服务器**：Google Cloud VM
- **规格**：2 vCPU, 1 GB RAM
- **系统**：Ubuntu 22.04 LTS
- **域名**：（可选，本指南使用 IP 直接访问）

## 服务器环境安装

### 1. 系统更新与基础工具

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx sqlite3
```

### 2. 安装 Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version   # 应为 v18.x.x
npm --version    # 应为 9.x.x 或 10.x.x
```

### 3. 安装 PM2

```bash
sudo npm install -g pm2
pm2 --version  # 验证安装
```

### 4. 配置 Nginx

```bash
# 确认 Nginx 运行
sudo systemctl status nginx

# 备份默认配置
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
```

创建 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/baby-tracker
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name _;  # 替换为你的域名或 IP

    # 前端静态文件
    root /opt/baby-tracker/frontend/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;
    gzip_comp_level 5;

    # 静态资源缓存（30天）
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }

    # SPA fallback - 所有其他请求都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/baby-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # 删除默认站点

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 部署应用

```bash
# 创建应用目录
sudo mkdir -p /opt/baby-tracker
sudo chown -R $USER:$USER /opt/baby-tracker

# 克隆代码（如果使用 Git）
cd /opt && git clone <your-repo-url> baby-tracker

# 或者：手动上传代码到 /opt/baby-tracker

# 后端安装
cd /opt/baby-tracker/backend
npm install

# 配置环境变量
cp .env.example .env
nano .env
```

`.env` 文件内容：

```env
PORT=3001
JWT_SECRET=替换为随机字符串（至少32字符）
NODE_ENV=production
```

生成随机 JWT 密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# 前端安装与构建
cd /opt/baby-tracker/frontend
npm install
npm run build  # 生成 dist 目录
```

### 6. 启动后端（PM2）

```bash
cd /opt/baby-tracker
pm2 start ecosystem.config.js

# 保存 PM2 进程列表（开机自启）
pm2 save

# 设置 PM2 开机自启
pm2 startup
# 运行输出中提示的命令，类似：
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u <user> --hp /home/<user>
```

### 7. 设置文件权限

```bash
# 确保数据库目录可写
sudo chown -R $USER:$USER /opt/baby-tracker/backend
chmod 755 /opt/baby-tracker/backend
```

### 8. 防火墙设置

```bash
# 如果开启了 ufw
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp   # SSH
sudo ufw enable
```

### 9. 验证部署

```bash
# 检查 Nginx
sudo systemctl status nginx

# 检查 PM2 进程
pm2 status

# 检查后端日志
pm2 logs baby-tracker --lines 20

# 浏览器访问
# http://<服务器IP>
```

## 更新部署

每次代码更新后执行：

```bash
cd /opt/baby-tracker
git pull  # 或手动更新代码

# 后端
cd backend && npm install --production && cd ..

# 前端
cd frontend && npm install && npm run build && cd ..

# 重启后端
pm2 restart baby-tracker
```

## 一键部署脚本

项目根目录提供了 `deploy.sh`，在全新服务器上首次部署：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 常用运维命令

```bash
# 查看后端状态
pm2 status

# 查看后端日志（实时）
pm2 logs baby-tracker

# 重启后端
pm2 restart baby-tracker

# 查看后端日志（最近 100 行）
pm2 logs baby-tracker --lines 100 --nostream

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 磁盘空间
df -h

# 内存使用
free -h
pm2 monit  # 实时监控
```

## 数据备份

```bash
# 备份数据库
cp /opt/baby-tracker/backend/baby-tracker.db /opt/backups/baby-tracker-$(date +%Y%m%d).db

# 设置 cron 每日备份
crontab -e
# 添加：
# 0 3 * * * cp /opt/baby-tracker/backend/baby-tracker.db /opt/backups/baby-tracker-$(date +\%Y\%m\%d).db
```

## 故障排查

| 问题 | 检查项 |
|------|--------|
| 502 Bad Gateway | PM2 是否在运行？`pm2 status`；后端 3001 端口是否监听？`curl http://127.0.0.1:3001/api/baby` |
| 404 页面刷新 | Nginx try_files 配置是否正确？ |
| 静态文件 404 | dist 目录是否存在？权限是否正确？ |
| API 500 | 查看 PM2 日志：`pm2 logs baby-tracker` |
| 内存不足 | PM2 monit 查看内存，确认 SQLite WAL 模式已开启 |
| CORS 错误 | 生产环境 Nginx 代理下不会有 CORS；开发环境检查 Vite proxy 配置 |
