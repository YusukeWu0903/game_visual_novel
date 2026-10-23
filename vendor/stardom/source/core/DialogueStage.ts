import type { CharacterData } from '../data/charactersData.js';
import type { DialogueLineData } from '../data/dialogueData.js';

export interface PortraitPresentation {
  xPercent: number;
  yPercent: number;
  scalePercent: number;
  zIndex: number;
  blurPx: number;
}

export interface PortraitMetrics {
  heightCm?: number | null;
  portraitCanvasWidthPx?: number;
  portraitCanvasHeightPx?: number;
  portraitAnchorXPx?: number;
  portraitAnchorYPx?: number;
  portraitBodyHeightPx?: number;
  portraitAnchorType?: 0 | 1 | 2;
}
export interface PortraitStageSettings { standingLineYPercent?: number; portraitHeightPercent?: number; portraitReferenceHeightCm?: number; }

/** Serializable geometry shared by gameplay, calibration tools and future engine adapters. */
export function resolvePortraitGeometry(presentation: PortraitPresentation, character: PortraitMetrics, stage: PortraitStageSettings = {}, width = 1280, height = 666) {
  const canvasWidth = character.portraitCanvasWidthPx ?? 360, canvasHeight = character.portraitCanvasHeightPx ?? 840;
  const bodyHeight = character.portraitBodyHeightPx ?? canvasHeight;
  const referenceCm = stage.portraitReferenceHeightCm ?? 170;
  const completeHeightPx = height * ((stage.portraitHeightPercent ?? 100) / 100) * ((character.heightCm ?? referenceCm) / referenceCm) * (presentation.scalePercent / 100);
  const scale = completeHeightPx / bodyHeight;
  const anchorXPx = width * presentation.xPercent / 100;
  const groundYPx = height * ((stage.standingLineYPercent ?? 100) + presentation.yPercent - 100) / 100;
  const anchorFractionAboveFeet = character.portraitAnchorType === 0 ? 1 : character.portraitAnchorType === 1 ? .5 : 0;
  const anchorYPx = groundYPx - completeHeightPx * anchorFractionAboveFeet;
  return { leftPx: anchorXPx - (character.portraitAnchorXPx ?? canvasWidth / 2) * scale,
    topPx: anchorYPx - (character.portraitAnchorYPx ?? canvasHeight) * scale,
    widthPx: canvasWidth * scale, heightPx: canvasHeight * scale, anchorXPx, anchorYPx, groundYPx, completeHeightPx, scale };
}

const positionX = (position: 'left' | 'center' | 'right'): number =>
  position === 'left' ? 22 : position === 'right' ? 78 : 50;

export function resolvePortraitPresentation(line: DialogueLineData, character: CharacterData): PortraitPresentation {
  return {
    xPercent: line.portraitXPercent ?? (line.portraitPosition ? positionX(line.portraitPosition) : character.defaultXPercent),
    yPercent: line.portraitYPercent ?? character.defaultYPercent,
    scalePercent: line.portraitScalePercent ?? character.defaultScalePercent,
    zIndex: line.portraitZIndex ?? character.defaultZIndex,
    blurPx: line.portraitDepthBlurPx ?? character.defaultDepthBlurPx,
  };
}

/** A positive actor delta moves the background left by a smaller amount. */
export function updateReverseParallaxOffset(
  currentOffsetPx: number,
  actorDeltaXPercent: number,
  stageWidthPx: number,
  parallaxPercent: number,
): number {
  if (!actorDeltaXPercent || !parallaxPercent || !stageWidthPx) return currentOffsetPx;
  const limit = stageWidthPx * .04;
  const next = currentOffsetPx - (actorDeltaXPercent / 100) * stageWidthPx * (parallaxPercent / 100);
  return Math.max(-limit, Math.min(limit, next));
}
