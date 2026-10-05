// ════════════════════════════════════════════════════════════════
//  REKLAM — yalnızca isteğe bağlı ödüllü reklam. Oyuncu "İzle"ye
//  basmadıkça hiçbir reklam çıkmaz; zorunlu geçiş reklamı yok.
//  • Telefon uygulamasında (Capacitor + AdMob eklentisi) gerçek ödüllü
//    reklam gösterilir; reklam sonuna kadar izlenirse ödül verilir.
//  • Tarayıcı sürümünde reklam yok: kısa bir "reklam alanı" önizlemesi
//    çıkar ve ödül verilir (yerlerin ve akışın denenmesi için).
//  • "Reklamsız" satın alındıysa reklam açılmaz, ödül hemen verilir.
//  Yerler: takviye (+30 dk ×2 satış), cevrimdisi (×2 topla),
//  [S2] elmas (+5 elmas), arastirma (−15 dk).
//  Eski oyundan taşındı (§6.9): kur({ durumAl, kok }) ile bağlanır.
// ════════════════════════════════════════════════════════════════
export const Reklam = (() => {
  // Google'ın deneme kimliği; yayında AdMob panelindeki gerçek kimlikle değişir
  const ODULLU_ID = 'ca-app-pub-3940256099942544/5224354917'
  const admob = () => window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.AdMob
  let calisiyor = false
  let durumAl = () => null
  let kok = null

  // ana.js bağlar: durumu okuyan işlev ve önizleme perdesinin ekleneceği kök (#oyun)
  function kur(secenek = {}) {
    if (secenek.durumAl) durumAl = secenek.durumAl
    if (secenek.kok) kok = secenek.kok
  }

  async function yerelIzle() {
    const a = admob()
    await a.prepareRewardVideoAd({ adId: ODULLU_ID })
    const odul = await a.showRewardVideoAd()
    return Boolean(odul)
  }

  // Tarayıcıda: 2 sn'lik önizleme perdesi
  function onizle(yer) {
    return new Promise((bitti) => {
      const p = document.createElement('div')
      p.className = 'reklam-perde'
      p.innerHTML = `<div class="reklam-kutu"><b>Reklam alanı</b><span>Uygulamada burada kısa bir ödüllü reklam oynar (${yer}).</span><i class="reklam-sayac"><i></i></i></div>`
      ;(kok || document.getElementById('oyun') || document.body).appendChild(p)
      setTimeout(() => { p.remove(); bitti(true) }, 2000)
    })
  }

  // Ödül hak edildiyse true döner
  async function izle(yer) {
    try {
      if (durumAl()?.satin?.reklamsiz) return true
    } catch {}
    if (calisiyor) return false
    calisiyor = true
    try {
      return admob() ? await yerelIzle() : await onizle(yer)
    } catch {
      return false
    } finally {
      calisiyor = false
    }
  }

  return { kur, izle, gercek: () => Boolean(admob()) }
})()
