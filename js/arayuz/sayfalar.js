// ════════════════════════════════════════════════════════════════
//  SAYFALAR (Paket C, §4.8, görsel yön 2) — ortak sayfa iskeleti,
//  Yöneticiler sayfası (portreli kart ızgarası, 3. referans ekranındaki
//  gibi) ve yakında açılacak bölümlerin yer tutucuları.
//  • Sayfa ilk açılışta kurulur, sonra yerinde güncellenir (2 Hz).
//  • Açılış/kapanış Veriyolu'na 'sayfa' olarak yayınlanır (ana.js
//    sayfa açıkken sahne çizimini durdurur, benzetim sürer).
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { E, A, yaz, sinif, gizle, bicim, tam, ogeYap, bolgeAl, nadirlik, yetenekEtki, yoneticiAdi, yetenekHali, sayac, sure, yayinla } from './ortak.js'

const BASLIK = { yoneticiler: 'Yöneticiler', harita: 'Harita', arastirma: 'Araştırma', magaza: 'Mağaza' }
const IKON = { harita: 'harita', arastirma: 'arastirma', magaza: 'magaza' }
const SEKME = [['maden', 'Katlar'], ['asansor', 'Asansör'], ['depo', 'Depo']]
const yerAdi = (ist) => (!ist ? 'Boşta' : ist === 'asansor' ? 'Asansör' : ist === 'depo' ? '1. Kat · Depo' : (+ist.slice(1) + 2) + '. Kat')

export function kur(B) {
  const kap = B.kok.querySelector('#sayfa')
  kap.innerHTML = `
    <header class="sayfa-baslik"><button class="geri-btn" data-eylem="sayfa-kapat" aria-label="Madene dön">${ikon('geri')}</button><h2>Sayfa</h2>
      <span class="mini-hap hap">${ikon('para')}<b class="sayi">0</b></span><span class="mini-hap hap elmas">${ikon('elmas')}<b class="sayi">0</b></span></header>
    <div class="sayfa-govde"></div>
    <footer class="sayfa-alt-bar" hidden></footer>`
  const el = {
    baslik: kap.querySelector('.sayfa-baslik h2'),
    para: kap.querySelector('.mini-hap b'),
    elmas: kap.querySelector('.mini-hap.elmas b'),
    govde: kap.querySelector('.sayfa-govde'),
    altBar: kap.querySelector('.sayfa-alt-bar'),
  }
  let acik = null
  let tip = 'maden'
  let imza = ''
  let guncelle = null

  function ac(ad) {
    if (!BASLIK[ad]) return
    acik = ad
    imza = ''
    yaz(el.baslik, BASLIK[ad])
    el.govde.scrollTop = 0
    if (ad === 'yoneticiler') guncelle = yoneticilerKur()
    else guncelle = yakindaKur(ad)
    kap.classList.add('acik')
    kap.setAttribute('aria-hidden', 'false')
    B.alt.sekmeSec(ad)
    yayinla({ tip: 'sayfa', ad })
    kare2(B.durumAl())
  }
  function kapat() {
    if (!acik) { B.alt.sekmeSec('maden'); return }
    acik = null
    kap.classList.remove('acik')
    kap.setAttribute('aria-hidden', 'true')
    B.alt.sekmeSec('maden')
    yayinla({ tip: 'sayfa', ad: 'maden' })
  }
  B.eylemler['sayfa-kapat'] = () => kapat()

  // ── Yakında ──
  function yakindaKur(ad) {
    el.govde.innerHTML = `<div class="yakinda">${ikon(IKON[ad] || 'harita')}<p>Bu bölüm yakında açılıyor.</p><button class="btn btn-turuncu" data-eylem="sayfa-kapat">Madene Dön</button></div>`
    gizle(el.altBar, true)
    return null
  }

  // ── Yöneticiler ──
  function yoneticilerKur() {
    el.govde.innerHTML = `
      <div class="bolumlu yon-sekmeler" role="group" aria-label="Yönetici türü">${SEKME.map(([k, a]) => `<button data-eylem="yon-sekme" data-tip="${k}" aria-pressed="${k === tip}">${a}</button>`).join('')}</div>
      <div class="yon-izgara"></div>
      <p class="sayfa-not">Yöneticiler istasyonu otomatik çalıştırır. Yeteneği kullanmak için madendeki rozetine dokun.</p>`
    gizle(el.altBar, false)
    el.altBar.innerHTML = `<button class="btn btn-turuncu" data-eylem="sayfa-kirala" data-odeme="para">${ikon('para')}<span class="sayi maliyet">Yönetici Tut</span></button>
      <button class="btn btn-mavi" data-eylem="sayfa-kirala" data-odeme="elmas">${ikon('elmas')}<span class="sayi">Elmasla Tut · ${A.ELMAS_KIRALAMA}</span></button>`
    const izgara = el.govde.querySelector('.yon-izgara')
    const sekmeler = [...el.govde.querySelectorAll('[data-eylem="yon-sekme"]')]
    const paraBtn = el.altBar.querySelector('[data-odeme="para"]')
    const paraYazi = paraBtn.querySelector('.maliyet')
    const elmasBtn = el.altBar.querySelector('[data-odeme="elmas"]')
    let haller = []
    function izgaraKur(d) {
      const b = bolgeAl(d)
      const liste = b.yoneticiler.filter((y) => y.tip === tip)
      if (!liste.length) {
        izgara.innerHTML = '<p class="sayfa-bos">Henüz yöneticin yok. Bir istasyon seç ve yönetici tut.</p>'
        haller = []
        return
      }
      izgara.innerHTML = liste.map((y) => {
        const n = nadirlik(y.nadirlik)
        return `<div class="yon-kart" style="--nr:${n.renk}">
          <canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="128" height="128"></canvas>
          <b>${yoneticiAdi(y)}</b>
          <span class="nadir" style="color:${n.renk}">${n.ad}</span>
          <span class="yetenek">${yetenekEtki(y)} · ${sure(n.sure)}</span>
          <span class="atama${y.atanan ? '' : ' bosta'}">${yerAdi(y.atanan)}</span>
          <span class="hal sayi"></span>
          <button class="btn ${y.atanan ? 'btn-krem' : 'btn-turuncu'} etiket-btn" data-eylem="sayfa-ata" data-id="${y.id}">${y.atanan ? 'Değiştir' : 'Ata'}</button>
        </div>`
      }).join('')
      for (const c of izgara.querySelectorAll('canvas[data-tohum]')) {
        try { B.sahne.portre(+c.dataset.tohum, +c.dataset.nadir, c, 64) } catch {}
      }
      haller = [...izgara.querySelectorAll('.hal')].map((h, i) => ({ el: h, y: liste[i] }))
    }
    return (d) => {
      const b = bolgeAl(d)
      for (const s of sekmeler) {
        const v = String(s.dataset.tip === tip)
        if (s.getAttribute('aria-pressed') !== v) s.setAttribute('aria-pressed', v)
      }
      const im = tip + '|' + b.yoneticiler.filter((y) => y.tip === tip).map((y) => y.id + ':' + y.atanan).join(',')
      if (im !== imza) { imza = im; izgaraKur(d) }
      for (const h of haller) {
        const s = yetenekHali(d, h.y)
        yaz(h.el, s.durum === 'hazir' ? 'Yetenek hazır' : s.durum === 'aktif' ? 'Aktif · ' + sayac(s.kalan) : 'Bekleme · ' + sayac(s.kalan))
        sinif(h.el, 'hazir', s.durum === 'hazir')
      }
      const dolu = b.yoneticiler.length >= A.MAKS_YONETICI
      const mal = E.kiralamaMaliyeti(d, b, tip)
      yaz(paraYazi, dolu ? `Yönetici odası dolu (${A.MAKS_YONETICI}/${A.MAKS_YONETICI})` : 'Yönetici Tut · ' + bicim(mal))
      paraBtn.disabled = dolu || b.para < mal
      elmasBtn.disabled = dolu || d.oyuncu.elmas < A.ELMAS_KIRALAMA
    }
  }
  B.eylemler['yon-sekme'] = (b) => { tip = b.dataset.tip; imza = ''; kare2(B.durumAl()) }
  B.eylemler['sayfa-kirala'] = (b) => {
    const s = B.eylem('yoneticiTut', { tip, odeme: b.dataset.odeme })
    if (s && s.ok) {
      const y = s.yonetici
      B.bildir('basari', `${yoneticiAdi(y)} katıldı! (${nadirlik(y.nadirlik).ad})`)
    } else if (s && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
    else if (s && s.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    imza = ''
    kare2(B.durumAl())
  }
  B.eylemler['sayfa-ata'] = (b) => B.pencere.ac('istasyonSec', { id: b.dataset.id })

  function kare2(d) {
    if (!acik) return
    yaz(el.para, bicim(bolgeAl(d).para))
    yaz(el.elmas, tam(d.oyuncu.elmas))
    if (guncelle) guncelle(d)
  }

  return { ac, kapat, kare2, acik: () => acik }
}
