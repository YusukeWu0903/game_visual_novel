import { getRuntimeContent } from './runtimeContent.js';
import { t as tr } from '../core/localization.js';
export const DIALOGUE_REWARD_DATA = getRuntimeContent('dialogueRewards', () => [
    {
        "id": "DialogueReward0001",
        "eventId": "Event0003",
        "triggerDialogueId": "Dialogue0060",
        "triggerOptionId": "DialogueOption0001",
        "rewardType": "trait",
        "targetId": "confidence",
        "targetName": tr("String100073"),
        "amount": 1
    },
    {
        "id": "DialogueReward0002",
        "eventId": "Event0003",
        "triggerDialogueId": "Dialogue0061",
        "triggerOptionId": "DialogueOption0002",
        "rewardType": "trait",
        "targetId": "singing",
        "targetName": tr("String100074"),
        "amount": 1
    },
    {
        "id": "DialogueReward0003",
        "eventId": "Event0003",
        "triggerDialogueId": "Dialogue0062",
        "triggerOptionId": "DialogueOption0003",
        "rewardType": "item",
        "targetId": "it-tea",
        "targetName": tr("String0063"),
        "amount": 1
    }
]);
