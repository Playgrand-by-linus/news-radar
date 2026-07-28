# AI News Radar Source Intake Decision Table — 2026-05-10

> 用途：給 Carl 逐類確認候選源是否進入下一步收錄。
>
> 來源：`docs/research/source-intake-2026-05-10.md`
>
> 當前狀態：分類已由 Carl 確認；第一批低風險 `example-opml` 已收錄到 `feeds/follow.example.opml`。實現層仍未改 fetcher、不改 workflow。

## 路線說明

| 建議路線 | 含義 | 下一步動作 |
| --- | --- | --- |
| `built-in-official-candidate` | 值得考慮進入預設內建的一手官方源 | 先補一次結構/時間戳探測，再寫 focused fetcher 或加入官方源配置 |
| `example-opml` | 適合作為使用者自定義資訊源示例，不進預設公共流 | 加入 `feeds/follow.example.opml`，並在檔案說明適用場景 |
| `public-generated-feed-candidate` | 其他專案已經公開生成 JSON/RSS/Atom，可作為上游聚合源 | 先做 dedupe/noise 測試，再決定是否寫 fetcher |
| `watchlist` | 有價值但證據不足、結構未穩、或還需要再探測 | 暫不收錄，補探測後再定 |
| `advanced-private` | 需要 token、OAuth、私有配置，或依賴脆弱橋接 | 只進高階/私有路線，不進預設公共流 |
| `already-covered` | 已被 AI News Radar 現有預設源覆蓋 | 不重複收錄，只在檔案中標記覆蓋關係 |
| `skip` | 與 AI News Radar 預設目標不匹配，或噪音/維護風險過高 | 不收錄 |

---

## A. `built-in-official-candidate`：預設內建官方源候選

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Meta AI Blog | `https://ai.meta.com/blog/` | official page | mixed，需複核頁面結構 | 否 | 低-中 | `built-in-official-candidate` | 待確認 |
| Meta AI Research/Publications | `https://ai.meta.com/research/publications/` | official page | mixed，論文量可能偏大 | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| Mistral News | `https://mistral.ai/news` | official page | 已探測：200 HTML；需確認條目時間戳 | 否 | 低 | `built-in-official-candidate` | 待確認 |
| xAI News | `https://x.ai/news` | official page | 已探測：200 HTML；需確認條目時間戳 | 否 | 低-中 | `built-in-official-candidate` | 待確認 |
| Qwen Blog | `https://qwenlm.github.io/blog/` | official blog | 已探測：200 HTML；需做 feed discovery | 否 | 低-中 | `built-in-official-candidate` | 待確認 |
| Qwen GitHub | `https://github.com/QwenLM` | GitHub org/repos | GitHub 時間戳穩定，但需限定 repo/release | 否，可選 token 提額 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| Qwen Hugging Face | `https://huggingface.co/Qwen` | HF org/model hub | mixed，模型更新多，需過濾 | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| DeepSeek 官網 | `https://www.deepseek.com/` | official site | mixed，需複核更新頁 | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| DeepSeek Hugging Face | `https://huggingface.co/deepseek-ai` | HF org/model hub | mixed，模型更新多，需過濾 | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| DeepSeek GitHub | `https://github.com/deepseek-ai` | GitHub org/repos | GitHub 時間戳穩定，但需限定 repo/release | 否，可選 token 提額 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| Google Gemini Blog | `https://blog.google/products/gemini/` | official page | mixed；消費級更新較多 | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |
| Google AI for Developers | `https://ai.google.dev/` | official dev site/changelog candidate | 需找 changelog/feed | 否 | 中 | `built-in-official-candidate` / `watchlist` | 待確認 |

---

## B. `example-opml`：適合先放進 OPML 示例的候選源

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Wired AI RSS | `https://www.wired.com/feed/tag/ai/latest/rss` | RSS | 已探測：200 XML，10 items，日期新 | 否 | 中 | `example-opml` | 待確認 |
| TechCrunch RSS | `https://techcrunch.com/feed/` | RSS | 已探測：200 RSS，20 items | 否 | 高，需要 AI 過濾 | `example-opml` with filter | 待確認 |
| AI For Developers | `https://aifordevelopers.substack.com/feed` | Substack RSS | 已探測：200 XML，9 items，latest 2026-04-28 | 否 | 中 | `example-opml` | 待確認 |
| True Positive Weekly | `https://aiweekly.substack.com/feed` | Substack RSS | 已探測：200 XML，20 items，latest 2026-05-07 | 否 | 低-中 | `example-opml` | 待確認 |
| AI Evaluation Substack | `https://aievaluation.substack.com/feed` | Substack RSS | 已探測：200 XML，8 items，latest 2026-04-24 | 否 | 低，偏專項 | `example-opml` | 待確認 |
| BuzzRobot | `https://buzzrobot.substack.com/feed` | Substack RSS | 已探測：200 XML，20 items，latest 2026-04-02；頻率較慢 | 否 | 低-中 | `example-opml` / `watchlist` | 待確認 |
| QbitAI RSS | `https://www.qbitai.com/feed` | RSS | 尚需再探測 | 否 | 中 | `example-opml` / `watchlist` | 待確認 |
| 寶玉 feed | `https://baoyu.io/feed.xml` | RSS | 尚需再探測 | 否 | 中 | `example-opml` | 待確認 |
| Simon Willison Atom | `https://simonwillison.net/atom/everything/` | Atom/RSS | 已探測：200 XML，30 entries | 否 | 中，個人部落格但 LLM/dev tools 訊號強 | `example-opml` | 待確認 |
| Hacker News RSS | `https://hnrss.org/frontpage` | RSS | stable | 否 | 中，高熱但泛技術 | `example-opml` / optional discussion signal | 待確認 |
| Chinese AI media: 機器之心 | `https://www.jiqizhixin.com/` | media page/RSS candidate | mixed，需找穩定 RSS | 否 | 中 | `example-opml` / `watchlist` | 待確認 |
| Chinese AI media: QbitAI | `https://www.qbitai.com/` | media page/RSS candidate | mixed，RSS 需複核 | 否 | 中 | `example-opml` / `watchlist` | 待確認 |

---

## C. `public-generated-feed-candidate`：公開生成 feed / JSON 候選

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SuYxh latest snapshot | `https://suyxh.github.io/ai-news-aggregator/data/latest-24h.json` | public generated JSON | 已探測：200 JSON，`generated_at=2026-05-10T05:29:52.953Z`，615 items | 否 | 中，可能與現有源重複 | `public-generated-feed-candidate` | 待確認 |
| SuYxh source status | `https://suyxh.github.io/ai-news-aggregator/data/source-status.json` | public status JSON | 已探測：200 JSON，14 sites | 否 | 低；不是內容源 | `public-generated-feed-candidate` / health reference | 待確認 |
| Horizon zh Atom | `https://thysrael.github.io/Horizon/feed-zh.xml` | public generated Atom | 已探測：200 XML，6 entries，recent | 否 | 中，二次 AI 摘要源 | `public-generated-feed-candidate` / `watchlist` | 待確認 |
| Horizon en Atom | `https://thysrael.github.io/Horizon/feed-en.xml` | public generated Atom | 已探測：200 XML，5 entries，recent | 否 | 中，二次 AI 摘要源 | `public-generated-feed-candidate` / `watchlist` | 待確認 |
| ClawFeed user digest RSS | `https://clawfeed.kevinhe.io/feed/:slug.rss` | public generated RSS if slug known | depends on slug；未拿到具體 slug | 否，公開 feed 不需要 | 中 | `public-generated-feed-candidate` / `watchlist` | 待確認 |
| ClawFeed user digest JSON | `https://clawfeed.kevinhe.io/feed/:slug.json` | public generated JSON if slug known | depends on slug；未拿到具體 slug | 否，公開 feed 不需要 | 中 | `public-generated-feed-candidate` / `watchlist` | 待確認 |

---

## D. `watchlist`：先不收錄，補探測後再定

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MIT Technology Review feed | `https://www.technologyreview.com/feed/` | RSS | 本地探測 SSL EOF；需換方式重試 | 否 | 中 | `watchlist` | 待確認 |
| The Verge AI page | `https://www.theverge.com/ai-artificial-intelligence` | topic page | 未直接探測 feed，需找穩定 RSS/API | 否 | 中 | `watchlist` | 待確認 |
| Data Elixir | `https://dataelixir.com/newsletters/` | newsletter archive | 未探測 feed；偏 data science | 否 | 中 | `watchlist` | 待確認 |
| Turing Post | `https://www.turingpost.com/` | newsletter/site | 未探測 feed | 否 | 中 | `watchlist` | 待確認 |
| Hugging Face Models Trending | `https://huggingface.co/models?sort=trending` | public page | mixed，模型轉存噪音多 | 否 | 中-高 | `watchlist` | 待確認 |
| Hugging Face Papers | `https://huggingface.co/papers` | public page | mixed，論文日更 | 否 | 中 | `watchlist` | 待確認 |
| arXiv cs.CL recent | `https://arxiv.org/list/cs.CL/recent` | public list | stable | 否 | 高，需要強過濾 | `watchlist` / focused fetcher | 待確認 |
| arXiv cs.AI recent | `https://arxiv.org/list/cs.AI/recent` | public list | stable | 否 | 高，需要強過濾 | `watchlist` / focused fetcher | 待確認 |
| arXiv cs.LG recent | `https://arxiv.org/list/cs.LG/recent` | public list | stable | 否 | 高，需要強過濾 | `watchlist` / focused fetcher | 待確認 |
| arXiv cs.CV recent | `https://arxiv.org/list/cs.CV/recent` | public list | stable | 否 | 高，需要強過濾 | `watchlist` / focused fetcher | 待確認 |
| GitHub Trending | `https://github.com/trending` | public page | unstable ordering | 否 | 高 | `watchlist` / advanced only | 待確認 |
| GitHub releases/events | GitHub API/Atom | public API/Atom | stable，但需指定 repo/org | 可選 token 提額 | 中 | `watchlist` | 待確認 |
| Hacker News Firebase API | `https://hacker-news.firebaseio.com/v0/topstories.json` | public API | stable | 否 | 中-高，泛技術 | `watchlist` / discussion signal | 待確認 |
| SuYxh OPML feed list | `https://suyxh.github.io/ai-news-aggregator/data/opml-feeds.json` | public source inventory JSON | mixed；7 categories | 否 | 中-高，含大量橋接源 | `watchlist` / inventory only | 待確認 |
| RSS source type in ClawFeed | user-configured RSS | pattern, not concrete source | depends | 否 | mixed | `watchlist` / pattern only | 待確認 |
| raw_items pipeline design in ClawFeed | docs/PRD | architecture pattern | n/a | n/a | n/a | `watchlist` / borrow pattern only | 待確認 |

---

## E. `advanced-private`：高階/私有路線，不進預設公共流

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X/Twitter official accounts | `@OpenAI`, `@AnthropicAI`, `@GoogleDeepMind`, `@deepseek_ai`, `@Alibaba_Qwen` 等 | social/API | API-dependent | 是，官方 API 需要 token | 高 | `advanced-private` | 待確認 |
| Twitter/X via Apify | configured through `APIFY_TOKEN` | secret-backed bridge | depends | 是 | 高 | `advanced-private` | 待確認 |
| X bridge feeds | `https://api.xgo.ing/rss/user/...` | third-party X RSS bridge | bridge-dependent | 無直接 secret，但橋不穩定 | 高 | `advanced-private` / `watchlist` | 待確認 |
| WeChat RSS bridge | `https://decemberpei.cyou/rssbox/wechat-*.xml` | third-party WeChat RSS bridge | bridge-dependent | 無直接 secret，但橋不穩定 | 中-高 | `advanced-private` | 待確認 |
| ClawFeed Twitter-heavy source packs | source packs in product | social source bundle | depends | 可能需要 OAuth/API/登入態 | 高 | `advanced-private` | 待確認 |
| Email/newsletter inbox routes | private inbox / AgentMail style | email bridge | depends | 是 | 中 | `advanced-private` | 待確認 |

---

## F. `already-covered`：已有覆蓋，不重複收錄

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenAI News | `https://openai.com/news/`, `https://openai.com/index/` | official page/RSS candidate | likely stable | 否 | 低 | `already-covered` | 待確認 |
| Anthropic News | `https://www.anthropic.com/news` | official page | stable | 否 | 低 | `already-covered` | 待確認 |
| Anthropic Research | `https://www.anthropic.com/research` | official page | stable | 否 | 低 | `already-covered` / maybe expand if missing | 待確認 |
| Google DeepMind Blog | `https://deepmind.google/discover/blog/` | official RSS/page | stable | 否 | 低-中 | `already-covered` | 待確認 |
| Google AI Blog | `https://blog.google/technology/ai/` | official page/RSS candidate | stable | 否 | 中 | `already-covered` / maybe expand | 待確認 |
| Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | RSS | stable | 否 | 中 | `already-covered` | 待確認 |
| GitHub AI & ML / Changelog | GitHub official blog/changelog RSS | RSS | stable | 否 | 中 | `already-covered` | 待確認 |
| AI Breakfast | `https://aibreakfast.beehiiv.com/` | Beehiiv/archive | already has AI News Radar fetcher | 否 | 中 | `already-covered` | 待確認 |
| NewsNow API | `https://newsnow.busiyi.world/api/...` | public aggregator API | mixed | 否 | 中 | `already-covered` / compare only | 待確認 |
| NewsNow project | `https://github.com/ourongxing/newsnow` | aggregator project | mixed | 否 | 中 | `already-covered` / compare only | 待確認 |

---

## G. `skip`：建議不收錄

| 候選源 | URL | 型別 | 時間戳情況 | 是否秘密 | 噪音風險 | 建議路線 | Carl 決策 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TrendRadar broad hot lists | many broad platforms | hot-list aggregator | mixed | 否/部分平臺動態 | 高 | `skip` | 待確認 |
| Chinese hot-list platforms | Weibo/Douyin/Zhihu/etc. | hot list/social | dynamic/fragile | often no | 高 | `skip` | 待確認 |
| Ruanyifeng Atom | `http://www.ruanyifeng.com/blog/atom.xml` | RSS/Atom | stable but broad | 否 | 高 for AI | `skip` for default; personal OPML only | 待確認 |
| Yahoo Finance RSS | `https://finance.yahoo.com/news/rssindex` | RSS | stable but finance | 否 | 高 | `skip` | 待確認 |
| Meituan Tech | `https://tech.meituan.com/feed/` | RSS | listed by upstream | 否 | 高 for AI | `skip` for default; personal OPML only | 待確認 |
| Import AI signup | Mailchimp subscribe URL | newsletter signup | no public feed identified | 否 | 低，但難以 ingest | `skip` unless public archive/feed found | 待確認 |

---

## 我建議 Carl 先確認的 4 個關鍵分類

1. **是否同意先做 `example-opml`**：Wired、AI For Developers、True Positive Weekly、AI Evaluation、BuzzRobot、QbitAI、寶玉、Simon Willison。
2. **是否同意官方源候選進入下一輪探測**：Qwen、Mistral、xAI、Meta AI、DeepSeek。
3. **是否要接入 peer aggregator**：SuYxh `latest-24h.json`、Horizon Atom。這個會明顯增加覆蓋，但也會帶來二次聚合和重複項。
4. **是否明確把 X/WeChat 橋接源放到 advanced/private**：不進預設公共流，只作為高階玩法記錄。
