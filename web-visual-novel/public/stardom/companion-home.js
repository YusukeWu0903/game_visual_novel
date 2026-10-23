import {COMPANIONS,shuffleBag,dwellTime,fadeWeights} from './companion-roster.js';
export function installCompanionHome(menu){
  const stage=menu.querySelector('.home-portraits'),name=menu.querySelector('#companion-name'),dots=menu.querySelector('.companion-dots');
  const review=new URL(location.href).searchParams.has('home-review');
  let current=null,next=null,bag=[],timer=0,frame=0,generation=0,running=false,transitioning=false;
  const actors=new Set();
  function pick(){bag=bag.filter(id=>id!==current?.id);if(!bag.length)bag=shuffleBag(COMPANIONS.map(c=>c.id),current?.id);return bag.shift();}
  function mark(id){name.textContent=COMPANIONS.find(c=>c.id===id)?.name??'';for(const b of dots.children)b.setAttribute('aria-pressed',String(b.dataset.id===id));}
  function actor(id){
    const entry=COMPANIONS.find(c=>c.id===id);if(!entry)throw Error('Unknown companion');
    const host=document.createElement('div');host.className='home-actor';host.dataset.character=id;host.style.opacity='0';
    const iframe=document.createElement('iframe');iframe.title=entry.name+' 動態立繪';iframe.tabIndex=-1;iframe.setAttribute('aria-hidden','true');
    host.append(iframe);stage.append(host);
    let disposed=false,timeout,onMessage,rejectReady;
    const item={id,host,iframe,ready:null,active(value){iframe.contentWindow?.postMessage({type:'companion-active',active:value},location.origin);},dispose(){if(disposed)return;disposed=true;actors.delete(item);clearTimeout(timeout);removeEventListener('message',onMessage);host.remove();rejectReady?.(Error('Companion disposed'));}};
    actors.add(item);
    item.ready=new Promise((resolve,reject)=>{
      rejectReady=reject;
      onMessage=e=>{
        if(e.source!==iframe.contentWindow||e.origin!==location.origin)return;
        if(e.data?.type==='companion-ready'){clearTimeout(timeout);removeEventListener('message',onMessage);host.dataset.ready='true';resolve(item);}
        if(e.data?.type==='companion-error'){clearTimeout(timeout);removeEventListener('message',onMessage);reject(Error(e.data.message));}
      };
      addEventListener('message',onMessage);timeout=setTimeout(()=>reject(Error('Companion load timeout: '+id)),25000);iframe.src=entry.url;
    });
    // Attach a rejection handler immediately, including when a pending load is cancelled.
    item.ready.catch(()=>{});return item;
  }
  function prepare(id=pick()){
    next?.dispose();next=actor(id);next.ready.then(item=>{if(item===next)item.active(false);}).catch(()=>{});return next;
  }
  function schedule(){clearTimeout(timer);if(!running||review)return;if(!next)prepare();timer=setTimeout(()=>void change(next?.id??pick()),dwellTime());}
  async function change(id){
    if(!running||transitioning)return;
    if(current?.id===id){schedule();return;}
    const token=generation;transitioning=true;
    const pending=next?.id===id?next:prepare(id);
    try{
      await pending.ready;if(token!==generation||!running)return;
      const outgoing=current;current=pending;next=null;current.active(true);mark(id);
      if(!outgoing){current.host.style.opacity='1';transitioning=false;schedule();return;}
      const begin=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1500;
      const step=now=>{
        if(token!==generation)return;
        const p=duration?Math.min(1,(now-begin)/duration):1;
        const [a,b]=fadeWeights(p);outgoing.host.style.opacity=String(a);current.host.style.opacity=String(b);stage.dataset.progress=String(p);
        if(p<1)frame=requestAnimationFrame(step);else{outgoing.dispose();transitioning=false;schedule();}
      };frame=requestAnimationFrame(step);
    }catch(error){
      if(token!==generation)return;
      console.warn('Home companion unavailable',id,error);pending.dispose();if(next===pending)next=null;transitioning=false;
      if(!current)name.textContent='角色載入中…';schedule();
    }
  }
  function stop(){running=false;generation++;clearTimeout(timer);cancelAnimationFrame(frame);for(const item of [...actors])item.dispose();current=next=null;transitioning=false;}
  function start(){if(running)return;running=true;generation++;void change(pick());}
  for(const entry of COMPANIONS){const b=document.createElement('button');b.type='button';b.dataset.id=entry.id;b.title=entry.name;b.setAttribute('aria-label','顯示 '+entry.name);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{clearTimeout(timer);void change(entry.id);});dots.append(b);}
  new MutationObserver(()=>{if(menu.hidden)stop();else start();}).observe(menu,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(!menu.hidden)start();});
  addEventListener('pagehide',stop);
  if(review){
    const panel=document.createElement('section');panel.className='home-review';panel.setAttribute('aria-label','首頁切換驗收');
    panel.innerHTML='<label>淡出角色<select id="review-from"></select></label><label>淡入角色<select id="review-to"></select></label><label>交叉進度<input id="review-progress" type="range" min="0" max="100" step="25" value="0"></label><button type="button">載入比較</button><output>0%</output>';
    for(const select of panel.querySelectorAll('select'))for(const entry of COMPANIONS){const option=new Option(entry.name,entry.id);select.append(option);}
    panel.querySelector('#review-to').value='sophia';
    const progress=panel.querySelector('input'),output=panel.querySelector('output');
    const apply=()=>{if(!current||!next)return;const p=Number(progress.value)/100,[a,b]=fadeWeights(p);current.host.style.opacity=String(a);next.host.style.opacity=String(b);stage.dataset.progress=String(p);mark(p<.5?current.id:next.id);output.value=Math.round(p*100)+'%';};
    panel.querySelector('button').onclick=async()=>{
      stop();running=true;const token=++generation;
      current=actor(panel.querySelector('#review-from').value);next=actor(panel.querySelector('#review-to').value);
      try{await Promise.all([current.ready,next.ready]);if(token!==generation)return;current.active(false);next.active(false);apply();output.value='已就緒 · '+progress.value+'%';}
      catch(error){output.value='載入失敗';console.error(error);}
    };progress.addEventListener('input',apply);menu.append(panel);
  }
  start();return {stop};
}
