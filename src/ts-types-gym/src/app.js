(() => {
  const TOPICS = [
    { id: 'basic', name: 'Основы', note: 'Типы параметров и результата, массивы, «или», кортежи.' },
    { id: 'obj', name: 'Объекты', note: 'interface и type, необязательные поля, Record, Partial, Pick, keyof.' },
    { id: 'narrow', name: 'Сужение', note: 'Как из «или-или» получить точный тип: typeof, null, in, поле-метка, unknown.' },
    { id: 'gen', name: 'Дженерики', note: 'Тип как переменная: <T>, ограничения extends, keyof и T[K].' },
    { id: 'real', name: 'Практика', note: 'Как в проектах: классы, Promise, данные с сервера, ошибки, типы DOM.' },
  ];
  const LEVELS = ['', 'Разминка', 'База', 'Уверенно', 'Сложно', 'Босс'];
  const KEY = 'tsgym-v1';

  const store = (() => {
    let data = { solved: {}, drafts: {}, attempts: {} };
    try { const raw = localStorage.getItem(KEY); if (raw) data = { ...data, ...JSON.parse(raw) }; } catch (e) { /* storage unavailable */ }
    return {
      data,
      save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } },
    };
  })();

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lvlDots = (n) => '<span class="lvl" aria-label="уровень ' + n + ' из 5">' + [1, 2, 3, 4, 5].map((i) => '<i class="' + (i <= n ? 'on' : '') + '"></i>').join('') + '</span>';

  let topic = 'basic';
  let current = TASKS[0];

  function topicTasks(id) { return TASKS.filter((t) => t.topic === id); }

  function renderTabs() {
    $('tabs').innerHTML = TOPICS.map((tp) => {
      const list = topicTasks(tp.id);
      const done = list.filter((t) => store.data.solved[t.id]).length;
      return '<button role="tab" aria-selected="' + (tp.id === topic) + '" data-topic="' + tp.id + '">' + tp.name + '<span>' + done + '/' + list.length + '</span></button>';
    }).join('');
    $('topicnote').textContent = TOPICS.find((x) => x.id === topic).note;
  }

  function renderList() {
    let lastLevel = 0;
    $('tasklist').innerHTML = topicTasks(topic).map((t, i) => {
      let sep = '';
      if (t.level !== lastLevel) { sep = '<li class="lvlsep">' + t.level + ' · ' + LEVELS[t.level] + '</li>'; lastLevel = t.level; }
      const done = store.data.solved[t.id];
      return sep + '<li class="' + (done ? 'done' : '') + '"><button data-id="' + t.id + '" aria-current="' + (t.id === current.id) + '">'
        + '<span class="num">' + (done ? '✓' : String(i + 1).padStart(2, '0')) + '</span>'
        + '<span class="name">' + esc(t.title) + '</span>' + lvlDots(t.level) + '</button></li>';
    }).join('');
  }

  function renderOverall() {
    const done = TASKS.filter((t) => store.data.solved[t.id]).length;
    $('overall-text').textContent = done + ' / ' + TASKS.length;
    $('overall-bar').style.width = (done / TASKS.length) * 100 + '%';
  }

  function renderTask() {
    const t = current;
    const list = topicTasks(t.topic);
    const idx = list.indexOf(t);
    $('meta').innerHTML = '<span class="badge">' + TOPICS.find((x) => x.id === t.topic).name + ' · ' + (idx + 1) + '/' + list.length + '</span>'
      + '<span>' + lvlDots(t.level) + ' ' + LEVELS[t.level] + '</span>'
      + (store.data.solved[t.id] ? '<span class="solved">✓ решено</span>' : '');
    $('title').textContent = t.title;
    $('text').textContent = t.text;
    $('example').textContent = t.example;
    $('chips').innerHTML = '<span class="lab">Пригодится</span>' + t.methods.map((m) => '<span class="chip">' + esc(m) + '</span>').join('');
    $('fname').textContent = (t.fn || t.file) + '.ts';
    $('code').value = store.data.drafts[t.id] ?? t.starter;
    $('extra').innerHTML = '';
    $('results').innerHTML = '';
    if (location.hash.slice(1) !== t.id) { try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* sandboxed frame */ } }
  }

  function renderAll() { renderTabs(); renderList(); renderOverall(); renderTask(); }

  function select(id) {
    const t = TASKS.find((x) => x.id === id);
    if (!t) return;
    current = t; topic = t.topic;
    renderAll();
  }

  /* ---------- compiler: a Web Worker, or the main thread if workers are unavailable ---------- */
  const WORKER_BOOT = `
let engine;
self.onmessage = async (e) => {
  const { id, task, code } = e.data;
  try {
    if (!engine) engine = createEngine(ts, LIBS);
    if (e.data.warm) {
      engine.analyze({}, '');
      self.postMessage({ id, phase: 'warm' });
      return;
    }
    const rep = engine.analyze(task, code);
    const js = rep.js;
    delete rep.js;
    self.postMessage({ id, phase: 'typed', rep });
    let run = null;
    if (!rep.syntax.length && task.tests && task.tests.length) run = await runTask(js, task.fn, task.tests);
    self.postMessage({ id, phase: 'done', run });
  } catch (err) {
    self.postMessage({ id, phase: 'done', fatal: String((err && err.message) || err) });
  }
};`;
  const SLOW = 'Код работает дольше 3 секунд. Похоже на бесконечный цикл или обещание, которое никогда не выполняется.';

  let worker = null;
  let workerBroken = false;
  let warm = false;       // the compiler has answered at least once
  let active = null;      // the check in flight: { id, handle, fail, cancel }
  let mainEngine = null;
  let seq = 0;

  function dropWorker() {
    if (worker) worker.terminate();
    worker = null;
    warm = false;
  }

  function getWorker() {
    if (worker) return worker;
    const parts = [$('ts-src').textContent, '\n', $('engine-src').textContent, '\nconst LIBS = ', $('libs-src').textContent, ';\n', WORKER_BOOT];
    const w = new Worker(URL.createObjectURL(new Blob(parts, { type: 'text/javascript' })));
    w.onmessage = (e) => {
      const m = e.data;
      if (m.phase === 'warm' || m.phase === 'typed') warm = true;
      if (active && m.id === active.id) active.handle(m);
    };
    w.onerror = (e) => {
      if (e.preventDefault) e.preventDefault();
      const started = warm;
      if (worker === w) dropWorker(); else w.terminate();
      // a worker that never answered was blocked by the host page: compile on the main thread from now on
      if (!started) workerBroken = true;
      if (active) active.fail(started);
    };
    worker = w;
    return w;
  }

  async function runOnMain(task, code) {
    if (!mainEngine) {
      const tsLocal = new Function($('ts-src').textContent + '\n;return ts;')();
      mainEngine = createEngine(tsLocal, JSON.parse($('libs-src').textContent));
    }
    const rep = mainEngine.analyze(task, code);
    let run = null;
    if (!rep.syntax.length && task.tests && task.tests.length) {
      run = await Promise.race([runTask(rep.js, task.fn, task.tests), new Promise((r) => setTimeout(() => r({ fatal: SLOW }), 3000))]);
    }
    warm = true;
    return { rep, run };
  }

  function analyzeAndRun(task, code) {
    if (active) active.cancel();
    if (workerBroken) return runOnMain(task, code).catch((err) => ({ fatal: String((err && err.message) || err) }));
    return new Promise((resolve) => {
      let w;
      try { w = getWorker(); } catch (e) {
        workerBroken = true;
        resolve(analyzeAndRun(task, code));
        return;
      }
      const id = ++seq;
      let rep = null;
      let timer = 0;
      const finish = (value) => {
        clearTimeout(timer);
        if (active && active.id === id) active = null;
        resolve(value);
      };
      timer = setTimeout(() => {
        dropWorker();
        finish({ fatal: 'Компилятор не ответил за 40 секунд. Обнови страницу и попробуй ещё раз.' });
      }, 40000);
      active = {
        id,
        handle(m) {
          if (m.phase === 'typed') {
            rep = m.rep;
            clearTimeout(timer);
            timer = setTimeout(() => {
              dropWorker();
              finish({ rep, run: { fatal: SLOW } });
            }, 3000);
            return;
          }
          finish(m.fatal ? { fatal: m.fatal } : { rep, run: m.run });
        },
        fail(started) {
          if (started) finish({ fatal: 'Проверка прервалась из-за ошибки в запущенном коде. Попробуй ещё раз.' });
          else { active = null; clearTimeout(timer); resolve(analyzeAndRun(task, code)); }
        },
        cancel() { finish({ stale: true }); },
      };
      w.postMessage({ id, task: { fn: task.fn, types: task.types, typeSetup: task.typeSetup, tests: task.tests, allowAs: task.allowAs, noReturnRule: task.noReturnRule, methodsTyped: task.methodsTyped, uses: task.uses }, code });
    });
  }

  // start the compiler in the background so the first check is quick
  function warmUp() {
    if (warm || workerBroken || active) return;
    try { getWorker().postMessage({ id: 0, warm: true }); } catch (e) { workerBroken = true; }
  }

  /* ---------- rendering a check ---------- */
  const row = (ok, body) => '<div class="test ' + (ok ? 'ok' : 'bad') + '"><span class="mark">' + (ok ? '✓' : '✗') + '</span><div class="body">' + body + '</div></div>';
  const ru = (text) => (text ? '<div class="ru">' + esc(text) + '</div>' : '');
  const diagRow = (d) => row(false, 'строка ' + d.line + ': <em style="font-style:normal">' + esc(d.msg) + '</em> <span class="tag">TS' + d.code + '</span>' + ru(d.hint));

  function typeRow(t) {
    if (t.kind === 'ok') {
      return row(t.ok, '<span class="tag">должно компилироваться</span>\n' + esc(t.code)
        + (t.ok ? '' : '<div class="detail">ошибка: <em>' + esc(t.detail) + '</em></div>' + ru(t.hint)));
    }
    if (t.kind === 'err') {
      return row(t.ok, '<span class="tag">должно быть ошибкой типов</span>\n' + esc(t.code)
        + '<div class="detail">' + (t.ok ? 'TypeScript не пропускает: ' + esc(t.detail) : '<em>' + esc(t.detail) + '</em>') + '</div>');
    }
    if (t.kind === 'alias') {
      return row(t.ok, '<span class="tag">твой тип</span> ' + esc(t.code)
        + '<div class="detail">' + (t.ok ? '= ' + esc(t.type) : '<em>' + esc(t.detail) + '</em><br>ждали: ' + esc(t.type)) + '</div>');
    }
    return row(t.ok, '<span class="tag">тип результата</span> ' + esc(t.code)
      + '<div class="detail">' + (t.ok ? '→ ' + esc(t.type) : '<em>' + esc(t.detail) + '</em><br>ждали тип: ' + esc(t.type)) + '</div>' + (t.ok ? '' : ru(t.hint)));
  }

  function runRow(r) {
    let detail;
    if (r.ok) detail = '<div class="detail">→ ' + esc(r.actual) + '</div>';
    else if (r.error) detail = '<div class="detail">ошибка: <em>' + esc(r.error) + '</em>' + (r.expected ? '<br>ждали: ' + esc(r.expected) : '') + '</div>';
    else detail = '<div class="detail">получили: <em>' + esc(r.actual) + '</em><br>ждали: ' + esc(r.expected) + '</div>';
    return row(r.ok, esc(r.call) + detail);
  }

  async function check() {
    const t = current;
    const code = $('code').value;
    store.data.drafts[t.id] = code;
    store.data.attempts[t.id] = (store.data.attempts[t.id] || 0) + 1;
    $('results').innerHTML = '<div class="summary">' + (warm ? 'Проверяю…' : 'Запускаю компилятор TypeScript. В первый раз это занимает пару секунд…') + '</div>';
    const res = await analyzeAndRun(t, code);
    if (t !== current || res.stale) return;
    if (res.fatal) {
      $('results').innerHTML = '<div class="summary bad">' + esc(res.fatal) + '</div>';
      store.save();
      return;
    }
    const { rep, run } = res;
    let html = '';
    let total = 0;
    let passed = 0;

    if (rep.syntax.length) {
      html += '<div class="summary bad">Синтаксическая ошибка: TypeScript не смог прочитать код. Обычно это скобка, запятая или двоеточие. Исправляй первую ошибку сверху.</div>';
      html += rep.syntax.map(diagRow).join('');
      $('results').innerHTML = html;
      store.save();
      return;
    }

    let body = '<div class="group">Компилятор</div>';
    total += 1;
    if (rep.errors.length || rep.rules.length) {
      body += rep.errors.map(diagRow).join('') + rep.rules.map((r) => row(false, '<div class="ru">' + esc(r) + '</div>')).join('');
    } else {
      passed += 1;
      body += row(true, 'в твоём коде ошибок нет');
    }
    if (rep.types.length) {
      body += '<div class="group">Проверка типов</div>' + rep.types.map(typeRow).join('');
      total += rep.types.length;
      passed += rep.types.filter((x) => x.ok).length;
    }
    if (run) {
      body += '<div class="group">Запуск</div>';
      if (run.fatal) {
        total += 1;
        body += row(false, '<em style="font-style:normal">' + esc(run.fatal) + '</em>');
      } else {
        body += run.results.map(runRow).join('');
        total += run.results.length;
        passed += run.results.filter((x) => x.ok).length;
      }
    }
    const all = passed === total;
    html = '<div class="summary ' + (all ? 'ok' : 'bad') + '">' + (all ? 'Всё сошлось: проверок пройдено ' : 'Пройдено проверок: ') + passed + ' из ' + total + '</div>' + body;
    $('results').innerHTML = html;
    if (all) {
      const first = !store.data.solved[t.id];
      store.data.solved[t.id] = true;
      store.save();
      renderTabs(); renderList(); renderOverall();
      $('meta').querySelector('.solved') || $('meta').insertAdjacentHTML('beforeend', '<span class="solved">✓ решено</span>');
      if (first) $('extra').innerHTML = '<div class="panel explain">Готово. Теперь объясни своими словами: какой тип ты написал и от какой ошибки он защищает.</div>';
    } else {
      store.save();
    }
  }

  /* ---------- editor ---------- */
  const ta = $('code');
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); check(); return; }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      const before = ta.value.slice(0, ta.selectionStart);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      let indent = line.match(/^\s*/)[0];
      if (/[{[(]\s*$/.test(line)) indent += '  ';
      e.preventDefault();
      ta.setRangeText('\n' + indent, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  });
  let saveTimer;
  ta.addEventListener('input', () => {
    store.data.drafts[current.id] = ta.value;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.save(), 400);
  });

  /* ---------- buttons ---------- */
  $('run').addEventListener('click', check);
  $('hint-btn').addEventListener('click', () => {
    $('extra').innerHTML = '<div class="panel hint"><b>Подсказка.</b> ' + esc(current.hint) + '</div>';
  });
  $('solution-btn').addEventListener('click', () => {
    const tries = store.data.attempts[current.id] || 0;
    if (tries === 0 && !store.data.solved[current.id]) {
      $('extra').innerHTML = '<div class="panel confirm"><span>Ты ещё ни разу не проверял код. Сначала попробуй сам или открой подсказку.</span>'
        + '<button class="btn" id="force-sol">Всё равно показать</button></div>';
      $('force-sol').addEventListener('click', showSolution);
      return;
    }
    showSolution();
  });
  function showSolution() {
    $('extra').innerHTML = '<div class="panel solution"><b>Одно из решений</b><pre>' + esc(current.solution) + '</pre>'
      + '<span>Не копируй: закрой решение, напиши по памяти и объясни каждый тип.</span></div>';
  }
  $('reset-btn').addEventListener('click', () => {
    $('extra').innerHTML = '<div class="panel confirm"><span>Стереть твой код в этой задаче?</span><button class="btn" id="do-reset">Стереть</button><button class="btn" id="no-reset">Оставить</button></div>';
    $('do-reset').addEventListener('click', () => { delete store.data.drafts[current.id]; store.save(); ta.value = current.starter; $('extra').innerHTML = ''; $('results').innerHTML = ''; });
    $('no-reset').addEventListener('click', () => { $('extra').innerHTML = ''; });
  });
  function step(d) {
    const i = TASKS.indexOf(current) + d;
    if (i >= 0 && i < TASKS.length) { select(TASKS[i].id); window.scrollTo({ top: 0 }); }
  }
  $('prev').addEventListener('click', () => step(-1));
  $('next').addEventListener('click', () => step(1));
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-topic]'); if (!b) return;
    const list = topicTasks(b.dataset.topic);
    const next = list.find((t) => !store.data.solved[t.id]) || list[0];
    select(next.id);
  });
  $('tasklist').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (b) select(b.dataset.id);
  });
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));

  /* ---------- start ---------- */
  const fromHash = TASKS.find((t) => t.id === location.hash.slice(1));
  current = fromHash || TASKS.find((t) => !store.data.solved[t.id]) || TASKS[0];
  topic = current.topic;
  renderAll();
  setTimeout(warmUp, 300);
})();
