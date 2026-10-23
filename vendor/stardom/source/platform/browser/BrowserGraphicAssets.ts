import type { GraphicAssetLoaderPort } from '../../core/PlatformPorts.js';
import { getGraphicAssetUrl } from './GraphicUrls.js';

/** Loads stable graphic IDs into browser-owned Image resources. */
export const browserGraphicAssets: GraphicAssetLoaderPort<HTMLImageElement> = {
  load(graphicId) {
    const url = getGraphicAssetUrl(graphicId);
    if (!url) return Promise.resolve(null);
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
  },
};
