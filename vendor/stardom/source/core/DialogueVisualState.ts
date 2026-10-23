import type { DialogueLineData } from '../data/dialogueData.js';
import type { DialogueOptionData } from '../data/dialogueOptionsData.js';
import { resolveNextDialogueId } from './GameDialogue.js';

/** Blank carries the overlay, zero clears it; the scene behind it remains independent. */
export function nextCgGraphicId(current: string | null, instruction: string | null | undefined): string | null {
  return instruction == null ? current : instruction === '0' ? null : instruction;
}

/** Reconstruct only the authored route, never a CG from an unchosen branch. */
export function restoreCgBeforeLine(lines: readonly DialogueLineData[], options: readonly DialogueOptionData[], targetId: string, choice: (id: string) => string | null): string | null {
  const byId = new Map(lines.map(line => [line.id,line]));
  const ordered = [...lines].sort((a,b) => a.lineOrder-b.lineOrder);
  const visited = new Set<string>();
  let id: string | null = ordered[0]?.id ?? null, cg: string | null = null;
  while (id && !visited.has(id)) {
    if (id === targetId) return cg;
    visited.add(id);
    const line = byId.get(id); if (!line) break;
    cg = nextCgGraphicId(cg,line.cgGraphicId);
    id = line.nodeType === 'choice'
      ? options.find(option => option.choiceDialogueId === line.id && option.id === choice(line.id))?.responseDialogueId ?? null
      : resolveNextDialogueId(line,ordered);
  }
  return null;
}
