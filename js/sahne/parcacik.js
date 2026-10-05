// Parçacıklar ve uçan sayılar (§5.5). Sabit havuz: başlangıçtan sonra ayırma yok.
// Türler: toz, kivilcim, parca, sikke, parilti, konfeti, sayi.
// Dünya havuzu sahne tuvalinde (dünya koordinatı), efekt havuzu efekt tuvalinde (arayüz koordinatı) çizilir.

import { Varliklar } from './varliklar.js'
import { radyal, elips, rgba, yuvarlakYol, dikey, kenarIsik } from './cizim.js'

const TURLER = ['toz', 'kivilcim', 'parca', 'sikke', 'parilti', 'konfeti', 'sayi']
const KONFETI_RENK = ['#E67E3E', '#F6C453', '#2ECC71', '#4A90E2', '#F4E8D6', '#E25A43']
const SAYI_YAZI = '800 14px "Baloo 2", "Trebuchet MS", system-ui, sans-serif'
const MAKS_SAYI = 8

// Basit karma tabanlı rastgele (Math.random yerine: belirlenimci ve ucuz)
let tohum = 1234567
function rnd() {
  tohum = (tohum * 1664525 + 1013904223) >>> 0
  return tohum / 4294967296
}

export function parcacikSpritelari() {
  Varliklar.kaydet('p.toz', { w: 8, h: 8, ciz: (c, w, h) => { c.fillStyle = radyal(c, w / 2, h / 2, w / 2, ['rgba(214,190,160,.9)', 'rgba(170,140,110,.5)', 'rgba(140,110,80,0)']); c.fillRect(0, 0, w, h) } })
  Varliklar.kaydet('p.kivilcim', { w: 4, h: 10, ciz: (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.4, 'rgba(255,200,115,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = g; c.fillRect(1, 0, 2, h) } })
  Varliklar.kaydet('p.parca', { w: 8, h: 8, ciz: (c) => { const y = elips(4, 4, 3.4, 2.8); c.fillStyle = dikey(c, 1, 7, ['#4B565E', '#1F2326', '#121517']); c.fill(y); kenarIsik(c, y, '#9FB7C9', 0.6, 0.6) } })
  Varliklar.kaydet('p.sikke', { w: 10, h: 10, ciz: (c) => { c.fillStyle = radyal(c, 3.8, 3.4, 6, ['#FFE08A', '#F6C453', '#D99A2B']); c.beginPath(); c.arc(5, 5, 4.3, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#A8690F'; c.lineWidth = 0.8; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(3, 3, 1.4, 1.4) } })
  Varliklar.kaydet('p.parilti', { w: 16, h: 16, ciz: (c, w, h) => {
    c.fillStyle = radyal(c, 8, 8, 8, ['rgba(255,255,255,1)', 'rgba(255,240,180,.55)', 'rgba(255,220,120,0)'])
    c.fillRect(0, 0, w, h)
    c.fillStyle = 'rgba(255,255,255,.95)'
    c.beginPath(); c.moveTo(8, 0); c.lineTo(9, 7); c.lineTo(16, 8); c.lineTo(9, 9); c.lineTo(8, 16); c.lineTo(7, 9); c.lineTo(0, 8); c.lineTo(7, 7); c.closePath(); c.fill()
  } })
  return ['p.toz', 'p.kivilcim', 'p.parca', 'p.sikke', 'p.parilti']
}

export class Havuz {
  constructor(n = 256) {
    this.p = []
    for (let i = 0; i < n; i++) {
      this.p.push({ aktif: false, tur: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, omur: 1, yas: 0, boy: 1, donus: 0, vr: 0, renk: '', metin: '', sekti: false, zemin: 0, katki: false })
    }
    this.canli = 0
    this.sayiCanli = 0
    this.kalite = 'yuksek'
    this.sprite = null
  }

  // tur: tür adı. sec: { vx, vy, g, omur, boy, renk, metin, zemin }
  ekle(tur, x, y, sec) {
    const ti = TURLER.indexOf(tur)
    if (ti < 0) return null
    if (tur === 'sayi' && this.sayiCanli >= MAKS_SAYI) return null
    const l = this.p
    for (let i = 0; i < l.length; i++) {
      const p = l[i]
      if (p.aktif) continue
      p.aktif = true
      p.tur = ti
      p.x = x; p.y = y
      p.vx = sec && sec.vx !== undefined ? sec.vx : 0
      p.vy = sec && sec.vy !== undefined ? sec.vy : 0
      p.g = sec && sec.g !== undefined ? sec.g : 0
      p.omur = sec && sec.omur ? sec.omur : 1
      p.yas = 0
      p.boy = sec && sec.boy ? sec.boy : 1
      p.donus = sec && sec.donus !== undefined ? sec.donus : rnd() * 6.28
      p.vr = sec && sec.vr !== undefined ? sec.vr : 0
      p.renk = sec && sec.renk ? sec.renk : ''
      p.metin = sec && sec.metin ? sec.metin : ''
      p.zemin = sec && sec.zemin !== undefined ? sec.zemin : 1e9
      p.sekti = false
      this.canli++
      if (ti === 6) this.sayiCanli++
      return p
    }
    return null
  }

  // Bir patlama: tür ve adede göre hız dağılımı (kaliteye göre adet azalır)
  patlat(x, y, tur, adet, sec) {
    if (this.kalite === 'pil' && (tur === 'toz' || tur === 'kivilcim')) return
    let n = adet || 1
    if (this.kalite === 'dengeli' && tur !== 'sayi') n = Math.max(1, Math.round(n / 2))
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2
      const yon = sec && sec.yon !== undefined ? sec.yon : null
      if (tur === 'toz') {
        this.ekle('toz', x + (rnd() - 0.5) * 8, y + (rnd() - 0.5) * 6, { vx: (rnd() - 0.5) * 22, vy: -8 - rnd() * 18, omur: 0.6 + rnd() * 0.6, boy: 0.6 + rnd() * 0.9 })
      } else if (tur === 'kivilcim') {
        const aa = yon !== null ? yon + (rnd() - 0.5) * 1.6 : a
        const v = 50 + rnd() * 70
        this.ekle('kivilcim', x, y, { vx: Math.cos(aa) * v, vy: Math.sin(aa) * v - 20, g: 260, omur: 0.25 + rnd() * 0.15, boy: 0.6 + rnd() * 0.5 })
      } else if (tur === 'parca') {
        this.ekle('parca', x + (rnd() - 0.5) * 6, y, { vx: (rnd() - 0.5) * 50, vy: -30 - rnd() * 40, g: 300, omur: 0.5, boy: 0.6 + rnd() * 0.6, vr: (rnd() - 0.5) * 10, zemin: sec && sec.zemin !== undefined ? sec.zemin : y + 10 })
      } else if (tur === 'sikke') {
        this.ekle('sikke', x + (rnd() - 0.5) * 10, y, { vx: (rnd() - 0.5) * 40, vy: -50 - rnd() * 40, g: 160, omur: 0.7, boy: 0.8 + rnd() * 0.4 })
      } else if (tur === 'parilti') {
        const r = sec && sec.yaricap ? sec.yaricap : 18
        this.ekle('parilti', x + Math.cos(a) * r * rnd(), y + Math.sin(a) * r * rnd(), { vx: Math.cos(a) * 12, vy: Math.sin(a) * 12 - 8, omur: 0.6, boy: 0.7 + rnd() * 0.8, vr: (rnd() - 0.5) * 3 })
      } else if (tur === 'konfeti') {
        const gen = sec && sec.genislik ? sec.genislik : 300
        this.ekle('konfeti', x + (rnd() - 0.5) * gen, y - rnd() * 40, { vx: (rnd() - 0.5) * 60, vy: 40 + rnd() * 80, g: 40, omur: 2.2, boy: 0.8 + rnd() * 0.7, vr: (rnd() - 0.5) * 12, renk: KONFETI_RENK[k % KONFETI_RENK.length] })
      }
    }
  }

  sayi(x, y, metin) {
    return this.ekle('sayi', x, y, { vy: -28 / 1.1, omur: 1.1, metin })
  }

  guncelle(dt) {
    if (!this.canli) return
    const l = this.p
    for (let i = 0; i < l.length; i++) {
      const p = l[i]
      if (!p.aktif) continue
      p.yas += dt
      if (p.yas >= p.omur) {
        p.aktif = false
        this.canli--
        if (p.tur === 6) this.sayiCanli--
        continue
      }
      p.vy += p.g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.donus += p.vr * dt
      if (p.tur === 0) { p.vx *= 0.96; p.vy *= 0.96 }
      if (p.tur === 5) { p.vx = Math.sin(p.yas * 5 + i) * 30 }
      if (p.y > p.zemin && !p.sekti && p.vy > 0) { p.y = p.zemin; p.vy *= -0.35; p.vx *= 0.6; p.sekti = true }
    }
  }

  ciz(ctx) {
    if (!this.canli) return
    const l = this.p
    if (!this.sprite) {
      this.sprite = [Varliklar.al('p.toz'), Varliklar.al('p.kivilcim'), Varliklar.al('p.parca'), Varliklar.al('p.sikke'), Varliklar.al('p.parilti')]
    }
    const sp = this.sprite
    const m = ctx.getTransform()
    const ma = m.a, md = m.d, me = m.e, mf = m.f
    let toplamali = false, sayiVar = false
    // 1. geçiş: normal karışım (toz, parça, sikke, konfeti)
    for (let i = 0; i < l.length; i++) {
      const p = l[i]
      if (!p.aktif) continue
      const t = p.yas / p.omur
      switch (p.tur) {
        case 0: {
          ctx.globalAlpha = (1 - t) * 0.7
          const s = 6 * p.boy * (1 + t)
          ctx.drawImage(sp[0], p.x - s / 2, p.y - s / 2, s, s)
          break
        }
        case 2: {
          ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1
          const s = 7 * p.boy
          ctx.drawImage(sp[2], p.x - s / 2, p.y - s / 2, s, s)
          break
        }
        case 3: {
          ctx.globalAlpha = t > 0.6 ? (1 - t) / 0.4 : 1
          const s = 9 * p.boy
          ctx.drawImage(sp[3], p.x - s / 2, p.y - s / 2, s, s)
          break
        }
        case 5: {
          ctx.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1
          ctx.fillStyle = p.renk
          const w = 7 * p.boy, h = 4 * p.boy * Math.abs(Math.cos(p.donus))
          ctx.fillRect(p.x - w / 2, p.y - h / 2, w, Math.max(0.8, h))
          break
        }
        case 1: case 4: toplamali = true; break
        case 6: sayiVar = true; break
      }
    }
    // 2. geçiş: toplamalı ışıklar (kıvılcım, parıltı) tek karışım değişimiyle
    if (toplamali) {
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < l.length; i++) {
        const p = l[i]
        if (!p.aktif) continue
        const t = p.yas / p.omur
        if (p.tur === 1) {
          ctx.globalAlpha = 1 - t
          const a = Math.atan2(p.vy, p.vx) - Math.PI / 2
          const c = Math.cos(a), s = Math.sin(a)
          ctx.setTransform(ma * c, md * s, -ma * s, md * c, ma * p.x + me, md * p.y + mf)
          ctx.drawImage(sp[1], -1.5 * p.boy, -8 * p.boy, 3 * p.boy, 8 * p.boy)
        } else if (p.tur === 4) {
          ctx.setTransform(ma, 0, 0, md, me, mf)
          const k = Math.sin(t * Math.PI)
          ctx.globalAlpha = k
          const s = 16 * p.boy * (0.5 + k * 0.7)
          ctx.drawImage(sp[4], p.x - s / 2, p.y - s / 2, s, s)
        }
      }
      ctx.setTransform(m)
      ctx.globalCompositeOperation = 'source-over'
    }
    // 3. geçiş: uçan sayılar (yazı ayarları bir kez)
    if (sayiVar) {
      ctx.font = SAYI_YAZI
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(43,29,18,.85)'
      ctx.fillStyle = '#FFFFFF'
      for (let i = 0; i < l.length; i++) {
        const p = l[i]
        if (!p.aktif || p.tur !== 6) continue
        const t = p.yas / p.omur
        ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1
        ctx.strokeText(p.metin, p.x, p.y)
        ctx.fillText(p.metin, p.x, p.y)
      }
    }
    ctx.globalAlpha = 1
  }
}
