// 表格修复验证脚本
// 模拟飞书表格 DOM, 验证 content.js 中 n / o / g 三个函数的修复逻辑
// 运行: node dev-examples/table-fix-example.js

// ============ Mock DOM ============
class MockNode {
  constructor(opts = {}) {
    this.nodeType = opts.nodeType ?? 1; // 默认 ELEMENT_NODE
    this.tagName = (opts.tagName ?? 'DIV').toUpperCase();
    this._textContent = opts.textContent ?? '';
    this._attrs = opts.attrs ?? {};
    this.children = opts.children ?? [];
    this.childNodes = this.children;
    this.className = opts.className ?? '';
    this.style = opts.style ?? {};
    this.parentElement = opts.parent ?? null;
  }
  get textContent() {
    if (this.nodeType === 3) return this._textContent;
    return this.children.map(c => c.textContent).join('');
  }
  getAttribute(name) {
    return this._attrs[name] ?? null;
  }
  querySelectorAll(selector) {
    return queryAll(this, selector);
  }
  querySelector(selector) {
    const r = this.querySelectorAll(selector);
    return r.length ? r[0] : null;
  }
  closest(tagName) {
    let n = this;
    const upper = tagName.toUpperCase();
    while (n) {
      if (n.tagName === upper) return n;
      n = n.parentElement;
    }
    return null;
  }
  cloneNode(deep) {
    const c = new MockNode({
      nodeType: this.nodeType,
      tagName: this.tagName,
      textContent: this._textContent,
      attrs: { ...this._attrs },
      className: this.className,
      style: this.style,
    });
    if (deep) {
      c.children = this.children.map(ch => ch.cloneNode(true));
      c.childNodes = c.children;
      c.children.forEach(ch => (ch.parentElement = c));
    }
    return c;
  }
  get classList() {
    const self = this;
    return {
      contains(cls) {
        return (self.className || '').split(' ').includes(cls);
      },
    };
  }
}

// 全局 Node 常量
global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };

// 简化的 querySelectorAll: 支持 [attr], [attr="value"], tagname, :scope > sel, 以及逗号分隔的复合选择器
function queryAll(root, selector) {
  const results = [];
  const seen = new Set();
  for (const part of selector.split(',').map(s => s.trim())) {
    for (const m of matchSingle(root, part)) {
      if (!seen.has(m)) { seen.add(m); results.push(m); }
    }
  }
  return results;
}
function matchSingle(root, selector) {
  const results = [];
  // [attr^="value"] 属性前缀匹配
  let m = selector.match(/^\[([\w-]+)\^="([^"]*)"\]$/);
  if (m) {
    const [, attr, prefix] = m;
    walk(root, n => {
      if (n.nodeType === 1 && n._attrs[attr] !== undefined && n._attrs[attr].startsWith(prefix)) results.push(n);
    });
    return results;
  }
  // [attr] 或 [attr="value"]
  m = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
  if (m) {
    const [, attr, value] = m;
    walk(root, n => {
      if (n.nodeType === 1 && n._attrs[attr] !== undefined) {
        if (value === undefined || n._attrs[attr] === value) results.push(n);
      }
    });
    return results;
  }
  // 标签名 a[href^="#"] 这种复合
  m = selector.match(/^([a-zA-Z]+)\[([\w-]+)\^="([^"]*)"\]$/);
  if (m) {
    const [, tag, attr, prefix] = m;
    const upper = tag.toUpperCase();
    walk(root, n => {
      if (n.nodeType === 1 && n.tagName === upper && n._attrs[attr] !== undefined && n._attrs[attr].startsWith(prefix)) results.push(n);
    });
    return results;
  }
  if (/^[a-zA-Z]+$/.test(selector)) {
    const upper = selector.toUpperCase();
    walk(root, n => {
      if (n.nodeType === 1 && n.tagName === upper) results.push(n);
    });
    return results;
  }
  m = selector.match(/^:scope > (.+)$/);
  if (m) {
    const sub = m[1];
    root.children.forEach(c => {
      if (c.nodeType === 1 && matchesSimple(c, sub)) results.push(c);
    });
    return results;
  }
  return results;
}
function matchesSimple(node, selector) {
  let m = selector.match(/^\[([\w-]+)\]$/);
  if (m) return node._attrs[m[1]] !== undefined;
  if (/^[a-zA-Z]+$/.test(selector)) return node.tagName === selector.toUpperCase();
  return false;
}
function walk(node, fn) {
  fn(node);
  if (node.children) node.children.forEach(c => walk(c, fn));
}

// ============ 修复后的函数 (从 content.js 复制) ============
function a(e) { let t = []; return o(e, [], t), l(t); }
function o(e, t, n) {
  if (e.nodeType === Node.TEXT_NODE) {
    let r = (e.textContent || ``).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ``);
    r && n.push({ type: `text`, content: r, marks: [...t] });
    return;
  }
  if (e.nodeType !== Node.ELEMENT_NODE) return;
  let r = e;
  if (r.tagName === `STYLE` || r.tagName === `SCRIPT`) return;
  let i = [...t, ...s(r)];
  if (r.tagName === `A`) {
    let e = c(r.getAttribute(`href`) || r.getAttribute(`data-href`) || ``),
      t = [...i, { type: `link`, url: e }],
      a = (r.textContent || ``).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ``);
    a && n.push({ type: `text`, content: a, marks: t });
    return;
  }
  if (r.tagName === `CODE` || r.classList.contains(`inline-code`)) {
    let e = (r.textContent || ``).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ``);
    e && n.push({ type: `text`, content: e, marks: [...i, { type: `code` }] });
    return;
  }
  for (let e of Array.from(r.childNodes)) o(e, i, n);
}
function s(e) {
  let t = [], n = e.style;
  return (e.tagName === `B` || e.tagName === `STRONG` || n?.fontWeight === `bold` || parseInt(n?.fontWeight) >= 700) && t.push({ type: `bold` }),
    (e.tagName === `I` || e.tagName === `EM` || n?.fontStyle === `italic`) && t.push({ type: `italic` }),
    (e.tagName === `S` || e.tagName === `DEL` || n?.textDecoration?.includes(`line-through`)) && t.push({ type: `strikethrough` }),
    (e.tagName === `U` || n?.textDecoration?.includes(`underline`)) && t.push({ type: `underline` }),
    t;
}
function c(e) { try { return decodeURIComponent(e); } catch { return e; } }
function l(e) {
  if (e.length === 0) return [];
  let t = [e[0]];
  for (let n = 1; n < e.length; n++) {
    let r = t[t.length - 1], i = e[n];
    JSON.stringify(r.marks) === JSON.stringify(i.marks) ? (r.content += i.content) : t.push(i);
  }
  return t;
}
function n(e, t) {
  let n = document.querySelectorAll(`[data-record-id]`);
  if (n.length > 0) {
    let r = !1;
    for (let e of Array.from(n)) {
      if (e.closest(`table`)) continue;
      let n = e.getAttribute(`data-record-id`);
      t.has(n) || (t.set(n, e.cloneNode(!0)), r = !0);
    }
    if (r) return;
  }
  let i = document.querySelectorAll(`[data-block-id]`);
  if (i.length > 0) {
    let r = !1;
    for (let e of Array.from(i)) {
      if (e.closest(`table`) && e.getAttribute(`data-block-type`) !== `table`) continue;
      let n = e.getAttribute(`data-block-id`);
      t.has(n) || (t.set(n, e.cloneNode(!0)), r = !0);
    }
    if (r) return;
  }
  let a = e.querySelectorAll(`:scope > div, :scope > p, :scope > section`);
  for (let e of Array.from(a)) {
    let n = `child_${t.size}`;
    !t.has(n) && e.textContent?.trim() && t.set(n, e.cloneNode(!0));
  }
}
function g(e) {
  let t = e.querySelector(`table`) || e,
    n = Array.from(t.querySelectorAll(`tr`));
  if (n.length === 0) return { type: `table`, headers: [], rows: [] };
  let r = n[0];
  return {
    type: `table`,
    headers: Array.from(r.querySelectorAll(`th, td`)).map(e => ({ children: a(e) })),
    rows: n.slice(1).map(e => Array.from(e.querySelectorAll(`td, th`)).map(e => ({ children: a(e) })))
      .filter(e => e.some(e => e.children.some(e => e.content && e.content.trim())))
  };
}
function isCatalog(e) {
  let t = e.getAttribute(`data-block-type`) || ``;
  if (t === `catalog` || t === `toc` || t === `table_of_contents` || t === `outline`) return !0;
  let n = Array.from(e.querySelectorAll(`a`));
  if (n.length < 5) return !1;
  let r = 0, s = 0;
  for (let a of n) {
    let h = c(a.getAttribute(`href`) || a.getAttribute(`data-href`) || ``);
    if (h.startsWith(`#`)) s++;
    r += (a.textContent || ``).length;
  }
  if (s < 5) return !1;
  let i = (e.textContent || ``).replace(/\s/g, ``).length;
  return i > 0 && r > i * .8;
}
function isCatalogInline(e) {
  let t = 0, n = 0;
  for (let r of e) {
    if (r.type !== `text`) continue;
    n += r.content.length;
    if (r.marks.some(e => e.type === `link`)) t += r.content.length;
  }
  return t > 20 && n > 0 && t > n * .8;
}

// ============ 构造模拟飞书表格 DOM ============
// 飞书表格结构 (简化):
// <div data-block-type="table" data-block-id="block-tbl">
//   <table>
//     <tbody>
//       <tr data-record-id="r-h">
//         <td data-block-id="c-h1" data-record-id="r-h1">​**阶段**​​</td>
//         <td data-block-id="c-h2">​**信息展示内容**​​</td>
//         <td>​(空)​</td> x 6
//       </tr>
//       <tr>...数据行 1...</tr>
//       <tr>...数据行 2 - 内容分散...</tr>
//       <tr>...14 个空行...</tr>
//     </tbody>
//   </table>
// </div>
function buildMockDOM() {
  const ZWSP = '\u200B';
  function td(text, { blockId, recordId } = {}) {
    const attrs = {};
    if (blockId) attrs['data-block-id'] = blockId;
    if (recordId) attrs['data-record-id'] = recordId;
    const cellDiv = new MockNode({
      tagName: 'div',
      className: 'cell-content',
      children: [new MockNode({ nodeType: 3, textContent: ZWSP + text + ZWSP + ZWSP })],
    });
    const tdNode = new MockNode({ tagName: 'td', attrs, children: [cellDiv] });
    cellDiv.parentElement = tdNode;
    return tdNode;
  }
  function emptyTd() {
    const tdNode = new MockNode({
      tagName: 'td',
      children: [new MockNode({ nodeType: 3, textContent: ZWSP })],
    });
    tdNode.children[0].parentElement = tdNode;
    return tdNode;
  }
  function tr(cells, recordId) {
    const attrs = recordId ? { 'data-record-id': recordId } : {};
    const trNode = new MockNode({ tagName: 'tr', attrs, children: cells });
    cells.forEach(c => (c.parentElement = trNode));
    return trNode;
  }

  const headerTr = tr([
    td('**阶段**', { blockId: 'c-h1', recordId: 'r-h1' }),
    td('**信息展示内容**', { blockId: 'c-h2' }),
    emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(),
  ], 'r-header');

  const row1 = tr([
    td('**牌墙**'),
    td('无牌墙，设置中也无法打开'),
    emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(),
    td('/'),
  ]);

  const row2 = tr([
    td('选字孝感'),
    td('无字时跳过该环节'),
    emptyTd(),
    td('固定字时...'),
    emptyTd(),
    td('选字时...'),
    emptyTd(),
    td('孝感卡五星专属'),
  ]);

  const emptyRows = [];
  for (let i = 0; i < 14; i++) {
    emptyRows.push(tr([emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd(), emptyTd()]));
  }

  const tbody = new MockNode({ tagName: 'tbody', children: [headerTr, row1, row2, ...emptyRows] });
  [headerTr, row1, row2, ...emptyRows].forEach(r => (r.parentElement = tbody));

  const table = new MockNode({ tagName: 'table', children: [tbody] });
  tbody.parentElement = table;

  const tableBlock = new MockNode({
    tagName: 'div',
    attrs: { 'data-block-type': 'table', 'data-block-id': 'block-tbl-1' },
    children: [table],
  });
  table.parentElement = tableBlock;

  const docContent = new MockNode({
    tagName: 'div',
    className: 'doc-content',
    children: [tableBlock],
  });
  tableBlock.parentElement = docContent;

  return { docContent, tableBlock, table, headerTr, row1, row2, emptyRows };
}

// ============ 测试 1: n 函数跳过 table 内的元素 ============
function test1() {
  console.log('--- 测试 1: n 函数跳过 table 内的元素 ---');
  const { docContent } = buildMockDOM();
  global.document = docContent;

  const blocks = new Map();
  n(docContent, blocks);

  console.log(`  收集到 ${blocks.size} 个 block`);
  for (const [key, el] of blocks) {
    const blockType = el.getAttribute('data-block-type') || '';
    const blockId = el.getAttribute('data-block-id') || '';
    const recordId = el.getAttribute('data-record-id') || '';
    console.log(`  - ${key}: <${el.tagName}> block-type=${blockType} block-id=${blockId} record-id=${recordId}`);
  }

  const hasTableCell = Array.from(blocks.values()).some(el =>
    el.tagName === 'TD' || el.tagName === 'TR'
  );
  // 期望: 只收集到 table block 本身 (1 个), 不含 cell/tr
  if (blocks.size === 1 && !hasTableCell) {
    console.log('  [通过] 只收集 table block, 没有收集表格内的 cell/tr');
    return true;
  }
  console.log(`  [失败] 应收集 1 个, 实际 ${blocks.size} 个; 含表格内元素: ${hasTableCell}`);
  return false;
}

// ============ 测试 2: o 函数过滤零宽空格 ============
function test2() {
  console.log('\n--- 测试 2: o 函数过滤零宽空格 ---');
  const ZWSP = '\u200B';
  const cell = new MockNode({
    tagName: 'td',
    children: [new MockNode({ nodeType: 3, textContent: ZWSP + '**阶段**' + ZWSP + ZWSP })],
  });
  cell.children[0].parentElement = cell;

  const result = a(cell);
  console.log(`  解析结果: ${JSON.stringify(result)}`);

  if (result.length === 1 && result[0].content === '**阶段**') {
    console.log('  [通过] 零宽空格已被过滤');
    return true;
  }
  console.log(`  [失败] 期望 content='**阶段**', 实际=${JSON.stringify(result)}`);
  return false;
}

// ============ 测试 3: g 函数过滤空行 ============
function test3() {
  console.log('\n--- 测试 3: g 函数过滤空行 ---');
  const { tableBlock, table } = buildMockDOM();

  // 调试: 检查 querySelector 是否能找到 table
  const foundTable = tableBlock.querySelector('table');
  console.log(`  调试: tableBlock.querySelector('table') => ${foundTable ? foundTable.tagName : 'null'}`);
  if (foundTable) {
    const trs = foundTable.querySelectorAll('tr');
    console.log(`  调试: table.querySelectorAll('tr').length => ${trs.length}`);
  }

  const result = g(tableBlock);
  console.log(`  表头列数: ${result.headers.length}`);
  console.log(`  数据行数: ${result.rows.length} (修复前应为 16: 2 个有内容 + 14 个空)`);

  if (result.rows.length === 2) {
    console.log('  [通过] 已过滤 14 个空行');
    const r0 = result.rows[0].map(c => c.children.map(n => n.content).join(''));
    const r1 = result.rows[1].map(c => c.children.map(n => n.content).join(''));
    console.log(`  行 1: ${JSON.stringify(r0)}`);
    console.log(`  行 2: ${JSON.stringify(r1)}`);
    return true;
  }
  console.log(`  [失败] 期望 2 行, 实际 ${result.rows.length} 行`);
  return false;
}

// ============ 测试 4: isCatalog 识别目录块 ============
function test4() {
  console.log('\n--- 测试 4: isCatalog 识别目录块 ---');

  // 构造目录块: 6 个 <a href="#anchorN">链接, 文本主要是链接
  const links = [];
  const titles = ['一、需求概况', '1、需求背景', '2、需求目标', '二、功能详情', '2.0 对局节奏', '2.1 游戏规则'];
  for (let i = 0; i < titles.length; i++) {
    const a = new MockNode({
      tagName: 'a',
      attrs: { href: '#anchor' + i },
      children: [new MockNode({ nodeType: 3, textContent: titles[i] })],
    });
    a.children[0].parentElement = a;
    links.push(a);
  }
  const catalog = new MockNode({
    tagName: 'div',
    attrs: { 'data-block-type': 'heading1' },
    children: links,
  });
  links.forEach(l => (l.parentElement = catalog));

  const result = isCatalog(catalog);
  console.log(`  isCatalog 返回: ${result}`);

  // 再构造一个正常段落 (只有 2 个链接) - 不应被识别为目录
  const normalPara = new MockNode({
    tagName: 'div',
    attrs: { 'data-block-type': 'text' },
    children: [
      new MockNode({ nodeType: 3, textContent: '这是一段正常文字，' }),
      new MockNode({ tagName: 'a', attrs: { href: '#ref1' }, children: [new MockNode({ nodeType: 3, textContent: '参考链接1' })] }),
      new MockNode({ nodeType: 3, textContent: '以及' }),
      new MockNode({ tagName: 'a', attrs: { href: '#ref2' }, children: [new MockNode({ nodeType: 3, textContent: '参考链接2' })] }),
    ],
  });
  normalPara.children.forEach(c => (c.parentElement = normalPara));
  const result2 = isCatalog(normalPara);
  console.log(`  正常段落 isCatalog 返回: ${result2} (应为 false)`);

  if (result === true && result2 === false) {
    console.log('  [通过] 目录块被正确识别, 正常段落不被误判');
    return true;
  }
  console.log(`  [失败] 目录=${result}, 正常段落=${result2}`);
  return false;
}

// ============ 测试 5: I 函数去重 + isCatalogInline 过滤目录 heading ============
function test5() {
  console.log('\n--- 测试 5: I 去重 + isCatalogInline 过滤目录 heading ---');
  function Lmock(e) {
    const text = e.textContent;
    if (!text) return null;
    // 模拟 heading 解析: 如果块有 data-block-type=heading, 返回 heading
    const bt = e.getAttribute('data-block-type') || '';
    if (bt.startsWith('heading')) {
      return { type: 'heading', level: 1, children: [{ type: 'text', content: text, marks: [{ type: 'link', url: '#a1' }] }] };
    }
    return { type: 'paragraph', children: [{ type: 'text', content: text, marks: [] }] };
  }
  // 复制 I 函数的最新逻辑 (含 isCatalogInline 过滤)
  function Itest(blocks) {
    let t = [], n = new Set;
    for (let r of blocks) {
      let e = Lmock(r);
      if (e === null) continue;
      if (e.type === 'heading' && isCatalogInline(e.children)) continue;
      let i = JSON.stringify(e);
      if (n.has(i)) continue;
      n.add(i), t.push(e);
    }
    return { type: 'document', title: 'test', children: t };
  }

  // 3 个 block: 1 个目录 heading (link marks), 2 个重复段落
  const linkText = '标题1标题2标题3标题4标题5标题6标题7标题8';
  const catalogBlock = new MockNode({
    tagName: 'div',
    attrs: { 'data-block-type': 'heading1' },
    children: [new MockNode({ nodeType: 3, textContent: linkText })],
  });
  const para1 = new MockNode({ tagName: 'div', children: [new MockNode({ nodeType: 3, textContent: '普通段落' })] });
  const para2 = new MockNode({ tagName: 'div', children: [new MockNode({ nodeType: 3, textContent: '普通段落' })] });

  // 验证 isCatalogInline
  const catalogParsed = Lmock(catalogBlock);
  console.log(`  isCatalogInline(目录heading) = ${isCatalogInline(catalogParsed.children)} (应 true)`);
  const paraParsed = Lmock(para1);
  console.log(`  isCatalogInline(普通段落) = ${isCatalogInline(paraParsed.children)} (应 false)`);

  const result = Itest([catalogBlock, para1, para2]);
  console.log(`  输入 3 个 block (1 目录 + 2 重复段落), 输出 ${result.children.length} 个 (期望 1: 只剩段落)`);

  if (result.children.length === 1 && result.children[0].type === 'paragraph') {
    console.log('  [通过] 目录 heading 被过滤, 重复段落去重');
    return true;
  }
  console.log(`  [失败] 期望 1 个段落, 实际 ${JSON.stringify(result.children.map(c => c.type))}`);
  return false;
}

// ============ 运行所有测试 ============
const results = [test1(), test2(), test3(), test4(), test5()];
const passCount = results.filter(Boolean).length;
console.log(`\n=== 测试结果: ${passCount}/${results.length} 通过 ===`);
process.exit(passCount === results.length ? 0 : 1);
