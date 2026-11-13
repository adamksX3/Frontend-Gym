/* engine.js — проверка HTML: разметка Артура превращается в настоящий DOM в iframe, проверки — запросы к дереву */
(function () {
  const BASE = 'html{font:16px/1.5 Arial,Helvetica,sans-serif;color:#1b1b1b}body{margin:0;padding:12px}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:4px 8px}fieldset{margin:8px 0}label{display:inline-block}img{max-width:100%}';
  const FIT = 'function f(){parent.postMessage({gymFit:Math.ceil(document.body.getBoundingClientRect().bottom)},"*")}addEventListener("load",f);addEventListener("resize",f);';

  /* Страница целиком (task.doc) — как написал Артур; иначе его разметка попадает в <body> */
  function wrapDoc(task, code, script) {
    const s = '<scr' + 'ipt>' + (script || FIT) + '<\/scr' + 'ipt>';
    if (task.doc) {
      const i = code.lastIndexOf('</body>');
      if (i >= 0) return code.slice(0, i) + s + code.slice(i);
      const j = code.lastIndexOf('</html>');
      if (j >= 0) return code.slice(0, j) + s + code.slice(j);
      return code + s;
    }
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<style>' + BASE + '</style></head><body>' + code + s + '</body></html>';
  }

  /* ---------- парность тегов: считаем открытые и закрытые ---------- */
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const OPTIONAL = new Set(['html', 'head', 'body', 'li', 'p', 'td', 'th', 'tr', 'thead', 'tbody', 'tfoot', 'option', 'dt', 'dd', 'colgroup', 'caption', 'optgroup']);
  function lintHtml(code) {
    const out = [];
    const clean = String(code).replace(/<!\-\-[\s\S]*?\-\->/g, '');
    const open = {}, close = {};
    const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
    let m;
    while ((m = re.exec(clean))) {
      const name = m[2].toLowerCase();
      if (VOID.has(name) || /\/\s*$/.test(m[3])) continue;
      if (m[1]) close[name] = (close[name] || 0) + 1; else open[name] = (open[name] || 0) + 1;
    }
    for (const name of new Set([...Object.keys(open), ...Object.keys(close)])) {
      if (OPTIONAL.has(name) && !(close[name] > (open[name] || 0))) continue;
      const o = open[name] || 0, c = close[name] || 0;
      if (o !== c) out.push('Тег <' + name + '> открыт ' + o + ' раз(а), а закрыт ' + c + ': не хватает ' + (o > c ? '</' + name + '>' : 'открывающего <' + name + '>') + '.');
    }
    return out;
  }

  /* ---------- код, который работает ВНУТРИ iframe ---------- */
  function childRuntime(cfg, fns) {
    const doc = document;
    const me = document.currentScript;
    const fmt = (v) => (typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v));
    const c = {
      doc, code: cfg.code,
      q(sel) { return doc.querySelector(sel); },
      qa(sel) { return [...doc.querySelectorAll(sel)]; },
      $(sel) { const el = doc.querySelector(sel); if (!el) throw new Error('Не нашёл на странице элемент ' + sel); return el; },
      $$(sel) { const l = [...doc.querySelectorAll(sel)]; if (!l.length) throw new Error('Не нашёл на странице элементы ' + sel); return l; },
      txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); },
      tag(el) { return el.tagName.toLowerCase(); },
      want(actual, expected, label) { return String(actual) === String(expected) ? true : label + ': сейчас «' + fmt(actual) + '», нужно «' + fmt(expected) + '»'; },
      before(a, b) { return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); },
      chain() { for (const f of arguments) { const r = f(); if (r !== true) return r; } return true; },
    };
    async function go() {
      try { await Promise.all([...doc.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))); } catch (e) { /* ignore */ }
      await new Promise((r) => setTimeout(r, 30));
      doc.querySelectorAll('script').forEach((x) => x.remove()); // служебный скрипт не должен попасть в проверяемый текст
      const results = fns.map((fn) => {
        let ok = false, detail = '';
        try { const r = fn(c); if (r === true) ok = true; else if (typeof r === 'string') detail = r; } catch (e) { detail = String((e && e.message) || e); }
        return { ok, detail };
      });
      const unknown = [...doc.querySelectorAll('body *, head *')]
        .filter((el) => el instanceof HTMLUnknownElement && !el.tagName.includes('-'))
        .map((el) => el.tagName.toLowerCase());
      parent.postMessage({ gymId: cfg.id, results, unknown: [...new Set(unknown)] }, '*');
    }
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }

  let seq = 0;
  function runInFrame(task, code, list) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const helpers = typeof HELPERS !== 'undefined' ? HELPERS : {};
      const decl = Object.keys(helpers).map((k) => 'var ' + k + '=' + helpers[k].toString() + ';').join('');
      const cfg = JSON.stringify({ id, code }).replace(/</g, '\\u003c');
      const script = '(function(){' + decl + '(' + childRuntime.toString() + ')(' + cfg + ',[' + list.map((x) => x.fn.toString()).join(',') + ']);})();';
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.style.cssText = 'position:fixed;left:0;top:0;width:700px;height:700px;border:0;visibility:hidden;pointer-events:none;';
      const done = (fn, v) => { clearTimeout(timer); window.removeEventListener('message', onMsg); f.remove(); fn(v); };
      const onMsg = (e) => { if (e.data && e.data.gymId === id) done(resolve, e.data); };
      const timer = setTimeout(() => done(reject, new Error('Страница для проверки не ответила за 8 секунд')), 8000);
      window.addEventListener('message', onMsg);
      f.srcdoc = wrapDoc(task, code, script);
      document.body.appendChild(f);
    });
  }

  async function runChecks(task, code) {
    const hard = lintHtml(code);
    const r = await runInFrame(task, code, task.checks);
    for (const t of r.unknown) hard.push('Браузер не знает тег <' + t + '>: проверь написание.');
    const results = task.checks.map((chk, i) => ({ name: chk.name, ok: r.results[i].ok, detail: r.results[i].detail }));
    return { hard, soft: [], results };
  }

  window.GymEngine = { wrapDoc, lintHtml, runChecks };
})();
