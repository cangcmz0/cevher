# Çevrimdışı Kazanç

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Pencere (`cevrimdisi`), oyuna dönüşte ilk pencere
**Phase:** 1
**Purpose:** Oyuncu yokken biriken kazancı kutlayıp normal ya da reklamla iki kat toplamasını sağlamak.

## Layout

```
perde + arkada dönen altın ışınlar
┌ pencere 320 ───────────────────────────┐
│ Sen yokken madencilerin çalıştı!       │
│        (para 40)  48,2 bin   ← hero    │
│ 2 sa 15 dk boyunca (en fazla 2 saat)   │
│ ┌ 3 yönetici çalıştı · … ┐             │
│ [ Topla ]  [ ▶ Topla x2 ]              │
│ x2 için kısa bir reklam izlersin.      │
└────────────────────────────────────────┘
```

## Components

- Pencere (sheet ailesi), `hero` tutar, button-secondary `Topla`, button-success `Topla x2` (▶).

## States

| State | Behavior |
|-------|----------|
| Empty | Kazanç yoksa (ör. 1 dakikadan kısa) pencere hiç açılmaz |
| Loading | Reklam yüklenirken `Topla x2` düğmesinde küçük dönen gösterge, diğer düğme aktif |
| Error | Reklam yüklenemezse bildirim `Reklam yüklenemedi, sonra tekrar dene`; pencere açık kalır |
| Success | Düğmeden HUD'a 14 para uçar, pencere kapanır |
| Tavan | Süre tavanı aşıldıysa ` (en fazla 2 saat)` eki |
| Reklamsız | `Topla x2` ▶ simgesiz ve reklamsız ödül verir; alt not gizlenir |

## Copy rules

- Başlık sabit: `Sen yokken madencilerin çalıştı!`.
- Süre `2 sa 15 dk boyunca`; yönetici satırı yalnız ilgiliyse.

## Acceptance bullets

- Perdeye dokunmak pencereyi kapatmaz.
- `Topla x2` düğmesi `color-success` zeminde beyaz yazı (en az 4.5:1) ve reklamlıysa ▶ simgesi taşır.
- Tutar `hero` yazı stilinde (Baloo 2, 30 px) ve tabular rakamlarla.
- Reklam hatasında pencere açık kalır ve bildirim görünür.

**Preview:** [cevrimdisi.html](cevrimdisi.html)
