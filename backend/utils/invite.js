const crypto = require('crypto');

/**
 * 生成 6 位邀请码（排除易混淆字符 0/O/1/I/l）
 * 使用 crypto.randomInt 保证密码学安全
 */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[crypto.randomInt(0, CHARSET.length)];
  }
  return code;
}

module.exports = { generateInviteCode };