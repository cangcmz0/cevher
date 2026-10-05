// Maden satırları (§5.3): kaya katmanları, galeri (oda), ahşap çerçeve, fenerler, kuyu sütunu,
// sağ sütun dekorları; kilitli satır, taban (bitiş), DEPO binası, asansör kabini, arabalar ve yığınlar.
// Hepsi fırınlanır; 8 tohumlu satır çeşidi döngüyle kullanılır (satır başına değil).

import { Varliklar } from './varliklar.js'
import { palet } from './bolgeler.js'
import {
  dikey, yatay, radyal, elips, yuvarlakYol, cokgen, topakYol, kenarIsik, icGolge, dokuKapla, yolaDoku, golgeli,
  acik, koyu, rgba, rastgele, kalas, civata, komurYigini, cizgi,
} from './cizim.js'
import { yerlesim, SATIR_H, BITIS_H, ODA_UST, ODA_H, ZEMIN_Y, YUZEY_H } from '../yerlesim.js'

export const SATIR_CESIT = 8
export const KABIN_H = 44
export const ARABA_W = 30
export const ARABA_H = 16
export const YIGIN_W = 26
export const YIGIN_H = 13
export const DEPO_UST = -22            // satır 0'a göre
export const DEPO_H = 126
export const FENER_Y = 20               // fener kafesinin satır içi merkezi

// Kabin genişliği kuyu genişliğine bağlı
export const kabinG = (kuyuG) => kuyuG - 4

// ---- Kaya zemini (bütün genişlik) ----
function kayaZemin(ctx, W, H, r, p, koyuluk = 0) {
  const k = p.katman
  ctx.fillStyle = dikey(ctx, 0, H, [koyu(k[3], koyuluk), koyu(k[2], koyuluk), koyu(k[0], koyuluk)])
  ctx.fillRect(0, 0, W, H)
  // Dalgalı katmanlar
  const sinirlar = [8 + r() * 10, 36 + r() * 12, 70 + r() * 12, 100 + r() * 14]
  const renk = [k[1], k[3], k[4], k[2]]
  for (let j = 0; j < sinirlar.length; j++) {
    const y0 = sinirlar[j]
    const kalin = 10 + r() * 14
    const f1 = 0.01 + r() * 0.02, f2 = 0.04 + r() * 0.03, a1 = 2 + r() * 4, a2 = 0.8 + r() * 1.5, ph = r() * 9
    const yol = new Path2D()
    yol.moveTo(0, y0)
    for (let x = 0; x <= W + 8; x += 8) yol.lineTo(x, y0 + Math.sin(x * f1 + ph) * a1 + Math.sin(x * f2 + ph * 2) * a2)
    for (let x = W + 8; x >= 0; x -= 8) yol.lineTo(x, y0 + kalin + Math.sin(x * f1 + ph + 1) * a1 * 0.8 + Math.sin(x * f2 + ph) * a2)
    yol.closePath()
    ctx.fillStyle = rgba(koyu(renk[j], koyuluk), 0.55 + r() * 0.3)
    ctx.fill(yol)
  }
  // Çakıllar
  for (let i = 0; i < W * H / 520; i++) {
    const x = r() * W, y = r() * H, s = 1.2 + r() * 3.4
    const yol = topakYol(x, y, s * 1.25, s, r, 6, 0.4)
    const c = r() < 0.5 ? acik(k[1], 0.12) : koyu(k[3], 0.1)
    ctx.fillStyle = dikey(ctx, y - s, y + s, [acik(koyu(c, koyuluk), 0.1), koyu(c, koyuluk)])
    ctx.fill(yol)
    kenarIsik(ctx, yol, '#F3D7B0', 0.6, 0.35)
  }
  // Kömür damarları
  const damar = 1 + Math.floor(r() * 2)
  for (let j = 0; j < damar; j++) {
    const y0 = 14 + r() * (H - 28), x0 = r() * W * 0.8, uz = 40 + r() * 80
    const yol = new Path2D()
    yol.moveTo(x0, y0)
    yol.bezierCurveTo(x0 + uz * 0.3, y0 - 4 - r() * 3, x0 + uz * 0.7, y0 + 3, x0 + uz, y0 - 1)
    yol.bezierCurveTo(x0 + uz * 0.7, y0 + 5, x0 + uz * 0.3, y0 + 3 + r() * 2, x0, y0 + 2)
    yol.closePath()
    ctx.fillStyle = dikey(ctx, y0 - 4, y0 + 5, ['#3A4248', p.cevher, '#121517'])
    ctx.fill(yol)
    for (let t = 0; t < 6; t++) {
      ctx.fillStyle = rgba(p.cevherIsik, 0.85)
      ctx.fillRect(x0 + r() * uz, y0 + r() * 2, 0.8, 0.8)
    }
  }
  dokuKapla(ctx, 0, 0, W, H, 'gurultu', 0.16, 'multiply', r() * 200, r() * 200)
  dokuKapla(ctx, 0, 0, W, H, 'tane', 0.08, 'multiply')
}

// Satır üstünde kaya kornişi (satır dikişini gizler)
function korniş(ctx, W, r, p) {
  const yol = new Path2D()
  yol.moveTo(0, 0)
  yol.lineTo(W, 0)
  for (let x = W; x >= 0; x -= 6) yol.lineTo(x, 2.5 + Math.sin(x * 0.17) * 1.2 + r() * 1.5)
  yol.closePath()
  ctx.fillStyle = rgba('#120A06', 0.55)
  ctx.fill(yol)
}

// ---- Galeri (oda) ----
function odaYolu(y, r) {
  const x0 = y.odaX + 2, x1 = y.odaX + y.odaG - 1, y0 = ODA_UST + 4, y1 = ODA_UST + ODA_H - 6
  const p = new Path2D()
  p.moveTo(x0, y1)
  p.lineTo(x0, y0 + 10 + r() * 4)
  p.quadraticCurveTo(x0 + 2, y0 + 1, x0 + 12 + r() * 6, y0 + r() * 2)
  for (let x = x0 + 20; x < x1 - 18; x += 10) p.lineTo(x, y0 - 1 + r() * 3)
  p.quadraticCurveTo(x1 - 2, y0 + 1, x1, y0 + 12 + r() * 4)
  p.lineTo(x1, y1)
  p.closePath()
  return p
}

function odaCiz(ctx, y, r, p) {
  const oda = odaYolu(y, r)
  // Kesik kenar gölgesi
  golgeli(ctx, 8, 'rgba(0,0,0,.7)', 0, () => {
    ctx.fillStyle = p.magara[1]
    ctx.fill(oda)
  })
  ctx.save()
  ctx.clip(oda)
  ctx.fillStyle = dikey(ctx, ODA_UST, ODA_UST + ODA_H, [p.magara[0], p.magara[1], '#24170F'])
  ctx.fillRect(y.odaX, ODA_UST, y.odaG, ODA_H)
  // Arka duvar kaya blokları
  for (let i = 0; i < 26; i++) {
    const x = y.odaX + r() * y.odaG, yy = ODA_UST + 6 + r() * 78, s = 3 + r() * 7
    const tas = topakYol(x, yy, s * 1.3, s, r, 7, 0.35)
    ctx.fillStyle = rgba(r() < 0.5 ? '#3A2416' : '#24170F', 0.75)
    ctx.fill(tas)
    kenarIsik(ctx, tas, '#FFC873', 0.7, 0.18)
  }
  // Duvara gömülü kömür damarları (koyu, parlak benekli)
  for (let i = 0; i < 2; i++) {
    const x0 = y.odaX + 6 + r() * (y.odaG * 0.4), yy = ODA_UST + 26 + r() * 46, uz = y.odaG * (0.4 + r() * 0.4)
    const yol = new Path2D()
    yol.moveTo(x0, yy)
    yol.bezierCurveTo(x0 + uz * 0.3, yy - 5, x0 + uz * 0.7, yy + 3, x0 + uz, yy - 2)
    yol.bezierCurveTo(x0 + uz * 0.7, yy + 6, x0 + uz * 0.3, yy + 4, x0, yy + 3)
    yol.closePath()
    ctx.fillStyle = dikey(ctx, yy - 5, yy + 6, ['#2E353A', p.cevher, '#0E1012'])
    ctx.fill(yol)
    for (let t = 0; t < 7; t++) {
      ctx.fillStyle = rgba(p.cevherIsik, 0.7)
      ctx.fillRect(x0 + r() * uz, yy - 1 + r() * 3, 0.9, 0.9)
    }
  }
  dokuKapla(ctx, y.odaX, ODA_UST, y.odaG, ODA_H, 'gurultu', 0.22, 'multiply')
  // Sıcak ışık havuzu (zemin)
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = radyal(ctx, y.odaX + y.odaG * 0.5, ZEMIN_Y - 6, y.odaG * 0.62, [rgba(p.kandil, 0.26), rgba(p.kandil, 0.08), rgba(p.kandil, 0)])
  ctx.fillRect(y.odaX, ODA_UST, y.odaG, ODA_H)
  for (const fx of [0.25, 0.75]) {
    ctx.fillStyle = radyal(ctx, y.odaX + y.odaG * fx, FENER_Y + 4, 34, [rgba(p.kandil, 0.22), rgba(p.kandil, 0)])
    ctx.fillRect(y.odaX, ODA_UST, y.odaG, ODA_H)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
  // Zemin döşemesi ve raylar
  const zx0 = y.odaX - 1, zx1 = y.kuyuX + 2
  kalas(ctx, zx0, ZEMIN_Y, zx1 - zx0, 6, r, p.kereste[0], p.kereste[1], true)
  ctx.fillStyle = rgba('#000000', 0.35)
  ctx.fillRect(zx0, ZEMIN_Y + 6, zx1 - zx0, 2)
  ctx.fillStyle = dikey(ctx, ZEMIN_Y - 1.5, ZEMIN_Y + 0.5, [p.celik[1], p.celik[0]])
  ctx.fillRect(zx0 + 2, ZEMIN_Y - 1.4, zx1 - zx0 - 2, 1.6)
  for (let x = zx0 + 4; x < zx1; x += 9) {
    ctx.fillStyle = koyu(p.kereste[1], 0.3)
    ctx.fillRect(x, ZEMIN_Y + 0.5, 4, 1.5)
  }
  // Zeminde küçük kömür yığını (ikinci madencinin kazdığı)
  komurYigini(ctx, y.odaX + y.odaG * 0.64, ZEMIN_Y - 0.5, 16, 6, r, p.cevher, p.cevherIsik, 14)
  // Ahşap çerçeve: iki dikme, lento ve köşe payandaları
  const dk = 6
  kalas(ctx, y.odaX, ODA_UST + 4, dk, ZEMIN_Y - ODA_UST - 4, r, p.kereste[0], p.kereste[1], false)
  kalas(ctx, y.odaX + y.odaG - dk, ODA_UST + 4, dk, ZEMIN_Y - ODA_UST - 4, r, p.kereste[0], p.kereste[1], false)
  golgeli(ctx, 5, 'rgba(0,0,0,.55)', 2, () => {
    kalas(ctx, y.odaX - 4, ODA_UST - 1, y.odaG + 8, 7, r, p.kereste[0], p.kereste[1], true)
  })
  const pay = (x0, y0, x1, y1) => {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = p.kereste[1]
    ctx.lineWidth = 3.4
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    ctx.strokeStyle = rgba('#FFE2B0', 0.3)
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x0, y0 - 1); ctx.lineTo(x1, y1 - 1); ctx.stroke()
    ctx.restore()
  }
  pay(y.odaX + dk, ODA_UST + 16, y.odaX + dk + 12, ODA_UST + 6)
  pay(y.odaX + y.odaG - dk, ODA_UST + 16, y.odaX + y.odaG - dk - 12, ODA_UST + 6)
  for (const bx of [y.odaX + 3, y.odaX + y.odaG - 3]) { civata(ctx, bx, ODA_UST + 2.5); civata(ctx, bx, ZEMIN_Y - 6) }
  // Fener kafesleri (ışıkları kare başına)
  for (const fx of [0.25, 0.75]) {
    const x = y.odaX + y.odaG * fx
    ctx.strokeStyle = '#2A2E33'
    ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(x, ODA_UST + 6); ctx.lineTo(x, FENER_Y - 4); ctx.stroke()
    ctx.fillStyle = '#2A2E33'
    ctx.fillRect(x - 2.6, FENER_Y - 4.6, 5.2, 1.4)
    ctx.fillRect(x - 2.6, FENER_Y + 3.6, 5.2, 1.4)
    ctx.fillStyle = radyal(ctx, x, FENER_Y, 4, ['#FFFFFF', p.kandil, '#D99A2B'])
    ctx.fill(yuvarlakYol(x - 2, FENER_Y - 3.4, 4, 7, 1.2))
    ctx.strokeStyle = '#2A2E33'
    ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.moveTo(x, FENER_Y - 3.4); ctx.lineTo(x, FENER_Y + 3.6); ctx.stroke()
  }
}

// ---- Kuyu sütunu ----
function kuyuCiz(ctx, y, r, p, H, kilitli) {
  const x = y.kuyuX, g = y.kuyuG
  if (kilitli) {
    ctx.save()
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = rgba('#000000', 0.35)
    ctx.lineWidth = 1
    ctx.strokeRect(x + 1.5, 0, g - 3, 26)
    ctx.restore()
    return
  }
  ctx.fillStyle = yatay(ctx, x, x + g, ['#120C08', '#1E140D', '#0B0705'])
  ctx.fillRect(x, 0, g, H)
  // Arkadaki merdiven
  ctx.strokeStyle = rgba('#5A3620', 0.55)
  ctx.lineWidth = 1
  const mx0 = x + g * 0.3, mx1 = x + g * 0.7
  ctx.beginPath(); ctx.moveTo(mx0, 0); ctx.lineTo(mx0, H); ctx.moveTo(mx1, 0); ctx.lineTo(mx1, H); ctx.stroke()
  for (let yy = 4; yy < H; yy += 8) { ctx.beginPath(); ctx.moveTo(mx0, yy); ctx.lineTo(mx1, yy); ctx.stroke() }
  // Yan ahşap kaplama
  kalas(ctx, x, 0, 2.5, H, r, p.kereste[1], koyu(p.kereste[1], 0.3), false)
  kalas(ctx, x + g - 2.5, 0, 2.5, H, r, p.kereste[1], koyu(p.kereste[1], 0.3), false)
  // Kılavuz raylar ve cıvatalar
  for (const rx of [x + 4, x + g - 6]) {
    ctx.fillStyle = yatay(ctx, rx, rx + 2, [p.celik[1], p.celik[0]])
    ctx.fillRect(rx, 0, 2, H)
    for (let yy = 8; yy < H; yy += 32) civata(ctx, rx + 1, yy, 1)
  }
  // Kat bandı ve iniş dudağı
  ctx.fillStyle = dikey(ctx, ZEMIN_Y, ZEMIN_Y + 4, ['#A9B4BE', '#6E7A86', '#3A3E44'])
  ctx.fillRect(x, ZEMIN_Y, g, 4)
  ctx.fillStyle = rgba('#000000', 0.4)
  ctx.fillRect(x, ZEMIN_Y + 4, g, 1.5)
  dokuKapla(ctx, x, 0, g, H, 'gurultu', 0.14, 'multiply')
}

// ---- Sağ sütun dekorları ----
function sagCiz(ctx, y, W, r, p, i) {
  const x = y.sagX, g = W - y.sagX
  const tur = Math.floor(r() * 4)
  if (tur === 0) {
    // Sandıklar
    for (let k = 0; k < 2; k++) {
      const s = 12 + r() * 4, cx = x + 6 + k * (s + 2), cy = ZEMIN_Y - s
      golgeli(ctx, 4, 'rgba(0,0,0,.5)', 1, () => kalas(ctx, cx, cy, s, s, r, p.kereste[0], p.kereste[1], true))
      ctx.strokeStyle = koyu(p.kereste[1], 0.35)
      ctx.lineWidth = 1
      ctx.strokeRect(cx + 0.5, cy + 0.5, s - 1, s - 1)
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s, cy + s); ctx.stroke()
    }
  } else if (tur === 1) {
    // Boru
    ctx.fillStyle = yatay(ctx, x + g * 0.5 - 3, x + g * 0.5 + 3, ['#6E7A86', '#C9D1D8', '#6E7A86'])
    ctx.fillRect(x + g * 0.5 - 3, 0, 6, SATIR_H)
    for (const yy of [24, 88]) {
      ctx.fillStyle = '#3A3E44'
      ctx.fillRect(x + g * 0.5 - 4, yy, 8, 3)
    }
  } else if (tur === 2) {
    // Asılı fener (ışık kare başına)
    const fx = x + g * 0.5
    ctx.strokeStyle = '#2A2E33'
    ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(fx, 4); ctx.lineTo(fx, FENER_Y + 8); ctx.stroke()
    ctx.fillStyle = radyal(ctx, fx, FENER_Y + 12, 4, ['#FFFFFF', p.kandil, '#D99A2B'])
    ctx.fill(yuvarlakYol(fx - 2, FENER_Y + 8.6, 4, 7, 1.2))
  } else {
    // Cevher damarı parıltıları
    komurYigini(ctx, x + g * 0.5, 70 + r() * 20, g * 0.7, 10, r, p.cevher, p.cevherIsik, 12)
  }
  // Zemin çıkıntısı
  const cik = topakYol(x + g * 0.5, ZEMIN_Y + 6, g * 0.6, 5, r, 8, 0.2)
  ctx.fillStyle = dikey(ctx, ZEMIN_Y, ZEMIN_Y + 12, [acik(p.katman[1], 0.08), p.katman[2]])
  ctx.fill(cik)
  kenarIsik(ctx, cik, '#F3D7B0', 0.8, 0.35)
}

function satirCiz(cesit) {
  return (ctx, W, H) => {
    const p = palet('zonguldak')
    const r = rastgele(p.tohum * 31 + cesit * 977)
    const y = yerlesim(W)
    kayaZemin(ctx, W, H, r, p)
    korniş(ctx, W, r, p)
    odaCiz(ctx, y, r, p)
    kuyuCiz(ctx, y, r, p, H, false)
    sagCiz(ctx, y, W, r, p, cesit)
  }
}

function kilitliCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(p.tohum * 7 + 3)
  const y = yerlesim(W)
  kayaZemin(ctx, W, H, r, p, 0.12)
  korniş(ctx, W, r, p)
  // Kazılmamış oda çatlakları
  const oda = odaYolu(y, r)
  ctx.save()
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = rgba('#120A06', 0.55)
  ctx.lineWidth = 1.2
  ctx.stroke(oda)
  ctx.restore()
  ctx.strokeStyle = rgba('#120A06', 0.6)
  ctx.lineWidth = 0.9
  for (let k = 0; k < 6; k++) {
    let cx = y.odaX + 14 + r() * (y.odaG - 28), cy = ODA_UST + 16 + r() * 70
    ctx.beginPath(); ctx.moveTo(cx, cy)
    for (let j = 0; j < 4; j++) { cx += (r() - 0.5) * 14; cy += (r() - 0.3) * 10; ctx.lineTo(cx, cy) }
    ctx.stroke()
  }
  // KAZI tabelası
  const tx = y.odaX + y.odaG / 2, ty = ODA_UST + 44
  for (const dx of [-15, 13]) kalas(ctx, tx + dx, ty, 3, ZEMIN_Y - ty, r, p.kereste[0], p.kereste[1], false)
  golgeli(ctx, 5, 'rgba(0,0,0,.6)', 2, () => kalas(ctx, tx - 22, ty - 8, 44, 18, r, p.kereste[0], p.kereste[1], true))
  ctx.fillStyle = '#F6C453'
  ctx.font = '800 11px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('KAZI', tx, ty + 1.6)
  // Kazma ve kürek yaslanmış
  cizgi(ctx, tx + 22, ZEMIN_Y, tx + 30, ZEMIN_Y - 26, 1.6, p.kereste[0])
  ctx.strokeStyle = p.celik[0]
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(tx + 24, ZEMIN_Y - 28); ctx.quadraticCurveTo(tx + 30, ZEMIN_Y - 27, tx + 36, ZEMIN_Y - 22); ctx.stroke()
  kuyuCiz(ctx, y, r, p, H, true)
}

function bitisCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(p.tohum * 13)
  kayaZemin(ctx, W, H, r, p, 0.35)
  korniş(ctx, W, r, p)
  for (let k = 0; k < 9; k++) {
    const x = r() * W, yy = 18 + r() * 50, s = 8 + r() * 12
    const t = topakYol(x, yy, s * 1.4, s, r, 8, 0.25)
    ctx.fillStyle = dikey(ctx, yy - s, yy + s, ['#3A2A20', '#1E140D'])
    ctx.fill(t)
    kenarIsik(ctx, t, '#C8A884', 0.8, 0.25)
  }
  ctx.fillStyle = dikey(ctx, 0, H, [rgba('#071B18', 0), rgba('#071B18', 0.55), '#071B18'])
  ctx.fillRect(0, 0, W, H)
}

// ---- DEPO binası (satır 0'ın sağ sütunu, yüzey bandına taşar) ----
export function depoKutusu(W) {
  const y = yerlesim(W)
  const x = y.sagX - 8
  return { x, y: YUZEY_H + DEPO_UST, w: W - x, h: DEPO_H }
}
// Bina içindeki araba ve yığın konumu (binaya göre)
export function depoArabaYeri(w) { return { x: w * 0.5 - ARABA_W / 2 + 2, y: 102 } }
// Taşıyıcı kapısı (binaya göre)
export function depoKapiYeri(w) { return { x: w - 12, y: 104 } }

function depoCiz(ctx, w, h) {
  const p = palet('zonguldak')
  const r = rastgele(4242)
  // Kesik niş (arka)
  const nis = yuvarlakYol(0, 14, w + 4, h - 14, 6)
  ctx.fillStyle = dikey(ctx, 14, h, ['#1A0F0A', '#2C1C13'])
  ctx.fill(nis)
  // Huni (asansörden besleme, solda)
  const huni = cokgen([0, 30, 12, 30, 9, 44, 3, 44])
  ctx.fillStyle = dikey(ctx, 30, 44, [p.celik[1], p.celik[0], '#3A3E44'])
  ctx.fill(huni)
  kenarIsik(ctx, huni, '#FFFFFF', 0.8, 0.5)
  ctx.fillStyle = '#3A3E44'
  ctx.fillRect(4, 44, 4, 6)
  // Duvarlar (tahta)
  const gx = 6, gy = 26, gw = w - 8, gh = 80
  golgeli(ctx, 8, 'rgba(0,0,0,.55)', 2, () => {
    ctx.fillStyle = p.kereste[1]
    ctx.fillRect(gx, gy, gw, gh)
  })
  for (let k = 0; k < Math.ceil(gw / 7); k++) kalas(ctx, gx + k * 7, gy, Math.min(7, gx + gw - (gx + k * 7)), gh, r, p.kereste[0], p.kereste[1], false)
  // Açık ön (içeride araba görünür)
  const ic = yuvarlakYol(gx + 5, gy + 30, gw - 12, gh - 32, 3)
  ctx.fillStyle = dikey(ctx, gy + 30, gy + gh, ['#1A0F0A', '#3A2416'])
  ctx.fill(ic)
  icGolge(ctx, ic, '#000000', 2, 0.5)
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = radyal(ctx, gx + gw * 0.5, gy + 40, 30, [rgba(p.kandil, 0.28), rgba(p.kandil, 0)])
  ctx.fillRect(gx, gy + 30, gw, gh - 30)
  ctx.globalCompositeOperation = 'source-over'
  // Kapı (taşıyıcılar buradan çıkar)
  const k = depoKapiYeri(w)
  ctx.fillStyle = dikey(ctx, k.y - 22, k.y, ['#0B0705', '#1A0F0A'])
  ctx.fill(yuvarlakYol(k.x - 6, k.y - 22, 12, 22, 3))
  // Çatı
  const cati = cokgen([0, gy + 2, w * 0.5, 4, w + 6, gy + 2])
  ctx.fillStyle = dikey(ctx, 4, gy + 2, [acik(p.depoCati, 0.12), p.depoCati, koyu(p.depoCati, 0.3)])
  ctx.fill(cati)
  kenarIsik(ctx, cati, '#FFB8A0', 1, 0.45)
  ctx.fillStyle = rgba('#000000', 0.3)
  ctx.fillRect(0, gy + 1, w + 6, 2)
  // DEPO levhası
  const lw = Math.min(40, w - 10), lx = (w - lw) / 2 + 1, ly = 12, lh = 11
  golgeli(ctx, 4, 'rgba(0,0,0,.5)', 1, () => {
    ctx.fillStyle = dikey(ctx, ly, ly + lh, ['#FFE08A', '#F6C453', '#D99A2B'])
    ctx.fill(yuvarlakYol(lx, ly, lw, lh, 2))
  })
  ctx.strokeStyle = '#7A4A10'
  ctx.lineWidth = 0.7
  ctx.stroke(yuvarlakYol(lx, ly, lw, lh, 2))
  ctx.fillStyle = '#2B1D12'
  ctx.font = '800 10px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DEPO', lx + lw / 2, ly + lh / 2 + 0.8)
  // İçerideki sarı araba
  const a = depoArabaYeri(w)
  arabaCiz(ctx, a.x, a.y, ['#F6C453', '#D99A2B', '#A8690F'], '#7A4A10')
  // Çimen çıkıntısı
  ctx.fillStyle = dikey(ctx, h - 8, h, [acik(p.cimen, 0.2), p.cimen, koyu(p.cimen, 0.35)])
  ctx.fill(yuvarlakYol(-2, h - 7, w + 6, 7, 3))
  ctx.strokeStyle = acik(p.cimen, 0.2)
  ctx.lineWidth = 0.8
  for (let x = 0; x < w; x += 3) { ctx.beginPath(); ctx.moveTo(x, h - 6); ctx.lineTo(x + (r() - 0.5) * 2, h - 9 - r() * 2); ctx.stroke() }
}

// ---- Arabalar ve yığınlar ----
function arabaCiz(ctx, x, yTaban, renk, kenar) {
  const ust = yTaban - ARABA_H + 3
  const g = new Path2D()
  g.moveTo(x, ust); g.lineTo(x + ARABA_W, ust); g.lineTo(x + ARABA_W - 3, yTaban - 4); g.lineTo(x + 3, yTaban - 4); g.closePath()
  ctx.fillStyle = dikey(ctx, ust, yTaban - 4, renk)
  ctx.fill(g)
  kenarIsik(ctx, g, '#FFFFFF', 0.9, 0.45)
  ctx.strokeStyle = kenar
  ctx.lineWidth = 0.8
  ctx.stroke(g)
  ctx.fillStyle = rgba('#000000', 0.25)
  ctx.fillRect(x + 4, ust + 4, ARABA_W - 8, 1)
  for (const bx of [x + 4, x + ARABA_W - 4]) civata(ctx, bx, ust + 2.5, 0.9)
  for (const wx of [x + 7, x + ARABA_W - 7]) {
    ctx.fillStyle = '#2A2E33'
    ctx.fill(elips(wx, yTaban - 2.8, 3, 3))
    ctx.fillStyle = '#A9B4BE'
    ctx.fill(elips(wx, yTaban - 2.8, 1.1, 1.1))
  }
}

function yiginCiz(seviye) {
  return (ctx, w, h) => {
    const p = palet('zonguldak')
    const r = rastgele(600 + seviye * 17)
    const yuk = [0, 3.5, 6.5, 9.5, 12.5][seviye]
    komurYigini(ctx, w / 2, h, w * (0.7 + seviye * 0.07), yuk, r, p.cevher, p.cevherIsik, 10 + seviye * 10)
  }
}

function doluEtiket(ctx, w, h) {
  const yol = yuvarlakYol(0.5, 0.5, w - 1, h - 1, h / 2)
  ctx.fillStyle = dikey(ctx, 0, h, ['#F07A62', '#E25A43', '#B03E2C'])
  ctx.fill(yol)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1
  ctx.stroke(yol)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 8px Rubik, "Segoe UI", Roboto, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DOLU', w / 2, h / 2 + 0.5)
}

// ---- Asansör kabini (arka + ön; arada yük ve operatör) ----
function kabinArka(ctx, w, h) {
  ctx.fillStyle = dikey(ctx, 0, h, ['#2A2E33', '#16181B'])
  ctx.fillRect(2, 4, w - 4, h - 6)
  ctx.fillStyle = rgba('#FFC873', 0.12)
  ctx.fillRect(3, 6, w - 6, 10)
}
const KADEME_RENK = [['#C9D1D8', '#A9B4BE', '#6E7A86'], ['#E6ECF0', '#C9D1D8', '#8C98A4'], ['#E6ECF0', '#C9D1D8', '#8C98A4']]
function kabinOn(tier) {
  return (ctx, w, h) => {
    const c = KADEME_RENK[tier]
    const kenar = (x, y, ww, hh) => { ctx.fillStyle = yatay(ctx, x, x + ww, [c[0], c[1], c[2]]); ctx.fillRect(x, y, ww, hh) }
    // Cam
    ctx.fillStyle = rgba('#6FB3BF', 0.22)
    ctx.fillRect(3, 6, w - 6, h - 12)
    ctx.save()
    ctx.beginPath(); ctx.rect(3, 6, w - 6, h - 12); ctx.clip()
    ctx.fillStyle = rgba('#FFFFFF', 0.28)
    ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(10, 6); ctx.lineTo(4, 20); ctx.closePath(); ctx.fill()
    ctx.fillStyle = rgba('#FFFFFF', 0.14)
    ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(17, 6); ctx.lineTo(6, 32); ctx.lineTo(4, 32); ctx.closePath(); ctx.fill()
    ctx.restore()
    // Çerçeve
    kenar(0, 2, 3, h - 2)
    kenar(w - 3, 2, 3, h - 2)
    ctx.fillStyle = dikey(ctx, 0, 6, [c[0], c[2]])
    ctx.fillRect(0, 2, w, 4)
    ctx.fillStyle = dikey(ctx, h - 6, h, [c[1], '#3A3E44'])
    ctx.fillRect(0, h - 6, w, 6)
    ctx.fillStyle = c[2]
    ctx.fillRect(w / 2 - 0.6, 6, 1.2, h - 12)
    ctx.fillRect(3, h * 0.55, w - 6, 1.2)
    // Tavan halkası
    ctx.strokeStyle = '#3A3E44'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(w / 2, 1.6, 1.8, Math.PI, 0); ctx.stroke()
    if (tier >= 2) {
      ctx.fillStyle = '#F6C453'
      ctx.fillRect(0, 2, w, 1.2)
      ctx.fillRect(0, h - 6, w, 1.2)
      ctx.fillRect(0, 2, 1.2, h - 2)
      ctx.fillRect(w - 1.2, 2, 1.2, h - 2)
    }
    for (const [bx, by] of [[1.5, 4], [w - 1.5, 4], [1.5, h - 3], [w - 1.5, h - 3]]) civata(ctx, bx, by, 0.8)
  }
}
// Yukarı ok levhası (kabin çıkarken)
function okLevha(ctx, w, h) {
  const yol = yuvarlakYol(0.5, 0.5, w - 1, h - 1, 2.5)
  ctx.fillStyle = dikey(ctx, 0, h, ['#FFE08A', '#F6C453', '#D99A2B'])
  ctx.fill(yol)
  ctx.strokeStyle = '#7A4A10'
  ctx.lineWidth = 0.8
  ctx.stroke(yol)
  ctx.fillStyle = '#2B1D12'
  ctx.fill(cokgen([w / 2, 2.5, w - 3, h / 2 + 0.5, w / 2 + 2, h / 2 + 0.5, w / 2 + 2, h - 2.5, w / 2 - 2, h - 2.5, w / 2 - 2, h / 2 + 0.5, 3, h / 2 + 0.5]))
}

export function satirlariKaydet() {
  const a = []
  for (let k = 0; k < SATIR_CESIT; k++) {
    const an = 'satir.zonguldak.' + k
    Varliklar.kaydet(an, { w: 'W', h: SATIR_H, ciz: satirCiz(k) })
    a.push(an)
  }
  Varliklar.kaydet('satir.kilitli', { w: 'W', h: SATIR_H, ciz: kilitliCiz })
  Varliklar.kaydet('bitis', { w: 'W', h: BITIS_H, ciz: bitisCiz })
  Varliklar.kaydet('depo.bina', { w: (W) => W - (yerlesim(W).sagX - 8), h: DEPO_H, ciz: depoCiz })
  Varliklar.kaydet('araba.maden', { w: ARABA_W, h: ARABA_H, ciz: (c, w, h) => arabaCiz(c, 0, h, ['#8C98A4', '#6E7A86', '#3A3E44'], '#2A2E33') })
  for (let s = 1; s <= 4; s++) Varliklar.kaydet('yigin.' + s, { w: YIGIN_W, h: YIGIN_H, ciz: yiginCiz(s) })
  Varliklar.kaydet('dolu.etiket', { w: 30, h: 12, ciz: doluEtiket })
  const kg = (W) => kabinG(yerlesim(W).kuyuG)
  Varliklar.kaydet('kabin.arka', { w: kg, h: KABIN_H, ciz: kabinArka })
  for (let t = 0; t < 3; t++) Varliklar.kaydet('kabin.on.' + t, { w: kg, h: KABIN_H, ciz: kabinOn(t) })
  Varliklar.kaydet('kabin.ok', { w: 14, h: 14, ciz: okLevha })
  a.push('satir.kilitli', 'bitis', 'depo.bina', 'araba.maden', 'yigin.1', 'yigin.2', 'yigin.3', 'yigin.4', 'dolu.etiket', 'kabin.arka', 'kabin.on.0', 'kabin.on.1', 'kabin.on.2', 'kabin.ok')
  return a
}
