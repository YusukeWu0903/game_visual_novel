import type { GameEventDefinition } from './GameEventSystem.js';
import type { DialogueLineData } from '../data/dialogueData.js';

export function resolveEventDialogue(
  event: GameEventDefinition,
  catalog: readonly DialogueLineData[],
): DialogueLineData[] {
  const authored = catalog
    .filter((line) => line.eventId === event.id)
    .slice()
    .sort((a, b) => a.lineOrder - b.lineOrder);
  if (authored.length || event.category === 'news' || !event.debugPortraitPreview) return authored;

  return (event.text ?? '')
    .split(/\r?\n/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: event.id + ':debug:' + String(index + 1),
      eventId: event.id,
      presentationType: 0,
      lineOrder: index + 1,
      nodeType: 'line' as const,
      nextDialogueId: null,
      characterId: 'Character0001',
      text,
    backgroundSceneId: null,
    cgGraphicId: null,
    standingLineYPercent: null,
      portraitPosition: index % 2 === 0 ? 'left' as const : 'center' as const,
      movement: index === 0 ? 'enter-left' as const : 'none' as const,
      portraitCharacterId: 'Character0001',
      portraitCommand: 'auto' as const,
      portraitXPercent: null,
      portraitYPercent: null,
      portraitScalePercent: null,
      portraitZIndex: null,
      portraitDepthBlurPx: null,
      backgroundParallaxPercent: null,
      bgmAudioId: null,
      bgmFadeInSeconds: 0,
      sfxAudioId: null,
      sfxFadeInSeconds: 0,
      loopSfxAudioId: null,
      loopSfxFadeInSeconds: 0,
    }));
}

export function resolveNextDialogueId(
  line: DialogueLineData,
  eventLines: readonly DialogueLineData[],
): string | null {
  if (line.nodeType === 'choice') return null;
  if (line.nextDialogueId) return line.nextDialogueId;
  const ordered = eventLines.slice().sort((a, b) => a.lineOrder - b.lineOrder);
  const index = ordered.findIndex((candidate) => candidate.id === line.id);
  return ordered[index + 1]?.id ?? null;
}
