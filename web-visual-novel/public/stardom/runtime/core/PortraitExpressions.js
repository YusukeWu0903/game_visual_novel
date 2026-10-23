/** One line controls its explicit portrait actor, or its speaker when the actor is omitted. */
export function dialogueExpressionTarget(line) {
    return line.portraitCharacterId ?? line.characterId;
}
/** Asset bindings are specific to an appearance profile; never swap a different outfit in. */
export function resolvePortraitExpression(characterId, profileId, code, catalog) {
    if (!code)
        return null;
    return catalog.find(row => row.characterId === characterId && row.motionManifestGraphicId === profileId && row.expressionCode === code) ?? null;
}
