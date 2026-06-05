/**
 * 生成 6 位邀请码（排除易混淆字符 0/O/1/I/l）
 */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[index];
  }
  return code;
}

module.exports = { generateInviteCode };
