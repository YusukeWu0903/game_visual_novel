import { getGraphicAssetUrl } from './GraphicUrls.js';
import { browserGraphicAssets } from './BrowserGraphicAssets.js';
import { drawRegisteredPortraitBlink, type RegisteredEye } from './RegisteredPortraitBlink.js';

interface MotionManifest {
  schemaVersion: number;
  profile: string;
  nativeSize: [number, number];
  crop: { x: number; y: number; width: number; height: number };
  rigGraphicId: string;
  sourceRelease?: string;
  layers: { name: string; graphicId: string }[];
  eyeManifestGraphicId?: string;
}
interface EyeManifest {
  replaceLayerNames: string[];
  insertAfterLayer: string;
  eyes: { bounds: [number, number, number, number]; center: [number, number]; blinkAxis?: [[number,number],[number,number]]; baseGraphicId: string; openGraphicId: string; closedGraphicId: string }[];
}

/** Browser presentation for an authored layered rig; game content crosses the boundary as stable IDs. */
export class LayeredPortraitMotion {
  readonly ready: Promise<boolean>;
  private disposed = false;
  private frameId = 0;
  private canvas = document.createElement('canvas');
  private renderer: { mesh: { canvas: HTMLCanvasElement }; compositePose: (...args: unknown[]) => void } | null = null;
  private abort = new AbortController();

  constructor(private host: HTMLElement, manifestGraphicId: string, private blinkPreview?: number) {
    // Layered actors have one authoritative visual, including while resources load.
    host.querySelectorAll('.dialogue-portrait-fallback').forEach(image => image.remove());
    this.canvas.className = 'heroine-motion layered-portrait-motion';
    this.canvas.width = 360; this.canvas.height = 840;
    this.canvas.setAttribute('aria-hidden', 'true');
    host.append(this.canvas);
    this.ready = this.load(manifestGraphicId).then(() => !this.disposed).catch(error => {
      if (!this.disposed) console.error('Layered portrait unavailable:', error);
      this.dispose();
      return false;
    });
  }

  private async json<T>(id: string): Promise<T> {
    const url = getGraphicAssetUrl(id);
    if (!url) throw new Error('Missing motion graphic: ' + id);
    const response = await fetch(url, { signal: this.abort.signal });
    if (!response.ok) throw new Error('Motion resource unavailable: ' + id);
    return response.json() as Promise<T>;
  }

  private async load(id: string): Promise<void> {
    const manifest = await this.json<MotionManifest>(id);
    if (manifest.schemaVersion !== 1 || manifest.profile !== 'layered-idle-v1') throw new Error('Unsupported layered portrait profile');
    this.canvas.dataset.motionRelease = manifest.sourceRelease ?? 'layered-idle-v1';
    const moduleUrl = (name: string) => new URL('./vendor/layered-portrait/' + name, import.meta.url).href;
    const [rig, images, fields, hairModule, expression, sway] = await Promise.all([
      this.json<any>(manifest.rigGraphicId),
      Promise.all(manifest.layers.map(layer => browserGraphicAssets.load(layer.graphicId))),
      import(moduleUrl('shared-field-adapter.mjs')),
      import(moduleUrl('hair-idle-state.mjs')),
      import(moduleUrl('expression.mjs')),
      import(moduleUrl('idle-sway-cycle.mjs')),
    ]);
    if (this.disposed) return;
    if (images.some(image => !image || image.naturalWidth !== manifest.nativeSize[0] || image.naturalHeight !== manifest.nativeSize[1])) throw new Error('Incomplete or misaligned layered portrait');
    if (rig.eyeRig && (!rig.eyeRig.blinkOnlySourceComposite || rig.eyeRig.gazeEnabled !== false || !manifest.eyeManifestGraphicId)) throw new Error('Unsupported layered eye rig');
    // This profile intentionally accepts only identity layer transforms. Other rigs need a matching adapter.
    if (rig.nodes?.some((node: any) => node.motion !== 'none')) throw new Error('Unsupported independent layer motion');
    const eyeManifest = manifest.eyeManifestGraphicId ? await this.json<EyeManifest>(manifest.eyeManifestGraphicId) : null;
    const eyes: RegisteredEye[] = eyeManifest ? await Promise.all(eyeManifest.eyes.map(async eye => {
      const [base, open, closed] = await Promise.all([eye.baseGraphicId, eye.openGraphicId, eye.closedGraphicId].map(id => browserGraphicAssets.load(id)));
      if (!base || !open || !closed) throw new Error('Incomplete registered eye assets');
      const stage = document.createElement('canvas');stage.width = eye.bounds[2] - eye.bounds[0];stage.height = eye.bounds[3] - eye.bounds[1];
      return { bounds: eye.bounds, center: eye.center, blinkAxis: eye.blinkAxis, base, open, closed, stage };
    })) : [];
    if (this.disposed) return;
    const composite = document.createElement('canvas'), neutral = document.createElement('canvas'), posed = document.createElement('canvas');
    composite.width = posed.width = manifest.nativeSize[0]; composite.height = posed.height = manifest.nativeSize[1];
    neutral.width = composite.width; neutral.height = composite.height;
    const sourceContext = composite.getContext('2d')!, output = this.canvas.getContext('2d')!;
    for (const image of images) sourceContext.drawImage(image!, 0, 0);
    neutral.getContext('2d')!.drawImage(composite, 0, 0);
    const renderer = fields.createSharedFieldAdapter();
    this.renderer = renderer;
    let elapsed = 0, previous = 0, bust = 0, velocity = 0, blinkCount = 0, wasClosed = false;
    let hairState = hairModule.initialHairIdleState();
    const hairSprings: Record<string, { position: number; velocity: number }> = {
      fronthair: { position: 0, velocity: 0 }, backhair: { position: 0, velocity: 0 },
    };
    const strength = rig.motionStrength.default / 100, crop = manifest.crop;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    document.addEventListener('visibilitychange', () => { previous = 0; }, { signal: this.abort.signal });
    const frame = (now: number) => {
      if (this.disposed) return;
      const wallDelta = previous && !document.hidden && !reducedMotion.matches ? Math.max(0, (now - previous) / 1000) : 0;
      const dt = Math.min(.05, wallDelta);
      previous = now;
      elapsed += wallDelta;
      const phase = elapsed * Math.PI * 2 / rig.idleSway.cycleSeconds;
      const controls = { body: Math.min(.82 * strength, 1) * sway.curvedSway(phase), torso: -.42 * strength * Math.sin(phase - .24), head: -.22 * strength * Math.sin(phase - .52) };
      const hair: Record<string, number> = {};
      const nextHair = hairModule.advanceHairIdle(hairState, 0, dt, elapsed, true, strength, rig.hairFollow.idleAroundYaw);
      hairState = nextHair.state;
      for (const name of ['fronthair', 'backhair']) {
        const part = rig.hairFollow.parts[name];
        hairSprings[name] = expression.advanceSpring(hairSprings[name], Math.max(-1.15, Math.min(1.15, nextHair.targets[name])), dt, { frequency: part.frequency, damping: part.damping, maxPosition: 1.15 });
        hair[name] = hairSprings[name].position;
      }
      const idle = Math.sin(elapsed * .82 - .65) * .7 + Math.sin(elapsed * 1.64 - .95) * .3;
      const target = idle * (rig.bustField.defaultStrength / 100) * rig.bustField.maxPixels;
      velocity += (target - bust) * 30 * dt;
      velocity *= Math.exp(-11 * dt);
      bust = Math.max(-rig.bustField.maxPixels, Math.min(rig.bustField.maxPixels, bust + velocity * dt));
      if (reducedMotion.matches) { controls.body = controls.torso = controls.head = 0; hair.fronthair = hair.backhair = 0; bust = velocity = 0; }
      const blink = rig.eyeRig ? this.blinkPreview ?? (reducedMotion.matches ? 0 : expression.blinkPulse(elapsed, true, rig.eyeRig.autoBlinkIntervalSeconds)) : 0;
      if (blink > .9 && !wasClosed) blinkCount++;
      wasClosed = blink > .9;
      this.canvas.dataset.blink = blink.toFixed(3);
      this.canvas.dataset.blinkCount = String(blinkCount);
      if (eyeManifest) {
        sourceContext.clearRect(0, 0, composite.width, composite.height);
        if (blink < .005) sourceContext.drawImage(neutral, 0, 0);
        else for (let index = 0; index < manifest.layers.length; index++) {
          const layer = manifest.layers[index];
          if (blink > .005 && eyeManifest.replaceLayerNames.includes(layer.name)) continue;
          sourceContext.drawImage(images[index]!, 0, 0);
          if (layer.name === eyeManifest.insertAfterLayer) drawRegisteredPortraitBlink(sourceContext, eyes, blink);
        }
      }
      renderer.compositePose(posed, composite, controls, rig, { hair, bustY: bust });
      output.clearRect(0, 0, this.canvas.width, this.canvas.height);
      output.drawImage(posed, crop.x, crop.y, crop.width, crop.height, 0, 0, this.canvas.width, this.canvas.height);
      this.host.classList.add('layered-motion-active');
      this.frameId = requestAnimationFrame(frame);
    };
    frame(performance.now());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort(); cancelAnimationFrame(this.frameId);
    this.renderer?.mesh.canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
    this.renderer = null;
    this.host.classList.remove('layered-motion-active');
    this.canvas.remove();
  }
}
