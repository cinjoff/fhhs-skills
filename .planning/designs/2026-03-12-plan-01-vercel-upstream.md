---
type: execute
wave: 1
depends_on: []
files_modified:
  - upstream/vercel-react-best-practices-{hash}/SKILL.md
  - .claude/skills/nextjs-perf/SKILL.md
  - .claude/skills/build/references/implementer-prompt.md
  - .claude/skills/refactor/SKILL.md
  - PATCHES.md
  - COMPATIBILITY.md
autonomous: true

must_haves:
  truths:
    - "Build subagents receive Next.js/React performance rules (waterfall elimination, bundle size, SSR caching) in every prompt"
    - "Refactor review criteria include Next.js performance patterns as a review focus"
    - "Upstream snapshot exists verbatim in upstream/ before any fork modifications"
  artifacts:
    - path: "upstream/vercel-react-best-practices-{hash}/"
      provides: "verbatim upstream snapshot"
      contains: "vercel-react-best-practices"
    - path: ".claude/skills/nextjs-perf/SKILL.md"
      provides: "forked Next.js performance reference skill"
      contains: "Next.js performance"
    - path: ".claude/skills/build/references/implementer-prompt.md"
      provides: "updated subagent template with Next.js rules"
      contains: "Next.js Performance Rules"
  key_links:
    - from: ".claude/skills/build/references/implementer-prompt.md"
      to: ".claude/skills/nextjs-perf/SKILL.md"
      via: "reference instruction to read nextjs-perf skill"
    - from: ".claude/skills/refactor/SKILL.md"
      to: ".claude/skills/nextjs-perf/SKILL.md"
      via: "review focus referencing Next.js performance patterns"
---

<objective>Adopt Vercel React Best Practices as a new upstream and wire it into the build and refactor pipelines so every subagent building Next.js code follows authoritative performance patterns.</objective>

<context>
@file .claude/skills/build/references/implementer-prompt.md
@file .claude/skills/refactor/SKILL.md
@file PATCHES.md
@file COMPATIBILITY.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Snapshot and fork Vercel React Best Practices</name>
  <files>upstream/vercel-react-best-practices-{hash}/, .claude/skills/nextjs-perf/SKILL.md</files>
  <action>
    1. Install the skill to inspect its content: `npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y`
    2. Find the installed skill content (likely at `~/.claude/skills/vercel-react-best-practices/`)
    3. Copy verbatim to `upstream/vercel-react-best-practices-{hash}/` (use first 8 chars of current commit hash)
    4. Create `.claude/skills/nextjs-perf/SKILL.md` as a fork — add proper frontmatter (`name: nextjs-perf`, `description`, `user-invokable: false`), trim to the essential rules most relevant to Next.js app development (keep the 58 rules organized by category but remove any that are framework-agnostic generic advice already covered by other skills)
    5. Ensure all content is self-contained within `.claude/skills/nextjs-perf/` (plugin shipping boundary)
  </action>
  <verify>
    - upstream/ snapshot exists with unmodified content
    - .claude/skills/nextjs-perf/SKILL.md exists with proper frontmatter
    - Content covers: waterfall elimination, bundle size, SSR caching, re-render optimization
  </verify>
  <done>Upstream snapshot preserved, fork created with Next.js-specific performance rules</done>
</task>

<task type="auto">
  <name>Task 2: Wire into build and refactor pipelines</name>
  <files>.claude/skills/build/references/implementer-prompt.md, .claude/skills/refactor/SKILL.md, PATCHES.md, COMPATIBILITY.md</files>
  <action>
    1. Edit `implementer-prompt.md` — add a "Next.js Performance Rules" section after the "Implementation Rules" section that instructs subagents: "If this project uses Next.js (check for next.config.*, app/ or pages/ directory), read `skills/nextjs-perf/` and follow its rules. Key priorities: avoid client-side waterfalls, minimize bundle size, use proper caching strategies, prevent unnecessary re-renders."
    2. Edit `refactor/SKILL.md` Step 5 (Review) — add a fourth review focus: "**Next.js performance:** If refactoring touches Next.js files (pages, layouts, API routes, server components), review against `skills/nextjs-perf/` patterns. Check for: client-side waterfalls introduced by restructuring, broken caching, unnecessary client components."
    3. Update PATCHES.md — add "vercel-react-best-practices" section documenting the fork changes
    4. Update COMPATIBILITY.md — add vercel-react-best-practices entry with version, repo link, and which composites use it
  </action>
  <verify>
    - implementer-prompt.md contains "Next.js Performance Rules" section
    - refactor/SKILL.md Step 5 has 4th review focus for Next.js
    - PATCHES.md has vercel-react-best-practices section
    - COMPATIBILITY.md has vercel-react-best-practices entry
  </verify>
  <done>Build subagents and refactor reviews include Next.js performance guidance</done>
</task>
</tasks>

<verification>
- `grep -l "Next.js Performance" .claude/skills/build/references/implementer-prompt.md`
- `grep -l "nextjs-perf" .claude/skills/refactor/SKILL.md`
- `ls upstream/vercel-react-best-practices-*/`
- `grep "vercel-react-best-practices" PATCHES.md COMPATIBILITY.md`
</verification>

<success_criteria>
- Build subagents receive Next.js/React performance rules in every prompt
- Refactor review criteria include Next.js performance patterns
- Upstream snapshot exists verbatim before fork modifications
</success_criteria>

<output>.planning/designs/2026-03-12-plan-01-SUMMARY.md</output>
