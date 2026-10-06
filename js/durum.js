// Paket A: durum şeması (TASARIM §3.2), doğrulama, göçler ve tohumlu PRNG. DOM yok.

import {
  SURUM, BOLGE, BOLGELER, BASLANGIC_PARA, MADEN_SAYISI, MAKS_MADEN_SEVIYE, MAKS_ISTASYON_SEVIYE,
  MAKS_SEVIYE, YONETICI_TIPLERI, TIP_YETENEKLERI, NADIRLIKLER, ALIM_MODLARI, GECMIS_UZUNLUK, OGRETICI_SON_ADIM,
  LIMAN, AMBAR, GOREVLER,
} from './ayar.js'
import { tasiyiciSayisi } from './ekonomi.js'

export { SURUM }

// ---- PRNG (mulberry32, durum.tohum içinde) ----

// [0, 1) döner ve durum.tohum'u ilerletir
export function rastgele(d) {
  d.tohum = (d.tohum + 0x6D2B79F5) >>> 0
  let t = d.tohum
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ---- Yeni durum ----

export function yeniBolge(kod) {
  const bb = BOLGE[kod] || BOLGELER[0]
  return {
    acik: true, para: BASLANGIC_PARA * bb.olcek, toplamKazanc: 0, enIyiGelir: 0,
    madenler: [{ L: 1, yigin: 0, kalan: 0 }],
    asansor: { L: 1, yuk: 0 },
    depo: { L: 1, stok: 0, yoldaki: 0 },
    yoneticiler: [],
    kiralanan: { maden: 0, asansor: 0, depo: 0 },
    ayrilis: null,
    gorev: { sira: 0, hazir: false },
    liman: 0,
    ambar: 0,
    kontrat: { no: 0, hedef: 0, ilerleme: 0, hazir: false, tamam: 0 },
    yetenekSay: 0,
    usta: false,
    giris: false,
  }
}

export function yeniDurum(simdiMs = Date.now(), tohum) {
  if (tohum === undefined) tohum = (Math.floor(simdiMs) ^ 0x9E3779B9) >>> 0
  const d = {
    surum: SURUM,
    tohum: tohum >>> 0,
    olusturma: simdiMs,
    son: simdiMs,
    enGec: simdiMs,
    zaman: 0,
    oyuncu: { lv: 1, xp: 0, toplamXp: 0, elmas: 0 },
    aktifBolge: 'zonguldak',
    bolgeler: { zonguldak: yeniBolge('zonguldak') },
    takviye: { bitis: 0 },
    bekleyenCevrimdisi: null,
    arastirma: { sv: {}, suren: null },
    gunluk: { son: '', seri: 0 },
    reklamElmas: { gun: '', n: 0 },
    satin: { reklamsiz: false, altinKazma: false, baslangic: false },
    ayarlar: { ses: true, titresim: true, kalite: 'yuksek' },
    ogretici: { adim: 0, bitti: false },
    alimModu: 1,
    istatistik: { dokunus: 0, yukseltme: 0, yetenek: 0, reklam: 0, satis: 0, kademe: 0, kontrat: 0, takviye: 0 },
    aktarim: false,
    hikaye: { goruldu: [], bekleyen: ['giris'] },
    misyon: { gun: '', liste: [], bonus: false },
    etkinlik: { kod: '', bitis: 0 },
    prestij: { sv: 0, hazirGoruldu: false },
  }
  d.calisma = yeniCalisma(d)
  return d
}

// ---- Çalışma (kaydedilmez) ----

export const yeniTasiyici = () => ({ durum: 'bekle', t: 0, sure: 0, yuk: 0, onceki: 0, konum: 0, oncekiKonum: 0, baslat: -1 })

// Kayıtlı alanlardan çalışma zamanı durumunu kurar (kabin üstte; yükü varsa boşaltmaya başlar)
export function yeniCalisma(d) {
  const kod = d.aktifBolge
  const b = d.bolgeler[kod]
  const ts = tasiyiciSayisi(b.depo.L)
  const tasiyicilar = []
  for (let k = 0; k < ts; k++) tasiyicilar.push(yeniTasiyici())
  const uretimGecmis = new Float64Array(GECMIS_UZUNLUK)
  return {
    bolge: kod,
    madenler: b.madenler.map((m) => ({ calisiyor: false, dolu: false })),
    // konum 0 = DEPO boşaltma noktası, k = Maden k (1 tabanlı). durak = yüklenen maden indeksi (0 tabanlı) ya da -1.
    asansor: {
      durum: b.asansor.yuk > 0 ? 'bosaltiyor' : 'bekle', konum: 0, onceki: 0, hedef: 0, t: 0, yuk: b.asansor.yuk, durak: -1,
      planli: 0, bas: b.asansor.yuk, manuel: false, bosaltilan: 0,
    },
    // durum: bekle | yukluyor | gidiyor | satiyor | donuyor; t = evre saniyesi, sure = evre süresi, onceki = önceki t
    // konum 0 = depo, 1 = satış noktası (oncekiKonum ara değerleme için); baslat = elle başlatma zamanı ya da -1
    tasiyicilar,
    gelirEma: 0,
    uretimGecmis,
    gecmisIndeks: 0,
    gecmisSayi: 0,
    darbogaz: null,
    darbogazSayac: { aday: null, adayBas: 0, temizBas: -1, bostaSure: 0 },
    sonKayit: 0,
    kirli: false,
    // iç sayaçlar
    sayac05: 0,
    sayac30: 0,
    pencereSatis: 0,
    sonCikis: -1e9,
    uretilen: 0,
    satilan: 0,
    yetenekler: {},
    dolular: { depo: false },
  }
}

// ---- Göçler (§3.3) ----

// GOCLER[v]: (surum v-1 kaydı) -> surum v kaydı. surum 1'de henüz göç yok.
export const GOCLER = {}

export function gocUygula(d) {
  const v0 = Math.floor(+d.surum) || 1
  for (let v = v0 + 1; v <= SURUM; v++) if (GOCLER[v]) d = GOCLER[v](d) || d
  d.surum = SURUM
  return d
}

// ---- Doğrulama ----

const duzObje = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)
const klon = (x) => (x && typeof x === 'object' ? JSON.parse(JSON.stringify(x)) : x)
const sayi = (x, v = 0) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : v)
const sinirla = (x, a, b, v) => Math.max(a, Math.min(b, Math.floor(sayi(x, v))))

// Varsayılanları derinlemesine birleştirir; geçersiz sayıları (NaN, ∞, negatif) varsayılanla değiştirir
function birlestir(h, v) {
  for (const k of Object.keys(v)) {
    const dv = v[k], hv = h[k]
    if (typeof dv === 'number') h[k] = sayi(hv, dv)
    else if (typeof dv === 'boolean') h[k] = typeof hv === 'boolean' ? hv : dv
    else if (typeof dv === 'string') h[k] = typeof hv === 'string' ? hv : dv
    else if (Array.isArray(dv)) h[k] = Array.isArray(hv) ? hv : klon(dv)
    else if (duzObje(dv)) h[k] = duzObje(hv) ? birlestir(hv, dv) : klon(dv)
    else if (dv === null && hv === undefined) h[k] = null
  }
  return h
}

function bolgeDogrula(kod, b) {
  b = birlestir(duzObje(b) ? b : {}, yeniBolge(kod))
  // madenler
  let ml = Array.isArray(b.madenler) ? b.madenler.filter(duzObje) : []
  if (ml.length > MADEN_SAYISI) ml = ml.slice(0, MADEN_SAYISI)
  if (!ml.length) ml = [{ L: 1, yigin: 0, kalan: 0 }]
  b.madenler = ml.map((m) => ({ L: sinirla(m.L, 1, MAKS_MADEN_SEVIYE, 1), yigin: sayi(m.yigin), kalan: Math.min(3, sayi(m.kalan)) }))
  b.asansor.L = sinirla(b.asansor.L, 1, MAKS_ISTASYON_SEVIYE, 1)
  b.depo.L = sinirla(b.depo.L, 1, MAKS_ISTASYON_SEVIYE, 1)
  b.ayrilis = typeof b.ayrilis === 'number' && Number.isFinite(b.ayrilis) ? b.ayrilis : null
  b.liman = sinirla(b.liman, 0, LIMAN.maks, 0)
  b.ambar = sinirla(b.ambar, 0, AMBAR.maks, 0)
  b.gorev.sira = sinirla(b.gorev.sira, 0, GOREVLER.length, 0)
  // yöneticiler
  const ids = new Set(), atananlar = new Set()
  const yl = []
  for (const y of Array.isArray(b.yoneticiler) ? b.yoneticiler : []) {
    if (!duzObje(y) || !YONETICI_TIPLERI.includes(y.tip)) continue
    let id = typeof y.id === 'string' && y.id ? y.id : null
    if (!id || ids.has(id)) id = null
    const yeni = {
      id, tip: y.tip,
      nadirlik: sinirla(y.nadirlik, 0, NADIRLIKLER.length - 1, 0),
      yetenek: TIP_YETENEKLERI[y.tip].includes(y.yetenek) ? y.yetenek : TIP_YETENEKLERI[y.tip][0],
      ad: typeof y.ad === 'string' && y.ad ? y.ad : 'Hasan',
      tohum: Math.floor(sayi(y.tohum)),
      atanan: null,
      aktifBitis: sayi(y.aktifBitis),
      hazirZaman: sayi(y.hazirZaman),
    }
    const a = y.atanan
    if (typeof a === 'string' && !atananlar.has(a) && istasyonGecerli(b, a) && istasyonTip(a) === y.tip) {
      yeni.atanan = a
      atananlar.add(a)
    }
    if (id) ids.add(id)
    yl.push(yeni)
  }
  // kimliksizlere yeni kimlik
  let n = 0
  for (const id of ids) n = Math.max(n, +id.replace(/^\D+/, '') || 0)
  for (const y of yl) if (!y.id) { y.id = 'y' + ++n; ids.add(y.id) }
  b.yoneticiler = yl
  return b
}

export const istasyonTip = (s) => (s === 'asansor' ? 'asansor' : s === 'depo' ? 'depo' : 'maden')

export function istasyonGecerli(b, s) {
  if (s === 'asansor' || s === 'depo') return true
  if (typeof s !== 'string' || !/^m\d{1,2}$/.test(s)) return false
  return +s.slice(1) < b.madenler.length
}

// Kaydı onarır (yerinde değiştirir ve döndürür). Geçersiz girdi için yeni durum döner. Çalışma alanını kurar.
export function dogrula(d) {
  if (!duzObje(d)) return yeniDurum()
  const v = yeniDurum(0, 1)
  delete v.calisma
  const tohum = d.tohum
  birlestir(d, v)
  d.surum = SURUM
  d.tohum = typeof tohum === 'number' && Number.isFinite(tohum) ? tohum >>> 0 : (Date.now() >>> 0)
  d.oyuncu.lv = sinirla(d.oyuncu.lv, 1, MAKS_SEVIYE, 1)
  // bölgeler
  const bolgeler = {}
  for (const kod of Object.keys(duzObje(d.bolgeler) ? d.bolgeler : {})) {
    if (!BOLGE[kod]) continue
    bolgeler[kod] = bolgeDogrula(kod, d.bolgeler[kod])
  }
  if (!bolgeler.zonguldak) bolgeler.zonguldak = yeniBolge('zonguldak')
  d.bolgeler = bolgeler
  if (!bolgeler[d.aktifBolge] || !bolgeler[d.aktifBolge].acik) d.aktifBolge = 'zonguldak'
  bolgeler[d.aktifBolge].acik = true
  // diğerleri
  if (!ALIM_MODLARI.includes(d.alimModu)) d.alimModu = 1
  if (!['yuksek', 'dengeli', 'pil'].includes(d.ayarlar.kalite)) d.ayarlar.kalite = 'yuksek'
  d.ogretici.adim = sinirla(d.ogretici.adim, 0, OGRETICI_SON_ADIM, 0)
  const bc = d.bekleyenCevrimdisi
  if (!(duzObje(bc) && bolgeler[bc.bolge] && sayi(bc.miktar) > 0)) d.bekleyenCevrimdisi = null
  else d.bekleyenCevrimdisi = { bolge: bc.bolge, miktar: sayi(bc.miktar), sure: sayi(bc.sure), sinirli: !!bc.sinirli }
  if (!duzObje(d.arastirma.sv)) d.arastirma.sv = {}
  for (const k of Object.keys(d.arastirma.sv)) d.arastirma.sv[k] = Math.floor(sayi(d.arastirma.sv[k]))
  if (!duzObje(d.arastirma.suren)) d.arastirma.suren = null
  // hikâye kuyrukları: yalnız dize kimlikler, tekrarsız
  const dizeler = (l) => [...new Set((Array.isArray(l) ? l : []).filter((x) => typeof x === 'string' && x))]
  d.hikaye.goruldu = dizeler(d.hikaye.goruldu)
  d.hikaye.bekleyen = dizeler(d.hikaye.bekleyen).filter((x) => !d.hikaye.goruldu.includes(x))
  d.misyon.liste = (Array.isArray(d.misyon.liste) ? d.misyon.liste : []).filter((m) => duzObje(m) && typeof m.kod === 'string')
    .slice(0, 3).map((m) => ({ kod: m.kod, n: Math.max(1, Math.floor(sayi(m.n, 1))), bas: sayi(m.bas), zor: sinirla(m.zor, 0, 2, 0), alindi: !!m.alindi }))
  d.prestij.sv = Math.floor(sayi(d.prestij.sv))
  d.calisma = yeniCalisma(d)
  return d
}
