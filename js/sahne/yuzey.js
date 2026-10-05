// Yüzey bandı (§5.3, dünya y 0–128): gök, uzak dağlar, deniz, gemiler, deniz feneri,
// tepeler, zemin, kuyu kulesi (headframe) ve Satış evi. Hepsi açılışta fırınlanır.
// Katmanlar: 'yuzey.arka' (gök + dağ + deniz, opak), 'yuzey.on' (fener, tepeler, zemin, kule, ev; saydam).
// Gemiler, bulutlar, deniz parıltısı ve kule tekeri kare başına ayrı sprite olarak çizilir.

import { Varliklar } from './varliklar.js'
import { palet } from './bolgeler.js'
import {
  dikey, yatay, radyal, elips, yuvarlakYol, cokgen, topakYol, kenarIsik, dokuKapla, yolaDoku, golgeli,
  acik, koyu, rgba, rastgele, kalas, civata, parilti,
} from './cizim.js'
import { yerlesim } from '../yerlesim.js'
const YUZEY_H = 128

export const ZEMIN_Y = 104
export const DENIZ_UST = 52
export const TEKER_Y = 22
export const TEKER_R = 8.5

// Kule tekerinin merkezi (dünya)
export function tekerMerkez(W) {
  const y = yerlesim(W)
  return { x: y.kuyuX + y.kuyuG / 2, y: TEKER_Y }
}
// Satış evinin kapısı (dünya)
export function satisKapi(W) {
  const y = yerlesim(W)
  const x0 = y.sagX - 18
  return { x: x0 + (W - x0) * 0.66, y: ZEMIN_Y }
}
// Deniz fenerinin lamba noktası (dünya)
export function fenerLamba(W) {
  return { x: Math.round(W * 0.3), y: 40 }
}

function dagSilueti(ctx, W, taban, tepe, r, sayi, renkler) {
  const p = new Path2D()
  p.moveTo(0, taban)
  const n = 48
  const zirveler = []
  for (let k = 0; k < sayi; k++) zirveler.push({ x: r() * W, h: tepe * (0.55 + r() * 0.45), g: W * (0.12 + r() * 0.12) })
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * W
    let h = 0
    for (const z of zirveler) {
      const d = Math.abs(x - z.x) / z.g
      if (d < 1) h = Math.max(h, z.h * (1 - d * d * (0.6 + 0.4 * d)))
    }
    h += Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.37) * 0.6
    p.lineTo(x, taban - Math.max(0, h))
  }
  p.lineTo(W, taban)
  p.closePath()
  ctx.fillStyle = dikey(ctx, taban - tepe, taban, renkler)
  ctx.fill(p)
  return p
}

function agac(ctx, x, y, s, r, renk) {
  // Kümelenmiş yuvarlaklar + kenar ışığı
  ctx.fillStyle = '#4A2E1C'
  ctx.fillRect(x - 0.7 * s, y - 2 * s, 1.4 * s, 3 * s)
  const top = [[0, -5], [-3, -3], [3, -3], [-1.6, -7], [1.8, -6.6]]
  for (const [dx, dy] of top) {
    const yol = elips(x + dx * s + (r() - 0.5) * s, y + dy * s, 3.2 * s, 2.9 * s)
    ctx.fillStyle = radyal(ctx, x + dx * s - s, y + dy * s - s, 4.5 * s, [acik(renk, 0.25), renk, koyu(renk, 0.3)])
    ctx.fill(yol)
  }
  const ust = elips(x - 0.8 * s, y - 7.4 * s, 2.2 * s, 1.4 * s)
  ctx.fillStyle = rgba('#DFF5B0', 0.35)
  ctx.fill(ust)
}

// ---- Arka katman: gök + dağ + deniz ----
function arkaCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(p.tohum)
  // Gök
  ctx.fillStyle = dikey(ctx, 0, DENIZ_UST + 2, [[0, p.gok[0]], [0.62, p.gok[1]], [1, p.gok[2]]])
  ctx.fillRect(0, 0, W, DENIZ_UST + 2)
  // Güneş ışığı (sol üst)
  ctx.fillStyle = radyal(ctx, W * 0.12, 4, W * 0.5, [rgba('#FFF4D8', 0.55), rgba('#FFF4D8', 0)])
  ctx.fillRect(0, 0, W, DENIZ_UST)
  dokuKapla(ctx, 0, 0, W, DENIZ_UST, 'gurultu', 0.1, 'soft-light')
  // Uzak dağlar (iki katman, mavi pus)
  dagSilueti(ctx, W, DENIZ_UST + 1, 28, r, 4, [acik(p.uzakTepe[1], 0.25), p.uzakTepe[1]])
  ctx.fillStyle = rgba(p.gok[2], 0.25)
  ctx.fillRect(0, DENIZ_UST - 12, W, 13)
  const on = dagSilueti(ctx, W, DENIZ_UST + 1, 18, r, 5, [acik(p.uzakTepe[0], 0.12), p.uzakTepe[0]])
  kenarIsik(ctx, on, '#D8F0F4', 1, 0.35)
  // Deniz
  ctx.fillStyle = dikey(ctx, DENIZ_UST, H, [[0, acik(p.deniz[0], 0.12)], [0.35, p.deniz[0]], [1, p.deniz[1]]])
  ctx.fillRect(0, DENIZ_UST, W, H - DENIZ_UST)
  ctx.fillStyle = dikey(ctx, DENIZ_UST, DENIZ_UST + 5, [rgba(p.denizIsik, 0.95), rgba(p.denizIsik, 0)])
  ctx.fillRect(0, DENIZ_UST, W, 5)
  // Yatay dalga çizgileri
  ctx.globalAlpha = 0.28
  ctx.strokeStyle = p.denizIsik
  ctx.lineWidth = 0.8
  for (let k = 0; k < 26; k++) {
    const y = DENIZ_UST + 6 + r() * 44
    const x = r() * W
    const w = 6 + r() * 18
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke()
  }
  ctx.globalAlpha = 1
  dokuKapla(ctx, 0, DENIZ_UST, W, H - DENIZ_UST, 'gurultu', 0.12, 'soft-light')
}

// ---- Ön katman: fener, tepeler, zemin, kule, Satış evi ----
function onCiz(ctx, W, H) {
  const p = palet('zonguldak')
  const r = rastgele(p.tohum + 3)
  const y = yerlesim(W)

  // Deniz feneri kayası ve fener (≈ %30)
  const fx = Math.round(W * 0.3)
  const kaya = topakYol(fx, 88, 22, 12, r, 9, 0.3)
  ctx.fillStyle = dikey(ctx, 74, 100, ['#7A6A5C', '#5A4A3E', '#3A2E26'])
  ctx.fill(kaya)
  kenarIsik(ctx, kaya, '#E8D8C0', 1.2, 0.45)
  yolaDoku(ctx, kaya, 'gurultu', 0.25, 'multiply')
  // Kule gövdesi (beyaz-kırmızı bantlar)
  const tg = new Path2D()
  tg.moveTo(fx - 5, 80); tg.lineTo(fx - 3.4, 46); tg.lineTo(fx + 3.4, 46); tg.lineTo(fx + 5, 80); tg.closePath()
  ctx.fillStyle = yatay(ctx, fx - 5, fx + 5, ['#E8E2D8', '#FFFFFF', '#CFC6BA'])
  ctx.fill(tg)
  ctx.save()
  ctx.clip(tg)
  ctx.fillStyle = yatay(ctx, fx - 5, fx + 5, ['#C4553B', '#E25A43', '#8E3426'])
  for (const by of [52, 64, 74]) ctx.fillRect(fx - 6, by, 12, 5)
  ctx.restore()
  kenarIsik(ctx, tg, '#FFFFFF', 0.8, 0.6)
  // Fener odası
  ctx.fillStyle = '#2B1D12'
  ctx.fillRect(fx - 4.6, 44.5, 9.2, 2)
  ctx.fillStyle = radyal(ctx, fx, 40, 5, ['#FFFFFF', '#FFE08A', '#F6C453'])
  ctx.fillRect(fx - 3, 37, 6, 7.5)
  ctx.strokeStyle = '#2B1D12'
  ctx.lineWidth = 0.8
  ctx.strokeRect(fx - 3, 37, 6, 7.5)
  ctx.fillStyle = '#8E3426'
  const kubbe = new Path2D()
  kubbe.moveTo(fx - 4.2, 37.2); kubbe.quadraticCurveTo(fx, 30.5, fx + 4.2, 37.2); kubbe.closePath()
  ctx.fill(kubbe)

  // Sol tepe
  const solTepe = new Path2D()
  solTepe.moveTo(-4, ZEMIN_Y + 2)
  solTepe.bezierCurveTo(W * 0.04, 70, W * 0.16, 66, W * 0.24, 86)
  solTepe.bezierCurveTo(W * 0.28, 95, W * 0.34, 98, W * 0.4, ZEMIN_Y + 2)
  solTepe.closePath()
  ctx.fillStyle = dikey(ctx, 66, ZEMIN_Y, [acik(p.tepe[1], 0.1), p.tepe[1], p.tepe[0]])
  ctx.fill(solTepe)
  kenarIsik(ctx, solTepe, '#DFF5B0', 1.2, 0.5)
  yolaDoku(ctx, solTepe, 'gurultu', 0.2, 'multiply')
  // Sağ tepe (kule ve evin arkası)
  const sagTepe = new Path2D()
  sagTepe.moveTo(W * 0.5, ZEMIN_Y + 2)
  sagTepe.bezierCurveTo(W * 0.6, 84, W * 0.7, 66, W * 0.82, 62)
  sagTepe.bezierCurveTo(W * 0.92, 60, W, 66, W + 4, 70)
  sagTepe.lineTo(W + 4, ZEMIN_Y + 2)
  sagTepe.closePath()
  ctx.fillStyle = dikey(ctx, 60, ZEMIN_Y, [acik(p.tepe[1], 0.05), p.tepe[0], koyu(p.tepe[0], 0.15)])
  ctx.fill(sagTepe)
  kenarIsik(ctx, sagTepe, '#DFF5B0', 1.2, 0.45)
  yolaDoku(ctx, sagTepe, 'gurultu', 0.2, 'multiply')
  // Ağaçlar
  for (let k = 0; k < 7; k++) agac(ctx, W * (0.02 + r() * 0.2), 84 + r() * 14, 1 + r() * 0.5, r, k % 2 ? p.tepe[0] : koyu(p.tepe[0], 0.12))
  for (let k = 0; k < 6; k++) agac(ctx, W * (0.56 + r() * 0.42), 74 + r() * 22, 0.9 + r() * 0.5, r, k % 2 ? p.tepe[0] : koyu(p.tepe[0], 0.15))

  // Zemin: çimen dudağı + toprak
  const zemin = new Path2D()
  zemin.moveTo(0, ZEMIN_Y)
  for (let x = 0; x <= W; x += 6) zemin.lineTo(x, ZEMIN_Y - 1 + Math.sin(x * 0.21) * 0.8 + r() * 0.6)
  zemin.lineTo(W, H); zemin.lineTo(0, H); zemin.closePath()
  ctx.fillStyle = dikey(ctx, ZEMIN_Y, H, [[0, acik(p.toprak, 0.08)], [0.25, p.toprak], [1, koyu(p.toprak, 0.3)]])
  ctx.fill(zemin)
  yolaDoku(ctx, zemin, 'gurultu', 0.22, 'multiply')
  for (let k = 0; k < 40; k++) {
    const px = r() * W, py = ZEMIN_Y + 6 + r() * 18
    const s = 0.8 + r() * 1.8
    ctx.fillStyle = r() < 0.5 ? koyu(p.toprak, 0.3) : acik(p.toprak, 0.18)
    ctx.fill(elips(px, py, s * 1.3, s))
  }
  ctx.fillStyle = dikey(ctx, ZEMIN_Y - 2, ZEMIN_Y + 4, [acik(p.cimen, 0.25), p.cimen, koyu(p.cimen, 0.2)])
  ctx.fillRect(0, ZEMIN_Y - 1, W, 4.5)
  ctx.strokeStyle = acik(p.cimen, 0.15)
  ctx.lineWidth = 0.8
  for (let x = 1; x < W; x += 2.5 + r() * 2) {
    ctx.beginPath(); ctx.moveTo(x, ZEMIN_Y + 1); ctx.lineTo(x + (r() - 0.5) * 2, ZEMIN_Y - 2 - r() * 2.5); ctx.stroke()
  }

  // Kuyu ağzı: zeminde açıklık ve çelik yaka
  const kx = y.kuyuX, kg = y.kuyuG
  ctx.fillStyle = dikey(ctx, ZEMIN_Y, H, ['#1A120C', '#0E0906'])
  ctx.fillRect(kx, ZEMIN_Y + 2, kg, H - ZEMIN_Y - 2)
  ctx.fillStyle = dikey(ctx, ZEMIN_Y - 1, ZEMIN_Y + 5, ['#C9D1D8', '#6E7A86'])
  ctx.fillRect(kx - 4, ZEMIN_Y - 1, kg + 8, 4)

  // Kuyu kulesi (kafes kule, pas kırmızısı çelik)
  const sol0 = kx - 6, sag0 = kx + kg + 6
  const sol1 = kx + 2, sag1 = kx + kg - 2
  const ust = 18
  const ayak = (t, sol) => {
    const a = sol ? sol0 : sag0, b = sol ? sol1 : sag1
    return [a + (b - a) * t, ZEMIN_Y - (ZEMIN_Y - ust) * t]
  }
  ctx.lineCap = 'round'
  const kiris = (x0, y0, x1, y1, k, renk) => { ctx.strokeStyle = renk; ctx.lineWidth = k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke() }
  const pas = ['#B8432F', '#8E3426', '#5A2018']
  // Çaprazlar (arka)
  for (let k = 0; k < 6; k++) {
    const t0 = k / 6, t1 = (k + 1) / 6
    const a0 = ayak(t0, true), b0 = ayak(t0, false), a1 = ayak(t1, true), b1 = ayak(t1, false)
    kiris(a0[0], a0[1], b1[0], b1[1], 1.1, pas[2])
    kiris(b0[0], b0[1], a1[0], a1[1], 1.1, pas[2])
    kiris(a1[0], a1[1], b1[0], b1[1], 1.4, pas[1])
  }
  // Ayaklar
  for (const sol of [true, false]) {
    const a = ayak(0, sol), b = ayak(1, sol)
    kiris(a[0], a[1], b[0], b[1], 3.2, pas[1])
    kiris(a[0] - 0.6, a[1], b[0] - 0.6, b[1], 1, acik(pas[0], 0.2))
  }
  // Payanda (sağa eğik destek)
  kiris(sag0 + 10, ZEMIN_Y, sag1, ust + 22, 2.4, pas[1])
  kiris(sag0 + 10, ZEMIN_Y, sag0 + 2, ZEMIN_Y - 30, 1, pas[2])
  // Üst platform ve teker yuvası
  ctx.fillStyle = dikey(ctx, ust - 4, ust + 3, [acik(pas[0], 0.15), pas[1]])
  ctx.fill(yuvarlakYol(sol1 - 6, ust - 2, sag1 - sol1 + 12, 4, 1))
  ctx.fillStyle = pas[2]
  ctx.fillRect(sol1 - 5, ust + 1.6, sag1 - sol1 + 10, 1)
  // Teker yatağı (teker ayrı çizilir)
  const tm = tekerMerkez(W)
  ctx.fillStyle = '#3A2E26'
  ctx.fillRect(tm.x - 1.2, ust - 2, 2.4, TEKER_Y - ust + 4)
  // Makine dairesi (kulenin dibinde küçük kulübe)
  const md = yuvarlakYol(sol0 - 22, ZEMIN_Y - 16, 20, 16, 1.5)
  ctx.fillStyle = dikey(ctx, ZEMIN_Y - 16, ZEMIN_Y, ['#A9B4BE', '#6E7A86'])
  ctx.fill(md)
  ctx.fillStyle = '#8E3426'
  ctx.fill(cokgen([sol0 - 24, ZEMIN_Y - 15, sol0 - 12, ZEMIN_Y - 21, sol0, ZEMIN_Y - 15]))
  ctx.fillStyle = '#23535E'
  ctx.fillRect(sol0 - 17, ZEMIN_Y - 11, 6, 5)

  // Satış evi
  const ex = y.sagX - 18, ew = W - ex
  const duvarUst = 76
  const duvar = yuvarlakYol(ex + 2, duvarUst, ew - 2, ZEMIN_Y - duvarUst + 1, 1)
  golgeli(ctx, 6, 'rgba(0,0,0,.35)', 2, () => {
    ctx.fillStyle = dikey(ctx, duvarUst, ZEMIN_Y, [acik(p.satisDuvar, 0.1), p.satisDuvar, koyu(p.satisDuvar, 0.2)])
    ctx.fill(duvar)
  })
  yolaDoku(ctx, duvar, 'gurultu', 0.18, 'multiply')
  // Tuğla çizgileri
  ctx.save()
  ctx.clip(duvar)
  ctx.strokeStyle = rgba('#5A2018', 0.35)
  ctx.lineWidth = 0.6
  for (let by = duvarUst + 4; by < ZEMIN_Y; by += 4) {
    ctx.beginPath(); ctx.moveTo(ex, by); ctx.lineTo(W, by); ctx.stroke()
  }
  ctx.restore()
  kenarIsik(ctx, duvar, '#FFD0B0', 1, 0.35)
  // Çatı (beşik)
  const cati = cokgen([ex - 3, duvarUst + 1, ex + ew * 0.42, 62, W + 6, duvarUst + 1])
  ctx.fillStyle = dikey(ctx, 62, duvarUst + 2, [acik(p.satisCati, 0.12), p.satisCati, koyu(p.satisCati, 0.25)])
  ctx.fill(cati)
  kenarIsik(ctx, cati, '#FFB8A0', 1, 0.4)
  ctx.fillStyle = rgba('#000000', 0.25)
  ctx.fillRect(ex, duvarUst + 1, ew, 1.5)
  // Pencere
  ctx.fillStyle = dikey(ctx, 82, 90, ['#FFE08A', '#F6C453'])
  ctx.fillRect(ex + 6, 82, 8, 7)
  ctx.strokeStyle = '#5A2018'
  ctx.lineWidth = 1
  ctx.strokeRect(ex + 6, 82, 8, 7)
  ctx.beginPath(); ctx.moveTo(ex + 10, 82); ctx.lineTo(ex + 10, 89); ctx.stroke()
  // Kapı
  const kp = satisKapi(W)
  const kapi = yuvarlakYol(kp.x - 5, 86, 10, ZEMIN_Y - 86, 2)
  ctx.fillStyle = dikey(ctx, 86, ZEMIN_Y, ['#6B4425', '#4A2E1C'])
  ctx.fill(kapi)
  ctx.fillStyle = '#F6C453'
  ctx.fill(elips(kp.x + 2.6, 96, 0.8, 0.8))
  // SATIŞ levhası
  const lx = ex + 4, ly = 67, lw = 30, lh = 8.5
  ctx.fillStyle = dikey(ctx, ly, ly + lh, ['#FFE08A', '#F6C453', '#D99A2B'])
  ctx.fill(yuvarlakYol(lx, ly, lw, lh, 1.5))
  ctx.strokeStyle = '#7A4A10'
  ctx.lineWidth = 0.6
  ctx.stroke(yuvarlakYol(lx, ly, lw, lh, 1.5))
  ctx.fillStyle = '#2B1D12'
  ctx.font = '800 7.5px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SATIŞ', lx + lw / 2, ly + lh / 2 + 0.6)
}

// ---- Hareketli parçaların sprite'ları ----
function bulutCiz(ctx, w, h) {
  const r = rastgele(55)
  for (let k = 0; k < 6; k++) {
    const x = w * (0.18 + r() * 0.64), y = h * (0.45 + r() * 0.25), rx = w * (0.12 + r() * 0.12), ry = h * (0.28 + r() * 0.16)
    ctx.fillStyle = radyal(ctx, x, y - ry * 0.3, rx * 1.3, [rgba('#FFFFFF', 0.95), rgba('#FFFFFF', 0.8), rgba('#E6F4F8', 0)])
    ctx.fill(elips(x, y, rx, ry))
  }
}

function gemiCiz(ctx, w, h) {
  // Kargo gemisi: koyu kırmızı gövde, beyaz köşk, vinçler, konteynerler
  const govde = new Path2D()
  govde.moveTo(1, h - 9); govde.lineTo(w - 2, h - 9); govde.lineTo(w - 6, h - 2); govde.lineTo(5, h - 2); govde.closePath()
  ctx.fillStyle = dikey(ctx, h - 9, h - 2, ['#8E3426', '#5A2018'])
  ctx.fill(govde)
  ctx.fillStyle = '#2B1D12'
  ctx.fillRect(4, h - 4, w - 10, 1.5)
  ctx.fillStyle = '#F4E8D6'
  ctx.fillRect(w - 13, h - 16, 8, 7)
  ctx.fillStyle = '#23535E'
  ctx.fillRect(w - 12, h - 14.5, 6, 1.5)
  ctx.fillStyle = '#2B1D12'
  ctx.fillRect(w - 10, h - 19, 2, 3)
  const renk = ['#4A90E2', '#E67E3E', '#2ECC71', '#C4553B', '#F6C453']
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = renk[k]
    ctx.fillRect(5 + k * 5.4, h - 13 - (k % 2) * 3, 5, 4 + (k % 2) * 3)
  }
  ctx.strokeStyle = '#3A2E26'
  ctx.lineWidth = 0.7
  ctx.beginPath(); ctx.moveTo(10, h - 9); ctx.lineTo(10, h - 18); ctx.lineTo(16, h - 15); ctx.stroke()
}
function kayikCiz(ctx, w, h) {
  const g = new Path2D()
  g.moveTo(0, h - 4); g.lineTo(w, h - 4); g.lineTo(w - 3, h); g.lineTo(3, h); g.closePath()
  ctx.fillStyle = '#F4E8D6'
  ctx.fill(g)
  ctx.fillStyle = '#C4553B'
  ctx.fillRect(1, h - 4, w - 2, 1)
  ctx.strokeStyle = '#6B4425'
  ctx.lineWidth = 0.6
  ctx.beginPath(); ctx.moveTo(w * 0.45, h - 4); ctx.lineTo(w * 0.45, 0); ctx.stroke()
  ctx.fillStyle = '#FBF4EA'
  ctx.fill(cokgen([w * 0.47, 0.5, w * 0.47, h - 4.5, w * 0.85, h - 4.5]))
}

function denizParilti(ctx, w, h) {
  const r = rastgele(909)
  for (let k = 0; k < 70; k++) {
    const x = r() * w, y = r() * h
    const u = 3 + r() * 10
    ctx.fillStyle = rgba('#DDF2F4', 0.25 + r() * 0.45)
    ctx.fillRect(x, y, u, 0.8)
  }
}

function tekerCiz(ctx, w, h) {
  const cx = w / 2, cy = h / 2, R = TEKER_R
  ctx.strokeStyle = '#3A2E26'
  ctx.lineWidth = 2.6
  ctx.beginPath(); ctx.arc(cx, cy, R - 1.2, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = '#A9B4BE'
  ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.arc(cx, cy, R - 1.2, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = '#6E7A86'
  ctx.lineWidth = 1
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - 1.5), cy + Math.sin(a) * (R - 1.5)); ctx.stroke()
  }
  ctx.fillStyle = '#2B1D12'
  ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill()
}

export function yuzeyKaydet() {
  Varliklar.kaydet('yuzey.arka', { w: 'W', h: YUZEY_H, ciz: arkaCiz })
  Varliklar.kaydet('yuzey.on', { w: 'W', h: YUZEY_H, ciz: onCiz })
  Varliklar.kaydet('bulut', { w: 64, h: 22, ciz: bulutCiz })
  Varliklar.kaydet('gemi.kargo', { w: 42, h: 20, ciz: gemiCiz })
  Varliklar.kaydet('gemi.kayik', { w: 12, h: 10, ciz: kayikCiz })
  Varliklar.kaydet('deniz.parilti', { w: 'W', h: 44, ciz: denizParilti })
  Varliklar.kaydet('kuyu.teker', { w: 2 * TEKER_R + 2, h: 2 * TEKER_R + 2, ciz: tekerCiz })
  Varliklar.kaydet('isik.sicak', { w: 64, h: 64, ciz: (c, w, h) => parilti(c, w, h, [[0, 'rgba(255,248,220,0.95)'], [0.18, 'rgba(255,200,115,0.55)'], [0.5, 'rgba(255,170,80,0.16)'], [1, 'rgba(255,160,60,0)']]) })
  Varliklar.kaydet('isik.beyaz', { w: 48, h: 48, ciz: (c, w, h) => parilti(c, w, h, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,240,190,0.6)'], [1, 'rgba(255,230,160,0)']]) })
  return ['yuzey.arka', 'yuzey.on', 'bulut', 'gemi.kargo', 'gemi.kayik', 'deniz.parilti', 'kuyu.teker', 'isik.sicak', 'isik.beyaz']
}

// Bölge rozeti (HUD, 56×56): kayalıkta deniz feneri, deniz ve dağlar
export function rozetCiz(ctx, s) {
  ctx.save()
  ctx.scale(s / 56, s / 56)
  const p = palet('zonguldak')
  ctx.fillStyle = dikey(ctx, 0, 34, [p.gok[0], p.gok[1], p.gok[2]])
  ctx.fillRect(0, 0, 56, 34)
  const r = rastgele(12)
  dagSilueti(ctx, 56, 34, 14, r, 3, [acik(p.uzakTepe[0], 0.15), p.uzakTepe[0]])
  ctx.fillStyle = dikey(ctx, 33, 56, [acik(p.deniz[0], 0.15), p.deniz[1]])
  ctx.fillRect(0, 33, 56, 23)
  ctx.fillStyle = rgba(p.denizIsik, 0.9)
  ctx.fillRect(0, 33, 56, 1.4)
  const kaya = topakYol(30, 50, 16, 8, r, 8, 0.3)
  ctx.fillStyle = dikey(ctx, 42, 58, ['#7A6A5C', '#3A2E26'])
  ctx.fill(kaya)
  const tg = new Path2D()
  tg.moveTo(26, 46); tg.lineTo(27.6, 18); tg.lineTo(32.4, 18); tg.lineTo(34, 46); tg.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill(tg)
  ctx.save(); ctx.clip(tg)
  ctx.fillStyle = '#C4553B'
  for (const by of [22, 31, 40]) ctx.fillRect(24, by, 12, 4)
  ctx.restore()
  ctx.fillStyle = radyal(ctx, 30, 14, 6, ['#FFFFFF', '#FFE08A', '#F6C453'])
  ctx.fillRect(27.4, 11, 5.2, 6.4)
  ctx.fillStyle = '#8E3426'
  ctx.fill(cokgen([26.4, 11.4, 30, 6.5, 33.6, 11.4]))
  ctx.fillStyle = radyal(ctx, 30, 14, 16, ['rgba(255,240,190,.55)', 'rgba(255,240,190,0)'])
  ctx.fillRect(14, 0, 32, 28)
  ctx.restore()
}
