// Paket C önizleme taslağı: js/ekonomi.js (A) gelene kadar §2 formüllerinin sade kopyası.
// İmzalar §6.4 ile aynı. Oyunda kullanılmaz.
import * as A from '../../ayar.js'

const tan = (d) => A.BOLGE[d.aktifBolge] || A.BOLGELER[0]
const ist = (b, s) => (s === 'asansor' ? b.asansor : s === 'depo' ? b.depo : b.madenler[+s.slice(1)])
export function kademeSayisi(L, l) { let n = 0; for (const m of l) if (L >= m) n++; return n }
export const guc = (L, l) => L * Math.pow(2, kademeSayisi(L, l))
export function kademeIlerleme(L, l) {
  if (L >= l[l.length - 1]) return 1
  let once = 0
  for (const m of l) { if (L >= m) once = m; else return (L - once) / (m - once) }
  return 1
}
export function sonrakiKademe(L, l) { for (const m of l) if (L < m) return m; return null }
function yonetici(b, s) { for (const y of b.yoneticiler) if (y.atanan === s) return y; return null }
function etkin(d, b, s, etki) {
  const y = yonetici(b, s)
  if (!y || d.zaman >= y.aktifBitis) return null
  const yt = A.YETENEKLER[y.yetenek]
  return yt && yt.etki === etki ? A.NADIRLIKLER[y.nadirlik] : null
}
export const madenUretim = (d, b, i, L = b.madenler[i].L) => Math.pow(5, i) * guc(L, A.KADEME_MADEN) * tan(d).olcek
export function madenMaliyet(d, b, i, L = b.madenler[i].L) {
  const n = etkin(d, b, 'm' + i, 'indirim')
  return 4 * Math.pow(6, i) * Math.pow(1.1, L - 1) * tan(d).zorluk * tan(d).olcek * (n ? 1 - n.indirim : 1)
}
export const madenAcilis = (d, b, i) => A.ACILIS[i] * tan(d).zorluk * tan(d).olcek
export const yiginKap = (d, b, i) => madenUretim(d, b, i) * 90
export const madenciSayisi = (L) => 1 + (L >= 10) + (L >= 50)
const hizK = (L) => Math.min(3, 1 + 0.004 * (L - 1))
export function asansorKap(d, b) { const n = etkin(d, b, 'asansor', 'kapasite'); return 20 * guc(b.asansor.L, A.KADEME_ISTASYON) * tan(d).olcek * (n ? n.carpan : 1) }
export function asansorHiz(d, b) { const n = etkin(d, b, 'asansor', 'hiz'); return hizK(b.asansor.L) * (n ? n.carpan : 1) }
export function asansorAkis(d, b) { const n = b.madenler.length; return asansorKap(d, b) / (2 * n / asansorHiz(d, b) + 0.5 * n + 0.8) }
export const tasiyiciSayisi = (L) => 1 + A.TASIYICI_ESIK.filter((m) => m <= L).length
export function tasiyiciYuk(d, b) { const n = etkin(d, b, 'depo', 'yuk'); return 20 * guc(b.depo.L, A.KADEME_ISTASYON) * tan(d).olcek * (n ? n.carpan : 1) }
export function depoYol(d, b) { const n = etkin(d, b, 'depo', 'hiz'); return 2.5 / (hizK(b.depo.L) * (n ? n.carpan : 1)) }
export const depoKap = (d, b) => 30 * 20 * guc(b.depo.L, A.KADEME_ISTASYON) * tan(d).olcek * tasiyiciSayisi(b.depo.L)
export const depoAkis = (d, b) => tasiyiciSayisi(b.depo.L) * tasiyiciYuk(d, b) / (2 * depoYol(d, b) + 1)
export function istasyonMaliyet(d, b, s, L) {
  if (s === 'asansor' || s === 'depo') return 5 * Math.pow(1.05, L - 1) * tan(d).zorluk * tan(d).olcek
  return madenMaliyet(d, b, +s.slice(1), L)
}
export const topluMaliyet = (c1, g, k) => c1 * (Math.pow(g, k) - 1) / (g - 1)
export function alinabilir(c1, g, para, ust) {
  let k = Math.floor(Math.log(para * (g - 1) / c1 + 1) / Math.log(g))
  k = Math.max(0, Math.min(ust, k))
  while (k > 0 && topluMaliyet(c1, g, k) > para) k--
  return k
}
export function teklif(d, b, s, mod) {
  const o = ist(b, s), L = o.L
  const ust = s.startsWith('m') ? A.MAKS_MADEN_SEVIYE : A.MAKS_ISTASYON_SEVIYE
  const g = s.startsWith('m') ? 1.1 : 1.05
  if (L >= ust) return { adet: 0, maliyet: 0, yeniL: L, maks: true, yetiyor: false }
  const c1 = istasyonMaliyet(d, b, s, L), kalan = ust - L
  let k = mod === 'max' ? alinabilir(c1, g, b.para, kalan) : Math.min(mod, kalan)
  if (k === 0) k = 1
  const maliyet = topluMaliyet(c1, g, k)
  return { adet: k, maliyet, yeniL: L + k, maks: L + k >= ust, yetiyor: b.para >= maliyet }
}
export const kiralamaMaliyeti = (d, b, tip) => A.KIRALAMA_TABAN[tip] * Math.pow(6, b.kiralanan[tip] || 0) * tan(d).zorluk * tan(d).olcek
export function uretimCarpani(d, b, i, yetenekli = true) { const n = yetenekli && etkin(d, b, 'm' + i, 'uretim'); return n ? n.carpan : 1 }
export const satisKalici = (d) => (1 + 0.02 * (d.oyuncu.lv - 1)) * (d.satin.altinKazma ? 2 : 1)
export const satisCarpani = (d) => satisKalici(d) * (d.takviye.bitis > d.zaman ? 2 : 1)
export function kapasiteler(d, b) {
  let P = 0
  b.madenler.forEach((m, i) => { P += madenUretim(d, b, i) * uretimCarpani(d, b, i) })
  return { P, A: asansorAkis(d, b), D: depoAkis(d, b) }
}
export function otoGelir(d, b) { const k = kapasiteler(d, b); return Math.min(k.P, k.A, k.D) * satisKalici(d) }
export function toplamUretim(d, b) { let P = 0; b.madenler.forEach((m, i) => { P += madenUretim(d, b, i) }); return P * satisKalici(d) }
export const xpGerek = (L) => Math.round(100 * L * Math.pow(1.03, Math.max(0, L - 12)))
export function yetenekDurum(d, y) {
  const n = A.NADIRLIKLER[y.nadirlik]
  if (d.zaman < y.aktifBitis) return { durum: 'aktif', kalan: y.aktifBitis - d.zaman, oran: (y.aktifBitis - d.zaman) / n.sure }
  if (d.zaman < y.hazirZaman) return { durum: 'bekleme', kalan: y.hazirZaman - d.zaman, oran: (y.hazirZaman - d.zaman) / n.bekleme }
  return { durum: 'hazir', kalan: 0, oran: 0 }
}
