// Tek dosyalık sürüm: oyunu, internet ve sunucu gerektirmeden çift tıklayınca açılan TEK bir HTML'e paketler.
// • JS modülleri esbuild ile tek betiğe (IIFE) toplanır (file:// altında modül içe aktarma çalışmadığı için).
// • Görseller (img/ref/*.png) ve yazı tipleri (css/yazitipi/*.woff2) data: URI olarak gömülür.
// • CSS dosyaları <style> içine alınır.
// Kullanım: node araclar/tekdosya.mjs [çıktı.html]   (varsayılan: dist/cevher-madenci.html)
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(fileURLToPath(new URL('..', import.meta.url)))
const CIKTI = resolve(process.argv[2] || join(KOK, 'dist', 'cevher-madenci.html'))

// ── Görseller: yol → data URI ──
const varlik = {}
for (const ad of await readdir(join(KOK, 'img', 'ref'))) {
  if (!ad.endsWith('.png')) continue
  varlik['img/ref/' + ad] = 'data:image/png;base64,' + (await readFile(join(KOK, 'img', 'ref', ad))).toString('base64')
}
// Metindeki her "img/ref/AD.png" geçişini gömülü veriyle değiştirir (data URI tırnak/ters tırnak içermez)
const gom = (metin) => metin.replace(/img\/ref\/[a-z0-9-]+\.png/g, (y) => {
  if (!varlik[y]) throw new Error('Görsel bulunamadı: ' + y)
  return varlik[y]
})

// ── JS: geçici kopyada yol düzeltmeleri, sonra esbuild ──
const gecici = await mkdtemp(join(tmpdir(), 'cevher-tek-'))
try {
  await cp(join(KOK, 'js'), join(gecici, 'js'), { recursive: true, filter: (y) => !/[\\/]taslak([\\/]|$)/.test(y) })
  const duzelt = async (dosya, degisimler) => {
    const yol = join(gecici, 'js', dosya)
    let s = await readFile(yol, 'utf8')
    for (const [a, b] of degisimler) {
      if (!s.includes(a)) throw new Error(`${dosya}: beklenen metin yok → ${a}`)
      s = s.replace(a, b)
    }
    await writeFile(yol, s)
  }
  // Sahne dokuları: import.meta.url ile kurulan yol yerine gömülü tablo
  const sahne = await readFile(join(gecici, 'js', 'sahne', 'sahne.js'), 'utf8')
  const dokular = [...sahne.matchAll(/\['([a-z0-9-]+\.png)',/g)].map((m) => m[1])
  await duzelt('sahne/sahne.js', [
    ["const KOK = new URL('../../img/ref/', import.meta.url).href", `const KOK = 'img/ref/'\nconst DOKU_URL = {${dokular.map((d) => `'${d}': 'img/ref/${d}'`).join(', ')}}`],
    ['Varliklar.png(a, KOK + dosya)', 'Varliklar.png(a, DOKU_URL[dosya] || KOK + dosya)'],
  ])
  // Dinamik dosya adı: iki seçeneği de açık yaz ki gömülebilsin
  await duzelt('arayuz/genisletme.js', [
    ["img/ref/loj-${liman ? 'liman' : 'depo'}.png", "${liman ? 'img/ref/loj-liman.png' : 'img/ref/loj-depo.png'}"],
  ])
  // Kalan bütün literal yolları göm
  const gez = async (d) => {
    for (const g of await readdir(d, { withFileTypes: true })) {
      const y = join(d, g.name)
      if (g.isDirectory()) await gez(y)
      else if (g.name.endsWith('.js')) await writeFile(y, gom(await readFile(y, 'utf8')))
    }
  }
  await gez(join(gecici, 'js'))
  const paket = join(gecici, 'paket.js')
  execFileSync('npx', ['--yes', 'esbuild', join(gecici, 'js', 'ana.js'), '--bundle', '--format=iife', '--minify',
    '--target=es2020', '--legal-comments=none', '--log-level=warning', '--outfile=' + paket], { stdio: 'inherit' })
  const js = (await readFile(paket, 'utf8')).replace(/<\/script/gi, '<\\/script')

  // ── CSS: yazı tipleri gömülü, sonra oyun stilleri ──
  let yazitipi = await readFile(join(KOK, 'css', 'yazitipi.css'), 'utf8')
  const fontlar = [...new Set([...yazitipi.matchAll(/url\('(yazitipi\/[^']+\.woff2)'\)/g)].map((m) => m[1]))]
  for (const f of fontlar) {
    const veri = 'data:font/woff2;base64,' + (await readFile(join(KOK, 'css', f))).toString('base64')
    yazitipi = yazitipi.split(`url('${f}')`).join(`url('${veri}')`)
  }
  let css = yazitipi
  for (const ad of ['temel.css', 'oyun.css', 'pencereler.css', 'sayfalar.css']) css += '\n' + (await readFile(join(KOK, 'css', ad), 'utf8'))
  css = gom(css)

  // ── HTML: index.html gövde parçasından tam belge ──
  let govde = await readFile(join(KOK, 'index.html'), 'utf8')
  govde = govde
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<!--[\s\S]*?-->\s*/, '')
    .replace(/<meta name="theme-color"[^>]*>\s*/i, '')
    .replace(/<link [^>]*>\s*/gi, '')
    .replace('<script type="module" src="js/ana.js"></script>', '')
  govde = gom(govde)
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#062B42">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Cevher Madenci">
<title>Cevher Madenci</title>
<style>
${css}
</style>
</head>
<body>
${govde.trim()}
<script>
${js}
</script>
</body>
</html>
`
  await mkdir(dirname(CIKTI), { recursive: true })
  await writeFile(CIKTI, html)
  console.log(`Tek dosya hazır: ${CIKTI} (${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB, ${Object.keys(varlik).length} görsel, ${fontlar.length} yazı tipi)`)
} finally {
  await rm(gecici, { recursive: true, force: true })
}
