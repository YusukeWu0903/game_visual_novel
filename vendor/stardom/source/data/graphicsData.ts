import { getRuntimeContent } from './runtimeContent.js';
export interface GraphicAssetData { id: string; graphicType: 'background' | 'character' | 'ui' | 'icon' | 'effect' | 'cg'; editorName: string; assetPath: string; }
export const GRAPHIC_ASSETS: GraphicAssetData[] = getRuntimeContent('graphics', () => [
  {
    "id": "Graphic0001",
    "graphicType": "background",
    "editorName": "玩家房間背景",
    "assetPath": "backgrounds/rooms/player_room.png"
  },
  {
    "id": "Graphic0002",
    "graphicType": "background",
    "editorName": "城市大地圖背景",
    "assetPath": "backgrounds/maps/city_map.png"
  },
  {
    "id": "Graphic0003",
    "graphicType": "background",
    "editorName": "星光影城大廳背景",
    "assetPath": "backgrounds/locations/cinema_lobby.png"
  },
  {
    "id": "Graphic0004",
    "graphicType": "background",
    "editorName": "藝能訓練中心背景",
    "assetPath": "backgrounds/locations/training_center.png"
  },
  {
    "id": "Graphic0005",
    "graphicType": "background",
    "editorName": "心慈基金會背景",
    "assetPath": "backgrounds/locations/charity_foundation.png"
  },
  {
    "id": "Graphic0006",
    "graphicType": "background",
    "editorName": "寶兒精品背景",
    "assetPath": "backgrounds/locations/boutique.png"
  },
  {
    "id": "Graphic0007",
    "graphicType": "background",
    "editorName": "公園背景",
    "assetPath": "backgrounds/locations/park.png"
  },
  {
    "id": "Graphic0008",
    "graphicType": "background",
    "editorName": "音樂餐廳背景",
    "assetPath": "backgrounds/locations/music_bistro.png"
  },
  {
    "id": "Graphic0009",
    "graphicType": "background",
    "editorName": "婉婉禮品背景",
    "assetPath": "backgrounds/locations/gift_shop.png"
  },
  {
    "id": "Graphic0010",
    "graphicType": "background",
    "editorName": "心耘醫院背景",
    "assetPath": "backgrounds/locations/hospital_lobby.png"
  },
  {
    "id": "Graphic0011",
    "graphicType": "background",
    "editorName": "星空KTV背景",
    "assetPath": "backgrounds/locations/ktv_lobby.png"
  },
  {
    "id": "Graphic0012",
    "graphicType": "background",
    "editorName": "ROXY CLUB背景",
    "assetPath": "backgrounds/locations/pub_bar.png"
  },
  {
    "id": "Graphic0013",
    "graphicType": "background",
    "editorName": "女神中心背景",
    "assetPath": "backgrounds/locations/aesthetic_clinic_reception.png"
  },
  {
    "id": "Graphic0014",
    "graphicType": "background",
    "editorName": "紅豆影業背景",
    "assetPath": "backgrounds/locations/film_production_lobby.png"
  },
  {
    "id": "Graphic0015",
    "graphicType": "background",
    "editorName": "飛達製片背景",
    "assetPath": "backgrounds/locations/film_production_scifi_lobby.png"
  },
  {
    "id": "Graphic0016",
    "graphicType": "background",
    "editorName": "迅美廣告背景",
    "assetPath": "backgrounds/locations/advertising_agency_lobby.png"
  },
  {
    "id": "Graphic0017",
    "graphicType": "background",
    "editorName": "達文西廣告背景",
    "assetPath": "backgrounds/locations/advertising_agency_avant_garde_lobby.png"
  },
  {
    "id": "Graphic0018",
    "graphicType": "background",
    "editorName": "艾特電視台背景",
    "assetPath": "backgrounds/locations/tv_station_lobby.png"
  },
  {
    "id": "Graphic0019",
    "graphicType": "background",
    "editorName": "合家歡電視台背景",
    "assetPath": "backgrounds/locations/tv_station_variety_lobby.png"
  },
  {
    "id": "Graphic0020",
    "graphicType": "background",
    "editorName": "振聲唱片背景",
    "assetPath": "backgrounds/locations/record_label_lobby.png"
  },
  {
    "id": "Graphic0021",
    "graphicType": "background",
    "editorName": "銀河音樂背景",
    "assetPath": "backgrounds/locations/record_label_indie_lobby.png"
  },
  {
    "id": "Graphic0101",
    "graphicType": "background",
    "editorName": "錄音室背景",
    "assetPath": "backgrounds/dialogue/record_label_recording_studio.png"
  },
  {
    "id": "Graphic0102",
    "graphicType": "background",
    "editorName": "戲劇攝影棚背景",
    "assetPath": "backgrounds/dialogue/film_production_soundstage.png"
  },
  {
    "id": "Graphic0103",
    "graphicType": "background",
    "editorName": "主播攝影棚背景",
    "assetPath": "backgrounds/dialogue/tv_station_studio.png"
  },
  {
    "id": "Graphic0104",
    "graphicType": "background",
    "editorName": "設計工作室背景",
    "assetPath": "backgrounds/dialogue/advertising_agency_creative_room.png"
  },
  {
    "id": "Graphic1001",
    "graphicType": "character",
    "editorName": "Maru 動態立繪底圖",
    "assetPath": "characters/maru/motion/neutral.png"
  },
  {
    "id": "Graphic1002",
    "graphicType": "character",
    "editorName": "Maru 左眼閉眼圖",
    "assetPath": "characters/maru/facial_parts/left_closed.png"
  },
  {
    "id": "Graphic1003",
    "graphicType": "character",
    "editorName": "Maru 右眼閉眼圖",
    "assetPath": "characters/maru/facial_parts/right_closed.png"
  },
  {
    "id": "Graphic1004",
    "graphicType": "character",
    "editorName": "Maru 靜態立繪",
    "assetPath": "characters/maru/portraits/portrait.png"
  },
  {
    "id": "Graphic1005",
    "graphicType": "character",
    "editorName": "Pear chick neutral",
    "assetPath": "characters/pear_chick/portraits/neutral.png"
  },
  {
    "id": "Graphic1006",
    "graphicType": "character",
    "editorName": "Pear chick happy",
    "assetPath": "characters/pear_chick/portraits/happy.png"
  },
  {
    "id": "Graphic1007",
    "graphicType": "character",
    "editorName": "Pear chick surprised",
    "assetPath": "characters/pear_chick/portraits/surprised.png"
  },
  {
    "id": "Graphic1008",
    "graphicType": "character",
    "editorName": "Pear chick angry",
    "assetPath": "characters/pear_chick/portraits/angry.png"
  },
  {
    "id": "Graphic1009",
    "graphicType": "character",
    "editorName": "Pear chick pouting",
    "assetPath": "characters/pear_chick/portraits/pouting.png"
  },
  {
    "id": "Graphic1010",
    "graphicType": "character",
    "editorName": "Pear chick smirk",
    "assetPath": "characters/pear_chick/portraits/smirk.png"
  },
  {
    "id": "Graphic1011",
    "graphicType": "character",
    "editorName": "Pear chick avatar",
    "assetPath": "characters/pear_chick/avatar.png"
  },
  {
    "id": "Graphic1012",
    "graphicType": "character",
    "editorName": "Sophia full-body portrait",
    "assetPath": "characters/Sophia/portraits/portrait.png"
  },
  {
    "id": "Graphic1013",
    "graphicType": "effect",
    "editorName": "Sophia motion rig",
    "assetPath": "characters/Sophia/motion/rig.json"
  },
  {
    "id": "Graphic1014",
    "graphicType": "character",
    "editorName": "Sophia assembled neutral",
    "assetPath": "characters/Sophia/motion/neutral.png"
  },
  {
    "id": "Graphic1015",
    "graphicType": "character",
    "editorName": "Sophia layer backhair",
    "assetPath": "characters/Sophia/motion/layers/backhair.png"
  },
  {
    "id": "Graphic1016",
    "graphicType": "effect",
    "editorName": "Sophia depth backhair",
    "assetPath": "characters/Sophia/motion/depth/backhair_depth.png"
  },
  {
    "id": "Graphic1017",
    "graphicType": "character",
    "editorName": "Sophia layer legwear",
    "assetPath": "characters/Sophia/motion/layers/legwear.png"
  },
  {
    "id": "Graphic1018",
    "graphicType": "effect",
    "editorName": "Sophia depth legwear",
    "assetPath": "characters/Sophia/motion/depth/legwear_depth.png"
  },
  {
    "id": "Graphic1019",
    "graphicType": "character",
    "editorName": "Sophia layer footwear",
    "assetPath": "characters/Sophia/motion/layers/footwear.png"
  },
  {
    "id": "Graphic1020",
    "graphicType": "effect",
    "editorName": "Sophia depth footwear",
    "assetPath": "characters/Sophia/motion/depth/footwear_depth.png"
  },
  {
    "id": "Graphic1021",
    "graphicType": "character",
    "editorName": "Sophia layer earwear",
    "assetPath": "characters/Sophia/motion/layers/earwear.png"
  },
  {
    "id": "Graphic1022",
    "graphicType": "effect",
    "editorName": "Sophia depth earwear",
    "assetPath": "characters/Sophia/motion/depth/earwear_depth.png"
  },
  {
    "id": "Graphic1023",
    "graphicType": "character",
    "editorName": "Sophia layer bottomwear",
    "assetPath": "characters/Sophia/motion/layers/bottomwear.png"
  },
  {
    "id": "Graphic1024",
    "graphicType": "effect",
    "editorName": "Sophia depth bottomwear",
    "assetPath": "characters/Sophia/motion/depth/bottomwear_depth.png"
  },
  {
    "id": "Graphic1025",
    "graphicType": "character",
    "editorName": "Sophia layer neck",
    "assetPath": "characters/Sophia/motion/layers/neck.png"
  },
  {
    "id": "Graphic1026",
    "graphicType": "effect",
    "editorName": "Sophia depth neck",
    "assetPath": "characters/Sophia/motion/depth/neck_depth.png"
  },
  {
    "id": "Graphic1027",
    "graphicType": "character",
    "editorName": "Sophia layer handwear",
    "assetPath": "characters/Sophia/motion/layers/handwear.png"
  },
  {
    "id": "Graphic1028",
    "graphicType": "effect",
    "editorName": "Sophia depth handwear",
    "assetPath": "characters/Sophia/motion/depth/handwear_depth.png"
  },
  {
    "id": "Graphic1029",
    "graphicType": "character",
    "editorName": "Sophia layer topwear",
    "assetPath": "characters/Sophia/motion/layers/topwear.png"
  },
  {
    "id": "Graphic1030",
    "graphicType": "effect",
    "editorName": "Sophia depth topwear",
    "assetPath": "characters/Sophia/motion/depth/topwear_depth.png"
  },
  {
    "id": "Graphic1031",
    "graphicType": "character",
    "editorName": "Sophia layer ears",
    "assetPath": "characters/Sophia/motion/layers/ears.png"
  },
  {
    "id": "Graphic1032",
    "graphicType": "effect",
    "editorName": "Sophia depth ears",
    "assetPath": "characters/Sophia/motion/depth/ears_depth.png"
  },
  {
    "id": "Graphic1033",
    "graphicType": "character",
    "editorName": "Sophia layer face",
    "assetPath": "characters/Sophia/motion/layers/face.png"
  },
  {
    "id": "Graphic1034",
    "graphicType": "effect",
    "editorName": "Sophia depth face",
    "assetPath": "characters/Sophia/motion/depth/face_depth.png"
  },
  {
    "id": "Graphic1035",
    "graphicType": "character",
    "editorName": "Sophia layer eyebrow",
    "assetPath": "characters/Sophia/motion/layers/eyebrow.png"
  },
  {
    "id": "Graphic1036",
    "graphicType": "effect",
    "editorName": "Sophia depth eyebrow",
    "assetPath": "characters/Sophia/motion/depth/eyebrow_depth.png"
  },
  {
    "id": "Graphic1037",
    "graphicType": "character",
    "editorName": "Sophia layer nose",
    "assetPath": "characters/Sophia/motion/layers/nose.png"
  },
  {
    "id": "Graphic1038",
    "graphicType": "effect",
    "editorName": "Sophia depth nose",
    "assetPath": "characters/Sophia/motion/depth/nose_depth.png"
  },
  {
    "id": "Graphic1039",
    "graphicType": "character",
    "editorName": "Sophia layer mouth",
    "assetPath": "characters/Sophia/motion/layers/mouth.png"
  },
  {
    "id": "Graphic1040",
    "graphicType": "effect",
    "editorName": "Sophia depth mouth",
    "assetPath": "characters/Sophia/motion/depth/mouth_depth.png"
  },
  {
    "id": "Graphic1041",
    "graphicType": "character",
    "editorName": "Sophia layer eyewhite",
    "assetPath": "characters/Sophia/motion/layers/eyewhite.png"
  },
  {
    "id": "Graphic1042",
    "graphicType": "effect",
    "editorName": "Sophia depth eyewhite",
    "assetPath": "characters/Sophia/motion/depth/eyewhite_depth.png"
  },
  {
    "id": "Graphic1043",
    "graphicType": "character",
    "editorName": "Sophia layer irides",
    "assetPath": "characters/Sophia/motion/layers/irides.png"
  },
  {
    "id": "Graphic1044",
    "graphicType": "effect",
    "editorName": "Sophia depth irides",
    "assetPath": "characters/Sophia/motion/depth/irides_depth.png"
  },
  {
    "id": "Graphic1045",
    "graphicType": "character",
    "editorName": "Sophia layer eyelash",
    "assetPath": "characters/Sophia/motion/layers/eyelash.png"
  },
  {
    "id": "Graphic1046",
    "graphicType": "effect",
    "editorName": "Sophia depth eyelash",
    "assetPath": "characters/Sophia/motion/depth/eyelash_depth.png"
  },
  {
    "id": "Graphic1047",
    "graphicType": "character",
    "editorName": "Sophia layer fronthair",
    "assetPath": "characters/Sophia/motion/layers/fronthair.png"
  },
  {
    "id": "Graphic1048",
    "graphicType": "effect",
    "editorName": "Sophia depth fronthair",
    "assetPath": "characters/Sophia/motion/depth/fronthair_depth.png"
  },
  {
    "id": "Graphic1049",
    "graphicType": "effect",
    "editorName": "Sophia layered motion manifest",
    "assetPath": "characters/Sophia/motion/manifest.json"
  },
  {
    "id": "Graphic1050",
    "graphicType": "character",
    "editorName": "Sophia left eye base",
    "assetPath": "characters/Sophia/motion/eyes/base_left.png"
  },
  {
    "id": "Graphic1051",
    "graphicType": "character",
    "editorName": "Sophia left eye open",
    "assetPath": "characters/Sophia/motion/eyes/open_left.png"
  },
  {
    "id": "Graphic1052",
    "graphicType": "character",
    "editorName": "Sophia left eye white",
    "assetPath": "characters/Sophia/motion/eyes/white_left.png"
  },
  {
    "id": "Graphic1053",
    "graphicType": "character",
    "editorName": "Sophia left eye iris",
    "assetPath": "characters/Sophia/motion/eyes/iris_left.png"
  },
  {
    "id": "Graphic1054",
    "graphicType": "character",
    "editorName": "Sophia left eye lash",
    "assetPath": "characters/Sophia/motion/eyes/lash_left.png"
  },
  {
    "id": "Graphic1055",
    "graphicType": "character",
    "editorName": "Sophia left eye closed",
    "assetPath": "characters/Sophia/motion/eyes/closed_left.png"
  },
  {
    "id": "Graphic1056",
    "graphicType": "character",
    "editorName": "Sophia left eye mask",
    "assetPath": "characters/Sophia/motion/eyes/mask_left.png"
  },
  {
    "id": "Graphic1057",
    "graphicType": "character",
    "editorName": "Sophia right eye base",
    "assetPath": "characters/Sophia/motion/eyes/base_right.png"
  },
  {
    "id": "Graphic1058",
    "graphicType": "character",
    "editorName": "Sophia right eye open",
    "assetPath": "characters/Sophia/motion/eyes/open_right.png"
  },
  {
    "id": "Graphic1059",
    "graphicType": "character",
    "editorName": "Sophia right eye white",
    "assetPath": "characters/Sophia/motion/eyes/white_right.png"
  },
  {
    "id": "Graphic1060",
    "graphicType": "character",
    "editorName": "Sophia right eye iris",
    "assetPath": "characters/Sophia/motion/eyes/iris_right.png"
  },
  {
    "id": "Graphic1061",
    "graphicType": "character",
    "editorName": "Sophia right eye lash",
    "assetPath": "characters/Sophia/motion/eyes/lash_right.png"
  },
  {
    "id": "Graphic1062",
    "graphicType": "character",
    "editorName": "Sophia right eye closed",
    "assetPath": "characters/Sophia/motion/eyes/closed_right.png"
  },
  {
    "id": "Graphic1063",
    "graphicType": "character",
    "editorName": "Sophia right eye mask",
    "assetPath": "characters/Sophia/motion/eyes/mask_right.png"
  },
  {
    "id": "Graphic1064",
    "graphicType": "effect",
    "editorName": "Sophia registered blink manifest",
    "assetPath": "characters/Sophia/motion/eyes/manifest.json"
  },
  {
    "id": "Graphic1100",
    "graphicType": "background",
    "editorName": "Phone home wallpaper",
    "assetPath": "ui/phone/wallpaper.svg"
  },
  {
    "id": "Graphic1101",
    "graphicType": "icon",
    "editorName": "Phone contacts app",
    "assetPath": "ui/phone/contacts.svg"
  },
  {
    "id": "Graphic1102",
    "graphicType": "icon",
    "editorName": "Phone messages app",
    "assetPath": "ui/phone/messages.svg"
  },
  {
    "id": "Graphic1103",
    "graphicType": "icon",
    "editorName": "Phone video app",
    "assetPath": "ui/phone/video.svg"
  },
  {
    "id": "Graphic1104",
    "graphicType": "effect",
    "editorName": "Maru fullbody idle profile",
    "assetPath": "characters/maru/motion/fullbody_v1/manifest.json"
  },
  {
    "id": "Graphic1105",
    "graphicType": "character",
    "editorName": "Maru native fullbody source",
    "assetPath": "characters/maru/motion/fullbody_v2/neutral-native.png"
  },
  {
    "id": "Graphic1106",
    "graphicType": "effect",
    "editorName": "Maru native resolution idle profile",
    "assetPath": "characters/maru/motion/fullbody_v2/manifest.json"
  },
  {
    "id": "Graphic1107",
    "graphicType": "character",
    "editorName": "Maru native blink 25",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/blink-025.png"
  },
  {
    "id": "Graphic1108",
    "graphicType": "character",
    "editorName": "Maru native blink 50",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/blink-050.png"
  },
  {
    "id": "Graphic1109",
    "graphicType": "character",
    "editorName": "Maru native blink 75",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/blink-075.png"
  },
  {
    "id": "Graphic1110",
    "graphicType": "character",
    "editorName": "Maru native blink 100",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/blink-100.png"
  },
  {
    "id": "Graphic1111",
    "graphicType": "character",
    "editorName": "Maru blink screen-left closed lid",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/screen-left-closed-lid.png"
  },
  {
    "id": "Graphic1112",
    "graphicType": "character",
    "editorName": "Maru blink screen-right closed lid",
    "assetPath": "characters/maru/facial_parts/native_blink_v1/screen-right-closed-lid.png"
  },
  {
    "id": "Graphic1113",
    "graphicType": "character",
    "editorName": "Maru legacy expression screen-left lid",
    "assetPath": "characters/maru/facial_parts/native_smile_closed_v1/screen-left-closed-lid.png"
  },
  {
    "id": "Graphic1114",
    "graphicType": "character",
    "editorName": "Maru legacy expression screen-right lid",
    "assetPath": "characters/maru/facial_parts/native_smile_closed_v1/screen-right-closed-lid.png"
  },
  {
    "id": "Graphic1115",
    "graphicType": "character",
    "editorName": "Maru legacy smile closed portrait",
    "assetPath": "characters/maru/facial_parts/native_smile_closed_v1/closed.png"
  },
  {
    "id": "Graphic1116",
    "graphicType": "effect",
    "editorName": "Maru native idle and blink profile",
    "assetPath": "characters/maru/motion/fullbody_v3/manifest.json"
  },
  {
    "id": "Graphic1117",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink blink-025.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/blink-025.png"
  },
  {
    "id": "Graphic1118",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink blink-050.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/blink-050.png"
  },
  {
    "id": "Graphic1119",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink blink-075.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/blink-075.png"
  },
  {
    "id": "Graphic1120",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink blink-100.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/blink-100.png"
  },
  {
    "id": "Graphic1121",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink screen-left-closed-lid.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/screen-left-closed-lid.png"
  },
  {
    "id": "Graphic1122",
    "graphicType": "character",
    "editorName": "Maru accepted shadow-preserving blink screen-right-closed-lid.png",
    "assetPath": "characters/maru/facial_parts/native_blink_v2/screen-right-closed-lid.png"
  },
  {
    "id": "Graphic1123",
    "graphicType": "effect",
    "editorName": "Maru shadow-preserving native blink profile",
    "assetPath": "characters/maru/motion/fullbody_v4/manifest.json"
  },
  {
    "id": "Graphic1124",
    "graphicType": "character",
    "editorName": "Maru casual native source",
    "assetPath": "characters/maru/maru_casual.png"
  },
  {
    "id": "Graphic1125",
    "graphicType": "character",
    "editorName": "Maru casual static fallback",
    "assetPath": "characters/maru/motion/casual_v1/portrait.png"
  },
  {
    "id": "Graphic1126",
    "graphicType": "effect",
    "editorName": "Maru casual idle profile",
    "assetPath": "characters/maru/motion/casual_v1/manifest.json"
  },
  {
    "id": "Graphic1127",
    "graphicType": "effect",
    "editorName": "Maru casual inferred depth",
    "assetPath": "characters/maru/motion/casual_v1/depth.png"
  },
  {
    "id": "Graphic1128",
    "graphicType": "character",
    "editorName": "Maru accepted happy maru-happy-native.png",
    "assetPath": "characters/maru/facial_parts/happy_v1/maru-happy-native.png"
  },
  {
    "id": "Graphic1129",
    "graphicType": "character",
    "editorName": "Maru accepted happy portrait.png",
    "assetPath": "characters/maru/facial_parts/happy_v1/portrait.png"
  }
]);
const graphicsById = new Map(GRAPHIC_ASSETS.map((graphic) => [graphic.id, graphic]));
export function getGraphicAssetPath(id: string | null | undefined): string | null {
  if (!id) return null;
  const graphic = graphicsById.get(id);
  return graphic?.assetPath ?? null;
}
