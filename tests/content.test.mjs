import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const curriculum=JSON.parse(read('curriculum.json'));
const resources=JSON.parse(read('resources.json'));
test('30 complete encounters offer four mediation modes and optional reflection',()=>{
 assert.deepEqual(Object.keys(curriculum),['visuais','musica','danca','teatro','integradas']);
 for(const list of Object.values(curriculum)){
  assert.deepEqual(list.map(l=>l.id),['perceber','conhecer','experimentar','criar','conectar','compartilhar']);
  for(const l of list){for(const key of ['title','objective','observe','context','adaptation','reflection'])assert.ok(l[key]?.trim());assert.ok(l.steps.length>=3);for(const p of ['infancia','adolescencia','adultos','livre'])assert.ok(l.audience[p]?.trim());}
 }
 assert.doesNotMatch(read('curriculum.json'),/EF\d\dAR\d+/);
});

test('every encounter includes a feasible task and at least ten minutes of guided practice',()=>{
 for(const list of Object.values(curriculum))for(const lesson of list){
  assert.ok(lesson.task?.trim());assert.ok(lesson.materials.length>0);
  assert.equal(lesson.journey.length,lesson.steps.length+2);
  assert.equal(lesson.durationMinutes,lesson.journey.reduce((sum,phase)=>sum+phase.minutes,0));
  assert.ok(lesson.durationMinutes>=10);
  assert.deepEqual(lesson.journey.slice(1,-1).map(phase=>phase.instruction),lesson.steps);
  assert.ok(lesson.selfAssessment.length>=3);
 }
 for(const lesson of curriculum.teatro){assert.equal(lesson.pedagogy.author,'Viola Spolin');assert.match(lesson.pedagogy.title,/fichário/);}
});

test('all five introductions have a complete twenty-second script and packaged animation assets',async()=>{
 const {introductions}=await import('../introductions.js');
 const metadata=JSON.parse(read('assets/INTRODUCTIONS.json'));
 assert.deepEqual(Object.keys(introductions),Object.keys(curriculum));
 for(const [area,intro] of Object.entries(introductions)){
  assert.equal(intro.captions.length,4);assert.ok(intro.alt.trim());
  for(const extension of ['png','gif'])assert.ok(existsSync(new URL(`../assets/intro-${area}.${extension}`,import.meta.url)));
  const animation=metadata.animations.find(a=>a.area===area);assert.equal(animation.frames,64);assert.equal(animation.durationMs,20000);
 }
 for(const file of ['experience.js','introductions.js'])assert.ok(read('scripts/build.mjs').includes(`'${file}'`));
});
test('references are unique HTTPS institutional URLs and embedded images exist',()=>{
 assert.equal(new Set(resources.map(r=>r.id)).size,resources.length);
 const allowed=['clevelandart.org','metmuseum.org','masp.org.br','musee-rodin.fr','gov.br','camara.leg.br','vam.ac.uk','iphan.gov.br','pinacoteca.org.br','loc.gov'];
 for(const r of resources){const u=new URL(r.url);assert.equal(u.protocol,'https:');assert.ok(allowed.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)),r.url);for(const k of ['title','author','date','institution','rights','access','context'])assert.ok(r[k]);if(r.image)assert.ok(existsSync(new URL('../'+r.image,import.meta.url)));}
});
test('all 30 curriculum identifiers match the mural validation allowlist',async()=>{
 const {validateSubmission}=await import('../mural.js');
 for(const [area,list] of Object.entries(curriculum))for(const l of list)assert.equal(validateSubmission({lesson:`${area}-${l.id}`,kind:'anotacao',body:'Teste',submissionId:'12345678-1234-1234-1234-123456789abc'}).lesson,`${area}-${l.id}`);
});
test('external link helper preserves the site and user content is escaped',()=>{
 const js=read('app.js');assert.match(js,/target="_blank" rel="noopener noreferrer"/);assert.match(js,/esc\(e\.body\)/);assert.match(js,/Mensagem recebida para revisão/);assert.doesNotMatch(read('config.js'),/service_role|sb_secret_|eyJ[A-Za-z0-9_-]+\./);
});
