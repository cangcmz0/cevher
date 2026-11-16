// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  ARAŞTIRMA (§2.15) — Zeynep'in laboratuvarı. Dört dal, 14 araştırma.
//  • Aynı anda bir araştırma sürer; elmas + oyun zamanı ister.
//  • Hızlandırma: ödüllü reklam −15 dk (seviye başına 2) ya da elmasla bitir.
//  • Öğretici bitince açılır; öncesinde kilitli tanıtım gösterilir.
//  • Düzen (arastirma.md): en üstte süren araştırma panosu, sonra dört dal
//    başlığı ve altında düğüm satırları (56 px daire, seviye pip'leri,
//    MAKS / Sürüyor / Kilitli). Tek turuncu düğme: ilk uygun düğümün Başlat'ı.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, sure, cubuk, simge, simgeleriCiz } from './ortak.js'
import { arastirmaTeklif, arastirmaSart, arastirmaBilgi } from '../benzetim.js'

const ETKI = {
  kazma: 'Üretim +%10', damar: 'Kat açma −%8', usta: 'Kat yükseltme −%5', matkap: 'Üretim ×1,5',
  halat: 'Asansör kapasitesi +%15', motor: 'Asansör hızı +%10', ray: 'Kamyon hızı +%10', depo: 'Depo kapasitesi +%25',
  pazar: 'Satış +%10', gece: 'Çevrimdışı +1 saat', ihracat: 'Satış ×1,5',
  okul: 'Yetenek süresi +%20', dinlenme: 'Yetenek bekleme −%10', ik: 'Yönetici maliyeti −%15', miras: 'Mühür etkisi +%1',
}
const DAL_SIMGE = { Madencilik: 'kazma', Taşıma: 'kabin', Ticaret: 'sikke', Yönetim: 'kask' }
const OYNAT = '▶︎'
const REKLAM_HAK = 2

// Sayfa başlığının alt satırı
export const baslik = (d) => {
  const biten = A.ARASTIRMALAR.filter((a) => (d.arastirma.sv[a.kod] || 0) >= a.sv).length
  return { ad: 'Araştırma', alt: `Zeynep'in laboratuvarı · ${biten}/${A.ARASTIRMALAR.length} tamam` }
}

// Kilitli düğümün bütün eksik koşulları: "Usta Madenciler Sv. 2 ve Karabük gerekli"
function kosulYazi(d, a) {
  const eksik = []
  for (const k of Object.keys(a.sart)) {
    const gerek = a.sart[k]
    if (k === 'bolge') { if (!d.prestij.acilan.includes(gerek)) eksik.push(A.BOLGE[gerek].ad) }
    else if ((d.arastirma.sv[k] || 0) < gerek) eksik.push((arastirmaBilgi(k) || { ad: k }).ad + ' Sv. ' + gerek)
  }
  return eksik.length ? eksik.join(' ve ') + ' gerekli' : ''
}

export function kur(B, govde) {
  const dallar = [...new Set(A.ARASTIRMALAR.map((a) => a.dal))]
  const kod0 = B.durumAl().aktifBolge
  govde.innerHTML = `<div class="ar sy">
    <section class="pano ar-suren" aria-label="Süren araştırma">
      <div class="ar-s-ust"><b class="ar-suren-ad"></b><span class="sayi ar-suren-sure"></span></div>
      <div class="kt-cubuk ar-s-cubuk"><i class="ar-suren-cubuk"></i><span class="sayi ar-suren-oran"></span></div>
      <div class="ar-suren-alt"><button class="btn btn-yesil ar-reklam" data-eylem="ar-reklam"><span class="ar-r-ust">${OYNAT} −15 dk</span><small class="sayi ar-r-hak"></small></button>
      <button class="btn btn-mavi" data-eylem="ar-bitir">${ikon('elmas')}<span class="sayi ar-bitir"></span></button></div>
      <p class="ar-bos"></p></section>
    <section class="ar-ust"><span class="ar-yuz"><img src="img/ref/yuz-3.png" alt=""></span><p class="ar-soz"></p></section>
    ${dallar.map((dal) => {
      const liste = A.ARASTIRMALAR.filter((a) => a.dal === dal)
      return `<section class="ar-dal" aria-label="${dal}"><h3 class="ar-bolum"><span>${dal}</span><small class="sayi" data-dal="${dal}"></small></h3>
      <div class="ar-dugumler">${liste.map((a) => `<div class="ar-kart" data-kod="${a.kod}">
        <span class="ar-daire">${simge(DAL_SIMGE[dal] || 'sise', kod0, 36)}<i class="ar-kilit">${ikon('kilit')}</i></span>
        <div class="ar-bilgi"><b>${a.ad}</b><span class="ar-etki">${ETKI[a.kod]}${a.sv > 1 ? ' / seviye' : ''}</span>
          <span class="ar-sv"><i class="ar-noktalar">${'<i></i>'.repeat(a.sv)}</i><small class="ar-sv-yazi sayi"></small></span>
          <small class="ar-sart"></small></div>
        <button class="btn btn-krem ar-al" data-eylem="ar-basla" data-kod="${a.kod}"><span class="ar-al-ust">Başlat</span><small>${ikon('elmas')}<span class="sayi ar-al-elmas"></span> · <span class="sayi ar-al-sure"></span></small></button>
      </div>`).join('')}</div></section>`
    }).join('')}
  </div>`
  simgeleriCiz(govde, B)
  const q = (s) => govde.querySelector(s)
  const el = {
    soz: q('.ar-soz'), suren: q('.ar-suren'), surenAd: q('.ar-suren-ad'), surenSure: q('.ar-suren-sure'),
    surenCubuk: q('.ar-suren-cubuk'), surenOran: q('.ar-suren-oran'), bitir: q('.ar-bitir'), bos: q('.ar-bos'),
    reklam: q('[data-eylem="ar-reklam"]'), reklamHak: q('.ar-r-hak'), bitirBtn: q('[data-eylem="ar-bitir"]'),
    kartlar: [...govde.querySelectorAll('.ar-kart')].map((k) => ({
      k, kod: k.dataset.kod, a: arastirmaBilgi(k.dataset.kod), noktalar: [...k.querySelectorAll('.ar-noktalar > i')], sart: k.querySelector('.ar-sart'),
      svYazi: k.querySelector('.ar-sv-yazi'), btn: k.querySelector('.ar-al'), elmas: k.querySelector('.ar-al-elmas'), sure: k.querySelector('.ar-al-sure'),
    })),
    dallar: [...govde.querySelectorAll('[data-dal]')].map((x) => ({ el: x, liste: A.ARASTIRMALAR.filter((a) => a.dal === x.dataset.dal) })),
  }

  function kare2(d) {
    const kilitli = !d.ogretici.bitti
    const s = d.arastirma.suren
    yaz(el.soz, kilitli ? 'Zeynep: "Laboratuvar, ocağın ilk düzeni kurulunca hazır olacak. Numuneler çok umut verici!"'
      : s ? 'Zeynep: "Deneyler sürüyor. Bitince haber vereceğim."' : 'Zeynep: "Bir araştırma seç, madenleri birlikte geliştirelim!"')
    // Süren araştırma panosu sayfanın en üstünde; boşken kısa yazı
    sinif(el.suren, 'bos', !s)
    yaz(el.bos, kilitli ? 'Laboratuvar öğretici bitince açılır' : 'Laboratuvar boş · bir araştırma seç')
    if (s) {
      const a = arastirmaBilgi(s.kod)
      const kalan = Math.max(0, s.bitis - d.zaman)
      yaz(el.surenAd, `${a ? a.ad : s.kod} · Sv. ${(d.arastirma.sv[s.kod] || 0) + 1}`)
      yaz(el.surenSure, sure(kalan))
      cubuk(el.surenCubuk, 1 - kalan / s.sure)
      yaz(el.surenOran, '%' + Math.floor((1 - kalan / s.sure) * 100))
      const bedel = Math.max(1, Math.ceil(kalan / 60 / 5))
      yaz(el.bitir, 'Bitir · ' + bedel)
      el.bitirBtn.disabled = d.oyuncu.elmas < bedel
      const hak = Math.max(0, REKLAM_HAK - (s.reklam || 0))
      yaz(el.reklamHak, hak > 0 ? `${hak}/${REKLAM_HAK} hak` : 'Hak bitti')
      el.reklam.disabled = hak <= 0
    }
    for (const dl of el.dallar) {
      let biten = 0
      for (const a of dl.liste) if ((d.arastirma.sv[a.kod] || 0) >= a.sv) biten++
      yaz(dl.el, `${biten} / ${dl.liste.length}`)
    }
    let ilkUygun = true
    for (const c of el.kartlar) {
      const sv = d.arastirma.sv[c.kod] || 0
      c.noktalar.forEach((n, i) => sinif(n, 'dolu', i < sv))
      const tk = arastirmaTeklif(d, c.kod)
      const sart = arastirmaSart(d, c.kod)
      const maks = !tk
      const suruyor = !!(s && s.kod === c.kod)
      const kapali = !maks && !suruyor && (!sart.ok || kilitli)
      sinif(c.k, 'maks', maks)
      sinif(c.k, 'suruyor', suruyor)
      sinif(c.k, 'kilitli', kapali)
      yaz(c.svYazi, maks ? 'MAKS' : sv + '/' + c.a.sv)
      yaz(c.sart, maks ? '' : suruyor ? 'Sürüyor · ' + sure(Math.max(0, s.bitis - d.zaman))
        : kilitli ? 'Öğretici bitince açılır' : !sart.ok ? (kosulYazi(d, c.a) || 'Gerekli: ' + sart.eksik) : '')
      if (maks || suruyor || kapali) { gizle(c.btn, true); continue }
      gizle(c.btn, false)
      yaz(c.elmas, String(tk.elmas))
      yaz(c.sure, sure(tk.sure))
      // Tek turuncu düğme: laboratuvar boşken ilk uygun düğüm; meşgulken hepsi soluk (dokununca bildirim)
      const ana = ilkUygun && !s
      if (!s) ilkUygun = false
      sinif(c.btn, 'btn-turuncu', ana)
      sinif(c.btn, 'btn-krem', !ana)
      sinif(c.btn, 'pasif', !!s)
      c.btn.disabled = !s && d.oyuncu.elmas < tk.elmas
    }
  }

  B.eylemler['ar-basla'] = (btn) => {
    const r = B.eylem('arastirmaBaslat', { kod: btn.dataset.kod })
    if (r && r.ok) B.bildir('basari', `${arastirmaBilgi(btn.dataset.kod).ad} başladı (${sure(r.sure)})`)
    else if (r && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    else if (r && r.sebep === 'mesgul') B.bildir('bilgi', 'Laboratuvar meşgul')
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
