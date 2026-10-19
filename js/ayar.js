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

// Bölgeler (§2.3). bedel: bölgeyi açmak için bir önceki bölgenin kasasından ödenen para (her prestij turunda yeniden)
export const BOLGELER = don([
  { kod: 'zonguldak', ad: 'Zonguldak', cevher: 'Kömür', acilisLv: 1, bedel: 0, olcek: 1, zorluk: 1, asama: 1, alt: 'Maden Şehri', renk: '#2B2B33', vurgu: '#6E7480' },
  { kod: 'eregli', ad: 'Ereğli', cevher: 'Demir', acilisLv: 15, bedel: 2e11, olcek: 1e3, zorluk: 1.5, asama: 2, alt: 'Demir & Liman', renk: '#7A3E2A', vurgu: '#C0714E' },
  { kod: 'karabuk', ad: 'Karabük', cevher: 'Taş', acilisLv: 30, bedel: 5e16, olcek: 1e6, zorluk: 2.25, asama: 2, alt: 'Taş Ocakları', renk: '#8C877C', vurgu: '#D2CCBE' },
  { kod: 'kastamonu', ad: 'Kastamonu', cevher: 'Bakır', acilisLv: 45, bedel: 3e20, olcek: 1e9, zorluk: 3.4, asama: 2, alt: 'Bakır Madenleri', renk: '#A8552A', vurgu: '#E9935A' },
  { kod: 'balya', ad: 'Balya', cevher: 'Kurşun', acilisLv: 60, bedel: 2e24, olcek: 1e12, zorluk: 5.1, asama: 2, alt: 'Kurşun & Çinko', renk: '#4A5560', vurgu: '#9AAAB8' },
  { kod: 'afyon', ad: 'Afyon', cevher: 'Mermer', acilisLv: 75, bedel: 2e28, olcek: 1e15, zorluk: 7.6, asama: 2, alt: 'Mermer Ocakları', renk: '#CFC8BC', vurgu: '#FFFFFF' },
  { kod: 'keciborlu', ad: 'Keçiborlu', cevher: 'Kükürt', acilisLv: 90, bedel: 2e32, olcek: 1e18, zorluk: 11.4, asama: 2, alt: 'Kükürt Madeni', renk: '#C9A21B', vurgu: '#FFE45A' },
  { kod: 'bergama', ad: 'Bergama', cevher: 'Altın', acilisLv: 105, bedel: 2e36, olcek: 1e21, zorluk: 17, asama: 2, alt: 'Altın Damarları', renk: '#B8860B', vurgu: '#FFD84A' },
  { kod: 'gumushane', ad: 'Gümüşhane', cevher: 'Gümüş', acilisLv: 120, bedel: 2e40, olcek: 1e24, zorluk: 25.6, asama: 2, alt: 'Gümüş Galerileri', renk: '#8A949E', vurgu: '#E8EEF4' },
  { kod: 'elazig', ad: 'Elazığ', cevher: 'Krom', acilisLv: 135, bedel: 2e44, olcek: 1e27, zorluk: 38, asama: 2, alt: 'Krom Ocakları', renk: '#3E4A44', vurgu: '#8FB0A0' },
  { kod: 'kirka', ad: 'Kırka', cevher: 'Bor', acilisLv: 150, bedel: 2e48, olcek: 1e30, zorluk: 57, asama: 2, alt: 'Bor Yatakları', renk: '#CFC4D8', vurgu: '#F6EEFC' },
  { kod: 'beylikova', ad: 'Beylikova', cevher: 'Neodim', acilisLv: 170, bedel: 2e52, olcek: 1e33, zorluk: 86, asama: 2, alt: 'Nadir Toprak Elementleri', renk: '#5A3A7A', vurgu: '#C49AF0' },
])
export const BOLGE = don(Object.fromEntries(BOLGELER.map((b) => [b.kod, b])))
export const BASLANGIC_PARA = 20                           // × olcek

// Madenler (§2.4)
// 30 kat (Idle Miner gibi); 15. kattan sonra her yeni kat bir öncekinin 20 katı
export const MADEN_SAYISI = 30
export const ACILIS = don([0, 40, 500, 2e4, 1e6, 6e7, 3e9, 1.2e11, 4e12, 1.2e14, 3e15, 6e16, 1.2e18, 2.4e19, 4.8e20,
  ...Array.from({ length: 15 }, (_, k) => 4.8e20 * Math.pow(20, k + 1))])
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
export const MAKS_SEVIYE = 200
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
export const ACILIMLAR = don({
  2: ['takviye'], 3: ['arastirma'], 5: ['teklif'], 15: ['eregli'], 30: ['karabuk'], 45: ['kastamonu'], 60: ['balya'],
  75: ['afyon'], 90: ['keciborlu'], 105: ['bergama'], 120: ['gumushane'], 135: ['elazig'], 150: ['kirka'], 170: ['beylikova'],
})
export const ACILIM_ADLARI = don({
  takviye: 'Kazanç x2 düğmesi', arastirma: 'Araştırma laboratuvarı', teklif: 'Mağazada Özel Teklif',
  eregli: 'Ereğli (Demir) açılabilir', karabuk: 'Karabük (Taş) açılabilir', kastamonu: 'Kastamonu (Bakır) açılabilir',
  balya: 'Balya (Kurşun) açılabilir', afyon: 'Afyon (Mermer) açılabilir', keciborlu: 'Keçiborlu (Kükürt) açılabilir',
  bergama: 'Bergama (Altın) açılabilir', gumushane: 'Gümüşhane (Gümüş) açılabilir', elazig: 'Elazığ (Krom) açılabilir',
  kirka: 'Kırka (Bor) açılabilir', beylikova: 'Beylikova (Neodim) açılabilir',
})

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
  { adim: 5, hedef: 'm0-yonetici', metin: 'Bir yönetici tut, 2. Kat kendi kendine çalışsın.' },
  { adim: 6, hedef: 'm1-ac', metin: '3. Katı aç!' },
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
  { kod: 'miras', dal: 'Yönetim', ad: 'Miras Bilgisi', tier: 2, sv: 4, sart: { lv: 15 } },
])

// Görevler (§2.14, genişletilmiş): her bölgede aynı 15 koşul; başlık, açıklama ve hikâye js/hikaye.js'de.
// para: dakika cinsinden gelirRef. tur: seviye {i, L} | yonetici | ac {n} | yon {ist} | yetenek {n} | L {ist, L} | kontrat {n} | liman {n}
export const GOREVLER = don([
  { tur: 'seviye', i: 0, L: 5, xp: 30, elmas: 5, para: 0 },
  { tur: 'yonetici', xp: 40, elmas: 5, para: 0 },
  { tur: 'ac', n: 2, xp: 50, elmas: 10, para: 0 },
  { tur: 'yon', ist: 'asansor', xp: 50, elmas: 5, para: 0 },
  { tur: 'yon', ist: 'depo', xp: 60, elmas: 10, para: 0 },
  { tur: 'seviye', i: 0, L: 25, xp: 80, elmas: 10, para: 5 },
  { tur: 'yetenek', n: 1, xp: 80, elmas: 10, para: 0 },
  { tur: 'ac', n: 4, xp: 120, elmas: 15, para: 10 },
  { tur: 'L', ist: 'asansor', L: 50, xp: 150, elmas: 15, para: 10 },
  { tur: 'kontrat', n: 1, xp: 180, elmas: 20, para: 15 },
  { tur: 'ac', n: 6, xp: 200, elmas: 20, para: 15 },
  { tur: 'L', ist: 'depo', L: 100, xp: 250, elmas: 25, para: 20 },
  { tur: 'liman', n: 3, xp: 300, elmas: 25, para: 20 },
  { tur: 'ac', n: 8, xp: 400, elmas: 30, para: 30 },
  { tur: 'ac', n: 11, xp: 600, elmas: 75, para: 45 },
])
export const BOLGE_USTASI_SATIS = 0.10     // bütün görevler bitince bölge satışı +%10
export const BOLGE_USTASI_ELMAS = 100
export const BOLGE_ACMA_XP = 250

// Lojistik ve Altyapı: Liman (bölge satışı) ve Ambar (çevrimdışı sınırı). Maliyet = taban × g^L × zorluk × ölçek
export const LIMAN = don({ taban: 2000, g: 30, maks: 20, satis: 0.08 })
export const AMBAR = don({ taban: 1000, g: 25, maks: 16, dakika: 15 })

// Kontratlar: hedef = otomatik cevher akışı × dk; ödül = gelirRef × dk × 30 sn + elmas
export const KONTRAT = don({ dkTaban: 10, dkArtis: 5, dkTavan: 60, elmasTaban: 5, elmasArtis: 2, elmasTavan: 25, xpTaban: 50, xpArtis: 10 })
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

// Günlük misyonlar: her gün 3 tane (tarihe göre seçilir). n: [kolay, orta, zor] (oyuncu seviyesine göre)
// Başarımlar: kademeli; her kademe elmas ve XP verir. İlerleme benzetim.basarimDeger'den, en iyi değer (rekor) saklanır
// ki prestij sıfırlaması kazanılmış ilerlemeyi geri almasın. buyuk: hedef sayısı kısa biçimle yazılır (1 mn).
export const BASARIMLAR = don([
  { kod: 'kazanc', ad: 'Servet', metin: 'Toplam {n} kazan', esik: [1e4, 1e6, 1e8, 1e10, 1e12], buyuk: true },
  { kod: 'seviye', ad: 'Tecrübe', metin: 'Seviye {n} ol', esik: [10, 25, 50, 75, 100] },
  { kod: 'kat', ad: 'Derinlere', metin: 'Bir bölgede {n} maden katı aç', esik: [5, 10, 15] },
  { kod: 'yukseltme', ad: 'Mühendis', metin: '{n} yükseltme yap', esik: [50, 250, 1000, 5000] },
  { kod: 'kademe', ad: 'Kademe Ustası', metin: '{n} kademe geç', esik: [10, 50, 200] },
  { kod: 'yonetici', ad: 'Ekip Lideri', metin: '{n} yönetici işe al', esik: [3, 10, 25] },
  { kod: 'yetenek', ad: 'Takım Ruhu', metin: '{n} yönetici yeteneği kullan', esik: [10, 50, 250] },
  { kod: 'satis', ad: 'Tüccar', metin: '{n} vagon cevher sat', esik: [500, 5000, 50000] },
  { kod: 'hazine', ad: 'Hazine Avcısı', metin: '{n} hazine damarı topla', esik: [5, 25, 100] },
  { kod: 'kontrat', ad: 'Sözünün Eri', metin: '{n} kontrat teslim et', esik: [3, 15, 50] },
  { kod: 'bolge', ad: 'Kâşif', metin: '{n} bölge aç', esik: [2, 3, 4] },
  { kod: 'dokunus', ad: 'Çalışkan Eller', metin: 'Madene {n} kez dokun', esik: [100, 1000, 10000] },
  { kod: 'prestij', ad: 'Efsane', metin: '{n} kez prestij yap', esik: [1, 3, 5] },
])
export const BASARIM_ODUL = don({ elmas: [5, 10, 20, 35, 50], xp: [20, 40, 80, 150, 250] })

// Hazine damarı: ara ara rastgele bir katta parlayan damar belirir; dokununca ödül verir, süresi dolunca söner.
// Altın damarı gelirin 'saniye' kadarını (en az 'taban') verir; elmas damarı elmasMin..elmasMaks elmas.
export const HAZINE = don({ ilk: 40, araMin: 70, araMaks: 140, omur: 24, saniye: 45, taban: 60, elmasOlasilik: 0.15, elmasMin: 2, elmasMaks: 5, xp: 6, minMaden: 2 })

export const MISYONLAR = don([
  { kod: 'dokun', metin: 'Madencilere {n} kez dokun', sayac: 'dokunus', n: [20, 40, 60] },
  { kod: 'yukselt', metin: '{n} yükseltme yap', sayac: 'yukseltme', n: [10, 25, 50] },
  { kod: 'yetenek', metin: '{n} yönetici yeteneği kullan', sayac: 'yetenek', n: [1, 2, 3] },
  { kod: 'satis', metin: '{n} vagon cevher sat', sayac: 'satis', n: [60, 200, 500] },
  { kod: 'kademe', metin: '{n} kademe geç', sayac: 'kademe', n: [1, 2, 4] },
  { kod: 'kontrat', metin: '{n} kontrat teslim et', sayac: 'kontrat', n: [1, 1, 2] },
  { kod: 'takviye', metin: "Kazanç x2'yi {n} kez başlat", sayac: 'takviye', n: [1, 1, 2] },
  { kod: 'hazine', metin: '{n} hazine damarı topla', sayac: 'hazine', n: [2, 4, 6] },
])
export const MISYON_ODUL = don({ elmas: [5, 8, 12], xp: [30, 50, 80], bonusElmas: 15 })

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
