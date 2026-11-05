import { readFile, writeFile } from 'node:fs/promises'

const SOURCE = process.env.SOURCE_REPO ?? 'Lautimb/mjolnir'
const ASSET = 'catalog-entries.json'
const headers = { accept: 'application/vnd.github+json', ...(process.env.GH_TOKEN ? { authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) }

const response = await fetch(`https://api.github.com/repos/${SOURCE}/releases/latest`, { headers })
if (response.status === 404) {
  console.log(`${SOURCE} has no published release yet`)
  process.exit(0)
}
if (!response.ok) throw new Error(`latest release: HTTP ${response.status}`)
const release = await response.json()
const asset = release.assets.find((candidate) => candidate.name === ASSET)
if (!asset) {
  console.log(`${release.tag_name} has no ${ASSET}`)
  process.exit(0)
}
const entries = await fetch(asset.browser_download_url).then((response) => response.json())
const index = JSON.parse(await readFile('index.json', 'utf8'))
const official = new Map(entries.map((entry) => [entry.id, entry]))
index.plugins = [...index.plugins.filter((entry) => !official.has(entry.id)), ...official.values()].sort((a, b) => a.id.localeCompare(b.id))
await writeFile('index.json', `${JSON.stringify(index, null, 2)}\n`)
console.log(`${release.tag_name}: ${[...official.keys()].join(', ')}`)
