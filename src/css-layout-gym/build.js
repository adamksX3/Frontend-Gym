const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const parts = { __ENGINE__: read('src/engine.js'), __TASKS__: read('src/tasks.js'), __APP__: read('src/app.js') };
for (const [k, v] of Object.entries(parts)) {
  if (/<\/script/i.test(v) || v.includes('<!--')) throw new Error(k + ' contains a script terminator');
}
let html = read('src/page.html');
for (const [k, v] of Object.entries(parts)) html = html.split(k).join(v); // split/join: "$" в исходниках не трактуется как шаблон
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
console.log('dist/index.html', (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
