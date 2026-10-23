const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function segment(keys,value){
  const bounded=clamp(value,keys[0],keys.at(-1));
  for(let i=0;i<keys.length-1;i++)if(bounded<=keys[i+1])
    return [i,(bounded-keys[i])/(keys[i+1]-keys[i])];
  return [keys.length-2,1];
}

export function validateKeyposeMesh(spec){
  if(spec?.mode!=='grid-keypose-v1'||spec.owner!=='face'||
     !Array.isArray(spec.bounds)||spec.bounds.length!==4||
     !spec.bounds.every(Number.isInteger)||
     spec.bounds[0]<0||spec.bounds[1]<0||
     spec.bounds[2]<=spec.bounds[0]||spec.bounds[3]<=spec.bounds[1]||
     !Number.isInteger(spec.step)||spec.step<2||spec.step>32)
    throw Error('Invalid keypose mesh domain');
  const validKeys=keys=>Array.isArray(keys)&&keys.length>=3&&keys.length<=9&&
    keys[0]===-1&&keys.at(-1)===1&&keys.includes(0)&&
    keys.every(Number.isFinite)&&keys.every((v,i)=>i===0||v>keys[i-1]);
  if(!validKeys(spec.yawKeys)||!validKeys(spec.pitchKeys))
    throw Error('Invalid keypose mesh controls');
  const [left,top,right,bottom]=spec.bounds;
  const columns=Math.ceil((right-left)/spec.step)+1;
  const rows=Math.ceil((bottom-top)/spec.step)+1;
  const expected=columns*rows*2;
  if(!Array.isArray(spec.poses)||spec.poses.length!==spec.yawKeys.length*spec.pitchKeys.length||
     spec.poses.some(p=>!Array.isArray(p)||p.length!==expected||
       p.some(v=>!Number.isFinite(v)||Math.abs(v)>32)))
    throw Error('Invalid keypose mesh offsets');
  const neutral=spec.poses[spec.yawKeys.indexOf(0)*spec.pitchKeys.length+spec.pitchKeys.indexOf(0)];
  if(neutral.some(v=>Math.abs(v)>1e-6))throw Error('Keypose neutral must be identity');
  return {columns,rows};
}

// Pose offsets are sampled once per control update. The renderer then queries
// this spatial field for its own vertices, without a character-specific formula.
export function createKeyposeMeshEvaluator(spec){
  const {columns,rows}=validateKeyposeMesh(spec);
  const poses=spec.poses.map(p=>Float32Array.from(p));
  const blended=new Float32Array(columns*rows*2);
  const [left,top,right,bottom]=spec.bounds;
  let lastYaw=NaN,lastPitch=NaN;
  return {
    setPose(yaw,pitch){
      if(!Number.isFinite(yaw)||!Number.isFinite(pitch))throw Error('Invalid keypose control');
      if(yaw===lastYaw&&pitch===lastPitch)return false;
      lastYaw=yaw;lastPitch=pitch;
      const [yi,yt]=segment(spec.yawKeys,yaw);
      const [pi,pt]=segment(spec.pitchKeys,pitch);
      const count=spec.pitchKeys.length;
      const a=poses[yi*count+pi],b=poses[(yi+1)*count+pi];
      const c=poses[yi*count+pi+1],d=poses[(yi+1)*count+pi+1];
      const wa=(1-yt)*(1-pt),wb=yt*(1-pt),wc=(1-yt)*pt,wd=yt*pt;
      for(let i=0;i<blended.length;i++)
        blended[i]=a[i]*wa+b[i]*wb+c[i]*wc+d[i]*wd;
      return true;
    },
    point(x,y){
      if(x<left||x>right||y<top||y>bottom)return [x,y];
      const xi=Math.min(columns-2,Math.floor((x-left)/spec.step));
      const yi=Math.min(rows-2,Math.floor((y-top)/spec.step));
      const x0=left+xi*spec.step,y0=top+yi*spec.step;
      const x1=Math.min(right,x0+spec.step),y1=Math.min(bottom,y0+spec.step);
      const u=(x-x0)/(x1-x0),v=(y-y0)/(y1-y0);
      const a=(yi*columns+xi)*2,b=a+2,c=a+columns*2,d=c+2;
      const w00=(1-u)*(1-v),w10=u*(1-v),w01=(1-u)*v,w11=u*v;
      return [x+blended[a]*w00+blended[b]*w10+blended[c]*w01+blended[d]*w11,
        y+blended[a+1]*w00+blended[b+1]*w10+blended[c+1]*w01+blended[d+1]*w11];
    },
    get grid(){return {columns,rows}},
  };
}
