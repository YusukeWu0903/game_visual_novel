export interface AppearanceDefinition {
  id: string; characterId: string; isDefault: boolean;
  portraitGraphicId: string; motionProfileId: 'none' | 'maru-idle-v4' | 'layered-idle-v1';
  motionManifestGraphicId: string | null;
}
export interface WearableDefinition { id: string; owned: boolean; appearanceId: string | null; }
export function resolveAppearance(characterId: string, selected: Readonly<Record<string,string>>, appearances: readonly AppearanceDefinition[]): AppearanceDefinition | null {
  return appearances.find(a=>a.characterId===characterId&&a.id===selected[characterId])??appearances.find(a=>a.characterId===characterId&&a.isDefault)??null;
}
export function wearableAppearance(wardrobeId: string, wardrobe: readonly WearableDefinition[], appearances: readonly AppearanceDefinition[]): AppearanceDefinition | null {
  const item=wardrobe.find(w=>w.id===wardrobeId&&w.owned);
  return item?.appearanceId?appearances.find(a=>a.id===item.appearanceId)??null:null;
}
export async function changeWardrobe(id:string,game:{getWardrobeAppearance(id:string):AppearanceDefinition|null;equipWardrobe(id:string):boolean},presentation:{prepare(appearance:AppearanceDefinition):Promise<void>}):Promise<boolean>{
  const appearance=game.getWardrobeAppearance(id);if(!appearance)return false;
  await presentation.prepare(appearance);
  // Commit only after presentation resources are ready. The model rechecks ownership/state.
  return game.equipWardrobe(id);
}
