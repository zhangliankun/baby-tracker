const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

/**
 * JWT 认证中间件
 * 从 Authorization 头解析 Bearer token，验证后挂载 req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      familyId: decoded.familyId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    });
  }
}

/**
 * 生成 JWT token
 * @param {object} payload - { userId, familyId, role }
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };
