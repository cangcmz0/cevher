// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  VARDİYA COŞKUSU — alt bandın üst kenarında ince gösterge.
//  • Öğreticiden sonra madene her dokunuş göstergeyi doldurur, dokunulmazsa
//    yavaşça boşalır. Dolunca 15 sn bütün zincir 2 kat hızlı çalışır.
//  • Coşku sürerken gösterge altın rengine döner ve geri sayar; maden
//    görünümünün kenarları ısınır (#maden.cosku).
//  • Göstergeye dokunmak nasıl çalıştığını anlatır.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, ogeYap, yaz, sinif, gizle, canlandir, NABIZ } from './ortak.js'

export function kur(B) {
  const el = ogeYap(`<button class="cosku-serit" data-eylem="cosku-bilgi" aria-label="Vardiya Coşkusu" hidden>
    <i class="cs-dolum"></i><span class="cs-yazi">${ikon('yildirim')}<b>Coşku</b><small class="sayi"></small></span></button>`)
  B.kok.querySelector('#alt-serit').appendChild(el)
  const dolumEl = el.querySelector('.cs-dolum')
  const yaziEl = el.querySelector('.cs-yazi b')
  const ekEl = el.querySelector('.cs-yazi small')
  const maden = B.maden
  let sonOran = -1, sonAktif = null

  function kare10(d) {
    const k = d.calisma && d.calisma.cosku
    gizle(el, !d.ogretici.bitti || !k)
    if (!d.ogretici.bitti || !k) return
    const aktif = d.zaman < k.bitis
    const oran = aktif ? (k.bitis - d.zaman) / A.COSKU.sure : k.dolum
    if (aktif !== sonAktif) {
      sonAktif = aktif
      sinif(el, 'aktif', aktif)
      sinif(maden, 'cosku', aktif)
      yaz(yaziEl, aktif ? 'Coşku ×' + A.COSKU.carpan : 'Coşku')
    }
    if (Math.abs(oran - sonOran) > 0.004) {
      sonOran = oran
      dolumEl.style.transform = `scaleX(${Math.max(0, Math.min(1, oran)).toFixed(3)})`
    }
    sinif(el, 'bos', !aktif && k.dolum <= 0)
    yaz(ekEl, aktif ? Math.ceil(k.bitis - d.zaman) + ' sn' : k.dolum > 0 ? '%' + Math.floor(k.dolum * 100) : 'Madene dokun')
  }

  function olay(o) {
    if (o.tip === 'coskuBasladi') {
      canlandir(el, NABIZ, 320)
      B.bildir('basari', `Vardiya Coşkusu! ${A.COSKU.sure} sn bütün maden ${A.COSKU.carpan} kat hızlı.`)
    }
  }

  B.eylemler['cosku-bilgi'] = () => B.bildir('bilgi', `Madene dokundukça coşku dolar. Dolunca ${A.COSKU.sure} sn kazı, asansör ve kamyonlar ${A.COSKU.carpan} kat hızlı çalışır.`)

  return { kare10, olay }
}
