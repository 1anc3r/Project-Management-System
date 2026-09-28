/**
 * 富文本净化工具
 *
 * 背景：@vueup/vue-quill 在 contentType="html" 时，setHTML() 的实现是
 * `quill.root.innerHTML = html`（危险赋值，非安全的 clipboard 解析），
 * 因此任何未经净化的 HTML 都会直接进入 DOM。
 * 后端 knowledge.answer 由 /api/knowledge/import 等入口可绕过编辑器写入，
 * 必须在前端渲染前净化；后端亦需同样净化（见 backend/utils/htmlSanitizer.js）。
 */

import DOMPurify from 'dompurify'

/**
 * 白名单：仅允许 Quill 编辑器可能产出的标签与属性
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'blockquote', 'pre', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ol', 'ul', 'li',
    'a', 'img', 'sub', 'sup', 'hr'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
    'style', 'width', 'height'
  ],
  // 仅允许 http(s)、站内上传目录、以及 data:image（编辑器内联图片）
  ALLOWED_URI_REGEXP: /^(?:https?:|\/uploads\/|data:image\/)/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'meta', 'base'],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'ondblclick', 'onmouseover', 'onmouseout',
    'onmousedown', 'onmouseup', 'onmousemove', 'onfocus', 'onblur', 'onchange',
    'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'srcdoc', 'formaction',
    'xlink:href', 'action', 'background'
  ],
  // 禁止 data: URI 出现在非图片位置
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true
}

/**
 * 净化 HTML 字符串，移除脚本、事件处理器与危险协议
 * @param {string} html 原始 HTML
 * @returns {string} 安全 HTML；入参非字符串时返回空串
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== 'string' || html === '') return ''
  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}

/**
 * 转义纯文本，用于需要拼接进 HTML 字符串的场景
 * （如 Leaflet bindPopup / bindTooltip，其内部即 innerHTML 赋值）
 * @param {*} value 任意值
 * @returns {string} 转义后的字符串
 */
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])

export default sanitizeHtml
