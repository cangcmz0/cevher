// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Dekor (sahne v3): kat şeritleri, yükleme katı, kuyu, kabin ve cevher yığınları çizimle üretilir.
// • Ölçüler referans pikseliyle (kat 367×107): x → x·k, y → y·ky. Yerleşim (yerlesim.js) ile birebir.
// • Şeritler bölge ve ekran boyutuna göre bir kez fırınlanır; kare başına yalnız drawImage.
// • Sade, düz renkli çizim: tek yönlü ışık, ince koyu dış çizgi, az sayıda degrade.

import { rastgele } from './cizim.js'
import { BOLGE } from '../ayar.js'

const CIZGI = '#1E140C'

// Bölge kaya paletleri: zemin kayası, tünel duvarı, damar
export const KAYA = {
  zonguldak: { koyu: '#1C1612', orta: '#372B23', acik: '#57463A', duvar: ['#6E523B', '#3C2C20'], tas: '#5E4B3C' },
  eregli: { koyu: '#22150E', orta: '#43291E', acik: '#664233', duvar: ['#77503A', '#432A1E'], tas: '#6E4836' },
  karabuk: { koyu: '#1E1C1A', orta: '#403B36', acik: '#625C55', duvar: ['#7C7266', '#48423B'], tas: '#746B60' },
  kastamonu: { koyu: '#21170E', orta: '#422D1F', acik: '#664832', duvar: ['#7A5A3C', '#46321F'], tas: '#6E5039' },
}
export const kaya = (kod) => KAYA[kod] || KAYA.zonguldak
export const cevherRenk = (kod) => (BOLGE[kod] || BOLGE.zonguldak).renk
export const cevherVurgu = (kod) => (BOLGE[kod] || BOLGE.zonguldak).vurgu

// Kat içi önemli noktalar (referans x; sahne ve karakterler buradan okur)
export const KAT = Object.freeze({
  kaziciX: 146,      // kazıcının durduğu yer (sola bakar, kazma damarın yüzüne iner)
  alX: 174,          // taşıyıcının çuvalı aldığı yer (kazılan yığının sağı)
  kaziYigini: 162,   // kazıcının ayak dibinde biriken cevher
  bunkerX0: 254, bunkerX1: 284, bunkerUst: 56,   // cevher bunkeri (asansör yanı)
  bosaltX: 246,      // taşıyıcının çuvalı boşalttığı yer
  zemin: 74,         // tünel zemini (karakter ayakları)
  ray: 75.5,
  fener: [[160, 13], [232, 13]],
  arabaSol: 200, arabaSag: 236,
})
export const YUKLEME = Object.freeze({
  zemin: 95,
  bunkerX0: 286, bunkerX1: 360, bunkerUst: 52,   // depo bunkeri (kabin buraya boşaltır)
  kapiX: 272,       // vagonların yüklendiği yer (bunkerin solu)
  satisX: 192,      // kamyon kasası
  fener: [[150, 14], [226, 14]],
  egzoz: [121, 47],
})

// ── Yardımcılar ──
function yolCiz(c, noktalar) {
  const p = new Path2D()
  noktalar.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
  p.closePath()
  return p
}
function dikeyG(c, y0, y1, renkler) {
  const g = c.createLinearGradient(0, y0, 0, y1)
  renkler.forEach((r, i) => g.addColorStop(i / (renkler.length - 1), r))
  return g
}
function yatayG(c, x0, x1, renkler) {
  const g = c.createLinearGradient(x0, 0, x1, 0)
  renkler.forEach((r, i) => g.addColorStop(i / (renkler.length - 1), r))
  return g
}
function topak(x, y, rx, ry, r, kose = 8, puruz = 0.22) {
  const p = new Path2D()
  for (let i = 0; i <= kose; i++) {
    const a = (i / kose) * Math.PI * 2
    const q = 1 - puruz / 2 + r() * puruz
    const px = x + Math.cos(a) * rx * q, py = y + Math.sin(a) * ry * q
    i ? p.lineTo(px, py) : p.moveTo(px, py)
  }
  p.closePath()
  return p
}

// Kaya dokusu: üst üste binen yassı taşlar (her biri üstten ışık, alttan gölge)
function kayaDoku(c, x, y, w, h, kp, tohum, yogunluk = 1) {
  const r = rastgele(tohum)
  c.fillStyle = dikeyG(c, y, y + h, [kp.orta, kp.koyu])
  c.fillRect(x, y, w, h)
  const n = Math.round((w * h) / 260 * yogunluk)
  for (let i = 0; i < n; i++) {
    const tx = x + r() * w, ty = y + r() * h
    const rx = 5 + r() * 9, ry = 3 + r() * 5
    const p = topak(tx, ty, rx, ry, r, 7, 0.35)
    c.fillStyle = r() < 0.5 ? kp.acik : kp.tas
    c.globalAlpha = 0.35 + r() * 0.35
    c.fill(p)
    c.globalAlpha = 0.5
    c.strokeStyle = kp.koyu
    c.lineWidth = 0.8
    c.stroke(p)
    c.globalAlpha = 0.25
    c.fillStyle = '#FFFFFF'
    c.fill(topak(tx - rx * 0.2, ty - ry * 0.35, rx * 0.5, ry * 0.3, r, 6, 0.2))
  }
  c.globalAlpha = 1
}

// Ahşap kalas (yatay ya da dikey), damarlı ve civatalı
function kalas(c, x, y, w, h, yatay) {
  const p = new Path2D()
  p.rect(x, y, w, h)
  c.fillStyle = yatay ? dikeyG(c, y, y + h, ['#B07C46', '#8A5A32', '#6B4425']) : yatayG(c, x, x + w, ['#6B4425', '#A8743F', '#7A4E2A'])
  c.fill(p)
  c.strokeStyle = 'rgba(60,34,16,.45)'
  c.lineWidth = 0.6
  c.beginPath()
  if (yatay) { for (const f of [0.35, 0.68]) { c.moveTo(x + 2, y + h * f); c.lineTo(x + w - 2, y + h * f) } }
  else { for (const f of [0.38, 0.7]) { c.moveTo(x + w * f, y + 2); c.lineTo(x + w * f, y + h - 2) } }
  c.stroke()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(p)
  c.fillStyle = 'rgba(255,230,180,.22)'
  if (yatay) c.fillRect(x + 1, y + 0.6, w - 2, 0.9)
  else c.fillRect(x + 0.7, y + 1, 0.9, h - 2)
}
function civata(c, x, y) {
  c.fillStyle = '#3A3F45'
  c.beginPath(); c.arc(x, y, 1.1, 0, Math.PI * 2); c.fill()
  c.fillStyle = 'rgba(255,255,255,.5)'
  c.fillRect(x - 0.5, y - 0.6, 0.6, 0.5)
}

function rayCiz(c, x0, x1, y) {
  // Traversler, sonra iki ray
  for (let x = x0 + 2; x < x1 - 2; x += 7) {
    c.fillStyle = '#5A3A22'
    c.fillRect(x, y - 1.2, 4.2, 3.4)
    c.fillStyle = 'rgba(255,220,170,.18)'
    c.fillRect(x, y - 1.2, 4.2, 0.6)
  }
  for (const yy of [y - 1.4, y + 1.4]) {
    c.fillStyle = '#4A525A'
    c.fillRect(x0, yy - 0.7, x1 - x0, 1.4)
    c.fillStyle = '#B9C3CC'
    c.fillRect(x0, yy - 0.7, x1 - x0, 0.5)
  }
}

function fenerGovde(c, x, y, zincir) {
  c.strokeStyle = '#2B2F33'
  c.lineWidth = 0.8
  c.beginPath(); c.moveTo(x, y - zincir); c.lineTo(x, y - 2.2); c.stroke()
  const sapka = yolCiz(c, [[x - 3.6, y - 0.6], [x - 2, y - 3], [x + 2, y - 3], [x + 3.6, y - 0.6]])
  c.fillStyle = '#3A3F45'
  c.fill(sapka)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.stroke(sapka)
  c.fillStyle = '#FFE9A8'
  c.beginPath(); c.ellipse(x, y + 1.4, 2.4, 2.2, 0, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#FFFFFF'
  c.beginPath(); c.ellipse(x - 0.6, y + 0.8, 0.8, 0.7, 0, 0, Math.PI * 2); c.fill()
}

function okPlakasi(c, x, y, w, h) {
  // Yükseltme oku: koyu lacivert plaka üstünde yeşil ok (DOM düğmesi saydam olarak üstünde)
  const p = new Path2D()
  p.roundRect ? p.roundRect(x, y, w, h, 3.5) : p.rect(x, y, w, h)
  c.fillStyle = dikeyG(c, y, y + h, ['#0E4560', '#072C40'])
  c.fill(p)
  c.strokeStyle = '#5FB4D9'
  c.lineWidth = 1
  c.stroke(p)
  const cx = x + w / 2, cy = y + h / 2
  const s = Math.min(w, h) * 0.36
  const ok = yolCiz(c, [[cx - s * 1.5, cy + s * 0.2], [cx, cy - s * 1.1], [cx + s * 1.5, cy + s * 0.2], [cx + s * 0.55, cy + s * 0.2], [cx + s * 0.55, cy + s * 1.05], [cx - s * 0.55, cy + s * 1.05], [cx - s * 0.55, cy + s * 0.2]])
  c.fillStyle = dikeyG(c, cy - s, cy + s, ['#8EF0A2', '#3FD07E', '#1E9E55'])
  c.fill(ok)
  c.strokeStyle = '#0B5A2E'
  c.lineWidth = 0.8
  c.stroke(ok)
}

// Kuyu sütunu: koyu oyuk, iki çelik kılavuz ray, kat hizasında sahanlık
function kuyuSutun(c, x0, x1, y0, y1, zemin, kp, tupX, tupG, sahanlik) {
  c.fillStyle = yatayG(c, x0, x1, ['#101418', '#1C232A', '#141A1F'])
  c.fillRect(x0, y0, x1 - x0, y1 - y0)
  // Arka duvardaki enine kirişler
  c.fillStyle = 'rgba(120,135,150,.16)'
  for (let y = y0 + 8; y < y1; y += 18) c.fillRect(x0, y, x1 - x0, 1.2)
  // Kılavuz raylar
  for (const x of [tupX - 2.4, tupX + tupG - 0.6]) {
    c.fillStyle = '#3E474F'
    c.fillRect(x, y0, 3, y1 - y0)
    c.fillStyle = '#A9B4BE'
    c.fillRect(x + 0.4, y0, 0.8, y1 - y0)
  }
  // Sağ kenar kaya
  const kx = tupX + tupG + 3
  if (x1 > kx) {
    c.save()
    c.beginPath(); c.rect(kx, y0, x1 - kx, y1 - y0); c.clip()
    kayaDoku(c, kx, y0, x1 - kx, y1 - y0, kp, 913 + Math.round(y0), 1.4)
    c.restore()
    c.fillStyle = 'rgba(0,0,0,.35)'
    c.fillRect(kx, y0, 2, y1 - y0)
  }
  if (sahanlik) {
    // Kat sahanlığı: çelik ızgara, bunkerden kabine
    c.fillStyle = '#4A525A'
    c.fillRect(x0, zemin - 1, tupX - x0 + 1, 3.2)
    c.fillStyle = '#B9C3CC'
    c.fillRect(x0, zemin - 1, tupX - x0 + 1, 0.8)
    c.strokeStyle = 'rgba(20,24,28,.6)'
    c.lineWidth = 0.6
    c.beginPath()
    for (let x = x0 + 2; x < tupX; x += 2.5) { c.moveTo(x, zemin); c.lineTo(x, zemin + 2.2) }
    c.stroke()
  }
}

// Kat eşyaları: varil, sandık, alet askısı, kova, kürek (v: 0/1 düzen)
function esyalar(c, X, Y, v, cr, cv) {
  const varil = (x, y0) => {
    const w = X(9), h = Y(13)
    const p = new Path2D()
    p.roundRect ? p.roundRect(x - w / 2, y0 - h, w, h, X(2)) : p.rect(x - w / 2, y0 - h, w, h)
    c.fillStyle = yatayG(c, x - w / 2, x + w / 2, ['#5A3A22', '#9A6334', '#6B4425'])
    c.fill(p)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.stroke(p)
    c.fillStyle = '#3A3F45'
    for (const f of [0.22, 0.75]) c.fillRect(x - w / 2, y0 - h * f - 0.6, w, 1.2)
  }
  const sandik = (x, y0, w, h) => {
    const p = new Path2D()
    p.rect(x, y0 - h, w, h)
    c.fillStyle = dikeyG(c, y0 - h, y0, ['#A8743F', '#7A4E2A'])
    c.fill(p)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.stroke(p)
    c.strokeStyle = 'rgba(60,34,16,.6)'
    c.lineWidth = 0.7
    c.beginPath(); c.moveTo(x, y0 - h); c.lineTo(x + w, y0); c.moveTo(x, y0 - h / 2); c.lineTo(x + w, y0 - h / 2); c.stroke()
  }
  const zemin = Y(73)
  if (v === 0) {
    sandik(X(204), zemin, X(13), Y(11))
    sandik(X(207), zemin - Y(11), X(9), Y(8))
    varil(X(224), zemin)
    // Duvara yaslı kürek
    c.strokeStyle = '#8A5A32'
    c.lineWidth = X(1.4)
    c.lineCap = 'round'
    c.beginPath(); c.moveTo(X(236), zemin - Y(1)); c.lineTo(X(242), zemin - Y(30)); c.stroke()
    const kurek = yolCiz(c, [[X(233), zemin - Y(1)], [X(240), zemin - Y(1)], [X(239), zemin - Y(9)], [X(234.5), zemin - Y(9)]])
    c.fillStyle = '#8C98A4'
    c.fill(kurek)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.7
    c.stroke(kurek)
  } else {
    // Alet askısı: iki kazma ve bir kova
    kalas(c, X(198), Y(30), X(30), Y(3), true)
    for (const x of [205, 220]) {
      c.strokeStyle = '#8A5A32'
      c.lineWidth = X(1.3)
      c.lineCap = 'round'
      c.beginPath(); c.moveTo(X(x), Y(33)); c.lineTo(X(x + 2), Y(52)); c.stroke()
      c.strokeStyle = '#8C98A4'
      c.lineWidth = X(2)
      c.beginPath(); c.moveTo(X(x - 6), Y(36)); c.quadraticCurveTo(X(x), Y(31.5), X(x + 6), Y(36)); c.stroke()
    }
    const kova = yolCiz(c, [[X(226), zemin - Y(9)], [X(235), zemin - Y(9)], [X(233.5), zemin], [X(227.5), zemin]])
    c.fillStyle = yatayG(c, X(226), X(235), ['#5E6A76', '#9AA6B2', '#5E6A76'])
    c.fill(kova)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.stroke(kova)
    c.fillStyle = cr
    c.beginPath(); c.ellipse(X(230.5), zemin - Y(9), X(4.2), Y(1.6), 0, Math.PI, 0); c.fill()
    varil(X(212), zemin)
  }
  void cv
}

// ── Kat şeridi ──
// c: dünya pikseli ölçeğinde. v: 0/1 (komşu katlar farklı), kod: bölge
export function katCiz(c, W, H, y, kod, v) {
  const k = y.k, ky = H / 107
  const X = (r) => r * k, Y = (r) => r * ky
  const kp = kaya(kod)
  const r = rastgele(101 + v * 57)
  // 1. Kaya zemini (bütün şerit)
  kayaDoku(c, 0, 0, W, H, kp, 77 + v * 31, 1)
  // 2. Tünel boşluğu
  const tx0 = X(100), tx1 = X(290), ty0 = Y(4), ty1 = Y(78)
  const tunel = new Path2D()
  tunel.moveTo(tx0, ty1)
  tunel.lineTo(tx0, ty0 + Y(6))
  tunel.quadraticCurveTo(tx0, ty0, tx0 + X(8), ty0)
  tunel.lineTo(tx1 - X(8), ty0)
  tunel.quadraticCurveTo(tx1, ty0, tx1, ty0 + Y(6))
  tunel.lineTo(tx1, ty1)
  tunel.closePath()
  c.save()
  c.clip(tunel)
  const ig = c.createRadialGradient(X(196), Y(30), X(10), X(196), Y(40), X(130))
  ig.addColorStop(0, kp.duvar[0])
  ig.addColorStop(1, kp.duvar[1])
  c.fillStyle = ig
  c.fillRect(tx0, ty0, tx1 - tx0, ty1 - ty0)
  // Duvardaki yumuşak taş kabartmaları
  const r2 = rastgele(211 + v * 13)
  for (let i = 0; i < 26; i++) {
    const sx = tx0 + r2() * (tx1 - tx0), sy = ty0 + r2() * (ty1 - ty0 - Y(10))
    const p = topak(sx, sy, X(5 + r2() * 9), Y(3 + r2() * 5), r2, 7, 0.3)
    c.fillStyle = r2() < 0.5 ? 'rgba(255,235,200,.10)' : 'rgba(40,24,12,.14)'
    c.fill(p)
  }
  // Tavan perdesi: üst kirişin altında enine tahtalar (madendeki tavan kaplaması)
  for (let x = tx0 + X(6), q = 0; x < tx1 - X(6); x += X(11), q++) {
    c.fillStyle = q % 2 ? 'rgba(122,78,42,.55)' : 'rgba(104,66,36,.55)'
    c.fillRect(x, ty0, X(10.4), Y(9 + (q % 3)))
    c.fillStyle = 'rgba(0,0,0,.25)'
    c.fillRect(x + X(10.4), ty0, X(0.6), Y(9 + (q % 3)))
  }
  // Tavan ve kenar gölgesi
  c.fillStyle = dikeyG(c, ty0, ty0 + Y(22), ['rgba(10,6,4,.55)', 'rgba(10,6,4,0)'])
  c.fillRect(tx0, ty0, tx1 - tx0, Y(22))
  c.fillStyle = yatayG(c, tx0, tx0 + X(26), ['rgba(10,6,4,.45)', 'rgba(10,6,4,0)'])
  c.fillRect(tx0, ty0, X(26), ty1 - ty0)
  c.fillStyle = yatayG(c, tx1 - X(20), tx1, ['rgba(10,6,4,0)', 'rgba(10,6,4,.4)'])
  c.fillRect(tx1 - X(20), ty0, X(20), ty1 - ty0)
  c.restore()
  c.strokeStyle = 'rgba(0,0,0,.55)'
  c.lineWidth = 1.2
  c.stroke(tunel)

  // 3. Cevher damarı (solda): çıkıntılı kaya yüzü, gömülü cevher parçaları
  const cr = cevherRenk(kod), cv = cevherVurgu(kod)
  const yuz = yolCiz(c, [[X(100), Y(8)], [X(112), Y(10)], [X(121), Y(20)], [X(117), Y(32)], [X(125), Y(44)], [X(120), Y(56)], [X(127), Y(67)], [X(123), Y(76)], [X(100), Y(76)]])
  c.fillStyle = yatayG(c, X(100), X(127), [kp.orta, kp.acik])
  c.fill(yuz)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(yuz)
  c.save()
  c.clip(yuz)
  const r3 = rastgele(331 + v)
  for (let i = 0; i < 9; i++) {
    const px = X(104 + r3() * 18), py = Y(14 + r3() * 58)
    const p = topak(px, py, X(2.6 + r3() * 2.6), Y(2.2 + r3() * 2), r3, 6, 0.3)
    c.fillStyle = cr
    c.fill(p)
    c.strokeStyle = 'rgba(0,0,0,.5)'
    c.lineWidth = 0.6
    c.stroke(p)
    c.fillStyle = cv
    c.globalAlpha = 0.85
    c.fillRect(px - X(1), py - Y(1.4), X(1.4), Y(0.9))
    c.globalAlpha = 1
  }
  c.restore()

  // Arka plandaki eşyalar (işçilerin arkasında kalır)
  esyalar(c, X, Y, v, cr, cv)

  // Kazılan cevher: kazıcının ayak dibindeki küçük yığın (taşıyıcı buradan doldurur)
  c.save()
  c.translate(X(KAT.kaziYigini), Y(73.2))
  yiginCiz(c, X(15), Y(6.5), kod, 707 + v)
  c.restore()

  // 4. Zemin, ray
  c.fillStyle = dikeyG(c, Y(72), Y(78), [kp.duvar[1], kp.orta])
  c.fillRect(X(100), Y(72), X(190), Y(6))
  c.fillStyle = 'rgba(255,230,190,.22)'
  c.fillRect(X(100), Y(72), X(190), 0.8)
  rayCiz(c, X(126), X(250), Y(KAT.ray))

  // 5. Bunker (asansör yanı): ahşap sandık, üstüne yığın çizilir
  const bx0 = X(KAT.bunkerX0), bx1 = X(KAT.bunkerX1), bu = Y(KAT.bunkerUst)
  const bunker = yolCiz(c, [[bx0, bu], [bx1, bu], [bx1 - X(1.5), Y(76)], [bx0 + X(1.5), Y(76)]])
  c.fillStyle = dikeyG(c, bu, Y(76), ['#A8743F', '#7A4E2A'])
  c.fill(bunker)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(bunker)
  c.strokeStyle = 'rgba(60,34,16,.5)'
  c.lineWidth = 0.7
  c.beginPath()
  for (const f of [0.34, 0.67]) { const yy = bu + (Y(76) - bu) * f; c.moveTo(bx0 + 1, yy); c.lineTo(bx1 - 1, yy) }
  c.stroke()
  c.fillStyle = '#4A525A'
  c.fillRect(bx0 - 0.5, bu - 0.5, bx1 - bx0 + 1, 1.6)
  for (const x of [bx0 + 2, bx1 - 2]) { civata(c, x, bu + Y(6)); civata(c, x, Y(70)) }

  // 6. Ahşap iskelet: iki dikme, üst kiriş, köşe payandaları
  const dk = X(6.5)
  kalas(c, X(101), Y(5), dk, Y(73), false)
  kalas(c, X(283.5), Y(5), dk, Y(73), false)
  kalas(c, X(99), Y(3), X(193), Y(6.8), true)
  for (const [x0, yon] of [[X(107.5), 1], [X(283.5), -1]]) {
    const p = yolCiz(c, [[x0, Y(9.8)], [x0 + yon * X(13), Y(9.8)], [x0, Y(9.8) + Y(12)]])
    c.fillStyle = '#8A5A32'
    c.fill(p)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.stroke(p)
  }
  for (const x of [X(104.3), X(286.8)]) { civata(c, x, Y(6.4)); civata(c, x, Y(40)) }

  // 7. Fener gövdeleri (ışıklar karede eklenir)
  for (const [fx, fy] of KAT.fener) fenerGovde(c, X(fx), Y(fy), Y(fy) - Y(9.8))

  // 8. Kat ayırıcı: çelik kiriş, alt kaya bandı, boru, yükseltme oku plakası
  c.fillStyle = dikeyG(c, Y(78), Y(83), ['#6E7A86', '#4A525A', '#2E353B'])
  c.fillRect(0, Y(78), X(290), Y(5))
  c.fillStyle = 'rgba(255,255,255,.35)'
  c.fillRect(0, Y(78), X(290), 0.7)
  for (let x = X(20); x < X(290); x += X(24)) civata(c, x, Y(80.5))
  c.fillStyle = dikeyG(c, Y(90), Y(95), ['#B87A4A', '#8A5530', '#5E3A20'])
  c.fillRect(X(146), Y(90), X(143), Y(4.6))
  c.fillStyle = 'rgba(255,230,190,.35)'
  c.fillRect(X(146), Y(90), X(143), 0.7)
  for (const x of [X(170), X(222), X(270)]) {
    c.fillStyle = '#6E4026'
    c.fillRect(x - X(2), Y(89.2), X(4), Y(6.2))
  }
  okPlakasi(c, y.okX, y.okY, y.okG, y.okH)

  // 9. Kuyu sütunu
  kuyuSutun(c, X(290), W, 0, H, Y(KAT.zemin) + Y(1), kp, y.tupX, y.tupG, true)
  // Kuyu ağzı çerçevesi
  c.fillStyle = '#2B3238'
  c.fillRect(X(288.5), 0, X(2.5), H)
  c.fillStyle = 'rgba(255,255,255,.12)'
  c.fillRect(X(288.5), 0, 0.7, H)
  void r
}

// ── Yükleme katı ──
export function yuklemeCiz(c, W, H, y, kod) {
  const k = y.k, ky = H / 107
  const X = (r) => r * k, Y = (r) => r * ky
  const kp = kaya(kod)
  kayaDoku(c, 0, 0, W, H, kp, 501, 1)
  // Geniş galeri (yükleme meydanı)
  const tx0 = X(94), ty0 = Y(4), ty1 = Y(100)
  const galeri = new Path2D()
  galeri.moveTo(tx0, ty1)
  galeri.lineTo(tx0, ty0 + Y(8))
  galeri.quadraticCurveTo(tx0, ty0, tx0 + X(10), ty0)
  galeri.lineTo(W, ty0)
  galeri.lineTo(W, ty1)
  galeri.closePath()
  c.save()
  c.clip(galeri)
  const ig = c.createRadialGradient(X(200), Y(40), X(10), X(200), Y(50), X(170))
  ig.addColorStop(0, kp.duvar[0]); ig.addColorStop(1, kp.duvar[1])
  c.fillStyle = ig
  c.fillRect(tx0, ty0, W - tx0, ty1 - ty0)
  const r2 = rastgele(611)
  for (let i = 0; i < 30; i++) {
    const p = topak(tx0 + r2() * (W - tx0), ty0 + r2() * Y(70), X(5 + r2() * 10), Y(3 + r2() * 5), r2, 7, 0.3)
    c.fillStyle = r2() < 0.5 ? 'rgba(255,235,200,.10)' : 'rgba(40,24,12,.14)'
    c.fill(p)
  }
  c.fillStyle = dikeyG(c, ty0, ty0 + Y(22), ['rgba(10,6,4,.55)', 'rgba(10,6,4,0)'])
  c.fillRect(tx0, ty0, W - tx0, Y(22))
  c.restore()
  c.strokeStyle = 'rgba(0,0,0,.55)'
  c.lineWidth = 1.2
  c.stroke(galeri)

  // Arka duvarda tahta perdeleme ve kirişler
  kalas(c, X(94), Y(3), W - X(94), Y(6.5), true)
  for (const x of [X(96), X(176), X(250)]) kalas(c, x, Y(8), X(6), Y(84), false)
  for (const [fx, fy] of YUKLEME.fener) fenerGovde(c, X(fx), Y(fy), Y(fy) - Y(9.5))

  // Zemin ve ray
  c.fillStyle = dikeyG(c, Y(90), Y(107), [kp.duvar[1], kp.orta, kp.koyu])
  c.fillRect(X(94), Y(90), W - X(94), Y(17))
  c.fillStyle = 'rgba(255,230,190,.22)'
  c.fillRect(X(94), Y(90), W - X(94), 0.8)
  rayCiz(c, X(150), X(300), Y(YUKLEME.zemin + 1))

  // Depo sundurması: arka duvar tahtaları, eğimli çatı
  const dx0 = X(256)
  c.fillStyle = dikeyG(c, Y(22), Y(90), ['#8A5A32', '#6B4425'])
  c.fillRect(dx0, Y(22), W - dx0, Y(68))
  c.strokeStyle = 'rgba(40,20,8,.45)'
  c.lineWidth = 0.8
  c.beginPath()
  for (let x = dx0 + X(9); x < W; x += X(9)) { c.moveTo(x, Y(22)); c.lineTo(x, Y(90)) }
  c.stroke()
  const cati = yolCiz(c, [[dx0 - X(8), Y(26)], [dx0 + X(4), Y(12)], [W, Y(12)], [W, Y(22)], [dx0 + X(8), Y(22)], [dx0 - X(2), Y(30)]])
  c.fillStyle = dikeyG(c, Y(12), Y(30), ['#8FA3B5', '#5E7286', '#465668'])
  c.fill(cati)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(cati)
  c.strokeStyle = 'rgba(255,255,255,.25)'
  c.lineWidth = 0.6
  c.beginPath()
  for (let x = dx0 + X(10); x < W; x += X(8)) { c.moveTo(x, Y(13)); c.lineTo(x - X(2), Y(21.5)) }
  c.stroke()
  // Kabin kuyusu çatıdan iner: huni
  const hx0 = y.tupX - X(4), hx1 = y.tupX + y.tupG + X(4)
  const huni = yolCiz(c, [[hx0, Y(4)], [hx1, Y(4)], [hx1 - X(8), Y(20)], [hx0 + X(8), Y(20)]])
  c.fillStyle = dikeyG(c, Y(4), Y(20), ['#6E7A86', '#3E474F'])
  c.fill(huni)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(huni)
  c.fillStyle = 'rgba(255,255,255,.3)'
  c.fillRect(hx0 + 1, Y(4.4), hx1 - hx0 - 2, 0.7)

  // Depo bunkeri (ön yüz): kabin üstten boşaltır, yığın karede eklenir
  const bx0 = X(YUKLEME.bunkerX0), bx1 = X(YUKLEME.bunkerX1), bu = Y(YUKLEME.bunkerUst)
  const bunker = yolCiz(c, [[bx0, bu], [bx1, bu], [bx1 - X(2), Y(96)], [bx0 + X(2), Y(96)]])
  c.fillStyle = dikeyG(c, bu, Y(96), ['#B07C46', '#7A4E2A'])
  c.fill(bunker)
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(bunker)
  c.strokeStyle = 'rgba(60,34,16,.5)'
  c.lineWidth = 0.8
  c.beginPath()
  for (const f of [0.25, 0.5, 0.75]) { const yy = bu + (Y(96) - bu) * f; c.moveTo(bx0 + 2, yy); c.lineTo(bx1 - 2, yy) }
  for (const f of [0.33, 0.66]) { const xx = bx0 + (bx1 - bx0) * f; c.moveTo(xx, bu + 2); c.lineTo(xx, Y(95)) }
  c.stroke()
  c.fillStyle = '#4A525A'
  c.fillRect(bx0 - 1, bu - 1, bx1 - bx0 + 2, 2)
  for (const x of [bx0 + 3, bx1 - 3]) { civata(c, x, bu + Y(8)); civata(c, x, Y(90)) }
  // Depo tabelası (bunkerin önünde)
  const tw = X(34), th = Y(13), tx = (bx0 + bx1) / 2 - tw / 2, tyy = Y(70)
  const tab = new Path2D()
  tab.roundRect ? tab.roundRect(tx, tyy, tw, th, 2.5) : tab.rect(tx, tyy, tw, th)
  c.fillStyle = dikeyG(c, tyy, tyy + th, ['#3A4048', '#22272D'])
  c.fill(tab)
  c.strokeStyle = '#C9A44A'
  c.lineWidth = 1
  c.stroke(tab)
  c.fillStyle = '#F4E8C8'
  c.font = `800 ${Math.round(th * 0.66)}px "Baloo 2", "Trebuchet MS", system-ui, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText('DEPO', tx + tw / 2, tyy + th / 2 + 0.5)
  // Bunker oluğu: vagonların yüklendiği sol ağız
  const oluk = yolCiz(c, [[bx0, Y(62)], [bx0 - X(9), Y(70)], [bx0 - X(9), Y(73)], [bx0, Y(68)]])
  c.fillStyle = '#5E6A76'
  c.fill(oluk)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(oluk)

  // Kamyon: kabin, damper kasası, tekerlekler, egzoz
  kamyonCiz(c, X, Y)
}

function kamyonCiz(c, X, Y) {
  // Egzoz borusu
  c.fillStyle = '#3A3F45'
  c.fillRect(X(119.5), Y(46), X(3), Y(12))
  c.fillStyle = '#6E7A86'
  c.fillRect(X(119), Y(45.4), X(4), Y(1.6))
  // Kabin
  const kab = yolCiz(c, [[X(112), Y(88)], [X(112), Y(62)], [X(118), Y(56)], [X(146), Y(56)], [X(150), Y(62)], [X(150), Y(88)]])
  c.fillStyle = dikeyG(c, Y(56), Y(88), ['#5B8BD0', '#3A68A8', '#24477A'])
  c.fill(kab)
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(kab)
  const cam = yolCiz(c, [[X(118), Y(70)], [X(118), Y(64)], [X(122), Y(60)], [X(144), Y(60)], [X(146), Y(64)], [X(146), Y(70)]])
  c.fillStyle = dikeyG(c, Y(60), Y(70), ['#CFE8F6', '#7FB0CF'])
  c.fill(cam)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(cam)
  c.fillStyle = 'rgba(255,255,255,.55)'
  c.fill(yolCiz(c, [[X(124), Y(69)], [X(130), Y(61)], [X(134), Y(61)], [X(128), Y(69)]]))
  c.fillStyle = '#F08A3C'
  c.fillRect(X(112.5), Y(74), X(37), Y(3.4))
  c.fillStyle = '#FFE08A'
  c.fillRect(X(112.5), Y(81), X(3), Y(3))
  // Damper kasası
  const kasa = yolCiz(c, [[X(150), Y(56)], [X(222), Y(52)], [X(218), Y(82)], [X(154), Y(82)]])
  c.fillStyle = dikeyG(c, Y(52), Y(82), ['#E59A4A', '#C46E2A', '#8E4A1A'])
  c.fill(kasa)
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(kasa)
  c.strokeStyle = 'rgba(70,30,8,.45)'
  c.lineWidth = 1
  c.beginPath()
  for (const x of [170, 188, 204]) { c.moveTo(X(x), Y(55)); c.lineTo(X(x - 1), Y(81)) }
  c.stroke()
  c.fillStyle = 'rgba(255,240,200,.35)'
  c.fillRect(X(152), Y(56.4), X(68), 0.8)
  // Şasi ve tekerlekler
  c.fillStyle = '#2E353B'
  c.fillRect(X(112), Y(82), X(110), Y(4))
  for (const x of [128, 170, 204]) {
    c.fillStyle = '#1C1F23'
    c.beginPath(); c.arc(X(x), Y(89), Y(7.4), 0, Math.PI * 2); c.fill()
    c.strokeStyle = CIZGI
    c.lineWidth = 0.9
    c.stroke()
    c.fillStyle = '#8C98A4'
    c.beginPath(); c.arc(X(x), Y(89), Y(3), 0, Math.PI * 2); c.fill()
    c.fillStyle = '#4A525A'
    c.beginPath(); c.arc(X(x), Y(89), Y(1.2), 0, Math.PI * 2); c.fill()
  }
}

// Kamyon kasasındaki yük (0..1), karede çizilir
export function kamyonYuku(c, y, ky, oran, kod) {
  if (oran <= 0.02) return
  const X = (r) => r * y.k, Y = (r) => r * ky
  const ust = Y(54) - Y(16) * oran
  const p = new Path2D()
  p.moveTo(X(153), Y(56))
  p.quadraticCurveTo(X(165), ust, X(186), ust - Y(1))
  p.quadraticCurveTo(X(208), ust, X(220), Y(53))
  p.closePath()
  c.fillStyle = cevherRenk(kod)
  c.fill(p)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(p)
  c.fillStyle = cevherVurgu(kod)
  for (const [x, yy] of [[166, 0.5], [178, 0.25], [192, 0.2], [204, 0.45]]) {
    c.beginPath(); c.arc(X(x), ust + (Y(54) - ust) * yy + Y(1.5), Y(1.5), 0, Math.PI * 2); c.fill()
  }
}

// Taş dolgusu (kilitli katlar, tepe): sade kaya şeridi
export function kayaSerit(c, W, H, kod, tohum) {
  kayaDoku(c, 0, 0, W, H, kaya(kod), tohum, 1.1)
}

// ── Kabin (boş): sarı çelik kafes; yük ve ışık karede eklenir ──
export function kabinCiz(c, w, h) {
  const p = new Path2D()
  p.roundRect ? p.roundRect(0.5, 0.5, w - 1, h - 1, 3) : p.rect(0.5, 0.5, w - 1, h - 1)
  // İç: koyu, dikey tel kafes
  c.fillStyle = dikeyG(c, 0, h, ['#1B2228', '#232C34', '#151A1F'])
  c.fill(p)
  c.strokeStyle = 'rgba(160,175,190,.22)'
  c.lineWidth = 0.7
  c.beginPath()
  for (let x = 5; x < w - 4; x += 3.4) { c.moveTo(x, 8); c.lineTo(x, h - 6) }
  c.stroke()
  // Çerçeve: yan dikmeler, üst ve alt kiriş, çapraz destek
  const sari = (x, y, ww, hh) => { c.fillStyle = dikeyG(c, y, y + hh, ['#FFD36B', '#F2B632', '#C98A1E']); c.fillRect(x, y, ww, hh); c.strokeStyle = CIZGI; c.lineWidth = 0.8; c.strokeRect(x, y, ww, hh) }
  sari(0.5, 0.5, 4, h - 1)
  sari(w - 4.5, 0.5, 4, h - 1)
  sari(0.5, 0.5, w - 1, 6.5)
  sari(0.5, h - 6, w - 1, 5.5)
  c.strokeStyle = 'rgba(242,182,50,.75)'
  c.lineWidth = 1.4
  c.beginPath(); c.moveTo(5, h * 0.42); c.lineTo(w - 5, h * 0.42); c.stroke()
  // Askı halkası
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 1.6
  c.beginPath(); c.arc(w / 2, -1.5, 2.6, Math.PI * 0.15, Math.PI * 0.85, true); c.stroke()
  for (const x of [2.5, w - 2.5]) for (const yy of [3.5, h - 3.2]) civata(c, x, yy)
}

// ── Cevher yığını: genişlik w, yükseklik h; alt kenar orijinde ──
export function yiginCiz(c, w, h, kod, tohum) {
  if (h < 0.8) return
  const r = rastgele(tohum)
  const cr = cevherRenk(kod), cv = cevherVurgu(kod)
  const p = new Path2D()
  p.moveTo(-w / 2, 0)
  p.quadraticCurveTo(-w * 0.3, -h * 1.05, 0, -h)
  p.quadraticCurveTo(w * 0.3, -h * 1.05, w / 2, 0)
  p.closePath()
  c.fillStyle = cr
  c.fill(p)
  c.save()
  c.clip(p)
  const n = Math.max(4, Math.round(w * h / 22))
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * w * 0.9, yy = -r() * h * 0.95
    const rr = 1.2 + r() * 1.8
    c.fillStyle = r() < 0.5 ? cv : 'rgba(0,0,0,.35)'
    c.globalAlpha = 0.55 + r() * 0.4
    c.beginPath(); c.arc(x, yy, rr, 0, Math.PI * 2); c.fill()
  }
  c.globalAlpha = 1
  c.fillStyle = 'rgba(255,255,255,.12)'
  c.fillRect(-w / 2, -h, w * 0.45, h)
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(p)
}
