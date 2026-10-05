// ════════════════════════════════════════════════════════════════
//  ÜST (görsel yön 2) — HUD (madenci portresi, "Seviye 12", XP çubuğu,
//  para ve elmas hapları, dişli) ve üç sütunlu istatistik şeridi
//  (Günlük Üretim, Depo Doluluğu, Gelir).
//  • Para sayacı gerçek değere 250 ms zaman sabitiyle yaklaşır;
//    harcamada hemen düşer. Metin en çok 10/sn ve yalnız değişince yazılır.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { E, yaz, sinif, cubuk, bicim, oranYazi, tam, yuzde, artiYuzde, bolgeAl } from './ortak.js'
import { uretimArtisi } from '../benzetim.js'

const AVATAR_TOHUM = 77031

export function kur(B) {
  const ust = B.kok.querySelector('#ust')
  ust.innerHTML = `
    <button class="ust-avatar" data-eylem="avatar" aria-label="Oyuncu"><canvas width="116" height="116"></canvas></button>
    <b class="ust-seviye sayi">Seviye 1</b>
    <span class="ust-xp" role="progressbar" aria-label="Deneyim"><i></i><span class="sayi">0 / 100</span></span>
    <div class="ust-para hap">${ikon('para')}<b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Para al">${ikon('arti')}</button></div>
    <div class="ust-elmas hap">${ikon('elmas')}<b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Elmas al">${ikon('arti')}</button></div>
    <button class="ust-ayar" data-eylem="ayarlar" aria-label="Ayarlar">${ikon('ayar')}</button>`
  const ist = B.kok.querySelector('#istatistik')
  ist.innerHTML = `
    <button class="ist-sutun" data-eylem="istatistik" data-k="0"><span class="ist-ikon">${ikon('cevher.zonguldak')}</span>
      <span class="ist-metin"><small>Günlük Üretim</small><b class="sayi uretim">0/sn</b><em class="ist-artis notr"><i class="ok"></i><span>%0</span></em></span></button>
    <button class="ist-sutun" data-eylem="istatistik" data-k="1"><span class="ist-ikon">${ikon('sepet')}</span>
      <span class="ist-metin"><small>Depo Doluluğu</small><b class="sayi depo">%0</b><span class="cubuk ist-depo"><i></i></span></span></button>
    <button class="ist-sutun" data-eylem="istatistik" data-k="2"><span class="ist-ikon">${ikon('kasa')}</span>
      <span class="ist-metin"><small>Gelir</small><span class="ist-gelir">${ikon('para')}<b class="sayi gelir">+0/sn</b><i class="x2-rozet">x2</i></span></span></button>`

  const el = {
    seviye: ust.querySelector('.ust-seviye'),
    xp: ust.querySelector('.ust-xp'),
    xpYazi: ust.querySelector('.ust-xp span'),
    paraHap: ust.querySelector('.ust-para'),
    paraIkon: ust.querySelector('.ust-para > .ik'),
    para: ust.querySelector('.ust-para b'),
    elmas: ust.querySelector('.ust-elmas b'),
    avatar: ust.querySelector('.ust-avatar canvas'),
    uretim: ist.querySelector('.uretim'),
    artis: ist.querySelector('.ist-artis'),
    artisYazi: ist.querySelector('.ist-artis span'),
    depo: ist.querySelector('.depo'),
    depoCubuk: ist.querySelector('.ist-depo'),
    gelirKutu: ist.querySelector('.ist-gelir'),
    gelir: ist.querySelector('.gelir'),
  }
  try { B.sahne.portre(AVATAR_TOHUM, 2, el.avatar, 58) } catch {}

  let gosterilenPara = null
  let sonLv = 0

  const BILGI = ['Bütün katların saniyelik üretimi.', 'Depodaki cevherin doluluk oranı.', 'Satıştan gelen saniyelik kazanç.']
  B.eylemler.istatistik = (b) => B.bildir('bilgi', BILGI[+b.dataset.k] || BILGI[0])
  B.eylemler['magaza-yakinda'] = () => B.bildir('bilgi', 'Mağaza yakında açılıyor.')
  B.eylemler.avatar = (b) => { b.animate([{ transform: 'scale(1)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 220 }) }

  function kare10(d, dt) {
    const b = bolgeAl(d)
    const gercek = b.para
    if (gosterilenPara === null || gercek < gosterilenPara) gosterilenPara = gercek
    else gosterilenPara += (gercek - gosterilenPara) * (1 - Math.exp(-dt / 0.25))
    if (Math.abs(gercek - gosterilenPara) < Math.max(0.5, gercek * 1e-4)) gosterilenPara = gercek
    yaz(el.para, bicim(gosterilenPara))
    yaz(el.elmas, tam(d.oyuncu.elmas))
    const o = d.oyuncu
    const gerek = E.xpGerek(o.lv)
    yaz(el.seviye, 'Seviye ' + o.lv)
    yaz(el.xpYazi, tam(o.xp) + ' / ' + tam(gerek))
    cubuk(el.xp, o.lv >= 100 ? 1 : o.xp / gerek)
    if (sonLv && o.lv > sonLv) {
      el.xp.classList.remove('parla')
      void el.xp.offsetWidth
      el.xp.classList.add('parla')
    }
    sonLv = o.lv
  }

  function kare4(d) {
    const b = bolgeAl(d)
    yaz(el.uretim, oranYazi(E.toplamUretim(d, b)))
    const a = uretimArtisi(d)
    const n = Math.round(a * 100)
    sinif(el.artis, 'notr', Math.abs(n) < 1)
    sinif(el.artis, 'eksi', n <= -1)
    yaz(el.artisYazi, artiYuzde(a))
    const dol = Math.min(1, b.depo.stok / E.depoKap(d, b))
    yaz(el.depo, yuzde(dol))
    cubuk(el.depoCubuk, dol)
    sinif(el.depoCubuk, 'orta', dol >= 0.85 && dol < 0.98)
    sinif(el.depoCubuk, 'dolu', dol >= 0.98)
    yaz(el.gelir, '+' + oranYazi(d.calisma.gelirEma))
    sinif(el.gelirKutu, 'x2', E.takviyeAktif(d))
  }

  return {
    kare10,
    kare4,
    paraKonumu() {
      const r = el.paraIkon.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
      return { x: r.left - k.left + r.width / 2, y: r.top - k.top + r.height / 2 }
    },
    paraVurgu() {
      el.paraHap.classList.remove('vurgu')
      void el.paraHap.offsetWidth
      el.paraHap.classList.add('vurgu')
    },
  }
}
