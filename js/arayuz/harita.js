// ════════════════════════════════════════════════════════════════
//  HARİTA (görsel yön 2, referans2 2. ekran) — Zonguldak bölge haritası,
//  Aktif Görevler (görev + kontrat) ve alt kısayollar.
//  • Zemin görselleri referanstan birebir kesildi (img/ref/harita*.png,
//    gorev-panel.png). Değişen yazılar boyalı yazının üstüne aynı renkte
//    bir yamayla basılır; dokunma alanları şeffaf düğmelerdir.
//  • Konumlar kesimin kendi pikselleriyle (367 px genişlik) verilir ve
//    yüzdeye çevrilir; yazı boyları cqw ile genişliğe göre ölçeklenir.
//  • Alt pencereler: bolgeler, misyonlar, kontratlar, etkinlik.
// ════════════════════════════════════════════════════════════════
import { ikon, cevherIkonu } from './ikonlar.js'
import { A, yaz, sinif, gizle, cubuk, bicim, bolgeAl, canlandir } from './ortak.js'
import { gorevDurumu, gorevKosulu, kontratDurumu, misyonIlerleme } from '../benzetim.js'
import { BOLUMLER, SAHNELER, gorevYazi } from '../hikaye.js'

const RW = 367                      // kesim genişliği (referans px)
const yuzde = (v, t) => (v / t * 100).toFixed(3) + '%'
// Kesim içi kutu → mutlak konum stili
const kutu = (x, y, w, h, H) => `left:${yuzde(x, RW)};top:${yuzde(y, H)};width:${yuzde(w, RW)};height:${yuzde(h, H)}`
// Referans px yazı boyu → cqw
export const cq = (px) => (px / RW * 100).toFixed(3) + 'cqw'

const HH = 446, GH = 194, AH = 80   // harita, görev paneli, alt kısayollar
// Bölge kartları (harita kesimi içinde): dokunma kutusu, büyük kilit, küçük kilit, yüzde yaması, alt başlık yaması
const BOLGE_KART = {
  zonguldak: { kutu: [52, 100, 130, 85], yuzde: [113, 153.5, 25, 13, '#0F5038', '#5FD07A'] },
  eregli: { kutu: [228, 125, 125, 98], kilit: [250.5, 184, 20], kucuk: [303.5, 155, 15.5], yuzde: [285, 190, 34, 15, '#0A2740', '#E9D9A0'] },
  karabuk: { kutu: [55, 243, 131, 85], kilit: [80.5, 284.5, 21], kucuk: [143, 258.5, 15.5], yuzde: [117.5, 292, 34, 14, '#0A2236', '#E9D9A0'], alt: [104, 307, 64, 14, '#06203A'] },
  kastamonu: { kutu: [193, 348, 160, 78], kilit: [216, 383.5, 20], kucuk: [291.5, 362, 15], yuzde: [262.5, 392, 36, 14, '#05223A', '#E9D9A0'], alt: [246, 408, 96, 14, '#04223A'] },
}

// Yerel takvim günü (YYYY-AA-GG)
export function gunKodu(ms = Date.now()) {
  const t = new Date(ms)
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0')
}
// Bu haftanın etkinliği: pazartesi 00:00'da başlar, hafta numarasına göre döner
export function haftaEtkinligi(ms = Date.now()) {
  const t = new Date(ms)
  const pzt = new Date(t.getFullYear(), t.getMonth(), t.getDate() - ((t.getDay() + 6) % 7))
  const bitis = new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate() + 7).getTime()
  const hafta = Math.floor((pzt.getTime() + 4 * 86400000) / (7 * 86400000))
  const e = A.ETKINLIKLER[((hafta % A.ETKINLIKLER.length) + A.ETKINLIKLER.length) % A.ETKINLIKLER.length]
  return { kod: e.kod, bitis }
}
// Kalan süre: "2g 14sa" / "5sa 20dk" / "12dk"
export function kalanKisa(sn) {
  sn = Math.max(0, Math.floor(sn))
  const g = Math.floor(sn / 86400), s = Math.floor(sn % 86400 / 3600), d = Math.floor(sn % 3600 / 60)
  if (g) return g + 'g ' + s + 'sa'
  if (s) return s + 'sa ' + d + 'dk'
  return Math.max(1, d) + 'dk'
}

// Görevin "Git" düğmesi: ilgili yere götürür
export function goreveGit(B, g) {
  const d = B.durumAl(), b = bolgeAl(d)
  const t = A.GOREVLER[g.sira]
  const kapat = () => B.sayfa.kapat()
  if (!t) return
  if (t.tur === 'seviye') { kapat(); B.istasyonaKaydir('m' + t.i); B.pencere.ac('yukseltme', { istasyon: 'm' + t.i }) }
  else if (t.tur === 'L') { kapat(); B.istasyonaKaydir(t.ist); B.pencere.ac('yukseltme', { istasyon: t.ist }) }
  else if (t.tur === 'yon') { kapat(); B.istasyonaKaydir(t.ist); B.pencere.ac('yonetici', { istasyon: t.ist }) }
  else if (t.tur === 'yonetici') {
    kapat()
    const bos = b.madenler.findIndex((m, i) => !b.yoneticiler.some((y) => y.atanan === 'm' + i))
    const ist = bos >= 0 ? 'm' + bos : !b.yoneticiler.some((y) => y.atanan === 'asansor') ? 'asansor' : 'depo'
    B.istasyonaKaydir(ist)
    B.pencere.ac('yonetici', { istasyon: ist })
  } else if (t.tur === 'ac') { kapat(); B.istasyonaKaydir('m' + Math.min(b.madenler.length, A.MADEN_SAYISI - 1)) }
  else if (t.tur === 'yetenek') { kapat(); B.bildir('bilgi', 'Bir yönetici rozetine dokunup yeteneğini kullan.') }
  else if (t.tur === 'kontrat') B.pencere.ac('kontratlar', {})
  else if (t.tur === 'liman') B.sayfa.ac('yoneticiler')
}

// Görev ödülünü al (harita ve bildirimden ortak)
export function gorevAl(B, kaynakEl) {
  const s = B.eylem('gorevAl', {})
  if (!s || !s.ok) return false
  if (kaynakEl) {
    const r = kaynakEl.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
    B.ucanSikke(r.left - k.left + r.width / 2, r.top - k.top + r.height / 2, 12)
  }
  const parca = [s.elmas ? '+' + s.elmas + ' elmas' : '', s.para ? '+' + bicim(s.para) : '', '+' + s.xp + ' XP'].filter(Boolean)
  B.bildir('basari', 'Görev tamamlandı! ' + parca.join(' · '))
  return true
}

export function kontratAl(B, kaynakEl) {
  const s = B.eylem('kontratAl', {})
  if (!s || !s.ok) return false
  if (kaynakEl) {
    const r = kaynakEl.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
    B.ucanSikke(r.left - k.left + r.width / 2, r.top - k.top + r.height / 2, 14)
  }
  B.bildir('basari', `Kontrat teslim edildi! +${bicim(s.para)} · +${s.elmas} elmas`)
  return true
}

export function kur(B, govde) {
  const d0 = B.durumAl()
  const bolgeler = A.BOLGELER
  govde.innerHTML = `
    <div class="hr">
      <div class="hr-katman hr-harita" style="aspect-ratio:${RW}/${HH}">
        <img src="img/ref/harita.png" alt="Zonguldak bölge haritası" draggable="false">
        <span class="hr-yama hr-ilerleme sayi" style="${kutu(288, 31.5, 30, 15.5, HH)}"></span>
        ${bolgeler.map((bb) => {
          const k = BOLGE_KART[bb.kod]
          if (!k) return ''
          const y = k.yuzde
          return `${k.kilit ? `<i class="hr-rozet" data-rozet="${bb.kod}" style="${kutu(k.kilit[0] - k.kilit[2], k.kilit[1] - k.kilit[2], k.kilit[2] * 2, k.kilit[2] * 2, HH)}" hidden>${cevherIkonu(bb.kod)}</i>
              <i class="hr-tik" data-tik="${bb.kod}" style="${kutu(k.kucuk[0] - k.kucuk[2], k.kucuk[1] - k.kucuk[2], k.kucuk[2] * 2, k.kucuk[2] * 2, HH)}" hidden>${ikon('tik')}</i>` : ''}
            <span class="hr-yama hr-yuzde sayi" data-yuzde="${bb.kod}" style="${kutu(y[0], y[1], y[2], y[3], HH)};--yb:${y[4]};--yr:${y[5]}"></span>
            ${k.alt ? `<span class="hr-yama hr-altbaslik" style="${kutu(k.alt[0], k.alt[1], k.alt[2], k.alt[3], HH)};--yb:${k.alt[4]}">${bb.alt}</span>` : ''}
            <button class="hr-sicak hr-bolge" data-eylem="harita-bolge" data-kod="${bb.kod}" style="${kutu(...k.kutu, HH)}" aria-label="${bb.ad}"></button>`
        }).join('')}
      </div>
      <div class="hr-katman hr-gorev" style="aspect-ratio:${RW}/${GH}">
        <img src="img/ref/gorev-panel.png" alt="" draggable="false">
        <button class="hr-sicak" data-eylem="harita-gorevler" style="${kutu(10, 28, 173, 27, GH)}" aria-label="Görevler"></button>
        <button class="hr-sicak" data-eylem="harita-kontratlar" style="${kutu(190, 28, 172, 27, GH)}" aria-label="Kontratlar"></button>
        <div class="hr-yama hr-krem hr-gyazi" style="${kutu(57, 64, 133, 50, GH)}"><b></b><span></span></div>
        <div class="hr-yama hr-krem hr-godul" style="${kutu(9, 117, 181, 26, GH)}"></div>
        <div class="hr-cubuk" style="${kutu(14.5, 149.5, 105, 16, GH)}"><i></i><span class="sayi"></span></div>
        <button class="hr-git" data-eylem="harita-gorev" style="${kutu(127.5, 143.5, 56.5, 31, GH)}">Git</button>
        <div class="hr-yama hr-krem hr-kyazi" style="${kutu(244, 64, 112, 46, GH)}"><b></b><span></span></div>
        <div class="hr-yama hr-krem hr-kodul" style="${kutu(205, 112, 156, 26, GH)}"></div>
        <div class="hr-cubuk hr-kcubuk" style="${kutu(205.5, 139.5, 147.5, 15.5, GH)}"><i></i><span class="sayi"></span></div>
        <button class="hr-sicak hr-detay" data-eylem="harita-kontrat" style="${kutu(204, 156, 150, 24, GH)}" aria-label="Kontrat ayrıntıları"><span>Detaylar</span></button>
      </div>
      <div class="hr-katman hr-alt" style="aspect-ratio:${RW}/${AH}">
        <img src="img/ref/harita-alt.png" alt="" draggable="false">
        <button class="hr-sicak" data-eylem="harita-kisayol" data-k="bolgeler" style="${kutu(3, 2, 87, 76, AH)}" aria-label="Bölge Haritası"></button>
        <button class="hr-sicak" data-eylem="harita-kisayol" data-k="misyonlar" style="${kutu(95, 2, 90, 76, AH)}" aria-label="Misyonlar"></button>
        <button class="hr-sicak" data-eylem="harita-kisayol" data-k="kontratlar" style="${kutu(192, 2, 85, 76, AH)}" aria-label="Kontratlar"></button>
        <button class="hr-sicak" data-eylem="harita-kisayol" data-k="etkinlik" style="${kutu(283, 2, 80, 76, AH)}" aria-label="Etkinlikler"></button>
        <i class="hr-rozet-sayi sayi" style="${kutu(241.5, 1.5, 21, 20, AH)}"></i>
        <i class="hr-nokta" data-nokta="misyonlar" style="${kutu(170, 4, 10, 10, AH)}" hidden></i>
        <span class="hr-yama hr-etk sayi" style="${kutu(297, 37, 58, 19, AH)}"></span>
      </div>
      <button class="hr-defter" data-eylem="defter">${ikon('kitap')}<span><b>Hikâye Defteri</b><small></small></span>${ikon('ileri')}</button>
    </div>`

  const q = (s) => govde.querySelector(s)
  const el = {
    ilerleme: q('.hr-ilerleme'),
    yuzdeler: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-yuzde="${bb.kod}"]`)])),
    rozetler: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-rozet="${bb.kod}"]`)])),
    tikler: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-tik="${bb.kod}"]`)])),
    bolgeBtn: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-kod="${bb.kod}"]`)])),
    gBaslik: q('.hr-gyazi b'), gMetin: q('.hr-gyazi span'), gOdul: q('.hr-godul'),
    gCubuk: q('.hr-gorev .hr-cubuk:not(.hr-kcubuk) i'), gCubukYazi: q('.hr-gorev .hr-cubuk:not(.hr-kcubuk) span'),
    git: q('.hr-git'),
    kBaslik: q('.hr-kyazi b'), kMetin: q('.hr-kyazi span'), kOdul: q('.hr-kodul'),
    kCubuk: q('.hr-kcubuk i'), kCubukYazi: q('.hr-kcubuk span'), detay: q('.hr-detay'),
    rozetSayi: q('.hr-rozet-sayi'), misyonNokta: q('[data-nokta="misyonlar"]'), etk: q('.hr-etk'),
    defter: q('.hr-defter small'),
  }
  let sonOdul = '', sonKOdul = ''

  const odulHtml = (o) => `${o.para > 0 ? `<img src="img/ref/gorev-sikke.png" alt=""><b class="sayi">+${bicim(o.para)}</b>` : ''}` +
    `${o.elmas > 0 ? `<img src="img/ref/gorev-elmas.png" alt=""><b class="sayi">+${o.elmas}</b>` : ''}${o.xp ? `<em class="sayi">+${o.xp} XP</em>` : ''}`

  function kare2(d) {
    const b = bolgeAl(d)
    // bölge ilerlemesi: açılan bölge / toplam
    yaz(el.ilerleme, Object.keys(d.bolgeler).length + '/' + bolgeler.length)
    for (const bb of bolgeler) {
      const kb = d.bolgeler[bb.kod]
      const acilabilir = !kb && d.oyuncu.lv >= bb.acilisLv
      const acik = !!kb || acilabilir
      const y = el.yuzdeler[bb.kod]
      if (kb) yaz(y, '%' + Math.round(Math.min(1, kb.gorev.sira / A.GOREVLER.length) * 100))
      else yaz(y, acilabilir ? 'Açık!' : 'Sv.' + bb.acilisLv)
      sinif(y, 'yeni', acilabilir)
      if (el.rozetler[bb.kod]) { gizle(el.rozetler[bb.kod], !acik); gizle(el.tikler[bb.kod], !(kb && kb.usta)) }
      sinif(el.bolgeBtn[bb.kod], 'aktif', d.aktifBolge === bb.kod)
      sinif(el.bolgeBtn[bb.kod], 'acilabilir', acilabilir)
    }
    // görev
    const g = gorevDurumu(d, b)
    if (g) {
      yaz(el.gBaslik, g.baslik)
      yaz(el.gMetin, g.metin)
      const im = JSON.stringify(g.odul)
      if (im !== sonOdul) { sonOdul = im; el.gOdul.innerHTML = odulHtml(g.odul) }
      cubuk(el.gCubuk, g.simdi / g.hedef)
      yaz(el.gCubukYazi, (g.hedef >= 1000 ? bicim(g.simdi) + '/' + bicim(g.hedef) : g.simdi + '/' + g.hedef))
      const hazir = g.hazir || g.simdi >= g.hedef
      yaz(el.git, hazir ? 'Al' : 'Git')
      sinif(el.git, 'hazir', hazir)
      el.git.disabled = false
    } else {
      yaz(el.gBaslik, bolgeler.find((x) => x.kod === d.aktifBolge).ad + ' tamamlandı!')
      yaz(el.gMetin, 'Bölge Ustası unvanı senin. Yeni bölgelere göz at.')
      if (sonOdul !== '-') { sonOdul = '-'; el.gOdul.innerHTML = '<em>Bütün görevler bitti</em>' }
      cubuk(el.gCubuk, 1)
      yaz(el.gCubukYazi, A.GOREVLER.length + '/' + A.GOREVLER.length)
      yaz(el.git, '✓')
      sinif(el.git, 'hazir', false)
      el.git.disabled = true
    }
    // kontrat
    const k = kontratDurumu(d, b)
    yaz(el.kBaslik, k.cevher + ' Kontratı')
    yaz(el.kMetin, `${k.musteri} · ${bicim(k.hedef)} ton`)
    const ki = JSON.stringify([k.odul.para, k.odul.elmas])
    if (ki !== sonKOdul) { sonKOdul = ki; el.kOdul.innerHTML = odulHtml({ para: k.odul.para, elmas: k.odul.elmas }) }
    cubuk(el.kCubuk, k.hedef > 0 ? k.ilerleme / k.hedef : 0)
    yaz(el.kCubukYazi, bicim(k.ilerleme) + ' / ' + bicim(k.hedef))
    sinif(el.detay, 'hazir', k.hazir)
    yaz(el.detay.firstChild, k.hazir ? 'Teslim Al' : 'Detaylar')
    // kısayol rozetleri
    let hazirK = 0
    for (const kod of Object.keys(d.bolgeler)) if (d.bolgeler[kod].kontrat.hazir) hazirK++
    yaz(el.rozetSayi, String(hazirK || Object.keys(d.bolgeler).length))
    sinif(el.rozetSayi, 'hazir', hazirK > 0)
    const mHazir = d.misyon.liste.some((m) => !m.alindi && misyonIlerleme(d, m).simdi >= m.n)
    gizle(el.misyonNokta, !mHazir)
    yaz(el.etk, d.etkinlik.bitis ? kalanKisa((d.etkinlik.bitis - Date.now()) / 1000) : '—')
    // defter
    const bolum = BOLUMLER.slice().reverse().find((x) => d.bolgeler[x.bolge]) || BOLUMLER[0]
    yaz(el.defter, `Bölüm ${bolum.no}: ${bolum.ad} · ${d.hikaye.goruldu.length}/${Object.keys(SAHNELER).length} sahne`)
  }

  B.eylemler['harita-bolge'] = (btn) => {
    const kod = btn.dataset.kod
    const d = B.durumAl()
    const bb = A.BOLGE[kod]
    if (kod === d.aktifBolge) { B.sayfa.kapat(); return }
    if (!d.bolgeler[kod] && d.oyuncu.lv < bb.acilisLv) {
      B.bildir('bilgi', `${bb.ad} bölgesi Seviye ${bb.acilisLv}'te açılır. (Şu an Seviye ${d.oyuncu.lv})`)
      canlandir(btn, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 240)
      return
    }
    B.bolgeyeGit(kod)
  }
  B.eylemler['harita-gorev'] = (btn) => {
    const d = B.durumAl()
    const g = gorevDurumu(d, bolgeAl(d))
    if (!g) return
    if (g.hazir || g.simdi >= g.hedef) gorevAl(B, btn)
    else goreveGit(B, g)
  }
  B.eylemler['harita-gorevler'] = () => B.pencere.ac('gorevler', {})
  B.eylemler['harita-kontratlar'] = () => B.pencere.ac('kontratlar', {})
  B.eylemler['harita-kontrat'] = (btn) => {
    const d = B.durumAl()
    if (bolgeAl(d).kontrat.hazir) kontratAl(B, btn)
    else B.pencere.ac('kontratlar', {})
  }
  B.eylemler['harita-kisayol'] = (btn) => B.pencere.ac(btn.dataset.k, {})

  return { kare2 }
}

// ════════ Alt pencereler (bir kez kaydedilir) ════════
export function hazirla(B) {
  const P = B.pencere

  // Bölgeler: dört bölge, durumları ve geçiş
  P.kaydet('bolgeler', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('harita')}<div><h2>Bölgeler</h2><small>Her bölgenin kendi madeni, kasası ve hikâyesi var</small></div></div><div class="bl-liste"></div>`
    const liste = g.querySelector('.bl-liste')
    let imza = ''
    return (d) => {
      const im = A.BOLGELER.map((bb) => { const kb = d.bolgeler[bb.kod]; return bb.kod + (kb ? kb.gorev.sira + (kb.usta ? 'u' : '') : '') + (d.aktifBolge === bb.kod) + (d.oyuncu.lv >= bb.acilisLv) }).join('|')
      if (im === imza) return
      imza = im
      liste.innerHTML = A.BOLGELER.map((bb) => {
        const kb = d.bolgeler[bb.kod]
        const acilabilir = !kb && d.oyuncu.lv >= bb.acilisLv
        const kilitli = !kb && !acilabilir
        const aktif = d.aktifBolge === bb.kod
        const bolum = BOLUMLER.find((x) => x.bolge === bb.kod)
        const ilerleme = kb ? kb.gorev.sira / A.GOREVLER.length : 0
        return `<div class="bl-kart${aktif ? ' aktif' : ''}${kilitli ? ' kilitli' : ''}" style="--br:${bb.vurgu}">
          <i class="bl-ikon">${cevherIkonu(bb.kod)}</i>
          <div class="bl-bilgi"><b>${bb.ad}${kb && kb.usta ? ' <em>Usta</em>' : ''}</b><small>${bb.cevher} · ${bb.alt}</small>
            <small class="bl-bolum">Bölüm ${bolum.no}: ${bolum.ad}</small>
            <i class="cubuk-ince"><i style="transform:scaleX(${ilerleme})"></i></i></div>
          ${aktif ? '<span class="bl-durum">Buradasın</span>'
            : kilitli ? `<span class="bl-durum kilit">${ikon('kilit')}Sv.${bb.acilisLv}</span>`
            : `<button class="btn ${acilabilir ? 'btn-yesil' : 'btn-turuncu'}" data-eylem="bolge-git" data-kod="${bb.kod}">${acilabilir ? 'Aç' : 'Git'}</button>`}
        </div>`
      }).join('') + `<p class="sayfa-not">Ayrıldığın bölgelerde yöneticili katlar çalışmaya devam eder; döndüğünde kazancı kasaya eklenir (Ambar ile süre uzar).</p>`
    }
  })
  B.eylemler['bolge-git'] = (btn) => { P.kapatSayfa(); B.bolgeyeGit(btn.dataset.kod) }

  // Görev listesi: bölgenin 15 görevi
  P.kaydet('gorevler', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('madalya')}<div><h2>Bölge Görevleri</h2><small></small></div></div><div class="gl-liste"></div>`
    const alt = g.querySelector('.sayfa-baslik2 small')
    const liste = g.querySelector('.gl-liste')
    let imza = ''
    return (d) => {
      const b = bolgeAl(d)
      const bb = A.BOLGE[d.aktifBolge]
      const gd = gorevDurumu(d, b)
      yaz(alt, `${bb.ad} · ${b.gorev.sira}/${A.GOREVLER.length} tamamlandı`)
      const im = d.aktifBolge + b.gorev.sira + (gd ? gd.simdi + '/' + gd.hazir : '')
      if (im === imza) return
      imza = im
      liste.innerHTML = A.GOREVLER.map((t, i) => {
        const durum = i < b.gorev.sira ? 'bitti' : i === b.gorev.sira ? 'simdi' : 'sonra'
        const gy = gorevYaziAl(d.aktifBolge, i)
        return `<div class="gl-satir ${durum}"><i class="gl-no sayi">${durum === 'bitti' ? ikon('tik') : i + 1}</i>
          <div><b>${durum === 'sonra' ? '???' : gy.baslik}</b><small>${durum === 'sonra' ? 'Önceki görevi tamamla' : gy.metin}</small></div>
          ${durum === 'simdi' && gd ? `<span class="gl-ilerleme sayi">${gd.hedef >= 1000 ? bicim(gd.simdi) : gd.simdi}/${gd.hedef >= 1000 ? bicim(gd.hedef) : gd.hedef}</span>` : ''}</div>`
      }).join('')
    }
  })

  // Kontratlar: her açık bölgenin aktif kontratı
  P.kaydet('kontratlar', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2"><img src="img/ref/kontrat-ikon.png" alt=""><div><h2>Kontratlar</h2><small>Siparişi teslim et, ödülü al. Her kontrat bir öncekinden büyük.</small></div></div><div class="kt-liste"></div>`
    const liste = g.querySelector('.kt-liste')
    return (d) => {
      liste.innerHTML = Object.keys(d.bolgeler).map((kod) => {
        const kb = d.bolgeler[kod]
        const k = kontratDurumu(d, kb)
        const bb = A.BOLGE[kod]
        const oran = k.hedef > 0 ? k.ilerleme / k.hedef : 0
        return `<div class="kt-kart${k.hazir ? ' hazir' : ''}">
          <div class="kt-ust"><i class="bl-ikon">${cevherIkonu(kod)}</i><div><b>${k.cevher} Kontratı #${k.no + 1}</b><small>${bb.ad} · ${k.musteri}</small></div></div>
          <p>${bicim(k.hedef)} ton ${k.cevher.toLocaleLowerCase('tr')} sevk et.${kod !== d.aktifBolge ? ' (Yalnız o bölgedeyken yapılan satışlar sayılır.)' : ''}</p>
          <div class="kt-cubuk"><i style="transform:scaleX(${oran})"></i><span class="sayi">${bicim(k.ilerleme)} / ${bicim(k.hedef)}</span></div>
          <div class="kt-alt"><span class="kt-odul">${ikon('para')}<b class="sayi">+${bicim(k.odul.para)}</b>${ikon('elmas')}<b class="sayi">+${k.odul.elmas}</b><em class="sayi">+${k.odul.xp} XP</em></span>
          ${k.hazir ? (kod === d.aktifBolge ? '<button class="btn btn-yesil" data-eylem="kontrat-teslim">Teslim Al</button>' : `<button class="btn btn-turuncu" data-eylem="bolge-git" data-kod="${kod}">Git</button>`) : ''}</div>
        </div>`
      }).join('') + (A.ETKINLIKLER.find((e) => e.kod === d.etkinlik.kod)?.kontrat ? '<p class="sayfa-not">Kontrat Fuarı: bu hafta kontrat ödülleri ×2!</p>' : '')
    }
  })
  B.eylemler['kontrat-teslim'] = (btn) => kontratAl(B, btn)

  // Misyonlar: günlük üç misyon
  P.kaydet('misyonlar', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('saat')}<div><h2>Günlük Misyonlar</h2><small class="ms-sure"></small></div></div><div class="ms-liste"></div><button class="btn btn-mavi ms-bonus" data-eylem="misyon-bonus"></button>`
    const sure = g.querySelector('.ms-sure'), liste = g.querySelector('.ms-liste'), bonus = g.querySelector('.ms-bonus')
    return (d) => {
      const yarin = new Date(); yarin.setHours(24, 0, 0, 0)
      yaz(sure, 'Yeni misyonlara ' + kalanKisa((yarin.getTime() - Date.now()) / 1000))
      liste.innerHTML = d.misyon.liste.map((m, i) => {
        const il = misyonIlerleme(d, m)
        const hazir = !m.alindi && il.simdi >= il.hedef
        return `<div class="ms-kart${m.alindi ? ' alindi' : ''}${hazir ? ' hazir' : ''}">
          <div class="ms-bilgi"><b>${il.metin}</b><div class="kt-cubuk"><i style="transform:scaleX(${il.simdi / il.hedef})"></i><span class="sayi">${il.simdi}/${il.hedef}</span></div></div>
          ${m.alindi ? `<span class="ms-tik">${ikon('tik')}</span>`
            : `<button class="btn ${hazir ? 'btn-yesil' : 'btn-krem'}" data-eylem="misyon-al" data-i="${i}" ${hazir ? '' : 'disabled'}>${ikon('elmas')}<span class="sayi">+${A.MISYON_ODUL.elmas[m.zor]}</span></button>`}
        </div>`
      }).join('')
      const hepsi = d.misyon.liste.length === 3 && d.misyon.liste.every((m) => m.alindi)
      yaz(bonus, d.misyon.bonus ? 'Bugünün bonusu alındı ✓' : `Üçünü bitir: +${A.MISYON_ODUL.bonusElmas} elmas bonus`)
      bonus.disabled = d.misyon.bonus || !hepsi
    }
  })
  B.eylemler['misyon-al'] = (btn) => {
    const s = B.eylem('misyonAl', { i: +btn.dataset.i })
    if (s && s.ok) B.bildir('basari', `Misyon tamam! +${s.elmas} elmas · +${s.xp} XP`)
  }
  B.eylemler['misyon-bonus'] = () => {
    const s = B.eylem('misyonAl', { i: 'bonus' })
    if (s && s.ok) B.bildir('basari', `Günlük bonus! +${s.elmas} elmas`)
  }

  // Etkinlik: bu haftanın etkinliği ve sıradakiler
  P.kaydet('etkinlik', (g) => {
    g.innerHTML = `<div class="sayfa-baslik2">${ikon('yildirim')}<div><h2>Etkinlikler</h2><small>Her pazartesi yeni bir etkinlik başlar</small></div></div><div class="et-govde"></div>`
    const govdeE = g.querySelector('.et-govde')
    return (d) => {
      const i = A.ETKINLIKLER.findIndex((e) => e.kod === d.etkinlik.kod)
      const e = A.ETKINLIKLER[i]
      if (!e) { govdeE.innerHTML = '<p class="sayfa-not">Etkinlik bilgisi yükleniyor…</p>'; return }
      const sonraki = [1, 2, 3].map((n) => A.ETKINLIKLER[(i + n) % A.ETKINLIKLER.length])
      govdeE.innerHTML = `<div class="et-kart"><small>Bu hafta</small><b>${e.ad}</b><p>${e.metin}</p><span class="et-sure sayi">${ikon('saat')} ${kalanKisa((d.etkinlik.bitis - Date.now()) / 1000)} kaldı</span></div>
        <h3 class="et-baslik">Sıradaki haftalar</h3>
        ${sonraki.map((x, n) => `<div class="et-satir"><b>${x.ad}</b><small>${x.metin}</small><em>${n + 1}. hafta</em></div>`).join('')}`
    }
  })
}

// Görev yazısı (bölgeye göre başlık + koşul)
function gorevYaziAl(kod, i) {
  const y = gorevYazi(kod, i)
  return { baslik: y ? y.baslik : '', metin: gorevKosulu(A.GOREVLER[i]) }
}
