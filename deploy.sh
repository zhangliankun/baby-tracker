#!/bin/bash
# ===============================================
# 婴儿喂养记录 App — 一键部署脚本
# 适用环境：Ubuntu 22.04, 2c1g
# 用法：chmod +x deploy.sh && sudo ./deploy.sh
# ===============================================

set -e

APP_DIR="/opt/baby-tracker"
NODE_VERSION="18"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "====================================="
echo "  婴儿喂养记录 App — 一键部署脚本"
echo "====================================="
echo -e "${NC}"

# ---- 1. 系统更新 ----
echo -e "${YELLOW}[1/8] 更新系统包...${NC}"
sudo apt update && sudo apt upgrade -y

# ---- 2. 安装基础工具 ----
echo -e "${YELLOW}[2/8] 安装基础工具...${NC}"
sudo apt install -y curl git nginx sqlite3 certbot python3-certbot-nginx

# ---- 3. 安装 Node.js ----
echo -e "${YELLOW}[3/8] 安装 Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js $(node -v)"
echo "npm $(npm -v)"

# ---- 4. 安装 PM2 ----
echo -e "${YELLOW}[4/8] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "PM2 $(pm2 -v)"

# ---- 5. 创建目录 ----
echo -e "${YELLOW}[5/8] 创建应用目录...${NC}"
sudo mkdir -p "$APP_DIR"
sudo mkdir -p /var/log/baby-tracker
sudo chown -R $USER:$USER "$APP_DIR"
sudo chown -R $USER:$USER /var/log/baby-tracker

# ---- 6. 安装依赖 & 构建 ----
echo -e "${YELLOW}[6/8] 安装依赖 & 构建...${NC}"

# 如果当前脚本目录有代码则复制，否则提示
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    echo "复制项目文件到 $APP_DIR ..."
    sudo cp -r "$SCRIPT_DIR"/* "$APP_DIR/"
    sudo chown -R $USER:$USER "$APP_DIR"
fi

# 后端
cd "$APP_DIR/backend"
npm install --production

# 生成 .env 文件
if [ ! -f "$APP_DIR/backend/.env" ]; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    cat > "$APP_DIR/backend/.env" << EOF
PORT=3001
JWT_SECRET=${JWT_SECRET}
NODE_ENV=production
EOF
    echo -e "${GREEN}已生成 JWT_SECRET${NC}"
fi

# 前端
cd "$APP_DIR/frontend"
npm install
npm run build

# ---- 7. 配置 Nginx ----
echo -e "${YELLOW}[7/8] 配置 Nginx...${NC}"
if [ -f "$APP_DIR/nginx.conf.example" ]; then
    sudo cp "$APP_DIR/nginx.conf.example" /etc/nginx/sites-available/baby-tracker
fi
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/baby-tracker /etc/nginx/sites-enabled/baby-tracker

# 测试配置
if sudo nginx -t 2>&1; then
    sudo systemctl restart nginx
    echo -e "${GREEN}Nginx 配置成功${NC}"
else
    echo -e "${RED}Nginx 配置有误，请检查${NC}"
    exit 1
fi

# ---- 8. 启动后端 ----
echo -e "${YELLOW}[8/8] 启动后端服务...${NC}"
cd "$APP_DIR"
pm2 stop baby-tracker 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 设置 PM2 开机自启
if ! pm2 startup 2>/dev/null | grep -q "already"; then
    pm2 startup
    echo -e "${YELLOW}请运行上面输出的 sudo 命令以启用 PM2 开机自启${NC}"
fi

# ---- 完成 ----
echo ""
echo -e "${GREEN}====================================="
echo "  部署完成！"
echo "=====================================${NC}"
echo ""
echo "  访问地址：http://$(hostname -I | awk '{print $1}')"
echo ""
echo "  常用命令："
echo "    pm2 status              # 查看服务状态"
echo "    pm2 logs baby-tracker   # 查看后端日志"
echo "    pm2 restart baby-tracker # 重启服务"
echo "    sudo nginx -t           # 测试 Nginx 配置"
echo "    sudo systemctl reload nginx # 重载 Nginx"
echo ""
echo "  数据备份："
echo "    cp $APP_DIR/backend/baby-tracker.db /opt/backups/baby-tracker-\$(date +%Y%m%d).db"
echo ""
