# AI News Radar 2.0 Source Inventory Summary — 2026-05-10

> 用途：人工驗收前，說明當前 AI News Radar 到底收集了多少源，以及這些源以什麼方式存在。
>
> 依據：`data/source-status.json`、`scripts/update_news.py`、`feeds/follow.example.opml`、`docs/SOURCE_COVERAGE.md`，以及 2026-05-10 本地 OPML 驗證輸出。

## 1. 結論

當前可以按三層理解：

1. **預設公共抓取層**：12 個內建 source adapter，當前線上/本地資料快照中 12/12 成功。
2. **OPML 示例/自定義層**：`feeds/follow.example.opml` 已有 10 個公開 RSS/Atom 示例源；本地驗證 10/10 成功。它們不會自動進入線上預設流，除非執行時顯式傳入 OPML。
3. **高階/私有能力層**：AgentMail 郵箱、X API/Follow Builders 類能力、私有 OPML、未來 X/WeChat/peer aggregator 等。預設關閉或透過公開生成檔案間接消費，不上傳私有資料。

如果按“程式碼裡的 source adapter”數：當前是 **12 個預設 adapter**；啟用示例 OPML 後是 **13 個 site 節點**，其中 OPML 節點內部包含 10 條 feed。

如果按“更細顆粒度的具體源入口”數：當前可展示為 **約 30 個入口**：

- 預設官方端點：9 個左右，包括 7 個 RSS/Atom + Anthropic News 頁面 + OpenAI Codex Changelog 頁面。
- 預設聚合/媒體 adapter：11 個。
- 示例 OPML feed：10 個。

注意：部分聚合器本身還會展開更多上游子源，例如 NewsNow、Follow Builders、Info Flow 等；這裡不把它們內部所有上游再逐個計數，避免把“資訊量”誤說成“可控源數量”。

---

## 2. 預設公共抓取層：12 個 adapter

來自當前 `data/source-status.json` 快照：`generated_at=2026-05-09T11:51:06.929410Z`。

| # | site_id | 展示名 | 存在方式 | 當前狀態 | 快照 item_count | 說明 |
| --- | --- | --- | --- | --- | ---: | --- |
| 1 | `official_ai` | Official AI Updates | 內建官方源 adapter | ok | 191 | 官方 RSS/Atom + 官方頁面解析 |
| 2 | `aibreakfast` | AI Breakfast | 內建 newsletter/archive adapter | ok | 9 | Beehiiv 公開頁經 Jina Reader 讀取 |
| 3 | `followbuilders` | Follow Builders | 公開 GitHub-generated JSON | ok | 24 | 讀取 `feed-x.json`、`feed-blogs.json`、`feed-podcasts.json` |
| 4 | `techurls` | TechURLs | 內建公開聚合源 adapter | ok | 405 | 公共聚合源 |
| 5 | `buzzing` | Buzzing | 內建公開聚合源 adapter | ok | 744 | 公共聚合源 |
| 6 | `iris` | Info Flow | 內建公開聚合源 adapter | ok | 487 | 公共聚合源 |
| 7 | `bestblogs` | BestBlogs | 內建公開聚合源 adapter | ok | 1 | 公共聚合源 |
| 8 | `zeli` | Zeli | 內建公開聚合源 adapter | ok | 64 | 公共聚合源 |
| 9 | `aihubtoday` | AI HubToday | 內建 AI 聚合源 adapter | ok | 10 | AI 聚合源 |
| 10 | `aibase` | AIbase | 內建 AI 媒體/聚合源 adapter | ok | 20 | AI 聚合源 |
| 11 | `newsnow` | NewsNow | 內建公開聚合源 adapter | ok | 143 | 公共聚合源 |

（原表中的第 8 行熱榜聚合源已於 v0.8 刪除，歷史快照資料見 reports/source-quality/v0.8-audit.md。）

當前預設快照統計：

```text
successful_sites: 12
failed_sites: []
zero_item_sites: []
fetched_raw_items: 5145
items_before_topic_filter: 6932
items_in_24h: 654
rss_opml.enabled: false
agentmail.enabled: false
```

---

## 3. `official_ai` 內部官方源

`official_ai` 在介面和 source status 裡是 1 個 adapter，但內部包含多個一手官方端點。

| # | 名稱 | URL | 存在方式 |
| --- | --- | --- | --- |
| 1 | OpenAI News | `https://openai.com/news/rss.xml` | 官方 RSS |
| 2 | Google DeepMind | `https://deepmind.google/blog/rss.xml` | 官方 RSS |
| 3 | Google AI Blog | `https://blog.google/innovation-and-ai/technology/ai/rss/` | 官方 RSS |
| 4 | Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | 官方 RSS |
| 5 | GitHub AI & ML | `https://github.blog/ai-and-ml/feed/` | 官方 RSS |
| 6 | GitHub Changelog | `https://github.blog/changelog/feed/` | 官方 RSS |
| 7 | OpenAI Skills | `https://github.com/openai/skills/commits/main.atom` | GitHub Atom |
| 8 | Anthropic News | `https://www.anthropic.com/news` | 官方頁面解析 |
| 9 | OpenAI Codex Changelog | `https://developers.openai.com/codex/changelog` | 官方頁面解析 |

---

## 4. OPML 示例/自定義層：10 個 feed

`feeds/follow.example.opml` 當前有 10 個公開 RSS/Atom 示例源。它們是給維護者複製到 `feeds/follow.opml` 後啟用的，不會預設汙染公共首頁。

| # | 名稱 | URL | 型別 | 存在方式 |
| --- | --- | --- | --- | --- |
| 1 | OpenAI News | `https://openai.com/news/rss.xml` | RSS | OPML 示例；與官方預設源重複，用於教學 |
| 2 | Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | RSS | OPML 示例；與官方預設源重複，用於教學 |
| 3 | Wired AI | `https://www.wired.com/feed/tag/ai/latest/rss` | RSS | OPML 示例 |
| 4 | InfoQ CN | `https://www.infoq.cn/feed` | RSS | OPML 示例，原有示例源 |
| 5 | 寶玉 | `https://baoyu.io/feed.xml` | RSS | OPML 示例 |
| 6 | Simon Willison | `https://simonwillison.net/atom/everything/` | Atom/RSS | OPML 示例 |
| 7 | AI For Developers | `https://aifordevelopers.substack.com/feed` | Substack RSS | OPML 示例 |
| 8 | True Positive Weekly | `https://aiweekly.substack.com/feed` | Substack RSS | OPML 示例 |
| 9 | AI Evaluation | `https://aievaluation.substack.com/feed` | Substack RSS | OPML 示例 |
| 10 | BuzzRobot | `https://buzzrobot.substack.com/feed` | Substack RSS | OPML 示例 |

本地驗證命令啟用 `feeds/follow.example.opml` 後：

```text
site_nodes: 13
successful_sites: 13
failed_sites: []
zero_item_sites: []
rss_opml.feed_total: 10
rss_opml.ok_feeds: 10
rss_opml.failed_feeds: []
OPML RSS item_count: 1906
```

---

## 5. 高階/私有能力層

這些能力適合在 2.0 裡作為“能力展示”，但不應預設上傳到線上公共資料。

| 能力 | 當前存在方式 | 預設是否啟用 | 是否上傳線上 | 建議 2.0 展示方式 |
| --- | --- | --- | --- | --- |
| 私有 OPML/RSS | `feeds/follow.opml` 本地檔案或 `FOLLOW_OPML_B64` GitHub Secret | 否 | 否，除非使用者自己在 fork 中啟用 | 展示“支援私人 OPML”，只展示狀態/數量，不展示私有 URL |
| AgentMail 郵箱摘要 | `EMAIL_DIGEST_ENABLED=1` + `AGENTMAIL_API_KEY` + `AGENTMAIL_INBOX_ID` | 否 | 預設不釋出；只有 `EMAIL_DIGEST_PUBLISH=1` 才釋出 metadata-only | 展示“支援郵箱訂閱源”，預設 `disabled/private` |
| X API 直連 | 未來可用 `X_BEARER_TOKEN` / 官方 API adapter | 否 | 不上傳 token，不預設釋出原始時間線 | 展示“支援 X API 私有源”，僅展示能力和示例狀態 |
| Follow Builders | 當前透過公開 GitHub JSON 間接消費 | 是，作為預設 adapter | 上傳的是公開生成 JSON 的結果，不需要本倉庫 X token | 展示為“公開生成 feed 模式”成功案例 |
| WeChat/X 第三方橋 | 調研中歸為 advanced/private | 否 | 否 | 展示為“高階橋接能力，需要自擔穩定性” |
| Peer aggregator | SuYxh JSON、Horizon Atom 等候選 | 否 | 未接入 | 展示為“可擴充套件方向”，不進預設流 |

---

## 6. 對 2.0 首頁/驗收頁的建議

建議不要把高階源的真實內容放進線上預設資料，而是做一個 **Source Capability / Advanced Sources** 展示區：

1. **Public default sources**：展示 12 個預設 adapter，顯示健康狀態、item_count、更新時間。
2. **Example OPML sources**：展示 10 個示例 feed，標記“template only / optional”。
3. **Private advanced sources**：展示能力卡片，不展示私有內容：
   - X API：`supported, private, disabled by default`
   - Email/AgentMail：`supported, metadata-only, publish disabled by default`
   - Private OPML：`supported via local file or GitHub Secret`
   - WeChat/X bridge：`advanced, unstable, opt-in`
4. **Safety copy**：明確寫出：預設公共版不需要 API Key，不上傳 token，不提交私有 OPML，不釋出郵箱正文。

這符合 Carl 的兩個目標：

- **不會上傳到線上**：高階源預設只展示 capability/status，不展示 raw data。
- **不會產生額外開銷**：高階源預設 disabled，不拉取、不呼叫 API、不消耗額度。
