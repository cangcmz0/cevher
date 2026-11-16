// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  SAYFALAR (Paket C, §4.8, görsel yön 2) — sekme sayfalarının iskeleti.
//  • Sayfa HUD'un altından gezintinin üstüne kadar uzanır (referans 2/3
//    ekranlarındaki gibi başlık çubuğu yok, HUD görünür kalır).
//  • Her sayfa kendi modülündedir: kur(B, govde) → { kare2, olay, kapat }.
//    Sayfa her açılışta yeniden kurulur, açıkken 2 Hz güncellenir.
//  • Açılış/kapanış Veriyolu'na 'sayfa' olarak yayınlanır (ana.js sayfa
//    açıkken sahne çizimini durdurur, benzetim sürer).
//  • Sayfa adı ve alt satırı üst bilgi çubuğunda gösterilir: her modül
//    baslik(d) → { ad, alt } verir; 'sayfa' olayı { ad, baslik, alt } taşır,
//    alt satır değişince 'sayfa-baslik' yayınlanır, sayfa.baslik() son
//    değeri döner. Üst çubukta [data-sayfa-baslik] öğesi yoksa aynı yazı
//    sayfanın üstündeki ince şeritte görünür (gövde içinde başlık yok).
// ════════════════════════════════════════════════════════════════
import { yayinla } from './ortak.js'
import * as Harita from './harita.js'
import * as Genisletme from './genisletme.js'
import * as Arastirma from './arastirma.js'
import * as Dukkan from './dukkan.js'

const MODULLER = { harita: Harita, yoneticiler: Genisletme, arastirma: Arastirma, magaza: Dukkan }
const ADLAR = { harita: 'Harita', yoneticiler: 'Yöneticiler', arastirma: 'Araştırma', magaza: 'Mağaza' }

export function kur(B) {
  const kap = B.kok.querySelector('#sayfa')
  kap.innerHTML = '<header class="sayfa-bas" aria-live="polite"><h2></h2><small></small></header><div class="sayfa-govde"></div>'
  const govde = kap.querySelector('.sayfa-govde')
  const bas = { h: kap.querySelector('.sayfa-bas h2'), alt: kap.querySelector('.sayfa-bas small') }
  let acik = null
  let aktif = null
  let baslikSon = null

  // Sayfa adı ve alt satırı (modülün baslik(d) işlevinden)
  function baslikHesapla(ad, d) {
    const M = MODULLER[ad]
    let b = null
    try { b = M && M.baslik ? M.baslik(d) : null } catch { b = null }
    return { ad, baslik: (b && b.ad) || ADLAR[ad] || ad, alt: (b && b.alt) || '' }
  }
  function baslikYaz(b) {
    if (bas.h.textContent !== b.baslik) bas.h.textContent = b.baslik
    if (bas.alt.textContent !== b.alt) bas.alt.textContent = b.alt
    kap.dataset.baslik = b.baslik
  }

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
    kap.dataset.sayfa = ad
    baslikSon = baslikHesapla(ad, B.durumAl())
    baslikYaz(baslikSon)
    kap.classList.add('acik')
    kap.setAttribute('aria-hidden', 'false')
    B.alt.sekmeSec(ad)
    yayinla({ tip: 'sayfa', ad, baslik: baslikSon.baslik, alt: baslikSon.alt })
    kare2(B.durumAl())
  }
  function kapat() {
    if (!acik) { B.alt.sekmeSec('maden'); return }
    if (aktif && aktif.kapat) aktif.kapat()
    acik = null
    aktif = null
    baslikSon = null
    delete kap.dataset.sayfa
    kap.classList.remove('acik')
    kap.setAttribute('aria-hidden', 'true')
    B.alt.sekmeSec('maden')
    yayinla({ tip: 'sayfa', ad: 'maden' })
  }
  B.eylemler['sayfa-kapat'] = () => kapat()

  function kare2(d) {
    if (acik && aktif && aktif.kare2) aktif.kare2(d)
    if (!acik) return
    const b = baslikHesapla(acik, d)
    if (!baslikSon || b.baslik !== baslikSon.baslik || b.alt !== baslikSon.alt) {
      baslikSon = b
      baslikYaz(b)
      yayinla({ tip: 'sayfa-baslik', ad: acik, baslik: b.baslik, alt: b.alt })
    }
  }
  function olay(o, d) {
    if (acik && aktif && aktif.olay) aktif.olay(o, d)
  }

  return { ac, kapat, kare2, olay, acik: () => acik, baslik: () => baslikSon, yenile: () => { if (acik) ac(acik) } }
}
