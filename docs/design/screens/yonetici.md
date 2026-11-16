# Yönetici Penceresi

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Pencere (`yonetici`), bir istasyonun yönetici rozetinden ya da kartından açılır
**Phase:** 1
**Purpose:** Bir istasyonun yöneticisini görmek, yeteneğini kullanmak, değiştirmek ya da yeni yönetici tutmak.

## Layout

```
┌ pencere 320 ─────────────────────────────────┐
│ 3. Kat · Yönetici                     [× 44] │
│ ┌ (portre 72, nadirlik halkası) Hasan Usta ┐ │
│ │  [Efsanevi]  Kazı Hızı ×5 · 5 dk  [Hazır] │ │
│ └───────────────────────────────────────────┘ │
│ [ Yeteneği Kullan ] [ Görevden Al ]            │
│ Boştaki yöneticiler                            │
│ (44) Ayşe Usta · Nadir · …            [Ata]    │
│ (44) Rıza Usta · Sıradan · …          [Ata]    │
│ [ Yeni Yönetici Tut · 150 bin (para) ]         │
│ [ (elmas) Elmasla Tut · 50 ]                   │
└────────────────────────────────────────────────┘
```

## Components

- Portre: nadirlik halkası Sıradan `disabled`, Nadir `info`, Efsanevi `gold` (+ parıltı).
- Rozetler: nadirlik (`gold` zemin, `text-primary`), durum (`success` zemin, beyaz).
- button-success (yetenek), button-secondary (Görevden Al, Ata), button-primary (Tut), button-gem (Elmasla Tut).

## States

| State | Behavior |
|-------|----------|
| Empty | Yönetici yoksa mevcut blok yerine `Bu istasyonda yönetici yok.` ve boştakiler listesi |
| Loading | Yok |
| Error | Oda doluysa Tut düğmesi `disabled`: `Yönetici odası dolu (20/20)` |
| Success | Tutunca kart döner (500 ms), nadirlik parıltısı, `Hasan Usta katıldı!` |
| Yetenek aktif | Durum rozeti `Aktif · 1:42`, yetenek düğmesi gizli |
| Bekleme | Durum rozeti `Bekleme · 7:10` (`surface-sunken` zemin), yetenek düğmesi gizli |

## Copy rules

- Başlık `{istasyon} · Yönetici`; yetenek `{etki} ×{çarpan} · {süre}`.
- Nadirlik adları: Sıradan, Nadir, Efsanevi.

## Acceptance bullets

- Ekranda tek `color-accent` düğme var: `Yeni Yönetici Tut`; Ata düğmeleri ikincil.
- Nadirlik yalnız renkle değil, yazıyla da belirtiliyor (Sıradan / Nadir / Efsanevi).
- Bütün düğmeler en az 44 px yüksek.
- Pencere 844 px yüksek ekrana kaydırmasız sığıyor (iki boştaki yöneticiyle).

**Preview:** [yonetici.html](yonetici.html)
