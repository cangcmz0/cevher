// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// PNG kare setleri (atlas). Liste boşken bütün aktörler kodla çizilir.
// Yeni görsel eklemek için PNG'yi img/anim/ altına koyup buraya bir satır eklemek yeter; sahne mantığı değişmez.
// Alanlar (bkz. kaynak.js atlasYukle):
//   tur      'madenci' | 'kamyon' | 'araba' (klip adları anim.js KLIPLER'deki gibi)
//   resim    PNG yolu ya da görünüş başına yollar dizisi (madenci için 4 görünüş: 0..3)
//   hucre    [genişlik, yükseklik] — bir karenin atlas pikseli
//   ayak     [x, y] — hücre içinde ayağın yere bastığı nokta (kamyonda ön tampon ve teker tabanı)
//   birim    bir atlas pikselinin aktör birimi karşılığı (madenci: 1 birim ≈ figürün 1/46'sı; kamyon: referans px)
//   yon      karelerin baktığı yön: 1 sağa, -1 sola (kodla çizilen madenciler sağa, kamyon sola bakar)
//   satirlar { klipAdı: satırNo } — kareler satırda soldan sağa, kare sayısı KLIPLER'den
// Örnek (dosyalar eklenince açılır):
//   { tur: 'madenci', resim: ['img/anim/madenci-0.png', 'img/anim/madenci-1.png', 'img/anim/madenci-2.png', 'img/anim/madenci-3.png'],
//     hucre: [128, 124], ayak: [60, 116], birim: 0.5, yon: 1,
//     satirlar: { yuru: 0, tasi: 1, it: 2, kaz: 3, bekle: 4, dinlen: 5, sevin: 6, egil: 7, bosalt: 8 } },
//   { tur: 'kamyon', resim: 'img/anim/kamyon.png', hucre: [256, 128], ayak: [12, 120], birim: 0.5, yon: -1,
//     satirlar: { bos: 0, dolu: 1 } },
export const ATLASLAR = Object.freeze([])
