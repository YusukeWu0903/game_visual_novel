import { fitGameViewport, GAME_VIEWPORT } from '../../core/GameViewport.js';
import { t } from '../../core/localization.js';

/** Same frame bounds and unsupported-size guidance for the game and preview entrypoints. */
export function installGameViewport(): () => void {
  const root = document.documentElement, app = document.getElementById('app');
  const guidance = document.getElementById('viewport-guidance');
  if (guidance) guidance.querySelector('p')!.textContent = t('String0830');
  const update = () => {
    const fit = fitGameViewport(window.innerWidth, window.innerHeight);
    root.style.setProperty('--game-frame-width', fit.width + 'px');
    root.style.setProperty('--game-frame-height', fit.height + 'px');
    root.classList.toggle('viewport-too-small', !fit.supported);
    app?.classList.toggle('viewport-too-small', !fit.supported);
    guidance?.toggleAttribute('hidden', fit.supported);
  };
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  update();
  return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); };
}

/** Fixed logical UI dimensions; scale the complete scene instead of reflowing its text box. */
export function fitDialogueScene(frame: HTMLElement): () => void {
  const update = () => {
    const bounds = frame.getBoundingClientRect();
    const scale = Math.min(bounds.width / GAME_VIEWPORT.width, bounds.height / GAME_VIEWPORT.height);
    frame.style.setProperty('--dialogue-stage-scale', String(scale));
  };
  const observer = new ResizeObserver(update);
  observer.observe(frame); update();
  return () => observer.disconnect();
}
