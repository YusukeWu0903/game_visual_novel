/** Named presentation colors shared by every dialogue text surface and engine adapter. */
export const TEXT_COLORS = Object.freeze({ red: '#FF6B6B', green: '#A8E6A3', blue: '#75D7F0' });
export type TextColor = keyof typeof TEXT_COLORS;
export interface ColorTextRun { text: string; color: TextColor | null; }
export interface ParsedColorText { runs: ColorTextRun[]; plainText: string; errors: string[]; }

/** Only our balanced color tags are commands. Invalid markup remains literal, never HTML. */
export function parseColorText(source: string): ParsedColorText {
  const runs: ColorTextRun[] = [];
  const stack: TextColor[] = [];
  const errors: string[] = [];
  const tags = /\[\/?color\b[^\]\r\n]*(?:\]|(?=\r?\n|$))/g;
  let cursor = 0;
  const append = (text: string) => {
    if (!text) return;
    const color = stack[stack.length - 1] ?? null;
    const previous = runs[runs.length - 1];
    if (previous?.color === color) previous.text += text;
    else runs.push({text, color});
  };
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(source))) {
    append(source.slice(cursor, tag.index));
    if (tag[0] === '[/color]') {
      if (!stack.length) errors.push('Unexpected closing color tag at '+tag.index);
      else stack.pop();
    } else {
      const name = /^\[color=([^\]]+)\]$/.exec(tag[0])?.[1] ?? '';
      if (!Object.prototype.hasOwnProperty.call(TEXT_COLORS, name)) errors.push('Invalid color tag at '+tag.index+': '+tag[0]);
      else stack.push(name as TextColor);
    }
    cursor = tags.lastIndex;
  }
  append(source.slice(cursor));
  if (stack.length) errors.push('Unclosed color tag');
  if (errors.length) return {runs: [{text:source,color:null}],plainText:source,errors};
  return {runs,plainText:runs.map(run=>run.text).join(''),errors};
}

export function colorTextGlyphs(source: string): ColorTextRun[] {
  return parseColorText(source).runs.flatMap(run => Array.from(run.text, text => ({text,color:run.color})));
}
