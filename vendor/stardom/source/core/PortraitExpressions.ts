export interface ExpressionTypeData { id: string; code: number; nameStringId: string; }
export interface CharacterExpressionData {
  id: string; characterId: string; expressionCode: number;
  motionManifestGraphicId: string; sourceGraphicId: string; fallbackGraphicId: string;
}

/** One line controls its explicit portrait actor, or its speaker when the actor is omitted. */
export function dialogueExpressionTarget(line: { portraitCharacterId: string | null; characterId: string | null }): string | null {
  return line.portraitCharacterId ?? line.characterId;
}

/** Asset bindings are specific to an appearance profile; never swap a different outfit in. */
export function resolvePortraitExpression(characterId: string, profileId: string | null | undefined, code: number | null | undefined, catalog: readonly CharacterExpressionData[]): CharacterExpressionData | null {
  if (!code) return null;
  return catalog.find(row => row.characterId === characterId && row.motionManifestGraphicId === profileId && row.expressionCode === code) ?? null;
}
