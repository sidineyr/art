// Managed Tavus deployment: only a public deployment ID, never a private API key.
export const SDK_URL='https://unpkg.com/@tavus/embed@0.19.0';
const areas=['visuais','musica','danca','teatro','integradas'];
export function preferredLanguage(languages=[],saved=''){
 for(const value of [saved,...languages,'en'])try{if(value)return new Intl.Locale(value).baseName;}catch{}
 return 'en';
}
export function publicLessonContext({area,stage}={},curriculum={},resources=[],language='en'){
 const lesson=areas.includes(area)?curriculum[area]?.find(l=>l.id===stage):null;
 const publicData={workshop:areas.includes(area)?area:null,lesson:lesson?{title:lesson.title,objective:lesson.objective,task:lesson.task,materials:lesson.materials,steps:lesson.steps,adaptation:lesson.adaptation,reflection:lesson.reflection}:null,sources:resources.filter(r=>r.area===area).map(r=>({title:r.title,institution:r.institution,url:r.url}))};
 return `You are the ART arts-learning tutor, a clearly identified AI, not a human teacher. Speak in the visitor's preferred language (${preferredLanguage([language])}), regardless of the website language. If they ask to change language, follow their choice. Be warm, brief and practical. Ask one question at a time. Guide feasible drawing, rhythm, movement and theatre tasks; offer seated, silent and descriptive alternatives. Never require a camera, recording, registration or disclosure of personal information. Do not request or claim access to private notebooks or account records. Distinguish documented art facts from interpretations. Use only the institutional sources supplied here for claims about artworks; admit uncertainty and never invent an attribution or link. Refer to Viola Spolin as the author of Jogos teatrais: o fichário de Viola Spolin when relevant, without reproducing the book. The visitor may stop at any time. This is a short free trial; do not promise unlimited access. Public lesson data: ${JSON.stringify(publicData)}`;
}
export function validDeploymentId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{6,128}$/.test(value);}
const words={
 pt:{open:'Conversar com o tutor',title:'Tutor de Artes · IA',language:'Idioma da conversa',start:'Abrir conversa em vídeo',close:'Fechar',notice:'Ao iniciar a conversa, sua voz será processada pelo Tavus. A câmera começa desligada. O caderno pessoal não é enviado. Teste gratuito sujeito à cota disponível.',loading:'Carregando o tutor…',ready:'Escolha iniciar na janela de vídeo quando estiver pronto.',error:'O tutor não está disponível agora. Você pode continuar as atividades do ateliê.',limit:'Esta conversa de teste terminou. Você pode continuar explorando o ART.',active:'Conversa em andamento. Você pode encerrá-la a qualquer momento.'},
 en:{open:'Talk to the tutor',title:'Arts tutor · AI',language:'Conversation language',start:'Open video conversation',close:'Close',notice:'When you start, Tavus will process your voice. Your camera starts off. Your private notebook is not shared. Free trial subject to available quota.',loading:'Loading your tutor…',ready:'Choose Start in the video when you are ready.',error:'The tutor is unavailable right now. You can continue exploring the workshop.',limit:'This trial conversation has ended. You can continue exploring ART.',active:'Conversation in progress. You can end it at any time.'},
 es:{open:'Conversar con el tutor',title:'Tutor de Artes · IA',language:'Idioma de la conversación',start:'Abrir conversación en vídeo',close:'Cerrar',notice:'Al iniciar, Tavus procesará tu voz. La cámara empieza apagada. Tu cuaderno privado no se comparte. Prueba gratuita sujeta a la cuota disponible.',loading:'Cargando el tutor…',ready:'Elige iniciar en el vídeo cuando estés listo.',error:'El tutor no está disponible. Puedes continuar las actividades.',limit:'La conversación de prueba ha terminado. Puedes seguir explorando ART.',active:'Conversación en curso. Puedes terminarla cuando quieras.'},
 fr:{open:'Parler au tuteur',title:'Tuteur artistique · IA',language:'Langue de la conversation',start:'Ouvrir la conversation vidéo',close:'Fermer',notice:'Au démarrage, Tavus traitera votre voix. La caméra reste désactivée au départ. Votre carnet privé n’est pas partagé. Essai gratuit selon le quota disponible.',loading:'Chargement du tuteur…',ready:'Choisissez Démarrer dans la vidéo lorsque vous êtes prêt.',error:'Le tuteur est indisponible. Vous pouvez continuer les activités.',limit:'Cet essai est terminé. Vous pouvez continuer à explorer ART.',active:'Conversation en cours. Vous pouvez l’arrêter à tout moment.'}
};
let sdkPromise;
function loadSdk(){
 if(customElements.get('tavus-embed'))return Promise.resolve();
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=SDK_URL;script.async=true;script.onload=()=>resolve();script.onerror=()=>{script.remove();sdkPromise=null;reject(Error('Tavus SDK unavailable'));};document.head.append(script);});
 return sdkPromise;
}
export function mountLiveTutor({settings,curriculum,resources,document:doc=globalThis.document,loadProvider=loadSdk,window:win=globalThis.window}={}){
 // An unconfigured integration creates no UI, SDK requests, rooms or microphone use.
 if(!validDeploymentId(settings?.deploymentId))return {configured:false,update(){},destroy(){}};
 let saved='';try{saved=win.localStorage.getItem('art-tutor-language')||'';}catch{}
 let language=preferredLanguage(win.navigator.languages||[win.navigator.language],saved),route={},panel,element,timer,revision=0,active=false,panelAbort;
 const copy=()=>words[language.split('-')[0]]||words.en;
 const abort=new AbortController();
 const on=(target,event,handler)=>target.addEventListener(event,handler,{signal:abort.signal});
 const make=(tag,value,parent)=>{const e=doc.createElement(tag);e.textContent=value;parent?.append(e);return e;};
 const launcher=make('button',copy().open,doc.body);launcher.type='button';launcher.className='live-tutor-launcher';launcher.setAttribute('aria-expanded','false');
 const stop=()=>{active=false;clearTimeout(timer);timer=null;const target=element;element=null;try{const result=target?.destroy?.();result?.catch?.(()=>{});}catch{}target?.remove();};
 const close=()=>{++revision;stop();panelAbort?.abort();panel?.remove();panel=null;win.ART_LIVE_TUTOR_ACTIVE=false;launcher.setAttribute('aria-expanded','false');launcher.focus();};
 const update=next=>{route={area:next?.area,stage:next?.stage};if(active&&element?.sendMessage)try{const sent=element.sendMessage({event_type:'conversation.append_llm_context',properties:{context:publicLessonContext(route,curriculum,resources,language)}});sent?.catch?.(()=>{});}catch{}};
 on(launcher,'click',()=>{
  if(panel){close();return;}panelAbort=new AbortController();const listen=(target,event,handler)=>target.addEventListener(event,handler,{signal:panelAbort.signal});win.ART_LIVE_TUTOR_ACTIVE=true;
  // Close the introductory stage when a visitor chooses the live conversation.
  doc.querySelector('.atelier-stage[open]')?.close();
  panel=make('section','',doc.body);panel.className='live-tutor-panel';panel.setAttribute('aria-label',copy().title);panel.lang=language;
  const header=make('div','',panel);header.className='live-tutor-header';make('h2',copy().title,header);const dismiss=make('button',copy().close,header);dismiss.type='button';listen(dismiss,'click',close);
  const label=make('label',copy().language,panel),select=make('select','',label);select.setAttribute('aria-label',copy().language);
  const choices=[...new Set([language,'pt-BR','en','es','fr','de','it','ja','zh','ar','hi','ko'])];let names;try{names=new Intl.DisplayNames([language],{type:'language'});}catch{}
  for(const code of choices){const option=make('option',names?.of(code)||code,select);option.value=code;}select.value=language;
  const notice=make('p',copy().notice,panel);notice.className='small';const status=make('p','',panel);status.setAttribute('role','status');
  const begin=make('button',copy().start,panel);begin.type='button';begin.className='button';const video=make('div','',panel);video.className='live-tutor-video';video.hidden=true;
  listen(select,'change',()=>{language=preferredLanguage([select.value]);panel.lang=language;try{win.localStorage.setItem('art-tutor-language',language);}catch{}launcher.textContent=copy().open;header.querySelector('h2').textContent=copy().title;dismiss.textContent=copy().close;notice.textContent=copy().notice;begin.textContent=copy().start;});
  listen(begin,'click',async()=>{
   const request=++revision;begin.disabled=true;select.disabled=true;status.textContent=copy().loading;
   try{
    await loadProvider();if(request!==revision||!panel)return;
    element=doc.createElement('tavus-embed');element.setAttribute('deployment-id',settings.deploymentId);element.setAttribute('camera-on-start','off');element.setAttribute('conversational-context',publicLessonContext(route,curriculum,resources,language));
    element.setAttribute('override-config',JSON.stringify({customization:{conversation:{unique_memory_tag:false},style:{mode:'dark'}}}));
    listen(element,'tavus:ready',()=>status.textContent=copy().ready);
    listen(element,'tavus:conversation-started',()=>{active=true;status.textContent=copy().active;clearTimeout(timer);timer=setTimeout(()=>{stop();video.hidden=true;status.textContent=copy().limit;},Math.min(120,Math.max(30,Number(settings.sessionSeconds)||120))*1000);});
    listen(element,'tavus:conversation-ended',()=>{stop();video.hidden=true;status.textContent=copy().limit;});
    listen(element,'tavus:error',()=>{stop();video.hidden=true;status.textContent=copy().error;});
    video.hidden=false;video.append(element);begin.hidden=true;
   }catch{if(request!==revision||!panel)return;status.textContent=copy().error;begin.disabled=false;select.disabled=false;}
  });
  launcher.setAttribute('aria-expanded','true');dismiss.focus();
 });
 on(win,'pagehide',()=>{if(panel)close();else{++revision;stop();}});
 return {configured:true,update,destroy(){++revision;stop();panelAbort?.abort();abort.abort();panel?.remove();launcher.remove();win.ART_LIVE_TUTOR_ACTIVE=false;}};
}
