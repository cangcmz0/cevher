// Paket A: kalıcı kayıt, yedek ve eski 3D kayıttan aktarım (TASARIM §3). DOM yok:
// depo (localStorage benzeri { getItem, setItem, removeItem }) parametre olarak gelir.

import { SURUM, YEDEK_ARALIK_MS } from './ayar.js'
import { yeniDurum, dogrula, gocUygula } from './durum.js'

export const ANAHTAR = 'cevher2d-kayit'
export const YEDEK = 'cevher2d-yedek'
export const GELECEK = 'cevher2d-gelecek'
export const ESKI = Object.freeze(['cevher-kayit-v3', 'cevher-kayit-v2'])

// Kayda giren alanlar (beyaz liste). calisma ve bilinmeyen alanlar yazılmaz.
const KOK_ALANLAR = Object.freeze([
  'surum', 'tohum', 'olusturma', 'son', 'enGec', 'zaman', 'oyuncu', 'aktifBolge', 'bolgeler', 'takviye',
  'bekleyenCevrimdisi', 'arastirma', 'gunluk', 'reklamElmas', 'satin', 'ayarlar', 'ogretici', 'alimModu',
  'istatistik', 'aktarim', 'hikaye', 'misyon', 'etkinlik', 'prestij', 'ortak',
])
const BOLGE_ALANLAR = Object.freeze([
  'acik', 'para', 'toplamKazanc', 'enIyiGelir', 'madenler', 'asansor', 'depo', 'yoneticiler', 'kiralanan',
  'ayrilis', 'gorev', 'liman', 'ambar', 'kontrat', 'yetenekSay', 'usta', 'giris',
])
const sec = (o, alanlar) => {
  const s = {}
  for (const k of alanlar) if (o[k] !== undefined) s[k] = o[k]
  return s
}

let sonYedek = 0

function oku(depo, k) {
  try { return depo.getItem(k) } catch { return null }
}
function yazDepo(depo, k, v) {
  try { depo.setItem(k, v); return true } catch { return false }
}

export function serilestir(durum) {
  const s = sec(durum, KOK_ALANLAR)
  s.surum = SURUM
  const bolgeler = {}
  for (const kod of Object.keys(durum.bolgeler || {})) {
    const b = durum.bolgeler[kod]
    const k = sec(b, BOLGE_ALANLAR)
    k.madenler = b.madenler.map((m) => ({ L: m.L, yigin: m.yigin, kalan: m.kalan }))
    k.asansor = { L: b.asansor.L, yuk: b.asansor.yuk }
    k.depo = { L: b.depo.L, stok: b.depo.stok, yoldaki: b.depo.yoldaki }
    k.yoneticiler = b.yoneticiler.map((y) => ({
      id: y.id, tip: y.tip, nadirlik: y.nadirlik, yetenek: y.yetenek, ad: y.ad, tohum: y.tohum,
      atanan: y.atanan, aktifBitis: y.aktifBitis, hazirZaman: y.hazirZaman,
    }))
    bolgeler[kod] = k
  }
  s.bolgeler = bolgeler
  return JSON.stringify(s)
}

// Metinden durum (doğrulanmış, calisma kurulu). Geçersiz JSON'da hata fırlatır.
export function coz(str) {
  const d = JSON.parse(str)
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('kayıt nesne değil')
  return dogrula(gocUygula(d))
}

export function kaydet(durum, depo, simdiMs = Date.now()) {
  if (!durum || !depo) return false
  durum.enGec = Math.max(durum.enGec || 0, simdiMs)
  durum.son = simdiMs
  let metin
  try { metin = serilestir(durum) } catch { return false }
  const ok = yazDepo(depo, ANAHTAR, metin)
  if (ok && simdiMs - sonYedek >= YEDEK_ARALIK_MS) {
    yazDepo(depo, YEDEK, metin)
    sonYedek = simdiMs
  }
  return ok
}

// Eski 3D kaydından aktarım (§3.3): yalnız satın alımlar, ses ayarları ve elmas
function eskidenAktar(ham, simdiMs) {
  let o
  try { o = JSON.parse(ham) } catch { return null }
  if (!o || typeof o !== 'object') return null
  const d = yeniDurum(simdiMs)
  const satin = o.satin && typeof o.satin === 'object' ? o.satin : o
  for (const k of ['reklamsiz', 'altinKazma', 'baslangic']) if (satin[k] === true) d.satin[k] = true
  const ayar = o.ayarlar && typeof o.ayarlar === 'object' ? o.ayarlar : o
  for (const k of ['ses', 'titresim']) if (typeof ayar[k] === 'boolean') d.ayarlar[k] = ayar[k]
  const eskiElmas = Number(o.cevher ?? o.elmas ?? 0)
  d.oyuncu.elmas = Math.max(0, Math.floor(Number.isFinite(eskiElmas) ? eskiElmas : 0)) + 50
  d.aktarim = true
  return dogrula(d)
}

// -> { durum, kaynak: 'kayit'|'yedek'|'aktarim'|'yeni', uyari? }
export function yukle(depo, simdiMs = Date.now()) {
  const ham = oku(depo, ANAHTAR)
  if (ham) {
    let o = null
    try { o = JSON.parse(ham) } catch { o = null }
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      if (Number(o.surum) > SURUM) {
        if (!oku(depo, GELECEK)) yazDepo(depo, GELECEK, ham)
        return { durum: yeniDurum(simdiMs), kaynak: 'yeni', uyari: 'Kayıt daha yeni bir sürümden; yeni oyun başlatıldı.' }
      }
      try {
        if ((Math.floor(Number(o.surum)) || 1) < SURUM) yazDepo(depo, YEDEK, ham)
        return { durum: dogrula(gocUygula(o)), kaynak: 'kayit' }
      } catch { /* yedeğe düş */ }
    }
    const yedek = oku(depo, YEDEK)
    if (yedek) {
      try { return { durum: coz(yedek), kaynak: 'yedek' } } catch { /* yeni oyun */ }
    }
    return { durum: yeniDurum(simdiMs), kaynak: 'yeni' }
  }
  for (const k of ESKI) {
    const eski = oku(depo, k)
    if (!eski) continue
    const d = eskidenAktar(eski, simdiMs)
    if (d) return { durum: d, kaynak: 'aktarim' }
  }
  return { durum: yeniDurum(simdiMs), kaynak: 'yeni' }
}
