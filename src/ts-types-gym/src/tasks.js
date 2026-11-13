// types:  { ok: code }  — must compile        { err: code } — must be a type error
//         { expr: code, type: T } — the expression has exactly type T
//         { alias: Name, type: T } — the learner's type Name is exactly T
// tests:  [argsSource, expectedSource] or ['@code ending with an expression', expectedSource, label]
const TASKS = [
  // ───────── BASICS ─────────
  {
    id: 'b01', topic: 'basic', level: 1, fn: 'double',
    title: 'Число на входе, число на выходе',
    text: 'Функция уже работает, но TypeScript не знает её типов. Допиши: параметр n — число, результат — тоже число.',
    methods: ['n: number', '): number'],
    example: `function square(x: number): number {
  return x * x;
}`,
    hint: 'Тип параметра пишется после его имени: (n: number). Тип результата — после закрывающей скобки параметров: ): number {',
    starter: `function double(n) {
  return n * 2;
}
`,
    solution: `function double(n: number): number {
  return n * 2;
}`,
    types: [{ expr: 'double(4)', type: 'number' }, { err: "double('4');" }],
    tests: [['4', '8'], ['0', '0'], ['-3', '-6']],
  },
  {
    id: 'b02', topic: 'basic', level: 1, fn: 'greet',
    title: 'Строка',
    text: 'Допиши типы: имя — строка, результат — строка.',
    methods: ['string'],
    example: `function shout(word: string): string {
  return word.toUpperCase() + '!';
}`,
    hint: 'Тип строки пишется маленькими буквами: string. Он нужен в двух местах: у параметра и у результата.',
    starter: `function greet(name) {
  return 'Привет, ' + name + '!';
}
`,
    solution: `function greet(name: string): string {
  return 'Привет, ' + name + '!';
}`,
    types: [{ expr: "greet('Артур')", type: 'string' }, { err: 'greet(5);' }],
    tests: [["'Артур'", "'Привет, Артур!'"], ["'мир'", "'Привет, мир!'"]],
  },
  {
    id: 'b03', topic: 'basic', level: 1, fn: 'isAdult',
    title: 'Да или нет',
    text: 'Функция отвечает «да» или «нет». Допиши типы: возраст — число, результат — boolean.',
    methods: ['number', 'boolean'],
    example: `function isEmpty(text: string): boolean {
  return text.length === 0;
}`,
    hint: 'Сравнение (>=, ===) всегда даёт true или false. Тип такого значения — boolean.',
    starter: `function isAdult(age) {
  return age >= 18;
}
`,
    solution: `function isAdult(age: number): boolean {
  return age >= 18;
}`,
    types: [{ expr: 'isAdult(20)', type: 'boolean' }, { err: "isAdult('20');" }],
    tests: [['18', 'true'], ['17', 'false'], ['40', 'true']],
  },
  {
    id: 'b04', topic: 'basic', level: 2, fn: 'sum',
    title: 'Массив чисел',
    text: 'Параметр nums — не одно число, а массив чисел. Допиши типы.',
    methods: ['number[]'],
    example: `function countWords(words: string[]): number {
  return words.length;
}`,
    hint: 'Массив — это тип элемента и квадратные скобки после него: number[] читается «массив чисел». Результат у sum — одно число.',
    starter: `function sum(nums) {
  return nums.reduce((total, n) => total + n, 0);
}
`,
    solution: `function sum(nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}`,
    types: [{ ok: 'sum([1, 2, 3]);' }, { err: 'sum(5);' }, { err: "sum(['1', '2']);" }],
    tests: [['[1, 2, 3]', '6'], ['[]', '0'], ['[10]', '10']],
  },
  {
    id: 'b05', topic: 'basic', level: 2, fn: 'splitWords',
    title: 'Массив на выходе',
    text: 'Функция получает строку, а возвращает массив строк. Допиши типы.',
    methods: ['string', 'string[]'],
    example: `function toDigits(code: string): string[] {
  return code.split('');
}`,
    hint: 'Одна строка — string. Массив строк — string[]. Здесь нужны оба: один для параметра, другой для результата.',
    starter: `function splitWords(text) {
  return text.split(' ');
}
`,
    solution: `function splitWords(text: string): string[] {
  return text.split(' ');
}`,
    types: [{ expr: "splitWords('a b')", type: 'string[]' }, { err: "splitWords(['a', 'b']);" }],
    tests: [["'кот и пёс'", "['кот', 'и', 'пёс']"], ["'один'", "['один']"]],
  },
  {
    id: 'b06', topic: 'basic', level: 2, fn: 'addItem',
    title: 'Ничего не возвращает',
    text: 'Функция ничего не возвращает: она только добавляет слово в список. У такого результата тип void. Допиши типы: list — массив строк, item — строка.',
    methods: ['void', 'string[]'],
    example: `function clearList(list: number[]): void {
  list.length = 0;
}`,
    hint: 'void значит «результата нет». Он пишется там же, где обычный тип результата: ): void {',
    starter: `function addItem(list, item) {
  list.push(item);
}
`,
    solution: `function addItem(list: string[], item: string): void {
  list.push(item);
}`,
    types: [{ expr: "addItem(['a'], 'b')", type: 'void' }, { err: "addItem(['a'], 5);" }, { err: "addItem('a', 'b');" }],
    tests: [["@const list = ['чай']; addItem(list, 'мёд'); list", "['чай', 'мёд']", "addItem(list, 'мёд') → list"]],
  },
  {
    id: 'b07', topic: 'basic', level: 2, fn: 'greetUser',
    title: 'Необязательный параметр',
    text: 'Второй параметр можно не передавать: тогда функция здоровается словом «Привет». Допиши типы и покажи, что greeting необязателен.',
    methods: ['greeting?: string'],
    example: `function repeat(text: string, times?: number): string {
  return text.repeat(times ?? 2);
}

repeat('ха');    // можно без второго
repeat('ха', 3);`,
    hint: 'Знак вопроса после имени параметра делает его необязательным: (name: string, greeting?: string).',
    starter: `function greetUser(name, greeting) {
  return (greeting ?? 'Привет') + ', ' + name;
}
`,
    solution: `function greetUser(name: string, greeting?: string): string {
  return (greeting ?? 'Привет') + ', ' + name;
}`,
    types: [{ ok: "greetUser('Аня');" }, { ok: "greetUser('Аня', 'Салют');" }, { err: 'greetUser();' }, { err: "greetUser('Аня', 5);" }],
    tests: [["'Аня'", "'Привет, Аня'"], ["'Аня', 'Салют'", "'Салют, Аня'"]],
  },
  {
    id: 'b08', topic: 'basic', level: 2, fn: 'power',
    title: 'Значение по умолчанию',
    text: 'Сейчас степень нужно передавать всегда. Сделай так, чтобы её можно было пропустить: тогда число возводится в квадрат, power(3) → 9.',
    methods: ['exp = 2'],
    example: `function addTax(price: number, percent = 20): number {
  return price + (price * percent) / 100;
}

addTax(100);     // 120
addTax(100, 10); // 110`,
    hint: 'Значение по умолчанию пишут через знак равно прямо в параметрах: (base: number, exp = 2). Тип TypeScript поймёт сам — по значению 2.',
    starter: `function power(base: number, exp: number): number {
  return base ** exp;
}
`,
    solution: `function power(base: number, exp = 2): number {
  return base ** exp;
}`,
    types: [{ ok: 'power(3);' }, { ok: 'power(2, 3);' }, { err: "power(3, '2');" }],
    tests: [['3', '9'], ['2, 3', '8'], ['5, 0', '1']],
  },
  {
    id: 'b09', topic: 'basic', level: 3, fn: 'formatId',
    title: 'Или число, или строка',
    text: 'id бывает числом (7) или строкой (\'a7\'). Опиши это объединением типов — через вертикальную черту.',
    methods: ['number | string'],
    example: `function toText(value: boolean | number): string {
  return String(value);
}

toText(true);
toText(42);`,
    hint: 'Черта | читается «или»: id: number | string. Других типов (boolean, null) быть не должно.',
    starter: `function formatId(id) {
  return '#' + id;
}
`,
    solution: `function formatId(id: number | string): string {
  return '#' + id;
}`,
    types: [{ ok: 'formatId(7);' }, { ok: "formatId('a7');" }, { err: 'formatId(true);' }, { err: 'formatId(null);' }],
    tests: [['7', "'#7'"], ["'a7'", "'#a7'"]],
  },
  {
    id: 'b10', topic: 'basic', level: 3, fn: 'move',
    title: 'Только эти слова',
    text: 'Направление — не любая строка, а только \'up\' или \'down\'. Объяви для этого свой тип Direction и используй его у параметра dir.',
    methods: ['type', "'up' | 'down'"],
    example: `type Theme = 'light' | 'dark';

function nextTheme(theme: Theme): Theme {
  return theme === 'light' ? 'dark' : 'light';
}

nextTheme('light');
// nextTheme('blue') — ошибка: такого значения в Theme нет`,
    hint: "Свой тип объявляют словом type: type Direction = 'up' | 'down'; — потом пишут его как обычный тип: dir: Direction.",
    starter: `// 1. Объяви тип Direction: только 'up' или 'down'

function move(y, dir) {
  return dir === 'up' ? y - 1 : y + 1;
}
`,
    solution: `type Direction = 'up' | 'down';

function move(y: number, dir: Direction): number {
  return dir === 'up' ? y - 1 : y + 1;
}`,
    types: [{ alias: 'Direction', type: "'up' | 'down'" }, { ok: "move(5, 'up');" }, { err: "move(5, 'left');" }],
    tests: [["5, 'up'", '4'], ["5, 'down'", '6']],
  },
  {
    id: 'b11', topic: 'basic', level: 3, fn: 'minMax',
    title: 'Пара значений',
    text: 'Верни пару: [минимум, максимум]. Тип результата — кортеж [number, number]: массив ровно из двух чисел. Здесь пиши и типы, и тело функции.',
    methods: ['[number, number]', 'Math.min', '...nums'],
    example: `function firstAndLast(words: string[]): [string, string] {
  return [words[0], words[words.length - 1]];
}`,
    hint: 'Кортеж записывают как массив типов: [number, number]. Минимум и максимум: Math.min(...nums) и Math.max(...nums).',
    starter: `function minMax(nums) {

}
`,
    solution: `function minMax(nums: number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)];
}`,
    types: [{ expr: 'minMax([1, 2])', type: '[number, number]' }, { err: "minMax('123');" }],
    tests: [['[3, 1, 2]', '[1, 3]'], ['[5]', '[5, 5]'], ['[-1, -7, 0]', '[-7, 0]']],
  },
  {
    id: 'b12', topic: 'basic', level: 4, fn: 'applyFormat',
    title: 'Функция как параметр',
    text: 'Второй параметр — функция. Объяви тип Formatter: «функция, которая берёт число и возвращает строку», и используй его у параметра format.',
    methods: ['(value: number) => string'],
    example: `type Checker = (text: string) => boolean;

function countGood(words: string[], isGood: Checker): number {
  return words.filter(isGood).length;
}

countGood(['a', 'bb'], (word) => word.length > 1);`,
    hint: 'Тип функции похож на стрелочную функцию без тела: (value: number) => string. Слева параметры с типами, справа от стрелки — тип результата.',
    starter: `// 1. Объяви тип Formatter: функция, которая берёт число и возвращает строку

function applyFormat(value, format) {
  return format(value);
}
`,
    solution: `type Formatter = (value: number) => string;

function applyFormat(value: number, format: Formatter): string {
  return format(value);
}`,
    types: [
      { alias: 'Formatter', type: '(value: number) => string' },
      { ok: 'applyFormat(5, (n) => n.toFixed(2));' },
      { err: 'applyFormat(5, (n) => n * 2);' },
      { err: "applyFormat(5, 'два знака');" },
    ],
    tests: [
      ['@applyFormat(5, (n) => n.toFixed(2))', "'5.00'", 'applyFormat(5, (n) => n.toFixed(2))'],
      ["@applyFormat(3, (n) => '№' + n)", "'№3'", "applyFormat(3, (n) => '№' + n)"],
    ],
  },
  {
    id: 'b13', topic: 'basic', level: 4, fn: 'sumAll',
    title: 'Сколько угодно аргументов',
    text: 'Функцию хотят вызывать так: sumAll(1, 2, 3) — чисел сколько угодно и без квадратных скобок. Собери все аргументы в массив через три точки и укажи его тип.',
    methods: ['...nums: number[]'],
    example: `function joinAll(...parts: string[]): string {
  return parts.join('-');
}

joinAll('a', 'b', 'c'); // 'a-b-c'
joinAll();              // ''`,
    hint: 'Три точки перед именем параметра собирают все аргументы в один массив: (...nums: number[]). Внутри функции nums — обычный массив.',
    starter: `function sumAll(nums) {
  return nums.reduce((total, n) => total + n, 0);
}
`,
    solution: `function sumAll(...nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}`,
    types: [{ ok: 'sumAll();' }, { ok: 'sumAll(1, 2, 3);' }, { err: "sumAll(1, '2');" }, { err: 'sumAll([1, 2]);' }],
    tests: [['1, 2, 3', '6'], ['', '0'], ['5', '5']],
  },
  {
    id: 'b14', topic: 'basic', level: 5, fn: 'parsePair',
    title: 'Разобрать пару',
    text: "Приходит строка вида 'apple:3'. Верни кортеж: название (строка) и количество (число). Напиши всё сам: типы и тело.",
    methods: ['[string, number]', 'split', 'Number'],
    example: `function parseSize(text: string): [number, number] {
  const parts = text.split('x');
  return [Number(parts[0]), Number(parts[1])];
}

parseSize('800x600'); // [800, 600]`,
    hint: "Раздели строку по двоеточию. Первая часть уже строка, вторую преврати в число через Number(). Тип результата — [string, number].",
    starter: `function parsePair(text) {

}
`,
    solution: `function parsePair(text: string): [string, number] {
  const parts = text.split(':');
  return [parts[0], Number(parts[1])];
}`,
    types: [{ expr: "parsePair('a:1')", type: '[string, number]' }, { err: 'parsePair(5);' }],
    tests: [["'apple:3'", "['apple', 3]"], ["'tea:10'", "['tea', 10]"]],
  },

  // ───────── OBJECTS ─────────
  {
    id: 'o01', topic: 'obj', level: 1, fn: 'fullName',
    title: 'Объект в параметре',
    text: 'В функцию приходит объект с двумя строками: first и last. Опиши его тип прямо в параметре.',
    methods: ['{ first: string; last: string }'],
    example: `function area(size: { width: number; height: number }): number {
  return size.width * size.height;
}

area({ width: 2, height: 3 });`,
    hint: 'Тип объекта похож на сам объект, только вместо значений — типы, а между полями точка с запятой: { first: string; last: string }.',
    starter: `function fullName(user) {
  return user.first + ' ' + user.last;
}
`,
    solution: `function fullName(user: { first: string; last: string }): string {
  return user.first + ' ' + user.last;
}`,
    types: [{ ok: "fullName({ first: 'Анна', last: 'Ли' });" }, { err: "fullName({ first: 'Анна' });" }, { err: "fullName('Анна Ли');" }],
    tests: [["{ first: 'Анна', last: 'Ли' }", "'Анна Ли'"]],
  },
  {
    id: 'o02', topic: 'obj', level: 1, file: 'User',
    title: 'Первый интерфейс',
    text: 'Опиши интерфейс User: name — строка, age — число. Функцию писать не нужно — только тип.',
    methods: ['interface'],
    example: `interface Book {
  title: string;
  pages: number;
}

const book: Book = { title: 'Хоббит', pages: 310 };`,
    hint: 'interface — это имя для типа объекта. После слова interface идёт имя с большой буквы, потом фигурные скобки с полями. Знака = нет.',
    starter: `// Опиши интерфейс User: name — строка, age — число
`,
    solution: `interface User {
  name: string;
  age: number;
}`,
    types: [
      { ok: "const user: User = { name: 'Аня', age: 20 };" },
      { err: "const user: User = { name: 'Аня' };" },
      { err: "const user: User = { name: 'Аня', age: '20' };" },
      { err: "const user: User = { name: 'Аня', age: 20, email: 'a@b.c' };" },
    ],
  },
  {
    id: 'o03', topic: 'obj', level: 1, fn: 'priceLabel',
    title: 'Интерфейс в деле',
    text: "Интерфейс Product уже объявлен. Используй его как тип параметра и верни строку вида 'Чай: 250 ₽'.",
    methods: ['product: Product'],
    example: `interface Book {
  title: string;
  pages: number;
}

function isLong(book: Book): boolean {
  return book.pages > 300;
}`,
    hint: 'Имя интерфейса пишут там же, где обычный тип: (product: Product). Внутри доступны product.title и product.price.',
    starter: `interface Product {
  title: string;
  price: number;
}

function priceLabel(product) {

}
`,
    solution: `interface Product {
  title: string;
  price: number;
}

function priceLabel(product: Product): string {
  return product.title + ': ' + product.price + ' ₽';
}`,
    types: [{ expr: "priceLabel({ title: 'Чай', price: 250 })", type: 'string' }, { err: "priceLabel({ title: 'Чай' });" }],
    tests: [["{ title: 'Чай', price: 250 }", "'Чай: 250 ₽'"], ["{ title: 'Мёд', price: 90 }", "'Мёд: 90 ₽'"]],
  },
  {
    id: 'o04', topic: 'obj', level: 2, fn: 'getBio',
    title: 'Поле, которого может не быть',
    text: 'Опиши интерфейс Profile: name — строка, bio — тоже строка, но её может не быть. Потом допиши типы функции.',
    methods: ['bio?: string'],
    example: `interface Book {
  title: string;
  subtitle?: string; // может не быть
}

const a: Book = { title: 'Хоббит' };
const b: Book = { title: 'Хоббит', subtitle: 'Туда и обратно' };`,
    hint: 'Знак вопроса после имени поля делает его необязательным: bio?: string. Объект без bio тогда тоже подходит под Profile.',
    starter: `// 1. Опиши интерфейс Profile: name — строка, bio — строка, но её может не быть

function getBio(profile) {
  return profile.bio ?? 'нет описания';
}
`,
    solution: `interface Profile {
  name: string;
  bio?: string;
}

function getBio(profile: Profile): string {
  return profile.bio ?? 'нет описания';
}`,
    types: [
      { ok: "const p: Profile = { name: 'Аня' };" },
      { ok: "const p: Profile = { name: 'Аня', bio: 'люблю чай' };" },
      { err: "const p: Profile = { name: 'Аня', bio: 5 };" },
      { err: "const p: Profile = { bio: 'люблю чай' };" },
    ],
    tests: [["{ name: 'Аня' }", "'нет описания'"], ["{ name: 'Аня', bio: 'люблю чай' }", "'люблю чай'"]],
  },
  {
    id: 'o05', topic: 'obj', level: 2, fn: 'totalPrice',
    title: 'Массив объектов',
    text: 'В функцию приходит не один товар, а массив товаров. Посчитай сумму цен. Напиши типы и тело.',
    methods: ['Product[]', 'reduce'],
    example: `interface Book {
  title: string;
  pages: number;
}

function titles(books: Book[]): string[] {
  return books.map((book) => book.title);
}`,
    hint: 'Массив товаров — это Product[]. Сумму удобно копить через reduce: начни с 0 и прибавляй item.price.',
    starter: `interface Product {
  title: string;
  price: number;
}

function totalPrice(items) {

}
`,
    solution: `interface Product {
  title: string;
  price: number;
}

function totalPrice(items: Product[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,
    types: [{ ok: 'totalPrice([]);' }, { err: "totalPrice({ title: 'Чай', price: 250 });" }, { err: "totalPrice([{ title: 'Чай' }]);" }],
    tests: [["[{ title: 'Чай', price: 250 }, { title: 'Мёд', price: 90 }]", '340'], ['[]', '0']],
  },
  {
    id: 'o06', topic: 'obj', level: 2, fn: 'moveRight',
    title: 'Только для чтения',
    text: 'Опиши интерфейс Point: x и y — числа, и оба только для чтения. Функция должна вернуть НОВУЮ точку, у которой x больше на 1. Старую точку менять нельзя — пусть за этим следит TypeScript.',
    methods: ['readonly', '{ ...point }'],
    example: `interface Size {
  readonly width: number;
}

function wider(size: Size): Size {
  // size.width += 10; — ошибка: поле только для чтения
  return { width: size.width + 10 };
}`,
    hint: 'Слово readonly ставят перед именем поля: readonly x: number. Новый объект: { ...point, x: point.x + 1 } — копия со старым y и новым x.',
    starter: `// 1. Опиши интерфейс Point: x и y — числа, оба только для чтения

function moveRight(point) {

}
`,
    solution: `interface Point {
  readonly x: number;
  readonly y: number;
}

function moveRight(point: Point): Point {
  return { ...point, x: point.x + 1 };
}`,
    types: [
      { ok: 'const p: Point = { x: 1, y: 2 };' },
      { err: 'const p: Point = { x: 1, y: 2 };\np.x = 5;' },
      { err: 'const p: Point = { x: 1, y: 2 };\np.y = 5;' },
      { expr: 'moveRight({ x: 1, y: 2 })', type: 'Point' },
    ],
    tests: [
      ['{ x: 1, y: 2 }', '{ x: 2, y: 2 }'],
      ['@const p = { x: 1, y: 2 }; moveRight(p); p', '{ x: 1, y: 2 }', 'исходная точка после moveRight(p)'],
    ],
  },
  {
    id: 'o07', topic: 'obj', level: 2, fn: 'isDone',
    title: 'Поле с выбором',
    text: "Объяви тип Status ('todo' или 'done') и интерфейс Task: title — строка, status — Status. Потом допиши типы функции.",
    methods: ['type', 'interface'],
    example: `type Size = 'S' | 'M' | 'L';

interface Shirt {
  color: string;
  size: Size;
}

const shirt: Shirt = { color: 'белый', size: 'M' };`,
    hint: "Сначала type Status = 'todo' | 'done'; потом interface Task с двумя полями. В поле status пишут имя типа: status: Status.",
    starter: `// 1. Объяви тип Status: 'todo' или 'done'
// 2. Опиши интерфейс Task: title — строка, status — Status

function isDone(task) {
  return task.status === 'done';
}
`,
    solution: `type Status = 'todo' | 'done';

interface Task {
  title: string;
  status: Status;
}

function isDone(task: Task): boolean {
  return task.status === 'done';
}`,
    types: [
      { alias: 'Status', type: "'todo' | 'done'" },
      { ok: "const t: Task = { title: 'Тесты', status: 'todo' };" },
      { err: "const t: Task = { title: 'Тесты', status: 'later' };" },
      { err: "const t: Task = { status: 'done' };" },
    ],
    tests: [["{ title: 'Тесты', status: 'done' }", 'true'], ["{ title: 'Тесты', status: 'todo' }", 'false']],
  },
  {
    id: 'o08', topic: 'obj', level: 3, fn: 'describeDog',
    title: 'Интерфейс-наследник',
    text: 'У собаки есть всё, что у животного (name), и ещё порода. Опиши интерфейс Dog, не переписывая name заново.',
    methods: ['extends'],
    example: `interface Shape {
  color: string;
}

interface Circle extends Shape {
  radius: number;
}

const c: Circle = { color: 'red', radius: 5 };`,
    hint: 'interface Dog extends Animal { ... } — в скобках только новое поле breed. Поле name придёт из Animal само.',
    starter: `interface Animal {
  name: string;
}

// 1. Опиши интерфейс Dog: всё, что есть у Animal, плюс breed — строка

function describeDog(dog) {
  return dog.name + ' (' + dog.breed + ')';
}
`,
    solution: `interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

function describeDog(dog: Dog): string {
  return dog.name + ' (' + dog.breed + ')';
}`,
    types: [
      { ok: "const d: Dog = { name: 'Рекс', breed: 'овчарка' };" },
      { err: "const d: Dog = { breed: 'овчарка' };" },
      { err: "const d: Dog = { name: 'Рекс' };" },
      { ok: "const d: Dog = { name: 'Рекс', breed: 'овчарка' };\nconst a: Animal = d;" },
    ],
    uses: [['extends\\s+Animal|Animal\\s*&|&\\s*Animal', 'Не переписывай name заново: возьми его из Animal через extends.']],
    tests: [["{ name: 'Рекс', breed: 'овчарка' }", "'Рекс (овчарка)'"]],
  },
  {
    id: 'o09', topic: 'obj', level: 3, fn: 'countWords',
    title: 'Объект-счётчик',
    text: 'Посчитай, сколько раз встречается каждое слово. Результат — объект «слово → число». У такого объекта заранее неизвестны имена полей, поэтому его тип: Record<string, number>.',
    methods: ['Record<string, number>', 'for...of', '??'],
    example: `const ages: Record<string, number> = {};

ages['Аня'] = 20;
ages['Олег'] = 31;
// ключи — любые строки, значения — только числа`,
    hint: 'Заведи пустой объект: const counts: Record<string, number> = {}. Для каждого слова: counts[word] = (counts[word] ?? 0) + 1.',
    starter: `function countWords(words) {

}
`,
    solution: `function countWords(words: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const word of words) {
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}`,
    types: [{ expr: "countWords(['a'])", type: 'Record<string, number>' }, { err: "countWords('a b');" }],
    tests: [["['кот', 'пёс', 'кот']", '{ кот: 2, пёс: 1 }'], ['[]', '{}']],
  },
  {
    id: 'o10', topic: 'obj', level: 3, fn: 'itemTitles',
    title: 'Объект в объекте',
    text: 'Опиши интерфейс Order по комментарию в коде: внутри него массив товаров и вложенный объект с покупателем. Потом допиши типы функции.',
    methods: ['Product[]', '{ name: string; email?: string }'],
    example: `interface Author {
  name: string;
}

interface Book {
  title: string;
  authors: Author[];
  cover: { width: number; height: number };
}`,
    hint: 'Поле может иметь любой тип: массив другого интерфейса (items: Product[]) или объект, описанный прямо на месте (customer: { name: string; email?: string }).',
    starter: `interface Product {
  title: string;
  price: number;
}

// 1. Опиши интерфейс Order:
//    id — число
//    items — массив товаров (Product)
//    customer — объект: name — строка, email — строка, но её может не быть

function itemTitles(order) {
  return order.items.map((item) => item.title);
}
`,
    solution: `interface Product {
  title: string;
  price: number;
}

interface Order {
  id: number;
  items: Product[];
  customer: { name: string; email?: string };
}

function itemTitles(order: Order): string[] {
  return order.items.map((item) => item.title);
}`,
    types: [
      { ok: "const o: Order = { id: 1, items: [{ title: 'Чай', price: 250 }], customer: { name: 'Аня', email: 'a@b.c' } };" },
      { ok: "const o: Order = { id: 1, items: [], customer: { name: 'Аня' } };" },
      { err: "const o: Order = { id: 1, items: 'Чай', customer: { name: 'Аня' } };" },
      { err: "const o: Order = { id: 1, items: [], customer: { email: 'a@b.c' } };" },
      { expr: "itemTitles({ id: 1, items: [], customer: { name: 'Аня' } })", type: 'string[]' },
    ],
    tests: [["{ id: 1, items: [{ title: 'Чай', price: 250 }, { title: 'Мёд', price: 90 }], customer: { name: 'Аня' } }", "['Чай', 'Мёд']"]],
  },
  {
    id: 'o11', topic: 'obj', level: 4, fn: 'updateUser',
    title: 'Часть объекта',
    text: 'changes — это «кусочек User»: любые его поля, но не обязательно все. Писать второй интерфейс не нужно: есть готовый тип Partial<User>, он делает все поля необязательными.',
    methods: ['Partial<User>'],
    example: `interface Settings {
  theme: string;
  fontSize: number;
}

const patch: Partial<Settings> = { fontSize: 16 }; // theme можно не указывать`,
    hint: 'Тип второго параметра — Partial<User>. Результат — снова полный User.',
    starter: `interface User {
  name: string;
  age: number;
}

function updateUser(user, changes) {
  return { ...user, ...changes };
}
`,
    solution: `interface User {
  name: string;
  age: number;
}

function updateUser(user: User, changes: Partial<User>): User {
  return { ...user, ...changes };
}`,
    typeSetup: "const u: User = { name: 'Аня', age: 20 };",
    types: [
      { ok: 'updateUser(u, { age: 21 });' },
      { ok: 'updateUser(u, {});' },
      { err: "updateUser(u, { age: '21' });" },
      { err: "updateUser(u, { city: 'Минск' });" },
      { expr: 'updateUser(u, { age: 21 })', type: 'User' },
    ],
    tests: [
      ["{ name: 'Аня', age: 20 }, { age: 21 }", "{ name: 'Аня', age: 21 }"],
      ["@const u = { name: 'Аня', age: 20 }; updateUser(u, { age: 21 }); u", "{ name: 'Аня', age: 20 }", 'исходный объект после updateUser(u, { age: 21 })'],
    ],
  },
  {
    id: 'o12', topic: 'obj', level: 4, fn: 'toPreview',
    title: 'Взять только нужные поля',
    text: 'Для списка пользователей нужны только id и name — без почты и пароля. Объяви тип UserPreview через Pick и верни из функции объект только с этими двумя полями.',
    methods: ["Pick<User, 'id' | 'name'>"],
    example: `interface Book {
  title: string;
  pages: number;
  price: number;
}

type BookCard = Pick<Book, 'title' | 'price'>;
// то же самое, что { title: string; price: number }`,
    hint: "Pick<Откуда, 'поле' | 'поле'> берёт из интерфейса только перечисленные поля. В теле собери новый объект: { id: user.id, name: user.name }.",
    starter: `interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// 1. Объяви тип UserPreview: из User нужны только id и name (используй Pick)

function toPreview(user) {

}
`,
    solution: `interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type UserPreview = Pick<User, 'id' | 'name'>;

function toPreview(user: User): UserPreview {
  return { id: user.id, name: user.name };
}`,
    uses: [['Pick\\s*<', 'Объяви UserPreview через Pick<User, ...>, а не новым интерфейсом.']],
    types: [
      { alias: 'UserPreview', type: '{ id: number; name: string }' },
      { err: "toPreview({ id: 1, name: 'Аня' });" },
    ],
    tests: [["{ id: 1, name: 'Аня', email: 'a@b.c', password: '123' }", "{ id: 1, name: 'Аня' }"]],
  },
  {
    id: 'o13', topic: 'obj', level: 4, fn: 'getField',
    title: 'Имя поля как тип',
    text: "key — не любая строка, а только имя поля User: 'name' или 'city'. Перечислять их руками не нужно: такой тип даёт keyof User.",
    methods: ['keyof User'],
    example: `interface Book {
  title: string;
  author: string;
}

type BookKey = keyof Book; // 'title' | 'author'

const key: BookKey = 'title';`,
    hint: 'Тип второго параметра — keyof User. Оба поля у User — строки, значит и результат — string.',
    starter: `interface User {
  name: string;
  city: string;
}

function getField(user, key) {
  return user[key];
}
`,
    solution: `interface User {
  name: string;
  city: string;
}

function getField(user: User, key: keyof User): string {
  return user[key];
}`,
    uses: [['keyof\\s+User', 'Используй keyof User: он сам возьмёт имена полей из интерфейса.']],
    typeSetup: "const u: User = { name: 'Аня', city: 'Минск' };",
    types: [{ ok: "getField(u, 'city');" }, { err: "getField(u, 'age');" }, { expr: "getField(u, 'name')", type: 'string' }],
    tests: [["{ name: 'Аня', city: 'Минск' }, 'city'", "'Минск'"], ["{ name: 'Аня', city: 'Минск' }, 'name'", "'Аня'"]],
  },
  {
    id: 'o14', topic: 'obj', level: 5, fn: 'groupByCategory',
    title: 'Разложить по категориям',
    text: 'Разложи товары по категориям. Результат — объект «название категории → массив товаров». Напиши всё сам: типы и тело.',
    methods: ['Record<string, Product[]>', 'for...of', 'push'],
    example: `const byLetter: Record<string, string[]> = {};

byLetter['к'] = [];
byLetter['к'].push('кот');
// { к: ['кот'] }`,
    hint: 'Заведи const groups: Record<string, Product[]> = {}. Для каждого товара: если группы с такой категорией ещё нет — создай пустой массив, потом добавь товар через push.',
    starter: `interface Product {
  title: string;
  category: string;
}

function groupByCategory(items) {

}
`,
    solution: `interface Product {
  title: string;
  category: string;
}

function groupByCategory(items: Product[]): Record<string, Product[]> {
  const groups: Record<string, Product[]> = {};
  for (const item of items) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
  }
  return groups;
}`,
    types: [{ expr: 'groupByCategory([])', type: 'Record<string, Product[]>' }, { err: "groupByCategory([{ title: 'Чай' }]);" }],
    tests: [
      [
        "[{ title: 'Чай', category: 'напитки' }, { title: 'Мёд', category: 'еда' }, { title: 'Сок', category: 'напитки' }]",
        "{ напитки: [{ title: 'Чай', category: 'напитки' }, { title: 'Сок', category: 'напитки' }], еда: [{ title: 'Мёд', category: 'еда' }] }",
      ],
      ['[]', '{}'],
    ],
  },

  // ───────── NARROWING ─────────
  {
    id: 'n01', topic: 'narrow', level: 1, fn: 'formatValue',
    title: 'Строка или число?',
    text: 'value — строка или число. Строку верни большими буквами, число — с двумя знаками после запятой. Сейчас код не компилируется: у числа нет toUpperCase. Сначала выясни, что пришло.',
    methods: ['typeof', 'toUpperCase', 'toFixed'],
    example: `function double(value: string | number): string {
  if (typeof value === 'string') {
    return value + value;      // здесь value — точно строка
  }
  return String(value * 2);    // а здесь — точно число
}`,
    hint: "if (typeof value === 'string') { ... } — внутри if TypeScript знает, что value строка. После if остаётся только число: там можно value.toFixed(2).",
    starter: `function formatValue(value: string | number): string {
  return value.toUpperCase();
}
`,
    solution: `function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}`,
    tests: [["'ok'", "'OK'"], ['3.14159', "'3.14'"], ['2', "'2.00'"]],
  },
  {
    id: 'n02', topic: 'narrow', level: 1, fn: 'nameLength',
    title: 'А вдруг null',
    text: 'Имени может не быть — тогда приходит null. Верни длину имени, а для null — 0. Сейчас TypeScript ругается: у null нет length.',
    methods: ['=== null', 'if'],
    example: `function firstLetter(word: string | null): string {
  if (word === null) {
    return '?';
  }
  return word[0]; // здесь word — точно строка
}`,
    hint: 'Сначала проверь: if (name === null) return 0; — после этой строки TypeScript знает, что name точно строка.',
    starter: `function nameLength(name: string | null): number {
  return name.length;
}
`,
    solution: `function nameLength(name: string | null): number {
  if (name === null) {
    return 0;
  }
  return name.length;
}`,
    tests: [["'Аня'", '3'], ['null', '0'], ["''", '0']],
  },
  {
    id: 'n03', topic: 'narrow', level: 1, fn: 'withDefault',
    title: 'Запасное значение',
    text: 'Верни value, а если его нет (undefined) — fallback. Осторожно: 0 — настоящее значение, заменять его нельзя.',
    methods: ['??'],
    example: `function pageTitle(title: string | undefined): string {
  return title ?? 'Без названия';
}

pageTitle('Главная');  // 'Главная'
pageTitle(undefined);  // 'Без названия'`,
    hint: 'Оператор ?? берёт правую часть, только когда слева null или undefined. Ноль и пустая строка для него — обычные значения.',
    starter: `function withDefault(value: number | undefined, fallback: number): number {
  return value;
}
`,
    solution: `function withDefault(value: number | undefined, fallback: number): number {
  return value ?? fallback;
}`,
    tests: [['5, 1', '5'], ['undefined, 1', '1'], ['0, 1', '0']],
  },
  {
    id: 'n04', topic: 'narrow', level: 2, fn: 'getCity',
    title: 'Цепочка с вопросом',
    text: "Адреса у пользователя может не быть. Верни город, а если адреса нет — 'не указан'.",
    methods: ['?.', '??'],
    example: `interface Book {
  title: string;
  cover?: { color: string };
}

function coverColor(book: Book): string {
  return book.cover?.color ?? 'нет обложки';
}`,
    hint: 'user.address?.city — если адреса нет, вместо ошибки получится undefined. А запасное значение подставит ??.',
    starter: `interface User {
  name: string;
  address?: { city: string };
}

function getCity(user: User): string {
  return user.address.city;
}
`,
    solution: `interface User {
  name: string;
  address?: { city: string };
}

function getCity(user: User): string {
  return user.address?.city ?? 'не указан';
}`,
    tests: [["{ name: 'Аня', address: { city: 'Минск' } }", "'Минск'"], ["{ name: 'Олег' }", "'не указан'"]],
  },
  {
    id: 'n05', topic: 'narrow', level: 2, fn: 'findPrice',
    title: 'find может не найти',
    text: 'Метод find возвращает товар или undefined, если ничего не нашлось. TypeScript об этом помнит и не даёт взять price. Если товара нет — верни 0.',
    methods: ['find', '?.', '??'],
    example: `function firstLong(words: string[]): number {
  const found = words.find((word) => word.length > 5);
  // found: string | undefined
  return found?.length ?? 0;
}`,
    hint: 'Либо if (found === undefined) return 0; либо короче: found?.price ?? 0.',
    starter: `interface Product {
  title: string;
  price: number;
}

function findPrice(items: Product[], title: string): number {
  const found = items.find((item) => item.title === title);
  return found.price;
}
`,
    solution: `interface Product {
  title: string;
  price: number;
}

function findPrice(items: Product[], title: string): number {
  const found = items.find((item) => item.title === title);
  return found?.price ?? 0;
}`,
    tests: [["[{ title: 'Чай', price: 250 }], 'Чай'", '250'], ["[{ title: 'Чай', price: 250 }], 'Мёд'", '0'], ["[], 'Чай'", '0']],
  },
  {
    id: 'n06', topic: 'narrow', level: 2, fn: 'area',
    title: 'Какая фигура?',
    text: 'Приходит круг или прямоугольник. Посчитай площадь: у круга Math.PI * radius ** 2, у прямоугольника ширина на высоту. Отличить их можно по полю: у круга есть radius.',
    methods: ["'radius' in shape", 'Math.PI'],
    example: `interface Cat { meow: string }
interface Dog { bark: string }

function sound(pet: Cat | Dog): string {
  if ('meow' in pet) {
    return pet.meow;  // здесь pet — Cat
  }
  return pet.bark;    // здесь pet — Dog
}`,
    hint: "if ('radius' in shape) { ... } — внутри TypeScript считает shape кругом, после if — прямоугольником.",
    starter: `interface Circle {
  radius: number;
}

interface Rect {
  width: number;
  height: number;
}

function area(shape: Circle | Rect): number {

}
`,
    solution: `interface Circle {
  radius: number;
}

interface Rect {
  width: number;
  height: number;
}

function area(shape: Circle | Rect): number {
  if ('radius' in shape) {
    return Math.PI * shape.radius ** 2;
  }
  return shape.width * shape.height;
}`,
    tests: [['{ width: 2, height: 3 }', '6'], ['{ radius: 1 }', 'Math.PI'], ['{ radius: 2 }', 'Math.PI * 4']],
  },
  {
    id: 'n07', topic: 'narrow', level: 3, fn: 'showResult',
    title: 'Поле-метка',
    text: "У результата два вида, и у каждого своя метка в поле status. Если 'ok' — верни data. Если 'error' — верни 'Ошибка: ' + message. Проверь status, и TypeScript сам поймёт, какие поля доступны.",
    methods: ["result.status === 'ok'"],
    example: `type Answer =
  | { kind: 'yes'; reason: string }
  | { kind: 'no' };

function explain(answer: Answer): string {
  if (answer.kind === 'yes') {
    return answer.reason; // reason есть только у 'yes'
  }
  return 'нет';
}`,
    hint: "if (result.status === 'ok') return result.data; — а после if остался только вариант 'error', у него есть message.",
    starter: `type LoadResult =
  | { status: 'ok'; data: string }
  | { status: 'error'; message: string };

function showResult(result: LoadResult): string {
  return result.data;
}
`,
    solution: `type LoadResult =
  | { status: 'ok'; data: string }
  | { status: 'error'; message: string };

function showResult(result: LoadResult): string {
  if (result.status === 'ok') {
    return result.data;
  }
  return 'Ошибка: ' + result.message;
}`,
    tests: [["{ status: 'ok', data: 'готово' }", "'готово'"], ["{ status: 'error', message: 'нет сети' }", "'Ошибка: нет сети'"]],
  },
  {
    id: 'n08', topic: 'narrow', level: 3, fn: 'perimeter',
    title: 'Свой тип с меткой',
    text: 'Теперь опиши такой тип сам. Shape — круг или квадрат, метка лежит в поле kind. Потом посчитай периметр: у круга 2 * Math.PI * radius, у квадрата 4 * side.',
    methods: ['type Shape = … | …', "shape.kind === 'circle'"],
    example: `type Pet =
  | { kind: 'cat'; lives: number }
  | { kind: 'fish'; depth: number };

const pet: Pet = { kind: 'fish', depth: 3 };`,
    hint: "Два варианта через черту: { kind: 'circle'; radius: number } | { kind: 'square'; side: number }. В функции проверь shape.kind.",
    starter: `// 1. Объяви тип Shape — один из двух вариантов:
//    { kind: 'circle', radius: число }
//    { kind: 'square', side: число }

function perimeter(shape) {

}
`,
    solution: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

function perimeter(shape: Shape): number {
  if (shape.kind === 'circle') {
    return 2 * Math.PI * shape.radius;
  }
  return 4 * shape.side;
}`,
    types: [
      { ok: "const s: Shape = { kind: 'square', side: 2 };" },
      { ok: "const s: Shape = { kind: 'circle', radius: 1 };" },
      { err: "const s: Shape = { kind: 'circle', side: 2 };" },
      { err: "const s: Shape = { kind: 'triangle', side: 2 };" },
    ],
    tests: [["{ kind: 'square', side: 2 }", '8'], ["{ kind: 'circle', radius: 1 }", '2 * Math.PI']],
  },
  {
    id: 'n09', topic: 'narrow', level: 3, fn: 'toArray',
    title: 'Одно или много',
    text: 'Приходит одна строка или массив строк. Всегда возвращай массив: одну строку заверни в массив, массив верни как есть.',
    methods: ['Array.isArray'],
    example: `function total(value: number | number[]): number {
  if (Array.isArray(value)) {
    return value.length;  // здесь value — массив
  }
  return 1;               // здесь — одно число
}`,
    hint: 'typeof для массива скажет "object" — это не помогает. Массив проверяют так: Array.isArray(value).',
    starter: `function toArray(value: string | string[]): string[] {
  return value;
}
`,
    solution: `function toArray(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}`,
    tests: [["'кот'", "['кот']"], ["['кот', 'пёс']", "['кот', 'пёс']"], ['[]', '[]']],
  },
  {
    id: 'n10', topic: 'narrow', level: 4, fn: 'safeLength',
    title: 'Неизвестно что',
    text: 'value может быть чем угодно — это тип unknown. С ним нельзя делать ничего, пока не проверишь, что внутри. Если это строка или массив — верни длину, иначе 0.',
    methods: ['unknown', 'typeof', 'Array.isArray'],
    example: `function toText(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(1);  // теперь можно: это число
  }
  return 'не число';
}`,
    hint: "Две проверки через ||: typeof value === 'string' || Array.isArray(value). Внутри такого if у value есть length.",
    starter: `function safeLength(value: unknown): number {
  return value.length;
}
`,
    solution: `function safeLength(value: unknown): number {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length;
  }
  return 0;
}`,
    tests: [["'кот'", '3'], ['[1, 2]', '2'], ['42', '0'], ['null', '0']],
  },
  {
    id: 'n11', topic: 'narrow', level: 4, fn: 'onlyStrings',
    title: 'Своя проверка типа',
    text: 'isString должна стать «проверкой типа»: принимать unknown и обещать TypeScript, что value — строка. Для этого тип результата пишут особым образом: value is string. Тогда filter в onlyStrings вернёт уже string[].',
    methods: ['value is string'],
    example: `function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

const mixed: unknown[] = [1, 'a', 2];
const numbers = mixed.filter(isNumber); // number[]`,
    hint: 'Допиши у isString: (value: unknown): value is string. Тело менять не нужно.',
    starter: `function isString(value) {
  return typeof value === 'string';
}

function onlyStrings(values: unknown[]): string[] {
  return values.filter(isString);
}
`,
    solution: `function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function onlyStrings(values: unknown[]): string[] {
  return values.filter(isString);
}`,
    uses: [['value\\s+is\\s+string', 'У isString напиши тип результата: value is string.']],
    types: [
      { ok: "const v: unknown = 'кот';\nif (isString(v)) {\n  v.toUpperCase();\n}" },
      { expr: "onlyStrings([1, 'a'])", type: 'string[]' },
    ],
    tests: [["[1, 'кот', null, 'пёс']", "['кот', 'пёс']"], ['[1, 2]', '[]']],
  },
  {
    id: 'n12', topic: 'narrow', level: 4, fn: 'errorMessage',
    title: 'Что прилетело в catch',
    text: 'В catch ошибка имеет тип unknown: бросить можно что угодно, не только Error. Если это настоящая ошибка — верни её message. Иначе преврати значение в строку через String().',
    methods: ['instanceof Error', 'String'],
    example: `function isRealError(value: unknown): boolean {
  if (value instanceof Error) {
    console.log(value.message); // здесь value — Error
    return true;
  }
  return false;
}`,
    hint: 'if (error instanceof Error) return error.message; — после этой проверки у error появляются поля ошибки.',
    starter: `function errorMessage(error: unknown): string {
  return error.message;
}
`,
    solution: `function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}`,
    tests: [["new Error('нет сети')", "'нет сети'"], ["'таймаут'", "'таймаут'"], ['404', "'404'"]],
  },
  {
    id: 'n13', topic: 'narrow', level: 5, fn: 'describeEvent',
    title: 'Три события',
    text: "У события три варианта. Верни описание: 'клик в 10,20', 'клавиша Enter', 'прокрутка на 50'. Разбери варианты через switch по event.type.",
    methods: ['switch', 'case'],
    example: `type Light = { color: 'red' } | { color: 'green'; seconds: number };

function label(light: Light): string {
  switch (light.color) {
    case 'red':
      return 'стой';
    case 'green':
      return 'иди ' + light.seconds + ' с';
  }
}`,
    hint: "switch (event.type) с тремя case. В каждом case TypeScript знает свой вариант: в 'click' доступны x и y, в 'key' — key, в 'scroll' — delta.",
    starter: `type AppEvent =
  | { type: 'click'; x: number; y: number }
  | { type: 'key'; key: string }
  | { type: 'scroll'; delta: number };

function describeEvent(event: AppEvent): string {

}
`,
    solution: `type AppEvent =
  | { type: 'click'; x: number; y: number }
  | { type: 'key'; key: string }
  | { type: 'scroll'; delta: number };

function describeEvent(event: AppEvent): string {
  switch (event.type) {
    case 'click':
      return 'клик в ' + event.x + ',' + event.y;
    case 'key':
      return 'клавиша ' + event.key;
    case 'scroll':
      return 'прокрутка на ' + event.delta;
  }
}`,
    tests: [
      ["{ type: 'click', x: 10, y: 20 }", "'клик в 10,20'"],
      ["{ type: 'key', key: 'Enter' }", "'клавиша Enter'"],
      ["{ type: 'scroll', delta: 50 }", "'прокрутка на 50'"],
    ],
  },

  // ───────── GENERICS ─────────
  {
    id: 'g01', topic: 'gen', level: 1, fn: 'identity',
    title: 'Тип-переменная',
    text: 'Функция возвращает то же, что получила. Какой тип вошёл — такой и должен выйти: строка → строка, число → число. Для этого тип делают «переменной» и пишут её в угловых скобках: <T>.',
    methods: ['<T>', 'value: T'],
    example: `function twice<T>(value: T): T[] {
  return [value, value];
}

twice('a'); // T стал string → результат string[]
twice(5);   // T стал number → результат number[]`,
    hint: 'После имени функции объяви переменную типа: identity<T>. Потом используй T как обычный тип: (value: T): T.',
    starter: `function identity(value) {
  return value;
}
`,
    solution: `function identity<T>(value: T): T {
  return value;
}`,
    types: [
      { ok: "const s: string = identity('кот');\nconst n: number = identity(5);" },
      { err: "const n: number = identity('кот');" },
      { expr: "identity<string[]>(['a'])", type: 'string[]' },
    ],
    tests: [["'кот'", "'кот'"], ['5', '5']],
  },
  {
    id: 'g02', topic: 'gen', level: 1, fn: 'first',
    title: 'Первый элемент',
    text: 'Верни первый элемент массива. Массив может быть из чего угодно — T[]. Результат — элемент этого же типа или undefined, если массив пуст.',
    methods: ['T[]', 'T | undefined'],
    example: `function size<T>(items: T[]): number {
  return items.length;
}

size(['a', 'b']); // T = string
size([1, 2, 3]);  // T = number`,
    hint: 'Массив элементов типа T — это T[]. Сигнатура: first<T>(items: T[]): T | undefined.',
    starter: `function first(items) {
  return items[0];
}
`,
    solution: `function first<T>(items: T[]): T | undefined {
  return items[0];
}`,
    types: [
      { expr: "first(['a', 'b'])", type: 'string | undefined' },
      { expr: 'first([1, 2])', type: 'number | undefined' },
      { err: "first('abc');" },
    ],
    tests: [["['a', 'b']", "'a'"], ['[]', 'undefined'], ['[7]', '7']],
  },
  {
    id: 'g03', topic: 'gen', level: 1, fn: 'wrap',
    title: 'Завернуть в массив',
    text: 'Заверни значение в массив. Пришла строка — выйдет массив строк, пришло число — массив чисел.',
    methods: ['<T>', 'T[]'],
    example: `function first<T>(items: T[]): T | undefined {
  return items[0];
}`,
    hint: 'Здесь наоборот: на входе одно значение T, на выходе массив T[].',
    starter: `function wrap(value) {
  return [value];
}
`,
    solution: `function wrap<T>(value: T): T[] {
  return [value];
}`,
    types: [{ expr: "wrap('кот')", type: 'string[]' }, { expr: 'wrap(5)', type: 'number[]' }, { expr: 'wrap([true])', type: 'boolean[][]' }],
    tests: [["'кот'", "['кот']"], ['5', '[5]']],
  },
  {
    id: 'g04', topic: 'gen', level: 2, fn: 'pair',
    title: 'Две переменные типа',
    text: 'Собери из двух значений пару. Типы у них могут быть разными, поэтому переменных типа тоже две: A и B. Результат — кортеж [A, B].',
    methods: ['<A, B>', '[A, B]'],
    example: `function swap<A, B>(a: A, b: B): [B, A] {
  return [b, a];
}

swap('x', 1); // [number, string]`,
    hint: 'Переменные типа перечисляют через запятую: pair<A, B>(a: A, b: B): [A, B].',
    starter: `function pair(a, b) {
  return [a, b];
}
`,
    solution: `function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}`,
    types: [
      { expr: "pair<string, number>('кот', 3)", type: '[string, number]' },
      { ok: "const p: [string, boolean] = pair('кот', true);" },
      { err: "const p: [string, string] = pair('кот', 3);" },
    ],
    tests: [["'кот', 3", "['кот', 3]"], ['true, null', '[true, null]']],
  },
  {
    id: 'g05', topic: 'gen', level: 2, fn: 'unbox',
    title: 'Интерфейс с параметром',
    text: 'Опиши интерфейс Box<T>: коробка с одним полем value типа T. Потом допиши функцию, которая достаёт значение из коробки.',
    methods: ['interface Box<T>', 'Box<T>'],
    example: `interface Reply<T> {
  data: T;
  time: number;
}

const a: Reply<string> = { data: 'ok', time: 12 };
const b: Reply<number[]> = { data: [1, 2], time: 30 };`,
    hint: 'interface Box<T> { value: T } — дальше Box<number> значит «коробка с числом». У функции: unbox<T>(box: Box<T>): T.',
    starter: `// 1. Опиши интерфейс Box<T>: одно поле value типа T

function unbox(box) {
  return box.value;
}
`,
    solution: `interface Box<T> {
  value: T;
}

function unbox<T>(box: Box<T>): T {
  return box.value;
}`,
    types: [
      { ok: 'const b: Box<number> = { value: 1 };' },
      { err: "const b: Box<number> = { value: 'один' };" },
      { ok: 'const n: number = unbox({ value: 5 });' },
      { expr: "unbox<string>({ value: 'кот' })", type: 'string' },
    ],
    tests: [['{ value: 5 }', '5'], ["{ value: 'кот' }", "'кот'"]],
  },
  {
    id: 'g06', topic: 'gen', level: 3, fn: 'mapArray',
    title: 'Свой map',
    text: 'Это самодельный map. items — массив элементов типа T. Функция fn превращает один T во что-то другое — U. Результат — массив U.',
    methods: ['<T, U>', '(item: T) => U', 'U[]'],
    example: `function countBy<T>(items: T[], isGood: (item: T) => boolean): number {
  let count = 0;
  for (const item of items) {
    if (isGood(item)) count += 1;
  }
  return count;
}`,
    hint: 'Сигнатура: mapArray<T, U>(items: T[], fn: (item: T) => U): U[]. Массиву result тоже подскажи тип: const result: U[] = [].',
    starter: `function mapArray(items, fn) {
  const result = [];
  for (const item of items) {
    result.push(fn(item));
  }
  return result;
}
`,
    solution: `function mapArray<T, U>(items: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of items) {
    result.push(fn(item));
  }
  return result;
}`,
    types: [
      { expr: 'mapArray([1, 2], (n) => String(n))', type: 'string[]' },
      { expr: "mapArray(['кот'], (word) => word.length)", type: 'number[]' },
      { err: 'mapArray([1, 2], (n) => n.toUpperCase());' },
    ],
    tests: [
      ['@mapArray([1, 2, 3], (n) => n * 2)', '[2, 4, 6]', 'mapArray([1, 2, 3], (n) => n * 2)'],
      ["@mapArray(['кот', 'жираф'], (word) => word.length)", '[3, 5]', "mapArray(['кот', 'жираф'], (word) => word.length)"],
    ],
  },
  {
    id: 'g07', topic: 'gen', level: 3, fn: 'filterBy',
    title: 'Свой filter',
    text: 'Самодельный filter: оставляет элементы, для которых isGood вернула true. Тип элементов любой, но результат — массив того же типа, что и на входе.',
    methods: ['<T>', '(item: T) => boolean'],
    example: `function findFirst<T>(items: T[], isGood: (item: T) => boolean): T | undefined {
  return items.find(isGood);
}`,
    hint: 'filterBy<T>(items: T[], isGood: (item: T) => boolean): T[] — одна переменная T на всё.',
    starter: `function filterBy(items, isGood) {
  return items.filter(isGood);
}
`,
    solution: `function filterBy<T>(items: T[], isGood: (item: T) => boolean): T[] {
  return items.filter(isGood);
}`,
    types: [
      { expr: "filterBy(['кот', 'жираф'], (word) => word.length > 3)", type: 'string[]' },
      { err: 'filterBy([1, 2], (n) => n.length > 3);' },
    ],
    tests: [
      ["@filterBy(['кот', 'жираф'], (word) => word.length > 3)", "['жираф']", "filterBy(['кот', 'жираф'], (word) => word.length > 3)"],
      ['@filterBy([1, 2, 3, 4], (n) => n % 2 === 0)', '[2, 4]', 'filterBy([1, 2, 3, 4], (n) => n % 2 === 0)'],
    ],
  },
  {
    id: 'g08', topic: 'gen', level: 3, fn: 'longest',
    title: 'Не любой тип',
    text: 'Верни тот из двух аргументов, который длиннее. Подходит не любой T, а только тот, у которого есть length: строки, массивы. Ограничь T через extends.',
    methods: ['T extends { length: number }'],
    example: `function getName<T extends { name: string }>(item: T): string {
  return item.name;
}

getName({ name: 'Аня', age: 20 }); // подходит: name есть
// getName({ age: 20 }) — ошибка: нет name`,
    hint: 'longest<T extends { length: number }>(a: T, b: T): T — «T любой, но с числовым полем length».',
    starter: `function longest(a, b) {
  return a.length >= b.length ? a : b;
}
`,
    solution: `function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}`,
    types: [
      { ok: "const s: string = longest('кот', 'жираф');" },
      { ok: 'const a: number[] = longest([1], [1, 2]);' },
      { err: 'longest(1, 2);' },
    ],
    tests: [["'кот', 'жираф'", "'жираф'"], ['[1], [1, 2]', '[1, 2]'], ["'аб', 'вг'", "'аб'"]],
  },
  {
    id: 'g09', topic: 'gen', level: 4, fn: 'getProp',
    title: 'Поле по имени',
    text: 'Верни значение поля по его имени. Объект любой (T), а key — только имя одного из его полей (K). Тогда результат — тип именно этого поля: T[K].',
    methods: ['K extends keyof T', 'T[K]'],
    example: `interface Book {
  title: string;
  pages: number;
}

type Title = Book['title']; // string
type Pages = Book['pages']; // number`,
    hint: 'getProp<T, K extends keyof T>(obj: T, key: K): T[K]. Читается: «K — одно из имён полей T; результат — тип поля K у объекта T».',
    starter: `function getProp(obj, key) {
  return obj[key];
}
`,
    solution: `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}`,
    typeSetup: "const user = { name: 'Аня', age: 20 };",
    types: [
      { expr: "getProp(user, 'name')", type: 'string' },
      { expr: "getProp(user, 'age')", type: 'number' },
      { err: "getProp(user, 'email');" },
    ],
    tests: [["{ name: 'Аня', age: 20 }, 'age'", '20'], ["{ name: 'Аня', age: 20 }, 'name'", "'Аня'"]],
  },
  {
    id: 'g10', topic: 'gen', level: 4, fn: 'pluck',
    title: 'Собрать одно поле',
    text: 'Из массива объектов собери массив значений одного поля. Типы — как в прошлой задаче, только объектов теперь много.',
    methods: ['T[]', 'K extends keyof T', 'T[K][]'],
    example: `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}`,
    hint: 'pluck<T, K extends keyof T>(items: T[], key: K): T[K][]. Запись T[K][] — «массив значений поля K».',
    starter: `function pluck(items, key) {
  return items.map((item) => item[key]);
}
`,
    solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}`,
    typeSetup: "const users = [{ name: 'Аня', age: 20 }, { name: 'Олег', age: 31 }];",
    types: [
      { expr: "pluck(users, 'name')", type: 'string[]' },
      { expr: "pluck(users, 'age')", type: 'number[]' },
      { err: "pluck(users, 'city');" },
    ],
    tests: [["[{ name: 'Аня', age: 20 }, { name: 'Олег', age: 31 }], 'name'", "['Аня', 'Олег']"], ["[{ name: 'Аня', age: 20 }], 'age'", '[20]']],
  },
  {
    id: 'g11', topic: 'gen', level: 4, fn: 'unwrap',
    title: 'Ответ или ошибка',
    text: 'Объяви тип ApiResult<T>: либо успех с данными типа T, либо ошибка с текстом. Метка — поле ok. Потом допиши типы функции: она достаёт данные, а при ошибке возвращает запасное значение.',
    methods: ['type ApiResult<T> = … | …'],
    example: `type Maybe<T> = { has: true; value: T } | { has: false };

const a: Maybe<number> = { has: true, value: 5 };
const b: Maybe<number> = { has: false };`,
    hint: 'type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }. У функции: unwrap<T>(result: ApiResult<T>, fallback: T): T.',
    starter: `// 1. Объяви тип ApiResult<T> — один из двух вариантов:
//    { ok: true, data: T }
//    { ok: false, error: строка }

function unwrap(result, fallback) {
  return result.ok ? result.data : fallback;
}
`,
    solution: `type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function unwrap<T>(result: ApiResult<T>, fallback: T): T {
  return result.ok ? result.data : fallback;
}`,
    types: [
      { ok: 'const r: ApiResult<number> = { ok: true, data: 5 };' },
      { ok: "const r: ApiResult<number> = { ok: false, error: 'нет сети' };" },
      { err: "const r: ApiResult<number> = { ok: true, data: 'пять' };" },
      { err: "const r: ApiResult<number> = { ok: true, error: 'нет сети' };" },
      { expr: "unwrap<string>({ ok: false, error: 'нет сети' }, 'пусто')", type: 'string' },
    ],
    tests: [['{ ok: true, data: 5 }, 0', '5'], ["{ ok: false, error: 'нет сети' }, 0", '0']],
  },
  {
    id: 'g12', topic: 'gen', level: 5, fn: 'groupBy',
    title: 'Группировка чего угодно',
    text: 'Сгруппируй элементы любого типа. Функция getKey по элементу возвращает название его группы (строку). Результат — объект «название → массив элементов». Напиши всё сам.',
    methods: ['<T>', '(item: T) => string', 'Record<string, T[]>'],
    example: `function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}`,
    hint: 'groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]>. Внутри: получи key, если groups[key] ещё нет — создай пустой массив, потом push.',
    starter: `function groupBy(items, getKey) {

}
`,
    solution: `function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}`,
    types: [
      { expr: "groupBy([1, 2, 3], (n) => (n % 2 === 0 ? 'чёт' : 'нечет'))", type: 'Record<string, number[]>' },
      { err: 'groupBy([1, 2], (n) => n);' },
    ],
    tests: [
      ["@groupBy(['кот', 'кит', 'лев'], (word) => word[0])", "{ к: ['кот', 'кит'], л: ['лев'] }", "groupBy(['кот', 'кит', 'лев'], (word) => word[0])"],
      ["@groupBy([1, 2, 3], (n) => (n % 2 === 0 ? 'чёт' : 'нечет'))", '{ нечет: [1, 3], чёт: [2] }', "groupBy([1, 2, 3], (n) => (n % 2 === 0 ? 'чёт' : 'нечет'))"],
    ],
  },
  {
    id: 'g13', topic: 'gen', level: 5, fn: 'memoize',
    title: 'Функция с памятью',
    text: 'Верни новую функцию, которая запоминает ответы: при повторном вызове с тем же аргументом она не вызывает fn заново, а достаёт готовый результат из Map. Подумай, где объявить Map, чтобы она жила между вызовами.',
    methods: ['<A, R>', '(arg: A) => R', 'new Map<A, R>()'],
    example: `function counter(): () => number {
  let count = 0;        // живёт между вызовами

  return () => {
    count += 1;
    return count;
  };
}

const next = counter();
next(); // 1
next(); // 2`,
    hint: 'memoize<A, R>(fn: (arg: A) => R): (arg: A) => R. Map объяви снаружи возвращаемой функции: const cache = new Map<A, R>(). Внутри: достань cache.get(arg); если там не undefined — верни; иначе посчитай, положи через set и верни.',
    starter: `function memoize(fn) {

}
`,
    solution: `function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache = new Map<A, R>();

  return (arg) => {
    const saved = cache.get(arg);
    if (saved !== undefined) {
      return saved;
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}`,
    allowAs: true,
    types: [
      { expr: 'memoize((n: number) => String(n))', type: '(arg: number) => string' },
      { err: "memoize('не функция');" },
    ],
    tests: [
      [
        '@let calls = 0; const square = memoize((n) => { calls += 1; return n * n; }); [square(4), square(4), square(5), calls]',
        '[16, 16, 25, 2]',
        '[square(4), square(4), square(5), сколько раз вызвана fn]',
      ],
    ],
  },

  // ───────── PRACTICE ─────────
  {
    id: 'r01', topic: 'real', level: 1, fn: 'Counter',
    title: 'Типы в классе',
    text: 'Допиши типы в классе. У метода add параметр — число, результата нет (void). У isZero результат — boolean. Поле count TypeScript уже понял сам: по значению 0.',
    methods: ['add(step: number): void', 'isZero(): boolean'],
    example: `class Lamp {
  isOn = false;

  toggle(): void {
    this.isOn = !this.isOn;
  }

  setBrightness(percent: number): string {
    return percent + '%';
  }
}`,
    hint: 'В методах типы пишут так же, как в функциях: параметр — (step: number), результат — после скобок: ): void {',
    starter: `class Counter {
  count = 0;

  add(step) {
    this.count += step;
  }

  isZero() {
    return this.count === 0;
  }
}
`,
    solution: `class Counter {
  count = 0;

  add(step: number): void {
    this.count += step;
  }

  isZero(): boolean {
    return this.count === 0;
  }
}`,
    methodsTyped: true,
    types: [
      { expr: 'new Counter().add(2)', type: 'void' },
      { expr: 'new Counter().isZero()', type: 'boolean' },
      { err: "new Counter().add('2');" },
    ],
    tests: [
      ['@const c = new Counter(); c.add(2); c.add(3); c.count', '5', 'c.add(2); c.add(3); c.count'],
      ['@new Counter().isZero()', 'true', 'new Counter().isZero()'],
    ],
  },
  {
    id: 'r02', topic: 'real', level: 2, fn: 'Account',
    title: 'Поля и constructor',
    text: 'Допиши типы: owner — строка, balance — число. Сделай balance закрытым (private): снаружи узнать его можно только через getBalance().',
    methods: ['owner: string', 'private balance: number', 'constructor'],
    example: `class Player {
  name: string;
  private score: number;

  constructor(name: string) {
    this.name = name;
    this.score = 0;
  }

  getScore(): number {
    return this.score;
  }
}

// new Player('Аня').score — ошибка: поле private`,
    hint: 'Поля объявляют вверху класса: owner: string; private balance: number;. Типы нужны ещё у параметров constructor и у методов.',
    starter: `class Account {
  owner;
  balance;

  constructor(owner, start) {
    this.owner = owner;
    this.balance = start;
  }

  deposit(amount) {
    this.balance += amount;
  }

  getBalance() {
    return this.balance;
  }
}
`,
    solution: `class Account {
  owner: string;
  private balance: number;

  constructor(owner: string, start: number) {
    this.owner = owner;
    this.balance = start;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}`,
    methodsTyped: true,
    types: [
      { ok: "const a = new Account('Аня', 100);\na.deposit(50);\nconst b: number = a.getBalance();" },
      { expr: "new Account('Аня', 100).owner", type: 'string' },
      { err: "new Account('Аня', 100).balance;" },
      { err: "new Account('Аня', '100');" },
    ],
    tests: [["@const a = new Account('Аня', 100); a.deposit(50); a.getBalance()", '150', "new Account('Аня', 100) → deposit(50) → getBalance()"]],
  },
  {
    id: 'r03', topic: 'real', level: 2, fn: 'getTitle',
    title: 'Обещание с типом',
    text: 'load — функция без параметров, которая возвращает обещание (Promise) объекта с полем title. Сама getTitle тоже async, значит и её результат — обещание: Promise<string>.',
    methods: ['Promise<string>', '() => Promise<{ title: string }>'],
    example: `async function getAge(load: () => Promise<{ age: number }>): Promise<number> {
  const user = await load();
  return user.age;
}`,
    hint: 'В угловых скобках у Promise пишут, что окажется внутри, когда обещание выполнится. У async-функции тип результата всегда Promise<...>.',
    starter: `async function getTitle(load) {
  const data = await load();
  return data.title;
}
`,
    solution: `async function getTitle(load: () => Promise<{ title: string }>): Promise<string> {
  const data = await load();
  return data.title;
}`,
    types: [
      { expr: "getTitle(() => Promise.resolve({ title: 'TS' }))", type: 'Promise<string>' },
      { err: "getTitle(() => ({ title: 'TS' }));" },
      { err: "getTitle(() => Promise.resolve({ name: 'TS' }));" },
    ],
    tests: [["@getTitle(() => Promise.resolve({ title: 'Хоббит' }))", "'Хоббит'", "await getTitle(() => Promise.resolve({ title: 'Хоббит' }))"]],
  },
  {
    id: 'r04', topic: 'real', level: 2, fn: 'mapUser',
    title: 'Данные с сервера',
    text: 'Сервер прислал пользователя в своём формате (RawUser). Преврати его в формат приложения (User): fullName — имя и фамилия через пробел, age — возраст или null, если его не прислали.',
    methods: ['raw: RawUser', '): User', '?? null'],
    example: `interface RawBook {
  book_title: string;
  page_count?: number;
}

interface Book {
  title: string;
  pages: number;
}

function mapBook(raw: RawBook): Book {
  return { title: raw.book_title, pages: raw.page_count ?? 0 };
}`,
    hint: 'Собери новый объект с полями fullName и age. Если указать тип результата User, TypeScript сам проверит, что ты ничего не забыл и не напутал.',
    starter: `interface RawUser {
  first_name: string;
  last_name: string;
  age?: number;
}

interface User {
  fullName: string;
  age: number | null;
}

function mapUser(raw) {

}
`,
    solution: `interface RawUser {
  first_name: string;
  last_name: string;
  age?: number;
}

interface User {
  fullName: string;
  age: number | null;
}

function mapUser(raw: RawUser): User {
  return {
    fullName: raw.first_name + ' ' + raw.last_name,
    age: raw.age ?? null,
  };
}`,
    types: [
      { expr: "mapUser({ first_name: 'Анна', last_name: 'Ли' })", type: 'User' },
      { err: "mapUser({ first_name: 'Анна' });" },
    ],
    tests: [
      ["{ first_name: 'Анна', last_name: 'Ли', age: 20 }", "{ fullName: 'Анна Ли', age: 20 }"],
      ["{ first_name: 'Олег', last_name: 'Ким' }", "{ fullName: 'Олег Ким', age: null }"],
    ],
  },
  {
    id: 'r05', topic: 'real', level: 2, fn: 'readValue',
    title: 'Поля может не быть',
    text: "Поле ввода ищут на странице, и его может не оказаться — тогда придёт null. Верни текст поля без пробелов по краям. Если поля нет — пустую строку.",
    methods: ['HTMLInputElement | null', '?.', '??'],
    example: `function getText(element: HTMLElement | null): string {
  if (element === null) {
    return '';
  }
  return element.textContent ?? '';
}`,
    hint: "HTMLInputElement — готовый тип поля ввода, у него есть value. Сначала разберись с null: if (input === null) return ''; или коротко: input?.value.trim() ?? ''.",
    starter: `function readValue(input: HTMLInputElement | null): string {
  return input.value.trim();
}
`,
    solution: `function readValue(input: HTMLInputElement | null): string {
  if (input === null) {
    return '';
  }
  return input.value.trim();
}`,
    tests: [["{ value: '  ru  ' }", "'ru'"], ['null', "''"]],
  },
  {
    id: 'r06', topic: 'real', level: 3, fn: 'ValidationError',
    title: 'Своя ошибка',
    text: "Сделай свою ошибку для формы. constructor принимает field (имя поля) и message. Сообщение передай родителю через super(message), имя поля сохрани в this.field, а this.name сделай 'ValidationError'.",
    methods: ['extends Error', 'super(message)', 'field: string'],
    example: `class NotFoundError extends Error {
  id: number;

  constructor(id: number) {
    super('Запись не найдена');
    this.name = 'NotFoundError';
    this.id = id;
  }
}

const error = new NotFoundError(7);
error.message;          // 'Запись не найдена'
error instanceof Error; // true`,
    hint: 'Объяви поле field: string. В constructor(field: string, message: string) первой строкой вызови super(message) — только после него можно писать this.',
    starter: `class ValidationError extends Error {

}
`,
    solution: `class ValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}`,
    types: [
      { ok: "const e = new ValidationError('email', 'Нет @');\nconst f: string = e.field;\nconst m: string = e.message;" },
      { ok: "const e: Error = new ValidationError('email', 'Нет @');" },
      { err: "new ValidationError('email');" },
    ],
    tests: [
      [
        "@const e = new ValidationError('email', 'Нет @'); [e instanceof Error, e.message, e.field, e.name]",
        "[true, 'Нет @', 'email', 'ValidationError']",
        '[e instanceof Error, e.message, e.field, e.name]',
      ],
    ],
  },
  {
    id: 'r07', topic: 'real', level: 3, fn: 'safeLoad',
    title: 'Ошибка при загрузке',
    text: "Загрузка может сорваться. В catch переменная error имеет тип unknown — сразу взять message нельзя. Если это Error — верни 'Ошибка: ' + message, иначе — 'Неизвестная ошибка'.",
    methods: ['try / catch', 'instanceof Error'],
    example: `function parseAge(text: string): number {
  try {
    return JSON.parse(text).age;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message); // здесь error — Error
    }
    return 0;
  }
}`,
    hint: 'Внутри catch: if (error instanceof Error) { return ... } — и отдельный return для всего остального.',
    starter: `async function safeLoad(load: () => Promise<string>): Promise<string> {
  try {
    return await load();
  } catch (error) {
    return 'Ошибка: ' + error.message;
  }
}
`,
    solution: `async function safeLoad(load: () => Promise<string>): Promise<string> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof Error) {
      return 'Ошибка: ' + error.message;
    }
    return 'Неизвестная ошибка';
  }
}`,
    tests: [
      ["@safeLoad(() => Promise.resolve('данные'))", "'данные'", "await safeLoad(() => Promise.resolve('данные'))"],
      ["@safeLoad(() => Promise.reject(new Error('нет сети')))", "'Ошибка: нет сети'", "await safeLoad(() => Promise.reject(new Error('нет сети')))"],
      ["@safeLoad(() => Promise.reject('просто строка'))", "'Неизвестная ошибка'", "await safeLoad(() => Promise.reject('просто строка'))"],
    ],
  },
  {
    id: 'r08', topic: 'real', level: 3, fn: 'statusText',
    title: 'Состояния экрана',
    text: 'Экран бывает в одном из четырёх состояний. Функция уже написана — опиши тип ViewState так, чтобы она скомпилировалась: у каждого состояния своя метка status и только свои поля.',
    methods: ['type ViewState = … | … | … | …'],
    example: `type Door =
  | { state: 'open' }
  | { state: 'closed' }
  | { state: 'locked'; code: string };

const door: Door = { state: 'locked', code: '1234' };`,
    hint: "Четыре варианта через черту. У 'idle' и 'loading' кроме status ничего нет. У 'success' есть items: string[], у 'error' — message: string.",
    starter: `// 1. Объяви тип ViewState — один из четырёх вариантов:
//    { status: 'idle' }
//    { status: 'loading' }
//    { status: 'success', items: массив строк }
//    { status: 'error', message: строка }

function statusText(state) {
  switch (state.status) {
    case 'idle':
      return 'Введите запрос';
    case 'loading':
      return 'Загрузка…';
    case 'success':
      return 'Найдено: ' + state.items.length;
    case 'error':
      return 'Ошибка: ' + state.message;
  }
}
`,
    solution: `type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; items: string[] }
  | { status: 'error'; message: string };

function statusText(state: ViewState): string {
  switch (state.status) {
    case 'idle':
      return 'Введите запрос';
    case 'loading':
      return 'Загрузка…';
    case 'success':
      return 'Найдено: ' + state.items.length;
    case 'error':
      return 'Ошибка: ' + state.message;
  }
}`,
    types: [
      { ok: "const s: ViewState = { status: 'idle' };" },
      { ok: "const s: ViewState = { status: 'success', items: ['a'] };" },
      { ok: "const s: ViewState = { status: 'error', message: 'нет сети' };" },
      { err: "const s: ViewState = { status: 'success' };" },
      { err: "const s: ViewState = { status: 'done' };" },
      { err: "const s: ViewState = { status: 'loading', message: 'нет сети' };" },
    ],
    tests: [
      ["{ status: 'idle' }", "'Введите запрос'"],
      ["{ status: 'loading' }", "'Загрузка…'"],
      ["{ status: 'success', items: ['a', 'b'] }", "'Найдено: 2'"],
      ["{ status: 'error', message: 'нет сети' }", "'Ошибка: нет сети'"],
    ],
  },
  {
    id: 'r09', topic: 'real', level: 3, fn: 'findValue',
    title: 'Что вернул querySelector',
    text: "querySelector возвращает Element | null: TypeScript не знает, что там именно поле ввода, и не уверен, что оно вообще найдётся. Подскажи тип в угловых скобках, а случай null обработай сам — верни ''.",
    methods: ['querySelector<HTMLInputElement>', '?.', '??'],
    example: `const button = document.querySelector<HTMLButtonElement>('.send');
// button: HTMLButtonElement | null

if (button !== null) {
  button.disabled = true;
}`,
    hint: "root.querySelector<HTMLInputElement>(selector) — теперь input: HTMLInputElement | null. Осталось разобраться с null: input?.value ?? ''.",
    starter: `function findValue(root: Document, selector: string): string {
  const input = root.querySelector(selector);
  return input.value;
}
`,
    solution: `function findValue(root: Document, selector: string): string {
  const input = root.querySelector<HTMLInputElement>(selector);
  return input?.value ?? '';
}`,
    uses: [['querySelector\\s*<\\s*HTMLInputElement\\s*>', 'Подскажи тип элемента в угловых скобках: querySelector<HTMLInputElement>(selector).']],
    types: [{ expr: "findValue(document, '#search')", type: 'string' }],
    tests: [
      ["@findValue({ querySelector: (s) => (s === '#search' ? { value: 'ru' } : null) }, '#search')", "'ru'", 'поле найдено'],
      ["@findValue({ querySelector: (s) => (s === '#search' ? { value: 'ru' } : null) }, '#other')", "''", 'поля нет на странице'],
    ],
  },
  {
    id: 'r10', topic: 'real', level: 3, fn: 'valueFromEvent',
    title: 'Откуда пришло событие',
    text: 'event.target — «какой-то объект страницы»: TypeScript не знает, что событие пришло от поля ввода. Мы знаем — и сообщаем об этом словом as: event.target as HTMLInputElement. Это одно из немногих мест, где as уместен.',
    methods: ['as HTMLInputElement'],
    example: `function onClick(event: Event): void {
  const button = event.target as HTMLButtonElement;
  button.disabled = true;
}`,
    hint: 'Заведи переменную: const input = event.target as HTMLInputElement; — и верни input.value.',
    starter: `function valueFromEvent(event: Event): string {
  return event.target.value;
}
`,
    solution: `function valueFromEvent(event: Event): string {
  const input = event.target as HTMLInputElement;
  return input.value;
}`,
    allowAs: true,
    tests: [["{ target: { value: 'ru' } }", "'ru'"], ["{ target: { value: '' } }", "''"]],
  },
  {
    id: 'r11', topic: 'real', level: 4, fn: 'cancel',
    title: 'Тип «как у функции»',
    text: 'Номер таймера возвращает setTimeout. Чтобы не гадать, какой у него тип, его берут у самой функции: ReturnType<typeof setTimeout>. Объяви так тип TimerId и допиши типы функции cancel: номера может ещё не быть (undefined).',
    methods: ['ReturnType<typeof setTimeout>', 'TimerId | undefined'],
    example: `function makeUser() {
  return { name: 'Аня', age: 20 };
}

type User = ReturnType<typeof makeUser>;
// { name: string; age: number }`,
    hint: 'type TimerId = ReturnType<typeof setTimeout>; — «то, что возвращает setTimeout». Параметр: id: TimerId | undefined, результат — boolean.',
    starter: `// 1. Объяви тип TimerId: то, что возвращает setTimeout

function cancel(id) {
  if (id === undefined) {
    return false;
  }
  clearTimeout(id);
  return true;
}
`,
    solution: `type TimerId = ReturnType<typeof setTimeout>;

function cancel(id: TimerId | undefined): boolean {
  if (id === undefined) {
    return false;
  }
  clearTimeout(id);
  return true;
}`,
    uses: [['ReturnType\\s*<\\s*typeof\\s+setTimeout\\s*>', 'Объяви TimerId через ReturnType<typeof setTimeout>.']],
    types: [
      { alias: 'TimerId', type: 'ReturnType<typeof setTimeout>' },
      { ok: 'cancel(setTimeout(() => {}, 10));' },
      { ok: 'cancel(undefined);' },
      { err: "cancel('таймер');" },
    ],
    tests: [['undefined', 'false'], ['@cancel(setTimeout(() => {}, 1000))', 'true', 'cancel(setTimeout(() => {}, 1000))']],
  },
  {
    id: 'r12', topic: 'real', level: 5, fn: 'createEl',
    title: 'Помощник для элементов',
    text: "Хочется, чтобы createEl(document, 'input', …) возвращал именно HTMLInputElement, а для 'button' — HTMLButtonElement. В TypeScript есть готовая таблица «тег → тип элемента»: HTMLElementTagNameMap. Сделай tag дженериком K, ограниченным ключами этой таблицы.",
    methods: ['K extends keyof HTMLElementTagNameMap', 'HTMLElementTagNameMap[K]'],
    example: `type InputType = HTMLElementTagNameMap['input'];   // HTMLInputElement
type ButtonType = HTMLElementTagNameMap['button']; // HTMLButtonElement

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}`,
    hint: 'createEl<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className: string): HTMLElementTagNameMap[K]. Тело менять не нужно.',
    starter: `function createEl(doc, tag, className) {
  const el = doc.createElement(tag);
  el.className = className;
  return el;
}
`,
    solution: `function createEl<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className: string): HTMLElementTagNameMap[K] {
  const el = doc.createElement(tag);
  el.className = className;
  return el;
}`,
    types: [
      { expr: "createEl(document, 'input', 'field')", type: 'HTMLInputElement' },
      { expr: "createEl(document, 'button', 'send')", type: 'HTMLButtonElement' },
      { err: "createEl(document, 'кнопка', 'send');" },
    ],
    tests: [
      [
        "@createEl({ createElement: (tag) => ({ tagName: tag }) }, 'input', 'field')",
        "{ tagName: 'input', className: 'field' }",
        "createEl(doc, 'input', 'field')",
      ],
    ],
  },
];

if (typeof module !== 'undefined') module.exports = { TASKS };
