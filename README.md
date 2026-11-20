# WordiOS v2.3 · 文件轉 Markdown

在 iPhone / 瀏覽器上把 Word、Excel、PPT、PDF 轉成乾淨的 Markdown。
一般轉檔**全部在瀏覽器端處理，檔案不會上傳**；只有掃描檔、照片才會經由 arcar Worker 送給 Claude 做 AI 辨識。

## 支援格式

| 格式 | 引擎 | 說明 |
| --- | --- | --- |
| .docx | mammoth.js + turndown | 標題、粗斜體、清單、表格（含儲存格換行）、可選保留圖片 |
| .xlsx / .xls / .xlsm / .ods / .csv | SheetJS | 每個工作表一個表格，自動去除空列空欄；CSV 自動判斷 UTF-8 / Big5 |
| .pptx | 自寫 OOXML 解析（JSZip） | 依實際投影片順序、標題、多層項目符號、表格、講者備註 |
| .pdf | pdf.js | 依字級判斷標題、依行距合併段落、移除重複頁首頁尾、修正康熙部首字 |
| .html / .txt / .md | turndown / 直接讀取 | |
| 掃描型 PDF / 文件照片（jpg・png・heic） | Claude Vision（arcar `/v1/messages`） | 頁面在手機上畫成 1568px JPEG，每 4 頁一批、同時送 2 批；結果存在 IndexedDB，同檔案不重複計費 |
| 剪貼簿 | turndown | 從 Word、Pages、網頁複製後按「貼上轉換」 |

不支援：舊版 .doc / .ppt（請另存為 .docx / .pptx）。

## 架構

```
index.html   單檔 App（UI + 所有轉換器）
sw.js        網頁 network-first、CDN 元件 cache-first
manifest.json + PNG 圖示（iOS 主畫面用 apple-touch-icon.png）
```

- 轉換元件從 jsDelivr / SheetJS CDN **依需要才載入**，所以首次開啟很快。
- 選項裡的「下載離線轉檔元件」會預先快取全部元件，之後可以離線轉檔。
- 更新 App 時，把 `sw.js` 的 `VERSION` 改掉即可。

## AI 辨識（OCR）

- 預設呼叫 `https://arcar.kftseng2oo1.workers.dev/v1/messages`，模型 `claude-sonnet-5-5`，可在「選項」修改
- arcar 直接轉送到 Anthropic Messages API，**Worker 不需要修改**
- 觸發時機：PDF 幾乎沒有文字層（自動）、選項勾「PDF 一律用 AI 辨識」、選擇圖片檔

## Windows / Android 整合（Edge、Chrome 安裝後）

- **右鍵「以 WordiOS 開啟」**：manifest `file_handlers`，支援 docx / xlsx / xls / csv / ods / pptx / pdf，檔案經 `launchQueue` 送進 App
- **「分享到 WordiOS」**：manifest `share_target`，Service Worker 攔下 `POST ./share-target`，把檔案暫存在 Cache Storage 後轉到 `index.html?share=1` 處理
- iOS Safari 不支援以上兩項，iPhone 請從「檔案」App 存檔後再選取

## iOS 細節

- 輸入框字體 16px，避免點擊時畫面自動放大
- 手機上「儲存 .md / .zip」走系統分享選單（可存到「檔案」App），桌機則直接下載
- `accept` 同時列副檔名與 MIME，避免 iOS 檔案選擇器把 docx / pptx 變灰
