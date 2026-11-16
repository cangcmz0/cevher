# Yükseltme Paneli

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Alttan açılan panel (`yukseltme`), maden görünümünün üstünde
**Phase:** 1
**Purpose:** Bir istasyonun seviyesini artırmanın bedelini ve kazancını gösterip tek dokunuşla yükseltmek.

## Layout

```
perde (background-deep %60)
┌ panel (surface, üst köşe 18) ───────────────────────┐
│            ── tutamak ──                             │
│ [ikon 44] 3. Kat                          [× 44]     │
│           Seviye 25 → 35 (yeşil)                     │
│ ( x1 | x10 | x50 | Maks )  segment                   │
│ Üretim            150/sn → 235/sn                    │
│ Madenci           2 → 2                              │
│ Yığın kapasitesi  8,4 bin → 13,1 bin                 │
│ ┌ Sonraki kademe: 50 · Üretim ×2 · +1 madenci ┐      │
│ └ ▓▓▓▓▓░░░░░ ─────────────────────────────────┘      │
│ [      Yükselt · 12,4 bin  (para)      ]  button     │
│  Basılı tutarak art arda yükseltebilirsin.           │
└──────────────────────────────────────────────────────┘
```

## Components

- sheet, input-segmented, button-primary / button-disabled, ilerleme çubuğu (`success-bright` / `bar-track`).
- Satırlar: etiket `text-secondary`, değer `button` ailesinde 15 px, artış `success`.

## States

| State | Behavior |
|-------|----------|
| Empty | — (panel her zaman bir istasyon için açılır) |
| Loading | Yok; değerler anında hesaplanır |
| Error | Satın alma başarısızsa panel açık kalır, bildirim gösterilir |
| Success | Seviye satırı ve değerler yeni değerlere geçer, düğme kısa bir parıltı yapar; panel açık kalır |
| Para yetmiyor | Düğme `disabled`: `Yetersiz para · 12,4 bin` |
| Maks seviye | Düğme `disabled`: `MAKS SEVİYE`; segment gizlenir |
| Asansör / Depo | Satırlar: Kapasite, Hız (`1,2 kat/sn`), Tur süresi / Taşıyıcı, Taşıyıcı yükü, Depo kapasitesi |

## Copy rules

- Başlık istasyon adı (`3. Kat`, `Asansör`, `Depo`); alt satır `Seviye A → B`.
- Düğme `Yükselt · {bedel}`; kademe şeridi `Sonraki kademe: {L} · {ödül}`.

## Acceptance bullets

- Panel ekranın en fazla %78'i; arkada perde görünür, perdeye dokunmak paneli kapatır.
- Segmentte yalnız bir parça seçili ve `color-accent` zeminde.
- Artış değerleri `color-success` ile ve krem üzerinde en az 4.5:1.
- Para yetmediğinde düğme `color-disabled` zemine ve `Yetersiz para` metnine döner.
- Kapat düğmesi 44×44 px ve `aria-label="Kapat"` taşır.

**Preview:** [yukseltme.html](yukseltme.html)
