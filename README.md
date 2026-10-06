# 劇院黃昏・向量精細重建

製作與驗證：Codex 主 agent。

直接開啟 index.html，可離線使用，不需要 API。

完整歷程比較：review/history.html；總覽圖：review/history-overview.png。共 29 個階段，包含照片、指定水彩參考、早期原圖顯現與程序試作、濕材質、墨線／炭筆比較、手工七輪、向量與色階改進，以及完成版作畫進度。

此倉庫以 Git LFS 保存 pigments*.js。下載程式請使用 `git clone` 並執行 `git lfs pull`，取得向量資料實體檔案；GitHub 的一般 ZIP 下載可能只有 LFS 指標檔。

## 現在的重建方法

新版主畫面是 index.html + pigments.js + reconstruction.js。先離線分析參考圖的暗部墨線、連通色區與顆粒輪廓，再編譯成向量資料逐筆繪製。主畫面不載入、遮罩或逐步顯示原始點陣圖片。

完成版保留完整原始 RGB 色階，共 982,031 個按主題分組的顏料色項，移除色彩量化差異。四倍精度向量渲染在預設參數下，按鈕完成圖與自然播放完成圖都與 1536 × 1024 參考圖逐像素一致。review/exact-fidelity.json 記錄兩者 RGB 差異均為 0，像素資料 SHA-256 與參考相同。

這是「由參考圖衍生的向量重建」，細部紋理主要來自成品色區分析，不是與原圖無關的程序生成，也不是完整水彩物理模擬。動畫順序與筆觸分組是推定的；完成圖已復刻，動畫提供模擬作畫過程，並未取得原作者的實際作畫歷史。

先短段墨線，再沉積大面積底染與細部色區。樓群和劇院以縱向筆幅、天空和水池以橫向筆幅繪製。附近同色微粒合併成乾筆沉積，避免每粒紋理被當成一次落筆。墨線先樓群、劇院、街景再倒影；細部用連續的鄰近空間順序繪製，減少遍布整區的顆粒同步浮現。

13 個控制項仍可調整。街景細節控制細小色區密度，並非精確的人數生成器。預設參數最接近參考，調整參數會改變重建結果。

## 先前手工重構（hand-authored.html）

- 以 1536 × 1024 參考構圖校準劇院的四個曲面、高樓、地面、主要人物及水池。
- 建築輪廓與主要人物錨點定義於 geometry.js，供後續逐區修正。
- 沿用使用者選定的短段墨線筆觸，未套用炭筆或連續施力版本。
- 天空採連續濕染；高樓分為灰藍立面、側面及屋頂窗光。
- 玻璃分開生成留白、暖色窗格及深色橫樑。
- 曲面牆以灰紫、赭色分區疊染；樹木使用碎葉筆觸。
- 人物以頭部、衣服、手臂、腿與步態組合，不使用原圖像素。
- 水池使用分段剪切的生成倒影、深藍灰覆染、局部碎線和預留紙白。
- 保留 13 個參數、重播、進度拖曳、全螢幕與 PNG 下載。

## 對照與迭代

review/compare.html 提供劇院、高樓和水池三組相同裁切範圍對照，可切換渲染版本。
review/painting-pass-1.png 至 painting-pass-7.png 保存本輪渲染結果。
第五輪顆粒過粗出現像素塊感，第六輪已回調，第七輪補上外緣與紙白。
先前的作畫工具 hand-authored.html 只載入 geometry.js 與 painting.js；新版 index.html 只載入 pigments.js 與 reconstruction.js。

本版仍是程序速寫重構，人物、植被與水彩顏料行為較參考圖簡化。
渲染採分區色層、程序肌理和濕邊近似，並非完整物理流體或論文復現。

## 新版比較與驗證

review/compare.html 預設顯示向量重建，亦可切回手工版本。
review/fidelity.json 記錄 RGB 平均絕對差異與三區域量化結果；此指標只評估靜態色差，不能證明畫法真實。
review/vector-verification.json 記錄瀏覽器錯誤、載入檔案、重播一致性、參數變化、進度保留與手機版溢出檢查。
迭代記錄：vector-first.png、vector-second.png、vector-third.png、vector-latest.png。
上一輪全域 256 色版本保存在 vector-global-palette.png 與 pigments-global-palette.js；分區 1,280 色資料保存在 pigments-regional-palette.js。
review/animation-contact-sheet.png 保存 17%、35%、50%、70%、85% 與 100% 的作畫階段，維持原始構圖比例。
Theater-Painting.mp4 是完成版的畫布播放預覽，錄自實際運行的程式。review/playback-recording.json 記錄全事件繪製完成狀態、色票數量、錯誤清單及約 7.85 秒實際播放時間（30 秒模擬作畫、四倍速度）。review/playback-final.png 是該次自然播放結尾的原始尺寸畫布。

重編譯：`.analysis-venv/bin/python vectorize.py`；瀏覽器驗證：`node verify.cjs`；誤差計算：`.analysis-venv/bin/python compare_metrics.py`。
分析環境使用 NumPy、OpenCV 與 Pillow；verify.cjs 使用本機 cinematic-portfolio 專案的 Playwright。

預設參數的完成圖已與參考圖逐像素一致；變更濃度、墨線、留白等參數後，畫面會依所選效果改變。完整完成度審核見 review/completion-audit.md。
