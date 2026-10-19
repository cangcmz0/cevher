// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  PROFİL ve BAŞARIMLAR (§10) — avatar düğmesi profil sayfasını açar:
//  oyuncu özeti, ömür boyu istatistikler ve kademeli başarımlar.
//  • Alınabilir başarım varken avatarın köşesinde kırmızı nokta.
//  • Yeni kademe geçilince bildirim; ödül alınınca elmaslar sayaca uçar.
// ════════════════════════════════════════════════════════════════
import { ikon } from './ikonlar.js'
import { A, E, yaz, bicim, gizle } from './ortak.js'
import { basarimIlerleme, basarimDeger } from '../benzetim.js'

const tamSayi = (n) => Math.floor(n).toLocaleString('tr-TR')
const hedefYazi = (t, n) => (t.buyuk ? bicim(n) : tamSayi(n))
const yildiz = (k, n) => '<span class="bs-yildiz">' + Array.from({ length: n }, (_, i) => `<i class="${i < k ? 'dolu' : ''}">${ikon('yildiz')}</i>`).join('') + '</span>'

export function kur(B) {
  const P = B.pencere
  const avatar = B.kok.querySelector('.ust-avatar')
  const nokta = document.createElement('i')
  nokta.className = 'ust-avatar-nokta'
  nokta.hidden = true
  avatar.after(nokta)

  B.eylemler.avatar = () => P.ac('profil')

  P.kaydet('profil', (g) => {
    g.innerHTML = `<div class="pr-ust"><img class="pr-avatar" src="img/ref/avatar.png" alt="" draggable="false">
        <div><h2>Maden Patronu</h2><small class="pr-alt"></small></div></div>
      <div class="pr-istatistik"></div>
      <h3 class="pr-baslik">${ikon('madalya')}<span>Başarımlar</span><small class="pr-say sayi"></small></h3>
      <div class="bs-liste"></div>`
    const alt = g.querySelector('.pr-alt'), ist = g.querySelector('.pr-istatistik')
    const say = g.querySelector('.pr-say'), liste = g.querySelector('.bs-liste')
    let imza = ''
    return (d) => {
      const o = d.oyuncu
      yaz(alt, `Seviye ${o.lv} · ${Object.keys(d.bolgeler).length} bölge${d.prestij.sv ? ' · ' + (d.prestij.sv + 1) + '. nesil' : ''}`)
      const s = d.istatistik
      const satirlar = [
        ['para', 'Toplam kazanç', bicim(basarimDeger(d, 'kazanc'))],
        ['yukari', 'Yükseltme', tamSayi(s.yukseltme)],
        ['sepet', 'Satılan vagon', tamSayi(s.satis)],
        ['elmas', 'Hazine damarı', tamSayi(s.hazine || 0)],
        ['yonetici', 'Yönetici', tamSayi(basarimDeger(d, 'yonetici'))],
        ['yildirim', 'Yetenek', tamSayi(s.yetenek)],
        ['prestij', 'Miras Mührü', tamSayi(d.prestij.muhur)],
        ['madalya', 'Nesil', tamSayi(d.prestij.sv + 1)],
        ['harita', 'Açık bölge', Object.keys(d.bolgeler).length + ' / ' + A.BOLGELER.length],
      ]
      const lst = A.BASARIMLAR.map((t) => ({ t, il: basarimIlerleme(d, t) }))
      const im = satirlar.map((x) => x[2]).join('|') + '#' + lst.map((x) => x.il.kademe + ':' + Math.floor(Math.min(x.il.deger, x.il.hedef))).join('|')
      if (im === imza) return
      imza = im
      ist.innerHTML = satirlar.map(([ik, ad, v]) => `<div class="pr-kutu">${ikon(ik)}<b class="sayi">${v}</b><small>${ad}</small></div>`).join('')
      const alinan = lst.reduce((n, x) => n + x.il.kademe, 0), toplam = lst.reduce((n, x) => n + x.il.toplam, 0)
      yaz(say, `${alinan}/${toplam}`)
      // Alınabilenler üstte, bitenler en altta
      const sira = (x) => (x.il.alinabilir ? 0 : x.il.bitti ? 2 : 1)
      lst.sort((a, b) => sira(a) - sira(b) || b.il.deger / b.il.hedef - a.il.deger / a.il.hedef)
      liste.innerHTML = lst.map(({ t, il }) => {
        const n = il.kademe
        const metin = t.metin.replace('{n}', hedefYazi(t, il.hedef))
        const oran = Math.min(1, il.deger / il.hedef)
        const odul = il.bitti ? 0 : A.BASARIM_ODUL.elmas[n]
        return `<div class="bs-kart${il.alinabilir ? ' hazir' : ''}${il.bitti ? ' bitti' : ''}">
          <i class="bs-ikon">${ikon('madalya')}</i>
          <div class="ms-bilgi"><b>${t.ad} ${yildiz(n, il.toplam)}</b><small>${metin}</small>
            <div class="kt-cubuk"><i style="transform:scaleX(${oran})"></i><span class="sayi">${hedefYazi(t, Math.min(il.deger, il.hedef))} / ${hedefYazi(t, il.hedef)}</span></div></div>
          ${il.bitti ? `<span class="ms-tik">${ikon('tik')}</span>`
            : `<button class="btn ${il.alinabilir ? 'btn-yesil' : 'btn-krem'}" data-eylem="basarim-al" data-kod="${t.kod}" ${il.alinabilir ? '' : 'disabled'}>${ikon('elmas')}<span class="sayi">+${odul}</span></button>`}
        </div>`
      }).join('')
    }
  })

  B.eylemler['basarim-al'] = (btn) => {
    const s = B.eylem('basarimAl', { kod: btn.dataset.kod })
    if (!(s && s.ok)) return
    const r = btn.getBoundingClientRect(), k = B.kok.getBoundingClientRect()
    B.ucanSikke(r.left - k.left + r.width / 2, r.top - k.top + r.height / 2, Math.min(8, 3 + s.kademe), 'elmas')
    B.bildir('basari', `Başarım ödülü: +${s.elmas} elmas · +${s.xp} XP`)
  }

  function kare4(d) {
    let var_ = false
    for (const t of A.BASARIMLAR) if (basarimIlerleme(d, t).alinabilir) { var_ = true; break }
    gizle(nokta, !var_)
  }

  function olay(o) {
    if (o.tip === 'basarimHazir') B.bildir('basari', `Başarım: ${o.ad} ${o.kademe}. kademe! Ödülünü profilinden al.`)
  }

  return { kare4, olay }
}
