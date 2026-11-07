// Guided learning and institutional media; no account data is sent to providers.
import {mountIntroduction} from './introductions.js';
const text = (tag, value, parent) => {const e=document.createElement(tag);e.textContent=value;parent?.append(e);return e;};
const link=(label,url,parent)=>{const a=text('a',label,parent);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
export function mountExperience({lesson,area,resources,root}) {
 const abort=new AbortController(), {signal}=abort;
 const cleanupIntroduction=mountIntroduction(area,root);
 const on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
 let dialog;
 const gallery=resources.filter(r=>r.image&&(r.area===area||area==='integradas'));
 on(root,'click',event=>{const b=event.target.closest('[data-artwork]');if(!b||!root.contains(b))return;const r=resources.find(r=>r.id===b.dataset.artwork);if(r?.image)openArtwork(r,b);});
 function openArtwork(r,trigger){
  dialog?.remove();dialog=document.createElement('dialog');dialog.className='artwork-dialog';
  const heading=text('h2',r.title,dialog);heading.id='artwork-heading';dialog.setAttribute('aria-labelledby',heading.id);
  const controls=text('div','',dialog);controls.className='experience-controls';
  const viewport=text('div','',dialog);viewport.className='zoom-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','Obra ampliada. Use mais e menos para zoom e as setas para mover.');
  const image=document.createElement('img');image.src=r.image;image.alt=r.alt;image.draggable=false;viewport.append(image);
  let scale=1,x=0,y=0,drag;
  const draw=()=>image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  const zoom=delta=>{scale=Math.max(1,Math.min(4,scale+delta));if(scale===1)x=y=0;draw();};
  for(const [label,fn] of [['Ampliar +',()=>zoom(.5)],['Reduzir −',()=>zoom(-.5)],['Reiniciar',()=>{scale=1;x=y=0;draw();}],['Fechar',()=>dialog.close()]]){const b=text('button',label,controls);b.type='button';on(b,'click',fn);}
  text('p',`${r.author} · ${r.date} · ${r.institution}. ${r.rights}`,dialog);link('Consultar ficha oficial',r.url,dialog);
  on(viewport,'keydown',e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')zoom(.5);else if(e.key==='-')zoom(-.5);else {x+=e.key==='ArrowLeft'?25:e.key==='ArrowRight'?-25:0;y+=e.key==='ArrowUp'?25:e.key==='ArrowDown'?-25:0;draw();}}});
  on(viewport,'pointerdown',e=>{drag={x:e.clientX-x,y:e.clientY-y};viewport.setPointerCapture(e.pointerId);});
  on(viewport,'pointermove',e=>{if(drag&&scale>1){x=e.clientX-drag.x;y=e.clientY-drag.y;draw();}});
  on(viewport,'pointerup',()=>drag=null);on(viewport,'pointercancel',()=>drag=null);
  on(dialog,'close',()=>{dialog.remove();if(trigger.isConnected)trigger.focus();});document.body.append(dialog);dialog.showModal();
 }
 if(lesson){
  const section=document.createElement('section');section.className='guided-journey';
  text('p',`SEU ENCONTRO · CERCA DE ${lesson.durationMinutes} MINUTOS`,section).className='eyebrow';text('h2','Vamos fazer juntos.',section);
  text('h3','Nesta aula vamos usar',section);const materials=text('ul','',section);lesson.materials.forEach(m=>text('li',m,materials));
  text('h3','Sua tarefa',section);text('p',lesson.task,section);
  text('p','Os tempos organizam a prática. Você pode pausar, adaptar e avançar livremente; não há bloqueio por cronômetro.',section);
  for(const phase of lesson.journey){const d=text('details','',section);text('summary',`${phase.minutes} min · ${phase.title}`,d);text('p',phase.instruction,d);}
  text('h3','Uma pista do professor',section);text('p',lesson.teacherPrompt,section);
  text('h3','Como perceber seu aprendizado',section);lesson.selfAssessment.forEach(a=>{const label=text('label','',section);label.style.display='block';const check=document.createElement('input');check.type='checkbox';label.append(check,document.createTextNode(' '+a));});
  text('p','Esta checagem é livre e não fica salva. Registre no caderno o que quiser consultar depois.',section).className='small';
  if(lesson.pedagogy){const p=lesson.pedagogy;text('h3',p.author,section);text('p',p.text,section);link(p.title+' — referência bibliográfica pública',p.url,section);}
  root.querySelector('.lesson-content')?.prepend(section);
 }
 const host=root.querySelector('.lesson-content')||root.querySelector('.wrap');
 if(host&&gallery.length){
  const section=text('section','',host);section.className='art-room-section';text('h2','Uma volta pela galeria',section);
  text('p','Galeria virtual original do ART com imagens de acervos. Use os controles para mudar o ponto de vista ou explore a lista sem 3D.',section);
  const controls=text('div','',section);controls.className='experience-controls';
  const room=text('div','',section);room.className='art-room';const wall=text('div','',room);wall.className='art-room-wall';let angle=0;
  gallery.forEach(r=>{const b=text('button','',wall);b.type='button';const im=document.createElement('img');im.src=r.image;im.alt=r.alt;im.loading='lazy';b.append(im);text('span',r.title,b);on(b,'click',()=>openArtwork(r,b));});
  for(const [label,action] of [['Olhar à esquerda',()=>angle=Math.max(-25,angle-8)],['Olhar à direita',()=>angle=Math.min(25,angle+8)],['Vista sem 3D',()=>{room.classList.toggle('flat');angle=0;}]]){const b=text('button',label,controls);b.type='button';on(b,'click',()=>{action();wall.style.transform=`rotateY(${angle}deg)`;});}
  const media=text('section','',host);text('h2','Aprender com outras janelas',media);text('p','Os recursos externos só carregam ao escolher abrir. Os links oficiais preservam o ART em outra aba.',media);
  const entries=area==='danca'?[{title:'Joy in the Shadows · V&A Dundee',url:'https://www.vam.ac.uk/dundee/info/shaping-stories',embed:'https://www.youtube-nocookie.com/embed/TF2aXu8peZo',prompt:'Vídeo de dança em inglês. Observe uma pausa e uma mudança de direção. Depois invente uma sequência confortável; não é necessário acompanhar os movimentos do vídeo.'}]:area==='teatro'?[{title:'Oficina de boneco articulado · Cultura Paraná',url:'https://www.prcultura.pr.gov.br/Pagina/Oficina-de-Boneco-Articulado',prompt:'Tutorial público em português. Observe como a articulação permite uma ação. Se não tiver materiais, experimente a cena com dois objetos seguros.'}]:area==='musica'?[{title:'Cooking Rhythms · Georgia Public Broadcasting',url:'https://www.gpb.org/education/learn/lets-learn-ga/fine-arts/cooking-rhythms',prompt:'Aula pública em inglês com objetos cotidianos. Explore um ritmo suave com a mesa ou os dedos. Alterne som e pausa sem aumentar o volume.'}]:[{title:'Escultura em 3D · Smithsonian',url:'https://asia.si.edu/explore-art-culture/interactives/the-cosmic-buddha/',embed:'https://3d-api.si.edu/voyager/3d_package:d8c62be8-4ebc-11ea-b77f-2e728ce88125',prompt:'Buda com vestes que representam reinos da existência, acervo Smithsonian. Compare frente, costas e um detalhe; consulte o contexto religioso e histórico na fonte. Visualizador institucional em inglês.'},{title:'Met 360° Project · The Met',url:'https://www.metmuseum.org/art/online-features/met-360-project',prompt:'Escolha um passeio 360° no museu. Observe como o espaço organiza as obras. Depois desenhe um percurso possível para uma pequena exposição sua.'}];
  entries.forEach(m=>{const card=text('article','',media);card.className='media-lesson';text('h3',m.title,card);text('p',m.prompt,card);link('Abrir na instituição ↗',m.url,card);if(m.embed){const b=text('button','Carregar experiência aqui',card);b.type='button';on(b,'click',()=>{const frame=document.createElement('iframe');frame.src=m.embed;frame.title=m.title;frame.loading='lazy';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='fullscreen';card.append(frame);b.remove();text('p','Se o conteúdo não abrir, use o link da instituição acima.',card);});}});
 }
 return ()=>{cleanupIntroduction();abort.abort();dialog?.remove();};
}
