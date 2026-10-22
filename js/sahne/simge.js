// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Arayüz simgeleri: sayfalardaki büyük simgeler sahnedeki çizimlerle aynı elden çıkar
// (cevher yığını, maden vagonu, asansör kabini, gemi, ambar, kontrat, madalya, hediye...).
// Hepsi 64×64 birimlik kutuya çizilir; boyuta göre ölçeklenir ve önbellekte tutulur.

import { rastgele, acik, koyu, rgba } from './cizim.js'
import * as D from './dekor.js'
import * as K from './karakter.js'
import { BULUNTULAR } from '../ayar.js'

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

// ════════ Maden Müzesi buluntuları ve yeni sistemlerin simgeleri ════════
// Buluntular 64×64 kutuda aynı elden: hafif hale, yer gölgesi, koyu kontur, metal ve taş geçişleri.
function yuvarlakDik(p, x, y, w, h, r) { if (p.roundRect) p.roundRect(x, y, w, h, r); else p.rect(x, y, w, h) }
const yolYap = (f) => { const p = new Path2D(); f(p); return p }
function doldur(c, p, stil, k = 1) { c.fillStyle = stil; c.fill(p); kontur(c, p, k) }
const metalG = (c, y0, y1, ton) => dG(c, y0, y1, [acik(ton, 0.5), ton, koyu(ton, 0.4)])
const metalY = (c, x0, x1, ton) => yG(c, x0, x1, [koyu(ton, 0.25), acik(ton, 0.45), ton, koyu(ton, 0.4)])
function isilti(c, x, y, rx, ry, a = -0.6, al = 0.6) { c.fillStyle = `rgba(255,255,255,${al})`; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, TAU); c.fill() }
function zemin(c, ton, y = 56) { hale(c, 32, 32, 30, ton, 0.22); golge(c, 32, y, 22, 3.5) }
// Konturlu kalın çizgi (çapa kolu, kantar, nal): önce koyu, sonra renk, üstte ince ışık
function kalin(c, p, k, renk, isik = true) {
  c.lineCap = 'round'; c.lineJoin = 'round'
  c.strokeStyle = '#160E08'; c.lineWidth = k + 2.2; c.stroke(p)
  c.strokeStyle = renk; c.lineWidth = k; c.stroke(p)
  if (isik) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(0.8, k * 0.25); c.save(); c.translate(-k * 0.18, -k * 0.18); c.stroke(p); c.restore() }
}

function lamba(c, ton) {
  zemin(c, '#FFD36B')
  // Ayna ve alev (solda), gövde: üstte su haznesi, altta karbür haznesi
  const ayna = yolYap((p) => p.arc(19, 24, 11, 0, TAU))
  const g = c.createRadialGradient(18, 22, 1, 19, 24, 11)
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#E6ECF2'); g.addColorStop(1, '#8C98A4')
  doldur(c, ayna, g)
  hale(c, 19, 22, 13, '#FFE08A', 0.6)
  const alev = yolYap((p) => { p.moveTo(19, 13); p.quadraticCurveTo(24, 20, 19, 25); p.quadraticCurveTo(14, 20, 19, 13) })
  c.fillStyle = dG(c, 13, 25, ['#FFFFFF', '#FFE08A', '#F6A623']); c.fill(alev)
  c.fillStyle = koyu(ton, 0.35); c.fillRect(22, 24, 9, 3)
  const ust = yolYap((p) => yuvarlakDik(p, 30, 19, 18, 12, 3))
  doldur(c, ust, metalY(c, 30, 48, ton))
  const alt = yolYap((p) => yuvarlakDik(p, 29, 32, 20, 22, 4))
  doldur(c, alt, metalY(c, 29, 49, ton))
  c.fillStyle = koyu(ton, 0.45); c.fillRect(29, 30.5, 20, 2)
  isilti(c, 34, 42, 1.6, 6, 0, 0.5)
  c.strokeStyle = '#3A2A1A'; c.lineWidth = 1.8
  c.beginPath(); c.moveTo(42, 19); c.quadraticCurveTo(42, 9, 50, 10); c.stroke()
}

function kandil(c, ton) {
  zemin(c, '#FFD36B')
  hale(c, 51, 22, 13, '#FFE08A', 0.6)
  const alev = yolYap((p) => { p.moveTo(52, 12); p.quadraticCurveTo(57, 19, 52, 25); p.quadraticCurveTo(47, 19, 52, 12) })
  c.fillStyle = dG(c, 12, 25, ['#FFFFFF', '#FFE08A', '#F6A623']); c.fill(alev)
  const kulp = yolYap((p) => p.arc(11, 37, 6, 0, TAU))
  kalin(c, kulp, 3, ton)
  const g = yolYap((p) => {
    p.moveTo(12, 33); p.bezierCurveTo(12, 52, 44, 52, 50, 36); p.lineTo(56, 27); p.lineTo(46, 30)
    p.bezierCurveTo(38, 27, 20, 26, 12, 33); p.closePath()
  })
  doldur(c, g, metalG(c, 26, 50, ton))
  c.fillStyle = koyu(ton, 0.5); c.beginPath(); c.ellipse(28, 32, 6, 2.2, 0, 0, TAU); c.fill()
  c.strokeStyle = rgba(koyu(ton, 0.4), 0.8); c.lineWidth = 0.9
  for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(20 + k * 7, 41, 2.2, 0, TAU); c.stroke() }
  isilti(c, 22, 37, 5, 1.4, -0.15, 0.55)
}

function yaprak(c, ton) {
  zemin(c, '#C8B48E')
  const tas = yolYap((p) => {
    p.moveTo(9, 24); p.quadraticCurveTo(28, 6, 53, 14); p.quadraticCurveTo(61, 33, 51, 50)
    p.quadraticCurveTo(29, 59, 12, 49); p.quadraticCurveTo(3, 37, 9, 24); p.closePath()
  })
  doldur(c, tas, dG(c, 8, 56, [acik(ton, 0.3), ton, koyu(ton, 0.35)]))
  c.save(); c.clip(tas)
  const izi = (dx, dy, renk, k) => {
    c.strokeStyle = renk; c.lineWidth = k; c.lineCap = 'round'
    c.beginPath(); c.moveTo(16 + dx, 47 + dy); c.quadraticCurveTo(30 + dx, 34 + dy, 47 + dx, 17 + dy); c.stroke()
    for (let i = 1; i < 10; i++) {
      const t = i / 10, x = 16 + 31 * t + dx, y = 47 - 30 * t + dy, u = 9 * (1 - t * 0.7)
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - u * 0.9, y - u * 0.5); c.moveTo(x, y); c.lineTo(x + u * 0.5, y + u * 0.9); c.stroke()
    }
  }
  izi(0.8, 0.8, 'rgba(255,255,255,.25)', 1.6)
  izi(0, 0, koyu(ton, 0.5), 1.6)
  c.restore()
  kontur(c, tas, 1)
}

function ammonit(c, ton) {
  zemin(c, ton)
  const disk = yolYap((p) => p.arc(32, 32, 22, 0, TAU))
  const g = c.createRadialGradient(27, 26, 2, 32, 32, 23)
  g.addColorStop(0, acik(ton, 0.45)); g.addColorStop(0.65, ton); g.addColorStop(1, koyu(ton, 0.4))
  doldur(c, disk, g)
  const r = (a) => 2 + 1.6 * a
  c.strokeStyle = koyu(ton, 0.55); c.lineWidth = 1.5
  c.beginPath()
  for (let a = 0; a <= 4 * Math.PI; a += 0.08) { const x = 32 + r(a) * Math.cos(a), y = 32 + r(a) * Math.sin(a); a ? c.lineTo(x, y) : c.moveTo(x, y) }
  c.stroke()
  c.lineWidth = 0.9
  for (let a = 2 * Math.PI + 0.2; a < 4 * Math.PI; a += 0.32) {
    c.beginPath(); c.moveTo(32 + r(a - 2 * Math.PI) * Math.cos(a), 32 + r(a - 2 * Math.PI) * Math.sin(a)); c.lineTo(32 + r(a) * Math.cos(a), 32 + r(a) * Math.sin(a)); c.stroke()
  }
  isilti(c, 24, 21, 6, 2.2, -0.7, 0.4)
}

function capa(c, ton) {
  zemin(c, '#9FB7C9')
  kalin(c, yolYap((p) => p.arc(32, 10, 4.5, 0, TAU)), 2.6, acik(ton, 0.15))
  kalin(c, yolYap((p) => { p.moveTo(32, 15); p.lineTo(32, 52) }), 5, ton)
  kalin(c, yolYap((p) => { p.moveTo(20, 21); p.lineTo(44, 21) }), 4.5, ton)
  kalin(c, yolYap((p) => { p.moveTo(12, 36); p.quadraticCurveTo(14, 52, 32, 52); p.quadraticCurveTo(50, 52, 52, 36) }), 4.5, ton)
  for (const s of [-1, 1]) {
    const u = yolYap((p) => { p.moveTo(32 + s * 20, 33); p.lineTo(32 + s * 25, 41); p.lineTo(32 + s * 16, 40); p.closePath() })
    doldur(c, u, metalG(c, 33, 41, ton))
  }
}

function antik(c, ton) {
  zemin(c, ton)
  const r = rastgele(91)
  const kenar = yolYap((p) => {
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU, rr = 21 + (r() - 0.5) * 2.2
      const x = 32 + rr * Math.cos(a), y = 32 + rr * Math.sin(a)
      k ? p.lineTo(x, y) : p.moveTo(x, y)
    }
    p.closePath()
  })
  const g = c.createRadialGradient(26, 25, 2, 32, 32, 23)
  g.addColorStop(0, acik(ton, 0.5)); g.addColorStop(0.6, ton); g.addColorStop(1, koyu(ton, 0.45))
  doldur(c, kenar, g)
  c.fillStyle = koyu(ton, 0.35)
  for (let k = 0; k < 22; k++) { const a = (k / 22) * TAU; c.beginPath(); c.arc(32 + 17.5 * Math.cos(a), 32 + 17.5 * Math.sin(a), 0.9, 0, TAU); c.fill() }
  // Kabartma baş (profil): başlık, yüz, boyun
  const bas = yolYap((p) => {
    p.moveTo(26, 44); p.lineTo(27, 37); p.quadraticCurveTo(22, 34, 23, 27); p.quadraticCurveTo(24, 19, 32, 18)
    p.quadraticCurveTo(40, 18, 41, 26); p.lineTo(43.5, 30); p.lineTo(41, 31); p.quadraticCurveTo(41, 36, 37, 37); p.lineTo(38, 44); p.closePath()
  })
  c.fillStyle = dG(c, 18, 44, [acik(ton, 0.3), koyu(ton, 0.15)]); c.fill(bas)
  c.strokeStyle = koyu(ton, 0.5); c.lineWidth = 0.9; c.stroke(bas)
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(25, 26); c.quadraticCurveTo(26, 20, 32, 19.5); c.stroke()
}

function civi(c, ton) {
  zemin(c, '#9FB7C9')
  c.save(); c.translate(32, 33); c.rotate(-0.55)
  const g = yolYap((p) => { p.moveTo(-3.5, -16); p.lineTo(3.5, -16); p.lineTo(3.5, 15); p.lineTo(0, 22); p.lineTo(-3.5, 15); p.closePath() })
  doldur(c, g, metalY(c, -4, 4, ton))
  const bas = yolYap((p) => { p.moveTo(-4.5, -22); p.lineTo(12, -22); p.quadraticCurveTo(14, -19, 11, -17); p.lineTo(-4.5, -15); p.closePath() })
  doldur(c, bas, metalG(c, -22, -15, ton))
  c.restore()
  c.fillStyle = rgba('#A0522D', 0.55)
  for (const [x, y, rr] of [[30, 38, 2], [37, 27, 1.6], [26, 44, 1.3]]) { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill() }
}

function anahtar(c, ton) {
  zemin(c, '#9FB7C9')
  c.save(); c.translate(32, 32); c.rotate(-0.75)
  kalin(c, yolYap((p) => p.arc(0, -17, 7, 0, TAU)), 3.4, ton)
  kalin(c, yolYap((p) => p.arc(0, -17, 2.6, 0, TAU)), 1.6, ton, false)
  kalin(c, yolYap((p) => { p.moveTo(0, -10); p.lineTo(0, 22) }), 3.6, ton)
  const dis = yolYap((p) => { p.moveTo(1.5, 12); p.lineTo(9, 12); p.lineTo(9, 15); p.lineTo(6, 15); p.lineTo(6, 18); p.lineTo(9, 18); p.lineTo(9, 22); p.lineTo(1.5, 22); p.closePath() })
  doldur(c, dis, metalG(c, 12, 22, ton), 0.9)
  c.restore()
}

function balta(c, ton) {
  zemin(c, '#FFC878')
  c.save(); c.translate(32, 34); c.rotate(0.5)
  const sap = yolYap((p) => yuvarlakDik(p, -2.6, -14, 5.2, 36, 2))
  doldur(c, sap, yG(c, -3, 3, ['#7A4E2A', '#D69A5C', '#8A5A30']))
  c.restore()
  c.save(); c.translate(27, 25); c.rotate(-0.35)
  const bas = yolYap((p) => { p.moveTo(-4, -5); p.lineTo(4, -5); p.lineTo(13, -12); p.quadraticCurveTo(19, 0, 13, 12); p.lineTo(4, 5); p.lineTo(-4, 5); p.closePath() })
  doldur(c, bas, metalG(c, -12, 12, ton))
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1
  c.beginPath(); c.moveTo(13.5, -9); c.quadraticCurveTo(17.5, 0, 13.5, 9); c.stroke()
  c.restore()
  c.fillStyle = rgba('#3FA88E', 0.5)
  for (const [x, y] of [[24, 23], [29, 30], [21, 28]]) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill() }
}

function kap(c, ton) {
  zemin(c, ton)
  const govde = yolYap((p) => { p.moveTo(10, 33); p.quadraticCurveTo(12, 52, 32, 52); p.quadraticCurveTo(52, 52, 54, 33); p.closePath() })
  doldur(c, govde, metalY(c, 10, 54, ton))
  const kapak = yolYap((p) => { p.moveTo(12, 33); p.quadraticCurveTo(14, 18, 32, 18); p.quadraticCurveTo(50, 18, 52, 33); p.closePath() })
  doldur(c, kapak, metalG(c, 18, 33, ton))
  const tepe = yolYap((p) => { p.ellipse(32, 17, 4, 2.6, 0, 0, TAU) })
  doldur(c, tepe, metalG(c, 14, 20, acik(ton, 0.1)), 0.9)
  c.fillStyle = koyu(ton, 0.5); c.fillRect(9, 32, 46, 2.4)
  c.strokeStyle = rgba(koyu(ton, 0.5), 0.7); c.lineWidth = 0.8
  for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(16 + k * 5.4, 37); c.lineTo(17 + k * 5.4, 44); c.stroke() }
  isilti(c, 22, 25, 6, 1.8, -0.3, 0.5)
}

function testi(c, ton) {
  zemin(c, ton)
  const g = yolYap((p) => {
    p.moveTo(26, 10); p.lineTo(38, 10); p.lineTo(37, 17); p.quadraticCurveTo(52, 24, 50, 39); p.quadraticCurveTo(48, 54, 32, 54)
    p.quadraticCurveTo(16, 54, 14, 39); p.quadraticCurveTo(12, 24, 27, 17); p.closePath()
  })
  doldur(c, g, yG(c, 13, 51, [koyu(ton, 0.25), acik(ton, 0.3), ton, koyu(ton, 0.35)]))
  c.save(); c.clip(g)
  c.strokeStyle = '#2A1A10'; c.lineWidth = 1.6
  c.beginPath()
  for (let x = 12; x <= 52; x += 5) { c.lineTo(x, 31); c.lineTo(x + 2.5, 36) }
  c.stroke()
  c.fillStyle = '#2A1A10'; c.fillRect(10, 24, 44, 2); c.fillRect(10, 41, 44, 2)
  for (let x = 16; x < 50; x += 6) { c.beginPath(); c.arc(x, 47, 1.2, 0, TAU); c.fill() }
  c.restore()
  kontur(c, g)
  kalin(c, yolYap((p) => { p.moveTo(38, 14); p.quadraticCurveTo(50, 12, 48, 26) }), 2.6, ton, false)
  isilti(c, 22, 30, 2, 6, 0.2, 0.4)
}

function teker(c, ton) {
  zemin(c, '#9FB7C9')
  const jant = yolYap((p) => { p.arc(32, 32, 22, 0, TAU); p.arc(32, 32, 16, 0, TAU, true) })
  doldur(c, jant, metalG(c, 10, 54, ton))
  c.strokeStyle = '#160E08'; c.lineWidth = 1
  c.beginPath(); c.arc(32, 32, 19, 0, TAU); c.stroke()
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + 0.3
    kalin(c, yolYap((p) => { p.moveTo(32 + 4 * Math.cos(a), 32 + 4 * Math.sin(a)); p.lineTo(32 + 16 * Math.cos(a), 32 + 16 * Math.sin(a)) }), 3, ton, false)
  }
  const gobek = yolYap((p) => p.arc(32, 32, 6, 0, TAU))
  doldur(c, gobek, metalG(c, 26, 38, acik(ton, 0.1)))
  c.fillStyle = '#160E08'; c.beginPath(); c.arc(32, 32, 2, 0, TAU); c.fill()
  isilti(c, 20, 18, 6, 1.6, -0.8, 0.4)
}

function belge(c, ton) {
  zemin(c, '#E8DCC0')
  c.save(); c.translate(32, 32); c.rotate(-0.12)
  const k = yolYap((p) => yuvarlakDik(p, -19, -23, 38, 46, 2))
  doldur(c, k, dG(c, -23, 23, [acik(ton, 0.3), ton, koyu(ton, 0.15)]))
  c.strokeStyle = '#6E8A5A'; c.lineWidth = 1.4; c.strokeRect(-15.5, -19.5, 31, 39)
  c.lineWidth = 0.6; c.strokeRect(-13.5, -17.5, 27, 35)
  c.fillStyle = '#4A3A28'
  c.fillRect(-9, -14, 18, 2.4)
  for (let s = 0; s < 5; s++) c.fillRect(-10, -7 + s * 4, s === 4 ? 12 : 20, 1.1)
  c.fillStyle = dG(c, 7, 19, ['#E86A5A', '#B0302A']); c.beginPath(); c.arc(7, 12, 5.5, 0, TAU); c.fill()
  c.strokeStyle = '#160E08'; c.lineWidth = 0.8; c.stroke()
  c.restore()
}

function tomar(c, ton) {
  zemin(c, '#E6D3A8')
  const kagit = yolYap((p) => { p.moveTo(14, 17); p.lineTo(50, 17); p.lineTo(50, 47); p.lineTo(14, 47); p.closePath() })
  doldur(c, kagit, dG(c, 17, 47, [acik(ton, 0.35), ton, koyu(ton, 0.1)]))
  c.fillStyle = rgba('#4A3A28', 0.7)
  for (let s = 0; s < 5; s++) c.fillRect(18, 22 + s * 4.6, s === 4 ? 14 : 28, 1.1)
  for (const y of [17, 47]) {
    const r = yolYap((p) => yuvarlakDik(p, 9, y - 4.5, 46, 9, 4.5))
    doldur(c, r, metalG(c, y - 4.5, y + 4.5, koyu(ton, 0.08)))
    c.fillStyle = '#7A4E2A'
    for (const x of [6, 55]) { c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill(); c.strokeStyle = '#160E08'; c.lineWidth = 0.8; c.stroke() }
  }
  c.fillStyle = dG(c, 36, 46, ['#E86A5A', '#B0302A']); c.beginPath(); c.arc(42, 41, 4.2, 0, TAU); c.fill()
  c.strokeStyle = '#160E08'; c.lineWidth = 0.8; c.stroke()
}

function keski(c, ton) {
  zemin(c, '#9FB7C9')
  c.save(); c.translate(32, 32); c.rotate(0.75)
  const sap = yolYap((p) => yuvarlakDik(p, -4, -24, 8, 16, 2))
  doldur(c, sap, yG(c, -4, 4, ['#7A4E2A', '#D69A5C', '#8A5A30']))
  c.fillStyle = 'rgba(40,20,5,.5)'; c.fillRect(-4, -20, 8, 1.2); c.fillRect(-4, -15, 8, 1.2)
  const bicak = yolYap((p) => { p.moveTo(-3, -8); p.lineTo(3, -8); p.lineTo(3, 14); p.lineTo(5, 24); p.lineTo(-5, 24); p.lineTo(-3, 14); p.closePath() })
  doldur(c, bicak, metalY(c, -5, 5, ton))
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-4.4, 23); c.lineTo(4.4, 23); c.stroke()
  c.restore()
  c.fillStyle = rgba('#FFFFFF', 0.75)
  for (const [x, y, rr] of [[14, 50, 1.6], [10, 46, 1], [18, 54, 1.2]]) { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill() }
}

function sutun(c, ton) {
  zemin(c, '#EDE8DE')
  const govde = yolYap((p) => p.rect(20, 30, 24, 26))
  doldur(c, govde, yG(c, 20, 44, [koyu(ton, 0.2), acik(ton, 0.3), ton, koyu(ton, 0.25)]))
  c.strokeStyle = rgba(koyu(ton, 0.45), 0.8); c.lineWidth = 1
  for (let x = 24; x < 44; x += 4) { c.beginPath(); c.moveTo(x, 31); c.lineTo(x, 56); c.stroke() }
  const abakus = yolYap((p) => p.rect(8, 16, 48, 6))
  doldur(c, abakus, dG(c, 16, 22, [acik(ton, 0.4), koyu(ton, 0.15)]))
  const yastik = yolYap((p) => { p.rect(14, 22, 36, 8) })
  doldur(c, yastik, dG(c, 22, 30, [ton, koyu(ton, 0.2)]))
  for (const s of [-1, 1]) {
    const x = 32 + s * 17
    const vol = yolYap((p) => p.arc(x, 28, 7, 0, TAU))
    doldur(c, vol, dG(c, 21, 35, [acik(ton, 0.35), koyu(ton, 0.2)]))
    c.strokeStyle = koyu(ton, 0.45); c.lineWidth = 1
    c.beginPath()
    for (let a = 0; a < 3 * Math.PI; a += 0.15) { const rr = 6 - a * 0.55; c.lineTo(x + s * rr * Math.cos(a), 28 + rr * Math.sin(a)) }
    c.stroke()
  }
  c.fillStyle = rgba(koyu(ton, 0.5), 0.6)
  c.beginPath(); c.moveTo(46, 40); c.lineTo(44, 47); c.lineTo(47, 52); c.lineTo(44, 56); c.lineTo(44, 40); c.fill()
}

function tas(c, ton) {
  zemin(c, '#C9B894')
  const r = rastgele(57)
  const blok = yolYap((p) => {
    p.moveTo(9 + r() * 3, 14 + r() * 3); p.lineTo(55 - r() * 3, 12 + r() * 3); p.lineTo(57 - r() * 2, 50 - r() * 3)
    p.lineTo(8 + r() * 3, 53 - r() * 2); p.closePath()
  })
  doldur(c, blok, dG(c, 12, 54, [acik(ton, 0.3), ton, koyu(ton, 0.3)]))
  // Frig süslemesi: iç içe kareler ve meander
  const oyuk = (dx, dy, renk) => {
    c.strokeStyle = renk; c.lineWidth = 1.8
    c.strokeRect(16 + dx, 20 + dy, 14, 14); c.strokeRect(20 + dx, 24 + dy, 6, 6)
    c.strokeRect(34 + dx, 20 + dy, 14, 14); c.strokeRect(38 + dx, 24 + dy, 6, 6)
    c.beginPath(); c.moveTo(14 + dx, 44 + dy)
    for (let x = 14; x < 50; x += 8) { c.lineTo(x + dx, 40 + dy); c.lineTo(x + 4 + dx, 40 + dy); c.lineTo(x + 4 + dx, 44 + dy); c.lineTo(x + 8 + dx, 44 + dy) }
    c.stroke()
  }
  oyuk(0.8, 0.8, 'rgba(255,255,255,.3)')
  oyuk(0, 0, koyu(ton, 0.45))
}

// Kale taşı: mazgallı sur parçası, yontma taş sıraları
function kale(c, ton) {
  zemin(c, '#C9B894')
  const sur = yolYap((p) => {
    p.moveTo(10, 54); p.lineTo(10, 18); p.lineTo(18, 18); p.lineTo(18, 12); p.lineTo(26, 12); p.lineTo(26, 18)
    p.lineTo(38, 18); p.lineTo(38, 12); p.lineTo(46, 12); p.lineTo(46, 18); p.lineTo(54, 18); p.lineTo(54, 54); p.closePath()
  })
  doldur(c, sur, dG(c, 12, 54, [acik(ton, 0.3), ton, koyu(ton, 0.3)]))
  c.save(); c.clip(sur)
  c.strokeStyle = koyu(ton, 0.45); c.lineWidth = 1.2
  for (let y = 24, s = 0; y < 54; y += 7, s++) {
    c.beginPath(); c.moveTo(10, y); c.lineTo(54, y); c.stroke()
    for (let x = 10 + (s % 2) * 6; x < 54; x += 12) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 7); c.stroke() }
  }
  c.fillStyle = '#2A1A10'
  c.beginPath(); c.moveTo(27, 54); c.lineTo(27, 41); c.quadraticCurveTo(32, 34, 37, 41); c.lineTo(37, 54); c.closePath(); c.fill()
  c.restore()
  kontur(c, sur, 1)
}

function kantar(c, ton) {
  zemin(c, '#FFD36B')
  kalin(c, yolYap((p) => { p.moveTo(32, 4); p.lineTo(32, 13) }), 1.6, '#3A2A1A', false)
  kalin(c, yolYap((p) => p.arc(32, 15, 2.6, 0, TAU)), 1.6, ton, false)
  kalin(c, yolYap((p) => { p.moveTo(8, 20); p.lineTo(56, 18) }), 3.4, ton)
  c.fillStyle = '#160E08'
  for (let x = 36; x < 56; x += 4) c.fillRect(x, 16.6, 0.8, 2.4)
  kalin(c, yolYap((p) => { p.moveTo(12, 20); p.lineTo(12, 30) }), 1.2, '#3A2A1A', false)
  const kefe = yolYap((p) => { p.moveTo(2, 30); p.lineTo(22, 30); p.quadraticCurveTo(20, 40, 12, 40); p.quadraticCurveTo(4, 40, 2, 30); p.closePath() })
  doldur(c, kefe, metalG(c, 30, 40, ton))
  doldur(c, yolYap((p) => p.ellipse(12, 29, 7, 3, 0, 0, TAU)), '#E8D04A', 0.8)
  kalin(c, yolYap((p) => { p.moveTo(46, 19); p.lineTo(46, 33) }), 1.2, '#3A2A1A', false)
  const ag = yolYap((p) => { p.moveTo(41, 33); p.lineTo(51, 33); p.lineTo(53, 46); p.quadraticCurveTo(46, 50, 39, 46); p.closePath() })
  doldur(c, ag, metalY(c, 39, 53, '#6E7A86'))
}

function duduk(c, ton) {
  zemin(c, '#FFD36B')
  c.fillStyle = rgba('#FFFFFF', 0.55)
  for (const [x, y, rr] of [[38, 9, 4.5], [45, 5, 3.6], [31, 6, 3]]) { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill() }
  const kubbe = yolYap((p) => { p.moveTo(22, 20); p.quadraticCurveTo(22, 11, 32, 11); p.quadraticCurveTo(42, 11, 42, 20); p.closePath() })
  doldur(c, kubbe, metalG(c, 11, 20, ton))
  const govde = yolYap((p) => yuvarlakDik(p, 22, 19, 20, 22, 2))
  doldur(c, govde, metalY(c, 22, 42, ton))
  c.fillStyle = '#160E08'; c.fillRect(24, 31, 16, 3)
  const boru = yolYap((p) => p.rect(28, 41, 8, 13))
  doldur(c, boru, metalY(c, 28, 36, koyu(ton, 0.1)))
  kalin(c, yolYap((p) => { p.moveTo(36, 46); p.lineTo(50, 40) }), 2.4, '#4E5862')
  doldur(c, yolYap((p) => p.arc(51, 39.5, 3, 0, TAU)), '#B03E2C', 0.8)
  isilti(c, 26, 26, 1.4, 5, 0, 0.55)
}

function elek(c, ton) {
  zemin(c, '#FFD84A')
  const dis = yolYap((p) => p.ellipse(32, 34, 26, 15, 0, 0, TAU))
  doldur(c, dis, dG(c, 19, 49, [acik(ton, 0.3), ton, koyu(ton, 0.3)]))
  const ic = yolYap((p) => p.ellipse(32, 33, 21, 11, 0, 0, TAU))
  c.fillStyle = '#3A2A1A'; c.fill(ic)
  c.save(); c.clip(ic)
  c.strokeStyle = 'rgba(200,190,170,.55)'; c.lineWidth = 0.6
  for (let x = 10; x < 56; x += 3) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x + 6, 46); c.stroke() }
  for (let y = 20; y < 46; y += 3) { c.beginPath(); c.moveTo(8, y); c.lineTo(56, y + 2); c.stroke() }
  c.restore()
  kontur(c, ic, 1)
  for (const [x, y, rr] of [[26, 33, 3], [36, 30, 2.4], [32, 37, 2], [41, 35, 1.6]]) {
    doldur(c, yolYap((p) => p.arc(x, y, rr, 0, TAU)), dG(c, y - rr, y + rr, ['#FFF4B0', '#F2C14E', '#B8860B']), 0.6)
  }
  hale(c, 32, 33, 16, '#FFE08A', 0.3)
}

function bros(c, ton) {
  zemin(c, '#BFE6F0')
  c.strokeStyle = '#160E08'; c.lineWidth = 3.2
  const ilmek = (renk, k) => {
    c.strokeStyle = renk; c.lineWidth = k
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU
      c.beginPath(); c.ellipse(32 + 13 * Math.cos(a), 32 + 13 * Math.sin(a), 8, 4.2, a, 0, TAU); c.stroke()
    }
    c.beginPath(); c.arc(32, 32, 22, 0, TAU); c.stroke()
  }
  ilmek('#160E08', 3.4)
  ilmek(ton, 1.6)
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.6
  c.beginPath(); c.arc(32, 32, 21.6, Math.PI * 1.1, Math.PI * 1.6); c.stroke()
  const tas2 = yolYap((p) => p.arc(32, 32, 7, 0, TAU))
  const g = c.createRadialGradient(30, 30, 0.5, 32, 32, 7)
  g.addColorStop(0, '#E8F6FF'); g.addColorStop(0.4, '#4A90E2'); g.addColorStop(1, '#173A6A')
  doldur(c, tas2, g)
  isilti(c, 29.5, 29.5, 2, 1.2, -0.6, 0.85)
}

function can(c, ton) {
  zemin(c, '#FFC878')
  kalin(c, yolYap((p) => { p.moveTo(32, 3); p.lineTo(32, 9) }), 2.6, '#7A4E2A', false)
  kalin(c, yolYap((p) => p.arc(32, 10.5, 3.2, 0, TAU)), 2, ton, false)
  const g = yolYap((p) => {
    p.moveTo(24, 16); p.quadraticCurveTo(32, 11, 40, 16); p.quadraticCurveTo(43, 30, 45, 40); p.quadraticCurveTo(52, 44, 52, 47)
    p.lineTo(12, 47); p.quadraticCurveTo(12, 44, 19, 40); p.quadraticCurveTo(21, 30, 24, 16); p.closePath()
  })
  doldur(c, g, yG(c, 12, 52, [koyu(ton, 0.3), acik(ton, 0.45), ton, koyu(ton, 0.45)]))
  c.strokeStyle = koyu(ton, 0.5); c.lineWidth = 1
  c.beginPath(); c.moveTo(18, 41.5); c.quadraticCurveTo(32, 44, 46, 41.5); c.stroke()
  const dil = yolYap((p) => p.arc(32, 51, 3.6, 0, TAU))
  doldur(c, dil, metalG(c, 47, 55, '#5E6A74'), 0.9)
  isilti(c, 26, 26, 1.6, 7, 0.15, 0.5)
}

function kurek(c, ton) {
  zemin(c, '#7DB1F0')
  c.save(); c.translate(32, 32); c.rotate(-0.7)
  const sap = yolYap((p) => yuvarlakDik(p, -2.4, -28, 4.8, 36, 2))
  doldur(c, sap, yG(c, -3, 3, [koyu(ton, 0.2), acik(ton, 0.4), koyu(ton, 0.25)]))
  const tutamak = yolYap((p) => yuvarlakDik(p, -3.4, -30, 6.8, 8, 2.5))
  doldur(c, tutamak, yG(c, -3.4, 3.4, ['#3A2A1A', '#6B4425']))
  const pala = yolYap((p) => { p.moveTo(-2.4, 6); p.quadraticCurveTo(-8, 12, -7, 26); p.quadraticCurveTo(0, 31, 7, 26); p.quadraticCurveTo(8, 12, 2.4, 6); p.closePath() })
  doldur(c, pala, yG(c, -8, 8, [koyu(ton, 0.15), acik(ton, 0.35), ton, koyu(ton, 0.3)]))
  c.strokeStyle = rgba(koyu(ton, 0.5), 0.6); c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 9); c.lineTo(0, 27); c.stroke()
  c.restore()
}

function nal(c, ton) {
  zemin(c, '#9FB7C9')
  const p = yolYap((y) => { y.moveTo(17, 50); y.lineTo(15, 32); y.quadraticCurveTo(14, 12, 32, 12); y.quadraticCurveTo(50, 12, 49, 32); y.lineTo(47, 50) })
  kalin(c, p, 8, ton)
  c.fillStyle = '#160E08'
  for (const [x, y] of [[17.5, 42], [16, 32], [19, 22], [46.5, 42], [48, 32], [45, 22], [26, 15.5], [38, 15.5]]) { c.beginPath(); c.arc(x, y, 1.2, 0, TAU); c.fill() }
}

function miknatis(c, ton) {
  zemin(c, ton)
  c.strokeStyle = rgba('#7DD3FF', 0.7); c.lineWidth = 1.2
  for (const r of [26, 31]) { c.beginPath(); c.arc(32, 46, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke() }
  const u = yolYap((p) => { p.moveTo(14, 54); p.lineTo(14, 30); p.quadraticCurveTo(14, 12, 32, 12); p.quadraticCurveTo(50, 12, 50, 30); p.lineTo(50, 54) })
  c.lineCap = 'butt'
  c.strokeStyle = '#160E08'; c.lineWidth = 15; c.stroke(u)
  c.strokeStyle = ton; c.lineWidth = 12.6; c.stroke(u)
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.save(); c.translate(-2.5, -2); c.stroke(u); c.restore()
  for (const x of [14, 50]) {
    const uc = yolYap((p) => p.rect(x - 6.3, 45, 12.6, 9))
    doldur(c, uc, metalY(c, x - 6.3, x + 6.3, '#C9D2DA'))
  }
}

function defter(c, ton) {
  zemin(c, '#FFC878')
  c.save(); c.translate(32, 33); c.rotate(-0.1)
  const sayfa = yolYap((p) => yuvarlakDik(p, -17, -21, 36, 44, 2))
  doldur(c, sayfa, '#F2E6CC', 0.8)
  const kapak = yolYap((p) => yuvarlakDik(p, -20, -23, 37, 45, 3))
  doldur(c, kapak, dG(c, -23, 22, [acik(ton, 0.25), ton, koyu(ton, 0.35)]))
  c.strokeStyle = rgba(acik(ton, 0.5), 0.6); c.lineWidth = 1; c.strokeRect(-16, -19, 29, 37)
  c.fillStyle = '#F2C14E'; c.font = '700 9px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillText('K.D.', -1.5, -4)
  c.fillStyle = '#B03E2C'; c.fillRect(6, 20, 3.6, 9)
  kalin(c, yolYap((p) => { p.moveTo(-20, 6); p.lineTo(17, 6) }), 2.4, koyu(ton, 0.4), false)
  c.restore()
}

// ── Sondaj makinesi (sert kaya) ──
function matkap(c) {
  hale(c, 32, 30, 30, '#FFC878', 0.3)
  golge(c, 32, 57, 24, 3.5)
  c.save(); c.translate(32, 56); D.yiginCiz(c, 50, 14, 'karabuk', 33); c.restore()
  for (const s of [-1, 1]) kalin(c, yolYap((p) => { p.moveTo(32, 6); p.lineTo(32 + s * 16, 50) }), 3, '#F2B632')
  kalin(c, yolYap((p) => { p.moveTo(22, 30); p.lineTo(42, 30) }), 2.4, '#F2B632')
  const motor = yolYap((p) => yuvarlakDik(p, 24, 10, 16, 12, 2.5))
  doldur(c, motor, dG(c, 10, 22, ['#FFE08A', '#F2B632', '#B07A1E']))
  c.fillStyle = '#160E08'; for (let x = 27; x < 38; x += 3) c.fillRect(x, 13, 1.2, 6)
  const mil = yolYap((p) => { p.moveTo(29.5, 22); p.lineTo(34.5, 22); p.lineTo(34.5, 44); p.lineTo(32, 52); p.lineTo(29.5, 44); p.closePath() })
  doldur(c, mil, metalY(c, 29, 35, '#8C98A4'), 0.9)
  c.strokeStyle = '#3E464E'; c.lineWidth = 1
  for (let y = 25; y < 44; y += 3.4) { c.beginPath(); c.moveTo(29.5, y); c.lineTo(34.5, y + 2.2); c.stroke() }
  c.fillStyle = '#FFE08A'
  for (const [x, y, rr] of [[25, 49, 1.4], [40, 48, 1.2], [37, 52, 1], [27, 53, 1]]) { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill() }
}

// ── Pusula (keşif) ──
function pusula(c) {
  hale(c, 32, 32, 30, '#7DB1F0', 0.3)
  golge(c, 32, 57, 22, 3.5)
  const kasa = yolYap((p) => p.arc(32, 33, 22, 0, TAU))
  doldur(c, kasa, metalY(c, 10, 54, '#C9A040'))
  kalin(c, yolYap((p) => p.arc(32, 9, 3.4, 0, TAU)), 2, '#C9A040', false)
  const yuz = yolYap((p) => p.arc(32, 33, 17.5, 0, TAU))
  doldur(c, yuz, dG(c, 15, 51, ['#FFFBEF', '#EADFC4']), 0.9)
  c.strokeStyle = '#4A3A28'; c.lineWidth = 0.9
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU, r0 = k % 4 ? 15 : 13
    c.beginPath(); c.moveTo(32 + r0 * Math.cos(a), 33 + r0 * Math.sin(a)); c.lineTo(32 + 17 * Math.cos(a), 33 + 17 * Math.sin(a)); c.stroke()
  }
  c.save(); c.translate(32, 33); c.rotate(0.5)
  c.fillStyle = '#D0413A'; c.beginPath(); c.moveTo(0, -14); c.lineTo(4, 0); c.lineTo(-4, 0); c.closePath(); c.fill()
  c.fillStyle = '#3E464E'; c.beginPath(); c.moveTo(0, 14); c.lineTo(4, 0); c.lineTo(-4, 0); c.closePath(); c.fill()
  c.restore()
  c.fillStyle = '#C9A040'; c.beginPath(); c.arc(32, 33, 2.4, 0, TAU); c.fill()
  isilti(c, 24, 24, 6, 2.4, -0.7, 0.5)
}

// ── Müze binası: alınlık, sütunlar, basamaklar ──
function muze(c) {
  hale(c, 32, 30, 30, '#F6C453', 0.28)
  golge(c, 32, 58, 26, 3.5)
  const tas3 = '#E6E0D2'
  const alin = yolYap((p) => { p.moveTo(6, 22); p.lineTo(32, 7); p.lineTo(58, 22); p.closePath() })
  doldur(c, alin, dG(c, 7, 22, [acik(tas3, 0.4), tas3, koyu(tas3, 0.2)]))
  doldur(c, yolYap((p) => p.arc(32, 17, 3, 0, TAU)), '#F2C14E', 0.7)
  const kiris = yolYap((p) => p.rect(7, 22, 50, 5))
  doldur(c, kiris, dG(c, 22, 27, [tas3, koyu(tas3, 0.2)]))
  for (let k = 0; k < 4; k++) {
    const x = 11 + k * 12.4
    const s = yolYap((p) => p.rect(x, 27, 6, 21))
    doldur(c, s, yG(c, x, x + 6, [koyu(tas3, 0.2), acik(tas3, 0.4), koyu(tas3, 0.25)]), 0.8)
  }
  c.fillStyle = '#3A2A1A'; c.fillRect(28.6, 34, 6.8, 14)
  for (let k = 0; k < 2; k++) {
    const b = yolYap((p) => p.rect(5 - k * 2, 48 + k * 4, 54 + k * 4, 4))
    doldur(c, b, dG(c, 48 + k * 4, 52 + k * 4, [tas3, koyu(tas3, 0.25)]), 0.8)
  }
}

// ── Elmas kumbarası: pembe domuz, sırtında elmas ──
function kumbara(c) {
  hale(c, 32, 34, 30, '#FF9EC4', 0.3)
  golge(c, 32, 56, 24, 3.5)
  const pembe = '#F39AB8'
  for (const x of [20, 40]) { const a = yolYap((p) => yuvarlakDik(p, x, 44, 7, 10, 2)); doldur(c, a, dG(c, 44, 54, [pembe, koyu(pembe, 0.3)]), 0.9) }
  const govde = yolYap((p) => p.ellipse(32, 36, 22, 15, 0, 0, TAU))
  doldur(c, govde, dG(c, 21, 51, [acik(pembe, 0.35), pembe, koyu(pembe, 0.3)]))
  const kulak = yolYap((p) => { p.moveTo(18, 24); p.lineTo(16, 14); p.lineTo(25, 21); p.closePath() })
  doldur(c, kulak, dG(c, 14, 24, [pembe, koyu(pembe, 0.25)]), 0.9)
  const burun = yolYap((p) => p.ellipse(10, 37, 4.4, 5.6, 0, 0, TAU))
  doldur(c, burun, dG(c, 31, 43, [acik(pembe, 0.2), koyu(pembe, 0.2)]), 0.9)
  c.fillStyle = koyu(pembe, 0.55)
  for (const y of [35, 39]) { c.beginPath(); c.arc(9.6, y, 0.9, 0, TAU); c.fill() }
  c.fillStyle = '#160E08'; c.beginPath(); c.arc(19, 31, 1.6, 0, TAU); c.fill()
  c.fillStyle = '#5A2E3A'; c.fillRect(28, 21.2, 10, 2)
  // Sırtına düşen elmas
  c.save(); c.translate(33, 11)
  const e = yolYap((p) => { p.moveTo(-6, -2); p.lineTo(-3.4, -6); p.lineTo(3.4, -6); p.lineTo(6, -2); p.lineTo(0, 6); p.closePath() })
  doldur(c, e, dG(c, -6, 6, ['#E8F6FF', '#7DD3FF', '#2F6DB8']), 0.9)
  c.restore()
  isilti(c, 26, 27, 6, 2.4, -0.4, 0.5)
}

const BULUNTU_CIZIM = { lamba, kandil, yaprak, ammonit, capa, antik, civi, anahtar, balta, kap, testi, teker, belge, tomar, keski, sutun, tas, kale, kantar, duduk, elek, bros, can, kurek, nal, miknatis, defter }

// Buluntu simgesi: ek = buluntu kodu; ':golge' ekiyle henüz bulunmamış (karartılmış siluet)
function buluntu(c, _kod, ek = '') {
  const [kod, kip] = String(ek).split(':')
  const t = BULUNTULAR.find((x) => x.kod === kod)
  if (!t) return
  if (t.gorsel === 'cevher') cevher(c, t.bolge)
  else (BULUNTU_CIZIM[t.gorsel] || antik)(c, t.ton || '#C9A040')
  if (kip === 'golge') {
    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalCompositeOperation = 'source-atop'
    c.fillStyle = 'rgba(8,22,32,.92)'
    c.fillRect(0, 0, c.canvas.width, c.canvas.height)
    c.restore()
  }
}

const CIZIM = { cevher, vagon, kabin, gemi, ambar, kontrat, madalya, hediye, sikke, elmas, kazma, sise, kask, kumsaati, yildirim, matkap, pusula, muze, kumbara, buluntu }

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

// Simgenin PNG adresi (<img> kullanan yerler için: kat kartı, istatistik şeridi)
const adresler = new Map()
export function simgeAdresi(ad, kod, boyut, ek) {
  const anahtar = ad + '|' + (kod || '') + '|' + (ek || '') + '|' + boyut
  let a = adresler.get(anahtar)
  if (a) return a
  const c = document.createElement('canvas')
  simgeCiz(c, ad, kod, boyut, ek)
  a = c.toDataURL('image/png')
  if (adresler.size > 40) adresler.clear()
  adresler.set(anahtar, a)
  return a
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
