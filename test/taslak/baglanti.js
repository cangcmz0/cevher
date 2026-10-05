// GEÇİCİ TASLAKLAR (Paket D, 1. evre): gerçek Sahne / Arayuz / yerlesim gelene kadar
// döngü, kaydırma ve test düzeneği çalışsın diye. Entegrasyonda kaldırılır.
import { yerlesim } from '../../js/yerlesim.js'
export { yerlesim }

let ctx = null, W = 0, H = 0, oran = 1, yer = null
export const Sahne = {
  async kur({ tuval, ilerleme }) { ctx = tuval.getContext('2d', { alpha: false }); this.tuval = tuval; ilerleme?.(1) },
  boyutla({ gen, yuk, dpr }) {
    W = gen; H = yuk; oran = Math.min(dpr, 2); yer = yerlesim(W)
    this.tuval.width = Math.round(gen * oran); this.tuval.height = Math.round(yuk * oran)
  },
  ciz(d, g) {
    if (!g.gorunur || !ctx) return
    ctx.setTransform(oran, 0, 0, oran, 0, -g.kaydirY * oran)
    ctx.fillStyle = '#0F2F2A'; ctx.fillRect(0, g.kaydirY, W, H)
    ctx.fillStyle = '#7EC8E3'; ctx.fillRect(0, 0, W, 128)
    const n = d.bolgeler[d.aktifBolge].madenler.length
    for (let i = 0; i <= n && i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#3A2416' : '#4A2E1C'; ctx.fillRect(0, yer.satirY(i), W, 128)
      ctx.fillStyle = '#1A0F0A'; ctx.fillRect(yer.odaX, yer.satirY(i) + 8, yer.odaG, 112)
    }
    ctx.fillStyle = '#6E7A86'; ctx.fillRect(yer.kuyuX, 128, yer.kuyuG, n * 128)
    ctx.fillStyle = '#B8432F'; ctx.fillRect(yer.sagX, 128, yer.sagG, 100)
  },
  olaylar() {},
  isabet(x, y, d) {
    const n = d.bolgeler[d.aktifBolge].madenler.length
    for (const ist of ['asansor', 'depo', ...Array.from({ length: n }, (_, i) => 'm' + i)]) {
      const k = yer.istasyonKutusu(ist, n)
      if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return { istasyon: ist }
    }
    return null
  },
  ekranKonumu() { return null },
  bolgeRozeti() {}, portre() {},
  efekt: { patlat() {}, kare() {} },
  bellek: () => 0,
}

let kokEl = null, cb = null, kartlar = []
export const Arayuz = {
  dunya: null,
  kur(kok, s) {
    kokEl = kok; cb = s
    this.dunya = kok.querySelector('#dunya')
    const m = kok.querySelector('#maden')
    m.style.cssText = 'position:absolute;left:0;right:0;top:142px;bottom:66px;overflow:hidden'
    kok.style.cssText = 'position:fixed;inset:0;max-width:480px;margin:0 auto;overflow:hidden;background:#0F2F2A;font-family:system-ui;touch-action:none;user-select:none'
    this.dunya.style.cssText = 'position:absolute;left:0;top:0;right:0;will-change:transform'
    kok.insertAdjacentHTML('beforeend', `<header id="ust" style="position:absolute;top:0;left:0;right:0;height:74px;color:#fff;background:#143C36"><b>Zonguldak</b> <span id="t-para"></span>
      <button data-eylem="ayarlar" aria-label="Ayarlar">⚙</button></header>
      <section id="istatistik" style="position:absolute;top:78px;left:10px;right:10px;height:58px;background:#F4E8D6"></section>
      <nav id="gezinti" style="position:absolute;bottom:0;left:0;right:0;height:66px;display:flex;background:#143C36">${['maden', 'harita', 'yoneticiler', 'arastirma', 'magaza'].map((s) => `<button style="flex:1" data-sekme="${s}">${s}</button>`).join('')}</nav>
      <div id="t-modal" hidden style="position:absolute;inset:20% 10%;z-index:10;background:#F4E8D6;padding:12px"><p></p><button data-eylem="kapat">Kapat</button></div>`)
    const y = s.yerlesim(390)
    for (let i = 0; i < 12; i++) {
      this.dunya.insertAdjacentHTML('beforeend', `<div class="kart" hidden style="position:absolute;left:8px;top:${y.satirY(i) + 6}px;width:${y.kartG}px;height:116px;background:#F4E8D6;border-radius:12px"><b>Maden ${i + 1}</b><button data-eylem="yukselt" data-istasyon="m${i}" data-uzun style="display:block;width:90%">Yükselt</button></div>`)
    }
    kartlar = [...this.dunya.querySelectorAll('.kart')]
    kok.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return
      if (b.dataset.eylem === 'yukselt') this.modalAc('yukseltme', { istasyon: b.dataset.istasyon })
      else if (b.dataset.eylem === 'kapat') kok.querySelector('#t-modal').hidden = true
      else if (b.dataset.eylem === 'ayarlar') this.modalAc('ayarlar')
    })
  },
  kare(d) {
    const n = d.bolgeler[d.aktifBolge].madenler.length
    for (let i = 0; i < 12; i++) kartlar[i].hidden = i >= n
    kokEl.querySelector('#t-para').textContent = Math.floor(d.bolgeler[d.aktifBolge].para)
  },
  olaylar() {},
  modalAc(ad, veri) { const m = kokEl.querySelector('#t-modal'); m.hidden = false; m.querySelector('p').textContent = ad + ' ' + JSON.stringify(veri || {}).slice(0, 80) },
  sayfaAc() {},
  bildir(tur, metin) { console.log('[bildirim]', tur, metin) },
  dokunusHedefi(el) { return el.closest('button,.kart') ? 'ui' : null },
}
