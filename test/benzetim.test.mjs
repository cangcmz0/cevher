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
