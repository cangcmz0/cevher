// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  MAĞAZA (§2.16) — günlük hediye (7 günlük döngü), ücretsiz elmas
//  (ödüllü reklam, günde 3), elmas kumbarası, elmasla güçlendirmeler, özel teklif ve
//  elmas paketleri. Tarayıcıda paketler deneme olarak verilir (ödeme
//  alınmaz); uygulamada Google Play ödemesi açılır (magaza.js).
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, cubuk, bicim, sayac, bolgeAl, simge, simgeleriCiz } from './ortak.js'
import { Magaza } from '../magaza.js'
import { gunKodu, kalanKisa } from './harita.js'
import { otoGelir } from '../ekonomi.js'
import { kumbaraTavan, kumbaraBonus } from '../benzetim.js'

const HEDIYE_SIMGE = { para: 'sikke', elmas: 'elmas', takviye: 'sikke', yonetici: 'kask' }
const GUC = [
  { kod: 'takviye4', simge: 'sikke', rozet: '×2', aciklama: 'Bütün satışlar 4 saat ×2 (24 saate kadar birikir)' },
  { kod: 'atla1', simge: 'kumsaati', aciklama: 'Yöneticili zincirin 1 saatlik geliri hemen' },
  { kod: 'atla4', simge: 'kumsaati', aciklama: 'Yöneticili zincirin 4 saatlik geliri hemen' },
  { kod: 'yenile', simge: 'yildirim', aciklama: 'Bekleyen bütün yönetici yetenekleri hemen hazır' },
]
const urunSimge = (u) => (u.tur === 'elmas' ? 'elmas' : u.id === 'altin_kazma' ? 'kazma' : u.id === 'reklamsiz' ? 'yildirim' : 'hediye')

export function kur(B, govde) {
  const urunler = Magaza.URUNLER.filter((u) => u.tur !== 'kumbara')
  const kumbaraUrun = Magaza.URUNLER.find((u) => u.tur === 'kumbara')
  const kod0 = B.durumAl().aktifBolge
  govde.innerHTML = `<div class="dk sy">
    <header class="sy-bas">${simge('hediye', '', 54)}<div><h2>Mağaza</h2><small>Günlük hediyeler, güçlendirmeler ve elmas paketleri</small></div></header>
    <section class="pano dk-gunluk"><h3 class="plaka">${ikon('hediye')}<span>Günlük Hediye</span><small class="dk-gun-sure"></small></h3>
      <div class="dk-gunler">${A.GUNLUK_HEDIYE.map((h, i) => `<div class="yuva dk-gun" data-i="${i}"><small>${i + 1}. gün</small>${simge(HEDIYE_SIMGE[h.tur] || 'hediye', kod0, i === 6 ? 44 : 36)}<span>${h.metin}</span><i class="dk-tik">${ikon('tik')}</i></div>`).join('')}</div>
      <button class="btn btn-yesil dk-al" data-eylem="dk-gunluk">Hediyeyi Al</button></section>
    <section class="pano"><h3 class="plaka">${ikon('elmas')}<span>Ücretsiz Elmas</span></h3>
      <div class="dk-satir">${simge('elmas', '', 46)}<div><b>Reklam izle, 5 elmas kazan</b><small class="dk-reklam-kalan"></small></div>
      <button class="btn btn-mavi" data-eylem="dk-reklam">${ikon('oynat')}<span>İzle</span></button></div></section>
    <section class="pano dk-kumbara"><h3 class="plaka">${ikon('elmas')}<span>Elmas Kumbarası</span><small class="dk-kb-bonus"></small></h3>
      <div class="dk-satir">${simge('kumbara', '', 52)}<div><b>Oynadıkça dolar</b><small>Yükseltme, kat açma, kontrat ve hazine kumbaraya elmas atar. Kırınca hepsi senin.</small>
        <span class="cubuk-ince"><i></i></span><span class="dk-kumbara-sayi sayi"></span></div>
      <button class="btn btn-yesil" data-eylem="dk-urun" data-id="${kumbaraUrun.id}"><span class="sayi">Kır · ${Magaza.fiyat(kumbaraUrun)}</span></button></div></section>
    <section class="pano"><h3 class="plaka">${ikon('yildirim')}<span>Güçlendirmeler</span></h3>
      ${GUC.map((g) => `<div class="dk-satir" data-guc="${g.kod}"><span class="dk-simge">${simge(g.simge, kod0, 46)}${g.rozet ? `<em>${g.rozet}</em>` : ''}</span><div><b>${A.ELMAS_HARCAMA[g.kod].metin}</b><small>${g.aciklama}</small><small class="dk-ek sayi"></small></div>
        <button class="btn btn-turuncu" data-eylem="dk-guc" data-kod="${g.kod}">${ikon('elmas')}<span class="sayi">${A.ELMAS_HARCAMA[g.kod].elmas}</span></button></div>`).join('')}</section>
    <section class="pano dk-paketler"><h3 class="plaka">${ikon('magaza')}<span>Elmas Paketleri</span></h3>
      ${urunler.map((u) => `<div class="dk-satir dk-urun${u.id === 'baslangic' ? ' teklif' : ''}" data-urun="${u.id}">${simge(urunSimge(u), kod0, 46)}
        <div><b>${u.ad}${u.etiket ? ` <em>${u.etiket}</em>` : ''}</b><small>${u.ne || (u.n ? u.n + ' elmas' : '')}</small></div>
        <button class="btn btn-yesil" data-eylem="dk-urun" data-id="${u.id}"><span class="sayi">${Magaza.fiyat(u)}</span></button></div>`).join('')}
      <p class="sayfa-not dk-not"></p></section>
  </div>`
  simgeleriCiz(govde, B)
  const q = (s) => govde.querySelector(s)
  const el = {
    gunler: [...govde.querySelectorAll('.dk-gun')], gunAl: q('.dk-al'), gunSure: q('.dk-gun-sure'),
    reklamKalan: q('.dk-reklam-kalan'), reklamBtn: q('[data-eylem="dk-reklam"]'),
    guc: [...govde.querySelectorAll('[data-guc]')].map((x) => ({ el: x, kod: x.dataset.guc, btn: x.querySelector('button'), ek: x.querySelector('.dk-ek') })),
    urunler: [...govde.querySelectorAll('[data-urun]')].map((x) => ({ el: x, id: x.dataset.urun, btn: x.querySelector('button') })),
    not: q('.dk-not'),
    kbCubuk: q('.dk-kumbara .cubuk-ince'), kbSayi: q('.dk-kumbara-sayi'), kbBonus: q('.dk-kb-bonus'), kbBtn: q('.dk-kumbara button'),
  }

  function kare2(d) {
    const gun = gunKodu()
    const alindi = d.gunluk.son === gun
    const sira = d.gunluk.seri % A.GUNLUK_HEDIYE.length
    const bugun = alindi ? (sira + A.GUNLUK_HEDIYE.length - 1) % A.GUNLUK_HEDIYE.length : sira
    el.gunler.forEach((g, i) => {
      sinif(g, 'bugun', i === bugun)
      sinif(g, 'alindi', i < bugun || (alindi && i === bugun))
    })
    el.gunAl.disabled = alindi
    const yarin = new Date(); yarin.setHours(24, 0, 0, 0)
    yaz(el.gunAl, alindi ? 'Yarın yeni hediye · ' + kalanKisa((yarin.getTime() - Date.now()) / 1000) : 'Hediyeyi Al')
    yaz(el.gunSure, `${d.gunluk.seri} gün toplandı`)
    const r = d.reklamElmas
    const kalan = r.gun === gun ? 3 - r.n : 3
    yaz(el.reklamKalan, `Bugün ${kalan}/3 hakkın kaldı`)
    el.reklamBtn.disabled = kalan <= 0
    const b = bolgeAl(d)
    const gelir = otoGelir(d, b)
    for (const g of el.guc) {
      const u = A.ELMAS_HARCAMA[g.kod]
      g.btn.disabled = d.oyuncu.elmas < u.elmas || ((g.kod === 'atla1' || g.kod === 'atla4') && !(gelir > 0))
      if (g.kod === 'atla1' || g.kod === 'atla4') yaz(g.ek, gelir > 0 ? '+' + bicim(gelir * 3600 * u.saat) : 'Önce yönetici tut')
      else if (g.kod === 'takviye4') yaz(g.ek, d.takviye.bitis > d.zaman ? 'Aktif · ' + sayac(d.takviye.bitis - d.zaman) : '')
    }
    for (const u of el.urunler) {
      const ur = urunler.find((x) => x.id === u.id)
      const sahip = Magaza.sahip(ur)
      const gizli = u.id === 'baslangic' && !d.ogretici.bitti
      gizle(u.el, gizli)
      u.btn.disabled = sahip
      if (sahip) yaz(u.btn.firstElementChild, 'Alındı')
    }
    // Kumbara: içindeki elmas, tavan ve kırılışlardan gelen dolum bonusu
    const kb = Math.floor(d.kumbara.elmas), tavan = kumbaraTavan(d)
    cubuk(el.kbCubuk, kb / tavan)
    yaz(el.kbSayi, `${kb} / ${tavan} elmas${kb >= tavan ? ' · dolu!' : ''}`)
    const bonus = kumbaraBonus(d) - 1
    yaz(el.kbBonus, bonus > 0 ? `Dolum +%${Math.round(bonus * 100)}` : '')
    el.kbBtn.disabled = kb < A.KUMBARA.enAz
    sinif(el.kbBtn, 'nabiz', kb >= tavan)
    yaz(el.not, Magaza.gercek() ? 'Ödemeler Google Play üzerinden yapılır.' : 'Tarayıcı sürümü: paketler deneme amaçlı ücretsiz verilir, ödeme alınmaz.')
  }

  B.eylemler['dk-gunluk'] = () => {
    const r = B.eylem('gunlukAl', { gun: gunKodu() })
    if (!r || !r.ok) return
    const h = r.hediye
    B.bildir('basari', `Günlük hediye: ${h.tur === 'para' ? '+' + bicim(r.para) : h.metin}!`)
  }
  B.eylemler['dk-reklam'] = async () => {
    let ok = false
    try { ok = await B.reklamIzle('elmas') } catch { ok = false }
    if (!ok) return
    const r = B.eylem('elmasReklam', { gun: gunKodu() })
    if (r && r.ok) B.bildir('basari', '+5 elmas!')
  }
  B.eylemler['dk-guc'] = (btn) => {
    const r = B.eylem('magazaAl', { kod: btn.dataset.kod })
    if (r && r.ok) B.bildir('basari', `${A.ELMAS_HARCAMA[btn.dataset.kod].metin}${r.para ? ': +' + bicim(r.para) : ''} alındı!`)
    else if (r && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    else if (r && r.sebep === 'maks') B.bildir('bilgi', 'Kazanç x2 en fazla 24 saat birikir.')
    else if (r && r.sebep === 'gerek') B.bildir('bilgi', 'Bekleyen yetenek yok.')
  }
  B.eylemler['dk-urun'] = async (btn) => {
    btn.disabled = true
    const r = await B.satinAl(btn.dataset.id)
    btn.disabled = false
    if (r === 'bekle') B.bildir('bilgi', 'Ödeme ekranı açıldı')
    else if (!r) B.bildir('bilgi', 'Satın alma tamamlanmadı')
  }
  return { kare2 }
}
