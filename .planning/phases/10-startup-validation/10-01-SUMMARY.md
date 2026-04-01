---
phase: 10-startup-validation
plan: 01
subsystem: startup-skills
tags: [startup, validation, upstream, skills]
requires: []
provides:
  - "5 startup validation skills: startup-design, startup-competitors, startup-positioning, startup-pitch, startup-advisor"
  - "Upstream tracking: ferdinandobons/startup-skill as source #9 with verbatim snapshots"
  - "Progressive enrichment chain: each skill enriches output from prior skill artifacts"
  - "new-project Step 0.5 bridge: auto-populates project vision from startup artifacts"
  - "startup-advisor: original skill with 12 curated YC/founder decision frameworks"
  - "19 evals covering standalone, chained, fast-track, and non-trigger scenarios"
affects: []
tech-stack:
  added: []
  patterns: ["progressive-enrichment", "three-tier-knowledge", "artifact-chain"]
key-files:
  created:
    - .claude/skills/startup-design/SKILL.md
    - .claude/skills/startup-design/references/output-guidelines.md
    - .claude/skills/startup-design/references/frameworks.md
    - .claude/skills/startup-design/references/honesty-protocol.md
    - .claude/skills/startup-design/references/research-principles.md
    - .claude/skills/startup-design/references/research-scaling.md
    - .claude/skills/startup-design/references/research-synthesis.md
    - .claude/skills/startup-design/references/research-wave-1-market.md
    - .claude/skills/startup-design/references/research-wave-2-competitors.md
    - .claude/skills/startup-design/references/research-wave-3-customers.md
    - .claude/skills/startup-design/references/research-wave-4-distribution.md
    - .claude/skills/startup-design/references/industry-benchmarks.md
    - .claude/skills/startup-design/references/verification-agent.md
    - .claude/skills/startup-competitors/SKILL.md
    - .claude/skills/startup-competitors/references/research-principles.md
    - .claude/skills/startup-competitors/references/research-scaling.md
    - .claude/skills/startup-competitors/references/research-synthesis.md
    - .claude/skills/startup-competitors/references/research-wave-1-profiles-pricing.md
    - .claude/skills/startup-competitors/references/research-wave-2-sentiment-mining.md
    - .claude/skills/startup-competitors/references/research-wave-3-gtm-signals.md
    - .claude/skills/startup-competitors/references/honesty-protocol.md
    - .claude/skills/startup-competitors/references/verification-agent.md
    - .claude/skills/startup-positioning/SKILL.md
    - .claude/skills/startup-positioning/references/frameworks.md
    - .claude/skills/startup-positioning/references/research-principles.md
    - .claude/skills/startup-positioning/references/research-scaling.md
    - .claude/skills/startup-positioning/references/research-synthesis.md
    - .claude/skills/startup-positioning/references/research-wave-1-alternatives.md
    - .claude/skills/startup-positioning/references/research-wave-2-market-frame.md
    - .claude/skills/startup-positioning/references/honesty-protocol.md
    - .claude/skills/startup-positioning/references/verification-agent.md
    - .claude/skills/startup-pitch/SKILL.md
    - .claude/skills/startup-pitch/references/pitch-frameworks.md
    - .claude/skills/startup-pitch/references/research-principles.md
    - .claude/skills/startup-pitch/references/research-scaling.md
    - .claude/skills/startup-pitch/references/research-synthesis.md
    - .claude/skills/startup-pitch/references/research-wave-1-audience-narrative.md
    - .claude/skills/startup-pitch/references/research-wave-2-competitive-framing.md
    - .claude/skills/startup-pitch/references/honesty-protocol.md
    - .claude/skills/startup-pitch/references/verification-agent.md
    - .claude/skills/startup-advisor/SKILL.md
    - .claude/skills/startup-advisor/references/frameworks/should-i-start-a-startup.md
    - .claude/skills/startup-advisor/references/frameworks/solo-vs-cofounder.md
    - .claude/skills/startup-advisor/references/frameworks/bootstrap-vs-raise.md
    - .claude/skills/startup-advisor/references/frameworks/when-to-pivot.md
    - .claude/skills/startup-advisor/references/frameworks/when-to-quit.md
    - .claude/skills/startup-advisor/references/frameworks/pricing-strategy.md
    - .claude/skills/startup-advisor/references/frameworks/product-market-fit.md
    - .claude/skills/startup-advisor/references/frameworks/hiring-first-employees.md
    - .claude/skills/startup-advisor/references/frameworks/equity-splits.md
    - .claude/skills/startup-advisor/references/frameworks/fundraising-basics.md
    - .claude/skills/startup-advisor/references/frameworks/customer-development.md
    - .claude/skills/startup-advisor/references/frameworks/growth-channels.md
    - upstream/startup-skill/startup-design/SKILL.md
    - upstream/startup-skill/startup-competitors/SKILL.md
    - upstream/startup-skill/startup-positioning/SKILL.md
    - upstream/startup-skill/startup-pitch/SKILL.md
  modified:
    - .claude/skills/new-project/SKILL.md
    - PATCHES.md
    - COMPATIBILITY.md
    - evals/evals.json
    - plugin.json
    - marketplace.json
    - CHANGELOG.md
key-decisions:
  - "Fork 4 from ferdinandobons/startup-skill, create 1 original (startup-advisor)"
  - "All output paths normalized to .planning/startup/ (GSD convention)"
  - "Progressive enrichment — no composite orchestrator needed (REQ-35 dropped)"
  - "Three-tier knowledge in startup-advisor: curated frameworks → web research → project context"
  - "new-project Step 0.5 bridge auto-detects startup artifacts"
  - "12 curated YC/founder decision frameworks co-located in startup-advisor"
requirements-completed:
  - REQ-27
  - REQ-28
  - REQ-29
  - REQ-30
  - REQ-31
  - REQ-32
  - REQ-33
  - REQ-34
  - REQ-36
  - REQ-37
  - REQ-38
  - REQ-39
  - REQ-40
  - REQ-41
completed: "2026-03-28T00:00:00Z"
---

## What Was Done

### Upstream Integration
- Saved verbatim snapshots of 4 skills from ferdinandobons/startup-skill (v1.0.0) in `upstream/startup-skill/`
- Tracked as upstream source #9 in COMPATIBILITY.md
- All deviations documented in PATCHES.md with rationale

### Skills Shipped (5 total)

**startup-design** — 8-phase startup validation workflow
- Phases: INTAKE → BRAINSTORM → RESEARCH → STRATEGY → BRAND → PRODUCT → FINANCIAL → VALIDATION
- Full mode (all 8 phases) and fast-track mode (compressed)
- Resume from checkpoint via `.planning/startup/PROGRESS.md`
- `--refresh` mode for updating existing artifacts
- 12 co-located reference files including new `industry-benchmarks.md`

**startup-competitors** — Deep competitive intelligence
- 4-phase workflow with 3 parallel research waves
- Battle cards, pricing landscape, strategic vulnerability mapping
- Progressive enrichment: checks for prior startup-design artifacts

**startup-positioning** — Market positioning strategy
- April Dunford framework, Moore's positioning statement, Neumeier Onliness Test
- 2 parallel research waves with prior artifact chain
- Positioning doc, category analysis, messaging hierarchy

**startup-pitch** — Investor-ready pitch scripts
- 5 formats: 10-min, 5-min, 2-min, elevator, investor email
- Q&A preparation, scoring rubric, optional investor roleplay
- Checks all prior startup artifacts for maximum context

**startup-advisor** — Conversational founder advisor (original, not fork)
- Three-tier knowledge: curated frameworks → web research → project context
- 12 decision frameworks covering key founder questions
- Direct recommendation format, not multi-phase workflow

### Integration Points
- `/fh:new-project` Step 0.5: auto-detects `.planning/startup/` and populates project vision
- `/fh:plan-work`: reads `.planning/startup/` as domain context
- `/fh:auto`: pre-indexes `.planning/startup/`, suggests startup skills if no `.planning/` exists

### Eval Coverage
- 19 evals total: 3 per startup skill (15) + 3 non-trigger rejection tests + 1 new-project integration
- Covers standalone, chained (progressive enrichment), fast-track, and misrouting scenarios

### Key Patches from Upstream
1. Output paths: `{project-name}/` → `.planning/startup/` (GSD convention)
2. PROGRESS.md co-located at `.planning/startup/PROGRESS.md`
3. Added `user-invocable: true` frontmatter to all skills
4. Added territory boundaries and downstream integration sections
5. Added `--refresh` mode to startup-design
6. Updated artifact chain paths for progressive enrichment

## Released
- Shipped as v1.39.0 with both plugin.json and marketplace.json version-synced
