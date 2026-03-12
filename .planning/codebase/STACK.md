# Technology Stack

**Analysis Date:** 2026-03-12

## Languages

**Primary:**
- JavaScript/Node.js - CLI utilities, orchestration, build scripts
- CommonJS (`.cjs`) - CLI modules in `bin/lib/` (state, phase, roadmap, verify, config, template, milestone, commands, init, frontmatter)
- Markdown - All composites, skills, agents, and documentation
- JSX - React component framework in `templates/project-tracker/src/`
- CSS/Tailwind - Styling for project tracker dashboard

**Secondary:**
- TypeScript - Referenced in LSP features and test examples, but codebase is primarily JavaScript
- Bash - Referenced in setup and command examples (platform detection, tool checks)

## Runtime

**Environment:**
- Node.js (referenced as `node` in multiple skill contexts)
- CommonJS modules via `require()` in `.cjs` files

**Package Manager:**
- npm (referenced as `npm` in setup checks)
- Lockfile: Present (`templates/project-tracker/package-lock.json`)

## Frameworks

**Core:**
- Claude Code Plugin Framework - Main orchestration platform (version 1.12.5 in `plugin.json`)
- GSD (Get Shit Done) - Project orchestration framework (bundled version 1.22.4 in `bin/VERSION`)
- Preact - Lightweight React alternative for dashboard UI (^10.25.4 in `templates/project-tracker/package.json`)

**Design & Frontend:**
- Impeccable - Design quality framework (v1.2.0, forked and bundled)
- Motion library (^12.23.26) - Animation framework used by Impeccable
- Tailwind CSS (^4) - Utility-first CSS framework for dashboard styling

**Testing:**
- Playwright (^1.57.0) - E2E testing framework (bundled via Impeccable and separate skill)
- Bun - Build and runtime environment (referenced in Impeccable's build scripts)

**Build/Dev:**
- esbuild (^0.25.0) - JavaScript bundler for project tracker dashboard
- Tailwind CLI (@tailwindcss/cli ^4) - CSS compiler for dashboard styles
- Node.js child_process module - Subprocess execution for build pipeline

## Key Dependencies

**Critical:**
- GSD CLI (`bin/gsd-tools.cjs`) - Central state management, phase operations, roadmap parsing, verification, templating, frontmatter CRUD
- Playwright (^1.57.0) - Browser automation for E2E testing skills
- Motion (^12.23.26) - Animation library for design quality features
- Preact (^10.25.4) - Lightweight UI framework for dashboard

**Infrastructure:**
- Node.js fs/path modules - File system operations across all `.cjs` modules
- Node.js http module - Built-in server for project tracker (no Express/external framework)
- esbuild (^0.25.0) - Build bundling for dashboard assets
- Tailwind CSS (^4) - Compiled CSS framework for dashboard styling

## Configuration

**Environment:**
- `.planning/config.json` - Project configuration (model_profile, search_gitignored, branching_strategy, research, plan_checker, verifier, parallelization)
- Plugin version stored in `.claude-plugin/plugin.json` (currently 1.12.5)
- Marketplace metadata in `.claude-plugin/marketplace.json` (separate version tracking)
- GSD version reference in `bin/VERSION` (currently 1.22.4)

**Build:**
- `templates/project-tracker/build.js` - esbuild configuration for dashboard JS bundling
- `templates/project-tracker/package.json` - Tracker UI dependencies (Preact, esbuild, Tailwind)
- Tailwind configuration embedded in `build.js` with JSX and minification flags

## Platform Requirements

**Development:**
- Node.js (checked in `/fh:setup`)
- npm (checked in `/fh:setup`)
- Git (checked in `/fh:setup`)
- GitHub CLI (`gh` binary, checked in `/fh:setup`)
- TypeScript Language Server (`typescript-language-server` binary, checked in `/fh:setup`)
- Homebrew (for macOS/Linux package management, auto-installed if missing)
- Platform detection: macOS, Linux, Windows support (via `uname`)

**Production:**
- Deployment via Claude Code plugin system
- Plugin installs to `~/.claude/plugins/` directory
- Project tracker server runs on `localhost:3847`
- Requires `.planning/` directory structure in user's project

---

*Stack analysis: 2026-03-12*
