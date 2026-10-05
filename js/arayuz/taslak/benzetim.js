// Paket C önizleme taslağı: js/benzetim.js (A) gelene kadar kaba bir eylem/adım kopyası.
// Yalnız arayüzü sürmek için: zincir benzetimi yok, gelir otoGelir'den akar.
import * as A from '../../ayar.js'
import * as E from '../../ekonomi.js'

export const ADIM = 0.05
const bolge = (d) => d.bolgeler[d.aktifBolge]
const kayit = (b, s) => (s === 'asansor' ? b.asansor : s === 'depo' ? b.depo : b.madenler[+s.slice(1)])

export function hazirla(d) {
  const b = bolge(d)
  d.calisma = {
    bolge: d.aktifBolge,
    madenler: b.madenler.map(() => ({ calisiyor: true, dolu: false })),
    asansor: { durum: 'bekle', konum: 0, onceki: 0, hedef: 0, t: 0, yuk: 0, durak: -1 },
    tasiyicilar: [], gelirEma: E.otoGelir(d, b), uretimGecmis: new Float64Array(10),
    darbogaz: null, darbogazSayac: {}, sonKayit: 0, kirli: false,
  }
  d.calisma.uretimGecmis.fill(E.toplamUretim(d, b) / 1.12)
}

function xpVer(d, miktar, olaylar) {
  const o = d.oyuncu
  o.xp += miktar; o.toplamXp += miktar
  olaylar.push({ tip: 'xp', miktar })
  while (o.lv < A.MAKS_SEVIYE && o.xp >= E.xpGerek(o.lv)) {
    o.xp -= E.xpGerek(o.lv); o.lv++
    const elmas = 5 + o.lv
    o.elmas += elmas
    olaylar.push({ tip: 'seviyeAtladi', lv: o.lv, elmas, acilan: A.ACILIMLAR[o.lv] || [] })
  }
}

export function adim(d, dt, olaylar) {
  d.zaman += dt
  const b = bolge(d), c = d.calisma
  const gelir = E.otoGelir(d, b) * (d.takviye.bitis > d.zaman ? 2 : 1)
  b.para += gelir * dt
  c.gelirEma += (gelir - c.gelirEma) * (dt / 10)
  for (const y of b.yoneticiler) {
    if (y.aktifBitis && d.zaman >= y.aktifBitis && d.zaman - dt < y.aktifBitis) olaylar.push({ tip: 'yetenekBitti', istasyon: y.atanan })
  }
}

export function eylem(d, ad, v = {}, olaylar = []) {
  const b = bolge(d)
  switch (ad) {
    case 'yukselt': {
      const t = E.teklif(d, b, v.istasyon, v.adet ?? d.alimModu)
      if (t.adet === 0) return { ok: false, sebep: 'maks' }
      if (!t.yetiyor) return { ok: false, sebep: 'para' }
      const k = kayit(b, v.istasyon), eskiL = k.L
      b.para -= t.maliyet; k.L = t.yeniL
      const liste = v.istasyon.startsWith('m') ? A.KADEME_MADEN : A.KADEME_ISTASYON
      const kademeler = liste.filter((m) => m > eskiL && m <= k.L)
      olaylar.push({ tip: 'yukseltildi', istasyon: v.istasyon, eskiL, yeniL: k.L, kademeler }, { tip: 'paraDegisti' })
      xpVer(d, 3 + 25 * kademeler.length, olaylar)
      return { ok: true }
    }
    case 'madenAc': {
      if (v.i !== b.madenler.length || v.i >= 12) return { ok: false, sebep: 'kilit' }
      const m = E.madenAcilis(d, b, v.i)
      if (b.para < m) return { ok: false, sebep: 'para' }
      b.para -= m; b.madenler.push({ L: 1, yigin: 0, kalan: 0 })
      d.calisma.madenler.push({ calisiyor: false, dolu: false })
      olaylar.push({ tip: 'madenAcildi', i: v.i })
      xpVer(d, 40 * (v.i + 1), olaylar)
      return { ok: true }
    }
    case 'dokun': return { ok: true }
    case 'yoneticiTut': {
      if (b.yoneticiler.length >= A.MAKS_YONETICI) return { ok: false, sebep: 'dolu' }
      if (v.odeme === 'elmas') { if (d.oyuncu.elmas < 50) return { ok: false, sebep: 'elmas' }; d.oyuncu.elmas -= 50 }
      else { const m = E.kiralamaMaliyeti(d, b, v.tip); if (b.para < m) return { ok: false, sebep: 'para' }; b.para -= m; b.kiralanan[v.tip]++ }
      const r = Math.random(), nadirlik = v.odeme === 'elmas' ? (r < 0.7 ? 1 : 2) : (r < 0.7 ? 0 : r < 0.95 ? 1 : 2)
      const isimler = A.ISIMLER.e.concat(A.ISIMLER.k)
      const y = { id: 'y' + Math.floor(Math.random() * 1e9), tip: v.tip, nadirlik, yetenek: A.TIP_YETENEKLERI[v.tip][Math.random() < 0.5 ? 0 : 1],
        ad: isimler[Math.floor(Math.random() * isimler.length)], tohum: Math.floor(Math.random() * 1e6), atanan: null, aktifBitis: 0, hazirZaman: 0 }
      let hedef = v.istasyon && !b.yoneticiler.some((x) => x.atanan === v.istasyon) ? v.istasyon : null
      if (!hedef) {
        const adaylar = v.tip === 'maden' ? b.madenler.map((m, i) => 'm' + i) : [v.tip]
        hedef = adaylar.find((s) => !b.yoneticiler.some((x) => x.atanan === s)) || null
      }
      y.atanan = hedef
      b.yoneticiler.push(y)
      olaylar.push({ tip: 'yoneticiTutuldu', yonetici: y, istasyon: hedef })
      xpVer(d, 20, olaylar)
      return { ok: true, yonetici: y }
    }
    case 'yoneticiAta': {
      const y = b.yoneticiler.find((x) => x.id === v.id)
      if (!y) return { ok: false, sebep: 'gecersiz' }
      for (const x of b.yoneticiler) if (x.atanan === v.istasyon) x.atanan = null
      y.atanan = v.istasyon
      olaylar.push({ tip: 'yoneticiAtandi' })
      return { ok: true }
    }
    case 'yoneticiCikar': {
      for (const x of b.yoneticiler) if (x.atanan === v.istasyon) x.atanan = null
      olaylar.push({ tip: 'yoneticiAtandi' })
      return { ok: true }
    }
    case 'yetenek': {
      const y = b.yoneticiler.find((x) => x.atanan === v.istasyon)
      if (!y || d.zaman < y.hazirZaman) return { ok: false, sebep: 'gecersiz' }
      const n = A.NADIRLIKLER[y.nadirlik]
      y.aktifBitis = d.zaman + n.sure; y.hazirZaman = d.zaman + n.sure + n.bekleme
      olaylar.push({ tip: 'yetenek', istasyon: v.istasyon, yonetici: y })
      xpVer(d, 5, olaylar)
      return { ok: true }
    }
    case 'takviye': {
      const sinir = d.zaman + 4 * 3600
      if (d.takviye.bitis >= sinir - 1) return { ok: false, sebep: 'maks' }
      d.takviye.bitis = Math.min(sinir, Math.max(d.zaman, d.takviye.bitis) + (v.dakika || 30) * 60)
      olaylar.push({ tip: 'takviye', bitis: d.takviye.bitis })
      return { ok: true }
    }
    case 'cevrimdisiTopla': {
      if (!d.bekleyenCevrimdisi) return { ok: false, sebep: 'gecersiz' }
      b.para += d.bekleyenCevrimdisi.miktar * (v.kat || 1)
      d.bekleyenCevrimdisi = null
      olaylar.push({ tip: 'paraDegisti' })
      return { ok: true }
    }
    case 'alimModu': d.alimModu = v.mod; return { ok: true }
    case 'ayar': d.ayarlar[v.anahtar] = v.deger; return { ok: true }
    case 'ogretici': d.ogretici.adim = v.adim; if (v.adim > A.OGRETICI_SON_ADIM) d.ogretici.bitti = true; olaylar.push({ tip: 'ogretici', adim: v.adim }); return { ok: true }
    case 'sifirla': return { ok: true }
  }
  return { ok: false, sebep: 'gecersiz' }
}
