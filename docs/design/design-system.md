# Cevher Madenci — Arayüz Sistemi

**Geliştirici:** İbrahim Can Göçmez

Son güncelleme: 2026-11-16 · Tokenların kaynağı: [DESIGN.md](DESIGN.md) · Ekran taslakları:
[screens/index.html](screens/index.html)

Bu belge arayüzü yazan herkesin (kod, test) okuduğu işletim belgesidir. Token değerleri DESIGN.md'den gelir; ikisi
çelişirse DESIGN.md kazanır.

## Tasarım niyeti: "Fener ve Çini"

| İlke | Anlamı |
|---|---|
| Ocak başı sıcaklığı | Gece laciverti zemin, sıcak fener ışığı, krem kartlar |
| Tek ana eylem | Her ekranda bir turuncu düğme; gerisi ikincil |
| Okunurluk önce | Metin kontrastı en az 4.5:1, en küçük yazı 11 px, dokunma hedefi 44 px |
| Anadolu imzası | Bölge, harita ve hikâyede çini turkuazı ve gerçek coğrafya |
| Ödülü kutla | Altın ışın, konfeti, para uçuşu; kısa ve kendiliğinden kapanan |
| Cırtlak olmasın | Büyük yüzeyler 2–3 duraklı degrade, neon yok |

## Tokenlar

```css
:root {
  /* Renkler */
  --color-background: #062B42;
  --color-background-deep: #031A2B;
  --color-surface-dark: #0B3A55;
  --color-frame: #2B6585;
  --color-surface: #F4E8D6;
  --color-surface-sunken: #E9D7BC;
  --color-border: #B8996F;
  --color-text-primary: #2B1D12;
  --color-text-secondary: #6B5640;
  --color-text-on-dark: #FFFFFF;
  --color-text-on-dark-soft: #B7CEDB;
  --color-accent: #B9501C;
  --color-accent-light: #E67E3E;
  --color-on-accent: #FFFFFF;
  --color-gold: #F6C453;
  --color-success: #13703A;
  --color-success-bright: #2ECC71;
  --color-bar-track: #3A2A1E;
  --color-info: #2F6DB8;
  --color-tile: #3FBDB6;
  --color-danger: #FF7A63;
  --color-danger-surface: #4A1F1A;
  --color-disabled: #A8968A;
  --color-rarity-common: #B8C2C8;
  --color-rarity-rare: #6FA8EC;

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
  --radius-button: 9px;
  --radius-card: 12px;
  --radius-strip: 14px;
  --radius-sheet: 18px;
  --radius-full: 999px;

  /* Gölge */
  --shadow-card: 0 2px 0 rgba(120, 80, 40, .28), 0 6px 14px rgba(0, 0, 0, .30);
  --shadow-button: inset 0 1px 0 rgba(255, 255, 255, .35), inset 0 -3px 0 rgba(0, 0, 0, .16), 0 2px 0 rgba(0, 0, 0, .35);
  --shadow-panel: 0 10px 28px rgba(0, 0, 0, .40);
}
```

### Oyun kodundaki karşılıklar (`css/temel.css`)

Oyunun CSS'i kısa Türkçe adlar kullanır. Uygularken bu tablodaki değişkenler DESIGN.md değerlerine çekilir:

| Token | `css/temel.css` | Değişiklik |
|---|---|---|
| `--color-background` | `--arka` | aynı (#062B42) |
| `--color-background-deep` | `--arka-900` | aynı |
| `--color-surface-dark` | `--arka-700` | aynı |
| `--color-frame` | `--cerceve` | aynı |
| `--color-surface` | `--panel` | aynı |
| `--color-surface-sunken` | `--panel-koyu` | aynı |
| `--color-border` | `--panel-kenar` | aynı |
| `--color-text-primary` / `-secondary` | `--metin` / `--metin-soluk` | aynı |
| `--color-accent` | `--yukselt-koyu` | **#CC5F27 → #B9501C** (beyaz yazı kontrastı) |
| `--color-accent-light` | `--yukselt` | aynı (#E67E3E), artık yalnız degrade üstü |
| `--color-gold` | `--para` | aynı |
| `--color-success` | `--basari-kenar` | aynı (#13703A), düğme zemini olur |
| `--color-success-bright` | `--basari` | aynı, yalnız çubuk dolgusu |
| `--color-info` | `--bilgi-koyu` | aynı |
| `--color-tile` | — | **yeni** (çini turkuazı) |
| `--color-danger` | `--uyari` | **#E25A43 → #FF7A63** (koyu zeminde okunurluk) |
| `--color-text-on-dark-soft` | `--acik-soluk` | **rgba beyaz .72 → #B7CEDB** |

## Yazı ölçeği

| Öğe | Token | Aile | Boyut / satır | Kalınlık |
|---|---|---|---|---|
| Pencere ödül tutarı | `hero` | display | 30 / 34 | 800 |
| Bölge adı, sayfa başlığı | `title` | display | 20 / 24 | 800 |
| Kat kartı başlığı, yönetici adı | `card-title` | display | 16 / 19 | 800 |
| Düğme yazısı | `button` | display | 16 / 19 | 800 |
| Para ve istatistik değeri | `value` | display | 16 / 18 | 700 |
| Açıklama | `body` | body | 13 / 17 | 500 |
| Kart alt satırı, seviye, hız | `meta` | body | 12 / 15 | 600 |
| Sekme, rozet, bildirim | `label` | body | 11 / 13 | 600 |

Sayılar `font-variant-numeric: tabular-nums`. Google Fonts: `Baloo+2:wght@600;700;800` ve
`Rubik:wght@400;500;600;700`, `display=swap`.

## Bileşen kalıpları

### Düğmeler

```
┌──────────────────────────────┐   .dg .dg-ana      accent-light → accent degrade, beyaz, 48 px
│   Yükselt · 12,4 bin  (◉)    │   .dg .dg-basari   success, ▶ simgesi reklamlıysa
└──────────────────────────────┘   .dg .dg-elmas    info, elmas simgesi
                                   .dg .dg-ikincil  surface-sunken + 1 px border
                                   .dg[disabled]    disabled zemin, text-primary yazı
```

Basınca `translateY(2px)`, gölge 2 px kısalır. Uzun basma tekrar alım yapar (yükseltme).

### Kat kartı (card-station)

```
┌─ pano (surface-dark, 2 px frame) ─────────────┐
│ (portre) 3. Kat                     ┌──────┐  │
│          Seviye 25 · 1,2 bin/sn     │  ⬆   │  │  sağda 52 px yuvarlak accent düğme
│          ▓▓▓▓▓▓▓░░░ kademe 25 → 50  └──────┘  │  çubuk: success-bright / bar-track
└────────────────────────────────────────────────┘
```

### Krem kart (card-cream)

`surface`, 1 px `border`, `radius-card`, `shadow-card`, iç boşluk `lg`. Başlık `card-title`, alt satır `meta`
`text-secondary`.

### Panel (sheet) ve pencere

- Panel: `surface`, üst köşeler `radius-sheet`, tutamak 40×4 `border`, ekranın en fazla %78'i, 280 ms kayarak açılır.
- Pencere: ortada, 320 px (en fazla ekran − 40), `radius-sheet`, `shadow-panel`, %92 → %100 ölçek, 220 ms.
- Perde: `background-deep` %60.

### Segment kontrol (input-segmented)

Hap şekli, 34 px; seçili parça `accent` + beyaz; diğerleri `text-primary` `surface-sunken` üstünde.

### Alt gezinti (nav-tab)

5 sekme: Maden, Harita, Yöneticiler, Araştırma, Mağaza. `background-deep` zemin, ikon 24 px + `label`.
Seçili: beyaz, üstte 3 px `accent-light` çizgi. Bildirim varsa sağ üstte 8 px `danger` nokta.

### Bölge kartı (region-chip)

`surface-dark` %90 cam, `radius-card`, 52 px. Durumlar: açık (`tile` kenar + ✓), burada (`tile` halka, `Buradasın`),
açılabilir (`gold` parıltı + `Aç`), kilitli (gri kilit + koşul).

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
