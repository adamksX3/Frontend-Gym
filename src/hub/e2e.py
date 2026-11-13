# Оболочка: каждый тренажёр открывается, решает задачу, прогресс виден в шапке и переживает перезагрузку; старый прогресс подхватывается.
import os, sys, json
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath('dist/index.html')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1400, 'height': 950}, accept_downloads=True)
    pg = ctx.new_page()
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'blob:', 'about:', 'data:')) else r.abort())
    logs = []
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:200]) if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: ' + str(e)[:300]))
    # старый прогресс из отдельного файла тренажёра
    pg.goto('file://' + os.path.abspath('gyms/html-markup-gym.html'))
    pg.evaluate("localStorage.setItem('htmlgym-v1', JSON.stringify({solved:{o01:true,o02:true},drafts:{},attempts:{}}))")
    pg.goto(URL); pg.wait_for_selector('#gyms button')
    print('tabs:', pg.inner_text('#gyms').replace('\n', ' '), '| total:', pg.inner_text('#total-text'))
    for gid in ['js', 'ts', 'html', 'css', 'react', 'tools']:
        pg.click('#gyms [data-gym="%s"]' % gid)
        fr = pg.frame_locator('#stage iframe:not([hidden])')
        fr.locator('#tasklist button').first.wait_for(timeout=30000)
        f = [x for x in pg.frames if x != pg.main_frame and x.parent_frame == pg.main_frame and x.evaluate("typeof TASKS !== 'undefined' && document.title") ]
        f = [x for x in pg.frames if x.parent_frame == pg.main_frame][-1]
        n = f.evaluate("TASKS.length")
        t = f.evaluate("(() => { const t = TASKS.find(x => !JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('%s')) || 'null') || '{\"solved\":{}}').solved[x.id]); return {id: t.id, solution: t.solution}; })()" % {'js':'jsgym','ts':'tsgym','html':'htmlgym','css':'cssgym','react':'reactgym','tools':'toolsgym'}[gid])
        f.click('#tasklist [data-id="%s"]' % t['id']) if f.query_selector('#tasklist [data-id="%s"]' % t['id']) else f.evaluate("id => { location.hash = id }", t['id'])
        f.fill('#code', t['solution']); f.click('#run')
        f.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=40000)
        pg.wait_for_timeout(300)
        print(gid, 'tasks:', n, '| task', t['id'], '|', f.inner_text('#results .summary'), '| tab:', pg.inner_text('#gyms [data-gym="%s"]' % gid).replace('\n', ' '), '| hash:', pg.evaluate('location.hash'))
    print('total:', pg.inner_text('#total-text'))
    pg.screenshot(path='shot.png')
    # экспорт
    pg.click('#tools-btn')
    with pg.expect_download() as d: pg.click('#export-btn')
    path = d.value.path(); data = json.load(open(path, encoding='utf8'))
    print('export:', d.value.suggested_filename, {k: len(v.get('solved', {})) for k, v in data['gyms'].items()}, '|', pg.inner_text('#menu-msg'))
    # перезагрузка: прогресс и последняя вкладка на месте
    pg.goto('about:blank'); pg.goto(URL); pg.wait_for_selector('#gyms button')
    print('after reload:', pg.inner_text('#total-text'), '| selected:', pg.inner_text('#gyms [aria-selected="true"]').replace('\n', ' '))
    # импорт в чистое хранилище
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_selector('#gyms button')
    print('cleared:', pg.inner_text('#total-text'))
    pg.click('#tools-btn'); pg.set_input_files('#import-file', path); pg.wait_for_timeout(800)
    print('imported:', pg.inner_text('#total-text'), '|', pg.inner_text('#menu-msg'))
    # перенос текстом
    pg.click('#show-btn'); text = pg.input_value('#io'); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_selector('#gyms button')
    pg.click('#tools-btn'); pg.fill('#io', text); pg.click('#apply-btn'); pg.wait_for_timeout(600)
    print('text transfer:', len(text), 'chars ->', pg.inner_text('#total-text'), '|', pg.inner_text('#menu-msg'))
    pg.fill('#io', 'abc'); pg.click('#apply-btn'); print('bad text:', pg.inner_text('#menu-msg'))
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.wait_for_timeout(500); pg.screenshot(path='shot-mobile.png')
    print('LOGS:', logs[:8])
    b.close()
