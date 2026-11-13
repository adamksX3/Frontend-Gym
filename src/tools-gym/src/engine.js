/* engine.js — проверки тренажёра «Git и инструменты».
   Виды задач (task.kind):
   git        — команды выполняются в маленьком симуляторе git, проверяется состояние репозитория
   cmd        — одна или несколько команд (npm, npx): проверяется разобранная команда
   json       — текст разбирается JSON.parse, проверяется значение
   js         — функция Артура запускается на тестах
   text       — файл со строками (хук, сообщение коммита)
   ignore     — .gitignore / .prettierignore: правила применяются к списку файлов
   prettierrc — конфиг Prettier: настоящий Prettier форматирует код с этим конфигом
   pcode      — код, который должен совпасть с тем, как его оформил бы Prettier */
(function () {
  /* ================= командная строка ================= */
  function splitCommands(code) {
    const out = [];
    for (let line of String(code).split('\n')) {
      line = line.trim().replace(/^\$\s+/, '');
      if (!line || line.startsWith('#')) continue;
      let cur = '', q = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === q) q = null; cur += ch; continue; }
        if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
        if (ch === '&' && line[i + 1] === '&') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
        cur += ch;
      }
      if (cur.trim()) out.push(cur.trim());
    }
    return out;
  }
  function tokenize(s) {
    const argv = []; let redir = null;
    let cur = '', has = false, q = null;
    const push = () => { if (has) { if (redir && redir.file === null) redir.file = cur; else argv.push(cur); } cur = ''; has = false; };
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"' && (s[i + 1] === '"' || s[i + 1] === '$' || s[i + 1] === '\\')) { cur += s[++i]; } else cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
      if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; has = true; continue; }
      if (/\s/.test(ch)) { push(); continue; }
      if (ch === '>') { push(); const op = s[i + 1] === '>' ? '>>' : '>'; if (op === '>>') i++; redir = { op, file: null }; continue; }
      cur += ch; has = true;
    }
    push();
    return { argv, redir, raw: s, unclosed: !!q };
  }

  /* ================= шаблоны файлов (.gitignore, lint-staged) ================= */
  function globToRe(glob) {
    let re = '';
    for (let i = 0; i < glob.length; i++) {
      const ch = glob[i];
      if (ch === '*') {
        if (glob[i + 1] === '*') { i++; if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; } else re += '[^/]*';
      } else if (ch === '?') re += '[^/]';
      else if (ch === '{') { const j = glob.indexOf('}', i); if (j < 0) { re += '\\{'; } else { re += '(?:' + glob.slice(i + 1, j).split(',').map((x) => globToRe(x)).join('|') + ')'; i = j; } }
      else re += ch.replace(/[.+^$()|[\]\\]/g, '\\$&');
    }
    return re;
  }
  // правила как в .gitignore: побеждает последнее подходящее, «!» возвращает файл обратно
  function makeIgnore(text) {
    const rules = [];
    for (let line of String(text).split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      let neg = false;
      if (line.startsWith('!')) { neg = true; line = line.slice(1); }
      let dirOnly = false;
      if (line.endsWith('/')) { dirOnly = true; line = line.slice(0, -1); }
      let anchored = false;
      if (line.startsWith('/')) { anchored = true; line = line.slice(1); } else if (line.includes('/')) anchored = true;
      if (!line) continue;
      rules.push({ neg, dirOnly, re: new RegExp('^' + (anchored ? '' : '(?:.*/)?') + globToRe(line) + '$') });
    }
    return (path) => {
      const parts = path.split('/');
      let ignored = false;
      for (const r of rules) {
        let hit = false;
        for (let n = 1; n <= parts.length; n++) {
          const isDir = n < parts.length;
          if (r.dirOnly && !isDir) continue;
          if (r.re.test(parts.slice(0, n).join('/'))) { hit = true; break; }
        }
        if (hit) ignored = !r.neg;
      }
      return ignored;
    };
  }
  // как в lint-staged: шаблон без «/» сравнивается с именем файла в любой папке
  function globMatch(glob, path) {
    const re = new RegExp('^' + (glob.includes('/') ? '' : '(?:.*/)?') + globToRe(glob) + '$');
    return re.test(path);
  }

  /* ================= симулятор git ================= */
  const CONVENTIONAL = /^(feat|fix|docs|style|refactor|test|chore|init|perf|build|ci|revert)(\([\w-]+\))?: \S.*$/;
  function newRepo(task) {
    return { inited: false, commits: {}, n: 0, branches: {}, head: null, index: {}, work: {}, remotes: {}, rrefs: {}, upstream: {}, stash: [], merging: null, server: {}, hooks: (task && task.hooks) || {} };
  }
  const same = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((k) => a[k] === b[k]); };
  const headId = (r) => (r.head ? (r.head.branch !== undefined ? r.branches[r.head.branch] || null : r.head.id) : null);
  const treeOf = (r, id) => (id ? r.commits[id].tree : {});
  function commitObj(r, msg, tree, parents) {
    r.n++;
    let h = 7 + r.n * 2654435761;
    for (const ch of msg) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const id = ((h >>> 0).toString(16) + '0000000').slice(0, 7);
    r.commits[id] = { id, seq: r.n, msg, tree: { ...tree }, parents: parents.filter(Boolean) };
    return id;
  }
  function ancestors(r, id) {
    const seen = new Set(); const stack = id ? [id] : [];
    while (stack.length) { const x = stack.pop(); if (seen.has(x)) continue; seen.add(x); for (const p of r.commits[x].parents) stack.push(p); }
    return seen;
  }
  const isAncestor = (r, a, b) => !a || ancestors(r, b).has(a);
  function mergeBase(r, a, b) {
    const A = ancestors(r, a);
    return [...ancestors(r, b)].filter((x) => A.has(x)).sort((x, y) => r.commits[y].seq - r.commits[x].seq)[0] || null;
  }
  function resolve(r, ref) {
    const m = String(ref).match(/^(.*?)((?:~\d*|\^)*)$/);
    let base = m[1], id;
    if (base === 'HEAD' || base === '@') id = headId(r);
    else if (base in r.branches) id = r.branches[base];
    else if (base in r.rrefs) id = r.rrefs[base];
    else if (/^[0-9a-f]{4,7}$/.test(base)) id = Object.keys(r.commits).find((k) => k.startsWith(base));
    if (!id) return null;
    for (const step of m[2].match(/~\d*|\^/g) || []) {
      const n = step === '^' || step === '~' ? 1 : Number(step.slice(1));
      for (let i = 0; i < n; i++) { id = r.commits[id].parents[0]; if (!id) return null; }
    }
    return id;
  }
  function ignoreFn(r) { return r.work['.gitignore'] !== undefined ? makeIgnore(r.work['.gitignore']) : () => false; }
  function status(r) {
    const h = treeOf(r, headId(r)); const ign = ignoreFn(r);
    const staged = [], modified = [], untracked = [];
    for (const p of new Set([...Object.keys(h), ...Object.keys(r.index)])) {
      if (h[p] === r.index[p]) continue;
      staged.push({ path: p, kind: !(p in h) ? 'новый файл' : !(p in r.index) ? 'удалён' : 'изменён' });
    }
    for (const p of Object.keys(r.index)) {
      if (!(p in r.work)) modified.push({ path: p, kind: 'удалён' }); else if (r.work[p] !== r.index[p]) modified.push({ path: p, kind: 'изменён' });
    }
    for (const p of Object.keys(r.work)) if (!(p in r.index) && !ign(p)) untracked.push(p);
    const by = (a, b) => (a.path || a).localeCompare(b.path || b);
    return { staged: staged.sort(by), modified: modified.sort(by), untracked: untracked.sort() };
  }
  const dirty = (r) => { const s = status(r); return s.staged.length + s.modified.length > 0; };
  function decorations(r, id) {
    const d = [];
    if (r.head && r.head.branch === undefined && r.head.id === id) d.push('HEAD');
    for (const b of Object.keys(r.branches)) if (r.branches[b] === id) d.push(r.head && r.head.branch === b ? 'HEAD -> ' + b : b);
    for (const b of Object.keys(r.rrefs)) if (r.rrefs[b] === id) d.push(b);
    return d.length ? ' (' + d.join(', ') + ')' : '';
  }
  function logList(r, id) { return [...ancestors(r, id)].map((x) => r.commits[x]).sort((a, b) => b.seq - a.seq); }
  // переход на другой коммит: незакоммиченные правки переносятся, если не мешают
  function moveTo(r, target) {
    const cur = treeOf(r, headId(r)), next = treeOf(r, target);
    const work = { ...next }, index = { ...next };
    for (const p of new Set([...Object.keys(cur), ...Object.keys(r.index), ...Object.keys(r.work)])) {
      const changed = r.index[p] !== cur[p] || (p in r.index && r.work[p] !== r.index[p]);
      const untracked = !(p in r.index) && !(p in cur) && p in r.work;
      if (changed && cur[p] !== next[p]) return 'error: ваши незакоммиченные изменения в «' + p + '» будут потеряны при переходе. Сначала сделай коммит или спрячь их: git stash';
      if (untracked && p in next && next[p] !== r.work[p]) return 'error: неотслеживаемый файл «' + p + '» будет перезаписан при переходе';
      if (changed) { if (p in r.index) index[p] = r.index[p]; else delete index[p]; if (p in r.work) work[p] = r.work[p]; else delete work[p]; } else if (untracked) work[p] = r.work[p];
    }
    r.index = index; r.work = work;
    return null;
  }
  function doMerge(r, other, label) {
    const cur = headId(r);
    if (!cur) { r.branches[r.head.branch] = other; r.index = { ...treeOf(r, other) }; r.work = { ...r.work, ...treeOf(r, other) }; return { out: 'Быстрая перемотка (fast-forward)' }; }
    if (isAncestor(r, other, cur)) return { out: 'Already up to date. Сливать нечего: всё уже здесь.' };
    if (dirty(r)) return { err: 'error: есть незакоммиченные изменения. Сначала сделай коммит или git stash, потом сливай' };
    if (isAncestor(r, cur, other)) {
      const e = moveTo(r, other); if (e) return { err: e };
      if (r.head.branch !== undefined) r.branches[r.head.branch] = other; else r.head.id = other;
      return { out: 'Updating ' + cur + '..' + other + '\nFast-forward: ветка просто передвинута вперёд, нового коммита нет' };
    }
    const base = treeOf(r, mergeBase(r, cur, other)), ours = treeOf(r, cur), theirs = treeOf(r, other);
    const tree = {}, conflicts = [];
    const untracked = {}; for (const p of Object.keys(r.work)) if (!(p in r.index)) untracked[p] = r.work[p];
    const work = {};
    for (const p of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
      const b = base[p], o = ours[p], t = theirs[p];
      let v;
      if (o === t) v = o; else if (o === b) v = t; else if (t === b) v = o;
      else { conflicts.push(p); if (o !== undefined) tree[p] = o; work[p] = '<<<<<<< HEAD\n' + (o === undefined ? '' : o) + '\n=======\n' + (t === undefined ? '' : t) + '\n>>>>>>> ' + label; continue; }
      if (v !== undefined) { tree[p] = v; work[p] = v; }
    }
    const msg = "Merge branch '" + label + "'" + (r.head.branch && r.head.branch !== 'main' ? ' into ' + r.head.branch : '');
    r.index = { ...tree }; r.work = { ...untracked, ...work };
    if (conflicts.length) {
      r.merging = { other, msg, conflicts: new Set(conflicts) };
      return { out: conflicts.map((p) => 'CONFLICT (content): конфликт слияния в ' + p).join('\n') + '\nАвтоматическое слияние не удалось. Исправь файлы, добавь их (git add) и сделай коммит.', conflict: true };
    }
    const id = commitObj(r, msg, tree, [cur, other]);
    if (r.head.branch !== undefined) r.branches[r.head.branch] = id; else r.head.id = id;
    return { out: "Merge made: создан коммит слияния " + id + ' «' + msg + '»' };
  }
  function addPath(r, p) {
    const ign = ignoreFn(r); let n = 0;
    const all = p === '.' || p === '-A' || p === '--all' || p === '*';
    const pre = p.replace(/\/$/, '') + '/';
    for (const f of new Set([...Object.keys(r.work), ...Object.keys(r.index)])) {
      if (!(all || f === p || f.startsWith(pre))) continue;
      if (f in r.work) { if (!(f in r.index) && ign(f) && (all || f !== p)) continue; r.index[f] = r.work[f]; } else delete r.index[f];
      if (r.merging) r.merging.conflicts.delete(f);
      n++;
    }
    return n;
  }
  function serverRepo(r, url) { return (r.server[url] = r.server[url] || { branches: {} }); }
  function fetchAll(r) { const url = r.remotes.origin; const s = serverRepo(r, url); for (const b of Object.keys(s.branches)) r.rrefs['origin/' + b] = s.branches[b]; }

  function git(r, a, st) {
    const sub = a[0]; const args = a.slice(1);
    const flags = args.filter((x) => x.startsWith('-')); const pos = args.filter((x) => !x.startsWith('-'));
    const has = (...f) => f.some((x) => flags.includes(x));
    if (!sub) return { err: 'после git нужна команда, например git status' };
    if (sub === 'init') {
      if (r.inited) return { out: 'Репозиторий здесь уже есть (повторный git init ничего не меняет)' };
      r.inited = true; r.head = { branch: 'main' };
      return { out: 'Initialized empty Git repository: создан пустой репозиторий, ветка main' };
    }
    if (sub === 'clone') {
      if (r.inited) return { err: 'fatal: здесь уже есть репозиторий' };
      const url = pos[0]; if (!url) return { err: 'после git clone нужен адрес репозитория' };
      if (!r.server[url]) return { err: 'fatal: repository «' + url + '» not found. Проверь адрес' };
      r.inited = true; r.remotes.origin = url; fetchAll(r);
      const b = 'main' in r.server[url].branches ? 'main' : Object.keys(r.server[url].branches)[0];
      r.head = { branch: b }; r.branches[b] = r.server[url].branches[b]; r.upstream[b] = 'origin/' + b;
      r.index = { ...treeOf(r, r.branches[b]) }; r.work = { ...r.index };
      return { out: 'Cloning… Репозиторий скопирован, ветка ' + b + ' связана с origin/' + b };
    }
    if (sub === 'config') return { out: '' };
    if (!r.inited) return { err: 'fatal: not a git repository. Здесь ещё нет репозитория: сначала git init' };
    const cur = headId(r);
    const setHead = (id) => { if (r.head.branch !== undefined) r.branches[r.head.branch] = id; else r.head.id = id; };

    if (sub === 'status') {
      const s = status(r); let o = r.head.branch !== undefined ? 'На ветке ' + r.head.branch : 'HEAD отделён на ' + r.head.id;
      if (r.merging) o += '\nИдёт слияние' + (r.merging.conflicts.size ? ': есть неразрешённые конфликты (' + [...r.merging.conflicts].join(', ') + ')' : ': конфликты решены, осталось git commit');
      if (s.staged.length) o += '\nВ индексе (войдёт в коммит):\n' + s.staged.map((x) => '    ' + x.kind + ': ' + x.path).join('\n');
      if (s.modified.length) o += '\nИзменено, но не в индексе:\n' + s.modified.map((x) => '    ' + x.kind + ': ' + x.path).join('\n');
      if (s.untracked.length) o += '\nНеотслеживаемые файлы:\n' + s.untracked.map((x) => '    ' + x).join('\n');
      if (!s.staged.length && !s.modified.length && !s.untracked.length) o += '\nКоммитить нечего, рабочая папка чистая';
      return { out: o };
    }
    if (sub === 'add') {
      if (!args.length) return { err: 'Nothing specified: укажи файл или точку, например git add .' };
      for (const p of args.filter((x) => !x.startsWith('-') || x === '-A' || x === '--all')) {
        if (p !== '.' && p !== '-A' && p !== '--all' && p !== '*' && !(p in r.work) && !(p in r.index) && !Object.keys(r.work).some((f) => f.startsWith(p.replace(/\/$/, '') + '/'))) return { err: "fatal: pathspec '" + p + "' did not match any files. Файла «" + p + '» нет' };
        addPath(r, p);
      }
      return { out: '' };
    }
    if (sub === 'commit') {
      const amend = has('--amend');
      let msg = null; const mi = args.findIndex((x) => /^-[a-z]*m$/.test(x) || x === '--message');
      if (mi >= 0) { msg = args[mi + 1]; if (msg === undefined || msg.startsWith('-')) return { err: 'после -m нужно сообщение в кавычках' }; }
      if (args.some((x) => /^-[b-ln-z]*a[a-z]*$/.test(x)) || has('--all')) for (const p of Object.keys(r.index)) { if (p in r.work) r.index[p] = r.work[p]; else delete r.index[p]; }
      if (r.merging && r.merging.conflicts.size) return { err: 'error: есть неразрешённые конфликты: ' + [...r.merging.conflicts].join(', ') + '. Исправь файлы и добавь их через git add' };
      if (msg === null) {
        if (r.merging) msg = r.merging.msg; else if (amend && has('--no-edit')) msg = r.commits[cur].msg;
        else return { err: 'В тренажёре нет текстового редактора: передай сообщение через -m "текст"' };
      }
      if (!msg.trim()) return { err: 'Aborting commit due to empty commit message: сообщение пустое' };
      if (r.hooks.commitMsg === 'conventional' && !has('--no-verify', '-n') && !r.merging && !CONVENTIONAL.test(msg)) {
        return { err: 'husky - commit-msg script failed (code 1)\n✖ сообщение «' + msg + '» не по правилам: нужно «тип: описание», например feat: add search form. Коммит не создан' };
      }
      if (amend) {
        if (!cur) return { err: 'fatal: исправлять нечего: коммитов ещё нет' };
        const id = commitObj(r, msg, r.index, r.commits[cur].parents);
        setHead(id);
        return { out: '[' + (r.head.branch || 'HEAD') + ' ' + id + '] ' + msg + '\nПоследний коммит заменён новым' };
      }
      if (!r.merging && same(r.index, treeOf(r, cur))) return { err: 'nothing to commit: в индексе нет изменений. Сначала git add' };
      const id = commitObj(r, msg, r.index, r.merging ? [cur, r.merging.other] : [cur]);
      setHead(id); r.merging = null;
      return { out: '[' + (r.head.branch || 'HEAD') + ' ' + id + '] ' + msg };
    }
    if (sub === 'log') {
      if (!cur) return { err: 'fatal: в этой ветке ещё нет коммитов' };
      return { out: logList(r, cur).map((c) => c.id + decorations(r, c.id) + ' ' + c.msg).join('\n') };
    }
    if (sub === 'branch') {
      if (has('-d', '-D', '--delete')) {
        const b = pos[0]; if (!b) return { err: 'укажи имя ветки для удаления' };
        if (!(b in r.branches)) return { err: "error: branch '" + b + "' not found. Ветки «" + b + '» нет' };
        if (r.head.branch === b) return { err: "error: нельзя удалить ветку '" + b + "', на которой ты стоишь. Сначала перейди на другую" };
        if (has('-d', '--delete') && !has('-D') && !isAncestor(r, r.branches[b], cur) && !(r.upstream[b] && isAncestor(r, r.branches[b], r.rrefs[r.upstream[b]]))) return { err: "error: ветка '" + b + "' не слита. Если уверен, удаляй через -D" };
        delete r.branches[b]; delete r.upstream[b];
        return { out: 'Deleted branch ' + b };
      }
      if (has('-m', '-M', '--move')) {
        const to = pos[pos.length - 1], from = pos.length > 1 ? pos[0] : r.head.branch;
        if (!to) return { err: 'укажи новое имя ветки' };
        if (to in r.branches) return { err: "fatal: ветка '" + to + "' уже есть" };
        r.branches[to] = r.branches[from]; delete r.branches[from];
        if (r.head.branch === from) r.head.branch = to;
        return { out: '' };
      }
      if (pos[0]) {
        if (pos[0] in r.branches) return { err: "fatal: a branch named '" + pos[0] + "' already exists. Такая ветка уже есть" };
        if (!cur) return { err: 'fatal: сначала нужен хотя бы один коммит' };
        const at = pos[1] ? resolve(r, pos[1]) : cur; if (!at) return { err: 'fatal: не нашёл «' + pos[1] + '»' };
        r.branches[pos[0]] = at; return { out: '' };
      }
      const names = new Set(Object.keys(r.branches)); if (r.head.branch !== undefined) names.add(r.head.branch);
      return { out: [...names].sort().map((b) => (r.head.branch === b ? '* ' : '  ') + b).join('\n') };
    }
    if (sub === 'switch' || sub === 'checkout') {
      const create = sub === 'switch' ? has('-c', '--create') : has('-b');
      if (sub === 'checkout' && (args[0] === '--' || (pos.length && !create && !(pos[0] in r.branches) && pos.every((p) => p === '.' || p in r.index)))) {
        const files = args[0] === '--' ? args.slice(1) : pos;
        return git(r, ['restore', ...files], st);
      }
      const name = pos[0]; if (!name) return { err: 'укажи имя ветки' };
      if (create) {
        if (name in r.branches) return { err: "fatal: a branch named '" + name + "' already exists. Такая ветка уже есть: перейди на неё без " + (sub === 'switch' ? '-c' : '-b') };
        const at = pos[1] ? resolve(r, pos[1]) : cur;
        if (pos[1] && !at) return { err: 'fatal: не нашёл «' + pos[1] + '»' };
        if (at !== cur) { const e = moveTo(r, at); if (e) return { err: e }; }
        if (at) r.branches[name] = at;
        r.head = { branch: name };
        return { out: "Switched to a new branch '" + name + "': ветка создана, ты на ней" };
      }
      if (!(name in r.branches)) {
        if (('origin/' + name) in r.rrefs) { const e = moveTo(r, r.rrefs['origin/' + name]); if (e) return { err: e }; r.branches[name] = r.rrefs['origin/' + name]; r.upstream[name] = 'origin/' + name; r.head = { branch: name }; return { out: "Switched to a new branch '" + name + "' (следит за origin/" + name + ')' }; }
        return { err: (sub === 'switch' ? "fatal: invalid reference: " : "error: pathspec '") + name + (sub === 'switch' ? '' : "' did not match") + '. Ветки «' + name + '» нет. Создать и перейти: git switch -c ' + name };
      }
      if (r.head.branch === name) return { out: "Already on '" + name + "'" };
      const e = moveTo(r, r.branches[name]); if (e) return { err: e };
      r.head = { branch: name };
      return { out: "Switched to branch '" + name + "'" };
    }
    if (sub === 'merge') {
      if (has('--abort')) { if (!r.merging) return { err: 'fatal: слияния сейчас нет' }; r.merging = null; r.index = { ...treeOf(r, cur) }; const u = {}; for (const p of Object.keys(r.work)) if (!(p in treeOf(r, cur)) && !/^<<<<<<< /.test(r.work[p])) u[p] = r.work[p]; r.work = { ...u, ...treeOf(r, cur) }; return { out: 'Слияние отменено' }; }
      if (r.merging) return { err: 'fatal: предыдущее слияние не закончено. Реши конфликты и сделай git commit (или git merge --abort)' };
      const name = pos[0]; if (!name) return { err: 'укажи, какую ветку влить' };
      const other = resolve(r, name); if (!other) return { err: 'merge: ' + name + ' - not something we can merge. Ветки «' + name + '» нет' };
      return doMerge(r, other, name);
    }
    if (sub === 'restore') {
      if (!pos.length) return { err: 'укажи файл, например git restore app.js' };
      const h = treeOf(r, cur);
      for (const p of pos) {
        const files = p === '.' ? [...new Set([...Object.keys(r.index), ...Object.keys(h)])] : [p];
        for (const f of files) {
          if (has('--staged', '-S')) { if (!(f in r.index) && !(f in h)) return { err: "error: pathspec '" + f + "' did not match any file(s) known to git" }; if (f in h) r.index[f] = h[f]; else delete r.index[f]; }
          else { if (!(f in r.index)) return { err: "error: pathspec '" + f + "' did not match any file(s) known to git. Git ещё не следит за «" + f + '»' }; r.work[f] = r.index[f]; }
        }
      }
      return { out: '' };
    }
    if (sub === 'reset') {
      const mode = has('--hard') ? 'hard' : has('--soft') ? 'soft' : 'mixed';
      const target = pos.length ? resolve(r, pos[0]) : cur;
      if (pos.length && (!target || pos.length > 1) && mode === 'mixed') {
        const files = pos[0] === 'HEAD' ? pos.slice(1) : pos; const h = treeOf(r, cur);
        for (const f of files) { if (!(f in r.index) && !(f in h)) return { err: 'fatal: не нашёл «' + f + '»' }; if (f in h) r.index[f] = h[f]; else delete r.index[f]; }
        return { out: 'Файлы убраны из индекса: ' + files.join(', ') };
      }
      if (!target) return { err: "fatal: ambiguous argument '" + pos[0] + "': не нашёл такой коммит" };
      const untracked = {}; for (const p of Object.keys(r.work)) if (!(p in r.index) && !(p in treeOf(r, cur))) untracked[p] = r.work[p];
      setHead(target); r.merging = null;
      if (mode !== 'soft') r.index = { ...treeOf(r, target) };
      if (mode === 'hard') r.work = { ...untracked, ...treeOf(r, target) };
      return { out: 'HEAD is now at ' + target + ' ' + r.commits[target].msg };
    }
    if (sub === 'rm') {
      if (!pos.length) return { err: 'укажи файл' };
      for (const p of pos) { if (!(p in r.index)) return { err: "fatal: pathspec '" + p + "' did not match any files. Git не следит за «" + p + '»' }; delete r.index[p]; if (!has('--cached')) delete r.work[p]; }
      return { out: pos.map((p) => "rm '" + p + "'").join('\n') };
    }
    if (sub === 'diff') {
      const s = status(r); const l = has('--staged', '--cached') ? s.staged : s.modified;
      return { out: l.length ? l.map((x) => x.kind + ': ' + x.path).join('\n') : '(различий нет)' };
    }
    if (sub === 'stash') {
      const op = pos[0] || 'push';
      if (op === 'list') return { out: r.stash.map((s, i) => 'stash@{' + i + '}: WIP on ' + s.branch).join('\n') || '(пусто)' };
      if (op === 'push' || op === 'save') {
        if (!dirty(r)) return { err: 'No local changes to save: прятать нечего' };
        const h = treeOf(r, cur); const tracked = {}; for (const p of Object.keys(r.work)) if (p in r.index || p in h) tracked[p] = r.work[p];
        r.stash.unshift({ branch: r.head.branch, work: tracked, base: { ...h } });
        const untracked = {}; for (const p of Object.keys(r.work)) if (!(p in r.index) && !(p in h)) untracked[p] = r.work[p];
        r.index = { ...h }; r.work = { ...untracked, ...h };
        return { out: 'Saved working directory: изменения спрятаны, рабочая папка чистая' };
      }
      if (op === 'pop' || op === 'apply') {
        const s = r.stash[0]; if (!s) return { err: 'No stash entries found: спрятанного нет' };
        for (const p of new Set([...Object.keys(s.work), ...Object.keys(s.base)])) { if (s.work[p] === s.base[p]) continue; if (p in s.work) r.work[p] = s.work[p]; else delete r.work[p]; }
        if (op === 'pop') r.stash.shift();
        return { out: 'Изменения возвращены в рабочую папку' };
      }
      return { err: 'в тренажёре есть git stash, git stash pop и git stash list' };
    }
    if (sub === 'revert') {
      const t = resolve(r, pos[0] || ''); if (!t) return { err: 'укажи коммит, например git revert HEAD' };
      if (dirty(r)) return { err: 'error: есть незакоммиченные изменения' };
      const c = r.commits[t]; const before = treeOf(r, c.parents[0]); const tree = { ...treeOf(r, cur) };
      for (const p of new Set([...Object.keys(before), ...Object.keys(c.tree)])) {
        if (before[p] === c.tree[p]) continue;
        if (tree[p] !== c.tree[p]) return { err: 'error: could not revert: файл «' + p + '» менялся после этого коммита' };
        if (p in before) tree[p] = before[p]; else delete tree[p];
      }
      const id = commitObj(r, 'Revert "' + c.msg + '"', tree, [cur]);
      const e = moveTo(r, id); if (e) return { err: e }; setHead(id);
      return { out: '[' + (r.head.branch || 'HEAD') + ' ' + id + '] Revert "' + c.msg + '"\nСоздан новый коммит, который отменяет изменения' };
    }
    if (sub === 'remote') {
      if (pos[0] === 'add') {
        if (pos.length < 3) return { err: 'usage: git remote add <имя> <адрес>' };
        if (pos[1] in r.remotes) return { err: 'error: remote ' + pos[1] + ' already exists. Такой адрес уже записан' };
        r.remotes[pos[1]] = pos[2]; serverRepo(r, pos[2]); return { out: '' };
      }
      if (pos[0] === 'remove' || pos[0] === 'rm') { delete r.remotes[pos[1]]; return { out: '' }; }
      return { out: Object.keys(r.remotes).map((n) => (has('-v') ? n + '\t' + r.remotes[n] + ' (fetch)\n' + n + '\t' + r.remotes[n] + ' (push)' : n)).join('\n') || '(адресов нет)' };
    }
    if (sub === 'push' || sub === 'fetch' || sub === 'pull') {
      if (pos[0] && pos[0] !== 'origin') return { err: "fatal: '" + pos[0] + "' does not appear to be a git repository. В тренажёре сервер называется origin" };
      if (!r.remotes.origin) return { err: "fatal: 'origin' does not appear to be a git repository. Адрес сервера не задан: git remote add origin <адрес>" };
      const srv = serverRepo(r, r.remotes.origin);
      if (sub === 'fetch') { fetchAll(r); return { out: 'Новые коммиты с сервера скачаны (origin/… обновлены), твои ветки не тронуты' }; }
      const b = pos[1] || r.head.branch;
      if (sub === 'push') {
        if (has('--force', '-f')) return { err: 'В тренажёре git push --force выключен: он стирает чужие коммиты на сервере' };
        if (!pos[1] && !has('-u', '--set-upstream') && !r.upstream[b]) return { err: 'fatal: The current branch ' + b + ' has no upstream branch.\nВетка ещё не связана с сервером. Первый раз: git push -u origin ' + b };
        if (!pos[1] && has('-u', '--set-upstream')) return { err: 'после -u укажи сервер и ветку: git push -u origin ' + b };
        const id = r.branches[b]; if (!id) return { err: "error: src refspec " + b + ' does not match any. В ветке «' + b + '» нет коммитов' };
        const there = srv.branches[b];
        if (there && !isAncestor(r, there, id)) return { err: ' ! [rejected] ' + b + ' -> ' + b + ' (fetch first)\nНа сервере есть коммиты, которых нет у тебя. Сначала git pull, потом git push' };
        const upToDate = there === id;
        srv.branches[b] = id; r.rrefs['origin/' + b] = id;
        if (has('-u', '--set-upstream')) r.upstream[b] = 'origin/' + b;
        return { out: upToDate ? 'Everything up-to-date' : 'To ' + r.remotes.origin + '\n   ' + b + ' -> ' + b + (has('-u', '--set-upstream') ? "\nВетка '" + b + "' теперь следит за 'origin/" + b + "'" : '') };
      }
      if (!pos[1] && !r.upstream[b]) return { err: 'There is no tracking information for the current branch. Ветка не связана с сервером: git pull origin ' + b };
      fetchAll(r);
      const other = r.rrefs['origin/' + b]; if (!other) return { err: "fatal: couldn't find remote ref " + b + ': такой ветки на сервере нет' };
      return doMerge(r, other, 'origin/' + b);
    }
    return { err: 'В тренажёре нет команды git ' + sub + '. Проверь написание' };
  }

  function shell(r, t) {
    const a = t.argv; const cmd = a[0];
    if (t.unclosed) return { err: 'кавычка не закрыта' };
    if (cmd === 'git') return git(r, a.slice(1), t);
    if (cmd === 'echo') {
      const text = a.slice(1).join(' ');
      if (!t.redir) return { out: text };
      if (!t.redir.file) return { err: 'после > нужно имя файла' };
      r.work[t.redir.file] = t.redir.op === '>>' && r.work[t.redir.file] !== undefined ? r.work[t.redir.file] + '\n' + text : text;
      return { out: '' };
    }
    if (cmd === 'touch') { for (const f of a.slice(1)) if (!(f in r.work)) r.work[f] = ''; return { out: '' }; }
    if (cmd === 'rm') { for (const f of a.slice(1).filter((x) => !x.startsWith('-'))) { if (!(f in r.work)) return { err: 'rm: файла «' + f + '» нет' }; delete r.work[f]; } return { out: '' }; }
    if (cmd === 'cat') { const f = a[1]; return f in r.work ? { out: r.work[f] } : { err: 'cat: файла «' + f + '» нет' }; }
    if (cmd === 'ls') return { out: Object.keys(r.work).sort().join('\n') };
    if (cmd === 'mkdir' || cmd === 'cd' || cmd === 'clear' || cmd === 'pwd') return { out: '' };
    if (cmd === 'npm' || cmd === 'npx') return { out: '(npm в симуляторе не запускается, команда пропущена)' };
    // служебная команда для подготовки задач: коммит коллеги на сервере
    if (cmd === '@server') {
      const [url, branch, msg, path, content] = a.slice(1); const s = serverRepo(r, url);
      const parent = s.branches[branch] || null; const tree = { ...treeOf(r, parent) }; tree[path] = content;
      s.branches[branch] = commitObj(r, msg, tree, [parent]);
      return { out: '' };
    }
    return { err: cmd + ': команда не найдена (в тренажёре есть git, echo, touch, rm, cat, ls)' };
  }

  function runGit(task, code) {
    const r = newRepo(task);
    for (const line of task.setup || []) { const res = shell(r, tokenize(line)); if (res.err) throw new Error('Ошибка в подготовке задачи «' + line + '»: ' + res.err); }
    const start = describe(r);
    const cmds = splitCommands(code).map(tokenize);
    const log = [], errors = [];
    for (const t of cmds) {
      const res = shell(r, t);
      log.push('$ ' + t.raw + (res.err ? '\n' + res.err : res.out ? '\n' + res.out : ''));
      if (res.err) errors.push('«' + t.raw + '»: ' + res.err.split('\n').pop());
    }
    return { r, cmds, log, errors, start };
  }
  function describe(r) {
    if (!r.inited) return 'Репозитория ещё нет.\nФайлы в папке: ' + (Object.keys(r.work).sort().join(', ') || '(пусто)');
    const s = status(r); const cur = headId(r);
    let o = (r.head.branch !== undefined ? 'Ветка: ' + r.head.branch : 'HEAD отделён') + (r.merging ? ' (идёт слияние)' : '');
    const others = Object.keys(r.branches).filter((b) => b !== r.head.branch);
    const ids = new Set(cur ? ancestors(r, cur) : []);
    for (const b of others) for (const x of ancestors(r, r.branches[b])) ids.add(x);
    for (const b of Object.keys(r.rrefs)) for (const x of ancestors(r, r.rrefs[b])) ids.add(x);
    const list = [...ids].map((x) => r.commits[x]).sort((a, b) => b.seq - a.seq);
    o += '\nКоммиты (новые сверху):' + (list.length ? '\n' + list.map((c) => '  ' + c.id + decorations(r, c.id) + ' ' + c.msg + (c.parents.length > 1 ? '  [слияние]' : '')).join('\n') : ' пока нет');
    o += '\nВ индексе: ' + (s.staged.map((x) => x.path).join(', ') || '—');
    o += '\nИзменено, не в индексе: ' + (s.modified.map((x) => x.path).join(', ') || '—');
    o += '\nНеотслеживаемые: ' + (s.untracked.join(', ') || '—');
    if (r.stash.length) o += '\nСпрятано (stash): ' + r.stash.length;
    if (r.remotes.origin) { const srv = serverRepo(r, r.remotes.origin); o += '\nСервер origin: ' + (Object.keys(srv.branches).map((b) => b + ' → ' + srv.branches[b]).join(', ') || 'пусто'); }
    return o;
  }
  function gitCtx(run) {
    const r = run.r; const s = status(r);
    return {
      r, cmds: run.cmds, raw: run.cmds.map((t) => t.raw).join('\n'),
      inited: r.inited, branch: r.head ? r.head.branch || null : null, branches: Object.keys(r.branches),
      id: (ref) => resolve(r, ref || 'HEAD'),
      log: (ref) => { const id = resolve(r, ref || 'HEAD'); return id ? logList(r, id).map((c) => c.msg) : []; },
      tree: (ref) => treeOf(r, resolve(r, ref || 'HEAD')),
      parents: (ref) => { const id = resolve(r, ref || 'HEAD'); return id ? r.commits[id].parents : []; },
      contains: (ref, inner) => { const a = resolve(r, inner), b = resolve(r, ref); return !!a && !!b && ancestors(r, b).has(a); },
      staged: s.staged.map((x) => x.path), modified: s.modified.map((x) => x.path), untracked: s.untracked,
      clean: !s.staged.length && !s.modified.length, work: r.work, stash: r.stash.length, merging: !!r.merging,
      remote: r.remotes.origin || null, server: (b) => (r.remotes.origin ? serverRepo(r, r.remotes.origin).branches[b] || null : null), upstream: (b) => r.upstream[b] || null,
      used: (re) => run.cmds.some((t) => re.test(t.raw)),
      want(actual, expected, label) { return String(actual) === String(expected) ? true : label + ': сейчас «' + actual + '», нужно «' + expected + '»'; },
    };
  }

  /* ================= JSON ================= */
  function parseJson(text) {
    try { return { value: JSON.parse(text) }; } catch (e) {
      const t = String(text); const bare = t.replace(/"(\\.|[^"\\])*"/g, '""');
      let why;
      if (!t.trim()) why = 'файл пустой';
      else if (/\/\/|\/\*/.test(bare)) why = 'в JSON не бывает комментариев';
      else if (/'/.test(bare)) why = 'ключи и строки пишутся только в двойных кавычках "…"';
      else if (/,\s*[}\]]/.test(bare)) why = 'лишняя запятая перед закрывающей скобкой';
      else if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(bare)) why = 'ключ без кавычек: в JSON ключи всегда в двойных кавычках';
      else if (/:\s*undefined\b/.test(bare)) why = 'значения undefined в JSON нет (есть null)';
      else if (/""\s*\n?\s*""/.test(bare) || /[}\]"\d]\s*\n\s*"/.test(bare)) why = 'между парами или элементами не хватает запятой';
      else why = 'проверь скобки, кавычки и запятые';
      const m = String(e.message).match(/line (\d+)/) || null;
      let line = m ? Number(m[1]) : null;
      if (!line) { const p = String(e.message).match(/position (\d+)/); if (p) line = t.slice(0, Number(p[1])).split('\n').length; }
      return { error: 'JSON не разобран' + (line ? ' (строка ' + line + ')' : '') + ': ' + why + ' [' + String(e.message).slice(0, 110) + ']' };
    }
  }
  const deepEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  };
  const show = (v) => { try { const s = JSON.stringify(v); return s === undefined ? String(v) : s.length > 140 ? s.slice(0, 140) + '…' : s; } catch (e) { return String(v); } };
  const typeName = (v) => (v === null ? 'null' : Array.isArray(v) ? 'массив' : { string: 'строка', number: 'число', boolean: 'true/false', object: 'объект', undefined: 'нет значения' }[typeof v] || typeof v);

  /* ================= Prettier ================= */
  const P_OPTIONS = ['printWidth', 'tabWidth', 'useTabs', 'semi', 'singleQuote', 'quoteProps', 'jsxSingleQuote', 'trailingComma', 'bracketSpacing', 'bracketSameLine', 'arrowParens', 'endOfLine', 'singleAttributePerLine', 'proseWrap', 'htmlWhitespaceSensitivity', 'overrides', 'plugins', 'objectWrap', 'experimentalTernaries', 'experimentalOperatorPosition', 'embeddedLanguageFormatting', 'vueIndentScriptAndStyle', 'requirePragma', 'insertPragma', '$schema'];
  function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  async function pformat(source, parser, options) {
    return prettier.format(source, { ...(options || {}), parser: parser || 'babel', plugins: [prettierPlugins.babel, prettierPlugins.estree, prettierPlugins.postcss] });
  }
  function configProblems(cfg) {
    const out = [];
    if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) return ['конфиг должен быть объектом: { … }'];
    for (const k of Object.keys(cfg)) {
      if (P_OPTIONS.includes(k)) continue;
      const guess = P_OPTIONS.map((o) => [lev(k.toLowerCase(), o.toLowerCase()), o]).sort((a, b) => a[0] - b[0])[0];
      out.push('У Prettier нет настройки «' + k + '»' + (guess[0] <= 3 ? '. Может быть, ' + guess[1] + '?' : ''));
    }
    return out;
  }

  /* ================= общий запуск ================= */
  const want = (actual, expected, label) => (deepEqual(actual, expected) ? true : label + ': сейчас ' + show(actual) + ', нужно ' + show(expected));
  const LABELS = {
    git: ['Команды', 'все команды выполнились без ошибок'], cmd: ['Команды', 'команда разобрана'],
    json: ['Синтаксис', 'JSON разобран без ошибок'], prettierrc: ['Синтаксис', 'конфиг разобран, все настройки существуют'],
    js: ['Код', 'код запустился без ошибок'], text: ['Файл', 'файл не пустой'], ignore: ['Файл', 'правила прочитаны'], pcode: ['Код', 'код разобран без ошибок'],
  };

  async function evaluate(task, code) {
    const kind = task.kind; const hard = []; let c = { code, want, show }; let out = '', ref = null;
    let auto = [];
    if (kind === 'git') {
      const run = runGit(task, code);
      if (!run.cmds.length) hard.push('Команд нет: напиши их по одной на строке');
      hard.push(...run.errors.map((e) => 'Команда завершилась ошибкой: ' + e));
      c = { ...c, ...gitCtx(run) };
      out = (run.log.join('\n') || '(команд пока нет)') + '\n\n── состояние репозитория ──\n' + describe(run.r);
    } else if (kind === 'cmd') {
      const cmds = splitCommands(code).map(tokenize);
      if (!cmds.length) hard.push('Команды нет');
      for (const t of cmds) if (t.unclosed) hard.push('Кавычка не закрыта: ' + t.raw);
      const norm = cmds.map((t) => { let a = t.argv.slice(); const via = a[0] === 'npx' ? 'npx' : a[0] === 'npm' ? 'npm' : ''; if (a[0] === 'npx') { a = a.slice(1); while (a[0] && a[0].startsWith('-')) a = a.slice(1); } return { via, argv: a, all: t.argv, raw: t.raw }; });
      c = { ...c, cmds: norm, first: norm[0] || { via: '', argv: [], all: [], raw: '' } };
      out = norm.map((n) => '$ ' + n.raw + '\nпрограмма: ' + (n.all[0] || '—') + '\nаргументы: ' + (n.all.slice(1).map((x) => '[' + x + ']').join(' ') || '—')).join('\n\n') || '(пусто)';
    } else if (kind === 'json' || kind === 'prettierrc') {
      const p = parseJson(code);
      if (p.error) hard.push(p.error);
      c = { ...c, value: p.value, ok: !p.error, typeName, globMatch };
      if (kind === 'json') out = p.error ? p.error : 'Разобрано. Вот что увидит программа:\n' + JSON.stringify(p.value, null, 2);
      else {
        if (!p.error) hard.push(...configProblems(p.value));
        const target = await pformat(task.source, task.parser, JSON.parse(task.solution));
        ref = target;
        let formatted = null;
        if (!hard.length) { try { formatted = await pformat(task.source, task.parser, p.value); } catch (e) { hard.push('Prettier не принял конфиг: ' + String(e.message).split('\n')[0]); } }
        c = { ...c, formatted, target, config: p.value };
        out = hard.length ? hard.join('\n') : formatted;
        auto = [{ name: 'код после Prettier с твоим конфигом совпадает с образцом', fn: () => (formatted === target ? true : firstDiff(formatted || '', target)) }];
      }
    } else if (kind === 'js') {
      let fn;
      try { fn = new Function(code + '\n;return typeof ' + task.fn + " === 'function' ? " + task.fn + ' : undefined;')(); } catch (e) { hard.push(e.name + ': ' + e.message); }
      if (!hard.length && typeof fn !== 'function') hard.push('Не найдена функция ' + task.fn + '. Не переименовывай её');
      c = { ...c, fn, deepEqual, call: (...a) => fn(...a) };
      if (!hard.length && task.demo) { try { const v = fn(...task.demo.map((x) => JSON.parse(JSON.stringify(x)))); out = task.fn + '(' + task.demo.map(show).join(', ') + ') вернула:\n' + (typeof v === 'string' ? v + '\n(это строка)' : show(v) + '\n(это ' + typeName(v) + ')'); } catch (e) { out = 'Ошибка при вызове: ' + e.message; } } else out = hard.join('\n');
    } else if (kind === 'text') {
      const lines = String(code).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      if (!lines.length) hard.push('Файл пустой');
      c = { ...c, lines, CONVENTIONAL };
      out = lines.length ? 'Строк без комментариев: ' + lines.length + '\n' + lines.map((l, i) => (i + 1) + ': ' + l).join('\n') : '(пусто)';
    } else if (kind === 'ignore') {
      const ign = makeIgnore(code);
      c = { ...c, ignored: ign };
      out = task.files.map((f) => (ign(f.path) ? '🚫 пропускается   ' : '✅ ' + (task.keepWord || 'попадёт в git') + '   ').padEnd(18) + f.path).join('\n');
      const must = task.files.filter((f) => f.ignore), keep = task.files.filter((f) => !f.ignore);
      auto = [
        { name: 'пропускаются: ' + must.map((f) => f.path).join(', '), fn: () => { const bad = must.filter((f) => !ign(f.path)).map((f) => f.path); return bad.length ? 'не пропущены: ' + bad.join(', ') : true; } },
        { name: 'остаются: ' + keep.map((f) => f.path).join(', '), fn: () => { const bad = keep.filter((f) => ign(f.path)).map((f) => f.path); return bad.length ? 'пропущены зря: ' + bad.join(', ') : true; } },
      ];
    } else if (kind === 'pcode') {
      let formatted = null, base = null;
      try { formatted = await pformat(code, task.parser, task.options); } catch (e) { hard.push('Синтаксическая ошибка: ' + String(e.message).split('\n')[0]); }
      base = await pformat(task.starter, task.parser, task.options);
      c = { ...c, formatted, base };
      if (task.showFormatted) out = hard.length ? hard.join('\n') : 'После Prettier файл будет таким:\n' + formatted;
      else out = hard.length ? hard.join('\n') : formatted === code.replace(/\s*$/, '\n') ? 'Prettier ничего бы не изменил: код оформлен по его правилам' : 'Prettier ещё изменил бы этот код. ' + firstDiff(code.replace(/\s*$/, '\n'), formatted, true);
      if (task.auto !== false) auto = [
        { name: 'это тот же код, изменилось только оформление', fn: () => (formatted === base ? true : 'после форматирования твой код отличается от исходного: менять можно только пробелы, переносы, кавычки и точки с запятой') },
        { name: 'Prettier не нашёл бы, что исправить', fn: () => (formatted === code.replace(/\s*$/, '\n') ? true : firstDiff(code.replace(/\s*$/, '\n'), formatted, true)) },
      ];
    }
    return { hard, c, out, ref, auto };
  }
  function firstDiff(a, b, hideAnswer) {
    const la = a.split('\n'), lb = b.split('\n');
    for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) return 'Первое отличие в строке ' + (i + 1) + (hideAnswer ? ': «' + (la[i] === undefined ? '(строки нет)' : la[i]) + '»' : ': сейчас «' + (la[i] === undefined ? '(строки нет)' : la[i]) + '», нужно «' + (lb[i] === undefined ? '(строки нет)' : lb[i]) + '»');
    return 'отличий нет';
  }

  async function runChecks(task, code) {
    const ev = await evaluate(task, code);
    const list = [...ev.auto, ...(task.checks || [])];
    const blocked = ev.hard.length && ['json', 'prettierrc', 'js', 'pcode'].includes(task.kind);
    const results = [];
    for (const chk of list) {
      let ok = false, detail = '';
      if (!blocked) { try { const r = await chk.fn(ev.c); if (r === true) ok = true; else if (typeof r === 'string') detail = r; } catch (e) { detail = String((e && e.message) || e); } }
      results.push({ name: chk.name, ok, detail });
    }
    const [label, okText] = LABELS[task.kind];
    return { hard: ev.hard, soft: [], results, label, okText };
  }
  async function preview(task, code) {
    try {
      const ev = await evaluate(task, code);
      let ref = ev.ref, refTitle = 'Как должно получиться';
      if (task.kind === 'git') { const run = runGit(task, task.solution); ref = describe(run.r); refTitle = 'Состояние после верного решения'; }
      return { out: ev.out, ref, refTitle };
    } catch (e) { return { out: 'Ошибка: ' + ((e && e.message) || e), ref: null }; }
  }
  function given(task) {
    if (task.kind === 'git') return describe(runGit(task, '').r);
    if (task.kind === 'prettierrc') return task.source;
    return task.given || '';
  }

  window.GymEngine = { runChecks, preview, given, _: { makeIgnore, globMatch, tokenize, splitCommands } };
})();
