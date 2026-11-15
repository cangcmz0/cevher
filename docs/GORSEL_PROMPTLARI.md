# Cevher Madenci — Görsel Prompt Seti

**Geliştirici:** İbrahim Can Göçmez

Oyundaki bütün görselleri yapay zekâ görsel araçlarıyla (Midjourney, GPT Image, Leonardo, Flux / Stable
Diffusion vb.) yeniden üretmek için hazırlanmış prompt seti. Her görselin ölçüsü, arka planı, dosya adı ve oyunda
nereye bağlanacağı yazılıdır.

---

## 0. Nasıl kullanılır

1. **Promptlar İngilizcedir.** Görsel araçları İngilizceyi çok daha iyi anlar. Her promptun üstünde Türkçe açıklama
   var.
2. **Önce stil çapası.** Bütün görseller aynı elden çıkmış gibi görünmeli. Bu yüzden:
   - önce **§1'deki ortak stili** ve **§4.1 kat şeridini** üret;
   - beğendiğin sonucu stil referansı yap: Midjourney'de `--sref <görsel>`, diğer araçlarda "image/style reference";
   - mümkünse aynı tohumu (seed) kullan;
   - geri kalan her şeyi bu referansla üret.
3. **Her promptun sonuna §1'deki `ORTAK STİL` bloğunu ekle.** Araç destekliyorsa `NEGATİF` bloğunu da negatif prompta
   yaz (Midjourney'de `--no ...`).
4. **Büyük üret, küçült.** Ölçüler oyundaki boyutun yaklaşık 4 katıdır; yüksek yoğunluklu telefonlarda net görünür.
   Oyun gerekirse küçültür.
5. **Şeffaf arka plan.** "Şeffaf" yazan görseller PNG ve alfa kanallı olmalı.
   - GPT Image, Recraft ve Leonardo doğrudan şeffaf üretebilir.
   - Üretemeyen araçta düz **#00FF00 yeşil** zeminde üret, sonra arka planı sil (remove.bg, Photoshop "Select Subject").
   - Zemine gölge düşürme: gölgeyi oyun çiziyor.
6. **Yazı yok.** Görsellerde harf ve yazı olmasın. Tabelalar boş kalsın (`SATIŞ`, `DEPO`, `SERT KAYA`, bölge adı); oyun
   yazıları kendisi basıyor. Yapay zekâ Türkçe harfleri bozuyor.
7. **Yön.** Bütün sahne yandan görünüş (2D, düz kamera, perspektifsiz). Karakterler **sağa**, kamyon **sola** bakar.
8. **Teslim.** Dosyaları `img/yeni/` altına aşağıdaki adlarla koy.
   - Kodla bağlanma: madenci, kamyon ve maden arabası kare setleri `js/sahne/atlaslar.js` manifestine; tekil
     sprite'lar `Varliklar.png(...)` ile.
   - Kat ve yüzey şeritleri, haritalar ve simgeler için küçük bir yükleme kancası eklenecek.
   - Görseller gelince bağlantı işini ben yaparım.

### Kare setlerinde (animasyon) tutarlılık

Yapay zekâ aynı karakteri 8 karede birebir aynı çizmekte zorlanır. Önerilen yol:

1. **§2.1'deki karakter kartını** üret: aynı karakterin önden, yandan ve arkadan görünüşü.
2. Her kareyi **ayrı ayrı** o kartı referans vererek üret:
   - Midjourney `--cref` / `--oref`;
   - Leonardo "Character Reference";
   - GPT Image'de referans görselle düzenleme.
3. Kareleri aynı ölçeğe ve aynı ayak çizgisine hizalayıp ızgaraya diz. Bunun için hizalama betiği yazabilirim; kareleri
   ayrı PNG olarak vermen yeter.
4. **Alternatif:** tek bir duruş üret, animasyonu oyun yapsın. Karakteri gövde, kol, bacak, baş ve kazma olarak ayrı
   parçalarla üret; oyundaki iskelet hareket ettirir.

---

## 1. Ortak stil

**ORTAK STİL (her promptun sonuna):**

```
2D mobile idle tycoon game art, hand-painted cartoon style with friendly rounded shapes, clean bold dark-brown
outlines, soft cel shading with gentle gradients, warm rim light, rich saturated but harmonious colors, chunky
readable shapes that stay clear at small sizes, strict side view (orthographic, no perspective), light from the
top-left, cozy and cheerful mood, polished commercial mobile game quality, no text, no letters, no logo, no watermark
```

**NEGATİF:**

```
photorealistic, 3D render, CGI, blurry, noisy, grainy, text, letters, numbers, watermark, signature, logo, frame,
border, isometric, top-down, perspective distortion, fisheye, extra limbs, extra fingers, cropped, cut off, low
contrast, muddy colors, dark and gloomy horror mood
```

**Renk dili:**

| Kullanım | Renk |
|---|---|
| Arayüz lacivert | `#062B42`, `#0B3A55`, `#124A68` |
| Altın vurgu | `#F6C453`, `#FFE08A`, `#D99A2B` |
| Yükseltme yeşili | `#3FD07E` |
| Tünel ışığı (sıcak fener) | `#FFC878`, `#F6A623` |
| Ahşap | `#8A5A32`, `#6B4425` |
| Çelik | `#8C98A4`, `#4E5862` |
| Kontur | `#160E08` |

**Bölgelerin cevher renkleri** (§6'daki promptlarda `{CEVHER}` yerine yazılır): kömür `#2B2B33`/`#6E7480`, demir
`#7A3E2A`/`#C0714E`, taş `#8C877C`/`#D2CCBE`, bakır `#A8552A`/`#E9935A`, kurşun `#4A5560`/`#9AAAB8`, mermer
`#CFC8BC`/`#FFFFFF`, kükürt `#C9A21B`/`#FFE45A`, altın `#B8860B`/`#FFD84A`, gümüş `#8A949E`/`#E8EEF4`, krom
`#3E4A44`/`#8FB0A0`, bor `#CFC4D8`/`#F6EEFC`, neodim `#5A3A7A`/`#C49AF0`.

---

## 2. Karakterler

### 2.1 Madenci karakter kartları (4 görünüş)

Oyunda dört madenci görünüşü var; katlarda dönüşümlü kullanılır. Önce bunların karakter kartını üret (referans
olarak).

- **Ölçü:** 2048×1024. **Arka plan:** düz açık gri.
- **Dosya:** `img/yeni/madenci-kart-0.png` … `madenci-kart-3.png`.

| Görünüş | Tarif |
|---|---|
| 0 | açık tenli, kahverengi bıyıklı, sarı baret, mavi tulum |
| 1 | buğday tenli genç kadın madenci, örgülü saç, sarı baret |
| 2 | açık tenli, koyu kalın bıyıklı, turuncu baret |
| 3 | esmer, bıyıklı ustabaşı, kırmızı kep (baret değil) |

```
Character design sheet of a cheerful cartoon coal miner for a mobile idle game, full body shown three times: front
view, side view facing right, back view, same scale, standing on one baseline. Chibi-ish proportions about 3.5 heads
tall, big friendly eyes, rounded hands. {GÖRÜNÜŞ}. Royal-blue work overalls with brass buttons and a darker blue
shirt underneath, brown leather tool belt, sturdy brown boots, small brass headlamp on the helmet, faint coal dust
on cheeks. Plain light gray background.
```

`{GÖRÜNÜŞ}` yerine:

- 0: `light skin, brown mustache, bright yellow hard hat (#F2B632)`
- 1: `young woman with warm tan skin, dark braid under a bright yellow hard hat (#F2B632), no mustache`
- 2: `fair skin, thick dark mustache, orange hard hat (#F08A3C)`
- 3: `dark tan skin, bushy black mustache, red flat cap (#C4553B) instead of a helmet, foreman look`

### 2.2 Madenci animasyon kareleri

- **Izgara:** her kare **128×124 px** (üretirken 512×496, sonra küçült).
- **Karakter:** sağa bakar, boyu karenin ~%75'i. **Ayak noktası:** karenin (60, 116) pikseli; bütün karelerde aynı
  yerde.
- **Arka plan:** şeffaf.
- **Dosya:** `img/yeni/madenci-{0..3}.png`, satır satır:

| Satır | Klip | Kare | Hareket |
|---|---|---|---|
| 0 | yuru | 8 | yürüyüş döngüsü: temas, iniş, geçiş, yükseliş × 2 |
| 1 | tasi | 8 | omzunda cevher çuvalıyla yürüme |
| 2 | it | 8 | öne eğilmiş, eller bel hizasında ileri, maden arabası itiyor (araba çizme) |
| 3 | kaz | 8 | kazmayla duvara vuruş: 0–3 kalkış, **4 vuruş anı**, 5–7 geri çekiş |
| 4 | bekle | 6 | nefes alıp verme, hafif sallanma, alnını silme |
| 5 | dinlen | 4 | sandığa oturmuş, başı öne düşük, uyukluyor (zzz'yi oyun çizer) |
| 6 | sevin | 6 | kollar havada sevinç, küçük zıplama |
| 7 | egil | 4 | yerden çuval almak için eğilme (tek seferlik) |
| 8 | bosalt | 4 | çuvalı öne doğru boşaltma (tek seferlik) |

Kare promptu (her kare için ayrı üret, karakter kartını referans ver):

```
Single animation frame of the same cartoon miner from the reference sheet, side view facing right, full body, feet
on a fixed baseline, transparent background. Pose: {POZ}. Clean silhouette, consistent proportions and colors with
the reference, no background props, no shadow.
```

`{POZ}` örnekleri:

- yuru kare 0: `walk cycle contact pose, right foot forward heel down, left arm forward`
- tasi kare 2: `walking while carrying a bulging burlap ore sack on his right shoulder, passing pose`
- kaz kare 4: `pickaxe swing impact moment, arms extended forward, pickaxe head hitting a rock wall just outside the frame on the right, body leaning in`
- dinlen kare 0: `sitting on a small wooden crate, elbows on knees, head nodding, eyes closed`
- sevin kare 3: `jumping with both arms raised, big open smile`

Kare setleri hazır olunca `js/sahne/atlaslar.js` manifestine şu satır yazılır:

```js
{ tur: 'madenci', resim: [... 4 dosya ...], hucre: [128, 124], ayak: [60, 116], birim: 0.5, yon: 1,
  satirlar: { yuru: 0, tasi: 1, it: 2, kaz: 3, bekle: 4, dinlen: 5, sevin: 6, egil: 7, bosalt: 8 } }
```

### 2.3 Yönetici portreleri (ustabaşılar)

Şu an yönetici yüzleri tohumdan kodla üretiliyor. Görselle değiştirmek için nadirlik başına 8 portre öner; toplam 24.
Oyun rastgele seçer.

- **Ölçü:** 512×512, göğüs çekimi, yüz ortada (yuvarlak kesilecek). **Arka plan:** şeffaf.
- **Dosya:** `img/yeni/yonetici-{sradan|nadir|efsane}-{1..8}.png`.

```
Cartoon bust portrait of a Turkish mine foreman for a mobile idle game, friendly confident expression, looking
slightly to the left, {KİŞİ}, wearing {BARET}, work jacket with a small collar, centered head and shoulders that fit
inside a circle, transparent background.
```

- **`{KİŞİ}` örnekleri:** `middle-aged man with gray mustache`, `young woman with short dark hair and freckles`,
  `older man with round glasses and a tie under the jacket`, `woman in her forties with a ponytail`.
- **`{BARET}`:**
  - Sıradan: `a plain light gray hard hat`
  - Nadir: `a glossy blue hard hat with a silver stripe (#4A90E2)`
  - Efsanevi: `a shiny golden hard hat with a small gem emblem and a soft golden glow (#F6C453)`

### 2.4 Hikâye karakterlerinin portreleri

- **Ölçü:** 1024×864 (oran 1,19:1, şu anki `yuz-*.png` ile aynı). Göğüs çekimi, sıcak madenci ışığı. **Arka plan:**
  şeffaf.
- **Kullanıldığı yerler:** hikâye penceresi, Yöneticiler sayfasındaki ortak kartları, Araştırma sayfası.

| Dosya | Kişi | Prompt eki |
|---|---|---|
| `img/yeni/avatar.png` (kare 512×512) | Sen, ocak sahibi | `young Turkish mine owner in their late twenties, determined warm smile, yellow hard hat pushed back, denim work shirt, a little coal dust` |
| `img/yeni/yuz-ahmet.png` | Ahmet Yılmaz, maden mühendisi | `Turkish mining engineer in his thirties, short beard, white hard hat, reflective orange vest, rolled blueprints under arm` |
| `img/yeni/yuz-elif.png` | Elif Çelik, lojistik uzmanı | `Turkish woman logistics expert in her thirties, hair in a bun, hi-vis yellow vest over a navy shirt, holding a tablet` |
| `img/yeni/yuz-mehmet.png` | Mehmet Kara, finans uzmanı | `Turkish finance expert in his forties, neat mustache, rectangular glasses, brown waistcoat over a white shirt, pen behind the ear` |
| `img/yeni/yuz-zeynep.png` | Zeynep Arslan, jeolog | `young Turkish woman geologist, curly hair tied back, field vest full of pockets, rock hammer, magnifying loupe on a cord` |
| `img/yeni/yuz-selim.png` | Selim Demirhan, rakip holding | `Turkish business tycoon in his fifties, slicked silver hair, dark tailored suit, smug half-smile, golden cufflinks` |
| `img/yeni/yuz-derya.png` | Derya Aksoy, çevre mühendisi | `Turkish woman environmental engineer in her thirties, green field jacket, leaf pin, water-sample vial in hand` |
| `img/yeni/yuz-tolga.png` | Tolga Sarp, Sarp Maden A.Ş. | `rugged Turkish mine owner in his forties, stubble, worn leather jacket, scar on eyebrow, proud stance` |
| `img/yeni/mektup.png` (1024×1280) | Kâzım Dede'nin mektubu | `old folded letter paper with soft sepia tones, a small faded photo of an elderly miner with a white mustache pinned to the corner, coal fingerprint smudges, no readable text` |

Ortak prompt:

```
Cartoon bust portrait for a mobile idle game story dialogue, {EK}, expressive friendly face, soft warm lantern light
from the left, clean outlines, transparent background.
```

---

## 3. Araçlar ve makineler

### 3.1 Kamyon (yüzeyde satışa giden)

- **Izgara:** her kare **256×128 px** (üret: 1024×512). Kamyon **sola** bakar.
- **Ayak noktası:** (12, 120), yani ön tampon altı ile tekerlek tabanı.
- **Satırlar:**
  - 0: boş kasa;
  - 1: dolu kasa.
- **Kareler:** her satırda 4 kare, tekerlek dönüşü (jantlar 0°, 22,5°, 45°, 67,5°).
- **Arka plan:** şeffaf. **Dosya:** `img/yeni/kamyon.png` (1024×256).

```
Side view of a small chunky cartoon mining dump truck facing left, short rounded cab in signal orange (#E8742E) with
a big side window and a tiny exhaust pipe, steel-gray dump bed with rivets and a yellow-black hazard stripe, three
chunky black tires with gray rims (one front, two rear), {YÜK}, transparent background, no ground, no shadow.
```

- **`{YÜK}`:**
  - boş: `empty dump bed`;
  - dolu: `dump bed heaped with dark ore chunks`.
- **Tekerlek kareleri:** aynı kamyonu 4 kez, yalnız jant kollarını 22,5° döndürerek üret. Ya da tekerleği ayrı
  (§3.2) üret, oyun döndürsün.
- **Bölge rengi:** yük yığınını ayrıca, **yalnız yığın olarak** şeffaf üret (`img/yeni/kamyon-yuk.png`). Oyun onu bölgenin
  cevher rengine boyar.

### 3.2 Tekerlek ve makara

- **Kamyon tekerleği** (`img/yeni/teker.png`, 256×256, şeffaf):
  ```
  Single chunky cartoon truck tire with gray steel rim and five spokes, straight side view, transparent background.
  ```
- **Kuyu makarası** (`img/yeni/makara.png`, 512×512, şeffaf; oyun döndürür):
  ```
  Large steel mine headframe sheave wheel, spoked, riveted rim with a groove for the cable, dark steel with
  highlights, straight side view, transparent background.
  ```

### 3.3 Maden arabası

- **Ölçü:** 512×416 (oyunda yaklaşık 30×24 birim). **Arka plan:** şeffaf.
- **Dosya:** `img/yeni/araba-bos.png`, `araba-dolu.png`.

```
Cartoon mine cart on small iron wheels, side view, riveted steel body with wooden plank sides and a dented rim,
{YÜK}, transparent background, no rails, no shadow.
```

`{YÜK}`: `empty` / `heaped with ore chunks`.

### 3.4 Asansör kabini

- **Ölçü:** 400×664 (oran 3:5). **Arka plan:** şeffaf. **Dosya:** `img/yeni/kabin.png`.

```
Front-facing cartoon mine elevator cage hanging from a cable, steel frame with diagonal mesh walls, yellow-black
hazard stripe along the floor plate, small warm lamp inside at the top, open interior space for a standing worker,
riveted corners, transparent background.
```

### 3.5 Sondaj makinesi (sert kaya)

İki parça, şeffaf:

- **Kule:** `img/yeni/sondaj-kule.png`, 512×640.
  ```
  Small cartoon yellow mining drill rig, A-frame tower made of yellow steel beams with a boxy yellow motor on top,
  black vents, small orange warning beacon, side view, transparent background.
  ```
- **Burgu:** `img/yeni/sondaj-burgu.png`, 96×512.
  ```
  Vertical steel drill auger with a spiral flute and a sharp pointed tip, side view, transparent background.
  ```

### 3.6 Gemi ve kayık (harita ve liman)

- **Gemi:** `img/yeni/gemi.png`, 768×512, şeffaf.
  ```
  Cartoon cargo ship side view, red hull, white bridge at the stern, one chimney with a puff of smoke, deck loaded
  with ore crates, transparent background.
  ```
- **Kayık:** `img/yeni/kayik.png`, 384×256, şeffaf.
  ```
  Small wooden fishing rowboat with a little sail, side view, transparent background.
  ```

---

## 4. Maden katları

### 4.1 Kat şeridi (STİL ÇAPASI, ilk bunu üret)

Oyunda her kat ekran genişliğinde bir şerittir. **Ölçü: 1560×432** (oran 3,6:1; Midjourney `--ar 18:5`).
**Arka plan:** opak.

Yerleşim kuralları (soldan sağa, yüzde olarak):

| Bölge | Alan | İçerik |
|---|---|---|
| %0–28 | kart alanı | Kartın arkası; sade, koyu kaya (kat kartı bunun üstüne biner, ayrıntı koyma) |
| %28–79 | tünel odası | Ahşap destek kirişleri ve tavan; iki fener %44 ve %63 genişlikte, tavana yakın |
| %69–77 | bunker | Ahşap cevher bunkeri (cevher yığınını oyun çizer, bunker boş kalsın) |
| %79–100 | asansör kuyusu | Koyu dikey kuyu, iki çelik kılavuz ray |

- **Zemin:** tünel tabanı yüksekliğin %69'unda; raylı zemin %70'te.

```
Wide side-view cross-section of one underground mine floor for a mobile idle game, horizontal strip. Left quarter:
plain dark rock mass. Middle: a warm lantern-lit tunnel room carved into rock, thick wooden support posts and a
ceiling beam, two hanging oil lanterns casting warm light pools on the back wall, a dark ore vein in the left part of
the back wall, a narrow mine-cart rail on the floor at 70% height, an empty wooden ore bunker near the right end of
the room. Right fifth: a dark vertical elevator shaft with two steel guide rails and cross braces. Rock in {KAYA}
tones, cozy and readable, no characters, no carts.
```

- **`{KAYA}`:** bölge kaya rengi (§6), ör. Zonguldak için `warm brown-black coal rock (#2E241C, #5A4332)`.
- **Dosya:** `img/yeni/kat-{bolge}-{derinlik}.png`.

**Varyantlar:**

- **Derinlik** (en az bunlar, bölge başına 3):
  - `0` normal (1.–12. kat): yukarıdaki prompt.
  - `1` derin (13.–20. kat): `darker rock, small glowing {CEVHER} crystal geodes embedded in the walls`.
  - `2` en derin (21.–30. kat): `very dark rock with thin glowing orange magma cracks, heat haze`.
- **Gelişim aşaması** (isteğe bağlı; kat seviyesi 25'te ve 100'de değişir):
  - `0` (Sv. 1–24): `simple rough wooden supports`.
  - `1` (Sv. 25–99): `reinforced supports with steel brackets and a water pipe`.
  - `2` (Sv. 100+): `modern steel I-beam supports, electric caged lamps instead of lanterns, cable trays`.
- **Düzen** (isteğe bağlı; komşu katlar farklı görünsün):
  - A: `plain`;
  - B: `with a canary bird cage hanging near the bunker and two barrels`;
  - C: `with stacked crates of metal ingots and a toolbox`.

### 4.2 Kilitli kat (sıradaki kat)

- **Dosya:** `img/yeni/kat-kilitli.png`, 1560×432. **Arka plan:** şeffaf üst katman (kaya şeridinin üstüne biner).

```
Overlay for an unexcavated mine floor: a dashed light outline of a future tunnel room, two wooden posts holding a
blank wooden sign board, a pickaxe leaning against the posts, a few loose pebbles, darkened rock area, transparent
background outside the props, side view.
```

### 4.3 Sert kaya (her 5 katta bir)

- **Dosya:** `img/yeni/kat-sert-kaya.png`, 1560×432. **Arka plan:** şeffaf üst katman.

```
Overlay for a blocked mine floor: huge dark granite boulders filling a tunnel room, sharp cracks, a yellow-black
hazard tape stripe across the top of the room, a blank wooden warning sign on the left, dust in the air,
transparent background outside the rocks, side view.
```

### 4.4 Kaya dolgusu ve dip

- **Kaya dokusu:** `img/yeni/kaya-{bolge}.png`, 1024×1024, **kenarları dikişsiz döşenen** (seamless tileable).
  ```
  Seamless tileable texture of packed underground rock with embedded stones, painted cartoon style, {KAYA} tones,
  soft top-left light, no seams.
  ```
- **Dip:** `img/yeni/dip.png`, 1560×64, şeffaf değil.
  ```
  Bottom bedrock band, darkest dense rock with a few deep blue mineral glints, horizontal strip.
  ```

### 4.5 Hazine damarı (duvarda parlayan ödül)

Şeffaf, 384×384:

- **Altın:** `img/yeni/hazine-altin.png`
  ```
  Cluster of shiny gold nuggets bursting out of a rock wall crack, sparkles, warm glow, transparent background.
  ```
- **Elmas:** `img/yeni/hazine-elmas.png`
  ```
  Cluster of bright blue diamond crystals growing from a rock crack, sparkles, cool glow, transparent background.
  ```

---

## 5. Yüzey (en üstteki sahne)

Yüzeyi tek parça resim yerine **ayrı sprite'lar** olarak üretmek en sağlamı. Oyun bunları kendi koordinatlarına
yerleştirir: kamyonlar yola, kabin kuleye tam oturur. Yüzeyin oyundaki boyu 390×232'dir (üretim 1560×928).

| Parça | Dosya | Ölçü | Arka plan | Oyundaki yeri |
|---|---|---|---|---|
| Gökyüzü ve dağlar | `yuzey-arka-{bolge}.png` | 1560×928 | opak | tüm yüzey (alt kısmı önden kapanır) |
| Tepeler ve toprak | `yuzey-zemin-{bolge}.png` | 1560×928 | şeffaf gökyüzü | ufuk çizgisi yüksekliğin %62'si |
| Yol | `yol.png` | 1560×104 | opak | yüksekliğin %74–84'ü |
| Satış dükkânı | `satis.png` | 600×520 | şeffaf | sol %0–30, yolun üstünde |
| Boşaltma hunisi | `huni.png` | 200×240 | şeffaf | %29 genişlik, yolun hemen üstü |
| Depo silosu | `silo.png` | 330×460 | şeffaf | %58–77 genişlik |
| Kuyu kulesi | `kule.png` | 360×900 | şeffaf | %79–100 genişlik, kuyunun tam üstü |
| Bulut (3 çeşit) | `bulut-1..3.png` | 512×256 | şeffaf | gökyüzünde kayar |
| Kuş (2 kare) | `kus.png` | 128×64 | şeffaf | kanat çırpma |

Promptlar:

- **Gökyüzü ve dağlar:**
  ```
  Side-view sky backdrop for a mobile idle game surface scene, soft blue gradient sky, a warm sun in the upper left,
  {ARKA} on the horizon in the lower part, painted cartoon style, no buildings in the foreground.
  ```
- **Tepeler ve toprak:**
  ```
  Foreground terrain layer: rolling green hills and a strip of earth along the bottom, a mine shaft entrance opening
  in the ground at the far right, {ÖN}, transparent sky above the hills.
  ```
- **Yol:**
  ```
  Seamless horizontal two-lane asphalt road strip seen from the side, white dashed center line, gravel shoulder,
  tileable left to right.
  ```
- **Satış dükkânı:**
  ```
  Cozy cartoon ore trading shop, side view, red clay-tiled roof, small chimney, a counter window with a striped
  awning, a blank wooden sign board above the roof, stacked crates by the door, transparent background.
  ```
- **Boşaltma hunisi:**
  ```
  Steel ore unloading hopper on legs, funnel shape, side view, transparent background.
  ```
- **Depo silosu:**
  ```
  Cartoon industrial ore storage silo, side view, cylindrical riveted steel body with a conical roof, a vertical fill
  gauge strip, a blank metal plate on the front, a chute on top-right, a discharge spout at the bottom, on four
  steel legs, transparent background.
  ```
- **Kuyu kulesi:**
  ```
  Tall steel mine headframe tower, side view, lattice girders painted dark blue-gray, a platform at the top with a
  railing, space for a large sheave wheel at the top (leave the wheel out), cables going straight down, transparent
  background.
  ```
- **Bulut:**
  ```
  Fluffy cartoon cumulus cloud, soft white with light blue shading, transparent background.
  ```
- **Kuş:**
  ```
  Tiny cartoon seagull in flight, two frames side by side: wings up and wings down, transparent background.
  ```

`{ARKA}` ve `{ÖN}` yerine §6'daki bölge tarifleri gelir.

---

## 6. Bölgeler (12 bölge, şablonlardaki yer tutucular)

| Bölge | Cevher | `{KAYA}` | `{ARKA}` (ufuk) | `{ÖN}` (ön plan) |
|---|---|---|---|---|
| Zonguldak | kömür | `warm brown-black coal rock (#2E241C, #5A4332)` | `misty Black Sea coastline and forested green mountains` | `small coal heaps, a pine tree, an old brick colliery chimney` |
| Ereğli | demir | `rust-red iron rock (#3A2219, #8C5E44)` | `a busy harbor with cranes, steel mill chimneys and the Black Sea` | `rusty iron ore piles and a red-white crane` |
| Karabük | taş | `cool gray limestone (#35312C, #8E8576)` | `gray quarry cliffs and distant Ottoman wooden houses on hills` | `cut stone blocks and a small rail track` |
| Kastamonu | bakır | `brown rock with green copper streaks (#37271A, #8C6646)` | `dense dark-green pine forest mountains` | `wooden village fence and copper ore with green patina` |
| Balya | kurşun | `blue-gray slate rock (#2A3036, #7A8590)` | `rolling dry hills with olive groves and old mine ruins` | `gray lead ore piles and an old stone chimney ruin` |
| Afyon | mermer | `bright cream-white marble rock (#5E5850, #C9C1B2)` | `white terraced marble quarries and a castle on a steep rock` | `white marble blocks and red poppies` |
| Keçiborlu | kükürt | `ochre-yellow sulfur rock (#4A3F1E, #A89058)` | `yellow sulfur hills with soft steam vents` | `pink rose bushes and yellow sulfur crystals` |
| Bergama | altın | `warm brown rock with gold glints (#3E2418, #9A6A4A)` | `ancient acropolis ruins with columns on a hill, Aegean olive trees` | `fallen marble column pieces and an olive tree` |
| Gümüşhane | gümüş | `cold blue-gray rock (#262C36, #6E7888)` | `steep green Pontic mountains with a winding pass` | `silver-gray rocks and a mountain stream` |
| Elazığ | krom | `dark green-gray rock (#22302A, #62786C)` | `a blue lake surrounded by brown steppe mountains, an old castle` | `dry steppe grass and dark chromite stones` |
| Kırka | bor | `pale lilac-white rock (#4E4448, #B8AAAE)` | `white open-pit terraces and Phrygian rock monuments` | `white borax crystal piles` |
| Beylikova | neodim | `deep purple rock (#2E2238, #7E6A92)` | `central Anatolian steppe at purple dusk with wind turbines and a modern processing plant` | `sleek metal containers and glowing purple ore` |

---

## 7. Haritalar (3 bölgesel harita)

- **Ölçü:** 1440×1760 (oyunda 360×440). **Arka plan:** opak.
- **Dosya:** `img/yeni/harita-{karadeniz|bati|dogu}.png`.
- **İşaretler ve kartlar:** bölge işaretlerini ve kartlarını oyun çizer. Haritada yazı ve işaret olmasın; yalnız
  aşağıdaki noktalarda küçük, düz ve boş bir alan bırakılsın.

```
Illustrated cartoon game map, top-down storybook style, {HARİTA}, soft painted terrain, rivers, small trees and
hills, gentle paper texture, no text, no labels, no markers, empty flat clearings at the marked town spots.
```

| Harita | `{HARİTA}` | Boş alanlar (genişlik %, yükseklik %) |
|---|---|---|
| Karadeniz | `Black Sea coast of Turkey with blue sea at the top, green forested mountains, coastal towns` | Zonguldak (%62, %26), Ereğli (%22, %38), Karabük (%42, %65), Kastamonu (%77, %80) |
| Batı Anadolu | `Aegean Turkey with sea on the left, olive hills, white marble mountains, a lake district` | Balya (%49, %29), Afyon (%78, %53), Keçiborlu (%66, %80), Bergama (%27, %60) |
| İç ve Doğu Anadolu | `Central and eastern Anatolia, golden steppe, salt-white plains, blue lakes, snowy eastern mountains` | Gümüşhane (%74, %31), Elazığ (%74, %68), Kırka (%27, %43), Beylikova (%31, %76) |

---

## 8. Simgeler

Hepsi kare, şeffaf, **512×512** (oyunda 40–96 px). Sayfalarda, pencerelerde ve kutlama kartında kullanılır.

**Ortak simge promptu:**

```
Game UI icon, {NESNE}, centered, slight 3/4 front view, chunky shape, bold dark outline, glossy highlights, soft
glow behind, small soft shadow under the object, transparent background, no text.
```

**Dosya:** `img/yeni/simge-{ad}.png`.

| Ad | `{NESNE}` |
|---|---|
| cevher-{bolge} (12) | `a heap of {CEVHER} ore chunks with two big shiny crystals in front` |
| vagon | `a mine cart full of ore on a short rail` |
| kabin | `a mine elevator cage with ore inside hanging from a pulley` |
| gemi | `a small red cargo ship on stylized waves` |
| ambar | `a wooden warehouse barn with a big door and crates` |
| kontrat | `a rolled contract scroll with a red wax seal and a quill` |
| madalya | `a gold medal with a purple ribbon and a star` |
| hediye | `a red gift box with a gold ribbon bow` |
| sikke | `a stack of three gold coins` |
| elmas | `a brilliant cut blue diamond` |
| kazma | `a steel pickaxe stuck in a small ore pile` |
| sise | `a laboratory flask with bubbling green liquid` |
| kask | `a yellow miner hard hat with a glowing headlamp` |
| kumsaati | `a wooden hourglass with golden sand` |
| yildirim | `a round blue badge with a golden lightning bolt` |
| matkap | `a yellow drilling rig tower with a spiral auger in rock` |
| pusula | `a brass compass with a red needle` |
| muze | `a classical stone museum facade with four columns and steps` |
| kumbara | `a pink piggy bank with a blue diamond falling into its slot` |

### 8.1 Maden Müzesi buluntuları (36)

Ortak simge promptuna `museum artifact` ekle. **Dosya:** `img/yeni/buluntu-{kod}.png`. Bulunmamış buluntunun siluetini
oyun kendisi karartır.

| Kod | `{NESNE}` |
|---|---|
| lamba | `an old brass carbide miner's lamp with a round reflector and a small flame` |
| egrelti | `a slab of dark stone with a fossil fern leaf imprint` |
| uzunmehmet | `a single lump of shiny black coal on a small velvet cushion` |
| hematit | `a heavy reddish-silver hematite crystal` |
| capa | `an old iron ship anchor` |
| herakleia | `an ancient bronze coin with a profile head` |
| ammonit | `a cream colored spiral ammonite fossil` |
| raycivisi | `an old forged iron railway spike with a hooked head` |
| konakanahtari | `a large ornate antique iron key` |
| kurebaltasi | `an ancient copper axe head with green patina on a wooden handle` |
| sahan | `a hammered copper dish with a domed lid` |
| paflagonya | `an ancient stone seal with a carved profile` |
| galen | `a silver-gray cubic galena crystal` |
| vagonteker | `an old cast iron mine wagon wheel` |
| hisse | `an old yellowed share certificate with an ornate border and a red seal (no readable text)` |
| keski | `a stone carver's steel chisel with a wooden handle` |
| dokimeion | `a white marble Ionic column capital with spiral volutes` |
| frigkabartma | `a sandstone block carved with Phrygian geometric meander patterns` |
| kukurtkristali | `a bright yellow sulfur crystal cluster` |
| kantar | `an old brass steelyard balance scale with a hanging weight` |
| duduk | `a brass steam locomotive whistle` |
| altinelek | `an old wooden gold panning sieve with gold nuggets` |
| pergamon | `an ancient gold coin with a profile head` |
| parsomen | `a rolled parchment scroll with wooden handles and a wax seal` |
| telkari | `a silver filigree brooch with a blue gem` |
| kandil | `an engraved silver oil lamp with a small flame` |
| kervancani | `a bronze caravan bell on a leather strap` |
| kromit | `a black metallic chromite ore nugget` |
| harput | `a carved castle wall stone with crenellations` |
| kurek | `a carved wooden boat oar` |
| boraks | `a clear prismatic borax crystal` |
| frigkabi | `a terracotta Phrygian jug painted with black zigzag bands` |
| kervannali | `an old iron horseshoe` |
| bastnazit | `a honey colored bastnasite crystal` |
| miknatis | `a red U-shaped magnet with silver tips` |
| defter | `a worn leather notebook with a ribbon bookmark and the initials of an old miner embossed on the cover` |

---

## 9. Arayüz

| Görsel | Dosya | Ölçü | Prompt (`{NESNE}` için §8'deki ortak simge promptu) |
|---|---|---|---|
| HUD para | `hud-para.png` | 128×128 | `a single shiny gold coin with a star emblem` |
| HUD elmas | `hud-elmas.png` | 128×128 | `a faceted blue diamond` |
| 2x rozeti | `alt-2x.png` | 256×240 | `a round golden badge with a big glowing "2x" symbol` (yazıyı oyun da basabilir; boş rozet de olur) |
| Alt bant sikkesi | `alt-sikke.png` | 128×128 | `a gold coin` |
| İstatistik: üretim | `ist-komur.png` | 256×224 | `a heap of black coal` |
| İstatistik: depo | `ist-araba.png` | 256×248 | `a small mine cart with coal` |
| İstatistik: gelir | — | — | `a stack of gold coins` (şu an kodla) |
| Kilit | `ist-kilit.png` | 224×256 | `a golden padlock` |

**Panel dokuları:**

- **Kaya zemin:** `img/yeni/doku-kaya-{bolge}.png`, 720×720, dikişsiz döşenen.
  ```
  Seamless tileable dark rock texture for UI panel backgrounds, subtle, low contrast, {KAYA} tones, no seams.
  ```
- **Kalas plaka (başlık şeridi):** `img/yeni/doku-tahta.png`, 1440×136.
  ```
  Horizontal wooden plank banner, warm brown wood grain with two metal rivets at the ends, side lit, seamless center.
  ```

**Alt sekme ikonları:** şu an vektör (SVG), istersen PNG; 192×192, şeffaf.

- Maden: `a pickaxe`
- Harita: `a folded map with a pin`
- Yöneticiler: `a foreman silhouette with a hard hat`
- Araştırma: `a lab flask`
- Mağaza: `a small shop with an awning`

---

## 10. Parçacıklar

Şeffaf, 128×128, tek nesne. **Dosya:** `img/yeni/p-{ad}.png`.

| Ad | Prompt |
|---|---|
| toz | `a small soft puff of brown dust, cartoon` |
| kivilcim | `a tiny bright orange spark streak` |
| parca | `a small chunk of broken rock` |
| sikke | `a spinning gold coin seen edge-on at a slight angle` |
| parilti | `a four-pointed white-gold sparkle star` |
| duman | `a soft gray smoke puff` |

---

## 11. Uygulama ikonu ve açılış ekranı

- **İkon:** `araclar/android/ikon-kare.png` ve `ikon-yuvarlak.png`, 1024×1024 (Android 512'ye küçültülür).
  ```
  Mobile game app icon, a cartoon steel pickaxe crossing a big shiny blue diamond in front of a golden coin
  background with radiant rays, bold outlines, vibrant, centered, fills the square, no text.
  ```
- **Açılış:** `araclar/android/acilis.png`, 1080×1920.
  ```
  Vertical mobile game splash art: a cozy mining town at dawn, a tall steel mine headframe on the right, a red-roofed
  ore shop on the left, a dump truck on the road, golden light, a cross-section of glowing tunnels below the ground
  with tiny miners, deep navy sky at the top with empty space for a title, no text.
  ```

---

## 12. Teslim listesi

Önerilen sıra:

| Sıra | Ne | Adet |
|---|---|---|
| 1 | Stil çapası: Zonguldak kat şeridi (§4.1) ve madenci kartı 0 (§2.1) | 2 |
| 2 | Kat şeritleri: 12 bölge × 3 derinlik | 36 |
| 3 | Yüzey parçaları + 12 bölge arka ve zemini | 9 + 24 |
| 4 | Kamyon, maden arabası, kabin, makara, sondaj | ~8 |
| 5 | Simgeler + 36 buluntu | 31 + 36 |
| 6 | Hikâye portreleri, yönetici portreleri | 9 + 24 |
| 7 | Madenci kare setleri (4 görünüş × 9 klip) | 4 sayfa (ya da tek tek kareler) |
| 8 | Haritalar, arayüz, parçacıklar, ikon, açılış | ~20 |

Her grup bittiğinde dosyaları `img/yeni/` klasörüne koyman yeterli. Oyuna bağlama (manifest, yükleme kancası,
ölçek ve hizalama) ve ekran görüntüsüyle kontrol tarafını ben yaparım.
