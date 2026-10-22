// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  KEŞİF VE MÜZE (Egg Inc gemileri, Mr. Mine kalıntıları, Deep Town
//  mağara buluntuları) — Zeynep'in keşif ekibi ve Maden Müzesi.
//  • Keşif: üç sefer türü; aynı anda bir sefer, oyun saatiyle (sen yokken
//    de) sürer. Reklam −15 dk (2 kez) ya da elmasla bitir; dönünce topla.
//  • Müze: 12 bölge × 3 buluntu. Bulunmayan buluntu karartılmış siluettir;
//    seviye noktaları, etkisi ve bölge seti (üçü de bulununca satış +%25).
//  • Yöneticiler sayfasındaki "Keşif ve Müze" bölümünden açılır.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, cubuk, sayac, sure, simge, simgeleriCiz, canlandir, NABIZ } from './ortak.js'
import { kesifAcik, kesifDurumu, hizlandirmaElmas } from '../benzetim.js'
import { buluntuEtki, buluntuSeti } from '../ekonomi.js'

const ETKI_AD = { uretim: 'Üretim', tasima: 'Taşıma', gelir: 'Gelir', maliyet: 'Maliyet' }
const yuzdeYaz = (x) => (Math.round(x * 1000) / 10).toLocaleString('tr-TR')
// Buluntunun L seviyedeki etkisi: "Üretim +%8"
export function buluntuEtkiYazi(t, L) {
  const v = A.BULUNTU.etki[t.etki] * Math.max(1, L)
  return `${ETKI_AD[t.etki]} ${t.etki === 'maliyet' ? '−' : '+'}%${yuzdeYaz(v)}`
}
const turAl = (kod) => A.KESIF.find((t) => t.kod === kod) || A.KESIF[0]

export function kur(B) {
  let sonucGoster = null
  B.pencere.kaydet('kesif', (g) => {
    const d0 = B.durumAl()
    g.innerHTML = `<div class="ks">
      <div class="yk-bas ks-bas">${simge('pusula', '', 54)}<div><h2>Keşif ve Müze</h2><p>Zeynep'in ekibi keşfe çıkar; buluntular müzede kalıcı güç verir.</p></div></div>
      <section class="pano ks-sefer">
        <h3 class="plaka">${ikon('harita')}<span>Keşif Ekibi</span><small class="ks-bolge"></small></h3>
        <p class="ks-kilit" hidden>Jeolog Zeynep ekibe katılınca keşif ekibi kurulur (Zonguldak'ın 6. görevi).</p>
        <div class="ks-secenekler">${A.KESIF.map((t) => `<button class="yuva ks-sec" data-eylem="ks-basla" data-tur="${t.kod}">
          <b>${t.ad}</b><small>${sure(t.sure)} · ${t.zar} buluntu şansı</small><span class="ks-odul">${ikon('elmas')}<span class="sayi">${t.elmas[0]}–${t.elmas[1]}</span></span></button>`).join('')}</div>
        <div class="ks-suren" hidden><b class="ks-ad"></b>
          <div class="kt-cubuk"><i></i><span class="sayi"></span></div>
          <div class="ks-dugmeler"><button class="btn btn-krem" data-eylem="ks-reklam">${ikon('oynat')}<span>−15 dk</span></button>
            <button class="btn btn-mavi" data-eylem="ks-bitir">${ikon('elmas')}<span class="sayi"></span></button></div></div>
        <div class="ks-hazir" hidden><p><b>Ekip döndü!</b> Getirdiklerine bak.</p><button class="btn btn-yesil nabiz" data-eylem="ks-topla">${ikon('hediye')}<span>Getirdiklerini Al</span></button></div>
        <div class="ks-sonuc" hidden></div>
      </section>
      <section class="pano ks-muze">
        <h3 class="plaka">${ikon('kitap')}<span>Maden Müzesi</span><small class="sayi ks-sayi"></small></h3>
        <div class="ks-toplam"></div>
        ${A.BOLGELER.map((bb) => `<div class="ks-bolge-satir" data-bolge="${bb.kod}"><div class="ks-bolge-bas"><b>${bb.ad}</b><small class="ks-set">Set: ${bb.ad} satışı +%${Math.round(A.BULUNTU.set * 100)}</small></div>
          <div class="ks-vitrin">${A.BULUNTULAR.filter((t) => t.bolge === bb.kod).map((t) => `<button class="yuva ks-esya" data-eylem="ks-esya" data-kod="${t.kod}">
            <span class="ks-simge"></span><b>${t.ad}</b><i class="ks-sv">${'<i></i>'.repeat(A.BULUNTU.maks)}</i></button>`).join('')}</div></div>`).join('')}
      </section>
    </div>`
    const q = (s) => g.querySelector(s)
    const el = {
      bolge: q('.ks-bolge'), kilit: q('.ks-kilit'), secenekler: q('.ks-secenekler'), secler: [...g.querySelectorAll('.ks-sec')],
      suren: q('.ks-suren'), ad: q('.ks-ad'), cubuk: q('.ks-suren .kt-cubuk i'), cubukYazi: q('.ks-suren .kt-cubuk span'),
      reklam: q('[data-eylem="ks-reklam"]'), bitir: q('[data-eylem="ks-bitir"]'), bitirYazi: q('[data-eylem="ks-bitir"] span'),
      hazir: q('.ks-hazir'), sonuc: q('.ks-sonuc'), sayi: q('.ks-sayi'), toplam: q('.ks-toplam'),
      satirlar: [...g.querySelectorAll('.ks-bolge-satir')].map((s) => ({ s, kod: s.dataset.bolge })),
      esyalar: [...g.querySelectorAll('.ks-esya')].map((b) => ({ b, kod: b.dataset.kod, simge: b.querySelector('.ks-simge'), noktalar: [...b.querySelectorAll('.ks-sv > i')], L: -1 })),
    }
    // Sonuç: son toplanan seferin getirdikleri (sayfa açıkken)
    sonucGoster = (r) => {
      gizle(el.sonuc, false)
      el.sonuc.innerHTML = `<b>${A.BOLGE[r.bolge].ad} keşfinden dönüş</b><div class="ks-sonuc-l">${r.bulunan.map((x) => {
        const t = A.BULUNTULAR.find((y) => y.kod === x.kod)
        return `<span class="ks-yeni">${simge('buluntu', '', 40, '', x.kod)}<small>${t.ad}${x.yeni ? ' · Yeni!' : ' · Sv.' + x.L}</small></span>`
      }).join('') || '<small>Bu sefer buluntu çıkmadı.</small>'}<span class="ks-yeni">${simge('elmas', '', 40)}<small>+${r.elmas} elmas</small></span></div>`
      simgeleriCiz(el.sonuc, B)
      canlandir(el.sonuc, NABIZ, 320)
    }
    let imza = ''
    return (d) => {
      const acik = kesifAcik(d)
      const s = kesifDurumu(d)
      gizle(el.kilit, acik)
      gizle(el.secenekler, !acik || !!s)
      gizle(el.suren, !s || s.hazir)
      gizle(el.hazir, !s || !s.hazir)
      yaz(el.bolge, s ? A.BOLGE[s.bolge].ad + ' çevresi' : acik ? A.BOLGE[d.aktifBolge].ad + ' çevresi' : '')
      if (s && !s.hazir) {
        const t = turAl(s.tur)
        yaz(el.ad, t.ad)
        cubuk(el.cubuk, 1 - s.kalan / s.sure)
        yaz(el.cubukYazi, 'Dönüşe ' + sayac(s.kalan))
        const elmas = hizlandirmaElmas(s.kalan)
        yaz(el.bitirYazi, 'Bitir · ' + elmas)
        el.bitir.disabled = d.oyuncu.elmas < elmas
        el.reklam.disabled = s.reklam >= A.KESIF_HIZ.reklamHak
      }
      // Müze: yalnız değişince yeniden çizilir
      const im = JSON.stringify(d.buluntu)
      if (im !== imza) {
        imza = im
        let bulunan = 0
        for (const e of el.esyalar) {
          const L = d.buluntu[e.kod] || 0
          if (L) bulunan++
          if (L === e.L) continue
          const ilk = e.L === 0 && L > 0
          e.L = L
          e.simge.innerHTML = simge('buluntu', '', 48, '', e.kod + (L ? '' : ':golge'))
          simgeleriCiz(e.simge, B)
          sinif(e.b, 'yok', !L)
          sinif(e.b, 'maks', L >= A.BULUNTU.maks)
          e.noktalar.forEach((n, i) => sinif(n, 'dolu', i < L))
          if (ilk) canlandir(e.b, NABIZ, 320)
        }
        let set = 0
        for (const r of el.satirlar) { const v = buluntuSeti(d, r.kod); if (v) set++; sinif(r.s, 'set', v) }
        yaz(el.sayi, `${bulunan} / ${A.BULUNTULAR.length}`)
        el.toplam.innerHTML = Object.keys(ETKI_AD).map((k) => {
          const v = buluntuEtki(d, k)
          return `<span class="${v > 0 ? 'var' : ''}"><small>${ETKI_AD[k]}</small><b class="sayi">${k === 'maliyet' ? '−' : '+'}%${yuzdeYaz(v)}</b></span>`
        }).join('') + `<span class="${set ? 'var' : ''}"><small>Set</small><b class="sayi">${set} / ${A.BOLGELER.length}</b></span>`
      }
    }
  })

  const tazele = () => B.pencere.kare4(B.durumAl())
  B.eylemler['ks-basla'] = (btn) => {
    const r = B.eylem('kesifBaslat', { tur: btn.dataset.tur })
    if (r && r.ok) B.bildir('basari', `Keşif ekibi yola çıktı · ${sure(r.sure)}`)
    else if (r && r.sebep === 'kilit') B.bildir('bilgi', 'Keşif ekibi Zeynep katılınca kurulur.')
    tazele()
  }
  B.eylemler['ks-bitir'] = () => {
    const r = B.eylem('kesifHizlandir', { yontem: 'elmas' })
    if (r && !r.ok && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    tazele()
  }
  B.eylemler['ks-reklam'] = async () => {
    let ok = false
    try { ok = await B.reklamIzle('kesif') } catch { ok = false }
    if (ok) B.eylem('kesifHizlandir', { yontem: 'reklam' })
    tazele()
  }
  B.eylemler['ks-topla'] = () => {
    const r = B.eylem('kesifTopla', {})
    if (!r || !r.ok) return
    tazele()
    if (sonucGoster && B.pencere.acikSayfa() === 'kesif') sonucGoster(r)
    const yeni = r.bulunan.filter((x) => x.yeni).length
    B.bildir('basari', r.bulunan.length ? `${r.bulunan.length} buluntu${yeni ? ` (${yeni} yeni)` : ''} ve +${r.elmas} elmas!` : `+${r.elmas} elmas!`)
  }
  B.eylemler['ks-esya'] = (btn) => {
    const t = A.BULUNTULAR.find((x) => x.kod === btn.dataset.kod)
    const L = B.durumAl().buluntu[t.kod] || 0
    B.bildir('bilgi', L ? `${t.ad} · Sv.${L}: ${t.metin} ${buluntuEtkiYazi(t, L)}.` : `${t.ad}: henüz bulunmadı. ${A.BOLGE[t.bolge].ad} keşiflerinden çıkar.`)
  }
  B.eylemler['kesif-ac'] = () => B.pencere.ac('kesif', {})

  function olay(o) {
    if (o.tip === 'kesifDondu') { if (B.pencere.acikSayfa() !== 'kesif') B.bildir('basari', 'Keşif ekibi döndü! Yöneticiler › Keşif ve Müze') }
    else if (o.tip === 'hazineAlindi' && o.buluntu) {
      const t = A.BULUNTULAR.find((x) => x.kod === o.buluntu.kod)
      if (t) B.bildir('basari', `Damardan müzelik buluntu: ${t.ad}${o.buluntu.yeni ? '' : ' · Sv.' + o.buluntu.L}!`)
    }
  }
  return { olay }
}
