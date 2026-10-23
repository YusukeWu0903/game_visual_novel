const clamp=value=>Math.max(-1,Math.min(1,Number.isFinite(value)?value:0));
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};

export function validateLegFollow(field){
  if(field?.mode!=='shared-lateral-foot-follow'||field.driver!=='body'||
     !Number.isFinite(field.maxPixels)||field.maxPixels<=0||field.maxPixels>16||
     !Array.isArray(field.bands)||field.bands.length<3||field.bands.length>16||
     field.bands[0][1]!==0||field.bands.at(-1)[1]!==1||
     field.bands.some((band,i)=>!Array.isArray(band)||band.length!==2||
       !band.every(Number.isFinite)||band[1]<0||band[1]>1||
       (i>0&&(band[0]<=field.bands[i-1][0]||band[1]<field.bands[i-1][1]))))
    throw Error('雙腳左右跟隨設定無效');
  return field;
}

export function legFollowWeight(y,field){
  const bands=field.bands;
  if(y<=bands[0][0])return 0;
  if(y>=bands.at(-1)[0])return 1;
  for(let i=1;i<bands.length;i++)if(y<=bands[i][0]){
    const [y0,w0]=bands[i-1],[y1,w1]=bands[i];
    return w0+(w1-w0)*smooth((y-y0)/(y1-y0));
  }
  return 1;
}

export function legFollowOffset(y,body,field){
  return field.maxPixels*clamp(body)*legFollowWeight(y,field);
}

export function drawLegFollowGuide(target,source,field){
  target.width=source.width;target.height=source.height;
  const g=target.getContext('2d');
  for(let y=0;y<target.height;y+=16){
    const weight=legFollowWeight(y,field);
    if(!weight)continue;
    g.strokeStyle=`rgba(255,188,45,${(.16+.68*weight).toFixed(3)})`;
    g.lineWidth=1.2;
    g.beginPath();g.moveTo(0,y);g.lineTo(target.width,y);g.stroke();
  }
  g.globalCompositeOperation='destination-in';g.drawImage(source,0,0);
  g.globalCompositeOperation='source-over';
}
