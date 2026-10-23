import type { GameController } from '../controller/GameController.js';
import type { DialogueLineData } from '../data/dialogueData.js';
import type { DialogueOptionData } from '../data/dialogueOptionsData.js';
import type { DialogueRewardData } from '../data/dialogueRewardsData.js';
import type { PendingDialogueReward } from '../model/GameModel.js';
import { resolveNextDialogueId } from './GameDialogue.js';

type DialogueActions = Pick<GameController,
  'snapshot' | 'getDialogueProgress' | 'getDialogueChoice' | 'recordDialogueProgress' |
  'chooseDialogueOption' | 'grantDialogueRewards' | 'acknowledgeDialogueReward' | 'completeEvent'>;

/** Branching, progress and reward timing shared by browser and future engine presentations. */
export class DialogueFlowSession {
  private readonly linesById: Map<string, DialogueLineData>;
  private readonly optionsByChoice = new Map<string, DialogueOptionData[]>();
  private currentId: string;

  constructor(
    private readonly eventId: string,
    private readonly lines: readonly DialogueLineData[],
    options: readonly DialogueOptionData[],
    private readonly rewards: readonly DialogueRewardData[],
    private readonly actions: DialogueActions,
    private readonly preview: { initialDialogueId?: string; nonPersisting?: boolean } = {},
  ) {
    this.linesById = new Map(lines.map((line) => [line.id, line]));
    for (const option of options) {
      const group = this.optionsByChoice.get(option.choiceDialogueId) ?? [];
      group.push(option);
      this.optionsByChoice.set(option.choiceDialogueId, group);
    }
    for (const group of this.optionsByChoice.values()) group.sort((a, b) => a.optionOrder - b.optionOrder);
    this.currentId = preview.initialDialogueId ?? (preview.nonPersisting ? lines[0]?.id : actions.getDialogueProgress(eventId)) ?? lines[0]?.id ?? '';
  }

  get currentDialogueId(): string { return this.currentId; }
  get currentLine(): DialogueLineData | null { return this.linesById.get(this.currentId) ?? null; }
  get pendingReward(): PendingDialogueReward | null {
    if (this.preview.nonPersisting) return null;
    const receipt = this.actions.snapshot().pendingDialogueReward;
    return receipt?.eventId === this.eventId ? receipt : null;
  }

  enterCurrentLine(): DialogueLineData | null {
    const line = this.currentLine;
    if (line && !this.preview.nonPersisting) this.actions.recordDialogueProgress(this.eventId, line.id);
    return line;
  }

  choicesFor(line: DialogueLineData): readonly DialogueOptionData[] {
    return this.optionsByChoice.get(line.id) ?? [];
  }

  resumeSavedChoice(line: DialogueLineData): boolean {
    if (this.preview.nonPersisting) return false;
    const optionId = this.actions.getDialogueChoice(line.id);
    const selected = this.choicesFor(line).find((option) => option.id === optionId);
    if (!selected) return false;
    this.currentId = selected.responseDialogueId;
    return true;
  }

  choose(line: DialogueLineData, option: DialogueOptionData): boolean {
    if (!this.choicesFor(line).some((candidate) => candidate.id === option.id)) return false;
    if (!this.preview.nonPersisting && !this.actions.chooseDialogueOption(this.eventId, line.id, option.id, option.responseDialogueId)) return false;
    this.currentId = option.responseDialogueId;
    return true;
  }

  completeLine(line: DialogueLineData): { nextId: string | null; receipt: PendingDialogueReward | null } {
    const nextId = resolveNextDialogueId(line, this.lines);
    if (!this.preview.nonPersisting) this.actions.recordDialogueProgress(this.eventId, nextId ?? '__end__');
    const selectedIds = new Set(Object.values(this.actions.snapshot().dialogueChoices ?? {}));
    const eligible = this.rewards.filter((reward) => reward.eventId === this.eventId
      && reward.triggerDialogueId === line.id
      && (!reward.triggerOptionId || selectedIds.has(reward.triggerOptionId)));
    const receipt = this.preview.nonPersisting ? null : this.actions.grantDialogueRewards(this.eventId, eligible);
    if (nextId) this.currentId = nextId;
    return { nextId, receipt };
  }

  acknowledgeReward(): boolean { return this.preview.nonPersisting || this.actions.acknowledgeDialogueReward(this.eventId); }

  finish(): void {
    if (this.preview.nonPersisting) return;
    if (this.pendingReward) this.actions.acknowledgeDialogueReward(this.eventId);
    this.actions.completeEvent(this.eventId);
  }
}
