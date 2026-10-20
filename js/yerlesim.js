// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Dünya yerleşimi (§4.3, görsel yön 2 — referans2 ile birebir). Saf modül: DOM yok, yan etki yok.
// Sahne ve arayüz aynı sayıları buradan okur; böylece kanvas ile DOM kartları birebir hizalanır.
//
// Ölçüler docs/referans2.webp'nin 1. ekranından alındı: referans ekran 367 px genişlikte (x 203..570),
// bir kat 107 px (oda 73 + konveyör 34), yükleme katı 107 px, dip taş şeridi 16 px.
// Bütün ölçüler ekran genişliğiyle orantılıdır: k = W / 367.
// Maden aşağı doğru ilerler: en üstte yüzey (gökyüzü, kuyu kulesi), altında
// "1. Kat Yükleme" (kamyon, depo), onun altında Maden 1 ("2. Kat") ve derine doğru diğerleri.
// Asansör konumu: 0 = kuyu kulesindeki boşaltma noktası (depo bunkerinin ağzı), k = Maden k'nın zemini (aşağı).

export const MAKS_MADEN = 30
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
  const YUZEY_H = rd(64)                              // en üstte yüzey şeridi
  const TEPE_H = rd(16)                               // en altta taş şeridi (dip)
  const YUKLEME_H = rd(107)
  // Kat içi (referans kat şeridine göre)
  const ODA_UST = rd(4), ZEMIN_Y = rd(73)              // oda zemini = konveyörün üstü
  const KART_UST = rd(11.5), KART_H = rd(81.5)
  const kenar = r(3.5), kartG = r(100.5)
  const okX = r(111), okY = rd(78.5), okG = r(30), okH = rd(17)   // boyalı yeşil ok (yükseltme)
  const odaX = r(104), kuyuX = r(289), kuyuG = W - r(289)    // kuyu dilimi sağ kenara kadar (kayalar dahil)
  const tupX = r(300), tupG = r(47)                  // cam tüp (kabin) bandı
  const odaG = kuyuX - odaX
  const yuklemeY = YUZEY_H
  const ilkKatY = yuklemeY + YUKLEME_H
  const satirY = (i) => ilkKatY + i * SATIR_H
  const DUNYA_H = satirY(MAKS_MADEN) + TEPE_H
  // Yükleme katı içi: boyalı kart, depo (bunker kuyunun solunda)
  const yKart = { x: r(3), y: rd(11), w: r(87), h: rd(57) }
  const depo = { x: r(226), y: yuklemeY + rd(4), w: r(290 - 226), h: rd(92) }
  const KABIN_H = rd(82)
  const KABIN_YUKLEME_ALT = yuklemeY + rd(50)          // boşaltırken kabin tabanı bunkerin ağzında
  const makaraY = yuklemeY - rd(44)                    // kuyu kulesinin makarası (yüzeyde)

  // Kabinin alt kenarının dünya y'si (konum aşağı doğru artar; katlar arası doğrusal; eksi = yaylanma, yukarı)
  function kabinAltY(konum) {
    if (!(konum > 0)) return KABIN_YUKLEME_ALT + Math.min(0, konum || 0) * SATIR_H * 0.5
    const z0 = satirY(0) + ZEMIN_Y
    if (konum <= 1) return KABIN_YUKLEME_ALT + (z0 - KABIN_YUKLEME_ALT) * konum
    return z0 + (konum - 1) * SATIR_H
  }

  // Kaydırma yüzeyden başlar
  const ustSinir = () => 0
  // Kaydırmanın alt sınırı için dünya yüksekliği: sonraki (kilitli) kat ve biraz pay
  function dunyaH(acik) {
    if (!(acik >= 0) || acik >= MAKS_MADEN) return DUNYA_H
    return Math.min(DUNYA_H, satirY(acik) + SATIR_H + r(24))
  }

  // İstasyon kutuları (dünya koordinatı). Dokunma hedefleri ve ekran çapaları bunlardan türer.
  function istasyonKutusu(istasyon, acik) {
    if (istasyon === 'asansor') {
      const alt = acik > 0 ? satirY(acik - 1) + SATIR_H : ilkKatY
      return { x: kuyuX, y: yuklemeY, w: kuyuG, h: alt - yuklemeY }
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
    SATIR_H, KART_H, KART_UST, TEPE_H, YUZEY_H, YUKLEME_H, ODA_UST, ZEMIN_Y, KABIN_H, DUNYA_H,
    satirY, yuklemeY, ilkKatY, makaraY, dunyaH, istasyonKutusu, ustSinir, kabinAltY,
  }
  onbellek.set(W, y)
  return y
}

// Geriye uyumluluk: tek genişlik bilinmeden çağrılanlar (390 varsayılır)
export const ustSinir = (acik, W = 390) => yerlesim(W).ustSinir(acik)
