/* tasks.js — задачи тренажёра «Git и инструменты».
   Поля: id, topic, level (1–5), kind (см. engine.js), file (имя «файла» в редакторе), title, text, example, methods,
   starter, solution, hint, checks: [{ name, fn(c) }] — fn возвращает true или текст ошибки.
   git: setup — команды, которые готовят репозиторий; hooks: { commitMsg: 'conventional' } включает проверку сообщений.
   prettierrc: source и parser — код, который форматируется; образец получается из solution.
   ignore: files: [{ path, ignore }] — проверки строятся сами. pcode: starter — неотформатированный код. */

const BASE = ['git init', 'echo "<h1>Сайт</h1>" > index.html', 'git add .', 'git commit -m "init: start project"'];
const URL = 'https://github.com/student/notes.git';
const SYNC = [...BASE, 'git remote add origin ' + URL, 'git push -u origin main'];
const TEAMMATE = '@server ' + URL + ' main "docs: add readme" README.md "Описание проекта"';
const FEATURE = [...BASE, 'git switch -c feature/search', 'echo "поиск" > search.js', 'git add .', 'git commit -m "feat: add search"', 'git switch main'];

// значение по пути вида 'user.address.city'
const at = (v, path) => path.split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), v);
const key = (path, expected) => (c) => {
  const v = at(c.value, path);
  if (v === undefined) return 'ключа «' + path + '» нет';
  if (c.typeName(v) !== c.typeName(expected)) return '«' + path + '»: сейчас ' + c.typeName(v) + ' ' + c.show(v) + ', нужно ' + c.typeName(expected) + ' ' + c.show(expected);
  return c.want(v, expected, '«' + path + '»');
};
// какие команды lint-staged запустит для файла
const staged = (c, file) => { const cfg = (c.value && c.value['lint-staged']) || {}; return Object.keys(cfg).filter((g) => c.globMatch(g, file)).flatMap((g) => [].concat(cfg[g])); };
const runs = (file, expected) => (c) => { if (!c.value || typeof c.value['lint-staged'] !== 'object') return 'в package.json нет раздела "lint-staged"'; const got = staged(c, file); return got.join(' | ') === expected.join(' | ') ? true : 'для ' + file + ' сейчас запустится: ' + (got.join(', ') || 'ничего') + '; нужно: ' + (expected.join(', ') || 'ничего'); };
const PKG = '{\n  "name": "country-search",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "test": "jest"\n  }\n}';

const TASKS = [
/* ================= GIT ================= */
{ id: 'g01', topic: 'git', level: 1, kind: 'git', file: 'терминал', title: 'Создать репозиторий',
  text: 'Git начинает следить за папкой после одной команды. В папке лежат два файла, но репозитория ещё нет. Создай его.',
  example: '# в любой папке проекта:\ngit init\n\n# в папке появляется скрытая папка .git: в ней git хранит всю историю',
  methods: ['git init'], setup: ['touch index.html', 'touch style.css'],
  starter: '', solution: 'git init', hint: 'Команда из двух слов: git и init.',
  checks: [{ name: 'репозиторий создан', fn: (c) => (c.inited ? true : 'репозитория всё ещё нет') }] },

{ id: 'g02', topic: 'git', level: 1, kind: 'git', file: 'терминал', title: 'Добавить файл в индекс',
  text: 'Перед коммитом файлы кладут в индекс: это список того, что войдёт в следующий коммит. Добавь в индекс только index.html. Файл style.css пока не трогай.',
  example: 'git add README.md\ngit status\n\n# git status показывает, что в индексе, что изменено и за чем git ещё не следит',
  methods: ['git add файл', 'git status'], setup: ['git init', 'touch index.html', 'touch style.css'],
  starter: '', solution: 'git add index.html', hint: 'git add и имя файла через пробел.',
  checks: [
    { name: 'index.html в индексе', fn: (c) => (c.staged.includes('index.html') ? true : 'index.html не в индексе') },
    { name: 'style.css остался неотслеживаемым', fn: (c) => (c.untracked.includes('style.css') ? true : 'style.css тоже попал в индекс, а просили только index.html') },
  ] },

{ id: 'g03', topic: 'git', level: 1, kind: 'git', file: 'терминал', title: 'Добавить всё сразу',
  text: 'Чтобы не перечислять файлы по одному, вместо имени ставят точку: она означает «всё в этой папке». Добавь в индекс все три файла одной командой.',
  example: 'git add .\n\n# точка — это текущая папка со всем содержимым',
  methods: ['git add .'], setup: ['git init', 'touch index.html', 'touch style.css', 'touch app.js'],
  starter: '', solution: 'git add .', hint: 'git add и точка через пробел.',
  checks: [
    { name: 'все три файла в индексе', fn: (c) => c.want(c.staged.join(', '), 'app.js, index.html, style.css', 'в индексе') },
    { name: 'хватило одной команды', fn: (c) => (c.cmds.filter((t) => t.argv[1] === 'add').length === 1 ? true : 'команд git add должно быть одна') },
  ] },

{ id: 'g04', topic: 'git', level: 2, kind: 'git', file: 'терминал', title: 'Первый коммит',
  text: 'Коммит — это снимок проекта с подписью. Добавь все файлы в индекс и сделай коммит с сообщением «init: start project».',
  example: 'git add .\ngit commit -m "docs: add readme"\n\n# -m означает message: сообщение пишут сразу после него в кавычках',
  methods: ['git commit -m "…"'], setup: ['git init', 'touch index.html', 'touch style.css'],
  starter: '', solution: 'git add .\ngit commit -m "init: start project"', hint: 'Две команды: git add . и git commit -m "init: start project".',
  checks: [
    { name: 'в истории один коммит', fn: (c) => c.want(c.log().length, 1, 'коммитов') },
    { name: 'сообщение «init: start project»', fn: (c) => c.want(c.log()[0] || '(нет)', 'init: start project', 'сообщение') },
    { name: 'оба файла вошли в коммит', fn: (c) => (c.clean && !c.untracked.length ? true : 'остались файлы вне коммита: ' + [...c.staged, ...c.modified, ...c.untracked].join(', ')) },
  ] },

{ id: 'g05', topic: 'git', level: 2, kind: 'git', file: 'терминал', title: 'Изменил — закоммитил',
  text: 'Обычный рабочий цикл: изменил файл, добавил в индекс, сделал коммит. Ты дописал шапку в index.html (файл уже изменён). Закоммить это с сообщением «feat: add header».',
  example: 'git status\ngit add style.css\ngit commit -m "feat: add styles"\n\n# изменённый файл не попадает в коммит сам: его каждый раз добавляют заново',
  methods: ['git add', 'git commit -m'], setup: [...BASE, 'echo "<h1>Сайт</h1><header>Шапка</header>" > index.html'],
  starter: '', solution: 'git add index.html\ngit commit -m "feat: add header"', hint: 'git add index.html, потом git commit -m "feat: add header".',
  checks: [
    { name: 'последний коммит «feat: add header»', fn: (c) => c.want(c.log()[0], 'feat: add header', 'сообщение') },
    { name: 'в истории два коммита', fn: (c) => c.want(c.log().length, 2, 'коммитов') },
    { name: 'незакоммиченных изменений не осталось', fn: (c) => (c.clean ? true : 'остались изменения: ' + [...c.staged, ...c.modified].join(', ')) },
  ] },

{ id: 'g06', topic: 'git', level: 2, kind: 'git', file: 'терминал', title: 'Убрать из индекса',
  text: 'Через git add . в индекс попал лишний файл secret.txt. Убери его из индекса, но сам файл не удаляй. app.js должен остаться в индексе.',
  example: 'git restore --staged notes.txt\n\n# --staged: команда работает с индексом, сам файл на диске не меняется',
  methods: ['git restore --staged файл'], setup: [...BASE, 'echo "const a = 1;" > app.js', 'echo "пароль" > secret.txt', 'git add .'],
  starter: '', solution: 'git restore --staged secret.txt', hint: 'git restore --staged secret.txt.',
  checks: [
    { name: 'в индексе только app.js', fn: (c) => c.want(c.staged.join(', '), 'app.js', 'в индексе') },
    { name: 'файл secret.txt остался на диске', fn: (c) => ('secret.txt' in c.work ? true : 'файл secret.txt удалён, а нужно было только убрать его из индекса') },
  ] },

{ id: 'g07', topic: 'git', level: 2, kind: 'git', file: 'терминал', title: 'Отменить правки в файле',
  text: 'Ты испортил index.html и хочешь вернуть его таким, как в последнем коммите. Отмени незакоммиченные правки в этом файле.',
  example: 'git restore style.css\n\n# без --staged команда возвращает сам файл к сохранённому состоянию.\n# правки пропадут насовсем: вернуть их будет нельзя',
  methods: ['git restore файл'], setup: [...BASE, 'echo "сломал" > index.html'],
  starter: '', solution: 'git restore index.html', hint: 'git restore index.html.',
  checks: [
    { name: 'index.html снова как в коммите', fn: (c) => c.want(c.work['index.html'], '<h1>Сайт</h1>', 'содержимое') },
    { name: 'изменённых файлов нет', fn: (c) => (c.clean ? true : 'остались изменения: ' + [...c.staged, ...c.modified].join(', ')) },
    { name: 'новых коммитов не появилось', fn: (c) => c.want(c.log().length, 1, 'коммитов') },
  ] },

{ id: 'g08', topic: 'git', level: 2, kind: 'git', file: 'терминал', title: 'Новая ветка',
  text: 'Ветка — это отдельная линия работы: коммиты в ней не трогают main. Создай ветку feature/search и сразу перейди на неё.',
  example: 'git switch -c feature/login\n\n# -c означает create: создать ветку и перейти на неё.\n# старый вариант той же команды: git checkout -b feature/login',
  methods: ['git switch -c имя'], setup: BASE,
  starter: '', solution: 'git switch -c feature/search', hint: 'git switch -c feature/search.',
  checks: [
    { name: 'ветка feature/search создана', fn: (c) => (c.branches.includes('feature/search') ? true : 'такой ветки нет, сейчас есть: ' + c.branches.join(', ')) },
    { name: 'ты стоишь на ней', fn: (c) => c.want(c.branch, 'feature/search', 'текущая ветка') },
    { name: 'main никуда не делась', fn: (c) => (c.branches.includes('main') ? true : 'ветка main пропала') },
  ] },

{ id: 'g09', topic: 'git', level: 3, kind: 'git', file: 'терминал', title: 'Коммит в своей ветке',
  text: 'В папке появился новый файл footer.html. Сделай для него ветку feature/footer и закоммить файл в ней с сообщением «feat: add footer». В main этот коммит попасть не должен.',
  example: 'git switch -c feature/menu\ngit add menu.html\ngit commit -m "feat: add menu"\n\n# коммит попадает в ту ветку, на которой ты стоишь',
  methods: ['git switch -c', 'git add', 'git commit -m'], setup: [...BASE, 'echo "<footer>Низ</footer>" > footer.html'],
  starter: '', solution: 'git switch -c feature/footer\ngit add footer.html\ngit commit -m "feat: add footer"', hint: 'Сначала ветка (git switch -c feature/footer), потом add и commit.',
  checks: [
    { name: 'ты на ветке feature/footer', fn: (c) => c.want(c.branch, 'feature/footer', 'текущая ветка') },
    { name: 'последний коммит ветки «feat: add footer»', fn: (c) => c.want(c.log()[0], 'feat: add footer', 'сообщение') },
    { name: 'footer.html есть в ветке', fn: (c) => ('footer.html' in c.tree() ? true : 'footer.html не закоммичен') },
    { name: 'в main его нет', fn: (c) => ('footer.html' in c.tree('main') ? 'footer.html попал в main: коммит сделан не в той ветке' : true) },
  ] },

{ id: 'g10', topic: 'git', level: 3, kind: 'git', file: 'терминал', title: 'Влить ветку',
  text: 'Работа в ветке feature/search закончена, в ней один новый коммит. Ты стоишь на main. Влей feature/search в main.',
  example: 'git switch main\ngit merge feature/login\n\n# вливают В ту ветку, на которой стоят.\n# если в main не было своих новых коммитов, git просто передвинет её вперёд (fast-forward)',
  methods: ['git merge ветка'], setup: FEATURE,
  starter: '', solution: 'git merge feature/search', hint: 'Ты уже на main: git merge feature/search.',
  checks: [
    { name: 'ты на main', fn: (c) => c.want(c.branch, 'main', 'текущая ветка') },
    { name: 'в main появился коммит «feat: add search»', fn: (c) => (c.log('main').includes('feat: add search') ? true : 'в main этого коммита нет') },
    { name: 'файл search.js есть в main', fn: (c) => ('search.js' in c.tree('main') ? true : 'search.js в main не появился') },
  ] },

{ id: 'g11', topic: 'git', level: 3, kind: 'git', file: 'терминал', title: 'Удалить слитую ветку',
  text: 'Ветка feature/search уже влита в main и больше не нужна. Удали её.',
  example: 'git branch -d feature/login\n\n# -d удаляет только слитую ветку. Коммиты при этом остаются в main',
  methods: ['git branch -d имя'], setup: [...FEATURE, 'git merge feature/search'],
  starter: '', solution: 'git branch -d feature/search', hint: 'git branch -d feature/search.',
  checks: [
    { name: 'ветки feature/search больше нет', fn: (c) => (c.branches.includes('feature/search') ? 'ветка ещё есть' : true) },
    { name: 'её работа осталась в main', fn: (c) => ('search.js' in c.tree('main') ? true : 'search.js из main пропал') },
  ] },

{ id: 'g12', topic: 'git', level: 3, kind: 'ignore', file: '.gitignore', title: '.gitignore',
  text: 'В файле .gitignore перечисляют то, за чем git следить не должен: по одному правилу на строке. Напиши правила, чтобы git пропускал папки node_modules и dist и файл .env. Остальные файлы должны остаться.',
  example: '# папка со сборкой\nbuild/\n# личные настройки редактора\n.idea/\nsecrets.txt\n\n# слеш в конце означает «папка». Строки с # — комментарии',
  methods: ['папка/', 'имя файла'],
  files: [{ path: 'node_modules/react/index.js', ignore: true }, { path: 'dist/bundle.js', ignore: true }, { path: '.env', ignore: true }, { path: 'src/index.ts', ignore: false }, { path: 'package.json', ignore: false }, { path: '.env.example', ignore: false }],
  starter: '', solution: 'node_modules/\ndist/\n.env', hint: 'Три строки: node_modules/, dist/ и .env.' },

{ id: 'g13', topic: 'git', level: 3, kind: 'ignore', file: '.gitignore', title: 'Шаблоны в .gitignore',
  text: 'Звёздочка в правиле означает «любые символы». Напиши правила, чтобы git пропускал все файлы с расширением .log в любой папке и файлы .DS_Store в любой папке.',
  example: '*.tmp\nThumbs.db\n\n# *.tmp — любой файл, имя которого кончается на .tmp.\n# правило без слеша действует во всех папках проекта',
  methods: ['*.расширение'],
  files: [{ path: 'npm-debug.log', ignore: true }, { path: 'logs/server.log', ignore: true }, { path: '.DS_Store', ignore: true }, { path: 'src/.DS_Store', ignore: true }, { path: 'changelog.md', ignore: false }, { path: 'src/logger.ts', ignore: false }],
  starter: '', solution: '*.log\n.DS_Store', hint: 'Две строки: *.log и .DS_Store.' },

{ id: 'g14', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Слияние с коммитом',
  text: 'Пока ты работал в feature/search, в main тоже появился новый коммит. Ты стоишь на feature/search. Перейди на main и влей в неё feature/search. Раз ветки разошлись, git создаст отдельный коммит слияния.',
  example: 'git switch main\ngit merge feature/login\n\n# у коммита слияния два родителя: по одному из каждой ветки',
  methods: ['git switch', 'git merge'],
  setup: [...BASE, 'git switch -c feature/search', 'echo "поиск" > search.js', 'git add .', 'git commit -m "feat: add search"', 'git switch main', 'echo "стили" > style.css', 'git add .', 'git commit -m "feat: add styles"', 'git switch feature/search'],
  starter: '', solution: 'git switch main\ngit merge feature/search', hint: 'Сначала git switch main, потом git merge feature/search.',
  checks: [
    { name: 'ты на main', fn: (c) => c.want(c.branch, 'main', 'текущая ветка') },
    { name: 'в main есть и search.js, и style.css', fn: (c) => ('search.js' in c.tree('main') && 'style.css' in c.tree('main') ? true : 'в main сейчас: ' + Object.keys(c.tree('main')).join(', ')) },
    { name: 'последний коммит main — слияние (два родителя)', fn: (c) => c.want(c.parents('main').length, 2, 'родителей у последнего коммита') },
  ] },

{ id: 'g15', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Исправить сообщение коммита',
  text: 'В последнем коммите опечатка: «fex: add form». Он ещё не отправлен на сервер. Исправь сообщение на «fix: add form», не создавая второй коммит.',
  example: 'git commit --amend -m "feat: add menu"\n\n# --amend заменяет последний коммит новым.\n# так делают только с коммитами, которые ещё не отправлены на сервер',
  methods: ['git commit --amend -m "…"'], setup: [...BASE, 'echo "форма" > form.js', 'git add .', 'git commit -m "fex: add form"'],
  starter: '', solution: 'git commit --amend -m "fix: add form"', hint: 'git commit --amend -m "fix: add form".',
  checks: [
    { name: 'последний коммит «fix: add form»', fn: (c) => c.want(c.log()[0], 'fix: add form', 'сообщение') },
    { name: 'коммитов по-прежнему два', fn: (c) => c.want(c.log().length, 2, 'коммитов') },
  ] },

{ id: 'g16', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Забыл файл',
  text: 'Ты сделал коммит «feat: add form», но забыл добавить в него utils.js. Добавь файл в последний коммит. Сообщение менять не нужно.',
  example: 'git add logo.svg\ngit commit --amend --no-edit\n\n# --no-edit: оставить сообщение прежним',
  methods: ['git commit --amend --no-edit'], setup: [...BASE, 'echo "a" > form.js', 'echo "b" > utils.js', 'git add form.js', 'git commit -m "feat: add form"'],
  starter: '', solution: 'git add utils.js\ngit commit --amend --no-edit', hint: 'git add utils.js, потом git commit --amend --no-edit.',
  checks: [
    { name: 'utils.js вошёл в последний коммит', fn: (c) => ('utils.js' in c.tree() ? true : 'utils.js в коммите нет') },
    { name: 'сообщение прежнее', fn: (c) => c.want(c.log()[0], 'feat: add form', 'сообщение') },
    { name: 'коммитов по-прежнему два', fn: (c) => c.want(c.log().length, 2, 'коммитов') },
  ] },

{ id: 'g17', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Отменить последний коммит',
  text: 'Последний коммит «feat: add draft» сделан рано, на сервер он не отправлен. Отмени его так, чтобы файл draft.js остался в индексе и работу можно было продолжить.',
  example: 'git reset --soft HEAD~1\n\n# HEAD~1 — коммит перед последним.\n# --soft убирает коммит, но оставляет его изменения в индексе.\n# --hard стёр бы и изменения тоже',
  methods: ['git reset --soft HEAD~1'], setup: [...BASE, 'echo "черновик" > draft.js', 'git add .', 'git commit -m "feat: add draft"'],
  starter: '', solution: 'git reset --soft HEAD~1', hint: 'git reset --soft HEAD~1.',
  checks: [
    { name: 'коммит убран из истории', fn: (c) => c.want(c.log().join(' | '), 'init: start project', 'история') },
    { name: 'draft.js остался на диске', fn: (c) => ('draft.js' in c.work ? true : 'файл draft.js пропал: похоже, использован --hard') },
    { name: 'draft.js остался в индексе', fn: (c) => (c.staged.includes('draft.js') ? true : 'draft.js не в индексе: нужен вариант --soft') },
  ] },

{ id: 'g18', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Отменить отправленный коммит',
  text: 'Коммит «feat: change title» сломал заголовок, и он уже на сервере. Переписывать историю нельзя: её видят другие. Отмени изменения этого коммита новым коммитом.',
  example: 'git revert HEAD\n\n# revert не удаляет коммит, а создаёт новый с обратными изменениями.\n# история остаётся честной: видно и ошибку, и её отмену',
  methods: ['git revert HEAD'], setup: [...BASE, 'echo "<h1>Сломано</h1>" > index.html', 'git commit -am "feat: change title"'],
  starter: '', solution: 'git revert HEAD', hint: 'git revert HEAD.',
  checks: [
    { name: 'index.html снова прежний', fn: (c) => c.want(c.tree()['index.html'], '<h1>Сайт</h1>', 'содержимое в последнем коммите') },
    { name: 'старый коммит остался в истории', fn: (c) => (c.log().includes('feat: change title') ? true : 'коммит «feat: change title» исчез из истории: её нельзя было переписывать') },
    { name: 'появился третий коммит', fn: (c) => c.want(c.log().length, 3, 'коммитов') },
  ] },

{ id: 'g19', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Спрятать незаконченное',
  text: 'Ты в ветке feature/form, файл form.js изменён, но коммитить его рано. Нужно срочно перейти на main. Спрячь изменения и перейди на main, не делая коммит.',
  example: 'git stash\ngit switch main\n\n# stash убирает незакоммиченные правки в «карман», рабочая папка становится чистой',
  methods: ['git stash', 'git switch'],
  setup: [...BASE, 'git switch -c feature/form', 'echo "форма" > form.js', 'git add .', 'git commit -m "feat: add form"', 'echo "форма, не готово" > form.js'],
  starter: '', solution: 'git stash\ngit switch main', hint: 'git stash, потом git switch main.',
  checks: [
    { name: 'ты на main', fn: (c) => c.want(c.branch, 'main', 'текущая ветка') },
    { name: 'изменения лежат в stash', fn: (c) => c.want(c.stash, 1, 'записей в stash') },
    { name: 'новых коммитов в feature/form нет', fn: (c) => c.want(c.log('feature/form').length, 2, 'коммитов в feature/form') },
  ] },

{ id: 'g20', topic: 'git', level: 4, kind: 'git', file: 'терминал', title: 'Достать спрятанное',
  text: 'Ты вернулся в ветку feature/form. Незаконченные правки form.js лежат в stash. Верни их в рабочую папку.',
  example: 'git stash pop\n\n# pop возвращает последние спрятанные правки и убирает их из stash',
  methods: ['git stash pop'],
  setup: [...BASE, 'git switch -c feature/form', 'echo "форма" > form.js', 'git add .', 'git commit -m "feat: add form"', 'echo "форма, не готово" > form.js', 'git stash', 'git switch main', 'git switch feature/form'],
  starter: '', solution: 'git stash pop', hint: 'git stash pop.',
  checks: [
    { name: 'правки вернулись в form.js', fn: (c) => c.want(c.work['form.js'], 'форма, не готово', 'содержимое form.js') },
    { name: 'stash пуст', fn: (c) => c.want(c.stash, 0, 'записей в stash') },
  ] },

{ id: 'g21', topic: 'git', level: 5, kind: 'git', file: 'терминал', title: 'Перестать следить за файлом',
  text: 'Файл .env с ключами по ошибке попал в первый коммит. Ты уже создал .gitignore со строкой .env, но этого мало: за файлом, который уже в репозитории, git следит дальше. Убери .env из репозитория, оставив сам файл на диске, и закоммить это вместе с .gitignore. Сообщение: «chore: stop tracking .env».',
  example: 'git rm --cached notes.txt\ngit add .gitignore\ngit commit -m "chore: stop tracking notes"\n\n# --cached: убрать файл только из git, на диске он останется',
  methods: ['git rm --cached файл'],
  setup: ['git init', 'echo "KEY=123" > .env', 'echo "код" > app.js', 'git add .', 'git commit -m "init: start project"', 'echo ".env" > .gitignore'],
  starter: '', solution: 'git rm --cached .env\ngit add .gitignore\ngit commit -m "chore: stop tracking .env"', hint: 'git rm --cached .env, потом git add .gitignore и коммит.',
  checks: [
    { name: 'в последнем коммите нет .env', fn: (c) => ('.env' in c.tree() ? '.env всё ещё в репозитории' : true) },
    { name: 'сам файл .env остался на диске', fn: (c) => ('.env' in c.work ? true : 'файл .env удалён с диска: нужен ключ --cached') },
    { name: '.gitignore закоммичен', fn: (c) => ('.gitignore' in c.tree() ? true : '.gitignore не в коммите') },
    { name: 'сообщение «chore: stop tracking .env»', fn: (c) => c.want(c.log()[0], 'chore: stop tracking .env', 'сообщение') },
  ] },

{ id: 'g22', topic: 'git', level: 5, kind: 'git', file: 'терминал', title: 'Конфликт слияния',
  text: 'Файл title.txt изменили в двух ветках по-разному: в main там «Поиск стран», в feature/title — «Country Search». Влей feature/title в main. Git сообщит о конфликте. Оставь в файле вариант «Country Search» (перезапиши файл через echo), добавь его в индекс и заверши слияние коммитом «merge: resolve title conflict».',
  example: 'git merge feature/colors\n# CONFLICT в theme.txt\necho "dark" > theme.txt\ngit add theme.txt\ngit commit -m "merge: resolve theme conflict"\n\n# в настоящем проекте файл правят в редакторе: убирают строки <<<<<<<, =======, >>>>>>> и оставляют нужный вариант',
  methods: ['git merge', 'echo "…" > файл', 'git add', 'git commit'],
  setup: [...BASE, 'echo "Мой сайт" > title.txt', 'git add .', 'git commit -m "feat: add title"', 'git switch -c feature/title', 'echo "Country Search" > title.txt', 'git commit -am "feat: rename title"', 'git switch main', 'echo "Поиск стран" > title.txt', 'git commit -am "feat: translate title"'],
  starter: '', solution: 'git merge feature/title\necho "Country Search" > title.txt\ngit add title.txt\ngit commit -m "merge: resolve title conflict"', hint: 'Четыре шага: git merge feature/title; echo "Country Search" > title.txt; git add title.txt; git commit -m "merge: resolve title conflict".',
  checks: [
    { name: 'слияние завершено', fn: (c) => (c.merging ? 'слияние ещё не закончено: нужен git add и git commit' : c.want(c.parents('main').length, 2, 'родителей у последнего коммита main')) },
    { name: 'в title.txt осталось «Country Search»', fn: (c) => c.want(c.tree('main')['title.txt'], 'Country Search', 'содержимое title.txt') },
    { name: 'сообщение «merge: resolve title conflict»', fn: (c) => c.want(c.log('main')[0], 'merge: resolve title conflict', 'сообщение') },
  ] },

/* ================= GITHUB ================= */
{ id: 'h01', topic: 'hub', level: 1, kind: 'git', file: 'терминал', title: 'Привязать репозиторий к GitHub',
  text: 'Локальный репозиторий ничего не знает о GitHub, пока ему не дали адрес. Ты создал на GitHub пустой репозиторий ' + URL + '. Запиши этот адрес под именем origin.',
  example: 'git remote add origin https://github.com/user/blog.git\ngit remote -v\n\n# origin — принятое имя для «главного» адреса на сервере',
  methods: ['git remote add origin адрес'], setup: BASE,
  starter: '', solution: 'git remote add origin ' + URL, hint: 'git remote add origin и адрес из условия.',
  checks: [{ name: 'адрес origin записан верно', fn: (c) => c.want(c.remote || '(нет)', URL, 'адрес origin') }] },

{ id: 'h02', topic: 'hub', level: 2, kind: 'git', file: 'терминал', title: 'Первая отправка',
  text: 'Адрес origin уже записан, но на сервере пусто. Отправь ветку main на GitHub и свяжи её с серверной веткой, чтобы дальше хватало короткого git push.',
  example: 'git push -u origin develop\n\n# -u связывает твою ветку с веткой на сервере.\n# это нужно один раз, при первой отправке ветки',
  methods: ['git push -u origin ветка'], setup: [...BASE, 'git remote add origin ' + URL],
  starter: '', solution: 'git push -u origin main', hint: 'git push -u origin main.',
  checks: [
    { name: 'коммиты main есть на сервере', fn: (c) => (c.server('main') && c.server('main') === c.id('main') ? true : 'на сервере ветки main нет или она отстаёт') },
    { name: 'main связана с origin/main', fn: (c) => c.want(c.upstream('main') || '(не связана)', 'origin/main', 'связь') },
  ] },

{ id: 'h03', topic: 'hub', level: 2, kind: 'git', file: 'терминал', title: 'Получить чужие коммиты',
  text: 'Коллега отправил на сервер коммит «docs: add readme». У тебя его ещё нет. Забери новые коммиты с сервера в свою ветку main.',
  example: 'git pull\n\n# pull скачивает новые коммиты с сервера и сразу вливает их в твою ветку',
  methods: ['git pull'], setup: [...SYNC, TEAMMATE],
  starter: '', solution: 'git pull', hint: 'Одна команда: git pull.',
  checks: [
    { name: 'коммит коллеги есть в твоей main', fn: (c) => (c.log('main').includes('docs: add readme') ? true : 'коммита «docs: add readme» у тебя нет') },
    { name: 'файл README.md появился в папке', fn: (c) => ('README.md' in c.work ? true : 'README.md в папке нет') },
  ] },

{ id: 'h04', topic: 'hub', level: 2, kind: 'git', file: 'терминал', title: 'Клонировать репозиторий',
  text: 'Чтобы получить копию чужого репозитория вместе со всей историей, его клонируют. Склонируй репозиторий https://github.com/rolling-scopes-school/tasks.git.',
  example: 'git clone https://github.com/user/blog.git\n\n# clone сам создаёт папку, скачивает историю и записывает адрес origin',
  methods: ['git clone адрес'], setup: ['@server https://github.com/rolling-scopes-school/tasks.git main "docs: add tasks" README.md "Задания"'],
  starter: '', solution: 'git clone https://github.com/rolling-scopes-school/tasks.git', hint: 'git clone и адрес из условия.',
  checks: [
    { name: 'репозиторий склонирован', fn: (c) => (c.inited && c.log().includes('docs: add tasks') ? true : 'истории с сервера у тебя нет') },
    { name: 'адрес origin записан сам', fn: (c) => c.want(c.remote || '(нет)', 'https://github.com/rolling-scopes-school/tasks.git', 'адрес origin') },
  ] },

{ id: 'h05', topic: 'hub', level: 3, kind: 'git', file: 'терминал', title: 'Отправить свою ветку',
  text: 'Ты сделал коммит в новой ветке feature/search. На сервере этой ветки ещё нет. Отправь её на GitHub и свяжи с серверной веткой. После этого на сайте GitHub можно открыть Pull Request.',
  example: 'git push -u origin feature/login\n\n# новая ветка на сервере появляется после первой отправки',
  methods: ['git push -u origin ветка'], setup: [...SYNC, 'git switch -c feature/search', 'echo "поиск" > search.js', 'git add .', 'git commit -m "feat: add search"'],
  starter: '', solution: 'git push -u origin feature/search', hint: 'git push -u origin feature/search.',
  checks: [
    { name: 'ветка feature/search есть на сервере', fn: (c) => (c.server('feature/search') === c.id('feature/search') ? true : 'на сервере ветки нет или она отстаёт') },
    { name: 'ветка связана с origin/feature/search', fn: (c) => c.want(c.upstream('feature/search') || '(не связана)', 'origin/feature/search', 'связь') },
    { name: 'main на сервере не изменилась', fn: (c) => (c.server('main') === c.id('main') ? true : 'main на сервере изменилась: коммит отправлен не в ту ветку') },
  ] },

{ id: 'h06', topic: 'hub', level: 3, kind: 'text', file: 'сообщение коммита', title: 'Сообщение коммита по правилам',
  text: 'В RS School сообщения коммитов пишут по соглашению: тип, двоеточие, пробел, короткое описание на английском. Описание начинается с маленькой буквы, глагол в настоящем времени (add, а не added), точки в конце нет. Ты добавил на страницу поле поиска. Напиши сообщение для этого коммита.',
  example: 'fix: correct button color\n\n# частые типы: feat (новая возможность), fix (исправление ошибки),\n# docs (документация), style (оформление кода), refactor, test, chore, init',
  methods: ['feat: …'],
  starter: '', solution: 'feat: add search input', hint: 'Новая возможность — это тип feat. Например: feat: add search input.',
  checks: [
    { name: 'сообщение в одну строку', fn: (c) => c.want(c.lines.length, 1, 'строк') },
    { name: 'формат «тип: описание»', fn: (c) => (c.CONVENTIONAL.test(c.lines[0] || '') ? true : 'не подходит под «тип: описание». Проверь тип, двоеточие и пробел после него') },
    { name: 'тип feat: это новая возможность', fn: (c) => (/^feat(\(.+\))?:/.test(c.lines[0] || '') ? true : 'поле поиска — новая возможность, для неё тип feat') },
    { name: 'описание на английском с маленькой буквы', fn: (c) => (/^[a-z]+(\(.+\))?: [a-z][\x20-\x7e]*$/.test(c.lines[0] || '') ? true : 'после двоеточия нужна маленькая английская буква, дальше только английский текст') },
    { name: 'глагол в настоящем времени, без точки в конце', fn: (c) => { const d = (c.lines[0] || '').split(': ')[1] || ''; if (/\.$/.test(d)) return 'в конце стоит точка'; return /^\w+(ed|ing)\b/.test(d) ? 'первое слово похоже на прошедшее время или форму на -ing: пиши add, fix, update' : true; } },
  ] },

{ id: 'h07', topic: 'hub', level: 3, kind: 'git', file: 'терминал', title: 'Только посмотреть, что нового',
  text: 'Иногда нужно узнать, что появилось на сервере, но свою ветку пока не менять. Коллега отправил новый коммит. Скачай сведения о нём так, чтобы твоя main осталась на месте.',
  example: 'git fetch\ngit log origin/main\n\n# fetch только скачивает. pull — это fetch и merge вместе',
  methods: ['git fetch'], setup: [...SYNC, TEAMMATE],
  starter: '', solution: 'git fetch', hint: 'git fetch.',
  checks: [
    { name: 'origin/main показывает новый коммит', fn: (c) => (c.id('origin/main') === c.server('main') ? true : 'origin/main не обновилась') },
    { name: 'твоя main не сдвинулась', fn: (c) => (c.log('main').includes('docs: add readme') ? 'в твоей main уже есть коммит коллеги: это сделал pull, а нужен fetch' : true) },
  ] },

{ id: 'h08', topic: 'hub', level: 4, kind: 'git', file: 'терминал', title: 'Сервер не принял отправку',
  text: 'Ты сделал коммит «feat: add styles» в main. Тем временем коллега отправил на сервер свой коммит. Если сейчас выполнить git push, сервер откажет: у тебя нет его коммита. Сначала забери изменения, потом отправь свои. В итоге на сервере должны быть оба коммита.',
  example: 'git pull\ngit push\n\n# git push --force «решил бы» проблему, стерев чужой коммит. Так не делают',
  methods: ['git pull', 'git push'], setup: [...SYNC, TEAMMATE, 'echo "стили" > style.css', 'git add .', 'git commit -m "feat: add styles"'],
  starter: '', solution: 'git pull\ngit push', hint: 'Две команды по порядку: git pull, потом git push.',
  checks: [
    { name: 'на сервере есть твой коммит', fn: (c) => (c.server('main') && c.contains('origin/main', 'main') && c.server('main') === c.id('main') ? true : 'сервер отстаёт от твоей main: отправка не прошла') },
    { name: 'коммит коллеги не потерян', fn: (c) => ('README.md' in c.tree('main') ? true : 'README.md коллеги пропал') },
    { name: 'твой файл тоже на месте', fn: (c) => ('style.css' in c.tree('main') ? true : 'style.css пропал') },
  ] },

{ id: 'h09', topic: 'hub', level: 4, kind: 'git', file: 'терминал', title: 'Проверка сообщения при коммите',
  text: 'В этом репозитории настроена проверка: коммит с сообщением не по правилам не создаётся. Ты исправил опечатку в заголовке, изменения уже в индексе. Сделай коммит с подходящим типом и английским описанием.',
  example: 'git commit -m "fix: remove extra margin"\n\n# сообщение «исправил отступ» проверка не пропустит: нет типа',
  methods: ['git commit -m "fix: …"'], hooks: { commitMsg: 'conventional' },
  setup: [...BASE, 'echo "<h1>Сайт стран</h1>" > index.html', 'git add .'],
  starter: '', solution: 'git commit -m "fix: correct page title"', hint: 'Исправление ошибки — тип fix. Например: git commit -m "fix: correct page title".',
  checks: [
    { name: 'коммит создан', fn: (c) => c.want(c.log().length, 2, 'коммитов') },
    { name: 'тип fix: это исправление ошибки', fn: (c) => (/^fix(\(.+\))?: /.test(c.log()[0]) ? true : 'сообщение «' + c.log()[0] + '»: для исправления опечатки нужен тип fix') },
    { name: 'проверка не отключена', fn: (c) => (c.used(/--no-verify|\s-n(\s|$)/) ? 'ключ --no-verify отключает проверку: так её обходить не нужно' : true) },
  ] },

{ id: 'h10', topic: 'hub', level: 5, kind: 'git', file: 'терминал', title: 'Весь путь до Pull Request',
  text: 'Так сдают задания RS School: работа идёт в отдельной ветке, потом ветку отправляют на GitHub и открывают Pull Request в main. В папке лежит новый файл search.js. Создай ветку country-search, закоммить в ней файл (тип feat, сообщения здесь проверяются) и отправь ветку на сервер со связью. В main ничего попасть не должно.',
  example: 'git switch -c memory-game\ngit add .\ngit commit -m "feat: add game board"\ngit push -u origin memory-game\n\n# дальше на сайте GitHub: Compare & pull request → base: main ← compare: memory-game',
  methods: ['git switch -c', 'git add', 'git commit -m', 'git push -u origin'], hooks: { commitMsg: 'conventional' },
  setup: [...SYNC, 'echo "форма поиска" > search.js'],
  starter: '', solution: 'git switch -c country-search\ngit add search.js\ngit commit -m "feat: add search form"\ngit push -u origin country-search', hint: 'Четыре команды: switch -c country-search, add, commit -m "feat: …", push -u origin country-search.',
  checks: [
    { name: 'ты на ветке country-search', fn: (c) => c.want(c.branch, 'country-search', 'текущая ветка') },
    { name: 'search.js закоммичен с типом feat', fn: (c) => (!('search.js' in c.tree()) ? 'search.js не в коммите' : /^feat(\(.+\))?: /.test(c.log()[0]) ? true : 'сообщение «' + c.log()[0] + '»: нужен тип feat') },
    { name: 'ветка отправлена на сервер', fn: (c) => (c.server('country-search') && c.server('country-search') === c.id('country-search') ? true : 'на сервере ветки country-search нет или она отстаёт') },
    { name: 'ветка связана с сервером', fn: (c) => c.want(c.upstream('country-search') || '(не связана)', 'origin/country-search', 'связь') },
    { name: 'main не тронута', fn: (c) => ('search.js' in c.tree('main') || c.server('main') !== c.id('main') ? 'в main появились изменения: вся работа должна быть в ветке' : true) },
  ] },

/* ================= JSON ================= */
{ id: 'n01', topic: 'json', level: 1, kind: 'json', file: 'data.json', title: 'Первый объект',
  text: 'JSON — это текст для обмена данными. Объект пишется в фигурных скобках, ключи и строки — в двойных кавычках, пары разделяются запятой. Напиши объект: ключ title со строкой «Country Search» и ключ year с числом 2026.',
  example: '{\n  "name": "Аня",\n  "age": 20\n}\n\nчисла пишутся без кавычек, после последней пары запятой нет',
  methods: ['{ "ключ": значение }'],
  starter: '{\n\n}', solution: '{\n  "title": "Country Search",\n  "year": 2026\n}', hint: 'Две строки внутри скобок: "title": "Country Search", и "year": 2026.',
  checks: [{ name: 'title — строка «Country Search»', fn: key('title', 'Country Search') }, { name: 'year — число 2026', fn: key('year', 2026) }] },

{ id: 'n02', topic: 'json', level: 1, kind: 'json', file: 'data.json', title: 'Да, нет и пусто',
  text: 'Кроме строк и чисел в JSON есть true, false и null. Они пишутся без кавычек. Напиши объект: title — «Сдать задание», done — false, mentor — null.',
  example: '{\n  "city": "Берлин",\n  "capital": true,\n  "mayor": null\n}\n\nnull означает «значения нет»',
  methods: ['true', 'false', 'null'],
  starter: '{\n\n}', solution: '{\n  "title": "Сдать задание",\n  "done": false,\n  "mentor": null\n}', hint: 'false и null пишутся без кавычек.',
  checks: [{ name: 'title — строка', fn: key('title', 'Сдать задание') }, { name: 'done — false', fn: key('done', false) }, { name: 'mentor — null', fn: key('mentor', null) }] },

{ id: 'n03', topic: 'json', level: 1, kind: 'json', file: 'data.json', title: 'Массив',
  text: 'Список значений пишется в квадратных скобках через запятую. Напиши объект с ключом skills: массив из строк html, css, js (в таком порядке).',
  example: '{\n  "days": ["пн", "ср", "пт"]\n}',
  methods: ['[ … ]'],
  starter: '{\n\n}', solution: '{\n  "skills": ["html", "css", "js"]\n}', hint: '"skills": ["html", "css", "js"].',
  checks: [{ name: 'skills — массив из трёх строк по порядку', fn: key('skills', ['html', 'css', 'js']) }] },

{ id: 'n04', topic: 'json', level: 2, kind: 'json', file: 'data.json', title: 'Объект в объекте',
  text: 'Значением может быть другой объект. Напиши: ключ user — объект с ключом name («Аня») и ключом address. address — тоже объект с ключом city («Берлин»).',
  example: '{\n  "book": {\n    "title": "JS",\n    "author": {\n      "name": "Кайл"\n    }\n  }\n}',
  methods: ['вложенные { }'],
  starter: '{\n  "user": {\n\n  }\n}', solution: '{\n  "user": {\n    "name": "Аня",\n    "address": {\n      "city": "Берлин"\n    }\n  }\n}', hint: 'Внутри user две пары: "name": "Аня" и "address": { "city": "Берлин" }.',
  checks: [{ name: 'user.name — «Аня»', fn: key('user.name', 'Аня') }, { name: 'user.address.city — «Берлин»', fn: key('user.address.city', 'Берлин') }] },

{ id: 'n05', topic: 'json', level: 2, kind: 'json', file: 'data.json', title: 'Массив объектов',
  text: 'Так обычно выглядят данные с сервера: массив одинаковых объектов. Напиши массив из двух объектов. У первого id 1 и title «HTML», у второго id 2 и title «CSS». Корень файла — сам массив.',
  example: '[\n  { "code": "DE", "name": "Германия" },\n  { "code": "ES", "name": "Испания" }\n]',
  methods: ['[ { … }, { … } ]'],
  starter: '[\n\n]', solution: '[\n  { "id": 1, "title": "HTML" },\n  { "id": 2, "title": "CSS" }\n]', hint: 'Два объекта через запятую внутри квадратных скобок.',
  checks: [
    { name: 'в корне массив из двух элементов', fn: (c) => (Array.isArray(c.value) ? c.want(c.value.length, 2, 'элементов') : 'в корне должен быть массив, сейчас ' + c.typeName(c.value)) },
    { name: 'первый: id 1, title «HTML»', fn: (c) => c.want(c.value[0], { id: 1, title: 'HTML' }, 'первый элемент') },
    { name: 'второй: id 2, title «CSS»', fn: (c) => c.want(c.value[1], { id: 2, title: 'CSS' }, 'второй элемент') },
  ] },

{ id: 'n06', topic: 'json', level: 2, kind: 'json', file: 'data.json', title: 'Почини кавычки',
  text: 'Этот текст похож на объект из JS, но JSON строже: ключи всегда в двойных кавычках, строки тоже только в двойных. Исправь файл, не меняя данные.',
  example: 'было (так нельзя):\n{ city: \'Минск\' }\n\nстало:\n{ "city": "Минск" }',
  methods: ['"ключ"', '"строка"'],
  starter: "{\n  name: 'Country Search',\n  'version': '1.0.0'\n}", solution: '{\n  "name": "Country Search",\n  "version": "1.0.0"\n}', hint: 'Замени все одинарные кавычки на двойные и возьми name в двойные кавычки.',
  checks: [{ name: 'name — «Country Search»', fn: key('name', 'Country Search') }, { name: 'version — «1.0.0»', fn: key('version', '1.0.0') }] },

{ id: 'n07', topic: 'json', level: 3, kind: 'json', file: 'data.json', title: 'Почини запятые',
  text: 'В JSON нельзя ставить запятую после последнего элемента и нельзя писать комментарии. Исправь файл, не меняя данные.',
  example: 'было (так нельзя):\n{\n  // цвета\n  "colors": ["red", "blue",],\n}\n\nстало:\n{\n  "colors": ["red", "blue"]\n}',
  methods: ['без запятой в конце', 'без комментариев'],
  starter: '{\n  // список стран\n  "countries": ["Германия", "Испания",],\n  "total": 2,\n}', solution: '{\n  "countries": ["Германия", "Испания"],\n  "total": 2\n}', hint: 'Убери строку с комментарием и две лишние запятые: после «Испания» и после 2.',
  checks: [{ name: 'countries — массив из двух стран', fn: key('countries', ['Германия', 'Испания']) }, { name: 'total — число 2', fn: key('total', 2) }] },

{ id: 'n08', topic: 'json', level: 3, kind: 'json', file: 'data.json', title: 'Правильные типы',
  text: 'Файл разбирается без ошибок, но все значения записаны строками. Программа, которая сложит "120" и 30, получит «12030». Исправь типы: price — число, inStock — true, discount — null. title остаётся строкой.',
  example: '{\n  "count": "5",     строка\n  "count": 5        число\n}\n\nкавычки превращают любое значение в строку',
  methods: ['число без кавычек', 'true', 'null'],
  starter: '{\n  "title": "Чай",\n  "price": "120",\n  "inStock": "true",\n  "discount": "null"\n}', solution: '{\n  "title": "Чай",\n  "price": 120,\n  "inStock": true,\n  "discount": null\n}', hint: 'Убери кавычки вокруг 120, true и null.',
  checks: [{ name: 'title — строка «Чай»', fn: key('title', 'Чай') }, { name: 'price — число 120', fn: key('price', 120) }, { name: 'inStock — true', fn: key('inStock', true) }, { name: 'discount — null', fn: key('discount', null) }] },

{ id: 'n09', topic: 'json', level: 3, kind: 'json', file: 'package.json', title: 'package.json',
  text: 'package.json — это паспорт проекта, и это обычный JSON. Напиши самый простой: name — «country-search», version — «1.0.0», private — true (чтобы проект нельзя было случайно опубликовать в npm).',
  example: '{\n  "name": "memory-game",\n  "version": "0.1.0",\n  "private": true\n}\n\nимя проекта: маленькие буквы и дефисы, без пробелов',
  methods: ['name', 'version', 'private'],
  starter: '{\n\n}', solution: '{\n  "name": "country-search",\n  "version": "1.0.0",\n  "private": true\n}', hint: 'Три пары. version — строка "1.0.0", private — true без кавычек.',
  checks: [{ name: 'name — «country-search»', fn: key('name', 'country-search') }, { name: 'version — строка «1.0.0»', fn: key('version', '1.0.0') }, { name: 'private — true', fn: key('private', true) }] },

{ id: 'n10', topic: 'json', level: 3, kind: 'json', file: 'package.json', title: 'Скрипты',
  text: 'В разделе scripts записаны команды проекта: npm run dev запускает то, что стоит под ключом dev. Добавь два скрипта: build с командой «vite build» и lint с командой «eslint .». Остальное не меняй.',
  example: '{\n  "scripts": {\n    "start": "node server.js",\n    "test": "jest"\n  }\n}\n\nnpm run test выполнит команду jest',
  methods: ['"scripts": { … }'],
  starter: PKG, solution: '{\n  "name": "country-search",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "test": "jest",\n    "build": "vite build",\n    "lint": "eslint ."\n  }\n}', hint: 'После "test": "jest" поставь запятую и добавь две новые пары.',
  checks: [{ name: 'scripts.build — «vite build»', fn: key('scripts.build', 'vite build') }, { name: 'scripts.lint — «eslint .»', fn: key('scripts.lint', 'eslint .') }, { name: 'dev и test остались', fn: (c) => (at(c.value, 'scripts.dev') === 'vite' && at(c.value, 'scripts.test') === 'jest' ? true : 'скрипты dev и test изменились или пропали') }] },

{ id: 'n11', topic: 'json', level: 4, kind: 'json', file: 'package.json', title: 'dependencies и devDependencies',
  text: 'В dependencies лежит то, что нужно сайту для работы. В devDependencies — то, что нужно только разработчику: линтеры, тесты, форматирование. Сейчас всё свалено в dependencies. Перенеси prettier и husky в devDependencies, react оставь на месте.',
  example: '{\n  "dependencies": {\n    "lodash": "^4.17.0"\n  },\n  "devDependencies": {\n    "jest": "^29.0.0"\n  }\n}',
  methods: ['"devDependencies": { … }'],
  starter: '{\n  "name": "country-search",\n  "dependencies": {\n    "react": "^18.3.0",\n    "prettier": "^3.0.0",\n    "husky": "^9.0.0"\n  }\n}', solution: '{\n  "name": "country-search",\n  "dependencies": {\n    "react": "^18.3.0"\n  },\n  "devDependencies": {\n    "prettier": "^3.0.0",\n    "husky": "^9.0.0"\n  }\n}', hint: 'Создай рядом раздел "devDependencies" и перенеси в него две строки. Следи за запятыми.',
  checks: [
    { name: 'в dependencies остался только react', fn: (c) => c.want(at(c.value, 'dependencies'), { react: '^18.3.0' }, 'dependencies') },
    { name: 'prettier и husky в devDependencies', fn: (c) => c.want(at(c.value, 'devDependencies'), { prettier: '^3.0.0', husky: '^9.0.0' }, 'devDependencies') },
  ] },

{ id: 'n12', topic: 'json', level: 2, kind: 'js', file: 'solution.js', fn: 'toJson', demo: [{ name: 'Аня', age: 20 }], title: 'Объект в строку',
  text: 'Объект JS нельзя отправить на сервер или положить в localStorage как есть: сначала его превращают в строку JSON. Допиши функцию toJson: она возвращает объект user в виде строки JSON.',
  example: "const point = { x: 1, y: 2 };\nconst text = JSON.stringify(point);\n// text — строка '{\"x\":1,\"y\":2}'",
  methods: ['JSON.stringify(значение)'],
  starter: 'function toJson(user) {\n  return user;\n}', solution: 'function toJson(user) {\n  return JSON.stringify(user);\n}', hint: 'return JSON.stringify(user);',
  checks: [
    { name: 'возвращает строку', fn: (c) => c.want(typeof c.call({ name: 'Аня' }), 'string', 'тип результата') },
    { name: 'из строки получается тот же объект', fn: (c) => c.want(JSON.parse(c.call({ name: 'Аня', age: 20 })), { name: 'Аня', age: 20 }, 'после обратного разбора') },
    { name: 'работает и с массивом', fn: (c) => c.want(c.call([1, 2]), '[1,2]', 'результат для [1, 2]') },
  ] },

{ id: 'n13', topic: 'json', level: 3, kind: 'js', file: 'solution.js', fn: 'pretty', demo: [{ name: 'Аня', age: 20 }], title: 'Красивый JSON',
  text: 'По умолчанию JSON.stringify пишет всё в одну строку. Третий аргумент задаёт отступ, и результат становится читаемым. Допиши функцию pretty: строка JSON с отступом в 2 пробела.',
  example: "JSON.stringify({ x: 1 }, null, 4);\n// '{\\n    \"x\": 1\\n}'\n// второй аргумент здесь не нужен, на его месте пишут null",
  methods: ['JSON.stringify(data, null, 2)'],
  starter: 'function pretty(data) {\n  return JSON.stringify(data);\n}', solution: 'function pretty(data) {\n  return JSON.stringify(data, null, 2);\n}', hint: 'Добавь два аргумента: null и 2.',
  checks: [
    { name: 'объект оформлен с отступом в 2 пробела', fn: (c) => c.want(c.call({ a: 1, b: [true] }), '{\n  "a": 1,\n  "b": [\n    true\n  ]\n}', 'результат') },
    { name: 'данные не изменились', fn: (c) => c.want(JSON.parse(c.call({ name: 'Аня' })), { name: 'Аня' }, 'после обратного разбора') },
  ] },

{ id: 'n14', topic: 'json', level: 4, kind: 'js', file: 'solution.js', fn: 'parseSafe', demo: ['{"ok":true}'], title: 'Разобрать и не упасть',
  text: 'JSON.parse превращает строку обратно в значение. Если в строке не JSON, он бросает ошибку, и программа останавливается. Допиши функцию parseSafe: она возвращает разобранное значение, а если строку разобрать нельзя — null.',
  example: "function readNumber(text) {\n  try {\n    return JSON.parse(text);\n  } catch (error) {\n    return 0;\n  }\n}\n\n// код из try выполняется; если в нём ошибка, выполняется catch",
  methods: ['JSON.parse(text)', 'try { } catch { }'],
  starter: 'function parseSafe(text) {\n  return JSON.parse(text);\n}', solution: 'function parseSafe(text) {\n  try {\n    return JSON.parse(text);\n  } catch (error) {\n    return null;\n  }\n}', hint: 'Оберни return JSON.parse(text) в try, а в catch верни null.',
  checks: [
    { name: 'разбирает объект', fn: (c) => c.want(c.call('{"name":"Аня","age":20}'), { name: 'Аня', age: 20 }, 'результат') },
    { name: 'разбирает массив', fn: (c) => c.want(c.call('[1,2,3]'), [1, 2, 3], 'результат') },
    { name: 'на сломанной строке возвращает null', fn: (c) => c.want(c.call("{name: 'Аня'}"), null, 'результат для сломанной строки') },
    { name: 'на пустой строке возвращает null', fn: (c) => c.want(c.call(''), null, 'результат для пустой строки') },
  ] },

{ id: 'n15', topic: 'json', level: 5, kind: 'js', file: 'solution.js', fn: 'clone', demo: [{ user: { name: 'Аня' } }], title: 'Полная копия',
  text: 'Если превратить объект в строку и сразу разобрать обратно, получится полностью независимая копия: вложенные объекты тоже новые. Допиши функцию clone. Изменение копии не должно менять оригинал.',
  example: "const a = { tags: ['js'] };\nconst b = { ...a };          // копия только верхнего уровня\nb.tags.push('css');          // a.tags тоже изменился\n\n// строка JSON ничего не знает про исходный объект,\n// поэтому из неё получается новый объект целиком",
  methods: ['JSON.parse(JSON.stringify(obj))'],
  starter: 'function clone(obj) {\n  return { ...obj };\n}', solution: 'function clone(obj) {\n  return JSON.parse(JSON.stringify(obj));\n}', hint: 'return JSON.parse(JSON.stringify(obj));',
  checks: [
    { name: 'копия равна оригиналу', fn: (c) => c.want(c.call({ a: 1, list: [1, 2] }), { a: 1, list: [1, 2] }, 'копия') },
    { name: 'это другой объект', fn: (c) => { const o = { a: 1 }; return c.call(o) === o ? 'функция вернула тот же самый объект' : true; } },
    { name: 'вложенный объект тоже новый', fn: (c) => { const o = { user: { name: 'Аня' } }; const k = c.call(o); k.user.name = 'Оля'; return o.user.name === 'Аня' ? true : 'изменил имя в копии, и оно изменилось в оригинале: вложенный объект общий'; } },
    { name: 'вложенный массив тоже новый', fn: (c) => { const o = { tags: ['js'] }; const k = c.call(o); k.tags.push('css'); return o.tags.length === 1 ? true : 'добавил элемент в массив копии, и он появился в оригинале'; } },
  ] },

/* ================= PRETTIER ================= */
{ id: 'r01', topic: 'pret', level: 1, kind: 'cmd', file: 'терминал', title: 'Отформатировать проект',
  text: 'Prettier переписывает код в едином оформлении: отступы, кавычки, переносы. Он установлен в проекте. Напиши команду, которая отформатирует все файлы в текущей папке и сохранит изменения.',
  example: 'npx prettier --write src/app.js\n\n# npx запускает программу, установленную в проекте.\n# --write: сохранить результат в файл. Последним идёт файл или папка',
  methods: ['npx prettier --write .'],
  starter: '', solution: 'npx prettier --write .', hint: 'npx prettier --write и точка (текущая папка).',
  checks: [
    { name: 'запускается prettier через npx', fn: (c) => (c.first.via === 'npx' && c.first.argv[0] === 'prettier' ? true : 'команда должна начинаться с npx prettier') },
    { name: 'есть ключ --write', fn: (c) => (c.first.argv.includes('--write') || c.first.argv.includes('-w') ? true : 'без --write Prettier только покажет результат и ничего не сохранит') },
    { name: 'указана текущая папка', fn: (c) => (c.first.argv.includes('.') ? true : 'в конце нужна точка: она означает «все файлы в этой папке»') },
  ] },

{ id: 'r02', topic: 'pret', level: 1, kind: 'cmd', file: 'терминал', title: 'Только проверить',
  text: 'Перед отправкой задания полезно убедиться, что всё уже отформатировано, ничего не меняя. Напиши команду, которая проверит все файлы в текущей папке и сообщит о неотформатированных.',
  example: 'npx prettier --check src\n\n# --check ничего не записывает: только сообщает, какие файлы оформлены не по правилам',
  methods: ['npx prettier --check .'],
  starter: '', solution: 'npx prettier --check .', hint: 'То же самое, но вместо --write ключ --check.',
  checks: [
    { name: 'запускается prettier через npx', fn: (c) => (c.first.via === 'npx' && c.first.argv[0] === 'prettier' ? true : 'команда должна начинаться с npx prettier') },
    { name: 'есть ключ --check', fn: (c) => (c.first.argv.includes('--check') || c.first.argv.includes('-c') ? true : 'нужен ключ --check') },
    { name: 'файлы не перезаписываются', fn: (c) => (c.first.argv.includes('--write') || c.first.argv.includes('-w') ? '--write изменит файлы, а просили только проверить' : true) },
    { name: 'указана текущая папка', fn: (c) => (c.first.argv.includes('.') ? true : 'в конце нужна точка') },
  ] },

{ id: 'r03', topic: 'pret', level: 2, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Одинарные кавычки',
  text: 'Настройки Prettier лежат в файле .prettierrc, это обычный JSON. По умолчанию Prettier ставит двойные кавычки. Напиши конфиг, с которым строки будут в одинарных кавычках. Справа видно, каким станет код.',
  example: '{\n  "bracketSpacing": false\n}\n\nодна настройка — одна пара «имя: значение»',
  methods: ['"singleQuote": true'],
  source: 'const name = "Артур";\nconst city = "Берлин";\n',
  starter: '{\n\n}', solution: '{\n  "singleQuote": true\n}', hint: 'Настройка называется singleQuote, значение true.' },

{ id: 'r04', topic: 'pret', level: 2, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Без точек с запятой',
  text: 'По умолчанию Prettier ставит точку с запятой в конце каждой инструкции. Напиши конфиг, который их убирает.',
  example: '{\n  "singleQuote": true\n}',
  methods: ['"semi": false'],
  source: 'const a = 1;\nlet b = 2;\nb = a + b;\n',
  starter: '{\n\n}', solution: '{\n  "semi": false\n}', hint: 'Настройка semi, значение false.' },

{ id: 'r05', topic: 'pret', level: 2, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Ширина отступа',
  text: 'По умолчанию отступ равен двум пробелам. Напиши конфиг с отступом в четыре пробела.',
  example: '{\n  "semi": false\n}\n\nчисловые значения пишутся без кавычек',
  methods: ['"tabWidth": 4'],
  source: 'function hi() {\n  if (true) {\n    return 1;\n  }\n}\n',
  starter: '{\n\n}', solution: '{\n  "tabWidth": 4\n}', hint: 'Настройка tabWidth, значение 4 (число).' },

{ id: 'r06', topic: 'pret', level: 3, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Длина строки',
  text: 'Prettier переносит строку, если она длиннее 80 символов. В проектах часто разрешают 100. Напиши конфиг, с которым длинная строка из примера останется одной строкой.',
  example: '{\n  "tabWidth": 4\n}',
  methods: ['"printWidth": 100'],
  source: 'const result = calculateTotalPrice(productPrice, productCount, discountPercent, deliveryCost);\n',
  starter: '{\n\n}', solution: '{\n  "printWidth": 100\n}', hint: 'Настройка printWidth, значение 100.' },

{ id: 'r07', topic: 'pret', level: 3, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Запятая в конце',
  text: 'В многострочных объектах и массивах Prettier 3 ставит запятую после последнего элемента. Напиши конфиг, который эти запятые убирает.',
  example: '{\n  "printWidth": 100\n}\n\nу этой настройки значение — строка: "all", "es5" или "none"',
  methods: ['"trailingComma": "none"'],
  source: 'const user = {\n  name: "Аня",\n  city: "Минск",\n  skills: ["html", "css"],\n};\nconst longList = ["первый элемент списка", "второй элемент списка", "третий элемент списка", "ещё"];\n',
  starter: '{\n\n}', solution: '{\n  "trailingComma": "none"\n}', hint: 'Настройка trailingComma, значение "none" (строка в кавычках).' },

{ id: 'r08', topic: 'pret', level: 5, kind: 'prettierrc', file: '.prettierrc', parser: 'babel', title: 'Конфиг целиком',
  text: 'Собери конфиг из четырёх настроек так, чтобы код стал как в образце: одинарные кавычки, отступ 4 пробела, строки до 100 символов, без запятой после последнего элемента.',
  example: '{\n  "semi": false,\n  "bracketSpacing": false\n}\n\nнастройки перечисляются через запятую, как в любом JSON',
  methods: ['singleQuote', 'tabWidth', 'printWidth', 'trailingComma'],
  source: 'const countries = [\n  { name: "Германия", capital: "Берлин" },\n  { name: "Испания", capital: "Мадрид" },\n];\nfunction find(query) {\n  return countries.filter((country) => country.name.toLowerCase().includes(query.toLowerCase()));\n}\n',
  starter: '{\n\n}', solution: '{\n  "singleQuote": true,\n  "tabWidth": 4,\n  "printWidth": 100,\n  "trailingComma": "none"\n}', hint: 'Четыре пары: "singleQuote": true, "tabWidth": 4, "printWidth": 100, "trailingComma": "none".' },

{ id: 'r09', topic: 'pret', level: 3, kind: 'ignore', file: '.prettierignore', keepWord: 'форматируется', title: '.prettierignore',
  text: 'Файлы, которые форматировать не нужно, перечисляют в .prettierignore. Правила пишутся так же, как в .gitignore. Сделай так, чтобы Prettier пропускал папки dist и coverage и файл package-lock.json.',
  example: 'build\n*.min.js\n\n# node_modules Prettier пропускает сам',
  methods: ['папка', 'имя файла'],
  files: [{ path: 'dist/bundle.js', ignore: true }, { path: 'coverage/report.html', ignore: true }, { path: 'package-lock.json', ignore: true }, { path: 'src/app.ts', ignore: false }, { path: 'package.json', ignore: false }, { path: 'README.md', ignore: false }],
  starter: '', solution: 'dist\ncoverage\npackage-lock.json', hint: 'Три строки: dist, coverage и package-lock.json.' },

{ id: 'r10', topic: 'pret', level: 4, kind: 'pcode', file: 'app.js', parser: 'babel', title: 'Оформи как Prettier',
  text: 'Чтобы понимать, что делает Prettier, один раз оформи код руками по его правилам (настройки по умолчанию): пробелы вокруг = и +, пробелы внутри фигурных скобок объекта, точки с запятой, двойные кавычки, тело функции с новой строки с отступом в 2 пробела. Сам код менять нельзя.',
  example: 'было:\nlet total=price*count\n\nстало:\nlet total = price * count;',
  methods: ['пробелы', 'точка с запятой', 'переносы'],
  starter: "const user={name:'Аня',age:20}\nfunction hi( name ){return 'Привет, '+name}\n", solution: 'const user = { name: "Аня", age: 20 };\nfunction hi(name) {\n  return "Привет, " + name;\n}\n', hint: 'Первая строка: const user = { name: "Аня", age: 20 }; Функция занимает три строки: заголовок, return с отступом, закрывающая скобка.' },

{ id: 'r11', topic: 'pret', level: 4, kind: 'pcode', file: 'matrix.js', parser: 'babel', auto: false, showFormatted: true, title: 'Не трогай этот кусок',
  text: 'Иногда ручное оформление нагляднее. Здесь матрица записана по три числа в строке, а Prettier вытянет её в столбик. Добавь перед объявлением комментарий, который запрещает Prettier менять следующую за ним конструкцию. Справа видно, что получится после форматирования.',
  example: '// prettier-ignore\nconst table = [\n  "a",  "b",\n  "c",  "d",\n];\n\n// комментарий действует только на одну конструкцию под ним',
  methods: ['// prettier-ignore'],
  starter: 'const matrix = [\n  1, 0, 0,\n  0, 1, 0,\n  0, 0, 1,\n];\n', solution: '// prettier-ignore\nconst matrix = [\n  1, 0, 0,\n  0, 1, 0,\n  0, 0, 1,\n];\n', hint: 'Отдельной строкой перед const: // prettier-ignore',
  checks: [
    { name: 'после Prettier матрица осталась по три числа в строке', fn: (c) => (c.formatted.includes('  1, 0, 0,\n  0, 1, 0,\n  0, 0, 1,') ? true : 'Prettier переписал матрицу в столбик') },
    { name: 'сама матрица не изменена', fn: (c) => (c.code.includes('const matrix = [\n  1, 0, 0,\n  0, 1, 0,\n  0, 0, 1,\n];') ? true : 'код матрицы изменился: нужно только добавить комментарий') },
  ] },

/* ================= HUSKY ================= */
{ id: 'k01', topic: 'husky', level: 1, kind: 'cmd', file: 'терминал', title: 'Установить Husky',
  text: 'Husky запускает проверки автоматически при git commit, чтобы в репозиторий не попадал непроверенный код. Он нужен только разработчику. Напиши команду npm, которая установит husky как зависимость для разработки.',
  example: 'npm install --save-dev prettier\n\n# --save-dev (коротко -D) записывает пакет в devDependencies',
  methods: ['npm install --save-dev пакет'],
  starter: '', solution: 'npm install --save-dev husky', hint: 'npm install --save-dev husky.',
  checks: [
    { name: 'это npm install', fn: (c) => (c.first.all[0] === 'npm' && ['install', 'i', 'add'].includes(c.first.all[1]) ? true : 'команда должна начинаться с npm install') },
    { name: 'устанавливается husky', fn: (c) => (c.first.all.includes('husky') ? true : 'не вижу имени пакета husky') },
    { name: 'как зависимость для разработки', fn: (c) => (c.first.all.includes('--save-dev') || c.first.all.includes('-D') ? true : 'без --save-dev пакет попадёт в dependencies') },
  ] },

{ id: 'k02', topic: 'husky', level: 1, kind: 'cmd', file: 'терминал', title: 'Включить Husky',
  text: 'После установки Husky нужно один раз включить в проекте. Напиши команду, которая создаёт папку .husky с примером хука pre-commit и добавляет в package.json скрипт prepare.',
  example: 'npx prettier --check .\n\n# так же через npx запускается и husky: имя программы, потом её команда',
  methods: ['npx husky init'],
  starter: '', solution: 'npx husky init', hint: 'npx husky init.',
  checks: [
    { name: 'запускается husky через npx', fn: (c) => (c.first.via === 'npx' && c.first.argv[0] === 'husky' ? true : 'команда должна начинаться с npx husky') },
    { name: 'команда init', fn: (c) => (c.first.argv[1] === 'init' ? true : c.first.argv[1] === 'install' ? 'husky install — команда старых версий. В Husky 9 это husky init' : 'после husky нужна команда init') },
  ] },

{ id: 'k03', topic: 'husky', level: 2, kind: 'json', file: 'package.json', title: 'Скрипт prepare',
  text: 'Скрипт prepare npm запускает сам после каждого npm install. Если в нём стоит команда husky, хуки включатся у каждого, кто склонирует проект и установит зависимости. Добавь в scripts скрипт prepare с командой «husky».',
  example: '{\n  "scripts": {\n    "prepare": "node setup.js"\n  }\n}\n\nprepare — особое имя: этот скрипт не нужно запускать руками',
  methods: ['"prepare": "husky"'],
  starter: PKG, solution: '{\n  "name": "country-search",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "test": "jest",\n    "prepare": "husky"\n  }\n}', hint: 'В scripts после "test": "jest" поставь запятую и добавь "prepare": "husky".',
  checks: [
    { name: 'scripts.prepare — «husky»', fn: (c) => (at(c.value, 'scripts.prepare') === 'husky install' ? '«husky install» — команда старых версий. В Husky 9 пишут просто «husky»' : key('scripts.prepare', 'husky')(c)) },
    { name: 'dev и test остались', fn: (c) => (at(c.value, 'scripts.dev') === 'vite' && at(c.value, 'scripts.test') === 'jest' ? true : 'скрипты dev и test изменились или пропали') },
  ] },

{ id: 'k04', topic: 'husky', level: 2, kind: 'text', file: '.husky/pre-commit', title: 'Хук pre-commit',
  text: 'Хук — это файл с командами. Файл .husky/pre-commit git выполняет перед каждым коммитом. Если команда в нём завершилась с ошибкой, коммит не создаётся. Напиши хук, который перед коммитом запускает тесты проекта.',
  example: '# .husky/pre-push выполняется перед git push\nnpm run build\n\n# в файле хука пишут те же команды, что и в терминале',
  methods: ['npm test'],
  starter: '', solution: 'npm test', hint: 'Одна строка: npm test.',
  checks: [{ name: 'хук запускает тесты', fn: (c) => (c.lines.some((l) => /^npm (run )?test$/.test(l)) ? true : 'нужна команда npm test (или npm run test)') }] },

{ id: 'k05', topic: 'husky', level: 3, kind: 'json', file: 'package.json', title: 'lint-staged',
  text: 'Проверять весь проект перед каждым коммитом долго. Пакет lint-staged запускает команды только для файлов, которые сейчас в индексе. Его настройки — объект «шаблон файлов: команда». Добавь в package.json раздел lint-staged: для файлов *.ts запускать «eslint --fix».',
  example: '{\n  "lint-staged": {\n    "*.css": "stylelint --fix"\n  }\n}\n\nраздел стоит на верхнем уровне package.json, рядом со scripts',
  methods: ['"lint-staged": { "*.ts": "…" }'],
  starter: PKG, solution: '{\n  "name": "country-search",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "test": "jest"\n  },\n  "lint-staged": {\n    "*.ts": "eslint --fix"\n  }\n}', hint: 'После закрывающей скобки scripts поставь запятую и добавь "lint-staged": { "*.ts": "eslint --fix" }.',
  checks: [
    { name: 'для src/app.ts запустится eslint --fix', fn: runs('src/app.ts', ['eslint --fix']) },
    { name: 'для style.css ничего не запустится', fn: runs('style.css', []) },
    { name: 'для README.md ничего не запустится', fn: runs('README.md', []) },
  ] },

{ id: 'k06', topic: 'husky', level: 3, kind: 'text', file: '.husky/pre-commit', title: 'Хук с lint-staged',
  text: 'lint-staged настроен в package.json, но сам он не запустится. Напиши хук pre-commit, который запускает lint-staged перед каждым коммитом.',
  example: 'npx prettier --check .\n\n# программу, установленную в проекте, в хуке тоже запускают через npx',
  methods: ['npx lint-staged'],
  starter: 'npm test', solution: 'npx lint-staged', hint: 'Одна строка: npx lint-staged.',
  checks: [
    { name: 'хук запускает lint-staged', fn: (c) => (c.lines.some((l) => /^npx (--no(-install)? (-- )?)?lint-staged$/.test(l)) ? true : 'нужна команда npx lint-staged') },
  ] },

{ id: 'k07', topic: 'husky', level: 4, kind: 'json', file: 'package.json', title: 'Несколько шаблонов',
  text: 'В шаблоне можно перечислить расширения в фигурных скобках, а командой может быть массив: команды выполнятся по очереди. Настрой lint-staged: для *.ts и *.js сначала «eslint --fix», потом «prettier --write»; для *.css, *.json и *.md только «prettier --write».',
  example: '{\n  "lint-staged": {\n    "*.{png,jpg}": "imagemin",\n    "*.scss": ["stylelint --fix", "prettier --write"]\n  }\n}',
  methods: ['"*.{ts,js}"', '["команда 1", "команда 2"]'],
  starter: '{\n  "name": "country-search",\n  "lint-staged": {\n    "*.ts": "eslint --fix"\n  }\n}', solution: '{\n  "name": "country-search",\n  "lint-staged": {\n    "*.{ts,js}": ["eslint --fix", "prettier --write"],\n    "*.{css,json,md}": "prettier --write"\n  }\n}', hint: 'Два ключа: "*.{ts,js}" с массивом из двух команд и "*.{css,json,md}" с одной командой.',
  checks: [
    { name: 'src/app.ts: eslint --fix, потом prettier --write', fn: runs('src/app.ts', ['eslint --fix', 'prettier --write']) },
    { name: 'utils/helpers.js: то же самое', fn: runs('utils/helpers.js', ['eslint --fix', 'prettier --write']) },
    { name: 'style.css: только prettier --write', fn: runs('style.css', ['prettier --write']) },
    { name: 'README.md и data.json: только prettier --write', fn: (c) => { const a = runs('README.md', ['prettier --write'])(c); return a === true ? runs('data.json', ['prettier --write'])(c) : a; } },
    { name: 'logo.png: ничего', fn: runs('logo.png', []) },
  ] },

{ id: 'k08', topic: 'husky', level: 5, kind: 'text', file: '.husky/commit-msg', title: 'Проверка сообщения коммита',
  text: 'Хук commit-msg выполняется после того, как ты написал сообщение коммита. Git передаёт хуку путь к файлу с сообщением первым аргументом, в скрипте он доступен как $1. Программа commitlint проверяет сообщение из файла, если запустить её с ключом --edit и этим путём. Напиши хук: запусти commitlint через npx.',
  example: '# общий вид:\nnpx программа --ключ $1\n\n# в документации commitlint команда записана как npx --no -- commitlint …\n# «--no» запрещает npx скачивать пакет, если он не установлен. Подойдут оба варианта',
  methods: ['npx commitlint --edit $1'],
  starter: '', solution: 'npx --no -- commitlint --edit $1', hint: 'npx --no -- commitlint --edit $1 (или короче: npx commitlint --edit $1).',
  checks: [
    { name: 'запускается commitlint через npx', fn: (c) => (c.lines.some((l) => /^npx\s.*\bcommitlint\b/.test(l) || /^npx commitlint\b/.test(l)) ? true : 'нужна строка, которая начинается с npx и запускает commitlint') },
    { name: 'есть ключ --edit', fn: (c) => (c.lines.some((l) => /commitlint.*\s--edit\b/.test(l)) ? true : 'после commitlint нужен ключ --edit') },
    { name: 'передан путь к файлу с сообщением ($1)', fn: (c) => (c.lines.some((l) => /--edit\s+"?\$\{?1\}?"?\s*$/.test(l)) ? true : 'после --edit нужен $1: это путь к файлу с сообщением') },
  ] },
];

// внутри раздела задачи идут по возрастанию уровня (порядок записи выше сохраняется для равных уровней)
{
  const order = ['git', 'hub', 'json', 'pret', 'husky'];
  const pos = new Map(TASKS.map((t, i) => [t, i]));
  TASKS.sort((a, b) => order.indexOf(a.topic) - order.indexOf(b.topic) || a.level - b.level || pos.get(a) - pos.get(b));
}
