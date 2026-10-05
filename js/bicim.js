// Paket A: sayı ve süre biçimleri (TASARIM §4.12). Saf; ondalık ayırıcı virgül, binlik nokta.

export const EKLER = Object.freeze(['', 'bin', 'mn', 'mr', 'tn', 'kt', 'kn'])
const HARFLER = 'abcdefghijklmnopqrstuvwxyz'

// e >= EKLER.length için 'aa', 'ab', ..., 'az', 'ba', ...
export function ek(e) {
  if (e < EKLER.length) return EKLER[e]
  const k = e - EKLER.length
  return HARFLER[Math.floor(k / 26) % 26] + HARFLER[k % 26]
}

// Tek ondalığa keser (yuvarlamaz), ',0' atılır
function tekOndalik(v) {
  const t = Math.floor(v * 10 + 1e-7)
  const tam = Math.floor(t / 10), ond = t % 10
  return ond ? tam + ',' + ond : String(tam)
}

export function bicim(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0'
  if (!Number.isFinite(n)) return n < 0 ? '-∞' : '∞'
  if (n < 0) return '-' + bicim(-n)
  if (n < 10) return tekOndalik(n)
  if (n < 1000) return String(Math.floor(n))
  let e = Math.floor(Math.log10(n) / 3)
  let v = n / Math.pow(1000, e)
  if (v >= 1000 - 1e-9) { e++; v = n / Math.pow(1000, e) }
  else if (v < 1) { e--; v = n / Math.pow(1000, e) }
  return tekOndalik(v) + ' ' + ek(e)
}

export const oran = (n) => bicim(n) + '/sn'
export const gelirOran = (n) => '+' + oran(n)

export function tam(n) {
  if (!Number.isFinite(n)) return bicim(n)
  const isaret = n < 0 ? '-' : ''
  const s = String(Math.floor(Math.abs(n)))
  let cikti = ''
  for (let i = 0; i < s.length; i++) {
    if (i && (s.length - i) % 3 === 0) cikti += '.'
    cikti += s[i]
  }
  return isaret + cikti
}

export const yuzde = (x) => '%' + Math.round(x * 100)

// '+%12' / '-%3' / '%0' (|N| < 1)
export function artiYuzde(x) {
  const n = Math.round(x * 100)
  if (n >= 1) return '+%' + n
  if (n <= -1) return '-%' + -n
  return '%0'
}

// '45 sn' | '12 dk' | '2 sa 15 dk' | '1 gün 3 sa'
export function sure(sn) {
  sn = Math.max(0, Math.floor(sn || 0))
  if (sn < 60) return sn + ' sn'
  if (sn < 3600) return Math.floor(sn / 60) + ' dk'
  if (sn < 86400) {
    const sa = Math.floor(sn / 3600), dk = Math.floor((sn % 3600) / 60)
    return dk ? `${sa} sa ${dk} dk` : `${sa} sa`
  }
  const gun = Math.floor(sn / 86400), sa = Math.floor((sn % 86400) / 3600)
  return sa ? `${gun} gün ${sa} sa` : `${gun} gün`
}

// Geri sayım: 'm:ss' ya da 'h:mm:ss' (yukarı yuvarlanır, sıfıra tam varır)
export function sayac(sn) {
  sn = Math.max(0, Math.ceil((sn || 0) - 1e-9))
  const sa = Math.floor(sn / 3600), dk = Math.floor((sn % 3600) / 60), s = sn % 60
  const ss = String(s).padStart(2, '0')
  return sa ? `${sa}:${String(dk).padStart(2, '0')}:${ss}` : `${dk}:${ss}`
}
