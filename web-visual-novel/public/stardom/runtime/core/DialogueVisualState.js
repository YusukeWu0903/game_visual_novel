import { resolveNextDialogueId } from './GameDialogue.js';
/** Blank carries the overlay, zero clears it; the scene behind it remains independent. */
export function nextCgGraphicId(current, instruction) {
    return instruction == null ? current : instruction === '0' ? null : instruction;
}
/** Reconstruct only the authored route, never a CG from an unchosen branch. */
export function restoreCgBeforeLine(lines, options, targetId, choice) {
    const byId = new Map(lines.map(line => [line.id, line]));
    const ordered = [...lines].sort((a, b) => a.lineOrder - b.lineOrder);
    const visited = new Set();
    let id = ordered[0]?.id ?? null, cg = null;
    while (id && !visited.has(id)) {
        if (id === targetId)
            return cg;
        visited.add(id);
        const line = byId.get(id);
        if (!line)
            break;
        cg = nextCgGraphicId(cg, line.cgGraphicId);
        id = line.nodeType === 'choice'
            ? options.find(option => option.choiceDialogueId === line.id && option.id === choice(line.id))?.responseDialogueId ?? null
            : resolveNextDialogueId(line, ordered);
    }
    return null;
}
