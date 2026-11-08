import { mkdir, copyFile, cp, access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const files=['materiais.html','index.html','styles.css','app.js','studio.js','experience.js','introductions.js','live-tutor.js','live-tutor-settings.json','mural.js','config.js','counter.js','curriculum.json','resources.json','.nojekyll'];
for(const file of files)await access(path.join(root,file));
await mkdir(out,{recursive:true});
for(const file of files)await copyFile(path.join(root,file),path.join(out,file));
await cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
// Version the entire introduction import chain, not just the entry script.
// A fresh app must never reuse an older presentation from the browser cache.
const digest=text=>createHash('sha256').update(text).digest('hex').slice(0,16);
const introduction=await readFile(path.join(out,'introductions.js'),'utf8');
let experience=await readFile(path.join(out,'experience.js'),'utf8');
experience=experience.replace("from './introductions.js'",`from './introductions.js?v=${digest(introduction)}'`);
await writeFile(path.join(out,'experience.js'),experience);
let app=await readFile(path.join(out,'app.js'),'utf8');
const liveTutor=await readFile(path.join(out,'live-tutor.js'),'utf8');
const liveSettings=await readFile(path.join(out,'live-tutor-settings.json'),'utf8');
app=app.replace("import('./live-tutor.js')",`import('./live-tutor.js?v=${digest(liveTutor)}')`)
 .replace("'live-tutor-settings.json'",`'live-tutor-settings.json?v=${digest(liveSettings)}'`);
app=app.replace("import('./experience.js')",`import('./experience.js?v=${digest(experience)}')`);
await writeFile(path.join(out,'app.js'),app);
const css=await readFile(path.join(out,'styles.css'),'utf8');
let html=await readFile(path.join(out,'index.html'),'utf8');
html=html.replace(/styles\.css(?:\?[^"']*)?/,`styles.css?v=${digest(css)}`)
 .replace(/app\.js(?:\?[^"']*)?/,`app.js?v=${digest(app)}`);
await writeFile(path.join(out,'index.html'),html);
console.log('Site estático preparado em dist/. Nenhum arquivo SQL, teste, segredo ou metadado Git foi incluído.');
