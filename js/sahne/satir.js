// Maden katları (görsel yön 2): koyu mağara, ahşap çerçeveli geniş galeri, fenerler, cam tüp asansör,
// açılmamış yuvalar (kaya), kilitli kat (KAZI tabelası), en üstte kaya tepe ve en altta yükleme katı
// (depo binası, raylar). Arabalar, yığınlar, kabin ve vagonlar ayrı sprite'lardır.
// Hepsi fırınlanır; 8 tohumlu kat çeşidi döngüyle kullanılır (kat başına değil).

import { Varliklar } from './varliklar.js'
import { palet } from './bolgeler.js'
import {
  dikey, yatay, radyal, elips, yuvarlakYol, cokgen, topakYol, kenarIsik, icGolge, dokuKapla, golgeli,
  acik, koyu, rgba, rastgele, kalas, civata, komurYigini, cizgi,
} from './cizim.js'
import { yerlesim, SATIR_H, TEPE_H, YUKLEME_H, ODA_UST, ODA_H, ZEMIN_Y, YUKLEME_ZEMIN, yuklemeY, KABIN_YUKLEME_ALT } from '../yerlesim.js'

export const KAT_CESIT = 8
export const KABIN_H = 40
export const ARABA_W = 34
export const ARABA_H = 18
export const YIGIN_W = 30
export const YIGIN_H = 14
export const FENER_Y = 22
export const LOKO_W = 40
export const LOKO_H = 26
export const VAGON_W = 32
export const VAGON_H = 20

export const kabinG = (kuyuG) => kuyuG - 12

const KAYA = ['#4A3424', '#3A281C', '#2A1C13', '#1C130D']

// ---- Kaya zemini ----
function kaya(ctx, W, H, r, koyuluk = 0) {
  ctx.fillStyle = dikey(ctx, 0, H, [koyu(KAYA[0], koyuluk), koyu(KAYA[1], koyuluk), koyu(KAYA[2], koyuluk)])
  ctx.fillRect(0, 0, W, H)
  // Hafif dalgalı katmanlar
  for (let j = 0; j < 3; j++) {
    const y0 = 10 + j * 34 + r() * 14
    const kalin = 8 + r() * 12
    const f = 0.015 + r() * 0.02, ph = r() * 9
    const yol = new Path2D()
    yol.moveTo(0, y0)
    for (let x = 0; x <= W + 8; x += 8) yol.lineTo(x, y0 + Math.sin(x * f + ph) * 3)
    for (let x = W + 8; x >= 0; x -= 8) yol.lineTo(x, y0 + kalin + Math.sin(x * f + ph + 1) * 2.4)
    yol.closePath()
    ctx.fillStyle = rgba(j % 2 ? '#5A3E2A' : '#24180F', 0.35 + r() * 0.2)
    ctx.fill(yol)
  }
  // Kaya blokları (köşeli, kenar ışıklı)
  for (let i = 0; i < W * H / 360; i++) {
    const x = r() * W, y = r() * H, s = 2.5 + r() * 6
    const yol = topakYol(x, y, s * 1.35, s, r, 6, 0.45)
    const c = r() < 0.5 ? '#5A402C' : '#33231A'
    ctx.fillStyle = dikey(ctx, y - s, y + s, [koyu(acik(c, 0.08), koyuluk), koyu(c, koyuluk + 0.1)])
    ctx.fill(yol)
    kenarIsik(ctx, yol, '#E8B880', 0.7, 0.22)
  }
  dokuKapla(ctx, 0, 0, W, H, 'gurultu', 0.2, 'multiply', r() * 200, r() * 200)
  dokuKapla(ctx, 0, 0, W, H, 'tane', 0.08, 'multiply')
}

// Kayaya gömülü cevher parçaları
function gomuluCevher(ctx, x0, y0, w, h, r, p, adet) {
  for (let i = 0; i < adet; i++) {
    const x = x0 + r() * w, y = y0 + r() * h, s = 2.4 + r() * 3.6
    const yol = topakYol(x, y, s * 1.2, s, r, 6, 0.5)
    ctx.fillStyle = dikey(ctx, y - s, y + s, ['#454E55', p.cevher, '#0C0E10'])
    ctx.fill(yol)
    kenarIsik(ctx, yol, p.cevherIsik, 0.7, 0.7)
    if (r() < 0.5) { ctx.fillStyle = rgba('#E6F2FA', 0.9); ctx.fillRect(x - s * 0.3, y - s * 0.4, 0.8, 0.8) }
  }
}

// ---- Galeri ----
function galeri(ctx, y, r, p) {
  const x0 = y.odaX, x1 = y.kuyuX, g = x1 - x0
  const ust = ODA_UST + 4, alt = ZEMIN_Y
  // Oyuk (düzensiz tavan)
  const oda = new Path2D()
  oda.moveTo(x0, alt)
  oda.lineTo(x0, ust + 6)
  for (let x = x0 + 6; x < x1 - 6; x += 9) oda.lineTo(x, ust - 2 + r() * 5)
  oda.lineTo(x1, ust + 6)
  oda.lineTo(x1, alt)
  oda.closePath()
  golgeli(ctx, 10, 'rgba(0,0,0,.75)', 0, () => { ctx.fillStyle = '#1A110B'; ctx.fill(oda) })
  ctx.save()
  ctx.clip(oda)
  ctx.fillStyle = dikey(ctx, ust, alt, ['#2A1B12', '#3A2618', '#2C1C12'])
  ctx.fillRect(x0, ust - 4, g, alt - ust + 4)
  // Arka duvar kaya blokları
  for (let i = 0; i < g * 0.28; i++) {
    const x = x0 + r() * g, yy = ust + 4 + r() * (alt - ust - 10), s = 4 + r() * 9
    const tas = topakYol(x, yy, s * 1.3, s, r, 7, 0.35)
    ctx.fillStyle = rgba(r() < 0.5 ? '#4A3020' : '#22160E', 0.8)
    ctx.fill(tas)
    kenarIsik(ctx, tas, '#FFC873', 0.8, 0.22)
  }
  gomuluCevher(ctx, x0 + 6, ust + 8, g * 0.25, 46, r, p, 7)
  gomuluCevher(ctx, x1 - g * 0.22 - 6, ust + 6, g * 0.22, 46, r, p, 6)
  dokuKapla(ctx, x0, ust - 4, g, alt - ust + 4, 'gurultu', 0.24, 'multiply')
  // Sıcak ışık
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = radyal(ctx, x0 + g * 0.5, alt - 8, g * 0.6, [rgba(p.kandil, 0.24), rgba(p.kandil, 0.08), rgba(p.kandil, 0)])
  ctx.fillRect(x0, ust - 4, g, alt - ust + 4)
  for (const fx of [0.3, 0.7]) {
    ctx.fillStyle = radyal(ctx, x0 + g * fx, FENER_Y + 6, 40, [rgba(p.kandil, 0.26), rgba(p.kandil, 0)])
    ctx.fillRect(x0, ust - 4, g, alt - ust + 4)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
  // Zemindeki cevher yığınları (duvar diplerinde)
  komurYigini(ctx, x0 + 18, alt - 0.5, 22, 7, r, p.cevher, p.cevherIsik, 16)
  komurYigini(ctx, x1 - 26, alt - 0.5, 20, 6, r, p.cevher, p.cevherIsik, 14)
  // Ahşap çerçeve: dikmeler, lento, payandalar
  const dk = 7
  kalas(ctx, x0, ust - 2, dk, alt - ust + 2, r, p.kereste[0], p.kereste[1], false)
  kalas(ctx, x1 - dk, ust - 2, dk, alt - ust + 2, r, p.kereste[0], p.kereste[1], false)
  kalas(ctx, x0 + g * 0.5 - 3, ust - 2, 6, 18, r, p.kereste[0], p.kereste[1], false)
  golgeli(ctx, 6, 'rgba(0,0,0,.6)', 2, () => kalas(ctx, x0 - 4, ust - 6, g + 8, 9, r, p.kereste[0], p.kereste[1], true))
  const pay = (ax, ay, bx, by) => {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = p.kereste[1]; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
    ctx.strokeStyle = rgba('#FFE2B0', 0.28); ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(ax, ay - 1); ctx.lineTo(bx, by - 1); ctx.stroke()
    ctx.restore()
  }
  pay(x0 + dk, ust + 16, x0 + dk + 16, ust + 2)
  pay(x1 - dk, ust + 16, x1 - dk - 16, ust + 2)
  for (const bx of [x0 + 3.5, x1 - 3.5]) { civata(ctx, bx, ust + 1); civata(ctx, bx, alt - 8) }
  // Fener kafesleri (ışıkları kare başına)
  for (const fx of [0.3, 0.7]) {
    const x = x0 + g * fx
    ctx.strokeStyle = '#1C1E21'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(x, ust + 2); ctx.lineTo(x, FENER_Y - 4); ctx.stroke()
    ctx.fillStyle = '#2A2E33'
    ctx.fillRect(x - 3, FENER_Y - 5, 6, 1.6)
    ctx.fillRect(x - 3, FENER_Y + 4, 6, 1.6)
    ctx.fillStyle = radyal(ctx, x, FENER_Y, 4.5, ['#FFFFFF', p.kandil, '#D99A2B'])
    ctx.fill(yuvarlakYol(x - 2.4, FENER_Y - 3.6, 4.8, 7.8, 1.4))
    ctx.strokeStyle = '#2A2E33'; ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(x, FENER_Y - 3.6); ctx.lineTo(x, FENER_Y + 4); ctx.stroke()
  }
}

// Kat döşemesi (katları ayıran kalın kiriş + raylar)
function doseme(ctx, W, r, p, y0, h, rayX0, rayX1) {
  golgeli(ctx, 6, 'rgba(0,0,0,.7)', 2, () => {
    ctx.fillStyle = p.kereste[1]
    ctx.fillRect(0, y0, W, h)
  })
  for (let x = 0; x < W; x += 26) kalas(ctx, x, y0, Math.min(26, W - x), h - 3, r, p.kereste[0], p.kereste[1], true)
  ctx.fillStyle = rgba('#000000', 0.45)
  ctx.fillRect(0, y0 + h - 3, W, 3)
  ctx.fillStyle = rgba('#FFE2B0', 0.25)
  ctx.fillRect(0, y0, W, 1)
  if (rayX1 > rayX0) {
    for (const ry of [y0 - 1.5, y0 + 2]) {
      ctx.fillStyle = dikey(ctx, ry - 1, ry + 1, [p.celik[0], p.celik[1]])
      ctx.fillRect(rayX0, ry - 0.8, rayX1 - rayX0, 1.6)
    }
  }
}

// ---- Cam tüp asansör kuyusu ----
function kuyu(ctx, y, r, p, H, okY) {
  const x = y.kuyuX, g = y.kuyuG
  // Arka: koyu tüp
  ctx.fillStyle = yatay(ctx, x, x + g, ['#0B1418', '#12232A', '#0E1B21', '#081013'])
  ctx.fillRect(x, 0, g, H)
  // İç merdiven
  ctx.strokeStyle = rgba('#3E7D86', 0.35)
  ctx.lineWidth = 1
  const mx0 = x + g * 0.32, mx1 = x + g * 0.68
  ctx.beginPath(); ctx.moveTo(mx0, 0); ctx.lineTo(mx0, H); ctx.moveTo(mx1, 0); ctx.lineTo(mx1, H); ctx.stroke()
  for (let yy = 4; yy < H; yy += 9) { ctx.beginPath(); ctx.moveTo(mx0, yy); ctx.lineTo(mx1, yy); ctx.stroke() }
  // Yeşil yukarı ok işaretleri
  if (okY !== null) {
    const ox = x + g / 2
    for (let k = 0; k < 2; k++) {
      const oy = okY + k * 10
      ctx.fillStyle = rgba('#2ECC71', 0.85 - k * 0.3)
      ctx.fill(cokgen([ox, oy - 5, ox + 7, oy + 2, ox + 4, oy + 2, ox, oy - 2, ox - 4, oy + 2, ox - 7, oy + 2]))
    }
  }
  // Cam yansıması
  ctx.fillStyle = yatay(ctx, x, x + g, [rgba('#BFE6F2', 0.10), rgba('#BFE6F2', 0.02), rgba('#BFE6F2', 0), rgba('#BFE6F2', 0.08)])
  ctx.fillRect(x + 3, 0, g - 6, H)
  ctx.fillStyle = rgba('#DFF5FA', 0.16)
  ctx.fillRect(x + 6, 0, 2, H)
  // Çelik çerçeve
  for (const rx of [x, x + g - 4]) {
    ctx.fillStyle = yatay(ctx, rx, rx + 4, ['#6E7A86', '#C9D1D8', '#56616C'])
    ctx.fillRect(rx, 0, 4, H)
    for (let yy = 10; yy < H; yy += 28) civata(ctx, rx + 2, yy, 0.9)
  }
}

// Kat bileziği (kuyuda kat seviyesindeki çelik halka)
function bilezik(ctx, y, yy) {
  ctx.fillStyle = dikey(ctx, yy, yy + 6, ['#C9D1D8', '#8C98A4', '#3A3E44'])
  ctx.fillRect(y.kuyuX - 2, yy, y.kuyuG + 4, 6)
  ctx.fillStyle = rgba('#000000', 0.4)
  ctx.fillRect(y.kuyuX - 2, yy + 6, y.kuyuG + 4, 1.5)
}

// Sağ pay (kuyunun sağı)
function sagPay(ctx, y, W, H, r) {
  const x = y.kuyuX + y.kuyuG
  if (W - x < 2) return
  ctx.fillStyle = dikey(ctx, 0, H, ['#2A1C13', '#1C130D'])
  ctx.fillRect(x, 0, W - x, H)
  ctx.fillStyle = rgba('#000000', 0.35)
  ctx.fillRect(x, 0, 2, H)
}

function katCiz(cesit) {
  return (ctx, W, H) => {
    const p = palet('zonguldak')
    const r = rastgele(p.tohum * 31 + cesit * 977)
    const y = yerlesim(W)
    kaya(ctx, W, H, r)
    galeri(ctx, y, r, p)
    doseme(ctx, W, r, p, ZEMIN_Y, H - ZEMIN_Y, y.odaX, y.kuyuX)
    kuyu(ctx, y, r, p, H, 40)
    bilezik(ctx, y, ZEMIN_Y - 2)
    sagPay(ctx, y, W, H, r)
  }
}

function kayaKatCiz(cesit) {
  return (ctx, W, H) => {
    const r = rastgele(5150 + cesit * 77)
    kaya(ctx, W, H, r, 0.12)
    const p = palet('zonguldak')
    gomuluCevher(ctx, 0, 10, W, H - 20, r, p, 6)
    ctx.fillStyle = rgba('#000000', 0.25)
    ctx.fillRect(0, H - 2, W, 2)
  }
}

function kilitliCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(p.tohum * 7 + 3)
  const y = yerlesim(W)
  kaya(ctx, W, H, r, 0.06)
  // Kazılmamış oda çatlakları
  ctx.save()
  ctx.setLineDash([5, 4])
  ctx.strokeStyle = rgba('#0C0805', 0.6)
  ctx.lineWidth = 1.4
  ctx.strokeRect(y.odaX + 4, ODA_UST + 6, y.odaG - 8, ZEMIN_Y - ODA_UST - 8)
  ctx.restore()
  ctx.strokeStyle = rgba('#0C0805', 0.6)
  ctx.lineWidth = 1
  for (let k = 0; k < 7; k++) {
    let cx = y.odaX + 14 + r() * (y.odaG - 28), cy = ODA_UST + 14 + r() * 60
    ctx.beginPath(); ctx.moveTo(cx, cy)
    for (let j = 0; j < 4; j++) { cx += (r() - 0.5) * 16; cy += (r() - 0.3) * 10; ctx.lineTo(cx, cy) }
    ctx.stroke()
  }
  // KAZI tabelası
  const tx = y.odaX + y.odaG / 2, ty = 40
  for (const dx of [-16, 13]) kalas(ctx, tx + dx, ty, 3, ZEMIN_Y - ty, r, p.kereste[0], p.kereste[1], false)
  golgeli(ctx, 6, 'rgba(0,0,0,.6)', 2, () => kalas(ctx, tx - 24, ty - 9, 48, 20, r, p.kereste[0], p.kereste[1], true))
  ctx.fillStyle = '#F6C453'
  ctx.font = '800 12px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('KAZI', tx, ty + 1.8)
  // Yaslanmış kazma
  cizgi(ctx, tx + 26, ZEMIN_Y, tx + 34, ZEMIN_Y - 28, 1.8, p.kereste[0])
  ctx.strokeStyle = p.celik[0]
  ctx.lineWidth = 2.2
  ctx.beginPath(); ctx.moveTo(tx + 27, ZEMIN_Y - 30); ctx.quadraticCurveTo(tx + 34, ZEMIN_Y - 29, tx + 40, ZEMIN_Y - 23); ctx.stroke()
  doseme(ctx, W, r, p, ZEMIN_Y, H - ZEMIN_Y, 0, 0)
  // Kuyu bu katta henüz yok: kesik çizgili tavan
  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.strokeStyle = rgba('#000000', 0.45)
  ctx.lineWidth = 1
  ctx.strokeRect(y.kuyuX + 1.5, 40, y.kuyuG - 3, ZEMIN_Y - 40)
  ctx.restore()
  sagPay(ctx, y, W, H, r)
}

function tepeCiz(ctx, W, H) {
  const r = rastgele(8080)
  kaya(ctx, W, H, r, 0.25)
  ctx.fillStyle = dikey(ctx, 0, H, ['#07161C', rgba('#07161C', 0)])
  ctx.fillRect(0, 0, W, H)
  // Kökler
  ctx.strokeStyle = rgba('#5A3E2A', 0.6)
  ctx.lineWidth = 1.2
  for (let k = 0; k < 7; k++) {
    let x = r() * W, yy = 0
    ctx.beginPath(); ctx.moveTo(x, yy)
    for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 12; yy += 4 + r() * 6; ctx.lineTo(x, yy) }
    ctx.stroke()
  }
}

// ---- Yükleme katı (en alt): tünel ağzı, raylar, depo binası ----
export function depoKapiX(W) { return yerlesim(W).depo.x - 6 }
export const RAY_Y = YUKLEME_ZEMIN       // yükleme katı içinde

function yuklemeCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(2468)
  const y = yerlesim(W)
  kaya(ctx, W, H, r, 0.05)
  // Büyük tünel (yükleme alanı)
  const t0 = 10, t1 = YUKLEME_ZEMIN
  const tunel = new Path2D()
  tunel.moveTo(0, t1)
  tunel.lineTo(0, t0 + 14)
  tunel.quadraticCurveTo(W * 0.02, t0, W * 0.12, t0)
  tunel.lineTo(W - 4, t0)
  tunel.lineTo(W - 4, t1)
  tunel.closePath()
  golgeli(ctx, 10, 'rgba(0,0,0,.75)', 0, () => { ctx.fillStyle = '#1A110B'; ctx.fill(tunel) })
  ctx.save()
  ctx.clip(tunel)
  ctx.fillStyle = dikey(ctx, t0, t1, ['#24170F', '#3A2618', '#2A1B12'])
  ctx.fillRect(0, t0, W, t1 - t0)
  for (let i = 0; i < W * 0.3; i++) {
    const x = r() * W, yy = t0 + 6 + r() * (t1 - t0 - 14), s = 4 + r() * 9
    const tas = topakYol(x, yy, s * 1.3, s, r, 7, 0.35)
    ctx.fillStyle = rgba(r() < 0.5 ? '#4A3020' : '#22160E', 0.75)
    ctx.fill(tas)
    kenarIsik(ctx, tas, '#FFC873', 0.8, 0.2)
  }
  dokuKapla(ctx, 0, t0, W, t1 - t0, 'gurultu', 0.22, 'multiply')
  ctx.globalCompositeOperation = 'lighter'
  for (const fx of [0.12, 0.38]) {
    ctx.fillStyle = radyal(ctx, W * fx, t0 + 20, 70, [rgba(p.kandil, 0.3), rgba(p.kandil, 0)])
    ctx.fillRect(0, t0, W, t1 - t0)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
  // Ahşap destek kemerleri
  for (const bx of [W * 0.04, W * 0.3]) {
    kalas(ctx, bx, t0 - 2, 7, t1 - t0 + 2, r, p.kereste[0], p.kereste[1], false)
  }
  golgeli(ctx, 6, 'rgba(0,0,0,.6)', 2, () => kalas(ctx, 0, t0 - 4, y.depo.x + 4, 9, r, p.kereste[0], p.kereste[1], true))
  // Fenerler
  for (const fx of [0.12, 0.38]) {
    const x = W * fx
    ctx.strokeStyle = '#1C1E21'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(x, t0 + 4); ctx.lineTo(x, t0 + 14); ctx.stroke()
    ctx.fillStyle = radyal(ctx, x, t0 + 19, 4.5, ['#FFFFFF', p.kandil, '#D99A2B'])
    ctx.fill(yuvarlakYol(x - 2.4, t0 + 14.6, 4.8, 7.8, 1.4))
  }
  // Sol duvar dibinde cevher yığınları
  komurYigini(ctx, W * 0.16, t1 - 1, 40, 14, r, p.cevher, p.cevherIsik, 50)
  komurYigini(ctx, W * 0.42, t1 - 1, 26, 8, r, p.cevher, p.cevherIsik, 24)
  // Kuyu: yükleme katının üstünden boşaltma noktasına kadar, huni ile biter
  const kx = y.kuyuX, kg = y.kuyuG
  const kuyuAlt = KABIN_YUKLEME_ALT - yuklemeY + 4
  ctx.save()
  ctx.beginPath(); ctx.rect(kx, 0, kg, kuyuAlt); ctx.clip()
  kuyu(ctx, y, r, p, kuyuAlt, null)
  ctx.restore()
  bilezik(ctx, y, kuyuAlt - 4)
  // Depo binası
  const d = y.depo
  const dx = d.x, dy = d.y - yuklemeY, dw = d.w, dh = d.h
  const govde = yuvarlakYol(dx, dy + 22, dw, dh - 22, 3)
  golgeli(ctx, 10, 'rgba(0,0,0,.6)', 3, () => { ctx.fillStyle = p.kereste[1]; ctx.fill(govde) })
  ctx.save()
  ctx.clip(govde)
  for (let x = dx; x < dx + dw; x += 8) kalas(ctx, x, dy + 22, Math.min(8, dx + dw - x), dh - 22, r, p.kereste[0], p.kereste[1], false)
  ctx.restore()
  // Açık ön (yığın burada görünür)
  const on = yuvarlakYol(dx + 8, dy + 46, dw - 16, dh - 50, 4)
  ctx.fillStyle = dikey(ctx, dy + 46, dy + dh, ['#120B07', '#2A1B12'])
  ctx.fill(on)
  icGolge(ctx, on, '#000000', 2, 0.55)
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = radyal(ctx, dx + dw * 0.5, dy + 60, 40, [rgba(p.kandil, 0.3), rgba(p.kandil, 0)])
  ctx.fillRect(dx, dy + 46, dw, dh - 46)
  ctx.globalCompositeOperation = 'source-over'
  // Çatı
  const cati = cokgen([dx - 6, dy + 24, dx + dw * 0.45, dy + 2, dx + dw + 4, dy + 24])
  ctx.fillStyle = dikey(ctx, dy + 2, dy + 24, [acik(p.depoCati, 0.12), p.depoCati, koyu(p.depoCati, 0.3)])
  ctx.fill(cati)
  kenarIsik(ctx, cati, '#FFB8A0', 1, 0.45)
  ctx.fillStyle = rgba('#000000', 0.35)
  ctx.fillRect(dx - 4, dy + 23, dw + 8, 2)
  // DEPO levhası
  const lw = Math.min(54, dw - 16), lx = dx + (dw - lw) / 2, ly = dy + 28, lh = 13
  golgeli(ctx, 4, 'rgba(0,0,0,.5)', 1, () => {
    ctx.fillStyle = dikey(ctx, ly, ly + lh, ['#FFE08A', '#F6C453', '#D99A2B'])
    ctx.fill(yuvarlakYol(lx, ly, lw, lh, 2))
  })
  ctx.strokeStyle = '#7A4A10'; ctx.lineWidth = 0.8
  ctx.stroke(yuvarlakYol(lx, ly, lw, lh, 2))
  ctx.fillStyle = '#2B1D12'
  ctx.font = '800 11px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('DEPO', lx + lw / 2, ly + lh / 2 + 1)
  // Huni (kuyudan depoya)
  const hx = kx + kg / 2
  const huni = cokgen([hx - 12, kuyuAlt + 2, hx + 12, kuyuAlt + 2, hx + 5, kuyuAlt + 12, hx - 5, kuyuAlt + 12])
  ctx.fillStyle = dikey(ctx, kuyuAlt, kuyuAlt + 12, [p.celik[1], p.celik[0], '#3A3E44'])
  ctx.fill(huni)
  kenarIsik(ctx, huni, '#FFFFFF', 0.8, 0.5)
  // Raylar ve traversler (boydan boya)
  ctx.fillStyle = dikey(ctx, t1, H, ['#2A1C13', '#140D08'])
  ctx.fillRect(0, t1, W, H - t1)
  for (let x = 2; x < W; x += 10) {
    ctx.fillStyle = dikey(ctx, t1 + 1, t1 + 6, ['#7A5232', '#4A2E1C'])
    ctx.fillRect(x, t1 + 1, 6, 5)
  }
  for (const ry of [t1 - 0.5, t1 + 3.5]) {
    ctx.fillStyle = dikey(ctx, ry - 1, ry + 1, ['#E6ECF0', '#8C98A4'])
    ctx.fillRect(0, ry - 0.9, W, 1.8)
  }
  dokuKapla(ctx, 0, t1 + 6, W, H - t1 - 6, 'gurultu', 0.25, 'multiply')
}

// ---- Arabalar, yığınlar, kabin, vagonlar ----
function arabaCiz(ctx, x, yTaban, renk, kenar) {
  const ust = yTaban - ARABA_H + 3
  const g = new Path2D()
  g.moveTo(x, ust); g.lineTo(x + ARABA_W, ust); g.lineTo(x + ARABA_W - 3, yTaban - 5); g.lineTo(x + 3, yTaban - 5); g.closePath()
  ctx.fillStyle = dikey(ctx, ust, yTaban - 5, renk)
  ctx.fill(g)
  kenarIsik(ctx, g, '#FFFFFF', 0.9, 0.45)
  ctx.strokeStyle = kenar; ctx.lineWidth = 0.9
  ctx.stroke(g)
  ctx.fillStyle = rgba('#000000', 0.25)
  ctx.fillRect(x + 4, ust + 5, ARABA_W - 8, 1.2)
  for (const bx of [x + 4, x + ARABA_W - 4]) civata(ctx, bx, ust + 2.8, 1)
  for (const wx of [x + 8, x + ARABA_W - 8]) {
    ctx.fillStyle = '#1C1E21'
    ctx.fill(elips(wx, yTaban - 3.2, 3.4, 3.4))
    ctx.fillStyle = '#A9B4BE'
    ctx.fill(elips(wx, yTaban - 3.2, 1.2, 1.2))
  }
}

function yiginCiz(seviye) {
  return (ctx, w, h) => {
    const p = palet('zonguldak')
    const r = rastgele(600 + seviye * 17)
    const yuk = [0, 4, 7, 10, 13][seviye]
    komurYigini(ctx, w / 2, h, w * (0.7 + seviye * 0.07), yuk, r, p.cevher, p.cevherIsik, 12 + seviye * 12)
  }
}

function doluEtiket(ctx, w, h) {
  const yol = yuvarlakYol(0.5, 0.5, w - 1, h - 1, h / 2)
  ctx.fillStyle = dikey(ctx, 0, h, ['#F07A62', '#E25A43', '#B03E2C'])
  ctx.fill(yol)
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1
  ctx.stroke(yol)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 8px Rubik, "Segoe UI", Roboto, system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('DOLU', w / 2, h / 2 + 0.5)
}

function kabinArka(ctx, w, h) {
  ctx.fillStyle = dikey(ctx, 0, h, ['#2A2E33', '#16181B'])
  ctx.fillRect(2, 4, w - 4, h - 6)
  ctx.fillStyle = rgba('#FFC873', 0.16)
  ctx.fillRect(3, 6, w - 6, 10)
}
const KADEME_RENK = [['#E8C66A', '#D9A63A', '#9A6E1A'], ['#E6ECF0', '#C9D1D8', '#8C98A4'], ['#FFE08A', '#F6C453', '#A8690F']]
function kabinOn(tier) {
  return (ctx, w, h) => {
    const c = KADEME_RENK[tier]
    const kenar = (x, y, ww, hh) => { ctx.fillStyle = yatay(ctx, x, x + ww, [c[0], c[1], c[2]]); ctx.fillRect(x, y, ww, hh) }
    ctx.fillStyle = rgba('#6FB3BF', 0.2)
    ctx.fillRect(3, 6, w - 6, h - 12)
    ctx.save()
    ctx.beginPath(); ctx.rect(3, 6, w - 6, h - 12); ctx.clip()
    ctx.fillStyle = rgba('#FFFFFF', 0.28)
    ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(10, 6); ctx.lineTo(4, 20); ctx.closePath(); ctx.fill()
    ctx.restore()
    kenar(0, 2, 3, h - 2)
    kenar(w - 3, 2, 3, h - 2)
    ctx.fillStyle = dikey(ctx, 0, 6, [c[0], c[2]])
    ctx.fillRect(0, 2, w, 4)
    ctx.fillStyle = dikey(ctx, h - 6, h, [c[1], '#3A3E44'])
    ctx.fillRect(0, h - 6, w, 6)
    ctx.fillStyle = c[2]
    ctx.fillRect(3, h * 0.55, w - 6, 1.2)
    ctx.strokeStyle = '#3A3E44'; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(w / 2, 1.6, 1.8, Math.PI, 0); ctx.stroke()
    for (const [bx, by] of [[1.5, 4], [w - 1.5, 4], [1.5, h - 3], [w - 1.5, h - 3]]) civata(ctx, bx, by, 0.8)
  }
}
// Parlayan ok levhası (yön: 1 yukarı, -1 aşağı)
function okLevha(yon) {
  return (ctx, w, h) => {
    ctx.fillStyle = radyal(ctx, w / 2, h / 2, w * 0.7, ['rgba(255,240,170,.9)', 'rgba(246,196,83,.35)', 'rgba(246,196,83,0)'])
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    if (yon < 0) ctx.rotate(Math.PI)
    ctx.fillStyle = dikey(ctx, -h / 2, h / 2, ['#FFF4C8', '#F6C453', '#D99A2B'])
    ctx.fill(cokgen([0, -h * 0.4, w * 0.36, -h * 0.02, w * 0.14, -h * 0.02, w * 0.14, h * 0.4, -w * 0.14, h * 0.4, -w * 0.14, -h * 0.02, -w * 0.36, -h * 0.02]))
    ctx.restore()
  }
}

// Sarı maden lokomotifi (sola bakar: sola gider)
function lokomotif(ctx, w, h) {
  const p = palet('zonguldak')
  const taban = h - 4
  const g = yuvarlakYol(2, taban - 14, w - 4, 12, 2.5)
  ctx.fillStyle = dikey(ctx, taban - 14, taban - 2, ['#FFE08A', '#F6C453', '#C98A1E'])
  ctx.fill(g)
  kenarIsik(ctx, g, '#FFF8D8', 1, 0.6)
  ctx.strokeStyle = '#7A4A10'; ctx.lineWidth = 0.8
  ctx.stroke(g)
  // Kabin (sağda)
  const k = yuvarlakYol(w - 16, taban - 25, 13, 12, 2)
  ctx.fillStyle = dikey(ctx, taban - 25, taban - 13, ['#FFE08A', '#E8B030'])
  ctx.fill(k)
  ctx.stroke(k)
  ctx.fillStyle = dikey(ctx, taban - 23, taban - 16, ['#BFE6F2', '#4F8FA0'])
  ctx.fillRect(w - 14, taban - 23, 9, 6)
  // Kaput, ızgara, far (solda)
  ctx.fillStyle = '#3A2E26'
  for (let x = 6; x < w - 20; x += 3) ctx.fillRect(x, taban - 12, 1.2, 7)
  ctx.fillStyle = radyal(ctx, 4, taban - 10, 3, ['#FFFFFF', '#FFE08A'])
  ctx.fill(elips(4, taban - 10, 2, 2))
  ctx.fillStyle = '#2A2E33'
  ctx.fillRect(w - 26, taban - 18, 3, 5)
  // Tekerlekler
  for (const wx of [9, w - 10]) {
    ctx.fillStyle = '#1C1E21'
    ctx.fill(elips(wx, taban, 4, 4))
    ctx.fillStyle = '#A9B4BE'
    ctx.fill(elips(wx, taban, 1.4, 1.4))
  }
  ctx.fillStyle = '#E25A43'
  ctx.fillRect(2, taban - 4, w - 4, 1.4)
}
function vagon(dolu) {
  return (ctx, w, h) => {
    const p = palet('zonguldak')
    const taban = h - 3
    const g = new Path2D()
    g.moveTo(1, taban - 13); g.lineTo(w - 1, taban - 13); g.lineTo(w - 4, taban - 3); g.lineTo(4, taban - 3); g.closePath()
    ctx.fillStyle = dikey(ctx, taban - 13, taban - 3, ['#8C98A4', '#6E7A86', '#3A3E44'])
    ctx.fill(g)
    kenarIsik(ctx, g, '#FFFFFF', 0.9, 0.4)
    ctx.strokeStyle = '#2A2E33'; ctx.lineWidth = 0.8
    ctx.stroke(g)
    if (dolu) komurYigini(ctx, w / 2, taban - 12.5, w - 6, 7, rastgele(91), p.cevher, p.cevherIsik, 30)
    for (const wx of [7, w - 7]) {
      ctx.fillStyle = '#1C1E21'
      ctx.fill(elips(wx, taban, 3.2, 3.2))
      ctx.fillStyle = '#A9B4BE'
      ctx.fill(elips(wx, taban, 1.1, 1.1))
    }
    ctx.fillStyle = '#2A2E33'
    ctx.fillRect(w - 2, taban - 6, 3, 1.4)
  }
}

export function katlariKaydet() {
  const a = []
  for (let k = 0; k < KAT_CESIT; k++) {
    Varliklar.kaydet('kat.' + k, { w: 'W', h: SATIR_H, ciz: katCiz(k) })
    a.push('kat.' + k)
  }
  for (let k = 0; k < 2; k++) {
    Varliklar.kaydet('kat.kaya.' + k, { w: 'W', h: SATIR_H, ciz: kayaKatCiz(k) })
    a.push('kat.kaya.' + k)
  }
  Varliklar.kaydet('kat.kilitli', { w: 'W', h: SATIR_H, ciz: kilitliCiz })
  Varliklar.kaydet('tepe', { w: 'W', h: TEPE_H, ciz: tepeCiz })
  Varliklar.kaydet('yukleme', { w: 'W', h: YUKLEME_H, ciz: yuklemeCiz })
  Varliklar.kaydet('araba.maden', { w: ARABA_W, h: ARABA_H, ciz: (c, w, h) => arabaCiz(c, 0, h, ['#8C98A4', '#6E7A86', '#3A3E44'], '#2A2E33') })
  for (let s = 1; s <= 4; s++) Varliklar.kaydet('yigin.' + s, { w: YIGIN_W, h: YIGIN_H, ciz: yiginCiz(s) })
  Varliklar.kaydet('dolu.etiket', { w: 30, h: 12, ciz: doluEtiket })
  const kg = (W) => kabinG(yerlesim(W).kuyuG)
  Varliklar.kaydet('kabin.arka', { w: kg, h: KABIN_H, ciz: kabinArka })
  for (let t = 0; t < 3; t++) Varliklar.kaydet('kabin.on.' + t, { w: kg, h: KABIN_H, ciz: kabinOn(t) })
  Varliklar.kaydet('kabin.ok.1', { w: 22, h: 22, ciz: okLevha(1) })
  Varliklar.kaydet('kabin.ok.-1', { w: 22, h: 22, ciz: okLevha(-1) })
  Varliklar.kaydet('lokomotif', { w: LOKO_W, h: LOKO_H, ciz: lokomotif })
  Varliklar.kaydet('vagon.0', { w: VAGON_W, h: VAGON_H, ciz: vagon(false) })
  Varliklar.kaydet('vagon.1', { w: VAGON_W, h: VAGON_H, ciz: vagon(true) })
  a.push('kat.kilitli', 'tepe', 'yukleme', 'araba.maden', 'yigin.1', 'yigin.2', 'yigin.3', 'yigin.4', 'dolu.etiket',
    'kabin.arka', 'kabin.on.0', 'kabin.on.1', 'kabin.on.2', 'kabin.ok.1', 'kabin.ok.-1', 'lokomotif', 'vagon.0', 'vagon.1')
  return a
}
