# Исходники React Gym

Из этих файлов собирается `Тренажёры/react-gym.html` (около 1,8 МБ). Править задачи нужно здесь, а не в готовом HTML. Интерфейс устроен так же, как [[Тренажёр HTML Markup Gym]] (`../html-markup-gym/`).

| Файл | Что это |
| --- | --- |
| `src/tasks.js` | все задачи: текст, пример на другом коде, подсказка, заготовка `App.jsx`, решение и проверки |
| `src/engine.js` | проверка: синтаксис (acorn), перевод JSX в JS (Sucrase), запуск в iframe с настоящим React, перевод ошибок и предупреждений React на русский |
| `src/app.js` | интерфейс: список задач, редактор, живой предпросмотр, прогресс в `localStorage` (ключ `reactgym-v1`) |
| `src/page.html` | разметка и стили, места для вставки помечены `__ИМЕНЕМ__` |
| `vendor/` | React 18.3.1 и ReactDOM (сборки для разработки) и `sucrase.js` (Sucrase + acorn + acorn-jsx одним файлом) |
| `suc-entry.js` | из него собран `vendor/sucrase.js`: `npx esbuild suc-entry.js --bundle --minify --format=iife --outfile=vendor/sucrase.js` (нужны пакеты `sucrase`, `acorn`, `acorn-jsx`) |
| `build.js` | склеивает всё в `dist/index.html` |
| `e2e.py` | прогон в настоящем Chrome (Playwright): каждое решение проходит, каждая заготовка не проходит |
| `probe.py` | типичные ошибки (class вместо className, нет импорта, `onClick={setX(…)}`, нет `preventDefault`) и что на них отвечает тренажёр |

## Как устроена проверка

Задача = текст + компонент Артура с `export default`. Код проверяется acorn (он ловит непарные JSX-теги, которые Sucrase пропускает), переводится Sucrase (`jsx` + `imports`) и выполняется внутри iframe; `require('react')` отдаёт встроенный React. Перед каждой проверкой компонент монтируется заново с `task.props`.

В проверках (`async (c) => true | 'текст ошибки'`) доступны: `c.q c.qa c.$ c.txt c.texts c.btn c.want c.has c.click c.type c.choose c.submit c.render(props) c.unmount c.wait(ms) c.intervals() c.warned(part) c.title() c.code c.root`. Функции проверок превращаются в текст и выполняются внутри iframe, поэтому снаружи им доступен только `c` и глобальные `React`, `window`, `document`.

- `c.submit(form)` возвращает, отменил ли компонент отправку (`preventDefault`); настоящую отправку тренажёр гасит сам.
- `c.warned('unique "key"')` смотрит все предупреждения с начала запуска: React предупреждает один раз за загрузку страницы.
- `c.intervals()` — число работающих `setInterval` (для проверки очистки эффекта).
- `task.setup` — код, который выполняется до кода Артура (готовые функции `track`, `loadUser`).

## Сборка и проверка

```bash
node build.js          # dist/index.html
python3 e2e.py         # solutions failing: [] | starters passing: []
```

## После правок

1. `python3 e2e.py` → оба списка пустые.
2. Заменить `Тренажёры/react-gym.html`, пересобрать общий тренажёр (`../frontend-gym/`) и опубликовать новую версию артефакта.
3. Если менялся список задач — обновить чек-лист в `Тренажёр React Gym.md` и число в `../frontend-gym/totals.json`.
