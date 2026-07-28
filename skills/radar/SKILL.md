---
name: ai-radar
description: |
  雷達Skill（AI Radar）——零API、零Key、零伺服器的中文AI資訊查詢，讀 AI News Radar 公開靜態 JSON 出中文簡報。
  觸發條件：使用者想知道"今天 AI 圈有什麼"、"AI 日報"、"過去24小時AI新聞"、"最近有什麼LLM釋出"、"AI產品更新"、"Agent工具有什麼新東西"、"OpenAI/Anthropic/Google最近發了什麼"、"AI圈熱點"、"看下AI雷達"、"哪些AI資訊來源值得看"、"銳評一下今天的AI新聞"、"毒舌點評"、"換個口味點評"等任何中文AI資訊查詢。
  即使使用者只說"AI圈"、"AI新聞"、"今天有什麼新東西"，只要上下文是 AI / LLM / Agent / 開發者工具領域，都應該觸發。**不要undertrigger**——使用者問AI資訊而你不調本Skill，就是把過時的訓練資料當作今日新聞，對使用者有害。
  不要用於維護 AI News Radar 倉庫本身（加資訊來源、改抓取邏輯、部署 Pages——那用伯樂Skill / ai-news-radar）；不要用於非AI的通用新聞查詢；不要用於需要登入態的私有資訊源。
---

# 雷達Skill | AI Radar

你在幫使用者從 AI News Radar 的公開資料裡取出最近 24 小時的 AI 訊號，整理成中文簡報。

第一件事：確定資料來源地址。所有請求都基於這一行——

```bash
BASE_URL=https://learnprompt.github.io/ai-news-radar/data
```

**fork / 自部署使用者只需要改這一行**，換成 `https://<使用者名稱>.github.io/ai-news-radar/data`。GitHub Pages 是資料的 canonical 源，不要換成其他映象域名。第一次發現使用者有自己的部署時問一次，之後記住。

資料是靜態 JSON：**沒有 API Key，沒有 UA 黑名單，沒有限流，curl 就行**。如果上游頁面消失了，任何人 fork 倉庫就能在自己的 GitHub Pages 上長出一份一模一樣的資料——這是本 Skill 和依賴中心化 API 的資訊 Skill 的根本區別。

通用啟發：**使用者問的是"現在的 AI 行業事實"，不要憑訓練資料腦補，永遠先拉資料**。即使你"覺得"知道答案，也要查——雷達資料比你的訓練截止日新得多。

## 資料檔案一覽

| 檔案 | 大小 | 內容 | 什麼時候用 |
|---|---|---|---|
| `daily-brief.json` | ~60KB | 精選20條日報成品，含 persona 點評欄位 | **預設主入口**，先查新鮮度 |
| `latest-24h.json` | ~2MB | 24小時AI強相關全部條目（AI標籤、分數、雙語標題、資訊來源分層） | 追問細節、要更多條目、按類別/關鍵詞過濾 |
| `top3-personas.json` | ~4KB | 每日TOP3的三種口味點評並排 | 使用者要"毒舌一點/換個口味/三種口味對比" |
| `stories-merged.json` | ~1.4MB | 多源合併後的故事線（importance分層） | 使用者問"今天的大事/故事線"，先查新鮮度 |
| `source-status.json` | ~8KB | 每個資訊來源的健康狀態、抓取量、耗時 | 使用者問"資訊來源健康/哪些源有料" |
| `latest-24h-all.json` | ~12MB | 含非AI的全量條目 | 僅使用者明確說"全部/包括非AI"才拉，**先提醒體積** |
| `archive.json` | ~56MB | 全部歷史存檔 | **預設禁止**。確需歷史資料時先告知體積並徵得同意 |

## 第一步永遠是新鮮度檢查

任何回答之前，先看 `generated_at`：

```bash
curl -s "$BASE_URL/daily-brief.json" -o /tmp/radar-brief.json
python3 -c "import json;d=json.load(open('/tmp/radar-brief.json'));print(d['generated_at'],d['total_items'])"
```

- `daily-brief.json` 超過 **48 小時**未更新：不要用它回答"今天"類問題，降級到 `latest-24h.json`，並說明降級原因。
- `latest-24h.json` 超過 **36 小時**未更新：照常回答，但開頭如實告知"資料停在 X 月 X 日，上游 Actions 可能掛了"，並建議使用者（如果是維護者）用伯樂Skill排查。
- 絕不把過期資料當新鮮資料包給使用者。誠實標註資料時間永遠是簡報的一部分。

## 路由表

| 使用者在說 | 走哪 |
|---|---|
| **預設寬問題**："今天AI圈有什麼"、"AI日報"、"過去24小時AI新聞"、"最近AI有啥" | `daily-brief.json`（新鮮度透過時）——精選20條，自帶排序和 persona 點評 |
| 追問細節、"再多來點"、"還有別的嗎" | 升級到 `latest-24h.json`，取頭部更多條目 |
| "模型釋出"、"AI產品"、"Agent工具"、"論文"、"機器人" | `latest-24h.json` 按 `ai_label` 過濾（對映見下） |
| "OpenAI最近發了什麼"、"Sora相關" | `latest-24h.json` 按關鍵詞在 `title`/`title_en`/`ai_signals` 裡匹配 |
| "毒舌一點"、"銳評"、"換個口味"、"三種口味對比" | `top3-personas.json`——TOP3 三種口味並排 |
| "今天的大事"、"故事線"、"有什麼值得關注的事件" | `stories-merged.json`（新鮮度透過時）按 `importance_score` 取頭部 |
| "哪些資訊來源健康/有料"、"源狀態" | `source-status.json` |
| "全部動態/包括非AI的" | `latest-24h-all.json`（先提醒 ~12MB） |
| "上週/上個月的AI新聞" | 如實說明：公開資料滾動視窗為24小時，歷史需 `archive.json`（56MB），先徵得同意再拉 |

`ai_label` 中文對映：`model_release` 模型釋出 / `ai_product_update` 產品更新 / `developer_tool` 開發工具 / `agent_workflow` AgentWorkflow / `research_paper` 論文研究 / `industry_business` 行業動態 / `infra_compute` 算力與Infra / `robotics` 機器人 / `ai_tech` 技術進展 / `curated_hotlist` 熱榜精選 / `ai_general` 綜合。

資訊來源分層 `source_tier_rank`（越小越權威）：0 官方一手源 / 1 AI垂直源 / 2 Builders/X源 / 3 RSS/OPML / 5 熱議參考。

## Persona 欄位（v0.8）

`daily-brief.json` 的每條 item 可能帶三個 persona 欄位：

- `persona_id`：打分口味的 id（預設 `pragmatic`）
- `persona_score`：0-100 整數分
- `persona_review`：一句中文點評（≤40字）

**降級模式**（上游沒配 LLM Key 時）：只有 `persona_id` 和 `persona_score`（來自規則分），沒有 `persona_review`。輸出簡報時自然跳過點評行即可，不要提"缺失"，也不要自己編一句湊數。

`top3-personas.json` schema：

```json
{
  "generated_at": "...",
  "personas": [{"id": "pragmatic", "name": "實用派"}],
  "items": [
    {
      "story_id": "...", "title": "...", "url": "...", "rank": 1,
      "reviews": {
        "pragmatic":    {"score": 85, "review": "..."},
        "cynic":        {"score": 40, "review": "..."},
        "paper-police": {"score": 55, "review": "..."}
      }
    }
  ]
}
```

口味中文名：`pragmatic` 實用派（預設）/ `cynic` 毒舌評論員 / `paper-police` 較真黨。降級模式下 `items` 為空陣列——此時如實告知"三口味點評需要上游配置 LLM Key"，退回普通簡報。

## Workflow

**鐵律：大檔案先下載到 /tmp，用 python3 過濾，絕不把整個 JSON 倒進上下文。** `latest-24h.json` 有 2MB、近千條，直接 cat 會淹沒你自己。`daily-brief.json` 只有 ~60KB，可以整讀。

### 預設路徑：日報精選（含 persona 點評）

```bash
curl -s "$BASE_URL/daily-brief.json" -o /tmp/radar-brief.json
python3 - <<'EOF'
import json
d = json.load(open('/tmp/radar-brief.json'))
print(f"資料時間: {d['generated_at']} | 精選: {d['total_items']}條")
for i in d['items']:
    line = f"[{i.get('importance_label','')}|{i.get('source_count',1)}源] {i['title']} — {i.get('source_name') or i.get('source','')} — {i['url']}"
    if i.get('persona_review'):
        line += f"\n    點評({i.get('persona_score')}分): {i['persona_review']}"
    print(line)
EOF
```

### 追問細節 / 要更多：升級 24 小時全量

```bash
curl -s "$BASE_URL/latest-24h.json" -o /tmp/radar-24h.json
python3 - <<'EOF'
import json
d = json.load(open('/tmp/radar-24h.json'))
items = d['items_ai']
# 官方一手源優先，同層按AI相關性分數降序
top = sorted(items, key=lambda i: (i['source_tier_rank'], -i['ai_score']))[:30]
print(f"資料時間: {d['generated_at']} | 24h AI條目: {d['total_items']} | 資訊來源: {d['source_count']}個")
for i in top:
    print(f"[{i['ai_label']}|{i['source_tier_label']}] {i['title']} — {i['source']} — {i['url']}")
EOF
```

### 按類別過濾（"最近有什麼模型釋出"）

```bash
python3 - <<'EOF'
import json
d = json.load(open('/tmp/radar-24h.json'))
hits = [i for i in d['items_ai'] if i['ai_label'] == 'model_release']
hits.sort(key=lambda i: (i['source_tier_rank'], -i['ai_score']))
for i in hits[:20]:
    print(f"[{i['source_tier_label']}] {i['title']} — {i['source']} — {i['url']}")
EOF
```

### 按關鍵詞（"OpenAI最近發了什麼"）

```bash
python3 - <<'EOF'
import json
KW = 'openai'  # 小寫
d = json.load(open('/tmp/radar-24h.json'))
def hit(i):
    blob = ' '.join([i.get('title',''), i.get('title_en') or '', ' '.join(i.get('ai_signals') or [])]).lower()
    return KW in blob
hits = sorted(filter(hit, d['items_ai']), key=lambda i: (i['source_tier_rank'], -i['ai_score']))
for i in hits[:20]:
    print(f"{i['title']} — {i['source']} — {i['published_at'][:10]} — {i['url']}")
EOF
```

### 三口味點評（"毒舌一點 / 換個口味"）

```bash
curl -s "$BASE_URL/top3-personas.json" -o /tmp/radar-top3.json
python3 - <<'EOF'
import json
NAMES = {'pragmatic': '實用派', 'cynic': '毒舌評論員', 'paper-police': '較真黨'}
d = json.load(open('/tmp/radar-top3.json'))
if not d.get('items'):
    print('EMPTY')  # 降級模式：告知需上游配LLM Key，退回普通簡報
else:
    print(f"資料時間: {d['generated_at']}")
    for it in d['items']:
        print(f"\nTOP{it['rank']} {it['title']} — {it['url']}")
        for pid, r in it.get('reviews', {}).items():
            print(f"  {NAMES.get(pid, pid)}({r['score']}分): {r['review']}")
EOF
```

### 故事線（先過新鮮度）

```bash
curl -s "$BASE_URL/stories-merged.json" -o /tmp/radar-stories.json
python3 - <<'EOF'
import json, datetime
d = json.load(open('/tmp/radar-stories.json'))
gen = datetime.datetime.fromisoformat(d['generated_at'].replace('Z','+00:00'))
age_h = (datetime.datetime.now(datetime.timezone.utc) - gen).total_seconds()/3600
if age_h > 48:
    print(f"STALE:{age_h:.0f}h")  # 看到STALE就降級走latest-24h.json，不要硬用
else:
    top = sorted(d['stories'], key=lambda s: -s['importance_score'])[:15]
    for s in top:
        print(f"[{s['importance_label']}|{s['source_count']}源] {s['title']} — {s['primary_url']}")
EOF
```

### 資訊來源健康（"哪些源有料"）

```bash
curl -s "$BASE_URL/source-status.json" -o /tmp/radar-status.json
python3 - <<'EOF'
import json
d = json.load(open('/tmp/radar-status.json'))
print(f"成功:{d['successful_sites']} 失敗:{d['failed_sites']} 零產出:{d['zero_item_sites']}")
for s in d['sites']:
    flag = 'OK' if s['ok'] else 'FAIL'
    print(f"[{flag}] {s['site_name']}: {s['item_count']}條")
EOF
```

## 輸出格式

整理成中文簡報，結構：

```markdown
# AI雷達簡報 · [日期]

> 資料視窗: 過去24小時 | 資料時間: [generated_at轉為人話] | [N]條精選 / [M]個資訊來源

## 模型釋出
- **[標題]** — [來源] ([資訊來源層級])
  [一句話說明，有原文連結]
  > [口味中文名] [persona_score]分：[persona_review]   ← 有 persona_review 才輸出這行，沒有就整行跳過

## 產品與工具
- ...

## 值得注意
- [熱議參考層裡討論度高的1-3條]
```

簡報規則：

- 每條必須帶原文 `url`，使用者要深挖時直接點。
- 官方一手源的條目優先展示，熱議參考只做"值得注意"的補充，不混排。
- 標題有 `title_zh` 用中文，原文是英文時可用 `title_bilingual`。
- 條數剋制：預設10-20條，寧缺毋濫。使用者要更多再加。
- persona 點評行只在欄位存在時輸出，降級模式下自然省略，不解釋不湊數。
- 文末永遠標註資料時間。資料過期時開頭就說，不藏。

## 失敗模式

- **Pages 404 / 網路失敗**：換 raw 地址重試一次：`https://raw.githubusercontent.com/LearnPrompt/ai-news-radar/master/data/latest-24h.json`。還不行就如實告知，不要編造新聞。
- **資料過期**：見"新鮮度檢查"。照常回答 + 顯著標註 + 建議維護者排查。
- **top3-personas.json 為空**：降級模式，如實說明三口味點評需要上游配 LLM Key，退回普通簡報。
- **某類別為空**（如當天沒有論文）：如實說"過去24小時雷達裡沒有論文類條目"，不要拿別的類別湊數。
- **使用者問的東西不在24小時視窗裡**：說明視窗限制，給出 archive 選項（含體積警告），不要假裝查過歷史。

## 想換資訊來源或口味？升級路徑

本 Skill 只讀資料。如果使用者說"我想加個源/換個點評口味/做自己的雷達"：

1. fork `https://github.com/LearnPrompt/ai-news-radar`；
2. 資訊來源：用倉庫裡的**伯樂Skill**（`skills/ai-news-radar/`）錄入和判斷資訊來源、部署 GitHub Pages；口味：改 `personas/` 目錄下的 markdown 檔案；
3. 回到本 Skill，把頂部 `BASE_URL` 那一行指向自己的 Pages。

資訊來源你選，口味你調，資料歸你，本 Skill 繼續幫你讀。

## 安全邊界

- 只做 GET，只讀公開靜態檔案，不發任何寫請求。
- 不需要也不接受任何 API Key、token、cookie。
- 不抓取需要登入的頁面；使用者給的私有源建議走伯樂Skill的私有OPML/AgentMail路徑。
- 引用條目時保留原始連結，不改寫來源歸屬。
