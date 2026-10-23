import { resolvePortraitGeometry } from '../../core/DialogueStage.js';
export function applyPortraitGeometry(host, presentation, character, settings, width = 1280, height = 666) {
    const geometry = resolvePortraitGeometry(presentation, character, settings, width, height);
    host.style.left = geometry.leftPx + 'px';
    host.style.top = geometry.topPx + 'px';
    host.style.bottom = 'auto';
    host.style.width = geometry.widthPx + 'px';
    host.style.height = geometry.heightPx + 'px';
    host.style.zIndex = String(presentation.zIndex);
    host.style.setProperty('--portrait-blur', presentation.blurPx + 'px');
    host.dataset.anchorX = String(geometry.anchorXPx);
    host.dataset.anchorY = String(geometry.anchorYPx);
    return geometry;
}
