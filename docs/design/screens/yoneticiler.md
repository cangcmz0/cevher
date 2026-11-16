# Yöneticiler

**Geliştirici:** İbrahim Can Göçmez

**Route/shell:** Sekme `yoneticiler` (sayfa)
**Phase:** 2
**Purpose:** Bölgedeki bütün yöneticileri türe göre listelemek, atamak ve yenisini tutmak.

## Layout

```
Üst bilgi çubuğu: Yöneticiler · Ereğli · 7/20 yönetici · elmas
( Katlar | Asansör | Depo )  segment
ipucu metni
┌ krem kart: (portre 56) Hasan Usta · ● Efsanevi · yetenek · 3. Kat  [Değiştir] ┐
┌ krem kart: Ayşe Usta … 1. Kat                                       [Değiştir] ┐
┌ krem kart: Rıza Usta … Boşta                                        [Ata]      ┐
…
yapışkan alt çubuk: [ Yönetici Tut · 150 bin ] [ (elmas) Elmasla · 50 ]
Alt gezinti (Yöneticiler seçili)
```

## Components

- input-segmented, card-cream (84 px), portre + nadirlik halkası ve nokta, button-secondary, button-primary, button-gem.

## States

| State | Behavior |
|-------|----------|
| Empty | `Henüz yöneticin yok. Bir istasyon seç ve yönetici tut.` + Tut düğmeleri |
| Loading | Yok |
| Error | Oda doluysa Tut düğmesi `disabled`: `Yönetici odası dolu (20/20)` |
| Success | Yeni yönetici listenin başına eklenir, kart kısa parlar |
| Atanmış | Alt satır istasyon adı, düğme `Değiştir` |
| Boşta | Alt satır `Boşta` (`text-secondary`), düğme `Ata` → istasyon seçme paneli |

## Copy rules

- Nadirlik krem üzerinde renkli nokta + yazı (renk tek başına taşımaz).
- Sayaç `{n}/20 yönetici`.

## Acceptance bullets

- Liste kaydırılırken alt çubuk ve gezinti sabit kalır.
- Krem kartlardaki bütün metinler `text-primary` / `text-secondary` ile en az 4.5:1.
- Sayfada tek `color-accent` düğme: `Yönetici Tut`.
- Segmentte seçili parça `color-accent`, `aria-selected="true"`.

**Preview:** [yoneticiler.html](yoneticiler.html)
