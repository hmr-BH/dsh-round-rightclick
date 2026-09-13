import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 使用 Node 调用 npm 的入口文件，避免 Windows 的 cmd.exe 重新解释带空格的参数。
const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const npmRoot = dirname(require.resolve('npm/package.json', {
  paths: [dirname(process.execPath), resolve(dirname(process.execPath), 'node_modules')],
}))
const npmCli = resolve(npmRoot, 'bin/npm-cli.js')
const dist = resolve(root, 'dist')
await mkdir(dist, { recursive: true })
execFileSync(process.execPath, [resolve(root, 'build.mjs')], { cwd: root, stdio: 'inherit' })
const output = execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', dist], {
  cwd: root,
  encoding: 'utf8',
})
const [packed] = JSON.parse(output)
const required = ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'LICENSE', 'package.json']
const included = new Set(packed.files.map(file => file.path))
for (const file of required) if (!included.has(file)) throw new Error(`发行包缺少必要文件：${file}`)
for (const file of included) {
  if (/^(?:node_modules|\.idea|\.pnpm-store|artifacts)\//.test(file) || file.endsWith('.log')) {
    throw new Error(`发行包包含不应发布的文件：${file}`)
  }
}
const archive = resolve(dist, packed.filename)
const checksum = createHash('sha256').update(await readFile(archive)).digest('hex')
await writeFile(resolve(dist, 'SHA256SUMS.txt'), `${checksum}  ${packed.filename}\n`, 'utf8')
console.log(`已打包：${packed.filename}（${packed.files.length} 个文件，${packed.size} 字节）`)
console.log('已生成：dist/SHA256SUMS.txt')
console.log('仅生成本地发行候选包，未发布到 GitHub 或 npm。')
