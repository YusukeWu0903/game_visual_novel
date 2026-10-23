// Presentation-only host: preserve the authored renderer, native textures and rig.
(() => {
  const nativeRaf=window.requestAnimationFrame.bind(window), nativeCancel=window.cancelAnimationFrame.bind(window);
  let running=true,sequence=0;const pending=new Map();
  window.requestAnimationFrame=callback=>{
    const id=++sequence;
    const run=time=>{if(!pending.has(id))return;if(!running){pending.set(id,{callback});return;}pending.delete(id);callback(time);};
    pending.set(id,{callback,native:nativeRaf(run)});return id;
  };
  window.cancelAnimationFrame=id=>{const entry=pending.get(id);if(entry?.native)nativeCancel(entry.native);pending.delete(id);};
  function setRunning(value){if(running===value)return;running=value;if(value)for(const [id,entry]of pending)if(!entry.native){pending.delete(id);window.requestAnimationFrame(entry.callback);}}
  addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='companion-active')setRunning(event.data.active);});
  const style=document.createElement('style');style.textContent=`
    html,body { background:transparent!important; margin:0!important; overflow:hidden!important; width:100%;height:100%; }
    body > header, aside, #sidePanel, #sideToggle, #loading-overlay, #guides { display:none!important; }
    main { display:block!important; height:100%!important; min-height:0!important; }
    .stage { position:relative!important; width:100%!important; height:100%!important; padding:0!important; background:transparent!important; overflow:hidden!important; }
    canvas#stage { position:absolute!important; left:50%!important; top:0!important; transform:translateX(-50%)!important; width:auto!important; height:115%!important; max-width:none!important; margin:0!important; background:transparent!important; box-shadow:none!important; }
    body:has(#guides) canvas#stage { width:100%!important; height:100%!important; }
  `;document.head.append(style);
  let sent=false;
  addEventListener('DOMContentLoaded',()=>{
    const status=document.getElementById('status');
    if(!status)return;
    const observer=new MutationObserver(()=>{
      if(sent||!status.textContent.includes('已載入'))return;
      sent=true;observer.disconnect();
      nativeRaf(()=>nativeRaf(()=>{parent.postMessage({type:'companion-ready'},location.origin);setRunning(false);}));
    });observer.observe(status,{childList:true,characterData:true,subtree:true});
  });
  addEventListener('error',event=>parent.postMessage({type:'companion-error',message:event.message},location.origin));
  addEventListener('pagehide',()=>{for(const e of pending.values())if(e.native)nativeCancel(e.native);pending.clear();});
})();
