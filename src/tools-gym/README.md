# Исходники Dev Tools Gym

Из этих файлов собирается `Тренажёры/tools-gym.html` (около 1 МБ): Git, GitHub, JSON, Prettier, Husky. Интерфейс тот же, что у [[Тренажёр HTML Markup Gym]]. См. [[Тренажёр Dev Tools Gym]].

| Файл | Что это |
| --- | --- |
| `src/tasks.js` | все задачи: вид (`kind`), текст, пример, заготовка, решение, проверки |
| `src/engine.js` | симулятор git, разбор команд, правила `.gitignore` и шаблоны lint-staged, разбор JSON с понятными ошибками, запуск Prettier |
| `src/app.js` | интерфейс и прогресс в `localStorage` (ключ `toolsgym-v1`) |
| `src/page.html` | разметка и стили, места для вставки помечены `__ИМЕНЕМ__` |
| `vendor/` | Prettier 3.10.1: `standalone.js` и плагины babel, estree, postcss |
| `build.js` | склеивает всё в `dist/index.html` |
| `e2e.py` | прогон в Chrome: каждое решение проходит, каждая заготовка не проходит |
| `probe.py` | типичные ошибки и другие верные решения: что отвечает тренажёр |

## Виды задач (`kind`)

| kind | Что проверяется | Что доступно в проверке `fn(c)` |
| --- | --- | --- |
| `git` | состояние репозитория после команд | `c.branch c.branches c.log(ref) c.tree(ref) c.parents(ref) c.id(ref) c.contains(ref, inner) c.staged c.modified c.untracked c.clean c.work c.stash c.merging c.remote c.server(branch) c.upstream(branch) c.used(regexp) c.cmds` |
| `cmd` | разобранная команда | `c.first` и `c.cmds`: `{ via, argv, all, raw }` (в `argv` убран `npx` и его ключи) |
| `json` | значение после `JSON.parse` | `c.value c.typeName c.globMatch` |
| `js` | функция `task.fn` | `c.call(...args) c.fn` |
| `text` | строки файла без комментариев | `c.lines c.CONVENTIONAL` |
| `ignore` | правила против `task.files` | проверки строятся сами из `files: [{ path, ignore }]` |
| `prettierrc` | код `task.source` после Prettier с конфигом Артура | проверка строится сама: сравнение с результатом для `task.solution` |
| `pcode` | код, оформленный руками | проверки строятся сами (`auto: false` их отключает); `c.formatted c.code` |

Во всех видах есть `c.want(actual, expected, label)` и `c.code`.

## Симулятор git

Задача готовит репозиторий списком команд `setup` (те же команды, что вводит Артур). Служебная команда `@server <адрес> <ветка> "<сообщение>" <файл> "<содержимое>"` создаёт коммит коллеги на сервере. `hooks: { commitMsg: 'conventional' }` включает проверку сообщений коммитов, как Husky с commitlint.

## Сборка и проверка

```bash
node build.js          # dist/index.html
python3 e2e.py         # solutions failing: [] | starters passing: []
python3 probe.py       # unexpected: 0
```

## После правок

1. `python3 e2e.py` и `python3 probe.py`.
2. Заменить `Тренажёры/tools-gym.html`, пересобрать общий тренажёр (`../frontend-gym/`) и опубликовать новую версию артефакта.
3. Если менялся список задач — обновить чек-лист в `Тренажёр Dev Tools Gym.md` и число в `../frontend-gym/totals.json`.
