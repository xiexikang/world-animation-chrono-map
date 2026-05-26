/**
 * 从 nodes.json 或源 JSON 中的 cover URL 下载到 public/covers/
 * 用法:
 *   node scripts/download-covers.mjs
 *   node scripts/download-covers.mjs "C:\Users\...\animations_100_with_covers.json" --cn10
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const coversDir = path.join(root, 'public', 'covers')
const nodesPath = path.join(root, 'public', 'data', 'nodes.json')

const args = process.argv.slice(2)
const cn10 = args.includes('--cn10')
const srcArg = args.find((a) => !a.startsWith('--'))

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

function extFromUrl(url, contentType) {
  try {
    const p = new URL(url).pathname
    const m = p.match(/\.(jpe?g|png|webp|gif|svg)$/i)
    if (m) return m[1].toLowerCase().replace('jpeg', 'jpg')
  } catch {
    /* ignore */
  }
  if (contentType?.includes('png')) return 'png'
  if (contentType?.includes('webp')) return 'webp'
  if (contentType?.includes('gif')) return 'gif'
  if (contentType?.includes('svg')) return 'svg'
  return 'jpg'
}

function isRemoteCover(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

function skipUrl(url) {
  try {
    return new URL(url).hostname === 'placehold.co'
  } catch {
    return true
  }
}

async function downloadOne(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ChronoMapCoverBot/1.0 (local dev; educational)',
      Accept: 'image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return { size: buf.length, contentType: res.headers.get('content-type') }
}

function loadNodes() {
  if (srcArg && fs.existsSync(srcArg)) {
    const raw = JSON.parse(fs.readFileSync(srcArg, 'utf8'))
    let list = raw.map((r, i) => ({
      id: String(r.id),
      title: r.title,
      country: COUNTRY_MAP[r.country] ?? 'OTHER',
      era: r.era,
      year: ERA_YEAR[r.era] ?? 2000,
      themes: r.themes,
      cover: r.cover,
      quote: '',
    }))
    if (cn10) {
      list = list
        .filter((n) => n.country === 'CN')
        .slice(0, 10)
        .map((n, i) => ({
          ...n,
          id: `cn-${String(i + 1).padStart(2, '0')}`,
        }))
    }
    return list
  }
  return JSON.parse(fs.readFileSync(nodesPath, 'utf8'))
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const defaultSrc = path.join(
    process.env.USERPROFILE ?? '',
    'Downloads',
    'animations_100_with_covers.json',
  )
  const src = srcArg ?? defaultSrc
  const nodes = loadNodes()

  fs.mkdirSync(coversDir, { recursive: true })

  let ok = 0
  let skip = 0
  let fail = 0

  for (const node of nodes) {
    const url = node.cover
    if (!isRemoteCover(url)) {
      console.log(`· ${node.id} 已是本地: ${url}`)
      skip++
      continue
    }
    if (skipUrl(url)) {
      console.log(`⊘ ${node.id} 跳过占位图: ${node.title}`)
      skip++
      continue
    }

    let ext = extFromUrl(url)
    const dest = path.join(coversDir, `${node.id}.${ext}`)

    try {
      console.log(`↓ ${node.id} ${node.title}`)
      const { contentType } = await downloadOne(url, dest)
      const realExt = extFromUrl(url, contentType)
      if (realExt !== ext) {
        const renamed = path.join(coversDir, `${node.id}.${realExt}`)
        fs.renameSync(dest, renamed)
        ext = realExt
      }
      node.cover = `/covers/${node.id}.${ext}`
      ok++
      console.log(`  ✓ → ${node.cover}`)
    } catch (e) {
      fail++
      console.warn(`  ✗ ${e.message}`)
    }

    await delay(400)
  }

  fs.writeFileSync(nodesPath, `${JSON.stringify(nodes, null, 2)}\n`, 'utf8')
  console.log(`\n完成: 下载 ${ok}，跳过 ${skip}，失败 ${fail}`)
  console.log(`已更新 ${nodesPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
