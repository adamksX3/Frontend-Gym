// Собирает все тренажёры и общий файл frontend-gym.html. Запуск: node build.js (нужен только Node.js, пакеты ставить не надо).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = __dirname;

// name — имя файла тренажёра внутри оболочки; dir — папка с исходниками; prebuilt — готовый файл, если исходников нет
const GYMS = [
  { name: 'js-methods-gym.html', prebuilt: 'prebuilt/js-methods-gym.html' },
  { name: 'ts-types-gym.html', dir: 'src/ts-types-gym' },
  { name: 'html-markup-gym.html', dir: 'src/html-markup-gym' },
  { name: 'css-layout-gym.html', dir: 'src/css-layout-gym' },
  { name: 'react-gym.html', dir: 'src/react-gym' },
  { name: 'tools-gym.html', dir: 'src/tools-gym' },
];

const run = (dir) => execFileSync(process.execPath, ['build.js'], { cwd: path.join(root, dir), stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
const gymsDir = path.join(root, 'src/hub/gyms');
fs.mkdirSync(gymsDir, { recursive: true });

for (const g of GYMS) {
  let from;
  if (g.dir) {
    console.log(g.dir + ': ' + run(g.dir).split('\n').pop());
    from = path.join(root, g.dir, 'dist/index.html');
  } else {
    console.log(g.prebuilt + ': готовый файл, берётся как есть');
    from = path.join(root, g.prebuilt);
  }
  fs.copyFileSync(from, path.join(gymsDir, g.name));
}

console.log('src/hub: ' + run('src/hub').split('\n').pop());
fs.copyFileSync(path.join(root, 'src/hub/dist/index.html'), path.join(root, 'frontend-gym.html'));
console.log('Готово: frontend-gym.html, ' + (fs.statSync(path.join(root, 'frontend-gym.html')).size / 1024 / 1024).toFixed(2) + ' МБ');
