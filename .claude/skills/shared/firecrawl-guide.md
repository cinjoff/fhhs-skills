# firecrawl Usage Guide

How skills use firecrawl for web research. All skills referencing firecrawl follow these patterns.

**Reading this file efficiently:** Jump to the content-type section you need (Docs, YouTube, GitHub, News, Research, General Web) rather than reading the whole file. The Fallback Chain and Availability Guard sections are the most commonly referenced.

## Core Principle

Firecrawl is the preferred web tool. MCP tools primary, CLI fallback, WebSearch/WebFetch last resort.

## MCP Tools Reference

| Tool | Use Case |
|------|----------|
| `mcp__firecrawl__firecrawl_scrape` | Single URL — returns clean markdown |
| `mcp__firecrawl__firecrawl_search` | Web search with optional scraping (supports `sourceType`: web/news/images, `category`: github/research/pdf) |
| `mcp__firecrawl__firecrawl_map` | Fast URL discovery from a root domain |
| `mcp__firecrawl__firecrawl_crawl` | Recursive site crawl (async) |
| `mcp__firecrawl__firecrawl_extract` | Structured data extraction with schema |
| `mcp__firecrawl__firecrawl_agent` | Autonomous research agent |

## Content-Type Patterns

---

### Documentation Sites

**When to use:** Official library/framework docs, API references, guides.

**Tool:** `firecrawl_scrape` with `only_main_content: true`

**For multi-page docs:** `firecrawl_map` first to discover URLs, then `firecrawl_scrape` key pages.

**Alternative:** Context7 for library docs — prefer Context7 when available (see Fallback Chain).

**Example:**
```
firecrawl_scrape({
  url: "https://docs.example.com/getting-started",
  only_main_content: true
})
```

---

### YouTube Transcripts

**When to use:** Video content, tutorials, talks — when a transcript is needed.

**Tool:** `firecrawl_scrape` with `formats: ["markdown"]`

**Key details:**
- YouTube embeds captions in markdown output when available
- For audio extraction: `formats: ["audio"]` returns MP3 URL (1hr expiry, higher credit cost)
- Works with `youtube.com/watch` and `youtube.com/shorts` URLs

**Example:**
```
firecrawl_scrape({
  url: "https://www.youtube.com/watch?v=VIDEOID",
  formats: ["markdown"]
})
```

---

### GitHub Repos/Issues

**When to use:** READMEs, issues, PRs, rendered file views.

**Tools:**
- `firecrawl_scrape` for specific URLs (READMEs, issues, PRs)
- `firecrawl_search` with `category: "github"` for discovery

**Note:** `raw.githubusercontent.com` URLs work with plain WebFetch — use firecrawl only for rendered pages.

**Example:**
```
firecrawl_search({
  query: "repo name feature",
  category: "github"
})
```

---

### News & Articles

**When to use:** Current events, blog posts, press releases.

**Tools:**
- `firecrawl_search` with `sourceType: "news"` for discovery
- `firecrawl_scrape` with `only_main_content: true` for specific articles

**Time filtering:** Use `tbs` parameter (e.g., `qdr:w` for past week, `qdr:d` for past day).

**Example:**
```
firecrawl_search({
  query: "topic keywords",
  sourceType: "news",
  tbs: "qdr:w"
})
```

---

### Research Papers

**When to use:** Academic papers, preprints, journal articles.

**Tools:**
- `firecrawl_search` with `category: "research"` for discovery (arXiv, Nature, IEEE, PubMed)
- `firecrawl_scrape` for specific paper URLs

**Example:**
```
firecrawl_search({
  query: "paper topic keywords",
  category: "research"
})
```

---

### General Web Pages

**When to use:** Any other URL — product pages, wikis, forums, etc.

**Tool:** `firecrawl_scrape` — default, works for most pages.

**For JS-heavy pages:** Add `actions: [{"type": "wait", "milliseconds": 2000}]` to allow rendering.

**Example:**
```
firecrawl_scrape({
  url: "https://example.com/page",
  actions: [{"type": "wait", "milliseconds": 2000}]
})
```

---

## When to Use Subagent vs Inline

| Situation | Approach |
|-----------|----------|
| 1–2 sources | Call firecrawl directly in current context |
| 3+ sources, synthesis needed | Dispatch a research subagent with firecrawl tools |
| Complex multi-step research | Consider `firecrawl_agent` for autonomous research |

## Fallback Chain

1. Context7 (library docs only)
2. Firecrawl MCP (`mcp__firecrawl__*`)
3. Firecrawl CLI (`firecrawl search/scrape`)
4. WebFetch (specific URLs)
5. WebSearch (discovery)

## Availability Guard

```
If firecrawl MCP tools available (check for mcp__firecrawl__*):
  → Use MCP tools directly
Else if firecrawl CLI available (firecrawl --version 2>/dev/null):
  → Use CLI, write to .firecrawl/, then Read results
Else:
  → Fall back to WebFetch/WebSearch
  → Skills work identically, just without LLM-optimized output
```

Skip silently if unavailable. Never fail a skill because firecrawl is missing.
