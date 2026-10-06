// ════════════════════════════════════════════════════════════════
//  MADEN GENİŞLETME (görsel yön 2, referans2 3. ekran) — Yöneticiler sekmesi.
//  • Dört bölüm referanstan birebir kesildi (img/ref/mg-*.png, 397 px
//    genişlik): kaynaklar, yöneticiler, lojistik, kontrat + prestij.
//  • Kaynak kutuları bölgelerdir (Kömür → Zonguldak, Demir → Ereğli,
//    Taş → Karabük, Bakır → Kastamonu); dokununca o bölgeye geçilir.
//  • Dört yönetici kartı hikâyenin ortaklarıdır (Ahmet, Elif, Mehmet,
//    Zeynep): sahnede tanışınca katılır, elmasla seviye atlar.
//  • İstasyon yöneticileri (ustabaşılar) "Tümünü Gör" penceresindedir.
//  • Alt pencereler: ortak, ustalar, lojistik, prestij.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, cubuk, bicim, sayac, sure, bolgeAl, nadirlik, yetenekEtki, yoneticiAdi, yetenekHali, canlandir,
} from './ortak.js'
import { kontratDurumu, prestijUygun } from '../benzetim.js'
import { KISILER } from '../hikaye.js'
import { kontratAl } from './harita.js'

const RW = 397
const yuzde = (v, t) => (v / t * 100).toFixed(3) + '%'
const kutu = (x, y, w, h, H) => `left:${yuzde(x, RW)};top:${yuzde(y, H)};width:${yuzde(w, RW)};height:${yuzde(h, H)}`
const UH = 189, YH = 252, LH = 129, AH = 152
const SALLA = [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }]

// Kaynak kutuları (mg-ust içinde) → bölge
const KAYNAK = [
  { kod: 'zonguldak', k: [9.7, 58.7, 94, 116.6] },
  { kod: 'eregli', k: [108.7, 58.7, 88.3, 116.6] },
  { kod: 'kastamonu', k: [203, 58.7, 91.7, 116.6] },
  { kod: 'karabuk', k: [300, 58.7, 92, 116.6] },
]
// Ortak kartları (mg-yon içinde): kart kutusu, etki yazısı yaması, yama rengi
const KART = {
  ahmet: { k: [13, 33, 92, 156], y: [39, 140.5, 59, 13], r: '#03362A' },
  elif: { k: [109, 33, 89, 156], y: [136.5, 140.5, 56, 13], r: '#0D2F50' },
  mehmet: { k: [203, 33, 91, 156], y: [230, 140.5, 56, 13], r: '#0C2E42' },
  zeynep: { k: [297.7, 33, 91, 156], y: [324, 140.5, 59, 13], r: '#0E2A56' },
}
// Lojistik kutuları (mg-loj içinde): dokunma, Lv yaması, çubuk
const LOJ = [
  { tur: 'depo', ad: 'Maden Vagonu', k: [15, 38, 89, 92], lv: [44, 97.5, 32, 14], c: [23, 113, 76, 10] },
  { tur: 'asansor', ad: 'Konveyör', k: [116, 38, 94, 92], lv: [149, 97.5, 32, 14], c: [128, 113, 72, 10] },
  { tur: 'liman', ad: 'Liman', k: [230, 38, 73, 92], lv: [249, 97.5, 32, 14], c: [235, 113, 62, 10] },
  { tur: 'ambar', ad: 'Depo', k: [315, 38, 69, 92], lv: [333, 97.5, 32, 14], c: [320, 113, 59, 10] },
]

export const ortakEtkiYazi = (o, L) => o.metin.replace('{p}', Math.round((o.taban + o.artis * (Math.max(1, L) - 1)) * 100))

export function kur(B, govde) {
  govde.innerHTML = `
    <div class="mg">
      <div class="hr-katman" style="aspect-ratio:${RW}/${UH}">
        <img src="img/ref/mg-ust.png" alt="Maden Genişletme: Hangi kaynağa odaklanmak istiyorsun?" draggable="false">
        ${KAYNAK.map((t) => `<button class="mg-kaynak" data-eylem="mg-kaynak" data-kod="${t.kod}" style="${kutu(...t.k, UH)}" aria-label="${A.BOLGE[t.kod].cevher}">
          <i class="mg-kilit">${ikon('kilit')}<b class="sayi"></b></i></button>`).join('')}
      </div>
      <div class="hr-katman" style="aspect-ratio:${RW}/${YH}">
        <img src="img/ref/mg-yon.png" alt="Yöneticiler" draggable="false">
        <span class="hr-yama mg-sayi sayi" style="${kutu(97, 9.5, 24, 13, YH)};--yb:#022131"></span>
        <button class="hr-sicak" data-eylem="mg-tumu" style="${kutu(300, 4, 84, 22, YH)}" aria-label="Tümünü Gör"></button>
        ${A.ORTAKLAR.map((o) => {
          const k = KART[o.kod]
          return `<span class="hr-yama mg-etki" data-etki="${o.kod}" style="${kutu(...k.y, YH)};--yb:${k.r}"></span>
            <button class="mg-ortak" data-eylem="mg-ortak" data-kod="${o.kod}" style="${kutu(...k.k, YH)}" aria-label="${KISILER[o.kod].ad}">
              <i class="mg-ortak-kilit">${ikon('kilit')}<small>Hikâyede tanışacaksın</small></i><i class="mg-lv sayi"></i></button>`
        }).join('')}
        <button class="hr-sicak" data-eylem="mg-tumu" style="${kutu(9, 191, 385, 57, YH)}" aria-label="Ustabaşılar ve yetenekler"></button>
      </div>
      <div class="hr-katman" style="aspect-ratio:${RW}/${LH}">
        <img src="img/ref/mg-loj.png" alt="Lojistik ve Altyapı" draggable="false">
        ${LOJ.map((l) => `<span class="hr-yama mg-lv-yama sayi" data-lv="${l.tur}" style="${kutu(...l.lv, LH)};--yb:#02232F"></span>
          <span class="hr-cubuk mg-cubuk" data-cubuk="${l.tur}" style="${kutu(...l.c, LH)}"><i></i></span>
          <button class="hr-sicak" data-eylem="mg-loj" data-tur="${l.tur}" style="${kutu(...l.k, LH)}" aria-label="${l.ad}"></button>`).join('')}
      </div>
      <div class="hr-katman" style="aspect-ratio:${RW}/${AH}">
        <img src="img/ref/mg-alt.png" alt="Kontrat Hedefleri ve Prestij" draggable="false">
        <div class="hr-yama hr-krem mg-kyazi" style="${kutu(52, 53, 114, 27, AH)};--yb:#F8EACB"><b></b><span></span></div>
        <span class="hr-yama hr-krem mg-kodul sayi" style="${kutu(193, 84.5, 36, 13, AH)};--yb:#F1E2BE"></span>
        <span class="hr-yama hr-krem mg-kelmas sayi" style="${kutu(193, 99.5, 36, 13, AH)};--yb:#F1E2BE"></span>
        <div class="hr-cubuk mg-kcubuk" style="${kutu(21.5, 89.5, 137.5, 15, AH)}"><i></i><span class="sayi"></span></div>
        <button class="hr-sicak hr-detay mg-detay" data-eylem="mg-kontrat" style="${kutu(21.5, 112, 105, 24, AH)}" aria-label="Kontrat"><span>Teslim Al</span></button>
        <span class="hr-yama mg-prestij sayi" style="${kutu(285, 129.5, 72, 13, AH)};--yb:#1E1A45"></span>
        <i class="mg-prestij-kilit" style="${kutu(272.5, 95, 102.5, 30, AH)}" hidden></i>
        <button class="hr-sicak" data-eylem="mg-prestij" style="${kutu(272.5, 95, 102.5, 30, AH)}" aria-label="Prestij Yap"></button>
      </div>
    </div>`

  const q = (s) => govde.querySelector(s)
  const qa = (s) => [...govde.querySelectorAll(s)]
  const el = {
    kaynaklar: qa('.mg-kaynak'),
    sayi: q('.mg-sayi'),
    ortaklar: Object.fromEntries(qa('.mg-ortak').map((x) => [x.dataset.kod, x])),
    etkiler: Object.fromEntries(qa('.mg-etki').map((x) => [x.dataset.etki, x])),
    lv: Object.fromEntries(qa('[data-lv]').map((x) => [x.dataset.lv, x])),
    cubuk: Object.fromEntries(qa('[data-cubuk]').map((x) => [x.dataset.cubuk, x.firstElementChild])),
    kBaslik: q('.mg-kyazi b'), kMetin: q('.mg-kyazi span'), kOdul: q('.mg-kodul'), kElmas: q('.mg-kelmas'),
    kCubuk: q('.mg-kcubuk i'), kCubukYazi: q('.mg-kcubuk span'), detay: q('.mg-detay'),
    prestij: q('.mg-prestij'), prestijKilit: q('.mg-prestij-kilit'),
  }

  function kare2(d) {
    const b = bolgeAl(d)
    for (const btn of el.kaynaklar) {
      const kod = btn.dataset.kod
      const bb = A.BOLGE[kod]
      const acik = !!d.bolgeler[kod] || d.oyuncu.lv >= bb.acilisLv
      sinif(btn, 'aktif', d.aktifBolge === kod)
      sinif(btn, 'kilitli', !acik)
      sinif(btn, 'yeni', !d.bolgeler[kod] && acik)
      yaz(btn.querySelector('.mg-kilit b'), 'Sv.' + bb.acilisLv)
    }
    let tanisilan = 0
    for (const o of A.ORTAKLAR) {
      const L = d.ortak[o.kod] || 0
      if (L > 0) tanisilan++
      sinif(el.ortaklar[o.kod], 'kilitli', L < 1)
      yaz(el.ortaklar[o.kod].querySelector('.mg-lv'), L > 0 ? 'Lv.' + L : '')
      yaz(el.etkiler[o.kod], ortakEtkiYazi(o, L))
      sinif(el.ortaklar[o.kod], 'alinir', L > 0 && L < A.ORTAK_MAKS && d.oyuncu.elmas >= A.ORTAK_MALIYET[L])
    }
    yaz(el.sayi, tanisilan + '/' + A.ORTAKLAR.length)
    // lojistik
    const lv = { depo: b.depo.L, asansor: b.asansor.L, liman: b.liman || 0, ambar: b.ambar || 0 }
    for (const l of LOJ) {
      yaz(el.lv[l.tur], 'Lv.' + lv[l.tur])
      const oran = l.tur === 'liman' ? lv.liman / A.LIMAN.maks : l.tur === 'ambar' ? lv.ambar / A.AMBAR.maks : E.kademeIlerleme(lv[l.tur], A.KADEME_ISTASYON)
      cubuk(el.cubuk[l.tur], oran)
    }
    // kontrat
    const k = kontratDurumu(d, b)
    yaz(el.kBaslik, k.cevher + ' Kontratı')
    yaz(el.kMetin, `${bicim(k.hedef)} ton ${k.cevher.toLocaleLowerCase('tr')} sevkiyatı`)
    const po = '+' + bicim(k.odul.para)
    yaz(el.kOdul, po)
    el.kOdul.style.fontSize = Math.min(2.45, 2.45 * 6 / Math.max(6, po.length)).toFixed(2) + 'cqw'
    yaz(el.kElmas, '+' + k.odul.elmas)
    cubuk(el.kCubuk, k.hedef > 0 ? k.ilerleme / k.hedef : 0)
    yaz(el.kCubukYazi, bicim(k.ilerleme) + ' / ' + bicim(k.hedef))
    sinif(el.detay, 'hazir', k.hazir)
    // prestij
    yaz(el.prestij, 'Mevcut Seviye: ' + (d.prestij.sv + 1))
    gizle(el.prestijKilit, prestijUygun(d))
  }

  B.eylemler['mg-kaynak'] = (btn) => {
    const kod = btn.dataset.kod
    const d = B.durumAl()
    const bb = A.BOLGE[kod]
    if (kod === d.aktifBolge) { B.bildir('bilgi', `Şu an ${bb.ad} bölgesinde ${bb.cevher.toLocaleLowerCase('tr')} çıkarıyorsun.`); return }
    if (!d.bolgeler[kod] && d.oyuncu.lv < bb.acilisLv) {
      B.bildir('bilgi', `${bb.cevher}: ${bb.ad} bölgesi Seviye ${bb.acilisLv}'te açılır.`)
      canlandir(btn, SALLA, 240)
      return
    }
    B.bolgeyeGit(kod)
  }
  B.eylemler['mg-ortak'] = (btn) => B.pencere.ac('ortak', { kod: btn.dataset.kod })
  B.eylemler['mg-tumu'] = () => B.pencere.ac('ustalar', {})
  B.eylemler['mg-loj'] = (btn) => {
    const tur = btn.dataset.tur
    if (tur === 'depo' || tur === 'asansor') { B.sayfa.kapat(); B.istasyonaKaydir(tur); B.pencere.ac('yukseltme', { istasyon: tur }) }
    else B.pencere.ac('lojistik', { tur })
  }
  B.eylemler['mg-kontrat'] = (btn) => {
    const d = B.durumAl()
    if (bolgeAl(d).kontrat.hazir) kontratAl(B, btn)
    else B.pencere.ac('kontratlar', {})
  }
  B.eylemler['mg-prestij'] = () => B.pencere.ac('prestij', {})

  return { kare2 }
}

// ════════ Alt pencereler ════════
export function hazirla(B) {
  const P = B.pencere

  // Ortak ayrıntısı ve seviye yükseltme
  const ACIKLAMA = {
    uretim: 'Bütün bölgelerde madencilerin ürettiği cevheri artırır.',
    tasima: 'Asansör kabinine ve vagonlara daha çok yük sığar.',
    gelir: 'Bütün satışlardan daha çok para kazanırsın.',
    maliyet: 'Kat, asansör ve depo yükseltmeleri ucuzlar.',
  }
  P.kaydet('ortak', (g, veri) => {
    const o = A.ORTAKLAR.find((x) => x.kod === veri.kod)
    const kisi = KISILER[o.kod]
    g.innerHTML = `<div class="ot-ust"><img class="ot-yuz" src="${kisi.resim}" alt=""><div><h2>${kisi.ad}</h2><small>${kisi.unvan}</small><span class="ot-etiket ot-${o.kod}">${o.etiket}</span></div></div>
      <div class="ot-satirlar"><div class="ot-satir"><span>Seviye</span><b class="sayi ot-lv"></b></div>
      <div class="ot-satir"><span>Etki</span><b class="ot-etki"></b></div>
      <div class="ot-satir"><span>Sonraki seviye</span><b class="ot-sonraki"></b></div></div>
      <p class="sayfa-not ot-not"></p>
      <button class="btn btn-mavi ot-al" data-eylem="ortak-yukselt" data-kod="${o.kod}">${ikon('elmas')}<span class="sayi"></span></button>`
    const e = { lv: g.querySelector('.ot-lv'), etki: g.querySelector('.ot-etki'), sonraki: g.querySelector('.ot-sonraki'), not: g.querySelector('.ot-not'), al: g.querySelector('.ot-al'), alYazi: g.querySelector('.ot-al span') }
    return (d) => {
      const L = d.ortak[o.kod] || 0
      yaz(e.lv, L ? L + ' / ' + A.ORTAK_MAKS : 'Henüz tanışmadın')
      yaz(e.etki, L ? ortakEtkiYazi(o, L) : '—')
      yaz(e.sonraki, L && L < A.ORTAK_MAKS ? ortakEtkiYazi(o, L + 1) : L ? 'MAKS' : '—')
      yaz(e.not, L ? ACIKLAMA[o.etki] : `${kisi.ad} ile hikâyede tanışınca ekibine katılır.`)
      const maliyet = A.ORTAK_MALIYET[L] || 0
      gizle(e.al, !L || L >= A.ORTAK_MAKS)
      yaz(e.alYazi, `Seviye ${L + 1} · ${maliyet}`)
      e.al.disabled = d.oyuncu.elmas < maliyet
    }
  })
  B.eylemler['ortak-yukselt'] = (btn) => {
    const s = B.eylem('ortakYukselt', { kod: btn.dataset.kod })
    if (s && s.ok) B.bildir('basari', `${KISILER[btn.dataset.kod].ad} Seviye ${s.L}!`)
    else if (s && s.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
  }

  // Ustabaşılar: istasyon yöneticileri (portreli ızgara), kiralama
  let tip = 'maden'
  const yerAdi = (ist) => (!ist ? 'Boşta' : ist === 'asansor' ? 'Asansör' : ist === 'depo' ? '1. Kat · Depo' : (+ist.slice(1) + 2) + '. Kat')
  P.kaydet('ustalar', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('yonetici')}<div><h2>Ustabaşılar</h2><small>İstasyonu otomatik çalıştırırlar; yeteneklerini madendeki rozetlerinden kullan.</small></div></div>
      <div class="bolumlu yon-sekmeler" role="group">${[['maden', 'Katlar'], ['asansor', 'Asansör'], ['depo', 'Depo']].map(([k, a]) => `<button data-eylem="yon-sekme" data-tip="${k}" aria-pressed="${k === tip}">${a}</button>`).join('')}</div>
      <div class="yon-izgara"></div>
      <div class="us-alt"><button class="btn btn-turuncu" data-eylem="sayfa-kirala" data-odeme="para">${ikon('para')}<span class="sayi maliyet"></span></button>
      <button class="btn btn-mavi" data-eylem="sayfa-kirala" data-odeme="elmas">${ikon('elmas')}<span class="sayi">Elmasla · ${A.ELMAS_KIRALAMA}</span></button></div>`
    const izgara = g.querySelector('.yon-izgara')
    const sekmeler = [...g.querySelectorAll('[data-eylem="yon-sekme"]')]
    const paraBtn = g.querySelector('[data-odeme="para"]'), paraYazi = paraBtn.querySelector('.maliyet'), elmasBtn = g.querySelector('[data-odeme="elmas"]')
    let imza = '', haller = []
    return (d) => {
      const b = bolgeAl(d)
      for (const s of sekmeler) s.setAttribute('aria-pressed', String(s.dataset.tip === tip))
      const liste = b.yoneticiler.filter((y) => y.tip === tip)
      const im = d.aktifBolge + tip + liste.map((y) => y.id + ':' + y.atanan).join(',')
      if (im !== imza) {
        imza = im
        if (!liste.length) { izgara.innerHTML = '<p class="sayfa-bos">Bu türde ustabaşın yok. Aşağıdan tut.</p>'; haller = [] }
        else {
          izgara.innerHTML = liste.map((y) => {
            const n = nadirlik(y.nadirlik)
            return `<div class="yon-kart" style="--nr:${n.renk}"><canvas data-tohum="${y.tohum}" data-nadir="${y.nadirlik}" width="128" height="128"></canvas>
              <b>${yoneticiAdi(y)}</b><span class="nadir" style="color:${n.renk}">${n.ad}</span><span class="yetenek">${yetenekEtki(y)} · ${sure(n.sure)}</span>
              <span class="atama${y.atanan ? '' : ' bosta'}">${yerAdi(y.atanan)}</span><span class="hal sayi"></span>
              <button class="btn ${y.atanan ? 'btn-krem' : 'btn-turuncu'} etiket-btn" data-eylem="sayfa-ata" data-id="${y.id}">${y.atanan ? 'Değiştir' : 'Ata'}</button></div>`
          }).join('')
          for (const c of izgara.querySelectorAll('canvas[data-tohum]')) { try { B.sahne.portre(+c.dataset.tohum, +c.dataset.nadir, c, 64) } catch {} }
          haller = [...izgara.querySelectorAll('.hal')].map((h, i) => ({ el: h, y: liste[i] }))
        }
      }
      for (const h of haller) {
        const s = yetenekHali(d, h.y)
        yaz(h.el, s.durum === 'hazir' ? 'Yetenek hazır' : s.durum === 'aktif' ? 'Aktif · ' + sayac(s.kalan) : 'Bekleme · ' + sayac(s.kalan))
        sinif(h.el, 'hazir', s.durum === 'hazir')
      }
      const dolu = b.yoneticiler.length >= A.MAKS_YONETICI
      const mal = E.kiralamaMaliyeti(d, b, tip)
      yaz(paraYazi, dolu ? `Dolu (${A.MAKS_YONETICI}/${A.MAKS_YONETICI})` : 'Tut · ' + bicim(mal))
      paraBtn.disabled = dolu || b.para < mal
      elmasBtn.disabled = dolu || d.oyuncu.elmas < A.ELMAS_KIRALAMA
    }
  })
  B.eylemler['yon-sekme'] = (b) => { tip = b.dataset.tip; P.kare4(B.durumAl()) }
  B.eylemler['sayfa-kirala'] = (b) => {
    const s = B.eylem('yoneticiTut', { tip, odeme: b.dataset.odeme })
    if (s && s.ok) B.bildir('basari', `${yoneticiAdi(s.yonetici)} katıldı! (${nadirlik(s.yonetici.nadirlik).ad})`)
    else if (s && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
    else if (s && s.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
  }
  B.eylemler['sayfa-ata'] = (b) => P.ac('istasyonSec', { id: b.dataset.id })

  // Lojistik: Liman (satış) ve Depo/Ambar (çevrimdışı süre)
  P.kaydet('lojistik', (g, veri) => {
    const liman = veri.tur === 'liman'
    const t = liman ? A.LIMAN : A.AMBAR
    g.innerHTML = `<div class="ot-ust"><img class="ot-yuz loj" src="img/ref/loj-${liman ? 'liman' : 'depo'}.png" alt=""><div><h2>${liman ? 'Liman' : 'Depo (Ambar)'}</h2>
      <small>${liman ? 'Cevheri gemilerle uzak pazarlara gönder: bu bölgenin satışları artar.' : 'Daha büyük ambar: uygulama kapalıyken ve başka bölgedeyken daha uzun kazanırsın.'}</small></div></div>
      <div class="ot-satirlar"><div class="ot-satir"><span>Seviye</span><b class="sayi lj-lv"></b></div>
      <div class="ot-satir"><span>Şu anki etki</span><b class="lj-etki"></b></div>
      <div class="ot-satir"><span>Sonraki seviye</span><b class="lj-sonraki"></b></div></div>
      <button class="btn btn-turuncu ot-al" data-eylem="lojistik-al" data-tur="${veri.tur}">${ikon('para')}<span class="sayi"></span></button>`
    const e = { lv: g.querySelector('.lj-lv'), etki: g.querySelector('.lj-etki'), sonraki: g.querySelector('.lj-sonraki'), al: g.querySelector('.ot-al'), alYazi: g.querySelector('.ot-al span') }
    const etki = (L) => (liman ? `Satış +%${Math.round(L * t.satis * 100)}` : `Çevrimdışı +${L * t.dakika} dk`)
    return (d) => {
      const b = bolgeAl(d)
      const L = b[veri.tur] || 0
      yaz(e.lv, L + ' / ' + t.maks)
      yaz(e.etki, etki(L))
      yaz(e.sonraki, L < t.maks ? etki(L + 1) : 'MAKS')
      const mal = liman ? E.limanMaliyet(d, b, L) : E.ambarMaliyet(d, b, L)
      gizle(e.al, L >= t.maks)
      yaz(e.alYazi, `Yükselt · ${bicim(mal)}`)
      e.al.disabled = b.para < mal
    }
  })
  B.eylemler['lojistik-al'] = (btn) => {
    const s = B.eylem('lojistik', { tur: btn.dataset.tur })
    if (s && s.ok) B.bildir('basari', `${btn.dataset.tur === 'liman' ? 'Liman' : 'Depo'} ${s.L}. seviye!`)
    else if (s && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
  }

  // Prestij: şartlar ve iki adımlı onay
  P.kaydet('prestij', (g) => {
    g.innerHTML = `<div class="ot-ust"><img class="ot-yuz loj" src="img/ref/prestij-panel.png" alt=""><div><h2>Prestij: Yeni Nesil</h2><small>Bütün madenleri yeniden kur, kalıcı olarak daha güçlü başla.</small></div></div>
      <div class="ot-satirlar">
        <div class="ot-satir"><span>Mevcut prestij</span><b class="sayi ps-sv"></b></div>
        <div class="ot-satir"><span>Satış çarpanı</span><b class="sayi ps-carpan"></b></div>
        <div class="ot-satir"><span>Gereken seviye</span><b class="sayi ps-lv"></b></div>
        <div class="ot-satir"><span>Bölge Ustası</span><b class="sayi ps-usta"></b></div></div>
      <p class="sayfa-not">Sıfırlanır: bölgelerin parası, katları, istasyonları, ustabaşıları, görevleri ve kontratları.<br>Kalır: oyuncu seviyesi, elmaslar, araştırmalar, ortaklar, hikâye ve açılmış bölgeler.</p>
      <button class="btn btn-turuncu ot-al ps-al" data-eylem="prestij-yap"></button>`
    const e = { sv: g.querySelector('.ps-sv'), carpan: g.querySelector('.ps-carpan'), lv: g.querySelector('.ps-lv'), usta: g.querySelector('.ps-usta'), al: g.querySelector('.ps-al') }
    return (d) => {
      let usta = 0
      for (const k of Object.keys(d.bolgeler)) if (d.bolgeler[k].usta) usta++
      const c = E.prestijCarpani(d)
      yaz(e.sv, String(d.prestij.sv))
      yaz(e.carpan, '×' + c.toLocaleString('tr-TR') + ' → ×' + (c + A.PRESTIJ.satis).toLocaleString('tr-TR'))
      yaz(e.lv, `${d.oyuncu.lv} / ${A.PRESTIJ.lv}`)
      yaz(e.usta, `${usta} / ${A.PRESTIJ.usta}`)
      const uygun = prestijUygun(d)
      e.al.disabled = !uygun
      yaz(e.al, !uygun ? 'Şartlar henüz tamam değil' : e.al.dataset.onay ? 'Emin misin? Dokun ve başla' : `Prestij Yap · +${A.PRESTIJ.elmas * (d.prestij.sv + 1)} elmas`)
    }
  })
  B.eylemler['prestij-yap'] = (btn) => {
    if (!btn.dataset.onay) { btn.dataset.onay = '1'; P.kare4(B.durumAl()); return }
    const s = B.eylem('prestij', {})
    if (s && s.ok) { P.kapatSayfa(); B.sayfa.kapat(); B.kaydirKonumu(1e9, { anim: false }) }
  }
}
