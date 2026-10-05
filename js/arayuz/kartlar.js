// ════════════════════════════════════════════════════════════════
//  KARTLAR (Paket C, §4.6) — #dunya katmanı: yüzey akış çipleri,
//  12 maden kartı (baştan kurulur, açılana kadar gizli), satır başı
//  yönetici rozetleri, asansör/depo rozetleri, sonraki maden kartı,
//  kademe şeritleri ve taban yazısı.
//  • Kartlar 4 Hz (yalnız görünür satırlar), rozet halkaları 10 Hz.
//  • Uzun basma (≥ 350 ms): seçili modla hızlı alım, 150 ms'de bir
//    (1,5 sn sonra 80 ms), para yettikçe.
// ════════════════════════════════════════════════════════════════
import { ikon, cevherIkonu } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, ozellik, cubuk, bicim, oranYazi, bolgeAl, istasyonAdi, nadirlik, yetenekHali,
  kartHizi, ogeYap, yoneticiAdi, yetenekBilgi, yetenekEtki, ses, titret,
} from './ortak.js'

const MAKS = 12
const CIP_X = [0.2, 0.5, 0.8]

export function kur(B) {
  const D = B.dunya
  // ── Çipler ──
  const cipler = [
    ogeYap(`<button class="cip" data-eylem="cip" data-hedef="madenci" aria-label="Madenciler">${ikon('madenci')}<span>Madenci</span></button>`),
    ogeYap(`<button class="cip" data-eylem="cip" data-hedef="asansor" aria-label="Asansör">${ikon('asansor')}<span>Asansör</span><i class="cip-sv sayi">Sv.1</i></button>`),
    ogeYap(`<button class="cip" data-eylem="cip" data-hedef="depo" aria-label="Depo">${ikon('sepet')}<span>Depo</span><i class="cip-sv sayi">Sv.1</i></button>`),
  ]
  const oklar = [ogeYap(`<i class="cip-ok">${ikon('ileri')}</i>`), ogeYap(`<i class="cip-ok">${ikon('ileri')}</i>`)]
  for (const c of cipler) D.appendChild(c)
  for (const o of oklar) D.appendChild(o)
  const cipSv = [null, cipler[1].querySelector('.cip-sv'), cipler[2].querySelector('.cip-sv')]

  // ── Kartlar ──
  const kartlar = []
  for (let i = 0; i < MAKS; i++) {
    const k = ogeYap(`<div class="kart" data-eylem="yukselt-ac" data-istasyon="m${i}" hidden>
      <span class="kart-ikon">${cevherIkonu('zonguldak')}</span>
      <b class="kart-ad">Maden ${i + 1}</b>
      <i class="kart-ok">${ikon('yukari')}</i>
      <span class="kart-sv">Seviye <span class="rakam sayi">1</span></span>
      <span class="kart-hiz">${ikon('para')}<span class="sayi">0/sn</span></span>
      <span class="kart-bar"><span class="cubuk"><i></i></span><span class="yuzde sayi">%0</span></span>
      <button class="btn btn-turuncu kart-btn" data-eylem="yukselt-ac" data-istasyon="m${i}" data-uzun ${i === 0 ? 'data-ogretici="m0-yukselt"' : ''}><span class="parla" style="--gecikme:${(i * 0.4).toFixed(1)}s"></span>${ikon('yukari')}<span class="etiket">Yükselt</span></button>
    </div>`)
    D.appendChild(k)
    const r = ogeYap(`<button class="yonetici-rozet bos" data-eylem="rozet-yonetici" data-istasyon="m${i}" aria-label="Maden ${i + 1} yöneticisi" ${i === 0 ? 'data-ogretici="m0-yonetici"' : ''} hidden>
      ${ikon('arti')}<span class="rozet-etiket">Yönetici</span><canvas class="portre" width="56" height="56"></canvas><i class="simsek">${ikon('yildirim')}</i></button>`)
    D.appendChild(r)
    kartlar.push({
      k, r,
      sv: k.querySelector('.kart-sv .rakam'),
      hiz: k.querySelector('.kart-hiz .sayi'),
      bar: k.querySelector('.kart-bar .cubuk'),
      yuzde: k.querySelector('.kart-bar .yuzde'),
      btn: k.querySelector('.kart-btn'),
      etiket: k.querySelector('.kart-btn .etiket'),
      portre: r.querySelector('.portre'),
      sonL: 0, yonId: null, acik: false,
    })
  }
  // Asansör ve depo rozetleri
  const ozelRozet = (ist, ad) => {
    const r = ogeYap(`<button class="yonetici-rozet kucuk bos" data-eylem="rozet-yonetici" data-istasyon="${ist}" aria-label="${ad} yöneticisi" data-ogretici="${ist}-yonetici">
      ${ikon('arti')}<span class="rozet-etiket">Yönetici</span><canvas class="portre" width="56" height="56"></canvas><i class="simsek">${ikon('yildirim')}</i></button>`)
    D.appendChild(r)
    return { r, portre: r.querySelector('.portre'), yonId: null }
  }
  const rozetA = ozelRozet('asansor', 'Asansör')
  const rozetD = ozelRozet('depo', 'Depo')

  // Sonraki maden kartı
  const kilitli = ogeYap(`<div class="kart kilitli" hidden>
    <span class="kart-ikon">${ikon('kilit')}</span>
    <b class="kart-ad">Maden 2</b>
    <span class="kart-sv">Yeni maden</span>
    <button class="btn btn-yesil kart-ac" data-eylem="maden-ac" data-i="1">${ikon('para')}<span class="etiket sayi">Aç · 40</span></button>
  </div>`)
  D.appendChild(kilitli)
  const kil = { ad: kilitli.querySelector('.kart-ad'), btn: kilitli.querySelector('.kart-ac'), etiket: kilitli.querySelector('.kart-ac .etiket') }
  const taban = ogeYap('<p class="taban-yazi" hidden>Bu bölgenin en derin noktası</p>')
  D.appendChild(taban)

  let sonAcik = -1
  const atanan = {}

  // ── Yerleşim (genişlik değişince) ──
  function yerlestir(d) {
    const y = B.yer
    for (let j = 0; j < 3; j++) cipler[j].style.left = Math.round(CIP_X[j] * y.W) + 'px'
    oklar[0].style.left = Math.round(0.35 * y.W) + 'px'
    oklar[1].style.left = Math.round(0.65 * y.W) + 'px'
    for (let i = 0; i < MAKS; i++) {
      const c = kartlar[i]
      const s = c.k.style
      s.left = y.kenar + 'px'
      s.top = (y.satirY(i) + y.KART_UST) + 'px'
      s.width = y.kartG + 'px'
      c.r.style.left = (y.odaX + 6) + 'px'
      c.r.style.top = (y.satirY(i) + 10) + 'px'
    }
    // Asansör ve depo rozetleri kendi çiplerinin sol üst köşesinde
    rozetA.r.style.left = Math.round(CIP_X[1] * y.W - 27 - 12) + 'px'
    rozetA.r.style.top = '48px'
    rozetD.r.style.left = Math.round(CIP_X[2] * y.W - 27 - 12) + 'px'
    rozetD.r.style.top = '48px'
    kilitli.style.left = y.kenar + 'px'
    kilitli.style.width = y.kartG + 'px'
    sonAcik = -1
    if (d) satirlariGuncelle(d)
  }

  // Açık maden sayısı değişince kartları göster/gizle
  function satirlariGuncelle(d) {
    const b = bolgeAl(d)
    const n = b.madenler.length
    if (n === sonAcik) return
    const y = B.yer
    for (let i = 0; i < MAKS; i++) {
      gizle(kartlar[i].k, i >= n)
      gizle(kartlar[i].r, i >= n)
      kartlar[i].acik = i < n
    }
    gizle(kilitli, n >= MAKS)
    if (n < MAKS) {
      kilitli.style.top = (y.satirY(n) + y.KART_UST) + 'px'
      yaz(kil.ad, 'Maden ' + (n + 1))
      kil.btn.dataset.i = String(n)
      if (n === 1) kil.btn.dataset.ogretici = 'm1-ac'
      else delete kil.btn.dataset.ogretici
    }
    gizle(taban, n < MAKS)
    taban.style.top = (y.YUZEY_H + MAKS * y.SATIR_H + 40) + 'px'
    sonAcik = n
  }

  // ── Bağlama ──
  function kare4(d) {
    const b = bolgeAl(d)
    satirlariGuncelle(d)
    const n = b.madenler.length
    const y = B.yer
    const ust = B.kaydirY - 140, alt = B.kaydirY + B.gorunurYuk + 20
    for (let i = 0; i < n; i++) {
      const sy = y.satirY(i)
      if (sy + y.SATIR_H < ust || sy > alt) continue
      const c = kartlar[i]
      const L = b.madenler[i].L
      if (c.sonL && L !== c.sonL) {
        c.sv.classList.remove('yuvarla')
        void c.sv.offsetWidth
        c.sv.classList.add('yuvarla')
      }
      c.sonL = L
      yaz(c.sv, String(L))
      yaz(c.hiz, oranYazi(kartHizi(d, b, i)))
      const maks = L >= A.MAKS_MADEN_SEVIYE
      const ilerleme = E.kademeIlerleme(L, A.KADEME_MADEN)
      cubuk(c.bar, maks ? 1 : ilerleme)
      yaz(c.yuzde, maks ? 'MAKS' : '%' + Math.floor(ilerleme * 100))
      yaz(c.etiket, maks ? 'MAKS' : 'Yükselt')
      const tk = maks ? null : E.teklif(d, b, 'm' + i, d.alimModu)
      sinif(c.k, 'alinir', !!(tk && tk.yetiyor))
      sinif(c.k, 'maks', maks)
    }
    if (n < MAKS) {
      const mal = E.madenAcilis(d, b, n)
      yaz(kil.etiket, 'Aç · ' + bicim(mal))
      const yetiyor = b.para >= mal
      sinif(kil.btn, 'btn-yesil', yetiyor)
      sinif(kil.btn, 'pasif', !yetiyor)
    }
    yaz(cipSv[1], 'Sv.' + b.asansor.L)
    yaz(cipSv[2], 'Sv.' + b.depo.L)
  }

  function rozetBagla(r, yon, d) {
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
      try { B.sahne.portre(yon.tohum, yon.nadirlik, r.portre, r.r.classList.contains('kucuk') ? 24 : 28) } catch {}
    }
    const h = yetenekHali(d, yon)
    sinif(r.r, 'hazir', h.durum === 'hazir')
    sinif(r.r, 'aktif', h.durum === 'aktif')
    sinif(r.r, 'bekleme', h.durum === 'bekleme')
    if (h.durum !== 'hazir') ozellik(r.r, '--oran', h.halka.toFixed(3))
  }

  function kare10(d) {
    const b = bolgeAl(d)
    for (const k in atanan) atanan[k] = null
    for (const y of b.yoneticiler) if (y.atanan) atanan[y.atanan] = y
    const ust = B.kaydirY - 140, alt = B.kaydirY + B.gorunurYuk + 20
    for (let i = 0; i < b.madenler.length; i++) {
      const sy = B.yer.satirY(i)
      if (sy + 128 < ust || sy > alt) continue
      rozetBagla(kartlar[i], atanan['m' + i], d)
    }
    if (B.kaydirY < 300) {
      rozetBagla(rozetA, atanan.asansor, d)
      rozetBagla(rozetD, atanan.depo, d)
    }
  }

  // ── Uzun basma: hızlı alım ──
  let uzun = null
  function uzunBasma(el) {
    if (!el || !el.dataset.istasyon) return
    const d = B.durumAl()
    if (!d.ogretici.bitti && d.ogretici.adim <= 4) return
    const ist = el.dataset.istasyon
    const bas = performance.now()
    let n = 0
    const adim = () => {
      const s = B.eylem('yukselt', { istasyon: ist })
      if (!s || !s.ok) { uzunBitti(); return }
      n++
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
    const i = +el.dataset.i
    const s = B.eylem('madenAc', { i })
    if (s && !s.ok && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
  }
  B.eylemler.cip = (el) => {
    const h = el.dataset.hedef
    if (h === 'asansor' || h === 'depo') { B.pencere.ac('yukseltme', { istasyon: h }); return }
    const d = B.durumAl(), b = bolgeAl(d)
    let hedef = 0
    for (let i = 0; i < b.madenler.length; i++) {
      const tk = E.teklif(d, b, 'm' + i, d.alimModu)
      if (tk.yetiyor) { hedef = i; break }
    }
    B.kaydirKonumu(Math.max(0, B.yer.satirY(hedef) - 40), { anim: true })
    const k = kartlar[hedef].k
    k.classList.remove('vurgu')
    void k.offsetWidth
    k.classList.add('vurgu')
  }

  function serit(ist, metin) {
    const y = B.yer
    let x, yy
    if (ist === 'asansor') { x = y.kuyuX + y.kuyuG / 2; yy = y.YUZEY_H + 30 }
    else if (ist === 'depo') { x = y.sagX + y.sagG / 2 - 30; yy = y.YUZEY_H + 60 }
    else { const i = +ist.slice(1); x = y.odaX + y.odaG / 2; yy = y.satirY(i) + 30 }
    const s = ogeYap(`<div class="kademe-serit"></div>`)
    s.textContent = metin
    s.style.left = Math.max(60, Math.min(y.W - 60, x)) + 'px'
    s.style.top = yy + 'px'
    D.appendChild(s)
    setTimeout(() => s.remove(), 1450)
  }

  function olay(o, d) {
    if (o.tip === 'yukseltildi') {
      const i = E.madenIndeks(o.istasyon)
      if (i >= 0) {
        const c = kartlar[i]
        c.k.classList.remove('nabiz')
        void c.k.offsetWidth
        c.k.classList.add('nabiz', 'halka')
        setTimeout(() => c.k.classList.remove('halka'), 400)
        if (o.kademeler && o.kademeler.length) {
          c.bar.classList.remove('flas')
          void c.bar.offsetWidth
          c.bar.classList.add('flas')
        }
      }
      if (o.kademeler && o.kademeler.length) {
        const m = o.kademeler[o.kademeler.length - 1]
        const kat = o.kademeler.length > 1 ? '×' + Math.pow(2, o.kademeler.length) : '×2'
        const stat = o.istasyon === 'asansor' ? 'Kapasite' : o.istasyon === 'depo' ? 'Taşıyıcı yükü' : 'Üretim'
        serit(o.istasyon, `Kademe ${m} · ${kat}`)
        B.bildir('basari', `Kademe ${m}! ${stat} ${kat}`)
      }
    } else if (o.tip === 'madenAcildi') {
      satirlariGuncelle(d)
      const c = kartlar[o.i]
      c.k.classList.remove('giris')
      void c.k.offsetWidth
      c.k.classList.add('giris')
      B.bildir('basari', `Maden ${o.i + 1} açıldı!`)
    } else if (o.tip === 'yetenek') {
      const y = o.yonetici
      if (y) B.bildir('basari', `${yoneticiAdi(y)}: ${yetenekEtki(y)}!`)
    }
  }

  yerlestir(B.durumAl ? B.durumAl() : null)
  return { yerlestir, kare4, kare10, olay, uzunBasma, uzunBitti, kartEl: (i) => kartlar[i] && kartlar[i].k }
}
