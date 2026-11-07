// Firebase modular SDK: https://firebase.google.com/docs/web/alt-setup
// No CDN request, auth session or database connection occurs at module import.
const SDK_VERSION = '13.2.0';
const THEMES = ['visuais', 'musica', 'danca', 'teatro', 'integradas'];
const STAGES = ['perceber', 'conhecer', 'experimentar', 'criar', 'conectar', 'compartilhar'];
const LESSONS = new Set(THEMES.flatMap(theme => STAGES.map(stage => `${theme}-${stage}`)));
const KINDS = ['anotacao', 'contribuicao', 'critica', 'elogio'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failure(message, code) { const error = new Error(message); error.code = code; return error; }
function lesson(value) {
  if (!LESSONS.has(value)) throw failure('Encontro inválido.', 'invalid_input');
  return value;
}
function identifier(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw failure('Identificador inválido.', 'invalid_input');
  return value.toLowerCase();
}

export function validateSubmission(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !['lesson', 'kind', 'body', 'submissionId'].includes(key))) {
    throw failure('Dados inválidos.', 'invalid_input');
  }
  lesson(value.lesson);
  if (!KINDS.includes(value.kind)) throw failure('Categoria inválida.', 'invalid_input');
  if (typeof value.body !== 'string') throw failure('Escreva sua contribuição.', 'invalid_input');
  const body = value.body.trim();
  if (!body || [...body].length > 1200) throw failure('Use de 1 a 1.200 caracteres.', 'invalid_input');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body)) throw failure('Texto contém caracteres inválidos.', 'invalid_input');
  return { lesson: value.lesson, kind: value.kind, body, submissionId: identifier(value.submissionId) };
}

let sdkPromise;
function loadSDK() {
  if (!sdkPromise) sdkPromise = Promise.all([
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`),
  ]).then(([app, auth, firestore]) => ({ ...app, ...auth, ...firestore })).catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}

const dateValue = value => {
  try { return typeof value?.toDate === 'function' ? value.toDate().toISOString() : null; }
  catch { return null; }
};
const serialize = snapshot => {
  const data = snapshot.data();
  // Deliberately do not return authorUid, account details or private receipt data.
  return { id: snapshot.id, lesson: data.lesson, kind: data.kind, body: data.body,
    createdAt: dateValue(data.createdAt), approvedAt: dateValue(data.approvedAt) };
};

function friendly(error) {
  if (['invalid_input', 'not_configured', 'rate_limited', 'unauthorized', 'forbidden', 'not_found'].includes(error?.code)) return error;
  const code = String(error?.code || '');
  if (['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/user-disabled'].includes(code)) return failure('Não foi possível entrar. Confira o e-mail e a senha ou recupere seu acesso.', 'login_failed');
  if (code === 'auth/email-already-in-use') return failure('Não foi possível criar a conta. Tente entrar ou recuperar o acesso.', 'signup_failed');
  if (['auth/weak-password','auth/password-does-not-meet-requirements'].includes(code)) return failure('Escolha uma senha mais forte, com pelo menos 8 caracteres.', 'weak_password');
  if (code === 'auth/invalid-email') return failure('Informe um e-mail válido.', 'invalid_input');
  if (code === 'failed-precondition') return failure('A consulta do mural está sendo preparada. Tente novamente em alguns minutos.', 'index_preparing');
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return failure('Entrada cancelada. Você pode tentar novamente.', 'login_cancelled');
  if (code === 'auth/popup-blocked') return failure('Permita a janela de login para entrar na moderação.', 'popup_blocked');
  if (code === 'auth/unauthorized-domain') return failure('Este endereço ainda não foi autorizado para o login. Procure o responsável.', 'unauthorized_domain');
  if (code === 'permission-denied' || code === 'firestore/permission-denied') return failure('A operação não foi autorizada. Confira sua sessão ou aguarde um minuto antes de reenviar.', 'permission_denied');
  if (code === 'resource-exhausted' || code === 'firestore/resource-exhausted' || code === 'auth/too-many-requests') return failure('O limite temporário do serviço foi atingido. Tente mais tarde.', 'quota_exceeded');
  return failure('Mural temporariamente indisponível. Seu texto não deve ser considerado enviado sem confirmação.', 'service_unavailable');
}

export function createMuralClient({ configGetter = () => globalThis.window?.ART_CONFIG?.firebase, sdkLoader = loadSDK } = {}) {
  const contexts = new Map();


  function configured() {
    const config = configGetter();
    return !!config && ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => typeof config[key] === 'string' && config[key].trim().length > 0);
  }

  async function context(role) {
    if (!configured()) throw failure('O mural ainda não foi configurado.', 'not_configured');
    if (!contexts.has(role)) {
      const promise = (async () => {
        const sdk = await sdkLoader();
        const config = configGetter();
        const name = `art-${role}`;
        const app = sdk.getApps().find(item => item.name === name) || sdk.initializeApp(config, name);
        const db = sdk.getFirestore(app);
        let auth;
        if (role !== 'public') {
          const options = role === 'visitor'
            ? { persistence: sdk.browserSessionPersistence }
            : { persistence: sdk.inMemoryPersistence, popupRedirectResolver: sdk.browserPopupRedirectResolver };
          auth = sdk.initializeAuth(app, options);
          await auth.authStateReady();
        }
        return { sdk, app, db, auth };
      })();
      contexts.set(role, promise);
      promise.catch(() => contexts.delete(role));
    }
    return contexts.get(role);
  }

  function accountUser(auth) {
    const user = auth.currentUser;
    return user && !user.isAnonymous && user.providerData?.some(p => p.providerId === 'password') ? user : null;
  }
  async function visitor() {
    const ctx = await context('visitor');
    if (!accountUser(ctx.auth)) throw failure('Entre ou crie sua conta para comentar.', 'unauthorized');
    return ctx;
  }
  async function accountStatus() {
    try { const {auth} = await context('visitor'); const user = accountUser(auth); return {signedIn:!!user, email:user?.email || null}; }
    catch(error) { throw friendly(error); }
  }
  function emailAddress(value) {
    const email = typeof value === 'string' ? value.trim() : '';
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw failure('Informe um e-mail válido.', 'invalid_input');
    return email;
  }
  async function loginAccount(email, password, create = false) {
    try {
      email = emailAddress(email);
      if (typeof password !== 'string' || !password || (create && password.length < 8)) throw failure('Ao cadastrar, use uma senha de pelo menos 8 caracteres.', 'invalid_input');
      const {sdk,auth} = await context('visitor');
      if (create) await sdk.createUserWithEmailAndPassword(auth,email,password);
      else await sdk.signInWithEmailAndPassword(auth,email,password);
      return accountStatus();
    } catch(error) { throw friendly(error); }
  }
  async function logoutAccount() {
    try { const {sdk,auth} = await context('visitor'); await sdk.signOut(auth); }
    catch(error) { throw friendly(error); }
  }
  async function resetPassword(email) {
    try { email = emailAddress(email); const {sdk,auth} = await context('visitor'); await sdk.sendPasswordResetEmail(auth,email); }
    catch(error) { if(error?.code === 'auth/user-not-found') return; throw friendly(error); }
  }

  async function saveAccountNote(key,question,answer) {
    try {
      lesson(key);
      if(typeof question!=='string'||question.length>1000||typeof answer!=='string'||answer.length>5000)throw failure('Anotação inválida ou muito longa.', 'invalid_input');
      const {sdk,db,auth}=await visitor();
      await sdk.setDoc(sdk.doc(db,`users/${auth.currentUser.uid}/notebook`,key),{question,answer,updatedAt:sdk.serverTimestamp()});
      return {saved:true};
    }catch(error){throw friendly(error);}
  }
  async function listAccountNotes() {
    try {
      const {sdk,db,auth}=await visitor();
      const result=await sdk.getDocsFromServer(sdk.query(sdk.collection(db,`users/${auth.currentUser.uid}/notebook`),sdk.limit(30)));
      return {notes:result.docs.map(d=>({lesson:d.id,question:d.data().question,answer:d.data().answer,updatedAt:dateValue(d.data().updatedAt)}))};
    }catch(error){throw friendly(error);}
  }

  async function listMyContributions() {
    try {
      const {sdk,db,auth}=await visitor(),uid=auth.currentUser.uid;
      const ownQuery=name=>sdk.query(sdk.collection(db,name),sdk.where('authorUid','==',uid),sdk.orderBy('createdAt','desc'),sdk.limit(20));
      const [receipts,pending]=await Promise.all([sdk.getDocsFromServer(ownQuery('receipts')),sdk.getDocsFromServer(ownQuery('pending'))]);
      const waiting=new Map(pending.docs.map(d=>[d.id,serialize(d)]));
      const entries=await Promise.all(receipts.docs.map(async receipt=>{
        if(waiting.has(receipt.id))return {...waiting.get(receipt.id),status:'pending'};
        const published=await sdk.getDocFromServer(sdk.doc(db,'published',receipt.id));
        return published.exists()?{...serialize(published),status:'approved'}:{id:receipt.id,createdAt:dateValue(receipt.data().createdAt),status:'processed'};
      }));
      return {entries};
    }catch(error){throw friendly(error);}
  }

  async function moderator() {
    const ctx = await context('moderator');
    const user = ctx.auth.currentUser;
    if (!user) throw failure('Entre com sua conta de moderação.', 'unauthorized');
    const membership = await ctx.sdk.getDocFromServer(ctx.sdk.doc(ctx.db, 'moderators', user.uid));
    if (!membership.exists() || membership.data().enabled !== true) throw failure('Esta conta não foi autorizada a moderar o art.', 'forbidden');
    return ctx;
  }

  async function listPublic(value) {
    try {
      const key = lesson(value);
      const { sdk, db } = await context('public');
      const query = sdk.query(sdk.collection(db, 'published'), sdk.where('lesson', '==', key), sdk.orderBy('approvedAt', 'desc'), sdk.limit(30));
      const result = await sdk.getDocsFromServer(query);
      return { entries: result.docs.map(serialize) };
    } catch (error) { throw friendly(error); }
  }

  async function submit(value) {
    try {
      const data = validateSubmission(value);
      const { sdk, db, auth } = await visitor();
      const uid = auth.currentUser.uid;
      await sdk.runTransaction(db, async transaction => {
        const receiptRef = sdk.doc(db, 'receipts', data.submissionId);
        const receipt = await transaction.get(receiptRef);
        if (receipt.exists()) {
          if (receipt.data().authorUid !== uid) throw failure('Identificador de envio indisponível.', 'invalid_input');
          return; // Idempotent retry does not resurrect rejected/removed text.
        }
        const limitRef = sdk.doc(db, 'limits', uid);
        const previous = await transaction.get(limitRef);
        const sentAt = previous.exists() ? previous.data().lastSentAt?.toMillis?.() : null;
        if (typeof sentAt === 'number' && Date.now() - sentAt < 60000) throw failure('Aguarde um minuto entre contribuições.', 'rate_limited');
        const timestamp = sdk.serverTimestamp();
        transaction.set(sdk.doc(db, 'pending', data.submissionId), {
          lesson: data.lesson, kind: data.kind, body: data.body, createdAt: timestamp, authorUid: uid,
        });
        transaction.set(receiptRef, { authorUid: uid, createdAt: timestamp });
        transaction.set(limitRef, { lastSentAt: timestamp, entryId: data.submissionId });
      });
      return { id: data.submissionId, status: 'pending' };
    } catch (error) { throw friendly(error); }
  }

  async function loginModerator() {
    try {
      const { sdk, auth } = await context('moderator');
      const provider = new sdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await sdk.signInWithPopup(auth, provider);
      try { await moderator(); }
      catch (error) { await sdk.signOut(auth); throw error; }
      return { authorized: true };
    } catch (error) { throw friendly(error); }
  }

  async function logoutModerator() {
    try {
      if (!contexts.has('moderator')) return;
      const { sdk, auth } = await contexts.get('moderator');
      await sdk.signOut(auth);
    } catch (error) { throw friendly(error); }
  }

  async function listModeration(mode = 'pending') {
    try {
      if (!['pending', 'approved'].includes(mode)) throw failure('Filtro inválido.', 'invalid_input');
      const { sdk, db } = await moderator();
      const approved = mode === 'approved';
      const query = sdk.query(sdk.collection(db, approved ? 'published' : 'pending'), sdk.orderBy(approved ? 'approvedAt' : 'createdAt', approved ? 'desc' : 'asc'), sdk.limit(100));
      const result = await sdk.getDocsFromServer(query);
      return { entries: result.docs.map(serialize) };
    } catch (error) { throw friendly(error); }
  }

  async function moderate(value, action) {
    try {
      const id = identifier(value);
      if (!['approve', 'reject', 'remove'].includes(action)) throw failure('Ação inválida.', 'invalid_input');
      const { sdk, db } = await moderator();
      await sdk.runTransaction(db, async transaction => {
        const sourceRef = sdk.doc(db, action === 'remove' ? 'published' : 'pending', id);
        const source = await transaction.get(sourceRef);
        if (!source.exists()) throw failure('Mensagem já processada. Atualize a lista.', 'not_found');
        if (action === 'approve') {
          const data = source.data();
          transaction.set(sdk.doc(db, 'published', id), {
            lesson: data.lesson, kind: data.kind, body: data.body, createdAt: data.createdAt, approvedAt: sdk.serverTimestamp(),
          });
        }
        transaction.delete(sourceRef);
      });
      return { id, action, status: action === 'approve' ? 'approved' : 'deleted' };
    } catch (error) { throw friendly(error); }
  }

  return { configured, accountStatus, loginAccount, logoutAccount, resetPassword, saveAccountNote, listAccountNotes, listMyContributions, listPublic, submit, loginModerator, logoutModerator, signOut: logoutModerator, listModeration, moderate };
}

const mural = createMuralClient();
export const configured = mural.configured;
export const listPublic = mural.listPublic;
export const submit = mural.submit;
export const loginModerator = mural.loginModerator;
export const logoutModerator = mural.logoutModerator;
export const signOut = mural.signOut;
export const listModeration = mural.listModeration;
export const moderate = mural.moderate;

export const accountStatus = mural.accountStatus;
export const loginAccount = mural.loginAccount;
export const logoutAccount = mural.logoutAccount;
export const resetPassword = mural.resetPassword;

export const saveAccountNote = mural.saveAccountNote;
export const listAccountNotes = mural.listAccountNotes;

export const listMyContributions = mural.listMyContributions;
