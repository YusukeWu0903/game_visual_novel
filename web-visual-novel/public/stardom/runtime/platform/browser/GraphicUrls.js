import { getGraphicAssetPath } from '../../data/graphicsData.js';
/** Browser URL policy stays outside the portable graphic catalog. */
export function getGraphicAssetUrl(id) {
    const path = getGraphicAssetPath(id);
    return path ? '/assets/graphics/' + path : null;
}
