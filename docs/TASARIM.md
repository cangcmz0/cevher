# Cevher Madenci 2D: Design and Build Specification

Status: frozen for stage 1. Source of truth for every engineer and reviewer.
Reference: `docs/referans.png` (owner-approved mockup). Where this document and the mockup disagree on
look, the mockup wins. Where they disagree on numbers or behaviour, this document wins.

Conventions in this document:
- Player-facing strings appear in `code` quotes and must be used exactly as written, including Turkish characters.
- "px" means CSS pixels. Sizes are given for a 390×844 viewport unless stated otherwise.
- **[S1]** marks stage 1 (core game, built now). **[S2]** marks stage 2 (built later; specified briefly here so stage 1 leaves room for it).
- Identifiers in code are Turkish. Code style: 2-space indent, no semicolons except leading `;[` / `;(` guards, ES modules.

---

## 0. Reference mockup: what was measured

Measured from `referans.png` (phone screen is about 528 px wide in the image, so the scale factor to a 390 px phone is about 0.739):

| Element | Mockup (image px) | At 390 px | This spec |
|---|---|---|---|
| HUD | y 25–130 | 77 | 74 |
| Stats strip | y 140–218 | 58 | 58 |
| Surface strip | y 218–345 | 94 | 128 (room for chips and the headframe) |
| Mine row | about 163 each | 120 | 128 |
| Card width | 173 (33% of width) | 128 | 41% of width, 160 px (legibility; see §4.3) |
| Chamber | 36% | 140 | 127 |
| Elevator shaft | 9.5% | 37 | 38 |
| Right column (DEPO, rock) | 18% | 70 | 13%, 51 px |
| Bottom bar (toast, flow, Topla) | y 1000–1065 | 48 | 46–64 |
| Nav | y 1070–1165 | 70 | 66 |

The card anatomy panel ("280px, 96px, 12px, 16px, 8/16 spacing") cannot be literal on a phone because the mockup's own phone card is about 33% of the width. We keep the 12 px radius, the 8/16 spacing rhythm and the section order (icon, title + arrow, level, rate, bar + %, full-width button), and size the card to fit (§4.3).

Sampled colours used to derive shades: card cream #F6DFBB to #F4DDB2, button orange #F1702B (top) to #D65720 (bottom), bar green #199F46, warning toast background #4A1F1A to #52231D, HUD panel #04181B to #013038, Topla green #1F8E4D.

---

## 1. Vision and scope

**Pitch.** `Kendi madenini kur, kaynaklarını yönet, zirveye ulaş!` A premium, painterly 2D idle mining tycoon set on Turkey's Black Sea mining coast. Ore flows from the mines (Madenler) up the elevator (Asansör) into the depot (Depo), carriers take it to the sale point (Satış), and the money buys upgrades (Yükseltmeler). This loop is the mockup's system flow and the whole game.

**First 30 seconds.** The splash ("Cevher Madenci", loading bar) fades into Zonguldak. Over the sea and the headframe sits one cream card, `Maden 1`, with a glowing orange `Yükselt` button and a tutorial hand. The player taps it, the upgrade sheet slides up, they buy level 2 (about 2 s in), the card pulses and the bar fills. The hand moves to the chamber, a tap makes the miner swing and coal drops into the cart. Then a tap on the elevator brings the coal up, and a tap on the DEPO sends a carrier to the red sale house. `+6` floats up, coins fly to the HUD counter and it rolls up. By about 20 s they can afford the first manager. They hire "Hasan Usta" and Maden 1 starts working by itself.

**First 5 minutes.** `Maden 2` is excavated (about 35 s, with a dust burst and a camera nudge). Managers for the elevator (about 2 min) and the depot (about 3 min) make the chain automatic. The player sees the first bottleneck toast (`Asansör kapasitesi yetersiz!`), taps it, and upgrades the elevator. The first milestone (`Kademe 10`, production ×2, a second miner joins) lands with a level-up burst. Player level 2 to 3 gives elmas. The `Topla x2` button appears at Lv. 2.

**First hour.** Maden 3 to Maden 6 open, levels reach 75–125, milestones every few minutes, manager abilities (`Kazı Hızı ×3`) are fired by tapping portraits. Lv. 8. The player learns the x1/x10/x50/Max buy modes and long-press quick-buy. Closing the app, they expect money to be waiting.

**First day.** Two or three return sessions, each opening with `Sen yokken madencilerin çalıştı!` and `Topla x2`. Maden 7 and Maden 8 open. Lv. 12–15. [S2] Research runs between sessions. Bartın becomes visible on the map as `Kilidi: Lv.20`, a goal for day 2.

**In v1 (stage 1 + stage 2):** one main mine screen, 12 shafts per region, elevator, depot with carriers, sale, upgrades with milestones, managers with rarities and abilities, bottleneck detection, player level and XP, offline earnings with `Topla x2` via rewarded ad, the income boost (`Topla x2` button), save with migration, tutorial [S1]; regions on the map (6), research tree, region quests, daily gift, shop with Play Billing, free elmas ads [S2].

**Explicitly out of v1:** prestige/rebirth, events, PvP/leaderboards, cloud save and accounts, push notifications, day/night cycle, music tracks (SFX only), localisation other than Turkish, interstitial or banner ads (rewarded only, always opt-in), landscape layout, tablets wider than 480 px (letterboxed), daily tasks (only region quests and the daily gift).

---

## 2. Core mechanics

### 2.1 Units and the chain

- Ore is measured in **değer** (value) units. One unit of ore sells for 1 para × `satisCarpani`. All capacities (stash, cabin, carrier, depot) are in value units.
- Soft currency **para** (coin icon) is separate per region. Hard currency **elmas** (blue diamond icon) is global.
- The chain is Madenler → yığın (per-shaft stash) → Asansör → Depo stok → Taşıyıcılar → Satış → para.
- The active region is simulated discretely (§6.4). Inactive regions accrue analytically (§3.4).

### 2.2 Shared level power and milestones (kademe)

```
kademeSayisi(L, liste) = number of m in liste with L >= m
guc(L, liste)          = L * 2^kademeSayisi(L, liste)
KADEME_MADEN    = [10, 25, 50, 75, 100, 125, ..., 400]   (10, 25, then every 25 to 400; 17 entries)
KADEME_ISTASYON = [10, 25, 50, 75, 100, ..., 800]        (10, 25, then every 25 to 800; 33 entries) — elevator and depot
```

Reaching a milestone doubles that station's main stat (built into `guc`). It also gives +25 XP, plays the `esik` sound, a card or station burst, and for shafts adds a visible miner at 10 and 50.

`kademeIlerleme(L, liste)` = (L − önceki) / (sonraki − önceki), where önceki is the previous milestone (or 0) and sonraki is the next one. At max level the value is 1 and the label reads `MAKS`. This is what the card's green bar and `%NN` show.

### 2.3 Regions (separate economies)

| # | kod | Ad | Cevher | Açılış | olcek | zorluk | Stage |
|---|---|---|---|---|---|---|---|
| 0 | `zonguldak` | Zonguldak | Kömür | Lv. 1 | 1 | 1 | S1 |
| 1 | `bartin` | Bartın | Manganez | Lv. 20 | 1e3 | 1.5 | S2 |
| 2 | `kastamonu` | Kastamonu | Bakır | Lv. 35 | 1e6 | 2.25 | S2 |
| 3 | `karabuk` | Karabük | Demir | Lv. 50 | 1e9 | 3.4 | S2 |
| 4 | `gumushane` | Gümüşhane | Gümüş | Lv. 65 | 1e12 | 5.1 | S2 |
| 5 | `artvin` | Artvin | Altın | Lv. 80 | 1e15 | 7.6 | S2 |

`olcek` multiplies every production, capacity, cost and starting value in the region (it only makes the numbers bigger). `zorluk` multiplies costs only. A new region starts with `20 × olcek` para, Maden 1 at level 1, elevator and depot at level 1, and no managers.

### 2.4 Shafts (Maden 1..12, index i = 0..11)

```
madenUretim(i, L)  = 1 * 5^i * guc(L, KADEME_MADEN) * olcek            value/s, base
madenMaliyet(i, L) = 4 * 6^i * 1.10^(L-1) * zorluk * olcek              cost of L -> L+1
madenAcilis(i)     = ACILIS[i] * zorluk * olcek
ACILIS             = [0, 40, 500, 2e4, 1e6, 6e7, 3e9, 1.2e11, 4e12, 1.2e14, 3e15, 6e16]
yiginKap(i, L)     = madenUretim(i, L) * 90                              stash cap = 90 s of base output
madenciSayisi(L)   = 1 + (L >= 10) + (L >= 50)                           visual only (max 3)
MAKS_MADEN_SEVIYE  = 400
KAZI_SURESI        = 3.0 s                                               one manual work cycle
```

Effective rate while working: `madenUretim × uretimCarpani(i)` (§2.9). The shaft is "working" if it has an assigned manager (always, continuously) or a manual cycle is running (`kalan > 0`, set to `KAZI_SURESI` by a tap when idle; a tap while already working does nothing except visual feedback). While working: `yigin += rate × dt`, clamped to `yiginKap`. When `yigin >= yiginKap` the shaft is **dolu** (full): production is lost, the miners sit, and a `DOLU` tag shows in the chamber.

Opening a shaft (`madenAc`): allowed only for the next index (`acikSayisi`), costs `madenAcilis(i)` para, sets level 1, gives +40 × (i+1) XP, and plays a 1.6 s excavation animation. The `Maden N+1` placeholder row then shows the next one.

### 2.5 Elevator (Asansör)

```
asansorKap(L)  = 20 * guc(L, KADEME_ISTASYON) * olcek * (1 + 0.15*ar.halat)       value per trip
asansorHiz(L)  = 1.0 * min(3, 1 + 0.004*(L-1)) * (1 + 0.10*ar.motor)                floors/s
DURAK          = 0.5 s per loading stop;  BOSALTMA = 0.8 s at the top
asansorMaliyet(L) = 5 * 1.05^(L-1) * zorluk * olcek
MAKS = 800
```

Geometry: konum 0 is the unload point at the DEPO. Maden k (1-based) is at konum k, one floor per row.

State machine (`asansor.durum`):
- `bekle`: idle at konum 0. It starts a trip if it has a manager and any stash > 0, or on a manual tap (manual tap = exactly one trip).
- `iniyor`: moves down at speed v. At each opened shaft k, in order 1..n, if `yigin > 0` and `yuk < kap` it stops (`yukluyor`).
- `yukluyor`: lasts `DURAK`. It moves `min(yigin, kap − yuk)` linearly over the stop (visual pile shrinks, cabin fills). After the stop: if `yuk >= kap` or k is the deepest opened shaft, it goes `cikiyor`; otherwise it continues `iniyor`. Shafts with an empty stash are passed without stopping, and the trip still goes down to the deepest opened shaft unless full.
- `cikiyor`: moves up to konum 0.
- `bosaltiyor`: lasts `BOSALTMA`, moving load into the depot linearly, limited by free depot space. If the depot is full, it stays in `bosaltiyor` with the rest of the load (visual: cabin waits, red blink on the hopper) until space frees.
- Then it returns to `bekle`.

Throughput used for bottleneck and offline: `asansorAkis = kap / (2n / v + DURAK*n + BOSALTMA)`, where n is the number of opened shafts.

### 2.6 Depot (Depo), carriers (Taşıyıcılar) and sale (Satış)

```
tasiyiciSayisi(L) = 1 + count([10, 50, 150, 300] <= L)                    max 5
tasiyiciYuk(L)    = 20 * guc(L, KADEME_ISTASYON) * olcek
depoYol(L)        = 2.5 / (min(3, 1 + 0.004*(L-1)) * (1 + 0.10*ar.ray))   s, one way
YUKLEME = 0.6 s;  SATIS = 0.4 s
depoTur(L)        = 2*depoYol(L) + YUKLEME + SATIS
depoKap(L)        = 30 * tasiyiciYuk(L) * tasiyiciSayisi(L) * (1 + 0.25*ar.depo)
depoMaliyet(L)    = 5 * 1.05^(L-1) * zorluk * olcek
depoAkis          = tasiyiciSayisi * tasiyiciYuk / depoTur
MAKS = 800
```

Each carrier cycles `bekle → yukluyor (YUKLEME; takes min(stok, yük) at the start) → gidiyor (depoYol) → satiyor (SATIS; para += yük × satisCarpani; event satis) → donuyor (depoYol) → bekle`. With a manager, idle carriers depart automatically whenever `stok > 0`, at least 0.35 s apart. A manual tap starts every idle carrier once, staggered by 0.35 s; a carrier finding `stok == 0` stays idle.

Depot fill (`Depo Doluluğu`) = `stok / depoKap`.

### 2.7 Managers (Yöneticiler)

- Each station (12 shafts, elevator, depot) has one slot. Managers belong to a region pool (max 20 per region) and to a type: `maden`, `asansor` or `depo`.
- A manager automates its station and has one timed active ability.
- **Hire with para:** `kiralamaMaliyeti(tip, n) = TABAN[tip] * 6^n * zorluk * olcek * (1 − 0.15*ar.ik)`, with TABAN = {maden: 25, asansor: 100, depo: 150} and n = number of that type already hired with para in this region.
- **Hire with elmas:** 50 elmas, no counter.
- Rarity roll with para: Sıradan 70%, Nadir 25%, Efsanevi 5%. With elmas: Nadir 70%, Efsanevi 30%. The ability is 50/50 of the type's two abilities. The RNG is the state's seeded PRNG (`durum.tohum`, mulberry32) so tests are deterministic.
- A new hire auto-assigns to the station it was hired from (the modal), otherwise to the top-most empty station of its type.

| Nadirlik | Renk | Çarpan | İndirim | Süre | Bekleme |
|---|---|---|---|---|---|
| `Sıradan` | #B8C2C8 | ×2 | %40 | 120 s | 600 s |
| `Nadir` | #4A90E2 | ×3 | %60 | 180 s | 600 s |
| `Efsanevi` | #F6C453 | ×5 | %80 | 300 s | 900 s |

Durations × (1 + 0.20 × ar.okul). Cooldowns × (1 − 0.10 × ar.dinlenme). Both [S2] research, 0 in S1.

| Tip | Kod | Ad | Etki |
|---|---|---|---|
| maden | `kazi` | `Kazı Hızı` | that shaft's production × çarpan |
| maden | `pazarlik` | `Pazarlık` | that shaft's upgrade cost × (1 − indirim) |
| asansor | `hizli` | `Hızlı Kabin` | elevator speed × çarpan |
| asansor | `genis` | `Geniş Kabin` | elevator capacity × çarpan |
| depo | `cevik` | `Çevik Taşıyıcı` | carrier speed × çarpan |
| depo | `dolu` | `Dolu Sepet` | carrier load × çarpan |

Ability state: `aktifBitis` and `hazirZaman` in game seconds. The ability is ready when `zaman >= hazirZaman`. Using it sets `aktifBitis = zaman + süre` and `hazirZaman = zaman + süre + bekleme`, gives +5 XP and fires event `yetenek`. Ability timers keep running offline, but abilities give no offline bonus.

Names: `${ad} Usta`, with `ad` drawn from the old game's list (reuse `ISIMLER` from `cevher-3d-kaynak/orijinal/js/ekonomi.js`). The portrait is drawn from a seed.

### 2.8 Bottleneck detection (darboğaz)

Evaluated every 0.5 s of sim time on the active region:

```
P = Σ shafts that are working or managed: madenUretim × uretimCarpani
A = asansorAkis (with active abilities)
D = depoAkis (with active abilities)
asansorSorun = (asansor has manager and A < 0.9*P) or (some managed shaft yigin >= 0.98*yiginKap)
depoSorun    = (depo has manager and D < 0.9*min(P, A)) or (stok >= 0.95*depoKap)
```

A condition must hold for 3 s continuously to raise `darbogaz` and be false for 5 s to clear it. Elevator wins over depot. Values: `null | 'asansor' | 'depo' | 'asansorManuel' | 'depoManuel'`. The manual variants apply when the station has no manager and its input is full (a shaft stash full while the elevator is idle, or depot stock > 0 while every carrier is idle for 4 s).

| darbogaz | Line 1 (600) | Line 2 (500) |
|---|---|---|
| `asansor` | `Asansör kapasitesi yetersiz!` | `Üretim depoya takılıyor.` |
| `depo` | `Depo kapasitesi yetersiz!` | `Satış üretime yetişmiyor.` |
| `asansorManuel` | `Asansör bekliyor!` | `Dokun ya da yönetici tut.` |
| `depoManuel` | `Depo doldu!` | `Dokun ya da yönetici tut.` |

The flow indicator marks the bottleneck icon (§4.6). Tapping the warning toast scrolls to the station and opens its upgrade sheet (manual variants: opens the manager modal).

### 2.9 Multipliers and the three stats

```
uretimCarpani(i)  = (1 + 0.10*ar.kazma) * (ar.matkap ? 1.5 : 1) * yetenekCarpani(i)            // production
satisKalici       = (1 + 0.02*(lv-1)) * (1 + 0.10*ar.pazar) * (ar.ihracat ? 1.5 : 1) * (satin.altinKazma ? 2 : 1)
satisCarpani      = satisKalici * (takviyeAktif ? 2 : 1)
```

`ar.*` values are 0 in S1. Player-level and Altın Kazma bonuses apply at sale only, so they never create bottlenecks.

- **Toplam Üretim** = Σ over opened shafts of `madenUretim × uretimCarpani(i) without abilities × satisKalici` (para/s, permanent). The sub-line `+%N` compares with the value 5 minutes earlier (ring buffer, sample every 30 s, 10 slots). It shows a green up arrow when N ≥ 1, grey `%0` without an arrow when |N| < 1, and a red down arrow with `-%N` when N ≤ −1.
- **Depo Doluluğu** = `stok / depoKap` as `%NN`, with a bar. Bar colour: green < 85%, para gold 85–97%, warning red ≥ 98%.
- **Gelir** = exponential moving average of realised sales (para/s, time constant 10 s) as `+1,2 bin/sn`. It turns gold with a small `x2` tag while the boost is active.
- Card rate (`12,8 bin/sn`) = `madenUretim × uretimCarpani(i) × satisCarpani` (current, including boost and ability).

### 2.10 Upgrades and buy modes

- Buy modes: `x1`, `x10`, `x50`, `Max` (global `alimModu`, persisted).
- Bulk cost is the geometric sum `c1 × (g^k − 1)/(g − 1)`, where g is 1.10 for shafts and 1.05 for the elevator and depot, and c1 is the next level's cost (× Pazarlık discount if active).
- `Max` = the largest k with sum ≤ para (closed form, then decrement while too expensive, clamped to the cap). If k = 0 the mode shows 1 level, disabled.
- x10/x50 are clamped to the cap. If unaffordable, the button is disabled and shows the full price.
- Every purchase fires `yukseltildi {istasyon, eskiL, yeniL, kademeler:[...]}`.

### 2.11 Player level, XP and rewards

```
xpGerek(L) = round(100 * L * 1.03^max(0, L - 12))       XP from L to L+1 (Lv. 12 -> 1.200, matches mockup)
MAKS_SEVIYE = 100
```

XP sources:

| Kaynak | XP |
|---|---|
| Para spent on levels or a shaft opening | `max(1, round(12 * harcama / (60 * gelirRef)))`; `gelirRef = max(bolge.enIyiGelir, 0.5*olcek)`, where `enIyiGelir` is the region's highest ever automated chain income `min(P,A,D)*satisKalici` (managed stations only, no abilities or boost), updated after each purchase or hire |
| Milestone reached (any station) | +25 each |
| Shaft opened | +40 × shaft number (Maden 2 = 80 … Maden 12 = 480) |
| Manager hired | +20 |
| Ability used | +5 |
| [S2] Quest | table §2.14 |
| [S2] Research level done | +60 × tier |
| [S2] Region opened | +250 |
| [S2] Daily gift | +25 |

Level-up reward: `5 + yeniLv` elmas and +2% sales (via `satisKalici`). Unlocks:
- Lv. 2: `Topla x2` boost button.
- [S2] Lv. 3: Araştırma.
- [S2] Lv. 5: `Özel Teklif`.
- [S2] Lv. 20/35/50/65/80: regions.

The modal lists the unlock.

### 2.12 Income boost and offline x2 (`Topla x2`)

- **Boost button** (from Lv. 2): tap → `Reklam.izle('takviye')`. On reward, `takviye.bitis = max(zaman, bitis) + 1800`, capped at `zaman + 4*3600`. While active, sales are ×2. If the cap is reached, the button shows the info toast `Kazanç x2 en fazla 4 saat birikir.`. Users with `reklamsiz` get the reward without an ad.
- **Offline**: §3.4. The modal offers `Topla` (×1) and `Topla x2` (rewarded ad `cevrimdisi`, ×2).

### 2.13 Tutorial (Öğretici) [S1]

Steps run in order. Each shows a pulsing hand on the target (`data-ogretici="..."`), a dimmed backdrop with a cut-out, and a bubble text. Input outside the target is blocked during steps 1–4 and allowed afterwards (the hand stays until done). Progress is stored in `ogretici.adim`, and there is a skip after step 4 in Ayarlar.

| Adım | Hedef | Balon metni | Bitiş |
|---|---|---|---|
| 1 | Maden 1 `Yükselt` → sheet `Yükselt` | `Madenini yükselt!` | first purchase |
| 2 | Maden 1 chamber | `Madencilere dokun, kazmaya başlasınlar.` | manual cycle started |
| 3 | elevator cabin | `Asansöre dokun, cevheri yukarı taşısın.` | trip started |
| 4 | DEPO | `Depoya dokun, taşıyıcılar satsın.` | first sale |
| 5 | Maden 1 manager badge (when para ≥ cost) | `Bir yönetici tut, Maden 1 kendi kendine çalışsın.` | manager on m0 |
| 6 | `Maden 2` open card (when affordable) | `Maden 2'yi aç!` | Maden 2 opened |
| 7 | elevator manager badge | `Asansöre yönetici tut.` | manager on elevator |
| 8 | depot manager badge | `Depoya yönetici tut.` | manager on depot |
| 9 | none (info toast) | `Artık madenin kendi kendine işliyor. Yükseltmeye devam et!` | shown |

After the first sale, show the success toast `Harika! İlk kazancın geldi.`

### 2.14 [S2] Region quests (Görev), 12 per region

Sequential. Only the current quest is active. Rewards are paid when the player taps the success toast or the quest point on the map. XP × (1 + 0.5r); para = N minutes of `gelirRef`, at least 50 × olcek.

| # | Metin | XP | Elmas | Para |
|---|---|---|---|---|
| 1 | `Maden 1'i 5. seviyeye çıkar` | 30 | 5 | – |
| 2 | `Bir yönetici tut` | 40 | 5 | – |
| 3 | `Maden 2'yi aç` | 50 | 10 | – |
| 4 | `Asansöre yönetici tut` | 50 | 5 | – |
| 5 | `Depoya yönetici tut` | 60 | 10 | – |
| 6 | `Maden 1'i 25. seviyeye çıkar` | 80 | 10 | 5 dk |
| 7 | `Bir yönetici yeteneği kullan` | 80 | 10 | – |
| 8 | `Maden 4'ü aç` | 120 | 15 | 10 dk |
| 9 | `Asansörü 100. seviyeye çıkar` | 150 | 15 | 10 dk |
| 10 | `Maden 6'yı aç` | 200 | 20 | 15 dk |
| 11 | `Depoyu 200. seviyeye çıkar` | 250 | 25 | 20 dk |
| 12 | `Maden 8'i aç` | 400 | 50 | 30 dk |

Completing all 12 gives `Bölge Ustası`: +10% `satisKalici` for that region and 100 elmas. The map card shows `tamam/12`.

### 2.15 [S2] Research (Araştırma)

Costs are in elmas plus real (game) time. One research runs at a time.
- Level durations: [2 dk, 15 dk, 1 sa, 3 sa, 8 sa, 16 sa].
- T1 level costs: [5, 15, 40, 90, 180, 350].
- T2 level costs: [10, 30, 80, 180].
- T3: one level, 300 elmas, 24 sa.
- Speed-ups: rewarded ad `arastirma` gives `−15 dk`, at most 2 per research level. Elmas finish costs `ceil(kalanDakika / 5)` (min 1).

| Dal | Kod | Ad | Etki/seviye | Tier×Sv | Şart |
|---|---|---|---|---|---|
| Madencilik | kazma | `Keskin Kazmalar` | üretim +%10 | T1×5 | Lv. 3 |
| | damar | `Damar Haritası` | maden açma −%8 | T2×3 | kazma 1 |
| | usta | `Usta Madenciler` | maden yükseltme −%5 | T2×4 | kazma 2, Lv. 10 |
| | matkap | `Elmas Matkap` | üretim ×1,5 | T3 | usta 2, Lv. 30 |
| Taşıma | halat | `Çelik Halat` | asansör kapasitesi +%15 | T1×5 | Lv. 3 |
| | motor | `Güçlü Motor` | asansör hızı +%10 | T2×4 | halat 1 |
| | ray | `Raylı Yol` | taşıyıcı hızı +%10 | T1×5 | Lv. 4 |
| | depo | `Geniş Depo` | depo kapasitesi +%25 | T2×3 | ray 1 |
| Ticaret | pazar | `Pazar Bilgisi` | satış +%10 | T1×5 | Lv. 4 |
| | gece | `Gece Vardiyası` | çevrimdışı sınır +1 sa | T1×6 | Lv. 5 |
| | ihracat | `İhracat Anlaşması` | satış ×1,5 | T3 | pazar 3, Lv. 25 |
| Yönetim | okul | `Yönetici Okulu` | yetenek süresi +%20 | T2×3 | Lv. 6 |
| | dinlenme | `Dinlenme Odası` | bekleme −%10 | T2×3 | okul 1 |
| | ik | `İnsan Kaynakları` | yönetici maliyeti −%15 | T2×3 | Lv. 8 |

`usta` multiplies `madenMaliyet` by (1 − 0.05 sv). `damar` multiplies `madenAcilis` by (1 − 0.08 sv).

### 2.16 [S2] Daily gift, elmas economy, shop and ads

**Daily gift.** One claim per local calendar day. The 7-day cycle advances on claim and never resets on missed days.
1. `20 dk'lık gelir`
2. `10 elmas`
3. `Kazanç x2 · 30 dk`
4. `45 dk'lık gelir`
5. `20 elmas`
6. `Nadir yönetici` (random type, Nadir+ odds)
7. `50 elmas`

Para gifts = max(gelirRef × dk × 60, 100 × olcek).

**Elmas sources:** level-ups (5+L), quests, daily gift, ad `elmas` (+5, 3 per day), purchases, migration gift. **Sinks:** research, elmas hire (50), and shop boosts: `Kazanç x2 · 4 saat` 80 (boost cap 24 h when bought), `Zaman Atla · 1 saat` 30 and `Zaman Atla · 4 saat` 100 (instant automated income of the active region), `Yetenekleri Yenile` 10.

**Products** (`magaza.js`, the Play Console IDs are unchanged):

| id | Görünen ad | İçerik | Tarayıcı fiyatı |
|---|---|---|---|
| cevher_kese | `Bir kese elmas` | 100 elmas | ₺39,99 |
| cevher_sandik | `Bir sandık elmas` (+%10) | 550 elmas | ₺179,99 |
| cevher_hazine | `Bir hazine elmas` (+%25) | 1.400 elmas | ₺399,99 |
| baslangic | `Özel Teklif` badge `%50`, one-time, from Lv. 5 | 300 elmas + Efsanevi yönetici + `Kazanç x2 · 4 saat` | ₺59,99 |
| reklamsiz | `Reklamsız` | rewarded-ad rewards without watching | ₺119,99 |
| altin_kazma | `Altın Kazma` | all sales ×2 permanently | ₺199,99 |

**Ad places (`Reklam.izle(yer)`):**
- `takviye` [S1]
- `cevrimdisi` [S1]
- `elmas` [S2]
- `arastirma` [S2]

### 2.17 Pacing targets and numeric check

A throwaway flow-model simulation with the frozen parameters above (greedy bot, tutorial order first, sessions of 30 min on day 1 then 15+15+20+10 min per day, offline cap 2 h, no ads or abilities, research bought in cost order) gave:

| Olay | Sonuç |
|---|---|
| first upgrade | 2 s |
| first manager | 10 s (flow model; the discrete game should land at 15–25 s) |
| Maden 2 | 34 s |
| elevator / depot manager | 1.7 dk / 3.1 dk |
| Maden 3 / 4 / 5 / 6 | 5.4 / 9.7 / 12.4 / 16.1 dk |
| Maden 7 / 8 / 9 | 2nd session (4 sa) / 14 sa / 2.0 gün |
| Lv. 2 / 5 / 8 / 10 / 12 / 15 | 34 s / 10 dk / 16 dk / 4 sa / 14 sa / 1.2 gün |
| Bartın (Lv. 20) | 2.0 gün |
| Kastamonu (Lv. 35) | 7.6 gün |
| Karabük (Lv. 50) | 18.8 gün |
| Gümüşhane (Lv. 65) | 41.6 gün |

The chain stayed balanced: elevator throughput ≈ production, and depot throughput 1.5–3× production. The early game is deliberately front-loaded (6 shafts in the first session), then each shaft takes a session or a day. The pacing test bands are in §8.1. Tuning knobs allowed if the discrete implementation misses a band: the `ACILIS` entries, the XP spend coefficient (12) and the curve base (1.03). Nothing else.

---

## 3. Save format

### 3.1 Keys

- `cevher2d-kayit`: the current save (JSON).
- `cevher2d-yedek`: the last good copy. It is rotated every 5 minutes, and also before a migration.
- `cevher2d-gelecek`: the raw string of a save whose `surum` is newer than the code knows. It is never overwritten.
- Old 3D game: `cevher-kayit-v3` and `cevher-kayit-v2`. These are read once for import (§3.3) and never written.

### 3.2 Schema (surum 1)

```js
{
  surum: 1,
  tohum: 123456789,               // PRNG state (mulberry32)
  olusturma: 1791200000000,       // ms, wall clock
  son: 1791200000000,             // ms, wall clock at last save
  enGec: 1791200000000,           // ms, max wall clock ever seen
  zaman: 12345.6,                 // game clock, seconds, monotonic (advances offline too)
  oyuncu: { lv: 12, xp: 482, toplamXp: 7082, elmas: 420 },
  aktifBolge: 'zonguldak',
  bolgeler: {
    zonguldak: {
      acik: true, para: 318600, toplamKazanc: 1.2e9, enIyiGelir: 52300,
      madenler: [{ L: 25, yigin: 120.5, kalan: 0 }],          // length = opened count (1..12)
      asansor: { L: 40, yuk: 0 },                              // load is kept; the cabin is put at the top on load
      depo: { L: 35, stok: 1234, yoldaki: 0 },                 // yoldaki = in-flight carrier loads, sold on load
      yoneticiler: [{ id: 'y7', tip: 'maden', nadirlik: 1, yetenek: 'kazi', ad: 'Hasan', tohum: 991,
                      atanan: 'm0', aktifBitis: 0, hazirZaman: 0 }],
      kiralanan: { maden: 3, asansor: 1, depo: 1 },
      ayrilis: null,                                           // game time when left (S2), null if active
      gorev: { sira: 3, hazir: false }                         // S2
    }
  },
  takviye: { bitis: 0 },                                       // game time
  bekleyenCevrimdisi: null,                                    // { bolge, miktar, sure, sinirli } until collected
  arastirma: { sv: {}, suren: null },                          // S2: { kod, bitis, reklam }
  gunluk: { son: '', seri: 0 },                                // S2: 'YYYY-MM-DD' local
  reklamElmas: { gun: '', n: 0 },                              // S2
  satin: { reklamsiz: false, altinKazma: false, baslangic: false },
  ayarlar: { ses: true, titresim: true, kalite: 'yuksek' },    // 'yuksek' | 'dengeli' | 'pil'
  ogretici: { adim: 0, bitti: false },
  alimModu: 1,                                                 // 1 | 10 | 50 | 'max'
  istatistik: { dokunus: 0, yukseltme: 0, yetenek: 0, reklam: 0, satis: 0 },
  aktarim: false                                               // old 3D save imported
}
```

Station ids: `'m0'..'m11'`, `'asansor'`, `'depo'`. Runtime-only fields (elevator position and state, carrier states, EMAs, bottleneck timers, ring buffers) live in `durum.calisma` and are **not** saved. `Kayit.kaydet` serialises with an explicit whitelist.

### 3.3 Migration and validation

- `GOCLER = { 2: (d) => d, ... }`. On load, apply `GOCLER[v]` for v = d.surum+1 .. SURUM in order (copy to `cevher2d-yedek` first).
- If `d.surum > SURUM`, store the raw string in `cevher2d-gelecek`, start a new game, and show the info toast `Kayıt daha yeni bir sürümden; yeni oyun başlatıldı.`.
- Then run `dogrula(d)`: deep-merge defaults from `yeniDurum()`; replace NaN/Infinity/negative numbers with defaults or 0; clamp levels to [1, MAKS]; truncate `madenler` to 12; drop managers with unknown types; ensure `aktifBolge` is opened.
- Corrupt JSON: try `cevher2d-yedek`, else start a new game.
- **Old 3D import** (only when no `cevher2d-kayit` exists):
  - copy `satin.reklamsiz`, `satin.altinKazma` and `satin.baslangic`, and settings `ses` and `titresim`;
  - set `elmas = old.cevher + 50` (welcome gift), `aktarim = true`;
  - show the modal `Cevher Madenci yenilendi!` with body `Satın aldıkların ve elmasların aktarıldı. Hoş geldin hediyesi: 50 elmas.` and button `Başla`.
  - Old progress is not carried over.

### 3.4 Autosave, offline computation and the clock guard

- **Autosave:**
  - every 15 s of game time when dirty;
  - 1 s debounced after any purchase, hire, assign, ability, ad reward, region switch or tutorial step;
  - immediately on `visibilitychange→hidden`, `pagehide`, and before calling `Reklam.izle` or `Magaza.al`;
  - `enGec = max(enGec, Date.now())` and `son = Date.now()` on every save.
- **Offline**, at boot and when the page becomes visible after ≥ 60 s hidden (a shorter hide is caught up by stepping the sim, max 1200 steps at 0.05 s):
  ```
  simdi = Date.now()
  geriAlindi = simdi < enGec - 120000
  gecen = geriAlindi ? 0 : max(0, (simdi - son)/1000)
  durum.zaman += gecen                          // all timers advance, uncapped
  sinir = (2 + ar.gece) * 3600
  t = min(gecen, sinir)
  gelir = otoGelir(aktif bölge)                 // min(P,A,D) of managed stations only, no abilities, × satisKalici
  ortak = clamp(takviyeBitisEski - zamanEski, 0, t)   // boost seconds overlapping the absence
  miktar = gelir * (t + ortak)
  ```
  If `gecen >= 60` and `miktar > 0`, set `bekleyenCevrimdisi = { bolge, miktar, sure: gecen, sinirli: gecen > sinir }` and open the offline modal. Para is credited only on collect.
  If geriAlindi, show the info toast `Cihaz saati geri alınmış; çevrimdışı kazanç verilmedi.`.
  If a station lacks a manager, the modal adds the line `Yöneticisi olmayan istasyonlar sen yokken çalışmaz.`. If `miktar == 0`, show only that line as an info toast.
- [S2] **Inactive regions** accrue `otoGelir(b) × min(zaman − b.ayrilis, sinir)`, shown as `Biriken: …` on the map and collected through the same modal on arrival.
- Ad and purchase rewards are applied and saved before any animation.

---

## 4. Screens and UI (390×844)

### 4.1 Palette tokens (`css/temel.css` `:root`)

The six mockup colours, exact:

| Token | Hex | Use |
|---|---|---|
| `--arka` | #0F2F2A | `Arka Plan`: app background, HUD and nav base, page backgrounds |
| `--panel` | #F4E8D6 | `Panel`: cards, stats strip, sheets, modals |
| `--yukselt` | #E67E3E | `Yükselt`: primary action buttons, selected nav tile |
| `--para` | #F6C453 | `Para`: coins, XP fill, rewards, Efsanevi |
| `--basari` | #2ECC71 | `Başarı`: progress bars, plus buttons, success, Topla x2, positive deltas |
| `--bilgi` | #4A90E2 | `Bilgi`: info toasts, Nadir, elmas accents |

Derived shades:

| Token | Hex | Use |
|---|---|---|
| `--arka-900` | #071B18 | nav bottom, deepest shadows, modal backdrop base |
| `--arka-800` | #0B2622 | page header, inset wells (pill backgrounds use rgba(0,0,0,.32)) |
| `--arka-700` | #143C36 | HUD gradient top, flow chips, raised dark surfaces |
| `--arka-600` | #1C4F47 | chip borders, hover/pressed dark surfaces |
| `--arka-400` | #3E7D72 | dividers on dark (1px at 40% alpha), inactive icons |
| `--panel-acik` | #FBF4EA | panel gradient top, highlight edge |
| `--panel-koyu` | #E9D7BC | panel gradient bottom, pressed card |
| `--panel-cizgi` | #D8C3A2 | dividers and borders on panel |
| `--panel-kenar` | #B8996F | card outer border, bar track border |
| `--metin` | #2B1D12 | primary text on panel |
| `--metin-soluk` | #6B5640 | secondary text on panel |
| `--acik` | #FFFFFF | text on dark, orange or green |
| `--acik-soluk` | rgba(255,255,255,.72) | secondary text on dark |
| `--yukselt-acik` | #F59A55 | button gradient top |
| `--yukselt-koyu` | #CC5F27 | button gradient bottom |
| `--yukselt-kenar` | #9A4316 | button bottom edge / border |
| `--para-acik` | #FFE08A | coin highlight, XP fill top |
| `--para-koyu` | #D99A2B | coin shade, XP fill bottom |
| `--para-kenar` | #A8690F | coin rim |
| `--basari-acik` | #5FE08F | bar top highlight |
| `--basari-koyu` | #1E9E55 | positive text on panel, bar bottom |
| `--basari-kenar` | #13703A | green button edge |
| `--bilgi-acik` | #7DB1F0 | gem highlight |
| `--bilgi-koyu` | #2F6DB8 | info toast gradient bottom |
| `--uyari` | #E25A43 | warning icon, red badge, danger text |
| `--uyari-zemin` | #4A1F1A | warning toast background |
| `--uyari-kenar` | #8E3B2E | warning toast border |
| `--pasif` | #A8968A | disabled button fill (text `--panel` at 75%) |
| `--teklif` | #A8508C | offer card (S2), gradient to #C973AD |
| `--sradan` | #B8C2C8 | Sıradan rarity |
| `--bar-iz` | #3A2A1E | card bar track (dark, as in the mockup) |

Rules: never use pure saturated primaries. No colour outside this table except the transparent variants given and the art palettes in §5. "Cırtlak olmasın": every large fill uses a 2–3 stop gradient of its token family, never a flat neon.

### 4.2 Typography, spacing, radii, shadows

- Fonts: `<link>` to Google Fonts `Baloo+2:wght@600;700;800` and `Rubik:wght@400;500;600;700`, `display=swap`.
  - `--f-baslik: "Baloo 2", "Trebuchet MS", system-ui, sans-serif`
  - `--f-govde: "Rubik", "Segoe UI", Roboto, system-ui, sans-serif`
  - Numbers use `font-variant-numeric: tabular-nums`.

| Rol | Font | Boyut/satır |
|---|---|---|
| hero number (modals) | Baloo 800 | 30/34 |
| region name, page title | Baloo 800 | 20/24 |
| card title `Maden 1` | Baloo 800 | 16/19 (15 below 380 px) |
| button label | Baloo 800 | 15/18 |
| stats value | Baloo 800 | 16/18 |
| HUD currency | Baloo 700 | 16/18 |
| body | Rubik 500 | 13/17 |
| card meta, `Seviye 25`, rate | Rubik 600 | 12/15 |
| labels, toast text, nav | Rubik 600/700 | 11/13 |
| badges | Rubik 700 | 10/12 |

Measured with the real fonts: `Asansör kapasitesi yetersiz!` 600 11px = 130 px; `Maden 12` Baloo 800 16px = 68 px; `999,9 bin/sn` Rubik 600 12px = 61 px; `Zonguldak` Baloo 800 20px = 93 px.

- Spacing scale: 2, 4, 6, 8, 12, 16, 24.
- Radii: 6 (badges), 9 (buttons, bars 5), 12 (cards), 14 (strips, nav tiles), 18 (sheets top), 999 (pills).
- Shadows:
  - `--golge-kart: 0 2px 0 rgba(120,80,40,.28), 0 6px 14px rgba(0,0,0,.30)`
  - `--golge-buton: inset 0 1px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.16), 0 2px 0 var(--yukselt-kenar), 0 4px 8px rgba(0,0,0,.25)`
  - `--golge-panel: 0 10px 28px rgba(0,0,0,.40)`
  - `--golge-yazi: 0 1px 0 rgba(0,0,0,.30)` (white on orange or green)

### 4.3 Frame and layout

`#oyun` = `position: fixed; inset: 0; max-width: 480px; margin: 0 auto; overflow: hidden; background: var(--arka)`. Wider screens show `--arka-900` outside. `html, body` have `overscroll-behavior: none`, `user-select: none`, `-webkit-tap-highlight-color: transparent` and `touch-action: none` on the mine view (pages use `pan-y`). `st` = `env(safe-area-inset-top)`, `sb` = `env(safe-area-inset-bottom)`.

Vertical layout (W = `#oyun` width):
- **HUD** `#ust`: top 0, height `74 + st`, padding-top `st`.
- **Stats strip** `#istatistik`: top `st + 78`, height 58, left/right 10.
- **Mine view** `#maden`: top `st + 142`, bottom `66 + sb`, full width. It holds the canvas `#sahne` (fills the view) and `#dunya` (DOM layer translated by −kaydirY).
- **Bottom overlay** `#alt-serit`: bottom `66 + sb + 8`, left/right 8, height 64. It floats over `#maden`.
- **Nav** `#gezinti`: bottom 0, height `66 + sb`.
- **Pages** `#sayfa`: from top 0 (with `st`) to the nav top. They cover HUD, stats and mine view.
- **Layers** (z-index): sahne 1, dunya 2, alt-serit 5, ust/istatistik 6, gezinti 7, sayfa 8, perde 9, sheet/modal 10, toast 11, efekt canvas 12, ogretici 13, reklam-perde 14, acilis 15.

World layout (`js/yerlesim.js`, pure, shared by renderer and UI):
```
kenar = W >= 420 ? 12 : 8
kartG = clamp(148, round(0.41*W), 196)          // 160 @390, 148 @360, 196 @480
bosluk = 6
kuyuG = W < 375 ? 36 : (W >= 440 ? 44 : 38)
sagG  = clamp(46, round(0.13*W), 62)            // 51 @390
odaX  = kenar + kartG + bosluk;  odaG = W - odaX - kuyuG - sagG   // 127 @390, 115 @360, 160 @480
kuyuX = odaX + odaG;  sagX = kuyuX + kuyuG
YUZEY_H = 128;  SATIR_H = 128;  KART_H = 116 (top offset 6);  BITIS_H = 96
satirY(i) = YUZEY_H + i*SATIR_H                 // i = 0 -> Maden 1
dunyaH = YUZEY_H + (acik + (acik < 12 ? 1 : 0))*SATIR_H + BITIS_H
```
`yerlesim(W)` returns `{kenar, kartG, odaX, odaG, kuyuX, kuyuG, sagX, sagG, satirY, dunyaH(acik), istasyonKutusu(istasyon, acik) -> {x,y,w,h}}`.

### 4.4 HUD (`#ust`) [S1]

Background: `linear-gradient(180deg, var(--arka-700), var(--arka) 70%)` plus a 1px bottom line rgba(244,232,214,.08) and the shadow `0 6px 16px rgba(0,0,0,.35)`.

- **Location badge** (left 12, top st+9, 56×56, radius 14, 2px border rgba(255,255,255,.18), inner shadow): a `<canvas>` painted by `Sahne.bolgeRozeti(kod)` (Zonguldak: lighthouse on a rock, sea, mountains). Tap → [S1] nothing (scale feedback only); [S2] Harita.
- **Name**: x 78, top st+8. `Zonguldak` Baloo 800 20, white, `--golge-yazi`, then a 14 px pin icon at 60% white.
- **Level pill**: x 78, top st+38, height 26, width 168, radius 13, bg rgba(0,0,0,.32), 1px border rgba(255,255,255,.06).
  - `Lv. 12`: Baloo 700 13, `--para`, left 10.
  - XP bar: x 50, width 76, height 8, radius 4, track rgba(255,255,255,.10), fill gradient `--para-acik → --para-koyu`.
  - `482 / 1.200`: Rubik 600 11, white 85%, right 8.
  - The bar animates over 400 ms. On level-up it fills to 100%, flashes, and opens the level-up modal.
- **Coin pill**: right 46, top st+8, height 30, min-width 118, radius 15, bg rgba(0,0,0,.32).
  - Coin icon 24 px (SVG `para`) at left 3.
  - Value Baloo 700 16 `--para`, e.g. `318,6 bin`.
  - Plus button 24×24, radius 7, gradient `--basari-acik → --basari-koyu`, white `+`, hit area 40×40. Tap → [S1] info toast `Mağaza yakında açılıyor.`; [S2] Mağaza → elmas section.
- **Gem pill**: right 46, top st+42, height 30, min-width 96. Gem icon 22, value Baloo 700 16 white (`420`), plus button as above.
- **Gear**: right 10, top st+24, 28 px icon `--panel` 90%, hit area 44. Opens the Ayarlar sheet.
- **Counter motion**: the displayed para eases toward the real value with time constant 250 ms (spends jump down at once). Text is written ≤ 10 times/s and only when the formatted string changes. On coin-fly arrival the pill scales 1→1.08→1 over 160 ms.

### 4.5 Stats strip (`#istatistik`) [S1]

- Panel: gradient `--panel-acik → --panel → --panel-koyu`, radius 14, 1px border `--panel-kenar` at 60%, `--golge-kart`.
- Three equal columns with 1px dividers `--panel-cizgi` (inset 10 px top and bottom). Column padding 8.
- Each column: icon tile 36×36 (radius 9, `--panel-koyu`, inner shadow) at left, text block at right (gap 7).
  1. Ore icon (coal lump). `Toplam Üretim` (Rubik 500 11 `--metin-soluk`). `52,3 bin/sn` (Baloo 800 16 `--metin`). `▲ +%12` (Rubik 700 11 `--basari-koyu`) as described in §2.9.
  2. Cart icon. `Depo Doluluğu`. `%68` (Baloo 800 16). Bar 74×7 (track #D9C9AE with 1px `--panel-kenar`, fill per §2.9 colours).
  3. Padlock-with-coin icon. `Gelir`. Coin 14 px + `+1,2 bin/sn` (Baloo 800 15 `--basari-koyu`; while boosted `--para-koyu` with an `x2` badge).
- Below 380 px the icon tiles shrink to 30 and the labels to 10 px.
- Updates at 4 Hz. Tapping a column shows an info toast: `Bütün madenlerin saniyelik üretimi.`, `Depodaki cevherin doluluk oranı.`, `Satıştan gelen saniyelik kazanç.`

### 4.6 Mine view

**Surface band** (world y 0–128): art in §5. DOM flow chips, centred at x = 20%, 50% and 80% of W, top 62, size 54×56, radius 14:
- Chip style: bg rgba(11,38,34,.88), 1px border rgba(244,232,214,.18), `--golge-panel`.
- Content: icon 26 px (miner / elevator / cart, painted SVG) and a label Rubik 700 11 white: `Madenci`, `Asansör`, `Depo`.
- Between chips: chevron 14 px `--para`, animated (a highlight band slides left to right every 1.6 s).
- The Asansör and Depo chips carry a level badge (top-right, `Sv.40`, Rubik 700 9, pill `--yukselt`).
- Taps:
  - `Madenci` → scrolls smoothly to the first shaft whose upgrade is affordable (or Maden 1) and pulses that card.
  - `Asansör` → elevator upgrade sheet.
  - `Depo` → depot upgrade sheet.

**Mine row i** (world y = `satirY(i)`):
- **Card** (`.kart`, x `kenar`, y +6, w `kartG`, h 116, radius 12, padding 8): gradient `--panel-acik → --panel 40% → --panel-koyu`, 1px border `--panel-kenar` at 70%, `--golge-kart`, a faint baked paper noise (CSS background, data-URI SVG turbulence at 6% alpha).
  - Ore icon 38×38 (radius 9, `--metin` at 6% bg) at (8,8). Painted per-region ore SVG.
  - Title `Maden 1` at x 54, y 7 (Baloo 800 16 `--metin`).
  - Arrow badge 18×18 at the top-right (circle gradient `--basari-acik → --basari-koyu`, white up arrow 10 px). Visible only when the current buy mode is affordable. Bobs 2 px every 1.2 s.
  - `Seviye 25` at y 28 (Rubik 600 12 `--metin`).
  - Coin 13 px + `12,8 bin/sn` at y 45 (Rubik 600 12 `--metin`).
  - Bar row at y 66: track height 9, radius 5, `--bar-iz`, inner shadow; fill gradient `--basari-acik → --basari → --basari-koyu`, shows `kademeIlerleme`. Label `%78` right (Rubik 700 11 `--metin`, width 30).
  - Button at y 80, height 30, full inner width, radius 9: gradient `--yukselt-acik → --yukselt → --yukselt-koyu`, `--golge-buton`, label up-arrow icon 13 px + `Yükselt` (Baloo 800 15 white, `--golge-yazi`).
- **Manager badge** (`.yonetici-rozet`, 34×34 circle at x `odaX + 6`, y +8, over the chamber's top-left; a DOM element in `#dunya`):
  - Empty: dashed 2px ring `--panel` 70%, bg rgba(0,0,0,.35), white `+` and a mini label `Yönetici` (Rubik 700 8) under it on a dark pill.
  - Assigned: portrait canvas with a rarity ring (3px, rarity colour). Ready: a lightning badge (14 px, `--para`) at the bottom-right and a breathing glow 1.4 s. Active: a conic ring countdown in the rarity colour. Cooldown: a grey conic ring countdown, portrait 70% brightness.
  - Tap: empty → manager modal; ready → activate the ability (burst + sound `yetenek`); otherwise → manager modal.
- **Chamber, shaft and right column**: canvas art (§5). Tap targets come from `yerlesim.istasyonKutusu`.
- **Next shaft row**: dark card variant (`.kart.kilitli`, bg gradient #2A1E16 → #1B130E, border rgba(244,232,214,.12)).
  - Lock icon, `Maden 4` (Baloo 800 16 `--panel`), `Yeni maden` (Rubik 600 12 `--acik-soluk`).
  - Button `Aç · 20 bin` (with coin icon): green gradient when affordable, `--pasif` when not.
  - The chamber shows unexcavated rock with a `KAZI` signboard.
  - Tap `Aç` → `madenAc` → 1.6 s excavation (rock cracks, dust, the card flips to a normal card with a 300 ms scale-in).
- **Bedrock cap**: 96 px dark strata fading to `--arka-900`. Above 12 shafts it reads `Bu bölgenin en derin noktası` (Rubik 600 11, white 50%).

**States of the `Yükselt` button and card:**

| State | Look |
|---|---|
| affordable | orange gradient; shine sweep every 3.2 s (600 ms diagonal white band at 35%, pseudo-element translateX) |
| not affordable | `--pasif` flat gradient #B5A497→#9C8A7E, label at 75%, no shine, arrow badge hidden; still tappable (opens the sheet) |
| pressed | scale .96, translateY 1px, inner shadow, 80 ms |
| maxed | label `MAKS`, gradient `--para-acik → --para-koyu`, bar full, `%100` → `MAKS` |
| loading | before the first sim tick: skeleton shimmer on the card (panel gradient moving), button hidden |
| locked | the next-shaft dark variant above |
| level-up | the card pulses (scale 1→1.03→1, 240 ms), a gold ring glow fades over 400 ms, the level number rolls up |
| milestone | bar fills to 100%, flashes white 120 ms, resets to the new fraction (300 ms); a `Kademe 25 · ×2` ribbon drops over the chamber for 1.4 s |

Tap `Yükselt` → upgrade sheet. Long-press (≥ 350 ms) → quick-buy with the current mode, repeating every 150 ms while held and affordable (accelerating to 80 ms after 1.5 s), without opening the sheet. The tutorial skips long-press.

**Bottom overlay** (`#alt-serit`, flex, gap 6, aligned to the bottom):
1. **Status slot** (`.durum-yuva`, flex 1, min-height 46, radius 12, padding 7 10).
   - Warning: bg `--uyari-zemin` with gradient to #3A1612, 1.5px border `--uyari-kenar`, triangle icon 22 px `--uyari` with a white `!`, text lines (§2.8) Rubik 600 11 white / Rubik 500 11 white 85%. It slides in from the left (240 ms) and shakes once (2 × 4 px) when it changes.
   - When there is no warning: [S1] the slot is empty and transparent (not shown); [S2] it shows the current quest as an info toast `Görev: Maden 2'yi aç`, or the claimable quest as the success toast `Görev Tamamlandı! +80 XP`.
   - Priority: claimable quest > warning > quest info.
2. **Flow indicator** (`.akis`, 84×40, radius 20, bg rgba(11,38,34,.9), border rgba(244,232,214,.14)): three 24 px circular icons (ore, elevator, cart) with 6 px `--para` chevrons. The bottleneck icon has a red ring pulse and a badge (14 px circle `--uyari`, white `!`). Chevron shimmer speed ∝ `Gelir/Toplam Üretim`. Hidden when W < 380. Tap → same as the warning toast; with no bottleneck → elevator sheet.
3. **Topla x2** (`.topla`, 88×64, radius 22): gradient #3FBF6E → #1F8E4D → #157341, 2px border `--para` at 80%, `--golge-panel`. A stack of three coins (painted SVG, 34 px) on the left; `Topla` (Baloo 800 16 white) above `x2` (Baloo 800 22 white) on the right.
   - Idle: breathing glow (box-shadow 0→10px rgba(46,204,113,.45), 2 s) and a coin jiggle every 5 s; a small ▶ ad badge at the top-right (hidden if `reklamsiz`).
   - Active: an SVG ring countdown around the button and the second line becomes `29:41`.
   - Loading (ad in progress): spinner on the coins, disabled.
   - Hidden below Lv. 2. It appears with a 400 ms pop.
   - Tap → §2.12.

### 4.7 Bottom nav (`#gezinti`) [S1 shell]

- Background: gradient `--arka-700` → `--arka-900`, 1px top border rgba(244,232,214,.10). Five equal tabs, height 66 + sb.
- Tabs: `Maden` (pickaxe), `Harita` (folded map with pin), `Yöneticiler` (person with tie), `Araştırma` (flask), `Mağaza` (shopfront). Icons 28 px, painted SVG in `--panel` 90%. Labels Rubik 700 11 `--panel`.
- 1px dividers rgba(244,232,214,.12) inset 14 px.
- Selected: a tile inset 4 px, radius 14, gradient #F08A4A → `--yukselt` → `--yukselt-koyu`, border 1px `--para` at 40%, inner highlight; icon and label white; bounce 0.92→1.06→1 over 280 ms.
- Badges: 9 px `--uyari` dot at the icon's top-right, or a count bubble (16 px).
- [S1] `Yöneticiler` opens the managers page (S1 content, below). `Harita`, `Araştırma` and `Mağaza` open a placeholder page (header + painted icon 96 px + `Bu bölüm yakında açılıyor.` + `Madene Dön` button).
- Tapping the active tab returns to Maden.
- A home indicator bar (134×5, radius 3, `--panel` 70%) is drawn only in the browser preview when `sb == 0`? No: never drawn; the OS draws it.

### 4.8 Pages

Common: page header 56 px (`--arka-800`). Back button (40 px circle, rgba(255,255,255,.08), arrow-left white) → Maden. Title Baloo 800 20 white. Compact coin and gem pills on the right (height 26). Body scrolls natively (`overflow-y: auto`, `touch-action: pan-y`), padding 12, bottom padding 24. Background `--arka` with a subtle top vignette. The canvas stops rendering while a page is open (the sim continues).

- **Yöneticiler** [S1]:
  - Segmented control `Madenler` | `Asansör` | `Depo` (height 36, radius 18, selected `--yukselt`).
  - List of the region's managers of that type (cards on `--panel`, height 84):
    - portrait 56 with rarity ring;
    - `Hasan Usta` (Baloo 800 15), rarity text in its colour;
    - ability `Kazı Hızı ×3 · 3 dk` and `Bekleme 10 dk` (Rubik 500 12);
    - assignment `Maden 3` or `Boşta`;
    - button `Ata` (opens a station picker sheet) or `Değiştir`.
  - Sticky footer: `Yönetici Tut` with coin + cost (orange) and `Elmasla Tut` with gem + `50` (blue gradient `--bilgi-acik → --bilgi-koyu`).
  - Empty text: `Henüz yöneticin yok. Bir istasyon seç ve yönetici tut.`
  - Hint: `Yöneticiler istasyonu otomatik çalıştırır. Yeteneği kullanmak için madendeki rozetine dokun.`
  - Full pool: the button is disabled with `Yönetici odası dolu (20/20)`.
- **Harita** [S2]: painted map canvas (sea at the top-left, coast, forests, mountains, a winding dotted gold path). Regions top to bottom along the path: Zonguldak (top-left, coastal), Bartın (top-right), Kastamonu (right), Karabük (middle-left), Gümüşhane (lower-left), Artvin (bottom).
  - Region card (`Bölge kartı`, dark glass rgba(15,47,42,.88), radius 12, height 52):
    - unlocked: a green check tile, `Zonguldak` (Baloo 700 15), `↑ 3/12`;
    - current: a pulsing ring and `Buradasın`;
    - unlockable: gold glow and button `Aç`;
    - locked: grey lock tile, `Bartın`, `Kilidi: Lv.20`.
  - Quest point (`Görev noktası`, green diamond pin) next to the current region. Path links (`Yol bağlantısı`) between regions.
  - Tap a region → sheet with ore, quests list (12 rows with status), `Biriken: …`, and `Bölgeye Git` / `Aç` / disabled `Lv. 20'de açılır`.
- **Araştırma** [S2]: current research card (progress bar, `1 sa 12 dk`, `▶ −15 dk`, `Bitir · 12` with gem). Then four branch sections (`Madencilik`, `Taşıma`, `Ticaret`, `Yönetim`), each a vertical chain of node rows (circle 56 with icon and level pips `2/5`, name, effect; states: locked with requirement text, available, running, maxed). Tap → research sheet (`Şu an: +%20` → `Sonraki: +%30`, cost, duration, `Başlat`). Lab busy: `Laboratuvar meşgul`.
- **Mağaza** [S2]: sections in this order:
  - `Günlük Hediye` (7 tiles, today highlighted, `Al`);
  - `Özel Teklif` (purple card, `%50` badge, contents, price);
  - `Takviyeler`;
  - `Bedava Elmas` (`▶ İzle · +5 elmas`, `Bugün 2 hakkın kaldı`);
  - `Elmas Paketleri`;
  - `Kalıcı`.
  - Footer: `Satın alımları geri yükle` (native) or `Önizleme: ödeme Play Store sürümünde açılır. Burada denersen ürün verilir, ödeme alınmaz.` (browser, the old text).
  - Owned items show `✓ Sende`.

### 4.9 Ayarlar sheet (gear) [S1]

Bottom sheet `Ayarlar`:
- Toggles (switch 44×26, on = `--basari`): `Ses efektleri`, `Titreşim`.
- Segmented `Grafik`: `Yüksek` / `Dengeli` / `Pil Tasarrufu` (§7).
- Rows:
  - `Öğreticiyi atla` (only while active);
  - `İlerlemeyi sıfırla`: first tap turns it red `Emin misin? Bütün ilerleme silinir.` for 4 s, a second tap resets.
- Footer `Cevher Madenci · Sürüm 1.0.0` (Rubik 500 11 `--metin-soluk`).

### 4.10 Sheets and modals

- **Sheet**: `--panel` background, radius 18 18 0 0, grab handle 40×4 `--panel-cizgi`, max height 78% of the screen. It slides up in 280 ms `cubic-bezier(.2,.9,.25,1)` over a backdrop rgba(4,14,12,.6) (fade 200 ms). Swipe down or tap the backdrop to close (not during a forced tutorial step).
- **Modal**: centered card 320 wide (W − 40 max), `--panel`, radius 18, `--golge-panel`, entry scale .92→1 with a slight overshoot over 220 ms. Primary button 48 tall.
- Queue: one modal at a time, FIFO. Priority: offline > level-up > others.

Specs:

1. **Upgrade sheet** [S1] (`yukseltme`):
   - Header: station icon 44, name (`Maden 3` / `Asansör` / `Depo`), `Seviye 25 → 35` (the target in `--basari-koyu`).
   - Buy mode segmented `x1 · x10 · x50 · Max` (height 34).
   - Stat rows, label left and `şimdi → sonra` right with the increase in green:
     - Maden: `Üretim` (/sn), `Madenci`, `Yığın kapasitesi`.
     - Asansör: `Kapasite`, `Hız` (`1,2 kat/sn`), `Tur süresi` (`6,8 sn`).
     - Depo: `Taşıyıcı`, `Taşıyıcı yükü`, `Depo kapasitesi`.
   - Milestone strip: `Sonraki kademe: 50 → Üretim ×2` with a mini bar (and `+1 madenci` at 10/50; `+1 taşıyıcı` at 10/50/150/300).
   - Big button `Yükselt · 12,4 bin` (orange) or disabled `Yetersiz para · 12,4 bin` (`--pasif`). At max: `MAKS SEVİYE`.
   - The sheet stays open after buying (repeat taps allowed). Long-press repeat works here too.
2. **Manager modal** [S1] (`yonetici`):
   - Title `Maden 3 · Yönetici`.
   - Current manager block, if any: portrait 72, name, rarity, ability line, state (`Hazır` green / `Aktif · 1:42` / `Bekleme · 7:10`), buttons `Yeteneği Kullan` (green, only when ready) and `Görevden Al`.
   - `Boştaki yöneticiler` list (compact rows with `Ata`).
   - Footer: `Yeni Yönetici Tut · 150` (coin) and `Elmasla Tut · 50` (gem).
   - Hire reveal: the card flips (rotateY 0→180, 500 ms), rarity glow burst (Efsanevi adds gold rays and `usta` sound), text `Hasan Usta katıldı!`.
3. **Offline modal** [S1] (`cevrimdisi`):
   - Gold ray backdrop.
   - Title `Sen yokken madencilerin çalıştı!`
   - Hero amount: coin 34 + `48,2 bin` (Baloo 800 30 `--metin`).
   - Body `2 sa 15 dk boyunca` plus ` (en fazla 2 saat)` when capped, and the manager line when relevant.
   - Buttons side by side: `Topla` (cream secondary button: `--panel-koyu` gradient, `--metin` text, 1px `--panel-kenar`) and `Topla x2` (green, ▶ icon unless `reklamsiz`).
   - Not dismissable by backdrop. Collect → coin fly (14 coins) from the button to the HUD.
   - If the ad fails, show the toast `Reklam yüklenemedi, sonra tekrar dene` and keep the modal.
4. **Level-up modal** [S1] (`seviye`):
   - Rotating soft rays (conic gradient, 20 s per turn) and confetti on the effect canvas.
   - `Seviye Atladın!`, a big medal with `Lv. 13`.
   - Reward rows `+18 elmas`, `Bütün satışlar +%2`, plus the unlock row (e.g. `Topla x2 açıldı!`).
   - Button `Harika!`. Sound `ocak`.
5. [S2] **Region unlock modal**: region art, `Bartın açıldı!`, `Cevher: Manganez`, buttons `Bölgeye Git` / `Sonra`.
6. [S2] **Daily gift modal**: the 7 tiles, `Günlük Hediye`, `Al`.
7. [S1] **Import modal** (§3.3).
8. **Ad preview overlay** (`.reklam-perde`, from the old CSS, recoloured to the new tokens): `Reklam alanı`, `Uygulamada burada kısa bir ödüllü reklam oynar (takviye).`, 2 s progress bar.

### 4.11 Toasts

Top toasts sit at top `st + 206` (below the stats strip), are centred, and are at most 300 wide. One is visible at a time, queue max 3 (info dropped first). In: translateY −12→0 + fade, 220 ms. Hold: 2.2 s (info 2.6 s). Out: 180 ms.

| Tür | Look | Example |
|---|---|---|
| kaynak (resource +) | pill height 40, gradient `--para-acik → --para`, 1px `--para-kenar`; ore or coin icon 30 left; Baloo 800 16 `--metin` | `+12,8 bin` |
| basari (success) | pill, gradient `--basari-acik → --basari-koyu`, white check-circle 22, Baloo 800 15 white | `Görev Tamamlandı!`, `Maden 3 açıldı!`, `Kademe 25! Üretim ×2` |
| bilgi (info) | pill, gradient `--bilgi-acik → --bilgi-koyu`, white `i` circle 20, Rubik 600 13 white | `Bilgi mesajı`, `Yetersiz para` |
| uyari | bottom status slot only (§4.6) | |
| teklif [S2] | purple pill with gem, `Özel Teklif` and `%50` badge (`--yukselt` star burst) | |

Standard texts:
- `Yetersiz para` (info)
- `Yetersiz elmas` (info)
- `Kazanç x2 başladı! 30 dk` (success)
- `Kazanç x2 en fazla 4 saat birikir.` (info)
- `Reklam yüklenemedi, sonra tekrar dene` (info)
- `Hasan Usta: Kazı Hızı ×3!` (success, on ability)
- `Maden 2 açıldı!` (success)
- `Kademe 10! Üretim ×2` (success; elevator `Kapasite ×2`; depot `Taşıyıcı yükü ×2`)

### 4.12 Number formatting (`js/bicim.js`)

```
EKLER = ['', 'bin', 'mn', 'mr', 'tn', 'kt', 'kn']; beyond: 'aa','ab',...,'az','ba',...
bicim(n):  !isFinite -> '∞';  n < 0 -> '-' + bicim(-n)
           n < 10     -> one decimal, ',0' removed      0,4 · 2 · 9,5
           n < 1000   -> floor, no separator            12 · 482
           else e = floor(log10(n)/3), v = n/1000^e -> one decimal (truncate, not round, so it never shows 1000,0), ',0' removed, + ' ' + ek
                                                        1,2 bin · 12,8 bin · 318,6 bin · 4,5 mn · 12 bin
oran(n)    = bicim(n) + '/sn'                           12,8 bin/sn ; stats Gelir: '+' + oran(n)
tam(n)     = Math.floor(n).toLocaleString('tr-TR')      1.200 · 420   (XP, elmas, level)
yuzde(x)   = '%' + Math.round(x*100)                    %68 ; artiYuzde -> '+%12' / '-%3'
sure(sn)   = '45 sn' | '12 dk' | '2 sa 15 dk' | '1 gün 3 sa'
sayac(sn)  = 'm:ss' or 'h:mm:ss'                        29:41 · 1:02:03
```

The decimal separator is always a comma and the thousands separator a dot. `bicim` is pure and covered by tests (`bicim(318600) === '318,6 bin'`, `bicim(1200) === '1,2 bin'`, `tam(1200) === '1.200'`, `bicim(999999) === '999,9 bin'`, `bicim(1e21) === '1 aa'`).

### 4.13 Icons (`js/arayuz/ikonlar.js`, inline SVG strings, viewBox 0 0 24 24)

Painted icons use 2–3 gradient stops plus a dark outline #2B1D12 at 1.2 px. Line icons use `currentColor`, stroke 2, round caps.

- Painted: `para` (gold coin with a star), `elmas` (blue diamond with facets), `cevher.<bolge>` (coal lump; S2 ores), `sepet` (ore cart), `asansor` (cabin), `madenci` (helmeted miner bust), `kasa` (padlock with coin), `kazma` (pickaxe, nav), `harita`, `yonetici`, `arastirma` (flask), `magaza` (shopfront with awning), `hediye`, `madalya`, `kilit`, `yildirim` (ability), `topla` (coin stack, 3 coins).
- Line: `ayar` (gear), `konum` (pin), `yukari` (arrow up), `arti`, `tik` (check), `kapat` (X), `geri` (arrow left), `bilgi` (i), `uyari` (triangle), `oynat` (▶ ad), `saat`, `ses`, `sessiz`, `titresim`, `ileri` (chevron).

---

## 5. Art and animation

### 5.1 Art direction

The look is painterly "big studio" 2D: warm lantern light against cool deep-teal surroundings, chunky readable silhouettes, soft rim light, no hard black outlines on scene art (outlines only on UI icons). Every scene element is drawn in code at load into offscreen caches (baked), so per-frame work is only `drawImage` plus a few transforms.

### 5.2 Techniques (`js/sahne/cizim.js`)

- **Baked noise**: one 256×256 value-noise tile (2 octaves, seeded) and one 128×128 grain tile, generated once with ImageData. They are used as `createPattern` overlays at 6–14% alpha with `multiply` (rock, timber, paper) or `soft-light` (sky, sea).
- **Layered gradients**: every surface uses a 3-stop vertical gradient plus a radial light gradient from the main light (top-left for the surface, lanterns underground).
- **Rim light**: after filling a shape, stroke its upper-left edge with a 1.5 px light colour at 35% clipped to the shape (helper `kenarIsik(ctx, yol, renk)`).
- **Soft drop shadows**: baked into caches with `shadowBlur` 6–12 at bake time only. Never `shadowBlur` per frame.
- **Additive glow**: a cached radial sprite (white core → warm amber → 0) drawn with `globalCompositeOperation = 'lighter'` for lanterns, the sale sparkle and ability auras.
- **Vignette**: a CSS radial-gradient overlay on `#maden` (pointer-events none), not canvas.
- **Rock strata**: per region, 4 colour bands with wavy boundaries (sum of two sines plus noise), embedded pebbles (ellipses with rim light), and coal seams (dark glossy streaks with tiny specular dots).
- **Timber**: planks with a vertical gradient, grain lines (noise-stretched), dark knots, iron brackets with a highlight dot.

### 5.3 Scene composition, Zonguldak [S1]

Art palette: sky #7EC8E3 → #BFE6F2 → #F3E3C3 (horizon haze); far hills #4F8FA0 / #6AA4A8; sea #2E6A78 → #23535E with a highlight band #6FB3BF; green hills #3E8A4A / #5FA45A; grass #6DAA3F; soil #6B3F22; rock #4A2E1C / #3A2416 / #2A1A10; coal #1F2326 with a specular #9FB7C9; lantern light #FFC873; timber #8A5A32 / #6B4425; steel #6E7A86 / #A9B4BE; depot roof #B8432F; sale house wall #C4553B with a #8E3426 roof.

**Surface band** (0–128), back to front:
1. Sky gradient with 3 soft cloud blobs (baked, drift 4 px/s parallax).
2. Far mountains, blue-hazed.
3. Sea (y 52–100) with a baked shimmer texture scrolled horizontally at 6 px/s, with 2 ships: a cargo ship at the left moving across the sea in 120 s (bobbing ±1 px over 3 s) and a small boat.
4. Lighthouse on a rock at x ≈ 30% (white and red bands, a lamp glow pulsing every 4 s).
5. Green hills left and right, trees as clustered circles with rim light.
6. Ground line at y 104 (grass lip + soil to 128).
7. **Headframe** (steel lattice tower) above the shaft column, x `kuyuX − 6` to `kuyuX + kuyuG + 6`, rising to y 18, with a sheave wheel at the top. The wheel rotates while the elevator moves (direction matches) and its cables run down into the shaft.
8. **Satış house** (red wall, dark roof, a door, a small `SATIŞ` sign plate, Baloo 800 9 px painted at bake) at the right edge above the right column, x `sagX − 18` to W, y 64–104.
9. Carriers' ramp: a plank ramp from the DEPO door (row 1, right column) up the rock face to the Satış door.

**Mine row background** (baked per row index, seeded variety):
- Rock strata across the full width (behind the cards too, visible in the 8 px margins and the 12 px gaps between cards).
- **Chamber**: a carved cave rectangle (x `odaX`, y +8, w `odaG`, h 112) with irregular top corners. Its back wall is a darker noise-textured cave (#2C1C13 → #1A0F0A) with a warm light pool on the floor. A timber frame: two posts and a lintel beam (mockup), the lintel just above the chamber top. Floor planks at y +100 with rails.
- **Lanterns**: 2 per chamber (x at 25% and 75% of the chamber, y +18), iron cage bodies baked; glow sprites per frame.
- **Shaft column**: dark vertical well, steel guide rails (two vertical bars with bolts every 32 px), a ladder texture behind, a horizontal steel band at each floor with a landing lip on the chamber side.
- **Right column**: rock with props per row (seeded: hanging lantern, crates, pipe, ore vein glints).
  - **Row 0 holds the DEPO**: a building in a cut niche, x `sagX − 8` to W, y −22 (into the surface band) to +104. It has a red roof, plank walls, a sign plate `DEPO` (Baloo 800 10 px, dark text on #F6C453, painted at bake), an open door where carriers appear, a hopper chute on its left fed by the elevator, and a yellow ore cart inside whose pile height shows depot fill.
  - Grass ledge under it, as in the mockup.

**Dynamic elements** (per frame):
- Miners.
- Chamber ore cart: the pile sprite is chosen from 5 baked fill levels; its content shows `yigin / yiginKap`. A `DOLU` tag (red pill painted at bake) appears when full.
- Elevator cabin.
- Depot cart pile (5 levels).
- Carriers.
- Lantern glows (alpha `0.82 + 0.10·sin(t·7.3 + tohum) + 0.06·gürültü`).
- Dust motes (6 per visible chamber, slow drift in the light pool).
- Particles and floating numbers.

**Elevator cabin**: steel cage 34 px wide (at kuyuG 38), 44 tall, glass panes with a reflection streak, an up arrow `--para` plate when ascending (mockup), and an ore heap visible inside proportional to `yuk/kap`. The cable runs from the headframe. On stops it does a 2 px settle bounce (150 ms). Tiers: the frame becomes polished steel from L50 and gets gold trim from L200 (baked variants).

**Regions [S2]**: one palette and prop set per region in `js/sahne/bolgeler.js` (`zonguldak` sea and lighthouse; `bartin` coast and wooden boats; `kastamonu` pine forest and copper-green rock; `karabuk` steel-mill chimneys with smoke; `gumushane` high mountains, grey strata with silver glints; `artvin` river valley, golden veins). Ores: kömür #1F2326, manganez #4A4048 with a #B07A8E sheen, bakır #B8642E with a #E3A06A sheen, demir #6A5048 with a #A57A6A sheen, gümüş #9AA6B2 with white, altın #D9A21B with #FFE28A.

### 5.4 Characters

**Miner** (readable at 40 px tall): yellow helmet #F2B632 with a headlamp (a tiny glow cone when inside chambers), face skin #E8B48A with a stubble shade, blue overalls #2F5FA8 / #23477F with orange straps #D9772B (mockup), brown boots, gloves #C9A27A, pickaxe (steel head with a highlight, wooden handle). Proportions: head 34% of height (cute but not chibi), slight squash on strikes. Drawn with paths at bake time into an atlas at `min(dpr, 2)` scale, frame cell 48×56 px.

| Anim | Frames | Timing | Notes |
|---|---|---|---|
| `kaz` (dig) | 8 | 0.6 s/loop: wind-up 3 (0.25 s), strike 2 (0.10 s), recover 3 (0.25 s) | strike frame spawns 3–5 sparks and dust and a 1 px chamber shake (only for the tapped manual shaft) |
| `yuru` (walk) | 8 | 0.8 s | carriers, when not pushing |
| `it` (push cart) | 8 | 0.9 s | carriers with a small cart |
| `bekle` (idle) | 4 | 1.6 s | breathing; every 6–9 s a 0.8 s brow-wipe variant (4 extra frames) |
| `sevin` (cheer) | 6 | 0.9 s | on upgrade or milestone, once, then back to the previous state |
| `otur` (sit, stash full) | 2 | 2.0 s | sitting on an ore lump |

Variants: 2 skin tones and 2 moustache states chosen by seed, applied at bake (4 variants × 36 frames ≤ 2.2 MB at DPR 2). Left-facing frames are mirrored at draw time with `scale(-1,1)`. Shafts show `madenciSayisi` miners at fixed slots (20%, 50% and 72% of the chamber width) and the cart at 80%. The 3rd miner pushes the cart back and forth. Miners are desynchronised by seed offsets.

**Elevator operator**: a small figure inside the cabin (head and shoulders only, 1 frame plus a 2-frame lever pull at departure).

**Carriers**: the same miner with a red cap instead of a helmet, pushing a small cart from the DEPO door up the ramp (path: 3 linear segments, positions from the sim's `t/sure` phase) to the Satış door, disappearing for the `satiyor` time (a coin sparkle at the door), then walking back without the cart (`yuru`, mirrored).

**Manager portraits**: 64×64 bust from a seed: helmet colour by rarity (Sıradan white, Nadir blue #4A90E2, Efsanevi gold #F6C453 with a shine), tie or scarf, moustache or hair variants, glasses at 20%. Painted to a canvas in the DOM via `Sahne.portre`.

### 5.5 Particles and floating numbers (`js/sahne/parcacik.js`)

A pooled system (fixed array of 256 particle objects, no allocation after init), types:

| Tür | Spawn | Look | Life |
|---|---|---|---|
| `toz` | strike, excavation, cart dump | brown-grey soft dots 2–4 px, drift up and fade | 0.6–1.2 s |
| `kivilcim` | strike | additive amber streaks 1×4 px, gravity | 0.25–0.4 s |
| `parca` | elevator unload, depot dump | coal chunks 3–5 px with rim light, gravity, bounce once | 0.5 s |
| `sikke` | sale at Satış | 4 small coins pop up and fade | 0.7 s |
| `parilti` | milestone, ability | additive 4-point stars, scale in and out | 0.6 s |
| `konfeti` | level-up (effect canvas) | 60 rectangles in token colours, flutter | 2.2 s |
| `sayi` | sale (aggregated at most every 450 ms per anchor) | `+1,2 bin` Baloo 800 14 white with a 2 px dark stroke, rises 28 px, fades in the last 30% | 1.1 s |

Quality `Dengeli` halves the counts. `Pil Tasarrufu` disables `toz`, `kivilcim` and dust motes and caps rendering at 30 fps.

### 5.6 UI motion (CSS/WAAPI, transform and opacity only)

| Hareket | Tanım |
|---|---|
| button press | pointerdown: scale .96 + translateY 1px, 80 ms ease-out; release: spring back 160 ms `cubic-bezier(.3,1.6,.5,1)`; sound `tik` |
| card level-up pulse | §4.6 table |
| progress fill | `transform: scaleX` 400 ms `cubic-bezier(.2,.8,.2,1)` (bars use a scaleX inner element, never width) |
| coin fly | 6–14 pooled `<i class="ucan-sikke">` (24 in the pool); arc via WAAPI keyframes from the source to the HUD coin, 650–900 ms, stagger 40 ms; arrival pulses the pill and plays `para` once |
| toast in/out | §4.11 |
| page transition | in: translateY 24→0 + fade 240 ms; out: 180 ms |
| sheet / modal | §4.10 |
| nav tile bounce | §4.7 |
| shine on affordable buttons | §4.6; at most 6 visible shines, start times staggered by row index × 0.4 s |
| arrow badge bob | 1.2 s loop, 2 px |
| Topla x2 breathing | §4.6 |
| milestone ribbon | drops from −20 px with an overshoot, holds, fades (1.4 s) |
| warning shake | 2 × 4 px, 300 ms |
| number roll | HUD values ease; card level text: the old number slides up and out, the new one in (200 ms) |

`prefers-reduced-motion: reduce` disables shines, breathing, bobs, shakes and confetti; transitions become 120 ms fades.

### 5.7 Sound hooks (`js/ses.js`, reused procedural WebAudio)

| Olay | Ses |
|---|---|
| any UI tap | `tik` |
| sheet/page open | `ac` |
| coin-fly arrival, offline collect | `para` |
| upgrade bought | `yukselt` (rate-limited by ses.js) |
| milestone | `esik` |
| manual elevator or depot send | `gonder` |
| manual dig tap | `kazma` |
| shaft opened | `kazi` then `galeri` |
| manager hired | `usta` |
| ability | `yetenek` |
| level up | `ocak` |
| reward claim / ad reward | `odul` |
| quest done [S2] | `gorev` |
| boost started | `davul` |
| error, not enough money | `hata` |
| region opened [S2] | `kervan` |

Vibration: `titret(15)` on purchase, `[20,40,20]` on rewards (respects `ayarlar.titresim`).

### 5.8 Replaceable asset map (`js/sahne/varliklar.js`)

```js
// key -> { w, h, ciz: (ctx, w, h, secenek) => void }   or   { w, h, png: 'img/....png' }
VARLIK = {
  'yuzey.zonguldak': { w: 'W', h: 128, ciz: yuzeyCiz },        // 'W' = world width at bake
  'satir.zonguldak.0'..'.7': { w: 'W', h: 128, ciz: satirCiz }, // 8 seeded variants, rows cycle
  'depo.bina', 'satis.ev', 'kuyu.basi', 'asansor.kabin.0|1|2', 'yigin.0'..'yigin.4',
  'madenci.<varyant>.<anim>.<kare>', 'tasiyici.<anim>.<kare>', 'kandil.isik', 'cevher.zonguldak', ...
}
```

`Varliklar.kaydet(anahtar, tanim)`, `Varliklar.png(anahtar, url)` (override, loaded async; it replaces the baked canvas when decoded), `Varliklar.al(anahtar)` → `CanvasImageSource`, `Varliklar.hazirla(anahtarlar, ilerleme)` → Promise (bakes in chunks of ≤ 8 ms per task via `setTimeout(0)` so the splash bar animates), `Varliklar.bellek()` → bytes. All scene drawing must go through `Varliklar.al`, so painted PNGs can replace any sprite without touching the renderer.

---

## 6. Architecture

### 6.1 Files and owners

```
cevher-2d/
  index.html                 D  body fragment: <title>, fonts, css links, #oyun skeleton, <script type="module" src="js/ana.js">
  package.json               D  {"private":true,"type":"module","scripts":{"test":"node --test test/","oyna":"node test/oyna.mjs"}}
  css/temel.css              C  tokens, reset, typography, buttons, pills, bars, switches, segmented
  css/oyun.css               C  HUD, stats, mine view, cards, badges, bottom overlay, nav
  css/pencereler.css         C  sheets, modals, toasts, tutorial, ad overlay, splash
  css/sayfalar.css           C  pages (S1: yöneticiler + placeholder; S2: harita, araştırma, mağaza)
  js/ayar.js                 A  all constants and data tables (§2), frozen objects
  js/bicim.js                A  formatting (§4.12)
  js/ekonomi.js              A  pure formulas
  js/durum.js                A  yeniDurum, yeniBolge, dogrula, GOCLER, PRNG
  js/benzetim.js             A  fixed-step sim + actions (eylem)
  js/cevrimdisi.js           A  offline compute/apply
  js/kayit.js                A  persistence, backup, old-save import
  js/olay.js                 A  tiny event list + bus
  js/yerlesim.js             B  world layout (§4.3), pure
  js/sahne/sahne.js          B  renderer entry
  js/sahne/cizim.js          B  drawing helpers, noise
  js/sahne/varliklar.js      B  asset map, baking, PNG overrides
  js/sahne/yuzey.js          B  surface band art
  js/sahne/satir.js          B  row/chamber/shaft/depot art
  js/sahne/madenci.js        B  characters + atlas
  js/sahne/parcacik.js       B  particles, floating numbers, effect canvas
  js/sahne/bolgeler.js       B  region art palettes (S1: zonguldak)
  js/arayuz/arayuz.js        C  UI root, binding loop, delegation
  js/arayuz/ust.js           C  HUD + stats
  js/arayuz/kartlar.js       C  cards, badges, chips, next-shaft card (DOM world layer)
  js/arayuz/alt.js           C  bottom overlay + nav
  js/arayuz/pencereler.js    C  sheet/modal system and all modals
  js/arayuz/bildirim.js      C  toasts
  js/arayuz/sayfalar.js      C  pages
  js/arayuz/ogretici.js      C  tutorial
  js/arayuz/ikonlar.js       C  SVG strings
  js/kaydirma.js             D  custom scroll + tap/long-press detection
  js/ses.js                  D  ported from old ses.js
  js/reklam.js               D  ported from old reklam.js
  js/magaza.js               D  ported from old magaza.js (S2 UI, file may land in S1)
  js/ana.js                  D  boot, loop, wiring, visibility, debug hook
  test/*.test.mjs            A  node tests; test/kayitlar/*.json fixtures (A)
  test/sunucu.mjs, test/oyna.mjs, test/ekran/   D  harness
  araclar/paketle.mjs        D  builds dist/ (full index.html + assets) for Capacitor
```

Rules:
- Modules A (`ayar`, `bicim`, `ekonomi`, `durum`, `benzetim`, `cevrimdisi`, `olay`) never touch `window`, `document` or `localStorage` at import or in functions. `kayit.js` takes a storage object parameter. They are runnable under `node --test`.
- No module except `ana.js` and `kaydirma.js` calls `requestAnimationFrame`.
- No external libraries or CDNs. Google Fonts is the only network dependency.
- Relative import paths with `.js` extensions everywhere.

### 6.2 Load order and boot (`ana.js`)

1. The splash `#acilis` is in the HTML (static: dark teal, painted pickaxe+gem SVG, `Cevher Madenci` Baloo 800 30 `--para`, tagline, bar).
2. `kayit.yukle(localStorage)` → durum (or import or new).
3. `Arayuz.kur(...)` builds the DOM.
4. `await document.fonts.ready` (timeout 1.5 s).
5. `await Sahne.kur(...)`, which bakes assets with progress shown on the splash.
6. `cevrimdisi.hesapla` → apply → queue the modal.
7. Start the loop.
8. Fade the splash (400 ms). Total boot target ≤ 1.5 s on desktop, ≤ 3 s on a mid-range phone.

If baking throws, the renderer falls back to flat colour drawing (each `Varliklar.al` miss returns a 1×1 swatch), shows `Görsel yüklenemedi, sade görünüm kullanılıyor.` and the game stays playable.

### 6.3 Global debug/test hook

`window.__cevher = { hazir: bool, durum, eylem(ad, veri), zamanAtla(sn), kareler: Float32Array(600) ring of frame intervals, isler: Float32Array(600) ring of per-frame work ms, sayac: { domYazim, ciz }, kaliteAyarla(k), bellek() }`. It exists in all builds (harmless). `zamanAtla` runs the offline path with a fake `son`.

Optional, kept from the old game: `window.claude?.hot?.snapshot?.(() => ({ durum }))` and `window.claude?.hot?.ready`. These are guarded no-ops if absent.

### 6.4 State and simulation (A)

`durum` = the saved schema (§3.2) + `durum.calisma` (runtime):

```js
calisma: {
  bolge: 'zonguldak',
  madenler: [{ calisiyor: bool, dolu: bool }],                       // derived each step
  asansor: { durum: 'bekle', konum: 0, onceki: 0, hedef: 0, t: 0, yuk: 0, durak: -1 },
  tasiyicilar: [{ durum: 'bekle', t: 0, sure: 0, yuk: 0, onceki: 0 }], // t = phase seconds
  gelirEma: 0, uretimGecmis: Float64Array(10), darbogaz: null, darbogazSayac: {...},
  sonKayit: 0, kirli: false
}
```

The renderer interpolates with `onceki`/current.

**API (`benzetim.js`):**

```js
export const ADIM = 0.05                        // s, fixed step
export function adim(durum, dt, olaylar)        // advances one step; dt is always ADIM except catch-up
export function eylem(durum, ad, veri, olaylar) // -> { ok: true } | { ok: false, sebep: 'para'|'elmas'|'kilit'|'maks'|'dolu'|'gecersiz' }
export function hazirla(durum)                  // rebuild calisma from saved fields (after load/region switch)
```

**Actions (`ad`, `veri`):**

| ad | veri | Etki |
|---|---|---|
| `yukselt` | `{ istasyon, adet: 1\|10\|50\|'max' }` | §2.10 |
| `madenAc` | `{ i }` | §2.4 |
| `dokun` | `{ istasyon }` | manual cycle/trip/send (ignored with a manager; returns `{ok:false, sebep:'otomatik'}`) |
| `yoneticiTut` | `{ tip, odeme: 'para'\|'elmas', istasyon? }` | hire + roll + auto-assign |
| `yoneticiAta` | `{ id, istasyon }` | assign (swaps out a current manager into the pool) |
| `yoneticiCikar` | `{ istasyon }` | unassign |
| `yetenek` | `{ istasyon }` | activate ability |
| `takviye` | `{ dakika: 30 }` | after the ad reward (cap §2.12) |
| `cevrimdisiTopla` | `{ kat: 1\|2 }` | credit `bekleyenCevrimdisi × kat` |
| `alimModu` | `{ mod }` | set buy mode |
| `ayar` | `{ anahtar, deger }` | settings |
| `ogretici` | `{ adim }` | tutorial progress |
| `sifirla` | `{}` | new game (keeps `satin`, settings) |
| [S2] | | `bolgeAc`, `bolgeGit`, `arastirmaBaslat`, `arastirmaHizlandir`, `arastirmaBitir`, `gorevAl`, `hediyeAl`, `elmasHarca`, `zamanAtla`, `urunVer` |

**Events** (`olaylar` is an array the caller drains each frame; plain objects `{ tip, ... }`):
- `yukseltildi {istasyon, eskiL, yeniL, kademeler}`
- `madenAcildi {i}`
- `kaziBasladi {i, manuel}` (once per manual cycle; automated shafts emit nothing per cycle)
- `asansorKalkti {manuel}`
- `asansorDurak {kat, miktar}`
- `bosaltildi {miktar}`
- `tasiyiciCikti {k}`
- `satis {miktar, para}`
- `doldu {istasyon}`
- `bosaldi {istasyon}`
- `darbogaz {tur}`
- `yoneticiTutuldu {yonetici, istasyon}`
- `yoneticiAtandi`
- `yetenek {istasyon, yonetici}`
- `yetenekBitti {istasyon}`
- `yetenekHazir {istasyon}`
- `xp {miktar, kaynak}`
- `seviyeAtladi {lv, elmas, acilan}`
- `takviye {bitis}`
- `paraDegisti` (coalesced: at most one per step)
- `ogretici {adim}`

Rate bound ≤ 40 events/s in normal play.

**Step order** (each `adim`):
1. `zaman += dt`.
2. Ability expiry/ready checks.
3. Shafts produce.
4. Elevator state machine.
5. Carriers state machine.
6. Every 0.5 s: stats EMA and the bottleneck check.
7. Every 30 s: production history sample.
8. `kirli` flag.

The step is pure given (durum, dt) and the seeded PRNG: identical inputs give identical outputs.

**`ekonomi.js` exports (pure, `b` = region object, `d` = durum):**
`kademeSayisi(L, liste)`, `guc(L, liste)`, `kademeIlerleme(L, liste)`, `sonrakiKademe(L, liste)`, `madenUretim(d, b, i, L)`, `madenMaliyet(d, b, i, L)`, `madenAcilis(d, b, i)`, `yiginKap(d, b, i)`, `madenciSayisi(L)`, `asansorKap(d, b)`, `asansorHiz(d, b)`, `asansorAkis(d, b)`, `tasiyiciSayisi(L)`, `tasiyiciYuk(d, b)`, `depoYol(d, b)`, `depoKap(d, b)`, `depoAkis(d, b)`, `istasyonMaliyet(d, b, istasyon, L)`, `topluMaliyet(c1, g, k)`, `alinabilir(c1, g, para, ust)`, `teklif(d, b, istasyon, mod)` → `{adet, maliyet, yeniL, maks, yetiyor}`, `kiralamaMaliyeti(d, b, tip)`, `uretimCarpani(d, b, i)`, `satisKalici(d)`, `satisCarpani(d)`, `kapasiteler(d, b)` → `{P, A, D}`, `otoGelir(d, b)`, `toplamUretim(d, b)`, `xpGerek(L)`, `harcamaXp(d, b, para)`, `yetenekDurum(d, y)` → `{durum:'hazir'|'aktif'|'bekleme', kalan, oran}`.

**`cevrimdisi.js`:** `hesapla(durum, simdiMs)` → `{gecen, t, miktar, sinirli, geriAlindi, eksikYonetici}`, and `uygula(durum, sonuc)` (advances `zaman`, sets `bekleyenCevrimdisi`, updates `enGec`).

**`kayit.js`:** `ANAHTAR`, `yukle(depo, simdiMs)` → `{durum, kaynak:'kayit'|'yedek'|'aktarim'|'yeni', uyari?}`, `kaydet(durum, depo, simdiMs)` → bool, `serilestir(durum)` → string, `coz(str)` → durum.

**`olay.js`:** `export function yeniOlayListesi()` → array, and `export const Veriyolu = { dinle(tip, fn), yayinla(olay) }` for UI-only cross-talk (C ↔ D).

### 6.5 Renderer (B)

```js
export const Sahne = {
  async kur({ tuval, efektTuval, durum, ilerleme }),      // bake, set contexts ({alpha:false} for #sahne)
  boyutla({ gen, yuk, dpr }),                             // CSS size of #maden, device dpr; applies the DPR cap (§7)
  ciz(durum, gorunum, simdiMs, alfa),                     // gorunum = { kaydirY, gen, yuk, gorunur: bool }
  olaylar(liste, durum),                                  // consumes sim events for one-shot effects
  isabet(x, y, durum) -> { istasyon } | null,             // world coords; chamber, cabin column, depot, chips excluded (DOM)
  ekranKonumu(capa, durum) -> { x, y } | null,            // 'm3' | 'asansor' | 'depo' | 'satis' in #oyun coordinates
  bolgeRozeti(kod, canvas), portre(tohum, nadirlik, canvas, boyut),
  efekt: { patlat(x, y, tur, adet), kare(simdiMs) },      // effect canvas, UI coordinates
  bellek() -> bytes
}
```

- **Layering inside `ciz`**:
  1. Clear is not needed (opaque backgrounds cover everything).
  2. Surface band if visible.
  3. Row backgrounds for visible rows only (culling: rows intersecting [kaydirY − 64, kaydirY + yuk + 64]).
  4. Shaft column and cables.
  5. Per visible row: pile/cart, miners, `DOLU` tag.
  6. Elevator cabin.
  7. Depot cart pile, carriers, ramp traffic.
  8. Additive pass (lantern glows, sparkles).
  9. Particles.
  10. Floating numbers.
- **Resize**: rebakes width-dependent caches (`yuzey`, `satir.*`) in the next idle chunk and keeps drawing scaled old caches until done.
- **Region switch [S2]**: bake the new set behind the region transition.
- **Pause**: when `gorunur` is false (a page is open or the document is hidden), `ciz` returns immediately.

### 6.6 UI layer (C)

```js
export const Arayuz = {
  kur(kok, { eylem, reklamIzle, durumAl, yerlesim, sahne }),  // builds DOM from template strings once
  dunya,                                                    // #dunya element (D sets its transform)
  kare(durum, gorunum, simdiMs),                            // throttled internal binding
  olaylar(liste, durum),                                    // toasts, pulses, coin fly, modals
  modalAc(ad, veri), sayfaAc(ad), bildir(tur, metin, secenek),
  dokunusHedefi(el) -> 'ui' | null                          // used by kaydirma to know if a DOM control was hit
}
```

- **DOM is built once**: 12 card nodes are created up front (hidden until opened). Pages are built on first open and then updated in place. No `innerHTML` rebuilds in the binding loop.
- **Binding rates**: HUD and counters 10 Hz; cards (visible rows only), stats and bottom overlay 4 Hz; manager badge rings 10 Hz via a CSS custom property `--oran` driving a conic gradient; pages 2 Hz.
- **Writes**: through `yaz(el, metin)` and `sinif(el, ad, varMi)` caches (as in the old `arayuz.js`). Each write increments `__cevher.sayac.domYazim`.
- **Events**: one delegated `click` listener on `#oyun` reading `data-eylem` / `data-istasyon` / `data-sekme` attributes. All buttons are `<button>` with `aria-label` where icon-only. Long-press is reported by `kaydirma.js` through `Veriyolu` (`uzunBasma {el}`, `uzunBasmaBitti`).
- **Tutorial**: reads `data-ogretici` targets and uses `Sahne.ekranKonumu` for canvas targets.

### 6.7 Input and scrolling (`kaydirma.js`, D)

- Pointer Events on `#maden` (`touch-action: none`), with single-pointer tracking.
- **Drag** starts after 8 px of movement. Content follows 1:1. Velocity comes from samples of the last 80 ms.
- **Release**: inertia `v *= exp(-dt/0.325)`, stopping when |v| < 12 px/s.
- **Bounds**: 0 to `dunyaH − gorunurYuk + 80` (the extra 80 lets the last row clear the bottom overlay). Rubber band beyond the bounds: displacement × 0.5 / (1 + |d|/300). Spring back is critically damped with ω = 16.
- **Mouse wheel**: deltaY scrolls with a 120 ms ease (for desktop and Playwright).
- **`kaydirKonumu(y, {anim})`**: programmatic scroll, eased over 450 ms `easeOutCubic`.
- **Tap**: pointerup with < 8 px movement and < 350 ms. If the target is a DOM control, let its click fire. Otherwise map to world coordinates (`y + kaydirY`) → `Sahne.isabet` → `eylem('dokun', ...)`, or open the upgrade sheet when the station has a manager.
- **Long-press**: ≥ 350 ms without movement on an element with `data-uzun` (Yükselt buttons).
- **After a drag**: a capture-phase click canceller suppresses the click.
- **Sync**: `kaydirY` is applied in the same rAF as `Sahne.ciz` via `dunya.style.transform = translate3d(0, -kaydirY px, 0)`, written only when changed. This keeps the DOM cards and the canvas in perfect sync. Never use native scrolling for the mine view.

### 6.8 Main loop, timing and visibility (`ana.js`, D)

```js
function kare(simdiMs) {
  const t0 = performance.now()
  let dt = Math.min(0.25, (simdiMs - onceki) / 1000); onceki = simdiMs
  birikim += dt; let n = 0
  while (birikim >= ADIM && n < 8) { Benzetim.adim(durum, ADIM, olaylar); birikim -= ADIM; n++ }
  if (n === 8) birikim = 0
  kaydirma.ilerle(dt)
  if (olaylar.length) { Sahne.olaylar(olaylar, durum); Arayuz.olaylar(olaylar, durum); sesler(olaylar); olaylar.length = 0 }
  Sahne.ciz(durum, gorunum, simdiMs, birikim / ADIM)
  Sahne.efekt.kare(simdiMs)
  Arayuz.kare(durum, gorunum, simdiMs)
  otoKayit(simdiMs)
  kayitOlcum(simdiMs - oncekiKare, performance.now() - t0)
  requestAnimationFrame(kare)
}
```

- In `Pil Tasarrufu` mode, rendering is skipped on alternate frames (the sim still runs).
- **`visibilitychange`**:
  - hidden: save, stop rAF, `Ses` suspend.
  - visible: if hidden ≥ 60 s → offline path; else catch-up steps (max 1200); restart rAF with `onceki = now`.
- **Error handling**: the loop body is wrapped in try/catch. On the first exception, log it, keep running, and show the info toast `Bir hata oluştu, oyun devam ediyor.` (once per session). Three exceptions within 5 s → stop the loop, save, and show a modal `Bir sorun oluştu` with `Yeniden Başlat` (reload).
- Errors in `Reklam` / `Magaza` resolve to `false`.

### 6.9 Ported bridges (D)

- **`reklam.js`**: copy the old file verbatim. Then change it to `export const Reklam`, add `Reklam.kur({ durumAl, kok })`, replace `D?.satin?.reklamsiz` with `durumAl()?.satin?.reklamsiz`, and replace `document.getElementById('app')` with the `kok` element (`#oyun`). Everything else stays the same: `ODULLU_ID`, the `calisiyor` lock, the AdMob calls, the 2 s `Reklam alanı` preview, and the `izle(yer)` → Promise<boolean> and `gercek()` API.
- **`magaza.js`** [S2 UI; the file may be ported in S1]:
  - Same structure, product IDs and `cordova-plugin-purchase` flow. `URUNLER` per §2.16.
  - Inject `kur({ durumAl, elmasEkle, takviyeEkle, yoneticiVer, kaydet, yayinla })`:
    - `cevherEkle(u.n)` → `elmasEkle(u.n)`
    - `D.altinBitis` logic → `takviyeEkle(240)`
    - `baslangic` → also `yoneticiVer({ nadirlik: 2 })`
    - `Olay.yayinla('satinAlindi', {u})` → `yayinla({ tip: 'satinAlindi', u })`
  - `SATIN_ANAHTAR` unchanged. The browser fallback still grants the item, and the UI shows ` (deneme: ödeme alınmadı)`.
- **`ses.js`**: copy, export `Ses`, replace the `D.ses` / `D.titresim` checks with an injected `ayarAl()`.

---

## 7. Performance budget

| Kalem | Bütçe |
|---|---|
| Frame | 60 fps target. Unthrottled headless 390×844 DPR 2: p95 frame interval ≤ 18 ms, ≤ 1% of frames > 34 ms during the scroll test |
| Our work per frame (sim + render commands + UI binding), measured in-page | p50 ≤ 1.5 ms, p95 ≤ 3 ms unthrottled; p95 ≤ 8 ms and max ≤ 25 ms (after the first 3 s) under CDP 4× CPU throttle |
| Long tasks (> 50 ms) | 0 during play; boot baking chunks ≤ 8 ms each |
| Sim | ≤ 0.2 ms per step; ≤ 8 steps per frame |
| Canvas | `#sahne` backing store = CSS size × min(dpr, cap). Cap: `Yüksek` 2, `Dengeli` 1.5, `Pil Tasarrufu` 1.25 (≈ 780×1240 = 0.97 Mpx at 390 wide). Effect canvas same cap, cleared only while particles live |
| Caches | all baked canvases ≤ 48 MB total (`Varliklar.bellek()`); row variants 8 (not per row); character atlas ≤ 2.5 MB |
| Draw calls | ≤ 250 `drawImage`/frame at 12 visible-shaft worst case; no `shadowBlur`, `filter` or `getImageData` per frame; ≤ 8 `fillText` per frame |
| DOM | ≤ 12 text/class writes per frame on average (`__cevher.sayac.domYazim`); no layout reads (`getBoundingClientRect`) in the binding loop except for coin-fly start and tutorial (once per event); only `transform`/`opacity` animations |
| Allocation | render loop, particles, binding: zero allocations per frame (preallocated pools, reused arrays, no closures in loops); sim events allowed (bounded rate) |
| Memory | JS heap ≤ 40 MB after 10 min of play |
| Boot | ≤ 1.5 s desktop (cached fonts), ≤ 3 s mid-range phone |

Measurement: `ana.js` records frame intervals and work ms into `__cevher.kareler` / `__cevher.isler`. A `PerformanceObserver('longtask')` counts into `__cevher.sayac.uzun`. The harness reads them (§8.2).

Grounding: a micro-benchmark in this container with ~200 sprite draws, 6 row blits and 12 additive glows at DPR 2 measured 0.3 ms work unthrottled and 1.3 ms p50 / 2.4 ms p95 under 4× throttle. Under 4× throttle, headless Chromium's frame interval is about 33 ms even for an empty frame, so frame intervals are only judged unthrottled and work time is judged throttled.

---

## 8. Test plan

### 8.1 Node tests (`node --test test/`, A) [S1]

- **`bicim.test.mjs`**: the examples in §4.12, negatives, ∞, suffix rollover (`999,9 bin` → `1 mn` boundary), `sure`/`sayac`.
- **`ekonomi.test.mjs`**:
  - `madenUretim(0,1)=1`, `madenUretim(0,10)=20`, `madenUretim(0,25)=100`;
  - `madenMaliyet(0,1)=4`; `madenAcilis(1)=40`;
  - `asansorKap(1)=20`; `tasiyiciSayisi(150)=4`;
  - `guc` doubles at every milestone;
  - `topluMaliyet` equals the loop sum (rel. error < 1e-9);
  - `alinabilir` is never over budget and is maximal;
  - `xpGerek(12)=1200`, `xpGerek(20)=round(2000*1.03^8)`;
  - all formulas monotonic in L.
- **`benzetim.test.mjs`**:
  - Determinism: two runs of 10 min with the same seed and action script give an identical `serilestir` output.
  - Conservation: produced = Σyığın + cabin + depot + carriers + sold (rel. 1e-9), and para gained = sold × satisCarpani.
  - The elevator visits shafts top-down, respects capacity, skips empty stashes, and returns when full.
  - A full depot blocks unloading and production stops at `yiginKap`.
  - A manual shaft produces exactly `rate × 3 s` per tap.
  - Bottleneck rises after 3 s and clears after 5 s.
  - Ability timing and cooldown.
  - The manager rarity distribution over 10k rolls is within ±1.5% of the odds.
- **`cevrimdisi.test.mjs`**: earnings = otoGelir × min(gecen, cap); zero without managers; boost overlap; clock rollback → 0 and the warning flag; `zaman` advances uncapped.
- **`kayit.test.mjs`**: round trip; whitelist (no `calisma` saved); corrupt → backup; a future version goes to `cevher2d-gelecek`; `dogrula` fixes NaN and out-of-range values; old 3D import (fixture `test/kayitlar/eski-v3.json`).
- **`denge.test.mjs`** (pacing):
  - The real `benzetim` runs with a bot. Tutorial order first, then greedy: choose the action minimising `maliyet/Δdeğer + bekleme`, where değer is the soft-min `(P⁻⁴+A⁻⁴+D⁻⁴)^(-1/4)` of chain capacities; managers when cost ≤ 180 s income; shaft opening valued as open + manager + 24 levels. Manual stations are tapped whenever idle (≤ 1 tap per 0.4 s total).
  - Sessions as §2.17 (offline via `cevrimdisi`), with `ADIM` 0.25 s allowed in this test only.
  - Bands:

| Ölçüt | Bant |
|---|---|
| first upgrade | ≤ 10 s |
| first manager | ≤ 40 s |
| Maden 2 | ≤ 75 s |
| elevator manager | ≤ 4 dk |
| depot manager | ≤ 6 dk |
| Maden 3 | 3–9 dk |
| Lv. 5 | 6–20 dk |
| Lv. 12 | 6 sa – 1.5 gün |
| [S2] Lv. 20 | 1.2–4 gün |
| [S2] Lv. 35 | 5–12 gün |
| [S2] Lv. 50 | 12–28 gün |

  - In S1 (one region) the test runs 2 days. The S2 bands run when regions exist.
  - Runtime ≤ 60 s.

Fixtures (A):
- `test/kayitlar/yeni.json`.
- `test/kayitlar/zengin.json`, which reproduces the mockup:
  - Zonguldak, `lv 12, xp 482`, para 318600, elmas 420;
  - Maden 1–4 at L25/18/15/10, Maden 5 at L5;
  - elevator L40, depot L35, managers on all stations (one Efsanevi);
  - depot stock about 68%;
  - `takviye` inactive; tutorial done.
- `test/kayitlar/cevrimdisi.json` (rich save with `son` 3 h ago; the harness rewrites `son` at injection).
- `test/kayitlar/eski-v3.json`.

### 8.2 Playwright harness (`test/oyna.mjs`, D) [S1]

- **Server** `test/sunucu.mjs`: Node `http`, serves the repo root with correct MIME types. `/` returns `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>` + `index.html` + `</body></html>` (the same wrapping as the artifact host).
- **Playwright**: load via `createRequire(import.meta.url)('playwright')` with `NODE_PATH=$(npm root -g)` (ESM `import 'playwright'` does not see NODE_PATH). Browsers come from `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (default in this container, Playwright 1.56). Fonts load from Google Fonts. If offline, the run continues with fallbacks and logs a note (not a failure).
- **Profiles**: `telefon` 390×844 DPR 2 `isMobile hasTouch`; `dar` 360×780 DPR 2.
- **Scenarios**, each profile:
  1. **İlk oyuncu**: clear storage, load, wait `__cevher.hazir`, screenshot `ilk-acilis.png`. Follow the tutorial by tapping the element or canvas point named by `[data-ogretici-aktif]` / `__cevher.ogreticiHedef()` until step 9 or 120 s of game time. Assert the first purchase ≤ 10 s game time and Maden 2 opened ≤ 90 s. Screenshots `ogretici-1..8.png`, `maden2.png`.
  2. **Zengin kayıt**: inject `zengin.json` via `addInitScript`, load. Assert the HUD texts `Zonguldak`, `Lv. 12`, `482 / 1.200`, `318,6 bin`, `420`, the stats labels, four visible cards `Maden 1..4`, and the `Topla x2` button. Screenshot `zengin-ana.png` (the reviewer compares it with `referans.png`).
  3. **Her düğme**: open each nav tab, the gear sheet, an upgrade sheet for m0, the elevator and the depot (each buy mode), a manager modal (hire with para, with elmas, assign, unassign, ability), and the level-up modal (via `__cevher.eylem` giving XP). Click every visible enabled `button` inside each opened surface (except `[data-tehlikeli]`, i.e. reset). Screenshot each surface (`sayfa-*.png`, `modal-*.png`).
  4. **Çevrimdışı**: inject `cevrimdisi.json`, load, assert the offline modal. Click `Topla x2` (the browser preview overlay appears for 2 s). Assert para increased by 2× `miktar`.
  5. **Bottleneck**: from the rich save, raise production (`eylem yukselt m0 max` repeatedly with injected para). Assert the warning toast text `Asansör kapasitesi yetersiz!` appears within 10 s.
  6. **Performans**:
     - Rich save. Scripted 10 s scroll (wheel and touch drags up and down the full world), a 10 s idle watch, then 10 s of rapid upgrades. Read `__cevher.kareler` / `isler` / `sayac`.
     - Repeat with `Emulation.setCPUThrottlingRate {rate: 4}` via a CDP session.
     - Write `test/ekran/performans.json` (p50/p95/p99/max for each, long tasks, DOM writes per frame, cache bytes).
- **Global assertions**: zero `console.error` and zero `pageerror` across all scenarios (a 404 for the fonts when offline is the only allowed exception). Budgets of §7 met. No horizontal page scroll (`scrollWidth ≤ innerWidth`). No text overflow: every `.kart` text node fits (`scrollWidth ≤ clientWidth`).
- **Output**: `test/ekran/<profil>/*.png` and a summary table on stdout. The exit code is non-zero on any failure.

### 8.3 Acceptance criteria for "done" (stage 1)

1. `npm test` passes, including the S1 pacing bands.
2. `npm run oyna` passes all scenarios on both profiles with zero console errors and §7 budgets.
3. `zengin-ana.png` matches the mockup's composition, with every element in the same place and order: HUD (badge, name with pin, level pill with XP, coin and gem pills with green plus, gear), cream stats strip with three columns, surface strip with sea, ships, lighthouse, hills, headframe and red house plus three flow chips with chevrons, cards on the left with chambers (lanterns, timber, two miners, cart) to the right, elevator shaft with cabin, DEPO building top-right, warning slot + flow indicator + `Topla x2` at the bottom, and the five-tab nav with the selected orange tile. Colours are only from §4.1.
4. Playing on a real mid-range Android (Capacitor build via `araclar/paketle.mjs`) shows no visible stutter while scrolling and upgrading. Rewarded ads use AdMob test ads.
5. Save survives a reload and an app kill. The offline modal appears after ≥ 60 s away. The clock rollback guard works.
6. Every player-facing string in S1 matches this document exactly.

---

## 9. Work packages

All packages start at the same time from this document. Each package owns only its files (§6.1), codes against the interfaces in §6, and stubs what it consumes. Shared rule: never edit another package's files; propose a change in a note at the top of your own file instead.

### Stage 1

**Paket A: Ekonomi, benzetim, kayıt, testler**
- Owns: `js/ayar.js`, `js/bicim.js`, `js/ekonomi.js`, `js/durum.js`, `js/benzetim.js`, `js/cevrimdisi.js`, `js/kayit.js`, `js/olay.js`, `test/*.test.mjs`, `test/kayitlar/*`.
- Implements: §2 (S1 parts; S2 data tables may be present but unused), §3, §6.4, §8.1.
- Consumes: nothing.
- Acceptance: `npm test` green; the API exactly as §6.4; zero DOM references; `benzetim.adim` ≤ 0.2 ms with 12 shafts (measured in a test).

**Paket B: Sahne, sanat, animasyon**
- Owns: `js/yerlesim.js`, `js/sahne/*`.
- Implements: §5 (Zonguldak), §6.5, §4.3 world layout.
- Consumes: `durum` shape (§3.2, §6.4) read-only; the event list (§6.4).
- Develops against a stub: a `durum` from `test/kayitlar/zengin.json` passed through `durum.dogrula`, plus fake events.
- Delivers a standalone preview `sahne-onizleme.html` (fragment, B-owned, not shipped) that animates the rich save.
- Acceptance: the art reads as the mockup at 390 and 360 widths; §7 render budgets; `Varliklar.png` override works for at least `madenci.*` and `depo.bina`; no per-frame allocation (checked with a heap snapshot diff over 10 s in the preview).

**Paket C: Arayüz, CSS, sayfalar, pencereler**
- Owns: `css/*`, `js/arayuz/*`.
- Implements: §4 (S1 parts: HUD, stats, cards, badges, chips, bottom overlay, nav with placeholders, Yöneticiler page, Ayarlar, upgrade sheet, manager modal, offline, level-up, import modals, toasts, tutorial UI), §5.6 UI motion, §6.6.
- Consumes: `ekonomi.teklif`, `ekonomi.yetenekDurum`, `bicim`, `yerlesim`, `Sahne.ekranKonumu` / `portre` / `bolgeRozeti` / `efekt.patlat` (stub them until B lands), `eylem`.
- Delivers `arayuz-onizleme.html` (C-owned) driving the UI from fixtures.
- Acceptance: every component state in §4 reachable in the preview; all strings exact; no innerHTML in the binding loop; DOM write budget.

**Paket D: Entegrasyon, giriş, köprüler, ses, test düzeneği, paketleme**
- Owns: `index.html`, `package.json`, `js/ana.js`, `js/kaydirma.js`, `js/ses.js`, `js/reklam.js`, `js/magaza.js`, `test/sunucu.mjs`, `test/oyna.mjs`, `araclar/paketle.mjs`.
- Implements: §6.2, §6.3, §6.7, §6.8, §6.9, §8.2, and `araclar/paketle.mjs` (writes `dist/index.html` = full document + copies `css/`, `js/`, any `img/`).
- Consumes: all of the above.
- Starts with stubs (a fake Sahne that fills rectangles, a fake Arayuz) so the loop, scroll and harness run on day one.
- Acceptance: §8.2 harness runs end-to-end; scroll physics as specified; bridges behave like the old files; publishable as a multi-file artifact (relative paths only).

**Integration step (D leads, all review):** replace the stubs with the real modules. Run `npm test` and `npm run oyna`. Fix interface mismatches in the owning package. Compare `zengin-ana.png` with the mockup side by side, and file visual deltas against B (scene) or C (UI).

**Polish step (B + C, D measures):** tune animation timings, glows, shine and particle density; check 360 px; re-run performance under 4× throttle and fix any over-budget item; do the final string audit against this document; publish the artifact.

### Stage 2 (after stage 1 is accepted)

- **A2**: regions (`bolgeAc`, `bolgeGit`, inactive accrual), quests, research, daily gift, elmas sinks, shop grants, S2 pacing bands.
- **B2**: five region art sets and ores, map canvas, region transition, research and shop icons art.
- **C2**: Harita, Araştırma and Mağaza pages, region/daily/research sheets, quest toasts in the status slot, offer UI.
- **D2**: `magaza.js` wiring and the Play Billing flow on device, ad places `elmas` and `arastirma`, harness scenarios for every S2 page and modal.

Each S2 package follows the same ownership, interfaces and acceptance rules as stage 1.
