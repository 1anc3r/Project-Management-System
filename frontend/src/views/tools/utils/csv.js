/**
 * CSV 导出工具
 *
 * 背景：费用测算组件原先用 `row.join(',')` 直接拼接，
 *   1. 单元格内含逗号 / 引号 / 换行时会破表（列错位）；
 *   2. 以 = + - @ 开头的内容会被 Excel / WPS 当作公式执行（CWE-1236 公式注入），
 *      攻击者可构造 =HYPERLINK(...) 或 DDE 载荷，用户打开导出文件即触发。
 */

/**
 * 转义单个 CSV 单元格
 * @param {*} v 原始值
 * @returns {string} 可安全写入 CSV 的文本
 */
export const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  // 前置单引号，破坏公式注入（Excel 会将其视为文本）
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  // 含分隔符 / 引号 / 换行时用双引号包裹并转义内部引号
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * 构造完整 CSV 文本（含 UTF-8 BOM，保证 Excel 正确识别中文）
 * @param {Array<Array<*>>} rows 二维数据
 * @returns {string} CSV 文本
 */
export const buildCsv = (rows) =>
  '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'

/**
 * 清洗下载文件名中的非法字符
 * @param {string} name 原始文件名
 * @param {string} [fallback='导出'] 兜底名
 * @returns {string} 安全文件名
 */
export const safeFileName = (name, fallback = '导出') => {
  const cleaned = String(name ?? '').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim()
  return cleaned || fallback
}
