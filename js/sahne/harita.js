// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Bölge haritaları: üç harita kodla çizilir (sahneyle aynı dil).
// • Karadeniz: deniz, kumsal, orman, nehir; Zonguldak kuyu kulesi, Ereğli çelik fabrikası,
//   Karabük taş ocağı, Kastamonu bakır galerisi.
// • Batı Anadolu: Ege kıyısı, adalar, zeytinlik, haşhaş tarlası, göl; Balya kurşun izabesi,
//   Afyon mermer ocağı ve kalesi, Keçiborlu kükürt rafinerisi, Bergama akropolü ve altın havuzları.
// • İç ve Doğu Anadolu: bozkır, buğday, kavak, karlı dağlar, Sakarya ve Fırat, Keban ve Hazar;
//   Gümüşhane gümüş galerileri, Elazığ krom açık ocağı, Kırka bor havuzları, Beylikova nadir toprak tesisi.
// • Tasarım alanı 360×440 birim; tuval genişliğe göre ölçeklenir, harita ve boyut başına bir kez çizilir.
// • Hareketli öğeler (gemi/kayık, bulut, duman) arayüzde CSS ile oynar; konumları buradan okunur.

import { rastgele, acik, koyu, rgba } from './cizim.js'
import * as D from './dekor.js'
import * as K from './karakter.js'

export const HARITA = Object.freeze({ w: 360, h: 440 })
// Üç harita ve bölgeleri (oyundaki açılış sırasıyla)
export const HARITALAR = Object.freeze([
  { kod: 'karadeniz', ad: 'Karadeniz', alt: 'Kıyı ocakları · dört bölge', bolgeler: ['zonguldak', 'eregli', 'karabuk', 'kastamonu'], zemin: '#2A86BC' },
  { kod: 'bati', ad: 'Batı Anadolu', alt: 'Ege kıyısı ve mermer dağları', bolgeler: ['balya', 'afyon', 'keciborlu', 'bergama'], zemin: '#3A9CCB' },
  { kod: 'dogu', ad: 'İç ve Doğu Anadolu', alt: 'Bozkır, göller ve karlı dağlar', bolgeler: ['gumushane', 'elazig', 'kirka', 'beylikova'], zemin: '#BBA96E' },
])
export const haritaKodu = (bolge) => (HARITALAR.find((h) => h.bolgeler.includes(bolge)) || HARITALAR[0]).kod
// Bölge düğümleri (çizimin taban noktası) ve etiket kartlarının merkezi
export const DUGUM = Object.freeze({
  zonguldak: { x: 222, y: 114, kart: [222, 152] },
  eregli: { x: 80, y: 166, kart: [100, 206] },
  karabuk: { x: 152, y: 288, kart: [152, 326] },
  kastamonu: { x: 278, y: 352, kart: [262, 394] },
  balya: { x: 178, y: 126, kart: [178, 164] },
  afyon: { x: 282, y: 232, kart: [262, 270] },
  keciborlu: { x: 238, y: 352, kart: [236, 390] },
  bergama: { x: 98, y: 262, kart: [100, 304] },
  gumushane: { x: 268, y: 136, kart: [262, 174] },
  elazig: { x: 266, y: 298, kart: [262, 336] },
  kirka: { x: 98, y: 190, kart: [104, 228] },
  beylikova: { x: 110, y: 336, kart: [112, 374] },
})
const N = DUGUM
// Bacalar: duman çıkış noktaları (üçüncü öğe duman tonu)
export const DUMAN = Object.freeze({
  karadeniz: [[243.5, 88], [92, 122], [99, 127]],
  bati: [[N.balya.x + 24, N.balya.y - 42], [N.keciborlu.x + 22, N.keciborlu.y - 34, 'sari']],
  dogu: [[N.elazig.x + 26, N.elazig.y - 34], [N.kirka.x + 26, N.kirka.y - 32], [N.beylikova.x + 28, N.beylikova.y - 36]],
})
// Gemi şeridi: y ve yatay yol (Doğu'da Hazar Gölü'nde kayık)
export const GEMI = Object.freeze({
  karadeniz: { y: 70, x0: -36, x1: 212, boy: 34 },
  bati: { y: 414, x0: -8, x1: 92, boy: 30 },
  dogu: { y: 406, x0: 264, x1: 314, boy: 22 },
})

const TAU = Math.PI * 2
const CIZGI = '#160E08'
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

function karadenizCiz(c) {
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
  kenar(c)
}

// Kenar karartması
function kenar(c) {
  const { w, h } = HARITA
  const v = c.createRadialGradient(w / 2, h * 0.48, h * 0.38, w / 2, h * 0.48, h * 0.8)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,10,20,.42)')
  c.fillStyle = v
  c.fillRect(0, 0, w, h)
}

// ── Ortak yeni doğa öğeleri ──
function zeytin(c, x, y, s) {
  c.fillStyle = 'rgba(0,0,0,.22)'
  c.beginPath(); c.ellipse(x + s * 0.3, y + s * 0.2, s * 0.9, s * 0.32, 0, 0, TAU); c.fill()
  c.fillStyle = '#6A4A2A'
  c.fillRect(x - 0.5, y - s * 0.6, 1, s * 0.7)
  const g = c.createRadialGradient(x - s * 0.3, y - s * 1.1, 0.2, x, y - s * 0.8, s)
  g.addColorStop(0, '#C4CC9A'); g.addColorStop(0.6, '#8A9A62'); g.addColorStop(1, '#5E6E40')
  c.fillStyle = g
  c.beginPath(); c.ellipse(x, y - s * 0.85, s, s * 0.8, 0, 0, TAU); c.fill()
  c.strokeStyle = rgba(CIZGI, 0.5)
  c.lineWidth = 0.4
  c.stroke()
}
function zeytinlik(c, x, y, sut, sat, tohum) {
  const r = rastgele(tohum)
  for (let j = 0; j < sat; j++) for (let i = 0; i < sut; i++) zeytin(c, x + i * 9 + j * 3 + (r() - 0.5) * 1.5, y + j * 7, 2.6 + r() * 0.6)
}
function kavak(c, x, y, s) {
  c.fillStyle = 'rgba(0,0,0,.22)'
  c.beginPath(); c.ellipse(x + s * 0.5, y + 0.6, s * 0.9, s * 0.3, 0, 0, TAU); c.fill()
  c.fillStyle = '#5A3A20'
  c.fillRect(x - 0.4, y - s * 0.6, 0.8, s * 0.7)
  c.fillStyle = yG(c, x - s * 0.5, x + s * 0.5, ['#7AAE4A', '#4E8A34', '#2E5E22'])
  c.beginPath(); c.ellipse(x, y - s * 2, s * 0.5, s * 1.7, 0, 0, TAU); c.fill()
  c.strokeStyle = rgba(CIZGI, 0.5)
  c.lineWidth = 0.4
  c.stroke()
}
function kavakSirasi(c, x0, y0, x1, y1, n, s = 3.2) {
  for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0; kavak(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, s) }
}
function gol(c, x, y, rx, ry, tohum) {
  const r = rastgele(tohum)
  const p = new Path2D()
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * TAU, k = 1 + (i % 24 ? (r() - 0.5) * 0.12 : 0)
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k
    if (i === 0) p.moveTo(px, py); else p.lineTo(px, py)
  }
  p.closePath()
  c.lineJoin = 'round'
  c.strokeStyle = '#E8D49A'
  c.lineWidth = 4
  c.stroke(p)
  c.fillStyle = dG(c, y - ry, y + ry, ['#3AA0D0', '#2A86BC', '#1E6E9E'])
  c.fill(p)
  c.strokeStyle = 'rgba(170,235,250,.6)'
  c.lineWidth = 1.4
  c.stroke(p)
  c.strokeStyle = 'rgba(255,255,255,.3)'
  c.lineWidth = 0.6
  for (let i = 0; i < Math.round(rx / 6); i++) {
    const px = x + (r() - 0.5) * rx * 1.2, py = y + (r() - 0.5) * ry * 1.1
    c.beginPath(); c.moveTo(px - 3, py); c.quadraticCurveTo(px, py - 1.4, px + 3, py); c.stroke()
  }
}
function nehirCiz(c, p, w = 5) {
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.strokeStyle = '#2F8FC4'
  c.lineWidth = w
  c.stroke(p)
  c.strokeStyle = '#7FD0F0'
  c.lineWidth = w * 0.32
  c.stroke(p)
  c.lineCap = 'butt'
}
function kopru(c, x, y, a) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  c.fillStyle = '#8A5A30'
  c.fillRect(-5, -3, 10, 6)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.strokeRect(-5, -3, 10, 6)
  c.restore()
}
function lekeler(c, r, n, y0, renkler) {
  const { w, h } = HARITA
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = y0 + r() * (h - y0)
    c.fillStyle = renkler[Math.floor(r() * renkler.length)]
    c.beginPath(); c.ellipse(x, y, 10 + r() * 22, 6 + r() * 10, r() * 3, 0, TAU); c.fill()
  }
}
// Tepeli bir yığın (cüruf, kükürt, bor)
function koni(c, x, y, w, h, ust, alt) {
  const p = new Path2D()
  p.moveTo(x - w, y); p.quadraticCurveTo(x - w * 0.2, y - h * 2, x, y - h * 1.05); p.quadraticCurveTo(x + w * 0.2, y - h * 2, x + w, y); p.closePath()
  c.fillStyle = dG(c, y - h, y, [ust, alt])
  c.fill(p)
  kontur(c, p, 0.5)
  c.fillStyle = 'rgba(255,255,255,.22)'
  c.beginPath(); c.ellipse(x - w * 0.35, y - h * 0.55, w * 0.22, h * 0.16, -0.5, 0, TAU); c.fill()
}
// Basit bina: gövde, pencere sırası, çatı
function bina(c, x, y, w, h, govde, cati, pencere = '#3A5A7A') {
  const b = new Path2D()
  b.rect(x, y - h, w, h)
  c.fillStyle = dG(c, y - h, y, [acik(govde, 0.12), govde, koyu(govde, 0.18)])
  c.fill(b)
  c.fillStyle = pencere
  for (let xx = x + 2.5; xx < x + w - 3; xx += 5.5) c.fillRect(xx, y - h * 0.62, 3, h * 0.24)
  kontur(c, b, 0.6)
  const r = new Path2D()
  r.moveTo(x - 1.2, y - h); r.lineTo(x + w * 0.5, y - h - 4.5); r.lineTo(x + w + 1.2, y - h); r.closePath()
  c.fillStyle = dG(c, y - h - 4.5, y - h, [acik(cati, 0.2), cati, koyu(cati, 0.2)])
  c.fill(r)
  kontur(c, r, 0.5)
}
function tank(c, x, y, w, h, govde, bant) {
  const p = new Path2D()
  p.moveTo(x - w / 2, y - h); p.lineTo(x - w / 2, y); p.ellipse(x, y, w / 2, w * 0.18, 0, Math.PI, 0, true); p.lineTo(x + w / 2, y - h); p.closePath()
  c.fillStyle = yG(c, x - w / 2, x + w / 2, [koyu(govde, 0.15), acik(govde, 0.3), govde, koyu(govde, 0.3)])
  c.fill(p)
  if (bant) { c.fillStyle = bant; c.fillRect(x - w / 2, y - h * 0.55, w, h * 0.16) }
  kontur(c, p, 0.5)
  c.fillStyle = acik(govde, 0.35)
  c.beginPath(); c.ellipse(x, y - h, w / 2, w * 0.18, 0, 0, TAU); c.fill()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.stroke()
}
function vagonCiz(c, kod, x, y) {
  const cv = K.arabaKare(true, D.cevherRenk(kod), D.cevherVurgu(kod), 3)
  c.drawImage(cv, x - 7.5, y - 11, 15, 12)
}
// Ahşap kuyu kulesi (küçük)
function ahsapKule(c, x, y, h) {
  c.strokeStyle = '#6A4424'
  c.lineWidth = 1.6
  c.lineCap = 'round'
  c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x, y - h); c.lineTo(x + 6, y); c.stroke()
  c.lineWidth = 0.8
  c.beginPath(); c.moveTo(x - 4, y - h * 0.33); c.lineTo(x + 4, y - h * 0.33); c.moveTo(x - 2.2, y - h * 0.66); c.lineTo(x + 2.2, y - h * 0.66); c.stroke()
  c.lineCap = 'butt'
  c.fillStyle = dG(c, y - h - 3, y - h + 3, ['#E6ECF2', '#6E7A86'])
  c.beginPath(); c.arc(x, y - h, 3, 0, TAU); c.fill()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.stroke()
}

// ── Batı Anadolu bölgeleri ──
// Balya: tarihî kurşun izabe binası, uzun tuğla baca, siyah cüruf yığınları, ahşap kuyu kulesi
function balya(c, x, y) {
  avlu(c, x + 2, y + 2, 36, 11, '#6E665E')
  koni(c, x - 28, y + 6, 13, 7, '#55555E', '#1E1E24')
  koni(c, x - 16, y + 9, 9, 5, '#4A4A52', '#1A1A20')
  ahsapKule(c, x - 30, y - 4, 22)
  // İzabe binası: taş duvar, kemerli pencereler, kiremit çatı
  const b = new Path2D()
  b.rect(x - 8, y - 15, 28, 16)
  c.fillStyle = dG(c, y - 15, y + 1, ['#CDBFA4', '#9A8A70'])
  c.fill(b)
  c.strokeStyle = rgba('#5A4A36', 0.35)
  c.lineWidth = 0.4
  for (let yy = y - 12; yy < y; yy += 3.2) { c.beginPath(); c.moveTo(x - 8, yy); c.lineTo(x + 20, yy); c.stroke() }
  c.fillStyle = '#2A2018'
  for (const px of [x - 4, x + 3, x + 10]) { c.beginPath(); c.moveTo(px, y - 3); c.lineTo(px, y - 8); c.arc(px + 2, y - 8, 2, Math.PI, 0); c.lineTo(px + 4, y - 3); c.closePath(); c.fill() }
  kontur(c, b, 0.6)
  const cati = new Path2D()
  cati.moveTo(x - 10, y - 15); cati.lineTo(x - 4, y - 21); cati.lineTo(x + 16, y - 21); cati.lineTo(x + 22, y - 15); cati.closePath()
  c.fillStyle = dG(c, y - 21, y - 15, ['#D8714E', '#A8452E'])
  c.fill(cati)
  kontur(c, cati, 0.6)
  // Uzun tuğla baca (yukarı incelir)
  const bx = x + 24, ust = y - 40
  const bc = new Path2D()
  bc.moveTo(bx - 3.6, y + 1); bc.lineTo(bx - 2.2, ust); bc.lineTo(bx + 2.2, ust); bc.lineTo(bx + 3.6, y + 1); bc.closePath()
  c.fillStyle = yG(c, bx - 3.6, bx + 3.6, ['#8A3A2A', '#C85A42', '#7A2E20'])
  c.fill(bc)
  c.strokeStyle = rgba('#3A160E', 0.45)
  c.lineWidth = 0.35
  for (let yy = ust + 3; yy < y; yy += 3) { c.beginPath(); c.moveTo(bx - 3.5, yy); c.lineTo(bx + 3.5, yy); c.stroke() }
  kontur(c, bc, 0.6)
  c.fillStyle = '#5A2418'
  c.fillRect(bx - 3, ust - 1.6, 6, 2)
  // Kurşun külçeleri
  for (const [px, py] of [[x + 32, y + 6], [x + 36, y + 6], [x + 34, y + 3.4]]) {
    c.fillStyle = dG(c, py - 2, py + 1, ['#B8C0C8', '#6A727A'])
    c.fillRect(px - 2, py - 1.4, 4.4, 2.6)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.4
    c.strokeRect(px - 2, py - 1.4, 4.4, 2.6)
  }
}

// Afyon: beyaz basamaklı mermer ocağı, kesme bloklar, vinç; arkada kale kayası
function afyon(c, x, y) {
  // Kale kayası
  const kx = x + 34, ky = y + 2
  const kaya = new Path2D()
  kaya.moveTo(kx - 14, ky); kaya.lineTo(kx - 11, ky - 20); kaya.lineTo(kx - 6, ky - 36); kaya.lineTo(kx + 1, ky - 42); kaya.lineTo(kx + 8, ky - 34); kaya.lineTo(kx + 12, ky - 16); kaya.lineTo(kx + 15, ky); kaya.closePath()
  c.fillStyle = yG(c, kx - 14, kx + 15, ['#8A7A6A', '#6A5A4C', '#4A3E34'])
  c.fill(kaya)
  c.strokeStyle = rgba('#2A2018', 0.5)
  c.lineWidth = 0.5
  c.beginPath(); c.moveTo(kx - 8, ky - 28); c.lineTo(kx - 3, ky - 16); c.moveTo(kx + 5, ky - 30); c.lineTo(kx + 8, ky - 12); c.stroke()
  kontur(c, kaya, 0.6)
  // Kale surları
  const sur = new Path2D()
  sur.moveTo(kx - 7, ky - 36)
  for (let i = 0; i < 6; i++) { const sx = kx - 7 + i * 2.6; sur.lineTo(sx, ky - 42); sur.lineTo(sx + 1.3, ky - 42); sur.lineTo(sx + 1.3, ky - 40.6); sur.lineTo(sx + 2.6, ky - 40.6) }
  sur.lineTo(kx + 8.6, ky - 34); sur.closePath()
  c.fillStyle = '#B8A88E'
  c.fill(sur)
  kontur(c, sur, 0.4)
  c.strokeStyle = '#3A2A1A'
  c.lineWidth = 0.5
  c.beginPath(); c.moveTo(kx + 1, ky - 42); c.lineTo(kx + 1, ky - 49); c.stroke()
  c.fillStyle = '#D8352A'
  c.beginPath(); c.moveTo(kx + 1, ky - 49); c.lineTo(kx + 6, ky - 47.6); c.lineTo(kx + 1, ky - 46); c.closePath(); c.fill()
  // Mermer basamakları
  tepe(c, x - 6, y + 2, 38, 22, '#B8B4A8')
  for (const [w, dy] of [[32, 0], [25, -7], [18, -14]]) {
    const yy = y + dy
    const yuz = new Path2D()
    yuz.moveTo(x - 6 - w, yy); yuz.lineTo(x - 6 + w, yy); yuz.lineTo(x - 6 + w - 3, yy - 5.4); yuz.lineTo(x - 6 - w + 3, yy - 5.4); yuz.closePath()
    c.fillStyle = dG(c, yy - 5.4, yy, ['#FFFFFF', '#E6E2D8'])
    c.fill(yuz)
    c.fillStyle = dG(c, yy, yy + 2.4, ['#CFCABE', '#A8A296'])
    c.fillRect(x - 6 - w, yy, w * 2, 2.4)
    kontur(c, yuz, 0.5)
    c.strokeStyle = 'rgba(120,120,130,.45)'
    c.lineWidth = 0.4
    for (let xx = x - 6 - w + 5; xx < x - 6 + w - 4; xx += 8) { c.beginPath(); c.moveTo(xx, yy - 4.6); c.quadraticCurveTo(xx + 2, yy - 2.6, xx + 0.6, yy - 0.4); c.stroke() }
  }
  // Kesme mermer bloklar
  for (const [bx, by, s] of [[x + 14, y + 9, 5], [x + 20, y + 10, 4], [x + 17, y + 5.4, 4]]) {
    c.fillStyle = '#FBFAF6'
    c.fillRect(bx - s / 2, by - s, s, s)
    c.fillStyle = '#C9C4B8'
    c.beginPath(); c.moveTo(bx + s / 2, by - s); c.lineTo(bx + s / 2 + 1.6, by - s - 1.2); c.lineTo(bx + s / 2 + 1.6, by - 1.2); c.lineTo(bx + s / 2, by); c.closePath(); c.fill()
    c.strokeStyle = CIZGI
    c.lineWidth = 0.4
    c.strokeRect(bx - s / 2, by - s, s, s)
  }
  // Vinç
  c.strokeStyle = '#E8A33A'
  c.lineWidth = 1.5
  c.beginPath(); c.moveTo(x - 34, y + 6); c.lineTo(x - 34, y - 26); c.lineTo(x - 12, y - 22); c.stroke()
  c.strokeStyle = 'rgba(30,30,30,.85)'
  c.lineWidth = 0.6
  c.beginPath(); c.moveTo(x - 15, y - 22.6); c.lineTo(x - 15, y - 13); c.stroke()
  c.fillStyle = '#FBFAF6'
  c.fillRect(x - 17, y - 13, 4, 3)
  c.strokeStyle = CIZGI
  c.strokeRect(x - 17, y - 13, 4, 3)
}

// Keçiborlu: sarı kükürt yığınları, bant konveyör, rafineri ve sarımsı dumanlı baca
function keciborlu(c, x, y) {
  avlu(c, x, y + 2, 38, 11, '#B8A050')
  koni(c, x - 26, y + 6, 14, 8, '#FFE45A', '#C9A21B')
  koni(c, x - 10, y + 8, 10, 6, '#FFEA70', '#D4AA20')
  // Konveyör
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 1.6
  c.beginPath(); c.moveTo(x - 24, y - 9); c.lineTo(x - 2, y - 18); c.stroke()
  c.lineWidth = 0.6
  for (const t of [0.25, 0.6]) { const px = x - 24 + 22 * t, py = y - 9 - 9 * t; c.beginPath(); c.moveTo(px, py); c.lineTo(px, y + 2); c.stroke() }
  // Rafineri
  bina(c, x - 2, y + 1, 22, 14, '#9AA6B2', '#C9A21B')
  c.fillStyle = '#FFD84A'
  c.fillRect(x - 2, y - 4, 22, 1.6)
  tank(c, x + 30, y + 4, 7, 9, '#D8DCE0', '#C9A21B')
  bacaCiz(c, x + 22, y - 34, y - 12, 3.4, true)
}

// Bergama: tepede akropol (sütunlu tapınak), yamaçta altın liç havuzları, külçe yığını
function bergama(c, x, y) {
  tepe(c, x - 4, y + 2, 42, 30, '#8AA05A')
  // Liç havuzları (basamaklı, turkuaz)
  for (let k = 0; k < 3; k++) {
    const hx = x + 14 + k * 5, hy = y - 2 - k * 6
    const p = new Path2D()
    p.moveTo(hx - 10, hy); p.lineTo(hx + 12, hy); p.lineTo(hx + 10, hy - 4); p.lineTo(hx - 8, hy - 4); p.closePath()
    c.fillStyle = '#C9A04A'
    c.fill(p)
    c.fillStyle = dG(c, hy - 4, hy, ['#6FE0D8', '#2FA8A0'])
    c.beginPath(); c.moveTo(hx - 8, hy - 0.8); c.lineTo(hx + 10.4, hy - 0.8); c.lineTo(hx + 9, hy - 3.4); c.lineTo(hx - 6.8, hy - 3.4); c.closePath(); c.fill()
    kontur(c, p, 0.45)
  }
  // Akropol: basamaklı kaide, sütunlar, alınlık
  const ax = x - 14, ay = y - 22
  c.fillStyle = '#E8DCC0'
  c.fillRect(ax - 15, ay, 30, 3)
  c.fillStyle = '#D2C4A4'
  c.fillRect(ax - 13, ay - 2, 26, 2)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.4
  c.strokeRect(ax - 15, ay, 30, 3)
  for (let i = 0; i < 6; i++) {
    const sx = ax - 11 + i * 4.4
    c.fillStyle = yG(c, sx - 1.2, sx + 1.2, ['#FFF8E6', '#D8CCAE'])
    c.fillRect(sx - 1.1, ay - 13, 2.2, 11)
    c.strokeRect(sx - 1.1, ay - 13, 2.2, 11)
  }
  const al = new Path2D()
  al.moveTo(ax - 14, ay - 13); al.lineTo(ax, ay - 19); al.lineTo(ax + 14, ay - 13); al.closePath()
  c.fillStyle = dG(c, ay - 19, ay - 13, ['#FFF8E6', '#E0D2B0'])
  c.fill(al)
  kontur(c, al, 0.5)
  // Altın külçeler
  for (const [px, py] of [[x + 30, y + 6], [x + 34, y + 6], [x + 32, y + 3.4]]) {
    c.fillStyle = dG(c, py - 2, py + 1, ['#FFE48A', '#C9961A'])
    c.fillRect(px - 2, py - 1.4, 4.4, 2.6)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.4
    c.strokeRect(px - 2, py - 1.4, 4.4, 2.6)
  }
  vagonCiz(c, 'bergama', x + 4, y + 9)
}

// ── İç ve Doğu Anadolu bölgeleri ──
// Gümüşhane: sarp dağda iki taş kemerli galeri, ahşap iskele, gümüş damarları, ray ve vagon
function gumushane(c, x, y, r) {
  dag(c, x + 4, y + 4, 96, 62, r, '#7E8690', true)
  c.strokeStyle = rgba('#E8EEF4', 0.75)
  c.lineWidth = 0.9
  c.beginPath(); c.moveTo(x - 30, y - 6); c.lineTo(x - 18, y - 14); c.lineTo(x - 10, y - 12); c.stroke()
  c.beginPath(); c.moveTo(x + 14, y - 24); c.lineTo(x + 24, y - 16); c.lineTo(x + 30, y - 18); c.stroke()
  const galeri = (gx, gy, s) => {
    const ag = new Path2D()
    ag.moveTo(gx - 6 * s, gy); ag.lineTo(gx - 6 * s, gy - 6 * s); ag.arc(gx, gy - 6 * s, 6 * s, Math.PI, 0); ag.lineTo(gx + 6 * s, gy); ag.closePath()
    c.fillStyle = dG(c, gy - 12 * s, gy, ['#0E0A08', '#2A1A10'])
    c.fill(ag)
    c.strokeStyle = '#B8B0A4'
    c.lineWidth = 1.6 * s
    c.beginPath(); c.moveTo(gx - 6.8 * s, gy); c.lineTo(gx - 6.8 * s, gy - 6 * s); c.arc(gx, gy - 6 * s, 6.8 * s, Math.PI, 0); c.lineTo(gx + 6.8 * s, gy); c.stroke()
    kontur(c, ag, 0.5)
    c.fillStyle = '#F6C453'
    c.beginPath(); c.arc(gx, gy - 7 * s, 0.9 * s, 0, TAU); c.fill()
  }
  galeri(x - 4, y + 2, 1)
  galeri(x + 18, y - 22, 0.7)
  // Ahşap iskele yolu
  c.strokeStyle = '#8A5A30'
  c.lineWidth = 1.4
  c.beginPath(); c.moveTo(x + 4, y - 2); c.lineTo(x + 12, y - 12); c.lineTo(x + 14, y - 20); c.stroke()
  c.lineWidth = 0.6
  for (const [px, py] of [[x + 6, y - 4], [x + 10, y - 9], [x + 13, y - 15]]) { c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + 6); c.stroke() }
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 0.8
  c.beginPath(); c.moveTo(x - 2, y + 2); c.lineTo(x + 20, y + 10); c.moveTo(x + 4, y + 2); c.lineTo(x + 24, y + 8); c.stroke()
  vagonCiz(c, 'gumushane', x + 20, y + 10)
  c.save(); c.translate(x - 24, y + 8); D.yiginCiz(c, 16, 7, 'gumushane', 9); c.restore()
}

// Elazığ: kademeli krom açık ocağı, damperli kamyon, ferrokrom tesisi ve bacası
function elazig(c, x, y) {
  const ox = x - 14, oy = y + 2
  for (let i = 0; i < 4; i++) {
    const rx = 30 - i * 7, ry = 11 - i * 2.4
    c.fillStyle = i === 3 ? '#1E2622' : dG(c, oy - ry, oy + ry, [i % 2 ? '#7A7262' : '#8E8676', '#4E4A40'])
    c.beginPath(); c.ellipse(ox, oy + i * 1.2, rx, ry, 0, 0, TAU); c.fill()
    c.strokeStyle = rgba(CIZGI, 0.55)
    c.lineWidth = 0.5
    c.stroke()
  }
  c.fillStyle = 'rgba(60,110,90,.5)'
  c.beginPath(); c.ellipse(ox, oy + 3.6, 6, 2, 0, 0, TAU); c.fill()
  // Rampa ve kamyon
  c.strokeStyle = 'rgba(200,190,170,.7)'
  c.lineWidth = 1.4
  c.beginPath(); c.moveTo(ox + 26, oy - 2); c.quadraticCurveTo(ox + 10, oy - 8, ox - 6, oy - 4); c.stroke()
  const kx = ox + 12, ky = oy - 7
  c.fillStyle = '#E8A33A'
  c.fillRect(kx - 4, ky - 3.4, 6, 3.2)
  c.fillStyle = '#C9831A'
  c.fillRect(kx + 2, ky - 2.6, 2.6, 2.4)
  c.fillStyle = '#1A1A1A'
  c.beginPath(); c.arc(kx - 2.4, ky, 1, 0, TAU); c.arc(kx + 3, ky, 1, 0, TAU); c.fill()
  c.save(); c.translate(kx - 1, ky - 3.4); D.yiginCiz(c, 5, 2.4, 'elazig', 4); c.restore()
  // Ferrokrom tesisi
  bina(c, x + 12, y + 1, 22, 15, '#8E9AA6', '#4E5A66')
  bacaCiz(c, x + 26, y - 34, y - 14, 3.6, true)
  tank(c, x + 40, y + 4, 6, 10, '#C9D2DA', '#3E4A44')
}

// Kırka: beyaz bor açık ocağı, buharlaştırma havuzları, rafineri tankları ve baca
function kirka(c, x, y) {
  avlu(c, x + 2, y + 2, 38, 12, '#C9C0B0')
  // Havuzlar (2×2, perspektif)
  const havuz = (hx, hy, ton) => {
    const p = new Path2D()
    p.moveTo(hx - 8, hy); p.lineTo(hx + 6, hy); p.lineTo(hx + 9, hy - 5); p.lineTo(hx - 5, hy - 5); p.closePath()
    c.fillStyle = '#E6DFD2'
    c.fill(p)
    c.fillStyle = ton
    c.beginPath(); c.moveTo(hx - 6.6, hy - 0.8); c.lineTo(hx + 5.4, hy - 0.8); c.lineTo(hx + 7.6, hy - 4.2); c.lineTo(hx - 4.4, hy - 4.2); c.closePath(); c.fill()
    kontur(c, p, 0.45)
  }
  havuz(x - 28, y + 8, '#C9DDE8'); havuz(x - 13, y + 8, '#E3D6F0')
  havuz(x - 25, y + 2, '#E3D6F0'); havuz(x - 10, y + 2, '#BFE0E6')
  c.save(); c.translate(x - 30, y - 4); D.yiginCiz(c, 14, 7, 'kirka', 4); c.restore()
  // Rafineri
  tank(c, x + 2, y + 2, 8, 14, '#E6EAEE', '#9A86B8')
  tank(c, x + 11, y + 3, 8, 12, '#E6EAEE', '#9A86B8')
  bina(c, x + 17, y + 2, 18, 12, '#D8D2C8', '#6E7A86')
  bacaCiz(c, x + 26, y - 32, y - 12, 3.2, false)
}

// Beylikova: modern nadir toprak tesisi; mor bantlı tanklar, cam bina, güneş panelleri, kristal yığını
function beylikova(c, x, y) {
  avlu(c, x + 2, y + 2, 38, 11, '#6A6478')
  for (const [tx, ty, h] of [[x - 22, y + 3, 12], [x - 13, y + 4, 10]]) tank(c, tx, ty, 8, h, '#D8DCE6', '#8A4ADA')
  // Cam bina
  const b = new Path2D()
  b.rect(x - 6, y - 16, 26, 17)
  c.fillStyle = dG(c, y - 16, y + 1, ['#E6EEF6', '#AEBACA'])
  c.fill(b)
  c.fillStyle = yG(c, x - 6, x + 20, ['#3A5A8A', '#6A9AD0', '#3A5A8A'])
  for (let yy = y - 13; yy < y - 1; yy += 4) c.fillRect(x - 4, yy, 22, 2.4)
  kontur(c, b, 0.6)
  // Güneş panelleri
  c.fillStyle = '#1E2A4A'
  for (let i = 0; i < 3; i++) {
    c.save(); c.translate(x - 2 + i * 7.6, y - 18); c.transform(1, 0, -0.5, 1, 0, 0)
    c.fillRect(0, 0, 6.4, 2); c.strokeStyle = '#8AA0C8'; c.lineWidth = 0.3; c.strokeRect(0, 0, 6.4, 2)
    c.restore()
  }
  bacaCiz(c, x + 28, y - 36, y - 2, 2.8, true)
  D.kristalCiz(c, x + 36, y + 8, 7, -0.2, 'beylikova', 3)
  D.kristalCiz(c, x + 30, y + 9, 5, 0.3, 'beylikova', 5)
}

// ── Batı Anadolu haritası ──
// Ege kıyısı: deniz solda; kontrol noktaları [y, x]
const EGE = [[-20, 118], [30, 104], [70, 82], [110, 64], [150, 52], [190, 42], [230, 36], [262, 46], [292, 68], [330, 94], [370, 116], [410, 132], [460, 140]]
function egeX(y) {
  let i = 0
  while (i < EGE.length - 2 && y > EGE[i + 1][0]) i++
  const [y0, x0] = EGE[i], [y1, x1] = EGE[i + 1]
  const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))
  const s = (1 - Math.cos(t * Math.PI)) / 2
  return x0 + (x1 - x0) * s + 3 * Math.sin(y * 0.15) + 1.8 * Math.sin(y * 0.47 + 0.7)
}
function egeYolu(kapat) {
  const p = new Path2D()
  p.moveTo(egeX(-4), -4)
  for (let y = 0; y <= 444; y += 3) p.lineTo(egeX(y), y)
  if (kapat) { p.lineTo(364, 444); p.lineTo(364, -4); p.closePath() }
  return p
}
function ada(c, x, y, rx, ry, a) {
  c.save()
  c.translate(x, y)
  c.rotate(a)
  const p = new Path2D()
  p.ellipse(0, 0, rx, ry, 0, 0, TAU)
  c.strokeStyle = 'rgba(170,235,250,.55)'
  c.lineWidth = 6
  c.stroke(p)
  c.fillStyle = '#E8D49A'
  c.fill(p)
  c.fillStyle = dG(c, -ry, ry, ['#9CC468', '#7AAA4E'])
  c.beginPath(); c.ellipse(0, -0.8, rx * 0.86, ry * 0.84, 0, 0, TAU); c.fill()
  c.restore()
}

function batiCiz(c) {
  const r = rastgele(2207)
  const { w, h } = HARITA
  c.fillStyle = dG(c, 0, h, ['#2F96C8', '#2A86BC', '#2F96C8'])
  c.fillRect(0, 0, w, h)
  c.strokeStyle = 'rgba(255,255,255,.22)'
  c.lineWidth = 0.7
  for (let i = 0; i < 40; i++) {
    const y = r() * h, x = r() * 140
    if (x > egeX(y) - 8) continue
    c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x, y - 2, x + 4, y); c.stroke()
  }
  const kiyi = egeYolu(false)
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
  ada(c, 14, 128, 16, 30, 0.2)
  ada(c, 26, 372, 12, 7, -0.3)
  ada(c, 58, 430, 8, 5, 0.2)
  // Kara
  const kara = egeYolu(true)
  c.fillStyle = '#E8D49A'
  c.fill(kara)
  c.save()
  c.translate(3.2, 0)
  c.fillStyle = dG(c, 0, h, ['#A8C86A', '#94BC5C', '#82AE52', '#76A24C'])
  c.fill(kara)
  c.restore()
  c.save()
  c.translate(3.2, 0)
  c.clip(kara)
  c.translate(-3.2, 0)
  lekeler(c, r, 60, 0, ['rgba(255,255,200,.08)', 'rgba(20,60,20,.08)', 'rgba(200,170,90,.10)'])
  // Tarlalar, bağlar ve Afyon'un haşhaş tarlaları
  for (const [x, y, tw, th, a, ton] of [[214, 196, 24, 13, -0.2, '#C9C86A'], [146, 232, 22, 12, 0.1, '#EBC4D2'], [232, 172, 16, 9, -0.2, '#F4E6EC'],
    [168, 300, 22, 12, 0.25, '#7A9A3A'], [312, 318, 24, 13, -0.15, '#7A9A3A'], [250, 136, 18, 10, -0.3, '#B8C868']]) tarla(c, x, y, tw, th, a, ton)
  // Göller (Burdur ve Eber)
  gol(c, 318, 424, 36, 12, 31)
  gol(c, 336, 128, 18, 8, 32)
  // Dağlar: Kaz Dağları (kuzeybatı), Murat Dağı ve Toroslar (doğu)
  const dr = rastgele(79)
  for (const [x, y, dw, dh, ton, kar] of [[94, 104, 46, 36, '#8C8478', true], [126, 96, 34, 26, '#958D80', false],
    [214, 262, 40, 28, '#9A9284', false], [352, 290, 40, 32, '#8C8478', true], [190, 420, 36, 22, '#958D80', false], [356, 372, 34, 26, '#8C8478', true]]) dag(c, x, y, dw, dh, dr, ton, kar)
  // Mermer tepeleri
  for (const [x, y, rx, ry] of [[322, 262, 22, 9], [246, 300, 18, 8]]) tepe(c, x, y, rx, ry, '#C9C2B2')
  for (const [x, y, rx, ry] of [[150, 170, 22, 9], [60, 228, 18, 8], [300, 170, 20, 8]]) tepe(c, x, y, rx, ry, '#86B054')
  // Bakırçay: dağlardan Bergama'nın güneyinden denize
  const nehir = new Path2D()
  nehir.moveTo(206, 228)
  nehir.bezierCurveTo(176, 250, 150, 286, 118, 290)
  nehir.bezierCurveTo(96, 292, 84, 300, egeX(300) - 2, 300)
  nehirCiz(c, nehir, 4.4)
  c.restore()

  const Ba = N.balya, Af = N.afyon, Kc = N.keciborlu, Be = N.bergama
  const y1 = new Path2D()
  y1.moveTo(Ba.x + 20, Ba.y + 8); y1.bezierCurveTo(240, 150, 262, 180, Af.x - 16, Af.y + 4)
  const y2 = new Path2D()
  y2.moveTo(Af.x - 6, Af.y + 8); y2.bezierCurveTo(Af.x - 20, 300, Kc.x + 10, 320, Kc.x + 2, Kc.y - 6)
  const y3 = new Path2D()
  y3.moveTo(Kc.x - 30, Kc.y + 6); y3.bezierCurveTo(180, 368, 140, 330, Be.x + 24, Be.y + 8)
  for (const p of [y1, y2, y3]) yol(c, p)
  const dy = new Path2D()
  dy.moveTo(Ba.x - 18, Ba.y + 8); dy.bezierCurveTo(140, 170, 112, 214, Be.x + 6, Be.y - 16)
  demiryolu(c, dy)
  kopru(c, 144, 284, 0.6)

  // Zeytinlikler ve ormanlar
  zeytinlik(c, 116, 210, 4, 2, 41)
  zeytinlik(c, 196, 330, 3, 2, 43)
  zeytinlik(c, 140, 404, 4, 2, 44)
  for (const [x, y, n, rr, t, cam] of [[70, 150, 8, 13, 51, true], [116, 128, 5, 9, 52, true], [272, 112, 6, 10, 53, false], [340, 236, 6, 10, 54, true],
    [176, 210, 6, 10, 55, false], [290, 392, 7, 12, 56, false]]) orman(c, x, y, n, rr, t, cam)
  // Köyler
  ev(c, 222, 162, 0.7, '#C4553B'); ev(c, 230, 166, 0.6, '#B8933E')
  ev(c, 196, 384, 0.7, '#C4553B'); ev(c, 300, 150, 0.6, '#C4553B')

  balya(c, Ba.x, Ba.y)
  bergama(c, Be.x, Be.y)
  afyon(c, Af.x, Af.y)
  keciborlu(c, Kc.x, Kc.y)
  gemiKucuk(c, 30, 220, 0.6)
  pusula(c, 330, 70, 12)
  kenar(c)
}

// ── İç ve Doğu Anadolu haritası ──
function doguCiz(c) {
  const r = rastgele(3301)
  const { w, h } = HARITA
  c.fillStyle = dG(c, 0, h, ['#D2C48A', '#C4B47A', '#B4A66A', '#A69A5E'])
  c.fillRect(0, 0, w, h)
  lekeler(c, r, 80, 0, ['rgba(255,250,210,.10)', 'rgba(90,80,30,.08)', 'rgba(120,150,60,.10)'])
  // Buğday ve yonca tarlaları
  for (const [x, y, tw, th, a, ton] of [[40, 120, 26, 14, 0.1, '#E2C866'], [70, 140, 20, 12, -0.2, '#9AB85A'], [176, 120, 26, 13, 0.15, '#E8CE70'],
    [196, 196, 22, 12, -0.1, '#D8BC5A'], [176, 410, 28, 14, 0.2, '#E2C866'], [60, 276, 22, 12, -0.25, '#A8C060'], [220, 380, 20, 11, 0.1, '#D8BC5A'],
    [150, 258, 18, 10, 0.3, '#9AB85A'], [36, 410, 22, 12, 0.15, '#E8CE70']]) tarla(c, x, y, tw, th, a, ton)
  // Doğu'nun karlı dağları (Zigana, Munzur) ve iç tepeler
  const dr = rastgele(83)
  for (const [x, y, dw, dh, ton, kar] of [[214, 104, 44, 34, '#8C8478', true], [330, 108, 60, 52, '#7E766A', true], [356, 166, 50, 42, '#8C8478', true],
    [320, 226, 46, 34, '#958D80', true], [356, 270, 40, 30, '#8C8478', false], [214, 300, 30, 18, '#A0927A', false], [356, 360, 36, 26, '#958D80', false]]) dag(c, x, y, dw, dh, dr, ton, kar)
  for (const [x, y, rx, ry, ton] of [[150, 166, 22, 9, '#B8A868'], [40, 216, 20, 8, '#B8A868'], [170, 330, 24, 9, '#B0A060'], [64, 440, 30, 12, '#B0A060']]) tepe(c, x, y, rx, ry, ton)
  // Sakarya (batı) ve Fırat (doğu); Keban ve Hazar gölleri
  const sakarya = new Path2D()
  sakarya.moveTo(30, -4)
  sakarya.bezierCurveTo(52, 60, 20, 120, 40, 170)
  sakarya.bezierCurveTo(60, 230, 28, 280, 50, 330)
  sakarya.bezierCurveTo(66, 370, 40, 410, 52, 444)
  nehirCiz(c, sakarya, 4.4)
  const firat = new Path2D()
  firat.moveTo(364, 196)
  firat.bezierCurveTo(330, 200, 300, 236, 262, 246)
  firat.bezierCurveTo(232, 254, 222, 260, 206, 266)
  nehirCiz(c, firat, 4.6)
  const firat2 = new Path2D()
  firat2.moveTo(196, 276)
  firat2.bezierCurveTo(200, 330, 190, 370, 214, 444)
  nehirCiz(c, firat2, 4.6)
  gol(c, 194, 268, 30, 11, 61)
  gol(c, 298, 406, 46, 15, 62)
  // Yollar ve demiryolu
  const G = N.gumushane, El = N.elazig, Kr = N.kirka, Bl = N.beylikova
  const y1 = new Path2D()
  y1.moveTo(G.x + 8, G.y + 10); y1.bezierCurveTo(300, 210, 304, 250, El.x + 10, El.y - 10)
  const y2 = new Path2D()
  y2.moveTo(El.x - 34, El.y - 4); y2.bezierCurveTo(220, 236, 160, 200, Kr.x + 34, Kr.y + 4)
  const y3 = new Path2D()
  y3.moveTo(Kr.x + 4, Kr.y + 12); y3.bezierCurveTo(110, 250, 130, 290, Bl.x + 6, Bl.y - 12)
  for (const p of [y1, y2, y3]) yol(c, p)
  const dy = new Path2D()
  dy.moveTo(Bl.x + 30, Bl.y + 4); dy.bezierCurveTo(180, 348, 216, 336, El.x - 30, El.y + 8)
  demiryolu(c, dy)
  const dy2 = new Path2D()
  dy2.moveTo(Kr.x - 22, Kr.y + 6); dy2.bezierCurveTo(60, 250, 70, 300, Bl.x - 26, Bl.y + 2)
  demiryolu(c, dy2)
  kopru(c, 197, 344, 1.5)
  // Kavak sıraları ve çam ormanı
  kavakSirasi(c, 58, 150, 66, 196, 4)
  kavakSirasi(c, 70, 300, 84, 330, 3)
  kavakSirasi(c, 226, 230, 244, 236, 3)
  kavakSirasi(c, 236, 372, 252, 368, 3)
  kavakSirasi(c, 150, 296, 168, 296, 3)
  for (const [x, y, n, rr, t, cam] of [[226, 150, 8, 13, 71, true], [312, 160, 7, 12, 72, true], [300, 300, 6, 10, 73, true]]) orman(c, x, y, n, rr, t, cam)
  // Köyler
  ev(c, 160, 206, 0.7, '#C4553B'); ev(c, 168, 210, 0.6, '#B8933E')
  ev(c, 236, 410, 0.7, '#C4553B'); ev(c, 30, 300, 0.6, '#B8933E')

  gumushane(c, G.x, G.y, rastgele(9))
  kirka(c, Kr.x, Kr.y)
  elazig(c, El.x, El.y)
  beylikova(c, Bl.x, Bl.y)
  pusula(c, 30, 78, 12)
  kenar(c)
}

const CIZICI = { karadeniz: karadenizCiz, bati: batiCiz, dogu: doguCiz }

// Haritayı verilen genişlikte (CSS px) tuvale çizer; aynı harita ve boyut önbellekten kopyalanır
export function haritaCiz(canvas, gen, kod = 'karadeniz') {
  const ciz = CIZICI[kod] || karadenizCiz
  const dpr = Math.min((typeof devicePixelRatio === 'number' && devicePixelRatio) || 1, 2)
  const pw = Math.round(gen * dpr), ph = Math.round((gen * HARITA.h / HARITA.w) * dpr)
  const anahtar = kod + ':' + pw + 'x' + ph
  let t = onbellek.get(anahtar)
  if (!t) {
    t = document.createElement('canvas')
    t.width = pw
    t.height = ph
    const c = t.getContext('2d')
    c.scale(pw / HARITA.w, ph / HARITA.h)
    ciz(c)
    // Boyut değişince eskiler atılır (üç haritadan fazlası tutulmaz)
    if (onbellek.size >= 3) onbellek.delete(onbellek.keys().next().value)
    onbellek.set(anahtar, t)
  }
  canvas.width = pw
  canvas.height = ph
  canvas.getContext('2d').drawImage(t, 0, 0)
}
