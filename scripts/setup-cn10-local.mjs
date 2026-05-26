import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcPath = path.join(root, 'public', 'data', 'nodes.json')
const coversDir = path.join(root, 'public', 'covers')

const all = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
const cn = all.filter((n) => n.country === 'CN').slice(0, 10)

const colors = [
  '#E8A317',
  '#F59E0B',
  '#D97706',
  '#FBBF24',
  '#FCD34D',
  '#FDE047',
  '#FACC15',
  '#EAB308',
  '#CA8A04',
  '#A16207',
]

fs.mkdirSync(coversDir, { recursive: true })

const nodes = cn.map((node, i) => {
  const num = String(i + 1).padStart(2, '0')
  const file = `cn-${num}.svg`
  const title = node.title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="88" height="124" viewBox="0 0 88 124">
  <rect width="88" height="124" rx="8" fill="${colors[i]}"/>
  <text x="44" y="54" text-anchor="middle" fill="#1a1a1a" font-size="10" font-family="Noto Sans SC, sans-serif">${title}</text>
  <text x="44" y="72" text-anchor="middle" fill="#333" font-size="9" font-family="sans-serif">🇨🇳 ${node.era}年代</text>
</svg>`

  fs.writeFileSync(path.join(coversDir, file), svg, 'utf8')

  return {
    ...node,
    id: `cn-${num}`,
    country: 'CN',
    cover: `/covers/${file}`,
  }
})

fs.writeFileSync(
  path.join(root, 'public', 'data', 'nodes.json'),
  `${JSON.stringify(nodes, null, 2)}\n`,
  'utf8',
)

console.log(`✓ ${nodes.length} 条 CN 数据 → public/data/nodes.json`)
nodes.forEach((n) => console.log(`  ${n.id}  ${n.title}  ${n.cover}`))
