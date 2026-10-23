import {getRuntimeContent} from './runtimeContent.js';
import type {AppearanceDefinition} from '../core/Wardrobe.js';
export const APPEARANCE_DATA: AppearanceDefinition[]=getRuntimeContent('appearances',()=>([
  {
    "id": "Appearance0001",
    "enabled": true,
    "characterId": "Character0001",
    "portraitGraphicId": "Graphic1004",
    "motionProfileId": "maru-idle-v4",
    "motionManifestGraphicId": "Graphic1123",
    "isDefault": true
  },
  {
    "id": "Appearance0002",
    "enabled": true,
    "characterId": "Character0001",
    "portraitGraphicId": "Graphic1125",
    "motionProfileId": "maru-idle-v4",
    "motionManifestGraphicId": "Graphic1126",
    "isDefault": false
  }
]));
