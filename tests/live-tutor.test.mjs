import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preferredLanguage,publicLessonContext,validDeploymentId,mountLiveTutor} from '../live-tutor.js';
test('tutor uses the visitor language and a saved choice, not the website language',()=>{
 assert.equal(preferredLanguage(['en-US','pt-BR']),'en-US');
 assert.equal(preferredLanguage(['pt-BR'],'fr-CA'),'fr-CA');
 assert.equal(preferredLanguage(['not_a_locale','es-MX']),'es-MX');
 assert.equal(preferredLanguage([]),'en');
});
test('only public curriculum fields and institutional references reach the conversation',()=>{
 const privateValue='__PRIVATE_NOTE_EMAIL_UID__';
 const curriculum={teatro:[{id:'perceber',title:'Cena',objective:'Criar',task:'Inventar',materials:['Papel'],steps:['Agir'],adaptation:'Descrever',reflection:'O que mudou?',notes:privateValue,email:privateValue}]};
 const result=publicLessonContext({area:'teatro',stage:'perceber',notes:privateValue,uid:privateValue},curriculum,[{area:'teatro',title:'Museu',institution:'Museu',url:'https://museum.example/art',secret:privateValue}],'ja-JP');
 assert.match(result,/ja-JP/);assert.match(result,/Viola Spolin/);assert.match(result,/museum\.example/);assert.ok(!result.includes(privateValue));
 assert.ok(!publicLessonContext({area:'__proto__',stage:'constructor'},curriculum,[]).includes('"workshop":"__proto__"'));
});
test('missing deployment causes no DOM, SDK, room or microphone initialization',()=>{
 const forbidden=new Proxy({},{get(){throw Error('Unexpected browser access');}});
 const tutor=mountLiveTutor({settings:{deploymentId:''},document:forbidden,window:forbidden,loadProvider(){throw Error('Unexpected SDK access');}});
 assert.equal(tutor.configured,false);tutor.update({});tutor.destroy();
 for(const id of ['',null,'https://example.com','<script>'])assert.equal(validDeploymentId(id),false);
 assert.equal(validDeploymentId('public-deployment-123'),true);
});
test('the public tutor settings contain no API credentials',()=>{
 const config=JSON.parse(readFileSync(new URL('../live-tutor-settings.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(config),['deploymentId','sessionSeconds']);assert.ok(config.sessionSeconds<=120);
});
