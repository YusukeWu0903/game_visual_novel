import { getRuntimeContent } from './runtimeContent.js';
export interface AudioAssetData { id: string; assetLabel: string; audioType: 'bgm' | 'sfx'; assetPath: string; }
export const AUDIO_ASSETS: AudioAssetData[] = getRuntimeContent('audioAssets', () => [
  {
    "id": "Audio0001",
    "assetLabel": "試播用溫暖氛圍音樂",
    "audioType": "bgm",
    "assetPath": "audio/dialogue-demo/demo_bgm.wav"
  },
  {
    "id": "Audio0002",
    "assetLabel": "試播用提示鈴音",
    "audioType": "sfx",
    "assetPath": "audio/dialogue-demo/demo_chime.wav"
  },
  {
    "id": "Audio0003",
    "assetLabel": "試播用雨聲循環",
    "audioType": "sfx",
    "assetPath": "audio/dialogue-demo/demo_rain_loop.wav"
  }
]);
