// Paketleyici (Paket D): Capacitor için dist/ yazar.
// dist/index.html = tam belge (index.html parçası sarılır) + css/, js/ ve varsa img/ kopyalanır.
// Kullanım: node araclar/paketle.mjs
import { cp, mkdir, readFile, rm, stat, writeFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(fileURLToPath(new URL('..', import.meta.url)))
const HEDEF = join(KOK, 'dist')
const BAS = '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n'
const SON = '\n</body>\n</html>\n'
const var_ = (y) => stat(y).then(() => true, () => false)

await rm(HEDEF, { recursive: true, force: true })
await mkdir(HEDEF, { recursive: true })

const parca = await readFile(join(KOK, 'index.html'), 'utf8')
await writeFile(join(HEDEF, 'index.html'), /^\s*<!doctype/i.test(parca) ? parca : BAS + parca + SON)

let sayi = 1
for (const klasor of ['css', 'js', 'img']) {
  const k = join(KOK, klasor)
  if (!(await var_(k))) continue
  // Geliştirme taslakları ve önizlemeler yayına girmez
  await cp(k, join(HEDEF, klasor), { recursive: true, filter: (y) => !/[\\/]taslak([\\/]|$)/.test(y) })
  const say = async (d) => { for (const g of await readdir(d, { withFileTypes: true })) g.isDirectory() ? await say(join(d, g.name)) : sayi++ }
  await say(join(HEDEF, klasor))
}
console.log(`dist/ hazır: ${sayi} dosya → ${HEDEF}`)
