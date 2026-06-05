# 分阶段开发计划 — 婴儿喂养记录与统计分析 App

## 总览

| 里程碑 | 名称 | 预计文件数 | 依赖 |
|--------|------|-----------|------|
| M0 | 项目基础设施 | ~10 | 无 |
| M1 | 后端核心 | ~6 | M0 |
| M2 | 后端记录与统计 | ~4 | M1 |
| M3 | 前端基础 | ~8 | M0 |
| M4 | 前端认证与导航 | ~5 | M3 + M1 |
| M5 | 前端核心功能 | ~12 | M4 + M2 |
| M6 | 前端统计与设置 | ~9 | M5 |
| M7 | 部署配置 | ~5 | M6 + M2 |

### 第2轮修改 ✅

| 修改项 | 内容 |
|--------|------|
| 喂养记录 | 新增开始/结束吃奶时间，摘要显示时长 |
| 睡眠计时 | 计时模式默认选中、临时卡片+宝宝醒了按钮、计时中恢复、醒后预填并保存 |
| 统一时间选择器 | 底部滚轮 DateTimePicker（react-mobile-picker）替换所有 datetime-local |
| 补剂重构 | 多补剂卡片+用量数字键盘弹层+快捷按钮+最近添加、后端兼容新旧格式 |
| 上次提示 | 所有表单顶部显示上次记录距今时间 |
| 记录卡片 | 睡眠显示时间范围副标题、计时中动态刷新+蓝色高亮 |

---

## 里程碑 0：项目基础设施

**目标**：搭建完整项目骨架，建立标准和规范，不写任何业务代码。

### 步骤

| # | 步骤 | 产出物 | 状态 |
|---|------|--------|------|
| 0.1 | 创建目录结构 | frontend/, backend/, docs/, devlog/ 目录 | ✅ |
| 0.2 | 编写 CLAUDE.md | CLAUDE.md — 项目指引 | ✅ |
| 0.3 | 编写需求文档 | docs/requirements.md | ✅ |
| 0.4 | 编写技术架构文档 | docs/architecture.md | ✅ |
| 0.5 | 编写 UI 设计规范 | docs/design-spec.md | ✅ |
| 0.6 | 编写 API 接口规范 | docs/api-spec.md | ✅ |
| 0.7 | 编写数据库表结构文档 | docs/database-schema.md | ✅ |
| 0.8 | 编写开发计划 | docs/development-plan.md（本文件） | 🔄 |
| 0.9 | 编写部署指南 | docs/deployment.md | ⬜ |
| 0.10 | 创建今日 devlog | devlog/2026-06-04.md | ⬜ |

---

## 里程碑 1：后端核心（数据库 + 认证 + 婴儿档案）

**目标**：后端项目可运行，认证系统可用，婴儿档案 API 可调。

**依赖**：M0 完成

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 1.1 | 初始化 backend 项目 | `backend/package.json`, `backend/.env.example` | `npm install` 成功，无报错 |
| 1.2 | 实现数据库初始化 | `backend/db.js` | 启动后生成 .db 文件，5 张表存在，WAL 模式开启 |
| 1.3 | 实现邀请码生成工具 | `backend/utils/invite.js` | 生成 6 位，无易混淆字符 |
| 1.4 | 实现 JWT 认证中间件 | `backend/middleware/auth.js` | curl 无 token → 401，带 token → 放行 |
| 1.5 | 实现 auth 路由 | `backend/routes/auth.js` | curl 注册 → 返回 token + user + baby；curl 登录 → 返回 token |
| 1.6 | 实现 baby 路由 | `backend/routes/baby.js` | curl GET → 返回婴儿档案；curl PUT → 更新成功 |
| 1.7 | 实现 Express 入口 | `backend/index.js` | `node index.js` 启动，监听 3001 端口 |
| 1.8 | 里程碑 1 验证 | 全部接口 | curl 脚本逐接口测试通过 |

---

## 里程碑 2：后端记录与统计（记录 CRUD + 计时器 + 统计）

**目标**：所有 14 个后端 API 可用。

**依赖**：M1 完成

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 2.1 | 实现 records 路由（GET） | `backend/routes/records.js` | curl 按日期查询，返回空数组 |
| 2.2 | 实现 records 路由（POST/PUT/DELETE） | `backend/routes/records.js` | curl 增→查→改→查→删→查 完整流程 |
| 2.3 | 实现 sleep-timer 路由 | `backend/routes/sleep-timer.js` | curl start → status → stop → status 流程 |
| 2.4 | 实现 statistics 路由 | `backend/routes/statistics.js` | curl 周/月 + 角色筛选，验证返回数据结构 |
| 2.5 | 实现 export + 清空 | `backend/routes/records.js` 补充 | curl 导出 JSON；curl 清空（带 confirm） |
| 2.6 | 里程碑 2 验证 | 全部 14 个接口 | curl 脚本全接口测试通过 |

---

## 里程碑 3：前端基础（项目搭建 + 服务层 + Context）

**目标**：前端项目可启动，API 服务层和状态管理就绪。

**依赖**：M0 完成（不需要后端也可搭建框架）

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 3.1 | 初始化 frontend 项目 | `package.json`, `vite.config.js`, `index.html` | `npm run dev` 启动成功 |
| 3.2 | 配置 Tailwind | `tailwind.config.js`, `postcss.config.js`, `src/index.css` | 编写测试页，自定义色系渲染正确 |
| 3.3 | 编写工具函数 | `src/utils/date.js`, `constants.js`, `format.js` | 单元测试（手动导入验证） |
| 3.4 | 编写 API 服务层 | `src/services/api.js` | 导入不报错，拦截器逻辑正确 |
| 3.5 | 编写 3 个 Context | `src/contexts/AuthContext.jsx`, `BabyContext.jsx`, `ToastContext.jsx` | React DevTools 查看 Context 值 |
| 3.6 | 编写通用组件 | `src/components/Toast.jsx`, `LoadingSpinner.jsx` | 渲染测试 |
| 3.7 | 编写入口文件 | `src/main.jsx` | 应用启动不报错 |
| 3.8 | 里程碑 3 验证 | 前端启动 | `npm run dev` 后浏览器能看到页面 |

---

## 里程碑 4：前端认证与导航（登录注册 + 路由 + TabBar）

**目标**：用户可以注册、登录、看到底部导航栏。

**依赖**：M3（前端基础）+ M1（后端认证 API）

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 4.1 | 实现路由配置 + ProtectedRoute | `src/App.jsx` | 未登录访问 / 跳转 /login |
| 4.2 | 实现 LoginPage | `src/pages/LoginPage.jsx` | 登录 → token 存 localStorage → 跳转首页 |
| 4.3 | 实现 RegisterPage | `src/pages/RegisterPage.jsx` | 创建家庭/邀请加入 两种模式均可注册 |
| 4.4 | 实现 Layout + TabBar | `src/components/Layout.jsx` | 三个 Tab 切换，激活态高亮 |
| 4.5 | 里程碑 4 验证 | 端到端 | 注册 → 登录 → 看到首页（含 TabBar） |

---

## 里程碑 5：前端核心功能（时间轴 + 表单 + 记录管理）

**目标**：用户可以添加、查看、编辑、删除各类记录。

**依赖**：M4（前端认证导航）+ M2（后端记录 API）

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 5.1 | 实现 DateSwitcher | `src/components/DateSwitcher.jsx` | 今日/昨日/日历切换正常 |
| 5.2 | 实现 TimelinePage 骨架 | `src/pages/TimelinePage.jsx` | 显示宝宝昵称+月龄+日期切换器+空状态 |
| 5.3 | 实现 RecordItem | `src/components/RecordItem.jsx` | 4 种类型记录正确渲染 |
| 5.4 | 实现 FloatingAddBtn | `src/components/FloatingAddBtn.jsx` | 弹出底部菜单，4 个选项 |
| 5.5 | 实现 FeedingForm | `src/components/FeedingForm.jsx` | 添加喂养记录 → 列表刷新 |
| 5.6 | 实现 DiaperForm | `src/components/DiaperForm.jsx` | 颜色/形状联动显示，添加→刷新 |
| 5.7 | 实现 SupplementForm | `src/components/SupplementForm.jsx` | 添加补剂记录 → 列表刷新 |
| 5.8 | 实现 SleepForm | `src/components/SleepForm.jsx` | 手动模式+计时器模式均可保存 |
| 5.9 | 实现编辑/删除 | 在 RecordItem + TimelinePage 中 | 编辑保存→刷新；删除确认→刷新 |
| 5.10 | 里程碑 5 验证 | 端到端 | 添加 4 类记录 → 列表显示 → 编辑 → 删除 |

---

## 里程碑 6：前端统计与设置（图表 + 个人中心）

**目标**：统计图表可用，个人设置功能可用。

**依赖**：M5（前端核心功能）

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 6.1 | 实现 StatCard | `src/components/StatCard.jsx` | 数字卡片渲染 |
| 6.2 | 实现 FeedingStats | `src/components/FeedingStats.jsx` | 饼图 + 卡片显示正确 |
| 6.3 | 实现 SleepStats | `src/components/SleepStats.jsx` | 折线图 + 卡片显示正确 |
| 6.4 | 实现 DiaperStats | `src/components/DiaperStats.jsx` | 饼图 + 卡片显示正确 |
| 6.5 | 实现 SupplementStats | `src/components/SupplementStats.jsx` | 按名称统计显示 |
| 6.6 | 实现 StatsPage | `src/pages/StatsPage.jsx` | 周/月切换 + 角色筛选正常 |
| 6.7 | 实现 ProfilePage | `src/pages/ProfilePage.jsx` | 修改宝宝、邀请码、导出、清空、退出 |
| 6.8 | 里程碑 6 验证 | 端到端 | 统计数据正确，个人设置各功能正常 |

---

## 里程碑 7：部署配置与文档

**目标**：可以在服务器上一键部署并访问。

**依赖**：M6（前端完成）+ M2（后端完成）

### 步骤

| # | 步骤 | 文件 | 验证方式 |
|---|------|------|----------|
| 7.1 | 编写 nginx.conf.example | `nginx.conf.example` | `nginx -t` 语法检查 |
| 7.2 | 编写 ecosystem.config.js | `ecosystem.config.js` | `pm2 start ecosystem.config.js` 启动成功 |
| 7.3 | 编写 deploy.sh | `deploy.sh` | 脚本执行无报错 |
| 7.4 | 编写 README.md | `README.md` | 按文档操作能完成部署 |
| 7.5 | 最终端到端验证 | 全部 | 完整流程走通，移动端适配检查 |
| 7.6 | 里程碑 7 验证 | 生产环境 | 浏览器访问服务器 IP → 功能完整可用 |

---

## 依赖关系图

```
M0（基础设施）────────────┬──────────────┐
                          │              │
                          ▼              ▼
                    M1（后端核心）   M3（前端基础）
                          │              │
                          ▼              │
                    M2（后端记录统计）    │
                          │              │
                          └──────┬───────┘
                                 │
                                 ▼
                          M4（前端认证导航）
                                 │
                                 ▼
                          M5（前端核心功能）
                                 │
                                 ▼
                          M6（前端统计设置）
                                 │
                                 ▼
                          M7（部署配置）
```

---

## 状态标记说明

| 标记 | 含义 |
|------|------|
| ⬜ | 未开始 |
| 🔄 | 进行中 |
| ✅ | 已完成 |
| ⚠️ | 有问题阻塞 |
| ❌ | 已取消 |
