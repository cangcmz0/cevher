// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Sahne (Paket B, §6.5, görsel yön 2): maden görünümünü referans2 dokularıyla çizer.
// Dokular docs/referans2.webp'den birebir kesilmiştir (img/ref/*.png): kat şeritleri, yükleme katı,
// tepe taş şeridi, kuyu dilimi, sarı oklu kabin ve yeşil oklu tüp. Üstüne kare başına efektler:
// fener ışıkları, kıvılcım, toz, hareket eden kabin, dolu yığınlar için yeşil tüp, satış sayıları.
// Kare başına yalnız drawImage ve birkaç dönüşüm; shadowBlur, filter, getImageData yok.

import { Varliklar } from './varliklar.js'
import { portreCiz } from './madenci.js'
import { rozetCiz } from './yuzey.js'
import { Havuz, parcacikSpritelari } from './parcacik.js'
import { karma, dikey, yuvarlakYol, kalas, rastgele, cizgi, rgba } from './cizim.js'
import { yerlesim, MAKS_MADEN } from '../yerlesim.js'
import * as E from '../ekonomi.js'
import { BOLGE as A_BOLGE } from '../ayar.js'
import { bicim } from '../bicim.js'

const DPR_TAVAN = { yuksek: 2, dengeli: 1.5, pil: 1.25 }
const KAZI_MS = 1600
const SATIS_TOPLA_MS = 450
const KOK = new URL('../../img/ref/', import.meta.url).href

// Referans dokuları: anahtar → [dosya, genişlik, yükseklik] (referans px)
const DOKU = {
  'ref.kat.0': ['kat-a.png', 367, 107],
  'ref.kat.1': ['kat-b.png', 367, 107],
  'ref.yukleme': ['yukleme.png', 367, 107],
  'ref.tepe': ['tepe.png', 367, 16],
  'ref.kabin': ['kabin-sari.png', 47, 82],
  'ref.tup': ['tup-yesil.png', 47, 74],
  'ref.kuyu': ['kuyu-dilim.png', 78, 38],
}
// Kat şeritlerindeki boyalı ayrıntıların yerleri (referans px, şeridin sol üstüne göre)
const FENER = [[[142, 6], [221, 6]], [[143, 15], [218, 6]]]
const KIVILCIM = [[[145, 52, -1], [245, 42, 1]], [[132, 58, -1], [227, 50, 1]]]
const DOLU = [[155, 26], [163, 30]]
const SATIS_NOKTA = [145, 40]

let tuval = null, ctx = null, efektTuval = null, ectx = null
let W = 390, H = 600, oran = 2, efOran = 2, efW = 390, efH = 844
let yer = yerlesim(390)
let durumRef = null
let hazir = false
let sonMs = 0
let sonKaydir = 0
const kaziBas = new Float64Array(MAKS_MADEN)
const sonVurus = new Int32Array(MAKS_MADEN * 2).fill(-1)
let satisToplam = 0, satisSon = 0, satisSira = 0, sonYukseltmeEfekt = 0
const dunyaP = new Havuz(256)
const efektP = new Havuz(256)
let efektCanli = false
let kalite = 'yuksek'

const al = (a) => Varliklar.al(a)
const yetAktif = new Set()

// ── Bölge cevheri: kat görsellerindeki kömür yığınları bölgenin cevherine boyanır ──
// Yığın elipsleri kesim pikselleriyle (cx, cy, rx, ry); tonlar bölge başına bir kez hazırlanır.
const YIGIN = {
  'ref.kat.0': [[172, 40, 25, 10], [221, 44, 22, 7.5]],
  'ref.kat.1': [[187.5, 43, 26, 9.5], [225, 45.5, 10, 6]],
  'ref.yukleme': [[195, 47.5, 24, 7.5]],
}
// [birleştirme, renk, saydamlık] adımları
const CEVHER_TON = {
  eregli: [['color', [168, 74, 44], 0.92], ['screen', [60, 22, 10], 0.9]],
  karabuk: [['screen', [128, 122, 110], 1], ['color', [170, 162, 146], 0.55]],
  kastamonu: [['color', [214, 116, 48], 0.95], ['screen', [80, 40, 12], 0.9]],
}
const tonlu = new Map()
function doku(a, kod) {
  const tonlar = CEVHER_TON[kod]
  if (!tonlar || !YIGIN[a] || !Varliklar.ozelMi(a)) return al(a)
  const anahtar = a + '|' + kod
  const hazir = tonlu.get(anahtar)
  if (hazir) return hazir
  const kaynak = al(a)
  const c = document.createElement('canvas')
  c.width = kaynak.naturalWidth || kaynak.width
  c.height = kaynak.naturalHeight || kaynak.height
  const g = c.getContext('2d')
  g.drawImage(kaynak, 0, 0)
  for (const e of YIGIN[a]) {
    for (const [op, [r, gg, bb], al_] of tonlar) {
      g.save()
      g.translate(e[0], e[1])
      g.scale(e[2], e[3])
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1)
      gr.addColorStop(0, `rgba(${r},${gg},${bb},1)`)
      gr.addColorStop(0.72, `rgba(${r},${gg},${bb},1)`)
      gr.addColorStop(1, `rgba(${r},${gg},${bb},0)`)
      g.globalCompositeOperation = op
      g.globalAlpha = al_
      g.fillStyle = gr
      g.beginPath()
      g.arc(0, 0, 1, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
  }
  tonlu.set(anahtar, c)
  return c
}
const dpTavan = () => DPR_TAVAN[kalite] || 2

// ── Canlı madenciler ──
// Kat görselindeki boyalı madenciler yumuşak kenarlı parça olarak kesilir ve ayak hizasından oynatılır.
// r: parça [x, y, w, h] (kesim pikseli), p: dönme noktası (ayaklar), yon: baktığı yön (+1 sağ, -1 sol)
// tur: kaz (kazma vuruşu, kıvılcımla eş zamanlı) | it (araba itme/çekme)
const KUKLA = {
  'ref.kat.0': [{ r: [106, 14, 46, 64], p: [129, 73], yon: 1, tur: 'it' }, { r: [220, 8, 54, 70], p: [252, 73], yon: -1, tur: 'kaz' }],
  'ref.kat.1': [{ r: [126, 24, 44, 58], p: [147, 77], yon: 1, tur: 'kaz' }, { r: [206, 16, 56, 66], p: [234, 77], yon: -1, tur: 'it' }],
}
// Kazma döngüsü (0,6 s): p = 0 vuruş anı (kıvılcım), sonra toparlanma, geri çekilme ve hızlı iniş
const KAZ_ACI = [[0, 7], [0.12, 4], [0.35, 0], [0.82, -6], [1, 7]]
const KAZ_OLCEK = [[0, 0.95], [0.2, 1], [0.82, 1.035], [1, 0.95]]
function anahtarKare(l, p) {
  for (let i = 1; i < l.length; i++) {
    if (p <= l[i][0]) { const [p0, v0] = l[i - 1], [p1, v1] = l[i]; return v0 + (v1 - v0) * (p - p0) / (p1 - p0) }
  }
  return l[l.length - 1][1]
}
const kesir = (x) => x - Math.floor(x)
const kukla = new Map()
let kuklaAnahtar = ''
const KUKLA_KARE = 10
// Hareketin k. pozu (kesim pikseli cinsinden kayma, derece, dikey ölçek)
function kuklaPoz(kk, k, tur) {
  const p = k / KUKLA_KARE
  if (tur === 'nefes') {
    // Dinlenme: göğüs kalkıp iner, gövde hafifçe sallanır
    const q = p * Math.PI * 2
    return { dx: 0, dy: 0, aci: 0.9 * Math.sin(q + 1.1) * kk.yon, olcek: 1 + 0.018 * Math.sin(q) }
  }
  if (kk.tur === 'kaz') return { dx: 0, dy: 0, aci: anahtarKare(KAZ_ACI, p) * kk.yon, olcek: anahtarKare(KAZ_OLCEK, p) }
  const q = p * Math.PI * 2
  return { dx: 2.6 * Math.sin(q) * kk.yon, dy: -0.9 * Math.abs(Math.cos(q)), aci: 2.4 * Math.sin(q + 0.6) * kk.yon, olcek: 1 }
}
// Pozlar ekran çözünürlüğünde bir kez hazırlanır (döndürme dahil); her karede yalnız piksel hizalı kopya çizilir
function kuklaKareleri(a, kod, m, tur) {
  // Önbellek yalnız aktif bölge ve ekran boyutu için tutulur (bölge/boyut değişince boşalır)
  const genel = kod + '|' + W + '|' + oran
  if (genel !== kuklaAnahtar) { kukla.clear(); kuklaAnahtar = genel }
  const anahtar = a + '|' + m + '|' + tur
  const hazir = kukla.get(anahtar)
  if (hazir) return hazir
  if (!Varliklar.ozelMi(a)) return null
  const kk = KUKLA[a][m]
  const [x, y0, w, h] = kk.r, [px, py] = kk.p
  const sx = yer.k * oran, sy = (yer.SATIR_H / 107) * oran
  const cw = Math.ceil(w * sx), ch = Math.ceil(h * sy)
  // Yumuşak kenarlı parça (kenarlar ~4 referans px'te saydamlaşır, kıpırdayınca zemine dikişsiz karışır)
  const parca = document.createElement('canvas')
  parca.width = cw
  parca.height = ch
  const g = parca.getContext('2d')
  g.imageSmoothingQuality = 'high'
  g.drawImage(doku(a, kod), x, y0, w, h, 0, 0, cw, ch)
  try {
    const v = g.getImageData(0, 0, cw, ch), dd = v.data, f = 4 * sx
    for (let yy = 0; yy < ch; yy++) {
      for (let xx = 0; xx < cw; xx++) {
        const e = Math.min(xx + 0.5, cw - xx - 0.5, yy + 0.5, ch - yy - 0.5)
        if (e < f) dd[(yy * cw + xx) * 4 + 3] *= e / f
      }
    }
    g.putImageData(v, 0, 0)
  } catch { /* okunamayan tuval: yumuşatmasız kalır */ }
  const pad = Math.ceil(0.14 * Math.max(cw, ch)) + 6
  const pvx = (px - x) * sx, pvy = (py - y0) * sy
  const kareler = []
  for (let k = 0; k < KUKLA_KARE; k++) {
    const pz = kuklaPoz(kk, k, tur)
    const c = document.createElement('canvas')
    c.width = cw + pad * 2
    c.height = ch + pad * 2
    const gk = c.getContext('2d')
    gk.imageSmoothingQuality = 'high'
    gk.translate(pad + pvx + pz.dx * sx, pad + pvy + pz.dy * sy)
    gk.rotate(pz.aci * Math.PI / 180)
    gk.scale(1, pz.olcek)
    gk.drawImage(parca, -pvx, -pvy)
    kareler.push(c)
  }
  // ox, oy: dönme noktasından karenin sol üstüne (cihaz pikseli)
  const sonuc = { kareler, ox: pad + pvx, oy: pad + pvy }
  kukla.set(anahtar, sonuc)
  return sonuc
}
// Kat temposu: seviye yükseldikçe kazma hızlanır, yönetici yeteneği (Hızlı Kazı) aktifken belirgin hızlanır
const kuklaFaz = new Float64Array(MAKS_MADEN * 2)
const PERIYOT = { kaz: 0.6, it: 1.1 }
function katTempo(b, i, aktif) {
  const L = (b.madenler[i] && b.madenler[i].L) || 1
  return Math.min(1.7, 0.85 + 0.09 * Math.log2(L)) * (aktif ? 1.55 : 1)
}
// Çalışan katta kazma/itme; boşta ya da yığın doluyken madenciler dinlenir (nefes pozu)
function kuklalariCiz(durum, i, v, sy, t, dt, tempo) {
  const a = 'ref.kat.' + v
  const c = durum.calisma.madenler[i]
  const calisir = !!(c && c.calisiyor && !c.dolu)
  const sx = yer.k, syy = yer.SATIR_H / 107
  for (let m = 0; m < 2; m++) {
    const kk = KUKLA[a][m]
    const tur = calisir ? kk.tur : 'nefes'
    const k = kuklaKareleri(a, durum.aktifBolge, m, tur)
    if (!k) continue
    const j = i * 2 + m
    let p
    if (calisir) {
      kuklaFaz[j] += (dt * tempo) / PERIYOT[kk.tur]
      p = kesir(kuklaFaz[j])
    } else p = kesir((t + karma(i * 5 + m * 11) * 3) / 2.6)
    const kare = k.kareler[Math.min(KUKLA_KARE - 1, Math.floor(p * KUKLA_KARE))]
    // Piksel hizalı 1:1 kopya: yeniden örnekleme yok
    const dx = Math.round(kk.p[0] * sx * oran - k.ox) / oran
    const dy = Math.round((sy + kk.p[1] * syy - sonKaydir) * oran - k.oy) / oran + sonKaydir
    ctx.drawImage(kare, dx, dy, kare.width / oran, kare.height / oran)
  }
}

// ── Hareketli dokular: görselden silüetiyle kesilen parçalar (bölge cevherine boyalı), ekran çözünürlüğünde ──
// Maden vagonu (kat görselindeki dolu araba), kesim pikseli çokgeni; boş hali tepedeki yığın olmadan
const VAGON = {
  a: 'ref.kat.0', kutu: [146, 30, 54, 44],
  dolu: [[157, 41], [163, 35], [169, 31], [177, 31], [185, 33], [191, 38], [197, 43], [199, 44], [199, 49], [196, 65], [195, 72],
    [183, 72], [183, 66], [165, 66], [165, 72], [154, 72], [152, 65], [147, 49], [147, 44]],
  bos: [[147, 44], [199, 44], [199, 49], [196, 65], [195, 72], [183, 72], [183, 66], [165, 66], [165, 72], [154, 72], [152, 65], [147, 49]],
  // kabindeki yük için tepe yığını (çokgen ve kutu)
  yigin: [[152, 45], [157, 41], [163, 35], [169, 31], [177, 31], [185, 33], [191, 38], [197, 43], [199, 45]],
  yiginKutu: [152, 30, 47, 15],
}
const kesik = new Map()
let kesikAnahtar = ''
function kesikParca(ad, kod, poli, kutu, olcek) {
  const genel = kod + '|' + W + '|' + oran
  if (genel !== kesikAnahtar) { kesik.clear(); kesikAnahtar = genel }
  const hazir = kesik.get(ad)
  if (hazir) return hazir
  if (!Varliklar.ozelMi(VAGON.a)) return null
  const [x, y, w, h] = kutu
  const s = yer.k * oran * olcek
  const c = document.createElement('canvas')
  c.width = Math.ceil(w * s)
  c.height = Math.ceil(h * s)
  const g = c.getContext('2d')
  g.imageSmoothingQuality = 'high'
  if (poli) {
    g.beginPath()
    poli.forEach(([px, py], i) => (i ? g.lineTo((px - x) * s, (py - y) * s) : g.moveTo((px - x) * s, (py - y) * s)))
    g.closePath()
    g.clip()
  }
  g.drawImage(doku(VAGON.a, kod), x, y, w, h, 0, 0, c.width, c.height)
  kesik.set(ad, c)
  return c
}

// Taşıyıcılar: maden vagonları yükleme katında depodan satış noktasına (trene) dolu gider, boş döner
const DEPO_KAPI = 300, SATIS_X = 196, TAS_ZEMIN = 102   // yükleme kesim pikseli (vagon tabanı)
const VAGON_OLCEK = 0.82
// Vagon evreleri: depoda yüklenirken yığından taş düşer; satışta vagon kamyonun kasasına devrilir
const DEVIR = 0.45     // satış evresinde boşalmanın olduğu an (evre oranı)
const devrildi = new Uint8Array(64)
const yuklemeSon = new Float64Array(64)
function tasiyicilariCiz(d, alfa, t, simdiMs) {
  const tl = d.calisma.tasiyicilar
  const kod = d.aktifBolge
  const dolu = kesikParca('vagon.dolu', kod, VAGON.dolu, VAGON.kutu, VAGON_OLCEK)
  const bos = kesikParca('vagon.bos', kod, VAGON.bos, VAGON.kutu, VAGON_OLCEK)
  if (!dolu || !bos) return
  const k = yer.k, ky = yer.YUKLEME_H / 107
  const zemin = yer.yuklemeY + TAS_ZEMIN * ky
  const vw = dolu.width / oran, vh = dolu.height / oran
  let bosta = false
  for (let j = 0; j < tl.length; j++) {
    const ta = tl[j]
    const bekliyor = ta.durum === 'bekle'
    if (bekliyor) { if (bosta) continue; bosta = true }
    const konum = ta.oncekiKonum + (ta.konum - ta.oncekiKonum) * alfa
    // Evre bu adımda değiştiyse (onceki > t) ara değer önceki evreye ait: doğrudan t kullanılır
    const tt = ta.onceki <= ta.t ? ta.onceki + (ta.t - ta.onceki) * alfa : ta.t
    const evre = ta.sure > 0 ? Math.min(1, Math.max(0, tt / ta.sure)) : 0
    const satiyor = ta.durum === 'satiyor'
    const yuklu = ta.durum === 'yukluyor' || ta.durum === 'gidiyor' || (satiyor && evre < DEVIR)
    const yuruyor = ta.durum === 'gidiyor' || ta.durum === 'donuyor'
    // Aynı anda yoldaki vagonlar üst üste binmesin: hafif sıra kayması
    const x = (DEPO_KAPI + (SATIS_X - DEPO_KAPI) * konum) * k + (j % 3) * 5 - vw / 2
    const sars = yuruyor ? Math.abs(Math.sin(t * 18 + j * 2.1)) * 0.9 : 0    // ray sarsıntısı
    const y = zemin - vh - sars - (j % 2) * 1.5
    const img = yuklu ? dolu : bos
    const px = Math.round(x * oran) / oran, py = Math.round((y - sonKaydir) * oran) / oran + sonKaydir
    if (satiyor) {
      // Sol alt köşe üstünde öne devrilir (yarım sinüs), boşalma anında taşlar kasaya uçar
      const aci = -Math.sin(Math.min(1, evre / 0.9) * Math.PI) * 0.42
      ctx.save()
      ctx.translate(px + vw * 0.1, py + vh)
      ctx.rotate(aci)
      ctx.drawImage(img, -vw * 0.1, -vh, vw, vh)
      ctx.restore()
      if (evre >= DEVIR && !devrildi[j]) {
        devrildi[j] = 1
        for (let q = 0; q < 6; q++) {
          const tas = cevherTasi(kod, q % 3)
          dunyaP.firlat(px + vw * (0.25 + 0.1 * q), py + vh * 0.15, (172 + q * 6 + karma(simdiMs + q) * 8) * k,
            yer.yuklemeY + 50 * ky, 0.32 + q * 0.025, tas, { boy: (1 + karma(q * 7 + simdiMs) * 0.4) / oran, g: 380 })
        }
        dunyaP.patlat(px + vw * 0.3, py + vh * 0.2, 'toz', 2)
      }
    } else {
      if (devrildi[j]) devrildi[j] = 0
      ctx.drawImage(img, px, py, vw, vh)
      // Depoda yüklenirken yığından vagona taş düşer
      if (ta.durum === 'yukluyor' && simdiMs - yuklemeSon[j] > 70) {
        yuklemeSon[j] = simdiMs
        const tas = cevherTasi(kod, Math.floor(simdiMs / 70) % 3)
        const hx = px + vw * (0.3 + karma(simdiMs * 0.7) * 0.4)
        dunyaP.firlat((DEPO_KAPI + 18 + karma(simdiMs) * 20) * k, yer.yuklemeY + 66 * ky, hx, py + vh * 0.12, 0.28, tas,
          { boy: (1 + karma(simdiMs * 1.9) * 0.4) / oran, g: 520 })
      }
    }
  }
}

// Kamyon egzozu: taşıma sürerken lokomotifin tepesinden ara ara duman çıkar
let sonDuman = 0
function egzoz(d, simdiMs) {
  const tl = d.calisma.tasiyicilar
  let isler = false
  for (let j = 0; j < tl.length; j++) if (tl[j].durum !== 'bekle') { isler = true; break }
  const aralik = isler ? 520 : 1700
  if (simdiMs - sonDuman < aralik) return
  sonDuman = simdiMs
  const ky = yer.YUKLEME_H / 107
  dunyaP.patlat(122 * yer.k, yer.yuklemeY + 52 * ky, 'duman', isler ? 2 : 1)
}

// Bant: çalışan katta cevher parçaları banttan asansöre akar (kesim pikseli: x0, x1, y)
const BANT = [[166, 268, 95], [166, 262, 98]]
const tasCache = new Map()
function cevherTasi(kod, n) {
  const anahtar = kod + '|' + n + '|' + oran
  let c = tasCache.get(anahtar)
  if (c) return c
  const bb = A_BOLGE[kod] || A_BOLGE.zonguldak
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
  g.fillStyle = bb.renk
  g.fill()
  g.strokeStyle = 'rgba(0,0,0,.55)'
  g.lineWidth = 0.7
  g.stroke()
  g.fillStyle = bb.vurgu
  g.globalAlpha = 0.8
  g.fillRect(2.6, 1.6, 2.2, 1.2)
  tasCache.set(anahtar, c)
  return c
}
// Bant: çalışan katta cevher parçaları banttan asansöre akar; yığın doluysa bant durur, taşlar bekler
const bantFaz = new Float64Array(MAKS_MADEN)
function bantCiz(d, i, v, sy, t, dt, tempo) {
  const c = d.calisma.madenler[i]
  const m = d.bolgeler[d.aktifBolge].madenler[i]
  const akar = !!(c && c.calisiyor && !c.dolu)
  if (!akar && !(m && m.yigin > 0)) return
  const [x0, x1, by] = BANT[v]
  const k = yer.k, syy = yer.SATIR_H / 107
  const aralik = 17
  if (akar) bantFaz[i] = (bantFaz[i] + dt * 26 * tempo) % (aralik * 60)
  const kayma = (bantFaz[i] + karma(i * 3) * aralik) % aralik
  for (let x = x0 + kayma, n = 0; x < x1; x += aralik, n++) {
    const tas = cevherTasi(d.aktifBolge, (n + i) % 3)
    const w = tas.width / oran, h = tas.height / oran
    const yy = sy + by * syy - h + (akar ? Math.sin(x * 0.9 + t * 9) * 0.3 : 0)
    ctx.drawImage(tas, Math.round(x * k * oran) / oran - w / 2, Math.round((yy - sonKaydir) * oran) / oran + sonKaydir, w, h)
  }
}

// ── Hazine damarı: kaya duvarında parlayan altın külçeleri ya da elmas kristalleri ──
// Kat içi noktalar (kesim pikseli): madencilerin, fenerlerin ve yönetici rozetinin üstüne binmez
const HAZINE_YER = [[[118, 14], [226, 24], [254, 12]], [[118, 24], [236, 16], [256, 12]]]
const HAZINE_R = 26   // dokunma yarıçapı (dünya px)
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
  // Kayadaki yarık
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
    // Üç mavi kristal (altıgen prizma), ortadaki en uzun
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
    // Altın külçeleri
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
// Damarın dünya konumu (merkez)
function hazineNokta(h) {
  const v = h.kat % 2
  const [hx, hy] = HAZINE_YER[v][h.yer % 3]
  return { x: hx * yer.k, y: yer.satirY(h.kat) + yer.rd(hy) + 4 }
}
let sonParilti = 0
let sonHazineYer = 0
function hazineCiz(d, ust, alt, simdiMs) {
  const h = d.calisma.hazine
  if (!h || h.kat >= d.bolgeler[d.aktifBolge].madenler.length) return
  sonHazineYer = h.yer
  const { x, y } = hazineNokta(h)
  if (y + 30 < ust || y - 30 > alt) return
  const yas = d.zaman - h.bas, kalan = h.bitis - d.zaman
  const t = simdiMs / 1000
  // Belirme: geri esneyen büyüme; son 6 sn yanıp söner
  const giris = Math.min(1, yas / 0.45)
  const olc = giris < 1 ? 1 + 2.2 * Math.pow(giris - 1, 3) + 1.2 * Math.pow(giris - 1, 2) : 1 + 0.05 * Math.sin(t * 4.2)
  const sonum = kalan < 6 ? (Math.sin(t * (kalan < 2.5 ? 22 : 12)) > -0.2 ? 1 : 0.35) : 1
  const elmas = h.tur === 'elmas'
  // Işık halesi
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = (0.55 + 0.25 * Math.sin(t * 4.2)) * sonum * giris
  const hl = al(elmas ? 'isik.mavi' : 'isik.sicak'), hs = 72 * olc
  ctx.drawImage(hl, x - hs / 2, y - hs / 2, hs, hs)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = sonum
  const sp = hazineGorsel(h.tur), w = (sp.width / oran) * olc * 1.25
  ctx.drawImage(sp, x - w / 2, y - w / 2 - 2, w, w)
  // Yıldız pırıltısı
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

// ---- Kayıt ----
async function dokulariYukle(ilerleme) {
  const sozler = []
  for (const [a, [dosya, w, h]] of Object.entries(DOKU)) {
    // Yedek: dosya yüklenemezse koyu düz renk (oyun oynanabilir kalır)
    Varliklar.kaydet(a, { w, h, ciz: (c, ww, hh) => { c.fillStyle = a === 'ref.tepe' ? '#3A3430' : '#1C2A33'; c.fillRect(0, 0, ww, hh) } })
    sozler.push(Varliklar.png(a, KOK + dosya))
  }
  let n = 0
  await Promise.all(sozler.map((s) => s.then((ok) => { n++; try { ilerleme && ilerleme(0.4 * n / sozler.length) } catch {} return ok })))
}

function prosedurelKaydet() {
  Varliklar.kaydet('isik.sicak', { w: 64, h: 64, ciz: (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,248,220,0.95)'); g.addColorStop(0.18, 'rgba(255,200,115,0.5)'); g.addColorStop(0.5, 'rgba(255,170,80,0.14)'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h) } })
  Varliklar.kaydet('isik.mavi', { w: 64, h: 64, ciz: (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(225,245,255,0.95)'); g.addColorStop(0.2, 'rgba(120,190,255,0.5)'); g.addColorStop(0.55, 'rgba(70,140,230,0.14)'); g.addColorStop(1, 'rgba(60,120,220,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h) } })
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
    c.fillStyle = 'rgba(0,0,0,.35)'
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
  return ['isik.sicak', 'isik.mavi', 'dolu.etiket', 'kilit.ust', ...parcacikSpritelari()]
}

// ---- Çizim yardımcıları ----
// Taş dolgusu: tepe şeridini dikey tekrarlar (her ikinci şerit aynalı), üstüne karartma
function tasDoldur(y0, h, karart) {
  const t = al('ref.tepe')
  const th = yer.TEPE_H
  ctx.save()
  ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip()
  let n = 0
  for (let yy = y0; yy < y0 + h; yy += th, n++) {
    if (n % 2) { ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(t, 0, yy, W, th); ctx.setTransform(oran, 0, 0, oran, 0, -sonKaydir * oran) }
    else ctx.drawImage(t, 0, yy, W, th)
  }
  ctx.restore()
  if (karart) { ctx.fillStyle = 'rgba(4,12,18,' + karart + ')'; ctx.fillRect(0, y0, W, h) }
}

// Kuyu dilimini [ust, alt) aralığına alttan hizalı döşer
function kuyuDose(ust, alt) {
  if (alt <= ust) return
  const img = al('ref.kuyu')
  const kw = yer.kuyuG, kh = yer.rd(38)
  const sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height
  for (let yy = alt - kh; yy > ust - kh; yy -= kh) {
    if (yy >= ust) ctx.drawImage(img, yer.kuyuX, yy, kw, kh)
    else {
      const kes = (ust - yy) / kh
      ctx.drawImage(img, 0, sh * kes, sw, sh * (1 - kes), yer.kuyuX, ust, kw, kh * (1 - kes))
    }
  }
}

// ── Kabin yayı: görüntü benzetim konumunu hafif sönümlü yayla izler ──
// Kalkışta yumuşak hızlanır, durakta küçük bir oturmayla durur. Büyük sıçramada (bölge değişimi) doğrudan atlar.
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

// Kuyu tepesindeki makara (çelik kasnak, dört kollu); ekran çözünürlüğünde bir kez çizilir
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
  g.fillStyle = 'rgba(255,255,255,.55)'
  g.beginPath(); g.arc(-R * 0.08, -R * 0.08, R * 0.11, 0, Math.PI * 2); g.fill()
  makaraC = c
  makaraAnahtar = anahtar
  return c
}

// Cevher akışı: durakta banttan kabine, boşaltmada kabinden depo yığınına taş atılır
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
    const sy = yer.satirY(a.durak), syy = yer.SATIR_H / 107
    const x0 = (BANT[a.durak % 2][1] + 2) * yer.k, y0 = sy + BANT[a.durak % 2][2] * syy - 4
    const hx = cx + (karma(simdiMs * 0.3) - 0.5) * yer.tupG * 0.4
    dunyaP.firlat(x0, y0, hx, alt - yer.KABIN_H * (0.22 + karma(simdiMs * 0.7) * 0.12), 0.3, tas, { boy, g: 520 })
  } else if (a.durum === 'bosaltiyor' && a.yuk > 0) {
    const x0 = cx + (karma(simdiMs * 0.3) - 0.5) * yer.tupG * 0.45
    const hy = yer.yuklemeY + yer.rd(66 + karma(simdiMs * 1.3) * 10)
    dunyaP.firlat(x0, alt - 3, x0 + (karma(simdiMs * 0.9) - 0.5) * yer.r(26), hy, 0.34, tas, { boy, g: 300, kal: 0.25, zemin: hy })
  }
}

function kabinCiz(d, b, alfa, simdiMs, dt) {
  const a = d.calisma.asansor
  const konum = kabinYay(a.onceki + (a.konum - a.onceki) * alfa, dt)
  const alt = konum >= 0 ? yer.kabinAltY(konum) : yer.kabinAltY(0) - konum * yer.SATIR_H * 0.5
  const hareket = Math.min(1, Math.abs(kabinV) / 2)
  const t = simdiMs / 1000
  // Çelik halatlar: en üst açık katın tavanındaki makaradan kabinin tepesine; hareket ederken titrer
  const ust = yer.satirY(Math.max(0, b.madenler.length - 1)) + yer.rd(9)
  const tepe = alt - yer.KABIN_H + 3
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
  // Makara ve taşıyıcı kiriş (halat boyu değiştikçe döner)
  const kiris = yer.rd(5)
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

  ctx.drawImage(al('ref.kabin'), yer.tupX, alt - yer.KABIN_H, yer.tupG, yer.KABIN_H)
  // Kabindeki yük: camın içinde, doluluk oranında cevher yığını
  const kap = E.asansorKap(d, b)
  const oranYuk = kap > 0 ? Math.min(1, a.yuk / kap) : 0
  if (oranYuk > 0.01) {
    const yig = kesikParca('kabin.yigin', d.aktifBolge, VAGON.yigin, VAGON.yiginKutu, 1)
    if (yig) {
      const kx = yer.tupX + yer.tupG * (8 / 47), kw = yer.tupG * (31 / 47)
      const camAlt = alt - yer.KABIN_H * (9 / 82), camUst = alt - yer.KABIN_H * (65 / 82)
      const yh = (camAlt - camUst) * (0.18 + 0.5 * oranYuk)
      ctx.save()
      ctx.beginPath()
      ctx.rect(kx, camUst, kw, camAlt - camUst)
      ctx.clip()
      ctx.globalAlpha = 0.95
      ctx.drawImage(yig, kx - kw * 0.08, camAlt - yh, kw * 1.16, yh * 1.25)
      ctx.restore()
    }
  }
  // Hareket ederken ok parlar
  if (a.durum === 'iniyor' || a.durum === 'cikiyor') {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(simdiMs / 110)
    ctx.drawImage(al('isik.sicak'), yer.tupX - 6, alt - yer.KABIN_H * 0.75, yer.tupG + 12, yer.KABIN_H * 0.6)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  cevherAkisi(d, a, alt, simdiMs)
}

function istasyonMerkez(ist, n) {
  const k = yer.istasyonKutusu(ist, n)
  return k ? { x: k.x + k.w / 2, y: k.y + k.h / 2 } : null
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
    await dokulariYukle(ilerleme)
    await Varliklar.hazirla(prosedurelKaydet(), (o) => { try { ilerleme && ilerleme(0.4 + 0.6 * o) } catch {} })
    dunyaP.kalite = efektP.kalite = kalite
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
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const y = yer, k = y.k
    const ky = gorunum.kaydirY
    sonKaydir = ky
    const ust = ky - 40, alt = ky + H + 40
    ctx.setTransform(oran, 0, 0, oran, 0, -ky * oran)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Dünya dışı (kaydırma lastiği)
    if (ust < 0) { ctx.fillStyle = '#041A2A'; ctx.fillRect(0, ust, W, -ust) }
    if (alt > y.DUNYA_H) { ctx.fillStyle = '#041A2A'; ctx.fillRect(0, y.DUNYA_H, W, alt - y.DUNYA_H) }
    // Tepe
    if (ust < y.TEPE_H) ctx.drawImage(al('ref.tepe'), 0, 0, W, y.TEPE_H)
    // Yeteneği aktif istasyonlar
    yetAktif.clear()
    for (const yo of b.yoneticiler) if (yo.atanan && durum.zaman < yo.aktifBitis) yetAktif.add(yo.atanan)
    // Katlar
    let ilk = MAKS_MADEN, son = -1
    for (let i = 0; i < MAKS_MADEN; i++) {
      const sy = y.satirY(i)
      if (sy + y.SATIR_H < ust || sy > alt) continue
      if (i < ilk) ilk = i
      if (i > son) son = i
      if (i < n) {
        ctx.drawImage(doku('ref.kat.' + (i % 2), durum.aktifBolge), 0, sy, W, y.SATIR_H)
        const tempo = katTempo(b, i, yetAktif.has('m' + i))
        kuklalariCiz(durum, i, i % 2, sy, t, dt, tempo)
        bantCiz(durum, i, i % 2, sy, t, dt, tempo)
        const kb = kaziBas[i]
        if (kb && simdiMs - kb < KAZI_MS) {
          const o = 1 - (simdiMs - kb) / KAZI_MS
          ctx.globalAlpha = o
          tasDoldur(sy, y.SATIR_H, 0.35)
          ctx.drawImage(al('kilit.ust'), 0, sy, W, y.SATIR_H)
          ctx.globalAlpha = 1
          if (karma(simdiMs * 0.01 + i) < 0.35) dunyaP.patlat(y.odaX + y.odaG * karma(simdiMs + i * 3), sy + y.ODA_UST + 10 + 50 * karma(simdiMs * 1.7), 'toz', 2)
        }
      } else if (i === n) {
        tasDoldur(sy, y.SATIR_H, 0.25)
        ctx.drawImage(al('kilit.ust'), 0, sy, W, y.SATIR_H)
      } else tasDoldur(sy, y.SATIR_H, 0.5)
    }
    // Yükleme katı
    const yuklemeGorunur = y.yuklemeY < alt && y.yuklemeY + y.YUKLEME_H > ust
    if (yuklemeGorunur) {
      ctx.drawImage(doku('ref.yukleme', durum.aktifBolge), 0, y.yuklemeY, W, y.YUKLEME_H)
      tasiyicilariCiz(durum, alfa || 0, t, simdiMs)
      egzoz(durum, simdiMs)
    }
    // Kuyu (açık katların hizasında; boyalı etiket ve kabinleri örter)
    if (n > 0) {
      const kUst = Math.max(ust, y.satirY(n - 1))
      const kAlt = Math.min(alt, y.yuklemeY + y.rd(4))
      kuyuDose(kUst, kAlt)
    }
    // Yeşil tüp: yığını olan katlarda cevher bekliyor
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      if (b.madenler[i].yigin > 0) ctx.drawImage(al('ref.tup'), y.tupX, y.satirY(i) + y.rd(24), y.tupG, y.rd(74))
    }
    kabinCiz(durum, b, alfa || 0, simdiMs, dt)

    // Işıklar ve kıvılcımlar
    ctx.globalCompositeOperation = 'lighter'
    const isik = al('isik.sicak')
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      const v = i % 2, sy = y.satirY(i)
      for (let f = 0; f < 2; f++) {
        const [fx, fy] = FENER[v][f]
        const a = 0.72 + 0.12 * Math.sin(t * 7.3 + i * 3.1 + f * 1.7) + 0.08 * (karma(Math.floor(t * 9) + i * 5 + f) - 0.5)
        ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.75
        ctx.drawImage(isik, fx * k - 24, sy + fy * k * 0.95 - 22, 48, 48)
      }
    }
    // Fener ışığında süzülen toz zerreleri (belirlenimci yörüngeler, parçacık havuzu kullanmaz)
    if (kalite !== 'pil') {
      for (let i = ilk; i <= Math.min(son, n - 1); i++) {
        const v = i % 2, sy = y.satirY(i)
        for (let f = 0; f < 2; f++) {
          const [fx, fy] = FENER[v][f]
          const bx = fx * k, by = sy + fy * k * 0.95 + 10
          for (let q = 0; q < 3; q++) {
            const ph = karma(i * 17 + f * 5 + q) * 6.283
            const mx = bx + Math.sin(t * (0.31 + q * 0.11) + ph) * 15
            const my = by + 4 + q * 8 + Math.sin(t * (0.47 + q * 0.07) + ph * 1.7) * 6
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
    if (yetAktif.has('asansor')) {
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 6.3)
      const ka = y.kabinAltY(kabinX)
      ctx.drawImage(isik, y.tupX - y.tupG * 0.6, ka - y.KABIN_H * 1.3, y.tupG * 2.2, y.KABIN_H * 1.6)
    }
    if (yuklemeGorunur) {
      for (const fx of [145, 208]) {
        ctx.globalAlpha = 0.6 + 0.1 * Math.sin(t * 6.1 + fx)
        ctx.drawImage(isik, fx * k - 26, y.yuklemeY + y.rd(18) - 26, 52, 52)
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      const c = durum.calisma.madenler[i]
      if (!c) continue
      const v = i % 2, sy = y.satirY(i)
      if (c.calisiyor && !c.dolu && !(kaziBas[i] && simdiMs - kaziBas[i] < KAZI_MS)) {
        const aktif = yetAktif.has('m' + i)
        for (let m = 0; m < 2; m++) {
          const j = i * 2 + m
          const evre = Math.floor(kuklaFaz[j])
          if (evre !== sonVurus[j]) {
            sonVurus[j] = evre
            if (KUKLA['ref.kat.' + v][m].tur !== 'kaz') continue
            const [px, py, yon] = KIVILCIM[v][m]
            dunyaP.patlat(px * k, sy + y.rd(py), 'kivilcim', aktif ? 5 : 3, { yon: yon < 0 ? Math.PI : 0 })
            if (karma(evre + j) < 0.5) dunyaP.patlat(px * k, sy + y.rd(py) + 4, 'toz', 1)
            if (aktif && karma(evre * 3 + j) < 0.6) dunyaP.patlat(px * k, sy + y.rd(py) - 10, 'parilti', 1, { yaricap: 14 })
          }
        }
      }
      if (c.dolu) ctx.drawImage(al('dolu.etiket'), DOLU[v][0] * k, sy + y.rd(DOLU[v][1]), 30, 12)
    }
    // Satış sayıları (yükleme katındaki vagonun üstünde)
    if (satisToplam > 0 && simdiMs - satisSon >= SATIS_TOPLA_MS) {
      // Art arda gelen sayılar üst üste binmesin: sırayla sola/sağa kayar
      satisSira = (satisSira + 1) % 3
      const sx = SATIS_NOKTA[0] * k + (satisSira - 1) * 22, sy = y.yuklemeY + y.rd(SATIS_NOKTA[1])
      dunyaP.sayi(sx, sy - 14 - (satisSira % 2) * 6, '+' + bicim(satisToplam))
      dunyaP.patlat(sx, sy, 'sikke', 4)
      satisToplam = 0
      satisSon = simdiMs
    }
    hazineCiz(durum, ust, alt, simdiMs)
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
          // Her yükseltmede küçük pırıltı; kademe geçişinde büyük patlama ve kıvılcım
          const m = istasyonMerkez(o.istasyon, n)
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
          dunyaP.patlat(yer.tupX + yer.tupG / 2, yer.yuklemeY + yer.rd(70), 'toz', 3)
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
          break
        }
        case 'hazineKayboldu': {
          const h = { kat: o.kat, yer: sonHazineYer }
          const p = hazineNokta(h)
          dunyaP.patlat(p.x, p.y, 'toz', 4)
          break
        }
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

  bellek() { return Varliklar.bellek() },
  get hazir() { return hazir },
}
