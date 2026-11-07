import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=new URL(process.argv[2]||'https://sidineyr.github.io/art/');
const hash=text=>createHash('sha256').update(text).digest('hex');
async function get(relative,file){
 const url=new URL(relative,base);
 const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
 assert.ok(response.ok,`${file}: HTTP ${response.status}`);
 const actual=await response.text(),expected=await readFile(new URL('../dist/'+file,import.meta.url),'utf8');
 assert.equal(hash(actual),hash(expected),`${file}: o servidor ainda não entrega a versão desta publicação`);
 return actual;
}
let lastError;
for(let attempt=0;attempt<18;attempt++){
 try{
  const html=await get('?release='+encodeURIComponent(process.env.GITHUB_SHA||Date.now()),'index.html');
  const app=await get(html.match(/src="(app\.js\?[^"\s]+)"/)[1],'app.js');
  await get(html.match(/href="(styles\.css\?[^"\s]+)"/)[1],'styles.css');
  const experience=await get(app.match(/import\('(\.\/experience\.js\?[^']+)'\)/)[1],'experience.js');
  const intro=await get(experience.match(/from '(\.\/introductions\.js\?[^']+)'/)[1],'introductions.js');
  assert.doesNotMatch(intro,/Uma apresentação de 20 segundos com o personagem|Sem som automático\./);
  assert.match(intro,/atelier-stage/);
  console.log('Site público conferido: HTML, CSS, aplicativo e apresentação correspondem à versão publicada; aviso antigo ausente.');
  process.exit(0);
 }catch(error){lastError=error;if(attempt<17)await new Promise(resolve=>setTimeout(resolve,5000));}
}
throw lastError;
