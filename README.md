# 宝宝记录 — 婴儿喂养记录与统计分析 App

为家庭用户（爸爸、妈妈、奶奶等）提供的婴儿喂养记录与统计分析 Web 应用。支持多人通过邀请码共享一个宝宝档案，记录喂养、睡眠、尿布、补剂数据，提供周/月统计图表。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + Tailwind CSS + recharts + date-fns + axios + lucide-react |
| 后端 | Node.js 18+ + Express + better-sqlite3 + JWT + bcryptjs |
| 部署 | Nginx + PM2 + Ubuntu 22.04 |

## 功能

- 👨‍👩‍👧 **家庭共享** — 首个用户创建家庭自动生成邀请码，家人通过邀请码加入
- 🍼 **喂养记录** — 配方奶/母乳/瓶喂母乳，预设奶量按钮
- 😴 **睡眠记录** — 手动输入或计时模式（后端持久化，关闭页面不丢状态）
- 🧷 **换尿布** — 嘘嘘/臭臭类型 + 颜色/形状记录 + 红屁屁标记
- 💊 **营养补剂** — 名称/剂量自由输入
- 📊 **统计分析** — 本周/本月切换 + 按角色筛选 + 饼图/折线图
- 📱 **移动优先** — 375-428px 完美适配，圆角卡片柔和风格

## 项目结构

```
baby-tracker/
├── frontend/              # React 前端 (Vite)
│   ├── src/
│   │   ├── components/    # 15 个 UI 组件
│   │   ├── contexts/      # AuthContext, BabyContext, ToastContext
│   │   ├── pages/         # 5 个页面
│   │   ├── services/      # API 封装 (axios)
│   │   └── utils/         # 工具函数
│   └── package.json
├── backend/               # Express 后端
│   ├── routes/            # auth, baby, records, sleep-timer, statistics
│   ├── middleware/         # JWT 认证
│   ├── utils/             # 邀请码生成
│   ├── db.js              # better-sqlite3 数据库初始化
│   ├── index.js           # 入口
│   └── package.json
├── docs/                  # 项目文档
│   ├── requirements.md    # 需求文档
│   ├── architecture.md    # 技术架构
│   ├── design-spec.md     # UI 设计规范
│   ├── api-spec.md        # API 接口规范
│   ├── database-schema.md # 数据库 Schema
│   ├── development-plan.md# 开发计划
│   └── deployment.md     # 部署指南
├── devlog/                # 每日开发日志
├── CLAUDE.md              # AI 助手指引
├── nginx.conf.example     # Nginx 配置示例
├── ecosystem.config.js    # PM2 配置
├── deploy.sh              # 一键部署脚本
└── README.md              # 本文件
```

## 快速开始（本地开发）

### 前置条件
- Node.js 18+
- npm

### 后端

```bash
cd backend
cp .env.example .env
npm install
npm run dev    # 启动在 http://localhost:3001
```

### 前端

```bash
cd frontend
npm install
npm run dev    # 启动在 http://localhost:5173
```

前端开发服务器会自动将 `/api` 请求代理到后端 3001 端口。

## 部署到服务器

### 服务器要求
- Ubuntu 22.04
- 2 vCPU / 1 GB RAM（最低）

### 一键部署

```bash
# 将代码上传到服务器后：
chmod +x deploy.sh
sudo ./deploy.sh
```

### 手动部署

详见 [docs/deployment.md](docs/deployment.md)

### 快速部署步骤

```bash
# 1. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 安装 PM2 和 Nginx
sudo npm install -g pm2
sudo apt install -y nginx sqlite3

# 3. 克隆代码
sudo mkdir -p /opt/baby-tracker
sudo chown -R $USER:$USER /opt/baby-tracker
cd /opt && git clone <your-repo> baby-tracker

# 4. 后端
cd /opt/baby-tracker/backend
npm install
cp .env.example .env
# 编辑 .env 修改 JWT_SECRET

# 5. 前端
cd /opt/baby-tracker/frontend
npm install && npm run build

# 6. 配置 Nginx
sudo cp /opt/baby-tracker/nginx.conf.example /etc/nginx/sites-available/baby-tracker
sudo ln -sf /etc/nginx/sites-available/baby-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 7. 启动后端
cd /opt/baby-tracker
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 按提示执行输出的命令
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册（创建/加入家庭） | ✗ |
| POST | /api/auth/login | 登录 | ✗ |
| GET | /api/baby | 获取婴儿档案 | ✓ |
| PUT | /api/baby | 更新婴儿档案 | ✓ |
| GET | /api/records | 获取记录（按日期/范围） | ✓ |
| POST | /api/records | 添加记录 | ✓ |
| PUT | /api/records/:id | 更新记录 | ✓ |
| DELETE | /api/records/:id | 删除记录 | ✓ |
| DELETE | /api/records/all | 清空所有记录 | ✓ |
| GET | /api/statistics | 统计数据（周/月+角色） | ✓ |
| GET | /api/export | 导出所有记录 | ✓ |
| POST | /api/sleep-timer/start | 开始睡眠计时 | ✓ |
| POST | /api/sleep-timer/stop | 停止睡眠计时 | ✓ |
| GET | /api/sleep-timer/status | 查询计时器状态 | ✓ |
| GET | /api/health | 健康检查 | ✗ |

详见 [docs/api-spec.md](docs/api-spec.md)

## 环境变量

后端 `.env` 文件：

```env
PORT=3001
JWT_SECRET=随机32字符以上的密钥
NODE_ENV=development|production
```

## 许可证

MIT
