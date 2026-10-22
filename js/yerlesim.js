// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Dünya yerleşimi (§4.3, görsel yön 2 — referans2 ile birebir). Saf modül: DOM yok, yan etki yok.
// Sahne ve arayüz aynı sayıları buradan okur; böylece kanvas ile DOM kartları birebir hizalanır.
//
// Ölçüler docs/referans2.webp'nin 1. ekranından alındı: referans ekran 367 px genişlikte (x 203..570),
// bir kat 107 px (oda 73 + konveyör 34), dip taş şeridi 16 px.
// Bütün ölçüler ekran genişliğiyle orantılıdır: k = W / 367.
// Maden aşağı doğru ilerler. En üstte yüzey: gökyüzü, solda satış alanı, ortada yol, sağda depo silosu ve
// kuyu kulesi. Kamyonlar silonun altında dolar, yoldan karşıdaki satış alanına gidip satar. Yüzeyin altında
// Maden 1 ("1. Kat") ve derine doğru diğerleri.
// Asansör konumu: 0 = kuyu kulesindeki boşaltma noktası (silonun yanı), k = Maden k'nın zemini (aşağı).

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
  const YUZEY_H = rd(230)                             // en üstte yüzey: gökyüzü, yol, silo, kule, satış alanı
  const YOL_Y = rd(180)                               // yol yüzeyi (kamyon tekerleri)
  const TEPE_H = rd(16)                               // en altta taş şeridi (dip)
  // Kat içi (referans kat şeridine göre)
  const ODA_UST = rd(4), ZEMIN_Y = rd(73)              // oda zemini = konveyörün üstü
  const KART_UST = rd(11.5), KART_H = rd(81.5)
  const kenar = r(3.5), kartG = r(100.5)
  const okX = r(111), okY = rd(78.5), okG = r(30), okH = rd(17)   // boyalı yeşil ok (yükseltme)
  const odaX = r(104), kuyuX = r(289), kuyuG = W - r(289)    // kuyu dilimi sağ kenara kadar (kayalar dahil)
  const tupX = r(300), tupG = r(47)                  // cam tüp (kabin) bandı
  const odaG = kuyuX - odaX
  const ilkKatY = YUZEY_H
  const satirY = (i) => ilkKatY + i * SATIR_H
  const DUNYA_H = satirY(MAKS_MADEN) + TEPE_H
  // Yüzey: depo silosu (kamyonlar altında dolar) ve satış alanı (kamyonlar orada boşaltır)
  const silo = { x: r(212), y: rd(96), w: r(72), h: rd(84), agizY: rd(158), cx: r(248) }
  const depo = { x: silo.x - r(4), y: silo.y - rd(6), w: silo.w + r(8), h: YOL_Y + rd(10) - silo.y + rd(6) }
  const satis = { x: 0, y: rd(104), w: r(132), h: YOL_Y + rd(10) - rd(104), huniX: r(106), huniY: rd(152) }
  const KABIN_H = rd(82)
  const KABIN_YUKLEME_ALT = rd(108)                    // boşaltırken kabin tabanı (silonun ağzının üstünde)
  const makaraY = rd(16)                               // kuyu kulesinin makarası

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
      return { x: kuyuX, y: 0, w: kuyuG, h: alt }
    }
    if (istasyon === 'depo') return { x: depo.x, y: depo.y, w: depo.w, h: depo.h }
    if (istasyon === 'satis') return { x: satis.x, y: satis.y, w: satis.w, h: satis.h }
    if (typeof istasyon === 'string' && istasyon[0] === 'm') {
      const i = +istasyon.slice(1)
      if (!(i >= 0 && i < MAKS_MADEN)) return null
      return { x: odaX, y: satirY(i) + ODA_UST, w: odaG, h: ZEMIN_Y - ODA_UST + r(20) }
    }
    return null
  }

  // Dondurulmaz: tüketiciler nesneye kendi işaretini ekleyebilir.
  const y = {
    W, k, r, rd, kenar, kartG, odaX, odaG, kuyuX, kuyuG, tupX, tupG, okX, okY, okG, okH, depo, silo, satis,
    SATIR_H, KART_H, KART_UST, TEPE_H, YUZEY_H, YOL_Y, ODA_UST, ZEMIN_Y, KABIN_H, DUNYA_H,
    satirY, ilkKatY, makaraY, dunyaH, istasyonKutusu, ustSinir, kabinAltY,
  }
  onbellek.set(W, y)
  return y
}

// Geriye uyumluluk: tek genişlik bilinmeden çağrılanlar (390 varsayılır)
export const ustSinir = (acik, W = 390) => yerlesim(W).ustSinir(acik)
