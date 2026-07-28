const state = {
  itemsAi: [],
  itemsAll: [],
  itemsAllRaw: [],
  creatorItemsAi: [],
  creatorItemsAll: [],
  creatorWindowDays: 7,
  statsAi: [],
  totalAi: 0,
  totalRaw: 0,
  totalAllMode: 0,
  allDedup: true,
  allDataLoaded: false,
  allDataUrl: "data/latest-24h-all.json",
  allDataPromise: null,
  siteFilter: "",
  authorFilter: "",
  query: "",
  // 單層資訊架構：category（內容 tab） x mode（精選/全量全域性開關）兩個維度。
  // mode=selected 主列表讀 mergedStories()（AI 相關合並事件池，純時間倒序）；
  // mode=all 主列表讀 itemsAllRaw/itemsAll（全量原始條目池）。
  mode: "selected",
  waytoagiMode: "today",
  waytoagiData: null,
  sourceStatus: null,
  generatedAt: null,
  dailyBrief: null,
  top3Personas: null,
  storiesMerged: null,
  storiesDataUrl: "data/stories-merged.json",
  // 內容 tab：單值，預設 "all"（全部，無過濾）
  activeSection: "all",
  mainListVisibleCount: 0,
  xAuthorsExpanded: false,
};

// DATA_BASE_URL 資料同源開關：優先順序 ?data= 查詢引數 > localStorage("dataBaseUrl") > "" (相對路徑，原行為)
// ?data= 命中時持久化到 localStorage，方便重新整理/後續訪問保持同一資料來源。
function resolveDataBaseUrl() {
  let fromQuery = "";
  try {
    fromQuery = new URLSearchParams(window.location.search).get("data") || "";
  } catch {
    fromQuery = "";
  }
  if (fromQuery) {
    const normalized = fromQuery.trim().replace(/\/+$/, "");
    try { localStorage.setItem("dataBaseUrl", normalized); } catch {}
    return normalized;
  }
  try {
    const stored = localStorage.getItem("dataBaseUrl") || "";
    return stored.trim().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

state.dataBaseUrl = resolveDataBaseUrl();

// 所有 data/*.json 抓取都必須經過這個 helper，才能讓 ?data= / localStorage 覆蓋生效。
// 傳入的 path 可能是 "data/xxx.json"（本地預設）或後端下發的同款相對路徑；
// 一旦切換到遠端 base，只拼檔名，避免拼出 base/data/xxx.json 這種雙重 data/ 路徑。
function dataUrl(path) {
  const base = state.dataBaseUrl;
  if (!base) return path;
  const file = String(path || "").split("/").pop();
  return `${base}/${file}`;
}

const siteSelectEl = document.getElementById("siteSelect");
const newsListEl = document.getElementById("newsList");
const updatedAtEl = document.getElementById("updatedAt");
const sourceStatusPillEl = document.getElementById("sourceStatusPill");
const searchInputEl = document.getElementById("searchInput");
const resultCountEl = document.getElementById("resultCount");
const listTitleEl = document.getElementById("listTitle");
const itemTpl = document.getElementById("itemTpl");
const modeSelectedBtnEl = document.getElementById("modeSelectedBtn");
const modeAllBtnEl = document.getElementById("modeAllBtn");
const hotBoardWrapEl = document.getElementById("hotBoardWrap");
const hotBoardListEl = document.getElementById("hotBoardList");
const hotBoardMetaEl = document.getElementById("hotBoardMeta");
const top3BoardWrapEl = document.getElementById("top3BoardWrap");
const top3BoardListEl = document.getElementById("top3BoardList");
const top3BoardMetaEl = document.getElementById("top3BoardMeta");
const newsListWrapEl = document.getElementById("newsListWrap");
const modeHintEl = document.getElementById("modeHint");
const allDedupeWrapEl = document.getElementById("allDedupeWrap");
const allDedupeToggleEl = document.getElementById("allDedupeToggle");
const allDedupeLabelEl = document.getElementById("allDedupeLabel");
const sourceHealthEl = document.getElementById("sourceHealth");
const sourceHealthDetailsEl = document.getElementById("sourceHealthDetails");
const sourceStatusTableEl = document.getElementById("sourceStatusTable");
const clearFiltersBtnEl = document.getElementById("clearFiltersBtn");
const dataSourceIndicatorEl = document.getElementById("dataSourceIndicator");
const dataSourceIndicatorTextEl = document.getElementById("dataSourceIndicatorText");
const dataSourceResetBtnEl = document.getElementById("dataSourceResetBtn");

const waytoagiWrapEl = document.querySelector(".waytoagi-wrap");
const waytoagiUpdatedAtEl = document.getElementById("waytoagiUpdatedAt");
const waytoagiMetaEl = document.getElementById("waytoagiMeta");
const waytoagiListEl = document.getElementById("waytoagiList");
const waytoagiTodayBtnEl = document.getElementById("waytoagiTodayBtn");
const waytoagi7dBtnEl = document.getElementById("waytoagi7dBtn");
const sectionTabsEl = document.getElementById("sectionTabs");

const SOURCE_KINDS = {
  official_ai: { label: "官方", tone: "official" },
  curated_media: { label: "精選媒體", tone: "aihub" },
  aihot: { label: "AI HOT", tone: "hot" },
  aibreakfast: { label: "日報", tone: "newsletter" },
  followbuilders: { label: "Builders/X", tone: "builders" },
  xapi: { label: "X API", tone: "builders" },
  socialdata_x: { label: "X 搜尋", tone: "builders" },
  tikhub_douyin: { label: "抖音", tone: "creator" },
  tikhub_xiaohongshu: { label: "小紅書", tone: "creator" },
  techurls: { label: "聚合", tone: "aggregate" },
  buzzing: { label: "聚合", tone: "aggregate" },
  iris: { label: "聚合", tone: "aggregate" },
  bestblogs: { label: "部落格", tone: "blogs" },
  zeli: { label: "聚合", tone: "aggregate" },
  hackernews: { label: "HN", tone: "aggregate" },
  aihubtoday: { label: "AI站點", tone: "aihub" },
  aibase: { label: "AI站點", tone: "aihub" },
  waytoagi: { label: "社群", tone: "builders" },
  newsnow: { label: "聚合", tone: "aggregate" },
  opmlrss: { label: "OPML", tone: "newsletter" },
};

// aihotSubSource() 結果 → 卡片小標籤文案/色調，色調複用既有 .category.kind-* 規則，不新增樣式
const AIHOT_SUB_LABELS = { x: "X", wechat: "公眾號", hn: "HN", rss: "RSS" };
const AIHOT_SUB_TONES = { x: "builders", wechat: "creator", hn: "aggregate", rss: "newsletter" };

// 單層內容 tab：全部（預設，無過濾）+ 5 個主題欄目 + 社群 + 自媒體，互斥單值。
const SECTION_DEFS = [
  { id: "all", label: "全部", short: "全部", description: "不篩選內容欄目，檢視全部訊號" },
  { id: "models", label: "模型", short: "模型", description: "模型釋出、能力升級、評測與開源權重" },
  { id: "products", label: "產品", short: "產品", description: "AI 應用、Agent、生成工具和使用者產品更新" },
  { id: "devtools", label: "開發者", short: "開發者", description: "程式設計工具、API、開源專案、推理與工程實踐" },
  { id: "industry", label: "行業", short: "行業", description: "公司戰略、融資收購、監管、晶片與產業變化" },
  { id: "research", label: "論文", short: "論文", description: "論文、基準、方法、資料集與研究團隊動態" },
  { id: "community", label: "社群", short: "社群", description: "HN、中文技術社群與社群動態" },
  { id: "creator", label: "自媒體", short: "自媒體", description: "抖音、小紅書等自媒體創作者內容" },
];

const SECTION_BY_ID = Object.fromEntries(SECTION_DEFS.map((section) => [section.id, section]));

function fmtNumber(n) {
  return new Intl.NumberFormat("zh-CN").format(n || 0);
}

const UNSAFE_HARD_PATTERNS = [
  /\bcreampie\b/i,
  /\bblowjob\b/i,
  /\bsuck (?:your|my) (?:dick|cock)\b/i,
  /中出|婊子|吸你的雞雞|操虛擬女友/i,
];

const UNSAFE_PROMO_PATTERNS = [
  /\b(?:nsfw|nudes?|porn(?:ography)?)\b/i,
  /\buncensored pictures?\b/i,
  /\bvirtual girlfriends?\b/i,
  /\bknock her up\b/i,
  /未經審查的圖片|虛擬女友|色情內容|成人內容/i,
];

function contentSafetyText(record) {
  return [
    record?.title,
    record?.title_zh,
    record?.title_en,
    record?.title_original,
    record?.source,
    record?.source_name,
  ].filter(Boolean).join(" ");
}

function isUnsafeContent(record) {
  const text = contentSafetyText(record);
  if (!text) return false;
  if (UNSAFE_HARD_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return UNSAFE_PROMO_PATTERNS.filter((pattern) => pattern.test(text)).length >= 2;
}

function safeItems(items) {
  return (Array.isArray(items) ? items : []).filter((item) => !isUnsafeContent(item));
}

function isUnsafeStory(story) {
  const refs = [
    story,
    story?.primary_item,
    ...(Array.isArray(story?.sources) ? story.sources : []),
    ...(Array.isArray(story?.items) ? story.items : []),
  ].filter(Boolean);
  return refs.some((ref) => isUnsafeContent(ref));
}

function fmtTime(iso) {
  if (!iso) return "時間未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "時間未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtDate(iso) {
  if (!iso) return "未知日期";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fmtHHMM(ms) {
  if (!ms) return "--:--";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

function fmtRelativeTime(ms) {
  if (!ms) return "時間未知";
  const diff = Date.now() - ms;
  if (diff < 0) return "剛剛";
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} 小時前`;
  return `${Math.round(hours / 24)} 天前`;
}

function failedSourceCount(status = state.sourceStatus) {
  const failedSites = Array.isArray(status?.failed_sites) ? status.failed_sites.length : 0;
  const rss = status?.rss_opml || {};
  const failedFeeds = Array.isArray(rss.failed_feeds) ? rss.failed_feeds.length : 0;
  return failedSites + failedFeeds;
}

function renderSourceStatusPill(errorMessage = "") {
  if (!sourceStatusPillEl) return;
  const status = state.sourceStatus;
  sourceStatusPillEl.className = "source-status-pill";
  if (!status) {
    sourceStatusPillEl.textContent = errorMessage || "源狀態載入中";
    if (errorMessage) sourceStatusPillEl.classList.add("bad");
    return;
  }
  const totalSites = Array.isArray(status.sites) ? status.sites.length : 0;
  const okSites = Number(status.successful_sites || 0);
  const failed = failedSourceCount(status);
  sourceStatusPillEl.textContent = failed
    ? `${fmtNumber(okSites)}/${fmtNumber(totalSites)} 源正常 · 失敗 ${fmtNumber(failed)}`
    : `${fmtNumber(okSites)}/${fmtNumber(totalSites)} 源正常`;
  if (failed) sourceStatusPillEl.classList.add("warn");
}

// 模式文案：精選（AI 相關合並事件池，純時間序）/ 全量（原始條目池）
function modeLabelText() {
  return state.mode === "all" ? "全量" : "精選";
}

function sourceKind(siteId) {
  return SOURCE_KINDS[siteId] || { label: "來源", tone: "default" };
}

function sourceSignalTone(signal) {
  const text = String(signal || "").toLowerCase();
  if (text.includes("官方") || text.includes("official")) return "official";
  if (text.includes("ai hot") || text.includes("精選")) return "hot";
  if (text.includes("自媒體") || text.includes("tikhub") || text.includes("douyin") || text.includes("xiaohongshu") || text.includes("抖音") || text.includes("小紅書")) return "creator";
  if (text.includes("builders") || text.includes("github") || text.includes("x")) return "builders";
  if (text.includes("aihub") || text.includes("aibase") || text.includes("媒體")) return "aihub";
  if (text.includes("hn") || text.includes("hacker") || text.includes("聚合")) return "aggregate";
  if (text.includes("opml") || text.includes("日報")) return "newsletter";
  return "default";
}

function sourceChip(label, tone = "default", className = "source-chip") {
  const chip = document.createElement("span");
  chip.className = `${className} kind-${tone}`.trim();
  const dot = document.createElement("span");
  dot.className = "source-dot";
  dot.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.className = "source-chip-label";
  text.textContent = label || "來源";
  chip.append(dot, text);
  return chip;
}

function appendSourceChip(parent, label, tone = "default", className = "source-chip") {
  parent.appendChild(sourceChip(label, tone, className));
}

function siteRows() {
  return Array.isArray(state.sourceStatus?.sites) ? state.sourceStatus.sites : [];
}

function siteRow(siteId) {
  return siteRows().find((site) => site.site_id === siteId) || null;
}

function aiSiteStat(siteId) {
  const stats = safeAiSiteStats();
  return stats.find((site) => site.site_id === siteId) || null;
}

function safeAiSiteStats() {
  const visibleStats = computeSiteStats(safeItems(state.itemsAi));
  const visibleById = new Map(visibleStats.map((site) => [site.site_id, site]));
  const baseStats = Array.isArray(state.statsAi) && state.statsAi.length ? state.statsAi : visibleStats;
  return baseStats.map((site) => ({
    ...site,
    count: Number(visibleById.get(site.site_id)?.count || 0),
  }));
}

function siteAiPoolCount(siteId) {
  return Number(aiSiteStat(siteId)?.count || 0);
}

function activeAdjustmentCount() {
  return [
    Boolean(state.query.trim()),
    state.activeSection !== "all",
    Boolean(state.siteFilter || state.authorFilter),
    state.mode !== "selected",
    state.mode === "all" && !state.allDedup,
  ].filter(Boolean).length;
}

function renderClearFiltersButton() {
  if (!clearFiltersBtnEl) return;
  const count = activeAdjustmentCount();
  clearFiltersBtnEl.hidden = count === 0;
  clearFiltersBtnEl.textContent = count ? `清除 ${fmtNumber(count)} 項調整` : "清除篩選";
}

// 資料同源指示：非空 dataBaseUrl 生效時提示當前資料來源 + 提供一鍵恢復本地相對路徑的入口。
function renderDataSourceIndicator() {
  if (!dataSourceIndicatorEl) return;
  const base = state.dataBaseUrl;
  dataSourceIndicatorEl.hidden = !base;
  if (base && dataSourceIndicatorTextEl) {
    dataSourceIndicatorTextEl.textContent = `資料來源:${base}`;
  }
}

function clearAllFilters() {
  state.query = "";
  state.activeSection = "all";
  state.siteFilter = "";
  state.authorFilter = "";
  state.mode = "selected";
  state.allDedup = true;
  state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
  state.waytoagiMode = "today";
  state.xAuthorsExpanded = false;
  if (searchInputEl) searchInputEl.value = "";
  if (siteSelectEl) siteSelectEl.value = "";
  rerenderCurrentView();
}

function computeSiteStats(items) {
  const m = new Map();
  items.forEach((item) => {
    if (!m.has(item.site_id)) {
      m.set(item.site_id, { site_id: item.site_id, site_name: item.site_name, count: 0, raw_count: 0 });
    }
    const row = m.get(item.site_id);
    row.count += 1;
    row.raw_count += 1;
  });
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.site_name.localeCompare(b.site_name, "zh-CN"));
}

// 具體來源下拉/站點 pill 的統計口徑跟隨當前模式：精選=AI 相關池，全量=原始條目池。
function currentSiteStats() {
  if (state.mode === "all") return computeSiteStats(effectiveAllItems());
  return safeAiSiteStats().filter((site) => site.count > 0);
}

function creatorHotScore(item) {
  return normalizedPercent(item?.creator_hot_score);
}

function highPriorityScore(item) {
  if (itemSourceGroup(item) === "creator" && creatorHotScore(item)) return creatorHotScore(item);
  return scorePercent(item);
}

function isHighPriorityItem(item) {
  return highPriorityScore(item) >= 75 || itemPriorityScore(item) >= 82 || item.site_id === "official_ai" || item.site_id === "aihot";
}

// tab 計數跟隨當前模式的可見集合（忽略當前已選欄目本身，展示"如果點這個 tab 會有多少條"）
function sectionTabCount(sectionId) {
  if (state.mode === "all") {
    const pool = mainListRawItemsBase();
    return sectionId === "all" ? pool.length : pool.filter((item) => itemSection(item) === sectionId).length;
  }
  const pool = mainListStoriesBase();
  return sectionId === "all" ? pool.length : pool.filter((story) => storySectionOf(story) === sectionId).length;
}

function renderSectionTabs() {
  if (!sectionTabsEl) return;
  sectionTabsEl.innerHTML = "";
  SECTION_DEFS.forEach((section) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `section-tab ${state.activeSection === section.id ? "active" : ""}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", state.activeSection === section.id ? "true" : "false");
    btn.dataset.section = section.id;
    btn.innerHTML = `<span>${section.label}</span><strong>${fmtNumber(sectionTabCount(section.id))}</strong>`;
    btn.addEventListener("click", () => {
      if (state.activeSection === section.id) return;
      state.activeSection = section.id;
      state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
      renderSectionTabs();
      renderModeSwitch();
      renderSiteFilters();
      renderHotBoard();
      if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
      renderMainList();
    });
    sectionTabsEl.appendChild(btn);
  });
}


function siteRatioText(siteStats) {
  const count = Number(siteStats.count || 0);
  const raw = Number(siteStats.raw_count ?? siteStats.count ?? 0);
  if (!raw) {
    const scanned = Number(siteRow(siteStats.site_id)?.item_count || 0);
    if (!count && scanned) return `24h 0 · 已掃 ${fmtNumber(scanned)}`;
    if (!count) return "已掃 0";
    return `${fmtNumber(count)} 條`;
  }
  if (raw === count) return `${fmtNumber(count)} 條`;
  return `${fmtNumber(count)}/${fmtNumber(raw)} · ${Math.round((count / raw) * 100)}%AI`;
}

function renderSiteFilters() {
  const stats = currentSiteStats();

  siteSelectEl.innerHTML = '<option value="">全部站點</option>';
  stats.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.site_id;
    opt.textContent = `${s.site_name} (${siteRatioText(s)})`;
    siteSelectEl.appendChild(opt);
  });
  siteSelectEl.value = state.siteFilter;
}

// 全域性 精選/全量 開關：熱點排行區只在精選模式顯示；主列表兩種模式共用同一套時間序+日期分組模板。
function renderModeSwitch() {
  if (modeSelectedBtnEl) {
    modeSelectedBtnEl.classList.toggle("active", state.mode === "selected");
    modeSelectedBtnEl.setAttribute("aria-pressed", state.mode === "selected" ? "true" : "false");
  }
  if (modeAllBtnEl) {
    modeAllBtnEl.classList.toggle("active", state.mode === "all");
    modeAllBtnEl.setAttribute("aria-pressed", state.mode === "all" ? "true" : "false");
  }
  if (hotBoardWrapEl) hotBoardWrapEl.hidden = state.mode !== "selected";
  if (allDedupeWrapEl) allDedupeWrapEl.classList.toggle("show", state.mode === "all");
  if (allDedupeToggleEl) allDedupeToggleEl.checked = state.allDedup;
  if (allDedupeLabelEl) allDedupeLabelEl.textContent = state.allDedup ? "排除重複開" : "排除重複關";
  const count = mainListEntries().length;
  if (modeHintEl) {
    modeHintEl.textContent = `${modeLabelText()} ${fmtNumber(count)} 條`;
    modeHintEl.setAttribute("aria-label", `當前${modeLabelText()}模式，${fmtNumber(count)} 條`);
  }
  if (listTitleEl) listTitleEl.textContent = listTitleText();
  renderClearFiltersButton();
}

function listTitleText() {
  const section = state.activeSection !== "all" ? SECTION_BY_ID[state.activeSection] : null;
  const label = modeLabelText();
  return section ? `${section.label} · ${label}` : label;
}

// 全量模式條目池：排除重複開=itemsAll（已排除重複），排除重複關=itemsAllRaw（原始單條池）
function effectiveAllItems() {
  return safeItems(state.allDedup ? state.itemsAll : state.itemsAllRaw);
}

function repairDisplayedTitle(original, translated) {
  let result = String(translated || "").trim();
  const source = String(original || "");
  if (/\bCodex\b/i.test(source)) result = result.replaceAll("法典", "Codex");
  if (/\bBug Bounty\b/i.test(source)) result = result.replaceAll("錯誤賞金", "漏洞懸賞").replaceAll("Bug 賞金", "漏洞懸賞");
  if (/\bBio Bug Bounty\b/i.test(source)) result = result.replaceAll("生物漏洞懸賞", "生物安全漏洞懸賞");
  if (/\brepositor(?:y|ies)\b/i.test(source)) result = result.replaceAll("儲存庫", "程式碼倉庫");
  if (/\bdesktop app\b/i.test(source)) result = result.replaceAll("桌面應用程式", "桌面應用");
  return result;
}

function isMostlyEnglishTitle(text) {
  const value = String(text || "").trim();
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  const cjk = (value.match(/[㐀-鿿]/g) || []).length;
  return latin >= 4 && latin > cjk * 2;
}

function itemTitleText(item) {
  const zhTitle = item.title_enhanced_zh || item.title_zh || "";
  const preferred = (zhTitle || item.title || item.title_en || "未命名更新").trim();
  const titleParts = preferred.includes(" / ") ? preferred.split(" / ") : [];
  const display = !zhTitle && titleParts.length ? titleParts[0].trim() : preferred;
  const original = item.title_en || item.title_original || (titleParts.length > 1 ? titleParts.slice(1).join(" / ") : "");
  return repairDisplayedTitle(original, display);
}

function itemOriginalTitleText(item) {
  const explicit = String(item?.title_en || "").trim();
  if (isMostlyEnglishTitle(explicit) && explicit !== itemTitleText(item)) return explicit;
  const bilingual = String(item?.title || item?.title_bilingual || "").trim();
  if (bilingual.includes(" / ")) {
    const [, ...rest] = bilingual.split(" / ");
    const original = rest.join(" / ").trim();
    if (isMostlyEnglishTitle(original) && original !== itemTitleText(item)) return original;
  }
  const original = String(item?.title_original || "").trim();
  if (isMostlyEnglishTitle(original) && original !== itemTitleText(item)) return original;
  return "";
}

function itemSummaryText(item, maxLength = 180) {
  const text = String(item?.summary || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function scorePercent(item) {
  const score = Number(item.ai_score ?? item.score ?? 0);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function normalizedPercent(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(score <= 1 ? score * 100 : score)));
}

function scoreTone(score) {
  if (score >= 90) return "hot";
  if (score >= 75) return "strong";
  return "watch";
}

function itemLabelTone(item) {
  const label = item.ai_label || "";
  if (item.site_id === "official_ai") return "official";
  if (item.site_id === "aihot" || label === "curated_hotlist") return "hot";
  if (itemSourceGroup(item) === "creator") return "creator";
  if (label === "model_release") return "models";
  if (label === "developer_tool" || label === "developer_tooling" || label === "infrastructure" || label === "infra_compute") return "devtools";
  if (label === "research_paper") return "research";
  if (label === "industry_business") return "industry";
  if (label === "ai_product_update" || label === "agent_workflow" || label === "robotics") return "products";
  return "default";
}

function itemTagTone(label) {
  const text = String(label || "");
  if (text.includes("多源")) return "strong";
  if (text.includes("官方")) return "official";
  if (text.includes("精選") || text.includes("熱點")) return "hot";
  if (text.includes("HN")) return "aggregate";
  if (text.includes("模型")) return "models";
  if (text.includes("開發")) return "devtools";
  if (text.includes("研究")) return "research";
  if (text.includes("自媒體")) return "creator";
  if (text.includes("社群")) return "community";
  if (text.includes("產品")) return "products";
  if (text.includes("行業")) return "industry";
  return "default";
}

function itemTagChip(label) {
  const tag = document.createElement("span");
  tag.className = `signal-tag tone-${itemTagTone(label)}`;
  tag.textContent = label;
  return tag;
}

function setSourceBadge(el, label, tone = "default", title = "") {
  el.className = `source source-chip kind-${tone}`;
  el.innerHTML = "";
  if (title) el.title = title;
  const dot = document.createElement("span");
  dot.className = "source-dot";
  dot.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.className = "source-chip-label";
  text.textContent = label || "來源";
  el.append(dot, text);
}

function sourceTierPercent(item) {
  if (item.site_id === "official_ai") return 100;
  if (item.site_id === "aihot") return 90;
  const rank = Number(item.source_tier_rank);
  if (!Number.isFinite(rank)) return 38;
  return Math.max(28, Math.min(86, 86 - rank * 9));
}

function editorialPercent(item) {
  const aihotScore = normalizedPercent(item.aihot_score);
  if (aihotScore) return aihotScore;
  if (item.site_id === "official_ai") return 90;
  if (item.site_id === "aihot") return 78;
  const internal = scorePercent(item);
  return internal ? Math.max(45, Math.round(internal * 0.72)) : 36;
}

function freshnessPercent(item, halfLifeHours = 48) {
  const ageMs = Date.now() - timelineMs(item);
  if (!Number.isFinite(ageMs) || ageMs < 0) return 100;
  const ageHours = ageMs / 3600000;
  return Math.max(0, Math.min(100, Math.round(100 * Math.pow(0.5, ageHours / halfLifeHours))));
}

function itemPriorityScore(item) {
  const creatorScore = creatorHotScore(item);
  if (creatorScore && itemSourceGroup(item) === "creator") return creatorScore;
  const internal = scorePercent(item);
  const editorial = editorialPercent(item);
  const source = sourceTierPercent(item);
  const freshness = freshnessPercent(item);
  const signal = Array.isArray(item.ai_signals) ? Math.min(100, item.ai_signals.length * 18) : 0;
  return Math.round((editorial * 0.3) + (source * 0.22) + (internal * 0.2) + (freshness * 0.18) + (signal * 0.1));
}

function labelText(item) {
  const labels = {
    ai_general: "AI訊號",
    model_release: "模型釋出",
    agent_workflow: "AgentWorkflow",
    ai_product_update: "產品更新",
    developer_tooling: "開發工具",
    developer_tool: "開發工具",
    infrastructure: "基礎設施",
    infra_compute: "基礎設施",
    industry_business: "行業動態",
    research_paper: "研究論文",
    robotics: "機器人",
    curated_hotlist: "熱點",
    ai_tech: "技術趨勢",
  };
  return labels[item.ai_label] || item.ai_label || "精選訊號";
}

function itemHaystack(item) {
  return [
    item.title,
    item.title_zh,
    item.title_en,
    item.title_original,
    item.source,
    item.site_name,
    item.site_id,
    item.ai_label,
    ...(Array.isArray(item.ai_signals) ? item.ai_signals : []),
  ].filter(Boolean).join(" ").toLowerCase();
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

// 主題分類：優先用後端 ai_label，泛化標籤走正則優先順序（首個命中即停）
const AI_LABEL_SECTION_MAP = {
  model_release: "models",
  ai_product_update: "products",
  agent_workflow: "products",
  robotics: "products",
  developer_tool: "devtools",
  developer_tooling: "devtools",
  infra_compute: "devtools",
  research_paper: "research",
  industry_business: "industry",
};

const SECTION_FALLBACK_RULES = [
  ["research", [
    /paper|arxiv|research|benchmark|eval|dataset|lmsys|rdi|berkeley|huggingface daily papers|論文|研究|基準|評測|資料集|訓練|k-means|speculative decoding/,
  ]],
  ["models", [
    /gpt[-\s]?\d|claude|gemini|grok|llama|qwen|deepseek|mistral|kimi\s?k\d|glm|gemma|模型|model|weights|權重|多模態|影片生成|diffusion|sora|seedance|llm|LLM/,
  ]],
  ["devtools", [
    /github|cursor|codex|copilot|openrouter|api|sdk|mcp|cli|framework|inference|推理|開發者|開源|程式碼|程式設計|算力|晶片|nvidia|cloud|部署|benchmarking|token/,
  ]],
  ["products", [
    /app|product|agent|workflow|siri|copilot|chatgpt|perplexity|runway|suno|支付寶|產品|應用|Agent|機器人|瀏覽器|搜尋|助手|生成工具|辦公|教育/,
  ]],
  ["industry", [
    /funding|raised|ipo|acquire|acquisition|lawsuit|regulation|policy|white house|pentagon|nvidia|salesforce|meta|microsoft|融資|收購|上市|監管|政策|裁員|估值|債券|晶片|公司|行業|政府|五角大樓|白宮/,
  ]],
];

// AIHOT 聚合器條目按原始平臺粗分類（從 item.source 字串推斷），
// 供社群/自媒體歸類與卡片小標籤複用；無法識別時返回 null，不影響原有主題分類Fallback。
function aihotSubSource(item) {
  if (!item || item.site_id !== "aihot") return null;
  const source = String(item.source || "");
  if (source.includes("公眾號")) return "wechat";
  if (/^X[:：]/.test(source)) return "x";
  if (source.includes("Hacker News")) return "hn";
  if (/（RSS）\s*$/.test(source) || /\(RSS\)\s*$/.test(source)) return "rss";
  return null;
}

// X 作者身份統一：canonical identity = @handle（大小寫不敏感提取，用於篩選/排除重複比較）。
// socialdata_x 的 source 本身就是裸 handle；aihot 轉發的 X 帖子 source 形如 "X：Name (@handle)"。
function itemXAuthorSource(item) {
  if (!item) return null;
  if (item.site_id === "socialdata_x") return String(item.source || "").trim() || null;
  if (aihotSubSource(item) === "x") return String(item.source || "").trim() || null;
  return null;
}

function itemXAuthor(item) {
  const source = itemXAuthorSource(item);
  if (!source) return null;
  const match = source.match(/@([A-Za-z0-9_]+)/);
  return match ? `@${match[1]}` : null;
}

// 展示名：socialdata_x 只有裸 handle；aihot 去掉 "X：" 字首後是更豐富的 "Name (@handle)"。
function itemXAuthorDisplay(item) {
  if (item?.site_id === "socialdata_x") {
    return String(item.source || "").trim() || null;
  }
  if (aihotSubSource(item) === "x") {
    return String(item.source || "").replace(/^X[:：]\s*/, "").trim() || null;
  }
  return null;
}

// 來源形態歸類：自媒體 / 社群（HN + 中文技術社群），只看來源欄位，不看標題內容
function itemSourceGroup(item) {
  const siteId = item.site_id || "";
  const aihotSub = aihotSubSource(item);
  if (aihotSub === "wechat") return "creator";
  if (aihotSub === "hn") return "community";
  const source = `${item.source || ""} ${item.site_name || ""}`.toLowerCase();
  if (
    siteId === "tikhub_douyin" ||
    siteId === "tikhub_xiaohongshu" ||
    source.includes("douyin") ||
    source.includes("xiaohongshu") ||
    source.includes("小紅書") ||
    source.includes("抖音")
  ) return "creator";
  if (
    siteId === "hackernews" ||
    siteId === "zeli" ||
    siteId === "waytoagi" ||
    siteId === "followbuilders" ||
    siteId === "aibase" ||
    source.includes("hacker news") ||
    source.includes("hackernews") ||
    source.includes("hn algolia") ||
    source.includes("it之家") ||
    source.includes("36氪") ||
    source.includes("掘金") ||
    source.includes("readhub") ||
    source.includes("aibase") ||
    source.includes("公眾號") ||
    source.includes("寶玉") ||
    source.includes("小互")
  ) return "community";
  return "other";
}

// 唯一分類入口：自媒體源 → 社群源 → 主題分類（AI_LABEL_SECTION_MAP/SECTION_FALLBACK_RULES）→ Fallback"全部"
// 每條 item 只落一個 tag；無法歸入任何具體欄目的條目只在"全部"裡可見，不強行塞進"行業"。
function itemSection(item) {
  const group = itemSourceGroup(item);
  if (group === "creator") return "creator";
  if (group === "community") return "community";
  const label = item.ai_label || "";
  const mapped = AI_LABEL_SECTION_MAP[label];
  if (mapped) return mapped;
  const hay = itemHaystack(item);
  for (const [sectionId, patterns] of SECTION_FALLBACK_RULES) {
    if (matchesAny(hay, patterns)) return sectionId;
  }
  return "all";
}

function itemMatchesSection(item, sectionId = state.activeSection) {
  return !sectionId || sectionId === "all" || itemSection(item) === sectionId;
}

function sectionBadgeLabel(sectionId) {
  return SECTION_BY_ID[sectionId]?.short || "欄目";
}

// ---- 故事級輔助：按 primary_item（無則第一個 source）判定 ----
function storyRepresentativeItem(story) {
  if (!story) return null;
  if (story.primary_item && (story.primary_item.title || story.primary_item.url)) {
    const primary = story.primary_item;
    // primary_item 常缺 site_id/site_name：從 sources 裡找同 url 的補全
    if (!primary.site_id && Array.isArray(story.sources)) {
      const match = story.sources.find((src) => src.url && src.url === primary.url) || story.sources[0];
      if (match) return { ...match, ...primary, site_id: match.site_id, site_name: match.site_name || match.source_name };
    }
    return primary;
  }
  if (Array.isArray(story.sources) && story.sources.length) return story.sources[0];
  return story;
}

function storySectionOf(story) {
  const rep = storyRepresentativeItem(story);
  return rep ? itemSection(rep) : "all";
}

function storyMatchesSection(story, sectionId = state.activeSection) {
  return !sectionId || sectionId === "all" || storySectionOf(story) === sectionId;
}

function storyMatchesQuery(story, query = state.query.trim().toLowerCase()) {
  if (!query) return true;
  const refs = [
    story,
    story.primary_item,
    ...(Array.isArray(story.sources) ? story.sources : []),
  ].filter(Boolean);
  return refs.some((ref) => {
    const hay = `${ref.title || ""} ${ref.title_zh || ""} ${ref.title_en || ""} ${ref.source || ""} ${ref.source_name || ""} ${ref.site_name || ""}`.toLowerCase();
    return hay.includes(query);
  });
}

// 站點等條目級篩選對映到故事：任意 source 命中即可
function storyMatchesSiteFilter(story) {
  if (!state.siteFilter && !state.authorFilter) return true;
  const refs = [
    storyRepresentativeItem(story),
    ...(Array.isArray(story.sources) ? story.sources : []),
  ].filter(Boolean);
  return refs.some((ref) => {
    if (state.siteFilter && ref.site_id !== state.siteFilter) return false;
    if (state.authorFilter && itemXAuthor(ref) !== state.authorFilter) return false;
    return true;
  });
}

function reasonText(item) {
  const creatorScore = creatorHotScore(item);
  if (creatorScore && itemSourceGroup(item) === "creator") {
    const metrics = item.creator_metrics || {};
    const parts = [
      `贊 ${fmtNumber(metrics.likes)}`,
      `藏 ${fmtNumber(metrics.collects)}`,
      `評 ${fmtNumber(metrics.comments)}`,
      `轉 ${fmtNumber(metrics.shares)}`,
    ];
    if (Number(item.creator_freshness_bonus || 0) > 0) parts.push("24h 加分");
    return `一週互動：${parts.join(" · ")}`;
  }
  const recommendReason = String(item?.recommend_reason_zh || "").trim();
  if (recommendReason) return recommendReason;
  const signals = Array.isArray(item.ai_signals) ? item.ai_signals.filter(Boolean).slice(0, 3) : [];
  if (signals.length) return `命中方向：${signals.join(" / ")}`;
  if (item.ai_relevance_reason) return String(item.ai_relevance_reason).replaceAll("_", " ");
  return "來源與標題訊號透過篩選";
}

function timelineIso(item) {
  const published = item.published_at || "";
  const seen = item.first_seen_at || "";
  const generated = state.generatedAt || "";
  if (published && generated) {
    const publishedMs = new Date(published).getTime();
    const generatedMs = new Date(generated).getTime();
    if (Number.isFinite(publishedMs) && Number.isFinite(generatedMs) && publishedMs > generatedMs + 10 * 60 * 1000) {
      return seen || published;
    }
  }
  return published || seen;
}

function timelineMs(item) {
  const d = new Date(timelineIso(item));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function normalizedEventText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s　]+/g, "")
    .replace(/[，。、“”‘’：:；;！!？?（）()\[\]【】《》<>·.,/\\|_-]/g, "");
}

function eventKey(item) {
  const raw = itemTitleText(item);
  const bracket = raw.match(/《([^》]{4,40})》/);
  if (bracket) return `book:${normalizedEventText(bracket[1]).slice(0, 36)}`;

  const normalized = normalizedEventText(raw);
  const model = normalized.match(/(bitcpmcann|deepseekv\d+(?:pro)?|grokv\d+(?:medium)?|gemini\d+(?:\.\d+)?(?:flash|pro)?|gpt\d+(?:\.\d+)?|llama\d+)/);
  if (model) return `entity:${model[1]}`;

  return `title:${normalized.slice(0, 34)}`;
}

function itemIdentityKeys(item) {
  const keys = new Set();
  if (!item) return keys;
  const url = item.url || item.primary_url;
  if (url) keys.add(`url:${url}`);
  if (item.id) keys.add(`id:${item.id}`);
  const title = item.title_zh || item.title || item.title_en || item.title_original;
  if (title) {
    keys.add(`event:${eventKey({ ...item, title, title_zh: item.title_zh || title })}`);
    keys.add(`title:${normalizedEventText(title).slice(0, 34)}`);
  }
  return keys;
}

function storyIdentityKeys(story) {
  const keys = new Set();
  if (!story) return keys;
  const refs = [
    { id: story.story_id, title: story.title, url: story.primary_url || story.url },
    story.primary_item,
    ...(Array.isArray(story.sources) ? story.sources : []),
    ...(Array.isArray(story.items) ? story.items : []),
  ].filter(Boolean);
  refs.forEach((ref) => {
    itemIdentityKeys(ref).forEach((key) => keys.add(key));
  });
  return keys;
}

function storyHasAnyKey(story, keys) {
  if (!keys || !keys.size) return false;
  for (const key of storyIdentityKeys(story)) {
    if (keys.has(key)) return true;
  }
  return false;
}

function sourceSignal(item) {
  const site = item.site_name || "";
  const source = item.source || "";
  const hay = `${site} ${source}`.toLowerCase();
  if (site === "AI HOT") return "AI HOT精選";
  if (hay.includes("hackernews") || hay.includes("hacker news")) return "HN熱議";
  if (source.includes("GitHub · Trending Today") || hay.includes("github")) return "GitHub趨勢";
  if (site === "Official AI Updates") return "官方更新";
  if (site === "Follow Builders") return "Builders";
  if (site === "TikHub Douyin" || hay.includes("tikhub douyin")) return "抖音自媒體";
  if (site === "TikHub Xiaohongshu" || hay.includes("tikhub xiaohongshu")) return "小紅書自媒體";
  if (site === "AIbase") return "AIbase";
  if (site === "OPML RSS") return "OPML";
  return site || "來源";
}

function storyTimeMs(story, key) {
  const iso = story && story[key];
  if (!iso) return 0;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function storyScore(story) {
  const raw = (story && (story.importance_score ?? story.score ?? story.importance)) || 0;
  const score = Number(raw);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function storyPrimaryTitleText(story) {
  const primary = (story && story.primary_item) || {};
  const explicit = String(primary.title_enhanced_zh || primary.title_zh || "").trim();
  const explicitOriginal = String(primary.title_en || primary.title_original || "").trim();
  if (explicit) return repairDisplayedTitle(explicitOriginal, explicit);
  const bilingual = String(primary.title || (story && story.title) || "").trim();
  if (bilingual.includes(" / ")) {
    const [zh, en] = bilingual.split(" / ");
    return repairDisplayedTitle(explicitOriginal || en, (zh || en || bilingual).trim());
  }
  return bilingual || "未命名更新";
}

function storyPrimaryEnText(story) {
  const primary = (story && story.primary_item) || {};
  const explicit = String(primary.title_en || primary.title_original || "").trim();
  if (isMostlyEnglishTitle(explicit) && explicit !== storyPrimaryTitleText(story)) return explicit;
  const bilingual = String(primary.title || (story && story.title) || "").trim();
  if (bilingual.includes(" / ")) {
    const [, en] = bilingual.split(" / ");
    const original = (en || "").trim();
    return isMostlyEnglishTitle(original) ? original : "";
  }
  return "";
}

function storySourceCount(story) {
  const sources = Array.isArray(story && story.sources) ? story.sources : [];
  const explicit = Number(story && story.duplicate_count);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return Math.max(1, sources.length);
}

// 同一事件展開：source_count>=2 的故事可以展開看每家獨立報道（標題+來源+相對時間）。
// 排除重複：跳過 url 與主條目重複的資訊來源（已經在卡片主體展示過），除非排除重複後一條不剩——
// 那種情況說明所有資訊來源 url 都和主條目一致，只能保留原始 sources 列表Fallback展示。
function dedupedStorySources(row) {
  const story = row && row.story;
  if (!story) return [];
  const sources = Array.isArray(story.sources) ? story.sources : [];
  const primaryUrl = (row.item && row.item.url) || story.primary_url || story.url || "";
  const filtered = primaryUrl ? sources.filter((src) => src && src.url !== primaryUrl) : sources;
  return filtered.length ? filtered : sources;
}

function buildEventSourceRow(source) {
  const row = document.createElement("div");
  row.className = "event-source-row";

  const titleLink = document.createElement("a");
  titleLink.className = "event-source-title";
  titleLink.href = source.url || "#";
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";
  titleLink.textContent = itemTitleText(source);

  const nameEl = document.createElement("span");
  nameEl.className = "event-source-name";
  nameEl.textContent = source.source_name || source.site_name || source.source || "來源";

  const timeEl = document.createElement("span");
  timeEl.className = "event-source-time";
  timeEl.textContent = fmtRelativeTime(timelineMs(source));

  row.append(titleLink, nameEl, timeEl);
  return row;
}

function buildEventSourceList(row) {
  const sources = dedupedStorySources(row);
  if (!sources.length) return null;
  const list = document.createElement("div");
  list.className = "event-expand-list";
  sources.forEach((source) => list.appendChild(buildEventSourceRow(source)));
  return list;
}

const PERSONA_NAMES = { pragmatic: "實用派", cynic: "毒舌評論員", "paper-police": "較真黨" };

// 三口味 persona 的網頁展示暫時下線（2026-07-15 歸檔，樣式待重設計，見 docs/ROADMAP.md）。
// 資料Pipeline（persona_score.py）與 Skill 端不受影響；置回 true 即恢復 TOP3 板塊與卡片銳評行。
const PERSONA_UI_ENABLED = false;

// 銳評欄位（persona_review/persona_id）由 persona_score.py 只寫進 daily-brief.json；
// 主列表/熱點榜的 story 物件來自 stories-merged.json，天然沒有這兩個欄位，
// 必須按 story_id 回查每日精選才能拿到銳評。
let _briefByIdCache = null;
function briefStoryById(storyId) {
  if (!storyId) return null;
  if (!_briefByIdCache) {
    _briefByIdCache = new Map();
    briefStories().forEach((s) => {
      if (s && s.story_id) _briefByIdCache.set(s.story_id, s);
    });
  }
  return _briefByIdCache.get(storyId) || null;
}

function buildStoryPersonaLine(story) {
  let source = story;
  let reviewText = typeof story?.persona_review === "string" ? story.persona_review.trim() : "";
  if (!reviewText) {
    source = briefStoryById(story?.story_id);
    reviewText = typeof source?.persona_review === "string" ? source.persona_review.trim() : "";
  }
  if (!reviewText) return null;
  const line = document.createElement("div");
  line.className = "story-persona";
  const label = document.createElement("span");
  label.className = "story-persona-label";
  label.textContent = PERSONA_NAMES[source?.persona_id] || PERSONA_NAMES.pragmatic;
  const text = document.createElement("span");
  text.className = "story-persona-text";
  text.textContent = reviewText;
  line.append(label, text);
  return line;
}

function findTop3PersonaEntry(storyId) {
  if (!storyId) return null;
  const items = state.top3Personas?.items;
  if (!Array.isArray(items) || !items.length) return null;
  return items.find((entry) => entry && entry.story_id === storyId) || null;
}

function buildPersonaPanel(entry) {
  const reviews = entry?.reviews;
  if (!reviews || typeof reviews !== "object") return null;
  const panel = document.createElement("div");
  panel.className = "persona-panel";
  let cols = 0;
  Object.keys(PERSONA_NAMES).forEach((personaId) => {
    const review = reviews[personaId];
    if (!review || typeof review.review !== "string" || !review.review.trim()) return;
    const col = document.createElement("div");
    col.className = "persona-col";
    col.dataset.persona = personaId;
    const name = document.createElement("span");
    name.className = "persona-name";
    name.textContent = PERSONA_NAMES[personaId];
    const score = document.createElement("strong");
    score.className = "persona-score";
    score.textContent = Number.isFinite(Number(review.score)) ? String(review.score) : "-";
    const text = document.createElement("p");
    text.className = "persona-review";
    text.textContent = review.review.trim();
    col.append(name, score, text);
    panel.appendChild(col);
    cols += 1;
  });
  return cols > 0 ? panel : null;
}

const HOT_DECAY_HOURS = 12;
const HOT_SCORE_SCALE = 60;

function storyHotness(story) {
  const sources = storySourceCount(story);
  if (sources < 2) return 0;
  const latest = storyTimeMs(story, "latest_at") || storyTimeMs(story, "earliest_at");
  const ageHours = latest ? Math.max(0, (Date.now() - latest) / 3600000) : 24;
  return (sources - 1) * Math.exp(-ageHours / HOT_DECAY_HOURS);
}

function storyHotScore(story) {
  const raw = storyHotness(story);
  if (raw <= 0) return 0;
  return Math.max(1, Math.min(100, Math.round(raw * HOT_SCORE_SCALE)));
}

function hotStories(stories) {
  return stories
    .filter((story) => storyHotness(story) > 0)
    .sort((a, b) => {
      const byHotScore = storyHotScore(b) - storyHotScore(a);
      if (byHotScore !== 0) return byHotScore;
      const byHotRaw = storyHotness(b) - storyHotness(a);
      if (byHotRaw !== 0) return byHotRaw;
      const byEditorial = storyScore(b) - storyScore(a);
      if (byEditorial !== 0) return byEditorial;
      return storyTimeMs(b, "latest_at") - storyTimeMs(a, "latest_at");
    });
}

const HOT_BOARD_LIMIT = 20;

function briefStories() {
  return (Array.isArray(state.dailyBrief?.items) ? state.dailyBrief.items : []).filter((story) => !isUnsafeStory(story));
}

function mergedStories() {
  return (Array.isArray(state.storiesMerged?.stories) ? state.storiesMerged.stories : []).filter((story) => !isUnsafeStory(story));
}

// 精選徽章：故事命中每日精選（daily-brief.json）即視為"精選"來源，與分數徽章分開顯示
let _briefIdentityKeyCache = null;
function briefIdentityKeySet() {
  if (_briefIdentityKeyCache) return _briefIdentityKeyCache;
  const keys = new Set();
  briefStories().forEach((story) => storyIdentityKeys(story).forEach((key) => keys.add(key)));
  _briefIdentityKeyCache = keys;
  return keys;
}
function isStoryCurated(story) {
  return storyHasAnyKey(story, briefIdentityKeySet());
}
function isCuratedSourceRef(ref) {
  if (!ref) return false;
  return ref.site_id === "official_ai" || ref.site_id === "aihot" || ref.source_tier === "official" || ref.source_tier === "curated";
}

// 熱點排行區候選池：stories-merged 中 source_count>=2，按熱度降序（不含欄目過濾，供 tab 計數複用）
function hotBoardStories() {
  return hotStories(mergedStories().filter((story) =>
    storySourceCount(story) >= 2 &&
    storyMatchesSiteFilter(story) &&
    storyMatchesQuery(story)));
}

function hotBoardEntries() {
  if (state.mode !== "selected") return [];
  return hotBoardStories()
    .filter((story) => storyMatchesSection(story))
    .slice(0, HOT_BOARD_LIMIT)
    .map((story, index) => storyToRow(story, index));
}

// ---- 主列表資料池：精選模式=mergedStories() 全量（純時間倒序），全量模式=原始條目池 ----

function mainListStoriesBase() {
  return mergedStories().filter((story) => storyMatchesSiteFilter(story) && storyMatchesQuery(story));
}

function mainListRawItemsBase() {
  const q = state.query.trim().toLowerCase();
  return effectiveAllItems().filter((item) => {
    if (state.siteFilter && item.site_id !== state.siteFilter) return false;
    if (state.authorFilter && itemXAuthor(item) !== state.authorFilter) return false;
    if (!q) return true;
    return itemHaystack(item).includes(q);
  });
}

function mainListStories() {
  return mainListStoriesBase().filter((story) => storyMatchesSection(story));
}

function mainListRawItems() {
  return mainListRawItemsBase().filter((item) => itemMatchesSection(item));
}

// 故事 → 統一行模型（供 renderItemNode 消費）：代表條目 + 全部資訊來源訊號 + 故事引用
function storyToRow(story, index = 0) {
  const enrichStoryItem = (entry) => ({
    ...entry,
    site_name: entry.site_name || entry.source_name || story.source_name || "",
  });
  const item = enrichStoryItem(storyRepresentativeItem(story) || story);
  const sourceItems = [
    item,
    ...(Array.isArray(story.sources) ? story.sources.map(enrichStoryItem) : []),
  ].filter(Boolean);
  const sourceSignals = Array.from(new Set(sourceItems.map(sourceSignal)));
  return {
    item,
    index,
    story,
    rows: sourceItems.map((sourceItem) => ({ item: sourceItem })),
    sourceSignals,
    sourceCount: storySourceCount(story),
    mergedCount: Math.max(1, Number(story.duplicate_count) || sourceItems.length),
    score: storyScore(story),
  };
}

// 原始條目 → 統一行模型：無故事引用，渲染時優雅降級（不展示精選徽章/分數/為什麼重要）
function itemToRow(item, index = 0) {
  return {
    item,
    index,
    story: null,
    rows: [{ item }],
    sourceSignals: [sourceSignal(item)],
    sourceCount: 1,
    mergedCount: 1,
    score: 0,
  };
}

function mainListEntries() {
  if (state.mode === "all") {
    return mainListRawItems().map((item, index) => {
      const ms = timelineMs(item);
      return { row: itemToRow(item, index), timeMs: ms };
    }).sort((a, b) => b.timeMs - a.timeMs);
  }
  return mainListStories().map((story, index) => {
    const ms = storyTimeMs(story, "latest_at") || storyTimeMs(story, "earliest_at");
    return { row: storyToRow(story, index), timeMs: ms };
  }).sort((a, b) => b.timeMs - a.timeMs);
}

function dateGroupKey(ms) {
  if (!ms) return "unknown";
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateGroupLabel(ms) {
  if (!ms) return "時間未知";
  const d = new Date(ms);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("zh-CN", sameYear
    ? { month: "long", day: "numeric" }
    : { year: "numeric", month: "long", day: "numeric" }).format(d);
}

function dateGroupWeekday(ms) {
  if (!ms) return "";
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(new Date(ms));
}

function itemSourceRefs(item, row = null) {
  const refs = [];
  const seen = new Set();
  const add = (label, tone) => {
    const clean = String(label || "").trim();
    if (!clean) return;
    const key = `${tone}:${clean}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ label: clean, tone });
  };

  if (row && Array.isArray(row.sourceSignals) && row.sourceSignals.length) {
    row.sourceSignals.forEach((signal) => add(signal, sourceSignalTone(signal)));
  } else if (row && Array.isArray(row.rows) && row.rows.length) {
    row.rows.forEach((entry) => {
      const sourceItem = entry.item || {};
      const kind = sourceKind(sourceItem.site_id);
      add(sourceItem.source || sourceItem.site_name || kind.label, kind.tone);
    });
  } else {
    const kind = sourceKind(item.site_id);
    add(item.source || item.site_name || kind.label, kind.tone);
  }

  return refs.length ? refs : [{ label: "來源", tone: "default" }];
}

function rowSourceCount(row) {
  const item = row.item || {};
  const refs = itemSourceRefs(item, row);
  const storyCount = row.story ? storySourceCount(row.story) : 0;
  return Math.max(1, refs.length, Number(row.sourceCount || 0), Number(row.mergedCount || 0), storyCount);
}

function signalSummaryText(row) {
  const item = row.item || {};
  const story = row.story || {};
  const editorialSummary = itemSummaryText(item) || itemSummaryText(story.primary_item || {});
  if (editorialSummary) return editorialSummary;
  const reason = reasonText(item);
  if (reason && !reason.startsWith("來源與標題")) return reason.replace(/^命中方向：/, "核心方向：");
  return "";
}

// 只返回真實的、條目級別的推薦理由（item.recommend_reason_zh 或 story.primary_item.recommend_reason_zh）。
// 這類資料是預算受限的窄池，多數條目沒有——沒有真實理由時必須返回空字串，
// 不再用分割槽/來源訊號拼出通用模板句子（那類句子讀起來像針對該條目的判斷，實際是套話，參見呼叫方 renderItemNode 的隱藏邏輯）。
function whyImportantText(row) {
  const item = row.item || {};
  const story = row.story || {};
  const recommendReason = String(
    item.recommend_reason_zh || story.primary_item?.recommend_reason_zh || ""
  ).trim();
  return recommendReason;
}

function feedSummaryText(item) {
  const editorialSummary = itemSummaryText(item);
  if (editorialSummary) return editorialSummary;
  const signals = Array.isArray(item.ai_signals) ? item.ai_signals.filter(Boolean).slice(0, 2) : [];
  if (signals.length) return `相關線索：${signals.join(" / ")}。`;
  const reason = reasonText(item);
  if (reason && !reason.startsWith("來源與標題")) return reason.replace(/^命中方向：/, "相關線索：");
  return "";
}

// 共享卡片元件：唯一渲染入口，主列表（精選/全量）共用同一基礎變體。
// row.story 存在時展示精選徽章/分數/為什麼重要/persona 面板；row.story 為空（全量原始條目）時優雅降級，跳過這些區塊。
// 熱點排行區改用 buildHotRow（單行行式渲染），不再走這個卡片模板。
function renderItemNode(row) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  const item = row.item || {};

  const metaRow = node.querySelector(".meta-row");

  const curatedEl = node.querySelector(".curated-badge");
  const curatedRefs = [item, ...(row.story && Array.isArray(row.story.sources) ? row.story.sources : [])];
  const curated = (row.story && isStoryCurated(row.story)) || curatedRefs.some(isCuratedSourceRef);
  curatedEl.hidden = !curated;

  const siteEl = node.querySelector(".site");
  siteEl.textContent = item.source || item.site_name || "";

  const sourceEl = node.querySelector(".source");
  const sourceLabel = sourceSignal(item);
  setSourceBadge(sourceEl, sourceLabel, sourceSignalTone(sourceLabel), item.source ? `分割槽: ${item.source}` : "");
  if (rowSourceCount(row) > 1) {
    sourceEl.title = `${sourceEl.title || ""} · 共 ${fmtNumber(rowSourceCount(row))} 個來源`.replace(/^ · /, "");
  }

  // aihot 子來源 chip（X/公眾號/HN/RSS）緊跟通道 chip（.source）之後，色調複用既有 .category.kind-* 規則，不新增樣式。
  let metaAnchorEl = sourceEl;
  const aihotSub = aihotSubSource(item);
  if (aihotSub) {
    const subChip = document.createElement("span");
    subChip.className = `category kind-${AIHOT_SUB_TONES[aihotSub]}`;
    subChip.textContent = AIHOT_SUB_LABELS[aihotSub];
    metaAnchorEl.insertAdjacentElement("afterend", subChip);
    metaAnchorEl = subChip;
  }

  // 多源 chip：source_count>=2 時出現，緊跟通道/子來源 chip 之後，同時充當"同一事件"展開/收起觸發器
  // （取代舊的獨立 event-expand-toggle）。子列表掛在 news-card-body 末尾，首次點選才建 DOM，之後本地 toggle。
  if (row.story && storySourceCount(row.story) >= 2) {
    const bodyEl = node.querySelector(".news-card-body") || node;
    const eventCount = storySourceCount(row.story);
    const collapsedLabel = `多源 ${fmtNumber(eventCount)} ▸`;
    const expandedLabel = `多源 ${fmtNumber(eventCount)} ▾`;
    const multiChip = document.createElement("button");
    multiChip.type = "button";
    multiChip.className = "multi-chip";
    multiChip.textContent = collapsedLabel;
    multiChip.setAttribute("aria-expanded", "false");
    let eventList = null;
    multiChip.addEventListener("click", () => {
      const expanded = multiChip.getAttribute("aria-expanded") === "true";
      if (expanded) {
        if (eventList) eventList.hidden = true;
        multiChip.setAttribute("aria-expanded", "false");
        multiChip.textContent = collapsedLabel;
        return;
      }
      if (!eventList) {
        eventList = buildEventSourceList(row);
        if (eventList) bodyEl.appendChild(eventList);
      }
      if (!eventList) return;
      eventList.hidden = false;
      multiChip.setAttribute("aria-expanded", "true");
      multiChip.textContent = expandedLabel;
    });
    metaAnchorEl.insertAdjacentElement("afterend", multiChip);
  }

  const scoreEl = node.querySelector(".score-badge");
  const displayScore = row.score;
  if (displayScore > 0) {
    scoreEl.hidden = false;
    scoreEl.textContent = `${displayScore} 分`;
    scoreEl.className = `score-badge tone-${scoreTone(displayScore)}`;
  } else {
    scoreEl.hidden = true;
  }

  // 欄目 chip（行業/模型/產品...）是 meta-row 的最後一個 chip，appendChild 保證排在 score-badge 之後、
  // 在下面的"檢視原文"連結（margin-left: auto 靠右）之前。
  const sectionChip = itemTagChip(sectionBadgeLabel(itemSection(item)));
  metaRow.appendChild(sectionChip);

  const titleEl = node.querySelector(".title");
  const displayTitle = row.story ? storyPrimaryTitleText(row.story) : itemTitleText(item);
  const originalTitle = row.story ? storyPrimaryEnText(row.story) : itemOriginalTitleText(item);
  titleEl.textContent = "";
  if (originalTitle) {
    const primary = document.createElement("span");
    primary.textContent = displayTitle;
    const sub = document.createElement("span");
    sub.className = "title-sub";
    sub.textContent = originalTitle;
    titleEl.appendChild(primary);
    titleEl.appendChild(sub);
  } else {
    titleEl.textContent = displayTitle;
  }
  titleEl.href = item.url || row.story?.primary_url || row.story?.url || "#";

  const summaryEl = node.querySelector(".news-summary");
  if (summaryEl) {
    const summaryText = row.story ? signalSummaryText(row) : feedSummaryText(item);
    summaryEl.textContent = summaryText;
    summaryEl.hidden = !summaryText;
  }

  const whyBox = node.querySelector(".why-box");
  const whyText = row.story ? whyImportantText(row) : "";
  if (whyText) {
    whyBox.hidden = false;
    node.querySelector(".why-text").textContent = whyText;
  } else {
    whyBox.hidden = true;
  }

  const personaSlot = node.querySelector(".persona-slot");
  if (row.story && PERSONA_UI_ENABLED) {
    const personaEntry = findTop3PersonaEntry(row.story.story_id);
    const personaPanel = buildPersonaPanel(personaEntry);
    if (personaPanel) {
      // TOP3 三口味面板已含預設口味整列，再顯示單條銳評行就是原句重複
      personaSlot.appendChild(personaPanel);
    } else {
      const personaLine = buildStoryPersonaLine(row.story);
      if (personaLine) personaSlot.appendChild(personaLine);
    }
  }

  const originalLink = document.createElement("a");
  originalLink.className = "original-link original-action";
  originalLink.href = item.url || row.story?.primary_url || row.story?.url || "#";
  originalLink.target = "_blank";
  originalLink.rel = "noopener noreferrer";
  originalLink.textContent = "檢視原文 ↗";
  metaRow.appendChild(originalLink);

  return node;
}

// 熱點排行區：一行一條（rank + 標題連結 + 資訊來源數 · 相對時間），不復用卡片模板——
// 避免和下方精選列表的完整卡片重複展示摘要/標籤/為什麼重要。
function buildHotRow(row, rank) {
  const item = row.item || {};
  const el = document.createElement("div");
  el.className = "hot-row";

  const rankEl = document.createElement("span");
  rankEl.className = "hot-row-rank";
  rankEl.textContent = `#${rank}`;

  const titleEl = document.createElement("a");
  titleEl.className = "hot-row-title";
  titleEl.target = "_blank";
  titleEl.rel = "noopener noreferrer";
  const displayTitle = row.story ? storyPrimaryTitleText(row.story) : itemTitleText(item);
  titleEl.textContent = displayTitle;
  titleEl.title = displayTitle;
  titleEl.href = item.url || row.story?.primary_url || row.story?.url || "#";

  const metaEl = document.createElement("span");
  metaEl.className = "hot-row-meta";
  const sourceCount = rowSourceCount(row);
  const relTime = fmtRelativeTime(timelineMs(item) || storyTimeMs(row.story, "latest_at"));

  // 同一事件展開：熱點行的"N 個資訊來源"變成可點選項，點選在 .hot-row 正下方插入/移除同一份子列表元件。
  const expandable = row.story && storySourceCount(row.story) >= 2;
  if (expandable) {
    const sourceToggle = document.createElement("button");
    sourceToggle.type = "button";
    sourceToggle.className = "hot-row-source-toggle";
    sourceToggle.textContent = `${fmtNumber(sourceCount)} 個資訊來源`;
    sourceToggle.setAttribute("aria-expanded", "false");
    let sourceList = null;
    sourceToggle.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (sourceList) {
        sourceList.remove();
        sourceList = null;
        sourceToggle.setAttribute("aria-expanded", "false");
        return;
      }
      sourceList = buildEventSourceList(row);
      if (!sourceList) return;
      sourceList.classList.add("hot-row-source-list");
      sourceToggle.setAttribute("aria-expanded", "true");
      el.insertAdjacentElement("afterend", sourceList);
    });
    const sep = document.createElement("span");
    sep.textContent = " · ";
    const timeEl = document.createElement("span");
    timeEl.textContent = relTime;
    metaEl.append(sourceToggle, sep, timeEl);
  } else {
    metaEl.textContent = `${fmtNumber(sourceCount)} 個資訊來源 · ${relTime}`;
  }

  el.append(rankEl, titleEl, metaEl);
  return el;
}

function renderLoadingNotice(label, count) {
  const loading = document.createElement("div");
  loading.className = "list-loading";
  loading.textContent = `正在整理 ${label} · ${fmtNumber(count)} 條`;
  newsListEl.appendChild(loading);
}

function addLoadMoreButton(parent, label, onClick) {
  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.className = "list-more-btn";
  moreBtn.textContent = label;
  moreBtn.addEventListener("click", onClick);
  parent.appendChild(moreBtn);
  return moreBtn;
}

// Mobile-safe async rendering: avoid blocking the main thread on large lists.
// requestAnimationFrame 在後臺標籤頁不觸發，hidden 時降級 setTimeout，避免列表卡在載入態。
function scheduleRender(cb) {
  if (document.hidden) {
    setTimeout(cb, 0);
  } else {
    requestAnimationFrame(cb);
  }
}
let _renderListToken = 0;
const MAIN_LIST_PAGE_SIZE = 60;
state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;

// 主列表：純時間倒序 + 按日期分組渲染，精選/全量兩種模式共用同一套模板。
function renderMainList() {
  const entries = mainListEntries();
  resultCountEl.textContent = `${fmtNumber(entries.length)} 條`;
  renderClearFiltersButton();
  if (modeHintEl) {
    modeHintEl.textContent = `${modeLabelText()} ${fmtNumber(entries.length)} 條`;
    modeHintEl.setAttribute("aria-label", `當前${modeLabelText()}模式，${fmtNumber(entries.length)} 條`);
  }

  newsListEl.innerHTML = "";
  _renderListToken += 1;
  const token = _renderListToken;

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const title = document.createElement("h3");
    title.textContent = "沒有找到匹配內容";
    const message = document.createElement("p");
    message.textContent = "可以換個關鍵詞，或一鍵恢復預設檢視。";
    empty.append(title, message);
    if (activeAdjustmentCount()) {
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "empty-reset-btn";
      reset.textContent = "清除篩選，檢視全部";
      reset.addEventListener("click", clearAllFilters);
      empty.appendChild(reset);
    }
    newsListEl.appendChild(empty);
    return;
  }

  renderLoadingNotice(listTitleText(), entries.length);
  scheduleRender(() => {
    if (token !== _renderListToken) return;
    newsListEl.innerHTML = "";
    const visibleCount = Math.max(MAIN_LIST_PAGE_SIZE, state.mainListVisibleCount || MAIN_LIST_PAGE_SIZE);
    const visible = entries.slice(0, visibleCount);
    const dateGroupCounts = new Map();
    visible.forEach(({ timeMs }) => {
      const key = dateGroupKey(timeMs);
      dateGroupCounts.set(key, (dateGroupCounts.get(key) || 0) + 1);
    });
    let lastKey = null;
    const frag = document.createDocumentFragment();
    visible.forEach(({ row, timeMs }) => {
      const key = dateGroupKey(timeMs);
      if (key !== lastKey) {
        const header = document.createElement("div");
        header.className = "date-group-header";
        const dateLabel = document.createElement("span");
        dateLabel.textContent = dateGroupLabel(timeMs);
        header.appendChild(dateLabel);
        const weekday = dateGroupWeekday(timeMs);
        const count = dateGroupCounts.get(key) || 0;
        const meta = document.createElement("span");
        meta.className = "date-group-meta";
        meta.textContent = weekday ? `· ${weekday} · ${fmtNumber(count)} 條` : `· ${fmtNumber(count)} 條`;
        header.appendChild(meta);
        frag.appendChild(header);
        lastKey = key;
      }
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      const rail = document.createElement("div");
      rail.className = "timeline-rail";
      const timeLabel = document.createElement("span");
      timeLabel.className = "timeline-time";
      timeLabel.textContent = fmtHHMM(timeMs);
      const dot = document.createElement("span");
      dot.className = "timeline-dot";
      rail.append(timeLabel, dot);
      timelineItem.appendChild(rail);
      timelineItem.appendChild(renderItemNode(row));
      frag.appendChild(timelineItem);
    });
    newsListEl.appendChild(frag);
    if (entries.length > visible.length) {
      addLoadMoreButton(
        newsListEl,
        `展開更多 ${fmtNumber(entries.length - visible.length)} 條`,
        () => {
          state.mainListVisibleCount = visibleCount + MAIN_LIST_PAGE_SIZE;
          renderMainList();
        },
      );
    }
    document.dispatchEvent(new CustomEvent("aiRadar:listRendered"));
  });
}

function top3BoardEntries() {
  if (state.mode !== "selected") return [];
  const t3 = state.top3Personas?.items;
  if (!Array.isArray(t3) || !t3.length) return [];
  const byId = new Map(mergedStories().map((s) => [s.story_id, s]));
  return t3
    .slice()
    .sort((a, b) => (Number(a.rank) || 0) - (Number(b.rank) || 0))
    .map((entry) => byId.get(entry?.story_id))
    .filter(Boolean)
    .map((story, index) => storyToRow(story, index));
}

// 今日 TOP3 板塊：三口味並排銳評的固定展示入口。TOP3 卡片在主列表裡按時間排序，
// 常沉在幾屏之外（使用者翻不到，面板等於隱身），所以命中 top3-personas.json 的故事在這裡置頂再展示一次。
function renderTop3Board() {
  if (!top3BoardListEl) return;
  const rows = PERSONA_UI_ENABLED ? top3BoardEntries() : [];
  const show = rows.length > 0;
  if (top3BoardWrapEl) top3BoardWrapEl.hidden = !show;
  if (!show) return;
  if (top3BoardMetaEl) top3BoardMetaEl.textContent = Object.values(PERSONA_NAMES).join(" · ");
  top3BoardListEl.innerHTML = "";
  rows.forEach((row) => top3BoardListEl.appendChild(renderItemNode(row)));
}

// 熱點排行區：不設固定條數，展示條數取決於當前有多少條滿足多資訊來源熱度閾值（HOT_BOARD_LIMIT 只是技術Fallback）。
function renderHotBoard() {
  renderTop3Board();
  if (!hotBoardListEl) return;
  const show = state.mode === "selected";
  if (hotBoardWrapEl) hotBoardWrapEl.hidden = !show;
  if (!show) return;
  hotBoardListEl.innerHTML = "";

  const rows = hotBoardEntries();
  if (hotBoardMetaEl) {
    hotBoardMetaEl.textContent = rows.length
      ? `當前 ${fmtNumber(rows.length)} 條熱點 · 按熱度降序`
      : "按熱度排序";
  }

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "bole-empty";
    empty.textContent = "當前篩選下沒有 2 個以上資訊來源交叉的熱點，可切換篩選或檢視全量。";
    hotBoardListEl.appendChild(empty);
    return;
  }

  rows.forEach((row, index) => {
    hotBoardListEl.appendChild(buildHotRow(row, index + 1));
  });
}

function rerenderCurrentView() {
  state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
  renderSectionTabs();
  renderModeSwitch();
  renderSiteFilters();
  renderHotBoard();
  if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  renderMainList();
}

function waytoagiViews(waytoagi) {
  const updates7d = Array.isArray(waytoagi?.updates_7d) ? waytoagi.updates_7d : [];
  const latestDate = waytoagi?.latest_date || (updates7d.length ? updates7d[0].date : null);
  const updatesToday = Array.isArray(waytoagi?.updates_today) && waytoagi.updates_today.length
    ? waytoagi.updates_today
    : (latestDate ? updates7d.filter((u) => u.date === latestDate) : []);
  return { updates7d, updatesToday, latestDate };
}

function renderWaytoagi(waytoagi) {
  // 內容 tab 已收斂為單層：WaytoAGI 面板跟隨「社群」tab 顯示（合併了原來源形態 cn 分組）
  if (waytoagiWrapEl) {
    waytoagiWrapEl.hidden = state.activeSection !== "community";
  }
  if (state.activeSection !== "community") return;
  const { updates7d, updatesToday, latestDate } = waytoagiViews(waytoagi);
  if (waytoagiTodayBtnEl) waytoagiTodayBtnEl.classList.toggle("active", state.waytoagiMode === "today");
  if (waytoagi7dBtnEl) waytoagi7dBtnEl.classList.toggle("active", state.waytoagiMode === "7d");
  if (waytoagiTodayBtnEl) waytoagiTodayBtnEl.setAttribute("aria-pressed", state.waytoagiMode === "today" ? "true" : "false");
  if (waytoagi7dBtnEl) waytoagi7dBtnEl.setAttribute("aria-pressed", state.waytoagiMode === "7d" ? "true" : "false");
  waytoagiUpdatedAtEl.textContent = `更新時間：${fmtTime(waytoagi.generated_at)}`;

  waytoagiMetaEl.innerHTML = "";
  const rootLink = document.createElement("a");
  rootLink.href = waytoagi.root_url || "#";
  rootLink.target = "_blank";
  rootLink.rel = "noopener noreferrer";
  rootLink.textContent = "主頁面";
  const historyLink = document.createElement("a");
  historyLink.href = waytoagi.history_url || "#";
  historyLink.target = "_blank";
  historyLink.rel = "noopener noreferrer";
  historyLink.textContent = "歷史更新頁";
  const todayCount = document.createElement("span");
  todayCount.textContent = `最近更新日(${latestDate || "--"})：${fmtNumber(waytoagi.count_today || updatesToday.length)} 條`;
  const weekCount = document.createElement("span");
  weekCount.textContent = `近 7 日：${fmtNumber(waytoagi.count_7d || updates7d.length)} 條`;
  [rootLink, "·", historyLink, "·", todayCount, "·", weekCount].forEach((part) => {
    if (typeof part === "string") {
      const sep = document.createElement("span");
      sep.textContent = part;
      waytoagiMetaEl.appendChild(sep);
    } else {
      waytoagiMetaEl.appendChild(part);
    }
  });

  waytoagiListEl.innerHTML = "";
  if (waytoagi.has_error) {
    const div = document.createElement("div");
    div.className = "waytoagi-error";
    div.textContent = waytoagi.error || "WaytoAGI 資料載入失敗";
    waytoagiListEl.appendChild(div);
    return;
  }

  const updates = state.waytoagiMode === "today" ? updatesToday : updates7d;
  if (!updates.length) {
    const div = document.createElement("div");
    div.className = "waytoagi-empty";
    div.textContent = state.waytoagiMode === "today"
      ? "最近更新日沒有更新，可切換到近7日檢視。"
      : (waytoagi.warning || "近 7 日沒有更新");
    waytoagiListEl.appendChild(div);
    return;
  }

  updates.forEach((u) => {
    const row = document.createElement("a");
    row.className = "waytoagi-item";
    row.href = u.url || "#";
    row.target = "_blank";
    row.rel = "noopener noreferrer";
    const dateEl = document.createElement("span");
    dateEl.className = "d";
    dateEl.textContent = fmtDate(u.date);
    const titleEl = document.createElement("span");
    titleEl.className = "t";
    titleEl.textContent = u.title;
    row.append(dateEl, titleEl);
    waytoagiListEl.appendChild(row);
  });
}

// 按 @handle 排除重複後的 X 作者列表：{ handle, display }，display 優先取 aihot 的
// "Name (@handle)" 富格式，沒有的話退回 socialdata_x 的裸 handle。
function socialdataAuthors() {
  const byHandle = new Map();
  state.itemsAi.forEach((item) => {
    const handle = itemXAuthor(item);
    if (!handle) return;
    const display = itemXAuthorDisplay(item);
    if (!display) return;
    const isRich = item.site_id === "aihot";
    const existing = byHandle.get(handle);
    if (!existing || (isRich && !existing.rich)) {
      byHandle.set(handle, { handle, display, rich: isRich });
    }
  });
  return Array.from(byHandle.values())
    .map(({ handle, display }) => ({ handle, display }))
    .sort((a, b) => a.display.localeCompare(b.display, "en"));
}

function selectSocialdataAuthor(author) {
  state.authorFilter = author;
  // 作者身份現在橫跨 socialdata_x 與 aihot-x 兩個 site_id（見 itemXAuthor），
  // 不能再鎖死 siteFilter="socialdata_x"，否則會把該作者的 aihot 轉發條目過濾掉。
  // authorFilter 本身已經是跨站點的精確匹配，siteFilter 留空即可。
  state.siteFilter = "";
  // 博主篩選是條目級過濾：切到全量模式瀏覽該博主的原始條目池，並清空欄目選擇
  state.activeSection = "all";
  state.mode = "all";
  state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
  state.xAuthorsExpanded = false;
  renderSectionTabs();
  renderModeSwitch();
  renderSiteFilters();
  renderHotBoard();
  renderMainList();
  renderSourceHealth();
  document.querySelector(".list-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSocialdataAuthorList(authors, itemCount) {
  const panel = document.createElement("section");
  panel.className = "health-author-list";
  const heading = document.createElement("div");
  heading.className = "health-author-list-title";
  heading.textContent = "本輪 X 掃到的博主";
  const meta = document.createElement("div");
  meta.className = "health-author-list-meta";
  meta.textContent = `${fmtNumber(authors.length)} 位博主 · ${fmtNumber(itemCount)} 條入池內容`;
  const list = document.createElement("div");
  list.className = "health-author-list-items";
  authors.forEach(({ handle, display }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = display;
    item.title = `檢視 ${display} 的 X 內容`;
    item.addEventListener("click", () => selectSocialdataAuthor(handle));
    list.appendChild(item);
  });
  panel.append(heading, meta, list);
  return panel;
}

function renderSourceHealthSummaryNode(status, errorMessage = "") {
  const node = document.createElement("div");
  node.className = "source-health-summary";
  if (!status) {
    node.classList.add(errorMessage ? "bad" : "warn");
    node.innerHTML = `<strong>${errorMessage ? "源狀態異常" : "源狀態未生成"}</strong><span>${errorMessage || "等待 source-status.json"}</span>`;
    return node;
  }
  const sites = Array.isArray(status.sites) ? status.sites : [];
  const okSites = Number(status.successful_sites || 0);
  const failed = failedSourceCount(status);
  // 與 renderSourceStatusTable 同口徑：pooled = 全網抓取入池（去話題過濾前），
  // fetched = 原始抓取總量，aiRelevant = 24h AI 強相關合並池。
  const pooled = Number(status.items_before_topic_filter || state.totalAllMode || state.itemsAll.length || 0);
  const fetched = Number(status.fetched_raw_items || state.totalRaw || pooled || 0);
  const aiRelevant = safeItems(state.itemsAi).length;
  node.classList.toggle("warn", failed > 0);
  const segments = [];
  if (fetched) segments.push(`今日採集 ${fmtNumber(fetched)} 條`);
  if (pooled) segments.push(`入池 ${fmtNumber(pooled)}`);
  if (aiRelevant) segments.push(`AI 強相關 ${fmtNumber(aiRelevant)}`);
  segments.push(failed > 0
    ? `<span class="source-health-fail-bad">失敗 ${fmtNumber(failed)}</span>`
    : `失敗 ${fmtNumber(failed)}`);
  node.innerHTML = `<strong>${fmtNumber(okSites)}/${fmtNumber(sites.length)} 源正常</strong><span>${segments.join(" · ")}</span>`;
  return node;
}

// Fallback tier ranks mirroring SOURCE_TIER_BY_SITE in scripts/update_news.py.
// Items carry source_tier_rank and that data-derived value wins; this table
// only covers sites with zero loaded items (rank otherwise unknowable).
const SITE_TIER_RANK_FALLBACK = {
  official_ai: 0,
  aibreakfast: 1,
  aihubtoday: 1,
  aibase: 1,
  aihot: 1,
  bestblogs: 1,
  curated_media: 2,
  waytoagi: 2,
  followbuilders: 2,
  opmlrss: 3,
  tikhub_douyin: 4,
  tikhub_xiaohongshu: 4,
  xapi: 4,
  socialdata_x: 4,
  techurls: 5,
  buzzing: 5,
  iris: 5,
  zeli: 5,
  hackernews: 5,
  newsnow: 5,
};

function siteTierRankMap() {
  // source_tier_rank ships on every pipeline item (items_ai / items_all);
  // aggregate one rank per site from whatever is loaded so the source table
  // can sort official tiers first without a duplicated constant table.
  const m = new Map();
  const pools = [safeItems(state.itemsAi), safeItems(state.itemsAll), safeItems(state.itemsAllRaw)];
  pools.forEach((items) => {
    items.forEach((item) => {
      if (!item || !item.site_id || m.has(item.site_id)) return;
      const rank = Number(item.source_tier_rank);
      if (Number.isFinite(rank)) m.set(item.site_id, rank);
    });
  });
  return m;
}

function renderSourceStatusTable(status) {
  if (!sourceStatusTableEl) return;
  sourceStatusTableEl.innerHTML = "";
  if (!status || !Array.isArray(status.sites) || !status.sites.length) return;

  const tierRanks = siteTierRankMap();
  const rows = status.sites
    .map((site) => {
      const ai = aiSiteStat(site.site_id);
      const aiCount = Number(ai?.count || 0);
      const rawCount = Number(ai?.raw_count ?? site.item_count ?? 0);
      const scanned = Number(site.item_count || rawCount || 0);
      const ratioBase = rawCount || scanned;
      const ratio = ratioBase ? Math.round((aiCount / ratioBase) * 100) : 0;
      const tierRank = tierRanks.has(site.site_id)
        ? tierRanks.get(site.site_id)
        : (SITE_TIER_RANK_FALLBACK[site.site_id] ?? 9);
      return { ...site, aiCount, rawCount: ratioBase, ratio, tierRank };
    })
    .sort((a, b) =>
      a.tierRank - b.tierRank
      || b.ratio - a.ratio
      || b.aiCount - a.aiCount
      || String(a.site_name).localeCompare(String(b.site_name), "zh-CN"));

  const table = document.createElement("div");
  table.className = "source-table";
  const header = document.createElement("div");
  header.className = "source-table-row source-table-head";
  header.innerHTML = "<span>來源</span><span>AI / 原始</span><span>AI佔比</span><span>狀態</span>";
  table.appendChild(header);
  rows.forEach((site) => {
    const row = document.createElement("div");
    row.className = "source-table-row";
    const statusText = site.ok ? "正常" : "異常";
    row.innerHTML = `
      <span>${site.site_name || site.site_id}</span>
      <span>${fmtNumber(site.aiCount)} / ${fmtNumber(site.rawCount)}</span>
      <span>${fmtNumber(site.ratio)}%</span>
      <span class="${site.ok ? "ok" : "bad"}">${statusText}</span>
    `;
    table.appendChild(row);
  });
  const foot = document.createElement("div");
  foot.className = "source-table-row source-table-foot";
  foot.textContent = `共 ${fmtNumber(rows.length)} 源`;
  table.appendChild(foot);
  sourceStatusTableEl.appendChild(table);
}

// 可選接入未啟用/未配置的提示行 + 替換/跳過 RSS 計數（非零才顯示）。
// X 資料來源已入池的數量在 source-table 的 SocialData X 行可見，這裡不重複。
function sourceHealthHintNode(status) {
  const rss = status.rss_opml || {};
  const agentmail = status.agentmail || {};
  const replacedFeeds = Array.isArray(rss.replaced_feeds) ? rss.replaced_feeds : [];
  const skippedFeeds = Array.isArray(rss.skipped_feeds) ? rss.skipped_feeds : [];

  const optionalBits = [];
  if (!rss.enabled) optionalBits.push("RSS 未啟用");
  if (!agentmail.enabled) optionalBits.push("AgentMail 未配置");

  const parts = [];
  if (optionalBits.length) parts.push(`可選接入:${optionalBits.join(" · ")}`);
  if (replacedFeeds.length || skippedFeeds.length) {
    parts.push(`替換/跳過 ${fmtNumber(replacedFeeds.length)}/${fmtNumber(skippedFeeds.length)}`);
  }
  if (!parts.length) return null;

  const node = document.createElement("div");
  node.className = "source-health-hint";
  node.textContent = parts.join(" · ");
  return node;
}

function renderSourceHealth(errorMessage = "") {
  if (!sourceHealthEl) return;
  sourceHealthEl.innerHTML = "";
  if (sourceHealthDetailsEl) sourceHealthDetailsEl.innerHTML = "";
  if (sourceStatusTableEl) sourceStatusTableEl.innerHTML = "";

  const status = state.sourceStatus;
  if (!status) {
    sourceHealthEl.appendChild(renderSourceHealthSummaryNode(null, errorMessage));
    renderSourceStatusPill(errorMessage);
    renderClearFiltersButton();
    return;
  }

  sourceHealthEl.appendChild(renderSourceHealthSummaryNode(status, errorMessage));
  const detailTarget = sourceHealthDetailsEl || sourceHealthEl;

  const hint = sourceHealthHintNode(status);
  if (hint) detailTarget.appendChild(hint);

  // X 博主展開列表：功能保留，從已刪除的 mini-card 挪到提示行下方的小連結。
  const xAuthors = socialdataAuthors();
  if (xAuthors.length) {
    // 與 socialdataAuthors() 同口徑的客戶端計數：socialdata_x 原生條目 + aihot 轉發的 X 條目
    const socialdataDisplayCount = state.itemsAi.filter((item) => itemXAuthor(item)).length;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "source-health-authors-toggle";
    toggle.setAttribute("aria-expanded", String(Boolean(state.xAuthorsExpanded)));
    toggle.textContent = state.xAuthorsExpanded
      ? "收起 X 博主列表 ▲"
      : `檢視本輪 X 博主 (${fmtNumber(xAuthors.length)}) ▸`;
    toggle.addEventListener("click", () => {
      state.xAuthorsExpanded = !state.xAuthorsExpanded;
      renderSourceHealth();
    });
    detailTarget.appendChild(toggle);

    if (state.xAuthorsExpanded) {
      detailTarget.appendChild(renderSocialdataAuthorList(xAuthors, socialdataDisplayCount));
    }
  }

  renderSourceStatusTable(status);
  renderSourceStatusPill(errorMessage);
  renderClearFiltersButton();
}

async function loadNewsData() {
  const res = await fetch(`${dataUrl("data/latest-24h.json")}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 latest-24h.json 失敗: ${res.status}`);
  return res.json();
}

async function loadAllModeData() {
  if (state.allDataLoaded) return;
  if (!state.allDataPromise) {
    state.allDataPromise = fetch(`${dataUrl(state.allDataUrl)}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`載入 latest-24h-all.json 失敗: ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        state.itemsAllRaw = payload.items_all_raw || payload.items_all || state.itemsAi;
        state.itemsAll = payload.items_all || state.itemsAi;
        state.totalRaw = payload.total_items_raw || state.itemsAllRaw.length;
        state.totalAllMode = payload.total_items_all_mode || state.itemsAll.length;
        state.allDataLoaded = true;
      })
      .catch((err) => {
        state.allDataPromise = null;
        throw err;
      });
  }
  return state.allDataPromise;
}

async function loadWaytoagiData() {
  const res = await fetch(`${dataUrl("data/waytoagi-7d.json")}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 waytoagi-7d.json 失敗: ${res.status}`);
  return res.json();
}

async function loadSourceStatusData() {
  const res = await fetch(`${dataUrl("data/source-status.json")}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 source-status.json 失敗: ${res.status}`);
  return res.json();
}

async function loadDailyBriefData() {
  const res = await fetch(`${dataUrl("data/daily-brief.json")}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 daily-brief.json 失敗: ${res.status}`);
  return res.json();
}

async function loadTop3PersonasData() {
  const res = await fetch(`${dataUrl("data/top3-personas.json")}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 top3-personas.json 失敗: ${res.status}`);
  return res.json();
}

async function loadStoriesData() {
  const res = await fetch(`${dataUrl(state.storiesDataUrl)}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`載入 stories-merged.json 失敗: ${res.status}`);
  return res.json();
}

async function init() {
  const [newsResult, waytoagiResult, statusResult, briefResult, storiesResult, personasResult] = await Promise.allSettled([
    loadNewsData(),
    loadWaytoagiData(),
    loadSourceStatusData(),
    loadDailyBriefData(),
    loadStoriesData(),
    loadTop3PersonasData(),
  ]);

  if (briefResult.status === "fulfilled") {
    state.dailyBrief = briefResult.value;
  } else {
    state.dailyBrief = null;
  }
  _briefIdentityKeyCache = null;

  // top3-personas.json 是可選增強資料：檔案缺失、請求失敗或 items 為空都靜默降級。
  if (
    personasResult.status === "fulfilled" &&
    Array.isArray(personasResult.value?.items) &&
    personasResult.value.items.length > 0
  ) {
    state.top3Personas = personasResult.value;
  } else {
    state.top3Personas = null;
  }

  if (storiesResult.status === "fulfilled") {
    state.storiesMerged = storiesResult.value;
  } else {
    state.storiesMerged = null;
  }

  if (newsResult.status === "fulfilled") {
    const payload = newsResult.value;
    const loadedStoriesDataUrl = state.storiesDataUrl;
    state.itemsAi = payload.items_ai || payload.items || [];
    state.itemsAllRaw = payload.items_all_raw || payload.items_all || [];
    state.itemsAll = payload.items_all || [];
    state.creatorItemsAi = payload.creator_items_ai || [];
    state.creatorItemsAll = payload.creator_items_all || state.creatorItemsAi;
    state.creatorWindowDays = Number(payload.creator_window_days || 7);
    state.statsAi = payload.site_stats || [];
    state.totalAi = payload.total_items || state.itemsAi.length;
    state.totalRaw = payload.total_items_raw || state.itemsAllRaw.length;
    state.totalAllMode = payload.total_items_all_mode || state.itemsAll.length;
    state.allDataUrl = payload.all_mode_data_url || state.allDataUrl;
    state.storiesDataUrl = payload.stories_data_url || state.storiesDataUrl;
    if (state.storiesDataUrl !== loadedStoriesDataUrl) {
      try {
        state.storiesMerged = await loadStoriesData();
      } catch {
        state.storiesMerged = null;
      }
    }
    state.allDataLoaded = Boolean(payload.items_all || payload.items_all_raw);
    state.generatedAt = payload.generated_at;

    renderSectionTabs();
    renderModeSwitch();
    renderSiteFilters();
    renderHotBoard();
    renderMainList();
    updatedAtEl.textContent = fmtTime(state.generatedAt);
  } else {
    updatedAtEl.textContent = "新聞資料載入失敗";
    newsListEl.innerHTML = `<div class="empty">${newsResult.reason.message}</div>`;
  }

  if (statusResult.status === "fulfilled") {
    state.sourceStatus = statusResult.value;
    renderSourceHealth();
  } else {
    renderSourceHealth(statusResult.reason.message);
  }

  if (waytoagiResult.status === "fulfilled") {
    state.waytoagiData = waytoagiResult.value;
    renderWaytoagi(state.waytoagiData);
  } else {
    if (waytoagiWrapEl) waytoagiWrapEl.hidden = state.activeSection !== "community";
    waytoagiUpdatedAtEl.textContent = "載入失敗";
    waytoagiListEl.innerHTML = `<div class="waytoagi-error">${waytoagiResult.reason.message}</div>`;
  }

  document.dispatchEvent(new CustomEvent("aiRadar:ready"));
}

// 搜尋：精選模式按故事標題/來源過濾（storyMatchesQuery），全量模式按條目過濾（itemHaystack）
searchInputEl.addEventListener("input", (e) => {
  state.query = e.target.value;
  state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
  renderSectionTabs();
  renderModeSwitch();
  renderHotBoard();
  renderMainList();
});

if (clearFiltersBtnEl) {
  clearFiltersBtnEl.addEventListener("click", clearAllFilters);
}

siteSelectEl.addEventListener("change", (e) => {
  state.siteFilter = e.target.value;
  if (state.siteFilter !== "socialdata_x") state.authorFilter = "";
  state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
  renderSiteFilters();
  renderHotBoard();
  renderMainList();
});

// 全域性 精選/全量 開關：替代舊的三檢視切換（精選/熱點榜/時間線）
if (modeSelectedBtnEl) {
  modeSelectedBtnEl.addEventListener("click", () => {
    if (state.mode === "selected") return;
    state.mode = "selected";
    state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
    rerenderCurrentView();
  });
}

if (modeAllBtnEl) {
  modeAllBtnEl.addEventListener("click", async () => {
    if (state.mode === "all") return;
    state.mode = "all";
    state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
    renderModeSwitch();
    newsListEl.innerHTML = "";
    const loading = document.createElement("div");
    loading.className = "empty";
    loading.textContent = "正在載入全量更新...";
    newsListEl.appendChild(loading);
    try {
      await loadAllModeData();
      rerenderCurrentView();
    } catch (err) {
      newsListEl.innerHTML = "";
      const failed = document.createElement("div");
      failed.className = "empty";
      failed.textContent = err.message;
      newsListEl.appendChild(failed);
    }
  });
}

if (allDedupeToggleEl) {
  allDedupeToggleEl.addEventListener("change", (e) => {
    state.allDedup = Boolean(e.target.checked);
    state.mainListVisibleCount = MAIN_LIST_PAGE_SIZE;
    rerenderCurrentView();
  });
}

if (waytoagiTodayBtnEl) {
  waytoagiTodayBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "today";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

if (waytoagi7dBtnEl) {
  waytoagi7dBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "7d";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

if (dataSourceResetBtnEl) {
  dataSourceResetBtnEl.addEventListener("click", () => {
    try { localStorage.removeItem("dataBaseUrl"); } catch {}
    window.location.href = window.location.pathname;
  });
}

renderDataSourceIndicator();
init();
