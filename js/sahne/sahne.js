// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Sahne (v3): canlı maden görünümü. Dekor dekor.js'ten, karakterler karakter.js'ten çizimle üretilir.
// • Her katta işçiler gidip gelir: kazıcı damarı kazar, taşıyıcı çuvalla cevheri bunkere taşır,
//   seviye arttıkça arabacı ve ikinci taşıyıcı katılır. Kat boşta ya da doluyken işçiler bekler/oturur.
// • Asansör kabini yaylı izler; kabin operatörü içinde durur, cevher bunkerden kabine, kabinden depoya akar.
// • Yükleme katında taşıyıcılar arabayı depodan kamyona iter, kasaya devirir.
// Kare başına yalnız drawImage ve birkaç dönüşüm; şeritler ve kareler ekran çözünürlüğünde önbellekte.

import { Varliklar } from './varliklar.js'
import { portreCiz } from './madenci.js'
import { rozetCiz } from './yuzey.js'
import { Havuz, parcacikSpritelari } from './parcacik.js'
import { karma, dikey, yuvarlakYol, kalas, rastgele, cizgi } from './cizim.js'
import { yerlesim, MAKS_MADEN } from '../yerlesim.js'
import * as E from '../ekonomi.js'
import { bicim } from '../bicim.js'
import * as D from './dekor.js'
import * as K from './karakter.js'

const DPR_TAVAN = { yuksek: 2, dengeli: 1.5, pil: 1.25 }
const KAZI_MS = 1600
const SATIS_TOPLA_MS = 450
const KARAKTER = 1.06        // karakter birimi → referans pikseli
const ADIM_BOY = 13          // bir yürüme döngüsünde alınan yol (referans px)

let tuval = null, ctx = null, efektTuval = null, ectx = null
let W = 390, H = 600, oran = 2, efOran = 2, efW = 390, efH = 844
let yer = yerlesim(390)
let durumRef = null
let hazir = false
let sonMs = 0
let sonKaydir = 0
const kaziBas = new Float64Array(MAKS_MADEN)
let satisToplam = 0, satisSon = 0, satisSira = 0, sonYukseltmeEfekt = 0
const dunyaP = new Havuz(320)
const efektP = new Havuz(256)
let efektCanli = false
let kalite = 'yuksek'
const yetAktif = new Set()

const al = (a) => Varliklar.al(a)
const dpTavan = () => DPR_TAVAN[kalite] || 2
const kesir = (x) => x - Math.floor(x)
const X = (r) => r * yer.k
const Yk = (r) => r * (yer.SATIR_H / 107)       // kat içi dikey
const Yy = (r) => r * (yer.YUKLEME_H / 107)     // yükleme katı dikey

// ── Şerit önbelleği (bölge + ekran boyutu değişince boşalır) ──
const serit = new Map()
let seritAnahtar = ''
function seritAl(kod, ad, h, ciz) {
  const genel = kod + '|' + W + '|' + oran
  if (genel !== seritAnahtar) { serit.clear(); seritAnahtar = genel; yiginOnbellek.clear() }
  let c = serit.get(ad)
  if (c) return c
  c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(W * oran))
  c.height = Math.max(1, Math.round(h * oran))
  const g = c.getContext('2d')
  g.scale(c.width / W, c.height / h)
  ciz(g)
  serit.set(ad, c)
  return c
}
const katSerit = (kod, v, asama = 0) => seritAl(kod, 'kat' + v + '|' + asama, yer.SATIR_H, (g) => D.katCiz(g, W, yer.SATIR_H, yer, kod, v, asama))
const yuklemeSerit = (kod) => seritAl(kod, 'yukleme', yer.YUKLEME_H, (g) => D.yuklemeCiz(g, W, yer.YUKLEME_H, yer, kod))
const kayaSerit = (kod, v, h) => seritAl(kod, 'kaya' + v + '|' + h, h, (g) => D.kayaSerit(g, W, h, kod, 401 + v * 97))
let kabinOnbellek = null, kabinAnahtar = ''
function kabinC() {
  const anahtar = yer.tupG + '|' + yer.KABIN_H + '|' + oran
  if (kabinOnbellek && kabinAnahtar === anahtar) return kabinOnbellek
  const c = document.createElement('canvas')
  c.width = Math.ceil(yer.tupG * oran)
  c.height = Math.ceil(yer.KABIN_H * oran)
  const g = c.getContext('2d')
  g.scale(c.width / yer.tupG, c.height / yer.KABIN_H)
  D.kabinCiz(g, yer.tupG, yer.KABIN_H)
  kabinOnbellek = c
  kabinAnahtar = anahtar
  return c
}

// Cevher yığını sprite'ı: genişlik w, en çok hm yükseklik; doluluk 12 basamakta
const yiginOnbellek = new Map()
function yigin(kod, ad, w, hm, oranDolu, tohum) {
  const s = Math.max(0, Math.min(12, Math.round(oranDolu * 12)))
  if (!s) return null
  const anahtar = ad + '|' + s
  let c = yiginOnbellek.get(anahtar)
  if (c) return c
  c = document.createElement('canvas')
  c.width = Math.ceil((w + 4) * oran)
  c.height = Math.ceil((hm + 4) * oran)
  const g = c.getContext('2d')
  g.scale(oran, oran)
  g.translate((w + 4) / 2, hm + 2)
  D.yiginCiz(g, w * (0.55 + 0.45 * s / 12), hm * s / 12, kod, tohum)
  yiginOnbellek.set(anahtar, c)
  return c
}
function yiginCiz(img, x, altY) {
  if (!img) return
  const w = img.width / oran, h = img.height / oran
  ctx.drawImage(img, Math.round((x - w / 2) * oran) / oran, Math.round((altY - h + 2) * oran) / oran, w, h)
}

// ── Karakter çizimi ──
function figur(gor, anim, kare, x, y, yon, cevher, carpan = 1) {
  const s = yer.k * KARAKTER * carpan
  const cv = K.figurKare(gor, anim, kare, s * oran, cevher)
  const ax = K.HUCRE.ayakX * s, ay = K.HUCRE.ayakY * s
  const w = cv.width / oran, h = cv.height / oran
  const px = Math.round(x * oran) / oran, py = Math.round(y * oran) / oran
  if (yon >= 0) ctx.drawImage(cv, px - ax, py - ay, w, h)
  else {
    ctx.save()
    ctx.translate(px, py)
    ctx.scale(-1, 1)
    ctx.drawImage(cv, -ax, -ay, w, h)
    ctx.restore()
  }
}
// Araba: (x, y) alt orta; aci: devrilme (rad), pivot: devrilmenin döndüğü teker (-1 sol, +1 sağ)
function araba(dolu, kod, x, y, aci = 0, pivot = 1) {
  const s = yer.k * KARAKTER
  const cv = K.arabaKare(dolu, D.cevherRenk(kod), D.cevherVurgu(kod), s * oran)
  const [ax, ay] = K.arabaAyak(s)
  const w = cv.width / oran, h = cv.height / oran
  const px = Math.round(x * oran) / oran, py = Math.round(y * oran) / oran
  if (!aci) { ctx.drawImage(cv, px - ax, py - ay, w, h); return }
  const ox = pivot * 9 * s
  ctx.save()
  ctx.translate(px + ox, py - 2.6 * s)
  ctx.rotate(aci)
  ctx.drawImage(cv, -ox - ax, -ay + 2.6 * s, w, h)
  ctx.restore()
}
const yuruKare = (yol) => Math.floor(kesir(yol / ADIM_BOY) * 8) % 8

// ── Kat işçileri ──
// Her katta en çok dört işçi: 0 kazıcı, 1 taşıyıcı, 2 arabacı (Sv.25+), 3 ikinci taşıyıcı (Sv.75+)
const faz = new Float64Array(MAKS_MADEN * 4)
const sonParca = new Int8Array(MAKS_MADEN * 4).fill(-1)
const sonVurus = new Float64Array(MAKS_MADEN).fill(-1)
const bostaSure = new Float64Array(MAKS_MADEN)
const sevinBitis = new Float64Array(MAKS_MADEN + 2)
const TASI = { al: 0.5, bos: 0.45, hiz: 36 }
const ARB = { bekle: 1.3, devir: 0.8, hiz: 28 }

function katTempo(b, i, aktif) {
  const L = (b.madenler[i] && b.madenler[i].L) || 1
  return Math.min(1.7, 0.85 + 0.09 * Math.log2(L)) * (aktif ? 1.55 : 1)
}

// Taşıyıcı döngüsü: al (eğil) → çuvalla bunkere yürü → boşalt → boş dön
function tasiyiciPoz(u, x0, x1) {
  const yol = (x1 - x0) / TASI.hiz
  const T = TASI.al + TASI.bos + 2 * yol
  u = ((u % T) + T) % T
  if (u < TASI.al) return { x: x0, anim: 'egil', kare: Math.min(3, Math.floor((u / TASI.al) * 4)), yon: -1, parca: 0 }
  u -= TASI.al
  if (u < yol) { const x = x0 + (x1 - x0) * (u / yol); return { x, anim: 'tasi', kare: yuruKare(x - x0), yon: 1, parca: 1 } }
  u -= yol
  if (u < TASI.bos) return { x: x1, anim: 'bosalt', kare: Math.min(3, Math.floor((u / TASI.bos) * 4)), yon: 1, parca: 2 }
  u -= TASI.bos
  const x = x1 - (x1 - x0) * (u / yol)
  return { x, anim: 'yuru', kare: yuruKare(x1 - x), yon: -1, parca: 3 }
}
// Arabacı döngüsü: arabanın dolmasını bekle → bunkere it → devir → geri çek
function arabaciPoz(u, x0, x1) {
  const yol = (x1 - x0) / ARB.hiz
  const T = ARB.bekle + ARB.devir + 2 * yol
  u = ((u % T) + T) % T
  const d = 17 * KARAKTER   // işçi ile araba merkezi arası (karakter birimi → ref)
  if (u < ARB.bekle) return { ax: x0, x: x0 - d, anim: 'bekle', kare: Math.floor(u * 2.5) % 6, yon: 1, dolu: u > ARB.bekle * 0.55, aci: 0, parca: 0 }
  u -= ARB.bekle
  if (u < yol) { const ax = x0 + (x1 - x0) * (u / yol); return { ax, x: ax - d, anim: 'it', kare: yuruKare(ax - x0), yon: 1, dolu: true, aci: 0, parca: 1 } }
  u -= yol
  if (u < ARB.devir) {
    const q = u / ARB.devir
    return { ax: x1, x: x1 - d, anim: 'bekle', kare: 0, yon: 1, dolu: q < 0.45, aci: Math.sin(Math.min(1, q / 0.9) * Math.PI) * 0.55, parca: 2 }
  }
  u -= ARB.devir
  const ax = x1 - (x1 - x0) * (u / yol)
  return { ax, x: ax - d, anim: 'yuru', kare: yuruKare(x1 - ax), yon: -1, dolu: false, aci: 0, parca: 3 }
}

function katIscileri(d, b, i, sy, dt, tempo, simdiMs) {
  const kod = d.aktifBolge
  const c = d.calisma.madenler[i]
  const m = b.madenler[i]
  const calisir = !!(c && c.calisiyor && !c.dolu)
  bostaSure[i] = calisir ? 0 : bostaSure[i] + dt
  const otur = !calisir && bostaSure[i] > 6
  const yonetimli = b.yoneticiler.some((yo) => yo.atanan === 'm' + i)
  const sevin = simdiMs < sevinBitis[i]
  const sevKare = Math.floor(simdiMs / 125) % 6
  const zemin = sy + Yk(D.KAT.zemin)
  const cevher = D.cevherRenk(kod)
  const L = m.L
  const n = 2 + (L >= 25 ? 1 : 0) + (L >= 75 ? 1 : 0)
  const bunkerX = X((D.KAT.bunkerX0 + D.KAT.bunkerX1) / 2), bunkerY = sy + Yk(D.KAT.bunkerUst)

  // Arka şerit: ikinci taşıyıcı ve taşıyıcı (biraz geride), sonra kazıcı, en önde raydaki arabacı
  const sira = n === 4 ? [3, 1, 0, 2] : n === 3 ? [1, 0, 2] : [1, 0]
  for (const j of sira) {
    const id = i * 4 + j
    if (calisir && !sevin) faz[id] += dt * tempo
    // Katlar aynı anda aynı hareketi yapmasın: kat başına sabit evre kayması
    const kayma = karma(i * 13 + j * 5) * 6
    if (j === 0) {
      const x = X(D.KAT.kaziciX)
      if (sevin) { figur(0 + (i % 2) * 2, 'sevin', sevKare, x, zemin + 1, -1); continue }
      if (!calisir) { figur(0 + (i % 2) * 2, otur ? 'dinlen' : 'bekle', otur ? Math.floor(simdiMs / 800) % 4 : Math.floor(simdiMs / 400) % 6, x, zemin + 1, -1); continue }
      const u = (faz[id] + kayma) / K.ANIM.kaz.sure
      const kare = Math.floor(kesir(u) * 8)
      figur(0 + (i % 2) * 2, 'kaz', kare, x, zemin + 1, -1)
      // Vuruş karesine girişte kıvılcım ve toz
      const v = Math.floor(u * 8)
      if (sonVurus[i] >= 0) {
        for (let q = sonVurus[i] + 1; q <= v; q++) {
          if (q % 8 !== K.VURUS) continue
          const s = yer.k * KARAKTER
          const hx = x - 27.8 * s, hy = zemin + 1 - 18.6 * s
          const aktif = yetAktif.has('m' + i)
          dunyaP.patlat(hx, hy, 'kivilcim', aktif ? 5 : 3, { yon: Math.PI })
          if (karma(q + i) < 0.6) dunyaP.patlat(hx + 3, hy + 6, 'toz', 1)
          // Damardan kopan taş ayak dibindeki yığına düşer
          if (karma(q * 1.7 + i) < 0.7) {
            dunyaP.firlat(hx + 2, hy + 2, X(D.KAT.kaziYigini) + (karma(q + i * 3) - 0.5) * X(10), zemin - Yk(2), 0.32, cevherTasi(kod, q % 3),
              { boy: (0.9 + karma(q) * 0.4) / oran, g: 360, kal: 0.1 })
          }
          if (aktif && karma(q * 3 + i) < 0.6) dunyaP.patlat(hx + 4, hy - 8, 'parilti', 1, { yaricap: 12 })
          break
        }
      }
      sonVurus[i] = v
      continue
    }
    if (j === 1 || j === 3) {
      const x0 = X(D.KAT.alX) + (j === 3 ? X(6) : 0), x1 = X(D.KAT.bosaltX) - (j === 3 ? X(4) : 0)
      const fz = faz[id] + kayma + (j === 3 ? 3.3 : 0)
      const p = tasiyiciPoz(fz, x0 / yer.k, x1 / yer.k)
      const px = p.x * yer.k
      const gor = j === 3 ? 3 : 1
      const y0 = zemin - Yk(2.5)
      if (sevin) { figur(gor, 'sevin', (sevKare + j) % 6, px, y0, p.yon); continue }
      if (!calisir) {
        figur(gor, otur ? 'dinlen' : 'bekle', otur ? Math.floor(simdiMs / 800 + j) % 4 : Math.floor(simdiMs / 400 + j) % 6, px, y0, p.yon)
        if (otur && j === 1 && !yonetimli) zzz(px, y0 - Yk(44), simdiMs / 1000, i)
        continue
      }
      figur(gor, p.anim, p.kare, px, y0, p.yon, cevher)
      // Bunkere varınca çuvaldaki cevher bunkere dökülür
      if (p.parca === 2 && sonParca[id] !== 2) cuvalDok(kod, px + X(6), y0 - Yk(24), bunkerX, bunkerY)
      sonParca[id] = p.parca
      continue
    }
    // Arabacı: raylarda
    const p = arabaciPoz(faz[id] + kayma, D.KAT.arabaSol, D.KAT.arabaSag)
    const ray = zemin + Yk(1.5)
    if (sevin) { araba(false, kod, X(p.ax), ray); figur(2, 'sevin', (sevKare + 2) % 6, X(p.x), ray, 1); continue }
    araba(p.dolu, kod, X(p.ax), ray, p.aci, 1)
    if (!calisir) { figur(2, otur ? 'dinlen' : 'bekle', otur ? Math.floor(simdiMs / 800 + 2) % 4 : Math.floor(simdiMs / 400 + 2) % 6, X(p.x), ray, 1); continue }
    figur(2, p.anim, p.kare, X(p.x), ray, p.yon)
    if (p.parca === 2 && sonParca[id] !== 2) cuvalDok(kod, X(p.ax + 6), ray - Yk(16), bunkerX, bunkerY, 6)
    sonParca[id] = p.parca
  }
}

// Kanarya: kafesteki tünekte zıplar, ara ara kanat çırpar (düzen 1 katları)
function kanarya(sy, t, i) {
  const s = yer.k
  const x0 = X(D.KAT.kafes[0]), y0 = sy + Yk(D.KAT.kafes[1]) + 2 * s + 12 * s * 0.62
  const evre = (t * 0.7 + i * 0.37) % 1
  const zipla = evre > 0.8 ? Math.sin(((evre - 0.8) / 0.2) * Math.PI) * 2.2 * s : 0
  const yon = Math.floor(t * 0.35 + i) % 2 ? -1 : 1
  const x = x0 + (yon > 0 ? -1.2 : 1.2) * s, y = y0 - zipla
  const kanat = evre > 0.8 ? Math.sin(t * 40) * 0.8 : 0
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(yon * s, s)
  ctx.fillStyle = '#F6C93A'
  ctx.beginPath(); ctx.ellipse(0, -2.2, 2.3, 1.7, -0.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(1.8, -3.6, 1.2, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#E0A818'
  ctx.beginPath(); ctx.ellipse(-0.6, -2.2 - kanat, 1.4, 0.8, -0.4 - kanat * 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#E8782C'
  ctx.beginPath(); ctx.moveTo(2.8, -3.8); ctx.lineTo(3.9, -3.5); ctx.lineTo(2.8, -3.2); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#1C120A'
  ctx.fillRect(2, -4.1, 0.5, 0.5)
  ctx.fillStyle = '#C89A20'
  ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-3.6, -1.2); ctx.lineTo(-2, -1.4); ctx.closePath(); ctx.fill()
  ctx.restore()
}

// Uyuklayan işçi: başının üstünden yükselen "z" harfleri (kat boşta: dokun ya da yönetici tut)
function zzz(x, y, t, tohum) {
  ctx.font = '800 9px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 2.4
  ctx.lineJoin = 'round'
  for (let q = 0; q < 3; q++) {
    const e = (t * 0.45 + q / 3 + tohum * 0.13) % 1
    ctx.globalAlpha = Math.sin(e * Math.PI) * 0.9
    const zx = x + 4 + e * 9 + Math.sin(e * 6 + q) * 1.5, zy = y - e * 16
    const boy = 0.7 + e * 0.6
    ctx.save()
    ctx.translate(zx, zy)
    ctx.scale(boy, boy)
    ctx.strokeStyle = 'rgba(20,12,6,.75)'
    ctx.strokeText('z', 0, 0)
    ctx.fillStyle = '#E8F4FF'
    ctx.fillText('z', 0, 0)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

// Çuval/araba boşaltma: taşlar bunkerin üstüne düşer
function cuvalDok(kod, x0, y0, hx, hy, adet = 4) {
  for (let q = 0; q < adet; q++) {
    const tas = cevherTasi(kod, q % 3)
    dunyaP.firlat(x0 + (karma(q * 7.1 + x0) - 0.5) * 4, y0, hx + (karma(q * 3.7 + y0) - 0.5) * X(18), hy - 2, 0.28 + q * 0.03, tas,
      { boy: (1 + karma(q + x0) * 0.4) / oran, g: 420, kal: 0.12 })
  }
}

// Küçük cevher taşı (parçacık görseli), ekran çözünürlüğünde
const tasCache = new Map()
function cevherTasi(kod, n) {
  const anahtar = kod + '|' + n + '|' + oran
  let c = tasCache.get(anahtar)
  if (c) return c
  const s = oran
  c = document.createElement('canvas')
  c.width = Math.ceil(9 * s)
  c.height = Math.ceil(7 * s)
  const g = c.getContext('2d')
  g.scale(s, s)
  const r = rastgele(31 + n * 7)
  g.beginPath()
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const rr = 2.6 + r() * 1.4
    const px = 4.5 + Math.cos(a) * rr * 1.15, py = 3.6 + Math.sin(a) * rr * 0.85
    i ? g.lineTo(px, py) : g.moveTo(px, py)
  }
  g.closePath()
  g.fillStyle = D.cevherRenk(kod)
  g.fill()
  g.strokeStyle = 'rgba(0,0,0,.6)'
  g.lineWidth = 0.7
  g.stroke()
  g.fillStyle = D.cevherVurgu(kod)
  g.globalAlpha = 0.85
  g.fillRect(2.6, 1.6, 2.2, 1.2)
  tasCache.set(anahtar, c)
  return c
}

// ── Yükleme katı: taşıyıcılar depodan kamyona araba iter ──
const DEVIR = 0.45
const devrildi = new Uint8Array(64)
const yuklemeSon = new Float64Array(64)
let kamyonYuk = 0.3
let sonDuman = 0
// Kamyon: kasa dolunca korna çalıp çıkar, boşaltıp geri gelir (görsel; satışlar benzetimde)
const kamyon = { durum: 'bekle', t: 0, x: 0 }
const KAMYON_YOL = 280, KAMYON_GIT = 1.9, KAMYON_YOK = 1.4
let kamyonSprite = null, kamyonAnahtar = '', tekerSprite = null
function kamyonGorsel() {
  const anahtar = W + '|' + oran
  if (kamyonSprite && kamyonAnahtar === anahtar) return kamyonSprite
  const K2 = D.KAMYON, ky = yer.YUKLEME_H / 107
  const w = (K2.x1 - K2.x0) * yer.k, h = (K2.y1 - K2.y0) * ky
  const c = document.createElement('canvas')
  c.width = Math.ceil(w * oran)
  c.height = Math.ceil(h * oran)
  const g = c.getContext('2d')
  g.scale(oran, oran)
  g.translate(-K2.x0 * yer.k, -K2.y0 * ky)
  D.kamyonGovde(g, (r) => r * yer.k, (r) => r * ky)
  const r = K2.tekerR * ky
  const t = document.createElement('canvas')
  t.width = t.height = Math.ceil((r * 2 + 2) * oran)
  const tg = t.getContext('2d')
  tg.scale(oran, oran)
  D.lastikCiz(tg, r + 1, r + 1, r)
  kamyonSprite = c
  tekerSprite = t
  kamyonAnahtar = anahtar
  return c
}
function kamyonGuncelle(dt) {
  kamyon.t += dt
  if (kamyon.durum === 'bekle') {
    kamyon.x = 0
    if (kamyonYuk >= 1) { kamyon.durum = 'gidiyor'; kamyon.t = 0; if (Sahne.sesCal) Sahne.sesCal('korna') }
  } else if (kamyon.durum === 'gidiyor') {
    const q = Math.min(1, kamyon.t / KAMYON_GIT)
    kamyon.x = -KAMYON_YOL * q * q
    if (q >= 1) { kamyon.durum = 'yok'; kamyon.t = 0; kamyonYuk = 0 }
  } else if (kamyon.durum === 'yok') {
    kamyon.x = -KAMYON_YOL
    if (kamyon.t >= KAMYON_YOK) { kamyon.durum = 'geliyor'; kamyon.t = 0 }
  } else {
    const q = Math.min(1, kamyon.t / KAMYON_GIT)
    kamyon.x = -KAMYON_YOL * (1 - q) * (1 - q)
    if (q >= 1) { kamyon.durum = 'bekle'; kamyon.t = 0; kamyon.x = 0; kamyonYuk = Math.max(kamyonYuk, 0.12) }
  }
}
function kamyonCiz(kod) {
  const K2 = D.KAMYON, ky = yer.YUKLEME_H / 107, yy = yer.yuklemeY
  const sp = kamyonGorsel()
  const dx = kamyon.x * yer.k
  const x0 = K2.x0 * yer.k + dx
  if (x0 + sp.width / oran < -4) return
  // Gölge, gövde, yük, dönen tekerlekler
  ctx.fillStyle = 'rgba(0,0,0,.4)'
  ctx.beginPath(); ctx.ellipse(166 * yer.k + dx, yy + 97 * ky, 60 * yer.k, 3.2 * ky, 0, 0, Math.PI * 2); ctx.fill()
  ctx.drawImage(sp, Math.round(x0 * oran) / oran, Math.round((yy + K2.y0 * ky) * oran) / oran, sp.width / oran, sp.height / oran)
  ctx.save()
  ctx.translate(dx, yy)
  D.kamyonYuku(ctx, yer, ky, kamyonYuk, kod)
  ctx.restore()
  const r = K2.tekerR * ky, tw = tekerSprite.width / oran
  const aci = dx / r
  for (const tx of K2.teker) {
    ctx.save()
    ctx.translate(tx * yer.k + dx, yy + K2.tekerY * ky)
    ctx.rotate(aci)
    ctx.drawImage(tekerSprite, -tw / 2, -tw / 2, tw, tw)
    ctx.restore()
  }
}
function yuklemeIscileri(d, alfa, simdiMs, dt) {
  const tl = d.calisma.tasiyicilar
  const kod = d.aktifBolge
  const yy = yer.yuklemeY
  const zemin = yy + Yy(D.YUKLEME.zemin)
  const x0 = X(D.YUKLEME.kapiX), x1 = X(D.YUKLEME.satisX)
  const s = yer.k * KARAKTER
  const ara = 17 * s
  let bosta = false
  kamyonGuncelle(dt)
  for (let j = tl.length - 1; j >= 0; j--) {
    const ta = tl[j]
    if (ta.durum === 'bekle') { if (bosta) continue; bosta = true }
    const konum = ta.oncekiKonum + (ta.konum - ta.oncekiKonum) * alfa
    const tt = ta.onceki <= ta.t ? ta.onceki + (ta.t - ta.onceki) * alfa : ta.t
    const evre = ta.sure > 0 ? Math.min(1, Math.max(0, tt / ta.sure)) : 0
    const kay = (j % 3) * 7
    const ax = x0 + (x1 - x0) * konum + kay
    const ry = zemin + (j % 2) * 1.5
    const gor = j % 2 ? 3 : 1
    if (ta.durum === 'satiyor') {
      const aci = -Math.sin(Math.min(1, evre / 0.9) * Math.PI) * 0.6
      araba(evre < DEVIR, kod, ax, ry, aci, -1)
      figur(gor, 'bekle', 0, ax + ara, ry, -1)
      if (evre >= DEVIR && !devrildi[j]) {
        devrildi[j] = 1
        const kasada = kamyon.durum === 'bekle'
        for (let q = 0; q < 6; q++) {
          const hy = kasada ? yy + Yy(50) : zemin - Yy(1)
          dunyaP.firlat(ax - X(8), ry - Yy(16), X(170 + q * 7 + karma(simdiMs + q) * 6), hy, 0.3 + q * 0.025, cevherTasi(kod, q % 3),
            { boy: (1 + karma(q * 7 + simdiMs) * 0.4) / oran, g: 400, kal: kasada ? 0.06 : 0.4, zemin: hy })
        }
        dunyaP.patlat(ax - X(6), ry - Yy(14), 'toz', 2)
        if (kasada) kamyonYuk = Math.min(1, kamyonYuk + 0.09)
      }
      continue
    }
    if (devrildi[j]) devrildi[j] = 0
    const yuklu = ta.durum === 'yukluyor' ? evre > 0.5 : ta.durum === 'gidiyor'
    araba(yuklu, kod, ax, ry)
    if (ta.durum === 'gidiyor') figur(gor, 'it', yuruKare((x0 - ax) / yer.k), ax + ara, ry, -1)
    else if (ta.durum === 'donuyor') figur(gor, 'yuru', yuruKare((ax - x1) / yer.k), ax + ara, ry, 1)
    else {
      figur(gor, 'bekle', Math.floor(simdiMs / 400 + j) % 6, ax + ara, ry, -1)
      // Bunker oluğundan arabaya taş akar
      if (ta.durum === 'yukluyor' && simdiMs - yuklemeSon[j] > 75) {
        yuklemeSon[j] = simdiMs
        dunyaP.firlat(X(D.YUKLEME.bunkerX0 - 8), yy + Yy(71), ax + (karma(simdiMs) - 0.5) * X(10), ry - Yy(14), 0.22, cevherTasi(kod, Math.floor(simdiMs / 75) % 3),
          { boy: (1 + karma(simdiMs * 1.9) * 0.4) / oran, g: 520 })
      }
    }
  }
  // Kamyon egzozu
  let isler = false
  for (let j = 0; j < tl.length; j++) if (tl[j].durum !== 'bekle') { isler = true; break }
  const yolda = kamyon.durum === 'gidiyor' || kamyon.durum === 'geliyor'
  if (kamyon.durum !== 'yok' && simdiMs - sonDuman > (yolda ? 110 : isler ? 520 : 1700)) {
    sonDuman = simdiMs
    dunyaP.patlat(X(D.YUKLEME.egzoz[0] + kamyon.x), yy + Yy(D.YUKLEME.egzoz[1]), 'duman', yolda ? 2 : isler ? 2 : 1)
  }
}

// ── Kayıt (çizimle üretilen ortak görseller) ──
function prosedurelKaydet() {
  Varliklar.kaydet('isik.sicak', { w: 64, h: 64, ciz: (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,248,220,0.95)'); g.addColorStop(0.18, 'rgba(255,200,115,0.5)'); g.addColorStop(0.5, 'rgba(255,170,80,0.14)'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h) } })
  Varliklar.kaydet('isik.mavi', { w: 64, h: 64, ciz: (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(225,245,255,0.95)'); g.addColorStop(0.2, 'rgba(120,190,255,0.5)'); g.addColorStop(0.55, 'rgba(70,140,230,0.14)'); g.addColorStop(1, 'rgba(60,120,220,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h) } })
  Varliklar.kaydet('isik.koni', { w: 48, h: 64, ciz: (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(255,214,140,0.42)'); g.addColorStop(1, 'rgba(255,190,110,0)')
    c.fillStyle = g
    c.beginPath(); c.moveTo(w * 0.42, 0); c.lineTo(w * 0.58, 0); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill()
  } })
  Varliklar.kaydet('dolu.etiket', { w: 30, h: 12, ciz: (c, w, h) => {
    const yol = yuvarlakYol(0.5, 0.5, w - 1, h - 1, h / 2)
    c.fillStyle = dikey(c, 0, h, ['#F07A62', '#E25A43', '#B03E2C']); c.fill(yol)
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 1; c.stroke(yol)
    c.fillStyle = '#FFFFFF'; c.font = '700 8px Rubik, "Segoe UI", Roboto, system-ui, sans-serif'
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DOLU', w / 2, h / 2 + 0.5)
  } })
  // Kilitli kat üst katmanı (saydam): kesik çizgili oda, KAZI tabelası, yaslanmış kazma
  Varliklar.kaydet('kilit.ust', { w: 'W', h: (Wd) => yerlesim(Wd).SATIR_H, ciz: (c, w, h) => {
    const y = yerlesim(w)
    const r = rastgele(4711)
    c.fillStyle = 'rgba(0,0,0,.3)'
    c.fillRect(0, 0, w, h)
    c.save(); c.setLineDash([5, 4]); c.strokeStyle = 'rgba(255,230,190,.35)'; c.lineWidth = 1.3
    c.strokeRect(y.odaX + 6, y.ODA_UST + 6, y.kuyuX - y.odaX - 12, y.ZEMIN_Y - y.ODA_UST - 8); c.restore()
    const tx = (y.odaX + y.kuyuX) / 2, ty = y.ZEMIN_Y * 0.42
    const kr = ['#8A5A32', '#6B4425']
    for (const dx of [-16, 13]) kalas(c, tx + dx, ty, 3, y.ZEMIN_Y - ty, r, kr[0], kr[1], false)
    kalas(c, tx - 26, ty - 9, 52, 20, r, kr[0], kr[1], true)
    c.fillStyle = '#F6C453'; c.font = '800 12px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('KAZI', tx, ty + 1.8)
    cizgi(c, tx + 30, y.ZEMIN_Y, tx + 38, y.ZEMIN_Y - 26, 1.8, kr[0])
    c.strokeStyle = '#C9D1D8'; c.lineWidth = 2.2
    c.beginPath(); c.moveTo(tx + 31, y.ZEMIN_Y - 28); c.quadraticCurveTo(tx + 38, y.ZEMIN_Y - 27, tx + 44, y.ZEMIN_Y - 21); c.stroke()
  } })
  return ['isik.sicak', 'isik.mavi', 'isik.koni', 'dolu.etiket', 'kilit.ust', ...parcacikSpritelari()]
}

// ── Hazine damarı: kaya duvarında parlayan altın külçeleri ya da elmas kristalleri ──
// Tünel duvarında, fenerlerin ve yönetici rozetinin dışında üç nokta (referans px)
const HAZINE_YER = [[226, 40], [250, 24], [198, 60]]
const HAZINE_R = 26
const hazineSprite = new Map()
function hazineGorsel(tur) {
  const anahtar = tur + '|' + oran
  let c = hazineSprite.get(anahtar)
  if (c) return c
  const S = 30
  c = document.createElement('canvas')
  c.width = c.height = Math.ceil(S * oran)
  const g = c.getContext('2d')
  g.scale(oran, oran)
  const r = rastgele(tur === 'elmas' ? 77 : 41)
  g.beginPath()
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, rr = 10.5 + r() * 2.5
    const x = 15 + Math.cos(a) * rr * 1.15, y = 17 + Math.sin(a) * rr * 0.72
    i ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.closePath()
  g.fillStyle = 'rgba(20,14,10,.78)'
  g.fill()
  g.strokeStyle = 'rgba(140,110,80,.55)'
  g.lineWidth = 0.8
  g.stroke()
  if (tur === 'elmas') {
    for (const [x, y, w, h, a] of [[9, 22, 5, 11, -0.45], [21, 22, 5, 10, 0.5], [15, 23, 6.5, 16, 0.02]]) {
      g.save()
      g.translate(x, y)
      g.rotate(a)
      const yol = new Path2D()
      yol.moveTo(-w / 2, 0); yol.lineTo(-w / 2, -h * 0.7); yol.lineTo(0, -h); yol.lineTo(w / 2, -h * 0.7); yol.lineTo(w / 2, 0); yol.closePath()
      const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0)
      gr.addColorStop(0, '#2F6DB8'); gr.addColorStop(0.45, '#BFE3FF'); gr.addColorStop(0.55, '#7DB1F0'); gr.addColorStop(1, '#2A5FA3')
      g.fillStyle = gr
      g.fill(yol)
      g.strokeStyle = '#163556'
      g.lineWidth = 0.9
      g.stroke(yol)
      g.strokeStyle = 'rgba(255,255,255,.7)'
      g.lineWidth = 0.6
      g.beginPath(); g.moveTo(-w * 0.12, -h * 0.15); g.lineTo(-w * 0.12, -h * 0.68); g.stroke()
      g.restore()
    }
  } else {
    for (const [x, y, rr] of [[10, 19, 4.2], [18, 15, 4.8], [21, 21, 3.6], [13, 13, 3.2], [15, 21, 3.4]]) {
      g.beginPath()
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2, q = rr * (0.78 + r() * 0.35)
        const px = x + Math.cos(a) * q, py = y + Math.sin(a) * q * 0.82
        i ? g.lineTo(px, py) : g.moveTo(px, py)
      }
      g.closePath()
      const gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, 0, x, y, rr * 1.2)
      gr.addColorStop(0, '#FFF2B8'); gr.addColorStop(0.35, '#FFD45A'); gr.addColorStop(1, '#C07F1C')
      g.fillStyle = gr
      g.fill()
      g.strokeStyle = '#6B4425'
      g.lineWidth = 0.8
      g.stroke()
      g.fillStyle = 'rgba(255,255,255,.85)'
      g.fillRect(x - rr * 0.45, y - rr * 0.45, 1.3, 1.1)
    }
  }
  hazineSprite.set(anahtar, c)
  return c
}
function hazineNokta(h) {
  const [hx, hy] = HAZINE_YER[h.yer % 3]
  return { x: X(hx), y: yer.satirY(h.kat) + Yk(hy) + 4 }
}
let sonParilti = 0, sonHazineYer = 0
function hazineCiz(d, ust, alt, simdiMs) {
  const h = d.calisma.hazine
  if (!h || h.kat >= d.bolgeler[d.aktifBolge].madenler.length) return
  sonHazineYer = h.yer
  const { x, y } = hazineNokta(h)
  if (y + 30 < ust || y - 30 > alt) return
  const yas = d.zaman - h.bas, kalan = h.bitis - d.zaman
  const t = simdiMs / 1000
  const giris = Math.min(1, yas / 0.45)
  const olc = giris < 1 ? 1 + 2.2 * Math.pow(giris - 1, 3) + 1.2 * Math.pow(giris - 1, 2) : 1 + 0.05 * Math.sin(t * 4.2)
  const sonum = kalan < 6 ? (Math.sin(t * (kalan < 2.5 ? 22 : 12)) > -0.2 ? 1 : 0.35) : 1
  const elmas = h.tur === 'elmas'
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = (0.55 + 0.25 * Math.sin(t * 4.2)) * sonum * giris
  const hl = al(elmas ? 'isik.mavi' : 'isik.sicak'), hs = 72 * olc
  ctx.drawImage(hl, x - hs / 2, y - hs / 2, hs, hs)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = sonum
  const sp = hazineGorsel(h.tur), w = (sp.width / oran) * olc * 1.25
  ctx.drawImage(sp, x - w / 2, y - w / 2 - 2, w, w)
  const ev = (t * 1.15) % 1
  if (giris >= 1) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = Math.sin(ev * Math.PI) * sonum
    const ps = 18 * Math.sin(ev * Math.PI), pa = Math.floor(t * 1.15)
    const ox = (karma(pa) - 0.5) * 16, oy = (karma(pa * 3 + 1) - 0.5) * 12 - 4
    ctx.drawImage(al('p.parilti'), x + ox - ps / 2, y + oy - ps / 2, ps, ps)
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.globalAlpha = 1
  if (simdiMs - sonParilti > 650 && giris >= 1) {
    sonParilti = simdiMs
    dunyaP.patlat(x, y - 6, 'parilti', 1, { yaricap: 14 })
  }
}

// ── Asansör ──
// Kabin yayı: görüntü benzetim konumunu hafif sönümlü yayla izler (kalkışta yumuşak, durakta küçük oturma)
const YAY_W = 24, YAY_Z = 0.62
let kabinX = NaN, kabinV = 0
function kabinYay(hedef, dt) {
  if (!Number.isFinite(kabinX) || Math.abs(hedef - kabinX) > 1.5 || !(dt > 0)) { kabinX = hedef; kabinV = 0; return kabinX }
  for (let r = dt; r > 1e-6; r -= 1 / 120) {
    const h = Math.min(r, 1 / 120)
    kabinV += (YAY_W * YAY_W * (hedef - kabinX) - 2 * YAY_Z * YAY_W * kabinV) * h
    kabinX += kabinV * h
  }
  return kabinX
}
// Kuyu tepesindeki makara (çelik kasnak, dört kollu)
let makaraC = null, makaraAnahtar = ''
function makara(R) {
  const anahtar = R + '|' + oran
  if (makaraC && makaraAnahtar === anahtar) return makaraC
  const s = Math.ceil((R + 2) * 2 * oran)
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  g.scale(oran, oran)
  const m = s / oran / 2
  g.translate(m, m)
  g.fillStyle = '#20262B'
  g.beginPath(); g.arc(0, 0, R + 1.2, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#8D99A3'; g.lineWidth = 1.6
  g.beginPath(); g.arc(0, 0, R - 0.6, 0, Math.PI * 2); g.stroke()
  g.strokeStyle = '#5E6A73'; g.lineWidth = 1.3
  g.beginPath()
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; g.moveTo(0, 0); g.lineTo(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1)) }
  g.stroke()
  g.fillStyle = '#C9D1D8'
  g.beginPath(); g.arc(0, 0, R * 0.28, 0, Math.PI * 2); g.fill()
  makaraC = c
  makaraAnahtar = anahtar
  return c
}
// Cevher akışı: durakta bunkerden kabine, boşaltmada kabinden depo bunkerine
const AKIS_MS = { yukluyor: 55, bosaltiyor: 45 }
let sonAkis = 0
function cevherAkisi(d, a, alt, simdiMs) {
  const aralik = AKIS_MS[a.durum]
  if (!aralik || simdiMs - sonAkis < aralik) return
  sonAkis = simdiMs
  const kod = d.aktifBolge
  const tas = cevherTasi(kod, Math.floor(simdiMs / aralik) % 3)
  const boy = (1.05 + karma(simdiMs) * 0.4) / oran
  const cx = yer.tupX + yer.tupG / 2
  if (a.durum === 'yukluyor' && a.durak >= 0) {
    const sy = yer.satirY(a.durak)
    const x0 = X(D.KAT.bunkerX0 + 6 + karma(simdiMs * 0.13) * 18), y0 = sy + Yk(D.KAT.bunkerUst) - 4
    const hx = cx + (karma(simdiMs * 0.3) - 0.5) * yer.tupG * 0.4
    dunyaP.firlat(x0, y0, hx, alt - yer.KABIN_H * (0.16 + karma(simdiMs * 0.7) * 0.12), 0.3, tas, { boy, g: 520 })
  } else if (a.durum === 'bosaltiyor' && a.yuk > 0) {
    const x0 = cx + (karma(simdiMs * 0.3) - 0.5) * yer.tupG * 0.45
    const hy = yer.yuklemeY + Yy(D.YUKLEME.bunkerUst + 4 + karma(simdiMs * 1.3) * 6)
    dunyaP.firlat(x0, alt - 3, x0 + (karma(simdiMs * 0.9) - 0.5) * X(26), hy, 0.36, tas, { boy, g: 300, kal: 0.2, zemin: hy })
  }
}
function kabinCiz(d, b, alfa, simdiMs, dt) {
  const a = d.calisma.asansor
  const konum = kabinYay(a.onceki + (a.konum - a.onceki) * alfa, dt)
  const alt = konum >= 0 ? yer.kabinAltY(konum) : yer.kabinAltY(0) - konum * yer.SATIR_H * 0.5
  const hareket = Math.min(1, Math.abs(kabinV) / 2)
  const t = simdiMs / 1000
  const ust = yer.satirY(Math.max(0, b.madenler.length - 1)) + Yk(9)
  const tepe = alt - yer.KABIN_H - 1
  const R = Math.max(5, yer.tupG * 0.14 + 0.8)
  const cx = yer.tupX + yer.tupG / 2
  if (tepe > ust) {
    const salinim = (0.25 + hareket * 0.9) * Math.sin(t * 11.7)
    for (const [renk, kal, kay] of [['rgba(14,18,22,.9)', 1.8, 0], ['rgba(205,215,225,.45)', 0.7, -0.4]]) {
      ctx.strokeStyle = renk
      ctx.lineWidth = kal
      ctx.beginPath()
      for (const yon of [-1, 1]) {
        const x = cx + yon * (R - 0.6) + kay
        ctx.moveTo(x, ust)
        ctx.quadraticCurveTo(x + salinim * yon, (ust + tepe) / 2, x, tepe)
      }
      ctx.stroke()
    }
  }
  const kiris = Yk(5)
  ctx.fillStyle = '#2A3036'
  ctx.fillRect(yer.tupX - 3, ust - kiris - R * 0.2, yer.tupG + 6, kiris)
  ctx.fillStyle = 'rgba(201,209,216,.35)'
  ctx.fillRect(yer.tupX - 3, ust - kiris - R * 0.2, yer.tupG + 6, 1)
  const mk = makara(R)
  ctx.save()
  ctx.translate(cx, ust)
  ctx.rotate(alt / R)
  ctx.drawImage(mk, -mk.width / oran / 2, -mk.height / oran / 2, mk.width / oran, mk.height / oran)
  ctx.restore()

  // Kabin: kafes, içinde operatör, tabanda yük
  const kx = yer.tupX, ky = Math.round((alt - yer.KABIN_H) * oran) / oran
  ctx.drawImage(kabinC(), kx, ky, yer.tupG, yer.KABIN_H)
  const operatorSevin = simdiMs < sevinBitis[MAKS_MADEN]
  figur(2, operatorSevin ? 'sevin' : 'bekle', operatorSevin ? Math.floor(simdiMs / 125) % 6 : Math.floor(simdiMs / 420) % 6,
    kx + yer.tupG * 0.36, ky + yer.KABIN_H - 6, a.durum === 'cikiyor' ? -1 : 1, null, 0.74)
  const kap = E.asansorKap(d, b)
  const oranYuk = kap > 0 ? Math.min(1, a.yuk / kap) : 0
  if (oranYuk > 0.01) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(kx + 4, ky + 7, yer.tupG - 8, yer.KABIN_H - 13)
    ctx.clip()
    yiginCiz(yigin(d.aktifBolge, 'kabin', yer.tupG - 6, yer.KABIN_H * 0.42, oranYuk, 61), kx + yer.tupG / 2, ky + yer.KABIN_H - 5.5)
    ctx.restore()
  }
  // Yön ışığı: hareket ederken yeşil, yüklerken sarı yanıp söner
  const hareketli = a.durum === 'iniyor' || a.durum === 'cikiyor'
  const yukler = a.durum === 'yukluyor' || a.durum === 'bosaltiyor'
  if (hareketli || yukler) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = hareketli ? 0.75 : 0.45 + 0.4 * Math.sin(simdiMs / 70)
    ctx.drawImage(al(hareketli ? 'isik.mavi' : 'isik.sicak'), cx - 9, ky - 6, 18, 18)
    ctx.globalAlpha = hareketli ? 0.18 + 0.12 * Math.sin(simdiMs / 110) : 0
    if (hareketli) ctx.drawImage(al('isik.sicak'), kx - 6, ky + yer.KABIN_H * 0.2, yer.tupG + 12, yer.KABIN_H * 0.6)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  cevherAkisi(d, a, alt, simdiMs)
}

function istasyonMerkez(ist, n) {
  const k = yer.istasyonKutusu(ist, n)
  return k ? { x: k.x + k.w / 2, y: k.y + k.h / 2 } : null
}

// Fener ışığı: sıcak hale + aşağı doğru ışık konisi, hafif titreme
function fenerIsigi(isik, koni, x, y, t, tohum) {
  const a = 0.74 + 0.1 * Math.sin(t * 7.3 + tohum * 3.1) + 0.07 * (karma(Math.floor(t * 9) + tohum * 5) - 0.5)
  ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.7
  ctx.drawImage(isik, x - 26, y - 24, 52, 52)
  ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.32
  ctx.drawImage(koni, x - X(26), y + 2, X(52), Yk(60))
}

export const Sahne = {
  async kur({ tuval: t, efektTuval: et, durum, ilerleme }) {
    tuval = t
    efektTuval = et
    durumRef = durum
    kalite = (durum && durum.ayarlar && durum.ayarlar.kalite) || 'yuksek'
    W = Math.round(tuval.clientWidth || 390)
    H = Math.round(tuval.clientHeight || 600)
    yer = yerlesim(W)
    const dpr = (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1
    Varliklar.ayarla({ olcek: Math.min(dpr, 2), dunyaG: W })
    ctx = tuval.getContext('2d', { alpha: false })
    ectx = efektTuval ? efektTuval.getContext('2d') : null
    await Varliklar.hazirla(prosedurelKaydet(), (o) => { try { ilerleme && ilerleme(0.2 + 0.5 * o) } catch {} })
    dunyaP.kalite = efektP.kalite = kalite
    // Açılış perdesi sürerken etkin bölgenin şeritlerini önceden çiz (ilk karede takılma olmasın)
    oran = Math.min(dpr, dpTavan())
    const kod = (durum && durum.aktifBolge) || 'zonguldak'
    const isler = [() => yuklemeSerit(kod), () => kayaSerit(kod, 2, yer.TEPE_H)]
    for (let v = 0; v < D.KAT_DUZEN; v++) isler.push(() => kayaSerit(kod, v, yer.SATIR_H))
    // Açık katların düzen/aşama birleşimleri (en çok 9 şerit)
    const b0 = durum && durum.bolgeler && durum.bolgeler[kod]
    const gerekli = new Set((b0 ? b0.madenler : [{ L: 1 }]).map((m, i) => (i % D.KAT_DUZEN) + '|' + D.katAsamasi(m.L)))
    for (const a of gerekli) { const [v, as] = a.split('|').map(Number); isler.push(() => katSerit(kod, v, as)) }
    for (let i = 0; i < isler.length; i++) {
      isler[i]()
      try { ilerleme && ilerleme(0.7 + 0.3 * (i + 1) / isler.length) } catch {}
      await new Promise((r) => setTimeout(r, 0))
    }
    hazir = true
  },

  boyutla({ gen, yuk, dpr }) {
    if (!tuval) return
    kalite = (durumRef && durumRef.ayarlar && durumRef.ayarlar.kalite) || kalite
    dunyaP.kalite = efektP.kalite = kalite
    W = Math.round(gen); H = Math.round(yuk)
    yer = yerlesim(W)
    Varliklar.genislik(W)
    oran = Math.min(dpr || 1, dpTavan())
    tuval.width = Math.max(1, Math.round(W * oran))
    tuval.height = Math.max(1, Math.round(H * oran))
    if (efektTuval) {
      efW = efektTuval.clientWidth || W
      efH = efektTuval.clientHeight || H
      efOran = oran
      efektTuval.width = Math.max(1, Math.round(efW * efOran))
      efektTuval.height = Math.max(1, Math.round(efH * efOran))
    }
  },

  ciz(durum, gorunum, simdiMs, alfa) {
    if (!ctx || !gorunum.gorunur) return
    durumRef = durum
    const say = globalThis.__cevher && globalThis.__cevher.sayac
    if (say) say.ciz++
    const dt = sonMs ? Math.min(0.1, Math.max(0, (simdiMs - sonMs) / 1000)) : 0
    sonMs = simdiMs
    const t = simdiMs / 1000
    const kod = durum.aktifBolge
    const b = durum.bolgeler[kod]
    const n = b.madenler.length
    const y = yer
    const ky = gorunum.kaydirY
    sonKaydir = Math.round(ky * oran) / oran
    const ust = ky - 40, alt = ky + H + 40
    ctx.setTransform(oran, 0, 0, oran, 0, -Math.round(ky * oran))
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Dünya dışı (kaydırma lastiği)
    if (ust < 0) { ctx.fillStyle = '#041A2A'; ctx.fillRect(0, ust, W, -ust) }
    if (alt > y.DUNYA_H) { ctx.fillStyle = '#041A2A'; ctx.fillRect(0, y.DUNYA_H, W, alt - y.DUNYA_H) }
    if (ust < y.TEPE_H) ctx.drawImage(kayaSerit(kod, 2, y.TEPE_H), 0, 0, W, y.TEPE_H)
    yetAktif.clear()
    for (const yo of b.yoneticiler) if (yo.atanan && durum.zaman < yo.aktifBitis) yetAktif.add(yo.atanan)

    // 1. Kat şeritleri, yığınlar, hazine (işçilerin arkasında)
    let ilk = MAKS_MADEN, son = -1
    for (let i = 0; i < MAKS_MADEN; i++) {
      const sy = y.satirY(i)
      if (sy + y.SATIR_H < ust || sy > alt) continue
      if (i < ilk) ilk = i
      if (i > son) son = i
      const syP = Math.round(sy * oran) / oran
      if (i < n) {
        ctx.drawImage(katSerit(kod, i % D.KAT_DUZEN, D.katAsamasi(b.madenler[i].L)), 0, syP, W, y.SATIR_H)
        const kap = E.yiginKap(durum, b, i)
        const doluluk = kap > 0 ? Math.min(1, b.madenler[i].yigin / kap) : 0
        yiginCiz(yigin(kod, 'bunker', X(D.KAT.bunkerX1 - D.KAT.bunkerX0 - 2), Yk(20), doluluk, 17 + i % 3), X((D.KAT.bunkerX0 + D.KAT.bunkerX1) / 2), sy + Yk(D.KAT.bunkerUst) + 1)
      } else if (i === n) {
        ctx.drawImage(kayaSerit(kod, i % D.KAT_DUZEN, y.SATIR_H), 0, syP, W, y.SATIR_H)
        ctx.drawImage(al('kilit.ust'), 0, syP, W, y.SATIR_H)
      } else {
        ctx.drawImage(kayaSerit(kod, i % D.KAT_DUZEN, y.SATIR_H), 0, syP, W, y.SATIR_H)
        ctx.fillStyle = 'rgba(4,10,14,.35)'
        ctx.fillRect(0, syP, W, y.SATIR_H)
      }
    }
    hazineCiz(durum, ust, alt, simdiMs)
    // 2. İşçiler
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      const sy = y.satirY(i)
      const kb = kaziBas[i]
      if (kb && simdiMs - kb < KAZI_MS) {
        // Yeni kat: kaya dağılırken işçiler henüz yok
        const o = 1 - (simdiMs - kb) / KAZI_MS
        ctx.globalAlpha = o
        ctx.drawImage(kayaSerit(kod, i % D.KAT_DUZEN, y.SATIR_H), 0, sy, W, y.SATIR_H)
        ctx.drawImage(al('kilit.ust'), 0, sy, W, y.SATIR_H)
        ctx.globalAlpha = 1
        if (karma(simdiMs * 0.01 + i) < 0.35) dunyaP.patlat(y.odaX + y.odaG * karma(simdiMs + i * 3), sy + y.ODA_UST + 10 + 50 * karma(simdiMs * 1.7), 'toz', 2)
        continue
      }
      if (i % D.KAT_DUZEN === 1) kanarya(sy, t, i)
      katIscileri(durum, b, i, sy, dt, katTempo(b, i, yetAktif.has('m' + i)), simdiMs)
      const c = durum.calisma.madenler[i]
      if (c && c.dolu) ctx.drawImage(al('dolu.etiket'), X(D.KAT.bunkerX0) - 2, sy + Yk(D.KAT.bunkerUst) - Yk(30), 30, 12)
    }
    // 3. Yükleme katı
    const yuklemeGorunur = y.yuklemeY < alt && y.yuklemeY + y.YUKLEME_H > ust
    if (yuklemeGorunur) {
      const yy = Math.round(y.yuklemeY * oran) / oran
      ctx.drawImage(yuklemeSerit(kod), 0, yy, W, y.YUKLEME_H)
      kamyonCiz(kod)
      const dk = E.depoKap(durum, b)
      yiginCiz(yigin(kod, 'depo', X(D.YUKLEME.bunkerX1 - D.YUKLEME.bunkerX0 - 4), Yy(26), dk > 0 ? Math.min(1, b.depo.stok / dk) : 0, 29),
        X((D.YUKLEME.bunkerX0 + D.YUKLEME.bunkerX1) / 2), y.yuklemeY + Yy(D.YUKLEME.bunkerUst) + 1)
      yuklemeIscileri(durum, alfa || 0, simdiMs, dt)
    }
    // 4. Kabin
    if (n > 0) kabinCiz(durum, b, alfa || 0, simdiMs, dt)

    // 5. Işıklar
    ctx.globalCompositeOperation = 'lighter'
    const isik = al('isik.sicak'), koni = al('isik.koni')
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      const sy = y.satirY(i)
      for (let f = 0; f < 2; f++) {
        const [fx, fy] = D.KAT.fener[f]
        fenerIsigi(isik, koni, X(fx), sy + Yk(fy) + 2, t, i * 2 + f)
      }
    }
    if (kalite !== 'pil') {
      // Fener ışığında süzülen toz zerreleri
      for (let i = ilk; i <= Math.min(son, n - 1); i++) {
        const sy = y.satirY(i)
        for (let f = 0; f < 2; f++) {
          const [fx, fy] = D.KAT.fener[f]
          const bx = X(fx), by = sy + Yk(fy) + 14
          for (let q = 0; q < 3; q++) {
            const ph = karma(i * 17 + f * 5 + q) * 6.283
            const mx = bx + Math.sin(t * (0.31 + q * 0.11) + ph) * 15
            const my = by + 4 + q * 9 + Math.sin(t * (0.47 + q * 0.07) + ph * 1.7) * 6
            const sn = Math.sin(t * 1.1 + ph * 2)
            ctx.globalAlpha = 0.25 + 0.5 * sn * sn
            ctx.drawImage(isik, mx - 2.5, my - 2.5, 5, 5)
          }
        }
      }
    }
    // Yeteneği aktif katlar sıcak bir ışıkla nabız atar; aktif asansör kuyusu da parlar
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      if (!yetAktif.has('m' + i)) continue
      const sy = y.satirY(i)
      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * 5.2 + i)
      ctx.drawImage(isik, y.odaX + y.odaG * 0.05, sy - y.SATIR_H * 0.05, y.odaG * 0.9, y.SATIR_H * 1.05)
    }
    if (yetAktif.has('asansor') && n > 0) {
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 6.3)
      const ka = y.kabinAltY(kabinX)
      ctx.drawImage(isik, y.tupX - y.tupG * 0.6, ka - y.KABIN_H * 1.3, y.tupG * 2.2, y.KABIN_H * 1.6)
    }
    if (yuklemeGorunur) {
      for (const [fx, fy] of D.YUKLEME.fener) fenerIsigi(isik, koni, X(fx), y.yuklemeY + Yy(fy) + 2, t, fx)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    // 6. Satış sayıları (kamyonun üstünde)
    if (satisToplam > 0 && simdiMs - satisSon >= SATIS_TOPLA_MS) {
      satisSira = (satisSira + 1) % 3
      const sx = X(D.YUKLEME.satisX - 10) + (satisSira - 1) * 22, sy = y.yuklemeY + Yy(40)
      dunyaP.sayi(sx, sy - 14 - (satisSira % 2) * 6, '+' + bicim(satisToplam))
      dunyaP.patlat(sx, sy, 'sikke', 4)
      satisToplam = 0
      satisSon = simdiMs
    }
    dunyaP.guncelle(dt)
    dunyaP.ciz(ctx)
  },

  olaylar(liste, durum) {
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const simdi = performance.now()
    for (let k2 = 0; k2 < liste.length; k2++) {
      const o = liste[k2]
      switch (o.tip) {
        case 'madenAcildi':
          kaziBas[o.i] = simdi
          break
        case 'yukseltildi': {
          // İşçiler sevinir; her yükseltmede küçük pırıltı, kademe geçişinde büyük patlama
          const ist = o.istasyon
          if (ist === 'asansor') sevinBitis[MAKS_MADEN] = simdi + 800
          else if (ist !== 'depo') sevinBitis[+ist.slice(1)] = simdi + 800
          const m = istasyonMerkez(ist, n)
          if (!m) break
          if (o.kademeler && o.kademeler.length) {
            dunyaP.patlat(m.x, m.y, 'parilti', 14, { yaricap: 36 })
            dunyaP.patlat(m.x, m.y + 10, 'kivilcim', 8)
          } else if (simdi - sonYukseltmeEfekt > 120) {
            sonYukseltmeEfekt = simdi
            dunyaP.patlat(m.x, m.y, 'parilti', 3, { yaricap: 26 })
          }
          break
        }
        case 'yetenek': {
          const m = istasyonMerkez(o.istasyon, n)
          if (m) dunyaP.patlat(m.x, m.y, 'parilti', 12, { yaricap: 34 })
          break
        }
        case 'bosaltildi':
          dunyaP.patlat(X((D.YUKLEME.bunkerX0 + D.YUKLEME.bunkerX1) / 2), yer.yuklemeY + Yy(D.YUKLEME.bunkerUst), 'toz', 3)
          break
        case 'asansorDurak':
          dunyaP.patlat(yer.tupX, yer.satirY(o.kat) + yer.ZEMIN_Y - 4, 'toz', 2)
          break
        case 'satis':
          if (!satisToplam) satisSon = Math.max(satisSon, simdi - SATIS_TOPLA_MS + 120)
          satisToplam += o.para
          break
        case 'seviyeAtladi':
          this.efekt.patlat(efW / 2, -10, 'konfeti', 60, { genislik: efW })
          break
        case 'hazineCikti': {
          const h = durum.calisma.hazine
          if (h) { const p = hazineNokta(h); dunyaP.patlat(p.x, p.y, 'parilti', 8, { yaricap: 22 }); dunyaP.patlat(p.x, p.y + 4, 'toz', 3) }
          break
        }
        case 'hazineAlindi': {
          const p = hazineNokta(o)
          dunyaP.patlat(p.x, p.y, 'parilti', 14, { yaricap: 30 })
          dunyaP.patlat(p.x, p.y, o.tur === 'elmas' ? 'parca' : 'sikke', 8, { zemin: yer.satirY(o.kat) + yer.ZEMIN_Y })
          dunyaP.sayi(p.x, p.y - 18, o.tur === 'elmas' ? '+' + o.elmas + ' elmas' : '+' + bicim(o.para))
          if (o.kat < MAKS_MADEN) sevinBitis[o.kat] = simdi + 700
          break
        }
        case 'hazineKayboldu': {
          const p = hazineNokta({ kat: o.kat, yer: sonHazineYer })
          dunyaP.patlat(p.x, p.y, 'toz', 4)
          break
        }
        case 'bolgeDegisti':
        case 'prestijYapildi':
          faz.fill(0)
          sonVurus.fill(-1)
          bostaSure.fill(0)
          break
      }
    }
  },

  // Dünya koordinatı → istasyon. Kartlar ve düğmeler DOM'da.
  isabet(x, y, durum) {
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const ic = (k) => k && x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h
    const h = durum.calisma && durum.calisma.hazine
    if (h && h.kat < n) {
      const p = hazineNokta(h)
      if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) <= HAZINE_R * HAZINE_R) return { hazine: true }
    }
    if (ic(yer.istasyonKutusu('asansor', n))) return { istasyon: 'asansor' }
    if (ic(yer.istasyonKutusu('depo', n))) return { istasyon: 'depo' }
    for (let i = 0; i < n; i++) if (ic(yer.istasyonKutusu('m' + i, n))) return { istasyon: 'm' + i }
    if (y >= yer.yuklemeY && y < yer.yuklemeY + yer.YUKLEME_H) return { istasyon: 'depo' }
    return null
  },

  // 'm3' | 'asansor' | 'depo' | 'satis' → #oyun koordinatı { x, y, w, h, sol, ust }
  ekranKonumu(capa, durum) {
    if (!tuval) return null
    const d = durum || durumRef
    const b = d.bolgeler[d.aktifBolge]
    const n = b.madenler.length
    let k
    if (capa === 'asansor') {
      const alt = yer.kabinAltY(d.calisma.asansor.konum)
      k = { x: yer.tupX - 6, y: alt - yer.KABIN_H, w: yer.tupG + 12, h: yer.KABIN_H }
    } else k = yer.istasyonKutusu(capa, n)
    if (!k) return null
    const kok = tuval.closest('#oyun') || tuval.parentElement
    const tr = tuval.getBoundingClientRect(), kr = kok.getBoundingClientRect()
    const ox = tr.left - kr.left, oy = tr.top - kr.top - sonKaydir
    return { x: ox + k.x + k.w / 2, y: oy + k.y + k.h / 2, w: k.w, h: k.h, sol: ox + k.x, ust: oy + k.y }
  },

  // Hazine damarının #oyun koordinatı ({kat, yer}; verilmezse etkin damar). Görünüm dışındaysa da döner.
  hazineKonumu(h) {
    if (!tuval) return null
    const hz = h || (durumRef && durumRef.calisma && durumRef.calisma.hazine)
    if (!hz) return null
    const p = hazineNokta(hz)
    const kok = tuval.closest('#oyun') || tuval.parentElement
    const tr = tuval.getBoundingClientRect(), kr = kok.getBoundingClientRect()
    return { x: tr.left - kr.left + p.x, y: tr.top - kr.top - sonKaydir + p.y, dunyaY: p.y }
  },

  bolgeRozeti(kod, canvas) {
    const dpr = Math.min((typeof devicePixelRatio === 'number' && devicePixelRatio) || 1, 2)
    const s = canvas.clientWidth || 56
    canvas.width = Math.round(s * dpr)
    canvas.height = Math.round(s * dpr)
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    rozetCiz(c, s)
  },

  portre(tohum, nadirlik, canvas, boyut) {
    const dpr = Math.min((typeof devicePixelRatio === 'number' && devicePixelRatio) || 1, 2)
    const s = boyut || canvas.clientWidth || 64
    canvas.width = Math.round(s * dpr)
    canvas.height = Math.round(s * dpr)
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    portreCiz(c, tohum, nadirlik, s)
  },

  efekt: {
    son: 0,
    patlat(x, y, tur, adet, sec) {
      if (tur === 'sayi') efektP.sayi(x, y, sec && sec.metin ? sec.metin : '')
      else efektP.patlat(x, y, tur, adet, sec)
      efektCanli = true
    },
    kare(simdiMs) {
      if (!ectx || !efektCanli) { this.son = simdiMs; return }
      const dt = this.son ? Math.min(0.1, Math.max(0, (simdiMs - this.son) / 1000)) : 1 / 60
      this.son = simdiMs
      ectx.setTransform(efOran, 0, 0, efOran, 0, 0)
      ectx.clearRect(0, 0, efW, efH)
      efektP.guncelle(dt)
      efektP.ciz(ectx)
      if (!efektP.canli) {
        ectx.clearRect(0, 0, efW, efH)
        efektCanli = false
      }
    },
  },

  // Sahne içi olayların sesi (ana.js bağlar): ör. kamyon kornası
  sesCal: null,

  bellek() { return Varliklar.bellek() + K.figurBellek() },
  get hazir() { return hazir },
}
