// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  HAZİNE DAMARI (§10) — damar görünüm dışındayken maden görünümünün
//  kenarında yön işareti ("Hazine!" ↑/↓); dokununca damara kaydırır.
//  Toplanınca ödül (sikke ya da elmas) üst çubuktaki sayaca uçar.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { ogeYap, sinif, gizle } from './ortak.js'

export function kur(B) {
  const ust = B.kok.querySelector('#maden-ust')
  const el = ogeYap(`<button class="hazine-isaret" data-eylem="hazine-git" aria-label="Hazine damarına git" hidden>
    <i class="hz-ikon">${ikon('para')}</i><b>Hazine!</b><i class="hz-ok">${ikon('yukari')}</i></button>`)
  ust.appendChild(el)
  const ikonEl = el.querySelector('.hz-ikon')
  const ist = B.kok.querySelector('#istatistik'), altSerit = B.kok.querySelector('#alt-serit')
  let sonTur = 'altin'

  B.eylemler['hazine-git'] = () => {
    const d = B.durumAl()
    const h = d.calisma && d.calisma.hazine
    const p = h && B.sahne.hazineKonumu(h)
    if (!p) return
    B.kaydirKonumu(Math.max(0, p.dunyaY - B.gorunurYuk * 0.45), { anim: true })
  }

  // Görünür bant (#oyun koordinatı): istatistik şeridinin altı ile alt şeridin üstü arası.
  // o: işaretin bulunduğu katmanın (#maden-ust) #oyun içindeki üst kenarı
  function bant() {
    const k = B.kok.getBoundingClientRect()
    const u = ist ? ist.getBoundingClientRect().bottom - k.top : 0
    const a = altSerit ? altSerit.getBoundingClientRect().top - k.top : k.height
    return { u, a, o: ust.getBoundingClientRect().top - k.top }
  }

  function kare10(d) {
    const h = d.calisma && d.calisma.hazine
    const p = h && !(B.sayfa && B.sayfa.acik && B.sayfa.acik()) ? B.sahne.hazineKonumu(h) : null
    if (!p) { gizle(el, true); return }
    const { u, a, o } = bant()
    const yukarida = p.y < u + 14, asagida = p.y > a - 14
    gizle(el, !(yukarida || asagida))
    if (!(yukarida || asagida)) return
    sinif(el, 'asagi', asagida)
    el.style.top = Math.round((asagida ? a - 48 : u + 8) - o) + 'px'
    if (h.tur !== sonTur) {
      sonTur = h.tur
      ikonEl.innerHTML = ikon(h.tur === 'elmas' ? 'elmas' : 'para')
      sinif(el, 'elmas', h.tur === 'elmas')
    }
  }

  function olay(o) {
    if (o.tip !== 'hazineAlindi') return
    const p = B.sahne.hazineKonumu(o)
    if (!p) return
    if (o.tur === 'elmas') B.ucanSikke(p.x, p.y, Math.min(8, o.elmas + 3), 'elmas')
    else B.ucanSikke(p.x, p.y, 12)
  }

  return { kare10, olay }
}
