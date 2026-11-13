# Проверка в настоящем Chrome: решения проходят, заготовки нет; плюс запуск внутри «песочницы» как в артефакте.
import json, sys, time
from playwright.sync_api import sync_playwright

URL = 'file:///home/claude/cssgym/dist/index.html'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    logs = []
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text))
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: ' + str(e)))
    pg.goto(URL)
    pg.wait_for_selector('#tasklist button')
    tasks = pg.evaluate("TASKS.map(t => ({id: t.id, starter: t.starter, solution: t.solution, n: t.checks.length}))")
    print('tasks:', len(tasks), '| overall:', pg.inner_text('#overall-text'))
    bad_sol, bad_start = [], []
    t0 = time.time()
    for t in tasks:
        pg.evaluate("id => { location.hash = id; }", t['id'])
        pg.wait_for_function("id => document.querySelector('#tasklist button[aria-current=\"true\"]')?.dataset.id === id", arg=t['id'])
        pg.evaluate("() => { document.querySelector('#reset-btn').click(); document.querySelector('#do-reset').click(); }")
        pg.click('#run')
        pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=15000)
        cls = pg.get_attribute('#results .summary', 'class')
        if 'bad' not in cls:
            bad_start.append(t['id'])
        pg.fill('#code', t['solution'])
        pg.click('#run')
        pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=15000)
        cls = pg.get_attribute('#results .summary', 'class')
        if 'ok' not in cls:
            bad_sol.append(t['id'])
            print('FAIL solution', t['id'], pg.inner_text('#results')[:700].replace('\n', ' | '))
    print('solutions failing:', bad_sol, '| starters passing:', bad_start, '| %.1fs' % (time.time() - t0), '| overall:', pg.inner_text('#overall-text'))
    print('LOGS:', [l for l in logs if 'fonts' not in l][:10])
    b.close()
