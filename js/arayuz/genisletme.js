// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  MADEN GENİŞLETME — Yöneticiler sekmesi.
//  • Bütün bölümler kodla kurulur (maden ekranıyla aynı dil): kaya dokulu
//    zemin, altın kenarlı paneller, kalas başlık plakaları ve sahnedeki
//    çizimlerden üretilen simgeler (cevher, vagon, kabin, gemi, ambar...).
//  • Kaynak kutuları bölgelerdir (Kömür → Zonguldak, Demir → Ereğli,
//    Taş → Karabük, Bakır → Kastamonu); dokununca o bölgeye geçilir.
//  • Dört yönetici kartı hikâyenin ortaklarıdır (Ahmet, Elif, Mehmet,
//    Zeynep): sahnede tanışınca katılır, elmasla seviye atlar.
//  • İstasyon yöneticileri (ustabaşılar) "Ustabaşılar" satırındadır.
//  • Alt pencereler: ortak, ustalar, lojistik, prestij.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import {
  E, A, yaz, sinif, gizle, cubuk, bicim, sayac, sure, bolgeAl, nadirlik, yetenekEtki, yoneticiAdi, yetenekHali, canlandir,
  simge, simgeleriCiz,
} from './ortak.js'
import { kontratDurumu, prestijUygun } from '../benzetim.js'
import { KISILER } from '../hikaye.js'
import { kontratAl } from './harita.js'

const SALLA = [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }]
const KAYNAKLAR = ['zonguldak', 'eregli', 'karabuk', 'kastamonu']
const LOJ = [
  { tur: 'depo', ad: 'Depo', simge: 'vagon' },
  { tur: 'asansor', ad: 'Asansör', simge: 'kabin' },
  { tur: 'liman', ad: 'Liman', simge: 'gemi' },
  { tur: 'ambar', ad: 'Ambar', simge: 'ambar' },
]

export const ortakEtkiYazi = (o, L) => o.metin.replace('{p}', Math.round((o.taban + o.artis * (Math.max(1, L) - 1)) * 100))

export function kur(B, govde) {
  const d0 = B.durumAl()
  const kod0 = d0.aktifBolge
  govde.innerHTML = `
    <div class="mg sy">
      <header class="sy-bas">${simge('kazma', kod0, 54)}<div><h2>Maden Genişletme</h2><small>Hangi kaynağa odaklanmak istiyorsun?</small></div></header>

      <section class="pano">
        <h3 class="plaka">${ikon('harita')}<span>Kaynaklar</span><small>Bölgeye geç</small></h3>
        <div class="mg-kaynaklar">
          ${KAYNAKLAR.map((kod) => {
            const bb = A.BOLGE[kod]
            return `<button class="yuva mg-kaynak" data-eylem="mg-kaynak" data-kod="${kod}" aria-label="${bb.cevher} · ${bb.ad}">
              ${simge('cevher', kod, 50)}<b>${bb.cevher}</b><small>${bb.ad}</small>
              <span class="mg-durum"><i class="mg-kilit">${ikon('kilit')}</i><span></span></span></button>`
          }).join('')}
        </div>
      </section>

      <section class="pano">
        <h3 class="plaka">${ikon('yonetici')}<span>Yöneticiler</span><small class="mg-sayi"></small></h3>
        <div class="mg-ortaklar">
          ${A.ORTAKLAR.map((o) => {
            const k = KISILER[o.kod]
            return `<button class="yuva mg-ortak ot-${o.kod}" data-eylem="mg-ortak" data-kod="${o.kod}" aria-label="${k.ad}">
              <span class="mg-yuz"><img src="${k.resim}" alt="" draggable="false"><i class="mg-yuz-kilit">${ikon('kilit')}</i></span>
              <i class="mg-lv sayi"></i>
              <b>${k.ad.split(' ')[0]}</b><small class="mg-unvan">${o.etiket}</small>
              <span class="mg-etki"></span></button>`
          }).join('')}
        </div>
        <button class="mg-usta" data-eylem="mg-tumu">
          <span class="mg-usta-yuzler"></span>
          <span class="mg-usta-yazi"><b>Ustabaşılar</b><small class="mg-usta-alt"></small></span>
          ${ikon('ileri')}
        </button>
      </section>

      <section class="pano">
        <h3 class="plaka">${ikon('gemi')}<span>Lojistik ve Altyapı</span></h3>
        <div class="mg-lojistik">
          ${LOJ.map((l) => `<button class="yuva mg-loj" data-eylem="mg-loj" data-tur="${l.tur}" aria-label="${l.ad}">
            ${simge(l.simge, kod0, 52)}<b>${l.ad}</b><span class="mg-loj-lv sayi" data-lv="${l.tur}"></span>
            <span class="cubuk-ince" data-cubuk="${l.tur}"><i></i></span></button>`).join('')}
        </div>
      </section>

      <section class="pano mg-kontrat">
        <h3 class="plaka">${ikon('kitap')}<span>Kontrat Hedefi</span><small class="mg-musteri"></small></h3>
        <div class="mg-k-ust">${simge('kontrat', kod0, 56)}<div><b class="mg-k-baslik"></b><small class="mg-k-metin"></small>
          <span class="mg-k-odul"><img src="img/ref/hud-para.png" alt=""><b class="sayi mg-k-para"></b><img src="img/ref/hud-elmas.png" alt=""><b class="sayi mg-k-elmas"></b></span></div></div>
        <div class="kt-cubuk mg-k-cubuk"><i></i><span class="sayi"></span></div>
        <button class="btn btn-mavi mg-k-btn" data-eylem="mg-kontrat"><span>Detaylar</span></button>
      </section>

      <section class="pano pano-mor mg-prestij">
        <h3 class="plaka plaka-mor">${ikon('prestij')}<span>Prestij</span><small class="mg-p-sv sayi"></small></h3>
        <div class="mg-p-ust">${simge('madalya', '', 60)}<div><b>Yeni nesil maden</b><small>Bütün madenleri yeniden kur, kalıcı satış çarpanıyla daha güçlü başla.</small>
          <span class="mg-p-sart"></span></div></div>
        <button class="btn btn-turuncu mg-p-btn" data-eylem="mg-prestij"><span>Prestij Yap</span></button>
      </section>
    </div>`
  simgeleriCiz(govde, B)

  const q = (s) => govde.querySelector(s)
  const qa = (s) => [...govde.querySelectorAll(s)]
  const el = {
    kaynaklar: qa('.mg-kaynak').map((b) => ({ b, kod: b.dataset.kod, yazi: b.querySelector('.mg-durum > span') })),
    sayi: q('.mg-sayi'),
    ortaklar: A.ORTAKLAR.map((o) => {
      const b = q(`.mg-ortak[data-kod="${o.kod}"]`)
      return { o, b, lv: b.querySelector('.mg-lv'), etki: b.querySelector('.mg-etki') }
    }),
    ustaYuzler: q('.mg-usta-yuzler'), ustaAlt: q('.mg-usta-alt'),
    lv: Object.fromEntries(qa('[data-lv]').map((x) => [x.dataset.lv, x])),
    cubuk: Object.fromEntries(qa('[data-cubuk]').map((x) => [x.dataset.cubuk, x.firstElementChild])),
    musteri: q('.mg-musteri'), kBaslik: q('.mg-k-baslik'), kMetin: q('.mg-k-metin'), kPara: q('.mg-k-para'), kElmas: q('.mg-k-elmas'),
    kCubuk: q('.mg-k-cubuk i'), kCubukYazi: q('.mg-k-cubuk span'), kBtn: q('.mg-k-btn'), kBtnYazi: q('.mg-k-btn span'),
    pSv: q('.mg-p-sv'), pSart: q('.mg-p-sart'), pBtn: q('.mg-p-btn'), pBtnYazi: q('.mg-p-btn span'),
  }
  let ustaImza = ''

  function kare2(d) {
    const b = bolgeAl(d)
    for (const k of el.kaynaklar) {
      const bb = A.BOLGE[k.kod]
      const acik = !!d.bolgeler[k.kod] || d.oyuncu.lv >= bb.acilisLv
      const yeni = !d.bolgeler[k.kod] && acik
      sinif(k.b, 'aktif', d.aktifBolge === k.kod)
      sinif(k.b, 'kilitli', !acik)
      sinif(k.b, 'yeni', yeni)
      yaz(k.yazi, d.aktifBolge === k.kod ? 'Buradasın' : !acik ? 'Sv.' + bb.acilisLv : yeni ? 'Aç!' : 'Geç')
    }
    let tanisilan = 0
    for (const r of el.ortaklar) {
      const L = d.ortak[r.o.kod] || 0
      if (L > 0) tanisilan++
      sinif(r.b, 'kilitli', L < 1)
      yaz(r.lv, L > 0 ? 'Lv.' + L : '')
      yaz(r.etki, L > 0 ? ortakEtkiYazi(r.o, L) : 'Hikâyede tanış')
      sinif(r.b, 'alinir', L > 0 && L < A.ORTAK_MAKS && d.oyuncu.elmas >= A.ORTAK_MALIYET[L])
    }
    yaz(el.sayi, tanisilan + ' / ' + A.ORTAKLAR.length)
    // ustabaşılar: ilk üç portre, kişi ve hazır yetenek sayısı
    const im = d.aktifBolge + b.yoneticiler.slice(0, 3).map((y) => y.id).join(',')
    if (im !== ustaImza) {
      ustaImza = im
      el.ustaYuzler.innerHTML = b.yoneticiler.slice(0, 3).map((y) => `<canvas style="--nr:${nadirlik(y.nadirlik).renk}" data-tohum="${y.tohum}" data-nadir="${y.nadirlik}"></canvas>`).join('') || `<i>${ikon('yonetici')}</i>`
      for (const c of el.ustaYuzler.querySelectorAll('canvas')) { try { B.sahne.portre(+c.dataset.tohum, +c.dataset.nadir, c, 34) } catch {} }
    }
    let hazir = 0
    for (const y of b.yoneticiler) if (y.atanan && yetenekHali(d, y).durum === 'hazir') hazir++
    yaz(el.ustaAlt, b.yoneticiler.length ? `${b.yoneticiler.length} kişi${hazir ? ` · ${hazir} yetenek hazır` : ''}` : 'İstasyonları otomatik çalıştıran ustalar tut')
    // lojistik
    const lv = { depo: b.depo.L, asansor: b.asansor.L, liman: b.liman || 0, ambar: b.ambar || 0 }
    for (const l of LOJ) {
      yaz(el.lv[l.tur], 'Lv.' + lv[l.tur])
      const oran = l.tur === 'liman' ? lv.liman / A.LIMAN.maks : l.tur === 'ambar' ? lv.ambar / A.AMBAR.maks : E.kademeIlerleme(lv[l.tur], A.KADEME_ISTASYON)
      cubuk(el.cubuk[l.tur], oran)
    }
    // kontrat
    const k = kontratDurumu(d, b)
    yaz(el.musteri, k.musteri || '')
    yaz(el.kBaslik, k.cevher + ' Kontratı')
    yaz(el.kMetin, `${bicim(k.hedef)} ton ${k.cevher.toLocaleLowerCase('tr')} sevkiyatı`)
    yaz(el.kPara, '+' + bicim(k.odul.para))
    yaz(el.kElmas, '+' + k.odul.elmas)
    cubuk(el.kCubuk, k.hedef > 0 ? k.ilerleme / k.hedef : 0)
    yaz(el.kCubukYazi, bicim(k.ilerleme) + ' / ' + bicim(k.hedef))
    sinif(el.kBtn, 'btn-mavi', !k.hazir)
    sinif(el.kBtn, 'btn-yesil', k.hazir)
    sinif(el.kBtn, 'nabiz', k.hazir)
    yaz(el.kBtnYazi, k.hazir ? 'Teslim Al' : 'Detaylar')
    // prestij
    const uygun = prestijUygun(d)
    yaz(el.pSv, 'Seviye ' + (d.prestij.sv + 1))
    let usta = 0
    for (const kod of Object.keys(d.bolgeler)) if (d.bolgeler[kod].usta) usta++
    yaz(el.pSart, uygun ? 'Şartlar tamam!' : `Gerekli: Seviye ${A.PRESTIJ.lv} · ${A.PRESTIJ.usta} Bölge Ustası (${usta}/${A.PRESTIJ.usta})`)
    sinif(el.pSart, 'tamam', uygun)
    sinif(el.pBtn, 'soluk', !uygun)
    sinif(el.pBtn, 'nabiz', uygun)
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
    g.innerHTML = `<div class="ot-ust">${simge(liman ? 'gemi' : 'ambar', B.durumAl().aktifBolge, 76)}<div><h2>${liman ? 'Liman' : 'Ambar'}</h2>
      <small>${liman ? 'Cevheri gemilerle uzak pazarlara gönder: bu bölgenin satışları artar.' : 'Daha büyük ambar: uygulama kapalıyken ve başka bölgedeyken daha uzun kazanırsın.'}</small></div></div>
      <div class="ot-satirlar"><div class="ot-satir"><span>Seviye</span><b class="sayi lj-lv"></b></div>
      <div class="ot-satir"><span>Şu anki etki</span><b class="lj-etki"></b></div>
      <div class="ot-satir"><span>Sonraki seviye</span><b class="lj-sonraki"></b></div></div>
      <button class="btn btn-turuncu ot-al" data-eylem="lojistik-al" data-tur="${veri.tur}">${ikon('para')}<span class="sayi"></span></button>`
    simgeleriCiz(g, B)
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
    if (s && s.ok) B.bildir('basari', `${btn.dataset.tur === 'liman' ? 'Liman' : 'Ambar'} ${s.L}. seviye!`)
    else if (s && s.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
  }

  // Prestij: şartlar ve iki adımlı onay
  P.kaydet('prestij', (g) => {
    g.innerHTML = `<div class="ot-ust">${simge('madalya', '', 76)}<div><h2>Prestij: Yeni Nesil</h2><small>Bütün madenleri yeniden kur, kalıcı olarak daha güçlü başla.</small></div></div>
      <div class="ot-satirlar">
        <div class="ot-satir"><span>Mevcut prestij</span><b class="sayi ps-sv"></b></div>
        <div class="ot-satir"><span>Satış çarpanı</span><b class="sayi ps-carpan"></b></div>
        <div class="ot-satir"><span>Gereken seviye</span><b class="sayi ps-lv"></b></div>
        <div class="ot-satir"><span>Bölge Ustası</span><b class="sayi ps-usta"></b></div></div>
      <p class="sayfa-not">Sıfırlanır: bölgelerin parası, katları, istasyonları, ustabaşıları, görevleri ve kontratları.<br>Kalır: oyuncu seviyesi, elmaslar, araştırmalar, ortaklar, hikâye ve açılmış bölgeler.</p>
      <button class="btn btn-turuncu ot-al ps-al" data-eylem="prestij-yap"></button>`
    simgeleriCiz(g, B)
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
