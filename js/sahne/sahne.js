// Sahne (Paket B, §6.5): fırınlanmış varlıklarla maden görünümünü çizer.
// Kare başına yalnız drawImage ve birkaç dönüşüm; shadowBlur, filter, getImageData yok.

import { Varliklar } from './varliklar.js'
import { yuzeyKaydet, rozetCiz, tekerMerkez, satisKapi, fenerLamba, ZEMIN_Y as YUZEY_ZEMIN, TEKER_R, DENIZ_UST } from './yuzey.js'
import {
  satirlariKaydet, SATIR_CESIT, KABIN_H, ARABA_W, ARABA_H, YIGIN_W, YIGIN_H, DEPO_H, kabinG, depoKutusu,
  depoArabaYeri, depoKapiYeri, FENER_Y,
} from './satir.js'
import {
  madencileriKaydet, portreCiz, kareSec, madenciAnahtar, tasiyiciAnahtar, ANIMLER, MADENCI_ANIM, TASIYICI_ANIM,
  HUCRE_W, HUCRE_H, AYAK_X, AYAK_Y, TASIYICI_W, TASIYICI_AYAK_X, VURUS_KARE, VARYANT_SAYISI,
} from './madenci.js'
import { Havuz, parcacikSpritelari } from './parcacik.js'
import { karma } from './cizim.js'
import {
  yerlesim, YUZEY_H, SATIR_H, BITIS_H, ODA_UST, ODA_H, ZEMIN_Y, MAKS_MADEN, kabinAltY, satirY,
} from '../yerlesim.js'
import * as E from '../ekonomi.js'
import { bicim } from '../bicim.js'

const DPR_TAVAN = { yuksek: 2, dengeli: 1.5, pil: 1.25 }
const KAZI_MS = 1600
const SATIS_TOPLA_MS = 450
const SLOT = [0.19, 0.52, 0.36]         // madenci konumları (oda genişliğine oran)
const SLOT_YON = [-1, 1, -1]            // -1 sola bakar
const TASIYICI_OLCEK = 0.82
const MADENCI_OLCEK = 1.22

let tuval = null, ctx = null, efektTuval = null, ectx = null
let W = 390, H = 600, oran = 2, efOran = 2, efW = 390, efH = 844
let yer = yerlesim(390)
let durumRef = null
let hazir = false
let sonMs = 0
let sonKaydir = 0
let tekerAci = 0, sonKonum = 0
let kabinOturma = 0, sonKabinDurum = 'bekle'
const kaziBas = new Float64Array(MAKS_MADEN)       // kazı animasyonu başlangıcı (ms)
const sevinBitis = new Float64Array(MAKS_MADEN)
const sonKare = new Int8Array(MAKS_MADEN * 3).fill(-1)
let satisToplam = 0, satisSon = 0
const dunyaP = new Havuz(256)
const efektP = new Havuz(256)
let efektCanli = false
let kalite = 'yuksek'

// Sprite önbelleği (Varliklar.al haritaya bakar; sık kullanılanlar burada tutulur)
const S = {}
function al(a) { return Varliklar.al(a) }

function dpTavan() { return DPR_TAVAN[kalite] || 2 }

function anahtarListesi() {
  const l = []
  l.push(...yuzeyKaydet())
  l.push(...satirlariKaydet())
  l.push(...madencileriKaydet())
  l.push(...parcacikSpritelari())
  return l
}

// ---- Yardımcılar ----
const satirCesidi = (i) => 'satir.zonguldak.' + (i % SATIR_CESIT)

function madenciCiz(anahtar, x, y, yon) {
  const img = al(anahtar)
  const s = MADENCI_OLCEK
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(yon < 0 ? -s : s, s)
  ctx.drawImage(img, -AYAK_X, -AYAK_Y, HUCRE_W, HUCRE_H)
  ctx.restore()
}

function tasiyiciCiz(anahtar, x, y, yon) {
  const img = al(anahtar)
  const s = TASIYICI_OLCEK
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(yon < 0 ? -s : s, s)
  ctx.drawImage(img, -TASIYICI_AYAK_X, -AYAK_Y, TASIYICI_W, HUCRE_H)
  ctx.restore()
}

function yiginSeviye(oran01) {
  if (!(oran01 > 0)) return 0
  return Math.max(1, Math.min(4, Math.ceil(oran01 * 4 - 1e-9)))
}

// ---- Yüzey ----
function yuzeyCiz(simdiMs, t) {
  ctx.drawImage(al('yuzey.arka'), 0, 0, W, YUZEY_H)
  // Bulutlar
  const bulut = al('bulut')
  for (let k = 0; k < 3; k++) {
    const hiz = 4 + k * 1.3
    const x = ((t * hiz + k * W * 0.41) % (W + 80)) - 70
    ctx.globalAlpha = 0.85 - k * 0.15
    ctx.drawImage(bulut, x, 2 + k * 9, 64 - k * 10, 22 - k * 3)
  }
  ctx.globalAlpha = 1
  // Deniz parıltısı (yatay kayar)
  const par = al('deniz.parilti')
  const ox = (t * 6) % W
  ctx.globalAlpha = 0.55
  ctx.drawImage(par, ox, DENIZ_UST + 3, W, 44)
  ctx.drawImage(par, ox - W, DENIZ_UST + 3, W, 44)
  ctx.globalAlpha = 1
  // Kargo gemisi (120 s'de karşıdan karşıya) ve kayık
  const gx = ((t / 120) % 1) * (W + 60) - 50
  const sal = Math.sin(t * 2.1) * 1
  ctx.drawImage(al('gemi.kargo'), gx, 52 + sal, 42, 20)
  const kx = W * 0.12 + Math.sin(t * 0.07) * W * 0.06
  ctx.drawImage(al('gemi.kayik'), kx, 76 + Math.sin(t * 2.7 + 1) * 0.8, 12, 10)
  ctx.drawImage(al('yuzey.on'), 0, 0, W, YUZEY_H)
  // Kule tekeri (asansör hareketiyle döner)
  const tm = tekerMerkez(W)
  const tk = al('kuyu.teker')
  const s = 2 * TEKER_R + 2
  ctx.translate(tm.x, tm.y)
  ctx.rotate(tekerAci)
  ctx.drawImage(tk, -s / 2, -s / 2, s, s)
  ctx.rotate(-tekerAci)
  ctx.translate(-tm.x, -tm.y)
}

// ---- Satır içi dinamikler ----
function satirDinamik(d, b, i, simdiMs, t) {
  const sy = satirY(i)
  const zemin = sy + ZEMIN_Y
  const c = d.calisma.madenler[i] || { calisiyor: false, dolu: false }
  const m = b.madenler[i]
  // Araba ve yığın
  const ax = yer.odaX + yer.odaG * 0.8 - ARABA_W / 2
  ctx.drawImage(al('araba.maden'), ax, zemin - ARABA_H, ARABA_W, ARABA_H)
  const kap = E.yiginKap(d, b, i)
  const sv = yiginSeviye(m.yigin / kap)
  if (sv) ctx.drawImage(al('yigin.' + sv), ax + (ARABA_W - YIGIN_W) / 2, zemin - ARABA_H - YIGIN_H + 5, YIGIN_W, YIGIN_H)
  // Madenciler
  const n = E.madenciSayisi(m.L)
  const sevin = simdiMs < sevinBitis[i]
  for (let k = 0; k < n; k++) {
    const v = (i + k) % VARYANT_SAYISI
    const ofs = karma(i * 7 + k * 13) * 2
    let anim = 'bekle'
    if (sevin) anim = 'sevin'
    else if (c.dolu) anim = 'otur'
    else if (c.calisiyor) anim = 'kaz'
    const kare = kareSec(anim, t + ofs)
    const x = yer.odaX + yer.odaG * SLOT[k]
    madenciCiz(madenciAnahtar(v, anim, kare), x, zemin, SLOT_YON[k])
    // Vuruş karesinde kıvılcım
    const j = i * 3 + k
    if (anim === 'kaz' && kare === VURUS_KARE && sonKare[j] !== VURUS_KARE) {
      const yon = SLOT_YON[k]
      const elle = !d.bolgeler[d.aktifBolge].yoneticiler.some((y) => y.atanan === 'm' + i)
      if (elle || karma(t * 13 + j) < 0.4) {
        const px = x + yon * 26, py = zemin - 14
        dunyaP.patlat(px, py, 'kivilcim', 4, { yon: yon < 0 ? Math.PI : 0 })
        dunyaP.patlat(px, py + 4, 'toz', 2)
      }
    }
    sonKare[j] = anim === 'kaz' ? kare : -1
  }
  if (c.dolu) ctx.drawImage(al('dolu.etiket'), ax, zemin - ARABA_H - YIGIN_H - 8, 30, 12)
}

// ---- Asansör ----
function kabinCiz(d, b, alfa, simdiMs) {
  const a = d.calisma.asansor
  const konum = a.onceki + (a.konum - a.onceki) * alfa
  // Teker dönüşü hareket yönünü izler
  tekerAci += (konum - sonKonum) * 2.4
  sonKonum = konum
  if (a.durum !== sonKabinDurum) {
    if (a.durum === 'yukluyor' || a.durum === 'bosaltiyor') kabinOturma = simdiMs
    sonKabinDurum = a.durum
  }
  const kg = kabinG(yer.kuyuG)
  const x = yer.kuyuX + 2
  let alt = kabinAltY(konum)
  const os = simdiMs - kabinOturma
  if (os < 150) alt += Math.sin((os / 150) * Math.PI) * 2
  const ust = alt - KABIN_H
  // Halatlar (teker → kabin tavanı)
  const tm = tekerMerkez(W)
  ctx.strokeStyle = 'rgba(30,32,36,.9)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tm.x - 3, tm.y + 2); ctx.lineTo(x + kg / 2 - 1, ust + 1)
  ctx.moveTo(tm.x + 3, tm.y + 2); ctx.lineTo(x + kg / 2 + 1, ust + 1)
  ctx.stroke()
  ctx.drawImage(al('kabin.arka'), x, ust, kg, KABIN_H)
  // Yük
  const kap = E.asansorKap(d, b)
  const sv = yiginSeviye(b.asansor.yuk / kap)
  if (sv) ctx.drawImage(al('yigin.' + sv), x + 2, alt - 6 - YIGIN_H + 3, kg - 4, YIGIN_H)
  // Operatör
  const op = a.durum === 'iniyor' && a.konum < 0.15 ? 1 : 0
  ctx.drawImage(al('operator.' + op), x + kg / 2 - 10, ust + 8, 20, 22)
  const L = b.asansor.L
  ctx.drawImage(al('kabin.on.' + (L >= 200 ? 2 : L >= 50 ? 1 : 0)), x, ust, kg, KABIN_H)
  if (a.durum === 'cikiyor') ctx.drawImage(al('kabin.ok'), x + kg / 2 - 7, ust + 14, 14, 14)
}

// ---- Depo ve taşıyıcılar ----
function depoCiz(d, b, t) {
  const k = depoKutusu(W)
  ctx.drawImage(al('depo.bina'), k.x, k.y, k.w, k.h)
  const dk = E.depoKap(d, b)
  const sv = yiginSeviye(b.depo.stok / dk)
  const a = depoArabaYeri(k.w)
  if (sv) ctx.drawImage(al('yigin.' + sv), k.x + a.x + (ARABA_W - YIGIN_W) / 2, k.y + a.y - ARABA_H - YIGIN_H + 5, YIGIN_W, YIGIN_H)
  // Taşıyıcılar
  const kapi = depoKapiYeri(k.w)
  const kx = k.x + kapi.x, ky = k.y + kapi.y
  const sk = satisKapi(W)
  const disari = W + 14
  const tl = d.calisma.tasiyicilar
  for (let j = 0; j < tl.length; j++) {
    const ts = tl[j]
    const ofs = j * 0.17
    if (ts.durum === 'yukluyor') {
      tasiyiciCiz(tasiyiciAnahtar('it', 0), kx - 2, ky, 1)
    } else if (ts.durum === 'gidiyor' || ts.durum === 'donuyor') {
      const u = ts.oncekiKonum + (ts.konum - ts.oncekiKonum) * 0.5
      const gidis = ts.durum === 'gidiyor'
      const anim = gidis ? 'it' : 'yuru'
      const kare = kareSec(anim, t + ofs)
      if (u < 0.5) {
        const x = kx + (disari - kx) * (u / 0.5)
        tasiyiciCiz(tasiyiciAnahtar(anim, kare), x, ky, gidis ? 1 : -1)
      } else {
        const x = disari + (sk.x - disari) * ((u - 0.5) / 0.5)
        tasiyiciCiz(tasiyiciAnahtar(anim, kare), x, YUZEY_ZEMIN + 1, gidis ? -1 : 1)
      }
    }
  }
}

// ---- Toplu ışık geçişi ----
function isiklar(d, b, ilk, son, t) {
  const isik = al('isik.sicak')
  ctx.globalCompositeOperation = 'lighter'
  for (let i = ilk; i <= son; i++) {
    if (i >= b.madenler.length) break
    const sy = satirY(i)
    for (let f = 0; f < 2; f++) {
      const x = yer.odaX + yer.odaG * (f ? 0.75 : 0.25)
      const a = 0.82 + 0.1 * Math.sin(t * 7.3 + i * 3.1 + f * 1.7) + 0.06 * (karma(Math.floor(t * 9) + i * 5 + f) - 0.5)
      ctx.globalAlpha = Math.max(0, Math.min(1, a)) * 0.9
      ctx.drawImage(isik, x - 26, sy + FENER_Y - 26, 52, 52)
    }
  }
  // Deniz feneri lambası (4 s'de bir nabız)
  if (ilk === 0) {
    const fl = fenerLamba(W)
    const n = 0.55 + 0.45 * Math.max(0, Math.sin((t / 4) * Math.PI * 2))
    ctx.globalAlpha = n
    ctx.drawImage(al('isik.beyaz'), fl.x - 16, fl.y - 16, 32, 32)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

// ---- Olaylar ----
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
    const liste = anahtarListesi()
    await Varliklar.hazirla(liste, ilerleme)
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
    const ust = ky - 64, alt = ky + H + 64
    ctx.setTransform(oran, 0, 0, oran, 0, -ky * oran)
    ctx.imageSmoothingEnabled = true

    // 1–2. Yüzey
    if (ust < YUZEY_H) yuzeyCiz(simdiMs, t)
    // 3. Satır arka planları
    const ilk = Math.max(0, Math.floor((ust - YUZEY_H) / SATIR_H))
    const satirSon = n + (n < MAKS_MADEN ? 1 : 0)
    const sonGor = Math.min(satirSon - 1, Math.floor((alt - YUZEY_H) / SATIR_H))
    for (let i = ilk; i <= sonGor; i++) {
      const sy = satirY(i)
      if (i < n) {
        ctx.drawImage(al(satirCesidi(i)), 0, sy, W, SATIR_H)
        const kb = kaziBas[i]
        if (kb && simdiMs - kb < KAZI_MS) {
          ctx.globalAlpha = 1 - (simdiMs - kb) / KAZI_MS
          ctx.drawImage(al('satir.kilitli'), 0, sy, W, SATIR_H)
          ctx.globalAlpha = 1
          if (karma(simdiMs * 0.01 + i) < 0.35) dunyaP.patlat(yer.odaX + yer.odaG * karma(simdiMs + i * 3), sy + ODA_UST + 20 + 70 * karma(simdiMs * 1.7), 'toz', 2)
        }
      } else {
        ctx.drawImage(al('satir.kilitli'), 0, sy, W, SATIR_H)
      }
    }
    const bitisY = YUZEY_H + satirSon * SATIR_H
    if (bitisY < alt) {
      ctx.drawImage(al('bitis'), 0, bitisY, W, BITIS_H)
      if (bitisY + BITIS_H < alt) {
        ctx.fillStyle = '#071B18'
        ctx.fillRect(0, bitisY + BITIS_H, W, alt - bitisY - BITIS_H)
      }
    }
    // 4–5. Satır dinamikleri (açık ve görünür)
    for (let i = ilk; i <= Math.min(sonGor, n - 1); i++) {
      if (kaziBas[i] && simdiMs - kaziBas[i] < KAZI_MS * 0.6) continue
      satirDinamik(durum, b, i, simdiMs, t)
    }
    // 6. Asansör
    kabinCiz(durum, b, alfa || 0, simdiMs)
    // 7. Depo ve taşıyıcılar
    if (ust < YUZEY_H + DEPO_H) depoCiz(durum, b, t)
    // 8. Işıklar
    isiklar(durum, b, ilk, sonGor, t)
    // 9–10. Parçacıklar ve uçan sayılar
    if (satisToplam > 0 && simdiMs - satisSon >= SATIS_TOPLA_MS) {
      const sk = satisKapi(W)
      dunyaP.sayi(sk.x, sk.y - 26, '+' + bicim(satisToplam))
      dunyaP.patlat(sk.x, sk.y - 8, 'sikke', 4)
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
        case 'bosaltildi': {
          const k2 = depoKutusu(W)
          dunyaP.patlat(k2.x + 6, k2.y + 44, 'parca', 4, { zemin: k2.y + 100 })
          break
        }
        case 'asansorDurak': {
          const sy = satirY(o.kat)
          dunyaP.patlat(yer.kuyuX + 4, sy + ZEMIN_Y - 4, 'toz', 2)
          break
        }
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

  // Dünya koordinatı → istasyon. Kartlar, rozetler ve çipler DOM'da (burada yok).
  isabet(x, y, durum) {
    const b = durum.bolgeler[durum.aktifBolge]
    const n = b.madenler.length
    const ic = (k) => k && x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h
    if (ic(yer.istasyonKutusu('depo', n)) || ic(yer.istasyonKutusu('satis', n))) return { istasyon: 'depo' }
    if (ic(yer.istasyonKutusu('asansor', n))) return { istasyon: 'asansor' }
    for (let i = 0; i < n; i++) if (ic(yer.istasyonKutusu('m' + i, n))) return { istasyon: 'm' + i }
    return null
  },

  // 'm3' | 'asansor' | 'depo' | 'satis' → #oyun koordinatı { x, y, w, h }
  ekranKonumu(capa, durum) {
    if (!tuval) return null
    const d = durum || durumRef
    const b = d.bolgeler[d.aktifBolge]
    const n = b.madenler.length
    let k
    if (capa === 'asansor') {
      const a = d.calisma.asansor
      const alt = kabinAltY(a.konum)
      k = { x: yer.kuyuX, y: alt - KABIN_H, w: yer.kuyuG, h: KABIN_H }
    } else if (capa === 'depo') {
      k = depoKutusu(W)
    } else {
      k = yer.istasyonKutusu(capa, n)
    }
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
    patlat(x, y, tur, adet, sec) {
      if (tur === 'sayi') efektP.sayi(x, y, sec && sec.metin ? sec.metin : '')
      else efektP.patlat(x, y, tur, adet, sec)
      efektCanli = true
    },
    kare(simdiMs) {
      if (!ectx || !efektCanli) return
      const dt = 1 / 60
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
