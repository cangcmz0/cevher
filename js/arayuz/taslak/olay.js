// Paket C önizleme taslağı: js/olay.js gelene kadar (§6.4).
export function yeniOlayListesi() { return [] }
const dinleyiciler = {}
export const Veriyolu = {
  dinle(tip, fn) { (dinleyiciler[tip] ||= []).push(fn) },
  yayinla(olay) { const l = dinleyiciler[olay.tip]; if (l) for (const fn of l) fn(olay) },
}
