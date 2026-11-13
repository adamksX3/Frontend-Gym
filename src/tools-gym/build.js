const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
// Prettier 3 (standalone и три плагина) лежит в vendor/ и встраивается в файл
const parts = {
  __PRETTIER__: read('vendor/prettier.js'), __P_BABEL__: read('vendor/prettier-babel.js'), __P_ESTREE__: read('vendor/prettier-estree.js'), __P_POSTCSS__: read('vendor/prettier-postcss.js'),
  __ENGINE__: read('src/engine.js'), __TASKS__: read('src/tasks.js'), __APP__: read('src/app.js'),
};
for (const [k, v] of Object.entries(parts)) {
  if (/<\/script/i.test(v) || /<!--[\s\S]*<script/i.test(v)) throw new Error(k + ' contains a script terminator');
}
let html = read('src/page.html');
for (const [k, v] of Object.entries(parts)) html = html.split(k).join(v); // split/join: "$" в исходниках не трактуется как шаблон
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
console.log('dist/index.html', (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
