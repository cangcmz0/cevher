// Test sunucusu (Paket D, §8.2): depo kökünü doğru MIME türleriyle sunar.
// "/" yayın ortamı gibi index.html parçasını tam belgeye sarar.
// Kullanım: node test/sunucu.mjs [port]   ya da   import { sunucuBaslat } from './sunucu.mjs'
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const KOK = resolve(fileURLToPath(new URL('..', import.meta.url)))

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

export const BAS = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
export const SON = '</body></html>'

// Parça bir .html dosyasını tam belgeye sarar (zaten tam belgeyse dokunmaz)
export function sar(parca) {
  return /^\s*<!doctype/i.test(parca) ? parca : BAS + parca + SON
}

export function sunucuBaslat(port = 0, kok = KOK) {
  const s = http.createServer(async (istek, yanit) => {
    try {
      let yol = decodeURIComponent(new URL(istek.url, 'http://x').pathname)
      if (yol === '/') yol = '/index.html'
      const tam = normalize(join(kok, yol))
      if (tam !== kok && !tam.startsWith(kok + sep)) { yanit.writeHead(403).end(); return }
      const b = await stat(tam).catch(() => null)
      if (!b || !b.isFile()) { yanit.writeHead(404, { 'content-type': 'text/plain' }).end('yok'); return }
      const uz = extname(tam).toLowerCase()
      let govde = await readFile(tam)
      // Kökteki .html parçaları (index ve önizleme sayfaları) sarılır
      if (uz === '.html') govde = Buffer.from(sar(govde.toString('utf8')))
      yanit.writeHead(200, { 'content-type': MIME[uz] || 'application/octet-stream', 'cache-control': 'no-store' })
      yanit.end(istek.method === 'HEAD' ? undefined : govde)
    } catch (h) {
      yanit.writeHead(500).end(String(h))
    }
  })
  return new Promise((ok) => s.listen(port, '127.0.0.1', () => ok({ sunucu: s, port: s.address().port, adres: `http://127.0.0.1:${s.address().port}` })))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { adres } = await sunucuBaslat(Number(process.argv[2]) || 8080)
  console.log('Cevher Madenci 2D sunucusu:', adres)
}
