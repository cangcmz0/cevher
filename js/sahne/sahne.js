// Sahne (Paket B, §6.5, görsel yön 2): fırınlanmış varlıklarla maden görünümünü çizer.
// Katlar alttan üste dizilir; en altta yükleme katı (depo, raylar, sarı vagonlar).
// Kare başına yalnız drawImage ve birkaç dönüşüm; shadowBlur, filter, getImageData yok.

import { Varliklar } from './varliklar.js'
import {
  katlariKaydet, KAT_CESIT, KABIN_H, ARABA_W, ARABA_H, YIGIN_W, YIGIN_H, FENER_Y, kabinG, depoKapiX, RAY_Y,
  LOKO_W, LOKO_H, VAGON_W, VAGON_H,
} from './satir.js'
import {
  madencileriKaydet, portreCiz, kareSec, madenciAnahtar, HUCRE_W, HUCRE_H, AYAK_X, AYAK_Y, VURUS_KARE, VARYANT_SAYISI,
} from './madenci.js'
import { rozetCiz } from './yuzey.js'
import { Havuz, parcacikSpritelari } from './parcacik.js'
import { karma } from './cizim.js'
import {
  yerlesim, SATIR_H, TEPE_H, YUKLEME_H, ODA_UST, ZEMIN_Y, MAKS_MADEN, kabinAltY, satirY, yuklemeY, DUNYA_H,
} from '../yerlesim.js'
import * as E from '../ekonomi.js'
import { bicim } from '../bicim.js'

const DPR_TAVAN = { yuksek: 2, dengeli: 1.5, pil: 1.25 }
const KAZI_MS = 1600
const SATIS_TOPLA_MS = 450
const SLOT = [0.17, 0.78, 0.33]          // madenci konumları (oda genişliğine oran)
const SLOT_YON = [-1, 1, -1]             // -1 sola bakar
const ARABA_X = 0.53
const MADENCI_OLCEK = 1.08

let tuval = null, ctx = null, efektTuval = null, ectx = null
let W = 390, H = 600, oran = 2, efOran = 2, efW = 390, efH = 844
let yer = yerlesim(390)
let durumRef = null
let hazir = false
let sonMs = 0
let sonKaydir = 0
let kabinOturma = 0, sonKabinDurum = 'bekle'
const kaziBas = new Float64Array(MAKS_MADEN)
const sevinBitis = new Float64Array(MAKS_MADEN)
const sonKare = new Int8Array(MAKS_MADEN * 3).fill(-1)
let satisToplam = 0, satisSon = 0
const dunyaP = new Havuz(256)
const efektP = new Havuz(256)
let efektCanli = false
let kalite = 'yuksek'

function al(a) { return Varliklar.al(a) }
const dpTavan = () => DPR_TAVAN[kalite] || 2

function anahtarListesi() {
  return [...katlariKaydet(), ...madencileriKaydet(), ...parcacikSpritelari(), ...isikKaydet()]
}

function isikKaydet() {
  const parilti = (c, w, h, d) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [o, r] of d) g.addColorStop(o, r); c.fillStyle = g; c.fillRect(0, 0, w, h) }
  Varliklar.kaydet('isik.sicak', { w: 64, h: 64, ciz: (c, w, h) => parilti(c, w, h, [[0, 'rgba(255,248,220,0.95)'], [0.18, 'rgba(255,200,115,0.55)'], [0.5, 'rgba(255,170,80,0.16)'], [1, 'rgba(255,160,60,0)']]) })
  Varliklar.kaydet('isik.far', { w: 48, h: 24, ciz: (c, w, h) => { const g = c.createLinearGradient(w, 0, 0, 0); g.addColorStop(0, 'rgba(255,240,190,.55)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(w, h / 2 - 2); c.lineTo(0, 0); c.lineTo(0, h); c.lineTo(w, h / 2 + 2); c.fill() } })
  return ['isik.sicak', 'isik.far']
}

function madenciCiz(anahtar, x, y, yon) {
  const img = al(anahtar)
  const s = MADENCI_OLCEK
  ctx.translate(x, y)
  ctx.scale(yon < 0 ? -s : s, s)
  ctx.drawImage(img, -AYAK_X, -AYAK_Y, HUCRE_W, HUCRE_H)
  ctx.setTransform(oran, 0, 0, oran, 0, -sonKaydir * oran)
}

function yiginSeviye(o) {
  if (!(o > 0)) return 0
  return Math.max(1, Math.min(4, Math.ceil(o * 4 - 1e-9)))
}

// ---- Kat dinamikleri ----
function katDinamik(d, b, i, simdiMs, t, yonetimli) {
  const sy = satirY(i)
  const zemin = sy + ZEMIN_Y
  const c = d.calisma.madenler[i] || { calisiyor: false, dolu: false }
  const m = b.madenler[i]
  const ax = yer.odaX + yer.odaG * ARABA_X - ARABA_W / 2
  ctx.drawImage(al('araba.maden'), ax, zemin - ARABA_H, ARABA_W, ARABA_H)
  const sv = yiginSeviye(m.yigin / E.yiginKap(d, b, i))
  if (sv) ctx.drawImage(al('yigin.' + sv), ax + (ARABA_W - YIGIN_W) / 2, zemin - ARABA_H - YIGIN_H + 6, YIGIN_W, YIGIN_H)
  const n = E.madenciSayisi(m.L) + 1   // görseldeki gibi en az iki madenci
  const sevin = simdiMs < sevinBitis[i]
  for (let k = 0; k < Math.min(3, n); k++) {
    const v = (i + k) % VARYANT_SAYISI
    const ofs = karma(i * 7 + k * 13) * 2
    let anim = 'bekle'
    if (sevin) anim = 'sevin'
    else if (c.dolu) anim = 'otur'
    else if (c.calisiyor) anim = 'kaz'
    const kare = kareSec(anim, t + ofs)
    const x = yer.odaX + yer.odaG * SLOT[k]
    madenciCiz(madenciAnahtar(v, anim, kare), x, zemin, SLOT_YON[k])
    const j = i * 3 + k
    if (anim === 'kaz' && kare === VURUS_KARE && sonKare[j] !== VURUS_KARE && (!yonetimli || karma(t * 13 + j) < 0.4)) {
      const yon = SLOT_YON[k]
      const px = x + yon * 26, py = zemin - 15
      dunyaP.patlat(px, py, 'kivilcim', 4, { yon: yon < 0 ? Math.PI : 0 })
      dunyaP.patlat(px, py + 4, 'toz', 2)
    }
    sonKare[j] = anim === 'kaz' ? kare : -1
  }
  if (c.dolu) ctx.drawImage(al('dolu.etiket'), ax + 2, zemin - ARABA_H - YIGIN_H - 6, 30, 12)
}

// ---- Asansör ----
function kabinCiz(d, b, alfa, simdiMs) {
  const a = d.calisma.asansor
  const konum = a.onceki + (a.konum - a.onceki) * alfa
  if (a.durum !== sonKabinDurum) {
    if (a.durum === 'yukluyor' || a.durum === 'bosaltiyor') kabinOturma = simdiMs
    sonKabinDurum = a.durum
  }
  const kg = kabinG(yer.kuyuG)
  const x = yer.kuyuX + (yer.kuyuG - kg) / 2
  let alt = kabinAltY(konum)
  const os = simdiMs - kabinOturma
  if (os < 150) alt += Math.sin((os / 150) * Math.PI) * 2
  const ust = alt - KABIN_H
  // Halat (kuyunun tepesinden kabine)
  const n = b.madenler.length
  const halatUst = satirY(n - 1) + 2
  ctx.fillStyle = 'rgba(20,22,26,.9)'
  ctx.fillRect(x + kg / 2 - 1.5, halatUst, 1, ust - halatUst + 2)
  ctx.fillRect(x + kg / 2 + 0.5, halatUst, 1, ust - halatUst + 2)
  ctx.drawImage(al('kabin.arka'), x, ust, kg, KABIN_H)
  const sv = yiginSeviye(b.asansor.yuk / E.asansorKap(d, b))
  if (sv) ctx.drawImage(al('yigin.' + sv), x + 3, alt - 6 - YIGIN_H + 3, kg - 6, YIGIN_H)
  const L = b.asansor.L
  ctx.drawImage(al('kabin.on.' + (L >= 200 ? 2 : L >= 50 ? 1 : 0)), x, ust, kg, KABIN_H)
  // Parlayan yön oku (yukarı çıkarken ↑, yüklü inerken ↓)
  if (a.durum === 'iniyor' || a.durum === 'cikiyor') {
    const yon = a.durum === 'iniyor' ? 1 : -1
    const nab = 0.8 + 0.2 * Math.sin(simdiMs / 120)
    ctx.globalAlpha = nab
    ctx.drawImage(al('kabin.ok.' + yon), x + kg / 2 - 11, ust - 24, 22, 22)
    ctx.globalAlpha = 1
  }
}

// ---- Yükleme katı: depo yığını ve vagonlar ----
function yuklemeDinamik(d, b, t) {
  const dep = yer.depo
  const sv = yiginSeviye(b.depo.stok / E.depoKap(d, b))
  if (sv) {
    const pw = Math.min(dep.w - 20, 48)
    ctx.drawImage(al('yigin.' + sv), dep.x + (dep.w - pw) / 2, yuklemeY + RAY_Y - 6 - 22, pw, 22)
  }
  const kapi = depoKapiX(W)
  const disari = -LOKO_W - VAGON_W - 10
  const ray = yuklemeY + RAY_Y + 2
  const tl = d.calisma.tasiyicilar
  for (let j = 0; j < tl.length; j++) {
    const ts = tl[j]
    let x = null, dolu = false
    if (ts.durum === 'yukluyor') { x = kapi - LOKO_W - VAGON_W; dolu = ts.t > ts.sure * 0.5 }
    else if (ts.durum === 'gidiyor' || ts.durum === 'donuyor') {
      const u = ts.oncekiKonum + (ts.konum - ts.oncekiKonum) * 0.5
      x = (kapi - LOKO_W - VAGON_W) + (disari - (kapi - LOKO_W - VAGON_W)) * u
      dolu = ts.durum === 'gidiyor'
    }
    if (x === null || x > W) continue
    const sal = Math.sin(t * 18 + j) * 0.4
    // Lokomotif solda (sola gider), vagon arkada
    ctx.drawImage(al('vagon.' + (dolu ? 1 : 0)), x + LOKO_W - 2, ray - VAGON_H + sal, VAGON_W, VAGON_H)
    ctx.drawImage(al('lokomotif'), x, ray - LOKO_H + 1 + sal, LOKO_W, LOKO_H)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.7
    ctx.drawImage(al('isik.far'), x - 44, ray - 22, 48, 24)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
}

function isiklar(b, ilk, son, t, yuklemeGorunur) {
  const isik = al('isik.sicak')
  ctx.globalCompositeOperation = 'lighter'
  for (let i = ilk; i <= son; i++) {
    if (i >= b.madenler.length) continue
    const sy = satirY(i)
    for (let f = 0; f < 2; f++) {
      const x = yer.odaX + yer.odaG * (f ? 0.7 : 0.3)
      const a = 0.82 + 0.1 * Math.sin(t * 7.3 + i * 3.1 + f * 1.7) + 0.06 * (karma(Math.floor(t * 9) + i * 5 + f) - 0.5)
      ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.9
      ctx.drawImage(isik, x - 28, sy + FENER_Y - 28, 56, 56)
    }
  }
  if (yuklemeGorunur) {
    for (const fx of [0.12, 0.38]) {
      ctx.globalAlpha = 0.85 + 0.1 * Math.sin(t * 6.1 + fx * 9)
      ctx.drawImage(isik, W * fx - 30, yuklemeY + 29 - 30, 60, 60)
    }
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

function istasyonMerkez(ist, n) {
  const k = yer.istasyonKutusu(ist, n)
  if (!k) return null
  return { x: k.x + k.w / 2, y: k.y + k.h / 2 }
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
    await Varliklar.hazirla(anahtarListesi(), ilerleme)
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
    const ky = gorunum.kaydirY
    sonKaydir = ky
    const ust = ky - 40, alt = ky + H + 40
    ctx.setTransform(oran, 0, 0, oran, 0, -ky * oran)

    // Dünyanın üstü/altı (kaydırma lastiği için)
    if (ust < 0) { ctx.fillStyle = '#07161C'; ctx.fillRect(0, ust, W, -ust) }
    if (alt > DUNYA_H) { ctx.fillStyle = '#0A0705'; ctx.fillRect(0, DUNYA_H, W, alt - DUNYA_H) }
    if (ust < TEPE_H) ctx.drawImage(al('tepe'), 0, 0, W, TEPE_H)
    // Kat arka planları (görünür olanlar)
    let ilk = MAKS_MADEN, son = -1
    for (let i = 0; i < MAKS_MADEN; i++) {
      const sy = satirY(i)
      if (sy + SATIR_H < ust || sy > alt) continue
      if (i < ilk) ilk = i
      if (i > son) son = i
      if (i < n) {
        ctx.drawImage(al('kat.' + (i % KAT_CESIT)), 0, sy, W, SATIR_H)
        const kb = kaziBas[i]
        if (kb && simdiMs - kb < KAZI_MS) {
          ctx.globalAlpha = 1 - (simdiMs - kb) / KAZI_MS
          ctx.drawImage(al('kat.kilitli'), 0, sy, W, SATIR_H)
          ctx.globalAlpha = 1
          if (karma(simdiMs * 0.01 + i) < 0.35) dunyaP.patlat(yer.odaX + yer.odaG * karma(simdiMs + i * 3), sy + ODA_UST + 16 + 60 * karma(simdiMs * 1.7), 'toz', 2)
        }
      } else if (i === n) ctx.drawImage(al('kat.kilitli'), 0, sy, W, SATIR_H)
      else ctx.drawImage(al('kat.kaya.' + (i % 2)), 0, sy, W, SATIR_H)
    }
    const yuklemeGorunur = yuklemeY < alt && yuklemeY + YUKLEME_H > ust
    if (yuklemeGorunur) ctx.drawImage(al('yukleme'), 0, yuklemeY, W, YUKLEME_H)
    // Kat dinamikleri
    for (let i = ilk; i <= Math.min(son, n - 1); i++) {
      if (kaziBas[i] && simdiMs - kaziBas[i] < KAZI_MS * 0.6) continue
      let yonetimli = false
      for (const y of b.yoneticiler) if (y.atanan === 'm' + i) { yonetimli = true; break }
      katDinamik(durum, b, i, simdiMs, t, yonetimli)
    }
    kabinCiz(durum, b, alfa || 0, simdiMs)
    if (yuklemeGorunur) yuklemeDinamik(durum, b, t)
    isiklar(b, ilk, son, t, yuklemeGorunur)
    // Satış: soldaki tünel çıkışında uçan sayı
    if (satisToplam > 0 && simdiMs - satisSon >= SATIS_TOPLA_MS) {
      dunyaP.sayi(46, yuklemeY + 52, '+' + bicim(satisToplam))
      dunyaP.patlat(26, yuklemeY + 80, 'sikke', 4)
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
    for (let k = 0; k < liste.length; k++) {
      const o = liste[k]
      switch (o.tip) {
        case 'madenAcildi':
          kaziBas[o.i] = simdi
          break
        case 'yukseltildi': {
          const i = E.madenIndeks(o.istasyon)
          if (i >= 0) sevinBitis[i] = simdi + 900
          if (o.kademeler && o.kademeler.length) {
            const m = istasyonMerkez(o.istasyon, n)
            if (m) dunyaP.patlat(m.x, m.y, 'parilti', 10, { yaricap: 30 })
          }
          break
        }
        case 'yetenek': {
          const m = istasyonMerkez(o.istasyon, n)
          if (m) dunyaP.patlat(m.x, m.y, 'parilti', 12, { yaricap: 34 })
          break
        }
        case 'bosaltildi':
          dunyaP.patlat(yer.kuyuX + yer.kuyuG / 2, kabinAltY(0) + 10, 'parca', 4, { zemin: yuklemeY + RAY_Y - 10 })
          break
        case 'asansorDurak':
          dunyaP.patlat(yer.kuyuX + 4, satirY(o.kat) + ZEMIN_Y - 4, 'toz', 2)
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

  // Dünya koordinatı → istasyon. Kartlar ve rozetler DOM'da.
  isabet(x, y, durum) {
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const ic = (k) => k && x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h
    if (ic(yer.istasyonKutusu('depo', n))) return { istasyon: 'depo' }
    if (ic(yer.istasyonKutusu('asansor', n))) return { istasyon: 'asansor' }
    for (let i = 0; i < n; i++) if (ic(yer.istasyonKutusu('m' + i, n))) return { istasyon: 'm' + i }
    if (y >= yuklemeY && y < yuklemeY + YUKLEME_H) return { istasyon: 'depo' }
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
      const alt = kabinAltY(d.calisma.asansor.konum)
      k = { x: yer.kuyuX, y: alt - KABIN_H - 6, w: yer.kuyuG, h: KABIN_H + 12 }
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
