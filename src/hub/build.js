// Собирает единый файл: пять готовых тренажёров вкладываются внутрь оболочки как есть.
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const GYMS = [
  { id: 'js', name: 'JavaScript', key: 'jsgym-v1', file: 'gyms/js-methods-gym.html' },
  { id: 'ts', name: 'TypeScript', key: 'tsgym-v1', file: 'gyms/ts-types-gym.html' },
  { id: 'html', name: 'HTML', key: 'htmlgym-v1', file: 'gyms/html-markup-gym.html' },
  { id: 'css', name: 'CSS', key: 'cssgym-v1', file: 'gyms/css-layout-gym.html' },
  { id: 'react', name: 'React', key: 'reactgym-v1', file: 'gyms/react-gym.html' },
  { id: 'tools', name: 'Git и инструменты', key: 'toolsgym-v1', file: 'gyms/tools-gym.html' },
];
const totals = JSON.parse(read('totals.json'));
let data = '';
for (const g of GYMS) {
  let html = read(g.file);
  // внутри оболочки тренажёр живёт в iframe без своего адреса: смена #адреса там может бросить ошибку, гасим её
  const shim = '<script>(function(){var r=history.replaceState;history.replaceState=function(){try{return r.apply(history,arguments)}catch(e){}}})()</' + 'script>';
  if (/<head(\s[^>]*)?>/i.test(html)) html = html.replace(/<head(\s[^>]*)?>/i, (m) => m + shim);
  else if (/^\s*<!doctype[^>]*>/i.test(html)) html = html.replace(/^\s*<!doctype[^>]*>/i, (m) => m + shim);
  else html = shim + html; // файл без <head> (как JS Methods Gym): скрипт в самом начале
  if (!html.includes("'" + g.key + "'")) throw new Error(g.file + ': не нашёл ключ ' + g.key);
  g.total = totals[g.id];
  if (!g.total) throw new Error('нет числа задач для ' + g.id);
  // JSON-строка с экранированным "<": внутри неё не может встретиться закрывающий тег script
  const json = JSON.stringify(html).replace(/</g, '\\u003c');
  data += '<script type="application/json" id="gym-' + g.id + '">' + json + '</script>\n';
}
const hubJs = read('src/hub.js').split('__GYMS__').join(JSON.stringify(GYMS.map(({ id, name, key, total }) => ({ id, name, key, total }))));
const out = read('src/hub.html').split('__GYM_DATA__').join(data).split('__HUB_JS__').join(hubJs);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), out);
console.log('dist/index.html', (Buffer.byteLength(out) / 1024 / 1024).toFixed(2) + ' MB', JSON.stringify(totals));
