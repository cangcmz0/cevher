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
  XP, ACILIMLAR, TAKVIYE_DAKIKA, TAKVIYE_SINIR_SAAT, OGRETICI_SON_ADIM, DARBOGAZ_ARALIK, GOREVLER, BOLGELER,
  BOLGE, BOLGE_USTASI_ELMAS, BOLGE_ACMA_XP, LIMAN, AMBAR, KONTRAT, KONTRAT_MUSTERI, MISYONLAR, MISYON_ODUL,
  ETKINLIKLER, PRESTIJ, ARASTIRMALAR, ARASTIRMA_MALIYET, ARASTIRMA_SURELER, ARASTIRMA_T3_SURE, GUNLUK_HEDIYE,
  ELMAS_HARCAMA, TAKVIYE_MAGAZA_SINIR_SAAT, ORTAKLAR, ORTAK_MAKS, ORTAK_MALIYET,
} from './ayar.js'
import {
  madenUretim, uretimCarpani, yiginKap, asansorKap, asansorHiz, tasiyiciSayisi, tasiyiciYuk, depoYol, depoKap,
  satisCarpani, kapasiteler, otoGelir, toplamUretim, xpGerek, harcamaXp, teklif, madenAcilis, kiralamaMaliyeti,
  yoneticiBul, yetenekDurum, yetenekSuresi, yetenekBekleme, gecilenKademeler, gelirRef, bolgeBilgi,
  bolgeKodu, etkinlik, otoAkis, ar, limanMaliyet, ambarMaliyet, cevrimdisiSinir,
} from './ekonomi.js'
import { yeniCalisma, yeniTasiyici, yeniDurum, yeniBolge, rastgele, istasyonGecerli, istasyonTip } from './durum.js'
import { SAHNELER, gorevYazi, gorevSahnesi } from './hikaye.js'

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
  c.gelirEma = otoGelir(durum, b) * (durum.zaman < durum.takviye.bitis ? 2 : 1)
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
    gorevKontrol(durum, b, olaylar)
    if (!(b.kontrat.hedef > 0)) kontratKur(durum, b)
    arastirmaKontrol(durum, olaylar)
    prestijKontrol(durum, olaylar)
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
        const para = t.yuk * satisCarpani(d, b)
        b.para += para
        b.toplamKazanc += para
        c.satilan += t.yuk
        kontratIlerle(b, t.yuk, olaylar)
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
// ---- Bölge görevleri (§2.14): sırayla, yalnız şimdiki görev etkin ----

// Görev şablonunun koşul metni ("5. Katı aç" gibi)
export function gorevKosulu(g) {
  if (!g) return ''
  switch (g.tur) {
    case 'seviye': return `${g.i + 2}. Katı ${g.L}. seviyeye çıkar`
    case 'yonetici': return 'Bir yönetici tut'
    case 'ac': return `${g.n + 1}. Katı aç`
    case 'yon': return g.ist === 'asansor' ? 'Asansöre yönetici tut' : 'Depoya yönetici tut'
    case 'yetenek': return 'Bir yönetici yeteneği kullan'
    case 'L': return g.ist === 'asansor' ? `Asansörü ${g.L}. seviyeye çıkar` : `Depoyu ${g.L}. seviyeye çıkar`
    case 'kontrat': return g.n > 1 ? `${g.n} kontrat teslim et` : 'Bir kontrat teslim et'
    case 'liman': return `Limanı ${g.n}. seviyeye çıkar`
  }
  return ''
}

// Görev i'nin ilerlemesi: { simdi, hedef }
export function gorevIlerleme(d, b, i) {
  const g = GOREVLER[i]
  const v = (s, h) => ({ simdi: Math.max(0, Math.min(s, h)), hedef: h })
  if (!g) return v(0, 1)
  switch (g.tur) {
    case 'seviye': return v(b.madenler[g.i] ? b.madenler[g.i].L : 0, g.L)
    case 'yonetici': return v(b.yoneticiler.length ? 1 : 0, 1)
    case 'ac': return v(b.madenler.length, g.n)
    case 'yon': return v(yoneticiBul(b, g.ist) ? 1 : 0, 1)
    case 'yetenek': return v(b.yetenekSay || 0, g.n)
    case 'L': return v(g.ist === 'asansor' ? b.asansor.L : b.depo.L, g.L)
    case 'kontrat': return v(b.kontrat ? b.kontrat.tamam : 0, g.n)
    case 'liman': return v(b.liman || 0, g.n)
  }
  return v(0, 1)
}

// Görev ödülü: XP × (1 + 0,5 r), elmas, para = N dakikalık gelirRef (en az 50 × ölçek)
export function gorevOdulu(d, b, i) {
  const g = GOREVLER[i]
  if (!g) return null
  const bb = bolgeBilgi(d, b)
  const r = Math.max(0, BOLGELER.indexOf(bb))
  const para = g.para ? Math.max(gelirRef(d, b) * g.para * 60, 50 * bb.olcek) : 0
  return { xp: Math.round(g.xp * (1 + 0.5 * r)), elmas: g.elmas, para }
}

// Şimdiki görevin durumu ya da null (hepsi bitti)
export function gorevDurumu(d, b) {
  const i = b.gorev.sira
  if (i >= GOREVLER.length) return null
  const il = gorevIlerleme(d, b, i)
  const kod = bolgeKodu(d, b)
  const y = gorevYazi(kod, i)
  return {
    sira: i, metin: gorevKosulu(GOREVLER[i]), baslik: y ? y.baslik : gorevKosulu(GOREVLER[i]), aciklama: y ? y.aciklama : '',
    hazir: !!b.gorev.hazir, ...il, odul: gorevOdulu(d, b, i), toplam: GOREVLER.length,
  }
}

function gorevKontrol(d, b, olaylar) {
  const gv = b.gorev
  if (gv.hazir || gv.sira >= GOREVLER.length) return
  const il = gorevIlerleme(d, b, gv.sira)
  if (il.simdi >= il.hedef) {
    gv.hazir = true
    yay(olaylar, { tip: 'gorevHazir', sira: gv.sira, metin: gorevKosulu(GOREVLER[gv.sira]) })
  }
}

// ---- Hikâye ----

// Sahneyi kuyruğa ekler (görüldüyse eklemez; tekrar=true ise yeniden oynatır)
export function hikayeEkle(d, id, olaylar, tekrar = false) {
  if (!SAHNELER[id]) return false
  const h = d.hikaye
  if (h.bekleyen.includes(id)) return false
  if (h.goruldu.includes(id)) {
    if (!tekrar) return false
    h.goruldu = h.goruldu.filter((x) => x !== id)
  }
  h.bekleyen.push(id)
  yay(olaylar, { tip: 'hikaye', id })
  // Tanışma sahnesi: ortak katılır
  for (const o of ORTAKLAR) {
    if (o.sahne === id && !(d.ortak[o.kod] >= 1)) {
      d.ortak[o.kod] = 1
      yay(olaylar, { tip: 'ortakKatildi', kod: o.kod })
      for (const k of Object.keys(d.bolgeler)) enIyiGuncelle(d, d.bolgeler[k])
    }
  }
  return true
}

// ---- Kontratlar ----

const kontratDk = (n) => Math.min(KONTRAT.dkTavan, KONTRAT.dkTaban + KONTRAT.dkArtis * n)

// Olası cevher akışı (değer/s): bütün açık madenler çalışsa (yeteneksiz), asansör ve depo sınırıyla
function olasiAkis(d, b) {
  let P = 0
  for (let i = 0; i < b.madenler.length; i++) P += madenUretim(d, b, i) * uretimCarpani(d, b, i, false)
  const { A, D } = kapasiteler(d, b, { yetenek: false })
  return Math.min(P, A, D)
}

function kontratKur(d, b) {
  const k = b.kontrat
  const akis = Math.max(otoAkis(d, b), olasiAkis(d, b) * 0.5, 0.5 * bolgeBilgi(d, b).olcek)
  k.hedef = akis * 60 * kontratDk(k.no)
  k.ilerleme = 0
  k.hazir = false
}

// Kontrat bilgisi (arayüz için)
export function kontratDurumu(d, b) {
  const k = b.kontrat
  const kod = bolgeKodu(d, b)
  const ml = KONTRAT_MUSTERI[kod] || KONTRAT_MUSTERI.zonguldak
  const n = k.no
  const e = etkinlik(d).kontrat || 1
  const dk = kontratDk(n)
  return {
    no: n, musteri: ml[n % ml.length], cevher: bolgeBilgi(d, b).cevher, hedef: k.hedef, ilerleme: Math.min(k.ilerleme, k.hedef),
    hazir: k.hazir, tamam: k.tamam,
    odul: {
      para: gelirRef(d, b) * dk * 30 * e,
      elmas: Math.round(Math.min(KONTRAT.elmasTavan, KONTRAT.elmasTaban + KONTRAT.elmasArtis * n) * e),
      xp: KONTRAT.xpTaban + KONTRAT.xpArtis * Math.min(n, 30),
    },
  }
}

function kontratIlerle(b, miktar, olaylar) {
  const k = b.kontrat
  if (k.hazir || !(k.hedef > 0)) return
  k.ilerleme += miktar
  if (k.ilerleme >= k.hedef) {
    k.ilerleme = k.hedef
    k.hazir = true
    yay(olaylar, { tip: 'kontratHazir', no: k.no })
  }
}

// ---- Araştırma (§2.15) ----

export const arastirmaBilgi = (kod) => ARASTIRMALAR.find((a) => a.kod === kod) || null

// Bir sonraki seviyenin maliyeti ve süresi; maks ise null
export function arastirmaTeklif(d, kod) {
  const a = arastirmaBilgi(kod)
  if (!a) return null
  const sv = ar(d, kod)
  if (sv >= a.sv) return null
  const elmas = ARASTIRMA_MALIYET[a.tier][Math.min(sv, ARASTIRMA_MALIYET[a.tier].length - 1)]
  const sure = a.tier === 3 ? ARASTIRMA_T3_SURE : ARASTIRMA_SURELER[Math.min(sv, ARASTIRMA_SURELER.length - 1)]
  return { elmas, sure, sv }
}

// Şartlar sağlanıyor mu: {ok, eksik: 'Lv. 10' | 'Keskin Kazmalar 2' ...}
export function arastirmaSart(d, kod) {
  const a = arastirmaBilgi(kod)
  if (!a) return { ok: false, eksik: '' }
  for (const k of Object.keys(a.sart)) {
    const gerek = a.sart[k]
    if (k === 'lv') { if (d.oyuncu.lv < gerek) return { ok: false, eksik: 'Seviye ' + gerek } }
    else if (ar(d, k) < gerek) return { ok: false, eksik: (arastirmaBilgi(k) || { ad: k }).ad + ' ' + gerek }
  }
  return { ok: true, eksik: '' }
}

function arastirmaKontrol(d, olaylar) {
  const s = d.arastirma.suren
  if (!s || d.zaman < s.bitis - EPS) return
  arastirmaBitir(d, olaylar)
}

function arastirmaBitir(d, olaylar) {
  const s = d.arastirma.suren
  const a = arastirmaBilgi(s.kod)
  d.arastirma.sv[s.kod] = (d.arastirma.sv[s.kod] || 0) + 1
  d.arastirma.suren = null
  yay(olaylar, { tip: 'arastirmaBitti', kod: s.kod, sv: d.arastirma.sv[s.kod] })
  if (a) xpVer(d, 60 * a.tier, 'arastirma', olaylar)
  for (const k of Object.keys(d.bolgeler)) enIyiGuncelle(d, d.bolgeler[k])
  isaretle(d, true)
}

// ---- Günlük misyonlar ----

// Basit dize özeti (tarihe göre seçim için)
function ozet(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

export function misyonIlerleme(d, m) {
  const t = MISYONLAR.find((x) => x.kod === m.kod)
  if (!t) return { simdi: 0, hedef: 1, metin: '' }
  const simdi = Math.max(0, Math.min(m.n, (d.istatistik[t.sayac] || 0) - m.bas))
  return { simdi, hedef: m.n, metin: t.metin.replace('{n}', m.n) }
}

// ---- Prestij ----

export function prestijUygun(d) {
  let usta = 0
  for (const k of Object.keys(d.bolgeler)) if (d.bolgeler[k].usta) usta++
  return d.oyuncu.lv >= PRESTIJ.lv && usta >= PRESTIJ.usta
}

function prestijKontrol(d, olaylar) {
  if (d.prestij.hazirGoruldu || !prestijUygun(d)) return
  d.prestij.hazirGoruldu = true
  hikayeEkle(d, 'prestij-hazir', olaylar)
}

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
    const acilan = (ACILIMLAR[o.lv] || []).slice()
    yay(olaylar, { tip: 'seviyeAtladi', lv: o.lv, elmas, acilan })
    for (const k of acilan) if (BOLGE[k]) hikayeEkle(d, k + '-acik', olaylar)
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
    d.istatistik.kademe += kademeler.length
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
    b.yetenekSay = (b.yetenekSay || 0) + 1
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
    d.istatistik.takviye++
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
    const once = o.bitti
    if (v.bitti === true || o.adim >= OGRETICI_SON_ADIM) o.bitti = true
    yay(olaylar, { tip: 'ogretici', adim: o.adim, bitti: o.bitti })
    if (o.bitti && !once) hikayeEkle(d, 'ogretici', olaylar)
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

  // Hazır görevin ödülünü al, sıradaki göreve geç
  gorevAl(d, b, v, olaylar) {
    const gv = b.gorev
    if (gv.sira >= GOREVLER.length) return RED('maks')
    if (!gv.hazir) {
      // Koşul az önce sağlandıysa (0,5 sn'lik kontrol beklenmeden) hazır say
      const il = gorevIlerleme(d, b, gv.sira)
      if (il.simdi < il.hedef) return RED('kilit')
    }
    const odul = gorevOdulu(d, b, gv.sira)
    const sira = gv.sira
    d.oyuncu.elmas += odul.elmas
    if (odul.para > 0) { b.para += odul.para; b.toplamKazanc += odul.para; yay(olaylar, { tip: 'paraDegisti' }) }
    gv.sira++
    gv.hazir = false
    yay(olaylar, { tip: 'gorevTamam', sira, ...odul })
    xpVer(d, odul.xp, 'gorev', olaylar)
    const kod = bolgeKodu(d, b)
    const sahne = gorevSahnesi(kod, sira)
    if (gv.sira >= GOREVLER.length && !b.usta) {
      b.usta = true
      d.oyuncu.elmas += BOLGE_USTASI_ELMAS
      yay(olaylar, { tip: 'bolgeUstasi', bolge: kod, elmas: BOLGE_USTASI_ELMAS })
      enIyiGuncelle(d, b)
    }
    if (sahne) hikayeEkle(d, sahne, olaylar)
    gorevKontrol(d, b, olaylar)
    isaretle(d, true)
    return { ok: true, sira, ...odul }
  },

  // Ortağı elmasla bir seviye yükselt {kod}
  ortakYukselt(d, b, v, olaylar) {
    const o = ORTAKLAR.find((x) => x.kod === v.kod)
    if (!o) return RED('gecersiz')
    const L = d.ortak[o.kod] || 0
    if (L < 1) return RED('kilit')
    if (L >= ORTAK_MAKS) return RED('maks')
    const maliyet = ORTAK_MALIYET[L]
    if (d.oyuncu.elmas < maliyet) return RED('elmas')
    d.oyuncu.elmas -= maliyet
    d.ortak[o.kod] = L + 1
    yay(olaylar, { tip: 'ortakYukseldi', kod: o.kod, L: L + 1 })
    xpVer(d, 20 * L, 'ortak', olaylar)
    for (const k of Object.keys(d.bolgeler)) enIyiGuncelle(d, d.bolgeler[k])
    isaretle(d, true)
    return { ok: true, L: L + 1, maliyet }
  },

  // Hikâye sahnesi gösterildi
  hikayeGoruldu(d, b, v) {
    const h = d.hikaye
    const id = v.id
    if (typeof id !== 'string') return RED('gecersiz')
    h.bekleyen = h.bekleyen.filter((x) => x !== id)
    if (SAHNELER[id] && !h.goruldu.includes(id)) h.goruldu.push(id)
    isaretle(d, true)
    return TAMAM()
  },

  // Bölgeye geç (gerekirse aç). Ayrılınan bölge ayrilis zamanını tutar; dönüşte yöneticili zincir geliri eklenir.
  bolgeGit(d, b, v, olaylar) {
    const kod = v.kod
    const bb = BOLGE[kod]
    if (!bb) return RED('gecersiz')
    if (kod === d.aktifBolge) return TAMAM()
    let yeni = false
    if (!d.bolgeler[kod]) {
      if (d.oyuncu.lv < bb.acilisLv) return RED('kilit')
      d.bolgeler[kod] = yeniBolge(kod)
      yeni = true
    }
    b.ayrilis = d.zaman
    d.aktifBolge = kod
    const nb = d.bolgeler[kod]
    nb.acik = true
    let kazanc = 0, sure = 0
    if (nb.ayrilis !== null && nb.ayrilis !== undefined) {
      sure = Math.max(0, d.zaman - nb.ayrilis)
      kazanc = otoGelir(d, nb) * Math.min(sure, cevrimdisiSinir(d, nb))
      if (kazanc > 0 && Number.isFinite(kazanc)) { nb.para += kazanc; nb.toplamKazanc += kazanc } else kazanc = 0
    }
    nb.ayrilis = null
    hazirla(d)
    yay(olaylar, { tip: 'bolgeDegisti', bolge: kod, yeni, kazanc, sure })
    if (yeni) {
      yay(olaylar, { tip: 'bolgeAcildi', bolge: kod })
      xpVer(d, BOLGE_ACMA_XP, 'bolge', olaylar)
    }
    if (!nb.giris) {
      nb.giris = true
      hikayeEkle(d, kod + '-giris', olaylar)
    }
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, yeni, kazanc, sure }
  },

  // Lojistik: {tur: 'liman' | 'ambar'}
  lojistik(d, b, v, olaylar) {
    const tur = v.tur
    const t = tur === 'liman' ? LIMAN : tur === 'ambar' ? AMBAR : null
    if (!t) return RED('gecersiz')
    const L = b[tur] || 0
    if (L >= t.maks) return RED('maks')
    const maliyet = tur === 'liman' ? limanMaliyet(d, b, L) : ambarMaliyet(d, b, L)
    if (b.para < maliyet) return RED('para')
    b.para -= maliyet
    b[tur] = L + 1
    d.istatistik.yukseltme++
    yay(olaylar, { tip: 'lojistik', tur, L: L + 1 })
    xpVer(d, harcamaXp(d, b, maliyet), 'harcama', olaylar)
    enIyiGuncelle(d, b)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, L: L + 1, maliyet }
  },

  // Hazır kontratın ödülünü al
  kontratAl(d, b, v, olaylar) {
    const k = b.kontrat
    if (!k.hazir) return RED('kilit')
    const kd = kontratDurumu(d, b)
    const o = kd.odul
    b.para += o.para
    b.toplamKazanc += o.para
    d.oyuncu.elmas += o.elmas
    k.tamam++
    k.no++
    k.hedef = 0
    k.ilerleme = 0
    k.hazir = false
    d.istatistik.kontrat++
    yay(olaylar, { tip: 'kontratTamam', ...o, musteri: kd.musteri })
    xpVer(d, o.xp, 'kontrat', olaylar)
    kontratKur(d, b)
    gorevKontrol(d, b, olaylar)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, ...o }
  },

  // Araştırma başlat {kod}
  arastirmaBaslat(d, b, v, olaylar) {
    if (d.oyuncu.lv < 3) return RED('kilit')
    if (d.arastirma.suren) return RED('mesgul')
    const tk = arastirmaTeklif(d, v.kod)
    if (!tk) return RED('maks')
    if (!arastirmaSart(d, v.kod).ok) return RED('kilit')
    if (d.oyuncu.elmas < tk.elmas) return RED('elmas')
    d.oyuncu.elmas -= tk.elmas
    d.arastirma.suren = { kod: v.kod, bitis: d.zaman + tk.sure, sure: tk.sure, reklam: 0 }
    yay(olaylar, { tip: 'arastirmaBasladi', kod: v.kod })
    isaretle(d, true)
    return { ok: true, ...tk }
  },

  // Araştırmayı hızlandır {yontem: 'elmas' | 'reklam'}
  arastirmaHizlandir(d, b, v, olaylar) {
    const s = d.arastirma.suren
    if (!s) return RED('gecersiz')
    const kalan = Math.max(0, s.bitis - d.zaman)
    if (v.yontem === 'reklam') {
      if (s.reklam >= 2) return RED('maks')
      s.reklam++
      s.bitis -= 900
      d.istatistik.reklam++
    } else {
      const elmas = Math.max(1, Math.ceil(kalan / 60 / 5))
      if (d.oyuncu.elmas < elmas) return RED('elmas')
      d.oyuncu.elmas -= elmas
      s.bitis = d.zaman
    }
    if (d.zaman >= s.bitis - EPS) arastirmaBitir(d, olaylar)
    isaretle(d, true)
    return TAMAM()
  },

  // Günlük hediye {gun: 'YYYY-AA-GG'}
  gunlukAl(d, b, v, olaylar) {
    const gun = String(v.gun || '')
    if (!gun) return RED('gecersiz')
    if (d.gunluk.son === gun) return RED('alindi')
    const h = GUNLUK_HEDIYE[d.gunluk.seri % GUNLUK_HEDIYE.length]
    const sonuc = { ok: true, gun: d.gunluk.seri % GUNLUK_HEDIYE.length, hediye: h }
    if (h.tur === 'para') {
      const p = Math.max(gelirRef(d, b) * h.dk * 60, 100 * bolgeBilgi(d, b).olcek)
      b.para += p; b.toplamKazanc += p; sonuc.para = p
      yay(olaylar, { tip: 'paraDegisti' })
    } else if (h.tur === 'elmas') {
      d.oyuncu.elmas += h.n
    } else if (h.tur === 'takviye') {
      const z = d.zaman
      d.takviye.bitis = Math.min(Math.max(z, d.takviye.bitis) + h.dk * 60, z + TAKVIYE_MAGAZA_SINIR_SAAT * 3600)
      yay(olaylar, { tip: 'takviye', bitis: d.takviye.bitis })
    } else if (h.tur === 'yonetici') {
      const tip = YONETICI_TIPLERI[Math.floor(rastgele(d) * YONETICI_TIPLERI.length)]
      if (b.yoneticiler.length < MAKS_YONETICI) sonuc.yonetici = EYLEMLER.yoneticiTut(d, b, { tip, odeme: 'hediye', nadirlik: h.nadirlik }, olaylar).yonetici
      else { d.oyuncu.elmas += 50; sonuc.elmas = 50 }
    }
    d.gunluk.son = gun
    d.gunluk.seri++
    yay(olaylar, { tip: 'gunlukAlindi', ...sonuc })
    xpVer(d, 25, 'gunluk', olaylar)
    isaretle(d, true)
    return sonuc
  },

  // Ödüllü reklamla elmas (günde 3) {gun}
  elmasReklam(d, b, v, olaylar) {
    const gun = String(v.gun || '')
    const r = d.reklamElmas
    if (r.gun !== gun) { r.gun = gun; r.n = 0 }
    if (r.n >= 3) return RED('maks')
    r.n++
    d.oyuncu.elmas += 5
    d.istatistik.reklam++
    yay(olaylar, { tip: 'elmasKazanildi', miktar: 5 })
    isaretle(d, true)
    return { ok: true, kalan: 3 - r.n }
  },

  // Mağaza elmas harcamaları {kod}
  magazaAl(d, b, v, olaylar) {
    const u = ELMAS_HARCAMA[v.kod]
    if (!u) return RED('gecersiz')
    if (d.oyuncu.elmas < u.elmas) return RED('elmas')
    if (v.kod === 'takviye4') {
      const z = d.zaman, tavan = z + TAKVIYE_MAGAZA_SINIR_SAAT * 3600
      if (d.takviye.bitis >= tavan - EPS) return RED('maks')
      d.takviye.bitis = Math.min(Math.max(z, d.takviye.bitis) + 4 * 3600, tavan)
      yay(olaylar, { tip: 'takviye', bitis: d.takviye.bitis })
    } else if (v.kod === 'atla1' || v.kod === 'atla4') {
      const p = otoGelir(d, b) * 3600 * u.saat
      if (!(p > 0)) return RED('yonetici')
      b.para += p; b.toplamKazanc += p
      yay(olaylar, { tip: 'paraDegisti' })
      d.oyuncu.elmas -= u.elmas
      yay(olaylar, { tip: 'magazaAlindi', kod: v.kod, para: p })
      isaretle(d, true)
      return { ok: true, para: p }
    } else if (v.kod === 'yenile') {
      let n = 0
      for (const y of b.yoneticiler) if (y.hazirZaman > d.zaman && !(d.zaman < y.aktifBitis)) { y.hazirZaman = d.zaman; n++ }
      if (!n) return RED('gerek')
    }
    d.oyuncu.elmas -= u.elmas
    yay(olaylar, { tip: 'magazaAlindi', kod: v.kod })
    isaretle(d, true)
    return TAMAM()
  },

  // Günün misyonlarını kurar (gün değiştiyse) {gun}
  misyonKur(d, b, v) {
    const gun = String(v.gun || '')
    if (!gun) return RED('gecersiz')
    const m = d.misyon
    if (m.gun === gun && m.liste.length) return TAMAM()
    const zor = d.oyuncu.lv < 10 ? 0 : d.oyuncu.lv < 30 ? 1 : 2
    const havuz = MISYONLAR.slice()
    let h = ozet(gun)
    const liste = []
    while (liste.length < 3 && havuz.length) {
      const t = havuz.splice(h % havuz.length, 1)[0]
      h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0
      liste.push({ kod: t.kod, n: t.n[zor], bas: d.istatistik[t.sayac] || 0, zor, alindi: false })
    }
    m.gun = gun
    m.liste = liste
    m.bonus = false
    isaretle(d, true)
    return TAMAM()
  },

  // Misyon ödülü {i}; i = 'bonus' ise üçü bitince bonus
  misyonAl(d, b, v, olaylar) {
    const m = d.misyon
    if (v.i === 'bonus') {
      if (m.bonus || m.liste.length < 3 || !m.liste.every((x) => x.alindi)) return RED('kilit')
      m.bonus = true
      d.oyuncu.elmas += MISYON_ODUL.bonusElmas
      yay(olaylar, { tip: 'misyonTamam', bonus: true, elmas: MISYON_ODUL.bonusElmas })
      isaretle(d, true)
      return { ok: true, elmas: MISYON_ODUL.bonusElmas }
    }
    const x = m.liste[v.i]
    if (!x || x.alindi) return RED('gecersiz')
    const il = misyonIlerleme(d, x)
    if (il.simdi < il.hedef) return RED('kilit')
    x.alindi = true
    const elmas = MISYON_ODUL.elmas[x.zor], xp = MISYON_ODUL.xp[x.zor]
    d.oyuncu.elmas += elmas
    yay(olaylar, { tip: 'misyonTamam', i: v.i, elmas, xp })
    xpVer(d, xp, 'misyon', olaylar)
    isaretle(d, true)
    return { ok: true, elmas, xp }
  },

  // Haftalık etkinliği ayarlar (arayüz takvime göre çağırır) {kod, bitis}
  etkinlik(d, b, v) {
    const kod = v.kod || ''
    if (kod && !ETKINLIKLER.some((e) => e.kod === kod)) return RED('gecersiz')
    if (d.etkinlik.kod === kod && d.etkinlik.bitis === (+v.bitis || 0)) return TAMAM()
    d.etkinlik.kod = kod
    d.etkinlik.bitis = +v.bitis || 0
    for (const k of Object.keys(d.bolgeler)) enIyiGuncelle(d, d.bolgeler[k])
    isaretle(d, false)
    return TAMAM()
  },

  // Prestij: bütün bölgeleri yeniden kur, kalıcı satış bonusu al
  prestij(d, b, v, olaylar) {
    if (!prestijUygun(d)) return RED('kilit')
    for (const kod of Object.keys(d.bolgeler)) {
      const eski = d.bolgeler[kod]
      const yeni = yeniBolge(kod)
      yeni.giris = eski.giris
      d.bolgeler[kod] = yeni
    }
    d.prestij.sv++
    d.prestij.hazirGoruldu = false
    const elmas = PRESTIJ.elmas * d.prestij.sv
    d.oyuncu.elmas += elmas
    d.bekleyenCevrimdisi = null
    hazirla(d)
    yay(olaylar, { tip: 'prestijYapildi', sv: d.prestij.sv, elmas })
    hikayeEkle(d, 'prestij', olaylar, true)
    yay(olaylar, { tip: 'paraDegisti' })
    isaretle(d, true)
    return { ok: true, sv: d.prestij.sv, elmas }
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
