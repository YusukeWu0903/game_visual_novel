export type DialogueSpeed = 50 | 100 | 150;
export type DialogueLogEntry = { kind: 'line'; dialogueId: string } | { kind: 'choice'; dialogueId: string; optionId: string };

export function dialogueTypingDelay(presentationType: number, speed: DialogueSpeed): number {
  return (presentationType === 1 ? 80 : 28) * 100 / speed;
}

/** One playback owns one transcript. Only fully revealed lines and committed choices enter it. */
export class DialogueTranscript {
  private rows: DialogueLogEntry[] = [];
  get entries(): readonly DialogueLogEntry[] { return this.rows.map(row => ({...row})); }
  line(dialogueId: string): void {
    const last = this.rows[this.rows.length-1];
    if (last?.kind !== 'line' || last.dialogueId !== dialogueId) this.rows.push({kind:'line',dialogueId});
  }
  choice(dialogueId: string, optionId: string): void { this.rows.push({kind:'choice',dialogueId,optionId}); }
  clear(): void { this.rows = []; }
}
