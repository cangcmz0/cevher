// ════════════════════════════════════════════════════════════════
//  KARTLAR (görsel yön 2) — #dunya katmanı: kat kartları ("5. Kat /
//  Kömür"), kartın yanındaki yeşil yükseltme okları, galeri yönetici
//  rozetleri, sonraki (kilitli) kat kartı, "1. Kat / Yükleme" kartı,
//  depo rozeti; #maden-ust katmanı: Asansör etiketi ve Darboğaz kartı.
//  • Kartlar 4 Hz (yalnız görünür katlar), rozet halkaları 10 Hz.
//  • Uzun basma (≥ 350 ms): seçili modla hızlı alım, 150 ms'de bir
//    (1,5 sn sonra 80 ms), para yettikçe.
// ════════════════════════════════════════════════════════════════
import { ikon, cevherIkonu } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, ozellik, cubuk, bicim, oranYazi, bolgeAl, nadirlik, yetenekHali,
  kartHizi, ogeYap, yoneticiAdi, yetenekEtki, canlandir, NABIZ, SALLA, PARLA, YUVARLA,
} from './ortak.js'

const MAKS = 12
const katNo = (i) => i + 2            // Maden i → "(i+2). Kat" (1. Kat yükleme katıdır)
const cevherAdi = (d) => (A.BOLGE[d.aktifBolge] || A.BOLGELER[0]).cevher

export function kur(B) {
  const D = B.dunya
  const ustKat = B.kok.querySelector('#maden-ust')
  const d0 = B.durumAl()

  // ── Kat kartları, yükseltme okları ve galeri rozetleri ──
  const kartlar = []
  for (let i = 0; i < MAKS; i++) {
    const k = ogeYap(`<div class="kart" data-eylem="yukselt-ac" data-istasyon="m${i}" hidden>
      <b class="kart-ad">${katNo(i)}. Kat</b>
      <span class="kart-cevher">${cevherAdi(d0)}</span>
      <span class="kart-ikon">${cevherIkonu('zonguldak')}</span>
      <i class="kart-sv sayi">Sv.1</i>
      <span class="kart-hiz">${ikon('para')}<span class="sayi">0/sn</span></span>
      <span class="cubuk kart-bar"><i></i></span>
      <span class="kart-yuzde sayi">%0</span>
    </div>`)
    D.appendChild(k)
    const ok = ogeYap(`<button class="yukselt-ok pasif" data-eylem="yukselt-ac" data-istasyon="m${i}" data-uzun aria-label="${katNo(i)}. Kat yükselt" ${i === 0 ? 'data-ogretici="m0-yukselt"' : ''} hidden>${ikon('yukari')}</button>`)
    D.appendChild(ok)
    const r = ogeYap(`<button class="yonetici-rozet bos" data-eylem="rozet-yonetici" data-istasyon="m${i}" aria-label="${katNo(i)}. Kat yöneticisi" ${i === 0 ? 'data-ogretici="m0-yonetici"' : ''} hidden>
      ${ikon('arti')}<span class="rozet-etiket">Yönetici</span><canvas class="portre" width="48" height="48"></canvas><i class="simsek">${ikon('yildirim')}</i></button>`)
    D.appendChild(r)
    kartlar.push({
      k, ok, r,
      sv: k.querySelector('.kart-sv'),
      hiz: k.querySelector('.kart-hiz .sayi'),
      bar: k.querySelector('.kart-bar'),
      yuzde: k.querySelector('.kart-yuzde'),
      portre: r.querySelector('.portre'),
      sonL: 0, yonId: null,
    })
  }

  // ── Kilitli (sonraki) kat ──
  const kilitli = ogeYap(`<div class="kart kilitli" hidden>
    <b class="kart-ad">3. Kat</b>
    <span class="kart-cevher">Yeni maden</span>
    <span class="kart-ikon">${ikon('kilit')}</span>
    <button class="btn btn-yesil kart-ac" data-eylem="maden-ac" data-i="1">${ikon('para')}<span class="etiket sayi">Aç · 40</span></button>
  </div>`)
  D.appendChild(kilitli)
  const kil = { ad: kilitli.querySelector('.kart-ad'), btn: kilitli.querySelector('.kart-ac'), etiket: kilitli.querySelector('.kart-ac .etiket') }

  // ── 1. Kat Yükleme kartı ve depo rozeti ──
  const yk = ogeYap(`<div class="kart yukleme" data-eylem="yukselt-ac" data-istasyon="depo">
    <b class="kart-ad">1. Kat</b>
    <span class="kart-cevher">Yükleme</span>
    <i class="kart-ok-sari">${ikon('geri')}</i>
    <i class="kart-sv sayi" style="top:36px;right:20px">Sv.1</i>
    <span class="kart-hiz">${ikon('sepet')}<span class="sayi">1 vagon</span></span>
    <span class="cubuk kart-bar"><i></i></span>
    <span class="kart-yuzde sayi">%0</span>
  </div>`)
  D.appendChild(yk)
  const ykOk = ogeYap(`<button class="yukselt-ok pasif" data-eylem="yukselt-ac" data-istasyon="depo" data-uzun aria-label="Depoyu yükselt">${ikon('yukari')}</button>`)
  D.appendChild(ykOk)
  const ykEl = { sv: yk.querySelector('.kart-sv'), hiz: yk.querySelector('.kart-hiz .sayi'), bar: yk.querySelector('.kart-bar'), yuzde: yk.querySelector('.kart-yuzde') }
  const rozetD = ogeYap(`<button class="yonetici-rozet bos" data-eylem="rozet-yonetici" data-istasyon="depo" aria-label="Depo yöneticisi" data-ogretici="depo-yonetici">
    ${ikon('arti')}<span class="rozet-etiket">Yönetici</span><canvas class="portre" width="48" height="48"></canvas><i class="simsek">${ikon('yildirim')}</i></button>`)
  D.appendChild(rozetD)
  const rD = { r: rozetD, portre: rozetD.querySelector('.portre'), yonId: null }

  // ── Görünüme sabit: Asansör etiketi ve Darboğaz kartı ──
  const asansorKap = ogeYap(`<div class="asansor-kap" style="position:absolute;right:4px;top:34%">
    <button class="asansor-etiket" data-eylem="yukselt-ac" data-istasyon="asansor" style="position:relative;right:0;top:0"><b>Asansör</b><span class="sayi">Sv.1</span></button>
    <button class="yonetici-rozet bos" data-eylem="rozet-yonetici" data-istasyon="asansor" aria-label="Asansör yöneticisi" data-ogretici="asansor-yonetici" style="left:-24px;top:7px;width:26px;height:26px">
      ${ikon('arti')}<canvas class="portre" width="40" height="40" style="inset:2px;width:20px;height:20px"></canvas><i class="simsek">${ikon('yildirim')}</i></button>
  </div>`)
  ustKat.appendChild(asansorKap)
  const asSv = asansorKap.querySelector('.asansor-etiket span')
  const rA = { r: asansorKap.querySelector('.yonetici-rozet'), portre: asansorKap.querySelector('.portre'), yonId: null }
  const darbogaz = ogeYap(`<button class="darbogaz-kart bos" data-eylem="darbogaz" aria-live="polite"><span class="bas">${ikon('uyari')}Darboğaz</span><span class="alt"></span></button>`)
  ustKat.appendChild(darbogaz)
  const dbAlt = darbogaz.querySelector('.alt')

  let sonAcik = -1
  let sonDarbogaz = null
  const atanan = {}

  // ── Yerleşim ──
  function yerlestir(d) {
    const y = B.yer
    for (let i = 0; i < MAKS; i++) {
      const c = kartlar[i]
      const ust = y.satirY(i) + y.KART_UST
      c.k.style.cssText = `left:${y.kenar}px;top:${ust}px;width:${y.kartG}px`
      c.ok.style.cssText = `left:${y.kenar + y.kartG - 8}px;top:${ust + y.KART_H - 20}px`
      c.r.style.cssText = `left:${y.odaX + 12}px;top:${y.satirY(i) + 16}px`
    }
    kilitli.style.left = y.kenar + 'px'
    kilitli.style.width = y.kartG + 'px'
    const ykUst = y.yuklemeY + 16
    yk.style.cssText = `left:${y.kenar}px;top:${ykUst}px;width:${y.kartG}px`
    ykOk.style.cssText = `left:${y.kenar + y.kartG - 8}px;top:${ykUst + y.KART_H - 20}px`
    rozetD.style.cssText = `left:${y.depo.x + 8}px;top:${y.yuklemeY + 36}px`
    sonAcik = -1
    if (d) katlariGuncelle(d)
  }

  function katlariGuncelle(d) {
    const b = bolgeAl(d)
    const n = b.madenler.length
    if (n === sonAcik) return
    const y = B.yer
    for (let i = 0; i < MAKS; i++) {
      gizle(kartlar[i].k, i >= n)
      gizle(kartlar[i].ok, i >= n)
      gizle(kartlar[i].r, i >= n)
    }
    gizle(kilitli, n >= MAKS)
    if (n < MAKS) {
      kilitli.style.top = (y.satirY(n) + y.KART_UST) + 'px'
      yaz(kil.ad, katNo(n) + '. Kat')
      kil.btn.dataset.i = String(n)
      if (n === 1) kil.btn.dataset.ogretici = 'm1-ac'
      else delete kil.btn.dataset.ogretici
    }
    sonAcik = n
  }

  function okBagla(ok, tk, maks) {
    sinif(ok, 'alinir', !!(tk && tk.yetiyor))
    sinif(ok, 'pasif', !maks && !(tk && tk.yetiyor))
    sinif(ok, 'maks', maks)
  }

  // ── Bağlama (4 Hz) ──
  function kare4(d) {
    const b = bolgeAl(d)
    katlariGuncelle(d)
    const n = b.madenler.length
    const y = B.yer
    const ust = B.kaydirY - 120, alt = B.kaydirY + B.gorunurYuk + 20
    for (let i = 0; i < n; i++) {
      const sy = y.satirY(i)
      if (sy + y.SATIR_H < ust || sy > alt) continue
      const c = kartlar[i]
      const L = b.madenler[i].L
      if (c.sonL && L !== c.sonL) canlandir(c.sv, YUVARLA, 200)
      c.sonL = L
      yaz(c.sv, 'Sv.' + L)
      yaz(c.hiz, oranYazi(kartHizi(d, b, i)))
      const maks = L >= A.MAKS_MADEN_SEVIYE
      const ilerleme = E.kademeIlerleme(L, A.KADEME_MADEN)
      cubuk(c.bar, maks ? 1 : ilerleme)
      yaz(c.yuzde, maks ? 'MAKS' : '%' + Math.floor(ilerleme * 100))
      sinif(c.k, 'maks', maks)
      okBagla(c.ok, maks ? null : E.teklif(d, b, 'm' + i, d.alimModu), maks)
    }
    if (n < MAKS) {
      const mal = E.madenAcilis(d, b, n)
      yaz(kil.etiket, 'Aç · ' + bicim(mal))
      const yetiyor = b.para >= mal
      sinif(kil.btn, 'btn-yesil', yetiyor)
      sinif(kil.btn, 'pasif', !yetiyor)
    }
    // Yükleme katı (depo)
    if (y.yuklemeY < alt) {
      const L = b.depo.L
      yaz(ykEl.sv, 'Sv.' + L)
      yaz(ykEl.hiz, E.tasiyiciSayisi(L) + ' vagon')
      const maks = L >= A.MAKS_ISTASYON_SEVIYE
      const il = E.kademeIlerleme(L, A.KADEME_ISTASYON)
      cubuk(ykEl.bar, maks ? 1 : il)
      yaz(ykEl.yuzde, maks ? 'MAKS' : '%' + Math.floor(il * 100))
      okBagla(ykOk, maks ? null : E.teklif(d, b, 'depo', d.alimModu), maks)
    }
    yaz(asSv, 'Sv.' + b.asansor.L)
    // Darboğaz
    const db = d.calisma.darbogaz
    if (db !== sonDarbogaz) {
      const m = db ? A.DARBOGAZ_METIN[db] : null
      if (m) {
        yaz(dbAlt, m[0])
        if (sonDarbogaz) canlandir(darbogaz, SALLA, 300)
      }
      sinif(darbogaz, 'bos', !m)
      darbogaz.tabIndex = m ? 0 : -1
      sonDarbogaz = db
    }
  }

  function rozetBagla(r, yon, d, boyut) {
    if (!yon) {
      sinif(r.r, 'bos', true)
      sinif(r.r, 'dolu', false)
      sinif(r.r, 'hazir', false); sinif(r.r, 'aktif', false); sinif(r.r, 'bekleme', false)
      r.yonId = null
      return
    }
    sinif(r.r, 'bos', false)
    sinif(r.r, 'dolu', true)
    if (r.yonId !== yon.id) {
      r.yonId = yon.id
      ozellik(r.r, '--nr', nadirlik(yon.nadirlik).renk)
      try { B.sahne.portre(yon.tohum, yon.nadirlik, r.portre, boyut) } catch {}
    }
    const h = yetenekHali(d, yon)
    sinif(r.r, 'hazir', h.durum === 'hazir')
    sinif(r.r, 'aktif', h.durum === 'aktif')
    sinif(r.r, 'bekleme', h.durum === 'bekleme')
    if (h.durum !== 'hazir') ozellik(r.r, '--oran', h.halka.toFixed(3))
  }

  // ── Rozetler (10 Hz) ──
  function kare10(d) {
    const b = bolgeAl(d)
    for (const k in atanan) atanan[k] = null
    for (const y of b.yoneticiler) if (y.atanan) atanan[y.atanan] = y
    const ust = B.kaydirY - 120, alt = B.kaydirY + B.gorunurYuk + 20
    for (let i = 0; i < b.madenler.length; i++) {
      const sy = B.yer.satirY(i)
      if (sy + B.yer.SATIR_H < ust || sy > alt) continue
      rozetBagla(kartlar[i], atanan['m' + i], d, 24)
    }
    rozetBagla(rA, atanan.asansor, d, 20)
    if (B.yer.yuklemeY < alt) rozetBagla(rD, atanan.depo, d, 24)
  }

  // ── Uzun basma: hızlı alım ──
  let uzun = null
  function uzunBasma(el) {
    if (!el || !el.dataset.istasyon) return
    const d = B.durumAl()
    if (!d.ogretici.bitti && d.ogretici.adim <= 4) return
    const ist = el.dataset.istasyon
    const bas = performance.now()
    const adim = () => {
      const s = B.eylem('yukselt', { istasyon: ist })
      if (!s || !s.ok) { uzunBitti(); return }
      const gecen = performance.now() - bas
      uzun = { el, z: setTimeout(adim, gecen > 1500 ? 80 : 150) }
    }
    uzunBitti()
    el.classList.add('basili')
    uzun = { el, z: 0 }
    adim()
  }
  function uzunBitti() {
    if (!uzun) return
    clearTimeout(uzun.z)
    uzun.el.classList.remove('basili')
    uzun = null
  }

  // ── Düğmeler ──
  B.eylemler['yukselt-ac'] = (el) => B.pencere.ac('yukseltme', { istasyon: el.dataset.istasyon })
  B.eylemler['rozet-yonetici'] = (el) => {
    const ist = el.dataset.istasyon
    const d = B.durumAl()
    const b = bolgeAl(d)
    const y = b.yoneticiler.find((x) => x.atanan === ist)
    if (y && yetenekHali(d, y).durum === 'hazir') {
      const s = B.eylem('yetenek', { istasyon: ist })
      if (s && s.ok) return
    }
    B.pencere.ac('yonetici', { istasyon: ist })
  }
  B.eylemler['maden-ac'] = (el) => {
    const s = B.eylem('madenAc', { i: +el.dataset.i })
    if (s && !s.ok && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
  }
  B.eylemler.darbogaz = () => {
    const d = B.durumAl()
    const db = d.calisma.darbogaz
    if (!db) { B.pencere.ac('yukseltme', { istasyon: 'asansor' }); return }
    const ist = db.startsWith('asansor') ? 'asansor' : 'depo'
    B.istasyonaKaydir(ist)
    if (db.endsWith('Manuel')) B.pencere.ac('yonetici', { istasyon: ist })
    else B.pencere.ac('yukseltme', { istasyon: ist })
  }

  function serit(ist, metin) {
    const y = B.yer
    let x, yy
    if (ist === 'asansor') { x = y.kuyuX - 30; yy = B.kaydirY + 40 }
    else if (ist === 'depo') { x = y.depo.x + y.depo.w / 2 - 10; yy = y.yuklemeY + 20 }
    else { const i = +ist.slice(1); x = y.odaX + y.odaG / 2; yy = y.satirY(i) + 30 }
    const s = ogeYap('<div class="kademe-serit"></div>')
    s.textContent = metin
    s.style.left = Math.max(60, Math.min(y.W - 60, x)) + 'px'
    s.style.top = yy + 'px'
    D.appendChild(s)
    setTimeout(() => s.remove(), 1450)
  }

  function olay(o, d) {
    if (o.tip === 'yukseltildi') {
      const i = E.madenIndeks(o.istasyon)
      const c = i >= 0 ? kartlar[i] : null
      const kartEl = c ? c.k : o.istasyon === 'depo' ? yk : null
      if (kartEl) {
        canlandir(kartEl, NABIZ, 240)
        if (!kartEl.classList.contains('halka')) {
          kartEl.classList.add('halka')
          setTimeout(() => kartEl.classList.remove('halka'), 400)
        }
      }
      if (o.kademeler && o.kademeler.length) {
        const bar = c ? c.bar : o.istasyon === 'depo' ? ykEl.bar : null
        if (bar) canlandir(bar.firstElementChild, PARLA, 300)
        const m = o.kademeler[o.kademeler.length - 1]
        const kat = o.kademeler.length > 1 ? '×' + Math.pow(2, o.kademeler.length) : '×2'
        const stat = o.istasyon === 'asansor' ? 'Kapasite' : o.istasyon === 'depo' ? 'Vagon yükü' : 'Üretim'
        serit(o.istasyon, `Kademe ${m} · ${kat}`)
        B.bildir('basari', `Kademe ${m}! ${stat} ${kat}`)
      }
    } else if (o.tip === 'madenAcildi') {
      katlariGuncelle(d)
      canlandir(kartlar[o.i].k, [{ transform: 'scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], 300, { easing: 'cubic-bezier(.3,1.6,.5,1)' })
      B.bildir('basari', `${katNo(o.i)}. Kat açıldı!`)
    } else if (o.tip === 'yetenek') {
      if (o.yonetici) B.bildir('basari', `${yoneticiAdi(o.yonetici)}: ${yetenekEtki(o.yonetici)}!`)
    }
  }

  yerlestir(d0)
  return { yerlestir, kare4, kare10, olay, uzunBasma, uzunBitti, kartEl: (i) => kartlar[i] && kartlar[i].k }
}
