// ════════════════════════════════════════════════════════════════
//  SAYFALAR (Paket C, §4.8, görsel yön 2) — sekme sayfalarının iskeleti.
//  • Sayfa HUD'un altından gezintinin üstüne kadar uzanır (referans 2/3
//    ekranlarındaki gibi başlık çubuğu yok, HUD görünür kalır).
//  • Her sayfa kendi modülündedir: kur(B, govde) → { kare2, olay, kapat }.
//    Sayfa her açılışta yeniden kurulur, açıkken 2 Hz güncellenir.
//  • Açılış/kapanış Veriyolu'na 'sayfa' olarak yayınlanır (ana.js sayfa
//    açıkken sahne çizimini durdurur, benzetim sürer).
// ════════════════════════════════════════════════════════════════
import { yayinla } from './ortak.js'
import * as Harita from './harita.js'
import * as Genisletme from './genisletme.js'
import * as Arastirma from './arastirma.js'
import * as Dukkan from './dukkan.js'

const MODULLER = { harita: Harita, yoneticiler: Genisletme, arastirma: Arastirma, magaza: Dukkan }

export function kur(B) {
  const kap = B.kok.querySelector('#sayfa')
  kap.innerHTML = '<div class="sayfa-govde"></div>'
  const govde = kap.querySelector('.sayfa-govde')
  let acik = null
  let aktif = null

  // Sayfa modüllerinin alt pencerelerini (bölgeler, misyonlar, kontrat...) bir kez kaydet
  for (const M of Object.values(MODULLER)) if (M.hazirla) M.hazirla(B)

  function ac(ad) {
    const M = MODULLER[ad]
    if (!M) return
    if (aktif && aktif.kapat) aktif.kapat()
    acik = ad
    govde.innerHTML = ''
    govde.className = 'sayfa-govde sayfa-' + ad
    govde.scrollTop = 0
    aktif = M.kur(B, govde) || {}
    kap.classList.add('acik')
    kap.setAttribute('aria-hidden', 'false')
    B.alt.sekmeSec(ad)
    yayinla({ tip: 'sayfa', ad })
    kare2(B.durumAl())
  }
  function kapat() {
    if (!acik) { B.alt.sekmeSec('maden'); return }
    if (aktif && aktif.kapat) aktif.kapat()
    acik = null
    aktif = null
    kap.classList.remove('acik')
    kap.setAttribute('aria-hidden', 'true')
    B.alt.sekmeSec('maden')
    yayinla({ tip: 'sayfa', ad: 'maden' })
  }
  B.eylemler['sayfa-kapat'] = () => kapat()

  function kare2(d) {
    if (acik && aktif && aktif.kare2) aktif.kare2(d)
  }
  function olay(o, d) {
    if (acik && aktif && aktif.olay) aktif.olay(o, d)
  }

  return { ac, kapat, kare2, olay, acik: () => acik, yenile: () => { if (acik) ac(acik) } }
}
