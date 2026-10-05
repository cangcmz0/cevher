import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../js/cevrimdisi.js'
import * as E from '../js/ekonomi.js'
import * as B from '../js/benzetim.js'
import { yeniDurum } from '../js/durum.js'

function yonetimli() {
  const d = yeniDurum(1e12, 5)
  const b = d.bolgeler.zonguldak
  d.oyuncu.elmas = 1000
  B.hazirla(d)
  for (const ist of ['m0', 'asansor', 'depo']) B.eylem(d, 'yoneticiTut', { tip: ist[0] === 'm' ? 'maden' : ist, odeme: 'elmas', istasyon: ist })
  return { d, b }
}

test('kazanç = otoGelir × min(geçen, sınır)', () => {
  const { d, b } = yonetimli()
  const g = E.otoGelir(d, b)
  assert.ok(g > 0)
  const s = C.hesapla(d, d.son + 3600e3)
  assert.ok(Math.abs(s.miktar - g * 3600) < 1e-6)
  const s2 = C.hesapla(d, d.son + 5 * 3600e3)
  assert.ok(Math.abs(s2.miktar - g * 7200) < 1e-6)
  assert.equal(s2.sinirli, true)
})

test('yöneticisiz kazanç sıfır', () => {
  const d = yeniDurum(1e12, 5)
  const s = C.hesapla(d, d.son + 3600e3)
  assert.equal(s.miktar, 0)
  assert.equal(s.eksikYonetici, true)
})

test('takviye örtüşmesi iki kat sayılır', () => {
  const { d, b } = yonetimli()
  const g = E.otoGelir(d, b)
  d.takviye.bitis = d.zaman + 600
  const s = C.hesapla(d, d.son + 3600e3)
  assert.ok(Math.abs(s.miktar - g * (3600 + 600)) < 1e-6)
})

test('saat geri alınırsa kazanç yok ve uyarı', () => {
  const { d } = yonetimli()
  d.enGec = d.son + 3600e3
  const s = C.hesapla(d, d.son)
  assert.equal(s.geriAlindi, true)
  assert.equal(s.miktar, 0)
})

test('zaman sınırsız ilerler, bekleyen yazılır', () => {
  const { d } = yonetimli()
  const z0 = d.zaman
  const s = C.hesapla(d, d.son + 10 * 3600e3)
  C.uygula(d, s)
  assert.ok(Math.abs(d.zaman - z0 - 36000) < 1e-6)
  assert.ok(d.bekleyenCevrimdisi && d.bekleyenCevrimdisi.miktar > 0)
  const p0 = d.bolgeler.zonguldak.para
  const r = B.eylem(d, 'cevrimdisiTopla', { kat: 2 })
  assert.ok(r.ok)
  assert.ok(Math.abs(d.bolgeler.zonguldak.para - p0 - 2 * s.miktar) < 1e-6)
  assert.equal(d.bekleyenCevrimdisi, null)
})
