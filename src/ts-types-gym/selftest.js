// Every reference solution must pass every check; every starter must fail at least one.
const ts = require('./vendor/ts.min.js');
const LIBS = require('./vendor/libs.json');
const { createEngine, runTask } = require('./src/engine.js');
const { TASKS } = require('./src/tasks.js');

const eng = createEngine(ts, LIBS);

async function verdict(task, code) {
  const rep = eng.analyze(task, code);
  const problems = [];
  for (const s of rep.syntax) problems.push('syntax L' + s.line + ': ' + s.msg);
  for (const e of rep.errors) problems.push('error L' + e.line + ': ' + e.msg + ' (TS' + e.code + ')');
  for (const r of rep.rules) problems.push('rule: ' + r);
  for (const t of rep.types) if (!t.ok) problems.push('type[' + t.kind + '] ' + t.code + ' → ' + t.detail);
  if (!rep.syntax.length && task.tests && task.tests.length) {
    const run = await runTask(rep.js, task.fn, task.tests);
    if (run.fatal) problems.push('run fatal: ' + run.fatal);
    else for (const r of run.results) if (!r.ok) problems.push('run ' + r.call + ' → ' + (r.error || r.actual) + ' (ждали ' + r.expected + ')');
  }
  return problems;
}

(async () => {
  let bad = 0;
  const ids = new Set();
  const required = ['id', 'topic', 'level', 'title', 'text', 'methods', 'example', 'hint', 'starter', 'solution'];
  for (const task of TASKS) {
    if (ids.has(task.id)) { console.log('DUPLICATE ID', task.id); bad++; }
    ids.add(task.id);
    for (const k of required) if (task[k] === undefined) { console.log(task.id, 'MISSING', k); bad++; }
    if (!task.fn && !task.file) { console.log(task.id, 'needs fn or file'); bad++; }
    if (!(task.types && task.types.length) && !(task.tests && task.tests.length)) { console.log(task.id, 'has no checks'); bad++; }
    const sol = await verdict(task, task.solution);
    if (sol.length) { bad++; console.log('✗ SOLUTION FAILS', task.id, task.title); sol.forEach((p) => console.log('    ' + p)); }
    const st = await verdict(task, task.starter);
    if (!st.length) { bad++; console.log('✗ STARTER PASSES', task.id, task.title); }
    // the example must compile on its own
    const ex = eng.analyze({}, task.example);
    const exProblems = [...ex.syntax, ...ex.errors];
    if (exProblems.length) { bad++; console.log('✗ EXAMPLE DOES NOT COMPILE', task.id); exProblems.forEach((p) => console.log('    L' + p.line + ': ' + p.msg)); }
  }
  const byTopic = {};
  for (const t of TASKS) byTopic[t.topic] = (byTopic[t.topic] || 0) + 1;
  console.log('tasks:', TASKS.length, JSON.stringify(byTopic), 'problems:', bad);
  process.exit(bad ? 1 : 0);
})();
