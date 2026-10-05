// ════════════════════════════════════════════════════════════════
//  ORTAK (Paket C) — arayüz modüllerinin paylaştığı yardımcılar.
//  • A modülleri ad alanı olarak alınır: eksik bir dışa aktarım bağlamayı
//    kırmaz, yerine yerel yedek kullanılır.
//  • yaz / sinif / ozellik: önbellekli DOM yazımı (eski arayuz.js gibi);
//    her gerçek yazım __cevher.sayac.domYazim'ı artırır (§6.6, §7).
// ════════════════════════════════════════════════════════════════
import * as Bicim from '../bicim.js'
import * as Ekonomi from '../ekonomi.js'
import * as Ayar from '../ayar.js'
import * as Olay from '../olay.js'
import * as SesM from '../ses.js'

export const E = Ekonomi
export const A = Ayar

// ── Biçim (§4.12) ──
export const bicim = Bicim.bicim
export const oranYazi = Bicim.oran || ((n) => Bicim.bicim(n) + '/sn')
export const tam = Bicim.tam || ((n) => Math.floor(n).toLocaleString('tr-TR'))
export const yuzde = Bicim.yuzde || ((x) => '%' + Math.round(x * 100))
export const sure = Bicim.sure
export const sayac = Bicim.sayac
export const artiYuzde = Bicim.artiYuzde || ((x) => (x < 0 ? '-%' : '+%') + Math.abs(Math.round(x * 100)))
// Ondalıklı küçük sayı (1,2 kat/sn, 6,8 sn): bicim zaten virgül kullanır
export const ondalik = (n) => Bicim.bicim(n)

// ── DOM yazım önbelleği ──
const sayacAl = () => globalThis.__cevher?.sayac
function say() { const s = sayacAl(); if (s) s.domYazim = (s.domYazim || 0) + 1 }

export function yaz(el, metin) {
  if (!el || el.__m === metin) return
  el.__m = metin
  el.textContent = metin
  say()
}
export function sinif(el, ad, var_) {
  if (!el || el.classList.contains(ad) === var_) return
  el.classList.toggle(ad, var_)
  say()
}
export function gizle(el, gizli) {
  if (!el || el.hidden === gizli) return
  el.hidden = gizli
  say()
}
// CSS özel özelliği (ör. --o ilerleme, --oran halka). Değer önceki ile aynıysa yazmaz.
export function ozellik(el, ad, deger) {
  if (!el) return
  const k = '__o' + ad
  if (el[k] === deger) return
  el[k] = deger
  el.style.setProperty(ad, deger)
  say()
}
export function oznitelik(el, ad, deger) {
  if (!el) return
  const k = '__a' + ad
  if (el[k] === deger) return
  el[k] = deger
  if (deger === null) el.removeAttribute(ad)
  else el.setAttribute(ad, deger)
  say()
}
// Çubuk: iç öğe translateX ile (genişlik asla değişmez). 0..1, 3 basamağa yuvarlanır.
export function cubuk(el, oran) {
  const o = Math.max(0, Math.min(1, oran || 0))
  ozellik(el, '--o', String(Math.round(o * 1000) / 1000))
}

// Şablon dizgeden öğe (yalnız kurulumda, bağlama döngüsünde asla)
const sablon = typeof document !== 'undefined' ? document.createElement('template') : null
export function ogeYap(html) {
  sablon.innerHTML = html.trim()
  return sablon.content.firstElementChild
}

// ── Oyun verisi yardımcıları ──
export const bolgeAl = (d) => d.bolgeler[d.aktifBolge]
export const bolgeAdi = (kod) => A.BOLGE?.[kod]?.ad || kod
export function istasyonKaydi(b, ist) {
  if (ist === 'asansor') return b.asansor
  if (ist === 'depo') return b.depo
  return b.madenler[+ist.slice(1)]
}
export const madenMi = (ist) => ist.charCodeAt(0) === 109 // 'm'
export function istasyonAdi(ist) {
  if (ist === 'asansor') return 'Asansör'
  if (ist === 'depo') return 'Depo'
  return 'Maden ' + (+ist.slice(1) + 1)
}
export const istasyonTipi = (ist) => (ist === 'asansor' || ist === 'depo' ? ist : 'maden')
export function maksSeviye(ist) { return madenMi(ist) ? (A.MAKS_MADEN_SEVIYE || 400) : (A.MAKS_ISTASYON_SEVIYE || 800) }
export function kademeListesi(ist) { return madenMi(ist) ? A.KADEME_MADEN : A.KADEME_ISTASYON }

const NAD_YEDEK = [
  { ad: 'Sıradan', renk: '#B8C2C8', carpan: 2, indirim: 0.4, sure: 120, bekleme: 600 },
  { ad: 'Nadir', renk: '#4A90E2', carpan: 3, indirim: 0.6, sure: 180, bekleme: 600 },
  { ad: 'Efsanevi', renk: '#F6C453', carpan: 5, indirim: 0.8, sure: 300, bekleme: 900 },
]
export const nadirlik = (n) => (A.NADIRLIKLER || NAD_YEDEK)[n] || NAD_YEDEK[0]
const YET_YEDEK = {
  kazi: { ad: 'Kazı Hızı', etki: 'uretim' }, pazarlik: { ad: 'Pazarlık', etki: 'indirim' },
  hizli: { ad: 'Hızlı Kabin', etki: 'hiz' }, genis: { ad: 'Geniş Kabin', etki: 'kapasite' },
  cevik: { ad: 'Çevik Taşıyıcı', etki: 'hiz' }, dolu: { ad: 'Dolu Sepet', etki: 'yuk' },
}
export const yetenekBilgi = (kod) => (A.YETENEKLER || YET_YEDEK)[kod] || YET_YEDEK.kazi
// 'Kazı Hızı ×3' ya da 'Pazarlık −%60'
export function yetenekEtki(y) {
  const n = nadirlik(y.nadirlik), yt = yetenekBilgi(y.yetenek)
  return yt.etki === 'indirim' ? `${yt.ad} −%${Math.round(n.indirim * 100)}` : `${yt.ad} ×${n.carpan}`
}
export const yoneticiAdi = (y) => `${y.ad} Usta`

// İstasyon → atanmış yönetici (döngüsüz arama için tablo; her bağlamada yeniden doldurulur)
export function atananlar(b, tablo) {
  for (const k in tablo) tablo[k] = null
  for (let i = 0; i < b.yoneticiler.length; i++) {
    const y = b.yoneticiler[i]
    if (y.atanan) tablo[y.atanan] = y
  }
  return tablo
}

// Yetenek durumu: A'nın yetenekDurum'u + halka oranı (kalan / toplam, 1→0)
export function yetenekHali(d, y) {
  const r = E.yetenekDurum ? E.yetenekDurum(d, y) : null
  const n = nadirlik(y.nadirlik)
  let durum, kalan
  if (r) { durum = r.durum; kalan = r.kalan }
  else if (d.zaman < y.aktifBitis) { durum = 'aktif'; kalan = y.aktifBitis - d.zaman }
  else if (d.zaman < y.hazirZaman) { durum = 'bekleme'; kalan = y.hazirZaman - d.zaman }
  else { durum = 'hazir'; kalan = 0 }
  const toplam = durum === 'aktif' ? n.sure : n.bekleme
  return { durum, kalan, halka: durum === 'hazir' ? 0 : Math.max(0, Math.min(1, kalan / toplam)) }
}

// Kart hızı (§2.9): madenUretim × uretimCarpani × satisCarpani
export function kartHizi(d, b, i) {
  const u = E.madenUretim(d, b, i, b.madenler[i].L)
  const c = E.uretimCarpani ? E.uretimCarpani(d, b, i) : 1
  const s = E.satisCarpani ? E.satisCarpani(d) : 1
  return u * c * s
}

// ── Ses, titreşim ve D ile haberleşme ──
export function ses(ad) { try { SesM.Ses?.cal?.(ad) } catch {} }
export function titret(desen) { try { SesM.Ses?.titret?.(desen) } catch {} }
export const Veriyolu = Olay.Veriyolu || { dinle() {}, yayinla() {} }
export function yayinla(olay) { try { Veriyolu.yayinla(olay) } catch {} }

// Sınıf yeniden başlatma (offsetWidth) yerine WAAPI: zorunlu yerleşim hesaplatmaz
export function canlandir(el, kareler, sure, secenek) {
  if (!el || !el.animate || azHareket()) return null
  try { return el.animate(kareler, { duration: sure, easing: 'ease-out', ...(secenek || {}) }) } catch { return null }
}
export const NABIZ = [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }]
export const SALLA = [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }]
export const PARLA = [{ filter: 'brightness(2.2)' }, { filter: 'brightness(1)' }]
export const YUVARLA = [{ transform: 'translateY(6px)', opacity: 0 }, { transform: 'none', opacity: 1 }]

const azHareketSorgu = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
export const azHareket = () => !!(azHareketSorgu && azHareketSorgu.matches)
