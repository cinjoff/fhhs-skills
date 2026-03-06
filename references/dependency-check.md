# Dependency Check

Run this check before proceeding with any composite command.

## Check

The only required check: does `.planning/PROJECT.md` exist?

- **If YES:** Proceed. The project has GSD tracking set up.
- **If NO:** Tell the user: "No project found. Run `/new-project` first to set up project tracking." Do not proceed.

All engineering disciplines (TDD, verification, code review, debugging, brainstorming) and design quality commands (critique, polish, normalize, harden, animate) are built into this plugin. No external plugins to detect or install.

## Frontend Note

Design quality commands (`/critique`, `/polish`, `/normalize`, `/harden`, `/animate`) and the `skills/frontend-design/` skill are available but only relevant for frontend work. Composites auto-detect frontend files (`.tsx`, `.css`, component files) and apply design gates when appropriate.
