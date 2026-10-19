// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Karakterler (sahne v3): eklemli iskeletle çizilen madenciler.
// • Birim sistemi: ayak tabanı (0, 0), yukarı eksi y; figür boyu ~46 birim, sağa bakar.
// • Bacaklar ve kollar iki parçalı (diz/dirsek bükülür); kazma ve araba tutuşu ters kinematikle (IK).
// • Kareler ilk kullanımda ekran çözünürlüğünde fırınlanır (tembel önbellek); kare başına yalnız drawImage.
// • Sola bakan figürler çizerken aynalanır.

// Hücre (birim): figür + araç payı. Ayak noktası hücrede (AYAK_X, AYAK_Y).
export const HUCRE = { w: 64, h: 62, ayakX: 30, ayakY: 58 }

// Animasyonlar: kare sayısı ve doğal döngü süresi (s)
export const ANIM = Object.freeze({
  yuru: { kare: 8, sure: 0.72 },
  tasi: { kare: 8, sure: 0.8 },
  it: { kare: 8, sure: 0.85 },
  kaz: { kare: 8, sure: 0.62 },
  bekle: { kare: 6, sure: 2.4 },
  dinlen: { kare: 4, sure: 3.2 },
  sevin: { kare: 6, sure: 0.75 },
  egil: { kare: 4, sure: 0.5 },
  bosalt: { kare: 4, sure: 0.5 },
})
export const VURUS = 4   // kaz animasyonunda kazmanın kayaya değdiği kare

// Görünüşler: ten, bıyık, başlık (kask | kep), kask rengi
export const GORUNUS = [
  { ten: '#E8B48A', golge: '#C48A62', biyik: '#5A3A22', baslik: 'kask', kask: '#F2B632' },
  { ten: '#C98E62', golge: '#9E6A45', biyik: null, baslik: 'kask', kask: '#F2B632' },
  { ten: '#F0C29A', golge: '#CF9A70', biyik: '#3A2416', baslik: 'kask', kask: '#F08A3C' },
  { ten: '#B47A52', golge: '#8C5A38', biyik: '#2B1D12', baslik: 'kep', kask: '#C4553B' },
]

const CIZGI = '#24170E'             // dış çizgi
const TULUM = ['#4A82C8', '#3466AE', '#244C86']
const TULUM_ARKA = '#2A4E80'
const GOMLEK = '#E9DFC8', GOMLEK_G = '#C9BC9E'
const ASKI = '#E08A32'
const ELDIVEN = '#B9865A'
const BOT = '#3A2416'
const SAP = '#9A6334', SAP_A = '#C08850'
const CELIK = '#AEB8C2', CELIK_K = '#6E7A86', CELIK_A = '#E2E8EE'
const CUVAL = '#C9A46A', CUVAL_K = '#9C7A46'

const R = Math.PI / 180
const sin = Math.sin, cos = Math.cos

// ── Ters kinematik: omuzdan hedefe iki parçalı kol, dirsek 'yon' tarafına bükülür ──
function ik(sx, sy, tx, ty, l1, l2, yon) {
  let dx = tx - sx, dy = ty - sy
  let d = Math.hypot(dx, dy)
  const enCok = l1 + l2 - 0.01
  if (d > enCok) { dx *= enCok / d; dy *= enCok / d; d = enCok }
  const a = Math.atan2(dy, dx)
  const b = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
  const ea = a + b * yon
  const ex = sx + cos(ea) * l1, ey = sy + sin(ea) * l1
  return [ex, ey, sx + dx, sy + dy]
}

// ── Pozlar ──
// Dönen poz: bob (dikey), egim (gövde öne eğimi, rad), bacak [[kalça açısı, diz], [..]] (arka, ön),
// kol: { arka: [hx, hy] | null, on: [hx, hy] | null } (el hedefi, kalçaya göre), arac: { tur, aci, x, y },
// bas (baş eğimi), otur, sq (gövde ölçeği), yuk (çuval omuzda)
function poz(anim, k) {
  const p = { bob: 0, egim: 0, bacak: [[-0.06, 0.08], [0.08, 0.06]], kol: { arka: null, on: null }, arac: null, bas: 0, otur: false, sq: 1, yuk: false, kolSalla: [0.05, -0.05] }
  const f = (k / (ANIM[anim] ? ANIM[anim].kare : 8)) * Math.PI * 2
  if (anim === 'yuru' || anim === 'tasi' || anim === 'it') {
    const adim = anim === 'it' ? 0.55 : 0.48
    const s = sin(f)
    p.bacak = [
      [-adim * s, 0.12 + 0.62 * Math.max(0, sin(f + Math.PI - 0.5))],
      [adim * s, 0.12 + 0.62 * Math.max(0, sin(f - 0.5))],
    ]
    p.bob = -Math.abs(cos(f)) * 1.3 + 0.6
    p.egim = anim === 'it' ? 0.42 : anim === 'tasi' ? 0.1 : 0.06
    p.kolSalla = [0.55 * s, -0.55 * s]
    if (anim === 'tasi') { p.yuk = true; p.kol.arka = [-3.5, -30.5]; p.kolSalla = [0, -0.45 * s] }
    if (anim === 'it') { p.kol.arka = [13.5, -17]; p.kol.on = [14.5, -16.5] }
    p.bas = anim === 'it' ? -0.18 : 0
  } else if (anim === 'kaz') {
    // Kazma: kalkış (0-2), iniş (3), vuruş (4), geri tepme (5), toparlanma (6-7)
    const EL = [[-2, -35], [-4, -37.5], [-3, -38.5], [6, -31], [11, -21], [10.5, -22.5], [6, -27], [1, -32.5]]
    const ACI = [-55, -95, -120, 15, 98, 104, 62, 5]
    const EG = [-0.1, -0.16, -0.2, 0.1, 0.3, 0.27, 0.15, 0.02]
    p.egim = EG[k]
    p.arac = { tur: 'kazma', aci: ACI[k] * R, x: EL[k][0], y: EL[k][1] }
    p.kol.arka = [EL[k][0] - 1.2, EL[k][1] + 1.6]
    p.kol.on = [EL[k][0] + 1.2, EL[k][1] - 1.4]
    const diz = k === 4 || k === 5 ? 0.42 : 0.18
    p.bacak = [[-0.32, diz * 0.6], [0.34, diz]]
    p.bob = k === 4 ? 1.2 : k === 5 ? 1 : 0
    p.bas = k === 4 ? 0.12 : -0.04
    p.sq = k === 4 ? 0.96 : 1
  } else if (anim === 'bekle') {
    // Nefes ve ağırlık aktarma; 3-4. karelerde etrafa bakar
    p.sq = 1 + 0.018 * sin(f)
    p.bob = 0.25 * sin(f)
    p.bacak = [[-0.1, 0.08], [0.12 + 0.03 * sin(f), 0.1]]
    p.bas = k === 3 || k === 4 ? -0.16 : 0.02
    p.kolSalla = [0.12 + 0.03 * sin(f), -0.08]
  } else if (anim === 'dinlen') {
    // Sandığın üstünde oturur; 2. karede alnını siler
    p.otur = true
    p.sq = 1 + 0.014 * sin(f)
    p.egim = -0.08
    p.kol.on = k === 2 ? [3.5, -27.5] : [7.5, -12]
    p.kol.arka = [6, -11.5]
    p.bas = k === 2 ? -0.1 : 0.08
  } else if (anim === 'sevin') {
    const Y = [0, -2.5, -5.5, -5.5, -2.5, 0]
    p.bob = Y[k]
    p.kol.arka = [-6, -41 - (k % 2)]
    p.kol.on = [7, -42 + (k % 2)]
    p.bacak = k === 2 || k === 3 ? [[-0.25, 0.7], [0.3, 0.8]] : [[-0.12, 0.15], [0.14, 0.15]]
    p.sq = k === 0 || k === 5 ? 0.95 : 1.02
  } else if (anim === 'egil' || anim === 'bosalt') {
    // Eğilip yerden yük alır / çuvalı boşaltır
    const e = [0.25, 0.55, 0.7, 0.4][k]
    p.egim = e
    p.bacak = [[-0.2, 0.25 + e * 0.6], [0.25, 0.3 + e * 0.7]]
    p.bob = e * 3
    p.kol.arka = [8 + e * 4, -14 + e * 6]
    p.kol.on = [9.5 + e * 4, -13 + e * 6]
    p.yuk = anim === 'bosalt' ? k < 2 : k >= 2
    if (p.yuk) { p.kol.arka = [-3.5 + e * 6, -30.5 + e * 9] }
  }
  return p
}

// ── Çizim yardımcıları ──
function uzuv(c, pts, kal, renk) {
  // Dış çizgili kalın uzuv (önce koyu, sonra renk)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  for (const [r, k] of [[CIZGI, kal + 1.7], [renk, kal]]) {
    c.strokeStyle = r
    c.lineWidth = k
    c.beginPath()
    c.moveTo(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1])
    c.stroke()
  }
}
function dolCiz(c, yol, renk, kal = 0.9) {
  c.fillStyle = renk
  c.fill(yol)
  c.strokeStyle = CIZGI
  c.lineWidth = kal
  c.stroke(yol)
}
function oval(x, y, rx, ry, a = 0) {
  const p = new Path2D()
  p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2)
  return p
}
function yuvarlak(x, y, w, h, r) {
  const p = new Path2D()
  p.roundRect ? p.roundRect(x, y, w, h, r) : p.rect(x, y, w, h)
  return p
}

function botCiz(c, x, y, aci) {
  c.save()
  c.translate(x, y)
  c.rotate(aci * 0.5)
  const p = new Path2D()
  p.moveTo(-2.6, -3.2)
  p.lineTo(2.2, -3.2)
  p.quadraticCurveTo(5.4, -2.8, 5.2, 0)
  p.lineTo(-2.8, 0)
  p.closePath()
  dolCiz(c, p, BOT, 0.8)
  c.fillStyle = 'rgba(255,255,255,.18)'
  c.fillRect(-1.8, -2.7, 3, 0.8)
  c.restore()
}

// Bacak: kalçadan dize, dizden ayağa (aci: dikeyden öne, diz: bükülme)
function bacakCiz(c, hx, hy, aci, diz, renk) {
  const kx = hx + sin(aci) * 6.6, ky = hy + cos(aci) * 6.6
  const sa = aci - diz
  const ax = kx + sin(sa) * 6.4, ay = ky + cos(sa) * 6.4
  uzuv(c, [hx, hy, kx, ky, ax, ay - 1.2], 5.4, renk)
  botCiz(c, ax, ay, sa)
}

function govdeCiz(c, sq, gor) {
  c.save()
  c.scale(1, sq)
  // Gömlek (yakada ve kollarda görünür)
  dolCiz(c, yuvarlak(-7.2, -14.8, 14.6, 8.4, 4), GOMLEK)
  // Tulum: önlük + pantolon üstü
  const t = new Path2D()
  t.moveTo(-7.4, -8.6)
  t.lineTo(-5.2, -11.8)
  t.lineTo(5.4, -11.8)
  t.lineTo(7.6, -8.6)
  t.quadraticCurveTo(8.6, -2, 7.4, 1.8)
  t.lineTo(-7.2, 1.8)
  t.quadraticCurveTo(-8.6, -2, -7.4, -8.6)
  t.closePath()
  const g = c.createLinearGradient(-6, 0, 7, 0)
  g.addColorStop(0, TULUM[2]); g.addColorStop(0.45, TULUM[0]); g.addColorStop(1, TULUM[1])
  dolCiz(c, t, g)
  // Cep, kemer ve dikiş
  c.fillStyle = 'rgba(0,0,0,.18)'
  c.fillRect(-2.5, -10.4, 5, 3.2)
  c.fillStyle = 'rgba(30,30,40,.45)'
  c.fillRect(-7.6, -3.8, 15.6, 1.6)
  c.fillStyle = '#E8C060'
  c.fillRect(-1.2, -4, 2.4, 2)
  // Askılar ve tokalar
  c.strokeStyle = ASKI
  c.lineWidth = 1.5
  c.lineCap = 'round'
  c.beginPath(); c.moveTo(-5, -14.8); c.lineTo(-4, -11.4); c.moveTo(5, -14.8); c.lineTo(4, -11.4); c.stroke()
  c.fillStyle = '#FFE08A'
  c.fillRect(-4.7, -12, 1.4, 1.4)
  c.fillRect(3.3, -12, 1.4, 1.4)
  c.restore()
}

function basCiz(c, gor, egim) {
  c.save()
  c.translate(1.4, -21.6)
  c.rotate(egim)
  c.scale(1.08, 1.08)
  // Boyun
  c.fillStyle = gor.golge
  c.fillRect(-1.8, 3.4, 3.6, 3.6)
  // Yüz
  const yuz = oval(0.4, 0, 6.4, 6.6)
  const g = c.createRadialGradient(2.2, -1.6, 0.5, 0.4, 0, 8)
  g.addColorStop(0, gor.ten); g.addColorStop(1, gor.golge)
  dolCiz(c, yuz, g)
  // Kulak
  dolCiz(c, oval(-2.6, 0.8, 1.5, 2), gor.golge, 0.7)
  // Göz, kaş, burun, yanak
  c.fillStyle = '#1C120A'
  c.fill(oval(3.6, -0.7, 0.85, 1.15))
  c.fillStyle = 'rgba(255,255,255,.9)'
  c.fill(oval(3.9, -1.1, 0.3, 0.35))
  c.strokeStyle = 'rgba(40,24,12,.8)'
  c.lineWidth = 0.75
  c.lineCap = 'round'
  c.beginPath(); c.moveTo(2.4, -2.9); c.lineTo(5, -2.5); c.stroke()
  dolCiz(c, oval(6.4, 1.3, 1.7, 1.4), gor.golge, 0.6)
  c.fillStyle = 'rgba(226,90,67,.25)'
  c.fill(oval(3.4, 2.4, 1.5, 0.9))
  if (gor.biyik) {
    const b = new Path2D()
    b.moveTo(3.3, 3.2)
    b.quadraticCurveTo(5.4, 2, 7.4, 3.2)
    b.quadraticCurveTo(6.6, 4.8, 5.3, 4)
    b.quadraticCurveTo(4.2, 4.8, 3.3, 3.2)
    c.fillStyle = gor.biyik
    c.fill(b)
  } else {
    c.strokeStyle = 'rgba(60,30,15,.7)'
    c.lineWidth = 0.6
    c.beginPath(); c.moveTo(4.4, 3.9); c.quadraticCurveTo(5.3, 4.4, 6.2, 3.8); c.stroke()
  }
  if (gor.baslik === 'kep') {
    const kep = new Path2D()
    kep.moveTo(-6.4, -1.2)
    kep.quadraticCurveTo(-6.2, -8.4, 0.4, -8.2)
    kep.quadraticCurveTo(6.6, -8.2, 6.8, -1.6)
    kep.closePath()
    dolCiz(c, kep, gor.kask)
    c.fillStyle = 'rgba(255,255,255,.25)'
    c.fill(oval(-1, -5.6, 3, 1.4, -0.3))
    dolCiz(c, yuvarlak(2.2, -2.8, 8.8, 2, 1), '#8E3424', 0.7)
  } else {
    const kask = new Path2D()
    kask.moveTo(-7.4, -1.4)
    kask.quadraticCurveTo(-7.4, -9.8, 0.4, -9.6)
    kask.quadraticCurveTo(7.8, -9.6, 7.8, -1.6)
    kask.closePath()
    const kg = c.createLinearGradient(0, -9.8, 0, -1.4)
    kg.addColorStop(0, '#FFE69A'); kg.addColorStop(0.5, gor.kask); kg.addColorStop(1, '#B9781A')
    dolCiz(c, kask, kg)
    c.fillStyle = 'rgba(122,74,16,.35)'
    c.fillRect(-0.2, -9.2, 1, 7.6)
    c.fillStyle = 'rgba(255,255,255,.4)'
    c.fill(oval(-2.6, -6.6, 2.6, 1.3, -0.4))
    dolCiz(c, yuvarlak(-8.6, -2.8, 18.6, 2.3, 1.1), '#D99A2B', 0.7)
    // Kask feneri
    dolCiz(c, oval(5.8, -5.4, 2.2, 2), '#5A5F66', 0.6)
    c.fillStyle = '#FFF6D0'
    c.fill(oval(6.1, -5.5, 1.4, 1.3))
  }
  c.restore()
}

function kazmaCiz(c, x, y, aci) {
  const dx = sin(aci), dy = -cos(aci)
  const bx = x - dx * 4, by = y - dy * 4
  const ux = x + dx * 17, uy = y + dy * 17
  uzuv(c, [bx, by, ux, uy], 1.9, SAP)
  c.strokeStyle = SAP_A
  c.lineWidth = 0.6
  c.beginPath(); c.moveTo(bx + dy * 0.4, by - dx * 0.4); c.lineTo(ux + dy * 0.4, uy - dx * 0.4); c.stroke()
  // Baş: sapa dik, iki uçlu kavisli çelik
  const px = -dy, py = dx
  const a = [ux + px * 7.6 - dx * 1.6, uy + py * 7.6 - dy * 1.6]
  const b = [ux - px * 6.4 - dx * 2.8, uy - py * 6.4 - dy * 2.8]
  const k = [ux + dx * 2.8, uy + dy * 2.8]
  c.lineCap = 'round'
  for (const [r, w] of [[CIZGI, 4.4], [CELIK_K, 3], [CELIK, 1.8]]) {
    c.strokeStyle = r
    c.lineWidth = w
    c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(k[0], k[1], b[0], b[1]); c.stroke()
  }
  c.strokeStyle = CELIK_A
  c.lineWidth = 0.6
  c.beginPath(); c.moveTo(a[0] - dx * 0.6, a[1] - dy * 0.6); c.quadraticCurveTo(k[0], k[1], ux, uy); c.stroke()
}

function cuvalCiz(c, x, y, renk) {
  const p = new Path2D()
  p.moveTo(x - 6, y + 3.5)
  p.quadraticCurveTo(x - 7.2, y - 4.6, x - 1, y - 5.4)
  p.quadraticCurveTo(x + 6.6, y - 5.6, x + 6.4, y + 2.6)
  p.quadraticCurveTo(x + 0.4, y + 6.2, x - 6, y + 3.5)
  p.closePath()
  const g = c.createLinearGradient(x, y - 6, x, y + 5)
  g.addColorStop(0, '#E2C48C'); g.addColorStop(1, CUVAL_K)
  dolCiz(c, p, g)
  c.strokeStyle = 'rgba(90,60,30,.55)'
  c.lineWidth = 0.6
  c.beginPath(); c.moveTo(x - 4, y - 1); c.lineTo(x + 4.5, y - 2.2); c.moveTo(x - 4.6, y + 1.6); c.lineTo(x + 4, y + 0.6); c.stroke()
  // Ağızdan taşan cevher
  c.fillStyle = renk
  for (const [ox, oy, r] of [[-1.6, -5.4, 1.6], [0.8, -6, 1.4], [2.8, -5.2, 1.2]]) {
    c.beginPath(); c.arc(x + ox, y + oy, r, 0, Math.PI * 2); c.fill()
  }
  c.strokeStyle = CIZGI
  c.lineWidth = 0.5
  c.beginPath(); c.arc(x - 1.6, y - 5.4, 1.6, 0, Math.PI * 2); c.stroke()
}

function sandikCiz(c) {
  const p = yuvarlak(-5, -9.6, 13.5, 9.6, 1)
  dolCiz(c, p, '#9A6334')
  c.strokeStyle = 'rgba(40,20,8,.5)'
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(-5, -4.8); c.lineTo(8.5, -4.8); c.moveTo(-5, -9.6); c.lineTo(8.5, 0); c.stroke()
  c.fillStyle = 'rgba(255,230,180,.25)'
  c.fillRect(-4.4, -9, 12.4, 1)
}

// ── Figür ──
// c: ayak noktası orijinde. gor: GORUNUS öğesi. cevher: çuvaldaki cevher rengi
function figurCiz(c, p, gor, cevher) {
  // Zemin gölgesi
  c.fillStyle = 'rgba(0,0,0,.28)'
  c.fill(oval(p.otur ? 2 : 0.5, 0.2, p.otur ? 10 : 8.5, 1.8))
  if (p.otur) {
    sandikCiz(c)
    // Oturan bacaklar: kalça sandıkta, diz önde, ayak yerde
    const hx = 0, hy = -10.2
    uzuv(c, [hx - 1, hy, hx + 6.2, hy - 0.4, hx + 7.4, -1.2], 5.4, TULUM_ARKA)
    botCiz(c, hx + 7.6, 0, 0)
  }
  const hx = 0, hy = p.otur ? -10.2 : -12.6 + p.bob
  if (!p.otur) bacakCiz(c, hx - 0.8, hy, p.bacak[0][0], p.bacak[0][1], TULUM_ARKA)

  c.save()
  c.translate(hx, hy)
  c.rotate(p.egim)
  // Omuzlar (kalçaya göre)
  const omA = [-2.4, -12.8 * p.sq], omO = [2.8, -12.6 * p.sq]
  const kolHedef = (el, om, salla) => {
    if (!el) return [om[0] + sin(salla) * 10.2, om[1] + cos(salla) * 10.2]
    // Hedef kalça çerçevesinde verildi (figür çerçevesi), eğim geri alınır
    const ex = el[0] - hx, ey = el[1] - hy
    const ce = cos(-p.egim), se = sin(-p.egim)
    return [ex * ce - ey * se, ex * se + ey * ce]
  }
  // Arka kol (gövdenin arkasında) ve araç
  const ta = kolHedef(p.kol.arka, omA, p.kolSalla[0])
  const [ea1, ea2, ha1, ha2] = ik(omA[0], omA[1], ta[0], ta[1], 5.8, 6, p.kol.arka ? -1 : 1)
  if (p.yuk) {
    // Çuval omuzun üstünde (baştan önce çizilir, baş önde kalır)
    cuvalCiz(c, -4.6, -17.6, cevher)
  }
  uzuv(c, [omA[0], omA[1], ea1, ea2, ha1, ha2], 4, GOMLEK_G)
  dolCiz(c, oval(ha1, ha2, 2.3, 2.2), ELDIVEN, 0.7)
  govdeCiz(c, p.sq, gor)
  c.restore()

  if (!p.otur) bacakCiz(c, hx + 0.8, hy, p.bacak[1][0], p.bacak[1][1], TULUM[1])

  c.save()
  c.translate(hx, hy)
  c.rotate(p.egim)
  c.scale(1, p.sq)
  basCiz(c, gor, p.bas)
  c.scale(1, 1 / p.sq)
  if (p.arac && p.arac.tur === 'kazma') {
    const ax = p.arac.x - hx, ay = p.arac.y - hy
    const ce = cos(-p.egim), se = sin(-p.egim)
    kazmaCiz(c, ax * ce - ay * se, ax * se + ay * ce, p.arac.aci - p.egim)
  }
  // Ön kol
  const to = kolHedef(p.kol.on, omO, p.kolSalla[1])
  const [eo1, eo2, ho1, ho2] = ik(omO[0], omO[1], to[0], to[1], 5.8, 6, p.kol.on ? -1 : 1)
  uzuv(c, [omO[0], omO[1], eo1, eo2, ho1, ho2], 4.2, GOMLEK)
  dolCiz(c, oval(ho1, ho2, 2.4, 2.3), ELDIVEN, 0.7)
  c.restore()
}

// ── Maden arabası (ayrı çizilir; dolu ise cevher yığını) ──
export const ARABA = { w: 26, h: 16 }   // birim
export function arabaCiz(c, dolu, cevher, vurgu) {
  // c: arabanın alt orta noktası orijinde
  const g = c.createLinearGradient(0, -14, 0, -3)
  g.addColorStop(0, '#8C9AA8'); g.addColorStop(0.5, '#6A7886'); g.addColorStop(1, '#46525E')
  const k = new Path2D()
  k.moveTo(-12.5, -13)
  k.lineTo(12.5, -13)
  k.lineTo(10.6, -3.6)
  k.lineTo(-10.6, -3.6)
  k.closePath()
  if (dolu) {
    // Yığın kasanın arkasında kalır, üstü taşar
    c.fillStyle = cevher
    const y = new Path2D()
    y.moveTo(-11.6, -12.6)
    y.quadraticCurveTo(-8, -19.5, -1, -19.8)
    y.quadraticCurveTo(7, -20, 11.6, -12.6)
    y.closePath()
    dolCiz(c, y, cevher, 0.8)
    c.fillStyle = vurgu
    for (const [x, yy, r] of [[-6, -15.5, 1.5], [-1.5, -17.8, 1.7], [3.6, -16.6, 1.4], [7.4, -14.6, 1.2], [1, -14.6, 1.1]]) {
      c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2); c.fill()
    }
  }
  dolCiz(c, k, g, 1)
  c.fillStyle = 'rgba(255,255,255,.28)'
  c.fillRect(-12, -12.6, 24, 1.2)
  c.fillStyle = 'rgba(20,24,28,.55)'
  for (const x of [-8.5, -3, 2.5, 8]) { c.beginPath(); c.arc(x, -8.4, 0.75, 0, Math.PI * 2); c.fill() }
  c.strokeStyle = 'rgba(0,0,0,.3)'
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(-11.4, -7.6); c.lineTo(11.4, -7.6); c.stroke()
  for (const x of [-7, 7]) {
    dolCiz(c, oval(x, -2.6, 2.8, 2.8), '#2A2E33', 0.8)
    c.fillStyle = '#9AA6B2'
    c.beginPath(); c.arc(x, -2.6, 1, 0, Math.PI * 2); c.fill()
  }
}

// ── Önbellekli kareler ──
// olcek: birim → cihaz pikseli. Anahtar: görünüş|anim|kare|cevher
// Ölçek de anahtarda (kabin operatörü küçük çizilir); ekran boyutu değişince eskiler birikmesin diye sınır var
const onbellek = new Map()
export function figurKare(gorunus, anim, k, olcek, cevher) {
  const anahtar = gorunus + '|' + anim + '|' + k + '|' + (cevher || '') + '|' + olcek.toFixed(3)
  let cv = onbellek.get(anahtar)
  if (cv) return cv
  cv = document.createElement('canvas')
  cv.width = Math.ceil(HUCRE.w * olcek)
  cv.height = Math.ceil(HUCRE.h * olcek)
  const c = cv.getContext('2d')
  c.scale(olcek, olcek)
  c.translate(HUCRE.ayakX, HUCRE.ayakY)
  figurCiz(c, poz(anim, k), GORUNUS[gorunus % GORUNUS.length], cevher || '#2A2E33')
  if (onbellek.size > 600) onbellek.clear()
  onbellek.set(anahtar, cv)
  return cv
}
const arabaOnbellek = new Map()
export function arabaKare(dolu, cevher, vurgu, olcek) {
  const anahtar = (dolu ? 1 : 0) + '|' + cevher + '|' + olcek.toFixed(3)
  let cv = arabaOnbellek.get(anahtar)
  if (cv) return cv
  if (arabaOnbellek.size > 16) arabaOnbellek.clear()
  cv = document.createElement('canvas')
  cv.width = Math.ceil(30 * olcek)
  cv.height = Math.ceil(24 * olcek)
  const c = cv.getContext('2d')
  c.scale(olcek, olcek)
  c.translate(15, 22)
  arabaCiz(c, dolu, cevher, vurgu)
  arabaOnbellek.set(anahtar, cv)
  return cv
}
// Karenin hücre içindeki ayak noktası (cihaz pikseli) ve araba orijini
export const figurAyak = (olcek) => [HUCRE.ayakX * olcek, HUCRE.ayakY * olcek]
export const arabaAyak = (olcek) => [15 * olcek, 22 * olcek]

// Zamana göre kare (döngü süresi tempo ile ölçeklenir)
export function kareSec(anim, faz) {
  const a = ANIM[anim]
  const u = faz - Math.floor(faz)
  return Math.min(a.kare - 1, Math.floor(u * a.kare))
}
export const figurBellek = () => onbellek.size

