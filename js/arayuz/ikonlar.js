// ════════════════════════════════════════════════════════════════
//  İKONLAR (Paket C, §4.13) — satır içi SVG dizgeleri, viewBox 0 0 24 24.
//  • Boyalı ikonlar: 2–3 duraklı gradyanlar + #2B1D12 1,2 px dış çizgi.
//    Gradyanlar bir kez DEFS içinde tanımlanır (kur sırasında #oyun'a eklenir),
//    böylece aynı ikon yüz kez basılsa da kimlik çakışması olmaz.
//  • Gezinti ikonları tek renk boyalıdır (currentColor + gölge/ışık katmanı),
//    seçili sekmede beyaza döner.
//  • Çizgi ikonları currentColor, kalınlık 2, yuvarlak uç.
// ════════════════════════════════════════════════════════════════

const CIZGI = '#2B1D12'
const dis = `stroke="${CIZGI}" stroke-width="1.2" stroke-linejoin="round"`

// Ortak gradyanlar (yalnız §4.1 ve §5 paletinden renkler)
export const DEFS = `<svg class="ikon-tanim" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<radialGradient id="ci-para" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFE08A"/><stop offset=".5" stop-color="#F6C453"/><stop offset="1" stop-color="#D99A2B"/></radialGradient>
<linearGradient id="ci-para-k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C453"/><stop offset="1" stop-color="#A8690F"/></linearGradient>
<linearGradient id="ci-elmas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DB1F0"/><stop offset=".55" stop-color="#4A90E2"/><stop offset="1" stop-color="#2F6DB8"/></linearGradient>
<radialGradient id="ci-komur" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#4B565E"/><stop offset=".55" stop-color="#1F2326"/><stop offset="1" stop-color="#121517"/></radialGradient>
<linearGradient id="ci-ahsap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8743F"/><stop offset=".5" stop-color="#8A5A32"/><stop offset="1" stop-color="#6B4425"/></linearGradient>
<linearGradient id="ci-celik" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D1D8"/><stop offset=".5" stop-color="#A9B4BE"/><stop offset="1" stop-color="#6E7A86"/></linearGradient>
<linearGradient id="ci-kask" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset=".45" stop-color="#F2B632"/><stop offset="1" stop-color="#D99A2B"/></linearGradient>
<radialGradient id="ci-ten" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#F2C7A0"/><stop offset="1" stop-color="#E8B48A"/></radialGradient>
<linearGradient id="ci-tulum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3F72BE"/><stop offset=".5" stop-color="#2F5FA8"/><stop offset="1" stop-color="#23477F"/></linearGradient>
<linearGradient id="ci-kirmizi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E25A43"/><stop offset=".55" stop-color="#C4553B"/><stop offset="1" stop-color="#8E3426"/></linearGradient>
<linearGradient id="ci-koyu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3A2C"/><stop offset=".5" stop-color="#3A2A1E"/><stop offset="1" stop-color="#2B1D12"/></linearGradient>
<linearGradient id="ci-cam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FB3BF"/><stop offset=".6" stop-color="#2E6A78"/><stop offset="1" stop-color="#23535E"/></linearGradient>
<linearGradient id="ci-turuncu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F59A55"/><stop offset=".5" stop-color="#E67E3E"/><stop offset="1" stop-color="#CC5F27"/></linearGradient>
<linearGradient id="ci-eldiven" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#FBF4EA"/><stop offset="1" stop-color="#E9D7BC"/></linearGradient>
</defs></svg>`

// Beş köşeli yıldız yolu
function yildiz(cx, cy, R, r) {
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const u = k % 2 ? r : R
    d += (k ? 'L' : 'M') + (cx + Math.cos(a) * u).toFixed(2) + ' ' + (cy + Math.sin(a) * u).toFixed(2)
  }
  return d + 'Z'
}

// Dişli: 8 diş, ortası delik (evenodd)
function disli() {
  const n = 8, R = 10.2, r = 7.6
  let d = ''
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    const w = 0.2, ww = 0.3
    const p = [
      [r, a - ww], [R, a - w], [R, a + w], [r, a + ww],
    ]
    for (let j = 0; j < p.length; j++) {
      const [u, b] = p[j]
      d += (k === 0 && j === 0 ? 'M' : 'L') + (12 + Math.cos(b) * u).toFixed(2) + ' ' + (12 + Math.sin(b) * u).toFixed(2)
    }
  }
  return d + 'Z M12 8.6a3.4 3.4 0 1 0 0 6.8a3.4 3.4 0 1 0 0-6.8Z'
}

// Sikke silindiri (yığın için): yan yüz + üst elips
function sikke(cx, cy, rx, ry, h) {
  return `<path d="M${cx - rx} ${cy}v${h}a${rx} ${ry} 0 0 0 ${2 * rx} 0v${-h}" fill="url(#ci-para-k)" ${dis}/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ci-para)" ${dis}/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.62}" ry="${ry * 0.55}" fill="none" stroke="#A8690F" stroke-width=".7" opacity=".8"/>`
}

const GOVDE = {
  // ── Boyalı ──
  para: `<circle cx="12" cy="12" r="10" fill="url(#ci-para)" ${dis}/>
<circle cx="12" cy="12" r="7.2" fill="none" stroke="#A8690F" stroke-width="1" opacity=".7"/>
<path d="${yildiz(12, 12.3, 4.4, 1.9)}" fill="#FFE08A" stroke="#A8690F" stroke-width=".8" stroke-linejoin="round"/>
<path d="M5.4 9.6A7 7 0 0 1 9.6 5.3" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1.3" stroke-linecap="round"/>`,

  elmas: `<path d="M3.4 9 7.4 4h9.2l4 5L12 20.6Z" fill="url(#ci-elmas)" ${dis}/>
<path d="M3.4 9 7.4 4 9.5 9Z" fill="#7DB1F0"/>
<path d="M7.4 4h9.2l-2.1 5h-5Z" fill="#FFFFFF" fill-opacity=".55"/>
<path d="M16.6 4l4 5h-6.1Z" fill="#4A90E2"/>
<path d="M3.4 9h6.1L12 20.6Z" fill="#4A90E2"/>
<path d="M9.5 9h5L12 20.6Z" fill="#7DB1F0"/>
<path d="M14.5 9h6.1L12 20.6Z" fill="#2F6DB8"/>
<path d="M3.4 9 7.4 4h9.2l4 5L12 20.6Z" fill="none" ${dis}/>
<path d="M3.4 9h17.2" stroke="${CIZGI}" stroke-width=".7" opacity=".55"/>
<path d="M6.4 7.6l1.2-1.6" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/>`,

  'cevher.zonguldak': `<path d="M4.4 10.2 8.6 5.2l6.4-.7 4.8 4.2.6 5.6-3.6 5.1-7.2.6-5-4.1Z" fill="url(#ci-komur)" ${dis}/>
<path d="M8.6 5.2l6.4-.7-1.6 5.2-5.3.6Z" fill="#9FB7C9" fill-opacity=".34"/>
<path d="M15 4.5l4.8 4.2-2.6 3.6-3.8-2.6Z" fill="#9FB7C9" fill-opacity=".2"/>
<path d="M4.4 10.2 8.6 5.2l-.5 5.1Z" fill="#9FB7C9" fill-opacity=".16"/>
<path d="M8.1 10.3l5.3-.6 3.8 2.6-3 4.1-5.2-.9Z" fill="#9FB7C9" fill-opacity=".09"/>
<path d="M4.4 10.2 8.6 5.2l6.4-.7 4.8 4.2.6 5.6-3.6 5.1-7.2.6-5-4.1Z" fill="none" ${dis}/>
<circle cx="10.2" cy="7.2" r=".9" fill="#FFFFFF" fill-opacity=".85"/><circle cx="16.6" cy="8" r=".55" fill="#FFFFFF" fill-opacity=".6"/>`,

  sepet: `<path d="M5.2 9.6Q6 5.6 9.2 6.6q2-2.6 5-.6 3.2-1.8 4.6 3.6Z" fill="url(#ci-komur)" ${dis}/>
<circle cx="9.8" cy="7.6" r=".6" fill="#FFFFFF" fill-opacity=".7"/><circle cx="14.6" cy="7" r=".5" fill="#FFFFFF" fill-opacity=".6"/>
<path d="M3.2 9.4h17.6l-1.6 8H4.8Z" fill="url(#ci-ahsap)" ${dis}/>
<path d="M3.2 9.4h17.6l-.3 1.7H3.5Z" fill="url(#ci-kask)"/>
<path d="M7.8 11.4v5.8M12 11.4v5.8M16.2 11.4v5.8" stroke="${CIZGI}" stroke-width=".8" opacity=".45"/>
<path d="M3.2 9.4h17.6l-1.6 8H4.8Z" fill="none" ${dis}/>
<circle cx="8" cy="18.6" r="2.3" fill="url(#ci-celik)" ${dis}/><circle cx="16" cy="18.6" r="2.3" fill="url(#ci-celik)" ${dis}/>
<circle cx="8" cy="18.6" r=".7" fill="${CIZGI}"/><circle cx="16" cy="18.6" r=".7" fill="${CIZGI}"/>`,

  asansor: `<rect x="5" y="3.4" width="14" height="17.6" rx="1.8" fill="url(#ci-celik)" ${dis}/>
<rect x="7.2" y="6.2" width="9.6" height="12.4" rx="1" fill="url(#ci-cam)" stroke="${CIZGI}" stroke-width=".9"/>
<path d="M8.4 7.4l2.2 0-2.2 4.4Z" fill="#FFFFFF" fill-opacity=".35"/>
<path d="M12 7.6l3.6 4.2h-2.2v4.6h-2.8v-4.6H8.4Z" fill="url(#ci-kask)" stroke="${CIZGI}" stroke-width=".8" stroke-linejoin="round"/>
<path d="M5 5.2h14" stroke="${CIZGI}" stroke-width=".8" opacity=".5"/>
<path d="M12 .8v2.6" stroke="${CIZGI}" stroke-width="1.4"/>`,

  madenci: `<path d="M3.8 21.4q.6-6.2 8.2-6.2t8.2 6.2Z" fill="url(#ci-tulum)" ${dis}/>
<path d="M8.4 15.8l1 5.6M15.6 15.8l-1 5.6" stroke="#D9772B" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="12" cy="12" r="4.4" fill="url(#ci-ten)" ${dis}/>
<path d="M10.2 13.9q1.8 1 3.6 0" fill="none" stroke="${CIZGI}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>
<circle cx="10.4" cy="11.8" r=".6" fill="${CIZGI}"/><circle cx="13.6" cy="11.8" r=".6" fill="${CIZGI}"/>
<path d="M6.6 10.4Q7 4.4 12 4.3t5.4 6.1Z" fill="url(#ci-kask)" ${dis}/>
<path d="M5.4 10.1h13.2v1.5H5.4Z" fill="#D99A2B" ${dis}/>
<circle cx="12" cy="7.3" r="1.5" fill="#FFE08A" stroke="${CIZGI}" stroke-width=".9"/>
<path d="M8.6 6.6q1-1.4 2.2-1.6" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>`,

  kasa: `<path d="M8 10.6V7.8a4 4 0 0 1 8 0v2.8" fill="none" stroke="${CIZGI}" stroke-width="3.6" stroke-linecap="round"/>
<path d="M8 10.6V7.8a4 4 0 0 1 8 0v2.8" fill="none" stroke="url(#ci-celik)" stroke-width="2" stroke-linecap="round"/>
<rect x="4.6" y="10" width="14.8" height="11.4" rx="2.6" fill="url(#ci-koyu)" ${dis}/>
<path d="M6 11.6h12" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="1" stroke-linecap="round"/>
<circle cx="12" cy="15.8" r="3.5" fill="url(#ci-para)" stroke="#A8690F" stroke-width=".9"/>
<path d="${yildiz(12, 15.9, 1.9, 0.85)}" fill="#FFE08A" stroke="#A8690F" stroke-width=".5"/>`,

  'cevher.eregli': `<path d="M3.6 14.2 7.2 9.4h10.2l3.2 4.8-3.6 4.6H6.8Z" fill="url(#ci-kirmizi)" ${dis}/>
<path d="M7.2 9.4h10.2l-2.4 3.2H9.4Z" fill="#F3B49A" fill-opacity=".45"/>
<path d="M6 7.4 9 3.8h6.6l2.2 3.6-2.6 2H8.6Z" fill="url(#ci-celik)" ${dis}/>
<path d="M9 3.8h6.6l-1.6 2.2h-3.6Z" fill="#FFFFFF" fill-opacity=".45"/>`,
  'cevher.karabuk': `<path d="M4 15.6 6.4 8.2l6-3.4 6.4 2.6 1.6 7.6-4.2 4.8-7.8.4Z" fill="url(#ci-celik)" ${dis}/>
<path d="M6.4 8.2l6-3.4 1 5.4-5.6 1.8Z" fill="#FFFFFF" fill-opacity=".4"/>
<path d="M12.4 4.8l6.4 2.6-3 3.2-2.4-.4Z" fill="#FFFFFF" fill-opacity=".22"/>
<path d="M8 12l5.6-1.8 2.8 4.2-3.8 3.6-5-1.2Z" fill="#5E6A74" fill-opacity=".28"/>`,
  'cevher.kastamonu': `<path d="M4.2 13.4 8 7.6l7.2-1.2 4.6 4.8-1.4 6.4-6.2 2.6-6.4-2.4Z" fill="url(#ci-turuncu)" ${dis}/>
<path d="M8 7.6l7.2-1.2-1.8 4.4-5.6 1Z" fill="#FFE0B8" fill-opacity=".5"/>
<path d="M10.2 13.2c1.6-1 3.4-.6 4.6.6M8.6 16.2c2-.6 4 .2 5.4 1.2" fill="none" stroke="#3FBF8A" stroke-width="1.6" stroke-linecap="round"/>`,
  kitap: `<path d="M3.6 5.4c2.8-.9 5.6-.7 8.4.8v14c-2.8-1.5-5.6-1.7-8.4-.8Z" fill="url(#ci-kirmizi)" ${dis}/>
<path d="M20.4 5.4c-2.8-.9-5.6-.7-8.4.8v14c2.8-1.5 5.6-1.7 8.4-.8Z" fill="url(#ci-kirmizi)" ${dis}/>
<path d="M5.4 7.6c1.8-.4 3.6-.2 5 .5M5.4 10.4c1.8-.4 3.6-.2 5 .5M13.6 8.1c1.4-.7 3.2-.9 5-.5M13.6 10.9c1.4-.7 3.2-.9 5-.5" fill="none" stroke="#FFE0B8" stroke-width=".9" stroke-linecap="round"/>`,
  'kilit-acik': `<path d="M8 11V7.4a4 4 0 0 1 7.8-1.2" fill="none" stroke="${CIZGI}" stroke-width="3.6" stroke-linecap="round"/>
<path d="M8 11V7.4a4 4 0 0 1 7.8-1.2" fill="none" stroke="url(#ci-kask)" stroke-width="2" stroke-linecap="round"/>
<rect x="5" y="10.4" width="14" height="10.8" rx="2.4" fill="url(#ci-kask)" ${dis}/>
<path d="M12 14.2a1.6 1.6 0 0 0-.8 3l-.3 2h2.2l-.3-2a1.6 1.6 0 0 0-.8-3Z" fill="${CIZGI}"/>`,
  prestij: `<path d="M12 2.8 14.6 8l5.6.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4L9.4 8Z" fill="url(#ci-kask)" ${dis}/>
<path d="M12 6.4 13.4 9.2l3 .4-2.2 2.1.5 3-2.7-1.4Z" fill="#FFFFFF" fill-opacity=".45"/>
<path d="M5 20.6h14" stroke="url(#ci-turuncu)" stroke-width="2.4" stroke-linecap="round"/>`,
  gemi: `<path d="M3 14.4h18l-2.6 5H5.6Z" fill="url(#ci-kirmizi)" ${dis}/>
<path d="M6.4 14.4V9.6h11.2v4.8" fill="url(#ci-celik)" ${dis}/>
<path d="M9.6 9.6V6h4.8v3.6" fill="url(#ci-koyu)" ${dis}/>`,
  kilit: `<path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="${CIZGI}" stroke-width="3.6" stroke-linecap="round"/>
<path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="url(#ci-celik)" stroke-width="2" stroke-linecap="round"/>
<rect x="5" y="10.4" width="14" height="10.8" rx="2.4" fill="url(#ci-celik)" ${dis}/>
<path d="M12 14.2a1.6 1.6 0 0 0-.8 3l-.3 2h2.2l-.3-2a1.6 1.6 0 0 0-.8-3Z" fill="${CIZGI}"/>
<path d="M6.6 12h10.8" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>`,

  yildirim: `<path d="M13.8 2.4 5.2 13.6h5.6l-1.6 8 9.4-12.2h-5.8Z" fill="url(#ci-kask)" ${dis}/>
<path d="M12.6 4.8 8 11.2" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1" stroke-linecap="round"/>`,

  topla: `${sikke(8.6, 16.4, 5.6, 2.2, 3)}${sikke(8.6, 12.6, 5.6, 2.2, 3)}${sikke(8.6, 8.8, 5.6, 2.2, 3)}
<circle cx="15.8" cy="15" r="6.4" fill="url(#ci-para)" ${dis}/>
<circle cx="15.8" cy="15" r="4.6" fill="none" stroke="#A8690F" stroke-width=".8" opacity=".75"/>
<path d="${yildiz(15.8, 15.2, 2.9, 1.25)}" fill="#FFE08A" stroke="#A8690F" stroke-width=".6" stroke-linejoin="round"/>
<path d="M11.4 13.4a4.8 4.8 0 0 1 2.4-2.6" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="1" stroke-linecap="round"/>`,

  madalya: `<path d="M7 2.5h4l2.2 6.4-3.4 1.2Z" fill="url(#ci-elmas)" ${dis}/><path d="M17 2.5h-4l-2.2 6.4 3.4 1.2Z" fill="url(#ci-kirmizi)" ${dis}/>
<circle cx="12" cy="15" r="6.8" fill="url(#ci-para)" ${dis}/>
<circle cx="12" cy="15" r="4.9" fill="none" stroke="#A8690F" stroke-width=".9" opacity=".75"/>
<path d="${yildiz(12, 15.2, 3.1, 1.35)}" fill="#FFE08A" stroke="#A8690F" stroke-width=".6" stroke-linejoin="round"/>`,

  hediye: `<rect x="4" y="10" width="16" height="11" rx="1.6" fill="url(#ci-kirmizi)" ${dis}/>
<rect x="3" y="7.4" width="18" height="3.8" rx="1.2" fill="url(#ci-kirmizi)" ${dis}/>
<path d="M10.6 7.4h2.8V21h-2.8Z" fill="url(#ci-kask)" stroke="${CIZGI}" stroke-width=".8"/>
<path d="M12 7.2C10 3.4 6.4 4.6 7.6 6.6 8.3 7.6 10.6 7.4 12 7.2c1.4.2 3.7.4 4.4-.6C17.6 4.6 14 3.4 12 7.2Z" fill="url(#ci-kask)" ${dis}/>`,

  // ── Gezinti (tek renk boyalı: currentColor + gölge/ışık) ──
  kazma: `<path d="M4.3 20.6 14.6 9.9l1.6 1.6L5.9 22.2a1.1 1.1 0 0 1-1.6-1.6Z" fill="currentColor" ${dis}/>
<path d="M5.9 22.2 16.2 11.5l-.8-.8L5.1 21.4Z" fill="#000" fill-opacity=".22"/>
<path d="M8.6 2.9Q17.2 2.4 21.2 12.4a.9.9 0 0 1-1.5.9Q15.6 6.6 8.8 4.8a1 1 0 0 1-.2-1.9Z" fill="currentColor" ${dis}/>
<path d="M9.4 3.6q6.6.4 10.6 7.4" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/>
<rect x="13" y="6.6" width="4.4" height="4.4" rx="1" transform="rotate(45 15.2 8.8)" fill="currentColor" ${dis}/>
<rect x="13" y="6.6" width="4.4" height="4.4" rx="1" transform="rotate(45 15.2 8.8)" fill="#000" fill-opacity=".2"/>`,

  harita: `<path d="M2.6 6.4 8.4 4.4l7.2 2 5.8-2v13.2l-5.8 2-7.2-2-5.8 2Z" fill="currentColor" ${dis}/>
<path d="M8.4 4.4l7.2 2v13.2l-7.2-2Z" fill="#000" fill-opacity=".2"/>
<path d="M4.4 15.2q2.6-1 4.2.2t3.6-1.2 3.6.6 3.6-1.4" fill="none" stroke="${CIZGI}" stroke-width=".9" stroke-dasharray="1.4 1.2" opacity=".6"/>
<path d="M12 2.6a3.4 3.4 0 0 1 3.4 3.4c0 2.5-3.4 6-3.4 6s-3.4-3.5-3.4-6A3.4 3.4 0 0 1 12 2.6Z" fill="currentColor" ${dis}/>
<circle cx="12" cy="6" r="1.3" fill="${CIZGI}"/>`,

  yonetici: `<path d="M3.8 21.4q.4-7.4 8.2-7.4t8.2 7.4Z" fill="currentColor" ${dis}/>
<path d="M12 14l-2.4.4 2.4 2.4 2.4-2.4Z" fill="#FFFFFF" fill-opacity=".85"/>
<path d="M12 15.4l1.3 1.4-.7 4.4-.6.6-.6-.6-.7-4.4Z" fill="${CIZGI}"/>
<circle cx="12" cy="8" r="4.2" fill="currentColor" ${dis}/>
<path d="M14.8 9.6a3.6 3.6 0 0 1-4.8 1.6" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.2" stroke-linecap="round"/>
<path d="M9.6 6.2a2.8 2.8 0 0 1 2-1.6" fill="none" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>`,

  arastirma: `<path d="M10 2.8h4M10.6 3v6L5.2 18.2c-.8 1.4.2 3 1.8 3h10c1.6 0 2.6-1.6 1.8-3L13.4 9V3" fill="currentColor" ${dis}/>
<path d="M7.6 14.4h8.8l2.4 3.8c.8 1.4-.2 3-1.8 3H7c-1.6 0-2.6-1.6-1.8-3Z" fill="#000" fill-opacity=".24"/>
<circle cx="10.4" cy="17.4" r="1" fill="#FFFFFF" fill-opacity=".7"/><circle cx="13.4" cy="16" r=".7" fill="#FFFFFF" fill-opacity=".6"/>
<path d="M9.4 2.8h5.2" stroke="${CIZGI}" stroke-width="2.6" stroke-linecap="round"/><path d="M9.6 2.8h4.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,

  magaza: `<rect x="4" y="9.6" width="16" height="11.4" rx="1" fill="currentColor" ${dis}/>
<path d="M4 9.6h16v2H4Z" fill="#000" fill-opacity=".2"/>
<rect x="6" y="13.2" width="5" height="7.8" rx=".6" fill="#000" fill-opacity=".28" stroke="${CIZGI}" stroke-width=".9"/>
<rect x="13" y="13.2" width="5" height="4" rx=".6" fill="#FFFFFF" fill-opacity=".35" stroke="${CIZGI}" stroke-width=".9"/>
<path d="M2.8 7.4 5 3.4h14l2.2 4v.8a2.1 2.1 0 0 1-3.7 1.3 2.1 2.1 0 0 1-3.7 0 2.1 2.1 0 0 1-3.6 0 2.1 2.1 0 0 1-3.7 0 2.1 2.1 0 0 1-3.7-1.3Z" fill="currentColor" ${dis}/>
<path d="M8.6 3.4 7.6 8.6M12 3.4v5.4M15.4 3.4l1 5.2" stroke="${CIZGI}" stroke-width=".9" opacity=".55"/>
<path d="M5 3.4h3.6l-1 5.2a2.1 2.1 0 0 1-3.7-1.2Z M12 3.4h3.4l1 5.2a2.1 2.1 0 0 1-3.7 0Z" fill="#000" fill-opacity=".18"/>`,

  // ── Çizgi (currentColor) ──
  ayar: `<path d="${disli()}" fill="currentColor" fill-rule="evenodd"/>`,
  konum: `<path d="M12 21.4s-6.2-5.8-6.2-10.8a6.2 6.2 0 0 1 12.4 0c0 5-6.2 10.8-6.2 10.8Zm0-13.3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="currentColor" fill-rule="evenodd"/>`,
  yukari: `<path d="M12 3.2 20.4 12H15.2v8.6H8.8V12H3.6Z" fill="currentColor" stroke="#000" stroke-opacity=".18" stroke-width="1" stroke-linejoin="round"/>`,
  arti: `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
  tik: `<path d="M5 12.6l4.6 4.6L19.2 7.6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  kapat: `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`,
  geri: `<path d="M19 12H5.5M11.5 5.5 5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  bilgi: `<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 10.6v6.4" stroke="#2F6DB8" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.6" fill="#2F6DB8"/>`,
  uyari: `<path d="M10.3 3.6a2 2 0 0 1 3.4 0l8.4 14.6a2 2 0 0 1-1.7 3H3.6a2 2 0 0 1-1.7-3Z" fill="currentColor" stroke="${CIZGI}" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M12 8.4v6" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.5" fill="#FFFFFF"/>`,
  oynat: `<path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l10.6-6.8a1 1 0 0 0 0-1.7L9.5 4.3A1 1 0 0 0 8 5.2Z" fill="currentColor"/>`,
  saat: `<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.4V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ses: `<path d="M4 9.2h3.4L12 5v14l-4.6-4.2H4Z" fill="currentColor"/><path d="M15.4 8.8a4.6 4.6 0 0 1 0 6.4M17.8 6.4a8 8 0 0 1 0 11.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  sessiz: `<path d="M4 9.2h3.4L12 5v14l-4.6-4.2H4Z" fill="currentColor"/><path d="M15.6 9.4l5 5.2M20.6 9.4l-5 5.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  titresim: `<rect x="7.6" y="3.6" width="8.8" height="16.8" rx="1.8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.6 8.6v6.8M20.4 8.6v6.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  ileri: `<path d="M9 5.5 15.5 12 9 18.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,

  // Öğretici eli (beyaz eldiven, işaret parmağı yukarı)
  el: `<path d="M9.6 3.4c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v6.4l.4-.1c.9-.3 1.9.1 2.2 1l.2.6.5-.2c.9-.3 1.9.2 2.2 1.1l.1.5.3-.1c.9-.2 1.8.4 2 1.3.5 2.2.4 4.4-.4 6.4-.8 2-2.6 3.3-4.8 3.3h-3.1c-1.6 0-3.1-.8-4-2.1L4.2 15c-.6-.8-.4-1.9.4-2.5.8-.5 1.8-.4 2.4.3l2.6 2.7Z" fill="url(#ci-eldiven)" ${dis}/>
<path d="M13.2 10.2v3.6M15.8 11.5v3M18.4 13.1v2.4" stroke="${CIZGI}" stroke-width=".9" stroke-linecap="round" opacity=".55"/>`,
}

// Bilinmeyen bölge cevheri → kömür (S2 cevherleri B2/C2 ile gelir)
export function ikon(ad, sinif = '') {
  const g = GOVDE[ad] || GOVDE['cevher.zonguldak']
  return `<svg class="ik${sinif ? ' ' + sinif : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${g}</svg>`
}

export const cevherIkonu = (bolge, sinif) => ikon('cevher.' + bolge, sinif)
