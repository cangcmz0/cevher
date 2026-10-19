// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Dekor (sahne v4): kat şeritleri, yükleme katı, kuyu, kabin ve cevher yığınları çizimle üretilir.
// • Kaya: gürültü dokulu taban + üstten ışık alan kabartmalı taşlar (kenar ışığı, alt gölge, çatlak).
// • Ahşap: damarlı, budaklı, uçları kararmış kalaslar; metal: perçinli, parlak kirişler ve borular.
// • Işık: fenerlerin duvara düşen sıcak ışık havuzları, köşelerde ortam gölgesi.
// • Ölçüler referans pikseliyle (kat 367×107): x → x·k, y → y·ky. Yerleşim (yerlesim.js) ile birebir.
// • Şeritler bölge ve ekran boyutuna göre bir kez fırınlanır; kare başına yalnız drawImage.

import { rastgele, acik, koyu, rgba } from './cizim.js'
import { BOLGE } from '../ayar.js'

const CIZGI = '#160E08'

// Bölge paletleri: kaya kütlesi, tünel duvarı (açık → koyu), taş tonları
export const KAYA = {
  zonguldak: { koyu: '#140F0C', orta: '#2E241C', acik: '#4E3E31', duvar: ['#86664A', '#5A4332', '#2E2219'], tas: ['#5E4A3A', '#705842', '#4C3C2F', '#3E3127'] },
  eregli: { koyu: '#170D09', orta: '#3A2219', acik: '#5E3A2B', duvar: ['#8C5E44', '#5E3A2A', '#30201A'], tas: ['#6E4434', '#80533E', '#5A382B', '#4A2E23'] },
  karabuk: { koyu: '#141311', orta: '#35312C', acik: '#58524A', duvar: ['#8E8576', '#5F5850', '#302C28'], tas: ['#6E675D', '#827A6E', '#5A544C', '#4A4540'] },
  kastamonu: { koyu: '#160F09', orta: '#37271A', acik: '#5A4129', duvar: ['#8C6646', '#5E4430', '#30221A'], tas: ['#6A4D35', '#7C5C40', '#56402D', '#463424'] },
}
export const kaya = (kod) => KAYA[kod] || KAYA.zonguldak
export const cevherRenk = (kod) => (BOLGE[kod] || BOLGE.zonguldak).renk
export const cevherVurgu = (kod) => (BOLGE[kod] || BOLGE.zonguldak).vurgu
export const KAT_DUZEN = 3   // komşu katlar farklı görünsün diye üç düzen

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
  egzoz: [121, 44],
})

// ════════ Temel yardımcılar ════════
const TAU = Math.PI * 2
function yolCiz(noktalar) {
  const p = new Path2D()
  noktalar.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
  p.closePath()
  return p
}
// Degrade: renkler eşit aralıklı ya da [konum, renk] çiftleri
function duraklar(g, renkler) {
  renkler.forEach((r, i) => g.addColorStop(Array.isArray(r) ? r[0] : i / (renkler.length - 1), Array.isArray(r) ? r[1] : r))
  return g
}
const dG = (c, y0, y1, renkler) => duraklar(c.createLinearGradient(0, y0, 0, y1), renkler)
const yG = (c, x0, x1, renkler) => duraklar(c.createLinearGradient(x0, 0, x1, 0), renkler)
function topak(x, y, rx, ry, r, kose = 9, puruz = 0.3) {
  const n = []
  for (let i = 0; i < kose; i++) {
    const a = (i / kose) * TAU + r() * 0.3
    const q = 1 - puruz / 2 + r() * puruz
    n.push([x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q])
  }
  // Yumuşatılmış köşeler: ardışık orta noktalar arası ikinci dereceden eğri
  const p = new Path2D()
  const o = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const m = o(n[n.length - 1], n[0])
  p.moveTo(m[0], m[1])
  for (let i = 0; i < n.length; i++) {
    const s = o(n[i], n[(i + 1) % n.length])
    p.quadraticCurveTo(n[i][0], n[i][1], s[0], s[1])
  }
  p.closePath()
  return p
}
function olcekAl(c) {
  const m = c.getTransform()
  return Math.hypot(m.a, m.b) || 1
}

// ── Gürültü: değer gürültüsü, dört oktav (0..1) ──
function gurultuAlani(w, h, tohum, hucre) {
  const r = rastgele(tohum)
  const alan = new Float32Array(w * h)
  let toplam = 0
  for (let ok = 0, g = 1; ok < 4; ok++, g *= 0.5) {
    const hc = Math.max(2, hucre / (1 << ok))
    const gw = Math.ceil(w / hc) + 2, gh = Math.ceil(h / hc) + 2
    const izgara = new Float32Array(gw * gh)
    for (let i = 0; i < izgara.length; i++) izgara[i] = r()
    for (let y = 0; y < h; y++) {
      const fy = y / hc, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty)
      for (let x = 0; x < w; x++) {
        const fx = x / hc, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx)
        const a = izgara[iy * gw + ix], b = izgara[iy * gw + ix + 1]
        const cc = izgara[(iy + 1) * gw + ix], d = izgara[(iy + 1) * gw + ix + 1]
        alan[y * w + x] += ((a + (b - a) * sx) * (1 - sy) + (cc + (d - cc) * sx) * sy) * g
      }
    }
    toplam += g
  }
  for (let i = 0; i < alan.length; i++) alan[i] /= toplam
  return alan
}
function hex(h) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
// Gürültü dokulu taban: renkler arasında gürültüyle karışım + ince tane (cihaz çözünürlüğünde)
function dokuTaban(c, x, y, w, h, renkler, tohum, hucre = 46, tane = 9) {
  // Yumuşak doku: yarım çözünürlükte üretilip büyütülür (fırınlama süresi dörtte bire iner)
  const s = olcekAl(c) * 0.5
  const pw = Math.max(1, Math.round(w * s)), ph = Math.max(1, Math.round(h * s))
  const tv = document.createElement('canvas')
  tv.width = pw
  tv.height = ph
  const g = tv.getContext('2d')
  const veri = g.createImageData(pw, ph)
  const alan = gurultuAlani(pw, ph, tohum, hucre * s)
  const R = renkler.map(hex)
  const r = rastgele(tohum + 1)
  const d = veri.data
  for (let i = 0, j = 0; i < alan.length; i++, j += 4) {
    const v = Math.min(0.999, Math.max(0, (alan[i] - 0.25) * 1.9))
    const t = v * (R.length - 1), k = Math.floor(t), f = t - k
    const a = R[k], b = R[Math.min(R.length - 1, k + 1)]
    const n = (r() - 0.5) * tane
    d[j] = a[0] + (b[0] - a[0]) * f + n
    d[j + 1] = a[1] + (b[1] - a[1]) * f + n
    d[j + 2] = a[2] + (b[2] - a[2]) * f + n
    d[j + 3] = 255
  }
  g.putImageData(veri, 0, 0)
  c.drawImage(tv, x, y, w, h)
}

// ── Taş: üstten ışık alan kabartma (kenar ışığı sol üstte, gölge sağ altta) ──
function tas(c, x, y, rx, ry, renk, r, isik = 1) {
  const p = topak(x, y, rx, ry, r, 8 + Math.floor(r() * 3), 0.34)
  c.save()
  c.translate(rx * 0.1 + 0.7, ry * 0.16 + 0.9)
  c.fillStyle = 'rgba(0,0,0,.42)'
  c.fill(p)
  c.restore()
  const g = c.createLinearGradient(x - rx, y - ry, x + rx * 0.6, y + ry)
  g.addColorStop(0, acik(renk, 0.2 * isik))
  g.addColorStop(0.5, renk)
  g.addColorStop(1, koyu(renk, 0.32))
  c.fillStyle = g
  c.fill(p)
  c.save()
  c.clip(p)
  c.translate(1, 1.2)
  c.strokeStyle = rgba('#FFF0D6', Math.min(0.6, 0.3 * isik))
  c.lineWidth = 1.5
  c.stroke(p)
  c.translate(-2.1, -2.5)
  c.strokeStyle = 'rgba(0,0,0,.32)'
  c.lineWidth = 1.7
  c.stroke(p)
  c.restore()
  if (r() < 0.35) {
    c.strokeStyle = 'rgba(10,6,4,.45)'
    c.lineWidth = 0.6
    c.beginPath()
    c.moveTo(x - rx * 0.4, y - ry * 0.3)
    c.lineTo(x - rx * 0.05, y + ry * 0.1)
    c.lineTo(x + rx * 0.3, y + ry * 0.05)
    c.stroke()
  }
  c.strokeStyle = 'rgba(10,6,4,.55)'
  c.lineWidth = 0.6
  c.stroke(p)
}

// Kaya kütlesi: dokulu taban + sık taşlar
function kayaKutle(c, x, y, w, h, kp, tohum, isik = 1, buyukluk = 1) {
  c.save()
  c.beginPath()
  c.rect(x, y, w, h)
  c.clip()
  dokuTaban(c, x, y, w, h, [kp.koyu, kp.orta, kp.acik], tohum, 40, 10)
  const r = rastgele(tohum + 7)
  const satir = 7.5 * buyukluk
  for (let yy = y - 2; yy < y + h + 6; yy += satir * (0.75 + r() * 0.4)) {
    for (let xx = x - 6 + r() * 6; xx < x + w + 8; xx += (9 + r() * 9) * buyukluk) {
      const rx = (4.2 + r() * 5.6) * buyukluk, ry = (2.8 + r() * 3.2) * buyukluk
      tas(c, xx, yy + (r() - 0.5) * 3, rx, ry, kp.tas[Math.floor(r() * kp.tas.length)], r, isik * (0.7 + r() * 0.5))
    }
  }
  c.restore()
}

// ── Ahşap kalas: damar çizgileri, budak, kararmış uçlar ──
function kalas(c, x, y, w, h, yatay, tohum = 1, ton = '#9A6334') {
  const r = rastgele(tohum)
  const p = new Path2D()
  p.rect(x, y, w, h)
  c.save()
  c.clip(p)
  c.fillStyle = yatay ? dG(c, y, y + h, [acik(ton, 0.25), ton, koyu(ton, 0.42)]) : yG(c, x, x + w, [koyu(ton, 0.38), acik(ton, 0.18), ton, koyu(ton, 0.3)])
  c.fillRect(x, y, w, h)
  const uz = yatay ? w : h, en = yatay ? h : w
  c.strokeStyle = rgba(koyu(ton, 0.55), 0.38)
  c.lineWidth = 0.45
  const n = Math.max(2, Math.round(en / 1.6))
  for (let i = 1; i < n; i++) {
    const o = (i / n) * en + (r() - 0.5) * 0.6
    const dalga = 0.3 + r() * 0.5, frek = 0.05 + r() * 0.08, faz = r() * TAU
    c.beginPath()
    for (let t = 0; t <= uz; t += 3) {
      const d = o + Math.sin(t * frek + faz) * dalga
      if (yatay) (t ? c.lineTo(x + t, y + d) : c.moveTo(x + t, y + d))
      else (t ? c.lineTo(x + d, y + t) : c.moveTo(x + d, y + t))
    }
    c.stroke()
  }
  if (uz > 24 && r() < 0.8) {
    const t = uz * (0.2 + r() * 0.6), o = en * (0.3 + r() * 0.4)
    const bx = yatay ? x + t : x + o, by = yatay ? y + o : y + t
    c.fillStyle = rgba(koyu(ton, 0.6), 0.75)
    c.beginPath(); c.ellipse(bx, by, yatay ? 2.2 : 1.1, yatay ? 1.1 : 2.2, 0, 0, TAU); c.fill()
    c.strokeStyle = rgba(koyu(ton, 0.5), 0.4)
    c.beginPath(); c.ellipse(bx, by, yatay ? 3.6 : 1.9, yatay ? 1.9 : 3.6, 0, 0, TAU); c.stroke()
  }
  if (yatay) {
    c.fillStyle = yG(c, x, x + 6, ['rgba(0,0,0,.35)', 'rgba(0,0,0,0)']); c.fillRect(x, y, 6, h)
    c.fillStyle = yG(c, x + w - 6, x + w, ['rgba(0,0,0,0)', 'rgba(0,0,0,.35)']); c.fillRect(x + w - 6, y, 6, h)
  } else {
    c.fillStyle = dG(c, y + h - 8, y + h, ['rgba(0,0,0,0)', 'rgba(0,0,0,.4)']); c.fillRect(x, y + h - 8, w, 8)
  }
  c.restore()
  c.fillStyle = 'rgba(255,226,180,.28)'
  if (yatay) c.fillRect(x + 0.5, y + 0.5, w - 1, 0.8)
  else c.fillRect(x + 0.5, y + 0.5, 0.8, h - 1)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(p)
}

function percin(c, x, y, r = 1.15) {
  c.fillStyle = 'rgba(0,0,0,.45)'
  c.beginPath(); c.arc(x + 0.35, y + 0.45, r, 0, TAU); c.fill()
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.1, x, y, r)
  g.addColorStop(0, '#E6ECF2'); g.addColorStop(0.5, '#8C98A4'); g.addColorStop(1, '#3E464E')
  c.fillStyle = g
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
}

// Çelik I-kiriş (yatay): üst flanş parlak, gövde koyu, perçinli
function kiris(c, x, y, w, h) {
  c.fillStyle = dG(c, y, y + h, [[0, '#9AA6B2'], [0.18, '#C9D2DA'], [0.3, '#6E7A86'], [0.7, '#46505A'], [0.82, '#6E7A86'], [1, '#2A3036']])
  c.fillRect(x, y, w, h)
  c.fillStyle = 'rgba(255,255,255,.45)'
  c.fillRect(x, y + 0.4, w, 0.6)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.7
  c.strokeRect(x, y, w, h)
  for (let xx = x + 8; xx < x + w - 4; xx += 16) percin(c, xx, y + h * 0.5, 0.9)
}

// Boru: silindir parlaklığı, flanşlar
function boru(c, x0, x1, y, kal, ton = '#B87A4A') {
  c.fillStyle = dG(c, y - kal / 2, y + kal / 2, [koyu(ton, 0.35), acik(ton, 0.35), ton, koyu(ton, 0.5)])
  c.fillRect(x0, y - kal / 2, x1 - x0, kal)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.strokeRect(x0, y - kal / 2, x1 - x0, kal)
  for (let xx = x0 + 14; xx < x1 - 6; xx += 34) {
    c.fillStyle = dG(c, y - kal / 2 - 1.2, y + kal / 2 + 1.2, [koyu(ton, 0.2), acik(ton, 0.25), koyu(ton, 0.55)])
    c.fillRect(xx, y - kal / 2 - 1.2, 3.2, kal + 2.4)
    c.strokeRect(xx, y - kal / 2 - 1.2, 3.2, kal + 2.4)
  }
}

// İkaz şeridi (sarı-siyah çapraz)
function ikaz(c, x, y, w, h) {
  c.save()
  c.beginPath(); c.rect(x, y, w, h); c.clip()
  c.fillStyle = '#F2B632'
  c.fillRect(x, y, w, h)
  c.fillStyle = '#1C1C1E'
  for (let xx = x - h; xx < x + w + h; xx += h * 1.6) {
    c.beginPath(); c.moveTo(xx, y + h); c.lineTo(xx + h * 0.8, y + h); c.lineTo(xx + h * 1.6, y); c.lineTo(xx + h * 0.8, y); c.closePath(); c.fill()
  }
  c.fillStyle = 'rgba(255,255,255,.25)'
  c.fillRect(x, y, w, h * 0.25)
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.strokeRect(x, y, w, h)
}

// Kafesli maden feneri (gövde; ışık karede eklenir)
function fenerGovde(c, x, y, zincir) {
  c.strokeStyle = '#2B2F33'
  c.lineWidth = 0.7
  c.beginPath()
  for (let yy = y - zincir; yy < y - 3; yy += 1.6) { c.moveTo(x - 0.5, yy); c.lineTo(x + 0.5, yy + 0.8) }
  c.stroke()
  const sapka = yolCiz([[x - 4.2, y - 0.4], [x - 2.4, y - 3.4], [x + 2.4, y - 3.4], [x + 4.2, y - 0.4]])
  c.fillStyle = dG(c, y - 3.4, y, ['#6E7A86', '#2E353B'])
  c.fill(sapka)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.stroke(sapka)
  const g = c.createRadialGradient(x - 0.6, y + 1, 0.2, x, y + 1.8, 3)
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, '#FFF0B0'); g.addColorStop(1, '#F6B43C')
  c.fillStyle = g
  c.beginPath(); c.ellipse(x, y + 1.8, 2.6, 2.6, 0, 0, TAU); c.fill()
  c.strokeStyle = 'rgba(40,40,44,.85)'
  c.lineWidth = 0.5
  c.beginPath()
  c.moveTo(x - 2.6, y + 1.8); c.lineTo(x + 2.6, y + 1.8)
  c.moveTo(x, y - 0.6); c.lineTo(x, y + 4.4)
  c.stroke()
}

// Duvara düşen sıcak ışık havuzu (fırınlanmış)
function isikHavuzu(c, x, y, r, guc = 1) {
  c.save()
  c.globalCompositeOperation = 'soft-light'
  const g = c.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba('#FFD49A', 0.85 * guc)); g.addColorStop(0.5, rgba('#FFB060', 0.35 * guc)); g.addColorStop(1, 'rgba(255,170,80,0)')
  c.fillStyle = g
  c.fillRect(x - r, y - r, r * 2, r * 2)
  c.globalCompositeOperation = 'lighter'
  const g2 = c.createRadialGradient(x, y, 0, x, y, r * 0.55)
  g2.addColorStop(0, rgba('#FFC27A', 0.16 * guc)); g2.addColorStop(1, 'rgba(255,170,80,0)')
  c.fillStyle = g2
  c.fillRect(x - r, y - r, r * 2, r * 2)
  c.restore()
}

// Cevher kristali: kenarlı (fasetli) parça; renk bölge cevherinden
function kristal(c, x, y, s, a, kod, r) {
  const cr = cevherRenk(kod), cv = cevherVurgu(kod)
  c.save()
  c.translate(x, y)
  c.rotate(a)
  const n = 5 + Math.floor(r() * 2)
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU
    const q = s * (0.7 + r() * 0.5)
    pts.push([Math.cos(t) * q, Math.sin(t) * q * 0.8])
  }
  const p = yolCiz(pts)
  c.fillStyle = koyu(cr, 0.25)
  c.fill(p)
  c.fillStyle = cv
  c.globalAlpha = 0.85
  c.beginPath(); c.moveTo(0, -s * 0.15)
  for (let i = Math.floor(n / 2); i < n; i++) c.lineTo(pts[i][0], pts[i][1])
  c.closePath(); c.fill()
  c.globalAlpha = 1
  c.fillStyle = cr
  c.beginPath(); c.moveTo(0, -s * 0.1)
  for (let i = 0; i <= Math.floor(n / 2); i++) c.lineTo(pts[i][0], pts[i][1])
  c.closePath(); c.fill()
  c.strokeStyle = 'rgba(0,0,0,.6)'
  c.lineWidth = 0.55
  c.stroke(p)
  c.fillStyle = 'rgba(255,255,255,.85)'
  c.fillRect(-s * 0.35, -s * 0.45, s * 0.28, s * 0.14)
  c.restore()
}

// Ray ve traversler
function rayCiz(c, x0, x1, y, tohum) {
  const r = rastgele(tohum)
  for (let x = x0 + 1.5; x < x1 - 3; x += 7) {
    c.fillStyle = dG(c, y - 0.8, y + 2.8, ['#7A5232', '#5A3A22', '#3A2414'])
    c.fillRect(x, y - 0.8, 4.4, 2.8)
    c.fillStyle = 'rgba(255,220,170,.18)'
    c.fillRect(x, y - 0.8, 4.4, 0.5)
    if (r() < 0.5) { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 1, y + 0.5, 0.4, 1.4) }
  }
  for (const yy of [y - 1.2, y + 1.5]) {
    c.fillStyle = '#2E353B'
    c.fillRect(x0, yy - 0.8, x1 - x0, 1.7)
    c.fillStyle = '#C9D2DA'
    c.fillRect(x0, yy - 0.8, x1 - x0, 0.5)
  }
}

// ── Eşyalar ──
function varil(c, x, y0, w, h, ton = '#8A5530') {
  const p = new Path2D()
  p.moveTo(x - w * 0.42, y0)
  p.quadraticCurveTo(x - w * 0.56, y0 - h / 2, x - w * 0.42, y0 - h)
  p.lineTo(x + w * 0.42, y0 - h)
  p.quadraticCurveTo(x + w * 0.56, y0 - h / 2, x + w * 0.42, y0)
  p.closePath()
  c.fillStyle = 'rgba(0,0,0,.35)'
  c.beginPath(); c.ellipse(x + 1, y0, w * 0.6, 1.4, 0, 0, TAU); c.fill()
  c.fillStyle = yG(c, x - w / 2, x + w / 2, [koyu(ton, 0.45), acik(ton, 0.25), ton, koyu(ton, 0.5)])
  c.fill(p)
  c.save(); c.clip(p)
  c.strokeStyle = rgba(koyu(ton, 0.6), 0.45)
  c.lineWidth = 0.5
  c.beginPath()
  for (let i = -2; i <= 2; i++) { c.moveTo(x + i * w * 0.17, y0 - h); c.quadraticCurveTo(x + i * w * 0.2, y0 - h / 2, x + i * w * 0.17, y0) }
  c.stroke()
  for (const f of [0.18, 0.5, 0.82]) {
    c.fillStyle = dG(c, y0 - h * f - 0.9, y0 - h * f + 0.9, ['#9AA6B2', '#3A4048'])
    c.fillRect(x - w, y0 - h * f - 0.9, w * 2, 1.8)
  }
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.7
  c.stroke(p)
  c.fillStyle = dG(c, y0 - h - 1, y0 - h + 1, [acik(ton, 0.2), koyu(ton, 0.3)])
  c.beginPath(); c.ellipse(x, y0 - h, w * 0.42, 1.2, 0, 0, TAU); c.fill()
}
function sandik(c, x, y0, w, h, tohum, yazi) {
  c.fillStyle = 'rgba(0,0,0,.35)'
  c.fillRect(x + 1, y0 - 0.6, w, 1.6)
  kalas(c, x, y0 - h, w, h, true, tohum, '#A06838')
  c.strokeStyle = rgba('#3A2010', 0.6)
  c.lineWidth = 0.6
  c.beginPath()
  c.moveTo(x, y0 - h / 2); c.lineTo(x + w, y0 - h / 2)
  c.stroke()
  c.fillStyle = '#4A525A'
  for (const [xx, yy] of [[x, y0 - h], [x + w - 2.4, y0 - h], [x, y0 - 2.4], [x + w - 2.4, y0 - 2.4]]) c.fillRect(xx, yy, 2.4, 2.4)
  if (yazi) {
    c.fillStyle = yazi.renk
    c.font = `800 ${Math.max(3, h * 0.36)}px "Baloo 2", "Trebuchet MS", system-ui, sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(yazi.metin, x + w / 2, y0 - h * 0.72)
  }
}
function kova(c, x, y0, s, kod) {
  const p = yolCiz([[x - s * 0.5, y0 - s], [x + s * 0.5, y0 - s], [x + s * 0.38, y0], [x - s * 0.38, y0]])
  c.fillStyle = yG(c, x - s / 2, x + s / 2, ['#4E5862', '#AEB8C2', '#5E6A76'])
  c.fill(p)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.6
  c.stroke(p)
  c.fillStyle = cevherRenk(kod)
  c.beginPath(); c.ellipse(x, y0 - s, s * 0.48, s * 0.18, 0, Math.PI, 0); c.fill()
  c.strokeStyle = '#3A4048'
  c.lineWidth = 0.5
  c.beginPath(); c.arc(x, y0 - s, s * 0.5, Math.PI * 1.05, Math.PI * 1.95); c.stroke()
}
function kazmaAski(c, X, Y, x, y) {
  kalas(c, X(x), Y(y), X(32), Y(3.2), true, 51, '#8A5A32')
  for (const dx of [6, 17, 27]) {
    const hx = X(x + dx)
    c.lineCap = 'round'
    c.strokeStyle = '#3A2414'
    c.lineWidth = X(1.9)
    c.beginPath(); c.moveTo(hx, Y(y + 3.4)); c.lineTo(hx + X(1.5), Y(y + 22)); c.stroke()
    c.strokeStyle = '#A8743F'
    c.lineWidth = X(1.1)
    c.beginPath(); c.moveTo(hx, Y(y + 3.4)); c.lineTo(hx + X(1.5), Y(y + 22)); c.stroke()
    c.strokeStyle = '#2E353B'
    c.lineWidth = X(2.6)
    c.beginPath(); c.moveTo(hx - X(6), Y(y + 6.5)); c.quadraticCurveTo(hx, Y(y + 2.4), hx + X(6), Y(y + 6.5)); c.stroke()
    c.strokeStyle = '#C9D2DA'
    c.lineWidth = X(1)
    c.beginPath(); c.moveTo(hx - X(5.5), Y(y + 6)); c.quadraticCurveTo(hx, Y(y + 2.4), hx + X(5.5), Y(y + 6)); c.stroke()
  }
}
function halat(c, x, y0, s) {
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = i % 2 ? '#A8834F' : '#8A6638'
    c.lineWidth = s * 0.22
    c.beginPath(); c.ellipse(x, y0 - s * 0.35, s * (0.75 - i * 0.12), s * (0.32 - i * 0.04), 0, 0, TAU); c.stroke()
  }
}

function esyalar(c, X, Y, v, kod) {
  const z = Y(73)
  if (v === 0) {
    sandik(c, X(198), z, X(15), Y(12), 61)
    sandik(c, X(201), z - Y(12), X(10), Y(9), 62, { metin: 'TNT', renk: '#E25A43' })
    varil(c, X(222), z, X(9.5), Y(14))
    c.lineCap = 'round'
    c.strokeStyle = '#3A2414'; c.lineWidth = X(1.9)
    c.beginPath(); c.moveTo(X(236), z - Y(2)); c.lineTo(X(243), z - Y(33)); c.stroke()
    c.strokeStyle = '#A8743F'; c.lineWidth = X(1.1)
    c.beginPath(); c.moveTo(X(236), z - Y(2)); c.lineTo(X(243), z - Y(33)); c.stroke()
    const kr = yolCiz([[X(232), z - Y(0.5)], [X(240.5), z - Y(0.5)], [X(239.5), z - Y(10)], [X(233.5), z - Y(10)]])
    c.fillStyle = yG(c, X(232), X(241), ['#5E6A76', '#C9D2DA', '#6E7A86'])
    c.fill(kr)
    c.strokeStyle = CIZGI; c.lineWidth = 0.6; c.stroke(kr)
  } else if (v === 1) {
    kazmaAski(c, X, Y, 196, 28)
    kova(c, X(232), z, X(8), kod)
    varil(c, X(213), z, X(9), Y(13), '#5E6A76')
  } else {
    // El arabası ve halat
    const g = yolCiz([[X(200), z - Y(13)], [X(222), z - Y(13)], [X(218), z - Y(4)], [X(204), z - Y(4)]])
    c.fillStyle = dG(c, z - Y(13), z - Y(4), ['#7FA0C0', '#4A6A8A', '#2E4A66'])
    c.fill(g)
    c.strokeStyle = CIZGI; c.lineWidth = 0.7; c.stroke(g)
    c.save()
    c.translate(X(211), z - Y(12.6))
    yiginCiz(c, X(19), Y(5), kod, 431)
    c.restore()
    c.strokeStyle = '#3A2414'; c.lineWidth = X(1.2)
    c.beginPath(); c.moveTo(X(222), z - Y(11)); c.lineTo(X(232), z - Y(5)); c.stroke()
    lastik(c, X(206), z - Y(2.8), Y(2.9))
    halat(c, X(238), z, X(9))
  }
}

// ════════ Kat şeridi ════════
export function katCiz(c, W, H, y, kod, v) {
  const k = y.k, ky = H / 107
  const X = (r) => r * k, Y = (r) => r * ky
  const kp = kaya(kod)
  // 1. Kaya kütlesi
  kayaKutle(c, 0, 0, W, H, kp, 77 + v * 31, 0.8, 1)
  // 2. Tünel boşluğu (yuvarlatılmış tavan köşeleri)
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
  // Arka duvar: ışık alan büyük taşlar
  const duvar = { koyu: kp.duvar[2], orta: kp.duvar[1], acik: kp.duvar[0], tas: kp.tas.map((t) => acik(t, 0.08)) }
  kayaKutle(c, tx0, ty0, tx1 - tx0, ty1 - ty0, duvar, 211 + v * 13, 0.75, 1.5)
  // Arka duvar geride kalsın: hafif karartma (işçiler öne çıkar)
  c.fillStyle = 'rgba(18,10,5,.32)'
  c.fillRect(tx0, ty0, tx1 - tx0, ty1 - ty0)
  // Duvarda parlayan cevher kristalleri (yönetici rozetinin altına düşmez)
  const r3 = rastgele(331 + v * 7)
  for (let i = 0; i < 8; i++) {
    const px = X(130 + r3() * 140), py = Y(20 + r3() * 36)
    if (px > X(165) && px < X(214) && py < Y(48)) continue
    kristal(c, px, py, X(1.4 + r3() * 1.6), r3() * TAU, kod, r3)
  }
  for (const [fx, fy] of KAT.fener) isikHavuzu(c, X(fx), Y(fy + 20), X(64), 0.75)
  // Tavan kaplaması: üst kirişin altında dikine tahtalar
  for (let x = tx0 + X(8), q = 0; x < tx1 - X(8); x += X(12), q++) {
    kalas(c, x, ty0 + Y(5.5), X(11.6), Y(6 + (q % 3) * 1.5), false, 400 + q + v * 50, q % 2 ? '#7A4E2A' : '#6A4424')
  }
  // Ortam gölgesi: tavan, kenarlar, zemin
  c.fillStyle = dG(c, ty0, ty0 + Y(26), ['rgba(8,5,3,.6)', 'rgba(8,5,3,0)'])
  c.fillRect(tx0, ty0, tx1 - tx0, Y(26))
  c.fillStyle = yG(c, tx0, tx0 + X(30), ['rgba(8,5,3,.55)', 'rgba(8,5,3,0)'])
  c.fillRect(tx0, ty0, X(30), ty1 - ty0)
  c.fillStyle = yG(c, tx1 - X(24), tx1, ['rgba(8,5,3,0)', 'rgba(8,5,3,.5)'])
  c.fillRect(tx1 - X(24), ty0, X(24), ty1 - ty0)
  c.fillStyle = dG(c, Y(60), ty1, ['rgba(8,5,3,0)', 'rgba(8,5,3,.35)'])
  c.fillRect(tx0, Y(60), tx1 - tx0, ty1 - Y(60))
  c.restore()
  c.strokeStyle = 'rgba(0,0,0,.7)'
  c.lineWidth = 1.4
  c.stroke(tunel)

  // 3. Cevher damarı (solda): çıkıntılı kaya yüzü, gömülü kristaller
  const yuz = yolCiz([[X(100), Y(8)], [X(112), Y(10)], [X(122), Y(19)], [X(117), Y(31)], [X(126), Y(43)], [X(120), Y(56)], [X(128), Y(66)], [X(123), Y(77)], [X(100), Y(77)]])
  c.save()
  c.clip(yuz)
  kayaKutle(c, X(98), Y(6), X(32), Y(74), kp, 911 + v, 1.2, 0.9)
  const r4 = rastgele(441 + v)
  for (let i = 0; i < 12; i++) kristal(c, X(103 + r4() * 20), Y(12 + r4() * 62), X(2.2 + r4() * 2.2), r4() * TAU, kod, r4)
  c.fillStyle = yG(c, X(110), X(128), ['rgba(0,0,0,0)', 'rgba(255,200,130,.18)'])
  c.fillRect(X(100), Y(6), X(30), Y(74))
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(yuz)

  // Eşyalar (işçilerin arkasında)
  esyalar(c, X, Y, v, kod)

  // 4. Zemin: toprak, taş kırıntısı, ray, kazılan cevher
  c.fillStyle = dG(c, Y(71.5), Y(78), [koyu(kp.duvar[1], 0.1), koyu(kp.duvar[1], 0.35), kp.orta])
  c.fillRect(X(100), Y(71.5), X(190), Y(6.5))
  c.fillStyle = 'rgba(255,226,180,.25)'
  c.fillRect(X(100), Y(71.5), X(190), 0.7)
  const r5 = rastgele(515 + v)
  for (let i = 0; i < 26; i++) {
    c.fillStyle = r5() < 0.5 ? rgba(kp.tas[1], 0.9) : rgba('#000000', 0.35)
    c.beginPath(); c.ellipse(X(104 + r5() * 182), Y(72.5 + r5() * 4.5), X(0.6 + r5() * 1.1), Y(0.4 + r5() * 0.6), 0, 0, TAU); c.fill()
  }
  rayCiz(c, X(126), X(252), Y(KAT.ray), 71 + v)
  c.save()
  c.translate(X(KAT.kaziYigini), Y(73.4))
  yiginCiz(c, X(16), Y(7), kod, 707 + v)
  c.restore()

  // 5. Bunker (asansör yanı): demir kuşaklı ahşap sandık; yığın karede eklenir
  const bx0 = X(KAT.bunkerX0), bx1 = X(KAT.bunkerX1), bu = Y(KAT.bunkerUst)
  for (let i = 0; i < 3; i++) kalas(c, bx0 + 0.5, bu + i * (Y(76) - bu) / 3, bx1 - bx0 - 1, (Y(76) - bu) / 3, true, 600 + i + v * 3, '#9A6334')
  c.fillStyle = dG(c, bu - 1, bu + 1.6, ['#C9D2DA', '#4A525A'])
  c.fillRect(bx0 - 0.8, bu - 1, bx1 - bx0 + 1.6, 2.6)
  for (const x of [bx0, bx1 - 2.6]) {
    c.fillStyle = yG(c, x, x + 2.6, ['#6E7A86', '#3A4048'])
    c.fillRect(x, bu, 2.6, Y(76) - bu)
    percin(c, x + 1.3, bu + Y(5), 0.8)
    percin(c, x + 1.3, Y(72), 0.8)
  }
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.strokeRect(bx0, bu, bx1 - bx0, Y(76) - bu)

  // 6. Ahşap iskelet: iki dikme, üst kiriş, köşe payandaları, demir bağlantılar
  kalas(c, X(100.5), Y(4.5), X(7.5), Y(73.5), false, 11 + v, '#8E5A30')
  kalas(c, X(282.5), Y(4.5), X(7.5), Y(73.5), false, 12 + v, '#8E5A30')
  kalas(c, X(98.5), Y(2.5), X(194), Y(7.5), true, 13 + v, '#9A6334')
  for (const [x0, yon] of [[X(108), 1], [X(282.5), -1]]) {
    const p = yolCiz([[x0, Y(10)], [x0 + yon * X(15), Y(10)], [x0 + yon * X(2.4), Y(10) + Y(15)], [x0, Y(10) + Y(15)]])
    c.fillStyle = dG(c, Y(10), Y(25), ['#8E5A30', '#5E3A1E'])
    c.fill(p)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.stroke(p)
  }
  for (const x of [X(101.5), X(283.5)]) {
    c.fillStyle = dG(c, Y(2), Y(11), ['#6E7A86', '#3A4048'])
    c.fillRect(x, Y(2.5), X(5.5), Y(8.5))
    c.strokeStyle = CIZGI
    c.lineWidth = 0.5
    c.strokeRect(x, Y(2.5), X(5.5), Y(8.5))
    percin(c, x + X(1.6), Y(5), 0.7)
    percin(c, x + X(3.9), Y(8.5), 0.7)
  }

  // 7. Fener gövdeleri (ışıklar karede eklenir)
  for (const [fx, fy] of KAT.fener) fenerGovde(c, X(fx), Y(fy), Y(fy) - Y(10))

  // 8. Kat ayırıcı: çelik kiriş, boru, kablo, yükseltme oku plakası
  kiris(c, 0, Y(78), X(290), Y(5.5))
  boru(c, X(144), X(289), Y(92), Y(4.6), '#B8784A')
  c.strokeStyle = '#1C1F23'
  c.lineWidth = Y(1.6)
  c.beginPath(); c.moveTo(X(144), Y(99)); c.bezierCurveTo(X(190), Y(103), X(240), Y(96), X(289), Y(100)); c.stroke()
  c.strokeStyle = 'rgba(255,255,255,.15)'
  c.lineWidth = Y(0.5)
  c.beginPath(); c.moveTo(X(144), Y(98.5)); c.bezierCurveTo(X(190), Y(102.5), X(240), Y(95.5), X(289), Y(99.5)); c.stroke()
  okPlakasi(c, y.okX, y.okY, y.okG, y.okH)

  // 9. Kuyu sütunu
  kuyuSutun(c, X(290), W, 0, H, Y(KAT.zemin) + Y(1), kp, y, 913 + v)
}

function okPlakasi(c, x, y, w, h) {
  const p = new Path2D()
  p.roundRect ? p.roundRect(x, y, w, h, 3.5) : p.rect(x, y, w, h)
  c.fillStyle = 'rgba(0,0,0,.45)'
  c.save(); c.translate(0.8, 1.2); c.fill(p); c.restore()
  c.fillStyle = dG(c, y, y + h, ['#13567A', '#0B3B52', '#062536'])
  c.fill(p)
  c.strokeStyle = '#6FC6E8'
  c.lineWidth = 1
  c.stroke(p)
  c.fillStyle = 'rgba(255,255,255,.14)'
  c.fillRect(x + 2, y + 1.2, w - 4, h * 0.3)
  const cx = x + w / 2, cy = y + h / 2
  const s = Math.min(w, h) * 0.36
  const ok = yolCiz([[cx - s * 1.5, cy + s * 0.2], [cx, cy - s * 1.1], [cx + s * 1.5, cy + s * 0.2], [cx + s * 0.55, cy + s * 0.2], [cx + s * 0.55, cy + s * 1.05], [cx - s * 0.55, cy + s * 1.05], [cx - s * 0.55, cy + s * 0.2]])
  c.fillStyle = dG(c, cy - s, cy + s, ['#B4FFC4', '#3FD07E', '#1E9E55'])
  c.fill(ok)
  c.strokeStyle = '#0B5A2E'
  c.lineWidth = 0.8
  c.stroke(ok)
}

// Kuyu sütunu: derinlik degradeli oyuk, çapraz bağlı çelik kafes, kat sahanlığı (ikaz kenarlı)
function kuyuSutun(c, x0, x1, y0, y1, zemin, kp, y, tohum) {
  c.fillStyle = yG(c, x0, x1, ['#0B0E11', '#18202A', '#10161C'])
  c.fillRect(x0, y0, x1 - x0, y1 - y0)
  const sol = y.tupX - 3, sag = y.tupX + y.tupG
  c.strokeStyle = 'rgba(110,125,140,.28)'
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(sol + 3, y0); c.lineTo(sag, y1)
  c.moveTo(sag, y0); c.lineTo(sol + 3, y1)
  c.stroke()
  c.fillStyle = 'rgba(120,135,150,.22)'
  c.fillRect(sol, y0 + 1, sag - sol + 3, 1.6)
  for (const x of [sol, sag]) {
    c.fillStyle = yG(c, x, x + 3.2, ['#2A3036', '#8C98A4', '#3E474F'])
    c.fillRect(x, y0, 3.2, y1 - y0)
    for (let yy = y0 + 6; yy < y1; yy += 14) percin(c, x + 1.6, yy, 0.7)
  }
  const kx = sag + 3.4
  if (x1 > kx) {
    kayaKutle(c, kx, y0, x1 - kx, y1 - y0, kp, tohum, 0.7, 0.8)
    c.fillStyle = yG(c, kx, kx + 4, ['rgba(0,0,0,.55)', 'rgba(0,0,0,0)'])
    c.fillRect(kx, y0, 4, y1 - y0)
  }
  c.fillStyle = dG(c, zemin - 1, zemin + 3, ['#8C98A4', '#3A4048'])
  c.fillRect(x0, zemin - 1, sol - x0 + 1, 3.6)
  ikaz(c, x0, zemin + 2.4, sol - x0 + 1, 1.8)
  c.fillStyle = yG(c, x0 - 1.5, x0 + 1.5, ['#1C2126', '#6E7A86', '#2A3036'])
  c.fillRect(x0 - 1.5, y0, 3, y1 - y0)
}

// ════════ Yükleme katı ════════
export function yuklemeCiz(c, W, H, y, kod) {
  const k = y.k, ky = H / 107
  const X = (r) => r * k, Y = (r) => r * ky
  const kp = kaya(kod)
  kayaKutle(c, 0, 0, W, H, kp, 501, 0.8, 1)
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
  const duvar = { koyu: kp.duvar[2], orta: kp.duvar[1], acik: kp.duvar[0], tas: kp.tas.map((t) => acik(t, 0.08)) }
  kayaKutle(c, tx0, ty0, W - tx0, ty1 - ty0, duvar, 611, 0.75, 1.5)
  c.fillStyle = 'rgba(18,10,5,.32)'
  c.fillRect(tx0, ty0, W - tx0, ty1 - ty0)
  for (const [fx, fy] of YUKLEME.fener) isikHavuzu(c, X(fx), Y(fy + 24), X(72), 0.75)
  c.fillStyle = dG(c, ty0, ty0 + Y(24), ['rgba(8,5,3,.6)', 'rgba(8,5,3,0)'])
  c.fillRect(tx0, ty0, W - tx0, Y(24))
  c.fillStyle = yG(c, tx0, tx0 + X(30), ['rgba(8,5,3,.55)', 'rgba(8,5,3,0)'])
  c.fillRect(tx0, ty0, X(30), ty1 - ty0)
  c.restore()
  c.strokeStyle = 'rgba(0,0,0,.7)'
  c.lineWidth = 1.4
  c.stroke(galeri)

  kalas(c, X(94), Y(2.5), W - X(94), Y(7), true, 701, '#9A6334')
  for (const [x, t] of [[X(95), 702], [X(176), 703], [X(250), 704]]) kalas(c, x, Y(9), X(7), Y(83), false, t, '#8E5A30')
  for (const [fx, fy] of YUKLEME.fener) fenerGovde(c, X(fx), Y(fy), Y(fy) - Y(9.5))

  c.fillStyle = dG(c, Y(90), Y(107), [koyu(kp.duvar[1], 0.15), kp.orta, kp.koyu])
  c.fillRect(X(94), Y(90), W - X(94), Y(17))
  c.fillStyle = 'rgba(255,226,180,.25)'
  c.fillRect(X(94), Y(90), W - X(94), 0.7)
  const r5 = rastgele(808)
  for (let i = 0; i < 40; i++) {
    c.fillStyle = r5() < 0.5 ? rgba(kp.tas[1], 0.9) : rgba('#000000', 0.35)
    c.beginPath(); c.ellipse(X(96 + r5() * 268), Y(91 + r5() * 14), X(0.6 + r5() * 1.2), Y(0.4 + r5() * 0.7), 0, 0, TAU); c.fill()
  }
  rayCiz(c, X(150), X(300), Y(YUKLEME.zemin + 1), 909)

  // Depo sundurması: tahta arka duvar, oluklu sac çatı
  const dx0 = X(256)
  for (let x = dx0, i = 0; x < W; x += X(9.2), i++) kalas(c, x, Y(22), X(9.2), Y(68), false, 720 + i, i % 2 ? '#7A4E2A' : '#6E4424')
  c.fillStyle = dG(c, Y(22), Y(40), ['rgba(0,0,0,.5)', 'rgba(0,0,0,0)'])
  c.fillRect(dx0, Y(22), W - dx0, Y(18))
  const cati = yolCiz([[dx0 - X(9), Y(27)], [dx0 + X(4), Y(11)], [W, Y(11)], [W, Y(22)], [dx0 + X(8), Y(22)], [dx0 - X(2), Y(31)]])
  c.save()
  c.clip(cati)
  c.fillStyle = dG(c, Y(11), Y(31), ['#A9B9C8', '#6E8296', '#4A5A6C'])
  c.fillRect(dx0 - X(10), Y(10), W - dx0 + X(10), Y(22))
  for (let x = dx0 - X(12); x < W; x += X(4)) {
    c.fillStyle = 'rgba(255,255,255,.28)'
    c.fillRect(x, Y(10), X(1.2), Y(22))
    c.fillStyle = 'rgba(0,0,0,.22)'
    c.fillRect(x + X(2.2), Y(10), X(1.2), Y(22))
  }
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(cati)
  // Kabin kuyusu çatıdan iner: perçinli huni
  const hx0 = y.tupX - X(4), hx1 = y.tupX + y.tupG + X(4)
  const huni = yolCiz([[hx0, Y(4)], [hx1, Y(4)], [hx1 - X(8), Y(20)], [hx0 + X(8), Y(20)]])
  c.fillStyle = yG(c, hx0, hx1, ['#3E474F', '#9AA6B2', '#5E6A76', '#2E353B'])
  c.fill(huni)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.stroke(huni)
  for (let x = hx0 + X(6); x < hx1 - X(4); x += X(7)) percin(c, x, Y(6.5), 0.75)

  // Depo bunkeri (ön yüz): kalın kalaslar, köşe demirleri, tabela
  const bx0 = X(YUKLEME.bunkerX0), bx1 = X(YUKLEME.bunkerX1), bu = Y(YUKLEME.bunkerUst)
  for (let i = 0; i < 4; i++) kalas(c, bx0 + 0.5, bu + i * (Y(96) - bu) / 4, bx1 - bx0 - 1, (Y(96) - bu) / 4, true, 740 + i, '#A06838')
  c.fillStyle = dG(c, bu - 1.2, bu + 1.8, ['#C9D2DA', '#4A525A'])
  c.fillRect(bx0 - 1, bu - 1.2, bx1 - bx0 + 2, 3)
  for (const x of [bx0, (bx0 + bx1) / 2 - 1.5, bx1 - 3]) {
    c.fillStyle = yG(c, x, x + 3, ['#6E7A86', '#3A4048'])
    c.fillRect(x, bu, 3, Y(96) - bu)
    for (let yy = bu + Y(5); yy < Y(94); yy += Y(10)) percin(c, x + 1.5, yy, 0.8)
  }
  c.strokeStyle = CIZGI
  c.lineWidth = 0.9
  c.strokeRect(bx0, bu, bx1 - bx0, Y(96) - bu)
  const tw = X(36), th = Y(13.5), tx = (bx0 + bx1) / 2 - tw / 2, tyy = Y(69)
  const tab = new Path2D()
  tab.roundRect ? tab.roundRect(tx, tyy, tw, th, 2.5) : tab.rect(tx, tyy, tw, th)
  c.fillStyle = 'rgba(0,0,0,.45)'
  c.save(); c.translate(0.8, 1.2); c.fill(tab); c.restore()
  c.fillStyle = dG(c, tyy, tyy + th, ['#4A525A', '#22272D'])
  c.fill(tab)
  c.strokeStyle = '#D9B04A'
  c.lineWidth = 1.1
  c.stroke(tab)
  c.fillStyle = '#F8EDCB'
  c.font = `800 ${Math.round(th * 0.68)}px "Baloo 2", "Trebuchet MS", system-ui, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText('DEPO', tx + tw / 2, tyy + th / 2 + 0.5)
  const oluk = yolCiz([[bx0, Y(61)], [bx0 - X(10), Y(69)], [bx0 - X(10), Y(72.5)], [bx0, Y(67.5)]])
  c.fillStyle = dG(c, Y(61), Y(72), ['#9AA6B2', '#4A525A'])
  c.fill(oluk)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(oluk)

  kamyonCiz(c, X, Y)
}

// Kamyon: tırtıklı lastikler, camında yansıma olan kabin, far, damper kasası, egzoz, merdiven
function kamyonCiz(c, X, Y) {
  c.fillStyle = 'rgba(0,0,0,.4)'
  c.beginPath(); c.ellipse(X(166), Y(97), X(60), Y(3.2), 0, 0, TAU); c.fill()
  c.fillStyle = yG(c, X(119), X(123), ['#2A3036', '#8C98A4', '#3A4048'])
  c.fillRect(X(119.5), Y(43), X(3.2), Y(15))
  c.fillStyle = '#1C1F23'
  c.fillRect(X(119), Y(42.4), X(4.2), Y(1.8))
  const kab = yolCiz([[X(110), Y(86)], [X(110), Y(63)], [X(116.5), Y(55.5)], [X(146), Y(55.5)], [X(151), Y(62)], [X(151), Y(86)]])
  c.fillStyle = yG(c, X(110), X(151), ['#2E5C9A', '#5B8BD0', '#4475B8', '#24477A'])
  c.fill(kab)
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(kab)
  const cam = yolCiz([[X(117), Y(71)], [X(117), Y(64)], [X(121.5), Y(59.5)], [X(144), Y(59.5)], [X(146.5), Y(64)], [X(146.5), Y(71)]])
  c.fillStyle = dG(c, Y(59.5), Y(71), ['#E4F4FC', '#9CC8E2', '#5E8FB0'])
  c.fill(cam)
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(cam)
  c.fillStyle = 'rgba(255,255,255,.6)'
  c.fill(yolCiz([[X(124), Y(70)], [X(130.5), Y(60.5)], [X(134.5), Y(60.5)], [X(128), Y(70)]]))
  c.fillStyle = 'rgba(255,255,255,.35)'
  c.fill(yolCiz([[X(132), Y(70)], [X(137.5), Y(60.5)], [X(139), Y(60.5)], [X(133.5), Y(70)]]))
  c.strokeStyle = 'rgba(0,0,0,.35)'
  c.lineWidth = 0.7
  c.beginPath(); c.moveTo(X(131), Y(71)); c.lineTo(X(131), Y(85)); c.stroke()
  c.fillStyle = '#C9D2DA'
  c.fillRect(X(133), Y(76), X(4), Y(1.3))
  c.fillStyle = '#F08A3C'
  c.fillRect(X(110.5), Y(73.5), X(40), Y(3.2))
  const far = c.createRadialGradient(X(112.5), Y(80), 0, X(112.5), Y(80), Y(3))
  far.addColorStop(0, '#FFFFFF'); far.addColorStop(0.5, '#FFE9A0'); far.addColorStop(1, '#D9A030')
  c.fillStyle = far
  c.beginPath(); c.ellipse(X(112.6), Y(80), X(2.2), Y(2.4), 0, 0, TAU); c.fill()
  c.strokeStyle = CIZGI; c.lineWidth = 0.6; c.stroke()
  c.strokeStyle = '#2E353B'
  c.lineWidth = X(0.9)
  c.beginPath()
  c.moveTo(X(146), Y(86)); c.lineTo(X(146), Y(96)); c.moveTo(X(150), Y(86)); c.lineTo(X(150), Y(96))
  for (let yy = 88; yy < 96; yy += 3) { c.moveTo(X(146), Y(yy)); c.lineTo(X(150), Y(yy)) }
  c.stroke()
  const kasa = yolCiz([[X(151), Y(56)], [X(223), Y(51)], [X(219), Y(82.5)], [X(155), Y(82.5)]])
  c.fillStyle = dG(c, Y(51), Y(83), ['#F0A858', '#D07832', '#9A5420'])
  c.fill(kasa)
  c.save()
  c.clip(kasa)
  for (const x of [168, 186, 204]) {
    c.fillStyle = yG(c, X(x - 2.4), X(x + 2.4), ['#8E4A1A', '#F4B068', '#A85A22'])
    c.fillRect(X(x - 2.4), Y(50), X(4.8), Y(34))
  }
  c.fillStyle = 'rgba(0,0,0,.2)'
  c.fillRect(X(150), Y(74), X(75), Y(9))
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 1
  c.stroke(kasa)
  c.fillStyle = 'rgba(255,240,200,.45)'
  c.fillRect(X(153), Y(56.2), X(68), 0.8)
  c.fillStyle = dG(c, Y(82.5), Y(87), ['#4A525A', '#1C1F23'])
  c.fillRect(X(110), Y(82.5), X(113), Y(4.5))
  for (const x of [128, 172, 205]) {
    c.fillStyle = '#2A3036'
    c.beginPath(); c.ellipse(X(x), Y(84.5), X(9.5), Y(4), 0, Math.PI, 0); c.fill()
    lastik(c, X(x), Y(89), Y(7.6))
  }
}
function lastik(c, x, y, r) {
  c.fillStyle = '#141619'
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  c.fillStyle = '#2A2E33'
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU
    c.save()
    c.translate(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86)
    c.rotate(a)
    c.fillRect(-r * 0.12, -r * 0.16, r * 0.24, r * 0.32)
    c.restore()
  }
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke()
  const j = c.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x, y, r * 0.5)
  j.addColorStop(0, '#E6ECF2'); j.addColorStop(0.6, '#8C98A4'); j.addColorStop(1, '#3E464E')
  c.fillStyle = j
  c.beginPath(); c.arc(x, y, r * 0.48, 0, TAU); c.fill()
  c.fillStyle = '#2A3036'
  c.beginPath(); c.arc(x, y, r * 0.16, 0, TAU); c.fill()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU
    c.fillStyle = '#4A525A'
    c.beginPath(); c.arc(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.06, 0, TAU); c.fill()
  }
}

// Kamyon kasasındaki yük (0..1), karede çizilir (c: yükleme katının sol üstü orijinde)
export function kamyonYuku(c, y, ky, oran, kod) {
  if (oran <= 0.02) return
  const X = (r) => r * y.k, Y = (r) => r * ky
  c.save()
  c.translate(X(187), Y(55.5))
  yiginCiz(c, X(70), Y(4) + Y(15) * oran, kod, 913)
  c.restore()
}

// Taş dolgusu (kilitli katlar, tepe)
export function kayaSerit(c, W, H, kod, tohum) {
  kayaKutle(c, 0, 0, W, H, kaya(kod), tohum, 0.85, 1)
}

// ── Kabin (boş): sarı çelik kafes, elmas örgü, ikaz tabanı, tavan lambası ──
export function kabinCiz(c, w, h) {
  const p = new Path2D()
  p.roundRect ? p.roundRect(0.5, 0.5, w - 1, h - 1, 3) : p.rect(0.5, 0.5, w - 1, h - 1)
  c.fillStyle = dG(c, 0, h, ['#141A20', '#202A33', '#10151A'])
  c.fill(p)
  c.save()
  c.clip(p)
  c.strokeStyle = 'rgba(170,185,200,.2)'
  c.lineWidth = 0.6
  c.beginPath()
  for (let x = -h; x < w + h; x += 4.2) { c.moveTo(x, 7); c.lineTo(x + h, h + 7); c.moveTo(x, h + 7); c.lineTo(x + h, 7) }
  c.stroke()
  const ic = c.createRadialGradient(w / 2, 10, 1, w / 2, h * 0.4, h * 0.8)
  ic.addColorStop(0, 'rgba(255,214,140,.22)'); ic.addColorStop(1, 'rgba(255,214,140,0)')
  c.fillStyle = ic
  c.fillRect(0, 0, w, h)
  c.restore()
  const sari = (x, y, ww, hh, dikey) => {
    c.fillStyle = dikey ? yG(c, x, x + ww, ['#B97C16', '#FFD36B', '#F2B632', '#B07414']) : dG(c, y, y + hh, ['#FFE08A', '#F2B632', '#B07414'])
    c.fillRect(x, y, ww, hh)
    c.strokeStyle = CIZGI
    c.lineWidth = 0.8
    c.strokeRect(x, y, ww, hh)
  }
  sari(0.5, 0.5, 4.2, h - 1, true)
  sari(w - 4.7, 0.5, 4.2, h - 1, true)
  sari(0.5, 0.5, w - 1, 7, false)
  ikaz(c, 4.7, h - 6.5, w - 9.4, 5.8)
  c.strokeStyle = '#C98A1E'
  c.lineWidth = 1.6
  c.beginPath(); c.moveTo(4.7, h * 0.44); c.lineTo(w - 4.7, h * 0.44); c.stroke()
  c.strokeStyle = 'rgba(255,240,190,.6)'
  c.lineWidth = 0.5
  c.beginPath(); c.moveTo(4.7, h * 0.44 - 0.5); c.lineTo(w - 4.7, h * 0.44 - 0.5); c.stroke()
  const g = c.createRadialGradient(w / 2, 8.6, 0, w / 2, 8.6, 2.6)
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F6B43C')
  c.fillStyle = g
  c.beginPath(); c.ellipse(w / 2, 8.4, 3.4, 1.8, 0, 0, Math.PI); c.fill()
  c.strokeStyle = '#3A3F45'
  c.lineWidth = 1.8
  c.beginPath(); c.arc(w / 2, -1.6, 2.8, Math.PI * 0.15, Math.PI * 0.85, true); c.stroke()
  for (const x of [2.6, w - 2.6]) for (const yy of [3.6, h * 0.44, h - 3.4]) percin(c, x, yy, 0.8)
}

// ── Cevher yığını: genişlik w, yükseklik h; alt kenar orijinde. Kenarlı parçalardan oluşur ──
export function yiginCiz(c, w, h, kod, tohum) {
  if (h < 0.8) return
  const r = rastgele(tohum)
  const cr = cevherRenk(kod)
  const p = new Path2D()
  p.moveTo(-w / 2, 0)
  p.quadraticCurveTo(-w * 0.3, -h * 1.05, 0, -h)
  p.quadraticCurveTo(w * 0.3, -h * 1.05, w / 2, 0)
  p.closePath()
  c.fillStyle = 'rgba(0,0,0,.35)'
  c.beginPath(); c.ellipse(0, 0, w * 0.55, Math.max(1, h * 0.12), 0, 0, TAU); c.fill()
  c.fillStyle = dG(c, -h, 0, [acik(cr, 0.1), cr, koyu(cr, 0.35)])
  c.fill(p)
  c.save()
  c.clip(p)
  const n = Math.max(5, Math.round((w * h) / 16))
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * w * 0.95
    const tepe = -h * (1 - Math.pow(Math.abs(x) / (w / 2), 2) * 0.9)
    const yy = tepe * (0.1 + r() * 0.9)
    const s = Math.max(0.9, Math.min(w, h) * (0.08 + r() * 0.1))
    kristal(c, x, yy, s, r() * TAU, kod, r)
  }
  c.fillStyle = 'rgba(255,255,255,.1)'
  c.fillRect(-w / 2, -h, w * 0.4, h)
  c.restore()
  c.strokeStyle = CIZGI
  c.lineWidth = 0.8
  c.stroke(p)
}
