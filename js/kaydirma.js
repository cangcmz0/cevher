// ════════════════════════════════════════════════════════════════
//  KAYDIRMA (Paket D, §6.7) — maden görünümünün özel kaydırması,
//  dokunma ve uzun basma algılama. Yerel kaydırma kullanılmaz.
//  • Sürükleme 8 px sonra başlar, içerik parmağı 1:1 izler.
//  • Bırakınca atalet v *= exp(-dt/0.325), |v| < 12 px/sn'de durur.
//  • Sınırlar 0..(dunyaH − gorunurYuk + 80); dışında lastik bant,
//    geri dönüş kritik sönümlü yay (ω = 16).
//  • Fare tekerleği 120 ms yumuşatılır; kaydirKonumu 450 ms easeOutCubic.
//  • Dokunuş: < 8 px ve < 350 ms. DOM denetimine dokunulduysa tıklama
//    kendi çalışır; değilse dünya koordinatı dokun(x, y) ile bildirilir.
//  • Uzun basma: [data-uzun] öğede ≥ 350 ms → Veriyolu 'uzunBasma' {el},
//    bırakınca 'uzunBasmaBitti'. Ardından gelen tıklama bastırılır.
//  requestAnimationFrame çağırmaz; ana.js her karede ilerle(dt) çağırır.
// ════════════════════════════════════════════════════════════════

const ESIK = 8                 // px, sürükleme başlangıcı / dokunuş sınırı
const DOKUNUS_MS = 350         // ms, dokunuş üst sınırı
const UZUN_MS = 350            // ms, uzun basma
const ORNEK_MS = 80            // ms, hız örnek penceresi
const SONUM = 0.325            // s, atalet zaman sabiti
const DUR_HIZ = 12             // px/sn
const ALT_PAY = 80             // px, son satır alt şeridin üstüne çıksın
const OMEGA = 16               // yay
const TEKER_MS = 120
const PROG_MS = 450

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

// Lastik bant: sınır dışı yer değiştirme × 0.5 / (1 + |d|/300)
function lastik(d) { return d * 0.5 / (1 + Math.abs(d) / 300) }

export function kaydirmaKur({ kok, alan, dunya, dunyaYukAl, dokun, uiMi, yayinla, simdi = () => performance.now() }) {
  // Durum
  let y = 0                    // gösterilen kaydırma (dünya px)
  let v = 0                    // px/sn (atalet)
  let gorunurYuk = alan.clientHeight || 0
  let yazilan = NaN            // son yazılan transform değeri
  let yayda = false            // sınır dışından dönüyor

  // Etkin işaretçi
  let isaretci = null          // { id, x0, y0, t0, y0Kaydir, surukle, hedef, uzunEl, uzunZaman, uzunOldu }
  // Hız örnekleri: dairesel tampon (ayırma yok)
  const ORN = 16
  const ornT = new Float64Array(ORN), ornY = new Float64Array(ORN)
  let ornN = 0, ornI = 0

  // Tween (tekerlek ve programlı kaydırma)
  let tw = null                // { bas, son, t, sure }
  let tiklamaBastir = false
  let bastirZaman = 0

  const maks = () => Math.max(0, (dunyaYukAl() || 0) - gorunurYuk + ALT_PAY)
  const sinirla = (d) => Math.min(maks(), Math.max(0, d))

  function ornekEkle(t, cy) {
    ornT[ornI] = t; ornY[ornI] = cy
    ornI = (ornI + 1) % ORN
    if (ornN < ORN) ornN++
  }
  function hizHesapla(simdiT) {
    // Son 80 ms içindeki en eski ve en yeni örnek
    let enYeni = -1, enEski = -1
    for (let k = 0; k < ornN; k++) {
      const i = (ornI - 1 - k + ORN) % ORN
      if (simdiT - ornT[i] > ORNEK_MS) break
      if (enYeni < 0) enYeni = i
      enEski = i
    }
    if (enYeni < 0 || enEski === enYeni) return 0
    const dt = (ornT[enYeni] - ornT[enEski]) / 1000
    if (dt <= 0) return 0
    return -(ornY[enYeni] - ornY[enEski]) / dt   // parmak yukarı → kaydırma artar
  }

  // Ham (sınırsız) konumu lastik bantla gösterilen konuma çevirir
  function hamdanGoster(ham) {
    const m = maks()
    if (ham < 0) return lastik(ham)
    if (ham > m) return m + lastik(ham - m)
    return ham
  }

  function uzunIptal() {
    if (!isaretci) return
    if (isaretci.uzunZaman) { clearTimeout(isaretci.uzunZaman); isaretci.uzunZaman = 0 }
  }

  // ── İşaretçi olayları (kök üzerinde; kaydırma yalnız #maden içinde) ──
  function asagi(e) {
    if (isaretci) return                          // tek işaretçi
    if (e.pointerType === 'mouse' && e.button !== 0) return
    tiklamaBastir = false
    const icerde = alan.contains(e.target)
    const uzunEl = e.target.closest?.('[data-uzun]') || null
    if (!icerde && !uzunEl) return
    isaretci = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: simdi(), y0Kaydir: y,
      icerde, surukle: false, hedef: e.target, uzunEl, uzunZaman: 0, uzunOldu: false,
    }
    if (icerde) {
      // Dokunuş atalet ve tween'i durdurur (parmağı koyunca kayma durur)
      v = 0; tw = null; yayda = false
      ornN = 0; ornI = 0
      ornekEkle(isaretci.t0, e.clientY)
    }
    if (uzunEl) {
      const p = isaretci
      p.uzunZaman = setTimeout(() => {
        p.uzunZaman = 0
        if (isaretci !== p || p.surukle) return
        p.uzunOldu = true
        yayinla({ tip: 'uzunBasma', el: p.uzunEl })
      }, UZUN_MS)
    }
  }

  function hareket(e) {
    const p = isaretci
    if (!p || e.pointerId !== p.id) return
    const dx = e.clientX - p.x0, dy = e.clientY - p.y0
    if (!p.surukle) {
      if (dx * dx + dy * dy < ESIK * ESIK) return
      uzunIptal()
      if (p.uzunOldu) { p.uzunOldu = false; yayinla({ tip: 'uzunBasmaBitti', el: p.uzunEl }) ; tiklamaBastir = true }
      if (!p.icerde) return
      p.surukle = true
      // Sürükleme eşiği aşıldığı yerden başlasın (sıçrama olmasın)
      p.y0 = e.clientY; p.y0Kaydir = y
      try { alan.setPointerCapture(p.id) } catch {}
    }
    if (!p.icerde) return
    const t = simdi()
    ornekEkle(t, e.clientY)
    const ham = p.y0Kaydir + (p.y0 - e.clientY)
    // y0Kaydir lastik bölgedeyse geri ham'a çevirmek yerine doğrudan sınırla
    y = hamdanGoster(ham)
    if (e.cancelable) e.preventDefault()
  }

  function yukari(e) {
    const p = isaretci
    if (!p || e.pointerId !== p.id) return
    isaretci = null
    uzunIptal()
    const t = simdi()
    if (p.uzunOldu) {
      yayinla({ tip: 'uzunBasmaBitti', el: p.uzunEl })
      tiklamaBastir = true; bastirZaman = t
      return
    }
    if (p.surukle) {
      ornekEkle(t, e.clientY)
      v = hizHesapla(t)
      tiklamaBastir = true; bastirZaman = t
      try { alan.releasePointerCapture(p.id) } catch {}
      return
    }
    if (!p.icerde) return
    // Dokunuş
    if (t - p.t0 < DOKUNUS_MS) {
      if (uiMi(p.hedef)) return                     // DOM denetimi: tıklaması çalışsın
      const r = alan.getBoundingClientRect()        // olay başına bir kez (bağlama döngüsünde değil)
      dokun(e.clientX - r.left, e.clientY - r.top + y)
    }
  }

  function iptal(e) {
    const p = isaretci
    if (!p || e.pointerId !== p.id) return
    isaretci = null
    uzunIptal()
    if (p.uzunOldu) yayinla({ tip: 'uzunBasmaBitti', el: p.uzunEl })
  }

  // Sürükleme ya da uzun basmadan sonraki tıklamayı yakalama evresinde bastır
  function tiklama(e) {
    if (!tiklamaBastir) return
    tiklamaBastir = false
    if (simdi() - bastirZaman > 600) return
    e.stopPropagation()
    e.preventDefault()
  }

  function teker(e) {
    if (!alan.contains(e.target)) return
    e.preventDefault()
    let d = e.deltaY
    if (e.deltaMode === 1) d *= 16
    else if (e.deltaMode === 2) d *= gorunurYuk
    const hedef = sinirla((tw ? tw.son : y) + d)
    v = 0; yayda = false
    tw = { bas: y, son: hedef, t: 0, sure: TEKER_MS / 1000 }
  }

  function baglamMenusu(e) {
    if (e.target.closest?.('[data-uzun]') || alan.contains(e.target)) e.preventDefault()
  }

  alan.style.touchAction = 'none'
  kok.addEventListener('pointerdown', asagi)
  kok.addEventListener('pointermove', hareket, { passive: false })
  kok.addEventListener('pointerup', yukari)
  kok.addEventListener('pointercancel', iptal)
  kok.addEventListener('click', tiklama, true)
  kok.addEventListener('contextmenu', baglamMenusu)
  alan.addEventListener('wheel', teker, { passive: false })

  // ── Kare ilerletme ──
  function ilerle(dt) {
    if (isaretci && isaretci.surukle) return
    if (tw) {
      tw.t += dt
      const k = Math.min(1, tw.t / tw.sure)
      y = tw.bas + (tw.son - tw.bas) * easeOutCubic(k)
      if (k >= 1) { y = tw.son; tw = null }
      return
    }
    const m = maks()
    if (y < 0 || y > m) {
      // Kritik sönümlü yay, tam çözüm (büyük dt'de de kararlı)
      const sinir = y < 0 ? 0 : m
      const x0 = y - sinir
      const e = Math.exp(-OMEGA * dt)
      const c = v + OMEGA * x0
      const x = (x0 + c * dt) * e
      v = (v - OMEGA * c * dt) * e
      y = sinir + x
      yayda = true
      if (Math.abs(x) < 0.5 && Math.abs(v) < DUR_HIZ) { y = sinir; v = 0; yayda = false }
      return
    }
    yayda = false
    if (v !== 0) {
      y += v * dt
      v *= Math.exp(-dt / SONUM)
      if (Math.abs(v) < DUR_HIZ) v = 0
    }
  }

  // Transform'u yalnız değişince yazar; değer cihaz pikseline yuvarlanır
  function uygula(dpr = 1) {
    const r = Math.round(y * dpr) / dpr
    if (r === yazilan) return r
    yazilan = r
    dunya.style.transform = 'translate3d(0,' + (-r) + 'px,0)'
    return r
  }

  function kaydirKonumu(hedef, { anim = true } = {}) {
    const s = sinirla(hedef)
    v = 0; yayda = false
    if (!anim) { y = s; tw = null; return }
    tw = { bas: y, son: s, t: 0, sure: PROG_MS / 1000 }
  }

  function boyutla(yuk) {
    gorunurYuk = yuk
  }

  return {
    ilerle, uygula, kaydirKonumu, boyutla,
    get y() { return y },
    get maks() { return maks() },
    get hareketli() { return Boolean((isaretci && isaretci.surukle) || tw || v !== 0 || yayda) },
  }
}
