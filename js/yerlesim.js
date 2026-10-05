// Dünya yerleşimi (§4.3, görsel yön 2). Saf modül: DOM yok, yan etki yok.
// Sahne ve arayüz aynı sayıları buradan okur; böylece kanvas ile DOM kartları birebir hizalanır.
//
// Görsel yön 2 (ikinci referans): katlar alttan üste dizilir. En altta "1. Kat Yükleme" (depo ve vagon),
// onun üstünde Maden 1 ("2. Kat"), en üstte en yeni maden. Yerler sabittir (12 maden yuvası); açılmamış
// yuvalar kaya olarak çizilir ve kaydırmanın üst sınırı sonraki (kilitli) katın biraz üstündedir.
// Asansör konumu: 0 = yükleme katındaki boşaltma noktası, k = Maden k'nın zemini (yukarı doğru).

export const MAKS_MADEN = 12
export const SATIR_H = 112           // bir maden katı
export const KART_H = 92
export const KART_UST = 10
export const TEPE_H = 64             // en üst yuvanın üstündeki kaya
export const YUKLEME_H = 140         // yükleme katı (en alt)
export const ODA_UST = 6             // oda (galeri) satır içi üst
export const ODA_H = 90
export const ZEMIN_Y = 96            // satır içi zemin (döşeme üstü)
export const YUKLEME_ZEMIN = 112     // yükleme katı içi zemin (raylar)

const sinirla = (v, a, b) => (v < a ? a : v > b ? b : v)

// Maden i'nin (0 tabanlı) satır üstü
export const satirY = (i) => TEPE_H + (MAKS_MADEN - 1 - i) * SATIR_H
export const yuklemeY = TEPE_H + MAKS_MADEN * SATIR_H
export const DUNYA_H = yuklemeY + YUKLEME_H

// Kabinin alt kenarının dünya y'si (konum yukarı doğru artar; katlar arası doğrusal)
export const KABIN_YUKLEME_ALT = yuklemeY + 66
export function kabinAltY(konum) {
  if (!(konum > 0)) return KABIN_YUKLEME_ALT
  if (konum <= 1) return KABIN_YUKLEME_ALT + (satirY(0) + ZEMIN_Y - KABIN_YUKLEME_ALT) * konum
  return satirY(0) + ZEMIN_Y - (konum - 1) * SATIR_H
}

// Kaydırmanın üst sınırı: sonraki (kilitli) katın ya da en üst katın biraz üstü
export function ustSinir(acik) {
  const ust = Math.min(acik, MAKS_MADEN - 1)
  return Math.max(0, satirY(ust) - (acik >= MAKS_MADEN ? TEPE_H : 28))
}

const onbellek = new Map()

export function yerlesim(W) {
  W = Math.round(W) || 390
  const hazir = onbellek.get(W)
  if (hazir) return hazir
  const kenar = W >= 420 ? 10 : 8
  const kartG = sinirla(Math.round(0.27 * W), 96, 132)
  const bosluk = 4
  const kuyuG = W < 375 ? 46 : (W >= 440 ? 58 : 50)
  const sagPay = W >= 420 ? 12 : 8
  const odaX = kenar + kartG + bosluk
  const kuyuX = W - sagPay - kuyuG
  const odaG = kuyuX - odaX
  // Yükleme katı: depo sağda (kuyunun altı), vagon rayları boydan boya
  const depoX = Math.round(W * 0.6)
  const depo = { x: depoX, y: yuklemeY + 4, w: W - depoX - 2, h: YUKLEME_ZEMIN - 4 }

  const dunyaH = () => DUNYA_H

  // İstasyon kutuları (dünya koordinatı). Dokunma hedefleri ve ekran çapaları bunlardan türer.
  function istasyonKutusu(istasyon, acik) {
    if (istasyon === 'asansor') {
      const ust = acik > 0 ? satirY(acik - 1) : yuklemeY
      return { x: kuyuX, y: ust, w: kuyuG, h: yuklemeY + 70 - ust }
    }
    if (istasyon === 'depo') return { x: depo.x, y: depo.y, w: depo.w, h: depo.h }
    if (istasyon === 'satis') return { x: 0, y: yuklemeY + 50, w: 40, h: YUKLEME_ZEMIN - 50 }
    if (typeof istasyon === 'string' && istasyon[0] === 'm') {
      const i = +istasyon.slice(1)
      if (!(i >= 0 && i < MAKS_MADEN)) return null
      return { x: odaX, y: satirY(i) + ODA_UST, w: odaG, h: ODA_H }
    }
    return null
  }

  // Dondurulmaz: tüketiciler nesneye kendi işaretini ekleyebilir.
  const y = {
    W, kenar, kartG, bosluk, odaX, odaG, kuyuX, kuyuG, sagPay, depo,
    SATIR_H, KART_H, KART_UST, TEPE_H, YUKLEME_H, ODA_UST, ODA_H, ZEMIN_Y, YUKLEME_ZEMIN,
    satirY, yuklemeY, dunyaH, istasyonKutusu, ustSinir, kabinAltY,
  }
  onbellek.set(W, y)
  return y
}
