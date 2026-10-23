import { getGraphicAssetPath } from '../../data/graphicsData.js';

/** Browser URL policy stays outside the portable graphic catalog. */
export function getGraphicAssetUrl(id: string | null | undefined): string | null {
  const path = getGraphicAssetPath(id);
  return path ? '/assets/graphics/' + path : null;
}
