import type {GameController} from '../../controller/GameController.js';
import {CHARACTER_DATA,type CharacterData} from '../../data/charactersData.js';
import {getGraphicAssetUrl} from './GraphicUrls.js';
import {browserGraphicAssets} from './BrowserGraphicAssets.js';
import {validateMaruMotionProfile,type MaruMotionProfile} from '../../view/MaruIdleMotion.js';
const preparedProfiles=new Map<string,MaruMotionProfile>();
export function characterWithAppearance(ctrl:GameController,id:string):CharacterData|undefined{
  const character=CHARACTER_DATA.find(c=>c.id===id),appearance=ctrl.getCharacterAppearance(id);
  return character?{...character,...(appearance?{portraitGraphicId:appearance.portraitGraphicId,motionProfileId:appearance.motionProfileId,motionManifestGraphicId:appearance.motionManifestGraphicId}:{})}:undefined;
}
export async function loadAppearanceProfile(manifestId:string|null):Promise<MaruMotionProfile>{
  if(manifestId&&preparedProfiles.has(manifestId))return preparedProfiles.get(manifestId)!;
  const url=getGraphicAssetUrl(manifestId);if(!url)throw Error('Missing appearance profile');
  const response=await fetch(url);if(!response.ok)throw Error('Appearance profile unavailable');
  const profile=validateMaruMotionProfile(await response.json());
  preparedProfiles.set(manifestId!,profile);return profile;
}
export async function prepareAppearance(portraitId:string,manifestId:string|null):Promise<void>{
  if(!await browserGraphicAssets.load(portraitId))throw Error('Appearance portrait unavailable');
  if(manifestId){const profile=await loadAppearanceProfile(manifestId);if(!profile.sourceGraphicId||!await browserGraphicAssets.load(profile.sourceGraphicId))throw Error('Appearance source unavailable');
    if(profile.depthGraphicId){const depth=await browserGraphicAssets.load(profile.depthGraphicId);if(!depth||depth.naturalWidth!==profile.rasterSize?.width||depth.naturalHeight!==profile.rasterSize?.height)throw Error('Appearance depth unavailable');}
    if(profile.blinkEnabled)for(const frame of profile.blinkFrames??[])if(!await browserGraphicAssets.load(frame.graphicId))throw Error('Appearance blink unavailable');}
}
