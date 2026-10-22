// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Animasyon sistemi (js/sahne/anim.js): kare seçimi, olaylar, oynatıcı, iş döngüleri, geçişler ve yay.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as A from '../js/sahne/anim.js'

const kesir = (x) => x - Math.floor(x)

test('klipKaresi: döngülü klip sarar, tek seferlik son karede kalır', () => {
  assert.equal(A.klipKaresi('madenci', 'bekle', 0), 0)
  assert.equal(A.klipKaresi('madenci', 'bekle', 0.41), 1)
  assert.equal(A.klipKaresi('madenci', 'bekle', 2.4 + 0.05), 0)
  assert.equal(A.klipKaresi('madenci', 'egil', 0.49), 3)
  assert.equal(A.klipKaresi('madenci', 'egil', 5), 3)
  assert.equal(A.klipKaresi('madenci', 'yok', 1), 0)
})

test('yolKaresi: bir adımda bütün kareler, yön fark etmez', () => {
  assert.equal(A.yolKaresi('madenci', 'yuru', 0), 0)
  assert.equal(A.yolKaresi('madenci', 'yuru', 6.5), 4)
  assert.equal(A.yolKaresi('madenci', 'yuru', 13), 0)
  assert.equal(A.yolKaresi('madenci', 'yuru', -6.5), 4)
  assert.equal(A.yolKaresi('kamyon', 'dolu', 18), 3)
})

test('olaylariTara: kazma vuruşu her turda bir kez, geri sarınca hiç', () => {
  const ad = []
  assert.equal(A.olaylariTara('madenci', 'kaz', 0, 0.62, (o) => ad.push(o)), 1)
  assert.deepEqual(ad, ['vurus'])
  assert.equal(A.olaylariTara('madenci', 'kaz', 0, 0.62 * 2.4, null), 2)
  assert.equal(A.olaylariTara('madenci', 'kaz', 0, 0.62 * 2.5, null), 3)
  assert.equal(A.olaylariTara('madenci', 'kaz', 1, 0.5, null), 0)
  assert.equal(A.olaylariTara('madenci', 'bekle', 0, 10, null), 0)
})

test('Oynatici: süreli klip sonra klibine geçer, tek seferlik klip bitince geçer', () => {
  const o = new A.Oynatici('madenci', 'bekle')
  o.oynat('sevin', { sure: 0.9, sonra: 'bekle' })
  o.ilerle(0.5)
  assert.equal(o.ad, 'sevin')
  o.ilerle(0.5)
  assert.equal(o.ad, 'bekle')
  assert.equal(o.t, 0)
  o.oynat('egil', { sonra: 'yuru' })
  assert.equal(o.bitti, false)
  o.ilerle(0.6)
  assert.equal(o.ad, 'yuru')
  // Olaylar oynatıcıdan da bildirilir
  const v = []
  new A.Oynatici('madenci', 'kaz').ilerle(0.62, (ad) => v.push(ad))
  assert.deepEqual(v, ['vurus'])
})

// Önceki sahne kodundaki taşıyıcı ve arabacı döngüleri (yeni dizilerle birebir aynı olmalı)
const yuruKare = (yol) => Math.floor(kesir(yol / 13) * 8) % 8
function eskiTasiyici(u, x0, x1) {
  const TASI = { al: 0.5, bos: 0.45, hiz: 36 }
  const yol = (x1 - x0) / TASI.hiz
  const T = TASI.al + TASI.bos + 2 * yol
  u = ((u % T) + T) % T
  if (u < TASI.al) return { x: x0, anim: 'egil', kare: Math.min(3, Math.floor((u / TASI.al) * 4)), yon: -1, parca: 0 }
  u -= TASI.al
  if (u < yol) { const x = x0 + (x1 - x0) * (u / yol); return { x, anim: 'tasi', kare: yuruKare(x - x0), yon: 1, parca: 1 } }
  u -= yol
  if (u < TASI.bos) return { x: x1, anim: 'bosalt', kare: Math.min(3, Math.floor((u / TASI.bos) * 4)), yon: 1, parca: 2 }
  u -= TASI.bos
  const x = x1 - (x1 - x0) * (u / yol)
  return { x, anim: 'yuru', kare: yuruKare(x1 - x), yon: -1, parca: 3 }
}
function eskiArabaci(u, x0, x1) {
  const ARB = { bekle: 1.3, devir: 0.8, hiz: 28 }
  const yol = (x1 - x0) / ARB.hiz
  const T = ARB.bekle + ARB.devir + 2 * yol
  u = ((u % T) + T) % T
  if (u < ARB.bekle) return { ax: x0, anim: 'bekle', kare: Math.floor(u * 2.5) % 6, yon: 1, parca: 0 }
  u -= ARB.bekle
  if (u < yol) { const ax = x0 + (x1 - x0) * (u / yol); return { ax, anim: 'it', kare: yuruKare(ax - x0), yon: 1, parca: 1 } }
  u -= yol
  if (u < ARB.devir) return { ax: x1, anim: 'bekle', kare: 0, yon: 1, parca: 2 }
  u -= ARB.devir
  const ax = x1 - (x1 - x0) * (u / yol)
  return { ax, anim: 'yuru', kare: yuruKare(x1 - ax), yon: -1, parca: 3 }
}

test('diziPoz: taşıyıcı ve arabacı dizileri önceki döngülerle aynı pozu verir', () => {
  const yakin = (a, b) => Math.abs(a - b) < 1e-9
  for (let u = 0; u < 20; u += 0.037) {
    const e = eskiTasiyici(u, 174, 246)
    const y = A.diziPoz(A.DIZILER.tasiyici, u, { a: 174, b: 246 })
    assert.ok(yakin(e.x, y.x) && e.anim === y.klip && e.kare === y.kare && e.yon === y.yon && e.parca === y.sira, `taşıyıcı u=${u}`)
    const ea = eskiArabaci(u, 200, 236)
    const ya = A.diziPoz(A.DIZILER.arabaci, u, { a: 200, b: 236 })
    assert.ok(yakin(ea.ax, ya.x) && ea.anim === ya.klip && ea.kare === ya.kare && ea.yon === ya.yon && ea.parca === ya.sira, `arabacı u=${u}`)
  }
  assert.ok(Math.abs(A.diziSuresi(A.DIZILER.tasiyici, { a: 174, b: 246 }) - (0.5 + 0.45 + 4)) < 1e-9)
})

test('YUMUSAT: her eğri 0 → 0, 1 → 1; gecis sınırları kırpar', () => {
  for (const [ad, f] of Object.entries(A.YUMUSAT)) {
    assert.ok(Math.abs(f(0)) < 1e-9, ad + ' 0')
    assert.ok(Math.abs(f(1) - 1) < 1e-9, ad + ' 1')
  }
  assert.equal(A.gecis(10, 20, 2), 20)
  assert.equal(A.gecis(10, 20, -1), 10)
  assert.equal(A.gecis(0, 10, 0.5, 'yumusak'), 5)
})

test('Yay: hedefe oturur, büyük sıçramada hemen geçer', () => {
  const y = new A.Yay(24, 0.62)
  y.ilerle(0, 1 / 60)
  let enCok = 0
  for (let i = 0; i < 120; i++) enCok = Math.max(enCok, y.ilerle(1, 1 / 60))
  assert.ok(Math.abs(y.x - 1) < 1e-3)
  assert.ok(enCok > 1, 'kritik altı sönüm: biraz aşar')
  y.ilerle(9, 1 / 60)
  assert.equal(y.x, 9)
})
