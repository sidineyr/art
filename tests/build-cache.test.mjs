import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const read=name=>readFile(new URL('dist/'+name,root),'utf8');
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,16);
test('published entry, stylesheet and nested presentation imports use their actual content versions',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fileURLToPath(root)});
 const [html,app,experience,intro,css]=await Promise.all(['index.html','app.js','experience.js','introductions.js','styles.css'].map(read));
 assert.ok(html.includes(`app.js?v=${hash(app)}`));
 assert.ok(html.includes(`styles.css?v=${hash(css)}`));
 assert.ok(app.includes(`import('./experience.js?v=${hash(experience)}')`));
 assert.ok(experience.includes(`from './introductions.js?v=${hash(intro)}'`));
 assert.doesNotMatch(intro,/Uma apresentação de 20 segundos com o personagem|Sem som automático\./);
 assert.match(intro,/atelier-stage/);
});
