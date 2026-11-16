// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  PENCERELER (Paket C, §4.9–4.10) — alt sayfalar ve modallar.
//  • Alt sayfalar: yukseltme, ayarlar, istasyonSec (aynı anda bir tane).
//  • Modallar: yonetici, cevrimdisi, aktarim, hikaye. Kuyruk: bir seferde
//    bir modal, öncelik çevrimdışı > hikâye > diğerleri, sonra sıra.
//  • Fener ve Çini: yükseltme, yönetici ve çevrimdışı pencereleri krem
//    yüzeyli (.krem); diğerleri şimdilik koyu pano görünümünde kalır.
//  • İçerik açılışta bir kez kurulur; değerler 4 Hz yerinde güncellenir.
//    Yönetici modalı yalnız yapısı değişince (imza) yeniden kurulur.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, cubuk, bicim, oranYazi, tam, sayac, sure, ogeYap, bolgeAl, istasyonAdi, nadirlik,
  yetenekHali, yetenekEtki, yoneticiAdi, kartHizi, madenMi, istasyonTipi, simge, simgeleriCiz, canlandir, PARLA,
} from './ortak.js'
import { eksikYoneticiVar } from '../cevrimdisi.js'
import { DURAK, BOSALTMA } from '../ayar.js'
import { KISILER, SAHNELER, BOLUMLER, sahneBolumu } from '../hikaye.js'

const SAYFALAR = new Set(['yukseltme', 'ayarlar', 'istasyonSec', 'defter'])
const ONCELIK = { cevrimdisi: 2, hikaye: 1 }
// Krem yüzeyli (design-system "Panel (sheet) ve pencere") pencereler
const KREM = new Set(['yukseltme', 'yonetici', 'cevrimdisi'])
const MODLAR = [[1, 'x1'], [10, 'x10'], [50, 'x50'], ['max', 'Maks']]
// Süre tavanı yazısı: tam saatse "2 saat", değilse "1 sa 30 dk"
const saatYazi = (sn) => (sn >= 3600 && sn % 3600 === 0 ? sn / 3600 + ' saat' : sure(sn))
const katAdi = (ist) => (ist === 'asansor' ? 'Asansör' : ist === 'depo' ? 'Depo' : (+ist.slice(1) + 1) + '. Kat')
// İstasyon simgesi; katlarda etkin bölgenin cevheri (sahnedeki yığınla aynı çizim)
const istIkon = (B, ist) => (ist === 'asansor' ? ikon('asansor') : ist === 'depo' ? ikon('sepet')
  : `<img class="cevher-img" src="${B.sahne.simgeAdres('cevher', B.durumAl().aktifBolge, 40)}" alt="">`)

export function kur(B) {
  const kok = B.kok.querySelector('#pencere-kok')
  const perde = B.kok.querySelector('#perde')
  const sayfaEl = ogeYap(`<section class="alt-sayfa" role="dialog" aria-modal="true" aria-hidden="true"><i class="tutamac"></i><button class="sayfa-kapat" data-eylem="pencere-kapat" aria-label="Kapat">${ikon('kapat')}</button><div class="govde"></div></section>`)
  const modalEl = ogeYap(`<section class="modal" role="dialog" aria-modal="true" aria-hidden="true"><div class="govde"></div></section>`)
  // Çevrimdışı penceresinin arkasında dönen altın ışınlar (perdenin üstünde, pencerenin altında)
  const isinEl = ogeYap('<i class="pencere-isin" aria-hidden="true"></i>')
  kok.appendChild(sayfaEl)
  kok.appendChild(isinEl)
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
    sayfaEl.dataset.tur = ad
    sayfaEl.classList.toggle('krem', KREM.has(ad))
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
    modalEl.classList.toggle('krem', KREM.has(ad))
    isinEl.classList.toggle('acik', ad === 'cevrimdisi')
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
    isinEl.classList.remove('acik')
    modalEl.classList.remove('acik')
    modalEl.setAttribute('aria-hidden', 'true')
    perdeGuncelle()
    const s = kuyruk.shift()
    if (s) setTimeout(() => modalAc(s.ad, s.veri), 180)
  }

  // Öğretici pencere kapatmayı engellemez: yanlışlıkla açılan pencere her zaman kapanabilmeli
  // (öğretici "kapat" diye gösterirken kapatma kilitli olursa oyun kilitleniyordu)
  perde.addEventListener('click', () => {
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
    if (dy > 80) sayfaKapat()
  }
  sayfaEl.addEventListener('pointerup', birak)
  sayfaEl.addEventListener('pointercancel', birak)

  B.eylemler['pencere-kapat'] = () => sayfaKapat()
  B.eylemler['modal-kapat'] = () => modalKapat()
  B.eylemler.ayarlar = () => sayfaAc('ayarlar', {})

  // ════════ Yükseltme sayfası (docs/design/screens/yukseltme.md) ════════
  // Başlık + "Seviye A → B", alım segmenti, şimdi → sonra satırları, kademe şeridi,
  // tam genişlik ana düğme (uzun basma tekrar alır) ve "basılı tut" ipucu.
  function yukseltmeKur(g, veri) {
    const ist = veri.istasyon
    const madenMi_ = madenMi(ist)
    g.innerHTML = `
      <div class="yk-bas"><span class="yk-ikon">${istIkon(B, ist)}</span><div><h2>${katAdi(ist)}</h2><p class="yk-seviye sayi"></p></div></div>
      <div class="bolumlu yk-mod" role="group" aria-label="Alım miktarı">${MODLAR.map(([m, ad]) => `<button data-eylem="alim-modu" data-mod="${m}" aria-pressed="false">${ad}</button>`).join('')}</div>
      <div class="yk-satirlar"></div>
      <div class="yk-kademe"><div class="yk-kademe-ust"><span class="yk-kademe-sv sayi"></span><span class="yk-kademe-odul"></span></div><span class="cubuk"><i></i></span></div>
      <button class="btn btn-turuncu buyuk-btn" data-eylem="yukselt-al" data-istasyon="${ist}" data-uzun data-ogretici="sheet-yukselt"><span class="parla"></span><span class="etiket sayi">Yükselt</span><span class="yk-para">${ikon('para')}</span></button>
      <p class="yk-ipucu">Basılı tutarak art arda yükseltebilirsin.</p>
      <div class="yk-yonetici"><canvas width="72" height="72"></canvas><span class="yon-bilgi"><b></b><span class="yetenek"></span><span class="hal sayi"></span></span>
        <button class="btn btn-yesil kucuk-btn" data-eylem="yetenek-kullan" data-istasyon="${ist}" hidden>${ikon('yildirim')}Kullan</button>
        <button class="btn btn-krem kucuk-btn" data-eylem="yonetici-ac" data-istasyon="${ist}">Yönetici</button></div>`
    const satirAdlari = madenMi_ ? ['Üretim', 'Madenci', 'Yığın kapasitesi'] : ist === 'asansor' ? ['Kapasite', 'Hız', 'Tur süresi'] : ['Kamyon', 'Kamyon yükü', 'Depo kapasitesi']
    const satirlar = g.querySelector('.yk-satirlar')
    satirlar.innerHTML = satirAdlari.map((a) => `<div class="yk-satir"><span>${a}</span><span class="yk-deger sayi"><b class="simdi"></b><span class="ok"> → </span><b class="sonra"></b></span></div>`).join('')
    const el = {
      seviye: g.querySelector('.yk-seviye'),
      mod: g.querySelector('.yk-mod'),
      modlar: [...g.querySelectorAll('.yk-mod button')],
      simdi: [...satirlar.querySelectorAll('.simdi')],
      ok: [...satirlar.querySelectorAll('.ok')],
      sonra: [...satirlar.querySelectorAll('.sonra')],
      kademeSv: g.querySelector('.yk-kademe-sv'),
      kademeOdul: g.querySelector('.yk-kademe-odul'),
      kademeBar: g.querySelector('.yk-kademe .cubuk'),
      btn: g.querySelector('.buyuk-btn'),
      etiket: g.querySelector('.buyuk-btn .etiket'),
      para: g.querySelector('.buyuk-btn .yk-para'),
      ipucu: g.querySelector('.yk-ipucu'),
      yonKutu: g.querySelector('.yk-yonetici'),
      yonPortre: g.querySelector('.yk-yonetici canvas'),
      yonAd: g.querySelector('.yk-yonetici b'),
      yonYetenek: g.querySelector('.yk-yonetici .yetenek'),
      yonHal: g.querySelector('.yk-yonetici .hal'),
      yonKullan: g.querySelector('.yk-yonetici [data-eylem="yetenek-kullan"]'),
      yonDugme: g.querySelector('.yk-yonetici [data-eylem="yonetici-ac"]'),
    }
    let yonId = undefined
    let sonSeviye = ''
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
      const sv = tk.maks ? `Seviye ${L}` : `Seviye ${L} → <span class="hedef">${yeniL}</span>`
      if (sv !== sonSeviye) { sonSeviye = sv; el.seviye.innerHTML = sv }
      // Maks seviyede segment gizlenir
      gizle(el.mod, tk.maks)
      for (const m of el.modlar) {
        const sec = String(d.alimModu) === m.dataset.mod
        if ((m.getAttribute('aria-pressed') === 'true') !== sec) m.setAttribute('aria-pressed', String(sec))
      }
      const s = degerler(d, b, L)
      const y = tk.maks ? s : degerler(d, b, yeniL)
      for (let k = 0; k < 3; k++) {
        yaz(el.simdi[k], s[k])
        gizle(el.ok[k], tk.maks)
        gizle(el.sonra[k], tk.maks)
        yaz(el.sonra[k], y[k])
        sinif(el.sonra[k], 'artis', y[k] !== s[k])
      }
      const liste = madenMi_ ? A.KADEME_MADEN : A.KADEME_ISTASYON
      const sonraki = E.sonrakiKademe(L, liste)
      const stat = madenMi_ ? 'Üretim' : ist === 'asansor' ? 'Kapasite' : 'Kamyon yükü'
      let ek = ''
      if (sonraki && madenMi_ && (sonraki === 10 || sonraki === 50)) ek = ' · +1 madenci'
      if (sonraki && ist === 'depo' && A.TASIYICI_ESIK.includes(sonraki)) ek = ' · +1 kamyon'
      yaz(el.kademeSv, sonraki ? `Sonraki kademe: ${sonraki}` : 'Bütün kademeler tamam')
      yaz(el.kademeOdul, sonraki ? `${stat} ×2${ek}` : '')
      cubuk(el.kademeBar, sonraki ? E.kademeIlerleme(L, liste) : 1)
      // Yönetici bölümü
      const yon = b.yoneticiler.find((x) => x.atanan === ist) || null
      if ((yon ? yon.id : null) !== yonId) {
        yonId = yon ? yon.id : null
        el.yonKutu.dataset.nadir = yon ? String(yon.nadirlik) : ''
        if (yon) { try { B.sahne.portre(yon.tohum, yon.nadirlik, el.yonPortre, 36) } catch {} }
        else { const c = el.yonPortre.getContext('2d'); c.clearRect(0, 0, el.yonPortre.width, el.yonPortre.height) }
        yaz(el.yonAd, yon ? yoneticiAdi(yon) : 'Yönetici yok')
        yaz(el.yonYetenek, yon ? `${nadirlik(yon.nadirlik).ad} · ${yetenekEtki(yon)}` : 'Yönetici bu istasyonu otomatik çalıştırır.')
        yaz(el.yonDugme, yon ? 'Yönetici' : 'Yönetici Tut')
      }
      if (yon) {
        const h = yetenekHali(d, yon)
        yaz(el.yonHal, h.durum === 'hazir' ? 'Yetenek hazır' : h.durum === 'aktif' ? 'Aktif · ' + sayac(h.kalan) : 'Bekleme · ' + sayac(h.kalan))
        sinif(el.yonHal, 'hazir', h.durum === 'hazir')
        gizle(el.yonKullan, h.durum !== 'hazir')
      } else { yaz(el.yonHal, ''); gizle(el.yonKullan, true) }
      // Ana düğme: Yükselt · bedel / Yetersiz para · bedel / MAKS SEVİYE (ikisi de pasif)
      const dis = tk.maks || !tk.yetiyor
      if (el.btn.disabled !== dis) el.btn.disabled = dis
      sinif(el.btn, 'btn-turuncu', !dis)
      gizle(el.para, tk.maks)
      gizle(el.ipucu, tk.maks)
      yaz(el.etiket, tk.maks ? 'MAKS SEVİYE' : (tk.yetiyor ? 'Yükselt · ' : 'Yetersiz para · ') + bicim(tk.maliyet))
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
    if (s && s.ok) canlandir(b, PARLA, 320)
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
      <p class="ayar-alt">Cevher Madenci · Sürüm 1.1.0<br>Geliştirici: İbrahim Can Göçmez</p>`
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

  // ════════ Yönetici modalı (docs/design/screens/yonetici.md) ════════
  // Mevcut yönetici bloğu (nadirlik halkası + nadirlik/durum rozetleri), yetenek ve
  // görevden alma, boştakiler listesi (Ata ikincil), tutma düğmeleri. Tek turuncu: Tut.
  const kapatDugme = '<button class="pencere-kapat" data-eylem="modal-kapat" data-ogretici-modal aria-label="Kapat">' + ikon('kapat') + '</button>'
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
        return `<div class="yon-satir" data-nadir="${y.nadirlik}"><canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="88" height="88"></canvas>
          <span class="yon-bilgi"><b>${yoneticiAdi(y)}</b><span class="yon-meta">${n.ad} · ${yetenekEtki(y)} · ${sure(n.sure)}</span></span>${dugme}</div>`
      }
      let html = `<header class="yon-ust"><h2>${katAdi(ist)} · Yönetici</h2>${kapatDugme}</header>`
      if (acilis) {
        const y = acilis.yonetici, n = nadirlik(y.nadirlik)
        html += `<div class="yon-acilis${y.nadirlik === 2 ? ' efsanevi' : ''}" data-nadir="${y.nadirlik}"><span class="kart-don"><canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="192" height="192"></canvas></span>
          <p class="yon-katildi"><b>${yoneticiAdi(y)} katıldı!</b><br><span class="nadir-rozet">${n.ad}</span> · ${yetenekEtki(y)}</p></div>`
      } else if (mevcut) {
        const n = nadirlik(mevcut.nadirlik)
        html += `<div class="yon-mevcut" data-nadir="${mevcut.nadirlik}"><canvas data-tohum="${mevcut.tohum}" data-nadir="${mevcut.nadirlik}" width="144" height="144"></canvas>
          <span class="yon-bilgi"><b>${yoneticiAdi(mevcut)}</b><span class="nadir-rozet">${n.ad}</span><span class="yetenek">${yetenekEtki(mevcut)} · ${sure(n.sure)}</span><span class="hal-rozet sayi"></span></span></div>
          <div class="yon-dugmeler"><button class="btn btn-yesil" data-eylem="yetenek-kullan" data-istasyon="${ist}">${ikon('yildirim')}Yeteneği Kullan</button><button class="btn btn-krem" data-eylem="gorevden-al" data-istasyon="${ist}">Görevden Al</button></div>`
      } else {
        html += `<p class="yon-yok">Bu istasyonda yönetici yok.</p>`
      }
      html += `<p class="yon-baslik">Boştaki yöneticiler</p>`
      // Ata ikincil düğme: pencerede tek ana (turuncu) eylem "Yeni Yönetici Tut"
      html += bostakiler.length ? `<div class="yon-liste">${bostakiler.map((y) => satir(y, `<button class="btn btn-krem" data-eylem="yonetici-ata" data-id="${y.id}" data-istasyon="${ist}">Ata</button>`)).join('')}</div>` : `<p class="yon-bos">Boşta yönetici yok.</p>`
      html += dolu
        ? `<div class="kirala"><button class="btn" disabled>Yönetici odası dolu (${A.MAKS_YONETICI}/${A.MAKS_YONETICI})</button></div>`
        : `<div class="kirala"><button class="btn btn-turuncu" data-eylem="yonetici-tut" data-odeme="para" data-istasyon="${ist}" data-ogretici="kirala"><span>Yeni Yönetici Tut · <span class="sayi maliyet">${bicim(maliyet)}</span></span>${ikon('para')}</button>
          <button class="btn btn-mavi" data-eylem="yonetici-tut" data-odeme="elmas" data-istasyon="${ist}">${ikon('elmas')}<span>Elmasla Tut · <span class="sayi">${A.ELMAS_KIRALAMA}</span></span></button></div>`
      g.innerHTML = html
      for (const c of g.querySelectorAll('canvas[data-tohum]')) {
        try { B.sahne.portre(+c.dataset.tohum, +c.dataset.nadir, c, c.width / 2) } catch {}
      }
      el = {
        hal: g.querySelector('.yon-mevcut .hal-rozet'),
        yetenekBtn: g.querySelector('.yon-dugmeler [data-eylem="yetenek-kullan"]'),
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
        sinif(el.hal, 'aktif', h.durum === 'aktif')
        // Yetenek düğmesi yalnız hazırken görünür
        if (el.yetenekBtn) gizle(el.yetenekBtn, h.durum !== 'hazir')
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

  // ════════ Çevrimdışı kazanç (docs/design/screens/cevrimdisi.md) ════════
  // Oyuna dönüşte ilk pencere. Perdeye dokunmak kapatmaz; Topla (ikincil) ya da
  // Topla x2 (yeşil, reklamlıysa ▶) ile toplanır. Reklam hatasında pencere açık kalır.
  // Bekleyen kazanç alt banttaki Çevrimdışı Kazanç panelinde de durur.
  let cdReklamda = false
  function cevrimdisiKur(g, veri, m) {
    m.kapatilabilir = false
    const d0 = B.durumAl()
    const bc0 = d0.bekleyenCevrimdisi
    if (!bc0 || !d0.bolgeler[bc0.bolge]) { setTimeout(() => { if (modal && modal.ad === 'cevrimdisi') modalKapat() }, 0); return null }
    const reklamsiz = !!(d0.satin && d0.satin.reklamsiz)
    g.innerHTML = `<h2>Sen yokken madencilerin çalıştı!</h2>
      <div class="kahraman">${ikon('para')}<span class="sayi cd-miktar"></span></div>
      <p class="cd-sure"></p>
      <p class="cd-yonetici" hidden>${ikon('yonetici')}<span></span></p>
      <div class="modal-dugmeler cd-dugmeler">
        <button class="btn btn-krem" data-eylem="cd-topla" data-kat="1" data-ogretici-modal>Topla</button>
        <button class="btn btn-yesil cd-x2" data-eylem="cd-topla" data-kat="2"><i class="cd-donen" aria-hidden="true"></i>${reklamsiz ? '' : ikon('oynat')}<span>Topla x2</span></button>
      </div>
      ${reklamsiz ? '' : '<p class="cd-not">x2 için kısa bir reklam izlersin.</p>'}`
    const el = {
      miktar: g.querySelector('.cd-miktar'),
      sure: g.querySelector('.cd-sure'),
      yon: g.querySelector('.cd-yonetici'),
      yonYazi: g.querySelector('.cd-yonetici span'),
    }
    let kapaniyor = false
    return (d) => {
      const bc = d.bekleyenCevrimdisi
      const nb = bc && d.bolgeler[bc.bolge]
      if (!nb) {
        // Başka yoldan toplandı (ya da geçersiz): pencere kendiliğinden kapanır
        if (!kapaniyor && !cdReklamda) { kapaniyor = true; setTimeout(() => { if (modal && modal.ad === 'cevrimdisi') modalKapat() }, 0) }
        return
      }
      yaz(el.miktar, bicim(bc.miktar))
      const sinir = E.cevrimdisiSinir(d, nb)
      yaz(el.sure, sure(Math.min(bc.sure, sinir)) + ' boyunca' + (bc.sinirli ? ` (en fazla ${saatYazi(sinir)})` : ''))
      const calisan = nb.yoneticiler.filter((y) => y.atanan).length
      gizle(el.yon, calisan === 0)
      if (calisan) yaz(el.yonYazi, `${calisan} yönetici çalıştı` + (eksikYoneticiVar(nb) ? ' · Yöneticisiz istasyonlar durdu' : ''))
    }
  }
  function cdTopla(kat, btn) {
    const s = B.eylem('cevrimdisiTopla', { kat })
    if (!s || !s.ok) return
    const r = btn.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
    B.ucanSikke(r.left - k.left + r.width / 2, r.top - k.top + r.height / 2, 14)
    if (modal && modal.ad === 'cevrimdisi') modalKapat()
  }
  B.eylemler['cd-topla'] = async (b) => {
    if (b.dataset.kat !== '2') { cdTopla(1, b); return }
    if (cdReklamda) return
    cdReklamda = true
    sinif(b, 'yukleniyor', true)
    b.setAttribute('aria-busy', 'true')
    let ok = false
    try { ok = await B.reklamIzle('cevrimdisi') } catch { ok = false }
    cdReklamda = false
    sinif(b, 'yukleniyor', false)
    b.removeAttribute('aria-busy')
    if (!ok) { B.bildir('bilgi', 'Reklam yüklenemedi, sonra tekrar dene'); return }
    cdTopla(2, b)
  }
  // Bekleyen kazanç varsa pencereyi bir kez açar (öğretici sürerken alt bant yeterli)
  let cdIlk = 0
  function cevrimdisiDenetle(d) {
    const bc = d.bekleyenCevrimdisi
    if (!bc || !d.bolgeler[bc.bolge] || !d.ogretici.bitti) return
    const simdi = performance.now()
    if (!cdIlk) cdIlk = simdi
    if (simdi - cdIlk < 600) return
    if ((modal && modal.ad === 'cevrimdisi') || kuyruk.some((k) => k.ad === 'cevrimdisi')) return
    modalAc('cevrimdisi', {})
  }

  const SAYFA_KUR = { yukseltme: yukseltmeKur, ayarlar: ayarlarKur, istasyonSec: istasyonSecKur, defter: defterKur }
  const MODAL_KUR = { yonetici: yoneticiKur, cevrimdisi: cevrimdisiKur, aktarim: aktarimKur, hikaye: hikayeKur }

  // Başka modüllerin alt sayfa / modal kurucusu kaydetmesi
  function kaydet(ad, kurucu, tur = 'sayfa') {
    if (tur === 'modal') MODAL_KUR[ad] = kurucu
    else { SAYFA_KUR[ad] = kurucu; SAYFALAR.add(ad) }
  }

  function ac(ad, veri) {
    if (SAYFALAR.has(ad)) sayfaAc(ad, veri || {})
    else modalAc(ad, veri || {})
  }

  // Hikâye kuyruğu: aynı sahne iki kez sıraya girmez
  function hikayeSirala(id) {
    if ((modal && modal.ad === 'hikaye' && modal.veri.id === id) || kuyruk.some((k) => k.ad === 'hikaye' && k.veri.id === id)) return
    modalAc('hikaye', { id })
  }

  function olay(o) {
    if (o.tip === 'hikaye') hikayeSirala(o.id)
  }

  function kare4(d) {
    cevrimdisiDenetle(d)
    if (sayfa && sayfa.kare4) sayfa.kare4(d)
    if (modal && modal.kare4) modal.kare4(d)
  }

  return {
    ac, olay, kare4, hikayeSirala, kaydet,
    kapatSayfa: sayfaKapat,
    kapatModal: modalKapat,
    acikSayfa: () => (sayfa ? sayfa.ad : null),
    acikModal: () => (modal ? modal.ad : null),
    acikMi: () => !!(sayfa || modal),
    modalEl, sayfaEl,
  }
}
