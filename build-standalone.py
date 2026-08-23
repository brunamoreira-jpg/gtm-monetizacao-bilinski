from pathlib import Path
import base64, json, re, mimetypes

root = Path('/mnt/data/gtm-bilinski-vite')
html = (root/'index.html').read_text()
css = (root/'build/style.css').read_text()
js = (root/'src/main.js').read_text()
products = json.loads((root/'src/products.json').read_text())
journeys = json.loads((root/'src/journeys.json').read_text())

def data_uri(path):
    p = root/path
    mime = mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode('ascii')

replacements = {
    "import './style.css'": '',
    "import PRODUCTS from './products.json'": 'const PRODUCTS = ' + json.dumps(products, ensure_ascii=False, separators=(',', ':')),
    "import JOURNEYS from './journeys.json'": 'const JOURNEYS = ' + json.dumps(journeys, ensure_ascii=False, separators=(',', ':')),
    "import heroImg from './assets/porsche-hero.png'": "const heroImg = " + json.dumps(data_uri(Path('src/assets/porsche-hero.png'))),
    "import trackImg from './assets/porsche-track.png'": "const trackImg = " + json.dumps(data_uri(Path('src/assets/porsche-track.png'))),
    "import sideImg from './assets/porsche-side.png'": "const sideImg = " + json.dumps(data_uri(Path('src/assets/porsche-side.png'))),
    "import garageImg from './assets/porsche-garage.png'": "const garageImg = " + json.dumps(data_uri(Path('src/assets/porsche-garage.png'))),
    "import v4Logo from './assets/v4-logo.webp'": "const v4Logo = " + json.dumps(data_uri(Path('src/assets/v4-logo.webp'))),
}
for old, new in replacements.items():
    js = js.replace(old, new)

# Ensure no module imports remain.
if re.search(r'^\s*import\s', js, re.M):
    raise RuntimeError('Unresolved import in standalone JS')

html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>')
html = html.replace('<script type="module" src="/src/main.js"></script>', f'<script>\n{js}\n</script>')

out = Path('/mnt/data/GTM_Monetizacao_Bilinski_v2.html')
out.write_text(html)
(root/'dist').mkdir(exist_ok=True)
(root/'dist/index.html').write_text(html)
print(out, out.stat().st_size)
