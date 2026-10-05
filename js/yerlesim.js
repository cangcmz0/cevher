// Dünya yerleşimi (§4.3). Saf modül: DOM yok, yan etki yok.
// Sahne (B) ve arayüz (C) aynı sayıları buradan okur; böylece kanvas ile DOM kartları birebir hizalanır.

export const YUZEY_H = 128
export const SATIR_H = 128
export const KART_H = 116
export const KART_UST = 6
export const BITIS_H = 96
export const MAKS_MADEN = 12

// Odanın (kazı galerisi) satır içindeki dikey konumu
export const ODA_UST = 8
export const ODA_H = 112
export const ZEMIN_Y = 100   // oda tabanı (döşeme) satır içi y

const sinirla = (v, a, b) => (v < a ? a : v > b ? b : v)

export const satirY = (i) => YUZEY_H + i * SATIR_H

// Kabinin alt kenarının dünya y'si. konum 0 = DEPO boşaltma noktası (yüzeyin hemen altı, huninin yanı),
// konum k = Maden k'nın döşemesi. 0..1 arası daha kısa bir yol (yüzeyden ilk kata).
export const KABIN_UST_ALT = 150
export function kabinAltY(konum) {
  if (konum <= 1) return KABIN_UST_ALT + (satirY(0) + ZEMIN_Y - KABIN_UST_ALT) * (konum < 0 ? 0 : konum)
  return satirY(0) + ZEMIN_Y + (konum - 1) * SATIR_H
}

const onbellek = new Map()

export function yerlesim(W) {
  W = Math.round(W) || 390
  const hazir = onbellek.get(W)
  if (hazir) return hazir
  const kenar = W >= 420 ? 12 : 8
  const kartG = sinirla(Math.round(0.41 * W), 148, 196)
  const bosluk = 6
  const kuyuG = W < 375 ? 36 : (W >= 440 ? 44 : 38)
  const sagG = sinirla(Math.round(0.13 * W), 46, 62)
  const odaX = kenar + kartG + bosluk
  const odaG = W - odaX - kuyuG - sagG
  const kuyuX = odaX + odaG
  const sagX = kuyuX + kuyuG

  const dunyaH = (acik) => YUZEY_H + (acik + (acik < MAKS_MADEN ? 1 : 0)) * SATIR_H + BITIS_H

  // İstasyon kutuları (dünya koordinatı). Dokunma hedefleri ve ekran çapaları bunlardan türer.
  function istasyonKutusu(istasyon, acik) {
    if (istasyon === 'asansor') {
      const alt = acik > 0 ? satirY(acik - 1) + SATIR_H : YUZEY_H
      return { x: kuyuX, y: 18, w: kuyuG, h: alt - 18 }
    }
    if (istasyon === 'depo') return { x: sagX - 8, y: YUZEY_H - 22, w: W - (sagX - 8), h: 126 }
    if (istasyon === 'satis') return { x: sagX - 18, y: 64, w: W - (sagX - 18), h: 40 }
    if (typeof istasyon === 'string' && istasyon[0] === 'm') {
      const i = +istasyon.slice(1)
      if (!(i >= 0 && i < MAKS_MADEN)) return null
      return { x: odaX, y: satirY(i) + ODA_UST, w: odaG, h: ODA_H }
    }
    return null
  }

  // Dondurulmaz: tüketiciler (ana.js) nesneye kendi işaretini ekleyebilir.
  const y = {
    W, kenar, kartG, bosluk, odaX, odaG, kuyuX, kuyuG, sagX, sagG,
    YUZEY_H, SATIR_H, KART_H, KART_UST, BITIS_H,
    satirY, dunyaH, istasyonKutusu,
  }
  onbellek.set(W, y)
  return y
}
