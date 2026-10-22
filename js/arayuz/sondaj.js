// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  SONDAJ — sert kaya penceresi (Idle Miner Tycoon'daki bariyer).
//  • Her 5 katta bir yeni katın önünde sert kaya durur; sondaj para ve
//    süre ister, süre oyun saatiyle (çevrimdışı da) işler.
//  • Hızlandırma: ödüllü reklam −15 dk (en çok 2), elmasla hemen bitir.
//  • Kilitli kat kartındaki "Del" / "Hızlandır" düğmesi açar.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { E, A, yaz, sinif, gizle, cubuk, bicim, sayac, sure, bolgeAl, simge, simgeleriCiz } from './ortak.js'
import { hizlandirmaElmas } from '../benzetim.js'

export function kur(B) {
  B.pencere.kaydet('sondaj', (g) => {
    g.innerHTML = `<div class="sj-ust">${simge('matkap', '', 64)}<div><h2 class="sj-baslik">Sert Kaya</h2><small>Her beş katta bir sert kaya katmanı çıkar.</small></div></div>
      <p class="sj-metin"></p>
      <div class="ot-satirlar"><div class="ot-satir"><span>Süre</span><b class="sj-sure"></b></div>
        <div class="ot-satir"><span>Bedel</span><b class="sayi sj-bedel"></b></div></div>
      <div class="kt-cubuk sj-cubuk" hidden><i></i><span class="sayi"></span></div>
      <div class="modal-dugmeler sj-dugmeler">
        <button class="btn btn-yesil sj-basla" data-eylem="sondaj-basla">${ikon('para')}<span class="sayi">Sondaja Başla</span></button>
        <button class="btn btn-krem sj-reklam" data-eylem="sondaj-reklam">${ikon('oynat')}<span>−15 dk</span></button>
        <button class="btn btn-mavi sj-bitir" data-eylem="sondaj-bitir">${ikon('elmas')}<span class="sayi"></span></button>
      </div>
      <button class="btn btn-krem modal-kapat-btn" data-eylem="modal-kapat">Kapat</button>`
    simgeleriCiz(g, B)
    const q = (s) => g.querySelector(s)
    const el = {
      baslik: q('.sj-baslik'), metin: q('.sj-metin'), sure: q('.sj-sure'), bedel: q('.sj-bedel'),
      cubuk: q('.sj-cubuk'), cubukI: q('.sj-cubuk i'), cubukYazi: q('.sj-cubuk span'),
      basla: q('.sj-basla'), baslaYazi: q('.sj-basla span'), reklam: q('.sj-reklam'), bitir: q('.sj-bitir'), bitirYazi: q('.sj-bitir span'),
    }
    let kapaniyor = false
    return (d) => {
      const b = bolgeAl(d)
      const n = b.madenler.length
      const sj = b.sondaj
      // Kaya delindiyse pencere kendiliğinden kapanır (bildirim kartlar.js'te)
      if (n >= A.MADEN_SAYISI || !E.kayaVar(b, n)) {
        if (!kapaniyor) { kapaniyor = true; setTimeout(() => { if (B.pencere.acikModal() === 'sondaj') B.pencere.kapatModal() }, 0) }
        return
      }
      const katAdi = (n + 1) + '. Kat'
      yaz(el.baslik, 'Sert Kaya · ' + katAdi)
      const ss = E.sondajSuresi(d, b, n)
      const tecrube = ss < A.KAYA.sure[Math.min(E.kayaNo(n), A.KAYA.sure.length - 1)]
      yaz(el.metin, sj ? 'Sondaj makinesi çalışıyor. Sen yokken de deler; bitince ' + katAdi + ' açılabilir.'
        : 'Kazmayla geçilmiyor. Sondaj makinesi kayayı delince ' + katAdi + ' açılabilir.' + (tecrube ? ' Ekibin bu kayayı daha önce deldi: çok daha hızlı biter.' : ''))
      yaz(el.sure, sure(sj ? sj.sure : ss) + (tecrube ? ' · tecrübeli ekip' : ''))
      const bedel = E.sondajMaliyet(d, b, n)
      yaz(el.bedel, sj ? 'Ödendi' : bicim(bedel))
      gizle(el.cubuk, !sj)
      gizle(el.basla, !!sj)
      gizle(el.reklam, !sj)
      gizle(el.bitir, !sj)
      if (sj) {
        const kalan = Math.max(0, sj.bitis - d.zaman)
        cubuk(el.cubukI, sj.sure > 0 ? 1 - kalan / sj.sure : 1)
        yaz(el.cubukYazi, 'Kalan ' + sayac(kalan))
        const elmas = hizlandirmaElmas(kalan)
        yaz(el.bitirYazi, 'Bitir · ' + elmas)
        el.bitir.disabled = d.oyuncu.elmas < elmas
        el.reklam.disabled = sj.reklam >= A.KAYA.reklamHak
        yaz(el.reklam.lastElementChild, `−15 dk (${A.KAYA.reklamHak - sj.reklam}/${A.KAYA.reklamHak})`)
      } else {
        yaz(el.baslaYazi, 'Sondaja Başla · ' + bicim(bedel))
        el.basla.disabled = b.para < bedel
        sinif(el.basla, 'nabiz', b.para >= bedel)
      }
    }
  }, 'modal')

  const tazele = () => B.pencere.kare4(B.durumAl())
  B.eylemler['sondaj-basla'] = () => {
    const r = B.eylem('sondajBaslat', {})
    if (r && r.ok) B.bildir('basari', `Sondaj başladı · ${sure(r.sure)}`)
    else if (r && r.sebep === 'para') B.bildir('bilgi', 'Yetersiz para')
    tazele()
  }
  B.eylemler['sondaj-bitir'] = () => {
    const r = B.eylem('sondajHizlandir', { yontem: 'elmas' })
    if (r && !r.ok && r.sebep === 'elmas') B.bildir('bilgi', 'Yetersiz elmas')
    tazele()
  }
  B.eylemler['sondaj-reklam'] = async () => {
    let ok = false
    try { ok = await B.reklamIzle('sondaj') } catch { ok = false }
    if (ok) B.eylem('sondajHizlandir', { yontem: 'reklam' })
    tazele()
  }
  return {}
}
