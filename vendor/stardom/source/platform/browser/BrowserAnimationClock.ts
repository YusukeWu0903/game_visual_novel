import type { AnimationClockPort } from '../../core/PlatformPorts.js';

/** Browser frame/timer adapter; game rules receive no window or timer handles. */
export const browserAnimationClock: AnimationClockPort = {
  now: () => performance.now(),
  requestFrame: (callback) => window.requestAnimationFrame(callback),
  cancelFrame: (handle) => window.cancelAnimationFrame(handle),
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (handle) => window.clearTimeout(handle),
};
