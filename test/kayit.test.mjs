import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as K from '../js/kayit.js'
import * as B from '../js/benzetim.js'
import { yeniDurum, dogrula } from '../js/durum.js'

function bellekDepo(ilk = {}) {
  const m = new Map(Object.entries(ilk))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }
}
const fikstur = (ad) => readFileSync(new URL('./kayitlar/' + ad, import.meta.url), 'utf8')

test('gidiş dönüş', () => {
  const d = yeniDurum(1000, 3)
  d.bolgeler.zonguldak.para = 1234.5
  B.hazirla(d)
  B.eylem(d, 'dokun', { istasyon: 'm0' })
  for (let i = 0; i < 100; i++) B.adim(d, B.ADIM, null)
  const depo = bellekDepo()
  assert.ok(K.kaydet(d, depo, 5000))
  const y = K.yukle(depo, 6000)
  assert.equal(y.kaynak, 'kayit')
  assert.equal(K.serilestir(y.durum), K.serilestir(d))
})

test('beyaz liste: calisma ve bilinmeyen alan kaydedilmez', () => {
  const d = yeniDurum(0, 1)
  d.yabanci = 5
  const o = JSON.parse(K.serilestir(d))
  assert.equal(o.calisma, undefined)
  assert.equal(o.yabanci, undefined)
  assert.ok(o.bolgeler.zonguldak.madenler)
})

test('bozuk kayıt yedeğe düşer, yedek yoksa yeni oyun', () => {
  const d = yeniDurum(0, 1)
  d.bolgeler.zonguldak.para = 777
  const depo = bellekDepo({ [K.ANAHTAR]: '{bozuk', [K.YEDEK]: K.serilestir(d) })
  const y = K.yukle(depo)
  assert.equal(y.kaynak, 'yedek')
  assert.equal(y.durum.bolgeler.zonguldak.para, 777)
  const y2 = K.yukle(bellekDepo({ [K.ANAHTAR]: '{bozuk' }))
  assert.equal(y2.kaynak, 'yeni')
})

test('gelecek sürüm cevher2d-gelecek anahtarına gider', () => {
  const ham = JSON.stringify({ surum: 99, x: 1 })
  const depo = bellekDepo({ [K.ANAHTAR]: ham })
  const y = K.yukle(depo)
  assert.equal(y.kaynak, 'yeni')
  assert.ok(y.uyari)
  assert.equal(depo.getItem(K.GELECEK), ham)
})

test('dogrula NaN ve aralık dışı değerleri düzeltir', () => {
  const d = JSON.parse(K.serilestir(yeniDurum(0, 1)))
  d.bolgeler.zonguldak.para = NaN
  d.bolgeler.zonguldak.madenler = Array.from({ length: 15 }, () => ({ L: 9999, yigin: -5, kalan: 0 }))
  d.bolgeler.zonguldak.asansor.L = -3
  d.oyuncu.lv = 500
  d.bolgeler.zonguldak.yoneticiler = [{ id: 'y1', tip: 'uzayli' }]
  const s = dogrula(d)
  const b = s.bolgeler.zonguldak
  assert.equal(b.para, 20)
  assert.equal(b.madenler.length, 12)
  assert.equal(b.madenler[0].L, 400)
  assert.equal(b.madenler[0].yigin, 0)
  assert.equal(b.asansor.L, 1)
  assert.equal(s.oyuncu.lv, 100)
  assert.equal(b.yoneticiler.length, 0)
})

test('eski 3D kayıt aktarımı', () => {
  const depo = bellekDepo({ 'cevher-kayit-v3': fikstur('eski-v3.json') })
  const y = K.yukle(depo)
  assert.equal(y.kaynak, 'aktarim')
  assert.equal(y.durum.aktarim, true)
  assert.equal(y.durum.oyuncu.elmas, 120 + 50)
  assert.equal(y.durum.satin.reklamsiz, true)
  assert.equal(y.durum.ayarlar.ses, false)
  assert.equal(y.durum.bolgeler.zonguldak.madenler.length, 1)
})

test('fikstürler yüklenir', () => {
  for (const ad of ['yeni.json', 'zengin.json', 'cevrimdisi.json']) {
    const y = K.yukle(bellekDepo({ [K.ANAHTAR]: fikstur(ad) }))
    assert.equal(y.kaynak, 'kayit', ad)
  }
})
