// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
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

// Bölgeler (§2.3). bedel: bölgeyi açmak için bir önceki bölgenin kasasından ödenen para (her prestij turunda yeniden).
// Oyuncu seviyesi yok (Idle Miner gibi): ilerleme yalnız parayla.
// Bedeller otomatik oyuncuyla ayarlandı: sürekli oynayan biri Beylikova'ya ~440 saatte ulaşır; bölgeler arası süre
// ~6 saatten ~100 saate uzar. Bergama'dan sonra adım küçülür (mühür artışı yavaşladığı için).
export const BOLGELER = don([
  { kod: 'zonguldak', ad: 'Zonguldak', cevher: 'Kömür', bedel: 0, olcek: 1, zorluk: 1, asama: 1, alt: 'Maden Şehri', renk: '#2B2B33', vurgu: '#6E7480' },
  { kod: 'eregli', ad: 'Ereğli', cevher: 'Demir', bedel: 2e11, olcek: 1e3, zorluk: 1.5, asama: 2, alt: 'Demir & Liman', renk: '#7A3E2A', vurgu: '#C0714E' },
  { kod: 'karabuk', ad: 'Karabük', cevher: 'Taş', bedel: 3e16, olcek: 1e6, zorluk: 2.25, asama: 2, alt: 'Taş Ocakları', renk: '#8C877C', vurgu: '#D2CCBE' },
  { kod: 'kastamonu', ad: 'Kastamonu', cevher: 'Bakır', bedel: 4.5e21, olcek: 1e9, zorluk: 3.4, asama: 2, alt: 'Bakır Madenleri', renk: '#A8552A', vurgu: '#E9935A' },
  { kod: 'balya', ad: 'Balya', cevher: 'Kurşun', bedel: 7e26, olcek: 1e12, zorluk: 5.1, asama: 2, alt: 'Kurşun & Çinko', renk: '#4A5560', vurgu: '#9AAAB8' },
  { kod: 'afyon', ad: 'Afyon', cevher: 'Mermer', bedel: 1e32, olcek: 1e15, zorluk: 7.6, asama: 2, alt: 'Mermer Ocakları', renk: '#CFC8BC', vurgu: '#FFFFFF' },
  { kod: 'keciborlu', ad: 'Keçiborlu', cevher: 'Kükürt', bedel: 1.5e37, olcek: 1e18, zorluk: 11.4, asama: 2, alt: 'Kükürt Madeni', renk: '#C9A21B', vurgu: '#FFE45A' },
  { kod: 'bergama', ad: 'Bergama', cevher: 'Altın', bedel: 7e40, olcek: 1e21, zorluk: 17, asama: 2, alt: 'Altın Damarları', renk: '#B8860B', vurgu: '#FFD84A' },
  { kod: 'gumushane', ad: 'Gümüşhane', cevher: 'Gümüş', bedel: 3e44, olcek: 1e24, zorluk: 25.6, asama: 2, alt: 'Gümüş Galerileri', renk: '#8A949E', vurgu: '#E8EEF4' },
  { kod: 'elazig', ad: 'Elazığ', cevher: 'Krom', bedel: 1.4e48, olcek: 1e27, zorluk: 38, asama: 2, alt: 'Krom Ocakları', renk: '#3E4A44', vurgu: '#8FB0A0' },
  { kod: 'kirka', ad: 'Kırka', cevher: 'Bor', bedel: 6e51, olcek: 1e30, zorluk: 57, asama: 2, alt: 'Bor Yatakları', renk: '#CFC4D8', vurgu: '#F6EEFC' },
  { kod: 'beylikova', ad: 'Beylikova', cevher: 'Neodim', bedel: 3e55, olcek: 1e33, zorluk: 86, asama: 2, alt: 'Nadir Toprak Elementleri', renk: '#5A3A7A', vurgu: '#C49AF0' },
])
export const BOLGE = don(Object.fromEntries(BOLGELER.map((b) => [b.kod, b])))
export const BASLANGIC_PARA = 20                           // × olcek

// Madenler (§2.4)
// 30 kat (Idle Miner gibi). DERIN_KAT'tan (indeks) sonra katlar "derin": açılış bedeli kat başına ×ACILIS_DERIN,
// üretim kat başına ×MADEN_URETIM_DERIN büyür; böylece derin katlar uzun oyunun hedefi olarak ulaşılabilir kalır.
export const MADEN_SAYISI = 30
export const DERIN_KAT = 12
export const ACILIS_DERIN = 8
export const MADEN_URETIM_DERIN = 6.5
export const ACILIS = don([0, 40, 500, 2e4, 1e6, 6e7, 3e9, 1.2e11, 4e12, 1.2e14, 3e15, 6e16,
  ...Array.from({ length: MADEN_SAYISI - DERIN_KAT }, (_, k) => 6e16 * Math.pow(ACILIS_DERIN, k + 1))])
export const MADEN_URETIM_TABAN = 1
export const MADEN_URETIM_ARTIS = 5
export const MADEN_MALIYET_TABAN = 4
export const MADEN_MALIYET_ARTIS = 6
// Derin katlarda (DERIN_KAT sonrası) seviye maliyetinin kat başına artışı
export const MADEN_MALIYET_DERIN = 5
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

// Depo ve taşıyıcılar (§2.6): her taşıyıcı yüzeyde bir kamyondur
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
  { adim: 4, hedef: 'depo', metin: 'Depoya dokun, kamyonlar satışa gitsin.' },
  { adim: 5, hedef: 'm0-yonetici', metin: 'Bir yönetici tut, 1. Kat kendi kendine çalışsın.' },
  { adim: 6, hedef: 'm1-ac', metin: '2. Katı aç!' },
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
  { kod: 'kazma', dal: 'Madencilik', ad: 'Keskin Kazmalar', tier: 1, sv: 5, sart: {} },
  { kod: 'damar', dal: 'Madencilik', ad: 'Damar Haritası', tier: 2, sv: 3, sart: { kazma: 1 } },
  { kod: 'usta', dal: 'Madencilik', ad: 'Usta Madenciler', tier: 2, sv: 4, sart: { kazma: 2 } },
  { kod: 'matkap', dal: 'Madencilik', ad: 'Elmas Matkap', tier: 3, sv: 1, sart: { usta: 2, bolge: 'karabuk' } },
  { kod: 'halat', dal: 'Taşıma', ad: 'Çelik Halat', tier: 1, sv: 5, sart: {} },
  { kod: 'motor', dal: 'Taşıma', ad: 'Güçlü Motor', tier: 2, sv: 4, sart: { halat: 1 } },
  { kod: 'ray', dal: 'Taşıma', ad: 'Asfalt Yol', tier: 1, sv: 5, sart: {} },
  { kod: 'depo', dal: 'Taşıma', ad: 'Geniş Depo', tier: 2, sv: 3, sart: { ray: 1 } },
  { kod: 'pazar', dal: 'Ticaret', ad: 'Pazar Bilgisi', tier: 1, sv: 5, sart: {} },
  { kod: 'gece', dal: 'Ticaret', ad: 'Gece Vardiyası', tier: 1, sv: 6, sart: {} },
  { kod: 'ihracat', dal: 'Ticaret', ad: 'İhracat Anlaşması', tier: 3, sv: 1, sart: { pazar: 3, bolge: 'eregli' } },
  { kod: 'okul', dal: 'Yönetim', ad: 'Yönetici Okulu', tier: 2, sv: 3, sart: {} },
  { kod: 'dinlenme', dal: 'Yönetim', ad: 'Dinlenme Odası', tier: 2, sv: 3, sart: { okul: 1 } },
  { kod: 'ik', dal: 'Yönetim', ad: 'İnsan Kaynakları', tier: 2, sv: 3, sart: { okul: 1 } },
  { kod: 'miras', dal: 'Yönetim', ad: 'Miras Bilgisi', tier: 2, sv: 4, sart: { bolge: 'eregli' } },
])

// Görevler (§2.14, genişletilmiş): her bölgede aynı 15 koşul; başlık, açıklama ve hikâye js/hikaye.js'de.
// para: dakika cinsinden gelirRef. tur: seviye {i, L} | yonetici | ac {n} | yon {ist} | yetenek {n} | L {ist, L} | kontrat {n} | liman {n}
export const GOREVLER = don([
  { tur: 'seviye', i: 0, L: 5, elmas: 5, para: 0 },
  { tur: 'yonetici', elmas: 5, para: 0 },
  { tur: 'ac', n: 2, elmas: 10, para: 0 },
  { tur: 'yon', ist: 'asansor', elmas: 5, para: 0 },
  { tur: 'yon', ist: 'depo', elmas: 10, para: 0 },
  { tur: 'seviye', i: 0, L: 25, elmas: 10, para: 5 },
  { tur: 'yetenek', n: 1, elmas: 10, para: 0 },
  { tur: 'ac', n: 4, elmas: 15, para: 10 },
  { tur: 'L', ist: 'asansor', L: 50, elmas: 15, para: 10 },
  { tur: 'kontrat', n: 1, elmas: 20, para: 15 },
  { tur: 'ac', n: 6, elmas: 20, para: 15 },
  { tur: 'L', ist: 'depo', L: 100, elmas: 25, para: 20 },
  { tur: 'liman', n: 3, elmas: 25, para: 20 },
  { tur: 'ac', n: 8, elmas: 30, para: 30 },
  { tur: 'ac', n: 11, elmas: 75, para: 45 },
])
export const BOLGE_USTASI_SATIS = 0.10     // bütün görevler bitince bölge satışı +%10
export const BOLGE_USTASI_ELMAS = 100
// İlk kez açılan bölge ve ilk kez açılan kat elmas verir (prestijden sonra yeniden açmak vermez)
export const BOLGE_ACMA_ELMAS = 50
export const KAT_ACMA_ELMAS = 3

// Lojistik ve Altyapı: Liman (bölge satışı) ve Ambar (çevrimdışı sınırı). Maliyet = taban × g^L × zorluk × ölçek
export const LIMAN = don({ taban: 2000, g: 30, maks: 20, satis: 0.08 })
export const AMBAR = don({ taban: 1000, g: 25, maks: 16, dakika: 15 })

// Kontratlar: hedef = otomatik cevher akışı × dk; ödül = gelirRef × dk × 30 sn + elmas
export const KONTRAT = don({ dkTaban: 10, dkArtis: 5, dkTavan: 60, elmasTaban: 5, elmasArtis: 2, elmasTavan: 25 })
export const KONTRAT_MUSTERI = don({
  zonguldak: ['Ereğli Çelik Fabrikası', 'Çatalağzı Termik Santrali', 'Kozlu Isınma Kooperatifi', 'Karadeniz Gemi Yakıtı'],
  eregli: ['Ereğli Çelik Fabrikası', 'İstanbul Tersanesi', 'Samsun Makine Sanayi', 'Karadeniz Gemi İnşa'],
  karabuk: ['Demiryolu İdaresi', 'Safranbolu Belediyesi', 'Karabük Köprü Şantiyesi', 'Bartın Liman İnşaatı'],
  kastamonu: ['Anadolu Kablo Fabrikası', 'Elektrik Dağıtım', 'Kastamonu Bakır Atölyeleri', 'İnebolu Rüzgâr Santrali'],
  balya: ['Akü Fabrikası', 'Galvaniz Atölyesi', 'Radyoloji Kalkanı Üreticisi', 'Bandırma Limanı'],
  afyon: ['Afyon Mermer Atölyeleri', 'Şehir Hastanesi Şantiyesi', 'Müze Restorasyonu', 'İtalyan Heykel Atölyesi'],
  keciborlu: ['Gübre Fabrikası', 'Lastik Sanayi', 'İlaç Laboratuvarı', 'Isparta Gül Kooperatifi'],
  bergama: ['Kuyumcular Çarşısı', 'Merkez Bankası', 'Elektronik Fabrikası', 'İzmir Limanı'],
  gumushane: ['Darphane', 'Gümüş İşlemecileri', 'Güneş Paneli Fabrikası', 'Trabzon Limanı'],
  elazig: ['Ereğli Çelik Fabrikası', 'Paslanmaz Çelik Atölyesi', 'Havacılık Sanayi', 'Hazar Gölü Barajı'],
  kirka: ['Cam Elyafı Fabrikası', 'Batarya Araştırma Merkezi', 'Seramik Fabrikası', 'Uzay Ajansı'],
  beylikova: ['Mıknatıs Fabrikası', 'Rüzgâr Türbini Üreticisi', 'Elektrikli Araç Fabrikası', 'Teknopark'],
})

// Günlük misyonlar: her gün 3 tane (tarihe göre seçilir). n: [kolay, orta, zor] (açılmış bölge sayısına göre)
// Başarımlar: kademeli; her kademe elmas verir. İlerleme benzetim.basarimDeger'den, en iyi değer (rekor) saklanır
// ki prestij sıfırlaması kazanılmış ilerlemeyi geri almasın. buyuk: hedef sayısı kısa biçimle yazılır (1 mn).
export const BASARIMLAR = don([
  { kod: 'kazanc', ad: 'Servet', metin: 'Toplam {n} kazan', esik: [1e4, 1e6, 1e8, 1e10, 1e12], buyuk: true },
  { kod: 'muhur', ad: 'Miras', metin: '{n} Miras Mührü topla', esik: [10, 100, 1000, 1e4, 1e5], buyuk: true },
  { kod: 'kat', ad: 'Derinlere', metin: 'Bir bölgede {n} maden katı aç', esik: [5, 10, 14, 17, 20] },
  { kod: 'yukseltme', ad: 'Mühendis', metin: '{n} yükseltme yap', esik: [50, 250, 1000, 5000] },
  { kod: 'kademe', ad: 'Kademe Ustası', metin: '{n} kademe geç', esik: [10, 50, 200] },
  { kod: 'yonetici', ad: 'Ekip Lideri', metin: '{n} yönetici işe al', esik: [3, 10, 25] },
  { kod: 'yetenek', ad: 'Takım Ruhu', metin: '{n} yönetici yeteneği kullan', esik: [10, 50, 250] },
  { kod: 'satis', ad: 'Tüccar', metin: '{n} kamyon cevher sat', esik: [500, 5000, 50000] },
  { kod: 'hazine', ad: 'Hazine Avcısı', metin: '{n} hazine damarı topla', esik: [5, 25, 100] },
  { kod: 'kontrat', ad: 'Sözünün Eri', metin: '{n} kontrat teslim et', esik: [3, 15, 50] },
  { kod: 'bolge', ad: 'Kâşif', metin: '{n} bölge aç', esik: [2, 4, 6, 9, 12] },
  { kod: 'dokunus', ad: 'Çalışkan Eller', metin: 'Madene {n} kez dokun', esik: [100, 1000, 10000] },
  { kod: 'prestij', ad: 'Efsane', metin: '{n} kez prestij yap', esik: [1, 3, 5] },
  { kod: 'buluntu', ad: 'Koleksiyoncu', metin: 'Müzeye {n} farklı buluntu koy', esik: [3, 12, 24, 36] },
])
export const BASARIM_ODUL = don({ elmas: [5, 10, 20, 35, 50] })

// Hazine damarı: ara ara rastgele bir katta parlayan damar belirir; dokununca ödül verir, süresi dolunca söner.
// Altın damarı gelirin 'saniye' kadarını (en az 'taban') verir; elmas damarı elmasMin..elmasMaks elmas.
// buluntuOlasilik: altın damarından ayrıca bölgenin buluntularından biri çıkma olasılığı (Maden Müzesi)
export const HAZINE = don({ ilk: 40, araMin: 70, araMaks: 140, omur: 24, saniye: 45, taban: 60, elmasOlasilik: 0.15, elmasMin: 2, elmasMaks: 5, minMaden: 2, buluntuOlasilik: 0.08 })

export const MISYONLAR = don([
  { kod: 'dokun', metin: 'Madencilere {n} kez dokun', sayac: 'dokunus', n: [20, 40, 60] },
  { kod: 'yukselt', metin: '{n} yükseltme yap', sayac: 'yukseltme', n: [10, 25, 50] },
  { kod: 'yetenek', metin: '{n} yönetici yeteneği kullan', sayac: 'yetenek', n: [1, 2, 3] },
  { kod: 'satis', metin: '{n} kamyon cevher sat', sayac: 'satis', n: [60, 200, 500] },
  { kod: 'kademe', metin: '{n} kademe geç', sayac: 'kademe', n: [1, 2, 4] },
  { kod: 'kontrat', metin: '{n} kontrat teslim et', sayac: 'kontrat', n: [1, 1, 2] },
  { kod: 'takviye', metin: "Kazanç x2'yi {n} kez başlat", sayac: 'takviye', n: [1, 1, 2] },
  { kod: 'hazine', metin: '{n} hazine damarı topla', sayac: 'hazine', n: [2, 4, 6] },
  { kod: 'cosku', metin: "Vardiya Coşkusu'nu {n} kez başlat", sayac: 'cosku', n: [1, 2, 3] },
])
export const MISYON_ODUL = don({ elmas: [5, 8, 12], bonusElmas: 15 })

// Haftalık etkinlikler (pazartesi başlar, hafta numarasına göre döner)
export const ETKINLIKLER = don([
  { kod: 'komur', ad: 'Kömür Haftası', metin: 'Zonguldak satışları ×1,5', bolge: 'zonguldak', satis: 1.5 },
  { kod: 'usta', ad: 'Usta Günleri', metin: 'Yönetici tutmak %30 ucuz', kiralama: 0.7 },
  { kod: 'liman', ad: 'Liman Festivali', metin: 'Bütün satışlar ×1,25', satis: 1.25 },
  { kod: 'demir', ad: 'Demir Haftası', metin: 'Ereğli satışları ×1,5', bolge: 'eregli', satis: 1.5 },
  { kod: 'derin', ad: 'Derin Kazı Haftası', metin: 'Yeni kat açmak %25 ucuz', acilis: 0.75 },
  { kod: 'tas', ad: 'Taş Ustaları Haftası', metin: 'Karabük satışları ×1,5', bolge: 'karabuk', satis: 1.5 },
  { kod: 'kontrat', ad: 'Kontrat Fuarı', metin: 'Kontrat ödülleri ×2', kontrat: 2 },
  { kod: 'bakir', ad: 'Bakır Haftası', metin: 'Kastamonu satışları ×1,5', bolge: 'kastamonu', satis: 1.5 },
  { kod: 'altin', ad: 'Altın Haftası', metin: 'Bergama satışları ×1,5', bolge: 'bergama', satis: 1.5 },
  { kod: 'mermer', ad: 'Mermer Haftası', metin: 'Afyon satışları ×1,5', bolge: 'afyon', satis: 1.5 },
  { kod: 'bor', ad: 'Bor Haftası', metin: 'Kırka satışları ×1,5', bolge: 'kirka', satis: 1.5 },
])

// Ortaklar: hikâyenin dört karakteri (referans 3. ekranın yönetici kartları). Sahnede tanışınca katılır,
// elmasla seviye atlar; etki = taban + artis × (L − 1). maliyet etkisi yükseltme fiyatlarını düşürür.
export const ORTAKLAR = don([
  { kod: 'ahmet', etiket: 'Verimlilik', etki: 'uretim', taban: 0.25, artis: 0.05, metin: '+%{p} üretim', sahne: 'giris' },
  { kod: 'elif', etiket: 'Lojistik', etki: 'tasima', taban: 0.40, artis: 0.08, metin: '+%{p} taşıma', sahne: 'zonguldak-5' },
  { kod: 'mehmet', etiket: 'Gelir', etki: 'gelir', taban: 0.15, artis: 0.03, metin: '+%{p} gelir', sahne: 'ogretici' },
  { kod: 'zeynep', etiket: 'Ar-Ge', etki: 'maliyet', taban: 0.20, artis: 0.025, metin: '-%{p} maliyet', sahne: 'zonguldak-6' },
])
export const ORTAK_MAKS = 10
export const ORTAK_MALIYET = don([0, 30, 60, 100, 160, 240, 350, 500, 700, 950])   // L → L+1 (elmas)

// Prestij (Egg Inc / Idle Miner tarzı "baştan başla"): bütün bölgeler kapanır, Zonguldak tek katla yeniden başlar.
// Bu turun kazancına göre kalıcı Miras Mührü verilir: mühür = ⌊(turKazanç / esik)^us⌋; her mühür bütün satışları
// +%10 artırır (Miras Bilgisi araştırması +%1/sv). Oyuncu seviyesi, elmas, araştırma, ortaklar, hikâye, başarımlar ve
// elmasla/hediyeyle gelen ustabaşılar kalır. eskiSv: eski sistemdeki her prestij (×0,5) = 5 mühür.
export const PRESTIJ = don({ esik: 1e10, us: 0.15, etki: 0.10, eskiSv: 5 })

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

// ════════ Diğer oyunlardan uyarlanan sistemler (docs/ARASTIRMA.md) ════════

// Sert kaya (Idle Miner Tycoon'daki bariyer): her 5 katta bir, yeni katın önünde sert kaya durur ve sondajla delinir
// (6., 11., 16., 21. ve 26. Kat). Bedel = o katın açılış bedeli × maliyet; süre kayanın sırasına göre. Bölgede daha
// önce delinmiş kaya (prestijden sonra) tecrübeli ekiple 'tecrube' kadar sürer. Reklam −15 dk (en çok 2 kez), elmasla
// bitirmek kalan her 5 dakika için 1 elmas.
export const KAYA = don({ aralik: 5, maliyet: 0.25, sure: [120, 600, 1800, 3600, 7200], tecrube: 0.25, reklamSn: 900, reklamHak: 2 })

// Vardiya Coşkusu (tıklama oyunlarındaki "frenzy"): öğretici bittikten sonra madene her dokunuş göstergeyi doldurur,
// dokunulmazsa gösterge yavaşça boşalır. Dolunca 'sure' sn boyunca bütün zincir 'carpan' kat hızlı çalışır
// (üretim, asansör hızı, kamyon hızı). Çok hızlı art arda dokunuşlar 'aralik' sn'de bir sayılır.
export const COSKU = don({ dokunus: 0.04, sizinti: 0.02, aralik: 0.12, sure: 15, carpan: 2 })

// Maden Müzesi (Mr. Mine kalıntıları, Egg Inc eserleri, Deep Town mağara buluntuları): her bölgenin üç buluntusu var.
// Keşif seferleri ve altın damarları buluntu getirir; aynı buluntu yeniden çıkarsa seviyesi artar (en çok 5).
// Etki türleri ortaklarınkiyle aynıdır; birim etki seviye başınadır. Maliyet indirimi toplamda en çok %50.
// Bir bölgenin üç buluntusu da müzedeyse o bölgenin satışı ×(1 + set).
// gorsel/ton: müzedeki çizimi (sahne/simge.js; 'cevher' bölgenin cevher yığını).
// Etkiler otomatik oyuncuyla ayarlandı: keşif sen yokken de sürdüğü için koleksiyon erken dolar; daha güçlü etkiler
// oyunu fazla kısaltıyordu (docs/ARASTIRMA.md §5).
export const BULUNTU = don({ maks: 5, set: 0.1, maliyetTavan: 0.3, etki: { uretim: 0.02, tasima: 0.025, gelir: 0.015, maliyet: 0.01 } })
export const BULUNTULAR = don([
  { kod: 'lamba', bolge: 'zonguldak', ad: 'Karbür Lambası', etki: 'uretim', metin: 'Ocağın ilk madencilerinin asetilenle yanan lambası.', gorsel: 'lamba', ton: '#C9A040' },
  { kod: 'egrelti', bolge: 'zonguldak', ad: 'Eğrelti Fosili', etki: 'maliyet', metin: 'Kömür damarında 300 milyon yıl önceki ormandan kalan yaprak izi.', gorsel: 'yaprak', ton: '#7E7468' },
  { kod: 'uzunmehmet', bolge: 'zonguldak', ad: "Uzun Mehmet'in Kömürü", etki: 'gelir', metin: "1829'da Kestaneci'de bulunan ilk taş kömürü parçası.", gorsel: 'cevher' },
  { kod: 'hematit', bolge: 'eregli', ad: 'Hematit Kristali', etki: 'uretim', metin: 'Kırmızı tozlu, ağır ve parlak demir cevheri.', gorsel: 'cevher' },
  { kod: 'capa', bolge: 'eregli', ad: 'Eski Gemi Çapası', etki: 'tasima', metin: 'Ereğli limanında cevher yükleyen yelkenlilerden kalma.', gorsel: 'capa', ton: '#5E6A74' },
  { kod: 'herakleia', bolge: 'eregli', ad: 'Herakleia Sikkesi', etki: 'gelir', metin: "Ereğli'nin antik adı Herakleia Pontike'nin bronz parası.", gorsel: 'antik', ton: '#B87333' },
  { kod: 'ammonit', bolge: 'karabuk', ad: 'Ammonit Fosili', etki: 'uretim', metin: 'Kalker ocağından çıkan sarmal deniz kabuğu.', gorsel: 'ammonit', ton: '#C8B48E' },
  { kod: 'raycivisi', bolge: 'karabuk', ad: 'Eski Ray Çivisi', etki: 'tasima', metin: 'İlk demiryolu hattının dövme çelik çivisi.', gorsel: 'civi', ton: '#6E7A86' },
  { kod: 'konakanahtari', bolge: 'karabuk', ad: 'Konak Anahtarı', etki: 'maliyet', metin: 'Safranbolu konağından kalma dövme demir anahtar.', gorsel: 'anahtar', ton: '#4E5862' },
  { kod: 'kurebaltasi', bolge: 'kastamonu', ad: 'Küre Bakır Baltası', etki: 'uretim', metin: 'Küre ocaklarının binlerce yıllık bakır aleti.', gorsel: 'balta', ton: '#C46A34' },
  { kod: 'sahan', bolge: 'kastamonu', ad: 'Bakır Sahan', etki: 'gelir', metin: 'Kalaylanmış, el işi dövme bakır kap.', gorsel: 'kap', ton: '#C46A34' },
  { kod: 'paflagonya', bolge: 'kastamonu', ad: 'Paflagonya Mührü', etki: 'maliyet', metin: 'Antik Paflagonya tüccarlarının taş mührü.', gorsel: 'antik', ton: '#9AA2A8' },
  { kod: 'galen', bolge: 'balya', ad: 'Galen Kristali', etki: 'uretim', metin: 'Küp küp kırılan gümüş grisi kurşun cevheri.', gorsel: 'cevher' },
  { kod: 'vagonteker', bolge: 'balya', ad: 'Vagon Tekerleği', etki: 'tasima', metin: 'Eski maden demiryolunun pik döküm tekerleği.', gorsel: 'teker', ton: '#4E5862' },
  { kod: 'hisse', bolge: 'balya', ad: 'Maden Şirketi Hissesi', etki: 'gelir', metin: 'Balya ocaklarını işleten eski şirketin sararmış senedi.', gorsel: 'belge', ton: '#E8DCC0' },
  { kod: 'keski', bolge: 'afyon', ad: 'Mermerci Keskisi', etki: 'uretim', metin: 'Usta taş yontucunun çelik keskisi.', gorsel: 'keski', ton: '#8C98A4' },
  { kod: 'dokimeion', bolge: 'afyon', ad: 'Dokimeion Sütun Başlığı', etki: 'gelir', metin: 'Antik ocaklardan Roma\'ya giden mermerden bir parça.', gorsel: 'sutun', ton: '#EDE8DE' },
  { kod: 'frigkabartma', bolge: 'afyon', ad: 'Frig Kabartması', etki: 'maliyet', metin: 'Frig vadisinden kaya kabartmasının bir parçası.', gorsel: 'tas', ton: '#C9B894' },
  { kod: 'kukurtkristali', bolge: 'keciborlu', ad: 'Kükürt Kristali', etki: 'uretim', metin: 'Güneş sarısı, iğne iğne kükürt kristali.', gorsel: 'cevher' },
  { kod: 'kantar', bolge: 'keciborlu', ad: 'Eski Kükürt Kantarı', etki: 'gelir', metin: 'Ocak ağzında çuvalları tartan pirinç kantar.', gorsel: 'kantar', ton: '#C9A040' },
  { kod: 'duduk', bolge: 'keciborlu', ad: 'Lokomotif Düdüğü', etki: 'tasima', metin: 'Kükürt trenlerinin buharlı düdüğü.', gorsel: 'duduk', ton: '#C9A040' },
  { kod: 'altinelek', bolge: 'bergama', ad: 'Altın Eleği', etki: 'uretim', metin: 'Dere kumundan altın ayıklayan eski elek.', gorsel: 'elek', ton: '#9A6334' },
  { kod: 'pergamon', bolge: 'bergama', ad: 'Pergamon Sikkesi', etki: 'gelir', metin: 'Bergama krallığının altın sikkesi.', gorsel: 'antik', ton: '#F2C14E' },
  { kod: 'parsomen', bolge: 'bergama', ad: 'Parşömen Tomarı', etki: 'maliyet', metin: "Parşömenin doğduğu Bergama'dan bir tomar.", gorsel: 'tomar', ton: '#E6D3A8' },
  { kod: 'telkari', bolge: 'gumushane', ad: 'Telkari Broş', etki: 'gelir', metin: 'İnce gümüş tellerle örülmüş usta işi broş.', gorsel: 'bros', ton: '#D8E0E8' },
  { kod: 'kandil', bolge: 'gumushane', ad: 'Gümüş Kandil', etki: 'maliyet', metin: 'Eski galerileri aydınlatan işlemeli kandil.', gorsel: 'kandil', ton: '#C8D0D8' },
  { kod: 'kervancani', bolge: 'gumushane', ad: 'Kervan Çanı', etki: 'tasima', metin: 'Zigana geçidini aşan kervanların tunç çanı.', gorsel: 'can', ton: '#B5893A' },
  { kod: 'kromit', bolge: 'elazig', ad: 'Kromit Yumrusu', etki: 'uretim', metin: 'Simsiyah, metal parlaklığında krom cevheri.', gorsel: 'cevher' },
  { kod: 'harput', bolge: 'elazig', ad: 'Harput Kalesi Taşı', etki: 'maliyet', metin: 'Harput surlarından düşmüş yontma taş.', gorsel: 'kale', ton: '#B9A27E' },
  { kod: 'kurek', bolge: 'elazig', ad: 'Hazar Küreği', etki: 'tasima', metin: 'Hazar Gölü kayıkçılarının oyma küreği.', gorsel: 'kurek', ton: '#9A6334' },
  { kod: 'boraks', bolge: 'kirka', ad: 'Boraks Kristali', etki: 'uretim', metin: 'Saydam, prizma biçimli bor kristali.', gorsel: 'cevher' },
  { kod: 'frigkabi', bolge: 'kirka', ad: 'Frig Seramiği', etki: 'gelir', metin: 'Bölgenin antik çömlekçilerinden boyalı bir kap.', gorsel: 'testi', ton: '#C8784A' },
  { kod: 'kervannali', bolge: 'kirka', ad: 'Tuz Kervanı Nalı', etki: 'tasima', metin: 'Eskişehir yolunu aşındıran kervan atının nalı.', gorsel: 'nal', ton: '#6E7A86' },
  { kod: 'bastnazit', bolge: 'beylikova', ad: 'Bastnazit Kristali', etki: 'uretim', metin: 'Nadir toprak elementlerini taşıyan bal renkli cevher.', gorsel: 'cevher' },
  { kod: 'miknatis', bolge: 'beylikova', ad: 'Neodim Mıknatıs', etki: 'tasima', metin: 'Avuç içi kadar ama bir kamyon kasasını tutacak güçte.', gorsel: 'miknatis', ton: '#D0413A' },
  { kod: 'defter', bolge: 'beylikova', ad: "Kâzım Dede'nin Defteri", etki: 'gelir', metin: 'Dedenin bütün ocakları anlattığı yıpranmış defter.', gorsel: 'defter', ton: '#7A4E2A' },
])

// Keşif seferleri (Egg Inc gemileri, Mr. Mine bilim insanları, Deep Town keşif robotları): Zeynep'in ekibi seçilen
// süre kadar keşfe çıkar; dönüşte seferin çıktığı bölgenin buluntularından 'zar' kez 'olasilik'le buluntu ve elmas
// getirir. Aynı anda bir sefer. İlk sefer mutlaka bir buluntuyla döner. Reklam −15 dk (en çok 2), elmasla bitirmek
// kalan her 5 dakika için 1 elmas.
export const KESIF = don([
  { kod: 'kisa', ad: 'Yakın Mağaralar', sure: 1800, zar: 1, olasilik: 0.6, elmas: [1, 3] },
  { kod: 'orta', ad: 'Eski Galeriler', sure: 7200, zar: 2, olasilik: 0.75, elmas: [3, 6] },
  { kod: 'uzun', ad: 'Derin Keşif', sure: 28800, zar: 3, olasilik: 0.9, elmas: [8, 15] },
])
export const KESIF_HIZ = don({ reklamSn: 900, reklamHak: 2 })

// Elmas Kumbarası (Egg Inc'teki kumbara): yükseltme, kat açma, kontrat ve hazineyle elmas birikir; mağazadan kırılınca
// içindekiler alınır. Tavan her kırılışta büyür; her kırılış dolum hızını 'bonus' artırır (en çok 'bonusMaks').
// enAz: mağazada kırmak için gereken en az elmas
export const KUMBARA = don({ yukseltme: 0.2, kat: 2, kontrat: 5, hazine: 1, tavan: 500, tavanArtis: 250, tavanMaks: 2000, bonus: 0.1, bonusMaks: 1, enAz: 50 })
