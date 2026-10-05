// Paket A: olay listesi ve yalnızca arayüz içi (C ↔ D) veriyolu. DOM yok.

// Benzetim olaylarının biriktiği dizi; çağıran her karede boşaltır (olaylar.length = 0)
export function yeniOlayListesi() {
  return []
}

const dinleyiciler = new Map()

export const Veriyolu = {
  // Dinleyici ekler; kaldırmak için dönen işlevi çağır
  dinle(tip, fn) {
    let l = dinleyiciler.get(tip)
    if (!l) { l = []; dinleyiciler.set(tip, l) }
    l.push(fn)
    return () => {
      const i = l.indexOf(fn)
      if (i >= 0) l.splice(i, 1)
    }
  },
  // olay = { tip, ... }; kolaylık için yayinla(tip, veri) de kabul edilir
  yayinla(olay, veri) {
    if (typeof olay === 'string') olay = { tip: olay, ...(veri || {}) }
    const l = dinleyiciler.get(olay.tip)
    if (!l) return
    for (const fn of l.slice()) {
      try { fn(olay) } catch (h) { console.error(h) }
    }
  },
}
