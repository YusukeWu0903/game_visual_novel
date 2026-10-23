export const SAVE_KEY = 'visual_novel_stardom_save_v1';
export function createDialogueSave(storage, appearances = () => undefined) {
  let state = fresh();
  function fresh(eventId = null) { return { version: 1, eventId, dialogueChoices: {}, dialogueProgress: {}, claimedRewards: [], pendingDialogueReward: null, completed: false }; }
  function persist() { storage.setItem(SAVE_KEY, JSON.stringify(state)); }
  return {
    start(eventId) { state = fresh(eventId); persist(); },
    restore() {
      const saved = JSON.parse(storage.getItem(SAVE_KEY) || 'null');
      if (!saved || saved.version !== 1 || !['Event0003','Event0004','Event0005'].includes(saved.eventId) || saved.completed || !saved.dialogueProgress || !saved.dialogueChoices || !Array.isArray(saved.claimedRewards)) return null;
      state = saved; return state.eventId;
    },
    snapshot: () => structuredClone(state),
    getCharacterAppearance: appearances,
    getDialogueProgress: id => state.dialogueProgress[id] ?? null,
    getDialogueChoice: id => state.dialogueChoices[id] ?? null,
    recordDialogueProgress(id, node) { state.dialogueProgress[id] = node; persist(); },
    chooseDialogueOption(eventId, choiceId, optionId, responseId) {
      if (state.dialogueChoices[choiceId] || state.pendingDialogueReward) return false;
      state.dialogueChoices[choiceId] = optionId; state.dialogueProgress[eventId] = responseId; persist(); return true;
    },
    grantDialogueRewards(eventId, rewards) {
      if (state.pendingDialogueReward) return state.pendingDialogueReward;
      const available = rewards.filter(r => !state.claimedRewards.includes(r.id));
      if (!available.length) return null;
      state.claimedRewards.push(...available.map(r => r.id));
      // This project displays demo receipts; it has no inventory/attribute economy.
      state.pendingDialogueReward = { eventId, rewardIds: available.map(r => r.id), rewards: available.map(({id,rewardType,targetId,targetName,amount}) => ({id,rewardType,targetId,targetName,amount})) };
      persist(); return state.pendingDialogueReward;
    },
    acknowledgeDialogueReward(eventId) { if (state.pendingDialogueReward?.eventId !== eventId) return false; state.pendingDialogueReward = null; persist(); return true; },
    completeEvent(eventId) { if (state.dialogueProgress[eventId] === '__end__') state.completed = true; persist(); },
  };
}
