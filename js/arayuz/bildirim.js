// ════════════════════════════════════════════════════════════════
//  BİLDİRİM (Paket C, §4.11) — üst bildirimler. Aynı anda bir tane,
//  kuyruk en çok 3 (doluysa önce bilgi düşer). Giriş 220 ms, bekleme
//  2,2 sn (bilgi 2,6 sn), çıkış 180 ms. Aynı metin kuyruktaysa eklenmez.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { ogeYap } from './ortak.js'

const IKON = { kaynak: 'para', basari: 'tik', bilgi: 'bilgi' }

export function kur(B) {
  const kap = ogeYap('<div id="bildirimler" role="status" aria-live="polite"></div>')
  B.kok.appendChild(kap)
  const kuyruk = []
  let aktif = null
  let zaman = 0

  function ikonHtml(tur, sec) {
    if (tur === 'basari') return `<svg class="ik" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.95)"/><path d="M7 12.4l3.4 3.4L17.2 9" fill="none" stroke="#1E9E55" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    return ikon(sec && sec.ikon ? sec.ikon : IKON[tur] || 'bilgi')
  }

  function sonraki() {
    aktif = null
    const o = kuyruk.shift()
    if (!o) return
    const el = ogeYap(`<div class="bildirim ${o.tur}">${ikonHtml(o.tur, o.sec)}<span></span></div>`)
    el.querySelector('span').textContent = o.metin
    kap.appendChild(el)
    aktif = { el, o }
    requestAnimationFrame(() => el.classList.add('acik'))
    const bekle = o.tur === 'bilgi' ? 2600 : 2200
    clearTimeout(zaman)
    zaman = setTimeout(() => {
      el.classList.add('kapaniyor')
      setTimeout(() => { el.remove(); sonraki() }, 180)
    }, 220 + bekle)
  }

  function bildir(tur, metin, sec) {
    if (!metin) return
    if (aktif && aktif.o.metin === metin) return
    if (kuyruk.some((k) => k.metin === metin)) return
    if (kuyruk.length >= 3) {
      const i = kuyruk.findIndex((k) => k.tur === 'bilgi')
      kuyruk.splice(i >= 0 ? i : 0, 1)
    }
    kuyruk.push({ tur: tur || 'bilgi', metin, sec })
    if (!aktif) sonraki()
  }

  return { bildir }
}
