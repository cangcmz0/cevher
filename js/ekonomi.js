// Paket A: saf ekonomi formülleri (TASARIM §2, §6.4). DOM yok, durum değiştirmez.
// b = bölge nesnesi (durum.bolgeler[kod]), d = durum. Seviye (L) verilmezse istasyonun şu anki seviyesi kullanılır.

import {
  KADEME_MADEN, KADEME_ISTASYON, BOLGE, BOLGELER, ACILIS, MADEN_URETIM_TABAN, MADEN_URETIM_ARTIS,
  MADEN_MALIYET_TABAN, MADEN_MALIYET_ARTIS, MADEN_MALIYET_G, YIGIN_SANIYE, MAKS_MADEN_SEVIYE,
  ASANSOR_KAP_TABAN, ASANSOR_HIZ_TABAN, DURAK, BOSALTMA, ISTASYON_MALIYET_TABAN, ISTASYON_MALIYET_G,
  MAKS_ISTASYON_SEVIYE, TASIYICI_ESIK, TASIYICI_YUK_TABAN, DEPO_YOL_TABAN, YUKLEME, SATIS, DEPO_KAP_SANIYE,
  HIZ_TAVAN, HIZ_ARTIS, KIRALAMA_TABAN, KIRALAMA_ARTIS, NADIRLIKLER, XP, SATIS_SEVIYE_ARTIS, YETENEKLER,
  LIMAN, AMBAR, ETKINLIKLER, PRESTIJ, BOLGE_USTASI_SATIS, CEVRIMDISI_SINIR_SAAT,
} from './ayar.js'

// ---- Kademeler (§2.2) ----

export function kademeSayisi(L, liste) {
  let n = 0
  for (let i = 0; i < liste.length; i++) {
    if (L >= liste[i]) n++
    else break
  }
  return n
}

export const guc = (L, liste) => L * Math.pow(2, kademeSayisi(L, liste))

// Sonraki kademe; yoksa null
export function sonrakiKademe(L, liste) {
  for (let i = 0; i < liste.length; i++) if (liste[i] > L) return liste[i]
  return null
}

// (L - önceki) / (sonraki - önceki); son kademeden sonra (MAKS) 1
export function kademeIlerleme(L, liste) {
  const sonraki = sonrakiKademe(L, liste)
  if (sonraki === null) return 1
  const n = kademeSayisi(L, liste)
  const onceki = n ? liste[n - 1] : 0
  return (L - onceki) / (sonraki - onceki)
}

// eskiL < m <= yeniL olan kademeler
export function gecilenKademeler(eskiL, yeniL, liste) {
  const l = []
  for (const m of liste) if (m > eskiL && m <= yeniL) l.push(m)
  return l
}

// ---- Bölge, araştırma, yönetici yardımcıları ----

// Bölgenin ayar kaydı ({olcek, zorluk, ...})
export function bolgeBilgi(d, b) {
  if (d && b) {
    if (d.bolgeler[d.aktifBolge] === b) return BOLGE[d.aktifBolge] || BOLGELER[0]
    for (const k in d.bolgeler) if (d.bolgeler[k] === b) return BOLGE[k] || BOLGELER[0]
  }
  return BOLGELER[0]
}

// Araştırma seviyesi (S1'de hep 0)
export const ar = (d, kod) => (d && d.arastirma && d.arastirma.sv && d.arastirma.sv[kod]) || 0

// İstasyona atanmış yönetici ya da null
export function yoneticiBul(b, istasyon) {
  const l = b.yoneticiler
  for (let i = 0; i < l.length; i++) if (l[i].atanan === istasyon) return l[i]
  return null
}

export const istasyonTipi = (istasyon) => (istasyon === 'asansor' ? 'asansor' : istasyon === 'depo' ? 'depo' : 'maden')
export const madenIndeks = (istasyon) => (typeof istasyon === 'string' && istasyon[0] === 'm' ? +istasyon.slice(1) : -1)

export const yetenekSuresi = (d, y) => NADIRLIKLER[y.nadirlik].sure * (1 + 0.20 * ar(d, 'okul'))
export const yetenekBekleme = (d, y) => NADIRLIKLER[y.nadirlik].bekleme * (1 - 0.10 * ar(d, 'dinlenme'))

// Yetenek etkin mi
export const yetenekAktif = (d, y) => !!y && d.zaman < y.aktifBitis

// İstasyondaki yöneticinin `kod` yeteneği açıksa çarpanı, değilse 1. Pazarlık için (1 - indirim).
export function yetenekCarpani(d, b, istasyon, kod) {
  const y = yoneticiBul(b, istasyon)
  if (!y || y.yetenek !== kod || !(d.zaman < y.aktifBitis)) return 1
  const n = NADIRLIKLER[y.nadirlik]
  return YETENEKLER[kod].etki === 'indirim' ? 1 - n.indirim : n.carpan
}

// {durum:'hazir'|'aktif'|'bekleme', kalan, oran}
// aktif: oran = kalan etkin süre oranı (1 → 0); bekleme: oran = dolum (0 → 1); hazir: oran 1
export function yetenekDurum(d, y) {
  const z = d.zaman
  if (z < y.aktifBitis) {
    const kalan = y.aktifBitis - z
    return { durum: 'aktif', kalan, oran: Math.min(1, kalan / yetenekSuresi(d, y)) }
  }
  if (z < y.hazirZaman) {
    const kalan = y.hazirZaman - z
    return { durum: 'bekleme', kalan, oran: Math.max(0, 1 - kalan / yetenekBekleme(d, y)) }
  }
  return { durum: 'hazir', kalan: 0, oran: 1 }
}

const madenL = (b, i, L) => (L === undefined ? b.madenler[i].L : L)

// ---- Madenler (§2.4) ----

export function madenUretim(d, b, i, L) {
  return MADEN_URETIM_TABAN * Math.pow(MADEN_URETIM_ARTIS, i) * guc(madenL(b, i, L), KADEME_MADEN) * bolgeBilgi(d, b).olcek
}

// L -> L+1 maliyeti (Pazarlık hariç; o istasyonMaliyet'te)
export function madenMaliyet(d, b, i, L) {
  const bb = bolgeBilgi(d, b)
  return MADEN_MALIYET_TABAN * Math.pow(MADEN_MALIYET_ARTIS, i) * Math.pow(MADEN_MALIYET_G, madenL(b, i, L) - 1) *
    bb.zorluk * bb.olcek * (1 - 0.05 * ar(d, 'usta'))
}

export function madenAcilis(d, b, i) {
  const bb = bolgeBilgi(d, b)
  return ACILIS[i] * bb.zorluk * bb.olcek * (1 - 0.08 * ar(d, 'damar')) * (etkinlik(d).acilis || 1)
}

export const yiginKap = (d, b, i, L) => madenUretim(d, b, i, L) * YIGIN_SANIYE

export const madenciSayisi = (L) => 1 + (L >= 10 ? 1 : 0) + (L >= 50 ? 1 : 0)

// (1 + 0.10 kazma) * (matkap ? 1.5 : 1) * yetenek. yetenekDahil=false: kalıcı çarpan
export function uretimCarpani(d, b, i, yetenekDahil = true) {
  let c = (1 + 0.10 * ar(d, 'kazma')) * (ar(d, 'matkap') ? 1.5 : 1)
  if (yetenekDahil) c *= yetenekCarpani(d, b, 'm' + i, 'kazi')
  return c
}

// ---- Asansör (§2.5) ----

const hizKatsayi = (L) => Math.min(HIZ_TAVAN, 1 + HIZ_ARTIS * (L - 1))

export function asansorKap(d, b, L = b.asansor.L, yetenekDahil = true) {
  let k = ASANSOR_KAP_TABAN * guc(L, KADEME_ISTASYON) * bolgeBilgi(d, b).olcek * (1 + 0.15 * ar(d, 'halat'))
  if (yetenekDahil) k *= yetenekCarpani(d, b, 'asansor', 'genis')
  return k
}

export function asansorHiz(d, b, L = b.asansor.L, yetenekDahil = true) {
  let v = ASANSOR_HIZ_TABAN * hizKatsayi(L) * (1 + 0.10 * ar(d, 'motor'))
  if (yetenekDahil) v *= yetenekCarpani(d, b, 'asansor', 'hizli')
  return v
}

// kap / (2n/v + DURAK*n + BOSALTMA)
export function asansorAkis(d, b, L = b.asansor.L, yetenekDahil = true) {
  const n = b.madenler.length
  const v = asansorHiz(d, b, L, yetenekDahil)
  return asansorKap(d, b, L, yetenekDahil) / (2 * n / v + DURAK * n + BOSALTMA)
}

// ---- Depo (§2.6) ----

export function tasiyiciSayisi(L) {
  let n = 1
  for (const e of TASIYICI_ESIK) if (L >= e) n++
  return n
}

export function tasiyiciYuk(d, b, L = b.depo.L, yetenekDahil = true) {
  let y = TASIYICI_YUK_TABAN * guc(L, KADEME_ISTASYON) * bolgeBilgi(d, b).olcek
  if (yetenekDahil) y *= yetenekCarpani(d, b, 'depo', 'dolu')
  return y
}

// Tek yön yol süresi (s)
export function depoYol(d, b, L = b.depo.L, yetenekDahil = true) {
  let s = DEPO_YOL_TABAN / (hizKatsayi(L) * (1 + 0.10 * ar(d, 'ray')))
  if (yetenekDahil) s /= yetenekCarpani(d, b, 'depo', 'cevik')
  return s
}

export const depoTur = (d, b, L = b.depo.L, yetenekDahil = true) => 2 * depoYol(d, b, L, yetenekDahil) + YUKLEME + SATIS

// Depo kapasitesi yetenekten etkilenmez
export function depoKap(d, b, L = b.depo.L) {
  return DEPO_KAP_SANIYE * tasiyiciYuk(d, b, L, false) * tasiyiciSayisi(L) * (1 + 0.25 * ar(d, 'depo'))
}

export function depoAkis(d, b, L = b.depo.L, yetenekDahil = true) {
  return tasiyiciSayisi(L) * tasiyiciYuk(d, b, L, yetenekDahil) / depoTur(d, b, L, yetenekDahil)
}

// ---- Maliyetler ve toplu alım (§2.10) ----

export const istasyonMaks = (istasyon) => (istasyon === 'asansor' || istasyon === 'depo' ? MAKS_ISTASYON_SEVIYE : MAKS_MADEN_SEVIYE)
export const istasyonCarpan = (istasyon) => (istasyon === 'asansor' || istasyon === 'depo' ? ISTASYON_MALIYET_G : MADEN_MALIYET_G)

export function istasyonSeviye(b, istasyon) {
  if (istasyon === 'asansor') return b.asansor.L
  if (istasyon === 'depo') return b.depo.L
  const i = madenIndeks(istasyon)
  return b.madenler[i] ? b.madenler[i].L : 0
}

// L -> L+1 maliyeti, Pazarlık indirimi dahil
export function istasyonMaliyet(d, b, istasyon, L = istasyonSeviye(b, istasyon)) {
  if (istasyon === 'asansor' || istasyon === 'depo') {
    const bb = bolgeBilgi(d, b)
    return ISTASYON_MALIYET_TABAN * Math.pow(ISTASYON_MALIYET_G, L - 1) * bb.zorluk * bb.olcek
  }
  const i = madenIndeks(istasyon)
  return madenMaliyet(d, b, i, L) * yetenekCarpani(d, b, istasyon, 'pazarlik')
}

// c1 * (g^k - 1) / (g - 1)
export const topluMaliyet = (c1, g, k) => (k <= 0 ? 0 : c1 * (Math.pow(g, k) - 1) / (g - 1))

// En büyük k (<= ust) öyle ki topluMaliyet(c1, g, k) <= para
export function alinabilir(c1, g, para, ust = Infinity) {
  if (!(para >= c1) || ust <= 0) return 0
  let k = Math.floor(Math.log(1 + para * (g - 1) / c1) / Math.log(g))
  if (!Number.isFinite(k)) k = ust
  k = Math.max(0, Math.min(ust, k))
  while (k > 0 && topluMaliyet(c1, g, k) > para) k--
  while (k < ust && topluMaliyet(c1, g, k + 1) <= para) k++
  return k
}

// mod: 1 | 10 | 50 | 'max' -> {adet, maliyet, yeniL, maks, yetiyor}
// maks: istasyon tavanda. 'max' ile hiç alınamıyorsa adet 1 ve yetiyor false.
export function teklif(d, b, istasyon, mod) {
  const L = istasyonSeviye(b, istasyon)
  const ust = istasyonMaks(istasyon) - L
  const para = b.para
  if (ust <= 0) return { adet: 0, maliyet: 0, yeniL: L, maks: true, yetiyor: false }
  const c1 = istasyonMaliyet(d, b, istasyon, L)
  const g = istasyonCarpan(istasyon)
  let adet
  if (mod === 'max') {
    adet = alinabilir(c1, g, para, ust)
    if (adet === 0) return { adet: 1, maliyet: c1, yeniL: L + 1, maks: false, yetiyor: false }
  } else {
    adet = Math.max(1, Math.min(+mod || 1, ust))
  }
  const maliyet = adet === 1 ? c1 : topluMaliyet(c1, g, adet)
  return { adet, maliyet, yeniL: L + adet, maks: false, yetiyor: para >= maliyet }
}

// ---- Yöneticiler (§2.7) ----

export function kiralamaMaliyeti(d, b, tip) {
  const bb = bolgeBilgi(d, b)
  const n = (b.kiralanan && b.kiralanan[tip]) || 0
  return KIRALAMA_TABAN[tip] * Math.pow(KIRALAMA_ARTIS, n) * bb.zorluk * bb.olcek * (1 - 0.15 * ar(d, 'ik')) *
    (etkinlik(d).kiralama || 1)
}

// ---- Etkinlik, Liman, Ambar, Prestij ----

const ETK_YOK = Object.freeze({})
// Etkin haftalık etkinlik kaydı (yoksa boş nesne)
export function etkinlik(d) {
  const k = d && d.etkinlik && d.etkinlik.kod
  if (!k) return ETK_YOK
  for (const e of ETKINLIKLER) if (e.kod === k) return e
  return ETK_YOK
}

// Bölgenin kodu (nesneden)
export function bolgeKodu(d, b) {
  if (!d || !b) return 'zonguldak'
  if (d.bolgeler[d.aktifBolge] === b) return d.aktifBolge
  for (const k in d.bolgeler) if (d.bolgeler[k] === b) return k
  return 'zonguldak'
}

export const limanMaliyet = (d, b, L = b.liman || 0) => {
  const bb = bolgeBilgi(d, b)
  return LIMAN.taban * Math.pow(LIMAN.g, L) * bb.zorluk * bb.olcek
}
export const ambarMaliyet = (d, b, L = b.ambar || 0) => {
  const bb = bolgeBilgi(d, b)
  return AMBAR.taban * Math.pow(AMBAR.g, L) * bb.zorluk * bb.olcek
}

// Çevrimdışı ve pasif bölge birikim sınırı (s): 2 sa + Gece Vardiyası + Ambar
export function cevrimdisiSinir(d, b) {
  return (CEVRIMDISI_SINIR_SAAT + ar(d, 'gece')) * 3600 + ((b && b.ambar) || 0) * AMBAR.dakika * 60
}

export const prestijCarpani = (d) => 1 + PRESTIJ.satis * ((d && d.prestij && d.prestij.sv) || 0)

// Bölgeye özgü satış çarpanı: Liman × Bölge Ustası × bölge etkinliği
export function bolgeSatis(d, b) {
  if (!b) return 1
  let c = (1 + LIMAN.satis * (b.liman || 0)) * (b.usta ? 1 + BOLGE_USTASI_SATIS : 1)
  const e = etkinlik(d)
  if (e.satis && (!e.bolge || e.bolge === bolgeKodu(d, b))) c *= e.satis
  return c
}

// ---- Satış çarpanları (§2.9) ----

// b verilmezse aktif bölge
export function satisKalici(d, b) {
  if (b === undefined) b = d.bolgeler && d.bolgeler[d.aktifBolge]
  return (1 + SATIS_SEVIYE_ARTIS * (d.oyuncu.lv - 1)) * (1 + 0.10 * ar(d, 'pazar')) *
    (ar(d, 'ihracat') ? 1.5 : 1) * (d.satin && d.satin.altinKazma ? 2 : 1) * prestijCarpani(d) * bolgeSatis(d, b)
}

export const takviyeAktif = (d) => d.zaman < d.takviye.bitis

export const satisCarpani = (d, b) => satisKalici(d, b) * (takviyeAktif(d) ? 2 : 1)

// ---- Zincir kapasiteleri ----

// {P, A, D} (değer/s). secenek.yetenek: yetenekler dahil (varsayılan true);
// secenek.oto: yalnız yöneticili istasyonlar (yöneticisiz istasyon 0); değilse P = çalışan ya da yöneticili madenler.
export function kapasiteler(d, b, secenek) {
  const yetenek = !secenek || secenek.yetenek !== false
  const oto = !!(secenek && secenek.oto)
  let P = 0
  for (let i = 0; i < b.madenler.length; i++) {
    const yonetimli = !!yoneticiBul(b, 'm' + i)
    const calisiyor = yonetimli || (!oto && b.madenler[i].kalan > 0)
    if (calisiyor) P += madenUretim(d, b, i) * uretimCarpani(d, b, i, yetenek)
  }
  const A = oto && !yoneticiBul(b, 'asansor') ? 0 : asansorAkis(d, b, b.asansor.L, yetenek)
  const D = oto && !yoneticiBul(b, 'depo') ? 0 : depoAkis(d, b, b.depo.L, yetenek)
  return { P, A, D }
}

// Otomatik zincir geliri (para/s): min(P,A,D) yöneticili istasyonlar, yeteneksiz, takviyesiz × satisKalici
export function otoGelir(d, b) {
  const { P, A, D } = kapasiteler(d, b, { oto: true, yetenek: false })
  return Math.min(P, A, D) * satisKalici(d, b)
}

// Otomatik cevher akışı (değer/s, satış çarpanı olmadan): kontrat hedefleri için
export function otoAkis(d, b) {
  const { P, A, D } = kapasiteler(d, b, { oto: true, yetenek: false })
  return Math.min(P, A, D)
}

// Toplam Üretim (para/s): açık madenler, yeteneksiz, × satisKalici
export function toplamUretim(d, b) {
  let P = 0
  for (let i = 0; i < b.madenler.length; i++) P += madenUretim(d, b, i) * uretimCarpani(d, b, i, false)
  return P * satisKalici(d, b)
}

// ---- XP (§2.11) ----

export const xpGerek = (L) => Math.round(100 * L * Math.pow(XP.egriTaban, Math.max(0, L - XP.egriBaslangic)))

export function gelirRef(d, b) {
  return Math.max(b.enIyiGelir || 0, 0.5 * bolgeBilgi(d, b).olcek)
}

// Para harcamasından XP: max(1, round(12 * harcama / (60 * gelirRef)))
export function harcamaXp(d, b, para) {
  return Math.max(1, Math.round(XP.harcamaKatsayi * para / (XP.harcamaSaniye * gelirRef(d, b))))
}
