# Harita

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Sekme `harita` (sayfa, üst bilgi çubuğunun altından gezintiye kadar)
**Phase:** 2
**Purpose:** Üç bölge haritasında madenleri, açılış sırasını ve oyuncunun nerede olduğunu göstermek; bölgeler arası geçiş.

## Layout

```
Üst bilgi çubuğu: Harita · 3 bölge haritası · para
[‹ 44]   Karadeniz · Kıyı ocakları · 1/3   [› 44]
┌ harita 360×440 (boyalı) ────────────────────┐
│   deniz          [✓ Zonguldak · 12/12]      │
│ [Ereğli · Buradasın]  ⋯ altın noktalı yol   │
│        [Karabük · açılabilir  (Aç)]         │
│                     [🔒 Kastamonu · koşul]  │
└─────────────────────────────────────────────┘
┌ pano: Ereğli · Demir   [Buradasın] ┐
│ Görevler 4/12 · Biriken 3,4 mn      │
│ ▓▓▓░░░░░  [ Bölge görevleri ]       │
└─────────────────────────────────────┘
Alt gezinti (Harita seçili)
```

## Components

- region-chip (dört durum), harita oklar (44 px yuvarlak), pano alt kart, button-primary `Aç`, button-secondary.
- Harita resmi `img/yeni/harita-{karadeniz|bati|dogu}.png` (yoksa kodla çizim); düğüm konumları `js/sahne/harita.js` DUGUM.

## States

| State | Behavior |
|-------|----------|
| Empty | İlk haritada yalnız Zonguldak açık (Buradasın), diğerleri kilitli ya da açılabilir |
| Loading | Harita resmi yüklenene kadar kodla çizilmiş harita |
| Error | Bölge açmaya para yetmezse `Aç` düğmesi `disabled` ve bedel gösterilir |
| Success | Bölge açılınca kutlama kartı (Faz 3) ve bölge `Buradasın` olur |
| Açık | `tile` kenar + ✓ işareti, `{cevher} · {açık kat}/12` |
| Buradasın | `tile` kenar + dış halka, `Buradasın` `tile` renkte |
| Açılabilir | `gold` kenar ve parıltı, `Aç` düğmesi |
| Kilitli | gri kenar, kilit simgesi, koşul metni |

## Copy rules

- Harita başlığı bölge grubu (`Karadeniz`, `Batı Anadolu`, `İç ve Doğu Anadolu`) + `n/3`.
- Kilit koşulu kısa: `Karabük'ü aç`.

## Acceptance bullets

- Dört bölge kartı da 360×440 haritanın içinde kalıyor ve birbirine binmiyor.
- Bölge durumları renk dışında simge ya da metinle de ayrılıyor (✓, Buradasın, Aç, kilit).
- Oklar ve `Aç` düğmesi en az 44 px; haritalar arası geçiş okla yapılıyor.
- Alt kart gezintiyle çakışmıyor.

**Preview:** [harita.html](harita.html)
