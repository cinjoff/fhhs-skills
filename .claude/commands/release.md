---
description: "Create a new release with version bump, changelog, tag, and GitHub release. Use when the user says 'release', 'new version', 'cut a release', or 'publish'."
---

Create a new fhhs-skills release.

$ARGUMENTS

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

Generate a changelog entry for the new version. Follow these rules:

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

```bash
cd /Users/konstantin/Documents/github.nosync/fhhs-skills
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md
git commit -m "release: vA.B.C"
git tag vA.B.C
git push && git push --tags
```

---

## Step 6: Create GitHub Release

Extract ONLY the changelog entry for this version (the `## [A.B.C]` section content, without the version header itself).

```bash
cd /Users/konstantin/Documents/github.nosync/fhhs-skills
gh release create vA.B.C --title "vA.B.C" --notes "$(cat <<'RELEASE_EOF'
[changelog entry content here — the ### sections and bullets, not the ## version header]
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
