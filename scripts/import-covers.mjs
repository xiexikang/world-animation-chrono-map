/**
 * 从 animations_100_with_covers.json 生成 public/data/nodes.json
 * 用法: node scripts/import-covers.mjs [源文件路径]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const defaultSrc = path.join(
  process.env.USERPROFILE ?? '',
  'Downloads',
  'animations_100_with_covers.json',
)
const src = process.argv[2] ?? defaultSrc

const COUNTRY_MAP = {
  CN: 'CN',
  JP: 'JP',
  US: 'US',
  FR: 'EU',
  BE: 'EU',
  FI: 'EU',
  RU: 'EU',
  GB: 'UK',
  IE: 'UK',
}

const ERA_YEAR = {
  60: 1960,
  70: 1970,
  80: 1980,
  90: 1990,
  '00': 2000,
  10: 2010,
  20: 2020,
}

const raw = JSON.parse(fs.readFileSync(src, 'utf8'))
const nodes = raw.map((r) => ({
  id: String(r.id),
  title: r.title,
  country: COUNTRY_MAP[r.country] ?? 'OTHER',
  era: r.era,
  year: ERA_YEAR[r.era] ?? 2000,
  themes: r.themes,
  cover: r.cover,
  ...(r.description ? { description: r.description } : {}),
  quote: r.quote ?? '',
}))

const out = path.join(root, 'public', 'data', 'nodes.json')
fs.writeFileSync(out, `${JSON.stringify(nodes, null, 2)}\n`, 'utf8')
console.log(`Wrote ${nodes.length} nodes → ${out}`)
