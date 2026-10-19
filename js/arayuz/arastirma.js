// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  ARAŞTIRMA (§2.15) — Zeynep'in laboratuvarı. Dört dal, 14 araştırma.
//  • Aynı anda bir araştırma sürer; elmas + oyun zamanı ister.
//  • Hızlandırma: ödüllü reklam −15 dk (seviye başına 2) ya da elmasla bitir.
//  • Seviye 3'te açılır; öncesinde kilitli tanıtım gösterilir.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, sayac, sure, cubuk, simge, simgeleriCiz } from './ortak.js'
import { arastirmaTeklif, arastirmaSart, arastirmaBilgi } from '../benzetim.js'

const ETKI = {
  kazma: 'Üretim +%10', damar: 'Kat açma −%8', usta: 'Kat yükseltme −%5', matkap: 'Üretim ×1,5',
  halat: 'Asansör kapasitesi +%15', motor: 'Asansör hızı +%10', ray: 'Vagon hızı +%10', depo: 'Depo kapasitesi +%25',
  pazar: 'Satış +%10', gece: 'Çevrimdışı +1 saat', ihracat: 'Satış ×1,5',
  okul: 'Yetenek süresi +%20', dinlenme: 'Yetenek bekleme −%10', ik: 'Yönetici maliyeti −%15',
}
const DAL_IKON = { Madencilik: 'kazma', Taşıma: 'asansor', Ticaret: 'para', Yönetim: 'yonetici' }
const DAL_SIMGE = { Madencilik: 'kazma', Taşıma: 'kabin', Ticaret: 'sikke', Yönetim: 'kask' }

export function kur(B, govde) {
  const dallar = [...new Set(A.ARASTIRMALAR.map((a) => a.dal))]
  const kod0 = B.durumAl().aktifBolge
  govde.innerHTML = `<div class="ar sy">
    <header class="sy-bas">${simge('sise', '', 54)}<div><h2>Araştırma Laboratuvarı</h2><small>Aynı anda bir araştırma sürer; bitince kalıcı güç verir.</small></div></header>
    <section class="ar-ust"><span class="ar-yuz"><img src="img/ref/yuz-3.png" alt=""></span><p class="ar-soz"></p></section>
    <section class="pano ar-suren" hidden><h3 class="plaka">${ikon('saat')}<span class="ar-suren-ad"></span><small class="sayi ar-suren-sure"></small></h3>
      <div class="kt-cubuk"><i class="ar-suren-cubuk"></i><span class="sayi ar-suren-oran"></span></div>
      <div class="ar-suren-alt"><button class="btn btn-krem" data-eylem="ar-reklam">${ikon('oynat')}<span>−15 dk</span></button>
      <button class="btn btn-mavi" data-eylem="ar-bitir">${ikon('elmas')}<span class="sayi ar-bitir"></span></button></div></section>
    ${dallar.map((dal) => {
      const liste = A.ARASTIRMALAR.filter((a) => a.dal === dal)
      return `<section class="pano ar-dal"><h3 class="plaka">${ikon(DAL_IKON[dal] || 'arastirma')}<span>${dal}</span><small class="sayi" data-dal="${dal}"></small></h3>
      ${liste.map((a) => `<div class="ar-kart" data-kod="${a.kod}">${simge(DAL_SIMGE[dal] || 'sise', kod0, 42)}
        <div class="ar-bilgi"><b>${a.ad} <small class="ar-tier">T${a.tier}</small></b><span>${ETKI[a.kod]}${a.sv > 1 ? ' / seviye' : ''}</span>
          <i class="ar-noktalar">${'<i></i>'.repeat(a.sv)}</i><small class="ar-sart"></small></div>
        <button class="btn btn-turuncu ar-al" data-eylem="ar-basla" data-kod="${a.kod}">${ikon('elmas')}<span class="sayi"></span><small class="sayi"></small></button>
      </div>`).join('')}</section>`
    }).join('')}
  </div>`
  simgeleriCiz(govde, B)
  const q = (s) => govde.querySelector(s)
  const el = {
    soz: q('.ar-soz'), suren: q('.ar-suren'), surenAd: q('.ar-suren-ad'), surenSure: q('.ar-suren-sure'),
    surenCubuk: q('.ar-suren-cubuk'), surenOran: q('.ar-suren-oran'), bitir: q('.ar-bitir'),
    reklam: q('[data-eylem="ar-reklam"]'), bitirBtn: q('[data-eylem="ar-bitir"]'),
    kartlar: [...govde.querySelectorAll('.ar-kart')].map((k) => ({
      k, kod: k.dataset.kod, noktalar: [...k.querySelectorAll('.ar-noktalar > i')], sart: k.querySelector('.ar-sart'),
      btn: k.querySelector('.ar-al'), elmas: k.querySelector('.ar-al span'), sure: k.querySelector('.ar-al small'),
    })),
    dallar: [...govde.querySelectorAll('[data-dal]')].map((x) => ({ el: x, liste: A.ARASTIRMALAR.filter((a) => a.dal === x.dataset.dal) })),
  }

  function kare2(d) {
    const kilitli = d.oyuncu.lv < 3
    const s = d.arastirma.suren
    yaz(el.soz, kilitli ? 'Zeynep: "Laboratuvar Seviye 3\'te hazır olacak. Sabırlı ol, numuneler çok umut verici!"'
      : s ? 'Zeynep: "Deneyler sürüyor. Bitince haber vereceğim."' : 'Zeynep: "Bir araştırma seç, madenleri birlikte geliştirelim!"')
    gizle(el.suren, !s)
    if (s) {
      const a = arastirmaBilgi(s.kod)
      const kalan = Math.max(0, s.bitis - d.zaman)
      yaz(el.surenAd, `${a ? a.ad : s.kod} · ${(d.arastirma.sv[s.kod] || 0) + 1}. seviye`)
      yaz(el.surenSure, sayac(kalan))
      cubuk(el.surenCubuk, 1 - kalan / s.sure)
      yaz(el.surenOran, '%' + Math.floor((1 - kalan / s.sure) * 100))
      const bedel = Math.max(1, Math.ceil(kalan / 60 / 5))
      yaz(el.bitir, 'Bitir · ' + bedel)
      el.bitirBtn.disabled = d.oyuncu.elmas < bedel
      el.reklam.disabled = s.reklam >= 2
    }
    for (const dl of el.dallar) {
      let biten = 0
      for (const a of dl.liste) if ((d.arastirma.sv[a.kod] || 0) >= a.sv) biten++
      yaz(dl.el, `${biten} / ${dl.liste.length}`)
    }
    for (const c of el.kartlar) {
      const sv = d.arastirma.sv[c.kod] || 0
      c.noktalar.forEach((n, i) => sinif(n, 'dolu', i < sv))
      const tk = arastirmaTeklif(d, c.kod)
      const sart = arastirmaSart(d, c.kod)
      const maks = !tk
      sinif(c.k, 'maks', maks)
      sinif(c.k, 'kilitli', !maks && (!sart.ok || kilitli))
      sinif(c.k, 'suruyor', !!(s && s.kod === c.kod))
      yaz(c.sart, maks ? 'Tamamlandı' : !sart.ok ? 'Gerekli: ' + sart.eksik : '')
      if (maks) { gizle(c.btn, true); continue }
      gizle(c.btn, false)
      yaz(c.elmas, String(tk.elmas))
      yaz(c.sure, sure(tk.sure))
      c.btn.disabled = kilitli || !sart.ok || !!s || d.oyuncu.elmas < tk.elmas
    }
  }

  B.eylemler['ar-basla'] = (btn) => {
    const r = B.eylem('arastirmaBaslat', { kod: btn.dataset.kod })
    if (r && r.ok) B.bildir('basari', `${arastirmaBilgi(btn.dataset.kod).ad} başladı (${sure(r.sure)})`)
    else if (r && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    else if (r && r.sebep === 'mesgul') B.bildir('bilgi', 'Aynı anda bir araştırma yapılabilir')
  }
  B.eylemler['ar-bitir'] = () => {
    const r = B.eylem('arastirmaHizlandir', { yontem: 'elmas' })
    if (r && !r.ok && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
  }
  B.eylemler['ar-reklam'] = async () => {
    let ok = false
    try { ok = await B.reklamIzle('arastirma') } catch { ok = false }
    if (ok) B.eylem('arastirmaHizlandir', { yontem: 'reklam' })
  }
  return { kare2 }
}
