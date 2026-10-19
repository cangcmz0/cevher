// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as B from '../js/benzetim.js'
import * as E from '../js/ekonomi.js'
import { yeniDurum } from '../js/durum.js'
import { serilestir } from '../js/kayit.js'
import { KAZI_SURESI, HAZINE, BASARIMLAR, BASARIM_ODUL, BOLGE, PRESTIJ, GOREVLER, MAKS_YONETICI } from '../js/ayar.js'

const ADIM = B.ADIM
function kos(d, sn, olaylar = null) {
  const n = Math.round(sn / ADIM)
  for (let i = 0; i < n; i++) B.adim(d, ADIM, olaylar)
}
function zenginDurum(tohum = 42) {
  const d = yeniDurum(0, tohum)
  const b = d.bolgeler.zonguldak
  b.para = 1e7
  d.oyuncu.elmas = 1000
  B.hazirla(d)
  for (let i = 1; i < 4; i++) B.eylem(d, 'madenAc', { i })
  for (const ist of ['m0', 'm1', 'm2', 'm3', 'asansor', 'depo']) B.eylem(d, 'yoneticiTut', { tip: ist[0] === 'm' ? 'maden' : ist, odeme: 'elmas', istasyon: ist })
  return d
}

test('belirlenimcilik: aynı tohum ve eylemler aynı kaydı verir', () => {
  const calistir = () => {
    const d = yeniDurum(1000, 7)
    d.bolgeler.zonguldak.para = 1e6
    d.oyuncu.elmas = 500
    B.hazirla(d)
    for (let s = 0; s < 600; s += 5) {
      B.eylem(d, 'dokun', { istasyon: 'm0' })
      B.eylem(d, 'dokun', { istasyon: 'asansor' })
      B.eylem(d, 'dokun', { istasyon: 'depo' })
      if (s % 60 === 0) B.eylem(d, 'yukselt', { istasyon: 'm0', adet: 10 })
      if (s === 120) B.eylem(d, 'yoneticiTut', { tip: 'maden', odeme: 'para' })
      if (s === 180) B.eylem(d, 'madenAc', { i: 1 })
      if (s === 240) B.eylem(d, 'yoneticiTut', { tip: 'asansor', odeme: 'elmas' })
      kos(d, 5)
    }
    return serilestir(d)
  }
  assert.equal(calistir(), calistir())
})

test('korunum: üretilen = yığınlar + kabin + depo + yoldaki + satılan; para = satılan × çarpan', () => {
  const d = zenginDurum()
  const b = d.bolgeler.zonguldak
  assert.equal(b.yoneticiler.filter((y) => y.atanan).length, 6)
  const para0 = b.para
  const c = d.calisma
  c.uretilen = 0; c.satilan = 0
  const ilk = b.madenler.reduce((s, m) => s + m.yigin, 0) + b.asansor.yuk + b.depo.stok
  kos(d, 300)
  const sonToplam = b.madenler.reduce((s, m) => s + m.yigin, 0) + b.asansor.yuk + b.depo.stok + b.depo.yoldaki + c.satilan
  assert.ok(Math.abs(ilk + c.uretilen - sonToplam) / Math.max(1, sonToplam) < 1e-9)
  const carp = E.satisCarpani(d)
  assert.ok(Math.abs((b.para - para0) - c.satilan * carp) / Math.max(1, b.para - para0) < 1e-9)
})

test('elle kazı: bir dokunuş tam olarak hız × 3 sn üretir', () => {
  const d = yeniDurum(0, 3)
  B.hazirla(d)
  const b = d.bolgeler.zonguldak
  const r = B.eylem(d, 'dokun', { istasyon: 'm0' })
  assert.ok(r.ok)
  kos(d, 5)
  assert.ok(Math.abs(b.madenler[0].yigin - E.madenUretim(d, b, 0) * E.uretimCarpani(d, b, 0) * KAZI_SURESI) < 1e-9)
})

test('asansör: yukarıdan aşağı ziyaret, kapasite, boş yığını atlar, dolunca döner', () => {
  const d = yeniDurum(0, 5)
  const b = d.bolgeler.zonguldak
  b.para = 1e6
  B.hazirla(d)
  B.eylem(d, 'madenAc', { i: 1 })
  B.eylem(d, 'madenAc', { i: 2 })
  b.madenler[0].yigin = 0
  b.madenler[1].yigin = 15
  b.madenler[2].yigin = 30
  const olaylar = []
  B.eylem(d, 'dokun', { istasyon: 'asansor' })
  kos(d, 30, olaylar)
  const duraklar = olaylar.filter((o) => o.tip === 'asansorDurak').map((o) => o.kat)
  assert.deepEqual(duraklar, [1, 2])   // Maden 1 boş: atlandı
  const kap = E.asansorKap(d, b)
  assert.equal(kap, 20)
  assert.ok(Math.abs(b.madenler[2].yigin - 25) < 1e-9)  // 15 + 5 alındı, kalan 25
  assert.ok(Math.abs(b.depo.stok + b.depo.yoldaki - 20) < 1e-9)
})

test('depo dolu boşaltmayı durdurur; üretim yığın kapasitesinde durur', () => {
  const d = yeniDurum(0, 9)
  const b = d.bolgeler.zonguldak
  B.hazirla(d)
  b.yoneticiler.push({ id: 'y1', tip: 'maden', nadirlik: 0, yetenek: 'kazi', ad: 'Ali', tohum: 1, atanan: 'm0', aktifBitis: 0, hazirZaman: 0 })
  b.yoneticiler.push({ id: 'y2', tip: 'asansor', nadirlik: 0, yetenek: 'hizli', ad: 'Veli', tohum: 2, atanan: 'asansor', aktifBitis: 0, hazirZaman: 0 })
  B.hazirla(d)
  kos(d, 1500)
  const dKap = E.depoKap(d, b)
  assert.ok(b.depo.stok <= dKap + 1e-9)
  assert.ok(Math.abs(b.depo.stok - dKap) < 1e-6)
  assert.ok(b.madenler[0].yigin <= E.yiginKap(d, b, 0) + 1e-9)
  kos(d, 600)
  assert.ok(Math.abs(b.madenler[0].yigin - E.yiginKap(d, b, 0)) < 1e-6)
})

test('darboğaz 3 sn sonra kalkar, 5 sn sonra iner', () => {
  const d = zenginDurum(11)
  const b = d.bolgeler.zonguldak
  b.madenler[0].L = 300
  B.hazirla(d)
  const olaylar = []
  let kalkis = null
  for (let t = 0; t < 30 && kalkis === null; t += ADIM) {
    B.adim(d, ADIM, olaylar)
    if (d.calisma.darbogaz === 'asansor') kalkis = t
  }
  assert.ok(kalkis !== null && kalkis >= 2.9, 'kalkış ' + kalkis)
  b.madenler[0].L = 1
  b.asansor.L = 800
  b.depo.L = 800
  for (const m of b.madenler) m.yigin = 0
  let inis = null
  for (let t = 0; t < 30 && inis === null; t += ADIM) {
    B.adim(d, ADIM, olaylar)
    if (d.calisma.darbogaz === null) inis = t
  }
  assert.ok(inis !== null && inis >= 4.9, 'iniş ' + inis)
})

test('yetenek süresi ve bekleme', () => {
  const d = zenginDurum(13)
  const b = d.bolgeler.zonguldak
  const y = b.yoneticiler.find((x) => x.atanan === 'm0')
  const n = [120, 180, 300][y.nadirlik], bek = [600, 600, 900][y.nadirlik]
  assert.ok(B.eylem(d, 'yetenek', { istasyon: 'm0' }).ok)
  assert.equal(B.eylem(d, 'yetenek', { istasyon: 'm0' }).ok, false)
  kos(d, n - 1)
  assert.equal(E.yetenekDurum(d, y).durum, 'aktif')
  kos(d, 2)
  assert.equal(E.yetenekDurum(d, y).durum, 'bekleme')
  kos(d, bek)
  assert.equal(E.yetenekDurum(d, y).durum, 'hazir')
})

test('nadirlik dağılımı 10 bin denemede oranlara uyar', () => {
  const d = yeniDurum(0, 2024)
  B.hazirla(d)
  const b = d.bolgeler.zonguldak
  const say = [0, 0, 0]
  for (let k = 0; k < 10000; k++) {
    b.para = 1e300
    b.kiralanan.maden = 0
    b.yoneticiler.length = 0
    const r = B.eylem(d, 'yoneticiTut', { tip: 'maden', odeme: 'para' })
    say[r.yonetici.nadirlik]++
  }
  const oran = say.map((x) => x / 10000)
  assert.ok(Math.abs(oran[0] - 0.70) < 0.015, oran)
  assert.ok(Math.abs(oran[1] - 0.25) < 0.015, oran)
  assert.ok(Math.abs(oran[2] - 0.05) < 0.015, oran)
})

test('adım süresi ≤ 0.2 ms (12 maden)', () => {
  const d = yeniDurum(0, 77)
  const b = d.bolgeler.zonguldak
  b.para = 1e30
  B.hazirla(d)
  for (let i = 1; i < 12; i++) B.eylem(d, 'madenAc', { i })
  d.oyuncu.elmas = 1e6
  for (let i = 0; i < 12; i++) B.eylem(d, 'yoneticiTut', { tip: 'maden', odeme: 'elmas', istasyon: 'm' + i })
  B.eylem(d, 'yoneticiTut', { tip: 'asansor', odeme: 'elmas' })
  B.eylem(d, 'yoneticiTut', { tip: 'depo', odeme: 'elmas' })
  kos(d, 10)
  const t0 = performance.now()
  kos(d, 200)
  const ms = (performance.now() - t0) / (200 / ADIM)
  assert.ok(ms <= 0.2, ms + ' ms')
})

test('görev zinciri: koşul sağlanınca hazır olur, ödül verilir, sıradakine geçer', () => {
  const d = yeniDurum(0, 21)
  const b = d.bolgeler.zonguldak
  b.para = 1e6
  B.hazirla(d)
  assert.equal(B.eylem(d, 'gorevAl', {}).ok, false)
  B.eylem(d, 'yukselt', { istasyon: 'm0', adet: 10 })
  const olaylar = []
  kos(d, 1, olaylar)
  assert.ok(olaylar.some((o) => o.tip === 'gorevHazir' && o.sira === 0))
  assert.equal(b.gorev.hazir, true)
  const e0 = d.oyuncu.elmas
  const r = B.eylem(d, 'gorevAl', {}, olaylar)
  assert.ok(r.ok)
  assert.equal(d.oyuncu.elmas - e0 >= 5, true)
  assert.equal(b.gorev.sira, 1)
  assert.equal(b.gorev.hazir, false)
  // Görev 6 (Maden 1 → 25) para ödülü verir
  const g = B.gorevOdulu(d, b, 5)
  assert.ok(g.para >= 50)
})

test('hikâye: yeni oyun girişle başlar, görev sahnesi kuyruğa girer, görüldü işaretlenir', () => {
  const d = yeniDurum(0, 31)
  assert.deepEqual(d.hikaye.bekleyen, ['giris'])
  B.hazirla(d)
  B.eylem(d, 'hikayeGoruldu', { id: 'giris' })
  assert.deepEqual(d.hikaye.bekleyen, [])
  assert.ok(d.hikaye.goruldu.includes('giris'))
  d.bolgeler.zonguldak.para = 1e6
  B.eylem(d, 'yukselt', { istasyon: 'm0', adet: 10 })
  const olaylar = []
  B.eylem(d, 'gorevAl', {}, olaylar)
  assert.ok(olaylar.some((o) => o.tip === 'hikaye' && o.id === 'zonguldak-1'))
  assert.ok(d.hikaye.bekleyen.includes('zonguldak-1'))
  // aynı sahne ikinci kez eklenmez
  assert.equal(B.hikayeEkle(d, 'zonguldak-1', null), false)
})

test('görev metinleri bölgeye göre: başlık, koşul ve 15 görev', () => {
  const d = zenginDurum(33)
  const g = B.gorevDurumu(d, d.bolgeler.zonguldak)
  assert.equal(g.toplam, 15)
  assert.equal(g.baslik, 'Ocağı Uyandır')
  assert.equal(g.metin, '2. Katı 5. seviyeye çıkar')
})

test('bölge: seviye yetmezse kilitli; bedel önceki bölgenin kasasından; açılınca geçilir, dönüşte yöneticili gelir eklenir', () => {
  const d = zenginDurum(34)
  assert.equal(B.eylem(d, 'bolgeGit', { kod: 'eregli' }).sebep, 'kilit')
  d.oyuncu.lv = 15
  assert.equal(B.eylem(d, 'bolgeGit', { kod: 'eregli' }).sebep, 'para')
  assert.equal(B.bolgeAcilis(d, 'eregli').durum, 'para')
  assert.equal(B.eylem(d, 'bolgeGit', { kod: 'karabuk' }).sebep, 'kilit')
  d.oyuncu.lv = 30
  assert.equal(B.bolgeAcilis(d, 'karabuk').durum, 'sira')
  d.bolgeler.zonguldak.para += BOLGE.eregli.bedel
  const kasa = d.bolgeler.zonguldak.para
  const olaylar = []
  const r = B.eylem(d, 'bolgeGit', { kod: 'eregli' }, olaylar)
  assert.ok(r.ok && r.yeni)
  assert.equal(d.aktifBolge, 'eregli')
  assert.equal(d.calisma.bolge, 'eregli')
  assert.equal(d.bolgeler.eregli.para, 20 * 1e3)
  assert.equal(d.bolgeler.zonguldak.para, kasa - BOLGE.eregli.bedel)
  assert.ok(olaylar.some((o) => o.tip === 'hikaye' && o.id === 'eregli-giris'))
  const zg = E.otoGelir(d, d.bolgeler.zonguldak)
  assert.ok(zg > 0)
  const p0 = d.bolgeler.zonguldak.para
  kos(d, 60)
  const r2 = B.eylem(d, 'bolgeGit', { kod: 'zonguldak' })
  assert.ok(r2.ok)
  assert.ok(Math.abs(d.bolgeler.zonguldak.para - p0 - zg * 60) / (zg * 60) < 0.05, r2.kazanc + ' / ' + zg * 60)
})

test('kontrat: hedef kurulur, satışla dolar, ödül alınır', () => {
  const d = zenginDurum(35)
  const b = d.bolgeler.zonguldak
  kos(d, 1)
  assert.ok(b.kontrat.hedef > 0)
  const kd = B.kontratDurumu(d, b)
  assert.equal(kd.musteri, 'Ereğli Çelik Fabrikası')
  assert.equal(B.eylem(d, 'kontratAl', {}).ok, false)
  const olaylar = []
  kos(d, 60 * 12, olaylar)
  assert.ok(b.kontrat.hazir, b.kontrat.ilerleme + ' / ' + b.kontrat.hedef)
  assert.ok(olaylar.some((o) => o.tip === 'kontratHazir'))
  const e0 = d.oyuncu.elmas
  const r = B.eylem(d, 'kontratAl', {})
  assert.ok(r.ok && r.para > 0)
  assert.equal(d.oyuncu.elmas - e0, 5)
  assert.equal(b.kontrat.tamam, 1)
  assert.equal(b.kontrat.no, 1)
  assert.ok(b.kontrat.hedef > 0)
})

test('lojistik: liman satışı artırır, ambar çevrimdışı sınırını uzatır', () => {
  const d = zenginDurum(36)
  const b = d.bolgeler.zonguldak
  const s0 = E.satisKalici(d, b)
  const c0 = E.cevrimdisiSinir(d, b)
  assert.ok(B.eylem(d, 'lojistik', { tur: 'liman' }).ok)
  assert.ok(B.eylem(d, 'lojistik', { tur: 'ambar' }).ok)
  assert.equal(b.liman, 1)
  assert.ok(Math.abs(E.satisKalici(d, b) / s0 - 1.08) < 1e-9)
  assert.equal(E.cevrimdisiSinir(d, b) - c0, 15 * 60)
})

test('araştırma: elmasla başlar, süre dolunca seviye artar', () => {
  const d = zenginDurum(37)
  d.oyuncu.lv = 1
  assert.equal(B.eylem(d, 'arastirmaBaslat', { kod: 'kazma' }).sebep, 'kilit')
  d.oyuncu.lv = 3
  const e0 = d.oyuncu.elmas
  assert.ok(B.eylem(d, 'arastirmaBaslat', { kod: 'kazma' }).ok)
  assert.equal(e0 - d.oyuncu.elmas, 5)
  assert.equal(B.eylem(d, 'arastirmaBaslat', { kod: 'halat' }).sebep, 'mesgul')
  const olaylar = []
  kos(d, 121, olaylar)
  assert.equal(E.ar(d, 'kazma'), 1)
  assert.ok(olaylar.some((o) => o.tip === 'arastirmaBitti'))
  assert.ok(B.eylem(d, 'arastirmaBaslat', { kod: 'kazma' }).ok)
  assert.ok(B.eylem(d, 'arastirmaHizlandir', { yontem: 'elmas' }).ok)
  assert.equal(E.ar(d, 'kazma'), 2)
})

test('günlük hediye ve misyonlar', () => {
  const d = zenginDurum(38)
  assert.ok(B.eylem(d, 'gunlukAl', { gun: '2026-10-06' }).ok)
  assert.equal(B.eylem(d, 'gunlukAl', { gun: '2026-10-06' }).sebep, 'alindi')
  assert.ok(B.eylem(d, 'gunlukAl', { gun: '2026-10-07' }).ok)
  B.eylem(d, 'misyonKur', { gun: '2026-10-06' })
  assert.equal(d.misyon.liste.length, 3)
  assert.equal(new Set(d.misyon.liste.map((m) => m.kod)).size, 3)
  const m = d.misyon.liste[0]
  assert.equal(B.eylem(d, 'misyonAl', { i: 0 }).sebep, 'kilit')
  const sayac = { dokun: 'dokunus', yukselt: 'yukseltme', yetenek: 'yetenek', satis: 'satis', kademe: 'kademe', kontrat: 'kontrat', takviye: 'takviye' }[m.kod]
  d.istatistik[sayac] += m.n
  assert.ok(B.eylem(d, 'misyonAl', { i: 0 }).ok)
})

test('prestij: tur kazancına göre mühür; her şey baştan başlar, kalıcılar korunur', () => {
  const d = zenginDurum(39)
  d.ogretici.bitti = true
  assert.equal(B.eylem(d, 'prestij', {}).sebep, 'kilit')
  // mühür formülü: eşikte 1, eşiğin altında 0, kazançla artar
  assert.equal(E.muhurKazanci(PRESTIJ.esik * 0.99), 0)
  assert.equal(E.muhurKazanci(PRESTIJ.esik), 1)
  assert.ok(E.muhurKazanci(PRESTIJ.esik * 1e6) > E.muhurKazanci(PRESTIJ.esik * 1e3))
  for (const n of [1, 7, 50, 1234]) assert.equal(E.muhurKazanci(E.muhurEsigi(n)), n)
  // iki bölgelik bir tur: Ereğli açık, elmasla tutulan ustabaşılar kalıcı
  d.oyuncu.lv = 40
  d.bolgeler.zonguldak.usta = true
  d.bolgeler.eregli = JSON.parse(JSON.stringify(d.bolgeler.zonguldak))
  d.bolgeler.zonguldak.toplamKazanc = E.muhurEsigi(30)
  d.bolgeler.eregli.toplamKazanc = 0
  d.bolgeler.eregli.yoneticiler[0].kalici = false
  d.aktifBolge = 'eregli'
  B.hazirla(d)
  const olaylar = []
  kos(d, 1, olaylar)
  assert.ok(olaylar.some((o) => o.tip === 'hikaye' && o.id === 'prestij-hazir'))
  const bekleyen = B.bekleyenMuhur(d)
  assert.ok(bekleyen >= 30)
  const elmas0 = d.oyuncu.elmas, ar0 = JSON.stringify(d.arastirma), lv0 = d.oyuncu.lv
  const kalicilar = d.bolgeler.zonguldak.yoneticiler.length + d.bolgeler.eregli.yoneticiler.length - 1
  const r = B.eylem(d, 'prestij', {})
  assert.ok(r.ok)
  assert.equal(r.muhur, bekleyen)
  assert.equal(d.prestij.sv, 1)
  assert.equal(d.prestij.muhur, bekleyen)
  assert.ok(Math.abs(E.prestijCarpani(d) - (1 + PRESTIJ.etki * bekleyen)) < 1e-9)
  // baştan: yalnız Zonguldak, tek kat, başlangıç parası
  assert.deepEqual(Object.keys(d.bolgeler), ['zonguldak'])
  assert.equal(d.aktifBolge, 'zonguldak')
  assert.equal(d.bolgeler.zonguldak.madenler.length, 1)
  assert.equal(d.bolgeler.zonguldak.para, 20)
  assert.equal(d.bolgeler.zonguldak.gorev.sira, 0)
  assert.equal(E.turKazanc(d), 0)
  // kalanlar: seviye, elmas, araştırma; kalıcı ustabaşılar en çok MAKS_YONETICI, ilk kat/asansör/depo atanmış
  assert.equal(d.oyuncu.lv, lv0)
  assert.equal(d.oyuncu.elmas, elmas0)
  assert.equal(JSON.stringify(d.arastirma), ar0)
  const yl = d.bolgeler.zonguldak.yoneticiler
  assert.equal(yl.length, Math.min(MAKS_YONETICI, kalicilar))
  assert.equal(new Set(yl.map((y) => y.id)).size, yl.length)
  for (const ist of ['m0', 'asansor', 'depo']) assert.ok(yl.some((y) => y.atanan === ist), ist)
  assert.ok(yl.filter((y) => y.atanan).length === 3)
  // yeni turda mühür yok, prestij yeniden kilitli
  assert.equal(B.bekleyenMuhur(d), 0)
  assert.equal(B.eylem(d, 'prestij', {}).sebep, 'kilit')
  assert.ok(d.istatistik.prestijKazanc >= E.muhurEsigi(30))
})

test('prestij: görev elması yalnız ilk kez, bölge ustası elması yalnız ilk kez', () => {
  const d = zenginDurum(41)
  const b = d.bolgeler.zonguldak
  const g0 = B.gorevOdulu(d, b, 0)
  assert.equal(g0.elmas, GOREVLER[0].elmas)
  d.prestij.gorevRekor.zonguldak = 3
  assert.equal(B.gorevOdulu(d, b, 0).elmas, 0)
  assert.equal(B.gorevOdulu(d, b, 2).elmas, 0)
  assert.equal(B.gorevOdulu(d, b, 3).elmas, GOREVLER[3].elmas)
  // görev alınınca rekor ilerler
  b.madenler[0].L = 5
  const e0 = d.oyuncu.elmas
  d.prestij.gorevRekor.zonguldak = 0
  assert.ok(B.eylem(d, 'gorevAl', {}).ok)
  assert.equal(d.oyuncu.elmas, e0 + GOREVLER[0].elmas)
  assert.equal(d.prestij.gorevRekor.zonguldak, 1)
})

test('prestij: eski kayıt mühüre çevrilir, görev rekoru ve kalıcı ustabaşı onarılır', async () => {
  const { coz } = await import('../js/kayit.js')
  const d = zenginDurum(43)
  d.bolgeler.zonguldak.gorev.sira = 6
  const o = JSON.parse(serilestir(d))
  o.prestij = { sv: 2, hazirGoruldu: true }
  o.bolgeler.zonguldak.yoneticiler.forEach((y, i) => { delete y.kalici; y.nadirlik = i === 0 ? 2 : 0 })
  const k = coz(JSON.stringify(o))
  assert.equal(k.prestij.muhur, 2 * PRESTIJ.eskiSv)
  assert.ok(Math.abs(E.prestijCarpani(k) - 2) < 1e-9)
  assert.equal(k.prestij.gorevRekor.zonguldak, 6)
  assert.equal(k.bolgeler.zonguldak.yoneticiler[0].kalici, true)
  assert.equal(k.bolgeler.zonguldak.yoneticiler[1].kalici, false)
  // yeni kayıt mühürünü korur
  const y = coz(serilestir(k))
  assert.equal(y.prestij.muhur, 2 * PRESTIJ.eskiSv)
})

test('ortaklar: Ahmet baştan, Mehmet öğretici sonunda katılır; elmasla seviye atlar', () => {
  const d = yeniDurum(0, 41)
  B.hazirla(d)
  assert.equal(d.ortak.ahmet, 1)
  assert.equal(d.ortak.mehmet, 0)
  assert.ok(Math.abs(E.ortakEtki(d, 'uretim') - 0.25) < 1e-12)
  const olaylar = []
  B.eylem(d, 'ogretici', { bitti: true }, olaylar)
  assert.equal(d.ortak.mehmet, 1)
  assert.ok(olaylar.some((o) => o.tip === 'ortakKatildi' && o.kod === 'mehmet'))
  assert.equal(B.eylem(d, 'ortakYukselt', { kod: 'ahmet' }).sebep, 'elmas')
  d.oyuncu.elmas = 100
  assert.ok(B.eylem(d, 'ortakYukselt', { kod: 'ahmet' }).ok)
  assert.equal(d.oyuncu.elmas, 70)
  assert.ok(Math.abs(E.ortakEtki(d, 'uretim') - 0.30) < 1e-12)
  assert.equal(B.eylem(d, 'ortakYukselt', { kod: 'elif' }).sebep, 'kilit')
})

test('hazine damarı: öğretici bitince belirir, dokununca ödül verir, süresi dolunca söner', () => {
  const d = zenginDurum(5)
  const b = d.bolgeler.zonguldak
  const olaylar = []
  // Öğretici bitmeden çıkmaz
  kos(d, HAZINE.ilk + 15, olaylar)
  assert.equal(d.calisma.hazine, null)
  B.eylem(d, 'ogretici', { bitti: true })
  kos(d, 12, olaylar)
  const h = d.calisma.hazine
  assert.ok(h, 'damar belirmeli')
  assert.ok(h.kat >= 0 && h.kat < b.madenler.length)
  assert.ok(['altin', 'elmas'].includes(h.tur))
  assert.ok(olaylar.some((o) => o.tip === 'hazineCikti' && o.kat === h.kat))
  // Altın damarı: gelirin HAZINE.saniye katı
  h.tur = 'altin'
  const deger = B.hazineDegeri(d, b)
  assert.ok(deger >= HAZINE.taban)
  assert.ok(Math.abs(deger - Math.max(HAZINE.taban, Math.round(Math.max(E.otoGelir(d, b), d.calisma.gelirEma) * HAZINE.saniye))) < 1e-9)
  const para0 = b.para
  const r = B.eylem(d, 'hazineAl', {}, olaylar)
  assert.ok(r.ok)
  assert.equal(r.para, deger)
  assert.equal(b.para, para0 + deger)
  assert.equal(d.istatistik.hazine, 1)
  assert.equal(d.calisma.hazine, null)
  assert.equal(B.eylem(d, 'hazineAl', {}).sebep, 'yok')
  // Sonraki damar ara kadar sonra; elmas damarı elmas verir
  kos(d, HAZINE.omur + HAZINE.araMaks + 2, olaylar)
  const h2 = d.calisma.hazine
  assert.ok(h2, 'ikinci damar belirmeli')
  h2.tur = 'elmas'
  const e0 = d.oyuncu.elmas
  const r2 = B.eylem(d, 'hazineAl', {})
  assert.ok(r2.elmas >= HAZINE.elmasMin && r2.elmas <= HAZINE.elmasMaks)
  assert.equal(d.oyuncu.elmas, e0 + r2.elmas)
  // Dokunulmayan damar söner
  kos(d, HAZINE.omur + HAZINE.araMaks + 2)
  assert.ok(d.calisma.hazine)
  const ol2 = []
  kos(d, HAZINE.omur + 1, ol2)
  assert.ok(ol2.some((o) => o.tip === 'hazineKayboldu'))
})

test('hazine damarı: tek açık katta çıkmaz, kayda girmez', () => {
  const d = yeniDurum(0, 9)
  B.hazirla(d)
  B.eylem(d, 'ogretici', { bitti: true })
  kos(d, HAZINE.ilk + 60)
  assert.equal(d.calisma.hazine, null)
  const z = zenginDurum(11)
  B.eylem(z, 'ogretici', { bitti: true })
  kos(z, HAZINE.ilk + 12)
  assert.ok(z.calisma.hazine)
  assert.ok(!serilestir(z).includes('hazineSonraki'))
})

test('başarımlar: eşik geçilince duyurulur, ödül kademe kademe alınır', () => {
  const d = zenginDurum(13)
  // Oyun içinde geçilen eşik duyurulur
  const ilk = []
  kos(d, 1, ilk)
  assert.ok(ilk.some((o) => o.tip === 'basarimHazir' && o.kod === 'yonetici' && o.kademe === 1))
  // Kayıt yeniden yüklenince (hazirla) zaten alınabilir olan tekrar duyurulmaz
  B.hazirla(d)
  const olaylar = []
  kos(d, 1, olaylar)
  const yon = BASARIMLAR.find((t) => t.kod === 'yonetici')
  // zenginDurum 6 yönetici tuttu (elmasla): ilk kademe (3) alınabilir
  assert.ok(d.istatistik.yonetici >= 6)
  const il = B.basarimIlerleme(d, yon)
  assert.equal(il.kademe, 0)
  assert.ok(il.alinabilir)
  assert.ok(!olaylar.some((o) => o.tip === 'basarimHazir' && o.kod === 'yonetici'))
  assert.equal(B.eylem(d, 'basarimAl', { kod: 'dokunus' }).sebep, 'kilit')
  for (let i = 0; i < 100; i++) B.eylem(d, 'dokun', { istasyon: 'm0' }) // yöneticili: sayılmaz
  d.istatistik.dokunus = 99
  kos(d, 1, olaylar)
  assert.ok(!olaylar.some((o) => o.tip === 'basarimHazir' && o.kod === 'dokunus'))
  d.istatistik.dokunus = 100
  kos(d, 1, olaylar)
  assert.ok(olaylar.some((o) => o.tip === 'basarimHazir' && o.kod === 'dokunus' && o.kademe === 1))
  // Ödül: elmas + XP, kademe artar
  const e0 = d.oyuncu.elmas
  const r = B.eylem(d, 'basarimAl', { kod: 'yonetici' })
  assert.ok(r.ok)
  assert.equal(r.kademe, 1)
  assert.equal(d.oyuncu.elmas, e0 + BASARIM_ODUL.elmas[0])
  assert.equal(d.basarim.al.yonetici, 1)
  // İkinci kademe (10) henüz yok
  assert.equal(B.eylem(d, 'basarimAl', { kod: 'yonetici' }).sebep, 'kilit')
  assert.equal(B.eylem(d, 'basarimAl', { kod: 'yok-boyle' }).sebep, 'gecersiz')
})

test('başarımlar: prestij ilerlemeyi geri almaz, kayıtta korunur ve onarılır', async () => {
  const { coz } = await import('../js/kayit.js')
  const d = zenginDurum(17)
  kos(d, 1)
  const kat = BASARIMLAR.find((t) => t.kod === 'kat')
  assert.equal(B.basarimDeger(d, 'kat'), 4)
  // rekor kaydedilir; kat sayısı düşse de ilerleme kalır
  d.bolgeler.zonguldak.madenler.length = 1
  assert.equal(B.basarimIlerleme(d, kat).deger, 4)
  // kazanç: prestijde biriken toplam korunur
  d.istatistik.prestijKazanc = 5e5
  assert.ok(B.basarimDeger(d, 'kazanc') >= 5e5)
  d.basarim.al.kazanc = 1
  const k = coz(serilestir(d))
  assert.equal(k.basarim.al.kazanc, 1)
  assert.equal(k.basarim.rekor.kat, 4)
  // bozuk kayıt onarılır
  const bozuk = JSON.parse(serilestir(d))
  bozuk.basarim = { al: { kazanc: 99, yabanci: 3, seviye: -2 }, rekor: { kat: 'x', satis: 12 } }
  const o = coz(JSON.stringify(bozuk))
  assert.equal(o.basarim.al.kazanc, BASARIMLAR.find((t) => t.kod === 'kazanc').esik.length)
  assert.equal(o.basarim.al.yabanci, undefined)
  assert.equal(o.basarim.al.seviye, undefined)
  assert.equal(o.basarim.rekor.kat, undefined)
  assert.equal(o.basarim.rekor.satis, 12)
})
