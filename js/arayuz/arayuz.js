// ════════════════════════════════════════════════════════════════
//  ARAYÜZ (Paket C, §6.6) — kök: DOM'u bir kez kurar, alt modülleri
//  bağlar, tek bir yetki devri (delegated) tıklama dinleyicisi tutar,
//  bağlamayı hız sınırlarıyla (10/4/2 Hz) çalıştırır.
//  • Alt modüller kur(B) ile bağlanır; B ortak bağlamdır.
//  • Düğmeler data-eylem ile yönlendirilir: B.eylemler[ad](el, olay).
// ════════════════════════════════════════════════════════════════
import { DEFS, ikon } from './ikonlar.js'
import { ogeYap, yayinla, Veriyolu, ses, bolgeAl, A, madenMi } from './ortak.js'
import * as Bildirim from './bildirim.js'
import * as Ust from './ust.js'
import * as Kartlar from './kartlar.js'
import * as Alt from './alt.js'
import * as Pencereler from './pencereler.js'
import * as Sayfalar from './sayfalar.js'
import * as Ogretici from './ogretici.js'

const SIKKE_HAVUZ = 24

let B = null
let moduller = []
let son10 = 0, son4 = 0, son2 = 0
let sonW = 0
let ilkKare = 0, hikayeBasladi = false

function kokKur(kok) {
  kok.insertAdjacentHTML('afterbegin', DEFS)
  const maden = kok.querySelector('#maden')
  // Görünüme sabit katman (Asansör etiketi, Darboğaz kartı)
  maden.appendChild(ogeYap('<div id="maden-ust"></div>'))
  // HUD ve istatistik maden görünümünün üstünde; sonra alt şerit, gezinti, sayfa, perde, pencereler, bildirimler
  const parca = document.createDocumentFragment()
  for (const html of [
    '<header id="ust"></header>',
    '<section id="istatistik" aria-label="İstatistikler"></section>',
    '<div id="alt-serit"></div>',
    '<nav id="gezinti" aria-label="Bölümler"></nav>',
    '<section id="sayfa" aria-hidden="true"></section>',
    '<div id="perde"></div>',
    '<div id="pencere-kok"></div>',
    '<div id="ogretici" hidden></div>',
  ]) parca.appendChild(ogeYap(html))
  maden.after(parca)
}

// ── Uçan sikkeler (§5.6) ──
function sikkeHavuzu(kok) {
  const l = []
  for (let i = 0; i < SIKKE_HAVUZ; i++) {
    const el = ogeYap(`<i class="ucan-sikke">${ikon('para')}</i>`)
    kok.appendChild(el)
    l.push(el)
  }
  let sira = 0
  return function ucur(x0, y0, adet = 8) {
    const hedef = B.ust.paraKonumu()
    if (!hedef) return
    let ilk = true
    for (let k = 0; k < adet; k++) {
      const el = l[sira++ % l.length]
      el.style.display = 'block'
      const dx = (Math.random() - 0.5) * 50, dy = -30 - Math.random() * 40
      const sure = 650 + Math.random() * 250
      const a = el.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${hedef.x}px, ${hedef.y}px) scale(.8)`, opacity: 1 },
      ], { duration: sure, delay: k * 40, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' })
      a.onfinish = () => {
        el.style.display = 'none'
        a.cancel()
        B.ust.paraVurgu()
        if (ilk) { ilk = false; ses('para') }
      }
    }
  }
}

function tikla(e) {
  const el = e.target.closest('[data-eylem]')
  if (!el || !B.kok.contains(el)) return
  if (el.disabled) return
  const f = B.eylemler[el.dataset.eylem]
  if (f) {
    try { f(el, e) } catch (h) { console.error(h) }
  }
}

export const Arayuz = {
  dunya: null,

  kur(kok, s) {
    kokKur(kok)
    B = {
      kok,
      eylem: s.eylem,
      reklamIzle: s.reklamIzle,
      satinAl: s.satinAl,
      durumAl: s.durumAl,
      yerlesim: s.yerlesim,
      sahne: s.sahne,
      kaydirKonumu: s.kaydirKonumu || ((y, o) => yayinla({ tip: 'kaydir', y, anim: o ? o.anim : true })),
      dunya: kok.querySelector('#dunya'),
      maden: kok.querySelector('#maden'),
      eylemler: {},
      W: kok.querySelector('#maden').clientWidth || 390,
      kaydirY: 0,
      gorunurYuk: 600,
    }
    B.yer = B.yerlesim(B.W)
    this.dunya = B.dunya
    B.ui = this
    B.bildir = (tur, metin, sec) => B.bildirim.bildir(tur, metin, sec)
    B.ucanSikke = sikkeHavuzu(kok)
    // Bir istasyonu görünür kılacak kaydırma
    B.istasyonaKaydir = (ist, anim = true) => {
      if (!madenMi(ist)) { B.kaydirKonumu(0, { anim }); return }
      const i = +ist.slice(1)
      const y = B.yer.satirY(i) - 40
      if (y < B.kaydirY || y + 200 > B.kaydirY + B.gorunurYuk) B.kaydirKonumu(Math.max(0, y), { anim })
    }

    B.bildirim = Bildirim.kur(B)
    B.ust = Ust.kur(B)
    B.kartlar = Kartlar.kur(B)
    B.alt = Alt.kur(B)
    B.pencere = Pencereler.kur(B)
    B.sayfa = Sayfalar.kur(B)
    B.ogretici = Ogretici.kur(B)
    moduller = [B.ust, B.kartlar, B.alt, B.pencere, B.sayfa, B.ogretici]

    kok.addEventListener('click', tikla)
    Veriyolu.dinle('uzunBasma', (o) => B.kartlar.uzunBasma(o.el))
    Veriyolu.dinle('uzunBasmaBitti', () => B.kartlar.uzunBitti())
    Veriyolu.dinle('satinAlindi', () => B.bildir('basari', 'Satın alındı!'))
  },

  kare(durum, gorunum, simdiMs) {
    if (!B) return
    if (!ilkKare) ilkKare = simdiMs
    B.kaydirY = gorunum.kaydirY
    B.gorunurYuk = gorunum.yuk || B.gorunurYuk
    if (gorunum.gen && gorunum.gen !== sonW) {
      sonW = gorunum.gen
      B.W = gorunum.gen
      B.yer = B.yerlesim(B.W)
      B.kartlar.yerlestir(durum)
    }
    if (simdiMs - son10 >= 100) {
      const dt = son10 ? Math.min(0.5, (simdiMs - son10) / 1000) : 0.1
      son10 = simdiMs
      for (const m of moduller) if (m.kare10) m.kare10(durum, dt, simdiMs)
    }
    if (simdiMs - son4 >= 250) {
      son4 = simdiMs
      for (const m of moduller) if (m.kare4) m.kare4(durum, simdiMs)
    }
    // Açılışta bekleyen hikâye sahneleri (yükleme perdesi kalktıktan sonra)
    if (!hikayeBasladi && simdiMs - ilkKare > 900) {
      hikayeBasladi = true
      for (const id of durum.hikaye.bekleyen) B.pencere.hikayeSirala(id)
    }
    if (simdiMs - son2 >= 500) {
      son2 = simdiMs
      for (const m of moduller) if (m.kare2) m.kare2(durum, simdiMs)
    }
  },

  olaylar(liste, durum) {
    if (!B) return
    for (let i = 0; i < liste.length; i++) {
      const o = liste[i]
      for (const m of moduller) if (m.olay) {
        try { m.olay(o, durum) } catch (h) { console.error(h) }
      }
    }
  },

  modalAc(ad, veri) { if (B) B.pencere.ac(ad, veri || {}) },
  sayfaAc(ad) { if (B) B.sayfa.ac(ad) },
  bildir(tur, metin, sec) { if (B) B.bildirim.bildir(tur, metin, sec) },

  // Kaydırma: dokunulan öğe bir arayüz denetimi mi?
  dokunusHedefi(el) {
    if (!el || !el.closest) return null
    return el.closest('button, a, input, .kart, .yonetici-rozet, .cip, [data-eylem]') ? 'ui' : null
  },

  ogreticiHedef() { return B ? B.ogretici.hedef() : null },
}
