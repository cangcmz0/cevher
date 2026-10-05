import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as E from '../js/ekonomi.js'
import { yeniDurum } from '../js/durum.js'
import { KADEME_MADEN, KADEME_ISTASYON } from '../js/ayar.js'

const d = yeniDurum(0, 1)
const b = d.bolgeler.zonguldak

test('maden formülleri (§2.4)', () => {
  assert.equal(E.madenUretim(d, b, 0, 1), 1)
  assert.equal(E.madenUretim(d, b, 0, 10), 20)
  assert.equal(E.madenUretim(d, b, 0, 25), 100)
  assert.equal(E.madenMaliyet(d, b, 0, 1), 4)
  assert.equal(E.madenAcilis(d, b, 1), 40)
})

test('asansör ve depo (§2.5, §2.6)', () => {
  assert.equal(E.asansorKap(d, b, 1), 20)
  assert.equal(E.tasiyiciSayisi(150), 4)
  assert.equal(E.tasiyiciSayisi(1), 1)
  assert.equal(E.tasiyiciSayisi(300), 5)
})

test('guc her kademede ikiye katlanır', () => {
  for (const liste of [KADEME_MADEN, KADEME_ISTASYON]) {
    for (const m of liste) {
      assert.equal(E.guc(m, liste) / m, 2 * (E.guc(m - 1, liste) / (m - 1)))
    }
  }
})

test('topluMaliyet döngü toplamına eşit', () => {
  for (const [c1, g, k] of [[4, 1.1, 1], [4, 1.1, 37], [5, 1.05, 50], [123.4, 1.05, 400]]) {
    let s = 0
    for (let j = 0; j < k; j++) s += c1 * Math.pow(g, j)
    assert.ok(Math.abs(E.topluMaliyet(c1, g, k) - s) / s < 1e-9)
  }
})

test('alinabilir bütçeyi aşmaz ve en büyüktür', () => {
  for (const [c1, g, para] of [[4, 1.1, 3], [4, 1.1, 4], [4, 1.1, 1000], [5, 1.05, 1e9], [7.7, 1.1, 12345.6]]) {
    const k = E.alinabilir(c1, g, para, 1e6)
    assert.ok(E.topluMaliyet(c1, g, k) <= para)
    assert.ok(E.topluMaliyet(c1, g, k + 1) > para)
  }
  assert.equal(E.alinabilir(4, 1.1, 1e30, 10), 10)
})

test('xpGerek', () => {
  assert.equal(E.xpGerek(12), 1200)
  assert.equal(E.xpGerek(20), Math.round(2000 * Math.pow(1.03, 8)))
})

test('formüller seviyeyle monoton', () => {
  let onceki = null
  for (let L = 1; L <= 400; L++) {
    const s = [E.madenUretim(d, b, 2, L), E.madenMaliyet(d, b, 2, L), E.asansorKap(d, b, L), E.asansorHiz(d, b, L), E.tasiyiciYuk(d, b, L), E.depoKap(d, b, L), E.xpGerek(Math.min(L, 100))]
    if (onceki) s.forEach((v, j) => assert.ok(v >= onceki[j], `L=${L} j=${j}`))
    onceki = s
  }
})

test('teklif: max ve tavan', () => {
  const d2 = yeniDurum(0, 1)
  const b2 = d2.bolgeler.zonguldak
  b2.para = 100
  const t = E.teklif(d2, b2, 'm0', 'max')
  assert.ok(t.yetiyor && t.maliyet <= 100 && t.adet >= 1)
  b2.para = 0
  const t0 = E.teklif(d2, b2, 'm0', 'max')
  assert.equal(t0.adet, 1)
  assert.equal(t0.yetiyor, false)
  b2.madenler[0].L = 400
  assert.equal(E.teklif(d2, b2, 'm0', 10).maks, true)
})
