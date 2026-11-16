# Wave test harness

**Geliştirici:** İbrahim Can Göçmez

- **Start:** static ES-module app, no build. `node test/sunucu.mjs [port]` (default 8080; `sunucuBaslat(0, kok)` from a script picks a free port). Entry `/` serves index.html.
- **Ready:** wait for `window.__cevher.hazir === true`, then ~1.3 s, then click `.modal.acik [data-eylem="hikaye-atla"]` until none remain (story scenes).
- **Fonts:** route `fonts.googleapis|gstatic.com` to an empty 200 (offline); fallback fonts are expected.
- **Seed:** inject `test/kayitlar/zengin.json` into `localStorage['cevher2d-kayit']` via `addInitScript` (guard with a sessionStorage flag). Gives 3+ floors, upgrade sheet, managers, research, shop.
- **Open screens:** bottom tabs `.sekme` (index 0..4 = Maden, Harita, Yoneticiler, Arastirma, Magaza); upgrade sheet `[data-eylem="yukselt-ac"]`; settings `[data-eylem="ayarlar"]`. The upgrade sheet stays open over tab switches - close with `[data-eylem="pencere-kapat"]` before screenshotting other tabs.
- **Baseline compare:** `git archive HEAD | tar -x -C /tmp/headc` and serve that dir with `sunucuBaslat(0, '/tmp/headc')` to diff against pre-change (does not touch git state).
- **Quirks:** header "Gelir +N/sn" clips at 360px (pre-existing). Selected tab's 3px top line is #E67E3E on an orange gradient, so it is low-contrast.
- **Don't touch:** nothing external; app is fully offline/local.
