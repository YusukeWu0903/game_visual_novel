import { GRAPHIC_ID } from '../core/GraphicIds.js';
import { CHARACTER_DATA } from '../data/charactersData.js';
import { getGraphicAssetUrl } from '../platform/browser/GraphicUrls.js';
import type { PortraitStageSettings } from '../core/DialogueStage.js';
import { browserAnimationClock } from '../platform/browser/BrowserAnimationClock.js';
import { browserGraphicAssets } from '../platform/browser/BrowserGraphicAssets.js';
import { PRESENTATION_VISIBILITY_CHANGE } from '../platform/browser/PresentationVisibility.js';
import type { AnimationClockPort, GraphicAssetLoaderPort } from '../core/PlatformPorts.js';

const SOURCE_SIZE = { width: 1280, height: 1280 } as const;
const CROP = { x: 365, y: 0, width: 549, height: 1280 } as const;
const OUTPUT = { width: 360, height: 840 } as const;
const BLINK_INTERVALS = [3.5, 4.4, 3.8, 5.1, 4.0] as const;
const BLINK_PERIOD = BLINK_INTERVALS.reduce((sum, interval) => sum + interval, 0);
const BLINK_START = 2.6;
const BLINK_CLOSE_SECONDS = 0.08;
const BLINK_HOLD_SECONDS = 0.05;
const BLINK_OPEN_SECONDS = 0.11;
const BLINK_DURATION = BLINK_CLOSE_SECONDS + BLINK_HOLD_SECONDS + BLINK_OPEN_SECONDS;
const STANCE_BANDS = [
  { y: 0, body: 12, torso: 2, head: 0 },
  { y: 300, body: 12, torso: 2, head: 0 },
  { y: 455, body: 10, torso: 2, head: 0 },
  { y: 735, body: 7, torso: 1, head: 0 },
  { y: 1010, body: 4, torso: 0, head: 0 },
  { y: 1280, body: 0, torso: 0, head: 0 },
] as const;
const CHEST = { x: 640, y: 510, radiusX: 158, radiusY: 110, maxPixels: 3 } as const;
export interface MaruMotionProfile {
  depthGraphicId?: string;
  blinkFrames?: { progress: number; graphicId: string }[];
  sourceGraphicId?: string;
  rasterSize?: { width: number; height: number };
  sourceMapping?: { scaleX: number; scaleY: number; offsetX: number; offsetY: number };
  roomStage?: PortraitStageSettings;
  blinkEnabled: boolean;
  stanceBands: { y: number; body: number; torso: number; head: number }[];
  chest: { x: number; y: number; radiusX: number; radiusY: number; maxPixels: number };
}

export function validateMaruMotionProfile(value: unknown): MaruMotionProfile {
  const p = value as MaruMotionProfile;
  if (!p || typeof p.blinkEnabled !== 'boolean' || !Array.isArray(p.stanceBands) || p.stanceBands.length < 2 ||
    p.stanceBands[0].y !== 0 || p.stanceBands[p.stanceBands.length - 1]?.y !== 1280 ||
    p.stanceBands.some((b, i, all) => !['y', 'body', 'torso', 'head'].every(k => Number.isFinite(b[k as keyof typeof b])) || (i > 0 && b.y <= all[i - 1].y)) ||
    !p.chest || !['x', 'y', 'radiusX', 'radiusY', 'maxPixels'].every(k => Number.isFinite(p.chest[k as keyof typeof p.chest])) || p.chest.radiusX <= 0 || p.chest.radiusY <= 0 || p.chest.maxPixels < 0) {
    throw new Error('Invalid Maru motion profile');
  }
  if (p.rasterSize && ![p.rasterSize.width, p.rasterSize.height].every(n => Number.isInteger(n) && n > 0 && n <= 4096)) throw new Error('Invalid Maru raster size');
  if(p.depthGraphicId!==undefined&&!/^Graphic\d{4,}$/.test(p.depthGraphicId))throw new Error('Invalid portrait depth graphic');
  if (p.sourceMapping && (!['scaleX', 'scaleY', 'offsetX', 'offsetY'].every(k => Number.isFinite(p.sourceMapping![k as keyof NonNullable<typeof p.sourceMapping>])) || p.sourceMapping.scaleX <= 0 || p.sourceMapping.scaleY <= 0)) throw new Error('Invalid Maru source mapping');
  if (p.blinkFrames && (!p.blinkFrames.length || p.blinkFrames.some((f, i, all) => !Number.isFinite(f.progress) || f.progress <= 0 || f.progress > 1 || typeof f.graphicId !== 'string' || !f.graphicId || (i > 0 && f.progress <= all[i - 1].progress)) || p.blinkFrames[p.blinkFrames.length - 1].progress !== 1)) throw new Error('Invalid Maru native blink frames');
  return p;
}

/** Index -1 selects the unchanged native open source. Both eyes share one stage. */
export function selectMaruBlinkFrame(progress: number, frames: NonNullable<MaruMotionProfile['blinkFrames']>): number {
  progress = Math.max(0, Math.min(1, progress));
  let selected = -1, distance = progress;
  for (let i = 0; i < frames.length; i++) {
    const next = Math.abs(frames[i].progress - progress);
    if (next < distance) { selected = i; distance = next; }
  }
  return selected;
}

const smooth = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Low amplitude idle pose from Maru motion_v4; pointer driven motion is intentionally excluded. */
export function sampleMaruIdlePose(seconds: number): { body: number; torso: number; head: number; breath: number } {
  const phase = seconds * 0.82;
  const sway = Math.sin(phase);
  return {
    body: 0.82 * sway,
    torso: -0.42 * Math.sin(phase - 0.24),
    head: -0.22 * Math.sin(phase - 0.52),
    breath: Math.sin(seconds * 0.82 - 0.65) * 0.7 + Math.sin(seconds * 1.64 - 0.95) * 0.3,
  };
}

/** A natural idle blink every 3.5–5.1 seconds, with a short first delay. */
export function sampleMaruBlink(seconds: number): number {
  const elapsed = seconds - BLINK_START;
  if (elapsed < 0) return 0;
  const cycle = Math.floor(elapsed / BLINK_PERIOD);
  let withinCycle = elapsed - cycle * BLINK_PERIOD;
  for (const interval of BLINK_INTERVALS) {
    if (withinCycle < interval) break;
    withinCycle -= interval;
  }
  if (withinCycle >= BLINK_DURATION) return 0;
  if (withinCycle < BLINK_CLOSE_SECONDS) return smooth(withinCycle / BLINK_CLOSE_SECONDS);
  if (withinCycle < BLINK_CLOSE_SECONDS + BLINK_HOLD_SECONDS) return 1;
  return 1 - smooth((withinCycle - BLINK_CLOSE_SECONDS - BLINK_HOLD_SECONDS) / BLINK_OPEN_SECONDS);
}

export function sampleStanceOffset(y: number, pose: Pick<ReturnType<typeof sampleMaruIdlePose>, 'body' | 'torso' | 'head'>, bands: MaruMotionProfile['stanceBands'] | typeof STANCE_BANDS = STANCE_BANDS): number {
  const clampedY = Math.max(0, Math.min(1280, y));
  let band = 0;
  while (band < bands.length - 2 && clampedY > bands[band + 1].y) band++;
  const a = bands[band];
  const b = bands[band + 1];
  const t = smooth((clampedY - a.y) / (b.y - a.y));
  return (pose.body * (a.body + (b.body - a.body) * t)) +
    (pose.torso * (a.torso + (b.torso - a.torso) * t)) +
    (pose.head * (a.head + (b.head - a.head) * t));
}

export function chestWeight(x: number, y: number, chest: MaruMotionProfile['chest'] = CHEST): number {
  const xx = Math.abs((x - chest.x) / chest.radiusX);
  const yy = Math.abs((y - chest.y) / chest.radiusY);
  return xx >= 1 || yy >= 1 ? 0 : (1 - smooth(xx)) * (1 - smooth(yy));
}

function sampleAlphaCorrected(source: Uint8ClampedArray, width: number, height: number, x: number, y: number, output: Uint8ClampedArray, outIndex: number): void {
  const sy = Math.max(0, Math.min(height - 1, y));
  const y0 = Math.floor(sy);
  const y1 = Math.min(height - 1, y0 + 1);
  const t = sy - y0;
  const i0 = (y0 * width + x) * 4;
  const i1 = (y1 * width + x) * 4;
  const w0 = (1 - t) * source[i0 + 3] / 255;
  const w1 = t * source[i1 + 3] / 255;
  const alpha = w0 + w1;
  output[outIndex + 3] = alpha * 255;
  if (alpha > 0) {
    output[outIndex] = (source[i0] * w0 + source[i1] * w1) / alpha;
    output[outIndex + 1] = (source[i0 + 1] * w0 + source[i1 + 1] * w1) / alpha;
    output[outIndex + 2] = (source[i0 + 2] * w0 + source[i1 + 2] * w1) / alpha;
  } else {
    output[outIndex] = output[outIndex + 1] = output[outIndex + 2] = 0;
  }
}

/** Shared room/dialogue composite idle with authored geometry and a static fallback. */
export class MaruIdleMotion {
  private readonly canvas = document.createElement('canvas');
  private readonly context: CanvasRenderingContext2D;
  private readonly poseCanvas = document.createElement('canvas');
  private readonly poseContext: CanvasRenderingContext2D;
  private image: HTMLImageElement | null = null;
  private nativeBlinkImages: HTMLImageElement[] = [];
  private expressionImage: HTMLImageElement | null = null;
  private expressionRequest = 0;
  private renderedSeconds = 0;
  private readonly assetLoad: Promise<void>;
  private reviewState: { blink: number; idle: boolean } | null = null;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frame = 0;
  private lastFrame = 0;
  private startedAt = 0;
  private active = false;
  private ready = false;
  private output: { width: number; height: number } = OUTPUT;
  private depthPixels:Uint8ClampedArray|null=null;
  private depthPreviewEnabled=true;
  private profile: MaruMotionProfile = { blinkEnabled: false, stanceBands: [...STANCE_BANDS], chest: CHEST };
  private intersection = false;
  private observer?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private disposed = false;
  private readonly onEnvironmentChange = () => this.syncRunning();

  constructor(
    private readonly host: HTMLElement,
    private readonly overlayMode = false,
    private readonly imageLoader: GraphicAssetLoaderPort<HTMLImageElement> = browserGraphicAssets,
    private readonly clock: AnimationClockPort = browserAnimationClock,
    private readonly onProfile?: (profile: MaruMotionProfile) => void,
    private readonly loadProfileOverride?: () => Promise<MaruMotionProfile>,
    private readonly onReady?: () => void,
  ) {
    this.context = this.canvas.getContext('2d', { alpha: true })!;
    this.poseContext = this.poseCanvas.getContext('2d', { alpha: true, willReadFrequently: true })!;
    this.canvas.className = 'heroine-motion';
    this.canvas.width = OUTPUT.width;
    this.canvas.height = OUTPUT.height;
    this.poseCanvas.width = OUTPUT.width;
    this.poseCanvas.height = OUTPUT.height;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.host.append(this.canvas);

    this.assetLoad = this.loadPortraitAssets();

    this.observer = new IntersectionObserver(([entry]) => {
      this.intersection = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.05);
      this.syncRunning();
    }, { threshold: [0, 0.05] });
    this.observer.observe(this.canvas);
    this.mutationObserver = new MutationObserver(() => this.syncRunning());
    this.mutationObserver.observe(host, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    this.reducedMotion.addEventListener('change', this.onEnvironmentChange);
    document.addEventListener('visibilitychange', this.onEnvironmentChange);
    document.addEventListener(PRESENTATION_VISIBILITY_CHANGE, this.onEnvironmentChange);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    this.clock.cancelFrame(this.frame);
    this.observer?.disconnect();
    this.mutationObserver?.disconnect();
    this.reducedMotion.removeEventListener('change', this.onEnvironmentChange);
    document.removeEventListener('visibilitychange', this.onEnvironmentChange);
    document.removeEventListener(PRESENTATION_VISIBILITY_CHANGE, this.onEnvironmentChange);
    this.host.classList.remove('maru-motion-active');
    this.canvas.remove();
  }

  /** Review harness only; ordinary gameplay leaves this at null. */
  setDepthPreview(enabled:boolean):void{this.depthPreviewEnabled=enabled;this.render(0);}

  /** Review harness only; ordinary gameplay leaves this at null. */
  setBlinkPreview(progress: number | null, idle = false): void {
    if (progress !== null && (!Number.isFinite(progress) || progress < 0 || progress > 1)) throw new Error('Invalid blink preview progress');
    this.reviewState = progress === null ? null : { blink: progress, idle };
    this.render(0);
  }

  /** A held expression shares the original native sampling and idle field. Neutral restores normal blink. */
  async setExpressionGraphic(graphicId: string | null): Promise<boolean> {
    const request = ++this.expressionRequest;
    await this.assetLoad;
    if (this.disposed || request !== this.expressionRequest) return false;
    if (!graphicId) {
      this.expressionImage = null;
      this.canvas.dataset.expressionGraphicId = '';
      this.render(this.renderedSeconds);
      return true;
    }
    const image = await this.imageLoader.load(graphicId).catch(() => null);
    if (this.disposed || request !== this.expressionRequest) return false;
    if (!image || image.naturalWidth !== this.image?.naturalWidth || image.naturalHeight !== this.image?.naturalHeight) {
      this.expressionImage = null;
      this.canvas.dataset.expressionGraphicId = '';
      this.render(this.renderedSeconds);
      return false;
    }
    this.expressionImage = image;
    this.canvas.dataset.expressionGraphicId = graphicId;
    this.render(this.renderedSeconds);
    return true;
  }

  private async loadPortraitAssets(): Promise<void> {
    let portrait: HTMLImageElement | null;
    try {
      if (this.loadProfileOverride) this.profile = validateMaruMotionProfile(await this.loadProfileOverride());
      else {
        const character = CHARACTER_DATA.find(c => c.id === 'Character0001');
        const url = getGraphicAssetUrl(character?.motionManifestGraphicId);
        if (!url) throw new Error('Missing Maru motion profile');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Maru motion profile unavailable');
        this.profile = validateMaruMotionProfile(await response.json());
      }
      this.output = this.profile.rasterSize ?? OUTPUT;
      for (const canvas of [this.canvas, this.poseCanvas]) {
        canvas.width = this.output.width;
        canvas.height = this.output.height;
      }
      this.onProfile?.(this.profile);
      portrait = await this.imageLoader.load(this.profile.sourceGraphicId ?? GRAPHIC_ID.maruMotionPortrait);
      if(this.profile.depthGraphicId){
        const depth=await this.imageLoader.load(this.profile.depthGraphicId);
        if(!depth||depth.naturalWidth!==this.output.width||depth.naturalHeight!==this.output.height)throw Error('Portrait depth dimensions mismatch');
        const buffer=document.createElement('canvas');buffer.width=this.output.width;buffer.height=this.output.height;
        const context=buffer.getContext('2d',{willReadFrequently:true})!;context.drawImage(depth,0,0);
        this.depthPixels=context.getImageData(0,0,buffer.width,buffer.height).data;
      }
      if (this.profile.blinkEnabled && this.profile.blinkFrames) {
        const images = await Promise.all(this.profile.blinkFrames.map(frame => this.imageLoader.load(frame.graphicId)));
        if (images.every((image): image is HTMLImageElement => Boolean(image && image.naturalWidth === portrait?.naturalWidth && image.naturalHeight === portrait?.naturalHeight))) this.nativeBlinkImages = images;
      }
    } catch { if (!this.disposed) this.canvas.remove(); return; }
    if (this.disposed) return;
    if (!portrait) { this.canvas.remove(); return; }
    this.image = portrait;
    this.canvas.dataset.blinkStatus = !this.profile.blinkEnabled ? 'disabled' : this.nativeBlinkImages.length ? 'ready' : 'unavailable';
    this.canvas.dataset.depthStatus=this.depthPixels?'ready':'none';
    this.ready = true;
    this.canvas.classList.add('is-ready');
    this.render(0);
    this.onReady?.();
    this.syncRunning();
  }

  private syncRunning(): void {
    if (this.disposed) return;
    const bounds = this.canvas.getBoundingClientRect();
    const topmost = bounds.width && bounds.height
      ? document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
      : null;
    const covered = !this.overlayMode && Boolean(topmost && !this.host.contains(topmost));
    const visible = this.ready && !this.reducedMotion.matches && document.visibilityState === 'visible' &&
      (this.overlayMode || this.intersection) && !covered && !this.host.closest('[hidden], [aria-hidden="true"]');
    // Do not retrigger our attribute observer when the class already matches.
    if (this.host.classList.contains('maru-motion-active') !== visible) {
      this.host.classList.toggle('maru-motion-active', visible);
    }
    this.canvas.dataset.motionState = visible ? 'running' : 'paused';
    if (visible === this.active) return;
    this.active = visible;
    if (visible) {
      this.startedAt = this.clock.now();
      this.lastFrame = 0;
      this.frame = this.clock.requestFrame(this.tick);
    } else {
      this.clock.cancelFrame(this.frame);
      this.render(0);
    }
  }

  private tick = (now: number): void => {
    if (!this.active) return;
    if (now - this.lastFrame >= 1000 / 30) {
      this.lastFrame = now;
      this.canvas.dataset.motionTime = String((now - this.startedAt) / 1000);
      this.render((now - this.startedAt) / 1000);
    }
    this.frame = this.clock.requestFrame(this.tick);
  };

  private render(seconds: number): void {
    this.renderedSeconds = seconds;
    const CHEST = this.profile.chest;
    const { width, height } = this.output;
    const pose = this.reviewState && !this.reviewState.idle ? { body: 0, torso: 0, head: 0, breath: 0 } : sampleMaruIdlePose(seconds);
    const scaleX = width / CROP.width;
    const scaleY = height / SOURCE_SIZE.height;
    const blink = this.reviewState?.blink ?? sampleMaruBlink(seconds);
    const frameIndex = !this.expressionImage && this.nativeBlinkImages.length ? selectMaruBlinkFrame(blink, this.profile.blinkFrames!) : -1;
    const source = this.expressionImage ?? (frameIndex >= 0 ? this.nativeBlinkImages[frameIndex] : this.image);
    const mapping = this.profile.sourceMapping ?? { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    if (!source) return;
    if (this.canvas.dataset.blinkFrame !== String(frameIndex)) this.canvas.dataset.blinkFrame = String(frameIndex);

    this.poseContext.setTransform(1, 0, 0, 1, 0, 0);
    this.poseContext.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += 2) {
      const h = Math.min(2, height - y);
      const sourceY = y / scaleY;
      const shift = sampleStanceOffset(sourceY, pose, this.profile.stanceBands) * scaleX;
      this.poseContext.drawImage(source,
        CROP.x * mapping.scaleX + mapping.offsetX, sourceY * mapping.scaleY + mapping.offsetY,
        CROP.width * mapping.scaleX, h / scaleY * mapping.scaleY,
        shift, y, width, h);
    }

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(this.poseCanvas, 0, 0);

    const centerX = (CHEST.x - CROP.x) * scaleX;
    const centerY = CHEST.y * scaleY;
    const radiusX = CHEST.radiusX * scaleX;
    const radiusY = CHEST.radiusY * scaleY;
    const left = Math.max(0, Math.floor(centerX - radiusX));
    const right = Math.min(width, Math.ceil(centerX + radiusX));
    const top = Math.max(0, Math.floor((centerY - radiusY) / 2) * 2);
    const bottom = Math.min(height, Math.ceil((centerY + radiusY) / 2) * 2);
    const rect = { x: left, y: top, width: right - left, height: bottom - top };
    if (rect.width <= 0 || rect.height <= 0) return;
    const imageData = this.poseContext.getImageData(rect.x, rect.y, rect.width, rect.height);
    const output = this.context.createImageData(rect.width, rect.height);
    output.data.set(imageData.data);
    const maxDisplacement = CHEST.maxPixels * scaleY * pose.breath;
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const nativeX = CROP.x + x / scaleX;
        const nativeY = y / scaleY;
        // Depth only attenuates the existing bounded breathing field; it never changes neutral RGB or source registration.
        const depthWeight=this.depthPixels&&this.depthPreviewEnabled?1-this.depthPixels[(y*width+x)*4]/510:1;
        const dy = maxDisplacement * chestWeight(nativeX, nativeY, CHEST) * depthWeight;
        const index = ((y - top) * rect.width + x - left) * 4;
        if (Math.abs(dy) > 0.001) sampleAlphaCorrected(imageData.data, rect.width, rect.height, x - left, y - top - dy, output.data, index);
      }
    }
    this.context.putImageData(output, rect.x, rect.y);
  }
}
