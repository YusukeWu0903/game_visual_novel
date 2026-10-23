export function dialogueTypingDelay(presentationType, speed) {
    return (presentationType === 1 ? 80 : 28) * 100 / speed;
}
/** One playback owns one transcript. Only fully revealed lines and committed choices enter it. */
export class DialogueTranscript {
    constructor() {
        this.rows = [];
    }
    get entries() { return this.rows.map(row => ({ ...row })); }
    line(dialogueId) {
        const last = this.rows[this.rows.length - 1];
        if (last?.kind !== 'line' || last.dialogueId !== dialogueId)
            this.rows.push({ kind: 'line', dialogueId });
    }
    choice(dialogueId, optionId) { this.rows.push({ kind: 'choice', dialogueId, optionId }); }
    clear() { this.rows = []; }
}
