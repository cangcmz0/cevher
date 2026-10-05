// ════════════════════════════════════════════════════════════════
//  ANA (Paket D) — açılış, ana döngü, bağlantılar, görünürlük,
//  otomatik kayıt ve hata ayıklama kancası (§6.2, §6.3, §6.8).
//  requestAnimationFrame yalnız burada (ve kaydirma.js'de) çağrılır.
// ════════════════════════════════════════════════════════════════
import * as Benzetim from './benzetim.js'
import * as Kayit from './kayit.js'
import * as Cevrimdisi from './cevrimdisi.js'
import { yeniOlayListesi, Veriyolu } from './olay.js'
import { kaydirmaKur } from './kaydirma.js'
import { Ses } from './ses.js'
import { Reklam } from './reklam.js'
import { Magaza } from './magaza.js'
import { Sahne } from './sahne/sahne.js'
import { yerlesim, ustSinir } from './yerlesim.js'
import { Arayuz } from './arayuz/arayuz.js'

const ADIM = Benzetim.ADIM || 0.05
const HALKA = 600

// ── DOM ──
const kok = document.getElementById('oyun')
const alan = document.getElementById('maden')
const tuval = document.getElementById('sahne')
const efektTuval = document.getElementById('efekt')
const acilis = document.getElementById('acilis')
const acilisCubuk = document.getElementById('acilis-ilerleme')

// ── Depo (localStorage erişilemezse bellek içi yedek) ──
const depo = (() => {
  try {
    const s = window.localStorage
    const k = '__cevher2d_deneme'
    s.setItem(k, '1'); s.removeItem(k)
    return s
  } catch {
    const m = new Map()
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => { m.set(k, String(v)) },
      removeItem: (k) => { m.delete(k) },
    }
  }
})()

// ── Durum ──
let durum = null
const olaylar = yeniOlayListesi()
const durumAl = () => durum
const bolge = () => durum.bolgeler[durum.aktifBolge]

// Görünüm nesnesi her karede yeniden kullanılır (ayırma yok)
const gorunum = { kaydirY: 0, gen: 0, yuk: 0, gorunur: true }
let dpr = 1
let sayfaAcik = false
let kaydirma = null
let dunya = null
let yer = null                  // yerlesim(W) sonucu (genişlik değişince yenilenir)

// ── Hata ayıklama / test kancası (§6.3) ──
// index.html'deki satır içi betik nesneyi önceden kurar; burada genişletilir.
const K = (window.__cevher ||= {})
K.sayac ||= {}
for (const a of ['domYazim', 'ciz', 'uzun', 'hata']) if (typeof K.sayac[a] !== 'number') K.sayac[a] = 0
Object.assign(K, {
  hazir: false,
  kareler: new Float32Array(HALKA),     // kare aralıkları (ms)
  isler: new Float32Array(HALKA),       // karedeki işimiz (ms)
  kareNo: 0,                            // toplam yazılan kare (halka indisi = kareNo % 600)
})
Object.defineProperty(K, 'durum', { get: () => durum, configurable: true })

// Uzun görevler (> 50 ms)
try {
  new PerformanceObserver((liste) => { K.sayac.uzun += liste.getEntries().length })
    .observe({ type: 'longtask', buffered: false })
} catch {}

// ── Kayıt ──
let kayitIstek = 0              // performance.now() hedefi; 0 = yok
let sonKayitZaman = 0           // oyun saati (sn)

function kaydet() {
  if (!durum) return false
  try {
    const ok = Kayit.kaydet(durum, depo, Date.now())
    sonKayitZaman = durum.zaman
    kayitIstek = 0
    if (durum.calisma) durum.calisma.kirli = false
    return ok
  } catch (e) {
    console.warn('Kayıt yazılamadı', e)
    return false
  }
}
function kayitIste(ms = 1000) {
  const t = performance.now() + ms
  if (!kayitIstek || t < kayitIstek) kayitIstek = t
}
function otoKayit(simdiMs) {
  // Benzetim önemli eylemlerde 1 sn ertelenmiş kayıt ister (calisma.acilKayit), D okur ve sıfırlar
  const c = durum.calisma
  if (c && c.acilKayit) { c.acilKayit = false; kayitIste(1000) }
  if (kayitIstek && simdiMs >= kayitIstek) { kaydet(); return }
  if (durum.calisma?.kirli !== false && durum.zaman - sonKayitZaman >= 15) kaydet()
}

// ── Eylemler (arayüz ve test kancası buradan geçer) ──
// 1 sn ertelenmiş kayıt isteyenler (§3.4) ve hemen kaydedilenler
const ERTELI = new Set(['yukselt', 'madenAc', 'yoneticiTut', 'yoneticiAta', 'yoneticiCikar', 'yetenek', 'ogretici',
  'alimModu', 'ayar', 'bolgeAc', 'bolgeGit', 'arastirmaBaslat', 'arastirmaHizlandir', 'arastirmaBitir', 'gorevAl',
  'hediyeAl', 'elmasHarca', 'zamanAtla', 'urunVer'])
const HEMEN = new Set(['takviye', 'cevrimdisiTopla', 'sifirla'])

function eylem(ad, veri = {}) {
  let s
  try {
    s = Benzetim.eylem(durum, ad, veri, olaylar)
  } catch (e) {
    console.error('Eylem hatası:', ad, e)
    return { ok: false, sebep: 'gecersiz' }
  }
  if (s && s.ok) {
    if (HEMEN.has(ad)) kaydet()
    else if (ERTELI.has(ad)) kayitIste(1000)
    if (ad === 'ayar' && veri && veri.anahtar === 'kalite') boyutla()
    if (ad === 'cevrimdisiTopla') Ses.cal('para')
    if (ad === 'sifirla') kaydirma?.kaydirKonumu(1e9, { anim: false })
  } else if (s && (s.sebep === 'para' || s.sebep === 'elmas')) {
    Ses.cal('hata')
  }
  return s
}

// Ödüllü reklam: önce kaydet, reklamı oynat, ödül hak edildiyse true.
// Ödülü çağıran (arayüz) eylem ile uygular; eylem hemen kaydeder.
async function reklamIzle(yerAd) {
  kaydet()
  let ok = false
  try { ok = Boolean(await Reklam.izle(yerAd)) } catch { ok = false }
  if (ok) { Ses.cal('odul'); Ses.titret([20, 40, 20]) }
  return ok
}

// Satın alma (S2 arayüzü): önce kaydet
async function satinAl(id) {
  kaydet()
  try { return await Magaza.al(id) } catch { return false }
}

// ── Olay → ses (§5.7) ──
function yoneticiVar(istasyon) {
  const y = bolge().yoneticiler
  for (let i = 0; i < y.length; i++) if (y[i].atanan === istasyon) return true
  return false
}
function sesler(liste) {
  for (let i = 0; i < liste.length; i++) {
    const o = liste[i]
    switch (o.tip) {
      case 'yukseltildi':
        Ses.cal(o.kademeler && o.kademeler.length ? 'esik' : 'yukselt'); Ses.titret(15); break
      case 'madenAcildi':
        Ses.cal('kazi'); Ses.titret(15); setTimeout(() => Ses.cal('galeri'), 1200); break
      case 'kaziBasladi':
        if (o.manuel) Ses.cal('kazma'); break
      case 'asansorKalkti':
        if (o.manuel) Ses.cal('gonder'); break
      case 'tasiyiciCikti':
        if (!yoneticiVar('depo')) Ses.cal('gonder'); break
      case 'yoneticiTutuldu':
        Ses.cal('usta'); Ses.titret(15); break
      case 'yetenek':
        Ses.cal('yetenek'); break
      case 'seviyeAtladi':
        Ses.cal('ocak'); Ses.titret([20, 40, 20]); break
      case 'takviye':
        Ses.cal('davul'); break
      case 'gorevTamam':
        Ses.cal('gorev'); break
      case 'bolgeAcildi':
        Ses.cal('kervan'); break
    }
  }
}

// ── Boyut ──
function boyutla() {
  const gen = alan.clientWidth, yuk = alan.clientHeight
  if (!gen || !yuk) return
  dpr = window.devicePixelRatio || 1
  gorunum.gen = gen; gorunum.yuk = yuk
  if (!yer || yer.W !== gen) yer = yerlesim(gen)
  kaydirma?.boyutla(yuk)
  try { Sahne.boyutla({ gen, yuk, dpr }) } catch (e) { console.error(e) }
}
const dunyaYuk = () => (yer ? yer.dunyaH(bolge().madenler.length) : 0)

// ── Dokunma (kanvas) ──
function dokun(x, yDunya) {
  let h = null
  try { h = Sahne.isabet(x, yDunya, durum) } catch (e) { console.error(e) }
  if (!h || !h.istasyon) return
  const s = eylem('dokun', { istasyon: h.istasyon })
  if (s && !s.ok && s.sebep === 'otomatik') Arayuz.modalAc('yukseltme', { istasyon: h.istasyon })
}
function uiMi(el) {
  try {
    if (typeof Arayuz.dokunusHedefi === 'function') return Arayuz.dokunusHedefi(el) === 'ui'
  } catch {}
  return Boolean(el && el.closest && el.closest('button, a, input, select, [data-eylem], .kart, .yonetici-rozet'))
}

// ── Çevrimdışı (§3.4) ──
function cevrimdisiYol() {
  let s = null
  try {
    s = Cevrimdisi.hesapla(durum, Date.now())
    Cevrimdisi.uygula(durum, s)
  } catch (e) {
    console.error('Çevrimdışı hesap hatası', e)
    return
  }
  if (s.geriAlindi) Arayuz.bildir('bilgi', 'Cihaz saati geri alınmış; çevrimdışı kazanç verilmedi.')
  else if (s.gecen >= 60 && !(s.miktar > 0) && s.eksikYonetici) Arayuz.bildir('bilgi', 'Yöneticisi olmayan istasyonlar sen yokken çalışmaz.')
  // Görsel yön 2: bekleyen kazanç alt banttaki Çevrimdışı Kazanç panelinde durur
  if (s.gecen >= 60 && durum.bekleyenCevrimdisi) Arayuz.bildir('basari', 'Sen yokken madencilerin çalıştı!')
  kaydet()
}

// Kısa gizlenmeden sonra simülasyonu yakalar (en çok 1200 adım)
function yakala(sn) {
  const n = Math.min(1200, Math.floor(sn / ADIM))
  for (let i = 0; i < n; i++) Benzetim.adim(durum, ADIM, olaylar)
  // Yakalama sırasında biriken tek seferlik etkileri at (sesler, uçan sayılar), arayüz yine de görsün
  if (olaylar.length) {
    try { Arayuz.olaylar(olaylar, durum) } catch (e) { console.error(e) }
    olaylar.length = 0
  }
}

// ── Ana döngü (§6.8) ──
let rafNo = 0
let onceki = 0
let oncekiKare = 0
let birikim = 0
let kareSayaci = 0
let hataSayisi = 0
let hataZamanlari = []
let hataBildirildi = false
let durdu = false

function kayitOlcum(aralik, is) {
  const i = K.kareNo % HALKA
  K.kareler[i] = aralik
  K.isler[i] = is
  K.kareNo++
}

function govde(simdiMs) {
  let dt = (simdiMs - onceki) / 1000
  if (!(dt > 0)) dt = 0
  if (dt > 0.25) dt = 0.25
  onceki = simdiMs
  birikim += dt
  let n = 0
  while (birikim >= ADIM && n < 8) { Benzetim.adim(durum, ADIM, olaylar); birikim -= ADIM; n++ }
  if (n === 8) birikim = 0
  kaydirma.ilerle(dt)
  if (olaylar.length) {
    Sahne.olaylar(olaylar, durum)
    Arayuz.olaylar(olaylar, durum)
    sesler(olaylar)
    olaylar.length = 0
  }
  gorunum.gorunur = !sayfaAcik && !document.hidden
  // Pil Tasarrufu: çizim tek karelerde atlanır (simülasyon sürer)
  const ciz = durum.ayarlar?.kalite !== 'pil' || (kareSayaci++ & 1) === 0
  if (ciz) {
    gorunum.kaydirY = kaydirma.uygula(dpr)
    Sahne.ciz(durum, gorunum, simdiMs, birikim / ADIM)
    Sahne.efekt.kare(simdiMs)
  }
  Arayuz.kare(durum, gorunum, simdiMs)
  otoKayit(simdiMs)
}

function kare(simdiMs) {
  rafNo = 0
  if (durdu) return
  const t0 = performance.now()
  try {
    govde(simdiMs)
  } catch (e) {
    hataYakala(e)
    if (durdu) return
  }
  if (oncekiKare) kayitOlcum(simdiMs - oncekiKare, performance.now() - t0)
  oncekiKare = simdiMs
  rafNo = requestAnimationFrame(kare)
}

function hataYakala(e) {
  console.error('Döngü hatası:', e)
  K.sayac.hata++
  const t = performance.now()
  hataZamanlari.push(t)
  hataZamanlari = hataZamanlari.filter((z) => t - z <= 5000)
  if (!hataBildirildi) {
    hataBildirildi = true
    try { Arayuz.bildir('bilgi', 'Bir hata oluştu, oyun devam ediyor.') } catch {}
  }
  if (hataZamanlari.length >= 3) {
    durdu = true
    kaydet()
    sorunGoster()
  }
}

// Ölümcül sorun penceresi (arayüzden bağımsız, kendi DOM'u)
function sorunGoster() {
  if (document.getElementById('sorun')) return
  const p = document.createElement('div')
  p.id = 'sorun'
  p.setAttribute('role', 'dialog')
  p.style.cssText = 'position:absolute;inset:0;z-index:16;display:grid;place-items:center;background:rgba(4,14,12,.6)'
  p.innerHTML = '<div style="width:min(320px,calc(100% - 40px));padding:20px;border-radius:18px;background:#F4E8D6;color:#2B1D12;text-align:center;box-shadow:0 10px 28px rgba(0,0,0,.4);font:500 13px/17px Rubik,system-ui,sans-serif">'
    + '<h2 style="margin:0 0 14px;font:800 20px/24px \'Baloo 2\',system-ui,sans-serif">Bir sorun oluştu</h2>'
    + '<button type="button" style="width:100%;height:48px;border:0;border-radius:9px;color:#fff;font:800 15px/18px \'Baloo 2\',system-ui,sans-serif;background:linear-gradient(#F59A55,#E67E3E,#CC5F27)">Yeniden Başlat</button></div>'
  p.querySelector('button').addEventListener('click', () => location.reload())
  kok.appendChild(p)
}

function baslat() {
  if (rafNo || durdu) return
  onceki = performance.now()
  oncekiKare = 0
  rafNo = requestAnimationFrame(kare)
}
function durdur() {
  if (rafNo) cancelAnimationFrame(rafNo)
  rafNo = 0
}

// ── Görünürlük ──
let gizlenme = 0
document.addEventListener('visibilitychange', () => {
  if (!durum) return
  if (document.hidden) {
    gizlenme = Date.now()
    kaydet()
    durdur()
    Ses.askiya()
  } else {
    const gecen = gizlenme ? (Date.now() - gizlenme) / 1000 : 0
    gizlenme = 0
    try {
      if (gecen >= 60) cevrimdisiYol()
      else if (gecen > 0) yakala(gecen)
    } catch (e) { console.error(e) }
    baslat()
  }
})
window.addEventListener('pagehide', () => { if (durum) kaydet() })

// ── Ses kilidi ve dokunma sesleri ──
kok.addEventListener('pointerdown', () => Ses.ac(), { passive: true })
kok.addEventListener('click', (e) => { if (e.target.closest?.('button')) Ses.cal('tik') }, true)

// ── Açılış (§6.2) ──
function ilerleme(oran) {
  if (acilisCubuk) acilisCubuk.style.transform = 'scaleX(' + Math.max(0.05, Math.min(1, oran)) + ')'
}
function bekle(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function basla(hot = {}) {
  ilerleme(0.08)
  // 2. Kayıt
  let yuklenen
  if (hot && hot.durum) yuklenen = { durum: hot.durum, kaynak: 'kayit' }
  else yuklenen = Kayit.yukle(depo, Date.now())
  durum = yuklenen.durum
  Benzetim.hazirla(durum)
  sonKayitZaman = durum.zaman

  // Köprüler
  Ses.kur({ ayarAl: () => durum && durum.ayarlar })
  Reklam.kur({ durumAl, kok })
  Magaza.kur({
    durumAl,
    elmasEkle: (n) => { durum.oyuncu.elmas += n },
    takviyeEkle: (dk) => eylem('takviye', { dakika: dk }),
    yoneticiVer: (o) => eylem('urunVer', { yonetici: o }),
    kaydet,
    yayinla: (o) => Veriyolu.yayinla(o),
  })

  // UI ↔ D ara yolları
  Veriyolu.dinle('ses', (o) => Ses.cal(o.ad))
  Veriyolu.dinle('titret', (o) => Ses.titret(o.desen))
  Veriyolu.dinle('kaydir', (o) => kaydirma?.kaydirKonumu(o.y, { anim: o.anim !== false }))
  Veriyolu.dinle('sayfa', (o) => { sayfaAcik = Boolean(o.ad && o.ad !== 'maden') })
  Veriyolu.dinle('kaydet', () => kaydet())

  // 3. Arayüz
  Arayuz.kur(kok, { eylem, reklamIzle, satinAl, durumAl, yerlesim, sahne: Sahne, kaydirKonumu: (y, s) => kaydirma?.kaydirKonumu(y, s) })
  dunya = Arayuz.dunya || document.getElementById('dunya')
  kaydirma = kaydirmaKur({
    kok, alan, dunya,
    dunyaYukAl: dunyaYuk,
    ustSinirAl: () => ustSinir(bolge().madenler.length),
    altPay: 16,
    dokun, uiMi,
    yayinla: (o) => Veriyolu.yayinla(o),
  })
  ilerleme(0.15)

  // 4. Yazı tipleri (en çok 1.5 sn)
  try { await Promise.race([document.fonts.ready, bekle(1500)]) } catch {}
  ilerleme(0.25)

  // 5. Sahne (fırınlama; ilerleme açılış çubuğunda)
  try {
    await Sahne.kur({ tuval, efektTuval, durum, ilerleme: (o) => ilerleme(0.25 + 0.7 * o) })
  } catch (e) {
    console.warn('Sahne kurulamadı', e)
    Arayuz.bildir('bilgi', 'Görsel yüklenemedi, sade görünüm kullanılıyor.')
  }
  boyutla()
  try { new ResizeObserver(() => boyutla()).observe(alan) } catch { window.addEventListener('resize', boyutla) }
  // Görünüm alttaki yükleme katından başlar
  kaydirma.kaydirKonumu(1e9, { anim: false })

  // Yükleme uyarıları ve eski oyundan aktarım
  if (yuklenen.kaynak === 'aktarim') Arayuz.modalAc('aktarim', {})
  if (yuklenen.uyari) Arayuz.bildir('bilgi', yuklenen.uyari)

  // 6. Çevrimdışı kazanç
  cevrimdisiYol()

  // 7. Döngü
  ilerleme(1)
  baslat()
  K.hazir = true

  // 8. Açılış perdesi kaybolur (400 ms)
  if (acilis) {
    acilis.style.opacity = '0'
    acilis.style.pointerEvents = 'none'
    setTimeout(() => acilis.remove(), 450)
  }
  window.claude?.hot?.snapshot?.(() => ({ durum }))
}

// ── Kanca işlevleri ──
Object.assign(K, {
  eylem: (ad, veri) => eylem(ad, veri),
  kaydet,
  reklamIzle,
  satinAl,
  // Çevrimdışı yolu sahte bir "son" ile çalıştırır
  zamanAtla(sn) {
    durum.son -= sn * 1000
    cevrimdisiYol()
  },
  kaliteAyarla: (k) => eylem('ayar', { anahtar: 'kalite', deger: k }),
  bellek: () => ({
    yigin: performance.memory ? performance.memory.usedJSHeapSize : 0,
    onbellek: (() => { try { return Sahne.bellek() } catch { return 0 } })(),
  }),
  kaydirKonumu: (y, s) => kaydirma?.kaydirKonumu(y, s),
  modalAc: (ad, veri) => Arayuz.modalAc(ad, veri),
  sayfaAc: (ad) => Arayuz.sayfaAc(ad),
  get kaydirY() { return kaydirma ? kaydirma.y : 0 },
  get kaydirMaks() { return kaydirma ? kaydirma.maks : 0 },
  get kaydirMin() { return kaydirma ? kaydirma.enAz : 0 },
  // Öğretici hedefi: sayfa koordinatlarında { x, y } ya da null
  ogreticiHedef() {
    try {
      if (typeof Arayuz.ogreticiHedef === 'function') {
        const h = Arayuz.ogreticiHedef()
        if (h) return h
      }
    } catch {}
    const el = document.querySelector('[data-ogretici-aktif]')
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.width && r.height) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    return null
  },
})

function calistir(hot) {
  basla(hot || {}).catch((e) => {
    console.error('Açılış hatası', e)
    sorunGoster()
  })
}
window.claude?.hot?.ready ? window.claude.hot.ready(calistir) : calistir(window.claude?.hot?.data ?? {})
