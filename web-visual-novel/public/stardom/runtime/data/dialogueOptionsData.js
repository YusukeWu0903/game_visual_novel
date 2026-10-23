import { getRuntimeContent } from './runtimeContent.js';
import { t as tr } from '../core/localization.js';
export const DIALOGUE_OPTION_DATA = getRuntimeContent('dialogueOptions', () => [
    {
        "id": "DialogueOption0001",
        "choiceDialogueId": "Dialogue0059",
        "optionOrder": 1,
        "text": tr("String100070"),
        "responseDialogueId": "Dialogue0060"
    },
    {
        "id": "DialogueOption0002",
        "choiceDialogueId": "Dialogue0059",
        "optionOrder": 2,
        "text": tr("String100071"),
        "responseDialogueId": "Dialogue0061"
    },
    {
        "id": "DialogueOption0003",
        "choiceDialogueId": "Dialogue0059",
        "optionOrder": 3,
        "text": tr("String100072"),
        "responseDialogueId": "Dialogue0062"
    }
]);
