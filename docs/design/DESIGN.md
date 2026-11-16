---
name: Cevher Madenci
version: alpha
colors:
  background: "#062B42"
  background-deep: "#031A2B"
  surface-dark: "#0B3A55"
  frame: "#2B6585"
  surface: "#F4E8D6"
  surface-sunken: "#E9D7BC"
  border: "#B8996F"
  text-primary: "#2B1D12"
  text-secondary: "#6B5640"
  text-on-dark: "#FFFFFF"
  text-on-dark-soft: "#B7CEDB"
  accent: "#B9501C"
  accent-light: "#E67E3E"
  on-accent: "#FFFFFF"
  gold: "#F6C453"
  success: "#13703A"
  success-bright: "#2ECC71"
  bar-track: "#3A2A1E"
  info: "#2F6DB8"
  tile: "#3FBDB6"
  danger: "#FF7A63"
  danger-surface: "#4A1F1A"
  disabled: "#A8968A"
  rarity-common: "#B8C2C8"
  rarity-rare: "#6FA8EC"
typography:
  hero:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 800
    lineHeight: 34px
  title:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 800
    lineHeight: 24px
  card-title:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 800
    lineHeight: 19px
  button:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 800
    lineHeight: 19px
  value:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 18px
  body:
    fontFamily: "'Rubik', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 17px
  meta:
    fontFamily: "'Rubik', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 15px
  label:
    fontFamily: "'Rubik', 'Segoe UI', Roboto, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 13px
spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
rounded:
  badge: 6px
  button: 9px
  card: 12px
  strip: 14px
  sheet: 18px
  full: 999px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: 48px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: 48px
  button-gem:
    backgroundColor: "{colors.info}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: 48px
  button-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
  card-station:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.card-title}"
    rounded: "{rounded.card}"
  card-cream:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
  input-segmented:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-primary}"
    typography: "{typography.meta}"
    rounded: "{rounded.full}"
    height: 34px
  nav-tab:
    backgroundColor: "{colors.background-deep}"
    textColor: "{colors.text-on-dark-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.strip}"
  region-chip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-on-dark}"
    typography: "{typography.card-title}"
    rounded: "{rounded.card}"
---

# Cevher Madenci — Design System

**Geliştirici:** İbrahim Can Göçmez

## Overview

Cevher Madenci, Türkiye'nin maden bölgelerinde geçen 2D, dikey, tek elle oynanan bir boşta (idle) madencilik oyunu.
Hedef kitle kısa ama sık oturumlarla yüzlerce saat oynayan mobil oyuncu. Tasarım tezi: **"Fener ve Çini"**: gece
laciverti bir maden ocağında sıcak fener ışığı; krem kartlar okunurluğu taşır, tek bir turuncu eylem rengi oyuncuyu
yönlendirir, İznik çinisi turkuazı ise bölge, harita ve hikâye yüzeylerine yerel bir imza katar.

Yön seçiminin dayanağı: türdeki oyunlar uzun oturumlar için koyu zemin, 60/30/10 renk dengesi ve yalnız ana eylemde
doygun renk kullanıyor; metin kontrastı en az 4.5:1. Oyunu rakiplerinden ayıran şey Anadolu motifi (çini turkuazı,
bölgelerin gerçek coğrafyası) ve sıcak "ocak başı" dili.

Tek sistem, tek mod (koyu). Sahne sanatı (katlar, yüzey, karakterler) canvas'ta çizilir ve `docs/GORSEL_PROMPTLARI.md`
kurallarına uyar; bu belge arayüzü (DOM katmanı) tanımlar.

## Colors

60/30/10 dengesi: **%60 lacivert** (`background`, `surface-dark`), **%30 krem** (`surface` kartlar ve paneller),
**%10 vurgu** (`accent` turuncu, `gold`, `tile`).

- `background` #062B42: uygulama zemini ve sayfa arka planı. Üzerindeki metin `text-on-dark`.
- `background-deep` #031A2B: alt gezinti çubuğu, pencere perdesinin tabanı, en koyu gölgeler.
- `surface-dark` #0B3A55: koyu pano ve kat kartı zemini. Üzerindeki metin `text-on-dark` ya da `text-on-dark-soft`.
- `frame` #2B6585: pano çerçevesi ve koyu yüzeylerdeki ayırıcı çizgiler; yalnız süs, metin ya da kontrol kenarı değil.
- `surface` #F4E8D6: krem kart, alttan açılan panel, pencere. Üzerindeki metin `text-primary` / `text-secondary`.
- `surface-sunken` #E9D7BC: basılı kart, ikincil düğme, segment kontrol zemini.
- `border` #B8996F: krem kartın dış kenarı; süs çizgisi.
- `text-primary` #2B1D12: `surface` ve `surface-sunken` üzerindeki ana metin (13.5:1).
- `text-secondary` #6B5640: `surface` üzerindeki ikincil metin (5.7:1).
- `text-on-dark` #FFFFFF: `background`, `surface-dark`, `accent`, `success`, `info` üzerindeki metin.
- `text-on-dark-soft` #B7CEDB: `surface-dark` ve `background` üzerindeki ikincil metin (7.3:1).
- `accent` #B9501C: tek ana eylem rengi; `Yükselt`, `Tut`, `Aç` düğmeleri. Üzerinde `on-accent` beyaz (5.0:1).
- `accent-light` #E67E3E: düğme degradesinin üst tonu ve seçili sekmenin üst kenarı; üzerine tek başına metin konmaz.
- `on-accent` #FFFFFF: `accent` üzerindeki düğme yazısı.
- `gold` #F6C453: para, ödül, Efsanevi nadirlik, alt şerit vurgusu. Koyu zeminde metin olarak kullanılabilir (9:1);
  üzerindeki metin `text-primary`.
- `success` #13703A: `Topla x2`, `Bitir` gibi olumlu düğmeler ve krem üzerindeki artış metni (5.1:1).
- `success-bright` #2ECC71: yalnız ilerleme çubuğu dolgusu ve koyu zeminde artış oku; `bar-track` üzerinde 6.5:1.
- `bar-track` #3A2A1E: ilerleme çubuğunun boş izi.
- `info` #2F6DB8: elmas düğmesi ve bilgi bildirimi zemini; üzerinde beyaz metin (5.3:1).
- `tile` #3FBDB6: çini turkuazı; bölge kartı kenarı, `Buradasın` halkası, hikâye çerçevesi, harita görev işareti.
  `surface-dark` üzerinde metin olarak 5.2:1.
- `danger` #FF7A63: koyu zemindeki uyarı metni ve rozet (`background` üzerinde 5.7:1).
- `danger-surface` #4A1F1A: uyarı bildirimi zemini; üzerindeki metin beyaz.
- `disabled` #A8968A: pasif düğme zemini; üzerindeki metin `text-primary` (5.7:1).
- `rarity-common` #B8C2C8: Sıradan nadirlik halkası ve yazısı (koyu zeminde).
- `rarity-rare` #6FA8EC: Nadir nadirlik halkası ve yazısı (koyu zeminde 4.9:1 ve üstü). Efsanevi `gold` kullanır.

## Typography

Başlıklar ve sayılar **Baloo 2** (yuvarlak, sıcak, oyunsu); metinler **Rubik** (küçük boyutta net). İkisi de Google
Fonts'tan ve Türkçe karakterleri tam destekler. Bütün sayılar `font-variant-numeric: tabular-nums` ile yazılır.

| Token | Kullanım |
|---|---|
| `hero` | Pencerelerdeki büyük ödül tutarı (`48,2 bin`) |
| `title` | Bölge adı, sayfa başlığı |
| `card-title` | Kat kartı başlığı (`3. Kat`), yönetici adı |
| `button` | Bütün düğme yazıları |
| `value` | Üst bilgi çubuğundaki para, istatistik değerleri |
| `body` | Açıklama metinleri |
| `meta` | `Seviye 25`, üretim hızı, kart alt satırları |
| `label` | Sekme etiketleri, rozetler, bildirim metni. En küçük yazı 11 px |

## Layout

- Telefon öncelikli, dikey, 360–480 px genişlik; tasarım ölçüsü 390×844. Daha geniş ekranda oyun 480 px'te ortalanır,
  kenarlar `background-deep`.
- Dikey bölgeler: üst bilgi çubuğu (74 px + çentik), istatistik şeridi (58 px), maden görünümü (kaydırılır), alt şerit
  (64 px, maden görünümünün üstünde yüzer), alt gezinti (66 px + alt güvenli alan).
- Sayfalar (Harita, Yöneticiler, Araştırma, Mağaza) üst bilgi çubuğunun altından gezintiye kadar uzanır; gövde kendi
  içinde kayar, kenar boşluğu `lg` (12 px).
- Boşluk ölçeği: `xxs` 2, `xs` 4, `sm` 6, `md` 8, `lg` 12, `xl` 16, `xxl` 24. Kart içi `lg`, kartlar arası `md`,
  bölümler arası `xxl`.
- Dokunma hedefi en az 44×44 px; tek elle başparmak bölgesi alt yarıdır, ana eylemler oraya konur.

## Elevation & Depth

Üç katman: zemin (lacivert) → kart (krem ya da pano) → panel/pencere. Gölgeler sıcak ve yumuşaktır:

- Kart: `0 2px 0 rgba(120,80,40,.28), 0 6px 14px rgba(0,0,0,.30)`.
- Düğme: üstte iç ışık (`inset 0 1px 0 rgba(255,255,255,.35)`), altta 2 px koyu kenar; basınca 2 px aşağı iner.
- Panel ve pencere: `0 10px 28px rgba(0,0,0,.40)`; arkasında `background-deep` %60 perde.
- Pano (koyu kart): `surface-dark` degrade + 2 px `frame` çerçeve, köşelerde ince `gold` parıltı.

## Shapes

Hepsi yuvarlak; keskin köşe yok. `badge` 6 (rozet), `button` 9 (düğme, çubuk), `card` 12 (kart), `strip` 14 (şerit,
sekme), `sheet` 18 (panelin üst köşeleri, pencere), `full` 999 (hap, segment kontrol, yuvarlak simge düğmesi).

## Components

- **button-primary** (`Yükselt · 12,4 bin`): `accent-light` → `accent` dikey degrade, beyaz yazı, 1 px yazı gölgesi.
  Basılı: 2 px aşağı. Para yetmiyorsa **button-disabled**'a döner ve `Yetersiz para · 12,4 bin` yazar.
- **button-success** (`Topla x2`, `Bitir`): `success`; reklamlıysa solda ▶ simgesi.
- **button-gem** (`Elmasla Tut · 50`): `info`; solda elmas simgesi.
- **button-secondary** (`Topla`, `Sonra`): `surface-sunken`, 1 px `border` kenar.
- **card-station** (kat kartı): `surface-dark` pano; başlık, `Seviye`, hız ve sağda yuvarlak yükseltme düğmesi.
  Yöneticisi varsa sol üstte nadirlik halkalı küçük portre.
- **card-cream**: sayfa listelerindeki krem kart (yönetici, araştırma, mağaza ürünü).
- **sheet**: alttan açılan panel; `surface`, üst köşeler 18, 40×4 tutamak, en fazla ekranın %78'i.
- **input-segmented** (`x1 · x10 · x50 · Maks`): hap şekli; seçili parça `accent` zemin ve beyaz yazı.
- **nav-tab**: alt gezinti sekmesi; seçili sekmede ikon ve etiket beyaz, üst kenarda 3 px `accent-light` çizgi.
- **region-chip** (harita bölge kartı): `surface-dark` %90, kenar durumuna göre: açık → `tile`, şu an burada → `tile`
  halka + `Buradasın`, açılabilir → `gold` parıltı + `Aç`, kilitli → gri kilit ve koşul metni.
- **Bildirim (toast)**: üstte, 2,5 sn; bilgi `info`, uyarı `danger-surface` + `danger` simge.
- **Rozet**: kırmızı nokta `danger`, sayı rozeti `gold` zemin `text-primary` yazı.

## Do's and Don'ts

**Do:**
- Her ekranda tek bir ana eylem (`accent`) olsun; diğer düğmeler ikincil.
- Sayıları her zaman kısaltılmış Türkçe biçimle yaz (`12,4 bin`, `3,1 mn`, `8,2 mr`).
- Ödül anlarını kutla: altın ışınlar, konfeti, para uçuşu; ama 3,6 sn içinde kendiliğinden kapansın.
- Darboğazı göster: yetersiz istasyonun kartı hafifçe titrer, bildirim dokununca o istasyona götürür.
- Reklamlı her düğmede ▶ simgesi ve kalan hak (`Bugün 2 hakkın kaldı`) görünsün.
- Bölgenin kimliğini çini turkuazı ve bölge cevher rengiyle ver.

**Don't:**
- Saf doygun ana renkler ve neon kullanma; büyük yüzeyler 2–3 duraklı degrade olsun ("cırtlak olmasın").
- Engelleyici hata penceresi açma; hata bildirimle söylenir, oyun durmaz.
- Görsellere yazı gömme; tabelalar boş kalır, yazıyı arayüz basar.
- 11 px'ten küçük yazı ve 44 px'ten küçük dokunma hedefi kullanma.
- Satın alma ve reklam düğmelerinde oyuncuyu yanıltan ifade kullanma; ödeme alınmayan önizlemede bunu açıkça yaz.
- Emoji'yi simge yerine kullanma; simgeler `js/arayuz/ikonlar.js` SVG'leri.

## Surfaces

| Surface | Route / shell | Phase | Priority | Spec | Preview |
|---------|---------------|-------|----------|------|---------|
| Maden Ana Ekranı | `#maden` (varsayılan görünüm) | 1 | P0 | [spec](screens/maden-ana.md) | [preview](screens/maden-ana.html) |
| Yükseltme Paneli | Alttan panel (`yukseltme`) | 1 | P0 | [spec](screens/yukseltme.md) | [preview](screens/yukseltme.html) |
| Çevrimdışı Kazanç | Pencere (`cevrimdisi`) | 1 | P0 | [spec](screens/cevrimdisi.md) | [preview](screens/cevrimdisi.html) |
| Yönetici Penceresi | Pencere (`yonetici`) | 1 | P0 | [spec](screens/yonetici.md) | [preview](screens/yonetici.html) |
| Harita | Sekme `harita` | 2 | P0 | [spec](screens/harita.md) | [preview](screens/harita.html) |
| Yöneticiler | Sekme `yoneticiler` | 2 | P1 | [spec](screens/yoneticiler.md) | [preview](screens/yoneticiler.html) |
| Mağaza | Sekme `magaza` | 2 | P1 | [spec](screens/magaza.md) | [preview](screens/magaza.html) |
| Araştırma | Sekme `arastirma` | 2 | P1 | [spec](screens/arastirma.md) | [preview](screens/arastirma.html) |
| Kutlama ve Hikâye | Pencere | 3 | P1 | sonraki tur | — |
| Sondaj, Keşif, Müze, Kumbara | Pencere | 3 | P2 | sonraki tur | — |
| Ayarlar, Açılış | Panel, tam ekran | 3 | P2 | sonraki tur | — |
