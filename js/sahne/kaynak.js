// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  KARE KAYNAKLARI — bir aktörün (madenci, kamyon, araba) karesi nereden gelir.
//  • Varsayılan: kodla çizim. Sahne her aktör türü için bir çizici kaydeder (cizimKaydet).
//  • PNG kare seti (atlas): atlaslar.js'de tanımlanan set yüklenirse o tür aynı klip adlarıyla atlastan çizilir.
//    Dosya yoksa ya da ölçüler tutmuyorsa uyarı yazılır ve o tür kodla çizilmeye devam eder.
//  • aktorCiz(ctx, tur, s): s = { klip, kare, x, y (ayak noktası, dünya px), yon (1 sağa, -1 sola),
//    boy (aktör biriminin dünya px karşılığı), gorunus, aci, pivot (devrilme), ... çiziciye özel alanlar }
// ════════════════════════════════════════════════════════════════
import { KLIPLER } from './anim.js'

const cizimler = new Map()   // tur → (ctx, s) => void
const atlaslar = new Map()   // tur → { tanim, resimler }

export function cizimKaydet(tur, fn) { cizimler.set(tur, fn) }
export const atlasVar = (tur) => atlaslar.has(tur)
export const atlasListesi = () => [...atlaslar.keys()]

function resimYukle(src, ms) {
  return new Promise((bitti) => {
    const img = new Image()
    const sure = setTimeout(() => bitti(null), ms)
    img.onload = () => { clearTimeout(sure); bitti(img) }
    img.onerror = () => { clearTimeout(sure); bitti(null) }
    img.decoding = 'async'
    img.src = src
  })
}

// Atlas tanımı (atlaslar.js):
// { tur, resim: 'img/anim/x.png' ya da görünüş başına dizi, hucre: [w, h] (atlas px), ayak: [x, y] (hücre içinde
//   ayak noktası), birim: bir atlas pikselinin aktör birimi karşılığı (varsayılan 1), yon: karelerin baktığı yön
//   (1 sağ, -1 sol; varsayılan 1), satirlar: { klipAdı: satırNo } }
// Her klibin kare sayısı KLIPLER'den gelir; kareler satırda soldan sağa dizilir. -> Promise<boolean>
export async function atlasYukle(tanim, zamanAsimi = 4000) {
  const klipler = tanim && KLIPLER[tanim.tur]
  if (!klipler || !Array.isArray(tanim.hucre) || !Array.isArray(tanim.ayak) || !tanim.satirlar) {
    console.warn('Atlas tanımı geçersiz', tanim && tanim.tur)
    return false
  }
  const kaynaklar = Array.isArray(tanim.resim) ? tanim.resim : [tanim.resim]
  const resimler = await Promise.all(kaynaklar.map((r) => resimYukle(r, zamanAsimi)))
  if (resimler.some((r) => !r)) {
    console.warn('Atlas yüklenemedi, çizime dönülüyor:', tanim.tur)
    return false
  }
  // Ölçü denetimi: her satırda klibin bütün kareleri sığmalı
  const [hw, hh] = tanim.hucre
  for (const [ad, satir] of Object.entries(tanim.satirlar)) {
    const k = klipler[ad]
    if (!k) { console.warn('Atlasta bilinmeyen klip:', tanim.tur, ad); return false }
    for (const r of resimler) {
      if (r.naturalWidth < k.kare * hw || r.naturalHeight < (satir + 1) * hh) {
        console.warn('Atlas ölçüsü tutmuyor:', tanim.tur, ad)
        return false
      }
    }
  }
  atlaslar.set(tanim.tur, { tanim, resimler })
  return true
}

function atlasCiz(ctx, a, s) {
  const t = a.tanim
  const satir = t.satirlar[s.klip]
  if (satir === undefined) return false
  const img = a.resimler[(s.gorunus || 0) % a.resimler.length]
  const [hw, hh] = t.hucre, [ax, ay] = t.ayak
  const olcek = s.boy * (t.birim || 1)
  const ayna = (s.yon || 1) * (t.yon || 1) < 0
  ctx.save()
  ctx.translate(s.x, s.y)
  if (ayna) ctx.scale(-1, 1)
  if (s.aci) {
    const px = (s.pivot || 0) * hw * 0.35 * olcek
    ctx.translate(px, 0)
    ctx.rotate(s.aci * (ayna ? -1 : 1))
    ctx.translate(-px, 0)
  }
  ctx.drawImage(img, s.kare * hw, satir * hh, hw, hh, -ax * olcek, -ay * olcek, hw * olcek, hh * olcek)
  ctx.restore()
  return true
}

// Aktörü çizer: atlası varsa atlastan, yoksa kayıtlı çiziciyle
export function aktorCiz(ctx, tur, s) {
  const a = atlaslar.get(tur)
  if (a && atlasCiz(ctx, a, s)) return
  const f = cizimler.get(tur)
  if (f) f(ctx, s)
}
