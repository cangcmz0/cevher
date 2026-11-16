# Phase 1 — Fener ve Çini Arayüzü

**Geliştirici:** İbrahim Can Göçmez

Bu faz, `docs/design/` altında kilitlenen "Fener ve Çini" tasarım sistemini oyunun arayüzüne (DOM katmanı) uygular.
Önce tokenlar `css/temel.css`'e taşınır, sonra Faz 1 ekranları (maden ana ekranı, yükseltme paneli, çevrimdışı ve
yönetici pencereleri), ardından Faz 2 sekmeleri (harita, yöneticiler, mağaza, araştırma) ekran spec'lerine getirilir.
Son sprint telefon genişliklerinde ekran görüntüsü ve kontrast denetimidir. Oyun mekaniği, kayıt biçimi ve canvas
sahne sanatı değişmez; yalnız görünüm ve arayüz metni değişir.

---

# Sprint 1.1 — Tokenlar ve temel stiller

### Goal

`css/temel.css` değişkenlerini DESIGN.md tokenlarına getirip düğme, kart, çubuk ve gezintinin temel stillerini tasarım sistemiyle eşlemek.

### Tasks

| Status | # | Task | Module | Reference |
|--------|---|------|--------|-----------|
| — | 1 | `--yukselt-koyu` #CC5F27 → #B9501C, `--uyari` #E25A43 → #FF7A63, `--acik-soluk` → #B7CEDB; yeni `--cini` (#3FBDB6) değişkenini ekle | css/temel.css | docs/design/design-system.md |
| — | 2 | Ana düğmeyi `accent-light → accent` degradesine, `--golge-buton` alt kenarını DESIGN.md gölgesine çek; düğme yüksekliği 48 (elmas 44) | css/temel.css | docs/design/DESIGN.md |
| — | 3 | Yazı ölçeğini token tablosuna eşle (hero, title, card-title, button 16, value, body, meta, label); 11 px altı yazıları kaldır | css/temel.css, css/oyun.css | docs/design/design-system.md |
| — | 4 | `--uyari` ve `--yukselt-koyu` kullanan 12 yerde kontrastı yeniden kontrol et; krem üzerinde artış metnini `--basari-kenar` (#13703A) yap | css/*.css | docs/design/DESIGN.md |
| — | 5 | Alt gezinti: seçili sekmeye 3 px `accent-light` üst çizgi, sekme dokunma alanı en az 44 px | css/oyun.css, js/arayuz/arayuz.js | docs/design/screens/maden-ana.md |

### Acceptance Criteria

- `css/temel.css` içindeki renk değerleri design-system.md'deki karşılık tablosuyla birebir aynı.
- Ana düğmede beyaz yazı ile zemin arasında en az 4.5:1 kontrast.
- Oyunda 11 px'ten küçük yazı kalmıyor.
- `npm test` geçiyor; kayıt biçimine dokunulmadı.

### Dependencies

- None

### Verification

- cli: npm test
- ui: index.html
- viewports: 360, 390, 480
- assert: Yükselt düğmesi koyu turuncu degrade ve beyaz yazıyla görünüyor
- assert: Seçili alt sekmede üstte turuncu çizgi var
- assert: Uyarı bildirimindeki kırmızı koyu zeminde okunuyor

---

# Sprint 1.2 — Maden ana ekranı

### Goal

Üst bilgi çubuğu, istatistik şeridi, kat kartları ve alt şeridi maden-ana ekran spec'ine getirmek.

### Tasks

| Status | # | Task | Module | Reference |
|--------|---|------|--------|-----------|
| — | 1 | Üst bilgi çubuğu: bölge adı + cevher alt satırı, para ve elmas hapları `value` stilinde, ayar düğmesi 44 px | js/arayuz/ust.js, css/oyun.css | docs/design/screens/maden-ana.md |
| — | 2 | İstatistik şeridi: üç sütun pano; darboğaz istasyonunun etiketi `Asansör ▲ darboğaz` / `Depo ▲ darboğaz` ve `--uyari` rengi | js/arayuz/ust.js, css/oyun.css | docs/design/screens/maden-ana.md |
| — | 3 | Kat kartı: başlık, `Seviye`, altın hız satırı, kademe çubuğu; yükseltme düğmesinin dokunma alanı en az 44 px | js/arayuz/kartlar.js, css/oyun.css | docs/design/screens/maden-ana.md |
| — | 4 | Kilitli kat kartı: kesik çerçeve ve `Kaz · {bedel}` ana düğmesi | js/arayuz/kartlar.js | docs/design/screens/maden-ana.md |
| — | 5 | Alt şerit: altın kenarlı pano, görev etiketi + çubuk, `Kazanç x2` yeşil düğme ve ▶ simgesi | js/arayuz/alt.js, css/oyun.css | docs/design/screens/maden-ana.md |
| — | 6 | Para yetmeyen kat kartında yükseltme düğmesini `--pasif` zemine al | js/arayuz/kartlar.js | docs/design/screens/maden-ana.md |

### Acceptance Criteria

- Maden ana ekranı spec'indeki acceptance maddelerinin hepsi sağlanıyor.
- Darboğaz olduğunda istatistik şeridinde ilgili sütun `--uyari` ile işaretli.
- 360, 390 ve 480 px'te yatay kaydırma ve metin taşması yok.
- Öğretici adımları (ilk kat yükseltme, ilk satış) eskisi gibi çalışıyor.

### Dependencies

- Sprint 1.1

### Verification

- cli: npm test
- ui: index.html
- viewports: 360, 390, 480
- assert: Kat kartındaki yükseltme düğmesine 44 px alanda dokunulabiliyor
- assert: Asansör darboğaz olduğunda istatistik şeridi kırmızı etiket gösteriyor
- assert: Alt şerit gezintinin 8 px üstünde yüzüyor ve çakışmıyor

---

# Sprint 1.3 — Paneller ve pencereler

### Goal

Yükseltme paneli, çevrimdışı kazanç ve yönetici penceresini ekran spec'lerine getirmek.

### Tasks

| Status | # | Task | Module | Reference |
|--------|---|------|--------|-----------|
| — | 1 | Yükseltme paneli: başlık + `Seviye A → B`, x1/x10/x50/Maks segmenti, şimdi → sonra satırları, kademe şeridi, tam genişlik ana düğme ve "basılı tut" ipucu | js/arayuz/pencereler.js, css/pencereler.css | docs/design/screens/yukseltme.md |
| — | 2 | Yükseltme paneli durumları: `Yetersiz para · {bedel}` ve `MAKS SEVİYE` | js/arayuz/pencereler.js | docs/design/screens/yukseltme.md |
| — | 3 | Çevrimdışı pencere: altın ışınlar, `hero` tutar, süre satırı, yönetici satırı, `Topla` ikincil + `Topla x2` yeşil ▶; reklam hatasında pencere açık kalır | js/arayuz/pencereler.js, css/pencereler.css | docs/design/screens/cevrimdisi.md |
| — | 4 | Yönetici penceresi: mevcut yönetici bloğu (nadirlik halkası + rozetler), yetenek ve görevden alma düğmeleri, boştakiler listesi, tutma düğmeleri | js/arayuz/pencereler.js, css/pencereler.css | docs/design/screens/yonetici.md |
| — | 5 | Pencerelerde tek ana eylem kuralı: `Ata` ve benzeri düğmeleri ikincil stile çek | js/arayuz/pencereler.js | docs/design/DESIGN.md |

### Acceptance Criteria

- Üç ekranın spec'indeki acceptance maddelerinin hepsi sağlanıyor.
- Her pencerede en fazla bir turuncu ana düğme var.
- Kapat düğmeleri 44 px ve `aria-label` taşıyor.
- `npm test` geçiyor.

### Dependencies

- Sprint 1.1

### Verification

- cli: npm test
- ui: index.html
- viewports: 360, 390, 480
- assert: Bir kata dokununca yükseltme paneli açılıyor, x10 seçilince değerler değişiyor
- assert: Çevrimdışı pencerede perdeye dokunmak pencereyi kapatmıyor
- assert: Yönetici penceresinde nadirlik hem renkle hem yazıyla görünüyor

---

# Sprint 1.4 — Sekme sayfaları

### Goal

Harita, Yöneticiler, Mağaza ve Araştırma sekmelerini Faz 2 ekran spec'lerine getirmek.

### Tasks

| Status | # | Task | Module | Reference |
|--------|---|------|--------|-----------|
| — | 1 | Harita: bölge kartının dört durumu (açık `--cini` ✓, Buradasın halka, açılabilir altın + `Aç`, kilitli gri + koşul), harita okları 44 px, seçili bölge alt kartı | js/arayuz/harita.js, css/sayfalar.css | docs/design/screens/harita.md |
| — | 2 | Yöneticiler: Katlar/Asansör/Depo segmenti, krem yönetici kartları (nadirlik noktası + yazı), yapışkan alt tutma çubuğu | js/arayuz/genisletme.js, css/sayfalar.css | docs/design/screens/yoneticiler.md |
| — | 3 | Mağaza: günlük hediye 7 kutu (bugün altın kenar), teklif panosu + %50 rozeti, bedava elmas kartı (▶ + kalan hak), elmas paketleri; ücretsiz eylemde bedel yazma | js/arayuz/dukkan.js, css/sayfalar.css | docs/design/screens/magaza.md |
| — | 4 | Araştırma: süren araştırma panosu (▶ −15 dk, `Bitir · {elmas}`), dal başlıkları, düğüm satırları (56 px daire, seviye pip'leri, MAKS/Sürüyor/Kilitli durumları) | js/arayuz/arastirma.js, css/sayfalar.css | docs/design/screens/arastirma.md |
| — | 5 | Sayfa başlıklarını üst bilgi çubuğuna taşı (sayfa adı + alt satır), sayfa gövdesi kenar boşluğu 12 px | js/arayuz/sayfalar.js, css/sayfalar.css | docs/design/design-system.md |

### Acceptance Criteria

- Dört sekmenin spec'indeki acceptance maddelerinin hepsi sağlanıyor.
- Bölge durumları renk dışında simge ya da metinle de ayırt ediliyor.
- Her sayfada en fazla bir turuncu ana düğme var.
- Satın alma ve reklam akışının davranışı değişmedi; yalnız görünüm değişti.

### Dependencies

- Sprint 1.1

### Verification

- cli: npm test
- ui: index.html
- viewports: 360, 390, 480
- assert: Harita sekmesinde dört bölge kartı birbirine binmeden görünüyor
- assert: Yöneticiler listesi kayarken alt tutma çubuğu sabit kalıyor
- assert: Mağazada reklam düğmesinde ▶ ve kalan hak yazıyor
- assert: Araştırmada kilitli düğüm koşulunu metinle gösteriyor

---

# Sprint 1.5 — Ekran denetimi ve teslim

### Goal

Yeni arayüzü üç telefon genişliğinde ekran görüntüsü, kontrast ve performansla denetleyip telefonda sahibine onaylatmak.

### Tasks

| Status | # | Task | Module | Reference |
|--------|---|------|--------|-----------|
| — | 1 | `test/oyna.mjs` senaryolarını çalıştır; telefon ve dar profillerde ekran görüntülerini güncelle | test/oyna.mjs | docs/TASARIM.md |
| — | 2 | Metin/zemin çiftleri için kontrast denetimi (en az 4.5:1) ve 44 px dokunma alanı denetimi | test/ | docs/design/DESIGN.md |
| — | 3 | Performans bütçesini yeniden ölç (`test/ekran/performans.json`), gerileme varsa düzelt | test/oyna.mjs | docs/TASARIM.md |
| — | 4 | Web sürümünü (`npm run tekdosya`) ve Android paketini (`npm run paketle`) yeniden üret | araclar/ |
| MANUAL | 5 | APK'yı telefona kurup yeni arayüzü onayla (renkler, okunurluk, tek elle kullanım) |

### Acceptance Criteria

- `test/oyna.mjs` hatasız bitiyor; ekran görüntülerinde taşma ya da üst üste binme yok.
- Kontrast ve dokunma alanı denetimlerinde hata yok.
- Performans bütçesi aşılmıyor.
- Sahibi telefonda onay verdi.

### Dependencies

- Sprint 1.2, Sprint 1.3, Sprint 1.4

### Verification

- cli: npm test && NODE_PATH=$(npm root -g) node test/oyna.mjs
- ui: index.html
- viewports: 360, 390, 480
- assert: Bütün sekmeler ve pencereler üç genişlikte taşmasız
- assert: Performans tablosunda kare süresi bütçenin altında

---

## Risk Mitigations

- **Mevcut referans dokuları:** Oyun §10.1'e göre bazı yüzeylerde referanstan kesilmiş dokular (`img/ref/*.png`) kullanıyor. Yeni tokenlar bu dokularla çakışırsa doku korunur, yalnız metin ve düğme renkleri değişir.
- **Yöneticiler sekmesi:** Şu anki sekme "Maden Genişletme" referans ekranını izliyor (`genisletme.js`). Spec'teki liste düzeni o ekranın yerine değil, onun yönetici listesine uygulanır; genişletme işlevi kaybolmaz.
- **Öğretici:** Öğretici, düğmeleri seçicilerle buluyor. Sınıf adları değişirse `js/arayuz/ogretici.js` aynı sprintte güncellenir.

## Scope Guard

- Canvas sahne sanatı (katlar, yüzey, karakterler) bu fazda değişmez; o iş `docs/GORSEL_PROMPTLARI.md` ile ayrı yürür.
- Oyun mekaniği, denge sayıları ve kayıt biçimi değişmez.
- Faz 3 ekranları (kutlama, hikâye, sondaj, keşif, müze, kumbara, ayarlar, açılış) bu fazda yok.
