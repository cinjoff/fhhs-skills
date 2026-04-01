## Decisions

- [marketplace-schema]: Enhance only fields supported by Claude Code marketplace schema (description, tags, category). Do not invent unsupported fields — the marketplace is young and undocumented fields are ignored. (alternatives: Add screenshots/feature-highlights fields speculatively; wait for official schema docs)
- [release-portability]: Replace hardcoded `/Users/konstantin/Documents/github.nosync/fhhs-skills` in release.md with `git rev-parse --show-toplevel`. Portable, works from any subdirectory. (alternatives: Use `$PWD`; remove `cd` entirely)
- [community-artifacts]: Ship both CONTRIBUTING.md and GitHub issue templates (.github/ISSUE_TEMPLATE/). CONTRIBUTING.md for narrative, templates for structured input. (alternatives: CONTRIBUTING.md only; issue templates only)
- [health-in-release]: Plugin health monitoring (size check, skill count, shipping boundary) lives in `/release` Step 0 as pre-ship validation, not as a standalone command. (alternatives: Standalone `plugin-health` command; add to `/fh:health`)
- [eval-pre-release]: Add eval suite smoke run to `/release` Step 0. Run `--tier smoke` only (not full suite) to keep release fast. Full suite is a manual pre-release step. (alternatives: Full eval suite in release; no eval check)
- [no-breaking-change-migration]: Breaking-change migration support in `/fh:update` is deferred. The plugin has never shipped a breaking change, and the reconciliation tag system handles additive changes well. When a breaking change happens, add migration support then. (alternatives: Build migration framework now speculatively)

- [review] [plugin-json-sync]: plugin.json description must be updated alongside marketplace.json — both files appear in `files_modified` and verification checks sync. Without this, `claude plugin search` shows stale text.
- [review] [macos-portable-du]: Release health checks use `du -sk` (kilobytes) not `du -sb` (GNU bytes). macOS lacks `-b` flag; the original command would error silently or produce wrong comparisons.
- [review] [repo-root-per-block]: Each bash block in release.md must independently compute `REPO_ROOT=$(git rev-parse --show-toplevel)`. Skill markdown blocks don't share shell state between fenced code blocks.

## Discretion Areas

- Exact wording of marketplace.json description and tags — optimize for discoverability
- CONTRIBUTING.md structure and content — follow standard open-source patterns
- Issue template categories (bug report, feature request, question) — standard set
- Plugin size thresholds for release warnings — use reasonable defaults (e.g., warn at 3MB)

## Deferred Ideas

- Release-candidate workflow with pre-release tags — not needed at current scale
- Telemetry/usage tracking — privacy concerns outweigh benefits at current user count
- "What's new" communication channel beyond GitHub releases — no audience yet
- CI/CD workflows (.github/workflows/) — maintainer uses `/release` command, no CI needed yet
- Breaking-change migration framework in `/fh:update` — build when first breaking change ships
- [Expansion opportunity]: Full release automation with GitHub Actions CI (lint, eval smoke, version bump PR) — would make releases one-click with quality gates enforced by CI rather than skill prompts
