// Değiştirilebilir varlık haritası (§5.8).
// anahtar -> { w, h, ciz(ctx, w, h, secenek) }  ya da  { w, h, png: 'img/....png' }
// w/h bir sayı, 'W' (dünya genişliği) ya da W'yi alan bir işlev olabilir; W'ye bağlı olanlar genişlik değişince yeniden fırınlanır.
// Bütün sahne çizimi Varliklar.al üzerinden geçer: boyanmış PNG'ler çiziciye dokunmadan her sprite'ın yerini alabilir.

import { tuvalYap } from './cizim.js'

const tanimlar = new Map()     // anahtar -> tanım
const firin = new Map()        // anahtar -> fırınlanmış tuval
const ozel = new Map()         // anahtar -> çözülmüş PNG (öncelikli)
const boyutlar = new Map()     // anahtar -> { w, h } mantıksal boyut (CSS px)
const kirli = new Set()        // yeniden fırınlanacak (genişlik değişti)
const renkler = new Map()      // ıska rengi önbelleği
let olcek = 2
let dunyaG = 390
let yenilemeZamanlayici = 0
let hataSayisi = 0

function boyutHesapla(t, eksen) {
  const v = t[eksen]
  if (v === 'W') return dunyaG
  if (typeof v === 'function') return v(dunyaG)
  return v
}
function genislikBagli(t) {
  return t.w === 'W' || t.h === 'W' || typeof t.w === 'function' || typeof t.h === 'function'
}

// 1×1 düz renk (fırınlama başarısızsa sade görünüm)
function iska(anahtar) {
  let c = renkler.get(anahtar)
  if (c) return c
  c = tuvalYap(1, 1)
  const g = c.getContext('2d')
  const on = anahtar.split('.')[0]
  g.fillStyle = on === 'yuzey' ? '#7EC8E3' : on === 'satir' || on === 'bitis' ? '#4A2E1C'
    : on === 'madenci' || on === 'tasiyici' ? '#2F5FA8' : on === 'depo' ? '#B8432F' : on === 'satis' ? '#C4553B'
    : on === 'kandil' || on === 'p' ? 'rgba(0,0,0,0)' : '#6E7A86'
  g.fillRect(0, 0, 1, 1)
  renkler.set(anahtar, c)
  return c
}

function pisir(anahtar) {
  const t = tanimlar.get(anahtar)
  if (!t || !t.ciz) return null
  const w = boyutHesapla(t, 'w'), h = boyutHesapla(t, 'h')
  const b = boyutlar.get(anahtar)
  if (b) { b.w = w; b.h = h } else boyutlar.set(anahtar, { w, h })
  try {
    const s = t.olcek || olcek
    const c = tuvalYap(w * s, h * s)
    const g = c.getContext('2d')
    g.scale(c.width / w, c.height / h)
    t.ciz(g, w, h, t.secenek || {})
    firin.set(anahtar, c)
    kirli.delete(anahtar)
    return c
  } catch (e) {
    hataSayisi++
    if (typeof console !== 'undefined') console.warn('Varlık fırınlanamadı:', anahtar, e)
    const c = iska(anahtar)
    firin.set(anahtar, c)
    kirli.delete(anahtar)
    return c
  }
}

function yenilemeyiPlanla() {
  if (yenilemeZamanlayici) return
  const adim = () => {
    yenilemeZamanlayici = 0
    const t0 = performance.now()
    for (const a of kirli) {
      pisir(a)
      if (performance.now() - t0 > 8) break
    }
    if (kirli.size) yenilemeZamanlayici = setTimeout(adim, 0)
  }
  yenilemeZamanlayici = setTimeout(adim, 0)
}

export const Varliklar = {
  get olcek() { return olcek },
  get hata() { return hataSayisi },

  // Fırın ölçeği (cihaz pikseli/CSS px) ve dünya genişliği
  ayarla({ olcek: o, dunyaG: g } = {}) {
    if (o) olcek = o
    if (g) this.genislik(g)
  },

  // Genişlik değişince W'ye bağlı varlıkları boşta yeniden fırınla; o arada eskiler ölçeklenerek çizilir.
  genislik(g) {
    g = Math.round(g)
    if (g === dunyaG) return
    dunyaG = g
    for (const [a, t] of tanimlar) {
      if (!genislikBagli(t)) continue
      const b = boyutlar.get(a)
      if (b) { b.w = boyutHesapla(t, 'w'); b.h = boyutHesapla(t, 'h') }
      if (firin.has(a)) kirli.add(a)
    }
    if (kirli.size) yenilemeyiPlanla()
  },

  kaydet(anahtar, tanim) {
    tanimlar.set(anahtar, tanim)
    const w = boyutHesapla(tanim, 'w'), h = boyutHesapla(tanim, 'h')
    const b = boyutlar.get(anahtar)
    if (b) { b.w = w; b.h = h } else boyutlar.set(anahtar, { w, h })
    if (firin.has(anahtar)) { firin.delete(anahtar) }
    if (tanim.png) this.png(anahtar, tanim.png)
  },

  tanimli(anahtar) { return tanimlar.has(anahtar) },

  // Boyanmış PNG ile değiştir (async). Çözülünce fırınlanmış tuvalin yerini alır.
  png(anahtar, url) {
    if (typeof Image === 'undefined') return Promise.resolve(false)
    const img = new Image()
    img.src = url
    const bitti = () => { ozel.set(anahtar, img); if (!boyutlar.has(anahtar)) boyutlar.set(anahtar, { w: img.naturalWidth, h: img.naturalHeight }); return true }
    return (img.decode ? img.decode() : new Promise((coz, red) => { img.onload = coz; img.onerror = red }))
      .then(bitti, () => false)
  },

  ozelMi(anahtar) { return ozel.has(anahtar) },

  // CanvasImageSource döner (asla null değil). Fırınlanmamışsa eşzamanlı fırınlar.
  al(anahtar) {
    const o = ozel.get(anahtar)
    if (o) return o
    const c = firin.get(anahtar)
    if (c) return c
    return pisir(anahtar) || iska(anahtar)
  },

  // Mantıksal boyut (CSS px); çizerken hedef boyut budur, kaynak çözünürlüğü ne olursa olsun
  boyut(anahtar) {
    let b = boyutlar.get(anahtar)
    if (!b) { b = { w: 1, h: 1 }; boyutlar.set(anahtar, b) }
    return b
  },

  // Anahtarları ≤ 8 ms'lik dilimlerle fırınlar (açılış çubuğu akmaya devam eder)
  hazirla(anahtarlar, ilerleme) {
    const liste = anahtarlar || [...tanimlar.keys()]
    return new Promise((coz) => {
      let k = 0
      const adim = () => {
        const t0 = performance.now()
        while (k < liste.length) {
          const a = liste[k++]
          if (!firin.has(a) && !ozel.has(a)) pisir(a)
          if (performance.now() - t0 > 6) break
        }
        try { ilerleme && ilerleme(liste.length ? k / liste.length : 1) } catch (e) { /* yoksay */ }
        if (k < liste.length) setTimeout(adim, 0)
        else coz()
      }
      adim()
    })
  },

  anahtarlar(onEk) {
    const s = []
    for (const a of tanimlar.keys()) if (!onEk || a.startsWith(onEk)) s.push(a)
    return s
  },

  // Bayt cinsinden önbellek (fırınlanmış tuvaller + çözülmüş PNG'ler)
  bellek() {
    let n = 0
    for (const c of firin.values()) n += c.width * c.height * 4
    for (const i of ozel.values()) n += (i.naturalWidth || 0) * (i.naturalHeight || 0) * 4
    return n
  },

  // Belirli bir öneki bellek olarak say (ör. 'madenci.' atlası)
  bellekOnEk(onEk) {
    let n = 0
    for (const [a, c] of firin) if (a.startsWith(onEk)) n += c.width * c.height * 4
    return n
  },
}
