(() => {
  const TOPICS = [
    { id: 'sel', name: 'Селекторы', note: 'Тег, класс, вложенность, :hover, :not, :nth-child, соседи, ::before / ::after и content.' },
    { id: 'box', name: 'Блок', note: 'width и height, padding, margin, border, box-sizing, схлопывание отступов, max-width, position.' },
    { id: 'text', name: 'Текст и цвет', note: 'font-size, line-height, цвета, font: inherit, CSS-переменные, clamp().' },
    { id: 'flex', name: 'Flexbox', note: 'display: flex, gap, justify-content, align-items, flex-wrap, flex: 1, центрирование.' },
    { id: 'grid', name: 'Grid', note: 'grid-template-columns, fr, repeat, minmax, auto-fill, области сетки.' },
    { id: 'resp', name: 'Адаптив и темы', note: '@media, перестройка карточек, светлая и тёмная тема через переменные.' },
  ];
  const LEVELS = ['', 'Разминка', 'База', 'Уверенно', 'Сложно', 'Босс'];
  const KEY = 'cssgym-v1';

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

  let topic = 'sel';
  let current = TASKS[0];
  let pvWidth = 0;     // 0 — на всю ширину панели
  let toggleOn = false;

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
  // высоту предпросмотра сообщает сам iframe (родитель не читает чужой документ: в «песочнице» это запрещено)
  window.addEventListener('message', (e) => {
    if (!e.data || typeof e.data.gymFit !== 'number') return;
    for (const id of ['pv-user', 'pv-ref']) {
      const f = $(id);
      if (f.contentWindow === e.source) f.style.height = Math.min(Math.max(e.data.gymFit, 70), 440) + 'px';
    }
  });
  function setFrame(f, doc) { f.srcdoc = doc; }
  function applyWidth() {
    for (const id of ['pv-user', 'pv-ref']) $(id).style.width = pvWidth ? pvWidth + 'px' : '100%';
    document.querySelectorAll('#pvbar [data-w]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.w) === pvWidth)));
  }
  function renderPreview() {
    const t = current;
    const attrs = toggleOn && t.toggle ? ' ' + t.toggle.attr + '="' + t.toggle.on + '"' : '';
    setFrame($('pv-user'), GymEngine.wrapDoc(t.html, $('code').value, attrs));
    setFrame($('pv-ref'), GymEngine.wrapDoc(t.html, t.solution, attrs));
  }
  function renderPvBar() {
    const t = current;
    let html = '';
    if (t.widths) {
      html += '<span>ширина окна:</span>' + t.widths.map((w) => '<button data-w="' + w + '" aria-pressed="false">' + w + ' px</button>').join('');
    }
    if (t.toggle) html += '<label><input type="checkbox" id="pv-toggle"' + (toggleOn ? ' checked' : '') + '> ' + esc(t.toggle.label) + '</label>';
    $('pvbar').innerHTML = html;
    $('pvbar').style.display = html ? '' : 'none';
    applyWidth();
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
    $('htmlsrc').textContent = t.html;
    $('code').value = store.data.drafts[t.id] ?? t.starter;
    $('extra').innerHTML = '';
    $('results').innerHTML = '';
    toggleOn = false;
    pvWidth = t.widths ? t.widths[0] : 0;
    renderPvBar();
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
    let body = '<div class="group">Написание</div>';
    if (res.hard.length) body += res.hard.map((m) => row('bad', esc(m))).join('');
    else body += row('ok', 'браузер понимает все свойства и значения');
    if (res.soft.length) body += res.soft.map((m) => row('warn', esc(m))).join('');
    body += '<div class="group">Результат на странице</div>';
    body += res.results.map((r) => row(r.ok ? 'ok' : 'bad', esc(r.name) + (r.ok || !r.detail ? '' : '<div class="detail"><em>' + esc(r.detail) + '</em></div>'))).join('');
    const all = passed === total;
    $('results').innerHTML = '<div class="summary ' + (all ? 'ok' : 'bad') + '">' + (all ? 'Всё сошлось: проверок пройдено ' : 'Пройдено проверок: ') + passed + ' из ' + total + '</div>' + body;
    if (all) {
      const first = !store.data.solved[t.id];
      store.data.solved[t.id] = true;
      store.save();
      renderTabs(); renderList(); renderOverall();
      $('meta').querySelector('.solved') || $('meta').insertAdjacentHTML('beforeend', '<span class="solved">✓ решено</span>');
      if (first) $('extra').innerHTML = '<div class="panel explain">Готово. Теперь объясни своими словами: что делает каждое свойство и что случится, если его убрать.</div>';
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
    clearTimeout(pvTimer); pvTimer = setTimeout(() => setFrame($('pv-user'), GymEngine.wrapDoc(current.html, ta.value, toggleOn && current.toggle ? ' ' + current.toggle.attr + '="' + current.toggle.on + '"' : '')), 200);
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
      + '<span>Не копируй: закрой решение, напиши по памяти и объясни каждое свойство.</span></div>';
  }
  $('reset-btn').addEventListener('click', () => {
    $('extra').innerHTML = '<div class="panel confirm"><span>Стереть твой код в этой задаче?</span><button class="btn" id="do-reset">Стереть</button><button class="btn" id="no-reset">Оставить</button></div>';
    $('do-reset').addEventListener('click', () => { delete store.data.drafts[current.id]; store.save(); ta.value = current.starter; $('extra').innerHTML = ''; $('results').innerHTML = ''; renderPreview(); });
    $('no-reset').addEventListener('click', () => { $('extra').innerHTML = ''; });
  });
  $('pvbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    pvWidth = Number(b.dataset.w); applyWidth();
  });
  $('pvbar').addEventListener('change', (e) => {
    if (e.target.id === 'pv-toggle') { toggleOn = e.target.checked; renderPreview(); }
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
