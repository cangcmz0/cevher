// Paket A: sabit adımlı benzetim ve eylemler (TASARIM §2, §6.4). DOM yok.
//
// Olay notları (§6.4 listesine ek alanlar, hiçbiri zorunlu değil):
// - asansorDurak {kat, miktar, istasyon}: kat = maden indeksi (0 tabanlı), istasyon = 'm'+kat
// - satis {miktar, para, k}: k = taşıyıcı indeksi
// - yoneticiAtandi {id, istasyon, eski, cikarilan}: istasyon null ise çıkarıldı
// - yetenekBitti/yetenekHazir {istasyon, yonetici}: yonetici = kimlik
// - seviyeAtladi {lv, elmas, acilan}: acilan = açılan özellik kodları dizisi (S1: ['takviye'] Lv. 2'de, yoksa [])
// - darbogaz {tur}: tur null ise uyarı kalktı
// Hata ayıklama eylemleri (harness için): 'xp' {miktar}, 'para' {miktar}

import {
  KADEME_MADEN, KADEME_ISTASYON, MADEN_SAYISI, KAZI_SURESI, DURAK, BOSALTMA, YUKLEME, SATIS, TASIYICI_ARALIK,
  MAKS_YONETICI, ELMAS_KIRALAMA, NADIRLIK_ODDS, YONETICI_TIPLERI, TIP_YETENEKLERI, ISIMLER, DARBOGAZ_YUKSEL,
  DARBOGAZ_TEMIZLE, DEPO_BOSTA_SURE, GELIR_EMA_SURE, GECMIS_ARALIK, GECMIS_UZUNLUK, ALIM_MODLARI, MAKS_SEVIYE,
  XP, ACILIMLAR, TAKVIYE_DAKIKA, TAKVIYE_SINIR_SAAT, OGRETICI_SON_ADIM, DARBOGAZ_ARALIK,
} from './ayar.js'
import {
  madenUretim, uretimCarpani, yiginKap, asansorKap, asansorHiz, tasiyiciSayisi, tasiyiciYuk, depoYol, depoKap,
  satisCarpani, kapasiteler, otoGelir, toplamUretim, xpGerek, harcamaXp, teklif, madenAcilis, kiralamaMaliyeti,
  yoneticiBul, yetenekDurum, yetenekSuresi, yetenekBekleme, gecilenKademeler,
} from './ekonomi.js'
import { yeniCalisma, yeniTasiyici, yeniDurum, rastgele, istasyonGecerli, istasyonTip } from './durum.js'

export const ADIM = 0.05

const MADEN_ADLARI = Object.freeze(Array.from({ length: MADEN_SAYISI }, (_, i) => 'm' + i))
const EPS = 1e-9

// ---- Hazırlık ----

// Kayıtlı alanlardan çalışma durumunu yeniden kurar (yükleme ya da bölge değişiminden sonra).
// Yoldaki taşıyıcı yükleri satılır.
export function hazirla(durum) {
  const b = durum.bolgeler[durum.aktifBolge]
  if (b.depo.yoldaki > 0) {
    const p = b.depo.yoldaki * satisCarpani(durum)
    b.para += p
    b.toplamKazanc += p
    b.depo.yoldaki = 0
  }
  const c = yeniCalisma(durum)
  durum.calisma = c
  const tu = toplamUretim(durum, b)
  c.uretimGecmis.fill(tu)
  c.gecmisSayi = GECMIS_UZUNLUK
  for (const y of b.yoneticiler) c.yetenekler[y.id] = yetenekDurum(durum, y).durum
  for (let i = 0; i < b.madenler.length; i++) {
    const m = b.madenler[i]
    c.madenler[i].dolu = m.yigin >= yiginKap(durum, b, i) * (1 - 1e-12)
    c.madenler[i].calisiyor = !!yoneticiBul(b, MADEN_ADLARI[i]) || m.kalan > 0
  }
  c.dolular.depo = b.depo.stok >= depoKap(durum, b) * (1 - 1e-12)
  return durum
}

// ---- Adım ----

export function adim(durum, dt, olaylar) {
  if (!durum.calisma) hazirla(durum)
  const c = durum.calisma
  const b = durum.bolgeler[c.bolge]
  const paraOnce = b.para
  durum.zaman += dt
  yetenekKontrol(durum, b, c, olaylar)
  madenlerAdim(durum, b, c, dt, olaylar)
  asansorAdim(durum, b, c, dt, olaylar)
  tasiyicilarAdim(durum, b, c, dt, olaylar)
  c.sayac05 += dt
  if (c.sayac05 >= DARBOGAZ_ARALIK - EPS) {
    const h = c.sayac05
    c.sayac05 = 0
    istatistikVeDarbogaz(durum, b, c, h, olaylar)
  }
  c.sayac30 += dt
  if (c.sayac30 >= GECMIS_ARALIK - EPS) {
    c.sayac30 = 0
    c.uretimGecmis[c.gecmisIndeks] = toplamUretim(durum, b)
    c.gecmisIndeks = (c.gecmisIndeks + 1) % GECMIS_UZUNLUK
    if (c.gecmisSayi < GECMIS_UZUNLUK) c.gecmisSayi++
  }
  c.kirli = true
  if (b.para !== paraOnce && olaylar) olaylar.push({ tip: 'paraDegisti' })
}

const yay = (olaylar, o) => { if (olaylar) olaylar.push(o) }

function yetenekKontrol(d, b, c, olaylar) {
  const z = d.zaman
  const l = b.yoneticiler
  for (let k = 0; k < l.length; k++) {
    const y = l[k]
    const s = z < y.aktifBitis ? 'aktif' : z < y.hazirZaman ? 'bekleme' : 'hazir'
    const onceki = c.yetenekler[y.id]
    if (onceki === s) continue
    if (onceki === 'aktif') yay(olaylar, { tip: 'yetenekBitti', istasyon: y.atanan, yonetici: y.id })
    if (s === 'hazir' && onceki !== undefined) yay(olaylar, { tip: 'yetenekHazir', istasyon: y.atanan, yonetici: y.id })
    c.yetenekler[y.id] = s
  }
}

function madenlerAdim(d, b, c, dt, olaylar) {
  const ml = b.madenler
  for (let i = 0; i < ml.length; i++) {
    const m = ml[i]
    let cm = c.madenler[i]
    if (!cm) { cm = { calisiyor: false, dolu: false }; c.madenler[i] = cm }
    const yon = yoneticiBul(b, MADEN_ADLARI[i])
    const kap = yiginKap(d, b, i)
    let sure = 0
    if (yon) {
      sure = dt
      m.kalan = 0
    } else if (m.kalan > 0) {
      sure = Math.min(dt, m.kalan)
      m.kalan = m.kalan - dt > 1e-12 ? m.kalan - dt : 0
    }
    cm.calisiyor = sure > 0
    if (sure > 0 && m.yigin < kap) {
      const ek = Math.min(madenUretim(d, b, i) * uretimCarpani(d, b, i) * sure, kap - m.yigin)
      m.yigin += ek
      c.uretilen += ek
    }
    const dolu = m.yigin >= kap * (1 - 1e-12)
    if (dolu !== cm.dolu) {
      cm.dolu = dolu
      yay(olaylar, { tip: dolu ? 'doldu' : 'bosaldi', istasyon: MADEN_ADLARI[i] })
    }
  }
}

function herhangiYigin(b) {
  for (let i = 0; i < b.madenler.length; i++) if (b.madenler[i].yigin > 0) return true
  return false
}

function asansorAdim(d, b, c, dt, olaylar) {
  const a = c.asansor, ba = b.asansor
  a.onceki = a.konum
  const yon = yoneticiBul(b, 'asansor')
  const n = b.madenler.length
  let r = dt, g = 0
  while (r > 1e-12 && g++ < 64) {
    const du = a.durum
    if (du === 'bekle') {
      if (a.manuel || (yon && herhangiYigin(b))) {
        yay(olaylar, { tip: 'asansorKalkti', manuel: a.manuel && !yon })
        a.manuel = false
        a.durum = 'iniyor'
        a.t = 0
        a.hedef = 1
      } else break
    } else if (du === 'iniyor') {
      const v = asansorHiz(d, b)
      const hedef = Math.min(n, Math.floor(a.konum + EPS) + 1)
      a.hedef = hedef
      const gerek = (hedef - a.konum) / v
      if (r >= gerek) {
        r -= gerek
        a.konum = hedef
        const i = hedef - 1
        const m = b.madenler[i]
        const kap = asansorKap(d, b)
        if (m.yigin > 0 && ba.yuk < kap * (1 - 1e-12)) {
          a.durum = 'yukluyor'
          a.t = 0
          a.durak = i
          a.planli = Math.min(m.yigin, kap - ba.yuk)
          a.tasinan = 0
          yay(olaylar, { tip: 'asansorDurak', kat: i, istasyon: MADEN_ADLARI[i], miktar: a.planli })
        } else if (hedef >= n) {
          a.durum = 'cikiyor'
          a.hedef = 0
        }
      } else {
        a.konum += v * r
        r = 0
      }
    } else if (du === 'yukluyor') {
      const ad = Math.min(r, DURAK - a.t)
      a.t += ad
      r -= ad
      const bitti = a.t >= DURAK - 1e-12
      const m = b.madenler[a.durak]
      const kap = asansorKap(d, b)
      const hedefM = bitti ? a.planli : a.planli * a.t / DURAK
      const tas = Math.max(0, Math.min(hedefM - a.tasinan, m.yigin, kap - ba.yuk))
      m.yigin -= tas
      ba.yuk += tas
      a.tasinan += tas
      if (bitti) {
        a.durak = -1
        if (ba.yuk >= kap * (1 - 1e-9) || a.konum >= n) {
          a.durum = 'cikiyor'
          a.hedef = 0
        } else a.durum = 'iniyor'
      }
    } else if (du === 'cikiyor') {
      const v = asansorHiz(d, b)
      const gerek = a.konum / v
      if (r >= gerek) {
        r -= gerek
        a.konum = 0
        a.durum = 'bosaltiyor'
        a.t = 0
        a.bas = ba.yuk
        a.bosaltilan = 0
      } else {
        a.konum -= v * r
        r = 0
      }
    } else if (du === 'bosaltiyor') {
      const bos = Math.max(0, depoKap(d, b) - b.depo.stok)
      let tas
      if (a.t < BOSALTMA - 1e-12) {
        const ad = Math.min(r, BOSALTMA - a.t)
        a.t += ad
        r -= ad
        const hedefM = a.t >= BOSALTMA - 1e-12 ? a.bas : a.bas * a.t / BOSALTMA
        tas = Math.max(0, Math.min(hedefM - a.bosaltilan, ba.yuk, bos))
      } else {
        tas = Math.min(ba.yuk, bos)
      }
      ba.yuk -= tas
      b.depo.stok += tas
      a.bosaltilan += tas
      if (a.t >= BOSALTMA - 1e-12) {
        if (ba.yuk <= 1e-9 * Math.max(1, a.bas)) {
          b.depo.stok += ba.yuk
          a.bosaltilan += ba.yuk
          ba.yuk = 0
          yay(olaylar, { tip: 'bosaltildi', miktar: a.bosaltilan })
          a.durum = 'bekle'
          a.t = 0
        } else r = 0
      }
    } else {
      a.durum = 'bekle'
    }
  }
  a.yuk = ba.yuk
}

function tasiyicilarAdim(d, b, c, dt, olaylar) {
  const bd = b.depo
  const yon = yoneticiBul(b, 'depo')
  const tl = c.tasiyicilar
  const hedefSayi = tasiyiciSayisi(bd.L)
  while (tl.length < hedefSayi) tl.push(yeniTasiyici())
  let hepsiBosta = true, yoldaki = 0
  for (let k = 0; k < tl.length; k++) {
    const t = tl[k]
    t.onceki = t.t
    t.oncekiKonum = t.konum
    let r = dt, g = 0
    while (r > 1e-12 && g++ < 16) {
      if (t.durum === 'bekle') {
        let basla = false
        if (t.baslat >= 0 && d.zaman >= t.baslat - EPS) {
          t.baslat = -1
          basla = bd.stok > 0
        } else if (yon && bd.stok > 0 && d.zaman - c.sonCikis >= TASIYICI_ARALIK - EPS) basla = true
        if (!basla) break
        const yuk = Math.min(bd.stok, tasiyiciYuk(d, b))
        bd.stok -= yuk
        t.yuk = yuk
        t.durum = 'yukluyor'
        t.t = 0
        t.sure = YUKLEME
        t.konum = 0
        c.sonCikis = d.zaman
        yay(olaylar, { tip: 'tasiyiciCikti', k })
        continue
      }
      const ad = Math.min(r, t.sure - t.t)
      t.t += ad
      r -= ad
      const oran = t.sure > 0 ? Math.min(1, t.t / t.sure) : 1
      if (t.durum === 'gidiyor') t.konum = oran
      else if (t.durum === 'donuyor') t.konum = 1 - oran
      if (t.t < t.sure - 1e-12) continue
      // evre bitti
      if (t.durum === 'yukluyor') {
        t.durum = 'gidiyor'; t.t = 0; t.sure = depoYol(d, b)
      } else if (t.durum === 'gidiyor') {
        const para = t.yuk * satisCarpani(d)
        b.para += para
        b.toplamKazanc += para
        c.satilan += t.yuk
        c.pencereSatis += para
        d.istatistik.satis++
        yay(olaylar, { tip: 'satis', miktar: t.yuk, para, k })
        t.yuk = 0
        t.konum = 1
        t.durum = 'satiyor'; t.t = 0; t.sure = SATIS
      } else if (t.durum === 'satiyor') {
        t.durum = 'donuyor'; t.t = 0; t.sure = depoYol(d, b)
      } else {
        t.durum = 'bekle'; t.t = 0; t.sure = 0; t.konum = 0
      }
    }
    if (t.durum !== 'bekle' || t.baslat >= 0) hepsiBosta = false
    yoldaki += t.yuk
  }
  bd.yoldaki = yoldaki
  const s = c.darbogazSayac
  s.bostaSure = hepsiBosta && bd.stok > 0 ? s.bostaSure + dt : 0
  const dolu = bd.stok >= depoKap(d, b) * (1 - 1e-12)
  if (dolu !== c.dolular.depo) {
    c.dolular.depo = dolu
    yay(olaylar, { tip: dolu ? 'doldu' : 'bosaldi', istasyon: 'depo' })
  }
}

function istatistikVeDarbogaz(d, b, c, h, olaylar) {
  const oran = c.pencereSatis / h
  c.pencereSatis = 0
  c.gelirEma += (oran - c.gelirEma) * (1 - Math.exp(-h / GELIR_EMA_SURE))

  const { P, A, D } = kapasiteler(d, b)
  const yonA = !!yoneticiBul(b, 'asansor'), yonD = !!yoneticiBul(b, 'depo')
  let yonetimliDolu = false, herhangiDolu = false
  for (let i = 0; i < b.madenler.length; i++) {
    const m = b.madenler[i]
    if (c.madenler[i] && c.madenler[i].dolu) herhangiDolu = true
    if (yoneticiBul(b, MADEN_ADLARI[i]) && m.yigin >= 0.98 * yiginKap(d, b, i)) yonetimliDolu = true
  }
  const dKap = depoKap(d, b)
  let aday = null
  if (yonA) {
    if (A < 0.9 * P || yonetimliDolu) aday = 'asansor'
  } else if ((herhangiDolu || yonetimliDolu) && c.asansor.durum === 'bekle') aday = 'asansorManuel'
  if (!aday) {
    if (yonD) {
      if (D < 0.9 * Math.min(P, A) || b.depo.stok >= 0.95 * dKap) aday = 'depo'
    } else if (c.darbogazSayac.bostaSure >= DEPO_BOSTA_SURE - EPS) aday = 'depoManuel'
  }

  const s = c.darbogazSayac, z = d.zaman
  if (aday !== s.aday) { s.aday = aday; s.adayBas = z }
  if (c.darbogaz !== null) {
    if (aday === c.darbogaz) s.temizBas = -1
    else {
      if (s.temizBas < 0) s.temizBas = z
      if (z - s.temizBas >= DARBOGAZ_TEMIZLE - EPS) {
        c.darbogaz = null
        s.temizBas = -1
        yay(olaylar, { tip: 'darbogaz', tur: null })
      }
    }
  }
  if (c.darbogaz === null && aday !== null && z - s.adayBas >= DARBOGAZ_YUKSEL - EPS) {
    c.darbogaz = aday
    s.temizBas = -1
    yay(olaylar, { tip: 'darbogaz', tur: aday })
  }
}

// Toplam Üretim'in 5 dk önceye göre oranı (0.12 = +%12)
export function uretimArtisi(durum) {
  const c = durum.calisma
  const b = durum.bolgeler[c.bolge]
  const eski = c.gecmisSayi < GECMIS_UZUNLUK ? c.uretimGecmis[0] : c.uretimGecmis[c.gecmisIndeks]
  if (!(eski > 0)) return 0
  return toplamUretim(durum, b) / eski - 1
}

// ---- XP ve seviye ----

function xpVer(d, miktar, kaynak, olaylar) {
  if (!(miktar > 0)) return
  const o = d.oyuncu
  o.xp += miktar
  o.toplamXp += miktar
  yay(olaylar, { tip: 'xp', miktar, kaynak })
  while (o.lv < MAKS_SEVIYE && o.xp >= xpGerek(o.lv)) {
    o.xp -= xpGerek(o.lv)
    o.lv++
    const elmas = 5 + o.lv
    o.elmas += elmas
    yay(olaylar, { tip: 'seviyeAtladi', lv: o.lv, elmas, acilan: (ACILIMLAR[o.lv] || []).slice() })
  }
}

function enIyiGuncelle(d, b) {
  const g = otoGelir(d, b)
  if (g > b.enIyiGelir) b.enIyiGelir = g
}

// ---- Eylemler ----

const TAMAM = () => ({ ok: true })
const RED = (sebep) => ({ ok: false, sebep })

function isaretle(d, acil) {
  d.calisma.kirli = true
  if (acil) d.calisma.acilKayit = true   // 1 s gecikmeli kayıt isteği (§3.4), D okur ve sıfırlar
}

export function eylem(durum, ad, veri, olaylar) {
  veri = veri || {}
  if (!durum.calisma) hazirla(durum)
  const f = EYLEMLER[ad]
  if (!f) return RED('gecersiz')
  return f(durum, durum.bolgeler[durum.calisma.bolge], veri, olaylar)
}

const EYLEMLER = {
  yukselt(d, b, v, olaylar) {
    const ist = v.istasyon
    if (!istasyonGecerli(b, ist)) return RED('gecersiz')
    const mod = v.adet === undefined ? d.alimModu : v.adet
    if (!ALIM_MODLARI.includes(mod)) return RED('gecersiz')
    const tk = teklif(d, b, ist, mod)
    if (tk.maks) return RED('maks')
    if (!tk.yetiyor) return RED('para')
    const xp = harcamaXp(d, b, tk.maliyet)
    b.para -= tk.maliyet
    let eskiL, liste
    if (ist === 'asansor') { eskiL = b.asansor.L; b.asansor.L = tk.yeniL; liste = KADEME_ISTASYON }
    else if (ist === 'depo') { eskiL = b.depo.L; b.depo.L = tk.yeniL; liste = KADEME_ISTASYON }
    else { const m = b.madenler[+ist.slice(1)]; eskiL = m.L; m.L = tk.yeniL; liste = KADEME_MADEN }
    const kademeler = gecilenKademeler(eskiL, tk.yeniL, liste)
    d.istatistik.yukseltme++
    yay(olaylar, { tip: 'yukseltildi', istasyon: ist, eskiL, yeniL: tk.yeniL, kademeler })
    xpVer(d, xp, 'harcama', olaylar)
    if (kademeler.length) xpVer(d, XP.kademe * kademeler.length, 'kademe', olaylar)
    enIyiGuncelle(d, b)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, adet: tk.adet, maliyet: tk.maliyet, yeniL: tk.yeniL, kademeler }
  },

  madenAc(d, b, v, olaylar) {
    const i = v.i
    const n = b.madenler.length
    if (!Number.isInteger(i) || i < 0) return RED('gecersiz')
    if (i >= MADEN_SAYISI) return RED('maks')
    if (i < n) return RED('gecersiz')
    if (i > n) return RED('kilit')
    const maliyet = madenAcilis(d, b, i)
    if (b.para < maliyet) return RED('para')
    const xp = harcamaXp(d, b, maliyet)
    b.para -= maliyet
    b.madenler.push({ L: 1, yigin: 0, kalan: 0 })
    d.calisma.madenler[i] = { calisiyor: false, dolu: false }
    yay(olaylar, { tip: 'madenAcildi', i })
    xpVer(d, xp, 'harcama', olaylar)
    xpVer(d, XP.madenAcma * (i + 1), 'madenAcma', olaylar)
    enIyiGuncelle(d, b)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, maliyet }
  },

  dokun(d, b, v, olaylar) {
    const ist = v.istasyon
    if (!istasyonGecerli(b, ist)) return RED('gecersiz')
    if (yoneticiBul(b, ist)) return RED('otomatik')
    const c = d.calisma
    d.istatistik.dokunus++
    isaretle(d, false)
    if (ist === 'asansor') {
      if (c.asansor.durum !== 'bekle' || c.asansor.manuel) return { ok: true, etkisiz: true }
      c.asansor.manuel = true
      return TAMAM()
    }
    if (ist === 'depo') {
      let j = 0
      for (const t of c.tasiyicilar) {
        if (t.durum !== 'bekle' || t.baslat >= 0) continue
        t.baslat = d.zaman + TASIYICI_ARALIK * j++
      }
      return j ? TAMAM() : { ok: true, etkisiz: true }
    }
    const i = +ist.slice(1)
    const m = b.madenler[i]
    if (m.kalan > 0) return { ok: true, etkisiz: true }
    if (m.yigin >= yiginKap(d, b, i) * (1 - 1e-12)) return RED('dolu')
    m.kalan = KAZI_SURESI
    c.madenler[i].calisiyor = true
    yay(olaylar, { tip: 'kaziBasladi', i, manuel: true })
    return TAMAM()
  },

  yoneticiTut(d, b, v, olaylar) {
    const tip = v.tip
    if (!YONETICI_TIPLERI.includes(tip)) return RED('gecersiz')
    if (b.yoneticiler.length >= MAKS_YONETICI) return RED('dolu')
    const odeme = v.odeme === 'elmas' ? 'elmas' : v.odeme === 'hediye' ? 'hediye' : 'para'
    if (odeme === 'elmas') {
      if (d.oyuncu.elmas < ELMAS_KIRALAMA) return RED('elmas')
      d.oyuncu.elmas -= ELMAS_KIRALAMA
    } else if (odeme === 'para') {
      const maliyet = kiralamaMaliyeti(d, b, tip)
      if (b.para < maliyet) return RED('para')
      b.para -= maliyet
      b.kiralanan[tip] = (b.kiralanan[tip] || 0) + 1
    }
    // nadirlik
    const odds = NADIRLIK_ODDS[odeme === 'para' ? 'para' : 'elmas']
    const r = rastgele(d)
    let nadirlik = 0, birikim = 0
    for (let k = 0; k < odds.length; k++) {
      birikim += odds[k]
      if (r < birikim) { nadirlik = k; break }
      nadirlik = k
    }
    if (Number.isInteger(v.nadirlik)) nadirlik = Math.max(nadirlik, Math.min(2, v.nadirlik))
    const yetenek = TIP_YETENEKLERI[tip][rastgele(d) < 0.5 ? 0 : 1]
    const liste = ISIMLER[rastgele(d) < 0.5 ? 'e' : 'k']
    const isim = liste[Math.floor(rastgele(d) * liste.length)]
    const tohum = Math.floor(rastgele(d) * 1e6)
    let no = 0
    for (const y of b.yoneticiler) no = Math.max(no, +String(y.id).replace(/^\D+/, '') || 0)
    const y = { id: 'y' + (no + 1), tip, nadirlik, yetenek, ad: isim, tohum, atanan: null, aktifBitis: 0, hazirZaman: 0 }
    b.yoneticiler.push(y)
    // atama: istenen istasyon boşsa oraya, yoksa en üstteki boş istasyona
    let hedef = null
    const ist = v.istasyon
    if (ist && istasyonGecerli(b, ist) && istasyonTip(ist) === tip && !yoneticiBul(b, ist)) hedef = ist
    else if (tip === 'maden') {
      for (let i = 0; i < b.madenler.length; i++) if (!yoneticiBul(b, MADEN_ADLARI[i])) { hedef = MADEN_ADLARI[i]; break }
    } else if (!yoneticiBul(b, tip)) hedef = tip
    y.atanan = hedef
    d.calisma.yetenekler[y.id] = 'hazir'
    yay(olaylar, { tip: 'yoneticiTutuldu', yonetici: y, istasyon: hedef })
    xpVer(d, XP.yonetici, 'yonetici', olaylar)
    enIyiGuncelle(d, b)
    if (odeme === 'para') yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, yonetici: y, istasyon: hedef }
  },

  yoneticiAta(d, b, v, olaylar) {
    const y = b.yoneticiler.find((x) => x.id === v.id)
    const ist = v.istasyon
    if (!y || !istasyonGecerli(b, ist) || istasyonTip(ist) !== y.tip) return RED('gecersiz')
    if (y.atanan === ist) return TAMAM()
    const mevcut = yoneticiBul(b, ist)
    if (mevcut) mevcut.atanan = null
    const eski = y.atanan
    y.atanan = ist
    yay(olaylar, { tip: 'yoneticiAtandi', id: y.id, istasyon: ist, eski, cikarilan: mevcut ? mevcut.id : null })
    enIyiGuncelle(d, b)
    isaretle(d, true)
    return TAMAM()
  },

  yoneticiCikar(d, b, v, olaylar) {
    const y = yoneticiBul(b, v.istasyon)
    if (!y) return RED('gecersiz')
    y.atanan = null
    yay(olaylar, { tip: 'yoneticiAtandi', id: y.id, istasyon: null, eski: v.istasyon, cikarilan: null })
    isaretle(d, true)
    return TAMAM()
  },

  yetenek(d, b, v, olaylar) {
    const y = yoneticiBul(b, v.istasyon)
    if (!y) return RED('gecersiz')
    if (yetenekDurum(d, y).durum !== 'hazir') return RED('kilit')
    const sure = yetenekSuresi(d, y)
    y.aktifBitis = d.zaman + sure
    y.hazirZaman = d.zaman + sure + yetenekBekleme(d, y)
    d.calisma.yetenekler[y.id] = 'aktif'
    d.istatistik.yetenek++
    yay(olaylar, { tip: 'yetenek', istasyon: v.istasyon, yonetici: y })
    xpVer(d, XP.yetenek, 'yetenek', olaylar)
    isaretle(d, true)
    return TAMAM()
  },

  // Reklam ödülünden sonra. sinirSaat: tavan (varsayılan 4 sa; mağaza 24 sa)
  takviye(d, b, v, olaylar) {
    const dakika = +v.dakika > 0 ? +v.dakika : TAKVIYE_DAKIKA
    const sinir = +v.sinirSaat > 0 ? +v.sinirSaat : TAKVIYE_SINIR_SAAT
    const z = d.zaman, tavan = z + sinir * 3600
    if (d.takviye.bitis >= tavan - EPS) return RED('maks')
    const bitis = Math.min(Math.max(z, d.takviye.bitis) + dakika * 60, tavan)
    d.takviye.bitis = bitis
    d.istatistik.reklam++
    yay(olaylar, { tip: 'takviye', bitis })
    isaretle(d, true)
    return { ok: true, bitis, sinirli: bitis >= tavan - EPS }
  },

  cevrimdisiTopla(d, b, v, olaylar) {
    const bc = d.bekleyenCevrimdisi
    if (!bc || !d.bolgeler[bc.bolge]) return RED('gecersiz')
    const kat = v.kat === 2 ? 2 : 1
    const miktar = bc.miktar * kat
    const hb = d.bolgeler[bc.bolge]
    hb.para += miktar
    hb.toplamKazanc += miktar
    d.bekleyenCevrimdisi = null
    if (kat === 2) d.istatistik.reklam++
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, miktar }
  },

  alimModu(d, b, v) {
    if (!ALIM_MODLARI.includes(v.mod)) return RED('gecersiz')
    d.alimModu = v.mod
    isaretle(d, false)
    return TAMAM()
  },

  ayar(d, b, v) {
    const { anahtar, deger } = v
    if (anahtar === 'ses' || anahtar === 'titresim') {
      if (typeof deger !== 'boolean') return RED('gecersiz')
    } else if (anahtar === 'kalite') {
      if (!['yuksek', 'dengeli', 'pil'].includes(deger)) return RED('gecersiz')
    } else return RED('gecersiz')
    d.ayarlar[anahtar] = deger
    isaretle(d, true)
    return TAMAM()
  },

  // {adim} ilerletir (geri gitmez); {bitti: true} öğreticiyi kapatır (Ayarlar'daki atla)
  ogretici(d, b, v, olaylar) {
    const o = d.ogretici
    if (Number.isFinite(v.adim)) o.adim = Math.max(o.adim, Math.min(OGRETICI_SON_ADIM, Math.floor(v.adim)))
    if (v.bitti === true || o.adim >= OGRETICI_SON_ADIM) o.bitti = true
    yay(olaylar, { tip: 'ogretici', adim: o.adim, bitti: o.bitti })
    isaretle(d, true)
    return TAMAM()
  },

  // Yeni oyun: satin, ayarlar, saat bekçisi ve PRNG korunur
  sifirla(d, b, v, olaylar) {
    const y = yeniDurum(d.son, d.tohum)
    y.satin = { ...d.satin }
    y.ayarlar = { ...d.ayarlar }
    y.enGec = d.enGec
    y.olusturma = d.olusturma
    for (const k of Object.keys(d)) delete d[k]
    Object.assign(d, y)
    hazirla(d)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return TAMAM()
  },

  // Hata ayıklama / test düzeneği: XP ver (seviye atlama modalı için)
  xp(d, b, v, olaylar) {
    const m = +v.miktar
    if (!(m > 0)) return RED('gecersiz')
    xpVer(d, m, v.kaynak || 'hata', olaylar)
    isaretle(d, true)
    return TAMAM()
  },

  // Hata ayıklama / test düzeneği: aktif bölgeye para ekle
  para(d, b, v, olaylar) {
    const m = +v.miktar
    if (!Number.isFinite(m)) return RED('gecersiz')
    b.para = Math.max(0, b.para + m)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return TAMAM()
  },
}
