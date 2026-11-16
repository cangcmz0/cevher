# Cevher Madenci — Arayüz Sistemi

**Geliştirici:** İbrahim Can Göçmez

Son güncelleme: 2026-11-16 · Tokenların kaynağı: [DESIGN.md](DESIGN.md) · Ekran taslakları:
[screens/index.html](screens/index.html)

Bu belge arayüzü yazan herkesin (kod, test) okuduğu işletim belgesidir. Token değerleri DESIGN.md'den gelir; ikisi
çelişirse DESIGN.md kazanır.

## Tasarım niyeti: "Altın Ocak"

| İlke | Anlamı |
|---|---|
| Fener ışığında maden | Sıcak koyu kahve zemin, ortası amber ışıkla açılır |
| Elle tutulur | Ahşap kalas paneller, pirinç çerçeve ve çiviler, kabarık düğmeler |
| Tek ana eylem | Her ekranda bir amber-altın düğme; gerisi ikincil ya da yeşil |
| Okunurluk önce | Metin kontrastı en az 4.5:1, en küçük yazı 11 px, dokunma hedefi 44 px |
| Amber üstünde koyu yazı | Ana düğme yazısı her zaman koyu kahve (`on-accent`), beyaz değil |
| Küçük dozda çini | Turkuaz yalnız bölge ve harita vurgusunda |

## Tokenlar

```css
:root {
  /* Renkler */
  --color-background: #1C0F07;
  --color-background-deep: #0F0804;
  --color-surface-dark: #4E2E16;
  --color-wood: #7A4A28;
  --color-frame: #E0AE4E;
  --color-surface: #F7E7C6;
  --color-surface-sunken: #EBD3A6;
  --color-border: #C8902F;
  --color-text-primary: #3A2410;
  --color-text-secondary: #6B4A28;
  --color-text-on-dark: #FFF4DE;
  --color-text-on-dark-soft: #E8D2B0;
  --color-accent: #FFB12E;
  --color-accent-light: #FFE58A;
  --color-accent-dark: #E8781C;
  --color-on-accent: #4A2206;
  --color-gold: #FFD24A;
  --color-success: #3FC25A;
  --color-on-success: #0E3A18;
  --color-success-text: #13703A;
  --color-success-bright: #3FD06A;
  --color-bar-track: #1C0F07;
  --color-info: #56B4F0;
  --color-on-info: #0A1F3A;
  --color-tile: #3FD0C8;
  --color-danger: #FF8A6B;
  --color-danger-text: #8E3B2E;
  --color-danger-surface: #4A1A10;
  --color-disabled: #A8927A;
  --color-on-disabled: #2A1A0E;
  --color-rarity-common: #B8C2C8;
  --color-rarity-rare: #7FC0F5;

  /* Yazı aileleri */
  --font-display: 'Baloo 2', 'Trebuchet MS', system-ui, sans-serif;
  --font-body: 'Rubik', 'Segoe UI', Roboto, system-ui, sans-serif;

  /* Boşluk */
  --space-xxs: 2px;
  --space-xs: 4px;
  --space-sm: 6px;
  --space-md: 8px;
  --space-lg: 12px;
  --space-xl: 16px;
  --space-xxl: 24px;

  /* Köşe */
  --radius-badge: 6px;
  --radius-button: 12px;
  --radius-card: 12px;
  --radius-strip: 14px;
  --radius-sheet: 18px;
  --radius-full: 999px;

  /* Doku ve gölge */
  --wood-planks: repeating-linear-gradient(180deg, #8A5530 0 13px, #7A4A28 13px 14px, #93603A 14px 27px, #6E4223 27px 28px);
  --shadow-panel-wood: inset 0 2px 0 rgba(255, 236, 190, .35), inset 0 -3px 0 rgba(0, 0, 0, .35), 0 6px 14px rgba(0, 0, 0, .6);
  --shadow-card: inset 0 2px 0 #FFFBEA, 0 4px 10px rgba(0, 0, 0, .5);
  --shadow-button: 0 4px 0 #8A3F0E, 0 6px 12px rgba(0, 0, 0, .5), inset 0 2px 0 rgba(255, 255, 255, .6);
  --shadow-panel: 0 10px 28px rgba(0, 0, 0, .5);
  --glow-amber: 0 0 14px rgba(255, 177, 46, .6);
}
```

### Oyun kodundaki karşılıklar (`css/temel.css`)

Oyunun CSS'i kısa Türkçe adlar kullanır. Uygularken değişkenler bu tabloya göre DESIGN.md değerlerine çekilir; yeni
olanlar eklenir:

| Token | `css/temel.css` | Değer |
|---|---|---|
| `--color-background` | `--arka` | #1C0F07 |
| `--color-background-deep` | `--arka-900` | #0F0804 |
| `--color-surface-dark` | `--arka-700` | #4E2E16 |
| `--color-wood` | `--tahta` (yeni) | #7A4A28 |
| `--color-frame` | `--cerceve` | #E0AE4E |
| `--color-surface` | `--panel` | #F7E7C6 |
| `--color-surface-sunken` | `--panel-koyu` | #EBD3A6 |
| `--color-border` | `--panel-kenar` | #C8902F |
| `--color-text-primary` / `-secondary` | `--metin` / `--metin-soluk` | #3A2410 / #6B4A28 |
| `--color-text-on-dark` / `-soft` | `--acik` / `--acik-soluk` | #FFF4DE / #E8D2B0 |
| `--color-accent` | `--yukselt` | #FFB12E |
| `--color-accent-light` | `--yukselt-acik` | #FFE58A |
| `--color-accent-dark` | `--yukselt-koyu` | #E8781C |
| `--color-on-accent` | `--yukselt-yazi` (yeni) | #4A2206 |
| `--color-gold` | `--para` | #FFD24A |
| `--color-success` | `--basari` | #3FC25A |
| `--color-on-success` | `--basari-yazi` (yeni) | #0E3A18 |
| `--color-success-text` | `--basari-kenar` | #13703A |
| `--color-info` | `--bilgi` | #56B4F0 |
| `--color-on-info` | `--bilgi-yazi` (yeni) | #0A1F3A |
| `--color-tile` | `--cini` | #3FD0C8 |
| `--color-danger` | `--uyari` | #FF8A6B |
| `--color-danger-text` | `--uyari-kenar` | #8E3B2E |
| `--color-danger-surface` | `--uyari-zemin` | #4A1A10 |
| `--color-disabled` | `--pasif` | #A8927A |

## Yazı ölçeği

| Öğe | Token | Aile | Boyut / satır | Kalınlık |
|---|---|---|---|---|
| Pencere ödül tutarı | `hero` | display | 30 / 34 | 800 |
| Bölge adı, sayfa başlığı | `title` | display | 21 / 25 | 800 |
| Kat kartı başlığı, yönetici adı | `card-title` | display | 17 / 20 | 800 |
| Düğme yazısı | `button` | display | 17 / 20 | 800 |
| Hap ve istatistik değeri | `value` | display | 16 / 18 | 800 |
| Açıklama | `body` | body | 13 / 17 | 500 |
| Kart alt satırı, seviye, hız | `meta` | body | 12 / 15 | 600 |
| Sekme, rozet, bildirim | `label` | body | 11 / 13 | 600 |

Koyu ve ahşap yüzeydeki başlıklar `text-shadow: 0 2px 0 #3A2410` ile kabartılır. Sayılar `tabular-nums`.

## Bileşen kalıpları

### Düğmeler

```
╭──────────────────────────────╮   .dg .dg-ana      accent-light → accent → accent-dark, 3 px krem kenar,
│   Yükselt · 12,4 bin  (◉)    │                    koyu kahve yazı (on-accent), 4 px kabartma
╰══════════════════════════════╯   .dg .dg-basari   yeşil degrade, on-success yazı, ▶ reklamlıysa
                                   .dg .dg-elmas    info degrade, on-info yazı, elmas simgesi
                                   .dg .dg-ikincil  surface → surface-sunken, 2 px border
                                   .dg[disabled]    disabled zemin, on-disabled yazı, kabartma yok
```

Basınca `translateY(4px)`, alt kabartma kaybolur. Uzun basma tekrar alım yapar (yükseltme).

### Ahşap panel (kat kartı, üst bilgi çubuğu, alt şerit)

```
◉─ ahşap kalas (wood-planks), 3 px pirinç çerçeve ─────◉
│  3. Kat                                      ╭────╮   │  sağ kenara taşan 46 px yuvarlak amber düğme
│  Seviye 25 · 1,2 bin/sn (gold)               │ ⬆  │   │  çubuk: success-bright / bar-track
│  ▓▓▓▓▓▓▓░░░                                  ╰────╯   │
◉───────────────────────────────────────────────────────◉   ◉ = pirinç çivi (8 px, köşelerde)
```

### Krem kart (card-cream)

`surface` parşömen, 2 px `border`, `radius-card`, `shadow-card`, iç boşluk `lg`. Başlık `card-title`, alt satır `meta`
`text-secondary`.

### Panel (sheet) ve pencere

- Panel: `surface`, üst köşeler `radius-sheet`, tutamak 40×4 `border`, ekranın en fazla %78'i, 280 ms kayarak açılır.
- Pencere: ortada, 320 px (en fazla ekran − 40), `radius-sheet`, 3 px `frame` çerçeve, `shadow-panel`; başlık bandı
  ahşap kalas olabilir.
- Perde: `background-deep` %65.

### Segment kontrol (input-segmented)

Hap, 34 px, `surface-sunken` zemin, `border` kenar; seçili parça amber degrade + `on-accent`.

### Alt gezinti (nav-tab)

5 sekme: Maden, Harita, Yöneticiler, Araştırma, Mağaza. Taban `background-deep → koyu kahve` degrade, üstte 3 px
`border` çizgi. Sekme: `surface-dark` koyu ahşap, 2 px kahve kenar, ikon 24 px + `label` `text-on-dark-soft`.
Seçili: amber degrade, `on-accent` ikon ve yazı, `glow-amber`. Bildirim için sağ üstte 8 px `danger` nokta.

### Bölge kartı (region-chip)

`surface-dark` %92, `radius-card`, 52 px. Durumlar: açık (`tile` kenar + ✓), burada (`tile` halka, `Buradasın`),
açılabilir (`gold` parıltı + `Aç`), kilitli (gri kilit + koşul).

### Hap (para, elmas)

30 px, koyu kahve degrade (`#2A170B → #3D2412`), 2 px `border`, iç gölge; değer `value` `#FFE8A8`.

## Arayüz metni

- Türkçe, kısa, sıcak; oyuncuya "sen" diye hitap (`Sen yokken madencilerin çalıştı!`).
- Sayılar kısaltılmış Türkçe biçim (`12,4 bin`, `3,1 mn`); süreler `1 sa 12 dk`.
- Düğme yazısı eylem + bedel: `Yükselt · 12,4 bin`, `Elmasla Tut · 50`.
- Reklamlı eylemde ▶ ve kalan hak. Önizlemede ödeme alınmadığını açıkça yaz.
- Hata ve uyarı bildirimle; engelleyici pencere yok.

## Ekran dizini

| Ekran | Spec | Yer |
|---|---|---|
| Maden Ana Ekranı | [screens/maden-ana.md](screens/maden-ana.md) | `#maden` |
| Yükseltme Paneli | [screens/yukseltme.md](screens/yukseltme.md) | panel `yukseltme` |
| Çevrimdışı Kazanç | [screens/cevrimdisi.md](screens/cevrimdisi.md) | pencere `cevrimdisi` |
| Yönetici Penceresi | [screens/yonetici.md](screens/yonetici.md) | pencere `yonetici` |
| Harita | [screens/harita.md](screens/harita.md) | sekme `harita` |
| Yöneticiler | [screens/yoneticiler.md](screens/yoneticiler.md) | sekme `yoneticiler` |
| Mağaza | [screens/magaza.md](screens/magaza.md) | sekme `magaza` |
| Araştırma | [screens/arastirma.md](screens/arastirma.md) | sekme `arastirma` |
