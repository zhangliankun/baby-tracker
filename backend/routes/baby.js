const express = require('express');
const { getDb, queryOne, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有 baby 路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/baby
 * 获取当前家庭的婴儿档案
 */
router.get('/', async (req, res) => {
  try {
    getDb();
    const baby = queryOne('SELECT id, nickname, birth_date FROM babies WHERE family_id = ?', [req.user.familyId]);

    if (!baby) {
      return res.status(404).json({ success: false, error: '未找到婴儿档案' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: baby.id,
        nickname: baby.nickname,
        birthDate: baby.birth_date,
      },
    });
  } catch (err) {
    console.error('[Baby] 查询错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * PUT /api/baby
 * 更新当前家庭的婴儿档案
 */
router.put('/', async (req, res) => {
  try {
    const { nickname, birthDate } = req.body;

    // 校验
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 1 || nickname.trim().length > 20) {
      return res.status(400).json({ success: false, error: '昵称为 1-20 个字符' });
    }
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ success: false, error: '出生日期格式不正确（YYYY-MM-DD）' });
    }

    // 不能是未来日期
    const today = new Date().toISOString().split('T')[0];
    if (birthDate > today) {
      return res.status(400).json({ success: false, error: '出生日期不能是未来日期' });
    }

    getDb();

    // 验证婴儿档案存在
    const existing = queryOne('SELECT id FROM babies WHERE family_id = ?', [req.user.familyId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '未找到婴儿档案' });
    }

    run('UPDATE babies SET nickname = ?, birth_date = ? WHERE family_id = ?', [
      nickname.trim(), birthDate, req.user.familyId,
    ]);

    console.log(`[Baby] 更新婴儿档案: ${nickname.trim()} ${birthDate} (家庭 ${req.user.familyId})`);

    return res.status(200).json({
      success: true,
      data: {
        id: existing.id,
        nickname: nickname.trim(),
        birthDate,
      },
    });
  } catch (err) {
    console.error('[Baby] 更新错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

module.exports = router;
