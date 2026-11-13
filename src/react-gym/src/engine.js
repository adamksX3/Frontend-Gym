/* engine.js — проверка React: JSX Артура переводится в обычный JS (Sucrase), компонент монтируется настоящим React
   внутри iframe, проверки кликают, печатают и смотрят, что получилось в DOM. Всё работает без интернета. */
(function () {
  const BASE = 'html{font:16px/1.5 Arial,Helvetica,sans-serif;color:#1b1b1b}body{margin:0;padding:12px}'
    + 'button{font:inherit;padding:4px 12px;margin:2px 4px 2px 0;border:1px solid #888;border-radius:6px;background:#f3f3f3;cursor:pointer}'
    + 'button:disabled{opacity:.5;cursor:default}input,select,textarea{font:inherit;padding:4px 6px;margin:2px 4px 2px 0}'
    + 'h1,h2,h3{margin:.3em 0}p{margin:.4em 0}ul{margin:.4em 0;padding-left:1.3em}'
    + '.card{border:1px solid #bbb;border-radius:8px;padding:10px;margin:6px 0}.badge{display:inline-block;background:#e0457b;color:#fff;border-radius:99px;padding:0 8px;margin-right:4px;font-size:13px}'
    + '.note{background:#fff3c4;padding:4px 8px}.alert{background:#ffe0e0;border:1px solid #d66;padding:6px 10px;border-radius:6px}'
    + '.active{background:#2f6fed;color:#fff;border-color:#2f6fed}.done{text-decoration:line-through;color:#888}.sale{color:#d22;font-weight:bold}'
    + '#gym-error{white-space:pre-wrap;font:13px/1.45 ui-monospace,Consolas,monospace;color:#b00020;background:#fff0f0;border:1px solid #f0b4b4;border-radius:6px;padding:8px;margin:0 0 8px}';

  const lib = (id) => document.getElementById(id).textContent;

  /* ---------- JSX -> JS ---------- */
  function compile(code) {
    try {
      Sucrase.validate(String(code));
      return { js: Sucrase.transform(String(code), { transforms: ['jsx', 'imports'], production: true }).code };
    } catch (e) {
      let msg = String((e && e.message) || e);
      const m = msg.match(/\((\d+):(\d+)\)\s*$/);
      msg = msg.replace(/\s*\(\d+:\d+\)\s*$/, '');
      const ru = [
        [/^Unexpected token, expected "(.+)"$/, 'неожиданный символ, здесь ожидалось «$1»'],
        [/^Unexpected token$/, 'неожиданный символ (проверь скобки и закрытые теги)'],
        [/^Adjacent JSX elements must be wrapped in an enclosing tag/, 'два тега рядом нужно обернуть в один общий (или во фрагмент <>…</>)'],
        [/^Unexpected token, expected "(.+)"$/, 'неожиданный символ, здесь ожидалось «$1»'],
        [/^Expected corresponding JSX closing tag for <(.*)>$/, 'для тега <$1> нет закрывающего </$1>'],
        [/^Identifier '(.+)' has already been declared$/, 'имя «$1» объявлено дважды'],
        [/^'return' outside of function$/, 'return стоит вне функции: проверь фигурные скобки'],
        [/^Unterminated regular expression$/, 'похоже на незакрытый тег или лишний слеш'],
        [/^Unterminated JSX contents$/, 'JSX не закрыт: у какого-то тега нет закрывающей пары'],
        [/^Expected corresponding JSX closing tag for <(.*)>$/, 'для тега <$1> нет закрывающего </$1>'],
        [/^Adjacent JSX elements must be wrapped in an enclosing tag$/, 'два тега рядом нужно обернуть в один общий (или во фрагмент <>…</>)'],
        [/^Unterminated string constant$/, 'строка не закрыта кавычкой'],
        [/^Unterminated template$/, 'шаблонная строка не закрыта обратной кавычкой'],
      ];
      for (const [re, to] of ru) if (re.test(msg)) { msg = msg.replace(re, to) + ' [' + msg + ']'; break; }
      return { error: 'Синтаксическая ошибка' + (m ? ' в строке ' + m[1] : '') + ': ' + msg };
    }
  }

  /* ---------- код, который работает ВНУТРИ iframe ---------- */
  function childRuntime(cfg, fns) {
    const rootEl = document.getElementById('root');
    const warnings = [], fatal = [], ever = [];
    const tick = (ms) => new Promise((r) => setTimeout(r, ms || 25));
    const clean = (s) => String(s).split(/\n\s+(?:at|in) /)[0].replace(/\s+/g, ' ').trim();
    const fmtArgs = (args) => { const a = [...args]; const s = String(a.shift()).replace(/%[sdo]/g, () => (a.length ? String(a.shift()) : '')); return clean(s); };
    const origError = console.error;
    console.error = function () {
      const s = fmtArgs(arguments);
      if (!/The above error occurred|Consider adding an error boundary/.test(s) && !warnings.includes(s)) warnings.push(s);
      if (!ever.includes(s)) ever.push(s);
      origError.apply(console, arguments);
    };
    const addFatal = (m) => { m = clean(m).replace(/^Uncaught /, ''); if (m && !fatal.includes(m)) fatal.push(m); };
    addEventListener('error', (e) => { addFatal((e.error && e.error.message) || e.message || 'ошибка'); showError(); });
    addEventListener('unhandledrejection', (e) => { addFatal((e.reason && e.reason.message) || String(e.reason)); showError(); });

    /* живые интервалы — чтобы проверять очистку эффекта */
    const live = new Set();
    const si = window.setInterval, ci = window.clearInterval;
    window.setInterval = function () { const id = si.apply(window, arguments); live.add(id); return id; };
    window.clearInterval = function (id) { live.delete(id); ci(id); };

    /* настоящая отправка формы перезагрузила бы страницу: запоминаем, отменил ли её компонент, и отменяем сами */
    let lastSubmit = null;
    addEventListener('submit', (e) => { lastSubmit = e.defaultPrevented; e.preventDefault(); if (cfg.mode === 'preview' && !lastSubmit) note('Форма отправилась по-настоящему: в браузере страница бы перезагрузилась. Нужен event.preventDefault().'); });

    function note(text) {
      let el = document.getElementById('gym-error');
      if (!el) { el = document.createElement('div'); el.id = 'gym-error'; document.body.insertBefore(el, rootEl); }
      el.textContent = text;
    }
    function showError() { if (cfg.mode === 'preview' && fatal.length) note(fatal.join('\n')); }

    try { ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.usingClientEntryPoint = true; } catch (e) { /* ignore */ }

    let Comp = null;
    try {
      if (cfg.error) throw new Error(cfg.error);
      if (cfg.setup) (0, eval)(cfg.setup);
      const module = { exports: {} };
      const req = (n) => {
        if (n === 'react') return React;
        if (n === 'react-dom' || n === 'react-dom/client') return ReactDOM;
        throw new Error('Модуль «' + n + '» в тренажёре недоступен: здесь есть только react.');
      };
      new Function('require', 'module', 'exports', 'React', cfg.js)(req, module, module.exports, React);
      Comp = module.exports.default;
      if (typeof Comp !== 'function') throw new Error('Не нашёл компонент: в файле должно быть export default function ИмяКомпонента() { … }');
    } catch (e) { addFatal((e && e.message) || e); }

    let root = null;
    async function mount(props) {
      if (root) { try { root.unmount(); } catch (e) { /* ignore */ } }
      root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(Comp, props || {}));
      await tick();
    }
    async function unmount() { if (root) { try { root.unmount(); } catch (e) { /* ignore */ } root = null; } await tick(); }

    function fit() { parent.postMessage({ gymFit: Math.ceil(document.body.getBoundingClientRect().bottom) }, '*'); }

    async function preview() {
      if (Comp) await mount(cfg.props);
      showError();
      fit();
      addEventListener('resize', fit);
      new MutationObserver(fit).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    }

    const fmt = (v) => (typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v));
    const setNative = (el, v) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    };
    const c = {
      root: rootEl, code: cfg.code, warnings, tick,
      q(sel) { return rootEl.querySelector(sel); },
      qa(sel) { return [...rootEl.querySelectorAll(sel)]; },
      $(sel) { const el = rootEl.querySelector(sel); if (!el) throw new Error('Не нашёл на странице элемент ' + sel); return el; },
      txt(el) { return ((el || rootEl).textContent || '').replace(/\s+/g, ' ').trim(); },
      texts(sel) { return c.qa(sel).map((el) => c.txt(el)); },
      btn(text) { const b = c.qa('button').find((x) => c.txt(x) === text); if (!b) throw new Error('Не нашёл кнопку с текстом «' + text + '»'); return b; },
      pick(x) { return typeof x === 'string' ? c.$(x) : x; },
      want(actual, expected, label) { return String(actual) === String(expected) ? true : label + ': сейчас «' + fmt(actual) + '», нужно «' + fmt(expected) + '»'; },
      has(text, label) { return c.txt().includes(text) ? true : (label || 'на странице') + ' нет текста «' + text + '» (сейчас: «' + c.txt().slice(0, 120) + '»)'; },
      async click(x) { c.pick(x).click(); await tick(); },
      async type(x, v) { const el = c.pick(x); setNative(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); await tick(); },
      async choose(x, v) { const el = c.pick(x); setNative(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); await tick(); },
      async submit(x) { lastSubmit = null; c.pick(x).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick(); return lastSubmit; },
      prevented() { return lastSubmit; },
      async render(props) { await mount(props); },
      unmount,
      wait: tick,
      intervals() { return live.size; },
      warned(part) { return ever.some((w) => w.includes(part)); }, // React предупреждает один раз за загрузку, поэтому смотрим все предупреждения
      title() { return document.title; },
    };

    async function check() {
      let mountWarnings = [];
      if (Comp) {
        await mount(cfg.props);
        mountWarnings = warnings.slice();
      }
      const mountFatal = fatal.slice();
      const results = [];
      for (const fn of fns) {
        let ok = false, detail = '';
        if (!mountFatal.length) {
          const before = fatal.length;
          warnings.length = 0; lastSubmit = null;
          try {
            await mount(cfg.props);
            const r = await fn(c);
            if (r === true) ok = true; else if (typeof r === 'string') detail = r;
          } catch (e) { detail = String((e && e.message) || e); }
          if (fatal.length > before) { ok = false; detail = 'Компонент упал с ошибкой: ' + fatal[fatal.length - 1]; }
        }
        results.push({ ok, detail });
      }
      await unmount();
      parent.postMessage({ gymId: cfg.id, results, fatal: mountFatal, warnings: mountWarnings }, '*');
    }

    const start = cfg.mode === 'preview' ? preview : check;
    if (document.readyState === 'complete') start(); else addEventListener('load', start);
  }

  function frameDoc(cfg, fns) {
    const open = '<scr' + 'ipt>', close = '<\/scr' + 'ipt>';
    const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
    const script = '(' + childRuntime.toString() + ')(' + json + ',[' + fns.map((f) => f.toString()).join(',') + ']);';
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Тренажёр</title>'
      + '<style>' + BASE + '</style></head><body><div id="root"></div>'
      + open + lib('lib-react') + close + open + lib('lib-react-dom') + close + open + script + close + '</body></html>';
  }

  function previewDoc(task, code) {
    const r = compile(code);
    return frameDoc({ mode: 'preview', js: r.js || '', error: r.error || '', props: task.props || {}, setup: task.setup || '' }, []);
  }

  let seq = 0;
  function runInFrame(task, code, js) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.style.cssText = 'position:fixed;left:0;top:0;width:700px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1;';
      const done = (fn, v) => { clearTimeout(timer); window.removeEventListener('message', onMsg); f.remove(); fn(v); };
      const onMsg = (e) => { if (e.data && e.data.gymId === id) done(resolve, e.data); };
      const timer = setTimeout(() => done(reject, new Error('Компонент не ответил за 12 секунд. Возможно, в коде бесконечный цикл.')), 12000);
      window.addEventListener('message', onMsg);
      f.srcdoc = frameDoc({ mode: 'check', id, code, js, props: task.props || {}, setup: task.setup || '' }, task.checks.map((x) => x.fn));
      document.body.appendChild(f);
    });
  }

  const WARN_RU = [
    [/Each child in a list should have a unique "key" prop/, 'у элементов списка нет key: каждому элементу из map нужен уникальный key'],
    [/Invalid DOM property `class`/, 'в JSX пишут className, а не class'],
    [/Invalid DOM property `for`/, 'в JSX пишут htmlFor, а не for'],
    [/You provided a `value` prop to a form field without an `onChange` handler/, 'у поля есть value, но нет onChange: в такое поле нельзя печатать'],
    [/You provided a `checked` prop to a form field without an `onChange` handler/, 'у флажка есть checked, но нет onChange: его нельзя переключить'],
    [/A component is changing an uncontrolled input to be controlled/, 'поле сначала было без значения (undefined), а потом получило его: начальное состояние должно быть строкой, например пустой'],
    [/Encountered two children with the same key/, 'у двух элементов списка одинаковый key'],
    [/Invalid event handler property `onclick`/, 'обработчик пишется в верблюжьем стиле: onClick'],
    [/Expected `onClick` listener to be a function/, 'в onClick нужно передать функцию, а не результат её вызова'],
    [/Functions are not valid as a React child/, 'в JSX попала сама функция, а не результат: возможно, забыл её вызвать или вернуть JSX'],
    [/Cannot update a component .* while rendering/, 'состояние меняется прямо во время отрисовки: set-функцию нужно вызывать в обработчике или эффекте'],
  ];
  const FATAL_RU = [
    [/Too many re-renders/, 'бесконечная перерисовка: set-функция вызывается прямо при отрисовке (например onClick={setX(1)} вместо onClick={() => setX(1)})'],
    [/(\w+) is not defined/, 'имя «$1» не объявлено: проверь опечатку или импорт из react'],
    [/Objects are not valid as a React child/, 'в JSX нельзя вывести объект целиком: выведи его поля'],
    [/Rendered more hooks than|Rendered fewer hooks than|Invalid hook call/, 'хуки вызываются только на верхнем уровне компонента, не в условиях и не в циклах'],
    [/Cannot read properties of (undefined|null) \(reading '(\w+)'\)/, 'обращение к «$2» у значения $1'],
  ];
  const ru = (s, table) => { for (const [re, to] of table) { const m = s.match(re); if (m) return to.replace(/\$(\d)/g, (_, i) => m[i]) + ' [' + s.slice(0, 160) + ']'; } return s.slice(0, 300); };

  async function runChecks(task, code) {
    const comp = compile(code);
    if (comp.error) return { hard: [comp.error], soft: [], results: task.checks.map((chk) => ({ name: chk.name, ok: false, detail: '' })) };
    const r = await runInFrame(task, code, comp.js);
    const hard = r.fatal.map((m) => 'Ошибка при запуске: ' + ru(m, FATAL_RU));
    const soft = r.warnings.map((m) => 'React предупреждает: ' + ru(m.replace(/^Warning: /, ''), WARN_RU));
    const results = task.checks.map((chk, i) => ({ name: chk.name, ok: r.results[i].ok, detail: r.results[i].detail }));
    return { hard, soft, results };
  }

  window.GymEngine = { compile, previewDoc, runChecks };
})();
