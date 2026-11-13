// Step 1 of the build: minify the compiler and collect the lib declarations it needs.
// Run once after `npm install typescript@~6.0.0 esbuild`.
const fs = require('fs');
const { execSync } = require('child_process');
fs.mkdirSync('vendor', { recursive: true });
execSync('npx esbuild node_modules/typescript/lib/typescript.js --minify --legal-comments=none --outfile=vendor/ts.min.js', { stdio: 'inherit' });

const dir = 'node_modules/typescript/lib/';
const seen = new Map();
function add(name) {
  if (seen.has(name)) return;
  const text = fs.readFileSync(dir + name, 'utf8');
  seen.set(name, text);
  for (const m of text.matchAll(/\/\/\/\s*<reference\s+lib="([^"]+)"/g)) add('lib.' + m[1] + '.d.ts');
}
add('lib.es2022.d.ts');
add('lib.dom.d.ts');
const out = {};
for (const [name, text] of seen) out[name] = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n');
fs.writeFileSync('vendor/libs.json', JSON.stringify(out));
console.log('libs:', seen.size);
