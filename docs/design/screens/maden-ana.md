# Maden Ana Ekranı

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** `#maden`, varsayılan görünüm (telefon, 390×844)
**Phase:** 1
**Purpose:** Oyuncunun zamanının çoğunu geçirdiği, katları, akışı ve ana eylemleri tek bakışta gösteren maden görünümü.

## Layout

```
┌ Üst bilgi çubuğu (74) ─ avatar · bölge adı + cevher · para hapı · elmas hapı · ayar ┐
├ İstatistik şeridi (pano, 58) ─ Üretim │ Asansör/Depo (darboğaz kırmızı) │ Gelir ─────┤
├ Yüzey (118) ─ satış dükkânı · kamyon · silo · kuyu kulesi ─────────────────────────┤
├ Kat satırı (108) × n ─ [kat kartı %0–28] [tünel odası %28–79] [kuyu %79–100] ──────┤
├ Kilitli kat ─ kesik çerçeve + "Kaz · bedel" ───────────────────────────────────────┤
├ Alt şerit (pano, 64, yüzer) ─ görev çubuğu · Kazanç x2 ────────────────────────────┤
└ Alt gezinti (66) ─ Maden · Harita · Yöneticiler · Araştırma · Mağaza ───────────────┘
```

## Components

- Üst bilgi çubuğu: avatar, `title`, para ve elmas hapları (`value`), ayar düğmesi (44 px).
- İstatistik şeridi: pano; üç sütun, etiket `label` + değer `value`. Darboğaz istasyonu `danger` etiket.
- card-station (kat kartı): başlık `card-title`, `Seviye`, hız `gold`, kademe çubuğu, sağda 40 px yuvarlak `accent` yükseltme düğmesi.
- Sahne katmanı (canvas): yüzey, oda, fenerler, kuyu, kabin. Görsel kuralları `docs/GORSEL_PROMPTLARI.md`.
- Kilitli kat: kesik çerçeve, `button-primary` "Kaz · bedel".
- Alt şerit: pano, `gold` kenar; görev etiketi + çubuk; `button-success` "Kazanç x2" (▶).
- nav-tab: 5 sekme, seçili sekmede üstte `accent-light` çizgi; bildirim için `danger` nokta.

## States

| State | Behavior |
|-------|----------|
| Empty | Yeni oyunda yalnız 1. Kat açık; 2. Kat kilitli "Kaz" kartıyla görünür; öğretici parmak işareti 1. Kat düğmesinde |
| Loading | Açılış ekranı; ana ekran yazı tipleri yüklenene kadar yedek yazı tipiyle çizilir, kayma yok |
| Error | Kayıt okunamazsa bildirim (`danger-surface`), oyun yeni kayıtla sürer; engelleyici pencere yok |
| Success | Yükseltmede kart 1 kez zıplar, kazanılan para HUD'a uçar; kademe geçişinde ışık patlaması |
| Darboğaz | İlgili istasyon kartı hafif titrer, istatistikte etiket `danger`; bildirime dokununca o istasyona kayar |
| Para yetmiyor | Kat kartındaki yükseltme düğmesi `disabled` zemine döner |
| Yönetici var | Kat kartında nadirlik halkalı küçük portre; dokunmak coşku verir (yükseltme panelini açmaz) |

## Copy rules

- Kat adları `1. Kat`, `2. Kat`; seviye `Seviye 25`; hız `640/sn`, büyük sayılar `1,2 bin/sn`.
- Darboğaz etiketi `Asansör ▲ darboğaz` / `Depo ▲ darboğaz`.
- Kilitli kat düğmesi `Kaz · {bedel}`.

## Acceptance bullets

- 360, 390 ve 480 px genişlikte yatay kaydırma yok; kat kartı metni taşmıyor.
- Ekranda tek bir doygun turuncu eylem türü var (yükseltme düğmeleri); diğer düğmeler yeşil ya da ikincil.
- Bütün metinler `text-on-dark` ya da `text-on-dark-soft` ile koyu zeminde en az 4.5:1.
- Yükseltme düğmesi ve gezinti sekmeleri en az 44×44 px dokunma alanına sahip.
- Darboğaz olduğunda istatistik şeridinde ilgili sütun `color-danger` ile işaretli.
- Alt şerit maden görünümünün üstünde yüzer ve gezintiyle çakışmaz (gezintinin 8 px üstü).

**Preview:** [maden-ana.html](maden-ana.html)
