/**
 * 扫描 public/covers/{id}.{jpg|png|webp|jpeg}，自动写回 nodes.json 的 cover 字段
 * 用法: node scripts/sync-local-covers.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const coversDir = path.join(root, 'public', 'covers')
const nodesPath = path.join(root, 'public', 'data', 'nodes.json')

const EXTS = ['webp', 'jpg', 'jpeg', 'png']

const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'))
let updated = 0

for (const node of nodes) {
  const hit = EXTS.find((ext) =>
    fs.existsSync(path.join(coversDir, `${node.id}.${ext}`)),
  )
  if (!hit) continue
  const local = `/covers/${node.id}.${hit === 'jpeg' ? 'jpg' : hit}`
  if (node.cover === local) continue
  node.cover = local
  updated++
  console.log(`✓ ${node.id} → ${local}`)
}

fs.writeFileSync(nodesPath, `${JSON.stringify(nodes, null, 2)}\n`, 'utf8')
console.log(`\n已更新 ${updated} 条 → ${nodesPath}`)
