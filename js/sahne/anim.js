// Cevher Madenci · Geliştirici: İbrahim Can Göçmez
// ════════════════════════════════════════════════════════════════
//  ANİMASYON SİSTEMİ — sahnedeki bütün hareketlerin ortak dili. Saf modül: DOM yok, durum değiştirmez.
//  • KLIPLER: her aktörün klipleri veriyle tanımlanır: kare sayısı, döngü süresi (sn), döngü mü, kare olayları
//    (ör. kazmanın kayaya değdiği kare 'vurus'), yürüyen kliplerde bir döngünün aldığı yol (referans px).
//  • klipKaresi / yolKaresi / olaylariTara: zamana ya da alınan yola göre kare, iki an arasında geçilen olaylar.
//  • Oynatici: bir aktörün o anki klibi, zamanı ve hızı; tek seferlik klip bitince 'sonra' klibine geçer.
//  • DIZILER ve diziPoz: tekrar eden iş döngüleri (taşıyıcı: eğil → taşı → boşalt → dön) adım listesi olarak.
//  • YUMUSAT, gecis ve Yay: geçiş eğrileri ve kritik altı sönümlü yay (kabin).
//  Görsel değişince yalnız bu tablolar ve kaynak.js'deki kare kaynakları değişir; sahne mantığı aynı kalır.
// ════════════════════════════════════════════════════════════════

const don = (o) => {
  Object.freeze(o)
  for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object' && !Object.isFrozen(o[k])) don(o[k])
  return o
}
const kesir = (x) => x - Math.floor(x)

// ── Klipler ──
// kare: kare sayısı · sure: bir döngünün süresi (sn) · dongu: false ise son karede kalır
// adim: yürüyen kliplerde bir döngüde alınan yol (referans px); kare yola göre seçilir, ayak kaymaz
// olaylar: { kare: 'ad' } — o kareye girilince bildirilir
export const KLIPLER = don({
  madenci: {
    yuru: { kare: 8, sure: 0.72, dongu: true, adim: 13 },
    tasi: { kare: 8, sure: 0.8, dongu: true, adim: 13 },
    it: { kare: 8, sure: 0.85, dongu: true, adim: 13 },
    kaz: { kare: 8, sure: 0.62, dongu: true, olaylar: { 4: 'vurus' } },
    bekle: { kare: 6, sure: 2.4, dongu: true },
    dinlen: { kare: 4, sure: 3.2, dongu: true },
    sevin: { kare: 6, sure: 0.75, dongu: true },
    egil: { kare: 4, sure: 0.5, dongu: false },
    bosalt: { kare: 4, sure: 0.5, dongu: false },
  },
  // Kamyon: kareler tekerlek dönüşüdür (yola göre); boş ve dolu ayrı satırlar (PNG kare setinde)
  kamyon: {
    bos: { kare: 4, sure: 0.4, dongu: true, adim: 24 },
    dolu: { kare: 4, sure: 0.4, dongu: true, adim: 24 },
  },
  // Maden arabası: dolu/boş tek kare
  araba: {
    bos: { kare: 1, sure: 1, dongu: true },
    dolu: { kare: 1, sure: 1, dongu: true },
  },
})

export const klip = (tur, ad) => {
  const t = KLIPLER[tur]
  return (t && t[ad]) || null
}

// Zamana göre kare: döngülü klipte sarar, tek seferlikte son karede kalır
export function klipKaresi(tur, ad, t) {
  const k = klip(tur, ad)
  if (!k) return 0
  const u = k.dongu ? kesir(t / k.sure) : Math.min(1, Math.max(0, t / k.sure))
  return Math.min(k.kare - 1, Math.floor(u * k.kare))
}

// Alınan yola göre kare (yürüyüş, itme, tekerlek): ayaklar zemine göre kaymaz
export function yolKaresi(tur, ad, yol) {
  const k = klip(tur, ad)
  if (!k) return 0
  const adim = k.adim || 1
  return Math.floor(kesir(Math.abs(yol) / adim) * k.kare) % k.kare
}

// t0 → t1 arasında girilen karelerin olaylarını bildirir: dinle(ad, kareNo). Döngülü klipte her tur sayılır.
export function olaylariTara(tur, ad, t0, t1, dinle) {
  const k = klip(tur, ad)
  if (!k || !k.olaylar || !(t1 > t0)) return 0
  const n0 = Math.floor((t0 / k.sure) * k.kare), n1 = Math.floor((t1 / k.sure) * k.kare)
  let say = 0
  for (let n = n0 + 1; n <= n1; n++) {
    if (!k.dongu && n >= k.kare) break
    const ad2 = k.olaylar[((n % k.kare) + k.kare) % k.kare]
    if (ad2) { say++; if (dinle) dinle(ad2, n) }
  }
  return say
}

// ── Oynatıcı: tek bir aktörün klibi ──
export class Oynatici {
  constructor(tur, ad = 'bekle', faz = 0) {
    this.tur = tur
    this.ad = ad
    this.t = faz
    this.hiz = 1
    this.sonra = null
    this.sinir = Infinity
  }
  // Klibi başlatır. bastan=false: aynı klip oynuyorsa kaldığı yerden sürer. sure: döngülü klibi bu kadar
  // oynatıp 'sonra'ya geçer (ör. 0,9 sn sevin, sonra bekle); tek seferlik klip kendi süresi bitince geçer.
  oynat(ad, { bastan = true, hiz = 1, sonra = null, sure = Infinity } = {}) {
    if (ad !== this.ad || bastan) this.t = 0
    this.ad = ad
    this.hiz = hiz
    this.sonra = sonra
    this.sinir = sure
    return this
  }
  // Zamanı ilerletir, geçilen olayları bildirir; klip bitince 'sonra'ya geçer
  ilerle(dt, dinle) {
    const t0 = this.t
    this.t += dt * this.hiz
    olaylariTara(this.tur, this.ad, t0, this.t, dinle)
    const k = klip(this.tur, this.ad)
    const bitis = k && !k.dongu ? Math.min(k.sure, this.sinir) : this.sinir
    if (this.sonra && this.t >= bitis) {
      const s = this.sonra
      this.sonra = null
      this.oynat(s)
    }
    return this
  }
  get kare() { return klipKaresi(this.tur, this.ad, this.t) }
  get bitti() { const k = klip(this.tur, this.ad); return !!k && !k.dongu && this.t >= k.sure }
}

// ── İş döngüleri ──
// Adım: { ad, klip, sure } yerinde bekler (yer: nokta adı, yon) ya da { ad, klip, git: [a, b], hiz } iki nokta arası
// yürür (hız: referans px/sn, yon hareket yönünden). Noktalar çağıranın verdiği { a: x, b: x } tablosundan okunur.
export const DIZILER = don({
  // Taşıyıcı: kazılan yığından çuvalı al → bunkere taşı → boşalt → boş dön
  tasiyici: [
    { ad: 'al', klip: 'egil', sure: 0.5, yer: 'a', yon: -1 },
    { ad: 'tasi', klip: 'tasi', git: ['a', 'b'], hiz: 36 },
    { ad: 'bosalt', klip: 'bosalt', sure: 0.45, yer: 'b', yon: 1 },
    { ad: 'don', klip: 'yuru', git: ['b', 'a'], hiz: 36 },
  ],
  // Arabacı: arabanın dolmasını bekle → bunkere it → devir → geri çek
  arabaci: [
    { ad: 'bekle', klip: 'bekle', sure: 1.3, yer: 'a', yon: 1 },
    { ad: 'it', klip: 'it', git: ['a', 'b'], hiz: 28 },
    { ad: 'devir', klip: 'bekle', sure: 0.8, yer: 'b', yon: 1, sabit: 0 },
    { ad: 'don', klip: 'yuru', git: ['b', 'a'], hiz: 28 },
  ],
})

const adimSuresi = (s, n) => (s.git ? Math.abs(n[s.git[1]] - n[s.git[0]]) / s.hiz : s.sure)

// Dizinin toplam süresi (sn)
export function diziSuresi(dizi, noktalar) {
  let T = 0
  for (const s of dizi) T += adimSuresi(s, noktalar)
  return T
}

// u anındaki poz: { ad, sira, klip, kare, x, yon, q } — q: adımın ilerlemesi (0..1)
export function diziPoz(dizi, u, noktalar, tur = 'madenci') {
  const T = diziSuresi(dizi, noktalar)
  if (!(T > 0)) return null
  u = ((u % T) + T) % T
  for (let i = 0; i < dizi.length; i++) {
    const s = dizi[i]
    const d = adimSuresi(s, noktalar)
    if (u < d || i === dizi.length - 1) {
      const q = d > 0 ? Math.min(1, u / d) : 1
      if (s.git) {
        const x0 = noktalar[s.git[0]], x1 = noktalar[s.git[1]]
        const x = x0 + (x1 - x0) * q
        return { ad: s.ad, sira: i, klip: s.klip, kare: yolKaresi(tur, s.klip, x - x0), x, yon: x1 >= x0 ? 1 : -1, q }
      }
      const k = klip(tur, s.klip)
      // Tek seferlik klip adım boyunca bir kez oynar; döngülü klip kendi süresiyle döner; sabit verilirse o kare
      const kare = s.sabit !== undefined ? s.sabit : k && !k.dongu ? Math.min(k.kare - 1, Math.floor(q * k.kare)) : klipKaresi(tur, s.klip, u)
      return { ad: s.ad, sira: i, klip: s.klip, kare, x: noktalar[s.yer], yon: s.yon || 1, q }
    }
    u -= d
  }
  return null
}

// ── Geçiş eğrileri (0..1 → 0..1) ──
export const YUMUSAT = don({
  lineer: (u) => u,
  yumusak: (u) => u * u * (3 - 2 * u),
  girisKare: (u) => u * u,
  cikisKare: (u) => 1 - (1 - u) * (1 - u),
  cikisKubik: (u) => 1 - Math.pow(1 - u, 3),
  girisCikisKubik: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  // Hedefi biraz aşıp yerine oturur
  yayli: (u) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2) },
  // Yere düşüp sekme
  zipla: (u) => {
    const n = 7.5625, d = 2.75
    if (u < 1 / d) return n * u * u
    if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75
    if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375
    return n * (u -= 2.625 / d) * u + 0.984375
  },
})

// a → b arası, u (0..1) ve eğri adıyla
export function gecis(a, b, u, egri = 'lineer') {
  const f = YUMUSAT[egri] || YUMUSAT.lineer
  return a + (b - a) * f(Math.min(1, Math.max(0, u)))
}

// ── Yay: hedefi kritik altı sönümle izler (w: açısal frekans, z: sönüm oranı) ──
// Büyük sıçramalarda (sicra) yeni hedefe hemen geçer. Sabit 1/120 sn adımlarla tümleştirilir.
export class Yay {
  constructor(w = 24, z = 0.62, sicra = 1.5) {
    this.w = w
    this.z = z
    this.sicra = sicra
    this.x = NaN
    this.v = 0
  }
  ilerle(hedef, dt) {
    if (!Number.isFinite(this.x) || Math.abs(hedef - this.x) > this.sicra || !(dt > 0)) { this.x = hedef; this.v = 0; return this.x }
    for (let r = dt; r > 1e-6; r -= 1 / 120) {
      const h = Math.min(r, 1 / 120)
      this.v += (this.w * this.w * (hedef - this.x) - 2 * this.z * this.w * this.v) * h
      this.x += this.v * h
    }
    return this.x
  }
}
