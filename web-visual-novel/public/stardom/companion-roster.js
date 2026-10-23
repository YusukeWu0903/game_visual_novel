export const COMPANIONS = [
  {id:'maru',name:'Maru',url:'/stardom/companion-actor.html?id=maru'},
  {id:'sophia',name:'Sophia',url:'/stardom/companion-actor.html?id=sophia'},
  {id:'eris',name:'Eris',url:'/companions/eris/index.html'},
  {id:'miffy',name:'Miffy',url:'/companions/miffy/index.html'},
  {id:'mimi',name:'Mimi',url:'/companions/mimi/index.html'},
  {id:'natasha',name:'Natasha',url:'/companions/natasha/index.html?local=Natasha_PSD_20260929&rig=_review/motion_v62_casual02_rb_leg/rig.json'},
];
export function shuffleBag(ids,previous,random=Math.random){
  const bag=[...ids];for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  if(bag.length>1&&bag[0]===previous)[bag[0],bag[1]]=[bag[1],bag[0]];
  return bag;
}
export const dwellTime=(random=Math.random)=>12000+random()*6000;
export const fadeWeights=p=>{p=Math.max(0,Math.min(1,p));return [1-p,p];};
