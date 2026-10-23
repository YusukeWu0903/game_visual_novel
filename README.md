# Game Project

這是一個使用 AI 輔助開發的視覺小說遊戲。

2026-10-23：已接入明日之星的對話播放器與動態立繪。進入 `web-visual-novel` 執行 `npm run dev`，首頁可選三段示範；`/legacy.html` 保留霞／劍舞舊版。執行 `npm test` 驗證分支、讀檔與素材，`npm run build` 產生正式版本。

來源與維護限制請看 [對話系統移植說明](docs/stardom-dialogue-import.md)。

2026-10-24：首頁已加入六位動態角色的隨機交叉淡化輪播；左側選單固定，可用右下圓點選角。詳見 [陪伴式首頁](docs/companion-home.md)。

## 目錄結構
- `assets/`: 存放遊戲資源（圖像、音樂、音效等）。
- `scripts/`: 存放遊戲腳本與程式碼。
- `docs/`: 存放遊戲設計文檔與相關說明。
