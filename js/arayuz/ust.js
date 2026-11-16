// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  ÜST (Fener ve Çini) — HUD (madenci portresi, bölge adı ve cevher
//  alt satırı, para ve elmas hapları, 44 px ayar düğmesi) ve üç
//  sütunlu istatistik panosu (Üretim, Depo Doluluğu, Gelir).
//  • Darboğaz varsa orta sütun "Asansör ▲ darboğaz" / "Depo ▲ darboğaz"
//    olur, kırmızı işaretlenir ve o istasyonun akışını gösterir;
//    dokununca Darboğaz kartıyla aynı yere götürür.
//  • Bölge görevleri alt şeritte (alt.js).
//  • Para sayacı gerçek değere 250 ms zaman sabitiyle yaklaşır;
//    harcamada hemen düşer. Metin en çok 10/sn ve yalnız değişince yazılır.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, E, yaz, sinif, gizle, cubuk, bicim, oranYazi, tam, yuzde, artiYuzde, bolgeAl, bolgeAdi, canlandir, ozellik } from './ortak.js'
import { uretimArtisi } from '../benzetim.js'

// Bölgenin alt satırı: önce cevher (dar ekranda kısalırsa cevher görünür kalsın)
const cevherSatiri = (kod) => { const b = A.BOLGE[kod] || A.BOLGELER[0]; return b.cevher + ' · ' + b.alt }

// Dar sütunda değer yazısı uzunluğa göre küçülür (16 px "value" ölçeği, en az 12 px)
const yaziBoyu = (alan, metin) => Math.max(12, Math.min(16, Math.floor((alan / (metin.length * 0.55)) * 2) / 2)) + 'px'

export function kur(B) {
  const ust = B.kok.querySelector('#ust')
  const d0 = B.durumAl()
  ust.innerHTML = `
    <button class="ust-avatar" data-eylem="avatar" aria-label="Oyuncu"><img src="img/ref/avatar.png" alt="" draggable="false"></button>
    <div class="ust-bolge"><b class="ust-ad">${bolgeAdi(d0.aktifBolge)}</b><small class="ust-cevher">${cevherSatiri(d0.aktifBolge)}</small></div>
    <div class="ust-para hap"><img class="hud-ikon" src="img/ref/hud-para.png" alt="" draggable="false"><b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Para al">${ikon('arti')}</button></div>
    <div class="ust-elmas hap"><img class="hud-ikon" src="img/ref/hud-elmas.png" alt="" draggable="false"><b class="sayi">0</b><button class="arti-btn" data-eylem="magaza-yakinda" aria-label="Elmas al">${ikon('arti')}</button></div>
    <button class="ust-ayar" data-eylem="ayarlar" aria-label="Ayarlar">${ikon('ayar')}</button>`
  const ist = B.kok.querySelector('#istatistik')
  ist.innerHTML = `
    <button class="ist-sutun" data-eylem="istatistik" data-k="0">
      <small class="ist-etiket"><img class="ist-ikon komur" src="${B.sahne.simgeAdres('cevher', d0.aktifBolge, 50) || 'img/ref/ist-komur.png'}" alt="" draggable="false"><span>Üretim</span></small>
      <b class="ist-deger sayi uretim">0/sn</b>
      <em class="ist-artis notr"><i class="ok"></i><span>%0</span></em></button>
    <button class="ist-sutun ist-tasima" data-eylem="istatistik" data-k="1">
      <small class="ist-etiket"><img class="ist-ikon araba" src="${B.sahne.simgeAdres('vagon', d0.aktifBolge, 40) || 'img/ref/ist-araba.png'}" alt="" draggable="false"><span class="ist-ad">Depo Doluluğu</span></small>
      <b class="ist-deger sayi depo">%0</b>
      <span class="cubuk ist-depo"><i></i></span></button>
    <button class="ist-sutun" data-eylem="istatistik" data-k="2">
      <small class="ist-etiket"><img class="ist-ikon kilit" src="${B.sahne.simgeAdres('sikke', '', 38) || 'img/ref/ist-kilit.png'}" alt="" draggable="false"><span>Gelir</span></small>
      <span class="ist-gelir"><b class="ist-deger sayi gelir">+0/sn</b><i class="x2-rozet">x2</i></span></button>`

  const el = {
    ad: ust.querySelector('.ust-ad'),
    cevher: ust.querySelector('.ust-cevher'),
    paraHap: ust.querySelector('.ust-para'),
    paraIkon: ust.querySelector('.ust-para > .hud-ikon'),
    para: ust.querySelector('.ust-para b'),
    elmas: ust.querySelector('.ust-elmas b'),
    elmasHap: ust.querySelector('.ust-elmas'),
    elmasIkon: ust.querySelector('.ust-elmas > .hud-ikon'),
    uretim: ist.querySelector('.uretim'),
    artis: ist.querySelector('.ist-artis'),
    artisYazi: ist.querySelector('.ist-artis span'),
    tasima: ist.querySelector('.ist-tasima'),
    tasimaAd: ist.querySelector('.ist-tasima .ist-ad'),
    depo: ist.querySelector('.depo'),
    depoCubuk: ist.querySelector('.ist-depo'),
    gelirKutu: ist.querySelector('.ist-gelir'),
    gelir: ist.querySelector('.gelir'),
    cevherIkon: ist.querySelector('.ist-ikon.komur'),
    vagonIkon: ist.querySelector('.ist-ikon.araba'),
  }
  let istBolge = d0.aktifBolge, adBolge = ''

  let gosterilenPara = null

  const BILGI = ['Bütün katların saniyelik üretimi.', 'Depodaki cevherin doluluk oranı.', 'Satıştan gelen saniyelik kazanç.']
  B.eylemler.istatistik = (b) => {
    // Darboğaz sütunu: Darboğaz kartı gibi o istasyona götürür
    if (b.dataset.k === '1' && B.durumAl().calisma.darbogaz && B.eylemler.darbogaz) { B.eylemler.darbogaz(b); return }
    B.bildir('bilgi', BILGI[+b.dataset.k] || BILGI[0])
  }
  B.eylemler['magaza-yakinda'] = () => B.bildir('bilgi', 'Mağaza yakında açılıyor.')

  function kare10(d, dt) {
    const b = bolgeAl(d)
    const gercek = b.para
    if (gosterilenPara === null || gercek < gosterilenPara) gosterilenPara = gercek
    else gosterilenPara += (gercek - gosterilenPara) * (1 - Math.exp(-dt / 0.25))
    if (Math.abs(gercek - gosterilenPara) < Math.max(0.5, gercek * 1e-4)) gosterilenPara = gercek
    const p = bicim(gosterilenPara)
    yaz(el.para, p)
    sinif(el.paraHap, 'uzun', p.length >= 9)
    yaz(el.elmas, tam(d.oyuncu.elmas))
    if (adBolge !== d.aktifBolge) {
      adBolge = d.aktifBolge
      yaz(el.ad, bolgeAdi(d.aktifBolge))
      yaz(el.cevher, cevherSatiri(d.aktifBolge))
    }
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
    // Sütun genişlikleri oyun.css ile aynı oranda (1 : 1,25 : 1), 10 px kenar boşluğu
    const sutun = (Math.min(480, B.W || 390) - 20) / 3.25
    const um = oranYazi(E.toplamUretim(d, b))
    yaz(el.uretim, um)
    ozellik(el.uretim, '--uy', yaziBoyu(sutun - 10, um))
    const a = uretimArtisi(d)
    const n = Math.round(a * 100)
    sinif(el.artis, 'notr', Math.abs(n) < 1)
    sinif(el.artis, 'eksi', n <= -1)
    yaz(el.artisYazi, artiYuzde(a))

    // Orta sütun: depo doluluğu ya da darboğazdaki istasyon
    const db = d.calisma.darbogaz
    const tur = db ? (db.startsWith('asansor') ? 'asansor' : 'depo') : null
    sinif(el.tasima, 'darbogaz', !!tur)
    gizle(el.depoCubuk, !!tur)
    if (tur) {
      yaz(el.tasimaAd, (tur === 'asansor' ? 'Asansör' : 'Depo') + ' ▲ darboğaz')
      const ak = oranYazi(tur === 'asansor' ? E.asansorAkis(d, b) : E.depoAkis(d, b))
      yaz(el.depo, ak)
      ozellik(el.depo, '--uy', yaziBoyu(sutun * 1.25 - 10, ak))
    } else {
      yaz(el.tasimaAd, 'Depo Doluluğu')
      const dol = Math.min(1, b.depo.stok / E.depoKap(d, b))
      yaz(el.depo, yuzde(dol))
      ozellik(el.depo, '--uy', '16px')
      cubuk(el.depoCubuk, dol)
      sinif(el.depoCubuk, 'orta', dol >= 0.85 && dol < 0.98)
      sinif(el.depoCubuk, 'dolu', dol >= 0.98)
    }

    const gm = '+' + oranYazi(d.calisma.gelirEma)
    const x2 = E.takviyeAktif(d)
    yaz(el.gelir, gm)
    ozellik(el.gelir, '--uy', yaziBoyu(sutun - 10 - (x2 ? 22 : 0), gm))
    sinif(el.gelirKutu, 'x2', x2)
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
