// ════════════════════════════════════════════════════════════════
//  PENCERELER (Paket C, §4.9–4.10) — alt sayfalar ve modallar.
//  • Alt sayfalar: yukseltme, ayarlar, istasyonSec (aynı anda bir tane).
//  • Modallar: yonetici, seviye, aktarim. Kuyruk: bir seferde bir modal,
//    öncelik seviye > diğerleri, sonra sıra.
//  • İçerik açılışta bir kez kurulur; değerler 4 Hz yerinde güncellenir.
//    Yönetici modalı yalnız yapısı değişince (imza) yeniden kurulur.
// ════════════════════════════════════════════════════════════════
import { ikon, cevherIkonu } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, cubuk, bicim, oranYazi, tam, sayac, sure, ogeYap, bolgeAl, istasyonAdi, nadirlik,
  yetenekHali, yetenekEtki, yoneticiAdi, kartHizi, madenMi, istasyonTipi,
} from './ortak.js'
import { DURAK, BOSALTMA } from '../ayar.js'
import { KISILER, SAHNELER, BOLUMLER, sahneBolumu } from '../hikaye.js'

const SAYFALAR = new Set(['yukseltme', 'ayarlar', 'istasyonSec', 'defter'])
const ONCELIK = { seviye: 2, hikaye: 1 }
const MODLAR = [[1, 'x1'], [10, 'x10'], [50, 'x50'], ['max', 'Max']]
const katAdi = (ist) => (ist === 'asansor' ? 'Asansör' : ist === 'depo' ? '1. Kat · Depo' : (+ist.slice(1) + 2) + '. Kat')
const istIkon = (ist) => (ist === 'asansor' ? ikon('asansor') : ist === 'depo' ? ikon('sepet') : cevherIkonu('zonguldak'))

export function kur(B) {
  const kok = B.kok.querySelector('#pencere-kok')
  const perde = B.kok.querySelector('#perde')
  const sayfaEl = ogeYap(`<section class="alt-sayfa" role="dialog" aria-modal="true" aria-hidden="true"><i class="tutamac"></i><button class="sayfa-kapat" data-eylem="pencere-kapat" aria-label="Kapat">${ikon('kapat')}</button><div class="govde"></div></section>`)
  const modalEl = ogeYap(`<section class="modal" role="dialog" aria-modal="true" aria-hidden="true"><div class="govde"></div></section>`)
  kok.appendChild(sayfaEl)
  kok.appendChild(modalEl)
  const sGovde = sayfaEl.querySelector('.govde')
  const mGovde = modalEl.querySelector('.govde')

  let sayfa = null        // { ad, veri, kare4 }
  let modal = null        // { ad, veri, kare4, kapatilabilir }
  const kuyruk = []

  function perdeGuncelle() { perde.classList.toggle('acik', !!(sayfa || modal)) }

  // ── Alt sayfa ──
  function sayfaAc(ad, veri) {
    const kurucu = SAYFA_KUR[ad]
    if (!kurucu) return
    sGovde.innerHTML = ''
    sayfa = { ad, veri, kare4: null }
    sayfa.kare4 = kurucu(sGovde, veri) || null
    sayfaEl.classList.add('acik')
    sayfaEl.setAttribute('aria-hidden', 'false')
    sayfaEl.scrollTop = 0
    perdeGuncelle()
    if (sayfa.kare4) sayfa.kare4(B.durumAl())
  }
  function sayfaKapat() {
    if (!sayfa) return
    if (sayfa.kapaninca) sayfa.kapaninca()
    sayfa = null
    sayfaEl.classList.remove('acik')
    sayfaEl.setAttribute('aria-hidden', 'true')
    perdeGuncelle()
  }

  // ── Modal ──
  function modalAc(ad, veri) {
    const kurucu = MODAL_KUR[ad]
    if (!kurucu) return
    if (modal) {
      const o = ONCELIK[ad] || 0
      let i = kuyruk.findIndex((k) => (ONCELIK[k.ad] || 0) < o)
      if (i < 0) i = kuyruk.length
      kuyruk.splice(i, 0, { ad, veri })
      return
    }
    mGovde.innerHTML = ''
    modalEl.dataset.tur = ad
    modal = { ad, veri, kare4: null, kapatilabilir: true }
    const s = kurucu(mGovde, veri, modal)
    modal.kare4 = s || null
    modalEl.classList.add('acik')
    modalEl.setAttribute('aria-hidden', 'false')
    perdeGuncelle()
    if (modal.kare4) modal.kare4(B.durumAl())
  }
  function modalKapat() {
    if (!modal) return
    modal = null
    modalEl.classList.remove('acik')
    modalEl.setAttribute('aria-hidden', 'true')
    perdeGuncelle()
    const s = kuyruk.shift()
    if (s) setTimeout(() => modalAc(s.ad, s.veri), 180)
  }

  perde.addEventListener('click', () => {
    if (B.ogretici && B.ogretici.zorunlu()) return
    if (modal) { if (modal.kapatilabilir) modalKapat() }
    else if (sayfa) sayfaKapat()
  })
  // Aşağı kaydırarak kapat (tutamaç ve başlık bölgesi)
  let surukle = null
  sayfaEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, .govde .bolumlu')) return
    if (sayfaEl.querySelector('.govde').scrollTop > 0 && !e.target.closest('.tutamac')) return
    surukle = { y0: e.clientY, dy: 0 }
  })
  sayfaEl.addEventListener('pointermove', (e) => {
    if (!surukle) return
    surukle.dy = Math.max(0, e.clientY - surukle.y0)
    if (surukle.dy > 6) sayfaEl.style.transform = `translateY(${surukle.dy}px)`
  })
  const birak = () => {
    if (!surukle) return
    const dy = surukle.dy
    surukle = null
    sayfaEl.style.transform = ''
    if (dy > 80 && !(B.ogretici && B.ogretici.zorunlu())) sayfaKapat()
  }
  sayfaEl.addEventListener('pointerup', birak)
  sayfaEl.addEventListener('pointercancel', birak)

  B.eylemler['pencere-kapat'] = () => { if (!(B.ogretici && B.ogretici.zorunlu())) sayfaKapat() }
  B.eylemler['modal-kapat'] = () => modalKapat()
  B.eylemler.ayarlar = () => sayfaAc('ayarlar', {})

  // ════════ Yükseltme sayfası ════════
  function yukseltmeKur(g, veri) {
    const ist = veri.istasyon
    const madenMi_ = madenMi(ist)
    g.innerHTML = `
      <div class="yk-bas"><span class="yk-ikon">${istIkon(ist)}</span><div><h2>${katAdi(ist)}</h2><p class="sayi"></p></div></div>
      <div class="bolumlu" role="group" aria-label="Alım miktarı">${MODLAR.map(([m, ad]) => `<button data-eylem="alim-modu" data-mod="${m}" aria-pressed="false">${ad}</button>`).join('')}</div>
      <div class="yk-satirlar"></div>
      <div class="yk-kademe"><span class="sayi"></span><span class="cubuk"><i></i></span></div>
      <div class="yk-yonetici"><canvas width="72" height="72"></canvas><span class="yon-bilgi"><b></b><span class="yetenek"></span><span class="hal sayi"></span></span>
        <button class="btn btn-yesil kucuk-btn" data-eylem="yetenek-kullan" data-istasyon="${ist}" hidden>${ikon('yildirim')}Kullan</button>
        <button class="btn btn-krem kucuk-btn" data-eylem="yonetici-ac" data-istasyon="${ist}">Yönetici</button></div>
      <button class="btn btn-turuncu buyuk-btn" data-eylem="yukselt-al" data-istasyon="${ist}" data-uzun data-ogretici="sheet-yukselt"><span class="parla"></span>${ikon('yukari')}<span class="etiket sayi">Yükselt</span></button>`
    const satirAdlari = madenMi_ ? ['Üretim', 'Madenci', 'Yığın kapasitesi'] : ist === 'asansor' ? ['Kapasite', 'Hız', 'Tur süresi'] : ['Vagon', 'Vagon yükü', 'Depo kapasitesi']
    const satirlar = g.querySelector('.yk-satirlar')
    satirlar.innerHTML = satirAdlari.map((a) => `<div class="yk-satir"><span>${a}</span><b class="sayi"><span class="simdi"></span><span class="artis"></span></b></div>`).join('')
    const el = {
      seviye: g.querySelector('.yk-bas p'),
      modlar: [...g.querySelectorAll('.bolumlu button')],
      simdi: [...satirlar.querySelectorAll('.simdi')],
      artis: [...satirlar.querySelectorAll('.artis')],
      kademeYazi: g.querySelector('.yk-kademe > span'),
      kademeBar: g.querySelector('.yk-kademe .cubuk'),
      btn: g.querySelector('.buyuk-btn'),
      etiket: g.querySelector('.buyuk-btn .etiket'),
      yonKutu: g.querySelector('.yk-yonetici'),
      yonPortre: g.querySelector('.yk-yonetici canvas'),
      yonAd: g.querySelector('.yk-yonetici b'),
      yonYetenek: g.querySelector('.yk-yonetici .yetenek'),
      yonHal: g.querySelector('.yk-yonetici .hal'),
      yonKullan: g.querySelector('.yk-yonetici [data-eylem="yetenek-kullan"]'),
      yonDugme: g.querySelector('.yk-yonetici [data-eylem="yonetici-ac"]'),
    }
    let yonId = undefined
    const degerler = (d, b, L) => {
      if (madenMi_) {
        const i = +ist.slice(1)
        const hiz = E.madenUretim(d, b, i, L) * E.uretimCarpani(d, b, i) * E.satisCarpani(d)
        return [oranYazi(hiz), String(E.madenciSayisi(L)), bicim(E.madenUretim(d, b, i, L) * A.YIGIN_SANIYE)]
      }
      if (ist === 'asansor') {
        const n = b.madenler.length
        const v = E.asansorHiz(d, b, L)
        return [bicim(E.asansorKap(d, b, L)), bicim(v) + ' kat/sn', bicim(2 * n / v + DURAK * n + BOSALTMA) + ' sn']
      }
      return [String(E.tasiyiciSayisi(L)), bicim(E.tasiyiciYuk(d, b, L)), bicim(E.depoKap(d, b, L))]
    }
    return (d) => {
      const b = bolgeAl(d)
      const L = E.istasyonSeviye(b, ist)
      const tk = E.teklif(d, b, ist, d.alimModu)
      const yeniL = tk.maks ? L : tk.yeniL
      el.seviye.innerHTML = tk.maks ? `Seviye ${L}` : `Seviye ${L} → <span class="hedef">${yeniL}</span>`
      for (const m of el.modlar) {
        const sec = String(d.alimModu) === m.dataset.mod
        if ((m.getAttribute('aria-pressed') === 'true') !== sec) m.setAttribute('aria-pressed', String(sec))
      }
      const s = degerler(d, b, L)
      const y = tk.maks ? s : degerler(d, b, yeniL)
      for (let k = 0; k < 3; k++) {
        yaz(el.simdi[k], s[k])
        yaz(el.artis[k], y[k] !== s[k] ? ' → ' + y[k] : '')
      }
      const liste = madenMi_ ? A.KADEME_MADEN : A.KADEME_ISTASYON
      const sonraki = E.sonrakiKademe(L, liste)
      const stat = madenMi_ ? 'Üretim' : ist === 'asansor' ? 'Kapasite' : 'Vagon yükü'
      let ek = ''
      if (sonraki && madenMi_ && (sonraki === 10 || sonraki === 50)) ek = ' · +1 madenci'
      if (sonraki && ist === 'depo' && A.TASIYICI_ESIK.includes(sonraki)) ek = ' · +1 vagon'
      yaz(el.kademeYazi, sonraki ? `Sonraki kademe: ${sonraki} → ${stat} ×2${ek}` : 'Bütün kademeler tamam')
      cubuk(el.kademeBar, sonraki ? E.kademeIlerleme(L, liste) : 1)
      // Yönetici bölümü
      const yon = b.yoneticiler.find((x) => x.atanan === ist) || null
      if ((yon ? yon.id : null) !== yonId) {
        yonId = yon ? yon.id : null
        el.yonKutu.style.setProperty('--nr', yon ? nadirlik(yon.nadirlik).renk : 'rgba(255,255,255,.25)')
        if (yon) { try { B.sahne.portre(yon.tohum, yon.nadirlik, el.yonPortre, 36) } catch {} }
        else { const c = el.yonPortre.getContext('2d'); c.clearRect(0, 0, el.yonPortre.width, el.yonPortre.height) }
        yaz(el.yonAd, yon ? yoneticiAdi(yon) : 'Yönetici yok')
        yaz(el.yonYetenek, yon ? yetenekEtki(yon) : 'Yönetici bu istasyonu otomatik çalıştırır.')
        yaz(el.yonDugme, yon ? 'Yönetici' : 'Yönetici Tut')
      }
      if (yon) {
        const h = yetenekHali(d, yon)
        yaz(el.yonHal, h.durum === 'hazir' ? 'Yetenek hazır' : h.durum === 'aktif' ? 'Aktif · ' + sayac(h.kalan) : 'Bekleme · ' + sayac(h.kalan))
        sinif(el.yonHal, 'hazir', h.durum === 'hazir')
        gizle(el.yonKullan, h.durum !== 'hazir')
      } else { yaz(el.yonHal, ''); gizle(el.yonKullan, true) }
      if (tk.maks) {
        el.btn.disabled = true
        el.btn.className = 'btn btn-altin buyuk-btn'
        yaz(el.etiket, 'MAKS SEVİYE')
      } else {
        el.btn.disabled = !tk.yetiyor
        el.btn.className = 'btn btn-turuncu buyuk-btn'
        yaz(el.etiket, (tk.yetiyor ? 'Yükselt · ' : 'Yetersiz para · ') + bicim(tk.maliyet))
      }
    }
  }
  B.eylemler['alim-modu'] = (b) => {
    const m = b.dataset.mod === 'max' ? 'max' : +b.dataset.mod
    B.eylem('alimModu', { mod: m })
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }
  B.eylemler['yukselt-al'] = (b) => {
    const s = B.eylem('yukselt', { istasyon: b.dataset.istasyon })
    if (s && !s.ok && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }

  // ════════ Ayarlar ════════
  function ayarlarKur(g) {
    g.innerHTML = `
      <h2 class="ayar-bas">Ayarlar</h2>
      <div class="ayar-satir"><span class="sol">${ikon('ses')}Ses efektleri</span><button class="anahtar" role="switch" data-eylem="ayar-anahtar" data-anahtar="ses" aria-label="Ses efektleri" aria-checked="true"></button></div>
      <div class="ayar-satir"><span class="sol">${ikon('titresim')}Titreşim</span><button class="anahtar" role="switch" data-eylem="ayar-anahtar" data-anahtar="titresim" aria-label="Titreşim" aria-checked="true"></button></div>
      <div class="ayar-blok"><span>Grafik</span><div class="bolumlu" role="group" aria-label="Grafik kalitesi">
        <button data-eylem="ayar-kalite" data-k="yuksek" aria-pressed="false">Yüksek</button>
        <button data-eylem="ayar-kalite" data-k="dengeli" aria-pressed="false">Dengeli</button>
        <button data-eylem="ayar-kalite" data-k="pil" aria-pressed="false">Pil Tasarrufu</button></div></div>
      <button class="ayar-dugme" data-eylem="ogretici-atla" hidden>Öğreticiyi atla</button>
      <button class="ayar-dugme tehlike" data-eylem="sifirla" data-tehlikeli>İlerlemeyi sıfırla</button>
      <p class="ayar-alt">Cevher Madenci · Sürüm 1.0.0</p>`
    const anahtarlar = [...g.querySelectorAll('.anahtar')]
    const kaliteler = [...g.querySelectorAll('[data-eylem="ayar-kalite"]')]
    const atla = g.querySelector('[data-eylem="ogretici-atla"]')
    const sifir = g.querySelector('[data-eylem="sifirla"]')
    let eminZaman = 0
    sayfa.kapaninca = () => clearTimeout(eminZaman)
    B.eylemler.sifirla = () => {
      if (!sifir.classList.contains('emin')) {
        sifir.classList.add('emin')
        sifir.textContent = 'Emin misin? Bütün ilerleme silinir.'
        clearTimeout(eminZaman)
        eminZaman = setTimeout(() => { sifir.classList.remove('emin'); sifir.textContent = 'İlerlemeyi sıfırla' }, 4000)
        return
      }
      clearTimeout(eminZaman)
      B.eylem('sifirla', {})
      sayfaKapat()
      B.bildir('bilgi', 'Yeni oyun başladı.')
    }
    return (d) => {
      for (const a of anahtarlar) {
        const v = String(!!d.ayarlar[a.dataset.anahtar])
        if (a.getAttribute('aria-checked') !== v) a.setAttribute('aria-checked', v)
      }
      for (const k of kaliteler) {
        const v = String(d.ayarlar.kalite === k.dataset.k)
        if (k.getAttribute('aria-pressed') !== v) k.setAttribute('aria-pressed', v)
      }
      gizle(atla, d.ogretici.bitti || d.ogretici.adim < 4)
    }
  }
  B.eylemler['ayar-anahtar'] = (b) => {
    const d = B.durumAl()
    const k = b.dataset.anahtar
    B.eylem('ayar', { anahtar: k, deger: !d.ayarlar[k] })
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }
  B.eylemler['ayar-kalite'] = (b) => {
    B.eylem('ayar', { anahtar: 'kalite', deger: b.dataset.k })
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }
  B.eylemler['ogretici-atla'] = () => {
    B.eylem('ogretici', { bitti: true })
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }

  // ════════ İstasyon seçici (yöneticiyi ata) ════════
  function istasyonSecKur(g, veri) {
    const d = B.durumAl(), b = bolgeAl(d)
    const y = b.yoneticiler.find((x) => x.id === veri.id)
    if (!y) { g.innerHTML = '<p class="yon-bos">Yönetici bulunamadı.</p>'; return null }
    const istler = y.tip === 'maden' ? b.madenler.map((_, i) => 'm' + i) : [y.tip]
    const atanan = {}
    for (const x of b.yoneticiler) if (x.atanan) atanan[x.atanan] = x
    g.innerHTML = `<h2 class="ayar-bas">${yoneticiAdi(y)} · Görev yeri</h2><div class="secici-liste">${istler.map((ist) => {
      const m = atanan[ist]
      return `<button class="secici-satir" data-eylem="yonetici-ata" data-id="${y.id}" data-istasyon="${ist}"><span>${katAdi(ist)}</span><small>${m ? (m.id === y.id ? 'Burada' : yoneticiAdi(m)) : 'Boş'}</small></button>`
    }).join('')}</div>`
    return null
  }
  B.eylemler['yonetici-ata'] = (b) => {
    B.eylem('yoneticiAta', { id: b.dataset.id, istasyon: b.dataset.istasyon })
    if (sayfa && sayfa.ad === 'istasyonSec') sayfaKapat()
    if (modal && modal.ad === 'yonetici') modal.yenile && modal.yenile()
  }

  // ════════ Yönetici modalı ════════
  function yoneticiKur(g, veri, m) {
    const ist = veri.istasyon
    const tip = istasyonTipi(ist)
    let imza = ''
    let acilis = null       // { yonetici, bitis }
    let el = {}
    function kurIc() {
      const d = B.durumAl(), b = bolgeAl(d)
      const mevcut = b.yoneticiler.find((y) => y.atanan === ist)
      const bostakiler = b.yoneticiler.filter((y) => y.tip === tip && !y.atanan)
      const maliyet = E.kiralamaMaliyeti(d, b, tip)
      const dolu = b.yoneticiler.length >= A.MAKS_YONETICI
      const satir = (y, dugme) => {
        const n = nadirlik(y.nadirlik)
        return `<div class="yon-satir" style="--nr:${n.renk}"><canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="80" height="80"></canvas>
          <span class="yon-bilgi"><b>${yoneticiAdi(y)}</b><span class="nadir" style="color:${n.renk}">${n.ad}</span><span class="yetenek">${yetenekEtki(y)}</span></span>${dugme}</div>`
      }
      let html = `<h2>${katAdi(ist)} · Yönetici</h2>`
      if (acilis) {
        const y = acilis.yonetici, n = nadirlik(y.nadirlik)
        html += `<div class="yon-acilis${y.nadirlik === 2 ? ' efsanevi' : ''}" style="--nr:${n.renk}"><span class="kart-don"><canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="192" height="192"></canvas></span>
          <p class="yon-katildi"><b>${yoneticiAdi(y)} katıldı!</b><br><span style="color:${n.renk};font-weight:700">${n.ad}</span> · ${yetenekEtki(y)}</p></div>`
      } else if (mevcut) {
        const n = nadirlik(mevcut.nadirlik)
        html += `<div class="yon-mevcut" style="--nr:${n.renk}"><canvas data-tohum="${mevcut.tohum}" data-nadir="${mevcut.nadirlik}" width="144" height="144"></canvas>
          <span class="yon-bilgi"><b>${yoneticiAdi(mevcut)}</b><span class="nadir" style="color:${n.renk}">${n.ad}</span><span class="yetenek">${yetenekEtki(mevcut)} · ${sure(n.sure)}</span><span class="hal sayi"></span></span></div>
          <div class="yon-dugmeler"><button class="btn btn-yesil" data-eylem="yetenek-kullan" data-istasyon="${ist}">${ikon('yildirim')}Yeteneği Kullan</button><button class="btn btn-krem" data-eylem="gorevden-al" data-istasyon="${ist}">Görevden Al</button></div>`
      } else {
        html += `<p>Yönetici bu istasyonu senin yerine otomatik çalıştırır.</p>`
      }
      html += `<p class="yon-baslik">Boştaki yöneticiler</p>`
      html += bostakiler.length ? bostakiler.map((y) => satir(y, `<button class="btn btn-turuncu" data-eylem="yonetici-ata" data-id="${y.id}" data-istasyon="${ist}">Ata</button>`)).join('') : `<p class="yon-bos">Boşta yönetici yok.</p>`
      html += dolu
        ? `<div class="kirala"><button class="btn" disabled>Yönetici odası dolu (${A.MAKS_YONETICI}/${A.MAKS_YONETICI})</button></div>`
        : `<div class="kirala"><button class="btn btn-turuncu" data-eylem="yonetici-tut" data-odeme="para" data-istasyon="${ist}" data-ogretici="kirala">Yeni Yönetici Tut · ${ikon('para')}<span class="sayi maliyet">${bicim(maliyet)}</span></button>
          <button class="btn btn-mavi" data-eylem="yonetici-tut" data-odeme="elmas" data-istasyon="${ist}">Elmasla Tut · ${ikon('elmas')}<span class="sayi">${A.ELMAS_KIRALAMA}</span></button></div>`
      html += `<button class="btn btn-krem modal-kapat-btn" data-eylem="modal-kapat" data-ogretici-modal>Kapat</button>`
      g.innerHTML = html
      for (const c of g.querySelectorAll('canvas[data-tohum]')) {
        try { B.sahne.portre(+c.dataset.tohum, +c.dataset.nadir, c, c.width / 2) } catch {}
      }
      el = {
        hal: g.querySelector('.yon-mevcut .hal'),
        yetenekBtn: g.querySelector('[data-eylem="yetenek-kullan"]'),
        paraBtn: g.querySelector('[data-odeme="para"]'),
        elmasBtn: g.querySelector('[data-odeme="elmas"]'),
      }
    }
    function imzaAl(d) {
      const b = bolgeAl(d)
      const mevcut = b.yoneticiler.find((y) => y.atanan === ist)
      return [mevcut ? mevcut.id : '-', b.yoneticiler.filter((y) => y.tip === tip && !y.atanan).map((y) => y.id).join(','), b.kiralanan[tip], b.yoneticiler.length, acilis ? acilis.yonetici.id : ''].join('|')
    }
    m.yenile = () => { imza = ''; m.kare4 && m.kare4(B.durumAl()) }
    m.acilisGoster = (y) => {
      acilis = { yonetici: y, bitis: performance.now() + 1600 }
      imza = ''
    }
    return (d) => {
      if (acilis && performance.now() > acilis.bitis) { acilis = null }
      const im = imzaAl(d)
      if (im !== imza) { imza = im; kurIc() }
      const b = bolgeAl(d)
      const mevcut = b.yoneticiler.find((y) => y.atanan === ist)
      if (mevcut && el.hal) {
        const h = yetenekHali(d, mevcut)
        yaz(el.hal, h.durum === 'hazir' ? 'Hazır' : h.durum === 'aktif' ? 'Aktif · ' + sayac(h.kalan) : 'Bekleme · ' + sayac(h.kalan))
        sinif(el.hal, 'hazir', h.durum === 'hazir')
        if (el.yetenekBtn) el.yetenekBtn.disabled = h.durum !== 'hazir'
      }
      if (el.paraBtn) el.paraBtn.disabled = b.para < E.kiralamaMaliyeti(d, b, tip)
      if (el.elmasBtn) el.elmasBtn.disabled = d.oyuncu.elmas < A.ELMAS_KIRALAMA
    }
  }
  B.eylemler['yonetici-tut'] = (b) => {
    const ist = b.dataset.istasyon
    const s = B.eylem('yoneticiTut', { tip: istasyonTipi(ist), odeme: b.dataset.odeme, istasyon: ist })
    if (!s || !s.ok) {
      if (s && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
      else if (s && s.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
      else if (s && s.sebep === 'dolu') B.bildir('bilgi', `Yönetici odası dolu (${A.MAKS_YONETICI}/${A.MAKS_YONETICI})`)
      return
    }
    if (modal && modal.ad === 'yonetici' && modal.acilisGoster) {
      modal.acilisGoster(s.yonetici)
      modal.kare4(B.durumAl())
      const r = modalEl.querySelector('.yon-acilis canvas')
      if (r && B.sahne.efekt) {
        const kr = r.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
        B.sahne.efekt.patlat(kr.left - k.left + kr.width / 2, kr.top - k.top + kr.height / 2, 'parilti', s.yonetici.nadirlik === 2 ? 24 : 12, { yaricap: 50 })
      }
    }
    if (B.ogretici && B.ogretici.aktifMi()) setTimeout(() => { if (modal && modal.ad === 'yonetici') modalKapat() }, 1300)
  }
  B.eylemler['yetenek-kullan'] = (b) => {
    const s = B.eylem('yetenek', { istasyon: b.dataset.istasyon })
    if (s && s.ok && modal && modal.ad === 'yonetici') modalKapat()
    if (sayfa && sayfa.kare4) sayfa.kare4(B.durumAl())
  }
  B.eylemler['yonetici-ac'] = (b) => modalAc('yonetici', { istasyon: b.dataset.istasyon })
  B.eylemler['gorevden-al'] = (b) => {
    B.eylem('yoneticiCikar', { istasyon: b.dataset.istasyon })
    if (modal && modal.yenile) modal.yenile()
  }

  // ════════ Seviye atlama ════════
  function seviyeKur(g, veri) {
    const acilimlar = (veri.acilan || []).map((k) => A.ACILIM_ADLARI && A.ACILIM_ADLARI[k]).filter(Boolean)
    g.innerHTML = `<i class="isinlar"></i>
      <h2>Seviye Atladın!</h2>
      <div class="madalya">${ikon('madalya')}</div><b class="madalya-yazi sayi">Lv. ${veri.lv}</b>
      <div class="odul-satirlar">
        <div class="odul-satir">${ikon('elmas')}<span class="sayi">+${veri.elmas} elmas</span></div>
        <div class="odul-satir">${ikon('para')}<span>Bütün satışlar +%${2 * (veri.adet || 1)}</span></div>
        ${acilimlar.map((m) => `<div class="odul-satir acilim">${ikon('kilit-acik')}<span>${m} açıldı!</span></div>`).join('')}
      </div>
      <div class="modal-dugmeler"><button class="btn btn-turuncu" data-eylem="modal-kapat" data-ogretici-modal>Harika!</button></div>`
    return null
  }

  // ════════ Eski oyundan aktarım ════════
  function aktarimKur(g) {
    g.innerHTML = `<i class="isinlar"></i><h2>Cevher Madenci yenilendi!</h2>
      <p>Satın aldıkların ve elmasların aktarıldı. Hoş geldin hediyesi: 50 elmas.</p>
      <div class="modal-dugmeler"><button class="btn btn-turuncu" data-eylem="modal-kapat" data-ogretici-modal>Başla</button></div>`
    return null
  }

  // ════════ Hikâye sahnesi (görsel roman) ════════
  // veri: {id, tekrar}. Satırlar daktilo gibi yazılır; dokunuş satırı tamamlar, sonra ilerletir.
  const MEKTUP_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="14" width="52" height="38" rx="4" fill="#F3E2BE" stroke="#8A6A3C" stroke-width="2.5"/><path d="M8 17 32 36 56 17" fill="none" stroke="#8A6A3C" stroke-width="2.5"/><circle cx="32" cy="40" r="7" fill="#B8322A"/><path d="M29 40h6M32 37v6" stroke="#F3C9A0" stroke-width="1.6"/></svg>'
  function bolumAdi(id) {
    const k = sahneBolumu(id)
    if (k === 'prestij') return 'Yeni Nesil'
    const b = BOLUMLER.find((x) => x.bolge === k)
    return b ? `Bölüm ${b.no} · ${A.BOLGE[k] ? A.BOLGE[k].ad : ''}` : ''
  }
  function portreHtml(k) {
    const kisi = KISILER[k] || KISILER.sen
    if (k === 'mektup') return `<div class="hk-portre mektup">${MEKTUP_SVG}</div>`
    if (kisi.resim) return `<div class="hk-portre"><img src="${kisi.resim}" alt="" draggable="false"></div>`
    return `<div class="hk-portre"><canvas width="128" height="128" data-tohum="${kisi.tohum || 1}"></canvas></div>`
  }
  function hikayeKur(g, veri, m) {
    const sahne = SAHNELER[veri.id]
    if (!sahne) { setTimeout(modalKapat, 0); return null }
    m.kapatilabilir = false
    const satirlar = sahne.satirlar
    let i = -1, yazilan = 0, hedef = '', zaman = 0, raf = 0
    g.innerHTML = `<header class="hk-ust"><small>${bolumAdi(veri.id)}</small><h2>${sahne.baslik}</h2></header>
      <div class="hk-sahne"><div class="hk-portre-kap"></div>
        <button class="hk-balon" data-eylem="hikaye-devam"><b class="hk-ad"></b><small class="hk-unvan"></small><p class="hk-metin"></p><i class="hk-ok"></i></button></div>
      <footer class="hk-alt"><span class="hk-sayac sayi"></span><button class="btn btn-krem" data-eylem="hikaye-atla">Atla</button><button class="btn btn-turuncu" data-eylem="hikaye-devam" data-ogretici-modal>Devam</button></footer>`
    const el = {
      portre: g.querySelector('.hk-portre-kap'), ad: g.querySelector('.hk-ad'), unvan: g.querySelector('.hk-unvan'),
      metin: g.querySelector('.hk-metin'), sayac: g.querySelector('.hk-sayac'), balon: g.querySelector('.hk-balon'),
      devam: g.querySelector('.hk-alt .btn-turuncu'),
    }
    let sonKisi = null
    const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches
    function yazdir(t) {
      if (!zaman) zaman = t
      yazilan = Math.min(hedef.length, Math.floor((t - zaman) * 0.05))
      el.metin.textContent = hedef.slice(0, yazilan)
      if (yazilan < hedef.length) raf = requestAnimationFrame(yazdir)
      else raf = 0
    }
    function satir(n) {
      i = n
      const [k, metin] = satirlar[i]
      const kisi = KISILER[k] || KISILER.sen
      if (k !== sonKisi) {
        el.portre.innerHTML = portreHtml(k)
        const c = el.portre.querySelector('canvas')
        if (c) try { B.sahne.portre(+c.dataset.tohum, 2, c, 128) } catch {}
        el.portre.firstChild.animate([{ opacity: 0, transform: 'translateY(10px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' })
        sonKisi = k
      }
      el.balon.classList.toggle('sen', k === 'sen')
      el.balon.classList.toggle('mektup', k === 'mektup')
      yaz(el.ad, kisi.ad)
      yaz(el.unvan, kisi.unvan)
      yaz(el.sayac, (i + 1) + '/' + satirlar.length)
      yaz(el.devam, i === satirlar.length - 1 ? 'Tamam' : 'Devam')
      hedef = metin
      zaman = 0
      if (raf) cancelAnimationFrame(raf)
      if (azHareket) { el.metin.textContent = hedef; yazilan = hedef.length }
      else { el.metin.textContent = ''; raf = requestAnimationFrame(yazdir) }
    }
    function bitir() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      B.eylem('hikayeGoruldu', { id: veri.id })
      modalKapat()
    }
    m.devam = () => {
      if (yazilan < hedef.length) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        yazilan = hedef.length
        el.metin.textContent = hedef
        return
      }
      if (i + 1 < satirlar.length) satir(i + 1)
      else bitir()
    }
    m.atla = bitir
    satir(0)
    return null
  }
  B.eylemler['hikaye-devam'] = () => { if (modal && modal.devam) modal.devam() }
  B.eylemler['hikaye-atla'] = () => { if (modal && modal.atla) modal.atla() }

  // ════════ Hikâye defteri (görülen sahneler, yeniden oynatılabilir) ════════
  function defterKur(g) {
    const d = B.durumAl()
    const gor = new Set(d.hikaye.goruldu)
    const bolumler = [...BOLUMLER.map((b) => ({ k: b.bolge, ad: `Bölüm ${b.no}: ${b.ad}` })), { k: 'prestij', ad: 'Yeni Nesil' }]
    const ids = Object.keys(SAHNELER)
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('kitap')}<div><h2>Hikâye Defteri</h2><small>${gor.size}/${ids.length} sahne</small></div></div>` +
      bolumler.map((b) => {
        const l = ids.filter((id) => sahneBolumu(id) === b.k)
        const acik = l.filter((id) => gor.has(id))
        return `<section class="defter-bolum"><h3>${b.ad}<small class="sayi">${acik.length}/${l.length}</small></h3>
          <div class="defter-liste">${l.map((id) => gor.has(id)
            ? `<button class="defter-sahne" data-eylem="defter-oynat" data-id="${id}">${ikon('oynat')}<span>${SAHNELER[id].baslik}</span></button>`
            : `<div class="defter-sahne kilitli">${ikon('kilit')}<span>???</span></div>`).join('')}</div></section>`
      }).join('')
    return null
  }
  B.eylemler['defter-oynat'] = (b) => { sayfaKapat(); setTimeout(() => modalAc('hikaye', { id: b.dataset.id, tekrar: true }), 200) }
  B.eylemler.defter = () => sayfaAc('defter', {})

  // Görsel yön 2: çevrimdışı kazanç alt bantta; eski "cevrimdisi" modal çağrısı bildirime döner
  function cevrimdisiYonlendir() {
    B.bildir('basari', 'Sen yokken madencilerin çalıştı!')
    return false
  }

  const SAYFA_KUR = { yukseltme: yukseltmeKur, ayarlar: ayarlarKur, istasyonSec: istasyonSecKur, defter: defterKur }
  const MODAL_KUR = { yonetici: yoneticiKur, seviye: seviyeKur, aktarim: aktarimKur, hikaye: hikayeKur }

  function ac(ad, veri) {
    if (ad === 'cevrimdisi') { cevrimdisiYonlendir(); return }
    if (SAYFALAR.has(ad)) sayfaAc(ad, veri || {})
    else modalAc(ad, veri || {})
  }

  // Arka arkaya seviye atlamaları tek pencerede birleşir (kuyruktaki seviye penceresi güncellenir)
  // Hikâye kuyruğu: aynı sahne iki kez sıraya girmez
  function hikayeSirala(id) {
    if ((modal && modal.ad === 'hikaye' && modal.veri.id === id) || kuyruk.some((k) => k.ad === 'hikaye' && k.veri.id === id)) return
    modalAc('hikaye', { id })
  }

  function olay(o) {
    if (o.tip === 'hikaye') { hikayeSirala(o.id); return }
    if (o.tip !== 'seviyeAtladi') return
    const k = kuyruk.find((x) => x.ad === 'seviye')
    if (k) {
      k.veri = { lv: Math.max(k.veri.lv, o.lv), elmas: k.veri.elmas + o.elmas, acilan: [...(k.veri.acilan || []), ...(o.acilan || [])], adet: (k.veri.adet || 1) + 1 }
      return
    }
    modalAc('seviye', { lv: o.lv, elmas: o.elmas, acilan: (o.acilan || []).slice(), adet: 1 })
  }

  function kare4(d) {
    if (sayfa && sayfa.kare4) sayfa.kare4(d)
    if (modal && modal.kare4) modal.kare4(d)
  }

  return {
    ac, olay, kare4, hikayeSirala,
    kapatSayfa: sayfaKapat,
    kapatModal: modalKapat,
    acikSayfa: () => (sayfa ? sayfa.ad : null),
    acikModal: () => (modal ? modal.ad : null),
    acikMi: () => !!(sayfa || modal),
    modalEl, sayfaEl,
  }
}
