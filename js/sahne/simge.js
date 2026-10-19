// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Arayüz simgeleri: sayfalardaki büyük simgeler sahnedeki çizimlerle aynı elden çıkar
// (cevher yığını, maden vagonu, asansör kabini, gemi, ambar, kontrat, madalya, hediye...).
// Hepsi 64×64 birimlik kutuya çizilir; boyuta göre ölçeklenir ve önbellekte tutulur.

import { rastgele, acik, koyu, rgba } from './cizim.js'
import * as D from './dekor.js'
import * as K from './karakter.js'

const TAU = Math.PI * 2
const onbellek = new Map()

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
function golge(c, x, y, rx, ry, a = 0.45) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx)
  g.addColorStop(0, `rgba(0,0,0,${a})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  c.save()
  c.translate(x, y)
  c.scale(1, ry / rx)
  c.translate(-x, -y)
  c.fillStyle = g
  c.beginPath(); c.arc(x, y, rx, 0, TAU); c.fill()
  c.restore()
}
function hale(c, x, y, r, renk, a = 0.35) {
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba(renk, a))
  g.addColorStop(1, rgba(renk, 0))
  c.fillStyle = g
  c.fillRect(x - r, y - r, r * 2, r * 2)
}
function kontur(c, p, k = 1.1) {
  c.strokeStyle = '#160E08'
  c.lineWidth = k
  c.stroke(p)
}
function cihazOlcek(c) {
  const m = c.getTransform()
  return Math.hypot(m.a, m.b) || 1
}

// ── Cevher: bölge renginde parlayan yığın ve önde iri parçalar ──
function cevher(c, kod) {
  hale(c, 32, 38, 30, D.cevherVurgu(kod), 0.32)
  golge(c, 32, 52, 26, 5)
  c.save()
  c.translate(32, 52)
  D.yiginCiz(c, 50, 30, kod, 11)
  c.restore()
  D.kristalCiz(c, 18, 50, 6.5, 0.4, kod, 3)
  D.kristalCiz(c, 47, 51, 5.5, -0.3, kod, 8)
  D.kristalCiz(c, 33, 54, 4.6, 1.2, kod, 5)
}

// ── Maden vagonu: rayda dolu araba ──
function vagon(c, kod) {
  golge(c, 32, 53, 26, 4)
  c.fillStyle = '#3A2A1E'
  for (let x = 6; x < 60; x += 9) c.fillRect(x, 52, 5, 3)
  c.fillStyle = dG(c, 50, 52.5, ['#C9D2DA', '#5E6872'])
  c.fillRect(2, 50.2, 60, 2.2)
  const o = 1.85
  const cv = K.arabaKare(true, D.cevherRenk(kod), D.cevherVurgu(kod), o * cihazOlcek(c))
  c.drawImage(cv, 32 - 15 * o, 51 - 22 * o, 30 * o, 24 * o)
}

// ── Asansör kabini: makara, halat, içinde cevher ──
function kabin(c, kod) {
  c.strokeStyle = '#2A2F35'
  c.lineWidth = 1.4
  c.beginPath(); c.moveTo(28, 2); c.lineTo(28, 14); c.moveTo(36, 2); c.lineTo(36, 14); c.stroke()
  c.fillStyle = dG(c, 0, 10, ['#C9D2DA', '#5E6872'])
  c.beginPath(); c.arc(32, 5, 5.5, 0, TAU); c.fill()
  c.fillStyle = '#2A2F35'
  c.beginPath(); c.arc(32, 5, 1.6, 0, TAU); c.fill()
  golge(c, 32, 58, 22, 3, 0.35)
  c.save()
  c.translate(13, 13)
  D.kabinCiz(c, 38, 44)
  c.restore()
  c.save()
  c.translate(32, 50)
  D.yiginCiz(c, 26, 11, kod, 61)
  c.restore()
}

// ── Gemi: dalgalarda yük gemisi, bacadan duman ──
function gemi(c, kod) {
  c.fillStyle = rgba('#D9E4EA', 0.35)
  for (const [x, y, r] of [[46, 12, 4], [50, 7, 5], [55, 3, 4]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill() }
  // Kıç köşkü
  const kosk = new Path2D()
  kosk.rect(36, 24, 16, 14)
  c.fillStyle = dG(c, 24, 38, ['#FFFFFF', '#D6DEE4', '#A9B6C0'])
  c.fill(kosk)
  kontur(c, kosk, 0.9)
  c.fillStyle = '#2B4A66'
  for (const x of [39, 44, 49]) c.fillRect(x - 1.4, 28, 2.8, 3)
  // Baca
  const baca = new Path2D()
  baca.rect(41.5, 13, 6, 11)
  c.fillStyle = yG(c, 41.5, 47.5, ['#9E2E22', '#E0553F', '#B83A2A'])
  c.fill(baca)
  c.fillStyle = '#1C1F23'
  c.fillRect(41.5, 13, 6, 2.5)
  kontur(c, baca, 0.9)
  // Direk
  c.strokeStyle = '#4A3424'
  c.lineWidth = 1.4
  c.beginPath(); c.moveTo(17, 38); c.lineTo(17, 14); c.stroke()
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(17, 15); c.lineTo(30, 37); c.moveTo(17, 15); c.lineTo(8, 37); c.stroke()
  // Güvertede yük
  c.save()
  c.translate(23, 39)
  D.yiginCiz(c, 18, 7, kod, 23)
  c.restore()
  // Gövde
  const g = new Path2D()
  g.moveTo(3, 37); g.lineTo(61, 37); g.lineTo(55, 50); g.lineTo(9, 50); g.closePath()
  c.fillStyle = dG(c, 37, 50, ['#3B4F63', '#24384C', '#16222E'])
  c.fill(g)
  c.save()
  c.clip(g)
  c.fillStyle = '#B83A2A'
  c.fillRect(0, 45.5, 64, 6)
  c.fillStyle = 'rgba(255,255,255,.25)'
  c.fillRect(0, 37, 64, 1.2)
  c.restore()
  kontur(c, g)
  // Su
  const su = new Path2D()
  su.moveTo(0, 48)
  for (let x = 0; x <= 64; x += 8) su.quadraticCurveTo(x + 4, 45.5, x + 8, 48)
  su.lineTo(64, 64); su.lineTo(0, 64); su.closePath()
  c.fillStyle = dG(c, 46, 62, ['#3F9BD0', '#1F6A9C', '#0E3D62'])
  c.fill(su)
  c.strokeStyle = 'rgba(255,255,255,.7)'
  c.lineWidth = 1
  c.beginPath()
  c.moveTo(0, 48)
  for (let x = 0; x <= 64; x += 8) c.quadraticCurveTo(x + 4, 45.5, x + 8, 48)
  c.stroke()
  c.strokeStyle = 'rgba(255,255,255,.35)'
  c.beginPath(); c.moveTo(10, 55); c.lineTo(20, 55); c.moveTo(36, 58); c.lineTo(50, 58); c.stroke()
}

// ── Ambar: kalas duvarlı, oluklu çatılı depo; önünde yığın ──
function ambar(c, kod) {
  golge(c, 32, 56, 30, 4)
  const duvar = new Path2D()
  duvar.rect(8, 26, 48, 30)
  c.save()
  c.clip(duvar)
  c.translate(8, 26)
  D.tahtaDokusu(c, 48, 30, 41, '#8A5A30')
  c.restore()
  kontur(c, duvar)
  // Kapı (çapraz destekli)
  const kapi = new Path2D()
  kapi.rect(24, 36, 16, 20)
  c.fillStyle = dG(c, 36, 56, ['#3A2416', '#22150C'])
  c.fill(kapi)
  c.strokeStyle = '#8A5A30'
  c.lineWidth = 1.6
  c.beginPath(); c.moveTo(25, 37); c.lineTo(39, 55); c.moveTo(39, 37); c.lineTo(25, 55); c.stroke()
  kontur(c, kapi, 0.9)
  // Çatı (oluklu sac)
  const cati = new Path2D()
  cati.moveTo(3, 28); cati.lineTo(14, 13); cati.lineTo(50, 13); cati.lineTo(61, 28); cati.closePath()
  c.fillStyle = dG(c, 13, 28, ['#B9C3CC', '#7E8A96', '#56606A'])
  c.fill(cati)
  c.save()
  c.clip(cati)
  c.strokeStyle = 'rgba(0,0,0,.25)'
  c.lineWidth = 0.8
  for (let x = 0; x < 64; x += 4) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x + (x - 32) * -0.3 + 0, 12); c.stroke() }
  c.restore()
  kontur(c, cati)
  // Levha
  c.fillStyle = '#F2C14E'
  c.fillRect(25, 29.5, 14, 5)
  c.strokeStyle = '#5A3A10'
  c.lineWidth = 0.6
  c.strokeRect(25, 29.5, 14, 5)
  // Önde yığın
  c.save()
  c.translate(13, 57)
  D.yiginCiz(c, 18, 9, kod, 31)
  c.restore()
  c.save()
  c.translate(52, 57)
  D.yiginCiz(c, 14, 7, kod, 37)
  c.restore()
}

// ── Kontrat: pano üstünde kâğıt, mühür ve cevher ──
function kontrat(c, kod) {
  golge(c, 32, 58, 24, 3.5)
  const pano = new Path2D()
  pano.roundRect ? pano.roundRect(12, 8, 40, 50, 4) : pano.rect(12, 8, 40, 50)
  c.fillStyle = dG(c, 8, 58, ['#B07A44', '#8A5A30', '#5E3C1E'])
  c.fill(pano)
  kontur(c, pano)
  const kagit = new Path2D()
  kagit.rect(16, 13, 32, 41)
  c.fillStyle = dG(c, 13, 54, ['#FFFBF0', '#F1E2C2'])
  c.fill(kagit)
  c.strokeStyle = 'rgba(80,50,20,.4)'
  c.lineWidth = 0.6
  c.stroke(kagit)
  c.strokeStyle = 'rgba(80,60,40,.45)'
  c.lineWidth = 1.2
  for (const [y, w] of [[21, 22], [26, 18], [31, 22], [36, 14]]) { c.beginPath(); c.moveTo(20, y); c.lineTo(20 + w, y); c.stroke() }
  // Mandal
  const mandal = new Path2D()
  mandal.roundRect ? mandal.roundRect(24, 5, 16, 7, 2) : mandal.rect(24, 5, 16, 7)
  c.fillStyle = dG(c, 5, 12, ['#E6ECF2', '#8C98A4', '#4E5862'])
  c.fill(mandal)
  kontur(c, mandal, 0.8)
  // Mühür
  c.fillStyle = dG(c, 40, 54, ['#E0553F', '#A8301F'])
  c.beginPath(); c.arc(41, 47, 6.5, 0, TAU); c.fill()
  c.strokeStyle = 'rgba(255,220,200,.6)'
  c.lineWidth = 0.8
  c.beginPath(); c.arc(41, 47, 4.2, 0, TAU); c.stroke()
  kontur(c, (() => { const p = new Path2D(); p.arc(41, 47, 6.5, 0, TAU); return p })(), 0.8)
  D.kristalCiz(c, 22, 48, 4.4, 0.3, kod, 4)
}

// ── Madalya: kurdele, altın disk, kabartma yıldız ──
function yildizYol(x, y, R, r, n = 5) {
  const p = new Path2D()
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n
    const q = i % 2 ? r : R
    i ? p.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : p.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q)
  }
  p.closePath()
  return p
}
function madalya(c, _kod, ton = '#8A4FD0') {
  hale(c, 32, 36, 30, '#F6C453', 0.3)
  for (const [x0, x1, r] of [[22, 16, ton], [42, 48, koyu(ton, 0.15)]]) {
    const k = new Path2D()
    k.moveTo(x0 - 6, 6); k.lineTo(x0 + 6, 6); k.lineTo(x1 + 6, 40); k.lineTo(x1, 36); k.lineTo(x1 - 6, 40); k.closePath()
    c.fillStyle = dG(c, 6, 40, [acik(r, 0.15), r, koyu(r, 0.3)])
    c.fill(k)
    kontur(c, k, 0.8)
  }
  const disk = new Path2D()
  disk.arc(32, 38, 17, 0, TAU)
  const g = c.createRadialGradient(26, 31, 2, 32, 38, 18)
  g.addColorStop(0, '#FFF2B8'); g.addColorStop(0.45, '#F6C453'); g.addColorStop(1, '#B07818')
  c.fillStyle = g
  c.fill(disk)
  kontur(c, disk)
  c.strokeStyle = 'rgba(120,70,10,.6)'
  c.lineWidth = 1.2
  c.beginPath(); c.arc(32, 38, 13.5, 0, TAU); c.stroke()
  const y = yildizYol(32, 38.5, 10, 4.3)
  c.fillStyle = dG(c, 28, 49, ['#FFF7D6', '#F2B632', '#C98A1E'])
  c.fill(y)
  c.strokeStyle = 'rgba(110,60,0,.7)'
  c.lineWidth = 0.8
  c.stroke(y)
  c.fillStyle = 'rgba(255,255,255,.6)'
  c.beginPath(); c.ellipse(25, 29, 4, 1.6, -0.6, 0, TAU); c.fill()
}

// ── Hediye kutusu: kurdeleli, fiyonklu ──
function hediye(c, _kod, ton = '#C4553B') {
  hale(c, 32, 36, 30, '#F6C453', 0.25)
  golge(c, 32, 57, 24, 4)
  const kutu = new Path2D()
  kutu.rect(12, 30, 40, 26)
  c.fillStyle = dG(c, 30, 56, [acik(ton, 0.1), ton, koyu(ton, 0.3)])
  c.fill(kutu)
  kontur(c, kutu)
  const kapak = new Path2D()
  kapak.rect(9, 22, 46, 10)
  c.fillStyle = dG(c, 22, 32, [acik(ton, 0.3), acik(ton, 0.05), koyu(ton, 0.15)])
  c.fill(kapak)
  kontur(c, kapak)
  c.fillStyle = dG(c, 22, 56, ['#FFE08A', '#F2B632', '#C98A1E'])
  c.fillRect(28.5, 22, 7, 34)
  c.strokeStyle = '#7A4A0A'
  c.lineWidth = 0.7
  c.strokeRect(28.5, 22, 7, 34)
  for (const s of [-1, 1]) {
    const f = new Path2D()
    f.moveTo(32, 21)
    f.bezierCurveTo(32 + s * 6, 8, 32 + s * 17, 12, 32 + s * 12, 19)
    f.bezierCurveTo(32 + s * 9, 22, 32 + s * 4, 22, 32, 21)
    c.fillStyle = dG(c, 8, 22, ['#FFE08A', '#F2B632'])
    c.fill(f)
    c.strokeStyle = '#7A4A0A'
    c.lineWidth = 0.8
    c.stroke(f)
  }
  c.fillStyle = '#F2B632'
  c.beginPath(); c.arc(32, 21, 3, 0, TAU); c.fill()
  c.fillStyle = 'rgba(255,255,255,.35)'
  c.fillRect(13, 31, 14, 2)
}

// ── Sikke yığını ──
function sikke(c) {
  hale(c, 32, 36, 30, '#F6C453', 0.3)
  golge(c, 32, 56, 26, 4)
  const disk = (x, y, r = 11) => {
    c.fillStyle = dG(c, y - 1, y + 5, ['#C98A1E', '#8A5A10'])
    c.beginPath(); c.ellipse(x, y + 2.6, r, r * 0.42, 0, 0, TAU); c.fill()
    c.fillRect(x - r, y, r * 2, 2.6)
    const g = c.createRadialGradient(x - 3, y - 2, 1, x, y, r)
    g.addColorStop(0, '#FFF2B8'); g.addColorStop(0.5, '#F6C453'); g.addColorStop(1, '#C98A1E')
    c.fillStyle = g
    c.beginPath(); c.ellipse(x, y, r, r * 0.42, 0, 0, TAU); c.fill()
    c.strokeStyle = 'rgba(110,60,0,.7)'
    c.lineWidth = 0.7
    c.stroke()
  }
  for (let i = 0; i < 4; i++) disk(20, 52 - i * 3.6)
  for (let i = 0; i < 6; i++) disk(42, 53 - i * 3.6)
  for (let i = 0; i < 2; i++) disk(31, 56 - i * 3.6)
  // Dik duran sikke
  const g = c.createRadialGradient(28, 18, 1, 32, 22, 12)
  g.addColorStop(0, '#FFF2B8'); g.addColorStop(0.5, '#F6C453'); g.addColorStop(1, '#B07818')
  c.fillStyle = g
  c.beginPath(); c.arc(32, 24, 11, 0, TAU); c.fill()
  c.strokeStyle = 'rgba(110,60,0,.8)'
  c.lineWidth = 0.9
  c.stroke()
  c.stroke(yildizYol(32, 24.5, 6, 2.6))
}

// ── Elmas kümesi ──
function tasElmas(c, x, y, s, ton) {
  const ust = [[x - s, y - s * 0.3], [x - s * 0.5, y - s * 0.8], [x + s * 0.5, y - s * 0.8], [x + s, y - s * 0.3]]
  const p = new Path2D()
  p.moveTo(...ust[0]); for (const q of ust.slice(1)) p.lineTo(...q); p.lineTo(x, y + s); p.closePath()
  c.fillStyle = dG(c, y - s, y + s, [acik(ton, 0.55), ton, koyu(ton, 0.35)])
  c.fill(p)
  c.fillStyle = rgba('#FFFFFF', 0.45)
  c.beginPath(); c.moveTo(...ust[1]); c.lineTo(...ust[2]); c.lineTo(x + s * 0.3, y - s * 0.3); c.lineTo(x - s * 0.3, y - s * 0.3); c.closePath(); c.fill()
  c.fillStyle = rgba('#000000', 0.18)
  c.beginPath(); c.moveTo(x, y + s); c.lineTo(x + s, y - s * 0.3); c.lineTo(x + s * 0.3, y - s * 0.3); c.closePath(); c.fill()
  c.strokeStyle = koyu(ton, 0.6)
  c.lineWidth = 0.8
  c.stroke(p)
}
function elmas(c) {
  hale(c, 32, 34, 30, '#7DD3FF', 0.4)
  golge(c, 32, 56, 24, 4)
  tasElmas(c, 20, 44, 9, '#4FB4F0')
  tasElmas(c, 45, 45, 8, '#3F9BE0')
  tasElmas(c, 32, 32, 14, '#6FD0FF')
  c.fillStyle = '#FFFFFF'
  for (const [x, y, r] of [[24, 20, 2.2], [48, 30, 1.6], [14, 34, 1.4]]) {
    c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * 0.5, y); c.lineTo(x, y + r * 2); c.lineTo(x - r * 0.5, y); c.closePath(); c.fill()
    c.beginPath(); c.moveTo(x - r * 2, y); c.lineTo(x, y + r * 0.5); c.lineTo(x + r * 2, y); c.lineTo(x, y - r * 0.5); c.closePath(); c.fill()
  }
}

// ── Kazma ve damar (Madencilik araştırmaları) ──
function kazma(c, kod) {
  hale(c, 32, 34, 30, '#FFC878', 0.28)
  golge(c, 30, 56, 24, 3.5)
  c.save()
  c.translate(28, 56)
  D.yiginCiz(c, 42, 15, kod, 71)
  c.restore()
  c.save()
  c.translate(36, 29)
  c.rotate(0.62)
  const sap = new Path2D()
  sap.roundRect ? sap.roundRect(-3, -7, 6, 36, 2.5) : sap.rect(-3, -7, 6, 36)
  c.fillStyle = yG(c, -3, 3, ['#7A4E2A', '#E0A86A', '#9A6334'])
  c.fill(sap)
  kontur(c, sap, 1)
  c.fillStyle = 'rgba(40,20,5,.5)'
  c.fillRect(-3, 19, 6, 1.4)
  c.fillRect(-3, 23, 6, 1.4)
  const bas = new Path2D()
  bas.moveTo(-23, 6); bas.quadraticCurveTo(-8, -12, 0, -11); bas.quadraticCurveTo(8, -12, 23, 6)
  bas.quadraticCurveTo(10, -4, 0, -3); bas.quadraticCurveTo(-10, -4, -23, 6); bas.closePath()
  c.fillStyle = dG(c, -12, 4, ['#F2F6FA', '#B9C3CC', '#6E7A86'])
  c.fill(bas)
  kontur(c, bas, 1.1)
  c.strokeStyle = 'rgba(255,255,255,.75)'
  c.lineWidth = 0.9
  c.beginPath(); c.moveTo(-15, -2); c.quadraticCurveTo(-6, -9.5, 0, -9.5); c.stroke()
  const bilezik = new Path2D()
  bilezik.rect(-4.5, -12.5, 9, 9)
  c.fillStyle = dG(c, -12.5, -3.5, ['#8C98A4', '#4E5862'])
  c.fill(bilezik)
  kontur(c, bilezik, 0.9)
  c.restore()
}

// ── Deney şişesi: köpüren yeşil sıvı (Araştırma) ──
function sise(c) {
  hale(c, 32, 40, 30, '#6FE08E', 0.3)
  golge(c, 32, 58, 20, 3)
  const p = new Path2D()
  p.moveTo(26, 8); p.lineTo(38, 8); p.lineTo(38, 24); p.lineTo(52, 50)
  p.quadraticCurveTo(55, 57, 48, 57); p.lineTo(16, 57); p.quadraticCurveTo(9, 57, 12, 50); p.lineTo(26, 24); p.closePath()
  c.save()
  c.clip(p)
  c.fillStyle = rgba('#CFEFFF', 0.22)
  c.fillRect(0, 0, 64, 64)
  const sivi = new Path2D()
  sivi.moveTo(0, 38)
  for (let x = 0; x <= 64; x += 8) sivi.quadraticCurveTo(x + 4, 35.5, x + 8, 38)
  sivi.lineTo(64, 64); sivi.lineTo(0, 64); sivi.closePath()
  c.fillStyle = dG(c, 36, 58, ['#8EF0A2', '#2FBF6A', '#13703A'])
  c.fill(sivi)
  c.fillStyle = 'rgba(255,255,255,.75)'
  for (const [x, y, r] of [[28, 46, 2.2], [36, 50, 1.6], [32, 42, 1.3], [40, 44, 1]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill() }
  c.fillStyle = 'rgba(255,255,255,.35)'
  c.fillRect(27.5, 10, 2.4, 14)
  c.restore()
  c.strokeStyle = 'rgba(220,245,255,.9)'
  c.lineWidth = 1.6
  c.stroke(p)
  kontur(c, p, 0.6)
  c.fillStyle = dG(c, 4, 10, ['#B07A44', '#7A4E2A'])
  c.fillRect(24.5, 4, 15, 6)
  c.strokeStyle = '#160E08'
  c.lineWidth = 0.8
  c.strokeRect(24.5, 4, 15, 6)
  c.fillStyle = rgba('#8EF0A2', 0.6)
  for (const [x, y, r] of [[34, 0, 2.4], [29, -1, 1.6]]) { c.beginPath(); c.arc(x, y + 2, r, 0, TAU); c.fill() }
}

// ── Madenci kaskı ve fener (Yönetim) ──
function kask(c, _kod, ton = '#F2B632') {
  hale(c, 32, 30, 30, '#FFE08A', 0.3)
  golge(c, 32, 54, 26, 4)
  const k = new Path2D()
  k.moveTo(10, 44); k.quadraticCurveTo(9, 14, 32, 13); k.quadraticCurveTo(55, 14, 54, 44); k.closePath()
  c.fillStyle = dG(c, 13, 44, [acik(ton, 0.35), ton, koyu(ton, 0.25)])
  c.fill(k)
  c.save()
  c.clip(k)
  c.fillStyle = rgba('#000000', 0.12)
  c.fillRect(30, 12, 4, 34)
  c.fillStyle = 'rgba(255,255,255,.55)'
  c.beginPath(); c.ellipse(21, 24, 6, 2.6, -0.7, 0, TAU); c.fill()
  c.restore()
  kontur(c, k)
  const siper = new Path2D()
  siper.moveTo(4, 46); siper.quadraticCurveTo(32, 38, 60, 46); siper.quadraticCurveTo(61, 51, 56, 51); siper.quadraticCurveTo(32, 45, 8, 51); siper.quadraticCurveTo(3, 51, 4, 46)
  c.fillStyle = dG(c, 40, 51, [ton, koyu(ton, 0.3)])
  c.fill(siper)
  kontur(c, siper, 0.9)
  c.fillStyle = dG(c, 22, 36, ['#8C98A4', '#3E464E'])
  c.beginPath(); c.ellipse(32, 29, 8, 7, 0, 0, TAU); c.fill()
  kontur(c, (() => { const p = new Path2D(); p.ellipse(32, 29, 8, 7, 0, 0, TAU); return p })(), 0.8)
  const g = c.createRadialGradient(31, 28, 0.5, 32, 29, 6)
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#FFE08A'); g.addColorStop(1, '#F6A623')
  c.fillStyle = g
  c.beginPath(); c.ellipse(32, 29, 5.6, 5, 0, 0, TAU); c.fill()
  hale(c, 32, 29, 14, '#FFF2B8', 0.45)
}

// ── Kum saati (zaman atlama) ──
function kumsaati(c) {
  hale(c, 32, 34, 30, '#7DB1F0', 0.3)
  golge(c, 32, 59, 18, 3)
  const cam = new Path2D()
  cam.moveTo(18, 11); cam.lineTo(46, 11); cam.quadraticCurveTo(46, 26, 34.5, 32); cam.quadraticCurveTo(46, 38, 46, 53)
  cam.lineTo(18, 53); cam.quadraticCurveTo(18, 38, 29.5, 32); cam.quadraticCurveTo(18, 26, 18, 11); cam.closePath()
  c.fillStyle = rgba('#CFEFFF', 0.25)
  c.fill(cam)
  c.save()
  c.clip(cam)
  c.fillStyle = dG(c, 18, 53, ['#FFE08A', '#E8A33A'])
  c.beginPath(); c.moveTo(22, 20); c.lineTo(42, 20); c.lineTo(32, 31); c.closePath(); c.fill()
  c.beginPath(); c.moveTo(32, 41); c.quadraticCurveTo(44, 44, 46, 53); c.lineTo(18, 53); c.quadraticCurveTo(20, 44, 32, 41); c.fill()
  c.fillRect(31.3, 30, 1.4, 12)
  c.fillStyle = 'rgba(255,255,255,.4)'
  c.fillRect(21, 13, 2.2, 12)
  c.restore()
  c.strokeStyle = 'rgba(220,245,255,.9)'
  c.lineWidth = 1.4
  c.stroke(cam)
  for (const y of [6, 53]) {
    const t = new Path2D()
    t.roundRect ? t.roundRect(12, y, 40, 6, 2) : t.rect(12, y, 40, 6)
    c.fillStyle = dG(c, y, y + 6, ['#B07A44', '#7A4E2A'])
    c.fill(t)
    kontur(c, t, 0.9)
  }
}

// ── Yıldırım madalyonu (yetenek yenileme) ──
function yildirim(c) {
  hale(c, 32, 32, 30, '#FFD36B', 0.35)
  const disk = new Path2D()
  disk.arc(32, 32, 22, 0, TAU)
  const g = c.createRadialGradient(26, 24, 2, 32, 32, 23)
  g.addColorStop(0, '#5FB4D9'); g.addColorStop(0.6, '#2F6DB8'); g.addColorStop(1, '#173A6A')
  c.fillStyle = g
  c.fill(disk)
  c.strokeStyle = '#F2C14E'
  c.lineWidth = 2.4
  c.stroke(disk)
  kontur(c, (() => { const p = new Path2D(); p.arc(32, 32, 23.5, 0, TAU); return p })(), 0.8)
  const s = new Path2D()
  s.moveTo(36, 12); s.lineTo(22, 35); s.lineTo(31, 35); s.lineTo(27, 52); s.lineTo(43, 27); s.lineTo(34, 27); s.closePath()
  c.fillStyle = dG(c, 12, 52, ['#FFF7D6', '#FFD36B', '#E8A33A'])
  c.fill(s)
  kontur(c, s, 0.9)
}

const CIZIM = { cevher, vagon, kabin, gemi, ambar, kontrat, madalya, hediye, sikke, elmas, kazma, sise, kask, kumsaati, yildirim }

// Simgeyi verilen tuvale çizer (boyut CSS pikseli); aynı simge önbellekten kopyalanır
export function simgeCiz(canvas, ad, kod, boyut, ek) {
  const ciz = CIZIM[ad]
  if (!ciz) return
  const dpr = Math.min((typeof devicePixelRatio === 'number' && devicePixelRatio) || 1, 2)
  const px = Math.round(boyut * dpr)
  const anahtar = ad + '|' + (kod || '') + '|' + (ek || '') + '|' + px
  let kaynak = onbellek.get(anahtar)
  if (!kaynak) {
    if (onbellek.size > 80) onbellek.clear()
    kaynak = document.createElement('canvas')
    kaynak.width = kaynak.height = px
    const c = kaynak.getContext('2d')
    c.scale(px / 64, px / 64)
    ciz(c, kod, ek || undefined)
    onbellek.set(anahtar, kaynak)
  }
  canvas.width = canvas.height = px
  const c = canvas.getContext('2d')
  c.clearRect(0, 0, px, px)
  c.drawImage(kaynak, 0, 0)
}

// ── Arayüz dokuları: sayfa ve pencere arka planı madenin kayası, başlık plakaları kalas ──
// Döşeme bir kez çizilir, blob adresi CSS değişkenine yazılır (--doku-kaya, --doku-tahta).
const dokuAdres = {}
let dokuBolge = ''
function dokuYaz(ad, w, h, ciz) {
  const s = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1)
  const cv = document.createElement('canvas')
  cv.width = Math.round(w * s)
  cv.height = Math.round(h * s)
  const c = cv.getContext('2d')
  c.scale(s, s)
  ciz(c)
  cv.toBlob((b) => {
    if (!b) return
    const eski = dokuAdres[ad]
    dokuAdres[ad] = URL.createObjectURL(b)
    document.documentElement.style.setProperty('--doku-' + ad, `url("${dokuAdres[ad]}")`)
    if (eski) setTimeout(() => URL.revokeObjectURL(eski), 1000)
  })
}
export const KAYA_DOKU = 180
export function arayuzDokulari(kod) {
  if (kod === dokuBolge) return
  const ilk = !dokuBolge
  dokuBolge = kod
  dokuYaz('kaya', KAYA_DOKU, KAYA_DOKU, (c) => D.kayaDokusu(c, KAYA_DOKU, KAYA_DOKU, kod, 4242, 0.8))
  if (ilk) dokuYaz('tahta', 360, 34, (c) => D.tahtaDokusu(c, 360, 34, 77))
}
