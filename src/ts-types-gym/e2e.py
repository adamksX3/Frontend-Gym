import json, sys, time
from playwright.sync_api import sync_playwright
sols = json.load(open('build/solutions.json', encoding='utf-8'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1320, 'height': 1000})
    logs = []
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text))
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: ' + str(e)))
    t0 = time.time()
    pg.goto('file:///home/claude/tsgym/dist/index.html')
    pg.wait_for_selector('#tasklist button')
    print('loaded in %.1fs' % (time.time() - t0), '| overall:', pg.inner_text('#overall-text'), '| tabs:', pg.inner_text('#tabs').replace('\n', ' '))
    bad = 0
    first = True
    for s in sols:
        pg.evaluate("id => { location.hash = id; }", s['id'])
        pg.wait_for_function("id => document.querySelector('#tasklist button[aria-current=\"true\"]')?.dataset.id === id", arg=s['id'])
        # starter must not pass
        if first or s['id'] in ('n01', 'g13', 'r07'):
            t1 = time.time()
            pg.click('#run')
            pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=60000)
            cls = pg.get_attribute('#results .summary', 'class')
            print(s['id'], 'starter →', cls, '| %.2fs |' % (time.time() - t1), pg.inner_text('#results .summary'))
            if 'bad' not in cls: bad += 1
            first = False
        pg.fill('#code', s['solution'])
        pg.click('#run')
        pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=60000)
        cls = pg.get_attribute('#results .summary', 'class')
        if 'ok' not in cls:
            bad += 1
            print('FAIL', s['id'], pg.inner_text('#results')[:600])
    print('solutions failing in browser:', bad, '| overall:', pg.inner_text('#overall-text'))
    # infinite loop handling
    pg.evaluate("location.hash = 'b01'")
    pg.wait_for_function("document.querySelector('#fname').textContent === 'double.ts'")
    pg.fill('#code', 'function double(n: number): number {\n  while (true) {}\n}')
    t1 = time.time(); pg.click('#run')
    pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=60000)
    print('loop → %.1fs:' % (time.time() - t1), pg.inner_text('#results')[-160:].replace('\n', ' | '))
    # a typical learner mistake, for the screenshot
    pg.evaluate("location.hash = 'g02'")
    pg.wait_for_function("document.querySelector('#fname').textContent === 'first.ts'")
    pg.fill('#code', 'function first(items: string[]) {\n  return items[0];\n}')
    pg.click('#run')
    pg.wait_for_selector('#results .summary.bad', timeout=60000)
    pg.screenshot(path='build/shot-fail.png', full_page=True)
    pg.emulate_media(color_scheme='dark')
    pg.evaluate("location.hash = 'n02'")
    pg.wait_for_function("document.querySelector('#fname').textContent === 'nameLength.ts'")
    pg.evaluate("document.querySelector('#reset-btn').click(); document.querySelector('#do-reset').click()")
    pg.click('#run')
    pg.wait_for_selector('#results .summary.bad', timeout=60000)
    pg.screenshot(path='build/shot-dark.png', full_page=False)
    print('LOGS:', logs[:10])
    b.close()
