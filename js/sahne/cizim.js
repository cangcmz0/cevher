// Çizim yardımcıları (§5.2): gürültü dokuları, gradyanlar, kenar ışığı, parıltı sprite'ı.
// Buradaki her şey yalnızca fırınlama (bake) sırasında çalışır; kare başına çağrılmaz.

// mulberry32: tohumlu PRNG (sahne çeşitliliği için; durumun PRNG'sine dokunmaz)
export function rastgele(tohum) {
  let a = (tohum >>> 0) || 1
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Kare başında güvenle kullanılabilen saf karma (0..1)
export function karma(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function tuvalYap(w, h) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h))
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    return c
  }
  return new OffscreenCanvas(w, h)
}

// ---- Renk ----
function hexRgb(h) {
  h = h.replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const ikiHane = (v) => {
  const s = Math.max(0, Math.min(255, Math.round(v))).toString(16)
  return s.length < 2 ? '0' + s : s
}
export function karistir(a, b, t) {
  const x = hexRgb(a), y = hexRgb(b)
  return '#' + ikiHane(x[0] + (y[0] - x[0]) * t) + ikiHane(x[1] + (y[1] - x[1]) * t) + ikiHane(x[2] + (y[2] - x[2]) * t)
}
export function rgba(h, a) {
  const c = hexRgb(h)
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
}
export const acik = (h, t) => karistir(h, '#ffffff', t)
export const koyu = (h, t) => karistir(h, '#000000', t)

// ---- Gürültü dokuları (bir kez üretilir) ----
let gurultuT = null, taneT = null

// 256×256 döşenebilir değer gürültüsü, 2 oktav. Açık gri tonlar: multiply ile hafif doku verir.
export function gurultuDokusu() {
  if (gurultuT) return gurultuT
  const N = 256
  const c = tuvalYap(N, N)
  const g = c.getContext('2d')
  const img = g.createImageData(N, N)
  const r = rastgele(7331)
  const izgara = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a }
  const o1 = 16, o2 = 32
  const a1 = izgara(o1), a2 = izgara(o2)
  const yumusak = (t) => t * t * (3 - 2 * t)
  const ornek = (a, n, x, y) => {
    const fx = x * n / N, fy = y * n / N
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = yumusak(fx - x0), ty = yumusak(fy - y0)
    const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n
    const v00 = a[y0 * n + x0], v10 = a[y0 * n + x1], v01 = a[y1 * n + x0], v11 = a[y1 * n + x1]
    return (v00 + (v10 - v00) * tx) + ((v01 + (v11 - v01) * tx) - (v00 + (v10 - v00) * tx)) * ty
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = ornek(a1, o1, x, y) * 0.65 + ornek(a2, o2, x, y) * 0.35
      const k = (y * N + x) * 4
      const g2 = 120 + v * 135
      img.data[k] = g2; img.data[k + 1] = g2 * 0.97; img.data[k + 2] = g2 * 0.92; img.data[k + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  gurultuT = c
  return c
}

// 128×128 kumlanma (grain)
export function taneDokusu() {
  if (taneT) return taneT
  const N = 128
  const c = tuvalYap(N, N)
  const g = c.getContext('2d')
  const img = g.createImageData(N, N)
  const r = rastgele(99173)
  for (let i = 0; i < N * N; i++) {
    const v = 150 + r() * 105
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  taneT = c
  return c
}

// Bir alanı doku ile kaplar (multiply / soft-light). ox/oy desen kaydırması.
export function dokuKapla(ctx, x, y, w, h, tur, alfa, mod, ox = 0, oy = 0, olcek = 1) {
  const kaynak = tur === 'tane' ? taneDokusu() : gurultuDokusu()
  const desen = ctx.createPattern(kaynak, 'repeat')
  ctx.save()
  ctx.globalAlpha = alfa
  ctx.globalCompositeOperation = mod || 'multiply'
  ctx.translate(ox, oy)
  if (olcek !== 1) ctx.scale(olcek, olcek)
  ctx.fillStyle = desen
  ctx.fillRect((x - ox) / olcek, (y - oy) / olcek, w / olcek, h / olcek)
  ctx.restore()
}

// Yalnız bir yolun içine doku
export function yolaDoku(ctx, yol, tur, alfa, mod, ox = 0, oy = 0, olcek = 1) {
  ctx.save()
  ctx.clip(yol)
  dokuKapla(ctx, -2000, -2000, 6000, 6000, tur, alfa, mod, ox, oy, olcek)
  ctx.restore()
}

// ---- Gradyan ----
export function dikey(ctx, y0, y1, duraklar) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  for (let i = 0; i < duraklar.length; i++) {
    const d = duraklar[i]
    if (Array.isArray(d)) g.addColorStop(d[0], d[1])
    else g.addColorStop(i / (duraklar.length - 1), d)
  }
  return g
}
export function yatay(ctx, x0, x1, duraklar) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0)
  for (let i = 0; i < duraklar.length; i++) g.addColorStop(i / (duraklar.length - 1), duraklar[i])
  return g
}
export function radyal(ctx, x, y, r, duraklar, r0 = 0) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r)
  for (let i = 0; i < duraklar.length; i++) {
    const d = duraklar[i]
    if (Array.isArray(d)) g.addColorStop(d[0], d[1])
    else g.addColorStop(i / (duraklar.length - 1), d)
  }
  return g
}

// ---- Yollar ----
export function yuvarlakYol(x, y, w, h, r) {
  const p = new Path2D()
  r = Math.min(r, w / 2, h / 2)
  p.moveTo(x + r, y)
  p.arcTo(x + w, y, x + w, y + h, r)
  p.arcTo(x + w, y + h, x, y + h, r)
  p.arcTo(x, y + h, x, y, r)
  p.arcTo(x, y, x + w, y, r)
  p.closePath()
  return p
}
export function elips(x, y, rx, ry, a = 0) {
  const p = new Path2D()
  p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, Math.PI * 2)
  return p
}
export function cokgen(noktalar) {
  const p = new Path2D()
  for (let i = 0; i < noktalar.length; i += 2) {
    if (i === 0) p.moveTo(noktalar[0], noktalar[1]); else p.lineTo(noktalar[i], noktalar[i + 1])
  }
  p.closePath()
  return p
}
// Pürüzlü taş/topak: merkez etrafında rastgele yarıçaplı yumuşak çokgen
export function topakYol(x, y, rx, ry, r, kose = 7, puruz = 0.28) {
  const p = new Path2D()
  const n = kose
  const pts = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3
    const k = 1 - puruz / 2 + r() * puruz
    pts.push(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k)
  }
  // orta noktalardan quadratic ile yumuşat
  const m = (i) => [(pts[i * 2] + pts[((i + 1) % n) * 2]) / 2, (pts[i * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2]
  const b = m(n - 1)
  p.moveTo(b[0], b[1])
  for (let i = 0; i < n; i++) {
    const q = m(i)
    p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], q[0], q[1])
  }
  p.closePath()
  return p
}

// ---- Kenar ışığı: şeklin sol-üst kenarına içten ince açık çizgi ----
export function kenarIsik(ctx, yol, renk, k = 1.5, alfa = 0.35, dx = 1, dy = 1) {
  ctx.save()
  ctx.clip(yol)
  ctx.globalAlpha = alfa
  ctx.strokeStyle = renk
  ctx.lineWidth = k * 2
  ctx.translate(dx * k, dy * k)
  ctx.stroke(yol)
  ctx.restore()
}
// Alt-sağ iç gölge (aynı hile, ters yön)
export function icGolge(ctx, yol, renk, k = 2, alfa = 0.35) {
  kenarIsik(ctx, yol, renk, k, alfa, -1, -1)
}

// Yumuşak gölge yalnızca fırında (shadowBlur kare başına asla)
export function golgeli(ctx, blur, renk, oy, fn) {
  ctx.save()
  ctx.shadowColor = renk
  ctx.shadowBlur = blur
  ctx.shadowOffsetY = oy
  fn()
  ctx.restore()
}

// ---- Parıltı sprite'ı (additive) ----
export function parilti(ctx, w, h, renkler) {
  const r = Math.min(w, h) / 2
  ctx.fillStyle = radyal(ctx, w / 2, h / 2, r, renkler)
  ctx.fillRect(0, 0, w, h)
}

// Kalın çizgi parçası (uzuvlar için)
export function cizgi(ctx, x0, y0, x1, y1, k, renk) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.lineCap = 'round'
  ctx.lineWidth = k
  ctx.strokeStyle = renk
  ctx.stroke()
}

// Tahta kalas: dikey gradyan + damar + budak
export function kalas(ctx, x, y, w, h, r, renkA, renkB, yatayMi = true) {
  const yol = yuvarlakYol(x, y, w, h, Math.min(1.5, h / 3, w / 3))
  ctx.fillStyle = yatayMi
    ? dikey(ctx, y, y + h, [acik(renkA, 0.12), renkA, renkB])
    : yatay(ctx, x, x + w, [acik(renkA, 0.1), renkA, renkB])
  ctx.fill(yol)
  ctx.save()
  ctx.clip(yol)
  ctx.globalAlpha = 0.28
  ctx.strokeStyle = koyu(renkB, 0.35)
  ctx.lineWidth = 0.6
  const n = Math.max(2, Math.round((yatayMi ? h : w) / 3))
  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    if (yatayMi) {
      const yy = y + (i + 0.5) * h / n + (r() - 0.5)
      ctx.moveTo(x, yy)
      for (let xx = x; xx <= x + w; xx += 6) ctx.lineTo(xx, yy + Math.sin(xx * 0.3 + i) * 0.5)
    } else {
      const xx = x + (i + 0.5) * w / n + (r() - 0.5)
      ctx.moveTo(xx, y)
      for (let yy = y; yy <= y + h; yy += 6) ctx.lineTo(xx + Math.sin(yy * 0.3 + i) * 0.5, yy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 0.5
  const budak = Math.floor(r() * 2)
  for (let i = 0; i < budak; i++) {
    const bx = yatayMi ? x + 3 + r() * (w - 6) : x + w / 2
    const by = yatayMi ? y + h / 2 : y + 3 + r() * (h - 6)
    ctx.fillStyle = koyu(renkB, 0.45)
    ctx.fill(elips(bx, by, yatayMi ? 1.6 : 0.9, yatayMi ? 0.9 : 1.6))
  }
  ctx.restore()
  kenarIsik(ctx, yol, '#FFE2B0', 0.8, 0.35)
}

// Demir köşebent / cıvata
export function civata(ctx, x, y, r = 1.2) {
  ctx.fillStyle = '#2A2E33'
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(220,230,240,.75)'
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.4, 0, Math.PI * 2); ctx.fill()
}

// Kömür topakları yığını: (x,y) taban merkezi, genişlik, yükseklik
export function komurYigini(ctx, x, y, w, h, r, renk = '#1F2326', isik = '#9FB7C9', adet) {
  const n = adet || Math.max(4, Math.round(w * h / 14))
  for (let i = 0; i < n; i++) {
    // yığın profili: ortada yüksek
    const u = r() * 2 - 1
    const tepe = h * (1 - u * u)
    const px = x + u * w / 2
    const py = y - r() * tepe
    const s = 1.4 + r() * 2.2
    const yol = topakYol(px, py, s, s * 0.85, r, 5 + Math.floor(r() * 3), 0.45)
    ctx.fillStyle = dikey(ctx, py - s, py + s, [acik(renk, 0.18), renk, koyu(renk, 0.35)])
    ctx.fill(yol)
    kenarIsik(ctx, yol, isik, 0.6, 0.55)
    if (r() < 0.35) {
      ctx.fillStyle = rgba('#DDEBF5', 0.85)
      ctx.fillRect(px - s * 0.3, py - s * 0.45, 0.7, 0.7)
    }
  }
}
