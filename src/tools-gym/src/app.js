(() => {
  const TOPICS = [
    { id: 'git', name: 'Git', note: 'Репозиторий, индекс, коммиты, ветки, слияние, отмена изменений, .gitignore. Команды выполняет симулятор git.' },
    { id: 'hub', name: 'GitHub', note: 'origin, push, pull, fetch, clone, сообщения коммитов по правилам RS School, путь до Pull Request.' },
    { id: 'json', name: 'JSON', note: 'Синтаксис и типы, типичные ошибки, package.json, JSON.stringify и JSON.parse.' },
    { id: 'pret', name: 'Prettier', note: 'Запуск, настройки в .prettierrc, .prettierignore. Код форматирует настоящий Prettier 3.' },
    { id: 'husky', name: 'Husky', note: 'Установка, скрипт prepare, хуки pre-commit и commit-msg, lint-staged.' },
  ];
  const LEVELS = ['', 'Разминка', 'База', 'Уверенно', 'Сложно', 'Босс'];
  const KEY = 'toolsgym-v1';

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

  let topic = 'git';
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

  /* ---------- предпросмотр ---------- */
  let pvSeq = 0;
  async function renderPreview() {
    const my = ++pvSeq; const t = current;
    const res = await GymEngine.preview(t, $('code').value);
    if (my !== pvSeq || t !== current) return;
    $('pv-user').textContent = res.out || '';
    $('pv-ref-wrap').hidden = !res.ref;
    if (res.ref) { $('pv-ref').textContent = res.ref; $('pv-ref-title').textContent = res.refTitle || 'Как должно получиться'; }
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
    $('fname').textContent = t.file;
    const g = GymEngine.given(t);
    $('given-wrap').hidden = !g;
    $('given').textContent = g;
    $('code').value = store.data.drafts[t.id] ?? t.starter;
    $('extra').innerHTML = '';
    $('results').innerHTML = '';
    renderPreview();
    if (location.hash.slice(1) !== t.id) { try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* sandboxed frame */ } }
  }

  function renderAll() { renderTabs(); renderList(); renderOverall(); renderTask(); }

  function select(id) {
    const t = TASKS.find((x) => x.id === id);
    if (!t) return;
    current = t; topic = t.topic;
    renderAll();
  }

  /* ---------- вывод проверки ---------- */
  const row = (kind, body) => '<div class="test ' + kind + '"><span class="mark">' + (kind === 'ok' ? '✓' : kind === 'warn' ? '!' : '✗') + '</span><div class="body">' + body + '</div></div>';

  async function check() {
    const t = current;
    const code = $('code').value;
    store.data.drafts[t.id] = code;
    store.data.attempts[t.id] = (store.data.attempts[t.id] || 0) + 1;
    $('results').innerHTML = '<div class="summary">Проверяю…</div>';
    let res;
    try { res = await GymEngine.runChecks(t, code); } catch (err) {
      $('results').innerHTML = '<div class="summary bad">Не удалось выполнить проверку: ' + esc((err && err.message) || err) + '</div>';
      store.save();
      return;
    }
    if (t !== current) return;
    let total = 1 + res.results.length;
    let passed = (res.hard.length ? 0 : 1) + res.results.filter((r) => r.ok).length;
    let body = '<div class="group">' + esc(res.label) + '</div>';
    if (res.hard.length) body += res.hard.map((m) => row('bad', esc(m))).join('');
    else body += row('ok', esc(res.okText));
    if (res.soft.length) body += res.soft.map((m) => row('warn', esc(m))).join('');
    body += '<div class="group">Результат</div>';
    body += res.results.map((r) => row(r.ok ? 'ok' : 'bad', esc(r.name) + (r.ok || !r.detail ? '' : '<div class="detail"><em>' + esc(r.detail) + '</em></div>'))).join('');
    const all = passed === total;
    $('results').innerHTML = '<div class="summary ' + (all ? 'ok' : 'bad') + '">' + (all ? 'Всё сошлось: проверок пройдено ' : 'Пройдено проверок: ') + passed + ' из ' + total + '</div>' + body;
    if (all) {
      const first = !store.data.solved[t.id];
      store.data.solved[t.id] = true;
      store.save();
      renderTabs(); renderList(); renderOverall();
      $('meta').querySelector('.solved') || $('meta').insertAdjacentHTML('beforeend', '<span class="solved">✓ решено</span>');
      if (first) $('extra').innerHTML = '<div class="panel explain">Готово. Теперь объясни своими словами: что делает каждая команда или строка и что было бы без неё.</div>';
    } else {
      store.save();
    }
  }

  /* ---------- редактор ---------- */
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
  let saveTimer, pvTimer;
  ta.addEventListener('input', () => {
    store.data.drafts[current.id] = ta.value;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.save(), 400);
    clearTimeout(pvTimer); pvTimer = setTimeout(renderPreview, 250);
  });

  /* ---------- кнопки ---------- */
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
      + '<span>Не копируй: закрой решение, напиши по памяти и объясни каждую строку.</span></div>';
  }
  $('reset-btn').addEventListener('click', () => {
    $('extra').innerHTML = '<div class="panel confirm"><span>Стереть твой код в этой задаче?</span><button class="btn" id="do-reset">Стереть</button><button class="btn" id="no-reset">Оставить</button></div>';
    $('do-reset').addEventListener('click', () => { delete store.data.drafts[current.id]; store.save(); ta.value = current.starter; $('extra').innerHTML = ''; $('results').innerHTML = ''; renderPreview(); });
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

  /* ---------- старт ---------- */
  const fromHash = TASKS.find((t) => t.id === location.hash.slice(1));
  current = fromHash || TASKS.find((t) => !store.data.solved[t.id]) || TASKS[0];
  topic = current.topic;
  renderAll();
})();
