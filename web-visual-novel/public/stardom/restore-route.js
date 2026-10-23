/** Replay only the chosen path, excluding the current node. No rewards or input. */
export function restoreRoute(lines, options, choices, currentId) {
  if (!currentId || currentId === lines[0]?.id) return [];
  const byId = new Map(lines.map(l => [l.id,l]));
  const route = [], seen = new Set();
  let line = lines[0];
  while (line && line.id !== currentId) {
    if (seen.has(line.id)) throw Error('Cyclic saved dialogue route');
    seen.add(line.id); route.push(line);
    let next;
    if (line.nodeType === 'choice') next = options.find(o => o.choiceDialogueId === line.id && o.id === choices[line.id])?.responseDialogueId;
    else next = line.nextDialogueId ?? lines[lines.indexOf(line)+1]?.id;
    line = next ? byId.get(next) : null;
  }
  if (currentId !== '__end__' && !line) throw Error('Saved dialogue is not on the chosen route');
  return route;
}
