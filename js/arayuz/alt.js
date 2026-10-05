// ════════════════════════════════════════════════════════════════
//  ALT (görsel yön 2) — alt bant ve sekmeler.
//  • Solda "Çevrimdışı Kazanç" paneli: bekleyen kazanç varsa miktar ve
//    süre (dokununca ×1 toplar); yoksa yöneticili katların 2 saatte
//    kazanacağı miktar (bilgi).
//  • Sağda sarı "2x Topla": bekleyen kazanç varsa ödüllü reklamla ×2
//    toplar; yoksa Kazanç x2 takviyesi (30 dk) başlatır (Lv. 2'den).
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { E, A, yaz, sinif, gizle, bicim, sayac, sure, bolgeAl } from './ortak.js'

const SEKMELER = [
  ['maden', 'Maden', 'kazma'],
  ['harita', 'Harita', 'harita'],
  ['yoneticiler', 'Yöneticiler', 'yonetici'],
  ['arastirma', 'Araştırma', 'arastirma'],
  ['magaza', 'Mağaza', 'magaza'],
]

const sureKisa = (sn) => (sn >= 3600 ? Math.floor(sn / 3600) + ' saat' : sure(sn))

export function kur(B) {
  const serit = B.kok.querySelector('#alt-serit')
  serit.innerHTML = `
    <button class="cevrimdisi-panel" data-eylem="cevrimdisi-panel">${ikon('topla')}<span class="metin"><small>Çevrimdışı Kazanç</small><span class="satir"><b class="sayi">+0</b><em>(2 saat)</em></span></span></button>
    <button class="topla2x" data-eylem="topla2x" aria-label="2x Topla"><span class="rozet2x">2x</span><span class="metin"><b>Topla</b><strong class="sayi">30 dk</strong></span><i class="reklam-rozet">${ikon('oynat')}</i></button>`
  const nav = B.kok.querySelector('#gezinti')
  nav.setAttribute('role', 'tablist')
  nav.innerHTML = SEKMELER.map(([k, ad, ik]) => `<button class="sekme" role="tab" data-eylem="sekme" data-sekme="${k}" aria-selected="${k === 'maden'}">${ikon(ik)}<span>${ad}</span><i class="nokta"></i></button>`).join('')

  const el = {
    panel: serit.querySelector('.cevrimdisi-panel'),
    panelMiktar: serit.querySelector('.cevrimdisi-panel b'),
    panelSure: serit.querySelector('.cevrimdisi-panel em'),
    topla: serit.querySelector('.topla2x'),
    toplaUst: serit.querySelector('.topla2x .metin b'),
    toplaAlt: serit.querySelector('.topla2x .metin strong'),
    reklam: serit.querySelector('.topla2x .reklam-rozet'),
    sekmeler: [...nav.querySelectorAll('.sekme')],
  }
  let reklamda = false

  function kare4(d) {
    const b = bolgeAl(d)
    const bc = d.bekleyenCevrimdisi
    const kalan = d.takviye.bitis - d.zaman
    sinif(el.panel, 'bekliyor', !!bc)
    if (bc) {
      yaz(el.panelMiktar, '+' + bicim(bc.miktar))
      yaz(el.panelSure, '(' + sureKisa(bc.sure) + ')')
      yaz(el.toplaUst, 'Topla')
      yaz(el.toplaAlt, bicim(bc.miktar * 2))
    } else {
      const sinir = (A.CEVRIMDISI_SINIR_SAAT + E.ar(d, 'gece')) * 3600
      yaz(el.panelMiktar, '+' + bicim(E.otoGelir(d, b) * sinir))
      yaz(el.panelSure, '(' + sureKisa(sinir) + ')')
      if (kalan > 0) { yaz(el.toplaUst, 'Aktif'); yaz(el.toplaAlt, sayac(kalan)) }
      else { yaz(el.toplaUst, 'Topla'); yaz(el.toplaAlt, A.TAKVIYE_DAKIKA + ' dk') }
    }
    sinif(el.topla, 'aktif', !bc && kalan > 0)
    sinif(el.topla, 'kilitli', !bc && d.oyuncu.lv < 2)
    gizle(el.reklam, !!d.satin.reklamsiz || (!bc && kalan > 0))
  }

  async function reklamla(yer) {
    reklamda = true
    el.topla.classList.add('bekliyor')
    let ok = false
    try { ok = await B.reklamIzle(yer) } catch { ok = false }
    el.topla.classList.remove('bekliyor')
    reklamda = false
    if (!ok) B.bildir('bilgi', 'Reklam yüklenemedi, sonra tekrar dene')
    return ok
  }

  function topla(kat, kaynakEl) {
    const s = B.eylem('cevrimdisiTopla', { kat })
    if (s && s.ok) {
      const r = kaynakEl.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
      B.ucanSikke(r.left - k.left + r.width / 2, r.top - k.top + r.height / 2, 14)
    }
  }

  B.eylemler['cevrimdisi-panel'] = (b) => {
    const d = B.durumAl()
    if (d.bekleyenCevrimdisi) topla(1, b)
    else B.bildir('bilgi', 'Uygulama kapalıyken yöneticili katlar 2 saate kadar kazanır.')
  }

  B.eylemler.topla2x = async (b) => {
    if (reklamda) return
    const d = B.durumAl()
    if (d.bekleyenCevrimdisi) {
      if (await reklamla('cevrimdisi')) topla(2, b)
      return
    }
    if (d.oyuncu.lv < 2) { B.bildir('bilgi', "2x Topla, Seviye 2'de açılır.") ; return }
    if (d.takviye.bitis >= d.zaman + A.TAKVIYE_SINIR_SAAT * 3600 - 1) {
      B.bildir('bilgi', 'Kazanç x2 en fazla 4 saat birikir.')
      return
    }
    if (!(await reklamla('takviye'))) return
    const s = B.eylem('takviye', { dakika: A.TAKVIYE_DAKIKA })
    if (s && s.ok) B.bildir('basari', 'Kazanç x2 başladı! 30 dk')
    else B.bildir('bilgi', 'Kazanç x2 en fazla 4 saat birikir.')
  }

  B.eylemler.sekme = (b) => {
    const s = b.dataset.sekme
    if (s === 'maden' || b.getAttribute('aria-selected') === 'true') B.sayfa.kapat()
    else B.sayfa.ac(s)
  }

  function sekmeSec(ad) {
    for (const s of el.sekmeler) {
      const sec = s.dataset.sekme === ad
      if ((s.getAttribute('aria-selected') === 'true') !== sec) {
        s.setAttribute('aria-selected', String(sec))
        if (sec) {
          s.classList.remove('zipla')
          void s.offsetWidth
          s.classList.add('zipla')
        }
      }
    }
  }

  return { kare4, sekmeSec }
}
