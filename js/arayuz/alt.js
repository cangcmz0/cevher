// ════════════════════════════════════════════════════════════════
//  ALT (Paket C, §4.6–4.7) — alt şerit (durum yuvası, akış göstergesi,
//  Topla x2) ve beş sekmeli gezinti.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, ozellik, sayac } from './ortak.js'

const SEKMELER = [
  ['maden', 'Maden', 'kazma'],
  ['harita', 'Harita', 'harita'],
  ['yoneticiler', 'Yöneticiler', 'yonetici'],
  ['arastirma', 'Araştırma', 'arastirma'],
  ['magaza', 'Mağaza', 'magaza'],
]
const HALKA_C = 2 * Math.PI * 34

export function kur(B) {
  const serit = B.kok.querySelector('#alt-serit')
  serit.innerHTML = `
    <button class="durum-yuva bos" data-eylem="darbogaz" aria-live="polite">${ikon('uyari')}<span class="durum-metin"><b></b><span></span></span></button>
    <button class="akis" data-eylem="darbogaz" aria-label="Üretim akışı">
      <span class="akis-ikon" data-a="0">${ikon('cevher.zonguldak')}<i class="unlem">!</i></span>${ikon('ileri')}
      <span class="akis-ikon" data-a="1">${ikon('asansor')}<i class="unlem">!</i></span>${ikon('ileri')}
      <span class="akis-ikon" data-a="2">${ikon('sepet')}<i class="unlem">!</i></span>
    </button>
    <button class="topla gizli" data-eylem="topla" aria-label="Kazanç x2">
      <svg class="geri-halka" viewBox="0 0 98 74" aria-hidden="true"><rect x="3" y="3" width="92" height="68" rx="25" fill="none" stroke="rgba(246,196,83,.95)" stroke-width="3" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
      ${ikon('topla')}<span class="topla-metin"><b>Topla</b><strong class="sayi">x2</strong></span><i class="reklam-rozet">${ikon('oynat')}</i>
    </button>`
  const nav = B.kok.querySelector('#gezinti')
  nav.setAttribute('role', 'tablist')
  nav.innerHTML = SEKMELER.map(([k, ad, ik]) => `<button class="sekme" role="tab" data-eylem="sekme" data-sekme="${k}" aria-selected="${k === 'maden'}">${ikon(ik)}<span>${ad}</span><i class="nokta"></i></button>`).join('')

  const el = {
    yuva: serit.querySelector('.durum-yuva'),
    satir1: serit.querySelector('.durum-metin b'),
    satir2: serit.querySelector('.durum-metin span'),
    akis: [...serit.querySelectorAll('.akis-ikon')],
    topla: serit.querySelector('.topla'),
    toplaYazi: serit.querySelector('.topla-metin strong'),
    halka: serit.querySelector('.geri-halka rect'),
    reklamRozet: serit.querySelector('.reklam-rozet'),
    sekmeler: [...nav.querySelectorAll('.sekme')],
  }
  let sonDarbogaz = null
  let toplaGorunur = false
  let reklamda = false
  let halkaTop = 0

  function kare4(d) {
    const c = d.calisma
    const db = c.darbogaz
    if (db !== sonDarbogaz) {
      const m = db ? A.DARBOGAZ_METIN[db] : null
      if (m) {
        yaz(el.satir1, m[0])
        yaz(el.satir2, m[1])
        el.yuva.classList.remove('salla')
        void el.yuva.offsetWidth
        if (sonDarbogaz) el.yuva.classList.add('salla')
      }
      sinif(el.yuva, 'bos', !m)
      el.yuva.setAttribute('aria-hidden', m ? 'false' : 'true')
      el.yuva.tabIndex = m ? 0 : -1
      const sorun = db === 'asansor' || db === 'asansorManuel' ? 1 : db === 'depo' || db === 'depoManuel' ? 2 : -1
      for (let k = 0; k < 3; k++) sinif(el.akis[k], 'sorun', k === sorun)
      sonDarbogaz = db
    }
    // Topla x2
    const acik = d.oyuncu.lv >= 2
    if (acik !== toplaGorunur) {
      toplaGorunur = acik
      sinif(el.topla, 'gizli', !acik)
      if (acik) {
        el.topla.classList.remove('cikis')
        void el.topla.offsetWidth
        el.topla.classList.add('cikis')
      }
    }
    if (acik) {
      const kalan = d.takviye.bitis - d.zaman
      const aktif = kalan > 0
      sinif(el.topla, 'aktif', aktif)
      yaz(el.toplaYazi, aktif ? sayac(kalan) : 'x2')
      if (aktif) {
        if (kalan > halkaTop) halkaTop = kalan
        ozellik(el.halka, 'stroke-dashoffset', String(Math.round((1 - kalan / halkaTop) * 100)))
      } else halkaTop = 0
      gizle(el.reklamRozet, !!d.satin.reklamsiz)
    }
  }

  function darbogazEylem() {
    const d = B.durumAl()
    const db = d.calisma.darbogaz
    if (!db) { B.pencere.ac('yukseltme', { istasyon: 'asansor' }); return }
    const ist = db.startsWith('asansor') ? 'asansor' : 'depo'
    B.istasyonaKaydir(ist)
    if (db.endsWith('Manuel')) B.pencere.ac('yonetici', { istasyon: ist })
    else B.pencere.ac('yukseltme', { istasyon: ist })
  }
  B.eylemler.darbogaz = darbogazEylem

  B.eylemler.topla = async () => {
    if (reklamda) return
    const d = B.durumAl()
    if (d.takviye.bitis >= d.zaman + A.TAKVIYE_SINIR_SAAT * 3600 - 1) {
      B.bildir('bilgi', 'Kazanç x2 en fazla 4 saat birikir.')
      return
    }
    reklamda = true
    el.topla.classList.add('bekliyor')
    let ok = false
    try { ok = await B.reklamIzle('takviye') } catch { ok = false }
    el.topla.classList.remove('bekliyor')
    reklamda = false
    if (!ok) { B.bildir('bilgi', 'Reklam yüklenemedi, sonra tekrar dene'); return }
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
