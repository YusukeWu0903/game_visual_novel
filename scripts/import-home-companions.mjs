import {cp,readFile,writeFile,mkdir,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'web-visual-novel/public/companions');
const portfolio='D:/Project/my-portfolio/public';
const pipeline='D:/Project/auto_layering_pipeline';
const exists=p=>stat(p).then(()=>true,()=>false);
await mkdir(out,{recursive:true});
if(await exists(path.join(out,'sources.json')))throw Error('Companion snapshot exists; review changes before reimport.');
for(const id of ['eris','miffy','mimi']) {
  await cp(path.join(portfolio,id+'-demo'),path.join(out,id),{recursive:true});
  const htmlPath=path.join(out,id,'index.html');
  let html=await readFile(htmlPath,'utf8');
  html=html.replaceAll('/eris-demo/','/companions/eris/');
  html=html.replace('<style>','<script src="/companions/embed-viewer.js"></script><style>');
  await writeFile(htmlPath,html);
  if(id==='eris'){
    const file=path.join(out,id,'viewer-assets/deform-preview.mjs');
    await writeFile(file,(await readFile(file,'utf8')).replaceAll('/eris-demo/','/companions/eris/'));
  }
}
const task='Natasha_PSD_20260929',taskRoot=path.join(pipeline,'outputs/seethrough_local',task);
const natasha=path.join(out,'natasha');
await mkdir(path.join(natasha,'viewer-assets'),{recursive:true});
for(const name of await readdir(path.join(pipeline,'viewer')))if(name.endsWith('.mjs'))await cp(path.join(pipeline,'viewer',name),path.join(natasha,'viewer-assets',name));
let html=await readFile(path.join(pipeline,'viewer/assembly-motion.html'),'utf8');
html=html.replace('<style>','<script src="/companions/embed-viewer.js"></script><style>');
html=html.replace('src="./assembly-motion.mjs','src="./viewer-assets/assembly-motion.mjs');
await writeFile(path.join(natasha,'index.html'),html);
const viewer=path.join(natasha,'viewer-assets/assembly-motion.mjs');
await writeFile(viewer,(await readFile(viewer,'utf8')).replace("'/layers/seethrough_local/'","'/companions/natasha/layers/seethrough_local/'"));
const copied=new Set();
async function asset(relative){
  relative=relative.replaceAll('\\','/');if(copied.has(relative))return;
  const full=path.resolve(taskRoot,relative);
  if(!full.startsWith(path.resolve(taskRoot)+path.sep)||!await exists(full))throw Error('Missing runtime dependency '+relative);
  copied.add(relative);const dest=path.join(natasha,'layers/seethrough_local',task,relative);
  await mkdir(path.dirname(dest),{recursive:true});await cp(full,dest);
  if(!relative.endsWith('.json'))return;
  const data=JSON.parse(await readFile(full,'utf8'));
  async function visit(value){
    if(typeof value==='string'&&/\.(png|json)$/.test(value)){
      for(const ref of [value,path.join(path.dirname(relative),value)])if(await exists(path.join(taskRoot,ref))){await asset(ref);break;}
    }else if(Array.isArray(value))for(const v of value)await visit(v);
    else if(value&&typeof value==='object')for(const v of Object.values(value))await visit(v);
  }
  await visit(data);
}
await asset('_review/motion_v62_casual02_rb_leg/rig.json');
const hashes=[];
async function inventory(dir){for(const e of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())await inventory(full);else{const bytes=await readFile(full);hashes.push({path:path.relative(out,full).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await inventory(out);
await writeFile(path.join(out,'sources.json'),JSON.stringify({date:'2026-10-24',sources:{eris:'my-portfolio/public/eris-demo',miffy:'my-portfolio/public/miffy-demo motion_v50',mimi:'my-portfolio/public/mimi-demo motion_v95',natasha:'auto_layering_pipeline motion_v62_casual02_rb_leg; user visual review pending'},files:hashes},null,2));
console.log({files:hashes.length,bytes:hashes.reduce((s,f)=>s+f.bytes,0),natashaDependencies:copied.size});
