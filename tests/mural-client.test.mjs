import test from 'node:test';
import assert from 'node:assert/strict';
import { createMuralClient, validateSubmission } from '../mural.js';

const config = { apiKey: 'public-test-key', authDomain: 'test.firebaseapp.com', projectId: 'test', appId: 'test-app' };
const id = '12345678-1234-4234-8234-123456789abc';
const input = { lesson: 'visuais-perceber', kind: 'contribuicao', body: '  Minha descoberta.  ', submissionId: id };
const timestamp = ms => ({ toMillis: () => ms, toDate: () => new Date(ms) });

function fixture(signedIn = true) {
  const records = new Map(), apps = [], auths = new Map(), calls = [];
  let loaderCalls = 0, anonymousCalls = 0, popupCalls = 0;
  const snap = (ref, data = records.get(`${ref.collection}/${ref.id}`)) => ({ id: ref.id, exists: () => data !== undefined, data: () => data });
  const sdk = {
    browserSessionPersistence: 'session', inMemoryPersistence: 'memory', browserPopupRedirectResolver: 'popup',
    getApps: () => apps,
    initializeApp(options, name) { const app = { options, name }; apps.push(app); return app; },
    getFirestore: app => ({ app }),
    initializeAuth(app, options) { const auth = { currentUser: signedIn && app.name === 'art-visitor' ? {uid:'visitor-uid',email:'learner@example.test',isAnonymous:false,providerData:[{providerId:'password'}]} : null, authStateReady: async () => {}, options }; auths.set(app.name, auth); return auth; },
    async createUserWithEmailAndPassword(auth,email,password) { calls.push(['signup',email]); auth.currentUser={uid:'new-uid',email,isAnonymous:false,providerData:[{providerId:'password'}]}; },
    async signInWithEmailAndPassword(auth,email,password) { if(password==='wrong')throw Object.assign(new Error('bad credentials'),{code:'auth/invalid-credential'}); calls.push(['login',email]); auth.currentUser={uid:'visitor-uid',email,isAnonymous:false,providerData:[{providerId:'password'}]}; },
    async sendPasswordResetEmail(auth,email) { calls.push(['reset',email]); },
    async signInAnonymously(auth) { anonymousCalls++; auth.currentUser = { uid: 'visitor-uid', isAnonymous: true }; },
    async signInWithPopup(auth) { popupCalls++; auth.currentUser = { uid: 'moderator-uid', isAnonymous: false }; },
    async signOut(auth) { auth.currentUser = null; },
    GoogleAuthProvider: class { setCustomParameters(options) { calls.push(['provider', options]); } },
    doc: (db, collection, id) => ({ db, collection, id }),
    collection: (db, collection) => ({ db, collection }),
    where: (...args) => ({ where: args }), orderBy: (...args) => ({ orderBy: args }), limit: limit => ({ limit }),
    query: (collection, ...parts) => ({ ...collection, parts }),
    async getDocFromServer(ref) { calls.push(['get', ref.collection, ref.id]); return snap(ref); },
    async getDocsFromServer(query) {
      calls.push(['query', query]);
      return { docs: [...records].filter(([key, value]) => key.startsWith(`${query.collection}/`) && query.parts.every(part => !part.where || value[part.where[0]] === part.where[2])).map(([key, value]) => snap({ id: key.split('/')[1] }, value)) };
    },
    serverTimestamp: () => timestamp(Date.now()),
    async runTransaction(db, callback) {
      const writes = [];
      const result = await callback({
        get: async ref => { calls.push(['tx-get', ref.collection, ref.id]); return snap(ref); },
        set: (ref, data) => writes.push(['set', ref, data]), delete: ref => writes.push(['delete', ref]),
      });
      for (const [operation, ref, data] of writes) {
        const key = `${ref.collection}/${ref.id}`;
        if (operation === 'set') records.set(key, data); else records.delete(key);
        calls.push([operation, ref.collection, ref.id, data]);
      }
      return result;
    },
  };
  const client = createMuralClient({ configGetter: () => config, sdkLoader: async () => { loaderCalls++; return sdk; } });
  return { client, sdk, records, apps, auths, calls, stats: () => ({ loaderCalls, anonymousCalls, popupCalls }) };
}

test('import/client creation/configured performs no network or SDK load', () => {
  const f = fixture(); assert.equal(f.client.configured(), true); assert.equal(f.stats().loaderCalls, 0);
  assert.equal(createMuralClient({ configGetter: () => null }).configured(), false);
});

test('validation covers exact lessons, categories, size and UUID before any SDK load', () => {
  assert.equal(validateSubmission(input).body, 'Minha descoberta.');
  for (const alteration of [{ lesson: 'other-perceber' }, { kind: 'approved' }, { body: ' ' }, { body: '😀'.repeat(1201) }, { submissionId: '../bad' }, { status: 'approved' }]) {
    assert.throws(() => validateSubmission({ ...input, ...alteration }), error => error.code === 'invalid_input');
  }
  assert.equal([...validateSubmission({ ...input, body: '😀'.repeat(1200) }).body].length, 1200);
});

test('public read initializes no Auth and uses only published lesson query with bound', async () => {
  const f = fixture();
  f.records.set(`published/${id}`, { lesson: input.lesson, kind: 'elogio', body: 'Público', createdAt: timestamp(0), approvedAt: timestamp(1), authorUid: 'secret' });
  const result = await f.client.listPublic(input.lesson);
  assert.equal(result.entries.length, 1); assert.equal(result.entries[0].authorUid, undefined);
  assert.equal(f.auths.size, 0); assert.equal(f.apps[0].name, 'art-public');
  const query = f.calls.find(call => call[0] === 'query')[1];
  assert.equal(query.collection, 'published'); assert.deepEqual(query.parts.at(-1), { limit: 30 });
});

test('submit creates pending, receipt and rate limit in one transaction with password account', async () => {
  const f = fixture(); const result = await f.client.submit(input);
  assert.deepEqual(result, { id, status: 'pending' });
  assert.equal(f.records.get(`pending/${id}`).authorUid, 'visitor-uid');
  assert.equal(f.records.get(`pending/${id}`).body, 'Minha descoberta.');
  assert.equal(f.records.get(`receipts/${id}`).authorUid, 'visitor-uid');
  assert.equal(f.records.get('limits/visitor-uid').entryId, id);
  assert.equal(f.auths.get('art-visitor').options.persistence, 'session');
  assert.equal(f.stats().anonymousCalls, 0); assert.equal(f.records.has(`published/${id}`), false);
});

test('same receipt retries without writes and cannot resurrect deleted pending content', async () => {
  const f = fixture(); await f.client.submit(input); f.records.delete(`pending/${id}`);
  const before = f.calls.filter(call => ['set', 'delete'].includes(call[0])).length;
  assert.deepEqual(await f.client.submit(input), { id, status: 'pending' });
  assert.equal(f.records.has(`pending/${id}`), false);
  assert.equal(f.calls.filter(call => ['set', 'delete'].includes(call[0])).length, before);
});

test('one minute cooldown does not acknowledge or write a new submission', async () => {
  const f = fixture(); await f.client.submit(input);
  const second = '22345678-1234-4234-8234-123456789abc';
  await assert.rejects(f.client.submit({ ...input, submissionId: second }), error => error.code === 'rate_limited');
  assert.equal(f.records.has(`pending/${second}`), false);
});

test('moderator login is separate, in-memory and allowlisted; unauthorized account signs out', async () => {
  const f = fixture();
  await assert.rejects(f.client.loginModerator(), error => error.code === 'forbidden');
  assert.equal(f.auths.get('art-moderator').currentUser, null);
  f.records.set('moderators/moderator-uid', { enabled: true });
  assert.deepEqual(await f.client.loginModerator(), { authorized: true });
  assert.equal(f.auths.get('art-moderator').options.persistence, 'memory');
  assert.equal(f.stats().anonymousCalls, 0);
  await f.client.logoutModerator(); assert.equal(f.auths.get('art-moderator').currentUser, null);
});

test('approval publishes whitelisted fields atomically and removes private pending record', async () => {
  const f = fixture(); f.records.set('moderators/moderator-uid', { enabled: true }); await f.client.loginModerator();
  f.records.set(`pending/${id}`, { lesson: input.lesson, kind: input.kind, body: 'Aprovado', createdAt: timestamp(1), authorUid: 'private-uid', untrustedField: 'not copied' });
  assert.equal((await f.client.moderate(id, 'approve')).status, 'approved');
  assert.equal(f.records.has(`pending/${id}`), false);
  assert.equal(f.records.get(`published/${id}`).body, 'Aprovado');
  assert.deepEqual(Object.keys(f.records.get(`published/${id}`)).sort(), ['approvedAt', 'body', 'createdAt', 'kind', 'lesson']);
});

test('rejection/removal deletes target text while preserving receipt', async () => {
  const f = fixture(); f.records.set('moderators/moderator-uid', { enabled: true }); await f.client.loginModerator();
  f.records.set(`pending/${id}`, { body: 'Rejeitar' }); f.records.set(`receipts/${id}`, { authorUid: 'visitor-uid' });
  await f.client.moderate(id, 'reject'); assert.equal(f.records.has(`pending/${id}`), false); assert.equal(f.records.has(`receipts/${id}`), true);
  f.records.set(`published/${id}`, { body: 'Retirar' });
  await f.client.moderate(id, 'remove'); assert.equal(f.records.has(`published/${id}`), false); assert.equal(f.records.has(`receipts/${id}`), true);
});

test('moderation requires current session and validates filter', async () => {
  const f = fixture();
  await assert.rejects(f.client.listModeration(), error => error.code === 'unauthorized');
  await assert.rejects(f.client.moderate(id, 'remove'), error => error.code === 'unauthorized');
  await assert.rejects(f.client.listModeration('all'), error => error.code === 'invalid_input');
});

test('moderation list uses correct private/public collections and bounded ordered server queries', async () => {
  const f = fixture(); f.records.set('moderators/moderator-uid', { enabled: true }); await f.client.loginModerator();
  await f.client.listModeration('pending'); await f.client.listModeration('approved');
  const queries = f.calls.filter(call => call[0] === 'query').map(call => call[1]);
  assert.equal(queries[0].collection, 'pending'); assert.equal(queries[1].collection, 'published');
  assert.deepEqual(queries[0].parts, [{ orderBy: ['createdAt', 'asc'] }, { limit: 100 }]);
  assert.deepEqual(queries[1].parts, [{ orderBy: ['approvedAt', 'desc'] }, { limit: 100 }]);
});

test('commenting requires a password account; no anonymous fallback',async()=>{
 const f=fixture(false);await assert.rejects(f.client.submit(input),e=>e.code==='unauthorized');assert.equal(f.stats().anonymousCalls,0);assert.equal(f.records.size,0);
 const auth=f.auths.get('art-visitor');auth.currentUser={uid:'old-anon',isAnonymous:true};await assert.rejects(f.client.submit(input),e=>e.code==='unauthorized');
 auth.currentUser={uid:'google-only',isAnonymous:false,providerData:[{providerId:'google.com'}]};await assert.rejects(f.client.submit(input),e=>e.code==='unauthorized');
});
test('signup, login, reset and logout use Auth only and keep passwords out of records',async()=>{
 const f=fixture(false);assert.equal((await f.client.accountStatus()).signedIn,false);
 await assert.rejects(f.client.loginAccount('bad','long-password',true),e=>e.code==='invalid_input');
 await assert.rejects(f.client.loginAccount('learner@example.test','short',true),e=>e.code==='invalid_input');
 assert.deepEqual(await f.client.loginAccount(' learner@example.test ','test-password',true),{signedIn:true,email:'learner@example.test'});
 assert.equal(f.records.size,0);await f.client.logoutAccount();assert.equal((await f.client.accountStatus()).signedIn,false);
 await assert.rejects(f.client.loginAccount('learner@example.test','wrong'),e=>e.code==='login_failed');
 await f.client.loginAccount('learner@example.test','test-password');await f.client.resetPassword('learner@example.test');assert.ok(f.calls.some(c=>c[0]==='reset'));assert.equal(f.records.size,0);
 assert.equal(JSON.stringify(f.calls).includes('test-password'),false);
});
