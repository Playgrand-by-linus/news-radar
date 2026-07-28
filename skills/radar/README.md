<div align="center">

# 雷達Skill | ai-radar

> 對Agent說一句"今天AI圈有什麼"，10秒拿到一份帶原文連結的中文AI簡報。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-ai--radar-blueviolet)](https://github.com/LearnPrompt/ai-news-radar)
[![Zero API](https://img.shields.io/badge/API-Zero-green)](#為什麼是零api)

![ai-radar demo](assets/demo.gif)

[安裝](#快速開始) · [觸發方式](#觸發方式) · [它和同類有什麼不同](#它和同類有什麼不同) · [安全邊界](#安全邊界) · [English](#english)

</div>

---

## 你什麼時候需要它

- 每天開啟十幾個網站追AI新聞，想讓Agent替你跑腿。
- 用過那些"AI日報Skill"，但不想依賴誰家的伺服器和API——服務一下線，Skill就成磚。
- 想要一個**問完即走**的入口：一句話，一份簡報，每條都有原文連結。

## 它會交付什麼

一份按"模型釋出 / 產品更新 / 開發者工具 / 值得注意"分組的中文簡報：

- 每條帶原文連結和資訊來源名，官方一手源優先；
- 資料來自 [AI News Radar](https://github.com/LearnPrompt/ai-news-radar) 公開管道：150+ 資訊來源、AI相關性過濾、資訊來源分層；
- v0.8 起簡報自帶 persona 點評：預設實用派口味，說一句"毒舌一點"還能看毒舌評論員和較真黨對每日 TOP3 的三味並排銳評；
- 簡報永遠標註資料時間——資料過期會直說，不裝新鮮。

## 快速開始

```bash
npx skills add LearnPrompt/ai-news-radar -s ai-radar -g
```

裝完直接說：

```text
今天AI圈有什麼？
```

## 觸發方式

這些話都會喚醒它：

- "今天AI圈有什麼" / "過去24小時AI新聞"
- "最近有什麼LLM釋出"
- "OpenAI/Anthropic/Google 最近發了什麼"
- "Agent工具有什麼新東西"
- "看下AI雷達" / "AI日報"
- "銳評一下" / "毒舌點評" / "換個口味"
- "哪些AI資訊來源值得看"

## 為什麼是零API

本Skill不呼叫任何API服務。它讀的是 GitHub Pages 上的**公開靜態JSON**——GitHub Actions 每30分鐘重新整理一次，無鑑權、無限流、無UA黑名單，`curl` 即取。

這帶來一個根本差異：**資料管道是可fork的**。上游頁面哪天沒了？fork倉庫，你自己的 Pages 上就長出一份一模一樣的資料，把Skill的 Base URL 一換就續上了。

## 它和同類有什麼不同

| | 中心化API型資訊Skill | Agent現抓現總結 | **ai-radar** |
|---|---|---|---|
| 依賴 | 別人的伺服器 | 每次燒Agent額度 | 公開靜態JSON |
| 服務下線後 | Skill變磚 | — | fork即復活 |
| 資訊來源可定製 | 不能 | 每次重新教 | fork後伯樂Skill錄入 |
| 資料新鮮度 | 取決於服務方 | 實時但貴 | 每30分鐘，自動 |

## 想換資訊來源？換口味？

這正是它和兄弟Skill的分工：**ai-radar 管讀，[伯樂Skill](../ai-news-radar/README.md) 管選。**

1. fork [LearnPrompt/ai-news-radar](https://github.com/LearnPrompt/ai-news-radar)；
2. 資訊來源：用伯樂Skill判斷和錄入（RSS/OPML/公開feed/靜態頁/AgentMail）；口味：改 `personas/` 下的一個 markdown 檔案；
3. 把 ai-radar SKILL.md 頂部的 `BASE_URL` 一行指向你自己的 Pages。

資訊來源你選，口味你調，資料歸你。

## 安全邊界

- 只發 GET 請求，只讀公開靜態檔案；
- 不需要也不接受 API Key、token、cookie；
- 不抓取需要登入的頁面；
- 資料過期、類別為空、歷史超窗時如實說明，不編造新聞。

## 檔案結構

```text
skills/radar/
├── SKILL.md          # AgentWorkflow：路由表、新鮮度檢查、失敗模式
├── README.md         # 本檔案
└── assets/
    ├── demo.gif      # 上面的演示
    ├── demo.tape     # vhs錄製指令碼（GIF可復現）
    └── demo.sh       # 演示用的真實資料拉取指令碼
```

## 驗證與測試

裝完可以用這兩句驗收：

```text
今天AI圈有什麼？        → 應返回分組中文簡報，每條帶連結，文末有資料時間
最近有什麼模型釋出？     → 應只返回 model_release 類條目
```

或者不裝Skill直接驗證資料管道：

```bash
bash skills/radar/assets/demo.sh
```

---

## English

**ai-radar** answers "What happened in AI today?" by reading the public static JSON that [AI News Radar](https://github.com/LearnPrompt/ai-news-radar) publishes on GitHub Pages every 30 minutes. Zero API, zero key, zero server — and because the whole data pipeline is forkable, the skill can never be bricked by someone else's service going down.

```bash
npx skills add LearnPrompt/ai-news-radar -s ai-radar -g
```

Then ask your agent: `What happened in AI today?`

Want your own sources? Fork the repo, let the in-repo [Scout Skill](../ai-news-radar/README.md) classify and ingest them, and point ai-radar at your own Pages URL.
