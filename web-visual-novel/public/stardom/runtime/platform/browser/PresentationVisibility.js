/** Browser presentation lifecycle; a covered room must recheck after overlays close. */
export const PRESENTATION_VISIBILITY_CHANGE = 'game-presentation-visibility-change';
export function notifyPresentationVisibilityChange() {
    document.dispatchEvent(new Event(PRESENTATION_VISIBILITY_CHANGE));
}
