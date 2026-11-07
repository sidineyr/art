/* Links editoriais por contexto; nenhuma análise de dados pessoais. */
(() => {
 const project = "art";
 const url = 'https://www.mercadolivre.com.br/social/mrsid';
 const pairs = {
  art:['Pincéis, papel e lápis de desenho','Brushes, paper and drawing pencils','Pinceaux, papier et crayons à dessin','Pinceles, papel y lápices de dibujo'],
  musica:['Livros de música e instrumentos rítmicos simples','Music books and simple percussion instruments','Livres de musique et petits instruments de percussion','Libros de música e instrumentos sencillos de percusión'],
  danca:['Livros de dança e expressão corporal','Books on dance and movement','Livres sur la danse et l’expression corporelle','Libros sobre danza y expresión corporal'],
  teatro:['Livros de jogos teatrais e expressão','Books on theatre games and expression','Livres de jeux théâtraux et d’expression','Libros de juegos teatrales y expresión'],
  integradas:['Papel, lápis e materiais de colagem','Paper, pencils and collage materials','Papier, crayons et matériel de collage','Papel, lápices y materiales para collage'],
  biosfera:['Sementes para observar a germinação','Seeds for observing germination','Graines pour observer la germination','Semillas para observar la germinación'],
  eletricidade:['Arduino e componentes para projetos de baixa tensão','Arduino and components for low-voltage projects','Arduino et composants pour des projets à basse tension','Arduino y componentes para proyectos de baja tensión'],
  fisica:['Livros de física e materiais de medição','Physics books and measuring tools','Livres de physique et instruments de mesure','Libros de física e instrumentos de medición'],
  chemical:['Livros de química e materiais de observação','Chemistry books and observation tools','Livres de chimie et matériel d’observation','Libros de química y materiales de observación'],
  filosofia:['Livros de filosofia e história do pensamento','Books on philosophy and the history of ideas','Livres de philosophie et d’histoire des idées','Libros de filosofía e historia del pensamiento'],
  python:['Livros de Python e estatística','Books on Python and statistics','Livres sur Python et les statistiques','Libros de Python y estadística'],
  leitura:['Livros e cadernos de leitura','Books and reading journals','Livres et carnets de lecture','Libros y cuadernos de lectura'],
  digital:['Livros de educação digital e pesquisa','Books on digital literacy and research','Livres sur le numérique et la recherche documentaire','Libros de alfabetización digital e investigación'],
  estudos:['Livros e materiais para organizar os estudos','Books and study materials','Livres et matériel pour organiser les études','Libros y materiales para organizar el estudio'],
  genoma:['Livros de biologia e genética','Books on biology and genetics','Livres de biologie et de génétique','Libros de biología y genética'],
  memoria:['Jogos de memória e livros de desafios','Memory games and puzzle books','Jeux de mémoire et livres d’énigmes','Juegos de memoria y libros de acertijos']
 };
 const projects={'Einstein-Fisica':'fisica','filosofia-aberta':'filosofia','python-swirl-statistics':'python',qv:'estudos',bb:'digital',Polliniza:'digital',puzzless:'memoria',sidletras:'leitura',wikiacolhe:'digital',atlas:'filosofia',horizonte:'estudos',genoma:'genoma',harmonia:'musica',babies:'musica',aprenda:'estudos'};
 function render() {
  document.getElementById('educational-affiliate')?.remove();
  if (/conta|account|caderno|login|dashboard|moder/i.test(location.hash+location.pathname)) return;
  let topic=projects[project]||project;
  if (project==='art') topic=['musica','danca','teatro','integradas'].find(t=>location.hash.includes(t))||'art';
  if (project==='Einstein-Fisica' && /eletri|circuit|arduino/i.test(location.hash+location.pathname)) topic='eletricidade';
  if (!pairs[topic]) return;
  const lang=document.documentElement.lang.slice(0,2), i=({en:1,fr:2,es:3})[lang]||0;
  const labels=[['Publicidade · link de afiliado','Materiais opcionais para educadores e responsáveis','Visitar a vitrine de Sidiney no Mercado Livre (Brasil) ↗','Posso receber comissão pelas compras. Consulte a disponibilidade na vitrine. A atividade pode ser feita com o que você já tem.'],['Advertisement · affiliate link','Optional materials for educators and carers','Visit Sidiney’s Mercado Livre showcase (Brazil) ↗','I may earn a commission on purchases. Check availability in the showcase. You can use materials you already have for the activity.'],['Publicité · lien affilié','Matériel facultatif pour les équipes éducatives et les familles','Voir la sélection de Sidiney sur Mercado Livre (Brésil) ↗','Je peux percevoir une commission sur les achats. Vérifiez la disponibilité dans la vitrine. Pour l’activité, vous pouvez utiliser le matériel dont vous disposez déjà.'],['Publicidad · enlace de afiliado','Materiales opcionales para docentes y familias','Visitar la vitrina de Sidiney en Mercado Livre (Brasil) ↗','Puedo recibir una comisión por las compras. Consulta la disponibilidad en la vitrina. Puedes realizar la actividad con los materiales que ya tienes.']][i];
  const box=document.createElement('aside');box.id='educational-affiliate';box.setAttribute('aria-label',labels[0]);box.style.cssText='box-sizing:border-box;max-width:760px;margin:20px auto;padding:12px 16px;border-top:1px solid #9995;font:12px/1.55 sans-serif;';
  const small=document.createElement('small');small.textContent=labels[0];
  const p=document.createElement('p');p.style.margin='6px 0';p.textContent=labels[1]+': '+pairs[topic][i]+'.';
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='sponsored noopener noreferrer';a.textContent=labels[2];
  const note=document.createElement('p');note.style.cssText='font-size:11px;margin:6px 0 0';note.textContent=labels[3];
  box.append(small,p,a,note);
  const footer=document.querySelector('body > footer');if(footer)footer.before(box);else document.body.append(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
 window.addEventListener('hashchange',render);
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();

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
