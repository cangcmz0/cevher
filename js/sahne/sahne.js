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
let kabinOturma = 0, sonKabinDurum = 'bekle'
const kaziBas = new Float64Array(MAKS_MADEN)
const sonVurus = new Int32Array(MAKS_MADEN * 2).fill(-1)
let satisToplam = 0, satisSon = 0
const dunyaP = new Havuz(256)
const efektP = new Havuz(256)
let efektCanli = false
let kalite = 'yuksek'

const al = (a) => Varliklar.al(a)
const dpTavan = () => DPR_TAVAN[kalite] || 2

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
  return ['isik.sicak', 'dolu.etiket', 'kilit.ust', ...parcacikSpritelari()]
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

function kabinCiz(d, b, alfa, simdiMs) {
  const a = d.calisma.asansor
  const konum = a.onceki + (a.konum - a.onceki) * alfa
  if (a.durum !== sonKabinDurum) {
    if (a.durum === 'yukluyor' || a.durum === 'bosaltiyor') kabinOturma = simdiMs
    sonKabinDurum = a.durum
  }
  let alt = yer.kabinAltY(konum)
  const os = simdiMs - kabinOturma
  if (os < 150) alt += Math.sin((os / 150) * Math.PI) * 2
  ctx.drawImage(al('ref.kabin'), yer.tupX, alt - yer.KABIN_H, yer.tupG, yer.KABIN_H)
  // Hareket ederken ok parlar
  if (a.durum === 'iniyor' || a.durum === 'cikiyor') {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(simdiMs / 110)
    ctx.drawImage(al('isik.sicak'), yer.tupX - 6, alt - yer.KABIN_H * 0.75, yer.tupG + 12, yer.KABIN_H * 0.6)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
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
    // Katlar
    let ilk = MAKS_MADEN, son = -1
    for (let i = 0; i < MAKS_MADEN; i++) {
      const sy = y.satirY(i)
      if (sy + y.SATIR_H < ust || sy > alt) continue
      if (i < ilk) ilk = i
      if (i > son) son = i
      if (i < n) {
        ctx.drawImage(al('ref.kat.' + (i % 2)), 0, sy, W, y.SATIR_H)
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
    if (yuklemeGorunur) ctx.drawImage(al('ref.yukleme'), 0, y.yuklemeY, W, y.YUKLEME_H)
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
    kabinCiz(durum, b, alfa || 0, simdiMs)

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
      if (c.calisiyor && !(kaziBas[i] && simdiMs - kaziBas[i] < KAZI_MS)) {
        for (let m = 0; m < 2; m++) {
          const evre = Math.floor((t + karma(i * 7 + m * 13) * 2) / 0.6)
          const j = i * 2 + m
          if (evre !== sonVurus[j]) {
            sonVurus[j] = evre
            const [px, py, yon] = KIVILCIM[v][m]
            dunyaP.patlat(px * k, sy + y.rd(py), 'kivilcim', 3, { yon: yon < 0 ? Math.PI : 0 })
            if (karma(evre + j) < 0.5) dunyaP.patlat(px * k, sy + y.rd(py) + 4, 'toz', 1)
          }
        }
      }
      if (c.dolu) ctx.drawImage(al('dolu.etiket'), DOLU[v][0] * k, sy + y.rd(DOLU[v][1]), 30, 12)
    }
    // Satış sayıları (yükleme katındaki vagonun üstünde)
    if (satisToplam > 0 && simdiMs - satisSon >= SATIS_TOPLA_MS) {
      const sx = SATIS_NOKTA[0] * k, sy = y.yuklemeY + y.rd(SATIS_NOKTA[1])
      dunyaP.sayi(sx, sy - 14, '+' + bicim(satisToplam))
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
        case 'yukseltildi':
          if (o.kademeler && o.kademeler.length) {
            const m = istasyonMerkez(o.istasyon, n)
            if (m) dunyaP.patlat(m.x, m.y, 'parilti', 10, { yaricap: 30 })
          }
          break
        case 'yetenek': {
          const m = istasyonMerkez(o.istasyon, n)
          if (m) dunyaP.patlat(m.x, m.y, 'parilti', 12, { yaricap: 34 })
          break
        }
        case 'bosaltildi':
          dunyaP.patlat(yer.tupX + yer.tupG / 2, yer.yuklemeY + yer.r(8), 'parca', 4, { zemin: yer.yuklemeY + yer.r(30) })
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
      }
    }
  },

  // Dünya koordinatı → istasyon. Kartlar ve düğmeler DOM'da.
  isabet(x, y, durum) {
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const ic = (k) => k && x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h
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
