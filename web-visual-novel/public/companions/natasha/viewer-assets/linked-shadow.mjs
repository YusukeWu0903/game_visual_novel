/** Optional owner-follow shadow stage, clipped after transforms by receivers.
 * Caller must pass pre-deformed images for nonlinear fields. No physical light.
 */
export function createLinkedShadowStage(width=1280,height=1280,make=()=>document.createElement('canvas')) {
  const output=make(),mask=make();for(const c of [output,mask]){c.width=width;c.height=height;}
  return {output,render({shadow,ownerMatrix=[1,0,0,1,0,0],receivers=[],ownerVisible=true}){
    const g=output.getContext('2d'),m=mask.getContext('2d');
    for(const c of [g,m]){c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.clearRect(0,0,width,height);}
    if(!ownerVisible)return output;
    g.setTransform(...ownerMatrix);g.drawImage(shadow,0,0);
    for(const r of receivers){if(r.visible===false)continue;m.setTransform(...(r.matrix||[1,0,0,1,0,0]));m.drawImage(r.image,0,0);}
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);g.globalCompositeOperation='source-over';return output;
  }};
}
