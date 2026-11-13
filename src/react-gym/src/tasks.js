/* tasks.js — задачи React Gym.
   Поля: id, topic, level (1–5), title, text, example (пример на другом коде), methods (чипы «Пригодится»),
   starter (заготовка App.jsx), solution, hint,
   props — пропсы, с которыми компонент показывается в предпросмотре (и по умолчанию в проверках),
   setup — код, который выполняется в iframe до кода Артура (готовые функции вроде loadUser),
   checks: [{ name, fn: async (c) => true | 'текст ошибки' }].
   c: q, qa, $, txt, texts, btn(text), want, has, click, type, choose, submit, render(props), unmount, wait(ms),
      intervals(), warned(part), title(), code, root. Перед каждой проверкой компонент монтируется заново.
   Функции проверок превращаются в текст и выполняются внутри iframe: снаружи им доступен только c и глобальные React/window. */

const HELPERS = {};

const TASKS = [
/* ================= JSX И КОМПОНЕНТЫ ================= */
{ id: 'j01', topic: 'jsx', level: 1, title: 'Первый компонент',
  text: 'Компонент в React — это функция, которая возвращает разметку (JSX). Сделай так, чтобы компонент App возвращал заголовок h1 с текстом «Привет, React!».',
  example: `export default function Page() {
  return <p>Сегодня хорошая погода.</p>;
}

// JSX похож на HTML, но живёт прямо в JS. Функция возвращает его через return`,
  methods: ['function App()', 'return <h1>…</h1>'],
  starter: `export default function App() {
  // верни заголовок
}
`,
  solution: `export default function App() {
  return <h1>Привет, React!</h1>;
}`,
  hint: 'Внутри функции одна строка: return, потом тег <h1> с текстом и закрывающий </h1>.',
  checks: [
    { name: 'на странице есть заголовок h1', fn: async (c) => (c.q('h1') ? true : 'h1 не нашёл: компонент должен вернуть его через return') },
    { name: 'в нём текст «Привет, React!»', fn: async (c) => c.want(c.txt(c.$('h1')), 'Привет, React!', 'текст h1') },
  ] },

{ id: 'j02', topic: 'jsx', level: 1, title: 'Переменная в разметке',
  text: 'Внутри JSX можно вставить значение из JS в фигурных скобках. Выведи абзац «Привет, Артур!», но имя возьми из переменной name, а не пиши его в тексте.',
  example: `export default function Page() {
  const city = 'Берлин';
  return <p>Город: {city}</p>;
}

// {city} — «окно» в JS: React подставит сюда значение переменной`,
  methods: ['{переменная}'],
  starter: `export default function App() {
  const name = 'Артур';
  return <p>Привет!</p>;
}
`,
  solution: `export default function App() {
  const name = 'Артур';
  return <p>Привет, {name}!</p>;
}`,
  hint: 'Текст абзаца: Привет, {name}! — фигурные скобки стоят прямо посреди текста.',
  checks: [
    { name: 'в абзаце текст «Привет, Артур!»', fn: async (c) => c.want(c.txt(c.$('p')), 'Привет, Артур!', 'текст абзаца') },
    { name: 'имя подставлено через {name}', fn: async (c) => (/\{\s*name\s*\}/.test(c.code) ? true : 'в JSX не вижу {name}: имя должно прийти из переменной') },
  ] },

{ id: 'j03', topic: 'jsx', level: 1, title: 'className вместо class',
  text: 'В JSX атрибут класса называется className (слово class в JS занято). Сделай абзац с классом note и текстом «Важно».',
  example: `export default function Page() {
  return <div className="card">Карточка</div>;
}

// в HTML: class="card", в JSX: className="card"`,
  methods: ['className="…"'],
  starter: `export default function App() {
  return <p>Важно</p>;
}
`,
  solution: `export default function App() {
  return <p className="note">Важно</p>;
}`,
  hint: 'Добавь абзацу атрибут className="note".',
  checks: [
    { name: 'у абзаца класс note', fn: async (c) => (c.$('p').classList.contains('note') ? true : 'у абзаца нет класса note') },
    { name: 'текст «Важно»', fn: async (c) => c.want(c.txt(c.$('p')), 'Важно', 'текст абзаца') },
    { name: 'написано className, а не class', fn: async (c) => (c.warned('Invalid DOM property') ? 'React ругается на атрибут class: в JSX нужен className' : true) },
  ] },

{ id: 'j04', topic: 'jsx', level: 2, title: 'Два тега без обёртки',
  text: 'Компонент возвращает один корневой элемент. Чтобы вернуть заголовок и абзац рядом и не добавлять лишний div, их оборачивают во фрагмент <>…</>. Верни h1 «Блог» и p «Первая запись» во фрагменте.',
  example: `export default function Page() {
  return (
    <>
      <h2>Меню</h2>
      <p>Супы и салаты</p>
    </>
  );
}

// <>…</> — фрагмент: группирует теги, но сам на странице не появляется`,
  methods: ['<>…</>', 'return ( … )'],
  starter: `export default function App() {
  return <h1>Блог</h1>;
}
`,
  solution: `export default function App() {
  return (
    <>
      <h1>Блог</h1>
      <p>Первая запись</p>
    </>
  );
}`,
  hint: 'После return открой круглую скобку, внутри <> … </>, а в нём h1 и p.',
  checks: [
    { name: 'есть h1 «Блог»', fn: async (c) => c.want(c.txt(c.$('h1')), 'Блог', 'текст h1') },
    { name: 'есть p «Первая запись»', fn: async (c) => c.want(c.txt(c.$('p')), 'Первая запись', 'текст p') },
    { name: 'h1 и p лежат рядом, без лишней обёртки', fn: async (c) => { const k = [...c.root.children].map((e) => e.tagName.toLowerCase()).join(', '); return k === 'h1, p' ? true : 'прямо в корне сейчас: ' + (k || 'пусто') + '; нужно: h1, p'; } },
  ] },

{ id: 'j05', topic: 'jsx', level: 2, title: 'Вычисление в скобках',
  text: 'В фигурных скобках может стоять любое выражение, не только переменная. Выведи абзац «Итого: 750 ₽»: сумму посчитай в JSX из price и count.',
  example: `export default function Page() {
  const width = 4;
  const height = 5;
  return <p>Площадь: {width * height} м²</p>;
}

// {width * height} — React сначала посчитает выражение, потом выведет результат`,
  methods: ['{a * b}'],
  starter: `export default function App() {
  const price = 250;
  const count = 3;
  return <p>Итого: ₽</p>;
}
`,
  solution: `export default function App() {
  const price = 250;
  const count = 3;
  return <p>Итого: {price * count} ₽</p>;
}`,
  hint: 'Между «Итого: » и « ₽» вставь {price * count}.',
  checks: [
    { name: 'в абзаце «Итого: 750 ₽»', fn: async (c) => c.want(c.txt(c.$('p')), 'Итого: 750 ₽', 'текст абзаца') },
    { name: 'число 750 посчитано, а не написано руками', fn: async (c) => (/750/.test(c.code) ? 'в коде есть готовое число 750: посчитай его из price и count' : true) },
  ] },

{ id: 'j06', topic: 'jsx', level: 2, title: 'Атрибут из переменной',
  text: 'Значение атрибута тоже можно взять из JS: вместо кавычек ставят фигурные скобки. Сделай ссылку: адрес из переменной url, текст из переменной label.',
  example: `export default function Page() {
  const id = 'main-title';
  const text = 'Главная';
  return <h2 id={id}>{text}</h2>;
}

// id={id} — без кавычек: в кавычках была бы просто строка "id"`,
  methods: ['href={url}'],
  starter: `export default function App() {
  const url = 'https://rs.school';
  const label = 'Сайт курса';
  return <a>ссылка</a>;
}
`,
  solution: `export default function App() {
  const url = 'https://rs.school';
  const label = 'Сайт курса';
  return <a href={url}>{label}</a>;
}`,
  hint: 'У тега a: href={url}. Внутри тега: {label}.',
  checks: [
    { name: 'у ссылки адрес https://rs.school', fn: async (c) => c.want(c.$('a').getAttribute('href'), 'https://rs.school', 'href') },
    { name: 'текст ссылки «Сайт курса»', fn: async (c) => c.want(c.txt(c.$('a')), 'Сайт курса', 'текст ссылки') },
    { name: 'значения взяты из переменных', fn: async (c) => (/href=\{\s*url\s*\}/.test(c.code) && /\{\s*label\s*\}/.test(c.code) ? true : 'нужно href={url} и {label}') },
  ] },

{ id: 'j07', topic: 'jsx', level: 3, title: 'Стиль объектом',
  text: 'Атрибут style в JSX принимает не строку, а объект: свойства пишутся в верблюжьем стиле. Сделай абзац «Внимание» красного цвета (color: red) с размером шрифта 20px.',
  example: `export default function Page() {
  return <p style={{ backgroundColor: 'yellow', padding: 8 }}>Заметка</p>;
}

// внешние скобки — «окно в JS», внутренние — сам объект.
// background-color превращается в backgroundColor, число 8 означает 8px`,
  methods: ['style={{ … }}', 'fontSize'],
  starter: `export default function App() {
  return <p>Внимание</p>;
}
`,
  solution: `export default function App() {
  return <p style={{ color: 'red', fontSize: 20 }}>Внимание</p>;
}`,
  hint: "style={{ color: 'red', fontSize: 20 }} — двойные фигурные скобки и fontSize вместо font-size.",
  checks: [
    { name: 'цвет текста red', fn: async (c) => c.want(c.$('p').style.color, 'red', 'color') },
    { name: 'размер шрифта 20px', fn: async (c) => c.want(c.$('p').style.fontSize, '20px', 'font-size') },
  ] },

{ id: 'j08', topic: 'jsx', level: 3, title: 'Свой компонент',
  text: 'Компоненты можно вкладывать друг в друга как теги. Напиши компонент Badge: он возвращает span с классом badge и текстом «Новинка». В App выведи Badge два раза.',
  example: `function Star() {
  return <span>★</span>;
}

export default function Page() {
  return (
    <p>
      <Star />
      <Star />
      <Star />
    </p>
  );
}

// имя компонента с большой буквы, тег без содержимого закрывается сам: <Star />`,
  methods: ['function Badge()', '<Badge />'],
  starter: `// напиши компонент Badge здесь

export default function App() {
  return <div></div>;
}
`,
  solution: `function Badge() {
  return <span className="badge">Новинка</span>;
}

export default function App() {
  return (
    <div>
      <Badge />
      <Badge />
    </div>
  );
}`,
  hint: 'Выше App: function Badge() { return <span className="badge">Новинка</span>; }. В App два раза <Badge />.',
  checks: [
    { name: 'на странице два span с классом badge', fn: async (c) => c.want(c.qa('span.badge').length, 2, 'количество span.badge') },
    { name: 'в каждом текст «Новинка»', fn: async (c) => (c.texts('span.badge').every((t) => t === 'Новинка') && c.qa('span.badge').length ? true : 'тексты сейчас: ' + c.texts('span.badge').join(', ')) },
    { name: 'Badge использован как компонент дважды', fn: async (c) => ((c.code.match(/<Badge\b/g) || []).length >= 2 ? true : 'в коде должно быть два <Badge />') },
  ] },

{ id: 'j09', topic: 'jsx', level: 4, title: 'Страница из частей',
  text: 'Собери страницу из компонентов. Header уже написан. Напиши Footer (тег footer, внутри p «RS School, 2026») и собери App: Header, потом main с абзацем «Контент», потом Footer.',
  example: `function Top() {
  return <nav>Меню</nav>;
}

function Bottom() {
  return <small>Контакты</small>;
}

export default function Page() {
  return (
    <>
      <Top />
      <section>Текст</section>
      <Bottom />
    </>
  );
}`,
  methods: ['<Header />', '<>…</>'],
  starter: `function Header() {
  return (
    <header>
      <h1>Мой сайт</h1>
    </header>
  );
}

// напиши Footer

export default function App() {
  return <Header />;
}
`,
  solution: `function Header() {
  return (
    <header>
      <h1>Мой сайт</h1>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <p>RS School, 2026</p>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <p>Контент</p>
      </main>
      <Footer />
    </>
  );
}`,
  hint: 'Footer пишется так же, как Header. В App три части во фрагменте: <Header />, <main>…</main>, <Footer />.',
  checks: [
    { name: 'в header заголовок «Мой сайт»', fn: async (c) => c.want(c.txt(c.$('header h1')), 'Мой сайт', 'текст header h1') },
    { name: 'в main абзац «Контент»', fn: async (c) => c.want(c.txt(c.$('main p')), 'Контент', 'текст main p') },
    { name: 'в footer абзац «RS School, 2026»', fn: async (c) => c.want(c.txt(c.$('footer p')), 'RS School, 2026', 'текст footer p') },
    { name: 'порядок: header, main, footer', fn: async (c) => { const k = [...c.root.children].map((e) => e.tagName.toLowerCase()).join(', '); return k === 'header, main, footer' ? true : 'в корне сейчас: ' + (k || 'пусто'); } },
  ] },

/* ================= ПРОПСЫ ================= */
{ id: 'p01', topic: 'props', level: 1, title: 'Первый проп',
  text: 'Пропсы — это данные, которые компонент получает снаружи, как аргументы функции. Компонент Hello получает проп name. Выведи абзац «Привет, ИМЯ!». Тренажёр сам отрисует компонент с разными именами.',
  example: `export default function City(props) {
  return <p>Город: {props.title}</p>;
}

// кто-то снаружи напишет <City title="Берлин" />,
// и внутри props.title будет равно 'Берлин'`,
  methods: ['props.name'],
  props: { name: 'Аня' },
  starter: `export default function Hello(props) {
  return <p>Привет!</p>;
}
`,
  solution: `export default function Hello(props) {
  return <p>Привет, {props.name}!</p>;
}`,
  hint: 'Все пропсы лежат в объекте props. Имя: {props.name}.',
  checks: [
    { name: 'с name="Аня" выводит «Привет, Аня!»', fn: async (c) => { await c.render({ name: 'Аня' }); return c.want(c.txt(c.$('p')), 'Привет, Аня!', 'текст'); } },
    { name: 'с name="Олег" выводит «Привет, Олег!»', fn: async (c) => { await c.render({ name: 'Олег' }); return c.want(c.txt(c.$('p')), 'Привет, Олег!', 'текст'); } },
  ] },

{ id: 'p02', topic: 'props', level: 2, title: 'Деструктуризация пропсов',
  text: 'Чтобы не писать props. перед каждым именем, пропсы достают прямо в скобках функции. Компонент UserCard получает name и age. Выведи h2 с именем и абзац «Возраст: ЧИСЛО».',
  example: `export default function Book({ title, pages }) {
  return (
    <div>
      <h3>{title}</h3>
      <p>Страниц: {pages}</p>
    </div>
  );
}

// { title, pages } в скобках — это деструктуризация объекта props`,
  methods: ['function X({ a, b })'],
  props: { name: 'Артур', age: 25 },
  starter: `export default function UserCard() {
  return (
    <div className="card">
      <h2></h2>
      <p>Возраст:</p>
    </div>
  );
}
`,
  solution: `export default function UserCard({ name, age }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      <p>Возраст: {age}</p>
    </div>
  );
}`,
  hint: 'В скобках функции: ({ name, age }). Потом {name} в h2 и {age} в абзаце.',
  checks: [
    { name: 'в h2 имя', fn: async (c) => { await c.render({ name: 'Лена', age: 31 }); return c.want(c.txt(c.$('h2')), 'Лена', 'текст h2'); } },
    { name: 'в абзаце «Возраст: 31»', fn: async (c) => { await c.render({ name: 'Лена', age: 31 }); return c.want(c.txt(c.$('p')), 'Возраст: 31', 'текст p'); } },
    { name: 'с другими пропсами другой результат', fn: async (c) => { await c.render({ name: 'Макс', age: 19 }); return c.want(c.txt(c.$('h2')) + ' / ' + c.txt(c.$('p')), 'Макс / Возраст: 19', 'результат'); } },
  ] },

{ id: 'p03', topic: 'props', level: 2, title: 'Значение по умолчанию',
  text: 'Если проп не передали, он равен undefined. Значение по умолчанию задают прямо при деструктуризации. Компонент Button выводит кнопку с текстом из пропа label, а если label не передали — с текстом «OK».',
  example: `export default function Avatar({ size = 40 }) {
  return <p>Размер: {size}</p>;
}

// <Avatar size={80} /> покажет 80, а <Avatar /> покажет 40`,
  methods: ['{ label = "OK" }'],
  props: {},
  starter: `export default function Button({ label }) {
  return <button>{label}</button>;
}
`,
  solution: `export default function Button({ label = 'OK' }) {
  return <button>{label}</button>;
}`,
  hint: "В скобках функции: ({ label = 'OK' }).",
  checks: [
    { name: 'с label="Сохранить" текст «Сохранить»', fn: async (c) => { await c.render({ label: 'Сохранить' }); return c.want(c.txt(c.$('button')), 'Сохранить', 'текст кнопки'); } },
    { name: 'без label текст «OK»', fn: async (c) => { await c.render({}); return c.want(c.txt(c.$('button')), 'OK', 'текст кнопки'); } },
  ] },

{ id: 'p04', topic: 'props', level: 3, title: 'children',
  text: 'Всё, что написано между открывающим и закрывающим тегом компонента, приходит в особом пропе children. Напиши компонент Card: div с классом card, внутри которого выводится children.',
  example: `export default function Frame({ children }) {
  return <section>{children}</section>;
}

// <Frame><p>Текст</p></Frame>
// абзац попадёт в children и окажется внутри section`,
  methods: ['{ children }', '{children}'],
  props: { children: 'Текст внутри карточки' },
  starter: `export default function Card() {
  return <div className="card"></div>;
}
`,
  solution: `export default function Card({ children }) {
  return <div className="card">{children}</div>;
}`,
  hint: 'Достань children из пропсов и выведи {children} внутри div.',
  checks: [
    { name: 'есть div с классом card', fn: async (c) => (c.q('div.card') ? true : 'div.card не нашёл') },
    { name: 'текст из children попадает внутрь', fn: async (c) => { await c.render({ children: 'Привет' }); return c.want(c.txt(c.$('div.card')), 'Привет', 'содержимое карточки'); } },
    { name: 'вложенный тег тоже попадает внутрь', fn: async (c) => { await c.render({ children: React.createElement('b', null, 'жирный') }); return c.q('div.card b') ? true : 'передал <b>жирный</b> в children, но внутри карточки его нет'; } },
  ] },

{ id: 'p05', topic: 'props', level: 3, title: 'Передай пропсы сам',
  text: 'Теперь наоборот: компонент Product готов, а ты его используешь. Строку передают в кавычках, а число и булево значение — в фигурных скобках. В App выведи Product с title «Чай», price 120 (числом) и inStock true.',
  example: `function Seat({ row, vip }) {
  return <p>Ряд {row}, VIP: {String(vip)}</p>;
}

export default function Page() {
  return <Seat row={7} vip={false} />;
}

// row="7" была бы строка '7', а row={7} — число 7`,
  methods: ['title="…"', 'price={120}', 'inStock={true}'],
  starter: `function Product({ title, price, inStock }) {
  return (
    <p>
      {title}: {price} ₽ ({typeof price}), в наличии: {String(inStock)}
    </p>
  );
}

export default function App() {
  // выведи здесь Product
  return null;
}
`,
  solution: `function Product({ title, price, inStock }) {
  return (
    <p>
      {title}: {price} ₽ ({typeof price}), в наличии: {String(inStock)}
    </p>
  );
}

export default function App() {
  return <Product title="Чай" price={120} inStock={true} />;
}`,
  hint: '<Product title="Чай" price={120} inStock={true} />. Если написать price="120", тип будет string.',
  checks: [
    { name: 'Product выведен на страницу', fn: async (c) => (c.q('p') ? true : 'абзаца из Product нет: App должен вернуть <Product … />') },
    { name: 'title — «Чай»', fn: async (c) => (c.txt(c.$('p')).startsWith('Чай:') ? true : 'сейчас: «' + c.txt(c.$('p')) + '»') },
    { name: 'price — число 120', fn: async (c) => (c.txt(c.$('p')).includes('120 ₽ (number)') ? true : 'нужно «120 ₽ (number)», сейчас: «' + c.txt(c.$('p')) + '»') },
    { name: 'inStock — true', fn: async (c) => (c.txt(c.$('p')).endsWith('в наличии: true') ? true : 'сейчас: «' + c.txt(c.$('p')) + '»') },
  ] },

{ id: 'p06', topic: 'props', level: 4, title: 'Проп-функция',
  text: 'В пропсах можно передать функцию: так ребёнок сообщает родителю о событии. Компонент PressButton получает проп onPress. Выведи кнопку «Нажми», которая при клике вызывает onPress.',
  example: `export default function CloseIcon({ onClose }) {
  return <span onClick={onClose}>×</span>;
}

// onClick={onClose} — передаём саму функцию.
// onClick={onClose()} вызвал бы её сразу при отрисовке, а не по клику`,
  methods: ['onClick={onPress}'],
  props: {},
  starter: `export default function PressButton({ onPress }) {
  return <button>Нажми</button>;
}
`,
  solution: `export default function PressButton({ onPress }) {
  return <button onClick={onPress}>Нажми</button>;
}`,
  hint: 'У кнопки атрибут onClick={onPress} — без круглых скобок после onPress.',
  checks: [
    { name: 'есть кнопка «Нажми»', fn: async (c) => { await c.render({ onPress: () => {} }); c.btn('Нажми'); return true; } },
    { name: 'до клика onPress не вызывается', fn: async (c) => { let n = 0; await c.render({ onPress: () => { n++; } }); return n === 0 ? true : 'onPress вызвался ' + n + ' раз(а) ещё до клика: передай функцию, а не вызывай её'; } },
    { name: 'клик вызывает onPress один раз', fn: async (c) => { let n = 0; await c.render({ onPress: () => { n++; } }); await c.click(c.btn('Нажми')); return c.want(n, 1, 'вызовов onPress после одного клика'); } },
  ] },

{ id: 'p07', topic: 'props', level: 4, title: 'Проп-объект',
  text: 'Проп может быть объектом. Компонент Profile получает проп user с полями name и city. Выведи h2 с именем и абзац «Город: …».',
  example: `export default function Order({ order }) {
  return (
    <p>
      Заказ №{order.id}: {order.total} ₽
    </p>
  );
}

// <Order order={{ id: 7, total: 500 }} />
// сам объект целиком в JSX вывести нельзя, только его поля`,
  methods: ['user.name', '{ user }'],
  props: { user: { name: 'Артур', city: 'Берлин' } },
  starter: `export default function Profile({ user }) {
  return (
    <div className="card">
      <h2></h2>
      <p>Город:</p>
    </div>
  );
}
`,
  solution: `export default function Profile({ user }) {
  return (
    <div className="card">
      <h2>{user.name}</h2>
      <p>Город: {user.city}</p>
    </div>
  );
}`,
  hint: 'Поля объекта: {user.name} и {user.city}.',
  checks: [
    { name: 'в h2 имя пользователя', fn: async (c) => { await c.render({ user: { name: 'Ира', city: 'Минск' } }); return c.want(c.txt(c.$('h2')), 'Ира', 'текст h2'); } },
    { name: 'в абзаце «Город: Минск»', fn: async (c) => { await c.render({ user: { name: 'Ира', city: 'Минск' } }); return c.want(c.txt(c.$('p')), 'Город: Минск', 'текст p'); } },
  ] },

/* ================= УСЛОВИЯ И СПИСКИ ================= */
{ id: 'l01', topic: 'list', level: 1, title: 'Тернарный оператор',
  text: 'В JSX нет if, но есть тернарный оператор. Компонент Status получает булев проп online. Выведи абзац «В сети», если online равен true, и «Не в сети», если false.',
  example: `export default function Door({ open }) {
  return <p>{open ? 'Открыто' : 'Закрыто'}</p>;
}

// условие ? значение-если-да : значение-если-нет`,
  methods: ['условие ? a : b'],
  props: { online: true },
  starter: `export default function Status({ online }) {
  return <p>В сети</p>;
}
`,
  solution: `export default function Status({ online }) {
  return <p>{online ? 'В сети' : 'Не в сети'}</p>;
}`,
  hint: "Внутри абзаца: {online ? 'В сети' : 'Не в сети'}.",
  checks: [
    { name: 'online={true}: «В сети»', fn: async (c) => { await c.render({ online: true }); return c.want(c.txt(c.$('p')), 'В сети', 'текст'); } },
    { name: 'online={false}: «Не в сети»', fn: async (c) => { await c.render({ online: false }); return c.want(c.txt(c.$('p')), 'Не в сети', 'текст'); } },
  ] },

{ id: 'l02', topic: 'list', level: 2, title: 'Класс по условию',
  text: 'Тернарный оператор работает и в атрибутах. Компонент Tab получает label и булев active. Выведи кнопку с текстом label: у неё всегда класс tab, а если active равен true — ещё и класс active.',
  example: `export default function Row({ text, done }) {
  return <li className={done ? 'row done' : 'row'}>{text}</li>;
}

// className получает одну из двух строк`,
  methods: ['className={… ? … : …}'],
  props: { label: 'Главная', active: true },
  starter: `export default function Tab({ label, active }) {
  return <button className="tab">{label}</button>;
}
`,
  solution: `export default function Tab({ label, active }) {
  return <button className={active ? 'tab active' : 'tab'}>{label}</button>;
}`,
  hint: "className={active ? 'tab active' : 'tab'}.",
  checks: [
    { name: 'текст кнопки берётся из label', fn: async (c) => { await c.render({ label: 'Профиль', active: false }); return c.want(c.txt(c.$('button')), 'Профиль', 'текст кнопки'); } },
    { name: 'active={true}: классы tab и active', fn: async (c) => { await c.render({ label: 'A', active: true }); const l = c.$('button').classList; return l.contains('tab') && l.contains('active') ? true : 'классы сейчас: «' + c.$('button').className + '»'; } },
    { name: 'active={false}: только tab', fn: async (c) => { await c.render({ label: 'A', active: false }); const l = c.$('button').classList; return l.contains('tab') && !l.contains('active') ? true : 'классы сейчас: «' + c.$('button').className + '»'; } },
  ] },

{ id: 'l03', topic: 'list', level: 2, title: 'Показать или нет: &&',
  text: 'Когда нужно показать что-то или не показывать ничего, используют &&. Компонент Cart получает число count. Всегда выводи h2 «Корзина», а span с классом badge и числом внутри — только если count больше нуля.',
  example: `export default function Mail({ unread }) {
  return (
    <div>
      <h3>Почта</h3>
      {unread > 0 && <b>Новых: {unread}</b>}
    </div>
  );
}

// слева от && должно быть true или false.
// {unread && <b>…</b>} при unread = 0 вывел бы на страницу сам ноль`,
  methods: ['{условие && <тег />}'],
  props: { count: 3 },
  starter: `export default function Cart({ count }) {
  return (
    <div>
      <h2>Корзина</h2>
      <span className="badge">{count}</span>
    </div>
  );
}
`,
  solution: `export default function Cart({ count }) {
  return (
    <div>
      <h2>Корзина</h2>
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
}`,
  hint: '{count > 0 && <span className="badge">{count}</span>}. Именно count > 0, а не просто count.',
  checks: [
    { name: 'заголовок «Корзина» есть всегда', fn: async (c) => { await c.render({ count: 0 }); return c.want(c.txt(c.$('h2')), 'Корзина', 'текст h2'); } },
    { name: 'count={3}: значок с числом 3', fn: async (c) => { await c.render({ count: 3 }); return c.want(c.txt(c.$('span.badge')), '3', 'текст значка'); } },
    { name: 'count={0}: значка нет', fn: async (c) => { await c.render({ count: 0 }); return c.q('span.badge') ? 'при count = 0 значок всё равно показан' : true; } },
    { name: 'count={0}: на странице нет лишнего нуля', fn: async (c) => { await c.render({ count: 0 }); return c.want(c.txt(), 'Корзина', 'весь текст компонента'); } },
  ] },

{ id: 'l04', topic: 'list', level: 2, title: 'Ничего не показывать',
  text: 'Компонент может вернуть null, и тогда на странице не появится ничего. Компонент Alert получает проп message. Если message пустой или его нет, верни null. Иначе выведи div с классом alert и текстом сообщения.',
  example: `export default function Tip({ text }) {
  if (!text) {
    return null;
  }
  return <small>{text}</small>;
}

// обычный if до return: ранний выход из функции`,
  methods: ['if (!x) return null'],
  props: { message: 'Файл не найден' },
  starter: `export default function Alert({ message }) {
  return <div className="alert">{message}</div>;
}
`,
  solution: `export default function Alert({ message }) {
  if (!message) {
    return null;
  }
  return <div className="alert">{message}</div>;
}`,
  hint: 'Первой строкой в функции: if (!message) return null;',
  checks: [
    { name: 'с сообщением: div.alert с текстом', fn: async (c) => { await c.render({ message: 'Ошибка сети' }); return c.want(c.txt(c.$('div.alert')), 'Ошибка сети', 'текст'); } },
    { name: 'с пустой строкой: на странице пусто', fn: async (c) => { await c.render({ message: '' }); return c.root.children.length === 0 ? true : 'при пустом message на странице остался элемент'; } },
    { name: 'без пропа: на странице пусто', fn: async (c) => { await c.render({}); return c.root.children.length === 0 ? true : 'без message на странице остался элемент'; } },
  ] },

{ id: 'l05', topic: 'list', level: 3, title: 'Список через map',
  text: 'Массив превращают в список тегов методом map. Компонент Fruits получает массив строк items. Выведи ul, в котором для каждой строки свой li.',
  example: `export default function Tags({ tags }) {
  return (
    <p>
      {tags.map((tag) => (
        <span key={tag}>#{tag} </span>
      ))}
    </p>
  );
}

// map возвращает массив тегов, React выводит их по порядку.
// key — метка, по которой React различает элементы списка`,
  methods: ['items.map(…)', 'key={…}'],
  props: { items: ['яблоко', 'груша', 'слива'] },
  starter: `export default function Fruits({ items }) {
  return (
    <ul>
      <li>яблоко</li>
    </ul>
  );
}
`,
  solution: `export default function Fruits({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}`,
  hint: 'Внутри ul: {items.map((item) => <li key={item}>{item}</li>)}.',
  checks: [
    { name: 'три фрукта: три li', fn: async (c) => { await c.render({ items: ['яблоко', 'груша', 'слива'] }); return c.want(c.texts('ul > li').join(', '), 'яблоко, груша, слива', 'пункты списка'); } },
    { name: 'другой массив: другой список', fn: async (c) => { await c.render({ items: ['киви', 'манго'] }); return c.want(c.texts('ul > li').join(', '), 'киви, манго', 'пункты списка'); } },
    { name: 'пустой массив: ul без пунктов', fn: async (c) => { await c.render({ items: [] }); return c.q('ul') && c.qa('li').length === 0 ? true : 'для пустого массива должно остаться пустое ul'; } },
  ] },

{ id: 'l06', topic: 'list', level: 3, title: 'key из id',
  text: 'React требует у каждого элемента списка уникальный key: по нему он понимает, какой элемент изменился. Лучший key — id из данных. Компонент Users получает массив объектов { id, name }. Выведи список имён так, чтобы React не выдавал предупреждение про key.',
  example: `export default function Songs({ songs }) {
  return (
    <ol>
      {songs.map((song) => (
        <li key={song.id}>{song.title}</li>
      ))}
    </ol>
  );
}

// key ставится на самый внешний тег внутри map`,
  methods: ['key={user.id}'],
  props: { users: [{ id: 1, name: 'Аня' }, { id: 2, name: 'Борис' }, { id: 3, name: 'Вика' }] },
  starter: `export default function Users({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li>{user.name}</li>
      ))}
    </ul>
  );
}
`,
  solution: `export default function Users({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
  hint: 'Добавь тегу li атрибут key={user.id}.',
  checks: [
    { name: 'имена выведены списком', fn: async (c) => { await c.render({ users: [{ id: 7, name: 'Глеб' }, { id: 9, name: 'Дина' }] }); return c.want(c.texts('ul > li').join(', '), 'Глеб, Дина', 'пункты списка'); } },
    { name: 'React не предупреждает про key', fn: async (c) => (c.warned('unique "key"') ? 'React предупреждает: у элементов списка нет key' : true) },
    { name: 'key взят из id', fn: async (c) => (/key=\{\s*\w+\.id\s*\}/.test(c.code) ? true : 'ожидаю key={user.id}: id из данных надёжнее, чем индекс или имя') },
  ] },

{ id: 'l07', topic: 'list', level: 3, title: 'filter перед map',
  text: 'Перед map массив можно отфильтровать. Компонент Todo получает массив tasks из объектов { id, title, done }. Выведи списком только невыполненные задачи (done равен false).',
  example: `export default function Adults({ people }) {
  return (
    <ul>
      {people
        .filter((person) => person.age >= 18)
        .map((person) => (
          <li key={person.id}>{person.name}</li>
        ))}
    </ul>
  );
}`,
  methods: ['.filter(…).map(…)'],
  props: { tasks: [{ id: 1, title: 'Сделать debounce', done: true }, { id: 2, title: 'Написать тесты', done: false }, { id: 3, title: 'Открыть PR', done: false }] },
  starter: `export default function Todo({ tasks }) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
`,
  solution: `export default function Todo({ tasks }) {
  return (
    <ul>
      {tasks
        .filter((task) => !task.done)
        .map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
    </ul>
  );
}`,
  hint: 'Между tasks и .map вставь .filter((task) => !task.done).',
  checks: [
    { name: 'показаны только невыполненные', fn: async (c) => { await c.render({ tasks: [{ id: 1, title: 'A', done: true }, { id: 2, title: 'B', done: false }, { id: 3, title: 'C', done: false }] }); return c.want(c.texts('li').join(', '), 'B, C', 'пункты списка'); } },
    { name: 'все выполнены: пунктов нет', fn: async (c) => { await c.render({ tasks: [{ id: 1, title: 'A', done: true }] }); return c.want(c.qa('li').length, 0, 'количество li'); } },
  ] },

{ id: 'l08', topic: 'list', level: 4, title: 'Пустой список',
  text: 'Пустой список лучше заменить понятным сообщением. Компонент Results получает массив строк items. Если массив пустой, выведи абзац «Ничего не найдено». Иначе выведи ul со списком.',
  example: `export default function Inbox({ letters }) {
  if (letters.length === 0) {
    return <p>Писем нет</p>;
  }
  return (
    <ul>
      {letters.map((letter) => (
        <li key={letter}>{letter}</li>
      ))}
    </ul>
  );
}

// можно и через тернарный оператор: {letters.length === 0 ? … : …}`,
  methods: ['items.length === 0'],
  props: { items: [] },
  starter: `export default function Results({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
`,
  solution: `export default function Results({ items }) {
  if (items.length === 0) {
    return <p>Ничего не найдено</p>;
  }
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}`,
  hint: 'До основного return: if (items.length === 0) return <p>Ничего не найдено</p>;',
  checks: [
    { name: 'пустой массив: абзац «Ничего не найдено»', fn: async (c) => { await c.render({ items: [] }); return c.q('p') ? c.want(c.txt(c.$('p')), 'Ничего не найдено', 'текст') : 'абзаца с сообщением нет'; } },
    { name: 'пустой массив: списка нет', fn: async (c) => { await c.render({ items: [] }); return c.q('ul') ? 'при пустом массиве ul всё равно выведен' : true; } },
    { name: 'непустой массив: список без сообщения', fn: async (c) => { await c.render({ items: ['Минск', 'Берлин'] }); return c.q('p') ? 'сообщение показано, хотя список не пустой' : c.want(c.texts('li').join(', '), 'Минск, Берлин', 'пункты списка'); } },
  ] },

{ id: 'l09', topic: 'list', level: 5, title: 'Список компонентов',
  text: 'В map можно возвращать не теги, а свои компоненты. Компонент Item готов. Напиши TodoList: он получает массив todos из объектов { id, title, done } и выводит ul, где для каждой задачи стоит Item с пропсами title и done.',
  example: `function Price({ label, value }) {
  return (
    <p>
      {label}: {value} ₽
    </p>
  );
}

export default function PriceList({ rows }) {
  return (
    <div>
      {rows.map((row) => (
        <Price key={row.id} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

// key ставится на компонент в map, а не на тег внутри него`,
  methods: ['<Item key={…} … />'],
  props: { todos: [{ id: 1, title: 'Прочитать задание', done: true }, { id: 2, title: 'Написать код', done: false }] },
  starter: `function Item({ title, done }) {
  return <li className={done ? 'done' : ''}>{title}</li>;
}

export default function TodoList({ todos }) {
  return <ul></ul>;
}
`,
  solution: `function Item({ title, done }) {
  return <li className={done ? 'done' : ''}>{title}</li>;
}

export default function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <Item key={todo.id} title={todo.title} done={todo.done} />
      ))}
    </ul>
  );
}`,
  hint: '{todos.map((todo) => <Item key={todo.id} title={todo.title} done={todo.done} />)}.',
  checks: [
    { name: 'для каждой задачи свой пункт', fn: async (c) => { await c.render({ todos: [{ id: 1, title: 'A', done: true }, { id: 2, title: 'B', done: false }, { id: 3, title: 'C', done: true }] }); return c.want(c.texts('ul > li').join(', '), 'A, B, C', 'пункты списка'); } },
    { name: 'выполненные получили класс done', fn: async (c) => { await c.render({ todos: [{ id: 1, title: 'A', done: true }, { id: 2, title: 'B', done: false }, { id: 3, title: 'C', done: true }] }); return c.want(c.qa('li').map((l) => (l.classList.contains('done') ? 'да' : 'нет')).join(', '), 'да, нет, да', 'класс done по пунктам'); } },
    { name: 'React не предупреждает про key', fn: async (c) => (c.warned('unique "key"') ? 'React предупреждает: у Item в map нет key' : true) },
    { name: 'использован компонент Item', fn: async (c) => (/<Item\b/.test(c.code.split('export default')[1] || '') ? true : 'в TodoList не вижу <Item … />') },
  ] },

/* ================= СОСТОЯНИЕ ================= */
{ id: 's01', topic: 'state', level: 1, title: 'Счётчик',
  text: 'Состояние — это память компонента. useState возвращает пару: текущее значение и функцию, которая его меняет. Когда значение меняется, React перерисовывает компонент. Сделай абзац «Счёт: 0» и кнопку «+1», которая увеличивает счёт на 1.',
  example: `import { useState } from 'react';

export default function Likes() {
  const [likes, setLikes] = useState(10);
  return (
    <div>
      <p>Лайков: {likes}</p>
      <button onClick={() => setLikes(likes + 1)}>Нравится</button>
    </div>
  );
}

// useState(10): начальное значение 10.
// обычную переменную менять бесполезно: React не узнает и не перерисует`,
  methods: ['useState(0)', 'onClick={() => …}'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <p>Счёт: 0</p>
      <button>+1</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}`,
  hint: 'const [count, setCount] = useState(0); в абзаце {count}; у кнопки onClick={() => setCount(count + 1)}.',
  checks: [
    { name: 'сначала «Счёт: 0»', fn: async (c) => c.want(c.txt(c.$('p')), 'Счёт: 0', 'текст') },
    { name: 'после клика «Счёт: 1»', fn: async (c) => { await c.click(c.btn('+1')); return c.want(c.txt(c.$('p')), 'Счёт: 1', 'текст после клика'); } },
    { name: 'после трёх кликов «Счёт: 3»', fn: async (c) => { for (let i = 0; i < 3; i++) await c.click(c.btn('+1')); return c.want(c.txt(c.$('p')), 'Счёт: 3', 'текст после трёх кликов'); } },
  ] },

{ id: 's02', topic: 'state', level: 2, title: 'Две кнопки',
  text: 'Одно состояние могут менять несколько кнопок. К счётчику добавь кнопку «Сброс», которая возвращает счёт к нулю.',
  example: `import { useState } from 'react';

export default function Volume() {
  const [level, setLevel] = useState(5);
  return (
    <div>
      <p>Громкость: {level}</p>
      <button onClick={() => setLevel(level + 1)}>Громче</button>
      <button onClick={() => setLevel(10)}>Максимум</button>
    </div>
  );
}

// в set-функцию можно передать любое новое значение`,
  methods: ['setCount(0)'],
  starter: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Сброс</button>
    </div>
  );
}`,
  hint: 'Вторая кнопка: <button onClick={() => setCount(0)}>Сброс</button>.',
  checks: [
    { name: 'кнопка «+1» считает', fn: async (c) => { await c.click(c.btn('+1')); await c.click(c.btn('+1')); return c.want(c.txt(c.$('p')), 'Счёт: 2', 'текст'); } },
    { name: 'кнопка «Сброс» обнуляет', fn: async (c) => { await c.click(c.btn('+1')); await c.click(c.btn('+1')); await c.click(c.btn('Сброс')); return c.want(c.txt(c.$('p')), 'Счёт: 0', 'текст после сброса'); } },
    { name: 'после сброса счёт идёт заново', fn: async (c) => { await c.click(c.btn('+1')); await c.click(c.btn('Сброс')); await c.click(c.btn('+1')); return c.want(c.txt(c.$('p')), 'Счёт: 1', 'текст'); } },
  ] },

{ id: 's03', topic: 'state', level: 2, title: 'Показать и скрыть',
  text: 'В состоянии может лежать true или false. Сделай кнопку «Показать ответ». По клику под ней появляется абзац «42», а текст кнопки меняется на «Скрыть ответ». Следующий клик прячет абзац обратно.',
  example: `import { useState } from 'react';

export default function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}>Меню</button>
      {open && <p>Пункты меню</p>}
    </div>
  );
}

// !open переворачивает значение: true в false и обратно`,
  methods: ['useState(false)', 'setX(!x)', '&&'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <button>Показать ответ</button>
      <p>42</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <button onClick={() => setShown(!shown)}>{shown ? 'Скрыть ответ' : 'Показать ответ'}</button>
      {shown && <p>42</p>}
    </div>
  );
}`,
  hint: "Состояние shown (false). Кнопка: setShown(!shown), текст через тернарный оператор. Абзац: {shown && <p>42</p>}.",
  checks: [
    { name: 'сначала абзаца нет, кнопка «Показать ответ»', fn: async (c) => (c.q('p') ? 'абзац виден сразу, а должен появиться по клику' : c.want(c.txt(c.$('button')), 'Показать ответ', 'текст кнопки')) },
    { name: 'после клика виден абзац «42», кнопка «Скрыть ответ»', fn: async (c) => { await c.click('button'); if (!c.q('p')) return 'после клика абзац не появился'; return c.want(c.txt(c.$('p')) + ' / ' + c.txt(c.$('button')), '42 / Скрыть ответ', 'абзац / кнопка'); } },
    { name: 'второй клик снова прячет', fn: async (c) => { await c.click('button'); await c.click('button'); return c.q('p') ? 'после второго клика абзац остался' : c.want(c.txt(c.$('button')), 'Показать ответ', 'текст кнопки'); } },
  ] },

{ id: 's04', topic: 'state', level: 2, title: 'Выбор из вариантов',
  text: 'В состоянии может лежать строка. Сделай две кнопки, «Чай» и «Кофе», и абзац. Сначала в абзаце «Выбрано: ничего». После клика по кнопке в абзаце «Выбрано: Чай» или «Выбрано: Кофе».',
  example: `import { useState } from 'react';

export default function Theme() {
  const [theme, setTheme] = useState('светлая');
  return (
    <div>
      <button onClick={() => setTheme('светлая')}>Светлая</button>
      <button onClick={() => setTheme('тёмная')}>Тёмная</button>
      <p>Тема: {theme}</p>
    </div>
  );
}`,
  methods: ["useState('…')"],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <button>Чай</button>
      <button>Кофе</button>
      <p>Выбрано: ничего</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [drink, setDrink] = useState('ничего');
  return (
    <div>
      <button onClick={() => setDrink('Чай')}>Чай</button>
      <button onClick={() => setDrink('Кофе')}>Кофе</button>
      <p>Выбрано: {drink}</p>
    </div>
  );
}`,
  hint: "useState('ничего'). Каждая кнопка кладёт в состояние свою строку.",
  checks: [
    { name: 'сначала «Выбрано: ничего»', fn: async (c) => c.want(c.txt(c.$('p')), 'Выбрано: ничего', 'текст') },
    { name: 'клик по «Чай»', fn: async (c) => { await c.click(c.btn('Чай')); return c.want(c.txt(c.$('p')), 'Выбрано: Чай', 'текст'); } },
    { name: 'потом клик по «Кофе»', fn: async (c) => { await c.click(c.btn('Чай')); await c.click(c.btn('Кофе')); return c.want(c.txt(c.$('p')), 'Выбрано: Кофе', 'текст'); } },
  ] },

{ id: 's05', topic: 'state', level: 3, title: 'Два состояния',
  text: 'У компонента может быть несколько состояний, и они не зависят друг от друга. Сделай две кнопки: «👍 0» и «👎 0». Клик по каждой увеличивает только её число.',
  example: `import { useState } from 'react';

export default function Score() {
  const [home, setHome] = useState(0);
  const [guest, setGuest] = useState(0);
  return (
    <p>
      <button onClick={() => setHome(home + 1)}>Хозяева: {home}</button>
      <button onClick={() => setGuest(guest + 1)}>Гости: {guest}</button>
    </p>
  );
}`,
  methods: ['два useState'],
  starter: `import { useState } from 'react';

export default function App() {
  const [likes, setLikes] = useState(0);
  return (
    <div>
      <button onClick={() => setLikes(likes + 1)}>👍 {likes}</button>
      <button onClick={() => setLikes(likes + 1)}>👎 {likes}</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  return (
    <div>
      <button onClick={() => setLikes(likes + 1)}>👍 {likes}</button>
      <button onClick={() => setDislikes(dislikes + 1)}>👎 {dislikes}</button>
    </div>
  );
}`,
  hint: 'Заведи второе состояние: const [dislikes, setDislikes] = useState(0), и переведи на него вторую кнопку.',
  checks: [
    { name: 'сначала «👍 0» и «👎 0»', fn: async (c) => c.want(c.texts('button').join(' | '), '👍 0 | 👎 0', 'кнопки') },
    { name: 'два клика по 👍 не трогают 👎', fn: async (c) => { const b = c.qa('button'); await c.click(b[0]); await c.click(b[0]); return c.want(c.texts('button').join(' | '), '👍 2 | 👎 0', 'кнопки'); } },
    { name: 'клик по 👎 не трогает 👍', fn: async (c) => { const b = c.qa('button'); await c.click(b[0]); await c.click(b[1]); await c.click(b[1]); await c.click(b[1]); return c.want(c.texts('button').join(' | '), '👍 1 | 👎 3', 'кнопки'); } },
  ] },

{ id: 's06', topic: 'state', level: 3, title: 'Объект в состоянии',
  text: 'Объект в состоянии нельзя менять на месте: нужно собрать новый объект. Старые поля копируют через …. В заготовке кнопка «Старше» ломает имя. Исправь её: возраст должен расти на 1, а имя оставаться.',
  example: `import { useState } from 'react';

export default function Box() {
  const [size, setSize] = useState({ width: 100, height: 50 });
  return (
    <div>
      <p>
        {size.width} × {size.height}
      </p>
      <button onClick={() => setSize({ ...size, width: size.width + 10 })}>Шире</button>
    </div>
  );
}

// { ...size, width: … } — новый объект: все старые поля плюс новое width`,
  methods: ['{ ...user, age: … }'],
  starter: `import { useState } from 'react';

export default function App() {
  const [user, setUser] = useState({ name: 'Аня', age: 20 });
  return (
    <div>
      <p>
        {user.name}, {user.age}
      </p>
      <button onClick={() => setUser({ age: user.age + 1 })}>Старше</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [user, setUser] = useState({ name: 'Аня', age: 20 });
  return (
    <div>
      <p>
        {user.name}, {user.age}
      </p>
      <button onClick={() => setUser({ ...user, age: user.age + 1 })}>Старше</button>
    </div>
  );
}`,
  hint: 'В новый объект сначала скопируй старый: setUser({ ...user, age: user.age + 1 }).',
  checks: [
    { name: 'сначала «Аня, 20»', fn: async (c) => c.want(c.txt(c.$('p')), 'Аня, 20', 'текст') },
    { name: 'после клика «Аня, 21»', fn: async (c) => { await c.click(c.btn('Старше')); return c.want(c.txt(c.$('p')), 'Аня, 21', 'текст после клика'); } },
    { name: 'после трёх кликов «Аня, 23»', fn: async (c) => { for (let i = 0; i < 3; i++) await c.click(c.btn('Старше')); return c.want(c.txt(c.$('p')), 'Аня, 23', 'текст'); } },
  ] },

{ id: 's07', topic: 'state', level: 4, title: 'Добавить в массив',
  text: 'С массивом в состоянии то же правило: push менять его на месте не должен, нужен новый массив. В заготовке кнопка «Добавить» не работает. Исправь: каждый клик добавляет в конец списка пункт «Пункт 1», «Пункт 2» и так далее.',
  example: `import { useState } from 'react';

export default function Log() {
  const [lines, setLines] = useState(['старт']);
  return (
    <div>
      <button onClick={() => setLines([...lines, 'клик'])}>Записать</button>
      <p>{lines.join(', ')}</p>
    </div>
  );
}

// [...lines, 'клик'] — новый массив: все старые элементы и один новый.
// lines.push('клик') изменил бы старый массив, и React не заметил бы разницы`,
  methods: ['[...items, новый]'],
  starter: `import { useState } from 'react';

export default function App() {
  const [items, setItems] = useState([]);

  function add() {
    items.push('Пункт ' + (items.length + 1));
    setItems(items);
  }

  return (
    <div>
      <button onClick={add}>Добавить</button>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [items, setItems] = useState([]);

  function add() {
    setItems([...items, 'Пункт ' + (items.length + 1)]);
  }

  return (
    <div>
      <button onClick={add}>Добавить</button>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}`,
  hint: "Вместо push: setItems([...items, 'Пункт ' + (items.length + 1)]).",
  checks: [
    { name: 'сначала список пуст', fn: async (c) => c.want(c.qa('li').length, 0, 'количество пунктов') },
    { name: 'после клика появился «Пункт 1»', fn: async (c) => { await c.click(c.btn('Добавить')); return c.want(c.texts('li').join(', '), 'Пункт 1', 'пункты'); } },
    { name: 'после трёх кликов три пункта по порядку', fn: async (c) => { for (let i = 0; i < 3; i++) await c.click(c.btn('Добавить')); return c.want(c.texts('li').join(', '), 'Пункт 1, Пункт 2, Пункт 3', 'пункты'); } },
  ] },

{ id: 's08', topic: 'state', level: 4, title: 'Удалить из массива',
  text: 'Удаляют из массива в состоянии через filter: он возвращает новый массив без лишнего элемента. В списке напитков у каждого пункта есть кнопка «×». Сделай так, чтобы она удаляла свой пункт.',
  example: `import { useState } from 'react';

export default function Guests() {
  const [guests, setGuests] = useState(['Аня', 'Борис']);
  return (
    <div>
      {guests.map((guest) => (
        <p key={guest}>
          {guest} <button onClick={() => setGuests(guests.filter((g) => g !== guest))}>Убрать</button>
        </p>
      ))}
    </div>
  );
}

// filter оставляет всех, кто не равен удаляемому`,
  methods: ['items.filter(…)'],
  starter: `import { useState } from 'react';

export default function App() {
  const [drinks, setDrinks] = useState(['Чай', 'Кофе', 'Сок']);
  return (
    <ul>
      {drinks.map((drink) => (
        <li key={drink}>
          <span>{drink}</span> <button>×</button>
        </li>
      ))}
    </ul>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [drinks, setDrinks] = useState(['Чай', 'Кофе', 'Сок']);
  return (
    <ul>
      {drinks.map((drink) => (
        <li key={drink}>
          <span>{drink}</span> <button onClick={() => setDrinks(drinks.filter((d) => d !== drink))}>×</button>
        </li>
      ))}
    </ul>
  );
}`,
  hint: 'У кнопки: onClick={() => setDrinks(drinks.filter((d) => d !== drink))}.',
  checks: [
    { name: 'сначала три напитка', fn: async (c) => c.want(c.texts('li span').join(', '), 'Чай, Кофе, Сок', 'список') },
    { name: 'кнопка у «Кофе» удаляет «Кофе»', fn: async (c) => { await c.click(c.qa('li button')[1]); return c.want(c.texts('li span').join(', '), 'Чай, Сок', 'список'); } },
    { name: 'можно удалить всё', fn: async (c) => { for (let i = 0; i < 3; i++) await c.click(c.qa('li button')[0]); return c.want(c.qa('li').length, 0, 'осталось пунктов'); } },
  ] },

{ id: 's09', topic: 'state', level: 5, title: 'Вкладки',
  text: 'Собери вкладки. Три кнопки: «Главная», «Профиль», «Настройки». У выбранной кнопки класс active, у остальных его нет. Под кнопками абзац «Раздел: …» с названием выбранной вкладки. Сначала выбрана «Главная».',
  example: `import { useState } from 'react';

const SIZES = ['S', 'M', 'L'];

export default function SizePicker() {
  const [size, setSize] = useState('M');
  return (
    <div>
      {SIZES.map((s) => (
        <button key={s} className={s === size ? 'active' : ''} onClick={() => setSize(s)}>
          {s}
        </button>
      ))}
      <p>Размер: {size}</p>
    </div>
  );
}

// в состоянии хранится только то, что выбрано. Класс вычисляется при отрисовке`,
  methods: ['useState', 'map', 'className по условию'],
  starter: `import { useState } from 'react';

const TABS = ['Главная', 'Профиль', 'Настройки'];

export default function App() {
  return (
    <div>
      <p>Раздел: Главная</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

const TABS = ['Главная', 'Профиль', 'Настройки'];

export default function App() {
  const [tab, setTab] = useState('Главная');
  return (
    <div>
      {TABS.map((name) => (
        <button key={name} className={name === tab ? 'active' : ''} onClick={() => setTab(name)}>
          {name}
        </button>
      ))}
      <p>Раздел: {tab}</p>
    </div>
  );
}`,
  hint: "Состояние tab ('Главная'). Кнопки через TABS.map; className={name === tab ? 'active' : ''}; onClick={() => setTab(name)}.",
  checks: [
    { name: 'три кнопки с нужными названиями', fn: async (c) => c.want(c.texts('button').join(', '), 'Главная, Профиль, Настройки', 'кнопки') },
    { name: 'сначала выбрана «Главная»', fn: async (c) => { const a = c.qa('button.active').map((b) => c.txt(b)).join(', '); return a !== 'Главная' ? 'класс active сейчас у: ' + (a || 'ни у кого') : c.want(c.txt(c.$('p')), 'Раздел: Главная', 'абзац'); } },
    { name: 'клик по «Профиль» переключает вкладку', fn: async (c) => { await c.click(c.btn('Профиль')); const a = c.qa('button.active').map((b) => c.txt(b)).join(', '); return a !== 'Профиль' ? 'класс active сейчас у: ' + (a || 'ни у кого') : c.want(c.txt(c.$('p')), 'Раздел: Профиль', 'абзац'); } },
    { name: 'активная вкладка всегда одна', fn: async (c) => { await c.click(c.btn('Настройки')); await c.click(c.btn('Профиль')); await c.click(c.btn('Настройки')); return c.want(c.qa('button.active').map((b) => c.txt(b)).join(', '), 'Настройки', 'кнопки с классом active'); } },
    { name: 'React не предупреждает про key', fn: async (c) => (c.warned('unique "key"') ? 'React предупреждает: у кнопок в map нет key' : true) },
  ] },

/* ================= СОБЫТИЯ И ФОРМЫ ================= */
{ id: 'f01', topic: 'form', level: 1, title: 'Управляемое поле',
  text: 'В React значением поля управляет состояние: value берётся из состояния, а onChange кладёт туда новый текст. Сделай поле ввода и под ним абзац «Привет, ИМЯ!», который меняется при каждой букве. Сначала поле пустое, а в абзаце «Привет, !».',
  example: `import { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <p>Ищем: {query}</p>
    </div>
  );
}

// event.target — само поле, event.target.value — текст в нём`,
  methods: ['value={…}', 'onChange', 'event.target.value'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <input />
      <p>Привет, !</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [name, setName] = useState('');
  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <p>Привет, {name}!</p>
    </div>
  );
}`,
  hint: "Состояние name (''). У поля: value={name} onChange={(event) => setName(event.target.value)}.",
  checks: [
    { name: 'сначала «Привет, !»', fn: async (c) => c.want(c.txt(c.$('p')), 'Привет, !', 'текст') },
    { name: 'печатаем «Артур»: «Привет, Артур!»', fn: async (c) => { await c.type('input', 'Артур'); return c.want(c.txt(c.$('p')), 'Привет, Артур!', 'текст'); } },
    { name: 'в поле остаётся введённый текст', fn: async (c) => { await c.type('input', 'Оля'); return c.want(c.$('input').value, 'Оля', 'значение поля'); } },
  ] },

{ id: 'f02', topic: 'form', level: 2, title: 'Счётчик символов',
  text: 'То, что можно вычислить из состояния, в отдельном состоянии хранить не нужно. Сделай textarea и абзац «Символов: N», где N — длина введённого текста.',
  example: `import { useState } from 'react';

export default function Shout() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <p>{text.toUpperCase()}</p>
    </div>
  );
}

// состояние одно — text. Всё остальное вычисляется из него при отрисовке`,
  methods: ['text.length'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <textarea />
      <p>Символов: 0</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <textarea value={text} onChange={(event) => setText(event.target.value)} />
      <p>Символов: {text.length}</p>
    </div>
  );
}`,
  hint: 'Состояние text; у textarea value и onChange; в абзаце {text.length}.',
  checks: [
    { name: 'сначала «Символов: 0»', fn: async (c) => c.want(c.txt(c.$('p')), 'Символов: 0', 'текст') },
    { name: '«React» — это 5 символов', fn: async (c) => { await c.type('textarea', 'React'); return c.want(c.txt(c.$('p')), 'Символов: 5', 'текст'); } },
    { name: 'стёрли всё: снова 0', fn: async (c) => { await c.type('textarea', 'abc'); await c.type('textarea', ''); return c.want(c.txt(c.$('p')), 'Символов: 0', 'текст'); } },
  ] },

{ id: 'f03', topic: 'form', level: 2, title: 'Строка или число',
  text: 'event.target.value — всегда строка, даже у поля type="number". Сделай два числовых поля с name="a" и name="b" и абзац «Сумма: N». Сначала поля пустые и сумма 0. Если ввести 2 и 3, должно получиться 5, а не 23.',
  example: `import { useState } from 'react';

export default function Double() {
  const [value, setValue] = useState('');
  return (
    <div>
      <input type="number" value={value} onChange={(event) => setValue(event.target.value)} />
      <p>Вдвое больше: {Number(value) * 2}</p>
    </div>
  );
}

// Number('7') даёт 7, Number('') даёт 0`,
  methods: ['Number(…)'],
  starter: `import { useState } from 'react';

export default function App() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return (
    <div>
      <input type="number" name="a" value={a} onChange={(event) => setA(event.target.value)} />
      <input type="number" name="b" value={b} onChange={(event) => setB(event.target.value)} />
      <p>Сумма: {a + b}</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return (
    <div>
      <input type="number" name="a" value={a} onChange={(event) => setA(event.target.value)} />
      <input type="number" name="b" value={b} onChange={(event) => setB(event.target.value)} />
      <p>Сумма: {Number(a) + Number(b)}</p>
    </div>
  );
}`,
  hint: 'Перед сложением преврати обе строки в числа: Number(a) + Number(b).',
  checks: [
    { name: 'пустые поля: «Сумма: 0»', fn: async (c) => c.want(c.txt(c.$('p')), 'Сумма: 0', 'текст') },
    { name: '2 и 3 дают 5', fn: async (c) => { await c.type('input[name="a"]', '2'); await c.type('input[name="b"]', '3'); return c.want(c.txt(c.$('p')), 'Сумма: 5', 'текст'); } },
    { name: '10 и 15 дают 25', fn: async (c) => { await c.type('input[name="a"]', '10'); await c.type('input[name="b"]', '15'); return c.want(c.txt(c.$('p')), 'Сумма: 25', 'текст'); } },
  ] },

{ id: 'f04', topic: 'form', level: 2, title: 'Флажок',
  text: 'У флажка состояние лежит не в value, а в checked: это true или false. Сделай флажок и абзац. Пока флажок снят, в абзаце «Нужно согласие». Когда поставлен — «Можно продолжать».',
  example: `import { useState } from 'react';

export default function Sound() {
  const [on, setOn] = useState(true);
  return (
    <label>
      <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} />
      Звук {on ? 'включён' : 'выключен'}
    </label>
  );
}

// у флажка читаем event.target.checked, а не value`,
  methods: ['checked={…}', 'event.target.checked'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <label>
        <input type="checkbox" /> Согласен с правилами
      </label>
      <p>Нужно согласие</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [agree, setAgree] = useState(false);
  return (
    <div>
      <label>
        <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} /> Согласен с правилами
      </label>
      <p>{agree ? 'Можно продолжать' : 'Нужно согласие'}</p>
    </div>
  );
}`,
  hint: 'Состояние agree (false). У флажка checked={agree} и onChange с event.target.checked. Текст абзаца через тернарный оператор.',
  checks: [
    { name: 'сначала флажок снят, «Нужно согласие»', fn: async (c) => (c.$('input[type="checkbox"]').checked ? 'флажок сразу поставлен' : c.want(c.txt(c.$('p')), 'Нужно согласие', 'текст')) },
    { name: 'поставили флажок: «Можно продолжать»', fn: async (c) => { await c.click('input[type="checkbox"]'); return c.want(c.txt(c.$('p')), 'Можно продолжать', 'текст'); } },
    { name: 'сняли: снова «Нужно согласие»', fn: async (c) => { await c.click('input[type="checkbox"]'); await c.click('input[type="checkbox"]'); return c.want(c.txt(c.$('p')), 'Нужно согласие', 'текст'); } },
  ] },

{ id: 'f05', topic: 'form', level: 3, title: 'Выпадающий список',
  text: 'select управляется так же, как input: value и onChange стоят на самом select. Сделай список с вариантами ru, en и de (value у option совпадает с текстом) и абзац «Язык: …». Сначала выбран ru.',
  example: `import { useState } from 'react';

export default function Sort() {
  const [order, setOrder] = useState('new');
  return (
    <div>
      <select value={order} onChange={(event) => setOrder(event.target.value)}>
        <option value="new">Сначала новые</option>
        <option value="old">Сначала старые</option>
      </select>
      <p>Порядок: {order}</p>
    </div>
  );
}

// в React выбранный вариант задаёт value у select, а не selected у option`,
  methods: ['<select value={…}>', '<option value="…">'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <select>
        <option value="ru">ru</option>
      </select>
      <p>Язык: ru</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [lang, setLang] = useState('ru');
  return (
    <div>
      <select value={lang} onChange={(event) => setLang(event.target.value)}>
        <option value="ru">ru</option>
        <option value="en">en</option>
        <option value="de">de</option>
      </select>
      <p>Язык: {lang}</p>
    </div>
  );
}`,
  hint: "Состояние lang ('ru'). У select value={lang} и onChange. Внутри три option.",
  checks: [
    { name: 'в списке три варианта: ru, en, de', fn: async (c) => c.want(c.qa('select option').map((o) => o.value).join(', '), 'ru, en, de', 'значения option') },
    { name: 'сначала «Язык: ru»', fn: async (c) => c.want(c.txt(c.$('p')) + ' / ' + c.$('select').value, 'Язык: ru / ru', 'абзац / выбрано') },
    { name: 'выбрали de: «Язык: de»', fn: async (c) => { await c.choose('select', 'de'); return c.want(c.txt(c.$('p')) + ' / ' + c.$('select').value, 'Язык: de / de', 'абзац / выбрано'); } },
  ] },

{ id: 'f06', topic: 'form', level: 3, title: 'Кнопка выключена',
  text: 'Атрибут disabled принимает true или false, и его удобно вычислять из состояния. Сделай поле и кнопку «Отправить». Пока в поле пусто или только пробелы, кнопка выключена.',
  example: `import { useState } from 'react';

export default function Promo() {
  const [code, setCode] = useState('');
  return (
    <div>
      <input value={code} onChange={(event) => setCode(event.target.value)} />
      <button disabled={code.length < 4}>Применить</button>
    </div>
  );
}

// disabled={true} выключает кнопку, disabled={false} включает`,
  methods: ['disabled={…}', 'trim()'],
  starter: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button>Отправить</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button disabled={text.trim() === ''}>Отправить</button>
    </div>
  );
}`,
  hint: "У кнопки: disabled={text.trim() === ''}. trim убирает пробелы по краям.",
  checks: [
    { name: 'пустое поле: кнопка выключена', fn: async (c) => (c.btn('Отправить').disabled ? true : 'при пустом поле кнопка активна') },
    { name: 'есть текст: кнопка включена', fn: async (c) => { await c.type('input', 'привет'); return c.btn('Отправить').disabled ? 'в поле есть текст, но кнопка выключена' : true; } },
    { name: 'только пробелы: кнопка выключена', fn: async (c) => { await c.type('input', '   '); return c.btn('Отправить').disabled ? true : 'в поле одни пробелы, а кнопка активна'; } },
  ] },

{ id: 'f07', topic: 'form', level: 3, title: 'Отправка формы',
  text: 'Форму обрабатывают в onSubmit на теге form: так работает и клик по кнопке, и Enter в поле. Браузер при отправке перезагружает страницу, поэтому первым делом вызывают event.preventDefault(). Сделай форму: после отправки под ней появляется абзац «Отправлено: ТЕКСТ».',
  example: `import { useState } from 'react';

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(event) => setEmail(event.target.value)} />
      <button>Подписаться</button>
      {done && <p>Готово</p>}
    </form>
  );
}`,
  methods: ['<form onSubmit={…}>', 'event.preventDefault()'],
  starter: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  return (
    <form>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button>Отправить</button>
      {sent && <p>Отправлено: {sent}</p>}
    </form>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setSent(text);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button>Отправить</button>
      {sent && <p>Отправлено: {sent}</p>}
    </form>
  );
}`,
  hint: 'Функция handleSubmit(event): сначала event.preventDefault(), потом setSent(text). На форме: onSubmit={handleSubmit}.',
  checks: [
    { name: 'до отправки абзаца нет', fn: async (c) => { await c.type('input', 'привет'); return c.q('p') ? 'абзац появился ещё до отправки' : true; } },
    { name: 'после отправки «Отправлено: привет»', fn: async (c) => { await c.type('input', 'привет'); await c.submit('form'); return c.q('p') ? c.want(c.txt(c.$('p')), 'Отправлено: привет', 'текст') : 'после отправки формы абзац не появился'; } },
    { name: 'перезагрузка страницы отменена', fn: async (c) => { await c.type('input', 'привет'); const p = await c.submit('form'); return p ? true : 'форма отправилась по-настоящему: вызови event.preventDefault()'; } },
  ] },

{ id: 'f08', topic: 'form', level: 4, title: 'Очистить поле',
  text: 'Раз поле управляется состоянием, очистить его просто: положить в состояние пустую строку. Доработай форму: после отправки текст попадает в абзац «Отправлено: …», а поле становится пустым.',
  example: `import { useState } from 'react';

export default function Chat() {
  const [text, setText] = useState('');
  const [last, setLast] = useState('');

  function send() {
    setLast(text);
    setText('');
  }

  return (
    <div>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button onClick={send}>→</button>
      <p>{last}</p>
    </div>
  );
}`,
  methods: ["setText('')"],
  starter: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setSent(text);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button>Отправить</button>
      {sent && <p>Отправлено: {sent}</p>}
    </form>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setSent(text);
    setText('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      <button>Отправить</button>
      {sent && <p>Отправлено: {sent}</p>}
    </form>
  );
}`,
  hint: "В handleSubmit после setSent(text) добавь setText('').",
  checks: [
    { name: 'текст попал в абзац', fn: async (c) => { await c.type('input', 'раз'); await c.submit('form'); return c.q('p') ? c.want(c.txt(c.$('p')), 'Отправлено: раз', 'текст') : 'абзаца нет'; } },
    { name: 'поле после отправки пустое', fn: async (c) => { await c.type('input', 'раз'); await c.submit('form'); return c.want(c.$('input').value, '', 'значение поля'); } },
    { name: 'вторая отправка заменяет текст', fn: async (c) => { await c.type('input', 'раз'); await c.submit('form'); await c.type('input', 'два'); await c.submit('form'); return c.want(c.txt(c.$('p')) + ' / ' + c.$('input').value, 'Отправлено: два / ', 'абзац / поле'); } },
  ] },

{ id: 'f09', topic: 'form', level: 5, title: 'Список дел',
  text: 'Собери всё вместе. Форма с полем и кнопкой «Добавить», под ней список ul. Отправка формы добавляет текст поля в конец списка и очищает поле. Пробелы по краям обрезаются. Пустой текст (или из одних пробелов) не добавляется.',
  example: `import { useState } from 'react';

export default function Names() {
  const [name, setName] = useState('');
  const [names, setNames] = useState([]);

  function handleSubmit(event) {
    event.preventDefault();
    setNames([...names, name]);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button>Запомнить</button>
      <p>{names.join(', ')}</p>
    </form>
  );
}

// в настоящем приложении у пунктов был бы id для key. Здесь можно взять индекс`,
  methods: ['два useState', 'onSubmit', '[...todos, text]', 'trim()'],
  starter: `import { useState } from 'react';

export default function App() {
  return (
    <div>
      <form>
        <input />
        <button>Добавить</button>
      </form>
      <ul></ul>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [todos, setTodos] = useState([]);

  function handleSubmit(event) {
    event.preventDefault();
    const value = text.trim();
    if (value === '') {
      return;
    }
    setTodos([...todos, value]);
    setText('');
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <button>Добавить</button>
      </form>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}`,
  hint: 'Два состояния: text и todos. В handleSubmit: preventDefault, value = text.trim(), если пусто — return, иначе setTodos([...todos, value]) и setText(\'\').',
  checks: [
    { name: 'сначала список пуст', fn: async (c) => c.want(c.qa('li').length, 0, 'количество пунктов') },
    { name: 'отправка добавляет пункт', fn: async (c) => { await c.type('input', 'Купить хлеб'); await c.submit('form'); return c.want(c.texts('li').join(', '), 'Купить хлеб', 'пункты'); } },
    { name: 'пункты идут по порядку добавления', fn: async (c) => { for (const t of ['раз', 'два', 'три']) { await c.type('input', t); await c.submit('form'); } return c.want(c.texts('li').join(', '), 'раз, два, три', 'пункты'); } },
    { name: 'поле после добавления очищается', fn: async (c) => { await c.type('input', 'раз'); await c.submit('form'); return c.want(c.$('input').value, '', 'значение поля'); } },
    { name: 'пробелы по краям обрезаны', fn: async (c) => { await c.type('input', '   чай  '); await c.submit('form'); return c.want(c.qa('li').map((l) => '[' + l.textContent + ']').join(''), '[чай]', 'текст пункта'); } },
    { name: 'пустой текст не добавляется', fn: async (c) => { await c.submit('form'); await c.type('input', '    '); await c.submit('form'); return c.want(c.qa('li').length, 0, 'количество пунктов'); } },
    { name: 'страница не перезагружается', fn: async (c) => { await c.type('input', 'раз'); const p = await c.submit('form'); return p ? true : 'нужен event.preventDefault()'; } },
  ] },

/* ================= ЭФФЕКТЫ И РЕФЫ ================= */
{ id: 'e01', topic: 'eff', level: 2, title: 'Заголовок вкладки',
  text: 'useEffect запускает код после отрисовки. Он нужен, чтобы менять что-то вне React, например заголовок вкладки браузера. Доработай счётчик: заголовок вкладки (document.title) должен быть «Кликов: N» и меняться вместе со счётом.',
  example: `import { useState, useEffect } from 'react';

export default function Player() {
  const [song, setSong] = useState('Тишина');

  useEffect(() => {
    document.title = 'Играет: ' + song;
  }, [song]);

  return <button onClick={() => setSong('Гимн')}>Включить гимн</button>;
}

// [song] — зависимости: эффект запустится после первой отрисовки
// и потом каждый раз, когда song изменится`,
  methods: ['useEffect(() => { … }, [count])', 'document.title'],
  starter: `import { useState, useEffect } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Клик: {count}</button>;
}
`,
  solution: `import { useState, useEffect } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'Кликов: ' + count;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Клик: {count}</button>;
}`,
  hint: "Между useState и return: useEffect(() => { document.title = 'Кликов: ' + count; }, [count]);",
  checks: [
    { name: 'сразу после появления заголовок «Кликов: 0»', fn: async (c) => { document.title = 'x'; await c.render({}); return c.want(c.title(), 'Кликов: 0', 'document.title'); } },
    { name: 'после двух кликов «Кликов: 2»', fn: async (c) => { await c.click('button'); await c.click('button'); return c.want(c.title(), 'Кликов: 2', 'document.title'); } },
  ] },

{ id: 'e02', topic: 'eff', level: 3, title: 'Только один раз',
  text: 'Пустой массив зависимостей [] означает «запусти эффект один раз, когда компонент появился». В тренажёре есть готовая функция track. Сейчас она вызывается после каждой перерисовки. Сделай так, чтобы track(\'open\') вызвалась один раз, сколько бы ни кликали по кнопке.',
  example: `import { useState, useEffect } from 'react';

export default function Page() {
  const [n, setN] = useState(0);

  useEffect(() => {
    console.log('страница открыта');
  }, []);

  return <button onClick={() => setN(n + 1)}>{n}</button>;
}

// без второго аргумента эффект запускается после каждой отрисовки,
// с [] — только после первой`,
  methods: ['useEffect(() => { … }, [])'],
  setup: 'window.track=function(x){(window.__calls=window.__calls||[]).push(x)};',
  starter: `import { useState, useEffect } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    track('open');
  });

  return <button onClick={() => setCount(count + 1)}>Клик: {count}</button>;
}
`,
  solution: `import { useState, useEffect } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    track('open');
  }, []);

  return <button onClick={() => setCount(count + 1)}>Клик: {count}</button>;
}`,
  hint: 'Добавь эффекту второй аргумент: пустой массив [].',
  checks: [
    { name: "при появлении track('open') вызвана один раз", fn: async (c) => { window.__calls = []; await c.render({}); return c.want(window.__calls.join(', '), 'open', 'вызовы track'); } },
    { name: 'после трёх кликов вызов по-прежнему один', fn: async (c) => { window.__calls = []; await c.render({}); for (let i = 0; i < 3; i++) await c.click('button'); return c.want(window.__calls.length, 1, 'сколько раз вызвана track'); } },
    { name: 'счётчик при этом работает', fn: async (c) => { await c.click('button'); return c.want(c.txt(c.$('button')), 'Клик: 1', 'текст кнопки'); } },
  ] },

{ id: 'e03', topic: 'eff', level: 4, title: 'Таймер застрял',
  text: 'Эффект с [] запускается один раз и «помнит» переменные той первой отрисовки. В заготовке таймер каждые 100 мс делает setTicks(ticks + 1), но ticks внутри всегда 0, и счёт застревает на 1. Исправь: в set-функцию можно передать функцию, которая получит актуальное значение.',
  example: `import { useState, useEffect } from 'react';

export default function Rain() {
  const [drops, setDrops] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setDrops((prev) => prev + 1);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return <p>Капель: {drops}</p>;
}

// setDrops((prev) => prev + 1): React сам подставит в prev свежее значение`,
  methods: ['setX((prev) => prev + 1)'],
  starter: `import { useState, useEffect } from 'react';

export default function App() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTicks(ticks + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return <p>Тиков: {ticks}</p>;
}
`,
  solution: `import { useState, useEffect } from 'react';

export default function App() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTicks((prev) => prev + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return <p>Тиков: {ticks}</p>;
}`,
  hint: 'Замени setTicks(ticks + 1) на setTicks((prev) => prev + 1).',
  checks: [
    { name: 'сначала «Тиков: 0»', fn: async (c) => c.want(c.txt(c.$('p')), 'Тиков: 0', 'текст') },
    { name: 'за полсекунды натикало больше двух', fn: async (c) => { await c.wait(480); const n = Number(c.txt(c.$('p')).replace(/\D/g, '')); return n >= 3 ? true : 'за полсекунды счёт дошёл только до ' + n + ': таймер застрял'; } },
  ] },

{ id: 'e04', topic: 'eff', level: 4, title: 'Убрать за собой',
  text: 'Если эффект что-то запустил (таймер, подписку), он должен это остановить, когда компонент исчезает. Для этого эффект возвращает функцию очистки. В заготовке таймер продолжает работать после исчезновения компонента. Добавь очистку.',
  example: `import { useState, useEffect } from 'react';

export default function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return <p>Ширина: {width}</p>;
}

// функция после return внутри эффекта — очистка.
// React вызовет её, когда компонент уберут со страницы`,
  methods: ['return () => clearInterval(id)'],
  starter: `import { useState, useEffect } from 'react';

export default function App() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setTicks((prev) => prev + 1);
    }, 100);
  }, []);

  return <p>Тиков: {ticks}</p>;
}
`,
  solution: `import { useState, useEffect } from 'react';

export default function App() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTicks((prev) => prev + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return <p>Тиков: {ticks}</p>;
}`,
  hint: 'Сохрани результат setInterval в переменную id и в конце эффекта верни () => clearInterval(id).',
  checks: [
    { name: 'таймер тикает', fn: async (c) => { await c.wait(380); const n = Number(c.txt(c.$('p')).replace(/\D/g, '')); return n >= 2 ? true : 'счёт не растёт: сейчас ' + n; } },
    { name: 'после исчезновения компонента таймеров не осталось', fn: async (c) => { await c.unmount(); const n = c.intervals(); return n === 0 ? true : 'компонент убран, а работающих таймеров осталось: ' + n; } },
  ] },

{ id: 'e05', topic: 'eff', level: 3, title: 'Фокус через ref',
  text: 'useRef даёт доступ к настоящему DOM-элементу: реф привязывают к тегу атрибутом ref, а сам элемент лежит в поле current. Сделай поле и кнопку «В поле»: клик по кнопке ставит курсор в поле (метод focus).',
  example: `import { useRef } from 'react';

export default function Video() {
  const videoRef = useRef(null);

  return (
    <div>
      <video ref={videoRef} />
      <button onClick={() => videoRef.current.play()}>Играть</button>
    </div>
  );
}

// videoRef.current — сам элемент video, как после querySelector`,
  methods: ['useRef(null)', 'ref={…}', '.current.focus()'],
  starter: `import { useRef } from 'react';

export default function App() {
  return (
    <div>
      <input />
      <button>В поле</button>
    </div>
  );
}
`,
  solution: `import { useRef } from 'react';

export default function App() {
  const inputRef = useRef(null);

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>В поле</button>
    </div>
  );
}`,
  hint: 'const inputRef = useRef(null); у поля ref={inputRef}; у кнопки onClick={() => inputRef.current.focus()}.',
  checks: [
    { name: 'сначала фокус не в поле', fn: async (c) => (document.activeElement === c.$('input') ? 'поле в фокусе сразу, а должно по клику' : true) },
    { name: 'клик по кнопке ставит фокус в поле', fn: async (c) => { await c.click(c.btn('В поле')); return document.activeElement === c.$('input') ? true : 'после клика фокус не в поле'; } },
  ] },

{ id: 'e06', topic: 'eff', level: 5, title: 'Загрузка данных',
  text: 'Данные с сервера загружают в эффекте. В тренажёре есть готовая функция loadUser(): она возвращает промис, который через мгновение отдаёт объект { name: \'Аня\' }. Пока данных нет, выведи абзац «Загрузка…». Когда пришли — «Привет, Аня!».',
  example: `import { useState, useEffect } from 'react';

export default function Weather() {
  const [temp, setTemp] = useState(null);

  useEffect(() => {
    loadTemperature().then((value) => setTemp(value));
  }, []);

  if (temp === null) {
    return <p>Узнаём погоду…</p>;
  }
  return <p>Сейчас {temp}°</p>;
}

// null в состоянии означает «данных ещё нет».
// эффект с [] запускает загрузку один раз`,
  methods: ['useState(null)', 'useEffect(…, [])', '.then(…)'],
  setup: "window.loadUser=function(){return new Promise(function(r){setTimeout(function(){r({name:'Аня'})},120)})};",
  starter: `import { useState, useEffect } from 'react';

export default function App() {
  return <p>Загрузка…</p>;
}
`,
  solution: `import { useState, useEffect } from 'react';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser().then((data) => setUser(data));
  }, []);

  if (user === null) {
    return <p>Загрузка…</p>;
  }
  return <p>Привет, {user.name}!</p>;
}`,
  hint: 'Состояние user (null). В эффекте с []: loadUser().then((data) => setUser(data)). Если user === null, верни «Загрузка…», иначе приветствие.',
  checks: [
    { name: 'сначала «Загрузка…»', fn: async (c) => (c.txt().startsWith('Загрузка') ? true : 'сразу после появления должно быть «Загрузка…», сейчас: «' + c.txt() + '»') },
    { name: 'потом «Привет, Аня!»', fn: async (c) => { await c.wait(320); return c.want(c.txt(c.$('p')), 'Привет, Аня!', 'текст после загрузки'); } },
    { name: 'загрузка запускается один раз', fn: async (c) => { const orig = window.loadUser; let n = 0; window.loadUser = function () { n++; return orig(); }; await c.render({}); await c.wait(320); window.loadUser = orig; return c.want(n, 1, 'сколько раз вызвана loadUser'); } },
  ] },

/* ================= КОМПОЗИЦИЯ ================= */
{ id: 'c01', topic: 'comp', level: 3, title: 'Подъём состояния',
  text: 'Если два компонента должны показывать одно и то же значение, состояние переносят в их общего родителя, а детям передают пропсы. Сейчас у каждого Counter свой счёт. Сделай общий: клик по любой кнопке увеличивает число на обеих.',
  example: `import { useState } from 'react';

function Lamp({ on, onToggle }) {
  return <button onClick={onToggle}>{on ? 'Горит' : 'Не горит'}</button>;
}

export default function Room() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <Lamp on={on} onToggle={() => setOn(!on)} />
      <Lamp on={on} onToggle={() => setOn(!on)} />
    </div>
  );
}

// состояние живёт в Room. Lamp ничего не помнит: показывает проп и сообщает о клике`,
  methods: ['состояние в родителе', 'пропсы count и onAdd'],
  starter: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Нажато: {count}</button>;
}

export default function App() {
  return (
    <div>
      <Counter />
      <Counter />
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

function Counter({ count, onAdd }) {
  return <button onClick={onAdd}>Нажато: {count}</button>;
}

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Counter count={count} onAdd={() => setCount(count + 1)} />
      <Counter count={count} onAdd={() => setCount(count + 1)} />
    </div>
  );
}`,
  hint: 'Перенеси useState из Counter в App. Counter получает пропсы count и onAdd и вызывает onAdd по клику.',
  checks: [
    { name: 'две кнопки «Нажато: 0»', fn: async (c) => c.want(c.texts('button').join(' | '), 'Нажато: 0 | Нажато: 0', 'кнопки') },
    { name: 'клик по первой меняет обе', fn: async (c) => { await c.click(c.qa('button')[0]); return c.want(c.texts('button').join(' | '), 'Нажато: 1 | Нажато: 1', 'кнопки'); } },
    { name: 'клик по второй тоже меняет обе', fn: async (c) => { await c.click(c.qa('button')[0]); await c.click(c.qa('button')[1]); await c.click(c.qa('button')[1]); return c.want(c.texts('button').join(' | '), 'Нажато: 3 | Нажато: 3', 'кнопки'); } },
  ] },

{ id: 'c02', topic: 'comp', level: 3, title: 'Ребёнок сообщает родителю',
  text: 'Данные идут вниз через пропсы, а события идут вверх через проп-функции. Компонент ColorButton готов: по клику он вызывает onPick и передаёт свой цвет. В App выведи три кнопки (red, green, blue) и абзац «Выбран: …». Сначала в абзаце «Выбран: нет».',
  example: `import { useState } from 'react';

function Key({ digit, onPress }) {
  return <button onClick={() => onPress(digit)}>{digit}</button>;
}

export default function Pad() {
  const [last, setLast] = useState('');
  return (
    <div>
      <Key digit="1" onPress={setLast} />
      <Key digit="2" onPress={setLast} />
      <p>Нажата: {last}</p>
    </div>
  );
}

// onPress={setLast}: ребёнок вызовет onPress('1'), и это будет setLast('1')`,
  methods: ['onPick={setColor}'],
  starter: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return <button onClick={() => onPick(color)}>{color}</button>;
}

export default function App() {
  return (
    <div>
      <p>Выбран: нет</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return <button onClick={() => onPick(color)}>{color}</button>;
}

export default function App() {
  const [color, setColor] = useState('нет');
  return (
    <div>
      <ColorButton color="red" onPick={setColor} />
      <ColorButton color="green" onPick={setColor} />
      <ColorButton color="blue" onPick={setColor} />
      <p>Выбран: {color}</p>
    </div>
  );
}`,
  hint: "Состояние color ('нет') в App. Каждой кнопке: color=\"…\" и onPick={setColor}.",
  checks: [
    { name: 'три кнопки: red, green, blue', fn: async (c) => c.want(c.texts('button').join(', '), 'red, green, blue', 'кнопки') },
    { name: 'сначала «Выбран: нет»', fn: async (c) => c.want(c.txt(c.$('p')), 'Выбран: нет', 'текст') },
    { name: 'клик по green: «Выбран: green»', fn: async (c) => { await c.click(c.btn('green')); return c.want(c.txt(c.$('p')), 'Выбран: green', 'текст'); } },
    { name: 'потом клик по blue: «Выбран: blue»', fn: async (c) => { await c.click(c.btn('green')); await c.click(c.btn('blue')); return c.want(c.txt(c.$('p')), 'Выбран: blue', 'текст'); } },
  ] },

{ id: 'c03', topic: 'comp', level: 4, title: 'Поиск по списку',
  text: 'Частая задача (она же в Country Search): поле поиска фильтрует список. Сделай поле и список городов из CITIES. В списке остаются только города, в названии которых есть введённый текст. Регистр букв не важен. Отфильтрованный список в состоянии не хранится: он вычисляется при отрисовке.',
  example: `import { useState } from 'react';

const WORDS = ['кот', 'код', 'рот'];

export default function Starts() {
  const [letter, setLetter] = useState('');
  const shown = WORDS.filter((word) => word.startsWith(letter));
  return (
    <div>
      <input value={letter} onChange={(event) => setLetter(event.target.value)} />
      <p>{shown.join(', ')}</p>
    </div>
  );
}

// shown — обычная переменная: она пересчитывается при каждой отрисовке`,
  methods: ['filter', 'includes', 'toLowerCase()'],
  starter: `import { useState } from 'react';

const CITIES = ['Москва', 'Минск', 'Берлин', 'Мадрид', 'Бремен'];

export default function App() {
  return (
    <div>
      <input />
      <ul>
        {CITIES.map((city) => (
          <li key={city}>{city}</li>
        ))}
      </ul>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

const CITIES = ['Москва', 'Минск', 'Берлин', 'Мадрид', 'Бремен'];

export default function App() {
  const [query, setQuery] = useState('');
  const shown = CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>
        {shown.map((city) => (
          <li key={city}>{city}</li>
        ))}
      </ul>
    </div>
  );
}`,
  hint: 'Состояние query. Переменная shown = CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase())). В список идёт shown.',
  checks: [
    { name: 'пустое поле: все пять городов', fn: async (c) => c.want(c.texts('li').join(', '), 'Москва, Минск, Берлин, Мадрид, Бремен', 'список') },
    { name: '«бе» оставляет Берлин', fn: async (c) => { await c.type('input', 'бе'); return c.want(c.texts('li').join(', '), 'Берлин', 'список'); } },
    { name: '«МИ» (большими) оставляет Минск', fn: async (c) => { await c.type('input', 'МИ'); return c.want(c.texts('li').join(', '), 'Минск', 'список'); } },
    { name: '«р» ищет в середине слова', fn: async (c) => { await c.type('input', 'р'); return c.want(c.texts('li').join(', '), 'Берлин, Мадрид, Бремен', 'список'); } },
    { name: 'стёрли текст: снова все города', fn: async (c) => { await c.type('input', 'бе'); await c.type('input', ''); return c.want(c.qa('li').length, 5, 'количество городов'); } },
  ] },

{ id: 'c04', topic: 'comp', level: 4, title: 'Свой хук',
  text: 'Повторяющуюся логику с состоянием выносят в свой хук: это обычная функция, имя которой начинается с use и которая вызывает другие хуки. Напиши хук useToggle(initial): он возвращает пару [значение, функция-переключатель]. В App используй его дважды: кнопки «Свет: выкл» и «Звук: выкл» по клику меняют «выкл» на «вкл» и обратно, каждая сама по себе.',
  example: `import { useState } from 'react';

function useCounter(start) {
  const [count, setCount] = useState(start);
  const add = () => setCount(count + 1);
  return [count, add];
}

export default function Page() {
  const [apples, addApple] = useCounter(0);
  const [pears, addPear] = useCounter(10);
  return (
    <div>
      <button onClick={addApple}>Яблок: {apples}</button>
      <button onClick={addPear}>Груш: {pears}</button>
    </div>
  );
}

// каждый вызов хука создаёт своё отдельное состояние`,
  methods: ['function useToggle(initial)', 'return [value, toggle]'],
  starter: `import { useState } from 'react';

// напиши useToggle здесь

export default function App() {
  return (
    <div>
      <button>Свет: выкл</button>
      <button>Звук: выкл</button>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

function useToggle(initial) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue(!value);
  return [value, toggle];
}

export default function App() {
  const [light, toggleLight] = useToggle(false);
  const [sound, toggleSound] = useToggle(false);
  return (
    <div>
      <button onClick={toggleLight}>Свет: {light ? 'вкл' : 'выкл'}</button>
      <button onClick={toggleSound}>Звук: {sound ? 'вкл' : 'выкл'}</button>
    </div>
  );
}`,
  hint: 'Внутри useToggle: useState(initial), функция toggle = () => setValue(!value), return [value, toggle]. В App: const [light, toggleLight] = useToggle(false).',
  checks: [
    { name: 'сначала обе «выкл»', fn: async (c) => c.want(c.texts('button').join(' | '), 'Свет: выкл | Звук: выкл', 'кнопки') },
    { name: 'клик по свету включает только свет', fn: async (c) => { await c.click(c.qa('button')[0]); return c.want(c.texts('button').join(' | '), 'Свет: вкл | Звук: выкл', 'кнопки'); } },
    { name: 'второй клик выключает обратно', fn: async (c) => { await c.click(c.qa('button')[0]); await c.click(c.qa('button')[1]); await c.click(c.qa('button')[0]); return c.want(c.texts('button').join(' | '), 'Свет: выкл | Звук: вкл', 'кнопки'); } },
    { name: 'в коде есть хук useToggle, и он вызван дважды', fn: async (c) => (/(function\s+useToggle|const\s+useToggle\s*=)/.test(c.code) && (c.code.match(/useToggle\s*\(/g) || []).length >= 3 ? true : 'нужна функция useToggle и два её вызова в App') },
  ] },

{ id: 'c05', topic: 'comp', level: 5, title: 'Мини-магазин',
  text: 'Итоговая задача. Выведи товары из PRODUCTS списком: в каждом li название, цена и кнопка «В корзину». Под списком два абзаца: «В корзине: N» (сколько раз нажали) и «Итого: X ₽» (сумма цен добавленных товаров). Один товар можно добавить несколько раз.',
  example: `import { useState } from 'react';

const SNACKS = [
  { id: 1, title: 'Орехи', kcal: 600 },
  { id: 2, title: 'Яблоко', kcal: 50 },
];

export default function Diary() {
  const [eaten, setEaten] = useState([]);
  const total = eaten.reduce((sum, snack) => sum + snack.kcal, 0);
  return (
    <div>
      {SNACKS.map((snack) => (
        <button key={snack.id} onClick={() => setEaten([...eaten, snack])}>
          {snack.title}
        </button>
      ))}
      <p>Съедено: {eaten.length}</p>
      <p>Калорий: {total}</p>
    </div>
  );
}

// в состоянии только массив eaten. Количество и сумма вычисляются из него`,
  methods: ['useState([])', '[...cart, product]', 'reduce'],
  starter: `import { useState } from 'react';

const PRODUCTS = [
  { id: 1, title: 'Чай', price: 120 },
  { id: 2, title: 'Кофе', price: 300 },
  { id: 3, title: 'Сок', price: 90 },
];

export default function App() {
  return (
    <div>
      <ul></ul>
      <p>В корзине: 0</p>
      <p>Итого: 0 ₽</p>
    </div>
  );
}
`,
  solution: `import { useState } from 'react';

const PRODUCTS = [
  { id: 1, title: 'Чай', price: 120 },
  { id: 2, title: 'Кофе', price: 300 },
  { id: 3, title: 'Сок', price: 90 },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  return (
    <div>
      <ul>
        {PRODUCTS.map((product) => (
          <li key={product.id}>
            {product.title}, {product.price} ₽ <button onClick={() => setCart([...cart, product])}>В корзину</button>
          </li>
        ))}
      </ul>
      <p>В корзине: {cart.length}</p>
      <p>Итого: {total} ₽</p>
    </div>
  );
}`,
  hint: 'Состояние cart ([]). Кнопка: setCart([...cart, product]). Количество: cart.length. Сумма: cart.reduce((sum, product) => sum + product.price, 0).',
  checks: [
    { name: 'три товара, у каждого кнопка «В корзину»', fn: async (c) => (c.qa('li').length === 3 && c.qa('li button').length === 3 && c.texts('li button').every((t) => t === 'В корзину') ? true : 'товаров: ' + c.qa('li').length + ', кнопок «В корзину»: ' + c.qa('li button').length) },
    { name: 'в каждом li название и цена', fn: async (c) => { const l = c.texts('li'); return l.length === 3 && l[0].includes('Чай') && l[0].includes('120') && l[1].includes('Кофе') && l[1].includes('300') && l[2].includes('Сок') && l[2].includes('90') ? true : 'пункты сейчас: ' + l.join(' | '); } },
    { name: 'сначала «В корзине: 0» и «Итого: 0 ₽»', fn: async (c) => c.want(c.texts('p').join(' | '), 'В корзине: 0 | Итого: 0 ₽', 'абзацы') },
    { name: 'добавили кофе: 1 товар, 300 ₽', fn: async (c) => { await c.click(c.qa('li button')[1]); return c.want(c.texts('p').join(' | '), 'В корзине: 1 | Итого: 300 ₽', 'абзацы'); } },
    { name: 'два чая и сок: 3 товара, 330 ₽', fn: async (c) => { const b = c.qa('li button'); await c.click(b[0]); await c.click(b[0]); await c.click(b[2]); return c.want(c.texts('p').join(' | '), 'В корзине: 3 | Итого: 330 ₽', 'абзацы'); } },
    { name: 'React не предупреждает про key', fn: async (c) => (c.warned('unique "key"') ? 'React предупреждает: у li в map нет key' : true) },
  ] },
];
