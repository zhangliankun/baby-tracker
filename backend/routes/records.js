const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, queryAll, queryOne, run, saveNow } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// /all 路由必须在 /:id 之前注册，否则 Express 会把 "all" 当作 :id 参数
router.use(authMiddleware);

const VALID_TYPES = ['feeding', 'sleep', 'diaper', 'supplement'];
const FEEDING_TYPES = ['formula', 'breast', 'bottle_breast'];
const POOP_COLORS = ['yellow', 'yellow-green', 'dark-green', 'green-brown', 'pale-yellow', 'dark-brown'];
const POOP_SHAPES = ['paste', 'dry-thick', 'cream', 'milk-curd', 'watery', 'foamy'];

/**
 * 验证喂养记录数据
 */
function validateFeedingData(data) {
  if (!data || !data.feedingType || !FEEDING_TYPES.includes(data.feedingType)) {
    return '喂养类型无效，必须是 formula/breast/bottle_breast';
  }
  if (!data.amountMl || typeof data.amountMl !== 'number' || data.amountMl <= 0 || data.amountMl > 9999) {
    return '奶量必须是 1-9999 的正整数';
  }
  if (data.startTime && typeof data.startTime !== 'number') return '开始时间格式不正确';
  if (data.endTime && typeof data.endTime !== 'number') return '结束时间格式不正确';
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    return '开始时间必须早于结束时间';
  }
  return null;
}

/**
 * 验证睡眠记录数据
 */
function validateSleepData(data) {
  if (!data || !data.startTime || typeof data.startTime !== 'number') {
    return '请提供开始时间';
  }
  // endTime 可为 null（计时中），durationMinutes 也可为 null
  if (data.endTime && typeof data.endTime !== 'number') return '结束时间格式不正确';
  if (data.endTime && data.startTime >= data.endTime) {
    return '开始时间必须早于结束时间';
  }
  return null;
}

/**
 * 验证尿布记录数据
 */
function validateDiaperData(data) {
  if (!data) return '请提供尿布数据';
  if (!data.pee && !data.poop) {
    return '尿布类型至少选一个（嘘嘘或臭臭）';
  }
  if (data.poop) {
    if (data.poopColor && !POOP_COLORS.includes(data.poopColor)) {
      return '臭臭颜色无效';
    }
    if (data.poopShape && !POOP_SHAPES.includes(data.poopShape)) {
      return '臭臭形状无效';
    }
  }
  return null;
}

/**
 * 验证补剂记录数据
 */
function validateSupplementData(data) {
  // 兼容旧格式 {name, dose}
  if (data && data.name && typeof data.name === 'string' && data.name.trim().length > 0) {
    return null;
  }
  // 新格式 {supplements: [...]}
  if (!data || !data.supplements || !Array.isArray(data.supplements) || data.supplements.length === 0) {
    return '请至少添加一种补剂';
  }
  for (const s of data.supplements) {
    if (!s.name || typeof s.name !== 'string' || s.name.trim().length === 0) {
      return '补剂名称不能为空';
    }
    if (!s.dose || typeof s.dose !== 'string' || s.dose.trim().length === 0) {
      return '请填写补剂用量';
    }
  }
  return null;
}

/**
 * 根据 type 验证 data_json
 */
function validateData(type, data) {
  switch (type) {
    case 'feeding': return validateFeedingData(data);
    case 'sleep': return validateSleepData(data);
    case 'diaper': return validateDiaperData(data);
    case 'supplement': return validateSupplementData(data);
    default: return '未知的记录类型';
  }
}

/**
 * GET /api/records
 * 获取记录列表（按日期或日期范围查询）
 */
router.get('/', async (req, res) => {
  try {
    await getDb();
    const { date, startDate, endDate } = req.query;
    const familyId = req.user.familyId;

    let results;

    if (date) {
      // 单日查询
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, error: '日期格式不正确（YYYY-MM-DD）' });
      }
      const dayStart = new Date(date + 'T00:00:00').getTime();
      const dayEnd = new Date(date + 'T23:59:59.999').getTime();

      if (isNaN(dayStart)) {
        return res.status(400).json({ success: false, error: '日期格式不正确' });
      }

      results = queryAll(
        'SELECT id, user_id, user_role, type, timestamp, data_json, created_at FROM records WHERE family_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [familyId, dayStart, dayEnd]
      );
    } else if (startDate && endDate) {
      // 日期范围查询
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ success: false, error: '日期格式不正确（YYYY-MM-DD）' });
      }
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59.999').getTime();

      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ success: false, error: '日期格式不正确' });
      }

      results = queryAll(
        'SELECT id, user_id, user_role, type, timestamp, data_json, created_at FROM records WHERE family_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [familyId, start, end]
      );
    } else {
      return res.status(400).json({ success: false, error: '请提供 date 或 startDate+endDate 参数' });
    }

    // 解析 data_json 字段
    const records = results.map(r => ({
      id: r.id,
      userId: r.user_id,
      userRole: r.user_role,
      type: r.type,
      timestamp: r.timestamp,
      data: JSON.parse(r.data_json),
      createdAt: r.created_at,
    }));

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('[Records] 查询错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ---- 静态路由（必须在 /:id 之前） ----

/**
 * DELETE /api/records/all
 * 清空当前家庭所有记录（需二次确认）
 */
router.delete('/all', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== true) {
      return res.status(400).json({ success: false, error: '请在请求体中传入 confirm: true 确认清空操作' });
    }

    await getDb();

    const count = queryOne('SELECT COUNT(*) as cnt FROM records WHERE family_id = ?', [req.user.familyId]);

    run('DELETE FROM records WHERE family_id = ?', [req.user.familyId]);
    saveNow();

    console.log('[Records] 清空记录: 家庭 ' + req.user.familyId + ', 共 ' + count.cnt + ' 条');

    return res.status(200).json({ success: true, data: { deletedCount: count.cnt } });
  } catch (err) {
    console.error('[Records] 清空错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ---- 动态路由（/:id 在最后） ----

/**
 * POST /api/records
 * 添加记录
 */
router.post('/', async (req, res) => {
  try {
    const { type, timestamp, data } = req.body;

    // 校验 type
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: `记录类型无效，必须是 ${VALID_TYPES.join('/')}` });
    }

    // 校验 timestamp
    if (!timestamp || typeof timestamp !== 'number' || timestamp <= 0) {
      return res.status(400).json({ success: false, error: '时间戳无效' });
    }

    // 校验 data
    const dataErr = validateData(type, data);
    if (dataErr) {
      return res.status(400).json({ success: false, error: dataErr });
    }

    await getDb();
    const now = Date.now();
    const id = uuidv4();
    const dataJson = JSON.stringify(data);

    run(
      'INSERT INTO records (id, family_id, user_id, user_role, type, timestamp, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.familyId, req.user.userId, req.user.role, type, timestamp, dataJson, now]
    );
    saveNow();

    const record = {
      id,
      userId: req.user.userId,
      userRole: req.user.role,
      type,
      timestamp,
      data,
      createdAt: now,
    };

    console.log(`[Records] 添加记录: ${type} by ${req.user.role} (${req.user.familyId})`);

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error('[Records] 添加错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * PUT /api/records/:id
 * 更新记录
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, timestamp, data } = req.body;

    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: `记录类型无效` });
    }
    if (!timestamp || typeof timestamp !== 'number') {
      return res.status(400).json({ success: false, error: '时间戳无效' });
    }

    const dataErr = validateData(type, data);
    if (dataErr) {
      return res.status(400).json({ success: false, error: dataErr });
    }

    await getDb();

    // 验证记录存在且属于当前家庭
    const existing = queryOne('SELECT id, family_id FROM records WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    if (existing.family_id !== req.user.familyId) {
      return res.status(403).json({ success: false, error: '无权修改此记录' });
    }

    const dataJson = JSON.stringify(data);

    run(
      'UPDATE records SET type = ?, timestamp = ?, data_json = ? WHERE id = ?',
      [type, timestamp, dataJson, id]
    );
    saveNow();

    const updated = {
      id,
      userId: req.user.userId,
      userRole: req.user.role,
      type,
      timestamp,
      data,
      createdAt: Date.now(),
    };

    console.log(`[Records] 更新记录: ${id} (${type})`);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('[Records] 更新错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/records/:id
 * 删除单条记录（动态路由，注册在 /all 之后）
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await getDb();

    const existing = queryOne('SELECT id, family_id FROM records WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    if (existing.family_id !== req.user.familyId) {
      return res.status(403).json({ success: false, error: '无权删除此记录' });
    }

    run('DELETE FROM records WHERE id = ?', [id]);
    saveNow();

    console.log(`[Records] 删除记录: ${id}`);

    return res.status(200).json({ success: true, data: null });
  } catch (err) {
    console.error('[Records] 删除错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/records/all
 * 清空当前家庭所有记录（需二次确认）
 */
router.delete('/all', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== true) {
      return res.status(400).json({ success: false, error: '请在请求体中传入 confirm: true 确认清空操作' });
    }

    await getDb();

    // 统计数量
    const count = queryOne('SELECT COUNT(*) as cnt FROM records WHERE family_id = ?', [req.user.familyId]);

    run('DELETE FROM records WHERE family_id = ?', [req.user.familyId]);
    saveNow();

    console.log(`[Records] 清空记录: 家庭 ${req.user.familyId}, 共 ${count.cnt} 条`);

    return res.status(200).json({ success: true, data: { deletedCount: count.cnt } });
  } catch (err) {
    console.error('[Records] 清空错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

module.exports = router;
