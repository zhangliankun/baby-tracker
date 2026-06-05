const express = require('express');
const { getDb, queryAll } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const safeParse = (json) => {
  try { return JSON.parse(json); } catch (e) { console.error('[Statistics] JSON parse error:', e.message); return null; }
};

/**
 * GET /api/statistics
 * 获取统计数据
 * ?period=week|month&date=YYYY-MM-DD&roleFilter=all|角色名
 */
router.get('/', async (req, res) => {
  try {
    const { period, date, roleFilter } = req.query;

    // 校验参数
    if (!period || !['week', 'month'].includes(period)) {
      return res.status(400).json({ success: false, error: 'period 必须是 week 或 month' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'date 格式不正确（YYYY-MM-DD）' });
    }

    // 计算周期起止日期
    const targetDate = new Date(date + 'T00:00:00');
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, error: 'date 日期无效' });
    }

    let startDate, endDate;
    if (period === 'week') {
      // 本周：周一到周日
      const dayOfWeek = targetDate.getDay(); // 0=周日, 1=周一...
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      // 本月：1号到月末
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const startTs = startDate.getTime();
    const endTs = new Date(endStr + 'T23:59:59.999').getTime();

    await getDb();
    const familyId = req.user.familyId;

    // 构建角色过滤条件
    let roleCondition = '';
    const params = [familyId, startTs, endTs];

    if (roleFilter && roleFilter !== 'all') {
      if (!VALID_ROLES.includes(roleFilter)) {
        return res.status(400).json({ success: false, error: `角色筛选无效，可选：all, ${VALID_ROLES.join(', ')}` });
      }
      roleCondition = ' AND user_role = ?';
      params.push(roleFilter);
    }

    const baseWhere = `family_id = ? AND timestamp >= ? AND timestamp <= ?${roleCondition}`;

    // --- 喂养统计 ---
    const feedingRecords = queryAll(
      `SELECT data_json, timestamp FROM records WHERE ${baseWhere} AND type = 'feeding'`,
      params
    );

    let feedingTotalMl = 0;
    const feedingByType = { formula: 0, breast: 0, bottle_breast: 0 };
    const dailyFeedingMap = {}; // date -> {formula: xx, breast: xx, bottle_breast: xx}

    for (const r of feedingRecords) {
      const d = safeParse(r.data_json);
      const dayKey = new Date(r.timestamp).toISOString().split('T')[0];
      if (!dailyFeedingMap[dayKey]) dailyFeedingMap[dayKey] = { formula: 0, breast: 0, bottle_breast: 0 };

      dailyFeedingMap[dayKey][d.feedingType] = (dailyFeedingMap[dayKey][d.feedingType] || 0) + d.amountMl;
      feedingByType[d.feedingType] = (feedingByType[d.feedingType] || 0) + d.amountMl;
      feedingTotalMl += d.amountMl;
    }

    const feedingDays = Object.keys(dailyFeedingMap).length || 1;
    const dailyFeedingBreakdown = Object.entries(dailyFeedingMap)
      .map(([d, types]) => ({ date: d, ...types }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- 睡眠统计 ---
    const sleepRecords = queryAll(
      `SELECT data_json, timestamp FROM records WHERE ${baseWhere} AND type = 'sleep'`,
      params
    );

    let sleepTotalMinutes = 0;
    const dailySleepMap = {};

    for (const r of sleepRecords) {
      const d = safeParse(r.data_json);
      const minutes = d && d.durationMinutes || 0;
      sleepTotalMinutes += minutes;
      const dayKey = new Date(r.timestamp).toISOString().split('T')[0];
      dailySleepMap[dayKey] = (dailySleepMap[dayKey] || 0) + minutes;
    }

    const sleepDays = Object.keys(dailySleepMap).length || 1;
    const dailySleepBreakdown = Object.entries(dailySleepMap)
      .map(([d, minutes]) => ({ date: d, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- 尿布统计 ---
    const diaperRecords = queryAll(
      `SELECT data_json FROM records WHERE ${baseWhere} AND type = 'diaper'`,
      params
    );

    let diaperTotalCount = 0;
    let poopCount = 0;
    const peeCount = diaperRecords.length; // 所有尿布记录都有 pee 或不含 pee（仅臭臭）
    const poopColorDist = {};
    const poopShapeDist = {};
    let redButtCount = 0;

    for (const r of diaperRecords) {
      diaperTotalCount++;
      const d = safeParse(r.data_json);
      if (d && d.poop) {
        poopCount++;
        if (d.poopColor) {
          poopColorDist[d.poopColor] = (poopColorDist[d.poopColor] || 0) + 1;
        }
        if (d.poopShape) {
          poopShapeDist[d.poopShape] = (poopShapeDist[d.poopShape] || 0) + 1;
        }
      }
      if (d && d.redButt) redButtCount++;
    }

    // 准确计算 pee 次数
    let actualPeeCount = 0;
    for (const r of diaperRecords) {
      const d = safeParse(r.data_json);
      if (d && d.pee) actualPeeCount++;
    }

    // --- 补剂统计 ---
    const supplementRecords = queryAll(
      `SELECT data_json FROM records WHERE ${baseWhere} AND type = 'supplement'`,
      params
    );

    const suppByName = {};
    let supplementTotalCount = 0;
    for (const r of supplementRecords) {
      const d = safeParse(r.data_json);
      // 支持新旧两种格式：旧 {name,dose} 和 新 {supplements:[],remark}
      if (d.supplements && Array.isArray(d.supplements)) {
        for (const s of d.supplements) {
          const key = s.name.trim();
          suppByName[key] = (suppByName[key] || 0) + 1;
          supplementTotalCount++;
        }
      } else if (d.name) {
        // 旧格式兼容
        supplementTotalCount++;
        const key = (d.name || '').trim();
        suppByName[key] = (suppByName[key] || 0) + 1;
      }
    }

    // --- 辅食统计 ---
    const solidFoodRecords = queryAll(
      `SELECT data_json, timestamp FROM records WHERE ${baseWhere} AND type = 'solid-food'`,
      params
    );

    const solidFoodByName = {};
    const solidFoodAllergyFoods = {};
    const solidFoodAllergySymptoms = {};
    let solidFoodTotalCount = 0;
    let solidFoodAllergyCount = 0;
    const solidFoodDays = new Set();

    for (const r of solidFoodRecords) {
      const d = safeParse(r.data_json);
      solidFoodTotalCount++;
      const dayKey = new Date(r.timestamp).toISOString().split('T')[0];
      solidFoodDays.add(dayKey);

      const name = (d.foodName || '').trim();
      if (name) solidFoodByName[name] = (solidFoodByName[name] || 0) + 1;

      if (d && d.allergy && d.allergy.foods && d.allergy.foods.length > 0) {
        solidFoodAllergyCount++;
        for (const f of d.allergy.foods) {
          const key = f.trim();
          if (key) solidFoodAllergyFoods[key] = (solidFoodAllergyFoods[key] || 0) + 1;
        }
        if (d && d.allergy.symptoms) {
          for (const s of d.allergy.symptoms) {
            const key = s.trim();
            if (key) solidFoodAllergySymptoms[key] = (solidFoodAllergySymptoms[key] || 0) + 1;
          }
        }
      }
    }

    const sfDays = solidFoodDays.size || 1;

    // --- 构建响应 ---
    return res.status(200).json({
      success: true,
      data: {
        period,
        startDate: startStr,
        endDate: endStr,
        feeding: {
          totalMl: feedingTotalMl,
          avgDailyMl: Math.round(feedingTotalMl / feedingDays),
          byType: feedingByType,
          dailyBreakdown: dailyFeedingBreakdown,
        },
        sleep: {
          totalMinutes: sleepTotalMinutes,
          totalHours: Math.round(sleepTotalMinutes / 6) / 10,
          avgDailyMinutes: Math.round(sleepTotalMinutes / sleepDays),
          avgDailyHours: Math.round(sleepTotalMinutes / sleepDays / 6) / 10,
          dailyBreakdown: dailySleepBreakdown,
        },
        diaper: {
          totalCount: diaperTotalCount,
          peeCount: actualPeeCount,
          poopCount,
          poopColorDistribution: poopColorDist,
          poopShapeDistribution: poopShapeDist,
          redButtCount,
        },
        supplement: {
          totalCount: supplementTotalCount,
          byName: suppByName,
        },
        'solid-food': {
          totalCount: solidFoodTotalCount,
          varietyCount: Object.keys(solidFoodByName).length,
          avgDailyCount: Math.round(solidFoodTotalCount / sfDays),
          byName: solidFoodByName,
          allergyCount: solidFoodAllergyCount,
          allergyFoods: solidFoodAllergyFoods,
          allergySymptoms: solidFoodAllergySymptoms,
        },
      },
    });
  } catch (err) {
    console.error('[Statistics] 查询错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

module.exports = router;
