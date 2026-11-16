# Araştırma

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Sekme `arastirma` (sayfa)
**Phase:** 2
**Purpose:** Süren araştırmayı izlemek, hızlandırmak ve dört daldaki araştırma ağacında sıradakini başlatmak.

## Layout

```
Üst bilgi çubuğu: Araştırma · elmas
┌ pano: Usta Madenciler · Sv. 3          1 sa 12 dk ┐
│ ▓▓▓▓░░░░░░                                        │
│ [ ▶ −15 dk ]  [ (elmas) Bitir · 15 ]              │
└───────────────────────────────────────────────────┘
Madencilik (bölüm)
(56) Keskin Kazmalar · Üretim +%10 / seviye · ▬▬▬▬▬ MAKS
 │
(56) Damar Haritası · Kat açma −%8 / seviye · ▬▭▭ 1/3   [Başlat]
 │
(56) Usta Madenciler · Sürüyor · 1 sa 12 dk · ▬▬▭▭ 2/4
 │
(56, kilit) Elmas Matkap · Usta Madenciler Sv. 2 ve Karabük gerekli
Taşıma (bölüm) …
Alt gezinti (Araştırma seçili)
```

## Components

- Pano (süren araştırma), düğüm satırı (56 px daire + ad + etki + seviye pip'leri), bağlantı çizgisi `frame`.
- button-success (reklamla −15 dk), button-gem (`Bitir · {elmas}`), button-primary (`Başlat`, ilk uygun düğüm), button-secondary (diğer uygun düğümler).

## States

| State | Behavior |
|-------|----------|
| Empty | Süren araştırma yoksa pano yerine `Laboratuvar boş · bir araştırma seç` |
| Loading | Yok |
| Error | Laboratuvar meşgulken başlatma: bildirim `Laboratuvar meşgul` |
| Success | Biten araştırmada pip dolar, daire kenarı kısa parlar |
| Maks | `gold` kenar, `MAKS` etiketi, düğme yok |
| Sürüyor | `success-bright` kenar, `Sürüyor · süre` |
| Kilitli | Soluk satır, kilit simgesi, koşul metni |

## Copy rules

- Etkiler oyundaki değerlerle (`js/arayuz/arastirma.js`): `Üretim +%10`, `Kat açma −%8`, `Asansör kapasitesi +%15` …
- Hızlandırma bedeli kalan süreye göre (5 dakikada 1 elmas, en az 1).

## Acceptance bullets

- Seviye pip'leri dolu `success-bright`, boş `bar-track`; maks durumunda `MAKS` yazısı.
- Kilitli düğüm koşulu metinle yazıyor.
- Sayfada en fazla bir `color-accent` düğme var (ilk uygun düğüm).
- Süren araştırma panosu sayfanın en üstünde ve düğmeleri en az 44 px.

**Preview:** [arastirma.html](arastirma.html)
