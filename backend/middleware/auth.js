const jwt = require('jsonwebtoken');

// JWT_SECRET 必须配置，生产环境不提供 fallback
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('[Auth] 致命错误：未配置 JWT_SECRET 环境变量');
  process.exit(1);
}

/**
 * JWT 认证中间件
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
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
    return res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
  }
}

/**
 * 生成 JWT token（365天过期）
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });
}

module.exports = { authMiddleware, generateToken };