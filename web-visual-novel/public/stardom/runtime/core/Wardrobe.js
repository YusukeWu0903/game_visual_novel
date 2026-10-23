export function resolveAppearance(characterId, selected, appearances) {
    return appearances.find(a => a.characterId === characterId && a.id === selected[characterId]) ?? appearances.find(a => a.characterId === characterId && a.isDefault) ?? null;
}
export function wearableAppearance(wardrobeId, wardrobe, appearances) {
    const item = wardrobe.find(w => w.id === wardrobeId && w.owned);
    return item?.appearanceId ? appearances.find(a => a.id === item.appearanceId) ?? null : null;
}
export async function changeWardrobe(id, game, presentation) {
    const appearance = game.getWardrobeAppearance(id);
    if (!appearance)
        return false;
    await presentation.prepare(appearance);
    // Commit only after presentation resources are ready. The model rechecks ownership/state.
    return game.equipWardrobe(id);
}
