# AI News Radar — 配置與引數手冊 (Config Reference)

> 適用檔案:`scripts/update_news.py`、`.github/workflows/update-news.yml`
>
> **核心原則:** 除了 **API 金鑰**(必須放 GitHub Secrets),幾乎所有可調引數都已寫程序式碼常量。改一行常量即可,**不用再去 GitHub 配變數**。
>
> 下面每一項都標了「**改哪裡**」=「檔案 + 常量名(約第幾行)」。⚠️ 行號會隨程式碼改動漂移,**請以「常量名」為準**,在檔案裡搜尋常量名最穩妥。

---

## 1. 一分鐘總覽(給老闆看)

系統每 30 分鐘自動抓取過去一段時間的 AI 資訊,來源包括官方源、AI 媒體、RSS 訂閱,以及三個**付費社交源**(X、抖音、小紅書)。當前生效的關鍵設定:

| 維度 | 當前值 | 含義 |
|---|---|---|
| 執行頻率 | **每 30 分鐘** | GitHub Actions 定時任務 |
| 付費源開關邏輯 | **有 key 就自動開** | 金鑰在 = 抓取;`ENABLED=0` = 急停 |
| 每個付費源每日上限 | **20 條/天** | 成本保護 |
| 抖音 / 小紅書 — 排序 | **最多點贊** | |
| 抖音 / 小紅書 — 時間窗 | **最近 4 天** | |
| 抖音 / 小紅書 — 筆記型別 | **不限**(影片+圖文+直播) | |
| 抖音 / 小紅書 — 關鍵詞 | AI 相關詞 | `AI, 人工智慧, LLM, OpenAI, Claude, Agent, AI工具` |
| X(SocialData)— 內容 | 中英 AI 關鍵詞 + KOL 精選列表 | |

---

## 2. 資料來源開關邏輯(以 API key 為主)

**規則:有金鑰就自動抓;`ENABLED=0` 是急停開關;沒金鑰永不抓。**

| 情況 | 結果 |
|---|---|
| 有 key,`ENABLED` 沒設 | ✅ 自動抓取(預設開) |
| 有 key,`ENABLED=0` | ⛔ 急停(連 FORCE_RUN 也壓不過) |
| 沒 key | ⛔ 永不抓取 |

- **改哪裡(邏輯本身):** `scripts/update_news.py` → 函式 `env_flag_default`(約第 3017 行)。一般不用動。
- **急停某個源:** 去 GitHub → Settings → Secrets and variables → Actions → Variables,把 `SOCIALDATA_ENABLED` / `TIKHUB_ENABLED` / `X_API_ENABLED` 設成 `0`。

---

## 3. 抖音(TikHub Douyin)引數

| 引數 | 當前值 | 可選值 | 改哪裡(常量名) |
|---|---|---|---|
| 排序 | 最多點贊 | `0`=綜合 `1`=最新 `2`=最多點贊 | `TIKHUB_DOUYIN_SORT_TYPE`(約 223 行) |
| 時間窗(API 檔位) | 一週內 | `0`不限 `1`一天內 `7`一週內 `180`半年內 | `TIKHUB_DOUYIN_PUBLISH_TIME`(約 224 行) |
| **真實時間窗** | **最近 4 天** | 任意天數(整數) | `TIKHUB_RECENCY_DAYS`(約 219 行) |

> ⚠️ **關於「4 天」:** 抖音/小紅書的釋出時間篩選**只有** 不限/一天內/一週內/半年內 這幾檔,**沒有「4 天」這一檔**。所以我們讓 API 取最接近的「一週內」,再在程式碼裡精確砍到 4 天(`TIKHUB_RECENCY_DAYS`)。想改成 3 天 / 5 天,只改這一個數字即可,兩個平臺同時生效。

---

## 4. 小紅書(TikHub Xiaohongshu)引數

| 引數 | 當前值 | 可選值 | 改哪裡(常量名) |
|---|---|---|---|
| 排序 | 最多點贊 | `popularity_descending`=最多點贊/最熱 · `time_descending`=最新 · `general`=綜合 | `TIKHUB_XHS_SORT`(約 230 行) |
| 筆記型別 | 不限 | `不限` / `影片` / `圖文` | `TIKHUB_XHS_NOTE_TYPE`(約 231 行) |
| 時間窗(API 檔位) | 一週內 | `不限` / `一天內` / `一週內` / `半年內` | `TIKHUB_XHS_TIME_FILTER`(約 232 行) |
| **真實時間窗** | **最近 4 天** | 同抖音,共用 | `TIKHUB_RECENCY_DAYS`(約 219 行) |

> ⚠️ **待確認:** 小紅書「最多點贊」的排序代號我設的是 `popularity_descending`(最可能值),但 TikHub 官方檔案是動態網頁、抓不到原文,我沒能 100% 實測。**本地用你的 key 跑一次確認即可**:
> ```
> python scripts/probe_tikhub.py --platforms xiaohongshu --max-results 5
> ```
> 看輸出裡 `diagnostics.requests` 的 `request_error_count` 是否為 0、有沒有小紅書條目回來。若被拒,把 `TIKHUB_XHS_SORT` 改成 `"最多點贊"` 再試。程式碼是分介面容錯的,就算這個值不對也不會讓整個源崩。
>
> **搜尋範圍(已看過/未看過/已關注)和 位置距離(同城/附近)** 是小紅書 App 裡繫結登入賬號和定位的個性化篩選,**TikHub 公共 API 不開放**,所以是「不限」=我們根本不傳送這兩個引數,無需配置。

---

## 5. 抖音 / 小紅書 共用引數

| 引數 | 當前值 | 改哪裡(常量名) |
|---|---|---|
| 搜尋關鍵詞 | `AI,人工智慧,LLM,OpenAI,Claude,Agent,AI工具` | `TIKHUB_DEFAULT_QUERY`(約 210 行) |
| 抓哪些平臺 | `douyin,xiaohongshu` | `TIKHUB_DEFAULT_PLATFORMS`(約 211 行) |
| 每日上限(條) | 20 | `TIKHUB_DEFAULT_MAX_RESULTS`(約 212 行) |
| 真實時間窗(天) | 4 | `TIKHUB_RECENCY_DAYS`(約 219 行) |

---

## 6. X / Twitter(SocialData)引數

SocialData 同時跑兩路:① 中英關鍵詞搜尋發現新聲音;② 一個精選 KOL 列表(按賬號身份穩定追蹤,自動過濾轉推/回覆/機器人)。

| 引數 | 當前值 | 改哪裡(常量名) |
|---|---|---|
| 關鍵詞搜尋 query | 中英 AI 詞(見下) | `SOCIALDATA_DEFAULT_QUERY`(約 197 行) |
| 關鍵詞搜尋每日上限 | 20 | `SOCIALDATA_DEFAULT_MAX_RESULTS`(約 198 行) |
| KOL 列表 ID | `1695376776867062037` | `SOCIALDATA_LIST_ID_DEFAULT`(約 204 行) |
| KOL 列表每次最多取 | 50 | `SOCIALDATA_LIST_DEFAULT_MAX_RESULTS`(約 205 行) |
| KOL 列表排除賬號 | 無 | `SOCIALDATA_LIST_DEFAULT_EXCLUDE`(約 206 行,逗號分隔 handle) |
| 時間窗(最近 N 天) | 最近 4 天 | `SOCIALDATA_RECENCY_DAYS`(約 212 行) |
| KOL 列表分頁硬上限 | 10 頁 | `SOCIALDATA_LIST_MAX_PAGES`(約 209 行) |

> 成本口徑(已修正):SocialData 一次跑兩路——搜尋(≤20)+ KOL 列表(≤50),所以每次最多約 **70 次讀取**,成本上限已把列表算進去。計費按**實際讀取的原始推文數**(列表會丟掉轉推/回覆,原始讀取數 > 入庫數);分頁有 10 頁硬上限,防止失控扣費。

> 當前關鍵詞:`(AI OR "artificial intelligence" OR LLM OR "large language model" OR 人工智慧 OR LLM OR 大語言模型 OR AIGC OR Agent OR Agent) (lang:en OR lang:zh) -filter:retweets`

---

## 7. X API(官方介面,預設未用)

官方 X API 預設關閉(沒配 `X_BEARER_TOKEN`)。引數:`X_API_DEFAULT_QUERY`(約 192 行)、`X_API_DEFAULT_MAX_RESULTS`(約 193 行)。

---

## 8. 抓取量、排程與成本

| 引數 | 當前值 | 改哪裡 |
|---|---|---|
| 執行頻率 | 每 30 分鐘 | `.github/workflows/update-news.yml` → `cron: "*/30 * * * *"`(第 6 行) |
| 付費源執行間隔 | 24 小時一次 | `PAID_SOURCE_DEFAULT_INTERVAL_HOURS`(約 188 行) |
| 主時間窗 | 24 小時 | workflow 裡 `--window-hours 24`(命令列引數) |
| 歸檔保留 | 21 天 | workflow 裡 `--archive-days 21` |
| SocialData 每次最多讀取 | ~70 條(搜尋 20 + 列表 50) | `SOCIALDATA_DEFAULT_MAX_RESULTS` / `SOCIALDATA_LIST_DEFAULT_MAX_RESULTS` / `SOCIALDATA_LIST_MAX_PAGES` |

> 付費源雖然每 30 分鐘有機會跑,但「24 小時間隔門」保證每天只真正花一次錢。

---

## 9. GitHub 上還需要配什麼(只剩金鑰 + 急停開關)

程式碼裡搞不定、**必須**留在 GitHub 的,只有這些:

**Secrets(金鑰,絕不能寫程序式碼):**
`SOCIALDATA_API_KEY`、`TIKHUB_API_KEY`、`X_BEARER_TOKEN`、`AGENTMAIL_API_KEY`、`AGENTMAIL_INBOX_ID`、`FOLLOW_OPML_B64`

**Variables(可選,只當急停開關用):**
`SOCIALDATA_ENABLED`、`TIKHUB_ENABLED`、`X_API_ENABLED` —— 不設=預設開;設 `0`=關。

其餘所有調參(query / 排序 / 時間窗 / 每日上限 / 間隔 / 平臺)**全部已搬程序式碼常量,GitHub 上不用再配**。

---

## 10. Top 3 / 伯樂精選 是怎麼挑的

「Top Signals(今日 Top 3)」**不是**從該欄目的全部候選裡選,而是從一個全站統一、**最多 20 條**的精選「故事池」(`data/daily-brief.json`)裡,再篩到當前欄目。這就是為什麼自媒體/研究欄目有時只顯示 1 條——它們大多是單來源、低分,進不了這 20 條。

**入選門檻**(`story_passes_brief_gate`,理念是"寧缺毋濫"):一條故事要進精選池,必須滿足其一:
- **來源數 ≥ 2**(多源印證),或
- **評分 ≥ 0.72**(`BRIEF_SCORE_GATE`,約 4721 行)

**評分公式**(`calculate_item_importance`):
`分 = 編輯權重×0.3 + 來源層級×0.22 + AI相關×0.2 + 新近度×0.18 + 熱度×0.1`
來源層級權重:官方 1.0 > AI HOT 0.78 > 自媒體(抖音/小紅書)0.48 > X 0.45。自媒體單條很難過線,所以 Top 3 裡少。

**想讓自媒體/研究 Top 3 更滿**:可調低門檻 `BRIEF_SCORE_GATE`,或改前端邏輯(`assets/app.js` 第 ~1529 行)在精選故事不足 3 條時用本欄目自有內容補齊。(此項尚未實施,需要的話可單獨做。)

---

## 11. 「我想改 X」速查表

| 我想… | 改這裡 |
|---|---|
| 改抖音/小紅書的**時間窗**(天數) | `TIKHUB_RECENCY_DAYS`(約 219 行)一個數字 |
| 改抖音/小紅書的**排序** | `TIKHUB_DOUYIN_SORT_TYPE` / `TIKHUB_XHS_SORT` |
| 改抖音/小紅書**只要圖文或只要影片** | `TIKHUB_XHS_NOTE_TYPE`(小紅書);抖音改 `content_type` |
| 改抖音/小紅書**搜尋關鍵詞** | `TIKHUB_DEFAULT_QUERY`(約 210 行) |
| 改**每日抓取上限** | `TIKHUB_DEFAULT_MAX_RESULTS` / `SOCIALDATA_DEFAULT_MAX_RESULTS`(約 212 / 198 行) |
| 改 **X 關鍵詞 / KOL 列表** | `SOCIALDATA_DEFAULT_QUERY` / `SOCIALDATA_LIST_ID_DEFAULT`(約 197 / 204 行) |
| 改 **SocialData 時間窗**(天) | `SOCIALDATA_RECENCY_DAYS` |
| **臨時關掉**某個付費源 | GitHub Variables 把對應 `*_ENABLED` 設 `0` |
| 改**執行頻率** | workflow 第 6 行 `cron` |
| 改**付費源每天跑幾次** | `PAID_SOURCE_DEFAULT_INTERVAL_HOURS`(約 188 行) |

---

*改完程式碼後,跑一遍測試確認無誤:`python -m unittest tests.test_topic_filter -q`*
