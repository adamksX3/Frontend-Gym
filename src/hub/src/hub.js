/* hub.js — оболочка: каждый тренажёр лежит внутри файла целиком и открывается в своём iframe.
   Тренажёры не изменены, их прогресс хранится под прежними ключами localStorage. */
(() => {
  const GYMS = __GYMS__;
  const SOON = []; // сюда можно вписать названия разделов, которые ещё не готовы
  const HUB_KEY = 'gymhub-v1';
  const $ = (id) => document.getElementById(id);
  const frames = {};
  let current = null;

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  };
  function solved(g) {
    try { const d = JSON.parse(ls.get(g.key) || '{}'); return Object.keys(d.solved || {}).filter((id) => d.solved[id]).length; } catch (e) { return 0; }
  }

  function renderTabs() {
    $('gyms').innerHTML = GYMS.map((g) => '<button role="tab" data-gym="' + g.id + '" aria-selected="' + (g.id === current) + '">' + g.name
      + '<span>' + Math.min(solved(g), g.total) + '/' + g.total + '</span></button>').join('')
      + SOON.map((s) => '<span class="soon">' + s + ' · скоро</span>').join('');
    const done = GYMS.reduce((n, g) => n + Math.min(solved(g), g.total), 0);
    const all = GYMS.reduce((n, g) => n + g.total, 0);
    $('total-text').textContent = done + ' / ' + all;
    $('total-bar').style.width = (done / all) * 100 + '%';
  }

  function open(id) {
    const g = GYMS.find((x) => x.id === id) || GYMS[0];
    current = g.id;
    if (!frames[g.id]) {
      const f = document.createElement('iframe');
      f.title = 'Тренажёр ' + g.name;
      f.srcdoc = JSON.parse($('gym-' + g.id).textContent);
      $('stage').appendChild(f);
      frames[g.id] = f;
    }
    for (const k of Object.keys(frames)) frames[k].hidden = k !== g.id;
    ls.set(HUB_KEY, JSON.stringify({ last: g.id }));
    try { history.replaceState(null, '', '#' + g.id); } catch (e) { /* sandboxed frame */ }
    document.title = g.name + ' · Frontend Gym';
    renderTabs();
  }

  $('gyms').addEventListener('click', (e) => { const b = e.target.closest('[data-gym]'); if (b) open(b.dataset.gym); });
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id !== current && GYMS.some((g) => g.id === id)) open(id); });
  window.addEventListener('storage', renderTabs);
  setInterval(renderTabs, 2500);

  /* ---------- перенос прогресса ---------- */
  const menu = $('menu');
  const say = (t) => { $('menu-msg').textContent = t; };
  $('tools-btn').addEventListener('click', () => { menu.hidden = !menu.hidden; $('tools-btn').setAttribute('aria-expanded', String(!menu.hidden)); say(''); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; $('tools-btn').setAttribute('aria-expanded', 'false'); $('tools-btn').focus(); } });
  function collect() {
    const data = { app: 'frontend-gym', version: 1, saved: new Date().toISOString(), gyms: {} };
    for (const g of GYMS) { const raw = ls.get(g.key); if (raw) { try { data.gyms[g.key] = JSON.parse(raw); } catch (e) { /* skip broken */ } } }
    return Object.keys(data.gyms).length ? data : null;
  }
  function apply(text) {
    let data;
    try { data = JSON.parse(text); } catch (err) { say('Не получилось прочитать: это не текст прогресса.'); return; }
    if (!data || data.app !== 'frontend-gym' || !data.gyms) { say('Это не прогресс Frontend Gym.'); return; }
    let n = 0;
    for (const g of GYMS) {
      const inc = data.gyms[g.key]; if (!inc) continue;
      let cur = {};
      try { cur = JSON.parse(ls.get(g.key) || '{}'); } catch (err) { cur = {}; }
      // объединяем: решённое остаётся решённым, черновики из текста не затирают те, что уже есть в этом браузере
      const merged = { ...inc, ...cur, solved: { ...(inc.solved || {}), ...(cur.solved || {}) }, drafts: { ...(inc.drafts || {}), ...(cur.drafts || {}) }, attempts: { ...(inc.attempts || {}), ...(cur.attempts || {}) } };
      if (ls.set(g.key, JSON.stringify(merged))) n++;
    }
    if (!n) { say('Браузер не дал сохранить прогресс (хранилище недоступно).'); return; }
    for (const k of Object.keys(frames)) { frames[k].remove(); delete frames[k]; }
    open(current);
    say('Прогресс загружен и объединён с текущим.');
  }
  $('show-btn').addEventListener('click', () => {
    const data = collect();
    if (!data) { say('Показывать пока нечего: ни одной решённой задачи и ни одного черновика.'); return; }
    $('io').value = JSON.stringify(data);
    $('io').focus(); $('io').select();
    say('Текст выделен: скопируй его (Ctrl+C) и вставь в другом месте.');
  });
  $('apply-btn').addEventListener('click', () => {
    const text = $('io').value.trim();
    if (!text) { say('Сначала вставь в поле текст прогресса.'); return; }
    apply(text);
  });
  // файлы работают только когда тренажёр открыт как файл с диска; в онлайн-версии остаётся перенос текстом
  if (location.protocol === 'file:') {
    $('file-tools').hidden = false;
    $('export-btn').addEventListener('click', () => {
      const data = collect();
      if (!data) { say('Сохранять пока нечего: ни одной решённой задачи и ни одного черновика.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = 'frontend-gym-progress-' + data.saved.slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      say('Файл сохранён в папку загрузок.');
    });
    $('import-btn').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0]; e.target.value = '';
      if (file) apply(await file.text());
    });
  }

  let start = location.hash.slice(1);
  if (!GYMS.some((g) => g.id === start)) { try { start = JSON.parse(ls.get(HUB_KEY) || '{}').last; } catch (e) { start = null; } }
  open(start);
})();
