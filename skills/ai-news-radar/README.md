<div align="center">

# 伯樂Skill

> 從一堆資訊來源裡選出千里馬。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill-blueviolet)](https://claude.ai/code)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-green)](https://pages.github.com/)

<br>

**伯樂Skill is Scout Skill for AI News Radar.**

它幫你判斷哪些 AI 資訊源值得長期追蹤，並把它們接入一個自動更新的 AI 日報網站。

<br>

[線上示例](https://learnprompt.github.io/ai-news-radar/) · [安裝](#安裝) · [安裝後第一句話](#安裝後第一句話) · [快速錄入資訊源](#快速錄入資訊源) · [伯樂會選什麼](#伯樂Skill會選什麼) · [工作原理](#工作原理)

</div>

---

## 它解決什麼問題

一到假期，資訊焦慮就會變嚴重。

不是沒東西看，而是東西太多了。

RSS裡一堆更新，X上有人分享新工具，飛書知識庫裡還有資料，聚合站每天刷出幾十頁。真正的問題變成了：我到底該看什麼？哪些源值得長期追？哪些源只是製造噪音？怎麼把這些東西變成每天真的能看的AI日報？

AI News Radar原本是給自己用的AI日報網站，專門覆蓋那些平時自然資訊流裡看不到的資訊源。

但用了一段時間後，新的問題來了：如果一直往裡面加資訊源，它很快就會變成一天幾千條、幾萬條更新。看起來很強，實際上還是看不完。

所以這次沒有繼續簡單加源，而是在AI News Radar上做了一個Skill。

它叫：**伯樂Skill**。

伯樂Skill不是什麼源都加。它只做一件事：

**從亂七八糟的資訊來源裡，選出值得長期追蹤的千里馬。**

---

## 線上示例

你可以先看公開版：

https://learnprompt.github.io/ai-news-radar/

這個頁面會持續更新AI、開發者、官方部落格、技術聚合站和公開日報類來源。

它不是最終答案，而是一個可以fork、可以改、可以接入你自己資訊源的起點。

---

## 安裝

如果你只是想看日報，不需要安裝，直接開啟線上頁面即可：

```text
https://learnprompt.github.io/ai-news-radar/
```

如果你想做自己的版本：

```bash
git clone https://github.com/LearnPrompt/ai-news-radar.git
cd ai-news-radar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/update_news.py --output-dir data --window-hours 24
python -m http.server 8080
```

然後開啟：

```text
http://localhost:8080
```

如果你在Claude Code、Codex或其他支援Skill的Agent裡使用，請讓Agent讀取：

```text
skills/ai-news-radar/SKILL.md
```

---

## 安裝後第一句話

安裝或fork之後，不知道怎麼開始，就直接對Agent說：

```text
請使用伯樂Skill，先問我要資訊源清單，然後幫我判斷每個資訊來源該用 RSS、OPML、公開 feed、靜態頁面、Jina Fallback、AgentMail 郵箱還是跳過。目標是部署一個不需要伺服器、能用 GitHub Actions 自動更新的 AI 日報網站。不要把任何 API Key、cookies、token、真實 OPML、郵箱正文或私有郵件內容寫入倉庫。
```

這句話的作用是把Agent拉回正確路線：先判斷來源，再決定接入方式，不要一上來亂抓網頁。

---

## 快速錄入資訊源

你可以直接把資訊源丟給伯樂Skill。

```text
我想用伯樂Skill搭一個自己的AI日報網站。

這是我常看的資訊源：

1. https://openai.com/news/
2. https://www.anthropic.com/news
3. https://huggingface.co/blog
4. https://news.ycombinator.com/
5. 一個OPML檔案：feeds/follow.opml
6. 一個AgentMail收件箱：newsletter@你的inbox.agentmail.to
7. 一些我關注的X賬號：karpathy、sama、nearcyan

請你幫我完成：

1. 判斷每個源適合用RSS、OPML、公開頁面、GitHub feed、AgentMail郵箱，還是需要跳過。
2. 能用RSS/OPML的優先用RSS/OPML。
3. AgentMail只作為私有進階源，預設不釋出完整正文。
4. 不要把需要登入、cookies、token的來源作為預設公共源。
5. 把適合公開內建的源加入專案。
6. 把私人訂閱源放進本地OPML、AgentMail或GitHub Secret方案。
7. 本地跑一次資料生成。
8. 如果透過驗證，指導我部署到GitHub Pages。
```

如果你想讓使用者按表格錄入，可以用這個版本：

```text
請使用伯樂Skill，幫我搭建自己的AI日報網站。

你先讓我按下面格式填寫資訊源：

| 名稱 | URL或賬號 | 型別 | 是否私人 | 我為什麼想看它 |
|---|---|---|---|---|
| OpenAI News | https://openai.com/news/ | 網站/RSS | 否 | 官方更新 |
| Karpathy | @karpathy | X賬號 | 否 | AI觀點 |
| 我的RSS列表 | follow.opml | OPML | 是 | 個人訂閱 |
| Newsletter收件箱 | AgentMail inbox | 郵箱 | 是 | 產品週報和newsletter |

填完後，請你幫我判斷哪些能直接接入、哪些應該進入OPML、哪些不適合接入、哪些需要JinaFallback、哪些需要以後用私有整合處理。然後生成本地日報資料，並指導我部署到GitHub Pages。
```

---

## 伯樂Skill會選什麼

伯樂Skill主要會選五類東西。

| 能力 | 說明 |
|---|---|
| 資訊源判斷 | 判斷一個網站適合RSS、OPML、靜態解析、公開JSON，還是不適合接入 |
| 排除重複和過濾 | 把聚合站、日報、RSS裡的重複資訊壓下去 |
| AI訊號識別 | 區分真正的AI相關內容和只是蹭到關鍵詞的噪音 |
| 源健康檢查 | 看每個源是否還活著、每天貢獻多少資訊 |
| 靜態部署 | 不買伺服器，用GitHub Actions和GitHub Pages自動更新日報網站 |

伯樂Skill的目標不是讓你看更多資訊。

它的目標是讓你少看垃圾資訊。

---

## 支援的資訊源型別

| 型別 | 推薦程度 | 說明 |
|---|---|---|
| 官方RSS / Atom | 高 | 最穩定，優先使用 |
| OPML | 高 | 適合批次匯入個人RSS訂閱 |
| 公開GitHub生成Feed | 高 | 適合Follow Builders這類公開資料來源 |
| 公開Newsletter歸檔 | 中 | 優先用公開頁面或公開feed |
| 聚合站分頁 | 中 | 可覆蓋盲區，但需要排除重複和過濾 |
| X / Twitter | 中低 | 優先使用穩定的公開中間feed，不建議預設依賴賬號登入 |
| 飛書知識庫 | 進階 | 適合個人知識庫場景，不建議作為公共預設源 |
| AgentMail郵箱 | 進階 | 適合newsletter、產品週報、GitHub通知；預設關閉，只輸出脫敏摘要 |
| 需要登入的網站 | 謹慎 | 會引入cookies、額度和穩定性問題，不建議預設接入 |

---

## 為什麼不用Agent一直跑

AI日報不應該每次都依賴Agent臨時執行。

伯樂Skill採用的是更穩定的路徑：

```text
資訊源 → 抓取 → 排除重複 → 過濾 → 結構化JSON → GitHub Pages網頁
```

資料更新可以交給GitHub Actions定時執行。

這意味著：

- 不需要買伺服器
- 不需要每天手動執行
- 不需要每次消耗Agent額度
- 手機、iPad、電腦都能開啟
- fork之後可以變成你自己的日報站

Agent負責幫你判斷、配置和維護資訊源。真正的日報更新，交給自動化流程。

---

## 工作原理

伯樂Skill處理資訊源時，會做四步。

**1. 來源分類**

先判斷來源屬於哪一類：

```text
RSS / Atom
OPML
公開GitHub feed
公開網頁
聚合站分頁
X橋接源
私有知識庫
AgentMail郵箱
需要登入的來源
```

不同來源走不同策略。能用RSS就不用網頁解析。能用公開feed就不重寫爬蟲。AgentMail只作為私有郵箱情報入口，適合newsletter和產品週報，不作為公共預設源。需要登入和cookies的來源，不放進公共預設配置。

**2. 抓取和結構化**

把不同來源抓到的資料統一整理成結構化JSON。

這樣Agent可以讀，網頁也可以讀。

**3. 排除重複和AI過濾**

對重複標題、重複連結、聚合站轉載進行排除重複。

同時區分AI強相關、全量資訊和原始覆蓋池。寬泛詞不會單獨決定一條新聞是不是AI新聞。比如`agent`可能是AI Agent，也可能只是普通代理。

**4. 靜態部署**

最後輸出到`data/*.json`，再透過GitHub Pages展示。

預設資料由GitHub Actions定時更新。

---

## 源健康和資訊密度

伯樂Skill不是隻會加源，也會幫你淘汰源。

頁面會展示源健康和資訊密度，比如：

```text
源是否正常
最近是否更新
每天貢獻多少條資訊
AI強相關內容佔比
```

一個簡單的淘汰標準：

```text
如果一個源連續一週平均每天貢獻不到1條有價值資訊，就可以考慮移除。
```

這比無限加源更重要。

因為AI日報的敵人不是資訊不夠，而是噪音太多。

---

## OPML支援

如果你是RSS老玩家，可以直接用OPML批次匯入訂閱源。

本地方式：

```bash
cp feeds/follow.example.opml feeds/follow.opml
# 把你的OPML內容放進 feeds/follow.opml
python scripts/update_news.py --output-dir data --window-hours 24 --rss-opml feeds/follow.opml
```

注意：

```text
feeds/follow.opml 是你的私人訂閱檔案，不要提交到公開倉庫。
```

如果要部署到GitHub Actions，建議把OPML轉成base64，放進GitHub Secret：

```bash
base64 < feeds/follow.opml | pbcopy
```

然後在倉庫Secrets裡新增：

```text
FOLLOW_OPML_B64
```

---

## AgentMail郵箱情報入口

如果你希望Newsletter、產品週報、GitHub通知進入日報鏈路，可以建立一個專門給AI日報使用的AgentMail收件箱。

本地方式：

```bash
export EMAIL_DIGEST_ENABLED=1
export AGENTMAIL_API_KEY="你的AgentMail API Key"
export AGENTMAIL_INBOX_ID="你的Inbox ID"
python scripts/update_news.py --output-dir data --window-hours 24
```

安全預設值：

```text
預設不啟用AgentMail。
預設只呼叫 GET /v0/inboxes/{inbox_id}/messages。
預設不讀取 /raw，不讀取 text/html 正文。
預設只輸出脫敏後的標題、預覽片段、發件域名、連結、附件數量和時間。
GitHub Actions預設不會提交 data/email-digest.json；只有設定 EMAIL_DIGEST_PUBLISH=1 才會提交。
```

建議把AgentMail理解成“AI日報的專用情報收件箱”，不是讀取你的私人郵箱。

---

## 安全邊界

伯樂Skill預設不會要求你提供API Key。

公開倉庫裡也不應該出現：

```text
API Key
cookies
token
.env
真實OPML訂閱檔案
郵箱正文或私有郵件內容
AgentMail API Key或Inbox ID
瀏覽器登入態
```

推薦做法：

- 公共預設源只使用穩定公開來源
- 私人訂閱放進OPML
- AgentMail只作為私有進階源，預設關閉
- OPML不要提交到倉庫
- GitHub Actions裡用Secret儲存私有配置
- 需要登入的網站不要作為預設抓取源

一個AI日報專案，自己用可以粗糙一點。一旦開源，就要替fork使用者提前擋坑。

---

## 適合誰

伯樂Skill適合這些人：

- 每天需要追AI新聞的人
- 有一堆RSS訂閱但看不過來的人
- 想把X、部落格、聚合站、Newsletter統一到一個頁面的人
- 想fork一個自己的AI日報站的人
- 想讓Codex或Claude Code長期維護資訊源的人
- 想做自媒體選題雷達的人

不適合這些場景：

- 想實時監控所有新聞
- 想抓取需要登入的網站
- 想把私人郵箱、AgentMail API Key和cookies直接塞進公開專案
- 想用它替代完整RSS閱讀器

伯樂Skill不是萬能資訊中臺。它更像一個AI訊號雷達。

---

## 倉庫結構

```text
ai-news-radar/
├── index.html
├── assets/
│   ├── app.js
│   └── styles.css
├── data/
│   ├── latest-24h.json
│   ├── latest-24h-all.json
│   ├── source-status.json
│   ├── email-digest.json  # 可選，AgentMail開啟後生成
│   └── archive.json
├── feeds/
│   ├── follow.example.opml
│   └── social-x.example.opml
├── scripts/
│   └── update_news.py
├── docs/
│   ├── SOURCE_COVERAGE.md
│   ├── GPT_HANDOFF.md
│   └── V2_PRODUCT_BRIEF.md
└── skills/
    └── ai-news-radar/
        ├── SKILL.md
        ├── README.md
        └── references/
```

---

## English

> Find the thoroughbred sources before they enter the radar.

**Scout Skill** is the English-facing name for 伯樂Skill in AI News Radar. It helps you choose high-signal AI sources worth tracking instead of blindly adding every noisy feed.

It classifies and ingests sources from RSS, OPML, public websites, GitHub-generated feeds, newsletters, X-related feeds, and private knowledge bases, then deploys the result as a GitHub Pages site.

It does not try to know everything.

It only helps AI News Radar find sources worth tracking.

**Live demo:**

https://learnprompt.github.io/ai-news-radar/

**Repository:**

https://github.com/LearnPrompt/ai-news-radar

### Quick prompt after install

```text
Use Scout Skill to help me build my own AI daily radar.

First read README.md, docs/SOURCE_COVERAGE.md, docs/GPT_HANDOFF.md, and skills/ai-news-radar/SKILL.md.

Then ask me for my source list: websites, RSS feeds, OPML files, X accounts, newsletters, GitHub projects, or private knowledge bases.

For each source, classify whether it should be handled as RSS, OPML, public feed, static page, Jina fallback, optional private integration, or skipped.

Prefer stable public sources. Do not commit API keys, cookies, tokens, private OPML files, or email contents.

After classification, generate the local data, verify the JSON output, and guide me through GitHub Pages deployment.
```

---

## 背後的故事

伯樂Skill是在一次假期資訊焦慮裡做出來的。

我一邊自駕，一邊用語音把需求丟給Codex。想到一個源、一個過濾規則、一個頁面問題，就讓Agent繼續改。

最後它變成了一個很適合AI時代的東西：不是讓AI幫我多看一點資訊，而是讓AI幫我少看一點垃圾資訊。

所以它叫伯樂Skill：先選千里馬，再上雷達。

它看的不是天下大事。它先看的，是哪些資訊來源值得進入雷達。

---

## License

MIT — 隨便用，隨便改，隨便讓它幫你選千里馬。

---

<div align="center">

**RSS閱讀器**幫你訂閱資訊。
**AI News Radar**幫你展示AI訊號。
**伯樂Skill**幫你判斷哪些資訊來源是值得長期追蹤的千里馬。

<br>

*從一堆資訊來源裡選出千里馬。*

</div>
