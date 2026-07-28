# Personas 口味目錄

這裡存放 persona 評分器的"口味"定義。`scripts/persona_score.py` 會讀取本目錄下所有 `*.md` 檔案（本 README 除外），用它們作為 LLM 的 system prompt 給每日簡報打分和點評。

## 內建口味

| id | 名稱 | 視角 |
|----|------|------|
| `pragmatic` | 實用派（預設） | 只關心對開發者/從業者今天有什麼用 |
| `cynic` | 毒舌評論員 | 拆穿營銷話術和炒作，譏諷但基於事實 |
| `paper-police` | 較真黨 | 只認論文/程式碼/benchmark 實證，對"即將推出"零容忍 |

## 檔案格式

每個 persona 是一個 Markdown 檔案，由 YAML frontmatter 和正文 prompt 兩部分組成：

```markdown
---
id: my-persona
name: 中文名
name_en: English Name
---

正文即 system prompt……
```

frontmatter 欄位：

- `id`（必填）：只允許小寫字母和連字元（`[a-z-]`），需與檔名一致。
- `name`（必填）：中文顯示名。
- `name_en`（必填）：英文顯示名。
- `default: true`（可選）：預設口味標記，全目錄只允許一個（當前是 `pragmatic`）。

注意：解析器是手寫的簡易 frontmatter 解析（逐行 `key: value`），不要在 frontmatter 裡用巢狀結構、多行值或列表。

## 正文 prompt 必須包含

1. **口味自述**：一段話講清這個口味的立場和關注點，人格要鮮明。
2. **評分標準**：0-100 分的分段說明，寫明各分段的側重點。
3. **輸出要求**：要求模型返回 `{"score": <0-100 整數>, "review": "<一句中文點評>"}`，點評不超過 40 字，說人話，不復讀標題。
4. **示例點評**：至少 3 條"輸入 → 輸出"示例，幫模型對齊語氣和分數尺度。

## 如何貢獻第 4 個口味

1. 複製任意內建口味檔案作為模板，起一個符合 `[a-z-]` 的檔名（如 `personas/vc-radar.md`）。
2. 填好 frontmatter（不要寫 `default: true`，預設位已被 pragmatic 佔用）。
3. 按上面四要素寫正文，中文文案避免翻譯腔。
4. 本地驗證：

   ```bash
   python scripts/persona_score.py --list-personas
   ```

   確認新口味出現在列表裡。
5. 跑 `python -m pytest -q tests/test_persona_score.py` 確認解析無誤。

新口味會自動參與 TOP3 多口味點評（`data/top3-personas.json`）；每日逐條評分仍只用預設口味。
