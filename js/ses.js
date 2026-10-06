// ════════════════════════════════════════════════════════════════
//  SES — bütün sesler WebAudio ile anında üretilir; ses dosyası yok.
//  Tarayıcılar sesi ancak bir dokunuştan sonra açtırır: Ses.ac()
//  her dokunuşta çağrılır (askıya alınmışsa da yeniden başlatır).
//  ayarAl().ses false ise hiçbir şey çalmaz (ayarAl ana.js'den kur ile gelir).
//  Eski oyundan taşındı (§6.9).
// ════════════════════════════════════════════════════════════════
export const Ses = (() => {
  let ctx = null, ana = null, gurultu = null
  const son = {}
  let ayarAl = () => null

  // ana.js bağlar: ayarAl() -> durum.ayarlar ({ ses, titresim })
  function kur(secenek = {}) {
    if (typeof secenek.ayarAl === 'function') ayarAl = secenek.ayarAl
  }
  const ayar = () => { try { return ayarAl() || null } catch { return null } }

  function ac() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    try { ctx = new AC() } catch { return }
    ana = ctx.createGain()
    ana.gain.value = 0.34
    const sikistir = ctx.createDynamicsCompressor()
    ana.connect(sikistir).connect(ctx.destination)
    // 1 sn beyaz gürültü: kazma, kaya, rüzgâr
    gurultu = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = gurultu.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }

  // Tek nota: hızlı atak, üstel sönüm
  function nota(f, bas, sure, { tip = 'sine', ses = 0.3, kayF = null, atak = 0.006 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = tip
    o.frequency.setValueAtTime(f, bas)
    if (kayF) o.frequency.exponentialRampToValueAtTime(kayF, bas + sure)
    g.gain.setValueAtTime(0.0001, bas)
    g.gain.exponentialRampToValueAtTime(ses, bas + atak)
    g.gain.exponentialRampToValueAtTime(0.0001, bas + sure)
    o.connect(g).connect(ana)
    o.start(bas)
    o.stop(bas + sure + 0.03)
  }
  // Süzülmüş gürültü
  function hisirti(bas, sure, { ses = 0.3, frek = 1200, q = 0.8, tip = 'bandpass', kayF = null } = {}) {
    const k = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    k.buffer = gurultu
    f.type = tip
    f.frequency.setValueAtTime(frek, bas)
    if (kayF) f.frequency.exponentialRampToValueAtTime(kayF, bas + sure)
    f.Q.value = q
    g.gain.setValueAtTime(ses, bas)
    g.gain.exponentialRampToValueAtTime(0.0001, bas + sure)
    k.connect(f).connect(g).connect(ana)
    k.start(bas, Math.random() * 0.4)
    k.stop(bas + sure + 0.03)
  }
  // Çan: uyumsuz kısmi tonlar uzun söner (kervan çanı)
  function can(f, bas, ses = 0.16) {
    ;[[1, 1, 1.6], [2.76, 0.45, 0.9], [5.4, 0.25, 0.5], [8.9, 0.12, 0.3]].forEach(([k, s, d]) => nota(f * k, bas, d, { ses: ses * s, atak: 0.003 }))
  }

  const SESLER = {
    tik: (t) => nota(1500, t, 0.05, { tip: 'triangle', ses: 0.1 }),
    ac: (t) => { nota(700, t, 0.09, { tip: 'triangle', ses: 0.08, kayF: 1100 }) },
    para: (t) => {
      nota(1568, t, 0.08, { tip: 'triangle', ses: 0.11 })
      nota(2093, t + 0.055, 0.16, { tip: 'triangle', ses: 0.1 })
    },
    yukselt: (t) => {
      ;[523, 659, 784].forEach((f, k) => nota(f, t + k * 0.05, 0.14, { tip: 'square', ses: 0.045 }))
      nota(1046, t + 0.15, 0.28, { tip: 'triangle', ses: 0.1 })
    },
    esik: (t) => {
      ;[523, 659, 784, 1046, 1319].forEach((f, k) => nota(f, t + k * 0.06, 0.3, { tip: 'triangle', ses: 0.1 }))
      can(1568, t + 0.3, 0.08)
    },
    gonder: (t) => {
      hisirti(t, 0.22, { ses: 0.16, frek: 600, q: 0.9, kayF: 2600 })
      nota(196, t, 0.12, { tip: 'triangle', ses: 0.12, kayF: 260 })
    },
    kazma: (t) => {
      hisirti(t, 0.1, { ses: 0.45, frek: 2600, q: 1.4 })
      nota(150, t, 0.13, { tip: 'sine', ses: 0.32, kayF: 55 })
      hisirti(t + 0.03, 0.25, { ses: 0.12, frek: 500, q: 0.7, tip: 'lowpass' })
    },
    kazi: (t) => {
      ;[0, 0.16, 0.32].forEach((d) => { hisirti(t + d, 0.09, { ses: 0.35, frek: 2400, q: 1.3 }); nota(140, t + d, 0.1, { ses: 0.22, kayF: 60 }) })
    },
    galeri: (t) => {
      hisirti(t, 1.0, { ses: 0.5, frek: 420, q: 0.5, tip: 'lowpass', kayF: 70 })
      nota(70, t, 0.6, { ses: 0.3, kayF: 40 })
      ;[392, 523, 659, 784].forEach((f, k) => nota(f, t + 0.3 + k * 0.08, 0.55, { tip: 'triangle', ses: 0.1 }))
    },
    gorev: (t) => { [659, 880, 1175].forEach((f, k) => nota(f, t + k * 0.07, 0.32, { tip: 'triangle', ses: 0.1 })) },
    odul: (t) => {
      for (let k = 0; k < 7; k++) nota(1700 + ((k * 397) % 900), t + k * 0.045, 0.1, { tip: 'triangle', ses: 0.08 })
      nota(2637, t + 0.34, 0.3, { tip: 'sine', ses: 0.08 })
    },
    yetenek: (t) => {
      hisirti(t, 0.55, { ses: 0.22, frek: 350, q: 1.1, kayF: 3600 })
      ;[523, 784, 1046].forEach((f) => nota(f, t + 0.12, 0.65, { tip: 'sawtooth', ses: 0.03 }))
      nota(1568, t + 0.28, 0.45, { tip: 'triangle', ses: 0.09 })
    },
    usta: (t) => {
      hisirti(t, 0.4, { ses: 0.12, frek: 800, q: 0.8, kayF: 4000 })
      ;[392, 494, 587, 784].forEach((f, k) => nota(f, t + 0.25 + k * 0.06, 0.6, { tip: 'triangle', ses: 0.09 }))
      can(1175, t + 0.5, 0.1)
    },
    kervan: (t) => { can(660, t, 0.18); can(880, t + 0.32, 0.14) },
    ocak: (t) => {
      ;[523, 659, 784, 1046].forEach((f, k) => nota(f, t + k * 0.12, 0.35, { tip: 'square', ses: 0.05 }))
      ;[523, 659, 784, 1046].forEach((f) => nota(f, t + 0.55, 1.3, { tip: 'triangle', ses: 0.07 }))
      can(1046, t + 0.55, 0.1)
    },
    hata: (t) => nota(220, t, 0.14, { tip: 'square', ses: 0.04, kayF: 180 }),
    // Şenlik: davul (düm-tek-tek-düm) ve zurnadan kısa bir nağme
    davul: (t) => {
      ;[[0, 1], [0.22, 0.45], [0.33, 0.45], [0.55, 1], [0.77, 0.45]].forEach(([d, g]) => {
        nota(g > 0.5 ? 78 : 150, t + d, g > 0.5 ? 0.32 : 0.12, { ses: 0.4 * g, kayF: g > 0.5 ? 46 : 110 })
        hisirti(t + d, 0.08, { ses: 0.25 * g, frek: g > 0.5 ? 300 : 1800, q: 0.9 })
      })
      ;[659, 740, 784, 880, 784].forEach((f, k) => nota(f, t + 0.1 + k * 0.13, 0.16, { tip: 'sawtooth', ses: 0.035, kayF: f * 1.01 }))
    },
  }

  function cal(ad) {
    if (!ctx || ctx.state !== 'running' || ayar()?.ses === false) return
    const simdi = ctx.currentTime
    // Aynı ses üst üste binmesin
    const ara = ad === 'para' ? 0.12 : 0.045
    if (son[ad] && simdi - son[ad] < ara) return
    son[ad] = simdi
    try { SESLER[ad]?.(simdi + 0.005) } catch {}
  }

  // Titreşim (destekleyen telefonlarda): kısa dokunuş hissi
  let sonTitresim = 0
  function titret(desen) {
    if (ayar()?.titresim === false) return
    const t = performance.now()
    if (t - sonTitresim < 120) return
    sonTitresim = t
    try { navigator.vibrate?.(desen) } catch {}
  }

  // Sayfa gizlenince sesi askıya alır (ac() bir sonraki dokunuşta sürdürür)
  function askiya() {
    try { if (ctx && ctx.state === 'running') ctx.suspend() } catch {}
  }

  return { kur, ac, cal, titret, askiya }
})()
