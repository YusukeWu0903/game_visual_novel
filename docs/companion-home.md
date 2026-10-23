# 陪伴式首頁（2026-10-24）

使用者採用交叉淡化，並納入 Maru、Sophia、Eris、Miffy、Mimi、Natasha 六位。首頁沿用原背景及青綠色系，選單固定在左側，右側角色原地淡入／淡出；沒有新增角色滑入、跟隨滑鼠或自動表情設計。

## 行為

- 隨機洗牌，每輪涵蓋六位，輪與輪之間不緊接重複；停留時間 12–18 秒，切換 1.5 秒。
- 交叉起點 A=1/B=0，中間 A=.5/B=.5，終點 A=0/B=1。只有角色透明度改變，選單位置固定。
- 六個小圓點可手動選角，之後恢復隨機輪播。
- 下一位載入成功、完成首幀後才切換；失敗保留目前角色，下一輪再選。
- 通常只保留當前與預載角色兩個呈現容器；預載完成後暫停動畫，交叉期間兩位都播放，結束移除上一位。
- 進入遊戲、隱藏分頁或離開時清除首頁呈現；回到首頁重新啟動。背景分頁不累積輪播計時。
- 系統偏好減少動態時改用直接替換，避免交叉動畫。

## 來源與品質

- Maru、Sophia 使用本作已匯入的 `MaruIdleMotion` 與 `LayeredPortraitMotion`。
- Eris、Miffy v50、Mimi v95 沿用 `my-portfolio/public/` 已有展示包。
- Natasha 使用 `auto_layering_pipeline` 的 `motion_v62_casual02_rb_leg`。來源仍是美術待目視確認的候選；本次能載入不代表舊美術問題均已驗收或完成正式角色發佈。
- 展示包保留原本圖層、眼部、材質與原生紋理，沒有降低原始解析度或修改 rig。只改宿主路徑、透明背景、隱藏製作控制面板、生命週期暫停，以及首頁取景。Maru 提高顯示位置，Eris 以宿主縮放校正畫布留白；不改角色本身。
- 新增四位展示包約 50 MB（磁碟上，包含 manifest 引用鏈）；瀏覽器不會一次載入全部角色。沒有連線外部原專案服務。
- 匯入基準 `public/companions/sources.json`；首次匯入工具 `scripts/import-home-companions.mjs` 有覆寫保護。來源修改不會自動同步本作。

## 維護與對照

`public/stardom/companion-home.js` 管理生命週期與切換；`companion-roster.js` 管理六位角色、隨機與透明度規則；`public/companions/embed-viewer.js` 是展示包宿主接頭。製作面板只在 `?home-review=1` 顯示，可固定任意兩位與 0／25／50／75／100% 作比較，正常首頁不顯示。

本輪前版首頁的 index.html、integration.css 與 app.js 保存在 `D:/Codex/visualizations/2026-10-24/companion-home/before/`。舊版對話的 `/legacy.html` 亦仍可使用。

## 驗證紀錄

- `npm test` 13/13：既有對話9項、新增六位入口、100輪洗牌不重複、時間與透明度端點、Natasha exact assembly hash／16層引用。
- `npm run build` 成功，正式預覽使用 `http://127.0.0.1:4174/`。
- 瀏覽器逐一載入六位，目視人物透明背景與構圖；檢查來源仍是各自角色，無素材錯誤。
- Maru→Sophia 固定0%、50%、100%、回0%目視及DOM透明度核對；選單保持原位。
- 進入遊戲後首頁 iframe 數為0，對話正常開始。
- 正常模式實際觀察到 Maru 自動換成 Sophia；844×390 橫向首頁目視通過，選單沒有被角色遮擋。最終頁面 error／warn 為空。
- 原角色專案 `python quality_contract.py` 通過：production quality contract保持鎖定。未修改原角色專案／作品集。
- 角色美術及首頁構圖仍待使用者實際確認；不以機器檢查代替使用者驗收。

截圖與對照保存在 `D:/Codex/visualizations/2026-10-24/companion-home/`。
