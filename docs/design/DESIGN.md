---
name: Cevher Madenci
version: alpha
colors:
  background: "#1C0F07"
  background-deep: "#0F0804"
  surface-dark: "#4E2E16"
  wood: "#7A4A28"
  frame: "#E0AE4E"
  surface: "#F7E7C6"
  surface-sunken: "#EBD3A6"
  border: "#C8902F"
  text-primary: "#3A2410"
  text-secondary: "#6B4A28"
  text-on-dark: "#FFF4DE"
  text-on-dark-soft: "#E8D2B0"
  accent: "#FFB12E"
  accent-light: "#FFE58A"
  accent-dark: "#E8781C"
  on-accent: "#4A2206"
  gold: "#FFD24A"
  success: "#3FC25A"
  on-success: "#0E3A18"
  success-text: "#13703A"
  success-bright: "#3FD06A"
  bar-track: "#1C0F07"
  info: "#56B4F0"
  on-info: "#0A1F3A"
  tile: "#3FD0C8"
  danger: "#FF8A6B"
  danger-text: "#8E3B2E"
  danger-surface: "#4A1A10"
  disabled: "#A8927A"
  on-disabled: "#2A1A0E"
  rarity-common: "#B8C2C8"
  rarity-rare: "#7FC0F5"
typography:
  hero:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 800
    lineHeight: 34px
  title:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 21px
    fontWeight: 800
    lineHeight: 25px
  card-title:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 800
    lineHeight: 20px
  button:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 17px
    fontWeight: 800
    lineHeight: 20px
  value:
    fontFamily: "'Baloo 2', 'Trebuchet MS', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 800
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
  button: 12px
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
    textColor: "{colors.on-success}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: 48px
  button-gem:
    backgroundColor: "{colors.info}"
    textColor: "{colors.on-info}"
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
    textColor: "{colors.on-disabled}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
  card-station:
    backgroundColor: "{colors.wood}"
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
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-on-dark-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
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
Hedef kitle kısa ama sık oturumlarla yüzlerce saat oynayan mobil oyuncu. Tasarım tezi: **"Altın Ocak"**: fener ışığıyla
ısınan kahverengi bir maden ocağı; paneller ahşap kalas ve pirinç çivili, kartlar parşömen kremi, ana düğmeler parlak
amber-altın ve kabarık. Sıcak, samimi, elle tutulur bir "maden işletmesi" hissi.

Yön, sahibinin üç tema seçeneği arasından kahverengi temayı seçmesiyle kilitlendi (önceki "Fener ve Çini" lacivert
yönünün yerine geçer). Türün dili korunur: koyu zemin, 60/30/10 renk dengesi, doygun renk yalnız ana eylemde, metin
kontrastı en az 4.5:1. Çini turkuazı (`tile`) yalnız bölge ve harita vurgusunda küçük dozda kalır.

Tek sistem, tek mod (koyu). Sahne sanatı (katlar, yüzey, karakterler) canvas'ta çizilir ve `docs/GORSEL_PROMPTLARI.md`
kurallarına uyar; bu belge arayüzü (DOM katmanı) tanımlar.

## Colors

60/30/10 dengesi: **%60 kahverengi** (`background`, `surface-dark`, `wood`), **%30 krem** (`surface` kartlar ve
paneller), **%10 vurgu** (`accent` amber, `gold`, `frame` pirinç).

- `background` #1C0F07: uygulama zemini (sıcak koyu kahve, ortası fener ışığıyla açılan radyal degrade). Üzerindeki metin `text-on-dark`.
- `background-deep` #0F0804: alt gezinti tabanı, pencere perdesi, en koyu gölgeler.
- `surface-dark` #4E2E16: koyu ahşap; gezinti sekmesi, bölge kartı, çubuk çerçevesi. Üzerindeki metin `text-on-dark` ya da `text-on-dark-soft`.
- `wood` #7A4A28: kalas paneller (üst bilgi çubuğu, kat kartı, alt şerit); kalas çizgileri bu tonun açık ve koyusuyla çizilir. Üzerindeki metin `text-on-dark` (6.8:1) ya da `text-on-dark-soft` (5.0:1).
- `frame` #E0AE4E: pirinç; panel çerçevesi ve çiviler. Yalnız süs ve kenar; metin değil.
- `surface` #F7E7C6: parşömen kremi; kart, panel, pencere, istatistik şeridi. Üzerindeki metin `text-primary` / `text-secondary`.
- `surface-sunken` #EBD3A6: basılı kart, ikincil düğme, segment kontrol zemini.
- `border` #C8902F: krem kartın ve hapların pirinç kenarı; süs çizgisi.
- `text-primary` #3A2410: `surface` ve `surface-sunken` üzerindeki ana metin (12:1).
- `text-secondary` #6B4A28: `surface` üzerindeki ikincil metin (6.5:1).
- `text-on-dark` #FFF4DE: `background`, `surface-dark`, `wood` üzerindeki metin.
- `text-on-dark-soft` #E8D2B0: koyu ve ahşap yüzeylerdeki ikincil metin.
- `accent` #FFB12E: tek ana eylem rengi; `Yükselt`, `Tut`, `Aç`, `Kaz` düğmeleri. Üzerindeki yazı `on-accent` koyu kahve (7.6:1).
- `accent-light` #FFE58A: düğme degradesinin üst parıltısı ve seçili sekmenin ışıltısı.
- `accent-dark` #E8781C: düğme degradesinin alt tonu ve kabartma kenarı; üzerine tek başına metin konmaz.
- `on-accent` #4A2206: `accent` üzerindeki düğme yazısı.
- `gold` #FFD24A: para, ödül, Efsanevi nadirlik, kat hız satırı. Koyu zeminde metin olarak kullanılabilir (13:1); `wood` üzerinde 5.1:1.
- `success` #3FC25A: `Topla x2`, `Kazanç x2`, `Bitir` gibi olumlu düğmeler; üzerindeki yazı `on-success`.
- `on-success` #0E3A18: `success` üzerindeki düğme yazısı (5.5:1).
- `success-text` #13703A: krem üzerindeki artış metni (5.0:1).
- `success-bright` #3FD06A: yalnız ilerleme çubuğu dolgusu, `bar-track` üzerinde.
- `bar-track` #1C0F07: ilerleme çubuğunun boş izi.
- `info` #56B4F0: elmas düğmesi ve bilgi bildirimi; üzerindeki yazı `on-info`.
- `on-info` #0A1F3A: `info` üzerindeki yazı (7.2:1).
- `tile` #3FD0C8: çini turkuazı; yalnız bölge kartı kenarı, `Buradasın` halkası ve harita görev işareti. `surface-dark` üzerinde 6.4:1.
- `danger` #FF8A6B: koyu zemindeki uyarı metni ve rozet (`background` üzerinde 8.1:1).
- `danger-text` #8E3B2E: krem üzerindeki uyarı metni (6.1:1), ör. istatistik şeridinde darboğaz etiketi.
- `danger-surface` #4A1A10: uyarı bildirimi zemini; üzerindeki metin `text-on-dark`.
- `disabled` #A8927A: pasif düğme zemini; üzerindeki yazı `on-disabled` (5.6:1).
- `on-disabled` #2A1A0E: pasif düğme yazısı.
- `rarity-common` #B8C2C8: Sıradan nadirlik halkası ve yazısı (koyu zeminde).
- `rarity-rare` #7FC0F5: Nadir nadirlik halkası ve yazısı (koyu zeminde). Efsanevi `gold` kullanır.

## Typography

Başlıklar ve sayılar **Baloo 2** (yuvarlak, sıcak, oyunsu), metinler **Rubik**. Koyu ve ahşap yüzeylerdeki başlıklar
1–2 px koyu kahve yazı gölgesiyle kabartılır. Bütün sayılar `font-variant-numeric: tabular-nums`.

| Token | Kullanım |
|---|---|
| `hero` | Pencerelerdeki büyük ödül tutarı |
| `title` | Bölge adı, sayfa başlığı |
| `card-title` | Kat kartı başlığı, yönetici adı |
| `button` | Bütün düğme yazıları |
| `value` | Hap ve istatistik değerleri |
| `body` | Açıklama metinleri |
| `meta` | `Seviye 25`, hız, kart alt satırları |
| `label` | Sekme etiketleri, rozetler, bildirim metni. En küçük yazı 11 px |

## Layout

- Telefon öncelikli, dikey, 360–480 px genişlik; tasarım ölçüsü 390×844. Daha geniş ekranda oyun 480 px'te ortalanır.
- Dikey bölgeler: üst bilgi çubuğu (76 px + çentik, ahşap kalas), istatistik şeridi (58 px, parşömen), maden görünümü
  (kaydırılır), alt şerit (68 px, ahşap, yüzer), alt gezinti (68 px + alt güvenli alan).
- Sayfalar üst bilgi çubuğunun altından gezintiye kadar uzanır; gövde kendi içinde kayar, kenar boşluğu `lg` (12 px).
- Boşluk ölçeği: `xxs` 2, `xs` 4, `sm` 6, `md` 8, `lg` 12, `xl` 16, `xxl` 24. Kart içi `lg`, kartlar arası `md`,
  bölümler arası `xxl`.
- Dokunma hedefi en az 44×44 px; ana eylemler başparmak bölgesinde (alt yarı).

## Elevation & Depth

Elle tutulur, kabarık bir dünya: her katman bir öncekinin üstünde durur.

- Ahşap panel: kalas çizgili degrade, 3 px `frame` pirinç çerçeve, üstte iç ışık, altta iç gölge, köşelerde pirinç
  çiviler; dış gölge `0 6px 14px rgba(0,0,0,.6)`.
- Krem kart: 2–3 px `border` kenar, üstte açık iç ışık, `0 4px 10px rgba(0,0,0,.5)`.
- Düğme: 3 px açık krem kenar, üstte parlak iç ışık, altta 4 px koyu kabartma kenarı (`0 4px 0`), dış gölge; basınca
  4 px aşağı iner ve kabartma kaybolur.
- Panel ve pencere: `0 10px 28px rgba(0,0,0,.5)`; arkada `background-deep` %65 perde.
- Fener ışığı: kat odalarında ve ana düğmelerde yumuşak amber parıltı (`0 0 14px rgba(255,177,46,.6)`).

## Shapes

Yuvarlak ve tombul. `badge` 6 (rozet), `button` 12 (düğme, sekme), `card` 12 (kart, ahşap panel), `strip` 14 (şerit),
`sheet` 18 (panelin üst köşeleri, pencere), `full` 999 (hap, segment, yuvarlak yükseltme düğmesi).

## Components

- **button-primary** (`Yükselt · 12,4 bin`): `accent-light → accent → accent-dark` dikey degrade, 3 px krem kenar,
  `on-accent` koyu kahve yazı, 4 px kabartma. Para yetmiyorsa **button-disabled**: `Yetersiz para · 12,4 bin`.
- **button-success** (`Topla x2`, `Kazanç x2`): yeşil degrade, `on-success` yazı; reklamlıysa solda ▶.
- **button-gem** (`Elmasla Tut · 50`): `info` degrade, `on-info` yazı, solda elmas.
- **button-secondary** (`Topla`, `Ata`, `Sonra`): `surface → surface-sunken`, 2 px `border` kenar, `text-primary`.
- **card-station** (kat kartı): ahşap kalas panel, pirinç çerçeve ve çiviler; başlık, `Seviye`, `gold` hız satırı,
  yeşil kademe çubuğu; sağ kenara taşan 46 px yuvarlak amber yükseltme düğmesi.
- **card-cream**: sayfa listelerindeki parşömen kart (yönetici, araştırma, mağaza ürünü).
- **sheet**: alttan açılan parşömen panel; üst köşeler 18, 40×4 tutamak, en fazla ekranın %78'i.
- **input-segmented** (`x1 · x10 · x50 · Maks`): hap; seçili parça `accent` degrade ve `on-accent` yazı.
- **nav-tab**: koyu ahşap sekme, 2 px kahve kenar; seçili sekme `accent` degrade, `on-accent` ikon ve yazı, amber parıltı.
- **region-chip** (harita bölge kartı): `surface-dark`, kenar durumuna göre: açık → `tile` + ✓, burada → `tile` halka +
  `Buradasın`, açılabilir → `gold` parıltı + `Aç`, kilitli → gri kilit ve koşul metni.
- **Hap** (para, elmas): koyu kahve iç gölgeli hap, 2 px `border`, ikon parıltılı.
- **Bildirim**: üstte, 2,5 sn; bilgi `info`, uyarı `danger-surface` + `danger` simge.
- **Rozet**: `gold` zemin + `text-primary` yazı; kırmızı nokta `danger`.

## Do's and Don'ts

**Do:**
- Her ekranda tek bir ana eylem (`accent` amber); diğer düğmeler ikincil ya da yeşil.
- Sayıları kısaltılmış Türkçe biçimle yaz (`12,4 bin`, `3,1 mn`, `8,2 mr`).
- Ahşap ve pirinç dokusunu panellerde tutarlı kullan; çiviler köşelerde, en fazla dört.
- Ödül anlarını kutla: altın ışınlar, konfeti, para uçuşu; 3,6 sn içinde kendiliğinden kapansın.
- Darboğazı göster: yetersiz istasyonun kartı hafifçe titrer, bildirim dokununca o istasyona götürür.
- Reklamlı her düğmede ▶ simgesi ve kalan hak görünsün.

**Don't:**
- Amber düğmeye beyaz yazı koyma; yazı her zaman `on-accent` koyu kahve.
- Saf doygun ana renkler ve neon kullanma; büyük yüzeyler 2–3 duraklı degrade.
- Engelleyici hata penceresi açma; hata bildirimle söylenir, oyun durmaz.
- Görsellere yazı gömme; tabelalar boş kalır, yazıyı arayüz basar.
- 11 px'ten küçük yazı ve 44 px'ten küçük dokunma hedefi kullanma.
- Satın alma ve reklam düğmelerinde oyuncuyu yanıltan ifade kullanma.
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
