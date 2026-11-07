export const introductions={
 visuais:{title:'Artes visuais',alt:'O Pequeno Príncipe do Callguid criando uma pintura num ateliê colorido.',captions:['Bem-vindo ao ateliê de artes visuais. Vamos descobrir linhas, cores e formas.','Olhe uma obra de perto. Amplie a imagem e escolha um detalhe que desperte curiosidade.','Separe papel e lápis, ou materiais que já tenha. Experimente mais de uma solução.','Guarde uma descoberta no caderno. Compartilhar é opcional; criar é o nosso convite.']},
 musica:{title:'Música',alt:'O Pequeno Príncipe do Callguid tocando um tambor num laboratório musical em preto e branco.',captions:['Entre no laboratório de música. Primeiro, escute os sons e os silêncios ao redor.','Não precisa ter instrumento. Uma mesa, palmas ou os dedos podem marcar a pulsação.','Invente um ritmo suave. Repita, faça uma pausa e mude apenas uma parte.','Compare as versões e registre sua descoberta. Sinais visuais também podem representar o ritmo.']},
 danca:{title:'Dança',alt:'O Pequeno Príncipe do Callguid dançando num espaço em tons de coral e roxo.',captions:['Este é o ateliê de dança. Seu corpo e seu conforto são o ponto de partida.','Escolha um gesto possível: acenar, mover um dedo ou olhar em outra direção.','Experimente devagar, depois com uma pausa. Combine três gestos, sentado ou em pé.','Não precisa filmar nem se apresentar. Descreva o que mudou e o que quer explorar.']},
 teatro:{title:'Teatro',alt:'O Pequeno Príncipe do Callguid representando uma pequena cena num palco com cortinas.',captions:['O palco está aberto. Um gesto, uma pausa ou um objeto já podem iniciar uma história.','Vamos dialogar com os jogos teatrais de Viola Spolin, escolhendo um foco para experimentar.','Invente uma situação e um objetivo. Teste uma escolha diferente, sem precisar decorar falas.','Depois da cena, descreva o que percebeu. Você também pode criar com objetos ou por escrito.']},
 integradas:{title:'Artes integradas',alt:'O Pequeno Príncipe do Callguid combinando formas de papel e ritmo num ateliê verde.',captions:['Aqui as linguagens se encontram. Como uma linha poderia virar gesto ou som?','Escolha duas formas de criar e uma pergunta que queira investigar.','Faça um pequeno protótipo com o que tiver. Observe como uma linguagem transforma a outra.','Revise uma escolha, dê os créditos e pense numa forma acessível de apresentar sua criação.']}
};
export function mountIntroduction(area,root){
 const data=introductions[area],hero=root.querySelector('.theme-hero');if(!data||!hero)return()=>{};
 const abort=new AbortController();let timer=null,start=0;
 const section=document.createElement('section');section.className='atelier-intro';section.setAttribute('aria-label',`Apresentação do ateliê de ${data.title}`);
 const h=document.createElement('h2');h.textContent=`Seu guia no ateliê de ${data.title}`;section.append(h);
 const layout=document.createElement('div');layout.className='atelier-intro-layout';section.append(layout);
 const image=document.createElement('img');image.width=384;image.height=384;image.alt=data.alt;image.src=`assets/intro-${area}.png`;layout.append(image);
 const content=document.createElement('div');layout.append(content);const p=document.createElement('p');p.textContent='Uma apresentação de 20 segundos com o personagem do Callguid. Sem som automático.';content.append(p);
 const caption=document.createElement('p');caption.className='intro-caption';caption.textContent=data.captions[0];content.append(caption);
 const progress=document.createElement('progress');progress.className='intro-progress';progress.max=20;progress.value=0;progress.setAttribute('aria-label','Tempo da apresentação');content.append(progress);
 const controls=document.createElement('div');controls.className='experience-controls';content.append(controls);
 const play=document.createElement('button');play.type='button';play.textContent='Assistir · 20 segundos';controls.append(play);
 const skip=document.createElement('button');skip.type='button';skip.textContent='Pular apresentação';controls.append(skip);
 const transcript=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Ler a apresentação completa';transcript.append(summary);for(const line of data.captions){const p=document.createElement('p');p.textContent=line;transcript.append(p);}content.append(transcript);
 const stop=()=>{clearInterval(timer);timer=null;image.onload=null;image.onerror=null;image.src=`assets/intro-${area}.png`;play.textContent='Assistir novamente · 20 segundos';play.disabled=false;};
 play.addEventListener('click',()=>{stop();play.disabled=true;play.textContent='Carregando apresentação…';caption.textContent=data.captions[0];progress.value=0;image.onload=()=>{image.onload=null;start=performance.now();play.disabled=false;play.textContent='Recomeçar · 20 segundos';timer=setInterval(()=>{const elapsed=(performance.now()-start)/1000;progress.value=Math.min(20,elapsed);caption.textContent=data.captions[Math.min(3,Math.floor(elapsed/5))];if(elapsed>=20)stop();},100);};image.onerror=()=>{stop();caption.textContent='A animação não carregou. Você pode ler a apresentação completa abaixo e continuar o percurso.';};image.src=`assets/intro-${area}.gif`;},{signal:abort.signal});
 skip.addEventListener('click',()=>{stop();root.querySelector('.lesson-button')?.focus();section.hidden=true;},{signal:abort.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal:abort.signal});
 hero.after(section);
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)play.click();
 return()=>{clearInterval(timer);image.onload=null;image.onerror=null;abort.abort();};
}
