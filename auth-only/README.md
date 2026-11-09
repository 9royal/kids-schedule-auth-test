# 獨立 Google 登入測試
只測試 Firebase Google 登入、資訊一致性及登出。不是作息規劃器，不包含學生資料、課表或資料庫功能。公開頁面沒有使用者白名單，其他成人亦可能使用；前端檢查不是後端授權機制。

## 隱私與限制
本頁不輸出電子郵件、姓名、頭像、UID、token 或原始錯誤。Google/Firebase 仍會處理登入資料，Firebase 可能保留 Auth 帳號紀錄。登出不刪除帳號，也不登出其他 Google 網頁。只使用 inMemoryPersistence。不要使用學生帳號。

## 使用
成人確認揭露內容後按開始，自行挑選同意測試的帳號。成功必須同時通過 Google provider、已驗證電子郵件、UID/sub/user_id、aud/issuer 一致性檢查與 signOut。登出失敗時不能顯示成功，可按重試登出。結果不證明任何資料庫存取權。
本頁只檢查 SDK 回傳資訊的一致性，不在瀏覽器驗證 JWT 簽章，也不提供後端授權。信任來源是透過 TLS 取得的 Firebase 服務登入回應。

## 建置
在已安裝 Firebase 10.x、Vite 5.x、TypeScript 5.x 的專案內：
- node --test auth-only/test.mjs
- tsc --project auth-only/tsconfig.json
- vite build --config auth-only/vite.config.mjs

AUTH_ONLY_CONFIG_JSON 缺省產生鎖定頁。啟用時必須提供 JSON，僅包含 activation、projectId、appId、apiKey、authDomain、appOrigin；activation 必須為 APPROVED_AUTH_ONLY_TEST。公開 Firebase Web SDK 設定不是管理憑證。不可放入私鑰或 token。沒有網址參數或瀏覽器儲存的設定覆寫。
設定須符合程式中已核對的專案/app/origin；執行來源僅允許 https://9royal.github.io。來源路徑使用相對資源，不依賴既有作息網站。

## 安全邊界與待驗證
獨立入口僅載入 firebase/app、firebase/auth 及其必要依賴；建置時逐一檢查 module graph。禁止資料庫、Storage、Analytics、舊應用程式、service worker、外部圖片或字型。module-audit.json 為不含本機路徑的模組清單。無 source map。
GitHub Pages 的 meta CSP 限制連線至指定 Auth API、Google API script 和 Firebase Auth iframe。meta CSP 無法提供 frame-ancestors 防護。CSP 不提供跨來源 Google/Firebase 視窗內的控制。
真實網頁的 OAuth popup、允許網域、CSP 相容性、取消/關閉、重試及自動登出仍須在發布後人工驗證。離線測試不可證明真實登入成功。
沒有新增授權條款或代表使用者選擇開源授權。

## 本次驗證
- Auth-only 單元與邊界測試 48/48 通過，TypeScript 檢查通過。
- 實際建置版本：Firebase 10.14.1、Vite 5.4.21、TypeScript 5.9.3。
- 缺設定鎖定版不包含 Firebase SDK；已設定版僅有 15 個允許的建置模組。
- 本套件未產生依賴鎖定檔，重新安裝的轉移依賴可能不同；已附可直接靜態託管的本次建置產物。
- 建置要求輸出目錄為空，避免混入舊檔。可指定 AUTH_ONLY_OUTPUT 為新的輸出目錄（相對於 auth-only）。
- 恢復 bfcache 時重新載入頁面，避免延續過時狀態。關閉或離開頁面的非同步登出只能盡力執行，沒有完成證據就不能視為已登出。
- 真實 Google 登入、OAuth 提示、CSP 運作、登出仍待實際發布後測試，未宣稱已通過。
- 原始 Ro 標誌素材暫無法取得，未使用替代重繪圖。
