// 加载环境变量（必须在最前面）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 路由
const authRoutes = require('./routes/auth');
const babyRoutes = require('./routes/baby');
const recordsRoutes = require('./routes/records');
const sleepTimerRoutes = require('./routes/sleep-timer');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 3001;

// --- 全局中间件 ---

// CORS（开发环境允许所有来源）
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false  // 生产环境由 Nginx 统一处理
    : 'http://localhost:5173',  // Vite 默认开发端口
  credentials: true,
}));

// JSON 解析
app.use(express.json({ limit: '1mb' }));

// 请求限流（全局）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 500,                    // 最大 500 次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
});
app.use(limiter);

// Auth 接口严格限流：15 分钟最多 20 次登录/注册尝试
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '登录尝试过于频繁，请 15 分钟后再试' },
});
app.use('/api/auth', authLimiter);

// 健康检查（无需认证）
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: Date.now() } });
});

// --- 挂载路由 ---
app.use('/api/auth', authRoutes);
app.use('/api/baby', babyRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/sleep-timer', sleepTimerRoutes);
app.use('/api/statistics', statisticsRoutes);

// Export 路由（挂载在 records 路由中处理）
const { getDb, queryAll } = require('./db');
app.get('/api/export', require('./middleware/auth').authMiddleware, async (req, res) => {
  try {
    getDb();
    const records = queryAll(
      'SELECT id, user_role, type, timestamp, data_json, created_at FROM records WHERE family_id = ? ORDER BY timestamp ASC',
      [req.user.familyId]
    );
    const data = records.map(r => ({
      id: r.id,
      userRole: r.user_role,
      type: r.type,
      timestamp: r.timestamp,
      data: JSON.parse(r.data_json),
      createdAt: r.created_at,
    }));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[Export] 错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// --- 404 处理 ---
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

// --- 全局错误处理 ---
app.use((err, req, res, _next) => {
  console.error('[Server] 未捕获错误:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// --- 启动服务 ---
app.listen(PORT, () => {
  console.log(`[Server] 婴儿喂养记录服务已启动: http://localhost:${PORT}`);
  console.log(`[Server] 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] 健康检查: http://localhost:${PORT}/api/health`);
});
