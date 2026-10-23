/** Browser bootstrap may provide table-generated JSON before game modules load. */
const runtimeContent = new Map<string, unknown>();

export function setRuntimeContent(content: Readonly<Record<string, unknown>>): void {
  runtimeContent.clear();
  for (const [key, value] of Object.entries(content)) runtimeContent.set(key, value);
}

export function getRuntimeContent<T>(key: string, fallback: () => T): T {
  return (runtimeContent.has(key) ? runtimeContent.get(key) : fallback()) as T;
}
