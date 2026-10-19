// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  HARİTA — Karadeniz maden rotası, aktif görev, kontrat ve kısayollar.
//  • Harita sahne katmanında kodla çizilir (sahne/harita.js); bölge kartları,
//    gemi, bulut ve baca dumanı bu sayfada üstüne yerleşen DOM öğeleridir.
//  • Konumlar 360×440 birimlik tasarım alanından yüzdeye çevrilir.
//  • Alt pencereler: bolgeler, gorevler, misyonlar, kontratlar, etkinlik.
// ════════════════════════════════════════════════════════════════
import { ikon, cevherIkonu } from './ikonlar.js'
import { A, yaz, sinif, gizle, cubuk, bicim, bolgeAl, canlandir, simge, simgeleriCiz, bolgeKilitYazi } from './ortak.js'
import { gorevDurumu, gorevKosulu, kontratDurumu, misyonIlerleme, bolgeAcilis } from '../benzetim.js'
import { BOLUMLER, SAHNELER, gorevYazi } from '../hikaye.js'
import { HARITA, DUGUM, DUMAN, GEMI_SERIT } from '../sahne/harita.js'

const yx = (x) => (x / HARITA.w * 100).toFixed(2) + '%'
const yy = (y) => (y / HARITA.h * 100).toFixed(2) + '%'

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
    <div class="hr sy">
      <div class="hr-harita">
        <canvas class="hr-tuval" aria-hidden="true"></canvas>
        <i class="hr-bulut" style="top:${yy(20)};--s:46s;--g:-12s"></i><i class="hr-bulut kucuk" style="top:${yy(250)};--s:62s;--g:-40s"></i>
        <span class="hr-gemi" style="top:${yy(GEMI_SERIT)}">${simge('gemi', 'zonguldak', 34)}</span>
        ${DUMAN.map(([x, y], i) => `<i class="hr-duman" style="left:${yx(x)};top:${yy(y)};--g:${-i * 0.9}s"><i></i><i></i><i></i></i>`).join('')}
        <header class="hr-bas"><h2>Maden Rotası</h2><small>Karadeniz kıyısı · dört bölge</small></header>
        <div class="hr-ilerleme-kutu">${ikon('yildiz')}<span><small>Bölge İlerlemesi</small><b class="sayi hr-ilerleme"></b></span></div>
        ${bolgeler.map((bb) => {
          const n = DUGUM[bb.kod]
          if (!n) return ''
          return `<i class="hr-hale" data-hale="${bb.kod}" style="left:${yx(n.x)};top:${yy(n.y - 8)}"></i>
            <button class="hr-bolge" data-eylem="harita-bolge" data-kod="${bb.kod}" style="left:${yx(n.kart[0])};top:${yy(n.kart[1])}" aria-label="${bb.ad}">
              ${simge('cevher', bb.kod, 30)}<span class="hr-b-yazi"><b>${bb.ad}</b><small>${bb.alt}</small></span>
              <span class="hr-b-durum sayi" data-durum="${bb.kod}"></span></button>`
        }).join('')}
      </div>

      <section class="pano hr-gorev">
        <h3 class="plaka">${ikon('madalya')}<span>Aktif Görev</span><button class="plaka-btn" data-eylem="harita-gorevler">Tümü ${ikon('ileri')}</button></h3>
        <div class="hr-g-ust">${simge('kazma', d0.aktifBolge, 50)}<div><b class="hr-g-baslik"></b><small class="hr-g-metin"></small><span class="hr-odul hr-g-odul"></span></div></div>
        <div class="hr-g-alt"><div class="kt-cubuk hr-g-cubuk"><i></i><span class="sayi"></span></div>
          <button class="btn btn-turuncu hr-git" data-eylem="harita-gorev">Git</button></div>
      </section>

      <section class="pano hr-kontrat">
        <h3 class="plaka">${ikon('kitap')}<span>Kontrat</span><button class="plaka-btn" data-eylem="harita-kontratlar">Tümü ${ikon('ileri')}</button></h3>
        <div class="hr-g-ust">${simge('kontrat', d0.aktifBolge, 50)}<div><b class="hr-k-baslik"></b><small class="hr-k-metin"></small><span class="hr-odul hr-k-odul"></span></div></div>
        <div class="hr-g-alt"><div class="kt-cubuk hr-k-cubuk"><i></i><span class="sayi"></span></div>
          <button class="btn btn-mavi hr-detay" data-eylem="harita-kontrat">Detaylar</button></div>
      </section>

      <section class="hr-kisayollar">
        <button class="yuva hr-kisa" data-eylem="harita-kisayol" data-k="bolgeler">${simge('cevher', d0.aktifBolge, 40)}<b>Bölgeler</b><i class="hr-rozet-sayi sayi"></i></button>
        <button class="yuva hr-kisa" data-eylem="harita-kisayol" data-k="misyonlar">${simge('madalya', '', 40)}<b>Misyonlar</b><i class="hr-nokta" hidden></i></button>
        <button class="yuva hr-kisa" data-eylem="harita-kisayol" data-k="kontratlar">${simge('kontrat', d0.aktifBolge, 40)}<b>Kontratlar</b><i class="hr-rozet-sayi hr-k-rozet sayi" hidden></i></button>
        <button class="yuva hr-kisa" data-eylem="harita-kisayol" data-k="etkinlik">${simge('yildirim', '', 40)}<b>Etkinlik</b><small class="hr-etk sayi"></small></button>
      </section>
      <button class="hr-defter" data-eylem="defter">${ikon('kitap')}<span><b>Hikâye Defteri</b><small></small></span>${ikon('ileri')}</button>
    </div>`
  const tuval = govde.querySelector('.hr-tuval')
  try { B.sahne.harita(tuval, tuval.clientWidth || govde.clientWidth || 390) } catch {}
  simgeleriCiz(govde, B)

  const q = (s) => govde.querySelector(s)
  const el = {
    ilerleme: q('.hr-ilerleme'),
    durum: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-durum="${bb.kod}"]`)])),
    hale: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`[data-hale="${bb.kod}"]`)])),
    bolgeBtn: Object.fromEntries(bolgeler.map((bb) => [bb.kod, q(`.hr-bolge[data-kod="${bb.kod}"]`)])),
    gBaslik: q('.hr-g-baslik'), gMetin: q('.hr-g-metin'), gOdul: q('.hr-g-odul'),
    gCubuk: q('.hr-g-cubuk i'), gCubukYazi: q('.hr-g-cubuk span'), git: q('.hr-git'),
    kBaslik: q('.hr-k-baslik'), kMetin: q('.hr-k-metin'), kOdul: q('.hr-k-odul'),
    kCubuk: q('.hr-k-cubuk i'), kCubukYazi: q('.hr-k-cubuk span'), detay: q('.hr-detay'),
    rozetSayi: q('.hr-rozet-sayi'), kRozet: q('.hr-k-rozet'), misyonNokta: q('.hr-nokta'), etk: q('.hr-etk'),
    defter: q('.hr-defter small'),
  }
  let sonOdul = '', sonKOdul = ''

  const odulHtml = (o) => `${o.para > 0 ? `<img src="img/ref/hud-para.png" alt=""><b class="sayi">+${bicim(o.para)}</b>` : ''}` +
    `${o.elmas > 0 ? `<img src="img/ref/hud-elmas.png" alt=""><b class="sayi">+${o.elmas}</b>` : ''}${o.xp ? `<em class="sayi">+${o.xp} XP</em>` : ''}`

  function kare2(d) {
    const b = bolgeAl(d)
    yaz(el.ilerleme, Object.keys(d.bolgeler).length + ' / ' + bolgeler.length)
    for (const bb of bolgeler) {
      const kb = d.bolgeler[bb.kod]
      const a = bolgeAcilis(d, bb.kod)
      const acilabilir = a.durum === 'hazir'
      const btn = el.bolgeBtn[bb.kod]
      if (!btn) continue
      const aktif = d.aktifBolge === bb.kod
      const y = el.durum[bb.kod]
      const h = kb ? (kb.usta ? `${ikon('tik')}Usta` : '%' + Math.round(Math.min(1, kb.gorev.sira / A.GOREVLER.length) * 100))
        : acilabilir ? `Aç · ${bicim(a.bedel)}` : a.durum === 'para' ? `${ikon('para')}${bicim(a.bedel)}` : `${ikon('kilit')}Sv.${bb.acilisLv}`
      if (y.__h !== h) { y.__h = h; y.innerHTML = h }
      sinif(btn, 'aktif', aktif)
      sinif(btn, 'acilabilir', acilabilir)
      sinif(btn, 'bedel', a.durum === 'para')
      sinif(btn, 'kilitli', a.durum === 'seviye' || a.durum === 'sira')
      sinif(el.hale[bb.kod], 'aktif', aktif)
      sinif(el.hale[bb.kod], 'acilabilir', acilabilir)
    }
    // görev
    const g = gorevDurumu(d, b)
    if (g) {
      yaz(el.gBaslik, g.baslik)
      yaz(el.gMetin, g.metin)
      const im = JSON.stringify(g.odul)
      if (im !== sonOdul) { sonOdul = im; el.gOdul.innerHTML = odulHtml(g.odul) }
      cubuk(el.gCubuk, g.simdi / g.hedef)
      yaz(el.gCubukYazi, (g.hedef >= 1000 ? bicim(g.simdi) + ' / ' + bicim(g.hedef) : g.simdi + ' / ' + g.hedef))
      const hazir = g.hazir || g.simdi >= g.hedef
      yaz(el.git, hazir ? 'Al' : 'Git')
      sinif(el.git, 'btn-yesil', hazir)
      sinif(el.git, 'btn-turuncu', !hazir)
      sinif(el.git, 'nabiz', hazir)
      el.git.disabled = false
    } else {
      yaz(el.gBaslik, bolgeler.find((x) => x.kod === d.aktifBolge).ad + ' tamamlandı!')
      yaz(el.gMetin, 'Bölge Ustası unvanı senin. Yeni bölgelere göz at.')
      if (sonOdul !== '-') { sonOdul = '-'; el.gOdul.innerHTML = '<em>Bütün görevler bitti</em>' }
      cubuk(el.gCubuk, 1)
      yaz(el.gCubukYazi, A.GOREVLER.length + ' / ' + A.GOREVLER.length)
      yaz(el.git, '✓')
      sinif(el.git, 'nabiz', false)
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
    sinif(el.detay, 'btn-yesil', k.hazir)
    sinif(el.detay, 'btn-mavi', !k.hazir)
    sinif(el.detay, 'nabiz', k.hazir)
    yaz(el.detay, k.hazir ? 'Teslim Al' : 'Detaylar')
    // kısayol rozetleri
    let hazirK = 0
    for (const kod of Object.keys(d.bolgeler)) if (d.bolgeler[kod].kontrat.hazir) hazirK++
    yaz(el.rozetSayi, String(Object.keys(d.bolgeler).length))
    yaz(el.kRozet, String(hazirK))
    gizle(el.kRozet, !hazirK)
    sinif(el.kRozet, 'hazir', hazirK > 0)
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
    const a = bolgeAcilis(d, kod)
    if (a.durum !== 'acik' && a.durum !== 'hazir') {
      B.bildir('bilgi', bolgeKilitYazi(d, kod))
      canlandir(btn, [{ transform: 'translate(-50%, -50%)' }, { transform: 'translate(calc(-50% - 4px), -50%)' }, { transform: 'translate(calc(-50% + 4px), -50%)' }, { transform: 'translate(-50%, -50%)' }], 240)
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
      const im = A.BOLGELER.map((bb) => { const kb = d.bolgeler[bb.kod]; return bb.kod + (kb ? kb.gorev.sira + (kb.usta ? 'u' : '') : '') + (d.aktifBolge === bb.kod) + bolgeAcilis(d, bb.kod).durum }).join('|')
      if (im === imza) return
      imza = im
      liste.innerHTML = A.BOLGELER.map((bb) => {
        const kb = d.bolgeler[bb.kod]
        const a = bolgeAcilis(d, bb.kod)
        const acilabilir = a.durum === 'hazir'
        const kilitli = a.durum === 'seviye' || a.durum === 'sira' || a.durum === 'para'
        const aktif = d.aktifBolge === bb.kod
        const bolum = BOLUMLER.find((x) => x.bolge === bb.kod)
        const ilerleme = kb ? kb.gorev.sira / A.GOREVLER.length : 0
        return `<div class="bl-kart${aktif ? ' aktif' : ''}${kilitli ? ' kilitli' : ''}" style="--br:${bb.vurgu}">
          <i class="bl-ikon">${cevherIkonu(bb.kod)}</i>
          <div class="bl-bilgi"><b>${bb.ad}${kb && kb.usta ? ' <em>Usta</em>' : ''}</b><small>${bb.cevher} · ${bb.alt}</small>
            <small class="bl-bolum">Bölüm ${bolum.no}: ${bolum.ad}</small>
            <i class="cubuk-ince"><i style="transform:scaleX(${ilerleme})"></i></i></div>
          ${aktif ? '<span class="bl-durum">Buradasın</span>'
            : a.durum === 'para' ? `<span class="bl-durum kilit">${ikon('para')}${bicim(a.bedel)}</span>`
            : kilitli ? `<span class="bl-durum kilit">${ikon('kilit')}${a.durum === 'sira' ? 'Önce ' + A.BOLGE[a.kasa].ad : 'Sv.' + bb.acilisLv}</span>`
            : `<button class="btn ${acilabilir ? 'btn-yesil' : 'btn-turuncu'}" data-eylem="bolge-git" data-kod="${bb.kod}">${acilabilir ? 'Aç · ' + bicim(a.bedel) : 'Git'}</button>`}
        </div>`
      }).join('') + `<p class="sayfa-not">Yeni bölgenin açılış bedeli bir önceki bölgenin kasasından ödenir; prestijden sonra seviye şartı aranmaz. Ayrıldığın bölgelerde yöneticili katlar çalışmaya devam eder; döndüğünde kazancı kasaya eklenir (Ambar ile süre uzar).</p>`
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
    g.innerHTML = `<div class="sayfa-baslik2">${simge('kontrat', B.durumAl().aktifBolge, 40)}<div><h2>Kontratlar</h2><small>Siparişi teslim et, ödülü al. Her kontrat bir öncekinden büyük.</small></div></div><div class="kt-liste"></div>`
    simgeleriCiz(g, B)
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
