// Paket A: çevrimdışı kazanç ve saat bekçisi (TASARIM §3.4). Saf; DOM yok.

import { CEVRIMDISI_SINIR_SAAT, CEVRIMDISI_EN_AZ, SAAT_TOLERANS_MS } from './ayar.js'
import { otoGelir, ar, yoneticiBul } from './ekonomi.js'

// Yöneticisi olmayan istasyon var mı (asansör, depo ya da açık bir maden)
export function eksikYoneticiVar(b) {
  if (!yoneticiBul(b, 'asansor') || !yoneticiBul(b, 'depo')) return true
  for (let i = 0; i < b.madenler.length; i++) if (!yoneticiBul(b, 'm' + i)) return true
  return false
}

// -> { gecen, t, miktar, sinirli, geriAlindi, eksikYonetici, simdi }
export function hesapla(durum, simdiMs = Date.now()) {
  const geriAlindi = simdiMs < (durum.enGec || 0) - SAAT_TOLERANS_MS
  const gecen = geriAlindi ? 0 : Math.max(0, (simdiMs - (durum.son || simdiMs)) / 1000)
  const sinir = (CEVRIMDISI_SINIR_SAAT + ar(durum, 'gece')) * 3600
  const t = Math.min(gecen, sinir)
  const b = durum.bolgeler[durum.aktifBolge]
  const gelir = otoGelir(durum, b)
  const ortak = Math.max(0, Math.min(t, (durum.takviye ? durum.takviye.bitis : 0) - durum.zaman))
  const miktar = gelir * (t + ortak)
  return {
    gecen, t, miktar: Number.isFinite(miktar) ? miktar : 0, sinirli: gecen > sinir, geriAlindi,
    eksikYonetici: eksikYoneticiVar(b), simdi: simdiMs,
  }
}

// Saati ilerletir, kazancı bekleyen olarak yazar (para toplanınca verilir)
export function uygula(durum, sonuc) {
  const s = sonuc
  durum.zaman += s.gecen
  if (s.gecen >= CEVRIMDISI_EN_AZ && s.miktar > 0) {
    const bc = durum.bekleyenCevrimdisi
    if (bc && bc.bolge === durum.aktifBolge) {
      bc.miktar += s.miktar
      bc.sure += s.gecen
      bc.sinirli = bc.sinirli || s.sinirli
    } else {
      durum.bekleyenCevrimdisi = { bolge: durum.aktifBolge, miktar: s.miktar, sure: s.gecen, sinirli: s.sinirli }
    }
  }
  const simdi = s.simdi || Date.now()
  durum.enGec = Math.max(durum.enGec || 0, simdi)
  if (!s.geriAlindi) durum.son = simdi
  if (durum.calisma) durum.calisma.kirli = true
  return durum
}
