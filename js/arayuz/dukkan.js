// ════════════════════════════════════════════════════════════════
//  MAĞAZA (§2.16) — günlük hediye (7 günlük döngü), ücretsiz elmas
//  (ödüllü reklam, günde 3), elmasla güçlendirmeler, özel teklif ve
//  elmas paketleri. Tarayıcıda paketler deneme olarak verilir (ödeme
//  alınmaz); uygulamada Google Play ödemesi açılır (magaza.js).
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, yaz, sinif, gizle, bicim, sayac, bolgeAl } from './ortak.js'
import { Magaza } from '../magaza.js'
import { gunKodu, kalanKisa } from './harita.js'
import { otoGelir } from '../ekonomi.js'

const HEDIYE_IKON = { para: 'para', elmas: 'elmas', takviye: 'topla', yonetici: 'yonetici' }
const GUC = [
  { kod: 'takviye4', ikon: 'topla', aciklama: 'Bütün satışlar 4 saat ×2 (24 saate kadar birikir)' },
  { kod: 'atla1', ikon: 'saat', aciklama: 'Yöneticili zincirin 1 saatlik geliri hemen' },
  { kod: 'atla4', ikon: 'saat', aciklama: 'Yöneticili zincirin 4 saatlik geliri hemen' },
  { kod: 'yenile', ikon: 'yildirim', aciklama: 'Bekleyen bütün yönetici yetenekleri hemen hazır' },
]

export function kur(B, govde) {
  const urunler = Magaza.URUNLER
  govde.innerHTML = `<div class="dk">
    <section class="dk-panel dk-gunluk"><h3>${ikon('hediye')}Günlük Hediye<small class="dk-gun-sure"></small></h3>
      <div class="dk-gunler">${A.GUNLUK_HEDIYE.map((h, i) => `<div class="dk-gun" data-i="${i}"><small>${i + 1}. gün</small>${ikon(HEDIYE_IKON[h.tur] || 'hediye')}<span>${h.metin}</span></div>`).join('')}</div>
      <button class="btn btn-yesil dk-al" data-eylem="dk-gunluk">Hediyeyi Al</button></section>
    <section class="dk-panel"><h3>${ikon('elmas')}Ücretsiz Elmas</h3>
      <div class="dk-satir"><div><b>Reklam izle, 5 elmas kazan</b><small class="dk-reklam-kalan"></small></div>
      <button class="btn btn-mavi" data-eylem="dk-reklam">${ikon('oynat')}<span>İzle</span></button></div></section>
    <section class="dk-panel"><h3>${ikon('yildirim')}Güçlendirmeler</h3>
      ${GUC.map((g) => `<div class="dk-satir" data-guc="${g.kod}"><i class="dk-ikon">${ikon(g.ikon)}</i><div><b>${A.ELMAS_HARCAMA[g.kod].metin}</b><small>${g.aciklama}</small><small class="dk-ek sayi"></small></div>
        <button class="btn btn-turuncu" data-eylem="dk-guc" data-kod="${g.kod}">${ikon('elmas')}<span class="sayi">${A.ELMAS_HARCAMA[g.kod].elmas}</span></button></div>`).join('')}</section>
    <section class="dk-panel dk-paketler"><h3>${ikon('magaza')}Elmas Paketleri</h3>
      ${urunler.map((u) => `<div class="dk-satir dk-urun${u.id === 'baslangic' ? ' teklif' : ''}" data-urun="${u.id}"><i class="dk-ikon">${ikon(u.tur === 'elmas' ? 'elmas' : u.id === 'altin_kazma' ? 'kazma' : u.id === 'reklamsiz' ? 'oynat' : 'hediye')}</i>
        <div><b>${u.ad}${u.etiket ? ` <em>${u.etiket}</em>` : ''}</b><small>${u.ne || (u.n ? u.n + ' elmas' : '')}</small></div>
        <button class="btn btn-yesil" data-eylem="dk-urun" data-id="${u.id}"><span class="sayi">${Magaza.fiyat(u)}</span></button></div>`).join('')}
      <p class="sayfa-not dk-not"></p></section>
  </div>`
  const q = (s) => govde.querySelector(s)
  const el = {
    gunler: [...govde.querySelectorAll('.dk-gun')], gunAl: q('.dk-al'), gunSure: q('.dk-gun-sure'),
    reklamKalan: q('.dk-reklam-kalan'), reklamBtn: q('[data-eylem="dk-reklam"]'),
    guc: [...govde.querySelectorAll('[data-guc]')].map((x) => ({ el: x, kod: x.dataset.guc, btn: x.querySelector('button'), ek: x.querySelector('.dk-ek') })),
    urunler: [...govde.querySelectorAll('[data-urun]')].map((x) => ({ el: x, id: x.dataset.urun, btn: x.querySelector('button') })),
    not: q('.dk-not'),
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
      const gizli = u.id === 'baslangic' && d.oyuncu.lv < 5
      gizle(u.el, gizli)
      u.btn.disabled = sahip
      if (sahip) yaz(u.btn.firstElementChild, 'Alındı')
    }
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
