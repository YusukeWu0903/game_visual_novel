import { MaruIdleMotion } from './runtime/view/MaruIdleMotion.js';
import { LayeredPortraitMotion } from './runtime/platform/browser/LayeredPortraitMotion.js';
import { loadAppearanceProfile } from './runtime/platform/browser/CharacterAppearance.js';
const host=document.querySelector('#actor');let motion;
try {
  const id=new URL(location.href).searchParams.get('id');
  if(id==='maru')host.style.top='-15%';
  if(id==='maru') await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Maru unavailable')),15000);
    motion=new MaruIdleMotion(host,true,undefined,undefined,undefined,()=>loadAppearanceProfile('Graphic1123'),()=>{clearTimeout(timeout);resolve();});
  });
  else if(id==='sophia'){motion=new LayeredPortraitMotion(host,'Graphic1049');if(!await motion.ready)throw Error('Sophia unavailable');}
  else throw Error('Unknown companion');
  parent.postMessage({type:'companion-ready'},location.origin);
}catch(error){console.error(error);parent.postMessage({type:'companion-error',message:error.message},location.origin);}
addEventListener('pagehide',()=>motion?.dispose());
