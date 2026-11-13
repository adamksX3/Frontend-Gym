// TS Types Gym engine. Runs inside a Web Worker, on the main thread as a fallback, and in Node for self-tests.
// Needs a global-free `ts` (TypeScript compiler API) and LIBS: { 'lib.es5.d.ts': text, ... }.

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

function show(v, depth = 0) {
  if (depth > 4) return '…';
  if (typeof v === 'string') return "'" + v + "'";
  if (typeof v === 'function') return 'function';
  if (typeof v === 'undefined') return 'undefined';
  if (typeof v === 'number' && Object.is(v, -0)) return '-0';
  if (v === null || typeof v !== 'object') return String(v);
  if (v instanceof Error) return v.name + '(' + show(v.message) + ')';
  if (v instanceof Map) return 'Map(' + [...v].map(([k, x]) => show(k, depth + 1) + ' => ' + show(x, depth + 1)).join(', ') + ')';
  if (v instanceof Set) return 'Set(' + [...v].map((x) => show(x, depth + 1)).join(', ') + ')';
  if (Array.isArray(v)) return '[' + v.map((x) => show(x, depth + 1)).join(', ') + ']';
  const entries = Object.entries(v);
  if (entries.length === 0) return '{}';
  return '{ ' + entries.map(([k, x]) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'") + ': ' + show(x, depth + 1)).join(', ') + ' }';
}

// tests: [argsSource, expectedSource] or ['@code ending with an expression', expectedSource, label]
async function runTask(js, fnName, tests) {
  let fn;
  try {
    fn = new Function('exports', js + '\n;return typeof ' + fnName + " !== 'undefined' ? " + fnName + ' : undefined;')({});
  } catch (e) {
    return { fatal: e.name + ': ' + e.message };
  }
  if (typeof fn !== 'function') return { fatal: 'Не найдено: ' + fnName + '. Не переименовывай функцию или класс из задания.' };
  const results = [];
  for (const [src, expSrc, label] of tests) {
    const isCode = src[0] === '@';
    const call = isCode ? label || src.slice(1) : fnName + '(' + src + ')';
    let expected;
    try {
      expected = new Function('return (' + expSrc + ');')();
    } catch (e) {
      results.push({ call, ok: false, error: 'bad test: ' + e.message });
      continue;
    }
    try {
      let actual = isCode
        ? new Function(fnName, 'return eval(' + JSON.stringify(src.slice(1)) + ');')(fn)
        : new Function(fnName, 'return ' + fnName + '(' + src + ');')(fn);
      if (actual && typeof actual.then === 'function') actual = await actual;
      results.push({ call, ok: deepEqual(actual, expected), actual: show(actual), expected: show(expected) });
    } catch (e) {
      const text = e instanceof Error ? e.name + ': ' + e.message : 'брошено: ' + show(e);
      results.push({ call, ok: false, error: text, expected: show(expected) });
    }
  }
  return { results };
}

// Plain-words explanations for the compiler errors a learner meets most often.
const HINTS = {
  1005: 'Синтаксис: пропущен символ — скобка, запятая, двоеточие или точка с запятой.',
  1109: 'Синтаксис: здесь должно быть выражение (значение, вызов, переменная).',
  1128: 'Синтаксис: лишняя или незакрытая скобка где-то выше.',
  1308: 'await можно писать только внутри функции с пометкой async.',
  2300: 'Это имя объявлено дважды.',
  2304: 'Такого имени нет: опечатка, или тип/переменная ещё не объявлены.',
  2314: 'Это дженерик: ему нужно указать тип в угловых скобках, например Box<number>.',
  2322: 'Значение одного типа кладут туда, где ждут другой. Сравни: что кладём (справа) и куда кладём (слева или тип результата функции).',
  2339: 'У этого типа нет такого свойства. Проверь написание. Если тип — «или-или», сначала сузь его (if, typeof, in).',
  2341: 'Свойство private: к нему можно обращаться только внутри класса.',
  2344: 'Тип не подходит под ограничение дженерика (extends).',
  2345: 'В функцию передали аргумент не того типа, который записан у параметра.',
  2349: 'Это значение вызывают как функцию, а оно не функция.',
  2353: 'В объекте есть свойство, которого нет в типе.',
  2355: 'У функции указан тип результата, но она ничего не возвращает. Нужен return.',
  2362: 'В арифметике слева стоит не число.',
  2363: 'В арифметике справа стоит не число.',
  2365: 'Этот оператор нельзя применить к значениям таких типов.',
  2366: 'Не каждая ветка функции возвращает значение: где-то не хватает return.',
  2367: 'Сравниваются значения, которые никогда не будут равны: их типы не пересекаются.',
  2377: 'В constructor класса-наследника нужно вызвать super(...).',
  2451: 'Это имя уже объявлено в той же области.',
  2454: 'Переменную используют раньше, чем в неё что-то положили.',
  2488: 'Это значение нельзя перебрать или раскрыть через ... — оно не массив.',
  2531: 'Значение может быть null. Сначала проверь его (if или ?.), потом обращайся к свойству.',
  2532: 'Значение может быть undefined. Сначала проверь его (if, ?. или ??).',
  2533: 'Значение может быть null или undefined. Сначала проверь его.',
  2540: 'Свойство только для чтения (readonly): менять его нельзя, создай новый объект.',
  2551: 'Такого свойства нет, но есть похожее — скорее всего, опечатка.',
  2552: 'Такого имени нет, но есть похожее — скорее всего, опечатка.',
  2554: 'Функцию вызвали не с тем количеством аргументов.',
  2555: 'Функции передали слишком мало аргументов.',
  2559: 'У переданного объекта нет ни одного общего свойства с нужным типом.',
  2564: 'Поле класса объявлено, но не получает значение ни сразу, ни в constructor.',
  2588: 'Это const: новое значение присвоить нельзя.',
  2693: 'Это тип, а не значение: в выражении его использовать нельзя.',
  2722: 'Функции может не быть (undefined). Сначала проверь, потом вызывай.',
  2739: 'В объекте не хватает обязательных свойств.',
  2740: 'В объекте не хватает обязательных свойств.',
  2741: 'В объекте не хватает обязательного свойства.',
  2749: 'Это значение, а не тип. Тип значения получают через typeof.',
  2769: 'Ни один вариант вызова не подходит под переданные аргументы: проверь их типы.',
  7005: 'TypeScript не смог вывести тип переменной — укажи его сам.',
  7006: 'У параметра не указан тип. Допиши после имени двоеточие и тип, например n: number.',
  7031: 'У поля при деструктуризации не указан тип.',
  7034: 'TypeScript не смог вывести тип переменной — укажи его сам, например const list: string[] = [].',
  7053: 'Обращение obj[key] с произвольной строкой. Нужен точный тип ключа (keyof) или объект-словарь (Record).',
  17009: 'В constructor сначала вызывают super(...), и только потом пишут this.',
  18046: 'Тип unknown: TypeScript не знает, что внутри. Сначала проверь тип (typeof, Array.isArray, instanceof).',
  18047: 'Значение может быть null. Сначала проверь его (if или ?.), потом обращайся к свойству.',
  18048: 'Значение может быть undefined. Сначала проверь его (if, ?. или ??).',
  18049: 'Значение может быть null или undefined. Сначала проверь его.',
};

function createEngine(ts, LIBS) {
  const LIB_DIR = '/lib/';
  const USER = '/task.ts';
  const options = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    types: [],
    noEmit: true,
    skipLibCheck: true,
  };
  const libCache = new Map();
  let text = '';
  let oldProgram;

  const base = (name) => name.slice(name.lastIndexOf('/') + 1);
  const host = {
    getSourceFile(fileName, langOpts) {
      if (fileName === USER) return ts.createSourceFile(USER, text, langOpts, true);
      let sf = libCache.get(fileName);
      if (!sf) {
        const src = LIBS[base(fileName)];
        if (src === undefined) return undefined;
        sf = ts.createSourceFile(fileName, src, langOpts, false);
        libCache.set(fileName, sf);
      }
      return sf;
    },
    getDefaultLibFileName: () => LIB_DIR + 'lib.es2022.d.ts',
    getDefaultLibLocation: () => LIB_DIR,
    writeFile() {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (f) => f === USER || LIBS[base(f)] !== undefined,
    readFile: (f) => (f === USER ? text : LIBS[base(f)]),
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const PRELUDE =
    'type __Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;\n' +
    'type __Expect<T extends true> = T;\n';

  function diagInfo(d, sf) {
    const lc = sf.getLineAndCharacterOfPosition(d.start || 0);
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n').split('\n').slice(0, 3).join('\n');
    return { line: lc.line + 1, col: lc.character + 1, code: d.code, msg, hint: HINTS[d.code] || '' };
  }

  function analyze(task, code) {
    const types = task.types || [];
    const setup = task.typeSetup ? task.typeSetup + '\n' : '';
    let full = code + '\n;\n' + PRELUDE;
    const userEnd = code.length;
    const ranges = [];
    for (const t of types) {
      const start = full.length;
      let body;
      if (t.expr !== undefined) body = 'const __v = (' + t.expr + ');\ntype __T = __Expect<__Equal<typeof __v, ' + t.type + '>>;';
      else if (t.alias !== undefined) body = 'type __T = __Expect<__Equal<' + t.alias + ', ' + t.type + '>>;';
      else body = t.ok !== undefined ? t.ok : t.err;
      const head = '{\n' + setup;
      full += head + body + '\n}\n';
      ranges.push({ start, end: full.length, bodyStart: start + head.length });
    }
    text = full;
    const program = ts.createProgram({ rootNames: [USER], options, host, oldProgram });
    oldProgram = program;
    const sf = program.getSourceFile(USER);
    const rep = { syntax: [], errors: [], rules: [], types: [], js: '' };

    const syn = program.getSyntacticDiagnostics(sf);
    if (syn.length) {
      const mine = syn.filter((d) => (d.start || 0) <= userEnd + 2);
      rep.syntax = (mine.length ? mine : syn.slice(0, 1)).slice(0, 5).map((d) => diagInfo(d, sf));
      for (const s of rep.syntax) s.line = Math.min(s.line, code.split('\n').length);
      return rep;
    }

    const sem = program.getSemanticDiagnostics(sf);
    rep.errors = sem.filter((d) => (d.start || 0) < userEnd).slice(0, 8).map((d) => diagInfo(d, sf));

    // ---- rules on the learner's own code ----
    const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
    let anyLine = 0;
    let asLine = 0;
    const untypedMethods = [];
    const visit = (node) => {
      if (node.getStart(sf) >= userEnd) return;
      if (node.kind === ts.SyntaxKind.AnyKeyword && !anyLine) anyLine = lineOf(node.getStart(sf));
      if (ts.isAsExpression(node) && !(ts.isTypeReferenceNode(node.type) && node.type.getText(sf) === 'const') && !asLine) asLine = lineOf(node.type.getStart(sf));
      if (ts.isMethodDeclaration(node) && !node.type && node.name) untypedMethods.push(node.name.getText(sf));
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(sf, visit);
    if (anyLine) rep.rules.push('Строка ' + anyLine + ': в коде есть any. Он выключает проверку типов. Напиши точный тип, а если тип правда неизвестен — unknown.');
    if (asLine && !task.allowAs) rep.rules.push('Строка ' + asLine + ': в коде есть as. Так ты говоришь TypeScript «поверь мне» и отключаешь проверку. В этой задаче обойдись без него: проверь тип через if.');
    if (/@ts-(ignore|expect-error|nocheck)/.test(code)) rep.rules.push('Убери комментарий @ts-ignore / @ts-expect-error: он прячет ошибку, а не исправляет её.');
    if (task.methodsTyped && untypedMethods.length) rep.rules.push('Укажи тип результата у методов: ' + untypedMethods.join(', ') + '. Он пишется после скобок с параметрами: add(step: number): void { … }');
    if (task.fn && !task.noReturnRule) {
      let fnNode;
      for (const st of sf.statements) {
        if (st.getStart(sf) >= userEnd) break;
        if (ts.isFunctionDeclaration(st) && st.name && st.name.text === task.fn) fnNode = st;
        if (ts.isVariableStatement(st)) {
          for (const d of st.declarationList.declarations) {
            if (ts.isIdentifier(d.name) && d.name.text === task.fn && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) fnNode = d.initializer;
          }
        }
      }
      if (fnNode && !fnNode.type) rep.rules.push('У функции ' + task.fn + ' не указан тип результата. Он пишется после скобок с параметрами: function ' + task.fn + '(…): тип { … }');
    }
    for (const [re, msg] of task.uses || []) {
      if (!new RegExp(re).test(code)) rep.rules.push(msg);
    }

    // ---- type tests ----
    const checker = program.getTypeChecker();
    types.forEach((t, i) => {
      const r = ranges[i];
      const ds = sem.filter((d) => (d.start || 0) >= r.start && (d.start || 0) < r.end);
      const first = ds[0] ? diagInfo(ds[0], sf) : null;
      const firstText = first ? first.msg + ' (TS' + first.code + ')' : '';
      if (t.err !== undefined) {
        rep.types.push({ kind: 'err', code: t.err, ok: ds.length > 0, detail: ds.length ? firstText : 'TypeScript пропустил этот код без ошибки. Значит, тип слишком широкий: он разрешает лишнее.' });
      } else if (t.ok !== undefined) {
        rep.types.push({ kind: 'ok', code: t.ok, ok: ds.length === 0, detail: firstText, hint: first ? first.hint : '' });
      } else if (t.alias !== undefined) {
        rep.types.push({ kind: 'alias', code: t.alias, type: t.type, ok: ds.length === 0, detail: ds.length ? (ds.some((d) => d.code === 2304) ? 'Тип ' + t.alias + ' ещё не объявлен.' : first.code === 2344 ? 'Тип ' + t.alias + ' описан не так, как нужно.' : firstText) : '' });
      } else {
        let detail = '';
        let hint = '';
        if (ds.length) {
          const exprEnd = r.bodyStart + ('const __v = (' + t.expr + ');').length;
          const inExpr = ds.find((d) => (d.start || 0) < exprEnd);
          if (inExpr) {
            const info = diagInfo(inExpr, sf);
            detail = info.msg + ' (TS' + info.code + ')';
            hint = info.hint;
          } else {
            let actual = '';
            const find = (node) => {
              if (actual || node.end <= r.start || node.pos >= r.end) return;
              if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === '__v') {
                actual = checker.typeToString(checker.getTypeAtLocation(node.name), undefined, ts.TypeFormatFlags.NoTruncation);
                return;
              }
              ts.forEachChild(node, find);
            };
            ts.forEachChild(sf, find);
            detail = 'получился тип: ' + (actual || '?');
          }
        }
        rep.types.push({ kind: 'expr', code: t.expr, type: t.type, ok: ds.length === 0, detail, hint });
      }
    });

    rep.js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    return rep;
  }

  return { analyze };
}

if (typeof module !== 'undefined') module.exports = { createEngine, runTask, deepEqual, show, HINTS };
