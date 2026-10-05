import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bicim, oran, tam, yuzde, artiYuzde, sure, sayac } from '../js/bicim.js'

test('bicim: §4.12 örnekleri', () => {
  assert.equal(bicim(318600), '318,6 bin')
  assert.equal(bicim(1200), '1,2 bin')
  assert.equal(bicim(12000), '12 bin')
  assert.equal(bicim(999999), '999,9 bin')
  assert.equal(bicim(1e6), '1 mn')
  assert.equal(bicim(4.5e6), '4,5 mn')
  assert.equal(bicim(1e21), '1 aa')
  assert.equal(bicim(0.4), '0,4')
  assert.equal(bicim(2), '2')
  assert.equal(bicim(9.5), '9,5')
  assert.equal(bicim(12), '12')
  assert.equal(bicim(482), '482')
})

test('bicim: negatif, sonsuz, NaN', () => {
  assert.equal(bicim(-1200), '-1,2 bin')
  assert.equal(bicim(Infinity), '∞')
  assert.equal(bicim(NaN), '0')
})

test('bicim: ek geçişi 1000 göstermez', () => {
  for (const n of [999.99, 999999.9, 999999999.5]) assert.ok(!/1000/.test(bicim(n)), bicim(n))
})

test('oran, tam, yuzde, artiYuzde', () => {
  assert.equal(oran(12800), '12,8 bin/sn')
  assert.equal(tam(1200), '1.200')
  assert.equal(tam(420), '420')
  assert.equal(yuzde(0.68), '%68')
  assert.equal(artiYuzde(0.12), '+%12')
  assert.equal(artiYuzde(-0.03), '-%3')
  assert.equal(artiYuzde(0.004), '%0')
})

test('sure ve sayac', () => {
  assert.equal(sure(45), '45 sn')
  assert.equal(sure(12 * 60), '12 dk')
  assert.equal(sure(2 * 3600 + 15 * 60), '2 sa 15 dk')
  assert.equal(sure(86400 + 3 * 3600), '1 gün 3 sa')
  assert.equal(sayac(29 * 60 + 41), '29:41')
  assert.equal(sayac(3723), '1:02:03')
})
