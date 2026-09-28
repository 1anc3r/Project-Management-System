/**
 * 富文本 HTML 净化器（服务端）
 *
 * 为什么需要：
 *   knowledge.answer 等富文本字段可由 /api/knowledge/import 等入口绕过编辑器写入，
 *   前端 @vueup/vue-quill 以 quill.root.innerHTML = html 渲染（危险赋值），
 *   未净化的数据会形成存储型 XSS，可窃取 localStorage 中的登录 JWT。
 *
 * 实现说明：
 *   为保证"未识别的输入一律朝安全方向降级"（fail-closed），采用标签级白名单解析，
 *   而非正则替换：
 *     - 所有文本节点做 HTML 转义，因此任何未被正确解析的片段都只会显示为字面文本；
 *     - 标签、属性均须在白名单内，否则整体丢弃（文本保留）；
 *     - 属性值统一二次转义，杜绝通过引号逃逸注入事件处理器。
 *
 * 该实现不依赖 DOM 环境或第三方库，可在纯 Node 下运行。
 */

/** 允许保留（含其内容）的标签及其允许属性 */
const ALLOWED = {
  p: ['style'],
  br: [],
  span: ['style'],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  del: [],
  ins: [],
  sub: [],
  sup: [],
  blockquote: ['style'],
  pre: ['style'],
  code: ['class'],
  h1: ['style'],
  h2: ['style'],
  h3: ['style'],
  h4: ['style'],
  h5: ['style'],
  h6: ['style'],
  ol: [],
  ul: [],
  li: [],
  hr: [],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height']
};

/** 需要连同内容一并丢弃的标签（内容本身即代码或可执行载体） */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
  'select', 'button', 'link', 'meta', 'base', 'svg', 'math', 'template', 'noscript'
]);

/** 无条件自闭合、无结束标签的元素 */
const VOID_ELEMENTS = new Set([
  'br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'
]);

/**
 * 允许的 URL 协议：http、https、站内上传目录、data:image
 * 其余（javascript:、vbscript:、data:text/html 等）一律拒绝
 */
const SAFE_URL = /^(?:https?:|\/|#|mailto:|tel:|data:image\/)/i;

/** style 中禁止出现的危险声明（CSS 注入 / 旧版表达式执行） */
const DANGEROUS_STYLE = /(expression|javascript:|vbscript:|behavior\s*:|@import|url\s*\()/i;

/**
 * 转义 HTML 特殊字符
 * @param {string} str - 原始文本
 * @returns {string} 转义后的文本
 */
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));

/**
 * 清洗单个属性值
 * @param {string} name - 属性名（已小写）
 * @param {string} value - 原始属性值
 * @returns {string|null} 安全值；null 表示应丢弃该属性
 */
const cleanAttrValue = (name, value) => {
  const val = String(value == null ? '' : value);

  // href/src 必须是安全协议
  if (name === 'href' || name === 'src') {
    // 去除空白与控制字符，防止 "java\nscript:" 之类的绕过
    const normalized = val.replace(/[\u0000-\u0020]/g, '');
    if (!SAFE_URL.test(normalized)) return null;
    return normalized;
  }

  if (name === 'style') {
    return DANGEROUS_STYLE.test(val) ? null : val;
  }

  if (name === 'target') {
    return val === '_blank' ? '_blank' : null;
  }

  if (name === 'width' || name === 'height') {
    return /^\d{1,4}$/.test(val.trim()) ? val.trim() : null;
  }

  if (name === 'class') {
    return /^[\w\s-]{0,200}$/.test(val) ? val : null;
  }

  if (name === 'rel') {
    return /^[\w\s-]{0,100}$/.test(val) ? val : null;
  }

  return val;
};

/**
 * 将属性串解析为安全属性数组
 * @param {string} tag - 标签名（已小写）
 * @param {string} attrStr - 原始属性串
 * @returns {Array<[string, string]>} 安全属性键值对
 */
const parseAttrs = (tag, attrStr) => {
  const allowed = ALLOWED[tag] || [];
  if (allowed.length === 0 || !attrStr) return [];

  const result = [];
  const re = /([a-zA-Z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;

  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1].toLowerCase();

    // 事件处理器与命名空间属性一律丢弃
    if (name.startsWith('on') || name.startsWith('xlink:') || name.startsWith('xml')) continue;
    if (!allowed.includes(name)) continue;

    const raw = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
    const value = cleanAttrValue(name, raw);
    if (value === null) continue;

    // 图片必须存在安全 src，否则整体丢弃（避免 <img onerror> 类载荷）
    result.push([name, value]);
  }

  // img 无有效 src 时无法安全渲染
  if (tag === 'img' && !result.some(([n]) => n === 'src')) return null;

  return result;
};

/**
 * 净化富文本 HTML
 * @param {string} html - 原始 HTML
 * @returns {string} 安全 HTML；入参非字符串时返回空串
 */
const sanitizeRichText = (html) => {
  if (typeof html !== 'string' || html === '') return '';

  let out = '';
  const len = html.length;
  let i = 0;
  // 记录需要连同内容一起丢弃的标签（如 <script>...</script>）
  const dropStack = [];

  while (i < len) {
    const lt = html.indexOf('<', i);

    // 无更多标签：剩余文本转义输出
    if (lt === -1) {
      out += escapeHtml(html.slice(i));
      break;
    }

    // 标签前的文本
    if (lt > i) out += escapeHtml(html.slice(i, lt));

    // 注释：整体丢弃（可能用于绕过或条件注释）
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }

    // 处理指令 / CDATA / DOCTYPE：整体丢弃
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const end = html.indexOf('>', lt);
      i = end === -1 ? len : end + 1;
      continue;
    }

    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      // 未闭合的 '<'：按文本转义，避免吞掉后续内容
      out += escapeHtml(html.slice(lt));
      break;
    }

    let inner = html.slice(lt + 1, gt);
    i = gt + 1;

    const closing = inner.startsWith('/');
    if (closing) inner = inner.slice(1);
    inner = inner.replace(/\/+$/, ''); // 自闭合写法 <br/>

    const nameMatch = inner.match(/^([a-zA-Z][-\w:.]*)/);
    if (!nameMatch) {
      // 不是合法标签名（如 "< 3"），按文本输出
      out += escapeHtml(html.slice(lt, gt + 1));
      continue;
    }

    const tag = nameMatch[1].toLowerCase();
    const attrStr = inner.slice(nameMatch[1].length);

    // 处于丢弃区间内
    if (dropStack.length > 0) {
      if (closing && dropStack[dropStack.length - 1] === tag) dropStack.pop();
      continue;
    }

    if (DROP_WITH_CONTENT.has(tag)) {
      if (!closing) dropStack.push(tag);
      continue;
    }

    if (closing) {
      // 仅输出白名单标签的结束标签
      if (ALLOWED[tag] !== undefined && !VOID_ELEMENTS.has(tag)) out += `</${tag}>`;
      continue;
    }

    if (ALLOWED[tag] !== undefined) {
      let attrs = parseAttrs(tag, attrStr);
      // parseAttrs 返回 null 表示该标签不应输出（如无 src 的 img）
      if (attrs === null) continue;

      // 链接强制补 rel，防止 window.opener 劫持；_blank 场景必须有
      if (tag === 'a') {
        const hasRel = attrs.some(([n]) => n === 'rel');
        if (!hasRel) attrs = [...attrs, ['rel', 'noopener noreferrer']];
        if (attrs.some(([n, v]) => n === 'target' && v === '_blank') &&
            !attrs.some(([n, v]) => n === 'rel' && v.includes('noopener'))) {
          attrs = attrs.map(([n, v]) =>
            n === 'rel' ? [n, `${v} noopener noreferrer`] : [n, v]);
        }
      }

      const attrText = attrs
        .map(([n, v]) => ` ${n}="${escapeHtml(v)}"`)
        .join('');

      out += `<${tag}${attrText}>`;
      continue;
    }

    // 不在白名单：丢弃标签本身，但保留其内部文本
  }

  return out;
};

module.exports = {
  sanitizeRichText,
  stripHtml: (html) =>
    typeof html === 'string'
      ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : ''
};
