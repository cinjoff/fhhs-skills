# Dependency Check

Run this check before proceeding with any composite command. It verifies that the three required frameworks are available.

## Finding this file

This file lives in the `references/` directory of the fhhs-skills plugin. To find the plugin directory:
```bash
find ~/.claude/plugins -path "*/fhhs-skills/references" -type d 2>/dev/null | head -1
```
Or check sibling to the commands directory that loaded the current skill.

## Detection

Check for each dependency by testing whether its skills are loadable:

| Dependency | Detection | Install |
|------------|-----------|---------|
| **GSD** | `.claude/get-shit-done/` directory exists in the project | See [get-shit-done](https://github.com/pchaganti/gsd) installation docs |
| **Superpowers** | `superpowers-extended-cc:verification-before-completion` appears in available skills list | `/install-plugin superpowers-extended-cc from pcvelz/superpowers` |
| **Impeccable** | `impeccable:critique` appears in available skills list | `/install-plugin impeccable from pbakaus/impeccable` |

## Behavior

- **GSD missing:** All composites require a GSD project. If `.planning/PROJECT.md` is absent, tell the user: "No project found. Run `/new-project` first to set up project tracking." Do not proceed.
- **Superpowers missing:** All composites need Superpowers for TDD, verification, and review. If missing, stop and tell the user to run `/setup` to install it.
- **Impeccable missing:** Only matters for frontend work. If missing and frontend files are involved, skip design gates and note: "Impeccable not installed — skipping design quality gates. Run `/setup` to install it."

## Check Template

At the start of your command, silently verify:
1. Can you see `superpowers-extended-cc:*` skills in the available skills list? If not, stop and direct to `/setup`.
2. Does `.planning/PROJECT.md` exist? If not, direct to `/new-project`.
3. Does the command touch frontend files? If so, check for `impeccable:*` skills. If absent, note the skip.

Do not spend context on verbose dependency reporting. A single line per missing dependency is sufficient.
