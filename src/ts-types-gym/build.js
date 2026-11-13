const fs = require('fs');
const path = require('path');
const ts = require('./vendor/ts.min.js');

const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const tsSrc = read('vendor/ts.min.js');
if (/<\/script/i.test(tsSrc) || tsSrc.includes('<!--')) throw new Error('compiler source needs escaping');
const libs = JSON.stringify(JSON.parse(read('vendor/libs.json'))).replace(/</g, '\\u003c');
const engine = read('src/engine.js');
const tasks = read('src/tasks.js');
const app = read('src/app.js');
for (const [name, text] of [['engine', engine], ['tasks', tasks], ['app', app]]) {
  if (/<\/script/i.test(text) || text.includes('<!--')) throw new Error(name + ' contains a script terminator');
}

// split/join so that "$" sequences in the sources are never treated as replacement patterns
const fill = (html, key, value) => html.split(key).join(value);
let html = read('src/page.html');
html = fill(html, '__TS_VERSION__', ts.version.split('.').slice(0, 2).join('.'));
html = fill(html, '__ENGINE__', engine);
html = fill(html, '__TASKS__', tasks);
html = fill(html, '__APP__', app);
html = fill(html, '__LIBS_JSON__', libs);
html = fill(html, '__TS_SRC__', tsSrc);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
console.log('dist/index.html', (html.length / 1024 / 1024).toFixed(2) + ' MB (chars)', (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + ' MB (bytes)');
