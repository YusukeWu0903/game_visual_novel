import { TEXT_COLORS, parseColorText, colorTextGlyphs, type ColorTextRun } from '../core/ColorText.js';

function spanFor(run: ColorTextRun): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = run.text;
  if (run.color) span.style.color = TEXT_COLORS[run.color];
  return span;
}

/** Safe text nodes only: authored markup is never assigned to innerHTML. */
export function renderColorText(target: HTMLElement, source: string): void {
  target.replaceChildren(...parseColorText(source).runs.map(spanFor));
}

export interface ColorTextReveal { length: number; reveal(count: number): void; }

/** Prelayout the whole line, then reveal visible glyphs without exposing command characters. */
export function prepareColorText(target: HTMLElement, source: string): ColorTextReveal {
  const spans = colorTextGlyphs(source).map(run => {
    const span = spanFor(run);
    span.style.visibility = 'hidden';
    return span;
  });
  target.replaceChildren(...spans);
  let visible = 0;
  return {
    length: spans.length,
    reveal(count: number): void {
      const next = Math.min(spans.length, Math.max(0, Math.floor(count)));
      while (visible < next) spans[visible++].style.visibility = 'visible';
      while (visible > next) spans[--visible].style.visibility = 'hidden';
    },
  };
}
