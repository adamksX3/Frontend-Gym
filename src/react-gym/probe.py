import os
from playwright.sync_api import sync_playwright
CASES = [
 ('j03','jsx', 'export default function App() {\n  return <p class="note">Важно</p>;\n}'),
 ('j04','jsx', 'export default function App() {\n  return <h1>Блог</h1><p>Первая запись</p>;\n}'),
 ('j01','jsx', 'export default function App() {\n  return <h1>Привет, React!</h2>;\n}'),
 ('s01','state', 'export default function App() {\n  const [count, setCount] = useState(0);\n  return <div><p>Счёт: {count}</p><button onClick={() => setCount(count + 1)}>+1</button></div>;\n}'),
 ('s01','state', "import { useState } from 'react';\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <div><p>Счёт: {count}</p><button onClick={setCount(count + 1)}>+1</button></div>;\n}"),
 ('s01','state', "import { useState } from 'react';\nexport default function App() {\n  let count = 0;\n  return <div><p>Счёт: {count}</p><button onClick={() => { count = count + 1; }}>+1</button></div>;\n}"),
 ('l03','list', 'export default function Cart({ count }) {\n  return <div><h2>Корзина</h2>{count && <span className="badge">{count}</span>}</div>;\n}'),
 ('f01','form', "import { useState } from 'react';\nexport default function App() {\n  const [name, setName] = useState('');\n  return <div><input value={name} /><p>Привет, {name}!</p></div>;\n}"),
 ('f07','form', "import { useState } from 'react';\nexport default function App() {\n  const [text, setText] = useState('');\n  const [sent, setSent] = useState('');\n  return <form onSubmit={() => setSent(text)}><input value={text} onChange={(e) => setText(e.target.value)} /><button>Отправить</button>{sent && <p>Отправлено: {sent}</p>}</form>;\n}"),
 ('p07','props', 'export default function Profile({ user }) {\n  return <div><h2>{user}</h2><p>Город: {user.city}</p></div>;\n}'),
 ('j01','jsx', 'function App() {\n  return <h1>Привет, React!</h1>;\n}'),
]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1400, 'height': 1000})
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file://' + os.path.abspath('dist/index.html'))
    for tid, topic, code in CASES:
        pg.click('#tabs [data-topic="%s"]' % topic); pg.click('#tasklist [data-id="%s"]' % tid)
        pg.fill('#code', code); pg.click('#run')
        pg.wait_for_selector('#results .summary.ok, #results .summary.bad', timeout=20000)
        print('==', tid, '|', pg.inner_text('#results').replace('\n', ' | ')[:900]); print()
    pg.click('#tabs [data-topic="state"]'); pg.click('#tasklist [data-id="s09"]')
    pg.fill('#code', pg.evaluate("TASKS.find(t=>t.id==='s09').solution")); pg.wait_for_timeout(1200)
    pg.screenshot(path='shot.png', full_page=True)
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.wait_for_timeout(600); pg.screenshot(path='shot-mobile.png')
    b.close()
