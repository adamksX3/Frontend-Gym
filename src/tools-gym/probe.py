# Типичные ошибки и другие верные решения: что отвечает тренажёр
import os
from playwright.sync_api import sync_playwright
CASES = [
 ('g05', 'git commit -m "feat: add header"', False),
 ('g05', 'git commit -am "feat: add header"', True),
 ('g05', 'git add .\ngit commit -m feat: add header', False),
 ('g08', 'git checkout -b feature/search', True),
 ('g08', 'git branch feature/search', False),
 ('g06', 'git reset secret.txt', True),
 ('g06', 'git rm --cached secret.txt', True),
 ('g07', 'git checkout -- index.html', True),
 ('g17', 'git reset HEAD~1', False),
 ('g17', 'git reset --hard HEAD~1', False),
 ('g10', 'git merge feature/serch', False),
 ('g22', 'git merge feature/title\ngit add title.txt\ngit commit -m "merge: resolve title conflict"', False),
 ('g22', 'git merge feature/title\ngit commit -m "merge: resolve title conflict"', False),
 ('g12', 'node_modules\ndist\n.env', True),
 ('g12', 'node_modules/\ndist/\n.env*', False),
 ('h02', 'git push', False),
 ('h02', 'git push --set-upstream origin main', True),
 ('h08', 'git push', False),
 ('h08', 'git pull origin main && git push', True),
 ('h06', 'Feat: Added search.', False),
 ('h06', 'feat(search): add input field', True),
 ('h09', 'git commit -m "исправил опечатку"', False),
 ('h10', 'git checkout -b country-search\ngit add .\ngit commit -m "feat: add search"\ngit push --set-upstream origin country-search', True),
 ('n06', "{\n  name: 'Country Search',\n  'version': '1.0.0'\n}", False),
 ('n07', '{\n  "countries": ["Германия", "Испания"]\n  "total": 2\n}', False),
 ('n08', '{\n  "title": "Чай",\n  "price": 120,\n  "inStock": "true",\n  "discount": null\n}', False),
 ('r03', '{\n  "singlequote": true\n}', False),
 ('r03', '{\n  "singleQuote": "да"\n}', False),
 ('r08', '{\n  "singleQuote": true,\n  "tabWidth": 4\n}', False),
 ('r10', 'const user = { name: "Аня", age: 20 };\nfunction hi(name) {\n return "Привет, " + name;\n}\n', False),
 ('r10', 'const user = { name: "Оля", age: 20 };\nfunction hi(name) {\n  return "Привет, " + name;\n}\n', False),
 ('k02', 'npx husky install', False),
 ('k08', 'npx commitlint --edit "$1"', True),
 ('k08', 'npx commitlint', False),
 ('k07', '{\n  "lint-staged": {\n    "*.ts": ["eslint --fix", "prettier --write"],\n    "*.js": ["eslint --fix", "prettier --write"],\n    "*.css": "prettier --write",\n    "*.json": "prettier --write",\n    "*.md": "prettier --write"\n  }\n}', True),
 ('n14', 'function parseSafe(text) {\n  try { return JSON.parse(text) } catch { return null }\n}', True),
]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file://' + os.path.abspath('dist/index.html'))
    topics = pg.evaluate("Object.fromEntries(TASKS.map(t => [t.id, t.topic]))")
    wrong = 0
    for tid, code, expect in CASES:
        pg.click('#tabs [data-topic="%s"]' % topics[tid]); pg.click('#tasklist [data-id="%s"]' % tid)
        pg.fill('#code', code); pg.click('#run')
        pg.wait_for_selector('#results .summary.ok, #results .summary.bad')
        ok = 'ok' in pg.get_attribute('#results .summary', 'class')
        if ok != expect: wrong += 1
        bad = [x.inner_text().replace('\n', ' ') for x in pg.query_selector_all('#results .test.bad')]
        print(('OK  ' if ok == expect else 'WRONG ') + tid, '|', 'прошло' if ok else ' || '.join(bad)[:330])
    print('unexpected:', wrong)
    for tid, name in [('g22', 'shot-git.png'), ('r08', 'shot-prettier.png')]:
        pg.click('#tabs [data-topic="%s"]' % topics[tid]); pg.click('#tasklist [data-id="%s"]' % tid)
        pg.fill('#code', pg.evaluate("id => TASKS.find(t => t.id === id).solution.split('\\n').slice(0, 2).join('\\n')", tid)); pg.wait_for_timeout(700)
        pg.screenshot(path=name, full_page=True)
    b.close()
