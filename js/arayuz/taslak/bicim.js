// Paket C önizleme taslağı: js/bicim.js gelene kadar §4.12'nin birebir kopyası.
// Oyunda kullanılmaz; arayuz-onizleme.html yalnız gerçek dosya yoksa bunu bağlar.
const EKLER = ['', 'bin', 'mn', 'mr', 'tn', 'kt', 'kn']
const HARF = 'abcdefghijklmnopqrstuvwxyz'
function ek(e) {
  if (e < EKLER.length) return EKLER[e]
  const k = e - EKLER.length
  return HARF[Math.floor(k / 26) % 26] + HARF[k % 26]
}
const virgul = (s) => s.replace('.', ',')
export function bicim(n) {
  if (!isFinite(n)) return '∞'
  if (n < 0) return '-' + bicim(-n)
  if (n < 10) return virgul((Math.floor(n * 10) / 10).toFixed(1)).replace(',0', '')
  if (n < 1000) return String(Math.floor(n))
  let e = Math.floor(Math.log10(n) / 3)
  let v = n / Math.pow(1000, e)
  if (v >= 1000) { e++; v /= 1000 }
  const t = Math.floor(v * 10) / 10
  return virgul(t.toFixed(1)).replace(',0', '') + ' ' + ek(e)
}
export const oran = (n) => bicim(n) + '/sn'
export const tam = (n) => Math.floor(n).toLocaleString('tr-TR')
export const yuzde = (x) => '%' + Math.round(x * 100)
export const artiYuzde = (x) => (x < 0 ? '-%' : '+%') + Math.abs(Math.round(x * 100))
export function sure(sn) {
  sn = Math.max(0, Math.floor(sn))
  if (sn < 60) return sn + ' sn'
  if (sn < 3600) return Math.floor(sn / 60) + ' dk'
  if (sn < 86400) { const s = Math.floor(sn / 3600), d = Math.floor((sn % 3600) / 60); return d ? s + ' sa ' + d + ' dk' : s + ' sa' }
  const g = Math.floor(sn / 86400), s = Math.floor((sn % 86400) / 3600)
  return s ? g + ' gün ' + s + ' sa' : g + ' gün'
}
export function sayac(sn) {
  sn = Math.max(0, Math.ceil(sn))
  const s = Math.floor(sn / 3600), d = Math.floor((sn % 3600) / 60), n = sn % 60
  const iki = (x) => (x < 10 ? '0' : '') + x
  return s ? s + ':' + iki(d) + ':' + iki(n) : d + ':' + iki(n)
}
