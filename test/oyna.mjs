// ════════════════════════════════════════════════════════════════
//  OYNA (Paket D, §8.2) — Playwright Chromium test düzeneği.
//  Çalıştırma: NODE_PATH=$(npm root -g) node test/oyna.mjs
//    --profil telefon|dar     yalnız bir profil
//    --senaryo 1,2,6          yalnız seçilen senaryolar (1..6)
//  Ağ yok: Google Fonts isteği boş CSS ile karşılanır (yedek yazı tipleri).
//  Çıktı: test/ekran/<profil>/*.png, test/ekran/performans.json,
//  stdout'ta özet tablo. Herhangi bir hata → çıkış kodu 1.
// ════════════════════════════════════════════════════════════════
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { sunucuBaslat, KOK } from './sunucu.mjs'

// ESM 'import playwright' NODE_PATH'i görmez; createRequire görür
const gerek = createRequire(import.meta.url)
let pw
try { pw = gerek('playwright') } catch {
  pw = gerek(join(execSync('npm root -g').toString().trim(), 'playwright'))
}
const { chromium } = pw

// ── Komut satırı ──
const arg = (ad) => { const i = process.argv.indexOf('--' + ad); return i > 0 ? process.argv[i + 1] : null }
const PROFIL_SEC = arg('profil')
const SENARYO_SEC = arg('senaryo') ? arg('senaryo').split(',').map(Number) : [1, 2, 3, 4, 5, 6]

const PROFILLER = {
  telefon: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  dar: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 },
  // Uygulama içi görüntüleyici gibi kısa ekran: üst katmanlar dokunulacak yerin üstüne binebilir
  kisa: { viewport: { width: 390, height: 600 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}
const EKRAN = join(KOK, 'test', 'ekran')
const KAYITLAR = join(KOK, 'test', 'kayitlar')
const ANAHTAR = 'cevher2d-kayit'

const bekle = (ms) => new Promise((r) => setTimeout(r, ms))
const sonuclar = []          // { profil, senaryo, ok, not }
const performans = {}
let genelHata = 0

function kaydetSonuc(profil, senaryo, ok, not = '') {
  sonuclar.push({ profil, senaryo, ok, not })
  if (!ok) genelHata++
  console.log(`${ok ? 'GEÇTİ ' : 'KALDI '} [${profil}] ${senaryo}${not ? ' — ' + not : ''}`)
}

// ── Yüzdelik ──
function yuzdelik(dizi, p) {
  if (!dizi.length) return 0
  const s = Float64Array.from(dizi).sort()
  return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]
}
const yuvarla = (x) => Math.round(x * 100) / 100
function ozet(dizi) {
  return { n: dizi.length, p50: yuvarla(yuzdelik(dizi, 50)), p95: yuvarla(yuzdelik(dizi, 95)), p99: yuvarla(yuzdelik(dizi, 99)), max: yuvarla(dizi.length ? Math.max(...dizi) : 0) }
}

// ── Sayfa açma ──
async function sayfaAc(tarayici, profilAd, { kayit = null, kayitDuzelt = null } = {}) {
  const baglam = await tarayici.newContext({ ...PROFILLER[profilAd], locale: 'tr-TR' })
  // Ağ yok: yazı tipi CSS'i boş, yazı tipi dosyaları 404 değil boş yanıt
  await baglam.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: r.request().url().includes('googleapis') ? 'text/css' : 'font/woff2', body: '' }))
  if (kayit) {
    let metin = await readFile(join(KAYITLAR, kayit), 'utf8')
    if (kayitDuzelt) { const o = JSON.parse(metin); kayitDuzelt(o); metin = JSON.stringify(o) }
    // Yalnız ilk yüklemede yaz (yeniden yüklemede oyunun kendi kaydı kalsın)
    await baglam.addInitScript(([a, m]) => {
      try { if (!sessionStorage.getItem('__enjekte')) { localStorage.setItem(a, m); sessionStorage.setItem('__enjekte', '1') } } catch {}
    }, [ANAHTAR, metin])
  }
  const sayfa = await baglam.newPage()
  const hatalar = []
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push('console: ' + m.text()) })
  sayfa.on('pageerror', (h) => hatalar.push('pageerror: ' + (h.stack || h.message)))
  sayfa.on('requestfailed', (r) => { if (!/fonts\./.test(r.url())) hatalar.push('istek: ' + r.url() + ' ' + r.failure()?.errorText) })
  await sayfa.goto(adres + '/')
  await sayfa.waitForFunction(() => window.__cevher && window.__cevher.hazir === true, null, { timeout: 20000 })
  await bekle(1300)         // açılış perdesi kaybolsun, bekleyen hikâye sahneleri açılsın
  await hikayeKapat(sayfa)
  return { baglam, sayfa, hatalar, dokunmatik: Boolean(PROFILLER[profilAd].hasTouch) }
}

// Açık hikâye sahnelerini "Atla" ile geç (kuyruktakiler dahil)
async function hikayeKapat(sayfa) {
  for (let k = 0; k < 20; k++) {
    const var_ = await sayfa.evaluate(() => {
      const b = document.querySelector('.modal.acik [data-eylem="hikaye-atla"]')
      if (b) b.click()
      return !!b
    })
    if (!var_) return
    await bekle(260)
  }
}

async function dokun(s, x, y) {
  if (s.dokunmatik) await s.sayfa.touchscreen.tap(x, y)
  else await s.sayfa.mouse.click(x, y)
}

// Görünür, etkin ve en üstte (üstü örtülmemiş) düğmeler
async function ustDugmeler(sayfa, haric = '#gezinti') {
  return sayfa.evaluate((haric) => {
    const sonuc = []
    const tum = [...document.querySelectorAll('#oyun button')]
    tum.forEach((b, i) => {
      if (b.disabled || b.closest('[data-tehlikeli]') || b.matches('[data-tehlikeli]')) return
      if (haric && b.closest(haric)) return
      const r = b.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) return
      const x = r.left + r.width / 2, y = r.top + r.height / 2
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return
      const ust = document.elementFromPoint(x, y)
      if (!ust || !(ust === b || b.contains(ust))) return
      const ad = (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
      sonuc.push({ i, x, y, ad, anahtar: ad + '|' + (b.dataset.eylem || '') + '|' + (b.dataset.istasyon || '') + '|' + (b.dataset.sekme || '') })
    })
    return sonuc
  }, haric)
}

// Açık bir yüzeydeki bütün düğmelere sırayla bas (yeniden açma işleviyle)
async function hepsineBas(s, ac, { sinir = 24, haric = '#gezinti' } = {}) {
  const basilan = new Set()
  let n = 0
  for (let tur = 0; tur < sinir; tur++) {
    const liste = await ustDugmeler(s.sayfa, haric)
    const d = liste.find((b) => !basilan.has(b.anahtar))
    if (!d) {
      // Yüzey kapanmış olabilir: yeniden aç ve kalanlara bak
      await ac()
      await bekle(350)
      const l2 = await ustDugmeler(s.sayfa, haric)
      const d2 = l2.find((b) => !basilan.has(b.anahtar))
      if (!d2) break
      continue
    }
    basilan.add(d.anahtar)
    await dokun(s, d.x, d.y)
    n++
    await bekle(260)
  }
  return { n, basilan: [...basilan].map((a) => a.split('|')[0]) }
}

async function metinVar(sayfa, metin) {
  return sayfa.evaluate((m) => document.body.innerText.includes(m), metin)
}

async function yatayKaydirmaYok(sayfa) {
  return sayfa.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)
}

// .kart içindeki her metin kutusu sığıyor mu
async function kartTasmalari(sayfa) {
  return sayfa.evaluate(() => {
    const tasan = []
    for (const k of document.querySelectorAll('.kart')) {
      const kr = k.getBoundingClientRect()
      if (!kr.width || k.closest('[hidden]') || getComputedStyle(k).visibility === 'hidden') continue
      for (const el of k.querySelectorAll('*')) {
        const metinli = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())
        if (!metinli) continue
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const r = el.getBoundingClientRect()
        if (!r.width) continue
        const blok = cs.display !== 'inline'
        if ((blok && el.scrollWidth > el.clientWidth + 1) || r.right > kr.right + 1 || r.left < kr.left - 1) {
          tasan.push(`${el.textContent.trim().slice(0, 24)} (${Math.round(r.width)}px)`)
        }
      }
    }
    return tasan
  })
}

async function ekran(s, profil, ad) {
  await s.sayfa.screenshot({ path: join(EKRAN, profil, ad) })
}

function hataNotu(s) {
  return s.hatalar.length ? `${s.hatalar.length} konsol hatası: ${s.hatalar.slice(0, 3).join(' | ').slice(0, 400)}` : ''
}

async function kapat(s, profil, senaryo) {
  if (s.hatalar.length) kaydetSonuc(profil, senaryo + ' / konsol', false, hataNotu(s))
  await s.baglam.close()
}

const durumOku = (sayfa, ifade) => sayfa.evaluate(ifade)

// ════════════ Senaryolar ════════════

// 1. İlk oyuncu: öğretici adımları
async function senaryo1(tarayici, profil) {
  const s = await sayfaAc(tarayici, profil)
  const { sayfa } = s
  await ekran(s, profil, 'ilk-acilis.png')
  if (profil === 'telefon') await copyFile(join(EKRAN, profil, 'ilk-acilis.png'), join(EKRAN, 'ilk-ana.png'))
  const t0 = await durumOku(sayfa, () => __cevher.durum.zaman)
  let ilkAlim = null, maden2 = null, sonAdim = -1, hedefYok = 0, sonDokun = 0
  const goruldu = new Set()
  const notlar = []
  while (true) {
    await hikayeKapat(sayfa)
    const d = await sayfa.evaluate(() => {
      const d = __cevher.durum, b = d.bolgeler[d.aktifBolge]
      const yon = new Set(b.yoneticiler.map((y) => y.atanan).filter(Boolean))
      return { zaman: d.zaman, adim: d.ogretici.adim, bitti: d.ogretici.bitti, L0: b.madenler[0].L, acik: b.madenler.length, yon: [...yon], hedef: __cevher.ogreticiHedef() }
    })
    const gt = d.zaman - t0
    if (ilkAlim === null && d.L0 > 1) ilkAlim = gt
    if (maden2 === null && d.acik >= 2) { maden2 = gt; await ekran(s, profil, 'maden2.png') }
    if (d.adim !== sonAdim) {
      sonAdim = d.adim
      if (d.adim >= 1 && d.adim <= 8 && !goruldu.has(d.adim)) { goruldu.add(d.adim); await bekle(350); await ekran(s, profil, `ogretici-${d.adim}.png`) }
    }
    if (d.bitti || d.adim >= 9 || gt >= 120) break
    if (d.hedef) {
      hedefYok = 0
      await dokun(s, d.hedef.x, d.hedef.y)
      await bekle(400)
    } else {
      hedefYok++
      // Hedef yokken (para bekleniyor) yöneticisiz istasyonlara elle dokun
      if (hedefYok > 3 && Date.now() - sonDokun > 380) {
        sonDokun = Date.now()
        await sayfa.evaluate((yon) => {
          const b = __cevher.durum.bolgeler[__cevher.durum.aktifBolge]
          const ist = ['depo', 'asansor', ...b.madenler.map((_, i) => 'm' + i)]
          for (const k of ist) if (!yon.includes(k)) __cevher.eylem('dokun', { istasyon: k })
        }, d.yon)
      }
      await bekle(250)
    }
  }
  const son = await sayfa.evaluate(() => ({ adim: __cevher.durum.ogretici.adim, bitti: __cevher.durum.ogretici.bitti }))
  notlar.push(`ilk alım ${ilkAlim === null ? '-' : ilkAlim.toFixed(1) + ' sn'}, Maden 2 ${maden2 === null ? '-' : maden2.toFixed(1) + ' sn'}, adım ${son.adim}${son.bitti ? ' (bitti)' : ''}`)
  const ok = ilkAlim !== null && ilkAlim <= 10 && maden2 !== null && maden2 <= 90
  kaydetSonuc(profil, '1 İlk oyuncu', ok, notlar.join('; '))
  await kapat(s, profil, '1 İlk oyuncu')
}

// 2. Zengin kayıt: HUD metinleri, kartlar, ekran görüntüsü
async function senaryo2(tarayici, profil) {
  const s = await sayfaAc(tarayici, profil, { kayit: 'zengin.json' })
  const { sayfa } = s
  const eksik = []
  for (const m of ['Seviye 12', '482 / 1.200', '420', 'Günlük Üretim', 'Depo Doluluğu', 'Gelir', 'Çevrimdışı Kazanç', 'Topla', '1. Kat', 'Yükleme']) {
    if (!(await metinVar(sayfa, m))) eksik.push(m)
  }
  // Para HUD'u: başlangıçta 318,6 bin (gelirle birkaç saniyede artar)
  const paraOk = await sayfa.evaluate(() => /31[89],\d bin|32\d,\d bin/.test(document.body.innerText))
  const tam = await metinVar(sayfa, '318,6 bin')
  if (!paraOk) eksik.push('318,6 bin')
  const kartlar = await sayfa.evaluate(() => {
    const g = []
    for (const k of document.querySelectorAll('.kart')) {
      const r = k.getBoundingClientRect()
      if (r.width && r.bottom > 0 && r.top < innerHeight && getComputedStyle(k).visibility !== 'hidden') g.push(k.innerText.split('\n')[0].trim())
    }
    return g
  })
  // Görsel yön 2: katlar alttan üste; görünümde en az 1. Kat (yükleme) ve 2.–4. Kat kartları
  for (let i = 2; i <= 4; i++) if (!kartlar.some((t) => t.startsWith(i + '. Kat'))) eksik.push('kart ' + i + '. Kat')
  await bekle(1200)
  await ekran(s, profil, 'zengin-ana.png')
  if (profil === 'telefon') await copyFile(join(EKRAN, profil, 'zengin-ana.png'), join(EKRAN, 'zengin-ana.png'))
  const yatay = await yatayKaydirmaYok(sayfa)
  const tasan = await kartTasmalari(sayfa)
  const ok = !eksik.length && yatay && !tasan.length
  kaydetSonuc(profil, '2 Zengin kayıt', ok, [eksik.length ? 'eksik: ' + eksik.join(', ') : '', tam ? '' : 'para tam 318,6 bin değil (gelir eklenmiş olabilir)', yatay ? '' : 'yatay kaydırma var', tasan.length ? 'taşan: ' + tasan.slice(0, 5).join(', ') : ''].filter(Boolean).join('; '))
  await kapat(s, profil, '2 Zengin kayıt')
}

// 3. Her düğme: sekmeler, ayarlar, yükseltme, yönetici, seviye penceresi
async function senaryo3(tarayici, profil) {
  const notlar = []
  let ok = true
  const yuzeyler = [
    ...['harita', 'yoneticiler', 'arastirma', 'magaza'].map((ad) => ({
      ad: 'sayfa-' + ad,
      ac: async (s) => {
        const b = await s.sayfa.evaluate((ad) => {
          const e = document.querySelector(`#gezinti [data-sekme="${ad}"]`); if (!e) return null
          const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        }, ad)
        if (b) await dokun(s, b.x, b.y)
        else await s.sayfa.evaluate((ad) => __cevher.sayfaAc?.(ad), ad)
      },
    })),
    { ad: 'modal-ayarlar', ac: async (s) => {
      const b = await s.sayfa.evaluate(() => {
        const e = document.querySelector('#ust [data-eylem="ayarlar"], #ust [aria-label="Ayarlar"]'); if (!e) return null
        const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
      if (b) await dokun(s, b.x, b.y)
      else await s.sayfa.evaluate(() => __cevher.modalAc('ayarlar'))
    } },
    ...['m0', 'asansor', 'depo'].map((ist) => ({ ad: 'modal-yukseltme-' + ist, ac: (s) => s.sayfa.evaluate((ist) => __cevher.modalAc('yukseltme', { istasyon: ist }), ist) })),
    { ad: 'modal-yonetici-m0', hazirla: (s) => s.sayfa.evaluate(() => { const d = __cevher.durum; d.bolgeler[d.aktifBolge].para = 1e9; d.oyuncu.elmas = 1000 }),
      ac: (s) => s.sayfa.evaluate(() => __cevher.modalAc('yonetici', { istasyon: 'm0' })) },
    { ad: 'modal-yonetici-asansor', ac: (s) => s.sayfa.evaluate(() => __cevher.modalAc('yonetici', { istasyon: 'asansor' })) },
    // Genişletme: hikâye, harita/genişletme pencereleri
    { ad: 'modal-hikaye', ac: (s) => s.sayfa.evaluate(() => __cevher.modalAc('hikaye', { id: 'zonguldak-8' })), tekSefer: true },
    ...['bolgeler', 'gorevler', 'kontratlar', 'misyonlar', 'etkinlik', 'defter', 'ustalar', 'prestij'].map((ad) => ({
      ad: 'pencere-' + ad, ac: (s) => s.sayfa.evaluate((ad) => __cevher.modalAc(ad, {}), ad),
    })),
    { ad: 'pencere-ortak', ac: (s) => s.sayfa.evaluate(() => __cevher.modalAc('ortak', { kod: 'ahmet' })) },
    { ad: 'pencere-lojistik', ac: (s) => s.sayfa.evaluate(() => __cevher.modalAc('lojistik', { tur: 'liman' })) },
    { ad: 'modal-seviye', ac: async (s) => {
      await s.sayfa.evaluate(async () => {
        const E = await import('/js/ekonomi.js')
        const o = __cevher.durum.oyuncu
        __cevher.eylem('xp', { miktar: E.xpGerek(o.lv) - o.xp + 1 })
      })
      await bekle(600)
    }, tekSefer: true },
  ]
  for (const y of yuzeyler) {
    const s = await sayfaAc(tarayici, profil, { kayit: 'zengin.json' })
    try {
      if (y.hazirla) await y.hazirla(s)
      await y.ac(s)
      await bekle(450)
      await ekran(s, profil, y.ad + '.png')
      const yatay = await yatayKaydirmaYok(s.sayfa)
      const r = await hepsineBas(s, y.tekSefer ? async () => {} : () => y.ac(s))
      if (!yatay) { ok = false; notlar.push(y.ad + ': yatay kaydırma') }
      if (r.n === 0) { ok = false; notlar.push(y.ad + ': düğme bulunamadı') }
      else notlar.push(`${y.ad}: ${r.n}`)
    } catch (h) {
      ok = false; notlar.push(y.ad + ': ' + h.message.split('\n')[0])
    }
    if (s.hatalar.length) { ok = false; notlar.push(y.ad + ' → ' + hataNotu(s)) }
    await s.baglam.close()
  }
  kaydetSonuc(profil, '3 Her düğme', ok, notlar.join('; '))
}

// 4. Çevrimdışı: modal ve Topla x2
async function senaryo4(tarayici, profil) {
  const simdi = Date.now()
  const s = await sayfaAc(tarayici, profil, { kayit: 'cevrimdisi.json', kayitDuzelt: (o) => { o.son = simdi - 3 * 3600 * 1000; o.enGec = o.son } })
  const { sayfa } = s
  const notlar = []
  let ok = await metinVar(sayfa, 'Sen yokken madencilerin çalıştı!') && await metinVar(sayfa, 'Çevrimdışı Kazanç')
  if (!ok) notlar.push('çevrimdışı bildirimi/paneli yok')
  const once = await sayfa.evaluate(() => ({ para: __cevher.durum.bolgeler[__cevher.durum.aktifBolge].para, miktar: __cevher.durum.bekleyenCevrimdisi?.miktar || 0 }))
  await ekran(s, profil, 'modal-cevrimdisi.png')
  const d = (await ustDugmeler(sayfa)).find((b) => /2x Topla/.test(b.ad))
  if (!d) { ok = false; notlar.push('2x Topla düğmesi yok') } else {
    await dokun(s, d.x, d.y)
    const perde = await sayfa.waitForSelector('.reklam-perde', { timeout: 1500 }).then(() => true, () => false)
    if (!perde) notlar.push('reklam önizleme perdesi görülmedi')
    await sayfa.waitForFunction(() => !document.querySelector('.reklam-perde'), null, { timeout: 5000 }).catch(() => {})
    await bekle(400)
    const sonra = await sayfa.evaluate(() => ({ para: __cevher.durum.bolgeler[__cevher.durum.aktifBolge].para, bekleyen: __cevher.durum.bekleyenCevrimdisi }))
    const artis = sonra.para - once.para
    notlar.push(`miktar ${Math.round(once.miktar)}, artış ${Math.round(artis)}`)
    if (!(once.miktar > 0 && artis >= 2 * once.miktar * 0.999 && artis < 2 * once.miktar * 1.5 + 1e5)) { ok = false; notlar.push('para 2× miktar artmadı') }
    if (sonra.bekleyen) { ok = false; notlar.push('bekleyenCevrimdisi temizlenmedi') }
  }
  kaydetSonuc(profil, '4 Çevrimdışı', ok, notlar.join('; '))
  await kapat(s, profil, '4 Çevrimdışı')
}

// 5. Darboğaz uyarısı
async function senaryo5(tarayici, profil) {
  const s = await sayfaAc(tarayici, profil, { kayit: 'zengin.json' })
  const { sayfa } = s
  const t0 = Date.now()
  let goruldu = false
  while (Date.now() - t0 < 10000) {
    await sayfa.evaluate(() => {
      const d = __cevher.durum; d.bolgeler[d.aktifBolge].para = 1e15
      for (let i = 0; i < 5; i++) __cevher.eylem('yukselt', { istasyon: 'm' + i, adet: 'max' })
    })
    if (await metinVar(sayfa, 'Asansör kapasitesi yetersiz!')) { goruldu = true; break }
    await bekle(500)
  }
  const sure = ((Date.now() - t0) / 1000).toFixed(1)
  if (goruldu) await ekran(s, profil, 'darbogaz.png')
  kaydetSonuc(profil, '5 Darboğaz', goruldu, goruldu ? `uyarı ${sure} sn'de` : 'uyarı 10 sn içinde görülmedi')
  await kapat(s, profil, '5 Darboğaz')
}

// 6. Performans
function olcerKur(sayfa) {
  let sonNo = null
  const aralik = [], is = [], zaman = []
  let bas = null
  async function topla() {
    const r = await sayfa.evaluate(() => ({ no: __cevher.kareNo, k: Array.from(__cevher.kareler), i: Array.from(__cevher.isler), s: { ...__cevher.sayac }, t: performance.now() }))
    if (sonNo === null) { sonNo = r.no; bas = r; return }
    const yeni = Math.min(600, r.no - sonNo)
    for (let j = r.no - yeni; j < r.no; j++) { aralik.push(r.k[j % 600]); is.push(r.i[j % 600]); zaman.push(r.t) }
    sonNo = r.no
    return r
  }
  async function bitir() {
    const r = await topla()
    const kare = r.no - bas.no
    return {
      aralik, is, zaman, sure: (r.t - bas.t) / 1000,
      kare,
      uzun: r.s.uzun - bas.s.uzun,
      domYazimKare: kare ? (r.s.domYazim - bas.s.domYazim) / kare : 0,
      cizKare: kare ? (r.s.ciz - bas.s.ciz) / kare : 0,
    }
  }
  return { topla, bitir }
}

async function olcumPenceresi(sayfa, isFn) {
  const o = olcerKur(sayfa)
  await o.topla()
  let dur = false
  const dongu = (async () => { while (!dur) { await bekle(1500); if (!dur) await o.topla() } })()
  await isFn()
  dur = true
  await dongu
  return o.bitir()
}

async function suruklemeler(s, cdp, saniye) {
  const { sayfa } = s
  const k = await sayfa.evaluate(() => { const r = document.getElementById('maden').getBoundingClientRect(); return { x: r.left + r.width * 0.62, ust: r.top + 40, alt: r.bottom - 90 } })
  const t0 = Date.now()
  let yon = 1, n = 0
  while (Date.now() - t0 < saniye * 1000) {
    if (n % 3 === 2) {
      // Fare tekerleği
      await sayfa.mouse.move(k.x, (k.ust + k.alt) / 2)
      for (let j = 0; j < 8; j++) { await sayfa.mouse.wheel(0, 120 * yon); await bekle(60) }
    } else {
      const y0 = yon > 0 ? k.alt : k.ust, y1 = yon > 0 ? k.ust : k.alt
      const ad = 14
      if (cdp && s.dokunmatik) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: k.x, y: y0 }] })
        for (let j = 1; j <= ad; j++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: k.x, y: y0 + (y1 - y0) * j / ad }] }); await bekle(16) }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      } else {
        await sayfa.mouse.move(k.x, y0); await sayfa.mouse.down()
        for (let j = 1; j <= ad; j++) { await sayfa.mouse.move(k.x, y0 + (y1 - y0) * j / ad); await bekle(16) }
        await sayfa.mouse.up()
      }
      await bekle(700)
    }
    n++
    const yk = await sayfa.evaluate(() => ({ y: __cevher.kaydirY, m: __cevher.kaydirMaks, a: __cevher.kaydirMin || 0 }))
    if (yk.y >= yk.m - 5) yon = -1
    else if (yk.y <= yk.a + 5) yon = 1
  }
}

async function hizliYukseltme(sayfa, saniye) {
  const t0 = Date.now()
  let i = 0
  while (Date.now() - t0 < saniye * 1000) {
    await sayfa.evaluate((i) => {
      const d = __cevher.durum; const b = d.bolgeler[d.aktifBolge]
      if (b.para < 1e12) b.para = 1e15
      const ist = ['m0', 'm1', 'm2', 'm3', 'm4', 'asansor', 'depo'][i % 7]
      __cevher.eylem('yukselt', { istasyon: ist, adet: 1 })
    }, i++)
    await bekle(100)
  }
}

async function senaryo6(tarayici, profil) {
  const s = await sayfaAc(tarayici, profil, { kayit: 'zengin.json' })
  const { sayfa } = s
  const cdp = await s.baglam.newCDPSession(sayfa)
  const sonuc = {}
  const notlar = []
  let ok = true
  for (const kisit of [1, 4]) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: kisit })
    await bekle(kisit > 1 ? 3000 : 500)    // kısıt sonrası ilk 3 sn sayılmaz
    const k = kisit === 1 ? 'normal' : 'kisitli4x'
    sonuc[k] = {}
    sonuc[k].kaydirma = await olcumPenceresi(sayfa, () => suruklemeler(s, cdp, 10))
    sonuc[k].bos = await olcumPenceresi(sayfa, () => bekle(10000))
    sonuc[k].yukseltme = await olcumPenceresi(sayfa, () => hizliYukseltme(sayfa, 10))
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  const bellek = await sayfa.evaluate(() => __cevher.bellek())
  // Özet ve bütçeler (§7)
  const rapor = { profil, bellek }
  for (const k of Object.keys(sonuc)) {
    rapor[k] = {}
    for (const p of Object.keys(sonuc[k])) {
      const r = sonuc[k][p]
      rapor[k][p] = {
        kare: r.kare, sure: yuvarla(r.sure),
        aralik: ozet(r.aralik), is: ozet(r.is),
        uzun34: yuvarla(100 * r.aralik.filter((a) => a > 34).length / Math.max(1, r.aralik.length)),
        uzunGorev: r.uzun, domYazimKare: yuvarla(r.domYazimKare), cizKare: yuvarla(r.cizKare),
      }
    }
  }
  const n = rapor.normal, t = rapor.kisitli4x
  const denetle = (kosul, metin) => { if (!kosul) { ok = false; notlar.push(metin) } }
  denetle(n.kaydirma.aralik.p95 <= 18, `kaydırma kare p95 ${n.kaydirma.aralik.p95} > 18 ms`)
  denetle(n.kaydirma.uzun34 <= 1, `kaydırma >34 ms kareler %${n.kaydirma.uzun34} > %1`)
  for (const p of ['kaydirma', 'bos', 'yukseltme']) {
    denetle(n[p].is.p50 <= 1.5, `${p} iş p50 ${n[p].is.p50} > 1.5 ms`)
    denetle(n[p].is.p95 <= 3, `${p} iş p95 ${n[p].is.p95} > 3 ms`)
    denetle(t[p].is.p95 <= 8, `4× ${p} iş p95 ${t[p].is.p95} > 8 ms`)
    denetle(t[p].is.max <= 25, `4× ${p} iş max ${t[p].is.max} > 25 ms`)
    denetle(n[p].uzunGorev === 0, `${p} uzun görev ${n[p].uzunGorev}`)
    denetle(n[p].domYazimKare <= 12, `${p} DOM yazımı/kare ${n[p].domYazimKare} > 12`)
  }
  if (bellek.onbellek > 48 * 1024 * 1024) { ok = false; notlar.push(`önbellek ${(bellek.onbellek / 1048576).toFixed(1)} MB > 48`) }
  performans[profil] = rapor
  notlar.unshift(`kaydırma p95 ${n.kaydirma.aralik.p95} ms, iş p50/p95 ${n.kaydirma.is.p50}/${n.kaydirma.is.p95} ms, 4× iş p95/max ${t.kaydirma.is.p95}/${t.kaydirma.is.max} ms`)
  kaydetSonuc(profil, '6 Performans', ok, notlar.join('; '))
  await kapat(s, profil, '6 Performans')
}

// ════════════ Çalıştır ════════════
const { sunucu, adres } = await sunucuBaslat(0)
const tarayici = await chromium.launch({ args: ['--enable-precise-memory-info'] })
const SENARYOLAR = { 1: senaryo1, 2: senaryo2, 3: senaryo3, 4: senaryo4, 5: senaryo5, 6: senaryo6 }
try {
  for (const profil of Object.keys(PROFILLER)) {
    if (PROFIL_SEC && PROFIL_SEC !== profil) continue
    await mkdir(join(EKRAN, profil), { recursive: true })
    for (const no of SENARYO_SEC) {
      try { await SENARYOLAR[no](tarayici, profil) } catch (h) {
        kaydetSonuc(profil, `${no} (istisna)`, false, h.message.split('\n').slice(0, 2).join(' '))
      }
    }
  }
} finally {
  await tarayici.close()
  sunucu.close()
}
if (Object.keys(performans).length) {
  await writeFile(join(EKRAN, 'performans.json'), JSON.stringify(performans, null, 2))
}

// Özet tablo
console.log('\n┌──────────┬────────────────────────────┬───────┐')
console.log('│ Profil   │ Senaryo                    │ Sonuç │')
console.log('├──────────┼────────────────────────────┼───────┤')
for (const r of sonuclar) console.log(`│ ${r.profil.padEnd(8)} │ ${r.senaryo.slice(0, 26).padEnd(26)} │ ${(r.ok ? 'GEÇTİ' : 'KALDI').padEnd(5)} │`)
console.log('└──────────┴────────────────────────────┴───────┘')
if (performans.telefon || performans.dar) {
  for (const [p, r] of Object.entries(performans)) {
    for (const k of ['normal', 'kisitli4x']) {
      for (const w of ['kaydirma', 'bos', 'yukseltme']) {
        const x = r[k][w]
        console.log(`${p.padEnd(8)} ${k.padEnd(10)} ${w.padEnd(10)} kare p50/p95/p99/max ${x.aralik.p50}/${x.aralik.p95}/${x.aralik.p99}/${x.aralik.max}  iş p50/p95/max ${x.is.p50}/${x.is.p95}/${x.is.max}  >34ms %${x.uzun34}  uzun ${x.uzunGorev}  dom/kare ${x.domYazimKare}`)
      }
    }
  }
}
console.log(genelHata ? `\n${genelHata} hata.` : '\nHepsi geçti.')
process.exit(genelHata ? 1 : 0)
