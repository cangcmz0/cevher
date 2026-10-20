// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  ÜST (görsel yön 2) — HUD (madenci portresi, bölge adı, görev
//  ilerleme çubuğu, para ve elmas hapları, dişli) ve üç sütunlu
//  istatistik şeridi (Günlük Üretim, Depo Doluluğu, Gelir).
//  • Oyuncu seviyesi yok: ilerleme bölge görevleri ve parayla ölçülür.
//  • Para sayacı gerçek değere 250 ms zaman sabitiyle yaklaşır;
//    harcamada hemen düşer. Metin en çok 10/sn ve yalnız değişince yazılır.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, E, yaz, sinif, cubuk, bicim, oranYazi, tam, yuzde, artiYuzde, bolgeAl, bolgeAdi, canlandir, PARLA, ozellik } from './ortak.js'
import { uretimArtisi, gorevDurumu } from '../benzetim.js'
import { gorevAl } from './harita.js'


export function kur(B) {
  const ust = B.kok.querySelector('#ust')
  ust.innerHTML = `
    <button class="ust-avatar" data-eylem="avatar" aria-label="Oyuncu"><img src="img/ref/avatar.png" alt="" draggable="false"></button>
    <b class="ust-seviye">Zonguldak</b>
    <button class="ust-xp" data-eylem="ust-gorev" role="progressbar" aria-label="Bölge görevleri"><i></i><span class="sayi">Görev 0 / 15</span></button>
    <div class="ust-para hap"><img class="hud-ikon" src="img/ref/hud-para.png" alt="" draggable="false"><b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Para al">${ikon('arti')}</button></div>
    <div class="ust-elmas hap"><img class="hud-ikon" src="img/ref/hud-elmas.png" alt="" draggable="false"><b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Elmas al">${ikon('arti')}</button></div>
    <button class="ust-ayar" data-eylem="ayarlar" aria-label="Ayarlar">${ikon('ayar')}</button>`
  const ist = B.kok.querySelector('#istatistik')
  ist.innerHTML = `
    <button class="ist-sutun" data-eylem="istatistik" data-k="0"><span class="ist-ikon komur"><img src="${B.sahne.simgeAdres('cevher', B.durumAl().aktifBolge, 50) || 'img/ref/ist-komur.png'}" alt="" draggable="false"></span>
      <span class="ist-metin"><small>Günlük Üretim</small><b class="sayi uretim">0/sn</b><em class="ist-artis notr"><i class="ok"></i><span>%0</span></em></span></button>
    <button class="ist-sutun" data-eylem="istatistik" data-k="1"><span class="ist-ikon araba"><img src="${B.sahne.simgeAdres('vagon', B.durumAl().aktifBolge, 40) || 'img/ref/ist-araba.png'}" alt="" draggable="false"></span>
      <span class="ist-metin"><small>Depo Doluluğu</small><b class="sayi depo">%0</b><span class="cubuk ist-depo"><i></i></span></span></button>
    <button class="ist-sutun" data-eylem="istatistik" data-k="2"><span class="ist-ikon kilit"><img src="${B.sahne.simgeAdres('sikke', '', 38) || 'img/ref/ist-kilit.png'}" alt="" draggable="false"></span>
      <span class="ist-metin"><small>Gelir</small><span class="ist-gelir">${ikon('para')}<b class="sayi gelir">+0/sn</b><i class="x2-rozet">x2</i></span></span></button>`

  const el = {
    seviye: ust.querySelector('.ust-seviye'),
    xp: ust.querySelector('.ust-xp'),
    xpYazi: ust.querySelector('.ust-xp span'),
    paraHap: ust.querySelector('.ust-para'),
    paraIkon: ust.querySelector('.ust-para > .hud-ikon'),
    para: ust.querySelector('.ust-para b'),
    elmas: ust.querySelector('.ust-elmas b'),
    elmasHap: ust.querySelector('.ust-elmas'),
    elmasIkon: ust.querySelector('.ust-elmas > .hud-ikon'),
    uretim: ist.querySelector('.uretim'),
    artis: ist.querySelector('.ist-artis'),
    artisYazi: ist.querySelector('.ist-artis span'),
    depo: ist.querySelector('.depo'),
    depoCubuk: ist.querySelector('.ist-depo'),
    gelirKutu: ist.querySelector('.ist-gelir'),
    gelir: ist.querySelector('.gelir'),
    cevherIkon: ist.querySelector('.ist-ikon.komur img'),
    vagonIkon: ist.querySelector('.ist-ikon.araba img'),
  }
  let istBolge = B.durumAl().aktifBolge

  let gosterilenPara = null
  let sonGorev = -1, sonGorevBolge = ''

  const BILGI = ['Bütün katların saniyelik üretimi.', 'Depodaki cevherin doluluk oranı.', 'Satıştan gelen saniyelik kazanç.']
  B.eylemler.istatistik = (b) => B.bildir('bilgi', BILGI[+b.dataset.k] || BILGI[0])
  B.eylemler['magaza-yakinda'] = () => B.bildir('bilgi', 'Mağaza yakında açılıyor.')
  // Görev çubuğu: görev bittiyse ödülü alır, yoksa görev listesini açar
  B.eylemler['ust-gorev'] = (btn) => {
    const d = B.durumAl(), g = gorevDurumu(d, bolgeAl(d))
    if (g && (g.hazir || g.simdi >= g.hedef) && gorevAl(B, btn)) return
    B.pencere.ac('gorevler', {})
  }

  function kare10(d, dt) {
    const b = bolgeAl(d)
    const gercek = b.para
    if (gosterilenPara === null || gercek < gosterilenPara) gosterilenPara = gercek
    else gosterilenPara += (gercek - gosterilenPara) * (1 - Math.exp(-dt / 0.25))
    if (Math.abs(gercek - gosterilenPara) < Math.max(0.5, gercek * 1e-4)) gosterilenPara = gercek
    yaz(el.para, bicim(gosterilenPara))
    yaz(el.elmas, tam(d.oyuncu.elmas))
    // Bölge adı ve görev ilerlemesi (Idle Miner'daki gibi seviye yerine)
    const n = A.GOREVLER.length, g = Math.min(n, b.gorev.sira)
    const gd = g < n ? gorevDurumu(d, b) : null
    const hazir = !!gd && (gd.hazir || gd.simdi >= gd.hedef)
    yaz(el.seviye, bolgeAdi(d.aktifBolge))
    yaz(el.xpYazi, g >= n ? 'Bölge Ustası' : hazir ? 'Görev hazır · Al' : 'Görev ' + g + ' / ' + n)
    sinif(el.xp, 'hazir', hazir)
    cubuk(el.xp, g / n)
    if (sonGorevBolge === d.aktifBolge && g > sonGorev) canlandir(el.xp.firstElementChild, PARLA, 500)
    sonGorev = g; sonGorevBolge = d.aktifBolge
  }

  function kare4(d) {
    const b = bolgeAl(d)
    // Bölge değişince cevher ve vagon simgeleri o bölgenin cevheriyle yeniden çizilir
    if (istBolge !== d.aktifBolge) {
      istBolge = d.aktifBolge
      const c = B.sahne.simgeAdres('cevher', istBolge, 50), v = B.sahne.simgeAdres('vagon', istBolge, 40)
      if (c) el.cevherIkon.setAttribute('src', c)
      if (v) el.vagonIkon.setAttribute('src', v)
    }
    const um = oranYazi(E.toplamUretim(d, b))
    yaz(el.uretim, um)
    // Dar sütun (~70 px): uzun değerlerde yazı küçülür
    ozellik(el.uretim, '--uy', Math.min(15, Math.floor((72 / (um.length * 0.54)) * 2) / 2) + 'px')
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
    const gm = '+' + oranYazi(d.calisma.gelirEma)
    yaz(el.gelir, gm)
    // Dar sütun: uzun değerlerde yazı küçülür (taşmasın)
    const uzun = gm.length > 8
    sinif(el.gelirKutu, 'uzun', uzun)
    ozellik(el.gelir, '--gy', Math.min(15, Math.floor(((uzun ? 66 : 49) / (gm.length * 0.56)) * 2) / 2) + 'px')
    sinif(el.gelirKutu, 'x2', E.takviyeAktif(d))
  }

  return {
    kare10,
    kare4,
    paraKonumu() {
      const r = el.paraIkon.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
      return { x: r.left - k.left + r.width / 2, y: r.top - k.top + r.height / 2 }
    },
    paraVurgu() { canlandir(el.paraHap, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], 160) },
    elmasKonumu() {
      const r = el.elmasIkon.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
      return { x: r.left - k.left + r.width / 2, y: r.top - k.top + r.height / 2 }
    },
    elmasVurgu() { canlandir(el.elmasHap, [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], 180) },
  }
}
