/**
 * 密钥与安全配置集中校验
 *
 * 关键风险：若 JWT_SECRET 与 DB_PASSWORD 复用同一口令，一旦数据库口令泄露，
 * 攻击者即可伪造任意用户的 JWT（含管理员），横向风险叠加。
 * 因此在启动阶段即强制分离，生产环境不合规则直接拒绝启动。
 */

require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

/** 明显不可用的弱密钥黑名单 */
const WEAK_SECRETS = [
  'secret',
  'jwt-secret',
  'changeme',
  'your-super-secret-jwt-key-change-in-production',
  'dev-only-insecure-secret'
];

/**
 * 校验 JWT_SECRET 配置
 * @returns {string} 可用的 JWT 密钥
 * @throws {Error} 生产环境配置不合规时抛出，阻止服务启动
 */
const resolveJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const dbPassword = process.env.DB_PASSWORD;

  if (!secret) {
    if (isProduction) {
      throw new Error('生产环境必须配置 JWT_SECRET 环境变量');
    }
    console.warn('[安全告警] 未配置 JWT_SECRET，已启用仅供开发的临时密钥，禁止用于生产');
    return 'dev-only-insecure-secret';
  }

  // 生产环境强制要求与数据库口令分离
  if (isProduction && dbPassword && secret === dbPassword) {
    throw new Error(
      'JWT_SECRET 不能与 DB_PASSWORD 相同：口令复用会导致数据库泄露时 JWT 可被伪造，' +
      '请使用 openssl rand -base64 48 生成独立密钥'
    );
  }

  if (isProduction && WEAK_SECRETS.includes(secret)) {
    throw new Error('JWT_SECRET 使用了已知弱密钥，请更换为强随机值');
  }

  if (isProduction && secret.length < 32) {
    throw new Error('JWT_SECRET 长度不足 32 字符，请使用 openssl rand -base64 48 生成');
  }

  // 开发环境也提示复用风险，但不阻断启动
  if (!isProduction && dbPassword && secret === dbPassword) {
    console.warn(
      '[安全告警] JWT_SECRET 与 DB_PASSWORD 相同，存在口令复用风险；' +
      '生产环境将拒绝启动，建议尽快分离'
    );
  }

  return secret;
};

/** 校验默认管理员口令（仅生产环境告警） */
const checkDefaultAdminPassword = () => {
  if (process.env.DEFAULT_ADMIN_PASSWORD === 'admin123' && isProduction) {
    console.warn('[安全告警] 生产环境仍在使用默认管理员口令 admin123，请立即修改');
  }
};

module.exports = {
  isProduction,
  resolveJwtSecret,
  checkDefaultAdminPassword
};
