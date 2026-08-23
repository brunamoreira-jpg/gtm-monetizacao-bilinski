import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/tailwindcss/dist/lib.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.join(root, 'src/style.css')
const htmlPath = path.join(root, 'index.html')
const jsPath = path.join(root, 'src/main.js')
const css = await fs.readFile(cssPath, 'utf8')
const html = await fs.readFile(htmlPath, 'utf8')
const js = await fs.readFile(jsPath, 'utf8')

const compiler = await compile(css, {
  base: root,
  from: cssPath,
  async loadStylesheet(id, base) {
    if (id === 'tailwindcss') {
      const p = '/opt/nvm/versions/node/v22.16.0/lib/node_modules/tailwindcss/index.css'
      return { path: p, base: path.dirname(p), content: await fs.readFile(p, 'utf8') }
    }
    const resolved = path.resolve(base, id)
    return { path: resolved, base: path.dirname(resolved), content: await fs.readFile(resolved, 'utf8') }
  }
})

const source = `${html}\n${js}`
const candidates = new Set()
const patterns = [
  /class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g,
  /class=\\?"([^"\\]+)\\?"/g
]
for (const pattern of patterns) {
  let m
  while ((m = pattern.exec(source))) {
    for (const token of m[1].split(/\s+/)) {
      const t = token.trim()
      if (t && !t.includes('${')) candidates.add(t)
    }
  }
}
// Explicit utilities that occur inside dynamic template strings or are toggled at runtime.
for (const t of ['hidden','block','grid','flex','w-full','bg-transparent','text-left','mt-1','mt-2','mt-3','mt-5','mt-6','mt-7','mt-8','mt-10','pt-5','pt-6','pt-7','pt-8','pb-5','px-5','pb-8','text-white/30','text-white/35','text-white/40','text-v4-red','text-xl','text-2xl','grid-cols-2','gap-5','border-t','border-white/10']) candidates.add(t)

const output = compiler.build([...candidates])
await fs.mkdir(path.join(root, 'build'), { recursive: true })
await fs.writeFile(path.join(root, 'build/style.css'), output)
console.log(`Compiled Tailwind CSS with ${candidates.size} candidates -> ${output.length} bytes`)
