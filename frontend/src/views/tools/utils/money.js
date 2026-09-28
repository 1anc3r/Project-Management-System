/**
 * 金额运算工具（整数分）
 *
 * 背景：费用测算组件原先直接对二进制浮点做累加后再 toFixed，
 * 会出现两类问题：
 *   1. toFixed 对二进制近似值取整，遇到「半分」值会错向（如 8.165 → "8.16"）；
 *   2. 合计用未舍入的分项累加后再舍入，页面却展示已舍入的分项，
 *      导致「分项之和 ≠ 合计」（如 0.005 + 0.005 展示为 0.01 + 0.01 = 0.01）。
 *
 * 约定：金额在内部一律以「整数分」参与运算，仅在渲染时用 fmtCents/fromCents 转回。
 * 单位说明：本项目中金额单位为「万元」，1 分 = 0.01 万元。
 */

/**
 * 安全转数字：兜住 null / undefined / '' / NaN（el-input-number 清空后可能给 null）
 * @param {*} v 原始值
 * @param {number} [fallback=0] 无法转换时的兜底值
 * @returns {number} 有限数字
 */
export const toNum = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/**
 * 转为整数分
 * @param {*} v 金额（万元）
 * @returns {number} 整数分
 */
export const toCents = (v) => Math.round(toNum(v) * 100)

/**
 * 整数分转金额
 * @param {*} c 整数分
 * @returns {number} 金额（万元）
 */
export const fromCents = (c) => toNum(c) / 100

/**
 * 格式化为两位小数字符串（仅用于展示）
 * @param {*} c 整数分
 * @returns {string} 形如 "123.45"
 */
export const fmtCents = (c) => fromCents(c).toFixed(2)

/**
 * 整数分 × 系数
 * @param {*} c 整数分
 * @param {*} k 系数
 * @returns {number} 整数分
 */
export const mulCents = (c, k) => Math.round(toNum(c) * toNum(k))

/**
 * 整数分 × 百分比
 * @param {*} c 整数分
 * @param {*} pct 百分比数值（如 5 表示 5%）
 * @returns {number} 整数分
 */
export const rateCents = (c, pct) => Math.round((toNum(c) * toNum(pct)) / 100)

/**
 * 整数分 ÷ 除数（除数为 0 时返回 0，避免 Infinity）
 * @param {*} c 整数分
 * @param {*} n 除数
 * @returns {number} 整数分
 */
export const divCents = (c, n) => {
  const d = toNum(n)
  return d > 0 ? Math.round(toNum(c) / d) : 0
}

/**
 * 整数分求和（整数相加，无浮点误差）
 * @param {...*} cs 若干整数分
 * @returns {number} 整数分
 */
export const sumCents = (...cs) => cs.reduce((acc, c) => acc + toNum(c), 0)
