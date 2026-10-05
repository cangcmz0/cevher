// Paket A: tüm sabitler ve veri tabloları (TASARIM §2). Saf veri, DOM yok.
// S2 tabloları burada durur ama S1'de kullanılmaz.

const don = (o) => {
  Object.freeze(o)
  for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object' && !Object.isFrozen(o[k])) don(o[k])
  return o
}

export const SURUM = 1

// Kademeler (§2.2): 10, 25, sonra 25'er
const kademeListesi = (son) => {
  const l = [10]
  for (let m = 25; m <= son; m += 25) l.push(m)
  return l
}
export const KADEME_MADEN = don(kademeListesi(400))       // 17 giriş
export const KADEME_ISTASYON = don(kademeListesi(800))    // 33 giriş

// Bölgeler (§2.3)
export const BOLGELER = don([
  { kod: 'zonguldak', ad: 'Zonguldak', cevher: 'Kömür', acilisLv: 1, olcek: 1, zorluk: 1, asama: 1 },
  { kod: 'bartin', ad: 'Bartın', cevher: 'Manganez', acilisLv: 20, olcek: 1e3, zorluk: 1.5, asama: 2 },
  { kod: 'kastamonu', ad: 'Kastamonu', cevher: 'Bakır', acilisLv: 35, olcek: 1e6, zorluk: 2.25, asama: 2 },
  { kod: 'karabuk', ad: 'Karabük', cevher: 'Demir', acilisLv: 50, olcek: 1e9, zorluk: 3.4, asama: 2 },
  { kod: 'gumushane', ad: 'Gümüşhane', cevher: 'Gümüş', acilisLv: 65, olcek: 1e12, zorluk: 5.1, asama: 2 },
  { kod: 'artvin', ad: 'Artvin', cevher: 'Altın', acilisLv: 80, olcek: 1e15, zorluk: 7.6, asama: 2 },
])
export const BOLGE = don(Object.fromEntries(BOLGELER.map((b) => [b.kod, b])))
export const BASLANGIC_PARA = 20                           // × olcek

// Madenler (§2.4)
export const MADEN_SAYISI = 12
export const ACILIS = don([0, 40, 500, 2e4, 1e6, 6e7, 3e9, 1.2e11, 4e12, 1.2e14, 3e15, 6e16])
export const MADEN_URETIM_TABAN = 1
export const MADEN_URETIM_ARTIS = 5
export const MADEN_MALIYET_TABAN = 4
export const MADEN_MALIYET_ARTIS = 6
export const MADEN_MALIYET_G = 1.10
export const YIGIN_SANIYE = 90
export const MAKS_MADEN_SEVIYE = 400
export const KAZI_SURESI = 3.0

// Asansör (§2.5)
export const ASANSOR_KAP_TABAN = 20
export const ASANSOR_HIZ_TABAN = 1.0
export const DURAK = 0.5
export const BOSALTMA = 0.8
export const ISTASYON_MALIYET_TABAN = 5
export const ISTASYON_MALIYET_G = 1.05
export const MAKS_ISTASYON_SEVIYE = 800

// Depo ve taşıyıcılar (§2.6)
export const TASIYICI_ESIK = don([10, 50, 150, 300])
export const TASIYICI_YUK_TABAN = 20
export const DEPO_YOL_TABAN = 2.5
export const YUKLEME = 0.6
export const SATIS = 0.4
export const DEPO_KAP_SANIYE = 30
export const TASIYICI_ARALIK = 0.35

// Hız çarpanı tavanı (asansör ve taşıyıcı): min(3, 1 + 0.004*(L-1))
export const HIZ_TAVAN = 3
export const HIZ_ARTIS = 0.004

// Yöneticiler (§2.7)
export const MAKS_YONETICI = 20
export const KIRALAMA_TABAN = don({ maden: 25, asansor: 100, depo: 150 })
export const KIRALAMA_ARTIS = 6
export const ELMAS_KIRALAMA = 50
export const NADIRLIKLER = don([
  { ad: 'Sıradan', renk: '#B8C2C8', carpan: 2, indirim: 0.40, sure: 120, bekleme: 600 },
  { ad: 'Nadir', renk: '#4A90E2', carpan: 3, indirim: 0.60, sure: 180, bekleme: 600 },
  { ad: 'Efsanevi', renk: '#F6C453', carpan: 5, indirim: 0.80, sure: 300, bekleme: 900 },
])
// Nadirlik olasılıkları (birikimli değil): [Sıradan, Nadir, Efsanevi]
export const NADIRLIK_ODDS = don({ para: [0.70, 0.25, 0.05], elmas: [0, 0.70, 0.30] })
export const YONETICI_TIPLERI = don(['maden', 'asansor', 'depo'])
export const YETENEKLER = don({
  kazi: { kod: 'kazi', tip: 'maden', ad: 'Kazı Hızı', etki: 'uretim' },
  pazarlik: { kod: 'pazarlik', tip: 'maden', ad: 'Pazarlık', etki: 'indirim' },
  hizli: { kod: 'hizli', tip: 'asansor', ad: 'Hızlı Kabin', etki: 'hiz' },
  genis: { kod: 'genis', tip: 'asansor', ad: 'Geniş Kabin', etki: 'kapasite' },
  cevik: { kod: 'cevik', tip: 'depo', ad: 'Çevik Taşıyıcı', etki: 'hiz' },
  dolu: { kod: 'dolu', tip: 'depo', ad: 'Dolu Sepet', etki: 'yuk' },
})
export const TIP_YETENEKLERI = don({ maden: ['kazi', 'pazarlik'], asansor: ['hizli', 'genis'], depo: ['cevik', 'dolu'] })
// Eski oyunun isim listesi (cevher-3d-kaynak/orijinal/js/ekonomi.js ISIMLER)
export const ISIMLER = don({
  e: ['Hasan', 'Mehmet', 'Ali', 'Mustafa', 'Hüseyin', 'İbrahim', 'Osman', 'Yusuf', 'Ramazan', 'Kemal', 'Cemal', 'Rıza', 'Halil', 'İsmail', 'Şükrü', 'Veli', 'Durmuş', 'Bekir'],
  k: ['Ayşe', 'Fatma', 'Zeynep', 'Emine', 'Hatice', 'Elif', 'Hacer', 'Gülsüm', 'Şerife', 'Nazlı', 'Zehra', 'Hanife', 'Meryem', 'Saliha', 'Döndü', 'Sultan'],
})

// Darboğaz (§2.8)
export const DARBOGAZ_ARALIK = 0.5
export const DARBOGAZ_YUKSEL = 3
export const DARBOGAZ_TEMIZLE = 5
export const DEPO_BOSTA_SURE = 4
export const DARBOGAZ_METIN = don({
  asansor: ['Asansör kapasitesi yetersiz!', 'Üretim depoya takılıyor.'],
  depo: ['Depo kapasitesi yetersiz!', 'Satış üretime yetişmiyor.'],
  asansorManuel: ['Asansör bekliyor!', 'Dokun ya da yönetici tut.'],
  depoManuel: ['Depo doldu!', 'Dokun ya da yönetici tut.'],
})

// İstatistikler (§2.9)
export const GELIR_EMA_SURE = 10
export const GECMIS_ARALIK = 30
export const GECMIS_UZUNLUK = 10

// Alım modları (§2.10)
export const ALIM_MODLARI = don([1, 10, 50, 'max'])

// Oyuncu seviyesi ve XP (§2.11)
export const MAKS_SEVIYE = 100
export const XP = don({
  harcamaKatsayi: 12,      // max(1, round(12 * harcama / (60 * gelirRef)))
  harcamaSaniye: 60,
  kademe: 25,
  madenAcma: 40,           // × maden numarası
  yonetici: 20,
  yetenek: 5,
  egriTaban: 1.03,
  egriBaslangic: 12,
})
export const SATIS_SEVIYE_ARTIS = 0.02
// Seviye açılımları. S1'de yalnızca etkin olanlar olayda bildirilir.
export const ACILIMLAR = don({ 2: ['takviye'] })
export const ACILIMLAR_S2 = don({ 3: ['arastirma'], 5: ['teklif'], 20: ['bartin'], 35: ['kastamonu'], 50: ['karabuk'], 65: ['gumushane'], 80: ['artvin'] })

// Takviye (§2.12)
export const TAKVIYE_DAKIKA = 30
export const TAKVIYE_SINIR_SAAT = 4
export const TAKVIYE_MAGAZA_SINIR_SAAT = 24

// Çevrimdışı (§3.4)
export const CEVRIMDISI_SINIR_SAAT = 2
export const CEVRIMDISI_EN_AZ = 60
export const SAAT_TOLERANS_MS = 120000
export const YEDEK_ARALIK_MS = 300000

// Öğretici (§2.13)
export const OGRETICI_ADIMLARI = don([
  null,
  { adim: 1, hedef: 'm0-yukselt', metin: 'Madenini yükselt!' },
  { adim: 2, hedef: 'm0-oda', metin: 'Madencilere dokun, kazmaya başlasınlar.' },
  { adim: 3, hedef: 'asansor', metin: 'Asansöre dokun, cevheri yukarı taşısın.' },
  { adim: 4, hedef: 'depo', metin: 'Depoya dokun, taşıyıcılar satsın.' },
  { adim: 5, hedef: 'm0-yonetici', metin: 'Bir yönetici tut, Maden 1 kendi kendine çalışsın.' },
  { adim: 6, hedef: 'm1-ac', metin: "Maden 2'yi aç!" },
  { adim: 7, hedef: 'asansor-yonetici', metin: 'Asansöre yönetici tut.' },
  { adim: 8, hedef: 'depo-yonetici', metin: 'Depoya yönetici tut.' },
  { adim: 9, hedef: null, metin: 'Artık madenin kendi kendine işliyor. Yükseltmeye devam et!' },
])
export const OGRETICI_SON_ADIM = 9

// Araştırma (§2.15) [S2]
export const ARASTIRMA_SURELER = don([120, 900, 3600, 10800, 28800, 57600])
export const ARASTIRMA_MALIYET = don({ 1: [5, 15, 40, 90, 180, 350], 2: [10, 30, 80, 180], 3: [300] })
export const ARASTIRMA_T3_SURE = 86400
export const ARASTIRMALAR = don([
  { kod: 'kazma', dal: 'Madencilik', ad: 'Keskin Kazmalar', tier: 1, sv: 5, sart: { lv: 3 } },
  { kod: 'damar', dal: 'Madencilik', ad: 'Damar Haritası', tier: 2, sv: 3, sart: { kazma: 1 } },
  { kod: 'usta', dal: 'Madencilik', ad: 'Usta Madenciler', tier: 2, sv: 4, sart: { kazma: 2, lv: 10 } },
  { kod: 'matkap', dal: 'Madencilik', ad: 'Elmas Matkap', tier: 3, sv: 1, sart: { usta: 2, lv: 30 } },
  { kod: 'halat', dal: 'Taşıma', ad: 'Çelik Halat', tier: 1, sv: 5, sart: { lv: 3 } },
  { kod: 'motor', dal: 'Taşıma', ad: 'Güçlü Motor', tier: 2, sv: 4, sart: { halat: 1 } },
  { kod: 'ray', dal: 'Taşıma', ad: 'Raylı Yol', tier: 1, sv: 5, sart: { lv: 4 } },
  { kod: 'depo', dal: 'Taşıma', ad: 'Geniş Depo', tier: 2, sv: 3, sart: { ray: 1 } },
  { kod: 'pazar', dal: 'Ticaret', ad: 'Pazar Bilgisi', tier: 1, sv: 5, sart: { lv: 4 } },
  { kod: 'gece', dal: 'Ticaret', ad: 'Gece Vardiyası', tier: 1, sv: 6, sart: { lv: 5 } },
  { kod: 'ihracat', dal: 'Ticaret', ad: 'İhracat Anlaşması', tier: 3, sv: 1, sart: { pazar: 3, lv: 25 } },
  { kod: 'okul', dal: 'Yönetim', ad: 'Yönetici Okulu', tier: 2, sv: 3, sart: { lv: 6 } },
  { kod: 'dinlenme', dal: 'Yönetim', ad: 'Dinlenme Odası', tier: 2, sv: 3, sart: { okul: 1 } },
  { kod: 'ik', dal: 'Yönetim', ad: 'İnsan Kaynakları', tier: 2, sv: 3, sart: { lv: 8 } },
])

// Görevler (§2.14) [S2]. para: dakika cinsinden gelirRef
export const GOREVLER = don([
  { metin: "Maden 1'i 5. seviyeye çıkar", xp: 30, elmas: 5, para: 0 },
  { metin: 'Bir yönetici tut', xp: 40, elmas: 5, para: 0 },
  { metin: "Maden 2'yi aç", xp: 50, elmas: 10, para: 0 },
  { metin: 'Asansöre yönetici tut', xp: 50, elmas: 5, para: 0 },
  { metin: 'Depoya yönetici tut', xp: 60, elmas: 10, para: 0 },
  { metin: "Maden 1'i 25. seviyeye çıkar", xp: 80, elmas: 10, para: 5 },
  { metin: 'Bir yönetici yeteneği kullan', xp: 80, elmas: 10, para: 0 },
  { metin: "Maden 4'ü aç", xp: 120, elmas: 15, para: 10 },
  { metin: 'Asansörü 100. seviyeye çıkar', xp: 150, elmas: 15, para: 10 },
  { metin: "Maden 6'yı aç", xp: 200, elmas: 20, para: 15 },
  { metin: 'Depoyu 200. seviyeye çıkar', xp: 250, elmas: 25, para: 20 },
  { metin: "Maden 8'i aç", xp: 400, elmas: 50, para: 30 },
])

// Günlük hediye (§2.16) [S2]
export const GUNLUK_HEDIYE = don([
  { metin: "20 dk'lık gelir", tur: 'para', dk: 20 },
  { metin: '10 elmas', tur: 'elmas', n: 10 },
  { metin: 'Kazanç x2 · 30 dk', tur: 'takviye', dk: 30 },
  { metin: "45 dk'lık gelir", tur: 'para', dk: 45 },
  { metin: '20 elmas', tur: 'elmas', n: 20 },
  { metin: 'Nadir yönetici', tur: 'yonetici', nadirlik: 1 },
  { metin: '50 elmas', tur: 'elmas', n: 50 },
])

// Mağaza elmas harcamaları (§2.16) [S2]
export const ELMAS_HARCAMA = don({
  takviye4: { metin: 'Kazanç x2 · 4 saat', elmas: 80 },
  atla1: { metin: 'Zaman Atla · 1 saat', elmas: 30, saat: 1 },
  atla4: { metin: 'Zaman Atla · 4 saat', elmas: 100, saat: 4 },
  yenile: { metin: 'Yetenekleri Yenile', elmas: 10 },
})
