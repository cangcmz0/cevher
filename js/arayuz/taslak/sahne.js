// Paket C önizleme taslağı: js/sahne/sahne.js (B) gelene kadar düz renkli bir yer tutucu.
// Arayüz katmanını sınamak için yeterli: yüzey, satırlar, kuyu, DEPO. Oyunda kullanılmaz.
import { yerlesim } from '../../yerlesim.js'

let ctx = null, tuval = null, efektTuval = null, W = 390, H = 600, dpr = 1, son = { kaydirY: 0 }
const parcalar = []

function bolge(d) { return d.bolgeler[d.aktifBolge] }

export const Sahne = {
  async kur({ tuval: t, efektTuval: e }) { tuval = t; efektTuval = e; ctx = t.getContext('2d', { alpha: false }) },
  boyutla({ gen, yuk, dpr: p }) {
    W = gen; H = yuk; dpr = Math.min(p || 1, 2)
    tuval.width = Math.round(gen * dpr); tuval.height = Math.round(yuk * dpr)
    if (efektTuval) { efektTuval.width = efektTuval.clientWidth * dpr; efektTuval.height = efektTuval.clientHeight * dpr }
  },
  ciz(d, g) {
    if (!ctx || !g.gorunur) return
    son = g
    const y = yerlesim(W), b = bolge(d), acik = b.madenler.length
    ctx.setTransform(dpr, 0, 0, dpr, 0, -g.kaydirY * dpr)
    // yüzey
    let gr = ctx.createLinearGradient(0, 0, 0, 128)
    gr.addColorStop(0, '#7EC8E3'); gr.addColorStop(0.35, '#BFE6F2'); gr.addColorStop(0.45, '#F3E3C3'); gr.addColorStop(0.5, '#2E6A78'); gr.addColorStop(0.78, '#23535E'); gr.addColorStop(0.8, '#6DAA3F'); gr.addColorStop(0.84, '#3E8A4A'); gr.addColorStop(0.86, '#6B3F22'); gr.addColorStop(1, '#4A2E1C')
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, 128)
    ctx.fillStyle = '#4F8FA0'; ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(W * 0.25, 20, W * 0.5, 58); ctx.quadraticCurveTo(W * 0.75, 30, W, 60); ctx.lineTo(W, 64); ctx.lineTo(0, 64); ctx.fill()
    ctx.fillStyle = '#C4553B'; ctx.fillRect(y.sagX - 18, 70, W - y.sagX + 18, 34); ctx.fillStyle = '#8E3426'; ctx.fillRect(y.sagX - 22, 62, W - y.sagX + 22, 10)
    ctx.strokeStyle = '#6E7A86'; ctx.lineWidth = 3; ctx.strokeRect(y.kuyuX - 4, 18, y.kuyuG + 8, 90)
    // satırlar
    for (let i = 0; i <= Math.min(acik, 11); i++) {
      const sy = y.satirY(i)
      if (sy > g.kaydirY + H + 64 || sy + 128 < g.kaydirY - 64) continue
      gr = ctx.createLinearGradient(0, sy, 0, sy + 128)
      gr.addColorStop(0, '#4A2E1C'); gr.addColorStop(0.6, '#3A2416'); gr.addColorStop(1, '#2A1A10')
      ctx.fillStyle = gr; ctx.fillRect(0, sy, W, 128)
      if (i < acik) {
        gr = ctx.createRadialGradient(y.odaX + y.odaG / 2, sy + 96, 4, y.odaX + y.odaG / 2, sy + 70, y.odaG * 0.8)
        gr.addColorStop(0, '#6B4425'); gr.addColorStop(1, '#1A0F0A')
        ctx.fillStyle = gr; ctx.fillRect(y.odaX, sy + 8, y.odaG, 112)
        ctx.fillStyle = '#8A5A32'; ctx.fillRect(y.odaX, sy + 4, y.odaG, 8); ctx.fillRect(y.odaX, sy + 100, y.odaG, 8)
        ctx.fillStyle = '#FFC873'; ctx.beginPath(); ctx.arc(y.odaX + y.odaG * 0.25, sy + 22, 3.5, 0, 7); ctx.arc(y.odaX + y.odaG * 0.75, sy + 22, 3.5, 0, 7); ctx.fill()
        ctx.fillStyle = '#F2B632'; ctx.fillRect(y.odaX + y.odaG * 0.2, sy + 66, 12, 30); ctx.fillRect(y.odaX + y.odaG * 0.5, sy + 66, 12, 30)
        ctx.fillStyle = '#6E7A86'; ctx.fillRect(y.odaX + y.odaG * 0.7, sy + 80, 28, 16); ctx.fillStyle = '#1F2326'; ctx.fillRect(y.odaX + y.odaG * 0.7 + 3, sy + 74, 22, 8)
      } else {
        ctx.fillStyle = '#2A1A10'; ctx.fillRect(y.odaX, sy + 8, y.odaG, 112)
      }
    }
    ctx.fillStyle = '#1A1410'; ctx.fillRect(y.kuyuX, 104, y.kuyuG, acik * 128 + 24)
    ctx.fillStyle = '#A9B4BE'; ctx.fillRect(y.kuyuX + 3, 104, 3, acik * 128 + 24); ctx.fillRect(y.kuyuX + y.kuyuG - 6, 104, 3, acik * 128 + 24)
    ctx.fillStyle = '#6E7A86'; ctx.fillRect(y.kuyuX + 2, 150, y.kuyuG - 4, 44)
    ctx.fillStyle = '#B8432F'; ctx.fillRect(y.sagX - 8, 106, W - y.sagX + 8, 14)
    ctx.fillStyle = '#8A5A32'; ctx.fillRect(y.sagX - 4, 120, W - y.sagX + 4, 104)
    ctx.fillStyle = '#F6C453'; ctx.fillRect(y.sagX + 4, 126, y.sagG - 12, 12)
    const bit = y.dunyaH(acik) - 96
    gr = ctx.createLinearGradient(0, bit, 0, bit + 96); gr.addColorStop(0, '#2A1A10'); gr.addColorStop(1, '#071B18')
    ctx.fillStyle = gr; ctx.fillRect(0, bit, W, 96)
  },
  olaylar() {},
  isabet() { return null },
  ekranKonumu(capa, d) {
    const y = yerlesim(W), b = bolge(d), r = tuval.getBoundingClientRect(), k = tuval.closest('#oyun').getBoundingClientRect()
    const ox = r.left - k.left, oy = r.top - k.top - (son.kaydirY || 0)
    if (capa === 'asansor') return { x: ox + y.kuyuX + y.kuyuG / 2, y: oy + 172 }
    if (capa === 'depo') return { x: ox + y.sagX + y.sagG / 2 - 4, y: oy + 170 }
    if (capa === 'satis') return { x: ox + y.sagX, y: oy + 86 }
    const i = +String(capa).slice(1)
    if (!(i < b.madenler.length)) return null
    return { x: ox + y.odaX + y.odaG / 2, y: oy + y.satirY(i) + 64 }
  },
  bolgeRozeti(kod, c) {
    const x = c.getContext('2d'), w = c.width, h = c.height
    let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7EC8E3'); g.addColorStop(0.55, '#BFE6F2'); g.addColorStop(0.56, '#2E6A78'); g.addColorStop(1, '#23535E')
    x.fillStyle = g; x.fillRect(0, 0, w, h)
    x.fillStyle = '#4F8FA0'; x.beginPath(); x.moveTo(0, h * 0.56); x.lineTo(w * 0.3, h * 0.22); x.lineTo(w * 0.55, h * 0.56); x.fill()
    x.fillStyle = '#3E8A4A'; x.beginPath(); x.ellipse(w * 0.15, h, w * 0.3, h * 0.25, 0, 0, 7); x.fill()
    x.fillStyle = '#5A4A3A'; x.fillRect(w * 0.55, h * 0.7, w * 0.3, h * 0.08)
    x.fillStyle = '#FFFFFF'; x.fillRect(w * 0.64, h * 0.3, w * 0.1, h * 0.4)
    x.fillStyle = '#C4553B'; x.fillRect(w * 0.64, h * 0.4, w * 0.1, h * 0.07); x.fillRect(w * 0.64, h * 0.55, w * 0.1, h * 0.07); x.fillRect(w * 0.62, h * 0.24, w * 0.14, h * 0.07)
  },
  portre(tohum, nadirlik, c) {
    const x = c.getContext('2d'), w = c.width, h = c.height
    x.clearRect(0, 0, w, h)
    let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2C4A44'); g.addColorStop(1, '#143C36')
    x.fillStyle = g; x.fillRect(0, 0, w, h)
    x.fillStyle = '#2F5FA8'; x.beginPath(); x.ellipse(w / 2, h * 1.02, w * 0.42, h * 0.32, 0, 0, 7); x.fill()
    x.fillStyle = tohum % 2 ? '#E8B48A' : '#C98F64'; x.beginPath(); x.arc(w / 2, h * 0.56, w * 0.22, 0, 7); x.fill()
    x.fillStyle = ['#E8ECEF', '#4A90E2', '#F6C453'][nadirlik] || '#E8ECEF'
    x.beginPath(); x.arc(w / 2, h * 0.47, w * 0.25, Math.PI, 0); x.fill(); x.fillRect(w * 0.2, h * 0.45, w * 0.6, h * 0.06)
    x.fillStyle = '#4A2E1C'; if (tohum % 3) x.fillRect(w * 0.4, h * 0.66, w * 0.2, h * 0.035)
    x.fillStyle = '#2B1D12'; x.fillRect(w * 0.4, h * 0.56, w * 0.04, h * 0.04); x.fillRect(w * 0.56, h * 0.56, w * 0.04, h * 0.04)
  },
  efekt: {
    patlat(x, y, tur, adet = 12) { parcalar.push({ x, y, tur, adet, t: performance.now() }) },
    kare() {},
  },
  bellek: () => 0,
}
export default Sahne
