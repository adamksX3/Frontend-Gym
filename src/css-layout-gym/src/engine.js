/* engine.js — проверка CSS в настоящем браузере: iframe + getComputedStyle + getBoundingClientRect */
(function () {
  const BASE = 'html{font:16px/1.4 Arial,Helvetica,sans-serif;color:#1b1b1b}body{margin:0;padding:12px}';

  const FIT = 'function f(){parent.postMessage({gymFit:Math.ceil(document.body.getBoundingClientRect().bottom)},"*")}addEventListener("load",f);addEventListener("resize",f);';

  function wrapDoc(html, css, attrs, script) {
    return '<!DOCTYPE html><html lang="ru"' + (attrs || '') + '><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style id="base">' + BASE + '</style>'
      + '<style id="user">' + String(css).replace(/<\/style/gi, '<\\/style') + '</style>'
      + '</head><body>' + html + '<script>' + (script || FIT) + '<\/script></body></html>';
  }

  /* ---------- проверка написания: неизвестные свойства и значения ---------- */
  const KNOWN = ['color', 'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
    'font', 'font-size', 'font-family', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-decoration',
    'text-transform', 'text-overflow', 'white-space', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom',
    'padding-left', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-width', 'border-style', 'border-color',
    'border-radius', 'box-sizing', 'box-shadow', 'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'overflow', 'opacity',
    'cursor', 'transition', 'transform', 'animation', 'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'justify-content', 'align-items', 'align-content', 'align-self', 'justify-items', 'justify-self', 'place-items', 'gap', 'row-gap',
    'column-gap', 'order', 'grid', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-area', 'grid-column',
    'grid-row', 'grid-auto-rows', 'grid-auto-columns', 'grid-auto-flow', 'list-style', 'outline', 'content', 'vertical-align',
    'object-fit', 'aspect-ratio', 'visibility'];

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }
  function guess(prop) {
    let best = null, bd = 3;
    for (const k of KNOWN) { const d = lev(prop, k); if (d < bd) { bd = d; best = k; } }
    return best;
  }

  function lintCss(css) {
    const out = [];
    const clean = String(css).replace(/\/\*[\s\S]*?\*\//g, '');
    let depth = 0, broken = false;
    for (const ch of clean) {
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth < 0) { broken = true; break; } }
    }
    if (depth !== 0 || broken) out.push('Фигурные скобки { } не парные: одна не закрыта или лишняя. Из-за этого браузер может пропустить всё после ошибки.');
    const re = /\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(clean))) {
      const decls = m[1].match(/(?:[^;"']|"[^"]*"|'[^']*')+/g) || [];
      for (const raw of decls) {
        const decl = raw.trim();
        if (!decl) continue;
        const i = decl.indexOf(':');
        if (i < 0) { out.push('«' + decl + '»: нет двоеточия между свойством и значением.'); continue; }
        const prop = decl.slice(0, i).trim();
        const val = decl.slice(i + 1).trim().replace(/\s*!important$/i, '');
        if (!prop || prop.startsWith('--')) continue;
        if (!/^-?[a-zA-Z][a-zA-Z-]*$/.test(prop)) { out.push('«' + prop + '» не похоже на имя свойства.'); continue; }
        if (!CSS.supports(prop, 'inherit')) {
          const g = guess(prop);
          out.push('Свойство «' + prop + '» браузер не знает и просто пропустит его.' + (g ? ' Может быть, ' + g + '?' : ' Проверь написание.'));
          continue;
        }
        if (!val || !CSS.supports(prop, val)) {
          out.push('Значение «' + val + '» для «' + prop + '» браузер не принимает, строка будет пропущена. Проверь написание значения, единицы измерения и точку с запятой в конце предыдущей строки.');
        }
      }
    }
    return out;
  }

  /* ---------- код, который работает ВНУТРИ iframe ----------
     Родитель не читает чужой документ (в «песочнице» это запрещено), а просит iframe проверить себя
     и прислать ответ через postMessage. Функция ниже целиком вставляется в страницу как текст. */
  function childRuntime(cfg, fns) {
    const doc = document, win = window;
    const fmt = (v) => (typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v));
    const undo = [];

    function flatRules(rules, acc) {
      acc = acc || [];
      for (const r of rules) {
        if (r.selectorText !== undefined) acc.push(r);
        else if (r.cssRules && r.type !== 7) flatRules(r.cssRules, acc);
      }
      return acc;
    }
    function dupWithClass(rules, pseudo) {
      let text = '';
      for (const r of rules) {
        if (r.selectorText !== undefined) {
          if (r.selectorText.includes(pseudo)) text += r.selectorText.split(pseudo).join('.__st') + '{' + r.style.cssText + '}\n';
        } else if (r.type === 4 && r.cssRules) {
          const inner = dupWithClass(r.cssRules, pseudo);
          if (inner) text += '@media ' + r.media.mediaText + '{' + inner + '}\n';
        }
      }
      return text;
    }

    const c = {
      win, doc, css: cfg.css,
      $(sel) { const el = doc.querySelector(sel); if (!el) throw new Error('В HTML нет элемента ' + sel); return el; },
      $$(sel) { const l = [...doc.querySelectorAll(sel)]; if (!l.length) throw new Error('В HTML нет элементов ' + sel); return l; },
      cs(el, prop, pseudo) { return win.getComputedStyle(el, pseudo || null).getPropertyValue(prop).trim(); },
      px(el, prop, pseudo) { return parseFloat(c.cs(el, prop, pseudo)); },
      box(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      },
      near(a, b, tol) { return Math.abs(a - b) <= (tol === undefined ? 1 : tol); },
      want(actual, expected, label, tol) {
        const ok = typeof expected === 'number' ? Math.abs(actual - expected) <= (tol === undefined ? 1 : tol) : String(actual) === String(expected);
        return ok ? true : label + ': сейчас ' + fmt(actual) + ', нужно ' + fmt(expected);
      },
      rgb(hex) {
        const h = hex.replace('#', '');
        const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
        return 'rgb(' + parseInt(n.slice(0, 2), 16) + ', ' + parseInt(n.slice(2, 4), 16) + ', ' + parseInt(n.slice(4, 6), 16) + ')';
      },
      rules() { const s = doc.getElementById('user').sheet; return s ? flatRules(s.cssRules) : []; },
      /* «наводит курсор»: копирует правила :hover под служебный класс и вешает его на элемент */
      hover(el, pseudo) {
        pseudo = pseudo || ':hover';
        const s = doc.getElementById('user').sheet;
        const st = doc.createElement('style');
        st.textContent = (s ? dupWithClass(s.cssRules, pseudo) : '') + '*{transition:none!important}';
        doc.head.appendChild(st);
        el.classList.add('__st');
        undo.push(() => { el.classList.remove('__st'); st.remove(); });
        return el;
      },
      attr(el, name, value) {
        const had = el.hasAttribute(name), prev = el.getAttribute(name);
        el.setAttribute(name, value);
        undo.push(() => { if (had) el.setAttribute(name, prev); else el.removeAttribute(name); });
      },
      cleanup() { undo.splice(0).reverse().forEach((f) => f()); },
    };

    function softWarnings() {
      const out = [];
      for (const r of c.rules()) {
        const sel = r.selectorText;
        if (/:root|html|\[data-|@/.test(sel)) continue;
        const probe = sel.replace(/::?(before|after|marker|first-line|first-letter|hover|focus|focus-visible|active|visited)/g, '');
        let found = true;
        try { found = !!doc.querySelector(probe || '*'); } catch (e) { found = true; }
        if (!found) out.push('Селектор «' + sel + '» ничего не нашёл в HTML. Проверь имя класса и точку перед ним: возможно, опечатка.');
      }
      return out;
    }

    async function go() {
      try { await Promise.all([...doc.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))); } catch (e) { /* ignore */ }
      await new Promise((r) => setTimeout(r, 30));
      const results = fns.map((fn) => {
        let ok = false, detail = '';
        try {
          const r = fn(c);
          if (r === true) ok = true;
          else if (typeof r === 'string') detail = r;
        } catch (e) { detail = String((e && e.message) || e); }
        finally { c.cleanup(); }
        return { ok, detail };
      });
      parent.postMessage({ gymId: cfg.id, results, soft: cfg.wantSoft ? softWarnings() : [] }, '*');
    }
    if (document.readyState === 'complete') go(); else win.addEventListener('load', go);
  }

  let seq = 0;

  function runInFrame(task, css, w, list, wantSoft) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const helpers = typeof HELPERS !== 'undefined' ? HELPERS : {};
      const decl = Object.keys(helpers).map((k) => 'var ' + k + '=' + helpers[k].toString() + ';').join('');
      const cfg = JSON.stringify({ id, css, wantSoft }).replace(/</g, '\\u003c');
      const script = '(function(){' + decl + '(' + childRuntime.toString() + ')(' + cfg + ',[' + list.map((x) => x.fn.toString()).join(',') + ']);})();';
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.style.cssText = 'position:fixed;left:0;top:0;width:' + w + 'px;height:700px;border:0;visibility:hidden;pointer-events:none;';
      const done = (fn, v) => { clearTimeout(timer); window.removeEventListener('message', onMsg); f.remove(); fn(v); };
      const onMsg = (e) => { if (e.data && e.data.gymId === id) done(resolve, e.data); };
      const timer = setTimeout(() => done(reject, new Error('Страница для проверки не ответила за 8 секунд')), 8000);
      window.addEventListener('message', onMsg);
      f.srcdoc = wrapDoc(task.html, css, '', script);
      document.body.appendChild(f);
    });
  }

  async function runChecks(task, css) {
    const hard = lintCss(css);
    let soft = [];
    const groups = new Map();
    task.checks.forEach((chk, i) => {
      const w = chk.w || task.checkWidth || 700;
      if (!groups.has(w)) groups.set(w, []);
      groups.get(w).push([i, chk]);
    });
    const results = new Array(task.checks.length);
    let first = true;
    for (const [w, list] of groups) {
      const r = await runInFrame(task, css, w, list.map((x) => x[1]), first);
      if (first) { soft = r.soft; first = false; }
      list.forEach(([i, chk], k) => { results[i] = { name: chk.name, ok: r.results[k].ok, detail: r.results[k].detail, w: chk.w }; });
    }
    return { hard, soft, results };
  }

  window.GymEngine = { wrapDoc, lintCss, runChecks };
})();
