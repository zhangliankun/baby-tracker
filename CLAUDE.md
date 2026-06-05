# CLAUDE.md — 婴儿喂养记录与统计分析 App

## 项目简介

为家庭用户（爸爸、妈妈、奶奶等）提供的婴儿喂养记录与统计分析 Web 应用。支持家庭共享模式，多人协作记录喂养、睡眠、尿布、补剂数据，提供周/月统计图表，部署到谷歌云 2c1g 服务器。

## 文档索引导航

| 文档 | 路径 | 说明 |
|------|------|------|
| 需求文档 | [docs/requirements.md](docs/requirements.md) | 用户故事、功能清单、业务规则 |
| 技术架构 | [docs/architecture.md](docs/architecture.md) | 技术选型、架构图、数据流 |
| UI 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 色系、字体、组件样式、布局 |
| API 接口规范 | [docs/api-spec.md](docs/api-spec.md) | 15 个 API 端点详细定义 |
| 数据库 Schema | [docs/database-schema.md](docs/database-schema.md) | 表结构、索引、字段说明 |
| 开发计划 | [docs/development-plan.md](docs/development-plan.md) | 里程碑、步骤分解、依赖关系 |
| 部署指南 | [docs/deployment.md](docs/deployment.md) | 服务器部署步骤、脚本说明 |
| 开发日志 | [devlog/](devlog/) | 每日开发日志（YYYY-MM-DD.md） |

## 当前开发状态

- **项目状态**：✅ 全部 7 个里程碑完成，可直接部署
- **最后更新**：2026-06-04
- **构建**：前端 `npm run build` — 3,107 模块，750KB JS (gzip 217KB)，25KB CSS (gzip 4.9KB)，0 错误

## 工作约定

### 每次开发前
1. 查看 [devlog/](devlog/) 中最新的日志文件，了解当前进度和待办事项
2. 阅读相关 docs 文档了解当前设计规范
3. 确认没有未解决的阻塞问题

### 每次开发后
1. 更新或创建当日的 devlog 文件
2. 如果 API 有变更，同步更新 [docs/api-spec.md](docs/api-spec.md)
3. 如果 UI 有变更，对照 [docs/design-spec.md](docs/design-spec.md) 检查一致性

### 开发原则
1. **小步推进**：每个步骤完成后立即验证，不堆积问题
2. **每步验证**：后端用 curl 测试，前端用浏览器验证
3. **遵循规范**：UI 严格对照设计规范，API 严格对照接口规范
4. **代码风格**：
   - 后端：Node.js CommonJS（`require` / `module.exports`）
   - 前端：React ES Module（`import` / `export`）

### Devlog 模板

```markdown
# 开发日志 — YYYY-MM-DD

## 今日完成
- [ ] 事项 1
- [ ] 事项 2

## 待办事项
- [ ] 事项 A
- [ ] 事项 B

## 遇到的问题
- 问题描述 + 解决方案

## 当前状态
- 里程碑：X
- 下一步：XXX
```

## 技术栈速查

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + Tailwind CSS + recharts + date-fns + axios + lucide-react + react-mobile-picker |
| 后端 | Node.js 18+ + Express + sql.js (SQLite WASM) + JWT + bcryptjs |
| 部署 | Nginx + PM2 + Ubuntu 22.04 + Google Cloud (2c1g) |

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 多用户模型 | 家庭共享模式 | 引入 Family 表，邀请码机制 |
| JWT 策略 | 永不过期 | 简化用户体验 |
| 睡眠计时器 | 后端持久化（sleep_timer API） | 关页面/刷新后仍保持计时状态 |
| 数据库 | sql.js (SQLite WASM) | 跨平台无需编译，生产 Ubuntu 同样运行 |
| 密码加密 | bcryptjs | 纯 JS 实现，跨平台 |
| UI 色系 | 柔和暖色（柔粉橘+暖黄 #FF9A8B） | 母婴场景亲和力 |
| 时间选择器 | react-mobile-picker（底部滚轮） | 移动端原生体验 |
| 补剂记录 | supplements 数组 | 一次可记多种补剂 |

## 前端组件索引

| 组件 | 文件 | 说明 |
|------|------|------|
| Layout | [src/components/Layout.jsx](frontend/src/components/Layout.jsx) | 底部 TabBar 导航 |
| DateTimePicker | [src/components/DateTimePicker.jsx](frontend/src/components/DateTimePicker.jsx) | 底部滚轮时间选择器 |
| DateSwitcher | [src/components/DateSwitcher.jsx](frontend/src/components/DateSwitcher.jsx) | 日期切换器 |
| RecordItem | [src/components/RecordItem.jsx](frontend/src/components/RecordItem.jsx) | 时间轴记录卡片 |
| FloatingAddBtn | [src/components/FloatingAddBtn.jsx](frontend/src/components/FloatingAddBtn.jsx) | 浮动添加按钮 |
| FeedingForm | [src/components/FeedingForm.jsx](frontend/src/components/FeedingForm.jsx) | 喂养表单 |
| SleepForm | [src/components/SleepForm.jsx](frontend/src/components/SleepForm.jsx) | 睡眠表单（计时+手动） |
| DiaperForm | [src/components/DiaperForm.jsx](frontend/src/components/DiaperForm.jsx) | 尿布表单 |
| SupplementForm | [src/components/SupplementForm.jsx](frontend/src/components/SupplementForm.jsx) | 补剂表单（多卡片） |
| StatCard | [src/components/StatCard.jsx](frontend/src/components/StatCard.jsx) | 统计数字卡片 |
| FeedingStats | [src/components/FeedingStats.jsx](frontend/src/components/FeedingStats.jsx) | 喂养统计面板 |
| SleepStats | [src/components/SleepStats.jsx](frontend/src/components/SleepStats.jsx) | 睡眠统计面板 |
| DiaperStats | [src/components/DiaperStats.jsx](frontend/src/components/DiaperStats.jsx) | 尿布统计面板 |
| SupplementStats | [src/components/SupplementStats.jsx](frontend/src/components/SupplementStats.jsx) | 补剂统计面板 |
| Toast | [src/components/Toast.jsx](frontend/src/components/Toast.jsx) | Toast 提示 |
| LoadingSpinner | [src/components/LoadingSpinner.jsx](frontend/src/components/LoadingSpinner.jsx) | 加载指示 |
| EmptyState | [src/components/EmptyState.jsx](frontend/src/components/EmptyState.jsx) | 空状态提示 |

## 后端路由索引

| 路由 | 文件 | 说明 |
|------|------|------|
| auth | [routes/auth.js](backend/routes/auth.js) | 注册（创建/加入家庭）+ 登录 |
| baby | [routes/baby.js](backend/routes/baby.js) | 婴儿档案 CRUD |
| records | [routes/records.js](backend/routes/records.js) | 记录 CRUD + 清空 |
| sleep-timer | [routes/sleep-timer.js](backend/routes/sleep-timer.js) | 睡眠计时器 start/stop/status |
| statistics | [routes/statistics.js](backend/routes/statistics.js) | 周/月统计 + 角色筛选 |
