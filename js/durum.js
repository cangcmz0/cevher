// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Paket A: durum şeması (TASARIM §3.2), doğrulama, göçler ve tohumlu PRNG. DOM yok.

import {
  SURUM, BOLGE, BOLGELER, BASLANGIC_PARA, MADEN_SAYISI, MAKS_MADEN_SEVIYE, MAKS_ISTASYON_SEVIYE,
  YONETICI_TIPLERI, TIP_YETENEKLERI, NADIRLIKLER, ALIM_MODLARI, GECMIS_UZUNLUK, OGRETICI_SON_ADIM,
  LIMAN, AMBAR, GOREVLER, ORTAKLAR, ORTAK_MAKS, BASARIMLAR, PRESTIJ, KAYA, BULUNTU, BULUNTULAR, KESIF, KUMBARA,
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
    // Sert kaya: kaya = bu turda delinen kaya sayısı; sondaj = { i (kat indeksi), bitis, sure, reklam } ya da null
    kaya: 0,
    sondaj: null,
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
    oyuncu: { elmas: 0 },
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
    istatistik: { dokunus: 0, yukseltme: 0, yetenek: 0, reklam: 0, satis: 0, kademe: 0, kontrat: 0, takviye: 0, hazine: 0, yonetici: 0, prestijKazanc: 0, cosku: 0, kesif: 0, sondaj: 0 },
    // Başarımlar: al = alınan kademe sayısı, rekor = görülen en iyi ilerleme (prestijde düşmez)
    basarim: { al: {}, rekor: {} },
    aktarim: false,
    hikaye: { goruldu: [], bekleyen: ['giris'] },
    misyon: { gun: '', liste: [], bonus: false },
    etkinlik: { kod: '', bitis: 0 },
    // Prestij: sv = yapılan prestij sayısı, muhur = Miras Mührü (kalıcı satış bonusu), enIyi = bir turda en çok mühür,
    // gorevRekor = bölge görevlerinin şimdiye dek alınan en ileri sırası, katRekor = bölgede şimdiye dek açılan kat
    // sayısı, acilan = şimdiye dek açılmış bölgeler (elmas ödülleri yalnız ilk sefer; araştırma şartları)
    // omur = önceki turların toplam kazancı (mühür hakkı buna bağlı)
    // kayaRekor = bölgede şimdiye dek delinen kaya sayısı (tecrübeli ekip: delinmiş kaya prestijden sonra kısa sürer)
    prestij: { sv: 0, muhur: 0, omur: 0, enIyi: 0, hazirGoruldu: false, gorevRekor: {}, katRekor: {}, kayaRekor: {}, acilan: ['zonguldak'] },
    ortak: { ahmet: 1, elif: 0, mehmet: 0, zeynep: 0 },
    // Maden Müzesi: { buluntuKodu: seviye }. Her değişimde yeni nesne yazılır (ekonomi önbelleği nesneye bağlı).
    buluntu: {},
    // Keşif: suren = { tur, bolge, bitis, sure, reklam, dondu } ya da null; sayi = dönen sefer sayısı
    kesif: { suren: null, sayi: 0 },
    // Elmas Kumbarası: elmas = biriken (kesirli), kirma = kırılış sayısı
    kumbara: { elmas: 0, kirma: 0 },
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
    // Hazine damarı: { kat, tur: 'altin'|'elmas', yer (kat içi nokta), bas, bitis } ya da null
    hazine: null,
    hazineSonraki: 0,
    uretilen: 0,
    satilan: 0,
    yetenekler: {},
    dolular: { depo: false },
    // Vardiya Coşkusu: dolum 0..1, bitis = coşkunun bittiği oyun saati, son = son sayılan dokunuş
    cosku: { dolum: 0, bitis: 0, son: -1e9 },
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
  // Sert kaya: açılmış katların önündeki kayalar delinmiş sayılır (bu sistemden önceki kayıtlar dahil)
  const kayaSay = Math.floor(KAYA.sure.length)
  b.kaya = Math.max(sinirla(b.kaya, 0, kayaSay, 0), Math.min(kayaSay, Math.floor((b.madenler.length - 1) / KAYA.aralik)))
  const sj = b.sondaj
  const sonrakiKaya = KAYA.aralik * (b.kaya + 1)
  b.sondaj = duzObje(sj) && Math.floor(sj.i) === sonrakiKaya && sonrakiKaya === b.madenler.length && sonrakiKaya < MADEN_SAYISI && sayi(sj.sure) > 0
    ? { i: sonrakiKaya, bitis: sayi(sj.bitis), sure: sayi(sj.sure), reklam: sinirla(sj.reklam, 0, KAYA.reklamHak, 0) }
    : null
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
    // Prestijde kalan ustabaşı: elmasla/hediyeyle gelen. Bayraktan önceki kayıtlarda efsaneviler kalıcı sayılır.
    yeni.kalici = typeof y.kalici === 'boolean' ? y.kalici : yeni.nadirlik === 2
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
  // Miras Mührü öncesi kayıt: eski prestijler (her biri ×0,5) mühüre çevrilir
  const eskiPrestij = !duzObje(d.prestij) || !('muhur' in d.prestij)
  // Ömür kazancı öncesi kayıt: önceki turların kazancı istatistikten alınır
  const omurYok = !duzObje(d.prestij) || !('omur' in d.prestij)
  // Seviye sistemi öncesi kayıt: seviye başına +%2 satış bonusu mühüre çevrilir (5 seviye = 1 mühür)
  const eskiLv = duzObje(d.oyuncu) && typeof d.oyuncu.lv === 'number' && Number.isFinite(d.oyuncu.lv) ? Math.min(100, Math.max(1, Math.floor(d.oyuncu.lv))) : 1
  birlestir(d, v)
  delete d.oyuncu.lv
  delete d.oyuncu.xp
  delete d.oyuncu.toplamXp
  d.surum = SURUM
  d.tohum = typeof tohum === 'number' && Number.isFinite(tohum) ? tohum >>> 0 : (Date.now() >>> 0)
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
  d.prestij.muhur = Math.floor(sayi(d.prestij.muhur))
  if (eskiPrestij) d.prestij.muhur = d.prestij.sv * PRESTIJ.eskiSv
  if (eskiLv > 1) d.prestij.muhur += Math.floor((eskiLv - 1) / 5)
  d.prestij.omur = sayi(omurYok ? d.istatistik.prestijKazanc : d.prestij.omur)
  d.prestij.enIyi = Math.floor(sayi(d.prestij.enIyi))
  const gr = {}
  for (const kod of Object.keys(BOLGE)) {
    const r = Math.max(sinirla(duzObje(d.prestij.gorevRekor) ? d.prestij.gorevRekor[kod] : 0, 0, GOREVLER.length, 0), bolgeler[kod] ? bolgeler[kod].gorev.sira : 0)
    if (r > 0) gr[kod] = r
  }
  d.prestij.gorevRekor = gr
  const kr = {}
  for (const kod of Object.keys(BOLGE)) {
    const n = Math.max(sinirla(duzObje(d.prestij.katRekor) ? d.prestij.katRekor[kod] : 0, 0, MADEN_SAYISI, 0), bolgeler[kod] ? bolgeler[kod].madenler.length : 0)
    if (n > 1) kr[kod] = n
  }
  d.prestij.katRekor = kr
  const kyr = {}
  for (const kod of Object.keys(BOLGE)) {
    const n = Math.max(sinirla(duzObje(d.prestij.kayaRekor) ? d.prestij.kayaRekor[kod] : 0, 0, KAYA.sure.length, 0), bolgeler[kod] ? bolgeler[kod].kaya : 0)
    if (n > 0) kyr[kod] = n
  }
  d.prestij.kayaRekor = kyr
  // Müze: yalnız tanınan buluntular, seviye 1..maks
  const bl = {}
  for (const t of BULUNTULAR) {
    const L = sinirla(duzObje(d.buluntu) ? d.buluntu[t.kod] : 0, 0, BULUNTU.maks, 0)
    if (L > 0) bl[t.kod] = L
  }
  d.buluntu = bl
  // Keşif: tanınan tür ve bölge, sonlu süreler
  const ks = d.kesif.suren
  d.kesif.sayi = Math.floor(sayi(d.kesif.sayi))
  d.kesif.suren = duzObje(ks) && KESIF.some((t) => t.kod === ks.tur) && BOLGE[ks.bolge] && sayi(ks.sure) > 0
    ? { tur: ks.tur, bolge: ks.bolge, bitis: sayi(ks.bitis), sure: sayi(ks.sure), reklam: sinirla(ks.reklam, 0, 2, 0), dondu: !!ks.dondu }
    : null
  // Kumbara: kırılış sayısına göre tavan
  d.kumbara.kirma = Math.floor(sayi(d.kumbara.kirma))
  d.kumbara.elmas = Math.min(sayi(d.kumbara.elmas), Math.min(KUMBARA.tavanMaks, KUMBARA.tavan + KUMBARA.tavanArtis * d.kumbara.kirma))
  const acilan = new Set(['zonguldak', ...Object.keys(bolgeler)])
  for (const k of Array.isArray(d.prestij.acilan) ? d.prestij.acilan : []) if (BOLGE[k]) acilan.add(k)
  d.prestij.acilan = BOLGELER.map((b) => b.kod).filter((k) => acilan.has(k))
  // başarımlar: tanınan kodlar, kademe 0..esik sayısı, rekor sonlu ve negatif değil
  const al = {}, rekor = {}
  for (const t of BASARIMLAR) {
    const n = Math.floor(sayi(duzObje(d.basarim.al) ? d.basarim.al[t.kod] : 0))
    if (n > 0) al[t.kod] = Math.min(n, t.esik.length)
    const r = sayi(duzObje(d.basarim.rekor) ? d.basarim.rekor[t.kod] : 0)
    if (r > 0) rekor[t.kod] = r
  }
  d.basarim = { al, rekor }
  // ortaklar: 0..maks; tanışma sahnesi görüldüyse (ya da sıradaysa) en az 1
  for (const o of ORTAKLAR) {
    d.ortak[o.kod] = sinirla(d.ortak[o.kod], 0, ORTAK_MAKS, 0)
    if (d.ortak[o.kod] < 1 && (d.hikaye.goruldu.includes(o.sahne) || d.hikaye.bekleyen.includes(o.sahne))) d.ortak[o.kod] = 1
  }
  // Hikâyeden önceki kayıtlar: ilerlemeye göre tanışılmış say
  const zg = d.bolgeler.zonguldak.gorev.sira
  if (d.ogretici.bitti && d.ortak.mehmet < 1) d.ortak.mehmet = 1
  if (zg >= 5 && d.ortak.elif < 1) d.ortak.elif = 1
  if (zg >= 6 && d.ortak.zeynep < 1) d.ortak.zeynep = 1
  d.calisma = yeniCalisma(d)
  return d
}
