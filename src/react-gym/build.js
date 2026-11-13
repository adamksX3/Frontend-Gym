const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
// React 18 (сборка для разработки: она даёт понятные предупреждения) и Sucrase лежат в vendor/ и встраиваются в файл
const parts = {
  __LIB_REACT__: read('vendor/react.development.js'),
  __LIB_REACT_DOM__: read('vendor/react-dom.development.js'),
  __SUCRASE__: read('vendor/sucrase.js'),
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
