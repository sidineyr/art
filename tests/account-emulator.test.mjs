import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import * as apps from 'firebase/app';
import * as auth from 'firebase/auth';
import * as store from 'firebase/firestore';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {createMuralClient} from '../mural.js';
store.setLogLevel('silent');
test('real Auth and Firestore: registration, private notebook, recovery, contributions and isolation',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-art',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
 const created=[],accounts=[];
 const sdk={...apps,...auth,...store,browserSessionPersistence:auth.inMemoryPersistence,
  initializeApp(config,name){const app=apps.initializeApp({...config,projectId:'demo-art'},name+'-'+randomUUID());created.push(app);return app;},
  getFirestore(app){const db=store.getFirestore(app);store.connectFirestoreEmulator(db,'127.0.0.1',8080);return db;},
  initializeAuth(app,options){const a=auth.initializeAuth(app,options);auth.connectAuthEmulator(a,'http://127.0.0.1:9099',{disableWarnings:true});accounts.push(a);return a;}};
 const client=()=>createMuralClient({configGetter:()=>({apiKey:'demo-key',projectId:'demo-art',appId:'demo-app',authDomain:'demo-art.firebaseapp.com'}),sdkLoader:async()=>sdk});
 const a=client(),b=client(),email=`test-${randomUUID()}@example.test`,password='Only-emulator-'+randomUUID();
 try{
  await assert.rejects(a.saveAccountNote('musica-perceber','Pergunta','Resposta'),e=>e.code==='unauthorized');
  assert.equal((await a.loginAccount(email,password,true)).signedIn,true);
  const first=accounts[0];
  await a.saveAccountNote('musica-perceber','Que som percebeu?','Uma pausa e um ritmo.');
  const notes=(await a.listAccountNotes()).notes;assert.equal(notes.length,1);assert.equal(notes[0].answer,'Uma pausa e um ritmo.');
  await a.logoutAccount();await assert.rejects(a.listAccountNotes(),e=>e.code==='unauthorized');
  await assert.rejects(a.loginAccount(email,'incorrect-password'),e=>e.code==='login_failed');
  await a.loginAccount(email,password);assert.equal((await a.listAccountNotes()).notes[0].question,'Que som percebeu?');
  await a.resetPassword(email);
  const id=randomUUID();await a.submit({lesson:'musica-perceber',kind:'anotacao',body:'Contribuição de teste.',submissionId:id});
  assert.equal((await a.listMyContributions()).entries[0].status,'pending');
  await b.loginAccount(`other-${randomUUID()}@example.test`,password,true);const second=accounts.at(-1);
  assert.equal((await b.listAccountNotes()).notes.length,0);assert.equal((await b.listMyContributions()).entries.length,0);
  await assert.rejects(store.getDoc(store.doc(store.getFirestore(second.app),`users/${first.currentUser.uid}/notebook/musica-perceber`)),e=>e.code==='permission-denied');
 }finally{for(const a of accounts)if(a.currentUser)await auth.deleteUser(a.currentUser);for(const app of created)await apps.deleteApp(app);await env.cleanup();}
});
