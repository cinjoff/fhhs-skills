## Decisions

- [Upstream source: ferdinandobons/startup-skill]: Fork 4 skills from ferdinandobons/startup-skill (startup-design, startup-competitors, startup-positioning, startup-pitch). Save verbatim snapshots in `upstream/startup-skill/`. Track as upstream #9 in COMPATIBILITY.md.
- [startup-advisor is original]: startup-advisor is NOT a fork — entirely new skill with curated YC/founder frameworks. No upstream snapshot needed.
- [Output paths normalized to .planning/startup/]: All upstream skills write to `{project-name}/00-intake/` etc. Patch all to `.planning/startup/` (GSD convention). Sub-skills get sub-directories: `competitors/`, `positioning/`, `pitch/`.
- [Progressive enrichment chain]: Each skill checks for artifacts from prior skills. startup-design is the entry point; competitors, positioning, pitch each check for prior artifacts and use them as head start. No orchestrator needed — startup-design IS the journey, others are optional depth.
- [REQ-35 dropped — no composite orchestrator]: Original plan for a `/fh:startup` composite that chains all skills was dropped. startup-design covers the full journey; other skills are standalone depth tools. Simpler, more flexible.
- [Co-located reference files]: All runtime-read reference files live inside `.claude/skills/{name}/references/` (shipping boundary). No files in repo-root `references/`.
- [new-project Step 0.5 bridge]: `/fh:new-project` auto-detects `.planning/startup/` and populates project vision from startup artifacts (brief.md, scorecard.md, lean-canvas.md). No user prompt needed.
- [startup- prefix for discoverability]: All startup skills use `startup-` prefix (REQ-39). Prevents trigger overlap with existing dev skills (territory boundaries documented in each SKILL.md).
- [Three-tier knowledge in startup-advisor]: Tier 1: curated frameworks (always available, co-located). Tier 2: web research via firecrawl/WebSearch. Tier 3: project context from `.planning/startup/` artifacts. Ensures useful answers even without web access.
- [--refresh mode for startup-design]: Supports updating existing artifacts without full re-run (REQ-37). Detects existing PROGRESS.md and resumes from last incomplete phase.
- [Multi-language support]: All skills default to English but respect user's language preference. Output language matches user input.

## Discretion Areas

- [Research depth tiers]: Agent decides complexity tier (quick/standard/deep) based on intake assessment. Scoring matrix in each skill's `research-scaling.md`.
- [Parallel vs sequential research waves]: Agent decides based on runtime environment (Claude Code = parallel, Claude.ai = sequential).
- [Industry benchmarks content]: Agent decides which benchmarks to include in `industry-benchmarks.md` based on market research findings.

- [review] [files_modified completeness]: Plan files_modified must include all files touched by all tasks, including downstream integration targets (plan-work, auto) and release artifacts (plugin.json, marketplace.json, CHANGELOG.md). Incomplete lists cause untracked blast radius.
- [review] [Eval count exceeds plan minimum]: Plan truth said "minimum 3 per skill" (15), execution produced 22. Truths should use precise targets, not vague minimums, to make verification deterministic.

## Deferred Ideas

- [Composite orchestrator]: A `/fh:startup` that chains all 5 skills in sequence. Dropped as startup-design already covers the journey. Revisit if users request guided multi-skill flow.
- [Startup artifact versioning]: Track iterations of startup artifacts (v1, v2 after pivot). Currently `--refresh` overwrites.
- [Investor database integration]: Connect startup-pitch to investor databases for targeted outreach. Requires external API access.
- [Expansion opportunity]: The ambitious version would add a `/fh:startup` composite orchestrator that chains all 5 skills into a single "idea to pitch deck" pipeline with checkpoint-based progress, artifact validation between phases, and a final unified startup brief that feeds directly into `/fh:new-project --auto` for seamless idea-to-code execution.
