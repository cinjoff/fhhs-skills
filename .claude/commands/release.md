---
description: "Create a new release with version bump, changelog, tag, and GitHub release. Use when the user says 'release', 'new version', 'cut a release', or 'publish'."
---

Create a new fhhs-skills release.

$ARGUMENTS

---

## Step 0: Pre-ship Validation

Run these checks before anything else. If any check fails, STOP and report — do not proceed to Step 1.

### 0a. Branch check

```bash
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  echo "ABORT: You are on main. Release from a feature branch."
  exit 1
fi
echo "Branch: $BRANCH"
```

### 0b. Merge origin/main

Ensure the branch is current with main before validating:

```bash
git fetch origin main && git merge origin/main --no-edit
```

**If there are merge conflicts:** STOP and show the conflicts. Do not proceed until resolved.

### 0c. Run test suite

Auto-detect the test runner and execute:

| Detect                        | Command         |
|-------------------------------|-----------------|
| `package.json` has `test`     | `npm test`      |
| `bun.lockb` exists            | `bun test`      |
| `Cargo.toml` exists           | `cargo test`    |
| `pytest.ini` / `pyproject.toml` with pytest | `pytest` |
| `Makefile` has `test` target  | `make test`     |
| Fallback                      | skip with note  |

**If tests fail:** STOP, show the failures, do not proceed.

### 0d. Quick review

Run `/fh:review --quick` against the current diff (unless the user already ran a review this session).

**If CRITICAL findings:** STOP, show the findings, and suggest fixes. Do not proceed until the user resolves or acknowledges each critical item.

**If only non-critical findings or no findings:** Note them and continue.

> Pre-ship validation and bisectable commits adapted from gstack /ship (v0.3.3).

---

## Step 1: Gather Changes

```bash
cd /Users/konstantin/Documents/github.nosync/fhhs-skills
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
echo "Current tag: $LAST_TAG"
echo "Current plugin.json version: $(python3 -c "import json; print(json.load(open('.claude-plugin/plugin.json'))['version'])")"
echo "Current marketplace.json version: $(python3 -c "import json; print(json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['version'])")"
echo ""
echo "Commits since $LAST_TAG:"
git log "$LAST_TAG"..HEAD --oneline
```

**If no commits since last tag:**
```
No changes since last release. Nothing to do.
```
Exit.

---

## Step 2: Classify and Suggest Version

Read every commit message from Step 1. Classify:
- **major** — breaking changes (removed commands, changed behavior users depend on)
- **minor** — new commands, new skills, new features
- **patch** — bug fixes, internal improvements, documentation

Suggest the appropriate bump based on the highest-severity commit.

Show the user:

```
## Changes since vX.Y.Z

[list each commit as a bullet, grouped by type]

Suggested bump: **patch** → X.Y.(Z+1)
```

```yaml
AskUserQuestion:
  question: "What version bump?"
  header: "Version"
  options:
    - label: "Patch (X.Y.Z+1) (Recommended)"
      description: "Bug fixes and small improvements"
    - label: "Minor (X.Y+1.0)"
      description: "New features, backward compatible"
    - label: "Major (X+1.0.0)"
      description: "Breaking changes"
```

Put the recommended option first.

---

## Step 3: Write Changelog Entry

Generate a changelog entry for the new version by parsing conventional commit messages.

**Parse commits using conventional commit format:**
- Map commit types to changelog sections: `feat` → Added, `fix` → Fixed, `refactor` → Changed, `style` → Changed, `perf` → Changed
- Filter out internal commits (`docs`, `chore`, `test`, `ci`) unless they are user-visible
- Strip the type prefix and scope from each message, then humanize into a clean bullet
- Group related commits (same scope or same feature) into single bullets

**Format:**
```markdown
## [A.B.C] - YYYY-MM-DD

### Added
- **Feature name** — one-line description

### Changed
- **What changed** — one-line description

### Fixed
- **What was fixed** — one-line description

### Removed
- **What was removed** — one-line description
```

**Rules:**
- Only include sections (Added/Changed/Fixed/Removed) that have entries
- Each bullet is one line: bold name, em dash, plain description
- Write for users, not developers — skip internal refactors nobody sees
- Group related commits into single bullets when they're part of the same change
- Use present tense ("adds", not "added")

Show the generated entry and ask:

```yaml
AskUserQuestion:
  question: "Does the changelog look good?"
  header: "Changelog"
  options:
    - label: "Looks good"
      description: "Proceed with release"
    - label: "Edit it"
      description: "I'll adjust the changelog text"
```

**If "Edit it":** Let the user provide corrections, then update.

---

## Step 4: Apply All Version Bumps

Update ALL version sources. There are exactly three files that must agree:

1. `.claude-plugin/plugin.json` — `"version": "A.B.C"`
2. `.claude-plugin/marketplace.json` — `"version": "A.B.C"` (inside the plugins array)
3. `CHANGELOG.md` — prepend the new entry after the file header (before the first `## [` line)

Use the Edit tool to update all three files.

**CRITICAL: Both JSON files MUST have the same version.** This is the #1 source of release bugs.

---

## Step 5: Commit, Tag, Push

### Bisectable commits (optional)

If the branch has mixed changes (infra + features + docs), offer to split into bisectable commits:

```yaml
AskUserQuestion:
  question: "This branch has mixed changes. Split into bisectable commits?"
  header: "Bisectable commits"
  options:
    - label: "Yes — split into logical commits"
      description: "Infrastructure/config → models/services → controllers/views → tests → VERSION+CHANGELOG"
    - label: "No — single release commit"
      description: "Commit everything together"
```

**If "Yes":** Split changes into ordered commits, each independently valid (builds and passes tests):
1. **Infrastructure/config** — migrations, config changes, route additions
2. **Models/services** — new models, services, concerns (with their tests)
3. **Controllers/views** — controllers, views, JS/React components (with their tests)
4. **Tests** — standalone test additions or fixes
5. **VERSION + CHANGELOG** — always last

Each commit message: `<type>: <summary>` (feat/fix/chore/refactor/docs). Only the final VERSION+CHANGELOG commit gets the release tag.

**If "No" or the diff is small (< 50 lines across < 4 files):** Use a single commit as below.

### Commit and push

```bash
cd /Users/konstantin/Documents/github.nosync/fhhs-skills
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md
git commit -m "release: vA.B.C"
git tag vA.B.C
git push && git push --tags
```

---

## Step 6: Create GitHub Release

Extract the changelog entry for this version and enhance with highlight and install sections.

```bash
cd /Users/konstantin/Documents/github.nosync/fhhs-skills
gh release create vA.B.C --title "vA.B.C" --notes "$(cat <<'RELEASE_EOF'
## Highlight

[1-2 sentence summary of the most impactful change in this release]

[changelog entry content here — the ### sections and bullets, not the ## version header]

## Install / Update

```
# First install
claude plugin install fhhs-skills

# Update existing
/fh:update
```
RELEASE_EOF
)"
```

---

## Step 7: Confirm

```
## Released vA.B.C

- plugin.json: A.B.C
- marketplace.json: A.B.C
- CHANGELOG.md: updated
- Git tag: vA.B.C
- GitHub release: created

Users can update with `/fh:update`.
```
