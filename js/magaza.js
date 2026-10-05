// ════════════════════════════════════════════════════════════════
//  MAĞAZA — uygulama içi satın alma: elmas paketleri, özel teklif
//  ve kalıcı ürünler (reklamsız, altın kazma).
//  • Telefon uygulamasında (Capacitor + cordova-plugin-purchase) Google
//    Play ödemesi açılır; ödeme onaylanınca ürün verilir. Düğmede
//    mağazanın verdiği yerel fiyat yazar.
//  • Tarayıcı sürümünde ödeme yok: ürün deneme için verilir ve arayüz
//    " (deneme: ödeme alınmadı)" yazar.
//  Ürün kimlikleri Play Console'daki kimliklerle aynı olmalı.
//  Eski oyundan taşındı (§6.9): bağımlılıklar kur({...}) ile verilir.
//  [S2] arayüzü; dosya S1'de hazır durur.
// ════════════════════════════════════════════════════════════════
export const Magaza = (() => {
  // fiyat: yalnızca tarayıcıdaki gösterim; uygulamada Play'in yerel fiyatı yazar
  const URUNLER = [
    { id: 'cevher_kese', tur: 'elmas', ad: 'Bir kese elmas', n: 100, fiyat: '₺39,99' },
    { id: 'cevher_sandik', tur: 'elmas', ad: 'Bir sandık elmas', n: 550, fiyat: '₺179,99', etiket: '+%10' },
    { id: 'cevher_hazine', tur: 'elmas', ad: 'Bir hazine elmas', n: 1400, fiyat: '₺399,99', etiket: '+%25' },
    { id: 'baslangic', tur: 'paket', ad: 'Özel Teklif', n: 300, takviyeDk: 240, yonetici: { nadirlik: 2 }, fiyat: '₺59,99', etiket: '%50', ne: '300 elmas + Efsanevi yönetici + Kazanç x2 · 4 saat' },
    { id: 'reklamsiz', tur: 'kalici', ad: 'Reklamsız', fiyat: '₺119,99', ne: 'Reklam ödülleri reklam izlemeden gelir' },
    { id: 'altin_kazma', tur: 'kalici', ad: 'Altın Kazma', fiyat: '₺199,99', ne: 'Bütün satışlar kalıcı ×2' },
  ]
  const bul = (id) => URUNLER.find((u) => u.id === id)
  const SATIN_ANAHTAR = { baslangic: 'baslangic', reklamsiz: 'reklamsiz', altin_kazma: 'altinKazma' }

  // ana.js'nin bağladığı işlevler
  const bag = {
    durumAl: () => null,
    elmasEkle: () => {},
    takviyeEkle: () => {},
    yoneticiVer: () => {},
    kaydet: () => {},
    yayinla: () => {},
  }

  // Bir kez alınan ürün alındı mı
  const sahip = (u) => Boolean(SATIN_ANAHTAR[u.id] && bag.durumAl()?.satin?.[SATIN_ANAHTAR[u.id]])

  // Ürünü oyuncuya verir (ödül önce uygulanır ve kaydedilir, sonra olay yayınlanır)
  function ver(u) {
    const d = bag.durumAl()
    if (d) d.satin ||= {}
    if (u.n) bag.elmasEkle(u.n)
    if (u.takviyeDk) bag.takviyeEkle(u.takviyeDk)
    if (u.yonetici) bag.yoneticiVer({ ...u.yonetici })
    if (d && SATIN_ANAHTAR[u.id]) d.satin[SATIN_ANAHTAR[u.id]] = true
    bag.kaydet()
    bag.yayinla({ tip: 'satinAlindi', u })
  }

  // ── Google Play (cordova-plugin-purchase) ──
  const cp = () => window.CdvPurchase
  let yerelHazir = false
  let yerelKuruldu = false
  function yerelKur() {
    const C = cp()
    if (!C || yerelKuruldu) return
    yerelKuruldu = true
    const { store, ProductType, Platform } = C
    store.register(URUNLER.map((u) => ({ id: u.id, platform: Platform.GOOGLE_PLAY, type: u.tur === 'elmas' ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE })))
    store.when()
      .approved((t) => t.verify())
      .verified((r) => r.finish())
      .finished((t) => {
        for (const p of t.products) {
          const u = bul(p.id)
          // Kalıcı ürün her açılışta yeniden bildirilebilir; bir kez verilir
          if (u && !sahip(u)) ver(u)
        }
      })
    store.initialize([Platform.GOOGLE_PLAY]).then(() => { yerelHazir = true })
  }

  // ana.js bağlar: { durumAl, elmasEkle, takviyeEkle, yoneticiVer, kaydet, yayinla }
  function kur(secenek = {}) {
    for (const k of Object.keys(bag)) if (typeof secenek[k] === 'function') bag[k] = secenek[k]
    if (cp()) yerelKur()
    else document.addEventListener('deviceready', yerelKur, { once: true })
  }

  const fiyat = (u) => (yerelHazir && cp().store.get(u.id)?.pricing?.price) || u.fiyat

  // Satın alır. Ürün verildiyse (tarayıcıda hemen) true, ödeme ekranı açıldıysa 'bekle' döner.
  async function al(id) {
    try {
      const u = bul(id)
      if (!u || sahip(u)) return false
      if (yerelHazir) {
        const offer = cp().store.get(id)?.getOffer()
        if (!offer) return false
        const hata = await offer.order()
        return hata ? false : 'bekle'
      }
      ver(u)
      return true
    } catch {
      return false
    }
  }
  function geriYukle() { try { if (yerelHazir) cp().store.restorePurchases() } catch {} }

  return { URUNLER, kur, al, sahip, fiyat, geriYukle, gercek: () => yerelHazir }
})()
