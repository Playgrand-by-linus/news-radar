# AI News Radar Roadmap

## Parked — 三口味 persona 網頁 UI（2026-07-15 歸檔）

v0.8–v0.9 期間網頁端曾上線「今日 TOP3 · 三口味銳評」置頂板塊與精選卡片的單條銳評行，因樣式不滿意在 v0.9 釋出前暫時下線，待重新設計後迴歸。

- 開關：`assets/app.js` 的 `PERSONA_UI_ENABLED`（現為 `false`，置回 `true` 即恢復板塊與銳評行，渲染程式碼完整保留）。
- 不受影響：資料Pipeline（`scripts/persona_score.py` 每輪照常生成 `data/daily-brief.json` 的 persona 欄位與 `data/top3-personas.json`）、Skill 端日報的三口味點評。
- 迴歸前要解決的：三列並排面板與卡片視覺融合度、銳評行與推薦理由的層級關係、口味名稱/分數的展示樣式。

## v0.3.0 — Source Overlap Check

Goal: before adding a new public default source, evaluate whether its recent items are mostly duplicates of the existing source set.

Status: implemented as a maintainer-facing intake tool.

### What ships

- `scripts/evaluate_source_overlap.py`
  - Fetches a candidate RSS/Atom source.
  - Compares recent candidate items against `data/archive.json` or another baseline JSON.
  - Reports hard duplicates, possible duplicates, unique items, top overlapping sources, and a recommendation.
- `tests/test_source_overlap.py`
  - Covers URL exact matches, title similarity, duplicate-rate statistics, threshold recommendations, and the small-sample guard.

### Default decision thresholds

- `< 35%` duplicate rate: `accept_default`
- `35%–65%` duplicate rate: `watchlist`
- `>= 65%` duplicate rate: `skip_duplicate`
- `< 5` recent candidate items: always `watchlist`, because the sample is too small for automatic rejection.

### Example

```bash
python scripts/evaluate_source_overlap.py \
  --source-url https://aihot.virxact.com/feed.xml \
  --source-name "AI HOT" \
  --site-id aihot_candidate \
  --baseline data/archive.json \
  --lookback-days 7 \
  --output /tmp/aihot-overlap.json
```

The tool is advisory only. It does not change `update_news.py`, does not remove any items, and does not publish the report to GitHub Pages by default.

## v0.4.0 — Explainable AI Relevance Scoring

Goal: move beyond a black-box boolean topic filter and make every AI relevance decision inspectable, testable, and tunable.

Status: implemented as the default topic-filtering layer.

### What ships

- `scripts/ai_relevance.py`
  - Scores each normalized record with `score_ai_relevance(record)`.
  - Emits `is_ai_related`, `score`, `label`, `reason`, `signals`, and `noise`.
  - Keeps `is_ai_related_record(record)` as a backward-compatible boolean wrapper.
- `scripts/update_news.py`
  - Uses the new scorer before writing the 24h Signal payload.
  - Adds AI relevance fields to kept records so downstream UI and audits can explain why an item passed.
  - Publishes the filter metadata as `topic_filter=ai_relevance_scoring_v0_4` and `ai_relevance_threshold=0.65`.
- `scripts/audit_ai_relevance.py`
  - Generates a Markdown audit report from `latest-24h.json` and `latest-24h-all.json`.
  - Summarizes raw keep rate, label distribution, source keep rate, top kept samples, high-score dropped samples, and review-band candidates.
- `tests/test_ai_relevance.py`
  - Covers strong AI signals, broad AI terms with tech context, trusted AI-source priors, noise suppression, structured output fields, and boolean compatibility.

### Default decision thresholds

- `score >= 0.65`: keep in the AI Signal view.
- `0.45 <= score < 0.65`: review band for future manual or LLM second-pass review.
- `< 0.45`: keep only in all-mode/archive data.

### Audit example

```bash
python scripts/update_news.py \
  --output-dir /tmp/ai-news-radar-v0.4-preview \
  --window-hours 24 \
  --rss-opml feeds/follow.opml

python scripts/audit_ai_relevance.py \
  --data-dir /tmp/ai-news-radar-v0.4-preview \
  --output reports/ai-relevance-audit/v0.4.0-YYYY-MM-DD.md
```

### Non-goals for v0.4.0

- No LLM classifier in the default GitHub Actions path.
- No full-body semantic reading; the default scorer remains title/source/url based.
- No automatic source deletion based on keep rate.
- No public page layout redesign.

## v0.5.0 — Story Merge / Event Cluster

Goal: move beyond per-item filtering and represent the same event as one story with multiple source references.

### Planned direction

- Keep the current filter-first behavior as the safe default.
- Add a story clustering layer after source normalization and before page payload generation.
- Preserve one primary title plus secondary source references, instead of randomly choosing one duplicated item.
- Show repeated coverage as a trust signal: "多個來源報道了這件事".

### Non-goals for v0.5.0

- No LLM semantic clustering in the first pass.
- No cross-language deep semantic matching unless the rule-based event merge proves insufficient.
- No automatic deletion of sources based only on overlap score.
- No change to the public page layout unless the story data model is stable.
