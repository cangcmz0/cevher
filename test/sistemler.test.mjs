// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// Diğer oyunlardan uyarlanan sistemler: sert kaya ve sondaj, Vardiya Coşkusu, keşif seferleri, Maden Müzesi, kumbara.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as B from '../js/benzetim.js'
import * as E from '../js/ekonomi.js'
import { yeniDurum } from '../js/durum.js'
import { serilestir, coz } from '../js/kayit.js'
import { KAYA, COSKU, BULUNTU, BULUNTULAR, KESIF, KUMBARA, HAZINE, ORTAK_MAKS } from '../js/ayar.js'

const ADIM = B.ADIM
function kos(d, sn, olaylar = null) {
  const n = Math.round(sn / ADIM)
  for (let i = 0; i < n; i++) B.adim(d, ADIM, olaylar)
}
// Öğreticisi bitmiş, zengin bir oyun: n kat açık (kayalar delinmiş sayılır), bütün istasyonlar yöneticili
function hazirOyun(n = 5, tohum = 11) {
  const d = yeniDurum(0, tohum)
  d.ogretici.bitti = true
  d.ogretici.adim = 9
  d.oyuncu.elmas = 5000
  const b = d.bolgeler.zonguldak
  b.para = 1e30
  B.hazirla(d)
  for (let i = 1; i < n; i++) {
    if (E.kayaVar(b, i)) { B.eylem(d, 'sondajBaslat', {}); B.eylem(d, 'sondajHizlandir', { yontem: 'elmas' }) }
    assert.equal(B.eylem(d, 'madenAc', { i }).ok, true, `${i + 1}. Kat açılmalı`)
  }
  for (const ist of ['m0', 'asansor', 'depo']) B.eylem(d, 'yoneticiTut', { tip: ist[0] === 'm' ? 'maden' : ist, odeme: 'elmas', istasyon: ist })
  return d
}

test('sert kaya: 6., 11., 16., 21. ve 26. Kat kayanın ardında', () => {
  const kayali = []
  for (let i = 0; i < 30; i++) if (E.kayaKati(i)) kayali.push(i + 1)
  assert.deepEqual(kayali, [6, 11, 16, 21, 26])
  assert.equal(KAYA.sure.length, kayali.length)
})

test('sert kaya: sondaj olmadan 6. Kat açılmaz; sondaj para ve süre ister, bitince kat açılır', () => {
  const d = hazirOyun(5)
  const b = d.bolgeler.zonguldak
  const ol = []
  assert.deepEqual(B.eylem(d, 'madenAc', { i: 5 }), { ok: false, sebep: 'kaya' })
  const para0 = b.para
  const r = B.eylem(d, 'sondajBaslat', {}, ol)
  assert.equal(r.ok, true)
  assert.equal(r.sure, KAYA.sure[0])
  assert.ok(Math.abs(para0 - b.para - E.madenAcilis(d, b, 5) * KAYA.maliyet) <= 1e-9 * para0)
  assert.equal(B.eylem(d, 'sondajBaslat', {}).sebep, 'mesgul')
  assert.equal(B.eylem(d, 'madenAc', { i: 5 }).sebep, 'kaya')
  kos(d, KAYA.sure[0] - 1, ol)
  assert.ok(b.sondaj, 'süre dolmadan bitmez')
  kos(d, 2, ol)
  assert.equal(b.sondaj, null)
  assert.equal(b.kaya, 1)
  assert.ok(ol.some((o) => o.tip === 'kayaDelindi' && o.i === 5))
  assert.equal(B.eylem(d, 'madenAc', { i: 5 }).ok, true)
  assert.equal(d.prestij.kayaRekor.zonguldak, 1)
  // Sıradaki kaya 11. Katın önünde
  assert.equal(E.kayaVar(b, 10), true)
  assert.equal(E.kayaVar(b, 6), false)
})

test('sert kaya: reklam 15 dk kısaltır (en çok 2 kez), elmas kalan 5 dk başına 1', () => {
  const d = hazirOyun(10)
  const b = d.bolgeler.zonguldak
  B.eylem(d, 'sondajBaslat', {})
  assert.equal(b.sondaj.sure, KAYA.sure[1])
  const bitis = b.sondaj.bitis
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).ok, true)
  assert.equal(b.sondaj ? b.sondaj.bitis : bitis - KAYA.reklamSn, bitis - KAYA.reklamSn)
  // 10 dk'lık kaya ilk reklamda biter
  assert.equal(b.sondaj, null)
  assert.equal(b.kaya, 2)
  // 16. Kat: 30 dk; iki reklam yeter
  for (let i = 10; i < 15; i++) assert.equal(B.eylem(d, 'madenAc', { i }).ok, true)
  B.eylem(d, 'sondajBaslat', {})
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).ok, true)
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).ok, true)
  assert.equal(b.kaya, 3)
  // 21. Kat: 1 sa; iki reklam hakkı, üçüncüsü reddedilir, kalan elmasla biter
  for (let i = 15; i < 20; i++) assert.equal(B.eylem(d, 'madenAc', { i }).ok, true)
  B.eylem(d, 'sondajBaslat', {})
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).ok, true)
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).ok, true)
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'reklam' }).sebep, 'maks')
  const kalan = b.sondaj.bitis - d.zaman
  assert.ok(Math.abs(kalan - (KAYA.sure[3] - 2 * KAYA.reklamSn)) < 1e-6)
  const elmas0 = d.oyuncu.elmas
  assert.equal(B.eylem(d, 'sondajHizlandir', { yontem: 'elmas' }).ok, true)
  assert.equal(elmas0 - d.oyuncu.elmas, B.hizlandirmaElmas(kalan))
  assert.equal(b.kaya, 4)
})

test('sert kaya: prestijden sonra tecrübeli ekip aynı kayayı kısa sürede deler; sondaj çevrimdışı da işler', () => {
  const d = hazirOyun(6)
  const b = d.bolgeler.zonguldak
  assert.equal(E.sondajSuresi(d, b, 5), KAYA.sure[0] * KAYA.tecrube, 'delinmiş kaya kısa sürer')
  assert.equal(E.sondajSuresi(d, b, 10), KAYA.sure[1], 'yeni kaya tam sürer')
  for (let i = 6; i < 10; i++) B.eylem(d, 'madenAc', { i })
  B.eylem(d, 'sondajBaslat', {})
  // Oyun saati ileri gider (çevrimdışı gibi); bir sonraki kontrolde biter
  d.zaman += KAYA.sure[1] + 5
  kos(d, 1)
  assert.equal(b.kaya, 2)
})

test('sert kaya: eski kayıt onarılır; açık katların önündeki kayalar delinmiş sayılır, geçersiz sondaj atılır', () => {
  const d = hazirOyun(12)
  const o = JSON.parse(serilestir(d))
  delete o.bolgeler.zonguldak.kaya
  delete o.prestij.kayaRekor
  o.bolgeler.zonguldak.sondaj = { i: 7, bitis: 1, sure: 5, reklam: 0 }
  const k = coz(JSON.stringify(o))
  assert.equal(k.bolgeler.zonguldak.kaya, 2)
  assert.equal(k.bolgeler.zonguldak.sondaj, null)
  assert.equal(k.prestij.kayaRekor.zonguldak, 2)
  // Geçerli sondaj korunur
  const b = d.bolgeler.zonguldak
  for (let i = 12; i < 15; i++) B.eylem(d, 'madenAc', { i })
  B.eylem(d, 'sondajBaslat', {})
  const k2 = coz(serilestir(d))
  assert.deepEqual(k2.bolgeler.zonguldak.sondaj, b.sondaj)
})

test('coşku: öğreticiden önce dolmaz; dokunuşlarla dolar, zinciri hızlandırır, süre bitince kapanır', () => {
  const d0 = yeniDurum(0, 3)
  B.hazirla(d0)
  B.eylem(d0, 'dokun', { istasyon: 'm0' })
  assert.equal(d0.calisma.cosku.dolum, 0)

  const d = hazirOyun(3)
  const b = d.bolgeler.zonguldak
  const ol = []
  const v0 = E.asansorHiz(d, b), u0 = E.uretimCarpani(d, b, 0), y0 = E.depoYol(d, b)
  const gelir0 = E.otoGelir(d, b)
  // Saniyede ~6 dokunuşla gösterge bir dokunuş eksiğine kadar dolar (sızıntıya rağmen 30 dokunuştan az)
  let n = 0
  while (d.calisma.cosku.dolum < 1 - COSKU.dokunus + 1e-9 && n++ < 100) { B.eylem(d, 'dokun', { istasyon: 'm0' }, ol); kos(d, 0.15) }
  assert.ok(n < 30 && d.calisma.cosku.bitis === 0, 'dokunuş ' + n)
  // Yöneticili istasyona dokunmak da sayılır (yükseltme penceresi yerine)
  const r = B.eylem(d, 'dokun', { istasyon: 'asansor' }, ol)
  assert.deepEqual(r, { ok: true, etkisiz: true, cosku: true })
  assert.ok(ol.some((o) => o.tip === 'coskuBasladi'))
  assert.equal(d.istatistik.cosku, 1)
  assert.equal(E.coskuCarpani(d), COSKU.carpan)
  assert.ok(Math.abs(E.asansorHiz(d, b) / v0 - COSKU.carpan) < 1e-9)
  assert.ok(Math.abs(E.uretimCarpani(d, b, 0) / u0 - COSKU.carpan) < 1e-9)
  assert.ok(Math.abs(y0 / E.depoYol(d, b) - COSKU.carpan) < 1e-9)
  assert.equal(E.otoGelir(d, b), gelir0, 'çevrimdışı ve ödül ölçüleri coşkudan etkilenmez')
  // Coşku sürerken gösterge dolmaz
  B.eylem(d, 'dokun', { istasyon: 'm0' })
  assert.equal(d.calisma.cosku.dolum, 0)
  kos(d, COSKU.sure + 0.1, ol)
  assert.equal(E.coskuCarpani(d), 1)
  assert.ok(ol.some((o) => o.tip === 'coskuBitti'))
})

test('coşku: art arda dokunuşlar aralıkla sayılır, gösterge dokunulmayınca boşalır', () => {
  const d = hazirOyun(2)
  for (let k = 0; k < 10; k++) B.eylem(d, 'dokun', { istasyon: 'm0' })
  assert.ok(Math.abs(d.calisma.cosku.dolum - COSKU.dokunus) < 1e-9, 'aynı anda 10 dokunuş bir sayılır')
  kos(d, 1)
  assert.ok(d.calisma.cosku.dolum < COSKU.dokunus)
  kos(d, 10)
  assert.equal(d.calisma.cosku.dolum, 0)
})

test('keşif: Zeynep katılınca açılır; sefer süre dolunca döner, ilk sefer buluntuyla gelir', () => {
  const d = hazirOyun(3)
  const ol = []
  assert.equal(B.kesifAcik(d), false)
  assert.equal(B.eylem(d, 'kesifBaslat', { tur: 'kisa' }).sebep, 'kilit')
  d.ortak.zeynep = 1
  kos(d, 1, ol)
  assert.ok(d.hikaye.bekleyen.includes('kesif'), 'Zeynep keşif ekibini anlatır')
  const r = B.eylem(d, 'kesifBaslat', { tur: 'kisa' }, ol)
  assert.equal(r.ok, true)
  assert.equal(r.bolge, 'zonguldak')
  assert.equal(B.eylem(d, 'kesifBaslat', { tur: 'uzun' }).sebep, 'mesgul')
  assert.equal(B.eylem(d, 'kesifTopla', {}).sebep, 'kilit')
  kos(d, KESIF[0].sure + 1, ol)
  assert.ok(ol.some((o) => o.tip === 'kesifDondu'))
  assert.equal(B.kesifDurumu(d).hazir, true)
  const elmas0 = d.oyuncu.elmas
  const t = B.eylem(d, 'kesifTopla', {}, ol)
  assert.equal(t.ok, true)
  assert.ok(t.bulunan.length >= 1, 'ilk sefer en az bir buluntu getirir')
  for (const x of t.bulunan) assert.equal(BULUNTULAR.find((y) => y.kod === x.kod).bolge, 'zonguldak')
  assert.ok(t.elmas >= KESIF[0].elmas[0])
  assert.equal(d.oyuncu.elmas - elmas0, t.elmas)
  assert.equal(d.kesif.suren, null)
  assert.equal(d.kesif.sayi, 1)
  assert.equal(d.istatistik.kesif, 1)
})

test('keşif: reklam ve elmasla hızlanır; sefer kayıtta korunur', () => {
  const d = hazirOyun(2)
  d.ortak.zeynep = 1
  B.eylem(d, 'kesifBaslat', { tur: 'uzun' })
  const s = d.kesif.suren
  const bitis = s.bitis
  B.eylem(d, 'kesifHizlandir', { yontem: 'reklam' })
  assert.equal(s.bitis, bitis - 900)
  const k = coz(serilestir(d))
  assert.deepEqual(k.kesif.suren, s)
  const kalan = s.bitis - d.zaman
  const elmas0 = d.oyuncu.elmas
  assert.equal(B.eylem(d, 'kesifHizlandir', { yontem: 'elmas' }).ok, true)
  assert.equal(elmas0 - d.oyuncu.elmas, B.hizlandirmaElmas(kalan))
  assert.equal(B.kesifDurumu(d).hazir, true)
  assert.equal(B.eylem(d, 'kesifTopla', {}).ok, true)
})

test('müze: buluntu etkileri çarpanlara girer, seviye en çok 5, set bölge satışını artırır', () => {
  const d = hazirOyun(3)
  const b = d.bolgeler.zonguldak
  const u0 = E.uretimCarpani(d, b, 0, false), s0 = E.satisKalici(d, b), m0 = E.madenMaliyet(d, b, 0)
  d.buluntu = { lamba: 2 }
  assert.ok(Math.abs(E.uretimCarpani(d, b, 0, false) / u0 - (1 + 2 * BULUNTU.etki.uretim)) < 1e-9)
  d.buluntu = { lamba: 2, uzunmehmet: 1 }
  assert.ok(Math.abs(E.satisKalici(d, b) / s0 - (1 + BULUNTU.etki.gelir)) < 1e-9)
  d.buluntu = { lamba: 2, uzunmehmet: 1, egrelti: 4 }
  assert.ok(Math.abs(E.madenMaliyet(d, b, 0) / m0 - (1 - 4 * BULUNTU.etki.maliyet)) < 1e-9)
  // Üçü de müzede: Zonguldak seti → satış × (1 + set)
  assert.equal(E.buluntuSeti(d, 'zonguldak'), true)
  assert.ok(Math.abs(E.satisKalici(d, b) / s0 - (1 + BULUNTU.etki.gelir) * (1 + BULUNTU.set)) < 1e-9)
  // Maliyet indirimi tavanlı
  d.buluntu = Object.fromEntries(BULUNTULAR.map((x) => [x.kod, BULUNTU.maks]))
  assert.equal(E.buluntuEtki(d, 'maliyet'), BULUNTU.maliyetTavan)
  // Bütün Zonguldak buluntuları en üst seviyedeyken keşif buluntu yerine elmas getirir
  d.ortak.zeynep = 1
  B.eylem(d, 'kesifBaslat', { tur: 'uzun' })
  d.zaman = d.kesif.suren.bitis
  const t = B.eylem(d, 'kesifTopla', {})
  assert.equal(t.bulunan.length, 0)
  assert.ok(t.elmas >= KESIF[2].elmas[0] + 5)
})

test('müze: kayıt onarımı bilinmeyen kodu atar, seviyeyi sınırlar; başarım farklı buluntu sayısını izler', () => {
  const d = hazirOyun(2)
  d.buluntu = { lamba: 9, yok: 3, hematit: 1 }
  const k = coz(serilestir(d))
  assert.deepEqual(k.buluntu, { lamba: BULUNTU.maks, hematit: 1 })
  assert.equal(B.basarimDeger(k, 'buluntu'), 2)
})

test('müze: altın damarı ara sıra bölgenin buluntusunu getirir (keşif ekibi kurulunca)', () => {
  const d = hazirOyun(3)
  d.ortak.zeynep = 1
  let bulundu = 0
  for (let k = 0; k < 400; k++) {
    d.calisma.hazine = { kat: 0, tur: 'altin', yer: 0, bas: d.zaman, bitis: d.zaman + 20 }
    const r = B.eylem(d, 'hazineAl', {})
    if (r.buluntu) { bulundu++; assert.equal(BULUNTULAR.find((x) => x.kod === r.buluntu.kod).bolge, 'zonguldak') }
  }
  const oran = bulundu / 400
  assert.ok(oran > HAZINE.buluntuOlasilik * 0.4 && oran < HAZINE.buluntuOlasilik * 2.2, 'oran ' + oran)
})

test('kumbara: işler doldurur, tavanı aşmaz, kırılınca elmas verir ve dolum hızlanır', () => {
  const d = hazirOyun(3)
  const k = d.kumbara
  const once = k.elmas
  B.eylem(d, 'yukselt', { istasyon: 'm0', adet: 1 })
  assert.ok(Math.abs(k.elmas - once - KUMBARA.yukseltme) < 1e-9)
  for (let i = 0; i < 5000; i++) B.eylem(d, 'yukselt', { istasyon: 'asansor', adet: 1 })
  assert.ok(k.elmas <= B.kumbaraTavan(d))
  k.elmas = 321.7
  const elmas0 = d.oyuncu.elmas
  const r = B.eylem(d, 'kumbaraKir', {})
  assert.deepEqual(r, { ok: true, elmas: 321 })
  assert.equal(d.oyuncu.elmas - elmas0, 321)
  assert.equal(k.kirma, 1)
  assert.equal(B.kumbaraTavan(d), KUMBARA.tavan + KUMBARA.tavanArtis)
  assert.ok(Math.abs(B.kumbaraBonus(d) - (1 + KUMBARA.bonus)) < 1e-9)
  assert.equal(B.eylem(d, 'kumbaraKir', {}).sebep, 'bos')
  // Öğretici bitmeden dolmaz
  const d0 = yeniDurum(0, 5)
  d0.bolgeler.zonguldak.para = 1e6
  B.hazirla(d0)
  B.eylem(d0, 'yukselt', { istasyon: 'm0', adet: 1 })
  assert.equal(d0.kumbara.elmas, 0)
})

test('prestij: müze, keşif, kumbara ve kaya rekoru kalır; kayalar yeniden delinir', () => {
  const d = hazirOyun(7)
  d.ortak.zeynep = 1
  d.buluntu = { lamba: 3 }
  d.kumbara.elmas = 40
  B.eylem(d, 'kesifBaslat', { tur: 'orta' })
  for (const o of Object.keys(d.ortak)) d.ortak[o] = Math.min(ORTAK_MAKS, d.ortak[o])
  d.bolgeler.zonguldak.toplamKazanc = 1e15
  assert.equal(B.eylem(d, 'prestij', {}).ok, true)
  assert.deepEqual(d.buluntu, { lamba: 3 })
  assert.equal(d.kumbara.elmas, 40)
  assert.ok(d.kesif.suren)
  assert.equal(d.prestij.kayaRekor.zonguldak, 1)
  const b = d.bolgeler.zonguldak
  assert.equal(b.kaya, 0)
  assert.equal(E.sondajSuresi(d, b, 5), KAYA.sure[0] * KAYA.tecrube)
})

test('kayıt: elmasla tutulan yöneticinin kalıcılığı yeniden açılışta korunur', () => {
  const d = yeniDurum(0, 5)
  d.oyuncu.elmas = 1000
  B.hazirla(d)
  for (let i = 0; i < 6; i++) B.eylem(d, 'yoneticiTut', { tip: 'maden', odeme: 'elmas' })
  d.bolgeler.zonguldak.para = 1e9
  B.eylem(d, 'yoneticiTut', { tip: 'maden', odeme: 'para' })
  const k = coz(serilestir(d))
  assert.deepEqual(k.bolgeler.zonguldak.yoneticiler.map((y) => y.kalici), d.bolgeler.zonguldak.yoneticiler.map((y) => y.kalici))
  assert.equal(k.bolgeler.zonguldak.yoneticiler.filter((y) => y.kalici).length, 6)
})
