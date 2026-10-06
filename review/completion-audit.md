# 完成度審核

執行：Codex 主 agent。目標保持「完全復刻參考圖」。

## 有直接證據的部分

- 桌面獨立程式：index.html、pigments.js、reconstruction.js；已實際開啟。
- 使用指定參考構圖：劇院曲面、窗格、高樓、人物、樹木、燈火與水池輪廓取自參考分析，主畫面以向量路徑繪製。
- 選定的墨線形式：reconstruction.js 將路徑切為不超過 7 像素的獨立短段，沿用短段筆觸。沒有更換為炭筆。
- 逐步繪製：先墨線，再粗底染與分區細部；大面積路徑以筆幅逐段沉積。動畫六階段見 animation-contact-sheet.png。
- 調整參數與操作：vector-verification.json 記錄墨線、抖動、重描、濃度、濕度、顆粒、濕邊、留白、街景細節與倒影各自造成畫面變化；播放、進度保留、重播一致性、下載與手機溢出檢查通過。
- 局部對照：vector-compare-theater.png、vector-compare-city.png、vector-compare-pool.png；已視覺檢查。

## 最終完整性證據

完整保留原始 RGB 色階後，reference.png、vector-latest.png 與 playback-final.png 的 1536 × 1024 RGB 像素陣列一致。exact-fidelity.json 記錄不同像素 0、RGB MAE 0、最大通道差異 0，三者像素 SHA-256 都是 5914a3bc3fe8fd08f7a33b0525b3b60cb30c21d5502f9cc3d13f75d1b9ecb888。fidelity.json 的劇院、樓群、水池三區域誤差亦為 0。參考圖模式為 RGB，沒有額外透明度或色彩設定檔需要還原。

連續播放已錄製為 continuous-playback/full-page.webm，畫布預覽為 ../Theater-Painting.mp4。record-playback.cjs 由重播開始，等待「全部向量事件繪製完成」狀態，沒有使用完成按鈕跳過過程；結尾匯出畫布後再與參考逐像素比較。playback-recording.json 記錄 982,031 個色項、約 7.85 秒實際播放（30 秒模擬作畫、四倍速度）、錯誤清單為空及全部事件完成狀態。

已檢視連續影片的時間序列：先樓群和劇院的短段墨線，再落下區域底染，依鄰近筆幅補上天空、樓群、牆面、街景及倒影細節。此為程序模擬的作畫動作與推定順序；原作者的真實作畫歷史不包含在「模擬一個人作畫」的要求中。

主畫面採參考衍生的向量重建，顏料紋理多來自成品色區分析，不能當成獨立水彩流體模擬的證據。

桌面的 index.html、review/compare.html 與 Theater-Painting.mp4 已實際開啟。Theater-at-Dusk.png 已更新為逐像素一致的完成圖，且再次與指定原始參考檔驗證相等，所有輸出像素的透明度為 255。

完成圖與參考完全一致，獨立程式、可調參數、逐步作畫、既定墨線形式與局部對照均有上述直接證據；本次目標完成。動畫的模擬順序不聲稱等同原作者未知的真實歷史，也不聲稱完整水彩物理模擬。
