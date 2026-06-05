const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, queryAll, queryOne, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

/**
 * POST /api/sleep-timer/start
 * 开始计时（如果已有运行中的计时器，先自动停止）
 */
router.post('/start', async (req, res) => {
  try {
    getDb();
    const familyId = req.user.familyId;
    const now = Date.now();

    // 自动停止已有的 running 计时器
    const existing = queryOne(
      "SELECT id FROM sleep_timer WHERE family_id = ? AND status = 'running'",
      [familyId]
    );
    if (existing) {
      run("UPDATE sleep_timer SET status = 'stopped' WHERE id = ?", [existing.id]);
    }

    // 创建新的计时器
    const id = uuidv4();
    run(
      'INSERT INTO sleep_timer (id, family_id, user_id, start_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, familyId, req.user.userId, now, 'running', now]
    );

    console.log(`[SleepTimer] 开始计时: ${id} (家庭 ${familyId}, 用户 ${req.user.role})`);

    return res.status(201).json({
      success: true,
      data: { id, startTime: now, status: 'running' },
    });
  } catch (err) {
    console.error('[SleepTimer] 启动错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * POST /api/sleep-timer/stop
 * 停止计时，返回开始时间、结束时间和时长
 */
router.post('/stop', async (req, res) => {
  try {
    getDb();
    const familyId = req.user.familyId;
    const now = Date.now();

    const timer = queryOne(
      "SELECT id, start_time FROM sleep_timer WHERE family_id = ? AND status = 'running'",
      [familyId]
    );

    if (!timer) {
      return res.status(404).json({ success: false, error: '没有正在进行的计时器' });
    }

    const durationMinutes = Math.round((now - timer.start_time) / 60000);

    run(
      "UPDATE sleep_timer SET status = 'stopped' WHERE id = ?",
      [timer.id]
    );

    console.log(`[SleepTimer] 停止计时: ${timer.id}, 时长 ${durationMinutes} 分钟`);

    return res.status(200).json({
      success: true,
      data: {
        id: timer.id,
        startTime: timer.start_time,
        endTime: now,
        durationMinutes,
        status: 'stopped',
      },
    });
  } catch (err) {
    console.error('[SleepTimer] 停止错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/sleep-timer/status
 * 查询当前计时器状态
 */
router.get('/status', async (req, res) => {
  try {
    getDb();
    const familyId = req.user.familyId;

    const timer = queryOne(
      "SELECT id, start_time, status FROM sleep_timer WHERE family_id = ? AND status = 'running'",
      [familyId]
    );

    if (!timer) {
      return res.status(200).json({ success: true, data: null });
    }

    const elapsedMinutes = Math.round((Date.now() - timer.start_time) / 60000);

    return res.status(200).json({
      success: true,
      data: {
        id: timer.id,
        startTime: timer.start_time,
        status: 'running',
        elapsedMinutes,
      },
    });
  } catch (err) {
    console.error('[SleepTimer] 查询错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

module.exports = router;
