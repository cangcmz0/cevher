// ════════════════════════════════════════════════════════════════
//  ÖĞRETİCİ (Paket C, §2.13) — adım adım yönlendirme: hedefin etrafında
//  delik açılmış karartma, nabız atan el ve balon. 1–4. adımlarda
//  hedef dışındaki dokunuşlar engellenir; sonra el kalır, oyun serbest.
//  • Hedefler data-ogretici öznitelikleriyle ya da Sahne.ekranKonumu ile
//    bulunur (yalnız adım değişince ve 10 Hz'de bir konum okunur).
//  • Başka bir modal açıksa el onun kapatma düğmesini gösterir.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { E, A, ogeYap, bolgeAl } from './ortak.js'

const SON = 9

export function kur(B) {
  const kap = B.kok.querySelector('#ogretici')
  kap.innerHTML = `<div class="delik"></div>
    <div class="engel" data-k="ust"></div><div class="engel" data-k="alt"></div><div class="engel" data-k="sol"></div><div class="engel" data-k="sag"></div>
    <i class="el">${ikon('el')}</i><div class="balon" role="status"></div>`
  const el = {
    delik: kap.querySelector('.delik'),
    engeller: [...kap.querySelectorAll('.engel')],
    el: kap.querySelector('.el'),
    balon: kap.querySelector('.balon'),
  }
  // Engeller kendi içinde konumlanır (kök konumlu değil, kapsayıcı tam ekran)
  for (const e of el.engeller) e.style.cssText = 'position:absolute;pointer-events:auto'

  let sonHedef = null      // { x, y, w, h } #oyun koordinatı
  let sonAdim = -1
  let kaydirildi = -1

  const durum = () => B.durumAl()
  const adimNo = () => { const o = durum().ogretici; return o.bitti ? 0 : o.adim }
  const aktifMi = () => { const a = adimNo(); return a >= 1 && a < SON }
  const zorunlu = () => { const a = adimNo(); return a >= 1 && a <= 4 }

  function ilerle(adim) {
    B.eylem('ogretici', { adim })
    if (adim >= SON) {
      B.eylem('ogretici', { bitti: true })
      B.bildir('bilgi', A.OGRETICI_ADIMLARI[SON].metin)
    }
  }

  function yoneticiVar(b, ist) { return b.yoneticiler.some((y) => y.atanan === ist) }

  // Olaylar gelmese de (örneğin önceden yapılmışsa) adımı tamamla
  function kosulKontrol(d) {
    const a = adimNo()
    if (a === 0) {
      if (!d.ogretici.bitti && d.ogretici.adim === 0) ilerle(1)
      return
    }
    const b = bolgeAl(d)
    const c = d.calisma
    if (a === 1 && b.madenler[0].L > 1) { B.pencere.kapatSayfa(); ilerle(2) }
    else if (a === 2 && (b.madenler[0].kalan > 0 || yoneticiVar(b, 'm0'))) ilerle(3)
    else if (a === 3 && (c.asansor.durum !== 'bekle' || b.depo.stok > 0 || yoneticiVar(b, 'asansor'))) ilerle(4)
    else if (a === 4 && d.istatistik.satis > 0) { ilerle(5); B.bildir('basari', 'Harika! İlk kazancın geldi.') }
    else if (a === 5 && yoneticiVar(b, 'm0')) ilerle(6)
    else if (a === 6 && b.madenler.length >= 2) ilerle(7)
    else if (a === 7 && yoneticiVar(b, 'asansor')) ilerle(8)
    else if (a === 8 && yoneticiVar(b, 'depo')) ilerle(SON)
  }

  function elemanKutusu(sec) {
    const e = B.kok.querySelector(sec)
    if (!e || e.closest('[hidden]')) return null
    const r = e.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
    if (!r.width || !r.height) return null
    return { x: r.left - k.left, y: r.top - k.top, w: r.width, h: r.height }
  }
  function sahneKutusu(capa) {
    const p = B.sahne.ekranKonumu(capa, durum())
    if (!p) return null
    return { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }
  }

  // Şu anki adımın hedef kutusu (null: hedef yok, el gizli)
  function hedefBul(d) {
    const a = adimNo()
    if (a < 1 || a >= SON) return null
    const acikModal = B.pencere.acikModal()
    const acikSayfa = B.pencere.acikSayfa()
    const b = bolgeAl(d)
    // Hikâye sahnesi sürerken el gizlenir
    if (acikModal === 'hikaye') return null
    // İlgisiz bir modal açıksa önce onu kapattır
    if (acikModal && acikModal !== 'yonetici') return elemanKutusu('.modal [data-ogretici-modal]')
    if (a === 1) return acikSayfa === 'yukseltme' ? elemanKutusu('[data-ogretici="sheet-yukselt"]') : elemanKutusu('[data-ogretici="m0-yukselt"]')
    if (acikSayfa) return elemanKutusu('.alt-sayfa .sayfa-kapat')
    if (a === 2) return sahneKutusu('m0')
    if (a === 3) return sahneKutusu('asansor')
    if (a === 4) return sahneKutusu('depo')
    const yonAdim = { 5: ['m0', 'maden', 'm0-yonetici'], 7: ['asansor', 'asansor', 'asansor-yonetici'], 8: ['depo', 'depo', 'depo-yonetici'] }[a]
    if (yonAdim) {
      if (acikModal === 'yonetici') return elemanKutusu('.modal [data-ogretici="kirala"]:not([disabled])') || null
      if (b.para < E.kiralamaMaliyeti(d, b, yonAdim[1])) return null
      return elemanKutusu(`[data-ogretici="${yonAdim[2]}"]`)
    }
    if (a === 6) {
      if (acikModal) return elemanKutusu('.modal [data-ogretici-modal]')
      if (b.para < E.madenAcilis(d, b, 1)) return null
      return elemanKutusu('[data-ogretici="m1-ac"]')
    }
    return null
  }

  function yerlestir(h, a) {
    const pad = 6
    const W = B.kok.clientWidth, H = B.kok.clientHeight
    const x = h.x - pad, y = h.y - pad, w = h.w + pad * 2, hh = h.h + pad * 2
    const ds = el.delik.style
    ds.left = x + 'px'; ds.top = y + 'px'; ds.width = w + 'px'; ds.height = hh + 'px'
    const [u, al, so, sa] = el.engeller
    u.style.left = '0'; u.style.top = '0'; u.style.width = W + 'px'; u.style.height = Math.max(0, y) + 'px'
    al.style.left = '0'; al.style.top = (y + hh) + 'px'; al.style.width = W + 'px'; al.style.height = Math.max(0, H - y - hh) + 'px'
    so.style.left = '0'; so.style.top = y + 'px'; so.style.width = Math.max(0, x) + 'px'; so.style.height = hh + 'px'
    sa.style.left = (x + w) + 'px'; sa.style.top = y + 'px'; sa.style.width = Math.max(0, W - x - w) + 'px'; sa.style.height = hh + 'px'
    el.el.style.left = (h.x + h.w / 2) + 'px'
    el.el.style.top = (h.y + h.h / 2) + 'px'
    // Balon: hedefin üstünde yer varsa üstte, yoksa altta
    const metin = (A.OGRETICI_ADIMLARI[a] || {}).metin || ''
    if (el.balon.textContent !== metin) el.balon.textContent = metin
    const bx = Math.max(130, Math.min(W - 130, h.x + h.w / 2))
    el.balon.style.left = bx + 'px'
    if (h.y > 160) { el.balon.style.top = ''; el.balon.style.bottom = (H - h.y + 16) + 'px' }
    else { el.balon.style.bottom = ''; el.balon.style.top = (h.y + h.h + 58) + 'px' }
  }

  function kare10(d) {
    if (!d.ogretici) return
    kosulKontrol(d)
    const a = adimNo()
    // Sahne adımlarında (madenci, asansör, depo) üstteki etiket/rozet/kartlar dokunuşu yutmasın;
    // zorunlu adımlarda Darboğaz kartı gizlenir (dokunulacak yerin üstüne binebiliyor)
    const sahneAdimi = a >= 2 && a <= 4 && !B.pencere.acikMi()
    if (B.kok.classList.contains('ogretici-sahne') !== sahneAdimi) B.kok.classList.toggle('ogretici-sahne', sahneAdimi)
    if (B.kok.classList.contains('ogretici-zorunlu') !== zorunlu()) B.kok.classList.toggle('ogretici-zorunlu', zorunlu())
    if (a < 1 || a >= SON) {
      if (!kap.hidden) kap.hidden = true
      sonHedef = null
      return
    }
    const h = hedefBul(d)
    sonHedef = h
    if (!h) {
      if (!kap.hidden) kap.hidden = true
      return
    }
    // Hedef görünüm dışındaysa bir kez kaydır
    if (kaydirildi !== a && (h.y < 140 || h.y + h.h > B.kok.clientHeight - 140)) {
      kaydirildi = a
      if (a === 5 || a === 2) B.istasyonaKaydir('m0')
      else B.kaydirKonumu(1e9, { anim: true })
    }
    if (kap.hidden) kap.hidden = false
    kap.classList.toggle('serbest', !zorunlu())
    if (a !== sonAdim) sonAdim = a
    yerlestir(h, a)
  }

  function olay(o, d) {
    const a = adimNo()
    if (a < 1) return
    const b = bolgeAl(d)
    if (a === 1 && o.tip === 'yukseltildi') { B.pencere.kapatSayfa(); ilerle(2) }
    else if (a === 2 && o.tip === 'kaziBasladi') ilerle(3)
    else if (a === 3 && o.tip === 'asansorKalkti') ilerle(4)
    else if (a === 4 && o.tip === 'satis') { ilerle(5); B.bildir('basari', 'Harika! İlk kazancın geldi.') }
    else if (a === 5 && (o.tip === 'yoneticiTutuldu' || o.tip === 'yoneticiAtandi') && yoneticiVar(b, 'm0')) ilerle(6)
    else if (a === 6 && o.tip === 'madenAcildi') ilerle(7)
    else if (a === 7 && (o.tip === 'yoneticiTutuldu' || o.tip === 'yoneticiAtandi') && yoneticiVar(b, 'asansor')) ilerle(8)
    else if (a === 8 && (o.tip === 'yoneticiTutuldu' || o.tip === 'yoneticiAtandi') && yoneticiVar(b, 'depo')) ilerle(SON)
  }

  return {
    kare10, olay, zorunlu, aktifMi,
    // Test düzeneği: sayfa koordinatında hedef merkezi
    hedef() {
      if (!sonHedef || kap.hidden) return null
      const k = B.kok.getBoundingClientRect()
      return { x: k.left + sonHedef.x + sonHedef.w / 2, y: k.top + sonHedef.y + sonHedef.h / 2 }
    },
  }
}
