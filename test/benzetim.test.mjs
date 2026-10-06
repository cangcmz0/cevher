import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as B from '../js/benzetim.js'
import * as E from '../js/ekonomi.js'
import { yeniDurum } from '../js/durum.js'
import { serilestir } from '../js/kayit.js'
import { KAZI_SURESI } from '../js/ayar.js'

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
  assert.ok(Math.abs(b.madenler[0].yigin - E.madenUretim(d, b, 0) * KAZI_SURESI) < 1e-9)
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

test('bölge: seviye yetmezse kilitli; açılınca geçilir, dönüşte yöneticili gelir eklenir', () => {
  const d = zenginDurum(34)
  assert.equal(B.eylem(d, 'bolgeGit', { kod: 'eregli' }).sebep, 'kilit')
  d.oyuncu.lv = 15
  const olaylar = []
  const r = B.eylem(d, 'bolgeGit', { kod: 'eregli' }, olaylar)
  assert.ok(r.ok && r.yeni)
  assert.equal(d.aktifBolge, 'eregli')
  assert.equal(d.calisma.bolge, 'eregli')
  assert.equal(d.bolgeler.eregli.para, 20 * 1e3)
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

test('prestij: koşul sağlanınca bölgeler sıfırlanır, satış bonusu kalıcı', () => {
  const d = zenginDurum(39)
  assert.equal(B.eylem(d, 'prestij', {}).sebep, 'kilit')
  d.oyuncu.lv = 40
  d.bolgeler.zonguldak.usta = true
  d.bolgeler.eregli = JSON.parse(JSON.stringify(d.bolgeler.zonguldak))
  const olaylar = []
  kos(d, 1, olaylar)
  assert.ok(olaylar.some((o) => o.tip === 'hikaye' && o.id === 'prestij-hazir'))
  const s0 = E.prestijCarpani(d)
  const r = B.eylem(d, 'prestij', {})
  assert.ok(r.ok)
  assert.equal(d.prestij.sv, 1)
  assert.equal(E.prestijCarpani(d) / s0, 1.5)
  assert.equal(d.bolgeler.zonguldak.madenler.length, 1)
  assert.equal(d.bolgeler.zonguldak.yoneticiler.length, 0)
  assert.equal(d.oyuncu.lv, 40)
})
