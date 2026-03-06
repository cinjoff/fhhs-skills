# Dependency Check

Run this check before proceeding with any composite command. It verifies that the three required frameworks are available.

## Detection

Check for each dependency by testing whether its skills are loadable:

| Dependency | Detection | Install |
|------------|-----------|---------|
| **GSD** | `.claude/get-shit-done/` directory exists in the project | See [get-shit-done](https://github.com/pchaganti/gsd) installation docs |
| **Superpowers** | `superpowers-extended-cc:verification-before-completion` appears in available skills list | `/install-plugin superpowers-extended-cc from pcvelz/superpowers` |
| **Impeccable** | `impeccable:critique` appears in available skills list | `/install-plugin impeccable from pbakaus/impeccable` |

## Behavior

- **GSD missing:** Only matters for commands that need GSD state (all except `/fix` and `/refactor` which work without it). If GSD is required but missing, tell the user: "GSD is not installed. Install it or run without project tracking."
- **Superpowers missing:** All composites need Superpowers for TDD, verification, and review. If missing, stop and tell the user to install it.
- **Impeccable missing:** Only matters for frontend work. If missing and frontend files are involved, skip design gates and note: "Impeccable not installed — skipping design quality gates. Install it for automatic design review."

## Check Template

At the start of your command, silently verify:
1. Can you see `superpowers-extended-cc:*` skills in the available skills list? If not, stop.
2. Does the command need GSD? Check for `.planning/PROJECT.md`. If needed but absent, direct to `/new-project`.
3. Does the command touch frontend files? If so, check for `impeccable:*` skills. If absent, note the skip.

Do not spend context on verbose dependency reporting. A single line per missing dependency is sufficient.
