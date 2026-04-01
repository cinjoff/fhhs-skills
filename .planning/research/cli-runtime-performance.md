# CLI Runtime Performance Research

**Date:** 2026-04-01
**Context:** fhhs-skills plugin `bin/gsd-tools.cjs` is invoked 10-50+ times per session as short-lived CLI processes. Each does file I/O, JSON parsing, YAML frontmatter parsing, and string manipulation.
**Current:** Node.js CJS (v22.18.0), 641-line main entry, 14 require() calls across 13 internal modules, zero npm dependencies.

## Local Benchmark Results (macOS ARM64, Apple Silicon)

All times in milliseconds. "Warm" = OS page cache warm (runs 2-5). Measured via Python `time.time_ns()` wrapper.

### Minimal Startup (`console.log("ok")`)

| Runtime     | Cold  | Warm (median) | Notes |
|-------------|-------|---------------|-------|
| bash        | ~19ms | ~19ms         | Fastest possible |
| jq          | ~21ms | ~21ms         | Native binary |
| Bun 1.3.11  | ~36ms | ~30ms         | ~1.8x faster than Node |
| Python 3.13 | ~34ms | ~32ms         | Surprisingly competitive |
| Node 22.18  | ~61ms | ~57ms         | V8 initialization overhead |

### Realistic Workload: require(fs,path) + JSON.parse

| Runtime    | Warm (median) | Notes |
|------------|---------------|-------|
| jq         | ~21ms         | Native, JSON only |
| bash+jq    | ~24ms         | Pipe overhead |
| Bun        | ~35ms         | CJS compat works |
| Node       | ~55ms         | Consistent |

### YAML Frontmatter Parsing (regex-based)

| Runtime    | Warm (median) | Notes |
|------------|---------------|-------|
| bash+sed   | ~22ms         | Simple grep/sed pipeline |
| Bun        | ~35ms         | Stable |
| Node       | ~57ms (but spikes to 250-400ms) | Erratic; V8 JIT deopt? |

### Actual gsd-tools.cjs (13 modules, 14 requires)

| Runtime         | Warm (median) | Notes |
|-----------------|---------------|-------|
| Bun (interpret) | ~55ms         | Full CJS compat, no changes needed |
| Node            | ~65ms         | Current baseline |
| Bun (compiled)  | ~49ms warm, ~995ms cold | 58MB binary; cold start is terrible |

### Memory Footprint

| Runtime | RSS (bare) | RSS (with requires) |
|---------|-----------|---------------------|
| Node    | 37MB      | 39MB                |
| Bun     | 20MB      | 25MB                |

Node uses ~1.8x more memory than Bun for equivalent workloads.

---

## Runtime Comparison

### 1. Node.js CJS (Current)

- **Startup:** ~55-65ms warm for the actual tool
- **Pros:** Universal install base; excellent error messages; mature debugging (--inspect); gsd-tools already works
- **Cons:** Highest startup time of JS runtimes; 37MB RSS per invocation; V8 JIT warmup can cause occasional spikes (seen 250-400ms)
- **CJS compat:** Native
- **Portability:** Excellent (macOS/Linux/Windows)

### 2. Bun (Drop-in Replacement)

- **Startup:** ~30-55ms warm (1.5-1.8x faster than Node)
- **Pros:** Drop-in CJS replacement (tested — gsd-tools.cjs works unmodified with `bun`); lower memory; faster startup
- **Cons:** Not installed by default on most systems; Windows support is newer/less mature; occasional edge-case CJS incompatibilities; adds a dependency to plugin setup
- **CJS compat:** Very good — tested with gsd-tools.cjs, all 14 requires work
- **Portability:** macOS/Linux good, Windows improving
- **Compile option:** `bun build --compile` produces 58MB standalone binaries with ~1s cold start — **not viable** for CLI tools

### 3. Shell Scripts (sh/bash + jq/sed)

- **Startup:** ~19-24ms (fastest option)
- **Pros:** Zero runtime dependency; fastest startup; tiny memory footprint; jq is excellent for JSON
- **Cons:** YAML parsing is fragile (regex/sed only); complex string manipulation is painful; error handling is weak; portability issues (GNU vs BSD sed/grep); hard to debug; limited data structures
- **YAML:** No good portable YAML tool. `yq` exists but has two incompatible versions (Go-based mikefarah/yq vs Python-based kislyuk/yq). Neither is commonly pre-installed.
- **Realistic for:** Simple JSON reads (`jq .field file.json`), file existence checks, string manipulation. NOT realistic for the full gsd-tools feature set.

### 4. Deno

- **Not tested** (not installed on this system)
- Published benchmarks suggest startup ~25-40ms (faster than Node, comparable to Bun)
- **Cons:** Permission model (`--allow-read`, `--allow-write`) adds friction for CLI tools; no native CJS require() — needs rewrite to ESM; limited adoption; adds a dependency
- **Verdict:** Not worth the migration cost given Bun exists as a drop-in

### 5. Compiled Approaches

| Approach | Binary Size | Cold Start | Warm Start | Notes |
|----------|-------------|------------|------------|-------|
| `bun build --compile` | 58MB | ~1000ms | ~49ms | Embeds Bun runtime; cold start kills it |
| `pkg` (Node) | ~40-50MB | ~500ms+ | ~80ms+ | Deprecated/unmaintained |
| Rust CLI | ~2-5MB | ~1-3ms | ~1-3ms | Best performance but full rewrite |
| Go CLI | ~5-10MB | ~3-5ms | ~3-5ms | Good performance, easy to build |

- **Bun compile:** Tested above. 58MB binaries with ~1s cold start. Warm start is only marginally better than interpreted. **Not recommended.**
- **Rust/Go native:** Would give ~1-5ms startup, tiny binaries. But requires full rewrite, different language expertise, and complicates plugin development workflow. Realistic only if performance is critical AND the tool surface stabilizes.
- **pkg/nexe:** Effectively dead projects. Not recommended.

### 6. Python

- **Startup:** ~32ms warm (faster than Node!)
- **Pros:** Universally installed; excellent string/file manipulation; good YAML support (`pip install pyyaml`); rich stdlib
- **Cons:** PyYAML is not pre-installed; pip dependency management is messy for plugins; not a natural fit for a JS/Node ecosystem plugin; CJS compat N/A (full rewrite)
- **Verdict:** Not worth migrating from JS

---

## Other Findings

### What Other Claude Code Plugins Use

Examined installed plugins:
- **elements-of-style (superpowers):** Pure markdown skills, no CLI tooling
- **claude-mem (thedotmack):** Full Node.js MCP server with native modules (tree-sitter, better-sqlite3)
- **marketing-skills:** Node.js CLI scripts (.js files for API integrations)
- **context-mode:** Node.js MCP server with better-sqlite3

**Pattern:** Node.js is the de facto standard for Claude Code plugin tooling. No plugins use Bun, Deno, or shell scripts for core tooling.

### "jq for YAML"

- **mikefarah/yq (Go):** Best option. Single binary, ~5MB, fast startup (~5ms). Speaks JSON, YAML, XML, TOML. But not commonly pre-installed.
- **kislyuk/yq (Python):** Wraps jq, requires Python + pip. Slower startup.
- **dasel:** Go binary, multi-format (JSON/YAML/TOML/XML). Less popular.
- **For simple frontmatter:** Regex/sed is adequate and has zero dependencies. Only need a real YAML parser for nested/complex structures.

### Node.js Startup Breakdown

Published V8 team data and community benchmarks confirm:
- ~30ms of Node startup is V8 initialization (snapshot deserialization)
- ~10-15ms is Node.js module system bootstrap
- ~5-10ms per additional require() of built-in modules
- `--v8-pool-size=0` can save a few ms by not spawning worker threads
- Node 22+ has improved startup via code caching but still fundamentally slower than Bun's JavaScriptCore

---

## Recommendations

### Quick Win: Switch shebang to Bun (if available)

```
#!/usr/bin/env bun
```

With a fallback in skills that invoke the tool:
```bash
if command -v bun &>/dev/null; then
  bun bin/gsd-tools.cjs "$@"
else
  node bin/gsd-tools.cjs "$@"
fi
```

**Expected gain:** ~10-15ms per invocation (65ms -> 55ms). Over 50 invocations per session: **~500-750ms saved**.

**Risk:** Low — tested and works. But adds Bun as an optional dependency.

### Medium Win: Hybrid approach

Split gsd-tools into two tiers:
1. **Hot path operations** (status checks, frontmatter reads, JSON field lookups): Rewrite as shell functions using jq + sed. Would drop to ~20ms per call.
2. **Complex operations** (verify, template, changelog): Keep in Node/Bun CJS.

**Expected gain:** If 70% of invocations are hot-path: `0.7 * 50 * (55 - 22) + 0.3 * 50 * (55 - 55) = ~1.15s saved per session`

### Not Recommended

- **Bun compile:** 58MB binaries, terrible cold start, marginal warm improvement
- **Full Rust/Go rewrite:** Disproportionate effort for ~50ms savings per call
- **Deno migration:** Requires ESM rewrite, no meaningful advantage over Bun
- **Python migration:** Wrong ecosystem

### Long-term: If performance becomes critical

A Rust or Go binary for the hot-path operations (JSON read, frontmatter parse, file existence) could achieve ~1-3ms startup. Ship as a single binary alongside the plugin. But this only makes sense if the tool surface is stable and the 20-55ms range is genuinely problematic.

---

## Raw Data Summary

| Scenario | Node | Bun | bash/jq | Delta (Node vs best) |
|----------|------|-----|---------|---------------------|
| Minimal print | 57ms | 30ms | 19ms | 38ms |
| JSON parse | 55ms | 35ms | 21ms | 34ms |
| Frontmatter | 57ms* | 35ms | 22ms | 35ms |
| gsd-tools.cjs | 65ms | 55ms | N/A | 10ms |

*Node showed erratic spikes to 250-400ms on frontmatter parsing.
