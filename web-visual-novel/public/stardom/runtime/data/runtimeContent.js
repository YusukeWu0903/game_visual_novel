/** Browser bootstrap may provide table-generated JSON before game modules load. */
const runtimeContent = new Map();
export function setRuntimeContent(content) {
    runtimeContent.clear();
    for (const [key, value] of Object.entries(content))
        runtimeContent.set(key, value);
}
export function getRuntimeContent(key, fallback) {
    return (runtimeContent.has(key) ? runtimeContent.get(key) : fallback());
}
