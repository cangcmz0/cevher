// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Bölge haritası: Karadeniz kıyısı ve dört maden bölgesi kodla çizilir (sahneyle aynı dil).
// • Deniz, sığlık, kumsal ve köpük; çimen, tarla, orman, tepe ve karlı dağlar; nehir ve köprü.
// • Bölgeleri bağlayan yol ve demiryolu; her bölgenin kendi çizimi: Zonguldak'ta kuyu kulesi,
//   Ereğli'de iskele ve çelik fabrikası, Karabük'te taş ocağı, Kastamonu'da bakır galerisi.
// • Tasarım alanı 360×440 birim; tuval genişliğe göre ölçeklenir ve boyut başına bir kez çizilir.
// • Hareketli öğeler (gemi, bulut, duman) arayüzde CSS ile oynar; konumları buradan okunur.

import { rastgele, acik, koyu, rgba } from './cizim.js'
import * as D from './dekor.js'
import * as K from './karakter.js'

export const HARITA = Object.freeze({ w: 360, h: 440 })
// Bölge düğümleri (çizimin taban noktası) ve etiket kartlarının merkezi
export const DUGUM = Object.freeze({
  zonguldak: { x: 222, y: 114, kart: [222, 152] },
  eregli: { x: 80, y: 166, kart: [100, 206] },
  karabuk: { x: 152, y: 288, kart: [152, 326] },
  kastamonu: { x: 278, y: 352, kart: [262, 394] },
})
// Bacalar: duman çıkış noktaları
export const DUMAN = Object.freeze([[243.5, 88], [92, 122], [99, 127]])
// Pusula ve gemi şeridi (arayüz katmanı için)
export const GEMI_SERIT = 70

const TAU = Math.PI * 2
const CIZGI = '#160E08'
const onbellek = { anahtar: '', tuval: null }

function dG(c, y0, y1, renkler) {
  const g = c.createLinearGradient(0, y0, 0, y1)
  renkler.forEach((r, i) => g.addColorStop(i / (renkler.length - 1), r))
  return g
}
function yG(c, x0, x1, renkler) {
  const g = c.createLinearGradient(x0, 0, x1, 0)
  renkler.forEach((r, i) => g.addColorStop(i / (renkler.length - 1), r))
  return g
}
function kontur(c, p, k = 0.8) {
  c.strokeStyle = CIZGI
  c.lineWidth = k
  c.stroke(p)
}

// ── Kıyı çizgisi: kontrol noktaları arasında yumuşak geçiş + dalgalanma ──
const KIYI = [[-20, 152], [30, 152], [70, 134], [110, 118], [150, 106], [190, 92], [230, 82], [270, 68], [310, 58], [380, 48]]
export function kiyiY(x) {
  let i = 0
  while (i < KIYI.length - 2 && x > KIYI[i + 1][0]) i++
  const [x0, y0] = KIYI[i], [x1, y1] = KIYI[i + 1]
  const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)))
  const s = (1 - Math.cos(t * Math.PI)) / 2
  return y0 + (y1 - y0) * s + 3.5 * Math.sin(x * 0.13) + 2 * Math.sin(x * 0.41 + 1.3)
}
function kiyiYolu(kapat) {
  const p = new Path2D()
  p.moveTo(-4, kiyiY(-4))
  for (let x = 0; x <= 364; x += 3) p.lineTo(x, kiyiY(x))
  if (kapat) { p.lineTo(364, 444); p.lineTo(-4, 444); p.closePath() }
  return p
}

// ── Doğa ──
function agac(c, x, y, s, r, cam) {
  c.fillStyle = 'rgba(0,0,0,.25)'
  c.beginPath(); c.ellipse(x + s * 0.3, y + s * 0.15, s * 0.9, s * 0.35, 0, 0, TAU); c.fill()
  if (cam) {
    const p = new Path2D()
    p.moveTo(x, y - s * 2.2); p.lineTo(x + s * 0.95, y); p.lineTo(x - s * 0.95, y); p.closePath()
    c.fillStyle = yG(c, x - s, x + s, ['#3E8A4A', '#2A6A38', '#1C4A28'])
    c.fill(p)
    kontur(c, p, 0.5)
    return
  }
  c.fillStyle = '#5A3A20'
  c.fillRect(x - 0.6, y - s * 0.5, 1.2, s * 0.6)
  const ton = r() < 0.5 ? '#3E8A3E' : '#4E9A42'
  const g = c.createRadialGradient(x - s * 0.35, y - s * 1.15, 0.2, x, y - s * 0.8, s * 1.1)
  g.addColorStop(0, acik(ton, 0.35)); g.addColorStop(0.6, ton); g.addColorStop(1, koyu(ton, 0.35))
  c.fillStyle = g
  c.beginPath(); c.arc(x, y - s * 0.85, s, 0, TAU); c.fill()
  c.strokeStyle = rgba(CIZGI, 0.6)
  c.lineWidth = 0.5
  c.stroke()
}
function orman(c, x, y, n, yaricap, tohum, cam = false) {
  const r = rastgele(tohum)
  const l = []
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * yaricap
    l.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 3 + r() * 2.2])
  }
  l.sort((a, b) => a[1] - b[1])
  for (const [ax, ay, s] of l) agac(c, ax, ay, s, r, cam)
}
function tepe(c, x, y, rx, ry, ton = '#5E9E4A') {
  const p = new Path2D()
  p.ellipse(x, y, rx, ry, 0, Math.PI, TAU)
  p.closePath()
  c.fillStyle = dG(c, y - ry, y, [acik(ton, 0.18), ton, koyu(ton, 0.12)])
  c.fill(p)
  c.strokeStyle = rgba(koyu(ton, 0.45), 0.6)
  c.lineWidth = 0.6
  c.stroke(p)
}
function dag(c, x, y, w, h, r, ton = '#8C8478', kar = true) {
  const tx = x + (r() - 0.5) * w * 0.2
  const p = new Path2D()
  p.moveTo(x - w / 2, y); p.lineTo(tx, y - h); p.lineTo(x + w / 2, y); p.closePath()
  c.fillStyle = ton
  c.fill(p)
  // Gölgeli yüz (sağ)
  c.fillStyle = rgba('#000000', 0.28)
  c.beginPath(); c.moveTo(tx, y - h); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.08, y); c.closePath(); c.fill()
  // Işıklı yüz (sol)
  c.fillStyle = rgba('#FFFFFF', 0.12)
  c.beginPath(); c.moveTo(tx, y - h); c.lineTo(x - w / 2, y); c.lineTo(x - w * 0.2, y); c.closePath(); c.fill()
  if (kar) {
    const k = 0.3
    const s = new Path2D()
    s.moveTo(tx, y - h)
    s.lineTo(tx + (w / 2) * k, y - h + h * k)
    s.lineTo(tx + (w / 2) * k * 0.4, y - h + h * k * 0.8)
    s.lineTo(tx, y - h + h * k * 1.05)
    s.lineTo(tx - (w / 2) * k * 0.5, y - h + h * k * 0.75)
    s.lineTo(tx - (w / 2) * k, y - h + h * k)
    s.closePath()
    c.fillStyle = dG(c, y - h, y - h + h * k, ['#FFFFFF', '#DCE6EE'])
    c.fill(s)
  }
  kontur(c, p, 0.7)
}
function tarla(c, x, y, w, h, a, ton) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  const p = new Path2D()
  p.roundRect ? p.roundRect(-w / 2, -h / 2, w, h, 2) : p.rect(-w / 2, -h / 2, w, h)
  c.fillStyle = ton
  c.fill(p)
  c.save()
  c.clip(p)
  c.strokeStyle = rgba(koyu(ton, 0.3), 0.55)
  c.lineWidth = 0.6
  for (let i = -w; i < w; i += 2.4) { c.beginPath(); c.moveTo(i, -h / 2); c.lineTo(i, h / 2); c.stroke() }
  c.restore()
  c.strokeStyle = rgba('#3A5A22', 0.7)
  c.lineWidth = 0.7
  c.stroke(p)
  c.restore()
}

// ── Yapılar ──
function ev(c, x, y, s, cati = '#C4553B') {
  const w = 8 * s, h = 6 * s
  c.fillStyle = 'rgba(0,0,0,.25)'
  c.fillRect(x - w / 2 + 1, y - 0.5, w, 1.6)
  const d = new Path2D()
  d.rect(x - w / 2, y - h, w, h)
  c.fillStyle = dG(c, y - h, y, ['#F4E8D6', '#D8C3A2'])
  c.fill(d)
  kontur(c, d, 0.5)
  c.fillStyle = '#3A5A7A'
  c.fillRect(x - w * 0.28, y - h * 0.62, w * 0.18, h * 0.28)
  c.fillRect(x + w * 0.1, y - h * 0.62, w * 0.18, h * 0.28)
  const r = new Path2D()
  r.moveTo(x - w / 2 - 1.2, y - h); r.lineTo(x, y - h - 5 * s); r.lineTo(x + w / 2 + 1.2, y - h); r.closePath()
  c.fillStyle = dG(c, y - h - 5 * s, y - h, [acik(cati, 0.2), cati, koyu(cati, 0.2)])
  c.fill(r)
  kontur(c, r, 0.5)
}
function bacaCiz(c, x, y0, y1, w, cizgili) {
  c.fillStyle = yG(c, x - w / 2, x + w / 2, ['#8A3A2A', '#C85A42', '#7A2E20'])
  c.fillRect(x - w / 2, y0, w, y1 - y0)
  if (cizgili) {
    c.fillStyle = '#F4F1EA'
    for (let y = y0 + 2; y < y1 - 2; y += 6) c.fillRect(x - w / 2, y, w, 2.2)
  }
  c.fillStyle = '#2A2A2A'
  c.fillRect(x - w / 2 - 0.4, y0 - 1, w + 0.8, 1.6)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.strokeRect(x - w / 2, y0, w, y1 - y0)
}
function avlu(c, x, y, rx, ry, ton = '#7A6244') {
  const p = new Path2D()
  p.ellipse(x, y, rx, ry, 0, 0, TAU)
  c.fillStyle = dG(c, y - ry, y + ry, [acik(ton, 0.12), ton, koyu(ton, 0.2)])
  c.fill(p)
  c.strokeStyle = rgba(koyu(ton, 0.5), 0.7)
  c.lineWidth = 0.6
  c.stroke(p)
}

// Zonguldak: kuyu kulesi, makine dairesi, işçi evleri, kömür yığını
function zonguldak(c, x, y) {
  avlu(c, x + 4, y + 2, 34, 11)
  ev(c, x - 24, y + 2, 0.9, '#C4553B')
  ev(c, x - 14, y + 6, 0.8, '#B8933E')
  // Makine dairesi (tuğla) ve bacası
  const md = new Path2D()
  md.rect(x + 8, y - 14, 18, 16)
  c.fillStyle = dG(c, y - 14, y + 2, ['#B85A3E', '#8E3B2E'])
  c.fill(md)
  c.strokeStyle = rgba('#3A160E', 0.35)
  c.lineWidth = 0.4
  for (let yy = y - 11; yy < y + 2; yy += 3) { c.beginPath(); c.moveTo(x + 8, yy); c.lineTo(x + 26, yy); c.stroke() }
  kontur(c, md, 0.6)
  c.fillStyle = '#2A1A10'
  c.fillRect(x + 12, y - 8, 4, 10)
  c.fillStyle = '#F6C453'
  c.fillRect(x + 19, y - 9, 4, 3)
  const cati = new Path2D()
  cati.moveTo(x + 6.5, y - 14); cati.lineTo(x + 17, y - 20); cati.lineTo(x + 27.5, y - 14); cati.closePath()
  c.fillStyle = dG(c, y - 20, y - 14, ['#6E7A86', '#46505A'])
  c.fill(cati)
  kontur(c, cati, 0.6)
  bacaCiz(c, x + 21.5, y - 26, y - 16, 3.4, false)
  // Kuyu kulesi: çelik A çerçeve, çaprazlar, makara
  const ust = [x - 4, y - 28]
  c.strokeStyle = '#7A2E20'
  c.lineWidth = 2.2
  c.lineCap = 'round'
  c.beginPath(); c.moveTo(x - 12, y + 2); c.lineTo(...ust); c.lineTo(x + 4, y + 2); c.stroke()
  c.beginPath(); c.moveTo(ust[0], ust[1]); c.lineTo(x + 9, y - 4); c.stroke()
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(x - 10.4, y - 4); c.lineTo(x + 2.4, y - 4)
  c.moveTo(x - 8.8, y - 11); c.lineTo(x + 0.8, y - 11)
  c.moveTo(x - 7, y - 18); c.lineTo(x - 1, y - 18)
  c.moveTo(x - 10.4, y - 4); c.lineTo(x + 0.8, y - 11)
  c.moveTo(x + 2.4, y - 4); c.lineTo(x - 8.8, y - 11)
  c.stroke()
  c.strokeStyle = '#D9774E'
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(x - 11.6, y + 1); c.lineTo(ust[0] - 0.4, ust[1] + 1); c.stroke()
  c.lineCap = 'butt'
  c.fillStyle = dG(c, ust[1] - 5, ust[1] + 5, ['#E6ECF2', '#6E7A86'])
  c.beginPath(); c.arc(ust[0], ust[1], 4.6, 0, TAU); c.fill()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.stroke()
  c.strokeStyle = '#3E464E'
  c.lineWidth = 0.6
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI
    c.beginPath(); c.moveTo(ust[0] + Math.cos(a) * 4, ust[1] + Math.sin(a) * 4); c.lineTo(ust[0] - Math.cos(a) * 4, ust[1] - Math.sin(a) * 4); c.stroke()
  }
  // Halat makaradan makine dairesine
  c.strokeStyle = 'rgba(30,30,30,.8)'
  c.lineWidth = 0.5
  c.beginPath(); c.moveTo(ust[0] + 4, ust[1]); c.lineTo(x + 9, y - 10); c.stroke()
  // Kömür yığını ve vagon
  c.save(); c.translate(x + 33, y + 6); D.yiginCiz(c, 16, 8, 'zonguldak', 5); c.restore()
  const cv = K.arabaKare(true, D.cevherRenk('zonguldak'), D.cevherVurgu('zonguldak'), 3)
  c.drawImage(cv, x - 4 - 7.5, y + 6 - 11, 15, 12)
}

// Ereğli: iskele, gemi, çelik fabrikası (testere çatı, yüksek fırın, çizgili bacalar)
function eregli(c, x, y) {
  // İskele denize uzanır
  const ix = x - 20
  const iy0 = kiyiY(ix) + 4
  c.fillStyle = '#5A3A20'
  for (let yy = iy0; yy > iy0 - 30; yy -= 6) { c.fillRect(ix - 3.6, yy - 1, 1.2, 4); c.fillRect(ix + 2.4, yy - 1, 1.2, 4) }
  const isk = new Path2D()
  isk.rect(ix - 3, iy0 - 30, 6, 30)
  c.fillStyle = yG(c, ix - 3, ix + 3, ['#8A5A30', '#B07A44', '#7A4E2A'])
  c.fill(isk)
  kontur(c, isk, 0.5)
  // Yanaşmış gemi
  gemiKucuk(c, ix - 16, iy0 - 20, 1, true)
  avlu(c, x + 4, y + 2, 32, 10, '#6E6A62')
  // Yüksek fırın
  const f = new Path2D()
  f.moveTo(x - 18, y); f.lineTo(x - 18, y - 18); f.lineTo(x - 15, y - 24); f.lineTo(x - 9, y - 24); f.lineTo(x - 6, y - 18); f.lineTo(x - 6, y); f.closePath()
  c.fillStyle = yG(c, x - 18, x - 6, ['#5A2E20', '#A8552A', '#6E3220'])
  c.fill(f)
  c.fillStyle = '#F6A623'
  c.fillRect(x - 14, y - 7, 4, 5)
  kontur(c, f, 0.6)
  // Fabrika binası, testere dişli çatı
  const b = new Path2D()
  b.rect(x - 4, y - 14, 30, 15)
  c.fillStyle = dG(c, y - 14, y + 1, ['#9AA6B2', '#6E7A86'])
  c.fill(b)
  kontur(c, b, 0.6)
  c.fillStyle = '#3A5A7A'
  for (let xx = x - 1; xx < x + 24; xx += 6) c.fillRect(xx, y - 9, 3.4, 3)
  const cati = new Path2D()
  cati.moveTo(x - 4, y - 14)
  for (let xx = x - 4; xx < x + 26; xx += 7.5) { cati.lineTo(xx + 6, y - 20); cati.lineTo(xx + 7.5, y - 14) }
  cati.closePath()
  c.fillStyle = dG(c, y - 20, y - 14, ['#C9D2DA', '#7E8A96'])
  c.fill(cati)
  kontur(c, cati, 0.6)
  bacaCiz(c, 92, 122, y - 14, 4, true)
  bacaCiz(c, 99, 127, y - 14, 3.4, true)
  // Külçe yığını
  for (const [px, py] of [[x + 30, y + 4], [x + 34, y + 4], [x + 32, y + 1.4]]) {
    c.fillStyle = dG(c, py - 2, py + 1, ['#C0714E', '#7A3E2A'])
    c.fillRect(px - 2, py - 1.4, 4.4, 2.6)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.4
    c.strokeRect(px - 2, py - 1.4, 4.4, 2.6)
  }
}

// Küçük gemi (yandan); yon 1 sağa bakar
function gemiKucuk(c, x, y, s = 1, yuk = false) {
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  const g = new Path2D()
  g.moveTo(-13, -2); g.lineTo(14, -2); g.lineTo(10, 4); g.lineTo(-10, 4); g.closePath()
  c.fillStyle = dG(c, -2, 4, ['#3B4F63', '#16222E'])
  c.fill(g)
  c.fillStyle = '#B83A2A'
  c.fillRect(-10.5, 2.4, 21, 1.6)
  kontur(c, g, 0.6)
  c.fillStyle = dG(c, -8, -2, ['#FFFFFF', '#C9D2DA'])
  c.fillRect(4, -8, 7, 6)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.4
  c.strokeRect(4, -8, 7, 6)
  c.fillStyle = '#C85A42'
  c.fillRect(6.5, -12, 2.6, 4)
  if (yuk) { c.save(); c.translate(-4, -2); D.yiginCiz(c, 12, 4, 'eregli', 3); c.restore() }
  c.strokeStyle = 'rgba(255,255,255,.75)'
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(-14, 4.5); c.quadraticCurveTo(0, 6.5, 14, 4.5); c.stroke()
  c.restore()
}

// Karabük: basamaklı taş ocağı, kesme bloklar, vinç
function karabuk(c, x, y) {
  tepe(c, x, y + 2, 42, 26, '#7A8A58')
  const BAS = [[38, 0], [30, -8], [22, -16]]
  for (const [w, dy] of BAS) {
    const yy = y + dy
    const yuz = new Path2D()
    yuz.moveTo(x - w, yy); yuz.lineTo(x + w, yy); yuz.lineTo(x + w - 3, yy - 6); yuz.lineTo(x - w + 3, yy - 6); yuz.closePath()
    c.fillStyle = dG(c, yy - 6, yy, ['#D2CCBE', '#B8B0A0'])
    c.fill(yuz)
    c.fillStyle = dG(c, yy, yy + 2.6, ['#8C877C', '#5F5850'])
    c.fillRect(x - w, yy, w * 2, 2.6)
    kontur(c, yuz, 0.5)
    c.strokeStyle = rgba('#5F5850', 0.5)
    c.lineWidth = 0.4
    for (let xx = x - w + 6; xx < x + w - 4; xx += 7) { c.beginPath(); c.moveTo(xx, yy - 5.4); c.lineTo(xx - 1, yy); c.stroke() }
  }
  // Kesme bloklar
  for (const [bx, by, s] of [[x + 30, y + 8, 5], [x + 36, y + 9, 4], [x + 33, y + 4.4, 4]]) {
    c.fillStyle = '#D2CCBE'
    c.fillRect(bx - s / 2, by - s, s, s)
    c.fillStyle = '#8C877C'
    c.beginPath(); c.moveTo(bx + s / 2, by - s); c.lineTo(bx + s / 2 + 1.6, by - s - 1.2); c.lineTo(bx + s / 2 + 1.6, by - 1.2); c.lineTo(bx + s / 2, by); c.closePath(); c.fill()
    c.fillStyle = '#EDE8DC'
    c.beginPath(); c.moveTo(bx - s / 2, by - s); c.lineTo(bx - s / 2 + 1.6, by - s - 1.2); c.lineTo(bx + s / 2 + 1.6, by - s - 1.2); c.lineTo(bx + s / 2, by - s); c.closePath(); c.fill()
    c.strokeStyle = CIZGI
    c.lineWidth = 0.4
    c.strokeRect(bx - s / 2, by - s, s, s)
  }
  // Vinç
  c.strokeStyle = '#E8A33A'
  c.lineWidth = 1.6
  c.beginPath(); c.moveTo(x - 30, y + 6); c.lineTo(x - 30, y - 26); c.lineTo(x - 6, y - 22); c.stroke()
  c.lineWidth = 0.6
  c.strokeStyle = '#7A4A0A'
  c.beginPath(); c.moveTo(x - 30, y - 18); c.lineTo(x - 22, y - 23.6); c.moveTo(x - 30, y - 10); c.lineTo(x - 14, y - 22.4); c.stroke()
  c.strokeStyle = 'rgba(30,30,30,.85)'
  c.beginPath(); c.moveTo(x - 10, y - 22.6); c.lineTo(x - 10, y - 12); c.stroke()
  c.fillStyle = '#D2CCBE'
  c.fillRect(x - 12, y - 12, 4, 3)
  c.strokeStyle = CIZGI
  c.strokeRect(x - 12, y - 12, 4, 3)
}

// Kastamonu: dağ yamacında bakır galerisi, ahşap kapı çerçevesi, ray ve vagon
function kastamonu(c, x, y, r) {
  dag(c, x + 4, y + 2, 84, 52, r, '#8A6A50', true)
  // Bakır damarları
  c.strokeStyle = rgba('#E9935A', 0.7)
  c.lineWidth = 0.9
  c.beginPath(); c.moveTo(x - 24, y - 8); c.lineTo(x - 14, y - 16); c.lineTo(x - 6, y - 14); c.stroke()
  c.beginPath(); c.moveTo(x + 18, y - 10); c.lineTo(x + 26, y - 4); c.stroke()
  // Galeri ağzı
  const ag = new Path2D()
  ag.moveTo(x - 8, y + 2); ag.lineTo(x - 8, y - 8); ag.quadraticCurveTo(x, y - 17, x + 8, y - 8); ag.lineTo(x + 8, y + 2); ag.closePath()
  c.fillStyle = dG(c, y - 14, y + 2, ['#0E0A08', '#2A1A10'])
  c.fill(ag)
  c.strokeStyle = '#8A5A30'
  c.lineWidth = 2
  c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x - 8, y - 9); c.lineTo(x + 8, y - 9); c.lineTo(x + 8, y + 2); c.stroke()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.stroke(ag)
  c.fillStyle = '#F6C453'
  c.beginPath(); c.arc(x, y - 10.5, 1.2, 0, TAU); c.fill()
  // Ray ve vagon
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 0.8
  c.beginPath(); c.moveTo(x - 3, y + 2); c.lineTo(x + 20, y + 10); c.moveTo(x + 3, y + 2); c.lineTo(x + 24, y + 8); c.stroke()
  const cv = K.arabaKare(true, D.cevherRenk('kastamonu'), D.cevherVurgu('kastamonu'), 3)
  c.drawImage(cv, x + 18 - 7.5, y + 10 - 11, 15, 12)
  c.save(); c.translate(x - 20, y + 8); D.yiginCiz(c, 16, 7, 'kastamonu', 9); c.restore()
}

// ── Yol ve demiryolu ──
function yol(c, p) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.strokeStyle = '#6B5A3A'
  c.lineWidth = 6
  c.stroke(p)
  c.strokeStyle = '#D9C08A'
  c.lineWidth = 4
  c.stroke(p)
  c.setLineDash([3, 4])
  c.strokeStyle = 'rgba(255,255,255,.7)'
  c.lineWidth = 0.7
  c.stroke(p)
  c.setLineDash([])
  c.lineCap = 'butt'
}
function demiryolu(c, p) {
  c.setLineDash([1.2, 2.4])
  c.strokeStyle = '#5A3A20'
  c.lineWidth = 4.4
  c.stroke(p)
  c.setLineDash([])
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 1.6
  c.stroke(p)
  c.strokeStyle = '#B9C3CC'
  c.lineWidth = 0.5
  c.stroke(p)
}

function pusula(c, x, y, r) {
  c.fillStyle = 'rgba(255,255,255,.12)'
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  c.strokeStyle = 'rgba(255,255,255,.55)'
  c.lineWidth = 0.8
  c.stroke()
  c.beginPath(); c.arc(x, y, r * 0.72, 0, TAU); c.stroke()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU - Math.PI / 2
    const p = new Path2D()
    p.moveTo(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05)
    p.lineTo(x + Math.cos(a + 0.6) * r * 0.22, y + Math.sin(a + 0.6) * r * 0.22)
    p.lineTo(x + Math.cos(a - 0.6) * r * 0.22, y + Math.sin(a - 0.6) * r * 0.22)
    p.closePath()
    c.fillStyle = i === 0 ? '#E25A43' : '#F4F1EA'
    c.fill(p)
    c.strokeStyle = 'rgba(0,0,0,.4)'
    c.lineWidth = 0.4
    c.stroke(p)
  }
  c.fillStyle = '#F4F1EA'
  c.font = '700 7px "Baloo 2", sans-serif'
  c.textAlign = 'center'
  c.fillText('K', x, y - r - 2.5)
}

function ciz(c) {
  const r = rastgele(1903)
  const { w, h } = HARITA
  // Deniz
  c.fillStyle = dG(c, 0, 160, ['#2A86BC', '#2F96C8', '#3AA6D4'])
  c.fillRect(0, 0, w, h)
  c.strokeStyle = 'rgba(255,255,255,.22)'
  c.lineWidth = 0.7
  for (let i = 0; i < 46; i++) {
    const x = r() * w, y = r() * 150
    if (y > kiyiY(x) - 8) continue
    c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x, y - 2, x + 4, y); c.stroke()
  }
  // Sığlık ve köpük
  const kiyi = kiyiYolu(false)
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(140,220,240,.45)'
  c.lineWidth = 22
  c.stroke(kiyi)
  c.strokeStyle = 'rgba(170,235,250,.55)'
  c.lineWidth = 11
  c.stroke(kiyi)
  c.strokeStyle = 'rgba(255,255,255,.75)'
  c.lineWidth = 4.5
  c.stroke(kiyi)
  // Kara
  const kara = kiyiYolu(true)
  c.fillStyle = '#E8D49A'
  c.fill(kara)
  c.save()
  c.translate(0, 3.2)
  c.fillStyle = dG(c, 50, h, ['#86C060', '#6AAA4E', '#5A9844', '#4E8A3E'])
  c.fill(kara)
  c.restore()
  c.save()
  c.translate(0, 3.2)
  c.clip(kara)
  c.translate(0, -3.2)
  // Çimen lekeleri
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = 60 + r() * (h - 50)
    c.fillStyle = r() < 0.5 ? 'rgba(255,255,200,.07)' : 'rgba(20,60,20,.09)'
    c.beginPath(); c.ellipse(x, y, 10 + r() * 22, 6 + r() * 10, r() * 3, 0, TAU); c.fill()
  }
  // Tarlalar
  for (const [x, y, tw, th, a, ton] of [[146, 150, 26, 14, -0.2, '#C9C86A'], [120, 170, 18, 12, 0.3, '#A8C060'], [40, 226, 24, 13, 0.15, '#D6C27A'], [212, 236, 22, 12, -0.3, '#B8C868'], [96, 362, 26, 14, 0.2, '#C9C86A'], [186, 384, 20, 12, -0.1, '#A8C060']]) tarla(c, x, y, tw, th, a, ton)
  // Tepeler
  for (const [x, y, rx, ry] of [[30, 288, 26, 12], [108, 236, 20, 9], [330, 176, 26, 12], [214, 210, 18, 8], [60, 420, 30, 12], [196, 430, 24, 10]]) tepe(c, x, y, rx, ry)
  // Dağ sırası (güneydoğu)
  const dr = rastgele(77)
  for (const [x, y, dw, dh, ton] of [[330, 236, 46, 34, '#8C8478'], [356, 262, 40, 30, '#7E766A'], [228, 330, 40, 26, '#8C8478'], [342, 318, 50, 40, '#958D80'], [214, 352, 30, 20, '#7E766A'], [356, 372, 40, 30, '#8C8478']]) dag(c, x, y, dw, dh, dr, ton, true)
  // Nehir (Filyos): dağlardan denize, iki köprülü
  const nehir = new Path2D()
  nehir.moveTo(318, 238)
  nehir.bezierCurveTo(300, 200, 262, 190, 272, 150)
  nehir.bezierCurveTo(280, 118, 262, 96, 268, kiyiY(268) - 2)
  c.lineCap = 'round'
  c.strokeStyle = '#2F8FC4'
  c.lineWidth = 5
  c.stroke(nehir)
  c.strokeStyle = '#7FD0F0'
  c.lineWidth = 1.6
  c.stroke(nehir)
  c.lineCap = 'butt'
  c.restore()

  // Yollar ve demiryolu
  const Z = DUGUM.zonguldak, E = DUGUM.eregli, Kb = DUGUM.karabuk, Ks = DUGUM.kastamonu
  const y1 = new Path2D()
  y1.moveTo(Z.x - 18, Z.y + 8); y1.quadraticCurveTo(150, 134, E.x + 30, E.y + 6)
  const y2 = new Path2D()
  y2.moveTo(E.x + 4, E.y + 10); y2.bezierCurveTo(E.x + 10, 230, Kb.x - 50, 270, Kb.x - 34, Kb.y + 6)
  const y3 = new Path2D()
  y3.moveTo(Kb.x + 40, Kb.y + 8); y3.bezierCurveTo(200, 312, 226, 360, Ks.x - 24, Ks.y + 8)
  for (const p of [y1, y2, y3]) yol(c, p)
  const dy = new Path2D()
  dy.moveTo(Z.x + 14, Z.y + 10); dy.bezierCurveTo(262, 180, 236, 236, Kb.x + 38, Kb.y - 2)
  demiryolu(c, dy)
  // Köprüler (nehir üstünde)
  for (const [bx, by, a] of [[269, 166, 0.5]]) {
    c.save()
    c.translate(bx, by)
    c.rotate(a)
    c.fillStyle = '#8A5A30'
    c.fillRect(-5, -3, 10, 6)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.5
    c.strokeRect(-5, -3, 10, 6)
    c.restore()
  }

  // Ormanlar (yapıların ve etiketlerin dışında)
  for (const [x, y, n, rr, t, cam] of [
    [34, 262, 9, 16, 11, false], [112, 214, 7, 12, 12, false], [236, 200, 8, 14, 13, false], [318, 150, 9, 16, 14, false],
    [196, 250, 6, 10, 15, false], [40, 330, 10, 18, 16, false], [92, 410, 9, 16, 17, false], [210, 420, 8, 14, 18, false],
    [326, 280, 7, 12, 19, true], [244, 300, 6, 10, 20, true], [340, 420, 6, 10, 21, true], [150, 182, 5, 8, 22, false],
    [30, 190, 6, 10, 23, false],
  ]) orman(c, x, y, n, rr, t, cam)

  // Bölgeler
  eregli(c, E.x, E.y)
  zonguldak(c, Z.x, Z.y)
  karabuk(c, Kb.x, Kb.y)
  kastamonu(c, Ks.x, Ks.y, rastgele(5))
  // Balıkçı teknesi ve pusula
  gemiKucuk(c, 150, 86, 0.7)
  pusula(c, 30, 98, 13)
  // Kenar karartması
  const v = c.createRadialGradient(w / 2, h * 0.48, h * 0.38, w / 2, h * 0.48, h * 0.8)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,10,20,.42)')
  c.fillStyle = v
  c.fillRect(0, 0, w, h)
}

// Haritayı verilen genişlikte (CSS px) tuvale çizer; aynı boyut önbellekten kopyalanır
export function haritaCiz(canvas, gen) {
  const dpr = Math.min((typeof devicePixelRatio === 'number' && devicePixelRatio) || 1, 2)
  const pw = Math.round(gen * dpr), ph = Math.round((gen * HARITA.h / HARITA.w) * dpr)
  const anahtar = pw + 'x' + ph
  if (onbellek.anahtar !== anahtar) {
    const t = document.createElement('canvas')
    t.width = pw
    t.height = ph
    const c = t.getContext('2d')
    c.scale(pw / HARITA.w, ph / HARITA.h)
    ciz(c)
    onbellek.anahtar = anahtar
    onbellek.tuval = t
  }
  canvas.width = pw
  canvas.height = ph
  canvas.getContext('2d').drawImage(onbellek.tuval, 0, 0)
}
