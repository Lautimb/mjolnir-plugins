import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const DOWNLOAD_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/releases\/download\/[^?#]+\.mjp$/
const MAX_BYTES = 50_000_000

const index = JSON.parse(await readFile('index.json', 'utf8'))
const problems = []
const fail = (id, message) => problems.push(`${id}: ${message}`)

if (index.schema !== 1 || !Array.isArray(index.plugins)) throw new Error('index.json must be { "schema": 1, "plugins": [...] }')
const ids = new Set()
for (const entry of index.plugins) {
  const id = entry?.id ?? '(no id)'
  if (ids.has(id)) fail(id, 'duplicated id')
  ids.add(id)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(id, 'invalid id')
  if (entry.manifest?.id !== id || entry.manifest?.version !== entry.version) fail(id, 'manifest id and version must match the entry')
  if (!DOWNLOAD_URL.test(entry.url ?? '')) fail(id, 'url must be a .mjp in the releases of a GitHub repo')
  if (!Number.isInteger(entry.size) || entry.size <= 0 || entry.size > MAX_BYTES) fail(id, `size must be between 1 and ${MAX_BYTES}`)
  if (!/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) fail(id, 'sha256 must be 64 hex characters')
  if (problems.length) continue
  const response = await fetch(entry.url)
  if (!response.ok) {
    fail(id, `download failed: HTTP ${response.status}`)
    continue
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length !== entry.size) fail(id, `size is ${bytes.length}, not ${entry.size}`)
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) fail(id, 'sha256 does not match the package')
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${index.plugins.length} plugins OK`)
