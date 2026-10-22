# Cevher Madenci — Diğer Oyunlardan Araştırma ve Uyarlamalar

**Geliştirici:** İbrahim Can Göçmez

Bu belge, türün başarılı oyunlarını inceleyip Cevher Madenci'ye neyin katkı sağlayacağını seçtiğimiz çalışmanın
kaydıdır: hangi oyunda ne var, bizde zaten olanlar, eklediklerimiz (nasıl uyarlandı, hangi sayılarla, kodda
nerede), bilerek almadıklarımız ve oyun temposuna etkisi.

---

## 1. İncelenen oyunlar

| Oyun (geliştirici) | Öne çıkan sistemler |
|---|---|
| **Idle Miner Tycoon** (Kolibri Games) | Kat/asansör/depo zinciri, yöneticiler ve yetenekleri, süper yöneticiler, **bariyerler**: belirli katlardan sonra yeni kat açmadan önce süre, reklam ya da süper para ile kaldırılan kaya; maden başına prestij, kıtalar, etkinlik madenleri |
| **Egg, Inc.** (Auxbrain) | Çiftlik zinciri, **dronlar** (dokununca para ya da altın yumurta düşen rastgele ödül), **kumbara** (alışverişle altın yumurta biriken, gerçek parayla kırılan domuz), **eserler ve gemi seferleri** (süreli seferler kalıcı bonus veren eserler getirir), takviyeler, kontratlar, prestij (ruh yumurtaları) |
| **AdVenture Capitalist** (Hyper Hippo) | Yöneticiler, kilometre taşı (milestone) çarpanları, melek yatırımcılarla prestij, altınla zaman atlama |
| **Mr. Mine** (Playsaurus) | Derinlik ilerlemesi, **sandıklar**, **kalıntılar (relics)**: madenle hız, değer ve sandık ödülü gibi kalıcı güçler; bilim insanlarının **kazı seferleri**, mağaralara gönderilen dronlar |
| **Deep Town** (Rockbite) | Eritme → üretim → kimya zinciri, **keşif robotlarının gizli mağaralardan eser toplaması**, çevrimdışı üretim |
| Tıklama/boşta oyunları (genel) | Aktif oyunu ödüllendiren kısa süreli takviyeler ("frenzy"): dokunuşla dolan, süresi sınırlı hızlanma; prestijin "cezalandırma değil hızlanma" gibi hissettirmesi |

## 2. Bizde zaten olanlar (eşleştirme)

| Bizdeki sistem | Karşılığı |
|---|---|
| Maden → Asansör → Depo → Kamyon zinciri, darboğaz | Idle Miner Tycoon |
| Yöneticiler, nadirlik ve yetenekler | Idle Miner Tycoon |
| Kademe başına ×2 (10, 25, 50 …) | AdVenture Capitalist kilometre taşları |
| Yeni Nesil ve Miras Mührü | Egg Inc ruh yumurtaları, AdVenture Capitalist melekleri |
| Kontratlar | Egg Inc kontratları |
| Hazine damarı (rastgele parlayan ödül) | Egg Inc dronları |
| Araştırma ağacı | Egg Inc araştırmaları |
| Kazanç x2, ödüllü reklamlar, çevrimdışı kazanç, günlük hediye, haftalık etkinlik | Türün tamamı |

## 3. Eklediklerimiz

### 3.1 Sert kaya ve sondaj (Idle Miner Tycoon bariyerleri)

- **Onlarda:** belirli katlardan sonra yeni kat açılmadan önce bir bariyer kaldırılır. Bariyer süre ister, reklamla ya da
  özel parayla hızlanır.
- **Bizde:** 6., 11., 16., 21. ve 26. Katların önünde sert kaya durur. Sondaj bedeli o katın açılış bedelinin %25'idir.
  Süreler 2 dk, 10 dk, 30 dk, 1 sa, 2 sa. Sondaj oyun saatiyle işler, yani oyun kapalıyken de sürer.
- **Hızlandırma:** ödüllü reklam −15 dk (en çok 2 kez), elmasla bitirmek kalan her 5 dakika için 1 elmas.
- **Tecrübeli ekip:** bölgede daha önce delinmiş bir kaya Yeni Nesil'den sonra yalnız ¼ sürede delinir. Böylece
  prestij tekrarlarında bekleme cezaya dönüşmez.
- **Görsel:** kilitli kat şeridinde iri kaya blokları, uyarı bandı ve "SERT KAYA" tabelası. Sondaj sürerken sarı kule,
  titreyen motor, dönen burgu, toz ve kıvılcım. Kart geri sayar ve "Hızlandır" der.
- **Hikâye:** ilk sert kayada Ahmet sondajı anlatır (`kaya` sahnesi).
- **Katkısı:** maden derinleştikçe büyük bir ara hedef ("kayayı del"), oyuncuyu geri çağıran bir zamanlayıcı ve
  elmas ve reklam için doğal bir kullanım yeri.
- **Kod:** `KAYA` (`js/ayar.js`); `kayaVar`, `sondajMaliyet`, `sondajSuresi` (`js/ekonomi.js`); `sondajBaslat`,
  `sondajHizlandir`, `sondajKontrol` (`js/benzetim.js`); `js/arayuz/sondaj.js`; `kaya.ust` ve `sondajCiz`
  (`js/sahne/sahne.js`).

### 3.2 Vardiya Coşkusu (tıklama oyunlarındaki "frenzy")

- **Sorun:** madenler yöneticiye geçince dokunmanın bir anlamı kalmıyordu.
- **Bizde:** öğreticiden sonra madene her dokunuş göstergeyi %4 doldurur. Gösterge saniyede %2 boşalır; art arda
  dokunuşlar 0,12 sn'de bir sayılır.
- **Gösterge dolunca:** 15 sn boyunca kazı, asansör hızı ve kamyon hızı ×2 olur.
- **Yöneticili istasyona dokunmak:** artık yükseltme penceresini açmıyor, coşkuya sayılıyor. Yükseltme kart ve okla
  yapılır.
- **Görsel:** alt bandın üst kenarında ince gösterge, coşkuda altın renk ve geri sayım. Maden görünümünün kenarları
  ısınır, madenciler hızlanır.
- **Görev:** günlük misyon havuzuna "Vardiya Coşkusu'nu n kez başlat" eklendi.
- **Kapsam dışı:** çevrimdışı kazanç, kontrat hedefi ve ödül ölçüleri coşkudan etkilenmez.
- **Katkısı:** aktif oyunu ödüllendirir; dokunmak yine eğlenceli ve anlamlı olur.
- **Kod:** `COSKU`; `coskuCarpani` (`js/ekonomi.js`); `coskuEkle`, `coskuAdim` (`js/benzetim.js`);
  `js/arayuz/cosku.js`.

### 3.3 Keşif seferleri (Egg Inc gemileri, Mr. Mine bilim insanları, Deep Town keşif robotları)

- **Onlarda:** süreli seferler/kazılar kalıcı güç veren eserler ve değerli ödüller getirir.
- **Açılış:** jeolog Zeynep ekibe katılınca keşif ekibi kurulur (Zonguldak'ın 6. görevi). Zeynep ekibi `kesif`
  sahnesinde tanıtır.
- **Sefer türleri:** aynı anda bir sefer çıkar ve süre oyun kapalıyken de işler.

  | Sefer | Süre | Buluntu şansı | Elmas |
  |---|---|---|---|
  | Yakın Mağaralar | 30 dk | 1 × %60 | 1–3 |
  | Eski Galeriler | 2 sa | 2 × %75 | 3–6 |
  | Derin Keşif | 8 sa | 3 × %90 | 8–15 |

- **Buluntular:** seferin çıktığı bölgenin buluntularından seçilir. Eksik olanlar iki kat olasıdır. İlk sefer mutlaka
  bir buluntuyla döner. Bölgenin bütün buluntuları en üst seviyedeyse buluntu yerine +5 elmas gelir.
- **Hızlandırma:** reklam −15 dk (2 kez), elmasla bitirmek kalan her 5 dk için 1 elmas.
- **Bildirim:** ekip dönünce bildirim gelir ve Yöneticiler sekmesinde nokta çıkar.
- **Katkısı:** oyuna dönmek için ikinci bir saat (Egg Inc'in en güçlü dönüş nedenlerinden biri) ve uzun vadeli bir
  koleksiyon hedefi.
- **Kod:** `KESIF`, `KESIF_HIZ`; `kesifBaslat`, `kesifHizlandir`, `kesifTopla`, `kesifKontrol` (`js/benzetim.js`);
  `js/arayuz/kesif.js`.

### 3.4 Maden Müzesi (Mr. Mine kalıntıları, Egg Inc eserleri)

- **İçerik:** 12 bölge × 3 = 36 buluntu. Her biri bölgenin gerçek tarihinden, örneğin:
  - Zonguldak: 1829'da Uzun Mehmet'in bulduğu kömür;
  - Ereğli: Herakleia sikkesi;
  - Afyon: Dokimeion mermeri;
  - Bergama: Pergamon sikkesi ve parşömeni;
  - Beylikova: Kâzım Dede'nin defteri.
- **Görsel:** her buluntunun kodla çizilmiş kendi simgesi var. Bulunmayan buluntu karartılmış siluet olarak görünür.
- **Seviye:** aynı buluntu yeniden çıkarsa seviyesi artar, en çok 5.
- **Etkiler:** ortak etkileriyle aynı dört türde, seviye başına:

  | Etki | Seviye başına |
  |---|---|
  | Üretim | +%2 |
  | Taşıma | +%2,5 |
  | Gelir | +%1,5 |
  | Maliyet | −%1 (toplamda en çok %30) |

- **Bölge seti:** bir bölgenin üç buluntusu da müzedeyse o bölgenin satışı +%10.
- **Kaynaklar:** keşif seferleri ve altın hazine damarları (%8 olasılıkla bölgenin buluntusu da çıkar).
- **Kalıcılık:** buluntular prestijde kalır.
- **Başarım:** "Koleksiyoncu" eklendi (3, 12, 24, 36 farklı buluntu).
- **Katkısı:** prestijden bağımsız kalıcı ilerleme, bölgeleri yeniden ziyaret nedeni ve bölge hikâyesini derinleştiren
  içerik.
- **Kod:** `BULUNTU`, `BULUNTULAR` (`js/ayar.js`); `buluntuToplam`, `buluntuEtki`, `buluntuSeti` (`js/ekonomi.js`);
  buluntu çizimleri (`js/sahne/simge.js`); müze bölümü (`js/arayuz/kesif.js`).

### 3.5 Elmas Kumbarası (Egg Inc kumbarası)

- **Onlarda:** alışveriş yaptıkça altın yumurta biriken, gerçek parayla kırılan, her kırılışta bonusu artan kumbara.
- **Bizde, dolum (öğreticiden sonra):**

  | İş | Kumbaraya |
  |---|---|
  | Her yükseltme | +0,2 elmas |
  | Kat açma | +2 |
  | Kontrat | +5 |
  | Hazine | +1 |

- **Tavan:** 500 elmas; her kırılışta +250, en çok 2000.
- **Kırma:** her kırılış dolum hızını +%10 artırır (en çok +%100). Mağazada en az 50 elmas biriktiyse kırılabilir
  (`cevher_kumbara`, tüketilir ürün, tarayıcıda deneme olarak ücretsiz).
- **Katkısı:** gelir modeli için yüksek dönüşümlü, oyunu bozmayan bir teklif. Oyuncu kendi emeğiyle doldurduğu
  elmasları görür.
- **Kod:** `KUMBARA`; `kumbaraEkle`, `kumbaraKir`, `kumbaraTavan`, `kumbaraBonus` (`js/benzetim.js`); `js/magaza.js`;
  `js/arayuz/dukkan.js`.
- **Yayın notu:** Play Console'da `cevher_kumbara` kimliğiyle tüketilir bir ürün oluşturulmalı.

### 3.6 Araştırma sırasında bulunan hata

- **Hata:** kayıt, yöneticilerin `kalici` (prestijde kalır) bayrağını yazmıyordu. Elmasla tutulan Nadir yöneticiler oyun
  yeniden açılınca kalıcılığını kaybediyor ve prestijde gidiyordu.
- **Düzeltme:** bayrak artık kayda yazılıyor. Test: `test/sistemler.test.mjs`.

## 4. Bilerek almadıklarımız

| Sistem | Neden şimdilik yok |
|---|---|
| Üretim zinciri: eritme, işleme (Deep Town) | Tek cevherli zinciri ve darboğaz dengesini baştan değiştirir; arayüz yükü büyük |
| Süper yönetici ekipmanı (Idle Miner Tycoon) | Yönetici sistemi nadirlik, yetenek ve kalıcılıkla zaten derin |
| Etkinlik madenleri (Idle Miner Tycoon) | Ayrı bir ekonomi ve içerik akışı ister; haftalık etkinlikler bu ihtiyacı karşılıyor |
| Kart koleksiyonu ve gacha | Müze, şansa dayalı ama satın alınmayan bir koleksiyon olarak bu ihtiyacı karşılıyor |
| Ortak (co-op) kontratlar (Egg Inc) | Sunucu ve hesap sistemi gerektirir |
| Ayrı bir dron ödülü | Hazine damarı aynı işi madenin içinde görüyor |

## 5. Tempo etkisi

Ölçüm, ekonomiyi ayarlarken kullanılan otomatik oyuncuyla yapıldı.

- **Oynayış:** bot hiç uyumadan oynar ve 2 sn'de bir karar verir.
- **Sert kaya:** sondaj bedeli yetince deler.
- **Keşif:** hep 8 saatlik seferle çıkar ve dönünce toplar.
- **Coşku:** her istasyona 2 sn'de bir dokunur; bu tempo coşkuyu doldurmaz.

Gerçek bir oyuncunun bu süreleri yaklaşık 1,5–2,5 katında tamamlaması beklenir.

**Bölgelerin ilk açılışı (bot saati):**

| Bölge | Önceki sürüm | Yalnız sert kaya | Son ayar |
|---|---|---|---|
| Ereğli | 0,6 | 0,5 | 0,5 |
| Karabük | 5,7 | 6,3 | 6,3 |
| Kastamonu | 23 | 25 | 30 |
| Balya | 37 | 39 | 41 |
| Afyon | 67 | 61 | 52 |
| Keçiborlu | 110 | 101 | 84 |
| Bergama | 155 | 148 | 132 |
| Gümüşhane | 209 | 201 | 174 |
| Elazığ | 270 | 260 | 210 |
| Kırka | 345 | 330 | 250 |
| Beylikova | 443 | 420 | 297 |

**Buluntu ayarları:** hangi etki değerleriyle son bölgeye kaç saatte varıldığı.

| Buluntu etkisi (seviye başına üretim / taşıma / gelir / maliyet, set) | Keşif elması | Beylikova |
|---|---|---|
| %4 / %5 / %3 / %1,5, set %25 (ilk taslak) | 2–5 / 6–12 / 15–30 | 228 sa |
| %2 / %2,5 / %1,5 / %1, set %10 | 2–5 / 6–12 / 15–30 | 285 sa |
| %1 / %1,25 / %0,8 / %0,5, set %5 | 2–5 / 6–12 / 15–30 | 334 sa |
| %1 / %1,25 / %0,8 / %0,5, set %5 | 1–3 / 3–6 / 8–15 | 325 sa |
| **%2 / %2,5 / %1,5 / %1, set %10 (seçilen)** | **1–3 / 3–6 / 8–15** | **297 sa** |

**Sonuçlar:**

- **Sert kaya:** temposu neredeyse hiç değiştirmez. Bot sondaja açılış parasını biriktirirken başladığı için bekleme
  birikim süresiyle örtüşür. Kaya, oyuncuya bir hedef ve geri dönüş nedeni olarak çalışır.
- **Buluntular:** hızlanmanın asıl nedeni bunlar. Keşif oyun kapalıyken de sürdüğü için koleksiyon oyun saatine göre
  erken dolar; ilk taslaktaki güçlü etkiler oyunu yarıya indiriyordu.
- **Keşif elması:** yarıya indirildi. Elmas ekonomisini (araştırma, ortaklar) şişirmesin diye; tempoya etkisi küçük.
- **Seçilen ayar:** buluntuların her seviyesi hissedilir kalıyor. Bot son bölgeye 297 saatte varıyor; bu, gerçek
  oyuncu için yaklaşık 450–750 saat demek ve 200–1000 saat hedefinin içinde.

## 6. Kaynaklar

- Idle Miner Tycoon topluluk vikisi: https://idleminertycoon.fandom.com/wiki/File:Ancient_Boost.PNG
- Idle Miner Tycoon rehberi (appgamer): https://www.appgamer.com/idle-miner-tycoon/strategy-guide/idle-miner-hints-and-tips
- Idle Miner Tycoon süper yöneticiler (appgamer): https://www.appgamer.com/idle-miner-tycoon/strategy-guide/which-super-manager-is-the-best
- Idle Miner Tycoon, App Store: https://apps.apple.com/app/id1116645064
- Egg, Inc. türün altın standardı (PocketGamer.biz): https://www.pocketgamer.biz/egg-inc-idle-games-gold-standard/
- Egg, Inc. kumbara (topluluk vikisi): https://egg-inc.fandom.com/wiki/Piggy_Bank
- Egg, Inc. ipuçları (Android Central): https://www.androidcentral.com/tips-and-tricks-egg-inc
- AdVenture Capitalist (Vikipedi): https://en.wikipedia.org/wiki/AdVenture_Capitalist
- Mr. Mine kalıntılar, sandıklar ve bilim insanları: https://blog.mrmine.com/?p=74, https://blog.mrmine.com/?p=107, https://blog.mrmine.com/?p=2688
- Deep Town, App Store: https://apps.apple.com/app/id1202240058
- Boşta oyunlarda aktif oyun: https://jwittsf.design.blog/2020/03/29/idle-games-dont-have-to-be-so-idle
- Boşta oyun tutundurma ölçüleri (GameAnalytics): https://www.gameanalytics.com/blog/how-to-make-an-idle-game-adjust
