// Karakterler (§5.4): madenci, taşıyıcı ve yönetici portresi.
// Her şey açılışta pozlardan fırınlanır (atlas). Kare başına yalnız drawImage.
// Figürler sağa bakar; sola bakan kareler çizerken scale(-1, 1) ile aynalanır.

import { Varliklar } from './varliklar.js'
import { dikey, radyal, elips, yuvarlakYol, kenarIsik, acik, koyu, rgba, rastgele, cizgi, topakYol, komurYigini } from './cizim.js'

export const HUCRE_W = 48
export const HUCRE_H = 56
export const AYAK_X = 22          // hücrede ayak tabanı (madenci)
export const AYAK_Y = 53
export const TASIYICI_W = 64      // taşıyıcı hücresi (arabayla)
export const TASIYICI_AYAK_X = 20

// Animasyonlar: kare sayısı ve döngü süresi (s)
export const ANIMLER = Object.freeze({
  kaz: { kare: 8, sure: 0.6 },
  yuru: { kare: 8, sure: 0.8 },
  it: { kare: 8, sure: 0.9 },
  bekle: { kare: 4, sure: 1.6 },
  sevin: { kare: 6, sure: 0.9 },
  otur: { kare: 2, sure: 2.0 },
})
export const MADENCI_ANIM = Object.freeze(['kaz', 'bekle', 'sevin', 'otur'])
export const TASIYICI_ANIM = Object.freeze(['yuru', 'it'])
export const VARYANT_SAYISI = 2
// Vuruş karesi (kıvılcım bu kareye girişte çıkar)
export const VURUS_KARE = 4

const VARYANTLAR = [
  { ten: '#E8B48A', tenGolge: '#C98F68', biyik: true },
  { ten: '#C98E62', tenGolge: '#A06E4A', biyik: false },
]
const KASK = '#F2B632'
const TULUM = ['#3F72BE', '#2F5FA8', '#23477F']
const ASKI = '#D9772B'
const GOMLEK = ['#F4E8D6', '#E9D7BC']
const ELDIVEN = '#C9A27A'
const BOT = '#3A2416'
const CELIK = ['#C9D1D8', '#A9B4BE', '#6E7A86']
const SAP = ['#A8743F', '#8A5A32']
const KEP = '#C4553B'

// Kaz döngüsünde kare seçimi: hazırlık 3 kare (0.25 s), vuruş 2 kare (0.10 s), toparlanma 3 kare (0.25 s)
export function kareSec(anim, t) {
  const a = ANIMLER[anim]
  let u = t % a.sure
  if (u < 0) u += a.sure
  if (anim === 'kaz') {
    if (u < 0.25) return Math.min(2, Math.floor(u / (0.25 / 3)))
    if (u < 0.35) return 3 + Math.min(1, Math.floor((u - 0.25) / 0.05))
    return 5 + Math.min(2, Math.floor((u - 0.35) / (0.25 / 3)))
  }
  return Math.min(a.kare - 1, Math.floor(u / a.sure * a.kare))
}

const R = Math.PI / 180

// ---- Pozlar ----
// kazma: kazmanın açısı (yukarı = 0, saat yönü +), null = elde kazma yok
function poz(anim, k) {
  const p = { y: 0, egim: 0, sq: 1, kazma: null, kolOn: 0.15, kolArka: -0.1, bacakOn: 0.08, bacakArka: -0.08, otur: false, sevin: false, araba: false, bas: 0 }
  if (anim === 'kaz') {
    const A = [70, 15, -38, 72, 122, 116, 108, 100]
    const E = [-2, -5, -7, 4, 10, 8, 4, 1]
    p.kazma = A[k] * R
    p.egim = E[k] * R
    p.sq = k === 4 ? 0.95 : k === 3 ? 0.98 : 1
    p.bacakOn = (k >= 3 && k <= 5 ? 0.28 : 0.18)
    p.bacakArka = -0.16
    p.bas = k === 4 ? 0.12 : 0
  } else if (anim === 'bekle') {
    p.kazma = -24 * R
    p.sq = [1, 1.012, 1.02, 1.01][k]
    p.y = [0, -0.2, -0.4, -0.2][k]
    p.bacakOn = 0.06; p.bacakArka = -0.06
  } else if (anim === 'sevin') {
    const Y = [0, -2.5, -5, -5, -2.5, 0]
    p.y = Y[k]
    p.sevin = true
    p.kazma = (-8 + (k % 2) * 10) * R
    p.bacakOn = k === 2 || k === 3 ? 0.35 : 0.12
    p.bacakArka = k === 2 || k === 3 ? -0.3 : -0.1
    p.sq = k === 0 || k === 5 ? 0.96 : 1.02
  } else if (anim === 'otur') {
    p.otur = true
    p.sq = k ? 1.015 : 1
    p.bas = 0.18
  } else if (anim === 'yuru' || anim === 'it') {
    const f = (k / 8) * Math.PI * 2
    const s = Math.sin(f)
    p.bacakOn = 0.5 * s
    p.bacakArka = -0.5 * s
    p.y = -Math.abs(Math.cos(f)) * 1.1 + 0.5
    if (anim === 'it') {
      p.araba = true
      p.egim = 12 * R
    } else {
      p.kolOn = -0.45 * s
      p.kolArka = 0.45 * s
    }
  }
  return p
}

// ---- Parçalar ----
function bacak(ctx, kalca, aci, renk, otur) {
  if (otur) {
    const diz = [kalca[0] + 7.5, kalca[1] + 0.5]
    const ayak = [diz[0] + 1.5, diz[1] + 7.5]
    cizgi(ctx, kalca[0], kalca[1], diz[0], diz[1], 4.6, renk)
    cizgi(ctx, diz[0], diz[1], ayak[0], ayak[1], 4.2, renk)
    botCiz(ctx, ayak[0], ayak[1])
    return
  }
  const L = 12
  const ayak = [kalca[0] + Math.sin(aci) * L, kalca[1] + Math.cos(aci) * L]
  cizgi(ctx, kalca[0], kalca[1], ayak[0], ayak[1] - 1, 4.6, renk)
  botCiz(ctx, ayak[0], ayak[1])
}
function botCiz(ctx, x, y) {
  const yol = yuvarlakYol(x - 2.6, y - 3, 6.4, 3.4, 1.4)
  ctx.fillStyle = dikey(ctx, y - 3, y + 0.4, [acik(BOT, 0.2), BOT])
  ctx.fill(yol)
  ctx.fillStyle = rgba('#000000', 0.35)
  ctx.fillRect(x - 2.6, y - 0.4, 6.4, 0.8)
}

function govdeCiz(ctx, sq) {
  // Gömlek (omuzlar ve kollar bunun üstünde)
  ctx.save()
  ctx.scale(1, sq)
  const gomlek = yuvarlakYol(-6.4, -16, 12.8, 9, 4)
  ctx.fillStyle = dikey(ctx, -16, -7, GOMLEK)
  ctx.fill(gomlek)
  // Tulum
  const tulum = new Path2D()
  tulum.moveTo(-6.6, -9.5)
  tulum.lineTo(-4.8, -12)
  tulum.lineTo(4.6, -12)
  tulum.lineTo(6.6, -9.5)
  tulum.quadraticCurveTo(7.2, -2, 6.2, 1.5)
  tulum.lineTo(-6.2, 1.5)
  tulum.quadraticCurveTo(-7.2, -2, -6.6, -9.5)
  tulum.closePath()
  ctx.fillStyle = dikey(ctx, -12, 1.5, TULUM)
  ctx.fill(tulum)
  kenarIsik(ctx, tulum, '#9CC0F0', 0.9, 0.45)
  // Göğüs cebi
  ctx.fillStyle = rgba('#000000', 0.18)
  ctx.fillRect(-2.2, -10.4, 4.4, 2.8)
  // Askılar
  ctx.strokeStyle = ASKI
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(-4.6, -15.4); ctx.lineTo(-3.6, -11.2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(4.4, -15.4); ctx.lineTo(3.4, -11.2); ctx.stroke()
  ctx.fillStyle = '#FFE08A'
  ctx.fillRect(-4.1, -11.6, 1.2, 1.2)
  ctx.fillRect(2.9, -11.6, 1.2, 1.2)
  ctx.restore()
}

function basCiz(ctx, v, sapka, egilme) {
  ctx.save()
  ctx.translate(1.6, -22.6)
  ctx.rotate(egilme || 0)
  // Boyun
  ctx.fillStyle = v.tenGolge
  ctx.fillRect(-1.8, 3.6, 3.6, 3.4)
  // Kulak ve yüz
  const yuz = elips(0, 0, 6.5, 6.8)
  ctx.fillStyle = radyal(ctx, 1.5, -1.5, 8.5, [acik(v.ten, 0.18), v.ten, v.tenGolge])
  ctx.fill(yuz)
  ctx.fillStyle = v.tenGolge
  ctx.fill(elips(-2.4, 0.8, 1.4, 1.8))
  // Sakal gölgesi
  ctx.save()
  ctx.clip(yuz)
  ctx.fillStyle = rgba(koyu(v.tenGolge, 0.35), 0.28)
  ctx.fill(elips(2.6, 5.2, 5.2, 2.8))
  ctx.restore()
  // Burun, göz, yanak
  ctx.fillStyle = v.tenGolge
  ctx.fill(elips(6.1, 1.4, 1.7, 1.4))
  ctx.fillStyle = '#2B1D12'
  ctx.fill(elips(3.5, -0.6, 0.75, 1.05))
  ctx.fillStyle = rgba('#E25A43', 0.22)
  ctx.fill(elips(3.2, 2.4, 1.5, 0.9))
  // Kaş
  ctx.strokeStyle = koyu(v.tenGolge, 0.55)
  ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.moveTo(2.3, -2.6); ctx.lineTo(4.8, -2.2); ctx.stroke()
  if (v.biyik) {
    ctx.fillStyle = '#4A2E1C'
    const b = new Path2D()
    b.moveTo(3.4, 3.1)
    b.quadraticCurveTo(5.4, 2.0, 7.2, 3.1)
    b.quadraticCurveTo(6.4, 4.6, 5.2, 3.9)
    b.quadraticCurveTo(4.2, 4.6, 3.4, 3.1)
    ctx.fill(b)
  } else {
    ctx.strokeStyle = koyu(v.tenGolge, 0.5)
    ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.moveTo(4.4, 3.8); ctx.lineTo(6, 3.6); ctx.stroke()
  }
  if (sapka === 'kep') {
    // Kırmızı kep (taşıyıcı)
    const kep = new Path2D()
    kep.moveTo(-6.6, -1.4)
    kep.quadraticCurveTo(-6.4, -8.4, 0, -8.2)
    kep.quadraticCurveTo(6.2, -8.2, 6.6, -1.6)
    kep.closePath()
    ctx.fillStyle = dikey(ctx, -8.4, -1.4, [acik(KEP, 0.18), KEP, koyu(KEP, 0.25)])
    ctx.fill(kep)
    kenarIsik(ctx, kep, '#FFD0B0', 0.8, 0.5)
    ctx.fillStyle = koyu(KEP, 0.3)
    ctx.fill(yuvarlakYol(2, -2.6, 8.6, 1.9, 0.9))
  } else {
    // Sarı kask + fener
    const kask = new Path2D()
    kask.moveTo(-7.4, -1.4)
    kask.quadraticCurveTo(-7.4, -9.6, 0.2, -9.4)
    kask.quadraticCurveTo(7.6, -9.4, 7.6, -1.6)
    kask.closePath()
    ctx.fillStyle = dikey(ctx, -9.6, -1.4, ['#FFE08A', KASK, '#C98A1E'])
    ctx.fill(kask)
    kenarIsik(ctx, kask, '#FFF4C8', 0.9, 0.6)
    ctx.fillStyle = rgba('#7A4A10', 0.35)
    ctx.fillRect(-0.4, -9, 0.9, 7.4)
    ctx.fillStyle = dikey(ctx, -2.6, -0.6, ['#F6C453', '#B8801A'])
    ctx.fill(yuvarlakYol(-8.6, -2.6, 18.2, 2.1, 1))
    // Fener
    ctx.fillStyle = '#5A5F66'
    ctx.fill(elips(5.6, -5.4, 2.2, 2))
    ctx.fillStyle = radyal(ctx, 5.9, -5.6, 1.8, ['#FFFFFF', '#FFE08A', '#F6C453'])
    ctx.fill(elips(5.9, -5.5, 1.5, 1.4))
  }
  ctx.restore()
}

function eldiven(ctx, x, y) {
  ctx.fillStyle = radyal(ctx, x - 0.5, y - 0.6, 2.4, [acik(ELDIVEN, 0.25), ELDIVEN, koyu(ELDIVEN, 0.2)])
  ctx.fill(elips(x, y, 2.1, 2.0))
}

function kazmaCiz(ctx, x0, y0, aci, uzun = 19) {
  const dx = Math.sin(aci), dy = -Math.cos(aci)
  const bx = x0 - dx * 3, by = y0 - dy * 3
  const ux = x0 + dx * uzun, uy = y0 + dy * uzun
  // Sap
  ctx.lineCap = 'round'
  ctx.strokeStyle = SAP[1]
  ctx.lineWidth = 2.4
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ux, uy); ctx.stroke()
  ctx.strokeStyle = rgba(SAP[0], 0.9)
  ctx.lineWidth = 0.9
  ctx.beginPath(); ctx.moveTo(bx - dy * 0.5, by + dx * 0.5); ctx.lineTo(ux - dy * 0.5, uy + dx * 0.5); ctx.stroke()
  // Baş: sapa dik, öne doğru kıvrık, uçlu
  const px = -dy, py = dx    // dik
  const a = [ux + px * 7.2 - dx * 1.4, uy + py * 7.2 - dy * 1.4]
  const b = [ux - px * 6.2 - dx * 2.6, uy - py * 6.2 - dy * 2.6]
  const k = [ux + dx * 2.6, uy + dy * 2.6]
  ctx.lineCap = 'round'
  ctx.strokeStyle = CELIK[2]
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(k[0], k[1], b[0], b[1]); ctx.stroke()
  ctx.strokeStyle = CELIK[0]
  ctx.lineWidth = 1.1
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(k[0] + dx * 0.4, k[1] + dy * 0.4, b[0], b[1]); ctx.stroke()
  ctx.fillStyle = '#5A5F66'
  ctx.fill(elips(ux, uy, 1.5, 1.5))
}

// Küçük taşıma arabası (taşıyıcının önünde)
function kucukAraba(ctx, x, y, dolu) {
  const yol = new Path2D()
  yol.moveTo(x, y - 12)
  yol.lineTo(x + 17, y - 12)
  yol.lineTo(x + 15, y - 4)
  yol.lineTo(x + 2, y - 4)
  yol.closePath()
  ctx.fillStyle = dikey(ctx, y - 12, y - 4, ['#F6C453', '#D99A2B', '#A8690F'])
  ctx.fill(yol)
  kenarIsik(ctx, yol, '#FFF0B8', 0.8, 0.6)
  ctx.strokeStyle = '#7A4A10'
  ctx.lineWidth = 0.7
  ctx.stroke(yol)
  if (dolu) {
    const r = rastgele(31)
    komurYigini(ctx, x + 8.5, y - 11.4, 14, 5, r, '#1F2326', '#9FB7C9', 16)
  }
  for (const wx of [x + 4.5, x + 12.5]) {
    ctx.fillStyle = '#2A2E33'
    ctx.fill(elips(wx, y - 2.4, 2.4, 2.4))
    ctx.fillStyle = CELIK[1]
    ctx.fill(elips(wx, y - 2.4, 0.9, 0.9))
  }
}

// Bir figür karesi çizer (ctx hücrenin sol üstünde)
function figur(ctx, p, v, sapka, ayakX, kucukArabaVar) {
  ctx.save()
  ctx.translate(ayakX, AYAK_Y + p.y)
  // Zemin gölgesi
  ctx.fillStyle = rgba('#000000', 0.22)
  ctx.fill(elips(p.otur ? 3 : 0.5, -p.y + 0.2, p.otur ? 10 : 8, 1.6))
  if (p.otur) {
    // Cevher topağının üstünde oturur
    const r = rastgele(77)
    const tas = topakYol(-1, -4.6, 7.4, 4.8, r, 8, 0.25)
    ctx.fillStyle = dikey(ctx, -9.4, 0, ['#4B565E', '#1F2326', '#121517'])
    ctx.fill(tas)
    kenarIsik(ctx, tas, '#9FB7C9', 0.8, 0.6)
  }
  const kalca = p.otur ? [0, -9.5] : [0, -12]
  const arka = koyu(TULUM[2], 0.25)
  bacak(ctx, [kalca[0] - 1, kalca[1]], p.bacakArka, arka, p.otur)
  if (kucukArabaVar) kucukAraba(ctx, 8, 0, true)

  ctx.save()
  ctx.translate(kalca[0], kalca[1])
  ctx.rotate(p.egim)
  const omuzA = [-1.4, -13.6], omuzO = [2.2, -13.4]
  // Arka kol ve kazma (gövdenin arkasında)
  let el1 = null, el2 = null
  if (p.kazma !== null) {
    const a = p.kazma - p.egim
    const dx = Math.sin(a), dy = -Math.cos(a)
    el1 = [omuzO[0] + dx * 8.6, omuzO[1] + dy * 8.6]
    el2 = [el1[0] + dx * 3.4, el1[1] + dy * 3.4]
    cizgi(ctx, omuzA[0], omuzA[1], el1[0], el1[1], 3.4, koyu(GOMLEK[1], 0.18))
    eldiven(ctx, el1[0], el1[1])
    kazmaCiz(ctx, el1[0], el1[1], a)
  } else if (p.araba) {
    el1 = [11.4, -9.6]
    cizgi(ctx, omuzA[0], omuzA[1], el1[0] - 1, el1[1], 3.4, koyu(GOMLEK[1], 0.18))
    eldiven(ctx, el1[0] - 1, el1[1])
  } else if (p.otur) {
    el1 = [7, -6]
    cizgi(ctx, omuzA[0], omuzA[1], el1[0], el1[1], 3.4, koyu(GOMLEK[1], 0.18))
    eldiven(ctx, el1[0], el1[1])
  } else {
    const ax = omuzA[0] + Math.sin(p.kolArka) * 9, ay = omuzA[1] + Math.cos(p.kolArka) * 9
    cizgi(ctx, omuzA[0], omuzA[1], ax, ay, 3.4, koyu(GOMLEK[1], 0.18))
    eldiven(ctx, ax, ay)
  }
  govdeCiz(ctx, p.sq)
  ctx.restore()

  bacak(ctx, [kalca[0] + 1, kalca[1]], p.bacakOn, TULUM[2], p.otur)

  ctx.save()
  ctx.translate(kalca[0], kalca[1])
  ctx.rotate(p.egim)
  ctx.scale(1, p.sq)
  basCiz(ctx, v, sapka, p.bas)
  ctx.scale(1, 1 / p.sq)
  // Ön kol
  const omuzO2 = [2.2, -13.4 * p.sq]
  if (el2) {
    cizgi(ctx, omuzO2[0], omuzO2[1], el2[0], el2[1], 3.6, GOMLEK[0])
    eldiven(ctx, el2[0], el2[1])
  } else if (p.araba) {
    cizgi(ctx, omuzO2[0], omuzO2[1], 12.2, -9.2, 3.6, GOMLEK[0])
    eldiven(ctx, 12.2, -9.2)
  } else if (p.otur) {
    cizgi(ctx, omuzO2[0], omuzO2[1], 8.6, -4.4, 3.6, GOMLEK[0])
    eldiven(ctx, 8.6, -4.4)
  } else {
    const ax = omuzO2[0] + Math.sin(p.kolOn) * 9, ay = omuzO2[1] + Math.cos(p.kolOn) * 9
    cizgi(ctx, omuzO2[0], omuzO2[1], ax, ay, 3.6, GOMLEK[0])
    eldiven(ctx, ax, ay)
  }
  if (p.sevin) {
    // Boştaki yumruk havada
    cizgi(ctx, -1.4, -13.4, -6.4, -21.4, 3.4, GOMLEK[0])
    eldiven(ctx, -6.6, -22)
  }
  ctx.restore()
  ctx.restore()
}

// ---- Atlas kaydı ----
export function madenciAnahtar(v, anim, k) { return 'madenci.' + v + '.' + anim + '.' + k }
export function tasiyiciAnahtar(anim, k) { return 'tasiyici.' + anim + '.' + k }

export function madencileriKaydet() {
  const anahtarlar = []
  for (let v = 0; v < VARYANT_SAYISI; v++) {
    for (const anim of MADENCI_ANIM) {
      for (let k = 0; k < ANIMLER[anim].kare; k++) {
        const a = madenciAnahtar(v, anim, k)
        const pz = poz(anim, k)
        Varliklar.kaydet(a, { w: HUCRE_W, h: HUCRE_H, ciz: (ctx) => figur(ctx, pz, VARYANTLAR[v], 'kask', AYAK_X, false) })
        anahtarlar.push(a)
      }
    }
  }
  for (const anim of TASIYICI_ANIM) {
    for (let k = 0; k < ANIMLER[anim].kare; k++) {
      const a = tasiyiciAnahtar(anim, k)
      const pz = poz(anim, k)
      Varliklar.kaydet(a, { w: TASIYICI_W, h: HUCRE_H, ciz: (ctx) => figur(ctx, pz, VARYANTLAR[0], 'kep', TASIYICI_AYAK_X, anim === 'it') })
      anahtarlar.push(a)
    }
  }
  // Kabin operatörü: baş ve omuzlar
  for (let k = 0; k < 2; k++) {
    const a = 'operator.' + k
    Varliklar.kaydet(a, {
      w: 20, h: 22,
      ciz: (ctx) => {
        ctx.translate(9, 30)
        const v = VARYANTLAR[1]
        ctx.fillStyle = dikey(ctx, -16, -6, TULUM)
        ctx.fill(yuvarlakYol(-6, -14, 12, 10, 4))
        if (k) cizgi(ctx, 4, -12, 8.6, -17.4, 3, GOMLEK[0])
        basCiz(ctx, v, 'kask', 0)
      },
    })
    anahtarlar.push(a)
  }
  return anahtarlar
}

// ---- Yönetici portresi (§5.4) ----
const NADIR_KASK = ['#F4F1EA', '#4A90E2', '#F6C453']
const KRAVAT = ['#C4553B', '#2F6DB8', '#1E9E55', '#A8508C', '#D9772B']
const SAC = ['#2B1D12', '#4A2E1C', '#6B4425', '#3A2416']

export function portreCiz(ctx, tohum, nadirlik, boyut) {
  const r = rastgele((tohum >>> 0) * 2654435761 + 17)
  const s = boyut / 64
  ctx.save()
  ctx.scale(s, s)
  // Zemin
  ctx.fillStyle = radyal(ctx, 30, 22, 46, ['#2A5A52', '#143C36', '#0B2622'])
  ctx.fillRect(0, 0, 64, 64)
  const ten = r() < 0.5 ? VARYANTLAR[0] : VARYANTLAR[1]
  const biyik = r() < 0.55
  const gozluk = r() < 0.2
  const kravat = r() < 0.6
  const ceketRenk = ['#3F4B57', '#2F5FA8', '#5A3620', '#23477F'][Math.floor(r() * 4)]
  const aksesuar = KRAVAT[Math.floor(r() * KRAVAT.length)]
  const sac = SAC[Math.floor(r() * SAC.length)]
  // Omuzlar ve ceket
  const govde = new Path2D()
  govde.moveTo(6, 66)
  govde.quadraticCurveTo(8, 46, 32, 44)
  govde.quadraticCurveTo(56, 46, 58, 66)
  govde.closePath()
  ctx.fillStyle = dikey(ctx, 44, 66, [acik(ceketRenk, 0.18), ceketRenk, koyu(ceketRenk, 0.3)])
  ctx.fill(govde)
  kenarIsik(ctx, govde, '#FFFFFF', 1.2, 0.25)
  // Gömlek yakası
  ctx.fillStyle = '#F4E8D6'
  const yaka = new Path2D()
  yaka.moveTo(25, 45); yaka.lineTo(32, 56); yaka.lineTo(39, 45); yaka.closePath()
  ctx.fill(yaka)
  if (kravat) {
    ctx.fillStyle = aksesuar
    const k = new Path2D()
    k.moveTo(30, 47); k.lineTo(34, 47); k.lineTo(35.5, 60); k.lineTo(32, 64); k.lineTo(28.5, 60); k.closePath()
    ctx.fill(k)
    ctx.fillStyle = koyu(aksesuar, 0.25)
    ctx.fill(elips(32, 47.5, 2.4, 1.6))
  } else {
    // Atkı
    ctx.fillStyle = dikey(ctx, 42, 52, [acik(aksesuar, 0.2), aksesuar])
    ctx.fill(yuvarlakYol(19, 42, 26, 8, 4))
    ctx.fill(yuvarlakYol(36, 46, 6, 14, 3))
  }
  // Boyun ve baş
  ctx.fillStyle = ten.tenGolge
  ctx.fillRect(27, 36, 10, 9)
  const yuz = elips(32, 28, 13, 14)
  ctx.fillStyle = radyal(ctx, 28, 23, 18, [acik(ten.ten, 0.2), ten.ten, ten.tenGolge])
  ctx.fill(yuz)
  ctx.fillStyle = ten.tenGolge
  ctx.fill(elips(19.4, 29, 2.4, 3.4))
  ctx.fill(elips(44.6, 29, 2.4, 3.4))
  // Saç (kaskın altından favori)
  ctx.fillStyle = sac
  ctx.fillRect(19.6, 22, 2.6, 7)
  ctx.fillRect(41.8, 22, 2.6, 7)
  // Gözler, kaşlar, burun, ağız
  ctx.fillStyle = '#2B1D12'
  ctx.fill(elips(27, 28, 1.5, 1.9))
  ctx.fill(elips(37, 28, 1.5, 1.9))
  ctx.fillStyle = '#FFFFFF'
  ctx.fill(elips(27.5, 27.4, 0.5, 0.5))
  ctx.fill(elips(37.5, 27.4, 0.5, 0.5))
  ctx.strokeStyle = sac
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(24, 24.2); ctx.lineTo(29.4, 23.6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(34.6, 23.6); ctx.lineTo(40, 24.2); ctx.stroke()
  ctx.fillStyle = ten.tenGolge
  ctx.fill(elips(32, 32, 2.4, 2))
  ctx.fillStyle = rgba('#E25A43', 0.22)
  ctx.fill(elips(24.5, 33, 2.6, 1.6))
  ctx.fill(elips(39.5, 33, 2.6, 1.6))
  if (biyik) {
    ctx.fillStyle = sac
    const b = new Path2D()
    b.moveTo(25.5, 36.4)
    b.quadraticCurveTo(32, 32.6, 38.5, 36.4)
    b.quadraticCurveTo(35, 37.8, 32, 36.6)
    b.quadraticCurveTo(29, 37.8, 25.5, 36.4)
    ctx.fill(b)
  } else {
    ctx.strokeStyle = koyu(ten.tenGolge, 0.4)
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(28.5, 37); ctx.quadraticCurveTo(32, 39.4, 35.5, 37); ctx.stroke()
  }
  if (gozluk) {
    ctx.strokeStyle = '#2B1D12'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(27, 28, 3.6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(37, 28, 3.6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(30.6, 28); ctx.lineTo(33.4, 28); ctx.stroke()
  }
  // Kask (nadirliğe göre)
  const kr = NADIR_KASK[nadirlik] || NADIR_KASK[0]
  const kask = new Path2D()
  kask.moveTo(16, 22.5)
  kask.quadraticCurveTo(16, 6.5, 32, 6.5)
  kask.quadraticCurveTo(48, 6.5, 48, 22.5)
  kask.closePath()
  ctx.fillStyle = dikey(ctx, 6.5, 22.5, [acik(kr, 0.35), kr, koyu(kr, 0.22)])
  ctx.fill(kask)
  kenarIsik(ctx, kask, '#FFFFFF', 1.4, 0.55)
  ctx.fillStyle = rgba('#000000', 0.12)
  ctx.fillRect(31, 7.5, 2, 14)
  ctx.fillStyle = dikey(ctx, 20.5, 25, [acik(kr, 0.1), koyu(kr, 0.25)])
  ctx.fill(yuvarlakYol(13, 20.6, 38, 4.2, 2))
  if (nadirlik === 2) {
    // Efsanevi parlaklık
    ctx.fillStyle = rgba('#FFFFFF', 0.7)
    ctx.beginPath(); ctx.ellipse(24, 12.5, 4.5, 1.6, -0.5, 0, Math.PI * 2); ctx.fill()
  }
  // Fener
  ctx.fillStyle = '#5A5F66'
  ctx.fill(elips(32, 14.5, 4.2, 3.6))
  ctx.fillStyle = radyal(ctx, 32, 14.2, 3.4, ['#FFFFFF', '#FFE08A', '#F6C453'])
  ctx.fill(elips(32, 14.4, 3, 2.6))
  ctx.restore()
}
