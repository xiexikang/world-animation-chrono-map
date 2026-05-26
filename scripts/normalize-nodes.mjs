/**
 * 规范化 public/data/nodes.json：id 转字符串、FR/GB 等映射为 EU/UK
 * 用法: node scripts/normalize-nodes.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const nodesPath = path.join(__dirname, '..', 'public', 'data', 'nodes.json')

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

const raw = JSON.parse(fs.readFileSync(nodesPath, 'utf8'))
const nodes = raw.map((r) => ({
  ...r,
  id: String(r.id),
  country: COUNTRY_MAP[r.country] ?? r.country,
  year: r.year ?? ERA_YEAR[r.era] ?? 2000,
}))

fs.writeFileSync(nodesPath, `${JSON.stringify(nodes, null, 2)}\n`, 'utf8')

const counts = {}
for (const n of nodes) counts[n.country] = (counts[n.country] || 0) + 1
console.log(`✓ 已规范化 ${nodes.length} 条`)
console.log(counts)
