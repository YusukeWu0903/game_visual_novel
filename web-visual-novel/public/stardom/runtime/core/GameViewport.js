/** Shared logical canvas and minimum supported browser viewport, in CSS pixels. */
export const GAME_VIEWPORT = { width: 1280, height: 720, minWidth: 640, minHeight: 360 };
export function fitGameViewport(viewportWidth, viewportHeight) {
    const width = Number.isFinite(viewportWidth) ? Math.max(0, viewportWidth) : 0;
    const height = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
    const scale = Math.min(width / GAME_VIEWPORT.width, height / GAME_VIEWPORT.height);
    const frameWidth = GAME_VIEWPORT.width * scale, frameHeight = GAME_VIEWPORT.height * scale;
    return { width: frameWidth, height: frameHeight, left: (width - frameWidth) / 2, top: (height - frameHeight) / 2, scale, supported: width >= GAME_VIEWPORT.minWidth && height >= GAME_VIEWPORT.minHeight };
}
