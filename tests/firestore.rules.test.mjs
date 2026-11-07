import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,orderBy,limit,writeBatch,serverTimestamp,Timestamp,deleteDoc,updateDoc,setLogLevel} from 'firebase/firestore';
setLogLevel('silent');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-art',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'moderators','moderator'),{enabled:true}));});
after(async()=>{await env?.cleanup();});
const db=uid=>uid?env.authenticatedContext(uid,{firebase:{sign_in_provider:'password'},email:'private@example.test'}).firestore():env.unauthenticatedContext().firestore();
const body=uid=>({lesson:'visuais-perceber',kind:'contribuicao',body:'Uma descoberta de teste.',createdAt:serverTimestamp(),authorUid:uid});
function submit(uid,id=randomUUID(),overrides={},paired=true){const store=db(uid),batch=writeBatch(store);batch.set(doc(store,'pending',id),{...body(uid),...overrides});if(paired){batch.set(doc(store,'receipts',id),{authorUid:uid,createdAt:serverTimestamp()});batch.set(doc(store,'limits',uid),{lastSentAt:serverTimestamp(),entryId:id});}return {id,promise:batch.commit()};}
const seed=(path,data)=>env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),...path.split('/')),data));
test('public cannot read private content or list moderator roles',async()=>{
 const id=randomUUID();await seed(`pending/${id}`,{...body('other'),createdAt:Timestamp.now()});
 await assertFails(getDoc(doc(db(),'pending',id)));await assertFails(getDocs(query(collection(db(),'pending'),limit(100))));
 await assertFails(getDocs(query(collection(db('viewer'),'moderators'),limit(100))));await assertFails(getDoc(doc(db(),'limits','other')));
});
test('ordinary accounts cannot grant a moderator role or publish directly',async()=>{
 await assertFails(setDoc(doc(db('intruder'),'moderators','intruder'),{enabled:true}));
 await assertFails(setDoc(doc(db('intruder'),'published',randomUUID()),{lesson:'visuais-perceber',kind:'elogio',body:'Burlar fila',createdAt:serverTimestamp(),approvedAt:serverTimestamp()}));
});
test('submission requires authentication and three paired documents',async()=>{
 await assertFails(setDoc(doc(db(),'pending',randomUUID()),body('x')));await assertFails(submit('unpaired',randomUUID(),{},false).promise);await assertSucceeds(submit('valid-visitor').promise);
});
test('strict schema blocks spoofed ownership, unknown lessons, extra fields, huge bodies, wrong types and fake timestamps',async()=>{
 for(const [uid,data] of [['spoof',{authorUid:'victim'}],['bad-lesson',{lesson:'invalid-encontro'}],['extra',{approved:true}],['huge',{body:'x'.repeat(1201)}],['type',{body:123}],['fake-time',{createdAt:Timestamp.fromMillis(0)}]])await assertFails(submit(uid,randomUUID(),data).promise);
});
test('submitted text and ownership cannot be edited, private data cannot be read by others',async()=>{
 const s=submit('immutable');await assertSucceeds(s.promise);const store=db('immutable');
 await assertFails(updateDoc(doc(store,'pending',s.id),{body:'x'.repeat(100000)}));await assertFails(updateDoc(doc(store,'pending',s.id),{authorUid:'new-owner'}));
 await assertFails(deleteDoc(doc(store,'pending',s.id)));await assertFails(deleteDoc(doc(store,'receipts',s.id)));await assertFails(getDoc(doc(db('other-reader'),'pending',s.id)));await assertSucceeds(getDoc(doc(store,'receipts',s.id)));
});
test('cooldown cannot be skipped or replayed, but permits a later new submission',async()=>{
 const first=submit('cooldown');await assertSucceeds(first.promise);await assertFails(submit('cooldown').promise);
 await seed('limits/cooldown',{lastSentAt:Timestamp.fromMillis(Date.now()-65000),entryId:first.id});await assertSucceeds(submit('cooldown').promise);
 await assertFails(setDoc(doc(db('counter'),'limits','counter'),{lastSentAt:serverTimestamp(),entryId:randomUUID()}));
});
test('receipt prevents resubmitting a rejected contribution',async()=>{
 const s=submit('replay');await assertSucceeds(s.promise);await assertSucceeds(deleteDoc(doc(db('moderator'),'pending',s.id)));await seed('limits/replay',{lastSentAt:Timestamp.fromMillis(Date.now()-65000),entryId:s.id});await assertFails(submit('replay',s.id).promise);
});
test('approval requires an exact copy, omits identity and allows only moderator removal',async()=>{
 const s=submit('approved-author');await assertSucceeds(s.promise);const store=db('moderator'),p=(await getDoc(doc(store,'pending',s.id))).data();
 await assertFails(setDoc(doc(store,'published',s.id),{lesson:p.lesson,kind:p.kind,body:'Texto alterado',createdAt:p.createdAt,approvedAt:serverTimestamp()}));await assertFails(setDoc(doc(store,'published',s.id),{...p,approvedAt:serverTimestamp()}));
 const b=writeBatch(store);b.set(doc(store,'published',s.id),{lesson:p.lesson,kind:p.kind,body:p.body,createdAt:p.createdAt,approvedAt:serverTimestamp()});b.delete(doc(store,'pending',s.id));await assertSucceeds(b.commit());
 const pub=await assertSucceeds(getDoc(doc(db(),'published',s.id)));assert.equal(pub.data().authorUid,undefined);await assertFails(getDoc(doc(db(),'pending',s.id)));await assertFails(deleteDoc(doc(db('approved-author'),'published',s.id)));await assertSucceeds(deleteDoc(doc(store,'published',s.id)));
});
test('application queries are allowed with bounds; unbounded reads and wrong-role queries fail',async()=>{
 await assertSucceeds(getDocs(query(collection(db(),'published'),where('lesson','==','visuais-perceber'),orderBy('approvedAt','desc'),limit(30))));await assertFails(getDocs(collection(db(),'published')));
 await assertSucceeds(getDocs(query(collection(db('moderator'),'pending'),orderBy('createdAt','asc'),limit(100))));await assertFails(getDocs(query(collection(db('ordinary'),'pending'),orderBy('createdAt','asc'),limit(100))));await assertFails(getDocs(query(collection(db('moderator'),'pending'),limit(101))));
});

test('legacy anonymous and Google-only accounts cannot bypass registration to comment',async()=>{
 for(const provider of ['anonymous','google.com']){
  const store=env.authenticatedContext('blocked-'+provider,{firebase:{sign_in_provider:provider}}).firestore(),id=randomUUID(),batch=writeBatch(store),uid='blocked-'+provider;
  batch.set(doc(store,'pending',id),body(uid));batch.set(doc(store,'receipts',id),{authorUid:uid,createdAt:serverTimestamp()});batch.set(doc(store,'limits',uid),{lastSentAt:serverTimestamp(),entryId:id});await assertFails(batch.commit());
 }
});

test('notebook is private to its owner and validates writes',async()=>{
 const own=db('notebook-owner'),other=db('notebook-other'),path=['users','notebook-owner','notebook','musica-perceber'],note={question:'Que som percebeu?',answer:'Um ritmo.',updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(own,...path),note));await assertSucceeds(getDoc(doc(own,...path)));
 for(const store of [other,db(),db('moderator')])await assertFails(getDoc(doc(store,...path)));
 await assertFails(setDoc(doc(other,...path),note));await assertFails(updateDoc(doc(own,...path),{email:'forbidden'}));await assertFails(updateDoc(doc(own,...path),{answer:'x'.repeat(5001),updatedAt:serverTimestamp()}));
 await assertFails(setDoc(doc(own,'users','notebook-owner','notebook','invalid-lesson'),note));
 await assertSucceeds(getDocs(query(collection(own,'users','notebook-owner','notebook'),limit(30))));await assertFails(getDocs(collection(own,'users','notebook-owner','notebook')));
 await assertSucceeds(setDoc(doc(own,...path),{...note,answer:'Atualizada.'}));await assertSucceeds(deleteDoc(doc(own,...path)));
});
