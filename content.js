(function () {
  // 记录被 v() 作为 subList 处理的子列表项 blockId
  // I() 跳过这些 block, 避免双重输出(子列表项既在 subList 里又被独立收集)
  var subListBlockIds = new Set();
  var e = class {
    constructor(e) {
      ((this.onExport = e),
        (this.expanded = !1),
        (this.isDragging = !1),
        (this.dragOffset = { x: 0, y: 0 }),
        (this.container = document.createElement(`div`)),
        (this.container.id = `feishu-export-floating`),
        (this.shadow = this.container.attachShadow({ mode: `closed` })),
        this.shadow.appendChild(this.createPanel()),
        document.body.appendChild(this.container),
        this.restorePosition());
    }
    createPanel() {
      let e = document.createElement(`div`);
      e.innerHTML = `
      <style>
        .floating-wrapper {
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
        }
        .floating-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #3370ff;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s;
          user-select: none;
        }
        .floating-btn:hover { transform: scale(1.1); }
        .expand-panel {
          position: absolute;
          bottom: 52px;
          right: 0;
          background: white;
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          display: none;
          min-width: 140px;
        }
        .expand-panel.show { display: block; }
        .format-btn {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin: 2px 0;
          border: 1px solid #eee;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
          transition: background 0.15s;
        }
        .format-btn:hover { background: #f5f6f7; }
        .expand-panel.exporting .format-btn { display: none; }
        .progress-bar {
          width: 100%;
          height: 4px;
          background: #eee;
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
          display: none;
        }
        .progress-bar.show { display: block; }
        .progress-fill {
          height: 100%;
          background: #3370ff;
          width: 0%;
          transition: width 0.3s;
        }
        .status-text {
          font-size: 12px;
          color: #666;
          margin-top: 6px;
          text-align: center;
          display: none;
          white-space: nowrap;
        }
        .status-text.show { display: block; }
        .status-text.success { color: #00b578; }
        .status-text.error { color: #e00; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-icon {
          display: inline-block;
          width: 12px; height: 12px;
          border: 2px solid #ddd;
          border-top-color: #3370ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
          margin-right: 4px;
        }
      </style>
      <div class="floating-wrapper">
        <div class="expand-panel">
          <button class="format-btn" data-format="markdown">Markdown</button>
          <button class="format-btn" data-format="markdown-no-images">Markdown（不包含图片）</button>
          <button class="format-btn" data-format="html">HTML</button>
          <button class="format-btn" data-format="word">Word</button>
          <button class="format-btn" data-format="all">全部导出</button>
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="status-text"></div>
        </div>
        <button class="floating-btn" title="导出文档">⬇</button>
      </div>
    `;
      let t = e.querySelector(`.floating-btn`),
        n = e.querySelector(`.expand-panel`);
      (t.addEventListener(`click`, (e) => {
        this.isDragging ||
          (e.stopPropagation(),
          (this.expanded = !this.expanded),
          n.classList.toggle(`show`, this.expanded));
      }),
        e.querySelectorAll(`.format-btn`).forEach((e) => {
          e.addEventListener(`click`, (e) => {
            let t = e.target.dataset.format,
              n = t === `all` ? [`markdown`, `html`, `word`] : [t];
            (this.setExporting(!0), this.onExport(n));
          });
        }));
      let r = e.querySelector(`.floating-wrapper`),
        i = 0,
        a = 0,
        o = !1;
      return (
        t.addEventListener(`mousedown`, (e) => {
          let t = e;
          ((i = t.clientX), (a = t.clientY), (o = !1), (this.isDragging = !1));
          let n = (e) => {
              let t = e.clientX - i,
                n = e.clientY - a;
              (Math.abs(t) > 3 || Math.abs(n) > 3) &&
                ((o = !0),
                (this.isDragging = !0),
                (r.style.left = `${r.offsetLeft + t}px`),
                (r.style.top = `${r.offsetTop + n}px`),
                (r.style.right = `auto`),
                (r.style.bottom = `auto`),
                (i = e.clientX),
                (a = e.clientY));
            },
            s = () => {
              (document.removeEventListener(`mousemove`, n),
                document.removeEventListener(`mouseup`, s),
                o &&
                  (this.savePosition(r),
                  setTimeout(() => {
                    this.isDragging = !1;
                  }, 50)));
            };
          (document.addEventListener(`mousemove`, n), document.addEventListener(`mouseup`, s));
        }),
        e
      );
    }
    updateProgress(e, t) {
      let n = this.shadow.querySelector(`.progress-bar`),
        r = this.shadow.querySelector(`.progress-fill`),
        i = this.shadow.querySelector(`.status-text`);
      !n ||
        !r ||
        !i ||
        (n.classList.add(`show`),
        i.classList.add(`show`),
        i.classList.remove(`success`, `error`),
        (r.style.width = `${e}%`),
        t && (i.innerHTML = e < 100 ? `<span class="loading-icon"></span>${t}` : t),
        e >= 100 &&
          (i.classList.add(`success`),
          (i.innerHTML = `导出成功!`),
          setTimeout(() => {
            (n.classList.remove(`show`),
              i.classList.remove(`show`),
              (r.style.width = `0%`),
              this.setExporting(!1));
          }, 3e3)));
    }
    showError(e) {
      let t = this.shadow.querySelector(`.status-text`);
      t &&
        (t.classList.add(`show`, `error`),
        (t.innerHTML = e),
        setTimeout(() => {
          (t.classList.remove(`show`), this.setExporting(!1));
        }, 5e3));
    }
    setExporting(e) {
      let t = this.shadow.querySelector(`.expand-panel`);
      t &&
        (e
          ? (t.classList.add(`show`, `exporting`), (this.expanded = !0))
          : t.classList.remove(`exporting`));
    }
    async savePosition(e) {
      let t = e.getBoundingClientRect();
      await chrome.storage.local.set({ floatingPosition: { left: t.left, top: t.top } });
    }
    async restorePosition() {
      let e = (await chrome.storage.local.get(`floatingPosition`)).floatingPosition;
      if (e) {
        let t = this.shadow.querySelector(`.floating-wrapper`);
        t &&
          ((t.style.position = `fixed`),
          (t.style.left = `${e.left}px`),
          (t.style.top = `${e.top}px`),
          (t.style.right = `auto`),
          (t.style.bottom = `auto`));
      }
    }
  };
  async function t(e) {
    let t = new Map(),
      a = r();
    a ||
      console.warn(`[feishu-export] Cannot find scroll container, using document.documentElement`);
    let o = a || document.documentElement,
      s = o.scrollHeight,
      c = o.scrollTop;
    (console.log(`[feishu-export] Scroll container: ${o.className || o.tagName}, height=${s}`),
      (o.scrollTop = 0),
      await i(500));
    let l = Date.now();
    for (; n(o, t), !(o.scrollTop + o.clientHeight >= o.scrollHeight - 10);) {
      if (Date.now() - l > 18e4) {
        console.warn(`[feishu-export] Scroll timeout, using collected content`);
        break;
      }
      (o.scrollBy(0, o.clientHeight * 0.7),
        await i(350),
        e({
          stage: `scrolling`,
          progress: Math.min((o.scrollTop / (s - o.clientHeight)) * 100, 100) * 0.3
        }));
    }
    return (
      n(o, t),
      (o.scrollTop = c),
      console.log(`[feishu-export] Scroll complete. Collected ${t.size} unique blocks`),
      Array.from(t.values())
    );
  }
  // 收集文档 block, 全局扫描 document
  // 不跳过嵌套 block: 飞书 DOM 把所有内容嵌套在 page block 里,
  // 跳过嵌套会导致只收集到顶层 page block, 其克隆只含首次调用时的
  // 可见子 block(虚拟滚动), 大量内容丢失
  // 改为: 所有 block 独立收集, 用 blockId 去重消除重复
  // 保留: 不提前返回 + DOM 元素去重 + 表格内跳过
  function n(e, t) {
    let seen = new Set();
    // 收集 data-record-id (多维表格记录)
    for (let el of Array.from(document.querySelectorAll(`[data-record-id]`))) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (el.closest(`table`)) continue;
      let id = el.getAttribute(`data-record-id`);
      t.has(id) || t.set(id, el.cloneNode(!0));
    }
    // 收集 data-block-id (普通文档块), 不跳过嵌套, 不提前返回
    for (let el of Array.from(document.querySelectorAll(`[data-block-id]`))) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (el.closest(`table`) && el.getAttribute(`data-block-type`) !== `table`) continue;
      let id = el.getAttribute(`data-block-id`);
      t.has(id) || t.set(id, el.cloneNode(!0));
    }
    // fallback: 无任何 block 标记时, 收集直接子元素
    if (t.size === 0) {
      let children = e.querySelectorAll(`:scope > div, :scope > p, :scope > section`);
      for (let el of Array.from(children)) {
        let id = `child_${t.size}`;
        !t.has(id) && el.textContent?.trim() && t.set(id, el.cloneNode(!0));
      }
    }
  }
  function r() {
    for (let e of [
      `.bear-web-x-container`,
      `.doc-content-container`,
      `[class*="page-content"]`,
      `[class*="doc-content"]`,
      `[class*="lark-docs"]`
    ]) {
      let t = document.querySelector(e);
      if (t && t.scrollHeight > t.clientHeight + 50)
        return (
          console.log(
            `[feishu-export] Found scroll container: "${e}" (scrollHeight=${t.scrollHeight})`
          ),
          t
        );
    }
    let e = Array.from(document.querySelectorAll(`div, main, section`)).filter((e) => {
      let t = getComputedStyle(e);
      return (
        e.scrollHeight > e.clientHeight + 200 &&
        (t.overflow === `auto` ||
          t.overflow === `scroll` ||
          t.overflowY === `auto` ||
          t.overflowY === `scroll`)
      );
    });
    if (e.length > 0) {
      let t = e.sort((e, t) => t.scrollHeight - e.scrollHeight)[0];
      return (
        console.log(
          `[feishu-export] Fallback scroll container: ${t.className || t.tagName} (scrollHeight=${t.scrollHeight})`
        ),
        t
      );
    }
    return null;
  }
  function i(e) {
    return new Promise((t) => setTimeout(t, e));
  }
  function a(e) {
    let t = [];
    return (o(e, [], t), l(t));
  }
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
    let t = [],
      n = e.style;
    return (
      (e.tagName === `B` ||
        e.tagName === `STRONG` ||
        n?.fontWeight === `bold` ||
        parseInt(n?.fontWeight) >= 700) &&
        t.push({ type: `bold` }),
      (e.tagName === `I` || e.tagName === `EM` || n?.fontStyle === `italic`) &&
        t.push({ type: `italic` }),
      (e.tagName === `S` || e.tagName === `DEL` || n?.textDecoration?.includes(`line-through`)) &&
        t.push({ type: `strikethrough` }),
      (e.tagName === `U` || n?.textDecoration?.includes(`underline`)) &&
        t.push({ type: `underline` }),
      t
    );
  }
  function c(e) {
    try {
      return decodeURIComponent(e);
    } catch {
      return e;
    }
  }
  function l(e) {
    if (e.length === 0) return [];
    let t = [e[0]];
    for (let n = 1; n < e.length; n++) {
      let r = t[t.length - 1],
        i = e[n];
      JSON.stringify(r.marks) === JSON.stringify(i.marks) ? (r.content += i.content) : t.push(i);
    }
    return t;
  }
  function u(e) {
    return (e.getAttribute(`data-block-type`) || ``).startsWith(`heading`)
      ? !0
      : !!e.querySelector(`h1, h2, h3, h4, h5, h6`);
  }
  function d(e, t) {
    let n = 1,
      r = t.match(/heading(\d)/);
    if (r) n = Math.min(Math.max(parseInt(r[1]), 1), 6);
    else {
      let t = e.querySelector(`h1, h2, h3, h4, h5, h6`);
      t && (n = parseInt(t.tagName[1]));
    }
    return { type: `heading`, level: n, children: a(e) };
  }
  function f(e) {
    return { type: `paragraph`, children: a(e) };
  }
  function p(e) {
    return (
      (e.getAttribute(`data-block-type`) || ``) === `code` ||
      e.classList.contains(`docx-code-block`) ||
      !!e.querySelector(`pre code`)
    );
  }
  function m(e) {
    let t = e.querySelector(`code`) || e.querySelector(`pre`) || e.querySelector(`.code-block`),
      n = ``;
    if (t) {
      let e = t.querySelectorAll(`[data-line]`);
      n =
        e.length > 0
          ? Array.from(e).map((e) => e.textContent || ``).join(`
`)
          : t.textContent || ``;
    } else n = e.textContent || ``;
    let r = ``,
      i = e.querySelector(`[class*="language-label"], [class*="code-lang"], [data-language]`);
    if ((i && (r = i.textContent?.trim() || i.getAttribute(`data-language`) || ``), !r)) {
      let t = (e.querySelector(`code`)?.className || ``).match(/language-(\w+)/);
      t && (r = t[1]);
    }
    return { type: `code`, language: r, content: n.trim() };
  }
  function h(e) {
    return (e.getAttribute(`data-block-type`) || ``) === `table` || !!e.querySelector(`table`);
  }
  function g(e) {
    let t = e.querySelector(`table`) || e,
      n = Array.from(t.querySelectorAll(`tr`));
    if (n.length === 0) return { type: `table`, headers: [], rows: [] };
    let r = n[0];
    return {
      type: `table`,
      headers: Array.from(r.querySelectorAll(`th, td`)).map((e) => ({ children: a(e) })),
      rows: n
        .slice(1)
        .map((e) => Array.from(e.querySelectorAll(`td, th`)).map((e) => ({ children: a(e) })))
        .filter((e) => e.some((e) => e.children.some((e) => e.content && e.content.trim())))
    };
  }
  function _(e, t) {
    let n = e.getAttribute(`data-block-type`) || ``;
    return (
      n === `bullet` ||
      n === `ordered` ||
      n === `todo` ||
      e.classList.contains(`docx-bullet-block`) ||
      e.classList.contains(`docx-ordered-block`) ||
      e.classList.contains(`docx-todo-block`)
    );
  }
  // 解析列表项, 递归构建子列表, 不再展平成一行
  // 1. 克隆 e, 移除子列表项 block, 用 a() 收集直接文本
  // 2. 递归处理直接子列表项 block, 生成 subList
  // 3. 把子列表项 blockId 记录到 subListBlockIds, I() 跳过独立收集的版本
  function v(e, t) {
    let n = t || e.getAttribute(`data-block-type`) || ``,
      r = `unordered`;
    n === `ordered` || e.classList.contains(`docx-ordered-block`)
      ? (r = `ordered`)
      : (n === `todo` || e.classList.contains(`docx-todo-block`)) && (r = `todo`);
    let i = r === `todo` ? y(e) : void 0;
    // 提取直接文本: 克隆后移除子列表项 block, 避免子内容被合并到父项
    let childListSel = `[data-block-type="bullet"], [data-block-type="ordered"], [data-block-type="todo"], .docx-bullet-block, .docx-ordered-block, .docx-todo-block`;
    let cloned = e.cloneNode(true);
    for (let child of cloned.querySelectorAll(childListSel)) {
      child.remove();
    }
    let mainContent = a(cloned);
    let item = { children: mainContent, ...(i === void 0 ? {} : { checked: i }) };
    // 递归处理直接子列表项 (从 child.parentElement 向上找, 遇到 e 之前不能有其他列表项)
    let childListBlocks = Array.from(e.querySelectorAll(childListSel)).filter((child) => {
      let p = child.parentElement;
      while (p && p !== e) {
        let bt = p.getAttribute && p.getAttribute(`data-block-type`);
        if (bt === `bullet` || bt === `ordered` || bt === `todo`) return false;
        p = p.parentElement;
      }
      return true;
    });
    if (childListBlocks.length > 0) {
      // 合并连续同类型子列表项为一个 list
      let subList = null;
      for (let child of childListBlocks) {
        let childType = child.getAttribute(`data-block-type`) || ``;
        let childBlockId = child.getAttribute(`data-block-id`) || child.getAttribute(`data-record-id`) || ``;
        if (childBlockId) subListBlockIds.add(childBlockId);
        let childList = v(child, childType);
        if (subList && subList.style === childList.style) {
          subList.items.push(...childList.items);
        } else if (!subList) {
          subList = childList;
        }
      }
      if (subList) item.subList = subList;
    }
    return { type: `list`, style: r, items: [item] };
  }
  function y(e) {
    let t = e.querySelector(`input[type="checkbox"]`);
    return t
      ? t.checked
      : e.querySelector(`[class*="checked"]`) !== null || e.getAttribute(`data-checked`) === `true`;
  }
  function b(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    return (
      t === `quote_container` ||
      t === `quote` ||
      e.classList.contains(`docx-quote_container-block`) ||
      !!e.querySelector(`blockquote`)
    );
  }
  function x(e) {
    let t = [],
      n = e.querySelectorAll(`[data-block-type]`);
    if (n.length > 1)
      for (let e of Array.from(n))
        e.getAttribute(`data-block-type`) !== `quote_container` && t.push(f(e));
    return (t.length === 0 && t.push(f(e)), { type: `quote`, children: t });
  }
  function S(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    return (
      t === `divider` ||
      t === `horizontal_rule` ||
      !!e.querySelector(`hr`) ||
      e.classList.contains(`docx-divider-block`)
    );
  }
  function C() {
    return { type: `divider` };
  }
  function w(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    return t === `image` || t === `gallery` || !!e.querySelector(`img[src*="feishucdn"]`);
  }
  function T(e) {
    let t = E(e) || e.querySelector(`img`),
      n = t ? D(t) : ``;
    return (
      (n = k(n)),
      {
        type: `image`,
        src: n,
        alt: t?.alt || ``,
        caption: e.querySelector(`[class*="caption"]`)?.textContent?.trim() || void 0
      }
    );
  }
  function E(e) {
    return Array.from(e.querySelectorAll(`img`)).find((e) => !!D(e)) || null;
  }
  function D(e) {
    let t = [
        `data-src`,
        `data-original-src`,
        `data-origin-src`,
        `data-original`,
        `data-url`,
        `src`
      ],
      n = ``;
    for (let r of t) {
      let t = e.getAttribute(r)?.trim();
      if (!t) continue;
      let i = O(t);
      if (i && !i.startsWith(`blob:`)) return i;
      !n && i.startsWith(`blob:`) && (n = i);
    }
    return n;
  }
  function O(e) {
    if (!e.startsWith(`blob:`)) return e;
    let t = e.matchAll(/https?:\/\/[^\s"'<>]+/g);
    for (let n of t) {
      let t = n.index ?? 0;
      if (e.slice(Math.max(0, t - 5), t) !== `blob:`) return n[0];
    }
    return e;
  }
  function k(e) {
    return !e.includes(`feishucdn.com`) || e.includes(`image_size=noop`)
      ? e
      : e.replace(/([?&])image_size=[^&]*/, `$1image_size=noop`);
  }
  function A(e) {
    return (
      (e.getAttribute(`data-block-type`) || ``) === `equation` ||
      !!e.querySelector(`.katex, .mathjax, [data-latex]`) ||
      !!e.querySelector(`[class*="equation"]`)
    );
  }
  function j(e) {
    let t = e.querySelector(`[data-latex]`);
    if (t) return { type: `math`, content: t.getAttribute(`data-latex`) || ``, inline: !1 };
    let n = e.querySelector(`annotation[encoding="application/x-tex"]`);
    if (n) return { type: `math`, content: n.textContent || ``, inline: !1 };
    let r = e.querySelector(`.katex-mathml annotation`);
    return r
      ? { type: `math`, content: r.textContent || ``, inline: !1 }
      : { type: `math`, content: e.textContent?.trim() || ``, inline: !1 };
  }
  function M(e) {
    return (
      (e.getAttribute(`data-block-type`) || ``) === `callout` ||
      e.classList.contains(`docx-callout-block`) ||
      e.classList.contains(`callout-block`)
    );
  }
  function N(e) {
    let t = e.querySelector(`[class*="emoji"], [data-emoji]`)?.textContent?.trim(),
      n = [],
      r = e.querySelectorAll(`[data-block-type]`);
    if (r.length > 0)
      for (let e of Array.from(r)) {
        if (e.getAttribute(`data-block-type`) === `callout`) continue;
        let t = e.querySelector(`.zone-container`) || e;
        n.push({ type: `paragraph`, children: a(t) });
      }
    if (n.length === 0) {
      let t = e.querySelector(`.zone-container`) || e.querySelector(`[class*="content"]`) || e;
      n.push(f(t));
    }
    return { type: `callout`, emoji: t || void 0, children: n };
  }
  function P(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    return (
      t === `embed` ||
      t === `iframe` ||
      t === `bitable` ||
      t === `mindnote` ||
      t === `file` ||
      t === `board` ||
      !!e.querySelector(`iframe[src]`)
    );
  }
  function F(e) {
    let t = e.getAttribute(`data-block-type`) || ``,
      n =
        e.querySelector(`iframe[src]`)?.getAttribute(`src`) || e.getAttribute(`data-url`) || void 0,
      r =
        e.querySelector(`[class*="title"]`)?.textContent?.trim() ||
        e.querySelector(`[class*="name"]`)?.textContent?.trim() ||
        e.getAttribute(`data-title`) ||
        void 0,
      i = `unknown`;
    return (
      t === `bitable` || n?.includes(`bitable`)
        ? (i = `bitable`)
        : t === `mindnote` || n?.includes(`mindnote`)
          ? (i = `mindmap`)
          : t === `file` && (i = `file`),
      { type: `embed`, embedType: i, url: n, title: r }
    );
  }
  function isCatalog(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    if (t === `catalog` || t === `toc` || t === `table_of_contents` || t === `outline`) return !0;
    let n = Array.from(e.querySelectorAll(`a`));
    if (n.length < 5) return !1;
    let r = 0,
      s = 0;
    for (let a of n) {
      let h = c(a.getAttribute(`href`) || a.getAttribute(`data-href`) || ``);
      if (h.startsWith(`#`)) s++;
      r += (a.textContent || ``).length;
    }
    if (s < 5) return !1;
    let i = (e.textContent || ``).replace(/\s/g, ``).length;
    return i > 0 && r > i * 0.8;
  }
  function isCatalogInline(e) {
    let t = 0,
      n = 0;
    for (let r of e) {
      if (r.type !== `text`) continue;
      n += r.content.length;
      if (r.marks.some((e) => e.type === `link`)) t += r.content.length;
    }
    return t > 20 && n > 0 && t > n * 0.8;
  }
  // 递归处理容器的直接子 block
  // 只处理"直接子 block"(最近祖先容器是 e), 嵌套的更深 block 由直接子 block 递归处理
  // 这样超大容器内的 table/heading/code 等都能被 L 正确识别, 而不是合并成一串文本
  // 同时查询 data-block-id 和 data-record-id, 覆盖飞书不同的 block 标记方式
  function processContainer(e) {
    let t = [];
    let n = e.querySelectorAll(`[data-block-id], [data-record-id]`);
    let seen = new Set();
    for (let r of Array.from(n)) {
      if (seen.has(r)) continue;
      seen.add(r);
      // 判断 r 是否是 e 的直接子 block: 从 r.parentElement 向上找, 遇到 e 之前不能有其他 block 标记
      let p = r.parentElement;
      let isDirect = !0;
      while (p && p !== e) {
        if (p.hasAttribute && (p.hasAttribute(`data-block-id`) || p.hasAttribute(`data-record-id`))) {
          isDirect = !1;
          break;
        }
        p = p.parentElement;
      }
      if (!isDirect) continue;
      // 跳过 table 内部元素(由 g 函数处理)
      if (r.closest(`table`) && r !== e) continue;
      let parsed = L(r);
      if (parsed !== null) t.push(parsed);
    }
    return t.length === 0 ? null : { type: `container`, children: t };
  }
  function I(e) {
    subListBlockIds.clear();
    let t = [],
      n = new Set();
    for (let r of e) {
      // 跳过已被 v() 作为 subList 处理的子列表项, 避免双重输出
      let bid = r.getAttribute(`data-block-id`) || r.getAttribute(`data-record-id`) || ``;
      if (bid && subListBlockIds.has(bid)) continue;
      let e = L(r);
      if (e === null) continue;
      if (e.type === `heading` && isCatalogInline(e.children)) continue;
      // 递归展开 container: 把容器的 children 提升到文档顶层
      // container 可能嵌套(容器内的容器), 需要递归展开到底
      let expanded = expandContainer(e, n);
      t.push(...expanded);
    }
    return { type: `document`, title: R(e), children: t };
  }
  // 递归展开 container, 用 blockId 去重
  // 不跳过嵌套 block 后, 容器(page)和子 block 都被独立收集
  // 容器展开时子 block 的 blockId 被记录, 独立收集的同 blockId block 被跳过
  // 无 blockId 时 fallback 到 JSON.stringify
  function expandContainer(e, seen) {
    if (e.type === `container`) {
      let result = [];
      for (let c of e.children) {
        result.push(...expandContainer(c, seen));
      }
      return result;
    }
    let k = e.blockId || JSON.stringify(e);
    if (seen.has(k)) return [];
    seen.add(k);
    return [e];
  }
  // 给解析结果附加 blockId, 用于精确去重
  function withBlockId(node, blockId) {
    if (node && blockId) node.blockId = blockId;
    return node;
  }
  function L(e) {
    let t = e.getAttribute(`data-block-type`) || ``;
    let blockId = e.getAttribute(`data-block-id`) || e.getAttribute(`data-record-id`) || ``;
    // 空文本且无任何内容元素: 跳过
    if (!e.textContent?.trim() && !e.querySelector(`img, iframe, hr, table`)) return null;
    // 目录块: 跳过
    if (isCatalog(e)) return null;
    // page/grid/grid_column: 当作容器递归处理子 block (不再返回 null 丢失内容)
    if (t === `page` || t === `grid` || t === `grid_column` || e.classList.contains(`docx-block-zero-space`))
      return withBlockId(processContainer(e), blockId);
    // 容器检测: 包含多个子 block 且不是已知的内容块类型 -> 递归处理
    // 放在 u(e) 之前, 避免超大容器因内部有 <h1> 被误判为 heading
    if (
      t !== `table` &&
      t !== `quote_container` &&
      t !== `callout` &&
      !t.startsWith(`heading`) &&
      t !== `code` &&
      t !== `image` &&
      t !== `gallery` &&
      t !== `equation` &&
      t !== `embed` &&
      t !== `iframe` &&
      t !== `divider` &&
      t !== `horizontal_rule` &&
      t !== `bullet` &&
      t !== `ordered` &&
      t !== `todo` &&
      !e.classList.contains(`docx-bullet-block`) &&
      !e.classList.contains(`docx-ordered-block`) &&
      !e.classList.contains(`docx-todo-block`)
    ) {
      let subBlocks = e.querySelectorAll(`[data-block-id]`);
      if (subBlocks.length > 1) return withBlockId(processContainer(e), blockId);
    }
    let result = t.startsWith(`heading`)
      ? d(e, t)
      : t === `code`
        ? m(e)
        : t === `table`
          ? g(e)
          : t === `equation`
            ? j(e)
            : t === `image` || t === `gallery`
              ? T(e)
              : t === `callout`
                ? N(e)
                : t === `quote_container`
                  ? x(e)
                  : t === `divider` || t === `horizontal_rule`
                    ? C()
                    : t === `embed` || t === `iframe`
                      ? F(e)
                      : t === `bullet` ||
                          t === `ordered` ||
                          t === `todo` ||
                          e.classList.contains(`docx-bullet-block`) ||
                          e.classList.contains(`docx-ordered-block`) ||
                          e.classList.contains(`docx-todo-block`)
                        ? v(e, t)
                        : S(e)
                          ? C()
                          : u(e)
                            ? d(e, ``)
                            : p(e)
                              ? m(e)
                              : h(e)
                                ? g(e)
                                : A(e)
                                  ? j(e)
                                  : w(e)
                                    ? T(e)
                                    : P(e)
                                      ? F(e)
                                      : b(e)
                                        ? x(e)
                                        : M(e)
                                          ? N(e)
                                          : _(e, ``)
                                            ? v(e, ``)
                                            : f(e);
    return withBlockId(result, blockId);
  }
  function R(e) {
    for (let t of e)
      if (t.getAttribute(`data-block-type`) === `page`) {
        let e = z(t.querySelector(`h1`)?.textContent);
        if (e) return e;
      }
    for (let e of [
      `h1`,
      `[data-title]`,
      `[class*="title"] [contenteditable="true"]`,
      `[class*="title"]`,
      `[role="heading"]`
    ]) {
      let t = z(
        document.querySelector(e)?.getAttribute(`data-title`) ||
          document.querySelector(e)?.textContent
      );
      if (t) return t;
    }
    return (
      z(
        document.querySelector(`meta[property="og:title"]`)?.getAttribute(`content`) ||
          document.querySelector(`meta[name="title"]`)?.getAttribute(`content`)
      ) ||
      z(document.title) ||
      `Untitled`
    );
  }
  function z(e) {
    return e
      ? e
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ` `)
          .replace(/\s*-\s*飞书.*$/i, ``)
          .replace(/\s*-\s*Lark.*$/i, ``)
          .replace(/\s*-\s*Feishu.*$/i, ``)
          .replace(/\s+/g, ` `)
          .trim()
      : ``;
  }
  var B = !1,
    V;
  function H(e, t, n) {
    chrome.runtime
      .sendMessage({ action: `progress-update`, stage: e, progress: t, message: n })
      .catch(() => {});
  }
  async function U(e) {
    if (!B) {
      ((B = !0), console.log(`[feishu-export] Starting export, formats:`, e));
      try {
        (H(`scrolling`, 0, `正在加载完整文档...`), V?.updateProgress(5, `正在加载完整文档...`));
        let n = await t((e) => {
          (H(`scrolling`, e.progress, `正在加载文档 (${Math.round(e.progress)}%)`),
            V?.updateProgress(e.progress, `正在滚动加载文档...`));
        });
        if ((console.log(`[feishu-export] Collected ${n.length} blocks`), n.length === 0)) {
          let e = q();
          if (e.length === 0) throw Error(`无法找到文档内容块，飞书 DOM 结构可能已变化`);
          (n.push(...e), console.log(`[feishu-export] Fallback collected ${n.length} blocks`));
        }
        (H(`parsing`, 32, `正在解析文档内容...`), V?.updateProgress(32, `正在解析文档内容...`));
        let r = I(n);
        if (
          (console.log(`[feishu-export] Parsed: title="${r.title}", ${r.children.length} children`),
          r.children.length === 0)
        )
          throw Error(`文档解析结果为空`);
        V?.updateProgress(35, `解析完成`);
        let i = e.some((e) => e !== `markdown-no-images`)
          ? r.children
              .filter((e) => e.type === `image`)
              .map((e, t) => ({
                url: e.src,
                filename: `img_${String(t + 1).padStart(3, `0`)}.${J(e.src)}`
              }))
          : [];
        console.log(`[feishu-export] Found ${i.length} images`);
        let a = [];
        (i.length > 0 &&
          (H(`downloading`, 40, `正在下载图片 (0/${i.length})`),
          V?.updateProgress(40, `正在下载图片 (0/${i.length})`),
          (a = await W(i, (e, t) => {
            let n = 40 + (e / t) * 25;
            (H(`downloading`, n, `正在下载图片 (${e}/${t})`),
              V?.updateProgress(n, `正在下载图片 (${e}/${t})`));
          })),
          console.log(
            `[feishu-export] Downloaded ${a.filter((e) => e.success).length}/${a.length} images`
          )),
          H(`converting`, 68, `正在生成文件...`),
          V?.updateProgress(68, `正在生成并打包文件...`));
        let o = await chrome.runtime.sendMessage({
          action: `do-export`,
          doc: r,
          formats: e,
          images: a
        });
        console.log(`[feishu-export] Background response:`, o);
      } catch (e) {
        (console.error(`[feishu-export] Export failed:`, e),
          H(`packing`, 0, `导出失败: ${e.message}`),
          V?.showError(`导出失败: ${e.message}`),
          (B = !1));
      }
    }
  }
  async function W(e, t) {
    let n = [];
    for (let r = 0; r < e.length; r += 4) {
      let i = e.slice(r, r + 4),
        a = await Promise.all(
          i.map(async ({ url: e, filename: t }) => {
            try {
              let n;
              if (e.startsWith(`blob:`)) n = await G(e);
              else {
                let t = await fetch(e, { credentials: `include` });
                if (!t.ok) throw Error(`HTTP ${t.status}`);
                n = await K(await t.blob());
              }
              return { url: e, dataUrl: n, filename: t, success: !0 };
            } catch (n) {
              return (
                console.warn(`[feishu-export] Failed to download image: ${e}`, n),
                { url: e, dataUrl: ``, filename: t, success: !1 }
              );
            }
          })
        );
      (n.push(...a), t(n.length, e.length));
    }
    return n;
  }
  async function G(e) {
    let t = document.querySelector(`img[src="${e}"]`);
    if (!t) throw Error(`Cannot find img element for blob URL`);
    t.complete ||
      (await new Promise((e, n) => {
        ((t.onload = () => e()),
          (t.onerror = () => n(Error(`Image load failed`))),
          setTimeout(() => e(), 3e3));
      }));
    let n = document.createElement(`canvas`);
    ((n.width = t.naturalWidth || t.width), (n.height = t.naturalHeight || t.height));
    let r = n.getContext(`2d`);
    if (!r) throw Error(`Cannot get canvas context`);
    r.drawImage(t, 0, 0);
    try {
      return n.toDataURL(`image/png`);
    } catch {
      try {
        return n.toDataURL(`image/jpeg`, 0.9);
      } catch {
        throw Error(`Canvas tainted, cannot extract image`);
      }
    }
  }
  async function K(e) {
    let t = await e.arrayBuffer(),
      n = new Uint8Array(t),
      r = ``,
      i = 8192;
    for (let e = 0; e < n.length; e += i) {
      let t = n.subarray(e, e + i);
      r += String.fromCharCode.apply(null, Array.from(t));
    }
    return `data:${e.type || `image/png`};base64,${btoa(r)}`;
  }
  function q() {
    for (let e of [
      `.doc-block`,
      `[data-block-type]`,
      `[class*="block-"]`,
      `.text-block`,
      `article > *`,
      `.doc-content > *`,
      `[class*="docx-"] > *`
    ]) {
      let t = document.querySelectorAll(e);
      if (t.length > 0)
        return (
          console.log(`[feishu-export] Fallback: ${t.length} elements via "${e}"`),
          Array.from(t).map((e) => e.cloneNode(!0))
        );
    }
    let e = document.querySelector(
      `[class*="page-content"], [class*="doc-content"], main, article`
    );
    return e ? Array.from(e.children).map((e) => e.cloneNode(!0)) : [];
  }
  function J(e) {
    let t = e.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i);
    return t ? t[1].toLowerCase() : `png`;
  }
  async function Y(e, t) {
    let n = await (await fetch(e)).blob(),
      r = URL.createObjectURL(n),
      i = document.createElement(`a`);
    ((i.href = r),
      (i.download = t),
      (i.style.display = `none`),
      document.body.appendChild(i),
      i.click(),
      i.remove(),
      setTimeout(() => URL.revokeObjectURL(r), 3e4));
  }
  function X() {
    (chrome.runtime.onMessage.addListener((e) => {
      (e.action === `start-export` && U(e.formats),
        e.action === `export-progress` && V?.updateProgress(e.progress, e.message),
        e.action === `download-ready` && Y(e.dataUrl, e.filename),
        e.action === `export-done` &&
          (H(`packing`, 100, `导出成功!`),
          V?.updateProgress(100, `导出成功!`),
          (B = !1),
          console.log(`[feishu-export] Export completed successfully!`)),
        e.action === `export-error` &&
          (H(`packing`, 0, `导出失败: ${e.error}`),
          V?.showError(`导出失败: ${e.error}`),
          (B = !1),
          console.error(`[feishu-export] Export error from background:`, e.error)));
    }),
      (V = new e((e) => U(e))),
      console.log(`[feishu-export] Content Script loaded successfully`));
  }
  X();
})();
