// Paket C önizleme taslağı: js/yerlesim.js (B) gelene kadar §4.3'ün birebir kopyası.
export const YUZEY_H = 128, SATIR_H = 128, KART_H = 116, BITIS_H = 96
const sinir = (a, x, b) => Math.max(a, Math.min(b, x))
export function yerlesim(W) {
  const kenar = W >= 420 ? 12 : 8
  const kartG = sinir(148, Math.round(0.41 * W), 196)
  const bosluk = 6
  const kuyuG = W < 375 ? 36 : (W >= 440 ? 44 : 38)
  const sagG = sinir(46, Math.round(0.13 * W), 62)
  const odaX = kenar + kartG + bosluk
  const odaG = W - odaX - kuyuG - sagG
  const kuyuX = odaX + odaG, sagX = kuyuX + kuyuG
  const satirY = (i) => YUZEY_H + i * SATIR_H
  const dunyaH = (acik) => YUZEY_H + (acik + (acik < 12 ? 1 : 0)) * SATIR_H + BITIS_H
  function istasyonKutusu(ist, acik) {
    if (ist === 'asansor') return { x: kuyuX, y: YUZEY_H - 24, w: kuyuG, h: acik * SATIR_H + 24 }
    if (ist === 'depo') return { x: sagX - 8, y: YUZEY_H - 22, w: W - sagX + 8, h: 126 }
    const i = +String(ist).slice(1)
    return { x: odaX, y: satirY(i) + 8, w: odaG, h: 112 }
  }
  return { W, kenar, kartG, bosluk, odaX, odaG, kuyuX, kuyuG, sagX, sagG, satirY, dunyaH, istasyonKutusu, YUZEY_H, SATIR_H, KART_H, BITIS_H }
}
export default yerlesim
