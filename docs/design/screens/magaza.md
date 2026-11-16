# Mağaza

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Sekme `magaza` (sayfa)
**Phase:** 2
**Purpose:** Günlük hediye, teklifler, ödüllü reklam ve elmas paketlerini dürüst ve okunur biçimde sunmak.

## Layout

```
Üst bilgi çubuğu: Mağaza · elmas
Günlük Hediye  (bölüm başlığı, gold)
[1][2][3*][4][5][6][7]  7 kutu; alınanlar soluk, bugün krem + altın kenar
[ Bugünün hediyesini al ]
Özel Teklif
┌ pano, altın kenar, %50 rozeti: Başlangıç Paketi · içerik   [₺59,99] ┐
Bedava Elmas
┌ krem: Kısa bir reklam izle · Bugün 2 hakkın kaldı    [▶ İzle · +5] ┐
Elmas Paketleri
[80 elmas][500 elmas][1.200 elmas]  fiyat düğmeleri
Satın alımları geri yükle
Alt gezinti (Mağaza seçili)
```

## Components

- Günlük kutular (grid 7), pano teklif kartı + `gold` rozet, card-cream, button-success (reklam), button-secondary (fiyatlar), button-primary (hediye al).

## States

| State | Behavior |
|-------|----------|
| Empty | Hediye alındıysa düğme `disabled`: `Yarın tekrar gel` |
| Loading | Fiyatlar mağazadan gelene kadar düğmede `…` |
| Error | Satın alma iptal ya da hata: bildirim, ürün verilmez |
| Success | `✓ Sende` rozeti; elmas HUD'a uçar |
| Reklam hakkı bitti | `İzle` düğmesi `disabled`, metin `Bugünlük hakların bitti` |
| Tarayıcı önizlemesi | Alt not: `Önizleme: ödeme Play Store sürümünde açılır. Burada denersen ürün verilir, ödeme alınmaz.` |

## Copy rules

- Fiyatlar mağazadan gelen yerel biçimde; mockup'taki `[FİYAT]` yer tutucudur.
- Reklamlı düğmede ▶ ve kalan hak her zaman görünür.
- Ücretsiz eylemde bedel yazılmaz.

## Acceptance bullets

- Bugünün hediye kutusu altın kenarla, alınanlar soluk gösteriliyor.
- Teklif kartında indirim rozeti ve içerik listesi ayrı ayrı okunuyor.
- Her fiyat düğmesi en az 44 px yüksek.
- Önizleme sürümünde ödeme alınmadığı açıkça yazıyor.

**Preview:** [magaza.html](magaza.html)
