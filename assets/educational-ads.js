/* Publicidade opcional: sem bloqueio de aulas, sem anúncios automáticos. */
(() => {
  const own = document.currentScript;
  const root = new URL('.', own.src);
  const privateRoute = () => /conta|caderno|account|login|moder|dashboard/i.test(location.hash + location.pathname);
  let consent = false, started = false;
  // A plataforma de consentimento deve emitir este evento após consentimento válido.
  window.addEventListener('sidineyr:ads-consent', event => {
    consent = event.detail?.advertising === true;
    if (consent) start();
    else document.getElementById('sidineyr-advertising')?.remove();
  });
  async function start() {
    if (started || !consent || privateRoute()) return;
    const config = await fetch(new URL('adsense-config.json', root)).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!config?.approved || !/^\d{6,20}$/.test(config.slot || '') || !consent || privateRoute()) return;
    started = true;
    const region = document.createElement('aside');
    region.id = 'sidineyr-advertising';
    const lang = document.documentElement.lang.slice(0, 2);
    const label = ({en:'Advertisement',es:'Publicidad'})[lang] || 'Publicidade';
    region.setAttribute('aria-label', label);
    region.style.cssText = 'box-sizing:border-box;clear:both;max-width:760px;margin:24px auto;padding:12px 16px;border-top:1px solid #aaa5;text-align:center;font:12px/1.5 sans-serif;';
    const title = document.createElement('small'); title.textContent = label;
    const ad = document.createElement('ins'); ad.className = 'adsbygoogle';
    ad.style.cssText = 'display:inline-block;width:100%;height:90px;max-width:728px;';
    ad.dataset.adClient = 'ca-pub-4924241177850142'; ad.dataset.adSlot = config.slot;
    region.append(title, document.createElement('br'), ad);
    // Apenas depois do conteúdo, sem deslocar controles ou cobrir atividades.
    const footer = document.querySelector('body > footer');
    if (footer) footer.before(region); else document.body.append(region);
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
    const sdk = document.createElement('script'); sdk.async = true; sdk.crossOrigin = 'anonymous';
    sdk.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4924241177850142';
    sdk.onerror = () => region.remove();
    sdk.onload = () => {
      if (!consent || privateRoute()) { region.remove(); return; }
      try { window.adsbygoogle.push({}); } catch { region.remove(); }
    };
    new MutationObserver(() => { if (ad.dataset.adStatus === 'unfilled') region.remove(); }).observe(ad, {attributes:true, attributeFilter:['data-ad-status']});
    document.head.append(sdk);
  }
  window.addEventListener('hashchange', () => { if (privateRoute()) document.getElementById('sidineyr-advertising')?.remove(); });
})();
