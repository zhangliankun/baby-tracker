const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, queryOne, run } = require('../db');
const { generateToken } = require('../middleware/auth');
const { generateInviteCode } = require('../utils/invite');

const router = express.Router();

const VALID_ROLES = ['爸爸', '妈妈', '奶奶', '爷爷', '外婆', '其他'];

/**
 * POST /api/auth/register
 * 注册 — 创建新家庭 或 通过邀请码加入已有家庭
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, familyName, inviteCode } = req.body;

    // --- 参数校验 ---
    if (!username || typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 20) {
      return res.status(400).json({ success: false, error: '用户名为 2-20 个字符' });
    }
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
      return res.status(400).json({ success: false, error: '密码为 6-50 个字符' });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `角色必须是以下之一：${VALID_ROLES.join('、')}` });
    }

    getDb();
    const now = Date.now();

    // 检查用户名是否已存在
    const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    let familyId;
    let resultInviteCode;

    if (inviteCode) {
      // --- 加入已有家庭 ---
      if (typeof inviteCode !== 'string' || inviteCode.trim().length !== 6) {
        return res.status(400).json({ success: false, error: '邀请码格式不正确' });
      }

      const family = queryOne('SELECT id, invite_code FROM families WHERE invite_code = ?', [inviteCode.trim().toUpperCase()]);
      if (!family) {
        return res.status(400).json({ success: false, error: '邀请码无效，请检查后重试' });
      }

      familyId = family.id;
      resultInviteCode = family.invite_code;
    } else if (familyName) {
      // --- 创建新家庭 ---
      if (typeof familyName !== 'string' || familyName.trim().length < 1 || familyName.trim().length > 30) {
        return res.status(400).json({ success: false, error: '家庭名称为 1-30 个字符' });
      }

      familyId = uuidv4();
      resultInviteCode = generateInviteCode();

      // 确保邀请码唯一
      let attempts = 0;
      while (queryOne('SELECT id FROM families WHERE invite_code = ?', [resultInviteCode])) {
        resultInviteCode = generateInviteCode();
        attempts++;
        if (attempts > 10) {
          return res.status(500).json({ success: false, error: '邀请码生成失败，请重试' });
        }
      }

      // 创建家庭
      run('INSERT INTO families (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)', [
        familyId, familyName.trim(), resultInviteCode, now,
      ]);

      // 为新建家庭创建默认婴儿档案
      const babyId = uuidv4();
      const todayStr = new Date().toISOString().split('T')[0];
      run('INSERT INTO babies (id, family_id, nickname, birth_date) VALUES (?, ?, ?, ?)', [
        babyId, familyId, '我的宝宝', todayStr,
      ]);

      console.log(`[Auth] 新建家庭: ${familyName.trim()} (${familyId}), 邀请码: ${resultInviteCode}`);
    } else {
      return res.status(400).json({ success: false, error: '请提供家庭名称（创建新家庭）或邀请码（加入家庭）' });
    }

    // 创建用户
    const userId = uuidv4();
    run('INSERT INTO users (id, family_id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
      userId, familyId, username.trim(), hashedPassword, role, now,
    ]);


    // 查询婴儿档案
    const baby = queryOne('SELECT id, nickname, birth_date FROM babies WHERE family_id = ?', [familyId]);

    // 生成 JWT
    const token = generateToken({ userId, familyId, role });

    console.log(`[Auth] 新用户注册: ${username.trim()} (${role}) → 家庭 ${familyId}`);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: userId, username: username.trim(), role, familyId },
        baby: baby ? { id: baby.id, nickname: baby.nickname, birthDate: baby.birth_date } : null,
        inviteCode: resultInviteCode,
      },
    });
  } catch (err) {
    console.error('[Auth] 注册错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login
 * 登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' });
    }

    getDb();

    // 查询用户
    const user = queryOne('SELECT id, family_id, username, password, role FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }

    // 查询婴儿档案
    const baby = queryOne('SELECT id, nickname, birth_date FROM babies WHERE family_id = ?', [user.family_id]);

    // 查询家庭邀请码
    const family = queryOne('SELECT invite_code FROM families WHERE id = ?', [user.family_id]);

    // 生成 JWT
    const token = generateToken({
      userId: user.id,
      familyId: user.family_id,
      role: user.role,
    });

    console.log(`[Auth] 用户登录: ${user.username} (${user.role})`);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, familyId: user.family_id },
        baby: baby ? { id: baby.id, nickname: baby.nickname, birthDate: baby.birth_date } : null,
        inviteCode: family ? family.invite_code : null,
      },
    });
  } catch (err) {
    console.error('[Auth] 登录错误:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

module.exports = router;
