// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Yönetici portresi (§5.4): tohuma göre ten, saç, bıyık, gözlük, kravat ve nadirliğe göre kask.
// Sahnedeki işçiler karakter.js'te çizilir.

import { dikey, radyal, elips, yuvarlakYol, kenarIsik, acik, koyu, rgba, rastgele } from './cizim.js'

const VARYANTLAR = [
  { ten: '#E8B48A', tenGolge: '#C98F68', biyik: true },
  { ten: '#C98E62', tenGolge: '#A06E4A', biyik: false },
]

// ---- Yönetici portresi (§5.4) ----
const NADIR_KASK = ['#F4F1EA', '#4A90E2', '#F6C453']
const KRAVAT = ['#C4553B', '#2F6DB8', '#1E9E55', '#A8508C', '#D9772B']
const SAC = ['#2B1D12', '#4A2E1C', '#6B4425', '#3A2416']

export function portreCiz(ctx, tohum, nadirlik, boyut) {
  const r = rastgele((tohum >>> 0) * 2654435761 + 17)
  const s = boyut / 64
  ctx.save()
  ctx.scale(s, s)
  // Zemin
  ctx.fillStyle = radyal(ctx, 30, 22, 46, ['#2A5A52', '#143C36', '#0B2622'])
  ctx.fillRect(0, 0, 64, 64)
  const ten = r() < 0.5 ? VARYANTLAR[0] : VARYANTLAR[1]
  const biyik = r() < 0.55
  const gozluk = r() < 0.2
  const kravat = r() < 0.6
  const ceketRenk = ['#3F4B57', '#2F5FA8', '#5A3620', '#23477F'][Math.floor(r() * 4)]
  const aksesuar = KRAVAT[Math.floor(r() * KRAVAT.length)]
  const sac = SAC[Math.floor(r() * SAC.length)]
  // Omuzlar ve ceket
  const govde = new Path2D()
  govde.moveTo(6, 66)
  govde.quadraticCurveTo(8, 46, 32, 44)
  govde.quadraticCurveTo(56, 46, 58, 66)
  govde.closePath()
  ctx.fillStyle = dikey(ctx, 44, 66, [acik(ceketRenk, 0.18), ceketRenk, koyu(ceketRenk, 0.3)])
  ctx.fill(govde)
  kenarIsik(ctx, govde, '#FFFFFF', 1.2, 0.25)
  // Gömlek yakası
  ctx.fillStyle = '#F4E8D6'
  const yaka = new Path2D()
  yaka.moveTo(25, 45); yaka.lineTo(32, 56); yaka.lineTo(39, 45); yaka.closePath()
  ctx.fill(yaka)
  if (kravat) {
    ctx.fillStyle = aksesuar
    const k = new Path2D()
    k.moveTo(30, 47); k.lineTo(34, 47); k.lineTo(35.5, 60); k.lineTo(32, 64); k.lineTo(28.5, 60); k.closePath()
    ctx.fill(k)
    ctx.fillStyle = koyu(aksesuar, 0.25)
    ctx.fill(elips(32, 47.5, 2.4, 1.6))
  } else {
    // Atkı
    ctx.fillStyle = dikey(ctx, 42, 52, [acik(aksesuar, 0.2), aksesuar])
    ctx.fill(yuvarlakYol(19, 42, 26, 8, 4))
    ctx.fill(yuvarlakYol(36, 46, 6, 14, 3))
  }
  // Boyun ve baş
  ctx.fillStyle = ten.tenGolge
  ctx.fillRect(27, 36, 10, 9)
  const yuz = elips(32, 28, 13, 14)
  ctx.fillStyle = radyal(ctx, 28, 23, 18, [acik(ten.ten, 0.2), ten.ten, ten.tenGolge])
  ctx.fill(yuz)
  ctx.fillStyle = ten.tenGolge
  ctx.fill(elips(19.4, 29, 2.4, 3.4))
  ctx.fill(elips(44.6, 29, 2.4, 3.4))
  // Saç (kaskın altından favori)
  ctx.fillStyle = sac
  ctx.fillRect(19.6, 22, 2.6, 7)
  ctx.fillRect(41.8, 22, 2.6, 7)
  // Gözler, kaşlar, burun, ağız
  ctx.fillStyle = '#2B1D12'
  ctx.fill(elips(27, 28, 1.5, 1.9))
  ctx.fill(elips(37, 28, 1.5, 1.9))
  ctx.fillStyle = '#FFFFFF'
  ctx.fill(elips(27.5, 27.4, 0.5, 0.5))
  ctx.fill(elips(37.5, 27.4, 0.5, 0.5))
  ctx.strokeStyle = sac
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(24, 24.2); ctx.lineTo(29.4, 23.6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(34.6, 23.6); ctx.lineTo(40, 24.2); ctx.stroke()
  ctx.fillStyle = ten.tenGolge
  ctx.fill(elips(32, 32, 2.4, 2))
  ctx.fillStyle = rgba('#E25A43', 0.22)
  ctx.fill(elips(24.5, 33, 2.6, 1.6))
  ctx.fill(elips(39.5, 33, 2.6, 1.6))
  if (biyik) {
    ctx.fillStyle = sac
    const b = new Path2D()
    b.moveTo(25.5, 36.4)
    b.quadraticCurveTo(32, 32.6, 38.5, 36.4)
    b.quadraticCurveTo(35, 37.8, 32, 36.6)
    b.quadraticCurveTo(29, 37.8, 25.5, 36.4)
    ctx.fill(b)
  } else {
    ctx.strokeStyle = koyu(ten.tenGolge, 0.4)
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(28.5, 37); ctx.quadraticCurveTo(32, 39.4, 35.5, 37); ctx.stroke()
  }
  if (gozluk) {
    ctx.strokeStyle = '#2B1D12'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(27, 28, 3.6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(37, 28, 3.6, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(30.6, 28); ctx.lineTo(33.4, 28); ctx.stroke()
  }
  // Kask (nadirliğe göre)
  const kr = NADIR_KASK[nadirlik] || NADIR_KASK[0]
  const kask = new Path2D()
  kask.moveTo(16, 22.5)
  kask.quadraticCurveTo(16, 6.5, 32, 6.5)
  kask.quadraticCurveTo(48, 6.5, 48, 22.5)
  kask.closePath()
  ctx.fillStyle = dikey(ctx, 6.5, 22.5, [acik(kr, 0.35), kr, koyu(kr, 0.22)])
  ctx.fill(kask)
  kenarIsik(ctx, kask, '#FFFFFF', 1.4, 0.55)
  ctx.fillStyle = rgba('#000000', 0.12)
  ctx.fillRect(31, 7.5, 2, 14)
  ctx.fillStyle = dikey(ctx, 20.5, 25, [acik(kr, 0.1), koyu(kr, 0.25)])
  ctx.fill(yuvarlakYol(13, 20.6, 38, 4.2, 2))
  if (nadirlik === 2) {
    // Efsanevi parlaklık
    ctx.fillStyle = rgba('#FFFFFF', 0.7)
    ctx.beginPath(); ctx.ellipse(24, 12.5, 4.5, 1.6, -0.5, 0, Math.PI * 2); ctx.fill()
  }
  // Fener
  ctx.fillStyle = '#5A5F66'
  ctx.fill(elips(32, 14.5, 4.2, 3.6))
  ctx.fillStyle = radyal(ctx, 32, 14.2, 3.4, ['#FFFFFF', '#FFE08A', '#F6C453'])
  ctx.fill(elips(32, 14.4, 3, 2.6))
  ctx.restore()
}
