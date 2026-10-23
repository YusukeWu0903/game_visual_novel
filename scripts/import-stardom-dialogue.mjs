// Explicit, repeatable snapshot import. Never modifies the source project.
import { readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const source = path.resolve(process.argv[2] || 'D:/Project/game_dual-realm');
const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'web-visual-novel/public/stardom');
const exists = async p => stat(p).then(() => true, () => false);
if (await exists(path.join(target, 'snapshot.json'))) throw Error('Snapshot already exists; review before refreshing.');
const legacy = path.join(root, 'web-visual-novel/legacy.html');
if (!await exists(legacy)) await cp(path.join(root, 'web-visual-novel/index.html'), legacy);
const files = [], visited = new Set();
async function copyFile(relative, destination) {
  const input = path.join(source, relative), output = path.join(root, destination);
  await mkdir(path.dirname(output), { recursive: true });
  await cp(input, output);
  const bytes = await readFile(input);
  files.push({ source: relative.replaceAll('\\','/'), destination: destination.replaceAll('\\','/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
async function moduleClosure(relative) {
  relative = path.normalize(relative);
  if (visited.has(relative)) return;
  visited.add(relative);
  const code = await readFile(path.join(source, 'dist', relative), 'utf8');
  await copyFile(path.join('dist', relative), path.join('web-visual-novel/public/stardom/runtime', relative));
  const ts = path.join('src', relative.replace(/\.js$/, '.ts'));
  if (await exists(path.join(source, ts))) await copyFile(ts, path.join('vendor/stardom/source', relative.replace(/\.js$/, '.ts')));
  for (const match of code.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith('.')) await moduleClosure(path.join(path.dirname(relative), match[1]));
  }
}
for (const entry of ['view/EventDialoguePlayback.js','platform/browser/DialogueAudio.js','platform/browser/GameViewport.js','data/dialogueData.js','data/dialogueOptionsData.js','data/dialogueRewardsData.js','data/appearancesData.js','core/Wardrobe.js']) await moduleClosure(entry);
await cp(path.join(source,'src/platform/browser/vendor/layered-portrait'), path.join(target,'runtime/platform/browser/vendor/layered-portrait'), {recursive:true});
await cp(path.join(source,'src/platform/browser/vendor/layered-portrait'), path.join(root,'vendor/stardom/source/platform/browser/vendor/layered-portrait'), {recursive:true});
const load = async name => import(pathToFileURL(path.join(source,'dist',name)).href);
const { GRAPHIC_ASSETS } = await load('data/graphicsData.js');
const { CHARACTER_DATA } = await load('data/charactersData.js');
const { CHARACTER_EXPRESSIONS } = await load('data/portraitExpressionsData.js');
const { SCENE_DATA } = await load('data/scenesData.js');
const { DIALOGUE_DATA } = await load('data/dialogueData.js');
const { AUDIO_ASSETS } = await load('data/audioData.js');
const { GRAPHIC_ID } = await load('core/GraphicIds.js');
const { APPEARANCE_DATA } = await load('data/appearancesData.js');
const graphics = new Map(GRAPHIC_ASSETS.map(g => [g.id,g]));
const ids = new Set(JSON.stringify([CHARACTER_DATA,CHARACTER_EXPRESSIONS,APPEARANCE_DATA,GRAPHIC_ID]).match(/Graphic\d+/g));
const lines = DIALOGUE_DATA.filter(line => ['Event0003','Event0004','Event0005'].includes(line.eventId));
for (const line of lines) {
  if (line.cgGraphicId && line.cgGraphicId !== '0') ids.add(line.cgGraphicId);
  const scene = SCENE_DATA.find(s => s.id === line.backgroundSceneId);
  if (scene) for (const id of JSON.stringify(scene).match(/Graphic\d+/g) || []) ids.add(id);
}
const copied = new Set();
async function graphic(id) {
  if (copied.has(id)) return;
  const asset = graphics.get(id); if (!asset) throw Error('Unknown graphic ' + id);
  copied.add(id);
  await copyFile('assets/graphics/' + asset.assetPath, 'web-visual-novel/public/assets/graphics/' + asset.assetPath);
  if (asset.assetPath.endsWith('.json')) {
    const json = await readFile(path.join(source,'assets/graphics',asset.assetPath),'utf8');
    for (const ref of json.match(/Graphic\d+/g) || []) await graphic(ref);
  }
}
for (const id of ids) await graphic(id);
for (const audio of AUDIO_ASSETS) await copyFile('assets/' + audio.assetPath, 'web-visual-novel/public/assets/' + audio.assetPath);
// Retain the exact dialogue rules, without importing unrelated game-shell styling.
const css = await readFile(path.join(source,'styles/main.css'),'utf8');
const start = css.indexOf('.event-dialogue-overlay {'), end = css.indexOf('.event-debug-grid',start);
await mkdir(target,{recursive:true});
await writeFile(path.join(target,'dialogue.css'), css.slice(start,end));
await writeFile(path.join(target,'snapshot.json'), JSON.stringify({source, importedOn:'2026-10-23', modules:visited.size, graphicCount:copied.size, files},null,2));
console.log(JSON.stringify({modules:visited.size,graphics:copied.size,files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
