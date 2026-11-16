// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  MAĞAZA (§2.16, magaza.md) — bölüm sırası: günlük hediye (7 günlük
//  döngü), özel teklif, takviyeler (elmasla), bedava elmas (ödüllü reklam,
//  günde 3), elmas kumbarası, elmas paketleri ve kalıcı ürünler.
//  • Tarayıcıda paketler deneme olarak verilir (ödeme alınmaz);
//    uygulamada Google Play ödemesi açılır (magaza.js).
//  • Tek turuncu düğme hediye almaktır; fiyatlar ikincil, reklam yeşil
//    (▶ ve kalan hak), elmas harcamaları mavi. Ücretsiz eylemde bedel yazmaz.
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
const REKLAM_HAK = 3
const OYNAT = '▶︎'

// Sayfa başlığının alt satırı
export const baslik = () => ({ ad: 'Mağaza', alt: 'Günlük hediye, takviyeler ve elmas' })

export function kur(B, govde) {
  const urunler = Magaza.URUNLER.filter((u) => u.tur !== 'kumbara')
  const teklif = urunler.find((u) => u.id === 'baslangic')
  const paketler = urunler.filter((u) => u.tur === 'elmas')
  const kalicilar = urunler.filter((u) => u.tur === 'kalici')
  const kumbaraUrun = Magaza.URUNLER.find((u) => u.tur === 'kumbara')
  const kod0 = B.durumAl().aktifBolge
  const fiyatBtn = (u, ek = '') => `<button class="btn btn-krem dk-fiyat${ek}" data-eylem="dk-urun" data-id="${u.id}"><span class="sayi">${Magaza.fiyat(u)}</span></button>`
  govde.innerHTML = `<div class="dk sy">
    <section class="dk-gunluk" aria-labelledby="dk-b-gunluk">
      <h3 class="dk-bolum" id="dk-b-gunluk"><span>Günlük Hediye</span><small class="dk-gun-sure sayi"></small></h3>
      <div class="dk-gunler">${A.GUNLUK_HEDIYE.map((h, i) => `<div class="dk-gun" data-i="${i}" title="${h.metin}" aria-label="${i + 1}. gün: ${h.metin}"><small>${i + 1}. gün</small>${simge(HEDIYE_SIMGE[h.tur] || 'hediye', kod0, 26)}<i class="dk-tik">${ikon('tik')}</i></div>`).join('')}</div>
      <p class="dk-bugun"></p>
      <button class="btn btn-turuncu dk-al" data-eylem="dk-gunluk">Bugünün hediyesini al</button></section>
    ${teklif ? `<section class="dk-teklif-bolum" aria-labelledby="dk-b-teklif"><h3 class="dk-bolum" id="dk-b-teklif"><span>Özel Teklif</span></h3>
      <div class="pano dk-teklif" data-urun="${teklif.id}">${teklif.etiket ? `<span class="dk-indirim">${teklif.etiket}</span>` : ''}
        <div class="dk-teklif-ust">${simge(urunSimge(teklif), kod0, 46)}<b>Başlangıç Paketi</b></div>
        <ul class="dk-icerik">${(teklif.ne || '').split(' + ').map((x) => `<li>${x}</li>`).join('')}</ul>
        ${fiyatBtn(teklif, ' dk-teklif-al')}</div></section>` : ''}
    <section aria-labelledby="dk-b-guc"><h3 class="dk-bolum" id="dk-b-guc"><span>Takviyeler</span></h3>
      <div class="pano dk-liste">${GUC.map((g) => `<div class="dk-satir" data-guc="${g.kod}"><span class="dk-simge">${simge(g.simge, kod0, 46)}${g.rozet ? `<em>${g.rozet}</em>` : ''}</span><div><b>${A.ELMAS_HARCAMA[g.kod].metin}</b><small>${g.aciklama}</small><small class="dk-ek sayi"></small></div>
        <button class="btn btn-mavi" data-eylem="dk-guc" data-kod="${g.kod}">${ikon('elmas')}<span class="sayi">${A.ELMAS_HARCAMA[g.kod].elmas}</span></button></div>`).join('')}</div></section>
    <section aria-labelledby="dk-b-bedava"><h3 class="dk-bolum" id="dk-b-bedava"><span>Bedava Elmas</span></h3>
      <div class="dk-krem dk-reklam">${simge('elmas', '', 40)}<div><b>Kısa bir reklam izle</b><small class="dk-reklam-kalan"></small></div>
        <button class="btn btn-yesil dk-reklam-btn" data-eylem="dk-reklam"><span class="dk-izle">${OYNAT} İzle · +5</span><small class="dk-hak sayi"></small></button></div></section>
    <section class="dk-kumbara" aria-labelledby="dk-b-kumbara"><h3 class="dk-bolum" id="dk-b-kumbara"><span>Elmas Kumbarası</span><small class="dk-kb-bonus"></small></h3>
      <div class="pano dk-liste"><div class="dk-satir">${simge('kumbara', '', 52)}<div><b>Oynadıkça dolar</b><small>Yükseltme, kat açma, kontrat ve hazine kumbaraya elmas atar. Kırınca hepsi senin.</small>
        <span class="cubuk-ince"><i></i></span><span class="dk-kumbara-sayi sayi"></span></div>
      <button class="btn btn-krem" data-eylem="dk-urun" data-id="${kumbaraUrun.id}"><span class="sayi">Kır · ${Magaza.fiyat(kumbaraUrun)}</span></button></div></div></section>
    <section aria-labelledby="dk-b-paket"><h3 class="dk-bolum" id="dk-b-paket"><span>Elmas Paketleri</span></h3>
      <div class="dk-paketler">${paketler.map((u) => `<div class="dk-krem dk-paket" data-urun="${u.id}">${u.etiket ? `<em class="dk-paket-ek">${u.etiket}</em>` : ''}${simge('elmas', '', 36)}<b class="sayi">${u.n.toLocaleString('tr-TR')} elmas</b>${fiyatBtn(u)}</div>`).join('')}</div></section>
    ${kalicilar.length ? `<section aria-labelledby="dk-b-kalici"><h3 class="dk-bolum" id="dk-b-kalici"><span>Kalıcı</span></h3>
      <div class="pano dk-liste">${kalicilar.map((u) => `<div class="dk-satir dk-urun" data-urun="${u.id}">${simge(urunSimge(u), kod0, 46)}
        <div><b>${u.ad}</b><small>${u.ne || ''}</small></div>${fiyatBtn(u)}</div>`).join('')}</div></section>` : ''}
    <button class="dk-geri-yukle" data-eylem="dk-geri-yukle" hidden>Satın alımları geri yükle</button>
    <p class="sayfa-not dk-not"></p>
  </div>`
  simgeleriCiz(govde, B)
  const q = (s) => govde.querySelector(s)
  const el = {
    gunler: [...govde.querySelectorAll('.dk-gun')], gunAl: q('.dk-al'), gunSure: q('.dk-gun-sure'), bugun: q('.dk-bugun'),
    reklamKalan: q('.dk-reklam-kalan'), reklamBtn: q('[data-eylem="dk-reklam"]'), reklamHak: q('.dk-hak'),
    guc: [...govde.querySelectorAll('[data-guc]')].map((x) => ({ el: x, kod: x.dataset.guc, btn: x.querySelector('button'), ek: x.querySelector('.dk-ek') })),
    urunler: [...govde.querySelectorAll('[data-urun]')].map((x) => ({ el: x, id: x.dataset.urun, btn: x.querySelector('button') })),
    teklifBolum: q('.dk-teklif-bolum'),
    not: q('.dk-not'), geriYukle: q('.dk-geri-yukle'),
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
    yaz(el.gunAl, alindi ? 'Yarın tekrar gel · ' + kalanKisa((yarin.getTime() - Date.now()) / 1000) : 'Bugünün hediyesini al')
    yaz(el.bugun, (alindi ? 'Bugün aldın: ' : 'Bugün: ') + A.GUNLUK_HEDIYE[bugun].metin)
    yaz(el.gunSure, `${d.gunluk.seri} gün toplandı`)
    // Ödüllü reklam: ▶ ve kalan hak her zaman görünür
    const r = d.reklamElmas
    const kalan = Math.max(0, r.gun === gun ? REKLAM_HAK - r.n : REKLAM_HAK)
    yaz(el.reklamKalan, kalan > 0 ? `Bugün ${kalan} hakkın kaldı` : 'Bugünlük hakların bitti')
    yaz(el.reklamHak, `${kalan}/${REKLAM_HAK} hak`)
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
      u.btn.disabled = sahip
      sinif(u.el, 'sahip', sahip)
      if (sahip) yaz(u.btn.firstElementChild, '✓ Sende')
    }
    if (el.teklifBolum) gizle(el.teklifBolum, !d.ogretici.bitti)
    // Kumbara: içindeki elmas, tavan ve kırılışlardan gelen dolum bonusu
    const kb = Math.floor(d.kumbara.elmas), tavan = kumbaraTavan(d)
    cubuk(el.kbCubuk, kb / tavan)
    yaz(el.kbSayi, `${kb} / ${tavan} elmas${kb >= tavan ? ' · dolu!' : ''}`)
    const bonus = kumbaraBonus(d) - 1
    yaz(el.kbBonus, bonus > 0 ? `Dolum +%${Math.round(bonus * 100)}` : '')
    el.kbBtn.disabled = kb < A.KUMBARA.enAz
    sinif(el.kbBtn, 'nabiz', kb >= tavan)
    const gercek = Magaza.gercek()
    gizle(el.geriYukle, !gercek)
    yaz(el.not, gercek ? 'Ödemeler Google Play üzerinden yapılır.' : 'Önizleme: ödeme Play Store sürümünde açılır. Burada denersen ürün verilir, ödeme alınmaz.')
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
  B.eylemler['dk-geri-yukle'] = () => { Magaza.geriYukle(); B.bildir('bilgi', 'Satın alımlar kontrol ediliyor') }
  return { kare2 }
}
