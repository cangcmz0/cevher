// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Harita verisi: her bölge tam bir haritada, düğüm ve kart konumları tasarım alanının içinde
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BOLGELER } from '../js/ayar.js'
import { HARITA, HARITALAR, DUGUM, DUMAN, GEMI, haritaKodu } from '../js/sahne/harita.js'

test('her bölge tek bir haritada, sırası açılış sırasıyla aynı', () => {
  const hepsi = HARITALAR.flatMap((h) => h.bolgeler)
  assert.deepEqual(hepsi, BOLGELER.map((b) => b.kod))
  for (const b of BOLGELER) assert.equal(HARITALAR.find((h) => h.kod === haritaKodu(b.kod)).bolgeler.includes(b.kod), true)
})

test('düğüm, kart, duman ve gemi konumları harita alanında', () => {
  const ic = (x, y) => x >= 0 && x <= HARITA.w && y >= 0 && y <= HARITA.h
  for (const b of BOLGELER) {
    const n = DUGUM[b.kod]
    assert.ok(n, b.kod)
    assert.ok(ic(n.x, n.y) && ic(...n.kart), b.kod)
  }
  for (const h of HARITALAR) {
    for (const [x, y] of DUMAN[h.kod]) assert.ok(ic(x, y), h.kod + ' duman')
    const g = GEMI[h.kod]
    assert.ok(g && g.x1 > g.x0 && g.y > 0 && g.y < HARITA.h, h.kod + ' gemi')
  }
})
