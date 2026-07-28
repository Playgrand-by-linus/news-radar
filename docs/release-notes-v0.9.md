# v0.9 釋出說明

## 一句話 TL;DR

介面從"三個檢視各管一段"收斂成"一層資訊架構"：一套欄目 tab + 一個精選/全量開關 + 一條時間軸；同時給標題加了 LLM 增強，給同一事件加了多源展開，給資料來源加了可切換開關。

## 為什麼重構

v0.7、v0.8 各自加了一個板塊：伯樂精選、AI訊號流、熱點榜、TOP3 persona 網格，彼此平行存在但入口和心智模型不統一——使用者要先搞清楚"我現在在看哪個板塊"，才能決定"該看哪條"。

資訊架構收斂為單層模型：內容維度收進欄目 tab，密度維度收進精選/全量開關，剩下的只有一條時間軸。理解成本降下來了，板塊之間不用來回切。

## 新東西

**資訊架構**
- 單層分類 tab：全部/模型/產品/開發者/行業/論文/社群/自媒體，互斥單選
- 精選/全量全域性開關：精選讀故事合併後的高價值池，全量讀廣義 AI 相關的原始池，兩種模式共用同一套時間軸模板
- 主列表按時間倒序 + 按日分組，不再有獨立的"故事線"或"訊號流"板塊
- 雙檢視：根目錄預設手機版，右上角「視角」開關切到 `/classic/` 經典桌面版，`?view=` 引數可直接指定，兩套皮膚讀同一份 `data/`
- 正式域名：[news.learnprompt.pro](https://news.learnprompt.pro)（GitHub Pages 自定義域名 + Cloudflare）

**熱點與點評**
- 當前熱點榜不設固定條數，只要滿足多資訊來源熱度閾值就上榜
- 每條精選卡片帶一句話"推薦理由"——由Pipeline抓取全文後交給 LLM 真實生成（需 `DEEPSEEK_API_KEY`），沒有真實理由時區塊整體隱藏，不再用模板句撐場面
- 三口味 persona 的網頁展示暫時歸檔（樣式待重設計後迴歸，見 docs/ROADMAP.md）；資料Pipeline與 Skill 端日報的三口味點評照常，「論文警察」更名「較真黨」

**標題與翻譯**
- 標題增強：標題過短或行話過多時，抓取原文上下文（自家抓取失敗回退到 r.jina.ai）交給 LLM 改寫，配 `DEEPSEEK_API_KEY` 才生效，沒配就保留原標題
- `TITLE_ENHANCE_MAX_PER_RUN` 控制每次執行最多改寫多少條標題，預設 30
- 翻譯校驗：拒答文案（"抱歉，我無法……"）和退化輸出會被識別並回退到原文標題，不再汙染快取
- 時區防禦：中文 feed 把北京時間錯標成 GMT（如 InfoQ CN）導致的"未來條目"會被自動糾正（條目級 + feed 級 -8h 推斷 + story 層未來時間鉗制）

**同一事件與資訊來源**
- 同一事件被 2 家以上資訊來源報道時，卡片上出現"多源 N"標籤，點開看每家獨立標題、來源和相對時間
- 聚合源條目按原始平臺再細分：X / 公眾號 / HN / RSS 子來源標籤
- 修了故事合併邏輯裡的幾處誤合併/漏合併
- X 搜尋排序從 Latest 換成 Top，減少低質量結果佔位

**資料與開發**
- 資料同源開關：頁面 URL 加 `?data=<data目錄地址>` 可以讓前端讀取另一份 `data/`，方便驗證另一個分支或 PR 的生成結果，選擇記在瀏覽器本地
- 來源面板排除重複：高階篩選裡的來源列表不再有重複條目

## 變化與去向對照表

| 舊的 | 現在 |
|------|------|
| 三檢視（伯樂精選 / AI訊號流 / 熱點榜切換） | 精選/全量全域性開關 + 時間軸 |
| 排序按鈕（按時間/按熱度手動切換） | 主列表固定按時間倒序，熱度只在獨立的"當前熱點"榜體現 |
| 來源形態 chips（自媒體/社群手動分類） | 收進"社群"/"自媒體"欄目 tab + 聚合源子來源 chip |
| 統計條 | 源狀態橫幅（高階篩選裡的源健康/源狀態詳情） |

## 相容性

- `data/*.json` 只增欄位不刪改，fork 使用者和 Skill 使用者無感升級，不需要改任何指令碼或解析邏輯
- 舊版介面快照保留在 `/legacy/`，保留至 2026 年 8 月中旬後下線
- 新增的 `DEEPSEEK_API_KEY` 相關能力（標題增強）複用已有的可選 key，沒配置的 fork 不受影響，繼續按原有降級路徑跑

---

## English summary

v0.9 collapses three parallel views (Scout Picks / AI Signal Flow / Hot board) into one layer: category tabs × curated/all toggle × a single chronological timeline. It adds LLM title enhancement (gated by `DEEPSEEK_API_KEY`, capped by `TITLE_ENHANCE_MAX_PER_RUN`, graceful fallback to original titles without a key), same-event multi-source expansion via an "N sources" chip, aggregator sub-source classification (X/WeChat/HN/RSS), a `?data=` data-source switch for multi-branch development, several story-merge fixes, and an X search sort change from Latest to Top. `data/*.json` only gains fields — never removes or renames them — so forks and Skill users upgrade with no action needed. The pre-v0.9 UI is archived at `/legacy/` until mid-August 2026.
