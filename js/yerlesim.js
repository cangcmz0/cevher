// Dünya yerleşimi (§4.3, görsel yön 2 — referans2 ile birebir). Saf modül: DOM yok, yan etki yok.
// Sahne ve arayüz aynı sayıları buradan okur; böylece kanvas ile DOM kartları birebir hizalanır.
//
// Ölçüler docs/referans2.webp'nin 1. ekranından alındı: referans ekran 367 px genişlikte (x 203..570),
// bir kat 107 px (oda 73 + konveyör 34), yükleme katı 107 px, tepe taş şeridi 16 px.
// Bütün ölçüler ekran genişliğiyle orantılıdır: k = W / 367.
// Katlar alttan üste dizilir: en altta "1. Kat Yükleme", onun üstünde Maden 1 ("2. Kat").
// Asansör konumu: 0 = yükleme katının hemen üstündeki boşaltma noktası, k = Maden k'nın zemini (yukarı).

export const MAKS_MADEN = 12
export const REF_G = 367            // referans ekran genişliği
export const REF_KAT = 107          // referans kat yüksekliği
export const KY = 0.95              // dikey sıkıştırma: referans ekran (367×826) 390×844'ten uzun

const onbellek = new Map()

export function yerlesim(W) {
  W = Math.round(W) || 390
  const hazir = onbellek.get(W)
  if (hazir) return hazir
  const k = W / REF_G
  const r = (v) => Math.round(v * k * 10) / 10      // referans px → dünya px (yatay)
  const rd = (v) => Math.round(v * k * KY * 10) / 10 // referans px → dünya px (dikey)
  const SATIR_H = rd(REF_KAT)
  const TEPE_H = rd(16)
  const YUKLEME_H = rd(107)
  // Kat içi (referans kat şeridine göre)
  const ODA_UST = rd(4), ZEMIN_Y = rd(73)              // oda zemini = konveyörün üstü
  const KART_UST = rd(11.5), KART_H = rd(81.5)
  const kenar = r(3.5), kartG = r(100.5)
  const okX = r(111), okY = rd(78.5), okG = r(30), okH = rd(17)   // boyalı yeşil ok (yükseltme)
  const odaX = r(104), kuyuX = r(289), kuyuG = W - r(289)    // kuyu dilimi sağ kenara kadar (kayalar dahil)
  const tupX = r(300), tupG = r(47)                  // cam tüp (kabin) bandı
  const odaG = kuyuX - odaX
  const satirY = (i) => TEPE_H + (MAKS_MADEN - 1 - i) * SATIR_H
  const yuklemeY = TEPE_H + MAKS_MADEN * SATIR_H
  const DUNYA_H = yuklemeY + YUKLEME_H
  // Yükleme katı içi: boyalı kart, depo
  const yKart = { x: r(3), y: rd(11), w: r(87), h: rd(57) }
  const depo = { x: r(237), y: yuklemeY + rd(4), w: W - r(237), h: rd(92) }
  const KABIN_H = rd(82)
  const KABIN_YUKLEME_ALT = yuklemeY + rd(4)

  // Kabinin alt kenarının dünya y'si (konum yukarı doğru artar; katlar arası doğrusal)
  function kabinAltY(konum) {
    if (!(konum > 0)) return KABIN_YUKLEME_ALT
    const z0 = satirY(0) + ZEMIN_Y
    if (konum <= 1) return KABIN_YUKLEME_ALT + (z0 - KABIN_YUKLEME_ALT) * konum
    return z0 - (konum - 1) * SATIR_H
  }

  // Kaydırmanın üst sınırı: sonraki (kilitli) katın ya da en üst katın biraz üstü
  function ustSinir(acik) {
    const ust = Math.min(acik, MAKS_MADEN - 1)
    return Math.max(0, satirY(ust) - (acik >= MAKS_MADEN ? TEPE_H : r(24)))
  }

  const dunyaH = () => DUNYA_H

  // İstasyon kutuları (dünya koordinatı). Dokunma hedefleri ve ekran çapaları bunlardan türer.
  function istasyonKutusu(istasyon, acik) {
    if (istasyon === 'asansor') {
      const ust = acik > 0 ? satirY(acik - 1) : yuklemeY - SATIR_H
      return { x: kuyuX, y: ust, w: kuyuG, h: yuklemeY - ust }
    }
    if (istasyon === 'depo') return { x: depo.x, y: depo.y, w: depo.w, h: depo.h }
    if (istasyon === 'satis') return { x: r(110), y: yuklemeY + r(40), w: r(120), h: r(55) }
    if (typeof istasyon === 'string' && istasyon[0] === 'm') {
      const i = +istasyon.slice(1)
      if (!(i >= 0 && i < MAKS_MADEN)) return null
      return { x: odaX, y: satirY(i) + ODA_UST, w: odaG, h: ZEMIN_Y - ODA_UST + r(20) }
    }
    return null
  }

  // Dondurulmaz: tüketiciler nesneye kendi işaretini ekleyebilir.
  const y = {
    W, k, r, rd, kenar, kartG, odaX, odaG, kuyuX, kuyuG, tupX, tupG, okX, okY, okG, okH, depo, yKart,
    SATIR_H, KART_H, KART_UST, TEPE_H, YUKLEME_H, ODA_UST, ZEMIN_Y, KABIN_H, DUNYA_H,
    satirY, yuklemeY, dunyaH, istasyonKutusu, ustSinir, kabinAltY,
  }
  onbellek.set(W, y)
  return y
}

// Geriye uyumluluk: tek genişlik bilinmeden çağrılanlar (390 varsayılır)
export const ustSinir = (acik, W = 390) => yerlesim(W).ustSinir(acik)
