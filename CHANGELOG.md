# Changelog

All notable changes to fhhs-skills will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-06

### Added
- **Code explorer agent** — reusable agent for tracing code flows and surfacing essential files before design
- **Code architect agent** — reusable agent for designing implementation blueprints with different architectural lenses
- **Confidence scoring in code review** — issues rated 0-100, only high-signal issues (>=75) reported
- **Deep exploration in brainstorming** — optional parallel explorer/architect agents for complex features
- **`/update` command** — check for updates and install without digging through plugin menus
- **Version tracking** — CHANGELOG.md and git tags for release management

### Fixed
- User-facing routing now recommends composite commands (`/plan`, `/build`, `/verify`) instead of raw GSD commands (`/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:verify-work`)

## [1.0.1] - 2026-03-06

### Added
- Visual verification with Playwright (`/verify-ui`) using agent-browser with fallback

### Changed
- Updated upstream: Superpowers 4.3.5, Impeccable 1.2.0, simplify renamed to distill

## [1.0.0] - 2026-02-28

Initial release.

- Composite commands: `/plan`, `/build`, `/fix`, `/refactor`, `/verify`, `/resume`, `/new-project`, `/research`
- Design quality: `/critique`, `/polish`, `/normalize`, `/harden`, `/animate`, `/teach-impeccable`
- Engineering discipline: TDD, verification, code review, systematic debugging
- Project tracking: GSD phases, milestones, roadmaps
- Forked upstream: Superpowers 4.3.4, Impeccable 1.1.0, GSD 1.22.4
