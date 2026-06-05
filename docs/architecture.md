# 技术架构文档 — 婴儿喂养记录与统计分析 App

## 整体架构

```
┌────────────────────────────────────────────────┐
│                   客户端                         │
│  浏览器 (Mobile First 375-428px)                │
│  React 18 SPA (Vite 构建)                       │
│  ├── Tailwind CSS (UI 样式)                     │
│  ├── recharts (统计图表)                         │
│  ├── date-fns (日期处理)                         │
│  ├── axios (HTTP 客户端)                         │
│  └── lucide-react (图标库)                      │
└──────────────┬─────────────────────────────────┘
               │ HTTP (JSON)
               │ Authorization: Bearer <JWT>
               ▼
┌────────────────────────────────────────────────┐
│              Nginx (:80)                        │
│  ├── /*      → frontend/dist (静态文件)          │
│  └── /api/*  → http://127.0.0.1:3001 (代理)    │
└──────────────┬─────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────┐
│         Express Server (:3001)                  │
│  ├── cors, express.json(), rate-limit          │
│  ├── JWT 认证中间件                             │
│  ├── Routes:                                    │
│  │   ├── /api/auth/*     (认证)                │
│  │   ├── /api/baby/*     (婴儿档案)             │
│  │   ├── /api/records/*  (记录CRUD)            │
│  │   ├── /api/statistics (统计分析)             │
│  │   └── /api/sleep-timer/* (睡眠计时器)        │
│  └── better-sqlite3 (同步SQLite驱动)            │
└──────────────┬─────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────┐
│         SQLite (baby-tracker.db)                │
│  WAL 模式 | 文件存储 | 5 张表                    │
│  families | users | babies | records |          │
│  sleep_timer                                    │
└────────────────────────────────────────────────┘
```

## 技术选型理由

| 技术 | 理由 |
|------|------|
| **Vite** | 极快 HMR，原生 ESM，构建快于 Webpack |
| **Tailwind CSS** | 原子化 CSS，移动优先，体积小，开发效率高 |
| **recharts** | React 原生图表库，API 简洁，支持饼图/折线图/柱状图 |
| **date-fns** | Tree-shakeable，函数式日期处理，无全局副作用 |
| **lucide-react** | 轻量图标库，Tree-shakeable，风格统一 |
| **better-sqlite3** | 同步 API 更简单，比 sqlite3 内存效率高，适合单服务器 |
| **JWT 永不过期** | 简化 token 刷新逻辑，家庭应用安全要求较低 |
| **PM2** | Node.js 生产级进程管理，自动重启，负载监控 |

## 数据流

### 认证流程
```
注册: 前端 → POST /api/auth/register (username+password+role+inviteCode?)
             → 后端创建 user + family(或加入) + baby(如新建家庭)
             → 返回 JWT → 前端存 localStorage → 跳转首页

登录: 前端 → POST /api/auth/login (username+password)
           → 验证密码 → 返回 JWT → 前端存 localStorage → 跳转首页

后续请求: axios 拦截器自动从 localStorage 读取 token
          → Authorization: Bearer <token>
          → auth 中间件验证 → req.user = {userId, familyId, role}
```

### 记录 CUD 流程
```
添加: 前端表单 → POST /api/records {type, timestamp, data}
                 → 后端验证 → INSERT → 返回新记录
                 → 前端刷新时间轴列表

编辑: 前端表单 → PUT /api/records/:id {type, timestamp, data}
                 → 后端验证归属 → UPDATE → 返回更新后记录
                 → 前端刷新时间轴列表

删除: 前端确认 → DELETE /api/records/:id
                 → 后端验证归属 → DELETE → 返回成功
                 → 前端从列表移除
```

### 统计查询流程
```
前端: 选择周期(周/月) + 角色筛选
      → GET /api/statistics?period=week&date=2026-06-04&roleFilter=all
      → 后端计算起止日期 → 查询 records 表
      → 按 type 分组聚合 → 返回结构化统计数据
      → recharts 渲染图表
```

## 目录结构

```
baby-tracker/
├── CLAUDE.md                        # AI 助手指引
├── README.md                        # 项目说明 + 部署步骤
├── deploy.sh                        # 一键部署脚本
├── ecosystem.config.js              # PM2 配置
├── nginx.conf.example               # Nginx 配置示例
│
├── docs/                            # 项目文档
│   ├── requirements.md
│   ├── architecture.md
│   ├── design-spec.md
│   ├── api-spec.md
│   ├── database-schema.md
│   ├── development-plan.md
│   └── deployment.md
│
├── devlog/                          # 每日开发日志
│   └── YYYY-MM-DD.md
│
├── backend/                         # Express 后端
│   ├── package.json
│   ├── .env.example
│   ├── index.js                     # 服务入口
│   ├── db.js                        # 数据库初始化
│   ├── routes/
│   │   ├── auth.js
│   │   ├── baby.js
│   │   ├── records.js
│   │   ├── statistics.js
│   │   └── sleep-timer.js
│   ├── middleware/
│   │   └── auth.js
│   └── utils/
│       └── invite.js
│
└── frontend/                        # React 前端
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── DateSwitcher.jsx
        │   ├── RecordItem.jsx
        │   ├── EmptyState.jsx
        │   ├── FloatingAddBtn.jsx
        │   ├── FeedingForm.jsx
        │   ├── SleepForm.jsx
        │   ├── DiaperForm.jsx
        │   ├── SupplementForm.jsx
        │   ├── StatCard.jsx
        │   ├── FeedingStats.jsx
        │   ├── SleepStats.jsx
        │   ├── DiaperStats.jsx
        │   ├── SupplementStats.jsx
        │   ├── Toast.jsx
        │   └── LoadingSpinner.jsx
        ├── contexts/
        │   ├── AuthContext.jsx
        │   ├── BabyContext.jsx
        │   └── ToastContext.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── TimelinePage.jsx
        │   ├── StatsPage.jsx
        │   └── ProfilePage.jsx
        ├── services/
        │   └── api.js
        └── utils/
            ├── date.js
            ├── constants.js
            └── format.js
```

## 性能优化策略

| 层 | 策略 | 说明 |
|----|------|------|
| SQLite | WAL 模式 | 读写并发提升 |
| SQLite | 索引优化 | family_id + timestamp 复合索引 |
| Node.js | --max-old-space-size=512 | 限制堆内存 |
| PM2 | max-memory-restart 800M | 内存超限自动重启 |
| Nginx | gzip on | 压缩静态资源 |
| Nginx | location /assets/ 缓存 | 静态资源 30 天缓存 |
| 前端 | Vite code split | 按路由懒加载 |
| 前端 | date-fns tree-shaking | 只导入使用的函数 |
